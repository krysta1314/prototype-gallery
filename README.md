# 原型库

Monica 的个人原型管理系统。纯静态、零构建,GitHub → Vercel 自动部署。

## 怎么用
- 本地预览:双击 `index.html`。
- 加新 demo:跟 AI 说需求即可,AI 会建 `prototypes/<日期-需求名>/index.html` 并登记进 `prototypes.js`。
- 手动加 demo:① 在 `prototypes/` 下建文件夹 `<YYYY-MM-DD-需求名>/index.html`;② 在 `prototypes.js` 的数组里加一条记录(slug=文件夹名)。

## 分享给老板
推到 GitHub 后 Vercel 自动部署。把单个 demo 的 URL `<域名>/prototypes/<slug>/` 发给老板即可,打开只有那个 demo。

## 部署(首次)
1. `git init` 并推到 GitHub。
2. 在 Vercel 导入该仓库,无需改任何构建设置,直接 Deploy。
