"use client";

import {
  ArrowLeft,
  CalendarDays,
  Download,
  Image as ImageIcon,
  MessageSquare,
  Pause,
  Play,
  Target,
  Zap,
} from "lucide-react";
import {
  PERIODS,
  PERIOD_KEYS,
  agg,
  avColor,
  delta,
  dOffset,
  dstr,
  fmt,
  idxOfDate,
  money,
  money0,
} from "../_lib/agg";
import { DAYS, ORG_DEFAULT_BUDGET, USD_PER_CREDIT, COST_MODEL } from "../_lib/seed";
import type { GenEvent, GenFilter, MemberWithUsage, PeriodKey, TabKey } from "../_lib/types";
import { useOrg } from "../_lib/org-context";
import {
  Avatar,
  Bar,
  Btn,
  C,
  Callout,
  Card,
  Chart,
  DeltaText,
  Fld,
  Kpi,
  MONO,
  Seg,
  Tag,
  selectCls,
} from "./ui";

const STATUS_TONE = {
  active: ["ok", "Active"],
  dormant: ["mut", "Dormant"],
  invited: ["info", "Invited"],
  suspended: ["bad", "Suspended"],
} as const;

export function MemberDetail({
  m,
  budget,
  isOverride,
  period,
  tab,
  genFilter,
  onPeriod,
  onTab,
  onGenFilter,
  onBack,
  onOpenModal,
}: {
  m: MemberWithUsage;
  budget: number;
  isOverride: boolean;
  period: PeriodKey;
  tab: TabKey;
  genFilter: GenFilter;
  onPeriod: (p: PeriodKey) => void;
  onTab: (t: TabKey) => void;
  onGenFilter: (g: GenFilter) => void;
  onBack: () => void;
  onOpenModal: (kind: "budget" | "topup", email: string) => void;
}) {
  const { rate, rateNote, auditable } = useOrg();
  const P = PERIODS[period];
  const a = agg(m, P.from, P.to, rate);
  const p = agg(m, P.prevFrom, P.prevTo, rate);
  const [st, stLabel] = STATUS_TONE[m.status];
  const util = Math.round((a.credits / budget) * 100);
  const thisMonth = agg(m, PERIODS.tm.from, PERIODS.tm.to, rate);

  const from = idxOfDate(P.from);
  const to = idxOfDate(P.to);
  const ev = m.events.filter((e) => e.day >= from && e.day <= to).sort((x, y) => y.day - x.day);
  const shown = genFilter === "all" ? ev : ev.filter((e) => e.kind === genFilter);

  const byTag: Record<string, { c: number; u: number; n: number }> = {};
  ev.forEach((e) => {
    byTag[e.tag] = byTag[e.tag] || { c: 0, u: 0, n: 0 };
    byTag[e.tag].c += e.credits;
    byTag[e.tag].u += e.usd;
    byTag[e.tag].n++;
  });

  return (
    <>
      <div className="mb-3.5">
        <Btn onClick={onBack}>
          <ArrowLeft size={13} /> Back to Members
        </Btn>
      </div>

      <Card className="mb-3.5">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3.5">
          <Avatar name={m.name} seed={m.seed} size={42} colorOf={avColor} />
          <div className="min-w-0 flex-1">
            <h2 className="text-[17px] font-extrabold tracking-tight" style={{ color: C.ink }}>
              {m.name}
            </h2>
            <div
              className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px]"
              style={{ color: C.ink2 }}
            >
              <span>{m.email}</span>
              <span style={{ color: C.ink3 }}>·</span>
              <span>
                {m.dept} · {m.role}
              </span>
              <span style={{ color: C.ink3 }}>·</span>
              <Tag tone={st} dot>
                {stLabel}
              </Tag>
              <span style={{ color: C.ink3, fontFamily: MONO }}>UID {m.id}</span>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Btn onClick={() => onOpenModal("budget", m.email)}>
              <Target size={13} /> Adjust budget
            </Btn>
            <Btn onClick={() => onOpenModal("topup", m.email)}>
              <Zap size={13} /> Grant credits
            </Btn>
            <Btn>
              <Pause size={13} /> Suspend access
            </Btn>
          </div>
        </div>

        <div
          className="flex flex-wrap items-center gap-2 px-4 py-2.5"
          style={{ borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}
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
        </div>

        <div className="grid gap-2.5 p-4 sm:grid-cols-2 xl:grid-cols-5">
          <Kpi
            label="Credits used"
            value={fmt(a.credits)}
            sub={<DeltaText d={delta(a.credits, p.credits)} invert />}
          />
          <Kpi
            accent
            label="Real cost"
            value={money(a.usd)}
            sub={<DeltaText d={delta(a.usd, p.usd)} invert />}
          />
          <Kpi
            label="Videos"
            value={a.videos}
            sub={`${a.images} images · ${a.sessions} canvases`}
          />
          <Kpi
            label="Cost / video"
            value={a.videos ? money(a.costPerVideo) : "—"}
            sub={`team median ${money(0.42)}`}
          />
          <Kpi
            label="Wasted (failed)"
            value={money(a.fail * 0.35)}
            sub={`${a.fail} failed generations`}
          />
        </div>
      </Card>

      <div className="mb-3.5 grid gap-3.5 lg:grid-cols-2">
        <Card className="p-4">
          <h3 className="text-[13px] font-bold" style={{ color: C.ink }}>
            Daily credit burn
          </h3>
          <p className="mt-1 mb-3 text-[11.5px] leading-[1.6]" style={{ color: C.ink3 }}>
            Orange = successful generations · amber = failed/aborted runs (still billed by the
            model vendor).
          </p>
          <Chart series={a.series} usdPerCredit={USD_PER_CREDIT} />
          <div
            className="mt-1.5 flex justify-between text-[10.5px]"
            style={{ color: C.ink3, fontFamily: MONO }}
          >
            <span>{dstr(P.from)}</span>
            <span>{dstr(P.to)}</span>
          </div>
          <div className="mt-2.5 flex gap-4 text-[11px]" style={{ color: C.ink2 }}>
            <span className="flex items-center gap-1.5">
              <i className="h-2 w-2 rounded-sm" style={{ background: C.brand }} /> Billed &amp;
              delivered
            </span>
            <span className="flex items-center gap-1.5">
              <i className="h-2 w-2 rounded-sm" style={{ background: "#FBBF24" }} /> Failed /
              abandoned
            </span>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-[13px] font-bold" style={{ color: C.ink }}>
            Monthly budget
          </h3>
          <p className="mt-1 mb-3 text-[11.5px] leading-[1.6]" style={{ color: C.ink3 }}>
            {isOverride
              ? `Per-user override in effect (org default is ${fmt(ORG_DEFAULT_BUDGET)}).`
              : "Inheriting the organisation default."}
          </p>
          <div className="h-2.5 overflow-hidden rounded-full" style={{ background: C.line2 }}>
            <i
              className="block h-full rounded-full transition-[width] duration-300"
              style={{
                width: `${Math.min(100, util)}%`,
                background: util > 100 ? C.bad : C.brand,
              }}
            />
          </div>
          <div className="mt-2">
            {[
              [
                "Monthly allowance",
                <>
                  {fmt(budget)} cr{" "}
                  <span style={{ color: C.ink3, fontWeight: 500 }}>
                    ≈ {money0(budget * USD_PER_CREDIT)}
                  </span>
                </>,
              ],
              ["Used this month", `${fmt(thisMonth.credits)} cr`],
              ["Remaining", `${fmt(Math.max(0, budget - thisMonth.credits))} cr`],
              ["Resets on", "1 Sep 2026"],
              ["Rollover unused", "Off"],
              ["On exhaustion", "Block & notify admin"],
            ].map(([k, v], i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 py-[7px] text-[12px]"
                style={{ borderTop: `1px solid ${C.line2}`, color: C.ink2 }}
              >
                <span>{k}</span>
                <b style={{ color: C.ink }}>{v}</b>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <Btn variant="primary" size="sm" onClick={() => onOpenModal("budget", m.email)}>
              Edit override
            </Btn>
            <Btn size="sm">View change log</Btn>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap gap-1 px-3 pt-2.5" style={{ borderBottom: `1px solid ${C.line}` }}>
          {(
            [
              ["gen", "Generations", ev.length],
              ["canvas", "Canvases / Sessions", a.sessions],
              ["tag", "By project tag", Object.keys(byTag).length],
              ["tx", "Credit transactions", null],
            ] as [TabKey, string, number | null][]
          ).map(([k, label, n]) => {
            const on = tab === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => onTab(k)}
                className="-mb-px flex items-center gap-1.5 px-3 py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/25"
                style={{
                  color: on ? C.brandDark : C.ink2,
                  borderBottom: `2px solid ${on ? C.brand : "transparent"}`,
                }}
              >
                {label}
                {n !== null && (
                  <span
                    className="rounded-full px-1.5 py-px text-[10px] font-bold"
                    style={{ background: on ? C.brandSoft : C.line2, color: on ? C.brandDark : C.ink3 }}
                  >
                    {n}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {tab === "gen" && (
          <GenTab shown={shown} all={ev} genFilter={genFilter} onGenFilter={onGenFilter} />
        )}
        {tab === "canvas" && <CanvasTab ev={ev} />}
        {tab === "tag" && <TagTab byTag={byTag} />}
        {tab === "tx" && <TxTab budget={budget} ev={ev} />}
      </Card>
    </>
  );
}

function GenTab({
  shown,
  all,
  genFilter,
  onGenFilter,
}: {
  shown: GenEvent[];
  all: GenEvent[];
  genFilter: GenFilter;
  onGenFilter: (g: GenFilter) => void;
}) {
  const c = {
    all: all.length,
    video: all.filter((e) => e.kind === "video").length,
    image: all.filter((e) => e.kind === "image").length,
    agent: all.filter((e) => e.kind === "agent").length,
  };
  return (
    <>
      <div
        className="flex flex-wrap items-center gap-2 px-3.5 py-2.5"
        style={{ borderBottom: `1px solid ${C.line}` }}
      >
        <Seg
          value={genFilter}
          onChange={onGenFilter}
          items={[
            { k: "all" as const, label: `All ${c.all}` },
            { k: "video" as const, label: `Videos ${c.video}` },
            { k: "image" as const, label: `Images ${c.image}` },
            { k: "agent" as const, label: `Agent runs ${c.agent}` },
          ]}
        />
        <Fld>
          <select className={selectCls} aria-label="Filter by model" defaultValue="">
            <option value="">All models</option>
            {COST_MODEL.map((m) => (
              <option key={m.k}>{m.label}</option>
            ))}
          </select>
        </Fld>
        <Fld>
          <select className={selectCls} aria-label="Filter by outcome" defaultValue="">
            <option value="">All outcomes</option>
            <option>Succeeded</option>
            <option>Failed</option>
          </select>
        </Fld>
        <div className="flex-1" />
        <Btn size="sm">
          <Download size={12} /> Export list
        </Btn>
      </div>

      <div className="px-3.5 pt-3.5">
        <Callout>
          This is the answer to &ldquo;what did they actually make with the tokens?&rdquo; — every
          render with its thumbnail, prompt, model, project tag, credits <b>and cash cost</b>.
          Today&rsquo;s View History only shows the deduction line, which can&rsquo;t tell waste
          from real work.
        </Callout>
      </div>

      <div className="grid gap-3 p-3.5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        {shown.slice(0, 24).map((e, i) => (
          <GenCard key={i} e={e} />
        ))}
        {shown.length === 0 && (
          <div className="col-span-full py-10 text-center text-[12px]" style={{ color: C.ink3 }}>
            Nothing of this kind in the period.
          </div>
        )}
      </div>

      <div
        className="px-3.5 py-2.5 text-[11.5px]"
        style={{ color: C.ink2, borderTop: `1px solid ${C.line}` }}
      >
        Showing {Math.min(24, shown.length)} of {shown.length} generations in period
      </div>
    </>
  );
}

function GenCard({ e }: { e: GenEvent }) {
  const bg = `linear-gradient(150deg,hsl(${e.hue} 62% 58%),hsl(${e.hue2} 58% 34%))`;
  const failed = e.status === "failed";
  return (
    <div className="overflow-hidden rounded-lg" style={{ border: `1px solid ${C.line}` }}>
      <div
        className="relative flex items-center justify-center"
        style={{
          background: bg,
          aspectRatio: e.kind === "image" ? "1 / 1" : "9 / 12",
          filter: failed ? "grayscale(.85) brightness(.8)" : undefined,
        }}
      >
        <span
          className="absolute top-1.5 left-1.5 rounded px-1.5 py-px text-[8.5px] font-extrabold tracking-[0.06em] text-white"
          style={{ background: "rgba(15,23,42,.45)" }}
        >
          {e.kind.toUpperCase()}
        </span>
        {e.kind === "video" && (
          <>
            <Play size={20} className="text-white/85" fill="currentColor" />
            <span
              className="absolute right-1.5 bottom-1.5 rounded px-1.5 py-px text-[9px] font-bold text-white"
              style={{ background: "rgba(15,23,42,.55)", fontFamily: MONO }}
            >
              {e.dur}
            </span>
          </>
        )}
        {e.kind === "agent" && <MessageSquare size={18} className="text-white/85" />}
        {e.kind === "image" && <ImageIcon size={18} className="text-white/70" />}
        {failed && (
          <span
            className="absolute bottom-1.5 left-1.5 rounded px-1.5 py-px text-[9px] font-extrabold text-white"
            style={{ background: C.bad }}
          >
            FAILED
          </span>
        )}
      </div>
      <div className="p-2">
        <p
          className="line-clamp-2 text-[11px] leading-[1.45] font-medium"
          style={{ color: C.ink }}
          title={e.prompt}
        >
          {e.prompt}
        </p>
        <div className="mt-1.5 flex items-center justify-between gap-1">
          <Tag tone="mut">{e.tag}</Tag>
          <span className="text-[10px]" style={{ color: C.ink3 }}>
            {dstr(dOffset(DAYS - 1 - e.day))}
          </span>
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-1">
          <span className="truncate text-[10px]" style={{ color: C.ink3 }}>
            {e.model.label}
          </span>
          <b className="text-[10.5px] whitespace-nowrap" style={{ color: C.ink }}>
            {e.credits} cr <span style={{ color: C.brandDark }}>· {money(e.usd)}</span>
          </b>
        </div>
      </div>
    </div>
  );
}

const thCls = "px-2.5 py-2 text-left text-[10.5px] font-bold tracking-[0.04em] uppercase";
const tdCls = "px-2.5 py-2 text-[12px] align-middle";

function CanvasTab({ ev }: { ev: GenEvent[] }) {
  const bySess: Record<
    string,
    { n: number; c: number; u: number; day: number; tag: string; prompt: string; v: number }
  > = {};
  ev.forEach((e) => {
    bySess[e.sess] = bySess[e.sess] || {
      n: 0,
      c: 0,
      u: 0,
      day: e.day,
      tag: e.tag,
      prompt: e.prompt,
      v: 0,
    };
    const s = bySess[e.sess];
    s.n++;
    s.c += e.credits;
    s.u += e.usd;
    if (e.kind === "video") s.v++;
    if (e.day > s.day) s.day = e.day;
  });
  const arr = Object.entries(bySess)
    .sort((a, b) => b[1].u - a[1].u)
    .slice(0, 14);
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: 900 }}>
          <thead style={{ background: "#FBFCFE" }}>
            <tr style={{ color: C.ink3 }}>
              {["Canvas / session", "Opening brief", "Project tag"].map((h) => (
                <th key={h} className={thCls} style={{ borderBottom: `1px solid ${C.line}` }}>
                  {h}
                </th>
              ))}
              {["Renders", "Videos kept", "Credits", "Real cost", "Last touched"].map((h) => (
                <th
                  key={h}
                  className={`${thCls} text-right`}
                  style={{ borderBottom: `1px solid ${C.line}` }}
                >
                  {h}
                </th>
              ))}
              <th className={thCls} style={{ borderBottom: `1px solid ${C.line}` }} />
            </tr>
          </thead>
          <tbody>
            {arr.map(([id, s]) => (
              <tr key={id} style={{ borderBottom: `1px solid ${C.line2}` }}>
                <td className={tdCls} style={{ fontFamily: MONO, fontWeight: 700, color: C.ink }}>
                  {id}
                </td>
                <td className={`${tdCls} max-w-[290px] truncate`} style={{ color: C.ink2 }}>
                  {s.prompt}
                </td>
                <td className={tdCls}>
                  <Tag tone="mut">{s.tag}</Tag>
                </td>
                <td className={`${tdCls} text-right`} style={{ fontFamily: MONO }}>
                  {s.n}
                </td>
                <td className={`${tdCls} text-right`} style={{ fontFamily: MONO }}>
                  {s.v}
                </td>
                <td className={`${tdCls} text-right`} style={{ fontFamily: MONO }}>
                  {fmt(Math.round(s.c))}
                </td>
                <td
                  className={`${tdCls} text-right`}
                  style={{ fontFamily: MONO, color: C.brandDark, fontWeight: 700 }}
                >
                  {money(s.u)}
                </td>
                <td className={`${tdCls} text-right`} style={{ color: C.ink2 }}>
                  {dstr(dOffset(DAYS - 1 - s.day))}
                </td>
                <td className={tdCls}>
                  <Btn size="sm">Open canvas ↗</Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div
        className="px-3.5 py-2.5 text-[11px] leading-[1.6]"
        style={{ color: C.ink3, borderTop: `1px solid ${C.line}` }}
      >
        <b style={{ color: C.ink2 }}>Renders vs videos kept</b> is the efficiency read — 14 renders
        for 1 keeper is a prompting problem worth coaching, not a budget problem.
      </div>
    </>
  );
}

function TagTab({ byTag }: { byTag: Record<string, { c: number; u: number; n: number }> }) {
  const arr = Object.entries(byTag).sort((a, b) => b[1].u - a[1].u);
  const tot = arr.reduce((a, b) => a + b[1].u, 0) || 1;
  return (
    <>
      <div className="p-3.5">
        <Callout>
          From the 24 Jul note: let users tag a run with a <b>project / reference code</b> at
          generation time, then cost rolls up per project here and in Project Tags — so finance can
          attribute internal AIGC video cost to the right client job.
        </Callout>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: 720 }}>
          <thead style={{ background: "#FBFCFE" }}>
            <tr style={{ color: C.ink3 }}>
              <th className={thCls} style={{ borderBottom: `1px solid ${C.line}` }}>
                Project / reference code
              </th>
              {["Generations", "Credits", "Real cost"].map((h) => (
                <th
                  key={h}
                  className={`${thCls} text-right`}
                  style={{ borderBottom: `1px solid ${C.line}` }}
                >
                  {h}
                </th>
              ))}
              <th
                className={thCls}
                style={{ borderBottom: `1px solid ${C.line}`, width: 220 }}
              >
                Share of this member&rsquo;s spend
              </th>
            </tr>
          </thead>
          <tbody>
            {arr.map(([t, v]) => (
              <tr key={t} style={{ borderBottom: `1px solid ${C.line2}` }}>
                <td className={tdCls}>
                  <Tag tone={t === "INTERNAL-TEST" ? "warn" : "info"}>{t}</Tag>
                </td>
                <td className={`${tdCls} text-right`} style={{ fontFamily: MONO }}>
                  {v.n}
                </td>
                <td className={`${tdCls} text-right`} style={{ fontFamily: MONO }}>
                  {fmt(Math.round(v.c))}
                </td>
                <td
                  className={`${tdCls} text-right`}
                  style={{ fontFamily: MONO, color: C.brandDark, fontWeight: 700 }}
                >
                  {money(v.u)}
                </td>
                <td className={tdCls}>
                  <Bar pct={(v.u / tot) * 100} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function TxTab({ budget, ev }: { budget: number; ev: GenEvent[] }) {
  // 先把余额一次算完,渲染时只读 —— 不在 render 里累减
  const opening = budget - Math.round(ev.reduce((a, e) => a + e.credits, 0) * 0.3);
  const rowsx = ev.slice(0, 18).reduce<{ e: GenEvent; bal: number }[]>((acc, e) => {
    const prev = acc.length ? acc[acc.length - 1].bal : opening;
    return [...acc, { e, bal: prev - e.credits }];
  }, []);
  return (
    <>
      <div className="p-3.5">
        <Callout>
          Kept as-is from today&rsquo;s screen, but each line now links to the artefact it produced
          and shows the cash cost — so the ledger and the gallery agree.
        </Callout>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: 900 }}>
          <thead style={{ background: "#FBFCFE" }}>
            <tr style={{ color: C.ink3 }}>
              {["ID", "Type", "Detail"].map((h) => (
                <th key={h} className={thCls} style={{ borderBottom: `1px solid ${C.line}` }}>
                  {h}
                </th>
              ))}
              {["Credits", "Real cost", "Balance after"].map((h) => (
                <th
                  key={h}
                  className={`${thCls} text-right`}
                  style={{ borderBottom: `1px solid ${C.line}` }}
                >
                  {h}
                </th>
              ))}
              {["Output", "Project"].map((h) => (
                <th key={h} className={thCls} style={{ borderBottom: `1px solid ${C.line}` }}>
                  {h}
                </th>
              ))}
              <th
                className={`${thCls} text-right`}
                style={{ borderBottom: `1px solid ${C.line}` }}
              >
                Date
              </th>
            </tr>
          </thead>
          <tbody>
            {rowsx.map(({ e, bal }, i) => {
              return (
                <tr key={i} style={{ borderBottom: `1px solid ${C.line2}` }}>
                  <td className={tdCls} style={{ fontFamily: MONO, color: C.ink3 }}>
                    #{65218 - i * 3}
                  </td>
                  <td className={tdCls}>
                    <Tag tone="bad">Consume</Tag>
                  </td>
                  <td className={tdCls} style={{ color: C.ink2 }}>
                    {e.model.label}
                  </td>
                  <td
                    className={`${tdCls} text-right`}
                    style={{ fontFamily: MONO, color: "#B32328" }}
                  >
                    -{e.credits}
                  </td>
                  <td
                    className={`${tdCls} text-right`}
                    style={{ fontFamily: MONO, color: C.brandDark, fontWeight: 700 }}
                  >
                    {money(e.usd)}
                  </td>
                  <td className={`${tdCls} text-right`} style={{ fontFamily: MONO }}>
                    {fmt(Math.max(0, bal))}
                  </td>
                  <td className={tdCls}>
                    <span style={{ color: C.brandDark, fontWeight: 600 }}>
                      {e.kind === "video" ? "▶ video" : e.kind === "image" ? "🖼 image" : "💬 log"}
                    </span>
                  </td>
                  <td className={tdCls}>
                    <Tag tone="mut">{e.tag}</Tag>
                  </td>
                  <td className={`${tdCls} text-right`} style={{ color: C.ink2 }}>
                    {dstr(dOffset(DAYS - 1 - e.day))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
