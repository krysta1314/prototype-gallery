/**
 * 首页工具入口里 Lucide 没有的两个图标(2026-10-21 按同类产品的习惯画):
 * cutout = 虚线圆角框里一个人像(抠图 / 去背景，CapCut / Photoroom 的画法);
 * hd = 圆角方框里写「HD」(画质提升，剪映「画质提升」、必剪「画质修复」的画法)。
 * 网页端内联 svg;原生端见 ToolGlyph.tsx
 */
export default function ToolGlyph({ name, size = 22, color }: { name: "cutout" | "hd"; size?: number; color: string }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true, style: { display: "block" } } as const;
  if (name === "cutout")
    return (
      <svg {...common}>
        <rect x="3" y="3" width="18" height="18" rx="4" strokeDasharray="3 2.6" />
        <circle cx="12" cy="10" r="2.8" />
        <path d="M7.2 18c.9-2.4 2.7-3.6 4.8-3.6s3.9 1.2 4.8 3.6" />
      </svg>
    );
  return (
    <svg {...common}>
      <rect x="2.5" y="5" width="19" height="14" rx="3.5" />
      <path d="M7 9.2v5.6M7 12h3.4M10.4 9.2v5.6" />
      <path d="M13.4 9.2v5.6h1.5a2.4 2.8 0 0 0 0-5.6z" />
    </svg>
  );
}
