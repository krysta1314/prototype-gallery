"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, ChevronLeft, FileText, Calendar, X, Search } from "lucide-react";

/* ---------- Brand helpers (design.md) ---------- */
const APPLE_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif';
const ctaGrad = "bg-gradient-to-r from-[#FFA73C] to-[#FF5255]";
const money = (n: number) =>
  "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });

/* ---------- Types ---------- */
type ResourceKind = "video" | "image" | "agent";
type Plan = "Free" | "Starter" | "Pro" | "Ultra";
type Status = "Completed" | "Processing" | "Failed";

type LineItem = { kind: ResourceKind | "storage"; config: string; unitPrice: number; usage: number; agentSessionId?: string };
type Canvas = { id: string; name: string; ownerId: string; month: string; items: LineItem[] };
type User = { id: string; name: string; email: string; plan: Plan };

/* ---------- Resource meta ---------- */
const RES: Record<ResourceKind, { label: string; color: string }> = {
  video: { label: "Video", color: "#ff5e1a" },
  image: { label: "Image", color: "#ffa73c" },
  agent: { label: "Agent", color: "#1f2030" },
};
const amountOf = (i: LineItem) => i.unitPrice * i.usage;

/* ---------- Users ---------- */
const USERS: User[] = [
  { id: "u1", name: "Sofia Almeida", email: "sofia@brightlabs.co", plan: "Ultra" },
  { id: "u2", name: "Marcus Chen", email: "marcus@loopmedia.io", plan: "Pro" },
  { id: "u3", name: "Priya Nair", email: "priya.nair@spark.studio", plan: "Starter" },
  { id: "u4", name: "Diego Ferreira", email: "diego@nomadcreative.co", plan: "Pro" },
  { id: "u5", name: "Hana Kobayashi", email: "hana.k@studiobloom.jp", plan: "Free" },
  { id: "u6", name: "Oliver Bennett", email: "oliver@northfieldads.com", plan: "Ultra" },
  { id: "u7", name: "Isabelle Laurent", email: "isabelle@atelierpixel.fr", plan: "Starter" },
  { id: "u8", name: "Tariq Ahmadi", email: "tariq@dunesocial.ae", plan: "Pro" },
  { id: "u9", name: "Wei Zhang", email: "wei.zhang@brightlabs.co", plan: "Free" },
];
const userById = (id: string) => USERS.find((u) => u.id === id)!;

/* ---------- Line-item builders (keep mock data compact) ---------- */
const V = (usage: number, config = "Seedance 2.5"): LineItem => ({
  kind: "video", config, unitPrice: config === "Seedance 2.5" ? 0.06 : 0.04, usage,
});
const I = (usage: number, config = "Seedream"): LineItem => ({
  kind: "image", config, unitPrice: config === "GPT-Image" ? 0.04 : 0.03, usage,
});
const A = (usage: number, sid: string): LineItem => ({
  kind: "agent", config: "Marketing Agent", unitPrice: 0.001, usage, agentSessionId: sid,
});

