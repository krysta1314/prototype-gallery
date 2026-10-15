import { describe, expect, it } from "vitest";
import {
  cardLength,
  cardLengthHint,
  needPromptText,
  pendingAiShots,
  promptIssue,
  pushVersion,
  switchVersion,
  undoVersionPick,
  voiceBatch,
  voiceLinesToMake,
  type Asset,
  type Clip,
  type Project,
} from "@/app/prototypes/(v1.13)/hybrid-reel/canvas/project";
import { SHOT_TIMEOUT_TEXT, canvasError, canvasErrorKind } from "@/app/prototypes/(v1.13)/hybrid-reel/canvas/errors";

const asset = (id: string, over: Partial<Asset> = {}): Asset => ({
  id,
  kind: "video",
  origin: "ai",
  label: id,
  durationSec: 5,
  aspect: 9 / 16,
  status: "idle",
  prompt: "A close-up of the product",
  x: 0,
  y: 0,
  ...over,
});
const clip = (id: string, assetId: string): Clip => ({
  id,
  assetId,
  role: "usage",
  inSec: 0,
  outSec: 5,
  speed: 1,
  muted: false,
  subtitle: "",
  subtitleSource: "stt",
});
const project = (assets: Asset[], clips: Clip[], over: Partial<Project> = {}): Project => ({
  v: 1,
  assets,
  clips,
  subtitleStyle: "classic",
  musicId: null,
  musicVol: 60,
  voiceVol: 100,
  originalOn: true,
  aspect: "9:16",
  autoLayout: false,
  editor: { x: 0, y: 0 },
  bgmPrompt: "",
  creditsPerShot: 50,
  spentCredits: 0,
  ...over,
});

describe("prompt eligibility (Generate, Generate all, export gate share one rule)", () => {
  it("AI video shots need a non-empty prompt within 2,000 characters; image nodes may leave it empty", () => {
    expect(promptIssue(asset("a"))).toBeNull();
    expect(promptIssue(asset("a", { prompt: "  " }))).toBe("empty");
    expect(promptIssue(asset("a", { prompt: undefined }))).toBe("empty");
    expect(promptIssue(asset("a", { prompt: "x".repeat(2001) }))).toBe("tooLong");
    expect(promptIssue(asset("img", { kind: "image", prompt: "" }))).toBeNull();
  });
  it("pending shots: cost and runnable leave out shots without a usable prompt, which are counted separately", () => {
    const p = project(
      [
        asset("ok", { cost: 50 }),
        asset("empty", { prompt: "", cost: 50 }),
        asset("long", { prompt: "x".repeat(2001), cost: 120 }),
        asset("busy", { status: "generating", prompt: "" }),
      ],
      [clip("c1", "ok"), clip("c2", "empty"), clip("c3", "long"), clip("c4", "busy")],
    );
    const r = pendingAiShots(p);
    expect(r.count).toBe(4);
    expect(r.running).toBe(1);
    expect(r.runnable.map((a) => a.id)).toEqual(["ok"]);
    expect(r.cost).toBe(50);
    expect(r.needPrompt).toBe(1);
    expect(r.tooLong).toBe(1);
    expect(needPromptText(r)).toBe("1 shot needs a prompt first · 1 shot's prompt is too long");
    expect(needPromptText({ needPrompt: 2, tooLong: 0 })).toBe("2 shots need a prompt first");
    expect(needPromptText({ needPrompt: 0, tooLong: 0 })).toBeNull();
  });
});

describe("auto-subtitle skip count", () => {
  it("only counts pending shots with at least one clip that has no generated voiceover", () => {
    const p = project(
      [asset("voiced", { cost: 50 }), asset("silent", { cost: 70 }), asset("half", { cost: 90 })],
      [clip("c1", "voiced"), clip("c2", "silent"), clip("c3", "half"), clip("c4", "half")],
      {
        voice: [
          { id: "l1", assetId: "vo", at: 0, len: 2, clipId: "c1", text: "Hi", url: "blob:l1" },
          { id: "l3", assetId: "vo", at: 10, len: 2, clipId: "c3", text: "Yo", url: "blob:l3" },
          /* 没生成音频的台词不算 */
          { id: "l2", assetId: "vo", at: 5, len: 2, clipId: "c2", text: "Hey" },
        ],
      },
    );
    const r = pendingAiShots(p, { unvoiced: true });
    expect(r.shots.map((a) => a.id)).toEqual(["silent", "half"]);
    expect(r.cost).toBe(160);
    expect(pendingAiShots(p).count).toBe(3);
  });
});

