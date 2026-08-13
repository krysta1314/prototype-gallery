'use client';

import { useMemo } from 'react';
import { Users } from 'lucide-react';
import {
  type BusinessPlan,
  type BusinessPlanId,
  type SeatBusinessPlan,
} from '../../lib/pricing/business';
import { MODEL_BY_ID, type BillingCycle } from '../../lib/pricing/pricing';
import { computeGenerations } from '../../lib/pricing/compute';
import { Badge } from '../../components/buzz-ui/Badge';
import { Button } from '../../components/buzz-ui/Button';
import { InfoIcon } from '../../components/buzz-ui/InfoIcon';
import { SeatStepper } from '../../components/buzz-ui/SeatStepper';
import { CREDITS_TOOLTIP } from './PlanCard';
import { MatrixSections } from './FeatureMatrix';
import { useFeatureSections } from '../../lib/pricing/features-context';
import { toBusinessSections } from '../../lib/pricing/business-features';
import { fmtMoney, fmtNumber } from '../../lib/pricing/format';

const CARD_BASE = 'relative bg-white rounded-2xl p-6 flex flex-col gap-3.5';

// 与 Individual 卡片同一组示例模型，保证「≈ 多少产出」的口径一致
const IMG_MODEL = MODEL_BY_ID['gpt-image-2'];
const VID_MODEL = MODEL_BY_ID['seedance-2'];

// 与 Individual 卡片一致：锁死每行高度，保证三张卡的价格 / 席位 / CTA 严格对齐
const ROW = {
  header: 'min-h-[72px] sm:h-[72px]',
  price: 'min-h-[56px] sm:h-[56px]',
  seats: 'min-h-[44px] sm:h-[44px]',
  credits: 'min-h-[132px] sm:h-[132px]',
  savings: 'min-h-[18px] sm:h-[18px]',
} as const;

const variantClasses: Record<BusinessPlanId, string> = {
  team: 'border border-neutral-200',
  scale: 'border-2 border-[#f97316] shadow-[0_4px_20px_rgba(249,115,22,0.08)]',
  enterprise: 'border border-neutral-200',
};

const ctaVariants: Record<BusinessPlanId, 'dark' | 'accent' | 'outline'> = {
  team: 'dark',
  scale: 'accent',
  enterprise: 'outline',
};

interface BusinessPlanCardProps {
  plan: BusinessPlan;
  cycle: BillingCycle;
  seats: number;
  onSeatsChange: (n: number) => void;
}

export function BusinessPlanCard({ plan, cycle, seats, onSeatsChange }: BusinessPlanCardProps) {
  const isSeatPlan = plan.pricingModel === 'per-seat';
  const individualSections = useFeatureSections();
  const sections = useMemo(() => toBusinessSections(individualSections), [individualSections]);

  return (
    <article
      className={`${CARD_BASE} ${variantClasses[plan.id]}`}
      aria-labelledby={`business-plan-${plan.id}-name`}
    >
      {plan.badge && <Badge variant={plan.badge.variant}>{plan.badge.label}</Badge>}

      <header className={ROW.header}>
        <div className="flex items-center gap-2 flex-wrap">
          <h3 id={`business-plan-${plan.id}-name`} className="text-2xl font-bold tracking-tight">
            {plan.name}
          </h3>
          {isSeatPlan && <DiscountChip plan={plan as SeatBusinessPlan} cycle={cycle} />}
        </div>
        <p className="text-sm text-neutral-600 mt-1.5 leading-snug">{plan.tagline}</p>
      </header>

      {isSeatPlan ? (
        <SeatPlanBody
          plan={plan as SeatBusinessPlan}
          cycle={cycle}
          seats={seats}
          onSeatsChange={onSeatsChange}
        />
      ) : (
        <CustomPlanBody plan={plan} />
      )}

      <Button variant={ctaVariants[plan.id]}>{plan.cta}</Button>

      <div className={`text-center text-xs -mt-1 ${ROW.savings}`}>
        {isSeatPlan && (
          <AnnualSavings plan={plan as SeatBusinessPlan} cycle={cycle} seats={seats} />
        )}
      </div>

      <MatrixSections sections={sections} column={plan.id} />
    </article>
  );
}

function AnnualSavings({
  plan,
  cycle,
  seats,
}: {
  plan: SeatBusinessPlan;
  cycle: BillingCycle;
  seats: number;
}) {
  if (cycle !== 'yearly') return null;
  // 口径：按月付原价买一年 vs 直接买年付省下的钱，金额跟着席位数走；
  // 再折算成免费月数（省的钱 ÷ 原价单月，向上取整）——比例恒定，与席位数无关
  const savings = (plan.listMonthlyPrice - plan.annualMonthlyPrice) * 12 * seats;
  if (savings <= 0) return null;
  const monthsFree = Math.ceil(savings / (plan.listMonthlyPrice * seats));
  return (
    <>
      <span className="font-semibold text-[#0a0a0a]">Save {fmtMoney(savings)}</span>
      <span className="text-emerald-600 font-semibold">
        {' '}
        ≈ {monthsFree} months free
      </span>
    </>
  );
}

