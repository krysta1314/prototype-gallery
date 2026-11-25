# design.md — 原型设计规范

> 给 Claude 看的设计基线。Monica 让 Claude 做原型 demo 时，**先读这份文档**，按这里的品牌色、字体、组件 token、交互规范来做，保证所有原型视觉一致、像同一个产品出来的。
>
> 配套约定见 `CLAUDE.md`(技术栈/架构/加新 demo 的步骤)。本文件只管「长什么样、怎么交互」。

---

## 0. 一句话定位

**Buzz / BuzzVideo 品牌的产品原型**——暖橙色调、圆润、有呼吸感的现代 SaaS 落地页风格。基调:**温暖、活泼、可信**,不是冷淡的科技蓝,也不是花哨的消费风。

## 0.5 先分清：功能原型 vs 落地页(2026-11-25 Monica 定)

| 做的是什么 | 按哪套规范 |
|---|---|
| **功能原型**:真实产品界面——工具页、生成页、画布、设置、弹窗、表单、后台、Marketing Agent、3D Studio 等 Web 端功能 | **§P 产品 UI 规范(开发给的,下一节)**。颜色、字号、控件高度、圆角、阴影、状态一律照它，和下面 1–9 冲突时 **§P 优先** |
| **落地页 / 营销页**:官网、活动页、定价宣传、帮助中心等，Monica 会给参考页面 | **按她给的参考页面设计**,品牌基调参考下面 1–9(暖橙、去 AI 味规则)。§P 的控件写法(下拉、输入框、焦点环)仍建议沿用 |
| **APP 原型**(React Native) | §10 APP 规范(§P 是 Web client 规范) |

> 拿不准算哪类时先问 Monica。一个页面两种都有(如官网里嵌的产品界面截图/演示块)时，产品界面那块按 §P。

---

## §P 产品 UI 规范(BuzzVideo 设计规范，开发整理，2026-11-25)

> 来源：开发整理给 Monica 的《BuzzVideo 设计规范(给原型 agent)》,原文照录。**功能原型必须遵守**,还原真实 client 的颜色、字号、控件高度、状态写法。原型仓库是 Tailwind v4,下面「还原写法」直接写了数值，不依赖 client 的 token。
>
> 与本文件其他章节的差异，做功能原型时**以本节为准**:主文字 `#250B03`(§1.0 是 `#240A03`)、危险色 `#EB502D`、悬停底 `#F5F5F5`(不是 `#FFF8F6`)、控件圆角 8px `rounded-md`(不是 `rounded-xl`)、卡片圆角 12px 且不超过 16px、输入框聚焦淡环 3px 12%(不是 2px 20%)、焦点环一律 `#FF5E1A`、卡片阴影 `0 1px 2px rgb(0 0 0/.05)`、禁止渐变字和彩色光晕阴影。下拉直接用 `src/components/ui/dropdown-select.tsx` 的 `DropdownSelect`(已按本节改好，档位 `sm`/`md`/`lg`)。

### 颜色

深色主题不是浅色的反转：底色用近黑冷灰 #121418（不用纯黑），表面越高越亮（#121418 → #1B1E24 → #252931 → #2E333D）并配 1px 淡边框；主文字 #E6E8EC，次要文字在各层表面上都 ≥4.5:1；品牌色和强调色换成更浅、更柔和的版本，品牌渐变 / 危险色做底时配深色字。

#### 品牌（只用在点火时刻，一屏 ≤10%）

| 名称 | 浅色 | 深色 | CSS 变量 | client 类名 | 用在 |
| --- | --- | --- | --- | --- | --- |
| 品牌渐变 | #FFA73C → #FF5255（135°） | #F9B36C → #F58488（135°，配深色字） | --brand-gradient | bg-brand-gradient | 生成 / 创建 / 发送 / 升级按钮、生成完成状态 |
| 余烬珊瑚 | #FF734D | #F89A77 | --brand-secondary | text-brand-secondary | 小面积品牌点缀；不做按钮底色 |

#### 交互（状态色，不是装饰色）

| 名称 | 浅色 | 深色 | CSS 变量 | client 类名 | 用在 |
| --- | --- | --- | --- | --- | --- |
| 交互橙 | #FF5E1A | #FB9960 | --interactive / --ring | ring-ring · border-interactive · text-interactive · bg-interactive | 键盘聚焦环、输入框聚焦描边、当前选中的指示（下拉对勾、单选圆点、滑块进度、下划线标签） |

#### 语义

