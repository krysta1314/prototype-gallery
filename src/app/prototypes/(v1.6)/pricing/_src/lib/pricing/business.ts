// Business plans (v1.5) — Team / Scale / Enterprise.
// Individual plans stay in pricing.ts and are untouched.

export type BusinessPlanId = 'team' | 'scale' | 'enterprise';
export type PlanGroup = 'individual' | 'business';

export interface SeatRange {
  min: number;
  max: number;
  default: number;
}

interface BusinessPlanBase {
  id: BusinessPlanId;
  name: string;
  tagline: string;
  badge?: { label: string; variant: 'popular' | 'violet' };
  cta: string;
  ctaSubtext?: string;
  features: string[];
}

export interface SeatBusinessPlan extends BusinessPlanBase {
  pricingModel: 'per-seat';
  seats: SeatRange;
  /**
   * Charged per seat / month on monthly billing.
   * 这就是定价 —— 不再有 listMonthlyPrice 划线原价与 monthlyDiscount。
   * 永久挂原价在英 / 欧 / 澳是监管重点执法对象，且它让年付激励看起来只剩 8–13%。
   */
  monthlyPrice: number;
  /** Discount applied on annual billing */
  annualDiscount: number;
  /** Charged per seat / month on annual billing */
  annualMonthlyPrice: number;
  /** Credits granted per seat, per month */
  creditsPerSeatMonth: number;
  /** 额度归属口径 —— Team / Scale 每席固定归本人,不汇成池 */
  creditPool: string;
  creditScaling: string;
}

export interface CustomBusinessPlan extends BusinessPlanBase {
  pricingModel: 'custom';
  priceLabel: string;
  seatsLabel: string;
  creditsLabel: string;
  creditPool: string;
}

export type BusinessPlan = SeatBusinessPlan | CustomBusinessPlan;

export const BUSINESS_PLANS: Record<BusinessPlanId, BusinessPlan> = {
  team: {
    id: 'team',
    name: 'Team',
    tagline: 'For agencies and small teams to create faster',
    pricingModel: 'per-seat',
    seats: { min: 2, max: 9, default: 5 },
    // Team 席位 = Ultra 同价同额度，多出来的是共享池 + 管理后台，不加价。
    // 毛利与 Ultra 齐平（62.8%），也不再是全线最贵的 credit（原 $69 / 6,900 是 $0.0081）。
    monthlyPrice: 89,
    annualDiscount: 0.30,
    annualMonthlyPrice: 63,
    creditsPerSeatMonth: 8900,
    creditPool: 'Fixed per seat',
    creditScaling: 'Add seats or buy a top-up',
    cta: 'Get Team plan',
    features: [
      'Everything in Ultra',
      '8,900 credits per seat each month — fixed, no reallocation',
      'Shared brand kits, assets and templates',
      'Team workspace with member roles',
      'One centralized invoice',
    ],
  },
  scale: {
    id: 'scale',
    name: 'Scale',
    tagline: 'Designed for growing creative teams',
    badge: { label: 'Most Popular', variant: 'violet' },
    pricingModel: 'per-seat',
    seats: { min: 5, max: 30, default: 10 },
    monthlyPrice: 169,
    annualDiscount: 0.30,
    annualMonthlyPrice: 119,
    creditsPerSeatMonth: 16900,
    creditPool: 'Fixed per seat',
    creditScaling: 'Add seats or buy a top-up',
    cta: 'Get Scale plan',
    features: [
      'Everything in Team',
      'Priority processing queue',
      'Advanced roles and permissions',
      'Per-member usage analytics',
      'Priority technical support',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'For large organizations with custom volume',
    pricingModel: 'custom',
    priceLabel: "Let's talk",
    seatsLabel: 'Custom',
    creditsLabel: 'Custom credits',
    creditPool: 'Shared pool, allocated per member',
    cta: 'Contact Sales',
    features: [
      'Everything in Scale',
      'Shared credit pool, allocated per member',
      'Dedicated model capacity',
      'SSO, SLA and security review',
      'Dedicated account manager + API access',
    ],
  },
};

export const BUSINESS_PLAN_ORDER: BusinessPlanId[] = ['team', 'scale', 'enterprise'];

// =========== "Not sure which business plan" guide ===========

export interface BusinessGuideEntry {
  id: BusinessPlanId;
  name: string;
  tagline: string;
  suitableFor: string[];
  coreFeatures: string[];
}

export const BUSINESS_GUIDE: BusinessGuideEntry[] = [
  {
    id: 'team',
    name: 'Team',
    tagline: 'For agencies and small teams to create faster',
    suitableFor: [
      'In-house marketing teams of 2 to 9 people',
      'Small agencies producing for a handful of brands',
      'Founders who just hired their first marketer or designer',
    ],
    coreFeatures: [
      'Everything in Ultra, for every seat — at the same price',
      '8,900 credits per seat each month — fixed, not shared',
      'Shared brand kits, assets and templates',
      'Role and permission management, one invoice',
    ],
  },
  {
    id: 'scale',
    name: 'Scale',
    tagline: 'Designed for growing creative teams',
    suitableFor: [
      'Creative teams of 5 to 30 shipping ads every week',
      'Agencies running many brands in parallel',
      'Teams that need per-member usage visibility and controls',
    ],
    coreFeatures: [
      '16,900 credits per seat each month — fixed, not shared',
      'Priority processing queue and up to 20 parallel generations',
      'Detailed per-member usage analytics',
      'Priority technical support',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'For large organizations with custom volume',
    suitableFor: [
      'Large brands and multinational organizations',
      'Teams requiring SSO, SLA and a security review',
      'Organizations integrating Buzz into existing tools via API',
    ],
    coreFeatures: [
      'Unlimited seats and a shared credit pool you allocate per member',
      'Dedicated model capacity with an SLA',
      'API access and team training',
      'Dedicated account manager and guided onboarding',
    ],
  },
];
