/* 图标按钮的悬停提示。
   纯 CSS:悬停或键盘聚焦时出现,稍延迟,避免鼠标划过时乱闪;可带快捷键。
   side 按按钮所在位置选,保证不被剪辑器卡片的边缘裁掉。 */

type Side = "top" | "bottom" | "right" | "left";

const POS: Record<Side, string> = {
  top: "bottom-[calc(100%+6px)]",
  bottom: "top-[calc(100%+6px)]",
  right: "left-[calc(100%+6px)] top-1/2 -translate-y-1/2",
  left: "right-[calc(100%+6px)] top-1/2 -translate-y-1/2",
};

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
  return (
    /* 外层已经是 absolute(比如时间线末尾的「+」)就不再加 relative,否则两者冲突按钮会跑位 */
    <span className={`group/tip inline-flex ${/\babsolute\b/.test(className) ? "" : "relative"} ${className}`} style={style}>
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute z-50 flex items-center gap-1.5 whitespace-nowrap rounded-md bg-[#1a1a2e] px-2 py-1 text-[11.5px] font-medium text-white opacity-0 shadow-[0_4px_12px_rgba(26,26,46,0.25)] transition-opacity duration-100 group-hover/tip:opacity-100 group-hover/tip:delay-300 group-focus-within/tip:opacity-100 ${POS[side]} ${
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
        {kbd && <kbd className="rounded bg-white/15 px-1 font-sans text-[10.5px] leading-4 text-white/80">{kbd}</kbd>}
      </span>
    </span>
  );
}
