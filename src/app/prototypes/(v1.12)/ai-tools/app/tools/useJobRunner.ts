"use client";

/* 跑 running 的 job:每条 job 的每次开跑(id + startedAt)只调一次 api。
   成功 → done;失败 → failed + 全额退积分(wallet.refund)。卸载时全部中止(中止的不算失败、不退不扣)。
   写法同 UpscaleTool 的 inflight(StrictMode 下重挂载会中止再重跑,不会重复退款)。 */

import { useEffect, useRef } from "react";
import type { ToolTask, ToolsApi } from "./api";
import type { ToolJob } from "./jobs";

export function useJobRunner<I>({
  jobs,
  api,
  task,
  onDone,
  onFail,
}: {
  jobs: ToolJob<I>[];
  api: ToolsApi;
  /** 这条 job 调哪个任务;返回 null = 不用跑模型(直接 done) */
  task: (j: ToolJob<I>) => ToolTask | null;
  onDone: (j: ToolJob<I>) => void;
  onFail: (j: ToolJob<I>) => void;
}) {
  const inflight = useRef(new Map<string, AbortController>());
  /* 回调放 ref,免得每次渲染都重跑 effect */
  const cb = useRef({ task, onDone, onFail });
  useEffect(() => {
    cb.current = { task, onDone, onFail };
  });

  useEffect(() => {
    for (const j of jobs) {
      if (j.status !== "running") continue;
      const key = `${j.id}:${j.startedAt}`;
      if (inflight.current.has(key)) continue;
      const ac = new AbortController();
      inflight.current.set(key, ac);
      const t = cb.current.task(j);
      const p = t ? api.run(t, { signal: ac.signal }) : Promise.resolve();
      p.then(() => !ac.signal.aborted && cb.current.onDone(j))
        .catch(() => {
          if (!ac.signal.aborted) cb.current.onFail(j);
        })
        .finally(() => {
          if (inflight.current.get(key) === ac) inflight.current.delete(key);
        });
    }
  }, [jobs, api]);

  useEffect(() => {
    const map = inflight.current;
    return () => {
      map.forEach((ac) => ac.abort());
      map.clear();
    };
  }, []);
}
