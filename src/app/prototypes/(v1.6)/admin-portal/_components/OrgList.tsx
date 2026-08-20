"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Plus, Search } from "lucide-react";
import {
  ADMIN_ORGS,
  money,
  SALES_REPS,
  STATUS_LABEL,
  STATUS_TONE,
  type AdminOrg,
  type OrgPlan,
  type OrgStatus,
} from "../data";

/**
 * 组织总表 —— sales 模块的主界面。
 *
 * 参照真实后台的形态:一张表看完所有组织,按名称 / 归属 sales / 状态 / 套餐筛选。
 * 关键是**到期日**这一列 —— sales 最常用的动作是「这个月哪些要续约」,
 * 所以顶部给了一个「即将到期」的快捷筛选,而不是让人自己翻。
 */

const PAGE_SIZE = 12;
const PLANS: OrgPlan[] = ["Free", "Team", "Scale", "Enterprise"];
const STATUSES: OrgStatus[] = ["active", "trial", "expiring", "expired", "suspended"];

type SortKey = "createdAt" | "expiresAt" | "mrr" | "name" | "used";

export function OrgList({ onOpen, onCreate }: { onOpen: (id: string) => void; onCreate: () => void }) {
  const [q, setQ] = useState("");
  const [sales, setSales] = useState("any");
  const [status, setStatus] = useState<"any" | OrgStatus>("any");
  const [plan, setPlan] = useState<"any" | OrgPlan>("any");
  const [sort, setSort] = useState<SortKey>("createdAt");
  const [dir, setDir] = useState(-1);
  const [page, setPage] = useState(0);

  const rows = useMemo(() => {
    let list = ADMIN_ORGS.filter((org) => {
      if (q && !`${org.name} ${org.ownerEmail}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (sales === "unassigned" && org.sales) return false;
      if (sales !== "any" && sales !== "unassigned" && org.sales !== sales) return false;
      if (status !== "any" && org.status !== status) return false;
      if (plan !== "any" && org.plan !== plan) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name) * dir;
      if (sort === "mrr") return (a.mrr - b.mrr) * dir;
      if (sort === "used") return (a.used / Math.max(1, a.credits) - b.used / Math.max(1, b.credits)) * dir;
      // 日期按字符串排不准,但原型里日期是确定性生成的,按 id 稳定排即可
      return a.id.localeCompare(b.id) * dir;
    });
    return list;
  }, [q, sales, status, plan, sort, dir]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const pageRows = rows.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  const paying = ADMIN_ORGS.filter((org) => org.plan !== "Free");
  const mrrTotal = paying.reduce((sum, org) => sum + org.mrr, 0);
  const expiring = ADMIN_ORGS.filter((org) => org.status === "expiring").length;
  const unassigned = paying.filter((org) => !org.sales).length;

  const onSort = (key: SortKey) => {
    if (sort === key) setDir((d) => -d);
    else {
      setSort(key);
      setDir(key === "name" ? 1 : -1);
    }
  };

  const th = "px-3 py-2.5 text-left text-[10.5px] font-bold uppercase tracking-[0.05em] text-[#8a8490]";
  const td = "px-3 py-3 align-middle text-[13px]";

  return (
    <div className="space-y-5">
      {/* 四个读数:sales 每天先看这四个 */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Organisations" value={String(ADMIN_ORGS.length)} sub={`${paying.length} paying`} />
        <Kpi label="MRR" value={money(mrrTotal)} sub="annual contracts, monthly equivalent" />
        <Kpi
          label="Expiring soon"
          value={String(expiring)}
          sub="needs a renewal conversation"
          tone={expiring > 0 ? "warn" : undefined}
          onClick={() => {
            setStatus("expiring");
            setPage(0);
          }}
        />
        <Kpi
          label="No sales owner"
          value={String(unassigned)}
          sub="paying but unassigned"
          tone={unassigned > 0 ? "warn" : undefined}
          onClick={() => {
            setSales("unassigned");
            setPage(0);
          }}
        />
      </div>

      <div className="rounded-2xl border border-[#ececf1] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ececf1] p-4">
          <div className="min-w-0">
            <h2 className="text-[16px] font-bold tracking-[-0.01em] text-[#28222e]">
              Organisations <span className="font-medium text-[#9a94a0]">({rows.length})</span>
            </h2>
            <p className="mt-0.5 text-[12px] text-[#8a8490]">
              Every workspace on the platform — self-serve signups and contracts we opened.
            </p>
          </div>
          <button
            type="button"
            onClick={onCreate}
            className="flex h-9 items-center gap-1.5 rounded-xl bg-[#7b5cf0] px-3.5 text-[13px] font-bold text-white transition hover:brightness-110"
          >
            <Plus className="size-4" /> Open organisation
          </button>
        </div>

        {/* 筛选 */}
        <div className="flex flex-wrap items-center gap-2.5 border-b border-[#ececf1] bg-[#faf9fb] p-3.5">
          <label className="relative flex-1 min-w-[190px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#a8a2ae]" />
            <input
              value={q}
              onChange={(event) => {
                setQ(event.target.value);
                setPage(0);
              }}
              placeholder="Organisation or owner email"
              aria-label="Search organisations"
              className="h-9 w-full rounded-lg border border-[#ececf1] bg-white pl-8 pr-3 text-[13px] outline-none transition focus:border-[#7b5cf0]"
            />
          </label>
          <Select
            label="Sales"
            value={sales}
            onChange={(v) => {
              setSales(v);
              setPage(0);
            }}
            options={[
              { value: "any", label: "Any" },
              { value: "unassigned", label: "Unassigned" },
              ...SALES_REPS.map((rep) => ({ value: rep, label: rep })),
            ]}
          />
          <Select
            label="Status"
            value={status}
            onChange={(v) => {
              setStatus(v as "any" | OrgStatus);
              setPage(0);
            }}
            options={[{ value: "any", label: "Any" }, ...STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s] }))]}
          />
          <Select
            label="Plan"
            value={plan}
            onChange={(v) => {
              setPlan(v as "any" | OrgPlan);
              setPage(0);
            }}
            options={[{ value: "any", label: "Any" }, ...PLANS.map((p) => ({ value: p, label: p }))]}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: 940 }}>
            <thead className="bg-[#faf9fb]">
              <tr>
                <th className={th}>
                  <SortBtn active={sort === "name"} dir={dir} onClick={() => onSort("name")}>
                    Organisation
                  </SortBtn>
                </th>
                <th className={th}>Plan</th>
                <th className={th}>Status</th>
                <th className={`${th} text-right`}>
                  <SortBtn active={sort === "used"} dir={dir} onClick={() => onSort("used")}>
                    Credits used
                  </SortBtn>
                </th>
                <th className={`${th} text-right`}>
                  <SortBtn active={sort === "mrr"} dir={dir} onClick={() => onSort("mrr")}>
                    Monthly
                  </SortBtn>
                </th>
                <th className={th}>Effective</th>
                <th className={th}>Expires</th>
                <th className={th}>Sales</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((org) => (
                <Row key={org.id} org={org} onOpen={onOpen} td={td} />
              ))}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-[13px] text-[#9a94a0]">
                    No organisation matches these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-[#ececf1] px-3.5 py-2.5 text-[12px] text-[#7b7480]">
          <span>
            {rows.length === 0 ? 0 : current * PAGE_SIZE + 1}–{Math.min(rows.length, (current + 1) * PAGE_SIZE)} of{" "}
            {rows.length}
          </span>
          <span className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage(Math.max(0, current - 1))}
              disabled={current === 0}
              aria-label="Previous page"
              className="rounded-lg border border-[#ececf1] px-2 py-1 font-bold disabled:opacity-35"
            >
              ←
            </button>
            <span>
              {current + 1} / {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setPage(Math.min(pageCount - 1, current + 1))}
              disabled={current >= pageCount - 1}
              aria-label="Next page"
              className="rounded-lg border border-[#ececf1] px-2 py-1 font-bold disabled:opacity-35"
            >
              →
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}

function Row({ org, onOpen, td }: { org: AdminOrg; onOpen: (id: string) => void; td: string }) {
  const pct = org.credits === 0 ? 0 : Math.min(1, org.used / org.credits);
  const tone = STATUS_TONE[org.status];
  return (
    <tr
      onClick={() => onOpen(org.id)}
      className="cursor-pointer border-b border-[#f4f2f6] transition hover:bg-[#faf9fb]"
    >
      <td className={td}>
        <p className="font-semibold text-[#28222e]">{org.name}</p>
        <p className="truncate text-[11.5px] text-[#9a94a0]">{org.ownerEmail}</p>
      </td>
      <td className={td}>
        <span className="text-[12.5px] font-semibold text-[#56505c]">{org.plan}</span>
        {org.plan !== "Free" && <span className="block text-[11px] text-[#9a94a0]">{org.seats} seats</span>}
      </td>
      <td className={td}>
        <span
          className="rounded-md px-1.5 py-0.5 text-[10.5px] font-bold"
          style={{ background: tone.bg, color: tone.fg }}
        >
          {STATUS_LABEL[org.status]}
        </span>
      </td>
      <td className={`${td} text-right`}>
        <span className="tabular-nums font-semibold text-[#28222e]">{Math.round(pct * 100)}%</span>
        <span className="mt-1 block h-1 overflow-hidden rounded-full bg-[#f1eff3]">
          <span
            className="block h-full rounded-full"
            style={{ width: `${pct * 100}%`, background: pct >= 1 ? "#e35b3d" : pct >= 0.8 ? "#e07a3a" : "#7b5cf0" }}
          />
        </span>
      </td>
      <td className={`${td} text-right tabular-nums font-semibold`}>{org.mrr === 0 ? "—" : money(org.mrr)}</td>
      <td className={`${td} tabular-nums text-[#7b7480]`}>{org.effectiveAt ?? "—"}</td>
      <td className={`${td} tabular-nums text-[#7b7480]`}>{org.expiresAt ?? "—"}</td>
      <td className={td}>
        {org.sales ? (
          <span className="text-[12.5px] text-[#56505c]">{org.sales}</span>
        ) : (
          <span className="text-[11.5px] text-[#b4aeb8]">Self-serve</span>
        )}
      </td>
    </tr>
  );
}

function Kpi({
  label,
  value,
  sub,
  tone,
  onClick,
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "warn";
  onClick?: () => void;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      {...(onClick ? { type: "button" as const, onClick } : {})}
      className={`rounded-2xl border bg-white p-4 text-left transition ${
        tone === "warn" ? "border-[#f0cf9e]" : "border-[#ececf1]"
      } ${onClick ? "hover:border-[#7b5cf0]" : ""}`}
    >
      <p className="text-[10.5px] font-bold uppercase tracking-[0.07em] text-[#8a8490]">{label}</p>
      <p
        className="mt-1.5 text-[24px] font-extrabold tabular-nums tracking-[-0.02em]"
        style={{ color: tone === "warn" ? "#b06a1c" : "#1a1a2e" }}
      >
        {value}
      </p>
      <p className="mt-0.5 text-[11.5px] text-[#9a94a0]">{sub}</p>
    </Tag>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex items-center gap-1.5 text-[12px] text-[#8a8490]">
      {label}
      <span className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 appearance-none rounded-lg border border-[#ececf1] bg-white pl-2.5 pr-7 text-[12.5px] font-semibold text-[#3b3442] outline-none transition focus:border-[#7b5cf0]"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-[#a8a2ae]" />
      </span>
    </label>
  );
}

function SortBtn({
  active,
  dir,
  onClick,
  children,
}: {
  active: boolean;
  dir: number;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 font-bold uppercase transition hover:text-[#7b5cf0]"
      style={{ color: active ? "#7b5cf0" : "inherit" }}
    >
      {children}
      <span className="opacity-70">{active ? (dir < 0 ? "↓" : "↑") : "↕"}</span>
    </button>
  );
}
