import { describe, expect, it } from "vitest";
import {
  coverNote,
  footageBrief,
  footageChoice,
  footageUnusable,
  summaryFill,
  unusableFiles,
  unusableText,
  usableFootageSec,
} from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/logic/footage";
import { buildQuestions, missingRoles } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/logic/questions";
import { footageSummary } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/logic/summary";
import { unusableProfiles } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/fixture/transform";
import { INITIAL_STATE, agentReducer } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/store";
import RELLET from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/fixture/rellet.json";
import type { FixtureData } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/fixture/types";
import type { Brief, ClipProfile } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";

const DATA = RELLET as unknown as FixtureData;
const BRIEF: Brief = { platform: "TikTok", durationSec: 15, audience: "", sellingPoints: [], cta: "", subtitleLang: "English", productType: "physical", notes: "" };
const clip = (over: Partial<ClipProfile>): ClipProfile => ({
  label: "a.mov",
  kind: "video",
  identity: "footage",
  sizeMB: 1,
  description: "",
  tags: [],
  hasVoice: false,
  issues: [],
  suggestedRole: "usage",
  faceVisible: false,
  ...over,
});
const seg = (start: number, end: number, usable: boolean, reason?: string) => ({ start, end, usable, reason, description: "", roles: ["usage"] });

describe("usable footage", () => {
  it("adds up usable segments of cuttable videos; a video without a shot log counts whole", () => {
    expect(usableFootageSec(DATA.en.profiles)).toBeCloseTo(18.5, 1);
    expect(usableFootageSec([clip({ segments: [seg(0, 2, true), seg(2, 9, false, "Too blurry")] }), clip({ durationSec: 4 })])).toBe(6);
    expect(usableFootageSec([clip({ identity: "reference", durationSec: 10 })])).toBe(0);
  });
  it("is unusable with no product image and under 3s of usable footage", () => {
    expect(footageUnusable(DATA.en.profiles)).toBe(false);
    expect(footageUnusable(unusableProfiles(DATA.en.profiles, "en"))).toBe(true);
    expect(footageUnusable([clip({ segments: [seg(0, 2.5, true)] })])).toBe(true);
    expect(footageUnusable([clip({ segments: [seg(0, 3, true)] })])).toBe(false);
    /* 有产品图就不算:产品图能做动态镜头 */
    expect(footageUnusable([clip({ segments: [seg(0, 5, false, "Too blurry")] }), clip({ kind: "image", identity: "showcase" })])).toBe(false);
    /* 只有音频 / 品牌 logo 也算 */
    expect(footageUnusable([clip({ kind: "audio", identity: "audio" }), clip({ kind: "image", identity: "brand" })])).toBe(true);
  });
  it("names each unusable file with why: blurry / product not visible / too short", () => {
    const files = unusableFiles(unusableProfiles(DATA.en.profiles, "en"));
    expect(files.map((f) => f.why)).toEqual(["blurry", "blurry", "noProduct"]);
    expect(unusableFiles([clip({ issues: ["Too short to use"], segments: [seg(0, 0.6, false)] })])[0].why).toBe("short");
    expect(unusableFiles(unusableProfiles(DATA.zh.profiles, "zh")).map((f) => f.why)).toEqual(["blurry", "blurry", "noProduct"]);
    const en = unusableText(unusableProfiles(DATA.en.profiles, "en"), "en");
    expect(en).toContain("images.jpeg is too blurry");
    expect(en).toContain("IMG_3716.MOV doesn't show the product");
    expect(en).toMatch(/That leaves nothing I can cut into the ad\.$/);
    expect(unusableText([clip({ segments: [seg(0, 1.6, true), seg(1.6, 8, false, "Product not visible")] })], "en")).toMatch(/about 2s/);
    expect(unusableText(unusableProfiles(DATA.zh.profiles, "zh"), "zh")).toMatch(/^素材看完了,但大多用不上:.*太糊.*看不到产品.*没有能剪进片子的画面。$/);
  });
  it("a video whose shot log is all unusable no longer covers its suggested role", () => {
    expect(missingRoles([clip({ suggestedRole: "hook", segments: [seg(0, 4, false, "Too blurry")] })])).toContain("hook");
    expect(missingRoles([clip({ kind: "image", identity: "showcase", suggestedRole: "hook" })])).not.toContain("hook");
  });
});

