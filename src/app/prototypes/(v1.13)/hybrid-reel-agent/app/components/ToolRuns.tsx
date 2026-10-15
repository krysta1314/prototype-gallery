"use client";

/* Generate 后的折叠工具调用行:按 schedule 的时间点逐行出现、转圈、打勾;每行可展开看入参。
   挂载即开始跑,全部结束调用 onDone 一次。 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import type { Outline } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";
import { schedule, toolRuns } from "../logic/runs";

export function ToolRuns({ outline, onDone, onProgress, settled = false }: { outline: Outline; onDone: () => void; onProgress?: () => void; settled?: boolean }) {
  const runs = useMemo(() => toolRuns(outline), [outline]);
  const slots = useMemo(() => schedule(runs), [runs]);
  const [now, setNow] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const done = useRef(false);
  const total = Math.max(...slots.map((s) => s.endMs));

  useEffect(() => {
    if (settled) return; // 已结算:不计时、不回调
    const t0 = performance.now();
    const timer = window.setInterval(() => {
      const t = performance.now() - t0;
      setNow(t);
      if (t >= total && !done.current) {
        done.current = true;
        window.clearInterval(timer);
        onDone();
      }
    }, 100);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clock = settled ? Infinity : now;
  const visible = slots.filter((s) => clock >= s.startMs).length;
  useEffect(() => {
    if (!settled) onProgress?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  return (
    <div className="space-y-2">
      {runs.map((r, i) => {
        const slot = slots[i];
        if (clock < slot.startMs) return null;
        const finished = clock >= slot.endMs;
        const expanded = open === r.id;
        return (
          <div key={r.id} className="rounded-xl border border-[#ececf1] bg-white">
            <button
              type="button"
              onClick={() => setOpen(expanded ? null : r.id)}
              disabled={!r.detail}
              aria-expanded={expanded}
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[13px] text-[#1a1a2e]"
            >
              <span className="grid size-5 place-items-center rounded-full bg-[#f1f2f5] text-[10px] font-bold text-[#6a6b7b]">B</span>
              {r.label}
              <span className="ml-auto flex items-center gap-2 text-[#9a9bb0]">
                {finished ? <Check className="size-4 text-[#1a7f4b]" /> : <Loader2 className="size-4 animate-spin" />}
                {r.detail && <ChevronDown className={`size-4 transition ${expanded ? "rotate-180" : ""}`} />}
              </span>
            </button>
            {expanded && r.detail && (
              <p className="border-t border-[#ececf1] px-3 py-2.5 text-[12.5px] leading-relaxed text-[#6a6b7b]">{r.detail}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
