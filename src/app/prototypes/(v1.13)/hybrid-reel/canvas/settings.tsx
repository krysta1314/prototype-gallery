"use client";

/* 点画布上的生成节点,右侧弹出它的 Settings(照真实产品的 Image Settings 面板)。
   Image Generator:Input Source / Prompt / Image Model / Aspect Ratio / Resolution / Background → Generate Image
   AI 补拍(Seedance):Input Source(用户素材全量作参考)/ Prompt / Video Model / Aspect Ratio / Duration → Generate Video */

import { useRef } from "react";
import { Film, Loader2, Trash2, X } from "lucide-react";
import { IMAGE_MODELS, VIDEO_MODELS, aiRefs, fmt, layoutClips, type AspectId, type Asset, type Project } from "./project";
import type { EditApi } from "./timeline";
import { Toggle } from "./ui";
import { DropdownSelect } from "@/components/ui/dropdown-select";
import { VOICES, VOICE_COST, voiceOf } from "@/lib/hybrid-reel/voices";

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
  embedded = false,
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
  /** 嵌在全屏编辑的右侧栏里:铺满容器,不浮在画布上 */
  embedded?: boolean;
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
  /* 时长下拉:常用档位 + 当前长度(时间线上 trim 过可能不是整数)。
     视频最短只能生成 4 秒(Seedance 下限,也按 4 秒扣费),所以不给 2s / 3s;图片节点不走这里 */
  const cur = Math.round((durationSec ?? asset.durationSec) * 10) / 10;
  const durationOptions = Array.from(new Set([4, 5, 6, 8, 10, 12, ...(cur >= 4 ? [cur] : [])]))
    .sort((x, y) => x - y)
    .map((d) => `${d}s`);
  const durationLabel = `${cur}s`;

  return (
    <aside
      data-nodrag
      onPointerDown={(e) => e.stopPropagation()}
      className={
        embedded
          ? "flex size-full flex-col overflow-hidden text-[#1a1a2e]"
          : "absolute bottom-3 right-3 top-16 z-30 flex w-[360px] flex-col overflow-hidden rounded-2xl border border-[#ececf1] bg-white text-[#1a1a2e] shadow-[0_18px_48px_rgba(26,26,46,0.16)]"
      }
    >
      <header className="flex items-start gap-2 border-b border-[#ececf1] px-5 py-4">
        <div className="min-w-0">
          <h3 className="text-[16px] font-bold">{isImage ? "Image Settings" : "Video Settings"}</h3>
          <p className="mt-0.5 text-[13px] text-[#6a6b7b]">
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
              {refs.length === 0 && <span className="text-[12px] text-[#6a6b7b]">No reference</span>}
              {isImage
                ? refs.map((src) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={src.slice(-24)} src={src} alt="" className="h-16 w-14 rounded-lg bg-[#f1ecff] object-cover p-0.5" />
                  ))
                : refUploads.map((a) => (
                    /* 和画布上参考素材卡是同一份:移除后卡片和连线一起更新 */
                    <span key={a.id} className="group/ref relative">
                      <RefThumb asset={a} className="h-16 w-14 rounded-lg p-0.5" />
                      <button
                        type="button"
                        aria-label={`Remove ${a.label} from references`}
                        title="Remove reference"
                        onClick={() =>
                          edit.commit((p) => ({
                            ...p,
                            assets: p.assets.map((x) =>
                              x.id === asset.id ? { ...x, refIds: refUploads.filter((r) => r.id !== a.id).map((r) => r.id) } : x,
                            ),
                          }))
                        }
                        className="absolute -right-1.5 -top-1.5 grid size-4 place-items-center rounded-full bg-white text-[#4a4b5c] opacity-0 shadow ring-1 ring-black/10 transition group-hover/ref:opacity-100 hover:text-[#d0342c] focus-visible:opacity-100"
                      >
                        <X className="size-2.5" strokeWidth={3} />
                      </button>
                    </span>
                  ))}
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
            className="w-full resize-none rounded-xl border border-[#ececf1] px-3 py-2.5 text-[14px] leading-relaxed outline-none focus-visible:border-[#ff5e1a]"
          />
        </Field>

        <Field label={isImage ? "Image Model" : "Video Model"}>
          <Select label="Model"
            value={asset.model ?? (isImage ? IMAGE_MODELS[0] : VIDEO_MODELS[0])}
            options={isImage ? IMAGE_MODELS : VIDEO_MODELS}
            icon={() => <ModelIcon kind={isImage ? "image" : "video"} />}
            onChange={(model) => patch({ model })}
          />
        </Field>

        <Field label="Aspect Ratio">
          <Select label="Aspect ratio"
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
              <Select label="Resolution" value={asset.resolution ?? "Low"} options={["Low", "Medium", "High"]} onChange={(v) => patch({ resolution: v as Asset["resolution"] })} />
            </Field>
            <Field label="Background">
              <Select label="Background" value={asset.background ?? "Auto"} options={["Auto", "Transparent", "Opaque"]} onChange={(v) => patch({ background: v as Asset["background"] })} />
            </Field>
          </>
        ) : (
          <>
            <Field label="Resolution">
              <Select label="Resolution" value={asset.resolution ?? "720p"} options={["480p", "720p", "1080p"]} onChange={(v) => patch({ resolution: v })} />
            </Field>
            <Field label="Duration">
              <Select label="Duration"
                value={durationLabel}
                options={durationOptions}
                onChange={(v) => onDuration?.(Number(v.replace("s", "")))}
              />
            </Field>
            <div className="flex items-center justify-between">
              <p className="text-[14px] font-semibold">With Audio</p>
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

      {/* 上一次生成失败的原因:不写的话用户只看到进度跑了一会儿又变回未生成 */}
      {asset.error && asset.status !== "generating" && (
        <p role="alert" className="mx-4 mb-3 rounded-xl bg-[#fff5f4] px-3.5 py-2.5 text-[12px] leading-snug text-[#b42318] ring-1 ring-inset ring-[#f3c4c0]">
          <span className="font-semibold">Last generation failed.</span> {asset.error} Your credits were refunded.
        </p>
      )}
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
              <span className="flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[13px]">
                <span className="size-2.5 rounded-full bg-white" /> {cost}
              </span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

/* Audio Generator(AI 配音)的 Settings:配音文案 + 音色 → Generate Audio。
   生成走 BytePlus Seed-Audio,结果落在时间线的音频轨上 */
export function AudioSettings({
  asset,
  project,
  edit,
  onGenerate,
  onDelete,
  onClose,
}: {
  asset: Asset;
  project: Project;
  edit: EditApi;
  onGenerate: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const began = useRef(false);
  const patch = (next: Partial<Asset>, record = true) => {
    const fn = (p: Project) => ({ ...p, assets: p.assets.map((a) => (a.id === asset.id ? { ...a, ...next } : a)) });
    if (record) edit.commit(fn);
    else edit.update(fn);
  };
  const busy = asset.status === "generating";
  /* AI 配乐也用这个面板:文案换成对音乐的描述,没有音色,多一个「用作配乐」开关 */
  const music = asset.purpose !== "voice";
  const script = asset.prompt ?? "";
  const onTrack = (project.voice ?? []).find((v) => v.assetId === asset.id);
  /* 按镜头分段的配音:一句一段,各自对齐一个镜头 */
  const lines = (project.voice ?? []).filter((v) => v.assetId === asset.id && v.text !== undefined);
  const segmented = lines.length > 0;
  const { segs } = layoutClips(project.clips);
  const patchLine = (id: string, text: string) =>
    edit.update((p) => ({
      ...p,
      /* 改了文案,这一句要重新生成:清掉旧音频 */
      voice: (p.voice ?? []).map((v) => (v.id === id ? { ...v, text, url: undefined } : v)),
      assets: p.assets.map((a) => (a.id === asset.id ? { ...a, error: undefined } : a)),
    }));
  /* 按镜头分段的配音一句一个节点;同一条配音应该是同一个人的声音,所以音色在任何一句上改,所有句子一起改 */
  const siblings = segmented
    ? project.assets.filter((a) => a.purpose === "voice" && (project.voice ?? []).some((v) => v.assetId === a.id && v.text !== undefined))
    : [];
  const siblingIds = new Set(siblings.map((a) => a.id));
  const canGenerate = segmented ? lines.some((v) => v.text?.trim()) : !!script.trim();
  /* 分段的按句数算:每句一次配音。有几句改过(没有音频)就只生成那几句 */
  const filled = lines.filter((v) => v.text?.trim());
  const missing = filled.filter((v) => !v.url);
  const toMake = missing.length ? missing.length : filled.length;
  /* AI 配乐原型里不扣费 */
  const cost = segmented ? VOICE_COST * toMake : music ? asset.cost ?? 0 : asset.cost ?? VOICE_COST;
  const cta = segmented
    ? missing.length && missing.length < filled.length
      ? `Generate ${missing.length} ${missing.length === 1 ? "line" : "lines"}`
      : missing.length
        ? "Generate Audio"
        : "Regenerate"
    : asset.status === "ready"
      ? "Regenerate"
      : "Generate Audio";
  /* 用字幕拼一份文案,一键填进来 */
  const fromSubs = project.clips.map((c) => c.subtitle.trim()).filter(Boolean);
  const joiner = fromSubs.some((t) => /[\u3040-\u30ff\u4e00-\u9fff\uac00-\ud7af]/.test(t)) ? "" : " ";

  return (
    <aside
      data-nodrag
      onPointerDown={(e) => e.stopPropagation()}
      className="absolute bottom-3 right-3 top-16 z-30 flex w-[360px] flex-col overflow-hidden rounded-2xl border border-[#ececf1] bg-white text-[#1a1a2e] shadow-[0_18px_48px_rgba(26,26,46,0.16)]"
    >
      <header className="flex items-start gap-2 border-b border-[#ececf1] px-5 py-4">
        <div className="min-w-0">
          <h3 className="text-[16px] font-bold">Audio Settings</h3>
          <p className="mt-0.5 text-[13px] text-[#6a6b7b]">{music ? "Configure music generation" : "Configure voiceover generation"}</p>
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
        {segmented ? (
          <Field label="Script">
            <p className="-mt-0.5 mb-2 text-[12px] leading-snug text-[#6a6b7b]">
              {lines.length === 1 ? "Plays at the start of its shot." : "Each line plays at the start of its shot."}
            </p>
            <ol className="space-y-2">
              {lines.map((v, i) => {
                const seg = segs.find((x) => x.clip.id === v.clipId);
                const over = !!v.url && !!seg && (v.offset ?? 0) + v.len > seg.len + 0.1;
                return (
                  <li key={v.id} className="rounded-xl border border-[#ececf1] px-3 py-2.5 focus-within:border-[#ff5e1a] focus-within:ring-[3px] focus-within:ring-[#ff5e1a]/15">
                    <p className="flex items-center gap-1.5 text-[12px] tabular-nums text-[#6a6b7b]">
                      <span className="font-semibold text-[#1a1a2e]">Shot {seg ? seg.index + 1 : i + 1}</span>
                      <span>{fmt(seg?.start ?? v.at)}</span>
                      {v.url && <span className="ml-auto">{v.len.toFixed(1)}s{seg ? ` / ${seg.len.toFixed(1)}s` : ""}</span>}
                    </p>
                    <textarea
                      aria-label={`Line ${i + 1}`}
                      rows={2}
                      value={v.text}
                      onFocus={() => (began.current = false)}
                      onChange={(e) => {
                        if (!began.current) {
                          edit.begin();
                          began.current = true;
                        }
                        patchLine(v.id, e.target.value);
                      }}
                      className="mt-1 w-full resize-none bg-transparent text-[13px] leading-relaxed outline-none placeholder:text-[#74758a]"
                      placeholder="What should this shot say?"
                    />
                    {over && (
                      <p className="mt-1 text-[12px] leading-snug text-[#b45309]">Longer than its shot, so it runs into the next one. Shorten the line, lengthen the shot, or trim its end on the timeline.</p>
                    )}
                  </li>
                );
              })}
            </ol>
          </Field>
        ) : (
        <Field label={music ? "Prompt" : "Script"}>
            <textarea
              aria-label={music ? "Music prompt" : "Voiceover script"}
              rows={7}
              value={script}
              placeholder={music ? "Describe the music, e.g. light, bright pop under a voiceover" : "What should the voiceover say?"}
              onFocus={() => (began.current = false)}
              onChange={(e) => {
                if (!began.current) {
                  edit.begin();
                  began.current = true;
                }
                patch({ prompt: e.target.value, error: undefined }, false);
              }}
              className="w-full resize-none rounded-xl border border-[#ececf1] px-3.5 py-3 text-[14px] leading-relaxed outline-none transition placeholder:text-[#74758a] focus:border-[#ff5e1a] focus:ring-[3px] focus:ring-[#ff5e1a]/15"
            />
            <div className="mt-1.5 flex items-center justify-between text-[12px] text-[#6a6b7b]">
              {fromSubs.length > 0 && !music ? (
                <button
                  type="button"
                  onClick={() => patch({ prompt: fromSubs.join(joiner), error: undefined })}
                  className="font-semibold text-[#ff5e1a] hover:underline"
                >
                  Use subtitles as script
                </button>
              ) : (
                <span />
              )}
              <span className="tabular-nums">{script.length} / 2800</span>
            </div>
          </Field>
        )}

        {music && (
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold">Use as music</span>
            <Toggle
              label="Use as background music"
              on={project.musicId === asset.id}
              onChange={(on) => edit.commit((p) => ({ ...p, musicId: on ? asset.id : p.musicId === asset.id ? null : p.musicId }))}
            />
          </div>
        )}
        {!music && (
        <Field label="Voice">
          {siblings.length > 1 && (
            <p className="-mt-0.5 mb-2 text-[12px] leading-snug text-[#6a6b7b]">Applies to all {siblings.length} voiceover lines.</p>
          )}
          <div role="radiogroup" aria-label="Voice" className="grid grid-cols-2 gap-2">
            {VOICES.map((v) => {
              const on = voiceOf(asset.voiceId).id === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() =>
                    siblings.length > 1
                      ? edit.commit((p) => ({ ...p, assets: p.assets.map((a) => (siblingIds.has(a.id) ? { ...a, voiceId: v.id } : a)) }))
                      : patch({ voiceId: v.id })
                  }
                  className={`rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold transition ${
                    on ? "bg-[#fff7f1] text-[#c2410c] ring-[1.5px] ring-inset ring-[#ff5e1a]" : "text-[#4a4b5c] ring-1 ring-inset ring-[#ececf1] hover:ring-[#c9cad4]"
                  }`}
                >
                  {v.label}
                </button>
              );
            })}
          </div>
        </Field>

        )}

        <Field label="Audio Model">
          <Select label="Audio model" value="Seed Audio 1.0" options={["Seed Audio 1.0"]} onChange={() => {}} />
        </Field>

        {onTrack && !segmented && (
          <p className="rounded-xl bg-[#f7f8fa] px-3.5 py-2.5 text-[12px] leading-snug text-[#6a6b7b]">
            On the audio track at <span className="font-semibold tabular-nums text-[#1a1a2e]">{fmt(onTrack.at)}</span>. Drag it on
            the timeline to change where it starts.
          </p>
        )}
        {asset.error && (
          <p className="rounded-xl bg-[#fff5f4] px-3.5 py-2.5 text-[12px] leading-snug text-[#d0342c] ring-1 ring-inset ring-[#f3c4c0]">
            {asset.error}
          </p>
        )}
      </div>

      <div className="border-t border-[#ececf1] p-4">
        <button
          type="button"
          disabled={busy || !canGenerate}
          onClick={onGenerate}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] py-3 text-[14px] font-bold text-white transition hover:brightness-105 disabled:opacity-60"
        >
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Generating… {asset.progress ?? 0}%
            </>
          ) : (
            <>
              {cta}
              {cost > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[13px]">
                  <span className="size-2.5 rounded-full bg-white" /> {cost}
                </span>
              )}
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
      <p className="mb-2 text-[14px] font-semibold">{label}</p>
      {children}
    </div>
  );
}

/* 设置面板里的下拉:统一用 DropdownSelect(不用原生 <select>,原生菜单是系统样式) */
function Select({
  value,
  options,
  onChange,
  icon,
  label = "Choose an option",
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  /** 选中值前面的小图标(模型 logo / 比例框) */
  icon?: (v: string) => React.ReactNode;
  label?: string;
}) {
  return <DropdownSelect label={label} value={value} options={options.map((o) => ({ value: o, label: o }))} onChange={onChange} icon={icon} />;
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
  return aiRefs(project, asset);
}

/** 参考素材缩略图:视频首帧要等加载,先垫一个视频图标,不会是一块空白色块 */
function RefThumb({ asset, className = "" }: { asset: Asset; className?: string }) {
  return (
    <span className={`relative block overflow-hidden bg-[#f1ecff] ${className}`}>
      {asset.kind === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={asset.url} alt="" className="size-full rounded-[inherit] object-cover" />
      ) : (
        <>
          <Film className="absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 text-[#a996e8]" />
          <video src={`${asset.url}#t=0.1`} muted playsInline preload="metadata" className="relative size-full rounded-[inherit] object-cover" />
        </>
      )}
    </span>
  );
}
