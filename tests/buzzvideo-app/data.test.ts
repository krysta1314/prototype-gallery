import { describe, expect, it } from "vitest";
import { INITIAL_STATE, storeReducer as r } from "@/app/prototypes/(app-mvp)/buzzvideo-app/app/store";
import { RESULTS, resultFor } from "@/app/prototypes/(app-mvp)/buzzvideo-app/app/data";

describe("resultFor", () => {
  it("bakery prompt in agent mode gets the bakery cover, no video", () => {
    const x = resultFor("agent", "A cozy 15s reel for our bakery croissants");
    expect(x.cover).toMatch(/usecase-bakery\.jpg$/);
    expect(x.video).toBeUndefined();
  });
  it("latte gets latte cover + video", () => {
    const x = resultFor("agent", "Iced Latte promo");
    expect(x.cover).toMatch(/result-agent\.jpg$/);
    expect(x.video).toMatch(/result-agent\.mp4$/);
  });
  it("serum maps to the video result", () => {
    expect(resultFor("video", "glow serum").video).toMatch(/result-video\.mp4$/);
  });
  it("no keyword falls back to RESULTS[mode]", () => {
    expect(resultFor("video", "a walk in the park")).toEqual(RESULTS.video);
    expect(resultFor("agent", "hello")).toEqual(RESULTS.agent);
  });
  it("audio always returns RESULTS.audio", () => {
    expect(resultFor("audio", "latte jingle")).toEqual(RESULTS.audio);
  });
  it("image mode never returns a video", () => {
    const x = resultFor("image", "latte poster");
    expect(x.cover).toMatch(/result-agent\.jpg$/);
    expect(x.video).toBeUndefined();
  });
  it("submitPrompt uses the matched cover", () => {
    let s = r(INITIAL_STATE, { type: "signIn", silent: true });
    s = r(s, { type: "setComposer", patch: { text: "Sneaker drop teaser" } });
    s = r(s, { type: "submitPrompt", id: "jx" });
    expect(s.jobs.find((j) => j.id === "jx")!.cover).toMatch(/usecase-sneaker\.jpg$/);
  });
});
