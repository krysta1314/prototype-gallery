"use client";

/* 预览播放 + 胶片条。
   播放用一个统一时钟(rAF)推进时间线时间 t,预览里的 <video> 跟着 t 找对应 clip、seek 到素材内的位置,
   这样图片、未生成的 AI 镜头、空位也能按时长「播」过去,和真实成片节奏一致。 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Loader2, Sparkles } from "lucide-react";
import type { EditApi } from "./timeline";
import { PresetsDock, SubtitleText, subtitlePreset } from "./subtitles";
import { playSfx } from "./audio";
import {
  ASPECTS,
  MUSIC_LIBRARY,
  layoutClips,
  resolveFraming,
  segmentAt,
  subSpan,
  type Asset,
  type Clip,
  type Project,
} from "./project";

/* ── 播放时钟 ── */
export type Player = ReturnType<typeof usePlayer>;

export function usePlayer(project: Project) {
  const { segs, total } = useMemo(() => layoutClips(project.clips), [project.clips]);
  const [rawT, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  /* 时间线变短时别让播放头掉出去:读的时候截断 */
  const t = Math.min(rawT, total);
  const tRef = useRef(0);
  useEffect(() => {
    tRef.current = t;
  }, [t]);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const next = tRef.current + (now - last) / 1000;
      tRef.current = next;
      last = now;
      if (next >= total) {
        setT(total);
        setPlaying(false);
        return;
      }
      setT(next);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, total]);

  const seek = useCallback(
    (next: number) => {
      const v = Math.max(0, Math.min(next, total));
      tRef.current = v;
      setT(v);
    },
    [total],
  );
  const toggle = useCallback(() => {
    setPlaying((p) => {
      if (!p && tRef.current >= total - 0.05) setT(0);
      return !p;
    });
  }, [total]);

  return { t, playing, total, segs, seek, toggle, setPlaying };
}

/* ── 胶片条:离屏 video 按秒抽帧,按 URL 缓存 ── */
type Frame = { t: number; src: string };
const stripCache = new Map<string, Frame[]>();
const stripJobs = new Map<string, Promise<Frame[]>>();

function extractFrames(url: string): Promise<Frame[]> {
  const existing = stripJobs.get(url);
  if (existing) return existing;
  const job = new Promise<Frame[]>((resolve) => {
    const v = document.createElement("video");
    v.crossOrigin = "anonymous";
    v.muted = true;
    v.preload = "auto";
    v.src = url;
    const frames: Frame[] = [];
    const done = () => {
      stripCache.set(url, frames);
      resolve(frames);
      v.removeAttribute("src");
      v.load();
    };
    v.onerror = done;
    v.onloadedmetadata = () => {
      const d = v.duration;
      if (!Number.isFinite(d) || d <= 0) return done();
      const n = Math.min(18, Math.max(4, Math.ceil(d)));
      const times = Array.from({ length: n }, (_, i) => ((i + 0.5) * d) / n);
      const canvas = document.createElement("canvas");
      const h = 96;
      canvas.height = h;
      canvas.width = Math.round((h * v.videoWidth) / Math.max(1, v.videoHeight));
      const ctx = canvas.getContext("2d");
      let i = 0;
      const next = () => {
        if (i >= times.length || !ctx) return done();
        v.currentTime = times[i];
      };
      v.onseeked = () => {
        try {
          ctx?.drawImage(v, 0, 0, canvas.width, canvas.height);
          frames.push({ t: times[i], src: canvas.toDataURL("image/jpeg", 0.62) });
        } catch {
          /* 跨域画布被污染:没有胶片条就算了 */
        }
        i += 1;
        next();
      };
      next();
    };
  });
  stripJobs.set(url, job);
  return job;
}

export function useFrames(asset?: Asset | null): Frame[] {
  const url = asset?.status === "ready" ? asset.url : undefined;
  const isImage = asset?.kind === "image";
  /* 帧存在模块缓存里;抽完后 bump 一下让组件重渲染 */
  const [, bump] = useState(0);
  useEffect(() => {
    if (!url || isImage || stripCache.has(url)) return;
    let alive = true;
    void extractFrames(url).then(() => alive && bump((n) => n + 1));
    return () => {
      alive = false;
    };
  }, [url, isImage]);
  if (!url) return [];
  if (isImage) return [{ t: 0, src: url }];
  return stripCache.get(url) ?? [];
}

