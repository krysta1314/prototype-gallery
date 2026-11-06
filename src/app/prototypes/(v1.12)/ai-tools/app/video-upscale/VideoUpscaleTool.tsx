"use client";

/* Upscale Video 工具页(入口：侧边栏 Video › Upscale Video;模型 fal-ai/seedvr/upscale/video)。
   2026-11-05 Monica 定：页面和交互全部照 Upscale Image——
   左栏：上传视频 → Upscale Mode(Factor / Target)→ Upscale Factor 或 Target Resolution → Noise Scale
        → Output Format(MP4 / WEBM / MOV / GIF)→ Output Quality → Output Write Mode → Generate(按输出像素量算积分)。
   右侧：没有记录时是功能演示(标题 + 描述 + 可拖的前后对比视频);生成历史每条一张卡：参考视频封面在上，
        一行「SeedVR · 参数」,右上角删除;生成中是 Generating 占位;成功直接放结果视频 + Download / Favorites / Upscale again;
        失败显示原因 + Retry(积分全额退)。Seed 不开放(每次随机);安全检查 / sync_mode 后端写死。
   原型限制：结果是原视频本身(fixture),不调真实模型。 */

import { useReducer, useRef, useState } from "react";
import { CircleAlert, Download, Film, Heart, RotateCcw, Scaling, Trash2 } from "lucide-react";
import type { ToolsApi } from "../tools/api";
import { jobsReduce, nowMs, type ToolJob, type Wallet } from "../tools/jobs";
import { useJobRunner } from "../tools/useJobRunner";
import { VIDEO_TYPES, captureFrame, isVideoFile, probeVideo, saveBlob } from "../tools/media";
import { formatClock } from "../video-resize/logic";
import type { Notify } from "../components/TopToast";
import { ConfirmDeleteDialog, CtaCost, SMOOTH_CLIP, Segmented, ToolLayout, ctaBtn, fileDropProps, useRememberedSettings } from "../components/ToolKit";
import { UploadedCard } from "../components/UploadedCard";
import { ExpandButton, useMediaPreview } from "../components/MediaPreview";
import { ShareButton } from "../components/TeamSharing";
import { unshareResult } from "../components/sharing";
import { RESULT_MAX_H } from "../components/ResultCard";
import { MAX_MB, SourceUpload, sizeProblem } from "../components/SourceUpload";
import { Label, MODE_OPTIONS, NumberBox, RANGE, ResetButton, TARGET_OPTIONS, rangeStyle } from "../components/UpscalePanel";
import { DropdownSelect } from "@/components/ui/dropdown-select";
import { FACTOR_MAX, FACTOR_MIN, parseFactor } from "../logic";
import {
  DEFAULT_VIDEO_PARAMS,
  MAX_UPSCALE_SECONDS,
  videoOutputSize,
  videoParamSummary,
  videoUpscaleCredits,
  type VideoFormat,
  type VideoQuality,
  type VideoUpscaleParams,
  type WriteMode,
} from "./logic";

type Source = { id: string; url: string; name: string; width: number; height: number; duration: number; poster: string | null };
type Input = { source: Source; params: VideoUpscaleParams };
type Job = ToolJob<Input>;

