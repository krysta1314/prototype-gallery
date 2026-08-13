'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Switch } from '../../components/ui/switch';

/**
 * 自动升级开关：开启后，credits 即将不足时自动升到下一档套餐，避免生成中断。
 * 默认开启，用户可关闭。原型态——仅本地状态，不接后端。
 */
export function AutoUpgradeToggle() {
  const [enabled, setEnabled] = useState(true);
  const [showDetail, setShowDetail] = useState(false);

  return (
    <div className="mt-3 flex items-start justify-between gap-4 rounded-xl border border-neutral-200 bg-neutral-50/60 px-4 py-3">
      <div className="min-w-0 max-w-[680px]">
        <label
          htmlFor="auto-upgrade"
          className="block text-[13px] font-semibold text-[#0a0a0a] cursor-pointer"
        >
          Auto-upgrade plan when credits run low
        </label>
        <p className="mt-0.5 text-[11px] text-neutral-500 leading-relaxed">
          Automatically move up to the next plan before your credits run out, so your generations never pause.{' '}
          <button
            type="button"
            onClick={() => setShowDetail(v => !v)}
            aria-expanded={showDetail}
            className="inline-flex items-center gap-0.5 align-baseline font-medium text-[#f97316] hover:underline underline-offset-2"
          >
            了解更多
            <ChevronDown
              className={`size-3 transition-transform ${showDetail ? 'rotate-180' : ''}`}
              aria-hidden
            />
          </button>
        </p>
        {showDetail && (
          <ul className="mt-1.5 text-[11px] text-neutral-500 leading-relaxed list-disc pl-4 space-y-1">
            <li>Auto-upgrade kicks in when your remaining credits fall below 300, or when a new image or video task needs more credits than you have left, so your tasks can still run.</li>
            <li>You&rsquo;re upgraded to the new plan at its full price, and it takes effect immediately.</li>
            <li>Turn it off anytime under Dashboard › Account Settings › Billing &amp; Subscription.</li>
          </ul>
        )}
      </div>
      <Switch
        id="auto-upgrade"
        checked={enabled}
        onCheckedChange={setEnabled}
        aria-label="Auto-upgrade plan when credits run low"
        className="mt-0.5 data-[state=checked]:bg-[#f97316]"
      />
    </div>
  );
}
