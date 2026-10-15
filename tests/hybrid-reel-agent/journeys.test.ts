import { describe, expect, it } from "vitest";
import { DEFAULT_OPTS, JOURNEYS, LANDING_STEPS, LOW_CREDITS, OVER_LIMIT_FILES, agentFailShotFor, buildPreset, isEditorStep, type AgentStepId } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/review/journeys";
import { aiShotNumbers } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/logic/storyboard";
import { reelCost, shotCost } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/logic/credits";
import { pickFiles } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/logic/upload";
import { START_CREDITS } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/logic/credits";
import { NOTES } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/review/notes";
import RELLET from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/fixture/rellet.json";
import type { FixtureData } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/fixture/types";
import type { AgentState } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/store";

const DATA = RELLET as unknown as FixtureData;
const kinds = (s: AgentState) => s.messages.map((m) => m.kind);
const preset = (id: AgentStepId, over = {}) => buildPreset(id, { ...DEFAULT_OPTS, ...over }, DATA);

describe("JOURNEYS / NOTES", () => {
  it("lists the 22 agent steps first, in order, each with notes; groups are contiguous", () => {
    expect(JOURNEYS.slice(0, 22).map((j) => j.id)).toEqual([
      "home", "picked", "creationType", "analyzing", "questions", "partial", "plan", "revised", "useVersion",
      "generating", "queued", "stopped", "reel",
      "uploadLimit", "failAnalyze", "startOver", "failOutline", "noCredits", "genFailed", "failVideo", "answerFirst", "empty",
    ]);
    expect(JOURNEYS.find((j) => j.id === "answerFirst")?.group).toBe("异常");
    for (const id of ["uploadLimit", "startOver", "noCredits", "genFailed"] as const) expect(JOURNEYS.find((j) => j.id === id)?.group).toBe("异常");
    expect(JOURNEYS.find((j) => j.id === "useVersion")?.group).toBe("方案");
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
  it("has 46 steps, editor steps after the agent ones, all with notes", () => {
    expect(JOURNEYS).toHaveLength(46);
    expect(JOURNEYS.slice(22).every((j) => isEditorStep(j.id))).toBe(true);
    expect(JOURNEYS.slice(0, 22).some((j) => isEditorStep(j.id))).toBe(false);
    for (const j of JOURNEYS) expect(NOTES[j.id].what.length).toBeGreaterThan(0);
  });
  it("defaults failShot off", () => {
    expect(DEFAULT_OPTS.failShot).toBe(false);
  });
  it("defaults the credit and agent-failure toggles off", () => {
    expect(DEFAULT_OPTS.noCredits).toBe(false);
    expect(DEFAULT_OPTS.agentFailShot).toBe(false);
  });
});

describe("buildPreset", () => {
  it("home and picked stay on the landing screen", () => {
    expect(preset("home").state.screen).toBe("home");
    expect(preset("home").items).toEqual([]);
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
  it("generating and queued are mid-run", () => {
    expect(preset("generating").state.generating).toBe(true);
    expect(preset("queued").state.queue).toEqual([DATA.zh.revision]);
  });
  it("failure steps end on a retry row and empty is the empty state", () => {
    const fa = preset("failAnalyze").state;
    expect(fa.messages.at(-1)).toMatchObject({ kind: "agent", retry: "analyze" });
    /* 报错过 friendlyError:界面一句话,原文在 Details */
    expect(fa.messages.at(-1)).toMatchObject({ text: "素材分析失败:模型响应超时。", details: "The model service timed out (simulated)" });
    expect(preset("failOutline").state.messages.at(-1)).toMatchObject({ kind: "agent", retry: "outline" });
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
    ]);
  });
  it("startOver: three analysis failures in a row, only the last error row is left and it offers Start over", () => {
    const s = preset("startOver").state;
    expect(s.failStreak).toEqual({ step: "analyze", count: 3 });
    const errs = s.messages.filter((m) => m.kind === "agent");
    expect(errs).toHaveLength(1);
    expect(errs[0]).toMatchObject({ retry: "analyze", startOver: true });
    expect(s.errRetryId).toBe(errs[0].id);
  });
  it("useVersion: the first plan is reused as a new latest card, earlier cards superseded", () => {
    const plans = preset("useVersion").state.messages.filter((m) => m.kind === "plan");
    expect(plans.map((m) => m.kind === "plan" && !!m.superseded)).toEqual([true, true, false]);
    const [first, , last] = plans;
    expect(first.kind === "plan" && last.kind === "plan" && last.outline).toBe(first.kind === "plan" ? first.outline : null);
  });
  it("noCredits: plan with a LOW_CREDITS balance and the Not enough credits dialog", () => {
    const s = preset("noCredits").state;
    const plan = s.messages.findLast((m) => m.kind === "plan");
    expect(s.credits).toBe(LOW_CREDITS);
    expect(s.generating).toBe(false);
    expect(s.dialog).toEqual({ kind: "noCredits", needed: plan && plan.kind === "plan" ? reelCost(plan.outline) : -1, balance: LOW_CREDITS });
    expect(s.messages.some((m) => m.kind === "runs")).toBe(false);
  });
  it("genFailed: one AI shot fails, its credits come back, the reel keeps a placeholder and the reply offers Retry shot", () => {
    for (const lang of ["zh", "en"] as const) {
      const s = preset("genFailed", { lang }).state;
      const shot = agentFailShotFor({ ...DEFAULT_OPTS, lang }, DATA)!;
      const reel = s.messages.at(-1);
      expect(reel).toMatchObject({ kind: "reel", missingShots: [shot] });
      const run = s.messages.find((m) => m.kind === "runs");
      expect(run).toMatchObject({ fail: [{ shot }], refundedShots: [shot] });
      const outline = reel && reel.kind === "reel" ? reel.outline : null;
      expect(s.credits).toBe(START_CREDITS - reelCost(outline!) + shotCost(outline!));
      expect(s.messages.find((m) => m.kind === "agent" && m.retryShot === shot)).toBeTruthy();
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
    expect(preset("genFailed", { aiShots: 0 }).state.messages.at(-1)).not.toHaveProperty("missingShots");
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
    expect(preset("generating", { agentFailShot: true }).state.messages.at(-1)).toMatchObject({ kind: "runs", fail: [{ shot }] });
    expect(preset("reel", { agentFailShot: true }).state.messages.at(-1)).toMatchObject({ kind: "reel", missingShots: [shot] });
    expect(preset("reel").state.messages.at(-1)).not.toHaveProperty("missingShots");
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
    expect(LANDING_STEPS).toEqual(["home", "picked", "creationType", "uploadLimit"]);
  });
});
