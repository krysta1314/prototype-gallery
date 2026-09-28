"use client";

/* 驱动 Agent 思考的大语言模型选择器,照 agent-llm-picker 原型:模型名贴在 Create / 发送按钮左边,
   无边框淡灰字,点开是按厂商分组的列表。
   目前只是 UI:真实调用仍走 BytePlus ModelArk 上的 Seed 模型(见 src/lib/ark.ts),这里选什么都不影响请求。
   选中的模型存在 localStorage,落地页主输入框、悬浮输入框、对话页三处同步。 */

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Check, ChevronDown } from "lucide-react";

type LlmVendor = "Google" | "OpenAI" | "Anthropic" | "xAI" | "Qwen";
type LlmOption = { name: string; description: string; vendor: LlmVendor };

const LLM_VENDORS: readonly LlmVendor[] = ["Google", "OpenAI", "Anthropic", "xAI", "Qwen"];

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
const LLM_KEY = "hybrid-reel-llm";
const LLM_EVENT = "hybrid-reel-llm-change";

function readLlm() {
  try {
    const v = window.localStorage.getItem(LLM_KEY);
    return v && LLM_OPTIONS.some((o) => o.name === v) ? v : DEFAULT_LLM;
  } catch {
    return DEFAULT_LLM;
  }
}
function subscribe(cb: () => void) {
  window.addEventListener(LLM_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(LLM_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

/** 当前选中的 LLM(三处输入框共用) */
export function useLlm(): [string, (name: string) => void] {
  const llm = useSyncExternalStore(subscribe, readLlm, () => DEFAULT_LLM);
  const set = (name: string) => {
    try {
      window.localStorage.setItem(LLM_KEY, name);
    } catch {}
    window.dispatchEvent(new Event(LLM_EVENT));
  };
  return [llm, set];
}

export function LlmSwitcher({ placement = "up" }: { placement?: "up" | "down" }) {
  const [llm, setLlm] = useLlm();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
  const vendor = LLM_OPTIONS.find((o) => o.name === llm)?.vendor ?? "Google";

  return (
    <div ref={ref} data-composer-menu className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-[7px] text-[13px] text-[#8d8e9d] transition hover:bg-[#f7f7f8] hover:text-[#1a1a2e]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={VENDOR_ICONS[vendor]} alt="" className="size-4 shrink-0 object-contain" />
        <span className="hidden sm:inline">{llm}</span>
        <ChevronDown className={`size-3.5 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          role="listbox"
          aria-label="Agent model"
          className={`absolute right-0 z-[60] w-[min(320px,calc(100vw-48px))] rounded-[16px] border border-white/80 bg-white/95 p-1.5 shadow-[0_10px_28px_rgba(26,26,46,0.14)] backdrop-blur-xl ${
            placement === "down" ? "top-[calc(100%+12px)]" : "bottom-[calc(100%+12px)]"
          }`}
        >
          <div className="max-h-[368px] overflow-y-auto py-1 pr-0.5 [scrollbar-width:thin] [scrollbar-color:#d9dae2_transparent]">
            {LLM_VENDORS.map((v) => {
              const items = LLM_OPTIONS.filter((o) => o.vendor === v);
              return (
                <div key={v}>
                  <p className="px-3 pb-1 pt-2 text-[11px] font-medium text-[#c2c3cb]">{v}</p>
                  {items.map(({ name, description }) => {
                    const selected = name === llm;
                    return (
                      <button
                        key={name}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onClick={() => {
                          setLlm(name);
                          setOpen(false);
                        }}
                        className={`flex w-full items-center gap-2.5 rounded-[11px] px-3 py-2 text-left transition ${
                          selected ? "bg-[#f1f1f2]" : "hover:bg-[#fafafd]"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={VENDOR_ICONS[v]} alt="" className="size-[18px] shrink-0 object-contain" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14px] font-medium leading-5 text-[#15182b]">{name}</span>
                          <span className="mt-px block truncate text-[12px] leading-4 text-[#94969e]">{description}</span>
                        </span>
                        {selected && <Check className="size-4 shrink-0 text-[#ff5e1a]" />}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