| 名称 | 浅色 | 深色 | CSS 变量 | client 类名 | 用在 |
| --- | --- | --- | --- | --- | --- |
| 危险陶土 | #EB502D | #F47E71 | --danger | border-danger · text-danger | 出错描边、删除入口悬停 |
| 深陶土 | #C93D1C | #F18A7E（配深色字） | --danger-strong | bg-danger-strong | 删除确认按钮底色（白字 5.04:1） |
| 成功绿 | #10A239 | #5EC98B | --success | text-success | 成功反馈 |
| 警示琥珀 | #FFBF00 | #F5C147 | --warning | text-warning | 警告 |

#### 中性（暖墨调，禁止冷蓝灰）

| 名称 | 浅色 | 深色 | CSS 变量 | client 类名 | 用在 |
| --- | --- | --- | --- | --- | --- |
| 墨色 | #250B03 | #E6E8EC | --primary-text | text-foreground | 主文字 |
| 烟灰 | #6F6C6C | #A6ABB5 | --secondary-text | text-secondary-text | 次要文字、未选中的勾选框 / 单选描边 |
| 浅灰 | #9E9E9E | #9196A1 | --third-text | text-muted-foreground | 第三级文字、占位符；不得用于正文 |
| 占位灰 | #C9C9C9 | #4E545F | --placeholder-text | border-placeholder | 输入框悬停描边 |
| 发丝线 | #E8E8E8 | #2F333C | --border | border-border · border-input | 所有边框与分隔线 |
| 悬停灰 | #F5F5F5 | #252931 | --accent | bg-accent | 按钮 / 选项悬停底色 |
| 亮面 | #F7F7F7 | #1B1E24 | --bg-light | bg-[hsl(var(--bg-light))] | 卡片底（白底页面上） |
| 纯白 | #FFFFFF | #121418 | --background | bg-background | 页面底、输入框底、浮层底 |

### 字号（client 用 t-* 类，原型按数值写）

| 类名 | 字号 / 行高 · 字重 | 用在 |
| --- | --- | --- |
| t-h1 | 48 / 64 · 700 | 营销 hero 主标题 |
| t-h3 | 32 / 44 · 700 | 区块标题 |
| t-h5 | 24 / 32 · 700 | 页面标题 |
| t-h7 | 18 / 24 · 700 | 卡片、面板、弹窗标题 |
| t-s1 | 16 / 20 · 600 | 页面级标签页、小节标题 |
| t-s2 | 14 / 20 · 600 | 面板内标签页、字段标题 |
| t-b1 | 16 / 20 · 500 | 正文（大） |
| t-b2 | 14 / 20 · 500 | 正文、常规 UI 文字 |
| t-b3 | 12 / 20 · 500 | 辅助说明 |
| t-lb | 16 / 20 · 600 | xl 按钮文字 |
| t-mb | 14 / 20 · 700 | md / lg 按钮文字 |
| t-sb | 12 / 16 · 700 | xs / sm 按钮文字、标签 |

### 圆角

| 名称 | 数值 | 类名 | 用在 |
| --- | --- | --- | --- |
| 控件 | 8px | rounded-md | 按钮、输入框、下拉、分段外框（全部档位） |
| 浮层 / 卡片 | 12px | rounded-xl | 下拉菜单浮层、卡片 |
| 胶囊 | 9999px | rounded-full | 标签、角标、32px 圆形图标按钮、媒体上的按钮 |

### 阴影

| 名称 | 数值 | 用在 |
| --- | --- | --- |
| rest | 0 1px 2px rgb(0 0 0 / .05) | 卡片 |
| floating | 0 4px 12px rgb(37 11 3 / .08) + 1px 发丝线描边 | 下拉菜单、弹层 |
| 禁止 | 彩色光晕、≥16px 大扩散阴影 + 描边同时用 | — |

### 控件尺寸（全站只用五档高度）

| 档 | 高度 | 字号 | 用在 |
| --- | --- | --- | --- |
| xs | 28px | 12px | 表格行内、结果卡片里的小操作、行内改名 |
| sm | 32px | 12px | 紧凑面板（画布节点、3D Studio 检查器）、筛选条 |
| md | 36px | 14px | 弹窗（Dialog）里的表单与底部按钮；输入框上的弹层（Model Settings、模型档位） |
| lg | 40px | 14px | 设置页、工具页左栏、参数面板常规态。Input / Select / 分段的默认档 |
| xl | 44px | 16px | 登录注册等独立表单页、整行宽的页面主操作。Button 的默认档 |

1. 同一行里的控件同一档（输入框旁的按钮、分段旁的下拉高度一致）
2. 一个容器只用一档，主操作按钮除外
3. 手机上可输入的控件字号一律 16px（防 iOS 聚焦放大）
4. 用组件的 size 选档，不要用 h-* / size-* 自己改高度

