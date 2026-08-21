"use client";

import { useState } from "react";
import { ArrowLeft, Check, Download, Hourglass, Mail, Plus, RefreshCw, ScrollText } from "lucide-react";
import {
  COST_PER_CREDIT,
  formatNumber,
  LAPSE_POLICY,
  money,
  PAYMENT_TERMS_LABEL,
  PROVISION_LABEL,
  RENEWAL_REMINDERS,
  reminderState,
  daysLeftOf,
  SALES_REPS,
  scaleEquivalent,
  STATUS_LABEL,
  STATUS_TONE,
  type AdminOrg,
} from "../data";
import { useAdmin, STAFF_ROLE_LABEL, type OrgMember } from "./store";

/**
 * 单个组织的管理页 —— 开户之后 sales 与 CS 每天用的地方。
 *
 * 四个 tab 对应四件真实工作:
 *   Overview  合同现状与续约(到期日是 sales 最关心的字段)
 *   Billing   发票、付款方式、合同变更
 *   Members   替客户邀请人、看谁在用
 *   Report    给客户的月度用量报告,也是续约谈判的材料
 */

type Tab = "overview" | "contract" | "billing" | "members" | "report";

const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "contract", label: "Contract" },
  { key: "billing", label: "Billing" },
  { key: "members", label: "Members" },
  { key: "report", label: "Report" },
];

