"use client";

/* 落地页 composer 里的「创作类型」选择:按钮样式与弹层沿用 Marketing Agent 首页(v1.13 hybrid-reel/agent 的 AgentPicker),
   左栏选类型、右栏讲 hover 到的那一条。本原型只做 Hybrid Reel 这条流程,其他类型能选、但 Create 不走下去。 */

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Clapperboard, Lock } from "lucide-react";

export type CreationType = "marketing" | "image" | "video" | "hybrid";

const ICON_ROOT = "/prototypes/marketing-agent/composer-icons";
const ICONS = {
  member: `${ICON_ROOT}/member.svg`,
  marketing: `${ICON_ROOT}/marketing-agent.svg`,
  image: `${ICON_ROOT}/image.svg`,
  video: `${ICON_ROOT}/video.svg`,
};

const OPTIONS: ReadonlyArray<{
  id: CreationType;
  label: string;
  description: string;
  premium?: boolean;
  enterprise?: boolean;
  features: string[];
  howTo: string;
}> = [
  {
    id: "marketing",
    label: "Marketing Agent",
    description: "AI marketing expert — marketing strategy, ad copy, and creatives in one.",
    features: [
      "Built-in marketing and advertising expertise",
      "Automatically breaks down your task and selects the right tools",
      "Plans full campaigns — strategy, messaging, and creative direction",
      "Generates images and videos guided by marketing strategy",
    ],
    howTo: "Describe your product, brief or just an idea. It handles the full picture — marketing strategy, ad copy, and the creatives to go with it.",
  },
  {
    id: "image",
    label: "Image Gen",
    description: "Fast high-quality image generation, best for fast creative iteration.",
    features: [
      "Text-to-image and image-to-image in one place",
      "Swap models without leaving the composer",
      "Reference your uploaded files with @",
      "Built for iterating on a look, fast",
    ],
    howTo: "Describe the shot you want, or drop a reference image and say what to change.",
  },
  {
    id: "video",
    label: "Video Gen",
    description: "Up to 15 seconds of cinematic-quality video with synced audio and visuals.",
    premium: true,
    features: [
      "Up to 15 seconds per generation",
      "Synced audio and visuals",
      "Image or video reference for consistency",
      "Cinematic camera language out of the box",
    ],
    howTo: "Describe the scene and the camera move. Add a reference frame to lock the look.",
  },
  {
    id: "hybrid",
    label: "Hybrid Reel",
    description: "Turn footage you already shot into a ready-to-run ad — AI reads every clip, shoots what is missing and edits it all into one cut.",
    enterprise: true,
    features: [
      "Reads every clip you upload — picture and sound in one pass",
      "Plans the cut around ad beats: hook, pain, proof, usage, CTA",
      "Finds the beat your footage can't fill, and shoots only that",
    ],
    /* 本流程最多问 4 题(平台 / 字幕语言 / 时长 / AI 补拍),只问 AI 替用户定的项 */
    howTo: "Drop in whatever you already shot, answer a few quick questions about the campaign, and approve the storyboard before anything is rendered.",
  },
];

export const creationLabel = (t: CreationType) => OPTIONS.find((o) => o.id === t)!.label;

/** 落地页顶部主题文案:渐变的「类型名:」+ 两行标语,跟着选中的创作类型换 */
export const CREATION_HERO: Record<CreationType, [string, string]> = {
  /* Marketing Agent 沿用首页线上原文案,不改 */
  marketing: ["Your ideas,", "campaign-ready in seconds"],
  image: ["Ad-ready product shots,", "no photoshoot needed"],
  video: ["Ad-ready video clips,", "with sound, from one prompt"],
  hybrid: ["Your footage + AI shots,", "auto-edited into one finished ad"],
};

function TypeIcon({ kind, className = "size-5", brandColor = false }: { kind: CreationType; className?: string; brandColor?: boolean }) {
  if (kind === "hybrid") return <Clapperboard className={className} style={brandColor ? { color: "#ff5e1a" } : undefined} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={ICONS[kind]}
      alt=""
      className={className}
      style={brandColor ? { filter: "invert(47%) sepia(95%) saturate(1894%) hue-rotate(345deg) brightness(103%) contrast(101%)" } : undefined}
    />
  );
}

