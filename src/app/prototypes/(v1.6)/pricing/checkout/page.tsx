'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, CreditCard, Loader2, Lock } from 'lucide-react';
import { BUSINESS_PLANS, type BusinessPlanId, type SeatBusinessPlan } from '../_src/lib/pricing/business';
import type { BillingCycle } from '../_src/lib/pricing/pricing';
import { PENDING_TEAM_KEY, type PendingTeam } from '../../team-workspace/_shared/data';

/**
 * Stripe Checkout 的高仿页 —— 演示用,不接真实支付。
 *
 * 为什么要做:真实产品里点 Continue 就离站去 Stripe 托管的收银台了,卡号、3DS、税号都在他们那边。
 * 但演示时不能断在「跳走了」这一步,所以照 Stripe Checkout 的版式复刻一页,把整条链路演完:
 *
 *   订阅页 Get <plan> → 团队名 → **这一页** → 首页 + 立即弹出邀请成员弹窗
 *
 * 付款成功要做的两件事:
 * 1. 把刚买下的团队写进 localStorage 的 PENDING_TEAM_KEY —— 工作区一加载就把它落成真实团队;
 * 2. 带 ?invite=1 回首页 —— 落地即弹邀请成员弹窗,睁眼第一件事就是拉人。
 */

const EMAIL = 'monica.zhou@presslogic.com';