### 状态（所有交互组件）

| 状态 | 输入类（输入框、下拉触发器） | 点按类（按钮、分段、开关、勾选、单选、标签、滑块） |
| --- | --- | --- |
| 常态 | 1px 发丝线 #E8E8E8 描边，白底 | 各组件自己的样子 |
| 悬停 | 描边加深到 #C9C9C9（唯一例外：首页主输入框悬停是 #FFD0B8 淡橙描边 + 2px 10% 橙光圈） | 底色 #F5F5F5，或文字烟灰 → 墨色；悬停不出橙 |
| 按下 | — | 底色再深一档，不位移不缩放 |
| 键盘聚焦 | 描边 #FF5E1A + 3px 12% 同色淡环 | 2px #FF5E1A 实心环 + 2px 白隙（分段控件画在选项内侧） |
| 选中 | — | 下拉：加粗 + 右侧橙勾；单选：橙圈橙点；勾选：品牌渐变；分段：白色滑块；标签：墨色字 + 橙下划线 |
| 禁用 | 50% 透明，不响应悬停 | 50% 透明，不响应悬停 |
| 出错 | 描边 #EB502D；聚焦时淡环也变红（红优先于橙） | 勾选框描边变红 |
| 加载中 | — | 按钮：文字不变、不可点；有图标时图标换转圈 |

### 组件

#### Button 按钮

- 用途：按「做什么」选款，不按颜色选。弹窗底部：Outline 取消在左、Primary 确认在右，同一档。
- 不要：不要手写渐变按钮、不要给 default 款加 className 改成品牌色、不要加彩色光晕阴影。
- 尺寸：xs 28 · sm 32 · md 36 · lg 40 · xl 44（默认）；图标按钮 icon-xs / icon-sm / icon-md / icon-lg（正方形同档），cta = 32 圆形
- client 组件：`@/components/ui/button`

| 款式 | 用在 |
| --- | --- |
| brand 点火 | 生成、创建、发送、升级、开始试用。一屏最多一个 |
| default Primary | 保存、确认、提交，弹窗确认键；同屏第二个强调操作 |
| outline 次要 | 取消、下载、与主操作并排的第二个操作、卡片里的文字操作 |
| ghost 弱 | 工具栏、面板标题栏、卡片角落、行内操作；图标按钮默认用它 |
| ghostDanger 删除入口 | 卡片 / 列表上的垃圾桶 |
| destructive 危险 | 只用在删除确认弹窗的确认键 |
| link 文字 | 句子里的操作：Upgrade、Learn more |
| overlay 媒体上 | 压在图片 / 视频上的全屏、关闭、播放（圆形） |
| 立体 Create（SendButton hero） | 只用在整块输入区的提交键（首页 / Marketing Agent 的 Create、工具页 Generate、3D Studio、画布合并视频）和营销页 CTA 卡片 |

还原写法：
```
brand:      h-9 px-3 rounded-md text-sm font-bold text-white bg-[linear-gradient(135deg,#FFA73C,#FF5255)] hover:brightness-105 active:brightness-[.94]
primary:    h-9 px-3 rounded-md text-sm font-bold text-[#FAFAFA] bg-black hover:bg-black/85 active:bg-black/75
outline:    h-9 px-3 rounded-md text-sm font-bold text-[#250B03] bg-white border border-[#E8E8E8] hover:border-[#C9C9C9] hover:bg-[#F5F5F5] active:bg-black/[.07]
ghost:      h-9 px-3 rounded-md text-sm font-bold text-[#250B03] hover:bg-[#F5F5F5] active:bg-black/[.07]
destructive:h-9 px-3 rounded-md text-sm font-bold text-white bg-[#C93D1C] hover:brightness-90
聚焦（全部）：focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5E1A] focus-visible:ring-offset-2
禁用（全部）：disabled:opacity-50 disabled:pointer-events-none
```

client 用法：
```tsx
<Button variant="outline" size="md"><Download />Download</Button>
<Button variant="brand" loading>Generate</Button>
```

#### Input / Textarea 输入框

- 用途：单行 / 多行文字输入。出错交给 aria-invalid（表单里 FormControl 自动加）。
- 不要：不要在调用处写 border-destructive、focus:ring-xxx 改聚焦色。框里还有 chip / 按钮 / 单位时，外壳用 FIELD_WITHIN_STATE（同一套状态，由框内获得焦点触发），不要手写 focus-within:ring-*；只是图标 + 输入框就直接用 <Input> 加绝对定位图标。
- 尺寸：Input：sm 32 · md 36 · lg 40（默认）· xl 44。Textarea：sm / md（默认），高度按 rows
- client 组件：`@/components/ui/input · @/components/ui/textarea`

