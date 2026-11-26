# Project conventions

hzCubing 是魔方社区成绩系统。React 与 Vite 构建静态资源，Hono Worker 承担业务 API，通过绑定读写 D1 和 R2。VPS2 的 Node 服务只负责 bcrypt 运算。

- 先看任务、代码、`docs/project.md`、`docs/architecture.md`、`docs/roadmap.md`、`docs/api.md` 和 README。以代码为准，及时同步文档。
- 保持最小可验的变更。前端走同域 API，校验、鉴权及业务规则由 Worker 承担。共享 UI 优先使用 coss ui 与 Lucide。历史用户编号、成绩原值和项目编码是迁移验收依据。
- 单独提交 schema、迁移工具、密码服务、业务和 UI。`server/` 及旧前端代码暂作为切换前行为基线。
- 使用 Workers Free、D1 和 R2 Standard。日志只写安全的状态、耗时与诊断信息。真实快照、凭据和导出结果放在受控目录，不进入 Git。
- 生产数据导入、推送、域名切换、停旧服务、破坏性操作前说明影响并确认。VPS2 连接资料在 `C:/Users/31691/huizhiL/document/MD-note/Codex/服务器连接信息.md`。
- 用户明确要求时再用浏览器自动化或截图。UI 改动检查移动端与桌面端 CSS 边界。
