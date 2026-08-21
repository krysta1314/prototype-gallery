"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, Hourglass, LayoutList, Plus, RefreshCw } from "lucide-react";
import { LAPSE_POLICY, PROVISION_LABEL, money } from "./data";
import { OrgList } from "./_components/OrgList";
import { OrgDetail } from "./_components/OrgDetail";
import { CreateOrg } from "./_components/CreateOrg";
import { AdminProvider, awaitingPayment, STAFF, STAFF_ROLE_LABEL, useAdmin, type StaffRole } from "./_components/store";

/* ------------------------------------------------------------------ *
 * Admin Portal —— sales 模块。
 *
 * 不是一个开户表单:开户只是这里的一个动作。日常真正在用的是
 * 「组织总表 → 某个组织 → 合同 / 账单 / 成员 / 报告」这条链路,
 * 以及「这个月哪些要续约」这个入口。
 *
 * 参照真实后台(uat-admin/accounts)的形态,但把两件它没做好的事补上:
 *   1. 归属 sales —— 付费但没人维护的账号要能一眼捞出来
 *   2. 报告 —— 续约谈判要拿真实消耗说话,而不是席位数
 * ------------------------------------------------------------------ */

type View =
  | { kind: "list" }
  | { kind: "detail"; id: string }
  | { kind: "create" }
  | { kind: "renewals" }
  | { kind: "pending" };

export default function AdminPortalPage() {
  return (
    <AdminProvider>
      <AdminPortalShell />
    </AdminProvider>
  );
}