export function OrgDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const [tab, setTab] = useState<Tab>("overview");
  const { orgs } = useAdmin();
  const org = orgs.find((item) => item.id === id) ?? orgs[0]!;
  const tone = STATUS_TONE[org.status];

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-[13px] font-bold text-[#7b7480] transition hover:text-[#28222e]"
      >
        <ArrowLeft className="size-4" /> All organisations
      </button>

      <div className="rounded-2xl border border-[#ececf1] bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[22px] font-extrabold tracking-[-0.02em] text-[#28222e]">{org.name}</h1>
              <span
                className="rounded-md px-2 py-0.5 text-[11px] font-bold"
                style={{ background: tone.bg, color: tone.fg }}
              >
                {STATUS_LABEL[org.status]}
              </span>
              <span className="rounded-md bg-[#fff3ec] px-2 py-0.5 text-[11px] font-bold text-[#ff5e1a]">
                {org.plan}
              </span>
            </div>
            <p className="mt-1 text-[13px] text-[#8a8490]">
              {org.ownerEmail} · opened {org.createdAt}
              {org.sales ? ` · ${org.sales}` : " · self-serve, no sales owner"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Btn>
              <Mail className="size-3.5" /> Email owner
            </Btn>
            {org.plan !== "Free" && (
              <Btn primary>
                <RefreshCw className="size-3.5" /> Renew contract
              </Btn>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1 border-t border-[#f0eef2] pt-4">
          {TABS.map((item) => {
            const on = tab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                aria-pressed={on}
                className={`h-8 rounded-lg px-3 text-[12.5px] font-bold transition ${
                  on ? "bg-[#24202a] text-white" : "text-[#706a78] hover:bg-[#f6f4f7]"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 待收款横幅顶在所有 tab 上面 —— 不管点到哪一页都要先看到「这单还没开通」 */}
      {org.provision === "awaiting_payment" && <ProvisioningBanner org={org} />}
      {org.provision === "lapsed" && <LapsedBanner org={org} />}

      {tab === "overview" && <Overview org={org} />}
      {tab === "contract" && <Contract org={org} />}
      {tab === "billing" && <Billing org={org} />}
      {tab === "members" && <Members org={org} />}
      {tab === "report" && <Report org={org} />}
    </div>
  );
}

/* ---------------- Overview ---------------- */

/* ---------------- 开通进度 ---------------- */

/**
 * 待收款横幅 —— 开户流程里最容易掉单的一环,所以做成整页最显眼的东西。
 *
 * 它同时回答两个问题:客户现在能干什么(答案是什么都干不了),
 * 以及我点下去会发生什么。第二个尤其重要 —— 「确认收款」是不可逆的开通动作,
 * 点之前就该知道它会给客户发激活邮件。
 */
function ProvisioningBanner({ org }: { org: AdminOrg }) {
  const { confirmPayment, approvalOf, staffRole, staffName } = useAdmin();
  const [confirming, setConfirming] = useState(false);
  const approval = approvalOf(org.id);
  const mine = approval[staffRole];
  const other = staffRole === "sales" ? approval.finance : approval.sales;
  const otherRoleLabel = STAFF_ROLE_LABEL[staffRole === "sales" ? "finance" : "sales"];

  return (
    <section className="rounded-2xl border border-[#f5ddc0] bg-[#fffdf8] p-5">
      <p className="flex items-center gap-2 text-[14px] font-bold text-[#8f5514]">
        <Hourglass className="size-4" />
        Signed, not paid — this org is not usable yet
      </p>
      <p className="mt-1.5 max-w-[80ch] text-[12.5px] leading-[1.6] text-[#8a7455]">
        {org.ownerEmail} cannot sign in and {org.name} has no subscription, so nobody can create. Invoice terms are{" "}
        {PAYMENT_TERMS_LABEL[org.paymentTerms ?? "invoice_30"]}
        {org.poNumber ? ` against ${org.poNumber}` : ""}. Confirm payment only once finance has seen the money land.
      </p>

      {/*
        * 双签进度 —— sales 自己开单又自己确认收款,等于自己签自己的收款单,审计上过不去。
        * 所以两边各签一次,谁签了、还差谁,直接摆在这里。
        */}
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {(["sales", "finance"] as const).map((role) => {
          const signer = approval[role];
          return (
            <div
              key={role}
              className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 ${
                signer ? "border-[#cfe8dc] bg-[#f5fbf8]" : "border-[#ececf1] bg-white"
              }`}
            >
              <span
                className={`grid size-5 shrink-0 place-items-center rounded-full ${
                  signer ? "bg-[#12734f] text-white" : "bg-[#f1eff3] text-[#9a94a0]"
                }`}
              >
                {signer ? <Check className="size-3" strokeWidth={3} /> : <Hourglass className="size-3" />}
              </span>
              <div className="min-w-0">
                <p className="text-[12.5px] font-bold text-[#28222e]">{STAFF_ROLE_LABEL[role]} sign-off</p>
                <p className="truncate text-[11.5px] text-[#7b7480]">{signer ?? "Waiting"}</p>
              </div>
            </div>
          );
        })}
      </div>

      {mine ? (
        <p className="mt-3 text-[12.5px] font-semibold text-[#12734f]">
          You signed off as {STAFF_ROLE_LABEL[staffRole]}.{" "}
          <span className="font-normal text-[#7b7480]">
            {other ? "Provisioning…" : `Waiting on ${otherRoleLabel} to sign off before the org goes live.`}
          </span>
        </p>
      ) : confirming ? (
        <div className="mt-3 rounded-xl border border-[#ececf1] bg-white p-4">
          <p className="text-[13px] font-bold text-[#28222e]">
            {other ? "Your sign-off is the last one — this will provision the org" : "Sign off as " + STAFF_ROLE_LABEL[staffRole]}
          </p>
          <ul className="mt-2 space-y-1.5">
            {[
              `${org.ownerEmail} gets the activation email and can sign in`,
              "Their subscription starts showing Enterprise",
              `The ${formatNumber(org.credits)}-credit monthly pool starts issuing`,
              "They can invite members and allocate credits from the pool",
              `The term starts today and runs ${org.termMonths ?? 12} months`,
            ].map((line) => (
              <li key={line} className="flex items-start gap-2 text-[12.5px] leading-[1.5] text-[#56505c]">
                <Check className="mt-0.5 size-3.5 shrink-0 text-[#12734f]" strokeWidth={3} />
                {line}
              </li>
            ))}
          </ul>
          <div className="mt-3.5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                confirmPayment(org.id);
                setConfirming(false);
              }}
              className="h-9 rounded-xl bg-[#ff5e1a] px-3.5 text-[12.5px] font-bold text-white transition hover:brightness-110"
            >
              Yes — sign as {staffName}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="h-9 px-2 text-[12.5px] font-semibold text-[#8a8490] transition hover:text-[#56505c]"
            >
              Not yet
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="mt-3 h-9 rounded-xl bg-[#ff5e1a] px-3.5 text-[12.5px] font-bold text-white transition hover:brightness-110"
        >
          Confirm payment received
        </button>
      )}
    </section>
  );
}

