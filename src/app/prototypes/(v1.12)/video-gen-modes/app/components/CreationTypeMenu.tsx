"use client";

/* 首页输入框的 Creation type 下拉(照真实产品):左列各类型，右侧讲当前悬停的那种。
   2026-11-18 Monica 定:原来的 Audio Gen 拆成 Voiceover / Music / Sound Effects 三种(audio 这个 key 现在 = 配音)。 */

import { useEffect, useRef, useState } from "react";
import { AudioWaveform, Check, ChevronDown, Music, type LucideIcon } from "lucide-react";

export type CreationType = "marketing" | "image" | "video" | "audio" | "music" | "sfx";

const ICON = "/prototypes/marketing-agent/composer-icons";
/** icon = 产品现有的 svg;Music / Sound Effects 没有现成 svg,用 lucide 图标(Icon) */
const TYPES: { id: CreationType; label: string; icon?: string; Icon?: LucideIcon; description: string; features: string[]; howTo: string }[] = [
  /* 2026-11-18 Monica:描述照线上产品原文(Marketing Agent / Image Gen / Video Gen / Audio Gen);
     Voiceover 用线上 Audio Gen 的描述，Music / Sound Effects 照同一口吻写 */
  {
    id: "marketing",
    label: "Marketing Agent",
    icon: `${ICON}/marketing-agent.svg`,
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
    icon: `${ICON}/image.svg`,
    description: "Fast high-quality image generation, best for fast creative iteration.",
    features: ["Generate high-quality visual assets directly", "Great for character, scene, or product reference images", "Output can feed directly into video creation by using @ to mention any assets"],
    howTo: "Describe your subject, style, composition, and lighting — and let your creativity take it from there.",
  },
  {
    id: "video",
    label: "Video Gen",
    icon: `${ICON}/video.svg`,
    description: "Up to 30 seconds of cinematic-quality video with synced audio and visuals.",
    features: ["Built for single-shot, short-form video generation", "Emphasizes cinematic atmosphere, movement, and rhythm", "Perfect for quick test clips and creative validation"],
    howTo: "Provide subject, scene, camera language, and style keywords. Get a draft first, then iterate.",
  },
  {
    id: "audio",
    label: "Voiceover",
    icon: `${ICON}/audio.svg`,
    description: "Turn a script into natural-sounding voiceover with a preset or cloned voice.",
    features: ["Text-to-speech with preset or cloned voices", "Fine control over speed, pitch, volume and sample rate", "Outputs MP3 or WAV, with optional subtitles"],
    howTo: "Pick a voice, paste the script you want spoken, and adjust speed or pitch if the delivery needs tuning.",
  },
  {
    id: "music",
    label: "Music",
    Icon: Music,
    description: "Background music or a full song with lyrics, from one sentence.",
    features: ["Instrumental background music timed to your ad", "Full songs with vocals — lyrics written for you from one line", "Set the mood, genre and tempo"],
    howTo: "Describe the mood, genre and tempo, or what the song should be about, and the lyrics are written for you.",
  },
  {
    id: "sfx",
    label: "Sound Effects",
    Icon: AudioWaveform,
    description: "Sound effects for product reveals, transitions and scenes.",
    features: ["Whooshes, clicks, ambience and more", "Short one-shots or seamless loops", "Set the length, or let it fit the description"],
    howTo: "Describe the sound and where it plays, like a soft whoosh for a product reveal.",
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
        {current.Icon ? (
          <current.Icon className="size-4" />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={current.icon} alt="" className="size-4" style={{ filter: "invert(47%) sepia(95%) saturate(1894%) hue-rotate(345deg) brightness(103%) contrast(101%)" }} />
        )}
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
                {t.Icon ? (
                  <t.Icon className="size-[18px] text-[#1a1a2e]" strokeWidth={1.75} />
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={t.icon} alt="" className="size-[18px]" />
                )}
                <span className="flex-1">{t.label}</span>
                {t.id === value && <Check className="size-4" />}
              </button>
            ))}
          </div>
          <div className="hidden min-w-0 flex-1 border-l border-[#ececf1] p-4 sm:block">
            {/* 照线上：标题左边一个带边框的橙色图标块 */}
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#ffd8c2] bg-[#fff7f1] text-[#ff5e1a]">
                {detail.Icon ? (
                  <detail.Icon className="size-5" />
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={detail.icon} alt="" className="size-5" style={{ filter: "invert(47%) sepia(95%) saturate(1894%) hue-rotate(345deg) brightness(103%) contrast(101%)" }} />
                )}
              </span>
              <p className="text-[15px] font-bold text-[#15182b]">{detail.label}</p>
            </div>
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
            <p className="mt-3 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-[#a0a1aa]">How to use</p>
            <p className="mt-2 rounded-xl bg-[#f6f5f8] px-3 py-2.5 text-[13px] leading-relaxed text-[#15182b]">{detail.howTo}</p>
          </div>
        </div>
      )}
    </div>
  );
}
