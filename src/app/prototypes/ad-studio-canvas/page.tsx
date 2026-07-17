"use client";

/**
 * Ad Studio — 单页 storyboard 画布(概念 demo)
 * 点 Generate 后不走 Script→References→Video→Merge 分步,直接落到这一页:
 * 上方一排分镜卡 + 下方时间轴 + 底部控制条。深色编辑器质感 + Buzz 橙强调。
 * 这是给 Monica 看形态的简单静态版本,不接后端。
 */

import { useState } from "react";
import {
  ChevronLeft,
  Undo2,
  Redo2,
  MoreHorizontal,
  Bell,
  Pencil,
  Trash2,
  ImagePlus,
  Captions,
  Wand2,
  Plus,
  RectangleHorizontal,
  Sparkles,
  Music4,
  Mic,
  Clock,
  Ratio,
  ArrowUpRight,
} from "lucide-react";

const ACCENT = "#ff5e1a";

type Shot = {
  id: number;
  title: string;
  start: string;
  seconds: number;
  desc: string;
  line?: string;
  frame?: string; // 已生成首帧
};

const SHOTS: Shot[] = [
  {
    id: 1,
    title: "Sunlit orchard, dew on pears",
    start: "00.00",
    seconds: 4,
    desc: "Golden morning light rakes across a green pear still beaded with dew. A hand lifts it; the skin catches the sun.",
    line: "Every morning starts a little sweeter.",
    frame:
      "https://picsum.photos/seed/buzz-pear-orchard-morning/640/400",
  },
  {
    id: 2,
    title: "Match cut to the bottle",
    start: "00.04",
    seconds: 4,
    desc: "The same hand now lifts the frosted-green perfume bottle from a sunlit sill. Light passes through the glass, casting a soft pear-toned glow.",
    line: "Wear the pear, just picked.",
    frame: "https://picsum.photos/seed/buzz-pear-bottle-sill/640/400",
  },
  {
    id: 3,
    title: "Street, wind in her hair",
    start: "00.08",
    seconds: 4,
    desc: "She walks a bright open street. A light spritz on the wrist, hair moving in the wind, passers-by catching the scent and softening.",
  },
  {
    id: 4,
    title: "Close on the wrist",
    start: "00.12",
    seconds: 3,
    desc: "Macro on skin and glass: the fine mist settles, the label reads clean in daylight.",
  },
  {
    id: 5,
    title: "Product hero, end card",
    start: "00.15",
    seconds: 3,
    desc: "The bottle stands centered on a clean neutral set. Slogan resolves beside it, then holds.",
    line: "H&M Pear. Everyday fresh.",
  },
];

const TOTAL = SHOTS.reduce((n, s) => n + s.seconds, 0);

