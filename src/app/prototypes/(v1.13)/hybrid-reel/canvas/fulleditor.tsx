"use client";

/* 全屏编辑:画布剪辑器节点里点 Full-screen edit 进来(参考真实产品的全屏剪辑)。
   和节点共用同一份工程、同一个播放头,关掉回到画布一切原样。 */

import { useRef, useState } from "react";
import {
  AudioLines,
  Download,
  Mic,
  Plus,
  Replace,
  Film,
  FolderOpen,
  Image as ImageIcon,
  Loader2,
  ZoomIn,
  ZoomOut,
  Music,
  Pause,
  Play,
  Scissors,
  Video as VideoIcon,
  Trash2,
  X,
} from "lucide-react";
import { Preview, type Player, type Scrub } from "./player";
import { PresetGrid } from "./subtitles";
import { AudioPanel } from "./audio";
import { NodeSettings } from "./settings";
import { Timeline, type EditApi, type PanelId, type SelectPart } from "./timeline";
import { SplitIcon } from "./icons";
import type { ClipMenuApi } from "./clipmenu";
import { Tip } from "./tip";
import { GenFill, PENDING_FILL, FIELD, FOCUS, IconBtn, Label, PanelHeader, Tabs } from "./ui";
import {
  IMAGE_HOLD_MAX,
  LIBRARY_IMAGES,
  LIBRARY_VIDEOS,
  clipLen,
  fmt,
  newId,
  type Asset,
  type Clip,
  type Project,
} from "./project";

