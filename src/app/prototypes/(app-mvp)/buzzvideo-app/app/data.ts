import type { Job, Message, Role, Session } from "./store";

/** hybrid = Hybrid Reel:用户自己的实拍素材 + AI 补拍镜头，剪成一条竖版广告(2026-10-22 开放) */
export type Mode = "agent" | "image" | "video" | "audio" | "hybrid";
export type WorkspaceId = "personal" | "presslogic";

export type IconName =
  | "message-square-text" | "image" | "clapperboard" | "audio-lines" | "menu" | "square-pen" | "plus"
  | "arrow-up" | "camera" | "images" | "file-text" | "folder-open" | "x" | "chevron-down"
  | "chevron-left" | "chevron-right" | "ellipsis" | "download" | "share" | "message-square" | "rotate-ccw"
  | "copy" | "flag" | "trash" | "settings" | "user-round" | "check" | "bell" | "globe" | "shield" | "hand"
  | "log-out" | "external-link" | "play" | "search" | "circle-alert" | "compass" | "megaphone" | "square-plus"
  | "volume-2" | "volume-x" | "circle-check" | "loader" | "arrow-up-right" | "info" | "mail" | "pin" | "pin-off" | "heart" | "lock" | "house" | "sparkles" | "speech" | "square-user" | "shopping-bag"
  | "scan-face" | "scissors" | "package" | "shirt" | "image-play" | "eraser" | "expand" | "film" | "link" | "mic" | "zoom-in" | "crop" | "pause" | "maximize" | "pencil" | "at-sign" | "user-plus" | "gift" | "list-checks" | "users" | "upload"
  | "sliders-horizontal" | "layout-grid" | "flame" | "gem" | "arrow-down-right" | "rectangle-vertical" | "rectangle-horizontal" | "square" | "wand-sparkles" | "trophy";

/** 素材目录 */
export const A = "/prototypes/buzzvideo-app";

export const USER = { name: "Alex Chen", email: "alex@example.com", avatar: `${A}/avatar.jpg` };

export const WORKSPACES: { id: WorkspaceId; name: string; detail: string }[] = [
  { id: "personal", name: "Personal", detail: "Your own credits" },
  { id: "presslogic", name: "PressLogic", detail: "Organization" },
];
export const workspaceName = (id: WorkspaceId) => WORKSPACES.find((w) => w.id === id)!.name;

/** Free 用户注册一次性送的积分(和网页一样,用完不再补) */
export const FREE_CREDITS = 500;
export const CREDITS_INITIAL: Record<WorkspaceId, number> = { personal: FREE_CREDITS, presslogic: 18400 };
export const MONTHLY_USED: Record<WorkspaceId, number> = { personal: 860, presslogic: 5200 };
/** 组织成员:used 是本月已用积分,cap 是每月上限;self 表示当前用户(角色取自 store.roles) */
export type Member = { id: string; name: string; email: string; role: Role; used: number; cap: number; self?: boolean };
/** 每月上限的步长 */
export const CAP_STEP = 100;

export const SEED_MEMBERS: Record<WorkspaceId, Member[]> = {
  personal: [],
  presslogic: [
    { id: "m-alex", name: "Alex Chen", email: "alex@example.com", role: "admin", used: 1850, cap: 5000, self: true },
    { id: "m-priya", name: "Priya Nair", email: "priya@presslogic.com", role: "owner", used: 1420, cap: 5000 },
    { id: "m-marcus", name: "Marcus Lee", email: "marcus@presslogic.com", role: "member", used: 980, cap: 2000 },
    { id: "m-sofia", name: "Sofia Alvarez", email: "sofia@presslogic.com", role: "member", used: 750, cap: 1500 },
    { id: "m-daniel", name: "Daniel Kim", email: "daniel@presslogic.com", role: "member", used: 200, cap: 1000 },
  ],
};

/** 每次生成扣的积分(乘以批量数量) */
export const MODE_COST: Record<Mode, number> = { agent: 60, image: 8, video: 45, audio: 5, hybrid: 80 };

/** outcome:模式面板里名字下面那句说明，越短越好(一行),给不懂 Agent / 模型的小店老板看 */
/** title / tag:模式面板里的名字和名字旁的灰色小标签(参照即梦「Agent 模式 · 分钟级成片」的写法,2026-10-22) */
export const MODES: { id: Mode; label: string; title: string; tag?: string; short: string; outcome: string; icon: IconName; description: string }[] = [
  { id: "agent", label: "Marketing Agent", title: "Marketing Agent", short: "Agent", outcome: "From idea to finished ad", icon: "message-square-text", description: "Plans the strategy and makes images or videos for you" },
  { id: "image", label: "Image", title: "Image generation", short: "Image", outcome: "Product shots and posts", icon: "image", description: "Fast image generation for posts and product shots" },
  { id: "video", label: "Video", title: "Video generation", short: "Video", outcome: "Up to 30s, with sound", icon: "clapperboard", description: "Up to 30s of video with synced audio" },
  { id: "hybrid", label: "Hybrid Reel", title: "Hybrid Reel", short: "Hybrid", outcome: "Your clips + AI shots", icon: "film", description: "Mix your own clips with AI shots into one ad" },
  { id: "audio", label: "Audio", title: "Audio generation", short: "Audio", outcome: "Voiceover, music, SFX", icon: "audio-lines", description: "Voiceovers, music and sound effects" },
];
export const modeLabel = (m: Mode) => MODES.find((x) => x.id === m)!.label;

/**
 * 首页工具入口(2026-10-21 按竞品调研定，自动字幕暂不加)。点任何工具都进 Create 的 Agent 模式，
 * 在输入框里填上这个工具对应的提示词开头(用户接着补充细节再发送),由 Agent 调用画布对应能力。
 * needsMedia = 需要先选一张图 / 一段视频，进去后直接弹「+」附件面板
 */
