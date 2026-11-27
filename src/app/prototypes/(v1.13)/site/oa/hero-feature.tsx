"use client";

/* 2026-11-26 Monica:有些工具页首屏不适合 5 张拼贴 ——
   「AI Dubbing hero 结构改一下，一个就好」「Motion Control 展示一个视频，用我们工具页那个」「Music Video 放个 MV 进去」→ HeroVideo
   「Upscale Video 直接做成 before after」→ HeroWipe(两条同步播放的视频，中间滑杆擦除对比)
   「Video Extender 是不是展示 before after」→ HeroExtend(原片 5s 和延长后 10s 并排，各带时间条) */
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { PicView } from "./kit";
import type { Pic } from "./pool";

const CARD = "relative overflow-hidden rounded-[20px] bg-[#111] shadow-[0_40px_90px_rgba(0,0,0,0.6)] ring-1 ring-white/10";
const CHIP = "pointer-events-none absolute top-3 z-10 rounded-full bg-[#240A03]/75 px-2.5 py-1 text-[12px] font-bold text-white backdrop-blur";

export function HeroVideo({ p, label, fit }: { p: Pic; label?: string; fit?: boolean }) {
  /* 2026-11-27 竖屏视频放进 16:9 卡片：居中完整显示，两侧垫同一画面的模糊放大版(不裁掉人脸和产品) */
  if (fit)
    return (
      <div className={`${CARD} aspect-video`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {p.poster && <img src={p.poster} alt="" aria-hidden className="absolute inset-0 size-full scale-110 object-cover opacity-60 blur-2xl" />}
        <div className="relative mx-auto h-full" style={{ aspectRatio: (p.aspect ?? "9:16").replace(":", " / ") }}>
          <PicView p={p} />
        </div>
        {label && <span className={`${CHIP} left-3`}>{label}</span>}
      </div>
    );
  return (
    <div className={`${CARD} aspect-video`}>
      <PicView p={p} />
      {label && <span className={`${CHIP} left-3`}>{label}</span>}
    </div>
  );
}

/* 2026-11-27 Monica:AI Image Extender「直接放个 before 和 after 就好，不要 slider 了」→ 先做了上下，又改「上下比较还是左右的吧」→ 左右两张并排，各带标签 */
export function HeroStack({ before, after, beforeLabel = "Before", afterLabel = "After" }: { before: Pic; after: Pic; beforeLabel?: string; afterLabel?: string }) {
  const cell = (p: Pic, label: string) => (
    <div className={`${CARD} aspect-[4/3] w-full`}>
      <PicView p={p} />
      <span className={`${CHIP} left-3`}>{label}</span>
    </div>
  );
  return (
    <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2 md:gap-4">
      {cell(before, beforeLabel)}
      <span aria-hidden className="grid size-8 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/15 md:size-10"><ArrowRight className="size-4 md:size-5" /></span>
      {cell(after, afterLabel)}
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
      setX(50 + 30 * Math.sin((t - t0) / 700));
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

/* 2026-11-27 Monica「AI Video Extender 这个内容特别不好，用人家官方的素材」→ BytePlus Seedance 2.0 文档「Extend video」示例：
   三段输入短片(拱窗 → 美术馆 → 画里的咖啡馆)被接成一条 12 秒连续长镜头。
   Monica「感觉咩有联动，你编辑排版设计一下」→ 成片播到哪一段，左边对应的输入片亮起(橙框 + Now),其余变暗;
   成片下方的时间条按三段在成片里的实际位置分段，段名和左边对上;点左边的片或时间条的段，成片跳到那一段 */
export function HeroStitch({ inputs, output, outSecs }: { inputs: { p: Pic; secs: number; from: number; to: number }[]; output: Pic; outSecs: number }) {
  const r = useRef<HTMLVideoElement>(null);
  const [t, setT] = useState(0);
  useEffect(() => {
    const v = r.current;
    if (!v) return;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: 0.2 });
    io.observe(v);
    let raf = 0;
    const tick = () => { setT(v.currentTime); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, []);
  const cur = inputs.findIndex((c) => t >= c.from && t < c.to);
  const seek = (i: number) => { const v = r.current; if (!v) return; v.currentTime = inputs[i].from + 0.05; v.play().catch(() => {}); };
  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,3fr)] md:gap-5">
      <div className="grid grid-cols-3 gap-3 md:grid-cols-1 md:gap-4">
        {inputs.map(({ p, secs }, i) => {
          const on = i === cur;
          return (
            <button key={p.src} type="button" onClick={() => seek(i)} aria-label={`Jump to clip ${i + 1} in the extended video`} className={`${CARD} aspect-video text-left transition duration-300 ${on ? "opacity-100 ring-2 !ring-[#FF744D] shadow-[0_0_0_4px_rgba(255,116,77,0.18),0_30px_60px_rgba(0,0,0,0.5)]" : "opacity-45 hover:opacity-80"}`}>
              <PicView p={p} />
              <span className={`${CHIP} left-2 !top-2 !px-2 !text-[11px]`}>Clip {i + 1} · {secs}s</span>
              {on && <span className="pointer-events-none absolute bottom-2 right-2 z-10 rounded-full bg-[#FF744D] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-white">Now</span>}
            </button>
          );
        })}
      </div>
      <figure className="min-w-0">
        <div className={`${CARD} aspect-video`}>
          <video ref={r} src={output.src} poster={output.poster} muted loop playsInline preload="metadata" aria-label={output.alt} className="size-full object-cover" />
          <span className={`${CHIP} left-3`}>Extended · {outSecs}s</span>
          {cur >= 0 && <span className={`${CHIP} right-3 !bg-[#FF744D]`}>From clip {cur + 1}</span>}
        </div>
        {/* 分段时间条：每段宽度 = 这段在成片里占的时长 */}
        <div className="mt-3 flex gap-1">
          {inputs.map((c, i) => {
            const w = ((c.to - c.from) / outSecs) * 100;
            const fill = Math.max(0, Math.min(100, ((t - c.from) / (c.to - c.from)) * 100));
            const on = i === cur;
            return (
              <button key={c.p.src} type="button" onClick={() => seek(i)} aria-label={`Clip ${i + 1} part of the extended video`} className="group min-w-0 text-left" style={{ width: `${w}%` }}>
                <span className="block h-1.5 overflow-hidden rounded-full bg-white/10">
                  <span className="block h-full rounded-full bg-[#FF744D] transition-[width] duration-100" style={{ width: `${t >= c.to ? 100 : fill}%` }} />
                </span>
                <span className={`mt-1.5 block truncate text-[12px] font-semibold transition ${on ? "text-white" : "text-white/45 group-hover:text-white/70"}`}>Clip {i + 1}</span>
              </button>
            );
          })}
        </div>
      </figure>
    </div>
  );
}

