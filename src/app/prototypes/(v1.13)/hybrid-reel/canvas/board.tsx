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
  XCircle,
  FolderOpen,
  Music,
  UserRound,
  ImagePlus,
  SquarePlay,
} from "lucide-react";
import { Preview, UploadEmpty, type Player, type Scrub } from "./player";
import { IDENTITY_META } from "../agent/chat/types";
import { FOCUS_EDITOR_EVENT } from "../agent/chat/guides";
import { DELETE_LABEL, Timeline, type EditApi, type PanelId, type SelectPart } from "./timeline";
import { RailBtn } from "./fulleditor";
import { SplitIcon } from "./icons";
import { Tip } from "./tip";
import { GenFill, MOD, SHIFT } from "./ui";
import type { ClipMenuApi } from "./clipmenu";
import { EDITOR_W, LABEL_H, aiRefs, fmt, layoutClips, musicClips, nodeSize, sliceAssetIds, sliceOf, voiceAt, type Asset, type Project } from "./project";

const PREVIEW_H = 440;
const PORT_Y = LABEL_H + PREVIEW_H / 2;
/* 预览 + 工具条 + 四条轨(字幕 / 画面 / 音频 / 音乐) */
const EDITOR_H = LABEL_H + PREVIEW_H + 262;

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
  onPanel,
  canvasPanel,
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
  onActivateEditor,
  onAddNode,
  onUploadFiles,
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
  /** 节点失败态的 Retry:2026-10-16 起节点上不放 Retry 按钮,参数留着不用 */
  onRetry?: (assetId: string) => void;
  onOpenFull: (panel?: PanelId) => void;
  /** 剪辑器节点左侧的 Media / Audio,以及轨道头、空轨入口、右键「Change music」等:在画布上打开对应面板,不进全屏 */
  /** toggle = 左侧 Media / Audio 按钮:再点一次收起;轨道上的入口只打开 */
  onPanel: (panel: PanelId, toggle?: boolean) => void;
  /** 画布上当前打开的左侧面板(Media / Audio),节点左侧对应按钮高亮 */
  canvasPanel: PanelId | null;
  onExport: () => void;
  exportPct?: number | null;
  clipMenu?: ClipMenuApi;
  onAutoSubtitle?: () => void;
  onAddVoice?: () => void;
  onAddCard?: (at?: number) => void;
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
  /** 节点「+」→ Video Editor:新建一个剪辑器,把这个节点放进去 */
  onUseInEditor: (assetId: string) => void;
  /** 点停放着的剪辑器小卡:切到那个剪辑器 */
  onActivateEditor: (id: string) => void;
  /** 双击画布空白处 → Add Node 菜单选了一项;at = 画布坐标(新节点放这里) */
  onAddNode: (kind: AddNodeKind, at: { x: number; y: number }) => void;
  /** 剪辑器还没有片段时,预览区的上传(点加号 / 拖文件进来) */
  onUploadFiles?: (files: File[]) => void;
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
      ...(project.parked ?? []).map((e) => ({ x: e.editor.x, y: e.editor.y, w: EDITOR_W, h: EDITOR_H })),
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

  /* 进画布的默认视角:100% 缩放,剪辑器节点居中(2026-10-16 Monica 定);左下角 Fit 才缩到装下全部节点 */
  const home = useCallback(() => {
    const box = boxRef.current;
    if (!box) return;
    const top = 76;
    const pad = 24;
    setView({
      k: 1,
      x: box.clientWidth / 2 - (project.editor.x + EDITOR_W / 2),
      y: Math.max(top, top + (box.clientHeight - top - pad - EDITOR_H) / 2) - project.editor.y,
    });
  }, [project.editor.x, project.editor.y]);

  const fitted = useRef(false);
  useLayoutEffect(() => {
    if (fitted.current) return;
    fitted.current = true;
    home();
  }, [home]);

  /* 自动排版期间(素材尺寸刚读出来,剪辑器位置会变)跟着重新摆一次默认视角 */
  const layoutKey = project.autoLayout ? project.assets.map((a) => `${a.id}:${a.aspect.toFixed(2)}`).join("|") : "";
  useEffect(() => {
    if (project.autoLayout) home();
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
  /* 双击画布空白处:在鼠标位置弹 Add Node 菜单(同 BuzzVideo 画布) */
  const [addMenu, setAddMenu] = useState<{ sx: number; sy: number; at: { x: number; y: number } } | null>(null);
  const onBgDouble = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return;
    const r = boxRef.current?.getBoundingClientRect();
    if (!r) return;
    const sx = e.clientX - r.left;
    const sy = e.clientY - r.top;
    const v = viewRef.current;
    setAddMenu({ sx: Math.min(sx, r.width - 236), sy: Math.min(sy, r.height - 470), at: { x: (sx - v.x) / v.k, y: (sy - v.y) / v.k } });
  };

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
    const parkedNode = project.parked?.find((x) => x.id === id);
    const origin =
      id === "editor" ? project.editor : parkedNode ? parkedNode.editor : (project.assets.find((a) => a.id === id) ?? { x: 0, y: 0 });
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
          : parkedNode
            ? { ...p, autoLayout: false, parked: (p.parked ?? []).map((x) => (x.id === id ? { ...x, editor: { x: start.ox + dx, y: start.oy + dy } } : x)) }
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
      /* 没拖动就是点击:停放的剪辑器切过去;生成节点顺带打开 Settings */
      if (!began && parkedNode) {
        focusNext.current = true;
        setPicked("editor");
        onActivateEditor(id);
      }
      else if (!began && id !== "editor") onNodeClick(id);
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

  /* 节点「+」→ Video Editor 之后,把视角移到剪辑器节点上;zoomIn = 同时放大到剪辑器节点占满大半个画布(操作引导开始时用) */
  const focusEditor = (zoomIn = false) => {
    const box = boxRef.current;
    if (!box) return;
    const v = viewRef.current;
    /* 引导时左边留出字幕 / 字卡设置面板(~376),右边留出引导小窗(~330);节点设置(配音 / 音乐)在右侧时小窗自动挪到上下 */
    const k = zoomIn ? Math.min(1, (box.clientHeight * 0.82) / EDITOR_H, (box.clientWidth - 376 - 330 - 48) / EDITOR_W) : v.k;
    const cx = zoomIn ? 376 + (EDITOR_W * k) / 2 : box.clientWidth / 2;
    setView({ k, x: cx - (project.editor.x + EDITOR_W / 2) * k, y: box.clientHeight / 2 - (project.editor.y + EDITOR_H / 2) * k });
  };
  const focusRef = useRef(focusEditor);
  focusRef.current = focusEditor;
  /* 节点「+」→ Video Editor 新建了剪辑器 / 点小卡切了剪辑器:换上来之后把视角挪过去 */
  const focusNext = useRef(false);
  useEffect(() => {
    if (!focusNext.current) return;
    focusNext.current = false;
    focusRef.current();
  }, [project.editorId]);
  /* 操作引导挪视角:"editor" 拉近剪辑器节点;"node" 移到第一个节点、选中它(露出「+」),剪辑器留在视野里 */
  const focusNodeRef = useRef(() => {});
  focusNodeRef.current = () => {
    const box = boxRef.current;
    const a = project.assets[0];
    if (!box || !a) return;
    const s = nodeSize(a);
    const k = Math.min(0.9, (box.clientHeight * 0.5) / (s.h + LABEL_H));
    setView({ k, x: box.clientWidth * 0.3 - (a.x + s.w / 2) * k, y: box.clientHeight / 2 - (a.y + LABEL_H + s.h / 2) * k });
    setPicked(a.id);
  };
  /** 操作引导讲预览那一步:字幕和字卡都演示成选中状态(露出选中框和缩放把手) */
  const [tourPreview, setTourPreview] = useState(false);
  useEffect(() => {
    const on = (e: Event) => {
      const target = (e as CustomEvent).detail as string | null;
      setTourPreview(target === "preview");
      if (target === null) return;
      if (target === "node") focusNodeRef.current();
      else {
        setPicked(null);
        focusRef.current(true);
      }
    };
    window.addEventListener(FOCUS_EDITOR_EVENT, on);
    return () => window.removeEventListener(FOCUS_EDITOR_EVENT, on);
  }, []);

  /* 输入接口画在节点外侧,不压住编辑器边框 */
  /* 连线直接接到剪辑器节点左边框(不画「+」输入口) */
  const inPort = { x: project.editor.x, y: project.editor.y + PORT_Y };
  const multi = (project.parked?.length ?? 0) > 0;
  const activeUses = multi ? sliceAssetIds(sliceOf(project)) : new Set<string>();
  const parkedUses = new Map((project.parked ?? []).map((e) => [e.id, sliceAssetIds(e.slice)]));
  /* 短片刚好铺满节点;素材多、片子长时不再无限压缩,最小 24px/秒,超出的部分左右滑动查看 */
  const pxPerSec = Math.min(80, Math.max(24, (EDITOR_W - 40 - 58 - 16 - 14 - 45 - 4) / Math.max(player.total, 1)));

  return (
    <div
      ref={boxRef}
      onPointerDown={onBgDown}
      onDoubleClick={onBgDouble}
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
              /* 只有一个剪辑器:所有节点都连到它(原样);有多个:每个剪辑器只连它时间线上用到的节点 */
              const ports = multi
                ? [
                    ...(activeUses.has(a.id) ? [{ id: "editor", ...inPort }] : []),
                    ...(project.parked ?? []).filter((e) => parkedUses.get(e.id)?.has(a.id)).map((e) => ({ id: e.id, x: e.editor.x, y: e.editor.y + PORT_Y })),
                  ]
                : [{ id: "editor", ...inPort }];
              for (const port of ports) {
                const c = Math.max(70, (port.x - x1) / 2);
                edges.push({
                  key: `${a.id}-${port.id}`,
                  d: `M${x1} ${y1} C ${x1 + c} ${y1}, ${port.x - c} ${port.y}, ${port.x} ${port.y}`,
                  hot: active === a.id || active === port.id,
                });
              }
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

        {project.assets.map((a, i) => (
          <AssetNode
            key={a.id}
            guide={i === 0}
            asset={a}
            project={project}
            highlighted={active === a.id || selectedClip?.assetId === a.id || settingsId === a.id}
            onPointerDown={(e) => dragNode(e, a.id)}
            zoom={view.k}
            onUseInEditor={() => {
              onUseInEditor(a.id);
              setPicked("editor");
              /* 新剪辑器下一帧才有位置:等 editorId 变了再把视角挪过去 */
              focusNext.current = true;
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

        {/* 其他剪辑器:和当前剪辑器一样是完整的剪辑器节点(预览 + 工具栏 + 时间线),只是静止、不能直接操作;
            点一下(或拖动)就切到它,当前这个换成静止的 */}
        {(project.parked ?? []).map((e) => {
          const vp = { ...project, ...e.slice, editor: e.editor } as Project;
          const lay = layoutClips(vp.clips);
          const still = { t: 0, playing: false, total: lay.total, segs: lay.segs, seek: () => {}, toggle: () => {}, setPlaying: () => {} } as unknown as Player;
          const noop = () => {};
          return (
            <div key={e.id} className="pointer-events-auto absolute" style={{ left: e.editor.x, top: e.editor.y, width: EDITOR_W }}>
              <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#6a6b7b]" style={{ height: LABEL_H }}>
                <Scissors className="size-3.5" />
                <span className="font-semibold text-[#1a1a2e]">{e.name}</span>
              </div>
              <div className={`relative overflow-hidden rounded-xl border bg-white shadow-[0_12px_36px_rgba(26,26,46,0.08)] ${picked === e.id ? "border-[#ff5e1a] ring-1 ring-[#ff5e1a]" : "border-[#ececf1]"}`}>
                <div className="flex" style={{ height: PREVIEW_H }}>
                  <div className="flex w-[68px] shrink-0 flex-col items-center gap-1 bg-white py-2">
                    <RailBtn icon={FolderOpen} label="Media" active={false} onClick={noop} />
                    <RailBtn icon={Music} label="Audio" active={false} onClick={noop} />
                  </div>
                  <div className="my-2 mr-2 min-w-0 flex-1 rounded-xl bg-[#EDF1F3] p-3">
                    <Preview project={vp} player={still} scrub={null} dark={false} selectedId={null} onSelect={noop} edit={edit} onGenerate={noop} />
                  </div>
                </div>
                <div className="px-2 pb-2">
                  <div className="-mx-2 mb-1 grid h-11 grid-cols-[1fr_auto_1fr] items-center gap-1 border-b border-[#eceef2] px-3 text-[#b3b4c0]">
                    <div className="flex items-center gap-3 pl-1.5">
                      <Undo2 className="size-4" />
                      <Redo2 className="size-4" />
                      <SplitIcon className="size-4" />
                      <Trash2 className="size-4" />
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="grid size-[26px] place-items-center rounded-full bg-[#1a1a2e] text-white">
                        <Play className="ml-px size-3" fill="currentColor" />
                      </span>
                      <span className="text-[13px] font-semibold tabular-nums text-[#1a1a2e]">
                        {fmt(0)} <span className="font-normal text-[#6a6b7b]">/ {fmt(lay.total)}</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-end gap-3 pr-1.5 text-[13px] font-semibold text-[#4a4b5c]">
                      <Download className="size-4 text-[#b3b4c0]" />
                      <span className="flex items-center gap-1.5">
                        <Maximize2 className="size-3.5" /> Full-screen edit
                      </span>
                    </div>
                  </div>
                  <Timeline project={vp} player={still} edit={edit} selectedId={null} onSelect={noop} pxPerSec={pxPerSec} compact onScrub={noop} onAdd={noop} cover={{}} />
                </div>
                {/* 整个节点盖一层:点 = 切到这个剪辑器,拖 = 挪位置;里面的控件不响应 */}
                <div
                  role="button"
                  tabIndex={0}
                  aria-label={`Open ${e.name}`}
                  title="Click to edit this video"
                  onPointerDown={(ev) => dragNode(ev, e.id)}
                  className="absolute inset-0 z-10 cursor-pointer transition hover:bg-white/10"
                />
              </div>
            </div>
          );
        })}

        {/* 剪辑器节点 */}
        <div
          data-guide="editor"
          className="pointer-events-auto absolute"
          style={{ left: project.editor.x, top: project.editor.y, width: EDITOR_W }}
        >
          <div
            onPointerDown={(e) => dragNode(e, "editor")}
            className="flex cursor-grab items-center gap-1.5 text-[12px] font-medium text-[#6a6b7b] active:cursor-grabbing"
            style={{ height: LABEL_H }}
          >
            <Scissors className="size-3.5" />
            <span className="font-semibold text-[#1a1a2e]">{project.editorName ?? "Video Editor"}</span>
          </div>


          <div
            className={`overflow-hidden rounded-xl border bg-white shadow-[0_12px_36px_rgba(26,26,46,0.08)] ${
              picked === "editor" ? "border-[#ff5e1a] ring-1 ring-[#ff5e1a]" : "border-[#ececf1]"
            }`}
          >
            <div className="flex" style={{ height: PREVIEW_H }}>
              {/* 左侧 Media / Audio:和全屏编辑同一组入口,在画布上打开面板(不进全屏) */}
              <nav aria-label="Editor tools" data-guide="rail" data-nodrag className="flex w-[68px] shrink-0 flex-col items-center gap-1 bg-white py-2">
                <RailBtn icon={FolderOpen} label="Media" active={canvasPanel === "media"} onClick={() => onPanel("media", true)} />
                <RailBtn icon={Music} label="Audio" active={canvasPanel === "audio" || canvasPanel === "sfx"} onClick={() => onPanel("audio", true)} />
              </nav>
              <div className="my-2 mr-2 min-w-0 flex-1 rounded-xl bg-[#EDF1F3] p-3" data-preview data-guide="preview">
                {fullOpen ? (
                  <div className="grid size-full place-items-center text-[12px] text-[#6a6b7b]">Editing in full screen…</div>
                ) : project.clips.length === 0 && onUploadFiles ? (
                  <UploadEmpty onFiles={onUploadFiles} />
                ) : (
                  <Preview project={project} player={player} scrub={scrub} dark={false} selectedId={selectedId} selectedPart={selectedPart} onSelect={selectInEditor} edit={edit} onGenerate={onGenerate} demoSelected={tourPreview} />
                )}
              </div>
            </div>

            <div className="px-2 pb-2" data-nodrag data-guide="timeline">
              {/* 三栏:播放控件固定在节点正中,左右两组各自靠边,宽度不同也不会把中间挤偏 */}
              <div className="-mx-2 mb-1 grid h-11 grid-cols-[1fr_auto_1fr] items-center gap-1 border-b border-[#eceef2] px-3">
                <div data-guide="tools" className="flex w-max items-center gap-1">
                {/* 撤销 / 重做:放在分割前面,和 ⌘Z / ⇧⌘Z 同一套 */}
                <IconBtn label="Undo" kbd={`${MOD}Z`} align="start" onClick={onUndo} disabled={!canUndo}>
                  <Undo2 className="size-4" />
                </IconBtn>
                <IconBtn label="Redo" kbd={`${SHIFT}${MOD}Z`} onClick={onRedo} disabled={!canRedo}>
                  <Redo2 className="size-4" />
                </IconBtn>
                <IconBtn label="Split at playhead" tip={project.clips.length ? "Split at playhead" : "Add footage first"} kbd={project.clips.length ? "S" : undefined} align="start" onClick={onSplit} disabled={!project.clips.length}>
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
                    disabled={!project.clips.length}
                    aria-label={player.playing ? "Pause" : "Play"}
                    className="grid size-[26px] place-items-center rounded-full bg-[#1a1a2e] text-white transition hover:scale-105 disabled:opacity-30 disabled:hover:scale-100"
                  >
                    {player.playing ? <Pause className="size-3" fill="currentColor" /> : <Play className="ml-px size-3" fill="currentColor" />}
                  </button>
                  <span className="text-[13px] font-semibold tabular-nums text-[#1a1a2e]">
                    {fmt(player.t)} <span className="font-normal text-[#6a6b7b]">/ {fmt(player.total)}</span>
                  </span>
                </div>
                {/* 一键生成全部 AI 镜头的入口先去掉,之后放到别处 */}
                <div className="flex items-center justify-end">
                {/* 导出 + 全屏编辑:操作引导最后一步高亮这一组 */}
                <div data-guide="fullscreen" className="flex items-center gap-1">
                <IconBtn
                  label="Export"
                  tip={exportPct !== null ? `Exporting ${exportPct}%` : project.clips.length ? "Export MP4 · 1080p" : "Add footage first"}
                  onClick={onExport}
                  disabled={!project.clips.length}
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
                onAdd={() => onPanel("media")}
                onPanel={onPanel}
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

      {/* Add Node 菜单:上传三项、数字人、生成两项,最后是剪辑器 */}
      {addMenu && (
        <>
          <div className="absolute inset-0 z-30" onPointerDown={() => setAddMenu(null)} />
          <div
            role="menu"
            aria-label="Add Node"
            className="absolute z-40 w-[220px] rounded-2xl bg-white p-2 shadow-[0_16px_40px_rgba(26,26,46,0.16)] ring-1 ring-[#ececf1]"
            style={{ left: Math.max(8, addMenu.sx), top: Math.max(8, addMenu.sy) }}
          >
            <p className="px-2.5 pb-1.5 pt-1 text-[13px] text-[#6a6b7b]">Add Node</p>
            {ADD_NODE_ITEMS.map(({ kind, label, Icon, boxed }) => (
              <button
                key={kind}
                type="button"
                role="menuitem"
                onClick={() => {
                  /* 新建剪辑器:换上来之后把视角挪过去(和节点「+」→ Video Editor 一样) */
                  if (kind === "video-editor") {
                    focusNext.current = true;
                    setPicked("editor");
                  }
                  onAddNode(kind, addMenu.at);
                  setAddMenu(null);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-1.5 py-1.5 text-left text-[14px] font-medium text-[#1a1a2e] transition hover:bg-[#f5f5f7]"
              >
                <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${boxed ? "bg-[#f3f3f5] text-[#4a4b5c]" : "text-[#1a1a2e]"}`}>
                  <Icon className="size-[18px]" />
                </span>
                {label}
              </button>
            ))}
          </div>
        </>
      )}

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
  guide = false,
}: {
  /** 剪辑器引导第 3 步指着它(画布上第一个节点) */
  guide?: boolean;
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
  /* 失败态(spec §3):AI 节点上一次生成失败、现在没在跑 */
  const failed = a.origin === "ai" && !!a.error && a.status !== "generating";
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
      data-guide={guide ? "node" : undefined}
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
        {failed && !(a.status === "ready" && a.url) ? (
          <FailedBody error={a.error!} icon={a.kind !== "audio"} />
        ) : a.kind === "audio" ? (
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
        {/* 重生失败但留着上一版结果:结果照常显示,底部一条失败提示(重新生成去 Settings 里点 Generate) */}
        {failed && a.status === "ready" && a.url && (
          <div className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 bg-[#fff5f4]/95 px-2.5 py-1.5 text-[12px] font-semibold text-[#d0342c] ring-1 ring-inset ring-[#f3c4c0]" title={a.error}>
            <XCircle className="size-3.5 shrink-0" />
            <span className="truncate">Generation failed</span>
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

/* 节点失败态:红色「Generation failed」+ 原因(2026-10-16 起节点上不放 Retry,重新生成去 Settings;音频节点不放红叉图标) */
function FailedBody({ error, icon = true }: { error: string; icon?: boolean }) {
  return (
    <div role="alert" className="flex size-full flex-col items-center justify-center gap-1 bg-[#fff5f4] px-4 text-center">
      {icon && <XCircle className="size-6 text-[#d0342c]" strokeWidth={1.8} />}
      <p className="mt-1 text-[13px] font-semibold text-[#d0342c]">Generation failed</p>
      <p className="line-clamp-2 text-[11px] leading-snug text-[#8a3a33]" title={error}>
        {error}
      </p>
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
  const unused = voice ? !(project.voice ?? []).some((v) => v.assetId === a.id) : a.purpose === "sfx" ? !(project.sfx ?? []).some((c) => c.assetId === a.id) : !musicClips(project).some((m) => m.src === a.id);
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

/** Add Node 菜单里的一项 */
export type AddNodeKind = "upload-image" | "upload-video" | "upload-audio" | "avatar" | "gen-image" | "gen-video" | "video-editor";
const ADD_NODE_ITEMS: { kind: AddNodeKind; label: string; Icon: typeof Scissors; boxed?: boolean }[] = [
  { kind: "upload-image", label: "Upload Image", Icon: ImageIcon, boxed: true },
  { kind: "upload-video", label: "Upload Video", Icon: Video, boxed: true },
  { kind: "upload-audio", label: "Upload Audio", Icon: Music, boxed: true },
  { kind: "avatar", label: "Select Avatar", Icon: UserRound, boxed: true },
  { kind: "gen-image", label: "Generate Image", Icon: ImagePlus },
  { kind: "gen-video", label: "Generate Video", Icon: SquarePlay },
  { kind: "video-editor", label: "Video Editor", Icon: Scissors },
];
