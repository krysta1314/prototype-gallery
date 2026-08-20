"use client";

import { useState } from "react";
import { ArrowLeft, Download, Mail, Plus, RefreshCw } from "lucide-react";
import {
  ADMIN_ORGS,
  COST_PER_CREDIT,
  money,
  SALES_REPS,
  scaleEquivalent,
  STATUS_LABEL,
  STATUS_TONE,
  type AdminOrg,
} from "../data";

/**
 * 单个组织的管理页 —— 开户之后 sales 与 CS 每天用的地方。
 *
 * 四个 tab 对应四件真实工作:
 *   Overview  合同现状与续约(到期日是 sales 最关心的字段)
 *   Billing   发票、付款方式、合同变更
 *   Members   替客户邀请人、看谁在用
 *   Report    给客户的月度用量报告,也是续约谈判的材料
 */

type Tab = "overview" | "billing" | "members" | "report";

const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "billing", label: "Billing" },
  { key: "members", label: "Members" },
  { key: "report", label: "Report" },
];

export function OrgDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const [tab, setTab] = useState<Tab>("overview");
  const org = ADMIN_ORGS.find((item) => item.id === id) ?? ADMIN_ORGS[0]!;
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
              <span className="rounded-md bg-[#efe9ff] px-2 py-0.5 text-[11px] font-bold text-[#7b5cf0]">
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

      {tab === "overview" && <Overview org={org} />}
      {tab === "billing" && <Billing org={org} />}
      {tab === "members" && <Members org={org} />}
      {tab === "report" && <Report org={org} />}
    </div>
  );
}

/* ---------------- Overview ---------------- */

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
              className="h-8 rounded-lg border border-[#ececf1] bg-white px-2 text-[12.5px] font-semibold outline-none focus:border-[#7b5cf0]"
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
                      <button type="button" className="text-[12px] font-bold text-[#7b5cf0] hover:underline">
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

function Members({ org }: { org: AdminOrg }) {
  const count = org.plan === "Free" ? 1 : Math.min(org.seats, 8);
  const people = Array.from({ length: count }, (_, index) => {
    const n = index + 1;
    return {
      name: `${org.name.split(" ")[0]} User ${String(n).padStart(2, "0")}`,
      email: `user${String(n).padStart(2, "0")}@${org.ownerEmail.split("@")[1]}`,
      role: index === 0 ? "Owner" : index === 1 ? "Admin" : "Member",
      used: Math.round((org.used / Math.max(1, count)) * (0.6 + ((n * 17) % 80) / 100)),
    };
  });

  return (
    <div className="space-y-4">
      <Card title={`Members (${people.length}${org.plan === "Free" ? "" : ` of ${org.seats} seats`})`}>
        <p className="text-[12.5px] leading-[1.6] text-[#7b7480]">
          We can invite on the customer&apos;s behalf during onboarding — after that their own owner takes over. Every
          invite we send shows up in their activity log with our name on it.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Btn primary>
            <Plus className="size-3.5" /> Invite on their behalf
          </Btn>
          <Btn>Copy their invite link</Btn>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[#f0eef2] text-left text-[10.5px] font-bold uppercase tracking-[0.05em] text-[#8a8490]">
                <th className="py-2">Member</th>
                <th className="py-2">Role</th>
                <th className="py-2 text-right">Credits this cycle</th>
              </tr>
            </thead>
            <tbody>
              {people.map((person) => (
                <tr key={person.email} className="border-b border-[#f7f5f8]">
                  <td className="py-2.5">
                    <p className="font-semibold text-[#28222e]">{person.name}</p>
                    <p className="truncate text-[11.5px] text-[#9a94a0]">{person.email}</p>
                  </td>
                  <td className="py-2.5 text-[#56505c]">{person.role}</td>
                  <td className="py-2.5 text-right tabular-nums font-semibold">
                    {person.used.toLocaleString("en-US")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
                  background: index === bars.length - 1 ? "#7b5cf0" : "#e2dcf6",
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
          ? "bg-[#7b5cf0] text-white hover:brightness-110"
          : "border border-[#ececf1] text-[#3b3442] hover:border-[#ddd7df] hover:bg-[#faf9fb]"
      } ${full ? "w-full" : ""}`}
    >
      {children}
    </button>
  );
}
