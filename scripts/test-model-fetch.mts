// 用真实源码 fetchAvailableModels 去打本地伪服务器，验证解析各种 /models 返回结构
import http from "node:http";
import { fetchAvailableModels, deriveModelsUrl, resolveModelsUrl } from "../src/lib/api-config.ts";

// 伪服务端：路径 -> /models 的返回体
const payloads = {
  "/openai/v1/models": { object: "list", data: [{ id: "gpt-4o" }, { id: "gpt-4o-mini" }] },
  "/sf/v1/models": { object: "list", data: [{ id: "deepseek-ai/DeepSeek-V3" }, { id: "Qwen/Qwen2.5-7B" }] },
  "/ollama/v1/models": { object: "list", data: [{ id: "qwen2.5:7b", owned_by: "library" }] },
  "/modelsarr/v1/models": { models: ["deepseek-chat", "deepseek-reasoner"] },
  "/nested/v1/models": { result: { data: [{ name: "claude-sonnet-4-5" }] } },
  "/items/v1/models": { items: [{ model: "qwen-plus" }] },
  "/bare/v1/models": [{ id: "gpt-5.2" }],
  "/empty/v1/models": { object: "list" },
  "/strlist/v1/models": { data: ["plain-model-a", "plain-model-b"] },
};

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "authorization,content-type,accept");
  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }
  const body = payloads[req.url];
  if (!body) { res.writeHead(404); return res.end("nope"); }
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
});

await new Promise((r) => server.listen(0, "127.0.0.1", r));
const port = server.address().port;
const base = `http://127.0.0.1:${port}`;

// 测试用例的前缀与期望结果
const expectations = {
  "/openai": ["gpt-4o", "gpt-4o-mini"],
  "/sf": ["Qwen/Qwen2.5-7B", "deepseek-ai/DeepSeek-V3"],
  "/ollama": ["qwen2.5:7b"],
  "/modelsarr": ["deepseek-chat", "deepseek-reasoner"],
  "/nested": ["claude-sonnet-4-5"],
  "/items": ["qwen-plus"],
  "/bare": ["gpt-5.2"],
  "/strlist": ["plain-model-a", "plain-model-b"],
};

let pass = 0, fail = 0;
const check = (name, cond, extra = "") => {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}${extra ? `\n${extra}` : ""}`); }
};

for (const [prefix, expected] of Object.entries(expectations)) {
  const chatUrl = `${base}${prefix}/v1/chat/completions`;
  try {
    const r = await fetchAvailableModels("custom", chatUrl, "sk-test");
    // 与实现一致地排序后再比较
    const sorted = [...expected].sort((a, b) => a.localeCompare(b));
    const ok = JSON.stringify(r.models) === JSON.stringify(sorted);
    check(`${prefix} 解析`, ok, `    expected ${JSON.stringify(sorted)} got ${JSON.stringify(r.models)}`);
  } catch (e) {
    check(`${prefix} 解析`, false, `    threw: ${e.message}`);
  }
}

// 空列表必须抛错（让 UI 提示用户手填）
try {
  await fetchAvailableModels("custom", `${base}/empty/v1/chat/completions`, "sk-test");
  check("空列表报错", false, "    期望抛错，实际成功");
} catch (e) {
  check("空列表报错", /未返回/.test(e.message), `    msg=${e.message}`);
}

// 无 key 也应能请求
try {
  const r = await fetchAvailableModels("custom", `${base}/openai/v1/chat/completions`, "");
  check("无 key 可请求", r.models.length === 2);
} catch (e) {
  check("无 key 可请求", false, `    threw: ${e.message}`);
}

// HTTP 错误要带状态码
try {
  await fetchAvailableModels("custom", `${base}/missing/v1/chat/completions`, "sk-test");
  check("HTTP 错误可见", false, "    期望抛错");
} catch (e) {
  check("HTTP 错误可见", /404/.test(e.message), `    msg=${e.message}`);
}

// 预设服务商用声明的 modelsUrl；自定义按 baseUrl 推导
check("deepseek 用声明地址",
  resolveModelsUrl("deepseek", "https://api.deepseek.com/v1/chat/completions") === "https://api.deepseek.com/v1/models",
  `    got ${resolveModelsUrl("deepseek", "https://api.deepseek.com/v1/chat/completions")}`);
check("custom 按 baseUrl 推导",
  deriveModelsUrl("https://foo.com/v1/chat/completions") === "https://foo.com/v1/models");
check("已带 /models 不重复拼接",
  deriveModelsUrl("https://foo.com/v1/models") === "https://foo.com/v1/models");
check("裸 base 拼 /models",
  deriveModelsUrl("https://foo.com/v1") === "https://foo.com/v1/models");

server.close();
console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
