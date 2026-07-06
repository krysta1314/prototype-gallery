"use client";

import { useState } from "react";
import {
  ArrowUp,
  Plus,
  Sparkles,
  Command,
  MessageCircle,
  GitBranch,
  Frame,
  ChevronDown,
  SlidersHorizontal,
  History,
  HelpCircle,
} from "lucide-react";
import { type Mission, PresetUseCases } from "@/components/missions";

// ── design.md tokens ──────────────────────────────────────────────
const gradText =
  "bg-gradient-to-r from-[#ffc078] to-[#ff5e1a] bg-clip-text text-transparent";
const ctaGrad = "bg-gradient-to-r from-[#FFA73C] to-[#FF5255]";

// ── existing product template gallery (placeholder tiles) ─────────
const CAMPAIGN_TEMPLATES = [
  "Perfume Commercial",
  "Meal Prep Video Ad",
  "IG Ergonomic Pillow Campaign",
  "UGC style video",
  "Power Bank Campaign",
  "High-End Beauty Device Campaign",
  "Buzz Sunglasses Campaign",
  "Sunscreen product launch campaign",
];

const SIDE_NAV = [
  { label: "Agent", Icon: Command, active: true },
  { label: "Chat", Icon: MessageCircle },
  { label: "Workflows", Icon: GitBranch },
  { label: "Canvas", Icon: Frame },
];

export default function MarketingAgentMissions() {
  const [draft, setDraft] = useState("");
  const [attached, setAttached] = useState<Mission["attachments"]>(undefined);

  const pick = (m: Mission) => {
    setDraft(m.prompt);
    setAttached(m.attachments);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white text-[#1a1a2e]">
      <div className="flex">
        {/* left nav */}
        <aside className="hidden w-[150px] shrink-0 flex-col gap-1 border-r border-[#ececf1] bg-white px-3 py-4 lg:flex">
          <div className="mb-3 flex items-center gap-2 px-2">
            <span className={`grid size-8 place-items-center rounded-[9px] ${ctaGrad} text-white`}>
              <Sparkles className="size-4" />
            </span>
            <span className="font-[family-name:var(--font-display)] font-extrabold tracking-tight">
              Buzz
            </span>
          </div>
          {SIDE_NAV.map(({ label, Icon, active }) => (
            <button
              key={label}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                active
                  ? "bg-[#fff3ec] text-[#ff5e1a]"
                  : "text-[#6a6b7b] hover:bg-[#fff7f1] hover:text-[#ff5e1a]"
              }`}
            >
              <Icon className="size-[18px]" />
              {label}
            </button>
          ))}
        </aside>

        {/* main */}
        <main className="min-w-0 flex-1">
          {/* top bar */}
          <header className="flex items-center justify-end gap-3 px-6 py-3">
            <span className="flex items-center gap-1.5 rounded-full bg-[#fff3ec] px-3 py-1.5 text-xs font-bold text-[#ff5e1a]">
              63,016 credits
            </span>
            <button className={`rounded-full ${ctaGrad} px-4 py-1.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(255,82,85,0.28)]`}>
              Upgrade
            </button>
            <HelpCircle className="size-5 text-[#9a9bb0]" />
            <span className="grid size-8 place-items-center rounded-full bg-[#1a1a2e] text-xs font-bold text-white">
              S
            </span>
          </header>

          <div className="px-6">
            {/* hero */}
            <h1 className="mt-6 text-center font-[family-name:var(--font-display)] text-[clamp(28px,4vw,40px)] font-extrabold leading-[1.12] tracking-tight">
              From idea to ready-to-run ads
              <br className="hidden sm:block" /> in minutes with{" "}
              <span className={gradText}>Buzz Agent</span>
            </h1>

            {/* composer */}
            <div className="mx-auto mt-7 w-[768px] max-w-full">
              <div className="flex h-[178px] flex-col rounded-[22px] border border-[#ececf1] bg-white p-3.5 shadow-[0_4px_16px_rgba(26,26,46,0.06)] transition focus-within:border-[#ff5e1a] focus-within:ring-2 focus-within:ring-[#ff5e1a]/20">
                {attached && attached.length > 0 && (
                  <div className="mb-1.5 flex flex-wrap items-center gap-2 px-1">
                    {attached.map((a) => (
                      <div key={a.label} className="relative">
                        {a.type === "video" ? (
                          <video
                            src={a.url}
                            muted
                            playsInline
                            className="size-11 rounded-lg object-cover ring-1 ring-[#ececf1]"
                          />
                        ) : (
                          <img
                            src={a.url}
                            alt={a.label}
                            className="size-11 rounded-lg object-cover ring-1 ring-[#ececf1]"
                          />
                        )}
                        <button
                          onClick={() =>
                            setAttached((prev) =>
                              prev?.filter((x) => x.label !== a.label),
                            )
                          }
                          className="absolute -right-1.5 -top-1.5 grid size-4 place-items-center rounded-full bg-[#1a1a2e] text-[10px] leading-none text-white"
                          aria-label={`Remove ${a.label}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Describe your idea or campaign, or paste a product / landing page / IG post URL. Use @ to reference uploaded files."
                  className="w-full flex-1 resize-none bg-transparent px-2 pt-1 text-[15px] leading-relaxed text-[#1a1a2e] outline-none placeholder:text-[#9a9bb0]"
                />
                <div className="flex items-center justify-between gap-2 px-1 pt-2">
                  <div className="flex items-center gap-2 text-[#6a6b7b]">
                    <span className="grid size-8 place-items-center rounded-lg border border-[#ececf1]">
                      <Plus className="size-4" />
                    </span>
                    <span className="flex items-center gap-1.5 rounded-lg border border-[#ececf1] px-2.5 py-1.5 text-xs font-semibold">
                      <Sparkles className="size-3.5 text-[#ff5e1a]" /> Marketing Agent
                      <ChevronDown className="size-3.5" />
                    </span>
                    <span className="hidden items-center gap-1.5 rounded-lg border border-[#ececf1] px-2.5 py-1.5 text-xs font-semibold sm:flex">
                      <SlidersHorizontal className="size-3.5" /> Auto
                    </span>
                    <History className="hidden size-4 text-[#9a9bb0] sm:block" />
                  </div>
                  <button className={`grid size-9 place-items-center rounded-xl ${ctaGrad} text-white shadow-[0_8px_20px_rgba(255,82,85,0.3)] transition hover:brightness-105`}>
                    <ArrowUp className="size-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* agent use cases: category pills under the composer → reveal cards */}
            <section className="mx-auto mb-16 mt-9 max-w-[1100px]">
              <PresetUseCases onPick={pick} />
            </section>
          </div>

          {/* Campaign Creation template band */}
          <div className="bg-white px-6 py-14 pb-24">
            <section>
              <h3 className="mb-3 text-sm font-bold text-[#1a1a2e]">
                Campaign Creation
              </h3>
              <div className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {CAMPAIGN_TEMPLATES.map((it) => (
                  <div key={it} className="w-[180px] shrink-0">
                    <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-[#f1f0f4] to-[#e7e6ec]" />
                    <p className="mt-2 truncate text-xs font-medium text-[#6a6b7b]">
                      {it}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
