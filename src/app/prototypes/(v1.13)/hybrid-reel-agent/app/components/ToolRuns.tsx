"use client";

/* Generate 后的折叠工具调用行:按 schedule 的时间点逐行出现、转圈、打勾;每行可展开看入参。
   live 时挂载即开始跑:把计时器登记给 provider(Stop 读它),失败镜头到点报 onShotFailed,全部结束调用 onDone 一次。
   顶部 "Step {i} of {n}";失败行红叉 + 原因;停止后停在当时那一行。 */

import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { Check, ChevronDown, CircleStop, X } from "lucide-react";
import { BuzzThinking } from "@/app/prototypes/(v1.13)/buzz-loader/BuzzThinking";
import { genShot, rowStates, schedule, stepOf, toolRuns, totalMs } from "../logic/runs";
import type { RunsMsg } from "../store";

export function ToolRuns({
  run,
  live,
  clockRef,
  onDone,
  onShotFailed,
  onProgress,
}: {
  run: RunsMsg;
  /** 正在跑(否则按结算状态静态显示:跑完 / 停在 stoppedAtMs) */
  live: boolean;
  clockRef?: MutableRefObject<() => number>;
  onDone: () => void;
  onShotFailed?: (shot: number) => void;
  onProgress?: () => void;
}) {
  const runs = useMemo(() => toolRuns(run.outline, { only: run.only }), [run.outline, run.only]);
  const slots = useMemo(() => schedule(runs), [runs]);
  const [now, setNow] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const done = useRef(false);
  const reported = useRef(new Set<number>());
  const total = totalMs(slots);

  useEffect(() => {
    if (!live) return; // 已结算:不计时、不回调
    const t0 = performance.now();
    if (clockRef) clockRef.current = () => performance.now() - t0;
    const timer = window.setInterval(() => {
      const t = performance.now() - t0;
      setNow(t);
      for (const f of run.fail ?? []) {
        const slot = slots.find((s) => genShot(s.id) === f.shot);
        if (slot && t >= slot.endMs && !reported.current.has(f.shot)) {
          reported.current.add(f.shot);
          onShotFailed?.(f.shot);
        }
      }
      if (t >= total && !done.current) {
        done.current = true;
        window.clearInterval(timer);
        onDone();
      }
    }, 100);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live]);

  const clock = live ? now : Infinity;
  const states = rowStates(runs, slots, clock, run.fail, run.stoppedAtMs);
  const visible = states.filter((s) => s !== "hidden").length;
  useEffect(() => {
    if (live) onProgress?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const { i, n } = stepOf(states);
  const stopped = run.stoppedAtMs !== undefined;

  return (
    <div className="space-y-2">
      <p className="text-[12.5px] tabular-nums text-[#9a9bb0]">{stopped ? `Stopped at step ${i} of ${n}` : `Step ${i} of ${n}`}</p>
      {runs.map((r, k) => {
        const st = states[k];
        if (st === "hidden") return null;
        const expanded = open === r.id;
        const reason = st === "failed" ? run.fail?.find((f) => f.shot === genShot(r.id))?.reason : undefined;
        return (
          <div key={r.id} className={`rounded-xl border bg-white ${st === "failed" ? "border-[#ffd0d1]" : "border-[#ececf1]"}`}>
            <button
              type="button"
              onClick={() => setOpen(expanded ? null : r.id)}
              disabled={!r.detail}
              aria-expanded={expanded}
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[13px] text-[#1a1a2e]"
            >
              <span className="grid size-5 place-items-center rounded-full bg-[#f1f2f5] text-[10px] font-bold text-[#6a6b7b]">B</span>
              <span className="min-w-0">
                {r.label}
                {genShot(r.id) !== undefined && <span className="text-[#9a9bb0]"> · Shot {genShot(r.id)}</span>}
                {reason && <span className="block text-[12px] text-[#e5484d]">{reason}</span>}
              </span>
              <span className="ml-auto flex items-center gap-2 text-[#9a9bb0]">
                {st === "done" && <Check className="size-4 text-[#1a7f4b]" />}
                {st === "running" && <BuzzThinking state="running" size={13} showLabel={false} />}
                {st === "failed" && <X aria-label="Failed" className="size-4 text-[#e5484d]" />}
                {st === "stopped" && (
                  <span className="flex items-center gap-1 text-[12px]">
                    <CircleStop className="size-4" /> Stopped
                  </span>
                )}
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
