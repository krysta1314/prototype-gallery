import { describe, it, expect } from "vitest";
import { groupBatches, jobsReduce, type ToolJob } from "../../src/app/prototypes/(v1.12)/ai-tools/app/tools/jobs";
import {
  EXPAND_CREDITS_PER_IMAGE,
  PLACEMENTS,
  clampOffset,
  parseCustomSide,
  placeImage,
  ratioLabel,
  resizeCredits,
  safeArea,
  subjectInFrame,
  subjectWarning,
} from "../../src/app/prototypes/(v1.12)/ai-tools/app/resize/logic";
import { SAMPLE_IMAGE, SAMPLE_SUBJECT } from "../../src/app/prototypes/(v1.12)/ai-tools/app/resize/fixture";
import {
  cropSize,
  outOfFrameRanges,
  parseRatioPart,
  reframeWindow,
  sameAspect,
  subjectAt,
  videoCredits,
} from "../../src/app/prototypes/(v1.12)/ai-tools/app/video-resize/logic";
import { SAMPLE_TRACK, SAMPLE_VIDEO } from "../../src/app/prototypes/(v1.12)/ai-tools/app/video-resize/fixture";

describe("tool jobs reducer", () => {
  const start = (ids: string[], cost = 2) =>
    jobsReduce<string>([], { type: "start", now: 1, jobs: ids.map((id) => ({ id, batch: "b1", input: id, cost })) });

  it("start adds running jobs and ignores duplicate ids", () => {
    const j = start(["a", "b"]);
    expect(j.map((x) => x.status)).toEqual(["running", "running"]);
    expect(jobsReduce(j, { type: "start", now: 2, jobs: [{ id: "a", batch: "b2", input: "a", cost: 2 }] })).toBe(j);
  });

  it("done / fail only apply to running jobs", () => {
    let j = start(["a"]);
    j = jobsReduce(j, { type: "fail", id: "a" });
    expect(j[0].status).toBe("failed");
    expect(jobsReduce(j, { type: "done", id: "a" })).toBe(j);
  });

  it("restart re-runs a finished job with optional new input / cost; running jobs can't restart", () => {
    let j = start(["a"]);
    expect(jobsReduce(j, { type: "restart", id: "a", now: 5 })).toBe(j);
    j = jobsReduce(j, { type: "done", id: "a" });
    j = jobsReduce(j, { type: "restart", id: "a", now: 5, input: "moved", cost: 0 });
    expect(j[0]).toMatchObject({ status: "running", startedAt: 5, input: "moved", cost: 0 });
  });

  it("groups batches newest first", () => {
    let j: ToolJob<string>[] = start(["a", "b"]);
    j = jobsReduce(j, { type: "start", now: 2, jobs: [{ id: "c", batch: "b2", input: "c", cost: 0 }] });
    expect(groupBatches(j).map((g) => [g.batch, g.jobs.map((x) => x.id)])).toEqual([
      ["b2", ["c"]],
      ["b1", ["a", "b"]],
    ]);
  });
});