export function FullEditor({
  project,
  edit,
  player,
  selectedId,
  selectedPart,
  onSelect,
  scrub,
  setScrub,
  panel,
  setPanel,
  onClose,
  onGenerate,
  onDeleteNode,
  onShotDuration,
  onExport,
  exportPct,
  clipMenu,
  onAutoSubtitle,
  onAddVoice,
  onVoiceClick,
  onSplit,
  onDelete,
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
  panel: PanelId | null;
  setPanel: (p: PanelId | null) => void;
  onClose: () => void;
  onGenerate: (assetId: string) => void;
  /** 删掉 AI 镜头节点(Video Settings 右上角的删除) */
  onDeleteNode: (assetId: string) => void;
  /** 改 AI 镜头时长 */
  onShotDuration: (assetId: string, sec: number) => void;
  onExport: () => void;
  /** 导出进度 0–100;null = 没在导出 */
  exportPct: number | null;
  clipMenu: ClipMenuApi;
  onAutoSubtitle: () => void;
  onAddVoice: () => void;
  onVoiceClick: (assetId: string) => void;
  onSplit: () => void;
  onDelete: () => void;
  cover: { src?: string; pending?: boolean };
  onCover: () => void;
  onCoverRemove: () => void;
}) {
  /* 进来默认 Fit:整条时间线刚好铺满屏幕宽度(全屏编辑铺满窗口,直接按窗口宽算) */
  const [pxPerSec, setPxPerSec] = useState(() => fitZoom(typeof window === "undefined" ? 1280 : window.innerWidth, player.total));
  const sectionRef = useRef<HTMLElement>(null);
  const clip = project.clips.find((c) => c.id === selectedId) ?? null;
  /* 左侧:素材 / 音频(点左侧工具栏切换)。右侧:跟着选中走 —— 选中片段显示片段设置(AI 镜头连同重生设置),选中字幕显示字幕设置 */
  const leftPanel = panel === "media" || panel === "audio" ? panel : null;
  const clipAsset = clip ? project.assets.find((a) => a.id === clip.assetId) : undefined;
  /* 选中字幕 → 字幕设置;选中 AI 镜头 → 它的生成设置;选中普通片段不出面板,片段操作走右键菜单 */
  const inspector = !selectedId ? null : selectedPart === "sub" ? "text" : clipAsset?.origin === "ai" ? "ai" : null;

  const toggle = (p: PanelId) => setPanel(panel === p ? null : p);
  const exporting = exportPct !== null;

  return (
    <div className="fixed inset-0 z-[150] flex flex-col bg-white text-[#1a1a2e]">
      {/* 分区不靠直线:外壳(顶栏 / 工具栏 / 时间线)统一白色;预览区是嵌进去的浅灰圆角「舞台」;
          侧边面板是带极浅描边的白色圆角卡片;区块之间留 8px */}
      {/* 顶栏 */}
      <header className="flex h-12 shrink-0 items-center gap-3 bg-white pl-4 pr-2.5">
        <span className="flex items-center gap-2 text-[14px] font-bold">
          <Scissors className="size-4" /> Video Editor
        </span>
        {/* 点了直接开始导出:按钮本身显示进度,完成后自动下载 */}
        <button
            type="button"
            onClick={onExport}
            disabled={exporting}
            aria-busy={exporting}
            className={`relative ml-auto flex h-8 min-w-[112px] items-center justify-center gap-1.5 overflow-hidden rounded-lg bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-3.5 text-[13px] font-semibold text-white transition hover:brightness-105 active:brightness-95 disabled:cursor-progress ${FOCUS} focus-visible:ring-offset-2`}
          >
            {exporting && (
              <span
                aria-hidden
                className="absolute inset-y-0 left-0 bg-white/25 transition-[width] duration-150 ease-out"
                style={{ width: `${exportPct}%` }}
              />
            )}
            <span className="relative flex items-center gap-1.5 tabular-nums">
              {exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
              {exporting ? `Exporting ${exportPct}%` : "Export"}
            </span>
          </button>
        {/* 退出全屏编辑,回到画布 */}
        <IconBtn label="Exit full screen" kbd="Esc" side="bottom" align="end" onClick={onClose}>
          <X className="size-[18px]" />
        </IconBtn>
      </header>

      <div className="flex min-h-0 flex-1 gap-2 pr-2">
        {/* 左侧工具 */}
        <nav aria-label="Editor tools" className="flex w-[68px] shrink-0 flex-col items-center gap-1 bg-white py-2">
          <RailBtn icon={FolderOpen} label="Media" active={panel === "media"} onClick={() => toggle("media")} />
          <RailBtn icon={Music} label="Audio" active={panel === "audio"} onClick={() => toggle("audio")} />
        </nav>
        {leftPanel === "media" && (
          <aside className="w-[320px] shrink-0 overflow-y-auto rounded-xl bg-white ring-1 ring-inset ring-[#eceef2] px-4 pb-4 pt-3 [scrollbar-width:thin] [scrollbar-color:#d9dae2_transparent]">
            {/* 画幅切换先不做:成片画幅按 brief 里的投放平台定 */}
            <MediaPanel project={project} edit={edit} clip={clip} onSelect={onSelect} onClose={() => setPanel(null)} />
          </aside>
        )}
        {leftPanel === "audio" && (
          <aside className="flex w-[320px] shrink-0 flex-col overflow-hidden rounded-xl bg-white ring-1 ring-inset ring-[#eceef2] px-4 pb-4 pt-3">
            <PanelHeader title="Audio" onClose={() => setPanel(null)} />
            <div className="min-h-0 flex-1">
              <AudioPanel project={project} edit={edit} player={player} onGenerate={onGenerate} />
            </div>
          </aside>
        )}

        {/* 预览 */}
        <main className="min-w-0 flex-1 rounded-xl bg-[#EDF1F3] p-6">
          <Preview
            project={project}
            player={player}
            scrub={scrub}
            dark={false}
            selectedId={selectedId}
            selectedPart={selectedPart}
            onSelect={onSelect}
            edit={edit}
            onGenerate={onGenerate}
          />
        </main>

        {/* 右侧设置:跟着选中弹出,取消选中就收起 */}
        {inspector && (
          <aside
            aria-label={inspector === "text" ? "Subtitle settings" : "Video settings"}
            className={`w-[320px] shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-inset ring-[#eceef2] ${
              inspector === "text" ? "overflow-y-auto px-4 pb-5 pt-3 [scrollbar-width:thin] [scrollbar-color:#d9dae2_transparent]" : ""
            }`}
          >
            {inspector === "text" ? (
              <TextPanel project={project} edit={edit} clip={clip} onClose={() => onSelect(null)} />
            ) : (
              clip &&
              clipAsset && (
                /* 和画布上点生成节点弹出的是同一个 Video Settings,改哪边两边同步 */
                <NodeSettings
                  embedded
                  key={clipAsset.id}
                  asset={clipAsset}
                  project={project}
                  edit={edit}
                  durationSec={clipLen(clip)}
                  onDuration={(sec) => onShotDuration(clipAsset.id, sec)}
                  onGenerate={() => onGenerate(clipAsset.id)}
                  onDelete={() => {
                    onDeleteNode(clipAsset.id);
                    onSelect(null);
                  }}
                  onClose={() => onSelect(null)}
                />
              )
            )}
          </aside>
        )}
      </div>

      {/* 时间线 */}
      <section ref={sectionRef} className="shrink-0 bg-white px-3 pb-3 pt-1">
        {/* 工具条和轨道之间一条细分割线,通栏 */}
        <div className="-mx-3 mb-1.5 grid h-11 grid-cols-[1fr_auto_1fr] items-center gap-1 border-b border-[#eceef2] px-3">
          <div className="flex items-center gap-0.5">
            <IconBtn label="Split at playhead" kbd="S" align="start" onClick={onSplit}>
              <SplitIcon className="size-4" />
            </IconBtn>
            <IconBtn
              label={selectedPart === "sub" ? "Delete subtitle" : "Delete clip"}
              tip={selectedId ? undefined : "Select a clip to delete"}
              kbd="⌫"
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
              className={`grid size-7 place-items-center rounded-full bg-[#1a1a2e] text-white transition hover:bg-[#2c2c44] active:scale-95 ${FOCUS} focus-visible:ring-offset-2`}
            >
              {player.playing ? <Pause className="size-3" fill="currentColor" /> : <Play className="ml-px size-3" fill="currentColor" />}
            </button>
            <span className="min-w-[88px] text-[12.5px] font-semibold tabular-nums">
              {fmt(player.t)} <span className="font-normal text-[#9a9bb0]">/ {fmt(player.total)}</span>
            </span>
          </div>
          <div className="flex items-center justify-end">
            <ZoomControl
              value={pxPerSec}
              onChange={setPxPerSec}
              onFit={() => setPxPerSec(fitZoom(sectionRef.current?.clientWidth ?? window.innerWidth, player.total))}
            />
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
          onScrub={setScrub}
          onAdd={() => setPanel("media")}
          onPanel={(p) => {
            /* 字幕轨图标:选中第一段有字幕的片段,右侧弹出字幕设置 */
            if (p === "text") {
              const first = project.clips.find((c) => c.subtitle);
              if (first) onSelect(first.id, "sub");
            } else setPanel(p);
          }}
          cover={cover}
          onCover={onCover}
          onCoverRemove={onCoverRemove}
          menu={clipMenu}
          onAutoSubtitle={onAutoSubtitle}
          onAddVoice={onAddVoice}
                onVoiceClick={onVoiceClick}
        />
      </section>
    </div>
  );
}

/* ── 时间线缩放 ──
   放大镜图标 + 细滑杆 + Fit。中性色,品牌橙只留给键盘聚焦框;和工具栏其它图标同一套尺寸与悬停态 */
const ZOOM_MIN = 12;
const ZOOM_MAX = 140;
const clampZoom = (v: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(v)));
/** 整条时间线刚好铺满:section 宽减去左右内边距、轨道头、封面格、轨道左内边距和末尾「+」 */
const fitZoom = (sectionW: number, total: number) => clampZoom((sectionW - 24 - 40 - 58 - 6 - 45 - 8) / Math.max(total, 1));

