'use client';

import { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/buzz-ui/Button';
import type { SeatBusinessPlan } from '../../lib/pricing/business';
import type { BillingCycle } from '../../lib/pricing/pricing';

/**
 * 建团队向导 —— pricing 页点 Get <plan> 之后,唯一要在站内问的东西:团队名。
 *
 *   卡片上选好席位 + 周期  →  ① 团队名  →  Stripe Checkout(/prototypes/pricing/checkout)
 *   →  付款成功回工作区,自动打开团队设置的 Members
 *
 * 三条取舍:
 * - **团队名在付款之前问**。名字是全流程最便宜的字段,先拿到它,Stripe session 才能把团队名
 *   带进 metadata、发票也才有主语;放到付款之后会出现「已收款但没有团队」的孤儿订阅。
 * - **周期与席位不在这里选**(Claude 是在这一步选的,我们不抄)。订阅页顶部已经选过月付 / 年付,
 *   席位也在卡片上调好了 —— 同一个决定不问两遍。
 * - **不自建收银台**。付款走 Stripe Checkout:卡号、地址、3DS、税号全在他们那边,
 *   我们只负责把 price + quantity + 团队名送过去,再接住 success 回跳。
 *
 * 付款成功的那一刻团队才诞生 —— 没有免费团队档,「购买」就是「建团」。
 */

/** 团队名长度:3–50 字符,与产品端校验同一口径 */
const NAME_MIN = 3;
const NAME_MAX = 50;

interface CreateTeamModalProps {
  plan: SeatBusinessPlan;
  /** 订阅页当前选的周期与席位数 —— 决定送去 Stripe 的 price 与 quantity */
  cycle: BillingCycle;
  seats: number;
  onClose: () => void;
}

export function CreateTeamModal({ plan, cycle, seats: initialSeats, onClose }: CreateTeamModalProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  /** 点了 Continue 就在离站途中,弹窗不再可关 —— 避免用户以为没走成、回去再点一次 */
  const [leaving, setLeaving] = useState(false);
  const seats = Math.min(plan.seats.max, Math.max(plan.seats.min, initialSeats));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !leaving) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, leaving]);

  /** 真实实现是后端建 Checkout Session 再 window.location = session.url;这里跳高仿的收银台页 */
  const toCheckout = () => {
    setLeaving(true);
    const query = new URLSearchParams({
      plan: plan.id,
      seats: String(seats),
      cycle,
      team: name.trim(),
    });
    router.push(`/prototypes/pricing/checkout?${query.toString()}`);
  };

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-start justify-center overflow-y-auto bg-black/40 p-4 sm:place-items-center"
      role="dialog"
      aria-modal="true"
      aria-label={`Get ${plan.name} plan`}
      onClick={() => !leaving && onClose()}
    >
      <div
        className="my-auto w-full max-w-[520px] rounded-2xl bg-white p-6 shadow-[0_24px_64px_rgba(10,10,10,0.24)]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-400">
              {plan.name} plan
            </div>
            <h2 className="mt-1 text-[22px] font-bold tracking-tight">Let&rsquo;s create your team</h2>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            disabled={leaving}
            className="-mr-1 -mt-1 p-1 text-neutral-400 transition-colors hover:text-neutral-700 disabled:pointer-events-none disabled:opacity-40"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>

        <NameStep plan={plan} name={name} leaving={leaving} onNameChange={setName} onContinue={toCheckout} />
      </div>
    </div>
  );
}

/* ---------------- ① 团队名 ---------------- */

function NameStep({
  plan,
  name,
  leaving,
  onNameChange,
  onContinue,
}: {
  plan: SeatBusinessPlan;
  name: string;
  leaving: boolean;
  onNameChange: (value: string) => void;
  onContinue: () => void;
}) {
  /** 失焦或提交过一次才提示,不然刚敲第一个字母就报错太吵 */
  const [touched, setTouched] = useState(false);
  const trimmed = name.trim();
  const valid = trimmed.length >= NAME_MIN && trimmed.length <= NAME_MAX;
  // 超长是硬违规,边打边提示;太短则等失焦/提交后再说
  const showError = trimmed.length > NAME_MAX || (touched && trimmed.length > 0 && !valid);

  const submit = () => {
    setTouched(true);
    if (valid) onContinue();
  };

  return (
    <>
      <p className="mt-2 text-[13px] leading-snug text-neutral-500">
        {plan.name} plans are best for groups up to {plan.seats.max} people. Choose a team name that
        invited members will easily recognize.
      </p>

      <form
        className="mt-5"
        onSubmit={e => {
          e.preventDefault();
          submit();
        }}
      >
        <label className="block text-[13px] font-semibold text-[#0a0a0a] mb-1.5" htmlFor="create-team-name">
          Team name
        </label>
        <input
          id="create-team-name"
          value={name}
          autoFocus
          placeholder="Team name"
          aria-invalid={showError}
          aria-describedby={showError ? 'create-team-name-error' : undefined}
          onChange={e => onNameChange(e.target.value)}
          onBlur={() => setTouched(true)}
          className={`w-full rounded-[10px] border px-3 py-2.5 text-[14px] text-[#0a0a0a] outline-none transition-colors placeholder:text-neutral-400 ${
            showError ? 'border-red-400 focus:border-red-500' : 'border-neutral-200 focus:border-[#0a0a0a]'
          }`}
        />
        <div className="mt-1.5 flex items-start justify-between gap-3">
          <span id="create-team-name-error" className="text-[12px] leading-snug text-red-500">
            {showError ? `Your team name must be between ${NAME_MIN} and ${NAME_MAX} characters` : ''}
          </span>
          {/* 只在接近上限时露出计数,平时不占视觉 */}
          {trimmed.length > NAME_MAX - 10 && (
            <span className={`shrink-0 text-[12px] tabular-nums ${trimmed.length > NAME_MAX ? 'text-red-500' : 'text-neutral-400'}`}>
              {trimmed.length}/{NAME_MAX}
            </span>
          )}
        </div>

        {/* 金额、席位、周期都在卡片上说过了,这一步只要一个团队名 —— 付款细节交给 Stripe */}
        <div className="mt-6 flex justify-end">
          <div className="w-[140px]">
            <Button
              variant="dark"
              // 无效时只变淡、不锁死点击 —— 锁死的话用户点了没反应,永远看不到为什么不能继续
              className={valid && !leaving ? '' : 'opacity-40'}
              aria-disabled={!valid || leaving}
              onClick={e => {
                e.preventDefault();
                if (!leaving) submit();
              }}
            >
              {leaving ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
                  Redirecting
                </span>
              ) : (
                'Continue'
              )}
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}

/**
 * CTA + 弹窗状态打包 —— 对比表那一列用它,和卡片走同一个向导,
 * 避免同一页上出现两个文案一样、一个能点一个点不动的 Get <plan>。
 */
export function GetPlanButton({
  plan,
  cycle,
  seats,
  label,
  variant = 'dark',
}: {
  plan: SeatBusinessPlan;
  cycle: BillingCycle;
  seats?: number;
  label: string;
  variant?: 'dark' | 'accent' | 'secondary' | 'outline';
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={variant} onClick={e => { e.preventDefault(); setOpen(true); }}>
        {label}
      </Button>
      {open && (
        <CreateTeamModal
          plan={plan}
          cycle={cycle}
          seats={seats ?? plan.seats.default}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
