'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import localFont from 'next/font/local';
import type { PopupConfig } from '../_lib/types';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const bricolageExtraBold = localFont({
  src: '../../../../fonts/BricolageGrotesque-ExtraBold.ttf',
  display: 'swap',
});

const BACKGROUND = '/prototypes/homepage/new-model-festival-light-bg.png';
const SPARKLE = '/prototypes/homepage/member-sparkle.svg';
const ICON_SRC = {
  image: '/prototypes/starter-guide/icons/ai-image.svg',
  video: '/prototypes/starter-guide/icons/ai-video.svg',
} as const;

export function PromoModal({ config, onClose }: { config: PopupConfig; onClose: () => void }) {
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  // 焦点管理：打开时把焦点移进弹窗；Tab/Shift+Tab 在弹窗内循环（焦点陷阱）；卸载时把焦点还给打开前的触发元素
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        el => el.offsetParent !== null || el === document.activeElement,
      );
      if (focusable.length === 0) {
        e.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (e.shiftKey) {
        if (active === first || !dialog.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last || !dialog.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus();
    };
  }, []);

  const single = config.highlights.length <= 1;

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-[#31222c]/35 p-3 backdrop-blur-[3px] sm:p-6"
      role="presentation"
      onClick={onClose}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="promo-modal-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[650px] overflow-hidden rounded-[32px] border border-[#ffc8b1] bg-[#fffaf8] text-[#1a1a2e] shadow-[0_28px_90px_rgba(61,34,43,0.36)] outline-none sm:scale-[0.75] sm:rounded-[38px]"
      >
        <Image src={BACKGROUND} alt="" fill priority sizes="(max-width: 680px) 100vw, 650px" className="pointer-events-none object-cover" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,250,248,0.4)_36%,rgba(255,250,248,0.58))]" />

        <button
          type="button"
          onClick={onClose}
          aria-label="Close offer"
          className="absolute right-4 top-4 z-20 grid size-11 place-items-center rounded-full border border-[#f8c3b1] bg-white/85 text-3xl font-light leading-none text-[#645767] shadow-sm transition hover:scale-105 hover:border-[#ef7a5b] sm:right-6 sm:top-6 sm:size-14 sm:text-4xl"
        >
          <span aria-hidden className="-mt-1">×</span>
        </button>

        <div className="relative z-10 flex min-h-[min(437px,calc(100svh-24px))] flex-col px-5 pb-4 pt-8 sm:min-h-[760px] sm:px-10 sm:pb-10 sm:pt-[108px]">
          <div className="mx-auto flex flex-wrap justify-center gap-1.5 sm:gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ff9a78] bg-white/85 px-3 py-1.5 text-[9px] font-black tracking-[0.15em] text-[#ed6547] shadow-[0_4px_16px_rgba(244,118,82,0.2)] sm:gap-2 sm:px-5 sm:py-2.5 sm:text-[13px] sm:tracking-[0.19em]">
              {config.badgeLeft}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ff9a78] bg-white/85 px-3 py-1.5 text-[9px] font-black tracking-[0.15em] text-[#3c3440] shadow-[0_4px_16px_rgba(244,118,82,0.2)] sm:gap-2 sm:px-5 sm:py-2.5 sm:text-[13px] sm:tracking-[0.19em]">
              {config.badgeRight}
            </span>
          </div>

          <div className="mt-4 border-t border-[#f6ae97]/80 pt-3 text-center sm:mt-5 sm:pt-4">
            <p className="mx-auto w-fit max-w-full whitespace-nowrap bg-gradient-to-br from-[#ff5255] via-[#ff7652] to-[#ffa73c] bg-clip-text px-2 py-1 text-[clamp(75px,16vw,120px)] font-bold leading-[1.06] tracking-[-0.08em] text-transparent drop-shadow-[0_8px_30px_rgba(255,112,76,0.2)] sm:px-2 sm:py-2 sm:text-[clamp(120px,24vw,210px)] sm:leading-none">
              {config.headlineNumber}
            </p>
            <h2 id="promo-modal-title" className={`${bricolageExtraBold.className} mt-3 text-[clamp(32px,7.5vw,48px)] font-bold leading-none tracking-[-0.065em] text-[#1a1a2e] sm:mt-4 sm:text-[clamp(38px,8.2vw,64px)]`}>
              {config.headlineText}
            </h2>
          </div>

          <div className={`mt-4 grid gap-3 sm:-mx-4 sm:mt-5 sm:gap-4 ${single ? '' : 'sm:grid-cols-2'}`}>
            {config.highlights.map(({ name, status, icon }) => {
              const active = status === 'LIVE NOW';
              return (
                <div key={name} className="flex min-h-[104px] items-center gap-4 rounded-[22px] border border-[#ffc1aa] bg-white/75 px-4 py-2.5 shadow-[inset_0_0_24px_rgba(255,142,101,0.08),0_6px_18px_rgba(179,97,74,0.09)] sm:min-h-[138px] sm:px-5 sm:py-3.5">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-[#ffad91] bg-[#fff3ed]/85 shadow-[0_4px_14px_rgba(244,115,78,0.16)] sm:size-[68px]">
                    <Image src={ICON_SRC[icon]} alt="" width={44} height={44} className="size-9 [filter:invert(57%)_sepia(78%)_saturate(1900%)_hue-rotate(332deg)_brightness(101%)_contrast(89%)] sm:size-11" />
                  </span>
                  <div className="min-w-0">
                    <p className="whitespace-nowrap text-[18px] font-bold tracking-[-0.035em] text-[#1a1a2e] sm:text-[21px]">{name}</p>
                    <span className={`mt-2 inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-black tracking-[0.15em] ${active ? 'border-[#ffab90] bg-[#fff3ed] text-[#ed6547]' : 'border-[#d5afba] bg-[#fff6f7] text-[#936b79]'}`}>
                      <span className={`size-2 rounded-full ${active ? 'bg-[#f46e52]' : 'border border-current'}`} />
                      {status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <Link
            href={config.ctaHref}
            className="relative mt-4 flex w-full items-center justify-center gap-3 rounded-[26px] bg-[linear-gradient(180deg,#ff5d61_0%,#ff8c43_100%)] px-6 py-3 text-[clamp(20px,4vw,31px)] font-extrabold tracking-[-0.04em] text-white shadow-[0_6px_0_#a95040,0_10px_18px_rgba(255,99,73,0.22)] transition hover:-translate-y-0.5 hover:brightness-105 active:translate-y-[3px] active:shadow-[0_3px_0_#a95040] sm:-mx-4 sm:mt-6 sm:w-[calc(100%+2rem)] sm:py-5"
          >
            <span>{config.ctaText}</span>
            <Image src={SPARKLE} alt="" width={26} height={26} className="size-[1em] brightness-0 invert" />
          </Link>
        </div>
      </section>
    </div>
  );
}
