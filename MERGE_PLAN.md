# 合并计划：wolfcha-main → wolfcha-web

## 概述

- **源项目**: wolfcha-main (github.com/oil-oil/wolfcha) — 348 次提交
- **目标项目**: wolfcha-web — 分支 `20260604`
- **wolfcha-web 基线日期**: 2026-02-03
- **原项目新增提交**: 105 次（2026-02-04 ~ 2026-06-03）
- **排除**: 商业化功能、登录/认证功能
- **API 测试**: https://vg.v1api.cc (key: sk-mAyiY7ubrtUjzu1LKFeqO4V2r36IVDEQxTmmpp57Ed7fawaH)

---

## 排除清单（不合并）

### 商业化相关
| 提交 | 说明 |
|------|------|
| `a87747f` | fix(credits): disable daily and signup grants |
| `6e3f626` | 调整每日赠送额度 |
| `37ef1e9` | 每日登录奖励次数由1变为3 |
| `830c246` | fix: remove automatic payment methods from Stripe |
| `14b5658` | feat: enable daily bonus feature in welfare |
| `bc651b4` | feat: enable automatic payment methods in Stripe |
| `6116d5e` | 修改定价 |
| `f519081` | 新增店铺购买链接、兑换码兑换机制 |
| `74354ef` | feat: add spring quota campaign flow and festive UX |
| `39e1c58` | feat: add low credit warning modal |
| `f3389c2` | feat: add welfare feature toggles |

### 登录/认证相关
| 提交 | 说明 |
|------|------|
| `29fece6` | fix(auth): allow recent game sessions after credit spend |
| `5e41972` | feat(auth): add watcha oauth flow |
| `a8b63f2` | 新增游客免登录功能 |
| `b35109e` | refactor: update UserProfileModal API call |

### 赞助商/二维码/文档
| 提交 | 说明 |
|------|------|
| `555969d` `125a934` `eada902` `fff6647` `1e0ccaa` `d5133e8` `8dcfe84` `45b4754` `8f3b372` `48d1822` `2e21166` `ab6805a` | 更新二维码/入群图片 |
| `c92b57b` `7463832` `1fc4a28` `fa8ae15` `55c45c9` `40e75f3` `b429cbd` | sponsor/TokenDance 相关 |

---

## 合并任务列表

### 任务 1: 白狼王 & 白痴角色
**优先级**: 高  
**相关提交**: `cd43ee9` `4cfe79f` `980e1d4` `1f5277e`  
**涉及文件**:
- `src/game/phases/WhiteWolfKingBoomPhase.ts` (新增)
- `src/components/game/RoleRevealHistoryCard.tsx` (新增)
- `src/types/game.ts` — 新增角色类型
- `src/store/game-machine.ts` — 新增角色状态
- `src/game/phases/VotePhase.ts` — 白痴投票逻辑
- `src/game/phases/NightPhase.ts` — 白狼王夜间自爆
- `src/hooks/useGameLogic.ts` — 角色初始化
- `src/lib/game-master.ts` — 角色分配逻辑
- `src/lib/prompt-utils.ts` — 角色 prompt

### 任务 2: AI/LLM JSON 解析加固
**优先级**: 高  
**相关提交**: `a70ac56` `9f0e713` `587d475` `fd4501d`  
**涉及文件**:
- `src/lib/game-master.ts` — AI action JSON 解析
- `src/lib/llm-json.ts` (新增) — JSON 修复工具
- `src/game/phases/VotePhase.ts` — 投票 JSON 处理

### 任务 3: AI Prompt 优化
**优先级**: 高  
**相关提交**: `ce76a36` `0e99305` `c2f362f` `303eb13` `0e154d9` `60df13a` `def9248` `bafb075`  
**涉及文件**:
- `src/lib/prompt-utils.ts` — perspective hints, anti-hedging, wolf target history
- `src/game/phases/NightPhase.ts` — 夜间上下文增强
- `src/game/phases/DaySpeechPhase.ts` — dayBreak matching 修复
- `src/lib/game-master.ts` — hunter death cause 明确化

### 任务 4: TTS 修复
**优先级**: 中  
**相关提交**: `5c2ace8` `f63e959` `5bc7093`  
**涉及文件**:
- `src/lib/narrator-audio-player.ts` — 去重 TTS 请求, 播放顺序修复
- `src/lib/narrator-voice.ts` — AI voice 默认开启
- `src/hooks/useNarratorVoice.ts` — minimax 恢复

### 任务 5: 流式对话空格修复
**优先级**: 中  
**相关提交**: `fe45ff0`  
**涉及文件**:
- `src/lib/streaming-speech-parser.ts` — 英文对话空格保留

