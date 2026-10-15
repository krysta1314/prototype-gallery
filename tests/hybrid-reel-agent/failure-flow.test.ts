/* 失败后的续跑(异常处理 spec 第 1、2 条):各选项扣多少、怎么跑;改写只在 Generate 时扣费;配音失败;评审预置。 */
import { describe, expect, it } from "vitest";
import { applyPrompts, promptRewrite, scriptRewrite, shotPlan, voiceFailureQuestion, voicePlan } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/logic/failure";
import { genGrid, runPauses } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/logic/genGrid";
import { runEndMs, schedule, settleMs, shotFail, stopRefund, toolRuns } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/logic/runs";
import { START_CREDITS, reelCost } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/logic/credits";
import { voiceCost, voiceLines } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/logic/voice";
import { INITIAL_STATE, agentReducer, findRun, pendingAsk, pendingRewrite, type AgentAction, type AgentState, type Msg } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/store";
import { DEFAULT_OPTS, agentFailFor, agentFailShotFor, buildPreset, type AgentStepId } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/review/journeys";
import RELLET from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/fixture/rellet.json";
import type { FixtureData } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/fixture/types";

const DATA = RELLET as unknown as FixtureData;
const { outline, profiles } = DATA.en;
const run = (actions: AgentAction[], from: AgentState = INITIAL_STATE) => actions.reduce(agentReducer, from);
const preset = (id: AgentStepId, over = {}) => buildPreset(id, { ...DEFAULT_OPTS, ...over }, DATA);
const kinds = (s: AgentState) => s.messages.map((m) => m.kind);

describe("continuing after a failed shot", () => {
  it("generating options charge 50 per shot and only rerun the failed shots", () => {
    for (const c of ["retry", "model", "reference"] as const) {
      const p = shotPlan(c, outline, [3], profiles);
      expect(p.cost).toBe(50);
      expect(p.mode).toEqual({ only: [3] });
    }
    const m = shotPlan("model", outline, [3], profiles).outline.shots[2].source;
    expect(m.kind === "generate" && m.model).toBe("Seedance 2.0 Fast");
    const r = shotPlan("reference", outline, [3], profiles).outline.shots[2].source;
    expect(r.kind === "generate" && r.refs).toBeUndefined();
    expect(shotPlan("retry", outline, [2, 3], profiles).cost).toBe(100);
  });
  it("non-generating options are free and go straight to the edit", () => {
    for (const c of ["photo", "footage", "cut"] as const) {
      const p = shotPlan(c, outline, [3], profiles);
      expect(p.cost).toBe(0);
      expect(p.mode).toEqual({ editOnly: true });
    }
    expect(shotPlan("photo", outline, [3], profiles).outline.shots[2].source).toMatchObject({ kind: "clip", clipIndex: 1 });
    expect(shotPlan("cut", outline, [3], profiles).outline.shots).toHaveLength(outline.shots.length - 1);
  });
});

describe("continuing after a failed voiceover", () => {
  it("retry / another voice redo only the voiceover at the voiceover price; skip is free", () => {
    expect(voicePlan("retry", outline)).toMatchObject({ cost: 30, mode: { voiceOnly: true } });
    const v = voicePlan("voice", outline);
    expect(v).toMatchObject({ cost: 30, mode: { voiceOnly: true }, voiceLabel: "Nova" });
    expect(v.outline.voiceover?.voice).toBe("bright-f");
    const skip = voicePlan("skip", outline);
    expect(skip).toMatchObject({ cost: 0, mode: { editOnly: true } });
    expect(skip.outline.voiceover?.on).toBe(false);
  });
  it("a voice-only run is one Generate audio row then the edit; its grid has just the voiceover card", () => {
    expect(toolRuns(outline, { voiceOnly: true }).map((r) => r.id)).toEqual(["audio", "ff-cut", "ff-assemble", "ff-subs", "ff-mix", "check"]);
    const g = genGrid({ outline, voiceOnly: true }, 0);
    expect(g.cards.map((c) => c.kind)).toEqual(["voice"]);
  });
  it("a failing voiceover card shows the reason and the run pauses once generations settle", () => {
    const g = genGrid({ outline, voiceFail: "script" }, Infinity);
    expect(g.phase).toBe("paused");
    expect(g.cards.find((c) => c.kind === "voice")).toMatchObject({ status: "failed", reason: "The script may contain restricted words" });
    const slots = schedule(toolRuns(outline));
    expect(runEndMs(slots, [], true)).toBe(settleMs(slots));
    expect(runPauses({ voiceFail: "busy" })).toBe(true);
  });
  it("an unresolved voiceover failure carried onto an edit-only run pauses before the edit", () => {
    expect(genGrid({ outline, editOnly: true, held: "busy" }, 0).phase).toBe("paused");
    expect(genGrid({ outline, editOnly: true }, Infinity).phase).toBe("done");
  });
  it("a failed voiceover is not kept on stop (refunded once, not counted as finished)", () => {
    const runs = toolRuns(outline);
    const slots = schedule(runs);
    const charged = reelCost(outline);
    /* 全部结算完:成功的话只退基础费;配音失败且已退了 30 → 也只退基础费 40,不会把配音再算一遍 */
    expect(stopRefund({ outline, charged, refunded: 0, runs, slots, atMs: settleMs(slots) })).toBe(40);
    expect(stopRefund({ outline, charged, refunded: 30, runs, slots, atMs: settleMs(slots), voiceFail: true })).toBe(40);
  });
});