/** 时间线上一条 clip 的胶片条:按像素铺帧,每一格取它对应的素材时间 → trim 时能看到画面在变 */
export function Filmstrip({
  asset,
  clip,
  pxPerSec,
  height,
}: {
  asset?: Asset | null;
  clip: Clip;
  pxPerSec: number;
  height: number;
}) {
  const frames = useFrames(asset);
  const aspect = asset?.aspect ?? 9 / 16;
  const tileW = Math.max(18, Math.round(height * aspect));
  const width = ((clip.outSec - clip.inSec) / clip.speed) * pxPerSec;
  const count = Math.max(1, Math.ceil(width / tileW));
  if (frames.length === 0) return null;
  return (
    <div className="absolute inset-0 flex overflow-hidden">
      {Array.from({ length: count }, (_, i) => {
        const srcT = clip.inSec + ((i * tileW) / pxPerSec) * clip.speed;
        const f = frames.reduce((best, fr) => (Math.abs(fr.t - srcT) < Math.abs(best.t - srcT) ? fr : best), frames[0]);
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={f.src}
            alt=""
            draggable={false}
            className="h-full shrink-0 object-cover"
            style={{ width: tileW }}
          />
        );
      })}
    </div>
  );
}

export type Scrub = { assetId: string; time: number } | null;

