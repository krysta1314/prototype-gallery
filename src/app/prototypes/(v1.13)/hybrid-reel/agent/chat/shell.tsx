"use client";

/* 图1 的外壳:左侧 History 栏 + 顶栏 + 底部 composer。
   版式对齐真实产品 uat-app.buzzvideo.ai/super-agent/<id>,不是画廊里那套 landing。 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { listSessions, SESSIONS_EVENT, type StoredSession } from "./handoff";
import {
  ArrowRightToLine,
  Clapperboard,
  PanelLeft,
  Plus,
  Search,
  Gift,
  CircleHelp,
  ChevronsUpDown,
  Sparkles,
  SlidersHorizontal,
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

/** History 栏的内容部分。落地页和对话页共用,这样刚跑过的会话两边都看得到。
    真实会话排在前面、可点击回到那次对话;后面是静态的示例记录。 */
export function HistoryList({ activeId }: { activeId?: string | null }) {
  const router = useRouter();
  /* 存在 localStorage,服务端渲染时读不到 → 挂载后再读,并跟着保存事件刷新 */
  const [live, setLive] = useState<StoredSession[]>([]);
  useEffect(() => {
    const load = () => setLive(listSessions());
    load();
    window.addEventListener(SESSIONS_EVENT, load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener(SESSIONS_EVENT, load);
      window.removeEventListener("storage", load);
    };
  }, []);

  return (
    <>
      <div className="px-3">
        <button
          type="button"
          onClick={() => router.push("/prototypes/hybrid-reel/agent")}
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
        {PINNED.map((title) => (
          <span
            key={title}
            className="block truncate rounded-lg px-2 py-[7px] text-[13px] text-[#6a6b7b] hover:bg-[#f6f5f8]"
          >
            {title}
          </span>
        ))}

        <p className="px-2 pb-1 pt-3 text-[11.5px] font-semibold text-[#9a9bb0]">Recents</p>
        {live.map((session) => {
          const active = session.id === activeId;
          return (
            <button
              key={session.id}
              type="button"
              title={session.title}
              onClick={() => router.push(`/prototypes/hybrid-reel/agent/chat?session=${session.id}`)}
              className={`block w-full truncate rounded-lg px-2 py-[7px] text-left text-[13px] transition ${
                active
                  ? "bg-[#fff3ec] font-semibold text-[#ff5e1a]"
                  : "text-[#1a1a2e] hover:bg-[#f6f5f8]"
              }`}
            >
              {session.title}
            </button>
          );
        })}
        {RECENTS.map((title) => (
          <span
            key={title}
            className="block truncate rounded-lg px-2 py-[7px] text-[13px] text-[#6a6b7b] transition hover:bg-[#f6f5f8]"
          >
            {title}
          </span>
        ))}
      </nav>
    </>
  );
}

export function HistoryRail({ activeId }: { activeId?: string | null }) {
  return (
    <aside className="hidden w-[232px] shrink-0 flex-col border-r border-[#ececf1] bg-white lg:flex">
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <span className="text-[15px] font-bold text-[#1a1a2e]">History</span>
        <PanelLeft className="size-4 text-[#9a9bb0]" />
      </div>
      <HistoryList activeId={activeId} />
    </aside>
  );
}

export function TopBar() {
  return (
    <header className="flex items-center gap-2 px-6 py-3">
      <AccountCluster className="ml-auto" />
    </header>
  );
}

