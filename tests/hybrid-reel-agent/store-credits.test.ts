import { describe, expect, it } from "vitest";
import {
  INITIAL_STATE,
  agentReducer,
  creditGate,
  findRun,
  outOfCreditsShown,
  pendingAsk,
  planAwaiting,
  type AgentAction,
  type AgentState,
} from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/store";
import type { Outline } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";

const AI = { role: "pain", durationSec: 4, source: { kind: "generate", genType: "broll", prompt: "p" }, subtitle: { text: "", source: "authored" } } as const;
/* 2 个 AI 补拍、没有旁白台词:reelCost = 40 + 2 × 50 = 140 */
const OUTLINE = (tag: string): Outline => ({
  shots: [AI, AI],
  direction: tag,
  bgmPrompt: "",
  credits: { base: 40, perGenerateShot: 50, generatedShots: 2, total: 140 },
  model: "seed",
});
const run = (actions: AgentAction[], from: AgentState = INITIAL_STATE) => actions.reduce(agentReducer, from);
const kinds = (s: AgentState) => s.messages.map((m) => m.kind);
const GEN = (over: Partial<Extract<AgentAction, { type: "generate" }>> = {}): AgentAction => ({ type: "generate", agentId: "a", runsId: "r", text: "go", outline: OUTLINE("v1"), ...over });
const PLAN: AgentAction[] = [
  { type: "outlineRequested", req: { brief: { platform: "TikTok", durationSec: 15, audience: "", sellingPoints: [], cta: "", subtitleLang: "English" }, profiles: [] }, thinkingId: "t", text: "…" },
  { type: "outlineOk", thinkingId: "t", planId: "p1", outline: OUTLINE("v1") },
];

describe("credits in the store", () => {
  it("starts at 35,600 and keeps the balance across start / empty", () => {
    expect(INITIAL_STATE.credits).toBe(35600);
    const s = run([{ type: "empty" }], { ...INITIAL_STATE, credits: 30 });
    expect(s.credits).toBe(30);
  });
  it("generate charges the cost (default = storyboard estimate) and records it on the run", () => {
    const s = run([GEN()]);
    expect(s.credits).toBe(35600 - 140);
    expect(findRun(s.messages)?.charged).toBe(140);
    expect(run([GEN({ cost: 10 })]).credits).toBe(35590);
  });
  it("opening a dialog and generating closes it", () => {
    const s = run([{ type: "dialog", dialog: { kind: "regenerate", outline: OUTLINE("v1"), cost: 140 } }]);
    expect(s.dialog?.kind).toBe("regenerate");
    expect(run([GEN()], s).dialog).toBeNull();
  });
});

describe("out of credits", () => {
  const poor = run(PLAN, { ...INITIAL_STATE, credits: 30 });
  it("creditGate lets a covered charge through and blocks the rest", () => {
    expect(creditGate(140, 140)).toBeNull();
    expect(creditGate(30, 140)).toEqual({ type: "outOfCredits", needed: 140 });
  });
  it("a blocked generate enters out-of-credits mode and charges nothing", () => {
    const blocked = creditGate(poor.credits, OUTLINE("v1").credits.total)!;
    const s = agentReducer(poor, blocked);
    expect(s.outOfCredits).toBe(true);
    expect(s.creditsNeeded).toBe(140);
    expect(outOfCreditsShown(s)).toBe(true);
    expect(s.credits).toBe(30);
    expect(s.generating).toBe(false);
    expect(s.dialog).toBeNull();
    expect(s.messages.some((m) => m.kind === "runs")).toBe(false);
    /* 方案卡仍待确认:再点 Confirm 只是再次被拦 */
    expect(s.messages.some(planAwaiting)).toBe(true);
    expect(agentReducer(s, creditGate(s.credits, 140)!)).toMatchObject({ outOfCredits: true, credits: 30 });
  });
  it("a blocked Regenerate closes the confirm dialog", () => {
    const open = agentReducer(poor, { type: "dialog", dialog: { kind: "regenerate", outline: OUTLINE("v1"), cost: 140 } });
    expect(agentReducer(open, { type: "outOfCredits", needed: 140 }).dialog).toBeNull();
  });
  it("leaves out-of-credits mode once the balance covers the blocked cost", () => {
    const rich = { ...INITIAL_STATE, credits: 100 };
    const s = run([GEN({ cost: 60, fail: [{ shot: 1, reason: "busy" }] }), { type: "outOfCredits", needed: 50 }], rich);
    expect(outOfCreditsShown(s)).toBe(true);
    const back = agentReducer(s, { type: "shotFailed", runsId: "r", shot: 1, refund: 50 });
    expect(back.credits).toBe(90);
    expect(back.outOfCredits).toBe(false);
    expect(outOfCreditsShown(back)).toBe(false);
  });
});

