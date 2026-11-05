import { describe, it, expect } from "vitest";
import type { Asset } from "../../src/app/prototypes/(v1.12)/video-gen-modes/app/assets";
import { initialComposer, selectModel, selectMode, type ComposerState } from "../../src/app/prototypes/(v1.12)/video-gen-modes/app/state";
import { validate } from "../../src/app/prototypes/(v1.12)/video-gen-modes/app/validate";

const img = (n: number): Asset => ({ id: `i${n}`, kind: "image", url: `/i${n}.png`, name: `i${n}.png`, source: "upload" });
const aud = (n: number, secs = 5): Asset => ({ id: `a${n}`, kind: "audio", url: `/a${n}.mp3`, name: `a${n}.mp3`, secs, source: "upload" });
const vid = (n: number, secs: number, source: Asset["source"] = "upload"): Asset => ({ id: `v${n}`, kind: "video", url: `/v${n}.mp4`, name: `v${n}.mp4`, secs, source });
const slots = (s: ComposerState, patch: Partial<ComposerState["slots"]>): ComposerState => ({ ...s, slots: { ...s.slots, ...patch } });
const refs = (s: ComposerState, r: Asset[]) => slots(s, { omni: { ...s.slots.omni, refs: r } });

describe("validate", () => {
  it("passes text-only generation", () => {
    expect(validate(initialComposer("seedance-2.5")).ok).toBe(true);
  });

  it("flags files over the new model's limit after switching, without deleting them", () => {
    const s = refs(initialComposer("seedance-2.5"), Array.from({ length: 12 }, (_, i) => img(i)));
    const after = selectModel(s, "seedance-2.0").state;
    const v = validate(after);
    expect(v.ok).toBe(false);
    expect(v.overIds).toEqual(["i9", "i10", "i11"]);
    expect(v.issues[0].message).toBe("Seedance 2.0 takes up to 9 images. Remove 3 to continue.");
    expect(after.slots.omni.refs).toHaveLength(12);
  });

  it("checks the combined MiniMax file cap", () => {
    const r = [...Array.from({ length: 9 }, (_, i) => img(i)), vid(1, 3), vid(2, 3), vid(3, 3), aud(1)];
    const v = validate(refs(selectMode(initialComposer("h3"), "omni"), r));
    expect(v.ok).toBe(false);
    expect(v.overIds).toEqual(["a1"]);
  });

  it("rejects audio-only references where the model needs a picture", () => {
    expect(validate(refs(initialComposer("seedance-2.0"), [aud(1)])).issues[0].message).toBe(
      "Add at least one image or video — Seedance 2.0 can't use audio on its own.",
    );
    expect(validate(refs(initialComposer("seedance-2.5"), [aud(1)])).ok).toBe(true);
  });

  it("checks reference video total length", () => {
    const v = validate(refs(initialComposer("seedance-2.0"), [vid(1, 10), vid(2, 8)]));
    expect(v.ok).toBe(false);
  });

  it("needs a start frame only where the API does", () => {
    const wan = slots(selectMode(initialComposer("wan-3.0"), "frames"), { frames: { end: img(1), elements: [] } });
    expect(validate(wan).issues[0].message).toBe("Add a start frame — Wan 3.0 can't start from an end frame only.");
    const h3 = slots(selectMode(initialComposer("h3"), "frames"), { frames: { end: img(1), elements: [] } });
    expect(validate(h3).ok).toBe(true);
  });

  it("needs the H3 Max middle frame strictly inside the clip", () => {
    const base = { ...selectMode(initialComposer("h3-max"), "keyframes"), secs: 6, resolution: "768p" };
    const kf = (t: number) => slots(base, { keyframes: { start: img(1), middle: [img(2)], end: img(3), middleTime: t, refs: [] } });
    expect(validate(kf(0)).ok).toBe(false);
    expect(validate(kf(6)).ok).toBe(false);
    expect(validate(kf(3)).ok).toBe(true);
  });

  it("caps Kling 4.0 keyframes at 8", () => {
    const s = slots(selectMode(initialComposer("kling-4.0"), "keyframes"), {
      keyframes: { start: img(0), middle: Array.from({ length: 9 }, (_, i) => img(i + 1)), end: img(20), refs: [] },
    });
    expect(validate(s).overIds).toEqual(["i9"]);
  });

  it("blocks extending uploaded videos in the UK on Omni Flash only", () => {
    const ext = (source: Asset["source"]) =>
      slots(selectMode(initialComposer("omni-flash"), "extend"), { extend: { source: vid(1, 6, source), direction: "forward" } });
    expect(validate(ext("upload"), { inUK: true }).ok).toBe(false);
    expect(validate(ext("generated"), { inUK: true }).ok).toBe(true);
    expect(validate(ext("upload")).ok).toBe(true);
  });

  it("checks the source length for edit", () => {
    const s = slots(selectMode(initialComposer("omni-flash"), "edit"), { edit: { source: vid(1, 12), refs: [] } });
    expect(validate(s).issues[0].message).toBe("Gemini Omni Flash can edit videos up to 10s.");
    const empty = selectMode(initialComposer("omni-flash"), "edit");
    expect(validate(empty).issues[0].message).toBe("Add a video to edit.");
  });

  it("checks the multi-shot total against the model", () => {
    const shots = [1, 2, 3].map((i) => ({ id: `s${i}`, prompt: "x", secs: 6 }));
    const k3 = { ...initialComposer("kling-3.0"), multiShot: { on: true, smart: false, shots } };
    expect(validate(k3).issues[0].message).toBe("Shots add up to 18s. Kling 3.0 supports 3–15s.");
    const k4 = { ...initialComposer("kling-4.0"), multiShot: { on: true, smart: false, shots } };
    expect(validate(k4).ok).toBe(true);
  });

});