还原写法：
```
h-10 w-full rounded-md border border-[#E8E8E8] bg-white px-3 text-sm placeholder:text-[#9E9E9E]
hover:border-[#C9C9C9]
focus-visible:outline-none focus-visible:border-[#FF5E1A] focus-visible:ring-[3px] focus-visible:ring-[#FF5E1A]/[.12]
aria-[invalid=true]:border-[#EB502D] aria-[invalid=true]:focus-visible:ring-[#EB502D]/[.12]
disabled:opacity-50 disabled:cursor-not-allowed
组合输入框外壳（邮箱 chip、聊天输入区）：同上，把 focus-visible: 换成 focus-within:；框内输入带 aria-invalid 时整框变 #EB502D
```

client 用法：
```tsx
<Input size="md" placeholder="Search" />
<Textarea rows={3} aria-invalid={!!error} />
```

#### Select / ModelSelect 下拉

- 用途：5 个以上的单选，或选项需要说明文字。档位写在 <Select size> 根上，触发器和选项行都跟着。
- 不要：2–4 个、需要一眼看全的选项用分段控件。不要用原生 <select>（打开后是系统菜单，改不了样式）。
- 尺寸：sm 32 · md 36 · lg 40（默认）；ModelSelect 的 compact = md
- client 组件：`@/components/ui/select · @/components/flow-canvas/panel/panels/model-select`

还原写法：
```
触发器：同输入框，外加 data-[state=open]:border-[#FF5E1A] data-[state=open]:ring-[3px] data-[state=open]:ring-[#FF5E1A]/[.12]；箭头 #6F6C6C，展开时转 180°
浮层：rounded-xl border border-[#E8E8E8] bg-white p-1 shadow-[0_4px_12px_rgb(37_11_3/.08)]，选项之间 2px
选项：min-h-9 rounded-md px-2.5 text-sm；悬停 / 方向键高亮 bg-[#F5F5F5]；选中 font-semibold + 右侧 #FF5E1A 对勾（不加底色）；禁用 opacity-50，原因文字用 #6F6C6C
```

client 用法：
```tsx
<Select size="md" value={v} onValueChange={setV}>
  <SelectTrigger><SelectValue /></SelectTrigger>
  <SelectContent><SelectItem value="1080p">1080p</SelectItem></SelectContent>
</Select>
```

#### SegmentedControl 分段

- 用途：2–4 个、需要一眼看全的单选（分辨率、时长、比例、开关式 Yes/No）。
- 不要：选项多到要横向滚动时改用下拉。
- 尺寸：xs 28 · sm 32 · md 36 · lg 40（默认），档位 = 外框总高；竖排（图标在上）字号小一档
- client 组件：`@/components/ui/segmented-control`

还原写法：
```
外框：rounded-md bg-black/[.04] p-1（lg）/ p-[3px]（sm、md）
选项：h-8 flex-1 text-sm font-medium text-[#6F6C6C] hover:text-[#250B03]
选中：白色滑块 bg-white shadow-[0_1px_2px_rgba(0,0,0,.06),0_1px_3px_rgba(0,0,0,.04)] rounded-[4px]，文字 #250B03
聚焦：focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FF5E1A]
```

client 用法：
```tsx
<SegmentedControl size="lg" value={v} onValueChange={setV} options={[{ value: "720p", label: "720p" }]} />
```

#### Switch 开关

- 用途：立即生效的开 / 关。一行「标签 + 开关」，开关在右。
- 尺寸：md 48×24（默认）· sm 36×20（紧凑行）
- client 组件：`@/components/ui/switch`

还原写法：
```
开：bg-[linear-gradient(90deg,#FFA53D,#FF5254)]；关：同渐变 30% 透明；禁用关：#C9C9C9；滑块白色 16px；聚焦 2px #FF5E1A 环 + 2px 白隙
```

client 用法：
```tsx
<Switch checked={on} onCheckedChange={setOn} aria-label="With audio" />
```

#### Slider 滑块

- 用途：连续数值（速度、音量、降噪强度）。当前值写在标签行右侧（text-xs tabular-nums），不配数字输入框。
- 尺寸：一种：轨道 6px、圆点 16px
- client 组件：`@/components/ui/slider`

还原写法：
```
轨道 h-1.5 rounded-full bg-[#E8E8E8]；已拖过的一段 bg-[#FF5E1A]；圆点 size-4 rounded-full border-2 border-[#FF5E1A] bg-white，悬停 / 拖动外加 shadow-[0_0_0_4px_rgb(255_94_26/.12)]
```

client 用法：
```tsx
<Slider value={[v]} onValueChange={([n]) => setV(n)} min={0} max={1} step={0.1} />
```

