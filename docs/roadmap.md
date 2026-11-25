# 路线图

更新时间：2026-11-25

## Cloudflare 迁移与全站重构方案

方案已确认。新版整站部署到 Cloudflare Workers Free，业务数据进 D1，头像进 R2，VPS2 只承担 HZCubing 的密码校验和哈希生成。以一次切换交付新版，用户沿用原账号和密码，切换时重新登录。

### 生产现状

- Cloudflare Pages 项目 `hzcubing` 绑定 `hzcubing.fun` 和 `hzcubing.pages.dev`，关联 GitHub `huizhiLLL/hzcubing` 的 `main`。生产自动部署已开启，预览分支匹配 `*`。构建命令为 `npm run build`，产物目录为 `dist`。当前生产部署提交为 `552683c`，部署于 2026 年 6 月 28 日。以上由 Cloudflare Pages 项目配置核实。
- 前端当前调用 `api.hzcubing.fun`，经 Cloudflare 和 VPS2 上的 OpenResty 到 PM2 的 `hzcubing-api`。MongoDB 7 运行在 `hzcubing-mongo` 容器中，服务端提交也是 `552683c`。VPS2 还运行 AstrBot、NapCat 等独立服务。
- 2026 年 11 月 25 日盘点有 32 个账号、734 条成绩、34 个整活项目、10 张 Base64 头像，19 个账号绑定 QQ。全部 32 个密码哈希为 bcrypt cost 10。切换时以冻结后的最终快照为准。
- Workers Free 实测的 105 个请求全部通过，CPU 用时 P50 约 94 ms，P99 约 217 ms，高于 Free 的 10 ms 标准限额。VPS2 的密码服务已通过本地与临时 HTTPS 调用测试。生产密码域名仍需 DNS 绑定。现有 Cloudflare 账号已可列出 R2 桶。按 Workers Free、D1 Free 和 R2 Standard 免费用量规划，监控账号内其他项目的合计用量。

### 仓库与开发目录

沿用现有 GitHub 仓库和提交历史。实施时先同步 `origin/main`，以包含 `552683c` 的最新提交为基线，创建 `codex/cloudflare-migration` 分支，并在仓库旁的 `hzcubing-cf` worktree 开发。实施分支完成后合入 `main`，生产 Worker 从合并后的提交构建。

原仓库集中保留代码历史、issue、GitHub 权限和现有 Cloudflare 关联。独立 worktree 提供干净的开发目录，适合替换前端、API 和数据层。新建 GitHub 仓库需要重新配置协作权限和仓库绑定，只有项目准备拆成独立产品时才值得采用。

Pages 当前会尝试为所有远端分支构建预览。第一次推送重构分支前，从 Pages 预览分支配置中排除该分支。分支验收使用独立的测试 Worker、D1 和 R2。正式切换前关闭旧 Pages 的生产自动部署，迁移期间统一由 Wrangler 执行新版部署。

### 目标架构与首发范围

| 部署位置 | 负责的功能 |
| --- | --- |
| Workers Static Assets | Vue 3、Vite、TypeScript 和 Vue Router。保留 Vue 生态，重新组织页面、组件和路由。SPA 深链接返回 `index.html`。 |
| Hono Worker | 同域 `/api/*`、会话、账号与权限、成绩、榜单、GR、整活项目、QQ 接口、头像访问。`/api/*` 和 `/media/*` 优先进入 Worker。 |
| D1 | 用户、项目、成绩和会话。用 SQL 做榜单、个人最佳、GR 和首页统计，按项目、用户、时间建立必要索引。 |
| R2 Standard | 私有头像对象。Worker 校验上传类型和大小，通过 `/media/*` 提供图片，D1 保存对象键。 |
| VPS2 | 无状态 Node 密码服务，使用现有 `bcryptjs` 算法。密码校验和哈希生成由 Worker 通过 HTTPS 调用。 |

首发覆盖首页、注册登录、个人资料和头像、选手总览、成绩增删改查、分项目榜单、个人最佳、GR 历程、管理员整活项目管理，以及 AstrBot 的 QQ 绑定、查询和录入。页面和 API 形状可重新设计，历史用户编号、项目编码、成绩语义和现有权限要可验证。站内提交破 GR 后的群通知在 AstrBot 已有可用服务地址时接通，发送失败与成绩提交结果独立。

