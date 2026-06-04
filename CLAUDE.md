# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 工作约定

- **始终用中文沟通**,所有回复都用中文。
- **不要自动提交代码**。除非 Monica 明确要求,否则不要执行 `git commit` 或 `git push`。

## 这是什么

Monica(PressLogic PM)的个人原型管理系统。一个零构建、纯静态的 demo 画廊:首页列出所有需求原型卡片,点开进入单个 demo。推到 GitHub 后由 Vercel 自动部署,把单个 demo 的 URL `<域名>/prototypes/<slug>/` 发给 stakeholder 即可只展示那一个原型。

## 无构建 / 无测试

没有构建步骤、依赖安装、lint 或测试命令。本地预览直接在浏览器打开 `index.html`(或单个 demo 的 `prototypes/<slug>/index.html`)。部署 = `git push`,Vercel 无需任何构建设置。

## 架构

三个核心部件,理解它们的关系就够了:

- **`prototypes.js`** — 唯一的数据源。导出 `window.PROTOTYPES` 数组,每条记录是一个 demo 的元数据:`{ slug, title, desc, date, cover }`。**`slug` 必须等于 `prototypes/` 下的文件夹名**——首页据此拼出卡片链接和封面图路径。
- **`index.html`** — 画廊首页。内联 script 读取 `window.PROTOTYPES`,按 `date` 倒序渲染卡片网格,并提供按 title/desc/slug 的前端搜索。无框架,纯原生 JS。
- **`prototypes/<YYYY-MM-DD-需求名>/index.html`** — 每个 demo 自包含在自己的文件夹里。`cover`(若有)是该文件夹内的图片文件名,路径拼为 `prototypes/<slug>/<cover>`。

`assets/style.css` 是首页样式(CSS 变量定义在 `:root`),不影响各 demo 内部。`vercel.json` 仅开启 `cleanUrls`。

## 加一个新 demo

1. 建文件夹 `prototypes/<YYYY-MM-DD-需求名>/`,放入 `index.html`(及可选封面图)。
2. 在 `prototypes.js` 数组里加一条记录,`slug` 设为该文件夹名。

## 设计文档

需求的 spec 与 plan 存放在 `docs/superpowers/specs/` 和 `docs/superpowers/plans/`,按 `YYYY-MM-DD-<需求名>` 命名,与对应 demo 关联。
