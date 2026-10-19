"use client";

import { ArrowUpRight, TriangleAlert } from "lucide-react";
import { JOURNEYS, JOURNEY_GROUPS, type Journey } from "./journeys";

const EDGE_GROUP = "异常与边界";

/** 左栏:按用户旅程分组的每一步。点一步,真机直接跳到那个状态 */
export default function JourneyNav({ current, onSelect }: { current: string; onSelect: (j: Journey) => void }) {
  return (
    <nav className="flex min-h-0 flex-col border-r border-black/[0.06] bg-[#f4f4f6]">
      <header className="px-5 pb-3 pt-5">
        <h1 className="text-[15px] font-semibold">BuzzVideo APP · 评审</h1>
        <p className="mt-1 text-[12px] leading-[18px] text-[#5f6070]">点任一步,真机直接跳到该状态;真机也可以自由点。</p>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        {JOURNEY_GROUPS.map((g) => {
          // 异常与边界单独一种样式(暖色底 + 警示图标),和正常流程一眼区分开
          const edge = g === EDGE_GROUP;
          return (
          <section key={g} className={edge ? "mt-4 rounded-xl bg-[#fbefe4] p-1.5 ring-1 ring-[#f1d6bf]" : "mt-3"}>
            <h2 className={`flex items-center gap-1.5 px-2 pb-1 text-[12px] font-medium ${edge ? "pt-1 text-[#b4430f]" : "text-[#5f6070]"}`}>
              {edge ? <TriangleAlert size={13} strokeWidth={2.2} /> : null}
              {g}
            </h2>
            <ul>
              {JOURNEYS.filter((j) => j.group === g).map((j) => {
                const on = j.id === current;
                return (
                  <li key={j.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(j)}
                      aria-current={on ? "step" : undefined}
                      className={`flex w-full items-center rounded-lg px-2 py-[7px] text-left text-[13px] transition-colors focus-visible:outline-2 focus-visible:outline-[#ff5e1a] ${
                        on ? "bg-white font-medium text-[#1a1a2e] shadow-[0_1px_2px_rgba(26,26,46,0.08)]" : edge ? "text-[#5a3a28] hover:bg-[#f5e0cf]" : "text-[#3a3b45] hover:bg-black/[0.04]"
                      }`}
                    >
                      {on ? <span className={`mr-2 size-1.5 shrink-0 rounded-full ${edge ? "bg-[#d9480f]" : "bg-[#ff5e1a]"}`} /> : <span className={`mr-2 size-1.5 shrink-0 rounded-full ${edge ? "bg-[#e9b894]" : ""}`} />}
                      {j.title}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
          );
        })}
      </div>
      <footer className="border-t border-black/[0.06] px-5 py-3">
        <a href="/prototypes/buzzvideo-app" className="inline-flex items-center gap-1 text-[12px] font-medium text-[#3a3b45] hover:text-[#ff5e1a]">
          开发原型(无外壳)
          <ArrowUpRight size={12} />
        </a>
      </footer>
    </nav>
  );
}
