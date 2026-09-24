"use client";

/* 单轨时间线:画布上的剪辑器节点和全屏编辑共用。
   - 点 clip:选中并跳到它的开头
   - 拖 clip:调次序(松手时按指针位置插入)
   - 选中后拖左右边缘:trim 头尾,拖的同时预览停在那一帧 */

import { useEffect, useRef, useState } from "react";
import { AudioLines, ClosedCaption, ImagePlus, Mic, Music, Plus, Video, Volume2, VolumeX, X } from "lucide-react";
import { ROLE_META } from "../agent/chat/types";
import { Filmstrip, type Player, type Scrub } from "./player";
import { IMAGE_HOLD_MAX, MIN_CLIP, MIN_SUB, MUSIC_LIBRARY, SFX_LIBRARY, fmt, subSpan, type Clip, type Project, type Segment } from "./project";
import { aiMusic } from "./player";
import { CoverSlot } from "./cover";
import { Tip } from "./tip";
import { GenFill, PENDING_FILL, TRACK } from "./ui";
import { ClipMenu, type ClipMenuApi } from "./clipmenu";

export type EditApi = {
  /** 记一个撤销点 */
  begin: () => void;
  /** 改,但不记撤销点(拖动过程中用) */
  update: (fn: (p: Project) => Project) => void;
  /** 记撤销点并改 */
  commit: (fn: (p: Project) => Project) => void;
};

export type SelectPart = "clip" | "sub";

