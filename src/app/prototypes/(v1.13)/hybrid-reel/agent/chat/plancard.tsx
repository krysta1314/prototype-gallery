"use client";

/* Generation plan 卡及其零件:旧版对话页(hybrid-reel/agent/chat)和新 Hybrid Reel Agent 共用。
   不传 credits = 旧版行为(底部一句说明 + Cancel + Edit in canvas,不显示积分);
   传 credits = 新 Agent:AI 镜头右侧显示积分,底部「Execute this plan?」+ Edit in canvas / Cancel / Confirm · N credits。 */

import { useState, type ReactNode } from "react";
import {
  ArrowRight,
  AudioLines,
  Ban,
  ChevronDown,
  ChevronRight,
  Film,
  Frame,
  Image as ImageIcon,
  Layers,
  List,
  Loader2,
  Mic,
  Music,
  Play,
  Wand2,
  X,
} from "lucide-react";
import { voiceOf } from "@/lib/hybrid-reel/voices";
import { subtitlePreset } from "../../canvas/subtitles";
import {
  PRODUCT_TYPE_LABEL,
  ROLE_META,
  MOTION_LABEL,
  onScreenSec,
  PACE_LABEL,
  type Pace,
  type Treatment,
  type ClipProfile,
  type Outline,
  type Shot,
} from "./types";

/* ── Generation plan 卡(照真实产品)──
   用户选定方案后,把之后剪辑器里要用的东西全部 plan 出来(剪辑方案 spec):
   顶部一块整片设定(旁白、音乐与踩点、字幕、字卡色、封面),下面每个镜头一项:
   自有素材标「无需生成」、AI 补拍带 prompt / 参数 / 参考图 / 尾帧;每项再列画面处理、原声、字卡、音效。
   旧版对话页:这里不生成、不扣费 —— 不显示任何 credits 数字;底部一句说明 + Cancel + Edit in canvas,生成和扣费都在画布里。
   新 Agent 传 credits:见 PlanCard 的 credits / onEdit。
   新 Agent 再传 assembly:卡里只列「要生成的」(AI 补拍 + 一项整条配音,带积分),实拍素材不是生成项,每项右下角可单独 Edit in canvas。
   不传 assembly = 原来的逐镜列表(旧版对话页不受影响)。 */
/* 执行计划里每一项的序号,和成片里的镜头顺序一致 */
function PlanSeq({ n }: { n: number }) {
  return (
    <span className="mt-px grid size-5 shrink-0 place-items-center rounded-full bg-[#ececf1] text-[11px] font-semibold tabular-nums text-[#4a4b5c]">
      {n}
    </span>
  );
}

export function Chip({ children, tone = "plain", title }: { children: ReactNode; tone?: "plain" | "accent"; title?: string }) {
  return (
    <span
      title={title}
      className={`inline-flex max-w-full items-center gap-1 truncate rounded-md border px-2 py-[3px] text-[11.5px] ${
        tone === "accent" ? "border-[#ffd9c4] bg-[#fff7f1] text-[#b8430f]" : "border-[#ececf1] bg-white text-[#1a1a2e]"
      }`}
    >
      {children}
    </span>
  );
}

/** 一格参考缩略图(视频取那一秒的画面) */
export function RefThumb({ p, at, badge }: { p?: ClipProfile; at?: number; badge?: string }) {
  if (!p?.objectUrl) return null;
  return (
    <span className="relative" title={`${p.label}${badge ? ` · ${badge}` : ""}`}>
      {p.kind === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.objectUrl} alt="" className="size-7 rounded-md object-cover ring-1 ring-[#ececf1]" />
      ) : (
        <video src={`${p.objectUrl}#t=${at ?? 0.5}`} muted preload="metadata" className="size-7 rounded-md object-cover ring-1 ring-[#ececf1]" />
      )}
      {badge && (
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-[#1a1a2e] px-1 text-[8.5px] font-bold uppercase leading-[13px] text-white">
          {badge}
        </span>
      )}
    </span>
  );
}

