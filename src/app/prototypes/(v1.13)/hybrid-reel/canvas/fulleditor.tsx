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
  Upload,
  AlertTriangle,
} from "lucide-react";
import { Preview, UploadEmpty, type Player, type Scrub } from "./player";
import { SUBTITLE_PRESETS, SubtitleText, subtitlePreset } from "./subtitles";
import { CARD_STYLES, CardText } from "./cards";
import { CARD_STYLE_NONE } from "@/lib/hybrid-reel/cards";
import { AudioSettings, NodeSettings } from "./settings";
import { DELETE_LABEL, Timeline, type EditApi, type PanelId, type SelectPart } from "./timeline";
import { SplitIcon } from "./icons";
import type { ClipMenuApi } from "./clipmenu";
import { Tip } from "./tip";
import { ColorPicker, SWATCH_OFF, SWATCH_ON } from "./colorpicker";
import { GenFill, PENDING_FILL, FIELD, FOCUS, IconBtn, Label, PanelHeader, StyleTiles, Tabs, MOD, SHIFT } from "./ui";
import { AudioPanel } from "./audio";
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
  type TextCard,
  cardLength,
  cardLengthHint,
  type PendingView,
  addMusic,
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
  onGenerateAllVoice,
  onSplit,
  onUploadAudio,
  onUploadMedia,
  onUploadFiles,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onDelete,
  belowDemoBar,
  cover,
  onCover,
  onCoverRemove,
}: {
  /** 开发版顶部有深色演示栏(h-11):全屏从它下面开始铺;评审原型没有演示栏,铺满整个产品区(盖住画布顶栏) */
  belowDemoBar?: boolean;
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
  pending: PendingView;
  onGenerateAll: () => void;
  clipMenu: ClipMenuApi;
  onAutoSubtitle: () => void;
  onAddVoice: () => void;
  onAddCard?: (at?: number) => void;
  onVoiceClick: (assetId: string) => void;
  /** 配音生成(和配乐、视频的生成是两条路) */
  onGenerateVoice: (assetId: string) => void;
  /** 「Generate all n lines」:所有分段配音一次生成(总价查一次余额) */
  onGenerateAllVoice?: () => void;
  onSplit: () => void;
  /** 音频面板里上传自己的音乐 / 音效 */
  onUploadAudio: (file: File, as: "music" | "sfx") => void;
  /** Media 面板上传视频 / 图片:返回 null = 成功,否则是不合规的提示文案 */
  onUploadMedia?: (file: File) => Promise<string | null>;
  /** 还没有片段时,预览区的上传(点加号 / 拖文件进来) */
  onUploadFiles?: (files: File[]) => void;
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
  /* 选中用户自己的素材(上传的视频 / 图片)只选中,不出面板;只有生成的镜头才有设置面板 */
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
          : null;

  const toggle = (p: PanelId) => setPanel(panel === p ? null : p);
  const exporting = exportPct !== null;

  /* 盖住画布顶栏;开发版从顶部演示栏(h-11)下面开始铺,不被它盖住 */
  return (
    <div className={`fixed inset-x-0 bottom-0 ${belowDemoBar ? "top-11" : "top-0"} z-[150] flex flex-col bg-white text-[#1a1a2e]`}>
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
              {pending.skipNote && ` · ${pending.skipNote}`}
            </span>
            {pending.runnable > 0 && (
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
        <Tip label={project.clips.length ? "Export MP4 · 1080p" : "Add footage first"} side="bottom" align="end" className={pending.count > 0 ? "" : "ml-auto"}>
        <button
            type="button"
            onClick={onExport}
            disabled={exporting || !project.clips.length}
            aria-busy={exporting}
            className={`relative flex h-8 min-w-[112px] items-center justify-center gap-1.5 overflow-hidden rounded-lg bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-3.5 text-[13px] font-semibold text-white transition hover:brightness-105 active:brightness-95 disabled:cursor-progress ${project.clips.length ? "" : "pointer-events-none opacity-40"} ${FOCUS} focus-visible:ring-offset-2`}
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
        </Tip>
        {/* 退出全屏编辑,回到画布 */}
        <IconBtn label="Exit full screen" kbd="Esc" side="bottom" align="end" onClick={onClose}>
          <X className="size-[18px]" />
        </IconBtn>
      </header>

      {/* 左右面板浮在预览上方(绝对定位),开关面板时预览和时间线不挪位置 */}
      <div className="relative flex min-h-0 flex-1 gap-2 pr-2">
        {/* 左侧工具 */}
        <nav aria-label="Editor tools" className="flex w-[68px] shrink-0 flex-col items-center gap-1 bg-white py-2">
          <RailBtn icon={FolderOpen} label="Media" active={panel === "media"} onClick={() => toggle("media")} />
          <RailBtn icon={Music} label="Audio" active={panel === "audio" || panel === "sfx"} onClick={() => (panel === "sfx" ? setPanel(null) : toggle("audio"))} />
        </nav>
        {leftPanel === "media" && (
          <aside className="absolute bottom-0 left-[76px] top-0 z-20 w-[320px] overflow-y-auto rounded-xl bg-white px-4 pb-4 pt-3 ring-1 ring-inset ring-[#eceef2] shadow-[0_12px_32px_rgba(26,26,46,0.14)] [scrollbar-width:none]">
            {/* 画幅切换先不做:成片画幅按 brief 里的投放平台定 */}
            <MediaPanel project={project} edit={edit} clip={clip} onSelect={onSelect} onClose={() => setPanel(null)} onUpload={onUploadMedia} reelLen={player.total} />
          </aside>
        )}
        {leftPanel === "audio" && (
          <aside className="absolute bottom-0 left-[76px] top-0 z-20 flex w-[320px] flex-col overflow-hidden rounded-xl bg-white px-4 pb-4 pt-3 ring-1 ring-inset ring-[#eceef2] shadow-[0_12px_32px_rgba(26,26,46,0.14)]">
            <PanelHeader title="Audio" onClose={() => setPanel(null)} />
            <div className="min-h-0 flex-1">
              <AudioPanel key={panel ?? ""} initialTab={panel === "sfx" ? "sfx" : "music"} project={project} edit={edit} player={player} onGenerate={onGenerate} onUpload={onUploadAudio} />
            </div>
          </aside>
        )}

        {/* 预览 */}
        <main className="min-w-0 flex-1 rounded-xl bg-[#EDF1F3] p-6">
          {project.clips.length === 0 && onUploadFiles ? (
            <UploadEmpty onFiles={onUploadFiles} />
          ) : (
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
          )}
        </main>

        {/* 右侧设置:跟着选中弹出,取消选中就收起 */}
        {inspector && (
          <aside
            aria-label={inspector === "voice" ? (voiceAsset?.purpose === "voice" ? "Voiceover settings" : "Music settings") : inspector === "text" ? "Subtitle settings" : inspector === "card" ? "Text settings" : "Video settings"}
            className={`absolute bottom-0 right-2 top-0 z-20 w-[320px] overflow-hidden rounded-xl bg-white ring-1 ring-inset ring-[#eceef2] shadow-[0_12px_32px_rgba(26,26,46,0.14)] ${
              inspector === "text" || inspector === "card" ? "overflow-y-auto px-4 pb-5 pt-3 [scrollbar-width:none]" : ""
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
                onGenerateAll={onGenerateAllVoice}
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
            <IconBtn label="Split at playhead" kbd="S" align="start" onClick={onSplit} disabled={!project.clips.length}>
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
              disabled={!project.clips.length}
              aria-label={player.playing ? "Pause" : "Play"}
              className={`grid size-7 place-items-center rounded-full bg-[#1a1a2e] text-white transition hover:bg-[#2c2c44] active:scale-95 disabled:opacity-30 disabled:hover:bg-[#1a1a2e] ${FOCUS} focus-visible:ring-offset-2`}
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
      <Tip label="Fit the whole video in view" side="top" align="end">
      <button
        type="button"
        onClick={onFit}
        className={`h-8 rounded-lg px-2 text-[13px] font-semibold text-[#4a4b5c] transition hover:bg-[#f3f4f6] hover:text-[#1a1a2e] active:bg-[#eceef2] ${FOCUS}`}
      >
        Fit
      </button>
      </Tip>
    </div>
  );
}

/* ── 小组件 ── */
export function RailBtn({
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
export function MediaPanel({
  project,
  edit,
  clip,
  onSelect,
  onClose,
  onUpload,
  reelLen = 0,
}: {
  /** 成片多长:加音乐时接在最后一段后面要用(见 addMusic) */
  reelLen?: number;
  project: Project;
  edit: EditApi;
  clip: Clip | null;
  onSelect: (id: string | null) => void;
  onClose: () => void;
  onUpload?: (file: File) => Promise<string | null>;
}) {
  const [tab, setTab] = useState<"imported" | "library">("imported");
  /* 上传:不合规的文件不加入,上方出一条可关闭的提示(限制同 Agent) */
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadNote, setUploadNote] = useState<string | null>(null);
  const [uploading, setUploading] = useState(0);
  const pickFiles = async (files: FileList | null) => {
    if (!files?.length || !onUpload) return;
    const list = Array.from(files);
    setUploadNote(null);
    setTab("imported");
    setUploading((n) => n + list.length);
    const notes: string[] = [];
    for (const f of list) {
      const bad = await onUpload(f);
      if (bad) notes.push(bad);
      setUploading((n) => n - 1);
    }
    if (notes.length) setUploadNote(notes.join(" · "));
  };
  const [kind, setKind] = useState<KindFilter>("all");
  /* Imported = 画布上连进剪辑器的全部素材,含 AI 配音 / 配乐 */
  /* 配音节点不在素材里列:它按镜头分句,已经整个放在音频轨上了,从这里再加只会加进第一句 */
  const media = project.assets.filter((a) => a.purpose !== "voice" && a.purpose !== "sfx");

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
      } else edit.commit((p) => addMusic(p, a.id, reelLen));
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
      {onUpload && (
        <>
          <input
            ref={fileRef}
            type="file"
            accept="video/*,image/*"
            multiple
            hidden
            onChange={(e) => {
              void pickFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading > 0}
            className={`mb-1 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[#d9dae2] py-2.5 text-[13px] font-semibold text-[#1a1a2e] transition hover:border-[#ff5e1a] hover:bg-[#fff8f4] disabled:opacity-60 ${FOCUS}`}
          >
            {uploading > 0 ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            {uploading > 0 ? "Adding…" : "Upload"}
          </button>
          {uploadNote && (
            <p role="alert" className="mb-3 flex items-start gap-2 rounded-lg bg-[#fff5f4] px-3 py-2 text-[12px] leading-snug text-[#b42318] ring-1 ring-inset ring-[#f3c4c0]">
              <span className="min-w-0 flex-1">{uploadNote}</span>
              <button type="button" aria-label="Dismiss" onClick={() => setUploadNote(null)} className="shrink-0 rounded text-[#b42318]/70 hover:text-[#b42318]">
                <X className="size-3.5" />
              </button>
            </p>
          )}
        </>
      )}
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
        <p className="py-6 text-center text-[13px] text-[#6a6b7b]">
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
/* ── 字幕设置:这一句的字和样式;样式只改选中的这一段(没单独改过的跟着方案)。位置和大小在预览里直接拖。
   画布节点里选中字幕、全屏编辑里选中字幕,打开的都是它 ── */
export function SubtitlePanel({ project, edit, clip, onClose }: { project: Project; edit: EditApi; clip: Clip | null; onClose: () => void }) {
  const began = useRef(false);
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
        boost={1.3}
        /* 样式只改选中的这一段字幕;没单独改过的跟着方案定的样式 */
        value={subtitlePreset(clip?.subStyle ?? project.subtitleStyle).id}
        onPick={(id) => clip && edit.commit((p) => patchClip(p, clip.id, { subStyle: id }))}
        items={SUBTITLE_PRESETS.map((p) => ({
          id: p.id,
          name: p.name,
          fixed: p.id === "none",
          preview: p.id === "none" ? <Ban className="size-5 text-white/80" /> : <SubtitleText text="Your subtitle" preset={p} progress={0.6} color={clip?.subColor} className="text-[14px] leading-tight" />,
        }))}
      />
      {clip && (
        <>
          <Label
            aside={
              clip.subColor && (
                <button type="button" onClick={() => edit.commit((p) => patchClip(p, clip.id, { subColor: undefined }))} className="text-[12px] font-semibold text-[#ff5e1a] hover:underline">
                  Reset
                </button>
              )
            }
          >
            Colour
          </Label>
          {/* 字色:和字卡强调色同一套色板 + 自选;只改这一段字幕,Reset 回到样式自带的颜色 */}
          <div className="flex flex-wrap gap-2">
            {ACCENTS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Subtitle colour ${c}`}
                aria-pressed={clip.subColor?.toLowerCase() === c}
                onClick={() => edit.commit((p) => patchClip(p, clip.id, { subColor: c }))}
                className={`size-7 rounded-full ${FOCUS}`}
                style={{ background: c, boxShadow: clip.subColor?.toLowerCase() === c ? SWATCH_ON : SWATCH_OFF }}
              />
            ))}
            <ColorPicker
              value={clip.subColor ?? "#ffffff"}
              custom={!!clip.subColor && !ACCENTS.includes(clip.subColor.toLowerCase())}
              onStart={() => edit.begin()}
              onChange={(c) => edit.update((p) => patchClip(p, clip.id, { subColor: c }))}
            />
          </div>
        </>
      )}
    </div>
  );
}

/* ── 字卡设置:文案、样式(独立的字卡样式库)、这一张的强调色;位置和大小在预览里直接拖 ── */
/* 短视频字卡最常用的强调色(2026-10-16 Monica 定的顺序):白、黑、亮黄、绿、蓝、紫、粉、品牌橙、TikTok 青、TikTok 红;最后一格自选 */
const ACCENTS = ["#ffffff", "#000000", "#ffe135", "#22c55e", "#2f6bff", "#8b5cf6", "#ff4fa3", "#ff5e1a", "#25f4ee", "#fe2c55"];
export function CardPanel({ project, edit, cardId, onClose }: { project: Project; edit: EditApi; cardId: string; onClose: () => void }) {
  const card = (project.cards ?? []).find((c) => c.id === cardId);
  const typing = useRef(false);
  if (!card) return null;
  const patch = (next: Partial<TextCard>, record = true) => {
    const fn = (p: Project) => ({ ...p, cards: (p.cards ?? []).map((c) => (c.id === cardId ? { ...c, ...next } : c)) });
    if (record) edit.commit(fn);
    else edit.update(fn);
  };
  /* 强调色只改这一张字卡;没单独改过的跟着方案定的颜色 */
  const accent = card?.accent ?? project.cardAccent ?? "#ff5e1a";
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
      {/* 字数:超过 6 个词(中文 10 个字)只提示,不拦 —— 画面上的字太长,一闪而过看不完 */}
      {(() => {
        const n = cardLength(card.text);
        if (!n.over) return null;
        return (
          <div className="mt-1.5 flex items-start justify-between gap-3 text-[11.5px] leading-snug">
            <span className={n.over ? "flex items-start gap-1 text-[#b45309]" : "text-transparent"} aria-live="polite">
              {n.over && (
                <>
                  <AlertTriangle className="mt-px size-3 shrink-0" />
                  {cardLengthHint(n.unit)}
                </>
              )}
            </span>
          </div>
        );
      })()}
      <Label>Style</Label>
      <StyleTiles
        label="Text style"
        columns={2}
        value={card.style}
        onPick={(id) => patch({ style: id })}
        items={[{ id: CARD_STYLE_NONE, name: "None", fit: "Plain white text, no plate or outline — the default" }, ...CARD_STYLES].map((st) => ({
          id: st.id,
          name: st.name,
          hint: st.fit,
          /* 评论回复是一整个气泡(上面还有一行小字),按整体缩放字太小,单独放大 */
          boost: st.id === "comment-reply" ? 1.7 : undefined,
          /* 格子里缩小画、不换行,整张卡(气泡、通知这类带外框的)都放得下 */
          /* None 和字幕那边一样画成「不用样式」的图标,原样大小不缩放 */
          fixed: st.id === CARD_STYLE_NONE,
          preview:
            st.id === CARD_STYLE_NONE ? (
              <Ban className="size-5 text-white/80" />
            ) : (
              <span className="block text-[11px] leading-tight">
                <CardText text="Your text" style={st.id} accent={accent} />
              </span>
            ),
        }))}
      />
      {/* 颜色:和字幕面板同一套 —— 只有这张字卡单独选过才高亮,Reset 回到方案定的颜色 */}
      <Label
        aside={
          card.accent && (
            <button type="button" onClick={() => patch({ accent: undefined })} className="text-[12px] font-semibold text-[#ff5e1a] hover:underline">
              Reset
            </button>
          )
        }
      >
        Colour
      </Label>
      <div className="flex flex-wrap gap-2">
        {ACCENTS.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`Text colour ${c}`}
            aria-pressed={card.accent?.toLowerCase() === c}
            onClick={() => patch({ accent: c })}
            /* 选中:白色间隔 + 橙色外圈。用 box-shadow 画(FOCUS 里的 outline-none 会把 outline 吃掉) */
            className={`size-7 rounded-full ${FOCUS}`}
            style={{ background: c, boxShadow: card.accent?.toLowerCase() === c ? SWATCH_ON : SWATCH_OFF }}
          />
        ))}
        <ColorPicker
          value={accent}
          custom={!!card.accent && !ACCENTS.includes(card.accent.toLowerCase())}
          onStart={() => edit.begin()}
          onChange={(c) => patch({ accent: c }, false)}
        />
      </div>
          </div>
  );
}
