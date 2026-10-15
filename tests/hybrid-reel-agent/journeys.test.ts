import { describe, expect, it } from "vitest";
import { DEFAULT_OPTS, JOURNEYS, buildPreset, isEditorStep, type AgentStepId } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/review/journeys";
import { NOTES } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/review/notes";
import RELLET from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/fixture/rellet.json";
import type { FixtureData } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/fixture/types";
import type { AgentState } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/store";

const DATA = RELLET as unknown as FixtureData;
const kinds = (s: AgentState) => s.messages.map((m) => m.kind);
const preset = (id: AgentStepId, over = {}) => buildPreset(id, { ...DEFAULT_OPTS, ...over }, DATA);

describe("JOURNEYS / NOTES", () => {
  it("lists the 15 agent steps first, in order, each with notes", () => {
    expect(JOURNEYS.slice(0, 15).map((j) => j.id)).toEqual([
      "home", "picked", "analyzing", "questions", "partial", "plan", "revised",
      "generating", "queued", "reel", "failAnalyze", "failOutline", "failVideo", "answerFirst", "empty",
    ]);
    expect(JOURNEYS.find((j) => j.id === "answerFirst")?.group).toBe("异常");
    for (const j of JOURNEYS) expect(NOTES[j.id].what.length).toBeGreaterThan(0);
  });
});

describe("combined journeys", () => {
  it("has 36 steps, editor steps after the agent ones, all with notes", () => {
    expect(JOURNEYS).toHaveLength(36);
    expect(JOURNEYS.slice(15).every((j) => isEditorStep(j.id))).toBe(true);
    expect(JOURNEYS.slice(0, 15).some((j) => isEditorStep(j.id))).toBe(false);
    for (const j of JOURNEYS) expect(NOTES[j.id].what.length).toBeGreaterThan(0);
  });
  it("defaults failShot off", () => {
    expect(DEFAULT_OPTS.failShot).toBe(false);
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
