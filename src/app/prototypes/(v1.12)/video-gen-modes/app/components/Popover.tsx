"use client";

/* 底栏 pill 按钮 + 白色圆角浮层:点外面 / Esc 关闭。placement 决定往上还是往下开
   (画布里输入框贴底，往上开;首页往下开)。所有下拉都用它，不用原生 <select>。 */

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { ChevronDown } from "lucide-react";

export type Placement = "up" | "down";

/** 浮层打开后量一下位置：超出视口左右边缘就往回挪(手机宽度下 Model Settings 等 360px 的浮层会出屏)。直接改 transform,不走 state */
export function useKeepInView(ref: RefObject<HTMLElement | null>, open: boolean, margin = 12) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!open || !el) return;
    el.style.translate = "";
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const dx = r.right > vw - margin ? Math.max(margin - r.left, vw - margin - r.right) : r.left < margin ? margin - r.left : 0;
    if (dx) el.style.translate = `${dx}px 0`;
  }, [ref, open, margin]);
}

export const pillBase =
  "inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[10px] border border-[#ececf1] bg-white px-3 text-[13px] font-semibold text-[#1a1a2e] transition hover:border-[#d4d3df] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/30 disabled:cursor-not-allowed disabled:opacity-50";

export function Pill({
  label,
  icon,
  children,
  placement,
  width = 280,
  align = "left",
  disabled,
  title,
  ariaLabel,
  scroll = true,
}: {
  label: ReactNode;
  icon?: ReactNode;
  children: (close: () => void) => ReactNode;
  placement: Placement;
  width?: number;
  align?: "left" | "right";
  disabled?: boolean;
  title?: string;
  ariaLabel: string;
  /** false = 浮层按内容自然撑开，不出现竖向滚动条(Model Settings 用) */
  scroll?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  useKeepInView(pop, open);
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

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        title={title}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`${pillBase} ${open ? "border-[#ff5e1a] ring-2 ring-[#ff5e1a]/15" : ""}`}
      >
        {icon}
        {label}
        <ChevronDown className={`size-3.5 text-[#9a9bb0] transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          ref={pop}
          role="menu"
          style={{ width: `min(${width}px, calc(100vw - 24px))` }}
          className={`absolute z-40 ${scroll ? "max-h-[min(440px,70vh)] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" : ""} rounded-2xl border border-[#ececf1] bg-white p-1.5 shadow-[0_16px_40px_rgba(26,26,46,0.16)] ${
            placement === "up" ? "bottom-[calc(100%+8px)]" : "top-[calc(100%+8px)]"
          } ${align === "right" ? "right-0" : "left-0"}`}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function MenuItem({
  selected,
  disabled,
  onClick,
  icon,
  label,
  hint,
}: {
  selected?: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon?: ReactNode;
  label: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={!!selected}
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2 text-left transition disabled:cursor-not-allowed disabled:opacity-45 ${
        selected ? "bg-[#f4f3f6]" : "hover:bg-[#faf8f6]"
      }`}
    >
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className={`block text-[13px] text-[#1a1a2e] ${selected ? "font-semibold" : "font-medium"}`}>{label}</span>
        {hint && <span className="mt-0.5 block text-[11.5px] leading-snug text-[#9a9bb0]">{hint}</span>}
      </span>
      {selected && (
        <svg viewBox="0 0 16 16" className="mt-1 size-3.5 shrink-0 text-[#ff5e1a]" aria-hidden>
          <path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

export const menuHeading = "px-2.5 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a0a1aa]";