/** Stripe 的金额写法:US$3,780.00 —— 千分位 + 两位小数 */
function usd(amount: number) {
  return `US$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function StripeCheckoutPage() {
  return (
    <Suspense fallback={null}>
      <Checkout />
    </Suspense>
  );
}

function Checkout() {
  const router = useRouter();
  const params = useSearchParams();

  const planId = (params.get('plan') ?? 'team') as BusinessPlanId;
  const plan = (BUSINESS_PLANS[planId] ?? BUSINESS_PLANS.team) as SeatBusinessPlan;
  const cycle = (params.get('cycle') === 'monthly' ? 'monthly' : 'yearly') as BillingCycle;
  const teamName = params.get('team')?.trim() || 'Your team';
  const seats = Math.min(plan.seats.max, Math.max(plan.seats.min, Number(params.get('seats')) || plan.seats.default));

  const [paying, setPaying] = useState(false);

  const yearly = cycle === 'yearly';
  const perSeat = yearly ? plan.annualMonthlyPrice : plan.monthlyPrice;
  /** 年付一次收整年,月付收一个月 */
  const total = yearly ? perSeat * 12 * seats : perSeat * seats;

  const subscribe = () => {
    if (paying) return;
    setPaying(true);
    // 真实实现:Stripe 扣款成功后回跳 success_url;这里用短延时代替那趟往返
    window.setTimeout(() => {
      const pending: PendingTeam = { name: teamName, planId, seats };
      try {
        window.localStorage.setItem(PENDING_TEAM_KEY, JSON.stringify(pending));
      } catch {
        /* 隐私模式下写不进去也不拦着演示,只是回去看不到新团队 */
      }
      router.push('/prototypes/team-workspace/home?invite=1');
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-white text-[#30313d]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div className="mx-auto grid min-h-screen max-w-[1080px] grid-cols-1 md:grid-cols-2">
        {/* 左栏:订单 —— Stripe 的版式是「品牌 → 订阅名 → 大金额 → 明细 → 今日应付」 */}
        <section className="border-b border-[#e6e6e6] px-6 py-10 md:border-b-0 md:border-r md:px-12">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Back"
              className="text-[#6d6e78] transition-colors hover:text-[#30313d]"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <span className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-[#ff9a3d] to-[#ff5424] text-[13px] font-black text-white">
              B
            </span>
            {/* Stripe 沙盒的角标,提醒这是测试环境 */}
            <span className="rounded bg-[#30313d] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              Test mode
            </span>
          </div>

          <p className="mt-8 text-[15px] text-[#6d6e78]">Subscribe to {plan.name} plan</p>
          <div className="mt-1 flex items-end gap-2">
            <span className="text-[40px] font-bold leading-none tracking-tight text-[#30313d]">
              {usd(total)}
            </span>
            <span className="pb-1 text-[13px] font-semibold leading-tight text-[#6d6e78]">
              per
              <br />
              {yearly ? 'year' : 'month'}
            </span>
          </div>

          <div className="mt-10 space-y-1">
            <div className="flex items-start justify-between gap-4 text-[14px]">
              <div className="min-w-0">
                <div className="font-medium text-[#30313d]">
                  {plan.name} plan · {seats} {seats === 1 ? 'seat' : 'seats'}
                </div>
                <div className="mt-0.5 text-[13px] text-[#6d6e78]">{plan.tagline}</div>
                <div className="mt-0.5 text-[13px] text-[#6d6e78]">
                  {usd(perSeat)} per seat / month · billed {yearly ? 'annually' : 'monthly'}
                </div>
              </div>
              <span className="shrink-0 font-medium">{usd(total)}</span>
            </div>
          </div>

          <div className="mt-6 border-t border-[#e6e6e6] pt-4">
            <div className="flex items-center justify-between text-[14px]">
              <span>Subtotal</span>
              <span className="font-medium">{usd(total)}</span>
            </div>
            <button
              type="button"
              className="mt-3 rounded-md bg-[#f6f8fa] px-3 py-1.5 text-[13px] font-medium text-[#30313d] transition-colors hover:bg-[#eef1f4]"
            >
              Add promotion code
            </button>
            <div className="mt-4 flex items-center justify-between border-t border-[#e6e6e6] pt-4 text-[15px] font-bold">
              <span>Total due today</span>
              <span>{usd(total)}</span>
            </div>
          </div>

          {/* 演示说明(不是产品文案) */}
          <p className="mt-10 text-[12px] leading-relaxed text-[#8b8d98]">
            演示用:这是 Stripe Checkout 的高仿页,不接真实支付。点 Subscribe 会模拟扣款成功,
            然后回到工作区并立即弹出邀请成员弹窗 —— 付款后第一件事就是拉人。
          </p>
        </section>

        {/* 右栏:付款 —— 快捷支付 → 联系信息 → 卡信息 → Subscribe */}
        <section className="px-6 py-10 md:px-12">
          <div className="grid grid-cols-2 gap-3">
            <span className="grid h-11 place-items-center rounded-md bg-black text-[15px] font-semibold text-white">Apple&nbsp;Pay</span>
            <span className="grid h-11 place-items-center rounded-md bg-[#00d66f] text-[15px] font-bold text-[#0b1c14]">
              link
            </span>
          </div>

          <div className="my-6 flex items-center gap-3 text-[12px] text-[#8b8d98]">
            <span className="h-px flex-1 bg-[#e6e6e6]" />
            or
            <span className="h-px flex-1 bg-[#e6e6e6]" />
          </div>

          <h2 className="text-[15px] font-semibold text-[#30313d]">Contact information</h2>
          <label className="mt-2 block">
            <span className="mb-1 block text-[13px] text-[#6d6e78]">Email</span>
            <input defaultValue={EMAIL} className={fieldClass} />
          </label>

          <h2 className="mt-6 text-[15px] font-semibold text-[#30313d]">Payment method</h2>
          <div className="mt-2 rounded-md border border-[#e6e6e6] p-4">
            <div className="flex items-center gap-2 text-[14px] font-medium text-[#30313d]">
              <CreditCard className="h-4 w-4 text-[#6d6e78]" />
              Card
            </div>

            <label className="mt-4 block">
              <span className="mb-1 block text-[13px] text-[#6d6e78]">Card information</span>
              <input inputMode="numeric" placeholder="1234 1234 1234 1234" className={`${fieldClass} rounded-b-none`} />
              <div className="grid grid-cols-2">
                <input placeholder="MM / YY" className={`${fieldClass} rounded-none rounded-bl-md border-t-0`} />
                <input placeholder="CVC" className={`${fieldClass} rounded-none rounded-br-md border-l-0 border-t-0`} />
              </div>
            </label>

            <label className="mt-4 block">
              <span className="mb-1 block text-[13px] text-[#6d6e78]">Cardholder name</span>
              <input placeholder="Full name on card" className={fieldClass} />
            </label>

            <label className="mt-4 block">
              <span className="mb-1 block text-[13px] text-[#6d6e78]">Country or region</span>
              <select defaultValue="Hong Kong SAR" className={`${fieldClass} bg-white`}>
                <option>Hong Kong SAR</option>
                <option>Singapore</option>
                <option>United States</option>
                <option>United Kingdom</option>
              </select>
            </label>
          </div>

          <label className="mt-4 flex items-start gap-2.5 rounded-md border border-[#e6e6e6] p-3">
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#635bff]" />
            <span className="text-[13px] leading-snug">
              <span className="font-medium text-[#30313d]">Save my info for faster checkout</span>
              <span className="mt-0.5 block text-[12px] text-[#6d6e78]">
                Pay securely at Buzz and everywhere Link is accepted.
              </span>
            </span>
          </label>

          <button
            type="button"
            onClick={subscribe}
            disabled={paying}
            className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#635bff] text-[15px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-70"
          >
            {paying ? (
              <>
                <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
                Processing…
              </>
            ) : (
              'Subscribe'
            )}
          </button>

          <p className="mt-3 text-center text-[12px] leading-relaxed text-[#6d6e78]">
            By subscribing, you authorise Buzz to charge you according to the terms until you cancel.
          </p>

          <div className="mt-6 flex items-center justify-center gap-2 text-[12px] text-[#8b8d98]">
            <Lock className="h-3 w-3" />
            Powered by <span className="font-bold text-[#635bff]">stripe</span>
            <span className="text-[#dcdde3]">|</span>
            Terms
            <span className="text-[#dcdde3]">|</span>
            Privacy
          </div>
        </section>
      </div>
    </div>
  );
}

const fieldClass =
  'w-full rounded-md border border-[#e6e6e6] px-3 py-2.5 text-[14px] text-[#30313d] shadow-[0_1px_1px_rgba(0,0,0,0.03)] outline-none transition-colors placeholder:text-[#a3a5ad] focus:border-[#635bff]';
