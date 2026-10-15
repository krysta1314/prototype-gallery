import { describe, expect, it } from "vitest";
import { finishedShots, genShot, rowStates, runEndMs, schedule, settleMs, stopRefund, toolRuns, totalMs } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/logic/runs";
import type { Outline, Shot } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";

const ai = (summary: string): Shot => ({ role: "hook", durationSec: 5, source: { kind: "generate", genType: "broll", summary, prompt: `${summary}. Vertical.` }, subtitle: { text: "", source: "authored" } });
const clip: Shot = { role: "usage", durationSec: 4, source: { kind: "clip", clipIndex: 0, inSec: 0, outSec: 4 }, subtitle: { text: "", source: "authored" } };
const OUTLINE = (shots: Shot[]): Outline => ({ shots, direction: "", bgmPrompt: "", credits: { base: 40, perGenerateShot: 50, generatedShots: 0, total: 40 }, model: "seed", voiceover: { on: true, why: "" } });

describe("toolRuns", () => {
  it("has one Generate video row per AI shot, carrying its prompt", () => {
    const runs = toolRuns(OUTLINE([ai("Model sprays"), clip, ai("Snow stream")]));
    const gen = runs.filter((r) => r.label === "Generate video");
    expect(gen).toHaveLength(2);
    expect(gen[0].detail).toBe("Model sprays. Vertical.");
    expect(runs.map((r) => r.label)).toContain("Upload reference image");
  });
  it("skips reference upload and video generation when nothing is AI-shot", () => {
    const labels = toolRuns(OUTLINE([clip])).map((r) => r.label);
    expect(labels).not.toContain("Generate video");
    expect(labels).not.toContain("Upload reference image");
    expect(labels[0]).toBe("Get usage");
    expect(labels[labels.length - 1]).toBe("Check output");
  });
  it("skips voice rows when voiceover is off", () => {
    const o = { ...OUTLINE([clip]), voiceover: { on: false, why: "" } };
    expect(toolRuns(o).map((r) => r.label)).not.toContain("Generate audio");
  });
});

describe("schedule", () => {
  it("runs rows in order but starts a group together", () => {
    const slots = schedule([
      { id: "a", label: "A", ms: 500 },
      { id: "g1", label: "G", ms: 4000, group: "gen" },
      { id: "g2", label: "G", ms: 6000, group: "gen" },
      { id: "b", label: "B", ms: 1000 },
    ]);
    expect(slots).toEqual([
      { id: "a", startMs: 0, endMs: 500 },
      { id: "g1", startMs: 500, endMs: 4500 },
      { id: "g2", startMs: 500, endMs: 6500 },
      { id: "b", startMs: 6500, endMs: 7500 },
    ]);
  });
});

describe("failure, stop and retry", () => {
  const o = OUTLINE([ai("A"), clip, ai("B")]);
  const runs = toolRuns(o);
  const slots = schedule(runs);
  const fail = [{ shot: 3, reason: "busy" }];

  it("maps Generate video rows to shot numbers", () => {
    expect(runs.filter((r) => r.label === "Generate video").map((r) => genShot(r.id))).toEqual([1, 3]);
    expect(genShot("check")).toBeUndefined();
  });
  it("marks a failing shot's row failed once it ends, the rest done", () => {
    const st = rowStates(runs, slots, Infinity, fail);
    expect(st[runs.findIndex((r) => r.id === "gen-2")]).toBe("failed");
    expect(st[runs.findIndex((r) => r.id === "gen-0")]).toBe("done");
    expect(st.filter((s) => s === "failed")).toHaveLength(1);
  });
  it("freezes at the stop time: running rows become stopped, later ones stay hidden", () => {
    const st = rowStates(runs, slots, Infinity, [], 2000); // usage 0–500, ref 500–1500, gen 1500–…
    expect(st.slice(0, 4)).toEqual(["done", "done", "stopped", "stopped"]);
    expect(st.slice(4).every((s) => s === "hidden")).toBe(true);
  });
  it("refunds everything not yet finished when stopped", () => {
    expect(stopRefund({ outline: o, charged: 140, refunded: 0, runs, slots, atMs: 2000 })).toBe(140);
    /* shot 1 (4s, 1500–5500) done, shot 3 (5s, 1500–6500) still running → keep 50 */
    expect(stopRefund({ outline: o, charged: 140, refunded: 0, runs, slots, atMs: 6000 })).toBe(90);
    /* shot 3 already failed and refunded: not kept, not refunded twice */
    expect(stopRefund({ outline: o, charged: 140, refunded: 50, runs, slots, atMs: 7000, fail })).toBe(40);
  });
  it("a retry run only regenerates the failed shots (in parallel), then does the whole edit", () => {
    const r = toolRuns(o, { only: [3] });
    expect(r.map((x) => x.id)).toEqual(["gen-2", "ff-cut", "ff-assemble", "ff-subs", "ff-mix", "check"]);
    expect(r[0].detail).toBe("B. Vertical.");
    const sl = schedule(r);
    expect(finishedShots(r, sl, totalMs(sl))).toEqual([3]);
    const both = schedule(toolRuns(o, { only: [1, 3] }));
    expect(both.slice(0, 2).map((x) => x.startMs)).toEqual([0, 0]);
  });
  it("an edit-only run (footage instead / cut) generates nothing", () => {
    expect(toolRuns(o, { editOnly: true }).map((x) => x.id)).toEqual(["ff-cut", "ff-assemble", "ff-subs", "ff-mix", "check"]);
  });
  it("a run with a failure ends once every generation has settled, before the edit", () => {
    /* gens 1500–5500 / 1500–6500,没有台词 → 没有配音行 */
    expect(settleMs(slots)).toBe(6500);
    expect(runEndMs(slots, fail)).toBe(6500);
    expect(runEndMs(slots)).toBe(totalMs(slots));
  });
  it("the voiceover is one Generate audio row with the whole script; it is kept on stop once done", () => {
    const withVo = { ...o, shots: o.shots.map((s, i) => ({ ...s, subtitle: { text: `Line ${i + 1}`, source: "authored" as const } })) };
    const r = toolRuns(withVo);
    expect(r.find((x) => x.id === "audio")?.detail).toBe("Line 1\nLine 2\nLine 3");
    const sl = schedule(r);
    const audio = sl.find((x) => x.id === "audio")!;
    expect(settleMs(sl)).toBe(audio.endMs);
    /* 40 + 2 × 50 + 3 × 5 = 155;配音做完、两镜做完 → 只退基础费 40 */
    expect(stopRefund({ outline: withVo, charged: 155, refunded: 0, runs: r, slots: sl, atMs: audio.endMs + 100 })).toBe(40);
    expect(stopRefund({ outline: withVo, charged: 155, refunded: 0, runs: r, slots: sl, atMs: audio.startMs })).toBe(55);
  });
});
