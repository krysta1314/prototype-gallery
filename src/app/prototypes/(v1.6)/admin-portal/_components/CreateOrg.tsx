"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  Check,
  CircleDollarSign,
  Hourglass,
  FileCheck2,
  Info,
  KeyRound,
  Minus,
  Plus,
  ScrollText,
  Users,
} from "lucide-react";
import {
  ENTERPRISE_TIERS,
  formatNumber,
  EXTRA_SEAT_CREDITS,
  marginAfterSales,
  PAYMENT_TERMS_LABEL,
  type PaymentTerms,
  grossMargin,
  premiumOver,
  scaleEquivalent,
  SCALE_CREDITS_PER_SEAT,
  type EnterpriseTier,
  type EnterpriseTierId,
} from "../data";
import { useAdmin } from "./store";

/* ------------------------------------------------------------------ *
 * Admin Portal —— sales 给企业客户开户。
 *
 * Enterprise 不走自助购买,定价页上只有 Contact Sales,所以「一个 Enterprise
 * 组织是怎么诞生的」在原型里一直是空的。这一页补上那一步。
 *
 * 关键设计:每改一个数,右侧的「对客口径」面板立刻重算溢价与毛利。
 * 因为这份提案最容易被采购拆穿的就是「付更多钱拿更少额度」——
 * sales 在开户时就得看见这个数,而不是等客户拉表算出来。
 * ------------------------------------------------------------------ */

const INK = "#1a1a2e";

