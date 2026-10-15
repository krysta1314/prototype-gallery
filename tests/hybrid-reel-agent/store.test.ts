import { describe, expect, it } from "vitest";
import {
  INITIAL_STATE,
  agentReducer,
  analysedFileCount,
  detectLang,
  latestOutline,
  pendingRetry,
  readingText,
  retryVisible,
  type AgentAction,
  type AgentState,
  type Msg,
} from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/store";
import type { Brief, ClipProfile, Outline } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";

const BRIEF: Brief = { platform: "TikTok", durationSec: 30, audience: "", sellingPoints: [], cta: "", subtitleLang: "简体中文" };
const PROFILES = [{ label: "a.mp4" }] as unknown as ClipProfile[];
const OUTLINE = (tag: string): Outline => ({
  shots: [],
  direction: tag,
  bgmPrompt: "",
  credits: { base: 40, perGenerateShot: 50, generatedShots: 0, total: 40 },
  model: "seed",
});
const run = (actions: AgentAction[], from: AgentState = INITIAL_STATE) => actions.reduce(agentReducer, from);
const kinds = (s: AgentState) => s.messages.map((m) => m.kind);

const START: AgentAction = {
  type: "start",
  prompt: "制作一条广告",
  lang: "zh",
  files: [{ name: "a.mp4", url: "/a.mp4", kind: "video" }],
  media: [{ key: "k:0", url: "/a.mp4" }],
  ids: { files: "f", user: "u" },
};
const PLANNED: AgentAction[] = [
  START,
  { type: "thinking", id: "t1", text: "正在看这 1 个文件…" },
  { type: "analyzed", profiles: PROFILES },
  { type: "briefed", thinkingId: "t1", analysisId: "a1", reply: "ok", brief: BRIEF, questions: [], questionsId: "q1" },
  { type: "outlineRequested", req: { brief: BRIEF, profiles: PROFILES }, thinkingId: "t2", text: "正在排分镜…" },
  { type: "outlineOk", thinkingId: "t2", planId: "p1", outline: OUTLINE("v1") },
];

describe("detectLang", () => {
  it("is zh when the text has CJK", () => {
    expect(detectLang("制作一条广告")).toBe("zh");
    expect(detectLang("Make an ad")).toBe("en");
  });
  it("falls back when the prompt is empty, not when it is English", () => {
    expect(detectLang("", "zh")).toBe("zh");
    expect(detectLang("   ", "zh")).toBe("zh");
    expect(detectLang("Make an ad", "zh")).toBe("en");
    expect(detectLang("")).toBe("en");
  });
});

describe("start / empty", () => {
  it("switches to chat with the files and the prompt bubble", () => {
    const s = run([START]);
    expect(s.screen).toBe("chat");
    expect(kinds(s)).toEqual(["files", "user"]);
    expect(s.lang).toBe("zh");
    expect(s.media).toEqual([{ key: "k:0", url: "/a.mp4" }]);
  });
  it("omits the user bubble when the prompt is empty", () => {
    expect(kinds(run([{ ...START, prompt: "" } as AgentAction]))).toEqual(["files"]);
  });
  it("empty shows the chat screen's empty state", () => {
    const s = run([{ type: "empty" }]);
    expect(s).toMatchObject({ screen: "chat", empty: true });
  });
});

describe("analysis → plan", () => {
  it("replaces the thinking row by id with the analysis, then appends the plan", () => {
    const s = run(PLANNED);
    expect(kinds(s)).toEqual(["files", "user", "analysis", "plan"]);
    expect(s.busy).toBe(false);
    expect(s.lastOutlineReq).toEqual({ brief: BRIEF, profiles: PROFILES });
  });
  it("shows the question card and stops being busy when there are questions", () => {
    const q = [{ id: "duration", title: "Length?", multi: false, options: [], defaults: [] }] as never;
    const s = run([START, { type: "thinking", id: "t1", text: "" }, { type: "briefed", thinkingId: "t1", analysisId: "a1", reply: "", brief: BRIEF, questions: q, questionsId: "q1" }]);
    expect(kinds(s)).toEqual(["files", "user", "analysis", "questions"]);
    expect(s.busy).toBe(false);
  });
  it("answering removes the card and adds the Q/A bubble", () => {
    const q = [{ id: "duration", title: "Length?", multi: false, options: [], defaults: [] }] as never;
    const s = run([
      START,
      { type: "thinking", id: "t1", text: "" },
      { type: "briefed", thinkingId: "t1", analysisId: "a1", reply: "", brief: BRIEF, questions: q, questionsId: "q1" },
      { type: "answered", questionsId: "q1", brief: { ...BRIEF, durationSec: 15 }, userId: "u2", transcript: "Q: Length?\nA: 15s" },
    ]);
    expect(kinds(s)).toEqual(["files", "user", "analysis", "user"]);
    expect(s.brief?.durationSec).toBe(15);
  });
});

