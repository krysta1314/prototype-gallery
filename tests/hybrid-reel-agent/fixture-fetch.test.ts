import { describe, expect, it } from "vitest";
import { createFixtureFetch } from "@/app/prototypes/(v1.13)/hybrid-reel-agent/review/fixtureFetch";

const blob = (s: string) => new Blob([s], { type: "audio/mpeg" });
const base = {
  voice: [
    { text: "第一句", url: "/v/zh-1.mp3", durationSec: 2.1 },
    { text: "第二句", url: "/v/zh-2.mp3", durationSec: 1.8 },
  ],
  sttLines: ["第一句", "第二句"],
  shotVideos: ["/a.mp4", "/b.mp4"],
  failShot: false,
  readyAfterMs: 0,
  load: async (url: string) => blob(url),
};
const post = (f: ReturnType<typeof createFixtureFetch>, url: string, body: unknown) =>
  f(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

describe("video", () => {
  it("creates a task, reports success, and serves a shot video in turn", async () => {
    const f = createFixtureFetch(base);
    const { id } = await (await post(f, "/api/hybrid-reel/video", { prompt: "x" })).json();
    expect(id).toBeTruthy();
    expect((await (await f(`/api/hybrid-reel/video?id=${id}`)).json()).status).toBe("succeeded");
    expect(await (await f(`/api/hybrid-reel/video?id=${id}&file=1`)).text()).toBe("/a.mp4");
    const { id: id2 } = await (await post(f, "/api/hybrid-reel/video", { prompt: "y" })).json();
    expect(await (await f(`/api/hybrid-reel/video?id=${id2}&file=1`)).text()).toBe("/b.mp4");
  });
  it("is still running before readyAfterMs", async () => {
    const f = createFixtureFetch({ ...base, readyAfterMs: 60_000 });
    const { id } = await (await post(f, "/api/hybrid-reel/video", { prompt: "x" })).json();
    expect((await (await f(`/api/hybrid-reel/video?id=${id}`)).json()).status).toBe("running");
  });
  it("fails creation when failShot is on", async () => {
    const res = await post(createFixtureFetch({ ...base, failShot: true }), "/api/hybrid-reel/video", { prompt: "x" });
    expect(res.ok).toBe(false);
    expect((await res.json()).error).toMatch(/simulated/i);
  });
});

describe("unknown task id", () => {
  it("is treated as succeeded and serves the first shot video", async () => {
    const f = createFixtureFetch(base);
    const q = await f("/api/hybrid-reel/video?id=gone");
    expect(q.ok).toBe(true);
    expect((await q.json()).status).toBe("succeeded");
    expect(await (await f("/api/hybrid-reel/video?id=gone&file=1")).text()).toBe("/a.mp4");
  });
});

describe("tts", () => {
  it("returns the recording of the same sentence as base64 with its duration", async () => {
    const data = await (await post(createFixtureFetch(base), "/api/hybrid-reel/tts", { text: "第二句", voice: "any" })).json();
    expect(atob(data.audio)).toBe("/v/zh-2.mp3");
    expect(data.duration).toBe(1.8);
  });
  it("falls back to the first recording for an unknown sentence", async () => {
    const data = await (await post(createFixtureFetch(base), "/api/hybrid-reel/tts", { text: "没录过" })).json();
    expect(atob(data.audio)).toBe("/v/zh-1.mp3");
  });
});

describe("stt", () => {
  it("returns storyboard lines in order and wraps for a second run", async () => {
    const f = createFixtureFetch(base);
    const a = await (await post(f, "/api/hybrid-reel/stt", { audio: "x" })).json();
    const b = await (await post(f, "/api/hybrid-reel/stt", { audio: "x" })).json();
    const c = await (await post(f, "/api/hybrid-reel/stt", { audio: "x" })).json();
    expect(a.utterances[0].text).toBe("第一句");
    expect(b.utterances[0].text).toBe("第二句");
    expect(c.utterances[0].text).toBe("第一句");
    expect(c.utterances[0].end).toBe(2.1);
  });
  it("spans the whole recorded line so the subtitle covers the clip", async () => {
    const f = createFixtureFetch(base);
    const a = await (await post(f, "/api/hybrid-reel/stt", { audio: "x" })).json();
    const b = await (await post(f, "/api/hybrid-reel/stt", { audio: "x" })).json();
    expect(a.utterances[0]).toMatchObject({ start: 0, end: 2.1 });
    expect(b.utterances[0]).toMatchObject({ start: 0, end: 1.8 });
  });
  it("returns no utterances when sttLines is empty", async () => {
    const f = createFixtureFetch({ ...base, sttLines: [] });
    expect((await (await post(f, "/api/hybrid-reel/stt", {})).json()).utterances).toEqual([]);
  });
  it("uses explicit sttDurations when given", async () => {
    const f = createFixtureFetch({ ...base, sttLines: ["别的话"], sttDurations: [4] });
    expect((await (await post(f, "/api/hybrid-reel/stt", {})).json()).utterances[0].end).toBe(4);
  });
});

describe("failure switches", () => {
  it("failStt makes every transcription return 502 with an error", async () => {
    const f = createFixtureFetch({ ...base, failStt: true });
    for (let i = 0; i < 2; i++) {
      const res = await post(f, "/api/hybrid-reel/stt", { audio: "x" });
      expect(res.status).toBe(502);
      expect((await res.json()).error).toBe("The speech service is busy right now (simulated) — try again.");
    }
  });
  it("failTts makes voiceover return 502 with an error; other routes still work", async () => {
    const f = createFixtureFetch({ ...base, failTts: true });
    const res = await post(f, "/api/hybrid-reel/tts", { text: "第一句" });
    expect(res.status).toBe(502);
    expect((await res.json()).error).toBe("The speech service is busy right now (simulated) — try again.");
    expect((await (await post(f, "/api/hybrid-reel/stt", { audio: "x" })).json()).utterances[0].text).toBe("第一句");
  });
});

describe("other urls", () => {
  it("passes through to load for non-API urls", async () => {
    expect(await (await createFixtureFetch(base)("/prototypes/x.mp4")).text()).toBe("/prototypes/x.mp4");
  });
});
