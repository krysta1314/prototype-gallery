// Pricing configuration — single source of truth.
// Modify here to change prices, plans, models, copy. Components read this only.

export type PlanId = 'free' | 'starter' | 'pro' | 'ultra';
export type PaidPlanId = Exclude<PlanId, 'free'>;
export type Scale = 1 | 2 | 4;
export type BillingCycle = 'monthly' | 'yearly';

// Simplified to 3 tiers per feedback — only Ultra uses the slider now (Starter / Pro are fixed-price).
export const SCALES: readonly Scale[] = [1, 2, 4] as const;

/**
 * Bulk discount applied to base price when scaling up.
 * Cycle-specific:monthly 和 yearly 用不同折扣率,以让 chip(= 1 - display/reference)显示符合营销 target。
 *
 * Monthly bulk = chip 直接显示数字(2× = 33% off,4× = 40% off)
 * Yearly bulk = chip 显示"叠加 yearly 30% 后的总折扣"
 *   - Ultra 2× yearly: $62.30 × 2 × 0.857 = $107 → vs monthly raw $178 = 40% off chip
 *   - Ultra 4× yearly: $62.30 × 4 × 0.714 = $178 → vs monthly raw $356 = 50% off chip
 */
export const SCALE_DISCOUNTS: Record<BillingCycle, Record<Scale, number>> = {
  monthly: { 1: 0, 2: 0.33,  4: 0.40  },
  yearly:  { 1: 0, 2: 0.143, 4: 0.286 },
};

export interface PlanCopy {
  id: PlanId;
  name: string;
  tagline: string;
  cta: string;
  badge?: { label: string; variant: 'popular' | 'violet' };
}

export interface PaidPlanData extends PlanCopy {
  id: PaidPlanId;
  baseMonthlyPrice: number;
  baseYearlyMonthlyPrice: number;
  baseYearlyAnnualTotal: number;
  baseMonthlyCredits: number;
  /** Image model id for credits sub-example */
  exampleImageModel: ModelId;
  /** Video model id for credits sub-example */
  exampleVideoModel: ModelId;
}

export interface FreePlanData extends PlanCopy {
  id: 'free';
  oneTimeCredits: number;
  exampleSub: string;
}

// Mock subscription data — for role-preview prototype. Real app reads from /api/billing.
// Starter intentionally mocked as monthly to demo yearly cross-sell in upgrade modal.
export const FAKE_SUBSCRIPTION = {
  starter: { nextChargeDate: 'May 28, 2026', nextChargeAmount: '$19/mo',  cycle: 'monthly' as const, currentScale: 1 as Scale },
  pro:     { nextChargeDate: 'May 28, 2026', nextChargeAmount: '$35/mo',  cycle: 'yearly'  as const, currentScale: 1 as Scale },
  ultra:   { nextChargeDate: 'May 28, 2026', nextChargeAmount: '$63/mo',  cycle: 'yearly'  as const, currentScale: 1 as Scale },
} satisfies Record<PaidPlanId, { nextChargeDate: string; nextChargeAmount: string; cycle: 'monthly' | 'yearly'; currentScale: Scale }>;

export const FREE_PLAN: FreePlanData = {
  id: 'free',
  name: 'Free',
  tagline: 'For creators making their first AI image ad',
  cta: 'Start for Free',
  oneTimeCredits: 500,
  exampleSub: '≈ 27 Seedream 5.0 Lite images',
};

export const PAID_PLANS: Record<PaidPlanId, PaidPlanData> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    tagline: 'For your first AI-powered ad campaigns',
    cta: 'Get Starter',
    baseMonthlyPrice: 19,
    baseYearlyMonthlyPrice: 13.3,
    baseYearlyAnnualTotal: 159.6,
    baseMonthlyCredits: 1900,
    exampleImageModel: 'gpt-image-2',
    exampleVideoModel: 'seedance-2',
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    tagline: 'For creators shipping ads every week',
    cta: 'Get Pro',
    badge: { label: 'Most Popular', variant: 'popular' },
    baseMonthlyPrice: 49,
    baseYearlyMonthlyPrice: 34.3,
    baseYearlyAnnualTotal: 411.6,
    baseMonthlyCredits: 4900,
    exampleImageModel: 'gpt-image-2',
    exampleVideoModel: 'seedance-2',
  },
  ultra: {
    id: 'ultra',
    name: 'Ultra',
    tagline: 'For creators producing at the highest volume',
    cta: 'Get Ultra',
    baseMonthlyPrice: 89,
    baseYearlyMonthlyPrice: 62.3,
    baseYearlyAnnualTotal: 747.6,
    baseMonthlyCredits: 8900,
    exampleImageModel: 'gpt-image-2',
    exampleVideoModel: 'seedance-2',
  },
};

