"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ChevronRight, Megaphone } from "lucide-react";
import { MODEL_GROUPS } from "../models-data";
import { SiteHeader } from "../site-header";
import { CardMedia } from "../media";

const ASSET = "/prototypes/seedance-2-5";
const headD =
  "font-[family-name:var(--font-display)] font-extrabold tracking-tight text-white";

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
          All Models
        </h1>

        {/* Catalog */}
        {[
          {
            label: "models",
            items: MODEL_GROUPS.flatMap((g) => g.items).filter(
              (m) => m.name === "Seedance 2.5",
            ),
          },
        ].map((group) => (
          <div key={group.label} className="mt-10 first:mt-12">
            <div className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((m) => (
                <Link
                  key={m.name}
                  href={ASSET}
                  className="group flex flex-col overflow-hidden rounded-[16px] bg-white/[0.03] transition hover:-translate-y-0.5 hover:bg-white/[0.05]"
                >
                  <div className="relative aspect-video overflow-hidden bg-black">
                    {m.thumb && (
                      <CardMedia
                        src={m.thumb}
                        alt={m.name}
                        className="size-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
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
