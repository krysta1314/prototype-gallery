import { describe, expect, it } from "vitest";
import { INITIAL_STATE, storeReducer as r } from "@/app/prototypes/(app-mvp)/buzzvideo-app/app/store";
import { PLANS, SEED_MESSAGES, planFor } from "@/app/prototypes/(app-mvp)/buzzvideo-app/app/data";

describe("planFor (Agent storyboard follows the prompt)", () => {
  it("bakery prompts get bakery beats, not the coffee script", () => {
    const p = planFor("agent", "Create a cozy 15s reel for our bakery’s morning pastries");
    expect(p.pills).toEqual(["Hook: steam off fresh croissants", "Scene: sunrise at the counter", "CTA: opening hours"]);
    expect(p.text).not.toMatch(/ice|latte|café/i);
  });
  it("gives every keyword group its own three beats and plan text", () => {
    const prompts = ["iced latte", "glow serum", "bakery croissants", "sneaker drop", "lip tint", "peony bouquet", "ramen shop", "grand opening"];
    const plans = prompts.map((t) => planFor("agent", t));
    for (const p of plans) {
      expect(p.pills).toHaveLength(3);
      expect(p.pills.map((x) => x.split(":")[0])).toEqual(["Hook", "Scene", "CTA"]);
    }
    expect(new Set(plans.map((p) => p.pills.join("|"))).size).toBe(prompts.length);
    expect(new Set(plans.map((p) => p.text)).size).toBe(prompts.length);
  });
  it("coffee prompts keep the ice-pour beats", () => {
    expect(planFor("agent", "Iced latte promo").pills[0]).toBe("Hook: ice pour close-up");
  });
  it("no keyword falls back to a generic agent plan that isn't about coffee", () => {
    const p = planFor("agent", "hello");
    expect(p).toEqual(PLANS.agent);
    expect(p.pills.join(" ")).not.toMatch(/ice|café|latte/i);
  });
  it("non-agent modes keep their own mode plan", () => {
    for (const m of ["image", "video", "audio"] as const) expect(planFor(m, "bakery croissants")).toEqual(PLANS[m]);
  });
  it("submitPrompt writes the matched plan into the chat", () => {
    let s = r({ ...INITIAL_STATE, aiConsent: true }, { type: "signIn" });
    s = r(s, { type: "setComposer", patch: { text: "Make a cozy reel for our bakery" } });
    s = r(s, { type: "submitPrompt", id: "jb" });
    const plan = s.messages["jb-s"].find((m) => m.role === "agent" && m.kind === "plan");
    expect(plan).toMatchObject({ pills: ["Hook: steam off fresh croissants", "Scene: sunrise at the counter", "CTA: opening hours"] });
  });
  it("the seeded latte chat still shows the coffee beats", () => {
    const plan = SEED_MESSAGES["s-latte"].find((m) => m.role === "agent" && m.kind === "plan");
    expect(plan).toMatchObject({ pills: ["Hook: ice pour close-up", "Scene: morning café", "CTA: 20% off today"] });
  });
});
