import { describe, expect, it } from "vitest";
import {
  START_CREDITS,
  checkCredits,
  OUT_OF_CREDITS_LINK,
  OUT_OF_CREDITS_TEXT,
  UPGRADE_LABEL,
  UPGRADE_TOAST,
  regenerateBody,
  REGENERATE_TITLE,
  reelCost,
  shotCost,
  stoppedText,
} from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/logic/credits";
import type { Outline, Shot } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";
import { voiceCost } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/logic/voice";
import RELLET from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/fixture/rellet.json";
import type { FixtureData } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/fixture/types";

const ai = (text: string): Shot => ({ role: "pain", durationSec: 4, source: { kind: "generate", genType: "broll", prompt: "p" }, subtitle: { text, source: "authored" } });
const clip = (text: string): Shot => ({ role: "usage", durationSec: 3, source: { kind: "clip", clipIndex: 0, inSec: 0, outSec: 3 }, subtitle: { text, source: "authored" } });
const OUTLINE: Outline = {
  shots: [clip("Dry skin again?"), ai("Makeup cakes"), ai(""), clip("Mist it on")],
  direction: "",
  bgmPrompt: "",
  /* total 是分镜接口给的旧预估(只算补拍),reelCost 不再用它 */
  credits: { base: 40, perGenerateShot: 50, generatedShots: 2, total: 140 },
  model: "seed",
  voiceover: { on: true, why: "" },
};
const DATA = RELLET as unknown as FixtureData;

describe("credits rules", () => {
  it("starts at 35,600", () => {
    expect(START_CREDITS).toBe(35600);
  });
  it("lets a charge through only when the balance covers it", () => {
    expect(checkCredits(140, 140)).toEqual({ ok: true });
    expect(checkCredits(30, 140)).toEqual({ ok: false, needed: 140, balance: 30 });
  });
  it("prices a reel at 40 base + 50 per AI shot + 5 per voiceover line, and a retry at one AI shot", () => {
    /* 3 句台词(空台词不算):40 + 2 × 50 + 3 × 5 */
    expect(voiceCost(OUTLINE)).toBe(15);
    expect(reelCost(OUTLINE)).toBe(155);
    expect(shotCost(OUTLINE)).toBe(50);
  });
  it("drops the voiceover cost when voiceover is off, and footage shots cost nothing", () => {
    expect(reelCost({ ...OUTLINE, voiceover: { on: false, why: "" } })).toBe(140);
    expect(reelCost({ ...OUTLINE, shots: [clip("a"), clip("b")], voiceover: { on: false, why: "" } })).toBe(40);
  });
  it("recorded RELLET: 3 AI shots + 6 voiceover lines = 220, revised 4 AI shots = 270 (zh and en)", () => {
    for (const lang of ["zh", "en"] as const) {
      expect(reelCost(DATA[lang].outline)).toBe(220);
      expect(reelCost(DATA[lang].revised)).toBe(270);
    }
  });
  it("writes the copy from the spec", () => {
    expect(`${REGENERATE_TITLE} ${regenerateBody(1240)}`).toBe("Regenerate this reel? It uses 1,240 credits.");
    expect([OUT_OF_CREDITS_TEXT, OUT_OF_CREDITS_LINK, UPGRADE_LABEL, UPGRADE_TOAST]).toEqual([
      "You've run out of credits.",
      "Upgrade to continue",
      "Upgrade",
      "Upgrade isn't part of this prototype",
    ]);
    expect(stoppedText(90)).toBe("Stopped. 90 credits refunded.");
    expect(stoppedText(90, "zh")).toBe("已停止。退回 90 积分。");
  });
});
