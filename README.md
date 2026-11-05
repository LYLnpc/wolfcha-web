# Wolfcha (猹杀) - AI 狼人杀 Web 版

## 这是什么

**Wolfcha (猹杀)** 是一款 AI 驱动的单人狼人杀游戏。你作为唯一的人类玩家，与 9 个 AI 角色进行一局完整的对局；每个 AI 有独特性格，会推理、发言、投票，也会撒谎。

> 原项目：[oil-oil/wolfcha](https://github.com/oil-oil/wolfcha)，作者 [oil-oil](https://github.com/oil-oil)，遵循 [MIT License](https://opensource.org/licenses/MIT)。本仓库基于其二次开发版本制作，向原作者致谢。

**在线地址：<https://lylnpc.github.io/wolfcha-web/>**

---

## 本版本特点

| 特点 | 说明 |
|------|------|
| 纯 GitHub Pages 托管 | 静态导出，不需要 Vercel / 服务器 / 数据库，也不需要注册额外账号 |
| 浏览器直连 API | 无需自建后端，API Key 只保存在浏览器 localStorage |
| 模型自动获取 | 填好 Base URL 与 API Key 后自动拉取 `/models` 列表，无需手填模型名 |
| `auto` 兜底 | 预设首项为 `auto`，支持智能路由的服务商会自动挑模型，列表拉不到也能直接开玩 |
| 开箱即玩 | 无需注册账号，打开网页配置 Key 即可开始 |
| 自定义 API | 支持任意 OpenAI 兼容接口（DeepSeek、硅基流动、OpenAI、中转站、本地 Ollama 等） |
| 多端适配 | 电脑、平板、手机均可游玩 |
| 可选账号体系 | Supabase 为可选项，不配置也能正常开局 |

技术栈：Next.js 16 + React 19 + TypeScript + Tailwind CSS + Jotai。

---

## 自动部署

`.github/workflows/deploy-pages.yml` 会在 **push 到 `main` 时自动执行**：

1. `pnpm install --no-frozen-lockfile` 安装依赖。**必须用 pnpm**：仓库的 `pnpm-lock.yaml` 记录了全平台原生二进制；`package-lock.json` 是在 Windows 上生成的，只含 win32 包，Linux runner 上会缺 `lightningcss.linux-x64-gnu.node`，导致 Tailwind CSS 编译失败。上游 lock 与 `package.json` 的依赖声明不完全一致，所以不能用 `--frozen-lockfile`。
2. 注入 `PAGES_BASE_PATH=/wolfcha-web` 后执行 `pnpm run build`，产出静态目录 `out/`；
3. 写入 `out/.nojekyll`（否则 GitHub Pages 的 Jekyll 会忽略 `_next` 目录）；
4. 用 `peaceiris/actions-gh-pages` 把 `out/` 推到 `gh-pages` 分支。

本仓库 Pages 为 **legacy 模式**，来源设置为 `gh-pages` 分支根目录。也可以在 Actions 页面手动 `Run workflow` 触发一次。部署无需配置任何环境变量或密钥，`GITHUB_TOKEN` 由 Actions 自动提供。

> Supabase 相关变量（`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`）是可选的，不填时登录、积分、自定义角色功能自动停用，核心游戏不受影响。

---

## 模型自动获取（纯前端直连）

在「API 配置」中填好 API 服务商 / Base URL / API Key 后，页面会自动请求该服务商的模型列表接口，把返回的模型 ID 填进下拉框。

工作流程：

1. 由 `https://xxx/v1/chat/completions` 自动推导候选端点 `https://xxx/v1/models`，并兼容不带 `/v1` 的 `https://xxx/models` 风格（两种都会尝试）。
2. **浏览器直连**：API Key 只发给服务商，不经过 GitHub Pages 或任何第三方服务器。
3. 成功结果缓存 24 小时；支持搜索、手动刷新、手动输入任意模型名。
4. 全部失败时回退内置模型预设（首项 `auto`），游戏功能不受影响。

⚠️ **纯静态站点没有服务端代理**，所以这一步完全取决于服务商是否允许浏览器跨域（CORS）。若对方未返回 `Access-Control-Allow-Origin`，自动获取会失败 —— 此时：

- 若服务商支持智能路由（例如小力孩AI 的 `model="auto"`），直接选 **`auto`** 即可，完全不用列模型；
- 否则在「自定义」里手填一个模型名（如 `deepseek-chat`）。

**无论哪种情况，游戏本身的 `/chat/completions` 调用不受影响** —— 浏览器直连 AI 接口是另一回事，跨域策略由服务商决定，和模型列表能否刷新无关。

---

## 支持的 AI 服务商

任意 OpenAI 兼容接口，常见预设如下（模型列表以接口实际返回为准）：

| 服务商 | Base URL 示例 |
|-------|--------------|
| WeApis | `https://vg.v1api.cc/v1/chat/completions` |
| DeepSeek 官方 | `https://api.deepseek.com/v1/chat/completions` |
| 硅基流动 | `https://api.siliconflow.cn/v1/chat/completions` |
| OpenAI 官方 | `https://api.openai.com/v1/chat/completions` |
| 小力孩AI | `https://www.ygxnhzy.cn/v1/chat/completions`（可选 `auto`） |
| 自定义 / 中转站 | 任意 OpenAI 格式接口 |
| 本地 Ollama | 其 OpenAI 兼容端点（浏览器直连即可） |

---

## 本地运行

需要 Node.js >= 20.9（推荐 22 LTS）。

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`，点击「API 配置」填写 API Key；模型列表会自动填充，选择后保存即可开始游戏。

构建静态版本：

```bash
npm run build          # 产出 out/
npx serve out          # 本地预览静态产物
```

若要模拟 GitHub Pages 的子路径，构建前设置 `PAGES_BASE_PATH=/wolfcha-web`（Windows Git Bash 下需加 `MSYS_NO_PATHCONV=1`，避免 `/xxx` 被转换成盘符路径）。

> `output: "export"` 是静态导出，**不能用 `next start`**（那是 Node 服务器命令）。

---

## 常见问题

**Q：游戏中 AI 不说话 / 报错？**
A：检查 API Key 是否正确、服务商是否匹配、所选模型是否可用（可点「刷新」重新拉取，或直接选 `auto`）。

**Q：模型下拉显示「内置预设」/ 提示获取失败？**
A：服务商不允许跨域或 `/models` 路径不同。点「刷新」重试，或直接选 `auto` / 在「自定义」里手填模型名。

**Q：API Key 会上传到哪里？**
A：只保存在你自己浏览器的 localStorage，请求直接发给你填的 API 服务商。GitHub Pages 只托管静态文件，没有服务端，拿不到你的 Key。

**Q：改了代码但线上没变？**
A：看仓库 Actions 页最新一次 `Deploy to GitHub Pages` 是否成功；Pages 有缓存，可强刷（Ctrl+F5）。

---

## 架构说明

```
浏览器
  ├── 游戏界面 (React / Jotai)
  ├── API 配置 (localStorage 保存 Key、模型列表缓存)
  └── 直连 AI 服务商 /chat/completions 与 /models
        （GitHub Pages 只提供静态文件，不参与请求转发）
```

账号、积分、自定义角色等可选能力依赖 Supabase；未配置环境变量时使用占位客户端，相关功能自动跳过。

---

## License

沿用原项目 [MIT License](./LICENSE)，并保留原作者 [oil-oil](https://github.com/oil-oil) 的版权声明。
