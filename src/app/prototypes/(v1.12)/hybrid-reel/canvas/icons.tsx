/* 分割(Split at playhead):「][」两个背靠背的方括号,中间一条切线,照参考产品的样式。
   括号撑满 24 的画布、线宽和 lucide 一致,在小尺寸下不会显得被压扁 */
export function SplitIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      aria-hidden
    >
      <path d="M4 4h5.5v16H4" />
      <path d="M20 4h-5.5v16H20" />
      <path d="M12 2v20" strokeWidth={1.6} />
    </svg>
  );
}
