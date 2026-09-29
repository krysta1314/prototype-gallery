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
  AudioLines,
  Music2,
  Pause,
  Play,
  Plus,
  Trash2,
  Video,
  Redo2,
  Undo2,
} from "lucide-react";
import { Preview, type Player, type Scrub } from "./player";
import { IDENTITY_META } from "../agent/chat/types";
import { DELETE_LABEL, Timeline, type EditApi, type PanelId, type SelectPart } from "./timeline";
import { SplitIcon } from "./icons";
import { Tip } from "./tip";
import { GenFill, MOD, SHIFT } from "./ui";
import type { ClipMenuApi } from "./clipmenu";
import { EDITOR_W, LABEL_H, aiRefs, fmt, layoutClips, nodeSize, voiceAt, type Asset, type Project } from "./project";

const PREVIEW_H = 440;
const PORT_Y = LABEL_H + PREVIEW_H / 2;
/* 预览 + 工具条 + 四条轨(字幕 / 画面 / 音频 / 音乐) */
const EDITOR_H = LABEL_H + PREVIEW_H + 262;
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
  onAutoSubtitle,
  onAddVoice,
  onAddCard,
  onVoiceClick,
  onSplit,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onDelete,
  fullOpen,
  settingsId,
  onNodeClick,
  focusId,
  cover,
  onCover,
  onCoverRemove,
  onUseInEditor,
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
  onAutoSubtitle?: () => void;
  onAddVoice?: () => void;
  onAddCard?: () => void;
  onVoiceClick?: (assetId: string) => void;
  onSplit: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
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
  /** 节点「+」→ Video Editor:把这个节点用进剪辑器(没上时间线就加上去),再选中它 */
  onUseInEditor: (assetId: string) => void;
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
  /* 画布上点中的节点(素材 / 生成节点 / 剪辑器);它相关的连线全部高亮 */
  const [picked, setPicked] = useState<string | null>(null);
  /* 当前「激活」的节点:点中的节点 > 打开 Settings 的节点 > 时间线上选中片段用的素材 */
  const active = picked ?? settingsId ?? selectedClip?.assetId ?? null;
  /* 在剪辑器里(时间线 / 预览)选东西时,画布上点中的节点让位 */
  const selectInEditor = (id: string | null, part?: SelectPart) => {
    setPicked(null);
    onSelect(id, part);
  };

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
  }, [project]);

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
    setPicked(null);
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
    /* 按下就高亮相关连线,不等松手 */
    setPicked(id);
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
      /* 没拖动就是点击:生成节点顺带打开 Settings */
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

  /* 节点「+」→ Video Editor 之后,把视角移到剪辑器节点上 */
  const focusEditor = () => {
    const box = boxRef.current;
    if (!box) return;
    const v = viewRef.current;
    setView({ ...v, x: box.clientWidth / 2 - (project.editor.x + EDITOR_W / 2) * v.k, y: box.clientHeight / 2 - (project.editor.y + EDITOR_H / 2) * v.k });
  };

  /* 输入接口画在节点外侧,不压住编辑器边框 */
  const inPort = { x: project.editor.x - PORT_GAP, y: project.editor.y + PORT_Y };
  /* 短片刚好铺满节点;素材多、片子长时不再无限压缩,最小 24px/秒,超出的部分左右滑动查看 */
  const pxPerSec = Math.min(80, Math.max(24, (EDITOR_W - 40 - 58 - 16 - 14 - 45 - 4) / Math.max(player.total, 1)));

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
          {/* 高亮连线:按下节点的瞬间整条变成品牌橙(不做描线入场,避免「慢半拍」),
              同时一小段白色高光从上游滑向下游。pathLength=1 让长短不同的线用同一套节奏 */}
          <style>{`
            @keyframes hr-signal { from { stroke-dashoffset: 0.08; } to { stroke-dashoffset: -1; } }
            .hr-edge-signal { stroke-dasharray: 0.08 1.2; stroke-dashoffset: 0.08; animation: hr-signal 2.4s cubic-bezier(0.45, 0, 0.25, 1) infinite; }
            @media (prefers-reduced-motion: reduce) {
              .hr-edge-signal { display: none; }
            }
          `}</style>
          {/* 连线默认灰色;激活节点相关的线高亮成品牌橙,画在最上层 */}
          {(() => {
            const edges: { key: string; d: string; hot: boolean }[] = [];
            for (const a of project.assets) {
              for (const r of aiRefs(project, a)) {
                const rs = nodeSize(r);
                const x1 = r.x + rs.w;
                const y1 = r.y + LABEL_H + rs.h / 2;
                const x2 = a.x;
                const y2 = a.y + LABEL_H + nodeSize(a).h / 2;
                const k = Math.max(40, (x2 - x1) / 2);
                edges.push({
                  key: `ref-${a.id}-${r.id}`,
                  d: `M${x1} ${y1} C ${x1 + k} ${y1}, ${x2 - k} ${y2}, ${x2} ${y2}`,
                  hot: active === a.id || active === r.id,
                });
              }
              const s = nodeSize(a);
              const x1 = a.x + s.w;
              const y1 = a.y + LABEL_H + s.h / 2;
              const c = Math.max(70, (inPort.x - x1) / 2);
              edges.push({
                key: a.id,
                d: `M${x1} ${y1} C ${x1 + c} ${y1}, ${inPort.x - c} ${inPort.y}, ${inPort.x} ${inPort.y}`,
                hot: active === a.id || active === "editor",
              });
            }
            return edges
              .sort((x, y) => Number(x.hot) - Number(y.hot))
              .map((e) =>
                e.hot ? (
                  <g key={e.key}>
                    <path d={e.d} fill="none" stroke="#ff5e1a" strokeWidth={1.75} />
                    <path
                      d={e.d}
                      pathLength={1}
                      fill="none"
                      stroke="#ffffff"
                      strokeOpacity={0.9}
                      strokeWidth={1.75}
                      strokeLinecap="round"
                      className="hr-edge-signal"
                    />
                  </g>
                ) : (
                  <path key={e.key} d={e.d} fill="none" stroke="#d3d4dc" strokeWidth={1.25} />
                ),
              );
          })()}
        </svg>

        {project.assets.map((a) => (
          <AssetNode
            key={a.id}
            asset={a}
            project={project}
            highlighted={active === a.id || selectedClip?.assetId === a.id || settingsId === a.id}
            onPointerDown={(e) => dragNode(e, a.id)}
            zoom={view.k}
            onUseInEditor={() => {
              onUseInEditor(a.id);
              setPicked("editor");
              focusEditor();
            }}
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

          <div
            className={`overflow-hidden rounded-xl border bg-white shadow-[0_12px_36px_rgba(26,26,46,0.08)] ${
              picked === "editor" ? "border-[#ff5e1a] ring-1 ring-[#ff5e1a]" : "border-[#ececf1]"
            }`}
          >
            <div className="bg-[#EDF1F3] p-3" data-preview style={{ height: PREVIEW_H }}>
              {fullOpen ? (
                <div className="grid size-full place-items-center text-[12px] text-[#6a6b7b]">Editing in full screen…</div>
              ) : (
                <Preview project={project} player={player} scrub={scrub} dark={false} selectedId={selectedId} selectedPart={selectedPart} onSelect={selectInEditor} edit={edit} onGenerate={onGenerate} />
              )}
            </div>

            <div className="border-t border-[#ececf1] px-2 pb-2" data-nodrag>
              {/* 三栏:播放控件固定在节点正中,左右两组各自靠边,宽度不同也不会把中间挤偏 */}
              <div className="-mx-2 mb-1 grid h-11 grid-cols-[1fr_auto_1fr] items-center gap-1 border-b border-[#eceef2] px-3">
                <div className="flex items-center gap-1">
                {/* 撤销 / 重做:放在分割前面,和 ⌘Z / ⇧⌘Z 同一套 */}
                <IconBtn label="Undo" kbd={`${MOD}Z`} align="start" onClick={onUndo} disabled={!canUndo}>
                  <Undo2 className="size-4" />
                </IconBtn>
                <IconBtn label="Redo" kbd={`${SHIFT}${MOD}Z`} onClick={onRedo} disabled={!canRedo}>
                  <Redo2 className="size-4" />
                </IconBtn>
                <IconBtn label="Split at playhead" tip="Split at playhead" align="start" onClick={onSplit}>
                  <SplitIcon className="size-4" />
                </IconBtn>
                <IconBtn
                  label={selectedId ? DELETE_LABEL[selectedPart] : "Delete clip"}
                  tip={selectedId ? DELETE_LABEL[selectedPart] : "Select a clip to delete"}
                  kbd={selectedId ? "⌫" : undefined}
                  onClick={onDelete}
                  disabled={!selectedId}
                >
                  <Trash2 className="size-4" />
                </IconBtn>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={player.toggle}
                    aria-label={player.playing ? "Pause" : "Play"}
                    className="grid size-[26px] place-items-center rounded-full bg-[#1a1a2e] text-white transition hover:scale-105"
                  >
                    {player.playing ? <Pause className="size-3" fill="currentColor" /> : <Play className="ml-px size-3" fill="currentColor" />}
                  </button>
                  <span className="text-[13px] font-semibold tabular-nums text-[#1a1a2e]">
                    {fmt(player.t)} <span className="font-normal text-[#6a6b7b]">/ {fmt(player.total)}</span>
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
                  className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-semibold text-[#4a4b5c] transition hover:bg-[#f3f4f6] hover:text-[#1a1a2e]"
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
                onSelect={selectInEditor}
                pxPerSec={pxPerSec}
                compact
                onScrub={setScrub}
                onAdd={() => onOpenFull("media")}
                onPanel={(p) => onOpenFull(p)}
                cover={cover}
                onCover={onCover}
                onCoverRemove={onCoverRemove}
                menu={clipMenu}
                onAutoSubtitle={onAutoSubtitle}
                onAddVoice={onAddVoice}
                onAddCard={onAddCard}
                onVoiceClick={onVoiceClick}
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
        <span className="w-11 text-center text-[12px] tabular-nums">{Math.round(view.k * 100)}%</span>
        <IconBtn label="Zoom in" tip="Zoom in" kbd="⌘ scroll" onClick={() => zoomBy(1.2)}>
          <Plus className="size-3.5" />
        </IconBtn>
        <button
          type="button"
          onClick={fit}
          className="rounded-lg px-2 py-1.5 text-[12px] font-semibold transition hover:bg-[#f3f4f6]"
        >
          Fit
        </button>
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
  onUseInEditor,
  onMeta,
  zoom,
}: {
  asset: Asset;
  project: Project;
  highlighted: boolean;
  /** 画布缩放倍数:小窗反向缩放,不管画布缩到多小都按屏幕原尺寸显示 */
  zoom: number;
  onPointerDown: (e: React.PointerEvent) => void;
  onUseInEditor: () => void;
  onMeta: (m: Partial<Asset>) => void;
}) {
  const s = nodeSize(a);
  /* 选中节点时,右侧输出点换成「+」,点开小窗;目前只有一个去处:Video Editor */
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    if (!highlighted) setMenu(false);
  }, [highlighted]);
  useEffect(() => {
    if (!menu) return;
    const close = (e: PointerEvent) => {
      if (!(e.target as HTMLElement).closest("[data-node-menu]")) setMenu(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", esc);
    };
  }, [menu]);
  /* 生成节点的标签图标按类型走(视频 / 图片),和节点里空状态的图标一致;不用品牌橙高亮 */
  /* 配音和 AI 配乐是同一种 Audio Generator 节点,标签、图标、节点样子都一样 */
  const Icon = a.kind === "audio" ? (a.origin === "ai" ? AudioLines : Music2) : a.kind === "image" ? ImageIcon : a.origin === "ai" ? Video : Film;
  const ring = highlighted ? "ring-2 ring-[#ff5e1a]" : "ring-1 ring-[#e6e7ec]";

  return (
    <div
      onPointerDown={onPointerDown}
      className={`pointer-events-auto absolute cursor-grab active:cursor-grabbing ${menu ? "z-30" : ""}`}
      style={{ left: a.x, top: a.y, width: s.w }}
    >
      <div className="flex items-center gap-1.5 text-[12px] text-[#6a6b7b]" style={{ height: LABEL_H }}>
        <Icon className="size-3.5 shrink-0" />
        <span className="truncate" title={a.label}>
          {a.origin === "ai" && a.kind === "video"
            ? "Video Generator"
            : a.origin === "ai" && a.kind === "image"
              ? "Image Generator"
              : a.kind === "audio" && a.origin === "ai"
                ? "Audio Generator"
                : a.label}
        </span>
        {/* 上传素材:Agent 判断的身份(参考 / 品牌资产 / 产品…),点节点看完整分析 */}
        {a.origin === "upload" && a.identity && a.identity !== "footage" && (
          <span className="ml-auto shrink-0 rounded-full bg-[#fff3ec] px-1.5 py-px text-[11px] font-semibold text-[#d24f14]" title={a.analysis?.description}>
            {IDENTITY_META[a.identity].label}
          </span>
        )}
      </div>

      <div className={`group relative overflow-hidden rounded-lg bg-white shadow-[0_4px_16px_rgba(26,26,46,0.06)] ${ring}`} style={{ height: s.h }}>
        {a.kind === "audio" ? (
          <AudioGenBody asset={a} project={project} />
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
          <div className="relative flex size-full flex-col items-center justify-center gap-1.5 bg-white px-4 text-center">
            {a.status === "generating" ? (
              /* 生成中:整张卡是流动的暖橙渐变(和 Agent 里的生成卡同一套),只留一行进度 */
              <>
                <GenFill />
                <p className="relative text-[13px] font-semibold tabular-nums text-[#1a1a2e]/80">Generating… {a.progress ?? 0}%</p>
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
                <p className="text-[11px] leading-snug text-[#6a6b7b]">Configure settings and start generation</p>
              </>
            )}
          </div>
        )}

        {/* 生成好的节点上不再叠「Regenerate」按钮:重生在右侧 Video Settings 里 */}
        {a.origin === "ai" && a.kind !== "audio" && a.status === "generating" && a.url && (
          <div className="absolute inset-0 grid place-items-center">
            <GenFill className="opacity-95" />
            <span className="relative text-[13px] font-semibold tabular-nums text-[#1a1a2e]/80">Regenerating… {a.progress ?? 0}%</span>
          </div>
        )}

      </div>

      {highlighted ? (
        <div data-node-menu data-nodrag className="absolute" style={{ left: s.w - 9, top: LABEL_H + s.h / 2 - 9 }} onPointerDown={(e) => e.stopPropagation()}>
          <button
            type="button"
            aria-label="Use this node in…"
            aria-haspopup="menu"
            aria-expanded={menu}
            onClick={() => setMenu((m) => !m)}
            className={`grid size-[18px] place-items-center rounded-full border border-[#ff5e1a] shadow-sm transition ${menu ? "bg-[#ff5e1a] text-white" : "bg-white text-[#ff5e1a] hover:bg-[#fff3ec]"}`}
          >
            <Plus className="size-3" />
          </button>
          {menu && (
            <div
              role="menu"
              className="absolute left-7 top-1/2 z-40 w-[260px] cursor-default rounded-2xl border border-[#ececf1] bg-white p-2 shadow-[0_18px_48px_rgba(26,26,46,0.16)]"
              style={{ transform: `translateY(-50%) scale(${1 / zoom})`, transformOrigin: "left center" }}
            >
              <p className="px-2 pb-1.5 pt-1 text-[13px] text-[#6a6b7b]">Use this node in</p>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenu(false);
                  onUseInEditor();
                }}
                className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-[#f6f6f8]"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#f3f4f6] text-[#4a4b5c]">
                  <Scissors className="size-[18px]" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[14px] font-semibold text-[#1a1a2e]">Video Editor</span>
                  <span className="block text-[12.5px] text-[#6a6b7b]">Edit it on the timeline</span>
                </span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <span
          className="absolute -right-[5px] size-[10px] rounded-full border-2 border-white bg-[#ff7a36] shadow-sm"
          style={{ top: LABEL_H + s.h / 2 - 5 }}
        />
      )}
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

/* Audio Generator 节点(AI 配音、AI 配乐共用):没生成时是空状态,生成中显示进度,生成好是文案 + 波形 + 它用在哪。
   点节点打开 Audio Settings。用户上传的音乐也用这个样子(直接是生成好的状态) */
function AudioGenBody({ asset: a, project }: { asset: Asset; project: Project }) {
  if (a.status === "generating") {
    return (
      <div className="relative flex size-full flex-col items-center justify-center text-center">
        <GenFill />
        <p className="relative text-[13px] font-semibold tabular-nums text-[#1a1a2e]/80">Generating… {a.progress ?? 0}%</p>
      </div>
    );
  }
  if (a.status !== "ready" || !a.url) {
    return (
      <div className="flex size-full flex-col items-center justify-center gap-1 px-4 text-center">
        <AudioLines className="size-5 text-[#1a1a2e]" strokeWidth={1.8} />
        <p className="mt-1 text-[13px] font-semibold">No Audio Generated</p>
        <p className="text-[11px] leading-snug text-[#6a6b7b]">Configure settings and start generation</p>
      </div>
    );
  }
  return <AudioGenPlayer asset={a} project={project} />;
}

/* 生成好的音频:能直接在节点上试听。播放键 + 声波(放过的部分染品牌橙,点声波跳到那里)+ 00:00 / 00:27。
   按镜头分段的配音没有一整条文件,按时间线上的先后把每句接着放 */
const BARS = 32;
function AudioGenPlayer({ asset: a, project }: { asset: Asset; project: Project }) {
  const { segs } = layoutClips(project.clips);
  const lines = (project.voice ?? [])
    .filter((v) => v.assetId === a.id && v.text !== undefined && v.url)
    .sort((x, y) => voiceAt(x, segs) - voiceAt(y, segs));
  const list = lines.length ? lines.map((v) => ({ url: v.url!, len: v.len })) : a.url ? [{ url: a.url, len: a.durationSec }] : [];
  const total = list.reduce((n, x) => n + x.len, 0) || a.durationSec;

  const ref = useRef<HTMLAudioElement>(null);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  /* 第 i 句在整条里从哪一秒开始 */
  const startOf = (i: number) => list.slice(0, i).reduce((n, x) => n + x.len, 0);

  const load = (i: number, local: number, play: boolean) => {
    const el = ref.current;
    const item = list[i];
    if (!el || !item) return;
    setIdx(i);
    if (el.getAttribute("src") !== item.url) el.src = item.url;
    const go = () => {
      el.currentTime = Math.min(local, item.len);
      if (play) void el.play().catch(() => setPlaying(false));
    };
    if (el.readyState >= 1) go();
    else el.onloadedmetadata = go;
  };

  const toggle = () => {
    const el = ref.current;
    if (!el || !list.length) return;
    if (playing) {
      el.pause();
      setPlaying(false);
      return;
    }
    setPlaying(true);
    /* 放完了再点:从头来 */
    if (t >= total - 0.05) {
      setT(0);
      load(0, 0, true);
    } else load(idx, t - startOf(idx), true);
  };

  const seek = (e: React.MouseEvent<HTMLSpanElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const to = Math.max(0, Math.min(total, ((e.clientX - box.left) / box.width) * total));
    let i = 0;
    while (i < list.length - 1 && startOf(i + 1) <= to) i++;
    setT(to);
    load(i, to - startOf(i), playing);
  };

  useEffect(() => () => ref.current?.pause(), []);

  const voice = a.purpose === "voice";
  /* 平时不写用在哪;只有没用上的时候提醒一句 */
  const unused = voice ? !(project.voice ?? []).some((v) => v.assetId === a.id) : project.musicId !== a.id;
  const played = total ? t / total : 0;
  return (
    <div className="flex size-full flex-col p-3">
      <p className="line-clamp-2 text-[12px] leading-snug text-[#4a4b5c]">{a.origin === "ai" ? a.prompt : a.label}</p>
      <div className="mt-auto flex items-center gap-2.5" data-nodrag>
        <button
          type="button"
          aria-label={playing ? "Pause" : "Play"}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={toggle}
          className="grid size-8 shrink-0 place-items-center rounded-full bg-[#ff5e1a] text-white transition-colors hover:bg-[#e2500f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40 focus-visible:ring-offset-1"
        >
          {playing ? <Pause className="size-3.5 fill-current" /> : <Play className="ml-0.5 size-3.5 fill-current" />}
        </button>
        <span
          role="slider"
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={Math.round(total)}
          aria-valuenow={Math.round(t)}
          tabIndex={-1}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={seek}
          className="flex h-7 min-w-0 flex-1 cursor-pointer items-center gap-[2px]"
        >
          {Array.from({ length: BARS }, (_, i) => (
            <span
              key={i}
              className={`flex-1 rounded-full transition-colors ${(i + 0.5) / BARS <= played ? "bg-[#ff5e1a]" : "bg-[#d4d5de]"}`}
              style={{ height: `${24 + ((i * 53) % 76)}%` }}
            />
          ))}
        </span>
        <span className="shrink-0 text-[11px] tabular-nums text-[#6a6b7b]">
          {fmt(t)} / {fmt(total)}
        </span>
      </div>
      {unused && <p className="mt-1.5 text-[11px] text-[#6a6b7b]">{voice ? "Not on the timeline" : "Not in use"}</p>}
      <audio
        ref={ref}
        preload="metadata"
        onTimeUpdate={(e) => setT(startOf(idx) + e.currentTarget.currentTime)}
        onEnded={() => {
          /* 这一句放完接下一句;最后一句放完停在结尾 */
          if (idx + 1 < list.length) load(idx + 1, 0, true);
          else {
            setPlaying(false);
            setT(total);
          }
        }}
      />
    </div>
  );
}
