import {
  CREDITS_INITIAL,
  CREDIT_PACKS,
  EXIT_OFFER,
  planLabel,
  ORG_PARALLEL_LIMIT,
  PARALLEL_LIMIT,
  INVITE,
  MODE_COST,
  USE_CASES,
  planById,
  type Billing,
  isModelLocked,
  modelLabel,
  planFor,
  resultFor,
  CAP_STEP,
  SEED_FAVORITES,
  SEED_MEMBERS,
  SEED_JOBS,
  TEAM_ASSETS,
  LIBRARY_ASSETS,
  type LibraryAsset,
  SEED_MESSAGES,
  SEED_SESSIONS,
  defaultModel,
  defaultModelFor,
  workspaceName,
  type Member,
  type PaidPlanId,
  type UltraMultiplier,
  ultraTier,
  type PlanId,
  type PromoCampaign,
  type Mode,
  type UseCase,
  type WorkspaceId,
} from "./data";

/* ---------- 类型 ---------- */

export type SubscriptionSource = "none" | "web" | "app";
/** 一次订阅选择:档位 + 周期(+ Ultra 倍数) */
export type PlanChoice = { plan: PaidPlanId; period: Billing; multiplier?: UltraMultiplier };
/**
 * multiplier:只有 Ultra 有(1× / 2× / 4×)。renewDay:下次续费是第几天。
 * pendingChange:降级或换周期,下个续费日才生效(App Store 规则),这之前保持当前方案。
 * cancelled:已在 App Store 取消自动续费,用到 renewDay 后回 Free(spec §2.5;来自 App Store 服务端通知)。
 * duplicateApp:网页订阅的用户又在 App Store 订了一份;以网页为准,引导取消 APP 那份(spec §11 #5)
 */
export type Subscription = {
  plan: PlanId;
  source: SubscriptionSource;
  period?: Billing;
  multiplier?: UltraMultiplier;
  renewDay?: number;
  pendingChange?: PlanChoice;
  cancelled?: boolean;
  duplicateApp?: boolean;
  /** 续费扣款失败,处在宽限期(iOS 3 天 / 安卓 7 天):仍是会员,新一期积分等扣款成功再发(spec §2.5) */
  billingRetry?: boolean;
};
/** 付费墙从哪里打开(埋点 paywall_view.trigger) */
export type PaywallTrigger = "first_login" | "daily" | "video_locked" | "model_locked" | "low_credits" | "promo" | "manual";
export type PaywallRequest = { trigger: PaywallTrigger; tab: PaidPlanId };
export const NO_SUBSCRIPTION: Subscription = { plan: "free", source: "none" };
/** tracking = iOS ATT 追踪授权(Adjust 归因用,spec §8.1) */
export type PermissionKind = "push" | "camera" | "photos" | "tracking";
/** App Store 区域:美区可以放网页付款外链(spec §2.4) */
export type Region = "us" | "other";
/**
 * StoreKit 返回的结果(真实 APP 由系统决定,评审原型用开关模拟):
 * purchase:success 成功 / failed 失败(卡被拒、网络中断,用户没被扣钱)/ pending 等家长批准(Ask to Buy)。
 * 用户在系统确认框点 Cancel 不算失败,直接回到原页面,不提示。
 * restore:restored 恢复成功 / none 这个 Apple ID 没有可恢复的购买 / otherAccount 订阅属于另一个 BuzzVideo 账号(spec §2.5)
 */
export type StoreKitSim = { purchase: "success" | "failed" | "pending"; restore: "restored" | "none" | "otherAccount" };
/**
 * 网络与加载异常(真实 APP 由环境决定,评审原型用开关模拟):
 * offline 断网 · prices 拉价失败(App Store 商品信息拿不到)· signIn 第三方登录失败 · media 广告片 / 视频加载失败
 */
export type Faults = { offline: boolean; prices: boolean; signIn: boolean; media: boolean };
export const NO_FAULTS: Faults = { offline: false, prices: false, signIn: false, media: false };
export const OFFLINE_TOAST = "You're offline. Check your connection and try again.";
export const OFFLINE_DRAFT_TOAST = "You're offline. Your draft is saved.";
export const SIGN_IN_FAILED_TOAST = "Couldn't sign in. Please try again.";
/** 付费墙 / 积分包拿不到价格:断网或拉价失败 */
export const pricesUnavailable = (s: StoreState) => s.faults.offline || s.faults.prices;
export const PURCHASE_FAILED_TOAST = "Purchase didn't go through. You weren't charged.";
export const PURCHASE_PENDING_TOAST = "Waiting for approval. Your plan unlocks once it's approved.";
export type PermissionValue = "undetermined" | "granted" | "limited" | "denied";
export type JobStatus = "running" | "done" | "failed";

export type Job = {
  id: string;
  title: string;
  prompt: string;
  mode: Mode;
  model: string | null;
  status: JobStatus;
  elapsedMs: number;
  cover: string;
  video?: string;
  workspace: WorkspaceId;
  sessionId: string;
  /** 最后修改序号(越大越新);reducer 取现有最大值 + 1,不读系统时钟。缺省视为 0 */
  modifiedAt?: number;
};

export type Attachment = { id: string; uri: string; kind: "photo" | "video" | "pdf"; label?: string; duration?: string };
export type Upload = { id: string; uri: string; kind: Attachment["kind"]; progress: number; workspace: WorkspaceId; modifiedAt?: number };
export type Role = "owner" | "admin" | "member";
export const ROLE_LABEL: Record<Role, string> = { owner: "Owner", admin: "Admin", member: "Member" };

export type Message =
  | { id: string; role: "user"; text: string; attachments: Attachment[] }
  | { id: string; role: "agent"; kind: "plan"; text: string; pills: string[] }
  | { id: string; role: "agent"; kind: "job"; jobId: string }
  /** 个人空间积分不足:Free 带 See plans(付费墙),会员带 Buy credits(积分包);锁定模型带 See plans(付费墙 Pro tab) */
  | { id: string; role: "agent"; kind: "notice"; text: string; cta?: "plans" | "topUp" | "model" | "video" };

/** updatedAt 是排序键(越大越新);reducer 保持纯,新值取现有最大值 + 1,不读系统时钟 */
export type Session = { id: string; title: string; updatedAt: number; pinned: boolean; workspace: WorkspaceId };

export type Composer = {
  text: string;
  mode: Mode;
  model: string | null;
  batch: number;
  ratio: "9:16" | "1:1" | "16:9";
  attachments: Attachment[];
};

export type PermissionPrompt = { kind: PermissionKind; then?: "openCamera" } | null;