/** 已到期未续 —— 与 team / scale 同样处理,所以文案也要一致 */
function LapsedBanner({ org }: { org: AdminOrg }) {
  const { renew } = useAdmin();
  return (
    <section className="rounded-2xl border border-[#f3d4cd] bg-[#fef6f4] p-5">
      <p className="text-[14px] font-bold text-[#8f2f16]">Contract lapsed — {org.name} is on Free</p>
      <p className="mt-1.5 max-w-[80ch] text-[12.5px] leading-[1.6] text-[#7b5c52]">{LAPSE_POLICY}</p>
      <button
        type="button"
        onClick={() => renew(org.id)}
        className="mt-4 h-9 rounded-xl bg-[#24202a] px-3.5 text-[12.5px] font-bold text-white transition hover:bg-[#3b3442]"
      >
        Start a new term
      </button>
    </section>
  );
}

/* ---------------- Contract ---------------- */

/**
 * 合同 tab —— sales 与 CS 每次被问「这家什么时候到期、续不续」都来这里。
 *
 * 四个日期分开写而不是合成一个「有效期」:签约日、生效日、到期日、开通日
 * 在企业流程里经常不是同一天,合成之后就对不上客户的采购记录了。
 */
function Contract({ org }: { org: AdminOrg }) {
  const { setAutoRenew, renew, logOf } = useAdmin();
  const isEnterprise = org.plan === "Enterprise";
  const log = logOf(org.id);
  const daysLeft = daysLeftOf(org);

  if (!isEnterprise) {
    return (
      <Card title="Contract">
        <p className="text-[12.5px] leading-[1.6] text-[#7b7480]">
          {org.name} is on the self-serve {org.plan} plan — they bought it themselves with a card, so there is no signed
          contract, no term and no renewal date. It renews monthly until they cancel.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <Card title="Contract">
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          <Row k="Signed" v={org.signedAt ?? "—"} />
          <Row k="Effective" v={org.effectiveAt ?? "Starts on payment"} tone={!org.effectiveAt ? "warn" : undefined} />
          <Row k="Expires" v={org.expiresAt ?? "—"} tone={org.status === "expiring" ? "warn" : undefined} />
          <Row k="Term" v={`${org.termMonths ?? 12} months`} />
          <Row k="Provisioned" v={org.activatedAt ?? "Not yet"} tone={!org.activatedAt ? "warn" : undefined} />
          <Row k="Status" v={PROVISION_LABEL[org.provision ?? "active"]} />
          <Row k="Payment terms" v={PAYMENT_TERMS_LABEL[org.paymentTerms ?? "invoice_30"]} />
          <Row k="PO number" v={org.poNumber ?? "—"} />
        </dl>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#ececf1] bg-[#faf9fb] px-3.5 py-3">
          <div className="min-w-[240px] flex-1">
            <p className="text-[13px] font-bold text-[#28222e]">Auto-renew at the end of the term</p>
            <p className="mt-0.5 text-[11.5px] leading-[1.5] text-[#7b7480]">
              {org.autoRenew
                ? `Renews for another ${org.termMonths ?? 12} months on ${org.expiresAt ?? "the expiry date"}.`
                : "Off — this org lapses to Free at expiry. It shows up in Renewals until someone deals with it."}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={Boolean(org.autoRenew)}
            aria-label="Auto-renew"
            onClick={() => setAutoRenew(org.id, !org.autoRenew)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${org.autoRenew ? "bg-[#ff5e1a]" : "bg-[#d8d4dc]"}`}
          >
            <span
              aria-hidden
              className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${org.autoRenew ? "left-[22px]" : "left-0.5"}`}
            />
          </button>
        </div>

        {/*
          * 到期提醒节奏 —— 三个点各自的状态摆出来,而不是只写一句「会提醒」。
          * sales 最常被问的是「客户到底收到通知了吗」,这张表就是答案。
          */}
        {org.provision === "active" && (
          <div className="mt-4 rounded-xl border border-[#ececf1] bg-[#faf9fb] p-3.5">
            <p className="text-[12.5px] font-bold text-[#28222e]">
              Renewal reminders · {daysLeft} days left
            </p>
            <p className="mt-0.5 text-[11.5px] leading-[1.5] text-[#7b7480]">
              Sent to the owner and the billing contacts — whoever decides is often not whoever uses it.
              {org.autoRenew
                ? " Auto-renew is on, so only the 60-day notice goes out; two more would read like a service warning."
                : " Auto-renew is off, so all three go out."}
            </p>
            <ul className="mt-2.5 grid gap-1.5">
              {RENEWAL_REMINDERS.map((at) => {
                const state = reminderState(daysLeft, at, Boolean(org.autoRenew));
                return (
                  <li key={at} className="flex items-center gap-2.5 text-[12px]">
                    <span
                      className={`grid size-4 shrink-0 place-items-center rounded-full text-[9px] font-bold ${
                        state === "sent"
                          ? "bg-[#12734f] text-white"
                          : state === "scheduled"
                            ? "bg-[#e9e4f5] text-[#e04f12]"
                            : "bg-[#f1eff3] text-[#b3adb8]"
                      }`}
                    >
                      {state === "sent" ? <Check className="size-2.5" strokeWidth={3} /> : ""}
                    </span>
                    <span className={state === "skipped" ? "text-[#b3adb8] line-through" : "text-[#3b3442]"}>
                      {at} days before expiry
                    </span>
                    <span className="ml-auto font-semibold text-[#8a8490]">
                      {state === "sent" ? "Sent" : state === "scheduled" ? "Scheduled" : "Not sent"}
                    </span>
                  </li>
                );
              })}
            </ul>
            <a
              href="/prototypes/emails/renewal-reminder"
              className="mt-2.5 inline-block text-[12px] font-bold text-[#ff5e1a] underline underline-offset-2"
            >
              Preview the reminder email
            </a>
          </div>
        )}

        <p className="mt-3 flex items-start gap-2 text-[12px] leading-[1.6] text-[#8a8490]">
          <ScrollText className="mt-0.5 size-3.5 shrink-0" />
          {LAPSE_POLICY}
        </p>

        {(org.status === "expiring" || org.autoRenew === false) && org.provision === "active" && (
          <button
            type="button"
            onClick={() => renew(org.id)}
            className="mt-4 h-9 rounded-xl bg-[#24202a] px-3.5 text-[12.5px] font-bold text-white transition hover:bg-[#3b3442]"
          >
            Renew for another {org.termMonths ?? 12} months
          </button>
        )}
      </Card>

      <Card title="Internal log">
        <p className="text-[12px] leading-[1.6] text-[#7b7480]">
          Who changed what on our side. &ldquo;Who marked this paid&rdquo; has to be answerable — it is the one action
          here that turns money into access.
        </p>
        {log.length === 0 ? (
          <p className="mt-3 rounded-xl bg-[#faf9fb] px-3 py-2.5 text-[12px] text-[#9a94a0]">
            Nothing logged in this session.
          </p>
        ) : (
          <ul className="mt-3 space-y-2.5">
            {log.map((entry) => (
              <li key={entry.id} className="border-b border-[#f7f5f8] pb-2.5 last:border-0 last:pb-0">
                <p className="text-[12.5px] leading-[1.5] text-[#3b3442]">
                  <span className="font-bold">{entry.actor}</span> {entry.action}
                </p>
                <p className="mt-0.5 text-[11px] text-[#9a94a0]">{entry.at}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Overview({ org }: { org: AdminOrg }) {
  const equivalent = scaleEquivalent(org.seats);
  const margin = org.mrr === 0 ? 0 : (org.mrr - org.credits * COST_PER_CREDIT) / org.mrr;
  const pct = org.credits === 0 ? 0 : org.used / org.credits;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <Card title="Contract">
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          <Row k="Plan" v={org.plan} />
          <Row k="Seats" v={org.plan === "Free" ? "1" : String(org.seats)} />
          <Row
            k={org.plan === "Enterprise" ? "Monthly pool" : "Credits / month"}
            v={`${org.credits.toLocaleString("en-US")} credits`}
          />
          <Row k="Used this cycle" v={`${Math.round(pct * 100)}%`} tone={pct >= 0.9 ? "warn" : undefined} />
          <Row k="Effective" v={org.effectiveAt ?? "—"} />
          <Row k="Expires" v={org.expiresAt ?? "—"} tone={org.status === "expiring" ? "warn" : undefined} />
          <Row k="Monthly value" v={org.mrr === 0 ? "—" : money(org.mrr)} />
          <Row k="Sales owner" v={org.sales ?? "Unassigned"} tone={!org.sales && org.plan !== "Free" ? "warn" : undefined} />
        </dl>

        {org.status === "expiring" && (
          <p className="mt-4 rounded-xl border border-[#f0cf9e] bg-[#fffaf1] px-3.5 py-3 text-[12.5px] leading-[1.55] text-[#8f5514]">
            Contract ends {org.expiresAt}. Start the renewal now — pull the usage report from the Report tab and lead
            with what they actually consumed, not the seat count.
          </p>
        )}

        {org.plan !== "Free" && !org.sales && (
          <div className="mt-4 flex flex-wrap items-center gap-2.5 rounded-xl border border-[#ececf1] bg-[#faf9fb] px-3.5 py-3">
            <span className="text-[12.5px] text-[#7b7480]">Paying but nobody owns this account.</span>
            <select
              defaultValue=""
              aria-label="Assign sales owner"
              className="h-8 rounded-lg border border-[#ececf1] bg-white px-2 text-[12.5px] font-semibold outline-none focus:border-[#ff5e1a]"
            >
              <option value="">Assign to…</option>
              {SALES_REPS.map((rep) => (
                <option key={rep} value={rep}>
                  {rep}
                </option>
              ))}
            </select>
          </div>
        )}
      </Card>

      <Card title="Against self-serve">
        <p className="text-[12.5px] leading-[1.6] text-[#7b7480]">
          {org.plan === "Enterprise"
            ? "What the same seat count would cost on Scale — this is the number procurement will compute, so know it before the call."
            : "This organisation is on a self-serve plan; the comparison only matters once you pitch Enterprise."}
        </p>
        <dl className="mt-3 grid gap-y-2.5">
          <Row k="Same seats on Scale" v={money(equivalent.price)} />
          <Row k="Scale credits" v={equivalent.credits.toLocaleString("en-US")} />
          {org.plan === "Enterprise" && (
            <>
              <Row
                k="Premium"
                v={`${Math.round(((org.mrr - equivalent.price) / equivalent.price) * 100)}%`}
                tone={org.mrr < equivalent.price ? "warn" : undefined}
              />
              <Row k="Gross margin" v={`${(margin * 100).toFixed(1)}%`} tone={margin < 0.6 ? "warn" : undefined} />
            </>
          )}
        </dl>
        {org.plan === "Enterprise" && org.credits < equivalent.credits && (
          <p className="mt-3 rounded-xl border border-[#f2d5cd] bg-[#fff5f1] px-3 py-2.5 text-[12px] leading-[1.5] text-[#b23a1c]">
            Their pool is below what {org.seats} Scale seats would include. Procurement can find this — have the
            governance argument ready.
          </p>
        )}
      </Card>
    </div>
  );
}

/* ---------------- Billing ---------------- */

function Billing({ org }: { org: AdminOrg }) {
  const invoices = ["Aug 1, 2026", "Jul 1, 2026", "Jun 1, 2026", "May 1, 2026"].map((date, index) => ({
    id: `INV-2026-${String(8 - index).padStart(2, "0")}`,
    date,
    amount: org.mrr === 0 ? "$0" : money(org.mrr),
    status: index === 0 ? "Open" : "Paid",
  }));

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <Card title="Invoices">
        {org.plan === "Free" ? (
          <p className="text-[13px] text-[#8a8490]">No invoices — this organisation is on the free plan.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-[#f0eef2] text-left text-[10.5px] font-bold uppercase tracking-[0.05em] text-[#8a8490]">
                  <th className="py-2">Invoice</th>
                  <th className="py-2">Date</th>
                  <th className="py-2 text-right">Amount</th>
                  <th className="py-2">Status</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-[#f7f5f8]">
                    <td className="py-2.5 font-semibold text-[#28222e]">{inv.id}</td>
                    <td className="py-2.5 tabular-nums text-[#7b7480]">{inv.date}</td>
                    <td className="py-2.5 text-right tabular-nums font-semibold">{inv.amount}</td>
                    <td className="py-2.5">
                      <span
                        className="rounded-md px-1.5 py-0.5 text-[10.5px] font-bold"
                        style={
                          inv.status === "Paid"
                            ? { background: "#e6f7f0", color: "#0f7a5a" }
                            : { background: "#fff3ec", color: "#b06a1c" }
                        }
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <button type="button" className="text-[12px] font-bold text-[#ff5e1a] hover:underline">
                        PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-[11.5px] leading-[1.55] text-[#9a94a0]">
          Tax ID and billing address aren&apos;t captured yet — finance can&apos;t file an invoice without them, so this
          blocks enterprise signatures.
        </p>
      </Card>

      <Card title="Contract changes">
        <p className="text-[12.5px] leading-[1.6] text-[#7b7480]">
          Anything that changes what they pay goes through here, and every change lands in the organisation&apos;s own
          activity log — the customer sees it too.
        </p>
        <div className="mt-3 grid gap-2">
          <Btn full>Change tier</Btn>
          <Btn full>Adjust monthly pool</Btn>
          <Btn full>Add or remove seats</Btn>
          <Btn full>Grant one-off credits</Btn>
        </div>
      </Card>
    </div>
  );
}

/* ---------------- Members ---------------- */

/**
 * 成员 tab —— 开户流程的最后一步:替客户把人和额度配好。
 *
 * 分配额度放在这里而不是只在客户端,是因为 onboarding 时客户往往还没人会用后台。
 * 但是要留痕:每一条都写进内部日志,客户侧的 activity log 也带我们的名字。
 *
 * 没开通之前这一整块是锁住的 —— 邀请一个进不来的人只会制造支持工单。
 */
function Members({ org }: { org: AdminOrg }) {
  const { membersOf, inviteMember, setAllocation } = useAdmin();
  const members = membersOf(org.id);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrgMember["role"]>("member");
  const locked = org.provision === "awaiting_payment";

  const allocated = members.reduce((sum, member) => sum + (member.allocation ?? 0), 0);
  const unallocated = Math.max(0, org.credits - allocated);
  const valid = /.+@.+\..+/.test(email.trim());

  return (
    <div className="space-y-4">
      <Card title={`Members (${members.length} of ${org.seats} seats)`}>
        {locked ? (
          <p className="rounded-xl border border-[#f5ddc0] bg-[#fffdf8] px-3.5 py-3 text-[12.5px] leading-[1.6] text-[#8a7455]">
            Confirm payment first. Inviting people into an org that has no subscription just creates support tickets —
            they would land on a workspace where nobody can create.
          </p>
        ) : (
          <>
            <p className="text-[12.5px] leading-[1.6] text-[#7b7480]">
              We can invite on the customer&apos;s behalf during onboarding — after that their own owner takes over.
              Every invite shows up in their activity log with our name on it.
            </p>

            <div className="mt-3 flex flex-wrap items-end gap-2.5">
              <label className="min-w-[220px] flex-1">
                <span className="text-[11.5px] font-semibold text-[#8a8490]">Email</span>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={`someone@${org.ownerEmail.split("@")[1]}`}
                  className="mt-1 h-10 w-full rounded-xl border border-[#ececf1] bg-white px-3 text-[13px] outline-none transition focus:border-[#ff5e1a] placeholder:text-[#b4aeb8]"
                />
              </label>
              <label>
                <span className="text-[11.5px] font-semibold text-[#8a8490]">Role</span>
                <select
                  value={role}
                  onChange={(event) => setRole(event.target.value as OrgMember["role"])}
                  className="mt-1 h-10 rounded-xl border border-[#ececf1] bg-white px-2.5 text-[13px] font-semibold outline-none transition focus:border-[#ff5e1a]"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <button
                type="button"
                disabled={!valid || members.length >= org.seats}
                onClick={() => {
                  inviteMember(org.id, email.trim(), role);
                  setEmail("");
                }}
                className="flex h-10 items-center gap-1.5 rounded-xl bg-[#ff5e1a] px-3.5 text-[12.5px] font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <Plus className="size-3.5" /> Invite
              </button>
            </div>
            {members.length >= org.seats && (
              <p className="mt-2 text-[11.5px] font-semibold text-[#b06a1c]">
                All {org.seats} seats are taken — add seats on the contract before inviting more.
              </p>
            )}

            <div className="mt-4 rounded-xl border border-[#ececf1] bg-[#faf9fb] px-3.5 py-3">
              <p className="text-[12.5px] font-bold text-[#28222e]">
                {formatNumber(unallocated)} of {formatNumber(org.credits)} pooled credits unallocated
              </p>
              <p className="mt-0.5 text-[11.5px] leading-[1.5] text-[#7b7480]">
                Credits sit in the organisation pool. An allocation is a per-person monthly cap carved out of it —
                leaving someone unallocated means they draw straight from the pool.
              </p>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-[#f0eef2] text-left text-[10.5px] font-bold uppercase tracking-[0.05em] text-[#8a8490]">
                    <th className="py-2">Member</th>
                    <th className="py-2">Role</th>
                    <th className="py-2 text-right">Monthly allocation</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.email} className="border-b border-[#f7f5f8]">
                      <td className="py-2.5">
                        <p className="truncate font-semibold text-[#28222e]">{member.email}</p>
                        {member.status === "invited" && (
                          <p className="text-[11px] font-semibold text-[#b06a1c]">Invited — not signed in yet</p>
                        )}
                      </td>
                      <td className="py-2.5 capitalize text-[#56505c]">{member.role}</td>
                      <td className="py-2.5 text-right">
                        <select
                          value={member.allocation === null ? "none" : String(member.allocation)}
                          aria-label={`Allocation for ${member.email}`}
                          onChange={(event) =>
                            setAllocation(
                              org.id,
                              member.email,
                              event.target.value === "none" ? null : Number(event.target.value),
                            )
                          }
                          className="h-8 rounded-lg border border-[#ececf1] bg-white px-2 text-[12.5px] font-semibold outline-none transition focus:border-[#ff5e1a]"
                        >
                          <option value="none">No cap — draws from pool</option>
                          {[5_000, 10_000, 20_000, 40_000, 80_000].map((amount) => (
                            <option key={amount} value={amount}>
                              {formatNumber(amount)} credits
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

/* ---------------- Report ---------------- */

function Report({ org }: { org: AdminOrg }) {
  const pct = org.credits === 0 ? 0 : org.used / org.credits;
  const cost = org.used * COST_PER_CREDIT;
  const margin = org.mrr === 0 ? 0 : (org.mrr - cost) / org.mrr;
  /* 12 个月的柱子,确定性生成 */
  const bars = Array.from({ length: 12 }, (_, index) => 0.25 + (((index * 37) % 70) / 100));

  return (
    <div className="space-y-4">
      <Card title="Consumption report">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="max-w-[58ch] text-[12.5px] leading-[1.6] text-[#7b7480]">
            What they actually consumed, priced two ways: what they pay us, and what it costs us to serve. Lead the
            renewal with the first number and keep the second to yourself.
          </p>
          <Btn>
            <Download className="size-3.5" /> Export for the customer
          </Btn>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Mini label="Credits used" value={org.used.toLocaleString("en-US")} sub={`${Math.round(pct * 100)}% of plan`} />
          <Mini label="Their spend" value={org.mrr === 0 ? "—" : money(org.mrr)} sub="per month" />
          <Mini
            label="Our cost"
            value={`$${cost.toFixed(0)}`}
            sub={org.mrr === 0 ? "no revenue" : `${(margin * 100).toFixed(0)}% margin`}
          />
        </div>

        <div className="mt-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.07em] text-[#8a8490]">Last 12 months</p>
          <div className="mt-2 flex h-24 items-end gap-1.5">
            {bars.map((height, index) => (
              <span
                key={index}
                className="flex-1 rounded-t-[3px]"
                style={{
                  height: `${height * 100}%`,
                  background: index === bars.length - 1 ? "#ff5e1a" : "#e2dcf6",
                }}
                aria-hidden
              />
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-[#9a94a0]">Latest month highlighted</p>
        </div>
      </Card>
    </div>
  );
}

/* ---------------- 小组件 ---------------- */

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#ececf1] bg-white p-5">
      <h2 className="text-[15px] font-bold tracking-[-0.01em] text-[#28222e]">{title}</h2>
      <div className="mt-3.5">{children}</div>
    </section>
  );
}

function Row({ k, v, tone }: { k: string; v: string; tone?: "warn" }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-[13px]">
      <dt className="text-[#8a8490]">{k}</dt>
      <dd className="font-bold tabular-nums" style={{ color: tone === "warn" ? "#b06a1c" : "#28222e" }}>
        {v}
      </dd>
    </div>
  );
}

function Mini({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-[#ececf1] bg-[#faf9fb] p-3.5">
      <p className="text-[10.5px] font-bold uppercase tracking-[0.07em] text-[#8a8490]">{label}</p>
      <p className="mt-1 text-[18px] font-extrabold tabular-nums tracking-[-0.02em] text-[#28222e]">{value}</p>
      <p className="mt-0.5 text-[11.5px] text-[#9a94a0]">{sub}</p>
    </div>
  );
}

function Btn({
  children,
  primary,
  full,
}: {
  children: React.ReactNode;
  primary?: boolean;
  full?: boolean;
}) {
  return (
    <button
      type="button"
      className={`flex h-9 items-center justify-center gap-1.5 rounded-xl px-3.5 text-[12.5px] font-bold transition ${
        primary
          ? "bg-[#ff5e1a] text-white hover:brightness-110"
          : "border border-[#ececf1] text-[#3b3442] hover:border-[#ddd7df] hover:bg-[#faf9fb]"
      } ${full ? "w-full" : ""}`}
    >
      {children}
    </button>
  );
}
