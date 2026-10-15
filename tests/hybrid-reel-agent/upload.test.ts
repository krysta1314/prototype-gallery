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

import { UPLOAD_INTERRUPTED, isNetworkError, knownContainer, settleWithRetry, unreadableProbe } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/logic/upload";

const bytes = (...xs: (number | string)[]) => new Uint8Array(xs.flatMap((x) => (typeof x === "string" ? [...x].map((c) => c.charCodeAt(0)) : [x])));

describe("unreadable files", () => {
  const mp4 = bytes(0, 0, 0, 0x20, "ftypisom");
  const jpeg = bytes(0xff, 0xd8, 0xff, 0xe0);
  const junk = bytes(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
  it("recognises common video / image containers by their header", () => {
    expect(knownContainer(mp4, "video")).toBe(true);
    expect(knownContainer(bytes(0, 0, 0, 8, "wide"), "video")).toBe(true);
    expect(knownContainer(bytes(0x1a, 0x45, 0xdf, 0xa3), "video")).toBe(true);
    expect(knownContainer(jpeg, "image")).toBe(true);
    expect(knownContainer(bytes(0x89, "PNG"), "image")).toBe(true);
    expect(knownContainer(bytes(0, 0, 0, 0x18, "ftypheic"), "image")).toBe(true);
    expect(knownContainer(junk, "video")).toBe(false);
    expect(knownContainer(junk, "image")).toBe(false);
  });
  it("only rejects when the browser errors and the header isn't a known container (or the file is empty)", () => {
    expect(unreadableProbe({ size: 100, mediaError: true, head: junk, kind: "video" })).toBe(true);
    /* HEVC .MOV:浏览器报错但文件头是 MP4 / MOV → 照收 */
    expect(unreadableProbe({ size: 100, mediaError: true, head: mp4, kind: "video" })).toBe(false);
    /* 超时 / 读成功:不是 error → 不拦 */
    expect(unreadableProbe({ size: 100, mediaError: false, head: junk, kind: "video" })).toBe(false);
    expect(unreadableProbe({ size: 0, mediaError: false, head: new Uint8Array(), kind: "image" })).toBe(true);
  });
  it("rejects an unreadable pick with the export-again line, keeps the rest", () => {
    expect(rejectReason({ name: "x.mp4", type: "video/mp4", size: 10, unreadable: true })).toBe("x.mp4 can't be read — try exporting it again");
    const r = pickFiles(0, [{ name: "x.mp4", type: "video/mp4", size: 10, unreadable: true }, vid("ok.mov")]);
    expect(r).toEqual({ accepted: [1], notices: ["x.mp4 can't be read — try exporting it again"] });
  });
});

describe("upload interruption", () => {
  it("treats fetch TypeErrors as network errors, not aborts or server errors", () => {
    expect(isNetworkError(new TypeError("Failed to fetch"))).toBe(true);
    expect(isNetworkError(new TypeError("fetch failed"))).toBe(true);
    expect(isNetworkError(new Error("Load failed"))).toBe(true);
    expect(isNetworkError(new DOMException("Cancelled", "AbortError"))).toBe(false);
    expect(isNetworkError(new Error("HTTP 500"))).toBe(false);
  });
  it("retries only the files that failed on the network, once", async () => {
    const calls: string[][] = [];
    const fail = (e: unknown): PromiseRejectedResult => ({ status: "rejected", reason: e });
    const ok = (v: string): PromiseFulfilledResult<string> => ({ status: "fulfilled", value: v });
    const out = await settleWithRetry(["a", "b", "c", "d"], async (fs, retry) => {
      calls.push(fs);
      if (!retry) return [ok("a"), fail(new TypeError("Failed to fetch")), fail(new Error("HTTP 413")), fail(new TypeError("Failed to fetch"))];
      return [ok("b2"), fail(new TypeError("Failed to fetch"))];
    });
    expect(calls).toEqual([["a", "b", "c", "d"], ["b", "d"]]);
    expect(out.map((r) => (r.status === "fulfilled" ? r.value : "x"))).toEqual(["a", "b2", "x", "x"]);
    expect(UPLOAD_INTERRUPTED.en).toBe("Upload interrupted — check your connection");
  });
  it("doesn't retry when nothing failed on the network", async () => {
    let n = 0;
    await settleWithRetry([1], async () => {
      n += 1;
      return [{ status: "rejected", reason: new Error("HTTP 500") }];
    });
    expect(n).toBe(1);
  });
});
