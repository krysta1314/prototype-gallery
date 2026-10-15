/* 异常处理 spec 2026-10-15 第 7、8、9、12 条:风险要求检测、超时长调整、剪辑失败的退款与重剪,及评审预置。 */
import { describe, expect, it } from "vitest";
import { detectRisks, hasRisks, riskChecks, riskNote, userAsks } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/logic/risk";
import { lengthFix, lengthNotes } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/logic/overlength";
import { deliveryNotes } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/logic/delivery";
import { editCost, editFailText, editFailureQuestion, editPlan, failureAnswer } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/logic/failure";
import { editFailMs, runEndMs, schedule, toolRuns, totalMs } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/logic/runs";
import { genGrid } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/logic/genGrid";
import { START_CREDITS, reelCost } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/logic/credits";
import { withLongScript } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/fixture/transform";
import { INITIAL_STATE, agentReducer, findRun, pendingAsk, type AgentAction, type AgentState, type Msg } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/store";
import { DEFAULT_OPTS, RISKY_PROMPT, agentFailFor, buildPreset, type AgentStepId } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/review/journeys";
import RELLET from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/fixture/rellet.json";
import type { FixtureData } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/fixture/types";

const DATA = RELLET as unknown as FixtureData;
const { outline } = DATA.en;
const run = (actions: AgentAction[], from: AgentState = INITIAL_STATE) => actions.reduce(agentReducer, from);
const preset = (id: AgentStepId, over = {}) => buildPreset(id, { ...DEFAULT_OPTS, ...over }, DATA);

describe("risky requests (row 7)", () => {
  it("finds celebrities, competitors and unverifiable claims in English", () => {
    const r = detectRisks(RISKY_PROMPT.en);
    expect(r).toEqual({ celebrities: ["Taylor Swift"], competitors: ["La Mer"], claims: ["cures dry skin in 3 days", "100% effective"] });
    expect(riskNote(r, "en")).toBe(
      'I can\'t use a real celebrity, so a regular model plays the part. I also can\'t name another brand (La Mer), so the comparison says "ordinary products" instead. I also dropped the claims "cures dry skin in 3 days" and "100% effective" — I can\'t verify them.',
    );
  });
  it("finds them in Chinese and writes the note in Chinese", () => {
    const r = detectRisks(RISKY_PROMPT.zh);
    expect(r).toEqual({ celebrities: ["杨幂"], competitors: ["兰蔻"], claims: ["3天告别干皮", "100%有效"] });
    expect(riskNote(r, "zh")).toContain("我不能用真实明星,换成了普通模特出镜。");
    expect(riskNote(r, "zh")).toContain("「3天告别干皮」、「100%有效」");
  });
  it("only a claim: one sentence, singular", () => {
    const r = detectRisks("Make an ad that says it cures acne in 3 days");
    expect(r.claims).toEqual(["cures acne in 3 days"]);
    expect(riskNote(r, "en")).toBe('I dropped the claim "cures acne in 3 days" — I can\'t verify it.');
  });
  it("nothing risky → no note, no check; names match whole words only", () => {
    for (const t of [DATA.en.prompt, DATA.zh.prompt, "Make a lamer ad", "A skincare routine"]) {
      const r = detectRisks(t);
      expect(hasRisks(r)).toBe(false);
      expect(riskNote(r, "en")).toBeUndefined();
      expect(riskChecks(r, "en")).toEqual([]);
    }
  });
  it("one brand written two ways is named once", () => {
    expect(detectRisks("better than SK-II, I mean SK2 神仙水").competitors).toEqual(["SK-II"]);
  });
  it("efficacy claims add one Needs-your-check item; celebrities / competitors don't", () => {
    const base = deliveryNotes(outline, DATA.en.brief.brief, DATA.en.profiles, "en");
    const withClaims = deliveryNotes(outline, DATA.en.brief.brief, DATA.en.profiles, "en", detectRisks(RISKY_PROMPT.en));
    expect(withClaims.checks).toHaveLength(base.checks.length + 1);
    expect(withClaims.checks.at(-1)).toBe('I left out "cures dry skin in 3 days" and "100% effective" — only add an efficacy claim back if you can back it up.');
    const celeb = deliveryNotes(outline, DATA.en.brief.brief, DATA.en.profiles, "en", detectRisks("with Zendaya"));
    expect(celeb.checks).toEqual(base.checks);
  });
  it("userAsks reads the prompt and revisions before a message, not answer cards", () => {
    const msgs: Msg[] = [
      { id: "u1", kind: "user", text: "Make an ad with Rihanna" },
      { id: "u2", kind: "user", text: "Platform", rows: [{ question: "Q", answer: "cures acne" }] },
      { id: "p1", kind: "plan", outline },
      { id: "u3", kind: "user", text: "100% effective" },
    ];
    expect(userAsks(msgs, 2)).toBe("Make an ad with Rihanna");
    expect(userAsks(msgs)).toBe("Make an ad with Rihanna\n100% effective");
  });
  it("review step 「风险要求绕开」 replays the recorded plan under the risky prompt", () => {
    for (const lang of ["zh", "en"] as const) {
      const s = preset("risky", { lang }).state;
      expect(s.messages.at(-1)?.kind).toBe("plan");
      expect(s.messages.some((m) => m.kind === "user" && m.text === RISKY_PROMPT[lang])).toBe(true);
      expect(hasRisks(detectRisks(userAsks(s.messages)))).toBe(true);
      expect(s.credits).toBe(START_CREDITS);
    }
  });
});

