import { describe, expect, it } from "vitest";
import { INITIAL_STATE, storeReducer as r } from "@/app/prototypes/(app-mvp)/buzzvideo-app/app/store";
import { RESULTS, resultFor } from "@/app/prototypes/(app-mvp)/buzzvideo-app/app/data";

describe("resultFor", () => {
  it("gives each keyword group an AI-style title", () => {
    const cases: [string, string][] = [
      ["Iced latte promo", "Iced Latte Summer Pour"],
      ["Glow serum launch", "Glow Serum Reveal"],
      ["A cozy reel for our bakery croissants", "Morning Croissant Reel"],
      ["Sneaker drop teaser", "Sneaker Drop Teaser"],
      ["Four lip tint shades", "Lip Tint Swatch Set"],
      ["Mother’s Day peony bouquets", "Mother’s Day Bouquets"],
      ["Our ramen shop", "Late-Night Ramen Voiceover"],
      ["Grand opening this Saturday", "Grand Opening Weekend"],
    ];
    for (const [text, title] of cases) expect(resultFor("agent", text).title).toBe(title);
  });
  it("no keyword means no title", () => {
    expect(resultFor("agent", "hello").title).toBeUndefined();
  });
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
  it("audio always uses the RESULTS.audio cover (never a video), but still carries the title", () => {
    const x = resultFor("audio", "latte jingle");
    expect(x.cover).toBe(RESULTS.audio.cover);
    expect(x.video).toBeUndefined();
    expect(x.title).toBe("Iced Latte Summer Pour");
    expect(resultFor("audio", "A warm voiceover for our ramen shop").title).toBe("Late-Night Ramen Voiceover");
    expect(resultFor("audio", "birthday jingle")).toEqual(RESULTS.audio);
  });
  it("image mode never returns a video", () => {
    const x = resultFor("image", "latte poster");
    expect(x.cover).toMatch(/result-agent\.jpg$/);
    expect(x.video).toBeUndefined();
  });
  it("submitPrompt uses the matched cover", () => {
    let s = r(INITIAL_STATE, { type: "signIn" });
    s = r(s, { type: "setComposer", patch: { text: "Sneaker drop teaser" } });
    s = r(s, { type: "submitPrompt", id: "jx" });
    expect(s.jobs.find((j) => j.id === "jx")!.cover).toMatch(/usecase-sneaker\.jpg$/);
  });
  it("submitPrompt names the job and the new chat with the AI title", () => {
    let s = r(INITIAL_STATE, { type: "signIn" });
    s = r(s, { type: "setComposer", patch: { text: "Make a cozy reel for our bakery" } });
    s = r(s, { type: "submitPrompt", id: "jy" });
    expect(s.jobs.find((j) => j.id === "jy")!.title).toBe("Morning Croissant Reel");
    expect(s.sessions[0]).toMatchObject({ id: "jy-s", title: "Morning Croissant Reel" });
  });
  it("submitPrompt falls back to the first words of the prompt when nothing matches", () => {
    let s = r(INITIAL_STATE, { type: "signIn" });
    s = r(s, { type: "setComposer", patch: { text: "a walk in the park at dawn" } });
    s = r(s, { type: "submitPrompt", id: "jz" });
    expect(s.jobs.find((j) => j.id === "jz")!.title).toBe("A walk in the park");
    expect(s.sessions[0].title).toBe("A walk in the park");
  });
});
