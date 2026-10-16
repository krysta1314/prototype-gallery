/**
 * ATT 框顶部的 iOS 系统「追踪」图标(不是 APP 自己的图标):橙色底 + 两个白色方块用一条曲线连起来。
 * 任何 APP 弹 ATT 都显示这个图标,由系统绘制;原型照真机还原
 */
export default function TrackingGlyph({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden style={{ display: "block" }}>
      <defs>
        <linearGradient id="att-orange" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F7AE5C" />
          <stop offset="1" stopColor="#EE8B36" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="15" fill="url(#att-orange)" />
      <path d="M21 24 C21 37, 41 30, 41 42" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" />
      <rect x="13" y="11" width="16" height="16" rx="4.5" fill="#fff" />
      <rect x="34" y="37" width="14" height="14" rx="4" fill="#fff" />
    </svg>
  );
}
