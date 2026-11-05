import { describe, it, expect } from "vitest";
import { arrange } from "../../src/app/prototypes/(v1.12)/hybrid-reel/canvas/project";
import { CANVAS_KEY, parseCanvasPayload, upscaleCanvas } from "../../src/app/prototypes/(v1.12)/ai-tools/app/canvasProject";
import { FIXTURE_SAMPLE } from "../../src/app/prototypes/(v1.12)/ai-tools/app/fixture";

const a = { url: "https://x/a.png", width: 1536, height: 1024, name: "a.png" };
const b = { url: "https://x/b.png", width: 1024, height: 1536, name: "b.png" };

describe("upscaleCanvas", () => {
  it("builds one ready image node per source with real aspect", () => {
    const { project, handoff } = upscaleCanvas([a, b]);
    expect(project.assets).toHaveLength(2);
    for (const n of project.assets) {
      expect(n).toMatchObject({ kind: "image", origin: "upload", status: "ready" });
    }
    expect(project.assets[0].aspect).toBeCloseTo(1.5);
    expect(project.assets[1].aspect).toBeCloseTo(2 / 3);
    expect(project.assets.map((n) => n.url)).toEqual([a.url, b.url]);
    /* 真实像素直接带进节点,不用等 <img> 加载 */
    expect(project.assets.map((n) => n.pixels)).toEqual([
      { width: 1536, height: 1024 },
      { width: 1024, height: 1536 },
    ]);
    expect(new Set(project.assets.map((n) => n.id)).size).toBe(2);
    expect(project.clips).toEqual([]);
    expect(handoff.outline.shots).toEqual([]);
  });

  it("project passes arrange without throwing", () => {
    const { project } = upscaleCanvas([a, b, FIXTURE_SAMPLE.source]);
    const p = arrange(project);
    expect(p.assets).toHaveLength(3);
    for (const n of p.assets) {
      expect(Number.isFinite(n.x)).toBe(true);
      expect(Number.isFinite(n.y)).toBe(true);
    }
  });

  it("carries the balance into the handoff", () => {
    expect(upscaleCanvas([a], 1234).handoff.credits).toBe(1234);
    expect(upscaleCanvas([a]).handoff.credits).toBeUndefined();
  });
});

describe("parseCanvasPayload", () => {
  it("reads images + credits, tolerates bare arrays and junk", () => {
    expect(CANVAS_KEY).toBe("upscale-image:canvas");
    expect(parseCanvasPayload(JSON.stringify({ images: [a], credits: 50 }))).toEqual({ images: [a], credits: 50 });
    expect(parseCanvasPayload(JSON.stringify([a]))).toEqual({ images: [a] });
    expect(parseCanvasPayload(null)).toBeNull();
    expect(parseCanvasPayload("{bad")).toBeNull();
    expect(parseCanvasPayload(JSON.stringify({ images: [{ url: "x" }] }))).toBeNull();
    expect(parseCanvasPayload(JSON.stringify({ images: [] }))).toBeNull();
  });
});
