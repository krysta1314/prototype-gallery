'use client';

import { useMemo, useState } from 'react';
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
import { ContactSalesButton } from './ContactSalesModal';
import { CreateTeamModal } from './CreateTeamModal';
import { useFeatureSections } from '../../lib/pricing/features-context';
import { toBusinessSections } from '../../lib/pricing/business-features';
import { fmtMoney, fmtNumber } from '../../lib/pricing/format';

const CARD_BASE = 'relative bg-white rounded-2xl p-6 flex flex-col gap-3.5';

// Team / Scale 没有共享池 —— 每席位的额度固定归本人,管理员不能再分配。
// 需要按人分配额度的组织走 Enterprise（那一档才是池）。
const CREDIT_SEAT_TOOLTIP = (
  <span className="whitespace-pre-line">
    {'Credits are fixed per seat and reset every month:\n' +
      '• Each seat gets its own monthly credits — they are not pooled\n' +
      '• Unused credits stay with that seat and do not transfer to a teammate\n' +
      '• Need to allocate credits across people? That is Enterprise, which runs on a shared pool'}
  </span>
);

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
  scale: 'border-2 border-[#7c3aed] shadow-[0_4px_24px_rgba(124,58,237,0.12)]',
  enterprise: 'border border-neutral-200',
};

const ctaVariants: Record<BusinessPlanId, 'dark' | 'secondary' | 'outline'> = {
  team: 'dark',
  // 紫色从 Individual 的 Ultra 移交过来 —— Business tab 的强调色
  scale: 'secondary',
  enterprise: 'outline',
};

interface BusinessPlanCardProps {
  plan: BusinessPlan;
  cycle: BillingCycle;
  seats: number;
  onSeatsChange: (n: number) => void;
  /** 当前团队所在档位;'none' = 还没有团队,三张卡都是纯购买态 */
  currentPlan?: 'none' | BusinessPlanId;
}

/** 档位高低,用来判断 CTA 该说 Upgrade 还是 Downgrade */
const TIER_RANK: Record<BusinessPlanId, number> = { team: 1, scale: 2, enterprise: 3 };

