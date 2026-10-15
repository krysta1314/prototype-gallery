import { describe, expect, it } from "vitest";
import { genGrid, gridTitle } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/logic/genGrid";
import type { Outline, Shot } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";

const ai = (summary: string, text = ""): Shot => ({ role: "hook", durationSec: 5, source: { kind: "generate", genType: "broll", summary, prompt: `${summary}. Vertical.` }, subtitle: { text, source: "authored" } });
const clip: Shot = { role: "usage", durationSec: 4, source: { kind: "clip", clipIndex: 0, inSec: 0, outSec: 4 }, subtitle: { text: "Mist it on", source: "authored" } };
const O: Outline = { shots: [ai("A", "Dry skin?"), clip, ai("B", "Shop now")], direction: "", bgmPrompt: "", credits: { base: 40, perGenerateShot: 50, generatedShots: 2, total: 140 }, model: "seed", voiceover: { on: true, why: "" } };
/* 排程:usage 0–500 · ref 500–1500 · gen-0 1500–5500 · gen-2 1500–6500 · voices 6500–7000 · audio 7000–9000
   · ff-cut 9000–10500 · assemble 10500–12500 · subs 12500–14000 · mix 14000–15500 · check 15500–16500 */
const status = (clock: number, run: Partial<Parameters<typeof genGrid>[0]> = {}) => genGrid({ outline: O, ...run }, clock).cards.map((c) => c.status);

describe("genGrid", () => {
  it("only shows what is generated: one card per AI shot + one voiceover card, no footage cards", () => {
    const cards = genGrid({ outline: O }, 0).cards;
    expect(cards.map((c) => (c.kind === "ai" ? `ai-${c.shot}` : `voice-${c.sec}`))).toEqual(["ai-1", "ai-3", "voice-14"]);
  });
  it("drops the voiceover card when voiceover is off", () => {
    expect(genGrid({ outline: { ...O, voiceover: { on: false, why: "" } } }, 0).cards.map((c) => c.kind)).toEqual(["ai", "ai"]);
  });
  it("AI cards finish with their own Generate video run, the voiceover card with Generate audio", () => {
    expect(status(0)).toEqual(["generating", "generating", "generating"]);
    expect(status(5600)).toEqual(["done", "generating", "generating"]);
    expect(status(6600)).toEqual(["done", "done", "generating"]);
    expect(status(9000)).toEqual(["done", "done", "done"]);
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
  it("a failing shot's card turns failed (with reason); the run pauses once generations settle, before the edit", () => {
    const fail = [{ shot: 3, reason: "busy" }];
    expect(status(6000, { fail })[1]).toBe("generating");
    const g = genGrid({ outline: O, fail }, Infinity);
    expect(g.cards[1]).toEqual({ kind: "ai", key: "ai-3", shot: 3, status: "failed", reason: "busy" });
    expect(g.cards[2].status).toBe("done");
    expect(g.phase).toBe("paused");
    expect(g.status).toBe("");
    expect(genGrid({ outline: O, fail }, 8000).phase).toBe("voiceover");
  });
  it("Stop freezes the grid: unfinished cards show stopped, status Stopped.", () => {
    const g = genGrid({ outline: O, stoppedAtMs: 6000 }, Infinity);
    expect(g.cards.map((c) => c.status)).toEqual(["done", "stopped", "stopped"]);
    expect(g.status).toBe("Stopped.");
  });
  it("a retry run only has the retried shots' cards; an edit-only run has none", () => {
    expect(status(0, { only: [3] })).toEqual(["generating"]);
    expect(genGrid({ outline: O, only: [3] }, 0).status).toBe("Filming in progress...");
    expect(status(Infinity, { only: [1, 3] })).toEqual(["done", "done"]);
    const edit = genGrid({ outline: O, editOnly: true }, 0);
    expect(edit.cards).toEqual([]);
    expect(edit.status).toBe("Cutting your footage...");
  });
  it("collapsed titles", () => {
    expect(gridTitle({ outline: O }, genGrid({ outline: O }, Infinity).cards)).toBe("Generated 2 shots and the voiceover");
    expect(gridTitle({ outline: O, only: [3] }, [])).toBe("Regenerated shot 3");
    expect(gridTitle({ outline: O, only: [1, 3] }, [])).toBe("Regenerated shots 1 and 3");
  });
});
