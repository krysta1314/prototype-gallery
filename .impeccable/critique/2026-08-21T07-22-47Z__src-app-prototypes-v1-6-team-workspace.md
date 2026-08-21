---
target: 整个 team 功能的 UI/UX
total_score: 29
p0_count: 0
p1_count: 2
timestamp: 2026-08-21T07-22-47Z
slug: src-app-prototypes-v1-6-team-workspace
---
⚠️ DEGRADED: single-context (会话配置禁止调用 Agent 工具，A/B 两个评估未跑在隔离子代理里)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | 状态横幅体系很强（额度/待生效变更/宽限期/未开通）。缺的是表单级反馈：General 的 Save changes 禁用态没说明为什么不能点 |
| 2 | Match System / Real World | 4 | 文案是这套界面最强的部分。「同事没用完的额度不能转给你」「席位冻结」这类把规则讲成人话，不是术语搬运 |
| 3 | User Control and Freedom | 3 | 待生效变更、取消订阅都能撤。但改角色、改分配额度、移除成员都是一次性动作，只有 toast 没有 undo |
| 4 | Consistency and Standards | 2 | 同一个面板里有 3 套开关实现（off 态 `#ddd7df` vs `#d8d4dc`，内部结构也不同）；成员列表有表头却渲染成卡片；设置行有 ToggleRow 和 SettingsRow 两套 |
| 5 | Error Prevention | 3 | 降档席位守卫、终止后禁邀请、删团队要求先退订，都拦得住。缺的是破坏性操作的二次确认一致性 |
| 6 | Recognition Rather Than Recall | 3 | 权限矩阵要用户自己记住「我这一列能改哪几列」，没有视觉上的可编辑区提示 |
| 7 | Flexibility and Efficiency | 2 | 无键盘快捷键；成员表每行常驻 Top up 文字链（7 行 × 常驻次级动作）而不是行内菜单；权限矩阵无搜索 |
| 8 | Aesthetic and Minimalist Design | 2 | 设置面板 34 处 `border + bg-white` 套壳；Credits 一屏两组 stat tile 网格；成员行 FIXED 徽章重复 7 次；用量数字和下方 caption 说同一件事 |
| 9 | Error Recovery | 3 | toast + 部分 undo。表单没有 inline 错误态，logo 超限只走 toast |
| 10 | Help and Documentation | 4 | 规则就写在界面里（席位口径三条、额度模型、不续约政策），不用去翻帮助文档 |
| **Total** | | **29/40** | **可靠但不精致：信息设计强，视觉结构偷懒** |

## Anti-Patterns Verdict

**LLM assessment**：不像「AI 生成的漂亮页面」，但像「AI 生成的后台」——两种 AI 感不一样。这套界面没有渐变按钮堆砌、没有 sparkles、没有每节一个大写 kicker；问题是**结构上的偷懒反射**：需要摆信息的地方一律套一个 `rounded-2xl border bg-white` 的盒子。设计师会先问「这几条是同级选项还是几件事」，然后决定用列表还是卡片；AI 会直接给每条套个卡片。你上一轮自己指出的 Teammate usage visibility 就是这个反射，而它在成员表、Credits、Billing 里还有 30 多处。

第二个 AI 感来源：**指标网格反射**。Credits & usage 一屏里有两组 stat tile（上面 3×2 六格，下面 4 格 KPI），而且六格里第 6 格根本不是指标，是一个「Buy credits」动作 —— 为了填满网格而混了类型。

**Deterministic scan**：`detect.mjs` 报 12 条，全部是 `gradient-text`，集中在 `home/page.tsx`(8)、`agent/page.tsx`(1)、`assets/page.tsx`(1)、`canvas/page.tsx`(1)。

逐条看过之后我判断**大部分是误报或不属于 team 功能**：
- `home/page.tsx` 的 8 条里，6 条在营销/促销区块（Marketing Agent 品牌字标、One canvas、FREE CREDITS 注册促销、New Model Festival 弹窗、LIMITED-TIME BOOST）——这些是从消费端首页搬来的品牌表达，`design.md` 明确把招牌暖橙渐变定为品牌资产，不是 team 功能的一部分
- `agent`/`assets` 那两条命中的是 `const gradText = ...` **声明**，不是使用点
- **一条是真的**：`home/page.tsx:865` 是 hover 才出现的文字渐变（`group-hover:bg-gradient-to-r`），纯装饰、无信息量，属于该删的

