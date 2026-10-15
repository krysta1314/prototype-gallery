import RELLET from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/fixture/rellet.json";
import { describe, expect, it } from "vitest";
import { createFixtureApi, shapeOutline } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/fixture/api";
import { withVoiceover, withoutAiShots } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/fixture/transform";
import type { FixtureData, FixtureSet } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/fixture/types";
import type { ClipProfile, Outline, Shot } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";

const PROFILES = [
  {
    label: "IMG_3716.MOV",
    kind: "video",
    identity: "footage",
    description: "demo",
    segments: [
      { start: 0, end: 8.4, description: "turn", usable: true, roles: ["hook"] },
      { start: 8.4, end: 15.3, description: "spray", usable: true, roles: ["usage"] },
    ],
  },
] as unknown as ClipProfile[];
const ai = (sec: number): Shot => ({ role: "pain", durationSec: sec, source: { kind: "generate", genType: "broll", prompt: "x" }, subtitle: { text: "dry", source: "authored" } });
const clip: Shot = { role: "usage", durationSec: 4, source: { kind: "clip", clipIndex: 0, inSec: 8.4, outSec: 12.4 }, subtitle: { text: "", source: "authored" } };
const OUTLINE: Outline = {
  shots: [clip, ai(4), ai(5)],
  direction: "v1",
  bgmPrompt: "",
  credits: { base: 40, perGenerateShot: 50, generatedShots: 2, total: 140 },
  model: "seed",
  voiceover: { on: true, why: "", voice: "cn-f" },
};
const SET: FixtureSet = {
  prompt: "制作一条广告",
  promptStated: "帮我做一条 30 秒的 TikTok 广告",
  profiles: PROFILES,
  brief: { reply: "r", brief: { platform: "IG Reels", durationSec: 15, audience: "", sellingPoints: [], cta: "", subtitleLang: "简体中文" }, assumed: ["platform", "durationSec"] },
  briefStated: { reply: "r2", brief: { platform: "TikTok", durationSec: 30, audience: "", sellingPoints: [], cta: "", subtitleLang: "简体中文" }, assumed: [] },
  answers: { platform: { picked: ["TikTok"] } },
  outline: OUTLINE,
  revision: "开头换成雪山溪流",
  revised: { ...OUTLINE, direction: "v2" },
  voice: [],
};
const DATA: FixtureData = { zh: SET, en: { ...SET, prompt: "Make an ad", promptStated: "Make a 30s TikTok ad" } };
const OPTS = { lang: "zh" as const, voiceover: true, aiShots: "recorded" as const, failAnalyze: false, failOutline: false, delayMs: 0 };

describe("withoutAiShots", () => {
  it("replaces AI shots with usable footage of the same length and recomputes credits", () => {
    const o = withoutAiShots(OUTLINE, PROFILES);
    expect(o.shots.every((s) => s.source.kind === "clip")).toBe(true);
    expect(o.shots.map((s) => s.durationSec)).toEqual([4, 4, 5]);
    expect(o.credits).toEqual({ base: 40, perGenerateShot: 50, generatedShots: 0, total: 40 });
    expect(o.shots[1].subtitle.text).toBe("dry");
  });
});

describe("withVoiceover", () => {
  it("turns the voiceover flag on or off without touching other fields", () => {
    expect(withVoiceover(OUTLINE, false).voiceover).toEqual({ on: false, why: "", voice: "cn-f" });
    expect(withVoiceover(OUTLINE, true)).toEqual(OUTLINE);
  });
});

describe("shapeOutline", () => {
  it("applies the review toggles", () => {
    const o = shapeOutline(OUTLINE, SET, { ...OPTS, aiShots: 0, voiceover: false });
    expect(o.credits.generatedShots).toBe(0);
    expect(o.voiceover?.on).toBe(false);
  });
});

describe("createFixtureApi", () => {
  it("returns the recorded analysis and picks the brief by prompt", async () => {
    const api = createFixtureApi(DATA, OPTS);
    expect(await api.analyze([], "zh")).toEqual({ profiles: PROFILES, skipped: [] });
    expect((await api.brief("制作一条广告", PROFILES, "zh")).reply).toBe("r");
    expect((await api.brief("帮我做一条 30 秒的 TikTok 广告", PROFILES, "zh")).reply).toBe("r2");
  });
  it("returns the recorded revision whatever the user typed", async () => {
    const api = createFixtureApi(DATA, OPTS);
    const o = await api.outline({ brief: SET.brief.brief, profiles: PROFILES, revise: { current: OUTLINE, change: "anything" } });
    expect(o.direction).toBe("v2");
    expect((await api.outline({ brief: SET.brief.brief, profiles: PROFILES })).direction).toBe("v1");
  });
  it("throws when a failure toggle is on", async () => {
    await expect(createFixtureApi(DATA, { ...OPTS, failAnalyze: true }).analyze([], "zh")).rejects.toThrow();
    await expect(createFixtureApi(DATA, { ...OPTS, failOutline: true }).outline({ brief: SET.brief.brief, profiles: PROFILES })).rejects.toThrow();
  });
  it("reports progress file by file and can be cancelled", async () => {
    const api = createFixtureApi(DATA, OPTS);
    const items = [1, 2, 3].map((i) => ({ name: `f${i}.mp4`, url: `/f${i}.mp4`, kind: "video" as const }));
    const seen: string[] = [];
    await api.analyze(items, "zh", { onProgress: (d, n) => seen.push(`${d}/${n}`) });
    expect(seen).toEqual(["0/3", "1/3", "2/3", "3/3"]);
    const ctrl = new AbortController();
    ctrl.abort();
    await expect(api.analyze(items, "zh", { signal: ctrl.signal })).rejects.toMatchObject({ name: "AbortError" });
  });
  it("uses the English set when lang is en", async () => {
    const api = createFixtureApi(DATA, { ...OPTS, lang: "en" });
    expect((await api.brief("Make a 30s TikTok ad", PROFILES, "en")).reply).toBe("r2");
  });
});

describe("rellet.json", () => {
  it("has a complete set for both languages", () => {
    for (const lang of ["zh", "en"] as const) {
      const s = (RELLET as unknown as FixtureData)[lang];
      expect(s.profiles).toHaveLength(4);
      expect(s.outline.shots.length).toBeGreaterThan(0);
      expect(s.revised.shots.length).toBeGreaterThan(0);
      expect(s.brief.reply.length).toBeGreaterThan(0);
    }
  });
  it("has a recorded voice line for every distinct voiceover sentence in both storyboards", () => {
    for (const lang of ["zh", "en"] as const) {
      const s = (RELLET as unknown as FixtureData)[lang];
      const lines = [...new Set([...s.outline.shots, ...s.revised.shots].map((x) => x.subtitle.text.trim()).filter(Boolean))];
      expect(s.voice.map((v) => v.text).sort()).toEqual(lines.sort());
      for (const v of s.voice) {
        expect(v.url).toMatch(/^\/prototypes\/hybrid-reel-agent\/fixture\/voice\/.+\.mp3$/);
        expect(v.durationSec).toBeGreaterThan(0);
      }
    }
  });
});
