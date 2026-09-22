"use client";

/* 图1 的外壳:左侧 History 栏 + 顶栏 + 底部 composer。
   版式对齐真实产品 uat-app.buzzvideo.ai/super-agent/<id>,不是画廊里那套 landing。 */

import Link from "next/link";
import {
  PanelLeft,
  Plus,
  Search,
  Gift,
  CircleHelp,
  ChevronsUpDown,
  Sparkles,
  SlidersHorizontal,
  Globe,
  ArrowUp,
} from "lucide-react";

export const APPLE_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif';

const PINNED = ["Rhode唇釉推广内容制作"];

const RECENTS = [
  "IG新品精華液推廣影片",
  "Miro 是一个美妆品牌,帮我生成…",
  "Miro美妆品牌Logo设计",
  "生成一个产品logo,miro",
  "生成Miro产品图",
  "Spotify Ad Video Creator",
  "Create 9:16 Video Ad",
  "HSBC產品頁轉9:16影片廣告",
  "精華液清新高級風短片",
  "凱詩美容AquaPeel宣傳片",
  "华夫饼喷雾广告视频制作",
  "New Session",
];

export function HistoryRail({ activeTitle }: { activeTitle: string }) {
  return (
    <aside className="hidden w-[232px] shrink-0 flex-col border-r border-[#ececf1] bg-white lg:flex">
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <span className="text-[15px] font-bold text-[#1a1a2e]">History</span>
        <PanelLeft className="size-4 text-[#9a9bb0]" />
      </div>

      <div className="px-3">
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-xl border border-[#ececf1] bg-white px-3 py-2.5 text-[13.5px] font-semibold text-[#1a1a2e] transition hover:border-[#ffbd99] hover:bg-[#fff7f1]"
        >
          <Plus className="size-4" /> New Chat
        </button>
        <div className="mt-2 flex items-center gap-2 rounded-xl bg-[#f6f5f8] px-3 py-2">
          <Search className="size-3.5 shrink-0 text-[#9a9bb0]" />
          <input
            placeholder="Search chats..."
            className="w-full bg-transparent text-[13px] text-[#1a1a2e] outline-none placeholder:text-[#9a9bb0]"
          />
        </div>
      </div>

      <nav className="mt-3 min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        <p className="px-2 pb-1 pt-2 text-[11.5px] font-semibold text-[#9a9bb0]">Pinned</p>
        {[activeTitle, ...PINNED].slice(0, 2).map((title, i) => (
          <span
            key={title}
            className={`block truncate rounded-lg px-2 py-[7px] text-[13px] ${
              i === 0
                ? "bg-[#fff3ec] font-semibold text-[#ff5e1a]"
                : "text-[#6a6b7b] hover:bg-[#f6f5f8]"
            }`}
          >
            {title}
          </span>
        ))}

        <p className="px-2 pb-1 pt-3 text-[11.5px] font-semibold text-[#9a9bb0]">Recents</p>
        {RECENTS.map((title) => (
          <span
            key={title}
            className="block truncate rounded-lg px-2 py-[7px] text-[13px] text-[#6a6b7b] transition hover:bg-[#f6f5f8]"
          >
            {title}
          </span>
        ))}
      </nav>
    </aside>
  );
}

export function TopBar() {
  return (
    <header className="flex items-center gap-2 px-6 py-3">
      <span className="ml-auto flex items-center gap-1.5 rounded-full border border-[#ffd2b8] bg-[#fff7f1] py-1 pl-2.5 pr-1.5 text-[13px] font-bold text-[#1a1a2e]">
        <span className="size-3.5 rounded-full bg-gradient-to-r from-[#FFA73C] to-[#FF5255]" />
        35,600
        <span className="relative ml-1 rounded-full bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-2.5 py-[3px] text-[12px] font-bold text-white">
          Upgrade
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-[#ff2d55] px-1.5 text-[9px] font-bold text-white">
            -30%
          </span>
        </span>
      </span>
      <Gift className="size-[18px] text-[#ff5e1a]" />
      <CircleHelp className="size-[18px] text-[#9a9bb0]" />
      <span className="ml-1 flex items-center gap-2 rounded-full border border-[#ececf1] bg-white py-1 pl-1 pr-2.5">
        <span className="grid size-6 place-items-center rounded-full bg-[#1a1a2e] text-[11px] font-bold text-white">
          S
        </span>
        <span className="text-[13px] font-semibold text-[#1a1a2e]">SZ_Monica Z…</span>
        <span className="rounded-md bg-[#f1f0f4] px-1.5 py-[1px] text-[11px] font-semibold text-[#6a6b7b]">
          Personal
        </span>
        <ChevronsUpDown className="size-3.5 text-[#9a9bb0]" />
      </span>
    </header>
  );
}

export function IconRail() {
  const items = [
    { label: "Home", href: "/prototypes/hybrid-reel" },
    { label: "Agent", href: "/prototypes/hybrid-reel/agent", active: true },
    { label: "Canvas", href: "/prototypes/hybrid-reel/canvas" },
  ];
  return (
    <aside className="hidden w-[60px] shrink-0 flex-col items-center gap-1 border-r border-[#ececf1] bg-white py-4 sm:flex">
      <Link href="/" className="mb-3 grid size-8 place-items-center rounded-full bg-[#1a1a2e] text-[12px] font-bold text-white">
        N
      </Link>
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className={`flex w-[52px] flex-col items-center gap-1 rounded-xl py-2 text-[10.5px] font-semibold transition ${
            item.active ? "bg-[#fff3ec] text-[#ff5e1a]" : "text-[#6a6b7b] hover:bg-[#f6f5f8]"
          }`}
        >
          <Sparkles className="size-[18px]" />
          {item.label}
        </Link>
      ))}
    </aside>
  );
}

