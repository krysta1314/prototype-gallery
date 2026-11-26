"use client";

/* 2026-11-26 Monica 在 Music Video 页「Can AI make the song too?」:「这个配图应该是像黑胶音乐播放器转，然后歌词滚动?」——
   左边一张黑胶唱片在转(中间贴专辑封面),右边歌词逐行滚动、当前行高亮，下面一条播放进度。减少动态效果时静止 */
import { useEffect, useState } from "react";

const LYRICS = [
  "City lights are calling out my name",
  "Rooftop radio, nothing feels the same",
  "We don't need a reason, just the beat",
  "Summer static running through the street",
  "Turn it up, turn it up, we're alive tonight",
  "Every window glowing like a neon sign",
  "Hold the moment, let the chorus play",
  "Summer static, never fade away",
];

export function VinylLyrics({ cover, title = "Summer Static", artist = "Made with Lyria 3.5" }: { cover: string; title?: string; artist?: string }) {
  const [i, setI] = useState(0);
  const [still, setStill] = useState(false);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setStill(true);
    const t = setInterval(() => setI((x) => (x + 1) % LYRICS.length), 2200);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="relative flex size-full items-center gap-[5%] overflow-hidden bg-[radial-gradient(120%_120%_at_20%_30%,#3a1a10_0%,#140806_55%,#0b0605_100%)] px-[6%]">
      <style>{`@keyframes vinyl-spin{to{transform:rotate(360deg)}}`}</style>
      {/* 唱片 */}
      <div className="relative aspect-square w-[44%] shrink-0">
        <div
          className="absolute inset-0 rounded-full shadow-[0_24px_60px_rgba(0,0,0,0.6)]"
          style={{
            background: "repeating-radial-gradient(circle at 50% 50%, #111 0 2px, #1c1c1c 2px 4px)",
            animation: still ? undefined : "vinyl-spin 6s linear infinite",
          }}
        >
          <div className="absolute inset-[30%] overflow-hidden rounded-full ring-4 ring-black/60">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cover} alt={`${title} album cover`} className="size-full object-cover" />
          </div>
          <div className="absolute left-1/2 top-1/2 size-[4%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0b0605]" />
          <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_200deg,transparent_0deg,rgba(255,255,255,0.10)_30deg,transparent_70deg,transparent_200deg,rgba(255,255,255,0.06)_230deg,transparent_270deg)]" />
        </div>
      </div>
      {/* 歌词 */}
      <div className="min-w-0 flex-1">
        <p className="text-[clamp(14px,2.2cqw,20px)] font-bold text-[#FF744D]">{title}</p>
        <p className="text-[clamp(12px,1.6cqw,15px)] text-white/55">{artist}</p>
        <div className="relative mt-4 h-[9.5em] overflow-hidden text-[clamp(15px,2.7cqw,24px)] leading-[1.9em] [mask-image:linear-gradient(transparent,#000_25%,#000_75%,transparent)]">
          <ul className="transition-transform duration-700 ease-out motion-reduce:transition-none" style={{ transform: `translateY(${(2 - i) * 1.9}em)` }}>
            {LYRICS.map((l, k) => (
              <li key={l} className={`truncate font-bold transition-colors duration-500 ${k === i ? "text-white" : "text-white/30"}`}>
                {l}
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-[#FF744D] transition-[width] duration-700" style={{ width: `${((i + 1) / LYRICS.length) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}
