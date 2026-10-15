import { describe, expect, it } from "vitest";
import {
  SPEEDS,
  SUB_LINE_CJK,
  SUB_LINE_LATIN,
  breakLines,
  breakSubtitle,
  canSplitAt,
  cardLength,
  chunkAt,
  chunkSubtitle,
  dominantScript,
  mergeAutoSubs,
  scriptMismatch,
  speedOptions,
  subtitleChunks,
  type Clip,
  type Project,
} from "@/app/prototypes/(v1.13)/hybrid-reel/canvas/project";

const WIDE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;

describe("subtitle line breaking", () => {
  it("keeps short text on one line", () => {
    expect(breakLines("Glow all day.")).toEqual(["Glow all day."]);
    expect(breakSubtitle("")).toEqual([]);
  });

  it("wraps Latin text at ≤ 32 chars on word boundaries", () => {
    const text = "This serum melts in fast and keeps my skin glowing from morning coffee to late night plans with friends";
    const lines = breakLines(text);
    expect(lines.length).toBeGreaterThan(2);
    for (const l of lines) expect(l.length).toBeLessThanOrEqual(SUB_LINE_LATIN);
    expect(lines.join(" ")).toBe(text);
  });

  it("wraps CJK text at ≤ 14 chars, preferring punctuation, never starting a line with punctuation", () => {
    const text = "这款精华一抹就化开，整天都水润发光，早上喝咖啡到晚上约朋友都不用补妆。";
    const lines = breakLines(text);
    for (const l of lines) expect([...l].length).toBeLessThanOrEqual(SUB_LINE_CJK);
    expect(lines.join("")).toBe(text);
    expect(lines[0]).toBe("这款精华一抹就化开，");
    for (const l of lines) expect(/^[，。！？]/.test(l)).toBe(false);
  });

  it("weights mixed text: a wide char counts as 32/14 of a Latin char", () => {
    const text = "BuzzVideo 让你的广告 3 秒抓住注意力，转化率提升 2 倍以上，真的太好用了";
    const lines = breakLines(text);
    expect(lines.length).toBeGreaterThan(1);
    for (const l of lines) {
      const w = [...l].reduce((n, ch) => n + (WIDE.test(ch) ? SUB_LINE_LATIN / SUB_LINE_CJK : 1), 0);
      expect(w).toBeLessThanOrEqual(SUB_LINE_LATIN + 1e-6);
    }
  });

  it("hard-splits a single overlong token", () => {
    const lines = breakLines("https://example.com/a/very/long/path/that/never/ends/at/all");
    for (const l of lines) expect(l.length).toBeLessThanOrEqual(SUB_LINE_LATIN);
  });

  it("groups lines into screens of at most two", () => {
    const text = Array.from({ length: 30 }, (_, i) => `word${i}`).join(" ");
    const screens = breakSubtitle(text);
    for (const s of screens) expect(s.split("\n").length).toBeLessThanOrEqual(2);
    expect(screens.join("\n").split("\n")).toEqual(breakLines(text));
  });

  it("splits time proportionally to character count and covers the whole span", () => {
    const chunks = chunkSubtitle(Array.from({ length: 30 }, (_, i) => `word${i}`).join(" "), 1, 9);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].from).toBe(1);
    expect(chunks[chunks.length - 1].to).toBe(9);
    for (let i = 1; i < chunks.length; i++) expect(chunks[i].from).toBeCloseTo(chunks[i - 1].to);
    const rate = chunks.map((c) => (c.to - c.from) / c.text.replace(/\s/g, "").length);
    for (const r of rate) expect(r).toBeCloseTo(rate[0], 5);
  });

  it("derives chunks from a clip's subtitle span, and finds the one at a time", () => {
    const clip = { id: "c", subtitle: "One two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen", subIn: 1, subOut: 5 } as Clip;
    const chunks = subtitleChunks(clip, 6);
    expect(chunks.length).toBe(2);
    expect(chunkAt(chunks, 0.5)).toBeUndefined();
    expect(chunkAt(chunks, 1.1)).toBe(chunks[0]);
    expect(chunkAt(chunks, 4.99)).toBe(chunks[1]);
    expect(chunkAt(chunks, 5)).toBe(chunks[1]);
    expect(subtitleChunks({ ...clip, subtitle: "  " }, 6)).toEqual([]);
  });
});

