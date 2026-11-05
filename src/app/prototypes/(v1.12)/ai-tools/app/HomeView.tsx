"use client";

/* 产品首页(Marketing Agent 首页):History 栏 + 输入框 + 工具卡片。
   输入框左下角是创作模式(Marketing Agent / Image Gen / Video Gen,没有 Audio Gen),标题和卡片跟着模式换;默认 Image Gen。
   侧边栏里「通用模型」的菜单项(sidebarMenus 的 AGENT_JUMPS)跳到这里:外壳用 jump 重新挂载本页 →
   切到对应模式、预填提示词、选中第一个 [占位],输入框上方出「From: <工具>」小标(× 可去掉)。
   放大入口已挪到侧边栏 Image › Upscale Image:这里的「Upscale Image」卡片和其他卡片一样,只把 prompt 填进输入框。
   本原型不做生成:点 Create 出 toast。 */

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, CornerDownRight, X } from "lucide-react";
import localFont from "next/font/local";
import { LlmSwitcher } from "@/app/prototypes/(v1.12)/hybrid-reel/agent/chat/llm";
import { HistoryRail } from "@/app/prototypes/(v1.12)/hybrid-reel/agent/chat/shell";
import { quickLinks } from "@/app/prototypes/(v1.12)/hybrid-reel/agent/page";
import type { Notify } from "./components/TopToast";
import { ToolsTopBar } from "./components/ToolsTopBar";
import { firstPlaceholder, type AgentJump, type AgentMode } from "./sidebarMenus";

/* 与 Marketing Agent 首页同一套标题字与渐变字、Create 按钮(design.md tokens) */
const bricolageExtraBold = localFont({ src: "../../../../fonts/BricolageGrotesque-ExtraBold.ttf", weight: "800", display: "swap" });
const gradText = "bg-gradient-to-r from-[#ffc078] to-[#ff5e1a] bg-clip-text text-transparent";
const composerCta =
  "inline-flex h-10 shrink-0 items-center gap-2 rounded-[14px] bg-gradient-to-b from-[#ff5255] to-[#ffa73c] px-5 text-[15px] font-bold text-white shadow-[0_3px_0_#b65a42] transition hover:-translate-y-0.5 hover:brightness-105 active:translate-y-px active:shadow-none disabled:translate-y-0 disabled:opacity-40 disabled:hover:brightness-100";

export const IMAGE_GEN_NOT_BUILT = "Image Gen isn't part of this prototype. Try Image › Upscale Image in the sidebar.";

const ICON_ROOT = "/prototypes/marketing-agent/composer-icons";
/** 三种创作模式:标题(渐变部分 + 两行标语,Monica 定稿原文)、图标、模型标、下方工具卡片的类别、Create 的 toast */
export const AGENT_MODES: Record<AgentMode, { label: string; hero: [string, string]; icon: string; model?: string; cards?: "Image" | "Video"; notBuilt: string }> = {
  marketing: {
    label: "Marketing Agent",
    hero: ["Your ideas,", "campaign-ready in seconds"],
    icon: `${ICON_ROOT}/marketing-agent.svg`,
    notBuilt: "Marketing Agent chat isn't part of this prototype.",
  },
  image: {
    label: "Image Gen",
    hero: ["Ad-ready product shots,", "no photoshoot needed"],
    icon: `${ICON_ROOT}/image.svg`,
    model: "GPT-image-2",
    cards: "Image",
    notBuilt: IMAGE_GEN_NOT_BUILT,
  },
  video: {
    label: "Video Gen",
    hero: ["Ad-ready video clips,", "with sound, from one prompt"],
    icon: `${ICON_ROOT}/video.svg`,
    model: "Seedance 2.5",
    cards: "Video",
    notBuilt: "Video Gen isn't part of this prototype.",
  },
};
const MODE_ORDER: AgentMode[] = ["marketing", "image", "video"];
const PLACEHOLDER: Record<AgentMode, string> = {
  marketing: "Describe your product or campaign idea.",
  image: "Describe the image you want, or pick a tool below.",
  video: "Describe the video you want, or pick a tool below.",
};
/* 选中模式的图标染成品牌橙(与 hybrid-reel-agent CreationTypePicker 同一个滤镜) */
const BRAND_FILTER = "invert(47%) sepia(95%) saturate(1894%) hue-rotate(345deg) brightness(103%) contrast(101%)";

