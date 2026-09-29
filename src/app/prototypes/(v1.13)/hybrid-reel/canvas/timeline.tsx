"use client";

/* 单轨时间线:画布上的剪辑器节点和全屏编辑共用。
   - 点 clip:选中并跳到它的开头
   - 拖 clip:调次序(松手时按指针位置插入)
   - 选中后拖左右边缘:trim 头尾,拖的同时预览停在那一帧
   - 六条轨(字卡 / 字幕 / 视频 / 配音 / 音乐 / 音效)的块选中样式完全一样(SelectionFrame:橙色内描边 + 两侧把手),每条轨都能 trim
   - 字卡挂在镜头上(和字幕一样在镜头范围里挪 / trim);绑在字卡或镜头上的音效跟着对象走,在轨道上手动拖过就解绑 */

import { useEffect, useRef, useState } from "react";
import { AudioWaveform, ClosedCaption, Copy, Link2, Type, ImagePlus, Info, Mic, Music, Pencil, Plus, RefreshCw, Replace, RotateCcw, SlidersHorizontal, Trash2, Video, Volume2, VolumeX } from "lucide-react";
import { ROLE_META } from "../agent/chat/types";
import { Filmstrip, type Player, type Scrub } from "./player";
import { IMAGE_HOLD_MAX, MIN_CLIP, MIN_SUB, MUSIC_LIBRARY, SFX_LIBRARY, cardSpan, fmt, subSpan, type TextCard, voiceAt, voiceKey, type Clip, type Project, type Segment, type SfxCue, type VoiceClip } from "./project";
import { aiMusic } from "./player";
import { CoverSlot } from "./cover";
import { Tip } from "./tip";
import { GenFill, PENDING_FILL, TRACK } from "./ui";
import { ClipMenu, PartMenu, type ClipMenuApi, type PartMenuItem } from "./clipmenu";

export type EditApi = {
  /** 记一个撤销点 */
  begin: () => void;
  /** 改,但不记撤销点(拖动过程中用) */
  update: (fn: (p: Project) => Project) => void;
  /** 记撤销点并改 */
  commit: (fn: (p: Project) => Project) => void;
};

/** 工具栏删除按钮的文案,跟着选中的块走 */
export const DELETE_LABEL: Record<SelectPart, string> = { clip: "Delete clip", sub: "Delete subtitle", card: "Delete text", music: "Remove music", voice: "Delete voiceover", sfx: "Delete sound effect" };

/** 选中的是哪一种块:画面片段 / 它的字幕 / 字卡(用 TextCard 的 id)/ 背景音乐 / 一段配音(配音用 VoiceClip 的 id) */
export type SelectPart = "clip" | "sub" | "card" | "music" | "voice" | "sfx";

/** audio = 音频面板的音乐页;sfx = 音频面板直接打开音效页 */
export type PanelId = "clip" | "text" | "audio" | "sfx" | "ai" | "media" | "ratio";

type Drag = {
  id: string;
  mode: "move" | "in" | "out";
  startX: number;
  /** 画布缩放下,屏幕像素 / 时间线像素 */
  scale: number;
  dx: number;
  moved: boolean;
  orig: Clip;
};

/** 配音 / 音乐 / 音效 trim 后最短留多少秒 */
const MIN_AUDIO = 0.3;

/* ── 同一条轨上的块不许重叠 ──
   拖动:放进离想去的位置最近、又放得下的空位(可以跳过别的块);没有空位就不动。
   拉长:碰到相邻的块就停。others 是同轨其他块的 [开始, 结束](秒) */
type Span = [number, number];
function fitInGap(desired: number, len: number, others: Span[], lo: number, hi: number): number | null {
  const occ = others.filter(([a, b]) => b > a).sort((x, y) => x[0] - y[0]);
  const gaps: Span[] = [];
  let cur = lo;
  for (const [a, b] of occ) {
    if (a > cur) gaps.push([cur, Math.min(a, hi)]);
    cur = Math.max(cur, b);
  }
  if (cur < hi) gaps.push([cur, hi]);
  let best: number | null = null;
  let bestD = Infinity;
  for (const [g0, g1] of gaps) {
    if (g1 - g0 < len - 1e-6) continue;
    const at = Math.min(Math.max(desired, g0), g1 - len);
    const d = Math.abs(at - desired);
    if (d < bestD) {
      bestD = d;
      best = at;
    }
  }
  return best;
}
/** 右边第一个块的开头(拉长右把手的上限) */
const nextStartAfter = (end: number, others: Span[], hi: number) => Math.min(hi, ...others.filter(([a]) => a >= end - 0.01).map(([a]) => a));
/** 左边第一个块的结尾(往左拉长左把手的下限) */
const prevEndBefore = (start: number, others: Span[], lo: number) => Math.max(lo, ...others.filter(([, b]) => b <= start + 0.01).map(([, b]) => b));

/** 音频块的描边:用内阴影画,不占盒子,选中框才能正好盖在块的边上(用 border 的话选中框外面还会露一圈浅色边) */
const edge = (c: string) => `inset 0 0 0 1px ${c}`;

const patchClip = (p: Project, id: string, next: Partial<Clip>): Project => ({
  ...p,
  clips: p.clips.map((c) => (c.id === id ? { ...c, ...next } : c)),
});

