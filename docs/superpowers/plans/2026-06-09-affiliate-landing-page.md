# Affiliate Program 落地页 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 Buzz Video 做一个完整的 affiliate program 落地页（深色金钱感视觉、50% 仅限首单的真实佣金、收益计算器），并把入口 demo 的「Earn Cash」改为跳转到落地页。

**Architecture:** 复制现有入口 demo 成新文件夹 `prototypes/2026-06-09-affiliate-landing/`。落地页是单文件自包含 `index.html`（内联 CSS/JS），顶部复用入口 topbar 作为情境，点 Earn Cash 滚动到落地页主体。收益计算器用原生 JS，价格表硬编码。最后在 `prototypes.js` 注册新记录。

**Tech Stack:** 纯静态 HTML/CSS/原生 JS，零构建。本地用 Claude Preview 验证，部署靠 `git push`（Vercel）。

**约定提醒：** 按 CLAUDE.md，**不自动 git commit/push**；本计划不含 commit 步骤，由 Monica 手动决定何时提交。验证用浏览器 preview 代替单元测试。

**关联 spec：** `docs/superpowers/specs/2026-06-09-affiliate-landing-page-design.md`

---

### Task 1: 复制 demo 文件夹并改造 topbar 入口跳转

**Files:**
- Create: `prototypes/2026-06-09-affiliate-landing/index.html`（从 `prototypes/2026-06-08-affiliate-program/index.html` 复制后改造）
- Create: `prototypes/2026-06-09-affiliate-landing/assets/`（复制原 `assets/`，含 `cash_bg_image.jpg`）

- [ ] **Step 1: 复制文件夹**

```bash
cp -R "prototypes/2026-06-08-affiliate-program" "prototypes/2026-06-09-affiliate-landing"
```

- [ ] **Step 2: 改造入口行为**

保留 topbar、credits-badge、Earn Cash 按钮、help、avatar。把 `#affiliateBtn` 的点击行为从「toggle 弹窗卡片」改为「平滑滚动到落地页主体 `#landing`」。删除/隐藏原弹窗卡片 `#affiliateCard`（或保留但不再用点击触发——首选删除，避免混淆）。`<body>` 背景改为深色 `#0f0d17` 以衔接落地页。

```js
// 替换原 affiliateBtn 的 click 逻辑
document.getElementById('affiliateBtn').addEventListener('click', () => {
  document.getElementById('landing').scrollIntoView({ behavior: 'smooth' });
});
```

- [ ] **Step 3: 在 topbar 之后加落地页主体骨架**

在 `</div><!-- topbar -->` 之后、`<script>` 之前插入 `<main id="landing"> ... </main>`，内部按后续 Task 填入各 section（先放空的占位 section 标签 + 注释，确保结构存在）。

```html
<main id="landing">
  <section class="hero"><!-- Task 2 --></section>
  <section class="calc"><!-- Task 3 --></section>
  <section class="trustbar"><!-- Task 4 --></section>
  <section class="how"><!-- Task 4 --></section>
  <section class="perks"><!-- Task 4 --></section>
  <section class="faq"><!-- Task 5 --></section>
  <section class="finalcta"><!-- Task 5 --></section>
</main>
```

- [ ] **Step 4: 验证**

用 Claude Preview 打开 `prototypes/2026-06-09-affiliate-landing/index.html`，确认页面加载无报错、topbar 显示正常、点 Earn Cash 能滚动到 `#landing`（即使内容还空）。检查 console 无 error。

---

### Task 2: Hero 首屏

**Files:**
- Modify: `prototypes/2026-06-09-affiliate-landing/index.html`（`.hero` section + 对应 CSS）

- [ ] **Step 1: 写 Hero 结构**

深底居中：小标签 "BUZZ AFFILIATE PROGRAM" → "Earn" → 巨大金渐变「50%」→ "commission on every friend's first purchase" → 副文案 → 主 CTA「Get your referral link →」→ 脚注 "No cost to join · Payouts via Tolt"。

```html
<section class="hero" id="landing-hero">
  <div class="kicker">BUZZ AFFILIATE PROGRAM</div>
  <div class="hero-pre">Earn</div>
  <div class="hero-num">50%</div>
  <h1 class="hero-h1">commission on every friend's first purchase</h1>
  <p class="hero-sub">Share Buzz with your audience. Get real cash for every paying user you bring in — paid out fast.</p>
  <button class="cta-primary" data-tolt>Get your referral link →</button>
  <div class="hero-foot">No cost to join · Payouts via Tolt</div>
</section>
```

- [ ] **Step 2: 写 Hero CSS**

金渐变作用在文字上用 `background:linear-gradient(135deg,#ffd76a,#ff7a1a); -webkit-background-clip:text; background-clip:text; color:transparent;`。`.hero-num` 字号 clamp(72px,12vw,120px)、font-weight 900。`.cta-primary` 用品牌橙渐变 `linear-gradient(135deg,#FFA73C,#FF5255)`、白字、圆角 12px、padding 14px 28px。section 深底 `#0f0d17`，文字白/灰。

