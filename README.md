# hzcubing

魔方社区成绩系统，提供成绩提交、榜单、选手主页、个人最佳、群纪录和整活项目管理。支持 QQ 账号绑定及 AstrBot 成绩录入。

新版使用 React、Vite 和 React Router 构建单页应用，界面使用 coss ui 和 Lucide，Workers 托管全站，Hono 提供 API，D1 存业务数据，R2 存头像。VPS2 的独立服务负责 bcrypt。

## 本地开发

从仓库根目录运行 Windows 快捷命令 `hzcubing`，或运行 `npm run dev:online`，然后打开 `http://localhost:5173`。该模式仅监听回环地址，通过正式站 API 连接生产 D1 和 R2，可以用生产账号登录。保存资料和提交成绩等操作会写入生产数据。

使用 Node.js 22.13 或更新版本。从仓库根目录安装依赖并初始化本地 D1。

```sh
npm ci
npm --prefix services/password ci
npm run db:local
```

复制 `.dev.vars.example` 为 `.dev.vars`，生成一个 64 位十六进制随机字符串，用作 `PASSWORD_SERVICE_SECRET`。在另一个终端设置同一环境变量，执行 `npm --prefix services/password start`。根目录分别执行 `npm run dev:worker -- --port 8795` 和 `npm run dev`。从 Vite 给出的地址打开站点，默认是 `http://localhost:5173`。前端保存后热更新，`/api` 和 `/media` 由 Vite 转发到本地 Worker。

运行 `npm run dev` 时，可以在 `.env.development.local` 设置 `HZCUBING_PREVIEW_DATA=1`，改用线上预览数据。`/api` 和 `/media` 只代理 `GET` 和 `HEAD` 请求。登录和注册测试可直接访问 `preview.hzcubing.fun`。删除该配置并重启 Vite 可恢复本地 Worker。

要直接从 Worker 预览构建产物，先运行 `npm run build`，再访问 `http://127.0.0.1:8795`。重新构建后重启 Worker 即可更新静态资源。

运行 `npm test` 和 `npm run typecheck` 做回归检查。本地进程运行后可在隔离数据库执行 `node scripts/smoke-worker.mjs`，默认测试地址为 `http://127.0.0.1:8795`。项目部署、权限与数据迁移见 [架构说明](docs/architecture.md) 和 [迁移路线图](docs/roadmap.md)。

## License

MIT
