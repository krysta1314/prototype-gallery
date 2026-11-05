import { describe, it, expect } from "vitest";
import type { Asset } from "../../src/app/prototypes/(v1.12)/video-gen-modes/app/assets";
import { supports } from "../../src/app/prototypes/(v1.12)/video-gen-modes/app/capabilities";
import { autoPlace, effectiveSecs, initialComposer, selectMode, selectModel, toolSlot, type ComposerState } from "../../src/app/prototypes/(v1.12)/video-gen-modes/app/state";
import { validate } from "../../src/app/prototypes/(v1.12)/video-gen-modes/app/validate";
import { estimateCredits } from "../../src/app/prototypes/(v1.12)/video-gen-modes/app/credits";
import { ENTRY_OF } from "../../src/app/prototypes/(v1.12)/video-gen-modes/app/entries";

const img = (n: number): Asset => ({ id: `i${n}`, kind: "image", url: `/i${n}.png`, name: `i${n}.png`, source: "upload" });
const vid = (n: number, secs: number): Asset => ({ id: `v${n}`, kind: "video", url: `/v${n}.mp4`, name: `v${n}.mp4`, secs, source: "upload" });

const h3 = (mode: Parameters<typeof selectMode>[1]): ComposerState => selectMode(selectModel(initialComposer(), "h3-max").state, mode);

describe("generation tool modes (Camera Control, Style Presets)", () => {
  it("places the start frame and keeps H3 Max's camera / style modes only", () => {
    const s = autoPlace(h3("camera"), [img(1)]);
    expect(toolSlot(s, "camera").files.image?.map((a) => a.id)).toEqual(["i1"]);
    expect(validate(s).ok).toBe(true);
    for (const m of ["avatar", "lipsync", "reframe", "relight", "recast", "insert", "render3d", "motion"]) expect(supports("h3-max", m as never)).toBe(false);
  });

  it("uses the mode's own resolutions (Style Presets is 768p only)", () => {
    expect(h3("style").resolution).toBe("768p");
  });
});

describe("sidebar entries", () => {
  it("point at a model that really has that mode", () => {
    for (const [label, e] of Object.entries(ENTRY_OF)) expect(supports(e.model, e.mode), label).toBe(true);
  });
});

describe("frames without an end frame", () => {
  it("flags an end frame on Grok Imagine Video 1.5", () => {
    const s = selectMode(selectModel(initialComposer(), "grok-1.5").state, "frames");
    const withEnd = { ...s, slots: { ...s.slots, frames: { ...s.slots.frames, start: img(1), end: img(2) } } };
    expect(validate(withEnd).issues.map((i) => i.code)).toContain("no-end");
  });
});

describe("per-mode resolution rules", () => {
  it("keeps Grok 1.5 reference-to-video at 480p / 720p", () => {
    const g = { ...selectModel(initialComposer(), "grok-1.5").state, resolution: "1080p" };
    expect(selectMode(g, "omni").resolution).toBe("720p");
  });
  it("blocks 360p with an end frame on Vidu", () => {
    const v = { ...selectMode(selectModel(initialComposer(), "vidu-q3").state, "frames"), resolution: "360p" };
    const withEnd = { ...v, slots: { ...v.slots, frames: { ...v.slots.frames, start: img(1), end: img(2) } } };
    expect(validate(withEnd).issues.map((i) => i.code)).toContain("end-res");
    expect(validate({ ...withEnd, resolution: "720p" }).ok).toBe(true);
  });
});

describe("review fixes (merge round)", () => {
  it("places agent-plan files into tool modes", async () => {
    const { replan } = await import("../../src/app/prototypes/(v1.12)/video-gen-modes/app/agent");
    const cam = replan(initialComposer(), { model: "h3-max", mode: "camera" }, [img(1)]);
    expect(toolSlot(cam, "camera").files.image?.[0]?.id).toBe("i1");
    expect(cam.slots.omni.refs).toHaveLength(0);
  });

  it("flags reference images the new model can't use instead of hiding them", () => {
    const k = selectMode(selectModel(initialComposer(), "kling-4.0").state, "keyframes");
    const withRefs = { ...k, slots: { ...k.slots, keyframes: { ...k.slots.keyframes, start: img(1), end: img(2), refs: [img(3)] } } };
    const flux = selectModel(withRefs, "flux-3-video").state;
    expect(validate(flux).overIds).toContain("i3");
  });

});