describe("footage question answers", () => {
  it("reads the choice, Other wins, empty falls back to Add more footage", () => {
    expect(footageChoice({ picked: ["ai"] })).toEqual({ choice: "ai" });
    expect(footageChoice({ picked: ["use"], other: " just cut it " })).toEqual({ other: "just cut it" });
    expect(footageChoice(undefined)).toEqual({ choice: "more" });
  });
  it("writes the choice into brief.notes", () => {
    expect(footageBrief(BRIEF, { choice: "ai" }).notes).toMatch(/AI-shoot every beat/);
    expect(footageBrief({ ...BRIEF, notes: "x" }, { other: "zoom in" }).notes).toBe("x\nFootage: zoom in");
    expect(footageBrief(BRIEF, { choice: "more" })).toBe(BRIEF);
  });
  it("reducer: answering with a follow-up swaps in the next question card; backHome keeps files and prompt", () => {
    const q = buildQuestions(undefined, BRIEF, [], "en");
    let s = agentReducer(INITIAL_STATE, { type: "start", prompt: "Make an ad", lang: "en", files: [{ name: "a.mov", url: "blob:a", kind: "video" }], media: [], ids: { files: "f", user: "u" } });
    s = agentReducer(s, { type: "thinking", id: "t" , text: "…" });
    s = agentReducer(s, { type: "briefed", thinkingId: "t", analysisId: "an", reply: "", brief: BRIEF, questions: q.slice(0, 1), questionsId: "q1", unusable: { text: "bad", followUp: { ai: q, use: q } } });
    expect(s.messages.find((m) => m.id === "an")).toMatchObject({ kind: "analysis", unusable: "bad" });
    expect(s.messages.find((m) => m.id === "q1")).toMatchObject({ kind: "questions", followUp: { ai: q } });
    const answered = agentReducer(s, { type: "answered", questionsId: "q1", brief: BRIEF, userId: "a1", transcript: "", rows: [], follow: { id: "q2", questions: q } });
    expect(answered.messages.map((m) => m.id)).toEqual(["f", "u", "an", "a1", "q2"]);
    const home = agentReducer(s, { type: "backHome" });
    expect(home).toMatchObject({ screen: "home", prompt: "Make an ad", messages: [], files: [{ name: "a.mov" }] });
  });
});

describe("length vs footage", () => {
  it("notes how much the footage covers and prices the AI shots when footage is shorter than the length", () => {
    const short = [clip({ segments: [seg(0, 6.4, true)] })];
    const qs = buildQuestions(undefined, BRIEF, short, "en");
    expect(qs.find((q) => q.id === "duration")?.note).toBe("Your footage covers about 6s — AI will fill the rest.");
    const shots = qs.find((q) => q.id === "shots");
    expect(shots?.title).toBe(`Your footage is missing these shots. Which should AI create? · ${shots!.options.length * 50} credits`);
  });
  it("asks nothing extra when footage is long enough", () => {
    const qs = buildQuestions(undefined, BRIEF, DATA.en.profiles, "en");
    expect(qs.find((q) => q.id === "duration")?.note).toBeUndefined();
    expect(qs.find((q) => q.id === "shots")?.title).toBe("Your footage is missing these shots. Which should AI create?");
    expect(coverNote(18.5, 15, "en")).toBeNull();
  });
  it("puts the sentence into the summary when the length question isn't asked", () => {
    const short = [clip({ segments: [seg(0, 6.4, true)] })];
    const brief = { ...BRIEF, durationSec: 30 };
    const qs = buildQuestions(["platform"], brief, short, "en");
    const fill = summaryFill(qs, brief, short);
    expect(fill).toEqual({ footageSec: 6.4, durationSec: 30 });
    expect(footageSummary(short, true, "en", fill)).toContain("Your footage covers about 6s — AI will fill the rest. Confirm a few settings");
    expect(footageSummary(short, true, "zh", fill)).toContain("素材大约能撑 6 秒,其余由 AI 补。确认几个参数");
    expect(summaryFill(buildQuestions(undefined, brief, short, "en"), brief, short)).toBeUndefined();
  });
});
