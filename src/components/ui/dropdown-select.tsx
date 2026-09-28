"use client";

/* 下拉选择:所有原型统一用这个,不要用浏览器原生 <select>。
   原生 <select> 点开后是操作系统的菜单(macOS 上是半透明深色毛玻璃 + 蓝色高亮 + 系统字体),
   和产品的白底圆角菜单完全不是一个样子,改不了样式。见 design.md「5.1 下拉选择」。

   - 触发器:白底 + 1px 浅灰描边的圆角框,左边可以带图标,右边 ChevronDown;展开时描边变品牌橙
   - 菜单:白底圆角卡片 + 柔阴影,选项悬停浅灰底,当前选中的加粗 + 右侧橙色对勾
   - 菜单挂到 body 上(fixed 定位),不会被滚动面板 / overflow:hidden 的父级裁掉;下方放不下就往上开
   - 键盘:↑ ↓ 移动,Enter 选中,Esc 关闭;点外面、滚动、改窗口大小都会收起 */

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

export type DropdownOption<T extends string> = { value: T; label: string };

export function DropdownSelect<T extends string>({
  value,
  options,
  onChange,
  label,
  icon,
  size = "md",
  disabled,
  className = "",
}: {
  value: T;
  options: readonly DropdownOption<T>[];
  onChange: (v: T) => void;
  /** 读屏用的名字(界面上的字段名通常写在外面的 label 里) */
  label: string;
  /** 选项前面的小图标(模型 logo、比例框等),触发器和菜单里都会显示 */
  icon?: (v: T) => React.ReactNode;
  /** md:40px 高、14px 字(设置面板);sm:36px 高、13px 字(弹窗、紧凑表单) */
  size?: "sm" | "md";
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<{ left: number; top: number; width: number; up: boolean } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const current = options.find((o) => o.value === value);

  /* 打开时按触发器的位置摆菜单;下方空间不够就开在上方 */
  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const need = Math.min(288, options.length * 36 + 8);
    const up = window.innerHeight - r.bottom < need + 12 && r.top > need + 12;
    setPos({ left: r.left, top: up ? r.top - 4 : r.bottom + 4, width: r.width, up });
  }, [open, options.length]);

  /* 点外面 / 滚动 / 改窗口大小:收起 */
  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e.type === "pointerdown" && (btnRef.current?.contains(e.target as Node) || listRef.current?.contains(e.target as Node))) return;
      if (e.type === "scroll" && listRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    window.addEventListener("pointerdown", close, true);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("pointerdown", close, true);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  /* 当前高亮的选项滚到可见 */
  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>(`[data-i="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const openMenu = () => {
    if (disabled) return;
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  };
  const pick = (v: T) => {
    onChange(v);
    setOpen(false);
    btnRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const o = options[active];
      if (o) pick(o.value);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  const h = size === "sm" ? "h-9 text-[13px]" : "h-10 text-[14px]";

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
        className={`flex w-full items-center gap-2 rounded-lg border bg-white px-3 text-left text-[#1a1a2e] outline-none transition disabled:cursor-not-allowed disabled:opacity-50 ${h} ${
          open
            ? "border-[#ff5e1a] ring-[3px] ring-[#ff5e1a]/15"
            : "border-[#e1e3e9] hover:border-[#c9cad4] focus-visible:border-[#ff5e1a] focus-visible:ring-[3px] focus-visible:ring-[#ff5e1a]/15"
        } ${className}`}
      >
        {icon && current && <span className="flex shrink-0 items-center">{icon(current.value)}</span>}
        <span className="min-w-0 flex-1 truncate">{current?.label ?? value}</span>
        <ChevronDown className={`size-4 shrink-0 text-[#6a6b7b] transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>
      {open &&
        pos &&
        createPortal(
          <div
            ref={listRef}
            id={id}
            role="listbox"
            aria-label={label}
            tabIndex={-1}
            onKeyDown={onKeyDown}
            className="fixed z-[400] max-h-[288px] overflow-y-auto rounded-xl bg-white p-1 text-[#1a1a2e] shadow-[0_12px_32px_rgba(26,26,46,0.16),0_0_0_1px_rgba(26,26,46,0.07)] [scrollbar-width:thin] motion-safe:animate-[dropdown-in_120ms_cubic-bezier(0.22,1,0.36,1)]"
            style={{
              left: pos.left,
              width: Math.max(pos.width, 160),
              ...(pos.up ? { bottom: window.innerHeight - pos.top } : { top: pos.top }),
            }}
          >
            {options.map((o, i) => {
              const selected = o.value === value;
              return (
                <button
                  key={o.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  data-i={i}
                  onPointerEnter={() => setActive(i)}
                  onClick={() => pick(o.value)}
                  className={`flex min-h-9 w-full items-center gap-2 rounded-lg px-2.5 text-left ${size === "sm" ? "text-[13px]" : "text-[14px]"} ${
                    i === active ? "bg-[#f3f4f6]" : ""
                  }`}
                >
                  {icon && <span className="flex shrink-0 items-center">{icon(o.value)}</span>}
                  <span className={`min-w-0 flex-1 truncate ${selected ? "font-semibold" : ""}`}>{o.label}</span>
                  {selected && <Check className="size-4 shrink-0 text-[#ff5e1a]" strokeWidth={2.5} />}
                </button>
              );
            })}
            <style>{`@keyframes dropdown-in{from{opacity:0;transform:translateY(${pos.up ? 4 : -4}px) scale(.98)}to{opacity:1;transform:none}}`}</style>
          </div>,
          document.body,
        )}
    </>
  );
}
