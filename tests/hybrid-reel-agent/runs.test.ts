import { describe, expect, it } from "vitest";
import { schedule, toolRuns } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/logic/runs";
import type { Outline, Shot } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";

const ai = (summary: string): Shot => ({ role: "hook", durationSec: 5, source: { kind: "generate", genType: "broll", summary, prompt: `${summary}. Vertical.` }, subtitle: { text: "", source: "authored" } });
const clip: Shot = { role: "usage", durationSec: 4, source: { kind: "clip", clipIndex: 0, inSec: 0, outSec: 4 }, subtitle: { text: "", source: "authored" } };
const OUTLINE = (shots: Shot[]): Outline => ({ shots, direction: "", bgmPrompt: "", credits: { base: 40, perGenerateShot: 50, generatedShots: 0, total: 40 }, model: "seed", voiceover: { on: true, why: "" } });

describe("toolRuns", () => {
  it("has one Generate video row per AI shot, carrying its prompt", () => {
    const runs = toolRuns(OUTLINE([ai("Model sprays"), clip, ai("Snow stream")]));
    const gen = runs.filter((r) => r.label === "Generate video");
    expect(gen).toHaveLength(2);
    expect(gen[0].detail).toBe("Model sprays. Vertical.");
    expect(runs.map((r) => r.label)).toContain("Upload reference image");
  });
  it("skips reference upload and video generation when nothing is AI-shot", () => {
    const labels = toolRuns(OUTLINE([clip])).map((r) => r.label);
    expect(labels).not.toContain("Generate video");
    expect(labels).not.toContain("Upload reference image");
    expect(labels[0]).toBe("Get usage");
    expect(labels[labels.length - 1]).toBe("Check output");
  });
  it("skips voice rows when voiceover is off", () => {
    const o = { ...OUTLINE([clip]), voiceover: { on: false, why: "" } };
    expect(toolRuns(o).map((r) => r.label)).not.toContain("Generate audio");
  });
});

describe("schedule", () => {
  it("runs rows in order but starts a group together", () => {
    const slots = schedule([
      { id: "a", label: "A", ms: 500 },
      { id: "g1", label: "G", ms: 4000, group: "gen" },
      { id: "g2", label: "G", ms: 6000, group: "gen" },
      { id: "b", label: "B", ms: 1000 },
    ]);
    expect(slots).toEqual([
      { id: "a", startMs: 0, endMs: 500 },
      { id: "g1", startMs: 500, endMs: 4500 },
      { id: "g2", startMs: 500, endMs: 6500 },
      { id: "b", startMs: 6500, endMs: 7500 },
    ]);
  });
});
