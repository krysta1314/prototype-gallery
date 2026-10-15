import { describe, expect, it } from "vitest";
import { footageSummary } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/logic/summary";
import RELLET from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/fixture/rellet.json";
import type { FixtureData } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/fixture/types";

const DATA = RELLET as unknown as FixtureData;

describe("footageSummary", () => {
  it("says what footage there is, what's missing for AI, and the next step (zh)", () => {
    const s = footageSummary(DATA.zh.profiles, true, "zh");
    expect(s.startsWith("素材看完了:")).toBe(true);
    expect(s).toContain("AI 补拍");
    expect(s.endsWith("确认几个参数后就开始排分镜。")).toBe(true);
  });
  it("goes straight to the storyboard when nothing is asked (en)", () => {
    const s = footageSummary(DATA.en.profiles, false, "en");
    expect(s.startsWith("I've gone through your footage")).toBe(true);
    expect(s.endsWith("Laying out the storyboard now.")).toBe(true);
  });
  it("no footage gaps → no AI shots", () => {
    const full = ["hook", "pain", "proof", "usage", "cta"].map((r, i) => ({
      label: `c${i}.mp4`, kind: "video" as const, identity: "footage" as const, sizeMB: 1, description: "", tags: [], hasVoice: false, issues: [],
      suggestedRole: r as "hook", faceVisible: false, durationSec: 3,
    }));
    expect(footageSummary(full, false, "zh")).toContain("不用 AI 补拍");
  });
});