/* ---------- Mock canvases (3 months) ---------- */
const CANVASES: Canvas[] = [
  // ----- July 2026 -----
  { id: "CNV-4821", name: "Beverage Campaign", ownerId: "u1", month: "2026-07",
    items: [V(42), V(28, "Seedance 2.0"), I(120, "GPT-Image"), A(340, "AGT-9F3A21")] },
  { id: "CNV-4822", name: "Summer Skincare Launch", ownerId: "u1", month: "2026-07",
    items: [V(58), I(80), A(90, "AGT-7B2C40")] },
  { id: "CNV-5567", name: "Auto Dealer National Push", ownerId: "u6", month: "2026-07",
    items: [V(120), V(96, "Seedance 2.0"), I(210, "GPT-Image"), A(620, "AGT-2X4Y97")] },
  { id: "CNV-5568", name: "Fintech App Relaunch", ownerId: "u6", month: "2026-07",
    items: [V(85), I(150), A(410, "AGT-8H0N53")] },
  { id: "CNV-3390", name: "Fitness App Onboarding", ownerId: "u2", month: "2026-07",
    items: [V(36), I(60, "GPT-Image"), A(120, "AGT-3D8E15")] },
  { id: "CNV-3391", name: "Loop Promo Reel", ownerId: "u2", month: "2026-07",
    items: [V(24, "Seedance 2.0"), I(40)] },
  { id: "CNV-7654", name: "Travel Gear Teaser", ownerId: "u4", month: "2026-07",
    items: [V(64), I(90, "GPT-Image"), A(220, "AGT-5P7Q62")] },
  { id: "CNV-1029", name: "Holiday Gift Guide", ownerId: "u3", month: "2026-07",
    items: [V(18, "Seedance 2.0"), I(48)] },
  { id: "CNV-8813", name: "Perfume Teaser Series", ownerId: "u7", month: "2026-07",
    items: [V(30), I(52), A(70, "AGT-4T6U74")] },
  { id: "CNV-9931", name: "Ramadan Retail Push", ownerId: "u8", month: "2026-07",
    items: [V(46), I(66, "GPT-Image"), A(160, "AGT-1W9V36")] },
  { id: "CNV-2246", name: "Student Club Poster Set", ownerId: "u9", month: "2026-07",
    items: [I(12)] },
  // ----- June 2026 -----
  { id: "CNV-4501", name: "Autumn Denim Drop", ownerId: "u1", month: "2026-06",
    items: [V(38), I(60)] },
  { id: "CNV-6120", name: "Beverage Campaign", ownerId: "u4", month: "2026-06",
    items: [V(52), V(40, "Seedance 2.0"), I(88, "GPT-Image"), A(260, "AGT-6A1B22")] },
  { id: "CNV-6233", name: "Pet Food Rebrand", ownerId: "u3", month: "2026-06",
    items: [A(40, "AGT-6K1M88"), I(20)] },
  { id: "CNV-6890", name: "Auto Dealer Regional", ownerId: "u6", month: "2026-06",
    items: [V(74), I(110, "GPT-Image"), A(300, "AGT-9C3D77")] },
  { id: "CNV-6455", name: "Bookstore Loyalty Program", ownerId: "u7", month: "2026-06",
    items: [A(50, "AGT-4T6U80"), I(24)] },
  { id: "CNV-6712", name: "Fitness Q2 Recap", ownerId: "u2", month: "2026-06",
    items: [V(28), I(36)] },
  // ----- May 2026 -----
  { id: "CNV-5102", name: "Spring Lookbook", ownerId: "u1", month: "2026-05",
    items: [V(30), I(44)] },
  { id: "CNV-5340", name: "Personal Portfolio Refresh", ownerId: "u5", month: "2026-05",
    items: [I(10)] },
  { id: "CNV-5566", name: "Nomad Launch Teaser", ownerId: "u4", month: "2026-05",
    items: [V(48), I(70, "GPT-Image"), A(180, "AGT-3F8K10")] },
];