密码服务将 `/verify` 和 `/hash` 作为两个固定操作，监听 VPS2 环回地址，由独立的 Cloudflare Tunnel 在 `password.hzcubing.fun` 提供专用 HTTPS 入口。Worker Secret 与 VPS2 从部署环境读取专用凭据，VPS2 校验凭据并限制请求频率、并发和请求体大小。D1 保存密码哈希，VPS2 在单次请求内处理密码和哈希。两端日志仅记录请求结果、耗时和诊断 ID。服务超时或不可用时，Worker 返回可重试的 `503`，公开查询及有效会话仍由 Worker 正常处理。

会话用随机令牌，D1 保存令牌摘要和到期时间，浏览器通过同域 `HttpOnly`、`Secure`、`SameSite=Lax` Cookie 携带会话，退出登录时撤销。Worker 校验浏览器写请求的来源，并限制登录、注册频率。AstrBot 用独立服务凭据调用新版 QQ 接口，权限约束在绑定、查询和提交相关操作。QQ 写入和网站写入遵循相同的停写开关。

### 数据转换与核验

| 来源 | 迁移规则 |
| --- | --- |
| `users` 与 `counters` | 保留 `_id`、`userNo`、资料、邮箱、哈希、QQ 绑定、角色和状态。用户编号和 MongoDB ID 分别保留唯一约束。自增序列从最终快照的 `max(counter.seq, max(userNo))` 接续。旧 JWT 到切换时失效。 |
| `records` | 保留成绩 ID、用户 ID、原昵称快照、项目编码、单次与平均原始数值、solves、器材、方法、比赛及各类时间戳。当前有 18 条超过两位小数的历史成绩，原值进入 D1，显示精度和榜单比较规则分别按历史行为验收。空成绩沿用 `NULL`，无 solves 的记录保留空值。 |
| `meme_events` 与静态项目表 | 汇总官方、趣味、整活项目，项目键沿用原始编码和大小写，保留整活项目 ID、状态、描述及来源字段。历史编码缺少定义时，以原编码建立可查询的历史项目，报告中列出差异。已有成绩关联的项目停用后仍可查看历史成绩。 |
| Base64 头像 | 在迁移环境解码，校验 MIME 和 SHA-256，按用户 ID 和内容摘要生成确定的 R2 对象键。先验证对象上传结果，再写入 D1 引用。 |

迁移脚本放在 `scripts/migration/`，按导出、转换、导入、校验四步执行。MongoDB 用 `mongodump` 生成独立的加密备份，转换器读取结构化数据，输出 D1 导入文件、R2 图片和校验清单。备份至少保留一份在 VPS2 之外，并用隔离 MongoDB 做一次恢复演练。哈希、QQ、邮箱、真实头像和备份文件只在受控迁移目录处理。

试迁脚本从指定快照重复生成同一份导入清单，D1 使用空目标库，R2 相同对象键可重复上传。校验先比账号、项目、成绩和头像计数，再逐条比 ID、字段摘要、成绩关联及 R2 对象校验值。以同一快照生成旧榜单、个人最佳和 GR 样本，与新版输出对比。字段冲突、悬空关联和哈希不符都阻止切换。

### 实施顺序

1. **准备分支和基线。** 建立 worktree，确定旧版排名、权限和数据验证样本。在该分支更新 `AGENTS.md` 的 Vue、Workers、D1、R2 与 VPS2 密码服务约定，取代旧的 Express/MongoDB 约定。规划 `src/` 存放新版前端，`worker/` 存放 API，`services/password/` 存放 VPS2 服务，`migrations/` 存放 D1 SQL。
2. **先打通一条完整链路。** 用合成账号从登录进入个人主页、录入一条成绩、查看榜单。连接测试 D1、R2 与隔离的密码服务。验证正确密码、错误密码、服务超时、注销，确认 Free 档没有 CPU 超限。用新环境跑 `npm run build`、`npm test` 和 `wrangler deploy --dry-run`。
3. **完成首发功能并试迁。** 补齐个人资料、GR、整活项目和 QQ 流程。把生产数据快照导入隔离资源并比对清单。测试账号验证实际 Worker 到 VPS2 的认证请求，检查未授权访问、超时和日志脱敏。确认管理权限、头像访问、移动端布局、SPA 深链接、API 404 和用户编号接续。以真实用户所在的国内网络验证页面和提交链路。
4. **停写并切换。** 确认备份可恢复、隔离环境验收通过后，约定短暂停写窗口。暂停旧 API 写入和 AstrBot 插件写入，等待进行中的请求结束，导出最终快照。导入生产 D1 与 R2 并重新校验。先在新 Worker 验证线上绑定，再从 Pages 解除 `hzcubing.fun`，检查并处理旧 CNAME，把域名绑定为 Worker Custom Domain。AstrBot 配置指向新版 `/api/bot/*`。正式入口的只读检查通过后，恢复站内与 QQ 写入。
5. **验收并退役。** 验收正式域名的首页、登录、旧数据浏览、提交成绩、管理员功能和 QQ 写入。成功后停掉 `hzcubing-api` 和 `hzcubing-mongo`，下线 `api.hzcubing.fun` 的旧代理配置，退役旧 Pages 项目。切换至恢复写入之间如发现校验失败，保持停写并修复，校验通过后切换。恢复写入之后以 D1 和 R2 为生产源，数据修复使用当前快照及备份。

