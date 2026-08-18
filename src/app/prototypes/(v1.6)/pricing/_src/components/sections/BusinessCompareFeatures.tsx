'use client';

import React, { useMemo } from 'react';
import {
  BUSINESS_PLANS,
  BUSINESS_PLAN_ORDER,
  type BusinessPlan,
  type BusinessPlanId,
  type SeatBusinessPlan,
} from '../../lib/pricing/business';
import { MODELS, type BillingCycle, type ModelCategory } from '../../lib/pricing/pricing';
import { computeGenerations } from '../../lib/pricing/compute';
import { BillingToggle } from '../../components/buzz-ui/BillingToggle';
import { Button } from '../../components/buzz-ui/Button';
import { Value } from './FeatureMatrix';
import { ContactSalesButton } from './ContactSalesModal';
import { toBusinessSections } from '../../lib/pricing/business-features';
import { useFeatureSections } from '../../lib/pricing/features-context';
import { fmtMoney, fmtNumber } from '../../lib/pricing/format';

interface Props {
  cycle: BillingCycle;
  onCycleChange: (c: BillingCycle) => void;
  /** Yearly 标签上的折扣文案，与 Header 保持一致 */
  savingLabel?: string;
}

const COL_COUNT = BUSINESS_PLAN_ORDER.length + 1;

const ctaVariants: Record<BusinessPlanId, 'dark' | 'accent' | 'outline'> = {
  team: 'dark',
  scale: 'accent',
  enterprise: 'outline',
};

// 模型营销分类标签，与 Individual 对比表一致
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

/** 模型分组在对比表里换算成产出条数，不再用 Unlimited 徽章 */
const MODEL_SECTION_TITLES = new Set(['Image Models', 'Video Models']);

/**
 * Business 版的功能对比表：列是 Team / Scale / Enterprise，
 * 功能行复用卡片那套 sections（同一数据源，改一处两边都变），
 * 模型行则和 Individual 对比表一样按每座每月额度换算成可产出条数。
 */