function DiscountChip({ plan, cycle }: { plan: SeatBusinessPlan; cycle: BillingCycle }) {
  const pct = Math.round((cycle === 'yearly' ? plan.annualDiscount : plan.monthlyDiscount) * 100);
  if (pct <= 0) return null;
  return (
    <span
      className="inline-flex items-center text-[13px] font-extrabold text-white px-3 py-1 leading-none tracking-wider"
      style={{
        background: 'linear-gradient(135deg, #ff0051 0%, #ff3d7a 100%)',
        transform: 'skewX(-14deg)',
        boxShadow: '0 4px 12px rgba(255, 0, 81, 0.28)',
        borderRadius: '4px',
      }}
    >
      <span style={{ transform: 'skewX(14deg)', display: 'inline-block' }}>{pct}% OFF</span>
    </span>
  );
}

function SeatPlanBody({
  plan,
  cycle,
  seats,
  onSeatsChange,
}: {
  plan: SeatBusinessPlan;
  cycle: BillingCycle;
  seats: number;
  onSeatsChange: (n: number) => void;
}) {
  const isYearly = cycle === 'yearly';
  const perSeat = isYearly ? plan.annualMonthlyPrice : plan.monthlyPrice;
  const monthlyTotal = perSeat * seats;
  // Credits 口径与 Individual 卡片保持一致：年付只是付款方式，额度仍按月发放、按月清零
  const credits = plan.creditsPerSeatMonth * seats;
  const imgCount = computeGenerations(credits, 'gpt-image-2');
  const vidCount = computeGenerations(credits, 'seedance-2');

  return (
    <>
      <div className={ROW.price}>
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-[28px] text-neutral-400 line-through font-bold tracking-tight">
            {fmtMoney(plan.listMonthlyPrice)}
          </span>
          <span className="text-[40px] font-bold tracking-tight leading-none">{fmtMoney(perSeat)}</span>
          <span className="text-[13px] text-neutral-500 font-medium">per seat / mo</span>
        </div>
      </div>

      <div className={`bg-neutral-50 rounded-[10px] p-3 text-xs leading-[1.5] flex flex-col gap-2 ${ROW.credits}`}>
        <div className="font-bold text-[16px] text-[#0a0a0a] flex items-baseline gap-1">
          <span>{fmtNumber(credits)}</span>
          <span className="text-[12px] font-medium text-neutral-600">credits/month</span>
          <InfoIcon label="How credits work">{CREDITS_TOOLTIP}</InfoIcon>
        </div>
        {/* 与 Individual 卡片同一口径：把额度换算成可产出的图 / 视频条数 */}
        <div className="text-neutral-500">
          <div>≈ {fmtNumber(imgCount)} {IMG_MODEL.name} {IMG_MODEL.unitLabel}s</div>
          <div>≈ {fmtNumber(vidCount)} {VID_MODEL.name} {VID_MODEL.unitLabel}s ({VID_MODEL.sku})</div>
        </div>
        <div className="mt-auto pt-2">
          <div
            className="flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[13px] font-medium text-neutral-700 border border-white/70 shadow-sm backdrop-blur-md whitespace-nowrap"
            style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.55) 100%)' }}
          >
            <Users aria-hidden className="w-3.5 h-3.5 text-neutral-500" />
            {fmtMoney(monthlyTotal)}/mo total for {seats} seats
          </div>
        </div>
      </div>

      <div className={`rounded-[10px] border border-neutral-200 px-3 py-2.5 ${ROW.seats} flex items-center`}>
        <div className="w-full">
          <SeatStepper
            value={seats}
            onChange={onSeatsChange}
            range={plan.seats}
            ariaLabel={plan.name}
          />
        </div>
      </div>
    </>
  );
}

function CustomPlanBody({ plan }: { plan: Extract<BusinessPlan, { pricingModel: 'custom' }> }) {
  return (
    <>
      <div className={ROW.price}>
        <span className="text-[40px] font-bold tracking-tight leading-none">{plan.priceLabel}</span>
      </div>

      <div className={`bg-neutral-50 rounded-[10px] p-3 text-xs leading-[1.5] flex flex-col gap-2 ${ROW.credits}`}>
        <div className="font-bold text-[16px] text-[#0a0a0a] flex items-baseline gap-1">
          <span>{plan.creditsLabel}</span>
          <span className="text-[12px] font-medium text-neutral-600">per seat / mo</span>
          <InfoIcon label="How credits work">{CREDITS_TOOLTIP}</InfoIcon>
        </div>
        {/* Enterprise 没有具体额度，这两行沿用 Team / Scale 的 ≈ 版式说明能力边界 */}
        <div className="text-neutral-500">
          <div>≈ Unlimited seats</div>
          <div>≈ Custom model access</div>
        </div>
        <div className="mt-auto pt-2">
          <div
            className="flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[13px] font-medium text-neutral-700 border border-white/70 shadow-sm backdrop-blur-md whitespace-nowrap"
            style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.55) 100%)' }}
          >
            <Users aria-hidden className="w-3.5 h-3.5 text-neutral-500" />
            Custom quote for your organization
          </div>
        </div>
      </div>

      <div className={`rounded-[10px] border border-neutral-200 px-3 py-2.5 ${ROW.seats} flex items-center`}>
        <div className="flex items-center justify-between w-full">
          <span className="text-[12px] font-medium text-neutral-700">Seats</span>
          <span className="text-[13px] font-bold text-[#0a0a0a]">{plan.seatsLabel}</span>
        </div>
      </div>
    </>
  );
}
