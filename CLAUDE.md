# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 工作约定

- **始终用中文沟通**,所有回复都用中文。
- **不要自动提交代码**。除非 Monica 明确要求,否则不要执行 `git commit` 或 `git push`。

## 这是什么

Monica(PressLogic PM)的个人原型管理系统。一个 demo 画廊:首页列出所有需求原型卡片,点开进入单个 demo。推到 GitHub 后由 Vercel 自动部署。

> 历史:2026-06 之前是零构建纯静态站(`index.html` + `prototypes.js` + `prototypes/<slug>/index.html`)。现已迁移到 **Next.js**,以便原型能直接复刻进真实生产代码。旧静态版本仍保留在 `main` 分支。

## 技术栈

**Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui + lucide-react**,字体 Inter(正文) + Plus Jakarta Sans(标题)。

- 开发:`pnpm dev`(端口 3000)。构建:`pnpm build`。包管理用 **pnpm**。
- 部署:`git push`,Vercel 自动识别 Next.js,无需额外配置(旧 `vercel.json` 已移除)。
- 注意:本仓库用的是 **Next 16**,有 breaking changes(见根目录 `AGENTS.md`),写代码前留意。

## 架构

- **`src/lib/prototypes.ts`** — 唯一数据源,导出 `PROTOTYPES` 数组:`{ slug, title, desc, date, href, legacy? }`。首页据此渲染卡片。
- **`src/app/page.tsx`** — 画廊首页(client component),读取 `PROTOTYPES`,按 `date` 倒序、支持搜索。
- **`src/app/prototypes/<slug>/page.tsx`** — 用 React + Tailwind + shadcn/ui + lucide 实现的原型页(旗舰:`2026-06-09-affiliate`)。
- **`public/legacy/<slug>/`** — 早期纯静态 HTML demo 原样保留,画廊以新标签打开(`href` 指向 `/legacy/<slug>/index.html`,标 `legacy: true`)。
- **`src/components/ui/`** — shadcn 组件;`src/app/globals.css` 含 Tailwind 主题 + Buzz 橙色品牌 tokens。

## 加一个新 demo

1. 新建 `src/app/prototypes/<YYYY-MM-DD-需求名>/page.tsx`(用 shadcn/ui + Tailwind + lucide)。
2. 在 `src/lib/prototypes.ts` 加一条记录,`href` 指向该路由。
3. 静态资源放 `public/prototypes/<slug>/`。

## 设计文档

需求的 spec 与 plan 存放在 `docs/superpowers/specs/` 和 `docs/superpowers/plans/`,按 `YYYY-MM-DD-<需求名>` 命名,与对应 demo 关联。