describe("spoken-language script check", () => {
  it("finds the dominant script", () => {
    expect(dominantScript("Hello there")).toBe("latin");
    expect(dominantScript("你好，世界")).toBe("han");
    expect(dominantScript("안녕하세요")).toBe("hangul");
    expect(dominantScript("مرحبا")).toBe("arabic");
    expect(dominantScript("1 2 3")).toBeNull();
  });

  it("flags English selected with mostly CJK, and Chinese selected with mostly Latin", () => {
    expect(scriptMismatch("这个产品真的很好用", "en")).toBe(true);
    expect(scriptMismatch("this product is great", "zh")).toBe(true);
    expect(scriptMismatch("this product is great", "en")).toBe(false);
    expect(scriptMismatch("我用 BuzzVideo 做广告", "zh")).toBe(false);
    expect(scriptMismatch("これはとても良いです", "ja")).toBe(false);
    expect(scriptMismatch("広告", "ja")).toBe(false);
    expect(scriptMismatch("hola amigos", "es")).toBe(false);
    expect(scriptMismatch("ok", "ko")).toBe(true);
    expect(scriptMismatch("", "en")).toBe(false);
    expect(scriptMismatch("whatever", "xx")).toBe(false);
  });
});

describe("auto-subtitle merge", () => {
  const clip = (id: string, subtitle: string): Clip => ({ id, assetId: null, role: "usage", inSec: 0, outSec: 4, speed: 1, muted: false, subtitle, subtitleSource: "authored", subIn: 0.5, subOut: 3 });
  const project = { clips: [clip("a", "old a"), clip("b", "old b"), clip("c", "")], voice: [] } as unknown as Project;

  it("replaces only recognised clips; failed and silent clips keep their subtitles", () => {
    const next = mergeAutoSubs(project, { a: { text: "new a", subIn: 0.2, subOut: 2 } });
    expect(next.clips[0]).toMatchObject({ subtitle: "new a", subtitleSource: "stt", subIn: 0.2, subOut: 2 });
    expect(next.clips[1]).toBe(project.clips[1]);
    expect(next.clips[2]).toBe(project.clips[2]);
    expect(typeof next.subsVoiceKey).toBe("string");
  });
});

describe("speed options", () => {
  it("are the same six steps everywhere, plus the current value when it's off-grid", () => {
    expect([...SPEEDS]).toEqual([0.5, 0.75, 1, 1.25, 1.5, 2]);
    expect(speedOptions(1)).toEqual([0.5, 0.75, 1, 1.25, 1.5, 2]);
    expect(speedOptions(3)).toEqual([0.5, 0.75, 1, 1.25, 1.5, 2, 3]);
  });
});

describe("card length", () => {
  it("counts English words and CJK chars, flagging over 6 words / 10 chars", () => {
    expect(cardLength("Glow all day")).toEqual({ count: 3, unit: "words", over: false });
    expect(cardLength("Glow all day long with zero effort")).toEqual({ count: 7, unit: "words", over: true });
    expect(cardLength("一抹就化开")).toEqual({ count: 5, unit: "chars", over: false });
    expect(cardLength("一抹就化开整天都水润发光")).toMatchObject({ unit: "chars", over: true });
    expect(cardLength("50% OFF — today!")).toMatchObject({ count: 3, over: false });
  });
});

describe("split", () => {
  const seg = { clip: {} as Clip, index: 0, start: 2, len: 4 };
  it("needs the playhead at least 0.3s inside the clip", () => {
    expect(canSplitAt(seg, 4)).toBe(true);
    expect(canSplitAt(seg, 2.1)).toBe(false);
    expect(canSplitAt(seg, 5.9)).toBe(false);
    expect(canSplitAt(undefined, 4)).toBe(false);
  });
});
