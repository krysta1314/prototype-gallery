"use client";

import { useEffect, useRef, useState } from "react";
import { CircleHelp, DollarSign, Plus } from "lucide-react";

const TOLT_URL = "https://buzzvideo.tolt.com/login";
const COVER = "/legacy/2026-06-08-affiliate-program/assets/cash_bg_image.jpg";

export default function AffiliateProgramEntry() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#1a1a2e]">
      {/* topbar */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-end gap-3.5 px-6">
        {/* Upgrade | credits */}
        <button className="flex h-[38px] items-center gap-2.5 rounded-full border-[1.5px] border-[#ff7a3d] bg-gradient-to-br from-[#fff3ec] to-[#ffe7d6] px-3.5 text-sm font-semibold transition hover:shadow-[0_2px_10px_rgba(255,122,61,0.25)]">
          <span className="text-[#ff5e1a]">Upgrade</span>
          <span className="h-[18px] w-px bg-[#ffb992]" />
          <span className="flex items-center gap-1.5 text-[#2a2a3c]">
            <span className="flex size-[18px] items-center justify-center rounded-full bg-gradient-to-br from-[#ff8a4c] to-[#ff5e1a] text-white">
              <Plus className="size-3" />
            </span>
            61,893&nbsp;credits
          </span>
        </button>

        {/* Affiliate / Earn Cash */}
        <div ref={wrapRef} className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpen((v) => !v);
            }}
            className="group relative flex h-[38px] items-center gap-2.5 rounded-full px-3 transition hover:bg-[#f1f2f6]"
            aria-label="Affiliate Program"
          >
            <DollarSign className="size-[26px] text-[#e0a73c]" strokeWidth={2} />
            <span className="text-sm font-semibold text-[#1a1a2e]">Earn Cash</span>
            {!open && (
              <span className="pointer-events-none absolute left-1/2 top-[calc(100%+8px)] -translate-x-1/2 whitespace-nowrap rounded-md bg-[#1f2030] px-2.5 py-1.5 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100 before:absolute before:bottom-full before:left-1/2 before:-translate-x-1/2 before:border-[6px] before:border-transparent before:border-b-[#1f2030] before:content-['']">
                Affiliate Program
              </span>
            )}
          </button>

          {/* popup card */}
          <div
            onClick={(e) => e.stopPropagation()}
            className={`absolute left-[68px] top-[calc(100%+12px)] w-80 origin-top -translate-x-1/2 overflow-hidden rounded-[18px] bg-white shadow-[0_16px_48px_rgba(31,32,48,0.22)] transition-all duration-200 ${
              open
                ? "scale-100 opacity-100"
                : "pointer-events-none -translate-y-2 scale-[0.98] opacity-0"
            }`}
          >
            <div
              className="h-[180px] bg-cover bg-center"
              style={{
                backgroundImage: `linear-gradient(135deg,#ffb13d,#ff7a1a), url(${COVER})`,
                backgroundBlendMode: "overlay",
              }}
            />
            <div className="px-[22px] pb-[22px] pt-5 text-center">
              <h3 className="mb-2 text-[17px] font-bold">Refer friend &amp; Earn Cash!</h3>
              <p className="mb-[18px] text-[13.5px] leading-relaxed text-[#5a5b6b]">
                Invite a friend and earn a <strong className="text-[#2a2a3c]">50% commission</strong>{" "}
                on their first purchase! Share your referral link now.
              </p>
              <button
                onClick={() => window.open(TOLT_URL, "_blank", "noopener")}
                className="h-[46px] w-full rounded-xl bg-gradient-to-br from-[#FFA73C] to-[#FF5255] text-[15px] font-semibold text-white transition hover:brightness-105"
              >
                Get your referral link
              </button>
            </div>
          </div>
        </div>

        {/* Help */}
        <button
          className="flex size-[38px] items-center justify-center rounded-full text-[#3a3a4e] transition hover:bg-[#f1f2f6] hover:text-[#1a1a2e]"
          aria-label="Help"
        >
          <CircleHelp className="size-[26px]" strokeWidth={1.8} />
        </button>

        {/* Avatar */}
        <div className="flex size-[38px] items-center justify-center rounded-full bg-[#ffd9c9] text-[15px] font-bold text-[#d9531e]">
          S
        </div>
      </header>

      <p className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none text-sm text-[#c4c6d4]">
        点击右上角 “Earn Cash” 查看 Affiliate 入口卡片
      </p>
    </div>
  );
}
