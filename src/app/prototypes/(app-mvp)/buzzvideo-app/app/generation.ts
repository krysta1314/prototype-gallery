/* 生成过程的「峰值时刻」:思考步骤、分镜、时长。
 * 纯函数,全部由 job.elapsedMs 推出 —— 不加 store 状态,切 Tab / 重渲染后仍然对得上。
 * 不得 import react-native(vitest 在 node 环境跑) */
import type { Mode } from "./data";
import type { Job } from "./store";

export type ThinkingStep = { label: string; detail: string };
export type StepStatus = "done" | "active" | "pending" | "failed";

/** 每个规划步骤亮起的时长;最后一步(Render)一直持续到生成结束 */
export const STEP_MS = 700;

/** 每个模式的思考过程:最后一步永远是渲染 */
export const THINKING: Record<Mode, { title: string; doneTitle: string; steps: ThinkingStep[] }> = {
  agent: {
    title: "Planning your ad",
    doneTitle: "Planned your ad",
    steps: [
      { label: "Research", detail: "Looked at what’s working for similar shops this month" },
      { label: "Script", detail: "Wrote a 15-second script that hooks in the first second" },
      { label: "Storyboard", detail: "Broke it into three beats: hook, scene and call to action" },
      { label: "Render", detail: "Vertical cut with music and captions" },
    ],
  },
  image: {
    title: "Setting up your images",
    doneTitle: "Set up your images",
    steps: [
      { label: "Prompt", detail: "Pulled the product, light and background from your prompt" },
      { label: "Framing", detail: "Chose a clean hero framing that crops well to 9:16" },
      { label: "Render", detail: "Final images at full resolution" },
    ],
  },
  video: {
    title: "Setting up your shot",
    doneTitle: "Set up your shot",
    steps: [
      { label: "Prompt", detail: "Pulled the subject, motion and light from your prompt" },
      { label: "Camera", detail: "Planned one continuous camera move" },
      { label: "Render", detail: "Final clip with synced sound" },
    ],
  },
  audio: {
    title: "Setting up your audio",
    doneTitle: "Set up your audio",
    steps: [
      { label: "Script", detail: "Wrote a warm, friendly read for your shop" },
      { label: "Voice", detail: "Matched a voice and an upbeat music bed" },
      { label: "Render", detail: "Voice and music mixed into one track" },
    ],
  },
};

/** 渲染(最后一步)从什么时候开始 */
export const renderStartMs = (mode: Mode) => (THINKING[mode].steps.length - 1) * STEP_MS;

/** 还在规划(渲染尚未开始):此时结果卡还不出现 */
export const isPlanning = (job: Job) => job.status === "running" && job.elapsedMs < renderStartMs(job.mode);

/** 每一步的状态:done 全部完成;failed 停在当时走到的那一步 */
export function stepStatuses(job: Job): StepStatus[] {
  const n = THINKING[job.mode].steps.length;
  if (job.status === "done") return Array(n).fill("done");
  const at = Math.min(n - 1, Math.floor(job.elapsedMs / STEP_MS));
  const current: StepStatus = job.status === "failed" ? "failed" : "active";
  return Array.from({ length: n }, (_, i) => (i < at ? "done" : i === at ? current : "pending"));
}

/** 结果卡右下角的时长;图片没有 */
export const durationLabel = (mode: Mode): string | null =>
  mode === "agent" ? "0:15" : mode === "video" ? "0:08" : mode === "audio" ? "0:30" : null;
