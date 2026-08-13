'use client';

import { useState } from 'react';
import type { Campaign } from '../_lib/types';
import { PromoModal } from './PromoModal';
import { PromoBanner } from './PromoBanner';

const TABS = ['popup', 'pricing'] as const;
type Tab = (typeof TABS)[number];

export function PreviewPanel({ draft }: { draft: Campaign }) {
  const [tab, setTab] = useState<Tab>('popup');

  const bonus = draft.rule.kind === 'bonus_credits' ? draft.rule.percent : 0;
  const discount = draft.rule.kind === 'discount' ? draft.rule.percent : 0;
  const baseCredits = 22800;
  const basePrice = 14;

  return (
    <aside className="flex w-full flex-col rounded-2xl border border-[#ececf1] bg-[#faf8f6] p-4 lg:w-[420px]">
      <div className="flex gap-1 rounded-xl border border-[#ececf1] bg-white p-1">
        {TABS.map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold capitalize transition ${
              tab === t ? 'bg-[#1a1a2e] text-white' : 'text-[#6a6b7b] hover:bg-[#f4f4f6]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-4 flex-1 overflow-hidden rounded-xl border border-[#ececf1] bg-white p-3">
        {tab === 'popup' ? (
          draft.popup.enabled ? (
            <div className="relative h-[460px] overflow-hidden rounded-lg bg-[#31222c]/10">
              <div className="pointer-events-none origin-top-left scale-[0.42] [&>div]:!absolute [&>div]:!inset-0 [&>div]:!bg-transparent [&>div]:!backdrop-blur-none">
                <PromoModal config={draft.popup} onClose={() => undefined} />
              </div>
            </div>
          ) : (
            <p className="py-16 text-center text-sm text-[#9a9aa6]">Popup is turned off for this campaign.</p>
          )
        ) : (
          <div className="space-y-4">
            {draft.pricingBanner.enabled ? (
              <PromoBanner campaign={draft} />
            ) : (
              <p className="text-center text-sm text-[#9a9aa6]">Pricing banner is turned off.</p>
            )}
            <div className="rounded-2xl border border-[#ececf1] p-4">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-bold text-[#1a1a2e]">Starter</span>
                {bonus > 0 && <span className="rounded-full bg-[#fff3ec] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#ff5e1a] ring-1 ring-[#ffc8b1]">+{bonus}% credits</span>}
                {discount > 0 && <span className="rounded-full bg-[#fff3ec] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#ff5e1a] ring-1 ring-[#ffc8b1]">{discount}% OFF</span>}
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                {discount > 0 && <span className="text-[18px] font-bold text-neutral-400 line-through">${basePrice}</span>}
                <span className="text-[28px] font-bold tracking-tight text-[#1a1a2e]">
                  ${(basePrice * (1 - discount / 100)).toFixed(0)}
                </span>
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
        )}
      </div>
    </aside>
  );
}
