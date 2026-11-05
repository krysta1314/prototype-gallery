import { describe, it, expect } from "vitest";
import {
  BRUSH_CREDITS,
  BRUSH_MODELS,
  EMPTY_MASK,
  MIN_COVERAGE,
  brushBlocker,
  brushCredits,
  brushFileName,
  brushSize,
  hasPaint,
  maskReduce,
  toBrushInput,
  type Stroke,
} from "../../src/app/prototypes/(v1.12)/ai-tools/app/brush/logic";
import {
  CREDITS_PER_SAMPLE,
  framingWarning,
  garmentOf,
  toFashnInput,
  tryOnBlocker,
  tryOnCredits,
  wearerOf,
  type SlotImage,
} from "../../src/app/prototypes/(v1.12)/ai-tools/app/tryon/logic";
import {
  ANGLE_PRESETS,
  CREDITS_PER_ANGLE,
  FRONT,
  MAX_QUEUE,
  addToQueue,
  angleCredits,
  angleFileName,
  angleFromOrbit,
  angleLabel,
  anglesToRun,
  clampAngle,
  orbitPoint,
  presetOf,
  previewTransform,
  removeFromQueue,
  toAngleInput,
} from "../../src/app/prototypes/(v1.12)/ai-tools/app/angle/logic";

const paint = (x = 0.5): Stroke => ({ kind: "paint", size: 0.05, points: [[x, 0.5]] });
const erase: Stroke = { kind: "erase", size: 0.05, points: [[0.5, 0.5]] };

describe("brush mask history", () => {
  it("add / undo / redo", () => {
    let s = maskReduce(EMPTY_MASK, { type: "add", stroke: paint(0.1) });
    s = maskReduce(s, { type: "add", stroke: paint(0.2) });
    expect(s.strokes).toHaveLength(2);
    s = maskReduce(s, { type: "undo" });
    expect(s.strokes).toHaveLength(1);
    expect(s.future).toHaveLength(1);
    s = maskReduce(s, { type: "redo" });
    expect(s.strokes.map((x) => x.points[0][0])).toEqual([0.1, 0.2]);
    expect(s.future).toHaveLength(0);
  });

  it("a new stroke drops the redo stack; empty strokes are ignored", () => {
    let s = maskReduce(EMPTY_MASK, { type: "add", stroke: paint() });
    s = maskReduce(s, { type: "undo" });
    s = maskReduce(s, { type: "add", stroke: paint(0.3) });
    expect(s.future).toEqual([]);
    expect(maskReduce(s, { type: "add", stroke: { kind: "paint", size: 0.1, points: [] } })).toBe(s);
  });

  it("clear is undoable; undo/redo at the ends are no-ops", () => {
    let s = maskReduce(EMPTY_MASK, { type: "add", stroke: paint() });
    s = maskReduce(s, { type: "clear" });
    expect(s.strokes).toEqual([]);
    s = maskReduce(s, { type: "undo" });
    expect(s.strokes).toHaveLength(1);
    expect(maskReduce(EMPTY_MASK, { type: "undo" })).toBe(EMPTY_MASK);
    expect(maskReduce(EMPTY_MASK, { type: "redo" })).toBe(EMPTY_MASK);
    expect(maskReduce(EMPTY_MASK, { type: "clear" })).toBe(EMPTY_MASK);
    expect(maskReduce(s, { type: "reset" })).toEqual(EMPTY_MASK);
  });

  it("eraser-only strokes don't count as paint", () => {
    expect(hasPaint([erase])).toBe(false);
    expect(hasPaint([erase, paint()])).toBe(true);
  });

  it("brush size is clamped and proportional", () => {
    expect(brushSize(0)).toBe(brushSize(1));
    expect(brushSize(500)).toBe(brushSize(100));
    expect(brushSize(50)).toBeCloseTo(brushSize(100) / 2);
  });
});

