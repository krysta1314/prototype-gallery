import { INVITE, PROMO_CAMPAIGN } from "../app/data";
import { demoReducer, type AnyAction } from "../app/demo";
import { INITIAL_NAV, navReducer, type NavAction, type NavState } from "../app/nav";
import { EXIT_OFFER_MS, INITIAL_STATE, type StoreState } from "../app/store";

/**
 * 评审原型左栏的用户旅程。每一步 = 从全新安装开始依次派发的一串 action(真实 action + 演示 action),
 * 所以预置状态一定是 APP 真的能走到的状态,不会和 store 规则矛盾。
 * phase:真机从桌面开始,还是直接在 APP 里
 */
export type Journey = {
  id: string;
  group: string;
  title: string;
  phase: "home" | "app";
  actions: AnyAction[];
  nav?: NavAction[];
  /** 场景说明(需求文档):given 前置条件,expect 预期结果 / 验收点 */
  given: string;
  expect: string[];
};

/** 看完引导、拒绝追踪、允许推送 */
const onboarded: AnyAction[] = [
  { type: "appLaunched", day: 1 },
  { type: "completeOnboarding" },
  { type: "demo/setPermission", kind: "tracking", value: "denied" },
  { type: "demo/setPermission", kind: "push", value: "granted" },
];
/** 已登录的 Free 用户,首登付费墙已经看过、挽留还没用 */
const free: AnyAction[] = [...onboarded, { type: "signIn" }, { type: "consumePaywallRequest" }, { type: "setAiConsent", on: true }];
/** APP 内订阅的 Pro 年付用户 */
const pro: AnyAction[] = [...free, { type: "demo/setPlan", plan: "pro", source: "app", period: "yearly" }, { type: "demo/setCredits", credits: 4900 }];
/** Enterprise 用户:PressLogic 组织成员,登录后默认在组织空间 */
const enterprise: AnyAction[] = [...free, { type: "demo/setAccount", account: "enterprise" }];
/** 组织 Admin(可管理成员) */
const orgAdmin: AnyAction[] = [...enterprise, { type: "demo/setRole", workspace: "presslogic", role: "admin" }];
const emailStart: AnyAction[] = [
  { type: "completeOnboarding" },
  { type: "demo/setPermission", kind: "tracking", value: "denied" },
  { type: "demo/setPermission", kind: "push", value: "granted" },
  { type: "startEmailLogin" },
];
/** 已发出验证码,停在输码页 */
const emailCode: AnyAction[] = [...emailStart, { type: "submitEmail", email: "monica.zhou@presslogic.com", now: Date.now() }];
const LATTE = "uc-latte";
const LATTE_WORK = "j-latte";

