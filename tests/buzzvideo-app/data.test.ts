import { describe, expect, it } from "vitest";
import { INITIAL_STATE, storeReducer as r } from "@/app/prototypes/(app-mvp)/buzzvideo-app/app/store";
import { CREDIT_PACKS, CREDITS_INITIAL, ULTRA_TIERS, EXIT_OFFER, FREE_CREDITS, PROMO_CAMPAIGN, SUBSCRIPTION_PLANS, isModelLocked, perMonth, planById, RESULTS, resultFor, savePct } from "@/app/prototypes/(app-mvp)/buzzvideo-app/app/data";

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
    let s = r({ ...INITIAL_STATE, aiConsent: true, subscription: { plan: "starter", source: "app" } }, { type: "signIn" });
    s = r(s, { type: "setComposer", patch: { text: "Sneaker drop teaser" } });
    s = r(s, { type: "submitPrompt", id: "jx" });
    expect(s.jobs.find((j) => j.id === "jx")!.cover).toMatch(/usecase-sneaker\.jpg$/);
  });
  it("submitPrompt names the job and the new chat with the AI title", () => {
    let s = r({ ...INITIAL_STATE, aiConsent: true, subscription: { plan: "starter", source: "app" } }, { type: "signIn" });
    s = r(s, { type: "setComposer", patch: { text: "Make a cozy reel for our bakery" } });
    s = r(s, { type: "submitPrompt", id: "jy" });
    expect(s.jobs.find((j) => j.id === "jy")!.title).toBe("Morning Croissant Reel");
    expect(s.sessions[0]).toMatchObject({ id: "jy-s", title: "Morning Croissant Reel" });
  });
  it("submitPrompt falls back to the first words of the prompt when nothing matches", () => {
    let s = r({ ...INITIAL_STATE, aiConsent: true, subscription: { plan: "starter", source: "app" } }, { type: "signIn" });
    s = r(s, { type: "setComposer", patch: { text: "a walk in the park at dawn" } });
    s = r(s, { type: "submitPrompt", id: "jz" });
    expect(s.jobs.find((j) => j.id === "jz")!.title).toBe("A walk in the park");
    expect(s.sessions[0].title).toBe("A walk in the park");
  });
});

describe("subscription plans", () => {
  it("prices, yearly prices and credits match buzzvideo.ai/pricing", () => {
    expect(SUBSCRIPTION_PLANS.map((p) => [p.id, p.monthly, p.yearly, p.credits, p.videos])).toEqual([
      ["starter", 19, 168, 1900, 7],
      ["pro", 49, 420, 4900, 18],
      ["ultra", 89, 756, 8900, 34],
    ]);
    expect(SUBSCRIPTION_PLANS.map(perMonth)).toEqual([14, 35, 63]);
    expect(planById("pro").popular).toBe(true);
    expect(SUBSCRIPTION_PLANS.filter((p) => p.popular).map((p) => p.id)).toEqual(["pro"]);
  });
  it("free users start with 500 one-time credits", () => {
    expect(FREE_CREDITS).toBe(500);
    expect(CREDITS_INITIAL.personal).toBe(FREE_CREDITS);
  });
  it("credit packs are $0.01 per credit, 8 tiers, 5,000 is popular", () => {
    expect(CREDIT_PACKS.map((p) => p.credits)).toEqual([1000, 2000, 3500, 5000, 8000, 12000, 20000, 30000]);
    expect(CREDIT_PACKS.every((p) => p.price === p.credits / 100)).toBe(true);
    expect(CREDIT_PACKS.filter((p) => p.popular).map((p) => p.credits)).toEqual([5000]);
  });
  it("Ultra has 1x / 2x / 4x volume tiers priced like the web slider", () => {
    expect(ULTRA_TIERS.map((t) => [t.multiplier, t.credits, t.monthly, t.yearly, t.videos])).toEqual([
      [1, 8900, 89, 756, 34],
      [2, 17800, 120, 1284, 68],
      [4, 35600, 214, 2136, 136],
    ]);
    // 折扣按价格实算、向下取整，不夸大(1× 年付实际省 29.2%,不再写 30%)
    expect(ULTRA_TIERS.map((t) => [t.offMonthly, t.offYearly])).toEqual([[0, 29], [32, 39], [39, 50]]);
  });
  it("yearly save badges are computed from prices, never rounded up", () => {
    expect(SUBSCRIPTION_PLANS.map((p) => savePct(p.yearly, p.monthly * 12))).toEqual([26, 28, 29]);
  });
  it("exit offer is Starter monthly, half price for the first month", () => {
    expect(EXIT_OFFER).toEqual({ plan: "starter", period: "monthly", firstMonth: 9.5, then: 19 });
  });
  it("promo only gives bonus credits and has a default frequency of once per 7 days", () => {
    expect(PROMO_CAMPAIGN.bonusPct).toBeGreaterThan(0);
    expect(PROMO_CAMPAIGN.items.length).toBeLessThanOrEqual(3);
    expect(PROMO_CAMPAIGN.frequency).toEqual({ maxPerUser: 1, intervalDays: 7 });
  });
  it("only Seedance 2.0 is gated", () => {
    expect(isModelLocked("free", "seedance-2")).toBe(true);
    expect(isModelLocked("pro", "seedance-2")).toBe(false);
    expect(isModelLocked("free", "veo-3")).toBe(false);
  });
});
