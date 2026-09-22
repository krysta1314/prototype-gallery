'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Home as HomeIcon, Tag } from 'lucide-react';
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
import { bannerCampaign, buildPromoEffect, effectFromCampaign } from '../_lib/apply';
import { hasPricingCardCopy, pricingCardOf } from '../_lib/pricing-card';
import { pricingCardOn } from '../_lib/types';
import { PromoBanner } from '../_components/PromoBanner';
import { CampaignArt, accentOf } from '../_components/CampaignArt';
import { ViewBar } from '../_components/ViewBar';

const V13_EXTRA_ROWS = [
  { label: 'Parallel Generations', values: ['1 at a time', 'Up to 4', 'Up to 8', 'Up to 12'] as [string, string, string, string] },
  { label: 'Processing Speed', values: ['Standard', 'Fast', 'Fast', 'Fast'] as [string, string, string, string] },
];

function PromoPricingInner() {
  /* ?promo=<id> 来自后台的「Open on client」:强制用这一个活动渲染卡片、横幅和套餐卡效果,
     绕过状态与优先级 —— 否则后台改的是一个还没到期的活动,前端显示的是另一个,看着像没保存。 */
  const forcedId = useSearchParams()?.get('promo') ?? null;
  const state = usePricingState();
  const { role, setRole } = useUserRole();
  const { campaigns, ready } = useCampaigns();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    // 一次性挂载标记，避免 SSR/CSR 首帧读 Date.now() 不一致；非订阅回调
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
  }, []);

  const forced = useMemo(
    () => (forcedId ? campaigns.find(c => c.id === forcedId) ?? null : null),
    [campaigns, forcedId],
  );
  const effect = useMemo(() => {
    if (!ready || now === null) return null;
    if (forced) return effectFromCampaign(forced);
    return buildPromoEffect(campaigns, now);
  }, [campaigns, ready, now, forced]);
  const banner = useMemo(() => {
    if (!ready || now === null) return null;
    if (forced) return forced;
    return bannerCampaign(campaigns, now);
  }, [campaigns, ready, now, forced]);

  const card = banner ? pricingCardOf(banner) : null;
  const accent = accentOf(banner?.art);
  const showCard = Boolean(banner && pricingCardOn(banner) && hasPricingCardCopy(banner));
  const bonusPercent = banner?.rule.kind === 'bonus_credits' ? banner.rule.percent : 0;

  return (
    <FeatureSectionsProvider value={FEATURE_SECTIONS}>
      <PromoProvider value={effect}>
        <ViewBar />
        {/* 通栏细条钉在页面最顶部,在页面内容之上 —— 它不属于 main 的排版容器 */}
        {banner && <PromoBanner campaign={banner} />}
        <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-16 pb-24">
          <Header
            cycle={state.cards.cycle}
            onCycleChange={state.cards.setCycle}
            role={role}
            hero={
              /* 活动卡:参考竞品那版做成有边界的深色卡片(不再通栏出血)。
                 标签 → 力度大标题 → 约束副标题 → 说明 → CTA,层级由上到下一条线。
                 文案全部从活动数据推导,运营不用另写一份;有上传图就当背景并压暗,保证白字对比度。 */
              banner && showCard ? (
                <div className="relative mt-8 overflow-hidden rounded-[26px] bg-[#1a1020] p-6 text-left sm:p-8">
                  {banner.pricingImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={banner.pricingImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <CampaignArt art={banner.art} className="absolute inset-0 h-full w-full" />
                  )}
                  {/* 压暗 + 细点阵纹理:素材深浅不定,白字不能假设底色暗 */}
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-[linear-gradient(100deg,rgba(14,8,18,0.93)_0%,rgba(14,8,18,0.78)_52%,rgba(14,8,18,0.42)_100%)]"
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0 opacity-[0.35] [background-image:radial-gradient(rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:9px_9px]"
                  />

                  <div className="relative">
                    {card?.tag && (
                      <span
                        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-extrabold uppercase italic tracking-wide text-white"
                        style={{ background: accent }}
                      >
                        <Tag className="size-3" /> {card.tag}
                      </span>
                    )}

                    {card?.headline && (
                      <h2
                        className="mt-4 text-[26px] font-extrabold uppercase leading-[1.05] tracking-tight sm:text-[34px]"
                        style={{ color: accent }}
                      >
                        {card.headline}
                      </h2>
                    )}
                    {card?.subheadline && (
                      <p className="text-[22px] font-extrabold uppercase leading-[1.1] tracking-tight text-white sm:text-[28px]">
                        {card.subheadline}
                      </p>
                    )}

                    {card?.note && (
                      <p className="mt-3 text-[13.5px] text-white/70 sm:text-[15px]">{card.note}</p>
                    )}

                    {card?.ctaText && (
                      <a
                        href={card.ctaHref || '#plans'}
                        className="mt-5 inline-flex rounded-full bg-white px-5 py-2.5 text-[14px] font-bold text-[#1a1020] transition hover:bg-white/90"
                      >
                        {card.ctaText}
                      </a>
                    )}
                  </div>
                </div>
              ) : null
            }
          />
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
        </PromoProvider>
    </FeatureSectionsProvider>
  );
}

export default function PromoPricingPage() {
  return (
    <Suspense fallback={null}>
      <PromoPricingInner />
    </Suspense>
  );
}