export type StoreState = {
  signedIn: boolean;
  /** 首次打开流程:看过 Onboarding / 弹过订阅页。退出登录保留,删号与 reset 才清零 */
  onboarded: boolean;
  /** 已同意把提示词与上传内容发给第三方 AI 服务商(第一次发送时弹窗征求,Settings 可撤回)。退出登录保留,删号与 reset 清零 */
  aiConsent: boolean;
  /** 未同意时被拦下的动作;非空即显示同意弹窗,Allow 后执行它 */
  aiConsentPrompt: { pending: StoreAction } | null;
  /** 今天是第几天(APP 启动时由外部传入;reducer 不读时钟) */
  today: number;
  /** 付费墙最近一次自动弹出是哪天(首登、每日冷启动共用,spec §3.3) */
  paywallShownDay: number | null;
  /** 待打开的付费墙;App 看到后 push plans 路由并 consumePaywallRequest */
  paywallRequest: PaywallRequest | null;
  /** 挽留弹窗是否用过(每账号一生一次,真实 APP 存服务端,spec §4) */
  exitOfferUsed: boolean;
  exitOfferOpen: boolean;
  /** 挽留优惠到期时间(毫秒时间戳):弹出时起算 24 小时,期间随时可回来买;0 = 没有进行中的优惠 */
  exitOfferExpiresAt: number;
  /** 当前在线的运营活动(真实 APP 来自 GET /api/promo/active,spec §6.2) */
  activePromo: PromoCampaign | null;
  /** 运营弹窗频控:每个活动弹过几次、最近一次是哪天 */
  promoViews: Record<string, number>;
  promoLastDay: Record<string, number>;
  /** 当前打开的运营弹窗(活动 id) */
  promoOpen: string | null;
  /** 活动推送横幅(活动 id) */
  campaignBanner: string | null;
  /** 已推送过的活动(每个活动最多一条) */
  campaignsPushed: string[];
  /** 设置里的「Offers & news」:营销推送开关,默认关(spec §6.3) */
  marketingPush: boolean;
  /** 第一条成片完成时的营销推送轻问:问过一次就不再问 */
  marketingAsked: boolean;
  marketingPromptOpen: boolean;
  /** 评分弹窗:第一条成片保存或分享后弹一次;举报过内容的不弹(spec §6.1) */
  ratingPrompted: boolean;
  ratingPromptOpen: boolean;
  reportedContent: boolean;
  /** 会员积分不足时要自动打开积分包面板;App 打开后 consumeTopUpRequest */
  topUpRequested: boolean;
  /** 已发放的邀请奖励次数(上限 INVITE.maxRewards) */
  inviteRewards: number;
  /** 从广告链接安装 / 打开:登录与付费墙之后直接打开这个 Use Case(spec §8.3) */
  deepLink: { useCaseId: string } | null;
  region: Region;
  storekit: StoreKitSim;
  faults: Faults;
  /** 当前用户在各组织工作区的角色(个人空间没有角色) */
  roles: Partial<Record<WorkspaceId, Role>>;
  /** 各工作区的成员(含每月积分上限) */
  members: Record<WorkspaceId, Member[]>;
  /** 收藏的素材 id(作品、上传、素材库、团队素材通用) */
  favorites: string[];
  /** 个人素材库(网页版上传的素材);删号后清空 */
  library: LibraryAsset[];
  subscription: Subscription;
  workspace: WorkspaceId;
  credits: Record<WorkspaceId, number>;
  permissions: Record<PermissionKind, PermissionValue>;
  permissionPrompt: PermissionPrompt;
  jobs: Job[];
  uploads: Upload[];
  sessions: Session[];
  messages: Record<string, Message[]>;
  currentSessionId: string | null;
  composer: Composer;
  pushBanner: { jobId: string } | null;
  toast: string | null;
};

export type StoreAction =
  | { type: "completeOnboarding" }
  | { type: "allowAiConsent" }
  | { type: "dismissAiConsent" }
  | { type: "setAiConsent"; on: boolean }
  | { type: "appLaunched"; day: number }
  | { type: "openPaywall"; trigger: PaywallTrigger; tab?: PaidPlanId }
  | { type: "consumePaywallRequest" }
  /** now:当前时间戳(由界面传入,reducer 不读时钟),用来起算挽留优惠的 24 小时 */
  | { type: "closePaywall"; now?: number }
  | { type: "acceptExitOffer"; now?: number }
  | { type: "openExitOffer"; now: number }
  | { type: "dismissExitOffer" }
  | { type: "promoLoaded"; campaign: PromoCampaign | null }
  | { type: "dismissPromo" }
  | { type: "promoCta" }
  | { type: "campaignPushReceived"; campaignId: string }
  | { type: "dismissCampaignBanner" }
  | { type: "buyCreditPack"; packId: string; qty: number }
  | { type: "setRegion"; region: Region }
  | { type: "setMarketingPush"; on: boolean }
  | { type: "answerMarketingPrompt"; on: boolean }
  | { type: "workSaved"; id: string }
  | { type: "workShared"; id: string }
  | { type: "dismissRating" }
  | { type: "reportContent" }
  | { type: "inviteRewardGranted" }
  | { type: "openDeepLink"; useCaseId: string }
  | { type: "consumeDeepLink" }
  | { type: "consumeTopUpRequest" }
  | { type: "signIn" }
  | { type: "signOut" }
  | { type: "deleteAccount" }
  | { type: "reset" }
  | { type: "purchasePlan"; plan: PaidPlanId; period: Billing; multiplier?: UltraMultiplier }
  | { type: "restorePurchases" }
  | { type: "setMemberCap"; workspace: WorkspaceId; id: string; cap: number }
  | { type: "toggleFavorite"; id: string }
  | { type: "setWorkspace"; workspace: WorkspaceId }
  | { type: "setPermission"; kind: PermissionKind; value: PermissionValue }
  | { type: "requestPermission"; kind: PermissionKind; then?: "openCamera" }
  | { type: "answerPermission"; value: PermissionValue }
  | { type: "setComposer"; patch: Partial<Composer> }
  | { type: "addAttachments"; items: (Attachment & { uploaded?: boolean })[] }
  | { type: "removeAttachment"; id: string }
  | { type: "submitPrompt"; id: string }
  | { type: "tick"; ms: number }
  | { type: "simulatePush" }
  | { type: "retryJob"; id: string }
  | { type: "regenerateJob"; id: string; newId: string }
  | { type: "deleteJob"; id: string }
  | { type: "dismissPush" }
  | { type: "selectSession"; id: string | null }
  | { type: "renameSession"; id: string; title: string }
  | { type: "togglePinSession"; id: string }
  | { type: "deleteSession"; id: string }
  | { type: "showToast"; text: string }
  | { type: "hideToast" };

