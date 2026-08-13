"use client";

import { CreditCard } from "lucide-react";
import { useTeam } from "./team-context";

/** Finance 是 billing-only 席位,没有产品权限 —— 在创作页顶部说明,并由各页禁用创作入口 */
export function FinanceNotice({ className = "" }: { className?: string }) {
  const { role, team, openSettings } = useTeam();
  if (role !== "finance") return null;

  return (
    <div className={`flex flex-wrap items-center gap-3 rounded-2xl border border-[#dfe3ff] bg-[#f4f5ff] px-4 py-3 ${className}`}>
      <CreditCard className="size-4 shrink-0 text-[#5b6cff]" />
      <p className="min-w-0 flex-1 text-[13px] leading-snug text-[#4a4f7a]">
        <span className="font-bold">Billing-only access.</span> You manage invoices, the payment method, and auto top-up for{" "}
        {team.name}
        {" — creating work isn't part of this seat, so it doesn't use one."}
      </p>
      <button
        type="button"
        onClick={() => openSettings("billing")}
        className="h-9 shrink-0 rounded-xl bg-[#24202a] px-3.5 text-[12px] font-bold text-white transition hover:bg-[#3b3442]"
      >
        Go to Billing
      </button>
    </div>
  );
}
