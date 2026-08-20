"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Check,
  CircleDollarSign,
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
  grossMargin,
  premiumOver,
  scaleEquivalent,
  SCALE_CREDITS_PER_SEAT,
  type EnterpriseTier,
  type EnterpriseTierId,
} from "./data";

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

export default function AdminPortalPage() {
  const [tierId, setTierId] = useState<EnterpriseTierId>("e2");
  const [org, setOrg] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [extraSeats, setExtraSeats] = useState(0);
  /** 额度可以在档位基准上谈 —— 合同额度与档位默认值不一定相等 */
  const [poolOverride, setPoolOverride] = useState<number | null>(null);
  const [pourOver, setPourOver] = useState(true);
  const [sso, setSso] = useState(false);
  const [auditLog, setAuditLog] = useState(false);
  const [created, setCreated] = useState<string | null>(null);

  const tier = ENTERPRISE_TIERS.find((item) => item.id === tierId)!;
  const seats = tier.seats + extraSeats;
  const pool = poolOverride ?? tier.poolCredits;
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
    return { equivalent, premium, margin, annual: monthly * 12 };
  }, [seats, monthly, pool]);

  /** 采购一定会算的那道题:同样的钱在 Scale 上能买到多少额度 */
  const underwater = pool < numbers.equivalent.credits;

  const canCreate = org.trim().length > 0 && ownerEmail.includes("@");

  return (
    <main className="min-h-dvh bg-[#f7f6f9] text-[#28222e]">
      <header className="border-b border-[#ececf1] bg-white">
        <div className="mx-auto flex max-w-[1180px] items-center gap-3 px-6 py-4">
          <Link
            href="/"
            className="grid size-9 place-items-center rounded-xl text-[#8a8490] transition hover:bg-[#f6f4f7] hover:text-[#28222e]"
            aria-label="Back to gallery"
          >
            <ArrowLeft className="size-[18px]" />
          </Link>
          <div className="min-w-0">
            <p className="text-[15px] font-bold tracking-[-0.01em]">Buzz Admin Portal</p>
            <p className="text-[12px] text-[#8a8490]">Internal · open an Enterprise organisation</p>
          </div>
          <span className="ml-auto rounded-full bg-[#efe9ff] px-2.5 py-1 text-[11px] font-bold text-[#7b5cf0]">
            Sales only
          </span>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1180px] gap-6 px-6 py-8 lg:grid-cols-[1fr_360px]">
        {/* ---------------- 左:开户表单 ---------------- */}
        <div className="space-y-6">
          <Section title="Organisation" icon={Building2}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Company name">
                <input
                  value={org}
                  onChange={(event) => setOrg(event.target.value)}
                  placeholder="Atlas Media Group"
                  className="h-11 w-full rounded-xl border border-[#ececf1] bg-white px-3.5 text-[14px] outline-none transition focus:border-[#7b5cf0] placeholder:text-[#b4aeb8]"
                />
              </Field>
              <Field label="Owner email" hint="Becomes the org owner and receives the invoice.">
                <input
                  value={ownerEmail}
                  onChange={(event) => setOwnerEmail(event.target.value)}
                  placeholder="cfo@atlasmedia.com"
                  className="h-11 w-full rounded-xl border border-[#ececf1] bg-white px-3.5 text-[14px] outline-none transition focus:border-[#7b5cf0] placeholder:text-[#b4aeb8]"
                />
              </Field>
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
                      active ? "border-[#7b5cf0] bg-[#f7f4ff]" : "border-[#ececf1] bg-white hover:border-[#ddd7df]"
                    }`}
                  >
                    <span
                      className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 ${
                        active ? "border-[#7b5cf0] bg-[#7b5cf0] text-white" : "border-[#d8d4dc]"
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
                    className="h-11 w-full rounded-xl border border-[#ececf1] bg-white px-3.5 text-[14px] tabular-nums outline-none transition focus:border-[#7b5cf0]"
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
                hint={tier.auditLog ? `Included from ${tier.name}.` : "Not included at this tier."}
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
            </dl>

            <p className="mt-4 flex items-start gap-2 rounded-xl bg-[#faf9fb] px-3 py-2.5 text-[11px] leading-[1.55] text-[#7b7480]">
              <ScrollText className="mt-0.5 size-3.5 shrink-0" />
              <span>
                Credits are issued to the organisation pool, not to seats. When procurement asks why an added seat only
                carries {formatNumber(SCALE_CREDITS_PER_SEAT)} on Scale but nothing of its own here — the pool is the
                product, seats only grant access.
              </span>
            </p>

            <button
              type="button"
              disabled={!canCreate}
              onClick={() => setCreated(org.trim())}
              className="mt-5 h-11 w-full rounded-xl bg-[#7b5cf0] text-[13px] font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-35"
            >
              Open organisation
            </button>
            {!canCreate && (
              <p className="mt-2 text-center text-[11px] text-[#9a94a0]">Company name and owner email are required.</p>
            )}
          </div>
        </aside>
      </div>

      {created && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#1a1a2e]/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[440px] rounded-[24px] border border-[#ececf1] bg-white p-6 text-center shadow-[0_30px_80px_rgba(26,26,46,0.28)]">
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-[#efe9ff]">
              <Check className="size-6 text-[#7b5cf0]" strokeWidth={3} />
            </span>
            <h2 className="mt-4 text-[18px] font-bold tracking-[-0.02em]">{created} is open</h2>
            <p className="mt-1.5 text-[13px] leading-[1.55] text-[#8a8490]">
              {ownerEmail} is the owner and has been emailed. The org starts on {tier.name} with{" "}
              {formatNumber(pool)} pooled credits and {seats} creator seats.
            </p>
            <button
              type="button"
              onClick={() => setCreated(null)}
              className="mt-5 h-11 w-full rounded-xl bg-[#24202a] text-[13px] font-bold text-white transition hover:bg-[#3b3442]"
            >
              Done
            </button>
          </div>
        </div>
      )}

      <p className="mx-auto max-w-[1180px] px-6 pb-10 text-[12px] text-[#9a94a0]">
        演示用途:纯前端 mock,不落库。三档数值取自 rate card v1.6 §8 校正版。
      </p>
    </main>
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
          className="grid size-9 place-items-center rounded-xl border border-[#ececf1] bg-white transition hover:border-[#7b5cf0] disabled:opacity-35"
        >
          <Minus className="size-4" />
        </button>
        <span className="w-10 text-center text-[15px] font-bold tabular-nums">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label={`More ${label}`}
          className="grid size-9 place-items-center rounded-xl border border-[#ececf1] bg-white transition hover:border-[#7b5cf0] disabled:opacity-35"
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
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? "bg-[#7b5cf0]" : "bg-[#d8d4dc]"}`}
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
