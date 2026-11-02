"use client";

import { useEffect, useRef } from "react";
import { ChevronDown, MousePointer2, Plus, Sparkles } from "lucide-react";
import { mountScene } from "./scene";

const APPLE_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif';

const gradText = "bg-gradient-to-r from-[#ffc078] to-[#ff5e1a] bg-clip-text text-transparent";

export default function ThreeDStudioHero() {
  const stageRef = useRef<HTMLDivElement>(null);
  const pipRef = useRef<HTMLDivElement>(null);
  const angleRef = useRef<HTMLSpanElement>(null);
  const lensRef = useRef<HTMLSpanElement>(null);
  const distRef = useRef<HTMLSpanElement>(null);
  const speedRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!stageRef.current || !pipRef.current) return;
    return mountScene(stageRef.current, pipRef.current, {
      angle: angleRef.current!,
      lens: lensRef.current!,
      dist: distRef.current!,
      speed: speedRef.current!,
    });
  }, []);

  return (
    <main
      className="relative h-[100svh] min-h-[680px] w-full overflow-hidden bg-[#ffe7d4] text-[#1a1a2e]"
      style={{ fontFamily: APPLE_FONT }}
    >
      {/* 3D 场景铺满整个 hero */}
      <div ref={stageRef} className="absolute inset-0" />

      {/* 顶部压一层暖白，保证标题可读 */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[42%] bg-gradient-to-b from-[#fff6ef] via-[#fff6ef]/70 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[30%] bg-gradient-to-t from-[#ffe7d4]/80 to-transparent" />

      {/* 标题 */}
      <div className="pointer-events-none relative z-10 mx-auto flex max-w-[980px] flex-col items-center px-4 pt-[clamp(36px,7vh,72px)] text-center">
        <h1 className="text-[clamp(32px,5.2vw,62px)] font-extrabold leading-[1.06] tracking-tight">
          <span className={gradText}>3D Studio:</span> Build the scene,
          <br className="hidden sm:block" /> generate the exact shot
        </h1>
        <p className="mt-4 max-w-[560px] text-[clamp(14px,1.4vw,17px)] leading-relaxed text-[#6a6b7b]">
          Place your subject, set the camera angle, lens and move in 3D — AI renders the video exactly as framed.
        </p>
        <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-3.5 py-1.5 text-[13px] font-semibold text-[#1a1a2e] shadow-[0_4px_16px_rgba(26,26,46,0.06)] backdrop-blur">
          <MousePointer2 className="size-3.5 text-[#ff5e1a]" />
          <span className="hidden sm:inline">Move your cursor — you&apos;re directing the shot</span>
          <span className="sm:hidden">Drag to direct the shot</span>
        </span>
      </div>

      {/* 取景窗：跟拍摄像机实时画面 */}
      <div className="pointer-events-none absolute right-4 bottom-[172px] z-10 w-[min(42vw,180px)] sm:right-8 sm:bottom-[190px] sm:w-[260px] xl:bottom-auto xl:top-[40%] xl:w-[320px]">
        <div className="mb-2 flex items-center justify-between px-1 text-[11px] font-bold tracking-[0.12em] text-[#1a1a2e]/70 uppercase">
          <span className="flex items-center gap-1.5">
            <span className="size-2 animate-pulse rounded-full bg-[#ff3b3b]" />
            CAM A · Live
          </span>
          <span className="hidden sm:inline">Exact shot preview</span>
        </div>
        {/* 外框不能有底色：取景画面是 WebGL 画在这块区域下面的 */}
        <div className="rounded-[18px] shadow-[0_16px_36px_rgba(26,26,46,0.2)]">
          <div ref={pipRef} className="relative aspect-video overflow-hidden rounded-t-[18px] ring-[5px] ring-white ring-inset">
            {/* 三分线 + 取景角标，强调「精确构图」 */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="border-[0.5px] border-white/35" />
              ))}
            </div>
            {["top-2 left-2 border-t-2 border-l-2", "top-2 right-2 border-t-2 border-r-2", "bottom-2 left-2 border-b-2 border-l-2", "right-2 bottom-2 border-r-2 border-b-2"].map((c) => (
              <span key={c} className={`absolute size-3.5 border-white ${c}`} />
            ))}
            <span className="absolute top-1/2 left-1/2 size-3 -translate-x-1/2 -translate-y-1/2">
              <span className="absolute top-1/2 left-0 h-px w-full bg-white/90" />
              <span className="absolute top-0 left-1/2 h-full w-px bg-white/90" />
            </span>
            <span className="absolute top-2 left-1/2 -translate-x-1/2 rounded-full bg-black/35 px-2 py-0.5 text-[10px] whitespace-nowrap font-semibold text-white">
              16:9 · 24 fps
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 rounded-b-[18px] bg-white px-3 pt-1.5 pb-2.5 text-[11px] text-[#6a6b7b] tabular-nums sm:grid-cols-4">
            <Stat label="Angle">
              <span ref={angleRef}>Eye · 0°</span>
            </Stat>
            <Stat label="Lens">
              <span ref={lensRef}>35 mm</span>
            </Stat>
            <Stat label="Distance" className="hidden sm:block">
              <span ref={distRef}>3.4 m</span>
            </Stat>
            <Stat label="Tracking" className="hidden sm:block">
              <span ref={speedRef}>0.0 m/s</span>
            </Stat>
          </div>
        </div>
      </div>

      {/* 输入框 */}
      <div className="absolute inset-x-0 bottom-[clamp(16px,4vh,40px)] z-10 px-4">
        <div className="mx-auto max-w-[760px] rounded-[22px] border border-white/80 bg-white/85 p-3 shadow-[0_16px_40px_rgba(26,26,46,0.12)] backdrop-blur-xl">
          <div className="flex items-start gap-3">
            <button
              type="button"
              aria-label="Add reference image"
              className="grid size-12 shrink-0 place-items-center rounded-xl border border-dashed border-[#d4d3df] text-[#9a9aab] transition hover:border-[#ff5e1a] hover:bg-[#fff7f1] hover:text-[#ff5e1a]"
            >
              <Plus className="size-5" />
            </button>
            <textarea
              rows={2}
              placeholder="Describe the scene, characters, action and camera move. Paste or drop reference images…"
              className="min-h-12 flex-1 resize-none bg-transparent pt-1 text-[15px] leading-relaxed outline-none placeholder:text-[#9a9aab]"
            />
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#e1e3e9] bg-white px-2.5 py-1.5 text-[13px] font-semibold text-[#1a1a2e] transition hover:border-[#c9cad4]"
            >
              <span className="size-2 rounded-full bg-gradient-to-r from-[#FFA73C] to-[#FF5255]" />
              <span className="whitespace-nowrap">
                Seedance 2.0<span className="hidden sm:inline"> · 16:9 · 480p · 4s</span>
              </span>
              <ChevronDown className="size-3.5 text-[#9a9aab]" />
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-5 py-2.5 text-[15px] font-bold text-white shadow-[0_10px_30px_rgba(255,82,85,0.28)] transition hover:brightness-105 hover:shadow-[0_14px_38px_rgba(255,82,85,0.4)]"
            >
              <Sparkles className="size-4" />
              Create
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <div className="text-[10px] font-semibold tracking-wide text-[#9a9aab] uppercase">{label}</div>
      <div className="truncate font-semibold text-[#1a1a2e]">{children}</div>
    </div>
  );
}
