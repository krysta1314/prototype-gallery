import { describe, expect, it } from "vitest";
import {
  assumedKeys,
  detectPlatform,
  detectSubtitleLang,
  isGenericPrompt,
  parseDurationSec,
  parseZhNumber,
  ruleBased,
} from "@/lib/hybrid-reel/briefRules";

describe("parseDurationSec", () => {
  it.each([
    ["Make a 30s ad", 30],
    ["make it 30 s long", 30],
    ["Make a 30-second TikTok ad", 30],
    ["a 15 sec teaser", 15],
    ["20 seconds please", 20],
    ["帮我做一条 30 秒的 TikTok 广告", 30],
    ["做个15秒的", 15],
    ["三十秒", 30],
    ["半分钟的广告", 30],
    ["1 分钟", 60],
    ["一分钟的视频", 60],
    ["1 minute ad", 60],
    ["a 1-minute reel", 60],
    ["二十五秒", 25],
    ["做一条二十五秒的广告", 25],
    ["十秒", 10],
    ["十五秒", 15],
    ["二十秒", 20],
    ["四十五秒", 45],
    ["六十秒", 60],
    ["九十九秒", 99],
    ["两分钟", 120],
    ["半 分钟", 30],
  ])("%s → %d", (text, sec) => {
    expect(parseDurationSec(text)).toBe(sec);
  });
  it("ignores text with no length", () => {
    expect(parseDurationSec("Make an ad with 5 types of HA")).toBeUndefined();
    expect(parseDurationSec("30 shots of the bottle")).toBeUndefined();
    expect(parseDurationSec("一条广告")).toBeUndefined();
  });
  it("snaps to the nearest choice in ruleBased", () => {
    expect(ruleBased("1 minute").durationSec).toBe(30);
    expect(ruleBased("半分钟").durationSec).toBe(30);
    expect(ruleBased("18 秒").durationSec).toBe(20);
    expect(ruleBased("二十五秒").durationSec).toBe(20);
    expect(ruleBased("二十八秒").durationSec).toBe(30);
    expect(ruleBased("十二秒").durationSec).toBe(15);
  });
});

describe("parseZhNumber", () => {
  it.each([
    ["一", 1], ["两", 2], ["十", 10], ["十五", 15], ["二十", 20], ["二十五", 25], ["三十", 30], ["四十五", 45], ["六十", 60], ["九十九", 99],
  ])("%s → %d", (s, n) => {
    expect(parseZhNumber(s)).toBe(n);
  });
  it("rejects malformed numerals", () => {
    expect(parseZhNumber("十十")).toBeNaN();
    expect(parseZhNumber("一二")).toBeNaN();
    expect(parseZhNumber("")).toBeNaN();
  });
});

describe("detectPlatform / detectSubtitleLang", () => {
  it("reads platforms", () => {
    expect(detectPlatform("IG Reels please")).toBe("IG Reels");
    expect(detectPlatform("for facebook reels")).toBe("FB Reels");
    expect(detectPlatform("抖音广告")).toBe("TikTok");
    expect(detectPlatform("Make an ad")).toBeUndefined();
  });
  it("reads the subtitle language only when it is unambiguous", () => {
    expect(detectSubtitleLang("English subtitles")).toBe("English");
    expect(detectSubtitleLang("用繁體字幕")).toBe("繁體中文");
    expect(detectSubtitleLang("中文字幕")).toBe("简体中文");
    expect(detectSubtitleLang("中文字幕改成英文")).toBeUndefined();
    expect(detectSubtitleLang("帮我做一条广告")).toBeUndefined();
  });
});

describe("isGenericPrompt", () => {
  it("treats filler-only prompts as generic", () => {
    expect(isGenericPrompt("")).toBe(true);
    expect(isGenericPrompt("Make an ad")).toBe(true);
    expect(isGenericPrompt("Create a video for me")).toBe(true);
    expect(isGenericPrompt("制作一条广告")).toBe(true);
    expect(isGenericPrompt("帮我做一个视频")).toBe(true);
  });
  it("strips English fillers on word boundaries only", () => {
    /* 旧写法会把 Advanced / Nature 里的 a、ad 也删掉 */
    expect(isGenericPrompt("Advanced")).toBe(false);
    expect(isGenericPrompt("Make an ad for Rellet")).toBe(false);
    expect(isGenericPrompt("帮我做一条护肤品广告,强调保湿")).toBe(false);
  });
});

describe("assumedKeys", () => {
  const KEYS = ["platform", "durationSec", "audience", "sellingPoints", "cta", "subtitleLang"] as const;
  it("marks everything except rule hits as assumed for a generic prompt", () => {
    expect(assumedKeys(KEYS, ruleBased("Make an ad"), "Make an ad", [])).toEqual([...KEYS]);
  });
  it("uses rule hits for platform, length and language, the model for the rest", () => {
    const prompt = "Make a 30-second TikTok ad for Rellet";
    expect(assumedKeys(KEYS, ruleBased(prompt), prompt, ["durationSec", "audience", "subtitleLang"])).toEqual(["audience", "subtitleLang"]);
    const zh = "帮我做一条 30 秒的 TikTok 广告,中文字幕";
    expect(assumedKeys(KEYS, ruleBased(zh), zh, ["subtitleLang", "cta"])).toEqual(["cta"]);
  });
});

describe("parseZhNumber · 百位", () => {
  it("reads hundreds", async () => {
    const { parseZhNumber, parseDurationSec } = await import("@/lib/hybrid-reel/briefRules");
    expect(parseZhNumber("一百二十")).toBe(120);
    expect(parseZhNumber("一百零五")).toBe(105);
    expect(parseZhNumber("一百二")).toBe(120);
    expect(parseZhNumber("两百")).toBe(200);
    expect(parseDurationSec("做一条一百二十秒的广告")).toBe(120);
  });
});
