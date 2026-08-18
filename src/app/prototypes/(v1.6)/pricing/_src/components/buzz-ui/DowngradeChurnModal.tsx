'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  PAID_PLANS,
  UPGRADE_DELTAS,
  type PaidPlanId,
} from '../../lib/pricing/pricing';
import { fmtNumber } from '../../lib/pricing/format';

interface Props {
  open: boolean;
  onClose: () => void;
  /** 用户当前 plan */
  from: PaidPlanId;
  /** 用户点击想降级到的 plan */
  to: PaidPlanId;
}

/**
 * 降级拦截 modal —— 用户点 "Downgrade to X" 时弹出。
 * 不直接走降级流程：展示会失去什么 + 引导去 Account Settings 完成。
 * 留出 churn-interception 窗口（未来可以加 pause / discount offer）。
 */
export function DowngradeChurnModal({ open, onClose, from, to }: Props) {
  // ESC 关闭
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const fromPlan = PAID_PLANS[from];
  const toPlan = PAID_PLANS[to];

  // 降级损失 = 反向 UPGRADE_DELTAS（从低 plan 升到高 plan 多出来的 = 从高 plan 降到低 plan 丢失的）
  const reverseKey = `${to}-${from}`;
  const losses = UPGRADE_DELTAS[reverseKey];

  const fromCredits = PAID_PLANS[from].baseMonthlyCredits;
  const toCredits = PAID_PLANS[to].baseMonthlyCredits;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="churn-modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[480px] max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-4 sm:p-6 sm:pb-4 border-b border-neutral-100">
          <div>
            <h2 id="churn-modal-title" className="text-xl font-bold tracking-tight">
              Before you downgrade
            </h2>
            <p className="mt-1 text-[12px] text-neutral-500">
              Downgrading from <b>{fromPlan.name}</b> to <b>{toPlan.name}</b>
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 text-neutral-500 text-xl leading-none flex-shrink-0"
          >
            ×
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* You'll lose */}
          {losses && (
            <section className="rounded-xl p-4 border border-amber-200 bg-amber-50">
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800 mb-2">
                You&rsquo;ll lose
              </div>
              <ul className="space-y-1.5 text-sm text-amber-950">
                <li className="flex items-start gap-2">
                  <span className="text-amber-700 font-bold leading-tight">−</span>
                  <span>
                    <b>{fmtNumber(losses.credits)} credits</b> per month{' '}
                    <span className="text-amber-700/80">({fmtNumber(fromCredits)} → {fmtNumber(toCredits)} monthly)</span>
                  </span>
                </li>
                {losses.unlocks.map(u => (
                  <li key={u} className="flex items-start gap-2">
                    <span className="text-amber-700 font-bold leading-tight">−</span>
                    <span>{u}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* How to downgrade */}
          <section>
            <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-2">
              How to downgrade
            </div>
            <p className="text-sm text-neutral-700 leading-relaxed">
              To change your plan, please go to your dashboard:
            </p>
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-neutral-100 text-[13px] font-medium text-neutral-700">
              <span>Dashboard</span>
              <span className="text-neutral-400">›</span>
              <span>Account Settings</span>
              <span className="text-neutral-400">›</span>
              <span className="text-[#0a0a0a] font-semibold">Billing &amp; Subscription</span>
            </div>
            <p className="mt-3 text-[12px] text-neutral-500 leading-relaxed">
              Downgrades take effect at your next renewal — you&rsquo;ll keep your {fromPlan.name} benefits and remaining credits until then.
            </p>
          </section>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-[10px] border border-neutral-300 text-neutral-700 text-sm font-semibold hover:bg-neutral-50"
            >
              Got it
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-[10px] bg-[#0a0a0a] text-white text-sm font-semibold hover:opacity-90"
            >
              Keep my {fromPlan.name} plan
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
