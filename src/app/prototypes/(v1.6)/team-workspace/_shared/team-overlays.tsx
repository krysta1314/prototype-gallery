"use client";

import { useEffect, useRef, useState } from "react";
import { Check, CheckCircle2, CreditCard, Loader2, Minus, Plus, X } from "lucide-react";
import { DEFAULT_TEAM_PLAN_ID, formatNumber, seatPriceOf, TEAM_PLANS, type BillingCycle, type PlanId } from "./data";
import { useTeam } from "./team-context";
import { TeamSettingsModal } from "./team-settings-modal";
import { AccountSettingsModal } from "./account-settings-modal";
import { RequestModal } from "./request-modal";
import { useDialog } from "./use-dialog";

/* ---------------- 建团队 = 购买 ---------------- */

/**
 * 团队购买向导 —— 建团队的唯一路径。
 *
 * 对齐 ChatGPT Team / Claude Team 的做法:**没有免费团队档**,「购买」这个动作
 * 本身就是「创建团队」这个动作。付款成功之前,团队不存在;付款成功之后,团队一诞生
 * 就是付费的、席位已就位、可以直接邀请人 —— 不需要任何 upgrade-to-invite 的引导。
 *
 * 四步:团队名 → 套餐 + 席位 → 付款 → 邀请(可跳过,因为用户来买就是为了这一步)。
 * 买单的人自动成为 Owner;付款方式挂在团队上,之后转让 Owner 也不会断供。
 */
const STEPS = ["Team name", "Subscription", "Payment", "Invite"] as const;

