'use client';

import { useState } from 'react';
import { Home as HomeIcon } from 'lucide-react';
import Link from 'next/link';
import { usePricingState } from './_src/hooks/usePricingState';
import { useUserRole } from './_src/hooks/useUserRole';
import { Header } from './_src/components/sections/Header';
import { PlanCards } from './_src/components/sections/PlanCards';
import { TopUpPacks } from './_src/components/sections/TopUpPacks';
import { BusinessPlanCards, type SeatMap } from './_src/components/sections/BusinessPlanCards';
import { CompareFeatures } from './_src/components/sections/CompareFeatures';
import { BusinessCompareFeatures } from './_src/components/sections/BusinessCompareFeatures';
import { PlanGuide } from './_src/components/sections/PlanGuide';
import { BusinessPlanGuide } from './_src/components/sections/BusinessPlanGuide';
import { Faq } from './_src/components/sections/Faq';
import { FAQ_V15, FAQ_V15_LABELS, FAQ_V15_ORDER } from './_src/components/sections/faq-v15';
import { RolePicker, INDIVIDUAL_IDENTITIES, BUSINESS_IDENTITIES } from './_src/components/buzz-ui/RolePicker';
import { FeatureSectionsProvider } from './_src/lib/pricing/features-context';
import { FEATURE_SECTIONS } from './_src/lib/pricing/features-v2';
import {
  BUSINESS_PLANS,
  type BusinessPlanId,
  type PlanGroup,
} from './_src/lib/pricing/business';

const V2_EXTRA_ROWS = [
  { label: 'Web Explore', values: ['✗', '✓', '✓', '✓'] as [string, string, string, string] },
  { label: 'Parallel Generations', values: ['1 at a time', 'Up to 4', 'Up to 8', 'Up to 12'] as [string, string, string, string] },
  { label: 'Processing Speed', values: ['Standard', 'Fast', 'Fast', 'Fast'] as [string, string, string, string] },
];

type RowValues = typeof FEATURE_SECTIONS[number]['rows'][number]['values'];

// 模型行用 kind: 'full' → 渲染成绿色 Unlimited 徽章，跟同栏其它模型一致
/** Free 不可用，付费套餐 Unlimited */
const MODEL_PAID_ONLY: RowValues = {
  free: { kind: 'no' },
  starter: { kind: 'full' },
  pro: { kind: 'full' },
  ultra: { kind: 'full' },
};
/** Free / Starter 不可用，Pro 起 Unlimited */
const MODEL_PRO_AND_UP: RowValues = {
  free: { kind: 'no' },
  starter: { kind: 'no' },
  pro: { kind: 'full' },
  ultra: { kind: 'full' },
};

/**
 * 在某一行后面插入新行。不传 values 时沿用相邻行的权益（v1.3 那批模型就是这么加的）。
 */
function insertAfter(
  rows: typeof FEATURE_SECTIONS[number]['rows'],
  afterLabel: string,
  newLabel: string,
  values?: RowValues,
) {
  const i = rows.findIndex(r => r.label === afterLabel);
  const anchor = i >= 0 ? i : rows.length - 1;
  rows.splice(anchor + 1, 0, { label: newLabel, values: values ?? rows[anchor].values });
}
// v1.5 隐藏这几行（其余版本保留）
const V15_HIDDEN_ROWS = new Set([
  'Long Video Generation (Early Access)',
  'Character Customization (Seedance 2.0)',
]);

const V15_FEATURE_SECTIONS = FEATURE_SECTIONS.map(section => ({
  ...section,
  rows: section.rows.filter(r => !V15_HIDDEN_ROWS.has(r.label)),
})).map(section => {
  // v1.5 新增 Web Explore，放在 Parallel Generations 之前
  if (section.title === 'Key Features') {
    const rows = [...section.rows];
    const i = rows.findIndex(r => r.label === 'Parallel Generations');
    rows.splice(i < 0 ? rows.length : i, 0, {
      label: 'Web Explore',
      values: {
        free: { kind: 'no' },
        starter: { kind: 'yes' },
        pro: { kind: 'yes' },
        ultra: { kind: 'yes' },
      },
    });
    return { ...section, rows };
  }
  if (section.title === 'Image Models') {
    const rows = [...section.rows];
    insertAfter(rows, 'Nano Banana 2', 'Nano Banana 2 Lite');
    // v1.5 新增：Free 不可用，其余套餐可用
    insertAfter(rows, 'Seedream 5.0 Lite', 'Seedream 5.0 Pro', MODEL_PAID_ONLY);
    return { ...section, rows };
  }
  if (section.title === 'Video Models') {
    const rows = [...section.rows];
    insertAfter(rows, 'Seedance 2.0 Fast', 'Seedance 2.0 Mini');
    insertAfter(rows, 'Kling 3.0', 'Gemini Omni Flash');
    // v1.5 新增：Free / Starter 不可用，Pro 和 Ultra 可用
    insertAfter(rows, 'Seedance 2.0 Mini', 'Seedance 2.5', MODEL_PRO_AND_UP);
    return { ...section, rows };
  }
  return section;
});

