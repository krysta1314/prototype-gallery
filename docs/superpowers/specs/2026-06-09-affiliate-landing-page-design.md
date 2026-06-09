# Affiliate Program 落地页 — 设计文档

- **日期**：2026-06-09
- **产品**：Buzz Video（buzzvideo.ai）— AI 广告生成平台
- **关联 demo**：`prototypes/2026-06-08-affiliate-program/`（右上角 Affiliate 入口）

## 目标

做一个完整的 affiliate program 落地页，**核心目的是让人一眼看到「能赚多少钱」，从而愿意加入联盟销售**。页面延续现有入口 demo 的 50% 佣金 + 橙金 cash 主视觉。

## 关系与流程改动

- **保留**现有入口 demo（`2026-06-08-affiliate-program`）不动其文件夹。
- **复制**一份成为新 demo：`prototypes/2026-06-09-affiliate-landing/`，落地页主体放在其 `index.html`。
- **入口跳转改动**：在新 demo 里，右上角「Earn Cash」按钮点击后**直接跳转到落地页**（同一文件夹内的落地页，或锚点），不再只弹出小卡片。原弹窗卡片的「Get your referral link」行为保留（跳 `https://buzzvideo.tolt.com/login`）。
  - 具体：新 demo 顶部保留 topbar 与 Earn Cash 按钮作为情境，点击滚动/跳转到下方落地页内容；落地页所有主 CTA 指向 Tolt 登录页。

## 视觉方向

**B · 深色金钱感**：深底（#15131f / #1e1b2b），巨大金色数字作主视觉（金渐变 #ffd76a→#ff7a1a），CTA 用品牌橙渐变（#FFA73C→#FF5255）。能量强、FOMO 感，与入口卡片金渐变呼应。

## 佣金模型（真实数据）

- **50% 佣金，仅限好友首单（first purchase）**。
- Buzz 套餐价（来自产品 pricing 页）：

| 套餐 | 月付 | 年付（折后/月 → 年总额） | 50% 首单佣金（月付 / 年付） |
|---|---|---|---|
| Starter | $19/mo | $14/mo → $168/yr | $9.5 / **$84** |
| Pro（Most Popular） | $49/mo | $35/mo → $420/yr | $24.5 / **$210** |
| Ultra | $89/mo | $63/mo → $756/yr | $44.5 / **$378** |

- 计算器**默认按年付**展示（数字更大、更有吸引力），可切换月付。

## 页面结构（从上到下）

1. **情境 topbar**（复用入口 demo 的导航条 + Earn Cash 按钮，作为来源情境）。
2. **Hero 首屏** — 巨大金色「50%」+ "commission on every friend's first purchase" + 副文案 + 主 CTA「Get your referral link →」+ "No cost to join · Payouts via Tolt"。
3. **收益计算器** — 选套餐（Starter/Pro/Ultra，Pro 默认高亮）+ 拖动"推荐人数"滑块 + 月付/年付切换 → 实时算出总收入大数字。标注 "illustrative, based on 50% of first purchase"。
4. **大数字信任条** — "$X paid to partners · X+ affiliates · X-day cookie"（占位数字，标注示意）。
5. **How it works** — 3 步：① 注册拿专属链接 ② 分享给受众（视频/帖子/newsletter）③ 赚 50% 现金。
6. **佣金阶梯/权益** — 50% 起；可做简单的"带越多越赚"阶梯展示；强调实时 dashboard、现成推广素材、快速到账。
7. **证言**（可选，占位）— 2–3 条带头像/角色的 partner 引言。
8. **FAQ** — 8 条左右：怎么付/何时付、cookie 时长、仅限首单说明、自我推荐规则、谁能加入、付费流量政策、dashboard、如何提现。
9. **结尾 CTA 横幅** — 重申钩子 + 大 CTA「Get your referral link」。

## 技术约定（遵循本仓库）

- 零构建、纯静态、单文件 `index.html` 自包含（内联 CSS/JS）。
- 在 `prototypes.js` 加一条记录，`slug = 2026-06-09-affiliate-landing`，title/desc/date/cover 填好。
- 封面图可复用 demo 的 `cash_bg_image.jpg` 或截图。

## 占位/待定

- 信任条数字（$ paid / affiliates 数 / cookie 时长）、证言内容为占位，标注"示意"，待 Monica 提供真实数据。
- 佣金阶梯是否真实存在阶梯（如带满 X 单升佣金）待确认；原型先做展示性阶梯。

## 参考

beehiiv `/partners`（结构骨架）、Synthesia `/partners/affiliates`（收益计算器 + 产品型奖励）、ElevenLabs、Webflow、Notion。