describe("brush credits (mask → credits)", () => {
  it("no mask = no estimate", () => {
    expect(brushCredits("remove", 0, 1000, 1000)).toBeNull();
    expect(brushCredits("replace", MIN_COVERAGE / 2, 1000, 1000)).toBeNull();
    expect(brushCredits("remove", Number.NaN, 1000, 1000)).toBeNull();
  });
  it("flat per pass by mode; > 4 MP costs double", () => {
    expect(brushCredits("remove", 0.1, 1376, 768)).toBe(BRUSH_CREDITS.remove);
    expect(brushCredits("replace", 0.1, 1376, 768)).toBe(BRUSH_CREDITS.replace);
    expect(brushCredits("remove", 0.1, 3000, 2000)).toBe(BRUSH_CREDITS.remove * 2);
    /* 覆盖面积大小不影响价格 */
    expect(brushCredits("remove", 0.9, 1376, 768)).toBe(brushCredits("remove", 0.01, 1376, 768));
  });
  it("blocker messages", () => {
    expect(brushBlocker({ hasImage: false, coverage: 0, mode: "remove", prompt: "" })).toBe("Upload an image first.");
    expect(brushBlocker({ hasImage: true, coverage: 0, mode: "remove", prompt: "" })).toBe("Brush over what you want to remove.");
    expect(brushBlocker({ hasImage: true, coverage: 0, mode: "replace", prompt: "x" })).toBe("Brush over the area to replace.");
    expect(brushBlocker({ hasImage: true, coverage: 0.1, mode: "replace", prompt: "   " })).toBe("Describe what should go here.");
    expect(brushBlocker({ hasImage: true, coverage: 0.1, mode: "replace", prompt: "a plant" })).toBeNull();
    expect(brushBlocker({ hasImage: true, coverage: 0.1, mode: "remove", prompt: "" })).toBeNull();
  });
  it("fal input per mode: eraser takes no prompt", () => {
    expect(BRUSH_MODELS).toEqual({ remove: "fal-ai/bria/eraser", replace: "fal-ai/qwen-image-edit/inpaint" });
    expect(toBrushInput("remove", "i", "m", "ignored")).toEqual({ image_url: "i", mask_url: "m" });
    expect(toBrushInput("replace", "i", "m", " a plant ")).toEqual({ image_url: "i", mask_url: "m", prompt: "a plant" });
    expect(brushFileName("portrait.png", "remove")).toBe("portrait-removed.png");
    expect(brushFileName("a.b.jpg", "replace")).toBe("a.b-inpainted.png");
  });
});

const img = (url: string, framing: SlotImage["framing"] = "unknown"): SlotImage => ({ url, name: url, framing });

describe("virtual try-on mode validation", () => {
  it("names the missing photo per mode", () => {
    expect(tryOnBlocker("try-on", null, null)).toBe("Add a person and a garment.");
    expect(tryOnBlocker("try-on", img("p"), null)).toBe("Add a garment.");
    expect(tryOnBlocker("try-on", null, img("g"))).toBe("Add a person.");
    expect(tryOnBlocker("model-swap", img("s"), null)).toBe("Add a new model.");
    expect(tryOnBlocker("model-swap", null, img("n"))).toBe("Add a source photo.");
  });
  it("same photo twice is blocked; two photos pass", () => {
    expect(tryOnBlocker("try-on", img("x"), img("x"))).toBe("Use two different photos.");
    expect(tryOnBlocker("model-swap", img("x"), img("y"))).toBeNull();
  });
  it("bottoms / one-piece on an upper-body photo warns (not for tops or unknown framing)", () => {
    expect(framingWarning("tops", img("p", "upper"))).toBeNull();
    expect(framingWarning("bottoms", img("p", "upper"))).toMatch(/full-body photo for bottoms/);
    expect(framingWarning("one-pieces", img("p", "upper"))).toMatch(/one-pieces/);
    expect(framingWarning("bottoms", img("p", "unknown"))).toBeNull();
    expect(framingWarning("bottoms", null)).toBeNull();
  });
  it("credits per result, clamped to 1–4", () => {
    expect(tryOnCredits(2)).toBe(2 * CREDITS_PER_SAMPLE);
    expect(tryOnCredits(0)).toBe(CREDITS_PER_SAMPLE);
    expect(tryOnCredits(9)).toBe(4 * CREDITS_PER_SAMPLE);
  });
  it("FASHN input: try-on passes category + photo type; model swap uses source as garment with type model", () => {
    expect(toFashnInput("try-on", { a: "person", b: "garment", category: "bottoms", photoType: "flat-lay", samples: 3 })).toEqual({
      model_image: "person",
      garment_image: "garment",
      category: "bottoms",
      garment_photo_type: "flat-lay",
      num_samples: 3,
    });
    expect(toFashnInput("model-swap", { a: "source", b: "new", category: "tops", photoType: "flat-lay", samples: 7 })).toEqual({
      model_image: "new",
      garment_image: "source",
      category: "tops",
      garment_photo_type: "model",
      num_samples: 4,
    });
  });
  it("who wears it / where the garment comes from", () => {
    const a = img("a");
    const b = img("b");
    expect(wearerOf("try-on", a, b)).toBe(a);
    expect(garmentOf("try-on", a, b)).toBe(b);
    expect(wearerOf("model-swap", a, b)).toBe(b);
    expect(garmentOf("model-swap", a, b)).toBe(a);
  });
});

