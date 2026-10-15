import { describe, expect, it } from "vitest";
import { aiShotNumbers, fmtRange, storyboardRows } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/logic/storyboard";
import type { ClipProfile, Outline, Shot } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";

const PROFILES: ClipProfile[] = [
  {
    label: "IMG_3716.MOV",
    kind: "video",
    sizeMB: 10,
    description: "Hand-held product demo",
    tags: [],
    hasVoice: false,
    issues: [],
    suggestedRole: "usage",
    faceVisible: false,
    segments: [
      { start: 0, end: 8.4, description: "Bottle turns to show the front", usable: true, roles: ["hook"] },
      { start: 8.4, end: 15.3, description: "Cap off, fine mist", usable: true, roles: ["usage"] },
    ],
  },
];

const ai = (summary: string | undefined, sec: number): Shot => ({
  role: "hook",
  durationSec: sec,
  source: { kind: "generate", genType: "broll", summary, prompt: "A woman sprays mist on her face. Soft light." },
  subtitle: { text: "Dry skin by noon?", source: "authored" },
});
const footage = (inSec: number, outSec: number): Shot => ({
  role: "usage",
  durationSec: outSec - inSec,
  source: { kind: "clip", clipIndex: 0, inSec, outSec },
  subtitle: { text: "", source: "authored" },
});

const outline = (shots: Shot[]): Outline => ({
  shots,
  direction: "",
  bgmPrompt: "",
  credits: { base: 40, perGenerateShot: 50, generatedShots: shots.filter((s) => s.source.kind === "generate").length, total: 0 },
  model: "seed",
});

describe("storyboardRows", () => {
  it("lays shots end to end with source and voiceover line", () => {
    const rows = storyboardRows(outline([ai("Model sprays mist on her face", 3), footage(8.4, 12.9)]), PROFILES);
    expect(rows).toEqual([
      { start: 0, end: 3, content: "Model sprays mist on her face", source: "AI", line: "Dry skin by noon?" },
      { start: 3, end: 7.5, content: "Cap off, fine mist", source: "Footage", line: "" },
    ]);
  });
  it("uses the first sentence of the prompt when an AI shot has no summary", () => {
    expect(storyboardRows(outline([ai(undefined, 3)]), PROFILES)[0].content).toBe("A woman sprays mist on her face");
  });
  it("falls back to the clip description when the in-point is outside every segment", () => {
    expect(storyboardRows(outline([footage(20, 22)]), PROFILES)[0].content).toBe("Hand-held product demo");
  });
  it("picks the segment that starts at a boundary in-point", () => {
    expect(storyboardRows(outline([footage(8.4, 10)]), PROFILES)[0].content).toBe("Cap off, fine mist");
  });
});

describe("fmtRange / aiShotNumbers", () => {
  it("formats ranges without trailing zeros", () => {
    expect(fmtRange(0, 3)).toBe("0–3s");
    expect(fmtRange(12.5, 17.5)).toBe("12.5–17.5s");
  });
  it("returns 1-based numbers of AI shots", () => {
    expect(aiShotNumbers(outline([footage(0, 2), ai("x", 3), ai("y", 3)]))).toEqual([2, 3]);
  });
});
