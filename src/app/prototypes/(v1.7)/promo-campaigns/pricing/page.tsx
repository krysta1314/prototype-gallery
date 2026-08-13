'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Home as HomeIcon } from 'lucide-react';
import { usePricingState } from '../../pricing/_src/hooks/usePricingState';
import { useUserRole } from '../../pricing/_src/hooks/useUserRole';
import { Header } from '../../pricing/_src/components/sections/Header';
import { PlanCards } from '../../pricing/_src/components/sections/PlanCards';
import { CompareFeatures } from '../../pricing/_src/components/sections/CompareFeatures';
import { PlanGuide } from '../../pricing/_src/components/sections/PlanGuide';
import { Faq } from '../../pricing/_src/components/sections/Faq';
import { RolePicker } from '../../pricing/_src/components/buzz-ui/RolePicker';
import { FeatureSectionsProvider } from '../../pricing/_src/lib/pricing/features-context';
import { FEATURE_SECTIONS } from '../../pricing/_src/lib/pricing/features-v2';
import { PromoProvider } from '../../pricing/_src/lib/pricing/promo-context';
import { useCampaigns } from '../_lib/store';
import { bannerCampaign, buildPromoEffect } from '../_lib/apply';
import { PromoBanner } from '../_components/PromoBanner';

const V13_EXTRA_ROWS = [
  { label: 'Parallel Generations', values: ['1 at a time', 'Up to 4', 'Up to 8', 'Up to 12'] as [string, string, string, string] },
  { label: 'Processing Speed', values: ['Standard', 'Fast', 'Fast', 'Fast'] as [string, string, string, string] },
];

export default function PromoPricingPage() {
  const state = usePricingState();
  const { role, setRole } = useUserRole();
  const { campaigns, ready } = useCampaigns();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    // 一次性挂载标记，避免 SSR/CSR 首帧读 Date.now() 不一致；非订阅回调
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
  }, []);

  const effect = useMemo(
    () => (ready && now !== null ? buildPromoEffect(campaigns, now) : null),
    [campaigns, ready, now],
  );
  const banner = useMemo(
    () => (ready && now !== null ? bannerCampaign(campaigns, now) : null),
    [campaigns, ready, now],
  );

  return (
    <FeatureSectionsProvider value={FEATURE_SECTIONS}>
      <PromoProvider value={effect}>
        <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
          {banner && <PromoBanner campaign={banner} />}
          <Header cycle={state.cards.cycle} onCycleChange={state.cards.setCycle} role={role} />
          <section id="plans">
            <PlanCards region={state.cards} role={role} />
          </section>
          <CompareFeatures region={state.cmp} extraAvatarRows={V13_EXTRA_ROWS} showV13Models />
          <PlanGuide />
          <Faq />
        </main>
        <RolePicker role={role} setRole={setRole} />
        <Link
          href="/"
          aria-label="Back to home"
          className="hidden md:flex fixed top-4 left-4 z-50 w-10 h-10 rounded-full bg-white border border-neutral-200 text-[#0a0a0a] shadow-md hover:scale-105 transition-transform items-center justify-center"
        >
          <HomeIcon className="w-4 h-4" />
        </Link>
      </PromoProvider>
    </FeatureSectionsProvider>
  );
}
