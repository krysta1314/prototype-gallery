'use client';

/* 定价页的活动配图。先用 CSS 画,换成真实素材时只要把这里的 div 换成 <Image>,
   admin 的选择器、类型、存储都不用动。 */

import type { ArtKey } from '../_lib/types';

export const ART_OPTIONS: { id: ArtKey; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'newuser', label: 'New user' },
  { id: 'halloween', label: 'Halloween' },
  { id: 'blackfriday', label: 'Black Friday' },
];

const ART: Record<Exclude<ArtKey, 'none'>, { bg: string; dots: string }> = {
  newuser: {
    bg: 'linear-gradient(120deg,#FFE9D6 0%,#FFD0AE 45%,#FFB48A 100%)',
    dots: 'radial-gradient(circle at 18% 70%, rgba(255,255,255,.75) 0 7px, transparent 8px), radial-gradient(circle at 82% 32%, rgba(255,255,255,.55) 0 11px, transparent 12px)',
  },
  halloween: {
    bg: 'linear-gradient(120deg,#2B1B3D 0%,#4A2352 48%,#FF7A2F 100%)',
    dots: 'radial-gradient(circle at 22% 30%, rgba(255,190,110,.85) 0 6px, transparent 7px), radial-gradient(circle at 74% 66%, rgba(255,150,60,.5) 0 14px, transparent 15px)',
  },
  blackfriday: {
    bg: 'linear-gradient(120deg,#111117 0%,#1F1F2B 55%,#3A2118 100%)',
    dots: 'radial-gradient(circle at 80% 28%, rgba(255,94,26,.9) 0 9px, transparent 10px), radial-gradient(circle at 24% 72%, rgba(255,167,60,.45) 0 16px, transparent 17px)',
  },
};

export function CampaignArt({ art, className = '' }: { art: ArtKey | undefined; className?: string }) {
  if (!art || art === 'none') {
    return <div className={`bg-[#f4f4f6] ${className}`} aria-hidden />;
  }
  const a = ART[art];
  return (
    <div
      className={className}
      aria-hidden
      style={{ backgroundImage: `${a.dots}, ${a.bg}`, backgroundRepeat: 'no-repeat' }}
    />
  );
}