/* ── 预览画面 ── */
export function Preview({
  project,
  player,
  scrub,
  active = true,
  dark = true,
  selectedId,
  edit,
}: {
  project: Project;
  player: Player;
  /** trim 时临时看某个素材的某一帧 */
  scrub?: Scrub;
  /** 同一时刻只让一个预览真的出声出画(全屏编辑打开时,画布上那个静音暂停) */
  active?: boolean;
  dark?: boolean;
  /** 选中的片段:它在播放头下、用填满模式时,可以拖预览调整裁切位置 */
  selectedId?: string | null;
  edit?: EditApi;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const bgRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const seg = segmentAt(player.segs, player.t);
  const clip = seg?.clip;
  const asset = scrub
    ? project.assets.find((a) => a.id === scrub.assetId)
    : clip?.assetId
      ? project.assets.find((a) => a.id === clip.assetId)
      : undefined;
  const ready = asset?.status === "ready" && !!asset.url;
  const isVideo = ready && asset?.kind === "video";
  const srcTime = scrub ? scrub.time : clip && seg ? clip.inSec + (player.t - seg.start) * clip.speed : 0;
  const playing = active && player.playing && !scrub;

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !isVideo || !asset?.url) return;
    if (v.getAttribute("src") !== asset.url) v.src = asset.url;
    const apply = () => {
      if (!playing || Math.abs(v.currentTime - srcTime) > 0.3) {
        try {
          v.currentTime = srcTime;
        } catch {}
      }
      v.playbackRate = clip?.speed ?? 1;
      v.muted = !active || !project.originalOn || !!clip?.muted;
      v.volume = Math.min(1, project.voiceVol / 100);
      if (playing) void v.play().catch(() => {});
      else v.pause();
    };
    if (v.readyState >= 1) apply();
    else v.onloadedmetadata = apply;
  }, [isVideo, asset?.url, srcTime, playing, clip?.speed, clip?.muted, project.originalOn, project.voiceVol, active]);

  /* 音效:播放头越过它的时间点就响一次(拖动播放头不触发) */
  const lastT = useRef(player.t);
  useEffect(() => {
    const prev = lastT.current;
    lastT.current = player.t;
    if (!playing || !project.sfx?.length) return;
    for (const cue of project.sfx) if (cue.at > prev && cue.at <= player.t && player.t - prev < 0.5) playSfx(cue.kind);
  }, [player.t, playing, project.sfx]);

  const music = MUSIC_LIBRARY.find((m) => m.id === project.musicId) ?? aiMusic(project);
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (!music || !active) {
      a.pause();
      return;
    }
    if (a.getAttribute("src") !== music.url) a.src = music.url;
    a.volume = project.musicVol / 100;
    if (playing) {
      if (Math.abs(a.currentTime - player.t) > 0.4) a.currentTime = player.t;
      void a.play().catch(() => {});
    } else {
      a.pause();
      if (Math.abs(a.currentTime - player.t) > 0.4) a.currentTime = player.t;
    }
  }, [music, playing, player.t, project.musicVol, active]);

  const ratio = ASPECTS[project.aspect];
  /* 画面处理:比例接近就填满裁切,差很多就完整显示 + 背景(默认用自己的模糊放大版) */
  const framing = clip ? resolveFraming(clip, asset, project.aspect) : "fill";
  const fitBg = clip?.fitBg ?? "blur";
  const panX = clip?.panX ?? 0.5;
  const panY = clip?.panY ?? 0.5;
  const mediaCls = framing === "fit" ? "relative size-full object-contain" : "size-full object-cover";
  const mediaStyle = framing === "fill" ? { objectPosition: `${panX * 100}% ${panY * 100}%` } : undefined;
  const blurBg = framing === "fit" && fitBg === "blur" && ready;
  /* 裁切方向:素材比成片宽 → 左右有富余可拖;更窄 → 上下可拖 */
  const overflow = asset && ready ? (asset.aspect > ratio + 0.01 ? "x" : asset.aspect < ratio - 0.01 ? "y" : null) : null;
  const pannable =
    !!edit && !!clip && selectedId === clip.id && framing === "fill" && !!overflow && !player.playing && !scrub;

  /* 模糊背景那份视频跟着主画面走 */
  useEffect(() => {
    const bg = bgRef.current;
    const v = videoRef.current;
    if (!bg || !v || !blurBg || !isVideo || !asset?.url) return;
    if (bg.getAttribute("src") !== asset.url) bg.src = asset.url;
    const sync = () => {
      if (Math.abs(bg.currentTime - v.currentTime) > 0.3) {
        try {
          bg.currentTime = v.currentTime;
        } catch {}
      }
      bg.playbackRate = v.playbackRate;
      if (playing) void bg.play().catch(() => {});
      else bg.pause();
    };
    if (bg.readyState >= 1) sync();
    else bg.onloadedmetadata = sync;
  }, [blurBg, isVideo, asset?.url, srcTime, playing]);

  const startPan = (e: React.PointerEvent) => {
    if (!pannable || !clip || !asset || !edit || e.button !== 0) return;
    const box = frameRef.current?.getBoundingClientRect();
    if (!box) return;
    e.preventDefault();
    e.stopPropagation();
    edit.begin();
    const start = { x: e.clientX, y: e.clientY, px: panX, py: panY };
    /* 可拖动的富余量(屏幕像素):素材按填满放大后比画框多出来的部分 */
    const spare = overflow === "x" ? box.height * asset.aspect - box.width : box.width / asset.aspect - box.height;
    const move = (ev: PointerEvent) => {
      const clamp = (n: number) => Math.min(1, Math.max(0, n));
      const next =
        overflow === "x"
          ? { panX: clamp(start.px - (ev.clientX - start.x) / Math.max(1, spare)), panY: start.py }
          : { panX: start.px, panY: clamp(start.py - (ev.clientY - start.y) / Math.max(1, spare)) };
      edit.update((p) => ({ ...p, clips: p.clips.map((c) => (c.id === clip.id ? { ...c, ...next } : c)) }));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  /* 没有画面(未生成 / 缺素材)时底色很浅,Clean 白字会看不清,临时换成带底框的 */
  const chosen = subtitlePreset(project.subtitleStyle);
  const span = clip && seg ? subSpan(clip, seg.len) : null;
  const local = seg ? player.t - seg.start : 0;
  const showSub = !!clip?.subtitle && !!span && local >= span.from - 0.001 && local <= span.to + 0.001;

  return (
    <div className="relative grid size-full place-items-center overflow-hidden">
      <div
        ref={frameRef}
        data-nodrag={pannable ? "" : undefined}
        onPointerDown={startPan}
        className={`group/frame relative max-h-full max-w-full overflow-hidden rounded-md ${
          framing === "fit" && ready ? (fitBg === "white" ? "bg-white" : "bg-black") : dark ? "bg-black" : "bg-white"
        } ${dark ? "" : "shadow-[0_2px_12px_rgba(26,26,46,0.08)]"} ${pannable ? "cursor-grab active:cursor-grabbing" : ""}`}
        style={{
          aspectRatio: String(ratio),
          height: ratio < 1 ? "100%" : undefined,
          width: ratio >= 1 ? "100%" : undefined,
          containerType: "inline-size",
        }}
      >
        {blurBg && isVideo && (
          <video
            ref={bgRef}
            muted
            playsInline
            crossOrigin="anonymous"
            aria-hidden
            className="pointer-events-none absolute inset-0 size-full scale-110 object-cover blur-2xl brightness-90"
          />
        )}
        {blurBg && !isVideo && asset?.url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={asset.url}
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-0 size-full scale-110 object-cover blur-2xl brightness-90"
          />
        )}
        {isVideo ? (
          <video ref={videoRef} playsInline crossOrigin="anonymous" className={mediaCls} style={mediaStyle} draggable={false} />
        ) : ready && asset?.kind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={asset.url} alt="" className={mediaCls} style={mediaStyle} draggable={false} />
        ) : (
          <EmptyFrame asset={asset} note={clip?.note} dark={dark} />
        )}
        {pannable && (
          <span className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white opacity-0 backdrop-blur transition group-hover/frame:opacity-100">
            Drag to reposition
          </span>
        )}
        {!scrub && showSub && clip && span && (
          <span className="pointer-events-none absolute inset-x-[8%] bottom-[12%] text-center">
            <SubtitleText
              text={clip.subtitle}
              preset={chosen}
              progress={(local - span.from) / Math.max(0.01, span.to - span.from)}
              className="text-[clamp(11px,3.4cqw,18px)]"
              fallbackBox={!ready}
            />
          </span>
        )}
      </div>
      {edit && <PresetsDock project={project} edit={edit} />}
      <audio ref={audioRef} preload="auto" />
    </div>
  );
}

