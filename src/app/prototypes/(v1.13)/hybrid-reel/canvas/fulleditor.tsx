"use client";

/* 全屏编辑:画布剪辑器节点里点 Full-screen edit 进来(参考真实产品的全屏剪辑)。
   和节点共用同一份工程、同一个播放头,关掉回到画布一切原样。 */

import { useRef, useState } from "react";
import {
  AudioLines,
  Ban,
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
  Redo2,
  Undo2,
} from "lucide-react";
import { Preview, type Player, type Scrub } from "./player";
import { SUBTITLE_PRESETS, SubtitleText, subtitlePreset } from "./subtitles";
import { CARD_STYLES, CardText } from "./cards";
import { DropdownSelect } from "@/components/ui/dropdown-select";
import { MOTION_LABEL, SOUND_META, type CardAnim, type CardPos, type Motion } from "../agent/chat/types";
import { AudioSettings, NodeSettings } from "./settings";
import { DELETE_LABEL, Timeline, type EditApi, type PanelId, type SelectPart } from "./timeline";
import { SplitIcon } from "./icons";
import type { ClipMenuApi } from "./clipmenu";
import { Tip } from "./tip";
import { GenFill, PENDING_FILL, FIELD, FOCUS, IconBtn, Label, PanelHeader, Segmented, StyleTiles, Tabs, Toggle, MOD, SHIFT } from "./ui";
import { AudioPanel, SlimRange } from "./audio";
import {
  IMAGE_HOLD_MAX,
  LIBRARY_IMAGES,
  LIBRARY_VIDEOS,
  clipLen,
  fmt,
  newId,
  unusedTakes,
  type Asset,
  type Clip,
  type Project,
  type TextCard,
  resolveFraming,
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
  pending,
  onGenerateAll,
  clipMenu,
  onAutoSubtitle,
  onAddVoice,
  onAddCard,
  onVoiceClick,
  onGenerateVoice,
  onSplit,
  onUploadAudio,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
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
  /** 时间线上还没生成的 AI 镜头(几个、几个在生成、全部生成要多少积分) */
  pending: { count: number; running: number; cost: number };
  onGenerateAll: () => void;
  clipMenu: ClipMenuApi;
  onAutoSubtitle: () => void;
  onAddVoice: () => void;
  onAddCard?: () => void;
  onVoiceClick: (assetId: string) => void;
  /** 配音生成(和配乐、视频的生成是两条路) */
  onGenerateVoice: (assetId: string) => void;
  onSplit: () => void;
  /** 音频面板里上传自己的音乐 / 音效 */
  onUploadAudio: (file: File, as: "music" | "sfx") => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
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
  const leftPanel = panel === "media" ? "media" : panel === "audio" || panel === "sfx" ? "audio" : null;
  const clipAsset = clip ? project.assets.find((a) => a.id === clip.assetId) : undefined;
  /* 选中音频轨上的一段配音 / 音乐轨上的 AI 配乐:右侧就地出它的 Audio Settings,不跳回画布 */
  const voiceClip = selectedPart === "voice" ? (project.voice ?? []).find((v) => v.id === selectedId) : undefined;
  const voiceAsset = voiceClip
    ? project.assets.find((a) => a.id === voiceClip.assetId)
    : selectedPart === "music"
      ? project.assets.find((a) => a.id === selectedId && a.kind === "audio" && a.origin === "ai")
      : undefined;
  /* 选中字幕 → 字幕设置;选中 AI 镜头 → 它的生成设置;选中实拍片段 → 片段属性 */
  /* 选中实拍素材(上传的视频 / 图片)→ 片段属性:音量、画面适配、换素材 */
  const inspector = !selectedId
    ? null
    : selectedPart === "sub"
      ? "text"
      : selectedPart === "card"
        ? project.cards?.some((c) => c.id === selectedId)
          ? "card"
          : null
      : selectedPart === "voice" || selectedPart === "music"
        ? voiceAsset
          ? "voice"
          : null
      : selectedPart !== "clip"
        ? null
        : clipAsset?.origin === "ai"
          ? "ai"
          : clip && clipAsset
            ? "clip"
            : null;

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
        {/* 还有 AI 镜头没生成:导出按钮左边一条提醒,一键全部生成,花多少写清楚 */}
        {pending.count > 0 && (
          <div role="status" className="ml-auto flex h-8 items-center gap-2 rounded-lg bg-[#fff6ec] pl-3 pr-1 text-[13px] text-[#9a4a09] ring-1 ring-inset ring-[#f6d3ad]">
            <VideoIcon className="size-3.5 shrink-0" />
            <span>
              {pending.count} AI {pending.count === 1 ? "shot" : "shots"} not generated
              {pending.running > 0 && ` · ${pending.running} generating`}
            </span>
            {pending.count > pending.running && (
              <button
                type="button"
                onClick={onGenerateAll}
                className="flex h-6 items-center gap-1 rounded-md bg-white px-2 font-semibold text-[#1a1a2e] shadow-[0_1px_2px_rgba(26,26,46,0.08)] transition hover:bg-[#fffaf5]"
              >
                Generate all
                <span className="flex items-center gap-1 tabular-nums text-[#6a6b7b]">
                  <span className="size-2 rounded-full bg-[#ff7a36]" /> {pending.cost}
                </span>
              </button>
            )}
          </div>
        )}
        {/* 点了直接开始导出:按钮本身显示进度,完成后自动下载 */}
        <button
            type="button"
            onClick={onExport}
            disabled={exporting}
            aria-busy={exporting}
            className={`relative ${pending.count > 0 ? "" : "ml-auto"} flex h-8 min-w-[112px] items-center justify-center gap-1.5 overflow-hidden rounded-lg bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-3.5 text-[13px] font-semibold text-white transition hover:brightness-105 active:brightness-95 disabled:cursor-progress ${FOCUS} focus-visible:ring-offset-2`}
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
          <RailBtn icon={Music} label="Audio" active={panel === "audio" || panel === "sfx"} onClick={() => (panel === "sfx" ? setPanel(null) : toggle("audio"))} />
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
              <AudioPanel key={panel ?? ""} initialTab={panel === "sfx" ? "sfx" : "music"} project={project} edit={edit} player={player} onGenerate={onGenerate} onUpload={onUploadAudio} />
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
            aria-label={inspector === "voice" ? (voiceAsset?.purpose === "voice" ? "Voiceover settings" : "Music settings") : inspector === "text" ? "Subtitle settings" : inspector === "card" ? "Text settings" : inspector === "clip" ? "Clip settings" : "Video settings"}
            className={`w-[320px] shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-inset ring-[#eceef2] ${
              inspector === "text" || inspector === "clip" || inspector === "card" ? "overflow-y-auto px-4 pb-5 pt-3 [scrollbar-width:thin] [scrollbar-color:#d9dae2_transparent]" : ""
            }`}
          >
            {inspector === "voice" && voiceAsset ? (
              <AudioSettings
                embedded
                key={voiceAsset.id}
                asset={voiceAsset}
                project={project}
                edit={edit}
                onGenerate={() => (voiceAsset.purpose === "voice" ? onGenerateVoice(voiceAsset.id) : onGenerate(voiceAsset.id))}
                onDelete={() => {
                  onDeleteNode(voiceAsset.id);
                  onSelect(null);
                }}
                onClose={() => onSelect(null)}
              />
            ) : inspector === "card" ? (
              <CardPanel key={selectedId} project={project} edit={edit} cardId={selectedId!} onClose={() => onSelect(null)} />
            ) : inspector === "text" ? (
              <SubtitlePanel project={project} edit={edit} clip={clip} onClose={() => onSelect(null)} />
            ) : inspector === "clip" && clip && clipAsset ? (
              <ClipPanel project={project} edit={edit} clip={clip} asset={clipAsset} onReplace={() => setPanel("media")} onClose={() => onSelect(null)} />
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
            {/* 撤销 / 重做:放在分割前面,和 ⌘Z / ⇧⌘Z 同一套 */}
            <IconBtn label="Undo" kbd={`${MOD}Z`} align="start" onClick={onUndo} disabled={!canUndo}>
              <Undo2 className="size-4" />
            </IconBtn>
            <IconBtn label="Redo" kbd={`${SHIFT}${MOD}Z`} onClick={onRedo} disabled={!canRedo}>
              <Redo2 className="size-4" />
            </IconBtn>
            <IconBtn label="Split at playhead" kbd="S" align="start" onClick={onSplit}>
              <SplitIcon className="size-4" />
            </IconBtn>
            <IconBtn
              label={DELETE_LABEL[selectedPart]}
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
            <span className="min-w-[88px] text-[13px] font-semibold tabular-nums">
              {fmt(player.t)} <span className="font-normal text-[#6a6b7b]">/ {fmt(player.total)}</span>
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
          onAddCard={onAddCard}
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
const fitZoom = (sectionW: number, total: number) => clampZoom((sectionW - 24 - 40 - 58 - 14 - 45 - 8) / Math.max(total, 1));

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
        className={`h-8 rounded-lg px-2 text-[13px] font-semibold text-[#4a4b5c] transition hover:bg-[#f3f4f6] hover:text-[#1a1a2e] active:bg-[#eceef2] ${FOCUS}`}
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
        <Film className="absolute left-1/2 top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 text-[#6a6b7b]" />
        <video src={`${asset.url}#t=0.1`} muted preload="metadata" crossOrigin="anonymous" className="relative size-full object-cover" />
      </span>
    );
  }
  return (
    <span className={`grid size-full place-items-center text-[#6a6b7b] ${PENDING_FILL}`}>
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
  /* 配音节点不在素材里列:它按镜头分句,已经整个放在音频轨上了,从这里再加只会加进第一句 */
  const media = project.assets.filter((a) => a.purpose !== "voice");

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

  /* 推荐片段:Agent 找出的能用、但还没放进时间线的片段;点 + 按这段的起止加到末尾,替换则换掉选中片段 */
  const takes = tab === "imported" && (kind === "all" || kind === "video") ? unusedTakes(project) : [];
  const addTake = (a: Asset, seg: { start: number; end: number }) => {
    const id = newId("c");
    edit.commit((p) => ({
      ...p,
      clips: [
        ...p.clips,
        { id, assetId: a.id, role: a.role ?? "usage", inSec: seg.start, outSec: Math.min(seg.end, a.durationSec), speed: 1, muted: false, subtitle: "", subtitleSource: "authored" },
      ],
    }));
    onSelect(id);
  };
  const replaceTake = (a: Asset, seg: { start: number; end: number }) => {
    if (!clip) return;
    edit.commit((p) => patchClip(p, clip.id, { assetId: a.id, inSec: seg.start, outSec: Math.min(seg.end, a.durationSec), note: undefined }));
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
      {takes.length > 0 && (
        <section className="mb-4">
          <p className="mb-2 text-[12px] font-semibold text-[#4a4b5c]">Unused good takes</p>
          <ul className="space-y-1.5">
            {takes.map(({ asset: a, seg }) => (
              <li key={`${a.id}-${seg.start}`} className="group relative flex items-center gap-2.5 rounded-lg p-1.5 transition hover:bg-[#f5f6f8]">
                <span className="relative size-11 shrink-0 overflow-hidden rounded-md bg-[#eceef2] ring-1 ring-inset ring-[#e6e7ec]">
                  {a.url && <video src={`${a.url}#t=${seg.start + 0.1}`} muted preload="metadata" crossOrigin="anonymous" className="size-full object-cover" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12px] font-semibold text-[#1a1a2e]" title={a.label}>
                    {a.label}
                  </span>
                  <span className="block text-[11px] tabular-nums text-[#6a6b7b]">
                    {seg.start}–{seg.end}s
                  </span>
                  <span className="line-clamp-1 text-[11px] text-[#6a6b7b]" title={seg.description}>
                    {seg.description}
                  </span>
                </span>
                <span className="flex shrink-0 gap-1 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                  {clip && (
                    <Tip label="Replace selected clip" side="left">
                      <button type="button" aria-label="Replace selected clip" onClick={() => replaceTake(a, seg)} className={TILE_BTN}>
                        <Replace className="size-3.5" />
                      </button>
                    </Tip>
                  )}
                  <Tip label="Add to end of timeline" side="left">
                    <button type="button" aria-label="Add to timeline" onClick={() => addTake(a, seg)} className={TILE_BTN}>
                      <Plus className="size-4" />
                    </button>
                  </Tip>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#d9dae2] px-4 py-6 text-center text-[13px] text-[#6a6b7b]">
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
                      <span className="absolute left-1.5 top-1.5 rounded-full bg-white/95 px-1.5 py-px text-[11px] font-semibold text-[#4a4b5c] shadow-sm">
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
                <p className="mt-1.5 flex items-center gap-1 truncate text-[12px] text-[#4a4b5c]" title={a.label}>
                  {a.kind === "audio" ? (
                    <AudioLines className="size-3 shrink-0 text-[#6a6b7b]" />
                  ) : a.origin === "ai" ? (
                    <VideoIcon className="size-3 shrink-0 text-[#6a6b7b]" />
                  ) : a.kind === "image" ? (
                    <ImageIcon className="size-3 shrink-0 text-[#6a6b7b]" />
                  ) : (
                    <Film className="size-3 shrink-0 text-[#6a6b7b]" />
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
/* ── 字幕设置:和屏幕文字(Text)面板同一个结构 —— 这一句的字 / 样式 / 位置;样式和位置对全片字幕生效。
   画布节点里选中字幕、点预览区的「Subtitle styles」、全屏编辑里选中字幕,打开的都是它 ── */
const SUB_Y: { id: "top" | "upper" | "middle" | "bottom"; label: string; y: number }[] = [
  { id: "top", label: "Top", y: 0.14 },
  { id: "upper", label: "Upper", y: 0.3 },
  { id: "middle", label: "Middle", y: 0.5 },
  { id: "bottom", label: "Bottom", y: 0.84 },
];
export function SubtitlePanel({ project, edit, clip, onClose }: { project: Project; edit: EditApi; clip: Clip | null; onClose: () => void }) {
  const began = useRef(false);
  const pos = project.subtitlePos ?? { x: 0.5, y: 0.84 };
  const snapped = SUB_Y.find((o) => Math.abs(o.y - pos.y) < 0.03 && Math.abs(pos.x - 0.5) < 0.03);
  return (
    <div>
      <PanelHeader title="Subtitles" hint="What's said on screen, separate from on-screen text" onClose={onClose} closeLabel="Close subtitle settings" />
      <Label
        aside={
          clip && (
            <span className="rounded-full bg-[#f1f2f5] px-2 py-0.5 text-[11px] font-semibold text-[#6a6b7b]">
              {clip.subtitleSource === "stt" ? "From original voice" : "From voiceover"}
            </span>
          )
        }
      >
        Text
      </Label>
      {clip ? (
        <textarea
          aria-label="Subtitle text"
          rows={2}
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
          className={`${FIELD} w-full resize-none px-3 py-2 text-[13px] leading-snug`}
        />
      ) : (
        <p className="text-[12px] leading-snug text-[#6a6b7b]">Select a subtitle on the timeline to fix its words.</p>
      )}
      <Label>Style</Label>
      <StyleTiles
        label="Subtitle style"
        columns={2}
        value={subtitlePreset(project.subtitleStyle).id}
        onPick={(id) => edit.commit((p) => ({ ...p, subtitleStyle: id }))}
        items={SUBTITLE_PRESETS.map((p) => ({
          id: p.id,
          name: p.name,
          preview: p.id === "none" ? <Ban className="size-5 text-white/70" /> : <SubtitleText text="Text" preset={p} progress={0} className="text-[17px]" />,
        }))}
      />
      <p className="mt-1.5 text-[11.5px] text-[#6a6b7b]">Applies to every subtitle in this reel.</p>
      <Label
        aside={
          project.subtitlePos && (
            <button type="button" onClick={() => edit.commit((p) => ({ ...p, subtitlePos: undefined }))} className="text-[12px] font-semibold text-[#ff5e1a] hover:underline">
              Reset
            </button>
          )
        }
      >
        Position
      </Label>
      <Segmented
        label="Subtitle position"
        value={snapped?.id ?? ("custom" as const)}
        onChange={(v) => {
          const o = SUB_Y.find((x) => x.id === v);
          if (o) edit.commit((p) => ({ ...p, subtitlePos: o.id === "bottom" ? undefined : { x: 0.5, y: o.y } }));
        }}
        items={SUB_Y.map((o) => ({ id: o.id, label: o.label }))}
      />
      <p className="mt-1.5 text-[11.5px] leading-snug text-[#6a6b7b]">
        {snapped ? "Drag a subtitle in the preview for a custom spot." : "Custom spot — dragged in the preview."}
      </p>
      <SizeRow scale={project.subtitleScale ?? 1} onReset={() => edit.commit((p) => ({ ...p, subtitleScale: undefined }))} what="subtitle" />
    </div>
  );
}

/* 字号:在预览里拖选中框的角缩放(和剪映一样),这里显示现在多大、可一键回到默认 */
function SizeRow({ scale, onReset, what }: { scale: number; onReset: () => void; what: string }) {
  return (
    <>
      <Label
        aside={
          scale !== 1 && (
            <button type="button" onClick={onReset} className="text-[12px] font-semibold text-[#ff5e1a] hover:underline">
              Reset
            </button>
          )
        }
      >
        Size <span className="ml-1 font-normal tabular-nums text-[#6a6b7b]">{Math.round(scale * 100)}%</span>
      </Label>
      <p className="-mt-1 text-[11.5px] leading-snug text-[#6a6b7b]">Drag a corner of the selected {what} in the preview to resize it.</p>
    </>
  );
}

/* ── 实拍片段的属性:这一段的原声音量、画面怎么放进成片的画幅、换一段素材 ──
   变速还在右键菜单里(要不要保留待定),这里不重复放 */
function ClipPanel({
  project,
  edit,
  clip,
  asset,
  onReplace,
  onClose,
}: {
  project: Project;
  edit: EditApi;
  clip: Clip;
  asset: Asset;
  onReplace: () => void;
  onClose: () => void;
}) {
  const began = useRef(false);
  const patch = (next: Partial<Clip>, record = true) => {
    const fn = (p: Project) => ({ ...p, clips: p.clips.map((c) => (c.id === clip.id ? { ...c, ...next } : c)) });
    if (record) edit.commit(fn);
    else edit.update(fn);
  };
  const video = asset.kind === "video";
  const vol = clip.volume ?? 100;
  const dubbed = (project.voice ?? []).some((v) => v.clipId === clip.id && v.url);
  const framing = clip.framing ?? "auto";
  const shownFraming = resolveFraming(clip, asset, project.aspect);
  const len = clipLen(clip);
  return (
    <div>
      <PanelHeader title="Clip" hint={asset.label} onClose={onClose} closeLabel="Close clip settings" />

      <Label>Length</Label>
      <p className="text-[13px] tabular-nums text-[#1a1a2e]">
        {len.toFixed(1)}s
        {video && (
          <span className="text-[#6a6b7b]">
            {" "}
            · uses {clip.inSec.toFixed(1)}–{clip.outSec.toFixed(1)}s of {asset.durationSec.toFixed(1)}s
          </span>
        )}
      </p>

      {video && (
        <>
          <Label
            aside={
              <Toggle label="Original audio for this clip" on={!clip.muted} onChange={(on) => patch({ muted: !on })} />
            }
          >
            Original audio
          </Label>
          <div className={`grid grid-cols-[1fr_36px] items-center gap-3 ${clip.muted ? "opacity-40" : ""}`}>
            <SlimRange
              label="Clip volume"
              value={vol}
              onStart={() => (began.current = false)}
              onChange={(v) => {
                if (!began.current) {
                  edit.begin();
                  began.current = true;
                }
                patch({ volume: v }, false);
              }}
            />
            <span className="text-right text-[12px] tabular-nums text-[#6a6b7b]">{vol}</span>
          </div>
          {dubbed && !clip.muted && (
            <p className="mt-2 text-[12px] leading-snug text-[#6a6b7b]">This shot has a voiceover, so its original audio plays at 20% underneath it.</p>
          )}
        </>
      )}

      <Label>Framing</Label>
      <Segmented
        label="Framing"
        value={framing}
        onChange={(v) => patch({ framing: v })}
        items={[
          { id: "auto", label: "Auto" },
          { id: "fill", label: "Fill" },
          { id: "fit", label: "Fit" },
        ]}
      />
      <p className="mt-2 text-[12px] leading-snug text-[#6a6b7b]">
        {shownFraming === "fill" ? "Fills the frame; edges may be cropped. Drag the preview to reposition." : "Shows the whole shot inside the frame."}
      </p>
      {shownFraming === "fit" && (
        <>
          <Label>Background</Label>
          <Segmented
            label="Fit background"
            value={clip.fitBg ?? "blur"}
            onChange={(v) => patch({ fitBg: v })}
            items={[
              { id: "blur", label: "Blur" },
              { id: "black", label: "Black" },
              { id: "white", label: "White" },
            ]}
          />
        </>
      )}

      {/* Agent 素材拆解里这一段的分析:画面是什么、证明了什么卖点、原声是什么;整条素材的画质问题 */}
      {(() => {
        const seg = asset.segments?.filter((g) => Math.min(g.end, clip.outSec) - Math.max(g.start, clip.inSec) > 0.2) ?? [];
        const an = asset.analysis;
        if (!seg.length && !an?.description) return null;
        return (
          <>
            <Label>From the footage analysis</Label>
            <div className="space-y-1.5 rounded-lg bg-[#f7f8fa] px-3 py-2 text-[12px] leading-snug text-[#4a4b5c]">
              {seg.length
                ? seg.map((g, i) => (
                    <p key={i}>
                      <span className="tabular-nums text-[#9a9bb0]">{g.start}–{g.end}s</span> {g.usable ? g.description : `Cut · ${g.reason || g.description}`}
                      {g.sellingPoint && <span className="block text-[#6a6b7b]">Shows: {g.sellingPoint}</span>}
                      {g.sound && g.sound !== "silent" && <span className="block text-[#6a6b7b]">Sound: {SOUND_META[g.sound].label}</span>}
                    </p>
                  ))
                : <p>{an?.description}</p>}
              {an?.issues?.length ? <p className="text-[#8a3d0c]">Quality: {an.issues.join("; ")}</p> : null}
            </div>
          </>
        );
      })()}

      <TreatmentControls project={project} clip={clip} asset={asset} patch={patch} />

      <button
        type="button"
        onClick={onReplace}
        className={`mt-6 flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-[13px] font-semibold text-[#1a1a2e] ring-1 ring-inset ring-[#e1e3e9] transition hover:bg-[#f7f8fa] ${FOCUS}`}
      >
        <Replace className="size-4" /> Replace footage
      </button>
    </div>
  );
}

/* ── 画面处理(剪辑方案 spec 2.2):方案里 AI 定好的变速、动效、局部放大、设备外壳…,这里能改 ── */
function TreatmentControls({
  project,
  clip,
  asset,
  patch,
}: {
  project: Project;
  clip: Clip;
  asset: Asset;
  patch: (next: Partial<Clip>, record?: boolean) => void;
}) {
  const image = asset.kind === "image";
  const motions = (Object.keys(MOTION_LABEL) as Motion[]).filter((m) => image || m !== "scroll");
  const pipOptions = [
    { value: "", label: "None" },
    ...project.assets
      .filter((a) => a.origin === "upload" && a.kind !== "audio" && a.id !== asset.id && a.url)
      .map((a) => ({ value: a.id, label: a.label })),
  ];
  const flags: { key: "highlight" | "asCard" | "stabilize" | "cutout" | "keepWhole"; label: string; hint: string }[] = [
    { key: "highlight", label: "Click highlight", hint: "Rings where the click lands" },
    { key: "asCard", label: "Show as a card", hint: "Crops a review or stat into a card" },
    { key: "stabilize", label: "Stabilize", hint: "Smooths handheld shake on export" },
    { key: "cutout", label: "Cut out product", hint: "Lifts the product off its background on export" },
    { key: "keepWhole", label: "Keep whole on beat sync", hint: "Beat sync won't trim this shot" },
  ];
  return (
    <>
      {clip.intent && (
        <p className="mt-5 rounded-lg bg-[#fff7f1] px-3 py-2 text-[12px] leading-snug text-[#8a3d0c]">
          <span className="font-semibold">From the plan:</span> {clip.intent}
        </p>
      )}
      <Label>Speed</Label>
      <Segmented
        label="Speed"
        value={clip.speed}
        onChange={(v) => patch({ speed: v })}
        items={[0.5, 1, 1.5, 2, ...(![0.5, 1, 1.5, 2].includes(clip.speed) ? [clip.speed] : [])].map((v) => ({ id: v, label: `${v}×` }))}
      />
      <Label>Motion</Label>
      <DropdownSelect
        size="sm"
        label="Motion"
        value={clip.motion ?? "none"}
        options={motions.map((m) => ({ value: m, label: MOTION_LABEL[m] }))}
        onChange={(v) => patch({ motion: v === "none" ? undefined : v })}
      />
      <Label
        aside={
          <Toggle
            label="Zoom to a detail"
            on={!!clip.zoom}
            onChange={(on) => patch({ zoom: on ? { x: 0.25, y: 0.25, w: 0.5, h: 0.5, target: "" } : undefined })}
          />
        }
      >
        Zoom to a detail
      </Label>
      {clip.zoom && (
        <div className="space-y-2">
          <input
            aria-label="What to zoom to"
            value={clip.zoom.target}
            onChange={(e) => patch({ zoom: { ...clip.zoom!, target: e.target.value } }, false)}
            placeholder="e.g. the Export button"
            className={`${FIELD} h-9 w-full px-3 text-[13px]`}
          />
          <div className="flex items-center justify-between text-[12px] text-[#4a4b5c]">
            Follow the cursor
            <Toggle label="Follow the cursor" on={!!clip.zoom.follow} onChange={(on) => patch({ zoom: { ...clip.zoom!, follow: on } })} />
          </div>
        </div>
      )}
      <Label>Device frame</Label>
      <Segmented
        label="Device frame"
        value={clip.device ?? "none"}
        onChange={(v) => patch({ device: v === "none" ? undefined : v })}
        items={[
          { id: "none", label: "None" },
          { id: "phone", label: "Phone" },
          { id: "laptop", label: "Laptop" },
        ]}
      />
      <Label>Picture-in-picture</Label>
      <DropdownSelect size="sm" label="Picture-in-picture" value={clip.pipId ?? ""} options={pipOptions} onChange={(v) => patch({ pipId: v || undefined })} />
      <div className="mt-4 space-y-2.5">
        {flags.map((f) => (
          <div key={f.key} className="flex items-center justify-between gap-3">
            <span className="min-w-0">
              <span className="block text-[12.5px] font-semibold text-[#1a1a2e]">{f.label}</span>
              <span className="block text-[11.5px] leading-snug text-[#6a6b7b]">{f.hint}</span>
            </span>
            <Toggle label={f.label} on={!!clip[f.key]} onChange={(on) => patch({ [f.key]: on || undefined })} />
          </div>
        ))}
      </div>
    </>
  );
}

/* ── 字卡设置:文案、样式(独立的字卡样式库)、位置、进场动效、进场音效(绑在字卡上)、全片强调色 ── */
const ACCENTS = ["#ff5e1a", "#1f6fd1", "#12a37a", "#e0457b", "#7c5cd6", "#1a1a2e", "#ffffff"];
export function CardPanel({ project, edit, cardId, onClose }: { project: Project; edit: EditApi; cardId: string; onClose: () => void }) {
  const card = (project.cards ?? []).find((c) => c.id === cardId);
  const typing = useRef(false);
  if (!card) return null;
  const patch = (next: Partial<TextCard>, record = true) => {
    const fn = (p: Project) => ({ ...p, cards: (p.cards ?? []).map((c) => (c.id === cardId ? { ...c, ...next } : c)) });
    if (record) edit.commit(fn);
    else edit.update(fn);
  };
  const accent = project.cardAccent ?? "#ff5e1a";
  return (
    <div>
      <PanelHeader title="Text" hint="Designed on-screen text, separate from subtitles" onClose={onClose} closeLabel="Close text settings" />
      <Label>Text</Label>
      <textarea
        aria-label="On-screen text"
        value={card.text}
        rows={2}
        /* 新加的字卡是空的:直接聚焦,打字就行 */
        autoFocus={!card.text}
        placeholder="Type the on-screen text"
        onFocus={() => (typing.current = false)}
        onChange={(e) => {
          if (!typing.current) {
            edit.begin();
            typing.current = true;
          }
          patch({ text: e.target.value }, false);
        }}
        className={`${FIELD} w-full resize-none px-3 py-2 text-[13px] leading-snug`}
      />
      <Label>Style</Label>
      <StyleTiles
        label="Text style"
        columns={2}
        value={card.style}
        onPick={(id) => patch({ style: id })}
        items={CARD_STYLES.map((st) => ({
          id: st.id,
          name: st.name,
          hint: st.fit,
          /* 格子里缩小画、不换行,整张卡(气泡、通知这类带外框的)都放得下 */
          preview: (
            <span className="whitespace-nowrap text-[9px]">
              <CardText text="Aa text" style={st.id} accent={accent} />
            </span>
          ),
        }))}
      />
      <Label>Accent colour</Label>
      <div className="flex flex-wrap gap-2">
        {ACCENTS.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`Accent ${c}`}
            aria-pressed={accent === c}
            onClick={() => edit.commit((p) => ({ ...p, cardAccent: c }))}
            className={`size-7 rounded-full ring-1 ring-inset ring-black/10 ${FOCUS} ${accent === c ? "outline outline-2 outline-offset-2 outline-[#ff5e1a]" : ""}`}
            style={{ background: c }}
          />
        ))}
      </div>
      <p className="mt-1.5 text-[11.5px] text-[#6a6b7b]">Applies to all on-screen text in this reel.</p>
      <Label
        aside={
          card.x !== undefined && (
            <button type="button" onClick={() => patch({ x: undefined, y: undefined })} className="text-[12px] font-semibold text-[#ff5e1a] hover:underline">
              Reset
            </button>
          )
        }
      >
        Position
      </Label>
      <Segmented
        label="Text position"
        value={card.x !== undefined ? ("custom" as CardPos) : card.pos}
        onChange={(v: CardPos) => patch({ pos: v, x: undefined, y: undefined })}
        items={[
          { id: "top", label: "Top" },
          { id: "upper", label: "Upper" },
          { id: "center", label: "Middle" },
          { id: "lower", label: "Lower" },
        ]}
      />
      <p className="mt-1.5 text-[11.5px] leading-snug text-[#6a6b7b]">
        {card.x !== undefined ? "Custom spot — dragged in the preview." : "Drag the text in the preview for a custom spot."}
      </p>
      <SizeRow scale={card.scale ?? 1} onReset={() => patch({ scale: undefined })} what="text" />
      <Label>Entrance</Label>
      <Segmented
        label="Text entrance"
        value={card.anim}
        onChange={(v: CardAnim) => patch({ anim: v })}
        items={[
          { id: "pop", label: "Pop" },
          { id: "slide", label: "Slide" },
          { id: "type", label: "Type" },
          { id: "fade", label: "Fade" },
        ]}
      />
    </div>
  );
}
