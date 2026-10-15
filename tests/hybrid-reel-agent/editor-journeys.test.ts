import { describe, expect, it } from "vitest";
import { EDITOR_JOURNEYS, LOW_CREDITS, SHOT_TIMEOUT_ERROR, buildEditorPreset, type EditorStepId } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/review/editorJourneys";
import { layoutClips, pendingAiShots, versionIndex, versionsOf } from "@/app/prototypes/(v1.13)/hybrid-reel/canvas/project";
import { EDITOR_NOTES } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/review/editorNotes";
import { DEFAULT_OPTS } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/review/journeys";
import RELLET from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/fixture/rellet.json";
import type { FixtureData } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/fixture/types";

const DATA = RELLET as unknown as FixtureData;
const preset = (id: EditorStepId, over = {}) => buildEditorPreset(id, { ...DEFAULT_OPTS, ...over }, DATA);
const aiShots = (id: EditorStepId) => preset(id).project.assets.filter((a) => a.origin === "ai" && a.kind === "video");

describe("EDITOR_JOURNEYS", () => {
  it("lists the 24 editor steps in order, each with notes; the error steps are a last group", () => {
    expect(EDITOR_JOURNEYS.map((j) => j.id)).toEqual([
      "canvas", "shotsGenerating", "shotsReady", "nodeSettings", "versions", "timeline", "cards", "subtitles",
      "media", "voice", "music", "sfx", "cover", "exportGate", "exporting",
      "shotFailed", "nodeFailed", "editorNoCredits", "voiceFailed", "voiceTooLong", "subPending", "subFailed", "noSpeech", "coverNoFootage",
    ]);
    expect(EDITOR_JOURNEYS.slice(15).every((j) => j.group === "剪辑器异常")).toBe(true);
    expect(EDITOR_JOURNEYS.slice(0, 15).some((j) => j.group === "剪辑器异常")).toBe(false);
    for (const j of EDITOR_JOURNEYS) expect(EDITOR_NOTES[j.id].what.length).toBeGreaterThan(0);
  });
});

describe("buildEditorPreset", () => {
  it("builds the project from the recorded storyboard with AI shots waiting", () => {
    const p = preset("canvas");
    expect(aiShots("canvas").length).toBeGreaterThan(0);
    expect(aiShots("canvas").every((a) => a.status === "idle")).toBe(true);
    expect(p.initialUi.full ?? false).toBe(false);
    expect(p.handoff.outline).toBe(DATA.zh.outline);
  });
  it("hands the editor the brief after the recorded answers (not the pre-answer brief)", () => {
    const b = preset("canvas").handoff.brief;
    expect(b.durationSec).toBe(Number(DATA.zh.answers.duration?.picked[0] ?? DATA.zh.brief.brief.durationSec));
    expect(b.platform).toBe(DATA.zh.answers.platform?.picked[0] ?? DATA.zh.brief.brief.platform);
  });
  it("generating autoruns generateAll; ready marks every AI shot ready with a playable video", () => {
    expect(preset("shotsGenerating").autorun).toBe("generateAll");
    expect(aiShots("shotsReady").every((a) => a.status === "ready" && !!a.url)).toBe(true);
  });
  it("opens the right UI for each step", () => {
    expect(preset("nodeSettings").initialUi.settingsId).toBe(aiShots("nodeSettings")[0].id);
    expect(preset("timeline").initialUi).toMatchObject({ full: true, panel: "clip" });
    expect(preset("cards").initialUi).toMatchObject({ full: true, selectedId: preset("cards").project.cards?.[0]?.id, selectedPart: "card" });
    expect(preset("cards").initialUi.panel ?? null).toBeNull();
    expect(preset("subtitles").initialUi).toMatchObject({ full: true, autoSubOpen: true });
    expect(preset("media").initialUi).toMatchObject({ full: true, panel: "media", selectedPart: "clip" });
    expect(preset("music").initialUi).toMatchObject({ full: true, panel: "audio" });
    expect(preset("sfx").initialUi).toMatchObject({ full: true, panel: "sfx" });
    expect(preset("voice").initialUi).toMatchObject({ full: true, selectedPart: "voice" });
    expect(preset("cover").initialUi.coverOpen).toBe(true);
    expect(preset("exportGate").initialUi.exportGate).toBe(true);
    expect(aiShots("exportGate").some((a) => a.status !== "ready")).toBe(true);
    expect(preset("exporting").autorun).toBe("export");
  });
  it("uses the English storyboard and an explicit outline when given", () => {
    expect(preset("canvas", { lang: "en" }).handoff.outline).toBe(DATA.en.outline);
    expect(buildEditorPreset("canvas", DEFAULT_OPTS, DATA, DATA.zh.revised).handoff.outline).toBe(DATA.zh.revised);
  });
});

