import { describe, expect, it } from "vitest";
import { DEFAULT_CREDITS, checkCredits, creditBalance, formatCredits } from "@/app/prototypes/(v1.13)/hybrid-reel/canvas/credits";
import {
  MAX_REFS,
  addRef,
  aiRefs,
  checkMediaUpload,
  keepRuntime,
  pushVersion,
  refCandidates,
  removeAsset,
  resetInterrupted,
  switchVersion,
  versionIndex,
  versionsOf,
  type Asset,
  type Project,
} from "@/app/prototypes/(v1.13)/hybrid-reel/canvas/project";

const upload = (id: string, kind: "video" | "image" = "image"): Asset => ({
  id,
  kind,
  origin: "upload",
  label: `${id}.${kind === "video" ? "mp4" : "jpg"}`,
  url: `blob:${id}`,
  durationSec: kind === "video" ? 8 : 10,
  aspect: 9 / 16,
  status: "ready",
  x: 0,
  y: 0,
});

const shot = (over: Partial<Asset> = {}): Asset => ({
  id: "ai-1",
  kind: "video",
  origin: "ai",
  label: "Video Generator",
  durationSec: 5,
  aspect: 9 / 16,
  prompt: "A close-up of the bottle",
  status: "idle",
  cost: 50,
  x: 0,
  y: 0,
  ...over,
});

const project = (assets: Asset[], over: Partial<Project> = {}): Project => ({
  v: 1,
  assets,
  clips: [{ id: "c-0", assetId: "ai-1", role: "usage", inSec: 0, outSec: 5, speed: 1, muted: false, subtitle: "", subtitleSource: "stt" }],
  subtitleStyle: "classic",
  musicId: null,
  musicVol: 60,
  voiceVol: 100,
  originalOn: true,
  aspect: "9:16",
  autoLayout: false,
  editor: { x: 0, y: 0 },
  bgmPrompt: "",
  creditsPerShot: 50,
  spentCredits: 0,
  ...over,
});

describe("credits", () => {
  it("balance is start minus spent, never negative", () => {
    expect(creditBalance(DEFAULT_CREDITS, 150)).toBe(35450);
    expect(creditBalance(30, 80)).toBe(0);
  });
  it("lets the action through when the balance covers it", () => {
    expect(checkCredits(50, 50)).toEqual({ ok: true });
    expect(checkCredits(0, 0)).toEqual({ ok: true });
  });
  it("blocks with needed vs balance when short", () => {
    expect(checkCredits(30, 50)).toEqual({ ok: false, needed: 50, balance: 30 });
  });
  it("formats with thousands separators", () => {
    expect(formatCredits(35600)).toBe("35,600");
  });
});

describe("versions", () => {
  it("treats a legacy result as version 1", () => {
    const a = shot({ status: "ready", url: "v1.mp4" });
    expect(versionsOf(a)).toEqual([{ url: "v1.mp4", durationSec: 5, aspect: 9 / 16 }]);
    expect(versionIndex(a)).toBe(0);
  });
  it("keeps every result and switches to the newest", () => {
    let a = pushVersion(shot(), { url: "v1.mp4" });
    a = pushVersion(a, { url: "v2.mp4", durationSec: 6 });
    expect(versionsOf(a).map((v) => v.url)).toEqual(["v1.mp4", "v2.mp4"]);
    expect(versionIndex(a)).toBe(1);
    expect(a.url).toBe("v2.mp4");
    expect(a.durationSec).toBe(6);
  });
  it("switching changes the node's current url (the timeline follows the node)", () => {
    let a = pushVersion(shot(), { url: "v1.mp4", durationSec: 5 });
    a = pushVersion({ ...a, status: "ready" }, { url: "v2.mp4", durationSec: 6 });
    const p = switchVersion(project([{ ...a, status: "ready" }]), "ai-1", 0);
    const b = p.assets[0];
    expect(b.url).toBe("v1.mp4");
    expect(b.durationSec).toBe(5);
    expect(versionIndex(b)).toBe(0);
    expect(p.clips[0].assetId).toBe("ai-1");
    /* 越界夹到范围内 */
    expect(switchVersion(p, "ai-1", 9).assets[0].url).toBe("v2.mp4");
  });
  it("doesn't switch while generating", () => {
    const a = { ...pushVersion(pushVersion(shot(), { url: "v1.mp4" }), { url: "v2.mp4" }), status: "generating" as const };
    expect(switchVersion(project([a]), "ai-1", 0).assets[0].url).toBe("v2.mp4");
  });
});

describe("references", () => {
  it("adds an imported image or video frame and caps at 9", () => {
    const ups = Array.from({ length: 11 }, (_, i) => upload(`u${i}`, i % 2 ? "video" : "image"));
    let p = project([...ups, shot({ refIds: ["u0"] })]);
    expect(refCandidates(p, p.assets.at(-1)!).length).toBe(10);
    for (let i = 1; i < 11; i++) p = addRef(p, "ai-1", `u${i}`);
    const refs = aiRefs(p, p.assets.find((a) => a.id === "ai-1")!);
    expect(refs.length).toBe(MAX_REFS);
    expect(refs.map((r) => r.id)).toEqual(["u0", "u1", "u2", "u3", "u4", "u5", "u6", "u7", "u8"]);
  });
  it("materialises the default refs (first 3 uploads) before adding", () => {
    const p = project([upload("u0"), upload("u1"), upload("u2"), upload("u3"), shot()]);
    const next = addRef(p, "ai-1", "u3");
    expect(next.assets.find((a) => a.id === "ai-1")!.refIds).toEqual(["u0", "u1", "u2", "u3"]);
  });
  it("ignores duplicates and non-media", () => {
    const audio: Asset = { ...upload("a0"), kind: "audio" };
    const p = project([upload("u0"), audio, shot({ refIds: ["u0"] })]);
    expect(addRef(p, "ai-1", "u0")).toBe(p);
    expect(addRef(p, "ai-1", "a0")).toBe(p);
  });
});

