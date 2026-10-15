import { describe, expect, it } from "vitest";
import {
  answerTranscript,
  applyAnswers,
  buildQuestions,
  canSubmit,
  missingRoles,
  subtitleOption,
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
    expect(buildQuestions(undefined, BRIEF, FOOTAGE, "en").map((q) => q.id)).toEqual(["platform", "language", "duration", "shots"]);
  });
  it("splits platform and subtitle language into two questions, each asked only when assumed (max 4)", () => {
    const all = buildQuestions(["platform", "durationSec", "subtitleLang"], BRIEF, FOOTAGE, "en");
    expect(all.map((q) => q.title)).toEqual(["Which platform will this ad run on?", "What language should the subtitles be in?", "How long should the ad be?", "Your footage is missing these shots. Which should AI create?"]);
    /* 推荐项(默认值)排第一,其余保持原顺序;每个选项都有一行说明 */
    expect([...all[0].options.map((o) => o.label)].sort()).toEqual(["FB Reels", "IG Reels", "TikTok"]);
    expect(all[0].options[0].value).toBe(all[0].defaults[0] ?? "TikTok");
    expect([...all[1].options.map((o) => o.label)].sort()).toEqual(["English", "简体中文", "繁體中文"].sort());
    expect(all[1].options[0].value).toBe(all[1].defaults[0]);
    expect(all.every((q) => q.options.every((o) => !!o.description))).toBe(true);
    expect(buildQuestions(["subtitleLang"], BRIEF, FOOTAGE, "zh").map((q) => q.id)).toEqual(["language", "shots"]);
    expect(buildQuestions(["platform"], BRIEF, FOOTAGE, "zh").map((q) => q.id)).toEqual(["platform", "shots"]);
  });
  it("defaults the language question to the brief's language, falling back to the reply language", () => {
    const pick = (b: Brief, lang: "zh" | "en") => buildQuestions(["subtitleLang"], b, FOOTAGE, lang)[0].defaults;
    expect(pick(BRIEF, "zh")).toEqual(["English"]);
    expect(pick({ ...BRIEF, subtitleLang: "Traditional Chinese" }, "en")).toEqual(["繁體中文"]);
    expect(pick({ ...BRIEF, subtitleLang: "" }, "zh")).toEqual(["简体中文"]);
    expect(subtitleOption("中文", "en")).toBe("简体中文");
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
  const qs = buildQuestions(["platform", "durationSec", "subtitleLang"], BRIEF, FOOTAGE, "zh");
  it("writes platform, language and duration into the brief", () => {
    const next = applyAnswers(
      BRIEF,
      qs,
      { platform: { picked: ["TikTok"] }, language: { picked: ["繁體中文"] }, duration: { picked: ["30"] }, shots: { picked: ["cta"] } },
      "zh",
    );
    expect(next.platform).toBe("TikTok");
    expect(next.subtitleLang).toBe("繁體中文");
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
    expect(next.notes).toContain("Platform: Xiaohongshu");
    expect(next.platform).toBe("IG Reels");
  });
  it("answering the platform no longer overwrites the subtitle language", () => {
    expect(applyAnswers(BRIEF, qs, { platform: { picked: ["TikTok"] } }, "zh").subtitleLang).toBe("English");
  });
  it("uses an Other subtitle language as the brief's language", () => {
    expect(applyAnswers(BRIEF, qs, { language: { picked: [], other: "Japanese" } }, "en").subtitleLang).toBe("Japanese");
  });
  it("still applies recorded answers that have no language key (review fixture)", () => {
    const answers = Object.fromEntries(qs.map((q) => [q.id, { platform: { picked: ["TikTok"] }, duration: { picked: ["30"] } }[q.id as "platform"] ?? { picked: q.defaults }]));
    const next = applyAnswers(BRIEF, qs, answers, "zh");
    expect([next.platform, next.subtitleLang, next.durationSec]).toEqual(["TikTok", "English", 30]);
  });
});

describe("canSubmit", () => {
  const qs = buildQuestions(["platform", "subtitleLang"], BRIEF, FOOTAGE, "en");
  const full = { platform: { picked: ["TikTok"] }, language: { picked: ["English"] }, shots: { picked: [] } };
  it("needs an answer on every single-choice question; AI shots may be empty", () => {
    expect(canSubmit(qs, full)).toBe(true);
    expect(canSubmit(qs, { ...full, platform: { picked: [] } })).toBe(false);
    expect(canSubmit(qs, { ...full, platform: { picked: [], other: "  " } })).toBe(false);
    expect(canSubmit(qs, { ...full, platform: { picked: [], other: "Xiaohongshu" } })).toBe(true);
    expect(canSubmit(qs, { platform: full.platform, shots: full.shots })).toBe(false);
  });
});

describe("answerTranscript", () => {
  it("renders one Q/A pair per question with option labels", () => {
    const qs = buildQuestions(["durationSec"], BRIEF, FOOTAGE, "en");
    expect(answerTranscript(qs, { duration: { picked: ["30"] }, shots: { picked: ["pain"], other: "steam room" } })).toBe(
      "Q: How long should the ad be?\nA: 30s\n\nQ: Your footage is missing these shots. Which should AI create?\nA: Pain point, steam room",
    );
  });
});

describe("answerRows", () => {
  it("one row per question; marks the recommended pick; Skipped when a single-choice question has no answer", async () => {
    const { answerRows } = await import("@/app/prototypes/(v1.13)/hybrid-reel-agent/app/logic/questions");
    const qs = buildQuestions(["durationSec", "platform"], BRIEF, FOOTAGE, "en");
    const rec = qs.find((q) => q.id === "duration")!.defaults[0];
    const rows = answerRows(qs, { duration: { picked: [rec] }, platform: { picked: [] }, shots: { picked: ["pain"] } });
    expect(rows.find((r) => r.question === "How long should the ad be?")!.answer).toBe(`${rec}s (Recommended)`);
    expect(rows.find((r) => r.question === "Which platform will this ad run on?")!.answer).toBe("Skipped");
    expect(rows.find((r) => r.question.startsWith("Your footage is missing"))!.answer).toBe("Pain point");
  });
});