/** 顶栏右侧:积分余额 + Upgrade + 礼物 + 帮助 + 账号。画布顶栏也用它,余额按画布里的实际花费扣减 */
export function AccountCluster({ credits = 35600, className = "" }: { credits?: number; className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="flex items-center gap-1.5 rounded-full border border-[#ffd2b8] bg-[#fff7f1] py-1 pl-2.5 pr-1.5 text-[13px] font-bold text-[#1a1a2e]">
        <span className="size-3.5 rounded-full bg-gradient-to-r from-[#FFA73C] to-[#FF5255]" />
        {credits.toLocaleString("en-US")}
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
    </div>
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
/** 「按 Tab 采纳建议」引导看过没有;落地页演示栏可以清掉它重看 */
export const TAB_TIP_KEY = "hybrid-reel:tip-tab-suggestion:v1";

/* 键盘上的 Tab 键:说明文字里用它代替「Tab」字样 */
function TabKey() {
  return (
    <kbd
      aria-label="Tab"
      className="mx-0.5 inline-flex h-[22px] translate-y-[-1px] items-center gap-1 rounded-[6px] border border-white/30 bg-white/10 px-1.5 align-middle font-sans text-[11px] font-semibold leading-none text-white shadow-[0_2px_0_rgba(255,255,255,0.22)]"
    >
      <ArrowRightToLine className="size-3" strokeWidth={2.4} />
      tab
    </kbd>
  );
}

/* 操作引导小窗:宽屏时停在输入框左侧、底边和输入框对齐,箭头朝右指着建议;窄屏放不下就浮在上方、箭头朝下。
   点 Use suggestion = 直接把建议填进去(和按 Tab 一样),然后不再出现 */
export const COACH_W = 236;

function TabCoachmark({ onApply, side }: { onApply: () => void; side: "left" | "top" }) {
  const left = side === "left";
  /* 左侧时小窗底边贴着输入框底边,箭头按灰字建议那一行的实际位置对齐 */
  const ref = useRef<HTMLDivElement>(null);
  const [arrowTop, setArrowTop] = useState<number | null>(null);
  useLayoutEffect(() => {
    if (!left) return;
    const place = () => {
      const tip = ref.current?.getBoundingClientRect();
      const ghost = document.getElementById("composer-suggestion")?.getBoundingClientRect();
      if (!tip || !ghost) return;
      const mid = ghost.top + ghost.height / 2 - tip.top - 6;
      setArrowTop(Math.min(Math.max(mid, 14), tip.height - 26));
    };
    place();
    /* 小窗或输入框尺寸一变(换行、改文案、窗口缩放)就重新对齐 */
    const ro = new ResizeObserver(place);
    if (ref.current) ro.observe(ref.current);
    const box = ref.current?.parentElement;
    if (box) ro.observe(box);
    window.addEventListener("resize", place);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", place);
    };
  }, [left]);
  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Tip: suggested reply"
      className={`hr-coach absolute z-30 rounded-2xl bg-[#1a1a2e] p-4 text-white shadow-[0_18px_40px_rgba(26,26,46,0.28)] ${
        left ? "bottom-0 right-[calc(100%+16px)]" : "bottom-[calc(100%+14px)] left-0"
      }`}
      style={{ width: COACH_W, animationName: left ? "hr-coach-in-x" : "hr-coach-in" }}
    >
      <style>{`
        @keyframes hr-coach-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        @keyframes hr-coach-in-x { from { opacity: 0; transform: translateX(-6px); } to { opacity: 1; transform: none; } }
        .hr-coach { animation-duration: 240ms; animation-timing-function: cubic-bezier(0.2, 0.8, 0.2, 1); animation-fill-mode: both; }
        @media (prefers-reduced-motion: reduce) { .hr-coach { animation: none !important; } }
      `}</style>
      <p className="text-[14px] font-bold">Suggested reply</p>
      <p className="mt-1.5 text-[13px] leading-[1.7] text-white/75">
        Press <TabKey /> to use it. You can edit before sending.
      </p>
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={onApply}
          className="rounded-lg bg-white px-3 py-1.5 text-[12.5px] font-bold text-[#1a1a2e] transition-colors hover:bg-[#e9e9ef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a2e]"
        >
          Use suggestion
        </button>
      </div>
      {/* 箭头:窄屏朝下,宽屏朝右 */}
      <span
        aria-hidden
        className={`absolute size-3 rotate-45 rounded-[2px] bg-[#1a1a2e] ${left ? "-right-[6px]" : "-bottom-[6px] left-7"}`}
        style={left ? { top: arrowTop ?? 24 } : undefined}
      />
    </div>
  );
}