describe("over length / subtitle overflow (row 9)", () => {
  it("recorded scripts fit: no adjustments", () => {
    for (const lang of ["zh", "en"] as const) {
      const f = lengthFix(DATA[lang].outline);
      expect(f).toMatchObject({ sped: false, dropped: [], split: false });
      expect(lengthNotes(f, lang)).toEqual([]);
      expect(deliveryNotes(DATA[lang].outline, DATA[lang].brief.brief, DATA[lang].profiles, lang).adjusted).toEqual([]);
    }
  });
  it("a longer script: speed up, drop the longest secondary line, split long subtitles", () => {
    const f = lengthFix(withLongScript(outline, "en"));
    expect(f.limitSec).toBe(29);
    expect(f.estimateSec).toBeGreaterThan(29 * 1.1);
    expect(f.dropped).toEqual(["Your skin stays tight and flaky all day, no matter how much cream you pile on before work"]);
    expect(lengthNotes(f, "en")).toEqual([
      "I sped the voiceover up slightly (1.1×) and trimmed shot holds to keep it at 29s.",
      'I dropped the line "Your skin stays tight and flaky all day, no matter how much cream you pile on before work" to stay within 29s.',
      "Long subtitle lines are split across screens.",
    ]);
    const zh = lengthNotes(lengthFix(withLongScript(DATA.zh.outline, "zh")), "zh");
    expect(zh[0]).toBe("旁白稍微提速(1.1×)并压缩了镜头停留,保持在 30 秒。");
    expect(zh).toHaveLength(3);
  });
  it("only slightly over: speed up, nothing dropped", () => {
    const o = withLongScript(outline, "en");
    /* 只留一句长的:预估超过时长但在 1.1× 以内 */
    const words = (n: number) => Array.from({ length: n }, () => "word").join(" ");
    const one = { ...o, shots: o.shots.map((s, i) => ({ ...s, subtitle: { source: "authored" as const, text: i === 0 ? words(76) : "" } })) };
    const f = lengthFix(one);
    expect(f.sped).toBe(true);
    expect(f.dropped).toEqual([]);
  });
  it("hook and CTA lines are never dropped; voiceover off = no voice adjustments", () => {
    const o = withLongScript(outline, "en");
    const f = lengthFix(o);
    const kept = o.shots.filter((s) => s.role === "hook" || s.role === "cta").map((s) => s.subtitle!.text);
    for (const k of kept) expect(f.dropped).not.toContain(k);
    expect(lengthFix({ ...o, voiceover: { why: "", on: false } })).toMatchObject({ sped: false, dropped: [] });
  });
  it("「旁白超长」 toggle: the reel step shows the adjustment lines", () => {
    const s = preset("reel", { lang: "en", longScript: true }).state;
    const reel = s.messages.at(-1);
    expect(reel?.kind).toBe("reel");
    if (reel?.kind !== "reel" || !s.brief) return;
    expect(deliveryNotes(reel.outline, s.brief, s.profiles, "en").adjusted).toHaveLength(3);
    expect(reelCost(reel.outline)).toBe(220);
  });
});

