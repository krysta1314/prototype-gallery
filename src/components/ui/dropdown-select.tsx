"use client";

/* 下拉选择:所有原型统一用这个,不要用浏览器原生 <select>。
   原生 <select> 点开后是操作系统的菜单(macOS 上是半透明深色毛玻璃 + 蓝色高亮 + 系统字体),
   和产品的白底圆角菜单完全不是一个样子,改不了样式。见 design.md「5.1 下拉选择」和 §P「Select 下拉」。

   样式按开发给的 BuzzVideo 设计规范(design.md §P):
   - 档位:sm 32px / 12px · md 36px / 14px · lg 40px / 14px(默认);触发器和选项行都跟着档位
   - 触发器:白底 + 1px #E8E8E8 描边 + rounded-md(8px),悬停描边 #C9C9C9;
     展开 / 键盘聚焦:描边 #FF5E1A + 3px 12% 同色淡环(不带白隙);出错(invalid):描边 #EB502D,淡环也变红
   - 菜单:12px 圆角 + 1px 发丝线描边 + floating 阴影,选项之间 2px;悬停 / 方向键高亮 #F5F5F5;
     选中加粗 + 右侧 #FF5E1A 对勾(不加底色)
   - 菜单挂到 body 上(fixed 定位),不会被滚动面板 / overflow:hidden 的父级裁掉;下方放不下就往上开
   - 键盘:↑ ↓ 移动,Enter 选中,Esc 关闭;点外面、滚动、改窗口大小都会收起 */

import { Fragment, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

/** hint:选项名下面一行小灰字(比如「Recommended for TikTok」),只在菜单里显示 */
/** group:同组连续排列时，组的第一项上方出灰色小标题(如模型按公司分组) */
export type DropdownOption<T extends string> = { value: T; label: string; hint?: string; group?: string };

/* 档位 → 高度 / 字号(design.md §P 控件尺寸) */
const TRIGGER = { sm: "h-8 text-[12px]", md: "h-9 text-[14px]", lg: "h-10 text-[14px]" } as const;
const ROW = { sm: "min-h-8 text-[12px]", md: "min-h-9 text-[14px]", lg: "min-h-10 text-[14px]" } as const;
const ROW_H = { sm: 32, md: 36, lg: 40 } as const;

export function DropdownSelect<T extends string>({
  value,
  options,
  onChange,
  label,
  icon,
  size = "lg",
  disabled,
  invalid,
  className = "",
}: {
  value: T;
  options: readonly DropdownOption<T>[];
  onChange: (v: T) => void;
  /** 读屏用的名字(界面上的字段名通常写在外面的 label 里) */
  label: string;
  /** 选项前面的小图标(模型 logo、比例框等),触发器和菜单里都会显示 */
  icon?: (v: T) => React.ReactNode;
  /** 档位(design.md §P 控件尺寸):lg 40px(设置页、参数面板,默认)· md 36px(弹窗、输入框上的弹层)· sm 32px(画布节点、筛选条等紧凑面板) */
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  /** 出错:描边变 #EB502D(会带上 aria-invalid) */
  invalid?: boolean;
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
    const need = Math.min(288, options.length * (ROW_H[size] + 2) + 10);
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

  const h = TRIGGER[size];
  const ring = invalid
    ? "border-[#EB502D] focus-visible:ring-[3px] focus-visible:ring-[#EB502D]/[.12]" + (open ? " ring-[3px] ring-[#EB502D]/[.12]" : "")
    : open
      ? "border-[#FF5E1A] ring-[3px] ring-[#FF5E1A]/[.12]"
      : "border-[#E8E8E8] hover:border-[#C9C9C9] focus-visible:border-[#FF5E1A] focus-visible:ring-[3px] focus-visible:ring-[#FF5E1A]/[.12]";

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
        className={`flex w-full items-center gap-2 rounded-md border bg-white px-3 text-left font-medium text-[#250B03] outline-none transition-[border-color,box-shadow] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 ${h} ${ring} ${className}`}
      >
        {icon && current && <span className="flex shrink-0 items-center">{icon(current.value)}</span>}
        <span className="min-w-0 flex-1 truncate">{current?.label ?? value}</span>
        <ChevronDown className={`size-4 shrink-0 text-[#6F6C6C] transition-transform duration-150 motion-reduce:transition-none ${open ? "rotate-180" : ""}`} />
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
            className="fixed z-[400] flex max-h-[288px] flex-col gap-0.5 overflow-y-auto rounded-[12px] border border-[#E8E8E8] bg-white p-1 text-[#250B03] shadow-[0_4px_12px_rgb(37_11_3/.08)] [scrollbar-width:thin] motion-safe:animate-[dropdown-in_120ms_cubic-bezier(0.22,1,0.36,1)]"
            style={{
              left: pos.left,
              width: Math.max(pos.width, 160),
              ...(pos.up ? { bottom: window.innerHeight - pos.top } : { top: pos.top }),
            }}
          >
            {options.map((o, i) => {
              const selected = o.value === value;
              const heading = o.group && o.group !== options[i - 1]?.group ? o.group : null;
              return (
                <Fragment key={o.value}>
                {heading && (
                  <p className={`px-2.5 pb-1 text-[12px] font-medium text-[#9E9E9E] ${i > 0 ? "pt-2.5" : "pt-1"}`} aria-hidden>
                    {heading}
                  </p>
                )}
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  data-i={i}
                  onPointerEnter={() => setActive(i)}
                  onClick={() => pick(o.value)}
                  className={`flex w-full shrink-0 items-center gap-2 rounded-md px-2.5 text-left font-medium outline-none ${ROW[size]} ${o.hint ? "py-1.5" : ""} ${
                    i === active ? "bg-[#F5F5F5]" : ""
                  }`}
                >
                  {icon && <span className="flex shrink-0 items-center">{icon(o.value)}</span>}
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate ${selected ? "font-semibold" : ""}`}>{o.label}</span>
                    {o.hint && <span className="block truncate text-[12px] font-normal text-[#6F6C6C]">{o.hint}</span>}
                  </span>
                  {selected && <Check className="size-4 shrink-0 text-[#FF5E1A]" strokeWidth={2.5} />}
                </button>
                </Fragment>
              );
            })}
            <style>{`@keyframes dropdown-in{from{opacity:0;transform:translateY(${pos.up ? 4 : -4}px) scale(.98)}to{opacity:1;transform:none}}`}</style>
          </div>,
          document.body,
        )}
    </>
  );
}