- [ ] **Step 3: 接 CTA 跳转**

为所有 `[data-tolt]` 按钮统一绑定（在主 script 里）：

```js
document.querySelectorAll('[data-tolt]').forEach(b =>
  b.addEventListener('click', () =>
    window.open('https://buzzvideo.tolt.com/login', '_blank', 'noopener')));
```

- [ ] **Step 4: 验证**

Preview 重载，截图确认 Hero 视觉（金色 50% 醒目、CTA 橙渐变）。点 CTA 确认新开 Tolt 登录页。preview_resize 到移动宽度确认 50% 不溢出。

---

### Task 3: 收益计算器（核心区）

**Files:**
- Modify: `prototypes/2026-06-09-affiliate-landing/index.html`（`.calc` section + CSS + JS）

- [ ] **Step 1: 写计算器结构**

标题 "See how much you could earn"；套餐切换 chips（Starter/Pro/Ultra，Pro 默认选中）；月付/年付切换；推荐人数滑块（1–50，默认 20）；大数字结果 + 说明行。

```html
<section class="calc">
  <h2>See how much you could earn</h2>
  <div class="plan-chips">
    <button class="chip" data-plan="starter">Starter</button>
    <button class="chip active" data-plan="pro">Pro</button>
    <button class="chip" data-plan="ultra">Ultra</button>
  </div>
  <div class="cycle-toggle">
    <button class="cyc" data-cycle="monthly">Monthly</button>
    <button class="cyc active" data-cycle="yearly">Yearly</button>
  </div>
  <input type="range" id="refRange" min="1" max="50" value="20">
  <div class="ref-label"><span id="refCount">20</span> friends referred</div>
  <div class="earn-num" id="earnNum">$4,200</div>
  <div class="earn-note" id="earnNote">= 20 × $210 · illustrative, based on 50% of first purchase</div>
</section>
```

- [ ] **Step 2: 写计算 JS（硬编码真实价格）**

50% 首单佣金 = 0.5 × 首次付款额。月付首单=月价；年付首单=年总额（折后月价×12）。

```js
const COMMISSION = {           // 50% of first purchase, rounded to .5
  starter: { monthly: 9.5,  yearly: 84  },
  pro:     { monthly: 24.5, yearly: 210 },
  ultra:   { monthly: 44.5, yearly: 378 },
};
let plan = 'pro', cycle = 'yearly';
const range = document.getElementById('refRange');
function renderCalc() {
  const n = +range.value;
  const per = COMMISSION[plan][cycle];
  const total = per * n;
  document.getElementById('refCount').textContent = n;
  document.getElementById('earnNum').textContent =
    '$' + total.toLocaleString('en-US');
  document.getElementById('earnNote').textContent =
    `= ${n} × $${per} · illustrative, based on 50% of first purchase`;
}
document.querySelectorAll('.chip').forEach(c => c.addEventListener('click', () => {
  document.querySelectorAll('.chip').forEach(x => x.classList.remove('active'));
  c.classList.add('active'); plan = c.dataset.plan; renderCalc();
}));
document.querySelectorAll('.cyc').forEach(c => c.addEventListener('click', () => {
  document.querySelectorAll('.cyc').forEach(x => x.classList.remove('active'));
  c.classList.add('active'); cycle = c.dataset.cycle; renderCalc();
}));
range.addEventListener('input', renderCalc);
renderCalc();
```

- [ ] **Step 3: 写计算器 CSS**

深底卡片 `#1e1b2b`、圆角；`.chip.active` / `.cyc.active` 用橙渐变高亮；`.earn-num` 金渐变文字、字号 clamp(40px,8vw,56px)；range 滑块轨道 `#2c2940`、已填充段金色（用 accent-color: #ff7a1a 简化）。

- [ ] **Step 4: 验证**

Preview 重载。用 preview_click 点 Ultra + Yearly，preview_snapshot 确认结果变为 `$378 × 20 = $7,560`；点 Monthly 确认变小。拖 range（preview_eval 改 value 后 dispatch input 事件）确认数字实时更新。确认默认是 Pro·Yearly·20 → `$4,200`。

---

### Task 4: 信任条 + How it works + 权益

**Files:**
- Modify: `prototypes/2026-06-09-affiliate-landing/index.html`（`.trustbar` / `.how` / `.perks` + CSS）

- [ ] **Step 1: 信任条**

一行三个大数字（占位，标注示意）："$120K+ paid to partners" · "1,500+ active affiliates" · "30-day cookie"。加注释 `<!-- 占位数字，待 Monica 提供真实数据 -->`。

