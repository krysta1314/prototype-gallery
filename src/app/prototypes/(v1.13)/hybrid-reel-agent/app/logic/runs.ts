/* Generate 之后的计时模型:Agent 的工具调用按耗时排程(不调任何接口)。界面不再逐行显示,
   而是由 genGrid.ts 把它映射成「一镜一张卡」的生成中宫格 + 一行进度文案。
   真实产品里这些步骤来自 Agent 的实际工具调用流(spec §5)。
   失败 / 停止 / 单镜重试的判定也在这里(纯函数):行状态、停止时该退多少积分。 */

import type { Outline } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";
import { shotCost } from "./credits";
import { voiceCost, voiceLines, voiceScript } from "./voice";

export type ToolRun = { id: string; label: string; detail?: string; ms: number; group?: string };
export type Slot = { id: string; startMs: number; endMs: number };
/** 补拍失败的原因分两类:busy = 临时故障(繁忙 / 超时 / 网络),重试大概率能好;moderation = 审核没过(敏感参考图、真人脸、品牌 IP),原样重试没用 */
export type ShotFailKind = "busy" | "moderation";
/** 配音失败的原因:busy = 配音服务繁忙;script = 旁白稿里有可能触发审核的词 */
export type VoiceFailKind = "busy" | "script";
/** 某个补拍镜头这次会失败(shot = 分镜里的镜头号,从 1 起);reason = 失败卡上的那句(产品 UI,英文);kind 不写 = busy */
export type ShotFail = { shot: number; reason: string; kind?: ShotFailKind };
export type RowState = "hidden" | "running" | "done" | "failed" | "stopped";

/** 失败卡上的原因(产品 UI,一律英文) */
export const SHOT_FAIL_TEXT: Record<ShotFailKind, string> = {
  busy: "The video model is busy right now",
  moderation: "The reference image may contain sensitive content",
};
export const VOICE_FAIL_TEXT: Record<VoiceFailKind, string> = {
  busy: "The voice service is busy right now",
  script: "The script may contain restricted words",
};
/** 旧口径(busy 那一句的中英);界面一律显示英文 */
export const SHOT_FAIL_REASON = { en: SHOT_FAIL_TEXT.busy, zh: "视频模型繁忙" } as const;
/** 一个会失败的补拍镜头 */
export const shotFail = (shot: number, kind: ShotFailKind = "busy"): ShotFail => ({ shot, kind, reason: SHOT_FAIL_TEXT[kind] });

const genId = (shotIndex: number) => `gen-${shotIndex}`;
/** "gen-{i}" 行对应的镜头号(i + 1);不是补拍行返回 undefined */
export function genShot(runId: string): number | undefined {
  const m = /^gen-(\d+)$/.exec(runId);
  return m ? Number(m[1]) + 1 : undefined;
}

/** 剪辑阶段(Agent 自己用 ffmpeg 剪,不调生成模型):剪实拍 → 拼接 → 字幕 → 混音 → 检查 */
const EDIT_RUNS: ToolRun[] = [
  { id: "ff-cut", label: "Run ffmpeg · cut footage", ms: 1500 },
  { id: "ff-assemble", label: "Run ffmpeg · assemble", ms: 2000 },
  { id: "ff-subs", label: "Run ffmpeg · subtitles", ms: 1500 },
  { id: "ff-mix", label: "Run ffmpeg · mix audio", ms: 1500 },
  { id: "check", label: "Check output", ms: 1000 },
];

/** 一轮生成的工具调用。
    only:只重跑这几个补拍镜头(失败后选 Retry / 换模型 / 换参考图 / 改写 prompt):并行生成 → 接着剪成片;
    voiceOnly:只重做整条配音(配音失败后选 Retry / 换音色 / 改写旁白稿)→ 接着剪成片;
    editOnly:失败后选「用素材顶上 / 删掉这一镜 / 用产品图做动态镜头 / 不要配音」:不再生成,直接剪成片 */
