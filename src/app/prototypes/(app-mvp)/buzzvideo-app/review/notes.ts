/**
 * 评审原型真机下方左栏:每个「屏」的交互说明(中文,演示用)。key 来自 surfaceOf。
 * 2026-10-20 定:像 PM 写交互说明一样，每屏只两块——
 *   rules 功能说明(进入时显示什么、点击 xxx → 怎样、什么情况下不一样)· errors 异常情况
 * 价格规则、审核依据、服务端细节以 spec 为准，不在这里展开;埋点统一在 events.ts(左栏「埋点」模块)
 * spec = docs/superpowers/specs/2026-10-14-buzzvideo-app-growth-design.md 的章节;MVP 指 2026-09-29-buzzvideo-app-design.md
 */
export type Note = {
  title: string;
  spec: string;
  rules: string[];
  errors?: string[];
};

/** 和内购有关的屏共用的异常情况 */
const IAP_ERRORS = [
  "系统确认框点 Cancel:回到原页面，不提示",
  "购买失败(卡被拒、网络中断):提示「Purchase didn't go through. You weren't charged.」,停在原页面可再试",
  "等家长批准(Ask to Buy):提示「Waiting for approval…」并关闭页面;批准后自动开通",
  "付款成功但服务端没收到:下次打开 APP 自动补登记;点 Restore purchases 也能补回",
];
/** 三个 Tab 页共用：底部导航栏 */
const TAB_BAR_RULE =
  "底部导航栏(Home / Create / Me;2026-10-21 Inspire 改名 Home):iOS 26 液态玻璃样式的悬浮胶囊，选中项浅色玻璃底 + 橙色图标文字;切换时浅色底滑过去(带回弹),按住一格轻微放大;滚动时不缩小、不隐藏;页面底部留出胶囊高度，内容不被挡住。真实 APP 直接用 iOS 系统原生 Tab 栏(React Native 选调用原生 Tab 栏的库，由研发评估),材质、切换动画、无障碍由系统处理，不照原型自己画;原型只定结构：三个 Tab、选中用品牌橙、关掉滚动缩小";
const PRICE_ERROR = "拉不到 App Store 价格(断网 / 拉价失败):价格区显示骨架 + Retry,不显示购买按钮";

