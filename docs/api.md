# 后端接口文档

更新时间：2026-06-16

## 说明

- 基础路径：`/api`
- 请求体默认使用 `application/json`
- 鉴权方式：`Authorization: Bearer <token>`
- `Public` 表示无需登录，`Private` 表示需要登录，`Admin` 表示需要管理员权限
- 成功响应通常为 `{ code, message, data }`
- 分页接口额外返回 `page`、`pageSize`、`total`，部分接口返回 `totalPages`
- 健康检查和少量无返回体写操作可以不带 `data`

## 公共接口

| 方法 | 路径 | 鉴权 | 说明 | 参数 |
|---|---|---|---|---|
| GET | `/health` | Public | 服务健康检查 | 无 |

## Auth

| 方法 | 路径 | 鉴权 | 说明 | 参数 |
|---|---|---|---|---|
| POST | `/auth/register` | Public | 注册用户 | body：`email`、`password`、`nickname`、`bio?`、`qqId?` |
| POST | `/auth/login` | Public | 用户登录 | body：`email`、`password` |
| GET | `/auth/me` | Private | 获取当前用户 | 无 |
| POST | `/auth/bind-qq` | Private | 给当前用户绑定 QQ | body：`qqId` |
| POST | `/auth/bind-user-by-nickname` | Public | 通过昵称绑定 QQ | body：`qqId`、`nickname` |
| GET | `/auth/find-user-by-qq` | Public | 通过 QQ 查询用户 | query：`qqId` |
| POST | `/auth/create-meme-event` | Public | 通过 QQ 创建整活项目 | body：`qqId`、`eventCode?`、`eventName`、`description?` |
| POST | `/auth/submit-record-by-qq` | Public | 通过 QQ 提交成绩 | body：`qqId`、`event`、`singleSeconds?`、`averageSeconds?`、`cube?`、`method?` |

返回要点：

- 注册、登录返回 `token` 和 `user`
- `me` 返回当前用户资料
- QQ 绑定返回 `qqId`
- 通过 QQ 查询返回 `userNo`、`_id`、`nickname`、`email`、`qqId`
- 通过 QQ 提交成绩返回成绩 ID、成绩字段和 GR 判断结果

## Users

| 方法 | 路径 | 鉴权 | 说明 | 参数 |
|---|---|---|---|---|
| PUT | `/users/profile` | Private | 更新当前用户资料 | body：`nickname?`、`bio?`、`wcaId?`、`avatar?` |
| GET | `/users` | Public | 用户列表 | query：`page?`、`pageSize?` |
| GET | `/users/overview` | Public | 用户概览卡片 | query：`page?`、`pageSize?`、`keyword?`、`sort?` |
| GET | `/users/:id` | Public | 通过用户编号或 MongoDB ID 查询用户 | path：`id` |

返回要点：

- 用户列表返回 `id`、`userNo`、`_id`、`nickname`、`avatar`、`role`、`email`、`createdAt`
- 用户概览返回 `profileUserNo`、`nickname`、`createdAt`、`recordCount`、`events`；`sort` 支持 `latest`、`mostRecords`、`mostEvents`
- 用户详情返回 `bio`、`wcaId`、`status`、`createdAt`、`updatedAt` 等资料字段

## Records

| 方法 | 路径 | 鉴权 | 说明 | 参数 |
|---|---|---|---|---|
| GET | `/records` | Public | 成绩列表 | query：`event?`、`page?`、`pageSize?` |
| GET | `/records/user/:userId` | Public | 某用户成绩列表 | path：`userId`；query：`event?`、`page?`、`pageSize?` |
| GET | `/records/best` | Public | 全站分项目最佳 | query：`event?` |
| GET | `/records/gr-history/:event` | Public | 单项目 GR 历程 | path：`event` |
| GET | `/records/user/:userId/best` | Public | 某用户个人最佳 | path：`userId`；query：`event?` |
| GET | `/records/user/:userId/history` | Public | 某用户成绩时间线 | path：`userId`；query：`event?`、`page?`、`pageSize?` |
| POST | `/records` | Private | 新增成绩 | body：`event`、`singleSeconds?`、`averageSeconds?`、`cube?`、`method?`、`timestamp?` |
| PUT | `/records/:id` | Private | 更新自己的成绩 | path：`id`；body：`event?`、`singleSeconds?`、`averageSeconds?`、`cube?`、`method?` |
| DELETE | `/records/:id` | Private | 删除自己的成绩 | path：`id` |
| GET | `/records/recent-breaks` | Public | 近期破纪录列表 | query：`limit?` |

返回要点：

- 列表接口返回成绩数组和分页字段
- 成绩项包含 `_id`、`profileUserNo`、`nickname`、`event`、`singleSeconds`、`averageSeconds`、`cube`、`method`、`timestamp`
- 全站最佳返回每个项目的单次/平均最佳、所属用户编号、昵称和时间
- GR 历程返回 `event`、`single`、`average`
- 新增成绩返回 `_id`、`isSingleGR`、`isAverageGR`
- 更新和删除成绩只返回操作结果信息

## Meme Events

| 方法 | 路径 | 鉴权 | 说明 | 参数 |
|---|---|---|---|---|
| GET | `/meme-events` | Public | 获取整活项目 | 无 |
| POST | `/meme-events` | Admin | 新增整活项目 | body：`eventCode?`、`eventName`、`description?` |
| PUT | `/meme-events/:eventCode` | Admin | 更新整活项目 | path：`eventCode`；body：`eventCode?`、`eventName`、`description?`、`isActive?` |
| DELETE | `/meme-events/:eventCode` | Admin | 删除整活项目 | path：`eventCode` |

返回要点：

- 整活项目标准字段：`id`、`name`、`category`、`description`、`createdBy`、`createdByName`、`isActive`、`createdAt`、`updatedAt`
- 更新 `eventCode` 会返回 `migratedRecordCount`
- 删除整活项目会返回 `deletedRecordCount`

## 常见错误

| 状态码 | 含义 |
|---|---|
| 400 | 参数校验失败、重复字段或非法 ID |
| 401 | 未登录、token 无效或过期 |
| 403 | 账号禁用或权限不足 |
| 404 | 资源不存在 |
| 413 | 请求内容过大，例如头像过大 |
| 500 | 服务端异常 |

## 数据约束

- `password` 最少 6 位，默认不会返回
- `nickname` 最长 50 字符
- `bio` 最长 500 字符
- `qqId` 注册时最长 20 字符，且唯一
- `avatar` 支持 Base64 图片、HTTP(S) 地址和站内路径，最大约 2MB
- `singleSeconds`、`averageSeconds` 必须为非负数，新增成绩时至少提供一个
- `eventCode` 会标准化为小写，并移除空格和非法字符
- `eventName` 最长 50 字符，`description` 最长 300 字符
