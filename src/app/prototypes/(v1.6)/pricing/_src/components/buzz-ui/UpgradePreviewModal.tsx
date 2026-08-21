'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  PAID_PLANS,
  RELEASES_PER_CYCLE,
  type BillingCycle,
  type PaidPlanId,
  type Scale,
} from '../../lib/pricing/pricing';
import { computeCredits, computePrice } from '../../lib/pricing/compute';
import { fmtMoney, fmtNumber } from '../../lib/pricing/format';

export type UpgradeVariant = 'tier' | 'volume';

interface Props {
  open: boolean;
  onClose: () => void;
  /** 当前 plan（来自 RolePicker mock）*/
  from: PaidPlanId;
  /** 目标 plan（用户点击的卡）*/
  to: PaidPlanId;
  /** 'tier' = 换套餐；'volume' = Ultra 内调倍数 */
  variant: UpgradeVariant;
  /** 用户当前订阅的 scale（volume 模式时用）*/
  fromScale: Scale;
  /** 目标 scale（来自滑块）*/
  toScale: Scale;
  /** 用户当前在页面 toggle 选的 cycle，作为预览的初始 cycle */
  cycle: BillingCycle;
  /** 现有订阅的计费周期 —— 折抵要按它算,不能用页面 toggle 的值 */
  fromCycle: BillingCycle;
  /** 现有订阅这一期里已经发放过几期月度额度 */
  monthsIssued: number;
  /** 现有订阅还剩多少 credits */
  remainingCredits: number;
}

/**
 * 升级预览 Modal —— 跟 Stripe 升级流程对齐的 UX：
 * 显示 today charge（prorated）、next renewal、benefits delta、credits 保留承诺。
 * 仅原型：confirm 按钮只 console.log，不接真后端。
 */