export function CreationTypePicker({
  value,
  onChange,
  defaultOpen = false,
}: {
  value: CreationType;
  onChange: (t: CreationType) => void;
  /** 评审原型用:挂载时弹层就打开(「切换创作类型」步骤);开发原型不传 */
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  /* 右栏跟着鼠标走;没 hover 时讲当前选中的那一条 */
  const [hovered, setHovered] = useState<CreationType | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
  const detail = OPTIONS.find((o) => o.id === (hovered ?? value)) ?? OPTIONS[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-[#ececf1] bg-white px-3 py-[7px] text-[13px] font-semibold text-[#ff5e1a] transition hover:border-[#ffbd99] hover:bg-[#fffaf7]"
      >
        <TypeIcon kind={value} className="size-4" brandColor /> {creationLabel(value)}
        <ChevronDown className={`size-4 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-[calc(100%+12px)] z-[60]">
          <div
            role="listbox"
            onMouseLeave={() => setHovered(null)}
            className="flex w-[min(624px,calc(100vw-48px))] overflow-hidden rounded-[16px] border border-white/80 bg-white/95 shadow-[0_10px_28px_rgba(26,26,46,0.14)] backdrop-blur-xl"
          >
            {/* 左:创作类型 */}
            <div className="w-[252px] shrink-0 p-1.5">
              <p className="px-2.5 pb-1.5 pt-1 text-[12px] font-medium text-[#a0a1aa]">Creation type</p>
              {OPTIONS.map(({ id, label, premium, enterprise }) => {
                const isSelected = id === value;
                const isHovered = id === (hovered ?? value);
                return (
                  <button
                    key={id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setHovered(id)}
                    onFocus={() => setHovered(id)}
                    onClick={() => {
                      onChange(id);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded-[11px] px-2.5 py-2 text-left transition ${isHovered ? "bg-[#f1f1f2]" : "hover:bg-[#fafafd]"}`}
                  >
                    <span className={`grid size-7 shrink-0 place-items-center ${isSelected ? "text-[#ff6a2e]" : "text-[#485063]"}`}>
                      <TypeIcon kind={id} className="size-[18px]" />
                    </span>
                    <span className="flex min-w-0 flex-1 items-center gap-1.5 whitespace-nowrap text-[13px] font-medium leading-4 text-[#15182b]">
                      {label}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {premium && <img src={ICONS.member} alt="Member" className="size-4" />}
                      {enterprise && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#ff5e1a] px-1.5 py-[1px] text-[9.5px] font-bold uppercase tracking-wide text-white">
                          <Lock className="size-2.5" /> Enterprise
                        </span>
                      )}
                    </span>
                    {isSelected && <Check className="size-3.5 shrink-0 text-[#15182b]" />}
                  </button>
                );
              })}
            </div>
            {/* 右:hover 到哪条就讲哪条 */}
            <div className="hidden min-w-0 flex-1 border-l border-[#ececf1] p-4 sm:block">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-[#fff3ec] text-[#ff6a2e]">
                  <TypeIcon kind={detail.id} className="size-[18px]" brandColor />
                </span>
                <span className="text-[15px] font-bold text-[#15182b]">{detail.label}</span>
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-[#6a6b7b]">{detail.description}</p>
              <p className="mt-4 border-t border-[#ececf1] pt-3 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-[#a0a1aa]">Key features</p>
              <ul className="mt-2 space-y-1.5">
                {detail.features.map((f) => (
                  <li key={f} className="flex gap-2 text-[13px] leading-snug text-[#15182b]">
                    <span className="mt-[6px] size-1.5 shrink-0 rounded-full bg-[#ff5e1a]" />
                    {f}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-[#a0a1aa]">How to use</p>
              <p className="mt-2 rounded-xl bg-[#f6f5f8] px-3 py-2.5 text-[13px] leading-relaxed text-[#15182b]">{detail.howTo}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