export function Timeline({
  project,
  player,
  edit,
  selectedId,
  selectedPart = "clip",
  onSelect,
  pxPerSec,
  compact = false,
  dark = false,
  onScrub,
  onAdd,
  onPanel,
  cover,
  onCover,
  onCoverRemove,
  menu,
  onAutoSubtitle,
  onAddVoice,
  onVoiceClick,
  onAddCard,
}: {
  project: Project;
  player: Player;
  edit: EditApi;
  selectedId: string | null;
  /** 选中的是画面片段还是它的字幕 —— 两者分开选,把手只出现在选中的那一个上 */
  selectedPart?: SelectPart;
  onSelect: (id: string | null, part?: SelectPart) => void;
  pxPerSec: number;
  compact?: boolean;
  dark?: boolean;
  onScrub: (s: Scrub) => void;
  onAdd: () => void;
  onPanel?: (p: PanelId) => void;
  /** 视频轨最前面的封面格;不传就不显示 */
  cover?: { src?: string; pending?: boolean };
  onCover?: () => void;
  onCoverRemove?: () => void;
  /** 片段右键菜单;不传就不出菜单 */
  menu?: ClipMenuApi;
  /** 一条字幕都没有时,字幕轨上的「自动生成字幕」入口 */
  onAutoSubtitle?: () => void;
  /** 音频轨:新建一段 AI 配音(不支持上传) */
  onAddVoice?: () => void;
  /** 点音频轨上的配音段:打开它的 Audio Settings */
  onVoiceClick?: (assetId: string) => void;
  /** 字卡轨:在播放头所在的镜头上加一张字卡 */
  onAddCard?: () => void;
}) {
  const [drag, setDrag] = useState<Drag | null>(null);
  /* 右键菜单:part 不写 = 画面片段 */
  const [ctx, setCtx] = useState<{ id: string; x: number; y: number; part?: Exclude<SelectPart, "clip"> } | null>(null);
  /* 字幕 / 配音 / 音乐 / 音效块的右键:先选中它,再在鼠标位置开菜单 */
  const openPartMenu = (e: React.MouseEvent, id: string, part: Exclude<SelectPart, "clip">) => {
    if (!menu) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect(id, part);
    setCtx({ id, x: e.clientX, y: e.clientY, part });
  };
  const scrollRef = useRef<HTMLDivElement>(null);
  /* 播放时播放头走出可见范围,时间线跟着往后滚 */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !player.playing || el.scrollWidth <= el.clientWidth) return;
    const x = player.t * pxPerSec;
    if (x < el.scrollLeft || x > el.scrollLeft + el.clientWidth - 40) el.scrollLeft = Math.max(0, x - 40);
  }, [player.t, player.playing, pxPerSec]);
  const dragRef = useRef<Drag | null>(null);
  const { segs, total } = player;
  const trackH = compact ? 58 : 60;
  /* 细轨(字幕 / 配音 / 音乐)统一行高;画面轨是唯一的粗轨。画布节点里轨间 4px,全屏编辑空间大,放宽到 6px;
     全屏时三条细轨同高 36px,素材轨只比它们稍高一点 */
  const laneH = compact ? 24 : 36;
  const gap = compact ? "gap-1" : "gap-1.5";
  /* 内容宽度正好到「+」按钮右边缘:「+」紧贴最后一段(片段自带 3px 缝,按钮往回收 3px),宽 48px */
  /* 各轨上除了自己之外的块,给防重叠用 */
  const voiceSpans = (exceptId: string): Span[] =>
    (project.voice ?? []).filter((o) => o.id !== exceptId).map((o) => [voiceAt(o, segs), voiceAt(o, segs) + o.len]);
  const sfxSpans = (exceptId: string): Span[] =>
    (project.sfx ?? [])
      .filter((o) => o.id !== exceptId)
      .map((o) => [o.at, o.at + (o.len ?? SFX_LIBRARY.find((x) => x.id === o.kind)?.durationSec ?? 0.5)]);
  const cardSpans = (exceptId: string): Span[] =>
    (project.cards ?? []).filter((o) => o.id !== exceptId).flatMap((o) => {
      const sp = cardSpan(o, segs);
      return sp ? [[sp.from, sp.to] as Span] : [];
    });
  /* 配音可能被拖出成片结尾:内容宽度要把它和它后面的「+」也算进去 */
  const voiceEnd = Math.max(0, ...(project.voice ?? []).map((v) => voiceAt(v, segs) + v.len));
  const width = Math.max(Math.max(total * pxPerSec + 45, voiceEnd * pxPerSec + 2 + 40), 200);
  const assetOf = (c: Clip) => project.assets.find((a) => a.id === c.assetId);

  const C = dark
    ? { ruler: "text-white/40", tick: "bg-white/15", lane: "bg-white/[0.04]", head: "text-white/55 hover:text-white" }
    : { ruler: "text-[#6a6b7b]", tick: "bg-[#d9dae2]", lane: "bg-[#f1f2f5]", head: "text-[#6a6b7b] hover:text-[#1a1a2e]" };

  /* ── 拖动:移动 = 调次序;边缘 = trim ── */
  const startDrag = (e: React.PointerEvent, seg: Segment, mode: Drag["mode"]) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    /* 画布节点可能被缩放:屏幕上的位移要除以缩放比,才是时间线里的像素 */
    const el = e.currentTarget as HTMLElement;
    const scale = el.getBoundingClientRect().width / Math.max(1, el.offsetWidth) || 1;
    const d: Drag = { id: seg.clip.id, mode, startX: e.clientX, scale, dx: 0, moved: false, orig: seg.clip };
    dragRef.current = d;
    setDrag(d);
    if (mode !== "move") edit.begin();

    const onMove = (ev: PointerEvent) => {
      const cur = dragRef.current;
      if (!cur) return;
      const dx = (ev.clientX - cur.startX) / cur.scale;
      const moved = cur.moved || Math.abs(dx) > 4;
      const next = { ...cur, dx, moved };
      dragRef.current = next;
      setDrag(next);
      if (mode === "move") return;
      applyTrim(next);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      const cur = dragRef.current;
      dragRef.current = null;
      setDrag(null);
      onScrub(null);
      if (!cur) return;
      if (cur.mode === "move") {
        if (cur.moved) reorder(cur);
        else {
          onSelect(cur.id, "clip");
          player.seek(seg.start + 0.01);
        }
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const applyTrim = (d: Drag) => {
    const c = d.orig;
    const a = assetOf(c);
    const dSec = (d.dx / pxPerSec) * c.speed;
    const holdMax = a?.kind === "video" ? Math.max(a.durationSec, c.outSec) : IMAGE_HOLD_MAX;
    const trimsSource = a?.kind === "video";
    /* 靠近 Agent 找好的片段边界时轻微吸附(6px 以内),方便对齐切点;拖过去就不吸 */
    const edges = trimsSource ? (a?.segments ?? []).flatMap((g) => [g.start, g.end]) : [];
    const snap = (t: number) => {
      const near = edges.reduce<number | null>((best, e) => (Math.abs(e - t) < Math.abs((best ?? Infinity) - t) ? e : best), null);
      return near !== null && Math.abs(near - t) <= (6 / pxPerSec) * c.speed ? near : t;
    };
    if (d.mode === "in" && trimsSource) {
      const inSec = Math.min(Math.max(0, snap(c.inSec + dSec)), c.outSec - MIN_CLIP * c.speed);
      edit.update((p) => patchClip(p, c.id, { inSec }));
      if (a?.status === "ready") onScrub({ assetId: a.id, time: inSec });
    } else {
      /* 图片 / 未生成 / 空位没有「素材内位置」,两边都只改时长 */
      const delta = d.mode === "in" ? -dSec : dSec;
      const outSec = Math.min(Math.max(c.inSec + MIN_CLIP * c.speed, trimsSource ? snap(c.outSec + delta) : c.outSec + delta), holdMax);
      edit.update((p) => patchClip(p, c.id, { outSec }));
      if (a?.status === "ready") onScrub({ assetId: a.id, time: trimsSource ? Math.max(0, outSec - 0.04) : 0 });
    }
  };

  /* 字幕 trim:拖字幕块左右把手,改字幕在片段内的起止;拖动时播放头跟着走,预览里能看到字幕出现/消失的那一刻 */
  const subDragged = useRef(false);
  const startSubTrim = (e: React.PointerEvent, seg: Segment, mode: "in" | "out") => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    const el = e.currentTarget as HTMLElement;
    const scale = el.getBoundingClientRect().width / Math.max(1, el.offsetWidth) || 1;
    const startX = e.clientX;
    const orig = subSpan(seg.clip, seg.len);
    edit.begin();
    player.setPlaying(false);
    const onMove = (ev: PointerEvent) => {
      const d = (ev.clientX - startX) / scale / pxPerSec;
      if (Math.abs(ev.clientX - startX) > 2) subDragged.current = true;
      if (mode === "in") {
        const subIn = Math.min(Math.max(0, orig.from + d), orig.to - MIN_SUB);
        edit.update((p) => patchClip(p, seg.clip.id, { subIn, subOut: orig.to }));
        player.seek(seg.start + subIn + 0.01);
      } else {
        const subOut = Math.max(Math.min(seg.len, orig.to + d), orig.from + MIN_SUB);
        edit.update((p) => patchClip(p, seg.clip.id, { subIn: orig.from, subOut }));
        player.seek(seg.start + subOut - 0.01);
      }
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      /* click 会在 pointerup 之后触发,等它过去再清标记 */
      window.setTimeout(() => (subDragged.current = false), 0);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  /* 配音 / 音乐 / 音效的把手:拖动时把位移(秒)交给 apply,apply 用按下那一刻的原值算新值;播放头跟着把手走 */
  const startEdge = (e: React.PointerEvent, apply: (dSec: number) => number) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    const el = e.currentTarget as HTMLElement;
    const scale = el.getBoundingClientRect().width / Math.max(1, el.offsetWidth) || 1;
    const startX = e.clientX;
    edit.begin();
    player.setPlaying(false);
    const onMove = (ev: PointerEvent) => player.seek(apply((ev.clientX - startX) / scale / pxPerSec));
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  /* 字幕 / 音乐 / 音效的块:按住左右拖 = 整段挪位置(拖过 3px 才算拖,否则还是点击选中)。
     move 用按下那一刻的原值算新值,返回新的开头,播放头跟过去 */
  const dragged = useRef(false);
  const startMove = (e: React.PointerEvent, move: (dSec: number) => number) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const el = e.currentTarget as HTMLElement;
    const scale = el.getBoundingClientRect().width / Math.max(1, el.offsetWidth) || 1;
    const startX = e.clientX;
    let began = false;
    const onMove = (ev: PointerEvent) => {
      if (!began) {
        if (Math.abs(ev.clientX - startX) < 3) return;
        began = true;
        dragged.current = true;
        edit.begin();
        player.setPlaying(false);
      }
      player.seek(move((ev.clientX - startX) / scale / pxPerSec));
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      /* click 在 pointerup 之后触发:等它过去再清标记,拖完不会被当成一次点击 */
      window.setTimeout(() => (dragged.current = false), 0);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const patchVoice = (id: string, next: Partial<VoiceClip>) =>
    edit.update((p) => ({ ...p, voice: (p.voice ?? []).map((v) => (v.id === id ? { ...v, ...next } : v)) }));
  const patchSfx = (id: string, next: Partial<SfxCue>) =>
    edit.update((p) => ({ ...p, sfx: (p.sfx ?? []).map((c) => (c.id === id ? { ...c, ...next } : c)) }));
  const patchCard = (id: string, next: Partial<TextCard>) =>
    edit.update((p) => ({ ...p, cards: (p.cards ?? []).map((c) => (c.id === id ? { ...c, ...next } : c)) }));

  /* 配音段:左右拖动改在成片里的起点 */
  const startVoiceDrag = (e: React.PointerEvent, id: string, at0: number, assetId: string) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    const el = e.currentTarget as HTMLElement;
    const scale = el.getBoundingClientRect().width / Math.max(1, el.offsetWidth) || 1;
    const startX = e.clientX;
    let began = false;
    const onMove = (ev: PointerEvent) => {
      const dx = (ev.clientX - startX) / scale;
      if (!began) {
        if (Math.abs(dx) < 3) return;
        began = true;
        edit.begin();
      }
      const me = (project.voice ?? []).find((v) => v.id === id);
      const len = me?.len ?? 0.3;
      /* 不和别的配音重叠:放进最近的空位;没空位就不动 */
      const at = fitInGap(Math.max(0, at0 + dx / pxPerSec), len, voiceSpans(id), 0, Math.max(total, voiceEnd) + len);
      if (at === null) return;
      /* 手动拖过就不再跟着镜头走 */
      edit.update((p) => ({ ...p, voice: (p.voice ?? []).map((v) => (v.id === id ? { ...v, at, clipId: undefined } : v)) }));
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      /* 没拖动就是点击:打开它的生成设置 */
      /* 没拖动就是点击:选中这一段,并打开它的生成设置 */
      if (!began) {
        onSelect(id, "voice");
        onVoiceClick?.(assetId);
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const dropIndex = (d: Drag) => {
    const from = segs.findIndex((s) => s.clip.id === d.id);
    const me = segs[from];
    if (!me) return { from, to: from };
    const x = (me.start + me.len / 2) * pxPerSec + d.dx;
    const others = segs.filter((s) => s.clip.id !== d.id);
    const to = others.filter((s) => (s.start + s.len / 2) * pxPerSec < x).length;
    return { from, to, others };
  };

  const reorder = (d: Drag) => {
    const { from, to } = dropIndex(d);
    if (from < 0 || from === to) return;
    edit.commit((p) => {
      const clips = [...p.clips];
      const [moved] = clips.splice(from, 1);
      clips.splice(to, 0, moved);
      return { ...p, clips };
    });
    onSelect(d.id, "clip");
  };

  /* 插入位置提示线:拖动时其它 clip 不动,线画在它们原来的边界上 */
  const marker = (() => {
    if (!drag || drag.mode !== "move" || !drag.moved) return null;
    const { from, to, others } = dropIndex(drag);
    if (!others || from === to) return null;
    return (to < others.length ? others[to].start : total) * pxPerSec;
  })();

  /* ── 播放头 / 标尺 ── */
  const scrubRuler = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const box = el.getBoundingClientRect();
    /* 同理:按缩放比换算,播放头才会跟着鼠标走 */
    const scale = box.width / Math.max(1, el.offsetWidth) || 1;
    const seekTo = (clientX: number) => player.seek((clientX - box.left) / scale / pxPerSec);
    player.setPlaying(false);
    seekTo(e.clientX);
    const onMove = (ev: PointerEvent) => seekTo(ev.clientX);
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  /* 各种块的右键菜单项。删除和工具栏、Delete 键同一个逻辑;其余都能撤销 */
  const partMenuItems = (part: Exclude<SelectPart, "clip">, id: string): PartMenuItem[] | null => {
    const del = (label: string): PartMenuItem => ({ icon: Trash2, label, kbd: "⌫", onClick: () => menu?.onDeletePart(id, part) });
    if (part === "sub") {
      const seg = segs.find((x) => x.clip.id === id);
      if (!seg) return null;
      const c = seg.clip;
      return [
        { icon: Pencil, label: "Edit subtitle", onClick: () => onPanel?.("text") },
        ...(onAutoSubtitle ? [{ icon: RefreshCw, label: "Regenerate subtitles", onClick: onAutoSubtitle }] : []),
        {
          icon: RotateCcw,
          label: "Reset timing",
          hint: "Show it for the whole clip",
          disabled: c.subIn === undefined && c.subOut === undefined,
          onClick: () => edit.commit((p) => patchClip(p, id, { subIn: undefined, subOut: undefined })),
        },
        "sep",
        del("Delete subtitle"),
      ];
    }
    if (part === "card") {
      const card = (project.cards ?? []).find((x) => x.id === id);
      if (!card) return null;
      return [
        { icon: Pencil, label: "Edit text", onClick: () => onSelect(id, "card") },
        {
          icon: Copy,
          label: "Duplicate",
          hint: "Adds a copy right after it",
          onClick: () =>
            edit.commit((p) => ({
              ...p,
              cards: [...(p.cards ?? []), { ...card, id: `card-${Date.now().toString(36)}`, start: card.start + card.len }],
            })),
        },
        "sep",
        del("Delete text"),
      ];
    }
    if (part === "voice") {
      const v = (project.voice ?? []).find((x) => x.id === id);
      if (!v) return null;
      return [
        { icon: SlidersHorizontal, label: "Voiceover settings", onClick: () => onVoiceClick?.(v.assetId) },
        {
          icon: RotateCcw,
          label: "Reset trim",
          disabled: !v.offset && (v.srcLen === undefined || v.len >= v.srcLen - 0.01),
          onClick: () =>
            edit.commit((p) => ({
              ...p,
              voice: (p.voice ?? []).map((x) =>
                x.id === id ? { ...x, at: x.clipId ? x.at : x.at - (x.offset ?? 0), len: x.srcLen ?? x.len, offset: undefined } : x,
              ),
            })),
        },
        "sep",
        del("Delete voiceover"),
      ];
    }
    if (part === "music") {
      return [
        { icon: Replace, label: "Change music", onClick: () => onPanel?.("audio") },
        {
          icon: RotateCcw,
          label: "Reset trim and position",
          disabled: project.musicIn === undefined && project.musicOut === undefined && !project.musicShift,
          onClick: () => edit.commit((p) => ({ ...p, musicIn: undefined, musicOut: undefined, musicShift: undefined })),
        },
        "sep",
        del("Remove music"),
      ];
    }
    const cue = (project.sfx ?? []).find((x) => x.id === id);
    if (!cue) return null;
    const lib = SFX_LIBRARY.find((x) => x.id === cue.kind);
    const len = cue.len ?? lib?.durationSec ?? 0.5;
    return [
      { icon: Replace, label: "Change sound", onClick: () => onPanel?.("sfx") },
      {
        icon: Copy,
        label: "Duplicate",
        hint: "Adds a copy right after it",
        onClick: () =>
          edit.commit((p) => ({
            ...p,
            sfx: [...(p.sfx ?? []), { ...cue, id: `sfx-${Date.now().toString(36)}`, at: Math.min(cue.at + len + 0.1, Math.max(0, total - 0.1)) }],
          })),
      },
      {
        icon: RotateCcw,
        label: "Reset trim",
        disabled: !cue.offset && cue.srcLen === undefined,
        onClick: () =>
          edit.commit((p) => ({
            ...p,
            sfx: (p.sfx ?? []).map((x) =>
              x.id === id ? { ...x, at: x.at - (x.offset ?? 0), offset: undefined, len: x.url ? x.srcLen ?? x.len : undefined, srcLen: undefined } : x,
            ),
          })),
      },
      "sep",
      del("Delete sound effect"),
    ];
  };

  const tickStep = pxPerSec < 18 ? 5 : 1;
  const ticks = Array.from({ length: Math.floor((width / pxPerSec) / tickStep) + 1 }, (_, i) => i * tickStep);
  const music = MUSIC_LIBRARY.find((m) => m.id === project.musicId) ?? aiMusic(project);
  /* 方案里定的 AI 配乐还没生成:音乐轨上先占一块,点开它的设置生成 */
  const pendingMusic = !music ? project.assets.find((x) => x.id === project.musicId && x.kind === "audio" && x.origin === "ai") : undefined;
  const muteAll = !project.originalOn;

  return (
    /* 节点里的时间线跟着画布缩放,11px 放大后正好;全屏编辑不缩放,字和图标各大一档,不然看着又小又空 */
    <div
      className="flex min-w-0"
      style={{ "--tl-fs": compact ? "11px" : "12px", "--tl-ic": compact ? "12px" : "14px", "--tl-ic2": compact ? "14px" : "16px" } as React.CSSProperties}
    >
      {/* 轨道头 */}
      <div className={`flex w-10 shrink-0 flex-col ${gap}`}>
        <div className="h-6" />
        {/* 六条轨:字卡 / 字幕 / 画面 / 配音 / 音乐 / 音效,节点和全屏编辑都一样 */}
        <Tip label="Text" side="right" className="justify-center" style={{ height: laneH }}>
          <button
            type="button"
            aria-label="Text track: add text"
            onClick={() => onAddCard?.()}
            className={`grid w-10 place-items-center ${C.head}`}
            style={{ height: laneH }}
          >
            <Type className="size-4" />
          </button>
        </Tip>
        {(
          <Tip label="Edit subtitles" side="right" className="justify-center" style={{ height: laneH }}>
            <button
              type="button"
              aria-label="Subtitles"
              onClick={() => onPanel?.("text")}
              className={`grid w-10 place-items-center ${C.head}`}
              style={{ height: laneH }}
            >
              <ClosedCaption className="size-4" />
            </button>
          </Tip>
        )}
        <Tip label={muteAll ? "Turn original audio on" : "Mute original audio"} side="right" className="justify-center">
          <button
            type="button"
            aria-label={muteAll ? "Turn original audio on" : "Turn original audio off"}
            onClick={() => edit.commit((p) => ({ ...p, originalOn: !p.originalOn }))}
            className={`grid w-10 place-items-center ${C.head} ${muteAll ? "!text-[#ff5e1a]" : ""}`}
            style={{ height: trackH }}
          >
            {muteAll ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </button>
        </Tip>
        {/* 音频轨(音效 / 音频节点)、音乐轨:节点和全屏都有 */}
        <Tip label="Voiceover" side="right" className="justify-center" style={{ height: laneH }}>
          <button
            type="button"
            aria-label="Audio track: add voiceover"
            onClick={() => onAddVoice?.()}
            className={`grid w-10 place-items-center ${C.head}`}
            style={{ height: laneH }}
          >
            <Mic className="size-4" />
          </button>
        </Tip>
        <Tip label="Music" side="right" className="justify-center" style={{ height: laneH }}>
          <button
            type="button"
            aria-label="Music track"
            onClick={() => onPanel?.("audio")}
            className={`grid w-10 place-items-center ${C.head}`}
            style={{ height: laneH }}
          >
            <Music className="size-4" />
          </button>
        </Tip>
        {/* 音效单独一条轨,不再叠在音乐上 */}
        <Tip label="Sound effects" side="right" className="justify-center" style={{ height: laneH }}>
          <button
            type="button"
            aria-label="Sound effects track"
            onClick={() => onPanel?.("sfx")}
            className={`grid w-10 place-items-center ${C.head}`}
            style={{ height: laneH }}
          >
            <AudioWaveform className="size-4" />
          </button>
        </Tip>
      </div>

      {/* 封面格:固定在视频轨最前面,不随时间线横向滚动 */}
      {onCover && (
        <div className={`flex w-[58px] shrink-0 flex-col ${gap} pr-1.5`} data-nodrag>
          <div className="h-6" />
          <div style={{ height: laneH }} />
          <div style={{ height: laneH }} />
          <div>
            <CoverSlot
              src={cover?.src}
              pending={cover?.pending}
              height={trackH}
              onEdit={onCover}
              onRemove={() => onCoverRemove?.()}
            />
          </div>
        </div>
      )}

      {/* 素材多、时间线比节点宽时可以左右滑:触控板横滑、Shift+滚轮,普通竖向滚轮也换算成横向 */}
      <div
        ref={scrollRef}
        onWheel={(e) => {
          const el = e.currentTarget;
          if (e.ctrlKey || e.metaKey || el.scrollWidth <= el.clientWidth) return;
          if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) el.scrollLeft += e.deltaY;
        }}
        className="min-w-0 flex-1 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-1 pl-3.5 [scrollbar-width:thin] [scrollbar-color:#d9dae2_transparent]"
        data-nodrag
      >
        <div className={`relative flex select-none flex-col ${gap}`} style={{ width }}>
          {/* 标尺 */}
          <div className="relative h-6 cursor-pointer" onPointerDown={scrubRuler}>
            {ticks.map((s) => (
              <span key={s} className="absolute top-0 h-full" style={{ left: s * pxPerSec }}>
                <span className={`absolute bottom-0 w-px ${C.tick} ${s % 5 === 0 ? "h-2.5" : "h-1.5"}`} />
                {s % 5 === 0 && (
                  <span className={`absolute left-[10px] top-0.5 text-[length:var(--tl-fs)] tabular-nums ${C.ruler}`}>{fmt(s)}</span>
                )}
              </span>
            ))}
          </div>

          {/* 字卡轨:字卡挂在所属镜头上(镜头挪了跟着挪),选中后两端可拖;空的时候是加字卡的入口 */}
          <div className="relative" style={{ height: laneH }}>
            {(project.cards ?? []).length === 0 && segs.length > 0 && (
              <EmptyLane icon={Type} label="Add text" width={total * pxPerSec - 3} onClick={() => onAddCard?.()} />
            )}
            {(project.cards ?? []).map((card) => {
              const sp = cardSpan(card, segs);
              if (!sp) return null;
              const { from, to, seg } = sp;
              const rel = from - seg.start;
              const len = to - from;
              const selected = selectedId === card.id && selectedPart === "card";
              const w = Math.max(8, len * pxPerSec - 3);
              return (
                <div
                  key={card.id}
                  role="button"
                  tabIndex={0}
                  title={card.text || "Empty text"}
                  aria-label={`Text: ${card.text || "empty"}`}
                  aria-pressed={selected}
                  onContextMenu={(e) => openPartMenu(e, card.id, "card")}
                  onPointerDown={(e) =>
                    startMove(e, (d) => {
                      /* 在所属镜头里整段挪,长度不变;不和别的屏幕文字重叠 */
                      const abs = fitInGap(seg.start + rel + d, len, cardSpans(card.id), seg.start, seg.start + seg.len);
                      if (abs === null) return seg.start + rel + 0.01;
                      const start = abs - seg.start;
                      patchCard(card.id, { start });
                      return seg.start + start + 0.01;
                    })
                  }
                  onClick={() => {
                    if (dragged.current) return;
                    onSelect(card.id, "card");
                    player.seek(from + 0.01);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(card.id, "card");
                      player.seek(from + 0.01);
                    }
                  }}
                  className={`absolute inset-y-0 flex cursor-grab items-center gap-1 overflow-hidden rounded-[6px] text-left text-[length:var(--tl-fs)] font-semibold outline-none active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40 ${
                    selected ? "z-10 px-3.5" : "px-1.5 hover:brightness-[0.97]"
                  }`}
                  style={{ left: from * pxPerSec, width: w, background: TRACK.card.bg, boxShadow: edge(TRACK.card.border), color: TRACK.card.text }}
                >
                  <Type className="size-[var(--tl-ic)] shrink-0 opacity-90" />
                  {w > 40 && <span className={`truncate ${card.text ? "" : "italic opacity-60"}`}>{card.text || "Empty text"}</span>}
                  {selected && (
                    <SelectionFrame
                      labels={["Trim text start", "Trim text end"]}
                      onIn={(e) =>
                        startEdge(e, (d) => {
                          const lo = prevEndBefore(from, cardSpans(card.id), seg.start) - seg.start;
                          const start = Math.min(Math.max(lo, rel + d), rel + len - MIN_SUB);
                          patchCard(card.id, { start, len: rel + len - start });
                          return seg.start + start + 0.01;
                        })
                      }
                      onOut={(e) =>
                        startEdge(e, (d) => {
                          const hi = nextStartAfter(to, cardSpans(card.id), seg.start + seg.len) - seg.start;
                          const next = Math.min(Math.max(MIN_SUB, len + d), Math.max(MIN_SUB, hi - rel));
                          patchCard(card.id, { len: next });
                          return seg.start + rel + next - 0.01;
                        })
                      }
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* 字幕轨:字幕块挂在所属片段上,选中后两端可拖,在片段范围内掐头去尾 */}
          <div className="relative" style={{ height: laneH }}>
            {/* 空状态:一条字幕都没有,整条字幕轨是一个自动生成的入口 */}
            {onAutoSubtitle && segs.length > 0 && !segs.some((s) => s.clip.subtitle) && (
              <EmptyLane
                icon={ClosedCaption}
                label="Auto-generate subtitles"
                width={total * pxPerSec - 3}
                onClick={onAutoSubtitle}
                info={
                  (project.voice ?? []).some((v) => v.clipId && v.url)
                    ? "Transcribes the voiceover on shots that have one, and the original audio on the rest"
                    : "Transcribes the original audio in your clips. Generate the voiceover first to subtitle it too"
                }
              />
            )}
            {segs.map((s) => {
              if (!s.clip.subtitle) return null;
              const { from, to } = subSpan(s.clip, s.len);
              const selected = selectedId === s.clip.id && selectedPart === "sub";
              return (
                <div
                  key={s.clip.id}
                  role="button"
                  tabIndex={0}
                  onContextMenu={(e) => openPartMenu(e, s.clip.id, "sub")}
                  onPointerDown={(e) =>
                    startMove(e, (d) => {
                      /* 在所属片段里整段挪,长度不变 */
                      const subIn = Math.min(Math.max(0, from + d), Math.max(0, s.len - (to - from)));
                      edit.update((p) => patchClip(p, s.clip.id, { subIn, subOut: subIn + (to - from) }));
                      return s.start + subIn + 0.01;
                    })
                  }
                  onClick={() => {
                    if (subDragged.current || dragged.current) {
                      subDragged.current = false;
                      return;
                    }
                    onSelect(s.clip.id, "sub");
                    /* 全屏编辑的右侧设置跟着选中走,选中字幕就自动出字幕设置,这里不用再开面板 */
                    player.seek(s.start + from + 0.01);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(s.clip.id, "sub");
                      player.seek(s.start + from + 0.01);
                    }
                  }}
                  title={s.clip.subtitle}
                  className={`absolute inset-y-0 flex cursor-grab items-center gap-1 overflow-hidden rounded-[6px] text-left active:cursor-grabbing text-[length:var(--tl-fs)] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40 focus-visible:ring-offset-1 ${
                    selected ? "bg-[var(--sub-sel)] px-3.5" : "bg-[var(--sub-bg)] px-1.5 hover:bg-[var(--sub-bgh)]"
                  }`}
                  style={
                    {
                      left: (s.start + from) * pxPerSec,
                      width: Math.max(8, (to - from) * pxPerSec - 3),
                      color: TRACK.sub.text,
                      "--sub-bg": TRACK.sub.bg,
                      "--sub-bgh": TRACK.sub.bgHover,
                      "--sub-sel": TRACK.sub.selected,
                    } as React.CSSProperties
                  }
                >
                  <ClosedCaption className="size-[var(--tl-ic2)] shrink-0 opacity-90" />
                  <span className="truncate">{s.clip.subtitle}</span>
                  {selected && (
                    <SelectionFrame
                      labels={["Trim subtitle start", "Trim subtitle end"]}
                      onIn={(e) => startSubTrim(e, s, "in")}
                      onOut={(e) => startSubTrim(e, s, "out")}
                    />
                  )}
                </div>
              );
            })}
            {/* 已经有字幕:轨道末尾一个「重新识别」入口;配音在字幕之后又改过,换成橙色提醒字幕可能过时 */}
            {onAutoSubtitle && segs.some((s) => s.clip.subtitle) && (() => {
              const stale = project.subsVoiceKey !== undefined && project.subsVoiceKey !== voiceKey(project);
              const tip = stale
                ? "The voiceover changed after these subtitles were made. Regenerate them"
                : "Regenerate subtitles";
              return (
                <Tip label={tip} side="bottom" align="end" className="absolute inset-y-0" style={{ left: Math.max(0, total * pxPerSec - 3) + 6 }}>
                  <button
                    type="button"
                    aria-label={tip}
                    onClick={onAutoSubtitle}
                    className={`relative grid place-items-center rounded-[6px] border transition outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40 ${
                      stale
                        ? "border-[#f0a35e] bg-[#fff6ec] text-[#b45309] hover:bg-[#ffeedd]"
                        : "border-dashed border-[#c9cad4] bg-white text-[#6a6b7b] hover:border-[#9a9bb0] hover:text-[#1a1a2e]"
                    }`}
                    style={{ height: laneH, width: laneH }}
                  >
                    <RefreshCw className="size-3" />
                    {stale && <span aria-hidden className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-[#f0801e] ring-2 ring-white" />}
                  </button>
                </Tip>
              );
            })()}
          </div>

          {/* 视频轨 */}
          {/* 节点里的紧凑时间线不铺轨道底色,否则会和「+」按钮叠成两层灰;全屏编辑保留底色标出轨道范围 */}
          <div className={`relative rounded-md ${compact ? "" : C.lane}`} style={{ height: trackH }}>
            {segs.map((s) => {
              const a = assetOf(s.clip);
              const selected = selectedId === s.clip.id && selectedPart === "clip";
              const dragging = drag?.id === s.clip.id && drag.mode === "move" && drag.moved;
              const role = ROLE_META[s.clip.role] ?? ROLE_META.hook;
              const w = Math.max(10, s.len * pxPerSec - 3);
              return (
                <div
                  key={s.clip.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${role.label} clip, ${s.len.toFixed(1)} seconds`}
                  data-clip={s.clip.id}
                  onPointerDown={(e) => startDrag(e, s, "move")}
                  onContextMenu={(e) => {
                    if (!menu) return;
                    e.preventDefault();
                    e.stopPropagation();
                    onSelect(s.clip.id, "clip");
                    setCtx({ id: s.clip.id, x: e.clientX, y: e.clientY });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(s.clip.id, "clip");
                      player.seek(s.start + 0.01);
                    }
                  }}
                  className={`absolute top-0 h-full cursor-grab overflow-hidden rounded-[6px] outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40 active:cursor-grabbing ${
                    dragging ? "z-20 opacity-80 shadow-[0_8px_24px_rgba(0,0,0,0.35)]" : ""
                  }`}
                  style={{
                    left: s.start * pxPerSec + (dragging ? drag!.dx : 0),
                    width: w,
                  }}
                >
                  <ClipFace clipAsset={a} clip={s.clip} pxPerSec={pxPerSec} h={trackH} dark={dark} />
                  {selected && (
                    <SelectionFrame
                      labels={["Trim start", "Trim end"]}
                      onIn={(e) => startDrag(e, s, "in")}
                      onOut={(e) => startDrag(e, s, "out")}
                    />
                  )}
                </div>
              );
            })}
            {marker !== null && (
              <span className="absolute -top-1 z-30 h-[calc(100%+8px)] w-[3px] -translate-x-1/2 rounded bg-[#ff5e1a]" style={{ left: marker }} />
            )}
            {/* 紧贴最后一段,不留缝 —— 读起来就是轨道的下一格 */}
            <Tip label="Add a clip from media" side="left" className="absolute top-0 h-full" style={{ left: Math.max(0, total * pxPerSec - 3) }}>
              <button
                type="button"
                aria-label="Add clip"
                onClick={onAdd}
                className={`grid h-full w-12 place-items-center rounded-[6px] border border-dashed transition outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40 ${
                  dark
                    ? "border-white/25 text-white/60 hover:border-white/50 hover:text-white"
                    : "border-[#c9cad4] bg-white text-[#6a6b7b] hover:border-[#9a9bb0] hover:bg-[#f7f8fa] hover:text-[#1a1a2e]"
                }`}
              >
                <Plus className="size-4" />
              </button>
            </Tip>
          </div>

          {/* 音频轨:用户的配音文件。左右拖动改起点,悬停出删除;空的时候是上传入口 */}
          <div className="relative" style={{ height: laneH }}>
            {(project.voice ?? []).length === 0 ? (
              <EmptyLane icon={Mic} label="Add voiceover" width={total * pxPerSec - 3} onClick={() => onAddVoice?.()} />
            ) : (
              <>
                {(project.voice ?? []).map((v) => {
                  const a = project.assets.find((x) => x.id === v.assetId);
                  /* 分段配音每句有自己的音频;整段的看节点 */
                  const ready = v.text !== undefined ? !!v.url : a?.status === "ready" && !!a.url;
                  const at = voiceAt(v, segs);
                  const off = v.offset ?? 0;
                  /* 配音比它跟着的镜头长:超出镜头的那一截画斜纹,拖右边把手剪短就没了 */
                  const shot = v.clipId ? segs.find((x) => x.clip.id === v.clipId) : undefined;
                  const overSec = shot && ready ? off + v.len - shot.len : 0;
                  const over = overSec > 0.1;
                  const selected = selectedId === v.id && selectedPart === "voice";
                  const w = Math.max(28, v.len * pxPerSec - 3);
                  /* 音频本来多长:往回拖不能超过它 */
                  const srcLen = v.srcLen ?? (v.text === undefined ? a?.durationSec : undefined) ?? off + v.len;
                  return (
                    <div
                      key={v.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`Voiceover — click to edit, drag to move`}
                      title={over ? `${v.text ?? "Voiceover"} · runs ${overSec.toFixed(1)}s past its shot` : v.text}
                      onPointerDown={(e) => startVoiceDrag(e, v.id, at, v.assetId)}
                      onContextMenu={(e) => openPartMenu(e, v.id, "voice")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onSelect(v.id, "voice");
                          onVoiceClick?.(v.assetId);
                        }
                      }}
                      className={`absolute inset-y-0 flex cursor-grab items-center gap-1.5 overflow-hidden rounded-[6px] text-[length:var(--tl-fs)] font-semibold outline-none active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40 ${
                        /* 选中的浮到最上面:和相邻那句叠在一起时,选中框和把手不会被盖住 */
                        selected ? "z-10 px-3.5" : "px-2"
                      } ${ready ? "" : PENDING_FILL}`}
                      style={{
                        left: at * pxPerSec,
                        width: w,
                        ...(ready
                          ? { background: TRACK.voice.bg, boxShadow: edge(TRACK.voice.border), color: TRACK.voice.text }
                          : { boxShadow: edge("#e1e3e8"), color: "#4a4b5c" }),
                      }}
                    >
                      {/* 生成中:流动渐变;生成好了:纯色块(不画示意波形,轨道上太乱);没生成:平涂 + 状态 */}
                      {!ready && a?.status === "generating" && <GenFill />}
                      {over && (
                        <span
                          aria-hidden
                          className="pointer-events-none absolute inset-y-0 right-0"
                          style={{
                            width: Math.min(w, overSec * pxPerSec),
                            background: "repeating-linear-gradient(135deg, rgba(234,120,20,0.3) 0 2px, transparent 2px 6px)",
                          }}
                        />
                      )}
                      <Mic className={`relative size-[var(--tl-ic)] shrink-0 ${ready ? "" : "text-[#6a6b7b]"}`} />
                      {v.len * pxPerSec > 70 && (
                        <span className="relative truncate">
                          {a?.status === "generating" && !v.url ? `Generating ${a.progress ?? 0}%` : v.text?.trim() || (ready ? "Voiceover" : "No Audio Generated")}
                        </span>
                      )}
                      {selected && (
                        <SelectionFrame
                          labels={["Trim voiceover start", "Trim voiceover end"]}
                          onIn={(e) =>
                            startEdge(e, (d) => {
                              const offset = Math.min(Math.max(0, off + d), off + v.len - MIN_AUDIO);
                              const delta = offset - off;
                              /* 跟着镜头的:起点由 offset 推出来;拖动过的:起点一起往后挪 */
                              patchVoice(v.id, { offset, len: v.len - delta, srcLen, ...(v.clipId ? {} : { at: v.at + delta }) });
                              return at + delta + 0.01;
                            })
                          }
                          onOut={(e) =>
                            startEdge(e, (d) => {
                              const room = nextStartAfter(at + v.len, voiceSpans(v.id), Infinity) - at;
                              const len = Math.min(Math.max(MIN_AUDIO, v.len + d), srcLen - off, Math.max(MIN_AUDIO, room));
                              patchVoice(v.id, { len, srcLen });
                              return at + len - 0.01;
                            })
                          }
                        />
                      )}
                    </div>
                  );
                })}
                {/* 再加一段:跟在最后一段后面 */}
                <Tip label="Add another voiceover" align="end" className="absolute inset-y-0" style={{ left: voiceEnd * pxPerSec + 2 }}>
                  <button
                    type="button"
                    aria-label="Add voiceover"
                    onClick={() => onAddVoice?.()}
                    className="grid place-items-center rounded-[6px] border border-dashed border-[#c9cad4] bg-white text-[#6a6b7b] transition hover:border-[#9a9bb0] hover:text-[#1a1a2e]"
                    style={{ height: laneH, width: laneH }}
                  >
                    <Plus className="size-3" />
                  </button>
                </Tip>
              </>
            )}
          </div>

          {/* 音乐轨:背景音乐(曲库、画布上的 AI 配乐或上传的曲子);空的时候是加音乐的入口(打开音频面板) */}
          <div className="relative" style={{ height: laneH }}>
            {music ? (() => {
              /* trim 过的范围;成片变短了就收到成片结尾 */
              const mOut = Math.min(project.musicOut ?? total, total);
              const mIn = Math.min(project.musicIn ?? 0, Math.max(0, mOut - MIN_AUDIO));
              const selected = selectedId === music.id && selectedPart === "music";
              const shift0 = project.musicShift ?? 0;
              return (
                <div
                  role="button"
                  tabIndex={0}
                  /* 单击选中(可以删、可以 trim),双击打开音频面板 */
                  onPointerDown={(e) =>
                    startMove(e, (d) => {
                      /* 整段挪:起止一起动,曲子开头跟着挪;不超出成片 */
                      const len = mOut - mIn;
                      const musicIn = Math.min(Math.max(0, mIn + d), Math.max(0, total - len));
                      const delta = musicIn - mIn;
                      edit.update((p) => ({
                        ...p,
                        musicIn: musicIn > 0.05 ? musicIn : undefined,
                        musicOut: musicIn + len < total - 0.05 ? musicIn + len : undefined,
                        musicShift: (shift0 + delta) || undefined,
                      }));
                      return musicIn + 0.01;
                    })
                  }
                  onClick={() => {
                    /* 刚拖完的那次 click 吞掉 */
                    if (dragged.current) return;
                    onSelect(music.id, "music");
                    /* 画布上有对应节点的(AI 配乐 / 上传的曲子):右侧打开它的设置;曲库里的曲子没有节点,双击开音频面板换曲 */
                    if (project.assets.some((a) => a.id === music.id)) onVoiceClick?.(music.id);
                  }}
                  onDoubleClick={() => onPanel?.("audio")}
                  onContextMenu={(e) => openPartMenu(e, music.id, "music")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(music.id, "music");
                    }
                  }}
                  aria-label={`Music: ${music.name}. Double-click to open the audio panel`}
                  aria-pressed={selected}
                  className={`absolute inset-y-0 flex cursor-grab items-center gap-1.5 overflow-hidden rounded-[6px] bg-[var(--mu-bg)] text-[length:var(--tl-fs)] font-semibold outline-none transition-colors hover:bg-[var(--mu-bgh)] active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40 ${
                    selected ? "px-3.5" : "px-2"
                  }`}
                  style={
                    {
                      left: mIn * pxPerSec,
                      width: Math.max(24, (mOut - mIn) * pxPerSec - 3),
                      "--mu-bg": TRACK.music.bg,
                      "--mu-bgh": TRACK.music.bgHover,
                      boxShadow: edge(TRACK.music.border),
                      color: TRACK.music.text,
                    } as React.CSSProperties
                  }
                >
                  <Music className="size-[var(--tl-ic)] shrink-0" />
                  <span className="truncate">{music.name}</span>
                  {selected && (
                    <SelectionFrame
                      labels={["Trim music start", "Trim music end"]}
                      onIn={(e) =>
                        startEdge(e, (d) => {
                          const musicIn = Math.min(Math.max(0, mIn + d), mOut - MIN_AUDIO);
                          edit.update((p) => ({ ...p, musicIn: musicIn > 0.05 ? musicIn : undefined }));
                          return musicIn + 0.01;
                        })
                      }
                      onOut={(e) =>
                        startEdge(e, (d) => {
                          const musicOut = Math.min(Math.max(mIn + MIN_AUDIO, mOut + d), total);
                          edit.update((p) => ({ ...p, musicOut: musicOut < total - 0.05 ? musicOut : undefined }));
                          return musicOut - 0.01;
                        })
                      }
                    />
                  )}
                </div>
              );
            })() : pendingMusic ? (
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                /* 和别的轨道块一样:点了选中(出选中框、可删),右侧打开它的 Audio Settings 去生成 */
                onClick={() => {
                  onSelect(pendingMusic.id, "music");
                  onVoiceClick?.(pendingMusic.id);
                }}
                onContextMenu={(e) => openPartMenu(e, pendingMusic.id, "music")}
                aria-pressed={selectedId === pendingMusic.id && selectedPart === "music"}
                aria-label={pendingMusic.status === "generating" ? `Generating music ${pendingMusic.progress ?? 0}%` : "Music not generated yet — open its settings"}
                title={pendingMusic.prompt}
                className={`absolute inset-y-0 left-0 flex cursor-pointer items-center gap-1.5 overflow-hidden rounded-[6px] px-2 text-left text-[length:var(--tl-fs)] font-semibold text-[#4a4b5c] outline-none transition-colors hover:bg-[#e4e7ec] focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40 ${
                  pendingMusic.status === "generating" ? "" : PENDING_FILL
                }`}
                style={{ width: Math.max(24, total * pxPerSec - 3), boxShadow: edge("#e1e3e8") }}
              >
                {selectedId === pendingMusic.id && selectedPart === "music" && <SelectionFrame />}
                {pendingMusic.status === "generating" && <GenFill />}
                <Music className="relative size-[var(--tl-ic)] shrink-0 text-[#6a6b7b]" />
                <span className="relative truncate tabular-nums">
                  {pendingMusic.status === "generating" ? `Generating ${pendingMusic.progress ?? 0}%` : "No Music Generated"}
                </span>
              </button>
            ) : (
              <EmptyLane
                icon={Music}
                label="Add music"
                width={total * pxPerSec - 3}
                onClick={() => onPanel?.("audio")}
              />
            )}
          </div>

          {/* 音效轨:每个音效一个小块,放在它响的那一刻;空的时候是加音效的入口 */}
          <div className="relative" style={{ height: laneH }}>
            {(project.sfx ?? []).length === 0 && (
              <EmptyLane icon={AudioWaveform} label="Add sound effects" width={total * pxPerSec - 3} onClick={() => onPanel?.("sfx")} />
            )}

            {(project.sfx ?? []).map((cue) => {
              const lib = SFX_LIBRARY.find((x) => x.id === cue.kind);
              /* 上传的音效用自己的名字和长度;trim 过的用 trim 后的长度 */
              const name = cue.url ? cue.name ?? "Sound" : lib?.name ?? "Sound";
              const off = cue.offset ?? 0;
              const len = cue.len ?? lib?.durationSec ?? 0.5;
              const srcLen = cue.srcLen ?? (cue.url ? off + len : lib?.durationSec ?? off + len);
              const selected = selectedId === cue.id && selectedPart === "sfx";
              /* 块宽 = 音效真实长度(不能加最小宽度撑大:撑大后看着比声音长,往右拖却拉不长,像是坏了)。
                 窄到放不下两个把手 + 中间能按的地方:把手放到块外面;轨道左边留了 14px,贴着 0 秒的左把手也不会被裁掉 */
              const w = Math.max(10, len * pxPerSec - 3);
              const narrow = w < 56;
              return (
                <div
                  key={cue.id}
                  role="button"
                  tabIndex={0}
                  title={cue.bind ? `${name} · follows its ${"cardId" in cue.bind ? "text" : "shot"} — drag to detach` : name}
                  aria-label={`Sound effect: ${name}`}
                  aria-pressed={selected}
                  onPointerDown={(e) =>
                    startMove(e, (d) => {
                      /* 不和别的音效重叠:放进最近的空位;没空位就不动 */
                      const at = fitInGap(Math.max(0, cue.at + d), len, sfxSpans(cue.id), 0, Math.max(total, cue.at + len));
                      if (at === null) return cue.at + 0.01;
                      /* 手动拖过就解绑,不再跟着字卡 / 镜头走 */
                      patchSfx(cue.id, { at, bind: undefined });
                      return at + 0.01;
                    })
                  }
                  onClick={() => {
                    if (!dragged.current) onSelect(cue.id, "sfx");
                  }}
                  onDoubleClick={() => onPanel?.("sfx")}
                  onContextMenu={(e) => openPartMenu(e, cue.id, "sfx")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(cue.id, "sfx");
                    }
                  }}
                  className={`absolute inset-y-0 flex cursor-grab items-center gap-1 text-[length:var(--tl-fs)] active:cursor-grabbing font-semibold outline-none transition-colors hover:brightness-[0.97] focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40 ${
                    selected && narrow ? "" : "overflow-hidden rounded-[6px]"
                  } ${selected ? (narrow ? "z-10 justify-center px-1" : "z-10 px-3.5") : "px-1.5"}`}
                  style={{
                    left: cue.at * pxPerSec,
                    width: w,
                    background: TRACK.sfx.bg,
                    boxShadow: edge(TRACK.sfx.border),
                    color: TRACK.sfx.text,
                  }}
                >
                  {cue.bind ? <Link2 className="size-[var(--tl-ic)] shrink-0" aria-label="Follows its card or shot" /> : <AudioWaveform className="size-[var(--tl-ic)] shrink-0" />}
                  {pxPerSec * len > 56 && <span className="truncate">{name}</span>}
                  {selected && (
                    <SelectionFrame
                      outside={narrow}
                      labels={["Trim sound effect start", len > srcLen + 0.05 ? "Trim sound effect end — loops past its own length" : "Trim sound effect end"]}
                      onIn={(e) =>
                        startEdge(e, (d) => {
                          /* 往右:掐掉开头;往左:提前开始、整段变长(不早于 0 秒)。至少留 MIN_AUDIO */
                          const shift = Math.max(prevEndBefore(cue.at, sfxSpans(cue.id), 0) - cue.at, Math.min(d, len - MIN_AUDIO));
                          const offset = Math.max(0, off + shift);
                          patchSfx(cue.id, { offset: offset || undefined, at: cue.at + shift, len: len - shift, srcLen, bind: undefined });
                          return cue.at + shift + 0.01;
                        })
                      }
                      onOut={(e) =>
                        startEdge(e, (d) => {
                          /* 可以拉得比音效本身长(循环播放),不超过成片结尾 */
                          const next = Math.min(Math.max(MIN_AUDIO, len + d), Math.max(MIN_AUDIO, nextStartAfter(cue.at + len, sfxSpans(cue.id), total) - cue.at));
                          patchSfx(cue.id, { len: next, srcLen });
                          return cue.at + next - 0.01;
                        })
                      }
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* 播放头 */}
          {/* 播放头用墨色:橙色只留给选中框,两者一眼分得开 */}
          <span
            className={`pointer-events-none absolute top-0 z-40 h-full w-[1.5px] -translate-x-1/2 ${dark ? "bg-white" : "bg-[#1a1a2e]"}`}
            style={{ left: player.t * pxPerSec }}
          >
            <span
              className={`absolute left-1/2 top-0 h-3 w-[9px] -translate-x-1/2 rounded-[3px] shadow-[0_1px_3px_rgba(26,26,46,0.3)] ${dark ? "bg-white" : "bg-[#1a1a2e]"}`}
            />
          </span>
        </div>
      </div>
      {ctx?.part && menu && (() => {
        const items = partMenuItems(ctx.part, ctx.id);
        return items ? <PartMenu x={ctx.x} y={ctx.y} label={{ sub: "Subtitle actions", card: "Text actions", voice: "Voiceover actions", music: "Music actions", sfx: "Sound effect actions" }[ctx.part]} items={items} onClose={() => setCtx(null)} /> : null;
      })()}
      {ctx && !ctx.part && menu && (() => {
        const seg = segs.find((x) => x.clip.id === ctx.id);
        if (!seg) return null;
        const a = assetOf(seg.clip);
        return (
          <ClipMenu
            x={ctx.x}
            y={ctx.y}
            clipId={ctx.id}
            speed={seg.clip.speed}
            range={[seg.start, seg.start + seg.len]}
            total={total}
            canReference={a?.status === "ready" && !!a.url}
            canSplit={player.t - seg.start >= MIN_CLIP && seg.start + seg.len - player.t >= MIN_CLIP}
            api={menu}
            onClose={() => setCtx(null)}
          />
        );
      })()}
    </div>
  );
}

/* 空轨道:铺满整条时间线的虚线轨,加号 + 图标 + 主文案。
   字幕 / 配音 / 音乐三条完全同一个样式,读起来就是「这条轨还空着」 */
function EmptyLane({
  icon: Icon,
  label,
  width,
  onClick,
  info,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  width: number;
  onClick: () => void;
  /** 悬停时的说明(比如自动字幕识别的是哪段声音);有就在文案后面加一个 ⓘ */
  info?: string;
}) {
  const button = (
    <button
      type="button"
      onClick={onClick}
      aria-label={info ? `${label}. ${info}` : undefined}
      className="flex h-full w-full items-center gap-1.5 overflow-hidden rounded-[6px] border border-dashed border-[#dcdde3] bg-transparent px-2.5 text-[length:var(--tl-fs)] font-semibold text-[#6a6b7b] outline-none transition-colors hover:border-[#b4b5c2] hover:bg-[#f7f8fa] hover:text-[#1a1a2e] focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40"
    >
      <Plus className="size-[var(--tl-ic)] shrink-0" />
      <Icon className="size-[var(--tl-ic2)] shrink-0" />
      <span className="truncate">{label}</span>
      {info && <Info className="size-3.5 shrink-0 opacity-70" aria-hidden />}
    </button>
  );
  const box = { width: Math.max(180, width) };
  return info ? (
    <Tip label={info} side="bottom" align="start" className="absolute inset-y-0 left-0" style={box}>
      {button}
    </Tip>
  ) : (
    <span className="absolute inset-y-0 left-0" style={box}>
      {button}
    </span>
  );
}

/* 选中框:五条轨完全同一套 —— 2px 深一档的品牌橙内描边 + 两侧 10px 把手(中间白色握把线)。
   选中不改块本身的颜色;用深一档的橙(#e2500f),在橙色字幕块上也看得清 */
function SelectionFrame({
  labels,
  onIn,
  onOut,
  outside,
}: {
  labels?: [string, string];
  /** 不传把手:只画选中框 */
  onIn?: (e: React.PointerEvent) => void;
  onOut?: (e: React.PointerEvent) => void;
  /** 块太窄(短音效):把手长在块外面,块本身还能按住整段拖;父级不能 overflow-hidden */
  outside?: boolean;
} = {}) {
  const handle = "absolute inset-y-0 z-20 flex w-2.5 cursor-ew-resize items-center justify-center bg-[#e2500f] transition-colors hover:bg-[#c9440a]";
  const [inPos, outPos] = outside ? ["-left-2.5 rounded-l-[6px]", "-right-2.5 rounded-r-[6px]"] : ["left-0 rounded-l-[6px]", "right-0 rounded-r-[6px]"];
  return (
    <>
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-0 z-10 shadow-[inset_0_0_0_2px_#e2500f] ${outside && onIn ? "" : "rounded-[6px]"}`}
      />
      {onIn && onOut && labels && (
        <>
          <span aria-label={labels[0]} title={labels[0]} onPointerDown={onIn} className={`${handle} ${inPos}`}>
            <span className="h-3 w-[2px] rounded-full bg-white/90" />
          </span>
          <span aria-label={labels[1]} title={labels[1]} onPointerDown={onOut} className={`${handle} ${outPos}`}>
            <span className="h-3 w-[2px] rounded-full bg-white/90" />
          </span>
        </>
      )}
    </>
  );
}

function ClipFace({
  clipAsset,
  clip,
  pxPerSec,
  h,
  dark,
}: {
  clipAsset?: Project["assets"][number];
  clip: Clip;
  pxPerSec: number;
  h: number;
  dark: boolean;
}) {
  if (clipAsset?.status === "ready" && clipAsset.url) {
    return (
      <div className="absolute inset-0 bg-[#e6e7ec]">
        <Filmstrip asset={clipAsset} clip={clip} pxPerSec={pxPerSec} height={h} />
      </div>
    );
  }
  /* 未生成的 AI 镜头:平涂浅灰 + 摄像机图标(和画布上的 Video Generator 同一个)+ 状态;
     生成中换成流动的暖橙渐变(和画布节点、Agent 生成卡同一套) */
  if (clipAsset?.origin === "ai") {
    const busy = clipAsset.status === "generating";
    /* 没生成前固定写 No Video Generated;要拍什么看预览区和 Video Settings 里的 prompt */
    const label = busy ? `Generating ${clipAsset.progress ?? 0}%` : "No Video Generated";
    return (
      <div className={`absolute inset-0 flex items-center overflow-hidden rounded-[6px] px-2 ${busy ? "" : `ring-1 ring-inset ring-[#e1e3e8] ${PENDING_FILL}`}`}>
        {busy && <GenFill />}
        <span className={`relative flex min-w-0 items-center gap-1.5 text-[length:var(--tl-fs)] font-semibold ${busy ? "text-[#1a1a2e]/80" : "text-[#4a4b5c]"}`}>
          <Video className={`size-[var(--tl-ic)] shrink-0 ${busy ? "" : "text-[#6a6b7b]"}`} />
          <span className="truncate tabular-nums">{label}</span>
        </span>
      </div>
    );
  }
  return (
    <div
      className={`absolute inset-0 flex items-center gap-1.5 overflow-hidden border border-dashed px-2 text-[length:var(--tl-fs)] font-semibold ${
        dark ? "border-white/25 bg-white/[0.03] text-white/60" : "border-[#c9cad4] bg-white text-[#6a6b7b]"
      } rounded-md`}
    >
      <ImagePlus className="size-[var(--tl-ic)] shrink-0" />
      <span className="truncate">Add footage</span>
    </div>
  );
}