/* ---------- 常量 ---------- */

/** 模拟生成耗时 */
export const GENERATION_MS = 8000;
/** 模拟一个文件从手机上传完的耗时 */
export const UPLOAD_MS = 3000;
/** 演示「积分不足」时的余额 */
export const LOW_CREDITS = 20;
/** 重新生成成功时的提示;积分不足时 reducer 改为提示 insufficientCopy */
/** Free 用户的 Agent 到生成视频这一步时的提示(spec §5.2) */
export const FREE_AGENT_VIDEO_COPY = "Your plan is ready. Video generation is included with every paid plan — subscribe to make this ad.";
export const REGENERATING_COPY = "Regenerating — we’ll notify you";

/** 内容过滤:演示用的关键词,真实 APP 由服务端审核 */
const BLOCKED = /\b(nude|naked|porn|gore|deepfake|violence)\b/i;
const REFUSAL =
  "I can’t help create that. BuzzVideo doesn’t generate sexual, violent, hateful or deceptive content about real people.";

export const EMPTY_COMPOSER: Composer = { text: "", mode: "agent", model: null, batch: 1, ratio: "9:16", attachments: [] };

export const INITIAL_STATE: StoreState = {
  signedIn: false,
  onboarded: false,
  aiConsent: false,
  aiConsentPrompt: null,
  today: 0,
  paywallShownDay: null,
  paywallRequest: null,
  exitOfferUsed: false,
  exitOfferOpen: false,
  exitOfferExpiresAt: 0,
  activePromo: null,
  promoViews: {},
  promoLastDay: {},
  promoOpen: null,
  campaignBanner: null,
  campaignsPushed: [],
  marketingPush: false,
  marketingAsked: false,
  marketingPromptOpen: false,
  ratingPrompted: false,
  ratingPromptOpen: false,
  reportedContent: false,
  inviteRewards: 0,
  topUpRequested: false,
  deepLink: null,
  region: "us",
  storekit: { purchase: "success", restore: "restored" },
  faults: NO_FAULTS,
  // 默认不属于任何组织;Enterprise 用户由服务端带回所在组织和角色
  roles: {},
  members: SEED_MEMBERS,
  favorites: [...SEED_FAVORITES],
  library: LIBRARY_ASSETS,
  subscription: NO_SUBSCRIPTION,
  workspace: "personal",
  credits: { ...CREDITS_INITIAL },
  permissions: { push: "undetermined", camera: "undetermined", photos: "undetermined", tracking: "undetermined" },
  permissionPrompt: null,
  jobs: SEED_JOBS,
  uploads: [],
  sessions: SEED_SESSIONS,
  messages: SEED_MESSAGES,
  currentSessionId: null,
  composer: EMPTY_COMPOSER,
  pushBanner: null,
  toast: null,
};

/* ---------- selector ---------- */

export const isSubscribed = (s: StoreState) => s.subscription.plan !== "free";
/** 今天还能自动弹付费墙:已登录的 Free 用户、今天没弹过、没有待打开的付费墙 */
const paywallDue = (s: StoreState) => s.signedIn && !isSubscribed(s) && !isEnterprise(s) && s.paywallShownDay !== s.today && !s.paywallRequest;
const autoPaywall = (s: StoreState, trigger: PaywallTrigger): StoreState =>
  paywallDue(s) ? { ...s, paywallRequest: { trigger, tab: "starter" }, paywallShownDay: s.today } : s;

/** 引导页之后、登录之前先过 ATT(iOS 追踪授权) */
export const needsAtt = (s: StoreState) => s.onboarded && !s.signedIn && s.permissions.tracking === "undetermined";
/** Free 用户在个人空间的成片带水印;组织按组织权益,不加 */
export const hasWatermark = (s: StoreState, job: Job) => job.workspace === "personal" && !isSubscribed(s);
export const showWebLink = (s: StoreState) => s.region === "us";
export const deepLinkUseCase = (s: StoreState): UseCase | null =>
  s.deepLink ? USE_CASES.find((u) => u.id === s.deepLink!.useCaseId) ?? null : null;
/** 最近一次生成(按最后修改)是否失败:刚经历失败的时候不要好评 */
const latestFailed = (s: StoreState) => {
  const latest = s.jobs.reduce<Job | undefined>((m, j) => (!m || (j.modifiedAt ?? 0) > (m.modifiedAt ?? 0) ? j : m), undefined);
  return latest?.status === "failed";
};
const askRating = (s: StoreState): StoreState =>
  s.ratingPrompted || s.reportedContent || latestFailed(s) ? s : { ...s, ratingPrompted: true, ratingPromptOpen: true };

/** 某档(含 Ultra 倍数)每月积分:用来比较升级还是降级 */
export const planCredits = (plan: PaidPlanId, multiplier?: UltraMultiplier) =>
  plan === "ultra" && multiplier && multiplier > 1 ? ultraTier(multiplier).credits : planById(plan).credits;

/** 挽留优惠有效期:弹出起 24 小时(真实倒计时,到期就真的失效,spec §4) */
export const EXIT_OFFER_MS = 24 * 60 * 60 * 1000;
export const exitOfferLive = (s: StoreState, now: number) => s.exitOfferExpiresAt > 0 && now < s.exitOfferExpiresAt && !isSubscribed(s) && !isEnterprise(s);

/** 运营活动加赠百分比(只送积分不打折);没有活动时为 0 */
export const promoBonus = (s: StoreState) => s.activePromo?.bonusPct ?? 0;
export const withBonus = (s: StoreState, credits: number) => Math.round(credits * (1 + promoBonus(s) / 100));
/** 运营弹窗:已登录、今天没弹付费墙(同天不叠加,付费墙优先)、没超频控 */
const promoDue = (s: StoreState) => {
  const c = s.activePromo;
  if (!c || !s.signedIn || isEnterprise(s) || s.paywallRequest || s.paywallShownDay === s.today) return false;
  const views = s.promoViews[c.id] ?? 0;
  const last = s.promoLastDay[c.id];
  return views < c.frequency.maxPerUser && (last === undefined || s.today - last >= c.frequency.intervalDays);
};
const autoPromo = (s: StoreState): StoreState => {
  if (!promoDue(s)) return s;
  const id = s.activePromo!.id;
  return {
    ...s,
    promoOpen: id,
    promoViews: { ...s.promoViews, [id]: (s.promoViews[id] ?? 0) + 1 },
    promoLastDay: { ...s.promoLastDay, [id]: s.today },
  };
};