describe("shot failure → ask → continue", () => {
  const QUESTION = { id: "failure" as const, title: "Shot 2 didn't generate. How should I continue?", multi: false, options: [{ value: "retry", label: "Retry shot 2" }], defaults: ["retry"] };
  const failed = run([GEN({ fail: [{ shot: 2, reason: "busy" }] }), { type: "shotFailed", runsId: "r", shot: 2, refund: 50 }]);
  const asked = agentReducer(failed, { type: "askFailure", runsId: "r", askId: "ask", shots: [2], question: QUESTION });
  it("refunds the failed shot once, without a reply line", () => {
    expect(failed.credits).toBe(35600 - 140 + 50);
    const again = agentReducer(failed, { type: "shotFailed", runsId: "r", shot: 2, refund: 50 });
    expect(again.credits).toBe(failed.credits);
    expect(failed.messages.at(-1)?.kind).toBe("runs");
  });
  it("pauses with the ask card instead of delivering a reel", () => {
    expect(asked.generating).toBe(false);
    expect(asked.messages.at(-1)).toMatchObject({ kind: "ask", runsId: "r", shots: [2] });
    expect(pendingAsk(asked.messages)?.id).toBe("ask");
    expect(kinds(asked)).not.toContain("reel");
  });
  it("answering collapses the card into a question / answer card", () => {
    const s = agentReducer(asked, { type: "failureAnswered", askId: "ask", userId: "u", transcript: "Q: …", rows: [{ question: QUESTION.title, answer: "Retry shot 2 (Recommended)" }] });
    expect(pendingAsk(s.messages)).toBeUndefined();
    expect(s.messages.at(-1)).toMatchObject({ kind: "user", rows: [{ question: QUESTION.title, answer: "Retry shot 2 (Recommended)" }] });
    /* Other(改稿):放弃这一轮,退回基础费 */
    expect(agentReducer(asked, { type: "failureAnswered", askId: "ask", userId: "u", transcript: "", rows: [], refund: 40 }).credits).toBe(asked.credits + 40);
  });
  it("retry charges the failed shots, re-runs only them, then delivers one reel", () => {
    const answered = agentReducer(asked, { type: "failureAnswered", askId: "ask", userId: "u", transcript: "", rows: [] });
    const retrying = agentReducer(answered, { type: "continueRun", runsId: "r2", agentId: "a2", text: "Retrying shot 2, then I'll finish the edit.", outline: OUTLINE("v1"), cost: 50, only: [2] });
    expect(retrying.generating).toBe(true);
    expect(retrying.credits).toBe(answered.credits - 50);
    expect(findRun(retrying.messages)).toMatchObject({ only: [2], charged: 50 });
    const done = agentReducer(retrying, { type: "runsDone", reelId: "reel", outline: OUTLINE("v1"), runsId: "r2" });
    expect(kinds(done).filter((k) => k === "reel")).toHaveLength(1);
    expect(done.credits).toBe(35600 - 140);
  });
  it("footage / cut continue with an edit-only run that charges nothing", () => {
    const answered = agentReducer(asked, { type: "failureAnswered", askId: "ask", userId: "u", transcript: "", rows: [] });
    const s = agentReducer(answered, { type: "continueRun", runsId: "r2", agentId: "a2", text: "…", outline: OUTLINE("cut"), cost: 0, editOnly: true });
    expect(findRun(s.messages)).toMatchObject({ editOnly: true, charged: 0 });
    expect(s.credits).toBe(answered.credits);
    const done = agentReducer(s, { type: "runsDone", reelId: "reel", outline: OUTLINE("cut"), runsId: "r2" });
    expect(done.messages.at(-1)).toMatchObject({ kind: "reel", outline: { direction: "cut" } });
  });
  it("a stopped run never asks", () => {
    const stopped = agentReducer(failed, { type: "stopped", runsId: "r", atMs: 100, refund: 90, agentId: "s", text: "Stopped." });
    expect(agentReducer(stopped, { type: "askFailure", runsId: "r", askId: "ask", shots: [2], question: QUESTION })).toBe(stopped);
  });
});

