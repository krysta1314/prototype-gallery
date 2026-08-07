"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export type DropdownOption = { value: string; label: string; hint?: string };

/**
 * 统一的下拉选择。原生 <select> 的选项面板由系统渲染(深色、字体不受控),
 * 跟原型的视觉对不上,所以这里自己画一个。
 */
export function Dropdown({
  value,
  onChange,
  options,
  placeholder = "Select…",
  size = "md",
  className = "",
  menuClassName = "",
  align = "left",
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  size?: "sm" | "md";
  className?: string;
  menuClassName?: string;
  align?: "left" | "right";
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const trigger =
    size === "sm"
      ? "h-6 rounded-md px-1.5 text-[11px] font-semibold text-[#56505c]"
      : "h-11 rounded-xl px-3 text-[14px] font-semibold text-[#28222e]";

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={`flex w-full items-center justify-between gap-2 border bg-white text-left transition ${trigger} ${
          open ? "border-[#ff5e1a]" : "border-[#ececf1] hover:border-[#e0dae3]"
        }`}
      >
        <span className={`truncate ${selected ? "" : "text-[#9a9bb0]"}`}>{selected?.label ?? placeholder}</span>
        <ChevronDown className={`${size === "sm" ? "size-3" : "size-4"} shrink-0 text-[#9a94a0]`} />
      </button>

      {open && (
        <div
          role="listbox"
          className={`absolute z-[60] mt-1.5 max-h-[280px] min-w-full overflow-auto rounded-xl border border-[#ececf1] bg-white p-1 shadow-[0_18px_40px_rgba(26,26,46,0.16)] ${
            align === "right" ? "right-0" : "left-0"
          } ${menuClassName}`}
        >
          {options.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left transition ${
                  active ? "bg-[#fff3ee]" : "hover:bg-[#f6f4f7]"
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-[13px] ${active ? "font-bold text-[#28222e]" : "font-semibold text-[#3b3442]"}`}>
                    {option.label}
                  </span>
                  {option.hint && <span className="mt-0.5 block text-[11px] leading-snug text-[#9a94a0]">{option.hint}</span>}
                </span>
                {active && <Check className="mt-0.5 size-3.5 shrink-0 text-[#ee6545]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
