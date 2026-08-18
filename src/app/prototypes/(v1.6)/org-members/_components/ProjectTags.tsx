"use client";

import { CalendarDays, Download } from "lucide-react";
import { PERIODS, PERIOD_KEYS, dstr, fmt, idxOfDate, money } from "../_lib/agg";
import { MEMBERS } from "../_lib/seed";
import type { PeriodKey } from "../_lib/types";
import { Bar, Btn, C, Card, Fld, MONO, Seg, Tag, selectCls } from "./ui";

type Acc = { c: number; u: number; n: number; v: number; people: Set<string> };

export function ProjectTags({
  period,
  onPeriod,
}: {
  period: PeriodKey;
  onPeriod: (p: PeriodKey) => void;
}) {
  const P = PERIODS[period];
  const from = idxOfDate(P.from);
  const to = idxOfDate(P.to);
  const acc: Record<string, Acc> = {};
  MEMBERS.forEach((m) =>
    m.events.forEach((e) => {
      if (e.day < from || e.day > to) return;
      acc[e.tag] = acc[e.tag] || { c: 0, u: 0, n: 0, v: 0, people: new Set<string>() };
      const t = acc[e.tag];
      t.c += e.credits;
      t.u += e.usd;
      t.n++;
      if (e.kind === "video") t.v++;
      t.people.add(m.name);
    }),
  );
  const arr = Object.entries(acc).sort((a, b) => b[1].u - a[1].u);
  const tot = arr.reduce((a, b) => a + b[1].u, 0) || 1;

  const th = "px-2.5 py-2 text-left text-[10.5px] font-bold tracking-[0.04em] uppercase";
  const td = "px-2.5 py-2 text-[12px] align-middle";

  return (
    <>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-[720px]">
          <h1 className="text-[20px] font-extrabold tracking-tight" style={{ color: C.ink }}>
            Project Tags · 專案成本歸屬
          </h1>
          <p className="mt-1.5 text-[12px] leading-[1.65]" style={{ color: C.ink2 }}>
            From the 27 Jul note: users optionally attach a <b>reference / project code</b> when
            they generate. Cost then rolls up per project with a date picker, so internal AIGC video
            cost can be charged to the right client job instead of sitting in one lump.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Btn>Manage tag list</Btn>
          <Btn variant="primary">
            <Download size={13} /> Finance export
          </Btn>
        </div>
      </div>

      <Card>
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
          <div className="flex-1" />
          <Fld>
            <select className={selectCls} aria-label="Group by" defaultValue="">
              <option value="">Group by project</option>
              <option>Group by brand</option>
              <option>Group by department</option>
            </select>
          </Fld>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: 1000 }}>
            <thead style={{ background: "#FBFCFE" }}>
              <tr style={{ color: C.ink3 }}>
                {["Project / reference code", "Contributors"].map((h) => (
                  <th key={h} className={th} style={{ borderBottom: `1px solid ${C.line}` }}>
                    {h}
                  </th>
                ))}
                {["Generations", "Videos", "Credits", "Real cost", "Cost / video"].map((h) => (
                  <th
                    key={h}
                    className={`${th} text-right`}
                    style={{ borderBottom: `1px solid ${C.line}` }}
                  >
                    {h}
                  </th>
                ))}
                <th className={th} style={{ borderBottom: `1px solid ${C.line}`, width: 180 }}>
                  Share
                </th>
                <th className={th} style={{ borderBottom: `1px solid ${C.line}` }} />
              </tr>
            </thead>
            <tbody>
              {arr.map(([t, v]) => (
                <tr key={t} style={{ borderBottom: `1px solid ${C.line2}` }}>
                  <td className={td}>
                    <Tag
                      tone={
                        t === "INTERNAL-TEST" ? "warn" : t.startsWith("SALES") ? "violet" : "info"
                      }
                    >
                      {t}
                    </Tag>
                  </td>
                  <td className={td} style={{ color: C.ink3 }}>
                    {[...v.people].slice(0, 3).join(", ")}
                    {v.people.size > 3 ? ` +${v.people.size - 3}` : ""}
                  </td>
                  <td className={`${td} text-right`} style={{ fontFamily: MONO }}>
                    {v.n}
                  </td>
                  <td className={`${td} text-right`} style={{ fontFamily: MONO }}>
                    {v.v}
                  </td>
                  <td className={`${td} text-right`} style={{ fontFamily: MONO }}>
                    {fmt(Math.round(v.c))}
                  </td>
                  <td
                    className={`${td} text-right`}
                    style={{ fontFamily: MONO, color: C.brandDark, fontWeight: 700 }}
                  >
                    {money(v.u)}
                  </td>
                  <td className={`${td} text-right`} style={{ fontFamily: MONO }}>
                    {v.v ? money(v.u / v.v) : "—"}
                  </td>
                  <td className={td}>
                    <Bar pct={(v.u / tot) * 100} />
                  </td>
                  <td className={td}>
                    <Btn size="sm">View outputs</Btn>
                  </td>
                </tr>
              ))}
              {arr.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-[12px]" style={{ color: C.ink3 }}>
                    No tagged generations in this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div
          className="px-3.5 py-2.5 text-[11px]"
          style={{ color: C.ink3, borderTop: `1px solid ${C.line}` }}
        >
          Untagged generations fall into <b style={{ color: C.ink2 }}>UNTAGGED</b> — keeping that
          share visible is how you get people to actually tag.
        </div>
      </Card>
    </>
  );
}
