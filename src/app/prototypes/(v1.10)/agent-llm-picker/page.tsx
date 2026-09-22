"use client";

import { useEffect, useId, useState } from "react";
import Image from "next/image";
import localFont from "next/font/local";
import { Plus, ChevronDown, SlidersHorizontal, Check, Globe } from "lucide-react";

const bricolageExtraBold = localFont({
  src: "../../../fonts/BricolageGrotesque-ExtraBold.ttf",
  weight: "800",
  display: "swap",
});

// ── design.md tokens ──────────────────────────────────────────────
const gradText =
  "bg-gradient-to-r from-[#ffc078] to-[#ff5e1a] bg-clip-text text-transparent";
const ctaGrad = "bg-gradient-to-r from-[#FFA73C] to-[#FF5255]";
const composerCta =
  "inline-flex h-10 shrink-0 items-center gap-2 rounded-[14px] bg-gradient-to-b from-[#ff5255] to-[#ffa73c] px-5 text-[15px] font-bold text-white shadow-[0_3px_0_#b65a42] transition hover:-translate-y-0.5 hover:brightness-105 active:translate-y-px active:shadow-none";

// Frontend-only placeholder: real per-model pricing is backend-configured.
const ESTIMATED_CREDITS_PLACEHOLDER = 120;
const ESTIMATED_OUTPUT_COUNT_PLACEHOLDER = 4;
const DEMO_CREDITS_BALANCE = 63016;

const HP_ICON_ROOT = "/prototypes/starter-guide/icons";
const HP_ICONS = {
  nanoBanana: `${HP_ICON_ROOT}/nanobanana.svg`,
  byteDance: `${HP_ICON_ROOT}/bytedance.svg`,
};

const memberPromoAssets = {
  sparkle: "/prototypes/homepage/member-sparkle.svg",
};

const COMPOSER_ICON_ROOT = "/prototypes/marketing-agent/composer-icons";
const COMPOSER_ICONS = {
  member: `${COMPOSER_ICON_ROOT}/member.svg`,
  marketing: `${COMPOSER_ICON_ROOT}/marketing-agent.svg`,
  image: `${COMPOSER_ICON_ROOT}/image.svg`,
  video: `${COMPOSER_ICON_ROOT}/video.svg`,
};

type ComposerMenu = "agent" | "settings" | "llm" | null;
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

// ── NEW: the LLM that drives the agent ────────────────────
// 驱动 Agent 思考的大语言模型，按厂商分组。生图 / 生视频模型不在这里
// —— 它们归旁边的 Model Settings 面板管，两条线互不干扰。
type LlmVendor = "Google" | "OpenAI" | "Anthropic" | "xAI" | "Qwen";
type LlmOption = { name: string; description: string; vendor: LlmVendor };


const LLM_VENDORS: readonly LlmVendor[] = ["Google", "OpenAI", "Anthropic", "xAI", "Qwen"];

// 五家官方 logo，Monica 提供；Claude / Grok / Qwen 是 PNG，其余两家是 SVG
const LLM_ICON_ROOT = "/prototypes/agent-llm-picker/icons";
const VENDOR_ICONS: Record<LlmVendor, string> = {
  Google: `${LLM_ICON_ROOT}/gemini.svg`,
  OpenAI: `${LLM_ICON_ROOT}/openai.svg`,
  Anthropic: `${LLM_ICON_ROOT}/claude.png`,
  xAI: `${LLM_ICON_ROOT}/grok.png`,
  Qwen: `${LLM_ICON_ROOT}/qwen.png`,
};