检测器没抓到、但更要紧的是**对比度**（它不扫颜色对）：

| 色值 | 白底对比度 | 用量 | 判定 |
|---|---|---|---|
| `#8a8490` | **3.63** | 127 处（设置面板 89） | ✗ 正文不达标 |
| `#9a94a0` | **2.95** | 58 处（39） | ✗ 差很多 |
| `#b3adb8` | **2.19** | 3 处 | ✗ 我这轮刚写的 logo 提示行，自己的回归 |
| `#7b7480` | 4.51 | 66 处 | ✓ 刚过线 |
| `#56505c` | 7.78 | 51 处 | ✓ |

`PRODUCT.md` 自己写的无障碍标准是「body ≥ 4.5:1，不用为优雅牺牲可读性的浅灰字」——`#8a8490` 是这套界面的主力说明文字色，127 处全部不达标。这是「AI 设计读起来累」的第一号原因，也是本次最值得修的一条。

**Visual overlays**：未注入。会话配置禁 Agent，我按 skill 规则改为单上下文运行，浏览器侧只做了截图与计算式取证（对比度用页面内 JS 实算，非估算），没有起 live-server 注入 overlay。

## Overall Impression

**信息设计远好过视觉结构。** 这套 team 功能最难的部分——把「每席固定 vs 共享池」「席位口径」「不续约会发生什么」这些容易吵架的规则讲清楚——做到了很少见的水准，文案是资产。真正拖后腿的是两件机械的事：**浅灰字**和**万物套卡**。这两个都不需要重新设计，是全局替换级别的修正，改完整体质感会跳一档。

最大的单点机会：**成员列表**。它已经有表头（Member info / Usage / Limit / Last active / Role），却把每一行渲染成独立卡片——一个假装是表格的卡片流。改成真表格或分割线行，这一屏立刻从「AI 后台」变成「Linear 级后台」。

## What's Working

1. **规则前置的文案**。席位卡上常驻「pending 占席位 / expired 不占 / Billing Admin 不占」三条，用户不用去猜「我买了 10 席为什么只能用 7 席」。这是产品思维写进 UI，不是补充说明。
2. **状态横幅的分层**。已终止 > 续费失败 > 待生效变更，顺序就是严重程度，而且每条都给了可执行出口而不是纯告知。撞墙那条链路（80% → 100% → 申请 → 审批）也是闭环的。
3. **权限矩阵真实生效**。关掉 Admin 的 Invite，Admin 视角下按钮真的消失——不是改说明文字。这是原型里少见的诚实。

## Priority Issues

### [P1] 浅灰说明文字全线不达标
- **What**：`#8a8490`（3.63:1）承担了 127 处说明文字，`#9a94a0`（2.95:1）58 处标签
- **Why it matters**：说明文字正是这套界面的核心价值（规则都写在那儿），结果它是最难读的部分。而且违反 PRODUCT.md 自己定的 4.5:1
- **Fix**：把说明文字统一到 `#6a6b7b`（5.25:1）或 `#7b7480`（4.51:1）；`#9a94a0` 只留给真正的装饰性微标签；删掉 `#b3adb8`
- **Suggested command**：`/impeccable audit`

### [P1] 成员列表：假装是表格的卡片流
- **What**：有列表头，但 7 行各自是 `border + rounded-2xl` 卡片
- **Why it matters**：卡片边框把同一列的数值切断，眼睛无法沿列扫读——而成员表的核心动作就是「谁用超了」的纵向比较
- **Fix**：改成分割线行（沿用你给的 Claude 设置那个形态）或真 `<table>`；`FIXED` 徽章从每行提到列头或席位卡说一次；`Top up` 收进行内菜单/hover
- **Suggested command**：`/impeccable layout`

