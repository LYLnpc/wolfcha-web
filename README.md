# 🐺 Wolfcha (猹杀) — 纯前端 AI 狼人杀

一款 **AI 驱动的单人狼人杀**：你是唯一的人类玩家，和 9 个各有性格的 AI 角色同桌博弈。AI 会推理、会发言、会投票，也会撒谎。

> 🌟 **原项目**：[oil-oil/wolfcha](https://github.com/oil-oil/wolfcha)（原作者 [oil-oil](https://github.com/oil-oil)）
> 本仓库是在 [onebai123/wolfcha-web](https://github.com/onebai123/wolfcha-web) 纯前端版基础上复刻的版本，遵循 [MIT License](https://opensource.org/licenses/MIT)。向原作者致敬 🙏

---

## 🌐 在线游玩

已部署，直接打开即可玩：

```
https://lylnpc.github.io/wolfcha-web/
```

打开网页 → 点「API 配置」→ 填入自己的 API Key → 开始游戏。
**Key 只存在你自己浏览器的 localStorage 里，不会上传到任何服务器。**

---

## ✨ 本版本改动

| 改动 | 说明 |
|------|------|
| 🔄 **模型自动获取** | 「模型」不再是写死的下拉列表。填入 API Key 后自动请求服务商 `/v1/models`，拉取真实可用模型，支持搜索、刷新、手动填写，并缓存到本地 |
| 🧩 **服务商扩充** | 内置 DeepSeek、硅基流动、OpenAI、月之暗面、阿里云百炼、本地 Ollama，以及任意 OpenAI 兼容自定义接口 |
| 🔊 **修复旁白音频** | 原路径指向不存在的 `/audio/narrator/zh/`，导致旁白永远不播放，已修正 |
| 🖼️ **修复平民立绘** | 原代码引用不存在的 `/职业/平民.png`，已修正 |
| 📦 **静态导出** | 改为 `output: "export"`，产物是纯静态文件，可托管在任意静态服务上 |

其它与原版一致：纯前端架构、浏览器存储、开箱即玩、多端适配。

---

## 🔑 模型自动获取怎么用

1. 选择 **API 服务商**（下拉里选，或用「自定义」填任意 OpenAI 兼容地址）
2. 填入 **API Key**
3. **模型**那一栏会自动请求 `GET <baseUrl>/models`：
   - 拉到列表 → 点右侧箭头展开，可搜索、可点选
   - 想重新拉 → 点「刷新模型」
   - 拉不到（跨域/无权限）→ **直接在输入框手打模型名**即可，不影响使用
4. 点「保存 API 配置」

地址是自动推导的，无需手填 `/models`：

| 你填的地址 | 自动请求的地址 |
|-----------|--------------|
| `https://api.deepseek.com/v1/chat/completions` | `https://api.deepseek.com/v1/models` |
| `https://api.openai.com/v1/chat/completions` | `https://api.openai.com/v1/models` |

> ⚠️ 少数服务商不返回 CORS 头，浏览器会拦下 `/models` 请求。此时按提示手动填模型名即可，游戏功能不受影响。

---

## 🚀 部署

### 方式一：GitHub Pages（已配置好，开箱即用）

**已经部署完成，直接访问：**

```
https://lylnpc.github.io/wolfcha-web/
```

仓库内已包含 `.github/workflows/deploy-pages.yml`：每次 `git push` 到 `main`，会自动构建静态文件并发布到 `gh-pages` 分支，Pages 从该分支托管（约 2-3 分钟生效）。

> 想换成自己的账号：fork 本仓库 → Settings → Pages → Source 选 `gh-pages` 分支 → Actions 里手动跑一次 workflow。
> 改了仓库名的话，工作流里的 `BASH_PREFIX` 会自动取新仓库名，无需手动改。

### 方式二：Vercel（体验更好）

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/LYLnpc/wolfcha-web)

点按钮 → 登录 Vercel → 直接 Deploy（框架会被自动识别为 Next.js）。
Vercel 部署在根路径，**不需要**设置 `BASH_PREFIX`。之后每次 push 自动更新。

---

## 💻 本地运行

需要 Node.js >= 18：

```bash
pnpm install     # 或用 npm install / yarn
pnpm dev         # http://localhost:3000
```

生产构建：

```bash
pnpm build                 # 根路径构建（Vercel / 本地）
BASH_PREFIX=/wolfcha-web pnpm build   # 子路径构建（GitHub Pages）
```

构建产物是纯静态文件，在 `out/` 目录，可直接丢到任意静态托管。

---

## 🔑 支持的 AI 服务商

任意 **OpenAI 兼容接口** 都可以用：

| 服务商 | 推荐模型 |
|-------|---------|
| **DeepSeek** | `deepseek-chat`、`deepseek-reasoner` |
| **硅基流动** | `deepseek-ai/DeepSeek-V3` |
| **OpenAI** | `gpt-4o`、`gpt-4o-mini` |
| **月之暗面** | `moonshot-v1-8k` |
| **阿里云百炼** | `qwen-plus`、`qwen-max` |
| **本地 Ollama** | `qwen2.5:7b`、`llama3` |
| **自定义** | 任意 OpenAI 格式接口 |

> TTS（角色配音）为可选项，用 MiniMax，在 API 配置里单独开。

---

## ❓ 常见问题

**Q：AI 不说话 / 报错？**
A：检查「API 配置」里的 Key、服务商、模型名三项。模型名建议用「自动获取」拉出来的。

**Q：模型列表拉不出来？**
A：手动填模型名即可。常见原因是服务商没开 CORS，浏览器直接拦截了 `/models` 请求。

**Q：怎么换模型？**
A：点「API 配置」，改完保存，刷新页面生效。

**Q：我的 API Key 安全吗？**
A：Key 只存在浏览器 localStorage，只从你的浏览器直接发往你选的服务商，本项目没有任何后端。

---

## 🏗️ 技术栈

Next.js 16 + React 19 + TypeScript + Tailwind CSS 4 + Jotai

```
用户浏览器
  ├── 游戏界面 (React)
  ├── API 配置 (localStorage)  ← 你填的 Key / Base URL / 模型
  └── 直接调用 AI 服务商 API
```

---

## 📄 License

[MIT](LICENSE)