// 2026-11-05 按 fal API 核对后补的额外参数(extras.ts)
import { extrasFor, extraValue, extraApiValue, setExtra, smartDuration } from "../../src/app/prototypes/(v1.12)/video-gen-modes/app/extras";
import { modeResolutions } from "../../src/app/prototypes/(v1.12)/video-gen-modes/app/state";

describe("model extras from the fal API", () => {
  it("Wan forces Thinking on when the video is based on a web page or document", () => {
    const w = selectModel(initialComposer(), "wan-3.0").state;
    const thinking = extrasFor(w).find((p) => p.id === "thinking")!;
    expect(extraValue(w, thinking)).toBe(false);
    const withDoc = { ...w, slots: { ...w.slots, omni: { ...w.slots.omni, source: { kind: "doc" as const, value: "brief.pdf" } } } };
    expect(extraValue(withDoc, thinking)).toBe(true);
    expect(thinking.force?.(withDoc)?.reason).toMatch(/web page or document/);
    // 用户手动关掉也没用
    expect(extraValue({ ...withDoc, ...setExtra(withDoc, "thinking", false) }, thinking)).toBe(true);
  });

  it("maps MiniMax Prompt Enhance to prompt_expansion_mode values", () => {
    const h = selectModel(initialComposer(), "h3-max").state;
    const p = extrasFor(h).find((x) => x.id === "enhanceMode")!;
    expect(extraApiValue(h, p)).toBe("balanced");
    expect(extraApiValue({ ...h, ...setExtra(h, "enhanceMode", "Off") }, p)).toBe("disabled");
  });

  it("shows extend-only options only in Extend Video, and Smart Duration fixes the length", () => {
    const h = selectModel(initialComposer(), "h3-max").state;
    expect(extrasFor(h).map((p) => p.id)).not.toContain("extendOutput");
    const ext = selectMode(h, "extend");
    expect(extrasFor(ext).map((p) => p.id)).toContain("extendOutput");
    expect(modeResolutions("h3-max", "extend")).toContain("2K");
    const w = selectModel(initialComposer(), "wan-3.0").state;
    expect(smartDuration(w)).toBe(false);
    expect(smartDuration({ ...w, ...setExtra(w, "autoLength", true) })).toBe(true);
  });

  it("keeps extras per model", () => {
    const w = selectModel(initialComposer(), "wan-3.0").state;
    const on = { ...w, ...setExtra(w, "autoLength", true) };
    const prime = selectModel(on, "wan-3.0-prime").state;
    expect(smartDuration(prime)).toBe(false);
  });
});

// 2026-11-05 第二轮：非 fal 模型(BytePlus Seedance、Google Gemini Omni Flash、kie Kling 3.0)按官方文档核对
import { lockedResolution } from "../../src/app/prototypes/(v1.12)/video-gen-modes/app/extras";
import { modelCaps } from "../../src/app/prototypes/(v1.12)/video-gen-modes/app/capabilities";

describe("non-fal models against their official docs", () => {
  it("Seedance 2.5 image-to-video keeps the first frame's ratio; 2.0 lets you pick", () => {
    expect(modelCaps("seedance-2.5").frames?.ratioFromFrame).toBe(true);
    expect(modelCaps("seedance-2.0").frames?.ratioFromFrame).toBeFalsy();
    for (const k of ["kling-3.0", "vidu-q3", "grok-1.5", "kling-4.0", "h3-max"] as const) expect(modelCaps(k).frames?.ratioFromFrame).toBe(true);
    expect(modelCaps("wan-3.0").frames?.ratioFromFrame).toBeFalsy();
  });

  it("Seedance has no extra settings (Smart Duration / Draft First / File Format dropped in review)", () => {
    for (const k of ["seedance-2.5", "seedance-2.0", "seedance-2.0-fast", "seedance-2.0-mini"] as const) expect(extrasFor(initialComposer(k))).toEqual([]);
  });

  it("Gemini Omni Flash blocks editing uploaded videos in the UK, like extending", () => {
    expect(modelCaps("omni-flash").edit?.ukUploadBlocked).toBe(true);
    expect(modelCaps("omni-flash").extend?.ukUploadBlocked).toBe(true);
  });
});