export type PanelId = "clip" | "text" | "audio" | "ai" | "media" | "ratio";

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
}) {
  const [drag, setDrag] = useState<Drag | null>(null);
  const [ctx, setCtx] = useState<{ id: string; x: number; y: number } | null>(null);
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
  const width = Math.max(total * pxPerSec + 45, 200);
  const assetOf = (c: Clip) => project.assets.find((a) => a.id === c.assetId);

  const C = dark
    ? { ruler: "text-white/40", tick: "bg-white/15", lane: "bg-white/[0.04]", head: "text-white/55 hover:text-white" }
    : { ruler: "text-[#9a9bb0]", tick: "bg-[#d9dae2]", lane: "bg-[#f1f2f5]", head: "text-[#6a6b7b] hover:text-[#1a1a2e]" };

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
    if (d.mode === "in" && trimsSource) {
      const inSec = Math.min(Math.max(0, c.inSec + dSec), c.outSec - MIN_CLIP * c.speed);
      edit.update((p) => patchClip(p, c.id, { inSec }));
      if (a?.status === "ready") onScrub({ assetId: a.id, time: inSec });
    } else {
      /* 图片 / 未生成 / 空位没有「素材内位置」,两边都只改时长 */
      const delta = d.mode === "in" ? -dSec : dSec;
      const outSec = Math.min(Math.max(c.inSec + MIN_CLIP * c.speed, c.outSec + delta), holdMax);
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
      const at = Math.max(0, Math.min(Math.max(0, total - 0.3), at0 + dx / pxPerSec));
      edit.update((p) => ({ ...p, voice: (p.voice ?? []).map((v) => (v.id === id ? { ...v, at } : v)) }));
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      /* 没拖动就是点击:打开它的生成设置 */
      if (!began) onVoiceClick?.(assetId);
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

  const tickStep = pxPerSec < 18 ? 5 : 1;
  const ticks = Array.from({ length: Math.floor((width / pxPerSec) / tickStep) + 1 }, (_, i) => i * tickStep);
  const music = MUSIC_LIBRARY.find((m) => m.id === project.musicId) ?? aiMusic(project);
  const muteAll = !project.originalOn;

  return (
    <div className="flex min-w-0">
      {/* 轨道头 */}
      <div className={`flex w-10 shrink-0 flex-col ${gap}`}>
        <div className="h-6" />
        {/* 四条轨:字幕 / 画面 / 音频 / 音乐,节点和全屏编辑都一样 */}
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
        <Tip label="Voiceover · generate with AI" side="right" className="justify-center" style={{ height: laneH }}>
          <button
            type="button"
            aria-label="Audio track: add voiceover"
            onClick={() => onAddVoice?.()}
            className={`grid w-10 place-items-center ${C.head}`}
            style={{ height: laneH }}
          >
            <AudioLines className="size-4" />
          </button>
        </Tip>
        <Tip label="Music & sound effects" side="right" className="justify-center" style={{ height: laneH }}>
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
      </div>

      {/* 封面格:固定在视频轨最前面,不随时间线横向滚动 */}
      {onCover && (
        <div className={`flex w-[58px] shrink-0 flex-col ${gap} pr-1.5`} data-nodrag>
          <div className="h-6" />
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
        className="min-w-0 flex-1 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-1 pl-1.5 [scrollbar-width:thin] [scrollbar-color:#d9dae2_transparent]"
        data-nodrag
      >
        <div className={`relative flex select-none flex-col ${gap}`} style={{ width }}>
          {/* 标尺 */}
          <div className="relative h-6 cursor-pointer" onPointerDown={scrubRuler}>
            {ticks.map((s) => (
              <span key={s} className="absolute top-0 h-full" style={{ left: s * pxPerSec }}>
                <span className={`absolute bottom-0 w-px ${C.tick} ${s % 5 === 0 ? "h-2.5" : "h-1.5"}`} />
                {s % 5 === 0 && (
                  <span className={`absolute left-[10px] top-0.5 text-[10px] tabular-nums ${C.ruler}`}>{fmt(s)}</span>
                )}
              </span>
            ))}
          </div>

          {/* 字幕轨:字幕块挂在所属片段上,选中后两端可拖,在片段范围内掐头去尾 */}
          <div className="relative" style={{ height: laneH }}>
            {/* 空状态:一条字幕都没有,整条字幕轨是一个自动生成的入口 */}
            {onAutoSubtitle && segs.length > 0 && !segs.some((s) => s.clip.subtitle) && (
              <EmptyLane
                icon={ClosedCaption}
                label="Auto-generate subtitles"
                hint="from the speech in your clips"
                width={total * pxPerSec - 3}
                onClick={onAutoSubtitle}
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
                  onClick={() => {
                    if (subDragged.current) {
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
                  className={`absolute inset-y-0 flex cursor-pointer items-center gap-1 overflow-hidden rounded-[6px] text-left text-[11px] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40 focus-visible:ring-offset-1 ${
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
                  <ClosedCaption className="size-3.5 shrink-0 opacity-90" />
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
              <EmptyLane icon={Mic} label="Add voiceover" hint="generate a voiceover with AI" width={total * pxPerSec - 3} onClick={() => onAddVoice?.()} />
            ) : (
              <>
                {(project.voice ?? []).map((v) => {
                  const a = project.assets.find((x) => x.id === v.assetId);
                  const ready = a?.status === "ready" && !!a.url;
                  return (
                    <div
                      key={v.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`Voiceover — click to edit, drag to move`}
                      onPointerDown={(e) => startVoiceDrag(e, v.id, v.at, v.assetId)}

                      className={`group/vo absolute inset-y-0 flex cursor-grab items-center gap-1.5 overflow-hidden rounded-[6px] border px-2 text-[11px] font-semibold outline-none active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40 ${ready ? "" : PENDING_FILL}`}
                      style={{
                        left: v.at * pxPerSec,
                        width: Math.max(28, v.len * pxPerSec - 3),
                        ...(ready
                          ? { background: TRACK.voice.bg, borderColor: TRACK.voice.border, color: TRACK.voice.text }
                          : { borderColor: "#e1e3e8", color: "#4a4b5c" }),
                      }}
                    >
                      {/* 生成好了:示意波形垫在文字下面;生成中:流动渐变;没生成:平涂 + 状态 */}
                      {!ready && a?.status === "generating" && <GenFill />}
                      {ready && (
                        <span aria-hidden className="pointer-events-none absolute inset-x-1 bottom-0.5 top-0.5 flex items-center gap-[2px] opacity-25">
                          {Array.from({ length: Math.max(4, Math.floor((v.len * pxPerSec) / 5)) }, (_, i) => (
                            <span key={i} className="w-[2px] shrink-0 rounded-full bg-current" style={{ height: `${25 + ((i * 53) % 70)}%` }} />
                          ))}
                        </span>
                      )}
                      <Mic className={`relative size-3 shrink-0 ${ready ? "" : "text-[#6a6b7b]"}`} />
                      {v.len * pxPerSec > 70 && (
                        <span className="relative truncate">
                          {ready ? "Voiceover" : a?.status === "generating" ? `Generating ${a.progress ?? 0}%` : "No Audio Generated"}
                        </span>
                      )}
                      <button
                        type="button"
                        aria-label="Remove voiceover"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => edit.commit((p) => ({ ...p, voice: (p.voice ?? []).filter((x) => x.id !== v.id) }))}
                        className="relative ml-auto grid size-4 shrink-0 place-items-center rounded-full bg-white/80 opacity-0 transition hover:bg-white hover:text-[#d0342c] group-hover/vo:opacity-100 focus-visible:opacity-100"
                      >
                        <X className="size-2.5" strokeWidth={3} />
                      </button>
                    </div>
                  );
                })}
                {/* 再加一段:跟在最后一段后面 */}
                <Tip label="Add another voiceover" className="absolute inset-y-0" style={{ left: Math.max(...(project.voice ?? []).map((v) => v.at + v.len)) * pxPerSec + 2 }}>
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

          {/* 音乐轨:背景音乐(曲库或画布上的 AI 音乐节点)+ 音效;空的时候一个入口同时加音乐和音效(打开音频面板) */}
          <div className="relative" style={{ height: laneH }}>
            {music ? (
              <button
                type="button"
                onClick={() => onPanel?.("audio")}
                aria-label={`Music: ${music.name}. Open audio panel`}
                className="absolute inset-y-0 flex items-center gap-1.5 overflow-hidden rounded-[6px] border px-2 text-[11px] font-semibold outline-none transition-colors hover:brightness-[0.97] focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40"
                style={{
                  left: 0,
                  width: Math.max(80, total * pxPerSec - 3),
                  background: TRACK.music.bg,
                  borderColor: TRACK.music.border,
                  color: TRACK.music.text,
                }}
              >
                <Music className="size-3 shrink-0" />
                <span className="truncate">{music.name}</span>
                <span className="ml-auto shrink-0 tabular-nums opacity-75">{project.musicVol}%</span>
              </button>
            ) : (
              <EmptyLane
                icon={Music}
                label="Add music or sound effects"
                hint="from the library, or make one with AI"
                width={total * pxPerSec - 3}
                onClick={() => onPanel?.("audio")}
              />
            )}
            {/* 音效:以小块叠在音乐轨上,点一下删掉 */}
            {(project.sfx ?? []).map((cue) => {
              const def = SFX_LIBRARY.find((x) => x.id === cue.kind);
              return (
                <Tip key={cue.id} label={`${def?.name ?? "Sound"} · click to remove`} className="absolute top-[3px] z-10" style={{ left: cue.at * pxPerSec }}>
                  <button
                    type="button"
                    aria-label={`Remove ${def?.name ?? "sound effect"}`}
                    onClick={() => edit.commit((p) => ({ ...p, sfx: (p.sfx ?? []).filter((x) => x.id !== cue.id) }))}
                    className="flex items-center gap-1 rounded-[5px] border px-1.5 text-[10.5px] font-semibold shadow-[0_1px_2px_rgba(26,26,46,0.10)] transition hover:!border-[#f3b7b3] hover:!bg-[#fff5f4] hover:!text-[#d0342c]"
                    style={{
                      height: laneH - 6,
                      minWidth: Math.max(22, (def?.durationSec ?? 0.5) * pxPerSec),
                      background: TRACK.sfx.bg,
                      borderColor: TRACK.sfx.border,
                      color: TRACK.sfx.text,
                    }}
                  >
                    <AudioLines className="size-3 shrink-0" />
                    {pxPerSec * (def?.durationSec ?? 0.5) > 56 && <span className="truncate">{def?.name}</span>}
                  </button>
                </Tip>
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
      {ctx && menu && (() => {
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
            api={menu}
            onClose={() => setCtx(null)}
          />
        );
      })()}
    </div>
  );
}

/* 空轨道:铺满整条时间线的虚线轨,图标 + 主文案 + 一句浅色说明。
   字幕 / 配音 / 音乐三条完全同一个样式,读起来就是「这条轨还空着」 */
function EmptyLane({
  icon: Icon,
  label,
  hint,
  width,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint: string;
  width: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute inset-y-0 left-0 flex items-center gap-1.5 overflow-hidden rounded-[6px] border border-dashed border-[#dcdde3] bg-transparent px-2.5 text-[11px] font-semibold text-[#6a6b7b] outline-none transition-colors hover:border-[#b4b5c2] hover:bg-[#f7f8fa] hover:text-[#1a1a2e] focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40"
      style={{ width: Math.max(180, width) }}
    >
      <Plus className="size-3 shrink-0" />
      <Icon className="size-3.5 shrink-0" />
      <span className="shrink-0">{label}</span>
      <span className="truncate font-normal text-[#9a9bb0]">· {hint}</span>
    </button>
  );
}

/* 选中框:字幕块和画面片段完全同一套 —— 2px 深一档的品牌橙内描边 + 两侧 10px 把手(中间白色握把线)。
   选中不改块本身的颜色;用深一档的橙(#e2500f),在橙色字幕块上也看得清 */
function SelectionFrame({
  labels,
  onIn,
  onOut,
}: {
  labels: [string, string];
  onIn: (e: React.PointerEvent) => void;
  onOut: (e: React.PointerEvent) => void;
}) {
  const handle = "absolute inset-y-0 z-20 flex w-2.5 cursor-ew-resize items-center justify-center bg-[#e2500f] transition-colors hover:bg-[#c9440a]";
  return (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 rounded-[6px] shadow-[inset_0_0_0_2px_#e2500f]"
      />
      <span aria-label={labels[0]} onPointerDown={onIn} className={`${handle} left-0 rounded-l-[6px]`}>
        <span className="h-3 w-[2px] rounded-full bg-white/90" />
      </span>
      <span aria-label={labels[1]} onPointerDown={onOut} className={`${handle} right-0 rounded-r-[6px]`}>
        <span className="h-3 w-[2px] rounded-full bg-white/90" />
      </span>
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
    return (
      <div className={`absolute inset-0 flex items-center overflow-hidden rounded-[6px] px-2 ${busy ? "" : `ring-1 ring-inset ring-[#e1e3e8] ${PENDING_FILL}`}`}>
        {busy && <GenFill />}
        <span className={`relative flex min-w-0 items-center gap-1.5 text-[10.5px] font-semibold ${busy ? "text-[#1a1a2e]/80" : "text-[#4a4b5c]"}`}>
          <Video className={`size-3 shrink-0 ${busy ? "" : "text-[#6a6b7b]"}`} />
          <span className="truncate tabular-nums">{busy ? `Generating ${clipAsset.progress ?? 0}%` : "No Video Generated"}</span>
        </span>
      </div>
    );
  }
  return (
    <div
      className={`absolute inset-0 flex items-center gap-1.5 overflow-hidden border border-dashed px-2 text-[10.5px] font-semibold ${
        dark ? "border-white/25 bg-white/[0.03] text-white/60" : "border-[#c9cad4] bg-white text-[#6a6b7b]"
      } rounded-md`}
    >
      <ImagePlus className="size-3 shrink-0" />
      <span className="truncate">Add footage</span>
    </div>
  );
}
