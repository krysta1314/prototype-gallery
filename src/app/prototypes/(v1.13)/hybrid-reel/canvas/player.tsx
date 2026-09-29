"use client";

/* 预览播放 + 胶片条。
   播放用一个统一时钟(rAF)推进时间线时间 t,预览里的 <video> 跟着 t 找对应 clip、seek 到素材内的位置,
   这样图片、未生成的 AI 镜头、空位也能按时长「播」过去,和真实成片节奏一致。 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Video } from "lucide-react";
import { GenFill } from "./ui";
import type { EditApi, SelectPart } from "./timeline";
import { SubtitleText, subtitlePreset } from "./subtitles";
import { CARD_Y, CardText } from "./cards";
import { playSfx } from "./audio";
import {
  ASPECTS,
  MUSIC_LIBRARY,
  SFX_LIBRARY,
  cardSpan,
  layoutClips,
  musicTitle,
  resolveFraming,
  segmentAt,
  subSpan,
  type Asset,
  type Clip,
  type Project,
  type TextCard,
  voiceAt,
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
/** 字幕默认位置:底部居中(和改之前的「距底 12%」视觉上一致) */
export const SUB_POS_DEFAULT = { x: 0.5, y: 0.84 };

export function Preview({
  project,
  player,
  scrub,
  active = true,
  dark = true,
  selectedId,
  selectedPart = "clip",
  onSelect,
  edit,
  onGenerate,
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
  /** 选中的是画面还是字幕;字幕选中时预览里的字幕出选中框,可拖动 */
  selectedPart?: SelectPart;
  /** 传了就能在预览里点字幕选中它 */
  onSelect?: (id: string | null, part?: SelectPart) => void;
  edit?: EditApi;
  /** 传了就在未生成镜头的预览里出「Generate shot」 */
  onGenerate?: (assetId: string) => void;
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
  /* 这个镜头有生成好的配音:原声自动压到 20%,不和配音抢(片段自己的音量再乘上去) */
  const dubbed = !!clip && (project.voice ?? []).some((v) => v.clipId === clip.id && v.url);
  const clipVol = (clip?.volume ?? 100) / 100;

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
      v.volume = Math.min(1, (project.voiceVol / 100) * clipVol * (dubbed ? DUCK : 1));
      if (playing) void v.play().catch(() => {});
      else v.pause();
    };
    if (v.readyState >= 1) apply();
    else v.onloadedmetadata = apply;
  }, [isVideo, asset?.url, srcTime, playing, clip?.speed, clip?.muted, project.originalOn, project.voiceVol, active, dubbed, clipVol]);

  /* 音效:播放头越过它的时间点就响一次(拖动播放头不触发) */
  const lastT = useRef(player.t);
  useEffect(() => {
    const prev = lastT.current;
    lastT.current = player.t;
    if (!playing || !project.sfx?.length) return;
    for (const cue of project.sfx)
      if (cue.at > prev && cue.at <= player.t && player.t - prev < 0.5) {
        /* 上传的音效直接放文件(从掐掉的开头之后放,放到 trim 后的长度就停),库里的现场合成。
           拉得比音效本身长:每隔一个音效长度重放一次,放满 trim 后的长度 */
        const src = cue.srcLen ?? SFX_LIBRARY.find((x) => x.id === cue.kind)?.durationSec ?? 0.5;
        const len = cue.len ?? src;
        const once = (first: boolean) => {
          if (cue.url) {
            const el = new Audio(cue.url);
            el.currentTime = first ? cue.offset ?? 0 : 0;
            el.loop = true;
            void el.play().catch(() => {});
            return el;
          }
          playSfx(cue.kind);
          return null;
        };
        if (cue.url) {
          const el = once(true);
          window.setTimeout(() => el?.pause(), len * 1000);
        } else {
          once(true);
          for (let k = 1; k * src < len - 0.05 && k < 40; k++) window.setTimeout(() => once(false), k * src * 1000);
        }
      }
  }, [player.t, playing, project.sfx]);

  const music = MUSIC_LIBRARY.find((m) => m.id === project.musicId) ?? aiMusic(project);
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    /* 音乐轨 trim 过:只在 [musicIn, musicOut) 这段里出声 */
    const inRange = player.t >= (project.musicIn ?? 0) && player.t < (project.musicOut ?? Infinity);
    if (!music || !active) {
      a.pause();
      return;
    }
    if (a.getAttribute("src") !== music.url) a.src = music.url;
    /* 旁白、口播响起时音乐自动压低(spec 2.8),说完恢复 */
    const talking =
      (project.voice ?? []).some((v) => {
        const at = voiceAt(v, player.segs);
        return !!(v.url || v.text === undefined) && player.t >= at && player.t < at + v.len;
      }) ||
      (!!clip && !clip.muted && project.originalOn && clip.subtitleSource === "stt" && !!clip.subtitle && !!asset?.hasVoice);
    a.volume = (project.musicVol / 100) * (talking ? MUSIC_DUCK : 1);
    /* 整段拖动过:曲子跟着挪,文件里的位置 = 成片时间 - 挪动的秒数 */
    const fileT = Math.max(0, player.t - (project.musicShift ?? 0));
    if (playing && inRange) {
      if (Math.abs(a.currentTime - fileT) > 0.4) a.currentTime = fileT;
      void a.play().catch(() => {});
    } else {
      a.pause();
      if (Math.abs(a.currentTime - fileT) > 0.4) a.currentTime = fileT;
    }
  }, [music, playing, player.t, project.musicVol, project.musicIn, project.musicOut, project.musicShift, active, project.voice, player.segs, clip, asset?.hasVoice, project.originalOn]);

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
    !!edit && !!clip && selectedId === clip.id && selectedPart === "clip" && framing === "fill" && !!overflow && !player.playing && !scrub;

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
  const subPos = project.subtitlePos ?? SUB_POS_DEFAULT;
  const subSelected = !!clip && selectedId === clip.id && selectedPart === "sub";
  const subEditable = !!edit && !!onSelect;
  /* 拖字幕时画框中线的吸附参考线 */
  const [snapX, setSnapX] = useState(false);
  const [draggingSub, setDraggingSub] = useState(false);

  /* 点字幕 = 选中它;按住拖 = 挪位置(按画框比例存,画布缩放、全屏大小都不影响) */
  const startSubDrag = (e: React.PointerEvent) => {
    if (!subEditable || !clip || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect!(clip.id, "sub");
    const box = frameRef.current?.getBoundingClientRect();
    if (!box) return;
    const start = { x: e.clientX, y: e.clientY, px: subPos.x, py: subPos.y };
    let began = false;
    const move = (ev: PointerEvent) => {
      const dx = (ev.clientX - start.x) / box.width;
      const dy = (ev.clientY - start.y) / box.height;
      if (!began) {
        if (Math.hypot(ev.clientX - start.x, ev.clientY - start.y) < 3) return;
        began = true;
        edit!.begin();
        setDraggingSub(true);
      }
      let x = Math.min(0.9, Math.max(0.1, start.px + dx));
      const y = Math.min(0.94, Math.max(0.06, start.py + dy));
      const snap = Math.abs(x - 0.5) < 0.025;
      if (snap) x = 0.5;
      setSnapX(snap);
      edit!.update((p) => ({ ...p, subtitlePos: { x, y } }));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      setSnapX(false);
      setDraggingSub(false);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  /* 屏幕文字:和字幕一样,点 = 选中,按住拖 = 挪位置(每张单独记,按画框比例存);靠近中线吸附 */
  const [draggingCard, setDraggingCard] = useState<string | null>(null);
  const startCardDrag = (e: React.PointerEvent, c: TextCard) => {
    if (!onSelect || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect(c.id, "card");
    const box = frameRef.current?.getBoundingClientRect();
    if (!box || !edit) return;
    const start = { x: e.clientX, y: e.clientY, px: c.x ?? 0.5, py: c.y ?? CARD_Y[c.pos] };
    let began = false;
    const move = (ev: PointerEvent) => {
      if (!began) {
        if (Math.hypot(ev.clientX - start.x, ev.clientY - start.y) < 3) return;
        began = true;
        edit.begin();
        setDraggingCard(c.id);
      }
      let x = Math.min(0.9, Math.max(0.1, start.px + (ev.clientX - start.x) / box.width));
      const y = Math.min(0.94, Math.max(0.06, start.py + (ev.clientY - start.y) / box.height));
      const snap = Math.abs(x - 0.5) < 0.025;
      if (snap) x = 0.5;
      setSnapX(snap);
      edit.update((p) => ({ ...p, cards: (p.cards ?? []).map((k) => (k.id === c.id ? { ...k, x, y } : k)) }));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      setSnapX(false);
      setDraggingCard(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  /* 拖选中框的角:按和中心的距离等比缩放字号(0.5–3 倍),和剪映一样;拖的时候不选中别的、不挪位置 */
  const startScale = (e: React.PointerEvent, from: number, apply: (scale: number) => void) => {
    if (!edit || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const box = (e.currentTarget as HTMLElement).parentElement?.getBoundingClientRect();
    if (!box) return;
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    const d0 = Math.max(4, Math.hypot(e.clientX - cx, e.clientY - cy));
    edit.begin();
    const move = (ev: PointerEvent) => {
      const k = Math.hypot(ev.clientX - cx, ev.clientY - cy) / d0;
      apply(Math.round(Math.min(3, Math.max(0.5, from * k)) * 100) / 100);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  /* ── 方案里的画面处理(spec 2.2):图片动效、局部放大、设备外壳、评价卡片化、点击高亮、画中画 ──
     都是预览里的近似效果(CSS 变换),导出时由渲染端做真的 */
  const prog = seg ? Math.min(1, Math.max(0, local / Math.max(0.1, seg.len))) : 0;
  const treat = scrub ? undefined : clip;
  const zoom = treat?.zoom;
  const motionT = (() => {
    const m = treat?.motion;
    if (!m || m === "none" || m === "scroll") return "";
    if (m === "push-in") return `scale(${1 + 0.14 * prog})`;
    if (m === "pull-out") return `scale(${1.14 - 0.14 * prog})`;
    const dx = (m === "pan-left" ? 1 - 2 * prog : 2 * prog - 1) * 4;
    return `scale(1.12) translateX(${dx}%)`;
  })();
  /* 局部放大:把区域中心移到画框中心再放大;跟光标走的轻微漂移一下 */
  const zoomT = zoom
    ? (() => {
        const k = Math.min(3, 1 / Math.max(zoom.w, zoom.h));
        const cx = zoom.x + zoom.w / 2 + (zoom.follow ? 0.04 * Math.sin(prog * Math.PI * 2) : 0);
        const cy = zoom.y + zoom.h / 2;
        return `scale(${k}) translate(${(0.5 - cx) * 100}%, ${(0.5 - cy) * 100}%)`;
      })()
    : "";
  const scrollPos = treat?.motion === "scroll" && asset?.kind === "image" ? { objectPosition: `50% ${prog * 100}%` } : undefined;
  const treatStyle: React.CSSProperties = { transform: [motionT, zoomT].filter(Boolean).join(" ") || undefined, transformOrigin: "center" };
  /* 设备外壳 / 评价卡片:画面缩进一个框里,外面铺模糊底 */
  const framed = !!treat && ready && (treat.device || treat.asCard);
  const frameBox = treat?.device === "phone"
    ? "absolute left-1/2 top-1/2 h-[82%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[9%/5%] ring-[6px] ring-[#111] shadow-[0_18px_40px_rgba(0,0,0,0.45)]"
    : treat?.device === "laptop"
      ? "absolute left-1/2 top-1/2 w-[88%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-t-[4%] ring-[5px] ring-[#1d1d1f] shadow-[0_18px_40px_rgba(0,0,0,0.45)]"
      : "absolute inset-x-[9%] top-1/2 -translate-y-1/2 overflow-hidden rounded-[14px] bg-white shadow-[0_18px_40px_rgba(0,0,0,0.35)]";
  const frameAspect = treat?.device === "phone" ? 9 / 19.5 : treat?.device === "laptop" ? 16 / 10 : asset?.aspect ?? 1;
  const pipAsset = treat?.pipId ? project.assets.find((x) => x.id === treat.pipId && x.url) : undefined;

  /* ── 字卡:播放头下的每一张,按进场动效画出来;点了选中(可在右侧改文案 / 样式) ── */
  const cardsNow = scrub
    ? []
    : (project.cards ?? []).flatMap((c) => {
        const sp = cardSpan(c, player.segs);
        return sp && player.t >= sp.from - 0.001 && player.t <= sp.to + 0.001 ? [{ c, p: (player.t - sp.from) / 0.45 }] : [];
      });

  return (
    <div className="relative grid size-full place-items-center overflow-hidden">
      <div
        ref={frameRef}
        data-nodrag={pannable ? "" : undefined}
        onPointerDown={startPan}
        className={`group/frame relative max-h-full max-w-full overflow-hidden ${
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
        {framed && asset?.url && (
          /* 框外的模糊底:设备外壳 / 评价卡片外面那一圈 */
          asset.kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={asset.url} alt="" aria-hidden className="pointer-events-none absolute inset-0 size-full scale-110 object-cover blur-2xl brightness-75" />
          ) : (
            <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#2a2d3a] to-[#111217]" />
          )
        )}
        {isVideo || (ready && asset?.kind === "image") ? (
          <div className={framed ? frameBox : "absolute inset-0"} style={framed ? { aspectRatio: String(frameAspect) } : undefined}>
            <div className="relative size-full" style={treatStyle}>
              {isVideo ? (
                <video ref={videoRef} playsInline crossOrigin="anonymous" className={framed ? "size-full object-cover" : mediaCls} style={framed ? undefined : mediaStyle} draggable={false} />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={asset!.url} alt="" className={framed ? "size-full object-cover" : mediaCls} style={framed ? scrollPos : { ...mediaStyle, ...scrollPos }} draggable={false} />
              )}
              {treat?.highlight && (
                /* 点击高亮:放大区域中心(没有就画面中心)一圈光圈 */
                <span
                  aria-hidden
                  className="pointer-events-none absolute size-[14%] -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full ring-4 ring-[#ffcf33]"
                  style={{ left: `${((zoom?.x ?? 0.4) + (zoom?.w ?? 0.2) / 2) * 100}%`, top: `${((zoom?.y ?? 0.4) + (zoom?.h ?? 0.2) / 2) * 100}%`, aspectRatio: "1" }}
                />
              )}
            </div>
            {treat?.device === "laptop" && <span aria-hidden className="absolute inset-x-0 bottom-0 h-[3%] bg-[#1d1d1f]" />}
          </div>
        ) : (
          <ShotSlate
            asset={asset}
            note={clip?.note}
            credits={asset?.cost ?? project.creditsPerShot}
            dark={dark}
            /* 预览区生成的是播放头所在的这一镜:同时选中它,右侧 Settings 显示的也是这一镜,两个 Generate 不会指向不同镜头 */
            onGenerate={
              onGenerate &&
              ((id: string) => {
                if (clip) onSelect?.(clip.id, "clip");
                onGenerate(id);
              })
            }
          />
        )}
        {pannable && (
          <span className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white opacity-0 backdrop-blur transition group-hover/frame:opacity-100">
            Drag to reposition
          </span>
        )}
        {(draggingSub || draggingCard) && snapX && (
          <span aria-hidden className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-px -translate-x-1/2 bg-[#ff5e1a]/70" />
        )}
        {pipAsset && (
          /* 画中画:右下角小窗 */
          <span className="pointer-events-none absolute bottom-[16%] right-[5%] z-10 w-[30%] overflow-hidden rounded-[10px] ring-2 ring-white shadow-[0_8px_20px_rgba(0,0,0,0.35)]" style={{ aspectRatio: String(pipAsset.aspect) }}>
            {pipAsset.kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={pipAsset.url} alt="" className="size-full object-cover" />
            ) : (
              <video src={pipAsset.url} muted loop autoPlay playsInline className="size-full object-cover" />
            )}
          </span>
        )}
        {cardsNow.map(({ c, p }) => {
          const sel = selectedId === c.id && selectedPart === "card";
          return (
            <span
              key={c.id}
              role={onSelect ? "button" : undefined}
              aria-label={onSelect ? `Text: ${c.text || "empty"}` : undefined}
              data-nodrag={onSelect ? "" : undefined}
              onPointerDown={(e) => startCardDrag(e, c)}
              className={`absolute z-20 w-max max-w-[86%] -translate-x-1/2 -translate-y-1/2 rounded-[2px] px-2 py-1 ${
                onSelect ? (draggingCard === c.id ? "cursor-grabbing" : "cursor-grab") : "pointer-events-none"
              } ${sel ? "shadow-[0_0_0_1.5px_#fff,0_0_3px_1.5px_rgba(0,0,0,0.35)]" : onSelect ? "hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.75),0_0_3px_1.5px_rgba(0,0,0,0.2)]" : ""}`}
              style={{ left: `${(c.x ?? 0.5) * 100}%`, top: `${(c.y ?? CARD_Y[c.pos]) * 100}%`, fontSize: `calc(3.6cqw * ${c.scale ?? 1})` }}
            >
              {sel && edit && (
                <ScaleHandles
                  onStart={(e) =>
                    startScale(e, c.scale ?? 1, (scale) =>
                      edit.update((p) => ({ ...p, cards: (p.cards ?? []).map((k) => (k.id === c.id ? { ...k, scale } : k)) })),
                    )
                  }
                />
              )}
              {c.text ? (
                <CardText text={c.text} style={c.style} accent={project.cardAccent} anim={c.anim} progress={player.playing ? p : 1} />
              ) : (
                /* 空字卡:只在能编辑的预览里留一个虚线占位,成片里不出现 */
                onSelect && <span className="block rounded-md border border-dashed border-white/70 bg-black/25 px-3 py-1.5 text-[0.8em] font-semibold text-white/85">Type the on-screen text</span>
              )}
            </span>
          );
        })}
        {!scrub && showSub && clip && span && (
          <span
            role={subEditable ? "button" : undefined}
            aria-label={subEditable ? "Subtitle — drag to move" : undefined}
            data-nodrag={subEditable ? "" : undefined}
            onPointerDown={startSubDrag}
            className={`group/sub absolute z-20 w-max max-w-[84%] -translate-x-1/2 -translate-y-1/2 rounded-[2px] px-2.5 py-1 text-center ${
              subEditable ? (draggingSub ? "cursor-grabbing" : "cursor-grab") : "pointer-events-none"
            } ${
              subSelected
                ? "shadow-[0_0_0_1.5px_#fff,0_0_3px_1.5px_rgba(0,0,0,0.35)]"
                : subEditable
                  ? "hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.75),0_0_3px_1.5px_rgba(0,0,0,0.2)]"
                  : ""
            }`}
            style={{ left: `${subPos.x * 100}%`, top: `${subPos.y * 100}%`, fontSize: `calc(3.4cqw * ${project.subtitleScale ?? 1})` }}
          >
            <SubtitleText
              text={clip.subtitle}
              preset={chosen}
              progress={(local - span.from) / Math.max(0.01, span.to - span.from)}
              fallbackBox={!ready}
            />
            {subSelected && edit && !draggingSub && (
              <ScaleHandles onStart={(e) => startScale(e, project.subtitleScale ?? 1, (subtitleScale) => edit.update((p) => ({ ...p, subtitleScale })))} />
            )}
            {subSelected && !draggingSub && (
              <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white opacity-0 backdrop-blur transition group-hover/sub:opacity-100">
                Drag to move · all subtitles
              </span>
            )}
          </span>
        )}
      </div>
      <audio ref={audioRef} preload="auto" />
      {/* 音频轨上的配音:播放头走到哪段,哪段跟着出声 */}
      {(project.voice ?? []).map((v) => {
        /* 分段配音每句一个音频,整段的用节点上的;起点跟着镜头走 */
        const url = v.text !== undefined ? v.url : project.assets.find((x) => x.id === v.assetId)?.url;
        return url ? (
          <VoicePlayer key={v.id} url={url} at={voiceAt(v, player.segs)} len={v.len} offset={v.offset ?? 0} t={player.t} playing={playing} volume={project.voiceVol} />
        ) : null;
      })}
    </div>
  );
}

function VoicePlayer({
  url,
  at,
  len,
  offset,
  t,
  playing,
  volume,
}: {
  url: string;
  at: number;
  len: number;
  /** 掐掉的开头:文件从这一秒开始放 */
  offset: number;
  t: number;
  playing: boolean;
  volume: number;
}) {
  const ref = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const inside = t - at >= 0 && t - at < len;
    const local = t - at + offset;
    el.volume = Math.min(1, volume / 100);
    if (playing && inside) {
      if (Math.abs(el.currentTime - local) > 0.3) el.currentTime = local;
      void el.play().catch(() => {});
    } else {
      el.pause();
      if (inside && Math.abs(el.currentTime - local) > 0.05) el.currentTime = local;
    }
  }, [t, at, len, offset, playing, volume]);
  return <audio ref={ref} src={url} preload="auto" />;
}

/** 有配音时原声压到多少 */
export const DUCK = 0.2;
/** 旁白 / 口播时音乐压到多少 */
export const MUSIC_DUCK = 0.45;

export function aiMusic(project: Project) {
  const a = project.assets.find((x) => x.kind === "audio" && x.id === project.musicId);
  /* 节点统一叫 Audio Generator;音乐轨上写清楚是 AI 配乐还是上传的曲子 */
  return a?.status === "ready" && a.url ? { id: a.id, name: a.origin === "ai" ? musicTitle(project, a) : a.label, mood: "AI · Custom", url: a.url } : undefined;
}

/* 还没画面的镜头(预览区空状态):图标 + 标题说明这是 AI 生成的镜头 + 镜头信息 + 提示词 + 生成按钮,整体居中。
   放在画面中上部,不压住底部的字幕;生成中把按钮换成进度条 */
function ShotSlate({
  asset,
  note,
  credits,
  dark,
  onGenerate,
}: {
  asset?: Asset;
  note?: string;
  credits: number;
  dark: boolean;
  onGenerate?: (assetId: string) => void;
}) {
  const ai = asset?.origin === "ai";
  const busy = asset?.status === "generating";
  /* 生成中底色是暖橙渐变,文字一律用深色 */
  const c = dark && !busy
    ? { bg: "bg-[#17171a]", ink: "text-white/90", sub: "text-white/60", tile: "bg-white/[0.06] text-white/80 ring-1 ring-inset ring-white/10" }
    : { bg: "bg-[#f1f2f5]", ink: "text-[#1a1a2e]", sub: "text-[#4a4b5c]", tile: "bg-white text-[#4a4b5c] ring-1 ring-inset ring-[#e1e3e9]" };
  return (
    <div className={`relative size-full ${c.bg}`}>
      {/* 生成中:整个画面是流动的暖橙渐变,和画布节点 / 时间线同一套 */}
      {ai && busy && <GenFill />}
      <div className="absolute inset-x-[10%] top-[40%] flex -translate-y-1/2 flex-col items-center text-center">
        {!busy && (
          <span className={`grid size-[clamp(30px,10cqw,40px)] place-items-center rounded-[10px] ${c.tile}`}>
            {!ai ? <ImagePlus className="size-[45%]" /> : <Video className="size-[45%]" />}
          </span>
        )}
        <p className={`mt-[3cqw] text-[clamp(13px,4.2cqw,16px)] font-semibold leading-tight ${c.ink}`}>
          {!ai ? "Add your footage" : busy ? "Generating shot…" : "AI-generated shot"}
        </p>
        {(ai ? asset?.prompt : note) && (
          <p className={`mt-[3cqw] line-clamp-4 max-w-[34ch] text-[clamp(11px,3.3cqw,13.5px)] leading-snug [text-wrap:pretty] ${c.sub}`}>
            {ai ? asset?.prompt : note}
          </p>
        )}

        {ai && busy && (
          <p className="mt-[3cqw] text-[clamp(11px,3.3cqw,13.5px)] font-semibold tabular-nums text-[#1a1a2e]/70">{asset?.progress ?? 0}%</p>
        )}
        {ai && !busy && onGenerate && asset && (
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onGenerate(asset.id)}
            /* 和 Video Settings 底部的 Generate Video 同一个按钮样式 */
            className="mt-[4.5cqw] flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-5 py-2.5 text-[clamp(12px,3.4cqw,14px)] font-bold text-white transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40 focus-visible:ring-offset-2"
          >
            {asset.status === "ready" ? "Regenerate" : "Generate Video"}
            <span className="flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[0.9em] tabular-nums">
              <span className="size-2.5 rounded-full bg-white" /> {credits}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

/* 选中框的缩放把手(字幕、屏幕文字共用),样式参考剪映:四角浅灰圆点 + 左右两侧竖胶囊,拖任意一个都等比缩放字号 */
function ScaleHandles({ onStart }: { onStart: (e: React.PointerEvent) => void }) {
  const handles = [
    { x: 0, y: 0, cls: "size-3 cursor-nwse-resize", label: "top left" },
    { x: 100, y: 0, cls: "size-3 cursor-nesw-resize", label: "top right" },
    { x: 0, y: 100, cls: "size-3 cursor-nesw-resize", label: "bottom left" },
    { x: 100, y: 100, cls: "size-3 cursor-nwse-resize", label: "bottom right" },
    { x: 0, y: 50, cls: "h-4 w-[7px] cursor-ew-resize", label: "left" },
    { x: 100, y: 50, cls: "h-4 w-[7px] cursor-ew-resize", label: "right" },
  ];
  return (
    <>
      {handles.map((h) => (
        <span
          key={h.label}
          role="slider"
          aria-label={`Resize from ${h.label}`}
          aria-valuetext="Drag to change the text size"
          data-nodrag=""
          onPointerDown={onStart}
          className={`absolute z-30 -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-white bg-[#d9d9de] shadow-[0_1px_3px_rgba(0,0,0,0.4)] ${h.cls}`}
          style={{ left: `${h.x}%`, top: `${h.y}%` }}
        />
      ))}
    </>
  );
}
