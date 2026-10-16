import { describe, expect, it } from "vitest";
import { DEFAULT_OPTS, JOURNEYS, LANDING_STEPS, LOW_CREDITS, OVER_LIMIT_FILES, agentFailShotFor, buildPreset, isEditorStep, type AgentStepId } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/review/journeys";
import { aiShotNumbers } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/logic/storyboard";
import { reelCost, shotCost } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/logic/credits";
import { pickFiles } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/logic/upload";
import { START_CREDITS } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/logic/credits";
import { NOTES } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/review/notes";
import RELLET from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/fixture/rellet.json";
import type { FixtureData } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/fixture/types";
import { outOfCreditsShown, planStatus, type AgentState, type Msg } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/store";

const DATA = RELLET as unknown as FixtureData;
const kinds = (s: AgentState) => s.messages.map((m) => m.kind);
const preset = (id: AgentStepId, over = {}) => buildPreset(id, { ...DEFAULT_OPTS, ...over }, DATA);

describe("JOURNEYS / NOTES", () => {
  it("lists the 25 agent steps first, in order, each with notes; groups are contiguous", () => {
    expect(JOURNEYS.slice(0, 25).map((j) => j.id)).toEqual([
      "creationType", "picked", "analyzing", "questions", "partial", "plan", "revised", "addFootage",
      "generating", "stopped", "reel",
      "uploadLimit", "failAnalyze", "uploadInterrupted", "unusable", "noCredits", "genFailed", "genModeration", "genRewrite", "genVoiceFailed", "editFailed", "failVideo", "answerFirst", "sendFailed", "empty",
    ]);
    expect(JOURNEYS.find((j) => j.id === "editFailed")).toMatchObject({ group: "异常", title: "剪辑失败" });
    for (const id of ["genModeration", "genRewrite", "genVoiceFailed"] as const) expect(JOURNEYS.find((j) => j.id === id)?.group).toBe("异常");
    expect(JOURNEYS.find((j) => j.id === "answerFirst")?.group).toBe("异常");
    for (const id of ["uploadLimit", "failAnalyze", "uploadInterrupted", "unusable", "noCredits", "genFailed"] as const) expect(JOURNEYS.find((j) => j.id === id)?.group).toBe("异常");
    expect(JOURNEYS.find((j) => j.id === "plan")).toMatchObject({ group: "方案", title: "生成计划" });
    expect(JOURNEYS.find((j) => j.id === "stopped")?.group).toBe("生成");
    /* 左栏按组列出、编号按 JOURNEYS 下标:组不连续编号就会跳 */
    const groups = JOURNEYS.map((j) => j.group);
    const seen = new Set<string>();
    groups.forEach((g, i) => {
      if (i > 0 && g !== groups[i - 1]) expect(seen.has(g)).toBe(false);
      seen.add(g);
    });
    for (const j of JOURNEYS) expect(NOTES[j.id].what.length).toBeGreaterThan(0);
  });
});

describe("combined journeys", () => {
  it("has 50 steps (Agent 25 + editor 25), editor steps after the agent ones, all with notes", () => {
    expect(JOURNEYS).toHaveLength(50);
    expect(JOURNEYS.slice(25).every((j) => isEditorStep(j.id))).toBe(true);
    expect(JOURNEYS.slice(0, 25).some((j) => isEditorStep(j.id))).toBe(false);
    for (const j of JOURNEYS) expect(NOTES[j.id].what.length).toBeGreaterThan(0);
  });
  it("defaults failShot off", () => {
    expect(DEFAULT_OPTS.failShot).toBe(false);
  });
  it("defaults the credit and agent-failure toggles off", () => {
    expect(DEFAULT_OPTS.noCredits).toBe(false);
    expect(DEFAULT_OPTS.agentFail).toBe("none");
    expect(DEFAULT_OPTS.failEdit).toBe(false);
    expect(DEFAULT_OPTS.longScript).toBe(false);
  });
});

