/* Generate 之后的演示:Claude 式折叠工具调用行。不调任何接口,只按耗时排程。
   真实产品里这些行来自 Agent 的实际工具调用流(spec §5)。
   失败 / 停止 / 单镜重试的判定也在这里(纯函数):行状态、Step i of n、停止时该退多少积分。 */

import type { Outline } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";

export type ToolRun = { id: string; label: string; detail?: string; ms: number; group?: string };
export type Slot = { id: string; startMs: number; endMs: number };
/** 某个补拍镜头这次会失败(shot = 分镜里的镜头号,从 1 起) */
export type ShotFail = { shot: number; reason: string };
export type RowState = "hidden" | "running" | "done" | "failed" | "stopped";

/** 补拍失败的原因(原型固定这一句) */
export const SHOT_FAIL_REASON = { en: "The video model is busy right now", zh: "视频模型繁忙" } as const;

const genId = (shotIndex: number) => `gen-${shotIndex}`;
/** "gen-{i}" 行对应的镜头号(i + 1);不是补拍行返回 undefined */
export function genShot(runId: string): number | undefined {
  const m = /^gen-(\d+)$/.exec(runId);
  return m ? Number(m[1]) + 1 : undefined;
}

/** only:只重跑这一个补拍镜头(Retry shot n):生成这一镜 → 重新拼接 → 检查 */
export function toolRuns(outline: Outline, opts: { only?: number } = {}): ToolRun[] {
  if (opts.only !== undefined) {
    const i = opts.only - 1;
    const s = outline.shots[i]?.source;
    return [
      { id: genId(i), label: "Generate video", detail: s?.kind === "generate" ? s.prompt : undefined, ms: 4000 },
      { id: "ff-assemble", label: "Run ffmpeg · assemble", ms: 2000 },
      { id: "check", label: "Check output", ms: 1000 },
    ];
  }
  const runs: ToolRun[] = [{ id: "usage", label: "Get usage", ms: 500 }];
  const gen = outline.shots.flatMap((s, i) => (s.source.kind === "generate" ? [{ s: s.source, i }] : []));
  if (gen.length) {
    runs.push({ id: "ref", label: "Upload reference image", ms: 1000 });
    gen.forEach(({ s, i }, k) =>
      runs.push({ id: genId(i), label: "Generate video", detail: s.prompt, ms: 4000 + (k % 3) * 1000, group: "gen" }),
    );
  }
  if (outline.voiceover?.on) {
    runs.push({ id: "voices", label: "List voices", ms: 500 });
    runs.push({ id: "audio", label: "Generate audio", detail: outline.shots.map((s) => s.subtitle.text).filter(Boolean).join(" "), ms: 2000 });
  }
  runs.push(
    { id: "ff-cut", label: "Run ffmpeg · cut footage", ms: 1500 },
    { id: "ff-assemble", label: "Run ffmpeg · assemble", ms: 2000 },
    { id: "ff-subs", label: "Run ffmpeg · subtitles", ms: 1500 },
    { id: "ff-mix", label: "Run ffmpeg · mix audio", ms: 1500 },
    { id: "check", label: "Check output", ms: 1000 },
  );
  return runs;
}

export function schedule(runs: ToolRun[]): Slot[] {
  const slots: Slot[] = [];
  let cursor = 0;
  let i = 0;
  while (i < runs.length) {
    const g = runs[i].group;
    const batch = g ? runs.slice(i).filter((r, k, arr) => arr.slice(0, k + 1).every((x) => x.group === g)) : [runs[i]];
    const end = Math.max(...batch.map((r) => cursor + r.ms));
    batch.forEach((r) => slots.push({ id: r.id, startMs: cursor, endMs: cursor + r.ms }));
    cursor = end;
    i += batch.length;
  }
  return slots;
}

export const totalMs = (slots: Slot[]) => Math.max(0, ...slots.map((s) => s.endMs));

/** 每行在 clock 时刻的状态。stoppedAtMs:停在这一刻,当时在跑的行显示「已停止」,还没开始的不出现 */
export function rowStates(runs: ToolRun[], slots: Slot[], clock: number, fail: ShotFail[] = [], stoppedAtMs?: number): RowState[] {
  const t = stoppedAtMs !== undefined ? Math.min(clock, stoppedAtMs) : clock;
  return runs.map((r, i) => {
    const slot = slots[i];
    if (t < slot.startMs) return "hidden";
    if (t < slot.endMs) return stoppedAtMs !== undefined ? "stopped" : "running";
    const shot = genShot(r.id);
    return shot !== undefined && fail.some((f) => f.shot === shot) ? "failed" : "done";
  });
}

/** 工具区顶部的 "Step {i} of {n}":i = 已开始的行数 */
export function stepOf(states: RowState[]): { i: number; n: number } {
  return { i: Math.max(1, states.filter((s) => s !== "hidden").length), n: states.length };
}

/** 在 atMs 时已经跑完(且没失败)的补拍镜头号 —— 停止时这些不退 */
export function finishedShots(runs: ToolRun[], slots: Slot[], atMs: number, fail: ShotFail[] = []): number[] {
  return rowStates(runs, slots, atMs, fail).flatMap((st, i) => {
    const shot = genShot(runs[i].id);
    return st === "done" && shot !== undefined ? [shot] : [];
  });
}

/** 停止时退多少:已扣的 − 已退的 − 已经做完的补拍(每镜 perGenerateShot);成片没出来,合成费全退 */
export function stopRefund(p: { outline: Outline; charged: number; refunded: number; runs: ToolRun[]; slots: Slot[]; atMs: number; fail?: ShotFail[] }): number {
  const kept = finishedShots(p.runs, p.slots, p.atMs, p.fail).length * p.outline.credits.perGenerateShot;
  return Math.max(0, p.charged - p.refunded - kept);
}
