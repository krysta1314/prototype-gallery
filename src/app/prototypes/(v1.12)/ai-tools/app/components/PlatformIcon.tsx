/* 版位的平台图标(单色简化版,24 视窗,currentColor)。只用作识别,不是官方 logo 资源。 */

import type { Platform } from "../resize/logic";

const PATHS: Record<Exclude<Platform, "custom">, React.ReactNode> = {
  /* Meta:无限符号 */
  meta: (
    <path
      d="M6.5 7.5c-2.2 0-3.5 2.3-3.5 4.6 0 2.1 1 3.4 2.6 3.4 1.6 0 2.7-1.4 4.3-4.1l1.1-1.9C12.4 7.2 13.6 6.5 15 6.5c2.6 0 4.5 2.8 4.5 6 0 1.9-.8 3-2.3 3-1.5 0-2.4-1.1-4-3.8L11.3 8.6C10 6.6 8.7 7.5 6.5 7.5z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinejoin="round"
    />
  ),
  /* Instagram(Stories & Reels):圆角方 + 圆 + 点 */
  instagram: (
    <g fill="none" stroke="currentColor" strokeWidth="1.9">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" />
    </g>
  ),
  /* Google:G */
  google: <path d="M20 12.2c0-.6 0-1.1-.1-1.6H12v3.1h4.5a3.9 3.9 0 0 1-1.7 2.5 5 5 0 1 1 1.4-7.1l2.3-2.2A8.2 8.2 0 1 0 20 12.2z" fill="currentColor" />,
  /* TikTok:音符 */
  tiktok: (
    <path
      d="M16.6 3c.3 2.2 1.6 3.6 3.9 3.8v3.1c-1.4.1-2.6-.3-3.9-1.1v5.9c0 4.6-4.4 6.9-7.9 5.1-2.6-1.3-3.6-4.6-2.2-7.2 1.1-2 3.3-3 5.5-2.6v3.2c-1.3-.4-2.8.2-3.2 1.5-.5 1.6.8 3.2 2.5 3 1.3-.1 2.2-1.2 2.2-2.6V3h3.1z"
      fill="currentColor"
    />
  ),
  /* Amazon:微笑箭头 */
  amazon: (
    <g fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 14.5c4.8 3.3 11.6 3.6 16.5.6" />
      <path d="M17.2 13.6l2.8 1.5-1 3" />
      <path d="M9 11.5V6.8a2.4 2.4 0 0 1 4.8 0v4.7M9 9.4h4.8" />
    </g>
  ),
};

export function PlatformIcon({ platform, className = "size-4" }: { platform: Platform; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {platform === "custom" ? (
        <rect x="4" y="5" width="16" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.9" />
      ) : (
        PATHS[platform]
      )}
    </svg>
  );
}

/** 平台图标底色(浅色块里放单色图标,不用官方彩色 logo) */
export const PLATFORM_TINT: Record<Platform, string> = {
  meta: "bg-[#eef3ff] text-[#1d4ed8]",
  instagram: "bg-[#fdf0f6] text-[#c0267a]",
  google: "bg-[#eefaf2] text-[#15803d]",
  tiktok: "bg-[#f1f1f4] text-[#111114]",
  amazon: "bg-[#fff6e8] text-[#b45309]",
  custom: "bg-[#f3f4f6] text-[#4b5563]",
};
