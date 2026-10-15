/**
 * 评审原型右栏:每个「屏」的需求说明(中文,演示用)。key 来自 surfaceOf。
 * 评审原型就是需求文档,每屏按五块写:
 *   rules 功能说明 · states 状态与分支 · edge 边界情况 · errors 异常处理 · events 埋点(草稿)
 * spec = docs/superpowers/specs/2026-10-14-buzzvideo-app-growth-design.md 的章节;MVP 指 2026-09-29-buzzvideo-app-design.md
 */
export type Note = {
  title: string;
  spec: string;
  rules: string[];
  states?: string[];
  edge?: string[];
  errors?: string[];
  events?: string[];
};

/** 和内购有关的屏共用的异常处理 */
const IAP_ERRORS = [
  "用户在系统确认框点 Cancel:不算失败,回到原页面,不提示、不打 subscribe 事件",
  "内购失败(卡被拒、网络中断):提示「Purchase didn't go through. You weren't charged.」,停留在原页面可以再试;订阅和积分都不变",
  "等家长批准(Ask to Buy):提示「Waiting for approval…」并关闭页面;批准后由 App Store 服务端通知开通,拒绝则什么都不变",
  "付款成功但我们服务端没及时收到(网络断了):APP 下次启动时用 StoreKit 的未完成交易补登记;Restore purchases 也能补",
];
/** 价格展示的通用规则 */
const PRICE_RULE = "价格一律取 App Store 返回的本地化价格(StoreKit displayPrice,按用户所在区的币种);原型里写的美元只是美区示例。拉价失败时显示骨架 + Retry,不显示写死的价格";