### 任务 6: 退出游戏功能
**优先级**: 中  
**相关提交**: `0892a5e` `674707c` `0dbaeb8`  
**涉及文件**:
- `src/hooks/useGameLogic.ts` — exit game & checkpoint resume
- `src/store/game-machine.ts` — DAY_LAST_WORDS phase 恢复

### 任务 7: 游戏逻辑 Bug 修复
**优先级**: 高  
**相关提交**: `8f34534` `684fc3b` `7b5c30f` `cad8b52` `ad6f226` `b2700dd`  
**涉及文件**:
- `src/hooks/useGameLogic.ts` — 安全漏洞修复, voting/night 状态管理
- `src/game/phases/NightPhase.ts` — guard focus_angle 保护
- `src/lib/game-flow-controller.ts` — auto-reset preferred role
- `src/components/game/VoteResultCard.tsx` — 投票历史追踪

### 任务 8: 模型配置更新
**优先级**: 中  
**相关提交**: `7cb6578` `95c4e92` `da70e20` `b7667ca` `f517d91` `7c5cd8b` `3ab34e1` `b443f01` `435f5d1` `ba875ec` `bd54a19` `e79a557` `826f2b9`  
**涉及文件**:
- `src/lib/ai-config.ts` — 默认模型切换
- `src/lib/llm.ts` — tokendance provider, think blocks strip, DeepSeek 缓存
- `src/lib/api-keys.ts` — 模型注册
- `src/lib/character-generator.ts` — Gemini Flash Lite

### 任务 9: 游戏分析/复盘系统
**优先级**: 低（可选）  
**相关提交**: `43f9b52` `9aadda7` `b4caeb1`  
**涉及文件**:
- `src/components/analysis/*` (新增目录)
- `src/hooks/useGameAnalysis.ts` (新增)
- `src/lib/game-analysis.ts` (新增)
- `src/types/analysis.ts` (新增)

### 任务 10: 其他 UI/DX 改进
**优先级**: 低  
**相关提交**: 各散落提交  
**涉及文件**:
- `src/components/game/GameSetupModal.tsx` — 角色选择优化
- `src/components/game/DialogArea.tsx` — UI 改进
- `src/components/game/WelcomeScreen.tsx` — 界面重构
- `src/components/ui/dropdown-menu.tsx` (新增)

---

## 执行顺序

1. ✅ 创建分支 `20260604`
2. ✅ 任务 2: AI/LLM JSON 解析加固（llm-json.ts + parseLLMJson）
3. ✅ 任务 3: AI Prompt 优化（perspectiveHint、wolfTargetHistory、deathCause）
4. ✅ 任务 1: 白狼王 & 白痴角色（WhiteWolfKingBoomPhase + 自爆逻辑 + 白痴免死 + RoleRevealHistoryCard）
5. ✅ 任务 7: 游戏逻辑 Bug 修复（preferredRole 已合并到 setupPlayers）
6. ✅ 任务 5: 流式对话空格修复（文件已确认与 main 完全一致，无差异）
7. ⚠️ 任务 4: TTS 修复（基础架构已有，缺去重 & 播放顺序修复增量 —— 用户明确排除）
8. ✅ 任务 6: 退出游戏功能（localStorage 持久化 + 断点恢复）
9. ✅ 任务 8: 模型配置更新（think strip + extractPromptCacheUsage + getReviewModel）
10. ✅ 任务 9: 游戏分析/复盘系统（types + lib + hooks + 13个组件全部合并）
11. ✅ 任务 10: 其他 UI/DX 改进（dropdown-menu 组件 + radix-ui 依赖）
12. ✅ 编译验证（tsc --noEmit 零错误）
13. ✅ 功能测试（完整一局游戏验证通过）

---

## 已知差异（后续 TODO）

以下为 wolfcha-main 中有但 wolfcha-web 当前未合并的增量功能，不影响核心游戏流程：

| 项目 | 所属任务 | 说明 |
|------|----------|------|
| TTS 请求去重 & 播放顺序修复 | 任务 4 | wolfcha-main 在 narrator-audio-player 中有队列去重（用户明确排除） |
| tokendance provider | 任务 8 | LLM provider 扩展（wolfcha-web 用统一的 api-config 替代） |
| WelcomeScreen 界面重构 | 任务 10 | 仅样式调整，非功能性差异 |

---

## 测试计划

使用 API: `https://vg.v1api.cc` / Key: `sk-mAyiY7ubrtUjzu1LKFeqO4V2r36IVDEQxTmmpp57Ed7fawaH`

1. 启动游戏 — 验证基础流程
2. 白狼王角色 — 验证自爆机制
3. 白痴角色 — 验证投票免死
4. AI 对话 — 验证 JSON 解析稳定性
5. TTS 播放 — 验证语音去重和顺序
6. 退出/恢复游戏 — 验证 checkpoint
7. 投票流程 — 验证结果卡片