#### Checkbox / Radio 勾选与单选

- 用途：勾选：可多选或同意条款；单选：2–5 个互斥选项且需要竖排说明时（否则用分段）。
- 尺寸：一种：16px；点击区靠整行 <label> 扩大
- client 组件：`@/components/ui/checkbox · @/components/ui/radio-group`

还原写法：
```
未选：border border-[#6F6C6C]，悬停 border-[#250B03]；勾选：品牌渐变底 + 白勾；单选选中：border-[#FF5E1A] + 8px #FF5E1A 圆点
```

client 用法：
```tsx
<label className="flex items-center gap-2"><Checkbox checked={c} onCheckedChange={setC} />Agree</label>
```

#### Tabs 标签页（下划线款）

- 用途：同一区域里切换几块内容（Results / Guide）。
- 不要：不要用渐变文字做选中态。
- 尺寸：lg 16px（页面级，默认）· md 14px（面板内）
- client 组件：`@/components/ui/tabs`

还原写法：
```
未选 text-[#6F6C6C]，悬停 text-[#250B03]；选中 text-[#250B03] font-semibold + 底部 2px #FF5E1A 下划线（rounded-full）
```

client 用法：
```tsx
<TabsList variant="underline"><TabsTrigger value="results" variant="underline" size="md">Results</TabsTrigger></TabsList>
```

### 要做

- 品牌渐变只给点火时刻：主 CTA、生成中 / 完成、升级入口，一屏 ≤10%
- 中性色用暖墨调（#250B03 / #6F6C6C / #E8E8E8 / #F5F5F5）
- 每个交互组件配齐「状态」表里的全部状态，键盘聚焦只用 #FF5E1A
- 生成等待用骨架屏 + shimmer 扫光，不在内容区中央放孤立 spinner
- 所有动效保留 prefers-reduced-motion 降级
- 素材预览贴近 TikTok / IG / FB 的真实比例（竖屏 9:16 等）

### 不要做

- 冷蓝灰（#1a1a2e、#6a6b7b、#9a9bb0、#ececf1、#e1e3e9、#f3f4f6 等 slate 灰）
- 渐变文字（只允许营销 hero 标题里的品牌短语）
- 彩色光晕阴影；1px 描边 + ≥16px 大扩散阴影同时用
- 低透明度的焦点环（如 #FF5E1A 40%：叠在白底上只有 1.59:1）
- 输入框聚焦时外圈带白隙（ring-offset）或用别的颜色：输入类只有「橙描边 + 3px 12% 淡环」这一种样子，组合输入框外壳也一样
- 各自定的焦点环颜色：品牌渐变色、墨色、白色、红色都不行，深色底和图片上也用 #FF5E1A
- 原生 <select>、自己画开关 / 下拉 / 标签页
- 用 #9E9E9E 及更浅的灰做正文；卡片圆角超过 16px

---

## 1. 品牌色

> **1–9 节主要管落地页 / 营销页**(及 §P 之前的旧原型)。做功能原型时以 §P 为准。

### 1.0 官方色板(落地页的配色依据,2026-11-18 Monica 给的设计规范 Color 页;功能原型用 §P 的颜色)

**配色一律从这张表取，不自己压暗 / 派生新色。** 下面 1.x 的旧值(`#1a1a2e`、`#6a6b7b`、`#ececf1` 等)是早期原型沿用的，新页面用这里的官方值;旧页面不追改。

| 组 | 名称 | 值 | 备注 |
|---|---|---|---|
| Brand | Primary brand color | `#FFA73C → #FF5255` 渐变 | 有 90%–10% 透明度梯度 |
| Brand | Secondary brand color | `#FF744D` | 有 90%–10% 透明度梯度;悬停、强调线 |
| Secondary | Success | `#10A43A`(浅底 `#F3FDF3`) | |
| Secondary | Warning | `#FFC100`(浅底 `#FFF9E6`) | |
| Secondary | Danger | `#EB3C2C`(浅底 `#FFEEED`) | |
| Secondary | Info 橙 | `#EC913A`(浅底 `#FEF7E8`) | |
| Secondary | Info 灰 | `#BDBDBD`(浅底 `#F5F5F5`) | |
| Secondary | Info 蓝 | `#49A5FF`(浅底 `#E8F4FF`) | |
| Neutral | Primary text | `#240A03` | 正文 / 标题(替代旧 `#1a1a2e`) |
| Neutral | Secondary text | `#6F6C6C` | 次级文字(替代旧 `#6a6b7b` / `#5d5e6e`) |
| Neutral | Third text | `#9F9F9F` | 白底上对比度不足 4.5:1,只用于大字或深底 |
| Neutral | Placeholder text | `#CACACA` | 输入框占位 / 深底上的次级字 |
| Neutral | Border | `#E8E8E8` | 边框、分隔线(替代旧 `#ececf1`) |
| Neutral | dropdown bg | `#F6F6F6` | 下拉菜单、标签底、页脚底条 |
| Neutral | hover bg | `#FFF8F6` | 悬停底色 |
| Neutral | Basic black / white | `#000000` / `#FFFFFF` | |
| Neutral | Mask | `#000000` 75% / 50% / 30% | 遮罩 |
| Gradient | CTA | `#FFA73C → #FF5255` | 主行动按钮 |