/* 2026-11-27 Monica「要把语言这种做的更互动一点」(划掉左上角 EN → ES → FR 小标签):
   同一条视频依次说英语 / 西语 / 法语(各约 5 秒)。视频下方三个语言按钮，播到哪段哪个按钮亮、按钮里的进度条走;
   点按钮跳到那一段并打开声音(配音要听才看得出);画面左下角标当前语言 */
export function HeroDub({ p, langs }: { p: Pic; langs: { code: string; name: string; from: number; to: number }[] }) {
  const r = useRef<HTMLVideoElement>(null);
  const [t, setT] = useState(0);
  const [muted, setMuted] = useState(true);
  useEffect(() => {
    const v = r.current;
    if (!v) return;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: 0.2 });
    io.observe(v);
    let raf = 0;
    const tick = () => { setT(v.currentTime); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, []);
  const cur = Math.max(0, langs.findIndex((l) => t >= l.from && t < l.to));
  const jump = (i: number) => {
    const v = r.current;
    if (!v) return;
    v.currentTime = langs[i].from + 0.05;
    v.muted = false;
    setMuted(false);
    v.play().catch(() => {});
  };
  const toggle = () => { const v = r.current; if (!v) return; v.muted = !v.muted; setMuted(v.muted); };
  return (
    <div>
      <div className={`${CARD} aspect-video`}>
        <video ref={r} src={p.src} poster={p.poster} muted loop playsInline preload="metadata" aria-label={p.alt} className="size-full object-cover" />
        <span className="pointer-events-none absolute bottom-4 left-4 z-10 flex items-center gap-2 rounded-full bg-black/60 py-1.5 pl-2 pr-3 text-[13px] font-semibold text-white backdrop-blur">
          <span className="grid h-5 min-w-7 place-items-center rounded-full bg-[#FF744D] px-1.5 text-[11px] font-bold">{langs[cur].code}</span>
          {langs[cur].name}
        </span>
        <button type="button" onClick={toggle} aria-label={muted ? "Turn sound on" : "Mute"} className="absolute bottom-4 right-4 z-10 rounded-full bg-black/60 px-3 py-1.5 text-[13px] font-semibold text-white backdrop-blur transition hover:bg-black/80">
          {muted ? "Sound off" : "Sound on"}
        </button>
      </div>
      <div role="tablist" aria-label="Dubbed language" className="mx-auto mt-4 grid max-w-[640px] grid-cols-3 gap-2">
        {langs.map((l, i) => {
          const on = i === cur;
          const pct = on ? Math.min(100, ((t - l.from) / (l.to - l.from)) * 100) : t >= l.to ? 100 : 0;
          return (
            <button key={l.code} type="button" role="tab" aria-selected={on} onClick={() => jump(i)} className={`relative overflow-hidden rounded-[14px] px-4 py-3 text-left transition ${on ? "bg-white text-[#240A03]" : "bg-white/[0.07] text-white/70 hover:bg-white/[0.12] hover:text-white"}`}>
              <span className="block text-[11px] font-bold tracking-[0.06em] opacity-60">{l.code}</span>
              <span className="block text-[15px] font-semibold">{l.name}</span>
              <span aria-hidden className="absolute inset-x-0 bottom-0 h-[3px] bg-black/10">
                <span className="block h-full bg-[#FF744D]" style={{ width: `${on ? pct : 0}%` }} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* 2026-11-27 Monica「AI Camera Control 这里改成下面配一个视频那种布局」「用 fal.ai 的素材，做一个联动的控制镜头角度」:
   素材 = fal 上 minimax/h3-max/camera-controls 示例的那张定格(倒立的街舞少年),用 H3 Max 运镜按 6 个预设各生成一条。
   左边是预设列表 + 一个小 3D 舞台示意(人物在中间、相机沿所选预设的路线移动，跟右边视频的播放进度同步);点预设换视频 */
export type CamMove = { key: string; label: string; src: string; poster?: string };
type V3 = [number, number, number];
const camPath = (key: string, p: number): { pos: V3; look: V3 } => {
  const e = 0.5 - Math.cos(Math.PI * Math.min(1, Math.max(0, p))) / 2;
  const S: V3 = [0, 0.9, 0];
  switch (key) {
    case "dolly_in": return { pos: [0, 1, 6 - 3.4 * e], look: S };
    case "dolly_out": return { pos: [0, 1, 2.6 + 3.4 * e], look: S };
    case "truck_right": return { pos: [-2.6 + 5.2 * e, 1, 4.4], look: [-2.6 + 5.2 * e, 0.9, 0] };
    case "pan_left": { const a = 0.55 - 1.1 * e; return { pos: [0, 1, 4.4], look: [Math.sin(-a) * 4.4, 0.9, 4.4 - Math.cos(a) * 4.4] }; }
    case "pedestal_up": return { pos: [0, 0.4 + 2.8 * e, 4.4], look: [0, 0.4 + 2.8 * e, 0] };
    default: return { pos: [Math.sin(e * Math.PI * 2) * 1.8, 1, 6 - 3.6 * e], look: S }; /* s_curve_forward */
  }
};
/* 斜上方看舞台(斜投影):x 向右，z 朝观众(越大越靠下),y 向上 */
const proj = ([x, y, z]: V3): [number, number] => [150 + x * 26 - z * 3, 64 + z * 17 - y * 22];

export function HeroCamera({ moves }: { moves: CamMove[] }) {
  const r = useRef<HTMLVideoElement>(null);
  const [i, setI] = useState(0);
  const [p, setP] = useState(0);
  useEffect(() => {
    const v = r.current;
    if (!v) return;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: 0.2 });
    io.observe(v);
    let raf = 0;
    const tick = () => { if (v.duration) setP(v.currentTime / v.duration); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, []);
  useEffect(() => { const v = r.current; if (v) { v.load(); v.play().catch(() => {}); } }, [i]);
  const m = moves[i];
  const { pos, look } = camPath(m.key, p);
  const trail = Array.from({ length: 25 }, (_, k) => proj(camPath(m.key, k / 24).pos));
  const [cx, cy] = proj(pos);
  const [lx, ly] = proj(look);
  const ang = Math.atan2(ly - cy, lx - cx);
  const fov = 0.42;
  const L = 70;
  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,0.9fr)_minmax(0,2.1fr)] md:gap-5">
      <div className="flex flex-col gap-3 rounded-[20px] bg-white/[0.04] p-3 ring-1 ring-white/10">
        <svg viewBox="0 0 300 200" preserveAspectRatio="xMidYMid meet" className="min-h-[180px] w-full flex-1 rounded-[14px] bg-[#0d0d0d]" aria-label={`Camera path: ${m.label}`}>
          {/* 地面网格 */}
          {Array.from({ length: 9 }, (_, k) => k - 4).map((g) => {
            const a = proj([g, 0, -3]), b = proj([g, 0, 6.5]), c = proj([-4, 0, g + 1.25]), d = proj([4, 0, g + 1.25]);
            return <g key={g} stroke="rgba(255,255,255,0.07)"><line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} /><line x1={c[0]} y1={c[1]} x2={d[0]} y2={d[1]} /></g>;
          })}
          {/* 人物(中间) */}
          {(() => { const [sx, sy] = proj([0, 0, 0]); const [hx, hy] = proj([0, 1.7, 0]); return <g><ellipse cx={sx} cy={sy} rx="14" ry="5" fill="rgba(255,255,255,0.08)" /><line x1={sx} y1={sy} x2={hx} y2={hy + 8} stroke="#CACACA" strokeWidth="6" strokeLinecap="round" /><circle cx={hx} cy={hy} r="6" fill="#CACACA" /></g>; })()}
          {/* 相机路线 */}
          <polyline points={trail.map((t) => t.join(",")).join(" ")} fill="none" stroke="rgba(255,116,77,0.45)" strokeWidth="1.5" />
          {/* 视野锥 */}
          <path d={`M${cx},${cy} L${cx + Math.cos(ang - fov) * L},${cy + Math.sin(ang - fov) * L} M${cx},${cy} L${cx + Math.cos(ang + fov) * L},${cy + Math.sin(ang + fov) * L}`} stroke="rgba(255,116,77,0.6)" strokeWidth="1" />
          <g transform={`translate(${cx},${cy}) rotate(${(ang * 180) / Math.PI})`}>
            <rect x="-9" y="-6" width="14" height="12" rx="2" fill="#FF744D" />
            <path d="M5,-4 L11,-7 L11,7 L5,4 Z" fill="#FF744D" />
          </g>
        </svg>
        <div role="tablist" aria-label="Camera move" className="grid grid-cols-2 gap-2">
          {moves.map((x, k) => (
            <button key={x.key} type="button" role="tab" aria-selected={k === i} onClick={() => setI(k)} className={`rounded-[12px] px-3 py-2.5 text-left text-[13px] font-semibold transition ${k === i ? "bg-white text-[#240A03]" : "bg-white/[0.06] text-white/70 hover:bg-white/[0.12] hover:text-white"}`}>
              {x.label}
            </button>
          ))}
        </div>
      </div>
      <figure className="min-w-0 self-center">
        <div className={`${CARD} aspect-video`}>
          <video ref={r} src={m.src} poster={m.poster} muted loop playsInline preload="metadata" aria-label={`The same frozen moment filmed with a ${m.label.toLowerCase()} camera move`} className="size-full object-cover" />
          <span className={`${CHIP} left-3`}>{m.label}</span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#FF744D]" style={{ width: `${p * 100}%` }} /></div>
      </figure>
    </div>
  );
}

/* 2026-11-27 Monica:Motion Control「这个素材太糊了，换一个，从 AI Dance Video Generator 那边找跳舞的视频，然后女生还是保留右边的迪士尼动画样式」
   → 左：舞蹈参考片(Dance 页那条白 T 女生),右：3D 动画风女生照着跳(Kling 3.0 Motion Control 生成);两条同步播放 */
export function HeroPair({ left, right, leftLabel, rightLabel }: { left: Pic; right: Pic; leftLabel: string; rightLabel: string }) {
  const a = useRef<HTMLVideoElement>(null);
  const b = useRef<HTMLVideoElement>(null);
  const [refs] = useState(() => [b, a]);
  useSyncedPlay(refs);
  const vid = (p: Pic, r: React.RefObject<HTMLVideoElement | null>) => <video ref={r} src={p.src} poster={p.poster} muted loop playsInline preload="metadata" aria-label={p.alt} className="absolute inset-0 size-full object-cover" />;
  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4">
      <div className={`${CARD} aspect-[4/3]`}>{vid(left, a)}<span className={`${CHIP} left-3`}>{leftLabel}</span></div>
      <div className={`${CARD} aspect-[4/3]`}>{vid(right, b)}<span className={`${CHIP} left-3 !bg-[#FF744D]`}>{rightLabel}</span></div>
    </div>
  );
}