export const jobProgress = (j: Job) => Math.min(1, j.elapsedMs / GENERATION_MS);
export const worksFor = (s: StoreState) => s.jobs.filter((j) => j.workspace === s.workspace);
/** 当前工作区的会话:置顶在前,其余按 updatedAt 倒序(不分组) */
export const sessionsFor = (s: StoreState) =>
  s.sessions
    .filter((x) => x.workspace === s.workspace)
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt);
const nextStamp = (list: Session[]) => list.reduce((m, x) => Math.max(m, x.updatedAt), 0) + 1;
/** 下一个「最后修改」序号:比当前所有作品、上传、素材库、团队素材都新 */
export const nextModified = (s: StoreState) =>
  Math.max(
    0,
    ...s.jobs.map((j) => j.modifiedAt ?? 0),
    ...s.uploads.map((u) => u.modifiedAt ?? 0),
    ...s.library.map((x) => x.modifiedAt),
    ...TEAM_ASSETS.map((x) => x.modifiedAt),
  ) + 1;
/** Enterprise 用户:属于至少一个企业组织(公司已付费,spec §2.7) */
export const isEnterprise = (s: StoreState) => Object.keys(s.roles).length > 0;
/** 当前用户能进的工作区:Personal + 所在的组织 */
export const workspacesFor = (s: StoreState): WorkspaceId[] => ["personal", ...(Object.keys(s.roles) as WorkspaceId[])];
/** 当前用户是否拥有任何组织工作区 */
export const ownsWorkspace = (s: StoreState) => Object.values(s.roles).includes("owner");
/** 当前工作区是组织,且当前用户是 admin / owner 时才能管理成员 */
export const canManageMembers = (s: StoreState) => {
  const role = s.roles[s.workspace];
  return s.workspace !== "personal" && (role === "admin" || role === "owner");
};
/** 当前工作区的成员;当前用户那一行的角色取自 roles */
export const membersFor = (s: StoreState): Member[] => {
  const selfRole = s.roles[s.workspace];
  // 当前用户是 owner 时,种子里的 owner(Priya)降为 admin,避免出现两个 Owner
  return s.members[s.workspace].map((m) =>
    m.self ? { ...m, role: selfRole ?? m.role } : selfRole === "owner" && m.role === "owner" ? { ...m, role: "admin" as const } : m,
  );
};
/** 上限合法:步长 100 的整数,且不低于该成员本月已用积分 */
export const isValidCap = (m: Member, cap: number) => Number.isInteger(cap) && cap % CAP_STEP === 0 && cap >= m.used && cap > 0;
export const runningCount = (s: StoreState) => worksFor(s).filter((j) => j.status === "running").length;
export const uploadsFor = (s: StoreState) => s.uploads.filter((u) => u.workspace === s.workspace);
export const uploadProgress = (s: StoreState, id: string) => s.uploads.find((u) => u.id === id)?.progress ?? 1;
/** 套餐锁定的模型:非 Pro / Ultra 用户不能用 */
/** 某工作区的权益档位:个人空间按个人订阅;组织空间按 Enterprise 合同(全部模型,等同最高档) */
export const entitledPlan = (s: StoreState, ws: WorkspaceId = s.workspace): PlanId => (ws === "personal" ? s.subscription.plan : "ultra");
export const modelLocked = (s: StoreState, modelId: string, ws: WorkspaceId = s.workspace) => isModelLocked(entitledPlan(s, ws), modelId);
/** 锁定模型(Seedance 2.0)被重试 / 重新生成时的提示;个人空间引导去订阅页,组织让用户联系管理员 */
/** 锁定模型(Seedance 2.0 / 2.5)被重试 / 重新生成时的提示,按实际模型名;个人空间引导去订阅页,组织让用户联系管理员 */
export const modelLockedCopy = (model: string) => `${modelLabel(model)} is included with Pro. See plans to upgrade.`;
export const modelLockedOrgToast = (model: string) => `${modelLabel(model)} needs Pro — contact your workspace admin`;
export const insufficientCopy = (s: StoreState, ws: WorkspaceId = s.workspace) =>
  ws === "personal"
    ? "Not enough credits for this request."
    : `Not enough credits in ${workspaceName(ws)}. Contact your workspace admin.`;

/** Free 用户在个人空间重做 / 重试视频或 Agent 任务:和发送一样拦下,不建任务不扣费(spec §5.2) */
const freeVideoBlocked = (s: StoreState, job: Job) =>
  job.workspace === "personal" && !isSubscribed(s) && (job.mode === "video" || job.mode === "agent");
/** 拦下后打开哪一档:原任务用的是锁定模型(如 Seedance 2.0 / 2.5)就开 Pro,否则 Starter */
const freeVideoPaywall = (_s: StoreState, job: Job): PaywallRequest => lowestPlanFor(job.model);
/** Free 用户要做视频时该开哪一档:能用这个模型的最低档(spec §5.2) */
const lowestPlanFor = (model: string | null): PaywallRequest =>
  model && isModelLocked("starter", model) ? { trigger: "model_locked", tab: "pro" } : { trigger: "video_locked", tab: "starter" };

/** 积分不足的入口:个人空间 Free 去付费墙、会员去积分包;组织不带(联系管理员) */
const lowCreditsCta = (s: StoreState, ws: WorkspaceId): { cta?: "plans" | "topUp" } =>
  ws === "personal" ? { cta: isSubscribed(s) ? "topUp" : "plans" } : {};

export function composerFromUseCase(uc: UseCase, makeId: (prefix: string) => string): Composer {
  return {
    ...EMPTY_COMPOSER,
    text: uc.prompt,
    mode: uc.mode,
    model: uc.model ?? defaultModel(uc.mode),
    attachments: uc.attachments.map((uri) => ({ id: makeId("a"), uri, kind: "photo" as const })),
  };
}

/* ---------- reducer ---------- */

const titleFrom = (text: string) => {
  const words = text.trim().split(/\s+/).slice(0, 5).join(" ");
  return words ? words[0].toUpperCase() + words.slice(1) : "New request";
};

/** 只在已登录、允许推送、且作品属于当前工作区时弹横幅 */
const withBanner = (s: StoreState, job: Job | undefined) =>
  job && s.signedIn && s.permissions.push === "granted" && job.workspace === s.workspace ? { jobId: job.id } : s.pushBanner;

function normalizeComposer(cur: Composer, patch: Partial<Composer>, plan: PlanId): Composer {
  const next = { ...cur, ...patch };
  if (next.mode === "agent") next.model = null;
  else if (patch.mode !== undefined && patch.model === undefined) next.model = defaultModelFor(next.mode, plan);
  next.batch = Math.min(4, Math.max(1, Math.round(next.batch) || 1));
  return next;
}

