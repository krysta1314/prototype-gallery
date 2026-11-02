/* 分镜表:Time / Shot / Source,下面一行灰字是这一镜的旁白。方案卡与成片卡共用;footer 放按钮。 */

import type { ReactNode } from "react";
import { fmtRange, type StoryRow } from "../logic/storyboard";

export function Storyboard({ rows, credits, footer }: { rows: StoryRow[]; credits?: number; footer?: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#ececf1] bg-white">
      <table className="w-full text-left text-[13px]">
        <thead className="bg-[#f6f7f9] text-[12px] font-semibold text-[#6a6b7b]">
          <tr>
            <th className="w-[96px] px-4 py-2">Time</th>
            <th className="px-4 py-2">Shot</th>
            <th className="w-[96px] px-4 py-2">Source</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-[#ececf1] align-top">
              <td className="px-4 py-2.5 tabular-nums text-[#6a6b7b]">{fmtRange(r.start, r.end)}</td>
              <td className="px-4 py-2.5 text-[#1a1a2e]">
                {r.content}
                {r.line && <span className="mt-0.5 block text-[12px] text-[#9a9bb0]">“{r.line}”</span>}
              </td>
              <td className="px-4 py-2.5">
                <span
                  className={`rounded-full px-2 py-[2px] text-[11.5px] font-semibold ${
                    r.source === "AI" ? "bg-[#fff3ec] text-[#d24f14]" : "bg-[#f1f2f5] text-[#4a4b5c]"
                  }`}
                >
                  {r.source}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {(credits !== undefined || footer) && (
        <div className="flex items-center gap-2 border-t border-[#ececf1] px-4 py-3">
          {credits !== undefined && <span className="text-[12.5px] tabular-nums text-[#6a6b7b]">Estimated {credits} credits</span>}
          <span className="ml-auto flex items-center gap-2">{footer}</span>
        </div>
      )}
    </div>
  );
}
