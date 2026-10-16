"use client";

import { ArrowUpRight } from "lucide-react";
import { JOURNEYS, JOURNEY_GROUPS, type Journey } from "./journeys";

/** 左栏:按用户旅程分组的每一步。点一步,真机直接跳到那个状态 */
export default function JourneyNav({ current, onSelect }: { current: string; onSelect: (j: Journey) => void }) {
  return (
    <nav className="flex min-h-0 flex-col border-r border-black/[0.06] bg-[#f4f4f6]">
      <header className="px-5 pb-3 pt-5">
        <h1 className="text-[15px] font-semibold">BuzzVideo APP · 评审</h1>
        <p className="mt-1 text-[12px] leading-[18px] text-[#5f6070]">点任一步,真机直接跳到该状态;真机也可以自由点。</p>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        {JOURNEY_GROUPS.map((g) => (
          <section key={g} className="mt-3">
            <h2 className="px-2 pb-1 text-[12px] font-medium text-[#5f6070]">{g}</h2>
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
                        on ? "bg-white font-medium text-[#1a1a2e] shadow-[0_1px_2px_rgba(26,26,46,0.08)]" : "text-[#3a3b45] hover:bg-black/[0.04]"
                      }`}
                    >
                      {on ? <span className="mr-2 size-1.5 shrink-0 rounded-full bg-[#ff5e1a]" /> : <span className="mr-2 size-1.5 shrink-0" />}
                      {j.title}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
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
