"use client";

/* 自选颜色:色板最后一格「+」点开的小浮层 —— 饱和度 / 亮度面板 + 色相条 + HEX 输入。
   不用系统取色器(各系统长得不一样),和剪辑器其它面板同一套样式。拖动时连续预览,松手算一步撤销 */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Plus } from "lucide-react";
import { FOCUS } from "./ui";

type Hsv = { h: number; s: number; v: number };

function hexToHsv(hex: string): Hsv {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  const n = m ? parseInt(m[1], 16) : 0xff5e1a;
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  let h = 0;
  if (d) h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: (h * 60 + 360) % 360, s: max ? d / max : 0, v: max };
}

function hsvToHex({ h, s, v }: Hsv): string {
  const f = (k: number) => {
    const x = (k + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(x, 4 - x, 1));
  };
  return `#${[f(5), f(3), f(1)].map((c) => Math.round(c * 255).toString(16).padStart(2, "0")).join("")}`;
}

/** 拖动工具:按下记撤销点,移动时把 0–1 的位置交给 onMove */
function useDrag(onStart: () => void, onMove: (x: number, y: number) => void) {
  return (e: React.PointerEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const box = el.getBoundingClientRect();
    const at = (ev: { clientX: number; clientY: number }) =>
      onMove(Math.min(1, Math.max(0, (ev.clientX - box.left) / box.width)), Math.min(1, Math.max(0, (ev.clientY - box.top) / box.height)));
    onStart();
    el.setPointerCapture(e.pointerId);
    at(e);
    const move = (ev: PointerEvent) => at(ev);
    const up = () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
  };
}

/** 色板格的边和选中态(色板和自选格共用):浅灰细边;选中 = 白色间隔 + 橙色外圈 */
export const SWATCH_OFF = "inset 0 0 0 1px rgba(0,0,0,0.12)";
export const SWATCH_ON = "inset 0 0 0 1px rgba(0,0,0,0.12), 0 0 0 2px #fff, 0 0 0 4px #ff5e1a";

export function ColorPicker({
  value,
  custom,
  onStart,
  onChange,
}: {
  value: string;
  /** 当前颜色不在色板里:在彩色「+」前面多一格显示当前颜色并标为选中 */
  custom: boolean;
  /** 记一个撤销点(开始拖 / 改 HEX 前) */
  onStart: () => void;
  /** 改颜色,不记撤销点 */
  onChange: (hex: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(value));
  const [hex, setHex] = useState(value);
  const rootRef = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  /* 浮层挂到 body 上(fixed),不受设置面板滚动裁切;位置按色板格算,默认在它上方,放不下就放下方,左右收在窗口内 */
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    const place = () => {
      const r = rootRef.current?.getBoundingClientRect();
      const pop = popRef.current;
      if (!r || !pop) return;
      const w = pop.offsetWidth;
      const h = pop.offsetHeight;
      const left = Math.min(Math.max(8, r.right - w), window.innerWidth - w - 8);
      const top = r.top - h - 8 >= 8 ? r.top - h - 8 : Math.min(r.bottom + 8, window.innerHeight - h - 8);
      setPos({ left, top });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  /* 打开时从当前颜色开始 */
  useEffect(() => {
    if (!open) return;
    setHsv(hexToHsv(value));
    setHex(value);
    const off = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node) && !popRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", off);
    window.addEventListener("keydown", esc, true);
    return () => {
      document.removeEventListener("pointerdown", off);
      window.removeEventListener("keydown", esc, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = (next: Hsv) => {
    setHsv(next);
    const h = hsvToHex(next);
    setHex(h);
    onChange(h);
  };
  const dragPad = useDrag(onStart, (x, y) => set({ ...hsv, s: x, v: 1 - y }));
  const dragHue = useDrag(onStart, (x) => set({ ...hsv, h: x * 360 }));

  return (
    <div ref={rootRef} className="flex gap-2">
      {/* 选了色板外的颜色:先单独显示这一格(选中态),自选的彩色「+」一直在最后,随时能再调 */}
      {custom && (
        <button
          type="button"
          aria-label={`Custom colour ${value}`}
          aria-pressed
          onClick={() => setOpen((v) => !v)}
          className={`size-7 rounded-full ${FOCUS}`}
          style={{ background: value, boxShadow: SWATCH_ON }}
        />
      )}
      <button
        type="button"
        aria-label="Custom colour"
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Custom colour"
        onClick={() => setOpen((v) => !v)}
        className={`grid size-7 place-items-center rounded-full ${FOCUS}`}
        style={{ background: "conic-gradient(#ff3b30, #ffcc00, #34c759, #00c7be, #007aff, #af52de, #ff2d55, #ff3b30)" }}
      >
        <span className="grid size-[18px] place-items-center rounded-full bg-white text-[#1a1a2e]">
          <Plus className="size-3" strokeWidth={2.5} />
        </span>
      </button>
      {open && createPortal(
        <div
          ref={popRef}
          role="dialog"
          aria-label="Pick a colour"
          data-nodrag
          className="fixed z-[320] w-[232px] rounded-xl border border-[#ececf1] bg-white p-3 shadow-[0_12px_32px_rgba(26,26,46,0.18)]"
          style={{ left: pos?.left ?? -9999, top: pos?.top ?? -9999 }}
        >
          {/* 饱和度(横)× 亮度(竖) */}
          <div
            onPointerDown={dragPad}
            className="relative h-32 cursor-crosshair touch-none rounded-lg"
            style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsv.h} 100% 50%))` }}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.3)]"
              style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, background: hex }}
            />
          </div>
          {/* 色相 */}
          <div
            onPointerDown={dragHue}
            className="relative mt-3 h-3 cursor-pointer touch-none rounded-full"
            style={{ background: "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)" }}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.3)]"
              style={{ left: `${(hsv.h / 360) * 100}%`, background: `hsl(${hsv.h} 100% 50%)` }}
            />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span aria-hidden className="size-7 shrink-0 rounded-md ring-1 ring-inset ring-black/10" style={{ background: hex }} />
            <input
              aria-label="Hex colour"
              value={hex}
              spellCheck={false}
              onChange={(e) => setHex(e.target.value)}
              onBlur={() => {
                const v = hex.startsWith("#") ? hex : `#${hex}`;
                if (/^#[0-9a-f]{6}$/i.test(v)) {
                  onStart();
                  set(hexToHsv(v));
                } else setHex(hsvToHex(hsv));
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              }}
              className="h-8 min-w-0 flex-1 rounded-lg border border-[#e3e4ea] px-2.5 font-mono text-[12.5px] uppercase text-[#1a1a2e] outline-none focus:border-[#ff5e1a]"
            />
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