/** 底部输入区。references 是已上传素材的缩略图条(图1 里 composer 上方那一排)。 */
export function Composer({
  value,
  onChange,
  onSend,
  references,
  disabled,
  placeholder = "Describe your idea, campaign with marketing agent. Use @ to reference uploaded files.",
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  references: { key: string; url?: string; label: string }[];
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="px-6 pb-5">
      {references.length > 0 && (
        <div className="mx-auto mb-2 flex max-w-[880px] items-center gap-2 overflow-x-auto px-1">
          <span className="shrink-0 text-[12px] font-semibold text-[#9a9bb0]">References</span>
          {references.map((r) => (
            <span
              key={r.key}
              title={r.label}
              className="size-9 shrink-0 overflow-hidden rounded-lg border border-[#ececf1] bg-[#f4f4f7]"
            >
              {r.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.url} alt="" className="size-full object-cover" />
              ) : (
                <span className="grid size-full place-items-center text-[9px] font-bold text-[#9a9bb0]">
                  {r.label.slice(0, 2).toUpperCase()}
                </span>
              )}
            </span>
          ))}
        </div>
      )}

      <div className="mx-auto max-w-[880px] rounded-[20px] border border-[#ececf1] bg-white p-3 shadow-[0_4px_18px_rgba(26,26,46,0.06)]">
        <textarea
          rows={2}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder={placeholder}
          className="w-full resize-none bg-transparent px-1 pb-2 pt-1 text-[14.5px] leading-relaxed text-[#1a1a2e] outline-none placeholder:text-[#9a9bb0] disabled:opacity-50"
        />
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-lg border border-[#ececf1] bg-white text-[#6a6b7b]">
            <Plus className="size-[18px]" />
          </span>
          <span className="flex items-center gap-1.5 rounded-lg border border-[#ececf1] bg-white px-3 py-[7px] text-[13px] font-semibold text-[#ff5e1a]">
            <Sparkles className="size-4" /> Marketing Agent
          </span>
          <span className="hidden items-center gap-1.5 rounded-lg border border-[#ececf1] bg-white px-3 py-[7px] text-[13px] font-semibold text-[#6a6b7b] sm:flex">
            <SlidersHorizontal className="size-4" /> Auto
          </span>
          <span className="hidden items-center gap-1.5 rounded-lg border border-[#ececf1] bg-white px-3 py-[7px] text-[13px] font-semibold text-[#ff5e1a] sm:flex">
            <Globe className="size-4" /> Web Explore
          </span>
          <span className="ml-auto text-[12px] text-[#9a9bb0]">{value.length} / 4000</span>
          <button
            type="button"
            onClick={onSend}
            disabled={disabled}
            aria-label="Send"
            className="grid size-9 place-items-center rounded-full bg-gradient-to-r from-[#FFA73C] to-[#FF5255] text-white transition hover:brightness-105 disabled:opacity-40"
          >
            <ArrowUp className="size-4" strokeWidth={2.6} />
          </button>
        </div>
      </div>
    </div>
  );
}
