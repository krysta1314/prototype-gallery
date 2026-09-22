'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
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

/** 相对亮度,用来决定文字取黑还是白 —— 底色让运营自己填,不能假设它是深色 */
function isDark(hex: string): boolean {
  const h = hex.replace('#', '');
  if (h.length !== 6) return true;
  const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
  const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b) < 0.45;
}

/** 关掉过的横幅记在本地,不能每次刷新又冒出来 —— 那是最招人烦的公告条 */
const DISMISS_KEY = 'buzz-promo-banner-dismissed';

function readDismissed(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = JSON.parse(window.localStorage.getItem(DISMISS_KEY) ?? '[]');
    return Array.isArray(raw) ? (raw as string[]) : [];
  } catch {
    return [];
  }
}

export function PromoBanner({ campaign, preview = false }: { campaign: Campaign; preview?: boolean }) {
  const [dismissed, setDismissed] = useState(false);

  // 预览里不读本地关闭记录,否则后台会看不到自己刚配的横幅
  useEffect(() => {
    if (preview) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 一次性读取,非订阅回调
    setDismissed(readDismissed().includes(campaign.id));
  }, [campaign.id, preview]);
  const [msLeft, setMsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!campaign.pricingBanner.showCountdown) return;
    // 倒计时的两个时刻:没配就跟随活动的开始/结束时间
    const end = new Date(campaign.pricingBanner.countdownTo || campaign.endAt).getTime();
    const tick = () => setMsLeft(end - Date.now());
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [campaign.endAt, campaign.pricingBanner.countdownTo, campaign.pricingBanner.showCountdown]);

  /* 倒计时只在窗口内显示:早于开始时刻不挂(否则预热期就一直摆在页面上),
     归零之后也不挂(不倒成负数)。 */
  const startsAt = new Date(campaign.pricingBanner.countdownFrom || campaign.startAt).getTime();
  const countdownLive =
    campaign.pricingBanner.showCountdown &&
    msLeft !== null &&
    msLeft > 0 &&
    (Number.isNaN(startsAt) || Date.now() >= startsAt);

  const bg = campaign.pricingBanner.bg || '#FF5E1A';
  const dark = isDark(bg);
  const ink = dark ? '#ffffff' : '#1a1a2e';

  if (dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    if (preview) return;
    const next = Array.from(new Set([...readDismissed(), campaign.id]));
    window.localStorage.setItem(DISMISS_KEY, JSON.stringify(next));
  };

  return (
    <div className="w-full" style={{ background: bg, color: ink }}>
      {/* 页面最顶部的通栏细条:在导航之上、通栏出血,所以这里不做圆角也不做外边距。
          文案和倒计时是一组(倒计时是在说这句话还剩多久),CTA 单独靠右 —— 它是出口,不是这句话的一部分。 */}
      <div className="relative flex w-full flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6 lg:px-8">
        {/* 文案 + 倒计时居中;CTA 和关闭在 sm+ 上用绝对定位钉在右侧,
            这样中间那组是相对整条居中,而不是「剩余空间」的居中(否则 CTA 一变长中间就会偏)。
            窄屏回到普通流,允许换行,避免两组叠在一起。 */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:mx-auto">
          <p className="text-[14.5px] font-bold tracking-tight">{campaign.pricingBanner.text}</p>

          {countdownLive && msLeft !== null && (
            <div className="flex items-center gap-1.5">
              {parts(msLeft).map(({ value, label }) => (
                <div
                  key={label}
                  className="min-w-[46px] rounded-lg px-2 py-1 text-center"
                  style={{ background: dark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.75)' }}
                >
                  <div className="text-[15px] font-extrabold tabular-nums leading-none">{value}</div>
                  <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider opacity-70">{label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CTA 顶到最右,关闭键再靠右一格 —— 关闭是退出动作,永远在最边上 */}
        <div className="ml-auto flex shrink-0 items-center gap-2 sm:absolute sm:right-6 sm:top-1/2 sm:ml-0 sm:-translate-y-1/2 lg:right-8">
          {campaign.pricingBanner.ctaText && (
            <a
              href={campaign.pricingBanner.ctaHref || '#plans'}
              className="shrink-0 rounded-full px-4 py-2 text-[13px] font-bold transition hover:opacity-90"
              style={{ background: ink, color: bg }}
            >
              {campaign.pricingBanner.ctaText}
            </a>
          )}

          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss this banner"
            title="Dismiss"
            className="grid size-8 place-items-center rounded-full transition hover:bg-black/10"
            style={{ color: ink, background: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)' }}
          >
            <X className="size-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
