# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 工作约定

- **始终用中文沟通**,所有回复都用中文。
- **产品 UI 文案用英文,演示/解说类辅助文案可用中文**。
  - **属于「真实产品界面」的用户可见文案**(标题、按钮、提示、状态、徽章等)一律英文——产品面向海外。无论 Monica 用中文还是英文描述需求,中文文案都要翻译成英文再落地,不要直接把中文写进产品 UI。
  - **纯粹给演示/解说用的辅助文案**(演示控制标签、页面底部「切换上方套餐查看各状态」这类说明)**可以用中文**,因为它们不属于真实产品的一部分。
  - 沟通(回复)始终用中文。
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
- **`public/legacy/<slug>/assets/`** — 从早期纯静态 demo 迁移而来的图片/视频等资源,仍被对应 React 页面直接引用(如 playad、affiliate-program 通过 `ASSET_BASE`/`COVER` 指向这里)。旧的独立 `index.html` 已被 React 路由取代并删除。
  > `prototypes.ts` 的 `legacy?: boolean` 字段与首页的 legacy 渲染逻辑保留,但目前**无任何实例**——所有原型都是 React 路由。若将来再塞纯静态 demo,可标 `legacy: true` 并让 `href` 指向 `/legacy/<slug>/index.html`。
- **`src/components/ui/`** — shadcn 组件;`src/app/globals.css` 含 Tailwind 主题 + Buzz 橙色品牌 tokens。

## 加一个新 demo

> **动手前先读根目录 `design.md`**——品牌色、字体、复用样式 token(`gradText`/`ctaBtn`/`kicker`)、圆角阴影间距、交互规范都在那。所有原型按它来,保证视觉统一。

1. 新建 `src/app/prototypes/<需求名>/page.tsx`(用 shadcn/ui + Tailwind + lucide)。slug 直接用需求名即可,**不带日期**;日期单独写进记录的 `date` 字段(首页据此排序)。
2. 在 `src/lib/prototypes.ts` 加一条记录,`href` 指向该路由。
3. 静态资源放 `public/prototypes/<slug>/`。若是从旧静态 demo 迁移、复用既有图片/视频,资源仍留在 `public/legacy/<slug>/assets/`,页面直接引用即可,无需搬动。

## 设计文档

- **`design.md`(根目录)** — 视觉/交互设计基线:品牌色、字体、复用样式 token、圆角阴影间距、组件与动效规范。做任何原型前先读它,旗舰页 `2026-06-09-affiliate` 是活样板。
- 需求的 spec 与 plan 存放在 `docs/superpowers/specs/` 和 `docs/superpowers/plans/`,按 `YYYY-MM-DD-<需求名>` 命名,与对应 demo 关联。
