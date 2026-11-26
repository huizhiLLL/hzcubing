# Worker API

更新时间：2026-11-25

浏览器经站点同域访问。成功直接返回对象或数组，错误返回 `{ "message": "…" }`。写接口使用 `application/json` 与同域 `Origin`。上传头像直接发送图片字节。需要登录的接口由会话 Cookie 鉴权，机器人接口使用独立 Bearer 凭据。

| 方法与路径 | 访问权限 | 用途 |
| --- | --- | --- |
| `GET /api/health` | 公开 | Worker 健康检查。 |
| `GET /api/summary` | 公开 | 账号、成绩与启用项目数量。 |
| `POST /api/auth/register`、`POST /api/auth/login` | 同域 | 注册传 `email`、`password`、`nickname`，登录传邮箱与密码，注册可选填 `qqId`，成功设置会话。 |
| `GET /api/auth/me`、`POST /api/auth/logout` | 登录 | 查询本人资料、邮箱和角色，或撤销会话。 |
| `GET /api/players?q=&page=&pageSize=&sort=` | 公开 | 以昵称或 WCA ID 搜索选手，返回加入时间、成绩数、项目数和项目编码。`pageSize` 默认为 30，范围为 1 至 60。响应中的 `total` 是当前搜索条件匹配的选手总数，`more` 表示还有下一页。`sort` 支持 `latest`、`mostRecords`、`mostEvents`。 |
| `GET /api/players/:userNo?page=&category=` | 公开 | 返回个人资料、创建的整活项目、全部个人最佳和分页历史。可用 `category` 筛选历史成绩。 |
| `PATCH /api/profile` | 登录 | 更新 `nickname`、`bio` 或 `wcaId`。 |
| `PUT /api/profile/avatar` | 登录 | 上传 PNG、JPEG、GIF、WebP 或 AVIF，上限 2 MB。 |
| `DELETE /api/profile/avatar` | 登录 | 解除当前头像的关联。 |
| `POST /api/profile/qq` | 登录 | `qqId` 是字符串，绑定当前账号。 |
| `GET /api/events` | 公开 | 项目编码、名称、分类、描述和状态。 |
| `POST /api/events`、`PATCH /api/events/:code` | 管理员 | 创建或编辑整活项目，使用 `code`、`name`、`description`、`active`。编码为创建时确定。 |
| `GET /api/records/leaderboard?event=&type=&q=&limit=` | 公开 | 按 `single` 或 `average` 排名，支持昵称过滤。 |
| `GET /api/records/best?event=` | 公开 | 各项目当前单次和平均群纪录。 |
| `GET /api/records/gr?event=` | 公开 | 单次和平均的群纪录历史。 |
| `GET /api/records/:id` | 公开 | 查看单条成绩。 |
| `POST /api/records` | 登录 | 提交成绩，返回成绩及是否刷新 GR。 |
| `PATCH /api/records/:id`、`DELETE /api/records/:id` | 成绩所属账号 | 修改或删除成绩。删除成功返回 `204`。 |
| `GET /media/avatars/:user/:file` | 公开 | 读取 R2 中的头像。 |

提交成绩至少包含 `event`、`singleSeconds` 或 `averageSeconds`。数值支持秒数及 `分:秒` 字符串，`DNF`、`DNS` 或空值代表该项无有效成绩。`solves`、`cube`、`method`、`competition` 和毫秒时间戳 `timestamp` 均可选。PATCH 仅修改提供的字段，历史成绩原值在未编辑对应成绩字段时保留。

## AstrBot 切换

| 旧接口 | 新接口与调整 |
| --- | --- |
| `GET /api/auth/find-user-by-qq` | `GET /api/bot/player?qqId=...`，从返回根对象读取 `userNo` 和昵称。 |
| `POST /api/auth/submit-record-by-qq` | `POST /api/bot/records`，保留 `qqId`、`event` 和时间字段，成功为 `201`，成绩与 GR 字段在返回根对象。 |
| `POST /api/auth/create-meme-event` | `POST /api/bot/events`，使用 `qqId`、`code`、`name`、`description`。按绑定账户判断管理员权限。 |
| `POST /api/auth/bind-user-by-nickname` | 引导用户登录个人主页并通过 `POST /api/profile/qq` 自助绑定。迁入的绑定直接可用。 |
| `GET /api/meme-events` | `GET /api/events`，以 `category === 'meme'` 取整活项目。 |

`/api/bot/*` 统一携带 `Authorization: Bearer <BOT_SECRET>`。配置切换时验证查人、提交及项目查询，再启用写入。网页端的成绩通知由 Worker 在设置 AstrBot 凭据时发送。

常见错误为未登录或机器人凭据无效 `401`，权限或来源不符 `403`，资源不存在 `404`，绑定或编码冲突 `409`，限频 `429`，停写或密码服务不可用 `503`。
