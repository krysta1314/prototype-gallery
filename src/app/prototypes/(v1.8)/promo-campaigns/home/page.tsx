'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { useCampaigns, SEEN_KEY } from '../_lib/store';
import { popupCampaign } from '../_lib/apply';
import { PopupTemplate } from '../_components/PopupTemplate';
import { ViewBar } from '../_components/ViewBar';

const APPLE_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif';

type SeenMap = Record<string, { count: number; lastShownAt: number }>;

function readSeen(): SeenMap {
  try {
    return JSON.parse(window.localStorage.getItem(SEEN_KEY) ?? '{}') as SeenMap;
  } catch {
    return {};
  }
}

function PromoHomeInner() {
  const { campaigns, ready } = useCampaigns();
  /* ?popup=<id> 来自后台的「Open on client」:强制显示这一个弹窗,绕过状态、优先级与频控。
     没有它的话,后台改的是一个 Scheduled/Draft 或低优先级的弹窗,前端显示的却是当前生效的那个,
     看起来就像「保存没生效」。 */
  const forcedId = useSearchParams()?.get('popup') ?? null;
  const [now, setNow] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  // now 在 effect 里取，避免 SSR/hydration 不一致；一次性挂载标记，非订阅回调
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setNow(Date.now()), []);

  const campaign = useMemo(() => {
    if (!ready || now === null) return null;
    if (forcedId) return campaigns.find(c => c.id === forcedId) ?? null;
    return popupCampaign(campaigns, now);
  }, [campaigns, ready, now, forcedId]);

  // 强制预览时直接开,不走频控
  useEffect(() => {
    if (forcedId && campaign) setOpen(true);
  }, [forcedId, campaign]);

  // 只依赖原始值（id + 频控字段），而不是 campaign 对象引用本身：
  // useCampaigns() 的 sync() 每次都会用新对象 setCampaigns，哪怕改动的是别的活动，
  // campaigns/campaign 也会换新引用；若 effect 依赖 campaign 对象，会被这种无关更新重复触发，
  // 导致弹窗被误判为"新访问"而重新弹出、频控计数被重复累加。
  const campaignId = campaign?.id;
  const maxPerUser = campaign?.frequency.maxPerUser;
  const intervalDays = campaign?.frequency.intervalDays;

  useEffect(() => {
    if (forcedId) return;
    if (campaignId === undefined || maxPerUser === undefined || intervalDays === undefined || now === null) return;
    const seenMap = readSeen();
    const seen = seenMap[campaignId];
    const withinInterval = seen !== undefined && now - seen.lastShownAt < intervalDays * 86_400_000;
    const overCount = seen !== undefined && seen.count >= maxPerUser;
    // 频控语义：同一活动最多自动弹 maxPerUser 次，且两次自动弹出间至少隔 intervalDays 天；
    // 任一条件不满足就不弹（OR），而不是两个条件同时满足才不弹（AND 会导致次数早已超限但间隔已过时仍继续弹并累加计数）
    if (withinInterval || overCount) return;
    // 触发一次性自动弹窗，同步 localStorage 频控计数，非订阅回调
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(true);
    seenMap[campaignId] = { count: (seen?.count ?? 0) + 1, lastShownAt: now };
    window.localStorage.setItem(SEEN_KEY, JSON.stringify(seenMap));
  }, [campaignId, maxPerUser, intervalDays, now, forcedId]);

  return (
    <main style={{ fontFamily: APPLE_FONT }} className="min-h-screen bg-[#faf8f6] pb-24">
      <ViewBar />
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

      {open && campaign && <PopupTemplate config={campaign.popup} onClose={() => setOpen(false)} />}
    </main>
  );
}

export default function PromoHomePage() {
  return (
    <Suspense fallback={null}>
      <PromoHomeInner />
    </Suspense>
  );
}