describe("store: refunds, asks and the rewrite card", () => {
  const GEN: AgentAction = { type: "generate", agentId: "a", runsId: "r", text: "go", outline, fail: [shotFail(3, "moderation")], voiceFail: "busy" };
  it("a failed voiceover refunds once", () => {
    const s = run([GEN, { type: "voiceFailed", runsId: "r", refund: 30 }, { type: "voiceFailed", runsId: "r", refund: 30 }]);
    expect(s.credits).toBe(START_CREDITS - reelCost(outline) + 30);
    expect(findRun(s.messages)).toMatchObject({ voiceFail: "busy", voiceRefunded: true, refunded: 30 });
    /* 这一轮没有配音失败时不退 */
    expect(run([{ ...GEN, voiceFail: undefined } as AgentAction, { type: "voiceFailed", runsId: "r", refund: 30 }]).credits).toBe(START_CREDITS - reelCost(outline));
  });
  it("rewrite: choosing it charges nothing; only Generate charges and reruns the shot with the new prompt", () => {
    const q = { id: "failure", title: "Shot 3 didn't generate. How should I continue?", multi: false, options: [], defaults: ["rewrite"] } as never;
    const p = promptRewrite(outline, [3], "en");
    const asked = run([
      { ...GEN, voiceFail: undefined } as AgentAction,
      { type: "shotFailed", runsId: "r", shot: 3, refund: 50 },
      { type: "askFailure", runsId: "r", askId: "ask", shots: [3], question: q, shotKind: "moderation" },
    ]);
    expect(pendingAsk(asked.messages)).toMatchObject({ shotKind: "moderation" });
    const proposed = run(
      [
        { type: "failureAnswered", askId: "ask", userId: "u", transcript: "", rows: [] },
        { type: "rewriteProposed", id: "rw", text: p.text, shots: [3], outline, items: p.items, cost: p.cost },
      ],
      asked,
    );
    expect(proposed.credits).toBe(asked.credits);
    expect(proposed.generating).toBe(false);
    expect(pendingRewrite(proposed.messages)?.id).toBe("rw");
    const generated = agentReducer(proposed, {
      type: "continueRun",
      runsId: "r2",
      agentId: "a2",
      text: "…",
      outline: applyPrompts(outline, p.items),
      cost: p.cost,
      only: [3],
      resolves: "rw",
    });
    expect(generated.credits).toBe(proposed.credits - 50);
    expect(pendingRewrite(generated.messages)).toBeUndefined();
    expect(generated.messages.find((m) => m.id === "rw")).toMatchObject({ status: "generated" });
    const r2 = findRun(generated.messages, "r2")!;
    expect(r2.only).toEqual([3]);
    const src = r2.outline.shots[2].source;
    expect(src.kind === "generate" && src.prompt).toBe(p.items[0].after);
  });
  it("typing instead of Generate drops the rewrite card and refunds the unused base fee", () => {
    const p = promptRewrite(outline, [3], "en");
    const s = run([{ type: "rewriteProposed", id: "rw", text: p.text, shots: [3], outline, items: p.items, cost: p.cost }]);
    const dropped = agentReducer(s, { type: "rewriteDropped", rewriteId: "rw", refund: 40 });
    expect(dropped.credits).toBe(s.credits + 40);
    expect(dropped.messages[0]).toMatchObject({ kind: "rewrite", status: "dropped" });
    expect(agentReducer(dropped, { type: "rewriteDropped", rewriteId: "rw", refund: 40 })).toBe(dropped);
  });
});

