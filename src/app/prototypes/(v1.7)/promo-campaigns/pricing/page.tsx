'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Home as HomeIcon } from 'lucide-react';
import { usePricingState } from '../../../(v1.6)/pricing/_src/hooks/usePricingState';
import { useUserRole } from '../../../(v1.6)/pricing/_src/hooks/useUserRole';
import { Header } from '../../../(v1.6)/pricing/_src/components/sections/Header';
import { PlanCards } from '../../../(v1.6)/pricing/_src/components/sections/PlanCards';
import { CompareFeatures } from '../../../(v1.6)/pricing/_src/components/sections/CompareFeatures';
import { PlanGuide } from '../../../(v1.6)/pricing/_src/components/sections/PlanGuide';
import { Faq } from '../../../(v1.6)/pricing/_src/components/sections/Faq';
import { RolePicker, INDIVIDUAL_IDENTITIES } from '../../../(v1.6)/pricing/_src/components/buzz-ui/RolePicker';
import { FeatureSectionsProvider } from '../../../(v1.6)/pricing/_src/lib/pricing/features-context';
import { FEATURE_SECTIONS } from '../../../(v1.6)/pricing/_src/lib/pricing/features-v2';
import { PromoProvider } from '../../../(v1.6)/pricing/_src/lib/pricing/promo-context';
import { useCampaigns } from '../_lib/store';
import { bannerCampaign, buildPromoEffect } from '../_lib/apply';
import { PromoBanner } from '../_components/PromoBanner';
import { CampaignArt } from '../_components/CampaignArt';
import { DemoBar } from '../_components/DemoBar';
import { ViewBar } from '../_components/ViewBar';

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
        <ViewBar />
        <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-16 pb-24">
          {/* 活动配图:banner 之上再压一张图,活动 live 才出现,没配图的活动不占位 */}
          {banner?.art && banner.art !== 'none' && (
            <div className="relative mb-4 overflow-hidden rounded-3xl">
              <CampaignArt art={banner.art} className="h-[150px] w-full sm:h-[190px]" />
              <div className="absolute inset-0 flex items-end p-5 sm:p-7">
                <p className="max-w-[26ch] text-[22px] font-extrabold leading-tight tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)] sm:text-[30px]">
                  {banner.name}
                </p>
              </div>
            </div>
          )}
          {banner && <PromoBanner campaign={banner} />}
          <Header cycle={state.cards.cycle} onCycleChange={state.cards.setCycle} role={role} />
          <section id="plans">
            <PlanCards region={state.cards} role={role} />
          </section>
          <CompareFeatures region={state.cmp} extraAvatarRows={V13_EXTRA_ROWS} showV13Models />
          <PlanGuide />
          <Faq />
        </main>
        <RolePicker role={role} setRole={setRole} identities={INDIVIDUAL_IDENTITIES} />
        <Link
          href="/"
          aria-label="Back to home"
          className="hidden md:flex fixed top-4 left-4 z-50 w-10 h-10 rounded-full bg-white border border-neutral-200 text-[#0a0a0a] shadow-md hover:scale-105 transition-transform items-center justify-center"
        >
          <HomeIcon className="w-4 h-4" />
        </Link>
        <DemoBar />
      </PromoProvider>
    </FeatureSectionsProvider>
  );
}