const ACCEPT_ATTR = VIDEO_TYPES.map((t) => `.${t}`).join(",");
const NO_VIDEO_HINT = "Upload a video to upscale.";
const FAILED = "Upscale failed. Your credits have been refunded.";
const fmt = (n: number) => n.toLocaleString("en-US");
const newId = () => `vu-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const FORMAT_OPTIONS: { value: VideoFormat; label: string }[] = [
  { value: "mp4", label: "MP4" },
  { value: "webm", label: "WEBM" },
  { value: "mov", label: "MOV" },
  { value: "gif", label: "GIF" },
];
const QUALITY_OPTIONS: { value: VideoQuality; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "maximum", label: "Max" },
];
const WRITE_OPTIONS: { value: WriteMode; label: string }[] = [
  { value: "fast", label: "Fast" },
  { value: "balanced", label: "Balanced" },
  { value: "small", label: "Small" },
];
const INFO = {
  mode: "Factor multiplies the width and height. Target scales the video to a standard size.",
  factor: "How many times larger the video gets, from 1x to 10x.",
  target: "The output size. The short side matches this resolution.",
  noise: "Higher adds more fine detail; lower stays closer to the original.",
  format: "MP4 plays everywhere. WEBM is for the web, MOV (ProRes) is for editing, GIF has no sound.",
  quality: "Higher quality looks better but makes a bigger file.",
  writeMode: "Fast saves sooner, Small makes a lighter file, Balanced is in between.",
};

const ACTION =
  "inline-flex h-10 items-center justify-center gap-1.5 whitespace-nowrap max-sm:flex-1 sm:h-9 rounded-lg border border-[#ececf1] bg-white px-3 text-[13px] font-semibold text-[#1a1a2e] transition hover:border-[#ffbd99] hover:bg-[#fffaf7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40";

/** Upscale Video 的参数面板(工具页左栏和画布视频节点的 Upscale 浮层共用) */
export function VideoUpscaleParamsPanel({ params, onChange }: { params: VideoUpscaleParams; onChange: (patch: Partial<VideoUpscaleParams>) => void }) {
  const set = onChange;
  return (
    <div className="flex w-full flex-col gap-4 text-[#1a1a2e]">
      <div>
        <Label info={INFO.mode}>Upscale Mode</Label>
        <Segmented label="Upscale mode" value={params.mode} options={MODE_OPTIONS} onChange={(mode) => set({ mode })} />
      </div>
      {params.mode === "factor" ? (
        <div>
          <Label info={INFO.factor}>Upscale Factor</Label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              aria-label="Upscale factor"
              min={FACTOR_MIN}
              max={FACTOR_MAX}
              step={0.1}
              value={params.factor}
              onChange={(e) => set({ factor: parseFactor(e.target.value, params.factor) })}
              style={rangeStyle(params.factor, FACTOR_MIN, FACTOR_MAX)}
              className={RANGE}
            />
            <div className="flex shrink-0 items-center gap-1">
              <NumberBox
                label="Upscale factor value"
                className="w-14"
                value={params.factor}
                parse={(raw, prev) => parseFactor(raw, prev ?? params.factor)}
                format={(v) => String(v ?? params.factor)}
                onCommit={(v) => v !== null && set({ factor: v })}
              />
              <span className="text-[13px] text-[#6a6b7b]">x</span>
            </div>
            {params.factor !== DEFAULT_VIDEO_PARAMS.factor && <ResetButton label="Reset upscale factor" onClick={() => set({ factor: DEFAULT_VIDEO_PARAMS.factor })} />}
          </div>
        </div>
      ) : (
        <div>
          <Label info={INFO.target}>Target Resolution</Label>
          <DropdownSelect size="sm" label="Target resolution" value={params.target} options={TARGET_OPTIONS} onChange={(target) => set({ target })} />
        </div>
      )}
      <div>
        <Label info={INFO.noise}>Noise Scale</Label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            aria-label="Noise scale"
            min={0}
            max={1}
            step={0.001}
            value={params.noiseScale}
            onChange={(e) => set({ noiseScale: Number(e.target.value) })}
            style={rangeStyle(params.noiseScale, 0, 1)}
            className={`${RANGE} mr-1`}
          />
          <NumberBox
            label="Noise scale value"
            className="w-16 shrink-0"
            value={params.noiseScale}
            parse={(raw, prev) => {
              const n = Number(raw);
              if (raw.trim() === "" || !Number.isFinite(n)) return prev;
              return Math.min(1, Math.max(0, Math.round(n * 1000) / 1000));
            }}
            format={(v) => String(v ?? params.noiseScale)}
            onCommit={(v) => v !== null && set({ noiseScale: v })}
          />
          {params.noiseScale !== DEFAULT_VIDEO_PARAMS.noiseScale && <ResetButton label="Reset noise scale" onClick={() => set({ noiseScale: DEFAULT_VIDEO_PARAMS.noiseScale })} />}
        </div>
      </div>
      <div>
        <Label info={INFO.format}>Output Format</Label>
        <Segmented label="Output format" value={params.format} options={FORMAT_OPTIONS} onChange={(format) => set({ format })} />
      </div>
      <div>
        <Label info={INFO.quality}>Output Quality</Label>
        <Segmented label="Output quality" value={params.quality} options={QUALITY_OPTIONS} onChange={(quality) => set({ quality })} />
      </div>
      <div>
        <Label info={INFO.writeMode}>Output Write Mode</Label>
        <Segmented label="Output write mode" value={params.writeMode} options={WRITE_OPTIONS} onChange={(writeMode) => set({ writeMode })} />
      </div>
    </div>
  );
}

export function VideoUpscaleTool({
  api,
  wallet,
  notify: say,
  onMenu,
  onInvite,
}: {
  api: ToolsApi;
  wallet: Wallet;
  notify: Notify;
  onMenu?: () => void;
  onInvite?: () => void;
}) {
  const [source, setSource] = useState<Source | null>(null);
  const [params, setParams] = useState<VideoUpscaleParams>(DEFAULT_VIDEO_PARAMS);
  const [jobs, dispatch] = useReducer(jobsReduce<Input>, []);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (patch: Partial<VideoUpscaleParams>) => setParams((p) => ({ ...p, ...patch }));
  const [confirmDel, setConfirmDel] = useState<Job | null>(null);
  const preview = useMediaPreview();
  /* 记住上次的参数(没有记录就用默认值) */
  useRememberedSettings("upscale-video", params, (p) => setParams({ ...DEFAULT_VIDEO_PARAMS, ...p }));

  useJobRunner({
    jobs,
    api,
    task: () => "video-upscale",
    onDone: (j) => {
      dispatch({ type: "done", id: j.id });
      say("Your video is upscaled", "success");
    },
    onFail: (j) => {
      dispatch({ type: "fail", id: j.id });
      wallet.refund(j.cost);
      say(FAILED, "error");
    },
  });

  const pickFile = async (file: File | undefined) => {
    if (!file) return;
    if (!isVideoFile(file.name)) return say("This format isn't supported. Use MP4, MOV, WEBM or M4V.", "error");
    const tooBig = sizeProblem(file, "video");
    if (tooBig) return say(tooBig, "error");
    const url = URL.createObjectURL(file);
    const meta = await probeVideo(url);
    if (!meta) return say("We couldn't read this video. Try another file.", "error");
    if (meta.duration > MAX_UPSCALE_SECONDS + 0.5) return say(`Videos can be up to ${MAX_UPSCALE_SECONDS} seconds for now.`, "error");
    const poster = await captureFrame(url);
    setSource({ id: newId(), url, name: file.name, ...meta, poster });
  };

  const out = source ? videoOutputSize(source.width, source.height, params) : null;
  const cost = source && out ? videoUpscaleCredits(out.w, out.h, source.duration) : null;

  const submit = () => {
    if (!source || cost === null) return;
    if (!wallet.charge(cost)) return;
    dispatch({ type: "start", now: nowMs(), jobs: [{ id: newId(), batch: newId(), cost, input: { source, params } }] });
    /* 和 Upscale Image 一样：提交后清掉源视频(左栏回到上传位，可换一条再放大);参数保留 */
    setSource(null);
  };
  const retry = (j: Job) => {
    if (!wallet.charge(j.cost)) return;
    dispatch({ type: "restart", id: j.id, now: nowMs() });
  };
  /* Upscale again:结果当新源视频(原型里结果 = 原视频，尺寸按这次的输出算),倍数回到 2x,其余参数沿用 */
  const upscaleAgain = (j: Job) => {
    const o = videoOutputSize(j.input.source.width, j.input.source.height, j.input.params);
    setSource({ ...j.input.source, id: newId(), name: upscaledName(j), width: o.w, height: o.h });
    setParams({ ...j.input.params, mode: "factor", factor: 2 });
    say("Loaded the result. Pick settings and generate again.", "info");
  };
  const download = async (j: Job) => {
    try {
      const blob = await (await fetch(j.input.source.url)).blob();
      saveBlob(blob, upscaledName(j));
    } catch {
      say("Download failed. Try again.", "error");
    }
  };

  /* ---------- 左栏 ---------- */
  const uploadSlot = source ? (
    <UploadedCard
      kind="video"
      url={source.url}
      poster={source.poster ?? undefined}
      name={source.name}
      meta={`${fmt(source.width)} × ${fmt(source.height)} · ${formatClock(source.duration)}`}
      onReplace={() => fileRef.current?.click()}
      onRemove={() => setSource(null)}
    />
  ) : (
    <SourceUpload
      notify={say}
      kinds={["video"]}
      icon={<Film className="size-4" />}
      title="Upload a video"
      hint={`Click or drop a file here. MP4, MOV, WEBM or M4V, up to ${MAX_UPSCALE_SECONDS}s and ${MAX_MB.video} MB.`}
      dragging={dragging}
      onFiles={(fs) => void pickFile(fs[0])}
    />
  );

  const settings = (
    <>
      {uploadSlot}
      <input
        ref={fileRef}
        type="file"
        accept={ACCEPT_ATTR}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          void pickFile(f);
        }}
      />
      <VideoUpscaleParamsPanel params={params} onChange={set} />
    </>
  );

  const action = (
    <span title={source ? undefined : NO_VIDEO_HINT} className="block">
      <button type="button" onClick={submit} disabled={!source} aria-label={source ? "Generate" : `Generate. ${NO_VIDEO_HINT}`} className={ctaBtn}>
        Generate
        <CtaCost cost={cost} />
      </button>
    </span>
  );

  /* ---------- 右侧：生成历史(最新在上),和 Upscale Image 同一套卡片 ---------- */
  const jobCard = (j: Job) => {
    const o = videoOutputSize(j.input.source.width, j.input.source.height, j.input.params);
    const box = { aspectRatio: `${o.w} / ${o.h}`, maxWidth: `min(100%, ${Math.round((RESULT_MAX_H * o.w) / o.h)}px)` };
    const fav = favorites.has(j.id);
    return (
      <article key={j.id} className="rounded-[22px] border border-[#ececf1] bg-white p-4 shadow-[0_4px_16px_rgba(26,26,46,0.06)]" aria-label={`Upscale video ${videoParamSummary(j.input.params)}`}>
        <header className="relative mb-3">
          {j.input.source.poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={j.input.source.poster} alt="Reference video" className="size-11 rounded-lg object-cover ring-1 ring-[#ececf1]" />
          ) : (
            <span className="grid size-11 place-items-center rounded-lg bg-[#1a1a2e] text-white ring-1 ring-[#ececf1]">
              <Film className="size-4" />
            </span>
          )}
          <p className="mt-2 truncate text-[12.5px] tabular-nums text-[#6a6b7b]">
            <span className="font-semibold text-[#1a1a2e]">SeedVR</span> · {videoParamSummary(j.input.params)}
          </p>
          <button
            type="button"
            aria-label="Delete"
            title={j.status === "running" ? "You can delete it once it's done" : "Delete"}
            disabled={j.status === "running"}
            onClick={() => setConfirmDel(j)}
            className="absolute right-0 top-0 grid size-8 place-items-center rounded-lg text-[#9a9bb0] transition hover:bg-[#fff1f0] hover:text-[#e5484d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40 disabled:cursor-not-allowed disabled:text-[#d4d5de] disabled:hover:bg-transparent disabled:hover:text-[#d4d5de]"
          >
            <Trash2 className="size-4" />
          </button>
        </header>
        {j.status === "running" && (
          <div role="status" aria-label="Generating" className="relative w-full overflow-hidden rounded-2xl" style={box}>
            <div className="gen-anim absolute inset-0" />
            <span className="absolute left-3 top-3 rounded-full bg-white/55 px-2 py-[3px] text-[11px] font-semibold text-[#1a1a2e] backdrop-blur-sm">
              Generating<span>.</span>
              <span className="gg-d2">.</span>
              <span className="gg-d3">.</span>
            </span>
          </div>
        )}
        {j.status === "done" && (
          <div className="w-full">
            <div className="relative w-full" style={{ maxWidth: box.maxWidth }}>
              <video src={j.input.source.url} poster={j.input.source.poster ?? undefined} controls playsInline className="block w-full rounded-2xl bg-black object-cover ring-1 ring-[#ececf1]" style={box} />
              <ExpandButton onClick={() => preview.open({ kind: "video", url: j.input.source.url, poster: j.input.source.poster ?? undefined, alt: `Upscaled ${j.input.source.name}` })} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => void download(j)} className={`${ACTION} max-sm:basis-full sm:min-w-[120px]`}>
                <Download className="size-4" />
                Download
              </button>
              <button type="button" aria-pressed={fav} onClick={() => setFavorites((s) => (s.has(j.id) ? new Set([...s].filter((x) => x !== j.id)) : new Set(s).add(j.id)))} className={ACTION}>
                <Heart className={`size-4 ${fav ? "fill-[#ff5e1a] text-[#ff5e1a]" : ""}`} />
                Favorites
              </button>
              <button type="button" onClick={() => upscaleAgain(j)} className={ACTION}>
                <Scaling className="size-4" />
                Upscale again
              </button>
              <ShareButton
                tool="video-upscale"
                id={j.id}
                title={j.input.source.name}
                build={() => ({ kind: "video", url: j.input.source.url, poster: j.input.source.poster ?? undefined, summary: `SeedVR · ${videoParamSummary(j.input.params)}` })}
                notify={say}
              />
            </div>
          </div>
        )}
        {j.status === "failed" && (
          <div role="alert" className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl bg-[#fff7f5] px-4 py-3.5 text-[13.5px] text-[#e5484d]">
            <CircleAlert className="size-4 shrink-0" />
            <span className="min-w-0 flex-1">{FAILED}</span>
            <button type="button" onClick={() => retry(j)} className="inline-flex items-center gap-1 rounded-lg border border-[#ffd2c8] bg-white px-3 py-1.5 text-[13px] font-semibold text-[#ff5e1a] transition hover:bg-[#fffaf7]">
              <RotateCcw className="size-3.5" /> Retry
            </button>
          </div>
        )}
      </article>
    );
  };

  const results = jobs.length ? <div className="w-full space-y-4 pb-6">{[...jobs].reverse().map(jobCard)}</div> : <VideoUpscaleEmptyDemo />;

  return (
    <ToolLayout
      tool="video-upscale"
      notify={say}
      title="Upscale Video"
      badge="SeedVR"
      subtitle="Sharper video, up to 4K."
      settingsLabel="Upscale video settings"
      credits={wallet.balance}
      onMenu={onMenu}
      onInvite={onInvite}
      dropProps={fileDropProps(setDragging, (f) => void pickFile(f))}
      settings={settings}
      action={action}
      results={results}
    >
      {confirmDel && (
        <ConfirmDeleteDialog
          onCancel={() => setConfirmDel(null)}
          onConfirm={() => {
            dispatch({ type: "remove", id: confirmDel.id });
            unshareResult(confirmDel.id);
            setConfirmDel(null);
            say("Deleted from your results and Assets");
          }}
        />
      )}
      {preview.preview}
    </ToolLayout>
  );
}

/** 下载 / 再放大时的文件名:原名-宽x高.格式 */
function upscaledName(j: Job): string {
  const o = videoOutputSize(j.input.source.width, j.input.source.height, j.input.params);
  return `${j.input.source.name.replace(/\.[a-z0-9]+$/i, "")}-${o.w}x${o.h}.${j.input.params.format}`;
}

/* 空状态：照 Upscale Image(标题 → 描述 → 可拖的前后对比),整体在结果区上下左右居中。
   演示视频是 Monica 给的素材(BuzzVideo 资产库，1920×1080,7.7s,存到 public 里);Before 是同一条视频加模糊模拟低清，两条同时静音循环播放;分割线默认居中 */
const DEMO = { url: "/prototypes/ai-tools/upscale-video-demo.mp4", width: 1920, height: 1080 };

function VideoUpscaleEmptyDemo() {
  const [pos, setPos] = useState(50);
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef(false);
  const before = useRef<HTMLVideoElement>(null);
  const after = useRef<HTMLVideoElement>(null);
  const moveTo = (x: number) => {
    const r = box.current?.getBoundingClientRect();
    if (r && r.width > 0) setPos(Math.min(100, Math.max(0, ((x - r.left) / r.width) * 100)));
  };
  /* 两条视频对齐时间，免得前后画面错开 */
  const sync = () => {
    if (before.current && after.current && Math.abs(before.current.currentTime - after.current.currentTime) > 0.08) before.current.currentTime = after.current.currentTime;
  };
  return (
    <div className="flex min-h-full w-full flex-col items-center justify-center px-6 py-6 text-center">
      <h3 className="text-balance text-[26px] font-extrabold tracking-[-0.02em] text-[#1a1a2e]">AI Video Upscaler</h3>
      <p className="mt-2 max-w-[52ch] text-pretty text-[14px] leading-relaxed text-[#6a6b7b]">Transform low-quality videos into high-resolution with AI-powered enhancement.</p>
      <div
        ref={box}
        onPointerDown={(e) => {
          drag.current = true;
          e.currentTarget.setPointerCapture?.(e.pointerId);
          moveTo(e.clientX);
        }}
        onPointerMove={(e) => drag.current && moveTo(e.clientX)}
        onPointerUp={() => (drag.current = false)}
        onPointerCancel={() => (drag.current = false)}
        className="relative mt-5 w-full cursor-ew-resize touch-pan-y select-none rounded-2xl shadow-[0_18px_40px_rgba(26,26,46,0.16)]"
        style={{ aspectRatio: `${DEMO.width} / ${DEMO.height}`, maxWidth: `min(640px, calc(52vh * ${DEMO.width / DEMO.height}))` }}
      >
        <div className="absolute inset-0 overflow-hidden rounded-2xl bg-black" style={SMOOTH_CLIP}>
        <video ref={after} src={DEMO.url} muted loop playsInline autoPlay onTimeUpdate={sync} className="absolute inset-0 size-full object-cover" />
        <video ref={before} src={DEMO.url} muted loop playsInline autoPlay aria-hidden className="absolute inset-0 size-full object-cover [filter:blur(2.5px)_saturate(0.85)]" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }} />
        <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-[#1a1a2e]/70 px-2 py-[3px] text-[11px] font-semibold text-white">Before</span>
        <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-[#1a1a2e]/70 px-2 py-[3px] text-[11px] font-semibold text-white">After</span>
        <span className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_6px_rgba(26,26,46,0.35)]" style={{ left: `${pos}%` }}>
          <span className="absolute left-1/2 top-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-[#1a1a2e] shadow-[0_2px_8px_rgba(26,26,46,0.25)]">
            <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M6 4 2 8l4 4M10 4l4 4-4 4" />
            </svg>
          </span>
        </span>
        <input
          type="range"
          min={0}
          max={100}
          step={0.5}
          value={pos}
          onChange={(e) => setPos(Number(e.target.value))}
          aria-label="Compare before and after"
          className="pointer-events-none absolute inset-0 size-full appearance-none bg-transparent opacity-0"
        />
        </div>
      </div>
    </div>
  );
}