export function BusinessCompareFeatures({ cycle, onCycleChange, savingLabel }: Props) {
  const individualSections = useFeatureSections();
  const sections = useMemo(
    () => toBusinessSections(individualSections).filter(s => !MODEL_SECTION_TITLES.has(s.title)),
    [individualSections],
  );

  return (
    <section className="mt-20" id="compare">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-[28px] font-bold tracking-tight">
          Compare all features and plans
        </h2>
        <p className="mt-2 text-sm text-neutral-500">
          Per-seat pricing across Team, Scale and Enterprise. Credits are pooled and shared by every
          seat in the workspace.
        </p>
        <div className="mt-5 inline-flex">
          <BillingToggle
            value={cycle}
            onChange={onCycleChange}
            ariaLabel="Compare business plans billing cycle"
            savingLabel={savingLabel}
          />
        </div>
      </div>

      {/* mobile: 横滑(sticky 失效,可接受);lg+: 无 overflow,sticky thead 工作 */}
      <div id="compare-table" className="border border-neutral-200 rounded-2xl overflow-x-auto lg:overflow-visible">
        <table className="w-full border-collapse min-w-[880px] text-[13px]">
          <thead>
            <tr>
              <th className="text-left p-4 bg-neutral-50 border-b border-neutral-200 w-[240px] sticky top-0 z-20">
                Plan
              </th>
              {BUSINESS_PLAN_ORDER.map(planId => (
                <ColHeader key={planId} plan={BUSINESS_PLANS[planId]} cycle={cycle} />
              ))}
            </tr>
          </thead>
          <tbody>
            <GroupRow label="Credits" />
            <tr>
              <td className="p-4 border-b border-neutral-200">
                <div className="font-medium">Credits per seat</div>
                <div className="text-[11px] text-neutral-500 mt-0.5">
                  Per month, pooled and shared across the workspace
                </div>
              </td>
              {BUSINESS_PLAN_ORDER.map(planId => {
                const plan = BUSINESS_PLANS[planId];
                return (
                  <td key={planId} className="p-4 border-b border-neutral-200">
                    {plan.pricingModel === 'per-seat' ? (
                      <>
                        <b>{fmtNumber(plan.creditsPerSeatMonth)}</b>{' '}
                        <span className="text-neutral-500">credits / mo</span>
                      </>
                    ) : (
                      <b>{plan.creditsLabel}</b>
                    )}
                  </td>
                );
              })}
            </tr>

            {sections.map(section => (
              <React.Fragment key={section.title}>
                <GroupRow label={section.title} />
                {section.rows.map(row => (
                  <tr key={row.label}>
                    <td className="p-4 border-b border-neutral-200">{row.label}</td>
                    {BUSINESS_PLAN_ORDER.map(planId => (
                      <td key={planId} className="p-4 border-b border-neutral-200">
                        <Value value={row.values[planId]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </React.Fragment>
            ))}

            <ModelGroup category="image" />
            <ModelGroup category="video" />
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ColHeader({ plan, cycle }: { plan: BusinessPlan; cycle: BillingCycle }) {
  const isYearly = cycle === 'yearly';
  return (
    <th className="text-left p-4 bg-neutral-50 border-b border-neutral-200 min-w-[200px] align-top sticky top-0 z-20">
      <div className="font-bold text-[15px]">
        {plan.name}
        {plan.badge && (
          <span
            className={`ml-1.5 align-middle text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              plan.badge.variant === 'popular'
                ? 'bg-[#f97316] text-white'
                : 'border border-[#f97316] text-[#f97316]'
            }`}
          >
            {plan.badge.label}
          </span>
        )}
      </div>
      {plan.pricingModel === 'per-seat' ? (
        <SeatPrice plan={plan} isYearly={isYearly} />
      ) : (
        <>
          <div className="mt-2 text-[20px] font-bold tracking-tight">{plan.priceLabel}</div>
          <div className="text-[11px] text-neutral-500 mt-0.5 min-h-[14px]">
            Custom quote for your organization
          </div>
        </>
      )}
      <div className="mt-3">
        {plan.pricingModel === 'custom' ? (
          <ContactSalesButton label={plan.cta} variant={ctaVariants[plan.id]} />
        ) : (
          // 占位 CTA — 与 Individual 对比表一致，暂时点击无反应
          <Button variant={ctaVariants[plan.id]} onClick={e => e.preventDefault()}>
            {plan.cta}
          </Button>
        )}
      </div>
    </th>
  );
}

function SeatPrice({ plan, isYearly }: { plan: SeatBusinessPlan; isYearly: boolean }) {
  const perSeat = isYearly ? plan.annualMonthlyPrice : plan.monthlyPrice;
  return (
    <>
      <div className="mt-2">
        <span className="text-[12px] text-neutral-400 line-through mr-1">
          {fmtMoney(plan.listMonthlyPrice)}
        </span>
        <span className="text-[20px] font-bold tracking-tight">{fmtMoney(perSeat)}</span>
        <span className="text-[11px] text-neutral-500 ml-0.5">per seat / mo</span>
      </div>
      <div className="text-[11px] text-neutral-500 mt-0.5 min-h-[14px]">
        {isYearly ? `${fmtMoney(perSeat * 12)} per seat, billed annually` : ' '}
      </div>
    </>
  );
}

function ModelTag({ isPremium }: { isPremium: boolean }) {
  return isPremium ? (
    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 whitespace-nowrap">
      Premium Cinematic Assets
    </span>
  ) : (
    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 whitespace-nowrap">
      Standard Assets
    </span>
  );
}

/** 每座每月额度能产出多少张图 / 多少条视频；Enterprise 无固定额度，显示 Custom。 */
function ModelGroup({ category }: { category: ModelCategory }) {
  const models = MODELS.filter(m => m.category === category);
  return (
    <>
      <GroupRow label={category === 'image' ? 'Image Models' : 'Video Models'} />
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
          {BUSINESS_PLAN_ORDER.map(planId => {
            const plan = BUSINESS_PLANS[planId];
            if (plan.pricingModel !== 'per-seat') {
              return (
                <td key={planId} className="p-4 border-b border-neutral-200 text-neutral-500">
                  Custom
                </td>
              );
            }
            const count = computeGenerations(plan.creditsPerSeatMonth, m.id);
            return (
              <td key={planId} className="p-4 border-b border-neutral-200">
                {fmtNumber(count)} {m.unitLabel}s
                <span className="text-neutral-500"> / seat / mo</span>
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}

function GroupRow({ label }: { label: string }) {
  return (
    <tr>
      <td
        colSpan={COL_COUNT}
        className="bg-neutral-50 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-600"
      >
        {label}
      </td>
    </tr>
  );
}
