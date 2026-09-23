"use client";

/* 点画布上的生成节点,右侧弹出它的 Settings(照真实产品的 Image Settings 面板)。
   Image Generator:Input Source / Prompt / Image Model / Aspect Ratio / Resolution / Background → Generate Image
   AI 补拍(Seedance):Input Source(用户素材全量作参考)/ Prompt / Video Model / Aspect Ratio / Duration → Generate Video */

import { useRef } from "react";
import { ChevronDown, Loader2, Trash2, X } from "lucide-react";
import { IMAGE_MODELS, VIDEO_MODELS, type AspectId, type Asset, type Project } from "./project";
import type { EditApi } from "./timeline";

const ASPECT_VALUE: Record<AspectId, number> = { "16:9": 16 / 9, "9:16": 9 / 16, "1:1": 1 };

export function NodeSettings({
  asset,
  project,
  edit,
  onGenerate,
  onDelete,
  onClose,
  durationSec,
  onDuration,
}: {
  asset: Asset;
  project: Project;
  edit: EditApi;
  onGenerate: () => void;
  onDelete: () => void;
  onClose: () => void;
  /** AI 补拍镜头在时间线上的长度 */
  durationSec?: number;
  /** 改时长 = 改时间线上这一镜的长度 */
  onDuration?: (sec: number) => void;
}) {
  const isImage = asset.kind === "image";
  const began = useRef(false);
  const patch = (next: Partial<Asset>, record = true) => {
    const fn = (p: Project) => ({ ...p, assets: p.assets.map((a) => (a.id === asset.id ? { ...a, ...next } : a)) });
    if (record) edit.commit(fn);
    else edit.update(fn);
  };
  const busy = asset.status === "generating";
  const cost = asset.cost ?? project.creditsPerShot;
  const refs = isImage
    ? asset.refSrc
      ? [asset.refSrc]
      : []
    : refUploadsOf(project, asset).map((a) => a.url!);
  const refUploads = refUploadsOf(project, asset);
  /* 时长下拉:常用档位 + 当前长度(时间线上 trim 过可能不是整数) */
  const cur = Math.round((durationSec ?? asset.durationSec) * 10) / 10;
  const durationOptions = Array.from(new Set([2, 3, 4, 5, 6, 8, 10, 12, cur]))
    .sort((x, y) => x - y)
    .map((d) => `${d}s`);
  const durationLabel = `${cur}s`;

  return (
    <aside
      data-nodrag
      onPointerDown={(e) => e.stopPropagation()}
      className="absolute bottom-3 right-3 top-16 z-30 flex w-[360px] flex-col overflow-hidden rounded-2xl border border-[#ececf1] bg-white text-[#1a1a2e] shadow-[0_18px_48px_rgba(26,26,46,0.16)]"
    >
      <header className="flex items-start gap-2 border-b border-[#ececf1] px-5 py-4">
        <div className="min-w-0">
          <h3 className="text-[16px] font-bold">{isImage ? "Image Settings" : "Video Settings"}</h3>
          <p className="mt-0.5 text-[12.5px] text-[#9a9bb0]">
            {isImage ? "Configure image generation" : "Configure video generation"}
          </p>
        </div>
        <button
          type="button"
          aria-label="Delete node"
          onClick={onDelete}
          className="ml-auto grid size-8 place-items-center rounded-lg text-[#4a4b5c] transition hover:bg-[#f3f4f6] hover:text-[#d0342c]"
        >
          <Trash2 className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Close settings"
          onClick={onClose}
          className="grid size-8 place-items-center rounded-lg text-[#4a4b5c] transition hover:bg-[#f3f4f6]"
        >
          <X className="size-4" />
        </button>
      </header>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
        <Field label="Input Source">
          <div className="rounded-xl border border-[#ececf1] p-3">
            <p className="flex items-center gap-2 text-[12px]">
              <span className="rounded-md bg-[#f1ecff] px-2 py-0.5 font-semibold text-[#7c5cd6]">{isImage ? "Images" : "Clips"}</span>
              <span className="text-[#6a6b7b]">
                {refs.length} / {isImage ? 16 : 10}
              </span>
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {refs.length === 0 && <span className="text-[12px] text-[#9a9bb0]">No reference</span>}
              {isImage
                ? refs.map((src) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={src.slice(-24)} src={src} alt="" className="h-16 w-14 rounded-lg bg-[#f1ecff] object-cover p-0.5" />
                  ))
                : refUploads.map((a) =>
                    a.kind === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={a.id} src={a.url} alt="" className="h-16 w-14 rounded-lg bg-[#f1ecff] object-cover p-0.5" />
                    ) : (
                      <video key={a.id} src={`${a.url}#t=0.1`} muted preload="metadata" className="h-16 w-14 rounded-lg bg-[#f1ecff] object-cover p-0.5" />
                    ),
                  )}
            </div>
          </div>
        </Field>

        <Field label="Prompt">
          <textarea
            aria-label="Prompt"
            rows={5}
            value={asset.prompt ?? ""}
            onFocus={() => (began.current = false)}
            onChange={(e) => {
              if (!began.current) {
                edit.begin();
                began.current = true;
              }
              patch({ prompt: e.target.value }, false);
            }}
            className="w-full resize-none rounded-xl border border-[#ececf1] px-3 py-2.5 text-[13.5px] leading-relaxed outline-none focus-visible:border-[#ff5e1a]"
          />
        </Field>

        <Field label={isImage ? "Image Model" : "Video Model"}>
          <Select
            value={asset.model ?? (isImage ? IMAGE_MODELS[0] : VIDEO_MODELS[0])}
            options={isImage ? IMAGE_MODELS : VIDEO_MODELS}
            icon={() => <ModelIcon kind={isImage ? "image" : "video"} />}
            onChange={(model) => patch({ model })}
          />
        </Field>

        <Field label="Aspect Ratio">
          <Select
            value={asset.genAspect ?? project.aspect}
            options={["9:16", "16:9", "1:1"]}
            icon={(v) => <AspectGlyph ratio={ASPECT_VALUE[v as AspectId] ?? 1} />}
            onChange={(v) => {
              const genAspect = v as AspectId;
              patch({ genAspect, aspect: ASPECT_VALUE[genAspect] });
            }}
          />
        </Field>

        {isImage ? (
          <>
            <Field label="Resolution">
              <Select value={asset.resolution ?? "Low"} options={["Low", "Medium", "High"]} onChange={(v) => patch({ resolution: v as Asset["resolution"] })} />
            </Field>
            <Field label="Background">
              <Select value={asset.background ?? "Auto"} options={["Auto", "Transparent", "Opaque"]} onChange={(v) => patch({ background: v as Asset["background"] })} />
            </Field>
          </>
        ) : (
          <>
            <Field label="Resolution">
              <Select value={asset.resolution ?? "720p"} options={["480p", "720p", "1080p"]} onChange={(v) => patch({ resolution: v })} />
            </Field>
            <Field label="Duration">
              <Select
                value={durationLabel}
                options={durationOptions}
                onChange={(v) => onDuration?.(Number(v.replace("s", "")))}
              />
            </Field>
            <div className="flex items-center justify-between">
              <p className="text-[13.5px] font-semibold">With Audio</p>
              <button
                type="button"
                role="switch"
                aria-checked={asset.withAudio !== false}
                aria-label="With Audio"
                onClick={() => patch({ withAudio: asset.withAudio === false })}
                className={`relative h-6 w-11 rounded-full transition ${
                  asset.withAudio !== false ? "bg-gradient-to-r from-[#FFA73C] to-[#FF5255]" : "bg-[#d9dae2]"
                }`}
              >
                <span
                  className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${
                    asset.withAudio !== false ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          </>
        )}
      </div>

      <div className="border-t border-[#ececf1] p-4">
        <button
          type="button"
          disabled={busy}
          onClick={onGenerate}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] py-3 text-[14px] font-bold text-white transition hover:brightness-105 disabled:opacity-60"
        >
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Generating… {asset.progress ?? 0}%
            </>
          ) : (
            <>
              {asset.status === "ready" ? "Regenerate" : isImage ? "Generate Image" : "Generate Video"}
              <span className="flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[12.5px]">
                <span className="size-2.5 rounded-full bg-white" /> {cost}
              </span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[13.5px] font-semibold">{label}</p>
      {children}
    </div>
  );
}

