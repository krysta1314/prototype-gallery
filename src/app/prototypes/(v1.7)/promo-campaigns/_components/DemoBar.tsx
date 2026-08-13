'use client';

import { useCampaigns } from '../_lib/store';
import { SEED_CAMPAIGNS } from '../_lib/seed';
import type { Campaign } from '../_lib/types';

const SCENES = [
  { key: 'none', label: '无活动' },
  { key: 'bonus', label: '加赠' },
  { key: 'discount', label: '折扣' },
  { key: 'unlock', label: '解锁' },
  { key: 'all', label: '三者叠加' },
] as const;

/** 让指定类型的活动 live（把时间窗拉到覆盖当下），其余下线 */
function applyScene(scene: (typeof SCENES)[number]['key']): Campaign[] {
  const wide = { startAt: '2026-01-01T00:00', endAt: '2027-12-31T23:59' };
  const wanted: string[] =
    scene === 'none' ? []
    : scene === 'bonus' ? ['bonus_credits']
    : scene === 'discount' ? ['discount']
    : scene === 'unlock' ? ['unlock']
    : ['bonus_credits', 'discount', 'unlock'];

  return SEED_CAMPAIGNS.map(c =>
    wanted.includes(c.rule.kind)
      ? { ...c, ...wide, published: true }
      : { ...c, published: false },
  );
}

export function DemoBar() {
  const { save } = useCampaigns();
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[90] flex flex-wrap items-center justify-center gap-2 border-t border-[#ececf1] bg-white/95 px-4 py-3 backdrop-blur">
      <span className="text-xs text-[#6a6b7b]">演示控制 · 切换活动场景（会重置为预置活动，覆盖你在 admin 里新建的活动）：</span>
      {SCENES.map(s => (
        <button
          key={s.key}
          type="button"
          onClick={() => save(applyScene(s.key))}
          className="rounded-full border border-[#ececf1] px-3 py-1.5 text-xs font-semibold text-[#1a1a2e] transition hover:border-[#ff9a3d] hover:text-[#ff5e1a]"
        >
          {s.label}
        </button>
      ))}
      <span className="ml-2 text-xs text-[#9a9aa6]">切换后本页立即生效，无需刷新 · 折扣仅对年付生效，请把上方计费切到 Yearly</span>
    </div>
  );
}