export function toolRuns(outline: Outline, opts: { only?: number[]; editOnly?: boolean; voiceOnly?: boolean } = {}): ToolRun[] {
  if (opts.editOnly) return EDIT_RUNS.map((r) => ({ ...r }));
  if (opts.voiceOnly) return [{ id: "audio", label: "Generate audio", detail: voiceScript(outline), ms: 2000 }, ...EDIT_RUNS.map((r) => ({ ...r }))];
  if (opts.only?.length) {
    const gen = opts.only.map((n, k) => {
      const s = outline.shots[n - 1]?.source;
      return { id: genId(n - 1), label: "Generate video", detail: s?.kind === "generate" ? s.prompt : undefined, ms: 4000 + (k % 3) * 1000, group: "gen" };
    });
    return [...gen, ...EDIT_RUNS.map((r) => ({ ...r }))];
  }
  const runs: ToolRun[] = [{ id: "usage", label: "Get usage", ms: 500 }];
  const gen = outline.shots.flatMap((s, i) => (s.source.kind === "generate" ? [{ s: s.source, i }] : []));
  if (gen.length) {
    runs.push({ id: "ref", label: "Upload reference image", ms: 1000 });
    gen.forEach(({ s, i }, k) =>
      runs.push({ id: genId(i), label: "Generate video", detail: s.prompt, ms: 4000 + (k % 3) * 1000, group: "gen" }),
    );
  }
  if (voiceLines(outline).length) {
    runs.push({ id: "voices", label: "List voices", ms: 500 });
    runs.push({ id: "audio", label: "Generate audio", detail: voiceScript(outline), ms: 2000 });
  }
  runs.push(...EDIT_RUNS.map((r) => ({ ...r })));
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

/** 所有生成(补拍 + 配音)都结算完的时刻:有镜头失败时,一轮跑到这里就停下来问用户怎么办(不进剪辑) */
export const settleMs = (slots: Slot[]) => Math.max(0, ...slots.filter((s) => genShot(s.id) !== undefined || s.id === "audio").map((s) => s.endMs));

/** 剪辑 / 渲染失败(异常处理 spec 第 8 条)发生在哪一行跑完时:拼接(assemble)那一步 */
export const EDIT_FAIL_RUN = "ff-assemble";
/** 剪辑失败的时刻:拼接那一行的结束时间;没有剪辑行时 = 全部结束 */
export const editFailMs = (slots: Slot[]) => slots.find((s) => s.id === EDIT_FAIL_RUN)?.endMs ?? totalMs(slots);

/** 这一轮在什么时刻结束:有失败(补拍失败 / pause = 配音失败或还有没解决的配音失败)= 生成结算完就停;
    editFail(生成都成功、剪辑这一轮会失败)= 停在拼接那一步;否则跑完全部(含剪辑) */
export const runEndMs = (slots: Slot[], fail: ShotFail[] = [], pause = false, editFail = false) =>
  fail.length || pause ? settleMs(slots) : editFail ? editFailMs(slots) : totalMs(slots);

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

/** 在 atMs 时已经跑完(且没失败)的补拍镜头号 —— 停止时这些不退 */
export function finishedShots(runs: ToolRun[], slots: Slot[], atMs: number, fail: ShotFail[] = []): number[] {
  return rowStates(runs, slots, atMs, fail).flatMap((st, i) => {
    const shot = genShot(runs[i].id);
    return st === "done" && shot !== undefined ? [shot] : [];
  });
}

/** 停止时退多少:已扣的 − 已退的 − 已经做完的补拍(每镜 shotCost)− 已经做完(且没失败)的配音(voiceCost);成片没出来,基础费全退 */
export function stopRefund(p: { outline: Outline; charged: number; refunded: number; runs: ToolRun[]; slots: Slot[]; atMs: number; fail?: ShotFail[]; voiceFail?: boolean }): number {
  const audio = p.slots.find((s) => s.id === "audio");
  const voiceKept = audio && audio.endMs <= p.atMs && !p.voiceFail ? voiceCost(p.outline) : 0;
  const kept = finishedShots(p.runs, p.slots, p.atMs, p.fail).length * shotCost(p.outline) + voiceKept;
  return Math.max(0, p.charged - p.refunded - kept);
}