function ZoomControl({
  value,
  onChange,
  onFit,
}: {
  value: number;
  onChange: (v: number) => void;
  onFit: () => void;
}) {
  const pct = ((value - ZOOM_MIN) / (ZOOM_MAX - ZOOM_MIN)) * 100;
  return (
    <div className="flex items-center gap-0.5">
      <IconBtn label="Zoom out" onClick={() => onChange(clampZoom(value / 1.25))} disabled={value <= ZOOM_MIN}>
        <ZoomOut className="size-4" />
      </IconBtn>
      <input
        type="range"
        aria-label="Timeline zoom"
        min={ZOOM_MIN}
        max={ZOOM_MAX}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          background: `linear-gradient(to right, #6a6b7b 0%, #6a6b7b ${pct}%, #e3e4ea ${pct}%, #e3e4ea 100%)`,
        }}
        className="mx-1 h-[3px] w-24 cursor-pointer appearance-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40 focus-visible:ring-offset-4 [&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-[#c9cad4] [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-[#c9cad4] [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_1px_3px_rgba(26,26,46,0.22)] [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-150 hover:[&::-webkit-slider-thumb]:scale-[1.15] active:[&::-webkit-slider-thumb]:scale-[1.15]"
      />
      <IconBtn label="Zoom in" onClick={() => onChange(clampZoom(value * 1.25))} disabled={value >= ZOOM_MAX}>
        <ZoomIn className="size-4" />
      </IconBtn>
      <span className="mx-1 h-4 w-px bg-[#e6e7ec]" aria-hidden />
      <button
        type="button"
        onClick={onFit}
        className={`h-8 rounded-lg px-2 text-[12.5px] font-semibold text-[#4a4b5c] transition hover:bg-[#f3f4f6] hover:text-[#1a1a2e] active:bg-[#eceef2] ${FOCUS}`}
      >
        Fit
      </button>
    </div>
  );
}