export function UpgradePreviewModal({
  open,
  onClose,
  from,
  to,
  variant,
  fromScale,
  toScale,
  cycle: initialCycle,
  fromCycle,
  monthsIssued,
  remainingCredits,
}: Props) {
  // modal cycle 跟随用户在页面上**当前选择**的 toggle（不是订阅历史）。
  // 用户已经选 yearly → 不再 cross-sell；用户选 monthly → 升级瞬间 cross-sell 年付。
  const [cycle, setCycle] = useState<BillingCycle>(initialCycle);

  // 每次重新打开 → 同步页面 toggle 当前值
  useEffect(() => {
    if (open) setCycle(initialCycle);
  }, [open, initialCycle]);

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

  const toPlan = PAID_PLANS[to];
  const fromPlan = PAID_PLANS[from];

  // 价格 / credits 计算
  const toPrice = computePrice(to, toScale, cycle);
  const newPlanCharge = cycle === 'yearly' ? toPrice.annualTotal : toPrice.displayPrice;

  /*
   * 折抵 —— R3 的准确写法是「不退**已发放**的月份」，而不是「一律不退」。
   *
   * 年付也是按月发额度，所以年付升档时 12 期里往往有 10 多期根本没发过，
   * 那几期的钱要折抵掉；已经发过的月份不退（那些额度用户已经拿到手了）。
   * 月付升档时当期额度已经发过，未发放期数为 0 → 折抵为 0，
   * 「订便宜档 → 用光 credits → 升档退款」这条薅羊毛路径照样堵着。
   */
  const releasesTotal = RELEASES_PER_CYCLE[fromCycle];
  const unissuedReleases = Math.max(0, releasesTotal - monthsIssued);
  // 旧档的每期单价 = 旧档在它自己周期下的月等效价
  const fromMonthlyRate = computePrice(from, fromScale, fromCycle).displayPrice;
  /*
   * 取整必须和 fmtMoney 一致(它用 ceil),否则同一个价会印出两个数:
   * 卡片上写 $14/mo,这里却按 13.3 round 成 $13。
   *
   * 而且折抵是拿**显示出来的**月价乘出来的 —— 这样 11 × $14 = $154
   * 读者自己就能验算。先乘再取整会得到 $146,和旁边那句说明对不上。
   */
  const chargeRounded = Math.ceil(newPlanCharge);
  const perReleaseRate = Math.ceil(fromMonthlyRate);
  const proration = Math.min(unissuedReleases * perReleaseRate, chargeRounded);
  const todayCharge = chargeRounded - proration;

  // 按业务规则 R1+R2：新周期从今天起，旧 credits 保留 + 新档额度累加
  const remainingFromOldPlan = remainingCredits;
  /*
   * 加进来的是**一期**的额度而不是整年 —— 年付按月发，
   * 所以升档当下到账的是新档的月度额度，不是 12 期一次性到账。
   */
  const newCycleCredits = computeCredits(to, toScale, 'monthly');
  const totalAfterUpgrade = remainingFromOldPlan + newCycleCredits;
  // 下次续费日 = 今天 + 30 天（monthly）或 + 365 天（yearly）—— mock 计算
  const daysToNext = cycle === 'yearly' ? 365 : 30;
  const nextRenewalDate = new Date(Date.now() + daysToNext * 24 * 60 * 60 * 1000)
    .toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const isYearly = cycle === 'yearly';

  // Yearly cross-sell 仅在 modal 当前 cycle 是 monthly 时展示
  // （已经选 yearly 就不再骚扰；跟页面 toggle 而非用户历史订阅）
  const showYearlyCrossSell = cycle === 'monthly';

  // Yearly cross-sell 计算
  const toYearlyPrice = computePrice(to, toScale, 'yearly');
  const yearlySavings = Math.max(0, (toPrice.monthlyPrice * 12) - toYearlyPrice.annualTotal);

  const title = variant === 'tier'
    ? `Upgrade to ${toPlan.name}`
    : `Update ${toPlan.name} subscription`;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[480px] max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-4 sm:p-6 sm:pb-4 border-b border-neutral-100">
          <div>
            <h2 id="upgrade-modal-title" className="text-xl font-bold tracking-tight">{title}</h2>
            <p className="mt-1 text-[12px] text-neutral-500">
              Upgrading from <b>{fromPlan.name}</b>
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
          {/*
            * 今日应付要逐行摆出来 —— 采购一定会拿这几个数去对账，
            * 只给一个总数会被追问「凭什么是这个数」。
            */}
          <section>
            <ul className="space-y-1.5 text-sm">
              <li className="flex items-baseline justify-between gap-2">
                <span className="text-neutral-700">
                  {toPlan.name} {isYearly ? 'annual' : 'monthly'} price
                </span>
                <span className="font-medium text-neutral-700">{fmtMoney(chargeRounded)}</span>
              </li>
              {proration > 0 && (
                <li className="flex items-baseline justify-between gap-2">
                  <span className="text-neutral-700">Unused {fromPlan.name} months</span>
                  <span className="font-medium text-emerald-700">−{fmtMoney(proration)}</span>
                </li>
              )}
              <li className="flex items-baseline justify-between gap-2 pt-2 mt-1 border-t border-neutral-100">
                <span className="font-semibold text-[#0a0a0a]">Due today</span>
                <span className="text-2xl font-bold tracking-tight">{fmtMoney(todayCharge)}</span>
              </li>
            </ul>
            {proration > 0 ? (
              <p className="mt-2 text-xs leading-relaxed text-neutral-500">
                {unissuedReleases} of your {releasesTotal} monthly {fromPlan.name}{' '}
                credit releases haven&rsquo;t been issued yet, at {fmtMoney(perReleaseRate)}/mo. Months already released
                stay yours and aren&rsquo;t refunded.
              </p>
            ) : (
              <p className="mt-2 text-xs leading-relaxed text-neutral-500">
                This {fromCycle === 'yearly' ? 'year' : 'month'}&rsquo;s {fromPlan.name} credits have already been
                issued, so there is nothing left to credit back — they stay yours to spend.
              </p>
            )}
          </section>

          {/* New cycle starts today + Next renewal date */}
          <section>
            <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
              New {toPlan.name} cycle starts today
            </div>
            <div className="text-sm text-neutral-700">
              Next renewal: <b>{nextRenewalDate}</b> · {fmtMoney(toPrice.displayPrice)}/mo {isYearly && `(${fmtMoney(toPrice.annualTotal)} billed annually)`}
            </div>
          </section>

          <hr className="border-neutral-100" />

          {/* Credits math: 旧档剩余 + 新档完整额度 = 新余额（R2） */}
          <section>
            <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-2">Your credits balance</div>
            <ul className="space-y-1 text-sm">
              <li className="flex items-baseline justify-between gap-2">
                <span className="text-neutral-700">Remaining from {fromPlan.name}</span>
                <span className="font-medium text-neutral-700">{fmtNumber(remainingFromOldPlan)}</span>
              </li>
              <li className="flex items-baseline justify-between gap-2">
                <span className="text-neutral-700">+ New {toPlan.name} monthly allowance</span>
                <span className="font-medium text-emerald-700">+{fmtNumber(newCycleCredits)}</span>
              </li>
              <li className="flex items-baseline justify-between gap-2 pt-1.5 mt-1.5 border-t border-neutral-100">
                <span className="font-semibold text-[#0a0a0a]">= New balance</span>
                <span className="font-bold text-[#0a0a0a]">{fmtNumber(totalAfterUpgrade)} credits</span>
              </li>
            </ul>
          </section>


          {/* Yearly cross-sell */}
          {showYearlyCrossSell && (
            <section
              className="rounded-xl p-4 border border-amber-200 bg-amber-50"
            >
              <div className="flex items-start gap-2">
                <span aria-hidden className="text-lg leading-none">💡</span>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-[#0a0a0a]">Save 30% — switch to yearly</div>
                  <p className="text-xs text-neutral-700 mt-1 leading-relaxed">
                    Pay yearly instead and lock in {toPlan.name} at <b>{fmtMoney(toYearlyPrice.displayPrice)}/mo</b> (saves {fmtMoney(yearlySavings)}/year).
                  </p>
                  <button
                    type="button"
                    onClick={() => setCycle('yearly')}
                    className={`mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-white text-xs font-semibold hover:opacity-90 ${
                      to === 'pro' ? 'bg-[#f97316]' : 'bg-[#0a0a0a]'
                    }`}
                  >
                    Switch to yearly →
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Yearly 已选确认 — 仅在用户点过 Switch to yearly 后展示 */}
          {cycle === 'yearly' && (
            <div className="text-[11px] text-emerald-700 font-medium">
              ✓ Yearly selected — you&rsquo;ll save {fmtMoney(yearlySavings)} per year vs monthly.
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                // Mock confirm — original prototype 不接真后端
                // eslint-disable-next-line no-console
                console.log('[Mock] Confirm upgrade', { from, to, variant, fromScale, toScale, cycle });
                onClose();
              }}
              className="flex-1 px-4 py-3 rounded-[10px] bg-[#0a0a0a] text-white text-sm font-semibold hover:opacity-90"
            >
              Confirm {variant === 'tier' ? 'upgrade' : 'update'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 rounded-[10px] border border-neutral-300 text-neutral-700 text-sm font-semibold hover:bg-neutral-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