describe("buildPreset", () => {
  it("creationType and picked stay on the landing screen", () => {
    expect(preset("creationType").state.screen).toBe("home");
    expect(preset("picked").items).toHaveLength(4);
    expect(preset("picked").homePrompt).toBe(DATA.zh.prompt);
  });
  it("analyzing autoruns the analysis from a thinking-free chat", () => {
    const p = preset("analyzing");
    expect(p.autorun).toBe("analyze");
    expect(kinds(p.state)).toEqual(["files", "user"]);
  });
  it("questions shows the analysis and the card", () => {
    expect(kinds(preset("questions").state)).toEqual(["files", "user", "analysis", "questions"]);
  });
  it("answerFirst keeps the card and adds the user's message plus the product's hint, in both languages", () => {
    const zh = preset("answerFirst").state;
    expect(kinds(zh)).toEqual(["files", "user", "analysis", "questions", "user", "agent"]);
    expect(zh.messages.slice(-2).map((m) => (m.kind === "user" || m.kind === "agent" ? m.text : ""))).toEqual([
      "先帮我排分镜吧",
      "先在上面的卡片里选一下,我再排分镜。",
    ]);
    const en = preset("answerFirst", { lang: "en" }).state;
    expect(en.messages.slice(-2).map((m) => (m.kind === "user" || m.kind === "agent" ? m.text : ""))).toEqual([
      "Just lay out the storyboard",
      "Pick your answers in the card above and I'll lay out the storyboard.",
    ]);
    expect(zh.messages.some((m) => m.kind === "plan")).toBe(false);
  });
  it("partial asks only what is missing; the AI-shots toggle does not change the questions", () => {
    const p = preset("partial");
    const q = p.state.messages.find((m) => m.kind === "questions");
    expect(q && q.kind === "questions" && q.questions.map((x) => x.id)).not.toContain("duration");
    const ids = (m: typeof q) => (m && m.kind === "questions" ? m.questions.map((x) => x.id) : []);
    const noShots = preset("partial", { aiShots: 0 }).state.messages.find((m) => m.kind === "questions");
    expect(ids(noShots)).toEqual(ids(q));
    expect(ids(noShots)).toContain("shots");
  });
  it("plan, revised, reel follow the real flow", () => {
    expect(kinds(preset("plan").state).slice(-2)).toEqual(["user", "plan"]);
    const revised = preset("revised").state.messages.filter((m) => m.kind === "plan");
    expect(revised.map((m) => m.kind === "plan" && !!m.superseded)).toEqual([true, false]);
    expect(kinds(preset("reel").state).slice(-3)).toEqual(["agent", "runs", "reel"]);
    expect(preset("reel").state.generating).toBe(false);
  });
  it("plan card pills: awaiting on plan, replaced after revision / use version, confirmed once generating", () => {
    const pills = (id: AgentStepId) =>
      preset(id).state.messages.filter((m): m is Extract<Msg, { kind: "plan" }> => m.kind === "plan").map(planStatus);
    expect(pills("plan")).toEqual(["awaiting"]);
    expect(pills("revised")).toEqual(["replaced", "awaiting"]);
    expect(pills("noCredits")).toEqual(["awaiting"]);
    expect(pills("generating")).toEqual(["confirmed"]);
    expect(pills("reel")).toEqual(["confirmed"]);
  });
  it("generating and queued are mid-run", () => {
    expect(preset("generating").state.generating).toBe(true);
  });
  it("failure steps end on a retry row and empty is the empty state", () => {
    const fa = preset("failAnalyze").state;
    expect(fa.messages.at(-1)).toMatchObject({ kind: "agent", retry: "analyze" });
    /* 报错过 friendlyError:界面一句话,原文在 Details */
    expect(fa.messages.at(-1)).toMatchObject({ text: "素材分析失败:模型响应超时。", details: "The model service timed out (simulated)" });
    expect(kinds(preset("failVideo").state).at(-1)).toBe("reel");
    expect(preset("empty").state).toMatchObject({ screen: "chat", empty: true });
  });
  it("rebuilds with the toggles", () => {
    const en = preset("plan", { lang: "en" }).state;
    expect(en.lang).toBe("en");
    expect(en.prompt).toBe(DATA.en.prompt);
    const plan = preset("plan", { aiShots: 0, voiceover: false }).state.messages.find((m) => m.kind === "plan");
    expect(plan && plan.kind === "plan" && plan.outline.credits.generatedShots).toBe(0);
    expect(plan && plan.kind === "plan" && plan.outline.voiceover?.on).toBe(false);
  });
});

