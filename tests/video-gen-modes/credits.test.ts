import { describe, it, expect } from "vitest";
import type { Asset } from "../../src/app/prototypes/(v1.12)/video-gen-modes/app/assets";
import { initialComposer, selectMode } from "../../src/app/prototypes/(v1.12)/video-gen-modes/app/state";
import { dependsOnVideo, estimateCredits } from "../../src/app/prototypes/(v1.12)/video-gen-modes/app/credits";

const vid = (secs: number): Asset => ({ id: `v${secs}`, kind: "video", url: "/v.mp4", name: "v.mp4", secs, source: "upload" });
const img: Asset = { id: "i1", kind: "image", url: "/i.png", name: "i.png", source: "upload" };

describe("estimateCredits with reference videos", () => {
  it("shows 0 in Edit / Extend before a video is uploaded", () => {
    expect(estimateCredits(selectMode(initialComposer("seedance-2.5"), "edit"))).toBe(0);
    expect(estimateCredits(selectMode(initialComposer("seedance-2.5"), "extend"))).toBe(0);
  });

  it("grows with the uploaded video's length", () => {
    const s = selectMode(initialComposer("seedance-2.5"), "edit");
    const short = estimateCredits({ ...s, slots: { ...s.slots, edit: { source: vid(4), refs: [] } } });
    const long = estimateCredits({ ...s, slots: { ...s.slots, edit: { source: vid(12), refs: [] } } });
    expect(short).toBeGreaterThan(0);
    expect(long).toBeCloseTo(short * 3, -1);
  });

  it("counts Extend input video plus the chosen extension", () => {
    const s = { ...selectMode(initialComposer("seedance-2.5"), "extend"), secs: 5 };
    const a = estimateCredits({ ...s, slots: { ...s.slots, extend: { ...s.slots.extend, source: vid(5) } } });
    const b = estimateCredits({ ...s, slots: { ...s.slots, extend: { ...s.slots.extend, source: vid(10) } } });
    expect(b).toBeGreaterThan(a);
  });

  it("only flags omni as video-priced when a reference video is present", () => {
    const s = initialComposer("seedance-2.5");
    expect(dependsOnVideo(s)).toBe(false);
    expect(dependsOnVideo({ ...s, slots: { ...s.slots, omni: { ...s.slots.omni, refs: [img] } } })).toBe(false);
    expect(dependsOnVideo({ ...s, slots: { ...s.slots, omni: { ...s.slots.omni, refs: [vid(5)] } } })).toBe(true);
    expect(estimateCredits(s)).toBeGreaterThan(0);
  });
});