describe("revisions and failures", () => {
  it("a new plan supersedes older plans only", () => {
    const s = run([
      ...PLANNED,
      { type: "said", userId: "u3", text: "开头换成雪山溪流" },
      { type: "outlineRequested", req: { brief: BRIEF, profiles: PROFILES, revise: { current: OUTLINE("v1"), change: "x" } }, thinkingId: "t3", text: "" },
      { type: "outlineOk", thinkingId: "t3", planId: "p2", outline: OUTLINE("v2") },
    ]);
    const plans = s.messages.filter((m): m is Extract<Msg, { kind: "plan" }> => m.kind === "plan");
    expect(plans.map((p) => [p.outline.direction, !!p.superseded])).toEqual([["v1", true], ["v2", false]]);
  });
  it("a failure turns that thinking row into a retry row even if rows were appended after it", () => {
    const s = run([
      ...PLANNED,
      { type: "outlineRequested", req: { brief: BRIEF, profiles: PROFILES }, thinkingId: "t3", text: "" },
      { type: "generate", agentId: "g1", runsId: "r1", text: "", outline: OUTLINE("v1") },
      { type: "failed", thinkingId: "t3", errId: "e1", retry: "outline", text: "boom" },
    ]);
    expect(kinds(s).slice(-3)).toEqual(["agent", "agent", "runs"]);
    expect(s.errRetryId).toBe("e1");
    expect(s.busy).toBe(false);
  });
  it("retryStarted removes the error row by id", () => {
    const s = run([
      START,
      { type: "thinking", id: "t1", text: "" },
      { type: "failed", thinkingId: "t1", errId: "e1", retry: "analyze", text: "x" },
      { type: "said", userId: "u9", text: "hi", hint: { id: "h9", text: "hit Retry" } },
      { type: "retryStarted" },
    ]);
    expect(kinds(s)).toEqual(["files", "user", "user", "agent"]);
    expect(s.errRetryId).toBeNull();
  });
});

describe("generation", () => {
  it("generate marks generating and appends the agent line and runs", () => {
    const s = run([...PLANNED, { type: "generate", agentId: "g1", runsId: "r1", text: "Meanwhile…", outline: OUTLINE("v1") }]);
    expect(s.generating).toBe(true);
    expect(kinds(s).slice(-2)).toEqual(["agent", "runs"]);
  });
  it("queued messages show as bubbles and are cleared when the run finishes", () => {
    const s = run([
      ...PLANNED,
      { type: "generate", agentId: "g1", runsId: "r1", text: "", outline: OUTLINE("v1") },
      { type: "queued", userId: "u5", text: "开头换成雪山溪流" },
    ]);
    expect(s.queue).toEqual(["开头换成雪山溪流"]);
    const done = agentReducer(s, { type: "runsDone", reelId: "reel1", outline: OUTLINE("v1") });
    expect(done.queue).toEqual([]);
    expect(done.generating).toBe(false);
    expect(kinds(done).slice(-1)).toEqual(["reel"]);
  });
  it("runsDone is a no-op when not generating (no duplicate reel)", () => {
    const s = run([...PLANNED, { type: "generate", agentId: "g1", runsId: "r1", text: "", outline: OUTLINE("v1") }, { type: "runsDone", reelId: "reel1", outline: OUTLINE("v1") }]);
    expect(s.generating).toBe(false);
    const again = agentReducer(s, { type: "runsDone", reelId: "reel2", outline: OUTLINE("v1") });
    expect(again).toBe(s);
    expect(kinds(again).filter((k) => k === "reel")).toHaveLength(1);
  });
});

