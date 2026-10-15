import { describe, expect, it } from "vitest";
import { UPLOAD_LIMITS, mediaKind, pickFiles, rejectReason } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/logic/upload";

const MB = 1024 * 1024;
const vid = (name: string, size = 10 * MB, durationSec?: number) => ({ name, type: "video/quicktime", size, durationSec });

describe("mediaKind", () => {
  it("accepts video / image / audio by MIME, falls back to the extension, rejects the rest", () => {
    expect(mediaKind("a.mov", "video/quicktime")).toBe("video");
    expect(mediaKind("a.png", "image/png")).toBe("image");
    expect(mediaKind("a.mp3", "audio/mpeg")).toBe("audio");
    expect(mediaKind("IMG_1.HEIC", "")).toBe("image");
    expect(mediaKind("clip.MOV", "")).toBe("video");
    expect(mediaKind("song.m4a", "")).toBe("audio");
    expect(mediaKind("deck.pdf", "application/pdf")).toBeNull();
  });
});

describe("rejectReason", () => {
  it("enforces the per-kind size limits", () => {
    expect(rejectReason(vid("IMG_01.mov", 500 * MB))).toBeNull();
    expect(rejectReason(vid("IMG_01.mov", 501 * MB))).toBe("IMG_01.mov is over 500 MB");
    expect(rejectReason({ name: "p.jpg", type: "image/jpeg", size: 21 * MB })).toBe("p.jpg is over 20 MB");
    expect(rejectReason({ name: "s.mp3", type: "audio/mpeg", size: 51 * MB })).toBe("s.mp3 is over 50 MB");
    expect(rejectReason({ name: "s.mp3", type: "audio/mpeg", size: 49 * MB })).toBeNull();
  });
  it("rejects videos over 10 minutes, but not when the length couldn't be read", () => {
    expect(rejectReason(vid("long.mp4", MB, 601))).toBe("long.mp4 is longer than 10 minutes");
    expect(rejectReason(vid("ok.mp4", MB, 600))).toBeNull();
    expect(rejectReason(vid("unknown.mp4", MB))).toBeNull();
  });
  it("rejects other file types", () => {
    expect(rejectReason({ name: "deck.pdf", type: "application/pdf", size: 1 })).toBe("deck.pdf isn't a video, image or audio file");
  });
});

describe("pickFiles", () => {
  it("keeps valid files in order and reports every rejected one", () => {
    const r = pickFiles(0, [vid("a.mov"), vid("big.mov", 600 * MB), { name: "b.png", type: "image/png", size: MB }]);
    expect(r.accepted).toEqual([0, 2]);
    expect(r.notices).toEqual(["big.mov is over 500 MB"]);
  });
  it("caps the total at 10 files, counting what's already added", () => {
    const many = Array.from({ length: 5 }, (_, i) => vid(`c${i}.mov`));
    const r = pickFiles(UPLOAD_LIMITS.maxFiles - 2, many);
    expect(r.accepted).toEqual([0, 1]);
    expect(r.notices).toEqual(["You can add up to 10 files"]);
    expect(pickFiles(10, [vid("x.mov")]).accepted).toEqual([]);
  });
  it("invalid files don't use up slots", () => {
    const r = pickFiles(9, [vid("big.mov", 600 * MB), vid("ok.mov")]);
    expect(r.accepted).toEqual([1]);
    expect(r.notices).toEqual(["big.mov is over 500 MB"]);
  });
});

describe("duplicates & prompt limit", () => {
  it("rejects a file already added or picked twice in one go", async () => {
    const { pickFiles, fileKey } = await import("@/app/prototypes/(v1.13)/hybrid-reel-agent/app/logic/upload");
    const a = { name: "a.mp4", type: "video/mp4", size: 10, lastModified: 1 };
    const b = { name: "b.png", type: "image/png", size: 20, lastModified: 2 };
    const same = { ...a };
    const r = pickFiles(1, [a, b, same].map((f) => ({ ...f, key: fileKey(f) })), [fileKey(b)]);
    expect(r.accepted).toEqual([0]);
    expect(r.notices).toEqual(["b.png is already added", "a.mp4 is already added"]);
    /* 同名不同文件照样能加 */
    const other = { ...a, size: 11 };
    expect(pickFiles(0, [a, other].map((f) => ({ ...f, key: fileKey(f) }))).accepted).toEqual([0, 1]);
  });
  it("prompt max 20,000 with a counter from 90%", async () => {
    const { PROMPT_MAX, showPromptCount } = await import("@/app/prototypes/(v1.13)/hybrid-reel-agent/app/logic/upload");
    expect(PROMPT_MAX).toBe(20000);
    expect(showPromptCount(17999)).toBe(false);
    expect(showPromptCount(18000)).toBe(true);
  });
});
