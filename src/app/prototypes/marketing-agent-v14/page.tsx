"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import localFont from "next/font/local";
import {
  Plus,
  Command,
  MessageCircle,
  GitBranch,
  Frame,
  ChevronDown,
  SlidersHorizontal,
  History,
  HelpCircle,
  Search,
  PanelLeftClose,
  VolumeX,
  MoreHorizontal,
  Pin,
  Pencil,
  Trash2,
  Check,
} from "lucide-react";
import { type Mission } from "@/components/missions";

// ── design.md tokens ──────────────────────────────────────────────
const gradText =
  "bg-gradient-to-r from-[#ffc078] to-[#ff5e1a] bg-clip-text text-transparent";
const ctaGrad = "bg-gradient-to-r from-[#FFA73C] to-[#FF5255]";
const composerCta = "inline-flex h-10 shrink-0 items-center gap-2 rounded-[14px] bg-gradient-to-b from-[#ff5255] to-[#ffa73c] px-5 text-[15px] font-bold text-white shadow-[0_3px_0_#b65a42] transition hover:-translate-y-0.5 hover:brightness-105 active:translate-y-px active:shadow-none";

// ── homepage hero content block (ported from prototypes/homepage) ──
const bricolageExtraBold = localFont({
  src: "../../fonts/BricolageGrotesque-ExtraBold.ttf",
  weight: "800",
  display: "swap",
});

const HP_ICON_ROOT = "/prototypes/starter-guide/icons";
const HP_ICONS = {
  logo: `${HP_ICON_ROOT}/buzz-video-logo.svg`,
  marketing: `${HP_ICON_ROOT}/marketing-agent.svg`,
  canvas: `${HP_ICON_ROOT}/canvas.svg`,
  nanoBanana: `${HP_ICON_ROOT}/nanobanana.svg`,
  byteDance: `${HP_ICON_ROOT}/bytedance.svg`,
  gemini: `${HP_ICON_ROOT}/gemini.svg`,
  new: `${HP_ICON_ROOT}/new.svg`,
  hot: `${HP_ICON_ROOT}/hot.svg`,
};

const memberPromoAssets = {
  campaign: "/prototypes/homepage/member-campaign.png",
  dots: "/prototypes/homepage/member-dots.svg",
  sparkle: "/prototypes/homepage/member-sparkle.svg",
  tool: "/prototypes/homepage/member-tool.svg",
  history: "/prototypes/homepage/member-history.svg",
};

const ORANGE_FILTER =
  "[filter:invert(47%)_sepia(95%)_saturate(1894%)_hue-rotate(345deg)_brightness(103%)_contrast(101%)]";

// 项目文件图标沿用 Try now 按钮那颗星(member-sparkle),用 mask 上色
const SPARKLE_MASK = {
  mask: "url('/prototypes/homepage/member-sparkle.svg') center / contain no-repeat",
  WebkitMask: "url('/prototypes/homepage/member-sparkle.svg') center / contain no-repeat",
} as const;

type QuickLink = {
  name: string;
  description: string;
  icon: string;
  type?: string;
  badge?: "new" | "hot";
};

const quickLinks: readonly QuickLink[] = [
  { name: "Marketing Studio", description: "Turn ideas into campaign-ready ads in seconds", icon: HP_ICONS.marketing, badge: "hot" },
  { name: "Canvas", description: "Moodboard and chain workflows on one canvas", icon: HP_ICONS.canvas },
  { name: "Seedance 2.0", description: "Create high-quality videos in seconds", type: "Video", icon: HP_ICONS.byteDance },
  { name: "Nano Banana Pro", description: "Generate high-quality visuals", type: "Image", icon: HP_ICONS.nanoBanana },
  { name: "Gemini Omni Flash", description: "Generate and edit from any input", icon: HP_ICONS.gemini, badge: "new" },
  { name: "Seedream 5.0 Pro", description: "ByteDance's flagship image model", icon: HP_ICONS.byteDance, badge: "new" },
];

function ProductIcon({ src, label, className = "size-6" }: { src: string; label: string; className?: string }) {
  return <Image src={src} alt="" aria-label={label} width={28} height={28} className={className} />;
}

function MemberPromoCard() {
  return (
    <>
      <Image src={memberPromoAssets.dots} alt="" fill sizes="(max-width: 900px) 100vw, 40vw" className="pointer-events-none object-cover opacity-55" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-[58%] bg-[radial-gradient(ellipse_at_center_bottom,rgba(255,134,94,0.26),transparent_72%)]" />

      <div className="relative z-10 p-[clamp(18px,5cqw,38px)]">
        <h2 className={`${bricolageExtraBold.className} max-w-[70%] text-[clamp(22px,6.4cqw,44px)] leading-[0.96] tracking-[-0.055em] text-black`}>
          Marketing <span className="bg-gradient-to-r from-[#ffa73c] to-[#ff5255] bg-clip-text text-transparent">Agent</span>
        </h2>
        <p className="mt-[1.5cqw] max-w-[62%] text-[clamp(10px,2.45cqw,18px)] leading-[1.3] text-[#66666b]">Your ideas, campaign-ready in seconds</p>
      </div>

      <button className="absolute right-[5cqw] top-[5cqw] z-20 flex h-[clamp(34px,7.2cqw,54px)] w-[clamp(108px,25cqw,180px)] items-center justify-center gap-[1.5cqw] rounded-[clamp(10px,2.4cqw,18px)] bg-gradient-to-b from-[#ff5255] to-[#ffa73c] text-[clamp(14px,3cqw,21px)] font-bold text-white shadow-[0_3px_0_#b65a42] transition hover:-translate-y-0.5 active:translate-y-1 active:shadow-none">
        <Image src={memberPromoAssets.sparkle} alt="" width={42} height={42} className="size-[clamp(18px,4cqw,28px)]" />
        Try now
      </button>

      <div className="absolute left-[5cqw] right-[5cqw] top-[40%] h-[73%] overflow-visible rounded-[clamp(18px,4cqw,34px)] border border-[#ff5a52] bg-white shadow-[0_-4px_12px_rgba(255,92,52,0.58),0_-18px_48px_rgba(255,116,65,0.34),0_10px_28px_rgba(112,44,28,0.14)]">
        <div className="flex items-center gap-[1.5cqw] px-[3cqw] pb-[2.5cqw] pt-[3cqw]">
          <Image src={HP_ICONS.logo} alt="" width={32} height={32} className="size-[clamp(17px,3.2cqw,26px)]" />
          <span className="bg-gradient-to-r from-[#ffa73c] to-[#ff5255] bg-clip-text text-[clamp(11px,2.5cqw,18px)] font-bold text-transparent">Marketing Agent</span>
        </div>
        <div className="mx-[3cqw] h-px bg-[#d7d4d2]" />

        <p className="mt-[3cqw] max-w-[57%] px-[3cqw] text-[clamp(10px,2.35cqw,18px)] leading-[1.4] text-[#99999d] min-[900px]:max-w-[64%] lg:!max-w-[57%] 2xl:!max-w-[68%]">
          Create a full campaign for @BuzzMilk, with assets tailored for every social platform
        </p>

        <div className="absolute bottom-[12cqw] left-[3cqw] z-10 flex items-center gap-[1.2cqw]">
          <button aria-label="Add campaign material" className="grid size-[clamp(28px,5cqw,42px)] place-items-center rounded-full border border-[#eeeeee] bg-white text-[clamp(18px,3cqw,26px)] leading-none shadow-sm">+</button>
          <button className="flex h-[clamp(28px,5cqw,42px)] items-center gap-1 rounded-full border border-[#ff665c] bg-[#fff8f2] px-[clamp(10px,2.5cqw,18px)] text-[clamp(9px,2cqw,14px)] font-semibold text-[#ff6a45]">
            <Image src={memberPromoAssets.sparkle} alt="" width={42} height={42} className={`size-[clamp(13px,2.5cqw,18px)] ${ORANGE_FILTER}`} />
            Marketing Agent
          </button>
          <button aria-label="Campaign tools" className="rounded-full">
            <Image src={memberPromoAssets.tool} alt="" width={56} height={56} className="size-[clamp(28px,5cqw,42px)]" />
          </button>
          <button aria-label="Campaign history" className="rounded-full">
            <Image src={memberPromoAssets.history} alt="" width={56} height={56} className="size-[clamp(28px,5cqw,42px)]" />
          </button>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-0 right-[-3cqw] z-20 h-[45%] w-[42%]">
        <Image src={memberPromoAssets.campaign} alt="BuzzMilk campaign preview" fill sizes="(max-width: 900px) 42vw, 20vw" className="object-contain object-right-bottom" />
      </div>
    </>
  );
}

