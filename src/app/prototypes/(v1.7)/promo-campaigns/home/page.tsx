'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { useCampaigns } from '../_lib/store';
import { popupCampaign } from '../_lib/apply';
import { PromoModal } from '../_components/PromoModal';

const APPLE_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif';
const SEEN_KEY = 'buzz-promo-seen';

type SeenMap = Record<string, { count: number; lastShownAt: number }>;

function readSeen(): SeenMap {
  try {
    return JSON.parse(window.localStorage.getItem(SEEN_KEY) ?? '{}') as SeenMap;
  } catch {
    return {};
  }
}

export default function PromoHomePage() {
  const { campaigns, ready } = useCampaigns();
  const [now, setNow] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  // now 在 effect 里取，避免 SSR/hydration 不一致；一次性挂载标记，非订阅回调
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setNow(Date.now()), []);

  const campaign = useMemo(
    () => (ready && now !== null ? popupCampaign(campaigns, now) : null),
    [campaigns, ready, now],
  );

  useEffect(() => {
    if (!campaign || now === null) return;
    const seen = readSeen()[campaign.id];
    const withinInterval =
      seen !== undefined && now - seen.lastShownAt < campaign.frequency.intervalDays * 86_400_000;
    const overCount = seen !== undefined && seen.count >= campaign.frequency.maxPerUser;
    if (withinInterval && overCount) return;
    // 触发一次性自动弹窗，同步 localStorage 频控计数，非订阅回调
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(true);
    const next = readSeen();
    next[campaign.id] = { count: (seen?.count ?? 0) + 1, lastShownAt: now };
    window.localStorage.setItem(SEEN_KEY, JSON.stringify(next));
  }, [campaign, now]);

  return (
    <main style={{ fontFamily: APPLE_FONT }} className="min-h-screen bg-[#faf8f6]">
      <header className="flex items-center justify-between border-b border-[#ececf1] bg-white px-6 py-4">
        <span className="text-[17px] font-extrabold tracking-tight text-[#1a1a2e]">BuzzVideo</span>
        <Link href="/prototypes/promo-campaigns/pricing" className="rounded-full bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-4 py-2 text-sm font-bold text-white">
          Upgrade
        </Link>
      </header>

      <section className="mx-auto max-w-[720px] px-6 py-24 text-center">
        <h1 className="text-[clamp(34px,6vw,56px)] font-extrabold leading-[1.08] tracking-tight text-[#1a1a2e]">
          Your ideas, campaign-ready in seconds
        </h1>
        <p className="mt-4 text-[17px] text-[#6a6b7b]">
          Describe your product and let the Marketing Agent build the whole campaign.
        </p>
        <div className="mt-8 flex items-center gap-3 rounded-2xl border border-[#ececf1] bg-white p-3 shadow-sm">
          <input
            className="flex-1 bg-transparent px-3 text-[15px] text-[#1a1a2e] outline-none placeholder:text-[#a3a3ae]"
            placeholder="Create a 15s vertical ad for my skincare brand…"
          />
          <button type="button" className="rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-5 py-2.5 text-sm font-bold text-white">
            Create
          </button>
        </div>

        {campaign && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-10 inline-flex items-center gap-2 rounded-full border border-[#ffc8b1] bg-white px-5 py-2.5 text-sm font-bold text-[#ed6547] transition hover:border-[#ef7a5b]"
          >
            <Sparkles className="size-4" />
            Show offer
          </button>
        )}
      </section>

      {open && campaign && <PromoModal config={campaign.popup} onClose={() => setOpen(false)} />}
    </main>
  );
}
