import { describe, it, expect } from "vitest";
import { followUp } from "../../src/app/prototypes/(v1.12)/video-gen-modes/app/followup";
import { initialComposer } from "../../src/app/prototypes/(v1.12)/video-gen-modes/app/state";
import { validate } from "../../src/app/prototypes/(v1.12)/video-gen-modes/app/validate";

const job = { id: "j", model: "omni-flash" as const, mode: "omni" as const, secs: 8, credits: 10, prompt: "x", status: "done" as const, progress: 100, url: "/r.mp4", poster: "/r.jpg" };

describe("followUp", () => {
  it("puts the generated video into Extend on the same model, marked as generated", () => {
    const s = followUp(initialComposer("seedance-2.5"), job, "extend");
    expect(s.model).toBe("omni-flash");
    expect(s.mode).toBe("extend");
    expect(s.slots.extend.source).toMatchObject({ kind: "video", url: "/r.mp4", secs: 8, source: "generated" });
    expect(validate(s, { inUK: true }).ok).toBe(true);
  });
  it("uses the last frame as the start frame", () => {
    const s = followUp(initialComposer(), { ...job, model: "kling-4.0" }, "lastFrame");
    expect(s.mode).toBe("frames");
    expect(s.slots.frames.start?.kind).toBe("image");
    expect(s.slots.frames.end).toBeUndefined();
  });
});

describe("review fixes: followUp", () => {
  it("keeps the prompt and the end frame when using the last frame", () => {
    const base = initialComposer("kling-4.0");
    const end = { id: "e", kind: "image" as const, url: "/e.png", name: "e.png", source: "upload" as const };
    const s0 = { ...base, prompt: "keep me", mode: "frames" as const, slots: { ...base.slots, frames: { ...base.slots.frames, end } } };
    const s = followUp(s0, { ...job, model: "kling-4.0" }, "lastFrame");
    expect(s.prompt).toBe("keep me");
    expect(s.slots.frames.end?.id).toBe("e");
  });
});
