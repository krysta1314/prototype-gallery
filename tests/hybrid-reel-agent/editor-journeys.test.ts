import { describe, expect, it } from "vitest";
import { EDITOR_JOURNEYS, LOW_CREDITS, SHOT_TIMEOUT_ERROR, buildEditorPreset, type EditorStepId } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/review/editorJourneys";
import { layoutClips, pendingAiShots } from "@/app/prototypes/(v1.13)/hybrid-reel/canvas/project";
import { EDITOR_NOTES } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/review/editorNotes";
import { DEFAULT_OPTS } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/review/journeys";
import RELLET from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/fixture/rellet.json";
import type { FixtureData } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/fixture/types";

const DATA = RELLET as unknown as FixtureData;
const preset = (id: EditorStepId, over = {}) => buildEditorPreset(id, { ...DEFAULT_OPTS, ...over }, DATA);
const aiShots = (id: EditorStepId) => preset(id).project.assets.filter((a) => a.origin === "ai" && a.kind === "video");

describe("EDITOR_JOURNEYS", () => {
  it("lists the 22 editor steps in order (guide first), each with notes; the error steps are a last group", () => {
    expect(EDITOR_JOURNEYS.map((j) => j.id)).toEqual([
      "canvas", "editorGuide", "shotsGenerating", "shotsReady", "nodeSettings", "multiEditor", "timeline", "undoRedo", "split", "deleteClip", "speed", "subtitles",
      "media", "fullScreen", "voice", "music", "cover", "exportGate", "exporting",
      "shotFailed", "voiceFailed", "coverNoFootage",
    ]);
    expect(EDITOR_JOURNEYS.slice(19).every((j) => j.group === "剪辑器异常")).toBe(true);
    expect(EDITOR_JOURNEYS.slice(0, 19).some((j) => j.group === "剪辑器异常")).toBe(false);
    for (const j of EDITOR_JOURNEYS) expect(EDITOR_NOTES[j.id].what.length).toBeGreaterThan(0);
  });
  it("only the editorGuide step forces the editor tour open; every other step forces it off", () => {
    expect(EDITOR_JOURNEYS[1]).toMatchObject({ id: "editorGuide", group: "画布", title: "剪辑器引导" });
    for (const j of EDITOR_JOURNEYS) expect(preset(j.id).initialUi.guide).toBe(j.id === "editorGuide");
  });
  it("editorGuide starts on the canvas, same project as the canvas step (AI shots waiting)", () => {
    expect(aiShots("editorGuide").every((a) => a.status === "idle")).toBe(true);
    expect(preset("editorGuide").initialUi.full ?? false).toBe(false);
    expect(preset("editorGuide").autorun).toBeUndefined();
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
    /* 画布上的剪辑器是小卡,点了进全屏:画布类步骤留在画布,其余剪辑步骤都在全屏里演示 */
    const CANVAS = ["canvas", "editorGuide", "shotsGenerating", "shotsReady", "nodeSettings", "multiEditor", "shotFailed", "voiceFailed"];
    for (const j of EDITOR_JOURNEYS) expect(preset(j.id).initialUi.full ?? false).toBe(!CANVAS.includes(j.id));
    expect(preset("timeline").initialUi).toMatchObject({ selectedPart: "clip" });
    expect(preset("subtitles").initialUi).toMatchObject({ full: true, selectedPart: "sub" });
    expect(preset("media").initialUi).toMatchObject({ panel: "media", selectedPart: "clip" });
    expect(preset("music").initialUi).toMatchObject({ panel: "audio" });
    const v = preset("voice");
    expect(v.initialUi).toMatchObject({ selectedPart: "voice", selectedId: v.project.voice?.[0]?.id, settingsId: v.project.voice?.[0]?.assetId });
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
    expect(p.initialUi).toMatchObject({ selectedId: v.id, selectedPart: "voice", settingsId: v.assetId });
    expect(p.fixture).toEqual({ failTts: true });
  });
  it("coverNoFootage opens on a project whose AI shots are not generated", () => {
    expect(aiShots("coverNoFootage").every((a) => a.status === "idle")).toBe(true);
    expect(preset("coverNoFootage").initialUi.coverOpen).toBe(true);
  });
});

