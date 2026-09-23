"use client";

/* 画布:深色点阵底,素材节点连线进剪辑器节点(参考真实产品画布)。
   拖节点标题/卡片 = 移动节点;拖空白 = 平移;⌘/Ctrl + 滚轮 = 缩放。 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Download,
  Film,
  Scissors,
  Image as ImageIcon,
  Loader2,
  Maximize2,
  Minus,
  Music2,
  Pause,
  Play,
  Plus,
  Trash2,
  Video,
  Wand2,
} from "lucide-react";
import { Preview, type Player, type Scrub } from "./player";
import { Timeline, type EditApi, type PanelId, type SelectPart } from "./timeline";
import { SplitIcon } from "./icons";
import { Tip } from "./tip";
import type { ClipMenuApi } from "./clipmenu";
import { EDITOR_W, LABEL_H, fmt, nodeSize, type Asset, type Project } from "./project";

const PREVIEW_H = 440;
const PORT_Y = LABEL_H + PREVIEW_H / 2;
const EDITOR_H = LABEL_H + PREVIEW_H + 178;
const PORT_GAP = 22;

type View = { x: number; y: number; k: number };

export function Board({
  project,
  edit,
  player,
  selectedId,
  selectedPart,
  onSelect,
  scrub,
  setScrub,
  onGenerate,
  onOpenFull,
  onExport,
  exportPct = null,
  clipMenu,
  onSplit,
  onDelete,
  fullOpen,
  settingsId,
  onNodeClick,
  focusId,
  cover,
  onCover,
  onCoverRemove,
}: {
  project: Project;
  edit: EditApi;
  player: Player;
  selectedId: string | null;
  selectedPart: SelectPart;
  onSelect: (id: string | null, part?: SelectPart) => void;
  scrub: Scrub;
  setScrub: (s: Scrub) => void;
  onGenerate: (assetId: string) => void;
  onOpenFull: (panel?: PanelId) => void;
  onExport: () => void;
  exportPct?: number | null;
  clipMenu?: ClipMenuApi;
  onSplit: () => void;
  onDelete: () => void;
  fullOpen: boolean;
  /** 右侧 Settings 面板正打开的节点 */
  settingsId: string | null;
  onNodeClick: (id: string) => void;
  /** 新建节点后把视角移过去 */
  focusId: string | null;
  cover: { src?: string; pending?: boolean };
  onCover: () => void;
  onCoverRemove: () => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [view, setViewState] = useState<View>({ x: 40, y: 40, k: 0.8 });
  const viewRef = useRef(view);
  const setView = (v: View) => {
    viewRef.current = v;
    setViewState(v);
  };
  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  const selectedClip = project.clips.find((c) => c.id === selectedId);

  /* ── 适配视口 ── */
  const fit = useCallback(() => {
    const box = boxRef.current;
    if (!box) return;
    const rects = [
      ...project.assets.map((a) => {
        const s = nodeSize(a);
        return { x: a.x, y: a.y, w: s.w, h: s.h + LABEL_H };
      }),
      { x: project.editor.x, y: project.editor.y, w: EDITOR_W, h: EDITOR_H },
    ];
    const minX = Math.min(...rects.map((r) => r.x));
    const minY = Math.min(...rects.map((r) => r.y));
    const maxX = Math.max(...rects.map((r) => r.x + r.w));
    const maxY = Math.max(...rects.map((r) => r.y + r.h));
    /* 顶栏浮在画布上,上边多留出它的高度 */
    const pad = 48;
    const top = 76;
    const k = Math.min(1, (box.clientWidth - pad * 2) / (maxX - minX + 40), (box.clientHeight - top - pad) / (maxY - minY));
    setView({
      k,
      x: (box.clientWidth - (maxX - minX) * k) / 2 - minX * k,
      y: top + (box.clientHeight - top - pad - (maxY - minY) * k) / 2 - minY * k,
    });
  }, [project.assets, project.editor]);

  const fitted = useRef(false);
  useLayoutEffect(() => {
    if (fitted.current) return;
    fitted.current = true;
    fit();
  }, [fit]);

  /* 自动排版期间(素材尺寸刚读出来)跟着重新适配一次 */
  const layoutKey = project.autoLayout ? project.assets.map((a) => `${a.id}:${a.aspect.toFixed(2)}`).join("|") : "";
  useEffect(() => {
    if (project.autoLayout) fit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutKey]);

  /* ── 滚轮:平移 / 缩放 ── */
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const onWheel = (e: WheelEvent) => {
      if ((e.target as HTMLElement).closest("[data-nodrag]") && !e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const v = viewRef.current;
      if (e.ctrlKey || e.metaKey) {
        const r = box.getBoundingClientRect();
        const px = e.clientX - r.left;
        const py = e.clientY - r.top;
        const k = Math.min(1.6, Math.max(0.25, v.k * Math.exp(-e.deltaY * 0.0022)));
        setView({ k, x: px - ((px - v.x) * k) / v.k, y: py - ((py - v.y) * k) / v.k });
      } else {
        setView({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY });
      }
    };
    box.addEventListener("wheel", onWheel, { passive: false });
    return () => box.removeEventListener("wheel", onWheel);
  }, []);

  const zoomBy = (f: number) => {
    const box = boxRef.current;
    if (!box) return;
    const v = viewRef.current;
    const px = box.clientWidth / 2;
    const py = box.clientHeight / 2;
    const k = Math.min(1.6, Math.max(0.25, v.k * f));
    setView({ k, x: px - ((px - v.x) * k) / v.k, y: py - ((py - v.y) * k) / v.k });
  };

  /* ── 拖空白平移 ── */
  const onBgDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || e.target !== e.currentTarget) return;
    const start = { x: e.clientX, y: e.clientY, v: viewRef.current };
    const move = (ev: PointerEvent) =>
      setView({ ...start.v, x: start.v.x + ev.clientX - start.x, y: start.v.y + ev.clientY - start.y });
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    onSelect(null);
  };

  /* ── 拖节点 ── */
  const dragNode = (e: React.PointerEvent, id: string | "editor") => {
    if (e.button !== 0) return;
    const t = e.target as HTMLElement;
    if (t.closest("[data-nodrag],button,input,textarea,select,a")) return;
    e.preventDefault();
    const k = viewRef.current.k;
    const origin =
      id === "editor" ? project.editor : (project.assets.find((a) => a.id === id) ?? { x: 0, y: 0 });
    const start = { x: e.clientX, y: e.clientY, ox: origin.x, oy: origin.y };
    let began = false;
    const move = (ev: PointerEvent) => {
      const dx = (ev.clientX - start.x) / k;
      const dy = (ev.clientY - start.y) / k;
      if (!began) {
        if (Math.abs(dx) + Math.abs(dy) < 3) return;
        began = true;
        edit.begin();
      }
      edit.update((p) =>
        id === "editor"
          ? { ...p, autoLayout: false, editor: { x: start.ox + dx, y: start.oy + dy } }
          : {
              ...p,
              autoLayout: false,
              assets: p.assets.map((a) => (a.id === id ? { ...a, x: start.ox + dx, y: start.oy + dy } : a)),
            },
      );
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      /* 没拖动就是点击:打开这个节点的 Settings */
      if (!began && id !== "editor") onNodeClick(id);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  /* 新建节点(比如 AI 封面)后,把视角平移到它身上 */
  useEffect(() => {
    if (!focusId) return;
    const box = boxRef.current;
    const a = project.assets.find((x) => x.id === focusId);
    if (!box || !a) return;
    const s = nodeSize(a);
    const v = viewRef.current;
    /* 右侧 Settings 面板占 ~380px,节点放在剩下区域的中间 */
    const cx = (box.clientWidth - 380) / 2;
    const cy = box.clientHeight / 2;
    setView({ ...v, x: cx - (a.x + s.w / 2) * v.k, y: cy - (a.y + LABEL_H + s.h / 2) * v.k });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId]);

  /* 输入接口画在节点外侧,不压住编辑器边框 */
  const inPort = { x: project.editor.x - PORT_GAP, y: project.editor.y + PORT_Y };
  /* 短片刚好铺满节点;素材多、片子长时不再无限压缩,最小 24px/秒,超出的部分左右滑动查看 */
  const pxPerSec = Math.min(80, Math.max(24, (EDITOR_W - 40 - 58 - 16 - 6 - 45 - 4) / Math.max(player.total, 1)));

  return (
    <div
      ref={boxRef}
      onPointerDown={onBgDown}
      className="relative min-h-0 flex-1 cursor-grab overflow-hidden active:cursor-grabbing"
      style={{
        backgroundColor: "#f7f7f9",
        backgroundImage: "radial-gradient(#d9d9e1 1px, transparent 1px)",
        backgroundSize: `${22 * view.k}px ${22 * view.k}px`,
        backgroundPosition: `${view.x}px ${view.y}px`,
      }}
    >
      <div
        className="pointer-events-none absolute left-0 top-0 origin-top-left"
        style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})` }}
      >
        {/* 连线 */}
        <svg className="absolute left-0 top-0 overflow-visible" width="1" height="1" aria-hidden>
          <defs>
            <linearGradient id="hr-edge" x1="0" x2="1">
              <stop offset="0%" stopColor="#ffb58a" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#ff5e1a" stopOpacity="0.95" />
            </linearGradient>
          </defs>
          {project.assets.map((a) => {
            const s = nodeSize(a);
            const x1 = a.x + s.w;
            const y1 = a.y + LABEL_H + s.h / 2;
            const c = Math.max(70, (inPort.x - x1) / 2);
            const hot = selectedClip?.assetId === a.id;
            return (
              <path
                key={a.id}
                d={`M${x1} ${y1} C ${x1 + c} ${y1}, ${inPort.x - c} ${inPort.y}, ${inPort.x} ${inPort.y}`}
                fill="none"
                stroke={hot ? "#ff5e1a" : "url(#hr-edge)"}
                strokeWidth={hot ? 2.4 : 1.5}
              />
            );
          })}
        </svg>

        {project.assets.map((a) => (
          <AssetNode
            key={a.id}
            asset={a}
            project={project}
            highlighted={selectedClip?.assetId === a.id || settingsId === a.id}
            onPointerDown={(e) => dragNode(e, a.id)}
            onGenerate={() => onGenerate(a.id)}
            onMeta={(meta) =>
              edit.update((p) => {
                const d = meta.durationSec;
                return {
                  ...p,
                  assets: p.assets.map((x) => (x.id === a.id ? { ...x, ...meta } : x)),
                  /* 素材真实长度读出来比预估短:把超出的 clip 收回素材范围内 */
                  clips:
                    d === undefined || a.kind !== "video"
                      ? p.clips
                      : p.clips.map((c) =>
                          c.assetId === a.id && c.outSec > d
                            ? { ...c, outSec: d, inSec: Math.min(c.inSec, Math.max(0, d - 0.3)) }
                            : c,
                        ),
                };
              })
            }
            onUseMusic={() => edit.commit((p) => ({ ...p, musicId: p.musicId === a.id ? null : a.id }))}
          />
        ))}

        {/* 剪辑器节点 */}
        <div
          className="pointer-events-auto absolute"
          style={{ left: project.editor.x, top: project.editor.y, width: EDITOR_W }}
        >
          <div
            onPointerDown={(e) => dragNode(e, "editor")}
            className="flex cursor-grab items-center gap-1.5 text-[12px] font-medium text-[#6a6b7b] active:cursor-grabbing"
            style={{ height: LABEL_H }}
          >
            <Scissors className="size-3.5" />
            <span className="font-semibold text-[#1a1a2e]">Video Editor</span>
          </div>

          <span
            className="absolute grid size-[18px] place-items-center rounded-full border border-[#ff5e1a] bg-white text-[#ff5e1a] shadow-sm"
            style={{ top: PORT_Y - 9, left: -PORT_GAP - 9 }}
          >
            <Plus className="size-3" />
          </span>

          <div className="overflow-hidden rounded-xl border border-[#ececf1] bg-white shadow-[0_12px_36px_rgba(26,26,46,0.08)]">
            <div className="bg-[#EDF1F3] p-3" data-preview style={{ height: PREVIEW_H }}>
              {fullOpen ? (
                <div className="grid size-full place-items-center text-[12px] text-[#9a9bb0]">Editing in full screen…</div>
              ) : (
                <Preview project={project} player={player} scrub={scrub} dark={false} selectedId={selectedId} selectedPart={selectedPart} onSelect={onSelect} edit={edit} />
              )}
            </div>

            <div className="border-t border-[#ececf1] px-2 pb-2" data-nodrag>
              {/* 三栏:播放控件固定在节点正中,左右两组各自靠边,宽度不同也不会把中间挤偏 */}
              <div className="grid h-11 grid-cols-[1fr_auto_1fr] items-center gap-1 px-1">
                <div className="flex items-center gap-1">
                <IconBtn label="Split at playhead" tip="Split at playhead" align="start" onClick={onSplit}>
                  <SplitIcon className="size-4" />
                </IconBtn>
                <IconBtn
                  label="Delete clip"
                  tip={selectedId ? (selectedPart === "sub" ? "Delete subtitle" : "Delete clip") : "Select a clip to delete"}
                  kbd={selectedId ? "⌫" : undefined}
                  onClick={onDelete}
                  disabled={!selectedId}
                >
                  <Trash2 className="size-4" />
                </IconBtn>
                </div>
                <div className="flex items-center gap-2.5">
                  <Tip label={player.playing ? "Pause" : "Play"} kbd="Space">
                    <button
                      type="button"
                      onClick={player.toggle}
                      aria-label={player.playing ? "Pause" : "Play"}
                      className="grid size-[26px] place-items-center rounded-full bg-[#1a1a2e] text-white transition hover:scale-105"
                    >
                      {player.playing ? <Pause className="size-3" fill="currentColor" /> : <Play className="ml-px size-3" fill="currentColor" />}
                    </button>
                  </Tip>
                  <span className="text-[12.5px] font-semibold tabular-nums text-[#1a1a2e]">
                    {fmt(player.t)} <span className="font-normal text-[#9a9bb0]">/ {fmt(player.total)}</span>
                  </span>
                </div>
                {/* 一键生成全部 AI 镜头的入口先去掉,之后放到别处 */}
                <div className="flex items-center justify-end gap-1">
                <IconBtn
                  label="Export"
                  tip={exportPct !== null ? `Exporting ${exportPct}%` : "Export MP4 · 1080p"}
                  onClick={onExport}
                >
                  {exportPct !== null ? <Loader2 className="size-4 animate-spin text-[#ff5e1a]" /> : <Download className="size-4" />}
                </IconBtn>
                <button
                  type="button"
                  onClick={() => onOpenFull()}
                  className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] font-semibold text-[#4a4b5c] transition hover:bg-[#f3f4f6] hover:text-[#1a1a2e]"
                >
                  <Maximize2 className="size-3.5" /> Full-screen edit
                </button>
                </div>
              </div>
              <Timeline
                project={project}
                player={player}
                edit={edit}
                selectedId={selectedId}
                selectedPart={selectedPart}
                onSelect={onSelect}
                pxPerSec={pxPerSec}
                compact
                onScrub={setScrub}
                onAdd={() => onOpenFull("media")}
                onPanel={(p) => onOpenFull(p)}
                cover={cover}
                onCover={onCover}
                onCoverRemove={onCoverRemove}
                menu={clipMenu}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 缩放 */}
      <div className="absolute bottom-4 left-4 flex items-center gap-0.5 rounded-xl border border-[#ececf1] bg-white p-1 text-[#4a4b5c] shadow-[0_4px_14px_rgba(26,26,46,0.06)]">
        <IconBtn label="Zoom out" tip="Zoom out" kbd="⌘ scroll" align="start" onClick={() => zoomBy(1 / 1.2)}>
          <Minus className="size-3.5" />
        </IconBtn>
        <span className="w-11 text-center text-[11.5px] tabular-nums">{Math.round(view.k * 100)}%</span>
        <IconBtn label="Zoom in" tip="Zoom in" kbd="⌘ scroll" onClick={() => zoomBy(1.2)}>
          <Plus className="size-3.5" />
        </IconBtn>
        <Tip label="Fit everything in view">
          <button
            type="button"
            onClick={fit}
            className="rounded-lg px-2 py-1.5 text-[11.5px] font-semibold transition hover:bg-[#f3f4f6]"
          >
            Fit
          </button>
        </Tip>
      </div>
    </div>
  );
}

function IconBtn({
  label,
  tip,
  kbd,
  side = "top",
  align,
  onClick,
  disabled,
  children,
}: {
  label: string;
  align?: "center" | "start" | "end";
  /** 悬停提示,不填就用 label */
  tip?: string;
  kbd?: string;
  side?: "top" | "bottom" | "right" | "left";
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Tip label={tip ?? label} kbd={kbd} side={side} align={align}>
      <button
        type="button"
        aria-label={label}
        onClick={onClick}
        disabled={disabled}
        className="grid size-8 place-items-center rounded-lg text-[#4a4b5c] transition hover:bg-[#f3f4f6] hover:text-[#1a1a2e] disabled:opacity-30 disabled:hover:bg-transparent"
      >
        {children}
      </button>
    </Tip>
  );
}

/* ── 素材节点 ── */
function AssetNode({
  asset: a,
  project,
  highlighted,
  onPointerDown,
  onGenerate,
  onMeta,
  onUseMusic,
}: {
  asset: Asset;
  project: Project;
  highlighted: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onGenerate: () => void;
  onMeta: (m: Partial<Asset>) => void;
  onUseMusic: () => void;
}) {
  const s = nodeSize(a);
  /* 生成节点的标签图标按类型走(视频 / 图片),和节点里空状态的图标一致;不用品牌橙高亮 */
  const Icon = a.kind === "audio" ? Music2 : a.kind === "image" ? ImageIcon : a.origin === "ai" ? Video : Film;
  const ring = highlighted ? "ring-2 ring-[#ff5e1a]" : "ring-1 ring-[#e6e7ec]";

  return (
    <div
      onPointerDown={onPointerDown}
      className="pointer-events-auto absolute cursor-grab active:cursor-grabbing"
      style={{ left: a.x, top: a.y, width: s.w }}
    >
      <div className="flex items-center gap-1.5 text-[11.5px] text-[#6a6b7b]" style={{ height: LABEL_H }}>
        <Icon className="size-3.5 shrink-0" />
        <span className="truncate" title={a.label}>
          {a.origin === "ai" && a.kind === "video" ? "Video Generator" : a.origin === "ai" && a.kind === "image" ? "Image Generator" : a.label}
        </span>
        {a.purpose === "cover" && (
          <span className="ml-auto shrink-0 rounded-full bg-[#fff3ec] px-1.5 py-px text-[10px] font-semibold text-[#d24f14]">Cover</span>
        )}
      </div>

      <div className={`group relative overflow-hidden rounded-lg bg-white shadow-[0_4px_16px_rgba(26,26,46,0.06)] ${ring}`} style={{ height: s.h }}>
        {a.kind === "audio" ? (
          <AudioBody asset={a} active={project.musicId === a.id} onGenerate={onGenerate} onUse={onUseMusic} />
        ) : a.status === "ready" && a.url ? (
          a.kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={a.url}
              alt=""
              draggable={false}
              className="size-full object-cover"
              onLoad={(e) => {
                const img = e.currentTarget;
                const aspect = img.naturalWidth / Math.max(1, img.naturalHeight);
                if (Math.abs(aspect - a.aspect) > 0.01) onMeta({ aspect });
              }}
            />
          ) : (
            <HoverVideo
              url={a.url}
              onMeta={(duration, aspect) => {
                const next: Partial<Asset> = {};
                if (Math.abs(duration - a.durationSec) > 0.05) next.durationSec = duration;
                if (a.origin === "upload" && Math.abs(aspect - a.aspect) > 0.01) next.aspect = aspect;
                if (Object.keys(next).length) onMeta(next);
              }}
            />
          )
        ) : (
          /* 待生成 / 生成中:照真实产品的空状态,参数都在点节点后右侧的 Settings 面板里 */
          <div className="flex size-full flex-col items-center justify-center gap-1.5 bg-white px-4 text-center">
            {a.status === "generating" ? (
              <>
                <Loader2 className="size-6 animate-spin text-[#ff5e1a]" />
                <p className="mt-1 text-[13px] font-semibold text-[#1a1a2e]">Generating… {a.progress ?? 0}%</p>
                <div className="mt-1 h-1 w-3/4 overflow-hidden rounded-full bg-[#f1f1f5]">
                  <div className="h-full rounded-full bg-[#ff7a36] transition-all" style={{ width: `${a.progress ?? 0}%` }} />
                </div>
              </>
            ) : (
              <>
                {a.kind === "image" ? (
                  <ImageIcon className="size-6 text-[#1a1a2e]" strokeWidth={1.8} />
                ) : (
                  <Video className="size-6 text-[#1a1a2e]" strokeWidth={1.8} />
                )}
                <p className="mt-1 text-[13px] font-medium text-[#1a1a2e]">
                  {a.kind === "image" ? "No Image Generated" : "No Video Generated"}
                </p>
                <p className="text-[11px] leading-snug text-[#9a9bb0]">Configure settings and start generation</p>
              </>
            )}
          </div>
        )}

        {a.origin === "ai" && a.kind !== "audio" && a.status === "ready" && (
          <button
            type="button"
            data-nodrag
            onClick={onGenerate}
            className="absolute inset-x-2 bottom-2 flex items-center justify-center gap-1 whitespace-nowrap rounded-lg bg-black/65 py-1.5 text-[11px] font-semibold text-white opacity-0 backdrop-blur transition hover:bg-black/80 group-hover:opacity-100 focus-visible:opacity-100"
          >
            <Wand2 className="size-3.5" /> Regenerate · {a.cost ?? project.creditsPerShot} credits
          </button>
        )}

        {a.origin === "ai" && a.kind !== "audio" && a.status === "generating" && a.url && (
          <div className="absolute inset-0 grid place-items-center bg-black/60 text-[12px] font-semibold text-white">
            <span className="flex items-center gap-1.5">
              <Loader2 className="size-4 animate-spin" /> Regenerating… {a.progress ?? 0}%
            </span>
          </div>
        )}
      </div>

      <span
        className="absolute -right-[5px] size-[10px] rounded-full border-2 border-white bg-[#ff7a36] shadow-sm"
        style={{ top: LABEL_H + s.h / 2 - 5 }}
      />
    </div>
  );
}

function HoverVideo({ url, onMeta }: { url: string; onMeta: (duration: number, aspect: number) => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  return (
    <div
      className="relative size-full"
      onPointerEnter={() => void ref.current?.play().catch(() => {})}
      onPointerLeave={() => {
        const v = ref.current;
        if (!v) return;
        v.pause();
        v.currentTime = 0.1;
      }}
    >
      <video
        ref={ref}
        src={`${url}#t=0.1`}
        muted
        loop
        playsInline
        preload="metadata"
        crossOrigin="anonymous"
        className="size-full object-cover"
        onLoadedMetadata={(e) => {
          const v = e.currentTarget;
          onMeta(v.duration, v.videoWidth / Math.max(1, v.videoHeight));
        }}
      />
      <span className="pointer-events-none absolute left-1/2 top-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm">
        <Play className="ml-0.5 size-4" fill="currentColor" />
      </span>
    </div>
  );
}

