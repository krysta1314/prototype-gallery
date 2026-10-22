import { describe, expect, it } from "vitest";
import { generatedItemCount, planAssembly } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/logic/plan";
import { voiceScript } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/logic/voice";
import RELLET from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/fixture/rellet.json";
import type { FixtureData } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/fixture/types";

const DATA = RELLET as unknown as FixtureData;

describe("Generation plan items", () => {
  it("recorded EN: 3 AI shots + one voiceover item; footage goes to the edit section", () => {
    const { outline, profiles } = DATA.en;
    expect(generatedItemCount(outline)).toBe(4);
    const a = planAssembly(outline, profiles);
    expect(a.voiceover).toEqual({ title: "Voiceover · Aria (29.4s)", model: "Seed Audio 1.0", script: voiceScript(outline), credits: 30 });
    expect(a.voiceover?.script.split("\n")).toHaveLength(6);
    expect(a.edit.map((e) => e.label)).toEqual(["Your footage · 3 clips", "Subtitles", "Gentle Skincare Bop", "Final cut · 29s · 9:16"]);
    expect(a.edit[0].detail).toBe("IMG_3716.MOV, SaveClip.App_AQNyGQz9V87Xw60AYhoKt4cagmdMfm2bqlUX4daFM7P7d8BXUt.mp4");
  });
  it("no voiceover item (and one item fewer) when voiceover is off", () => {
    const { outline, profiles } = DATA.zh;
    const off = { ...outline, voiceover: { ...outline.voiceover!, on: false } };
    expect(planAssembly(off, profiles).voiceover).toBeUndefined();
    expect(generatedItemCount(off)).toBe(3);
  });
  it("falls back to Background music without a music title", () => {
    const { outline, profiles } = DATA.en;
    expect(planAssembly({ ...outline, music: undefined }, profiles).edit.find((e) => e.kind === "music")?.label).toBe("Background music");
  });
});