/** 创作模式选择:按钮样式照 Marketing Agent composer 的类型按钮(白底细边、品牌橙字),弹层是简单列表 */
function ModePicker({ value, onChange }: { value: AgentMode; onChange: (m: AgentMode) => void }) {
  const [open, setOpen] = useState(false);
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
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Creation type: ${AGENT_MODES[value].label}`}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#ececf1] bg-white px-3 py-[7px] text-[13px] font-semibold text-[#ff5e1a] transition hover:border-[#ffbd99] hover:bg-[#fffaf7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={AGENT_MODES[value].icon} alt="" className="size-4" style={{ filter: BRAND_FILTER }} />
        {AGENT_MODES[value].label}
        <ChevronDown className={`size-4 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          role="listbox"
          aria-label="Creation type"
          className="absolute left-0 top-[calc(100%+8px)] z-[60] w-[220px] rounded-[14px] border border-white/80 bg-white/95 p-1.5 shadow-[0_10px_28px_rgba(26,26,46,0.14)] backdrop-blur-xl"
        >
          <p className="px-2.5 pb-1 pt-1 text-[12px] font-medium text-[#a0a1aa]">Creation type</p>
          {MODE_ORDER.map((m) => {
            const sel = m === value;
            return (
              <button
                key={m}
                type="button"
                role="option"
                aria-selected={sel}
                onClick={() => {
                  onChange(m);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-[10px] px-2.5 py-2 text-left text-[13px] font-medium text-[#15182b] transition hover:bg-[#f1f1f2] focus-visible:bg-[#f1f1f2] focus-visible:outline-none"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={AGENT_MODES[m].icon} alt="" className="size-[18px]" style={sel ? { filter: BRAND_FILTER } : undefined} />
                <span className="flex-1">{AGENT_MODES[m].label}</span>
                {sel && <Check className="size-3.5 text-[#15182b]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function HomeView({
  credits,
  notify,
  onMenu,
  onInvite,
  jump,
}: {
  credits: number;
  notify: Notify;
  onMenu?: () => void;
  onInvite?: () => void;
  /** 从侧边栏菜单跳过来:模式 + 预填提示词 + 来源工具。外壳每次跳都换 key 重新挂载,所以这里只在初始化时读 */
  jump?: AgentJump | null;
}) {
  const [mode, setMode] = useState<AgentMode>(jump?.mode ?? "image");
  const [prompt, setPrompt] = useState(jump?.prompt ?? "");
  const [from, setFrom] = useState<string | null>(jump?.from ?? null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const cfg = AGENT_MODES[mode];

  /* 跳过来时:聚焦输入框并选中第一个 [占位],直接打字就替换掉 */
  useEffect(() => {
    if (!jump) return;
    const el = inputRef.current;
    if (!el) return;
    const range = firstPlaceholder(jump.prompt) ?? [jump.prompt.length, jump.prompt.length];
    el.focus({ preventScroll: true });
    el.setSelectionRange(range[0], range[1]);
    // 只在挂载时跑一次(每次跳转外壳都会换 key 重新挂载)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    /* 整页在白色内容面板里:顶栏叠在面板顶部,滚动区 pt-14 让开、滚动条隐藏(照真实产品) */
    <div className="relative flex h-full min-w-0 flex-1">
      <ToolsTopBar credits={credits} onMenu={onMenu} onInvite={onInvite} />
      <HistoryRail />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="relative isolate min-h-0 flex-1 overflow-y-auto px-4 pt-14 text-[#1a1a2e] sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* 品牌渐变 + 点阵(globals.css .marketing-agent-brand-field) */}
          <div className="marketing-agent-brand-field" aria-hidden="true" />
          <div className="relative z-10 pb-10">
            <h1 className={`${bricolageExtraBold.className} mt-[10vh] text-center text-[clamp(30px,3.6vw,48px)] leading-[1.1] tracking-[-0.04em]`}>
              <span className={gradText}>{cfg.label}:</span> {cfg.hero[0]}
              <br /> {cfg.hero[1]}
            </h1>
            <div className="mx-auto mt-7 w-[922px] max-w-full">
              <div className="flex min-h-[150px] flex-col rounded-[22px] border border-[#ececf1] bg-white p-3.5 shadow-[0_4px_16px_rgba(26,26,46,0.06)] transition focus-within:border-[#ff5e1a] focus-within:ring-2 focus-within:ring-[#ff5e1a]/20">
                {from && (
                  <div className="mb-1.5 px-1">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#fff3ec] py-1 pl-2.5 pr-1 text-[12px] font-semibold text-[#c2410c]">
                      <CornerDownRight className="size-3.5" aria-hidden="true" />
                      From: {from}
                      <button
                        type="button"
                        onClick={() => setFrom(null)}
                        aria-label={`Remove "From: ${from}"`}
                        className="grid size-5 place-items-center rounded-full text-[#c2410c]/70 transition hover:bg-[#ffe2d2] hover:text-[#c2410c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  </div>
                )}
                <textarea
                  ref={inputRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  aria-label="Prompt"
                  placeholder={PLACEHOLDER[mode]}
                  className="w-full flex-1 resize-none bg-transparent px-2 pt-1 text-[15px] leading-relaxed text-[#1a1a2e] outline-none placeholder:text-[#9a9bb0]"
                />
                <div className="flex flex-wrap items-center justify-between gap-2 px-1 pt-2">
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <ModePicker value={mode} onChange={setMode} />
                    {cfg.model && (
                      <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#ececf1] bg-white px-3 py-[7px] text-[13px] font-semibold text-[#1a1a2e]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={cfg.icon} alt="" className="size-4" />
                        {cfg.model}
                      </span>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <LlmSwitcher placement="down" />
                    <button type="button" disabled={!prompt.trim()} onClick={() => notify(cfg.notBuilt)} className={composerCta}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/prototypes/homepage/member-sparkle.svg" alt="" className="size-[18px]" />
                      Create
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {cfg.cards && (
            <section className="mx-auto mt-10 w-full max-w-[1400px]" aria-label={`${cfg.cards} tools`}>
              <div className="grid grid-cols-2 items-stretch gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {quickLinks
                  .filter((q) => q.category === cfg.cards)
                  .map((q) => (
                    <button
                      key={q.name}
                      type="button"
                      onClick={() => setPrompt(q.prompt)}
                      className="group relative flex min-w-0 flex-col overflow-hidden rounded-[18px] border border-[#efe7e2] bg-white text-left shadow-[0_10px_30px_rgba(83,73,100,0.08)] transition hover:-translate-y-0.5 hover:border-[#ff9a72] hover:shadow-[0_14px_34px_rgba(255,94,26,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fff6f0]"
                    >
                      <div className="relative overflow-hidden bg-[#f2eef1]">
                        {q.thumb && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={q.thumb} alt="" className="block h-auto w-full transition duration-500 group-hover:scale-105" />
                        )}
                      </div>
                      <div className="p-3.5">
                        <h3 className="truncate text-[14px] font-bold leading-tight tracking-[-0.02em] text-[#17151b]">{q.name}</h3>
                        <p className="mt-1 line-clamp-2 text-[12px] leading-[1.4] text-[#726d78]">{q.description}</p>
                      </div>
                    </button>
                  ))}
              </div>
            </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
