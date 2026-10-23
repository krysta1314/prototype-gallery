/**
 * 分享图标(2026-10-21;10-23 起全 APP 统一用它,Icon 的 share / download 也走这里):短视频流通用的实心弯箭头(像 TikTok / 即梦),和实心爱心同一风格。
 * 网页端内联 svg;原生端见 ShareGlyph.tsx(真实 APP 用 SF Symbol arrowshape.turn.up.right.fill)
 */
export default function ShareGlyph({ size = 28, color }: { size?: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden style={{ display: "block" }}>
      <path d="M13.6 4.2a.8.8 0 0 1 1.32-.6l7.1 6.4a.8.8 0 0 1 0 1.2l-7.1 6.4a.8.8 0 0 1-1.32-.6v-3.3c-4.7.1-7.9 1.6-10.2 5.1a.5.5 0 0 1-.9-.35C3.2 12.5 7 8.6 13.6 8V4.2z" fill={color} />
    </svg>
  );
}

/** 下载图标(2026-10-21 换):托盘 + 向下箭头(像 iOS square.and.arrow.down),粗线条，和实心爱心 / 分享箭头放一列不显轻 */
export function DownloadGlyph({ size = 28, color }: { size?: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden style={{ display: "block" }} fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3.5v11" />
      <path d="M7.5 10.5L12 15l4.5-4.5" />
      <path d="M4.5 14.5v3.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3.5" />
    </svg>
  );
}
