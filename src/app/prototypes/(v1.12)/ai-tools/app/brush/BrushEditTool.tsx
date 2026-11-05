"use client";

/* Remove Object + Inpaint 合成画笔页(入口:Image › Remove Object 预选 Remove、Image › Inpaint 预选 Replace;调研第 4 轮)。
   版式同其他工具页(ToolLayout):左栏 = 上传 + 模式 + 笔刷工具(大小 / 画笔 / 橡皮 / 撤销 / 重做 / 清空)+ Replace 的描述 + 积分 + 主按钮;
   右侧 = 画布(原图 + 半透明橙色遮罩层,鼠标 / 手指都能涂)+ 结果列表(Before / After 对比、下载、拿结果接着改)。
   模式在外壳里(view = remove-object / inpaint),页面上切模式 = 切 view,侧边栏选中项跟着变。
   结果是 fixture(brush/render.ts 现算),Download 是真 PNG。积分占位价见 brush/logic.ts。 */

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Brush, CircleAlert, Download, Eraser, ImagePlus, PenLine, Redo2, RotateCcw, Trash2, Undo2, Wand2, X } from "lucide-react";
import { ACCEPTED_TYPES, isAcceptedFile } from "../logic";
import type { ToolsApi } from "../tools/api";
import { jobsReduce, nowMs, type ToolJob, type Wallet } from "../tools/jobs";
import { useJobRunner } from "../tools/useJobRunner";
import { loadImage, saveBlob } from "../tools/media";
import type { Notify } from "../components/TopToast";
import { CompareSlider } from "../components/ResultCard";
import { EmptyResults, FIELD, FieldLabel, RunningTile, Segmented, SliderRow, ToolLayout, UploadDrop, ctaBtn, fileDropProps, ghostBtn, CtaCost } from "../components/ToolKit";
import {
  BRUSH_DEFAULT,
  BRUSH_MAX,
  BRUSH_MIN,
  BRUSH_MODELS,
  EMPTY_MASK,
  LARGE_COVERAGE,
  PROMPT_MAX,
  brushBlocker,
  brushCredits,
  brushFileName,
  brushSize,
  maskReduce,
  type BrushMode,
  type Stroke,
} from "./logic";
import { drawStrokes, fixtureResult, maskCoverage } from "./render";

type Source = { url: string; name: string; width: number; height: number };
type Input = { source: Source; mode: BrushMode; prompt: string; resultUrl: string };
type Job = ToolJob<Input>;

const ACCEPT_ATTR = ACCEPTED_TYPES.map((t) => `.${t}`).join(",");
const SAMPLE: Source = { url: "/prototypes/ai-tools/demo-after.png", name: "portrait.png", width: 1376, height: 768 };
const UNSUPPORTED = "This format isn't supported. Use JPG, PNG, WEBP, GIF, AVIF or HEIC.";
const UNREADABLE = "We couldn't read this image. Try another file.";
const FAILED = "Editing failed. Your credits have been refunded.";
const MASK_COLOR = "#ff5e1a";

const MODE_OPTIONS = [
  { value: "remove", label: "Remove", title: "Erase what you brush — no prompt needed" },
  { value: "replace", label: "Replace", title: "Brush an area and describe what goes there" },
] as const;
const MODE_COPY: Record<BrushMode, { title: string; subtitle: string; cta: string; running: string; done: string }> = {
  remove: {
    title: "Remove Object",
    subtitle: "Brush over anything you don't want — it disappears cleanly.",
    cta: "Remove",
    running: "Generating",
    done: "Object removed",
  },
  replace: {
    title: "Inpaint",
    subtitle: "Brush an area and describe what should be there instead.",
    cta: "Replace",
    running: "Generating",
    done: "Area replaced",
  },
};

