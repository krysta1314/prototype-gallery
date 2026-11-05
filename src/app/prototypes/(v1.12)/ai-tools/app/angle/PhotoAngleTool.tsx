"use client";

/* Photo Angle Editor 工具页(入口:Image › Photo Angle Editor;调研第 4 轮,qwen multiple-angles,数值视角)。
   版式同其他工具页(ToolLayout)。左栏:上传 → 预设(Front / ¾ Left / ¾ Right / Top-down / Low angle)→ 轨道小部件(拖相机点)
   + 三个滑块 Horizontal angle(−90°…90°)/ Vertical angle(−30°…60°)/ Zoom(0.5×…2×)→「Add angle」加进队列(最多 4 个)→ 积分 → 主按钮。
   右侧:当前视角的实时预览 + 每次生成一组结果(每个视角一张)。
   原型里结果 = 原图 + CSS 透视变换(角标写明「Preview」,不是模型结果);Download 拿到的是原图文件(按视角改名)。 */

import { useReducer, useRef, useState } from "react";
import { CircleAlert, Download, ImagePlus, Plus, RotateCcw, Video, Wand2, X } from "lucide-react";
import { ACCEPTED_TYPES, isAcceptedFile } from "../logic";
import type { ToolsApi } from "../tools/api";
import { groupBatches, jobsReduce, nowMs, type ToolJob, type Wallet } from "../tools/jobs";
import { useJobRunner } from "../tools/useJobRunner";
import { loadImage, saveBlob } from "../tools/media";
import type { Notify } from "../components/TopToast";
import { EmptyResults, FieldLabel, RunningTile, SliderRow, ToolLayout, UploadDrop, ctaBtn, fileDropProps, ghostBtn, CtaCost } from "../components/ToolKit";
import {
  ANGLE_MODEL,
  ANGLE_PRESETS,
  FRONT,
  H_RANGE,
  MAX_QUEUE,
  ORBIT,
  V_RANGE,
  ZOOM_RANGE,
  addToQueue,
  angleCredits,
  angleFileName,
  angleFromOrbit,
  angleLabel,
  anglesToRun,
  clampAngle,
  orbitPoint,
  presetOf,
  previewTransform,
  removeFromQueue,
  sameAngle,
  type Angle,
} from "./logic";

type Source = { url: string; name: string; width: number; height: number };
type Input = { source: Source; angle: Angle };
type Job = ToolJob<Input>;

const ACCEPT_ATTR = ACCEPTED_TYPES.map((t) => `.${t}`).join(",");
const UNSUPPORTED = "This format isn't supported. Use JPG, PNG, WEBP, GIF, AVIF or HEIC.";
const UNREADABLE = "We couldn't read this image. Try another file.";
const FAILED = "Generation failed. Your credits have been refunded.";

const newId = () => `pa-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const fmt = (n: number) => n.toLocaleString("en-US");
const deg = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n)}°`;