export const PLAN_ORDER: PlanId[] = ['free', 'starter', 'pro', 'ultra'];
export const PAID_PLAN_ORDER: PaidPlanId[] = ['starter', 'pro', 'ultra'];

// =========== Models for Compare Features table ===========

export type ModelId =
  | 'seedream-4-5' | 'seedream-5-lite' | 'seedream-5-pro' | 'nano-banana' | 'nano-banana-2'
  | 'nano-banana-2-lite'
  | 'nano-banana-pro' | 'gpt-image-2'
  | 'veo-3-1' | 'veo-3-1-fast' | 'seedance-1-5-pro'
  | 'seedance-2' | 'seedance-2-fast' | 'seedance-2-mini' | 'seedance-2-5' | 'kling-3'
  | 'gemini-omni-flash';

export type ModelCategory = 'image' | 'video';

export interface Model {
  id: ModelId;
  name: string;
  category: ModelCategory;
  /** Representative SKU description, e.g. "480p · 10s" */
  sku: string;
  /** Credits per generation */
  pricePerUnit: number;
  /** Free plan availability */
  freeAccess: boolean;
  /** Unit label, e.g. "image" or "video" */
  unitLabel: 'image' | 'video';
}

// New credits formula (per Pricing Admin): credits = ceil(costUsd × 1.80 × 100)
// where 1.80 = 1 + markup (markup = 0.80). Previously was × 5.0.
export const MODELS: readonly Model[] = [
  // Image
  { id: 'seedream-4-5',    name: 'Seedream 4.5',      category: 'image', sku: 'standard',         pricePerUnit: 8,    freeAccess: true,  unitLabel: 'image' },
  { id: 'seedream-5-lite', name: 'Seedream 5.0 Lite', category: 'image', sku: 'standard',         pricePerUnit: 7,    freeAccess: true,  unitLabel: 'image' },
  // 占位单价，待产品确认真实成本
  { id: 'seedream-5-pro',  name: 'Seedream 5.0 Pro',  category: 'image', sku: 'high-res',         pricePerUnit: 18,   freeAccess: false, unitLabel: 'image' },
  { id: 'nano-banana',     name: 'Nano Banana',       category: 'image', sku: 'standard',         pricePerUnit: 8,    freeAccess: false, unitLabel: 'image' },
  { id: 'nano-banana-2',   name: 'Nano Banana 2',     category: 'image', sku: 'high-res',         pricePerUnit: 13,   freeAccess: false, unitLabel: 'image' },
  { id: 'nano-banana-2-lite', name: 'Nano Banana 2 Lite', category: 'image', sku: 'standard',    pricePerUnit: 7,    freeAccess: false, unitLabel: 'image' },
  { id: 'nano-banana-pro', name: 'Nano Banana Pro',   category: 'image', sku: 'high-res',         pricePerUnit: 25,   freeAccess: false, unitLabel: 'image' },
  { id: 'gpt-image-2',     name: 'GPT Image 2',       category: 'image', sku: 'social-ready',     pricePerUnit: 3,    freeAccess: false, unitLabel: 'image' },
  // Video
  { id: 'veo-3-1',         name: 'Veo 3.1',           category: 'video', sku: 'HD · 8s video',     pricePerUnit: 576,  freeAccess: false, unitLabel: 'video' },
  { id: 'veo-3-1-fast',    name: 'Veo 3.1 Fast',      category: 'video', sku: 'HD · 8s video',     pricePerUnit: 144,  freeAccess: false, unitLabel: 'video' },
  { id: 'seedance-1-5-pro',name: 'Seedance 1.5 Pro',  category: 'video', sku: 'SD · 10s video',    pricePerUnit: 21,   freeAccess: false, unitLabel: 'video' },
  { id: 'seedance-2',      name: 'Seedance 2.0',      category: 'video', sku: 'HD · 10s video',    pricePerUnit: 260,  freeAccess: false, unitLabel: 'video' },
  { id: 'seedance-2-fast', name: 'Seedance 2.0 Fast', category: 'video', sku: 'SD · 10s video',    pricePerUnit: 98,   freeAccess: false, unitLabel: 'video' },
  // 占位单价，待产品确认真实成本
  { id: 'seedance-2-mini', name: 'Seedance 2.0 Mini', category: 'video', sku: 'SD · 10s video',    pricePerUnit: 60,   freeAccess: false, unitLabel: 'video' },
  { id: 'seedance-2-5',    name: 'Seedance 2.5',      category: 'video', sku: 'HD · 10s video',    pricePerUnit: 320,  freeAccess: false, unitLabel: 'video' },
  { id: 'kling-3',         name: 'Kling 3.0',         category: 'video', sku: '5s video',          pricePerUnit: 63,   freeAccess: false, unitLabel: 'video' },
  { id: 'gemini-omni-flash', name: 'Gemini Omni Flash', category: 'video', sku: '720p · 10s video', pricePerUnit: 183, freeAccess: false, unitLabel: 'video' },
] as const;