const newId = () => `be-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const fmt = (n: number) => n.toLocaleString("en-US");

/* ---------- 画布:原图 + 遮罩层 ---------- */
function BrushCanvas({
  source,
  strokes,
  size,
  tool,
  onStroke,
  onUndo,
  onRedo,
  onSize,
}: {
  source: Source;
  strokes: Stroke[];
  /** 笔刷直径(占图片宽度的比例) */
  size: number;
  tool: "paint" | "erase";
  onStroke: (s: Stroke) => void;
  onUndo: () => void;
  onRedo: () => void;
  onSize: (delta: number) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const live = useRef<Stroke | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [boxW, setBoxW] = useState(0);
  const ratio = source.width / source.height;

  const redraw = useCallback(() => {
    const c = canvasRef.current;
    const box = boxRef.current;
    if (!c || !box) return;
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(1, Math.round(box.clientWidth * dpr));
    const h = Math.max(1, Math.round(box.clientHeight * dpr));
    if (c.width !== w || c.height !== h) {
      c.width = w;
      c.height = h;
    }
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    drawStrokes(ctx, live.current ? [...strokes, live.current] : strokes, w, h, MASK_COLOR);
  }, [strokes]);

  useEffect(() => {
    redraw();
    const box = boxRef.current;
    if (!box) return;
    const ro = new ResizeObserver(() => {
      setBoxW(box.clientWidth);
      redraw();
    });
    ro.observe(box);
    return () => ro.disconnect();
  }, [redraw]);

  const at = (e: React.PointerEvent): [number, number] => {
    const r = boxRef.current!.getBoundingClientRect();
    return [Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))];
  };
  const onDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* 没有可捕获的指针(如合成事件)也照样能画 */
    }
    live.current = { kind: tool, size, points: [at(e)] };
    redraw();
  };
  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse") {
      const r = boxRef.current!.getBoundingClientRect();
      setCursor({ x: e.clientX - r.left, y: e.clientY - r.top });
    }
    const s = live.current;
    if (!s) return;
    const p = at(e);
    const last = s.points[s.points.length - 1];
    /* 太近的点不记(省点数,线也更顺) */
    if (Math.hypot((p[0] - last[0]) * ratio, p[1] - last[1]) < 0.003) return;
    s.points.push(p);
    redraw();
  };
  const onUp = () => {
    const s = live.current;
    live.current = null;
    if (s) onStroke(s);
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === "z") {
      e.preventDefault();
      if (e.shiftKey) onRedo();
      else onUndo();
    } else if (e.key === "[" || e.key === "]") {
      e.preventDefault();
      onSize(e.key === "]" ? 5 : -5);
    }
  };

  const diameter = size * boxW;
  return (
    <div
      ref={boxRef}
      tabIndex={0}
      role="application"
      aria-label={`Image canvas. ${tool === "paint" ? "Brush" : "Eraser"} active. Drag to ${tool === "paint" ? "paint the mask" : "erase the mask"}. Cmd or Ctrl+Z to undo, [ and ] to change brush size.`}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onPointerLeave={() => setCursor(null)}
      onKeyDown={onKeyDown}
      className="relative mx-auto touch-none select-none overflow-hidden rounded-2xl bg-[#f1f2f5] outline-none ring-1 ring-[#ececf1] focus-visible:ring-2 focus-visible:ring-[#ff5e1a]"
      style={{ aspectRatio: `${source.width} / ${source.height}`, width: `min(100%, ${Math.round(520 * ratio)}px)`, cursor: "none" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={source.url} alt={source.name} draggable={false} className="pointer-events-none absolute inset-0 size-full object-cover" />
      {/* 遮罩层整体半透明:笔画重叠处不会更深 */}
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 size-full opacity-55" />
      {cursor && (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute rounded-full border-2 ${tool === "paint" ? "border-white bg-[#ff5e1a]/20" : "border-white bg-white/10"} shadow-[0_0_0_1px_rgba(26,26,46,0.45)]`}
          style={{ left: cursor.x - diameter / 2, top: cursor.y - diameter / 2, width: diameter, height: diameter }}
        />
      )}
    </div>
  );
}