/** glyph:Lucide 没有、按同类产品习惯自己画的图标(cutout 抠图虚线框、hd 画质提升) */
/** desc:创作页「全部工具」面板里卡片上的一句话说明 */
export type Tool = { id: string; label: string; desc: string; icon: IconName; glyph?: "cutout" | "hd"; prompt: string; needsMedia?: boolean };
// 排序(2026-10-21):前 4 个是核心工具固定在前;其余按竞品调研里「提供这个工具的产品数」从多到少，
// 同数的按电商卖家常用度 —— Product to Video(约 10 家)> AI Avatar(9)> Lip Sync(7)> Remove Background(6)
// > Virtual Try-On / Upscale / Link to Ad(各 5)> Product Photo(4)> Magic Eraser / Expand Image / Edit Video(各 3)
export const TOOLS: Tool[] = [
  { id: "agent", desc: "Plans and makes the whole ad", label: "AI Agent", icon: "sparkles", prompt: "Make a video ad for my product: " },
  { id: "image", desc: "Posts, banners and product shots", label: "Generate Image", icon: "image", prompt: "Generate an image of " },
  { id: "video", desc: "Clips up to 30s with sound", label: "Generate Video", icon: "clapperboard", prompt: "Generate a video of " },
  { id: "audio", desc: "Voiceovers, music and SFX", label: "Generate Audio", icon: "audio-lines", prompt: "Generate a voiceover that says: " },
  { id: "product-to-video", desc: "One photo into a moving ad", label: "Product to Video", icon: "image-play", prompt: "Turn this product photo into a video ad with smooth camera motion", needsMedia: true },
  { id: "avatar", desc: "A presenter talks about your product", label: "AI Avatar", icon: "square-user", prompt: "Create a talking avatar video that presents my product: " },
  { id: "lip-sync", desc: "Make anyone say your script", label: "Lip Sync", icon: "speech", prompt: "Make the person in this video say: ", needsMedia: true },
  { id: "remove-bg", desc: "Clean cutout in one tap", label: "Remove Background", icon: "scissors", glyph: "cutout", prompt: "Remove the background from this product photo", needsMedia: true },
  { id: "try-on", desc: "See outfits on a model", label: "Virtual Try-On", icon: "shirt", prompt: "Show this outfit on a model: ", needsMedia: true },
  { id: "upscale", desc: "Sharpen photos to HD", label: "Upscale", icon: "zoom-in", glyph: "hd", prompt: "Upscale this photo to high resolution", needsMedia: true },
  { id: "link-to-ad", desc: "Paste a product link, get an ad", label: "Link to Ad", icon: "link", prompt: "Make a video ad from this product link: " },
  { id: "product-photo", desc: "Studio-style scenes for products", label: "Product Photo", icon: "shopping-bag", prompt: "Place this product in a clean, styled scene: ", needsMedia: true },
  { id: "eraser", desc: "Remove anything from a photo", label: "Magic Eraser", icon: "eraser", prompt: "Remove this from the photo: ", needsMedia: true },
  { id: "expand", desc: "Extend a photo to any size", label: "Expand Image", icon: "expand", prompt: "Expand this photo to 9:16 and keep the product unchanged", needsMedia: true },
  { id: "edit-video", desc: "Trim, restyle or retouch clips", label: "Edit Video", icon: "scissors", prompt: "Edit this video: ", needsMedia: true },
];

/** desc:模型与设置面板里模型名下面的一句话;isNew:名字后面的 New 角标(运营后台配置) */
/** provider:模型下拉里名字前面的官方图标(public/prototypes/buzzvideo-app/logos/):seed = 字节,google = Veo,nanobanana = Nano Banana,openai = GPT Image */
export type ModelInfo = { id: string; label: string; desc: string; isNew?: boolean; provider: "seed" | "google" | "nanobanana" | "openai" };
export const MODELS: Record<Exclude<Mode, "agent" | "hybrid">, ModelInfo[]> = {
  image: [
    { id: "seedream-5", provider: "seed", label: "Seedream 5.0", desc: "Sharp text and true-to-product color", isNew: true },
    { id: "nano-banana", provider: "nanobanana", label: "Nano Banana", desc: "Fast edits that keep your product the same" },
    { id: "gpt-image", provider: "openai", label: "GPT Image", desc: "Best at following long, detailed prompts" },
  ],
  video: [
    { id: "seedance-2-5", provider: "seed", label: "Seedance 2.5", desc: "Most realistic motion, now in 1080p", isNew: true },
    { id: "seedance-2", provider: "seed", label: "Seedance 2.0", desc: "Steady quality with synced audio" },
    { id: "seedance-2-fast", provider: "seed", label: "Seedance 2.0 Fast", desc: "About 2× faster, lower cost" },
    { id: "veo-3", provider: "google", label: "Veo 3", desc: "Cinematic shots and natural voices" },
  ],
  audio: [
    { id: "seed-audio", provider: "seed", label: "Seed Audio", desc: "Natural voiceovers in 20+ languages", isNew: true },
  ],
};
/** Agent 模式由 Agent 自己选模型,所以是 null */
export const defaultModel = (mode: Mode): string | null => (mode === "agent" || mode === "hybrid" ? null : MODELS[mode][0].id);
export const modelLabel = (id: string) =>
  Object.values(MODELS).flat().find((m) => m.id === id)?.label ?? id;

/* ---------- 订阅套餐(注意:与上面按 Mode 的生成计划 PLANS 无关) ---------- */

export type PlanId = "free" | "starter" | "pro" | "ultra";
export type PaidPlanId = Exclude<PlanId, "free">;
export type Billing = "monthly" | "yearly";
export type SubscriptionPlan = {
  id: PaidPlanId;
  label: string;
  monthly: number;
  yearly: number;
  credits: number;
  /** 每月 ≈ 多少条 Seedance 2.0 HD 10s 视频(官网月付视图口径;年付视图显示的是全年总量) */
  videos: number;
  perks: string[];
  /** 付费墙该 tab 的氛围图 */
  mood: string;
  popular?: boolean;
};