describe("selectors", () => {
  it("latestOutline picks the newest plan or reel", () => {
    const s = run([...PLANNED, { type: "generate", agentId: "g", runsId: "r", text: "", outline: OUTLINE("v1") }, { type: "runsDone", reelId: "x", outline: OUTLINE("reel") }]);
    expect(latestOutline(s.messages)?.direction).toBe("reel");
    expect(latestOutline([])).toBeUndefined();
  });
  it("Retry shows only when user bubbles or plain agent lines follow", () => {
    const msgs: Msg[] = [
      { id: "e", kind: "agent", text: "x", retry: "outline" },
      { id: "u", kind: "user", text: "hi" },
      { id: "h", kind: "agent", text: "hint" },
    ];
    expect(retryVisible(msgs, 0)).toBe(true);
    expect(retryVisible([...msgs, { id: "t", kind: "thinking", text: "" }], 0)).toBe(false);
  });
});

describe("analysis progress, cancel and failure streak", () => {
  const fail = (n: number, extra: Partial<Extract<AgentAction, { type: "failed" }>> = {}): AgentAction[] => [
    { type: "thinking", id: `t${n}`, text: readingText(0, 1, "en"), cancellable: true },
    { type: "failed", thinkingId: `t${n}`, errId: `e${n}`, retry: "analyze", text: "x", details: "raw", ...extra },
    { type: "retryStarted" },
  ];
  it("progress rewrites the thinking row text and keeps it cancellable", () => {
    const s = run([START, { type: "thinking", id: "t1", text: readingText(0, 4, "en"), cancellable: true }, { type: "progress", id: "t1", text: readingText(2, 4, "en") }]);
    expect(s.messages.at(-1)).toEqual({ id: "t1", kind: "thinking", text: "Reading 2/4 files…", cancellable: true });
    expect(readingText(1, 3, "zh")).toBe("正在看素材 1/3…");
  });
  it("analysedFileCount leaves skipped files out of Read {n} files", () => {
    expect(analysedFileCount(4)).toBe(4);
    expect(analysedFileCount(4, [{ name: "b.mov", reason: "x" }])).toBe(3);
    expect(analysedFileCount(1, [{ name: "a", reason: "x" }, { name: "b", reason: "y" }])).toBe(0);
  });
  it("failed keeps the raw error as details", () => {
    const s = run([START, ...fail(1).slice(0, 2)]);
    expect(s.messages.at(-1)).toMatchObject({ kind: "agent", retry: "analyze", details: "raw" });
    expect(s.messages.at(-1)).not.toHaveProperty("startOver");
    expect(s.failStreak).toEqual({ step: "analyze", count: 1 });
  });
  it("offers Start over on the third consecutive failure of the same step", () => {
    const s = run([START, ...fail(1), ...fail(2), ...fail(3).slice(0, 2)]);
    expect(s.failStreak).toEqual({ step: "analyze", count: 3 });
    expect(s.messages.at(-1)).toMatchObject({ startOver: true });
  });
  it("cancelling doesn't count, a different step restarts the count, success clears it", () => {
    const s = run([START, ...fail(1), ...fail(2, { cancelled: true }), ...fail(3).slice(0, 2)]);
    expect(s.failStreak?.count).toBe(2);
    const outlineFail = agentReducer(
      run([START, ...fail(1), ...fail(2)]),
      { type: "failed", thinkingId: "nope", errId: "eo", retry: "outline", text: "y" },
    );
    expect(outlineFail.failStreak).toEqual({ step: "outline", count: 1 });
    expect(run([...fail(1), ...fail(2), ...PLANNED.slice(1)], run([START])).failStreak).toBeNull();
  });
  it("briefed carries skipped files onto the analysis row", () => {
    const s = run([
      START,
      { type: "thinking", id: "t1", text: "" },
      { type: "briefed", thinkingId: "t1", analysisId: "a1", reply: "ok", brief: BRIEF, questions: [], questionsId: "q1", skipped: [{ name: "b.mov", reason: "The file is too large to upload." }] },
    ]);
    expect(s.messages.at(-1)).toMatchObject({ kind: "analysis", skipped: [{ name: "b.mov" }] });
  });
  it("pendingRetry names the failed step while its error row is up", () => {
    const s = run([START, ...fail(1).slice(0, 2)]);
    expect(pendingRetry(s)).toBe("analyze");
    expect(pendingRetry(agentReducer(s, { type: "retryStarted" }))).toBeUndefined();
  });
});
