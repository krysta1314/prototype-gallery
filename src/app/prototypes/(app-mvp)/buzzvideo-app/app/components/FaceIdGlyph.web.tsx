/* 网页端:Face ID 图标(四角括号 + 双眼 + 鼻子 + 微笑),系统验证时显示 */
export default function FaceIdGlyph({ size = 64, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke={color} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ display: "block" }}>
      <path d="M4 20V12a8 8 0 0 1 8-8h8M44 4h8a8 8 0 0 1 8 8v8M60 44v8a8 8 0 0 1-8 8h-8M20 60h-8a8 8 0 0 1-8-8v-8" />
      <path d="M22 24v5M42 24v5M32 24v12a3 3 0 0 1-3 3M23 45c5 4 13 4 18 0" />
    </svg>
  );
}
