# HZCubing

魔方社区成绩系统，提供成绩提交、榜单、选手主页、个人最佳、群纪录和整活项目管理。支持 QQ 账号绑定及 AstrBot 成绩录入。

新版使用 Vue 3 + Vite 构建前端，Workers 托管全站，Hono 提供 API，D1 存业务数据，R2 存头像。VPS2 的独立服务负责 bcrypt。

## 本地开发

使用 Node.js 22.13 或更新版本。从仓库根目录安装依赖并初始化本地 D1。

```sh
npm ci
npm --prefix services/password ci
npm run db:local
npm run build
```

复制 `.dev.vars.example` 为 `.dev.vars`，生成一个 64 位十六进制随机字符串，用作 `PASSWORD_SERVICE_SECRET`。在另一个终端设置同一环境变量，执行 `npm --prefix services/password start`。根目录执行 `npm run dev:worker -- --port 8795`，从 Wrangler 给出的本地地址打开站点。修改页面后重新构建静态资源。

运行 `npm test` 和 `npm run typecheck` 做回归检查。本地进程运行后可在隔离数据库执行 `node scripts/smoke-worker.mjs`，默认测试地址为 `http://127.0.0.1:8795`。项目部署、权限与数据迁移见 [架构说明](docs/architecture.md) 和 [迁移路线图](docs/roadmap.md)。

## License

MIT