/* ---------- Date helpers ---------- */
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const pad = (n: number) => String(n).padStart(2, "0");
const inputStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dKey = (d: Date) => d.getFullYear() * 10000 + d.getMonth() * 100 + d.getDate();
const fmtDateTime = (d: Date) =>
  `${MONTH_ABBR[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
function buildMonth(year: number, month: number) {
  const first = new Date(year, month, 1);
  const cells: { date: Date; inMonth: boolean }[] = [];
  for (let i = first.getDay(); i > 0; i--) cells.push({ date: new Date(year, month, 1 - i), inMonth: false });
  const days = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= days; d++) cells.push({ date: new Date(year, month, d), inMonth: true });
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date;
    cells.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), inMonth: false });
  }
  return cells;
}

/* ---------- Generation records (flat, derived from canvases) ---------- */
type Rec = {
  id: string;
  canvasId: string;
  agentId?: string;
  ownerId: string;
  email: string;
  kind: ResourceKind;
  model: string;
  status: Status;
  cost: number;
  credits: number;
  created: Date;
  updated: Date;
};
const STATUS_CYCLE: Status[] = [
  "Completed", "Completed", "Completed", "Processing", "Completed", "Completed", "Failed", "Completed",
];
const RECORDS: Rec[] = (() => {
  const out: Rec[] = [];
  let seed = 0;
  for (const c of CANVASES) {
    const [y, m] = c.month.split("-").map(Number);
    for (const it of c.items) {
      if (it.kind === "storage") continue; // storage removed
      const owner = userById(c.ownerId);
      const cost = amountOf(it);
      const day = ((seed * 7) % 26) + 1;
      const hour = 8 + ((seed * 5) % 11);
      const min = (seed * 17) % 60;
      const created = new Date(y, m - 1, day, hour, min);
      const updated = new Date(created.getTime() + (3 + (seed % 22)) * 60000);
      out.push({
        id: `${c.id}-${seed}`,
        canvasId: c.id,
        agentId: it.agentSessionId,
        ownerId: c.ownerId,
        email: owner.email,
        kind: it.kind as ResourceKind,
        model: it.config,
        status: STATUS_CYCLE[seed % STATUS_CYCLE.length],
        cost,
        credits: Math.round(cost * 100),
        created,
        updated,
      });
      seed++;
    }
  }
  return out;
})();

const RES_OPTIONS: { value: "all" | ResourceKind; label: string }[] = [
  { value: "all", label: "All resources" },
  { value: "video", label: "Video" },
  { value: "image", label: "Image" },
  { value: "agent", label: "Agent" },
];
const STATUS_OPTIONS: { value: "all" | Status; label: string }[] = [
  { value: "all", label: "All status" },
  { value: "Completed", label: "Completed" },
  { value: "Processing", label: "Processing" },
  { value: "Failed", label: "Failed" },
];
const STATUS_STYLE: Record<Status, string> = {
  Completed: "bg-[#e9f7ef] text-[#1f9254]",
  Processing: "bg-[#fff3ec] text-[#ff5e1a]",
  Failed: "bg-[#fdecec] text-[#d64545]",
};

/* ---------- Small UI ---------- */
const selectCls =
  "h-9 rounded-lg border border-[#ececf1] bg-white pl-3 pr-8 text-sm text-[#1a1a2e] outline-none " +
  "focus-visible:border-[#ff5e1a] focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/20 appearance-none cursor-pointer";

export default function CanvasBillingPage() {
  const [start, setStart] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);
  const [qCanvas, setQCanvas] = useState("");
  const [qAgent, setQAgent] = useState("");
  const [qEmail, setQEmail] = useState("");
  const [resFilter, setResFilter] = useState<"all" | ResourceKind>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");

  const hasRange = !!(start && end);

  const records = useMemo(() => {
    const qc = qCanvas.trim().toLowerCase();
    const qa = qAgent.trim().toLowerCase();
    const qe = qEmail.trim().toLowerCase();
    const lo = hasRange ? dKey(start!) : null;
    const hi = hasRange ? dKey(end!) : null;
    return RECORDS.filter((r) => {
      if (lo !== null && (dKey(r.created) < lo || dKey(r.created) > hi!)) return false;
      if (resFilter !== "all" && r.kind !== resFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (qc && !r.canvasId.toLowerCase().includes(qc)) return false;
      if (qa && !(r.agentId ?? "").toLowerCase().includes(qa)) return false;
      if (qe && !r.email.toLowerCase().includes(qe)) return false;
      return true;
    }).sort((a, b) => b.created.getTime() - a.created.getTime());
  }, [qCanvas, qAgent, qEmail, hasRange, start, end, resFilter, statusFilter]);

  const totalCost = records.reduce((s, r) => s + r.cost, 0);

  return (
    <div className="min-h-screen bg-[#faf8f6] px-6 py-8" style={{ fontFamily: APPLE_FONT }}>
      <div className="mx-auto max-w-[1240px]">
        {/* ---------- Top bar (title + date range) ---------- */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-extrabold tracking-tight text-[#1a1a2e]">Bill details</h1>
          <DateRangePicker start={start} end={end} onChange={(s, e) => { setStart(s); setEnd(e); }} />
        </div>

        {/* ---------- Total cost ---------- */}
        <div className="mt-6 rounded-2xl border border-[#ececf1] bg-white p-6 shadow-[0_4px_16px_rgba(26,26,46,0.06)]">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#6a6b7b]">
            <span className={`flex h-5 w-5 items-center justify-center rounded ${ctaGrad}`}>
              <FileText className="h-3 w-3 text-white" />
            </span>
            Total cost
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tabular-nums text-[#1a1a2e]">{money(totalCost)}</span>
            <span className="text-sm font-semibold text-[#6a6b7b]">USD</span>
          </div>
        </div>

        {/* ---------- Filter bar ---------- */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <SearchInput value={qEmail} onChange={setQEmail} placeholder="Email" />
          <SearchInput value={qCanvas} onChange={setQCanvas} placeholder="Canvas ID" />
          <SearchInput value={qAgent} onChange={setQAgent} placeholder="Agent ID" />

          <div className="relative">
            <select value={resFilter} onChange={(e) => setResFilter(e.target.value as "all" | ResourceKind)} className={selectCls}>
              {RES_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#a9aab6]" />
          </div>

          <div className="relative">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "all" | Status)} className={selectCls}>
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#a9aab6]" />
          </div>

          <span className="ml-auto text-sm text-[#6a6b7b]">
            <span className="font-semibold tabular-nums text-[#1a1a2e]">{records.length}</span> records
          </span>
        </div>

        {/* ---------- Records table ---------- */}
        <div className="mt-3 overflow-x-auto rounded-2xl border border-[#ececf1] bg-white shadow-[0_4px_16px_rgba(26,26,46,0.06)]">
          <table className="w-full min-w-[1080px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#ececf1] text-left text-[11px] font-semibold uppercase tracking-wide text-[#a9aab6]">
                <th className="px-4 py-3">Canvas ID</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Model</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Cost</th>
                <th className="px-4 py-3 text-right">Credits</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-b border-[#f1f1f4] transition last:border-0 hover:bg-[#fff7f1]">
                  <td className="px-4 py-3 font-mono font-semibold text-[#1a1a2e]">{r.canvasId}</td>
                  <td className="px-4 py-3 text-[#6a6b7b]">{r.email}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2 text-[#1a1a2e]">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: RES[r.kind].color }} />
                      {r.model}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[r.status]}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-[#1a1a2e]">{money(r.cost)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-[#6a6b7b]">{r.credits.toLocaleString("en-US")}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-[#6a6b7b]">{fmtDateTime(r.created)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-[#6a6b7b]">{fmtDateTime(r.updated)}</td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-14 text-center text-[#6a6b7b]">
                    No records match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-6 text-[13px] text-[#6a6b7b]">
          内部成本记录原型 · 最小统计单位为 Canvas。数据为演示 mock,金额为示意真实模型成本($)。
          平铺的生成记录表,三个独立搜索框(Canvas ID / Agent ID / Email)+ 按 Resource·Status 筛选 + 选日期范围(按 Created 过滤,默认全部)。
        </p>
      </div>
    </div>
  );
}

/* ---------- Search input (Canvas ID / Agent ID / Email) ---------- */
function SearchInput({
  value, onChange, placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a9aab6]" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-[180px] rounded-lg border border-[#ececf1] bg-white pl-9 pr-3 text-sm text-[#1a1a2e] outline-none placeholder:text-[#a9aab6] focus-visible:border-[#ff5e1a] focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/20"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#a9aab6] transition hover:text-[#1a1a2e]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

/* ---------- Dual-month date range picker ---------- */
function DateRangePicker({
  start, end, onChange,
}: {
  start: Date | null;
  end: Date | null;
  onChange: (s: Date | null, e: Date | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState({
    year: (start ?? new Date(2026, 6, 1)).getFullYear(),
    month: (start ?? new Date(2026, 6, 1)).getMonth(),
  });
  const [tmpStart, setTmpStart] = useState<Date | null>(start);
  const [tmpEnd, setTmpEnd] = useState<Date | null>(end);

  const openPicker = () => {
    setTmpStart(start);
    setTmpEnd(end);
    const base = start ?? new Date(2026, 6, 1);
    setView({ year: base.getFullYear(), month: base.getMonth() });
    setOpen(true);
  };

  const pick = (d: Date) => {
    if (!tmpStart || (tmpStart && tmpEnd)) {
      setTmpStart(d);
      setTmpEnd(null);
      return;
    }
    if (dKey(d) < dKey(tmpStart)) {
      setTmpStart(d);
      return;
    }
    setTmpEnd(d);
    onChange(tmpStart, d);
    setOpen(false);
  };

  const cellState = (d: Date): "edge" | "mid" | "none" => {
    const k = dKey(d);
    const s = tmpStart ? dKey(tmpStart) : null;
    const e = tmpEnd ? dKey(tmpEnd) : null;
    if (s !== null && e !== null) {
      if (k === s || k === e) return "edge";
      if (k > s && k < e) return "mid";
    } else if (s !== null && k === s) return "edge";
    return "none";
  };

  const renderMonth = (year: number, month: number) => (
    <div className="w-[224px]">
      <div className="mb-2 text-center text-sm font-bold text-[#1a1a2e]">{MONTH_FULL[month]} {year}</div>
      <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-[#a9aab6]">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1">{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {buildMonth(year, month).map((c, i) => {
          const st = cellState(c.date);
          return (
            <button
              key={i}
              type="button"
              onClick={() => pick(c.date)}
              className={[
                "mx-auto flex h-8 w-8 items-center justify-center text-sm transition",
                st === "edge"
                  ? "rounded-full bg-[#ff5e1a] font-bold text-white"
                  : st === "mid"
                  ? "bg-[#fff3ec] text-[#ff5e1a]"
                  : c.inMonth
                  ? "rounded-full text-[#1a1a2e] hover:bg-[#f1f1f4]"
                  : "rounded-full text-[#c9cad3] hover:bg-[#f1f1f4]",
              ].join(" ")}
            >
              {c.date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );

  const rightView = { year: view.month === 11 ? view.year + 1 : view.year, month: (view.month + 1) % 12 };
  const prev = () => setView((v) => ({ year: v.month === 0 ? v.year - 1 : v.year, month: (v.month + 11) % 12 }));
  const next = () => setView((v) => ({ year: v.month === 11 ? v.year + 1 : v.year, month: (v.month + 1) % 12 }));

  const hasRange = !!(start && end);

  return (
    <div className="relative inline-block">
      <div className="flex h-10 items-center gap-2 rounded-lg border border-[#ececf1] bg-white px-3 text-sm text-[#1a1a2e] transition hover:border-[#d4d3df]">
        <button type="button" onClick={() => (open ? setOpen(false) : openPicker())} className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[#a9aab6]" />
          {hasRange ? (
            <span className="font-semibold tabular-nums">{inputStr(start!)} ~ {inputStr(end!)}</span>
          ) : (
            <span className="text-[#a9aab6]">Select date range</span>
          )}
        </button>
        {hasRange && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(null, null); setTmpStart(null); setTmpEnd(null); setOpen(false); }}
            className="text-[#a9aab6] transition hover:text-[#1a1a2e]"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-50 rounded-2xl border border-[#ececf1] bg-white p-4 shadow-[0_16px_40px_rgba(26,26,46,0.16)]">
            <div className="flex items-start gap-3">
              <button type="button" onClick={prev} className="mt-0.5 rounded p-1 text-[#6a6b7b] transition hover:bg-[#f1f1f4]">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex gap-6">
                {renderMonth(view.year, view.month)}
                {renderMonth(rightView.year, rightView.month)}
              </div>
              <button type="button" onClick={next} className="mt-0.5 rounded p-1 text-[#6a6b7b] transition hover:bg-[#f1f1f4]">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
