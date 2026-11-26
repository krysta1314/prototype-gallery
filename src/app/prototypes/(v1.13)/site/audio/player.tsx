"use client";

/* 音频落地页的全局播放器(2026-11-25):整页只有一个 <audio>,同一时间只播一条;
   任何卡片用 usePlay(id, src) 拿到 播放中 / 进度 / 切换。离开页面或卸载时停止。 */

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Pause, Play } from "lucide-react";

type Ctx = { id: string | null; playing: boolean; progress: number; time: number; duration: number; toggle: (id: string, src: string) => void; seek: (ratio: number) => void };
const PlayerCtx = createContext<Ctx | null>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [id, setId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const a = new Audio();
    a.preload = "none";
    ref.current = a;
    const on = () => setPlaying(true);
    const off = () => setPlaying(false);
    const tick = () => setTime(a.currentTime);
    const meta = () => setDuration(a.duration || 0);
    const end = () => {
      setPlaying(false);
      setTime(0);
    };
    a.addEventListener("play", on);
    a.addEventListener("pause", off);
    a.addEventListener("timeupdate", tick);
    a.addEventListener("loadedmetadata", meta);
    a.addEventListener("ended", end);
    return () => {
      a.pause();
      a.src = "";
      a.removeEventListener("play", on);
      a.removeEventListener("pause", off);
      a.removeEventListener("timeupdate", tick);
      a.removeEventListener("loadedmetadata", meta);
      a.removeEventListener("ended", end);
    };
  }, []);

  const toggle = useCallback(
    (next: string, src: string) => {
      const a = ref.current;
      if (!a) return;
      if (id === next) {
        if (a.paused) a.play().catch(() => {});
        else a.pause();
        return;
      }
      a.pause();
      a.src = src;
      a.currentTime = 0;
      setId(next);
      setTime(0);
      setDuration(0);
      a.play().catch(() => {});
    },
    [id],
  );
  const seek = useCallback((r: number) => {
    const a = ref.current;
    if (a && a.duration) a.currentTime = Math.max(0, Math.min(1, r)) * a.duration;
  }, []);

  return <PlayerCtx.Provider value={{ id, playing, progress: duration ? time / duration : 0, time, duration, toggle, seek }}>{children}</PlayerCtx.Provider>;
}

export function usePlay(id: string, src: string) {
  const c = useContext(PlayerCtx);
  if (!c) throw new Error("usePlay needs <AudioProvider>");
  const active = c.id === id;
  return {
    active,
    playing: active && c.playing,
    progress: active ? c.progress : 0,
    time: active ? c.time : 0,
    duration: active ? c.duration : 0,
    toggle: () => c.toggle(id, src),
    seek: (r: number) => (active ? c.seek(r) : undefined),
  };
}

/** 直接播指定的一条(不管当前在播哪条):已经在播这条就不动，否则切过去播 */
export function usePlayThis() {
  const c = useContext(PlayerCtx);
  if (!c) throw new Error("usePlayThis needs <AudioProvider>");
  return (id: string, src: string) => {
    if (!(c.id === id && c.playing)) c.toggle(id, src);
  };
}

export const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/* 圆形播放键 */
export function PlayButton({ playing, onClick, label, size = "md", tone = "light" }: { playing: boolean; onClick: () => void; label: string; size?: "sm" | "md" | "lg"; tone?: "light" | "brand" | "glass" }) {
  const dim = size === "lg" ? "size-16" : size === "sm" ? "size-9" : "size-11";
  const icon = size === "lg" ? "size-6" : size === "sm" ? "size-3.5" : "size-4";
  const skin =
    tone === "brand"
      ? "bg-[#FF744D] text-[#240A03] hover:bg-[#FF8A66]"
      : tone === "glass"
        ? "bg-black/45 text-white ring-1 ring-white/25 backdrop-blur-md hover:bg-black/65"
        : playing
          ? "bg-[#FF744D] text-[#240A03]"
          : "bg-white text-[#240A03] hover:bg-[#FFF3EC]";
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={`${playing ? "Pause" : "Play"} ${label}`}
      aria-pressed={playing}
      className={`grid shrink-0 place-items-center rounded-full transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF744D] focus-visible:ring-offset-2 focus-visible:ring-offset-black ${dim} ${skin}`}
    >
      {playing ? <Pause className={`${icon} fill-current`} /> : <Play className={`${icon} translate-x-[1px] fill-current`} />}
    </button>
  );
}

/* 播放中的跳动音柱(减少动态效果时静止) */
export function Bars({ on, className = "", n = 5 }: { on: boolean; className?: string; n?: number }) {
  return (
    <span aria-hidden className={`inline-flex h-4 items-end gap-[3px] ${className}`}>
      {Array.from({ length: n }, (_, i) => (
        <span
          key={i}
          className={`w-[3px] rounded-full bg-current ${on ? "motion-safe:animate-[audiobar_0.9s_ease-in-out_infinite]" : ""}`}
          style={{ height: on ? `${40 + ((i * 37) % 60)}%` : "30%", animationDelay: `${i * 0.12}s` }}
        />
      ))}
      <style>{`@keyframes audiobar{0%,100%{transform:scaleY(.35)}50%{transform:scaleY(1)}}`}</style>
    </span>
  );
}

/* 静态波形(按 seed 生成，进度部分标橙;点击跳转) */
export function Wave({ seed, progress, onSeek, bars = 56, className = "h-10" }: { seed: string; progress: number; onSeek?: (r: number) => void; bars?: number; className?: string }) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const hs = Array.from({ length: bars }, (_, i) => {
    h = (h * 1103515245 + 12345) >>> 0;
    const env = Math.sin((i / bars) * Math.PI) * 0.55 + 0.45;
    return Math.max(0.12, ((h % 1000) / 1000) * env);
  });
  return (
    <div
      className={`flex w-full items-center gap-[2px] ${onSeek ? "cursor-pointer" : ""} ${className}`}
      onClick={(e) => {
        if (!onSeek) return;
        const r = e.currentTarget.getBoundingClientRect();
        onSeek((e.clientX - r.left) / r.width);
      }}
      aria-hidden
    >
      {hs.map((v, i) => (
        <span key={i} className={`flex-1 rounded-full transition-colors ${i / bars < progress ? "bg-[#FF744D]" : "bg-white/25"}`} style={{ height: `${Math.round(v * 1000) / 10}%` }} />
      ))}
    </div>
  );
}