/* ── 小组件 ── */
function RailBtn({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    /* 有文字标签,不再加悬停提示(提示只给纯图标按钮) */
    <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className={`flex w-14 flex-col items-center gap-1 rounded-lg py-2 text-[11px] font-semibold transition ${FOCUS} ${
          active ? "bg-[#fff1e8] text-[#ff5e1a]" : "text-[#6a6b7b] hover:bg-[#f3f4f6] hover:text-[#1a1a2e] active:bg-[#eceef2]"
        }`}
      >
        <Icon className="size-[18px]" />
        {label}
      </button>
  );
}

function NoClip() {
  return (
    <p className="rounded-xl border border-dashed border-[#d9dae2] p-4 text-[12.5px] text-[#6a6b7b]">
      Select a clip on the timeline first.
    </p>
  );
}

const patchClip = (p: Project, id: string, next: Partial<Clip>): Project => ({
  ...p,
  clips: p.clips.map((c) => (c.id === id ? { ...c, ...next } : c)),
});

function Thumb({ asset }: { asset: Asset }) {
  if (asset.kind === "audio") {
    return (
      <span className="grid size-full place-items-center bg-[#f1f2f5] text-[#6a6b7b]">
        {asset.status === "generating" ? <GenFill /> : asset.purpose === "voice" ? <Mic className="size-5" /> : <Music className="size-5" />}
      </span>
    );
  }
  if (asset.status === "ready" && asset.url) {
    return asset.kind === "image" ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={asset.url} alt="" className="size-full object-cover" />
    ) : (
      /* 大视频的首帧要等下载到才出来,先垫一个视频图标,不会是一块空白 */
      <span className="relative block size-full bg-[#e6e7ec]">
        <Film className="absolute left-1/2 top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 text-[#9a9bb0]" />
        <video src={`${asset.url}#t=0.1`} muted preload="metadata" crossOrigin="anonymous" className="relative size-full object-cover" />
      </span>
    );
  }
  return (
    <span className={`grid size-full place-items-center text-[#9a9bb0] ${PENDING_FILL}`}>
      {asset.status === "generating" ? <GenFill /> : <VideoIcon className="size-4" />}
    </span>
  );
}

