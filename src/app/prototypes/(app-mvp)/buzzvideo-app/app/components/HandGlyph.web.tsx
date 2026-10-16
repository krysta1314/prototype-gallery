/**
 * ATT 框角标里的实心手掌(仿 iOS SF Symbol hand.raised.fill):四指 + 拇指分开,指缝露出底色。
 * 网页端用内联 svg;原生端(HandGlyph.tsx)真实 APP 不需要 —— ATT 框由系统绘制
 */
export default function HandGlyph({ size = 24, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden style={{ display: "block" }}>
      <g fill={color}>
        <rect x="6.6" y="4.2" width="2.7" height="10" rx="1.35" />
        <rect x="9.9" y="2.4" width="2.7" height="11.4" rx="1.35" />
        <rect x="13.2" y="3.2" width="2.7" height="10.6" rx="1.35" />
        <rect x="16.5" y="5.6" width="2.5" height="8.6" rx="1.25" />
        <rect x="6.6" y="11.2" width="12.4" height="10.6" rx="4.6" />
        <rect x="3.4" y="10.8" width="2.7" height="7.6" rx="1.35" transform="rotate(-32 4.75 14.6)" />
      </g>
    </svg>
  );
}
