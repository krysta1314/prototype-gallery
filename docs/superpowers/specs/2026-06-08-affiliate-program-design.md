# Affiliate Program 入口 — 设计文档

日期:2026-06-08
slug:`2026-06-08-affiliate-program`
分支:`affiliate-program`(开发完成后合并回 main)

## 目标

新建一个原型页面,复刻产品右上角导航栏,并在帮助(问号)图标旁边新增一个 **Affiliate Program** 入口。展示其 hover tooltip 与点击弹出的推广卡片交互。

## 页面结构

- 主体空白(浅色背景)。
- 右上角固定一条导航栏,从左到右:
  1. `Upgrade | ⊕ 61,893 credits` 橙色渐变胶囊徽章
  2. **Affiliate 图标(新增)** — cash / 钞票线性图标,圆形描边风格,放在问号左侧
  3. 问号(帮助)圆形图标
  4. 头像「S」浅色圆形

## Affiliate 交互

- **Hover 图标**:显示 tooltip「Affiliate Program」。
- **点击图标**:在图标下方弹出卡片(点击卡片外部关闭):
  - 橙色头部:金币背景氛围 + 大字「50% Commission」(CSS 模拟,无外部图片)
  - 白色正文:
    - 标题「Refer friend & Earn rewards!」
    - 描述「Invite a friend and earn a **50% commission** on their first purchase! Share your referral link now.」
  - 紫色按钮「Get your referral link」→ `window.open` 新 tab 跳转 `https://buzzvideo.tolt.com/login`

## 技术约定

- 纯静态单文件 `prototypes/2026-06-08-affiliate-program/index.html`,内联 CSS/JS,无框架。
- 金币头部用 CSS 渐变 + emoji/简单图形模拟,无外部图片依赖。
- 在 `prototypes.js` 数组新增一条记录,`slug` 同文件夹名。

## 验收

- 右上角四个元素顺序、样式与参考图一致。
- Affiliate 图标 hover 出 tooltip,点击出卡片,点外部关闭。
- 卡片显示「50% Commission」,按钮新开 tab 到指定链接。
