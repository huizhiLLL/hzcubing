# 架构说明

更新时间：2026-11-25

## 代码与部署

| 目录 | 职责 |
| --- | --- |
| `src/next/` | React、React Router、Vite 与 TypeScript。页面通过同域 `/api` 访问 Worker。共享组件来自 coss ui registry，通过 Base UI 和 Tailwind CSS 提供交互与样式。通用图标从 `lucide-react` 按需导入。 |
| `worker/` | Hono API、会话、权限、项目、选手、成绩、群纪录、QQ 及媒体请求。 |
| `migrations/` | D1 表、项目种子、会话和速率计数。 |
| `scripts/migration/` | 快照备份、BSON、D1 和 R2 之间的转换与校验。 |
| `services/password/` | Node 和 bcryptjs 2.4.3。VPS2 只支持验证密码和生成哈希。 |
| `server/` 与旧版 `src/` | 切换验收使用的旧行为基线。 |

Workers Static Assets 提供 React SPA。`/api/*` 和 `/media/*` 先进入 Worker，其他深链接按 SPA 规则回到 `index.html`。`preview.hzcubing.fun` 使用独立的 D1 和 R2，导入旧站公开的选手资料、成绩、项目与头像。导入的旧站选手使用占位登录数据。预览目前允许注册测试账号和提交成绩。正式 `hzcubing.fun` 仍通过 Pages 和 VPS2 旧 API 提供服务。实施步骤见 [迁移路线图](./roadmap.md#cloudflare-迁移与全站重构方案)。

官方组件源码放在 `src/next/components/ui/`，该目录保留 coss ui 的 MIT 许可。页面布局与语义色由 `src/next/style.css` 管理。共享表格统一表头层级，并通过列类型设置成绩、排名和日期的样式。榜单和成绩录入使用 coss ui Select，并保留项目分组。榜单筛选的项目按钮随图标和名称调整宽度。榜单、群纪录和成绩管理共用分段切换组件，与搜索框和选择器统一为 34px 高。页面和筛选结果加载时使用扫光骨架。选手目录按窗口宽度确定列数，按页面剩余高度确定每页行数。榜单和选手目录预取常用筛选结果，内存缓存有效期为 30 秒。滑块、下拉菜单和登录注册表单的过渡遵循系统的减少动态效果设置。字体优先使用系统的 SF Pro Text 与 PingFang SC，Vite 从 Fontsource 打包 Geist 和 Noto Sans SC 作为自托管回退字体。顶部导航随滚动收为悬浮玻璃栏，保留原占位以避免内容跳动。浏览器不支持玻璃效果时使用不透明主题底色。首页主按钮与当前导航项使用品牌蓝。当前导航项采用玻璃高亮，桌面端切换时高亮滑到新位置，遵循系统的减少动态效果设置。

## 数据和权限

- `users` 保留 MongoDB ID 和原 `userNo`，用 `user_no` 自增键发放新编号。邮箱和 QQ ID 保持唯一约束。会话在 D1 保存令牌摘要和过期时间，登录 API 通过 `HttpOnly`、`Secure`、`SameSite=Lax` Cookie 传递令牌。Worker 检查写请求的 `Origin`，会话权限从 D1 的有效账户读取。
- `events` 汇总官方、趣味、整活和补录的历史项目。项目编码可区分大小写。旧项目停用后，关联成绩仍能查询。`records` 保存用户外键、昵称快照、原始单次与平均成绩、时间、solves 和描述字段。
- 榜单按单次或平均成绩升序、时间降序、ID 升序选取每位选手最佳记录，再按同一顺序排名。GR 按时间和 ID 从早到晚计算，只有严格刷新最佳成绩才形成记录。显示截取到百分秒，排序使用 D1 的原始值。
- R2 桶保持私有。Worker 校验头像类型与大小，文件名包含 SHA-256，D1 只保存对象键。媒体读取路由返回明确的 MIME 类型和缓存策略。

## 密码服务

Worker 通过 `password.hzcubing.fun` 的 HTTPS 对 `/hash` 和 `/verify` 发出有凭据的 POST 请求。VPS2 的密码进程通过 `hzcubing-password.service` 监听 `127.0.0.1:3026`。独立的 Cloudflare Tunnel 将这个域名转给环回服务，连接器由 `hzcubing-password-tunnel.service` 管理。连接器令牌由 systemd 读取，VPS2 的服务凭据和 Worker Secret 使用同一随机值。密码哈希留在 D1，VPS2 不持久化密码、哈希或业务数据。

Worker 对密码调用设置 3.5 秒超时，凭据错误或依赖不可用时返回 `503`。VPS2 限制请求体、每分钟调用次数与并发数。bcrypt cost 10 沿用已有账号的参数。日志只写状态、耗时和必要的诊断标识。

## 环境配置

| 名称 | 来源 |
| --- | --- |
| `DB`、`AVATARS` | Wrangler 中对应环境的 D1、R2 绑定。版本库中的配置用作本地开发。 |
| `PASSWORD_SERVICE_URL` | 生产和预览填写 `https://password.hzcubing.fun`。开发环境可用回环 HTTP，同时设置 `DEV_PASSWORD_HTTP=1`。 |
| `PASSWORD_SERVICE_SECRET` | 用 Worker Secret 注入，与 VPS2 `/etc/hzcubing-password.env` 中的值匹配。 |
| `BOT_SECRET` | AstrBot 插件独享的 Worker Secret。 |
| `SITE_READ_ONLY` | 为 `1` 时暂停浏览器及 QQ 写入。 |
| `ASTRBOT_MESSAGE_URL`、`ASTRBOT_API_KEY`、`ASTRBOT_MESSAGE_UMO` | 配齐可用的 AstrBot 服务地址及凭据后启用破纪录通知。 |