export default function AdStudioCanvasDemo() {
  const [active, setActive] = useState(1);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#141319] text-[#ececf1] [font-family:var(--font-sans),system-ui]">
      {/* ---------- Top bar ---------- */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/8 px-4">
        <button className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-medium text-[#a9a7b4] transition hover:bg-white/5 hover:text-white">
          <ChevronLeft className="size-4" />
          Back
        </button>

        <div className="flex items-center gap-2 text-[13.5px]">
          <span className="font-[var(--font-display)] font-semibold text-white">H&amp;M Pear</span>
          <span className="text-white/25">·</span>
          <span className="text-[#a9a7b4]">Storyboard</span>
          <span className="ml-1 rounded-full bg-white/8 px-2 py-0.5 text-[11px] font-medium text-[#a9a7b4]">
            Draft
          </span>
        </div>

        <div className="flex items-center gap-0.5">
          <IconBtn><Undo2 className="size-4" /></IconBtn>
          <IconBtn><Redo2 className="size-4" /></IconBtn>
          <IconBtn><MoreHorizontal className="size-4" /></IconBtn>
          <IconBtn><Bell className="size-4" /></IconBtn>
          <span className="ml-1.5 grid size-8 place-items-center rounded-full bg-[#ff5e1a] text-[12px] font-semibold text-white">
            M
          </span>
        </div>
      </header>

      {/* ---------- Storyboard row ---------- */}
      <main className="flex-1 overflow-x-auto overflow-y-hidden px-4 py-6 [scrollbar-width:thin]">
        <div className="flex h-full min-h-[420px] min-w-max items-stretch gap-4">
          {SHOTS.map((shot) => (
            <ShotCard
              key={shot.id}
              shot={shot}
              active={active === shot.id}
              onSelect={() => setActive(shot.id)}
            />
          ))}
          <AddShot />
        </div>
      </main>

      {/* ---------- Timeline ---------- */}
      <section className="shrink-0 border-t border-white/8 bg-[#17161d] px-4 pb-3 pt-2.5">
        {/* ruler */}
        <div className="relative mb-1.5 flex h-4 items-end justify-between px-0.5 text-[10px] tabular-nums text-white/30">
          {Array.from({ length: TOTAL + 1 }).map((_, i) => (
            <span key={i} className="flex flex-col items-center gap-1">
              <span className="h-1.5 w-px bg-white/12" />
              {String(i).padStart(2, "0")}
            </span>
          ))}
        </div>
        {/* clips */}
        <div className="relative flex gap-1">
          {SHOTS.map((shot) => (
            <button
              key={shot.id}
              onClick={() => setActive(shot.id)}
              style={{ flexGrow: shot.seconds }}
              className={
                "relative h-14 shrink-0 overflow-hidden rounded-md border text-left transition " +
                (active === shot.id
                  ? "border-[#ff5e1a] ring-1 ring-[#ff5e1a]"
                  : "border-white/10 hover:border-white/25")
              }
            >
              {shot.frame ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shot.frame} alt="" className="absolute inset-0 size-full object-cover opacity-80" />
              ) : (
                <span className="absolute inset-0 bg-[#22212b]" />
              )}
              <span className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-1.5 pb-1 pt-3 text-[10px] font-semibold tabular-nums text-white/90">
                {String(shot.id).padStart(2, "0")}
                <span className="text-white/55">{shot.seconds}s</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ---------- Control bar ---------- */}
      <footer className="flex shrink-0 items-center gap-2 border-t border-white/8 bg-[#141319] px-4 py-3">
        <div className="flex items-center gap-1.5">
          <ControlPill icon={<Ratio className="size-3.5" />} label="16:9" />
          <ControlPill icon={<RectangleHorizontal className="size-3.5" />} label="480p" />
          <ControlPill icon={<Clock className="size-3.5" />} label={`${TOTAL}s`} />
          <ControlPill icon={<Mic className="size-3.5" />} label="1 voice" />
          <ControlPill icon={<Music4 className="size-3.5" />} label="No music" />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-[12px] text-white/40">{SHOTS.length} shots · {TOTAL}s</span>
          <button
            className="inline-flex items-center gap-2 rounded-full bg-[#ff5e1a] px-5 py-2.5 text-[14px] font-semibold text-white transition hover:bg-[#ea5313] active:translate-y-[1px]"
          >
            <Sparkles className="size-4" />
            Create video
          </button>
        </div>
      </footer>
    </div>
  );
}

/* ---------- pieces ---------- */

function IconBtn({ children }: { children: React.ReactNode }) {
  return (
    <button className="grid size-8 place-items-center rounded-lg text-[#a9a7b4] transition hover:bg-white/5 hover:text-white">
      {children}
    </button>
  );
}

function ShotCard({
  shot,
  active,
  onSelect,
}: {
  shot: Shot;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <article
      onClick={onSelect}
      className={
        "group flex h-full w-[300px] shrink-0 cursor-pointer flex-col overflow-hidden rounded-2xl border bg-[#1c1b23] transition " +
        (active ? "border-[#ff5e1a]/70 ring-1 ring-[#ff5e1a]/40" : "border-white/8 hover:border-white/16")
      }
    >
      {/* frame slot */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#232230]">
        {shot.frame ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shot.frame} alt={shot.title} className="size-full object-cover" />
            <span className="absolute left-2.5 top-2.5 rounded-md bg-black/55 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-white backdrop-blur">
              {String(shot.id).padStart(2, "0")}
            </span>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5">
            <span className="font-[var(--font-display)] text-[22px] font-bold tabular-nums text-white/25">
              {String(shot.id).padStart(2, "0")}
            </span>
            <button className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-[#1a1a2e] opacity-0 shadow-sm transition group-hover:opacity-100">
              <Wand2 className="size-3.5 text-[#ff5e1a]" />
              Generate scene
            </button>
          </div>
        )}
      </div>

      {/* body */}
      <div className="flex min-h-0 flex-1 flex-col p-3.5">
        <h3 className="text-[13.5px] font-semibold leading-snug text-white">{shot.title}</h3>
        <p className="mt-1.5 line-clamp-4 text-[12.5px] leading-relaxed text-[#a9a7b4]">{shot.desc}</p>
        {shot.line ? (
          <p className="mt-2.5 rounded-lg bg-white/5 px-2.5 py-1.5 text-[12px] italic leading-snug text-[#d7d5e0]">
            &ldquo;{shot.line}&rdquo;
          </p>
        ) : null}

        {/* footer */}
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="flex items-center gap-1 text-[11.5px] font-medium tabular-nums text-white/40">
            {shot.start}
            <span className="text-white/20">·</span>
            {shot.seconds}s
          </span>
          <div className="flex items-center gap-0.5 text-[#8f8d9c]">
            <MiniBtn><ImagePlus className="size-3.5" /></MiniBtn>
            <MiniBtn><Captions className="size-3.5" /></MiniBtn>
            <MiniBtn><Pencil className="size-3.5" /></MiniBtn>
            <MiniBtn><Trash2 className="size-3.5" /></MiniBtn>
          </div>
        </div>
      </div>
    </article>
  );
}

function AddShot() {
  return (
    <button className="flex h-full w-[132px] shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/12 text-[12.5px] font-medium text-white/40 transition hover:border-white/25 hover:text-white/70">
      <Plus className="size-5" />
      Add shot
    </button>
  );
}

function MiniBtn({ children }: { children: React.ReactNode }) {
  return (
    <button className="grid size-7 place-items-center rounded-md transition hover:bg-white/8 hover:text-white">
      {children}
    </button>
  );
}

function ControlPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[12.5px] font-medium text-[#c8c6d2] transition hover:border-white/20 hover:text-white">
      <span className="text-white/45">{icon}</span>
      {label}
    </button>
  );
}
