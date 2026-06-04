# Playad / AI Buzz Video Onboarding Demo — 设计文档

- 日期：2026-06-04
- 类型：客户/投资人面向的高保真交互原型（Happy Path）
- 产出：`prototypes/2026-06-04-playad-onboarding/index.html`（单文件、自包含、零构建）

## 1. 目标

复刻 Playad 广告生成平台的 onboarding 流程，改成高级亮色（Light Mode）主题。
全部数据硬编码、用模拟定时器制造「真在运行」的观感。给老板/投资人演示用，无需后端。

## 2. 技术方案

- 单文件 `index.html`，CDN 引入：React 18 + ReactDOM + Babel Standalone（浏览器内编译 JSX）+ Tailwind CDN + Lucide。
- 符合原型库约定：复杂交互用 CDN React+Tailwind 免打包；页面内不放返回导航；单独可分享。
- 往 `prototypes.json` 追加一条记录（slug / title / desc / date / cover），首页卡片自动渲染。
- 所有图形（AI Buzz Video logo、广告海报、灵感参考）用 SVG/CSS 还原，**不依赖外部图片**，避免部署到 Vercel 后图裂。

## 3. 亮色设计规范

| 项 | 值 |
|---|---|
| 全局底色 | `#F9FAFB` |
| 卡片/容器 | 纯白 `#FFFFFF` + `shadow-sm`/`shadow-md` + `border-gray-200` |
| 主文字 | `#111827` |
| 次文字 | `#4B5563` |
| 弱文字 | `#9CA3AF` |
| 主强调色（CTA/进度条/激活态） | 靛紫 `#4F46E5` / `#6366F1` |
| 输入框 | 白底 + `border-gray-300`，聚焦 `focus:border-indigo-500` |
| Hover | `hover:bg-gray-50` / `hover:bg-gray-100` |
| Buzz Agent 品牌色（用于海报） | 橙红 `#E05A47`、奶油 `#F7D290`、黑 `#1D1D1F`、白 `#FFFFFF` |
| 过渡 | `transition-all duration-300`，step 切换淡入 |

## 4. 品牌

- 顶部 chrome（AppShell）品牌：**AI Buzz Video** —— 橙红渐变「B」标记（右上角小闪光）+「AI Buzz Video」黑色字样，SVG/CSS 还原。
- 演示内容是为「Buzz Agent」生成广告，与产品壳品牌一致。

## 5. 状态管理

核心单一 `step`（0–7）+ 局部状态：

| 状态 | 作用 |
|---|---|
| `step` | 主流程 0–7 |
| `modalSubStep` | Step 5 弹窗子步骤（0=Formats,1=Logo,2=Assets） |
| `selectedFormats` | Step 5 选中格式，预选 Feed 4:5 / Stories 9:16 / Reels 9:16 |
| `lightboxAd` | Step 7 点开的海报（null=关闭） |
| `showPaywall` | Step 7 升级弹窗开关 |
| `loadingTextIndex` | Step 3 文案轮播索引 |
| `proTipIndex` | Step 6 Pro Tip 轮播索引 |

定时器用 `useEffect` + `setTimeout/setInterval`，进入对应 step 启动、离开清理。

## 6. 组件拆分

- 每个 step 一个组件：`LoginScreen`(0) / `BasicDetailsForm`(1) / `UrlInputScreen`(2) / `ExtractionLoading`(3) / `BrandDNAResult`(4) / `ConfigModal`(5) / `GenerationLoading`(6) / `Dashboard`(7)
- 通用件：`AppShell`（AI Buzz Video logo + 「重新演示」按钮）、`Modal`（带 backdrop，Step5 与 Paywall 复用）、`AdPoster`（CSS 海报）、`Lightbox`
- 硬编码数据集中在 `DATA` 常量（品牌信息、调色板、target audience、pro tips、scheduler 任务、套餐价格等）

## 7. 各步骤规格（Happy Path）

### Step 0 — Login
左右分栏。左侧 `bg-gray-50`：「Try 3 Creatives Free - no card.」小标签 + hero「Your next best-performing ad, generated in 3 minutes.」+ 副文案 + 静态「Your brand kit」预览卡。右侧白卡：「Continue with Google」（彩色 G 图标）+ Email/Password 输入 + Continue。点任意登录按钮 → Step 1。

