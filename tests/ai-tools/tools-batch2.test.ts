import { describe, it, expect } from "vitest";
import {
  AVATAR_TRAIN_CREDITS,
  CONSENT_START,
  FRAME_CREDITS,
  VOICE_CLONE_CREDITS,
  avatarsReduce,
  canSubmitAvatar,
  checkFootage,
  clonedVoices,
  consentReduce,
  countWords,
  defaultHold,
  detectTestimonials,
  faceMatchPassed,
  nextAvatarName,
  parseAvatars,
  scriptSeconds,
  trainCredits,
  usableAvatars,
  videoCredits,
  voiceNameOf,
  writeScript,
  type Consent,
  type MyAvatar,
} from "../../src/app/prototypes/(v1.12)/ai-tools/app/avatar/logic";
import {
  DEFAULT_OPTS,
  anyOption,
  encodeWav,
  enhanceCredits,
  enhanceUpload,
  fileKind,
  mixEnhanced,
  mixOriginal,
  optsSummary,
  peaks,
  rms,
  sameOpts,
  sampleParts,
} from "../../src/app/prototypes/(v1.12)/ai-tools/app/voice/logic";

describe("testimonial detection (FTC notice)", () => {
  it("flags first-person testimonial phrases, in order", () => {
    const hits = detectTestimonials("Honestly, I've been using this for two weeks and my skin has never looked better. It changed my life!");
    expect(hits.map((h) => h.phrase)).toEqual(["I've been using", "my skin", "changed my life"]);
  });

  it("handles curly apostrophes and case, keeps the original spelling in the phrase", () => {
    const hits = detectTestimonials("I’VE BEEN USING it daily");
    expect(hits).toHaveLength(1);
    expect(hits[0]).toEqual({ phrase: "I’VE BEEN USING", index: 0 });
  });

  it("catches other common testimonial phrasings", () => {
    for (const s of ["I tried everything", "since I started using it", "I swear by this", "works wonders for me", "I noticed a difference", "I love how it feels", "best serum I've ever used", "I'm obsessed"]) {
      expect(detectTestimonials(s).length, s).toBeGreaterThan(0);
    }
  });

  it("does not flag second-person product copy or look-alike words", () => {
    expect(detectTestimonials("Meet the serum. It fades dark spots, and your skin feels soft. Tap the link.")).toEqual([]);
    expect(detectTestimonials("Remy skincare: myskin routine, tried-and-true formula")).toEqual([]);
    expect(detectTestimonials("")).toEqual([]);
  });

  it("the generated script never triggers the notice", () => {
    for (const length of [15, 30] as const) {
      expect(detectTestimonials(writeScript({ product: "Aurelia Serum", benefits: ["fades dark spots", "absorbs fast", "has vitamin C"], length }))).toEqual([]);
    }
  });
});

describe("script writer and duration", () => {
  const benefits = ["fades dark spots in four weeks", "feels weightless.", "pairs vitamin C with niacinamide"];
  it("15s script fits ~15s, 30s script fits ~30s, both name the product", () => {
    const short = writeScript({ product: "Aurelia Serum", benefits, length: 15 });
    const long = writeScript({ product: "Aurelia Serum", benefits, length: 30 });
    expect(short).toContain("Aurelia Serum");
    expect(long).toContain("Aurelia Serum");
    expect(scriptSeconds(short)).toBeLessThanOrEqual(15);
    expect(scriptSeconds(long)).toBeGreaterThan(15);
    expect(scriptSeconds(long)).toBeLessThanOrEqual(30);
    expect(long).toContain("feels weightless,"); // 结尾标点去掉再拼
  });

  it("falls back to generic lines when there are no benefits", () => {
    const s = writeScript({ product: "", benefits: [" ", ""], length: 15 });
    expect(s).toContain("Meet this.");
    expect(countWords(s)).toBeGreaterThan(5);
  });

  it("seconds: words / 2.5, rounded up to 5s, 5–60; empty = 0", () => {
    expect(scriptSeconds("")).toBe(0);
    expect(scriptSeconds("   ")).toBe(0);
    expect(scriptSeconds("Hi there")).toBe(5);
    expect(scriptSeconds(Array(13).fill("w").join(" "))).toBe(10); // 5.2s → 10
    expect(scriptSeconds(Array(500).fill("w").join(" "))).toBe(60);
  });
});