describe("stop", () => {
  it("freezes the run, refunds and ends generation; ignores a late runsDone", () => {
    const s = run([GEN(), { type: "stopped", runsId: "r", atMs: 2000, refund: 140, agentId: "s", text: "Stopped. 140 credits refunded." }]);
    expect(s.generating).toBe(false);
    expect(s.credits).toBe(35600);
    expect(findRun(s.messages)?.stoppedAtMs).toBe(2000);
    expect(s.messages.at(-1)).toMatchObject({ kind: "agent", text: "Stopped. 140 credits refunded." });
    expect(agentReducer(s, { type: "runsDone", reelId: "x", outline: OUTLINE("v1") })).toBe(s);
  });
});

describe("use this version", () => {
  it("re-posts a superseded plan as the newest card without touching the model", () => {
    const s = run([
      ...PLAN,
      { type: "outlineRequested", req: { brief: { platform: "TikTok", durationSec: 15, audience: "", sellingPoints: [], cta: "", subtitleLang: "English" }, profiles: [] }, thinkingId: "t2", text: "…" },
      { type: "outlineOk", thinkingId: "t2", planId: "p2", outline: OUTLINE("v2") },
      { type: "reusePlan", fromId: "p1", planId: "p3" },
    ]);
    const plans = s.messages.filter((m) => m.kind === "plan");
    expect(plans.map((p) => p.id)).toEqual(["p1", "p2", "p3"]);
    expect(plans.map((p) => (p.kind === "plan" ? !!p.superseded : null))).toEqual([true, true, false]);
    expect(plans[2].kind === "plan" && plans[2].outline.direction).toBe("v1");
  });
});

describe("delete reel", () => {
  const withReel = run([GEN(), { type: "runsDone", reelId: "reel", outline: OUTLINE("v1") }]);
  it("removes the card, shows Reel deleted with Undo, and Undo puts it back in place", () => {
    const del = agentReducer(withReel, { type: "reelDeleted", reelId: "reel", toastId: "t", text: "Reel deleted" });
    expect(kinds(del)).not.toContain("reel");
    expect(del.toast).toEqual({ id: "t", text: "Reel deleted", undo: true });
    const undone = agentReducer(del, { type: "deleteUndone" });
    expect(undone.messages).toEqual(withReel.messages);
    expect(undone.toast).toBeNull();
  });
  it("can't delete the reel while a run (e.g. Retry shot) is updating it", () => {
    const busy = run([GEN()], withReel);
    expect(busy.generating).toBe(true);
    const del = agentReducer({ ...busy, dialog: { kind: "deleteReel", reelId: "reel" } }, { type: "reelDeleted", reelId: "reel", toastId: "t", text: "Reel deleted" });
    expect(kinds(del)).toContain("reel");
    expect(del.trash).toBeFalsy();
    expect(del.dialog).toBeNull();
  });
  it("after the toast times out the deletion sticks", () => {
    const del = agentReducer(withReel, { type: "reelDeleted", reelId: "reel", toastId: "t", text: "Reel deleted" });
    const gone = agentReducer(del, { type: "toastDismissed", id: "t" });
    expect(gone.trash).toBeNull();
    expect(agentReducer(gone, { type: "deleteUndone" })).toBe(gone);
  });
});