describe("edit / render failure (row 8)", () => {
  it("the edit fails at the end of the assemble step, after every generation", () => {
    const slots = schedule(toolRuns(outline));
    expect(editFailMs(slots)).toBe(slots.find((s) => s.id === "ff-assemble")!.endMs);
    expect(runEndMs(slots, [], false, true)).toBe(editFailMs(slots));
    expect(runEndMs(slots, [], false, false)).toBe(totalMs(slots));
    const g = genGrid({ outline, editFail: true }, Infinity);
    expect(g.phase).toBe("editFailed");
    expect(g.status).toBe("Couldn't finish the edit.");
    expect(g.cards.every((c) => c.status === "done")).toBe(true);
    /* 有生成失败要先问:这一轮到不了剪辑 */
    expect(genGrid({ outline, editFail: true, voiceFail: "busy" }, Infinity).phase).toBe("paused");
  });
  it("question, text and retry plan", () => {
    const q = editFailureQuestion(outline);
    expect(q.title).toBe("The edit didn't finish. How should I continue?");
    expect(q.options.map((o) => [o.label, o.description])).toEqual([
      ["Retry the edit", "Re-cut with what's already generated · 40 credits"],
      ["Open in canvas", "Everything is on the canvas to edit yourself"],
    ]);
    expect(q.defaults).toEqual(["retry"]);
    expect(editFailText(outline, 40, "en")).toBe("I couldn't finish the edit — your shots and voiceover are safe. 40 credits refunded.");
    expect(editFailText({ ...outline, voiceover: { why: "", on: false } }, 40, "en")).toContain("your shots are safe");
    expect(editFailText(outline, 40, "zh")).toBe("剪辑没完成 —— 已生成的镜头和配音都还在。退回 40 积分。");
    expect(editPlan(outline)).toEqual({ outline, cost: editCost(outline), mode: { editOnly: true } });
    expect(editCost(outline)).toBe(40);
    expect(failureAnswer({ failure: { picked: ["canvas"] } }, q)).toEqual({ choice: "canvas" });
    expect(failureAnswer({ failure: { picked: [] } }, q)).toEqual({ choice: "retry" });
  });
  it("reducer: refund 40 once, lead line + ask, retry charges 40 again", () => {
    const cost = reelCost(outline);
    let s = run([{ type: "generate", agentId: "a", runsId: "r1", text: "go", outline, cost, editFail: true }]);
    expect(findRun(s.messages)).toMatchObject({ editFail: true });
    s = run([{ type: "editFailed", runsId: "r1", refund: 40 }, { type: "editFailed", runsId: "r1", refund: 40 }], s);
    expect(s.credits).toBe(START_CREDITS - cost + 40);
    expect(findRun(s.messages)).toMatchObject({ refunded: 40, editRefunded: true });
    const q = editFailureQuestion(outline);
    s = run([{ type: "askFailure", runsId: "r1", askId: "k", shots: [], edit: true, question: q, lead: { id: "l", text: editFailText(outline, 40, "en") } }], s);
    expect(s.generating).toBe(false);
    expect(s.messages.slice(-2).map((m) => m.kind)).toEqual(["agent", "ask"]);
    expect(pendingAsk(s.messages)).toMatchObject({ edit: true, shots: [] });
    s = run([{ type: "continueRun", runsId: "r2", agentId: "a2", text: "re-cut", outline, cost: 40, editOnly: true }], s);
    expect(s.credits).toBe(START_CREDITS - cost);
  });
  it("review step 「剪辑失败」 stops on the question with 40 refunded", () => {
    for (const lang of ["zh", "en"] as const) {
      const s = preset("editFailed", { lang }).state;
      const ask = pendingAsk(s.messages);
      expect(ask).toMatchObject({ edit: true });
      expect(ask?.question.title).toBe("The edit didn't finish. How should I continue?");
      expect(s.credits).toBe(START_CREDITS - reelCost(DATA[lang].outline) + 40);
      expect(findRun(s.messages)).toMatchObject({ editFail: true, editRefunded: true });
    }
    /* 这一步只演示剪辑失败,不受「生成失败(Agent)」开关影响 */
    expect(agentFailFor("editFailed", { ...DEFAULT_OPTS, agentFail: "shotBusy" }, DATA)).toEqual({});
  });
  it("「剪辑失败」 toggle: the reel step re-cuts once and ends with the same balance", () => {
    const s = preset("reel", { lang: "en", failEdit: true }).state;
    expect(s.messages.at(-1)?.kind).toBe("reel");
    expect(findRun(s.messages)).toMatchObject({ editOnly: true, charged: 40 });
    expect(s.credits).toBe(START_CREDITS - reelCost(outline));
    /* 和生成失败叠加:剪辑失败落在续跑那一轮 */
    const both = preset("reel", { lang: "en", failEdit: true, agentFail: "shotBusy" }).state;
    expect(both.messages.at(-1)?.kind).toBe("reel");
    expect(both.messages.filter((m) => m.kind === "runs" && m.editFail)).toHaveLength(1);
    expect(both.credits).toBe(START_CREDITS - reelCost(outline));
  });
});

describe("download failure toast (row 12)", () => {
  it("a toast can carry a retry target", () => {
    const s = run([{ type: "toast", toast: { id: "t", text: "Download failed — try again", retry: { url: "/x.mp4", fileName: "x.mp4" } } }]);
    expect(s.toast?.retry).toEqual({ url: "/x.mp4", fileName: "x.mp4" });
    expect(run([{ type: "toastDismissed", id: "t" }], s).toast).toBeNull();
  });
});