describe("credits (placeholders)", () => {
  it("product avatar: first frame is cheap, video is per second", () => {
    expect(FRAME_CREDITS).toBe(1);
    expect(videoCredits(15)).toBe(30);
    expect(videoCredits(30)).toBe(60);
    expect(videoCredits(0)).toBe(0);
  });
  it("custom avatar: training + optional voice clone", () => {
    expect(trainCredits(false)).toBe(AVATAR_TRAIN_CREDITS);
    expect(trainCredits(true)).toBe(AVATAR_TRAIN_CREDITS + VOICE_CLONE_CREDITS);
  });
  it("voice enhancer: 1 credit per started 10s, at least 1", () => {
    expect(enhanceCredits(0)).toBe(1);
    expect(enhanceCredits(9.9)).toBe(1);
    expect(enhanceCredits(10.1)).toBe(2);
    expect(enhanceCredits(16)).toBe(2);
    expect(enhanceCredits(600)).toBe(60);
  });
});

describe("holding style defaults by category", () => {
  it("beauty → use, electronics → unbox, food → hold, other → show", () => {
    expect(defaultHold("beauty")).toBe("use");
    expect(defaultHold("electronics")).toBe("unbox");
    expect(defaultHold("food")).toBe("hold");
    expect(defaultHold("fashion")).toBe("show");
    expect(defaultHold("other")).toBe("show");
  });
});

describe("custom avatar: footage and consent", () => {
  it("footage must be 30s – 2min", () => {
    expect(checkFootage(12)).toBe("too-short");
    expect(checkFootage(29.6)).toBe("ok");
    expect(checkFootage(42)).toBe("ok");
    expect(checkFootage(120.4)).toBe("ok");
    expect(checkFootage(121)).toBe("too-long");
  });

  it("consent: record → stop (check, attempts+1) → pass / fail; failed can record again", () => {
    let s: Consent = CONSENT_START;
    s = consentReduce(s, { type: "stop" });
    expect(s).toEqual(CONSENT_START); // 没在录,停无效
    s = consentReduce(s, { type: "record" });
    expect(s.step).toBe("recording");
    s = consentReduce(s, { type: "stop" });
    expect(s).toEqual({ step: "checking", attempts: 1 });
    expect(consentReduce(s, { type: "record" })).toBe(s); // 比对中不能重录
    s = consentReduce(s, { type: "result", ok: false });
    expect(s.step).toBe("failed");
    s = consentReduce(s, { type: "record" });
    s = consentReduce(s, { type: "stop" });
    s = consentReduce(s, { type: "result", ok: true });
    expect(s).toEqual({ step: "passed", attempts: 2 });
    expect(consentReduce(s, { type: "record" })).toBe(s); // 通过后不再录
    expect(consentReduce(s, { type: "result", ok: false })).toBe(s); // 迟到的结果不改状态
    expect(consentReduce(s, { type: "reset" })).toEqual(CONSENT_START);
  });

  it("fixture face match: fail mode fails only the first attempt", () => {
    expect(faceMatchPassed(true, 1)).toBe(true);
    expect(faceMatchPassed(false, 1)).toBe(false);
    expect(faceMatchPassed(false, 2)).toBe(true);
  });

  it("submit needs ok footage + passed consent + a name", () => {
    expect(canSubmitAvatar({ footage: "ok", consent: "passed", name: "Me" })).toBe(true);
    expect(canSubmitAvatar({ footage: "too-short", consent: "passed", name: "Me" })).toBe(false);
    expect(canSubmitAvatar({ footage: "ok", consent: "failed", name: "Me" })).toBe(false);
    expect(canSubmitAvatar({ footage: "ok", consent: "passed", name: "  " })).toBe(false);
    expect(canSubmitAvatar({ footage: null, consent: "passed", name: "Me" })).toBe(false);
  });
});