/* ---------- 视角预览:原图 + 透视变换 ---------- */
function AnglePreview({ source, angle, maxH, label = true }: { source: Source; angle: Angle; maxH: number; label?: boolean }) {
  const ratio = source.width / source.height;
  return (
    <div
      className="relative mx-auto overflow-hidden rounded-xl bg-[radial-gradient(ellipse_at_center,#f7f8fa_0%,#e9eaef_100%)] ring-1 ring-[#ececf1]"
      style={{ aspectRatio: `${source.width} / ${source.height}`, width: `min(100%, ${Math.round(maxH * ratio)}px)` }}
    >
      <div className="absolute inset-[9%] transition-transform duration-300 ease-out [transform-style:preserve-3d]" style={{ transform: previewTransform(angle) }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={source.url} alt="" draggable={false} className="size-full rounded-md object-cover shadow-[0_16px_36px_rgba(26,26,46,0.2)]" />
      </div>
      {label && (
        <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-[#1a1a2e]/70 px-2 py-[2px] text-[10.5px] font-semibold uppercase tracking-wide text-white">
          Preview
        </span>
      )}
    </div>
  );
}

/* ---------- 轨道小部件:拖相机点改视角 ---------- */
function OrbitGizmo({ angle, onChange }: { angle: Angle; onChange: (a: Angle) => void }) {
  const ref = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);
  const W = 240;
  const H = 170;
  const p = orbitPoint(angle);
  const cx = ORBIT.cx * W;
  const cy = ORBIT.cy * H;
  const move = (e: React.PointerEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    onChange(angleFromOrbit((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height, angle.zoom));
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    const step: Record<string, [number, number]> = { ArrowLeft: [-5, 0], ArrowRight: [5, 0], ArrowUp: [0, 5], ArrowDown: [0, -5] };
    const s = step[e.key];
    if (!s) return;
    e.preventDefault();
    onChange(clampAngle({ h: angle.h + s[0], v: angle.v + s[1], zoom: angle.zoom }));
  };
  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${W} ${H}`}
      role="slider"
      tabIndex={0}
      aria-label="Camera position. Drag, or use arrow keys."
      aria-valuetext={`Horizontal ${angle.h} degrees, vertical ${angle.v} degrees`}
      aria-valuenow={angle.h}
      aria-valuemin={H_RANGE.min}
      aria-valuemax={H_RANGE.max}
      onPointerDown={(e) => {
        dragging.current = true;
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* 合成事件没有可捕获的指针,照样能拖 */
        }
        move(e);
      }}
      onPointerMove={(e) => dragging.current && move(e)}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
      onKeyDown={onKeyDown}
      className="block w-full max-w-[300px] cursor-grab touch-none select-none rounded-xl bg-[#FAFBFC] outline-none ring-1 ring-[#ececf1] focus-visible:ring-2 focus-visible:ring-[#ff5e1a] active:cursor-grabbing max-lg:mx-auto"
    >
      {/* 地面轨道(不用虚线，2026-11-05) */}
      <path d={`M ${cx - ORBIT.rx * W} ${cy} A ${ORBIT.rx * W} ${ORBIT.ry * H} 0 0 1 ${cx + ORBIT.rx * W} ${cy}`} fill="none" stroke="#d6d7df" />
      <path d={`M ${cx - ORBIT.rx * W} ${cy} A ${ORBIT.rx * W} ${ORBIT.ry * H} 0 0 0 ${cx + ORBIT.rx * W} ${cy}`} fill="none" stroke="#c9cad4" strokeWidth="1.5" />
      {/* 主体:一张立着的照片 */}
      <rect x={cx - 15} y={cy - 40} width="30" height="40" rx="4" fill="#fff" stroke="#1a1a2e" strokeOpacity="0.55" strokeWidth="1.5" />
      <circle cx={cx} cy={cy - 26} r="6" fill="#1a1a2e" fillOpacity="0.25" />
      <path d={`M ${cx - 9} ${cy - 4} q 9 -12 18 0`} fill="#1a1a2e" fillOpacity="0.25" />
      {/* 相机到轨道的垂线 + 视线 */}
      <line x1={p.x * W} y1={p.y * H} x2={p.x * W} y2={(ORBIT.cy + Math.cos((angle.h * Math.PI) / 180) * ORBIT.ry) * H} stroke="#ffbd99" />
      <line x1={p.x * W} y1={p.y * H} x2={cx} y2={cy - 20} stroke="#ff5e1a" strokeOpacity="0.55" strokeWidth="1.5" />
      <circle cx={p.x * W} cy={p.y * H} r="13" fill="#ff5e1a" />
      <g transform={`translate(${p.x * W - 7} ${p.y * H - 7})`} stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.5 6.5 13 4.5v5L9.5 7.5" />
        <rect x="1" y="3.5" width="8.5" height="7" rx="1.5" />
      </g>
      <text x="8" y="16" fontSize="10.5" fill="#9a9bb0" fontWeight="600">
        Drag the camera
      </text>
    </svg>
  );
}

/* ---------- 一张结果 ---------- */
function ResultTile({ job, onRetry, onDownload, onReuse }: { job: Job; onRetry: () => void; onDownload: () => void; onReuse: () => void }) {
  const { source, angle } = job.input;
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="relative">
        {job.status === "failed" ? (
          <div role="alert" className="grid place-items-center rounded-xl bg-[#fff7f5] px-3 text-center" style={{ aspectRatio: `${source.width} / ${source.height}` }}>
            <div className="space-y-2 py-3">
              <CircleAlert className="mx-auto size-5 text-[#e5484d]" />
              <p className="text-[12px] leading-snug text-[#e5484d]">{FAILED}</p>
              <button type="button" onClick={onRetry} className={`${ghostBtn} h-8 text-[#ff5e1a]`}>
                <RotateCcw className="size-3.5" /> Retry
              </button>
            </div>
          </div>
        ) : (
          <>
            <AnglePreview source={source} angle={angle} maxH={260} label={job.status === "done"} />
            {job.status === "running" && (
              <div className="absolute inset-0 overflow-hidden rounded-xl">
                <RunningTile label="Generating" />
              </div>
            )}
          </>
        )}
      </div>
      <p className="truncate text-[12.5px] font-semibold text-[#1a1a2e]" title={angleLabel(angle)}>
        {angleLabel(angle)}
      </p>
      {job.status === "done" && (
        <div className="flex gap-1.5">
          <button type="button" onClick={onDownload} className={`${ghostBtn} h-8 min-w-0 flex-1 px-2`} aria-label={`Download ${angleLabel(angle)}`}>
            <Download className="size-3.5" /> Download
          </button>
          <button type="button" onClick={onReuse} className={`${ghostBtn} h-8 px-2.5`} title="Load this angle into the controls" aria-label={`Edit from ${angleLabel(angle)}`}>
            <Wand2 className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export function PhotoAngleTool({
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
  const [angle, setAngleState] = useState<Angle>(FRONT);
  const [queue, setQueue] = useState<Angle[]>([]);
  const [jobs, dispatch] = useReducer(jobsReduce<Input>, []);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const setAngle = (a: Partial<Angle>) => setAngleState((x) => clampAngle({ ...x, ...a }));

  useJobRunner({
    jobs,
    api,
    task: () => "angle",
    onDone: (j) => {
      dispatch({ type: "done", id: j.id });
      const rest = jobs.filter((x) => x.batch === j.batch && x.id !== j.id && x.status === "running");
      if (!rest.length) say("New angles are ready", "success");
    },
    onFail: (j) => {
      dispatch({ type: "fail", id: j.id });
      wallet.refund(j.cost);
      say(FAILED, "error");
    },
  });

  const run = anglesToRun(queue, angle);
  const cost = source ? angleCredits(run.length) : null;
  const blocker = !source ? "Upload an image first." : null;

  const loadSource = async (url: string, name: string) => {
    try {
      const img = await loadImage(url);
      setSource({ url, name, width: img.naturalWidth, height: img.naturalHeight });
    } catch {
      say(UNREADABLE, "error");
    }
  };
  const pickFile = (file: File | undefined) => {
    if (!file) return;
    if (!isAcceptedFile(file.name)) return say(UNSUPPORTED, "error");
    void loadSource(URL.createObjectURL(file), file.name);
  };

  const add = () => {
    const r = addToQueue(queue, angle);
    if (r.result === "full") return say(`You can generate up to ${MAX_QUEUE} angles at once.`, "info");
    if (r.result === "duplicate") return say("This angle is already in the list.", "info");
    setQueue(r.queue);
  };

  const generate = () => {
    if (!source || cost === null) return;
    if (!wallet.charge(cost)) return;
    const batch = newId();
    dispatch({ type: "start", now: nowMs(), jobs: run.map((a) => ({ id: newId(), batch, cost: angleCredits(1), input: { source, angle: a } })) });
    requestAnimationFrame(() => document.getElementById("angle-results")?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  };

  const retry = (j: Job) => {
    if (!wallet.charge(j.cost)) return;
    dispatch({ type: "restart", id: j.id, now: nowMs() });
  };

  const download = async (j: Job) => {
    try {
      const blob = await (await fetch(j.input.source.url)).blob();
      saveBlob(blob, angleFileName(j.input.source.name, j.input.angle));
    } catch {
      say("Download failed — try again", "error", () => void download(j));
    }
  };

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
        onClick={() => setSource(null)}
        className="grid size-7 shrink-0 place-items-center rounded-full text-[#6a6b7b] transition hover:bg-[#f3f4f6] hover:text-[#1a1a2e]"
      >
        <X className="size-4" />
      </button>
    </div>
  ) : (
    <UploadDrop
      icon={<ImagePlus className="size-5" strokeWidth={1.8} />}
      title="Upload an image"
      hint="A product or person shot works best. JPG, PNG, WEBP, GIF, AVIF or HEIC."
      dragging={dragging}
      onPick={() => fileRef.current?.click()}
    />
  );

  const current = presetOf(angle);
  const inQueue = queue.some((q) => sameAngle(q, angle));

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
        <FieldLabel>Presets</FieldLabel>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Angle presets">
          {ANGLE_PRESETS.map((p) => {
            const on = current?.id === p.id;
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={on}
                onClick={() => setAngleState(p.angle)}
                className={`h-8 rounded-full border px-3 text-[12.5px] font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40 ${
                  on ? "border-[#ffbd99] bg-[#fff3ec] text-[#ff5e1a]" : "border-[#e1e3e9] bg-white text-[#1a1a2e] hover:border-[#c9cad4]"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <FieldLabel hint={angleLabel(angle)}>Camera</FieldLabel>
        <OrbitGizmo angle={angle} onChange={(a) => setAngleState(a)} />
        <div className="mt-4 space-y-4">
          <SliderRow label="Horizontal angle" value={angle.h} display={deg(angle.h)} min={H_RANGE.min} max={H_RANGE.max} step={H_RANGE.step} origin={0} onChange={(h) => setAngle({ h })} />
          <SliderRow label="Vertical angle" value={angle.v} display={deg(angle.v)} min={V_RANGE.min} max={V_RANGE.max} step={V_RANGE.step} origin={0} onChange={(v) => setAngle({ v })} />
          <SliderRow label="Zoom" value={angle.zoom} display={`${angle.zoom.toFixed(1)}×`} min={ZOOM_RANGE.min} max={ZOOM_RANGE.max} step={ZOOM_RANGE.step} origin={1} onChange={(zoom) => setAngle({ zoom })} />
        </div>
      </div>
      <div>
        <FieldLabel hint={`${queue.length}/${MAX_QUEUE}`}>Angles to Generate</FieldLabel>
        {queue.length > 0 && (
          <ul className="mb-2 flex flex-wrap gap-1.5">
            {queue.map((q, i) => (
              <li key={`${q.h}-${q.v}-${q.zoom}`} className="inline-flex h-8 items-center gap-1 rounded-full bg-[#f3f4f6] pl-3 pr-1 text-[12.5px] font-semibold text-[#1a1a2e]">
                <button type="button" onClick={() => setAngleState(q)} className="max-w-[170px] truncate" title="Load into the controls">
                  {angleLabel(q)}
                </button>
                <button
                  type="button"
                  aria-label={`Remove ${angleLabel(q)}`}
                  onClick={() => setQueue((x) => removeFromQueue(x, i))}
                  className="grid size-6 place-items-center rounded-full text-[#6a6b7b] transition hover:bg-white hover:text-[#1a1a2e]"
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <button type="button" onClick={add} disabled={inQueue || queue.length >= MAX_QUEUE} className={`${ghostBtn} h-9 w-full`}>
          <Plus className="size-4" /> {inQueue ? "Added" : queue.length >= MAX_QUEUE ? `${MAX_QUEUE} angles max` : "Add this angle"}
        </button>
        <p className="mt-2 text-[12px] leading-relaxed text-[#9a9bb0]">
          {queue.length ? "Each angle in the list becomes one image." : `Add up to ${MAX_QUEUE} angles to get them in one go, or just generate the current one.`}
        </p>
      </div>
      <p className="text-[11.5px] text-[#9a9bb0]">Model: {ANGLE_MODEL}</p>
    </>
  );

  const n = run.length;
  const action = (
    <>
      <span title={blocker ?? undefined} className="block">
        <button type="button" onClick={generate} disabled={!!blocker} className={ctaBtn} aria-label={blocker ? `Generate. ${blocker}` : undefined}>{`Generate ${n} ${n === 1 ? "angle" : "angles"}`}
          <CtaCost cost={cost} />
        </button>
      </span>
    </>
  );

  /* ---------- 右侧 ---------- */
  const batches = groupBatches(jobs);
  const results =
    !source && !jobs.length ? (
      <EmptyResults
        icon={<Video className="size-5" strokeWidth={1.8} />}
        title="New camera angles from one photo"
        body="Upload a shot, move the camera, and get up to 4 new angles of the same subject — no reshoot."
      />
    ) : (
      <div className="mx-auto w-full max-w-[880px] space-y-4 pb-6">
        {source && (
          <section aria-label="Current angle" className="rounded-[22px] border border-[#ececf1] bg-[#FAFBFC] p-3 sm:p-4">
            <AnglePreview source={source} angle={angle} maxH={360} />
            <p className="mt-2.5 text-center text-[12px] text-[#6a6b7b]">
              <span className="font-semibold text-[#1a1a2e]">{angleLabel(angle)}</span> · Rough preview — the model re-renders the scene from this angle.
            </p>
          </section>
        )}
        <div id="angle-results" className="space-y-4">
          {batches.map(({ batch, jobs: list }) => (
            <article key={batch} className="rounded-[22px] border border-[#ececf1] bg-white p-4 shadow-[0_4px_16px_rgba(26,26,46,0.06)]" aria-label="Generated angles">
              <header className="mb-3 flex items-center gap-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={list[0].input.source.url} alt="" className="size-9 shrink-0 rounded-lg object-cover ring-1 ring-[#ececf1]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold text-[#1a1a2e]">
                    {list.length} {list.length === 1 ? "angle" : "angles"} · {list[0].input.source.name}
                  </p>
                  <p className="text-[12px] tabular-nums text-[#9a9bb0]">
                    {list.filter((j) => j.status === "done").length} of {list.length} ready
                  </p>
                </div>
              </header>
              <div className={`grid gap-3 ${list.length === 1 ? "max-w-[360px] grid-cols-1" : "grid-cols-1 min-[460px]:grid-cols-2"}`}>
                {list.map((j) => (
                  <ResultTile key={j.id} job={j} onRetry={() => retry(j)} onDownload={() => void download(j)} onReuse={() => setAngleState(j.input.angle)} />
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    );

  return (
    <ToolLayout
      title="Photo Angle Editor"
      subtitle="Re-shoot any photo from a new camera angle."
      settingsLabel="Photo angle settings"
      credits={wallet.balance}
      onMenu={onMenu}
      onInvite={onInvite}
      dragging={dragging}
      dropProps={fileDropProps(setDragging, pickFile)}
      settings={settings}
      action={action}
      results={results}
      resultsLabel={jobs.length ? "Results" : "Preview"}
      resultsMeta={jobs.length > 0 && <span className="text-[12.5px] tabular-nums text-[#9a9bb0]">{jobs.length} {jobs.length === 1 ? "image" : "images"}</span>}
    />
  );
}
