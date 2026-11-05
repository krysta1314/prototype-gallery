"use client";

/* Virtual Try-On 工具页,含 Model Swap 模式(入口:Image › Virtual Try-On 预选 Try-On、Image › Model Swap 预选 Model Swap;调研第 4 轮,FASHN v1.6)。
   版式同其他工具页(ToolLayout)。左栏:模式 → 两个上传位(Try-On:Person + Garment;Model Swap:Source photo + New model)
   → Try-On 选服装类别(Tops / Bottoms / One-piece)和服装照类型(Flat-lay / On model);Model Swap 只选类别(类型固定 On model)
   → 每次出几张(1–4)→ 积分 → 主按钮。右侧:每次生成一组结果(最新在上),每张 Download / 拿去接着用。
   模式在外壳里(view = virtual-try-on / model-swap),页面上切模式 = 切 view。结果是 fixture(tryon/fixture.ts 现画),Download 是真 JPG。 */

import { useReducer, useRef, useState } from "react";
import { ArrowRight, CircleAlert, Download, Repeat2, RotateCcw, Shirt, TriangleAlert, UserRound, X } from "lucide-react";
import { ACCEPTED_TYPES, isAcceptedFile } from "../logic";
import type { ToolsApi } from "../tools/api";
import { groupBatches, jobsReduce, nowMs, type ToolJob, type Wallet } from "../tools/jobs";
import { useJobRunner } from "../tools/useJobRunner";
import { loadImage, saveBlob } from "../tools/media";
import type { Notify } from "../components/TopToast";
import { EmptyResults, FieldLabel, RunningTile, Segmented, ToolLayout, UploadDrop, ctaBtn, fileDropProps, ghostBtn, CtaCost } from "../components/ToolKit";
import {
  CATEGORY_OPTIONS,
  FASHN_MODEL,
  PHOTO_TYPE_OPTIONS,
  SAMPLES_MAX,
  SLOT_COPY,
  framingWarning,
  garmentOf,
  tryOnBlocker,
  tryOnCredits,
  tryOnFileName,
  wearerOf,
  type GarmentCategory,
  type GarmentPhotoType,
  type SlotImage,
  type TryOnMode,
} from "./logic";
import { garmentFocus, renderTryOn } from "./fixture";

type Slot = SlotImage & { width: number; height: number };
type Input = { mode: TryOnMode; a: Slot; b: Slot; category: GarmentCategory; photoType: GarmentPhotoType; variant: number; resultUrl: string | null };
type Job = ToolJob<Input>;
type SlotKey = "a" | "b";

const ACCEPT_ATTR = ACCEPTED_TYPES.map((t) => `.${t}`).join(",");
const UNSUPPORTED = "This format isn't supported. Use JPG, PNG, WEBP, GIF, AVIF or HEIC.";
const UNREADABLE = "We couldn't read this image. Try another file.";
const FAILED = "Generation failed. Your credits have been refunded.";

const MODE_OPTIONS = [
  { value: "try-on", label: "Try-On", title: "Put a garment on a person" },
  { value: "model-swap", label: "Model Swap", title: "Keep the outfit, change the model" },
] as const;
const SAMPLE_OPTIONS = [1, 2, 3, 4].map((n) => ({ value: String(n), label: String(n) }));
const CATEGORY_LABEL: Record<GarmentCategory, string> = { tops: "Tops", bottoms: "Bottoms", "one-pieces": "One-piece" };

const MODE_COPY: Record<TryOnMode, { title: string; subtitle: string; cta: string; done: string }> = {
  "try-on": { title: "Virtual Try-On", subtitle: "See any garment on any model — no photoshoot.", cta: "Try it on", done: "Your try-on is ready" },
  "model-swap": { title: "Model Swap", subtitle: "Keep the outfit, swap in a new model.", cta: "Swap model", done: "Your model swap is ready" },
};