describe("editor error steps", () => {
  it("shotFailed: first AI shot back to idle with the timeout error, others ready, credits refunded, its settings open", () => {
    const p = preset("shotFailed");
    const [first, ...rest] = aiShots("shotFailed");
    expect(first).toMatchObject({ status: "idle", error: SHOT_TIMEOUT_ERROR });
    expect(first.url).toBeUndefined();
    expect(rest.every((a) => a.status === "ready")).toBe(true);
    expect(p.project.spentCredits).toBe(preset("canvas").project.spentCredits);
    expect(p.initialUi.settingsId).toBe(first.id);
    expect(p.fixture).toBeUndefined();
  });
  it("voiceFailed: the first line's node carries the real partial-failure error and is selected; retries keep failing", () => {
    const p = preset("voiceFailed");
    const v = p.project.voice![0];
    const node = p.project.assets.find((a) => a.id === v.assetId)!;
    expect(node.status).toBe("idle");
    expect(node.error).toBe("1 of 1 lines failed: The model is busy right now — try again in a moment.");
    expect(node.errorDetails).toMatch(/speech service is busy/);
    expect(v.url).toBeUndefined();
    expect(p.initialUi).toMatchObject({ full: true, selectedId: v.id, selectedPart: "voice" });
    expect(p.fixture).toEqual({ failTts: true });
  });
  it("voiceTooLong: a generated line longer than its shot is selected", () => {
    for (const lang of ["zh", "en"] as const) {
      const p = preset("voiceTooLong", { lang });
      const v = p.project.voice!.find((x) => x.id === p.initialUi.selectedId)!;
      const seg = layoutClips(p.project.clips).segs.find((s) => s.clip.id === v.clipId)!;
      expect(v.url).toBeTruthy();
      expect((v.offset ?? 0) + v.len).toBeGreaterThan(seg.len + 0.1);
      expect(p.project.assets.find((a) => a.id === v.assetId)).toMatchObject({ status: "ready", url: v.url });
      expect(p.initialUi.selectedPart).toBe("voice");
    }
  });
  it("subPending / coverNoFootage open on a project whose AI shots are not generated", () => {
    expect(aiShots("subPending").every((a) => a.status === "idle")).toBe(true);
    expect(preset("subPending").initialUi).toMatchObject({ full: true, autoSubOpen: true });
    expect(aiShots("coverNoFootage").every((a) => a.status === "idle")).toBe(true);
    expect(preset("coverNoFootage").initialUi.coverOpen).toBe(true);
  });
  it("subFailed / noSpeech open auto-subtitles on the ready project with the matching fixture switch", () => {
    expect(preset("subFailed").initialUi).toMatchObject({ full: true, autoSubOpen: true });
    expect(preset("subFailed").fixture).toEqual({ failStt: true });
    expect(preset("noSpeech").initialUi).toMatchObject({ full: true, autoSubOpen: true });
    expect(preset("noSpeech").fixture).toEqual({ noSpeech: true });
    expect(aiShots("noSpeech").every((a) => a.status === "ready")).toBe(true);
  });
});

describe("new editor steps", () => {
  it("editorNoCredits: unstarted shots, a LOW_CREDITS balance and the Not enough credits dialog for Generate all", () => {
    const p = preset("editorNoCredits");
    expect(p.startCredits).toBe(LOW_CREDITS);
    expect(aiShots("editorNoCredits").every((a) => a.status === "idle")).toBe(true);
    expect(p.initialUi.noCredits).toEqual({ needed: pendingAiShots(p.project).cost });
    expect(p.initialUi.noCredits!.needed).toBeGreaterThan(LOW_CREDITS);
    expect(preset("canvas").startCredits).toBeUndefined();
  });
  it("nodeFailed: first AI shot never generated and failed, second failed a regenerate but keeps its result; no settings open", () => {
    const p = preset("nodeFailed");
    const [first, second, ...rest] = aiShots("nodeFailed");
    expect(first).toMatchObject({ status: "idle", error: SHOT_TIMEOUT_ERROR });
    expect(first.url).toBeUndefined();
    if (second) expect(second).toMatchObject({ status: "ready", error: SHOT_TIMEOUT_ERROR, url: expect.any(String) });
    expect(rest.every((a) => a.status === "ready" && !a.error)).toBe(true);
    expect(p.initialUi.settingsId ?? null).toBeNull();
  });
  it("versions: first AI shot has 3 versions, the 2nd in use, its settings open", () => {
    const p = preset("versions");
    const a = aiShots("versions")[0];
    expect(versionsOf(a)).toHaveLength(3);
    expect(versionIndex(a)).toBe(1);
    expect(a.url).toBe(versionsOf(a)[1].url);
    expect(new Set(versionsOf(a).map((v) => v.url)).size).toBe(3);
    expect(p.initialUi.settingsId).toBe(a.id);
  });
});
