import { describe, it, expect } from "vitest";
import type { Asset } from "../../src/app/prototypes/(v1.12)/video-gen-modes/app/assets";
import { initialComposer, selectModel, selectMode, effectiveSecs, type ComposerState } from "../../src/app/prototypes/(v1.12)/video-gen-modes/app/state";
import { inferMode, pickModel, resultActions } from "../../src/app/prototypes/(v1.12)/video-gen-modes/app/infer";

const img = (n: number): Asset => ({ id: `i${n}`, kind: "image", url: `/i${n}.png`, name: `i${n}.png`, source: "upload" });
const vid = (n: number, secs: number, source: Asset["source"] = "upload"): Asset => ({ id: `v${n}`, kind: "video", url: `/v${n}.mp4`, name: `v${n}.mp4`, secs, source });

const withRefs = (s: ComposerState, refs: Asset[]): ComposerState => ({ ...s, slots: { ...s.slots, omni: { ...s.slots.omni, refs } } });

describe("selectModel", () => {
  it("falls back to the new model's default mode and keeps the old mode's files", () => {
    const s = withRefs(initialComposer("kling-4.0"), [1, 2, 3, 4, 5].map(img));
    const r = selectModel(s, "kling-3.0");
    expect(r.state.mode).toBe("frames");
    expect(r.switchedFrom).toBe("omni");
    expect(r.state.slots.omni.refs).toHaveLength(5);
    const back = selectMode(selectModel(r.state, "kling-4.0").state, "omni");
    expect(back.slots.omni.refs).toHaveLength(5);
  });

  it("keeps the mode when the new model supports it", () => {
    const r = selectModel(initialComposer("seedance-2.5"), "wan-3.0");
    expect(r.state.mode).toBe("omni");
    expect(r.switchedFrom).toBeUndefined();
  });

  it("clamps duration and ratio into the new model's range", () => {
    const s = { ...initialComposer("seedance-2.5"), secs: 30, ratio: "21:9" };
    expect(selectModel(s, "seedance-2.0").state.secs).toBe(15);
    expect(selectModel(s, "omni-flash").state.ratio).toBe("16:9");
  });

  it("snaps the duration to Omni Flash's 4 / 6 / 8 / 10s steps", () => {
    expect(selectModel({ ...initialComposer("seedance-2.5"), secs: 5 }, "omni-flash").state.secs).toBe(6);
    expect(selectModel({ ...initialComposer("seedance-2.5"), secs: 30 }, "omni-flash").state.secs).toBe(10);
    expect(selectModel({ ...initialComposer("seedance-2.5"), secs: 4 }, "omni-flash").state.secs).toBe(4);
  });

  it("keeps the closest resolution when H3 Max keyframes only allow 480p / 768p", () => {
    const s = { ...initialComposer("h3-max"), resolution: "1080p" };
    expect(selectMode(s, "keyframes").resolution).toBe("768p");
  });

  it("turns multi-shot off for models without it", () => {
    const s = { ...initialComposer("kling-4.0"), multiShot: { on: true, smart: false, shots: [] } };
    expect(selectModel(s, "seedance-2.5").state.multiShot.on).toBe(false);
  });
});

describe("effectiveSecs", () => {
  it("matches the source video in edit mode", () => {
    const s = selectMode(initialComposer("seedance-2.5"), "edit");
    const e = { ...s, slots: { ...s.slots, edit: { source: vid(1, 12), refs: [] } } };
    expect(effectiveSecs(e)).toBe(12);
  });
  it("sums the shots when multi-shot is on", () => {
    const s = { ...initialComposer("kling-4.0"), multiShot: { on: true, smart: false, shots: [{ id: "a", prompt: "", secs: 3 }, { id: "b", prompt: "", secs: 4 }] } };
    expect(effectiveSecs(s)).toBe(7);
  });
});

describe("inferMode / pickModel / resultActions", () => {
  it("reads the mode from files and wording", () => {
    expect(inferMode("from day to night", [img(1), img(2)]).mode).toBe("frames");
    expect(inferMode("remove the logo", [vid(1, 8)]).mode).toBe("edit");
    expect(inferMode("continue the scene", [vid(1, 8)]).mode).toBe("extend");
    expect(inferMode("animate this photo", [img(1)]).mode).toBe("frames");
    expect(inferMode("a fun ad", [img(1), img(2), img(3)]).mode).toBe("omni");
  });
  it("picks Seedance 2.5 unless it can't do the mode", () => {
    expect(pickModel("frames")).toBe("seedance-2.5");
    expect(pickModel("keyframes")).toBe("kling-4.0");
  });
  it("offers follow-ups only the generating model supports", () => {
    expect(resultActions("kling-4.0")).toEqual(["edit", "lastFrame"]);
    expect(resultActions("seedance-2.5")).toEqual(["extend", "edit", "lastFrame"]);
    expect(resultActions("wan-3.0")).toEqual(["lastFrame"]);
  });
});

describe("review fixes: state", () => {
  it("restores the original mode when switching back to a model that supports it", () => {
    const s = withRefs(initialComposer("seedance-2.5"), [1, 2, 3, 4, 5].map(img));
    const k3 = selectModel(s, "kling-3.0").state;
    const back = selectModel(k3, "seedance-2.5");
    expect(back.state.mode).toBe("omni");
    expect(back.restored).toBe("omni");
    expect(back.state.slots.omni.refs).toHaveLength(5);
  });
  it("forgets the fallback once the user picks a mode", () => {
    const k3 = selectMode(selectModel(initialComposer("seedance-2.5"), "kling-4.0").state, "keyframes");
    expect(selectModel(k3, "seedance-2.5").state.mode).toBe("omni");
    expect(selectModel(k3, "seedance-2.5").restored).toBeUndefined();
  });
  it("ignores multi-shot outside omni / frames / keyframes", () => {
    const s = { ...selectMode(initialComposer("kling-4.0"), "edit"), secs: 5, multiShot: { on: true, smart: false, shots: [{ id: "a", prompt: "", secs: 9 }, { id: "b", prompt: "", secs: 9 }] } };
    expect(effectiveSecs(s)).toBe(5);
  });
});

describe("autoPlace (the + button)", () => {
  it("fills references in Omni Reference", async () => {
    const { autoPlace } = await import("../../src/app/prototypes/(v1.12)/video-gen-modes/app/state");
    const s = autoPlace(initialComposer("seedance-2.5"), [img(1), img(2)]);
    expect(s.slots.omni.refs.map((a) => a.id)).toEqual(["i1", "i2"]);
  });
  it("fills start then end in First & Last Frame and ignores non-images", async () => {
    const { autoPlace } = await import("../../src/app/prototypes/(v1.12)/video-gen-modes/app/state");
    const s0 = selectMode(initialComposer("seedance-2.5"), "frames");
    const s = autoPlace(s0, [vid(1, 5), img(1), img(2), img(3)]);
    expect(s.slots.frames.start?.id).toBe("i1");
    expect(s.slots.frames.end?.id).toBe("i2");
  });
  it("puts the first video into Extend", async () => {
    const { autoPlace } = await import("../../src/app/prototypes/(v1.12)/video-gen-modes/app/state");
    expect(autoPlace(selectMode(initialComposer("seedance-2.5"), "extend"), [img(1), vid(1, 5)]).slots.extend.source?.id).toBe("v1");
  });
  it("starts with one output and audio on", () => {
    expect(initialComposer().count).toBe(1);
    expect(initialComposer().audio).toBe(true);
  });
});