/** 某工作区正在生成的任务数 */
const runningIn = (s: StoreState, ws: WorkspaceId) => s.jobs.filter((j) => j.workspace === ws && j.status === "running").length;
/** 同时生成数上限:个人空间按套餐,组织按 Enterprise 合同 */
export const parallelLimit = (s: StoreState, ws: WorkspaceId) => (ws === "personal" ? PARALLEL_LIMIT[s.subscription.plan] : ORG_PARALLEL_LIMIT);
const parallelCopy = (s: StoreState, ws: WorkspaceId) => {
  const n = parallelLimit(s, ws);
  const plan = planLabel(s.subscription.plan);
  if (ws !== "personal") return `Your workspace runs up to ${n} generations at once. Try again when one finishes.`;
  if (s.subscription.plan === "free") return "Free runs 1 generation at a time. Upgrade to run up to 4 at once.";
  if (s.subscription.plan === "ultra") return `Ultra runs up to ${n} generations at once. Try again when one finishes.`;
  return `${plan} runs up to ${n} generations at once. Upgrade to run more.`;
};

function submitPrompt(s: StoreState, id: string): StoreState {
  const c = s.composer;
  const text = c.text.trim();
  if (!text && c.attachments.length === 0) return s;

  const ws = s.workspace;
  const sessionId = s.currentSessionId ?? `${id}-s`;
  const user: Message = { id: `${id}-u`, role: "user", text, attachments: c.attachments };
  const cost = MODE_COST[c.mode] * c.batch;
  let jobs = s.jobs;
  let credits = s.credits;
  let replies: Message[];
  let requests: Partial<Pick<StoreState, "paywallRequest" | "topUpRequested">> = {};

  // Free 不能生成视频:不扣费、保留草稿,打开付费墙(组织工作区按组织的权益走)
  if (c.mode === "video" && ws === "personal" && !isSubscribed(s) && !BLOCKED.test(text)) {
    // 模型 Starter 也用不了(如 Seedance 2.0 / 2.5):直接开 Pro,别让用户买完 Starter 再撞一次
    return { ...s, paywallRequest: lowestPlanFor(c.model) };
  }

  // 选了套餐不含的模型(如 Starter 选 Seedance 2.0 / 2.5):不扣费、保留草稿,打开付费墙 Pro tab
  if (c.model && ws === "personal" && modelLocked(s, c.model) && !BLOCKED.test(text)) {
    return { ...s, paywallRequest: { trigger: "model_locked", tab: "pro" } };
  }

  if (BLOCKED.test(text)) {
    replies = [{ id: `${id}-n`, role: "agent", kind: "notice", text: REFUSAL }];
  } else if (credits[ws] < cost) {
    replies = [{ id: `${id}-n`, role: "agent", kind: "notice", text: insufficientCopy(s), ...lowCreditsCta(s, ws) }];
    // 积分不足:个人空间自动弹出 —— Free 弹付费墙,会员弹积分包(对话里的提示保留)
    if (ws === "personal") requests = isSubscribed(s) ? { topUpRequested: true } : { paywallRequest: { trigger: "low_credits", tab: "starter" } };
  } else if (runningIn(s, ws) >= parallelLimit(s, ws)) {
    // 同时生成数到上限:不提交、不扣费、保留草稿;Free 带 See plans
    replies = [{ id: `${id}-n`, role: "agent", kind: "notice", text: parallelCopy(s, ws), ...(ws === "personal" && s.subscription.plan !== "ultra" ? { cta: "plans" as const } : {}) }];
  } else if (c.mode === "agent" && ws === "personal" && !isSubscribed(s)) {
    // Free 的 Marketing Agent:照常出方案,到生成视频这一步停下、弹付费墙;不建任务、不扣费
    replies = [
      { id: `${id}-p`, role: "agent", kind: "plan", ...planFor(c.mode, text) },
      { id: `${id}-n`, role: "agent", kind: "notice", text: FREE_AGENT_VIDEO_COPY, cta: "video" },
    ];
    requests = { paywallRequest: { trigger: "video_locked", tab: "starter" } };
  } else {
    const result = resultFor(c.mode, text);
    const job: Job = {
      id,
      title: result.title ?? titleFrom(text),
      prompt: text,
      mode: c.mode,
      model: c.model,
      status: "running",
      elapsedMs: 0,
      cover: result.cover,
      video: result.video,
      workspace: ws,
      sessionId,
      modifiedAt: nextModified(s),
    };
    jobs = [job, ...jobs];
    credits = { ...credits, [ws]: credits[ws] - cost };
    replies = [
      { id: `${id}-p`, role: "agent", kind: "plan", ...planFor(c.mode, text) },
      { id: `${id}-j`, role: "agent", kind: "job", jobId: id },
    ];
  }

  // 被拒或积分不足:保留草稿,不清空输入框
  const created = jobs !== s.jobs;
  return {
    ...s,
    ...requests,
    jobs,
    credits,
    sessions: s.currentSessionId
      ? s.sessions.map((x) => (x.id === sessionId && created ? { ...x, updatedAt: nextStamp(s.sessions) } : x))
      : [
          { id: sessionId, title: resultFor(c.mode, text).title ?? titleFrom(text), updatedAt: nextStamp(s.sessions), pinned: false, workspace: ws },
          ...s.sessions,
        ],
    messages: { ...s.messages, [sessionId]: [...(s.messages[sessionId] ?? []), user, ...replies] },
    currentSessionId: sessionId,
    composer: created ? { ...EMPTY_COMPOSER, mode: c.mode, model: c.model, batch: c.batch, ratio: c.ratio } : c,
  };
}

/** 锁定模型不运行、不扣费:个人空间在该任务所在会话补一条带 See plans 的提示 + toast,组织只弹 toast */
/**
 * 重试 / 重做前的拦截,和直接发送同一套规则(spec §5.2):
 * 同时生成数到上限 → 对话里提示;积分不足 → 对话里提示 + 个人空间自动弹付费墙(Free)/ 积分包(会员)
 */
function rerunBlocked(s: StoreState, src: Job, noticeId: string): StoreState | null {
  const ws = src.workspace;
  const append = (notice: Message) =>
    s.sessions.some((x) => x.id === src.sessionId) ? { ...s.messages, [src.sessionId]: [...(s.messages[src.sessionId] ?? []), notice] } : s.messages;
  if (runningIn(s, ws) >= parallelLimit(s, ws)) {
    const text = parallelCopy(s, ws);
    return { ...s, toast: text, messages: append({ id: noticeId, role: "agent", kind: "notice", text, ...(ws === "personal" && s.subscription.plan !== "ultra" ? { cta: "plans" as const } : {}) }) };
  }
  if (s.credits[ws] < MODE_COST[src.mode]) {
    const text = insufficientCopy(s, ws);
    const requests = ws === "personal" ? (isSubscribed(s) ? { topUpRequested: true } : { paywallRequest: { trigger: "low_credits" as const, tab: "starter" as const } }) : {};
    return { ...s, ...requests, toast: text, messages: append({ id: noticeId, role: "agent", kind: "notice", text, ...lowCreditsCta(s, ws) }) };
  }
  return null;
}

