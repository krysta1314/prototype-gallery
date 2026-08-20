"use client";

import { CalendarDays, Download, Globe, MoreHorizontal, Plus, Search, Target } from "lucide-react";
import {
  PERIODS,
  PERIOD_KEYS,
  avColor,
  delta,
  dstr,
  flags,
  fmt,
  lastActiveStr,
  money,
  totals,
} from "../_lib/agg";
import { useOrg } from "../_lib/org-context";
import { MEMBERS } from "../_lib/seed";
import type { PeriodKey, Row, SortKey, StatusFilter } from "../_lib/types";
import {
  Avatar,
  Bar,
  Btn,
  C,
  Callout,
  Card,
  DeltaText,
  Fld,
  Kpi,
  MONO,
  Seg,
  Spark,
  Tag,
  selectCls,
} from "./ui";

const STATUS_TONE = {
  active: ["ok", "Active"],
  dormant: ["mut", "Dormant"],
  invited: ["info", "Invited"],
  suspended: ["bad", "Suspended"],
} as const;

const SORT_LABEL: Record<SortKey, string> = {
  usd: "real cost",
  credits: "credits",
  videos: "videos",
  util: "budget used %",
  cpv: "cost per video",
  name: "name",
};

export function MembersTable({
  rows,
  period,
  sort,
  dir,
  q,
  status,
  onPeriod,
  onSort,
  onQ,
  onStatus,
  onOpenMember,
  onOpenModal,
  onGoProjects,
}: {
  rows: Row[];
  period: PeriodKey;
  sort: SortKey;
  dir: number;
  q: string;
  status: StatusFilter;
  onPeriod: (p: PeriodKey) => void;
  onSort: (k: SortKey) => void;
  onQ: (v: string) => void;
  onStatus: (v: StatusFilter) => void;
  onOpenMember: (email: string) => void;
  onOpenModal: (kind: "invite" | "export" | "budget" | "domains", email?: string) => void;
  onGoProjects: () => void;
}) {
  const { org, orgs, setOrgId, rateNote } = useOrg();
  const P = PERIODS[period];
  const T = totals(rows, "a");
  const Tp = totals(rows, "p");
  const overBudget = rows.filter((r) => r.a.credits > r.budget).length;
  const cpv = T.videos ? T.usd / T.videos : 0;
  const cpvP = Tp.videos ? Tp.usd / Tp.videos : 0;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-[720px]">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[20px] font-extrabold tracking-tight" style={{ color: C.ink }}>
              Members · 成員用量管理
            </h1>
            {/* 组织切换器 —— 同一套界面既管我们自己,也管客户组织;
                切过去就能看到 $ 列自动换成客户的有效单价,我们的成本不会露出 */}
            <select
              value={org.id}
              onChange={(event) => setOrgId(event.target.value)}
              aria-label="Organisation"
              className="h-7 rounded-lg border px-2 text-[12px] font-semibold outline-none"
              style={{ borderColor: C.line, color: C.ink2 }}
            >
              {orgs.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {item.tier}
                </option>
              ))}
            </select>
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-bold"
              style={
                org.rateBasis === "internal"
                  ? { background: "#FFF1EC", color: "#C9432A" }
                  : { background: C.brandSoft, color: C.brand }
              }
            >
              {org.rateBasis === "internal" ? "Internal · shows our cost" : "Customer view"}
            </span>
          </div>
          <p className="mt-1.5 text-[12px] leading-[1.65]" style={{ color: C.ink2 }}>
            Everyone with access to {org.name} — allocation, credits burnt,{" "}
            <b>{org.rateBasis === "internal" ? "real cash cost" : "spend"}</b>, outputs and last
            activity for the period you pick.
          </p>
          <p className="mt-1 text-[11px] leading-[1.6]" style={{ color: C.ink3 }}>
            {rateNote}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Btn onClick={() => onOpenModal("export")}>
            <Download size={13} /> Export CSV
          </Btn>
          <Btn onClick={onGoProjects}>
            <Target size={13} /> Project cost
          </Btn>
          <Btn onClick={() => onOpenModal("domains")}>
            <Globe size={13} /> Auto-join
          </Btn>
          <Btn variant="primary" onClick={() => onOpenModal("invite")}>
            <Plus size={13} /> Invite members
          </Btn>
        </div>
      </div>

      <div className="mb-3.5 grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Seats" value={MEMBERS.filter((m) => m.status !== "invited").length} />
        <Kpi
          label="Credits consumed"
          value={fmt(T.credits)}
          sub={<DeltaText d={delta(T.credits, Tp.credits)} invert />}
        />
        <Kpi
          accent
          label={org.rateBasis === "internal" ? "Real cost" : "Spend"}
          value={money(T.usd)}
          sub={<DeltaText d={delta(T.usd, Tp.usd)} invert />}
        />
        <Kpi
          label="Videos"
          value={fmt(T.videos)}
          sub={
            <>
              <b style={{ color: C.brandDark }}>{money(T.usdVideos)}</b> total cost
            </>
          }
        />
        <Kpi
          label="Images"
          value={fmt(T.images)}
          sub={
            <>
              <b style={{ color: C.brandDark }}>{money(T.usdImages)}</b> total cost
            </>
          }
        />
        <Kpi
          label="Cost / video"
          value={money(cpv)}
          sub={<DeltaText d={delta(cpv, cpvP)} invert />}
        />
      </div>

      <Card className="mb-3.5">
        <div
          className="flex flex-wrap items-center gap-2 px-3.5 py-2.5"
          style={{ borderBottom: `1px solid ${C.line}` }}
        >
          <Seg
            value={period}
            onChange={onPeriod}
            items={PERIOD_KEYS.map((k) => ({ k, label: PERIODS[k].short }))}
          />
          <Fld>
            <CalendarDays size={12} />
            <span style={{ fontFamily: MONO }}>
              {dstr(P.from)} – {dstr(P.to)}
            </span>
          </Fld>
          <Fld>
            <select
              className={selectCls}
              value={status}
              onChange={(e) => onStatus(e.target.value as StatusFilter)}
              aria-label="Filter by status"
            >
              <option value="active+">Active + dormant</option>
              <option value="all">All statuses</option>
              <option value="active">Active only</option>
              <option value="dormant">Dormant only</option>
              <option value="invited">Invited</option>
              <option value="suspended">Suspended</option>
            </select>
          </Fld>
          <Fld>
            <Search size={12} />
            <input
              className="w-[150px] bg-transparent outline-none"
              placeholder="Name, email, dept"
              value={q}
              onChange={(e) => onQ(e.target.value)}
              aria-label="Search members"
            />
          </Fld>
          <div className="flex-1" />
          <span className="text-[11px]" style={{ color: C.ink3 }}>
            Ranked by {SORT_LABEL[sort]} {dir < 0 ? "↓ highest first" : "↑ lowest first"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: 1180 }}>
            <TableHead sort={sort} dir={dir} onSort={onSort} />
            <tbody>
              {rows.map((r, i) => (
                <MemberRow
                  key={r.m.email}
                  r={r}
                  i={i}
                  onOpenMember={onOpenMember}
                  onOpenModal={onOpenModal}
                />
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-4 py-10 text-center text-[12px]" style={{ color: C.ink3 }}>
                    No members match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div
          className="flex flex-wrap gap-x-6 gap-y-1 px-3.5 py-2.5 text-[11px] leading-[1.6]"
          style={{ color: C.ink3, borderTop: `1px solid ${C.line}`, background: "#FBFCFE" }}
        >
          <span>
            <b style={{ color: C.ink2 }}>{org.rateBasis === "internal" ? "Real cost" : "Spend"}</b>{" "}
            {rateNote}
          </span>
          <span>
            <b style={{ color: C.ink2 }}>Budget used %</b> is against the member&rsquo;s monthly
            allowance, reset on the 1st.
          </span>
        </div>
        <div
          className="flex flex-wrap items-center gap-2 px-3.5 py-2.5 text-[11.5px]"
          style={{ color: C.ink2, borderTop: `1px solid ${C.line}` }}
        >
          <span>
            {rows.length} members shown
            {overBudget > 0 && (
              <>
                {" · "}
                <b style={{ color: "#B32328" }}>{overBudget} over budget</b>
              </>
            )}
          </span>
          <span>·</span>
          <span>
            Period total{" "}
            <b style={{ fontFamily: MONO }}>{fmt(T.credits)}</b> credits ={" "}
            <b style={{ fontFamily: MONO }}>{money(T.usd)}</b>
          </span>
        </div>
      </Card>

      <div className="grid gap-3.5 lg:grid-cols-2">
        <Card className="p-4">
          <h3 className="text-[13px] font-bold" style={{ color: C.ink }}>
            Spend by department · {P.label}
          </h3>
          <p className="mt-1 mb-3 text-[11.5px] leading-[1.6]" style={{ color: C.ink3 }}>
            So cost can be charged back to the right P&amp;L line, and you can see which team is
            actually getting value.
          </p>
          <DeptChart rows={rows} />
        </Card>
        <Card className="p-4">
          <h3 className="text-[13px] font-bold" style={{ color: C.ink }}>
            Attention needed
          </h3>
          <p className="mt-1 mb-2 text-[11.5px]" style={{ color: C.ink3 }}>
            Auto-flagged from this period&rsquo;s data.
          </p>
          <div>
            {flags(rows).map((f) => (
              <div
                key={f.t}
                className="flex items-center justify-between gap-3 py-[9px] text-[12px]"
                style={{ borderTop: `1px solid ${C.line2}`, color: C.ink2 }}
              >
                <span>{f.t}</span>
                <span className="text-right">
                  <Tag tone={f.c}>{f.v}</Tag>
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3.5">
            <Callout>
              Rule of thumb to agree with finance: flag anyone whose cost/video is &gt; 2× the team
              median — usually means re-generating instead of fixing the prompt. That&rsquo;s the
              coaching signal, not the raw credit number.
            </Callout>
          </div>
        </Card>
      </div>
    </>
  );
}

const COLUMNS: { k?: SortKey; label: string; num?: boolean; width?: number }[] = [
  { label: "", width: 34 },
  { k: "name", label: "Member" },
  { label: "Status" },
  { k: "util", label: "Monthly budget used", width: 168 },
  { k: "credits", label: "Credits", num: true },
  { k: "usd", label: "Real cost", num: true },
  { k: "videos", label: "Videos", num: true },
  { label: "Images", num: true },
  { k: "cpv", label: "Cost / video", num: true },
  { label: "Daily burn", width: 110 },
  { label: "Last active", num: true },
  { label: "", width: 44 },
];

function TableHead({
  sort,
  dir,
  onSort,
}: {
  sort: SortKey;
  dir: number;
  onSort: (k: SortKey) => void;
}) {
  return (
    <thead style={{ background: "#FBFCFE" }}>
      <tr>
        {COLUMNS.map((c, i) => {
          const on = c.k && sort === c.k;
          return (
            <th
              key={i}
              scope="col"
              aria-sort={on ? (dir < 0 ? "descending" : "ascending") : undefined}
              className={`px-2.5 py-2 align-bottom text-[10.5px] font-bold tracking-[0.04em] uppercase ${
                c.num ? "text-right" : "text-left"
              }`}
              style={{
                color: on ? C.brandDark : C.ink3,
                borderBottom: `1px solid ${C.line}`,
                width: c.width,
              }}
            >
              {c.k ? (
                <button
                  type="button"
                  onClick={() => onSort(c.k!)}
                  className="inline-flex items-center gap-1 rounded font-bold uppercase hover:underline focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/25 focus-visible:outline-none"
                  style={{ color: "inherit" }}
                >
                  {c.label}
                  <span className="opacity-70">{on ? (dir < 0 ? "↓" : "↑") : "↕"}</span>
                </button>
              ) : (
                c.label
              )}
            </th>
          );
        })}
      </tr>
    </thead>
  );
}

function MemberRow({
  r,
  i,
  onOpenMember,
  onOpenModal,
}: {
  r: Row;
  i: number;
  onOpenMember: (email: string) => void;
  onOpenModal: (kind: "budget", email: string) => void;
}) {
  const { m, a, budget } = r;
  const util = Math.min(999, Math.round((a.credits / budget) * 100));
  const tone = util > 100 ? "over" : util > 80 ? "hi" : util < 25 ? "lo" : "";
  const [st, stLabel] = STATUS_TONE[m.status];
  const td = "px-2.5 py-2 align-middle";
  const num = `${td} text-right`;

  return (
    <tr
      onClick={() => onOpenMember(m.email)}
      className="cursor-pointer transition-colors hover:bg-[#FBFCFE]"
      style={{ borderBottom: `1px solid ${C.line2}` }}
    >
      <td className={`${td} text-[11px]`} style={{ color: C.ink3, fontFamily: MONO }}>
        {i + 1}
      </td>
      <td className={td}>
        <div className="flex items-center gap-2.5">
          <Avatar name={m.name} seed={m.seed} colorOf={avColor} />
          <div className="min-w-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenMember(m.email);
              }}
              className="block rounded text-[12.5px] font-bold whitespace-nowrap hover:underline focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/25 focus-visible:outline-none"
              style={{ color: C.ink }}
            >
              {m.name}
            </button>
            <span className="block text-[10.5px]" style={{ color: C.ink3 }}>
              {m.email}
            </span>
          </div>
        </div>
      </td>
      <td className={td}>
        <Tag tone={st} dot>
          {stLabel}
        </Tag>
      </td>
      <td className={td}>
        <div className="mb-1 flex items-baseline justify-between gap-2 text-[11px]">
          <span style={{ fontFamily: MONO, color: C.ink2 }}>
            {fmt(a.credits)} / {fmt(budget)}
          </span>
          <b style={{ fontFamily: MONO, color: util > 100 ? "#B32328" : C.ink }}>{util}%</b>
        </div>
        <Bar pct={util} tone={tone} />
      </td>
      <td className={num} style={{ fontFamily: MONO, color: C.ink }}>
        {fmt(a.credits)}
      </td>
      <td className={num} style={{ fontFamily: MONO, color: C.brandDark, fontWeight: 700 }}>
        {money(a.usd)}
      </td>
      <td className={num} style={{ fontFamily: MONO, color: C.ink }}>
        {a.videos}
      </td>
      <td className={num} style={{ fontFamily: MONO, color: C.ink3 }}>
        {a.images}
      </td>
      <td className={num} style={{ fontFamily: MONO, color: a.videos ? C.ink : C.ink3 }}>
        {a.videos ? money(a.costPerVideo) : "—"}
      </td>
      <td className={td}>
        <Spark series={a.series} />
      </td>
      <td className={`${num} text-[11.5px]`} style={{ color: a.credits > 0 ? C.ink2 : C.ink3 }}>
        {a.credits > 0 ? lastActiveStr(m) : "—"}
      </td>
      <td className={td}>
        <Btn
          size="sm"
          variant="ghost"
          title="Adjust budget"
          onClick={(e) => {
            e.stopPropagation();
            onOpenModal("budget", m.email);
          }}
        >
          <MoreHorizontal size={14} />
        </Btn>
      </td>
    </tr>
  );
}

function DeptChart({ rows }: { rows: Row[] }) {
  const byD: Record<string, number> = {};
  rows.forEach((r) => {
    byD[r.m.dept] = (byD[r.m.dept] || 0) + r.a.usd;
  });
  const arr = Object.entries(byD)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);
  const mx = arr.length ? arr[0][1] : 1;
  const tot = arr.reduce((a, b) => a + b[1], 0) || 1;
  if (!arr.length)
    return (
      <div className="py-6 text-center text-[12px]" style={{ color: C.ink3 }}>
        No spend in this period.
      </div>
    );
  return (
    <div className="flex flex-col gap-2.5">
      {arr.map(([d, v]) => (
        <div key={d}>
          <div className="mb-1 flex items-baseline justify-between text-[11.5px]">
            <span style={{ color: C.ink2 }}>{d}</span>
            <b style={{ color: C.ink }}>
              {money(v)}{" "}
              <span style={{ color: C.ink3, fontWeight: 500 }}>
                · {((v / tot) * 100).toFixed(0)}%
              </span>
            </b>
          </div>
          <Bar pct={(v / mx) * 100} />
        </div>
      ))}
    </div>
  );
}