export const NOTES: Record<string, Note> = {
  onboarding: {
    title: "引导页",
    spec: "§5 · MVP §5",
    rules: [
      "进入：全屏广告片静音循环播放(6 秒，信息流里刷 3 条 AI 广告),上面是标题「Turn any product into a video ad」+ 副标题 + Get started",
      "点击 Get started → iOS 直接弹系统 ATT 框，背后是登录页;Android 直接进登录页",
      "看过引导页的用户(如退出登录后)再打开 APP:跳过引导页，直接到登录页",
      "在引导页杀掉 APP:下次仍从引导页开始",
    ],
    errors: ["广告片加载失败 / 弱网：显示首帧封面图,Get started 照常可点"],
  },
  "perm-tracking": {
    title: "ATT 系统框",
    spec: "§8.1",
    rules: [
      "引导页点 Get started 后弹出，样式和按钮由系统决定，中间说明文字由研发填(用于衡量广告效果)",
      "点击 Allow / Ask App Not to Track → 都进入登录页",
      "只在 iOS 14.5+ 且没回答过时弹;回答过、Android 不弹",
    ],
    errors: ["用户在系统设置里关了「允许 App 请求跟踪」:不弹，按拒绝处理", "系统框没弹出或返回异常：按拒绝处理，不卡流程"],
  },
  login: {
    title: "登录页",
    spec: "§5 · MVP §6",
    rules: [
      "进入：黑底,logo + 标题「Create your first ad」+ 副标题「Sign up and get 500 free credits」+ 三个登录按钮整组居中;底部一行法律说明",
      "点击 Continue with Apple → 拉起 Apple 系统登录面板",
      "点击 Continue with Google → 系统提示框 → Google 选账号",
      "点击 Continue with email → 进入输入邮箱页",
      "登录成功：新用户得 500 积分 → 弹首登付费墙;老用户直接进 APP(今天没弹过付费墙的才弹)",
    ],
    errors: [
      "第三方登录中途取消：回登录页，不提示",
      "登录失败 / 断网:Toast「Couldn't sign in. Please try again.」",
      "账号已删除或封禁：提示联系 support,不进 APP",
    ],
  },
  "auth-apple-sheet": {
    title: "Apple 登录 · 系统面板",
    spec: "§5 · 审核指南 4.8",
    rules: [
      "第一次用这个 Apple 账户：面板显示 Name(可改)+ 邮箱二选一 Share My Email / Hide My Email(默认隐藏)",
      "登录过的 Apple 账户：只问「Sign in to BuzzVideo with your Apple Account?」",
      "点击 Continue → Face ID(没开的输锁屏密码)→ 面板收起 → 登录成功",
      "新用户：得 500 积分 → 首登付费墙;老用户：直接进 APP",
    ],
    errors: ["点击 ✕:回登录页，不提示", "Face ID 多次失败：系统转输密码;整体失败才回登录页提示重试"],
  },
  "auth-apple-verifying": {
    title: "Apple 登录 · Face ID",
    spec: "§5",
    rules: ["系统 Face ID 验证约 1 秒，通过后面板自动收起，进入 APP"],
    errors: ["服务端登录失败 / 断网：回登录页，提示「Couldn't sign in. Please try again.」"],
  },
  "auth-google-alert": {
    title: "Google 登录 · 系统提示",
    spec: "§5",
    rules: [
      "系统强制弹出「“BuzzVideo” Wants to Use “google.com” to Sign In」,文案改不了",
      "点击 Continue → 打开 Google 选账号页",
      "点击 Cancel → 回登录页，不提示",
    ],
  },
  "auth-google-chooser": {
    title: "Google 登录 · 选账号",
    spec: "§5",
    rules: [
      "进入：系统网页面板，列出手机上登录过的 Google 账号",
      "点击某个账号 → 面板收起 → 登录成功(新用户得 500 积分 → 首登付费墙)",
      "点击 Use another account → Google 的账号密码页",
    ],
    errors: ["点击 Cancel:回登录页，不提示", "服务端登录失败 / 断网：回登录页提示重试"],
  },
  "email-email": {
    title: "邮箱登录 · 输入邮箱",
    spec: "§5 · 和网页同一流程",
    rules: [
      "进入：标题「Continue with email」+ 说明 + 邮箱输入框，自动弹出键盘",
      "邮箱格式不对：Continue 置灰;离开输入框时红框提示「Enter a valid email address.」",
      "点击 Continue(或键盘 Go)→ 发送 6 位验证码，进入输入验证码页",
      "点击返回 → 回登录页",
    ],
    errors: ["断网：提示检查网络，停在本页"],
  },
  "email-code": {
    title: "邮箱登录 · 输入验证码",
    spec: "§5 · 和网页同一流程",
    rules: [
      "进入：标题「Check your email」+「We sent a 6-digit code to 邮箱」+ 6 个格子，数字键盘;iOS 可从邮件自动填充、支持粘贴",
      "输满 6 位 → 自动提交，显示「Verifying…」→ 通过后登录(新用户得 500 积分 → 首登付费墙)",
      "「Resend in 56s」倒计时 60 秒，到点变「Resend code」,点击重发(旧码失效)",
      "点击 Change 或返回 → 回输入邮箱页，邮箱保留",
    ],
    errors: [
      "验证码错误：格子变红、抖动、清空，提示「Invalid code. Please try again.」;不限次数",
      "验证码过期：提示「This code has expired. Send a new one below.」,Resend 立即可点",
      "断网：提交 / 重发都提示检查网络，已输入内容不丢",
    ],
  },
  "perm-push": {
    title: "推送授权",
    spec: "§5 · MVP §2",
    rules: [
      "第一次真正提交生成时弹系统推送框(被积分不足、付费墙拦下的不算)",
      "点击 Allow → 之后生成完成会推送通知",
      "点击 Don't Allow → 生成完成只在 APP 内提示;系统只允许问一次",
    ],
  },
  "perm-camera": {
    title: "相机授权",
    spec: "MVP §6",
    rules: ["在「+」面板第一次点相机时弹系统框", "允许 → 打开相机"],
    errors: ["已拒绝后再点相机：提示去系统设置打开，带 Open Settings 按钮"],
  },
  "perm-photos": {
    title: "相册授权",
    spec: "MVP §6",
    rules: ["第一次选照片时弹系统框", "选「只允许部分照片」→ 只显示选中的照片，面板顶部可添加更多"],
    errors: ["拒绝：提示去系统设置打开;Files / Assets 不受影响"],
  },
  plans: {
    title: "付费墙",
    spec: "§3",
    rules: [
      "什么时候弹：首次登录自动弹一次;之后 Free 用户冷启动时距上次自动弹出满 24 小时再弹一次;想生成视频、选了锁定模型、积分不足、点运营弹窗时也弹",
      "进入：默认 Starter tab、选中年付;上半屏是该档积分 + 权益，下半屏白色面板是年付 / 月付两行 + Continue",
      "点击 Starter / Pro / Ultra tab → 切换档位，背景、积分、权益、价格跟着换;每个 tab 默认选年付",
      "点击年付 / 月付行 → 选中该周期",
      "点击 Continue → App Store 确认框 → 购买成功回到「我的」页，订阅标签换档并闪一下",
      "左上角 ✕ 3 秒后才出现;点击 ✕ → 关闭付费墙(Free 用户可能接着出现挽留页，见挽留页)",
      "点击 Restore → 恢复购买",
      "美区：底部多一行「Or subscribe on buzzvideo.ai ›」,点击用系统浏览器打开网页",
      "点击 Terms / Privacy → 打开对应网页",
      "已是 APP 会员：停在自己的档位，显示「You're on … · Renews on 日期」;换更高档按钮写 Upgrade to …(立即生效),换更低档写 Switch to …(下个续费日生效)",
      "网页订阅的会员：只显示「Subscribed on the web」,没有购买按钮",
      "挽留优惠 24 小时内：Starter 月付行显示 $9.50 首月，按钮写「Get 50% off · $9.50 first month」",
    ],
    errors: [...IAP_ERRORS, PRICE_ERROR],
  },
  exitOffer: {
    title: "挽留页",
    spec: "§4",
    rules: [
      "什么时候出现:Free 用户点付费墙 ✕ 时——没领过 → 出现并开始 24 小时倒计时;领过且还在 24 小时内 → 再次出现;已过期 → 不出现",
      "每台手机只有一次机会(存本机),换账号也不再有，卸载重装后重新有;会员、Enterprise 用户不出现",
      "挽留功能由服务端开关控制：关闭时点付费墙 ✕ 直接关，不出现挽留页、胶囊和优惠价",
      "这个 Apple ID 已经用过 Starter 首期优惠(苹果规定每个订阅组只能享受一次):不出现",
      "以上条件任何付费墙点 ✕ 都适用(首登、每日冷启动、点视频、锁定模型、积分不足)",
      "进入：全屏页，上面倒计时「Offer ends in 23:59:59」+ 标题「Wait — your first month is 50% off」+ 4 条权益;下面 $9.50(划线 $19)+ 续费说明",
      "点击 Get my 50% off now → App Store 确认框 → 开通 Starter 月付，回到「我的」页",
      "点击 Maybe later 或 ✕ → 关闭，回首页;24 小时内首页 Tab 栏上方显示挽留横幅，点击重新打开挽留页",
      "24 小时到期：胶囊消失，付费墙恢复原价",
    ],
    errors: [...IAP_ERRORS.slice(0, 3), "购买失败：挽留页保持打开，优惠仍有效", PRICE_ERROR],
  },
  promo: {
    title: "首页运营弹窗",
    spec: "§6.2",
    rules: [
      "什么时候弹：有活动时 Free 用户进入 Inspire 弹出;默认每人 7 天 1 次;这次冷启动已弹过付费墙就不弹;会员、Enterprise 不弹",
      "进入：活动图 + 标题 + 描述 + 卖点 + 按钮「Get my 35% bonus now」",
      "点击按钮 → 打开付费墙，积分显示加赠后的数量",
      "点击 ✕ → 关闭",
    ],
    errors: ["活动图加载失败：隐藏图片，其余照常", "活动接口失败：当作没有活动，不弹"],
  },
  campaignPush: {
    title: "活动推送",
    spec: "§6.3",
    rules: [
      "活动上线时推一条，只发给打开了 Offers & news 且允许推送的用户",
      "点击推送 → 打开 APP 并弹付费墙",
      "APP 在前台时：顶部横幅出现，5 秒后自动收起",
    ],
    errors: ["活动已下线后点旧推送：进 Inspire,不弹付费墙"],
  },
  rating: {
    title: "评分弹窗",
    spec: "§6.1",
    rules: [
      "第一条成片保存或分享成功后，弹系统评分框;每个账号只请求一次",
      "举报过内容、最近一次生成失败时不弹",
      "是否真的显示由系统决定(每年最多 3 次)",
    ],
  },
  marketingOptIn: {
    title: "营销推送轻问",
    spec: "§6.3",
    rules: [
      "第一条成片完成时问一次:「Get notified about bonus credits and new models?」",
      "点击 Turn on → 打开 Offers & news;系统推送还没问过的接着弹系统框;已拒绝的提示去设置打开",
      "点击 Not now → 关闭，以后只能在设置里打开",
      "已在设置里打开过 Offers & news 的不问",
    ],
  },
  aiConsent: {
    title: "AI 数据授权",
    spec: "MVP",
    rules: ["第一次点发送时弹出：说明提示词和上传内容会发给第三方 AI 服务", "点击同意 → 提交生成;点击不同意 → 不提交，草稿保留", "在设置里可撤回"],
  },
  inspire: {
    title: "Inspire",
    spec: "MVP §5.1 · §6.2",
    rules: [
      "进入：顶部 Banner(视频 + 右下角 Try it now)+ 工具入口 + 分类筛选 + Use Case 瀑布流",
      "工具入口 15 个，每页 2×4 左右滑动翻页：AI Agent / Generate Image / Generate Video / Generate Audio / Product to Video / AI Avatar / Lip Sync / Remove Background / Virtual Try-On / Upscale / Link to Ad / Product Photo / Magic Eraser / Expand Image / Edit Video(后 11 个按竞品里的普及度排)",
      "点击工具 → 进 Create 的 Agent 模式，输入框里填上该工具对应的提示词开头(如 Lip Sync →「Make the person in this video say: 」),光标在末尾接着写;需要图片 / 视频的工具(抠图、产品图、试穿等)直接弹「+」附件面板",
      "灵感流分类标签(纯文字，选中白色加粗 + 橙色短下划线):运营位 Trending(默认，按做同款次数排)/ New / 节日专题(现在是 Halloween)+ 广告玩法 UGC / Unboxing / Before & After / Product Showcase / Sale & Promo(不按行业筛);筛不到内容显示「No ideas here yet.」;分类、排序、上下线、专题都由运营后台配置",
      "灵感卡：左上角角标是用到的模型 / 工具;标题下「2.4k made」是做同款次数",
      "点击 Use Case → Use Case 详情 → Make one like this(做同款：带上提示词、模式、参考图进 Create)",
      "有活动时进入会弹运营弹窗;挽留优惠 24 小时内 Tab 栏上方显示挽留横幅(50% OFF + 倒计时 + Claim),点击打开挽留页",
      "右上角积分胶囊：个人空间显示自己的积分;组织空间只有 Owner / Admin 显示组织积分，普通成员不显示",
      TAB_BAR_RULE,
    ],
    errors: ["列表加载失败：显示重试;弱网先显示缓存"],
  },
  create: {
    title: "Create",
    spec: "MVP §5.2 · §5.2",
    rules: [
      "输入提示词，点击发送 → 扣积分开始生成;第一次发送时弹推送授权",
      "Free 选 Video 模式：输入框上方提示「Video is included with paid plans」;点击发送 → 弹付费墙，不扣积分、保留草稿",
      "Free 用 Marketing Agent:照常出方案，到生成视频那步弹付费墙",
      "选了锁定模型点击发送 → 付费墙直接开在 Pro tab",
      "积分不足点击发送:Free → 弹付费墙;会员 → 弹积分包;组织空间 → 提示联系管理员",
      "同时生成数到上限点击发送：不提交，提示等待;Free / Starter / Pro 带 See plans 按钮",
      "组织成员本月用量超过管理员设的上限：不提交，提示找管理员",
      TAB_BAR_RULE,
    ],
    errors: [
      "生成失败：任务卡显示失败 + Retry,积分自动退回;点击 Retry 按发送同一套规则重新扣积分",
      "Free 对视频 / Agent 任务点 Retry:直接弹付费墙",
      "断网时点发送：发送置灰，提示联网后再试，草稿保留",
    ],
  },
  me: {
    title: "Me",
    spec: "MVP §5.3 · §2.3 · §7.1",
    rules: [
      "进入：名字旁订阅标签(Free / Starter / Pro / Ultra / Enterprise)+ 积分卡 + 作品 / 素材",
      "积分卡：大字余额;会员显示订阅积分(每月重置)和永久积分两段;点击积分卡 → 付费墙",
      "会员点击 Buy credits → 积分包",
      "美区会员点击 Top up on web → 用浏览器打开网页充值",
      "点击 Invite friends → 邀请好友(只在个人空间)",
      "Enterprise 用户点击顶部工作区 → 切换 Personal / 组织",
      "余额变化时数字滚动;邀请奖励、每月发放到账时弹来源提示",
      "新用户没有作品：显示示例成片 + 按钮「Start with the Agent」,点击进 Create",
      TAB_BAR_RULE,
    ],
    errors: ["扣款失败：顶部红框「Payment issue」,点击打开 App Store 付款设置", "积分 ≤ 20:余额标红"],
  },
  useCase: {
    title: "Use Case 详情",
    spec: "MVP §4",
    rules: ["点击 Try it now → 带着提示词、模式、参考图进 Create", "Free 看视频 / Agent 类：按钮下提示「Video ads are included with paid plans.」"],
  },
  work: {
    title: "成片详情",
    spec: "MVP §4 · §6.1 · §7.2",
    rules: [
      "点击 Save → 保存到相册;点击 Share → 分享面板(第一次成功后触发评分弹窗)",
      "点击更多 → Regenerate / Copy prompt / Report / Delete",
      "Free 用户个人空间的成片带水印，订阅后去掉",
    ],
    errors: ["没有相册权限：提示去设置打开"],
  },
  subscription: {
    title: "订阅管理",
    spec: "§2.5",
    rules: [
      "进入：会员卡(档位 + 周期 + 每月积分 + 续费日期)+ 扣费渠道 + Change plan + Restore purchases",
      "点击 Change plan → 付费墙;升级立即生效，降级 / 换周期到下个续费日生效",
      "点击 Restore purchases → 恢复购买",
      "点击最底部 Cancel subscription → 打开 App Store 系统订阅页",
      "有待生效的变更：显示「Changes on 日期」",
      "已取消自动续费：显示「Ends on 日期」,到期回 Free,买的积分包保留",
      "网页订阅：显示「在 buzzvideo.ai 管理」,没有取消入口",
      "网页 + App Store 重复订阅：提示取消 App Store 那份并申请退款",
    ],
    errors: [
      "Restore 没有记录:「No purchases to restore on this Apple ID」",
      "Restore 属于其他账号:「This subscription belongs to another BuzzVideo account」",
      "扣款失败：红框「Payment issue」+ Update payment method;宽限期后仍失败回 Free",
    ],
  },
  settings: {
    title: "设置",
    spec: "§6.3 · MVP §4",
    rules: [
      "Generation updates(默认开)/ Offers & news(默认关)两个开关",
      "点击 Subscription → 订阅管理;Restore purchases、隐私政策、退出登录、删除账号",
      "Help:Pro / Ultra 有 Contact support;Enterprise 是 Your account manager;Free / Starter 只有 Help Center",
      "点击 Sign out → 确认后回登录页",
    ],
    errors: ["系统推送已拒绝时打开通知开关：提示去系统设置"],
  },
  members: {
    title: "组织成员",
    spec: "MVP",
    rules: ["Admin / Owner 可见", "点击成员 → 设置每月积分上限", "点击邀请 → 邮箱邀请或复制链接"],
  },
  inviteFriends: {
    title: "邀请好友",
    spec: "§7.1",
    rules: [
      "进入：大字「1,500」+「for you and each friend who subscribes」+ 10 个好友位(已得奖励的点亮)",
      "点击 Copy → 复制邀请链接;点击 Share invite link → 系统分享面板",
      "好友注册得 500;好友首次订阅后双方各得 1,500;只奖励前 10 位",
      "满 10 位后仍可分享，页面写明不再发奖励",
    ],
    errors: ["好友订阅后退款：奖励扣回", "自己邀请自己：不发奖励"],
  },
  camera: { title: "相机", spec: "MVP", rules: ["拍照后直接作为附件加到输入框"] },
  "sheet-topUp": {
    title: "积分包",
    spec: "§2.3",
    rules: [
      "会员积分不足提交生成时自动弹出;或在 Me 点击 Buy credits",
      "8 档 $10–$300,永不过期;活动在线时显示「+X bonus」",
      "点击某档 → App Store 确认框 → 到账",
      "美区底部有网页充值外链",
    ],
    errors: [...IAP_ERRORS, PRICE_ERROR],
  },
  "sheet-sessions": { title: "会话抽屉", spec: "MVP §4", rules: ["点击左上角或从左侧右滑 → 抽屉滑出", "点击会话 → 打开;长按 → 重命名 / 置顶 / 删除"] },
  "sheet-sessionActions": { title: "会话操作", spec: "MVP §4", rules: ["点击重命名 / 置顶 / 删除"] },
  "sheet-attach": { title: "「+」附件面板", spec: "MVP §4", rules: ["点击输入框「+」→ 弹出面板", "首行相机 + 最近照片;下面 Photos / Files / Assets"] },
  "sheet-mode": {
    title: "模式",
    spec: "MVP §2 · §5.2",
    rules: ["选择 Marketing Agent / Image / Video / Audio", "Free 用户 Video 行标「Starter+」,仍可选，发送时弹付费墙"],
  },
  "sheet-model": {
    title: "模型参数",
    spec: "MVP §4 · §5.2",
    rules: ["锁定的模型带「Pro」标，仍可选;发送时弹付费墙 Pro tab", "Starter 视频默认 Seedance 2.0 Fast"],
  },
  "sheet-share": { title: "分享", spec: "MVP §4", rules: ["点击 Instagram / TikTok / RED / WhatsApp → 跳到对应 APP", "选了渠道才算分享成功(触发评分)"] },
  "sheet-workMore": { title: "成片更多操作", spec: "MVP §4", rules: ["点击 Regenerate / Copy prompt / Report / Delete"] },
  "sheet-report": { title: "举报", spec: "MVP §6", rules: ["选择原因提交，24 小时内处理", "举报过的用户不再弹评分"] },
  "sheet-workspace": { title: "工作区切换", spec: "MVP §5.3", rules: ["点击 Personal 或组织 → 切换，积分、作品、素材都换", "组织空间没有付费墙、积分包和邀请好友"] },
  "sheet-confirmDelete": {
    title: "删除账号",
    spec: "MVP §6",
    rules: ["点击删除账号 → 二次确认 → 删除并回登录页", "有 APP 订阅：确认页提示先去 App Store 取消(删号不会自动取消)", "网页订阅随账号一起取消"],
  },
  "sheet-transferWorkspace": { title: "转移工作区", spec: "MVP", rules: ["组织 Owner 删号前，必须先选一位成员转移组织"] },
  "sheet-invite": { title: "邀请组织成员", spec: "MVP", rules: ["输入邮箱邀请，或点击复制链接"] },
  "sheet-memberCap": { title: "成员积分上限", spec: "MVP", rules: ["加减步长 100,不能低于本月已用"] },
};