/* ── 素材 ── */
function MediaPanel({
  project,
  edit,
  clip,
  onSelect,
  onClose,
}: {
  project: Project;
  edit: EditApi;
  clip: Clip | null;
  onSelect: (id: string | null) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"imported" | "library">("imported");
  const [kind, setKind] = useState<KindFilter>("all");
  /* Imported = 画布上连进剪辑器的全部素材,含 AI 配音 / 配乐 */
  const media = project.assets;

  /* 资产库里的条目:用固定 id,已经拉到画布上的就复用那个节点 */
  const library: Asset[] = [
    ...LIBRARY_VIDEOS.map((v, i) => ({ id: `lib-v${i}`, kind: "video" as const, label: v.label, url: v.src, aspect: 9 / 16, durationSec: 5 })),
    ...LIBRARY_IMAGES.map((v, i) => ({ id: `lib-i${i}`, kind: "image" as const, label: v.label, url: v.src, aspect: 1, durationSec: IMAGE_HOLD_MAX })),
  ].map((x) => project.assets.find((a) => a.id === x.id) ?? { ...x, origin: "upload" as const, status: "ready" as const, x: 0, y: 0 });

  /* 从资产库拿的素材先放上画布(连到剪辑器),再进时间线 —— 画布上始终能看到所有用到的素材 */
  const withAsset = (p: Project, a: Asset): Project =>
    p.assets.some((x) => x.id === a.id)
      ? p
      : { ...p, assets: [...p.assets, { ...a, x: p.editor.x - 320, y: p.editor.y + 40 * p.assets.length }] };

  const add = (a: Asset) => {
    /* 音频:配音放到配音轨最后,配乐设为背景音乐 */
    if (a.kind === "audio") {
      if (a.purpose === "voice") {
        edit.commit((p) => {
          const at = Math.max(0, ...(p.voice ?? []).map((v) => v.at + v.len));
          return { ...p, voice: [...(p.voice ?? []), { id: newId("v"), assetId: a.id, at, len: a.durationSec }] };
        });
      } else edit.commit((p) => ({ ...p, musicId: a.id }));
      return;
    }
    const id = newId("c");
    const len = a.kind === "video" ? Math.min(a.durationSec, 3) : 3;
    edit.commit((p) => ({
      ...withAsset(p, a),
      clips: [
        ...p.clips,
        {
          id,
          assetId: a.id,
          role: a.role ?? "usage",
          inSec: 0,
          outSec: len,
          speed: 1,
          muted: false,
          subtitle: "",
          subtitleSource: "authored",
        },
      ],
    }));
    onSelect(id);
  };
  const replace = (a: Asset) => {
    if (!clip) return;
    const len = clipLen(clip) * clip.speed;
    const maxOut = a.kind === "video" ? a.durationSec : IMAGE_HOLD_MAX;
    edit.commit((p) => patchClip(withAsset(p, a), clip.id, { assetId: a.id, inSec: 0, outSec: Math.min(len, maxOut), note: undefined }));
  };

  const pool = tab === "imported" ? media : library;
  const items = kind === "all" ? pool : pool.filter((a) => a.kind === kind);
  return (
    <div>
      <PanelHeader title="Media" onClose={onClose} />
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { id: "imported", label: "Imported" },
          /* 资产库:个人 + 团队资产都在这里 */
          { id: "library", label: "Assets" },
        ]}
      />
      <div role="radiogroup" aria-label="Filter by type" className="mb-3 mt-3 flex gap-1">
        {KINDS.map((k) => (
          <button
            key={k.id}
            type="button"
            role="radio"
            aria-checked={kind === k.id}
            onClick={() => setKind(k.id)}
            className={`rounded-full px-2.5 py-1 text-[12px] font-semibold transition ${FOCUS} ${
              kind === k.id ? "bg-[#1a1a2e] text-white" : "text-[#6a6b7b] hover:bg-[#f3f4f6] hover:text-[#1a1a2e]"
            }`}
          >
            {k.label}
          </button>
        ))}
      </div>
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#d9dae2] px-4 py-6 text-center text-[12.5px] text-[#6a6b7b]">
          {kind === "audio" ? "No audio yet" : kind === "image" ? "No images yet" : kind === "video" ? "No videos yet" : "Nothing here yet"}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-x-2.5 gap-y-3">
          {items.map((a) => {
            const onCanvas = tab === "library" && project.assets.some((x) => x.id === a.id);
            /* 选中片段正在用的素材:和时间线一样用橙色描边标出来 */
            const current = clip?.assetId === a.id;
            const canReplace = !!clip && !current && a.kind !== "audio";
            return (
              <div key={a.id} className="group">
                {/* 操作按钮放在裁切层外面,悬停提示才不会被缩略图的圆角裁掉 */}
                <div className="relative">
                  <div
                    className={`relative aspect-square overflow-hidden rounded-lg bg-[#eceef2] ring-inset transition ${
                      current ? "ring-2 ring-[#ff5e1a]" : "ring-1 ring-[#e6e7ec] group-hover:ring-[#c9cad4]"
                    }`}
                  >
                    <Thumb asset={a} />
                    <span className="absolute inset-0 bg-black/0 transition group-hover:bg-black/20" aria-hidden />
                    {(onCanvas || current) && (
                      <span className="absolute left-1.5 top-1.5 rounded-full bg-white/95 px-1.5 py-px text-[10px] font-semibold text-[#4a4b5c] shadow-sm">
                        {current ? "In selected clip" : "On canvas"}
                      </span>
                    )}
                  </div>
                  <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                    {canReplace && (
                      <Tip label="Replace selected clip" side="bottom" align="end">
                        <button
                          type="button"
                          aria-label="Replace selected clip"
                          onClick={() => replace(a)}
                          className={TILE_BTN}
                        >
                          <Replace className="size-3.5" />
                        </button>
                      </Tip>
                    )}
                    <Tip label={a.kind === "audio" ? (a.purpose === "voice" ? "Add to voiceover track" : "Use as music") : "Add to end of timeline"} side="bottom" align="end">
                      <button type="button" aria-label="Add to timeline" onClick={() => add(a)} className={TILE_BTN}>
                        <Plus className="size-4" />
                      </button>
                    </Tip>
                  </div>
                </div>
                <p className="mt-1.5 flex items-center gap-1 truncate text-[11.5px] text-[#4a4b5c]" title={a.label}>
                  {a.kind === "audio" ? (
                    <AudioLines className="size-3 shrink-0 text-[#9a9bb0]" />
                  ) : a.origin === "ai" ? (
                    <VideoIcon className="size-3 shrink-0 text-[#9a9bb0]" />
                  ) : a.kind === "image" ? (
                    <ImageIcon className="size-3 shrink-0 text-[#9a9bb0]" />
                  ) : (
                    <Film className="size-3 shrink-0 text-[#9a9bb0]" />
                  )}
                  <span className="truncate">{a.label}</span>
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const KINDS = [
  { id: "all", label: "All" },
  { id: "image", label: "Images" },
  { id: "video", label: "Videos" },
  { id: "audio", label: "Audio" },
] as const;
type KindFilter = (typeof KINDS)[number]["id"];

const TILE_BTN = `grid size-7 place-items-center rounded-md bg-white text-[#1a1a2e] shadow-[0_1px_3px_rgba(26,26,46,0.18)] transition hover:bg-[#f3f4f6] ${FOCUS}`;

/* ── 字幕 ── */
function TextPanel({ project, edit, clip, onClose }: { project: Project; edit: EditApi; clip: Clip | null; onClose: () => void }) {
  const began = useRef(false);
  return (
    <div>
      <PanelHeader title="Subtitles" hint="Fix typos and wording per clip." onClose={onClose} closeLabel="Deselect subtitle" />
      {clip ? (
        <>
          <Label
            aside={
              <span className="rounded-full bg-[#f1f2f5] px-2 py-0.5 text-[10.5px] font-semibold text-[#6a6b7b]">
                {clip.subtitleSource === "stt" ? "From original voice" : "Written"}
              </span>
            }
          >
            This clip
          </Label>
          <textarea
            aria-label="Subtitle text"
            rows={3}
            value={clip.subtitle}
            onFocus={() => (began.current = false)}
            onChange={(e) => {
              if (!began.current) {
                edit.begin();
                began.current = true;
              }
              const text = e.target.value;
              edit.update((p) => patchClip(p, clip.id, { subtitle: text }));
            }}
            placeholder="No subtitle on this clip"
            className={`${FIELD} resize-none rounded-xl px-3 py-2.5 text-[13.5px]`}
          />
        </>
      ) : (
        <NoClip />
      )}

      <Label
        aside={
          project.subtitlePos && (
            <button
              type="button"
              onClick={() => edit.commit((p) => ({ ...p, subtitlePos: undefined }))}
              className="text-[11.5px] font-semibold text-[#ff5e1a] hover:underline"
            >
              Reset position
            </button>
          )
        }
      >
        Style
      </Label>
      <p className="-mt-1 mb-2 text-[11.5px] text-[#6a6b7b]">
        Applies to every subtitle in the reel. Drag a subtitle in the preview to move them all.
      </p>
      <PresetGrid compact value={project.subtitleStyle} onPick={(id) => edit.commit((p) => ({ ...p, subtitleStyle: id }))} />
    </div>
  );
}