describe("my avatars list", () => {
  const mk = (id: string, o: Partial<MyAvatar> = {}): MyAvatar => ({ id, name: id, status: "training", createdAt: 1, image: "/a.jpg", voice: false, cost: 100, ...o });

  it("add puts newest first, ignores duplicate ids", () => {
    let l = avatarsReduce([], { type: "add", avatar: mk("a") });
    l = avatarsReduce(l, { type: "add", avatar: mk("b") });
    expect(l.map((x) => x.id)).toEqual(["b", "a"]);
    expect(avatarsReduce(l, { type: "add", avatar: mk("a") })).toBe(l);
  });

  it("rename trims and caps at 40 chars; empty name is ignored", () => {
    const l = [mk("a")];
    expect(avatarsReduce(l, { type: "rename", id: "a", name: "  Monica  " })[0].name).toBe("Monica");
    expect(avatarsReduce(l, { type: "rename", id: "a", name: "x".repeat(60) })[0].name).toHaveLength(40);
    expect(avatarsReduce(l, { type: "rename", id: "a", name: "   " })).toBe(l);
  });

  it("training → ready / failed only from training; failed can retry; remove deletes", () => {
    let l = [mk("a"), mk("b", { status: "ready" })];
    l = avatarsReduce(l, { type: "status", id: "a", status: "failed" });
    expect(l[0].status).toBe("failed");
    l = avatarsReduce(l, { type: "status", id: "a", status: "ready" });
    expect(l[0].status).toBe("failed"); // 不是 training,不变
    l = avatarsReduce(l, { type: "retry", id: "a" });
    expect(l[0].status).toBe("training");
    l = avatarsReduce(l, { type: "retry", id: "b" });
    expect(l[1].status).toBe("ready"); // 只有 failed 能重试
    l = avatarsReduce(l, { type: "remove", id: "a" });
    expect(l.map((x) => x.id)).toEqual(["b"]);
  });

  it("product avatar sees only ready avatars; cloned voices only from ready ones with voice", () => {
    const l = [mk("a", { status: "ready", voice: true, name: "Mon" }), mk("b", { voice: true }), mk("c", { status: "ready" })];
    expect(usableAvatars(l).map((x) => x.id)).toEqual(["a", "c"]);
    expect(clonedVoices(l).map((x) => x.id)).toEqual(["a"]);
    expect(voiceNameOf(l[0])).toBe("Mon's voice");
  });

  it("default names don't collide", () => {
    expect(nextAvatarName([])).toBe("My avatar");
    expect(nextAvatarName([mk("a", { name: "My avatar" }), mk("b", { name: "my avatar 2" })])).toBe("My avatar 3");
  });

  it("sessionStorage parse: drops bad entries, replaces blob: images", () => {
    const raw = JSON.stringify([mk("a", { image: "blob:http://x/1" }), { id: "bad" }, mk("c", { status: "ready" })]);
    const l = parseAvatars(raw, "/fallback.jpg");
    expect(l.map((x) => x.id)).toEqual(["a", "c"]);
    expect(l[0].image).toBe("/fallback.jpg");
    expect(parseAvatars("not json", "/f")).toEqual([]);
    expect(parseAvatars(null, "/f")).toEqual([]);
  });
});