/** 画面处理的意图:创作意图才上卡(变速、动效、局部放大…),画幅适配这类技术细节默认处理不展示 */
export function treatmentChips(t: Treatment | undefined): string[] {
  if (!t) return [];
  const out: string[] = [];
  if (t.speed && t.speed !== 1) out.push(`${t.speed}× ${t.speed < 1 ? "slow-mo" : "speed-up"}`);
  if (t.motion && t.motion !== "none") out.push(MOTION_LABEL[t.motion]);
  if (t.zoom) out.push(`Zoom to ${t.zoom.target || "detail"}${t.zoom.follow ? " · follows cursor" : ""}`);
  if (t.device) out.push(t.device === "phone" ? "Phone frame" : "Laptop frame");
  if (t.highlight) out.push("Click highlight");
  if (t.asCard) out.push("Review card");
  if (t.stabilize) out.push("Stabilize");
  if (t.cutout) out.push("Cut out product");
  if (t.pip) out.push("Picture-in-picture");
  if (t.keepWhole) out.push("Keep whole on beat sync");
  return out;
}

function PlanDetail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-2 text-[12px] leading-snug">
      <span className="w-[74px] shrink-0 pt-[3px] font-semibold text-[#9a9bb0]">{label}</span>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">{children}</div>
    </div>
  );
}

/** 每个镜头下面的明细:画面处理、原声、字幕 / 旁白、字卡、音效 */
function ShotDetails({ shot, delivery, pace }: { shot: Shot; delivery?: string; pace?: Pace }) {
  const chips = treatmentChips(shot.treatment);
  const spoken = shot.subtitle?.text?.trim();
  return (
    <div className="mt-2.5 space-y-1.5 border-t border-dashed border-[#ececf1] pt-2.5">
      {(chips.length > 0 || shot.treatment?.note) && (
        <PlanDetail label="Picture">
          {chips.map((c) => (
            <Chip key={c}>{c}</Chip>
          ))}
          {shot.treatment?.note && <span className="text-[#6a6b7b]">{shot.treatment.note}</span>}
        </PlanDetail>
      )}
      {shot.sound && (
        <PlanDetail label="Sound">
          <Chip>{shot.sound.keep ? `Original sound ${shot.sound.volume}%` : "Original sound muted"}</Chip>
          {shot.sound.note && <span className="text-[#6a6b7b]">{shot.sound.note}</span>}
        </PlanDetail>
      )}
      {shot.source.kind === "generate" && (
        <PlanDetail label="Sound">
          <Chip>{shot.source.withAudio === false ? "No generated sound" : "Generated with its own sound"}</Chip>
        </PlanDetail>
      )}
      {spoken && (
        <PlanDetail label={shot.subtitle.source === "stt" ? "Speech" : "Voiceover"}>
          <span className="text-[#1a1a2e]">&ldquo;{spoken}&rdquo;</span>
          {shot.subtitle.source !== "stt" && (shot.delivery || delivery) && <Chip>{shot.delivery || delivery}</Chip>}
          {shot.subtitle.source !== "stt" && <Chip>{PACE_LABEL[shot.pace || pace || "normal"]} pace</Chip>}
        </PlanDetail>
      )}
      {spoken && (
        <PlanDetail label="Subtitles">
          <span className="text-[#6a6b7b]">Same words, filled in on the subtitle track</span>
        </PlanDetail>
      )}
      {!chips.length && !shot.treatment?.note && !shot.sound && !spoken && shot.source.kind !== "generate" && (
        <span className="text-[12px] text-[#9a9bb0]">Default handling</span>
      )}
    </div>
  );
}

/* 整片设定:产品类型、旁白(音色 + 语气)、音乐与踩点、字幕、封面 —— 剪辑器里每条轨的起点。
   分镜表和执行计划卡共用,出方案时就写全 */