const LLM_OPTIONS: readonly LlmOption[] = [
  { name: "GPT-6 Astra", vendor: "OpenAI", description: "For demanding, long-running work" },
  { name: "GPT-5.6 Luna", vendor: "OpenAI", description: "Fast and reliable for daily work" },
  { name: "Claude Fable 5.1", vendor: "Anthropic", description: "For your toughest challenges" },
  { name: "Claude Opus 5", vendor: "Anthropic", description: "For complex tasks" },
  { name: "Gemini 3.8 Flash", vendor: "Google", description: "For long-running agent work" },
  { name: "Gemini 3.5 Flash-Lite", vendor: "Google", description: "Fastest for quick answers" },
  { name: "Gemini 3.1 Flash-Lite", vendor: "Google", description: "Most efficient for light tasks" },
  { name: "Gemini 2.5 Flash-Lite", vendor: "Google", description: "Cheapest for bulk tasks" },
  { name: "Grok 4.6", vendor: "xAI", description: "For real-time trends and news" },
  { name: "Qwen3.8 Max", vendor: "Qwen", description: "Top-tier quality at lower cost" },
];




const DEFAULT_LLM = "Gemini 3.8 Flash";

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

/**
 * NEW —— 把驱动 Agent 的 LLM 开放给用户选。
 * 版式对齐 Claude 的模型列表:模型名 + 一行短描述 + 右侧选中勾,不放图标与徐章。
 * 不显示任何价格,也没有推理强度档位。
 */