function Select({
  value,
  options,
  onChange,
  icon,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  /** 选中值前面的小图标(模型 logo / 比例框) */
  icon?: (v: string) => React.ReactNode;
}) {
  return (
    <div className="relative">
      {icon && <span className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 items-center">{icon(value)}</span>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full appearance-none rounded-xl border border-[#ececf1] bg-white py-2.5 pr-9 text-[13.5px] outline-none focus-visible:border-[#ff5e1a] ${
          icon ? "pl-10" : "pl-3"
        }`}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#6a6b7b]" />
    </div>
  );
}

/* 比例框:按比例画一个小矩形,和真实产品的下拉一致 */
function AspectGlyph({ ratio }: { ratio: number }) {
  const w = ratio >= 1 ? 16 : Math.round(16 * ratio);
  const h = ratio >= 1 ? Math.round(16 / ratio) : 16;
  return <span className="block rounded-[3px] border-[1.5px] border-[#1a1a2e]" style={{ width: w, height: h }} />;
}

/* 模型 logo:视频用 Seedance 的彩色竖条,图片用一个简化的生图标 */
function ModelIcon({ kind }: { kind: "image" | "video" }) {
  if (kind === "video") {
    return (
      <svg viewBox="0 0 18 16" className="h-4 w-[18px]" aria-hidden>
        <rect x="1" y="6" width="3" height="9" rx="0.8" fill="#3b6fd4" />
        <rect x="5.5" y="3" width="3" height="12" rx="0.8" fill="#5b8def" />
        <rect x="10" y="8" width="3" height="7" rx="0.8" fill="#39c5bb" />
        <rect x="14.5" y="1" width="3" height="14" rx="0.8" fill="#7fd6f2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 16 16" className="size-4" aria-hidden fill="none" stroke="#1a1a2e" strokeWidth="1.5">
      <circle cx="8" cy="8" r="6.5" />
      <path d="M8 3.5v9M3.5 8h9M4.8 4.8l6.4 6.4M11.2 4.8l-6.4 6.4" strokeLinecap="round" />
    </svg>
  );
}

/* 视频生成节点的参考素材:指定了某段素材就只用它,否则用户上传的素材全量作参考 */
function refUploadsOf(project: Project, asset: Asset) {
  if (asset.refAssetId) return project.assets.filter((a) => a.id === asset.refAssetId && a.url);
  return project.assets.filter((a) => a.origin === "upload" && a.url);
}
