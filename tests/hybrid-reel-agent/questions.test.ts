import { describe, expect, it } from "vitest";
import {
  answerTranscript,
  applyAnswers,
  buildQuestions,
  missingRoles,
} from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/logic/questions";
import type { Brief, ClipProfile } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";

const BRIEF: Brief = {
  platform: "IG Reels",
  durationSec: 15,
  audience: "Women 18-35",
  sellingPoints: ["5 types of HA"],
  cta: "Shop now",
  subtitleLang: "English",
  productType: "physical",
  notes: "",
};

const clip = (over: Partial<ClipProfile>): ClipProfile => ({
  label: "IMG_3716.MOV",
  kind: "video",
  identity: "footage",
  sizeMB: 10,
  description: "Hand holds the spray bottle",
  tags: [],
  hasVoice: false,
  issues: [],
  suggestedRole: "usage",
  faceVisible: false,
  ...over,
});

const FOOTAGE: ClipProfile[] = [
  clip({
    segments: [
      { start: 0, end: 8.4, description: "Bottle turns", usable: true, roles: ["hook"] },
      { start: 8.4, end: 15.3, description: "Spray mist", usable: true, roles: ["proof", "usage"] },
    ],
  }),
  clip({ label: "logo.png", kind: "image", identity: "brand", suggestedRole: "cta" }),
];

describe("missingRoles", () => {
  it("lists beats no usable segment covers, in ad order", () => {
    expect(missingRoles(FOOTAGE)).toEqual(["pain", "cta"]);
  });
  it("falls back to suggestedRole when a clip has no shot log", () => {
    expect(missingRoles([clip({ kind: "image", identity: "showcase", suggestedRole: "proof" })])).toEqual(["hook", "pain", "usage", "cta"]);
  });
  it("ignores reference, brand, audio and unused files", () => {
    expect(missingRoles([clip({ identity: "reference", suggestedRole: "hook" })])).toEqual(["hook", "pain", "proof", "usage", "cta"]);
  });
});

describe("buildQuestions", () => {
  it("asks platform and duration only when the brief assumed them", () => {
    const qs = buildQuestions(["platform", "durationSec", "audience"], BRIEF, FOOTAGE, "en");
    expect(qs.map((q) => q.id)).toEqual(["platform", "duration", "shots"]);
    expect(buildQuestions(["audience"], BRIEF, FOOTAGE, "en").map((q) => q.id)).toEqual(["shots"]);
  });
  it("treats a missing assumed list as nothing stated", () => {
    expect(buildQuestions(undefined, BRIEF, FOOTAGE, "en").map((q) => q.id)).toEqual(["platform", "duration", "shots"]);
  });
  it("asks the subtitle language as part of the platform question", () => {
    expect(buildQuestions(["subtitleLang"], BRIEF, FOOTAGE, "zh")[0].options[0].label).toBe("TikTok · 简体中文");
  });
  it("offers one AI shot option per missing beat, all picked by default", () => {
    const shots = buildQuestions([], BRIEF, FOOTAGE, "en")[0];
    expect(shots.multi).toBe(true);
    expect(shots.options.map((o) => o.value)).toEqual(["pain", "cta"]);
    expect(shots.defaults).toEqual(["pain", "cta"]);
  });
  it("skips the AI shot question when the footage covers every beat", () => {
    const full = [clip({ segments: [{ start: 0, end: 5, description: "x", usable: true, roles: ["hook", "pain", "proof", "usage", "cta"] }] })];
    expect(buildQuestions([], BRIEF, full, "en")).toEqual([]);
  });
  it("defaults single-choice questions to the current brief", () => {
    const [platform, duration] = buildQuestions(["platform", "durationSec"], BRIEF, FOOTAGE, "en");
    expect(platform.defaults).toEqual(["IG Reels"]);
    expect(duration.defaults).toEqual(["15"]);
  });
});

describe("applyAnswers", () => {
  const qs = buildQuestions(["platform", "durationSec"], BRIEF, FOOTAGE, "zh");
  it("writes platform, language and duration into the brief", () => {
    const next = applyAnswers(BRIEF, qs, { platform: { picked: ["TikTok"] }, duration: { picked: ["30"] }, shots: { picked: ["cta"] } }, "zh");
    expect(next.platform).toBe("TikTok");
    expect(next.subtitleLang).toBe("简体中文");
    expect(next.durationSec).toBe(30);
    expect(next.notes).toContain("AI-shoot these beats: cta");
  });
  it("says no AI shots when the user unticks every shot", () => {
    const next = applyAnswers(BRIEF, qs, { shots: { picked: [] } }, "zh");
    expect(next.notes).toContain("Do not AI-shoot any shots");
  });
  it("keeps existing notes and appends free-text answers", () => {
    const next = applyAnswers({ ...BRIEF, notes: "No faces" }, qs, { platform: { picked: [], other: "Xiaohongshu" } }, "zh");
    expect(next.notes?.startsWith("No faces\n")).toBe(true);
    expect(next.notes).toContain("Platform & language: Xiaohongshu");
    expect(next.platform).toBe("IG Reels");
  });
});

describe("answerTranscript", () => {
  it("renders one Q/A pair per question with option labels", () => {
    const qs = buildQuestions(["durationSec"], BRIEF, FOOTAGE, "en");
    expect(answerTranscript(qs, { duration: { picked: ["30"] }, shots: { picked: ["pain"], other: "steam room" } })).toBe(
      "Q: Length?\nA: 30s\n\nQ: Which shots should AI fill in?\nA: Pain point · the problem before the product, steam room",
    );
  });
});
