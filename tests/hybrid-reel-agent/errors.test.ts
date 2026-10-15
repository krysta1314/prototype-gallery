import { describe, expect, it } from "vitest";
import { FileError, errorKind, failText, friendlyError, isAbort, skippedLine } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/logic/errors";

describe("friendlyError", () => {
  it("maps timeouts", () => {
    expect(friendlyError(new Error("The model service timed out (simulated)"))).toEqual({
      kind: "timeout",
      text: "The model took too long to respond.",
      details: "The model service timed out (simulated)",
    });
    expect(errorKind("HTTP 504")).toBe("timeout");
    expect(errorKind("请求超时")).toBe("timeout");
  });
  it("maps too-large errors with the file name", () => {
    expect(friendlyError(new FileError("IMG_01.mov", "IMG_01.mov: HTTP 413 Request Entity Too Large")).text).toBe("IMG_01.mov is too large to upload.");
    expect(friendlyError(new Error("HTTP 413"), "a.mp4").text).toBe("a.mp4 is too large to upload.");
    expect(friendlyError(new Error("HTTP 413")).text).toBe("The file is too large to upload.");
  });
  it("maps network errors", () => {
    expect(friendlyError(new TypeError("Failed to fetch")).text).toBe("Couldn't reach the server — check your connection.");
    expect(errorKind("NetworkError when attempting to fetch resource.")).toBe("network");
  });
  it("falls back to a generic line and keeps the raw text as details", () => {
    const f = friendlyError("ARK said: invalid json");
    expect(f).toEqual({ kind: "other", text: "Something went wrong on our side.", details: "ARK said: invalid json" });
  });
});

describe("friendlyError in Chinese", () => {
  it("has a zh line for every kind", () => {
    expect(friendlyError(new Error("timed out"), undefined, "zh")).toEqual({ kind: "timeout", text: "模型响应超时。", details: "timed out" });
    expect(friendlyError(new FileError("IMG_01.mov", "HTTP 413"), undefined, "zh").text).toBe("IMG_01.mov 太大,无法上传。");
    expect(friendlyError(new Error("HTTP 413"), undefined, "zh").text).toBe("该文件太大,无法上传。");
    expect(friendlyError(new TypeError("Failed to fetch"), undefined, "zh").text).toBe("连不上服务器,请检查网络。");
    expect(friendlyError("ARK said: invalid json", undefined, "zh").text).toBe("我们这边出了点问题。");
  });
  it("defaults to English", () => {
    expect(friendlyError(new Error("timed out"), undefined, "en").text).toBe("The model took too long to respond.");
  });
});

describe("helpers", () => {
  it("skippedLine", () => {
    expect(skippedLine({ name: "a.mov", reason: "The model took too long to respond." })).toBe("Skipped a.mov: The model took too long to respond.");
    expect(skippedLine({ name: "a.mov", reason: "模型响应超时。" }, "zh")).toBe("跳过了 a.mov:模型响应超时。");
  });
  it("failText", () => {
    const f = friendlyError(new Error("timed out"), undefined, "zh");
    expect(failText("素材分析失败", f, "zh")).toBe("素材分析失败:模型响应超时。");
    expect(failText("Couldn't read your footage", friendlyError(new Error("timed out")))).toBe("Couldn't read your footage: The model took too long to respond.");
  });
  it("isAbort", () => {
    expect(isAbort(new DOMException("x", "AbortError"))).toBe(true);
    expect(isAbort(new Error("x"))).toBe(false);
  });
});
