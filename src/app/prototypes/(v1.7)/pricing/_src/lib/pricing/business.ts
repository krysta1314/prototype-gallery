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
  badge?: { label: string; variant: 'popular' | 'team' };
  cta: string;
  ctaSubtext?: string;
  features: string[];
}

export interface SeatBusinessPlan extends BusinessPlanBase {
  pricingModel: 'per-seat';
  seats: SeatRange;
  /** List price per seat / month before any discount */
  listMonthlyPrice: number;
  /** Discount applied on monthly billing */
  monthlyDiscount: number;
  /** Charged per seat / month on monthly billing */
  monthlyPrice: number;
  /** Discount applied on annual billing */
  annualDiscount: number;
  /** Charged per seat / month on annual billing */
  annualMonthlyPrice: number;
  /** Credits granted per seat, per month */
  creditsPerSeatMonth: number;
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
    listMonthlyPrice: 69,
    monthlyDiscount: 0.13,
    monthlyPrice: 61,
    annualDiscount: 0.20,
    annualMonthlyPrice: 56,
    creditsPerSeatMonth: 6900,
    creditPool: 'Shared across team',
    creditScaling: 'Add seats',
    cta: 'Get Team',
    features: [
      'Everything in Ultra',
      'Shared credit pool across the team',
      'Shared brand kits, assets and templates',
      'Team workspace with member roles',
      'One centralized invoice',
    ],
  },
  scale: {
    id: 'scale',
    name: 'Scale',
    tagline: 'Designed for growing creative teams',
    badge: { label: 'Most Popular', variant: 'popular' },
    pricingModel: 'per-seat',
    seats: { min: 5, max: 30, default: 10 },
    listMonthlyPrice: 169,
    monthlyDiscount: 0.20,
    monthlyPrice: 136,
    annualDiscount: 0.30,
    annualMonthlyPrice: 119,
    creditsPerSeatMonth: 16900,
    creditPool: 'Shared across team',
    creditScaling: 'Add seats',
    cta: 'Get Scale',
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
    tagline: 'For large organizations with custom volume, security and support needs',
    pricingModel: 'custom',
    priceLabel: "Let's talk",
    seatsLabel: 'Custom',
    creditsLabel: 'Custom credits',
    creditPool: 'Shared across organization',
    cta: 'Contact Sales',
    features: [
      'Everything in Scale',
      'Custom credits allocation',
      'Dedicated model capacity',
      'SSO, SLA and security review',
      'Dedicated account manager + API access',
    ],
  },
};

export const BUSINESS_PLAN_ORDER: BusinessPlanId[] = ['team', 'scale', 'enterprise'];
