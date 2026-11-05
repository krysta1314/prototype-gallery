"use client";

/* 演示生成：进度条走完给一条样片;「下一次生成失败」开着时这次失败(积分退回)。不真调模型。 */

import { useCallback, useEffect, useRef, useState } from "react";
import { newId } from "./assets";
import type { ModeKey, ModelKey } from "./capabilities";
import { RESULT_VIDEO } from "./samples";

export type Job = {
  id: string;
  model: ModelKey;
  mode: ModeKey;
  secs: number;
  credits: number;
  prompt: string;
  status: "running" | "done" | "failed";
  progress: number;
  url?: string;
  poster?: string;
};

export type JobSpec = Pick<Job, "model" | "mode" | "secs" | "credits" | "prompt">;

export function useFakeGeneration(ms: number, failNext: () => boolean) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const timers = useRef(new Map<string, number>());
  useEffect(() => {
    const t = timers.current;
    return () => t.forEach((id) => window.clearInterval(id));
  }, []);

  const run = useCallback(
    (id: string) => {
      const fail = failNext();
      const started = Date.now();
      const tick = window.setInterval(() => {
        const p = Math.min(100, Math.round(((Date.now() - started) / ms) * 100));
        setJobs((all) =>
          all.map((j) => {
            if (j.id !== id) return j;
            if (fail && p >= 60) return { ...j, status: "failed", progress: 60 };
            if (p >= 100) return { ...j, status: "done", progress: 100, url: RESULT_VIDEO.url, poster: RESULT_VIDEO.poster };
            return { ...j, progress: p };
          }),
        );
        if (p >= 100 || (fail && p >= 60)) {
          window.clearInterval(tick);
          timers.current.delete(id);
        }
      }, 120);
      timers.current.set(id, tick);
    },
    [ms, failNext],
  );

  const start = useCallback(
    (spec: JobSpec) => {
      const job: Job = { ...spec, id: newId("job"), status: "running", progress: 0 };
      setJobs((all) => [job, ...all]);
      run(job.id);
      return job.id;
    },
    [run],
  );

  const retry = useCallback(
    (id: string) => {
      setJobs((all) => all.map((j) => (j.id === id ? { ...j, status: "running", progress: 0 } : j)));
      run(id);
    },
    [run],
  );

  const remove = useCallback((id: string) => setJobs((all) => all.filter((j) => j.id !== id)), []);
  const reset = useCallback(() => {
    timers.current.forEach((t) => window.clearInterval(t));
    timers.current.clear();
    setJobs([]);
  }, []);

  return { jobs, start, retry, remove, reset };
}