生产数据导入、推送、远端部署、Pages/DNS 切换和停旧服务按 `AGENTS.md` 确认操作范围和切换窗口。首发后同步 `project.md`、`architecture.md`、`api.md` 和 README 的实际状态及用法。

### 试迁记录与切换准备

- 2026 年 11 月 25 日，读取 MongoDB 快照并在内存 SQLite 核验了 32 个账号、70 个合并项目、734 条成绩和 10 张头像。其中 18 条成绩保留超过两位小数的原始值，一个用户的规范 ISO 日期字符串转换为同一 UTC 时刻。最终以停写后的快照为准。
- 工作站已收到 DPAPI 加密的 MongoDB 归档，解密前后的 SHA-256 一致，`mongorestore --dryRun` 验证通过。归档还已恢复到无外网的临时 MongoDB 容器，恢复计数为 32 个账号、734 条成绩、34 个整活项目和 10 张头像。切换时在停写后重新备份并重复校验。
- `hzcubing-next-preview` 已部署到 Workers Free，使用独立 D1 和 R2。合成快照已完成远程上传、导入、导出和逐项校验。预览开启停写，可查看站点和合成榜单。
- VPS2 已安装密码服务和专用 Tunnel 连接器。现有 OAuth 创建 `password.hzcubing.fun` 的 DNS 记录时返回 `403`。在 Cloudflare 的 `hzcubing.fun` 区域添加代理 CNAME，目标为 `8f1cc72e-a9dc-4d72-9cac-d86479b2a1fd.cfargotunnel.com`。生效后在隔离预览环境核对 Worker 通过正式 HTTPS 地址调用密码服务。

- AstrBot 插件的新版适配在其原仓库的 `codex/cloudflare-api` 分支，已用 VPS2 上同一镜像验证预览环境的群纪录、群纪录历史、榜单和项目查询。部署插件时设置 `HZCUBING_BOT_SECRET`，使其匹配 Worker 的 `BOT_SECRET`。`/绑定` 查询绑定状态，新绑定在个人主页完成。

Windows 下可用 `scripts/migration/backup-vps2.ps1` 从 VPS2 拉取 gzip MongoDB 归档到当前用户的本机加密存储。Windows DPAPI 文件由生成它的用户账户解密。停写窗口开启后生成新的归档，并在独立 MongoDB 恢复以取得四份 BSON 文件。确认最终快照可恢复后再发布。

```sh
node scripts/migration/convert.mjs <BSON库目录> <新建受控目录>
node scripts/migration/verify.mjs <转换目录>
```

用实际生产绑定的 Wrangler JSON 配置执行导入。脚本在正式写入前检查 D1 业务表为空，按清单上传 R2 对象并导入 SQL。校验命令导出 D1 并下载 R2 对象，核对完成后清理临时导出。按验收结果安排切换。

```sh
node scripts/migration/cloud-copy.mjs import <生产Wrangler配置> <转换目录>
node scripts/migration/cloud-copy.mjs verify <生产Wrangler配置> <转换目录>
```

### 上线后的产品工作

优先处理成绩录入容错、管理员数据治理和关键写操作的审计。后续根据真实负载决定榜单缓存或预计算。完整比赛系统、多端客户端和复杂权限系统继续暂缓。

### 核对依据

- Cloudflare [Workers Static Assets SPA 路由](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/)、[Pages 迁移指南](https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/)和[Workers Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)。
- Cloudflare [Workers Limits](https://developers.cloudflare.com/workers/platform/limits/)、[D1 Limits](https://developers.cloudflare.com/d1/platform/limits/)和[R2 Pricing](https://developers.cloudflare.com/r2/pricing/)。