function AudioBody({
  asset: a,
  active,
  onGenerate,
  onUse,
}: {
  asset: Asset;
  active: boolean;
  onGenerate: () => void;
  onUse: () => void;
}) {
  return (
    <div className="flex size-full flex-col p-3">
      <p className="line-clamp-2 text-[11.5px] leading-snug text-[#4a4b5c]">{a.prompt}</p>
      <div className="mt-auto" data-nodrag>
        {a.status === "ready" ? (
          <div className="flex items-center gap-2">
            <span className="flex h-7 flex-1 items-end gap-[2px]">
              {Array.from({ length: 28 }, (_, i) => (
                <span
                  key={i}
                  className="flex-1 rounded-sm bg-[#1f9d6b]"
                  style={{ height: `${30 + ((i * 37) % 70)}%` }}
                />
              ))}
            </span>
            <button
              type="button"
              onClick={onUse}
              className={`rounded-lg px-2.5 py-1.5 text-[11.5px] font-semibold transition ${
                active ? "bg-[#1f9d6b] text-white" : "bg-[#effaf5] text-[#1f9d6b] hover:bg-[#e0f4ea]"
              }`}
            >
              {active ? "In use" : "Use as music"}
            </button>
          </div>
        ) : a.status === "generating" ? (
          <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-[#1a1a2e]">
            <Loader2 className="size-3.5 animate-spin text-[#1f9d6b]" /> Composing… {a.progress ?? 0}%
          </div>
        ) : (
          <button
            type="button"
            onClick={onGenerate}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#1f9d6b] py-2 text-[12px] font-semibold text-white transition hover:brightness-110"
          >
            <Music2 className="size-3.5" /> Generate music
          </button>
        )}
      </div>
    </div>
  );
}
