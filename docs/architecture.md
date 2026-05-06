# 架构说明

更新时间：2026-05-06

## 总体架构

项目采用前后端分离架构。

```text
src/        Vue 3 前端应用
server/     Express + MongoDB API 服务
public/     静态资源
docs/       项目文档
```

前端通过 HTTP API 访问后端，不直接访问数据库。后端负责鉴权、数据校验、领域规则、数据库读写和外部入口治理。

## 前端架构

### 技术栈

- Vue 3
- Vue Router
- Pinia
- Axios
- Vite

### 目录职责

- `src/main.js`：前端应用入口。
- `src/App.vue`：应用根组件。
- `src/router/index.js`：路由定义、登录态和管理员路由守卫。
- `src/api/index.js`：API 客户端和接口封装。
- `src/stores/`：跨页面共享状态和业务数据缓存。
- `src/views/`：页面级组件。
- `src/components/`：可复用 UI 组件。
- `src/config/events.js`：官方项目、趣味项目和静态项目配置。
- `src/utils/`：纯业务工具函数。
- `src/styles/` 与 `src/style.css`：全局样式与主题规则。

### 前端边界

页面组件负责：

- 组织页面结构。
- 调用 store 或 API 封装。
- 管理当前页面的局部交互状态。
- 展示加载、错误和空状态。

store 负责：

- 共享数据加载。
- 请求复用和缓存状态。
- 跨页面使用的派生数据。
- 与 API 层的稳定衔接。

工具函数负责：

- 排名、格式化、头像等可纯函数化的业务逻辑。
- 不依赖组件生命周期和 DOM。

前端不应承担：

- 鉴权可信判断。
- 数据库字段最终校验。
- 管理员权限最终校验。
- 需要全局一致的核心业务写入规则。

## 后端架构

### 技术栈

- Node.js
- Express
- MongoDB
- Mongoose
- JWT
- bcryptjs

### 目录职责

- `server/index.js`：Express 应用初始化、中间件、路由注册、服务启动。
- `server/config/database.js`：数据库连接配置。
- `server/routes/`：HTTP 路由与接口层。
- `server/models/`：Mongoose 数据模型。
- `server/middleware/`：鉴权、错误处理等中间件。
- `server/utils/`：后端共享工具。

### 后端边界

后端负责：

- 用户注册、登录、密码哈希和 token 签发。
- 用户身份识别和管理员权限校验。
- 成绩、用户、整活项目的数据读写。
- 数据结构、字段白名单和核心业务规则校验。
- 对外部 QQ / AstrBot 等入口进行安全约束。
- 为前端提供稳定 API 契约。

路由层当前承担了较多业务逻辑。后续新增或重构复杂逻辑时，应优先下沉到 service 或独立工具模块，避免继续扩大 `routes/*.js`。

## API 契约

前端统一通过 `src/api/index.js` 调用后端接口。

默认响应结构为：

```json
{
  "code": 200,
  "message": "ok",
  "data": {}
}
```

分页接口可额外返回：

```json
{
  "page": 1,
  "pageSize": 20,
  "total": 100
}
```

约束：

- 新接口应保持 `code`、`message`、`data` 的基本结构。
- HTTP 状态码与响应 `code` 应尽量一致。
- 用户主标识需要逐步统一，避免 `_id`、`userNo`、`profileUserNo` 在新接口中继续扩散。
- 前端不得绕过 `src/api/index.js` 直接散落创建 axios 实例。

## 数据模型约束

当前核心模型：

- `User`：账号、资料、角色、状态、QQ ID、用户编号。
- `Record`：用户成绩、项目、单次、平均、器材、方法、比赛、原始 solves、时间戳。
- `MemeEvent`：动态整活项目。
- `Counter`：自增编号。

重要约束：

- `User.password` 默认不返回。
- `User.userNo` 使用 `Counter` 自动生成。
- `Record.nickname` 是写入时用户昵称快照，不等同于用户当前昵称。
- `Record.event` 当前仍是字符串，后续需要逐步收口事件字典和校验规则。
- 整活项目 `eventCode` 变更或删除会影响关联成绩，修改前必须评估数据影响。

## 部署与运行边界

根项目脚本主要服务前端构建和 Cloudflare Pages / Wrangler 预览部署：

- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run deploy`

后端位于 `server/`，使用独立依赖和脚本：

- `npm run dev`
- `npm start`

远端服务器只用于临时脚本执行、数据库操作和运行状态排查。默认不在远端服务器长期修改代码。

## 开发约束

- 保持前后端分离，前端不直接访问数据库。
- 低风险改动可以本地直接完成；高风险操作必须先说明影响并等待确认。
- 不随意修改 `.env`、部署配置、数据库字段含义和持久化数据结构。
- 不引入大型依赖或切换核心技术方案，除非任务明确需要且已确认。
- 优先复用现有组件、store、工具函数、模型和中间件。
- 避免无关格式化、无关重命名和无关重构。
- 涉及接口、数据结构、模块边界、运行方式变化时，必须同步检查文档。
