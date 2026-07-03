# design.md — 原型设计规范

> 给 Claude 看的设计基线。Monica 让 Claude 做原型 demo 时，**先读这份文档**，按这里的品牌色、字体、组件 token、交互规范来做，保证所有原型视觉一致、像同一个产品出来的。
>
> 配套约定见 `CLAUDE.md`(技术栈/架构/加新 demo 的步骤)。本文件只管「长什么样、怎么交互」。

---

## 0. 一句话定位

**Buzz / BuzzVideo 品牌的产品原型**——暖橙色调、圆润、有呼吸感的现代 SaaS 落地页风格。基调:**温暖、活泼、可信**,不是冷淡的科技蓝,也不是花哨的消费风。

---

## 1. 品牌色

主色系是 **Buzz 橙**,已定义在 `src/app/globals.css` 的 `@theme` 里,优先用这些变量/十六进制,不要临时造色。

| 角色 | 值 | 用途 |
|---|---|---|
| **Accent A** | `#ff9a3d` / `--color-accent-a` | 橙渐变浅头 |
| **Accent B** | `#ff5e1a` / `--color-accent-b` | 主橙,文字强调、focus ring、icon |
| **CTA A** | `#ffa73c` / `--color-cta-a` | 主按钮渐变浅头(注意大写写法 `#FFA73C`) |
| **CTA B** | `#ff5255` / `--color-cta-b` | 主按钮渐变深头(偏红) |
| **Ink** | `#1a1a2e` / `--color-ink` | 主文字/标题色(深蓝黑,不用纯黑) |
| **Warm** | `#faf8f6` / `--color-warm` | 暖白区块底色(隔段用) |

**派生色**(代码里反复出现,沿用即可):

- 正文次要文字 `#6a6b7b`(暖灰)
- 边框/分隔线 `#ececf1`,hover 边框 `#d4d3df`
- 浅橙底(kicker/卡片封面)`#fff3ec`、`#fff7f1`、`#ffe7d6`
- Hero 渐变底 `linear-gradient(160deg,#ffe7d2 0%,#ffffff 52%,#ffdedf 100%)`
- 深色气泡/滑块 `#1f2030`、`#141414`(视频墙底部遮罩)

> shadcn 的中性 token(`--background`/`--foreground`/`--muted` 等)是 oklch 灰阶,用于通用 UI 骨架;**品牌表达一律走上面的橙色**。

### 两个招牌渐变

```
文字渐变 (gradText):  bg-gradient-to-r from-[#ffc078] to-[#ff5e1a] bg-clip-text text-transparent
CTA 渐变 (按钮/图标块): bg-gradient-to-br from-[#FFA73C] to-[#FF5255]
```

大数字、关键词、hero 副标题词用 `gradText`;所有主行动按钮、step 图标块、激活态 chip 用 CTA 渐变。

---

## 2. 字体

> **新规范(2026-07 起,今后所有新页面都按此):字体一律用苹果系统字体**,不再引入 Inter / Plus Jakarta Sans。标题与正文用同一套系统字体,靠字重 + 字号拉层级。
>
> 字体栈(整页容器上挂,子孙继承即可):
> ```
> -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif
> ```
> 落地方式:页面根容器 `style={{ fontFamily: APPLE_FONT }}`(见 `starter-guide` 里的 `APPLE_FONT` 常量),不要再写 `font-[family-name:var(--font-display)]`。标题只留 `font-extrabold tracking-tight text-[#1a1a2e]`。

**历史遗留(旧页面仍在用,新页面不要再用):**

| 用途 | 旧字体 | 变量 | 说明 |
|---|---|---|---|
| 正文 | ~~Inter~~ | `--font-sans` | 旧默认,`html` 已挂 `font-sans` |
| 标题/大数字 | ~~Plus Jakarta Sans~~ | `--font-display` | 旗舰页等旧原型仍在用,勿动 |

**字号节奏**(用 `clamp` 做响应式,沿用现成档位):
- Hero H1:`clamp(34px,6vw,64px)`,`leading-[1.08]`
- Section H2:`clamp(28px,4vw,40px)`
- 巨型数字(计算器/统计):`clamp(40px,8vw,56px)` ~ `clamp(52px,9vw,88px)`,配 `tabular-nums`
- 正文:15–19px,次要说明 13px,`leading-relaxed`

---

## 3. 复用样式 Token(直接抄)

旗舰页 `src/app/prototypes/2026-06-09-affiliate/page.tsx` 顶部定义了三个 helper,做新原型时**复制这三段**,别重写:

```ts
// 文字渐变
const gradText =
  "bg-gradient-to-r from-[#ffc078] to-[#ff5e1a] bg-clip-text text-transparent";

// 主 CTA 按钮
const ctaBtn =
  "h-auto rounded-xl bg-gradient-to-br from-[#FFA73C] to-[#FF5255] px-7 py-3.5 " +
  "text-base font-bold text-white shadow-[0_10px_30px_rgba(255,82,85,0.28)] " +
  "transition hover:brightness-105 hover:shadow-[0_14px_38px_rgba(255,82,85,0.4)]";

// 小标签(section 上方的橙色 kicker)
const kicker =
  "inline-block rounded-full bg-[#fff3ec] px-3.5 py-1.5 text-[13px] font-bold " +
  "uppercase tracking-[0.14em] text-[#ff5e1a]";
```