describe("Resize & Expand", () => {
  it("placements cover the spec list with the right ratios", () => {
    expect(PLACEMENTS.map((p) => `${p.label} ${ratioLabel(p.w, p.h)}`)).toEqual([
      "Meta Feed 1:1",
      "Meta Feed 4:5",
      "Stories & Reels 9:16",
      "Google Display 1.91:1",
      "TikTok 9:16",
      "Amazon 1:1",
    ]);
    expect(PLACEMENTS.filter((p) => p.safeZone).map((p) => p.id)).toEqual(["stories-reels", "tiktok"]);
  });

  it("credits = expand placements × unit price; crop / fit are free", () => {
    expect(resizeCredits(["expand", "expand", "crop", "fit"])).toBe(2 * EXPAND_CREDITS_PER_IMAGE);
    expect(EXPAND_CREDITS_PER_IMAGE).toBe(4); // fibo-edit-1.5/expand $0.04 / 张
    expect(resizeCredits(["crop", "fit"])).toBe(0);
    expect(resizeCredits([])).toBe(0);
  });

  it("custom side is rounded and clamped to 64–4096", () => {
    expect(parseCustomSide("1500.4", 1)).toBe(1500);
    expect(parseCustomSide("10", 1)).toBe(64);
    expect(parseCustomSide("99999", 1)).toBe(4096);
    expect(parseCustomSide("abc", 1200)).toBe(1200);
  });

  it("contain (expand / fit) centres the image; cover (crop) fills and overflows", () => {
    const src = { w: 1376, h: 768 };
    const fit = placeImage(src, { w: 1080, h: 1920 }, "expand");
    expect(fit.w).toBeCloseTo(1);
    expect(fit.x).toBeCloseTo(0);
    expect(fit.y).toBeCloseTo((1 - fit.h) / 2);
    const crop = placeImage(src, { w: 1080, h: 1920 }, "crop");
    expect(crop.h).toBeCloseTo(1);
    expect(crop.w).toBeGreaterThan(1);
    expect(crop.x).toBeCloseTo((1 - crop.w) / 2);
  });

  it("offset is clamped so crop never shows edges and contain never leaves the frame", () => {
    const src = { w: 1376, h: 768 };
    const frame = { w: 1080, h: 1920 };
    const crop = placeImage(src, frame, "crop", { dx: 5, dy: 0 });
    expect(crop.x).toBeCloseTo(0);
    const fit = placeImage(src, frame, "fit", { dx: 0, dy: -5 });
    expect(fit.y).toBeCloseTo(0);
    const c = clampOffset(src, frame, "fit", { dx: 0, dy: -5 });
    expect(c.dy).toBeCloseTo(-(1 - fit.h) / 2);
  });

  it("safe zone for 9:16 = 160px top / 440px bottom of a 1920 frame, scaled", () => {
    const z = safeArea();
    expect(z.top).toBeCloseTo(160 / 1920);
    expect(z.bottom).toBeCloseTo(1 - 440 / 1920);
  });

  it("warns when the subject is cut by a crop or overlaps the UI area", () => {
    const src = { w: SAMPLE_IMAGE.width, h: SAMPLE_IMAGE.height };
    const frame = { w: 1080, h: 1920 };
    // 样图头顶贴着上边:9:16 Crop 时主体伸进顶部 UI 区
    const crop = subjectInFrame(SAMPLE_SUBJECT, placeImage(src, frame, "crop"));
    expect(subjectWarning(crop, true)).toBe("unsafe");
    expect(subjectWarning(crop, false)).toBe(null);
    // Expand 居中放:主体在安全区里
    const expand = subjectInFrame(SAMPLE_SUBJECT, placeImage(src, frame, "expand"));
    expect(subjectWarning(expand, true)).toBe(null);
    // Crop 往左推到底:主体被裁
    const shifted = subjectInFrame(SAMPLE_SUBJECT, placeImage(src, frame, "crop", { dx: 2, dy: 0 }));
    expect(subjectWarning(shifted, false)).toBe("cut");
  });
});

describe("Video Resize", () => {
  const src = { w: SAMPLE_VIDEO.width, h: SAMPLE_VIDEO.height };

  it("credits = billed seconds × ratios × per-second price; Fit is free", () => {
    expect(videoCredits(15.25, 2, "reframe")).toBe(16 * 2 * 1);
    expect(videoCredits(15.25, 1, "expand")).toBe(16 * 4);
    expect(videoCredits(15.25, 3, "fit")).toBe(0);
    expect(videoCredits(0, 2, "reframe")).toBe(0);
  });

  it("custom ratio parts are whole numbers 1–100", () => {
    expect(parseRatioPart("2.4", 1)).toBe(2);
    expect(parseRatioPart("0", 1)).toBe(1);
    expect(parseRatioPart("500", 1)).toBe(100);
    expect(parseRatioPart("x", 3)).toBe(3);
  });

  it("detects the source ratio", () => {
    expect(sameAspect({ w: 16, h: 9 }, src)).toBe(true);
    expect(sameAspect({ w: 9, h: 16 }, src)).toBe(false);
  });

  it("crop window size per ratio", () => {
    expect(cropSize({ w: 9, h: 16 }, src).w).toBeCloseTo(0.316, 3);
    expect(cropSize({ w: 1, h: 1 }, src)).toEqual({ w: 0.5625, h: 1 });
  });

  it("interpolates the track and holds through empty shots", () => {
    expect(subjectAt(SAMPLE_TRACK, 1.45)?.cx).toBeCloseTo(0.51);
    expect(subjectAt(SAMPLE_TRACK, 5)).toBe(null);
  });

  it("reframe window follows the subject and stays inside the picture", () => {
    const w = reframeWindow({ w: 9, h: 16 }, src, { cx: 0.98, cy: 0.5, w: 0.1, h: 0.1 });
    expect(w.x + w.w).toBeCloseTo(1);
  });

  it("marks where the subject leaves the frame (reframe only)", () => {
    const r916 = outOfFrameRanges(SAMPLE_TRACK, SAMPLE_VIDEO.duration, { w: 9, h: 16 }, src, "reframe");
    expect(r916.length).toBe(2);
    expect(r916[0].start).toBe(0);
    expect(r916[1].start).toBeGreaterThan(6);
    expect(r916[1].end).toBeLessThan(8.5);
    const r11 = outOfFrameRanges(SAMPLE_TRACK, SAMPLE_VIDEO.duration, { w: 1, h: 1 }, src, "reframe");
    expect(r11.length).toBe(1);
    expect(outOfFrameRanges(SAMPLE_TRACK, SAMPLE_VIDEO.duration, { w: 9, h: 16 }, src, "fit")).toEqual([]);
  });
});

