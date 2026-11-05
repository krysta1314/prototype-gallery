import { describe, it, expect } from "vitest";
import {
  DEFAULT_PARAMS, outputSize, upscaleCredits, isPrintReady, printInches,
  parseFactor, isAcceptedFile, toFalInput, printCm, parseSeed,
} from "../../src/app/prototypes/(v1.12)/ai-tools/app/logic";

describe("outputSize", () => {
  it("factor mode multiplies and rounds consistently", () => {
    expect(outputSize(1536, 1024, { ...DEFAULT_PARAMS, factor: 8.1 })).toEqual({ w: 12442, h: 8294 });
  });
  it("target mode aligns short edge", () => {
    expect(outputSize(1536, 1024, { ...DEFAULT_PARAMS, mode: "target", target: "2160p" })).toEqual({ w: 3240, h: 2160 });
  });
  it("target mode keeps orientation", () => {
    expect(outputSize(1024, 1536, { ...DEFAULT_PARAMS, mode: "target", target: "2160p" })).toEqual({ w: 2160, h: 3240 });
  });
});
describe("upscaleCredits", () => {
  it("rounds MP up then credits up, min 1", () => {
    expect(upscaleCredits(6144, 4096)).toBe(3);
    expect(upscaleCredits(12442, 8294)).toBe(11);
    expect(upscaleCredits(15360, 10240)).toBe(16);
    expect(upscaleCredits(800, 600)).toBe(1);
  });
  it("is not thrown off by float error (30MP = exactly 3)", () => {
    expect(upscaleCredits(6000, 5000)).toBe(3);
  });
});
it("isPrintReady uses long edge >= 10000", () => {
  expect(isPrintReady(10000, 6667)).toBe(true);
  expect(isPrintReady(9999, 9999)).toBe(false);
});
it("printInches", () => expect(printInches(12442, 8294)).toEqual({ w: 41.5, h: 27.6 }));
it("parseFactor clamps and recovers", () => {
  expect(parseFactor("11", 2)).toBe(10);
  expect(parseFactor("0", 2)).toBe(1);
  expect(parseFactor("-3", 2)).toBe(1);
  expect(parseFactor("abc", 4)).toBe(4);
  expect(parseFactor("", 4)).toBe(4);
  expect(parseFactor("8.16", 2)).toBe(8.2);
});
it("isAcceptedFile", () => {
  expect(isAcceptedFile("a.HEIC")).toBe(true);
  expect(isAcceptedFile("a.bmp")).toBe(false);
});
describe("toFalInput", () => {
  it("factor mode", () => {
    expect(toFalInput("u", { ...DEFAULT_PARAMS, factor: 8.1 })).toEqual({
      image_url: "u", upscale_mode: "factor", upscale_factor: 8.1, noise_scale: 0.1, output_format: "png", enable_safety_checker: true,
    });
  });
  it("target mode with seed", () => {
    expect(toFalInput("u", { ...DEFAULT_PARAMS, mode: "target", target: "2160p", seed: 42 })).toEqual({
      image_url: "u", upscale_mode: "target", target_resolution: "2160p", noise_scale: 0.1, seed: 42, output_format: "png", enable_safety_checker: true,
    });
  });
});

it("printCm converts the 300 dpi print size to cm (from exact inches, 1 decimal)", () => {
  // 12,442 / 300 × 2.54 = 105.34;8,294 / 300 × 2.54 = 70.22
  expect(printCm(12442, 8294)).toEqual({ w: 105.3, h: 70.2 });
});

describe("parseSeed", () => {
  it("accepts non-negative integer digits only", () => {
    expect(parseSeed("48213", null)).toBe(48213);
    expect(parseSeed(" 0 ", 5)).toBe(0);
  });
  it("empty means random (null)", () => expect(parseSeed("  ", 7)).toBeNull());
  it.each(["-1", "1e3", "0x10", "1.5", "abc", "99999999999999999999"])("rejects %s and keeps prev", (raw) => {
    expect(parseSeed(raw, 7)).toBe(7);
  });
});
