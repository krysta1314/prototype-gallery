---
target: BuzzVideo APP MVP prototype
total_score: 22
p0_count: 2
p1_count: 3
timestamp: 2026-09-29T09-06-33Z
slug: src-app-prototypes-app-mvp-buzzvideo-app
---
# BuzzVideo APP (MVP) 设计审查

Method: dual-agent (A: design director review · B: detector + browser evidence)

## Design Health: 22/40（尚可但平庸）
可见状态 2 · 贴合现实 2 · 用户控制 3 · 一致性 2 · 防错 2 · 识别 3 · 效率 2 · 美学极简 1 · 错误恢复 3 · 帮助 2

## AI 味结论：是
- sparkles 同时代表 Create / Agent / Try it now / 营销通知
- 渐变散在 6 个互不相关元素上（logo、Tab 中心、发送、进度条、CTA、推送图标）+ 彩色阴影 shadow.cta
- 浅橙圆底图标 tile 是唯一图标语言（Row、快捷入口、Settings 每一行）
- 所有面 = 白卡 + 同一种柔阴影；圆角 20 种数值无体系
- 桃色渐变 + 点阵作为全局壁纸；✦ 字符当积分图标
- 通用文案（What should we make today? / Got it. Here's the plan:）；Login 标题孤字 "AI"
- 药丸过量；Share 用字母方块 IG/TT/RED/WA
- 字号：Inspire 61 个文字节点 43 个 ≤12px（B 实测）；字重 800 泛滥
- 对比度不达标：Tab 标签 2.5:1、选中 3.1:1、"All" chip 2.7:1、Ready 3.5:1、Failed 3.9:1
- 点击区域：chips / pill / 输入框按钮 32–36px，<44

## Priority Issues
- [P0] 橙色与渐变撒满全屏，无唯一主动作 → colorize(restrained) + distill
- [P0] 生成的峰值时刻没被设计（只有一行进度 + 三个 pill + 小横卡）→ shape + animate
- [P1] 图标无性格：lucide 默认 + sparkles 滥用 + 图标底色 tile → bolder/extract
- [P1] 不像 iOS：悬浮白圆按钮代替导航栏、设置页不是 inset-grouped、开关不是 Switch → adapt + polish
- [P1] 字号偏小 + 对比度 + 点击区域不达标 → typeset + audit
- [P2] Share 字母占位 logo；Work Detail 三按钮无主次 → clarify + polish
- [P2] Me 首屏给了积分而非作品；作品应为 9:16 网格 → distill + layout
- [P2] Inspire 首屏过载；Create 空状态扇形卡太小且标题被截断 → distill + clarify

## 与已定产品决策冲突、需 Monica 拍板
推送授权时机（登录后 vs 首次生成后）；快捷入口是否保留；Banner 轮播 vs 静态；四种模式是否收进 Agent；Agent 是否需要一个标记（此前定不要头像/吉祥物）。
