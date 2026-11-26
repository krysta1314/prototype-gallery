"use client";

/* 2026-11-26 Monica:有些工具页首屏不适合 5 张拼贴 ——
   「AI Dubbing hero 结构改一下，一个就好」「Motion Control 展示一个视频，用我们工具页那个」「Music Video 放个 MV 进去」→ HeroVideo
   「Upscale Video 直接做成 before after」→ HeroWipe(两条同步播放的视频，中间滑杆擦除对比)
   「Video Extender 是不是展示 before after」→ HeroExtend(原片 5s 和延长后 10s 并排，各带时间条) */
import { useEffect, useRef, useState } from "react";
import { PicView } from "./kit";
import type { Pic } from "./pool";

const CARD = "relative overflow-hidden rounded-[20px] bg-[#111] shadow-[0_40px_90px_rgba(0,0,0,0.6)] ring-1 ring-white/10";
const CHIP = "pointer-events-none absolute top-3 z-10 rounded-full bg-[#240A03]/75 px-2.5 py-1 text-[12px] font-bold text-white backdrop-blur";

export function HeroVideo({ p, label }: { p: Pic; label?: string }) {
  return (
    <div className={`${CARD} aspect-video`}>
      <PicView p={p} />
      {label && <span className={`${CHIP} left-3`}>{label}</span>}
    </div>
  );
}

function useSyncedPlay(refs: React.RefObject<HTMLVideoElement | null>[]) {
  useEffect(() => {
    const vs = refs.map((r) => r.current).filter((v): v is HTMLVideoElement => !!v);
    if (!vs.length || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(([e]) => vs.forEach((v) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause())), { threshold: 0.2 });
    io.observe(vs[0]);
    /* 第一条循环回到开头时，其余几条一起回到开头，保持同步 */
    const lead = vs[0];
    const sync = () => vs.slice(1).forEach((v) => Math.abs(v.currentTime - lead.currentTime) > 0.25 && (v.currentTime = lead.currentTime));
    lead.addEventListener("timeupdate", sync);
    return () => {
      io.disconnect();
      lead.removeEventListener("timeupdate", sync);
    };
  }, [refs]);
}

export function HeroWipe({ before, after, beforeLabel = "Before", afterLabel = "After" }: { before: Pic; after: Pic; beforeLabel?: string; afterLabel?: string }) {
  const a = useRef<HTMLVideoElement>(null);
  const b = useRef<HTMLVideoElement>(null);
  const [refs] = useState(() => [a, b]);
  useSyncedPlay(refs);
  const [x, setX] = useState(50);
  const [touched, setTouched] = useState(false);
  /* 没拖过时滑杆自己慢慢左右扫，一眼看出前后差别 */
  useEffect(() => {
    if (touched || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      setX(50 + 28 * Math.sin((t - t0) / 1600));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [touched]);
  const vid = (p: Pic, r: React.RefObject<HTMLVideoElement | null>) => <video ref={r} src={p.src} poster={p.poster} muted loop playsInline preload="metadata" aria-label={p.alt} className="absolute inset-0 size-full object-cover" />;
  return (
    <div className={`${CARD} aspect-video select-none`}>
      {vid(after, a)}
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - x}% 0 0)` }}>{vid(before, b)}</div>
      <div className="pointer-events-none absolute inset-y-0 z-10 w-[2px] bg-white shadow-[0_0_12px_rgba(0,0,0,0.5)]" style={{ left: `${x}%` }}>
        <span className="absolute left-1/2 top-1/2 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[13px] font-bold text-[#240A03] shadow-lg">⇆</span>
      </div>
      <span className={`${CHIP} left-3`}>{beforeLabel}</span>
      <span className={`${CHIP} right-3`}>{afterLabel}</span>
      <input type="range" min={0} max={100} value={x} onChange={(e) => (setTouched(true), setX(Number(e.target.value)))} aria-label={`Compare ${beforeLabel} and ${afterLabel}`} className="absolute inset-0 z-20 size-full cursor-ew-resize opacity-0" />
    </div>
  );
}

function Timed({ p, label, secs, total }: { p: Pic; label: string; secs: number; total: number }) {
  const r = useRef<HTMLVideoElement>(null);
  const [t, setT] = useState(0);
  useEffect(() => {
    const v = r.current;
    if (!v) return;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: 0.2 });
    io.observe(v);
    const u = () => setT(v.currentTime);
    v.addEventListener("timeupdate", u);
    return () => (io.disconnect(), v.removeEventListener("timeupdate", u));
  }, []);
  return (
    <figure className="min-w-0">
      <div className={`${CARD} aspect-[4/3]`}>
        <video ref={r} src={p.src} poster={p.poster} muted loop playsInline preload="metadata" aria-label={p.alt} className="size-full object-cover" />
        <span className={`${CHIP} left-3`}>{label}</span>
      </div>
      {/* 时间条：总长按延长后的长度算，原片那条只有一半长 */}
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10" style={{ width: `${(secs / total) * 100}%` }}>
        <div className="h-full rounded-full bg-[#FF744D]" style={{ width: `${Math.min(100, (t / secs) * 100)}%` }} />
      </div>
      <figcaption className="mt-1.5 text-[12px] font-semibold text-white/60">{secs}s</figcaption>
    </figure>
  );
}

export function HeroExtend({ before, after, beforeSecs = 5, afterSecs = 10 }: { before: Pic; after: Pic; beforeSecs?: number; afterSecs?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:gap-6">
      <Timed p={before} label="Original" secs={beforeSecs} total={afterSecs} />
      <Timed p={after} label="Extended" secs={afterSecs} total={afterSecs} />
    </div>
  );
}
