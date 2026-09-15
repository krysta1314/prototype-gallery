"use client";

/* 页尾两段:行动号召色块 + 站点 footer。
   与落地页、文章页、后台统一浅色;色块用品牌渐变,是整页唯一的大面积彩色。 */

import { ArrowUp } from "lucide-react";

const SOCIALS = [
  { name: "TikTok", slug: "tiktok", href: "https://www.tiktok.com" },
  { name: "YouTube", slug: "youtube", href: "https://www.youtube.com" },
  { name: "Instagram", slug: "instagram", href: "https://www.instagram.com" },
] as const;

export function ReadyBand({ onCta }: { onCta: () => void }) {
  return (
    <section
      className="px-5 py-16 text-center sm:px-8 sm:py-20"
      style={{ background: "linear-gradient(135deg,#FFA73C 0%,#FF5255 100%)" }}
    >
      <h2 className="text-[clamp(26px,3.4vw,40px)] font-extrabold tracking-[-0.03em] text-white">
        Ready to get started?
      </h2>
      <button
        onClick={onCta}
        className="mt-7 inline-flex items-center rounded-full border-2 border-white px-8 py-3.5 text-[13px] font-extrabold uppercase tracking-[0.1em] text-white transition hover:bg-white hover:text-[#ff5e1a] active:scale-[0.98] motion-reduce:transition-none"
      >
        Start for free
      </button>
    </section>
  );
}

export function SiteFooter() {
  const toTop = () =>
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });

  return (
    <footer className="border-t border-[#ececf1] bg-white px-5 py-12 sm:px-8">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-6 gap-y-6">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2.5">
            <img
              src="/prototypes/seedance-2-5/logo.svg"
              alt=""
              className="size-7"
            />
            <span className="text-[17px] font-extrabold tracking-tight text-[#1a1a2e]">
              BuzzVideo AI
            </span>
          </span>
          <span className="flex items-center gap-2">
            {SOCIALS.map((s) => (
              <a
                key={s.slug}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.name}
                className="inline-flex size-8 items-center justify-center rounded-full bg-[#1a1a2e] transition hover:bg-[#ff5e1a]"
              >
                <img
                  src={`https://cdn.simpleicons.org/${s.slug}/ffffff`}
                  alt=""
                  className="size-[15px]"
                />
              </a>
            ))}
          </span>
        </div>

        <button
          onClick={toTop}
          className="group ml-auto inline-flex items-center gap-2 text-[14px] font-semibold text-[#6a6b7b] transition hover:text-[#1a1a2e]"
        >
          Page Top
          <span className="inline-flex size-6 items-center justify-center rounded-full border border-[#d4d3df] transition group-hover:border-[#1a1a2e]">
            <ArrowUp className="size-3.5" />
          </span>
        </button>
      </div>

      <div className="mx-auto mt-8 max-w-[1240px] text-[13px] text-[#9a9aa8]">
        © 2026 PressLogic Limited. All Rights Reserved.{" "}
        <a href="#" className="transition hover:text-[#1a1a2e]">
          Privacy Policy
        </a>{" "}
        ·{" "}
        <a href="#" className="transition hover:text-[#1a1a2e]">
          Terms of Service
        </a>
      </div>
    </footer>
  );
}