function CreateTeamModal() {
  const { createTeamOpen, setCreateTeamOpen, createTeam, inviteMembers, showToast } = useTeam();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [planId, setPlanId] = useState<PlanId>(DEFAULT_TEAM_PLAN_ID);
  /** 按席位计价 —— 席位数就是购买数量,受套餐区间约束（Team 2–9 / Scale 5–30） */
  const [seats, setSeats] = useState(TEAM_PLANS[0]!.seatsMin);
  /** 订阅页必须能选月付 / 年付 —— 否则从产品里买拿不到官网的年付价,客户一对比就会问 */
  const [cycle, setCycle] = useState<BillingCycle>("yearly");
  const [emails, setEmails] = useState("");
  /** 付款是后端动作,按钮要有 loading,避免连点买出两个团队 */
  const [paying, setPaying] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const plan = TEAM_PLANS.find((option) => option.id === planId) ?? TEAM_PLANS[0]!;
  const perSeat = seatPriceOf(plan, cycle);
  const monthly = perSeat * seats;
  /** 年付按整年一次收 */
  const annualTotal = monthly * 12;

  // 付款中不许关弹窗;第 4 步团队已经建好了,关掉即视为跳过邀请
  useDialog({ ref: panelRef, onClose: () => close(), active: createTeamOpen && !paying });

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  if (!createTeamOpen) return null;

  function close() {
    setCreateTeamOpen(false);
    setStep(0);
    setName("");
    setPlanId(DEFAULT_TEAM_PLAN_ID);
    setSeats(TEAM_PLANS[0]!.seatsMin);
    setCycle("yearly");
    setEmails("");
    setPaying(false);
  }

  /** 第 3 步:付款成功的那一刻团队才诞生 */
  const pay = () => {
    if (paying) return;
    setPaying(true);
    // 原型里用一个短延时代替真实扣款
    timer.current = setTimeout(() => {
      createTeam(name.trim(), plan.id, seats);
      setPaying(false);
      setStep(3);
    }, 1000);
  };

  const parsedEmails = emails
    .split(/[\s,;]+/)
    .map((value) => value.trim())
    .filter((value) => value.includes("@"));

  const sendInvites = () => {
    if (!parsedEmails.length) return;
    inviteMembers(parsedEmails, "member");
    close();
  };

  const heading = ["Create a team", `Subscribe ${name.trim() || "your team"}`, "Payment", `${name.trim()} is ready`][step]!;
  const sub = [
    "Teams are paid — you'll pick a plan and pay in the next steps.",
    "Every team needs its own subscription — your personal plan stays separate and is billed on its own.",
    "You'll become the owner. The payment method stays with the team.",
    "Invite your teammates — seats are already waiting for them.",
  ][step]!;

  return (
    <div className="fixed inset-x-0 bottom-0 top-[52px] z-[90] grid place-items-center bg-[#1a1a2e]/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Create a team">
      <div
        ref={panelRef}
        tabIndex={-1}
        className="max-h-full w-full max-w-[520px] overflow-y-auto rounded-[24px] border border-[#ececf1] bg-white p-6 shadow-[0_30px_80px_rgba(26,26,46,0.28)] outline-none"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[18px] font-bold tracking-[-0.02em] text-[#28222e]">{heading}</h2>
            <p className="mt-1 text-[13px] leading-[1.5] text-[#8a8490]">{sub}</p>
          </div>
          <button
            type="button"
            onClick={close}
            disabled={paying}
            aria-label="Close"
            className="grid size-9 shrink-0 place-items-center rounded-xl text-[#8a8490] transition hover:bg-[#f6f4f7] hover:text-[#28222e] disabled:pointer-events-none disabled:opacity-40"
          >
            <X className="size-[18px]" />
          </button>
        </div>

        {/* 步骤指示 —— 让用户知道「付款」在第几步,不会以为填个名字就建好了 */}
        <ol className="mt-5 flex items-center gap-1.5" aria-label="Progress">
          {STEPS.map((label, index) => (
            <li key={label} className="flex flex-1 flex-col gap-1.5">
              <span
                aria-hidden
                className={`h-1 rounded-full transition ${index <= step ? "bg-gradient-to-r from-[#FFA73C] to-[#FF5255]" : "bg-[#f1eff3]"}`}
              />
              <span className={`text-[11px] font-bold ${index <= step ? "text-[#b23a1c]" : "text-[#a9a3af]"}`}>{label}</span>
            </li>
          ))}
        </ol>

        {step === 0 && (
          <label className="mt-5 block">
            <span className="text-[13px] font-semibold text-[#3b3442]">Team name</span>
            <input
              value={name}
              autoFocus
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && name.trim()) setStep(1);
              }}
              placeholder="Add a name"
              className="mt-2 h-11 w-full rounded-xl border border-[#ececf1] bg-white px-3.5 text-[14px] text-[#28222e] outline-none transition focus:border-[#ff5e1a] placeholder:text-[#9a9bb0]"
            />
          </label>
        )}

        {step === 1 && (
          <>
            {/* 计费切换 —— 与定价页同口径:月付即定价,年付统一 30% off */}
            <div className="mt-5 flex items-center justify-center gap-1 rounded-xl bg-[#f6f4f7] p-1">
              {(["monthly", "yearly"] as BillingCycle[]).map((option) => {
                const on = cycle === option;
                return (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setCycle(option)}
                    className={`flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg text-[13px] font-bold transition ${
                      on ? "bg-white text-[#28222e] shadow-sm" : "text-[#7b7480] hover:text-[#3b3442]"
                    }`}
                  >
                    {option === "monthly" ? "Monthly" : "Annual"}
                    {option === "yearly" && (
                      <span className="rounded-full bg-[#e6f7f0] px-1.5 py-0.5 text-[10px] font-extrabold text-[#0f7a5a]">
                        30% OFF
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 grid gap-2.5">
              {TEAM_PLANS.map((option) => {
                const active = option.id === planId;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setPlanId(option.id);
                      // 换档要把席位数夹回新档的区间
                      setSeats((n) => Math.min(option.seatsMax, Math.max(option.seatsMin, n)));
                    }}
                    className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
                      active ? "border-[#ff5e1a] bg-[#fff8f4]" : "border-[#ececf1] bg-white hover:border-[#ddd7df]"
                    }`}
                  >
                    <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 ${active ? "border-[#ff5e1a] bg-[#ff5e1a] text-white" : "border-[#d8d4dc]"}`}>
                      {active && <Check className="size-3" strokeWidth={3} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline gap-2">
                        <span className="text-[15px] font-bold text-[#28222e]">{option.name}</span>
                        <span className="text-[13px] font-semibold text-[#7b7480]">
                          {cycle === "yearly" && (
                            <span className="mr-1 text-[#b4aeb8] line-through">${option.priceValue}</span>
                          )}
                          ${seatPriceOf(option, cycle)}/seat / mo
                        </span>
                      </span>
                      <span className="mt-1 block text-[12px] text-[#8a8490]">{option.blurb}</span>
                      <span className="mt-2 block text-[12px] font-semibold text-[#56505c]">
                        {option.seatsMin}–{option.seatsMax} seats · {formatNumber(option.creditsPerSeat)} credits per seat / month
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#ececf1] bg-[#faf9fb] p-4">
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-[#28222e]">Seats</p>
                <p className="mt-0.5 text-[12px] text-[#8a8490]">
                  ${perSeat}/seat per month · {plan.seatsMin}–{plan.seatsMax} on {plan.name}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSeats((n) => Math.max(plan.seatsMin, n - 1))}
                  disabled={seats <= plan.seatsMin}
                  aria-label="Fewer seats"
                  className="grid size-9 place-items-center rounded-xl border border-[#ececf1] text-[#3b3442] transition hover:border-[#ff5e1a] disabled:opacity-35"
                >
                  <Minus className="size-4" />
                </button>
                <span className="w-12 text-center text-[15px] font-bold tabular-nums text-[#28222e]">{seats}</span>
                <button
                  type="button"
                  onClick={() => setSeats((n) => Math.min(plan.seatsMax, n + 1))}
                  disabled={seats >= plan.seatsMax}
                  aria-label="More seats"
                  className="grid size-9 place-items-center rounded-xl border border-[#ececf1] text-[#3b3442] transition hover:border-[#ff5e1a] disabled:opacity-35"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="mt-5 rounded-2xl border border-[#ececf1] bg-[#faf9fb] p-4">
              {[
                [`${plan.name} plan`, `$${perSeat}/seat / mo`],
                [`${seats} seats`, `$${monthly}/mo`],
                [`${formatNumber(plan.creditsPerSeat)} credits per seat / month`, "Fixed per seat"],
                [cycle === "yearly" ? "Billed annually" : "Billed monthly", cycle === "yearly" ? `$${annualTotal}/yr` : `$${monthly}/mo`],
              ].map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between gap-3 py-1.5 text-[13px]">
                  <span className="text-[#56505c]">{label}</span>
                  <span className="font-semibold text-[#28222e]">{value}</span>
                </div>
              ))}
              <div className="mt-2 flex items-baseline justify-between gap-3 border-t border-[#ececf1] pt-3">
                <span className="text-[13px] font-bold text-[#28222e]">Due today</span>
                <span className="text-[18px] font-extrabold tabular-nums tracking-[-0.02em] text-[#28222e]">
                  ${cycle === "yearly" ? annualTotal : monthly}
                </span>
              </div>
            </div>
            <p className="mt-3 flex items-start gap-2 rounded-xl border border-[#ffd9c6] bg-[#fff7f2] px-4 py-3 text-[12.5px] leading-[1.55] text-[#8a4b2a]">
              <CreditCard className="mt-0.5 size-4 shrink-0" />
              <span>
                Your personal space keeps its own plan and is billed separately. Card entry isn&apos;t wired up in this prototype.
              </span>
            </p>
          </>
        )}

        {step === 3 && (
          <label className="mt-5 block">
            <span className="text-[13px] font-semibold text-[#3b3442]">Invite by email</span>
            <textarea
              value={emails}
              autoFocus
              rows={3}
              onChange={(event) => setEmails(event.target.value)}
              placeholder="name@company.com, name@company.com"
              className="mt-2 w-full resize-none rounded-xl border border-[#ececf1] bg-white px-3.5 py-3 text-[14px] leading-[1.6] text-[#28222e] outline-none transition focus:border-[#ff5e1a] placeholder:text-[#9a9bb0]"
            />
            <span className="mt-2 block text-[12px] text-[#8a8490]">
              {parsedEmails.length
                ? `${parsedEmails.length} of ${seats - 1} open seats · everyone joins as a member`
                : `${seats - 1} seats are open besides yours · you can change roles later`}
            </span>
          </label>
        )}

        <div className="mt-5 flex justify-end gap-2.5">
          {step === 3 ? (
            <>
              <button type="button" onClick={close} className="h-11 rounded-xl px-4 text-[13px] font-semibold text-[#8a8490] transition hover:text-[#56505c]">
                Skip for now
              </button>
              <button
                type="button"
                disabled={!parsedEmails.length}
                onClick={sendInvites}
                className="h-11 rounded-xl bg-[#24202a] px-5 text-[13px] font-bold text-white transition hover:bg-[#3b3442] disabled:cursor-not-allowed disabled:opacity-35"
              >
                Send invitations
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => (step === 0 ? close() : setStep((n) => n - 1))}
                disabled={paying}
                className="h-11 rounded-xl px-4 text-[13px] font-semibold text-[#8a8490] transition hover:text-[#56505c] disabled:pointer-events-none disabled:opacity-40"
              >
                {step === 0 ? "Cancel" : "Back"}
              </button>
              <button
                type="button"
                disabled={(step === 0 && !name.trim()) || paying}
                aria-busy={paying}
                onClick={() => (step === 2 ? pay() : setStep((n) => n + 1))}
                className="flex h-11 items-center gap-2 rounded-xl bg-[#24202a] px-5 text-[13px] font-bold text-white transition hover:bg-[#3b3442] disabled:cursor-not-allowed disabled:hover:bg-[#24202a] disabled:opacity-35"
              >
                {paying && <Loader2 className="size-4 shrink-0 animate-spin motion-reduce:animate-none" />}
                {step === 2
                  ? paying
                    ? "Processing…"
                    : `Pay $${cycle === "yearly" ? annualTotal : monthly} and create team`
                  : "Continue"}
              </button>
            </>
          )}
        </div>

        {step !== 3 && (
          <p className="mt-3 text-center text-[12px] text-[#a9a3af]">
            {step === 2 ? "You become the owner. Cancel any time." : `Your team is created after payment · $${monthly}/mo`}
          </p>
        )}
      </div>
    </div>
  );
}

function TeamToast() {
  const { toast, toastTone } = useTeam();
  if (!toast) return null;
  const success = toastTone === "success";
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[100] -translate-x-1/2" role="status" aria-live="polite">
      <div
        className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold shadow-[0_14px_36px_rgba(26,26,46,0.32)] ${
          success ? "bg-[#0f7a5a] text-white" : "bg-[#24202a] text-white"
        }`}
      >
        {success && <CheckCircle2 className="size-4 shrink-0" />}
        {toast}
      </div>
    </div>
  );
}

/** 每个页面挂一次:设置弹窗 + 创建团队弹窗 + toast */
export function TeamOverlays() {
  return (
    <>
      <TeamSettingsModal />
      <AccountSettingsModal />
      <CreateTeamModal />
      <RequestModal />
      <TeamToast />
    </>
  );
}
