"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, ChevronRight, Megaphone } from "lucide-react";
import { MODEL_GROUPS, MODELS_FEATURED_VIDEO } from "../models-data";
import { SiteHeader } from "../site-header";
import { Loop } from "../media";

const ASSET = "/prototypes/seedance-2-5";
const headD =
  "font-[family-name:var(--font-display)] font-extrabold tracking-tight text-white";
const whiteBtn =
  "inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[14px] font-semibold text-[#0a0a0c] transition hover:bg-white/85";

export default function ModelsPage() {
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notify = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };

  return (
    <main className="min-h-[100dvh] bg-[#0a0a0c] text-white">
      <SiteHeader solid={false} notify={notify} />

      <div className="mx-auto max-w-[1200px] px-6 pb-24 pt-32">
        <nav aria-label="Breadcrumb" className="mb-5">
          <ol className="flex items-center gap-2 text-[14px] text-white/55">
            <li>
              <Link href="/" className="hover:text-white/90">Home</Link>
            </li>
            <ChevronRight className="size-3.5 opacity-60" />
            <li aria-current="page" className="text-white/45">Models</li>
          </ol>
        </nav>
        <h1 className={`text-[clamp(32px,5vw,52px)] leading-[1.08] ${headD}`}>
          All AI models
        </h1>
        <p className="mt-5 max-w-[620px] text-[16px] leading-relaxed text-white/55">
          Every image and video model available on AI BuzzVideo. Pick a model to start
          generating, switch anytime to match the look, speed, and budget your project needs.
        </p>

        {/* Spotlight: newest model */}
        <div className="mt-12 grid items-stretch gap-0 overflow-hidden rounded-[24px] border border-white/10 bg-[#0f0f12] md:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col justify-center p-8 md:p-12">
            <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#ff7a3d]">
              What&apos;s new
            </span>
            <h2 className={`mt-3 text-[clamp(26px,3vw,36px)] leading-[1.1] ${headD}`}>
              Seedance 2.5
            </h2>
            <p className="mt-4 max-w-[440px] text-[15px] leading-relaxed text-white/60">
              Our newest video model. 30 seconds of native video, 4K output, and stronger scene
              control for longer, more consistent stories.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["30s native video", "4K HD", "Multi-reference"].map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-white/12 px-3 py-1 text-[12px] font-medium text-white/70"
                >
                  {t}
                </span>
              ))}
            </div>
            <Link href={ASSET} className={`${whiteBtn} mt-7 self-start`}>
              Try Seedance 2.5 Now <ArrowRight className="size-[18px]" />
            </Link>
          </div>
          <div className="relative min-h-[260px] overflow-hidden border-t border-white/10 md:border-l md:border-t-0">
            <Loop src={MODELS_FEATURED_VIDEO} className="absolute inset-0 size-full object-cover" />
          </div>
        </div>

        {/* Catalog */}
        {MODEL_GROUPS.map((group) => (
          <div key={group.label} className="mt-16">
            <div className="flex items-baseline justify-between border-b border-white/10 pb-4">
              <h2 className={`text-[22px] ${headD}`}>{group.label}</h2>
              <span className="text-[13px] font-medium text-white/35">
                {group.items.length} models
              </span>
            </div>

            <div className="mt-7 grid gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((m) => (
                <Link
                  key={m.name}
                  href={ASSET}
                  className="group flex flex-col overflow-hidden rounded-[16px] border border-white/10 bg-white/[0.03] transition hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.05]"
                >
                  <div className="relative aspect-video overflow-hidden bg-black">
                    {m.thumb && (
                      <Loop
                        src={m.thumb}
                        className="size-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[16px] font-semibold text-white">{m.name}</span>
                        {m.badge && (
                          <span
                            style={{
                              clipPath:
                                "polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)",
                            }}
                            className={`shrink-0 px-2 py-[3px] text-[9px] font-extrabold uppercase tracking-[0.12em] text-white ${
                              m.badge === "Hot"
                                ? "bg-gradient-to-r from-[#ff6a00] to-[#ff1f6f]"
                                : "bg-gradient-to-r from-[#7c3aed] to-[#2563eb]"
                            }`}
                          >
                            {m.badge}
                          </span>
                        )}
                      </div>
                      <ArrowUpRight className="size-[18px] shrink-0 text-white/25 transition group-hover:translate-x-0.5 group-hover:text-[#ff7a3d]" />
                    </div>
                    <p className="mt-2 text-[14px] leading-relaxed text-white/50">{m.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 原型交互提示 toast */}
      <div
        className={`pointer-events-none fixed inset-x-0 bottom-8 z-[60] flex justify-center px-4 transition-all duration-300 ${
          toast ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        {toast && (
          <div className="flex items-center gap-2 rounded-full bg-[#1a1a2e] px-4 py-2.5 text-[13px] text-white shadow-[0_12px_32px_rgba(0,0,0,0.35)]">
            <Megaphone className="size-4 text-[#ffb27a]" />
            <span className="font-bold text-[#ffb27a]">交互提示</span>
            <span className="text-white/25">|</span>
            <span className="font-medium">{toast}</span>
          </div>
        )}
      </div>
    </main>
  );
}