/* ---------- 结果卡 ---------- */
function ResultItem({ job, onRetry, onDownload, onReuse }: { job: Job; onRetry: () => void; onDownload: () => void; onReuse: () => void }) {
  const { source, mode, prompt } = job.input;
  return (
    <article className="rounded-[22px] border border-[#ececf1] bg-white p-4 shadow-[0_4px_16px_rgba(26,26,46,0.06)]" aria-label={`${MODE_COPY[mode].title} result`}>
      <header className="mb-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#fff3ec] px-2 py-[2px] text-[11.5px] font-bold text-[#ff5e1a]">
          {mode === "remove" ? <Eraser className="size-3" /> : <PenLine className="size-3" />}
          {mode === "remove" ? "Removed" : "Replaced"}
        </span>
        {mode === "replace" && (
          <span className="min-w-0 flex-1 truncate text-[13px] text-[#4a4b5c]" title={prompt}>
            “{prompt}”
          </span>
        )}
        <span className="ml-auto text-[12px] tabular-nums text-[#9a9bb0]">
          {fmt(source.width)} × {fmt(source.height)} px
        </span>
      </header>
      {job.status === "done" ? (
        <>
          <CompareSlider before={source.url} after={{ url: job.input.resultUrl, width: source.width, height: source.height }} afterAlt="Edited result" />
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={onDownload} className={`${ghostBtn} h-9 max-sm:flex-1`}>
              <Download className="size-4" /> Download
            </button>
            <button type="button" onClick={onReuse} className={`${ghostBtn} h-9 max-sm:flex-1`} title="Use this result as the new image and keep editing">
              <Wand2 className="size-4" /> Edit this result
            </button>
          </div>
        </>
      ) : (
        <div
          className="relative mx-auto w-full overflow-hidden rounded-2xl bg-[#f1f2f5]"
          style={{ aspectRatio: `${source.width} / ${source.height}`, maxWidth: `min(100%, ${Math.round((560 * source.width) / source.height)}px)` }}
        >
          {job.status === "running" ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={source.url} alt="" className="absolute inset-0 size-full object-cover opacity-40" />
              <RunningTile label={MODE_COPY[mode].running} />
            </>
          ) : (
            <div role="alert" className="absolute inset-0 grid place-items-center bg-[#fff7f5] px-4 text-center">
              <div className="space-y-2">
                <CircleAlert className="mx-auto size-5 text-[#e5484d]" />
                <p className="text-[13px] text-[#e5484d]">{FAILED}</p>
                <button type="button" onClick={onRetry} className={`${ghostBtn} h-8 text-[#ff5e1a]`}>
                  <RotateCcw className="size-3.5" /> Retry
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export function BrushEditTool({
  api,
  wallet,
  mode,
  onMode,
  notify: say,
  onMenu,
  onInvite,
}: {
  api: ToolsApi;
  wallet: Wallet;
  mode: BrushMode;
  /** 页面上切模式 = 外壳切 view(侧边栏选中项跟着变) */
  onMode: (m: BrushMode) => void;
  notify: Notify;
  onMenu?: () => void;
  onInvite?: () => void;
}) {
  const [source, setSource] = useState<Source | null>(null);
  /** 当前原图的 <img>(fixture 结果要在 canvas 上画它) */
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null);
  const [mask, dispatchMask] = useReducer(maskReduce, EMPTY_MASK);
  const [level, setLevel] = useState(BRUSH_DEFAULT);
  const [tool, setTool] = useState<"paint" | "erase">("paint");
  const [prompt, setPrompt] = useState("");
  const [jobs, dispatch] = useReducer(jobsReduce<Input>, []);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  useJobRunner({
    jobs,
    api,
    task: (j) => (j.input.mode === "remove" ? "erase" : "inpaint"),
    onDone: (j) => {
      dispatch({ type: "done", id: j.id });
      say(MODE_COPY[j.input.mode].done, "success");
    },
    onFail: (j) => {
      dispatch({ type: "fail", id: j.id });
      wallet.refund(j.cost);
      say(FAILED, "error");
    },
  });

  const coverage = useMemo(() => (source ? maskCoverage(mask.strokes, source.width, source.height) : 0), [mask.strokes, source]);
  const cost = source ? brushCredits(mode, coverage, source.width, source.height) : null;
  const blocker = brushBlocker({ hasImage: !!source, coverage, mode, prompt });

  const loadSource = async (s: Omit<Source, "width" | "height">) => {
    try {
      const img = await loadImage(s.url);
      setImgEl(img);
      setSource({ ...s, width: img.naturalWidth, height: img.naturalHeight });
      dispatchMask({ type: "reset" });
    } catch {
      say(UNREADABLE, "error");
    }
  };
  const pickFile = (file: File | undefined) => {
    if (!file) return;
    if (!isAcceptedFile(file.name)) return say(UNSUPPORTED, "error");
    void loadSource({ url: URL.createObjectURL(file), name: file.name });
  };

  const generate = () => {
    if (blocker || !source || cost === null || !imgEl) return;
    if (!wallet.charge(cost)) return;
    let resultUrl = source.url;
    try {
      resultUrl = fixtureResult(imgEl, mask.strokes, mode, prompt);
    } catch {
      /* 画不出来(如跨域图)就用原图,不影响流程演示 */
    }
    dispatch({ type: "start", now: nowMs(), jobs: [{ id: newId(), batch: newId(), cost, input: { source, mode, prompt: prompt.trim(), resultUrl } }] });
    requestAnimationFrame(() => document.getElementById("brush-results")?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  };

  const retry = (j: Job) => {
    if (!wallet.charge(j.cost)) return;
    dispatch({ type: "restart", id: j.id, now: nowMs() });
  };

  const download = async (j: Job) => {
    try {
      const blob = await (await fetch(j.input.resultUrl)).blob();
      saveBlob(blob, brushFileName(j.input.source.name, j.input.mode));
    } catch {
      say("Download failed — try again", "error", () => void download(j));
    }
  };

  /* 拿结果接着改:结果图当新的原图,遮罩清空,回到画布 */
  const reuse = (j: Job) => {
    void loadSource({ url: j.input.resultUrl, name: brushFileName(j.input.source.name, j.input.mode) });
    document.getElementById("brush-canvas")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    panelRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  };

  const copy = MODE_COPY[mode];

  /* ---------- 左栏 ---------- */
  const uploadSlot = source ? (
    <div className="flex items-center gap-3 rounded-xl border border-[#ececf1] bg-white p-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={source.url} alt="" className="size-12 shrink-0 rounded-lg object-cover ring-1 ring-[#ececf1]" />
      <div className="min-w-0 flex-1 text-[12.5px]">
        <p className="truncate font-semibold text-[#1a1a2e]" title={source.name}>
          {source.name}
        </p>
        <p className="tabular-nums text-[#9a9bb0]">
          {fmt(source.width)} × {fmt(source.height)} px
        </p>
      </div>
      <button type="button" onClick={() => fileRef.current?.click()} className="shrink-0 text-[12.5px] font-semibold text-[#ff5e1a] hover:underline">
        Replace
      </button>
      <button
        type="button"
        aria-label="Remove image"
        onClick={() => {
          setSource(null);
          dispatchMask({ type: "reset" });
        }}
        className="grid size-7 shrink-0 place-items-center rounded-full text-[#6a6b7b] transition hover:bg-[#f3f4f6] hover:text-[#1a1a2e]"
      >
        <X className="size-4" />
      </button>
    </div>
  ) : (
    <UploadDrop
      icon={<ImagePlus className="size-5" strokeWidth={1.8} />}
      title="Upload an image"
      hint="Click or drop a file here. JPG, PNG, WEBP, GIF, AVIF or HEIC."
      dragging={dragging}
      onPick={() => fileRef.current?.click()}
    />
  );

  const iconBtn = `${ghostBtn} size-9 shrink-0 px-0`;
  const toolBtn = (t: "paint" | "erase", label: string, Icon: typeof Brush) => (
    <button
      type="button"
      aria-pressed={tool === t}
      onClick={() => setTool(t)}
      className={`inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border text-[13px] font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40 ${
        tool === t ? "border-[#ffbd99] bg-[#fff3ec] text-[#ff5e1a]" : "border-[#e1e3e9] bg-white text-[#1a1a2e] hover:border-[#c9cad4]"
      }`}
    >
      <Icon className="size-4" /> {label}
    </button>
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
          pickFile(f);
        }}
      />
      <div>
        <FieldLabel>Mode</FieldLabel>
        <Segmented label="Edit mode" value={mode} options={MODE_OPTIONS} onChange={onMode} />
        <p className="mt-2 text-[12px] leading-relaxed text-[#9a9bb0]">
          {mode === "remove" ? "Brush over the object. We fill it in with the surrounding background." : "Brush over the area, then describe what should be there."}
        </p>
      </div>
      <div className={source ? "" : "pointer-events-none opacity-45"} aria-disabled={!source}>
        <FieldLabel>Brush</FieldLabel>
        <div className="flex gap-1.5">
          {toolBtn("paint", "Brush", Brush)}
          {toolBtn("erase", "Eraser", Eraser)}
        </div>
        <div className="mt-3">
          <SliderRow label="Brush size" value={level} display={String(level)} min={BRUSH_MIN} max={BRUSH_MAX} onChange={setLevel} />
        </div>
        <div className="mt-3 flex gap-1.5">
          <button type="button" onClick={() => dispatchMask({ type: "undo" })} disabled={!mask.past.length} className={iconBtn} aria-label="Undo" title="Undo (Cmd/Ctrl+Z)">
            <Undo2 className="size-4" />
          </button>
          <button type="button" onClick={() => dispatchMask({ type: "redo" })} disabled={!mask.future.length} className={iconBtn} aria-label="Redo" title="Redo (Shift+Cmd/Ctrl+Z)">
            <Redo2 className="size-4" />
          </button>
          <button type="button" onClick={() => dispatchMask({ type: "clear" })} disabled={!mask.strokes.length} className={`${ghostBtn} h-9 flex-1`}>
            <Trash2 className="size-4" /> Clear mask
          </button>
        </div>
      </div>
      {mode === "replace" && (
        <div>
          <FieldLabel hint={`${prompt.length}/${PROMPT_MAX}`}>What should go here?</FieldLabel>
          <textarea
            value={prompt}
            maxLength={PROMPT_MAX}
            rows={3}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. a small potted plant on the table"
            aria-label="What should go here?"
            className={`${FIELD} w-full resize-none px-3 py-2 leading-relaxed`}
          />
        </div>
      )}
      <p className="text-[11.5px] text-[#9a9bb0]">Model: {BRUSH_MODELS[mode]}</p>
    </>
  );

  const action = (
    <>
      <span title={blocker ?? undefined} className="block">
        <button type="button" onClick={generate} disabled={!!blocker} className={ctaBtn} aria-label={blocker ? `${copy.cta}. ${blocker}` : undefined}>
          {copy.cta}
          <CtaCost cost={cost} />
        </button>
      </span>
      {blocker && source && <p className="text-center text-[12px] text-[#9a9bb0]">{blocker}</p>}
    </>
  );

  /* ---------- 右侧:画布 + 结果 ---------- */
  const results = !source && !jobs.length ? (
    <EmptyResults
      icon={mode === "remove" ? <Eraser className="size-5" strokeWidth={1.8} /> : <PenLine className="size-5" strokeWidth={1.8} />}
      title={mode === "remove" ? "Brush it out" : "Brush an area, describe the change"}
      body={
        mode === "remove"
          ? "Upload an image, paint over a person, logo or clutter, and it's gone — no prompt needed."
          : "Upload an image, paint the area you want to change, and tell us what should be there."
      }
    />
  ) : (
    <div className="mx-auto w-full max-w-[880px] space-y-4 pb-6">
      {source && (
        <section id="brush-canvas" aria-label="Canvas" className="rounded-[22px] border border-[#ececf1] bg-[#FAFBFC] p-3 sm:p-4">
          <BrushCanvas
            source={source}
            strokes={mask.strokes}
            size={brushSize(level)}
            tool={tool}
            onStroke={(s) => dispatchMask({ type: "add", stroke: s })}
            onUndo={() => dispatchMask({ type: "undo" })}
            onRedo={() => dispatchMask({ type: "redo" })}
            onSize={(d) => setLevel((l) => Math.min(BRUSH_MAX, Math.max(BRUSH_MIN, l + d)))}
          />
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[12px]">
            <span className="text-[#6a6b7b]">
              {mask.strokes.length ? (
                <>
                  Mask covers <span className="font-semibold tabular-nums text-[#1a1a2e]">{Math.max(1, Math.round(coverage * 100))}%</span> of the image
                </>
              ) : source.url === SAMPLE.url ? (
                "Try brushing over the white circle behind her."
              ) : (
                "Drag on the image to paint the area."
              )}
            </span>
            {coverage > LARGE_COVERAGE && <span className="text-[#b45309]">Large areas may look less natural.</span>}
          </div>
        </section>
      )}
      {jobs.length > 0 && (
        <div id="brush-results" className="space-y-4">
          <h3 className="px-1 text-[13.5px] font-bold text-[#1a1a2e]">Results</h3>
          {[...jobs].reverse().map((j) => (
            <ResultItem key={j.id} job={j} onRetry={() => retry(j)} onDownload={() => void download(j)} onReuse={() => reuse(j)} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <ToolLayout
      title={copy.title}
      subtitle={copy.subtitle}
      settingsLabel={`${copy.title} settings`}
      credits={wallet.balance}
      onMenu={onMenu}
      onInvite={onInvite}
      panelRef={panelRef}
      dragging={dragging}
      dropProps={fileDropProps(setDragging, pickFile)}
      settings={settings}
      action={action}
      results={results}
      resultsLabel={source ? "Canvas" : "Results"}
      resultsMeta={source && <span className="text-[12px] text-[#9a9bb0] max-sm:hidden">Drag to paint · [ ] brush size · ⌘Z undo</span>}
    />
  );
}
