'use client';

import { useEffect, useState } from 'react';
import type { Campaign } from '../_lib/types';

function parts(msLeft: number) {
  const s = Math.max(0, Math.floor(msLeft / 1000));
  return [
    { value: String(Math.floor(s / 86400)).padStart(2, '0'), label: 'Days' },
    { value: String(Math.floor((s % 86400) / 3600)).padStart(2, '0'), label: 'Hours' },
    { value: String(Math.floor((s % 3600) / 60)).padStart(2, '0'), label: 'Mins' },
    { value: String(s % 60).padStart(2, '0'), label: 'Secs' },
  ];
}

export function PromoBanner({ campaign }: { campaign: Campaign }) {
  const [msLeft, setMsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!campaign.pricingBanner.showCountdown) return;
    const end = new Date(campaign.endAt).getTime();
    const tick = () => setMsLeft(end - Date.now());
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [campaign.endAt, campaign.pricingBanner.showCountdown]);

  return (
    <div className="mb-6 flex flex-col items-center justify-between gap-3 rounded-2xl border border-[#ffc8b1] bg-[linear-gradient(120deg,#fff3ec_0%,#ffe7d6_100%)] px-5 py-4 sm:flex-row">
      <p className="text-[15px] font-bold tracking-tight text-[#1a1a2e]">{campaign.pricingBanner.text}</p>
      {campaign.pricingBanner.showCountdown && msLeft !== null && (
        <div className="flex items-center gap-2">
          {parts(msLeft).map(({ value, label }) => (
            <div key={label} className="min-w-[52px] rounded-xl bg-white px-2.5 py-1.5 text-center shadow-sm">
              <div className="text-[18px] font-extrabold tabular-nums leading-none text-[#ff5e1a]">{value}</div>
              <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#6a6b7b]">{label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
