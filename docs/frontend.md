**hzcubing.club 前端 MVP 设计需求文档 (PRD)**

**一、 项目概述 (Project Overview)**
本阶段目标为构建 hzcubing.club 的前端 Minimum Viable Product (MVP)。重点在于重构核心的魔方成绩展示、录入与用户体系，舍弃原有的 Minecraft 模块。设计人员需抛弃旧版布局，采用现代化的 UI/UX 规范重新规划 Information Architecture (信息架构) 与 User Flow (用户交互链路)。

**二、 设计原则 (Design Principles)**

1. **Mobile-First & Responsive (移动端优先与响应式)**：核心用户场景可能在赛场或练习时通过手机查看榜单或提交成绩，页面需完美适配移动端。
2. **Data-Driven UI (数据导向的界面)**：排行榜和成绩历史是核心，需注重 Data Table (数据表格) 和 Timeline (时间轴) 的可读性与交互性（如：排序、筛选、分页）。
3. **Frictionless Input (无摩擦输入)**：成绩录入表单 (Form) 必须高效，特别是时间格式的输入体验。

**三、 信息架构建议 (Information Architecture)**
*无需完全拘泥于此，设计人员可根据交互逻辑优化合并*

* **公共区域 (Public Area)**
* Home (首页)
* Leaderboard (排行榜)
* Record History (记录历程 / GR 时间轴)
* User Profile (选手主页 / 个人 PB 墙)


* **认证区域 (Auth Area)**
* Sign In / Sign Up (登录/注册 - 建议采用 Modal/Dialog 形式降低跳转感)


* **工作区 (Workspace - 需登录)**
* Submit Record (成绩提交)
* Settings (个人设置 / 账号绑定)


* **管理后台 (Admin Panel - 极简 MVP 版)**
* Data Audit (数据审查)



**四、 核心页面功能需求 (Key Page Requirements)**

**1. Home (首页)**

* **Hero Section**: 平台愿景展示，包含明确的 Call to Action (CTA) 按钮（如：“查看榜单”、“提交我的成绩”）。
* **Recent Highlights**: 动态展示最近打破的 Group Record (GR) 或最新加入的活跃选手。
* **Quick Navigation**: 引导至 3x3、4x4 等热门项目排行榜的快捷入口。

**2. Leaderboard (排行榜页面)**

* **Filter/Control Panel (筛选控制台)**:
* Event Selector (项目切换)：如 3x3, 4x4, One-Handed 等（建议用图标+文字横向 Tab 或 Dropdown）。
* Type Toggle (类型切换)：Single (单次) / Average (平均)。


* **Rank Table (排名表格)**:
* 核心列：排名 (Rank)、选手 (Player)、成绩 (Time)、使用魔方 (Cube, 可选/折叠)、时间戳 (Date)。
* Top 3 视觉强化 (Visual Hierarchy)：前三名需有特殊的 UI 标识（如金银铜牌或高亮卡片）。



**3. Record History (记录历程页面)**

* **展示逻辑**: 针对选定的 Event (项目)，以 Timeline (时间轴) 形式展示该项目的历史最优成绩是如何被一步步打破的。
* **卡片元素**: 包含突破者头像/昵称、突破成绩、原纪录成绩对比（e.g., 9.50s -> 8.30s）、突破发生时间。

**4. User Profile (选手主页)**

* **Profile Header**: 选手头像、昵称、所属标签/身份。
* **Personal Best (个人 PB 墙)**:
* 采用 Grid 或 Card 布局展示该选手在参与过的各个 Event 中的 Best Single & Best Average。


* **Recent Activity (近期动态)**: 列表展示该选手最近提交的成绩记录。

**5. Submit Record (成绩提交页面 - 核心交互点)**

* **Event Selection**: 必选，下拉菜单选择项目。
* **Time Input (时间输入组件)**:
* **极高优先级体验优化**：需支持软键盘友好的输入。允许用户输入纯秒数 (e.g., `83.45`) 或 分秒格式 (e.g., `1:23.45`)。
* 提供 DNF / DNS 状态的快捷 Checkbox/Toggle。


* **Meta Info**: 选填的使用魔方 (Cube) 与解法 (Method)。
* **Validation (表单校验)**: 提交前前端需对非法格式进行强阻断并给出明确的 Error Message。

**6. Auth & Settings (认证与设置)**

* **Auth Flow**: Login/Register 表单，支持 Token 持久化交互。
* **Settings**:
* 修改基础信息（头像、昵称）。
* **QQ Binding (QQ 绑定)**：提供输入框绑定 QQ 号，说明该功能用于 Bot 端群内成绩播报和查询。



**五、 公共组件库抽取需求 (Component Library Needs)**
UI/UX 设计师在输出设计稿时，需考虑以下可复用 Component (组件)：

1. **Event Badge/Icon (项目徽章)**：统一风格的魔方项目图标（三阶、四阶、盲拧等）。
2. **Time Formatter Display (时间格式化展示)**：统一的成绩排版（大字号秒数，小字号毫秒）。
3. **Player Avatar/Link (选手头像卡)**：多处复用的带 Hover 状态的用户组件，点击跳转至对应的 User Profile。
4. **Empty State & Error State (空状态与错误态)**：榜单无数据、查询失败时的缺省页设计。