export const NOTES: Record<string, Note> = {
  onboarding: {
    title: "引导页",
    spec: "§5 · MVP §5",
    rules: [
      "一屏全屏广告片 + 标题「Turn any product into a video ad」+ 副标题 + Get started,不加问卷",
      "广告片静音自动循环播放",
      "点 Get started → iOS 进 ATT 说明页;Android 没有 ATT,直接进登录页",
    ],
    states: [
      "从广告链接安装(Adjust 延迟深度链接带 Use Case ID):广告片换成那条广告对应的 Use Case 成片,让用户看到点进来时的同一条内容(§8.3)",
      "已看过引导页的用户(退出登录后再打开):不再显示,直接到登录页",
    ],
    edge: [
      "深度链接里的 Use Case 已下架:用默认广告片,不报错",
      "用户在引导页杀掉 APP:下次打开仍从引导页开始(还没完成引导)",
    ],
    errors: ["广告片加载失败 / 弱网:显示首帧封面图,按钮照常可点,不阻塞流程"],
    events: ["install(Adjust 自动)"],
  },
  att: {
    title: "ATT 说明页",
    spec: "§8.1",
    rules: [
      "引导页之后、登录之前;先讲清用途再弹系统框,提高允许率",
      "标题「Help keep BuzzVideo affordable」,说明我们用它了解哪些广告带来用户,不卖数据,可在设置里改",
      "只有一个按钮 Continue → 弹系统 ATT 框;不能有「跳过」,也不能用积分、优惠诱导点 Allow(苹果规定)",
    ],
    states: ["只在 iOS 14.5+ 且 ATT 状态为「未决定」时出现;Android、已经回答过 ATT 的用户都跳过这一页"],
    edge: [
      "用户在系统设置里关掉了「允许 App 请求跟踪」:系统框不会弹,直接视为拒绝,继续到登录页",
      "每个用户只能弹一次系统框;拒绝后只能去系统设置改,APP 里不再提示",
    ],
    errors: ["系统框没有弹出或返回异常:按拒绝处理,不卡住流程"],
  },
  "perm-tracking": {
    title: "ATT 系统框",
    spec: "§8.1",
    rules: [
      "系统原生弹框,正文来自 Info.plist 的 NSUserTrackingUsageDescription(研发填:用于衡量广告效果)",
      "Ask App Not to Track / Allow,两个选项都继续到登录页",
    ],
    states: [
      "Allow:Adjust 拿到 IDFA,做设备级归因",
      "Ask App Not to Track:Adjust 只能拿到 SKAdNetwork 聚合数据(转化值定义见 §8.4、附录 D)",
    ],
    events: ["att_result(allow / deny)"],
  },
  login: {
    title: "登录页",
    spec: "§5 · MVP §6",
    rules: [
      "标题「Create your first ad」,副标题「Sign up and get 500 free credits」",
      "Continue with Apple / Google / Email;底部一行「By continuing, you agree to…」",
      "进入登录页时请求推送授权(保持 MVP 现状)",
      "登录成功 → 新用户发 500 积分 → 弹首登付费墙;从广告链接来的用户关掉付费墙后直接进对应 Use Case",
    ],
    states: [
      "新用户:注册 + 发 500 积分 + 首登付费墙",
      "老用户在新设备登录:不再发积分;是否弹付费墙按「今天弹过没有」判断",
      "带邀请码安装的新用户:注册时绑定邀请人,邀请人在好友首次订阅后才得奖励(§7.1)",
    ],
    edge: [
      "同一个邮箱先用 Google、后用 Apple(隐藏邮箱)登录:是两个账号,不自动合并(和网页一致)",
      "登录到一半切走 APP 再回来:停在登录页,不丢状态",
    ],
    errors: [
      "第三方登录取消:回到登录页,不提示",
      "第三方登录失败 / 网络错误:Toast「Couldn't sign in. Please try again.」",
      "账号已被删除或封禁:提示联系 support,不进入 APP",
    ],
    events: ["sign_up(method, invite_code)", "login(method)"],
  },
  "perm-push": {
    title: "推送授权",
    spec: "§5 · MVP §2",
    rules: ["保持现状:进入登录页时请求系统推送授权", "推送用于「生成完成」通知;营销推送另有 Offers & news 开关,默认关"],
    edge: ["新用户会连续遇到 ATT 与推送两个系统框;评审若觉得密,再把推送挪到第一次提交生成时"],
    states: ["拒绝:生成完成只在 APP 内提示;之后在营销轻问里点 Turn on 会引导去系统设置"],
  },
  "perm-camera": {
    title: "相机授权",
    spec: "MVP §6",
    rules: ["用到时请求(「+」面板第一格)"],
    states: ["拒绝后再点相机:提示去系统设置打开,带 Open Settings 按钮"],
  },
  "perm-photos": {
    title: "相册授权",
    spec: "MVP §6",
    rules: ["用到时请求;支持「只允许部分照片」"],
    states: ["部分照片:只显示用户选中的照片,面板顶部提示可以添加更多", "拒绝:提示去系统设置打开,Files / Assets 不受影响"],
  },
  plans: {
    title: "付费墙",
    spec: "§3",
    rules: [
      "三档和网页一模一样:Starter $19 / Pro $49 / Ultra $89 每月;年付约 30% off:$168 / $420 / $756",
      "顶部 tab 切档,默认 Starter;每个 tab 默认选中年付。切 tab 整屏换背景「云朵 B」(白天 / 黄昏 / 月夜)",
      "大字是该档每月积分,下面换算成每月产出(≈ N 条 Seedance 2.0 HD 10 秒视频);活动在线时另起一行写加赠积分",
      "年付行大字「$168/year」,副行「$14/mo · billed once a year」;月付行大字月价",
      "权益 3–5 条,取自该档官网权益;脚注按档位写清楚不含什么(Starter:不含 Seedance 2.0 / 2.5)",
      "Ultra tab 多一条 1× / 2× / 4× 积分刻度(同官网滑块):价格、积分、条数、折扣跟着变",
      "✕ 3 秒后淡入。Free 用户第一次关闭弹挽留(§4)",
      "底部法律文案:「Payment is charged to your Apple ID at confirmation. Renews automatically until canceled. Cancel anytime in your App Store settings.」+ Terms / Privacy + Restore",
      PRICE_RULE,
    ],
    states: [
      "自动弹:首次登录一次;之后冷启动每天最多一次(只对 Free;Enterprise 用户不弹,公司已付费)",
      "被动弹(trigger):想生成视频 video_locked、选了锁定模型 model_locked(直接开 Pro tab)、积分不足 low_credits、点运营弹窗 promo、手动 manual",
      "APP 会员:默认停在自己的档位 / 倍数,显示「You're on … · Renews on 日期 · Manage subscription ›」;当前方案不显示购买按钮",
      "会员换方案:积分更多 = Upgrade(立即生效,Apple 按比例退旧档);否则 Switch(下个续费日生效,按钮下写生效日期)",
      "已取消自动续费的会员:当前方案显示「Ends on 日期」+ Resubscribe(恢复自动续费,当天不扣费)",
      "网页订阅的会员:只显示「Subscribed on the web · Manage your plan at buzzvideo.ai」,没有任何购买按钮和法律文案",
      "挽留优惠 24 小时内:Starter 月付行显示 $9.50 首月价,按钮「Get 50% off · $9.50 first month」",
      "美区:底部多一行「Or subscribe on buzzvideo.ai」外链(用系统浏览器打开);其他地区不显示(§2.4)",
    ],
    edge: [
      "同一天被动触发多次(比如连续点了两次视频):每次都弹,被动弹不受「每天一次」限制",
      "已登录但带着广告深度链接冷启动:不自动弹,直接进 Use Case",
      "积分包、Ultra 倍数在价格调整后要同步 SKAN 分档表(附录 D)",
    ],
    errors: [...IAP_ERRORS, "商品信息拉取失败:选项区显示骨架 + Retry,不显示购买按钮"],
    events: ["paywall_view(trigger, campaign_id)", "paywall_close(tab, period)", "subscribe(plan, period, price, is_exit_offer, source)"],
  },
  exitOffer: {
    title: "挽留弹窗",
    spec: "§4",
    rules: [
      "Free 用户第一次关付费墙时从底部升起的半屏抽屉(Enterprise 用户不弹)",
      "标题「Wait — your first month is 50% off」;大字 $9.50 + 划线 $19;下一行「First month of Starter, then $19/month. Cancel anytime.」(续费价和优惠价同样醒目,FTC / 欧盟 UCPD)",
      "主按钮 Get 50% off now → 系统确认框;次按钮 Maybe later",
      "真实倒计时「Offer ends in 23:59:59」:弹出起 24 小时有效,到期真的失效",
    ],
    states: [
      "Maybe later / 下滑关闭:24 小时内首页 Tab 栏上方有胶囊「50% off your first month · ends in …」,点开重新打开抽屉;付费墙 Starter 月付行也显示优惠价",
      "24 小时到期:胶囊消失,付费墙恢复原价,不能再领",
    ],
    edge: [
      "每个账号一生一次,服务端记录;换设备、重装都不会再弹",
      "每个 Apple ID 每个订阅组只能享受一次首期优惠:Apple ID 已用过的,不弹",
      "会员、网页订阅用户不弹",
      "倒计时以服务端记录的到期时间为准,改手机时间无效",
    ],
    errors: [...IAP_ERRORS.slice(0, 3), "购买失败时抽屉保持打开,优惠窗口不受影响"],
    events: ["exit_offer_view", "exit_offer_close", "subscribe(is_exit_offer = true)"],
  },
  promo: {
    title: "首页运营弹窗",
    spec: "§6.2",
    rules: [
      "沿用 admin 营销活动配置,同一套模板:媒体 → kicker → 标题 → 描述 → ≤3 条卖点 → CTA",
      "只送积分不打折(和网页一致);CTA「Get my 35% bonus now」→ 付费墙,付费墙显示加赠后的积分",
      "进入 Inspire 时出现;右上角 ✕ 关闭",
    ],
    states: [
      "频控按活动配置,默认每人 1 次 / 7 天",
      "只弹 Free(和网页一致);Starter / Pro / Ultra 会员和 Enterprise 用户都不弹",
      "和每日付费墙不叠加:这次冷启动弹了付费墙就不弹,留到下一次冷启动(同一天也可以)",
      "多个活动同时在线:按 priority 只弹一个",
    ],
    edge: [
      "活动下线后:已打开的弹窗点 CTA 仍进付费墙,但付费墙不再显示加赠",
    ],
    errors: ["活动媒体加载失败:隐藏媒体区,其余照常显示", "活动接口失败:当作没有活动,不弹"],
    events: ["promo_popup_view(campaign_id)", "promo_popup_click(campaign_id)"],
  },
  campaignPush: {
    title: "活动推送",
    spec: "§6.3",
    rules: ["运营活动上线时推一条;点开 → 付费墙(trigger = promo)"],
    states: ["只发给打开了 Offers & news 且系统推送已允许的用户", "每个活动最多推一条"],
    edge: ["APP 在前台时以顶部横幅出现,5 秒后自动收起", "活动已下线后点开旧推送:进 Inspire,不弹付费墙"],
  },
  rating: {
    title: "评分弹窗",
    spec: "§6.1",
    rules: ["第一条成片保存或分享成功后,弹系统评分框(SKStoreReviewController)", "每个账号只主动请求一次"],
    edge: [
      "举报过内容的用户不弹",
      "最近一次生成失败时不弹,等下一次保存 / 分享",
      "苹果限制每人每年最多显示 3 次,是否真的显示由系统决定,APP 拿不到结果",
    ],
    events: ["rating_prompt"],
  },
  marketingOptIn: {
    title: "营销推送轻问",
    spec: "§6.3",
    rules: ["标题「Get notified about bonus credits and new models?」", "第一条成片完成时问一次,只问一次;Turn on / Not now"],
    states: [
      "Turn on + 推送未决定:打开 Offers & news,再弹系统推送框",
      "Turn on + 推送已拒绝:打开 Offers & news,提示「Turn on notifications in Settings to get offers」",
      "Not now:不影响生成完成通知;之后只能在设置里打开",
    ],
    edge: ["已经在设置里打开过 Offers & news 的用户不问"],
  },
  aiConsent: {
    title: "AI 数据授权",
    spec: "MVP",
    rules: ["第一次发送时征求同意:提示词和上传内容会发给第三方 AI 服务商", "同意后才真正提交;Settings 可撤回"],
    edge: ["不同意:草稿保留,不提交"],
  },
  inspire: {
    title: "Inspire",
    spec: "MVP §5.1 · §6.2",
    rules: ["Banner + 快捷入口 + Use Case 瀑布流", "运营弹窗在进入这里时出现", "挽留优惠 24 小时内,Tab 栏上方显示倒计时胶囊"],
    states: ["从广告链接安装的用户登录后不停在这里,直接进对应 Use Case"],
    errors: ["列表加载失败:显示重试态;弱网先显示缓存"],
  },
  create: {
    title: "Create",
    spec: "MVP §5.2 · §5.2",
    rules: [
      "Free 选 Video 模式发送 → 付费墙(不扣积分,保留草稿);输入框上方提前告知「Video is included with paid plans」",
      "Free 用 Marketing Agent:照常出方案,到生成视频那步停下并弹付费墙(不扣积分)",
      "选了锁定模型(Starter 选 Seedance 2.0 / 2.5)发送 → 付费墙 Pro tab",
    ],
    states: [
      "积分不足 · Free:对话里留提示 + 自动弹付费墙",
      "积分不足 · 会员:对话里留提示 + 自动弹积分包",
      "积分不足 · 组织空间:只提示「Contact your workspace admin」,不弹付费墙",
      "组织成员每月上限(和网页一致):组织空间的生成累计到自己本月已用;超过管理员设的上限 → 不提交、不扣积分、提示找管理员调高",
      "同时生成数上限(同官网 Parallel Generations):Free 1 / Starter 4 / Pro 8 / Ultra 12 / 组织 12(按 Enterprise 合同)。到上限:不提交、不扣积分、保留草稿,对话里提示;Free / Starter / Pro 带 See plans(打开下一档 tab,trigger = parallel_limit),Ultra 和组织只提示等待",
    ],
    edge: ["积分正好够一次:可以提交,提交后余额为 0", "生成中途订阅到期:已提交的任务照常完成,不回收"],
    errors: [
      "生成失败:任务卡显示失败 + Retry;积分自动退回",
      "Free 对视频 / Agent 任务点 Retry 或 Regenerate:不扣积分,直接弹付费墙",
      "Retry / Regenerate 和直接发送同一套规则:锁定模型 → 付费墙 Pro tab;积分不足 → Free 弹付费墙、会员弹积分包、组织提示联系管理员;同时生成数到上限 → 提示;Retry 重新扣积分(失败时已退回)",
      "组织空间按 Enterprise 合同:全部模型可用,视频默认最高档模型",
      "网络断开时发送:草稿保留,提示重试",
    ],
    events: ["generation_submit(mode, model)", "first_generation", "first_result_ready(投放激活事件)", "first_video_ready"],
  },
  me: {
    title: "Me",
    spec: "MVP §5.3 · §2.3 · §7.1",
    rules: [
      "积分卡点进付费墙;会员多一行 Buy credits(永不过期)",
      "美区会员显示 Top up on web 外链",
      "Invite friends 入口(只在个人空间)",
    ],
    states: [
      "扣款失败宽限期(iOS 3 天 / 安卓 7 天):顶部红框「Payment issue」,点开拉起 App Store 付款设置;仍是会员,新一期积分等扣款成功再发",
      "组织空间:积分是组织共享的,显示「managed by your admin」,没有购买入口",
      "工作区切换只有 Enterprise 用户有(Personal + 所在组织);其他账号只有 Personal,不显示切换",
      "积分 ≤ 20:余额标红 + 提示",
    ],
  },
  useCase: {
    title: "Use Case 详情",
    spec: "MVP §4 · §8.3",
    rules: ["Try it now 带着提示词、模式、参考图进 Create", "广告深度链接的落地页"],
    states: ["Free 用户看视频 / Agent 类 Use Case:按钮下写「Video ads are included with paid plans.」"],
    edge: ["深度链接对应的 Use Case 已下架:正常进 Inspire"],
  },
  work: {
    title: "成片详情",
    spec: "MVP §4 · §6.1 · §7.2",
    rules: ["Save / Share;更多里有 Regenerate、Copy prompt、Report、Delete"],
    states: [
      "Free 用户个人空间的成片带 BuzzVideo 水印,订阅后新旧成片都去掉;组织空间不加",
      "Save / Share 成功后触发评分弹窗(一次)",
    ],
    edge: ["演示数据说明:Free 账号里已有的视频作品,视为以前订阅过或在网页上生成的"],
    errors: ["保存到相册失败(没有相册权限):提示去设置打开", "分享渠道未安装:系统分享面板里不显示该渠道"],
    events: ["save", "share(channel)"],
  },
  subscription: {
    title: "订阅管理",
    spec: "§2.5",
    rules: [
      "设置 → Subscription:方案、每月积分、续费日、扣费渠道、Change plan、Restore purchases",
      "Change plan → 付费墙:升级立即生效(Apple 按比例退旧档);降级 / 换周期 / Ultra 倍数往下在下个续费日生效",
      "Cancel subscription 是取消订阅的唯一入口:页面最底部灰色文字链接,拉起 App Store 系统订阅页",
    ],
    states: [
      "有待生效的变更:「Changes on 日期」+ 说明当前方案用到哪天",
      "已取消自动续费:「Renews on」换成「Ends on」,说明到期回 Free、买的积分包保留;不额外提醒;取消入口隐藏",
      "扣款失败宽限期:红框「Payment issue」+ Update payment method",
      "网页订阅:显示「在 buzzvideo.ai 管理」,没有取消入口和 App Store 文案",
      "网页 + App Store 重复订阅:以网页为准(无抽成),提示取消 App Store 那份,并用 StoreKit 退款申请页向苹果申请退款;我们无法代为取消或退款",
    ],
    edge: [
      "积分按计费月发放:年付和月付一样,每月发一次当月积分、月底重置,不是一次性发 12 个月(右栏「新的计费月」可模拟)",
      "余额分两部分:订阅积分(每月重置、不累积)+ 其他积分(积分包、注册赠送、活动加赠、邀请奖励,永久有效);扣积分先扣订阅积分;Me 积分卡写明两项",
      "升降级按苹果 / Google 官方规则:升级立即生效(苹果按比例退旧档;Google 用 CHARGE_PRORATED_PRICE,续费日不变),订阅积分整份换成新档额度、旧档没用完的不叠加;降级 / 换周期到续费日生效(Google 用 DEFERRED;月付换年付用 CHARGE_FULL_PRICE 立即生效)",
      "到续费日(右栏可模拟):待生效变更生效;已取消的回 Free,订阅积分清零、其他积分保留;扣款失败宽限期内不续费、不发积分",
      "到期回 Free:订阅积分清零(每月重置,不累积),单独买的积分包永久保留",
      "Apple 退款:退订阅立即回 Free 并扣回当期积分,退积分包扣回该包积分;最多扣到 0,已用掉的不追",
      "一个 Apple ID 登录另一个 BuzzVideo 账号:订阅永远归首次购买的账号,另一个账号是 Free",
      "不开家庭共享",
    ],
    errors: [
      "Restore purchases · 没有记录:「No purchases to restore on this Apple ID」",
      "Restore purchases · 属于其他账号:「This subscription belongs to another BuzzVideo account」",
      "宽限期结束仍未扣上:回 Free;商店会继续重试,扣上后恢复会员并补发积分",
    ],
  },
  settings: {
    title: "设置",
    spec: "§6.3 · MVP §4",
    rules: [
      "通知拆成 Generation updates(默认开)和 Offers & news(默认关)",
      "Subscription 行进订阅管理;Restore purchases、隐私政策、退出登录、删除账号",
      "Help:Pro / Ultra 有 Contact support(人工支持);Enterprise 是 Your account manager(专属客户经理);Free / Starter 只有 Help Center",
    ],
    states: ["系统推送被拒时打开任一通知开关:提示去系统设置"],
  },
  members: {
    title: "组织成员",
    spec: "MVP",
    rules: ["Admin / Owner 可见;按人设每月积分上限", "上限真的生效:成员在组织空间生成会累计本月已用,超过上限就被拦下,提示找管理员", "邀请成员:邮箱或复制链接(和邀请好友是两回事)"],
  },
  inviteFriends: {
    title: "邀请好友",
    spec: "§7.1",
    rules: [
      "标题「Get 1,500 credits for every friend who subscribes」",
      "照搬网页:好友注册得 500;好友首次订阅后双方各得 1,500;只奖励前 10 位",
      "同一个邀请链接两端通用;APP 里用 Adjust 深度链接,没装 APP 的走网页",
    ],
    states: ["进度显示已得奖励 n / 10;满 10 位后仍可分享,但不再发奖励,页面写明"],
    edge: [
      "好友在网页订阅也算(同一个账号体系)",
      "好友订阅后又退款:奖励按 §2.5 退款规则扣回",
      "自己邀请自己(同设备 / 同支付账号)不发奖励,由服务端风控判断",
    ],
    events: ["invite_share(channel)", "invite_reward(服务端)"],
  },
  camera: { title: "相机", spec: "MVP", rules: ["拍摄素材直接作为附件"] },
  "sheet-topUp": {
    title: "积分包",
    spec: "§2.3",
    rules: ["和网页一样 8 档 $10–$300,永不过期", "只有会员能买;活动在线时显示「+X bonus」", "美区底部有网页充值外链", PRICE_RULE],
    states: ["会员积分不足提交生成时自动弹出", "Free 用户看不到这个入口(积分不足走付费墙)"],
    errors: IAP_ERRORS,
    events: ["credit_pack_purchase(pack, price)"],
  },
  "sheet-sessions": { title: "会话抽屉", spec: "MVP §4", rules: ["ChatGPT 式,从左侧滑出;置顶在前,其余按最近更新排序", "长按可重命名、置顶、删除"] },
  "sheet-sessionActions": { title: "会话操作", spec: "MVP §4", rules: ["重命名、置顶、删除"] },
  "sheet-attach": { title: "「+」附件面板", spec: "MVP §4", rules: ["首行相机 + 最近照片;下面 Photos / Files / Assets"] },
  "sheet-mode": {
    title: "模式",
    spec: "MVP §2 · §5.2",
    rules: ["Marketing Agent / Image / Video / Audio"],
    states: ["Free 用户的 Video 行标「Starter+」,仍可选;发送时弹付费墙"],
  },
  "sheet-model": {
    title: "模型参数",
    spec: "MVP §4 · §5.2",
    rules: ["Starter 不含 Seedance 2.0 / 2.5,视频默认 Seedance 2.0 Fast", "锁定的模型带「Pro」标,仍可选;发送时 → 付费墙 Pro tab(不扣费,保留草稿)"],
  },
  "sheet-share": { title: "分享", spec: "MVP §4", rules: ["Instagram / TikTok / RED / WhatsApp", "选了渠道才算分享成功(触发评分)"] },
  "sheet-workMore": { title: "成片更多操作", spec: "MVP §4", rules: ["Regenerate、Copy prompt、Report、Delete"] },
  "sheet-report": { title: "举报", spec: "MVP §6", rules: ["24 小时内处理"], edge: ["举报过的用户不再弹评分(§6.1)"] },
  "sheet-workspace": { title: "工作区切换", spec: "MVP §5.3", rules: ["Personal 与所属组织;切换后积分、作品、素材都换"], edge: ["组织空间没有付费墙、积分包和邀请好友"] },
  "sheet-confirmDelete": {
    title: "删除账号",
    spec: "MVP §6",
    rules: ["二次确认,真删除"],
    edge: ["APP 订阅不会因删号自动取消,确认页提示先去 App Store 取消", "网页订阅随账号删除一起取消"],
  },
  "sheet-transferWorkspace": { title: "转移工作区", spec: "MVP", rules: ["Owner 删号前先转移组织"] },
  "sheet-invite": { title: "邀请组织成员", spec: "MVP", rules: ["邮箱邀请或复制链接(和邀请好友是两回事)"] },
  "sheet-memberCap": { title: "成员积分上限", spec: "MVP", rules: ["步长 100,不低于本月已用"] },
};