describe("new agent steps", () => {
  it("uploadLimit: landing page with the picked footage plus the real rejection notices", () => {
    const p = preset("uploadLimit");
    expect(p.state.screen).toBe("home");
    expect(p.items).toHaveLength(4);
    expect(p.homeNotices).toEqual(pickFiles(4, OVER_LIMIT_FILES).notices);
    expect(p.homeNotices).toEqual([
      "launch-event-full.mov is over 500 MB",
      "factory-tour.mp4 is longer than 10 minutes",
      "lookbook-raw.png is over 20 MB",
      "brand-guidelines.pdf isn't a video, image or audio file",
      "unboxing-final.mp4 can't be read — try exporting it again",
    ]);
  });
  it("uploadInterrupted: the first file is skipped with the upload-interrupted reason, the rest go on to the question card", () => {
    for (const lang of ["zh", "en"] as const) {
      const s = preset("uploadInterrupted", { lang }).state;
      expect(kinds(s)).toEqual(["files", "user", "analysis", "questions"]);
      const a = s.messages.find((m) => m.kind === "analysis");
      expect(a?.kind === "analysis" && a.skipped).toEqual([
        { name: preset("picked").items[0].name, reason: lang === "zh" ? "上传中断了,请检查网络" : "Upload interrupted — check your connection" },
      ]);
      expect(s.profiles.some((p) => p.label === preset("picked").items[0].name)).toBe(false);
    }
  });
  it("unusable: says which files can't be used and asks how to continue instead of the normal questions", () => {
    const s = preset("unusable", { lang: "en" }).state;
    expect(kinds(s)).toEqual(["files", "user", "analysis", "questions"]);
    const a = s.messages.find((m) => m.kind === "analysis");
    expect(a?.kind === "analysis" && a.unusable).toMatch(/^I've gone through your footage, but most of it won't work: .*too blurry.*doesn't show the product/);
    const q = s.messages.find((m) => m.kind === "questions");
    if (q?.kind !== "questions") throw new Error("no questions");
    expect(q.questions.map((x) => x.id)).toEqual(["footage"]);
    expect(q.questions[0].options.map((o) => o.label)).toEqual(["Add more footage", "Let AI create the missing shots", "Use what I have"]);
    expect(q.questions[0].defaults).toEqual(["more"]);
    /* 「AI 补拍」后续:补拍题五段全列,时长题带「能撑多少秒」,补拍题标题带积分 */
    const shots = q.followUp?.ai.find((x) => x.id === "shots");
    expect(shots?.options).toHaveLength(5);
    expect(shots?.title).toContain("· 250 credits");
    expect(q.followUp?.ai.find((x) => x.id === "duration")?.note).toBe("Your footage doesn't cover any of it — AI will fill the rest.");
    expect(q.followUp?.use.length).toBeGreaterThan(0);
    expect(preset("unusable", { lang: "zh" }).state.messages.find((m) => m.kind === "analysis")).toMatchObject({ unusable: expect.stringMatching(/^素材看完了,但大多用不上/) });
  });
  it("noCredits: plan with a LOW_CREDITS balance, out-of-credits banner state and no dialog", () => {
    const s = preset("noCredits").state;
    const plan = s.messages.findLast((m) => m.kind === "plan");
    expect(s.credits).toBe(LOW_CREDITS);
    expect(s.generating).toBe(false);
    expect(s.dialog).toBeNull();
    expect(s.outOfCredits).toBe(true);
    expect(s.creditsNeeded).toBe(plan && plan.kind === "plan" ? reelCost(plan.outline) : -1);
    expect(outOfCreditsShown(s)).toBe(true);
    expect(s.messages.some((m) => m.kind === "runs")).toBe(false);
  });
  it("genFailed: one AI shot fails, its credits come back, and the agent stops to ask (no reel)", () => {
    for (const lang of ["zh", "en"] as const) {
      const s = preset("genFailed", { lang }).state;
      const shot = agentFailShotFor({ ...DEFAULT_OPTS, lang }, DATA)!;
      const ask = s.messages.at(-1);
      expect(ask).toMatchObject({ kind: "ask", shots: [shot] });
      const run = s.messages.find((m) => m.kind === "runs");
      expect(run).toMatchObject({ fail: [{ shot }], refundedShots: [shot] });
      const outline = ask && ask.kind === "ask" ? ask.outline : null;
      expect(s.credits).toBe(START_CREDITS - reelCost(outline!) + shotCost(outline!));
      /* 220 − 50:35,430 */
      expect(s.credits).toBe(35430);
      expect(ask && ask.kind === "ask" && ask.question.title).toBe(`Shot ${shot} didn't generate. How should I continue?`);
      expect(ask && ask.kind === "ask" && ask.question.options.map((o) => o.label)).toEqual([
        `Retry shot ${shot}`,
        "Try another model",
        "Animate a product photo",
        "Use your footage instead",
        "Cut it from the ad",
      ]);
      expect(s.messages.some((m) => m.kind === "reel")).toBe(false);
      expect(s.generating).toBe(false);
    }
  });
  it("agentFailShotFor picks the second AI shot (or the only one) and nothing without AI shots", () => {
    const plan = preset("plan").state.messages.findLast((m) => m.kind === "plan");
    const ai = plan && plan.kind === "plan" ? aiShotNumbers(plan.outline) : [];
    expect(agentFailShotFor(DEFAULT_OPTS, DATA)).toBe(ai[1] ?? ai[0]);
    expect(agentFailShotFor({ ...DEFAULT_OPTS, aiShots: 0 }, DATA)).toBeUndefined();
    /* 没有补拍时「生成失败」步骤照常出成片 */
    expect(preset("genFailed", { aiShots: 0 }).state.messages.at(-1)).toMatchObject({ kind: "reel" });
    expect(preset("genFailed", { aiShots: 0 }).state.messages.some((m) => m.kind === "ask")).toBe(false);
  });
  it("clicking Confirm on the storyboard leaves a \"Confirm\" user bubble, then the agent line, then the grid", () => {
    for (const lang of ["zh", "en"] as const) {
      const s = preset("generating", { lang }).state;
      expect(kinds(s).slice(-4)).toEqual(["plan", "user", "agent", "runs"]);
      expect(s.messages.at(-3)).toMatchObject({ kind: "user", text: "Confirm" });
    }
  });
  it("the agent failure toggle also fails that shot in the generating and reel steps", () => {
    const shot = agentFailShotFor(DEFAULT_OPTS, DATA)!;
    expect(preset("generating", { agentFail: "shotBusy" }).state.messages.at(-1)).toMatchObject({ kind: "runs", fail: [{ shot, kind: "busy" }] });
    /* 成片步骤 + 开关:按推荐项 Retry 答完,只重跑这一镜,再出成片;积分最后和没失败一样 */
    const s = preset("reel", { agentFail: "shotBusy" }).state;
    expect(kinds(s).slice(-6)).toEqual(["agent", "runs", "user", "agent", "runs", "reel"]);
    expect(s.messages.at(-2)).toMatchObject({ kind: "runs", only: [shot], charged: 50 });
    expect(s.credits).toBe(START_CREDITS - 220);
    expect(preset("reel").state.credits).toBe(START_CREDITS - 220);
  });
  it("stopped: the run stops mid-way, the unfinished part is refunded and a Stopped reply follows", () => {
    for (const lang of ["zh", "en"] as const) {
      const s = preset("stopped", { lang }).state;
      const run = s.messages.find((m) => m.kind === "runs");
      expect(s.generating).toBe(false);
      expect(run && run.kind === "runs" && run.stoppedAtMs).toBeGreaterThan(0);
      const refunded = run && run.kind === "runs" ? (run.refunded ?? 0) : 0;
      expect(refunded).toBeGreaterThan(0);
      expect(s.credits).toBe(START_CREDITS - (run && run.kind === "runs" ? run.charged : 0) + refunded);
      expect(s.messages.at(-1)).toMatchObject({ kind: "agent" });
      expect(s.messages.some((m) => m.kind === "reel")).toBe(false);
    }
    expect(preset("stopped", { lang: "en" }).state.messages.at(-1)).toMatchObject({ text: expect.stringMatching(/^Stopped\. [\d,]+ credits refunded\.$/) });
  });
});

describe("creationType step & toggle", () => {
  it("opens the landing page with the Creation type menu; defaults to Hybrid Reel", () => {
    const p = buildPreset("creationType", DEFAULT_OPTS, DATA);
    expect(p.homeTypeMenuOpen).toBe(true);
    expect(p.items).toEqual([]);
    expect(DEFAULT_OPTS.creationType).toBe("hybrid");
    expect(LANDING_STEPS).toEqual(["picked", "creationType", "uploadLimit"]);
  });
});