function LlmPicker({
  selectedLlm,
  onSelect,
}: {
  selectedLlm: string;
  onSelect: (llm: string) => void;
}) {
  return (
    <div className="w-[min(320px,calc(100vw-48px))] rounded-[16px] border border-white/80 bg-white/95 p-1.5 shadow-[0_10px_28px_rgba(26,26,46,0.14)] backdrop-blur-xl">
      <div className="max-h-[368px] overflow-y-auto py-1 pr-0.5">
        {LLM_VENDORS.map((vendor) => {
          const items = LLM_OPTIONS.filter((option) => option.vendor === vendor);
          if (items.length === 0) return null;
          return (
            <div key={vendor}>
              <p className="px-3 pb-1 pt-2 text-[11px] font-medium text-[#c2c3cb]">{vendor}</p>
              {items.map(({ name, description }) => {
                const isSelected = name === selectedLlm;
                return (
                  <button
                    key={name}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => onSelect(name)}
                    className={`flex w-full items-center gap-2.5 rounded-[11px] px-3 py-2 text-left transition ${
                      isSelected ? "bg-[#f1f1f2]" : "hover:bg-[#fafafd]"
                    }`}
                  >
                    <img src={VENDOR_ICONS[vendor]} alt="" className="size-[18px] shrink-0 object-contain" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-medium leading-5 text-[#15182b]">{name}</span>
                      <span className="mt-px block truncate text-[12px] leading-4 text-[#94969e]">{description}</span>
                    </span>
                    {isSelected && <Check className="size-4 shrink-0 text-[#ff5e1a]" />}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
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
      <button
        type="button"
        className="hidden items-center gap-1.5 rounded-lg border border-[#ececf1] bg-white px-3 py-[7px] text-[13px] font-semibold transition hover:border-[#ffbd99] hover:bg-[#fffaf7] sm:flex"
      >
        <Globe className="size-4" /> Web Explore
      </button>
    </div>
  );
}

/**
 * 图2 版式：模型名就贴在 Create 按钮左边，无边框、无底色、淡灰字，
 * 不跟左下角那排带描边的控件抢视线。弹出列表右对齐。
 */
function LlmSwitcher({
  open,
  onOpenChange,
  selectedLlm,
  onSelectedLlmChange,
  menuPlacement = "up",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLlm: string;
  onSelectedLlmChange: (llm: string) => void;
  menuPlacement?: "up" | "down";
}) {
  const vendor = LLM_OPTIONS.find(({ name }) => name === selectedLlm)?.vendor ?? "Google";
  return (
    <div data-composer-menu className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
        className="flex items-center gap-1.5 rounded-lg px-2 py-[7px] text-[13px] text-[#8d8e9d] transition hover:bg-[#f7f7f8] hover:text-[#1a1a2e]"
      >
        <img src={VENDOR_ICONS[vendor]} alt="" className="size-4 shrink-0 object-contain" />
        {selectedLlm}
        <ChevronDown className={`size-3.5 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className={`absolute right-0 z-[60] ${menuPlacement === "down" ? "top-[calc(100%+12px)]" : "bottom-[calc(100%+12px)]"}`}>
          <LlmPicker selectedLlm={selectedLlm} onSelect={(llm) => { onSelectedLlmChange(llm); onOpenChange(false); }} />
        </div>
      )}
    </div>
  );
}

function CreditIcon({ className = "size-3.5" }: { className?: string }) {
  const gradientId = useId();
  return (
    <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <path
        d="M7 0C7.92884 0 8.39331 0.000427014 8.7832 0.0517578C11.4755 0.406254 13.5937 2.52448 13.9482 5.2168C13.9996 5.60669 14 6.07116 14 7C14 7.92884 13.9996 8.39331 13.9482 8.7832C13.5937 11.4755 11.4755 13.5937 8.7832 13.9482C8.39331 13.9996 7.92884 14 7 14C6.07116 14 5.60669 13.9996 5.2168 13.9482C2.52448 13.5937 0.406254 11.4755 0.0517578 8.7832C0.000427014 8.39331 0 7.92884 0 7C0 6.07116 0.000427014 5.60669 0.0517578 5.2168C0.406254 2.52448 2.52448 0.406254 5.2168 0.0517578C5.60669 0.000427014 6.07116 0 7 0ZM8.08008 3.5957C8.00244 3.57102 7.91868 3.57077 7.84082 3.59473C7.76297 3.61868 7.69388 3.66642 7.64355 3.73047L6.375 5.36035C6.33245 5.41476 6.27816 5.4595 6.2168 5.49121C6.15545 5.52285 6.08751 5.54074 6.01855 5.54395L3.95703 5.6416C3.8758 5.6457 3.79786 5.67503 3.7334 5.72461C3.66895 5.77429 3.62041 5.8424 3.5957 5.91992C3.57102 5.99756 3.57077 6.08132 3.59473 6.15918C3.61868 6.23703 3.66643 6.30612 3.73047 6.35645L5.36035 7.625C5.47022 7.711 5.53695 7.84154 5.54395 7.98145L5.6416 10.043C5.6457 10.1242 5.67502 10.2021 5.72461 10.2666C5.77429 10.331 5.8424 10.3796 5.91992 10.4043C5.99756 10.429 6.08132 10.4292 6.15918 10.4053C6.23703 10.3813 6.30612 10.3336 6.35645 10.2695L7.625 8.63965C7.66755 8.58524 7.72184 8.5405 7.7832 8.50879C7.84455 8.47715 7.91249 8.45926 7.98145 8.45605L10.043 8.3584C10.1242 8.3543 10.2021 8.32497 10.2666 8.27539C10.331 8.22572 10.3796 8.1576 10.4043 8.08008C10.429 8.00244 10.4292 7.91868 10.4053 7.84082C10.3813 7.76297 10.3336 7.69388 10.2695 7.64355L8.63965 6.375C8.58524 6.33245 8.54051 6.27816 8.50879 6.2168C8.47715 6.15545 8.45926 6.08751 8.45605 6.01855L8.3584 3.95703C8.3543 3.87581 8.32497 3.79786 8.27539 3.7334C8.22572 3.66895 8.1576 3.62041 8.08008 3.5957Z"
        fill={`url(#${gradientId})`}
      />
      <defs>
        <linearGradient id={gradientId} x1="13.5" y1="13.5" x2="1" y2="-0.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFA73C" />
          <stop offset="1" stopColor="#FF5255" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function CreditEstimateBadge({ cost, creditsBalance }: { cost: number; creditsBalance: number }) {
  const [open, setOpen] = useState(false);
  const unitCost = Math.round(cost / ESTIMATED_OUTPUT_COUNT_PLACEHOLDER);

  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        className="flex items-center gap-1.5 rounded-lg border border-[#ececf1] bg-white px-3 py-[7px] text-[13px] font-semibold text-[#6a6b7b] transition hover:border-[#ffbd99] hover:bg-[#fffaf7]"
      >
        <CreditIcon />
        {cost.toLocaleString("en-US")}
      </button>
      {open && (
        <div className="absolute bottom-full right-0 z-[70] pb-[10px]">
          <div className="flex items-center gap-2 whitespace-nowrap rounded-2xl bg-white px-5 py-4 shadow-[0_20px_40px_rgba(26,26,46,0.16)]">
            <span className="flex items-center gap-1.5 text-[15px] font-bold text-[#1a1a2e]">
              <CreditIcon />
              {ESTIMATED_OUTPUT_COUNT_PLACEHOLDER} × {unitCost.toLocaleString("en-US")} = {cost.toLocaleString("en-US")}
            </span>
            <span className="text-[#d8d8de]">|</span>
            <span className="text-[15px] text-[#8d8e9d]">Credits left: {creditsBalance.toLocaleString("en-US")}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AgentLlmPickerPage() {
  const [draft, setDraft] = useState("");
  const [openMenu, setOpenMenu] = useState<ComposerMenu>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentKind>("marketing");
  const [autoEnabled, setAutoEnabled] = useState(true);
  const [modelMode, setModelMode] = useState<ModelMode>("image");
  const [selectedModel, setSelectedModel] = useState("Seedream 5.0 Pro");
  const [resolution, setResolution] = useState("Low");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [selectedLlm, setSelectedLlm] = useState(DEFAULT_LLM);

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


  return (
    <main className="min-h-screen bg-[linear-gradient(160deg,#ffe7d2_0%,#ffffff_52%,#ffdedf_100%)] pb-24">
      <div className="mx-auto max-w-[1100px] px-6">
        <h1 className={`${bricolageExtraBold.className} pt-16 text-center text-[clamp(30px,3.6vw,48px)] leading-[1.1] tracking-[-0.04em]`}>
          <span className={gradText}>Marketing Agent:</span> Your ideas,
          <br /> campaign-ready in seconds
        </h1>

        {/* composer —— 原有控件一字未动,只在 Auto 右边新增了 LLM 选择器 */}
        <div className="mx-auto mt-7 w-[922px] max-w-full">
          <div className="flex h-[178px] flex-col rounded-[22px] border border-[#ececf1] bg-white p-3.5 shadow-[0_4px_16px_rgba(26,26,46,0.06)] transition focus-within:border-[#ff5e1a] focus-within:ring-2 focus-within:ring-[#ff5e1a]/20">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Describe your idea, campaign with marketing agent. Use @ to reference uploaded files."
              maxLength={4000}
              className="w-full flex-1 resize-none bg-transparent px-2 pt-1 text-[15px] leading-relaxed text-[#1a1a2e] outline-none placeholder:text-[#9a9bb0]"
            />
            <p className="px-2 text-right text-[12px] text-[#b6b7be]">{draft.length} / 4000</p>
            <div className="flex items-center justify-between gap-2 px-1 pt-2">
              <ComposerControls
                openMenu={openMenu}
                onMenuChange={setOpenMenu}
                selectedAgent={selectedAgent}
                onAgentChange={(agent) => { setSelectedAgent(agent); setOpenMenu(null); }}
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
                menuPlacement="down"
              />
              <div className="flex shrink-0 items-center gap-2">
                {/* 只有 Marketing Agent 背后才有一个在思考的 Agent；Image Gen / Video Gen 是直接生成，没有 LLM 可选 */}
                {selectedAgent === "marketing" && (
                  <LlmSwitcher
                    open={openMenu === "llm"}
                    onOpenChange={(next) => setOpenMenu(next ? "llm" : null)}
                    selectedLlm={selectedLlm}
                    onSelectedLlmChange={setSelectedLlm}
                    menuPlacement="down"
                  />
                )}
                {!autoEnabled && (
                  <CreditEstimateBadge cost={ESTIMATED_CREDITS_PLACEHOLDER} creditsBalance={DEMO_CREDITS_BALANCE} />
                )}
                <button type="button" className={composerCta}>
                  <Image src={memberPromoAssets.sparkle} alt="" width={42} height={42} className="size-[18px]" />
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
