'use client';

import { useState } from 'react';
import type { Campaign } from '../_lib/types';
import { PopupTemplate } from './PopupTemplate';
import { PromoBanner } from './PromoBanner';
import { CampaignArt, accentOf } from './CampaignArt';
import { hasPricingCardCopy, pricingCardOf } from '../_lib/pricing-card';
import { pricingCardOn } from '../_lib/types';

const TABS = ['popup', 'pricing', 'banner'] as const;
type Tab = (typeof TABS)[number];

const TAB_LABEL: Record<Tab, string> = { popup: 'Popup', pricing: 'Pricing', banner: 'Banner' };

export function PreviewPanel({ draft }: { draft: Campaign }) {
  const [tab, setTab] = useState<Tab>('popup');
  // 哪几栏有内容由各段的开关决定,不再按弹窗类型判断
  const isPromo = pricingCardOn(draft) || draft.pricingBanner.enabled;
  const shownTab: Tab = isPromo ? tab : 'popup';

  const bonus = draft.rule.kind === 'bonus_credits' ? draft.rule.percent : 0;
  const card = pricingCardOf(draft);
  const accent = accentOf(draft.art);
  const hasCopy = hasPricingCardCopy(draft);
  /* 有背景(配色或图)就先把卡片画出来 —— 否则选了配色预览毫无反应,看着像坏了。
     文案还没填时卡里给一行提示,说明它现在还不会出现在定价页,不假装已经配好。 */
  const hasBackdrop = Boolean(draft.pricingImage || (draft.art && draft.art !== 'none'));
  const showCard = hasCopy || hasBackdrop;
  const baseCredits = 22800;
  const basePrice = 14;

  return (
    <aside className="flex w-full flex-col rounded-2xl border border-[#ececf1] bg-[#faf8f6] p-4 lg:w-[520px]">
      <div className="flex gap-1 rounded-xl border border-[#ececf1] bg-white p-1">
        {(isPromo ? TABS : (['popup'] as const)).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
              shownTab === t ? 'bg-[#1a1a2e] text-white' : 'text-[#6a6b7b] hover:bg-[#f4f4f6]'
            }`}
          >
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>

      <div className="mt-4 flex-1">
        {shownTab === 'popup' ? (
          draft.popup.enabled ? (
            <div className="overflow-hidden rounded-[24px]">
              {/* 弹窗 520 宽,面板可用宽约 488,缩 0.93 —— 基本等于真实字号。
                  overlay 的 fixed 定位在这里要压成静态流,否则它会脱离面板铺满整个后台页面。 */}
              <div className="mx-auto w-[520px] origin-top" style={{ zoom: 0.93 }}>
                <div className="pointer-events-none [&>div]:!static [&>div]:!z-0 [&>div]:!bg-transparent [&>div]:!p-0 [&>div]:!backdrop-blur-none">
                  <PopupTemplate config={draft.popup} preview onClose={() => undefined} />
                </div>
              </div>
            </div>
          ) : (
            <p className="rounded-xl border border-[#ececf1] bg-white py-16 text-center text-sm text-[#9a9aa6]">
              Popup is turned off.
            </p>
          )
        ) : shownTab === 'pricing' ? (
          <div className="space-y-4 rounded-xl border border-[#ececf1] bg-white p-4">
            {/* 按定价页真实顺序排:标题 → 副标题 → 配图 → 计费切换 → 套餐卡 */}
            <div className="text-center">
              <p className="text-[15px] font-bold tracking-tight text-[#1a1a2e]">AI Ad Generator Pricing &amp; Plans</p>
              <p className="mt-1 text-[11.5px] text-[#9a9aa6]">
                Scale creativity with higher limits, priority access, and early features
              </p>
            </div>
            {showCard ? (
              <div className="relative overflow-hidden rounded-2xl bg-[#1a1020] p-4">
                {draft.pricingImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={draft.pricingImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <CampaignArt art={draft.art} className="absolute inset-0 h-full w-full" />
                )}
                <div
                  aria-hidden
                  className="absolute inset-0 bg-[linear-gradient(100deg,rgba(14,8,18,0.93)_0%,rgba(14,8,18,0.78)_52%,rgba(14,8,18,0.42)_100%)]"
                />
                <div className="relative">
                  {!hasCopy && (
                    <p className="rounded-lg border border-dashed border-white/35 px-3 py-2.5 text-center text-[11.5px] font-semibold text-white/75">
                      Add card copy to show this on the pricing page
                    </p>
                  )}
                  {card.tag && (
                    <span
                      className="inline-flex rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase italic tracking-wide text-white"
                      style={{ background: accent }}
                    >
                      {card.tag}
                    </span>
                  )}
                  {card.headline && (
                    <p className="mt-2 text-[15px] font-extrabold uppercase leading-tight" style={{ color: accent }}>
                      {card.headline}
                    </p>
                  )}
                  {card.subheadline && (
                    <p className="text-[13px] font-extrabold uppercase leading-tight text-white">{card.subheadline}</p>
                  )}
                  {card.note && <p className="mt-1.5 text-[11px] leading-snug text-white/70">{card.note}</p>}
                  {card.ctaText && (
                    <span className="mt-2.5 inline-flex rounded-full bg-white px-3 py-1 text-[11px] font-bold text-[#1a1020]">
                      {card.ctaText}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <p className="rounded-2xl border border-dashed border-[#e4e2e8] py-8 text-center text-[13px] text-[#9a9aa6]">
                Pick a color preset or upload an image to start the promo card.
              </p>
            )}
            <div className="flex justify-center">
              <div className="flex gap-1 rounded-full bg-[#f1f0f5] p-1 text-[11.5px] font-semibold">
                <span className="rounded-full px-3 py-1 text-[#6a6b7b]">Monthly</span>
                <span className="rounded-full bg-[#141420] px-3 py-1 text-white">Yearly</span>
              </div>
            </div>
            <div className="rounded-2xl border border-[#ececf1] bg-white p-4">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-bold text-[#1a1a2e]">Starter</span>
                {bonus > 0 && (
                  <span className="rounded-full bg-[#fff3ec] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#ff5e1a] ring-1 ring-[#ffc8b1]">
                    +{bonus}% credits
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-[28px] font-bold tracking-tight text-[#1a1a2e]">${basePrice}</span>
                <span className="text-xs text-[#6a6b7b]">/ mo</span>
              </div>
              <div className="mt-2 flex items-baseline gap-2 text-sm">
                {bonus > 0 && <span className="text-neutral-400 line-through">{baseCredits.toLocaleString()}</span>}
                <span className="font-bold text-[#1a1a2e]">
                  {Math.round(baseCredits * (1 + bonus / 100)).toLocaleString()}
                </span>
                <span className="text-xs text-[#6a6b7b]">credits/year</span>
              </div>
            </div>
          </div>
        ) : draft.pricingBanner.enabled ? (
          /* 放进一个页面缩略壳里看 —— 这条是通栏细条,脱离「页面最顶部」这个上下文就看不出它是什么 */
          <div className="overflow-hidden rounded-xl border border-[#ececf1] bg-white">
            <PromoBanner campaign={draft} preview />
            <div className="flex items-center justify-between border-b border-[#f1f1f4] px-4 py-3">
              <span className="text-[13px] font-extrabold tracking-tight text-[#1a1a2e]">BuzzVideo</span>
              <span className="rounded-full bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-3 py-1 text-[11px] font-bold text-white">
                Upgrade
              </span>
            </div>
            <div className="space-y-2 px-4 py-5">
              <div className="mx-auto h-3 w-2/3 rounded bg-[#f1f0f5]" />
              <div className="mx-auto h-2 w-1/2 rounded bg-[#f5f4f7]" />
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="h-16 rounded-lg bg-[#f5f4f7]" />
                <div className="h-16 rounded-lg bg-[#f5f4f7]" />
                <div className="h-16 rounded-lg bg-[#f5f4f7]" />
              </div>
            </div>
          </div>
        ) : (
          <p className="rounded-xl border border-[#ececf1] bg-white py-16 text-center text-sm text-[#9a9aa6]">
            Top banner is turned off.
          </p>
        )}
      </div>
    </aside>
  );
}
