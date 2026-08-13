'use client';

import {
  MODELS,
  PAID_PLANS,
  PAID_PLAN_ORDER,
  SCALE_DISCOUNTS,
  type ModelCategory,
  type ModelId,
  type PaidPlanId,
  type PlanId,
} from '../../lib/pricing/pricing';
import { BillingToggle } from '../../components/buzz-ui/BillingToggle';
import { Button } from '../../components/buzz-ui/Button';
import { ScalingSlider } from '../../components/buzz-ui/ScalingSlider';
import { SPEED_TAG_STYLES, SpeedBadge, emphasizeDigits, FestivalUnlockBadge } from './FeatureMatrix';
import { computeCredits, computeGenerations, computePrice } from '../../lib/pricing/compute';
import { fmtMoney, fmtNumber } from '../../lib/pricing/format';
import type { RegionState } from '../../hooks/usePricingState';
import { usePromo, bonusMultiplier, discountMultiplier, isUnlocked, type PromoEffect } from '../../lib/pricing/promo-context';

interface Props {
  region: RegionState;
  /** v2 独有的 extra rows in "AI Avatars & Customization" group. v1 传空数组. */
  extraAvatarRows?: { label: string; values: [string, string, string, string] }[];
  /** v1.3 独有：显示只在 v1.3 出现的模型（见 V13_ONLY_MODEL_IDS）。其余版本隐藏。 */
  showV13Models?: boolean;
  /** v1.5 独有：显示只在 v1.5 出现的模型（见 V15_ONLY_MODEL_IDS）。其余版本隐藏。 */
  showV15Models?: boolean;
  /** 需要隐藏的功能行（按行名）。v1.5 用来去掉 Long Video / Character Customization。 */
  hideRows?: string[];
  /** 额度一律按月展示（v1.5 起：年付也是每月发放、每月清零） */
  monthlyCredits?: boolean;
  /** 把 "AI Avatars & Customization" 分组并进 Features（v1.5 起） */
  mergeAvatarGroup?: boolean;
}

// 仅在 v1.3 出现的模型（plan 卡片 + Compare 表），其余版本隐藏
const V13_ONLY_MODEL_IDS = new Set<ModelId>([
  'nano-banana-2-lite',
  'seedance-2-mini',
  'gemini-omni-flash',
]);

// 仅在 v1.5 出现的模型
const V15_ONLY_MODEL_IDS = new Set<ModelId>([
  'seedream-5-pro',
  'seedance-2-5',
]);

const FREE_CREDITS = 500;

// 模型营销分类标签：Premium Cinematic 高端电影级，其余默认 Standard 日常素材
const PREMIUM_CINEMATIC_MODEL_IDS = new Set<string>([
  'nano-banana',
  'nano-banana-2',
  'nano-banana-2-lite',
  'nano-banana-pro',
  'gpt-image-2',
  'seedance-2',
  'seedance-2-fast',
  'seedance-2-5',
  'seedream-5-pro',
  'kling-3',
]);

