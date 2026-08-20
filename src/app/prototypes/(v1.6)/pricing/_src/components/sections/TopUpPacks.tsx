'use client';

import { TOPUP_PACKS, TOPUP_RULES } from '../../lib/pricing/topup';
import { fmtMoney, fmtNumber } from '../../lib/pricing/format';
import { Button } from '../buzz-ui/Button';

/**
 * Top-up 区块 —— 只出现在 Business tab。
 *
 * 它回答的是「人数不用加、只是这个月额度不够」这个场景。没有这一块,
 * 唯一的出路是买用不上的席位。
 */
export function TopUpPacks() {
  return (
    <section className="mt-16 sm:mt-20">
      <div className="text-center">
        <h2 className="text-2xl sm:text-[28px] font-bold tracking-tight">Need more credits, not more people?</h2>
        <p className="mt-2 text-sm text-neutral-500 max-w-2xl mx-auto text-balance">
          Buy a top-up instead of a seat. Same price per pack whether you pay monthly or annually.
        </p>
      </div>

      <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-5">
        {TOPUP_PACKS.map(pack => (
          <article
            key={pack.credits}
            className={`relative bg-white rounded-2xl p-6 flex flex-col gap-4 ${
              pack.badge
                ? 'border-2 border-[#7c3aed] shadow-[0_4px_24px_rgba(124,58,237,0.12)]'
                : 'border border-neutral-200'
            }`}
          >
            {pack.badge && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 text-[11px] font-semibold tracking-wide rounded-full whitespace-nowrap bg-[#7c3aed] text-white">
                {pack.badge}
              </span>
            )}

            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[28px] font-bold tracking-tight leading-none">{fmtNumber(pack.credits)}</span>
                <span className="text-[13px] text-neutral-500 font-medium">credits</span>
              </div>
              <p className="mt-1.5 text-[13px] text-neutral-500">
                {fmtMoney(pack.price)} one-off · ${pack.perCredit.toFixed(4)} per credit
              </p>
            </div>

            <div className="bg-neutral-50 rounded-[10px] p-3 text-xs leading-[1.5] text-neutral-600">
              Rolls over for 12 months. Used only after the month&apos;s included credits are gone.
            </div>

            <div className="mt-auto">
              <Button variant={pack.badge ? 'secondary' : 'dark'}>Buy {fmtNumber(pack.credits)}</Button>
            </div>
          </article>
        ))}
      </div>

      <ul className="text-[11px] text-neutral-500 mt-5 max-w-[920px] mx-auto leading-relaxed list-disc pl-4 space-y-1">
        {TOPUP_RULES.map(rule => (
          <li key={rule}>{rule}</li>
        ))}
      </ul>
    </section>
  );
}