export function aiMusic(project: Project) {
  const a = project.assets.find((x) => x.kind === "audio" && x.id === project.musicId);
  return a?.status === "ready" && a.url ? { id: a.id, name: a.label, mood: "AI · Custom", url: a.url } : undefined;
}

function EmptyFrame({ asset, note, dark }: { asset?: Asset; note?: string; dark: boolean }) {
  if (asset?.origin === "ai") {
    return (
      <div
        className={`flex size-full flex-col items-center justify-center gap-2 p-4 text-center ${
          dark
            ? "bg-[radial-gradient(120%_80%_at_50%_0%,#3a2418_0%,#121214_70%)] [--t1:rgba(255,255,255,0.85)] [--t2:rgba(255,255,255,0.55)]"
            : "bg-[radial-gradient(120%_80%_at_50%_0%,#eef0f4_0%,#f8f9fb_70%)] [--t1:#1a1a2e] [--t2:#6a6b7b]"
        }`}
      >
        {asset.status === "generating" ? (
          <>
            <Loader2 className="size-5 animate-spin text-[#ff5e1a]" />
            <span className="text-[12px] font-semibold text-[var(--t1)]">Generating… {asset.progress ?? 0}%</span>
          </>
        ) : (
          <>
            <Sparkles className="size-5 text-[#ff5e1a]" />
            <span className="text-[12px] font-semibold text-[var(--t1)]">AI shot — not generated yet</span>
            <span className="line-clamp-3 text-[11px] leading-snug text-[var(--t2)]">{asset.prompt}</span>
          </>
        )}
      </div>
    );
  }
  return (
    <div
      className={`flex size-full flex-col items-center justify-center gap-2 p-4 text-center ${
        dark ? "bg-[#161618] text-white/70" : "bg-[#eceef2] text-[#6a6b7b]"
      }`}
    >
      <ImagePlus className="size-5" />
      <span className="text-[12px] font-semibold">Missing shot — add your footage</span>
      {note && <span className="line-clamp-3 text-[11px] leading-snug opacity-75">{note}</span>}
    </div>
  );
}