export const MODEL_BY_ID: Record<ModelId, Model> = Object.fromEntries(
  MODELS.map(m => [m.id, m]),
) as Record<ModelId, Model>;

// =========== "Not sure which plan" guide ===========

export interface GuideEntry {
  id: PlanId | 'enterprise';
  name: string;
  tagline: string;
  suitableFor: string[];
  coreFeatures: string[];
}

export const GUIDE: GuideEntry[] = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'For your first AI-powered ad campaigns',
    suitableFor: [
      'Independent sellers and Shopify store owners',
      'DTC founders just getting started',
      'Solo creators testing AI ads before scaling spend',
    ],
    coreFeatures: [
      'Marketing Agent for ad ideas and copy',
      'Image & video ad generation',
      'All premium models except Seedance 2.0',
      'Watermark-free videos',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'For creators shipping ads every week',
    suitableFor: [
      'DTC brands shipping ads every week',
      'Freelance marketers serving multiple clients',
      'Creators running consistent A/B testing across SKUs',
    ],
    coreFeatures: [
      'Marketing Agent for full campaign workflows',
      'Full access to all premium models (incl. Seedance 2.0)',
      'Character Customization (Seedance 2.0)',
      'Unlimited AI Avatars',
    ],
  },
  {
    id: 'ultra',
    name: 'Ultra',
    tagline: 'For creators producing at the highest volume',
    suitableFor: [
      'Solo creators whose output outgrew Pro',
      'Freelancers running many client campaigns at once',
      'Anyone needing long-form video and realistic characters',
    ],
    coreFeatures: [
      'Full access to all premium models',
      'Long Video Generation (Early Access)',
      'Highest credit allowance for high-volume production',
      'Priority processing',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'For large brands and multinational companies',
    suitableFor: [
      'Large brands and multinational companies',
      'Teams requiring SOC 2 / SLA / compliance',
      'Organizations integrating Buzz into existing tools via API',
    ],
    coreFeatures: [
      'Custom credits allocation',
      'Dedicated model capacity',
      'Dedicated account manager + SLA',
      'API access and team training',
    ],
  },
];

// =========== Enterprise banner items ===========

export const ENTERPRISE_BENEFITS = [
  'Team training and onboarding',
  'SLA and dedicated account manager',
  'Custom credits allocation',
  'Dedicated model capacity',
  'Access to all models',
  'Priority queue for faster task processing',
  'API Access',
];

// =========== FAQ ===========

export interface FaqItem {
  question: string;
  /** React-friendly answer node (use plain strings or simple JSX in the consumer) */
  answer: () => React.ReactNode;
}

// (Answers live in src/components/sections/Faq.tsx to keep JSX in components)
export const FAQ_QUESTIONS = [
  'What are credits and how do they work?',
  'Is yearly billing worth it?',
  'What happens if I run out of credits?',
  'Can I get more credits on Ultra?',
  'Can I cancel anytime? Am I locked in?',
  'Which AI models are included with my plan?',
  'Which models should I use — Standard or Premium Cinematic?',
  'What are AI Avatars?',
  'What is Long Video Generation (Early Access)?',
  'Can I upgrade or downgrade my plan?',
  'Do you offer refunds?',
  'Can I use BuzzVideo-generated content commercially?',
  'Who owns the content I generate? Can I use it for client work?',
  'Is my data and prompts private? Will they be used to train AI?',
  'Do you have an API?',
  'Can I share my plan with my team?',
] as const;

// =========== Upgrade deltas (used by UpgradeDeltaCallout + UpgradePreviewModal) ===========
// Credits 数字 = PAID_PLANS[to].baseMonthlyCredits - PAID_PLANS[from].baseMonthlyCredits
// 调价后需手动同步这里
export const UPGRADE_DELTAS: Record<string, { credits: number; unlocks: string[] }> = {
  'starter-pro':   { credits: 3000, unlocks: ['Seedance 2.0 access', 'Technical Support'] },
  'starter-ultra': { credits: 7000, unlocks: ['Seedance 2.0 access', 'Long Video Generation', 'Priority processing', 'Technical Support'] },
  'pro-ultra':     { credits: 4000, unlocks: ['Long Video Generation (Early Access)', 'Priority processing'] },
};