describe("review fixes: validate", () => {
  it("does not block a mode that can't show multi-shot", () => {
    const shots = [1, 2, 3].map((i) => ({ id: `s${i}`, prompt: "x", secs: 6 }));
    const s = { ...selectMode(initialComposer("kling-4.0"), "edit"), multiShot: { on: true, smart: false, shots } };
    expect(validate(s).issues.map((i) => i.code)).not.toContain("shots-total");
  });
  it("flags elements, voices and soundtrack the new model can't use", () => {
    const k4 = initialComposer("kling-4.0");
    const withEl = slots(k4, { omni: { refs: [], elements: [{ id: "e1", front: img(1), angles: [] }], voices: ["Warm female (EN)"] } });
    const v = validate(selectModel(withEl, "seedance-2.5").state);
    expect(v.ok).toBe(false);
    expect(v.overIds).toContain("e1");
    expect(v.issues.map((i) => i.code)).toContain("unsupported");
    const h3 = slots(selectMode(initialComposer("h3"), "frames"), { frames: { start: img(1), elements: [], soundtrack: aud(1) } });
    const v2 = validate(selectModel(h3, "seedance-2.5").state);
    expect(v2.overIds).toContain("a1");
  });
});

describe("kling 3.0 on kie", () => {
  it("caps shots at 5 and 12s each, and allows only a start frame with multi-shot", () => {
    const shots = Array.from({ length: 6 }, (_, i) => ({ id: `s${i}`, prompt: "x", secs: 2 }));
    const s = { ...initialComposer("kling-3.0"), multiShot: { on: true, smart: false, shots } };
    expect(validate(s).issues.map((i) => i.message)).toContain("Kling 3.0 takes up to 5 shots.");
    const long = { ...s, multiShot: { on: true, smart: false, shots: [{ id: "a", prompt: "x", secs: 13 }] } };
    expect(validate(long).issues.map((i) => i.message)).toContain("Each shot can be 1–12s.");
    const withEnd = slots({ ...s, multiShot: { on: true, smart: false, shots: shots.slice(0, 2) } }, { frames: { start: img(1), end: img(2), elements: [] } });
    expect(validate(withEnd).issues.map((i) => i.message)).toContain("Multi-shot on Kling 3.0 uses the start frame only. Remove the end frame.");
  });
  it("caps elements at 3 and needs at least 2 images each", () => {
    const el = (n: number, angles: number) => ({ id: `e${n}`, front: img(n), angles: Array.from({ length: angles }, (_, i) => img(100 + n * 10 + i)) });
    const s = slots(initialComposer("kling-3.0"), { frames: { start: img(0), elements: [el(1, 1), el(2, 1), el(3, 1), el(4, 1)] } });
    expect(validate(s).overIds).toContain("e4");
    const thin = slots(initialComposer("kling-3.0"), { frames: { start: img(0), elements: [el(1, 0)] } });
    expect(validate(thin).issues.map((i) => i.message)).toContain("Each Kling 3.0 element needs 2–4 images.");
  });
});
