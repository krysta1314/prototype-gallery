import { describe, expect, it } from "vitest";
import { brandOf, deliveryNotes, reelFileName, voiceLabel } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/logic/delivery";
import type { Brief, ClipProfile, Outline, Shot } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";

const BRIEF: Brief = {
  platform: "TikTok",
  durationSec: 30,
  audience: "",
  sellingPoints: ["Fine mist", "Glacier water"],
  cta: "Shop now",
  subtitleLang: "English",
};
const PROFILES: ClipProfile[] = [
  {
    label: "IMG_3716.MOV",
    kind: "video",
    sizeMB: 10,
    description: "Spray demo",
    tags: [],
    hasVoice: false,
    issues: [],
    suggestedRole: "usage",
    faceVisible: false,
    segments: [{ start: 0, end: 5, description: "Mist", usable: true, roles: ["usage"], sellingPoint: "Fine mist spray" }],
  },
];
const aiShot: Shot = { role: "hook", durationSec: 8, source: { kind: "generate", genType: "broll", prompt: "x" }, subtitle: { text: "", source: "authored" } };
const clipShot: Shot = { role: "usage", durationSec: 4, source: { kind: "clip", clipIndex: 0, inSec: 0, outSec: 4 }, subtitle: { text: "", source: "authored" } };
const OUTLINE = (shots: Shot[], extra: Partial<Outline> = {}): Outline => ({
  shots,
  direction: "",
  bgmPrompt: "",
  credits: { base: 40, perGenerateShot: 50, generatedShots: shots.filter((s) => s.source.kind === "generate").length, total: 40 + 50 * shots.filter((s) => s.source.kind === "generate").length },
  model: "seed",
  voiceover: { on: true, why: "", voice: "Xiaoyu" },
  music: { source: "ai", prompt: "soft pad", beatSync: true },
  ...extra,
});

describe("deliveryNotes", () => {
  it("lists each AI shot, the voice and the render fee, with the outline total", () => {
    const d = deliveryNotes(OUTLINE([aiShot, clipShot]), BRIEF, PROFILES);
    expect(d.usage).toEqual(["Shot 1 · Seedance 2.5 · 8s · 50 credits", "Voiceover · Xiaoyu", "Final render · 40 credits"]);
    expect(d.total).toBe(90);
  });
  it("flags selling points the footage does not show, AI packaging and placeholder music", () => {
    const d = deliveryNotes(OUTLINE([aiShot, clipShot]), BRIEF, PROFILES);
    expect(d.checks).toHaveLength(3);
    expect(d.checks[0]).toContain("“Glacier water”");
    expect(d.checks[1]).toContain("shot 1");
    expect(d.checks[2]).toContain("placeholder");
  });
  it("drops the AI packaging check when nothing was AI-shot and the music check for uploaded music", () => {
    const d = deliveryNotes(OUTLINE([clipShot], { music: { source: "upload", prompt: "", beatSync: false } }), { ...BRIEF, sellingPoints: ["Fine mist"] }, PROFILES);
    expect(d.checks).toEqual([]);
    expect(d.usage).toEqual(["Voiceover · Xiaoyu", "Final render · 40 credits"]);
  });
  it("omits the voiceover line when voiceover is off", () => {
    expect(deliveryNotes(OUTLINE([clipShot], { voiceover: { on: false, why: "" } }), BRIEF, PROFILES).usage).toEqual(["Final render · 40 credits"]);
  });
  it("writes the usage and check lines in Chinese for a zh prompt", () => {
    const d = deliveryNotes(OUTLINE([aiShot, clipShot]), BRIEF, PROFILES, "zh");
    expect(d.usage).toEqual(["镜头 1 · Seedance 2.5 · 8s · 50 积分", "配音 · Xiaoyu", "最终合成 · 40 积分"]);
    expect(d.checks).toEqual([
      "「Glacier water」在你的素材里看不清 —— 投放前请核实这条宣称。",
      "AI 镜头可能把包装小字或 logo 生成得模糊 —— 请对照实物检查第 1 镜。",
      "背景音乐是占位音乐 —— 发布前请换成有授权的曲子。",
    ]);
  });
  it("does not flag a Chinese selling point that overlaps the footage text", () => {
    const zhProfiles: ClipProfile[] = [{ ...PROFILES[0], description: "直观展示产品包含5种玻尿酸,上脸清爽", segments: [] }];
    const d = deliveryNotes(OUTLINE([clipShot], { music: { source: "upload", prompt: "", beatSync: false } }), { ...BRIEF, sellingPoints: ["添加5种玻尿酸,深层补水"] }, zhProfiles);
    expect(d.checks).toEqual([]);
  });
  it("flags an unrelated Chinese selling point", () => {
    const zhProfiles: ClipProfile[] = [{ ...PROFILES[0], description: "直观展示产品包含5种玻尿酸,上脸清爽", segments: [] }];
    const d = deliveryNotes(OUTLINE([clipShot], { music: { source: "upload", prompt: "", beatSync: false } }), { ...BRIEF, sellingPoints: ["防水持久不脱妆"] }, zhProfiles);
    expect(d.checks).toHaveLength(1);
    expect(d.checks[0]).toContain("防水持久不脱妆");
  });
});

describe("reel file name and voice label", () => {
  it("builds {brand}-{platform}-{duration}s.mp4, falling back to hybrid-reel", () => {
    expect(reelFileName({ brand: "RELLET", platform: "TikTok", durationSec: 15.6 })).toBe("rellet-tiktok-16s.mp4");
    expect(reelFileName({ platform: "IG Reels", durationSec: 30 })).toBe("hybrid-reel-ig-reels-30s.mp4");
  });
  it("reads the brand from a brand-asset clip", () => {
    const logo = { ...PROFILES[0], identity: "brand" as const, description: "Blue RELLET 颐莲 brand logo on white" };
    expect(brandOf([PROFILES[0], logo])).toBe("RELLET");
    expect(brandOf(PROFILES)).toBeUndefined();
  });
  it("shows the voice's readable name, or the id when unknown", () => {
    expect(voiceLabel("cn-f")).toBe("Xiaoyu");
    expect(voiceLabel("mystery")).toBe("mystery");
    const d = deliveryNotes(OUTLINE([clipShot], { voiceover: { on: true, why: "", voice: "warm-f" } }), BRIEF, PROFILES);
    expect(d.usage[0]).toBe("Voiceover · Aria");
  });
});
