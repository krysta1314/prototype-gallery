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
    errors: [
      "拒绝过后:生成卡上「Get a heads-up when it’s ready. Turn on」、设置页 Generation updates → 直接跳 iOS 设置 › BuzzVideo › Notifications",
      "拒绝过后打开 Offers & news:弹提示框「Notifications Are Off」(Cancel / Settings)",
    ],
  },
  "perm-camera": {
    title: "相机授权",
    spec: "MVP §6",
    rules: ["在「+」面板第一次点相机时弹系统框", "允许 → 打开相机"],
    errors: ["已拒绝后再点相机：系统不会再弹授权框，APP 弹 iOS 样式提示框「Camera Access Is Off」(Cancel / Settings);点 Settings → 跳到 iOS 设置 › BuzzVideo,打开 Camera 后回到 APP 即可使用"],
  },
  "perm-photos": {
    title: "相册授权",
    spec: "MVP §6",
    rules: ["第一次选照片时弹系统框", "选「只允许部分照片」→ 只显示选中的照片，面板顶部可添加更多"],
    errors: ["拒绝：附件面板相册位置提示 + Open Settings 按钮，点了直接跳 iOS 设置 › BuzzVideo(可选 None / Limited Access / Full Access);Camera / Assets / Files 不受影响"],
  },
  plans: {
    title: "付费墙",
    spec: "§3",
    rules: [
      "什么时候弹：首次登录自动弹一次;之后 Free 用户冷启动时距上次自动弹出满 24 小时再弹一次;想生成视频、选了锁定模型、积分不足、Free 下载去水印、点运营弹窗时也弹;这些被动触发都不在面板顶部写原因(2026-10-23 去掉)",
      "进入：默认 Starter tab、选中年付;上半屏是该档积分 + 权益，下半屏白色面板是年付 / 月付两行 + Continue",
      "点击 Starter / Pro / Ultra tab → 切换档位，背景、积分、权益、价格跟着换;每个 tab 默认选年付",
      "点击年付 / 月付行 → 选中该周期",
      "点击 Continue → App Store 确认框 → 购买成功回到「我的」页，订阅标签换档并闪一下",
      "左上角 ✕ 3 秒后才出现;点击 ✕ → 关闭付费墙(Free 用户可能接着出现挽留页，见挽留页)",
      "点击 Restore → 恢复购买",
      "美区：底部多一行「Or subscribe on buzzvideo.ai ›」,点击用系统浏览器打开网页",
      "点击 Terms / Privacy → 打开对应网页",
      "已是 APP 会员：停在自己的档位，年付 / 月付两行禁用，当前那行标「Current plan」,没有购买按钮(取消、换周期去订阅管理页);换更高档按钮写 Upgrade to …(立即生效),换更低档写 Switch to …(下个续费日生效)",
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
      "左上角 ✕ 和付费墙一样，进页面 3 秒后才淡入;拿不到价格(断网 / 拉价失败)时立即出现",
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
      "灵感流分类标签(纯文字，选中白色加粗 + 橙色短下划线):运营位 Trending(默认，按做同款次数排)/ New(节日专题由运营按需上，现在没有)+ 广告玩法 UGC / Unboxing / Before & After / Product Showcase / Sale & Promo(不按行业筛);筛不到内容显示「No ideas here yet.」;分类、排序、上下线、专题都由运营后台配置",
      "灵感卡：整张是成片，名字压在图片底部居中(白色粗体 + 底部暗渐变),不放角标和做同款次数",
      "点击 Use Case → Use Case 详情(整屏成片，上下滑切上一个 / 下一个)→ 底部大按钮做同款(带上提示词、模式、参考图进 Create)",
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
      "空状态顶部：左边 ☰ 打开历史会话，右边积分胶囊;进入对话后显示标题 + 新建",
      "积分胶囊:Free 用户是「积分 | Upgrade」,点积分去 Me,点 Upgrade 直接开付费墙;付费会员只显示积分(首页 Banner 上的胶囊同样)",
      "热门玩法轮播(运营后台配置，左上角 Trending / New / Top 标签):中间一张放大、视频在播，两边小一号压暗;左右滑吸附到最近一张",
      "点击中间那张的 Try it → 把提示词、模式、参考图填进输入框，留在创作页;点击两边的卡 → 滑到那一张",
      "点击轮播下面的一句话提示词 → 填进输入框(Agent 模式)",
      "输入框上方快捷工具条：左右滑;点击工具 → Agent 模式 + 填提示词，要先选图的工具直接弹附件面板;点击最右边网格按钮 → 弹出全部工具(两列，名字 + 一句话)",
      "点击输入框 → 输入态：收起灵感轮播、提示词和工具条，只留输入框(变高);右上积分 + ✕ 退出输入态;Free 用户输入框上面接一条品牌色升级引导「Make video ads and HD with a plan ›」,点了开付费墙(会员不显示);写了内容后发送键变白;Image / Video / Audio 模式键上显示这次要扣的积分(键变宽),Agent / Hybrid Reel 不显示(按实际做出来的扣);发送后进入对话",
      "Agent / Hybrid Reel 模式输入框里有 Web Explore 开关：打开后 Agent 先上网查同类在投广告、热门玩法再出方案;选中是品牌色淡底 + 同色细边",
      "点击输入框里的 Auto / 模型名 → Model Settings(照网页版生成设置):Agent 模式顶部 Video / Image 胶囊切换;Model 下拉，右边 Auto 开关(默认开);Aspect Ratio(Auto + 1:1 / 3:4 / 4:3 / 9:16 / 16:9 / 21:9)、Resolution、Duration(Auto + 4–30s,可横滑)、With Audio(No / Yes);所有选中态都是品牌色淡底 + 同色细边",
      "单独的 Image / Video / Audio 模式：只显示这个模式的模型、比例、时长 / 清晰度、一次出几个;设置发送后不清空",
      "会员专属的模型、1080p、2K / 4K 带钻石标:Free 点击 → 弹付费墙",
      "Image / Video / Audio:输入提示词，点击发送 → 扣积分开始生成;第一次发送时弹推送授权",
      "Image / Video / Audio 的结果卡(照网页版):上面一行「提示词 + 模型 · 比例 · 清晰度(· 时长)」,卡片按选的比例出，生成中是杏粉色流动渐变 + 左上角 Generating…(不显示进度条和百分比);完成后视频卡是内嵌播放器(中间播放键，底部播放 / 声音 / 时间 / 进度 / 全屏),图片和视频卡右上角一排(和网页版一致):编辑(把提示词带回输入框)/ @(把这张作为参考素材放进输入框)/ 收藏 / 下载 / 重新生成;下面 Edit(提示词放回输入框)/ Retry · N credits(同样参数再来一次)",
      "Audio 模式输入框多一个 Voice 按钮(显示当前音色名)→ Select or add a voice:Preset voice(Gender / Language / Style 筛选，两列音色卡可试听，点卡片选中)/ My voice(自己克隆的音色，和预设一样能试听;Clone voice → 打开 iOS「文件」,只能选 MP3 / M4A / WAV,选好后显示 Cloning…,约几秒后可用;上传文件不需要麦克风权限)",
      "Audio 的 Model Settings:Format(MP3 / WAV)、Sample Rate、Speed / Volume / Pitch 滑块、Enable subtitle 开关、Outputs",
      "Agent / Hybrid Reel:发送后先「✦ Thinking…」→ 想完变成可展开的「Thought for Ns ›」→ 一段回复 + Generation plan 卡(每项图标 / 标题 / 积分 / View prompt / 参数，右上 Awaiting confirmation);点 Confirm · N credits 才扣积分开始生成(卡片变 Confirmed),点 Cancel 不扣积分",
      "第一条成片完成：不再弹 APP 自己的营销轻问卡，还没问过推送就直接弹系统推送授权框",
      "Free 选 Video 模式：输入框顶上挂一条品牌色引导带「Video is included with paid plans ›」(键盘收起 / 弹起都在，点了开付费墙);点击发送 → 弹付费墙，不扣积分、保留草稿",
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
      "页面顺序：个人信息 → 积分 / 邀请两张并排小卡 → 素材(Assets);顶栏只有设置",
      "个人信息：小头像(点击换头像)+ 名字 + 订阅标签(Free / Starter / Pro / Ultra / Enterprise)+ 邮箱",
      "会员 / Enterprise:顶部铺一层套餐色光晕(Starter 琥珀、Pro 橙、Ultra 紫、Enterprise 金),从左上角散开、往下渐隐;Free 是纯底色",
      "积分卡：余额 + 一个橙色动作。Free 是「Upgrade」→ 付费墙;会员是「Buy credits」→ 积分包;组织 Owner / Admin 是「Members」;组织普通成员写「Managed by your admin」,下面一条本月用量进度",
      "邀请卡:+1,500 credits per friend,点击进邀请好友(只在个人空间，组织空间不显示)",
      "素材区：标题 Assets + 按类型的下划线 tab(All / Images / Videos / Audio,有文档才出 Docs,然后 Favorites)+ 三列网格;Enterprise 在 Assets 标题右边有一个小分段控件 Mine | Team(选中那段亮一档),Team Assets 里没有 Favorites;生成的作品和上传的素材混在一起;新用户没素材时不出 tab,直接显示示例成片",
      "Enterprise 用户点击顶部工作区 → 切换 Personal / 组织",
      "余额变化时数字滚动;邀请奖励、每月发放到账时弹来源提示",
      "新用户没有作品：三张示例成片扇形叠放(中间正放、两边斜压)+「Make your first ad」+ 小胶囊按钮「Start creating」,点击进 Create 的 Agent 模式",
      TAB_BAR_RULE,
    ],
    errors: ["扣款失败：顶部红框「Payment issue」,点击打开 App Store 付款设置", "积分 ≤ 20:余额标红，积分卡下面一条红色提示「Only N credits left…」,点击：会员 → 积分包,Free → 付费墙"],
  },
  useCase: {
    title: "Use Case 详情",
    spec: "MVP §4",
    rules: [
      "进入：整屏成片(2026-10-21 按即梦模板详情改);左上 ✕ 关闭;右侧点赞(数字)+ Share + Download;左下标题 + 说明(默认两行，点一下展开全文 / 再点收起);底部白色大按钮 + More",
      "上下滑 → 切到灵感流里同一分类的上一个 / 下一个(像短视频流);组图左右滑翻图，底部分段进度条",
      "点击底部大按钮 Use this template → 带着提示词、模式、参考图进 Create(做同款)",
      "点击 Share → 弹出 iOS 系统分享面板(AirDrop、联系人、Messages / Mail / Instagram / TikTok / WhatsApp、Copy、Save Video);真实 APP 直接调系统 Share API;点击 Download → 存到相册，提示「Saved to Photos」(第一次弹系统「添加到照片」授权框;拒绝过弹提示框去设置打开);点击 More → 举报",
    ],
  },
  "sheet-feedback": {
    title: "反馈",
    spec: "和网页 Give Feedback 一致",
    rules: [
      "设置 › Help Center 打开",
      "Feedback type:Bug / Feature Request / Other 单选，默认 Bug;选中是品牌色淡底 + 细边",
      "Description 必填，写了才能点 Submit Feedback",
      "Attachments 选填：图片最多 20 张、视频最多 5 个，每个不超过 50MB;点虚线框打开系统照片选择器(不需要相册权限)，缩略图右上角 × 删除",
      "Submit → 提示「Thanks for your feedback!」并关闭;提交时自动带设备型号、系统版本、APP 版本",
    ],
    errors: ["超过数量或 50MB:提示「Up to 20 images and 5 videos, 50MB each」,不加入", "提交失败：留在面板，提示重试，已填内容不丢"],
  },
  "sheet-contactSales": { title: "联系销售", spec: "和网页 Contact Sales 一致", rules: ["非 Enterprise 用户点 Hybrid Reel 时打开", "Name / Email(预填登录邮箱)/ Description(0 / 2000),三项必填，填完 Send 才可点", "Send → 提示「Thanks! We'll get back to you within 1 business day.」并关闭;Cancel 关闭"] },
  "sheet-prompt": { title: "查看提示词", spec: "MVP §4", rules: ["成片「…」→ View prompt 打开", "标题 = 作品名;Prompt 整段显示，右侧复制键 → 提示「Prompt copied」", "Model Config:模型、比例、清晰度、时长(视频)/ 采样率(音频);Agent / Hybrid Reel 写模式 + Auto"] },
  work: {
    title: "成片详情",
    spec: "MVP §4 · §6.1 · §7.2",
    rules: [
      "页面分两块：上面预览区(画面、右下角水印、底边进度条),下面操作区(标题 + 两个圆键 + 主按钮)",
      "一次生成多份(多图 / 多视频):预览区左右滑翻页，顶部中间「1 / 3」,底部小圆点(点圆点也能翻);只有当前页的视频在播，翻页后进度从头开始;Download / Share 针对当前这一份",
      "主按钮 Download → 保存到相册;有多份时按钮是「Download all (N)」,默认全部保存;第一次保存先弹系统「添加到照片」授权框，允许后保存",
      "Free 用户(带水印)点 Download → 先弹「Remove the watermark?」:Remove watermark → 付费墙(trigger = watermark,Starter tab);Download with watermark → 照常保存(带水印);点弹窗外面 = 取消",
      "圆键转发箭头 → 分享面板(第一次成功后触发评分弹窗);圆键对话图标 → 回到这条对话继续改",
      "画面下方：进度条(可点任意位置跳转、按住拖动，拖时变粗)+ 标题;不显示时长 / 模式 / 模型那行小字",
      "点击画面 → 暂停 / 继续",
      "点击右上「…」→ 按钮下方弹出悬浮小菜单:Regenerate / Add to favorites / View prompt;点菜单外收起",
      "Free 用户个人空间的成片右下角带 BuzzVideo 水印(导出的文件也带),订阅后去掉",
    ],
    errors: ["相册权限拒绝过再点 Save:弹提示框「Photo Access Is Off」(Cancel / Settings),点 Settings 跳到 iOS 设置 › BuzzVideo"],
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
      "Generation updates(跟随系统通知权限，点进 iOS 设置)/ Offers & news(营销推送，默认关);分组下不放说明小字",
      "点击 Subscription → 订阅管理;Restore purchases、隐私政策、退出登录、删除账号",
      "Help Center 打开反馈面板(Bug / Feature Request / Other + 描述 + 附件),所有方案一样;不再单独放 Contact support / 客户经理",
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
      "页面：暖色头图(左上返回)+ 两张圆角卡叠在头图上;不放单独的规则页，规则都写在两张卡里",
      "卡 ①:「Invite friends, earn 1,500 credits」(1,500 品牌橙)+ 一句好友注册得 500;两个统计格：已得积分 / 已邀请人数(x/10,点 + 也能邀请);主按钮 Invite friends → 系统分享面板;Copy link → 复制邀请链接",
      "卡 ②:Earn credits in 3 steps(分享链接 → 好友注册并订阅 → 双方各得 1,500)",
      "好友注册得 500;好友首次订阅后双方各得 1,500;只奖励前 10 位",
      "满 10 位后仍可分享，页面写明不再发奖励",
    ],
    errors: ["好友订阅后退款：奖励扣回", "自己邀请自己：不发奖励"],
  },
  camera: {
    title: "相机",
    spec: "MVP",
    rules: [
      "按快门 → 确认页(iOS 系统相机样式):左下 Retake 重拍，右下 Use Photo / Use Video;点 Use 才作为附件加到输入框",
      "切到 Video 第一次录：弹系统麦克风授权框(允许才能录带声音的视频)",
    ],
    errors: ["麦克风拒绝过再录视频：弹提示框「Microphone Access Is Off」(Cancel / Settings),点 Settings 跳到 iOS 设置 › BuzzVideo"],
  },
  "perm-microphone": {
    title: "麦克风授权",
    spec: "MVP §6",
    rules: ["在相机切到 Video 第一次按录制时弹系统框", "允许 → 开始录制;拒绝 → 不录，之后再按会提示去设置打开"],
  },
  "sheet-topUp": {
    title: "积分包",
    spec: "§2.3",
    rules: [
      "会员积分不足提交生成时自动弹出;或在 Me 点击 Buy credits",
      "8 档 $10–$300,永不过期;活动在线时显示「+X bonus」",
      "点击某档 → App Store 确认框 → 到账",
      "底部不放网页充值外链和使用顺序说明(2026-10-23 去掉)",
    ],
    errors: [...IAP_ERRORS, PRICE_ERROR],
  },
  "sheet-sessions": { title: "会话抽屉", spec: "MVP §4", rules: ["点击左上角或从左侧右滑 → 抽屉滑出", "顶部：搜索胶囊 + 右侧新对话键", "会话一条列表，不按时间分组;置顶的排最前、行尾带图钉;只显示标题", "点击会话 → 打开", "长按会话 → 这条浮起、其余变暗，下面弹出菜单:Rename(就地改名)/ Pin / Select / Delete;点空白处收起", "多选：长按菜单里的 Select → 顶部变成「N selected」+ ✕,每条前面一个圈，选中是品牌橙勾;底部 Pin | Delete(没选时置灰;选中的全是置顶时 Pin 变 Unpin)"] },
  "sheet-sessionActions": { title: "会话操作", spec: "MVP §4", rules: ["点击重命名 / 置顶 / 删除"] },
  "sheet-attach": { title: "「+」附件面板", spec: "MVP §4", rules: ["点击输入框「+」→ 弹出面板(无标题，下拉或点空白处关闭)", "一排胶囊入口:Camera 拍照 / Assets 素材库 / Files 文件", "点击 Files → 关掉面板，弹出 iOS 系统文件选择器(Recents / Shared / Browse);只能选 PDF,其他格式灰掉;选中后作为附件加进输入框", "相册三列网格：点右上角圆圈多选，圆圈里显示第几张;选了才出现整条「Add N」按钮，点了加进输入框;输入框里的缩略图右上角有半透明 × 可删除", "点 Assets → 素材库页:All / Videos / Images 三个 tab,左上返回;没素材显示空状态"] },
  "sheet-mode": {
    title: "创作模式",
    spec: "MVP §2 · §5.2",
    rules: [
      "面板标题 Creation mode;两列工具卡片(圆形图标 + 名字 + 一句做出什么);右上角 Hot(橙)/ New(玫红);选中是品牌色淡底 + 同色细边",
      "五个模式:Marketing Agent / Image / Video / Hybrid Reel(New)/ Audio",
      "选 Hybrid Reel:用自己的实拍片段 + AI 补拍镜头剪成一条广告;只切模式，素材由用户自己点 + 放;和 Agent 一样自动挑模型，没有 Web Explore",
      "Free 用户:Video 右上角带钻石标(要订阅);点了不切模式，直接弹付费墙(trigger = video_locked)",
      "Hybrid Reel 只给 Enterprise:非 Enterprise 用户(Free 和个人会员)卡片标白底「Enterprise」,点了不切模式，打开 Contact Sales;Enterprise 用户标 New,照常使用",
    ],
  },
  "sheet-model": {
    title: "模型参数",
    spec: "MVP §4 · §5.2",
    rules: ["锁定的模型带「Pro」标，仍可选;发送时弹付费墙 Pro tab", "Starter 视频默认 Seedance 2.0 Fast"],
  },
  "sheet-share": { title: "分享", spec: "MVP §4", rules: ["点击 Instagram / TikTok / RED / WhatsApp → 跳到对应 APP", "选了渠道才算分享成功(触发评分)"] },
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