describe("photo angle", () => {
  it("clamps to the model's ranges and snaps to steps", () => {
    expect(clampAngle({ h: 200, v: -90, zoom: 5 })).toEqual({ h: 90, v: -30, zoom: 2 });
    expect(clampAngle({ h: -120, v: 99, zoom: 0.1 })).toEqual({ h: -90, v: 60, zoom: 0.5 });
    expect(clampAngle({ h: 33, v: 12, zoom: 1.26 })).toEqual({ h: 35, v: 10, zoom: 1.3 });
    expect(clampAngle({ h: Number.NaN, zoom: Number.NaN })).toEqual(FRONT);
    expect(clampAngle({})).toEqual(FRONT);
  });
  it("presets are valid angles and are recognised", () => {
    expect(ANGLE_PRESETS.map((p) => p.label)).toEqual(["Front", "¾ Left", "¾ Right", "Top-down", "Low angle"]);
    for (const p of ANGLE_PRESETS) {
      expect(clampAngle(p.angle)).toEqual(p.angle);
      expect(presetOf(p.angle)?.id).toBe(p.id);
      expect(angleLabel(p.angle)).toBe(p.label);
    }
    expect(presetOf({ h: 30, v: 0, zoom: 1 })).toBeNull();
    expect(angleLabel({ h: 30, v: -10, zoom: 1.2 })).toBe("H +30° · V −10° · 1.2×");
  });
  it("queue: max 4, no duplicates, remove by index", () => {
    let q = addToQueue([], { h: 0, v: 0, zoom: 1 }).queue;
    expect(addToQueue(q, FRONT).result).toBe("duplicate");
    for (const p of ANGLE_PRESETS.slice(1, 4)) q = addToQueue(q, p.angle).queue;
    expect(q).toHaveLength(MAX_QUEUE);
    const full = addToQueue(q, ANGLE_PRESETS[4].angle);
    expect(full.result).toBe("full");
    expect(full.queue).toBe(q);
    expect(removeFromQueue(q, 0)[0]).toEqual(ANGLE_PRESETS[1].angle);
  });
  it("runs the queue, or just the current angle when the queue is empty; credits per angle", () => {
    expect(anglesToRun([], { h: 47, v: 0, zoom: 1 })).toEqual([{ h: 45, v: 0, zoom: 1 }]);
    expect(anglesToRun([FRONT, ANGLE_PRESETS[1].angle], FRONT)).toHaveLength(2);
    expect(angleCredits(3)).toBe(3 * CREDITS_PER_ANGLE);
    expect(angleCredits(9)).toBe(MAX_QUEUE * CREDITS_PER_ANGLE);
  });
  it("fal input uses the numeric fields", () => {
    expect(toAngleInput("u", { h: 100, v: 20, zoom: 1.5 })).toEqual({ image_url: "u", horizontal_angle: 90, vertical_angle: 20, zoom: 1.5 });
    expect(angleFileName("portrait.png", { h: -45, v: 0, zoom: 1 })).toBe("portrait-h-45-v0-z1.png");
  });
  it("preview transform and orbit gizmo round-trip", () => {
    expect(previewTransform(FRONT)).toBe("perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)");
    for (const a of [FRONT, { h: 45, v: 30, zoom: 1 }, { h: -60, v: -20, zoom: 1.5 }]) {
      const p = orbitPoint(a);
      expect(angleFromOrbit(p.x, p.y, a.zoom)).toEqual(a);
    }
    expect(orbitPoint({ h: 90, v: 0, zoom: 1 }).x).toBeGreaterThan(orbitPoint(FRONT).x);
    expect(orbitPoint({ h: 0, v: 60, zoom: 1 }).y).toBeLessThan(orbitPoint(FRONT).y);
  });
});