export function WholeCut({ outline, profiles }: { outline: Outline; profiles: ClipProfile[] }) {
  const vo = outline.voiceover;
  const music = outline.music;
  const hasSpeech = outline.shots.some((s) => s.subtitle?.text?.trim());
  const musicFile = music?.source === "upload" && typeof music.clipIndex === "number" ? profiles[music.clipIndex] : undefined;
  return (
    <div className="space-y-1.5 rounded-xl border border-[#ececf1] bg-[#fbfbfc] p-3">
      <span className="mb-1 block text-[12px] font-bold uppercase tracking-[0.06em] text-[#9a9bb0]">Whole cut</span>
      {outline.productType && (
        <PlanDetail label="Product">
          <Chip>{PRODUCT_TYPE_LABEL[outline.productType]}</Chip>
        </PlanDetail>
      )}
      <PlanDetail label="Voiceover">
        <Chip>{vo?.on === false ? "No voiceover" : `Voiceover · ${voiceOf(vo?.voice).label}`}</Chip>
        {vo?.on !== false && vo?.delivery && <Chip>{vo.delivery}</Chip>}
        {vo?.on !== false && <Chip>{PACE_LABEL[vo?.pace ?? "normal"]} pace</Chip>}
        {vo?.why && <span className="text-[#6a6b7b]">{vo.why}</span>}
      </PlanDetail>
      <PlanDetail label="Music">
        <Chip>
          <Music className="size-3" />
          {music?.source === "upload" ? `Your track · ${musicFile?.label ?? ""}` : music?.source === "library" ? "From library" : "AI-generated"}
          {music?.bpm ? ` · ${music.bpm} BPM` : ""}
        </Chip>
        {music?.beatSync !== false && <Chip>Cuts on the beat</Chip>}
        <Chip>Ducks under voice</Chip>
        {(music?.prompt || outline.bgmPrompt) && music?.source !== "upload" && <span className="text-[#6a6b7b]">{music?.prompt || outline.bgmPrompt}</span>}
      </PlanDetail>
      <PlanDetail label="Subtitles">
        <Chip>{hasSpeech ? `From what's said · ${subtitlePreset(outline.subtitleStyle ?? "classic").name} style` : "None — nobody speaks"}</Chip>
      </PlanDetail>
      {outline.cover && (
        <PlanDetail label="Cover">
          <Chip>
            Shot {outline.cover.shot + 1} @ {outline.cover.atSec}s
          </Chip>
          {outline.cover.title && <span className="text-[#1a1a2e]">&ldquo;{outline.cover.title}&rdquo;</span>}
          {outline.cover.prompt && <PromptToggle label="View cover prompt" text={outline.cover.prompt} />}
        </PlanDetail>
      )}
    </div>
  );
}

