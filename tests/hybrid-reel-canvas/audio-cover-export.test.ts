import { describe, expect, it } from "vitest";
import {
  VOICE_SCRIPT_MAX,
  estimateSpeechSec,
  layoutClips,
  normalizeCover,
  overVoiceLimit,
  pendingAiShots,
  sfxTooClose,
  sourceToTimeline,
  timelineToSource,
  voiceBatch,
  voiceLinesToMake,
  type Asset,
  type Clip,
  type Project,
} from "@/app/prototypes/(v1.13)/hybrid-reel/canvas/project";
import { buildEditorPreset } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/review/editorJourneys";
import { DEFAULT_OPTS } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/review/journeys";
import RELLET from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/fixture/rellet.json";
import type { FixtureData } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/app/fixture/types";

const asset = (id: string, over: Partial<Asset> = {}): Asset => ({
  id,
  kind: "video",
  origin: "upload",
  label: id,
  url: `blob:${id}`,
  durationSec: 10,
  aspect: 9 / 16,
  status: "ready",
  x: 0,
  y: 0,
  ...over,
});
const clip = (id: string, assetId: string | null, inSec: number, outSec: number, speed = 1): Clip => ({
  id,
  assetId,
  role: "usage",
  inSec,
  outSec,
  speed,
  muted: false,
  subtitle: "",
  subtitleSource: "stt",
});
const project = (assets: Asset[], clips: Clip[], over: Partial<Project> = {}): Project => ({
  v: 1,
  assets,
  clips,
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

describe("voice script limit and length estimate", () => {
  it("flags scripts over 2,800 characters", () => {
    expect(VOICE_SCRIPT_MAX).toBe(2800);
    expect(overVoiceLimit("a".repeat(2800))).toBe(false);
    expect(overVoiceLimit("a".repeat(2801))).toBe(true);
    expect(overVoiceLimit(undefined)).toBe(false);
  });
  it("estimates English at 2.5 words/s and Chinese at 4 chars/s, mixed text adds both", () => {
    expect(estimateSpeechSec("Your skin will thank you")).toBe(2);
    expect(estimateSpeechSec("细雾绵密超治愈呀")).toBe(2);
    expect(estimateSpeechSec("细雾绵密 Glow up now")).toBe(2.2);
    expect(estimateSpeechSec("  ")).toBe(0);
  });
  it("a faster voice shortens the estimate", () => {
    expect(estimateSpeechSec("Your skin will thank you", 2)).toBe(1);
  });
});

describe("voice batch (Generate all n lines)", () => {
  const voiceNode = (id: string, over: Partial<Asset> = {}): Asset =>
    asset(id, { kind: "audio", origin: "ai", purpose: "voice", url: undefined, status: "idle", ...over });
  const base = (over: Partial<Asset> = {}) =>
    project(
      [voiceNode("v1"), voiceNode("v2", { status: "ready", url: "blob:v2", ...over }), voiceNode("v3", { status: "ready", url: "blob:v3" })],
      [],
      {
        voice: [
          { id: "l1", assetId: "v1", at: 0, len: 2, clipId: "c-0", text: "Hello there" },
          { id: "l2", assetId: "v2", at: 2, len: 2, clipId: "c-1", text: "Second line", url: "blob:l2" },
          { id: "l3", assetId: "v3", at: 4, len: 2, clipId: "c-2", text: "Third line", url: "blob:l3" },
        ],
      },
    );
  it("counts lines without audio, plus every line of a node whose voice changed", () => {
    expect(voiceLinesToMake(base(), "v1").map((v) => v.id)).toEqual(["l1"]);
    expect(voiceLinesToMake(base(), "v2")).toEqual([]);
    expect(voiceLinesToMake(base({ voiceStale: true }), "v2").map((v) => v.id)).toEqual(["l2"]);
    expect(voiceBatch(base(), 8)).toEqual({ assetIds: ["v1"], lines: 1, cost: 8 });
    expect(voiceBatch(base({ voiceStale: true }), 8)).toEqual({ assetIds: ["v1", "v2"], lines: 2, cost: 16 });
  });
  it("skips nodes already generating and lines over the limit", () => {
    const p = base();
    const busy = { ...p, assets: p.assets.map((a) => (a.id === "v1" ? { ...a, status: "generating" as const } : a)) };
    expect(voiceBatch(busy, 8).lines).toBe(0);
    const long = { ...p, voice: p.voice!.map((v) => (v.id === "l1" ? { ...v, text: "a".repeat(2801) } : v)) };
    expect(voiceBatch(long, 8).lines).toBe(0);
  });
});

describe("sound effect density", () => {
  it("warns when two effects start less than 2 seconds apart, in any order", () => {
    expect(sfxTooClose(undefined)).toBe(false);
    expect(sfxTooClose([{ id: "a", kind: "pop", at: 1 }])).toBe(false);
    expect(sfxTooClose([{ id: "a", kind: "pop", at: 5 }, { id: "b", kind: "ding", at: 1 }, { id: "c", kind: "boom", at: 3 }])).toBe(false);
    expect(sfxTooClose([{ id: "a", kind: "pop", at: 5 }, { id: "b", kind: "ding", at: 1 }, { id: "c", kind: "boom", at: 6.5 }])).toBe(true);
  });
});

describe("pending AI shots (export gate, export toast, auto-subtitle use one basis)", () => {
  const p = project(
    [
      asset("up"),
      asset("ai-1", { origin: "ai", status: "idle", url: undefined, cost: 50, prompt: "A shot" }),
      asset("ai-2", { origin: "ai", status: "idle", url: undefined, cost: 120, prompt: "A shot" }),
      asset("ai-3", { origin: "ai", status: "generating", url: undefined, cost: 50, prompt: "A shot" }),
      asset("ai-off", { origin: "ai", status: "idle", url: undefined, cost: 50 }),
      asset("ai-ok", { origin: "ai", status: "ready", cost: 50 }),
    ],
    [clip("c-0", "up", 0, 3), clip("c-1", "ai-1", 0, 5), clip("c-2", "ai-2", 0, 5), clip("c-3", "ai-2", 0, 2), clip("c-4", "ai-3", 0, 5), clip("c-5", "ai-ok", 0, 5)],
  );
  it("only counts shots on the timeline, each once", () => {
    const r = pendingAiShots(p);
    expect(r.shots.map((a) => a.id)).toEqual(["ai-1", "ai-2", "ai-3"]);
    expect(r.count).toBe(3);
    expect(r.running).toBe(1);
  });
  it("sums each node's own cost, leaving out shots already generating", () => {
    expect(pendingAiShots(p).cost).toBe(170);
  });
  it("falls back to the project's per-shot price when a node has no cost", () => {
    const q = { ...p, assets: p.assets.map((a) => (a.id === "ai-2" ? { ...a, cost: undefined } : a)) };
    expect(pendingAiShots(q).cost).toBe(100);
  });
});

describe("cover frame time", () => {
  /* 时间线:up-a 0–3s(素材 2–5s),up-b 3–5s(素材 0–4s,2 倍速) */
  const p = project([asset("up-a"), asset("up-b")], [clip("c-0", "up-a", 2, 5), clip("c-1", "up-b", 0, 4, 2)]);
  it("maps source time to timeline time and back", () => {
    expect(sourceToTimeline(p, "up-a", 3)).toBe(1);
    expect(sourceToTimeline(p, "up-b", 2)).toBe(4);
    const back = timelineToSource(p, 4);
    expect(back?.asset.id).toBe("up-b");
    expect(back?.sourceT).toBe(2);
  });
  it("converts a legacy cover (source seconds on the raw video) to timeline time", () => {
    const legacy = { ...p, cover: { kind: "frame" as const, src: "blob:up-b", t: 2 } };
    expect(normalizeCover(legacy).cover).toEqual({ kind: "frame", src: "blob:up-b", t: 4, tl: true });
  });
  it("keeps a picked frame (captured image, already timeline time) and leaves new covers alone", () => {
    const picked = { ...p, cover: { kind: "frame" as const, src: "data:image/jpeg;base64,xx", t: 4.2 } };
    expect(normalizeCover(picked).cover).toEqual({ kind: "frame", src: "data:image/jpeg;base64,xx", t: 4.2, tl: true });
    const fresh = { ...p, cover: { kind: "frame" as const, src: "blob:up-b", t: 4, tl: true as const } };
    expect(normalizeCover(fresh)).toBe(fresh);
  });
  it("buildProject stores the planned cover frame as timeline time", () => {
    const data = RELLET as unknown as FixtureData;
    const { project: built, handoff } = buildEditorPreset("cover", DEFAULT_OPTS, data);
    const c = built.cover;
    const o = handoff.outline!.cover;
    if (c?.kind !== "frame" || !o) return; // 方案没有挑视频帧当封面时没东西可验
    expect(c.tl).toBe(true);
    const at = timelineToSource(built, c.t);
    expect(at?.asset.url).toBe(c.src);
    /* 时间线时间 = 那一镜在时间线上的开头 + atSec;换回素材时间 = inSec + atSec × speed */
    const seg = layoutClips(built.clips).segs[o.shot];
    expect(c.t).toBeCloseTo(seg.start + (o.atSec ?? 0), 2);
    expect(at!.sourceT).toBeCloseTo(seg.clip.inSec + (o.atSec ?? 0) * seg.clip.speed, 2);
  });
});