function AdminPortalShell() {
  const [view, setView] = useState<View>({ kind: "list" });
  const { orgs } = useAdmin();
  const pending = awaitingPayment(orgs);

  const nav: { key: View["kind"]; label: string; icon: typeof LayoutList; count?: number; urgent?: boolean }[] = [
    { key: "list", label: "Organisations", icon: LayoutList, count: orgs.length },
    // 待收款排在续约之前 —— 这批是「客户已经签了却还用不上」,比续约更等不起
    { key: "pending", label: "Awaiting payment", icon: Hourglass, count: pending.length, urgent: true },
    {
      key: "renewals",
      label: "Renewals",
      icon: RefreshCw,
      count: orgs.filter((org) => org.status === "expiring" || org.autoRenew === false).length,
      urgent: true,
    },
    { key: "create", label: "Open organisation", icon: Plus },
  ];

  return (
    <main className="min-h-dvh bg-[#f7f6f9] text-[#28222e]">
      <header className="sticky top-0 z-30 border-b border-[#ececf1] bg-white">
        <div className="mx-auto flex max-w-[1240px] items-center gap-3 px-6 py-3.5">
          <Link
            href="/"
            className="grid size-9 place-items-center rounded-xl text-[#8a8490] transition hover:bg-[#f6f4f7] hover:text-[#28222e]"
            aria-label="Back to gallery"
          >
            <ArrowLeft className="size-[18px]" />
          </Link>
          <span className="grid size-8 place-items-center rounded-lg bg-[#fff3ec]">
            <Building2 className="size-4 text-[#ff5e1a]" />
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-bold tracking-[-0.01em]">Buzz Admin Portal</p>
            <p className="text-[12px] text-[#8a8490]">Sales &amp; account management</p>
          </div>
          <StaffSwitch />
          <span className="rounded-full bg-[#fff3ec] px-2.5 py-1 text-[11px] font-bold text-[#ff5e1a]">
            Internal only
          </span>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1240px] gap-6 px-6 py-7 lg:grid-cols-[196px_1fr]">
        <nav className="lg:sticky lg:top-[76px] lg:self-start">
          <ul className="flex gap-1.5 lg:flex-col">
            {nav.map(({ key, label, icon: Icon, count, urgent }) => {
              const on = view.kind === key || (key === "list" && view.kind === "detail");
              return (
                <li key={key} className="min-w-0">
                  <button
                    type="button"
                    onClick={() => setView(key === "detail" ? { kind: "list" } : ({ kind: key } as View))}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13.5px] font-semibold transition ${
                      on ? "bg-white text-[#28222e] shadow-[0_1px_3px_rgba(26,26,46,0.06)]" : "text-[#706a78] hover:bg-white/70"
                    }`}
                  >
                    <Icon className={`size-4 shrink-0 ${on ? "text-[#ff5e1a]" : "text-[#9a94a0]"}`} />
                    <span className="truncate">{label}</span>
                    {count !== undefined && count > 0 && (
                      <span
                        className={`ml-auto shrink-0 rounded-md px-1.5 py-0.5 text-[10.5px] font-bold tabular-nums ${
                          urgent ? "bg-[#fff3ec] text-[#b06a1c]" : "bg-[#f1eff3] text-[#7b7480]"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="min-w-0">
          {view.kind === "list" && (
            <OrgList onOpen={(id) => setView({ kind: "detail", id })} onCreate={() => setView({ kind: "create" })} />
          )}
          {view.kind === "detail" && <OrgDetail id={view.id} onBack={() => setView({ kind: "list" })} />}
          {view.kind === "create" && (
            <CreateOrg onDone={() => setView({ kind: "list" })} onOpen={(id) => setView({ kind: "detail", id })} />
          )}
          {view.kind === "renewals" && <Renewals onOpen={(id) => setView({ kind: "detail", id })} />}
          {view.kind === "pending" && <AwaitingPayment onOpen={(id) => setView({ kind: "detail", id })} />}
        </div>
      </div>

      <p className="mx-auto max-w-[1240px] px-6 pb-10 text-[12px] text-[#9a94a0]">
        演示用途:纯前端 mock,不落库。Enterprise 三档数值取自 rate card v1.6 §8 校正版,成本按 $0.00263/credit。
      </p>
    </main>
  );
}

/**
 * 身份切换 —— 演示用。确认收款要 sales 与财务双签,所以走查时得能换身份,
 * 否则一个人点两下就过了,双签这条规则在原型里就看不出来。
 */
function StaffSwitch() {
  const { staffRole, setStaffRole } = useAdmin();
  return (
    <label className="ml-auto flex items-center gap-2 text-[11.5px] font-semibold text-[#8a8490]">
      演示身份
      <select
        value={staffRole}
        onChange={(event) => setStaffRole(event.target.value as StaffRole)}
        className="h-8 rounded-lg border border-[#ececf1] bg-white px-2 text-[12px] font-bold text-[#28222e] outline-none transition focus:border-[#ff5e1a]"
      >
        {(["sales", "finance"] as StaffRole[]).map((role) => (
          <option key={role} value={role}>
            {STAFF[role]} · {STAFF_ROLE_LABEL[role]}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * 待收款看板 —— 整个开户流程里最容易掉单的一环。
 *
 * sales 填完表就以为开好了,客户那边登不进来,来回扯两天 —— 所以这批要单独一页,
 * 每行直接给「确认收款」这个动作,不用先点进详情。
 */
function AwaitingPayment({ onOpen }: { onOpen: (id: string) => void }) {
  const { orgs } = useAdmin();
  const rows = awaitingPayment(orgs);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[20px] font-extrabold tracking-[-0.02em]">Awaiting payment</h1>
        <p className="mt-1 max-w-[70ch] text-[13px] leading-[1.6] text-[#8a8490]">
          Signed, invoiced, not paid yet. Until the money lands, the owner cannot sign in and the organisation has no
          subscription — so nobody can create. Provisioning needs two sign-offs, Sales and Finance: whoever opened the
          deal should not be the one who also confirms its payment.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#ddd7df] bg-white px-6 py-16 text-center">
          <p className="text-[14px] font-bold">Nothing waiting</p>
          <p className="mt-1 text-[12.5px] text-[#8a8490]">Every signed contract has been paid and provisioned.</p>
        </div>
      ) : (
        <ul className="grid gap-3">
          {rows.map((org) => (
            <li
              key={org.id}
              className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border border-[#f5ddc0] bg-[#fffdf8] p-4"
            >
              <button type="button" onClick={() => onOpen(org.id)} className="min-w-0 flex-1 text-left">
                <span className="block text-[14.5px] font-bold text-[#28222e]">{org.name}</span>
                <span className="block text-[12px] text-[#8a8490]">
                  {org.ownerEmail} · {org.seats} seats · {money(org.mrr)}/mo · signed {org.signedAt}
                </span>
              </button>
              <span className="rounded-md bg-[#fff3ec] px-2 py-0.5 text-[11px] font-bold text-[#b06a1c]">
                {PROVISION_LABEL.awaiting_payment}
              </span>
              <SignOffCell orgId={org.id} />
            </li>
          ))}
        </ul>
      )}

      <p className="rounded-2xl border border-[#ececf1] bg-white px-4 py-3 text-[12px] leading-[1.6] text-[#8a8490]">
        {LAPSE_POLICY}
      </p>
    </div>
  );
}

/** 看板行上的双签格 —— 一眼看出还差谁,不用点进详情 */
function SignOffCell({ orgId }: { orgId: string }) {
  const { approvalOf, confirmPayment, staffRole, staffName } = useAdmin();
  const approval = approvalOf(orgId);
  const mine = approval[staffRole];
  const waitingOn = staffRole === "sales" ? "Finance" : "Sales";

  if (mine) {
    return (
      <span className="shrink-0 text-[12px] font-semibold text-[#7b7480]">
        Signed as {staffName} · waiting on {waitingOn}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={() => confirmPayment(orgId)}
      className="h-9 shrink-0 rounded-xl bg-[#ff5e1a] px-3.5 text-[12.5px] font-bold text-white transition hover:brightness-110"
    >
      Sign off as {STAFF_ROLE_LABEL[staffRole]}
    </button>
  );
}

/**
 * 续约看板 —— sales 每周真正会打开的那一页。
 * 按到期日排,把「还剩多少天」摆在最前面,而不是让人去读日期算。
 */
function Renewals({ onOpen }: { onOpen: (id: string) => void }) {
  const { orgs } = useAdmin();
  // 关掉自动续约的也要在这里 —— 它比「快到期」更危险:没人碰它就自动流失
  const rows = orgs.filter(
    (org) => org.status === "expiring" || org.status === "expired" || org.autoRenew === false,
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[20px] font-extrabold tracking-[-0.02em]">Renewals</h1>
        <p className="mt-1 max-w-[64ch] text-[13px] text-[#8a8490]">
          Contracts ending or already lapsed. Open one and pull its consumption report first — the renewal argument is
          what they used, not how many seats they bought.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#ddd7df] bg-white px-6 py-16 text-center">
          <p className="text-[14px] font-bold">Nothing expiring</p>
          <p className="mt-1 text-[12.5px] text-[#8a8490]">Every contract is comfortably inside its term.</p>
        </div>
      ) : (
        <ul className="grid gap-3">
          {rows.map((org) => (
            <li key={org.id}>
              <button
                type="button"
                onClick={() => onOpen(org.id)}
                className="flex w-full flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-[#ececf1] bg-white p-4 text-left transition hover:border-[#ff5e1a]"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[14.5px] font-bold text-[#28222e]">{org.name}</span>
                  <span className="block text-[12px] text-[#8a8490]">
                    {org.plan} · {org.seats} seats · {org.sales ?? "no sales owner"}
                  </span>
                </span>
                <span className="text-right">
                  <span
                    className="block text-[12.5px] font-bold"
                    style={{ color: org.status === "expired" ? "#c9432a" : "#b06a1c" }}
                  >
                    {org.status === "expired" ? "Lapsed" : "Ends"} {org.expiresAt}
                  </span>
                  <span className="block text-[11.5px] text-[#9a94a0]">
                    {org.autoRenew === false ? "Auto-renew off · " : ""}
                    {Math.round((org.used / Math.max(1, org.credits)) * 100)}% of plan used
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