/** 和 buzzvideo.ai/pricing 一模一样(spec §2.2);perks 取官网每档的 CORE FEATURES + KEY FEATURES 里打勾的项(2026-10-19 对齐，每档 9 条，随时取消放最后) */
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "starter", label: "Starter", monthly: 19, yearly: 168, credits: 1900, videos: 7, mood: `${A}/paywall-starter.jpg`,
    perks: [
      "Marketing Agent for ad ideas and copy",
      "Image & video generation",
      "All premium models except Seedance 2.0",
      "Unlimited AI Avatars",
      "Watermark-free videos",
      "Up to 4 generations at once",
      "Fast processing",
      "Web Explore & MCP",
      "Cancel anytime · No hidden fees",
    ],
  },
  {
    id: "pro", label: "Pro", monthly: 49, yearly: 420, credits: 4900, videos: 18, mood: `${A}/paywall-pro.jpg`, popular: true,
    perks: [
      "Marketing Agent for full campaign workflows",
      "Image & video generation",
      "Full access to all premium models (incl. Seedance 2.0)",
      "Unlimited AI Avatars",
      "Watermark-free videos",
      "Up to 8 generations at once",
      "Fast processing",
      "Technical support",
      "Cancel anytime · No hidden fees",
    ],
  },
  {
    id: "ultra", label: "Ultra", monthly: 89, yearly: 756, credits: 8900, videos: 34, mood: `${A}/paywall-ultra.jpg`,
    perks: [
      "Full access to all premium models",
      "Highest credit allowance for high-volume production",
      "Unlimited AI Avatars",
      "Watermark-free videos",
      "Up to 12 generations at once",
      "Priority processing",
      "Technical support",
      "Web Explore & MCP",
      "Cancel anytime · No hidden fees",
    ],
  },
];
export const planById = (id: PaidPlanId) => SUBSCRIPTION_PLANS.find((p) => p.id === id)!;
/** 年付折算月价,取整美元 */
export const perMonth = (p: SubscriptionPlan) => Math.round(p.yearly / 12);
export const planLabel = (id: PlanId) => (id === "free" ? "Free" : planById(id).label);

/** Ultra 的积分倍数(官网 Ultra 卡片上的滑块):倍数越高,每积分越便宜。off 为相对原价(月付 $89 × 倍数)的折扣百分比，由 savePct 按价格算 */
export type UltraMultiplier = 1 | 2 | 4;
export type UltraTier = { multiplier: UltraMultiplier; credits: number; monthly: number; yearly: number; videos: number; offMonthly: number; offYearly: number };
/**
 * 折扣百分比按价格实时算、向下取整(2026-10-19:原来写死「Save 30%」,Starter 实际只省 26%,
 * 订阅页夸大折扣有 App Store 审核风险)。list = 不打折时的原价
 */
export const savePct = (price: number, list: number) => (list > price ? Math.floor((1 - price / list) * 100) : 0);
const ultra = (multiplier: UltraMultiplier, credits: number, monthly: number, yearly: number, videos: number): UltraTier => ({
  multiplier,
  credits,
  monthly,
  yearly,
  videos,
  offMonthly: savePct(monthly, 89 * multiplier),
  offYearly: savePct(yearly, 89 * multiplier * 12),
});
export const ULTRA_TIERS: UltraTier[] = [ultra(1, 8900, 89, 756, 34), ultra(2, 17800, 120, 1284, 68), ultra(4, 35600, 214, 2136, 136)];
export const ultraTier = (m: UltraMultiplier) => ULTRA_TIERS.find((t) => t.multiplier === m)!;

/**
 * 把「第几天」显示成日期(英文)。开发原型的 day 是自 1970 年起的天数;评审原型的 day 是 0、1、2…,
 * 以 2026-10-14 为第 0 天
 */
