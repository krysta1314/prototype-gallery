import { describe, expect, it } from "vitest";
import {
  START_CREDITS,
  checkCredits,
  notEnoughText,
  regenerateBody,
  REGENERATE_TITLE,
  reelCost,
  shotCost,
  shotFailedText,
  stoppedText,
} from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/logic/credits";
import type { Outline } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";

const OUTLINE = { shots: [], direction: "", bgmPrompt: "", credits: { base: 40, perGenerateShot: 50, generatedShots: 2, total: 140 }, model: "seed" } as Outline;

describe("credits rules", () => {
  it("starts at 35,600", () => {
    expect(START_CREDITS).toBe(35600);
  });
  it("lets a charge through only when the balance covers it", () => {
    expect(checkCredits(140, 140)).toEqual({ ok: true });
    expect(checkCredits(30, 140)).toEqual({ ok: false, needed: 140, balance: 30 });
  });
  it("prices a reel at the storyboard estimate and a retry at one AI shot", () => {
    expect(reelCost(OUTLINE)).toBe(140);
    expect(shotCost(OUTLINE)).toBe(50);
  });
  it("writes the copy from the spec", () => {
    expect(`${REGENERATE_TITLE} ${regenerateBody(1240)}`).toBe("Regenerate this reel? It uses 1,240 credits.");
    expect(notEnoughText(140, 30)).toBe("This needs 140 credits and you have 30.");
    expect(shotFailedText(2, "The video model is busy right now", 50)).toBe("Shot 2 failed — the video model is busy right now. 50 credits refunded.");
    expect(stoppedText(90)).toBe("Stopped. 90 credits refunded.");
    expect(stoppedText(90, "zh")).toBe("已停止。退回 90 积分。");
  });
});