function blockLockedJob(s: StoreState, src: Job, noticeId: string): StoreState {
  const model = src.model ?? "";
  if (src.workspace !== "personal") return { ...s, toast: modelLockedOrgToast(model) };
  const notice: Message = { id: noticeId, role: "agent", kind: "notice", text: modelLockedCopy(model), cta: "model" };
  // 和直接发送一致:不扣费,打开付费墙 Pro tab;对话里留一条可换模型的提示
  return {
    ...s,
    paywallRequest: { trigger: "model_locked", tab: "pro" },
    messages: s.sessions.some((x) => x.id === src.sessionId)
      ? { ...s.messages, [src.sessionId]: [...(s.messages[src.sessionId] ?? []), notice] }
      : s.messages,
  };
}

function tick(s: StoreState, ms: number): StoreState {
  const busy = s.jobs.some((j) => j.status === "running") || s.uploads.some((u) => u.progress < 1);
  if (!busy) return s;
  let finished: Job | undefined;
  const jobs = s.jobs.map((j) => {
    if (j.status !== "running") return j;
    const elapsedMs = j.elapsedMs + ms;
    if (elapsedMs < GENERATION_MS) return { ...j, elapsedMs };
    const done = { ...j, elapsedMs: GENERATION_MS, status: "done" as const };
    finished = done;
    return done;
  });
  const uploads = s.uploads.map((u) => (u.progress >= 1 ? u : { ...u, progress: Math.min(1, u.progress + ms / UPLOAD_MS) }));
  // 这次会话里第一条成片完成:轻问一次要不要营销推送
  const ask = !!finished && s.signedIn && !s.marketingAsked && !s.marketingPush;
  return {
    ...s,
    jobs,
    uploads,
    pushBanner: withBanner(s, finished),
    ...(ask ? { marketingAsked: true, marketingPromptOpen: true } : {}),
  };
}

/** 内购没成功:失败 / 等家长批准都不改订阅和积分,只提示(spec §2.5) */
function purchaseBlocked(s: StoreState): StoreState | null {
  if (s.faults.offline) return { ...s, toast: OFFLINE_TOAST };
  if (s.storekit.purchase === "failed") return { ...s, toast: PURCHASE_FAILED_TOAST };
  if (s.storekit.purchase === "pending") return { ...s, toast: PURCHASE_PENDING_TOAST };
  return null;
}