export const JOURNEYS: Journey[] = [
  // 首次打开(spec §5.1)
  { id: "fresh-home", given: "第一次安装,还没打开过 APP", expect: ["点桌面图标 → 启动动画 → 引导页"], group: "首次打开", title: "桌面 · 全新安装", phase: "home", actions: [] },
  { id: "onboarding", given: "第一次打开", expect: ["全屏广告片(信息流里刷 3 条 AI 广告,6 秒循环)+ Get started,没有问卷", "iOS → 直接弹系统 ATT 框;Android → 登录页"], group: "首次打开", title: "引导页", phase: "app", actions: [] },
  {
    id: "login",
    group: "首次打开",
    title: "登录页 + ATT + 推送授权",
    phase: "app",
    actions: [{ type: "completeOnboarding" }, { type: "requestPermission", kind: "tracking" }],
    given: "iOS 新用户在引导页点了 Get started",
    expect: [
      "同一屏、背后是登录页:先弹系统 ATT 框(不放说明页),回答后接着弹推送授权(系统不允许两个框同时出现)",
      "ATT 两个选项都继续;打 att_result 事件",
      "登录成功 → 发 500 积分 → 首登付费墙",
    ],
  },
  {
    id: "email-login",
    group: "首次打开",
    title: "邮箱登录:输入邮箱",
    phase: "app",
    actions: emailStart,
    given: "登录页点了 Continue with email",
    expect: ["推进整页:标题 Continue with email + 邮箱输入框(自动聚焦,邮箱键盘)", "Continue 在底部,键盘弹起时停在键盘上方;邮箱格式不对时置灰;离开输入框后提示「Enter a valid email address.」", "Continue → 发 6 位验证码,进输码页"],
  },
  {
    id: "email-code",
    group: "首次打开",
    title: "邮箱登录:输入验证码",
    phase: "app",
    actions: emailCode,
    given: "已给 monica.zhou@presslogic.com 发出验证码",
    expect: ["6 个格子,当前格橙色;支持粘贴和 iOS 从邮件自动填充;输满 6 位自动提交", "60 秒倒计时「Resend in 56s」,到点变「Resend code」;下面提示查垃圾邮件", "验证通过 → 和 Apple / Google 登录同一条路(新用户发 500 积分 → 首登付费墙)", "点 Change 或返回 → 回到输入邮箱,邮箱保留"],
  },
  { id: "first-paywall", given: "新用户刚登录", expect: ["自动弹付费墙,默认 Starter tab、年付", "✕ 3 秒后才出现", "trigger = first_login"], group: "首次打开", title: "首登付费墙", phase: "app", actions: [...onboarded, { type: "signIn" }] },
  // 挽留优惠的 24 小时从「打开评审原型」那一刻起算(真实倒计时)
  { id: "exit-offer", given: "Free 用户第一次关闭付费墙", expect: ["底部升起挽留抽屉:$9.50 首月,之后 $19/月", "真实 24 小时倒计时", "每个账号一生只弹一次"], group: "首次打开", title: "关闭付费墙 → 挽留弹窗", phase: "app", actions: [...onboarded, { type: "signIn" }, { type: "consumePaywallRequest" }, { type: "closePaywall", now: Date.now() }] },
  {
    id: "exit-offer-later", given: "挽留抽屉点了 Maybe later,还在 24 小时内", expect: ["Inspire 的 Tab 栏上方有倒计时胶囊,点开重新打开挽留抽屉", "打开付费墙,Starter 月付行是 $9.50 优惠价"],
    group: "首次打开",
    title: "挽留 24 小时内回来买",
    phase: "app",
    actions: [...onboarded, { type: "signIn" }, { type: "consumePaywallRequest" }, { type: "closePaywall", now: Date.now() }, { type: "dismissExitOffer" }, { type: "setAiConsent", on: true }],
  },
  { id: "first-inspire", given: "Free 用户关掉付费墙和挽留后", expect: ["进入 Inspire,今天不再自动弹付费墙"], group: "首次打开", title: "Free 用户进入 Inspire", phase: "app", actions: free },

  // 从广告安装(spec §8.3)
  { id: "ad-onboarding", given: "从 Instagram 广告(冰拿铁)点进来安装", expect: ["引导页的广告片换成冰拿铁 Use Case 成片"], group: "从广告安装", title: "引导页换成广告对应成片", phase: "app", actions: [{ type: "openDeepLink", useCaseId: LATTE }] },
  { id: "ad-landing", given: "从广告安装的用户完成登录", expect: ["关闭付费墙(和挽留)后直接进冰拿铁 Use Case,不进 Inspire", "已安装用户点链接:直接打开 Use Case,不弹付费墙"], group: "从广告安装", title: "登录后直达 Use Case", phase: "app", actions: [{ type: "openDeepLink", useCaseId: LATTE }, ...free] },

  // 账号类型(同一个 APP,登录不同账号交互不同;右栏「演示账号」可在任意屏切换)
  {
    id: "acct-free",
    group: "账号类型",
    title: "Free 用户",
    phase: "app",
    actions: free,
    nav: [{ type: "tab", tab: "me" }],
    given: "注册送 500 积分,没有订阅",
    expect: [
      "首登 + 每天冷启动最多一次自动付费墙;第一次关闭弹挽留;活动在线时下一次冷启动弹运营弹窗",
      "不能生成视频(Video / Agent 视频那步弹付费墙)",
      "成片带水印;不能买积分包;Me 积分卡点进付费墙",
      "同时只能生成 1 个:第 2 个提示「Free runs 1 generation at a time」+ See plans","设置里只有 Help Center,没有人工支持",
    ],
  },
  {
    id: "acct-starter",
    group: "账号类型",
    title: "Starter 用户",
    phase: "app",
    actions: [...free, { type: "demo/setAccount", account: "starter" }],
    nav: [{ type: "tab", tab: "me" }],
    given: "Starter 年付,每月 1,900 积分",
    expect: [
      "不弹自动付费墙、挽留、运营弹窗",
      "能生成视频,但只有 Seedance 2.0 Fast / Mini;选 Seedance 2.0 / 2.5 发送 → 付费墙 Pro tab(Upgrade)",
      "无水印;可买积分包;同时最多 4 个,到上限提示升级","设置里只有 Help Center",
      "付费墙停在 Starter,显示当前方案 + 升级选项",
    ],
  },
  {
    id: "acct-pro",
    group: "账号类型",
    title: "Pro 用户",
    phase: "app",
    actions: [...free, { type: "demo/setAccount", account: "pro" }],
    nav: [{ type: "tab", tab: "me" }],
    given: "Pro 年付,每月 4,900 积分",
    expect: ["全部模型,含 Seedance 2.0 / 2.5", "无水印;可买积分包;同时最多 8 个;设置里有 Contact support(人工支持)", "付费墙停在 Pro:Ultra = Upgrade,Starter = Switch(下个续费日生效)"],
  },
  {
    id: "acct-ultra",
    group: "账号类型",
    title: "Ultra 用户",
    phase: "app",
    actions: [...free, { type: "demo/setAccount", account: "ultra" }],
    nav: [{ type: "tab", tab: "me" }],
    given: "Ultra 1× 年付,每月 8,900 积分",
    expect: ["全部模型;同时最多 12 个,到上限只提示等待、不再推升级", "长视频(Early Access)和优先处理是权益说明,APP 内没有单独交互", "设置里有 Contact support", "付费墙停在 Ultra:积分刻度 2× / 4× = Upgrade;其他档 = Switch"],
  },
  {
    id: "acct-enterprise",
    group: "账号类型",
    title: "Enterprise 用户",
    phase: "app",
    actions: enterprise,
    nav: [{ type: "tab", tab: "me" }],
    given: "PressLogic 组织成员,公司已签 Enterprise 合同并付费",
    expect: [
      "登录后默认进组织空间;不弹首登 / 每日付费墙、挽留、运营弹窗",
      "组织空间:积分由组织分配,不能在 APP 里购买;全部模型可用;积分不足只提示联系管理员;无水印",
      "Me 可切换到 Personal;Personal 按 Free 规则,只有想生成视频、积分不足时才弹付费墙",
      "Admin / Owner 可在 Me 进组织成员,按人设每月积分上限","设置里是 Your account manager(专属客户经理)",
    ],
  },
  {
    id: "members",
    group: "账号类型",
    title: "Enterprise Admin:组织成员",
    phase: "app",
    actions: orgAdmin,
    nav: [{ type: "tab", tab: "me" }, { type: "push", route: { name: "members" } }],
    given: "Enterprise 用户里的组织 Admin / Owner,在 Me 进组织成员",
    expect: [
      "列出所有成员:头像、名字、角色、本月已用 / 每月积分上限",
      "按人设每月积分上限;上限真的生效,成员超过上限就被拦下,提示找管理员",
      "Invite members:邮箱邀请或复制链接(和「邀请好友」拿奖励是两回事)",
      "普通成员(Member)的 Me 里没有这个入口",
    ],
  },

  // 付费墙触发(spec §3.1、§5.2)
  { id: "daily-paywall", given: "Free 用户第二天冷启动", expect: ["自动弹付费墙一次,trigger = daily", "同一天再冷启动不再弹", "会员不弹"], group: "付费墙触发", title: "跨天冷启动", phase: "app", actions: [...free, { type: "appLaunched", day: 2 }] },
  {
    id: "video-locked", given: "Free 用户选 Video 模式点发送", expect: ["不扣积分,草稿保留", "弹付费墙,trigger = video_locked"],
    group: "付费墙触发",
    title: "Free 想生成视频",
    phase: "app",
    actions: [...free, { type: "setComposer", patch: { mode: "video", text: "A 10s sneaker ad" } }, { type: "submitPrompt", id: "demo-v" }],
    nav: [{ type: "tab", tab: "create" }],
  },
  {
    id: "agent-locked", given: "Free 用户用 Marketing Agent 做视频广告", expect: ["Agent 照常回复方案", "到生成视频那步停下:对话里留提示 + 弹付费墙", "不扣积分、不生成视频"],
    group: "付费墙触发",
    title: "Free 用 Agent 做视频广告",
    phase: "app",
    actions: [...free, { type: "setComposer", patch: { text: "Make a 15s ad for our iced latte" } }, { type: "submitPrompt", id: "demo-a" }],
    nav: [{ type: "tab", tab: "create" }],
  },
  {
    id: "model-locked", given: "Starter 会员选了 Seedance 2.0 发送", expect: ["付费墙直接开 Pro tab,按钮是 Upgrade(立即生效)", "不扣积分,草稿保留"],
    group: "付费墙触发",
    title: "Starter 选 Seedance 2.0",
    phase: "app",
    actions: [
      ...free,
      { type: "demo/setPlan", plan: "starter", source: "app", period: "monthly" },
      { type: "setComposer", patch: { mode: "video", model: "seedance-2", text: "A 10s sneaker ad" } },
      { type: "submitPrompt", id: "demo-m" },
    ],
    nav: [{ type: "tab", tab: "create" }],
  },
  {
    id: "low-free", given: "Free 用户积分 20,提交需要更多积分的生成", expect: ["对话里留「积分不足」提示 + See plans", "自动弹付费墙,trigger = low_credits"],
    group: "付费墙触发",
    title: "Free 积分不足",
    phase: "app",
    actions: [...free, { type: "demo/setCredits", credits: 20 }, { type: "setComposer", patch: { text: "Latte ad" } }, { type: "submitPrompt", id: "demo-l" }],
    nav: [{ type: "tab", tab: "create" }],
  },
  {
    id: "low-member", given: "Pro 会员积分只剩 20,提交一条 Agent 生成", expect: ["不扣积分、草稿保留,对话里提示 + Buy credits", "自动弹积分包(不是付费墙)", "8 档,永不过期;美区底部有网页充值外链"],
    group: "付费墙触发",
    title: "会员积分不足 → 积分包",
    phase: "app",
    actions: [...pro, { type: "demo/setCredits", credits: 20 }, { type: "setComposer", patch: { text: "Make a 15s ad for our iced latte" } }, { type: "submitPrompt", id: "demo-lm" }],
    nav: [{ type: "tab", tab: "create" }],
  },

  // 订阅状态(spec §2.4–§2.6)
  { id: "sub-app", given: "Pro 年付会员(App Store)打开付费墙", expect: ["停在 Pro tab,显示 You're on Pro · Renews on 日期", "当前方案没有购买按钮;选更高档 = Upgrade,更低档 = Switch"], group: "订阅状态", title: "APP 内订阅中", phase: "app", actions: [...pro, { type: "openPaywall", trigger: "manual" }] },
  { id: "sub-web", given: "在 buzzvideo.ai 订阅了 Pro 的用户打开付费墙", expect: ["只显示 Subscribed on the web,没有购买按钮和法律文案"], group: "订阅状态", title: "网页订阅中", phase: "app", actions: [...free, { type: "demo/setPlan", plan: "pro", source: "web" }, { type: "openPaywall", trigger: "manual" }] },
  { id: "sub-manage", given: "Pro 年付会员进 设置 → Subscription", expect: ["方案、积分、续费日、扣费渠道", "最底部灰色 Cancel subscription,拉起 App Store 订阅页"], group: "订阅状态", title: "订阅管理页", phase: "app", actions: pro, nav: [{ type: "push", route: { name: "settings" } }, { type: "push", route: { name: "subscription" } }] },
  {
    id: "me",
    group: "订阅状态",
    title: "会员的 Me:积分与订阅",
    phase: "app",
    actions: pro,
    nav: [{ type: "tab", tab: "me" }],
    given: "Pro 年付会员进 Me",
    expect: [
      "名字旁是 Pro 订阅标签(和网页同一套渐变规范)",
      "积分卡是主角:大字余额 + 分段条(橙 = 订阅积分每月重置,白 = 永久积分)+ 一句说明;点卡进付费墙",
      "积分卡下面:Buy credits(永不过期)、美区多一行 Top up on web 外链、Invite friends",
      "下面是作品 / 素材,可按类型筛选",
    ],
  },
  {
    id: "settings",
    group: "订阅状态",
    title: "设置页",
    phase: "app",
    actions: pro,
    nav: [{ type: "push", route: { name: "settings" } }],
    given: "Pro 会员从 Me 进设置",
    expect: [
      "通知拆成两个开关:Generation updates(默认开)、Offers & news(默认关)",
      "Subscription 进订阅管理;Restore purchases、隐私政策、退出登录、删除账号",
      "Help:Pro / Ultra 有 Contact support;Enterprise 是 Your account manager;Free / Starter 只有 Help Center",
      "系统推送被拒时打开任一通知开关:提示去系统设置",
    ],
  },
  {
    id: "purchase-success",
    group: "订阅状态",
    title: "付费成功 → 标签换档",
    phase: "app",
    actions: [...free, { type: "purchasePlan", plan: "pro", period: "yearly" }],
    nav: [{ type: "tab", tab: "me" }],
    given: "Free 用户在付费墙买了 Pro 年付",
    expect: [
      "不弹 toast、不弹成功页:直接回到「我的」页",
      "名字旁的订阅标签先显示 Free,缩一下换成 Pro、弹簧弹回,再划过一道高光",
      "积分卡同时显示新余额;系统开了「减少动态效果」时直接换档、不播动画",
      "首次订阅和升级才播;降级、换周期、撤销待生效变更不播",
    ],
  },
  {
    id: "sub-downgrade", given: "Pro 年付会员在付费墙选了 Starter 年付", expect: ["不立即生效:显示 Changes on 续费日", "续费日之前仍是 Pro"],
    group: "订阅状态",
    title: "降级:下个续费日生效",
    phase: "app",
    actions: [...free, { type: "purchasePlan", plan: "pro", period: "yearly" }, { type: "purchasePlan", plan: "starter", period: "yearly" }],
    nav: [{ type: "push", route: { name: "subscription" } }],
  },
  {
    id: "sub-cancelled", given: "Pro 会员已在 App Store 取消自动续费", expect: ["Renews on 换成 Ends on,说明到期回 Free、积分包保留", "取消入口隐藏;不额外提醒", "付费墙当前方案按钮 Resubscribe,当天不扣费"],
    group: "订阅状态",
    title: "已取消自动续费",
    phase: "app",
    actions: [...pro, { type: "demo/setCancelled", on: true }],
    nav: [{ type: "push", route: { name: "settings" } }, { type: "push", route: { name: "subscription" } }],
  },
  {
    id: "sub-duplicate", given: "网页订阅了 Pro,又在 App Store 订了一份", expect: ["以网页为准", "提示取消 App Store 那份 + 向苹果申请退款"],
    group: "订阅状态",
    title: "网页 + App Store 重复订阅",
    phase: "app",
    actions: [...free, { type: "demo/setDuplicate", on: true }, { type: "demo/setCredits", credits: 4900 }],
    nav: [{ type: "push", route: { name: "settings" } }, { type: "push", route: { name: "subscription" } }],
  },
  { id: "region-other", given: "非美区 Free 用户打开付费墙", expect: ["底部没有「Or subscribe on buzzvideo.ai」外链"], group: "订阅状态", title: "非美区(没有网页外链)", phase: "app", actions: [...free, { type: "setRegion", region: "other" }, { type: "openPaywall", trigger: "manual" }] },

  // 运营活动(spec §6.2、§6.3)
  { id: "promo-popup", given: "运营活动在线(+35% 积分),Free 用户今天已经弹过付费墙,再次冷启动", expect: ["这次冷启动弹运营弹窗(付费墙优先,运营弹窗留到下一次冷启动)", "CTA → 付费墙 Starter tab,显示加赠后积分", "每人 1 次 / 7 天", "会员、Enterprise 不弹(和网页一致)"], group: "运营活动", title: "首页运营弹窗", phase: "app", actions: [...free, { type: "promoLoaded", campaign: PROMO_CAMPAIGN }, { type: "appLaunched", day: 1 }] },
  { id: "promo-paywall", given: "活动在线,Free 用户从运营弹窗进付费墙", expect: ["积分大字不变,另起一行写 +X bonus credits", "trigger = promo"], group: "运营活动", title: "付费墙加赠角标", phase: "app", actions: [...free, { type: "promoLoaded", campaign: PROMO_CAMPAIGN }, { type: "openPaywall", trigger: "promo" }] },
  {
    id: "promo-push", given: "打开了 Offers & news 的会员,活动上线", expect: ["收到一条活动推送,5 秒后自动收起", "点开 → 付费墙"],
    group: "运营活动",
    title: "活动推送",
    phase: "app",
    actions: [...pro, { type: "setMarketingPush", on: true }, { type: "promoLoaded", campaign: PROMO_CAMPAIGN }, { type: "campaignPushReceived", campaignId: PROMO_CAMPAIGN.id }],
  },

  // 生成与留存(spec §6.1、§6.3、§7.2)
  {
    id: "inspire",
    group: "生成与留存",
    title: "会员的 Inspire 首页",
    phase: "app",
    actions: pro,
    given: "Pro 会员打开 APP(已过首登流程)",
    expect: [
      "顶部 Banner + 四种模式入口(每张用该模式的真实成片当底图)+ Use Case 瀑布流",
      "会员不弹每日付费墙,也不弹运营弹窗(运营弹窗只给 Free)",
      "点 Use Case → 详情页 → Try it now 带着提示词、模式、参考图进 Create",
      "列表加载失败显示重试态;弱网先显示缓存",
    ],
  },
  { id: "create", given: "Free 用户进 Create", expect: ["Video 模式上方提前告知需要付费套餐"], group: "生成与留存", title: "Create 对话", phase: "app", actions: free, nav: [{ type: "tab", tab: "create" }] },
  {
    id: "sessions",
    group: "生成与留存",
    title: "会话抽屉:历史对话",
    phase: "app",
    actions: pro,
    nav: [{ type: "tab", tab: "create" }, { type: "sheet", sheet: { name: "sessions" } }],
    given: "Pro 会员在 Create 点左上角,打开会话抽屉",
    expect: [
      "从左侧滑出,主界面跟着右移;置顶的对话在前,其余按最近更新排序",
      "长按对话可重命名、置顶、删除",
      "顶部 New chat 开新对话",
    ],
  },
  {
    id: "attach",
    group: "生成与留存",
    title: "「+」添加素材 → 相册授权",
    phase: "app",
    actions: pro,
    nav: [{ type: "tab", tab: "create" }, { type: "sheet", sheet: { name: "attach" } }],
    given: "Pro 会员在 Create 第一次点输入框的「+」",
    expect: [
      "先弹系统相册授权框(样式照 iOS 真机),允许后显示附件面板",
      "附件面板:首行相机 + 最近照片;下面 Photos / Files / Assets",
      "只允许部分照片:只显示允许的那些,提示可去设置管理",
      "拒绝授权:最近照片位置提示去设置打开,点 Photos 也提示;相机、Files、Assets 照常可用",
    ],
  },
  {
    id: "marketing-optin", given: "Free 用户第一条图片生成完成", expect: ["弹营销推送轻问,只问一次", "Turn on = 打开 Offers & news"],
    group: "生成与留存",
    title: "第一条成片完成 → 营销轻问",
    phase: "app",
    actions: [...free, { type: "setComposer", patch: { mode: "image", text: "Iced latte poster" } }, { type: "submitPrompt", id: "demo-g" }, { type: "tick", ms: 8000 }],
    nav: [{ type: "tab", tab: "create" }],
  },
  { id: "rating", given: "Free 用户第一次保存成片", expect: ["弹系统评分框", "只请求一次"], group: "生成与留存", title: "保存成片 → 评分", phase: "app", actions: [...free, { type: "workSaved", id: LATTE_WORK }], nav: [{ type: "push", route: { name: "work", id: LATTE_WORK } }] },
  { id: "watermark", given: "Free 用户打开自己的成片", expect: ["成片带 BuzzVideo 水印;订阅后去掉"], group: "生成与留存", title: "Free 成片水印", phase: "app", actions: free, nav: [{ type: "push", route: { name: "work", id: LATTE_WORK } }] },

  // 裂变(spec §7.1)
  { id: "invite", given: "Free 用户进邀请好友", expect: ["好友注册得 500,好友首次订阅后双方各得 1,500,前 10 位", "复制链接 / 分享"], group: "裂变", title: "邀请好友", phase: "app", actions: free, nav: [{ type: "push", route: { name: "inviteFriends" } }] },

  // 异常与边界(spec §2.5、§4、§6、§7、§8.3)
  {
    id: "iap-failed",
    group: "异常与边界",
    title: "内购失败",
    phase: "app",
    actions: [...free, { type: "demo/setStoreKit", patch: { purchase: "failed" } }, { type: "openPaywall", trigger: "manual" }],
    given: "Free 用户点 Subscribe → 系统确认框点了购买,但扣款失败(卡被拒 / 网络中断)",
    expect: ["提示「Purchase didn't go through. You weren't charged.」", "停留在付费墙,可以再试", "订阅和积分都不变,不打 subscribe 事件"],
  },
  {
    id: "iap-pending",
    group: "异常与边界",
    title: "等家长批准(Ask to Buy)",
    phase: "app",
    actions: [...free, { type: "demo/setStoreKit", patch: { purchase: "pending" } }, { type: "openPaywall", trigger: "manual" }],
    given: "家庭共享里的孩子账号点了购买,需要家长批准",
    expect: ["提示「Waiting for approval…」并关闭付费墙", "批准后由 App Store 服务端通知开通;拒绝则什么都不变"],
  },
  {
    id: "restore-none",
    group: "异常与边界",
    title: "恢复购买:没有记录",
    phase: "app",
    actions: [...free, { type: "demo/setStoreKit", patch: { restore: "none" } }],
    nav: [{ type: "push", route: { name: "settings" } }, { type: "push", route: { name: "subscription" } }],
    given: "Free 用户点 Restore purchases,这个 Apple ID 没买过",
    expect: ["提示「No purchases to restore on this Apple ID」"],
  },
  {
    id: "restore-other",
    group: "异常与边界",
    title: "恢复购买:订阅属于其他账号",
    phase: "app",
    actions: [...free, { type: "demo/setStoreKit", patch: { restore: "otherAccount" } }],
    nav: [{ type: "push", route: { name: "settings" } }, { type: "push", route: { name: "subscription" } }],
    given: "账号 A 在这台 iPhone 订阅过,现在登录的是账号 B",
    expect: ["提示「This subscription belongs to another BuzzVideo account」", "B 仍是 Free;订阅永远归首次购买的账号 A"],
  },
  {
    id: "billing-retry",
    group: "异常与边界",
    title: "续费扣款失败(宽限期)",
    phase: "app",
    actions: [...pro, { type: "demo/setBillingRetry", on: true }],
    nav: [{ type: "tab", tab: "me" }],
    given: "Pro 会员续费时卡被拒,进入宽限期(iOS 3 天 / 安卓 7 天)",
    expect: ["Me 顶部和订阅管理页显示 Payment issue,点开拉起 App Store 付款设置", "宽限期内仍是会员,可用剩余积分;新一期积分等扣款成功再发", "宽限期结束仍未扣上 → 回 Free"],
  },
  {
    id: "exit-offer-expired",
    group: "异常与边界",
    title: "挽留优惠已过期",
    phase: "app",
    actions: [...onboarded, { type: "signIn" }, { type: "consumePaywallRequest" }, { type: "closePaywall", now: Date.now() - EXIT_OFFER_MS - 60_000 }, { type: "dismissExitOffer" }, { type: "setAiConsent", on: true }],
    given: "挽留抽屉弹出已超过 24 小时,用户没买",
    expect: ["Tab 栏上方没有倒计时胶囊", "付费墙 Starter 月付恢复 $19", "以后关闭付费墙也不再弹挽留"],
  },
  {
    id: "deeplink-removed",
    group: "异常与边界",
    title: "广告链接的 Use Case 已下架",
    phase: "app",
    actions: [{ type: "openDeepLink", useCaseId: "uc-removed" }, ...free],
    given: "用户点的广告对应的 Use Case 已经下架",
    expect: ["引导页用默认广告片", "登录后正常进 Inspire,不报错"],
  },
  {
    id: "promo-capped",
    group: "异常与边界",
    title: "运营弹窗已达频控",
    phase: "app",
    actions: [
      ...free,
      { type: "promoLoaded", campaign: PROMO_CAMPAIGN },
      { type: "appLaunched", day: 1 },
      { type: "dismissPromo" },
      { type: "appLaunched", day: 2 },
      { type: "consumePaywallRequest" },
      { type: "appLaunched", day: 2 },
    ],
    given: "Free 用户昨天已经看过运营弹窗(每人 1 次 / 7 天),今天冷启动第二次",
    expect: ["今天第一次冷启动照常弹付费墙", "第二次冷启动也不再弹运营弹窗(频控未到)"],
  },
  {
    id: "invite-capped",
    group: "异常与边界",
    title: "邀请奖励已满 10 位",
    phase: "app",
    actions: [...free, ...Array.from({ length: INVITE.maxRewards }, () => ({ type: "inviteRewardGranted" }) as AnyAction)],
    nav: [{ type: "push", route: { name: "inviteFriends" } }],
    given: "已有 10 位好友订阅,奖励到上限",
    expect: ["页面写明已拿满 10 次奖励,好友注册仍得 500", "仍可分享链接,但不再给双方发 1,500"],
  },
  {
    id: "free-retry",
    group: "异常与边界",
    title: "Free 重试失败的视频",
    phase: "app",
    actions: [...free, { type: "retryJob", id: "j-serum" }],
    nav: [{ type: "push", route: { name: "work", id: "j-serum" } }],
    given: "Free 用户的一条 Seedance 2.0 视频生成失败,点了 Retry",
    expect: ["不扣积分、不重新生成", "弹付费墙并直接开 Pro tab(这个模型 Starter 不能用)"],
  },
  {
    id: "push-denied-optin",
    group: "异常与边界",
    title: "推送已拒绝时开营销推送",
    phase: "app",
    actions: [...free, { type: "demo/setPermission", kind: "push", value: "denied" }, { type: "setComposer", patch: { mode: "image", text: "Iced latte poster" } }, { type: "submitPrompt", id: "demo-g" }, { type: "tick", ms: 8000 }],
    nav: [{ type: "tab", tab: "create" }],
    given: "用户登录时拒绝了系统推送,第一条成片完成后营销轻问点 Turn on",
    expect: ["Offers & news 打开", "提示「Turn on notifications in Settings to get offers」,不能再弹系统框"],
  },
  {
    id: "org-low",
    group: "异常与边界",
    title: "组织空间积分不足",
    phase: "app",
    actions: [...enterprise, { type: "demo/setCredits", credits: 20 }, { type: "setComposer", patch: { mode: "agent", text: "Make a 15s ad for our iced latte" } }, { type: "submitPrompt", id: "demo-o" }],
    nav: [{ type: "tab", tab: "create" }],
    given: "Enterprise 用户在 PressLogic 组织空间,组织积分只剩 20",
    expect: ["对话里提示联系管理员", "不弹付费墙、不弹积分包(组织积分由管理员管)"],
  },
  {
    id: "member-cap",
    group: "异常与边界",
    title: "组织成员额度已用完",
    phase: "app",
    actions: [
      ...enterprise,
      { type: "setMemberCap", workspace: "presslogic", id: "m-alex", cap: 1900 },
      { type: "setComposer", patch: { mode: "agent", text: "Make a 15s ad for our iced latte" } },
      { type: "submitPrompt", id: "demo-cap" },
    ],
    nav: [{ type: "tab", tab: "create" }],
    given: "Enterprise 成员本月已用 1,850,管理员给的上限是 1,900,再提交一条 Agent(60 积分)",
    expect: ["不提交、不扣组织积分、草稿保留", "对话里提示「You've used your monthly limit in PressLogic. Ask your admin to raise it.」", "Me 积分卡写明本月已用 / 上限", "和网页一致"],
  },
  {
    id: "empty-assets",
    group: "异常与边界",
    title: "素材为空(新用户)",
    phase: "app",
    actions: [...free, { type: "demo/setEmptyLibrary", on: true }],
    nav: [{ type: "tab", tab: "me" }],
    given: "刚注册的新用户,还没生成过任何东西,也没上传过素材",
    expect: ["Me 素材区不显示筛选,显示 3 张示例成片 +「Make your first ad」+ 引导文案", "按钮「Start with the Agent」直接进 Create 的 Agent 模式", "Create 没有历史会话;右栏「素材」开关可随时切换"],
  },
  {
    id: "email-wrong",
    group: "异常与边界",
    title: "邮箱验证码输错",
    phase: "app",
    actions: [...emailCode, { type: "demo/setEmailCodeSim", sim: "wrong" }, { type: "verifyEmailCode", code: "482913" }],
    given: "用户输了一个错误的验证码",
    expect: ["格子变红、抖一下,自动清空,可以直接重输", "提示「That code isn't right. 4 tries left.」", "连续输错 5 次 → 锁定"],
  },
  {
    id: "email-expired",
    group: "异常与边界",
    title: "邮箱验证码已过期",
    phase: "app",
    actions: [...emailCode, { type: "demo/setEmailCodeSim", sim: "expired" }, { type: "verifyEmailCode", code: "482913" }],
    given: "验证码发出太久(服务端判定过期)",
    expect: ["提示「This code has expired. Send a new one below.」", "不用等倒计时,Resend code 立即可点"],
  },
  {
    id: "email-locked",
    group: "异常与边界",
    title: "邮箱验证码输错太多次",
    phase: "app",
    actions: [
      ...emailCode,
      { type: "demo/setEmailCodeSim", sim: "wrong" },
      ...Array.from({ length: 5 }, () => ({ type: "verifyEmailCode", code: "482913" }) as AnyAction),
    ],
    given: "连续输错 5 次",
    expect: ["格子置灰锁定,不能再输", "提示「Too many tries. Send a new code to try again.」;重发后解锁、次数清零"],
  },
  {
    id: "offline",
    group: "异常与边界",
    title: "断网",
    phase: "app",
    actions: [...free, { type: "demo/setFaults", patch: { offline: true } }, { type: "setComposer", patch: { mode: "image", text: "Iced latte poster" } }],
    nav: [{ type: "tab", tab: "create" }],
    given: "Free 用户在 Create 写好了提示词,这时手机断网",
    expect: [
      "状态栏下方常驻「No internet connection」,恢复网络自动消失",
      "点发送:不提交、不扣积分,草稿留在输入框,提示「You're offline. Your draft is saved.」",
      "付费墙 / 积分包:显示骨架 + Retry,不能购买",
      "Retry、Regenerate、登录、恢复购买:都提示检查网络",
    ],
  },
  {
    id: "prices-failed",
    group: "异常与边界",
    title: "拉价失败",
    phase: "app",
    actions: [...free, { type: "demo/setFaults", patch: { prices: true } }, { type: "openPaywall", trigger: "manual" }],
    given: "网络正常,但 App Store 商品信息拉取失败",
    expect: ["价格选项换成骨架 + 「Couldn't load prices.」+ Retry", "不显示写死的价格,也没有购买按钮", "✕、Restore、Terms / Privacy 照常可用"],
  },
  {
    id: "signin-failed",
    group: "异常与边界",
    title: "第三方登录失败",
    phase: "app",
    actions: [{ type: "completeOnboarding" }, { type: "demo/setPermission", kind: "tracking", value: "denied" }, { type: "demo/setPermission", kind: "push", value: "granted" }, { type: "demo/setFaults", patch: { signIn: true } }],
    given: "用户点 Continue with Apple / Google,第三方返回失败",
    expect: ["停在登录页,提示「Couldn't sign in. Please try again.」", "用户自己取消第三方登录:不提示", "不发积分、不弹付费墙"],
  },
  {
    id: "media-failed",
    group: "异常与边界",
    title: "广告片加载失败",
    phase: "app",
    actions: [{ type: "demo/setFaults", patch: { media: true } }],
    given: "第一次打开,弱网导致引导页广告片加载不出来",
    expect: ["只显示首帧封面图", "Get started 照常可点,不阻塞流程"],
  },

];

export function buildPreset(j: Journey): { state: StoreState; nav: NavState } {
  return {
    state: j.actions.reduce(demoReducer, INITIAL_STATE),
    nav: (j.nav ?? []).reduce(navReducer, INITIAL_NAV),
  };
}

export const JOURNEY_GROUPS = [...new Set(JOURNEYS.map((j) => j.group))];