describe("removeAsset", () => {
  it("refunds what a generating node was charged", () => {
    const p = project([shot({ status: "generating", progress: 40, charged: 50 })], { spentCredits: 120 });
    const next = removeAsset(p, "ai-1");
    expect(next.spentCredits).toBe(70);
    expect(next.assets).toEqual([]);
    expect(next.clips[0].assetId).toBeNull();
  });
  it("doesn't refund a finished node", () => {
    const p = project([shot({ status: "ready", url: "v1.mp4" })], { spentCredits: 50 });
    expect(removeAsset(p, "ai-1").spentCredits).toBe(50);
  });
});

describe("checkMediaUpload", () => {
  const MB = 1024 * 1024;
  it("accepts videos within 500 MB and 10 minutes, images within 20 MB", () => {
    expect(checkMediaUpload({ name: "a.mp4", type: "video/mp4", size: 499 * MB, durationSec: 599 })).toBeNull();
    expect(checkMediaUpload({ name: "a.jpg", type: "image/jpeg", size: 19 * MB })).toBeNull();
  });
  it("rejects oversize, overlong and other types", () => {
    expect(checkMediaUpload({ name: "IMG_01.mov", type: "video/quicktime", size: 501 * MB })).toBe("IMG_01.mov is over 500 MB");
    expect(checkMediaUpload({ name: "long.mp4", type: "video/mp4", size: MB, durationSec: 601 })).toBe("long.mp4 is longer than 10 minutes");
    expect(checkMediaUpload({ name: "big.png", type: "image/png", size: 21 * MB })).toBe("big.png is over 20 MB");
    expect(checkMediaUpload({ name: "song.mp3", type: "audio/mpeg", size: MB })).toBe("song.mp3 isn't a video or image");
  });
  it("falls back to the file extension when the browser gives no MIME type (HEIC / MOV)", () => {
    expect(checkMediaUpload({ name: "IMG_0001.HEIC", type: "", size: MB })).toBeNull();
    expect(checkMediaUpload({ name: "IMG_0002.mov", type: "", size: MB, durationSec: 30 })).toBeNull();
    expect(checkMediaUpload({ name: "clip.mkv", type: "application/octet-stream", size: MB })).toBeNull();
    expect(checkMediaUpload({ name: "IMG_0003.heif", type: "", size: 21 * MB })).toBe("IMG_0003.heif is over 20 MB");
    expect(checkMediaUpload({ name: "IMG_0004.MOV", type: "", size: 501 * MB })).toBe("IMG_0004.MOV is over 500 MB");
    expect(checkMediaUpload({ name: "notes.txt", type: "", size: MB })).toBe("notes.txt isn't a video or image");
  });
});

describe("resetInterrupted (hard refresh mid-generation)", () => {
  it("resets runs without a task id and refunds what they charged", () => {
    const p = project(
      [
        shot({ id: "ai-1", status: "generating", progress: 40, charged: 50 }),
        shot({ id: "ai-2", status: "generating", url: "old.mp4", charged: 50 }),
        { ...shot({ id: "vo-1", status: "generating", charged: 6 }), kind: "audio", purpose: "voice" },
      ],
      { spentCredits: 120 },
    );
    const r = resetInterrupted(p);
    expect(r.spentCredits).toBe(14);
    expect(r.assets.map((a) => a.status)).toEqual(["idle", "ready", "idle"]);
    expect(r.assets.every((a) => a.charged === undefined && a.progress === undefined)).toBe(true);
  });
  it("keeps Seedance runs that already have a task id (resumed, still charged)", () => {
    const p = project([shot({ status: "generating", taskId: "t-1", charged: 50 })], { spentCredits: 50 });
    const r = resetInterrupted(p);
    expect(r).toBe(p);
    expect(r.assets[0].status).toBe("generating");
  });
  it("leaves a project with nothing generating unchanged", () => {
    const p = project([shot({ status: "ready", url: "v.mp4" })], { spentCredits: 50 });
    expect(resetInterrupted(p)).toBe(p);
  });
});

describe("keepRuntime voiceStale", () => {
  const voice = (over: Partial<Asset> = {}): Asset => ({ ...shot({ id: "vo-1", status: "ready", url: "a.mp3", voiceId: "warm-f", takes: 1 }), kind: "audio", purpose: "voice", ...over });
  it("undoing a voice change clears the Voice changed warning", () => {
    const before = project([voice()]);
    const changed = project([voice({ voiceId: "calm-m", voiceStale: true })]);
    expect(keepRuntime(before, changed).assets[0].voiceStale).toBeUndefined();
  });
  it("undo after regenerating in the new voice warns, since the audio is the new voice", () => {
    const snap = project([voice({ voiceId: "warm-f" })]);
    const regenerated = project([voice({ voiceId: "calm-m", takes: 2, url: "b.mp3" })]);
    expect(keepRuntime(snap, regenerated).assets[0].voiceStale).toBe(true);
  });
  it("undoing an unrelated edit after regenerating doesn't bring back a stale warning", () => {
    const snap = project([voice({ voiceId: "calm-m", voiceStale: true })]);
    const regenerated = project([voice({ voiceId: "calm-m", takes: 2, url: "b.mp3" })]);
    expect(keepRuntime(snap, regenerated).assets[0].voiceStale).toBeUndefined();
  });
});