/** 「View prompt」:点开看完整 prompt,和执行计划卡里 AI 镜头的同一个样式 */
export function PromptToggle({ label = "View prompt", text }: { label?: string; text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="block w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1 text-[12px] text-[#6a6b7b] hover:text-[#1a1a2e]"
      >
        {open ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
        {label}
      </button>
      {open && <span className="mt-1 block whitespace-pre-line rounded-lg bg-white px-2.5 py-2 text-[12px] leading-relaxed text-[#1a1a2e] ring-1 ring-inset ring-[#ececf1]">{text}</span>}
    </span>
  );
}

/** 方案卡状态:awaiting 待确认;cancelled 用户取消;replaced 被新一版替代;confirmed 已确认、开始生成(后三种变灰 / 不出按钮) */
export type PlanStatus = "awaiting" | "cancelled" | "replaced" | "confirmed";

const STATUS_PILL: Record<PlanStatus, { label: string; cls: string }> = {
  awaiting: { label: "Awaiting confirmation", cls: "bg-[#fff6d6] text-[#8a6a00]" },
  cancelled: { label: "Cancelled", cls: "bg-[#f1f0f4] text-[#6a6b7b]" },
  replaced: { label: "Replaced", cls: "bg-[#f1f0f4] text-[#6a6b7b]" },
  confirmed: { label: "Confirmed", cls: "bg-[#e7f6ec] text-[#1f7a3d]" },
};

/** 新 Agent 用:带上积分后,AI 镜头右侧显示每镜积分,底部换成「Execute this plan?」+ Confirm · N credits */
export type PlanCredits = { perShot: number; total: number };

/** 新 Agent 的整条广告计划:voiceover = 整条配音这一项(带积分);edit = 不计积分的「Then I'll edit it together」各行 */
export type PlanEditKind = "footage" | "subtitles" | "text" | "music" | "cut";
export type PlanAssembly = {
  voiceover?: { title: string; model: string; script: string; credits: number };
  edit: { kind: PlanEditKind; label: string; detail?: string }[];
};


/** 方案卡里的积分数字(右侧,金币图标) */
function CreditTag({ n }: { n: number }) {
  const v = n.toLocaleString("en-US");
  return (
    <span className="inline-flex shrink-0 items-center gap-1 text-[12.5px] font-semibold tabular-nums text-[#1a1a2e]" title={`${v} credits`}>
      {/* BuzzVideo 产品同款积分图标(与 /icons/credits.svg 同图) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/prototypes/homepage/credits-icon.svg" alt="" className="size-3.5" /> {v}
    </span>
  );
}

export function PlanCard({
  outline,
  profiles,
  status,
  onCancel,
  onConfirm,
  credits,
  onEdit,
  disabled,
  model = "Seedance 2.0",
  details = true,
  assembly,
}: {
  outline: Outline;
  profiles: ClipProfile[];
  status: PlanStatus;
  onCancel: () => void;
  /** 旧版:进画布;新 Agent(传了 credits):确认并开始生成 */
  onConfirm: () => void;
  credits?: PlanCredits;
  /** 新 Agent:次级按钮「Edit in canvas」 */
  onEdit?: () => void;
  /** 忙 / 生成中:按钮全部禁用 */
  disabled?: boolean;
  /** AI 镜头参数小标签里的模型名 */
  model?: string;
  /** 整片设定 + 每镜明细(画面处理、原声、旁白、字卡、音效) */
  details?: boolean;
  /** 新 Agent:只列要生成的(AI 补拍 + 整条配音),下面附「Then I'll edit it together」;不传 = 逐镜列表 */
  assembly?: PlanAssembly;
}) {
  const [openPrompt, setOpenPrompt] = useState<number | null>(null);
  const [openScript, setOpenScript] = useState(false);
  /* assembly 模式下 AI 镜头按出现顺序重新编号(1、2、3…),配音排在最后 */
  const aiSeq = new Map<number, number>();
  outline.shots.forEach((s, i) => s.source.kind === "generate" && aiSeq.set(i, aiSeq.size + 1));
  /* 点了进画布:画布页第一次打开要编译 / 加载素材,按钮先转起来,别让人以为没点到 */
  const [opening, setOpening] = useState(false);
  const itemCount = assembly ? aiSeq.size + (assembly.voiceover ? 1 : 0) : outline.shots.length;
  const withCredits = credits !== undefined;
  const pill = STATUS_PILL[status];
  const dim = status === "cancelled" || status === "replaced";
  const fmt = (n: number) => n.toLocaleString("en-US");

  return (
    <div className={`overflow-hidden rounded-2xl border border-[#ececf1] bg-white ${dim ? "opacity-55" : ""}`}>
      <div className="flex items-center gap-2 px-4 py-3">
        <ChevronDown className="size-4 text-[#6a6b7b]" />
        <span className="text-[14px] font-semibold text-[#1a1a2e]">Generation plan</span>
        <span className={`ml-auto rounded-full px-2.5 py-[3px] text-[11.5px] font-semibold ${pill.cls}`}>{pill.label}</span>
        {withCredits ? (
          <span className="inline-flex items-center gap-1 text-[12px] text-[#6a6b7b]">
            <List className="size-3.5" /> {itemCount} {itemCount === 1 ? "item" : "items"}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[12px] text-[#6a6b7b]">
            <Layers className="size-3.5" /> {itemCount} {itemCount === 1 ? "shot" : "shots"}
          </span>
        )}
      </div>

      {details && (
        <div className="mx-3 mb-2">
          <WholeCut outline={outline} profiles={profiles} />
        </div>
      )}

      <div className="space-y-2 px-3 pb-3">
        {outline.shots.map((shot, i) => {
          const role = ROLE_META[shot.role] ?? ROLE_META.hook;
          const roleName = role.label ?? String(shot.role);

          /* assembly 模式:实拍素材 / 旧会话的「请自己拍」都不是生成项,挪到下面的剪辑块 */
          if (assembly && shot.source.kind !== "generate") return null;

          /* 自有素材:编排进来,但不需要生成 */
          if (shot.source.kind === "clip") {
            const clip = profiles[shot.source.clipIndex];
            return (
              <div key={i} className="rounded-xl border border-[#ececf1] bg-[#fbfbfc] p-3">
                <div className="flex items-start gap-2">
                  <PlanSeq n={i + 1} />
                  {clip?.kind === "image" ? (
                    <ImageIcon className="mt-[3px] size-4 shrink-0 text-[#6a6b7b]" />
                  ) : (
                    <Film className="mt-[3px] size-4 shrink-0 text-[#6a6b7b]" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-semibold text-[#1a1a2e]">
                      Your footage · {roleName} ({onScreenSec(shot)}s)
                    </span>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="max-w-[360px] truncate rounded-md border border-[#ececf1] bg-white px-2 py-[3px] text-[11.5px] text-[#1a1a2e]" title={clip?.label}>
                        {clip?.label ?? `clip ${shot.source.clipIndex}`}
                        {clip?.kind === "image" ? "" : ` | ${shot.source.inSec}s–${shot.source.outSec}s`} | no generation
                      </span>
                      <RefThumb p={clip} at={shot.source.inSec} />
                    </div>
                    {details && <ShotDetails shot={shot} delivery={outline.voiceover?.delivery} pace={outline.voiceover?.pace} />}
                  </span>
                </div>
              </div>
            );
          }

          /* 旧会话里的「请自己拍」:新方案不再产出,只照原样显示 */
          if (shot.source.kind === "blocked") {
            return (
              <div key={i} className="rounded-xl border border-dashed border-[#e0dfe6] bg-white p-3">
                <div className="flex items-start gap-2">
                  <PlanSeq n={i + 1} />
                  <Ban className="mt-[3px] size-4 shrink-0 text-[#6a6b7b]" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-semibold text-[#1a1a2e]">
                      {roleName} ({onScreenSec(shot)}s)
                    </span>
                    <span className="mt-1 block text-[12px] leading-snug text-[#6a6b7b]">
                      {shot.source.reason} {shot.source.suggestion}
                    </span>
                  </span>
                </div>
              </div>
            );
          }

          const src = shot.source;
          const refs = (src.refs ?? []).map((r) => ({ p: profiles[r.clipIndex], at: r.atSec })).filter((r) => r.p?.objectUrl);
          const last = src.lastFrame ? profiles[src.lastFrame.clipIndex] : undefined;
          const open = openPrompt === i;
          return (
            <div key={i} className="rounded-xl border border-[#ececf1] bg-[#fbfbfc] p-3">
              <div className="flex items-start gap-2">
                <PlanSeq n={assembly ? (aiSeq.get(i) ?? i + 1) : i + 1} />
                <Wand2 className="mt-[3px] size-4 shrink-0 text-[#6a6b7b]" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-start gap-2">
                    <span className="min-w-0 flex-1 text-[13.5px] font-semibold text-[#1a1a2e]">
                      AI shot · {roleName} ({shot.durationSec}s)
                    </span>
                    {withCredits && <CreditTag n={credits.perShot} />}
                  </span>
                  {src.summary && <span className="mt-0.5 block text-[12.5px] leading-snug text-[#4a4b5c]">{src.summary}</span>}
                  <button
                    type="button"
                    onClick={() => setOpenPrompt(open ? null : i)}
                    aria-expanded={withCredits ? open : undefined}
                    className="mt-0.5 inline-flex items-center gap-1 text-[12px] text-[#6a6b7b] hover:text-[#1a1a2e]"
                  >
                    {open ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
                    {withCredits && open ? "Hide prompt" : "View prompt"}
                  </button>
                  {open &&
                    (withCredits ? (
                      <p className="mt-1.5 whitespace-pre-line rounded-lg bg-[#f4f4f7] px-3 py-2.5 font-mono text-[12px] leading-relaxed text-[#1a1a2e]">
                        {src.prompt}
                      </p>
                    ) : (
                      <p className="mt-1.5 whitespace-pre-line rounded-lg bg-white px-2.5 py-2 text-[12.5px] leading-relaxed text-[#1a1a2e]">
                        {src.prompt}
                      </p>
                    ))}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-md border border-[#ececf1] bg-white px-2 py-[3px] text-[11.5px] text-[#1a1a2e]">
                      {withCredits ? `${model} | 9:16 | ${shot.durationSec}s` : `${model} | 9:16 | 720p | ${shot.durationSec}s | ${src.genType}`}
                    </span>
                    {/* 参考图每镜由 AI 挑(最多 9 张);尾帧图单独标出来 */}
                    {(refs.length > 0 || last) && (
                      <span className="flex flex-wrap items-center gap-1 pb-1">
                        {refs.map((r, k) => (
                          <RefThumb key={k} p={r.p} at={r.at} />
                        ))}
                        {last && <RefThumb p={last} badge="Last" />}
                      </span>
                    )}
                    {/* 单项右下角:进画布单独改这一项 */}
                    {withCredits && onEdit && (
                      <button
                        type="button"
                        onClick={onEdit}
                        disabled={disabled}
                        className="ml-auto inline-flex items-center gap-1 rounded-lg border border-[#ececf1] bg-white px-2.5 py-1 text-[12px] font-semibold text-[#1a1a2e] transition hover:border-[#d4d3df] hover:bg-[#faf8f6] disabled:opacity-40"
                      >
                        <Frame className="size-3" /> Edit in canvas
                      </button>
                    )}
                  </div>
                  {details && <ShotDetails shot={shot} delivery={outline.voiceover?.delivery} pace={outline.voiceover?.pace} />}
                </span>
              </div>
            </div>
          );
        })}

        {/* 整条配音:一项,一次生成(Seed Audio),View script 看全部台词 */}
        {assembly?.voiceover && (
          <div className="rounded-xl border border-[#ececf1] bg-[#fbfbfc] p-3">
            <div className="flex items-start gap-2">
              <PlanSeq n={aiSeq.size + 1} />
              <Mic className="mt-[3px] size-4 shrink-0 text-[#6a6b7b]" />
              <span className="min-w-0 flex-1">
                <span className="flex items-start gap-2">
                  <span className="min-w-0 flex-1 text-[13.5px] font-semibold text-[#1a1a2e]">{assembly.voiceover.title}</span>
                  {withCredits && <CreditTag n={assembly.voiceover.credits} />}
                </span>
                <button
                  type="button"
                  onClick={() => setOpenScript((v) => !v)}
                  aria-expanded={openScript}
                  className="mt-0.5 inline-flex items-center gap-1 text-[12px] text-[#6a6b7b] hover:text-[#1a1a2e]"
                >
                  {openScript ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
                  {openScript ? "Hide script" : "View script"}
                </button>
                {openScript && (
                  <p className="mt-1.5 whitespace-pre-line rounded-lg bg-[#f4f4f7] px-3 py-2.5 text-[12.5px] leading-relaxed text-[#1a1a2e]">{assembly.voiceover.script}</p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md border border-[#ececf1] bg-white px-2 py-[3px] text-[11.5px] text-[#1a1a2e]">
                    <AudioLines className="size-3 text-[#6a6b7b]" /> {assembly.voiceover.model}
                  </span>
                  {withCredits && onEdit && (
                    <button
                      type="button"
                      onClick={onEdit}
                      disabled={disabled}
                      className="ml-auto inline-flex items-center gap-1 rounded-lg border border-[#ececf1] bg-white px-2.5 py-1 text-[12px] font-semibold text-[#1a1a2e] transition hover:border-[#d4d3df] hover:bg-[#faf8f6] disabled:opacity-40"
                    >
                      <Frame className="size-3" /> Edit in canvas
                    </button>
                  )}
                </div>
              </span>
            </div>
          </div>
        )}

      </div>

      {withCredits ? (
        /* 新 Agent:只在待确认时出底栏;取消 / 被替代 / 已确认后收起 */
        status === "awaiting" && (
          <div className="flex flex-wrap items-center gap-3 border-t border-[#ececf1] bg-[#faf8f6] px-4 py-3">
            <span className="text-[13px] text-[#6a6b7b]">
              Execute this plan? It will use about <strong className="font-semibold tabular-nums text-[#1a1a2e]">{fmt(credits.total)}</strong> credits.
            </span>
            <span className="ml-auto flex flex-wrap items-center gap-2">
              {onEdit && (
                <button
                  type="button"
                  onClick={onEdit}
                  disabled={disabled}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#ececf1] bg-white px-4 py-2 text-[13.5px] font-semibold text-[#1a1a2e] transition hover:border-[#d4d3df] hover:bg-[#faf8f6] disabled:opacity-40"
                >
                  <Frame className="size-3.5" /> Edit in canvas
                </button>
              )}
              <button
                type="button"
                onClick={onCancel}
                disabled={disabled}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#ececf1] bg-white px-4 py-2 text-[13.5px] font-semibold text-[#1a1a2e] transition hover:border-[#d4d3df] hover:bg-[#faf8f6] disabled:opacity-40"
              >
                <X className="size-3.5" /> Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={disabled}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-4 py-2 text-[13.5px] font-bold text-white shadow-[0_6px_18px_rgba(255,82,85,0.24)] transition hover:brightness-105 disabled:opacity-40 disabled:shadow-none"
              >
                <Play className="size-3.5" /> Confirm · {fmt(credits.total)} credits
              </button>
            </span>
          </div>
        )
      ) : (
        <div className="flex flex-wrap items-center gap-3 border-t border-[#ececf1] bg-[#faf8f6] px-4 py-3">
          <span className="text-[13px] text-[#6a6b7b]">
            Confirm to open this plan in the canvas — generation and credits happen there.
          </span>
          {status === "awaiting" && (
            <span className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={opening}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#ececf1] bg-white px-4 py-2 text-[13.5px] font-semibold text-[#1a1a2e] transition hover:border-[#d4d3df] hover:bg-[#faf8f6] disabled:opacity-50"
              >
                <X className="size-3.5" /> Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (opening) return;
                  setOpening(true);
                  onConfirm();
                }}
                aria-busy={opening}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-4 py-2 text-[13.5px] font-bold text-white shadow-[0_6px_18px_rgba(255,82,85,0.24)] transition hover:brightness-105 aria-busy:cursor-progress aria-busy:brightness-95"
              >
                {opening ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Opening canvas…
                  </>
                ) : (
                  <>
                    Edit in canvas <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
