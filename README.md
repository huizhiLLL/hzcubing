# [HZCubing](https://hzcubing.club)

一个面向魔方玩家的社区成绩系统。

它提供成绩提交、榜单查看、选手主页、历史记录，以及官方 / 趣味 / 整活项目展示。前端使用 Vue 3，后端使用 Express + MongoDB。

## 主要功能

- 用户注册与登录
- 成绩提交、编辑与删除
- 分项目榜单与个人最佳
- 选手主页与历史成绩
- 管理员活动项目管理

## 项目结构

```text
src/        Vue 3 前端应用
server/     Express API 与 MongoDB 数据层
public/     静态资源
docs/       项目文档
```

## 本地开发

前端：

```bash
npm install
npm run dev
```

后端：

```bash
cd server
npm install
npm run dev
```

启动前请根据 `.env.example` 和 `server/.env.example` 配置环境变量。

## License

MIT