**次级按钮**(outline):`rounded-xl border-[#ececf1] bg-white px-6 py-3.5 text-base font-bold text-[#1a1a2e] hover:border-[#ff5e1a] hover:bg-[#fff7f1]`

---

## 4. 圆角 · 阴影 · 间距

- **圆角**:小元素/输入框/按钮 `rounded-xl`;卡片 `rounded-2xl` 或 `rounded-[18px]`;大容器/计算器 `rounded-[22px]`~`rounded-[28px]`;chip/标签/气泡 `rounded-full`。整体偏圆润。
- **阴影**(柔、暖、低对比):
  - 卡片:`shadow-[0_4px_16px_rgba(26,26,46,0.06)]`
  - CTA:`shadow-[0_10px_30px_rgba(255,82,85,0.28)]`,hover 加深
  - 悬浮元素/视频:`shadow-[0_16px_36px_rgba(26,26,46,0.2)]`
- **section 节奏**:左右 `px-6`,上下 `py-20`(hero 用 `py-[110px]`);内容容器 `mx-auto max-w-[1040px]`(画廊首页用 `max-w-6xl`)。
- **隔段配色**:白 → 暖白 `#faf8f6` → 白 交替,制造层次,不靠分隔线。
- **卡片内边距**:`p-7`~`p-9`(约 28–36px)。

---

## 5. 组件库

用 **shadcn/ui + lucide-react**,现有组件在 `src/components/ui/`:`button` `card` `badge` `accordion` `slider`。需要新组件时按 shadcn 方式加。

惯用模式:
- **FAQ** → `Accordion type="single" collapsible`,每项独立成卡(`rounded-2xl border bg-white`,带柔阴影)。
- **选择器** → 自定义 `Chip`(圆角方块,激活态填 CTA 渐变 + 阴影,未激活灰字描边)。
- **滑块** → shadcn `Slider`,range/thumb 染成 `#1f2030`,顶部跟随气泡显示当前值。
- **图标** → lucide,放在 CTA 渐变的圆角方块里(`size-11 rounded-[11px]`)做 step/feature 图标。
- **图标按钮 hover** → 箭头类(`ArrowRight`/`ArrowUpRight`)轻微位移 `group-hover:translate-x-0.5`。

---

## 6. 交互 / 动效规范

- **过渡**:统一 `transition`(默认时长即可),只动 transform / shadow / brightness / color,不做夸张动画。
- **hover 反馈**:
  - 卡片:`hover:-translate-y-0.5 hover:shadow-md`(轻微上浮)。
  - 主按钮:`hover:brightness-105` + 阴影加深。
  - 链接卡内箭头:微位移。
- **focus**:输入框 `focus-visible:border-[#ff5e1a] focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/20`(橙色细光环)。
- **页内跳转**:锚点滚动用 `scrollIntoView({ behavior: "smooth" })`。
- **外链**:`window.open(url, "_blank", "noopener")`;站内用 `next/link`。
- **数字**:计算/统计数字用 `tabular-nums` + `toLocaleString("en-US")` 加千分位。
- **克制**:不用 framer-motion 之类重动画;原型重在表达布局与流程,微交互够用即可。`tw-animate-css` 已引入,需要时用现成 class。

---

## 7. 文案语气

- 落地页文案用**英文**(产品面向海外,如 BuzzVideo affiliate);UI 注释、画廊首页、说明文字用**中文**。
- 标题短促有力(`How it works` / `Real partners. Real revenue.`),正文口语、第一人称证言。
- kicker 全大写 + 宽字距;正文句子化。

---

## 8. 响应式

- 移动优先,`sm:` `md:` `lg:` 渐进增强。
- 卡片网格:首页 `sm:grid-cols-2 lg:grid-cols-3`;内容区 `md:grid-cols-3`。
- 字号全程 `clamp()`,无需写多套断点。
- 容器 `max-w-[1040px]` / `max-w-6xl` 居中,两侧留白。

---

## 9. 做新原型时的检查清单

1. 复制 `gradText` / `ctaBtn` / `kicker` 三个 helper。
2. 标题套 `font-[family-name:var(--font-display)] font-extrabold tracking-tight text-[#1a1a2e]`。
3. section 用 `px-6 py-20` + `mx-auto max-w-[1040px]`,白/暖白交替隔段。
4. 主按钮一律 CTA 渐变;强调词/大数字用 `gradText`。
5. 卡片 `rounded-2xl border border-[#ececf1] bg-white` + 柔阴影 + hover 上浮。
6. 颜色只从第 1 节取,不临时造色。
7. 参照旗舰页 `2026-06-09-affiliate` 当样板。

> **黄金法则**:拿不准时,打开 `src/app/prototypes/2026-06-09-affiliate/page.tsx` 抄它的写法——它是这套规范的活样板。