export const formatDay = (day: number) =>
  (day > 10000 ? new Date(day * 86_400_000) : new Date(2026, 9, 14 + day)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

/** 积分包:和网页 Credits Top-up 一致,1 积分 = $0.01,永不过期,只有会员能买(spec §2.3) */
export type CreditPack = { id: string; credits: number; price: number; popular?: boolean };
export const CREDIT_PACKS: CreditPack[] = [1000, 2000, 3500, 5000, 8000, 12000, 20000, 30000].map((credits) => ({
  id: `pack-${credits}`,
  credits,
  price: credits / 100,
  ...(credits === 5000 ? { popular: true } : {}),
}));

/** 挽留优惠:单独的内购商品,首月半价(spec §4) */
export const EXIT_OFFER = { plan: "starter", period: "monthly", firstMonth: 9.5, then: 19 } as const;

/** 对应 admin 营销活动的 PopupConfig + Offer(spec §6.2);真实 APP 从 GET /api/promo/active 取 */
export type PromoCampaign = {
  id: string;
  kicker: string;
  title: string;
  description: string;
  media: string;
  items: { title: string; subtitle: string }[];
  ctaText: string;
  /** 只送积分不打折:订阅和积分包都按这个比例加赠 */
  bonusPct: number;
  frequency: { maxPerUser: number; intervalDays: number };
  priority: number;
};
export const PROMO_CAMPAIGN: PromoCampaign = {
  id: "promo-seedance-25",
  kicker: "New model",
  title: "35% more credits for Seedance 2.5",
  description: "Subscribe or top up while the launch offer is live and make more ads for the same price.",
  media: `${A}/banner-seedance.jpg`,
  items: [
    { title: "+35% credits on every plan", subtitle: "Pro gets 1,715 extra credits with your first payment" },
    { title: "+35% on credit packs", subtitle: "Bonus credits never expire" },
  ],
  ctaText: "Get my 35% bonus now",
  bonusPct: 35,
  frequency: { maxPerUser: 1, intervalDays: 7 },
  priority: 1,
};

/** 邀请好友:照搬网页规则(spec §7.1) */
export const INVITE = { signupCredits: 500, rewardCredits: 1500, maxRewards: 10, link: "https://buzzvideo.ai/invite/17g7sPXX" } as const;

/** 同时进行的生成数上限(同官网 Parallel Generations);组织空间按 Enterprise 合同,原型取 12 */
export const PARALLEL_LIMIT: Record<PlanId, number> = { free: 1, starter: 4, pro: 8, ultra: 12 };
export const ORG_PARALLEL_LIMIT = 12;
/** 有技术支持(同官网 Technical Support):Pro 起;Enterprise 有专属客户经理 */
export const hasSupport = (plan: PlanId) => plan === "pro" || plan === "ultra";

/** 需要订阅才能用的模型 -> 允许使用的套餐 */
export const MODEL_PLAN_GATE: Record<string, PaidPlanId[]> = { "seedance-2": ["pro", "ultra"], "seedance-2-5": ["pro", "ultra"] };
export const isModelLocked = (plan: PlanId, modelId: string) => {
  const allowed = MODEL_PLAN_GATE[modelId];
  return !!allowed && !(allowed as PlanId[]).includes(plan);
};
/** 该套餐下某模式的默认模型:取第一个没锁的(Starter 的视频默认 Seedance 2.0 Fast) */
export const defaultModelFor = (mode: Mode, plan: PlanId): string | null =>
  mode === "agent" || mode === "hybrid" ? null : (MODELS[mode].find((m) => !isModelLocked(plan, m.id)) ?? MODELS[mode][0]).id;

export const readyTitle = (mode: Mode) =>
  mode === "image" ? "Your images are ready" : mode === "audio" ? "Your audio is ready" : "Your video is ready";

export type UseCase = {
  id: string;
  title: string;
  category: string;
  cover: string;
  video?: string;
  tall: boolean;
  prompt: string;
  mode: Mode;
  model?: string;
  attachments: string[];
  /** 做同款次数(卡片上「2.3k made」,社会证明;真实 APP 由服务端统计) */
  made: number;
  /** 运营标签:trending = 本周热门，new = 新上，halloween 等 = 节日 / 专题合集(后台配置) */
  tags?: string[];
  /** 卡片左上角角标：用到的模型或工具(如 Seedance 2.5、AI Avatar) */
  badge?: string;
  /** 多张图的作品(组图):详情页左右滑翻图;不填 = 只有 cover 一张 */
  images?: string[];
  /** 广告玩法(分类栏第二组):UGC 口播 / 开箱 / 前后对比 / 产品展示 / 促销 */
  format: AdFormat;
};

export type AdFormat = "ugc" | "unboxing" | "before-after" | "showcase" | "sale";

/**
 * 灵感流分类(2026-10-21 按竞品调研定):运营位(Trending 默认 / New / 节日专题，现在是 Halloween)
 * + 广告玩法(UGC / Unboxing / Before & After / Product Showcase / Sale & Promo)。不按行业筛(2026-10-21 去掉)。
 * 真实 APP:分类、排序、上下线、专题都由运营后台配置
 */
/** emoji:标签前的小图标(2026-10-21:运营位和能一眼看懂的玩法加 emoji,其余不硬加) */
export type FeedCategory = { id: string; label: string; emoji?: string; tag?: string; format?: AdFormat };
export const CATEGORIES: FeedCategory[] = [
  { id: "trending", label: "Trending", emoji: "🔥", tag: "trending" },
  { id: "new", label: "New", emoji: "✨", tag: "new" },
  { id: "ugc", label: "UGC", format: "ugc" },
  { id: "unboxing", label: "Unboxing", emoji: "📦", format: "unboxing" },
  { id: "before-after", label: "Before & After", format: "before-after" },
  { id: "showcase", label: "Product Showcase", format: "showcase" },
  { id: "sale", label: "Sale & Promo", emoji: "🏷️", format: "sale" },
];


export const USE_CASES: UseCase[] = [
  { id: "uc-latte", title: "Iced latte launch", category: "Food & Drink", cover: `${A}/usecase-latte.jpg`, video: `${A}/result-agent.mp4`, tall: true, mode: "agent", attachments: [`${A}/photo-2.jpg`], prompt: "Make a 15s vertical ad for our new iced latte. Open on the ice pour and end with “20% off today”.", made: 2380, tags: ["trending"], badge: "AI Agent", format: "showcase" },
  { id: "uc-skincare", title: "Glow serum reveal", category: "Beauty", cover: `${A}/usecase-skincare.jpg`, video: `${A}/result-video.mp4`, tall: false, mode: "video", model: "seedance-2-5", attachments: [], prompt: "A glass serum bottle on wet stone, slow orbit, soft peach light, water droplets. 8 seconds.", made: 1940, tags: ["trending"], badge: "Seedance 2.5", format: "showcase" },
  { id: "uc-sneaker", title: "Sneaker drop teaser", category: "Fashion", cover: `${A}/usecase-sneaker.jpg`, tall: false, mode: "video", model: "seedance-2-5", attachments: [], prompt: "Our new sneaker floats above a city street at dusk, fast motion, streetwear energy. 6 seconds.", made: 860, tags: ["new"], badge: "Seedance 2.5", format: "showcase" },
  { id: "uc-bakery", title: "Morning bakery reel", category: "Food & Drink", cover: `${A}/usecase-bakery.jpg`, tall: true, mode: "agent", attachments: [`${A}/photo-5.jpg`], prompt: "Create a cozy 15s reel for our bakery’s morning pastries. Warm tone, end with our opening hours.", made: 1270, tags: ["trending"], badge: "AI Agent", format: "showcase", images: [`${A}/usecase-bakery.jpg`, `${A}/photo-5.jpg`, `${A}/photo-7.jpg`] },
  { id: "uc-lipstick", title: "Lip tint swatches", category: "Beauty", cover: `${A}/usecase-lipstick.jpg`, tall: true, mode: "image", model: "seedream-5", attachments: [], prompt: "Four product shots of our lip tint shades with swatches on skin, clean pink background.", made: 540, tags: ["new"], badge: "Seedream 5.0", format: "showcase" },
  { id: "uc-opening", title: "Grand opening promo", category: "Retail", cover: `${A}/usecase-opening.jpg`, tall: false, mode: "agent", attachments: [`${A}/photo-4.jpg`], prompt: "We’re opening a new shop in Causeway Bay this Saturday. Make a 15s ad inviting people to visit.", made: 710, badge: "AI Agent", format: "sale" },
  { id: "uc-florist", title: "Mother’s Day bouquets", category: "Retail", cover: `${A}/usecase-florist.jpg`, tall: false, mode: "image", model: "seedream-5", attachments: [], prompt: "Three Instagram posts for our Mother’s Day peony bouquets, soft pastel style.", made: 330, badge: "Seedream 5.0", format: "sale", images: [`${A}/usecase-florist.jpg`, `${A}/photo-8.jpg`] },
  { id: "uc-ramen", title: "Ramen voiceover", category: "Food & Drink", cover: `${A}/usecase-ramen.jpg`, tall: true, mode: "audio", model: "seed-audio", attachments: [], prompt: "A warm, friendly 30s voiceover for our ramen shop with a light upbeat music bed.", made: 420, tags: ["new"], badge: "Seed Audio", format: "ugc" },
  // 广告玩法示例(2026-10-21 补，覆盖 UGC / 开箱 / 前后对比)
  { id: "uc-testimonial", title: "Customer review ad", category: "Beauty", cover: `${A}/usecase-review.jpg`, tall: true, mode: "agent", attachments: [`${A}/usecase-review.jpg`], prompt: "Make a 15s UGC-style review ad: a woman holds our perfume and tells the camera why she loves it, natural and friendly, ends with our brand name.", made: 2110, tags: ["trending"], badge: "AI Avatar", format: "ugc" },
  { id: "uc-unboxing", title: "Coffee bean unboxing", category: "Food & Drink", cover: `${A}/photo-6.jpg`, tall: false, mode: "video", model: "seedance-2-5", attachments: [`${A}/photo-6.jpg`], prompt: "Hands unbox our coffee bean pouch on a wooden table, beans pour out, close-up of the label. 8 seconds, cozy morning light.", made: 930, tags: ["new"], badge: "Seedance 2.5", format: "unboxing" },
  { id: "uc-makeover", title: "Café makeover: before & after", category: "Food & Drink", cover: `${A}/photo-4.jpg`, tall: true, mode: "agent", attachments: [`${A}/photo-4.jpg`], prompt: "Make a 15s before-and-after ad for our café renovation: empty old space first, then the new bright café with customers. End with “Now open”.", made: 760, tags: ["new"], badge: "AI Agent", format: "before-after" },
  { id: "uc-friends-ugc", title: "Friends' café review", category: "Food & Drink", cover: `${A}/photo-7.jpg`, tall: false, mode: "agent", attachments: [`${A}/photo-7.jpg`], prompt: "A 15s UGC-style clip of two friends trying our drinks and reacting, handheld phone feel, ends with our café name.", made: 1180, tags: ["trending"], badge: "AI Avatar", format: "ugc" },
  // 节日专题(运营配置):Halloween,10 月下旬上线
  { id: "uc-halloween", title: "Halloween sale promo", category: "Retail", cover: `${A}/usecase-halloween.jpg`, tall: true, mode: "agent", attachments: [], prompt: "Make a 15s Halloween promo for our shop: glowing pumpkins, spooky music, and end with “Spooky Sale – 30% off this week”.", made: 1620, tags: ["halloween", "trending", "new"], badge: "AI Agent", format: "sale" },
  { id: "uc-halloween-treats", title: "Spooky treats post", category: "Food & Drink", cover: `${A}/usecase-halloween-sale.jpg`, tall: false, mode: "image", model: "seedream-5", attachments: [], prompt: "Three Halloween Instagram posts for our cafe’s pumpkin treats, dark purple background with glowing jack-o’-lanterns.", made: 680, tags: ["halloween", "new"], badge: "Seedream 5.0", format: "showcase", images: [`${A}/usecase-halloween-sale.jpg`, `${A}/usecase-halloween.jpg`] },
];

/**
 * 创作页空状态的热门玩法轮播(2026-10-21 定，参照 Higgsfield 的热门 preset 卡 + 即梦的高低错落轮播)。
 * tag = 卡片左上角的运营标签;点中间那张 → 把这个 Use Case 的提示词、模式、参考图填进输入框(不跳页)。真实 APP 由运营后台配置
 */
export type CreatePick = { id: string; tag: "Trending" | "New" | "Top" };
export const CREATE_PICKS: CreatePick[] = [
  { id: "uc-latte", tag: "Trending" },
  { id: "uc-halloween", tag: "New" },
  { id: "uc-skincare", tag: "Top" },
  { id: "uc-testimonial", tag: "Trending" },
  { id: "uc-unboxing", tag: "New" },
  { id: "uc-makeover", tag: "Top" },
];
/** 轮播下面的一句话提示词:点了直接填进输入框(Agent 模式) */
export const CREATE_PROMPTS = ["Make a 15s ad for my scented candles", "Turn my menu photo into a weekend promo video"];

export type Banner = {
  id: string;
  kicker: string;
  title: string;
  subtitle: string;
  image: string;
  /** 视频 Banner(2026-10-21):有就播视频，image 当封面;文字照常叠在底部 */
  video?: string;
  action: { type: "useCase"; id: string } | { type: "create"; mode: Mode };
};

export const BANNERS: Banner[] = [
  { id: "b-nano-banana", kicker: "New model", title: "Nano Banana 2.1 is here", subtitle: "Sharper product images in seconds", image: `${A}/banner-v1.jpg`, video: "https://assets.presslogic.com/buzzvideo/public/2026-10-10/367214924906160128.mp4", action: { type: "create", mode: "image" } },
  { id: "b-minimax", kicker: "New model", title: "MiniMax H3 Max is here", subtitle: "Smoother, more cinematic motion", image: `${A}/banner-v2.jpg`, video: "https://assets.presslogic.com/buzzvideo/public/2026-09-11/356665064461230080.mp4", action: { type: "create", mode: "video" } },
  // 原片是 HEVC .mov(Chrome 不一定能播),转成 H.264 mp4 放本地
  { id: "b-seedance", kicker: "New model", title: "Seedance 2.5 now in 1080p", subtitle: "Full-HD video ads, ready to post", image: `${A}/banner-v3.jpg`, video: `${A}/banner-seedance25.mp4`, action: { type: "create", mode: "video" } },
];

export type RecentPhoto = { id: string; uri: string; kind: "photo" | "video"; duration?: string };
export const RECENT_PHOTOS: RecentPhoto[] = [
  { id: "rp-2", uri: `${A}/photo-2.jpg`, kind: "photo" },
  { id: "rp-3", uri: `${A}/photo-3.jpg`, kind: "video", duration: "0:12" },
  { id: "rp-1", uri: `${A}/photo-1.jpg`, kind: "photo" },
  { id: "rp-8", uri: `${A}/photo-8.jpg`, kind: "photo" },
  { id: "rp-4", uri: `${A}/photo-4.jpg`, kind: "photo" },
  { id: "rp-7", uri: `${A}/photo-7.jpg`, kind: "video", duration: "0:08" },
  { id: "rp-5", uri: `${A}/photo-5.jpg`, kind: "photo" },
  { id: "rp-6", uri: `${A}/photo-6.jpg`, kind: "photo" },
];

export type LibraryAsset = { id: string; uri: string; kind: "photo" | "video"; label: string; modifiedAt: number };
/** 素材库里网页版传过的素材 */
export const LIBRARY_ASSETS: LibraryAsset[] = [
  { id: "la-1", uri: `${A}/usecase-bakery.jpg`, kind: "photo", label: "Bakery hero", modifiedAt: 2 },
  { id: "la-2", uri: `${A}/usecase-latte.jpg`, kind: "photo", label: "Latte key visual", modifiedAt: 3 },
  { id: "la-3", uri: `${A}/usecase-opening.jpg`, kind: "photo", label: "Shop front", modifiedAt: 4 },
  { id: "la-4", uri: `${A}/usecase-florist.jpg`, kind: "photo", label: "Bouquet shoot", modifiedAt: 1 },
  { id: "la-5", uri: `${A}/usecase-skincare.jpg`, kind: "video", label: "Serum b-roll", modifiedAt: 5 },
  { id: "la-6", uri: `${A}/usecase-ramen.jpg`, kind: "photo", label: "Ramen close-up", modifiedAt: 6 },
];

export const PDF_ATTACHMENT = { uri: "", kind: "pdf" as const, label: "Brand guidelines.pdf" };

export type Plan = { text: string; pills: string[] };

/** 各模式的通用方案;Agent 命中关键词时改用 RESULT_RULES 里那组的分镜(见 planFor) */
export const PLANS: Record<Mode, Plan> = {
  agent: { text: "Three beats, 15 seconds, cut vertical for Reels and TikTok.", pills: ["Hook: product close-up", "Scene: your shop in use", "CTA: your offer"] },
  image: { text: "A clean product shot, ready for your feed.", pills: ["Product hero", "Warm daylight", "Clean background"] },
  video: { text: "One continuous shot with synced sound.", pills: ["Slow push-in", "Golden-hour light", "8 seconds"] },
  audio: { text: "Made to sound like your shop, not a stock ad.", pills: ["Friendly voiceover", "Upbeat music bed", "30 seconds"] },
  hybrid: { text: "Your real clips up front, AI shots to fill the gaps, cut to the beat.", pills: ["Hook: your best real clip", "AI shots: product close-ups", "CTA: your offer"] },
};

/** 一份生成结果：图片只有 cover,视频多一个 video */
export type Output = { cover: string; video?: string };
export const RESULTS: Record<Mode, Output> = {
  agent: { cover: `${A}/result-agent.jpg`, video: `${A}/result-agent.mp4` },
  image: { cover: `${A}/result-image.jpg` },
  video: { cover: `${A}/result-video.jpg`, video: `${A}/result-video.mp4` },
  audio: { cover: `${A}/result-audio.jpg` },
  hybrid: { cover: `${A}/result-agent.jpg`, video: `${A}/result-agent.mp4` },
};

/** 一次生成多份时补齐用的示例素材(原型用;按类型挑，详情页左右滑能看到不同的几份) */
export const EXTRA_OUTPUTS: Record<Mode, Output[]> = {
  image: [{ cover: `${A}/usecase-latte.jpg` }, { cover: `${A}/usecase-opening.jpg` }, { cover: `${A}/usecase-bakery.jpg` }],
  video: [{ cover: `${A}/result-agent.jpg`, video: `${A}/result-agent.mp4` }, { cover: `${A}/result-video.jpg`, video: `${A}/result-video.mp4` }],
  agent: [{ cover: `${A}/result-video.jpg`, video: `${A}/result-video.mp4` }, { cover: `${A}/result-agent.jpg`, video: `${A}/result-agent.mp4` }],
  hybrid: [{ cover: `${A}/result-video.jpg`, video: `${A}/result-video.mp4` }],
  audio: [{ cover: `${A}/result-audio.jpg` }],
};

/** 关键词 → 贴题素材 + AI 起的作品标题(真实 APP 由 Agent 生成标题) */
const RESULT_RULES: { re: RegExp; title: string; cover: string; video?: string; plan: Plan }[] = [
  {
    re: /latte|coffee|café|cafe|espresso/i, title: "Iced Latte Summer Pour", cover: `${A}/result-agent.jpg`, video: `${A}/result-agent.mp4`,
    plan: { text: "Open on the pour, 15 seconds, cut vertical for Reels and TikTok.", pills: ["Hook: ice pour close-up", "Scene: morning café", "CTA: 20% off today"] },
  },
  {
    re: /serum|skincare|skin|beauty|glow/i, title: "Glow Serum Reveal", cover: `${A}/result-video.jpg`, video: `${A}/result-video.mp4`,
    plan: { text: "Let the texture sell it: slow, close and glossy, 15 seconds.", pills: ["Hook: a drop hits the glass", "Scene: dewy skin at the mirror", "CTA: shop the launch"] },
  },
  {
    re: /bakery|croissant|pastry|pastries|bread/i, title: "Morning Croissant Reel", cover: `${A}/usecase-bakery.jpg`,
    plan: { text: "Warm and slow, like the first hour of the day.", pills: ["Hook: steam off fresh croissants", "Scene: sunrise at the counter", "CTA: opening hours"] },
  },
  {
    re: /sneaker|shoe|streetwear/i, title: "Sneaker Drop Teaser", cover: `${A}/usecase-sneaker.jpg`,
    plan: { text: "Fast cuts on the beat, hold the reveal to the end.", pills: ["Hook: laces snap tight", "Scene: dusk on the street", "CTA: drop date"] },
  },
  {
    re: /lip|lipstick|tint|makeup/i, title: "Lip Tint Swatch Set", cover: `${A}/usecase-lipstick.jpg`,
    plan: { text: "Shade by shade, so people can pick theirs.", pills: ["Hook: one swipe, full color", "Scene: four shades on skin", "CTA: find your shade"] },
  },
  {
    re: /flower|florist|bouquet|peony/i, title: "Mother’s Day Bouquets", cover: `${A}/usecase-florist.jpg`,
    plan: { text: "Soft light, real hands, a gift worth ordering early.", pills: ["Hook: peonies opening", "Scene: wrapping at the bench", "CTA: order by Friday"] },
  },
  {
    re: /ramen|noodle|restaurant/i, title: "Late-Night Ramen Voiceover", cover: `${A}/usecase-ramen.jpg`,
    plan: { text: "Steam, sound and a full bowl. 15 seconds that make people hungry.", pills: ["Hook: noodles lifted high", "Scene: the late-night counter", "CTA: open till 2am"] },
  },
  {
    re: /opening|shop|store|boutique/i, title: "Grand Opening Weekend", cover: `${A}/usecase-opening.jpg`,
    plan: { text: "Make it feel like an event people shouldn’t miss.", pills: ["Hook: doors swing open", "Scene: first guests inside", "CTA: this Saturday"] },
  },
];

export type ResultMatch = { cover: string; video?: string; title?: string };

/** 按提示词关键词挑一个贴题的结果素材和标题;没命中就用该模式的默认结果、不带标题 */
export function resultFor(mode: Mode, text: string): ResultMatch {
  const hit = RESULT_RULES.find((r) => r.re.test(text));
  const titled = <T extends object>(x: T) => (hit ? { ...x, title: hit.title } : x);
  // 音频永远用音频封面,但标题照样贴题
  if (mode === "audio") return titled({ cover: RESULTS.audio.cover });
  const base = hit ? { cover: hit.cover, video: hit.video } : RESULTS[mode];
  if (mode === "image" || !base.video) return titled({ cover: base.cover });
  return titled({ cover: base.cover, video: base.video });
}

/** 方案文案 + 三个分镜 beat:Agent 模式按提示词关键词挑同一组的分镜,没命中或非 Agent 用该模式的通用方案 */
export function planFor(mode: Mode, text: string): Plan {
  if (mode !== "agent") return PLANS[mode];
  return RESULT_RULES.find((r) => r.re.test(text))?.plan ?? PLANS.agent;
}

/** 组织里其他成员的作品/素材(只在组织工作区的 Team Assets 里出现),复用已有封面 */
export type TeamAsset = {
  id: string;
  title: string;
  author: string;
  source: "ai" | "upload";
  type: "image" | "video" | "audio" | "doc";
  cover: string;
  video?: string;
  modifiedAt: number;
};
export const TEAM_ASSETS: TeamAsset[] = [
  { id: "ta-1", title: "Spring menu teaser", author: "Jamie Lee", source: "ai", type: "video", cover: `${A}/usecase-ramen.jpg`, video: RESULTS.video.video, modifiedAt: 40 },
  { id: "ta-2", title: "Store front poster", author: "Sam Patel", source: "ai", type: "image", cover: `${A}/usecase-opening.jpg`, modifiedAt: 30 },
  { id: "ta-3", title: "Brand guidelines.pdf", author: "Jamie Lee", source: "upload", type: "doc", cover: "", modifiedAt: 25 },
  { id: "ta-4", title: "Bouquet b-roll", author: "Mia Wong", source: "upload", type: "video", cover: `${A}/usecase-florist.jpg`, modifiedAt: 20 },
  { id: "ta-5", title: "Radio spot", author: "Sam Patel", source: "ai", type: "audio", cover: RESULTS.audio.cover, modifiedAt: 10 },
];

/** 演示用:一开始就收藏了几项,Favorites 筛选一进来就有内容 */
export const SEED_FAVORITES = ["j-latte", "la-2", "ta-1"];

export const SEED_SESSIONS: Session[] = [
  { id: "s-latte", title: "Summer latte promo", updatedAt: 3, pinned: false, workspace: "personal" },
  { id: "s-serum", title: "Glow serum launch", updatedAt: 2, pinned: false, workspace: "personal" },
  { id: "s-opening", title: "Causeway Bay opening", updatedAt: 1, pinned: false, workspace: "presslogic" },
];

export const SEED_JOBS: Job[] = [
  { id: "j-latte", title: "Summer latte promo", prompt: "Make a 15s vertical ad for our new iced latte using these photos", mode: "agent", model: null, status: "done", elapsedMs: 8000, cover: RESULTS.agent.cover, video: RESULTS.agent.video, outputs: [RESULTS.agent, RESULTS.video], workspace: "personal", sessionId: "s-latte", modifiedAt: 50 },
  { id: "j-serum", title: "Glow serum launch", prompt: "A glass serum bottle on wet stone, slow orbit, soft peach light", mode: "video", model: "seedance-2", status: "failed", elapsedMs: 3000, cover: RESULTS.video.cover, video: RESULTS.video.video, workspace: "personal", sessionId: "s-serum", modifiedAt: 45 },
  { id: "j-opening", title: "Causeway Bay opening", prompt: "Three posters for our Causeway Bay shop opening", mode: "image", model: "seedream-5", status: "done", elapsedMs: 8000, cover: RESULTS.image.cover, outputs: [RESULTS.image, { cover: `${A}/usecase-opening.jpg` }, { cover: `${A}/banner-v1.jpg` }], workspace: "presslogic", sessionId: "s-opening", modifiedAt: 35 },
  { id: "j-jingle", title: "Shop jingle", prompt: "A 30s upbeat voiceover and music bed for our shop", mode: "audio", model: null, status: "done", elapsedMs: 8000, cover: RESULTS.audio.cover, workspace: "personal", sessionId: "s-latte", modifiedAt: 12 },
];

export const SEED_MESSAGES: Record<string, Message[]> = {
  "s-latte": [
    { id: "s-latte-u", role: "user", text: "Make a 15s vertical ad for our new iced latte using these photos", attachments: [{ id: "s-latte-a1", uri: `${A}/photo-2.jpg`, kind: "photo" }, { id: "s-latte-a2", uri: `${A}/photo-3.jpg`, kind: "video" }] },
    { id: "s-latte-p", role: "agent", kind: "plan", ...planFor("agent", "iced latte") },
    { id: "s-latte-j", role: "agent", kind: "job", jobId: "j-latte" },
  ],
  "s-serum": [
    { id: "s-serum-u", role: "user", text: "A glass serum bottle on wet stone, slow orbit, soft peach light", attachments: [] },
    { id: "s-serum-p", role: "agent", kind: "plan", text: PLANS.video.text, pills: PLANS.video.pills },
    { id: "s-serum-j", role: "agent", kind: "job", jobId: "j-serum" },
  ],
  "s-opening": [
    { id: "s-opening-u", role: "user", text: "Three posters for our Causeway Bay shop opening", attachments: [] },
    { id: "s-opening-p", role: "agent", kind: "plan", text: PLANS.image.text, pills: PLANS.image.pills },
    { id: "s-opening-j", role: "agent", kind: "job", jobId: "j-opening" },
  ],
};

/**
 * 预设音色(2026-10-23,和网页版 Select or add a voice 一致)。tint = 头像底色(原型里用首字母 + 色块，真实 APP 用每个音色的头像图)
 * bars = 试听条的波形高度(固定一组，看起来像一段人声)
 */
export type Voice = { id: string; name: string; gender: "Female" | "Male"; style: "Social Media" | "Professional" | "Narrative" | "ASMR" | "Upbeat"; language: "English" | "Spanish" | "Chinese"; tint: string };
export const VOICES: Voice[] = [
  { id: "v-charlotte", name: "Charlotte", gender: "Female", style: "Social Media", language: "English", tint: "#ff6b8a" },
  { id: "v-eleanor", name: "Eleanor", gender: "Female", style: "Professional", language: "English", tint: "#4da3ff" },
  { id: "v-maeve", name: "Maeve", gender: "Female", style: "Narrative", language: "English", tint: "#ff9f43" },
  { id: "v-fiona", name: "Fiona", gender: "Female", style: "Narrative", language: "English", tint: "#a78bfa" },
  { id: "v-gemma", name: "Gemma", gender: "Female", style: "Social Media", language: "English", tint: "#34d399" },
  { id: "v-willow", name: "Willow", gender: "Female", style: "ASMR", language: "English", tint: "#f472b6" },
  { id: "v-marcus", name: "Marcus", gender: "Male", style: "Professional", language: "English", tint: "#60a5fa" },
  { id: "v-leo", name: "Leo", gender: "Male", style: "Upbeat", language: "English", tint: "#fbbf24" },
  { id: "v-diego", name: "Diego", gender: "Male", style: "Social Media", language: "Spanish", tint: "#f97316" },
  { id: "v-lucia", name: "Lucía", gender: "Female", style: "Upbeat", language: "Spanish", tint: "#fb7185" },
  { id: "v-mei", name: "Mei", gender: "Female", style: "Narrative", language: "Chinese", tint: "#22d3ee" },
  { id: "v-hao", name: "Hao", gender: "Male", style: "Professional", language: "Chinese", tint: "#818cf8" },
];
export const VOICE_BARS = [0.35, 0.6, 0.45, 0.8, 0.55, 0.9, 0.4, 0.7, 0.5, 0.85, 0.45, 0.65, 0.35, 0.75, 0.5, 0.6];
