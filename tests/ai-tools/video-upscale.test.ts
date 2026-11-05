import { describe, it, expect } from "vitest";
import {
  DEFAULT_VIDEO_PARAMS,
  FORMAT_API,
  toFalVideoInput,
  videoOutputSize,
  videoParamSummary,
  videoUpscaleCredits,
} from "../../src/app/prototypes/(v1.12)/ai-tools/app/video-upscale/logic";

describe("Upscale Video (fal-ai/seedvr/upscale/video)", () => {
  it("defaults match the fal schema", () => {
    expect(DEFAULT_VIDEO_PARAMS).toMatchObject({ mode: "factor", factor: 2, target: "1080p", noiseScale: 0.1, format: "mp4", quality: "high", writeMode: "balanced" });
    expect(Object.values(FORMAT_API)).toEqual(["X264 (.mp4)", "VP9 (.webm)", "PRORES4444 (.mov)", "GIF (.gif)"]);
  });

  it("sends upscale_factor only in factor mode and target_resolution only in target mode", () => {
    const f = toFalVideoInput("v.mp4", DEFAULT_VIDEO_PARAMS);
    expect(f).toMatchObject({ video_url: "v.mp4", upscale_mode: "factor", upscale_factor: 2, output_format: "X264 (.mp4)", output_quality: "high", output_write_mode: "balanced" });
    expect(f).not.toHaveProperty("target_resolution");
    expect(f).not.toHaveProperty("seed");
    const t = toFalVideoInput("v.mp4", { ...DEFAULT_VIDEO_PARAMS, mode: "target", target: "2160p" });
    expect(t).toMatchObject({ upscale_mode: "target", target_resolution: "2160p" });
    expect(t).not.toHaveProperty("upscale_factor");
  });

  it("output size follows the image rules (factor multiplies, target sets the short side)", () => {
    expect(videoOutputSize(1280, 720, DEFAULT_VIDEO_PARAMS)).toEqual({ w: 2560, h: 1440 });
    expect(videoOutputSize(1280, 720, { ...DEFAULT_VIDEO_PARAMS, mode: "target", target: "2160p" })).toEqual({ w: 3840, h: 2160 });
  });

  it("credits = output megapixels x frames x 0.1 (fal bills $0.001 per MP of video data)", () => {
    // 1920×1080 × 121 帧 ≈ 250.9 MP → 26 credits
    expect(videoUpscaleCredits(1920, 1080, 121 / 30)).toBe(26);
    expect(videoUpscaleCredits(1920, 1080, 0)).toBe(0);
    expect(videoUpscaleCredits(10, 10, 0.1)).toBe(1);
  });

  it("summary uses the same names as the left panel", () => {
    expect(videoParamSummary(DEFAULT_VIDEO_PARAMS)).toBe("Factor 2x · Noise Scale 0.1 · MP4 · High Quality · Balanced");
  });
});
