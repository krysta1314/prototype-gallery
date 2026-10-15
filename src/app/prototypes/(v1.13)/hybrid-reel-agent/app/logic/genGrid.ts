/* Generate 之后的「生成中」宫格(纯函数):按 runs.ts 的排程,算出 clock 时刻每个分镜镜头的卡片状态 + 底部那行进度文案。
   一镜一张卡,顺序同 outline.shots:
   - AI 补拍:自己那行「Generate video · Shot n」跑完 = done(这一镜在 fail 里则 = failed)
   - 实拍 / 其他:「cut footage」跑完 = done
   - 单镜重试(only):只有这一镜重新走 Generating,其余镜头保持已完成
   - stoppedAtMs:时间冻结在那一刻,没完成的卡 = stopped */

import type { Outline } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";
import { genShot, schedule, toolRuns, totalMs, type ShotFail } from "./runs";

export type CardStatus = "generating" | "done" | "failed" | "stopped";
export type GridCard = { shot: number; source: "AI" | "Footage"; status: CardStatus; reason?: string };
export type GridPhase = "preparing" | "filming" | "cutting" | "voiceover" | "assembling" | "subtitles" | "mixing" | "checking" | "done" | "stopped";
export type GridState = { cards: GridCard[]; phase: GridPhase; status: string };

/** 底部进度行的文案(产品 UI,英文) */
export const PHASE_TEXT: Record<GridPhase, string> = {
  preparing: "Getting things ready...",
  filming: "Filming in progress...",
  cutting: "Cutting your footage...",
  voiceover: "Adding the voiceover...",
  assembling: "Assembling the reel...",
  subtitles: "Adding subtitles...",
  mixing: "Mixing the audio...",
  checking: "Checking the final cut...",
  done: "All shots ready.",
  stopped: "Stopped.",
};

/** 工具行 id → 进度阶段 */
function phaseOf(runId: string): GridPhase {
  if (genShot(runId) !== undefined) return "filming";
  switch (runId) {
    case "ff-cut":
      return "cutting";
    case "voices":
    case "audio":
      return "voiceover";
    case "ff-assemble":
      return "assembling";
    case "ff-subs":
      return "subtitles";
    case "ff-mix":
      return "mixing";
    case "check":
      return "checking";
    default:
      return "preparing";
  }
}

export function genGrid(run: { outline: Outline; only?: number; fail?: ShotFail[]; stoppedAtMs?: number }, clock: number): GridState {
  const runs = toolRuns(run.outline, { only: run.only });
  const slots = schedule(runs);
  const stopped = run.stoppedAtMs !== undefined;
  const t = stopped ? Math.min(clock, run.stoppedAtMs!) : clock;
  const fail = run.fail ?? [];
  const endOf = (id: string) => slots.find((s) => s.id === id)?.endMs;
  const cutEnd = endOf("ff-cut");

  const cards: GridCard[] = run.outline.shots.map((s, i) => {
    const shot = i + 1;
    const ai = s.source.kind === "generate";
    const source = ai ? "AI" : "Footage";
    /* 单镜重试:其余镜头沿用上一版成片,一开始就是 done */
    const end = run.only !== undefined ? (shot === run.only ? endOf(`gen-${i}`) : 0) : ai ? endOf(`gen-${i}`) : cutEnd;
    const ready = end === undefined || t >= end;
    if (!ready) return { shot, source, status: stopped ? "stopped" : "generating" };
    const f = ai ? fail.find((x) => x.shot === shot) : undefined;
    return f ? { shot, source, status: "failed", reason: f.reason } : { shot, source, status: "done" };
  });

  let phase: GridPhase;
  if (stopped) phase = "stopped";
  else if (t >= totalMs(slots)) phase = "done";
  else {
    /* 正在跑的行里排最前的那一行决定文案(补拍并行时都是 filming) */
    const k = slots.findIndex((s) => t >= s.startMs && t < s.endMs);
    phase = k < 0 ? "preparing" : phaseOf(runs[k].id);
  }
  return { cards, phase, status: PHASE_TEXT[phase] };
}