export function storeReducer(s: StoreState, a: StoreAction): StoreState {
  switch (a.type) {
    case "completeOnboarding":
      return { ...s, onboarded: true };
    case "allowAiConsent": {
      const pending = s.aiConsentPrompt?.pending;
      const next = { ...s, aiConsent: true, aiConsentPrompt: null };
      return pending ? storeReducer(next, pending) : next;
    }
    case "dismissAiConsent":
      return { ...s, aiConsentPrompt: null };
    case "setAiConsent":
      return { ...s, aiConsent: a.on };
    case "appLaunched": {
      // 冷启动:Free 用户每天最多自动弹一次付费墙;已登录用户从广告 / 邀请链接打开时直达内容,不弹(spec §8.3)
      // 冷启动 = 进程重开:上次开着的弹层(挽留、运营弹窗、评分、营销轻问、权限框、横幅、待打开的付费墙)都不在了;
      // 「已用过 / 已问过」的记录是持久化的,保留
      const next: StoreState = {
        ...s,
        today: a.day,
        exitOfferOpen: false,
        promoOpen: null,
        ratingPromptOpen: false,
        marketingPromptOpen: false,
        permissionPrompt: null,
        aiConsentPrompt: null,
        pushBanner: null,
        campaignBanner: null,
        paywallRequest: null,
        topUpRequested: false,
        toast: null,
      };
      return s.signedIn && s.deepLink ? next : autoPromo(autoPaywall(next, "daily"));
    }
    case "signIn":
      // 断网 / 第三方登录失败:停在登录页,提示重试(用户自己取消第三方登录不提示,不走这里)
      if (s.faults.offline) return { ...s, toast: OFFLINE_TOAST };
      if (s.faults.signIn) return { ...s, toast: SIGN_IN_FAILED_TOAST };
      // 推送授权在登录页出现时由 App 请求;Free 用户首登弹付费墙(和当天的冷启动共用一次)
      // Enterprise 用户登录后默认进所在组织,不弹付费墙
      if (isEnterprise(s)) return { ...s, signedIn: true, workspace: workspacesFor(s)[1] };
      return autoPaywall({ ...s, signedIn: true }, "first_login");
    case "openPaywall":
      // 会员默认停在自己的档位;Free 默认 Starter
      return { ...s, paywallRequest: { trigger: a.trigger, tab: a.tab ?? (isSubscribed(s) ? (s.subscription.plan as PaidPlanId) : "starter") } };
    case "consumePaywallRequest":
      return { ...s, paywallRequest: null };
    case "closePaywall":
      // Free 用户第一次关付费墙弹挽留;会员、已用过的直接关
      // Enterprise 用户也不弹:公司已付费,不推销个人套餐
      if (isSubscribed(s) || isEnterprise(s) || s.exitOfferUsed) return s;
      return { ...s, exitOfferOpen: true, exitOfferUsed: true, exitOfferExpiresAt: (a.now ?? 0) + EXIT_OFFER_MS };
    case "openExitOffer":
      // 24 小时内从横幅 / 付费墙回来:重新打开挽留抽屉;过期就什么都不做
      return exitOfferLive(s, a.now) ? { ...s, exitOfferOpen: true } : s;
    case "dismissExitOffer":
      return { ...s, exitOfferOpen: false };
    case "acceptExitOffer": {
      // 到期了不能再按优惠价买;买了就结束这个窗口
      const live = a.now === undefined ? s.exitOfferOpen || s.exitOfferExpiresAt > 0 : exitOfferLive(s, a.now);
      if (!live) return s;
      // 内购失败 / 待批准:优惠窗口保留,还能再买
      const blocked = purchaseBlocked(s);
      if (blocked) return blocked;
      return storeReducer({ ...s, exitOfferOpen: false, exitOfferExpiresAt: 0 }, { type: "purchasePlan", plan: EXIT_OFFER.plan, period: EXIT_OFFER.period });
    }
    case "signOut":
      return { ...s, signedIn: false, paywallRequest: null, exitOfferOpen: false, pushBanner: null, permissionPrompt: null, currentSessionId: null };
    case "deleteAccount":
      // 删号 = 回到登录页重新注册:账号数据全清;系统权限、Onboarding 跟着设备走,保留;AI 数据同意跟账号走,清零。
      // 新账号是 Free,首次登录仍会弹一次订阅页。卸载重装才是全部重来(reset)
      return {
        ...INITIAL_STATE,
        jobs: [],
        sessions: [],
        messages: {},
        uploads: [],
        favorites: [],
        library: [],
        permissions: s.permissions,
        region: s.region,
        onboarded: s.onboarded,
        today: s.today,
        toast: "Your account has been deleted.",
      };
    case "reset":
      return INITIAL_STATE;
    case "purchasePlan": {
      // 已在网页订阅:不能再在 APP 内购买(付费墙也不显示 Subscribe)
      if (s.subscription.source === "web") return s;
      const blockedPlan = purchaseBlocked(s);
      if (blockedPlan) return blockedPlan;
      const p = planById(a.plan);
      // Ultra 可以选 2× / 4× 积分;其他档没有倍数
      const multiplier = a.plan === "ultra" && a.multiplier && a.multiplier > 1 ? a.multiplier : undefined;
      const credits = multiplier ? ultraTier(multiplier).credits : p.credits;
      const target: PlanChoice = { plan: a.plan, period: a.period, ...(multiplier ? { multiplier } : {}) };
      // 已在 APP 内订阅:升级立即生效;降级 / 换周期排到下个续费日(spec §2.5)
      if (s.subscription.source === "app" && isSubscribed(s)) {
        const cur = s.subscription;
        const curCredits = planCredits(cur.plan as PaidPlanId, cur.multiplier);
        if (credits === curCredits && a.period === cur.period) {
          // 已取消自动续费的会员重新订阅同一方案 = 恢复自动续费,不重复扣费
          if (!cur.cancelled) return s;
          const { cancelled: _, ...rest } = cur;
          return { ...s, subscription: rest, toast: `Your ${p.label} plan will renew` };
        }
        if (credits <= curCredits) {
          // 换方案即恢复自动续费
          const { cancelled: _, ...rest } = cur;
          return { ...s, subscription: { ...rest, pendingChange: target }, toast: `Changes to ${p.label} at your next renewal` };
        }
      }
      return {
        ...s,
        subscription: { source: "app", ...target, renewDay: s.today + (a.period === "yearly" ? 365 : 30) },
        credits: { ...s.credits, personal: s.credits.personal + withBonus(s, credits) },
        toast: `You're on ${p.label}`,
      };
    }
    case "promoLoaded":
      return { ...s, activePromo: a.campaign, promoOpen: a.campaign ? s.promoOpen : null };
    case "dismissPromo":
      return { ...s, promoOpen: null };
    case "promoCta":
      // 和其他入口一致:会员停在自己的档位(加赠用于升级),Free 停在 Starter
      return { ...s, promoOpen: null, paywallRequest: { trigger: "promo", tab: isSubscribed(s) ? (s.subscription.plan as PaidPlanId) : "starter" } };
    case "campaignPushReceived":
      // 只推给打开了 Offers & news 的用户
      // 每个活动最多推一条
      if (s.activePromo?.id !== a.campaignId || !s.marketingPush || s.permissions.push !== "granted" || s.campaignsPushed.includes(a.campaignId)) return s;
      return { ...s, campaignBanner: a.campaignId, campaignsPushed: [...s.campaignsPushed, a.campaignId] };
    case "dismissCampaignBanner":
      return { ...s, campaignBanner: null };
    case "setRegion":
      return { ...s, region: a.region };
    case "setMarketingPush":
      return { ...s, marketingPush: a.on };
    case "answerMarketingPrompt": {
      const next = { ...s, marketingPush: a.on, marketingPromptOpen: false };
      if (!a.on) return next;
      // 打开 Offers & news 还要系统推送权限:没问过就弹系统框;拒绝过就引导去系统设置
      if (s.permissions.push === "undetermined") return { ...next, permissionPrompt: { kind: "push" } };
      if (s.permissions.push === "denied") return { ...next, toast: "Turn on notifications in Settings to get offers" };
      return next;
    }
    case "workSaved":
      return { ...askRating(s), toast: "Saved" };
    case "workShared":
      return askRating(s);
    case "dismissRating":
      return { ...s, ratingPromptOpen: false };
    case "reportContent":
      return { ...s, reportedContent: true, toast: "Thanks — we’ll review this within 24 hours." };
    case "inviteRewardGranted":
      // 服务端事件:好友首次订阅,双方各得 1,500;只奖励前 10 位
      if (s.inviteRewards >= INVITE.maxRewards) return s;
      return { ...s, inviteRewards: s.inviteRewards + 1, credits: { ...s.credits, personal: s.credits.personal + INVITE.rewardCredits } };
    case "openDeepLink":
      // 已下架的 Use Case:忽略,正常进 Inspire
      return USE_CASES.some((u) => u.id === a.useCaseId) ? { ...s, deepLink: { useCaseId: a.useCaseId } } : s;
    case "consumeDeepLink":
      return { ...s, deepLink: null };
    case "consumeTopUpRequest":
      return { ...s, topUpRequested: false };
    case "buyCreditPack": {
      // 只有会员能买积分包(spec §2.3)
      const pack = CREDIT_PACKS.find((p) => p.id === a.packId);
      if (!pack || !isSubscribed(s) || a.qty < 1) return s;
      const blockedPack = purchaseBlocked(s);
      if (blockedPack) return blockedPack;
      const added = withBonus(s, pack.credits * a.qty);
      return { ...s, credits: { ...s.credits, personal: s.credits.personal + added }, toast: `${added.toLocaleString("en-US")} credits added` };
    }
    case "restorePurchases":
      if (s.faults.offline) return { ...s, toast: OFFLINE_TOAST };
      // 结果由 App Store 决定;订阅只归首次购买的账号(spec §2.5)
      if (s.storekit.restore === "none") return { ...s, toast: "No purchases to restore on this Apple ID" };
      if (s.storekit.restore === "otherAccount") return { ...s, toast: "This subscription belongs to another BuzzVideo account" };
      return { ...s, toast: "Purchases restored" };
    case "setMemberCap": {
      const m = s.members[a.workspace].find((x) => x.id === a.id);
      if (!m || !isValidCap(m, a.cap)) return s;
      return {
        ...s,
        members: { ...s.members, [a.workspace]: s.members[a.workspace].map((x) => (x.id === a.id ? { ...x, cap: a.cap } : x)) },
      };
    }
    case "toggleFavorite":
      return { ...s, favorites: s.favorites.includes(a.id) ? s.favorites.filter((x) => x !== a.id) : [...s.favorites, a.id] };
    case "setWorkspace":
      if (a.workspace === s.workspace) return s;
      return { ...s, workspace: a.workspace, currentSessionId: null, composer: EMPTY_COMPOSER };
    case "setPermission":
      return { ...s, permissions: { ...s.permissions, [a.kind]: a.value } };
    case "requestPermission":
      if (s.permissions[a.kind] !== "undetermined") return s;
      return { ...s, permissionPrompt: a.then ? { kind: a.kind, then: a.then } : { kind: a.kind } };
    case "answerPermission":
      if (!s.permissionPrompt) return s;
      return { ...s, permissions: { ...s.permissions, [s.permissionPrompt.kind]: a.value }, permissionPrompt: null };
    case "setComposer":
      return { ...s, composer: normalizeComposer(s.composer, a.patch, entitledPlan(s)) };
    case "addAttachments": {
      const attachments = a.items.map(({ uploaded: _uploaded, ...att }) => att);
      const uploads: Upload[] = a.items
        .filter((i) => !i.uploaded)
        .map((i, n) => ({ id: i.id, uri: i.uri, kind: i.kind, progress: 0, workspace: s.workspace, modifiedAt: nextModified(s) + n }));
      return {
        ...s,
        composer: { ...s.composer, attachments: [...s.composer.attachments, ...attachments] },
        uploads: [...uploads, ...s.uploads],
      };
    }
    case "removeAttachment":
      return { ...s, composer: { ...s.composer, attachments: s.composer.attachments.filter((x) => x.id !== a.id) } };
    case "submitPrompt":
      // 断网:不提交、不扣积分,草稿留在输入框
      if (s.faults.offline) return { ...s, toast: OFFLINE_DRAFT_TOAST };
      if (!s.aiConsent) return { ...s, aiConsentPrompt: { pending: a } };
      return submitPrompt(s, a.id);
    case "tick":
      return tick(s, a.ms);
    case "simulatePush": {
      const running = worksFor(s).filter((j) => j.status === "running");
      if (running.length === 0) {
        const latest = worksFor(s).find((j) => j.status === "done");
        return { ...s, pushBanner: withBanner(s, latest) };
      }
      return {
        ...s,
        jobs: s.jobs.map((j) => (running.includes(j) ? { ...j, status: "done" as const, elapsedMs: GENERATION_MS } : j)),
        pushBanner: withBanner(s, { ...running[0], status: "done" }),
      };
    }
    case "retryJob": {
      if (s.faults.offline) return { ...s, toast: OFFLINE_TOAST };
      if (!s.aiConsent) return { ...s, aiConsentPrompt: { pending: a } };
      const src = s.jobs.find((j) => j.id === a.id);
      if (src && freeVideoBlocked(s, src)) return { ...s, paywallRequest: freeVideoPaywall(s, src) };
      if (!src) return s;
      if (src.model && modelLocked(s, src.model, src.workspace)) return blockLockedJob(s, src, `${a.id}-n${s.messages[src.sessionId]?.length ?? 0}`);
      const blocked = rerunBlocked(s, src, `${a.id}-n${s.messages[src.sessionId]?.length ?? 0}`);
      if (blocked) return blocked;
      // 失败时积分已退回,重试重新扣一次
      return {
        ...s,
        jobs: s.jobs.map((j) => (j.id === a.id ? { ...j, status: "running" as const, elapsedMs: 0, modifiedAt: nextModified(s) } : j)),
        credits: { ...s.credits, [src.workspace]: s.credits[src.workspace] - MODE_COST[src.mode] },
      };
    }
    case "regenerateJob": {
      if (s.faults.offline) return { ...s, toast: OFFLINE_TOAST };
      if (!s.aiConsent) return { ...s, aiConsentPrompt: { pending: a } };
      const src = s.jobs.find((j) => j.id === a.id);
      if (!src) return s;
      if (freeVideoBlocked(s, src)) return { ...s, paywallRequest: freeVideoPaywall(s, src) };
      if (src.model && modelLocked(s, src.model, src.workspace)) return blockLockedJob(s, src, `${a.newId}-n`);
      const blocked = rerunBlocked(s, src, `${a.newId}-n`);
      if (blocked) return blocked;
      const ws = src.workspace;
      const cost = MODE_COST[src.mode];
      const job: Job = { ...src, id: a.newId, status: "running", elapsedMs: 0, workspace: ws, modifiedAt: nextModified(s) };
      const card: Message = { id: `${a.newId}-j`, role: "agent", kind: "job", jobId: a.newId };
      const hasSession = s.sessions.some((x) => x.id === src.sessionId);
      return {
        ...s,
        jobs: [job, ...s.jobs],
        credits: { ...s.credits, [ws]: s.credits[ws] - cost },
        toast: REGENERATING_COPY,
        messages: hasSession
          ? { ...s.messages, [src.sessionId]: [...(s.messages[src.sessionId] ?? []), card] }
          : s.messages,
      };
    }
    case "deleteJob": {
      const messages = Object.fromEntries(
        Object.entries(s.messages).map(([k, list]) => [
          k,
          list.filter((m) => !(m.role === "agent" && m.kind === "job" && m.jobId === a.id)),
        ]),
      );
      return {
        ...s,
        jobs: s.jobs.filter((j) => j.id !== a.id),
        messages,
        pushBanner: s.pushBanner?.jobId === a.id ? null : s.pushBanner,
      };
    }
    case "dismissPush":
      return { ...s, pushBanner: null };
    case "selectSession":
      return {
        ...s,
        currentSessionId: a.id !== null && s.sessions.some((x) => x.id === a.id && x.workspace === s.workspace) ? a.id : null,
        composer: EMPTY_COMPOSER,
      };
    case "renameSession":
      return { ...s, sessions: s.sessions.map((x) => (x.id === a.id ? { ...x, title: a.title.trim() || x.title } : x)) };
    case "togglePinSession":
      return { ...s, sessions: s.sessions.map((x) => (x.id === a.id ? { ...x, pinned: !x.pinned } : x)) };
    case "deleteSession": {
      const { [a.id]: _removed, ...messages } = s.messages;
      return {
        ...s,
        sessions: s.sessions.filter((x) => x.id !== a.id),
        messages,
        currentSessionId: s.currentSessionId === a.id ? null : s.currentSessionId,
      };
    }
    case "showToast":
      return { ...s, toast: a.text };
    case "hideToast":
      return { ...s, toast: null };
  }
}