const newId = () => `to-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

/* ---------- 上传位(两个并排) ---------- */
function ImageSlot({
  label,
  hint,
  icon,
  image,
  garment = false,
  onPick,
  onFile,
  onClear,
}: {
  /** 这一位提供衣服:缩略图对准衣服 */
  garment?: boolean;
  label: string;
  hint: string;
  icon: React.ReactNode;
  image: Slot | null;
  onPick: () => void;
  onFile: (f: File | undefined) => void;
  onClear: () => void;
}) {
  const [over, setOver] = useState(false);
  const drop = {
    onDragOver: (e: React.DragEvent) => {
      if (!Array.from(e.dataTransfer.types).includes("Files")) return;
      e.preventDefault();
      e.stopPropagation();
      setOver(true);
    },
    onDragLeave: () => setOver(false),
    onDrop: (e: React.DragEvent) => {
      if (!Array.from(e.dataTransfer.types).includes("Files")) return;
      e.preventDefault();
      e.stopPropagation();
      setOver(false);
      onFile(e.dataTransfer.files[0]);
    },
  };
  return (
    <div className="min-w-0">
      <FieldLabel>{label}</FieldLabel>
      {image ? (
        <div className="group relative h-[136px] overflow-hidden rounded-xl bg-[#f1f2f5] ring-1 ring-[#ececf1]" {...drop}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.url}
            alt={`${label}: ${image.name}`}
            className="absolute inset-0 size-full object-cover"
            style={garment ? { objectPosition: garmentFocus(image.url) } : undefined}
          />
          <button
            type="button"
            aria-label={`Remove ${label.toLowerCase()}`}
            onClick={onClear}
            className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-[#1a1a2e]/70 text-white transition hover:bg-[#1a1a2e]"
          >
            <X className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={onPick}
            className="absolute inset-x-1.5 bottom-1.5 rounded-lg bg-white/90 py-1 text-[12px] font-semibold text-[#1a1a2e] backdrop-blur transition hover:bg-white"
          >
            Replace
          </button>
          {over && <div className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-inset ring-[#ff5e1a]" />}
        </div>
      ) : (
        <div {...drop}>
          <UploadDrop icon={icon} title={`Upload ${label.toLowerCase()}`} hint={`${hint.replace(/\.?$/, ".")} Or drop it here.`} dragging={over} onPick={onPick} />
        </div>
      )}
    </div>
  );
}

/* ---------- 一张结果 ---------- */
function ResultTile({ job, index, onRetry, onDownload, onReuse }: { job: Job; index: number; onRetry: () => void; onDownload: () => void; onReuse: () => void }) {
  const wearer = wearerOf(job.input.mode, job.input.a, job.input.b);
  const ready = job.status === "done" && job.input.resultUrl;
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="relative overflow-hidden rounded-xl bg-[#f1f2f5] ring-1 ring-[#ececf1]" style={{ aspectRatio: `${wearer.width} / ${wearer.height}` }}>
        {ready ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={job.input.resultUrl!} alt={`Result ${index + 1}`} className="absolute inset-0 size-full object-cover" />
        ) : job.status === "failed" ? (
          <div role="alert" className="absolute inset-0 grid place-items-center bg-[#fff7f5] px-3 text-center">
            <div className="space-y-2">
              <CircleAlert className="mx-auto size-5 text-[#e5484d]" />
              <p className="text-[12px] leading-snug text-[#e5484d]">{FAILED}</p>
              <button type="button" onClick={onRetry} className={`${ghostBtn} h-8 text-[#ff5e1a]`}>
                <RotateCcw className="size-3.5" /> Retry
              </button>
            </div>
          </div>
        ) : (
          <RunningTile label="Generating" />
        )}
      </div>
      {ready && (
        <div className="flex gap-1.5">
          <button type="button" onClick={onDownload} className={`${ghostBtn} h-8 min-w-0 flex-1 px-2`} aria-label={`Download result ${index + 1}`}>
            <Download className="size-3.5" /> Download
          </button>
          <button
            type="button"
            onClick={onReuse}
            className={`${ghostBtn} h-8 px-2.5`}
            title={job.input.mode === "try-on" ? "Use as the person photo" : "Use as the source photo"}
            aria-label={job.input.mode === "try-on" ? `Use result ${index + 1} as the person photo` : `Use result ${index + 1} as the source photo`}
          >
            <Repeat2 className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export function TryOnTool({
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
  mode: TryOnMode;
  onMode: (m: TryOnMode) => void;
  notify: Notify;
  onMenu?: () => void;
  onInvite?: () => void;
}) {
  /* 两种模式各记各的两张图:来回切不丢 */
  const [slots, setSlots] = useState<Record<TryOnMode, { a: Slot | null; b: Slot | null }>>({
    "try-on": { a: null, b: null },
    "model-swap": { a: null, b: null },
  });
  const [category, setCategory] = useState<GarmentCategory>("tops");
  const [photoType, setPhotoType] = useState<GarmentPhotoType>("flat-lay");
  const [samples, setSamples] = useState(2);
  const [jobs, dispatch] = useReducer(jobsReduce<Input>, []);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const target = useRef<SlotKey>("a");

  const { a, b } = slots[mode];
  const copy = SLOT_COPY[mode];

  useJobRunner({
    jobs,
    api,
    task: () => "try-on",
    onDone: (j) => {
      dispatch({ type: "done", id: j.id });
      /* 同组最后一张完成时提示一次 */
      const rest = jobs.filter((x) => x.batch === j.batch && x.id !== j.id && x.status === "running");
      if (!rest.length) say(MODE_COPY[j.input.mode].done, "success");
    },
    onFail: (j) => {
      dispatch({ type: "fail", id: j.id });
      wallet.refund(j.cost);
      say(FAILED, "error");
    },
  });

  const setSlot = (m: TryOnMode, k: SlotKey, v: Slot | null) => setSlots((s) => ({ ...s, [m]: { ...s[m], [k]: v } }));

  const load = async (k: SlotKey, img: SlotImage, photo?: GarmentPhotoType) => {
    try {
      const el = await loadImage(img.url);
      setSlot(mode, k, { ...img, width: el.naturalWidth, height: el.naturalHeight });
      if (photo && mode === "try-on" && k === "b") setPhotoType(photo);
    } catch {
      say(UNREADABLE, "error");
    }
  };
  const pickFile = (k: SlotKey, file: File | undefined) => {
    if (!file) return;
    if (!isAcceptedFile(file.name)) return say(UNSUPPORTED, "error");
    void load(k, { url: URL.createObjectURL(file), name: file.name, framing: "unknown" });
  };
  const openPicker = (k: SlotKey) => {
    target.current = k;
    fileRef.current?.click();
  };

  const blocker = tryOnBlocker(mode, a, b);
  const cost = a && b ? tryOnCredits(samples) : null;
  const warn = framingWarning(category, mode === "try-on" ? a : b);
  const effPhotoType: GarmentPhotoType = mode === "model-swap" ? "model" : photoType;

  const startRender = (j: { id: string; input: Input }) => {
    const { mode: m, a: sa, b: sb } = j.input;
    renderTryOn(wearerOf(m, sa, sb).url, garmentOf(m, sa, sb).url, j.input.photoType, j.input.variant)
      .then((url) => dispatch({ type: "patch", id: j.id, input: { ...j.input, resultUrl: url } }))
      .catch(() => dispatch({ type: "patch", id: j.id, input: { ...j.input, resultUrl: wearerOf(m, sa, sb).url } }));
  };

  const generate = () => {
    if (blocker || !a || !b || cost === null) return;
    if (!wallet.charge(cost)) return;
    const batch = newId();
    const list = Array.from({ length: samples }, (_, i) => ({
      id: newId(),
      batch,
      cost: tryOnCredits(1),
      input: { mode, a, b, category, photoType: effPhotoType, variant: i, resultUrl: null } as Input,
    }));
    dispatch({ type: "start", now: nowMs(), jobs: list });
    list.forEach(startRender);
    requestAnimationFrame(() => document.getElementById("tryon-results")?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  };

  const retry = (j: Job) => {
    if (!wallet.charge(j.cost)) return;
    dispatch({ type: "restart", id: j.id, now: nowMs() });
  };

  const download = async (j: Job, i: number) => {
    try {
      const blob = await (await fetch(j.input.resultUrl!)).blob();
      saveBlob(blob, tryOnFileName(j.input.mode, i));
    } catch {
      say("Download failed — try again", "error", () => void download(j, i));
    }
  };

  /* 拿结果接着用:Try-On → 当人物照(再试下一件);Model Swap → 当原图 */
  const reuse = (j: Job, i: number) => {
    const w = wearerOf(j.input.mode, j.input.a, j.input.b);
    setSlot(j.input.mode, "a", { url: j.input.resultUrl!, name: tryOnFileName(j.input.mode, i), framing: w.framing, width: w.width, height: w.height });
    if (j.input.mode !== mode) onMode(j.input.mode);
    say(j.input.mode === "try-on" ? "Added as the person photo" : "Added as the source photo", "info");
  };

  /* ---------- 左栏 ---------- */
  const settings = (
    <>
      <div>
        <Segmented label="Mode" value={mode} options={MODE_OPTIONS} onChange={onMode} />
        <p className="mt-2 text-[12px] leading-relaxed text-[#9a9bb0]">
          {mode === "try-on" ? "Upload a person and a garment — we dress them in it." : "Upload a photo of the outfit and a new model — the outfit moves to them."}
        </p>
      </div>
      <div>
        {/* 2026-11-05:两个上传位上下排，空着时用共用上传框(和 Upscale Image 同高同宽) */}
        <div className="space-y-4">
          <ImageSlot
            label={copy.a.label}
            hint={copy.a.hint}
            icon={mode === "try-on" ? <UserRound className="size-[18px]" /> : <Shirt className="size-[18px]" />}
            image={a}
            garment={mode === "model-swap"}
            onPick={() => openPicker("a")}
            onFile={(f) => pickFile("a", f)}
            onClear={() => setSlot(mode, "a", null)}
          />
          <ImageSlot
            label={copy.b.label}
            hint={copy.b.hint}
            icon={mode === "try-on" ? <Shirt className="size-[18px]" /> : <UserRound className="size-[18px]" />}
            image={b}
            garment={mode === "try-on"}
            onPick={() => openPicker("b")}
            onFile={(f) => pickFile("b", f)}
            onClear={() => setSlot(mode, "b", null)}
          />
        </div>
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT_ATTR}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            pickFile(target.current, f);
          }}
        />
      </div>
      <div>
        <FieldLabel>Garment Category</FieldLabel>
        <Segmented label="Garment category" value={category} options={CATEGORY_OPTIONS} onChange={setCategory} />
        {warn && (
          <p className="mt-2 flex items-start gap-1 text-[12px] leading-snug text-[#b45309]">
            <TriangleAlert className="mt-px size-3.5 shrink-0" />
            {warn}
          </p>
        )}
      </div>
      {mode === "try-on" ? (
        <div>
          <FieldLabel>Garment Photo</FieldLabel>
          <Segmented label="Garment photo type" value={photoType} options={PHOTO_TYPE_OPTIONS} onChange={setPhotoType} />
          <p className="mt-2 text-[12px] leading-relaxed text-[#9a9bb0]">
            {photoType === "flat-lay" ? "The garment on its own — laid flat or on a hanger." : "Someone is already wearing it. We take only the garment."}
          </p>
        </div>
      ) : (
        <p className="rounded-xl bg-[#f7f8fa] px-3 py-2.5 text-[12px] leading-relaxed text-[#6a6b7b]">
          The outfit is taken from the source photo. The new model keeps their face, body and pose.
        </p>
      )}
      <div>
        <FieldLabel hint={`Up to ${SAMPLES_MAX}`}>Results</FieldLabel>
        <Segmented label="Number of results" value={String(samples)} options={SAMPLE_OPTIONS} onChange={(v) => setSamples(Number(v))} />
      </div>
      <p className="text-[11.5px] text-[#9a9bb0]">Model: {FASHN_MODEL}</p>
    </>
  );

  const action = (
    <>
      <span title={blocker ?? undefined} className="block">
        <button type="button" onClick={generate} disabled={!!blocker} className={ctaBtn} aria-label={blocker ? `${MODE_COPY[mode].cta}. ${blocker}` : undefined}>
          {MODE_COPY[mode].cta}
          <CtaCost cost={cost} />
        </button>
      </span>
    </>
  );

  /* ---------- 右侧结果 ---------- */
  const batches = groupBatches(jobs);
  const results = !jobs.length ? (
    <EmptyResults
      icon={mode === "try-on" ? <Shirt className="size-5" strokeWidth={1.8} /> : <Repeat2 className="size-5" strokeWidth={1.8} />}
      title={mode === "try-on" ? "Dress any model in your product" : "Same outfit, different model"}
      body={
        mode === "try-on"
          ? "Add a person and a garment photo. You'll get up to 4 takes to pick from."
          : "Add a photo of the outfit and the new model. Great for showing one look on different people."
      }
    />
  ) : (
    <div id="tryon-results" className="mx-auto w-full max-w-[880px] space-y-4 pb-6">
      {batches.map(({ batch, jobs: list }) => {
        const first = list[0].input;
        const cols = list.length === 1 ? "grid-cols-1 max-w-[340px]" : list.length === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4";
        return (
          <article key={batch} className="rounded-[22px] border border-[#ececf1] bg-white p-4 shadow-[0_4px_16px_rgba(26,26,46,0.06)]" aria-label={`${MODE_COPY[first.mode].title} results`}>
            <header className="mb-3 flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={first.a.url} alt="" className="size-9 rounded-lg object-cover ring-1 ring-[#ececf1]" />
                <ArrowRight className="size-3.5 text-[#c9cad4]" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={first.b.url} alt="" className="size-9 rounded-lg object-cover ring-1 ring-[#ececf1]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-semibold text-[#1a1a2e]">{MODE_COPY[first.mode].title}</p>
                <p className="text-[12px] text-[#9a9bb0]">
                  {CATEGORY_LABEL[first.category]} · {first.photoType === "flat-lay" ? "Flat-lay" : "On model"} · {list.length} {list.length === 1 ? "result" : "results"}
                </p>
              </div>
            </header>
            <div className={`grid gap-3 ${cols}`}>
              {list.map((j, i) => (
                <ResultTile key={j.id} job={j} index={i} onRetry={() => retry(j)} onDownload={() => void download(j, i)} onReuse={() => reuse(j, i)} />
              ))}
            </div>
          </article>
        );
      })}
      <p className="px-1 text-[11.5px] leading-relaxed text-[#9a9bb0]">Prototype preview: results are mock composites of your two photos, not real model output.</p>
    </div>
  );

  const firstEmpty: SlotKey = !a ? "a" : "b";
  return (
    <ToolLayout
      title={MODE_COPY[mode].title}
      subtitle={MODE_COPY[mode].subtitle}
      settingsLabel={`${MODE_COPY[mode].title} settings`}
      credits={wallet.balance}
      onMenu={onMenu}
      onInvite={onInvite}
      dragging={dragging}
      dropProps={fileDropProps(setDragging, (f) => pickFile(firstEmpty, f))}
      settings={settings}
      action={action}
      results={results}
      resultsMeta={jobs.length > 0 && <span className="text-[12.5px] tabular-nums text-[#9a9bb0]">{jobs.length} {jobs.length === 1 ? "image" : "images"}</span>}
    />
  );
}