```html
<section class="trustbar">
  <div class="stat"><div class="stat-num">$120K+</div><div class="stat-label">paid to partners</div></div>
  <div class="stat"><div class="stat-num">1,500+</div><div class="stat-label">active affiliates</div></div>
  <div class="stat"><div class="stat-num">30-day</div><div class="stat-label">referral cookie</div></div>
</section>
```

- [ ] **Step 2: How it works（3 步）**

```html
<section class="how">
  <h2>How it works</h2>
  <div class="steps">
    <div class="step"><div class="step-no">01</div><h3>Sign up free</h3><p>Get your dashboard and unique referral link in minutes.</p></div>
    <div class="step"><div class="step-no">02</div><h3>Share Buzz</h3><p>Drop your link in your videos, posts and newsletters — grab our ready-made assets.</p></div>
    <div class="step"><div class="step-no">03</div><h3>Earn 50% cash</h3><p>Get 50% of every friend's first purchase, paid out fast via Tolt.</p></div>
  </div>
</section>
```

- [ ] **Step 3: 权益（含轻量阶梯感）**

4 张卡：Real-time dashboard / Done-for-you assets / Fast payouts (Tolt) / 50% — the highest cash rate。卡片网格，深底浅卡。加注释说明阶梯为展示性，待确认是否真实分级。

- [ ] **Step 4: 写对应 CSS**

trustbar 三列居中、stat-num 金渐变；steps 三列网格（移动端堆叠）；perks 卡片 grid `repeat(auto-fit,minmax(220px,1fr))`。

- [ ] **Step 5: 验证**

Preview 重载，preview_snapshot 确认三块结构与文案；preview_resize 到 390px 宽确认三列正确堆叠为单列。

---

### Task 5: FAQ + 结尾 CTA

**Files:**
- Modify: `prototypes/2026-06-09-affiliate-landing/index.html`（`.faq` / `.finalcta` + CSS + JS）

- [ ] **Step 1: FAQ（原生 details/summary 折叠）**

8 条：How and when do I get paid? / What's the commission? / Is it only the first purchase?（明确「Yes — 50% of your friend's first payment」）/ How long does the referral cookie last? / Who can join? / Can I refer myself?（No）/ Can I run paid ads? / Where do I track earnings? 用 `<details><summary>`，无需 JS。

```html
<section class="faq">
  <h2>FAQ</h2>
  <details><summary>Is the 50% only on the first purchase?</summary>
    <p>Yes — you earn 50% of your friend's first payment. Yearly plans mean a bigger first payment, so a bigger payout for you.</p></details>
  <!-- 其余 7 条同结构 -->
</section>
```

- [ ] **Step 2: 结尾 CTA 横幅**

深底/橙渐变横幅：大标题 "Ready to earn?" + 副句 "Turn the recommendations you're already making into real cash." + 大 CTA「Get your referral link →」(`data-tolt`，复用 Task 2 的统一绑定)。

- [ ] **Step 3: 写 CSS**

faq details 深底卡、summary 可点光标、展开内容灰字；finalcta 满宽橙渐变或深底+金标题、CTA 居中。

- [ ] **Step 4: 验证**

Preview 重载，preview_click 展开一条 FAQ 确认内容显示；点结尾 CTA 确认开 Tolt。整页从上到下截一张长图确认整体视觉连贯（深色金钱感一致）。

---

### Task 6: 在 prototypes.js 注册新 demo

**Files:**
- Modify: `prototypes.js`（数组首部加新记录）

- [ ] **Step 1: 加记录**

`slug` 必须等于文件夹名。封面复用 `cash_bg_image.jpg`（或后续换截图）。

```js
{
  slug: "2026-06-09-affiliate-landing",
  title: "Affiliate Program 落地页",
  desc: "完整 affiliate 落地页:巨大 50% 佣金 hero、收益计算器(真实 Buzz 价格)、How it works、权益、FAQ、结尾 CTA。入口 Earn Cash 跳本页。",
  date: "2026-06-09",
  cover: "cash_bg_image.jpg",
},
```

（确认字段名与 `prototypes.js` 现有记录一致：`slug/title/desc/date/cover`。）

- [ ] **Step 2: 验证**

用 Preview 打开仓库根 `index.html`（画廊首页），确认新卡片「Affiliate Program 落地页」出现在最前（date 最新），封面图显示，点击进入新落地页。

---

### Task 7: 整页终检

- [ ] **Step 1:** Preview 打开新 demo，console 无 error/warning。
- [ ] **Step 2:** 三档断点（375 / 768 / 1280）各截一张图，确认布局不溢出、文字不被裁。
- [ ] **Step 3:** 全部 CTA（hero / finalcta）都能开 `buzzvideo.tolt.com/login`。
- [ ] **Step 4:** 计算器四个套餐 × 两种周期切换数字正确（对照 spec 佣金表）。
- [ ] **Step 5:** 把待 Monica 提供的占位项（信任条数字、是否真实阶梯）整理成一句话清单反馈给 Monica。
