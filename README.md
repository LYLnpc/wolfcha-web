# Wolfcha (猹杀) - AI 狼人杀 Web 版

## 这是什么

**Wolfcha (猹杀)** 是一款 AI 驱动的单人狼人杀游戏。你作为唯一的人类玩家，与 9 个 AI 角色进行一局完整的对局；每个 AI 有独特性格，会推理、发言、投票，也会撒谎。

> 原项目：[oil-oil/wolfcha](https://github.com/oil-oil/wolfcha)，作者 [oil-oil](https://github.com/oil-oil)，遵循 [MIT License](https://opensource.org/licenses/MIT)。本仓库基于其二次开发版本制作，向原作者致谢。

---

## 本版本特点

| 特点 | 说明 |
|------|------|
| 浏览器直连 API | 无需自建后端，API Key 保存在浏览器 localStorage |
| 模型自动获取 | 填好 Base URL 与 API Key 后自动拉取 `/models` 列表，无需手填模型名 |
| 开箱即玩 | 无需注册账号，打开网页配置 Key 即可开始 |
| 自定义 API | 支持任意 OpenAI 兼容接口（DeepSeek、硅基流动、OpenAI、中转站、本地 Ollama 等） |
| 多端适配 | 电脑、平板、手机均可游玩 |
| 可选账号体系 | Supabase 为可选项，不配置也能正常开局 |

技术栈：Next.js 16 + React 19 + TypeScript + Tailwind CSS + Jotai。

---

## 一键部署（Vercel，推荐）

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/LYLnpc/wolfcha-web)

1. 点击按钮，登录 Vercel，Import 本仓库，直接 Deploy。
2. 打开生成的网址，点击「API 配置」填入 API Key 即可开局。

部署无需配置任何环境变量；Supabase 相关变量（`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`）是可选的，不填时登录、积分、自定义角色功能会自动停用，核心游戏不受影响。

> 注意：本项目是 Next.js 应用，需要 Node 运行时，不能直接用 GitHub Pages 托管静态文件。`next.config.ts` 中 `output: "standalone"` 只用于自托管 / Docker，在 Vercel 环境下会自动关闭。

---

## 模型自动获取

在「API 配置」中填好 API 服务商 / Base URL / API Key 后，页面会自动请求该服务商的模型列表接口，把返回的模型 ID 填进下拉框，无需再手动查文档抄模型名。

工作流程：

1. 由 `https://xxx/v1/chat/completions` 自动推导候选端点 `https://xxx/v1/models`，并兼容不带 `/v1` 的 `https://xxx/models` 风格（两种都会尝试）。
2. **优先浏览器直连**：API Key 只发给服务商，不经过本站服务器。
3. 若服务商不允许跨域（CORS）导致直连失败，自动回退到本站 `/api/models` 服务端代理。此时界面会标注「代理获取」并明确提示 Key 会经过部署服务器，介意时可改用允许跨域的服务商或直接手动输入模型名。
4. 成功结果缓存 24 小时；支持搜索、手动刷新、手动输入任意模型名。
5. 全部失败时回退内置模型预设，功能不受影响。

代理接口的安全限制：仅允许公网 HTTPS 且路径以 `/models` 结尾的端点，禁止 `localhost`、内网网段、云元数据地址与 URL 内嵌凭据，最多尝试 4 个候选端点，8 秒超时；API Key 不会写入日志或响应体。

---

## 支持的 AI 服务商

任意 OpenAI 兼容接口，常见预设如下（模型列表以接口实际返回为准）：

| 服务商 | Base URL 示例 |
|-------|--------------|
| WeApis | `https://vg.v1api.cc/v1/chat/completions` |
| DeepSeek 官方 | `https://api.deepseek.com/v1/chat/completions` |
| 硅基流动 | `https://api.siliconflow.cn/v1/chat/completions` |
| OpenAI 官方 | `https://api.openai.com/v1/chat/completions` |
| 自定义 / 中转站 | 任意 OpenAI 格式接口 |
| 本地 Ollama | 其 OpenAI 兼容端点（浏览器直连即可） |

---

## 本地运行

需要 Node.js >= 20.9（推荐 22 LTS）。

```bash
yarn install   # 或 npm install
yarn dev       # 或 npm run dev
```

Windows 下也可双击 `start.bat`。打开 `http://localhost:3000`，点击「API 配置」填写 API Key；模型列表会自动填充，选择后保存即可开始游戏。

构建生产版本：`yarn build && yarn start`。

---

## 常见问题

**Q：游戏中 AI 不说话 / 报错？**
A：检查 API Key 是否正确、服务商是否匹配、所选模型是否在当前接口返回的列表中（可点「刷新」重新拉取）。

**Q：模型下拉是空的 / 显示「内置预设」？**
A：说明自动获取失败。多数是服务商禁止跨域或 `/models` 路径不同；可点「刷新」重试，或直接在「自定义」里手填模型名。

**Q：如何更换 AI 模型？**
A：打开「API 配置」→ 「模型（自动获取）」下拉选择，或搜索后选择；保存即可，无需重启。

**Q：担心 API Key 经过服务器？**
A：正常情况走浏览器直连。只有直连被 CORS 拦截时才会走代理，界面会明确标注。使用允许跨域的服务商可完全避免。

---

## 架构说明

```
浏览器
  ├── 游戏界面 (React / Jotai)
  ├── API 配置 (localStorage 保存 Key、模型列表缓存)
  └── 直连 AI 服务商 /chat/completions
        │
        └── 直连 /models 失败时 → 本站 /api/models 代理 → 服务商 /models
```

账号、积分、自定义角色等可选能力依赖 Supabase；未配置环境变量时使用占位客户端，相关功能自动跳过。

---

## License

沿用原项目 [MIT License](./LICENSE)，并保留原作者 [oil-oil](https://github.com/oil-oil) 的版权声明。