### Step 1 — Basic Details
Jordan 头像 + 「Hi there! I'm Jordan, your marketing director. Let's set up your basic details.」白卡内：Name（预填 "Monica Zhou"）、Language 下拉（默认 English）、Timezone 下拉（默认 Asia/Shanghai (CST)）。Continue → Step 2。

### Step 2 — URL Input
顶部文案「Drop your website and we'll make your first ad. I can analyze your brand identity, positioning, and competitors.」下方 3 张 `bg-indigo-50` 特性卡：Extract brand assets / Brand DNA collection / Pinpoint target audience。URL 输入框 placeholder「Enter URL」，预填 `https://app.buzzvideo.ai/`。Continue → Step 3。

### Step 3 — Extraction Loading（模拟 4.5s）
圆形 spinner，文案每 1.5s 切换：Analyzing your website... → Extracting brand assets... → Understanding brand DNA...。4.5s 后自动 → Step 4。

### Step 4 — Brand DNA Result（按截图丰富版）
- 顶部「Your brand DNA」+ 黑底「Completed」徽章
- Brand Name「Buzz Agent」+ `https://app.buzzvideo.ai/`
- Logo / Color / Typography 三栏：Logo 区展示 AI Buzz Video logo；Color 4 色板 `#1D1D1F` `#F7D290` `#F0B86C` `#E05A47`（黑/奶油/橙/橙红）；Typography「Google Sans」「Roboto」
- Brand Knowledge（含小标题 Brand Overview + 段落，预填「Buzz Agent appears to be an AI-powered marketing and ad creation product within the Buzzvideo.ai ecosystem...」）+ Assets 面板
- Countries（United States）/ Languages（English）/ Categories（AI marketing software）chips
- Target Audience：Performance marketers / Startup founders and lean growth teams / Small businesses exploring AI for marketing
- 底部「Generate & Analyze」→ 打开 Step 5 弹窗

### Step 5 — Config Modal（弹窗，3 子步骤）
纯白弹窗 + 柔和遮罩。
- 子步骤1 Formats：6 格网格（含 Feed 4:5、Stories 9:16、Reels 9:16、Square 1:1、Landscape 16:9、Portrait 4:5 等），选中态紫边+图标，预选 Feed 4:5 / Stories 9:16 / Reels 9:16。Next。
- 子步骤2 Logo：展示提取的 logo。Next。
- 子步骤3 Assets：展示 mock 图片素材。Submit。
- Submit → 关弹窗 → Step 6。

### Step 6 — Generation Loading（模拟 5s）
紫色进度 spinner +「Casey is creating ads... This may take a few minutes.」
底部 3 张轮播卡 `bg-indigo-50 border border-indigo-100 text-indigo-900`，PRO TIPS 每 2s 轮播：
1. 3 sec - The first 3 seconds determine 77% of whether users keep watching.
2. 90% of ad recall impact is visual.
3. 70% of campaign performance variance comes from creative quality.
5s 后自动 → Step 7。

### Step 7 — Dashboard
- 标题「Congrats on creating your first ads! Later, you can make video ads too.」
- 左栏 Ad Creatives：3 张 CSS 手绘竖版 Buzz Agent 海报（橙红风格、含标题/logo/CTA），点击开白色全屏 Lightbox（带关闭按钮）
- 左栏 Inspirations：Plai、Celtra 竞品广告参考（CSS 还原）
- 右栏 Scheduler：竖线 `bg-gray-200` 时间轴 + 每日任务列表（如「4 June: Competitor strategy report」）
- Connect 按钮（outline 风格）：Connect Meta / Connect Google / Connect TikTok
- Paywall：点任意 Connect → 「Upgrade Plan」弹窗：Full Time $499/mo（白卡紫色点缀）、CMO $1799/mo（featured + Popular 徽章）、X 关闭

## 8. 重复演示

默认从 Step 0 开始；AppShell 右上角放低调「重新演示」按钮，一键 setStep(0) + 重置局部状态，无需刷新。

## 9. 不做（YAGNI）

- 真实鉴权 / 后端 / 真实网站抓取
- 表单校验（演示走 Happy Path，任意输入都可继续）
- 卡片状态标签、demo 内返回首页导航
- 响应式移动端深度适配（以桌面演示为主，做到不破版即可）