export function Composer({
  value,
  onChange,
  onSend,
  references,
  disabled,
  suggestion,
  placeholder = "Tell me what to change in this reel. Use @ to reference your footage.",
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  references: { key: string; url?: string; label: string }[];
  disabled?: boolean;
  placeholder?: string;
  /** AI 建议的下一句:输入框为空时以灰字显示,按 Tab 填入 */
  suggestion?: string | null;
}) {
  const showSuggestion = !!suggestion && !value && !disabled;

  /* 第一次出现建议时弹一次操作引导;看过(点 Use suggestion、按 Tab 或 Esc)就记下,不再打扰 */
  const [tipSeen, setTipSeen] = useState(true);
  useEffect(() => {
    try {
      setTipSeen(window.localStorage.getItem(TAB_TIP_KEY) === "1");
    } catch {
      setTipSeen(false);
    }
  }, []);
  const dismissTip = () => {
    setTipSeen(true);
    try {
      window.localStorage.setItem(TAB_TIP_KEY, "1");
    } catch {}
  };
  const showTip = showSuggestion && !tipSeen;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  /* 输入框左边留白够放小窗就放左边(箭头朝右),不够就放上方(箭头朝下) */
  const boxRef = useRef<HTMLDivElement>(null);
  const [tipSide, setTipSide] = useState<"left" | "top">("top");
  useEffect(() => {
    if (!showTip) return;
    const measure = () => {
      const box = boxRef.current;
      const column = box?.parentElement?.parentElement;
      if (!box || !column) return;
      const room = box.getBoundingClientRect().left - column.getBoundingClientRect().left;
      setTipSide(room >= COACH_W + 26 ? "left" : "top");
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [showTip]);
  const applyFromTip = () => {
    onChange(suggestion!);
    dismissTip();
    textareaRef.current?.focus();
  };

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

      <div ref={boxRef} className="relative mx-auto max-w-[880px] rounded-[20px] border border-[#ececf1] bg-white p-3 shadow-[0_4px_18px_rgba(26,26,46,0.06)]">
        {showTip && <TabCoachmark onApply={applyFromTip} side={tipSide} />}
        <div className="relative">
        <textarea
          ref={textareaRef}
          rows={2}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Tab" && !e.shiftKey && showSuggestion) {
              e.preventDefault();
              onChange(suggestion!);
              if (showTip) dismissTip();
              return;
            }
            if (e.key === "Escape" && showTip) {
              dismissTip();
              return;
            }
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder={showSuggestion ? "" : placeholder}
          aria-describedby={showSuggestion ? "composer-suggestion" : undefined}
          className="w-full resize-none bg-transparent px-1 pb-2 pt-1 text-[14.5px] leading-relaxed text-[#1a1a2e] outline-none placeholder:text-[#9a9bb0] disabled:opacity-50"
        />
        {showSuggestion && (
          <div
            id="composer-suggestion"
            className="pointer-events-none absolute left-1 top-1 flex items-center gap-2 text-[14.5px] leading-relaxed text-[#9a9bb0]"
          >
            <span>{suggestion}</span>
          </div>
        )}
        </div>
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-lg border border-[#ececf1] bg-white text-[#6a6b7b]">
            <Plus className="size-[18px]" />
          </span>
          {/* 这条对话是从 Creation type 选了 Hybrid Reel 进来的,模式跟着显示 */}
          <span className="flex items-center gap-1.5 rounded-lg border border-[#ececf1] bg-white px-3 py-[7px] text-[13px] font-semibold text-[#ff5e1a]">
            <Clapperboard className="size-4" /> Hybrid Reel
          </span>
          <span className="hidden items-center gap-1.5 rounded-lg border border-[#ececf1] bg-white px-3 py-[7px] text-[13px] font-semibold text-[#6a6b7b] sm:flex">
            <SlidersHorizontal className="size-4" /> Auto
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
