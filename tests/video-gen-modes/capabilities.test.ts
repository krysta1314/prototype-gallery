import { describe, it, expect } from "vitest";
import { MODEL_GROUPS, MODEL_COMPANY, MODELS, modelCaps, supports, MODE_LABEL } from "../../src/app/prototypes/(v1.12)/video-gen-modes/app/capabilities";
import { isToolMode, toolSpec } from "../../src/app/prototypes/(v1.12)/video-gen-modes/app/tools";

describe("capabilities", () => {
  it("lists the 18 Video Gen models grouped by family", () => {
    const keys = MODELS.map((m) => m.key);
    expect(keys).toEqual([
      "seedance-2.5", "seedance-2.0-mini", "seedance-2.0-fast", "seedance-2.0",
      "kling-4.0", "kling-3.0", "kling-3.0-omni",
      "wan-3.0", "wan-3.0-prime", "omni-flash-1.2", "omni-flash",
      "h3-max", "h3-max-turbo", "h3",
      "vidu-q3", "grok-1.5", "flux-3-video", "flux-3-max-video",
    ]);
    for (const m of MODELS) expect(m.modes.length).toBeGreaterThan(0);
  });

  it("knows which model supports which mode", () => {
    expect(supports("kling-3.0", "omni")).toBe(false);
    expect(supports("kling-4.0", "keyframes")).toBe(true);
    expect(supports("h3-max", "extend")).toBe(true);
    expect(supports("wan-3.0", "edit")).toBe(false);
    expect(supports("omni-flash", "edit")).toBe(true);
  });

  it("carries the omni reference limits from the APIs", () => {
    expect(modelCaps("seedance-2.0").omni).toMatchObject({ images: 9, videos: 3, audios: 3, audioOnly: false });
    expect(modelCaps("seedance-2.5").omni).toMatchObject({ images: 30, videos: 10, audios: 10, audioOnly: true });
    expect(modelCaps("omni-flash").omni?.audios).toBe(0);
    expect(modelCaps("h3").omni?.total).toBe(12);
    expect(modelCaps("kling-4.0").omni).toMatchObject({ images: 10, videos: 5, audios: 0, elements: 7, voices: 3 });
  });

  it("marks which models need a start frame", () => {
    for (const k of ["seedance-2.5", "seedance-2.0", "seedance-2.0-fast", "seedance-2.0-mini", "kling-3.0", "wan-3.0", "omni-flash"] as const) {
      expect(modelCaps(k).frames?.startRequired).toBe(true);
    }
    for (const k of ["kling-4.0", "h3", "h3-max"] as const) {
      expect(modelCaps(k).frames?.startRequired).toBe(false);
    }
  });

  it("has a config block for every mode a model lists", () => {
    for (const m of MODELS) {
      for (const mode of m.modes) {
        if (isToolMode(mode)) expect(toolSpec(m.key, mode), `${m.key}.${mode}`).toBeTruthy();
        else expect(m[mode], `${m.key}.${mode}`).toBeTruthy();
      }
    }
  });

  it("labels every mode in English", () => {
    expect(MODE_LABEL.frames).toBe("First & Last Frame");
    expect(MODE_LABEL.omni).toBe("Omni Reference");
  });

  it("carries Kling 3.0 on kie and the Seedance 2.0 tiers", () => {
    const k3 = modelCaps("kling-3.0");
    expect(k3.vendor).toBe("kie");
    expect(k3.resolutions).toEqual(["720p", "1080p", "4K"]);
    expect(k3.multiShot).toMatchObject({ shotMax: 12, totalMax: 15, maxShots: 5, firstFrameOnly: true });
    expect(k3.frames?.maxElements).toBe(3);
    expect(k3.audioToggle).toBe(true);
    expect(modelCaps("seedance-2.0-fast").resolutions).toEqual(["480p", "720p"]);
    expect(modelCaps("seedance-2.0-mini").modes).toEqual(modelCaps("seedance-2.0").modes);
    expect(modelCaps("kling-4.0").audioToggle).toBeFalsy();
  });

  it("keeps processing models out of Video Gen (they are tool pages now)", () => {
    const keys: string[] = MODELS.map((m) => m.key);
    for (const k of ["kling-3.0-motion", "kling-lipsync", "kling-avatar"]) expect(keys).not.toContain(k);
    expect(modelCaps("h3-max").modes).toEqual(["omni", "frames", "keyframes", "extend", "camera", "style"]);
  });

  it("groups the model list by company, each company once, every model listed", () => {
    expect(MODEL_GROUPS.map((g) => g.company)).toEqual(["ByteDance", "Kuaishou", "Alibaba", "Google", "MiniMax", "ShengShu", "xAI", "Black Forest Labs"]);
    expect(MODEL_GROUPS.flatMap((g) => g.models.map((m) => m.key)).sort()).toEqual(MODELS.map((m) => m.key).sort());
    for (const g of MODEL_GROUPS) for (const m of g.models) expect(MODEL_COMPANY[m.key]).toBe(g.company);
  });
});
