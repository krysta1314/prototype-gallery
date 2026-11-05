"use client";

/* 生成结果卡：进度 → 样片;失败显示原因 + Retry(积分退回)。
   「继续做」按钮只给生成它的模型支持的:Extend / Edit / Use last frame。 */

import { Download, Frame, RotateCcw, Scissors, StepForward, TriangleAlert } from "lucide-react";
import { MODE_LABEL, modelCaps } from "../capabilities";
import { RESULT_ACTION_LABEL, resultActions, type ResultAction } from "../infer";
import type { Job } from "../useFakeGeneration";
import { ModelIcon } from "./BarMenus";

const ACTION_ICON: Record<ResultAction, typeof Frame> = { extend: StepForward, edit: Scissors, lastFrame: Frame };

export function ResultCard({ job, onRetry, onFollowUp, compact }: { job: Job; onRetry: () => void; onFollowUp: (a: ResultAction) => void; compact?: boolean }) {
  const meta = `${modelCaps(job.model).label} · ${MODE_LABEL[job.mode]} · ${job.secs}s`;
  return (
    <article className="overflow-hidden rounded-2xl border border-[#ececf1] bg-white shadow-[0_2px_10px_rgba(26,26,46,0.04)]">
      <div className={`relative grid ${compact ? "aspect-video" : "aspect-[16/9]"} place-items-center bg-[#15151f]`}>
        {job.status === "done" && job.url ? (
          <video src={job.url} poster={job.poster} controls playsInline className="size-full object-contain" />
        ) : job.status === "failed" ? (
          <div className="flex flex-col items-center gap-2 px-6 text-center">
            <TriangleAlert className="size-6 text-[#ffb08a]" />
            <p className="text-[14px] font-semibold text-white">Generation failed</p>
            <p className="text-[12.5px] text-white/60">{job.credits} credits refunded.</p>
            <button type="button" onClick={onRetry} className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-[12.5px] font-semibold text-[#1a1a2e] transition hover:bg-[#f4f3f6]">
              <RotateCcw className="size-3.5" /> Retry
            </button>
          </div>
        ) : (
          <div className="w-1/2 min-w-[160px]">
            <p className="text-center text-[13px] font-medium text-white/80">Generating {job.progress}%</p>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-gradient-to-r from-[#ffa73c] to-[#ff5255] transition-[width] duration-150" style={{ width: `${job.progress}%` }} />
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 px-3.5 py-2.5">
        <ModelIcon model={job.model} />
        <span className="text-[12.5px] font-medium text-[#4a4b5c]">{meta}</span>
        {job.prompt && <span className="hidden min-w-0 flex-1 truncate text-[12.5px] text-[#9a9bb0] sm:block">“{job.prompt}”</span>}
        {job.status === "done" && (
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            {resultActions(job.model).map((a) => {
              const I = ACTION_ICON[a];
              return (
                <button key={a} type="button" onClick={() => onFollowUp(a)} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#ececf1] px-2.5 text-[12.5px] font-semibold text-[#1a1a2e] transition hover:border-[#ffcfb3] hover:bg-[#fff7f1] hover:text-[#ff5e1a]">
                  <I className="size-3.5" /> {RESULT_ACTION_LABEL[a]}
                </button>
              );
            })}
            <a href={job.url} download className="grid size-8 place-items-center rounded-lg text-[#9a9bb0] transition hover:bg-[#f4f3f6] hover:text-[#1a1a2e]" aria-label="Download video">
              <Download className="size-4" />
            </a>
          </div>
        )}
      </div>
    </article>
  );
}