const SIDE_NAV = [
  { label: "Agent", Icon: Command, active: true },
  { label: "Chat", Icon: MessageCircle },
  { label: "Workflows", Icon: GitBranch },
  { label: "Canvas", Icon: Frame },
];

const SHOWCASES = [
  {
    title: "UGC Product Stories",
    subtitle: "Creator-led videos that make products feel personal.",
    category: "UGC",
    prompt:
      "Create a 15s vertical UGC-style video for my product with a natural creator, handheld shots and an authentic voiceover.",
    icon: "/prototypes/marketing-agent/showcase-icons/ugc-product-stories.png",
    scenes: [
      "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330608821661655040.png",
      "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330606655119089664.png",
      "https://assets.presslogic.com/buzzvideo/users/273004174491336704/2026-01-30/275553228433690624.png",
    ],
  },
  {
    title: "Creative Product Launch",
    subtitle: "Turn a product idea into polished campaign-ready scenes.",
    category: "Commercial",
    prompt:
      "Create a premium product launch video with three scroll-stopping scenes and a clear product payoff.",
    icon: "/prototypes/marketing-agent/showcase-icons/creative-product-launch.png",
    scenes: [
      "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330635333039349760.png",
      "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330635237258223616.png",
      "https://assets.presslogic.com/buzzvideo/users/system-gemini-generate/2026-07-02/330911349427200000.jpg",
    ],
  },
  {
    title: "TikTok Shop Hook",
    subtitle: "Build a fast product hook made for the first three seconds.",
    category: "TikTok",
    prompt:
      "Create a TikTok Shop video with a bold first-three-second hook, authentic creator energy and a clear product payoff.",
    icon: "/prototypes/marketing-agent/showcase-icons/tiktok-shop-hook.png",
    scenes: [
      "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330626771449864192.png",
      "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330625260154052608.png",
      "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330626793218301952.png",
    ],
  },
  {
    title: "Creator Review Edit",
    subtitle: "Package real product reactions into a high-converting cut.",
    category: "UGC",
    prompt:
      "Create a product review video with genuine creator reactions, close-up proof points and quick social-native editing.",
    icon: "/prototypes/marketing-agent/showcase-icons/creator-review-edit.png",
    scenes: [
      "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330612429845225472.png",
      "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330612545176002560.png",
      "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330612416196960256.png",
    ],
  },
  {
    title: "Launch Day Teaser",
    subtitle: "Make a premium, scroll-stopping teaser for a new release.",
    category: "Commercial",
    prompt:
      "Create a premium launch-day teaser for my product with dramatic product detail, cinematic pacing and a clear end frame.",
    icon: "/prototypes/marketing-agent/showcase-icons/launch-day-teaser.png",
    scenes: [
      "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330631043537231872.png",
      "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330631017700319232.png",
      "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330631030883016704.png",
    ],
  },
  {
    title: "TikTok Trend Remix",
    subtitle: "Adapt a proven trend into an on-brand product story.",
    category: "TikTok",
    prompt:
      "Create a TikTok trend remix for my product using fast cuts, a native creator voice and a memorable product reveal.",
    icon: "/prototypes/marketing-agent/showcase-icons/tiktok-trend-remix.png",
    scenes: [
      "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330657569574019072.jpg",
      "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330656482720800768.jpg",
      "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330658527779545088.jpg",
    ],
  },
];

function TikTokMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={className} fill="none">
      <path d="M17.2618 8.51118C15.7788 8.51118 14.4057 8.03996 13.2845 7.23914V13.0605C13.2845 15.9726 10.9226 18.3333 8.00903 18.3333C6.92195 18.3333 5.91156 18.0048 5.07222 17.4415C3.66193 16.495 2.7334 14.8858 2.7334 13.0605C2.7334 10.1486 5.09536 7.78785 8.00912 7.78791C8.25126 7.78779 8.4931 7.80423 8.73298 7.837V8.48335L8.73284 10.7533C8.50196 10.6801 8.25582 10.6404 8.00045 10.6404C6.6676 10.6404 5.58731 11.7203 5.58731 13.0522C5.58731 13.994 6.12731 14.8095 6.91475 15.2067C7.24125 15.3714 7.60999 15.4641 8.00048 15.4641C9.33059 15.4641 10.409 14.3886 10.4136 13.0605V1.66666H13.2844V2.03356C13.2945 2.14326 13.3091 2.25253 13.3281 2.36109C13.5274 3.49697 14.2069 4.46744 15.1501 5.0557C15.7835 5.45085 16.5153 5.65974 17.2618 5.65861L17.2618 8.51118Z" fill="currentColor" />
    </svg>
  );
}

function UgcMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5.75 6.75v-1a3 3 0 0 1 3-3h6.5a3 3 0 0 1 3 3v1m-12.5 0h12.5m-12.5 0v4h-1.5v3h1.5v7.5m12.5-14.5v9.5a3 3 0 0 1-3 3h-4v2m7-14.5h3M10.719 9.944h.01m4.115 0h.01m-.604 5.306c-1.75.25-3.52 0-4.25-1.25" />
    </svg>
  );
}

function CommercialMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 7.375V6.347m0 10.278v1.028m2.226-8.736C13.78 8.302 12.95 7.889 12 7.889h-.286c-1.26 0-2.283.818-2.283 1.827v.078c0 .722.51 1.382 1.316 1.705l2.506 1.002c.807.323 1.316.983 1.316 1.705 0 1.052-1.066 1.905-2.382 1.905H12c-.951 0-1.781-.413-2.226-1.028M21.25 12a9.25 9.25 0 1 1-18.5 0 9.25 9.25 0 0 1 18.5 0" />
    </svg>
  );
}

const SHOWCASE_FILTERS = [
  { label: "All" },
  { label: "TikTok", Icon: TikTokMark, badge: "NEW" },
  { label: "UGC", Icon: UgcMark },
  { label: "Commercial", Icon: CommercialMark },
];

const PROJECTS = [
  { name: "Summer launch" },
  { name: "UGC refresh" },
  { name: "Skincare drop" },
  { name: "Back to school" },
];

const COMPOSER_ICON_ROOT = "/prototypes/marketing-agent/composer-icons";
const COMPOSER_ICONS = {
  member: `${COMPOSER_ICON_ROOT}/member.svg`,
  marketing: `${COMPOSER_ICON_ROOT}/marketing-agent.svg`,
  image: `${COMPOSER_ICON_ROOT}/image.svg`,
  video: `${COMPOSER_ICON_ROOT}/video.svg`,
};

type ComposerMenu = "agent" | "settings" | null;
type AgentKind = "marketing" | "image" | "video";
type ModelMode = "image" | "video";
type ModelOption = { name: string; description: string; icon: string };

const AGENT_OPTIONS: ReadonlyArray<{
  id: AgentKind;
  label: string;
  description: string;
  premium?: boolean;
}> = [
  {
    id: "marketing",
    label: "Marketing Agent",
    description: "AI marketing expert — marketing strategy, ad copy, and creatives in one.",
  },
  {
    id: "image",
    label: "Image Gen",
    description: "Fast high-quality image generation, best for fast creative iteration.",
  },
  {
    id: "video",
    label: "Video Gen",
    description: "Up to 15 seconds of cinematic-quality video with synced audio and visuals.",
    premium: true,
  },
];

const MODEL_OPTIONS: Record<ModelMode, readonly ModelOption[]> = {
  image: [
    { name: "Seedream 5.0 Pro", description: "ByteDance's top-tier reasoning image model", icon: HP_ICONS.byteDance },
    { name: "Nano Banana 2 Lite", description: "Fastest speed, lowest cost", icon: HP_ICONS.nanoBanana },
    { name: "GPT-image-2", description: "OpenAI best image generation model", icon: COMPOSER_ICONS.image },
    { name: "Seedream 5.0 lite", description: "Intelligent visual reasoning", icon: HP_ICONS.byteDance },
    { name: "Nano Banana 2", description: "Pro-level quality at Flash speed", icon: HP_ICONS.nanoBanana },
  ],
  video: [
    { name: "Seedance 2.0", description: "Create high-quality videos in seconds", icon: HP_ICONS.byteDance },
    { name: "Veo 3", description: "Cinematic generation with native audio", icon: COMPOSER_ICONS.video },
  ],
};

function AgentIcon({ kind, className = "size-5", brandColor = false }: { kind: AgentKind; className?: string; brandColor?: boolean }) {
  const src = kind === "marketing" ? COMPOSER_ICONS.marketing : kind === "image" ? COMPOSER_ICONS.image : COMPOSER_ICONS.video;
  return <img src={src} alt="" className={className} style={brandColor ? { filter: "invert(47%) sepia(95%) saturate(1894%) hue-rotate(345deg) brightness(103%) contrast(101%)" } : undefined} />;
}

function AgentPicker({
  selectedAgent,
  onSelect,
}: {
  selectedAgent: AgentKind;
  onSelect: (agent: AgentKind) => void;
}) {
  return (
    <div className="w-[min(260px,calc(100vw-48px))] rounded-[16px] border border-white/80 bg-white/95 p-1.5 shadow-[0_10px_28px_rgba(26,26,46,0.14)] backdrop-blur-xl">
      <p className="px-2.5 pb-1.5 pt-1 text-[12px] font-medium text-[#a0a1aa]">Creation type</p>
      {AGENT_OPTIONS.map(({ id, label, premium }) => {
        const isSelected = id === selectedAgent;
        return (
          <button
            key={id}
            type="button"
            role="option"
            aria-selected={isSelected}
            onClick={() => onSelect(id)}
            className={`flex w-full items-center gap-2 rounded-[11px] px-2.5 py-2 text-left transition ${
              isSelected ? "bg-[#f1f1f2]" : "hover:bg-[#fafafd]"
            }`}
          >
            <span className={`grid size-7 shrink-0 place-items-center ${isSelected ? "text-[#ff6a2e]" : "text-[#485063]"}`}>
              <AgentIcon kind={id} className="size-[18px]" />
            </span>
            <span className="flex min-w-0 flex-1 items-center gap-1.5 text-[13px] font-medium leading-4 text-[#15182b]">
                {label}
                {premium && <img src={COMPOSER_ICONS.member} alt="Member" className="size-4" />}
            </span>
            {isSelected && <Check className="size-3.5 shrink-0 text-[#15182b]" />}
          </button>
        );
      })}
    </div>
  );
}

