"use client";

/* 图标按钮的悬停提示(剪辑器里所有按钮共用这一个)。交互规则,和 Figma / Linear 这类工具一致:
   - 鼠标停留 400ms 才出现,只是划过不出;已经有提示在显示时,移到相邻按钮立刻出(连着看不用每个都等)
   - 鼠标移开立刻消失
   - 按下(点击)立刻消失,并且在鼠标移开之前不再出现 —— 点开下拉 / 弹窗时不会挡住它
   - 这个按钮自己打开的下拉还开着(aria-expanded="true")时不出
   - 键盘 Tab 聚焦(:focus-visible)时出现,失焦或按 Esc 消失;鼠标点击带来的聚焦不算
   可带快捷键。side 按按钮所在位置选,保证不被剪辑器卡片的边缘裁掉。 */

import { useEffect, useRef, useState } from "react";

type Side = "top" | "bottom" | "right" | "left";

const POS: Record<Side, string> = {
  top: "bottom-[calc(100%+6px)]",
  bottom: "top-[calc(100%+6px)]",
  right: "left-[calc(100%+6px)] top-1/2 -translate-y-1/2",
  left: "right-[calc(100%+6px)] top-1/2 -translate-y-1/2",
};

const DELAY = 400;
/** 刚有提示消失不到这么久,下一个提示立刻出(在一排按钮上移动时连着看) */
const WARM = 300;
let lastHidden = 0;

export function Tip({
  label,
  kbd,
  side = "top",
  align = "center",
  className = "",
  style,
  children,
}: {
  label: string;
  kbd?: string;
  side?: Side;
  /** 上下弹出时的水平对齐:贴着屏幕 / 卡片边缘的按钮用 start 或 end,免得被裁掉 */
  align?: "center" | "start" | "end";
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const timer = useRef<number | undefined>(undefined);
  /** 按下过:直到鼠标移开都不再出 */
  const pressed = useRef(false);
  const [show, setShow] = useState(false);

  const clear = () => window.clearTimeout(timer.current);
  /* 这个按钮打开的下拉 / 弹窗还开着就不出 */
  const blocked = () => pressed.current || !!rootRef.current?.querySelector('[aria-expanded="true"]');
  const open = (now = false) => {
    clear();
    if (blocked()) return;
    if (now || Date.now() - lastHidden < WARM) setShow(true);
    else timer.current = window.setTimeout(() => !blocked() && setShow(true), DELAY);
  };
  const close = () => {
    clear();
    setShow((was) => {
      if (was) lastHidden = Date.now();
      return false;
    });
  };
  useEffect(() => () => clear(), []);
  useEffect(() => {
    if (!show) return;
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      lastHidden = Date.now();
      setShow(false);
    };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [show]);

  return (
    /* 外层已经是 absolute(比如时间线末尾的「+」)就不再加 relative,否则两者冲突按钮会跑位 */
    <span
      ref={rootRef}
      className={`inline-flex ${/\babsolute\b/.test(className) ? "" : "relative"} ${className}`}
      style={style}
      onPointerEnter={(e) => e.pointerType === "mouse" && open()}
      onPointerLeave={() => {
        pressed.current = false;
        close();
      }}
      onPointerDown={() => {
        pressed.current = true;
        close();
      }}
      onFocus={(e) => {
        if ((e.target as Element).matches?.(":focus-visible")) open(true);
      }}
      onBlur={close}
    >
      {children}
      <span
        role="tooltip"
        aria-hidden={!show}
        className={`pointer-events-none absolute z-50 flex items-center gap-1.5 whitespace-nowrap rounded-md bg-[#1a1a2e] px-2 py-1 text-[12px] font-medium text-white shadow-[0_4px_12px_rgba(26,26,46,0.25)] transition-opacity duration-100 motion-reduce:transition-none ${
          show ? "opacity-100" : "opacity-0"
        } ${POS[side]} ${
          side === "top" || side === "bottom"
            ? align === "start"
              ? "left-0"
              : align === "end"
                ? "right-0"
                : "left-1/2 -translate-x-1/2"
            : ""
        }`}
      >
        {label}
        {kbd && <kbd className="rounded bg-white/15 px-1 font-sans text-[11px] leading-4 text-white/80">{kbd}</kbd>}
      </span>
    </span>
  );
}
