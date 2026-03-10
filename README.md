# [hzcubing](https://hzcubing.club) - 魔方社区系统

一个简单的全栈魔方社区系统（Vue 3 + Express + MongoDB）。

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
│   └── index.js          # 服务器入口
└── public/                  # 静态资源
```

## License

MIT
