/* 生成过程的「峰值时刻」:思考步骤、分镜、时长。
 * 纯函数,全部由 job.elapsedMs 推出 —— 不加 store 状态,切 Tab / 重渲染后仍然对得上。
 * 不得 import react-native(vitest 在 node 环境跑) */
import { RESULTS, USE_CASES, framesFor, type Mode } from "./data";
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

/** "Hook: ice pour close-up" → { label: "Hook", text: "ice pour close-up" };没有冒号就只有 text */
export function beatsFrom(pills: string[]): { label: string; text: string }[] {
  return pills.map((p) => {
    const i = p.indexOf(":");
    return i < 0 ? { label: "", text: p } : { label: p.slice(0, i).trim(), text: p.slice(i + 1).trim() };
  });
}

/** 分镜三帧,三张互不相同。提示词命中关键词组且配了帧(framesFor)时,Scene / CTA 用那组的素材,和 beat 文案对上;
 *  否则:
 *  Hook = 成片封面(开场钩子);Scene = 同品类的另一张灵感图(跳过和成片同一个镜头的那张);
 *  CTA = 用户自己拍的产品照(没有就再取一张相关图) */
export function storyboardFrames(job: Job, refs: string[]): string[] {
  const same = USE_CASES.find((u) => u.cover === job.cover || (!!job.video && u.video === job.video));
  const related = USE_CASES.filter((u) => u !== same && (!same || u.category === same.category)).map((u) => u.cover);
  const [product, ...moreRefs] = refs;
  const others = [...new Set([...related, ...moreRefs, ...USE_CASES.map((u) => u.cover), RESULTS.agent.cover])].filter(
    (x) => x !== job.cover && x !== product && x !== same?.cover,
  );
  const pick = framesFor(job.prompt);
  if (pick) {
    const pool = [pick.cta, product, ...others].filter((x): x is string => !!x && x !== job.cover && x !== pick.scene);
    return [job.cover, pick.scene, pool[0]];
  }
  return [job.cover, others[0], product ?? others[1]];
}

/** 结果卡右下角的时长;图片没有 */
export const durationLabel = (mode: Mode): string | null =>
  mode === "agent" ? "0:15" : mode === "video" ? "0:08" : mode === "audio" ? "0:30" : null;