const V15_NOTES = [
  'Credits are issued monthly on all plans, whether billed monthly or annually.',
  'Credits reset at the beginning of each monthly cycle.',
  'All models consume credits. Credit cost per generation varies by model and output settings.',
];

const DEFAULT_SEATS: SeatMap = {
  team: BUSINESS_PLANS.team.pricingModel === 'per-seat' ? BUSINESS_PLANS.team.seats.default : 0,
  scale: BUSINESS_PLANS.scale.pricingModel === 'per-seat' ? BUSINESS_PLANS.scale.seats.default : 0,
  enterprise: 0,
};

export default function V5Page() {
  const state = usePricingState();
  const { role, setRole, businessRole, setBusinessRole } = useUserRole();
  const [group, setGroup] = useState<PlanGroup>('individual');
  const [seats, setSeats] = useState<SeatMap>(DEFAULT_SEATS);

  const setSeatsFor = (plan: BusinessPlanId, n: number) =>
    setSeats(prev => ({ ...prev, [plan]: n }));

  const isBusiness = group === 'business';

  return (
    <FeatureSectionsProvider value={V15_FEATURE_SECTIONS}>
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
        <Header
          cycle={state.cards.cycle}
          onCycleChange={state.cards.setCycle}
          role={role}
          group={group}
          onGroupChange={setGroup}
          savingLabel="30% OFF"
        />
        <section id="plans">
          {isBusiness ? (
            <BusinessPlanCards
              cycle={state.cards.cycle}
              seats={seats}
              onSeatsChange={setSeatsFor}
              currentPlan={businessRole}
            />
          ) : (
            <PlanCards
              region={state.cards}
              role={role}
              showNoCardNote
              notes={V15_NOTES}
              monthlyCredits
            />
          )}
        </section>
        {isBusiness ? (
          <BusinessCompareFeatures
            cycle={state.cmp.cycle}
            onCycleChange={state.cmp.setCycle}
            savingLabel="30% OFF"
          />
        ) : (
          <CompareFeatures
            region={state.cmp}
            extraAvatarRows={V2_EXTRA_ROWS}
            showV13Models
            showV15Models
            hideRows={[...V15_HIDDEN_ROWS]}
            monthlyCredits
            mergeAvatarGroup
          />
        )}
        {/* 只有 Business 有 top-up —— 个人档额度不够走升档 */}
        {isBusiness && <TopUpPacks />}
        {isBusiness ? <BusinessPlanGuide /> : <PlanGuide />}
        <Faq items={FAQ_V15} order={FAQ_V15_ORDER} labels={FAQ_V15_LABELS} />
      </main>
      {/* 身份预览跟随当前 tab —— Individual 看个人订阅态,Business 看团队订阅态 */}
      {isBusiness ? (
        <RolePicker
          role={businessRole}
          setRole={setBusinessRole}
          identities={BUSINESS_IDENTITIES}
          hint="Preview the page as a team on each business plan"
        />
      ) : (
        <RolePicker
          role={role}
          setRole={setRole}
          identities={INDIVIDUAL_IDENTITIES}
          hint="Preview the page as an individual on each plan"
        />
      )}

      <Link
        href="/"
        aria-label="Back to home"
        className="hidden md:flex fixed top-4 left-4 z-50 w-10 h-10 rounded-full bg-white border border-neutral-200 text-[#0a0a0a] shadow-md hover:scale-105 transition-transform items-center justify-center"
      >
        <HomeIcon className="w-4 h-4" />
      </Link>
    </FeatureSectionsProvider>
  );
}
