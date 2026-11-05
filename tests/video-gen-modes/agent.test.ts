import { describe, it, expect } from "vitest";
import type { Asset } from "../../src/app/prototypes/(v1.12)/video-gen-modes/app/assets";
import { planFromChat } from "../../src/app/prototypes/(v1.12)/video-gen-modes/app/agent";

const img = (n: number): Asset => ({ id: `i${n}`, kind: "image", url: `/i${n}.png`, name: `i${n}.png`, source: "upload" });
const vid = (n: number): Asset => ({ id: `v${n}`, kind: "video", url: `/v${n}.mp4`, name: `v${n}.mp4`, secs: 6, source: "upload" });

describe("planFromChat", () => {
  it("puts two images into start and end frames on Seedance 2.5", () => {
    const p = planFromChat("go from day to night", [img(1), img(2)]);
    expect(p.state.model).toBe("seedance-2.5");
    expect(p.state.mode).toBe("frames");
    expect(p.state.slots.frames.start?.id).toBe("i1");
    expect(p.state.slots.frames.end?.id).toBe("i2");
    expect(p.state.prompt).toBe("go from day to night");
  });
  it("puts the video into the edit slot", () => {
    const p = planFromChat("remove the logo", [vid(1), img(1)]);
    expect(p.state.mode).toBe("edit");
    expect(p.state.slots.edit.source?.id).toBe("v1");
    expect(p.state.slots.edit.refs.map((a) => a.id)).toEqual(["i1"]);
  });
  it("uses everything as references otherwise", () => {
    const p = planFromChat("a fun ad", [img(1), vid(1)]);
    expect(p.state.mode).toBe("omni");
    expect(p.state.slots.omni.refs).toHaveLength(2);
    expect(p.reason.length).toBeGreaterThan(10);
  });
});

describe("review fixes: agent change", () => {
  it("re-places the chat files when the user changes the mode", async () => {
    const { replan } = await import("../../src/app/prototypes/(v1.12)/video-gen-modes/app/agent");
    const p = planFromChat("a fun ad", [img(1), img(2)]);
    const s = replan(p.state, { mode: "frames" }, [img(1), img(2)]);
    expect(s.mode).toBe("frames");
    expect(s.slots.frames.start?.id).toBe("i1");
    expect(s.slots.frames.end?.id).toBe("i2");
  });
});