### [P2] 设置面板的套卡反射
- **What**：`team-settings-modal.tsx` 里 34 处 `border border-[#ececf1] bg-white`、29 处 `rounded-2xl`
- **Why it matters**：卡片本该表示「这是一个独立对象」。全都套卡之后边框不再携带信息，只增加视觉噪声，读起来是「一堆盒子」而不是「一份设置」
- **Fix**：只有 Danger zone、发票列表这类真·独立对象保留卡片；同级设置项一律走刚建的 `SettingsGroup` / `SettingsRow`
- **Suggested command**：`/impeccable distill`

### [P2] 一个面板三套开关
- **What**：`Switch`（1791）+ pourOver 自绘（2837）+ 自动充值自绘（3265），off 态 `#ddd7df` / `#d8d4dc` 不一致，内部结构也不同
- **Why it matters**：product register 的原话——同一个动作在两处长得不一样，就有一处是错的
- **Fix**：全部换成共享 `Switch`，删掉两处自绘
- **Suggested command**：`/impeccable polish`

### [P2] Credits & usage 一屏两组指标网格
- **What**：3×2 六格 + 下方 4 格 KPI，且六格里混了一个动作格（Buy credits）
- **Why it matters**：等大格子网格是最容易被认出的 AI 版式；混类型说明格子是先画好再填内容的
- **Fix**：六格拆成「合同事实」（Plan / 席位 / 下次账单，走定义列表）与「当期读数」（用量 / top-up 余额）两种表达，Buy credits 归到读数旁边当动作而不是占一格
- **Suggested command**：`/impeccable layout`

### [P3] hover 才出现的文字渐变
- **What**：`home/page.tsx:865` `group-hover:bg-gradient-to-r` + `bg-clip-text`
- **Why it matters**：纯装饰，且属于 skill 的绝对禁项
- **Fix**：hover 改成颜色变化或下划线
- **Suggested command**：`/impeccable quieter`

## Persona Red Flags

**Alex（Power User，团队 Owner，每周来调额度）**
- 成员表 7 行每行都常驻 `Top up` 文字链，他要找的 Role 下拉却在最右边——高频动作和低频动作抢同一条视线
- 没有任何键盘快捷键：改 5 个人的角色 = 5 次鼠标往返，没有 Tab 流
- 权限矩阵没有搜索/筛选，30 多条能力靠肉眼找
- 改完角色没有 undo，只有一个会消失的 toast

**Jordan（First-Timer，刚被邀请进来的 Member）**
- 进 Credits & usage 看到六格网格 + 两条进度条 + 一段 Enterprise 广告，但他只想知道一件事：「我还能生成几条视频」——这个数字没有被单独突出
- `FIXED` 徽章在他的行上重复出现，没有任何地方解释 FIXED 是什么意思
- 说明文字是 3.63:1 的浅灰，而他要读的恰恰是那些说明

**Wendy（财务/Billing Admin，只为发票而来）**
- 她的可见 tab 是 Credits / Top-up / Billing / Activity——但落地默认是 Credits 而不是 Billing，她每次都要多点一次
- 发票列表里的 Open/Paid 状态是纯文字，没有视觉区分；她要找的「哪张还没付」需要逐行读

## Minor Observations

- General 的 `Save changes` 常态禁用，但没有说明「改了名字才可点」——禁用按钮不给理由是常见的挫败源
- 成员行的用量同时给了 `9,800 / 16,900` 和下方 caption `9,800 of 16,900 this month`，同一件事说两遍
- 席位汇总条的图例用彩色圆点，但圆点颜色与进度条分段色是否严格对应值得核一遍
- `Upgrade` 徽章挂在 Plan 格子里，和 Billing tab 的换档入口是两个位置做同一件事
- 我这轮加的 logo 提示行用了 `#b3adb8`（2.19:1），是我自己引入的对比度回归，应随 P1 一起修

## Questions to Consider

- 成员表真正的高频任务是什么？如果是「找出用超的人」，那默认排序为什么不是用量降序？
- `FIXED` / per-seat 这个模型是团队最常被绕晕的地方。如果 Credits 页只保留一句话 + 一个数字，删掉其余全部，用户会不会反而更清楚？
- Billing Admin 落地默认页为什么不是 Billing？
- 这套界面的说明文字是它最大的资产，为什么它用的是最浅的那个灰？