export function CompareFeatures({
  region,
  extraAvatarRows = [],
  showV13Models = false,
  showV15Models = false,
  hideRows = [],
  monthlyCredits = false,
  mergeAvatarGroup = false,
}: Props) {
  const hidden = (label: string) => hideRows.includes(label);
  const { cycle, scales, setCycle, setScale } = region;
  // 年付只是付款方式，credits 仍按月发放，所以 v1.5 一律按月口径算。
  const creditsCycle = monthlyCredits ? 'monthly' : cycle;
  // usePromo() 无 Provider 时返回 null，withBonus 退化为原样返回 —— 现有页面行为不变。
  const promo = usePromo();
  const withBonus = (planId: PlanId, credits: number) =>
    Math.round(credits * bonusMultiplier(promo, planId));
  const freeCredits = withBonus('free', FREE_CREDITS);
  const creditsFor = (planId: PaidPlanId) => {
    // Starter and Pro are fixed-price — always 1x regardless of stored state.
    const effectiveScale = (planId === 'starter' || planId === 'pro') ? 1 : scales[planId];
    return withBonus(planId, computeCredits(planId, effectiveScale, creditsCycle));
  };
  const planColTint = (_planId: PaidPlanId) => '';

  const avatarRows = (
    <>
      <FeatureRow label="AI Avatars" values={['1','Unlimited','Unlimited','Unlimited']} planColTint={planColTint} />
      {!hidden('Character Customization (Seedance 2.0)') && (
        <FeatureRow label="Character Customization (Seedance 2.0)" values={['✗','Unlimited','Unlimited','Unlimited']} planColTint={planColTint} />
      )}
    </>
  );

  const visible = (id: ModelId) =>
    (showV13Models || !V13_ONLY_MODEL_IDS.has(id)) &&
    (showV15Models || !V15_ONLY_MODEL_IDS.has(id));
  const imageModels = MODELS.filter(m => m.category === 'image' && visible(m.id));
  const videoModels = MODELS.filter(m => m.category === 'video' && visible(m.id));

  return (
    <section className="mt-20" id="compare">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-[28px] font-bold tracking-tight">Compare all features and plans</h2>
        <p className="mt-2 text-sm text-neutral-500">
          Switch billing cycle or scale up Ultra&rsquo;s credits to see how many assets each plan delivers.
        </p>
        <div className="mt-5 inline-flex">
          <BillingToggle value={cycle} onChange={setCycle} ariaLabel="Compare features billing cycle" />
        </div>
      </div>

      {/* mobile: 横滑(sticky 失效,可接受);lg+: 无 overflow,sticky thead 工作 */}
      <div id="compare-table" className="border border-neutral-200 rounded-2xl overflow-x-auto lg:overflow-visible">
        <table className="w-full border-collapse min-w-[880px] text-[13px]">
          <thead>
            <tr>
              <th className="text-left p-4 bg-neutral-50 border-b border-neutral-200 w-[200px] sticky top-0 z-20">Plan</th>
              <ColHeader planId="free" freeCredits={freeCredits} />
              {PAID_PLAN_ORDER.map(planId => (
                <PaidColHeader
                  key={planId}
                  planId={planId}
                  cycle={cycle}
                  creditsCycle={creditsCycle}
                  scale={scales[planId]}
                  onScaleChange={(s) => setScale(planId, s)}
                  promo={promo}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            <GroupRow label="Credits" />
            <tr>
              <td className="p-4 border-b border-neutral-200">
                <div className="font-medium">Total Credits</div>
                <div className="text-[11px] text-neutral-500 mt-0.5">
                  {creditsCycle === 'monthly' ? 'Per month' : 'Per year, delivered upfront'}
                </div>
              </td>
              <td className="p-4 border-b border-neutral-200">
                {fmtNumber(freeCredits)} <span className="text-neutral-500">credits (one-time)</span>
              </td>
              {PAID_PLAN_ORDER.map(planId => (
                <td key={planId} className={`p-4 border-b border-neutral-200 ${planColTint(planId)}`}>
                  <b>{fmtNumber(creditsFor(planId))}</b>{' '}
                  <span className="text-neutral-500">credits / {creditsCycle === 'monthly' ? 'mo' : 'yr'}</span>
                </td>
              ))}
            </tr>

            <ModelGroup
              category="image"
              models={imageModels}
              creditsFor={creditsFor}
              planColTint={planColTint}
              freeCredits={freeCredits}
              promo={promo}
            />
            <ModelGroup
              category="video"
              models={videoModels}
              creditsFor={creditsFor}
              planColTint={planColTint}
              freeCredits={freeCredits}
              promo={promo}
            />

            <GroupRow label="Features" />
            <FeatureRow label="Marketing Agent"        values={['✓','✓','✓','✓']} planColTint={planColTint} />
            <FeatureRow label="Image Generation"       values={['✓','✓','✓','✓']} planColTint={planColTint} />
            <FeatureRow label="Video Generation"       values={['✗','✓','✓','✓']} planColTint={planColTint} />
            {!hidden('Long Video Generation (Early Access)') && (
              <FeatureRow label={<>Long Video Generation <span className="text-neutral-500 text-[11px]">(Early Access)</span></>} values={['✗','✗','✗','✓']} planColTint={planColTint} />
            )}
            <FeatureRow label="Watermark-free Videos"  values={['—','✓','✓','✓']} planColTint={planColTint} />
            <FeatureRow label="Technical Support"       values={['✗','✗','✓','✓']} planColTint={planColTint} />
            {/* 合并模式下 AI Avatars 直接排在 Features 里（顺序与卡片一致）*/}
            {mergeAvatarGroup && avatarRows}
            {extraAvatarRows.map(r => (
              <FeatureRow key={r.label} label={r.label} values={r.values} planColTint={planColTint} />
            ))}

            {!mergeAvatarGroup && (
              <>
                <GroupRow label="AI Avatars & Customization" />
                {avatarRows}
              </>
            )}
          </tbody>
        </table>
      </div>

    </section>
  );
}

function ColHeader({ planId, freeCredits }: { planId: 'free'; freeCredits: number }) {
  return (
    <th className="text-left p-4 bg-neutral-50 border-b border-neutral-200 min-w-[180px] align-top sticky top-0 z-20">
      <div className="font-bold text-[15px]">Free</div>
      <div className="text-[20px] font-bold tracking-tight mt-2">$0</div>
      <div className="text-[11px] text-neutral-500 mt-0.5">{fmtNumber(freeCredits)} credits (one-time)</div>
      {/* placeholder for slider height parity with Ultra column */}
      <div className="invisible mt-2.5 h-[58px]" aria-hidden />
      {/* CTA placeholder so Free column matches paid columns' button height (Free has no Compare-page CTA) */}
      <div className="invisible mt-3 h-[44px]" aria-hidden />
      <span className="sr-only">{planId}</span>
    </th>
  );
}

interface PaidColHeaderProps {
  planId: PaidPlanId;
  cycle: 'monthly' | 'yearly';
  /** 滑块刻度用的额度口径；v1.5 一律按月 */
  creditsCycle: 'monthly' | 'yearly';
  scale: import('../../lib/pricing/pricing').Scale;
  onScaleChange: (s: import('../../lib/pricing/pricing').Scale) => void;
  /** usePromo() 无 Provider 时为 null，下面两个乘数退化为 1，价格/刻度与现有 /prototypes/pricing 行为完全一致 */
  promo: PromoEffect | null;
}

function PaidColHeader({ planId, cycle, creditsCycle, scale, onScaleChange, promo }: PaidColHeaderProps) {
  const plan = PAID_PLANS[planId];
  // Starter and Pro are fixed-price — only Ultra has the slider.
  const isFixedPrice = planId === 'starter' || planId === 'pro';
  const effectiveScale = isFixedPrice ? (1 as import('../../lib/pricing/pricing').Scale) : scale;
  const price = computePrice(planId, effectiveScale, cycle);
  // 与卡片区口径一致：折扣活动下列头价格也要打折，加赠活动下滑杆刻度也要乘上加赠倍数
  const priceCut = discountMultiplier(promo, planId, cycle);
  const creditsBonus = bonusMultiplier(promo, planId);
  const isYearly = cycle === 'yearly';
  const tint = '';
  // 按钮色匹配 Plan Cards 区配色（Starter dark / Pro accent / Ultra secondary）
  const ctaVariant = planId === 'starter' ? 'dark' : planId === 'pro' ? 'accent' : 'secondary';
  return (
    <th className={`text-left p-4 bg-neutral-50 border-b border-neutral-200 min-w-[180px] align-top sticky top-0 z-20 ${tint}`}>
      <div className="font-bold text-[15px]">
        {plan.name}
        {plan.badge && (
          <span
            className={`ml-1.5 align-middle text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              plan.badge.variant === 'popular'
                ? 'bg-[#f97316] text-white'
                : 'border border-[#7c3aed] text-[#7c3aed]'
            }`}
          >
            {plan.badge.label}
          </span>
        )}
      </div>
      <div className="mt-2">
        {isYearly && (
          <span className="text-[12px] text-neutral-400 line-through mr-1">
            {fmtMoney(price.monthlyPrice)}
          </span>
        )}
        <span className="text-[20px] font-bold tracking-tight">
          {fmtMoney(price.displayPrice * priceCut)}
        </span>
        <span className="text-[11px] text-neutral-500 ml-0.5">/mo</span>
      </div>
      <div className="text-[11px] text-neutral-500 mt-0.5 min-h-[14px]">
        {isYearly ? `${fmtMoney(price.annualTotal * priceCut)} billed annually` : ' '}
      </div>
      {!isFixedPrice ? (
        <div className="mt-2.5">
          <ScalingSlider
            value={scale}
            onChange={onScaleChange}
            ariaLabel={`${plan.name} compare column credit multiplier`}
            tickFormat={(s) => fmtNumber(Math.round(computeCredits(planId, s, creditsCycle) * creditsBonus))}
            chipFormat={(s) => {
              if (SCALE_DISCOUNTS[cycle][s] === 0) return null;
              const p = computePrice(planId, s, cycle);
              if (p.displayPrice >= p.referencePrice) return null;
              return `${Math.round((1 - p.displayPrice / p.referencePrice) * 100)}% OFF`;
            }}
          />
        </div>
      ) : (
        // Starter / Pro: slider placeholder so CTA aligns with Ultra column
        <div className="invisible mt-2.5 h-[58px]" aria-hidden />
      )}
      <div className="mt-3">
        {/* 占位 CTA — 暂时点击无反应，未来接 Stripe Checkout 直跳 */}
        <Button variant={ctaVariant} onClick={e => e.preventDefault()}>
          {plan.cta}
        </Button>
      </div>
    </th>
  );
}

function ModelTag({ isPremium }: { isPremium: boolean }) {
  if (isPremium) {
    return (
      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 whitespace-nowrap">
        Premium Cinematic Assets
      </span>
    );
  }
  return (
    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 whitespace-nowrap">
      Standard Assets
    </span>
  );
}

function GroupRow({ label }: { label: string }) {
  return (
    <tr>
      <td
        colSpan={5}
        className="bg-neutral-50 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-600"
      >
        {label}
      </td>
    </tr>
  );
}

function FeatureRow({
  label,
  values,
  planColTint,
}: {
  label: React.ReactNode;
  values: [string, string, string, string];
  planColTint: (p: PaidPlanId) => string;
}) {
  const cells = values.map((v) => {
    if (SPEED_TAG_STYLES[v]) return <SpeedBadge label={v} />;
    if (/^(Up to\s+\d+|\d+\s+at a time)$/.test(v)) return emphasizeDigits(v);
    return v;
  });
  const [free, starter, pro, ultra] = cells;
  return (
    <tr>
      <td className="p-4 border-b border-neutral-200">{label}</td>
      <td className="p-4 border-b border-neutral-200">{free}</td>
      <td className={`p-4 border-b border-neutral-200 ${planColTint('starter')}`}>{starter}</td>
      <td className={`p-4 border-b border-neutral-200 ${planColTint('pro')}`}>{pro}</td>
      <td className={`p-4 border-b border-neutral-200 ${planColTint('ultra')}`}>{ultra}</td>
    </tr>
  );
}

interface ModelGroupProps {
  category: ModelCategory;
  models: typeof MODELS[number][];
  creditsFor: (p: PaidPlanId) => number;
  planColTint: (p: PaidPlanId) => string;
  /** 已按加赠后重算的 Free 一次性额度 */
  freeCredits: number;
  promo: PromoEffect | null;
}

function ModelGroup({ category, models, creditsFor, planColTint, freeCredits, promo }: ModelGroupProps) {
  const label = category === 'image' ? 'Image Models' : 'Video Models';
  return (
    <>
      <GroupRow label={label} />
      {models.map(m => (
        <tr key={m.id}>
          <td className="p-4 border-b border-neutral-200">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-[#0a0a0a]">{m.name}</span>
              <ModelTag isPremium={PREMIUM_CINEMATIC_MODEL_IDS.has(m.id)} />
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">
              {m.sku} · {fmtNumber(m.pricePerUnit)} credits/{m.unitLabel}
            </div>
          </td>
          {(['free','starter','pro','ultra'] as const).map(planId => {
            const tint = planId === 'pro' ? planColTint('pro') : planId === 'starter' ? planColTint('starter') : planId === 'ultra' ? planColTint('ultra') : '';
            if (planId === 'free') {
              const count = m.freeAccess ? Math.floor(freeCredits / m.pricePerUnit) : null;
              const unlocked = count === null && isUnlocked(promo, m.name, 'free');
              return (
                <td key={planId} className={`p-4 border-b border-neutral-200 ${tint}`}>
                  {unlocked ? <FestivalUnlockBadge /> : count === null ? '✗' : `${fmtNumber(count)} ${m.unitLabel}s`}
                </td>
              );
            }
            const count = computeGenerations(creditsFor(planId), m.id);
            // MODELS 只有全局 freeAccess，没有 per-plan 门槛，所以付费列结构上永远有数字；
            // unlock 活动命中时在数字后面追加徽章，标识"这是活动期临时开放的"，不替换数字本身。
            const unlocked = isUnlocked(promo, m.name, planId);
            return (
              <td key={planId} className={`p-4 border-b border-neutral-200 ${tint}`}>
                {fmtNumber(count)} {m.unitLabel}s
                {unlocked && <span className="ml-1.5 inline-block align-middle"><FestivalUnlockBadge /></span>}
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}
