# 个人原型管理系统 — 设计文档

**日期**: 2026-06-04
**作者**: Monica (PM, PressLogic)
**状态**: 已确认,待实现

## 目标

把 `原型设计/` 文件夹打造成一个可持续管理的**个人原型工作空间**。每当有新需求,来到这个项目让 AI 做一个新 demo,推到 GitHub 后由 Vercel 自动部署,把单个 demo 的 URL 发给老板看。

## 使用场景(核心工作流)

1. Monica 有新需求 → 跟 AI 说"帮我做个 XXX 的 demo"
2. AI 在 `prototypes/<日期-需求名>/` 下建好 demo,并自动登记进 `prototypes.json`
3. Monica 本地双击 `index.html` 预览(也可本地起服务),确认或继续迭代
4. push 到 GitHub → Vercel 自动部署
5. Monica 把该 demo 的独立 URL(`<域名>/prototypes/<需求名>/`)发给老板
6. 老板打开,只看到这个 demo,干净独立

## 关键设计决策

1. **纯静态、零构建**。简单交互用原生 HTML/CSS/JS;复杂交互用 CDN 引入的 React + Tailwind(浏览器直接运行,无需 npm install / 打包)。理由:Vercel 零配置部署、push 即上线、本地双击即可预览。
2. **首页画廊只给 Monica 自己用**,作为查找和管理所有 demo 的入口。不做个人品牌/title 展示,不做状态标签。
3. **每个 demo 完全独立、可单独分享**。有自己的 URL,页面内不放"返回原型库"等导航,保证发给老板时干净。
4. **首页自动收录**:通过维护 `prototypes.json` 清单驱动首页卡片渲染。新增原型 = 建文件夹 + 往清单加一条记录,这两步由 AI 代劳。

## 目录结构

```
原型设计/
├── index.html          # 首页画廊(读取 prototypes.json 渲染卡片)
├── prototypes.json     # 原型清单(唯一需维护的数据源)
├── prototypes/
│   └── <日期-需求名>/
│       ├── index.html  # 独立 demo 入口,可单独分享 URL
│       └── cover.png   # 封面图(可选,缺省用占位图)
├── assets/             # 首页共用样式/脚本
├── vercel.json         # 零构建静态部署配置
├── docs/superpowers/specs/  # 设计文档存档
└── README.md           # 使用说明:如何加原型、如何部署
```

## 组件说明

### 首页画廊 `index.html` + `assets/`
- 读取 `prototypes.json`,渲染卡片网格
- 每张卡片显示:封面图、标题、一句话描述、日期
- 点击卡片在新标签页打开对应 demo
- 提供关键词搜索/筛选(纯前端)
- 必须能本地双击直接打开:用相对路径加载 `prototypes.json`(如遇浏览器 `file://` 的 fetch 限制,清单数据以可被 `file://` 加载的方式提供,例如 `prototypes.js` 暴露全局变量,或在 README 注明用本地静态服务预览)

### 原型清单 `prototypes.json`
每个原型一条记录:
```json
{
  "slug": "2026-06-04-签到功能",
  "title": "每日签到功能",
  "desc": "用户连续签到领积分的交互原型",
  "date": "2026-06-04",
  "cover": "cover.png"
}
```
字段:`slug`(对应文件夹名 / URL 路径)、`title`、`desc`、`date`、`cover`(可选)。

### 新原型 demo
不预设模板文件。Monica 提需求时,AI 临场判断:简单交互用原生 HTML/CSS/JS,复杂交互用 CDN React + Tailwind(浏览器直跑,无打包),直接生成 `prototypes/<slug>/index.html`。

### 部署 `vercel.json`
- 纯静态托管,无构建命令(无 buildCommand)
- 连接 GitHub 仓库后,每次 push 自动部署
- 各 demo 通过路径 `/prototypes/<slug>/` 直接访问

## 新增原型的标准流程(AI 执行)

1. 按 `<YYYY-MM-DD-需求名>` 规则建 `prototypes/<slug>/` 目录
2. 依交互复杂度选模板,生成 `index.html`
3. 往 `prototypes.json` 追加一条记录
4. 首页自动出现新卡片

## 非目标(YAGNI,本期不做)

- 卡片状态标签(设计中/待评审/已上线)
- 首页个人品牌 / 名字 / title 展示
- demo 页内的"返回原型库"导航
- 需要 npm install / 打包构建的完整前端工程
- 鉴权 / 访问控制

## 部署前置条件

- 一个 GitHub 仓库(Monica 后续创建并关联)
- 一个 Vercel 账号并导入该仓库

## 成功标准

- 打开首页能看到所有 demo 卡片,点击可进入
- 新增一个 demo 后,首页无需手改首页代码即自动收录
- 单个 demo 的 URL 可独立分享,打开干净独立
- push 到 GitHub 后 Vercel 自动部署成功
- 本地可预览(双击或本地静态服务)