describe("review presets for the new failure steps", () => {
  const ask = (s: AgentState) => s.messages.findLast((m): m is Extract<Msg, { kind: "ask" }> => m.kind === "ask");
  it("genModeration: the shot fails review, 50 refunded, the moderation question is waiting", () => {
    for (const lang of ["zh", "en"] as const) {
      const s = preset("genModeration", { lang }).state;
      const shot = agentFailShotFor({ ...DEFAULT_OPTS, lang }, DATA)!;
      expect(s.messages.at(-1)?.kind).toBe("ask");
      expect(ask(s)?.question.options.map((o) => o.value)).toEqual(["rewrite", "reference", "photo", "footage", "cut"]);
      expect(findRun(s.messages)?.fail).toEqual([shotFail(shot, "moderation")]);
      expect(s.credits).toBe(35430);
    }
  });
  it("genRewrite: the answer card, the agent line and the rewrite card wait for Generate, nothing charged", () => {
    for (const lang of ["zh", "en"] as const) {
      const s = preset("genRewrite", { lang }).state;
      expect(kinds(s).slice(-3)).toEqual(["runs", "user", "rewrite"]);
      const rw = pendingRewrite(s.messages)!;
      expect(rw.cost).toBe(50);
      expect(rw.items[0].after).toMatch(/(No identifiable faces|画面中不出现可识别的人脸)/);
      expect(s.credits).toBe(35430);
      expect(s.generating).toBe(false);
    }
    expect(pendingRewrite(preset("genRewrite", { lang: "en" }).state.messages)?.text).toMatch(/^I removed .* Here's the new prompt for shot 3:$/);
  });
  it("genVoiceFailed: the voiceover fails, its credits come back, the voice question is waiting", () => {
    const s = preset("genVoiceFailed", { lang: "en" }).state;
    expect(findRun(s.messages)).toMatchObject({ voiceFail: "busy", voiceRefunded: true });
    expect(ask(s)?.question.title).toBe("The voiceover didn't generate. How should I continue?");
    expect(ask(s)?.question.defaults).toEqual(["retry"]);
    expect(ask(s)?.shots).toEqual([]);
    expect(s.credits).toBe(START_CREDITS - 220 + 30);
    /* 开关选「配音·敏感词」时本步换成敏感词那一套 */
    expect(ask(preset("genVoiceFailed", { lang: "en", agentFail: "voiceScript" }).state)?.question.defaults).toEqual(["rewrite"]);
    /* 旁白关掉:配音不会失败,照常出成片 */
    expect(preset("genVoiceFailed", { voiceover: false }).state.messages.at(-1)?.kind).toBe("reel");
  });
  it("reel with each failure mode recovers via the recommended option and ends at the normal balance", () => {
    for (const agentFail of ["shotBusy", "shotModeration", "voiceBusy", "voiceScript"] as const) {
      const s = preset("reel", { agentFail, lang: "en" }).state;
      expect(s.messages.at(-1)?.kind).toBe("reel");
      expect(s.credits).toBe(START_CREDITS - 220);
      expect(s.generating).toBe(false);
    }
    const mod = preset("reel", { agentFail: "shotModeration", lang: "en" }).state;
    expect(mod.messages.find((m) => m.kind === "rewrite")).toMatchObject({ status: "generated" });
    const reel = mod.messages.at(-1);
    const src = reel?.kind === "reel" ? reel.outline.shots[2].source : null;
    expect(src?.kind === "generate" && src.prompt).toMatch(/No identifiable faces/);
    const script = preset("reel", { agentFail: "voiceScript", lang: "en" }).state.messages.at(-1);
    expect(script?.kind === "reel" && voiceLines(script.outline)).toContain("Bulky serums are a hassle to carry");
    expect(findRun(preset("reel", { agentFail: "voiceBusy", lang: "en" }).state.messages)).toMatchObject({ voiceOnly: true, charged: voiceCost(outline) });
  });
  it("agentFailFor: steps carry their own failure, other steps follow the toggle", () => {
    const shot = agentFailShotFor(DEFAULT_OPTS, DATA);
    expect(agentFailFor("genFailed", DEFAULT_OPTS, DATA)).toEqual({ shot, shotKind: "busy" });
    expect(agentFailFor("genRewrite", DEFAULT_OPTS, DATA)).toEqual({ shot, shotKind: "moderation" });
    expect(agentFailFor("genVoiceFailed", DEFAULT_OPTS, DATA)).toEqual({ voice: "busy" });
    expect(agentFailFor("plan", DEFAULT_OPTS, DATA)).toEqual({});
    expect(agentFailFor("plan", { ...DEFAULT_OPTS, agentFail: "voiceScript" }, DATA)).toEqual({ voice: "script" });
    expect(agentFailFor("plan", { ...DEFAULT_OPTS, agentFail: "voiceBusy", voiceover: false }, DATA)).toEqual({});
  });
  it("the voice question follows the outline's voice", () => {
    expect(voiceFailureQuestion(DATA.zh.outline, "script").options.map((o) => o.label)).toEqual(["Rewrite the script and retry", "Try another voice", "Skip the voiceover"]);
    expect(scriptRewrite(DATA.zh.outline, voiceLines(DATA.zh.outline), "zh").text).toMatch(/^我换掉了可能触发审核的/);
  });
});