function ModelSettings({
  autoEnabled,
  onAutoChange,
  modelMode,
  onModelModeChange,
  resolution,
  onResolutionChange,
  aspectRatio,
  onAspectRatioChange,
  selectedModel,
  onSelectedModelChange,
}: {
  autoEnabled: boolean;
  onAutoChange: (value: boolean) => void;
  modelMode: ModelMode;
  onModelModeChange: (mode: ModelMode) => void;
  resolution: string;
  onResolutionChange: (value: string) => void;
  aspectRatio: string;
  onAspectRatioChange: (value: string) => void;
  selectedModel: string;
  onSelectedModelChange: (model: string) => void;
}) {
  const resolutions = ["Low", "Medium", "High"];
  const ratios = ["1:1", "3:4", "4:3", "4:5", "9:16", "16:9"];
  const isImage = modelMode === "image";
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const models = MODEL_OPTIONS[modelMode];

  return (
    <div role="dialog" aria-label="Model settings" className="w-[min(300px,calc(100vw-32px))] rounded-[18px] border border-[#ececf1] bg-white p-3 shadow-[0_12px_30px_rgba(26,26,46,0.16)]">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-bold text-[#27160f]">Model Settings</h2>
        <button
          type="button"
          role="switch"
          aria-checked={autoEnabled}
          onClick={() => onAutoChange(!autoEnabled)}
          className="flex items-center gap-2 text-[12px] text-[#a0a1aa]"
        >
          Auto
          <span className={`relative h-6 w-10 rounded-full transition ${autoEnabled ? ctaGrad : "bg-[#d9d9df]"}`}>
            <span className={`absolute top-1 size-4 rounded-full bg-white shadow-sm transition ${autoEnabled ? "left-5" : "left-1"}`} />
          </span>
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 rounded-xl bg-[#f7f7f8] p-1">
        {(["image", "video"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => { onModelModeChange(mode); onSelectedModelChange(MODEL_OPTIONS[mode][0].name); setModelPickerOpen(false); }}
            className={`rounded-lg px-2 py-2 text-[12px] font-medium transition ${
              modelMode === mode ? "bg-white text-[#3a2f2b] shadow-[0_2px_7px_rgba(26,26,46,0.08)]" : "text-[#b6b7be]"
            }`}
          >
            {mode === "image" ? "Image Model" : "Video Model"}
          </button>
        ))}
      </div>

      <div className="relative mt-3">
        <span className="text-[12px] font-medium text-[#a0a1aa]">Model</span>
        <button type="button" onClick={() => setModelPickerOpen((open) => !open)} className="mt-1.5 flex w-full items-center justify-between rounded-xl border border-[#ececf1] px-3 py-2 text-left">
          <span className="flex items-center gap-2 text-[13px] text-[#776f70]">
            {isImage ? <img src={COMPOSER_ICONS.image} alt="" className="size-4" /> : <img src={COMPOSER_ICONS.video} alt="" className="size-4" />}
            {selectedModel}
            <img src={COMPOSER_ICONS.member} alt="Member" className="size-3.5" />
          </span>
          <ChevronDown className="size-5 text-[#b7b8be]" />
        </button>
        {modelPickerOpen && (
          <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 overflow-hidden rounded-xl border border-[#ececf1] bg-white p-1 shadow-[0_12px_30px_rgba(26,26,46,0.15)]">
            {models.map(({ name, description, icon }) => {
              const isSelected = selectedModel === name;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => { onSelectedModelChange(name); setModelPickerOpen(false); }}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition ${isSelected ? "bg-[#f1f1f2]" : "hover:bg-[#fafafd]"}`}
                >
                  <Image src={icon} alt="" width={20} height={20} className="size-5 shrink-0 object-contain" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-[12px] font-medium text-[#27160f]">{name}<img src={COMPOSER_ICONS.member} alt="Member" className="size-3" /></span>
                    <span className="mt-0.5 block text-[10px] leading-3 text-[#94969e]">{description}</span>
                  </span>
                  {isSelected && <Check className="size-3.5 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-3">
        <span className="text-[12px] font-medium text-[#a0a1aa]">Resolution</span>
        <div className="mt-1.5 grid grid-cols-3 rounded-xl bg-[#f7f7f8] p-1">
          {resolutions.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onResolutionChange(value)}
              className={`rounded-lg py-2 text-[12px] transition ${resolution === value ? "bg-white text-[#766b67] shadow-[0_2px_7px_rgba(26,26,46,0.08)]" : "text-[#b5b6bd]"}`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3">
        <span className="text-[12px] font-medium text-[#a0a1aa]">Aspect Ratio</span>
        <div className="mt-1.5 grid grid-cols-6 gap-1 rounded-xl bg-[#f7f7f8] p-1.5">
          {ratios.map((ratio) => (
            <button
              key={ratio}
              type="button"
              onClick={() => onAspectRatioChange(ratio)}
              className={`flex w-full flex-col items-center justify-center gap-1 rounded-lg px-1 py-1.5 text-center text-[11px] transition ${aspectRatio === ratio ? "bg-white text-[#766b67] shadow-[0_2px_7px_rgba(26,26,46,0.08)]" : "text-[#b5b6bd]"}`}
            >
              <span className="flex h-7 items-center justify-center">
                <span className={`block w-6 rounded-[4px] border-2 border-current ${ratio === "1:1" ? "aspect-square" : ratio === "9:16" || ratio === "3:4" || ratio === "4:5" ? "h-7" : "h-4"}`} />
              </span>
              {ratio}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ComposerControls({
  openMenu,
  onMenuChange,
  selectedAgent,
  onAgentChange,
  autoEnabled,
  onAutoChange,
  modelMode,
  onModelModeChange,
  resolution,
  onResolutionChange,
  aspectRatio,
  onAspectRatioChange,
  selectedModel,
  onSelectedModelChange,
  showHistory = false,
  menuPlacement = "up",
}: {
  openMenu: ComposerMenu;
  onMenuChange: (menu: ComposerMenu) => void;
  selectedAgent: AgentKind;
  onAgentChange: (agent: AgentKind) => void;
  autoEnabled: boolean;
  onAutoChange: (value: boolean) => void;
  modelMode: ModelMode;
  onModelModeChange: (mode: ModelMode) => void;
  resolution: string;
  onResolutionChange: (value: string) => void;
  aspectRatio: string;
  onAspectRatioChange: (value: string) => void;
  selectedModel: string;
  onSelectedModelChange: (model: string) => void;
  showHistory?: boolean;
  menuPlacement?: "up" | "down";
}) {
  const agentLabel = AGENT_OPTIONS.find(({ id }) => id === selectedAgent)?.label ?? "Marketing Agent";

  return (
    <div data-composer-menu className="relative flex items-center gap-2 text-[#6a6b7b]">
      <span className="grid size-9 place-items-center rounded-lg border border-[#ececf1] bg-white">
        <Plus className="size-[18px]" />
      </span>
      <div className="relative">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={openMenu === "agent"}
          onClick={() => onMenuChange(openMenu === "agent" ? null : "agent")}
          className="flex items-center gap-1.5 rounded-lg border border-[#ececf1] bg-white px-3 py-[7px] text-[13px] font-semibold text-[#ff5e1a] transition hover:border-[#ffbd99] hover:bg-[#fffaf7]"
        >
          <AgentIcon kind={selectedAgent} className="size-4" brandColor /> {agentLabel}
          <ChevronDown className={`size-4 transition ${openMenu === "agent" ? "rotate-180" : ""}`} />
        </button>
        {openMenu === "agent" && (
          <div className={`absolute left-0 z-[60] ${menuPlacement === "down" ? "top-[calc(100%+12px)]" : "bottom-[calc(100%+12px)]"}`}>
            <AgentPicker selectedAgent={selectedAgent} onSelect={(agent) => { onAgentChange(agent); onMenuChange(null); }} />
          </div>
        )}
      </div>
      <div className="relative">
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={openMenu === "settings"}
          onClick={() => onMenuChange(openMenu === "settings" ? null : "settings")}
          className="hidden items-center gap-1.5 rounded-lg border border-[#ececf1] bg-white px-3 py-[7px] text-[13px] font-semibold transition hover:border-[#ffbd99] hover:bg-[#fffaf7] sm:flex"
        >
          <SlidersHorizontal className="size-4" /> {autoEnabled ? "Auto" : "Manual"}
        </button>
        {openMenu === "settings" && (
          <div className={`absolute left-0 z-[60] ${menuPlacement === "down" ? "top-[calc(100%+12px)]" : "bottom-[calc(100%+12px)]"}`}>
            <ModelSettings
              autoEnabled={autoEnabled}
              onAutoChange={onAutoChange}
              modelMode={modelMode}
              onModelModeChange={onModelModeChange}
              resolution={resolution}
              onResolutionChange={onResolutionChange}
              aspectRatio={aspectRatio}
              onAspectRatioChange={onAspectRatioChange}
              selectedModel={selectedModel}
              onSelectedModelChange={onSelectedModelChange}
            />
          </div>
        )}
      </div>
      {showHistory && <History className="hidden size-[18px] text-[#9a9bb0] sm:block" />}
    </div>
  );
}

export function MarketingAgentPromptComposer({
  className = "",
  scrollReactive = false,
}: {
  className?: string;
  scrollReactive?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [openMenu, setOpenMenu] = useState<ComposerMenu>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentKind>("marketing");
  const [autoEnabled, setAutoEnabled] = useState(true);
  const [modelMode, setModelMode] = useState<ModelMode>("image");
  const [selectedModel, setSelectedModel] = useState("GPT-image-2");
  const [resolution, setResolution] = useState("Low");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const lastScrollY = useRef(0);
  const isHovered = useRef(false);

  useEffect(() => {
    if (!openMenu) return;

    const closeMenu = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest("[data-composer-menu]")) {
        setOpenMenu(null);
      }
    };

    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, [openMenu]);

  useEffect(() => {
    if (!scrollReactive) return;

    lastScrollY.current = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY.current;

      if (scrollDelta < -4) {
        setExpanded(true);
      } else if (scrollDelta > 4 && !isHovered.current) {
        setExpanded(false);
        setOpenMenu(null);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrollReactive]);

  return (
    <div
      className={className}
      onMouseEnter={() => {
        isHovered.current = true;
        setExpanded(true);
      }}
      onMouseLeave={() => {
        isHovered.current = false;
      }}
    >
      <div className="rounded-[22px] border border-[#ececf1] bg-white/95 shadow-[0_20px_50px_rgba(26,26,46,0.18)] backdrop-blur-xl transition-all duration-300 focus-within:border-[#ff5e1a] focus-within:ring-2 focus-within:ring-[#ff5e1a]/20">
        {expanded ? (
          <div className="p-3">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Describe your idea or campaign..."
              className="h-[72px] w-full resize-none bg-transparent px-2 pt-1 text-[15px] leading-relaxed text-[#1a1a2e] outline-none placeholder:text-[#9a9bb0]"
              aria-label="Marketing campaign prompt"
            />
            <div className="flex items-center justify-between gap-2 px-1 pt-2">
              <ComposerControls
                openMenu={openMenu}
                onMenuChange={setOpenMenu}
                selectedAgent={selectedAgent}
                onAgentChange={setSelectedAgent}
                autoEnabled={autoEnabled}
                onAutoChange={setAutoEnabled}
                modelMode={modelMode}
                onModelModeChange={setModelMode}
                resolution={resolution}
                onResolutionChange={setResolution}
                aspectRatio={aspectRatio}
                onAspectRatioChange={setAspectRatio}
                selectedModel={selectedModel}
                onSelectedModelChange={setSelectedModel}
              />
              <button type="button" className={composerCta}>
                <Image src={memberPromoAssets.sparkle} alt="" width={42} height={42} className="size-[18px]" />
                Create
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            onFocus={() => setExpanded(true)}
            className="flex h-[62px] w-full items-center gap-3 px-3 text-left"
            aria-label="Expand Marketing Agent prompt"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-[#ececf1] text-[#707186]">
              <Plus className="size-4" />
            </span>
            <span className="min-w-0 flex-1 truncate border-l border-[#ededf2] pl-3 text-[15px] text-[#9a9bb0]">
              {draft || "Describe your idea or campaign..."}
            </span>
            <span className={composerCta}>
              <Image src={memberPromoAssets.sparkle} alt="" width={42} height={42} className="size-[18px]" />
              Create
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

export default function MarketingAgentMissions() {
  const [draft, setDraft] = useState("");
  const [attached, setAttached] = useState<Mission["attachments"]>(undefined);
  const [openProjectMenu, setOpenProjectMenu] = useState<string | null>(null);
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [activeProject, setActiveProject] = useState<string>(PROJECTS[0].name);
  const [projectQuery, setProjectQuery] = useState("");
  const [activeShowcaseFilter, setActiveShowcaseFilter] = useState("All");
  const [showFloatingComposer, setShowFloatingComposer] = useState(false);
  const [floatingComposerExpanded, setFloatingComposerExpanded] = useState(false);
  const [openComposerMenu, setOpenComposerMenu] = useState<ComposerMenu>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentKind>("marketing");
  const [autoEnabled, setAutoEnabled] = useState(true);
  const [modelMode, setModelMode] = useState<ModelMode>("image");
  const [selectedModel, setSelectedModel] = useState("GPT-image-2");
  const [resolution, setResolution] = useState("Low");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const topComposerRef = useRef<HTMLDivElement>(null);
  const showcaseSectionRef = useRef<HTMLElement>(null);
  const lastScrollY = useRef(0);
  const floatingComposerHoveredRef = useRef(false);

  useEffect(() => {
    const updateFloatingComposer = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY.current;
      const topComposer = topComposerRef.current?.getBoundingClientRect();
      const showcaseSection = showcaseSectionRef.current?.getBoundingClientRect();
      const shouldShow = Boolean(
        topComposer &&
          showcaseSection &&
          topComposer.bottom <= 0 &&
          showcaseSection.top < window.innerHeight,
      );

      setShowFloatingComposer((shown) => (shown === shouldShow ? shown : shouldShow));

      if (!shouldShow) {
        setFloatingComposerExpanded(false);
        setOpenComposerMenu(null);
      } else if (Math.abs(scrollDelta) > 4) {
        if (scrollDelta < 0) {
          setFloatingComposerExpanded(true);
        } else if (!floatingComposerHoveredRef.current) {
          setFloatingComposerExpanded(false);
          setOpenComposerMenu(null);
        }
      }

      lastScrollY.current = currentScrollY;
    };

    lastScrollY.current = window.scrollY;
    const frame = window.requestAnimationFrame(updateFloatingComposer);
    window.addEventListener("scroll", updateFloatingComposer, { passive: true });
    window.addEventListener("resize", updateFloatingComposer);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateFloatingComposer);
      window.removeEventListener("resize", updateFloatingComposer);
    };
  }, []);

  useEffect(() => {
    if (!openComposerMenu) return;

    const closeMenu = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest("[data-composer-menu]")) {
        setOpenComposerMenu(null);
      }
    };

    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, [openComposerMenu]);

  useEffect(() => {
    if (!openProjectMenu) return;
    const handlePointerDown = (event: MouseEvent) => {
      if ((event.target as HTMLElement).closest("[data-project-menu]")) return;
      setOpenProjectMenu(null);
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [openProjectMenu]);

  const tryShowcase = (prompt: string) => {
    setDraft(prompt);
    setAttached(undefined);
  };

  const visibleShowcases =
    activeShowcaseFilter === "All"
      ? SHOWCASES
      : SHOWCASES.filter(({ category }) => category === activeShowcaseFilter);

  const visibleProjects = PROJECTS.filter(({ name }) =>
    name.toLowerCase().includes(projectQuery.trim().toLowerCase()),
  );

  return (
    <div className="relative isolate min-h-screen bg-[#fffdfb] text-[#1a1a2e]">
      <div className="marketing-agent-atmosphere" aria-hidden="true" />
      <div className="relative z-10 flex">
        {/* left icon rail (collapsed nav) */}
        <aside className={`fixed inset-y-0 left-0 z-40 hidden w-[72px] flex-col items-center gap-1 overflow-y-auto border-r border-[#ececf1] bg-white py-4 ${projectsOpen ? "lg:flex" : ""}`}>
          <span className={`mb-3 grid size-9 place-items-center rounded-[11px] ${ctaGrad} text-white`}>
            <img src="/prototypes/marketing-agent/brand-logo-white.svg" alt="Buzz" className="size-5" />
          </span>
          {SIDE_NAV.map(({ label, Icon, active }) => (
            <button
              key={label}
              className={`flex w-14 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] font-semibold leading-none transition ${
                active
                  ? "bg-[#fff3ec] text-[#ff5e1a]"
                  : "text-[#6a6b7b] hover:bg-[#fff7f1] hover:text-[#ff5e1a]"
              }`}
            >
              <Icon className="size-[20px]" />
              {label}
            </button>
          ))}
        </aside>

        {/* projects sidebar */}
        <aside className={`fixed inset-y-0 z-40 hidden flex-col border-r border-[#ececf1] bg-white lg:flex ${projectsOpen ? "left-[72px] w-[264px]" : "left-0 w-[72px] items-center"}`}>
          {projectsOpen ? (
          <>
            <div className="flex items-center justify-between gap-2 border-b border-[#ececf1] px-4 py-[18px]">
              <div className="flex min-w-0 items-center gap-2">
                <span className="grid size-7 shrink-0 place-items-center text-[#1a1a2e]">
                  <Command className="size-5" />
                </span>
                <span className="truncate font-[family-name:var(--font-display)] text-[15px] font-extrabold tracking-tight">
                  Marketing Agent
                </span>
              </div>
              <button
                onClick={() => setProjectsOpen(false)}
                className="grid size-7 shrink-0 place-items-center rounded-lg text-[#8d8e9d] transition hover:bg-[#fff3ec] hover:text-[#ff5e1a]"
                aria-label="Collapse projects panel"
              >
                <PanelLeftClose className="size-[18px]" />
              </button>
            </div>

            <div className="flex items-center justify-between px-4 pb-2 pt-2">
              <span className="text-[13px] font-bold text-[#8d8e9d]">
                Projects
              </span>
              <button
                className="grid size-7 place-items-center rounded-lg text-[#6a6b7b] transition hover:bg-[#fff3ec] hover:text-[#ff5e1a]"
                aria-label="New project"
              >
                <Plus className="size-4" />
              </button>
            </div>

            <div className="px-3 pb-2">
              <div className="flex items-center gap-2 rounded-xl border border-[#ececf1] bg-[#fafafd] px-3 py-2 text-sm transition focus-within:border-[#ff5e1a] focus-within:bg-white">
                <Search className="size-4 shrink-0 text-[#9a9bb0]" />
                <input
                  value={projectQuery}
                  onChange={(e) => setProjectQuery(e.target.value)}
                  placeholder="Search projects"
                  className="w-full bg-transparent text-[#1a1a2e] outline-none placeholder:text-[#9a9bb0]"
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-0.5 px-2 pb-4">
              {visibleProjects.map(({ name }) => {
                const menuOpen = openProjectMenu === name;
                const isActive = activeProject === name;
                return (
                  <div key={name} className="group relative">
                    <button
                      onClick={() => setActiveProject(name)}
                      className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm font-semibold transition ${
                        isActive
                          ? "bg-[#f7f7f9] text-[#1a1a2e]"
                          : "text-[#4a4b5c] hover:bg-[#fafafd]"
                      }`}
                    >
                      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#f3f3f6]">
                        <span aria-hidden className="size-4 bg-[#c2c2ce]" style={SPARKLE_MASK} />
                      </span>
                      <span className="min-w-0 flex-1 truncate capitalize">{name}</span>
                    </button>
                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                      <button
                        data-project-menu
                        onClick={() => setOpenProjectMenu(menuOpen ? null : name)}
                        className={`grid size-7 place-items-center rounded-lg text-[#777889] transition hover:bg-white hover:text-[#ff5e1a] ${
                          menuOpen
                            ? "bg-white text-[#ff5e1a]"
                            : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
                        }`}
                        aria-label={`More actions for ${name}`}
                        aria-expanded={menuOpen}
                      >
                        <MoreHorizontal className="size-4" />
                      </button>
                    </div>
                    {menuOpen && (
                      <div data-project-menu className="absolute left-full top-0 z-50 ml-2 w-40 overflow-hidden rounded-xl border border-[#ececf1] bg-white py-1 shadow-[0_14px_30px_rgba(26,26,46,0.16)]">
                        <button onClick={() => setOpenProjectMenu(null)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-semibold text-[#1a1a2e] transition hover:bg-[#fff7f1]">
                          <Pin className="size-4" /> Pin
                        </button>
                        <button onClick={() => setOpenProjectMenu(null)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-semibold text-[#1a1a2e] transition hover:bg-[#fff7f1]">
                          <Pencil className="size-4" /> Rename
                        </button>
                        <div className="my-1 border-t border-[#fff0ea]" />
                        <button onClick={() => setOpenProjectMenu(null)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-semibold text-[#ef5139] transition hover:bg-[#fff7f1]">
                          <Trash2 className="size-4" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              {visibleProjects.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-[#9a9bb0]">No projects found</p>
              )}
            </div>
          </>
          ) : (
          <>
            <button
              onClick={() => setProjectsOpen(true)}
              aria-label="Expand projects panel"
              className={`mt-4 grid size-9 place-items-center rounded-[11px] ${ctaGrad} text-white`}
            >
              <img src="/prototypes/marketing-agent/brand-logo-white.svg" alt="Buzz" className="size-5" />
            </button>
            <div className="my-3 h-px w-8 bg-[#ececf1]" />
            <button
              aria-label="New project"
              className="grid size-11 place-items-center rounded-xl border border-dashed border-[#d4d4dd] text-[#6a6b7b] transition hover:border-[#ff5e1a] hover:text-[#ff5e1a]"
            >
              <Plus className="size-[18px]" />
            </button>
            <div className="mt-3 flex min-h-0 flex-1 flex-col items-center gap-2 overflow-y-auto">
              {PROJECTS.map(({ name }) => {
                const isActive = activeProject === name;
                return (
                  <button
                    key={name}
                    title={name}
                    onClick={() => setActiveProject(name)}
                    className={`grid size-11 shrink-0 place-items-center rounded-xl transition ${
                      isActive
                        ? "border-2 border-[#1a1a2e] bg-white"
                        : "bg-[#f2f2f6] hover:bg-[#ececf1]"
                    }`}
                  >
                    <span aria-hidden className={`size-[18px] ${isActive ? "bg-[#1a1a2e]" : "bg-[#9a9bb0]"}`} style={SPARKLE_MASK} />
                  </button>
                );
              })}
            </div>
            <button className="mb-5 mt-3 flex flex-col items-center gap-1 text-[11px] font-semibold leading-none text-[#8d8e9d] transition hover:text-[#ff5e1a]">
              <MoreHorizontal className="size-5" />
              More
            </button>
          </>
          )}
        </aside>

        {/* main */}
        <main className={`min-w-0 flex-1 transition-[margin] ${projectsOpen ? "lg:ml-[336px]" : "lg:ml-[72px]"}`}>
          {/* top bar */}
          <header className="flex items-center justify-end gap-3 px-6 py-3">
            <span className="flex items-center gap-1.5 rounded-full bg-[#fff3ec] px-3 py-1.5 text-xs font-bold text-[#ff5e1a]">
              63,016 credits
            </span>
            <button className={`rounded-full ${ctaGrad} px-4 py-1.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(255,82,85,0.28)]`}>
              Upgrade
            </button>
            <HelpCircle className="size-5 text-[#9a9bb0]" />
            <span className="grid size-8 place-items-center rounded-full bg-[#1a1a2e] text-xs font-bold text-white">
              S
            </span>
          </header>

          <div className="px-6">
            {/* hero */}
            <h1 className="mt-6 text-center font-[family-name:var(--font-display)] text-[clamp(30px,3.6vw,48px)] font-extrabold leading-[1.1] tracking-tight">
              <span className={gradText}>Marketing Agent:</span> Your ideas,
              <br /> campaign-ready in seconds
            </h1>

            {/* composer */}
            <div ref={topComposerRef} className="mx-auto mt-7 w-[768px] max-w-full">
              <div className="flex h-[178px] flex-col rounded-[22px] border border-[#ececf1] bg-white p-3.5 shadow-[0_4px_16px_rgba(26,26,46,0.06)] transition focus-within:border-[#ff5e1a] focus-within:ring-2 focus-within:ring-[#ff5e1a]/20">
                {attached && attached.length > 0 && (
                  <div className="mb-1.5 flex flex-wrap items-center gap-2 px-1">
                    {attached.map((a) => (
                      <div key={a.label} className="relative">
                        {a.type === "video" ? (
                          <video
                            src={a.url}
                            muted
                            playsInline
                            className="size-11 rounded-lg object-cover ring-1 ring-[#ececf1]"
                          />
                        ) : (
                          <img
                            src={a.url}
                            alt={a.label}
                            className="size-11 rounded-lg object-cover ring-1 ring-[#ececf1]"
                          />
                        )}
                        <button
                          onClick={() =>
                            setAttached((prev) =>
                              prev?.filter((x) => x.label !== a.label),
                            )
                          }
                          className="absolute -right-1.5 -top-1.5 grid size-4 place-items-center rounded-full bg-[#1a1a2e] text-[10px] leading-none text-white"
                          aria-label={`Remove ${a.label}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Describe your idea or campaign, or paste a product / landing page / IG post URL. Use @ to reference uploaded files."
                  className="w-full flex-1 resize-none bg-transparent px-2 pt-1 text-[15px] leading-relaxed text-[#1a1a2e] outline-none placeholder:text-[#9a9bb0]"
                />
                <div className="flex items-center justify-between gap-2 px-1 pt-2">
                  <ComposerControls
                    openMenu={openComposerMenu}
                    onMenuChange={setOpenComposerMenu}
                    selectedAgent={selectedAgent}
                    onAgentChange={setSelectedAgent}
                    autoEnabled={autoEnabled}
                    onAutoChange={setAutoEnabled}
                    modelMode={modelMode}
                    onModelModeChange={setModelMode}
                    resolution={resolution}
                    onResolutionChange={setResolution}
                    aspectRatio={aspectRatio}
                    onAspectRatioChange={setAspectRatio}
                    selectedModel={selectedModel}
                    onSelectedModelChange={setSelectedModel}
                    showHistory
                    menuPlacement="down"
                  />
                  <button
                    type="button"
                    className={composerCta}
                  >
                    <Image src={memberPromoAssets.sparkle} alt="" width={42} height={42} className="size-[18px]" />
                    Create
                  </button>
                </div>
              </div>
            </div>

            {/* homepage hero content block (replaces former My projects cards) */}
            <section className="mx-auto mt-10 w-full max-w-[1180px]">
              <div className="grid items-stretch gap-4 min-[900px]:h-[clamp(270px,calc(468px-14.4vw),324px)] min-[900px]:grid-cols-[minmax(0,1.8fr)_minmax(0,1.6fr)] lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,0.72fr)_minmax(0,1fr)]">
                <article className="relative aspect-[3/2] overflow-hidden rounded-[24px] border border-[#f0eeee] bg-white shadow-[0_10px_26px_rgba(255,123,83,0.12)] [container-type:inline-size] sm:aspect-[1.9/1] min-[900px]:h-full min-[900px]:!aspect-auto">
                  <MemberPromoCard />
                </article>

                <div className="grid min-h-[280px] self-stretch grid-cols-2 gap-3 sm:min-h-[320px] min-[900px]:h-full min-[900px]:!min-h-0 min-[900px]:grid-cols-3 min-[900px]:grid-rows-2">
                  {quickLinks.map(({ name, description, type, icon, badge }) => (
                    <button key={name} className="group relative flex min-h-[136px] min-w-0 flex-col overflow-hidden rounded-2xl border border-[#ececf1] bg-white p-4 text-left shadow-[0_4px_16px_rgba(26,26,46,0.04)] transition hover:-translate-y-0.5 hover:border-[#ffc7a9] hover:bg-[#fffaf7] hover:shadow-[0_10px_24px_rgba(26,26,46,0.08)] sm:min-h-[154px] sm:p-5 min-[900px]:!min-h-0 min-[900px]:!p-4">
                      <div className="flex items-start justify-between gap-3">
                        <ProductIcon src={icon} label={name} className="size-7 min-[900px]:size-6 2xl:size-7" />
                        {badge ? (
                          <Image src={badge === "hot" ? HP_ICONS.hot : HP_ICONS.new} alt={badge === "hot" ? "Hot" : "New"} width={42} height={21} className="absolute right-3 top-3 h-5 w-auto" />
                        ) : type ? (
                          <span className="rounded-full bg-[#f5f3f1] px-2.5 py-1 text-[10px] font-bold text-[#6a6b7b]">{type}</span>
                        ) : null}
                      </div>
                      <div className="mt-auto pt-3">
                        <h3 className="truncate text-[16px] font-extrabold tracking-tight min-[900px]:text-[15px] 2xl:text-[16px]">{name}</h3>
                        <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-[#6a6b7b] min-[900px]:text-[11px] 2xl:text-[12px]">{description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section ref={showcaseSectionRef} className="mx-auto mb-20 mt-12 max-w-[1180px] xl:pt-[26px]">
              <div className="mb-6 flex flex-wrap items-center justify-center gap-2 xl:mb-[26px]" role="tablist" aria-label="Creation categories">
                {SHOWCASE_FILTERS.map(({ label, Icon, badge }) => {
                  const isActive = activeShowcaseFilter === label;
                  const tabId = `showcase-tab-${label.toLowerCase().replaceAll(" ", "-")}`;
                  return (
                    <button
                      key={label}
                      id={tabId}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-controls="showcase-panel"
                      onClick={() => setActiveShowcaseFilter(label)}
                      className={`relative flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border px-[18px] text-[13px] font-semibold leading-4 shadow-[0_2px_2px_rgba(26,26,46,0.06),inset_0_1px_2px_rgba(255,255,255,0.9)] backdrop-blur-xl transition-[background-color,color,filter] motion-reduce:transition-none ${
                        isActive
                          ? "border-transparent bg-[#1a1a2e] text-white shadow-[0_3px_8px_rgba(26,26,46,0.18),inset_0_1px_2px_rgba(255,255,255,0.16)]"
                          : "border-white/70 bg-white/35 text-[#626371] shadow-[0_3px_8px_rgba(26,26,46,0.06),inset_0_1px_1px_rgba(255,255,255,0.78)] hover:border-white/90 hover:bg-white/55 hover:text-[#1a1a2e]"
                      }`}
                    >
                      {Icon && <Icon className="size-4 shrink-0" />}
                      {label}
                      {badge && <img src="/prototypes/starter-guide/icons/new.svg" alt="New" className="h-[18px] w-auto" />}
                    </button>
                  );
                })}
              </div>

              <div
                id="showcase-panel"
                role="tabpanel"
                aria-labelledby={`showcase-tab-${activeShowcaseFilter.toLowerCase().replaceAll(" ", "-")}`}
                className="grid gap-5 lg:grid-cols-2"
              >
                {visibleShowcases.map(({ title, subtitle, icon, scenes, prompt }) => (
                  <article
                    key={title}
                    className="flex flex-col rounded-[26px] border border-[#ececf1] bg-white p-3 shadow-[0_12px_34px_rgba(26,26,46,0.04)]"
                  >
                    <div className="grid grid-cols-3 gap-2">
                      {scenes.map((scene, index) => (
                        <button
                          key={scene}
                          onClick={() => tryShowcase(prompt)}
                          className="group relative aspect-[0.72] overflow-hidden rounded-[17px] bg-[#efeff4] text-left xl:aspect-[0.59]"
                          aria-label={`Recreate ${title} scene ${index + 1}`}
                        >
                          <img
                            src={scene}
                            alt=""
                            className="size-full object-cover transition duration-500 group-hover:scale-105"
                          />
                          <span className="absolute inset-0 bg-[#1a1a2e]/18 opacity-0 transition duration-200 group-hover:opacity-100" />
                          <span className="absolute right-2 top-2 grid size-8 scale-90 place-items-center rounded-full bg-[#1a1a2e]/75 text-white opacity-0 shadow-sm backdrop-blur-sm transition duration-200 group-hover:scale-100 group-hover:opacity-100">
                            <VolumeX className="size-4" />
                          </span>
                          <span className="absolute inset-x-2 bottom-2 flex translate-y-2 items-center justify-center rounded-lg bg-white px-2 py-2 text-xs font-extrabold text-[#1a1a2e] opacity-0 shadow-[0_8px_20px_rgba(26,26,46,0.2)] transition duration-200 group-hover:translate-y-0 group-hover:opacity-100">
                            Recreate
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="mt-3 flex h-[45px] items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-2xl border border-white bg-[#fff7f2] shadow-[0_7px_16px_rgba(255,94,26,0.1)]">
                          <img src={icon} alt="" className="size-full object-contain" />
                        </span>
                        <div>
                          <h3 className="text-[17px] font-semibold leading-tight">{title}</h3>
                          <p className="mt-0.5 text-sm leading-snug text-[#7b7c8d]">{subtitle}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => tryShowcase(prompt)}
                        className="shrink-0 rounded-lg bg-gradient-to-r from-[#FFA73C] to-[#FF6B4E] px-4 py-2 text-sm font-extrabold text-white shadow-[0_8px_18px_rgba(255,94,26,0.2)] transition hover:brightness-105"
                      >
                        Try
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>

      {showFloatingComposer && (
        <div
          className={`fixed bottom-5 left-1/2 z-50 w-[min(860px,calc(100vw-32px))] -translate-x-1/2 transition-all duration-300 ease-out ${projectsOpen ? "lg:left-[calc(50%+168px)]" : "lg:left-[calc(50%+36px)]"}`}
          onMouseEnter={() => {
            floatingComposerHoveredRef.current = true;
            setFloatingComposerExpanded(true);
          }}
          onMouseLeave={() => {
            floatingComposerHoveredRef.current = false;
          }}
        >
          <div className="rounded-[22px] border border-[#ececf1] bg-white/95 shadow-[0_20px_50px_rgba(26,26,46,0.18)] backdrop-blur-xl transition-all duration-300 focus-within:border-[#ff5e1a] focus-within:ring-2 focus-within:ring-[#ff5e1a]/20">
            {floatingComposerExpanded ? (
              <div className="p-3">
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Describe your idea or campaign..."
                  className="h-[72px] w-full resize-none bg-transparent px-2 pt-1 text-[15px] leading-relaxed text-[#1a1a2e] outline-none placeholder:text-[#9a9bb0]"
                  aria-label="Floating campaign prompt"
                />
                <div className="flex items-center justify-between gap-2 px-1 pt-2">
                  <ComposerControls
                    openMenu={openComposerMenu}
                    onMenuChange={setOpenComposerMenu}
                    selectedAgent={selectedAgent}
                    onAgentChange={setSelectedAgent}
                    autoEnabled={autoEnabled}
                    onAutoChange={setAutoEnabled}
                    modelMode={modelMode}
                    onModelModeChange={setModelMode}
                    resolution={resolution}
                    onResolutionChange={setResolution}
                    aspectRatio={aspectRatio}
                    onAspectRatioChange={setAspectRatio}
                    selectedModel={selectedModel}
                    onSelectedModelChange={setSelectedModel}
                  />
                  <button
                    type="button"
                    className={composerCta}
                  >
                    <Image src={memberPromoAssets.sparkle} alt="" width={42} height={42} className="size-[18px]" />
                    Create
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setFloatingComposerExpanded(true)}
                onFocus={() => setFloatingComposerExpanded(true)}
                className="flex h-[62px] w-full items-center gap-3 px-3 text-left"
                aria-label="Expand campaign prompt"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-[#ececf1] text-[#707186]">
                  <Plus className="size-4" />
                </span>
                <span className="min-w-0 flex-1 truncate border-l border-[#ededf2] pl-3 text-[15px] text-[#9a9bb0]">
                  {draft || "Describe your idea or campaign..."}
                </span>
                <span className={composerCta}>
                  <Image src={memberPromoAssets.sparkle} alt="" width={42} height={42} className="size-[18px]" />
                  Create
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
