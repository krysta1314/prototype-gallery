import { describe, expect, it } from "vitest";
import { genGrid } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/logic/genGrid";
import type { Outline, Shot } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";

const ai = (summary: string): Shot => ({ role: "hook", durationSec: 5, source: { kind: "generate", genType: "broll", summary, prompt: `${summary}. Vertical.` }, subtitle: { text: "", source: "authored" } });
const clip: Shot = { role: "usage", durationSec: 4, source: { kind: "clip", clipIndex: 0, inSec: 0, outSec: 4 }, subtitle: { text: "", source: "authored" } };
const O: Outline = { shots: [ai("A"), clip, ai("B")], direction: "", bgmPrompt: "", credits: { base: 40, perGenerateShot: 50, generatedShots: 2, total: 140 }, model: "seed", voiceover: { on: true, why: "" } };
/* 排程:usage 0–500 · ref 500–1500 · gen-0 1500–5500 · gen-2 1500–6500 · voices 6500–7000 · audio 7000–9000
   · ff-cut 9000–10500 · assemble 10500–12500 · subs 12500–14000 · mix 14000–15500 · check 15500–16500 */
const status = (clock: number, run: Partial<Parameters<typeof genGrid>[0]> = {}) => genGrid({ outline: O, ...run }, clock).cards.map((c) => c.status);

describe("genGrid", () => {
  it("has one card per storyboard shot, labelled AI / Footage", () => {
    expect(genGrid({ outline: O }, 0).cards.map((c) => [c.shot, c.source])).toEqual([[1, "AI"], [2, "Footage"], [3, "AI"]]);
  });
  it("AI cards finish with their own Generate video run, footage cards with cut footage", () => {
    expect(status(0)).toEqual(["generating", "generating", "generating"]);
    expect(status(5600)).toEqual(["done", "generating", "generating"]);
    expect(status(6600)).toEqual(["done", "generating", "done"]);
    expect(status(10500)).toEqual(["done", "done", "done"]);
  });
  it("status line follows the active run", () => {
    const at = (t: number) => genGrid({ outline: O }, t).status;
    expect(at(100)).toBe("Getting things ready...");
    expect(at(2000)).toBe("Filming in progress...");
    expect(at(7500)).toBe("Adding the voiceover...");
    expect(at(9500)).toBe("Cutting your footage...");
    expect(at(11000)).toBe("Assembling the reel...");
    expect(at(16000)).toBe("Checking the final cut...");
    expect(genGrid({ outline: O }, Infinity).phase).toBe("done");
  });
  it("a failing shot's card turns failed (with reason) when its run ends", () => {
    const fail = [{ shot: 3, reason: "busy" }];
    expect(status(6000, { fail })[2]).toBe("generating");
    const g = genGrid({ outline: O, fail }, Infinity);
    expect(g.cards[2]).toEqual({ shot: 3, source: "AI", status: "failed", reason: "busy" });
    expect(g.cards.slice(0, 2).every((c) => c.status === "done")).toBe(true);
  });
  it("Stop freezes the grid: unfinished cards show stopped, status Stopped.", () => {
    const g = genGrid({ outline: O, stoppedAtMs: 6000 }, Infinity);
    expect(g.cards.map((c) => c.status)).toEqual(["done", "stopped", "stopped"]);
    expect(g.status).toBe("Stopped.");
  });
  it("a retry run only puts that shot back to generating", () => {
    expect(status(0, { only: 3 })).toEqual(["done", "done", "generating"]);
    expect(genGrid({ outline: O, only: 3 }, 0).status).toBe("Filming in progress...");
    expect(status(Infinity, { only: 3 })).toEqual(["done", "done", "done"]);
  });
});
