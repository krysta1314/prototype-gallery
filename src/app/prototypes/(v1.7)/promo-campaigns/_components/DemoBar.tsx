'use client';

import { useState } from 'react';
import { useCampaigns, SEEN_KEY } from '../_lib/store';
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
  const [active, setActive] = useState<string | null>(null);

  const pick = (key: (typeof SCENES)[number]['key']) => {
    save(applyScene(key));
    // 切场景 = 干净的首次访问：清掉弹窗频控计数，否则演示时可能因为频控命中不弹出。
    window.localStorage.removeItem(SEEN_KEY);
    setActive(key);
  };

  return (
    // 右侧在 md+ 留出空档：定价页右下角的 RolePicker 是 fixed bottom-4 right-4，
    // 控制条若通栏会盖住它并吞掉点击。
    <div className="fixed bottom-0 left-0 right-0 z-[90] flex flex-wrap items-center justify-center gap-2 border-t border-[#ececf1] bg-white/95 px-4 py-3 backdrop-blur md:right-[13.5rem]">
      <span className="text-xs text-[#6a6b7b]">演示控制 · 切换活动场景（会重置为预置活动，覆盖你在 admin 里新建的活动）：</span>
      {SCENES.map(s => (
        <button
          key={s.key}
          type="button"
          aria-pressed={active === s.key}
          onClick={() => pick(s.key)}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
            active === s.key
              ? 'border-[#ff9a3d] bg-[#fff3ec] text-[#ff5e1a]'
              : 'border-[#ececf1] text-[#1a1a2e] hover:border-[#ff9a3d] hover:text-[#ff5e1a]'
          }`}
        >
          {s.label}
        </button>
      ))}
      <span className="ml-2 text-xs text-[#9a9aa6]">切换后本页立即生效，无需刷新 · 折扣仅对年付生效，请把上方计费切到 Yearly</span>
    </div>
  );
}
