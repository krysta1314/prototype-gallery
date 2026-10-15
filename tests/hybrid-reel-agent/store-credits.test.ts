import { describe, expect, it } from "vitest";
import {
  INITIAL_STATE,
  agentReducer,
  findRun,
  reelMissing,
  shotRetryable,
  type AgentAction,
  type AgentState,
} from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/store";
import type { Outline } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";

const OUTLINE = (tag: string): Outline => ({
  shots: [],
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
    const s = run([{ type: "dialog", dialog: { kind: "noCredits", needed: 140, balance: 30 } }]);
    expect(s.dialog?.kind).toBe("noCredits");
    expect(run([GEN()], s).dialog).toBeNull();
  });
});

describe("shot failure and retry", () => {
  const failed = run([
    GEN({ fail: [{ shot: 2, reason: "busy" }] }),
    { type: "shotFailed", runsId: "r", shot: 2, refund: 50, agentId: "f", text: "Shot 2 failed — busy. 50 credits refunded." },
  ]);
  it("refunds the failed shot once and adds a reply carrying Retry shot", () => {
    expect(failed.credits).toBe(35600 - 140 + 50);
    const again = agentReducer(failed, { type: "shotFailed", runsId: "r", shot: 2, refund: 50, agentId: "f2", text: "x" });
    expect(again.credits).toBe(failed.credits);
    const reply = failed.messages.at(-1);
    expect(reply?.kind === "agent" && reply.retryShot).toBe(2);
  });
  it("still delivers the reel, with the failed shot as a placeholder", () => {
    const s = agentReducer(failed, { type: "runsDone", reelId: "reel", outline: OUTLINE("v1"), runsId: "r" });
    const reel = s.messages.find((m) => m.kind === "reel");
    expect(reel?.kind === "reel" && reel.missingShots).toEqual([2]);
    expect(shotRetryable(s, 2)).toBe(true);
    expect(reelMissing(s.messages, 2)).toBe("reel");
  });
  it("retry charges the shot, re-runs only it, then fills the reel in place", () => {
    const done = agentReducer(failed, { type: "runsDone", reelId: "reel", outline: OUTLINE("v1"), runsId: "r" });
    const retrying = agentReducer(done, { type: "retryShot", runsId: "r2", agentId: "a2", text: "Retrying shot 2.", outline: OUTLINE("v1"), shot: 2, cost: 50, reelId: "reel" });
    expect(retrying.generating).toBe(true);
    expect(retrying.credits).toBe(done.credits - 50);
    expect(findRun(retrying.messages)?.only).toBe(2);
    expect(shotRetryable(retrying, 2)).toBe(false);
    const filled = agentReducer(retrying, { type: "runsDone", reelId: "ignored", outline: OUTLINE("v1"), runsId: "r2", note: { id: "n", text: "Shot 2 is back in the reel." } });
    expect(kinds(filled).filter((k) => k === "reel")).toHaveLength(1);
    const reel = filled.messages.find((m) => m.kind === "reel");
    expect(reel?.kind === "reel" && reel.missingShots).toEqual([]);
    expect(filled.messages.at(-1)).toMatchObject({ kind: "agent", text: "Shot 2 is back in the reel." });
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