describe("card length hint", () => {
  it("says characters for CJK and words otherwise", () => {
    const zh = cardLength("这是一句超过十个字的屏幕文字呀");
    expect(zh).toMatchObject({ unit: "chars", over: true });
    expect(cardLengthHint(zh.unit)).toBe("Keep on-screen text under 10 characters");
    const en = cardLength("one two three four five six seven");
    expect(en).toMatchObject({ unit: "words", over: true });
    expect(cardLengthHint(en.unit)).toBe("Keep on-screen text under 6 words");
  });
});

describe("voice regenerate after a voice change", () => {
  const node = (id: string, over: Partial<Asset> = {}) => asset(id, { kind: "audio", purpose: "voice", prompt: undefined, ...over });
  const p = (stale: boolean) =>
    project([node("v", { status: "ready", url: "blob:a", voiceStale: stale || undefined })], [], {
      voice: [
        { id: "a", assetId: "v", at: 0, len: 2, clipId: "c1", text: "One", url: "blob:a" },
        { id: "b", assetId: "v", at: 2, len: 2, clipId: "c2", text: "Two" },
      ],
    });
  it("a voice-changed node with missing lines regenerates every line, not only the missing ones", () => {
    expect(voiceLinesToMake(p(true), "v").map((v) => v.id)).toEqual(["a", "b"]);
    expect(voiceBatch(p(true), 5)).toMatchObject({ lines: 2, cost: 10 });
  });
  it("without a voice change only the missing lines are made", () => {
    expect(voiceLinesToMake(p(false), "v").map((v) => v.id)).toEqual(["b"]);
  });
});

describe("undo restores the picked version", () => {
  const three = [1, 2, 3].reduce((a, i) => pushVersion(a, { url: `blob:v${i}`, durationSec: i + 3 }), asset("s", { status: "ready" }));
  it("restores the snapshot's pick when no new version was generated in between", () => {
    const before = three; // version 3 (index 2)
    const after = switchVersion(project([three], []), "s", 0).assets[0];
    expect(after.url).toBe("blob:v1");
    expect(undoVersionPick(before, after)).toEqual({ version: 2, url: "blob:v3", durationSec: 6, aspect: after.aspect });
  });
  it("keeps the current version when a generation added one since the snapshot, or one is running", () => {
    const snap = switchVersion(project([three], []), "s", 0).assets[0];
    const now = pushVersion(three, { url: "blob:v4" });
    expect(undoVersionPick(snap, now).url).toBe("blob:v4");
    expect(undoVersionPick(snap, { ...three, status: "generating" }).url).toBe("blob:v3");
  });
});

describe("canvas error mapper", () => {
  it("maps raw API errors to friendly English and keeps the raw text as details", () => {
    expect(canvasError(new Error("配音生成失败(状态码 504):超时"))).toEqual({
      kind: "timeout",
      text: "The model took too long to respond.",
      details: "配音生成失败(状态码 504):超时",
    });
    expect(canvasError(new Error("Failed to fetch")).text).toBe("Couldn't reach the server — check your connection.");
    expect(canvasError(new Error("HTTP 413")).kind).toBe("tooLarge");
    expect(canvasError(new Error("HTTP 429 Too Many Requests")).text).toBe("The model is busy right now — try again in a moment.");
    expect(canvasErrorKind("服务繁忙")).toBe("busy");
    expect(canvasError(new Error("Download failed (HTTP 502)"))).toMatchObject({ kind: "other", text: "Something went wrong on our side." });
  });
  it("keeps the shot polling timeout sentence as is, with no details", () => {
    expect(canvasError(new Error(SHOT_TIMEOUT_TEXT))).toEqual({ kind: "timeout", text: SHOT_TIMEOUT_TEXT, details: "" });
  });
});