export function BusinessPlanCard({ plan, cycle, seats, onSeatsChange, currentPlan = 'none' }: BusinessPlanCardProps) {
  const isSeatPlan = plan.pricingModel === 'per-seat';
  const isCurrent = currentPlan === plan.id;
  // 已经在某一档上时,其余卡片按高低说 Upgrade / Downgrade;没有团队时保持原来的购买文案
  const ctaLabel = (() => {
    if (isCurrent) return 'Current plan';
    if (currentPlan === 'none') return plan.cta;
    if (plan.id === 'enterprise') return plan.cta;
    return TIER_RANK[plan.id] > TIER_RANK[currentPlan] ? `Upgrade to ${plan.name}` : `Switch to ${plan.name}`;
  })();
  // 还没有团队时,CTA 就是「建团队 = 购买」的入口 —— 点开走 团队名 → 席位/周期/付款
  const [wizardOpen, setWizardOpen] = useState(false);
  const opensWizard = isSeatPlan && currentPlan === 'none';
  const individualSections = useFeatureSections();
  const sections = useMemo(() => toBusinessSections(individualSections), [individualSections]);

  return (
    <article
      className={`${CARD_BASE} ${isCurrent ? 'border-2 border-[#0a0a0a] shadow-[0_4px_24px_rgba(10,10,10,0.10)]' : variantClasses[plan.id]}`}
      aria-labelledby={`business-plan-${plan.id}-name`}
    >
      {isCurrent ? (
        <Badge variant="pill-top">Current plan</Badge>
      ) : (
        plan.badge && <Badge variant={plan.badge.variant}>{plan.badge.label}</Badge>
      )}

      <header className={ROW.header}>
        <div className="flex items-center gap-2 flex-wrap">
          <h3 id={`business-plan-${plan.id}-name`} className="text-2xl font-bold tracking-tight">
            {plan.name}
          </h3>
          {isSeatPlan && <AnnualDiscountChip plan={plan as SeatBusinessPlan} cycle={cycle} />}
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

      {isCurrent ? (
        <span className="block w-full text-center px-4 py-3 rounded-[10px] font-semibold text-sm border border-neutral-300 bg-neutral-100 text-neutral-500">
          {ctaLabel}
        </span>
      ) : plan.pricingModel === 'custom' ? (
        <ContactSalesButton label={ctaLabel} variant={ctaVariants[plan.id]} />
      ) : (
        <Button
          variant={ctaVariants[plan.id]}
          onClick={opensWizard ? e => { e.preventDefault(); setWizardOpen(true); } : undefined}
        >
          {ctaLabel}
        </Button>
      )}

      {wizardOpen && isSeatPlan && (
        <CreateTeamModal
          plan={plan as SeatBusinessPlan}
          cycle={cycle}
          seats={seats}
          onClose={() => setWizardOpen(false)}
        />
      )}

      <div className={`text-center text-xs -mt-1 ${ROW.savings}`}>
        {isSeatPlan ? (
          <AnnualSavings plan={plan as SeatBusinessPlan} cycle={cycle} seats={seats} />
        ) : (
          // Enterprise 不露价,这一槽用来讲「谈出来的条件最好」,与另两档的省钱数字同位
          <span className="font-semibold text-[#0a0a0a]">Best offers for BuzzVideo&rsquo;s partners</span>
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
  // 口径：按月付价买一年 vs 直接买年付省下的钱，金额跟着席位数走；
  // 再折算成免费月数（省的钱 ÷ 月付单月，向上取整）——比例恒定，与席位数无关
  const savings = (plan.monthlyPrice - plan.annualMonthlyPrice) * 12 * seats;
  if (savings <= 0) return null;
  const monthsFree = Math.ceil(savings / (plan.monthlyPrice * seats));
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

/**
 * 折扣贴纸 —— 只在年付出现。
 * 月付价就是定价、没有任何折扣，所以月付态不该有贴纸；
 * 年付的 30% 是真实让价，标出来。
 */
function AnnualDiscountChip({ plan, cycle }: { plan: SeatBusinessPlan; cycle: BillingCycle }) {
  if (cycle !== 'yearly') return null;
  const pct = Math.round(plan.annualDiscount * 100);
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
  // 头条数字按「每席」讲,不做加总 —— Team / Scale 没有共享池,
  // 任何合计写法都会被读成「这一笔谁都能一起花」。
  // 年付只是付款方式,额度仍按月发放、按月清零（与 Individual 卡同口径）。
  const credits = plan.creditsPerSeatMonth;
  const imgCount = computeGenerations(credits, 'gpt-image-2');
  const vidCount = computeGenerations(credits, 'seedance-2');

  return (
    <>
      <div className={ROW.price}>
        <div className="flex items-baseline gap-2 flex-wrap">
          {/* 月付就是定价、不打折,所以只有年付才划掉月付价 —— 这是真实对比,不是永久挂原价 */}
          {isYearly && (
            <span className="text-[28px] text-neutral-400 line-through font-bold tracking-tight">
              {fmtMoney(plan.monthlyPrice)}
            </span>
          )}
          <span className="text-[40px] font-bold tracking-tight leading-none">{fmtMoney(perSeat)}</span>
          <span className="text-[13px] text-neutral-500 font-medium">per seat / mo</span>
        </div>
      </div>

      <div className={`bg-neutral-50 rounded-[10px] p-3 text-xs leading-[1.5] flex flex-col gap-2 ${ROW.credits}`}>
        <div className="font-bold text-[16px] text-[#0a0a0a] flex items-baseline gap-1">
          <span>{fmtNumber(credits)}</span>
          <span className="text-[12px] font-medium text-neutral-600">credits each</span>
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
            {/* 每席额度固定不变,随席位变的是「有几个席位拿到这份额度」 */}
            {fmtNumber(plan.creditsPerSeatMonth)} credits per seat / mo · {seats} {seats === 1 ? 'seat' : 'seats'}
            <InfoIcon label="How per-seat credits work">{CREDIT_SEAT_TOOLTIP}</InfoIcon>
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
          <span className="text-[12px] font-medium text-neutral-600">shared pool / mo</span>
          <InfoIcon label="How credits work">{CREDITS_TOOLTIP}</InfoIcon>
        </div>
        {/* Enterprise 没有具体额度，这两行沿用 Team / Scale 的 ≈ 版式说明能力边界 */}
        <div className="text-neutral-500">
          <div>≈ Unlimited seats</div>
          <div>≈ Allocated per member by admins</div>
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
