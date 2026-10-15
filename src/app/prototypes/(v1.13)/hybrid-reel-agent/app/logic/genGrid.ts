/* Generate 之后的「生成中」宫格(纯函数):按 runs.ts 的排程,算出 clock 时刻每张卡的状态 + 底部那行进度文案。
   宫格只放真正要生成的东西(像 Claude 用 BuzzVideo MCP:只 generate_video 补拍、generate_audio 配音,其余自己剪):
   - 每个 AI 补拍一张卡:自己那行「Generate video」跑完 = done(在 fail 里则 = failed)
   - 旁白开着时一张配音卡:「Generate audio」跑完 = done
   - 实拍素材不出卡(那是 Agent 自己剪的,不是生成)
   - 失败后重试(only):只有重跑的镜头各一张卡;editOnly(用素材顶上 / 删掉这一镜):没有卡,只有进度行
   - 有镜头失败:生成结算完就停(phase = paused),不进剪辑,等用户在提问卡里选
   - stoppedAtMs:时间冻结在那一刻,没完成的卡 = stopped
   - editFail:生成都成功、剪辑跑到拼接那一步失败(phase = editFailed),卡片照常是好的,进度行换成红字一句 */

import type { Outline } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";
import { VOICE_FAIL_TEXT, editFailMs, genShot, runEndMs, schedule, settleMs, toolRuns, totalMs, type ShotFail, type VoiceFailKind } from "./runs";
import { voiceLines, voiceSec } from "./voice";

export type CardStatus = "generating" | "done" | "failed" | "stopped";
/** kind:ai = 一个补拍镜头(shot = 分镜里的镜头号);voice = 整条旁白(sec = 时长) */
export type GridCard =
  | { kind: "ai"; key: string; shot: number; status: CardStatus; reason?: string }
  | { kind: "voice"; key: string; sec: number; status: CardStatus; reason?: string };
export type GridPhase = "preparing" | "filming" | "cutting" | "voiceover" | "assembling" | "subtitles" | "mixing" | "checking" | "done" | "stopped" | "paused" | "editFailed";
export type GridState = { cards: GridCard[]; phase: GridPhase; status: string };
/** voiceFail:这一轮配音会失败;voiceOnly:只重做配音的一轮(配音失败后);held:还有一个没解决的配音失败(先问了镜头),生成结算完就停下来问配音 */
export type GridRun = {
  outline: Outline;
  only?: number[];
  editOnly?: boolean;
  voiceOnly?: boolean;
  fail?: ShotFail[];
  voiceFail?: VoiceFailKind;
  held?: VoiceFailKind;
  /** 这一轮剪辑会失败(生成都成功之后) */
  editFail?: boolean;
  stoppedAtMs?: number;
};

/** 这一轮生成结算完后要不要停下来问(补拍失败 / 配音失败 / 还有没解决的配音失败) */
export const runPauses = (run: Pick<GridRun, "fail" | "voiceFail" | "held">) => Boolean(run.fail?.length || run.voiceFail || run.held);

/** 底部进度行的文案(产品 UI,英文);paused 不显示进度行(下面是提问卡) */
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
  paused: "",
  editFailed: "Couldn't finish the edit.",
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

export function genGrid(run: GridRun, clock: number): GridState {
  const runs = toolRuns(run.outline, { only: run.only, editOnly: run.editOnly, voiceOnly: run.voiceOnly });
  const slots = schedule(runs);
  const stopped = run.stoppedAtMs !== undefined;
  const fail = run.fail ?? [];
  const pause = runPauses(run);
  const editFail = Boolean(run.editFail) && !pause;
  const end = runEndMs(slots, fail, pause, editFail);
  const t = Math.min(stopped ? Math.min(clock, run.stoppedAtMs!) : clock, end);
  const endOf = (id: string) => slots.find((s) => s.id === id)?.endMs;
  const status = (doneAt: number | undefined): CardStatus => (doneAt === undefined || t >= doneAt ? "done" : stopped ? "stopped" : "generating");

  const cards: GridCard[] = [];
  if (!run.editOnly) {
    const shots = run.voiceOnly ? [] : run.only?.length ? run.only : run.outline.shots.flatMap((s, i) => (s.source.kind === "generate" ? [i + 1] : []));
    for (const shot of shots) {
      const st = status(endOf(`gen-${shot - 1}`));
      const f = st === "done" ? fail.find((x) => x.shot === shot) : undefined;
      cards.push(f ? { kind: "ai", key: `ai-${shot}`, shot, status: "failed", reason: f.reason } : { kind: "ai", key: `ai-${shot}`, shot, status: st });
    }
    if (!run.only?.length && voiceLines(run.outline).length) {
      const st = status(endOf("audio"));
      cards.push(
        st === "done" && run.voiceFail
          ? { kind: "voice", key: "voice", sec: voiceSec(run.outline), status: "failed", reason: VOICE_FAIL_TEXT[run.voiceFail] }
          : { kind: "voice", key: "voice", sec: voiceSec(run.outline), status: st },
      );
    }
  }

  let phase: GridPhase;
  if (stopped) phase = "stopped";
  else if (pause && t >= settleMs(slots)) phase = "paused";
  else if (editFail && t >= editFailMs(slots)) phase = "editFailed";
  else if (t >= totalMs(slots)) phase = "done";
  else {
    /* 正在跑的行里排最前的那一行决定文案(补拍并行时都是 filming) */
    const k = slots.findIndex((s) => t >= s.startMs && t < s.endMs);
    phase = k < 0 ? "preparing" : phaseOf(runs[k].id);
  }
  return { cards, phase, status: PHASE_TEXT[phase] };
}

/** 收起后的标题:Generated 3 shots and the voiceover / Regenerated shot 3 / Regenerated shots 2 and 3 */
export function gridTitle(run: GridRun, cards: GridCard[]): string {
  const ai = cards.filter((c) => c.kind === "ai").length;
  const shots = (n: number) => `${n} ${n === 1 ? "shot" : "shots"}`;
  if (run.only?.length) return `Regenerated ${run.only.length === 1 ? "shot" : "shots"} ${listNums(run.only)}`;
  if (run.voiceOnly) return "Regenerated the voiceover";
  const voice = cards.some((c) => c.kind === "voice");
  if (!ai) return voice ? "Generated the voiceover" : "";
  return `Generated ${shots(ai)}${voice ? " and the voiceover" : ""}`;
}

/** 2 → "2";[2,3] → "2 and 3";[2,3,5] → "2, 3 and 5" */
export function listNums(ns: number[]): string {
  if (ns.length <= 1) return ns.join("");
  return `${ns.slice(0, -1).join(", ")} and ${ns[ns.length - 1]}`;
}