describe("voice enhancer audio logic", () => {
  const sr = 8000;
  /* 1 秒人声(220Hz)+ 1 秒静音 */
  const clean = new Float32Array(sr * 2);
  for (let i = 0; i < sr; i++) clean[i] = Math.sin((2 * Math.PI * 220 * i) / sr) * 0.5;
  const parts = sampleParts(clean, sr);
  const silent = [sr + Math.round(sr * 0.6), sr * 2] as const; // 回声尾巴之后的纯底噪段

  it("original adds noise to the silent part", () => {
    expect(rms(clean, ...silent)).toBe(0);
    expect(rms(mixOriginal(parts), ...silent)).toBeGreaterThan(0.01);
  });

  it("all options off = the original", () => {
    expect(Array.from(mixEnhanced(parts, { noise: false, echo: false, level: false, strength: "high" }))).toEqual(Array.from(mixOriginal(parts)));
  });

  it("noise removal: higher strength leaves less noise", () => {
    const n = (strength: "low" | "medium" | "high") => rms(mixEnhanced(parts, { ...DEFAULT_OPTS, strength }), ...silent);
    const orig = rms(mixOriginal(parts), ...silent);
    expect(n("low")).toBeLessThan(orig);
    expect(n("medium")).toBeLessThan(n("low"));
    expect(n("high")).toBeLessThan(n("medium"));
  });

  it("echo removal shrinks the tail right after the voice stops", () => {
    const tail = [sr + 10, sr + Math.round(sr * 0.5)] as const;
    const base = { noise: true, level: false, strength: "high" as const };
    expect(rms(mixEnhanced(parts, { ...base, echo: true }), ...tail)).toBeLessThan(rms(mixEnhanced(parts, { ...base, echo: false }), ...tail) / 2);
  });

  it("volume leveling brings the voice peak to ~0.9", () => {
    const out = mixEnhanced(parts, { noise: true, echo: true, level: true, strength: "high" });
    const peak = Math.max(...Array.from(out.slice(0, sr)).map(Math.abs));
    expect(peak).toBeGreaterThan(0.85);
    expect(peak).toBeLessThanOrEqual(1);
  });

  it("uploads: noise gate quiets low-level frames, leaves speech", () => {
    const x = new Float32Array(sr);
    for (let i = 0; i < sr / 2; i++) x[i] = Math.sin(i / 3) * 0.4;
    for (let i = sr / 2; i < sr; i++) x[i] = ((i * 7919) % 13) / 13 / 200; // 很小的底噪
    const out = enhanceUpload(x, sr, { ...DEFAULT_OPTS, strength: "high" });
    expect(rms(out, sr / 2, sr)).toBeLessThan(rms(x, sr / 2, sr) * 0.1);
    expect(rms(out, 0, sr / 2)).toBeCloseTo(rms(x, 0, sr / 2), 5);
  });

  it("options helpers", () => {
    expect(anyOption(DEFAULT_OPTS)).toBe(true);
    expect(anyOption({ ...DEFAULT_OPTS, noise: false })).toBe(false);
    expect(sameOpts(DEFAULT_OPTS, { ...DEFAULT_OPTS })).toBe(true);
    expect(sameOpts(DEFAULT_OPTS, { ...DEFAULT_OPTS, strength: "high" })).toBe(false);
    expect(optsSummary({ noise: true, echo: true, level: false, strength: "medium" })).toBe("Noise + Echo · Medium");
    expect(fileKind("a.MP3")).toBe("audio");
    expect(fileKind("b.mov")).toBe("video");
    expect(fileKind("c.pdf")).toBe(null);
  });

  it("peaks: one max-abs per bucket", () => {
    expect(peaks(new Float32Array([0.1, -0.5, 0.2, 0.3]), 2)).toEqual([0.5, 0.3].map((v) => Math.fround(v)));
    expect(peaks(new Float32Array(0), 4)).toEqual([]);
  });

  it("WAV: 44-byte header + 16-bit mono PCM", () => {
    const buf = encodeWav(new Float32Array([0, 1, -1, 2]), 8000);
    const v = new DataView(buf);
    const tag = (o: number) => String.fromCharCode(v.getUint8(o), v.getUint8(o + 1), v.getUint8(o + 2), v.getUint8(o + 3));
    expect(buf.byteLength).toBe(44 + 8);
    expect([tag(0), tag(8), tag(12), tag(36)]).toEqual(["RIFF", "WAVE", "fmt ", "data"]);
    expect(v.getUint32(24, true)).toBe(8000);
    expect(v.getUint16(22, true)).toBe(1);
    expect([v.getInt16(44, true), v.getInt16(46, true), v.getInt16(48, true), v.getInt16(50, true)]).toEqual([0, 32767, -32768, 32767]);
  });
});
