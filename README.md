# HZCubing - 魔方成绩记录系统

一个全栈魔方成绩记录和排行榜系统。

## 项目结构

```
hzcubing/
├── src/                    # Vue 3 前端
│   ├── api/               # API 客户端
│   ├── components/        # 可复用组件
│   ├── config/           # 配置文件
│   ├── router/           # 路由配置
│   ├── stores/           # Pinia 状态管理
│   ├── styles/           # 全局样式
│   ├── views/            # 页面组件
│   └── main.js           # 应用入口
├── server/                # Express 后端
│   ├── config/           # 数据库配置
│   ├── middleware/       # 中间件 (auth, error handling)
│   ├── models/           # Mongoose 模型
│   ├── routes/           # API 路由
│   ├── scripts/          # 脚本 (迁移等)
│   └── index.js          # 服务器入口
└── docs/                  # 文档
```

## 技术栈

### 前端
- Vue 3 (Composition API)
- Pinia (状态管理)
- Vue Router (路由)
- Axios (HTTP 客户端)
- Vite (构建工具)

### 后端
- Node.js + Express
- MongoDB + Mongoose
- JWT (认证)
- bcryptjs (密码加密)

## 快速开始

### 环境要求

- Node.js >= 18
- MongoDB >= 6

### 1. 安装依赖

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server
npm install
cd ..
```

### 2. 配置环境变量

#### 后端配置

```bash
cd server
cp .env.example .env
```

编辑 `server/.env`:

```env
# MongoDB 配置
MONGODB_URI=mongodb://localhost:27017/hzcubing

# JWT 配置
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=30d

# 服务器配置
PORT=3000
NODE_ENV=development

# CORS 配置
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

#### 前端配置

```bash
cp .env.example .env
```

编辑 `.env`:

```env
VITE_API_URL=http://localhost:3000/api
```

### 3. 启动 MongoDB

确保 MongoDB 正在运行：

```bash
# macOS (使用 Homebrew)
brew services start mongodb-community

# Linux (systemd)
sudo systemctl start mongod

# Windows (作为服务运行)
net start MongoDB
```

### 4. 启动应用

#### 方式一：分别启动

```bash
# 终端 1 - 启动后端
cd server
npm run dev

# 终端 2 - 启动前端
npm run dev
```

#### 方式二：使用并发工具

安装 concurrently:

```bash
npm install -g concurrently
```

然后在项目根目录创建 `package.json` 脚本或使用：

```bash
concurrently "cd server && npm run dev" "npm run dev"
```

### 5. 访问应用

- 前端：http://localhost:5173
- 后端 API: http://localhost:3000/api
- API 健康检查：http://localhost:3000/health

## API 文档

### 认证接口

#### 注册
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "nickname": "用户名"
}
```

#### 登录
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### 获取当前用户
```
GET /api/auth/me
Authorization: Bearer <token>
```

### 用户接口

#### 获取用户信息
```
GET /api/users/:id
```

#### 更新个人资料
```
PUT /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "nickname": "新昵称",
  "bio": "个人简介",
  "wcaId": "2024ZHAN01"
}
```

### 记录接口

#### 获取所有记录
```
GET /api/records?page=1&pageSize=50&event=333
```

#### 获取用户记录
```
GET /api/records/user/:userId?page=1&pageSize=50&event=333
```

#### 获取用户最佳记录
```
GET /api/records/user/:userId/best
```

#### 获取用户历史记录
```
GET /api/records/user/:userId/history?page=1&pageSize=50
```

#### 获取排行榜 (最佳记录)
```
GET /api/records/best?event=333
```

#### 获取最近破纪录
```
GET /api/records/recent-breaks?limit=10
```

#### 创建记录
```
POST /api/records
Authorization: Bearer <token>
Content-Type: application/json

{
  "event": "333",
  "singleSeconds": 10.54,
  "averageSeconds": 12.34,
  "cube": "GAN 11 M Pro",
  "method": "CFOP"
}
```

#### 更新记录
```
PUT /api/records/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "singleSeconds": 9.99
}
```

#### 删除记录
```
DELETE /api/records/:id
Authorization: Bearer <token>
```

## 数据迁移

如果从旧版本迁移数据：

```bash
cd server
# 配置 OLD_MONGODB_URI 在 .env 中
npm run migrate
```

## 项目事件代码

- `333` - 三阶速拧
- `222` - 二阶速拧
- `444` - 四阶速拧
- `555` - 五阶速拧
- `333oh` - 三阶单手
- `333bf` - 三阶盲拧
- `333fm` - 三阶最少步
- `py` - 金字塔
- `meg` - 五魔方
- `sk` - 斜转
- `clock` - 魔表
- `sq1` - SQ1

## 开发说明

### 前端开发

```bash
npm run dev      # 开发模式
npm run build    # 构建生产版本
npm run preview  # 预览生产构建
```

### 后端开发

```bash
npm run dev      # 开发模式 (自动重载)
npm start        # 生产模式
```

### 代码风格

- 前端使用 Vue 3 Composition API
- 后端使用 ES Modules
- 遵循 RESTful API 设计规范
- 使用 async/await 处理异步操作

## 常见问题

### MongoDB 连接失败

确保 MongoDB 服务正在运行，并检查 `MONGODB_URI` 配置。

### CORS 错误

检查后端 `CORS_ORIGINS` 配置是否包含前端地址。

### Token 过期

Token 默认 30 天过期，可在 `.env` 中调整 `JWT_EXPIRES_IN`。

## License

MIT
