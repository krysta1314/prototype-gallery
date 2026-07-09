# Product

## Register

product

> 默认按 **product**(app 内界面/后台/工具流程,设计服务于功能)。但本仓库同时高频产出 **brand** 类落地页(mcp / seedance / affiliate 这类面向海外用户的营销页,设计即产品)。做落地页任务时按 `brand` register 临时覆盖。

## Users

- **创建者**:Monica,PressLogic 的 PM。这个仓库是她的个人原型管理工作台。
- **观众**:PressLogic 内部的工程与设计团队。原型是需求沟通的载体——把要做的功能、交互流程、视觉表达讲到「能被直接复刻进真实生产代码」的程度,而不是一次性演示草图。
- **使用场景**:PM 用原型对内讲清需求 → 工程/设计据此落地。因此原型既要视觉到位,也要交互和信息架构经得起当真实产品来读。

## Product Purpose

一个 Buzz / BuzzVideo 产品原型的 demo 画廊(GitHub → Vercel 自动部署):首页按产品版本(v1.2–v1.5 / 归档)列出所有需求原型卡片,点开进入单个 demo。每个 demo 是用 Next.js + Tailwind + shadcn/ui 实现的真实前端页面,覆盖两类:面向海外用户的营销落地页,以及 app 内的功能界面(新手引导、升级引导、充值、资产库、品牌资产、成本后台等)。

成功的标准:原型足够真实、足够清楚,工程团队能照着它直接实现,且所有原型看起来像同一个产品出来的。

## Brand Personality

Buzz / BuzzVideo 品牌:**温暖、活泼、可信**(warm, lively, trustworthy)。暖橙色调、圆润、有呼吸感的现代 SaaS 气质。不是冷淡的科技蓝,也不是花哨的消费风。

- **语气**:标题短促有力,正文口语化、第一人称证言;真实产品 UI 文案一律英文(产品面向海外),演示/解说类辅助文案可用中文。
- **视觉情绪**:热情但克制,专业但不生硬。招牌暖橙渐变承载品牌表达,系统中性色搭骨架。

## Anti-references

- **不要「AI 模板感」**:到处的 sparkles ✨、无脑渐变按钮、药丸卡片堆叠、每个 section 头顶一个全大写 tracked kicker、千篇一律的等大卡片网格。`upgrade-model-guidance` 原型就是刻意剥掉这些、做成产品原生安静 nudge 的范例。
- **不要冷淡科技蓝**:这不是冷色调 B2B SaaS。
- **不要花哨消费风**:不追求炫技动效,微交互够用即可,重在把布局与流程讲清楚。
- **不临时造色**:颜色只从 `design.md` / `globals.css` 的品牌 token 取。

## Design Principles

1. **可落地优先(production-fidelity)**:原型是可以直接复刻进生产代码的真实前端,不是抛弃型草图。结构、状态、交互都当真做。
2. **像同一个产品(one coherent system)**:所有原型统一走 `design.md` 的品牌体系(暖橙、圆润、招牌渐变、系统字体),保证跨 demo 视觉一致。拿不准时对照旗舰页 `2026-06-09-affiliate`。
3. **讲清流程胜过炫技(clarity over flourish)**:原型的价值是把需求/交互/信息架构讲清楚。动效克制,微交互服务于理解而非表演。
4. **产品原生、去套路(native, not templated)**:主动避开一眼假的 AI 设计套路;需要克制时就克制(见 `upgrade-model-guidance`)。
5. **产品文案英文、面向海外(ship-ready English copy)**:真实产品界面文案一律英文;中文只留给演示/解说类辅助文字。

## Accessibility & Inclusion

基本达标即可(不追求正式 WCAG 认证,原型阶段重在表达):

- 正文对比度达到可读(body ≥ 4.5:1,大字 ≥ 3:1),不用为「优雅」牺牲可读性的浅灰字。
- 交互元素有清晰 focus 态(橙色细光环),关键流程键盘可达。
- 动效尊重 `prefers-reduced-motion`(需要时提供降级)。
