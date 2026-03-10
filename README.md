# hzcubing - 魔方成绩记录系统

一个简单的全栈魔方成绩记录系统（Vue 3 + Express + MongoDB）。

## 功能
- 用户注册/登录（JWT）
- 个人资料（昵称、简介、WCA ID）
- 成绩记录（新增/编辑/删除、分页、个人最佳/历史、排行榜）

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
└── public/                  # 静态资源
```

## 快速开始

### 环境要求
- Node.js >= 18
- MongoDB >= 6

### 1) 安装依赖

```bash
npm install

cd server
npm install
cd ..
```

### 2) 配置环境变量

```bash
cd server
cp .env.example .env
```

```env
MONGODB_URI=mongodb://localhost:27017/hzcubing
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=30d
PORT=3000
NODE_ENV=development
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

```bash
cp .env.example .env
```

```env
VITE_API_URL=http://localhost:3000/api
```

### 3) 启动应用

```bash
cd server
npm run dev

cd ..
npm run dev
```

### 4) 访问应用

- 前端：http://localhost:5173
- 后端 API: http://localhost:3000/api
- API 健康检查：http://localhost:3000/health

## 常见问题

### MongoDB 连接失败
确保 MongoDB 服务正在运行，并检查 `server/.env` 的 `MONGODB_URI`。

### CORS 错误

检查后端 `CORS_ORIGINS` 是否包含前端地址（默认 `http://localhost:5173`）。

### Token 过期

Token 默认 30 天过期，可在 `server/.env` 中调整 `JWT_EXPIRES_IN`。

## License

MIT