export function CreateOrg({ onDone, onOpen }: { onDone: () => void; onOpen: (id: string) => void }) {
  const [tierId, setTierId] = useState<EnterpriseTierId>("e2");
  const [org, setOrg] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [extraSeats, setExtraSeats] = useState(0);
  /** 额度可以在档位基准上谈 —— 合同额度与档位默认值不一定相等 */
  const [poolOverride, setPoolOverride] = useState<number | null>(null);
  const [pourOver, setPourOver] = useState(true);
  const [sso, setSso] = useState(false);
  const [auditLog, setAuditLog] = useState(false);
  /** 合同条款 —— 企业单不是「点一下就开通」,签约、账期、期限、续约都要在开户时定下来 */
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>("invoice_30");
  const [poNumber, setPoNumber] = useState("");
  const [termMonths, setTermMonths] = useState(12);
  const [autoRenew, setAutoRenew] = useState(true);
  const [created, setCreated] = useState<{ id: string; name: string } | null>(null);
  const { createOrg } = useAdmin();

  const tier = ENTERPRISE_TIERS.find((item) => item.id === tierId)!;
  const seats = tier.seats + extraSeats;
  /*
   * 加购席位会把池撑大 —— rate card 第 10 行:每个加购席位含额度 2,000/月。
   * 额度仍然不挂在这个人头上(进的是共享池),但池随人数增长。
   * 之前这里只取档位基准,加席位对池毫无影响,和 rate card 不一致。
   */
  const basePool = tier.poolCredits + extraSeats * EXTRA_SEAT_CREDITS;
  const pool = poolOverride ?? basePool;
  const monthly = tier.monthlyPrice + extraSeats * tier.extraSeatPrice;

  const pick = (next: EnterpriseTier) => {
    setTierId(next.id);
    setExtraSeats(0);
    setPoolOverride(null);
    setSso(next.sso);
    setAuditLog(next.auditLog);
  };

  const numbers = useMemo(() => {
    const equivalent = scaleEquivalent(seats);
    const premium = (monthly - equivalent.price) / equivalent.price;
    const margin = grossMargin({ monthlyPrice: monthly, poolCredits: pool });
    const afterSales = marginAfterSales({ monthlyPrice: monthly, poolCredits: pool });
    return { equivalent, premium, margin, marginAfterSales: afterSales, annual: monthly * 12 };
  }, [seats, monthly, pool]);

  /** 采购一定会算的那道题:同样的钱在 Scale 上能买到多少额度 */
  const underwater = pool < numbers.equivalent.credits;

  const canCreate = org.trim().length > 0 && ownerEmail.includes("@");

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* ---------------- 左:开户表单 ---------------- */}
        <div className="space-y-6">
          <Section title="Organisation" icon={Building2}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Company name">
                <input
                  value={org}
                  onChange={(event) => setOrg(event.target.value)}
                  placeholder="Atlas Media Group"
                  className="h-11 w-full rounded-xl border border-[#ececf1] bg-white px-3.5 text-[14px] outline-none transition focus:border-[#ff5e1a] placeholder:text-[#b4aeb8]"
                />
              </Field>
              <Field label="Owner email" hint="Becomes the org owner and receives the invoice.">
                <input
                  value={ownerEmail}
                  onChange={(event) => setOwnerEmail(event.target.value)}
                  placeholder="cfo@atlasmedia.com"
                  className="h-11 w-full rounded-xl border border-[#ececf1] bg-white px-3.5 text-[14px] outline-none transition focus:border-[#ff5e1a] placeholder:text-[#b4aeb8]"
                />
              </Field>
            </div>
          </Section>

          <Section title="Contract" icon={FileCheck2}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Payment terms" hint="Enterprise deals settle by transfer; card is the exception.">
                <select
                  value={paymentTerms}
                  onChange={(event) => setPaymentTerms(event.target.value as PaymentTerms)}
                  className="h-11 w-full rounded-xl border border-[#ececf1] bg-white px-3 text-[14px] font-semibold outline-none transition focus:border-[#ff5e1a]"
                >
                  {(Object.keys(PAYMENT_TERMS_LABEL) as PaymentTerms[]).map((key) => (
                    <option key={key} value={key}>
                      {PAYMENT_TERMS_LABEL[key]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="PO number" hint="Optional — their procurement reference, printed on the invoice.">
                <input
                  value={poNumber}
                  onChange={(event) => setPoNumber(event.target.value)}
                  placeholder="PO-20260042"
                  className="h-11 w-full rounded-xl border border-[#ececf1] bg-white px-3.5 text-[14px] outline-none transition focus:border-[#ff5e1a] placeholder:text-[#b4aeb8]"
                />
              </Field>
              <Field label="Term" hint="Longer terms are where the discount goes.">
                <select
                  value={termMonths}
                  onChange={(event) => setTermMonths(Number(event.target.value))}
                  className="h-11 w-full rounded-xl border border-[#ececf1] bg-white px-3 text-[14px] font-semibold outline-none transition focus:border-[#ff5e1a]"
                >
                  {[12, 24, 36].map((months) => (
                    <option key={months} value={months}>
                      {months} months
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="mt-4">
              <Toggle
                label="Auto-renew at the end of the term"
                hint="Off means the org lapses to Free on the expiry date — the work stays, the monthly pool stops."
                on={autoRenew}
                onChange={setAutoRenew}
              />
            </div>
          </Section>

          <Section title="Tier" icon={CircleDollarSign}>
            <div className="grid gap-2.5">
              {ENTERPRISE_TIERS.map((option) => {
                const active = option.id === tierId;
                const equivalent = scaleEquivalent(option.seats);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => pick(option)}
                    className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
                      active ? "border-[#ff5e1a] bg-[#fff7f1]" : "border-[#ececf1] bg-white hover:border-[#ddd7df]"
                    }`}
                  >
                    <span
                      className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 ${
                        active ? "border-[#ff5e1a] bg-[#ff5e1a] text-white" : "border-[#d8d4dc]"
                      }`}
                    >
                      {active && <Check className="size-3" strokeWidth={3} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline gap-2">
                        <span className="text-[15px] font-bold">{option.name}</span>
                        <span className="text-[13px] font-semibold text-[#7b7480]">
                          ${formatNumber(option.monthlyPrice)}/mo · annual
                        </span>
                      </span>
                      <span className="mt-1 block text-[12px] text-[#8a8490]">{option.blurb}</span>
                      <span className="mt-2 block text-[12px] font-semibold text-[#56505c]">
                        {option.seats} creator seats · {formatNumber(option.poolCredits)} credits / month pooled
                      </span>
                      <span className="mt-1 block text-[11px] text-[#9a94a0]">
                        Same seat count on Scale: ${formatNumber(equivalent.price)}/mo ·{" "}
                        {formatNumber(equivalent.credits)} credits → +{Math.round(premiumOver(option) * 100)}% premium
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </Section>

          <Section title="Seats and pool" icon={Users}>
            <div className="space-y-4">
              <Stepper
                label="Extra creator seats"
                hint={
                  tier.extraSeatCap === null
                    ? `$${tier.extraSeatPrice}/seat per month · no cap on ${tier.name}`
                    : `$${tier.extraSeatPrice}/seat per month · up to +${tier.extraSeatCap} before moving up a tier`
                }
                value={extraSeats}
                min={0}
                max={tier.extraSeatCap ?? 999}
                onChange={setExtraSeats}
              />

              <Field
                label="Monthly pool credits"
                hint="Contract figure. Wording must read “up to X credits/month”, unused credits expire — they do not roll over."
              >
                <div className="flex items-center gap-2">
                  <input
                    value={formatNumber(pool)}
                    onChange={(event) => {
                      const digits = Number(event.target.value.replace(/[^\d]/g, ""));
                      setPoolOverride(Number.isFinite(digits) ? digits : 0);
                    }}
                    className="h-11 w-full rounded-xl border border-[#ececf1] bg-white px-3.5 text-[14px] tabular-nums outline-none transition focus:border-[#ff5e1a]"
                  />
                  {poolOverride !== null && poolOverride !== tier.poolCredits && (
                    <button
                      type="button"
                      onClick={() => setPoolOverride(null)}
                      className="h-11 shrink-0 rounded-xl border border-[#ececf1] px-3 text-[12px] font-bold text-[#7b7480] transition hover:border-[#ddd7df]"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </Field>

              {/* 采购必问的那道题,在开户时就摆出来 */}
              {underwater && (
                <p className="flex items-start gap-2 rounded-xl border border-[#f2d5cd] bg-[#fff5f1] px-3.5 py-3 text-[12px] font-semibold leading-[1.55] text-[#b23a1c]">
                  <Info className="mt-0.5 size-4 shrink-0" />
                  <span>
                    {seats} seats on Scale would include {formatNumber(numbers.equivalent.credits)} credits for $
                    {formatNumber(numbers.equivalent.price)}/mo. This contract is ${formatNumber(monthly)}/mo for{" "}
                    {formatNumber(pool)} — procurement will find this. Raise the pool to at least the Scale equivalent, or
                    be ready to justify it on governance alone.
                  </span>
                </p>
              )}

              <Toggle
                label="Pour-over"
                hint="Credits a member doesn't spend return to the pool at the end of the cycle instead of expiring with them."
                on={pourOver}
                onChange={setPourOver}
              />
            </div>
          </Section>

          <Section title="Governance" icon={KeyRound}>
            <div className="space-y-3">
              <Toggle
                label="SSO / SAML"
                hint={tier.sso ? `Included from ${tier.name}.` : "Not included at this tier — enabling it is a negotiated exception."}
                on={sso}
                onChange={setSso}
              />
              <Toggle
                label="Audit log export"
                hint={
                  tier.auditLog
                    ? `Included from ${tier.name}. Every plan can read the log in-app — this is the machine-readable export.`
                    : "Every plan can read the audit log in-app; downloadable export starts at E2."
                }
                on={auditLog}
                onChange={setAuditLog}
              />
              <div className="flex items-start gap-2 rounded-xl bg-[#faf9fb] px-3.5 py-3 text-[12px] leading-[1.55] text-[#7b7480]">
                <FileCheck2 className="mt-0.5 size-4 shrink-0 text-[#8a8490]" />
                <span>
                  IP indemnity and a security review come with E3 only. Review seats are free and unlimited on every
                  Enterprise tier — they use no creator seat.
                </span>
              </div>
            </div>
          </Section>
        </div>

        {/* ---------------- 右:对客口径,常驻 ---------------- */}
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <div className="rounded-2xl border border-[#ececf1] bg-white p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#a8a2ae]">Contract summary</p>
            <p className="mt-2 text-[22px] font-extrabold tracking-[-0.02em]" style={{ color: INK }}>
              ${formatNumber(monthly)}
              <span className="ml-1 text-[13px] font-semibold text-[#8a8490]">/mo · billed annually</span>
            </p>
            <p className="mt-0.5 text-[12px] text-[#8a8490]">${formatNumber(numbers.annual)} per year</p>

            <dl className="mt-4 space-y-2.5 border-t border-[#f0eef2] pt-4 text-[12.5px]">
              <Row k="Tier" v={tier.name} />
              <Row k="Creator seats" v={`${seats}${extraSeats ? ` (${tier.seats} + ${extraSeats})` : ""}`} />
              <Row k="Monthly pool" v={`${formatNumber(pool)} credits`} />
              <Row k="Per seat equivalent" v={`${formatNumber(Math.round(pool / Math.max(1, seats)))} credits`} />
              <Row k="Pour-over" v={pourOver ? "On" : "Off"} />
              <Row k="SSO / SAML" v={sso ? "Included" : "—"} />
              <Row k="Audit log" v={auditLog ? "Included" : "—"} />
            </dl>

            <dl className="mt-4 space-y-2.5 border-t border-[#f0eef2] pt-4 text-[12.5px]">
              <Row
                k="Premium over Scale"
                v={`${numbers.premium >= 0 ? "+" : ""}${Math.round(numbers.premium * 100)}%`}
                tone={numbers.premium < 0.2 ? "warn" : "ok"}
              />
              <Row k="Gross margin" v={`${(numbers.margin * 100).toFixed(1)}%`} tone={numbers.margin < 0.6 ? "warn" : "ok"} />
              {/*
                * 减直销后才是谈折扣时该看的数 —— 只看 72% 容易给过头。
                * 口径:收入的 15%(rate card 三档都正好是毛利率减 15 个百分点)。
                */}
              <Row
                k="After direct sales"
                v={`${(numbers.marginAfterSales * 100).toFixed(1)}%`}
                tone={numbers.marginAfterSales < 0.45 ? "warn" : "ok"}
              />
            </dl>

            <p className="mt-4 flex items-start gap-2 rounded-xl bg-[#faf9fb] px-3 py-2.5 text-[11px] leading-[1.55] text-[#7b7480]">
              <ScrollText className="mt-0.5 size-3.5 shrink-0" />
              <span>
                Credits go to the organisation pool, never to a named person — so nobody&apos;s allowance is stranded when
                they leave. Each added seat still grows the pool by {formatNumber(EXTRA_SEAT_CREDITS)} credits a month;
                it just doesn&apos;t carry its own private balance the way a {formatNumber(SCALE_CREDITS_PER_SEAT)}-credit
                Scale seat does.
              </span>
            </p>

            <button
              type="button"
              disabled={!canCreate}
              onClick={() => {
                const name = org.trim();
                const id = createOrg({
                  name,
                  ownerEmail: ownerEmail.trim(),
                  seats,
                  credits: pool,
                  mrr: monthly,
                  tierName: tier.name,
                  paymentTerms,
                  poNumber: poNumber.trim(),
                  termMonths,
                  autoRenew,
                });
                setCreated({ id, name });
              }}
              className="mt-5 h-11 w-full rounded-xl bg-[#ff5e1a] text-[13px] font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-35"
            >
              Open organisation
            </button>
            {!canCreate && (
              <p className="mt-2 text-center text-[11px] text-[#9a94a0]">Company name and owner email are required.</p>
            )}
          </div>
        </aside>
      </div>

      {/*
        * 开户不等于开通 —— 这一屏最重要的事就是把这句话说清楚。
        * 之前它写的是「is open」,sales 看完就走,客户那边登不进来。
        */}
      {created && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#1a1a2e]/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[520px] rounded-[24px] border border-[#ececf1] bg-white p-6 shadow-[0_30px_80px_rgba(26,26,46,0.28)]">
            <span className="grid size-12 place-items-center rounded-full bg-[#fff3ec]">
              <Hourglass className="size-6 text-[#b06a1c]" strokeWidth={2.5} />
            </span>
            <h2 className="mt-4 text-[18px] font-bold tracking-[-0.02em]">
              {created.name} is created — waiting on payment
            </h2>
            <p className="mt-1.5 text-[13px] leading-[1.6] text-[#8a8490]">
              The contract is recorded and the invoice goes to {ownerEmail} on {PAYMENT_TERMS_LABEL[paymentTerms]}. The
              org is <span className="font-semibold text-[#3b3442]">not usable yet</span>: {ownerEmail} cannot sign in
              and there is no subscription until finance confirms the money landed.
            </p>

            <ol className="mt-4 space-y-2.5">
              {[
                { done: true, text: `Contract recorded — ${tier.name}, ${seats} seats, ${formatNumber(pool)} pooled credits` },
                { done: false, text: "Finance confirms payment — you mark it here, in Awaiting payment" },
                { done: false, text: `${ownerEmail} gets the activation email and can sign in to Buzz` },
                { done: false, text: "Their subscription shows Enterprise — they can invite members and allocate credits" },
              ].map((step, index) => (
                <li key={index} className="flex items-start gap-2.5">
                  <span
                    className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-bold ${
                      step.done ? "bg-[#e7f5ee] text-[#12734f]" : "bg-[#f1eff3] text-[#9a94a0]"
                    }`}
                  >
                    {step.done ? <Check className="size-3" strokeWidth={3} /> : index + 1}
                  </span>
                  <span className={`text-[12.5px] leading-[1.5] ${step.done ? "text-[#3b3442]" : "text-[#8a8490]"}`}>
                    {step.text}
                  </span>
                </li>
              ))}
            </ol>

            <div className="mt-5 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => {
                  const id = created.id;
                  setCreated(null);
                  onOpen(id);
                }}
                className="h-11 flex-1 rounded-xl bg-[#ff5e1a] px-4 text-[13px] font-bold text-white transition hover:brightness-110"
              >
                Open {created.name}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreated(null);
                  onDone();
                }}
                className="h-11 rounded-xl border border-[#ececf1] px-4 text-[13px] font-bold text-[#3b3442] transition hover:bg-[#faf9fb]"
              >
                All organisations
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}

/* ---------------- 小组件 ---------------- */

function Section({ title, icon: Icon, children }: { title: string; icon: typeof Users; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#ececf1] bg-white p-5">
      <h2 className="flex items-center gap-2 text-[15px] font-bold">
        <Icon className="size-4 text-[#8a8490]" />
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[13px] font-semibold text-[#3b3442]">{label}</span>
      <div className="mt-2">{children}</div>
      {hint && <span className="mt-1.5 block text-[11px] leading-snug text-[#9a94a0]">{hint}</span>}
    </label>
  );
}

function Stepper({
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#ececf1] bg-[#faf9fb] p-3.5">
      <div className="min-w-0">
        <p className="text-[13px] font-bold">{label}</p>
        <p className="mt-0.5 text-[11.5px] text-[#7b7480]">{hint}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={`Fewer ${label}`}
          className="grid size-9 place-items-center rounded-xl border border-[#ececf1] bg-white transition hover:border-[#ff5e1a] disabled:opacity-35"
        >
          <Minus className="size-4" />
        </button>
        <span className="w-10 text-center text-[15px] font-bold tabular-nums">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label={`More ${label}`}
          className="grid size-9 place-items-center rounded-xl border border-[#ececf1] bg-white transition hover:border-[#ff5e1a] disabled:opacity-35"
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}

function Toggle({
  label,
  hint,
  on,
  onChange,
}: {
  label: string;
  hint: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#ececf1] bg-[#faf9fb] px-3.5 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-bold">{label}</p>
        <p className="mt-0.5 text-[11.5px] leading-snug text-[#7b7480]">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={() => onChange(!on)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? "bg-[#ff5e1a]" : "bg-[#d8d4dc]"}`}
      >
        <span
          aria-hidden
          className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`}
        />
      </button>
    </div>
  );
}

function Row({ k, v, tone }: { k: string; v: string; tone?: "ok" | "warn" }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-[#7b7480]">{k}</dt>
      <dd className={`font-bold tabular-nums ${tone === "warn" ? "text-[#c9432a]" : "text-[#28222e]"}`}>{v}</dd>
    </div>
  );
}
