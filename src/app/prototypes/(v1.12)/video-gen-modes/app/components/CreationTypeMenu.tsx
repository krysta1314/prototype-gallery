"use client";

/* 首页输入框的 Creation type 下拉(照真实产品):左列四种类型，右侧讲当前悬停的那种。 */

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export type CreationType = "marketing" | "image" | "video" | "audio";

const ICON = "/prototypes/marketing-agent/composer-icons";
const TYPES: { id: CreationType; label: string; icon: string; description: string; features: string[]; howTo: string }[] = [
  {
    id: "marketing",
    label: "Marketing Agent",
    icon: `${ICON}/marketing-agent.svg`,
    description: "AI marketing expert — marketing strategy, ad copy, and creatives in one.",
    features: ["Built-in marketing and advertising expertise", "Automatically breaks down your task and selects the right tools", "Picks the right video mode for your files"],
    howTo: "Describe your product, brief or just an idea. It handles the full picture — strategy, copy, and the creatives to go with it.",
  },
  {
    id: "image",
    label: "Image Gen",
    icon: `${ICON}/image.svg`,
    description: "Fast high-quality image generation, best for fast creative iteration.",
    features: ["Text-to-image and image-to-image in one place", "Swap models without leaving the composer"],
    howTo: "Describe the shot you want, or drop a reference image and say what to change.",
  },
  {
    id: "video",
    label: "Video Gen",
    icon: `${ICON}/video.svg`,
    description: "Cinematic video with synced audio — pick a model, then the way you want to guide it.",
    features: ["Omni Reference, First & Last Frame, Keyframes", "Edit and extend videos where the model supports it", "Up to 30 seconds on supported models"],
    howTo: "Pick a model and a mode, add your frames or references, then describe the scene.",
  },
  {
    id: "audio",
    label: "Audio Gen",
    icon: `${ICON}/audio.svg`,
    description: "Voiceovers, music and sound effects for your ads.",
    features: ["Natural voiceovers in many languages", "Background music that fits the mood"],
    howTo: "Describe the sound you want, or paste the script to voice.",
  },
];

export function CreationTypeMenu({ value, onChange }: { value: CreationType; onChange: (t: CreationType) => void }) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState<CreationType>(value);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  const current = TYPES.find((t) => t.id === value)!;
  const detail = TYPES.find((t) => t.id === hover)!;
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          setHover(value);
          setOpen((o) => !o);
        }}
        className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-[#ffcfb3] bg-[#fff7f1] px-3 text-[13px] font-semibold text-[#ff5e1a] transition hover:brightness-[0.98]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current.icon} alt="" className="size-4" style={{ filter: "invert(47%) sepia(95%) saturate(1894%) hue-rotate(345deg) brightness(103%) contrast(101%)" }} />
        {current.label}
        <ChevronDown className="size-3.5" />
      </button>
      {open && (
        <div role="menu" className="absolute left-0 top-[calc(100%+8px)] z-40 flex w-[min(576px,calc(100vw-48px))] overflow-hidden rounded-2xl border border-[#ececf1] bg-white shadow-[0_16px_40px_rgba(26,26,46,0.16)]">
          <div className="w-[230px] shrink-0 p-1.5">
            <p className="px-2.5 pb-1 pt-1.5 text-[12px] text-[#a0a1aa]">Creation type</p>
            {TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                role="menuitemradio"
                aria-checked={t.id === value}
                onMouseEnter={() => setHover(t.id)}
                onFocus={() => setHover(t.id)}
                onClick={() => {
                  onChange(t.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left text-[13.5px] text-[#1a1a2e] transition ${t.id === hover ? "bg-[#f4f3f6]" : ""}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.icon} alt="" className="size-[18px]" />
                <span className="flex-1">{t.label}</span>
                {t.id === value && <Check className="size-4" />}
              </button>
            ))}
          </div>
          <div className="hidden min-w-0 flex-1 border-l border-[#ececf1] p-4 sm:block">
            <p className="text-[15px] font-bold text-[#15182b]">{detail.label}</p>
            <p className="mt-2 text-[13px] leading-relaxed text-[#6a6b7b]">{detail.description}</p>
            <p className="mt-3 border-t border-[#ececf1] pt-3 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-[#a0a1aa]">Key features</p>
            <ul className="mt-2 space-y-1.5">
              {detail.features.map((f) => (
                <li key={f} className="flex gap-2 text-[13px] leading-snug text-[#15182b]">
                  <span className="mt-[6px] size-1.5 shrink-0 rounded-full bg-[#ff5e1a]" />
                  {f}
                </li>
              ))}
            </ul>
            <p className="mt-3 rounded-xl bg-[#f6f5f8] px-3 py-2.5 text-[13px] leading-relaxed text-[#15182b]">{detail.howTo}</p>
          </div>
        </div>
      )}
    </div>
  );
}