已按官方色板落地的：官网页脚(`(v1.16)/site-nav/SiteFooter.tsx`,白底 + `#240A03` 字 + CTA 渐变按钮)。

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
CTA 渐变 (按钮/图标块): bg-gradient-to-r from-[#FFA73C] to-[#FF5255]
```

~~大数字、关键词、hero 副标题词用 `gradText`~~ —— **2026-11-18 起停用(Monica 定)**:UI 审核判渐变字为 AI 味,新页面标题、数字一律实色(墨色 `#1a1a2e`,强调用纯橙 `#ff5e1a` 或加大字号 / 字重)。CTA 渐变只留给**主行动按钮**;step 编号用纯墨色数字，不加渐变色块;激活态 chip 用实色。旧页面不追改。

> **去 AI 味规则(落地页,2026-11-18)**:不用渐变字;section 头顶不放全大写 kicker(一页最多一个、有理由才用);不用 ✨ Sparkles 当装饰;不排一组接一组的等大卡片网格;次要文字最浅用 `#6a6b7b`(`#9a9aab` 在白底只有 2.8:1,只能用在禁用态);交付前过 `/impeccable` 审核。去 AI 味≠改素：用**实色色块 + 真实成片 / 产品画面**撑起视觉。

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
  "h-auto rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-7 py-3.5 " +
  "text-base font-bold text-white shadow-[0_10px_30px_rgba(255,82,85,0.28)] " +
  "transition hover:brightness-105 hover:shadow-[0_14px_38px_rgba(255,82,85,0.4)]";

// 小标签(section 上方的橙色 kicker)—— 2026-11-18 起落地页一页最多用一次,不要每个 section 都放
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
- **不用虚线**(2026-11-05 Monica 定):上传区、空状态、占位格、提示框、连线、取景框一律实线或纯底色，不写 `border-dashed` / `strokeDasharray`。上传区用 `border border-[#e1e3e9] bg-[#fafafb]`,拖入时换品牌橙描边。

---

## 5. 组件库

用 **shadcn/ui + lucide-react**,现有组件在 `src/components/ui/`:`button` `card` `badge` `accordion` `slider`。需要新组件时按 shadcn 方式加。

惯用模式:
- **FAQ** → `Accordion type="single" collapsible`,每项独立成卡(`rounded-2xl border bg-white`,带柔阴影)。
- **选择器** → 自定义 `Chip`(圆角方块,激活态填 CTA 渐变 + 阴影,未激活灰字描边)。
- **滑块** → shadcn `Slider`,range/thumb 染成 `#1f2030`,顶部跟随气泡显示当前值。
- **图标** → lucide,放在 CTA 渐变的圆角方块里(`size-11 rounded-[11px]`)做 step/feature 图标。
- **图标按钮 hover** → 箭头类(`ArrowRight`/`ArrowUpRight`)轻微位移 `group-hover:translate-x-0.5`。

### 5.1 下拉选择:禁止用原生 `<select>`

**任何原型里都不要写 `<select>` / `<option>`**,哪怕给触发器套了圆角、描边、`appearance-none` 也不行——原生下拉**点开后的菜单是操作系统画的**(macOS 上是半透明深色毛玻璃 + 蓝色高亮 + 系统字体),样式改不了,和产品的白底圆角菜单完全不是一个东西。这个问题被指出过多次,写代码前先确认没有 `<select>`。

统一用 **`src/components/ui/dropdown-select.tsx` 的 `DropdownSelect`**:

```tsx
import { DropdownSelect } from "@/components/ui/dropdown-select";

<DropdownSelect
  label="Spoken language"          // 读屏用的名字
  size="md"                        // sm 32px / 12px(画布节点、筛选条)· md 36px / 14px(弹窗、输入框上的弹层)· lg 40px / 14px(设置页、参数面板,默认)
  invalid={!!error}                // 可选:出错时描边变 #EB502D
  value={lang}
  onChange={setLang}
  options={[{ value: "zh", label: "Chinese (Simplified)" }, { value: "en", label: "English" }]}
  icon={(v) => <ModelLogo id={v} />} // 可选:选项前的小图标(模型 logo、比例框)
/>
```

它长这样(2026-11-25 已按 §P「Select 下拉」改),新写下拉必须对齐这个样子:

- **档位**:`sm` 32 · `md` 36 · `lg` 40(默认),触发器和选项行都跟着档位;和同一行的输入框 / 按钮用同一档。
- **触发器**:白底、`1px #E8E8E8` 描边、`rounded-md`(8px),文字 `#250B03`,右侧 `#6F6C6C` 的 `ChevronDown`(展开时旋转 180°);hover 描边 `#C9C9C9`,展开 / 键盘聚焦时描边 `#FF5E1A` + `3px` 12% 同色淡环(不带白隙);`invalid` 时描边 `#EB502D`、淡环也变红;禁用 50% 透明。
- **菜单**:白底 12px 圆角(`rounded-[12px]`,本仓库 `rounded-xl` 是 14px)+ `1px #E8E8E8` 描边 + `p-1` + floating 阴影 `0 4px 12px rgb(37 11 3/.08)`,选项之间 2px;选项 `rounded-md px-2.5`,悬停 / 方向键高亮 `#F5F5F5`,**当前选中项加粗 + 右侧 `#FF5E1A` `Check`(不加底色)**。
- **行为**:菜单挂到 `body`(fixed 定位),不会被滚动面板或 `overflow:hidden` 的父级裁掉;下方放不下就往上开;↑↓ 移动、Enter 选中、Esc 关闭,点外面 / 滚动 / 改窗口大小都收起。
- 选项只有 2–4 个且要一眼看全时,用分段控件(`Segmented`)或 chip,不用下拉。

> 截至 2026-09-28,旧原型里还有原生 `<select>`(`(v1.6)/admin-portal`、`team-workspace`、`settings-shell`、`pricing`,`(v1.7)/blog`,`(v1.8)/org-members`,以及几个归档原型),改到这些页面时顺手换掉。

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

## 6.5 Toast 提示

操作反馈统一走 toast,**不要**用 `alert()`、页面内红绿横条或自己写一套。参考实现:`src/app/prototypes/(v1.7)/blog/toast.tsx`,导出 `useToast()`,用法 `const [notify, toastNode] = useToast()`,把 `toastNode` 放在页面最外层,事件里调 `notify("Draft saved")`。

**位置与行为**

- **顶部居中**,`fixed inset-x-0 top-5 z-[200]`,不遮挡主操作区。
- 同一时刻**只显示一条**:新的顶掉旧的,不堆叠成一列。
- 停留 **2600ms** 后自动消失;右侧永远给一个 `X` 可手动关掉。
- 进出场:`translate-y` 3px + 透明度,`duration-200 ease-out`,带 `motion-reduce:transition-none`。
- 容器 `rounded-xl` + `border` + `shadow-[0_12px_32px_rgba(26,26,46,0.14)]`,文字 `14px / font-semibold`。
- 无障碍:`role="status"` + `aria-live="polite"`。

**三种语义**(左侧一律是实心圆底白图标,`size-5 rounded-full`)

| 语义 | 用在 | 底色 | 描边 | 文字 | 图标底 | 图标 |
|---|---|---|---|---|---|---|
| success | 操作成功(保存、发布、删除完成) | `#E8F7EF` | `#B7E6CB` | `#166C40` | `#1A7F4B` | `Check` |
| error | 失败、被规则挡住(重名、分类被占用、存储写不进去) | `#FFF0F0` | `#FFD1D1` | `#C22F32` | `#FF5255` | `TriangleAlert` |
| info | 中性说明、演示性提示("Sign Up 将跳转到注册流程") | `#FFFFFF` | `#E4E3EA` | `#1A1A2E` | `#1A1A2E` | `Info` |

`notify(msg)` 默认就是 success,失败务必显式传第二个参数:`notify("That name is already taken", "error")`。

**配套的按钮 loading**

会落库的操作(保存、发布)按钮自己要有在途态,别让 toast 单独承担反馈:按下后 `disabled` + `Loader2` 转圈 + 文案改成进行时(`Saving…`),请求回来再出 toast。原型里用 ~550ms 延时模拟这一跳——瞬间弹成功会让人怀疑到底存没存。

---

## 7. 文案语气

- 落地页文案用**英文**(产品面向海外,如 BuzzVideo affiliate);UI 注释、画廊首页、说明文字用**中文**。
- 标题短促有力(`How it works` / `Real partners. Real revenue.`),正文口语、第一人称证言。
- ~~kicker 全大写 + 宽字距~~:落地页一页最多一个 kicker;小标题用句子大小写的 13px 中等字重，不用全大写字距标签当分组标题。正文句子化。

---

## 8. 响应式

- 移动优先,`sm:` `md:` `lg:` 渐进增强。
- 卡片网格:首页 `sm:grid-cols-2 lg:grid-cols-3`;内容区 `md:grid-cols-3`。
- 字号全程 `clamp()`,无需写多套断点。
- 容器 `max-w-[1040px]` / `max-w-6xl` 居中,两侧留白。

---

## 9. 做新原型时的检查清单

0. **先判断是功能原型还是落地页(§0.5)**。功能原型:按 §P 选控件档位(同一行同一档、一个容器一档)、配齐状态表全部状态、焦点只用 `#FF5E1A`、不用渐变字/彩色光晕/冷蓝灰，下面 1–8 条里和 §P 冲突的(圆角、`ctaBtn` 阴影、`#1a1a2e` 墨色、`#ececf1` 边框等)不适用。

1. 复制 `ctaBtn`(和需要时的 `kicker`,一页最多一次);**不再用 `gradText`**(见第 1 节去 AI 味规则)。
2. 标题套 `font-[family-name:var(--font-display)] font-extrabold tracking-tight text-[#1a1a2e]`。
3. section 用 `px-6 py-20` + `mx-auto max-w-[1040px]`,白/暖白交替隔段。
4. 主按钮一律 CTA 渐变;强调词/大数字用实色(墨色或纯橙)+ 字号字重，不用渐变字。
4.5 落地页交付前跑 `/impeccable` 审核(设计评审 + 检测器),去掉 AI 套路再交。
5. 卡片 `rounded-2xl border border-[#ececf1] bg-white` + 柔阴影 + hover 上浮。
6. 颜色只从第 1 节取,不临时造色。
7. **全局搜一遍 `<select`:一个都不能有**,下拉一律用 `DropdownSelect`(见 5.1)。
8. 参照旗舰页 `2026-06-09-affiliate` 当样板。

> **黄金法则**:拿不准时,打开 `src/app/prototypes/2026-06-09-affiliate/page.tsx` 抄它的写法——它是这套规范的活样板。

## 10. APP 原型规范(BuzzVideo APP,深色,2026-10-22 统一)

> 上面 1–9 是网页原型的规范。APP 原型(React Native,`src/app/prototypes/(app-mvp)/buzzvideo-app/`)的 token 全在 `app/theme.ts`,**只用 token,不写裸数字**。

**字号 = iOS 系统字号,只有 10 档**

| token | 字号 | 用在 |
|---|---|---|
| largeTitle / title1 / title2 | 34 / 28 / 22 | 页面大标题、空状态标题 |
| title3 | 20 | 面板左上标题(如 Model Settings) |
| headline | 17 | 导航栏标题、分区标题 |
| body / subhead | 16 / 15 | 正文、列表名字 |
| footnote | 13 | 说明文字、按钮小字 |
| caption1 | 12 | 卡片标题、次要说明 |
| caption | 11 | 小标签(Hot / New / Trending)、角标、比例文字 |

例外只有两类:营销大字(付费墙、挽留页的价格和 50% OFF)、照搬 iOS 系统界面(分享面板、设置、文件选择器、键盘、Tab 栏 10pt 标签)。

**圆角只有 6 档**:`xs 4` 细条(下划线、进度、分页点)· `md 12` 按钮块、选项块、缩略图 · `lg 20` 卡片、横幅、Toast · `sheet 38` iOS 26 悬浮面板 · `hero 36` 满版大图底部 · `full` 胶囊、圆形、**所有小标签**、主按钮、输入框。

**半透明填充只有 3 档**(`fill`):`base 0.07` 普通底 · `pressed 0.12` 按下 · `strong 0.18` 压在图上。

**选中态**

| 控件 | 选中样式 |
|---|---|
| 所有单选的选项块 / 卡片 / 分段选项(模式卡、比例、时长、清晰度、Web Explore…) | `selectedBox`:品牌色淡底 + 同色细边(照即梦「询问 / 自动执行」),文字不变色;没选中是灰底无边 |
| 页面级 tab(分类栏、素材库 All / Videos / Images) | 白色粗体 + 橙色短下划线 |
| 多选(选照片) | 橙色带数字的圆圈 |
| 列表单选(Row) | 右侧橙色 ✓ |
| 底部 Tab 栏 | 橙色图标 + 橙字 |

橙色只给:主按钮 / 发送 / 进度 / 多选圆圈 / 页面 tab 下划线 / Tab 栏选中 / Hot 标签。
