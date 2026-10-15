import { describe, expect, it } from "vitest";
import { JOURNEYS, buildPreset } from "@/app/prototypes/(app-mvp)/buzzvideo-app/review/journeys";
import { surfaceOf } from "@/app/prototypes/(app-mvp)/buzzvideo-app/review/surface";
import { NOTES } from "@/app/prototypes/(app-mvp)/buzzvideo-app/review/notes";

const landing = (id: string) => {
  const { state, nav } = buildPreset(JOURNEYS.find((x) => x.id === id)!);
  return surfaceOf(state, nav);
};

describe("journeys", () => {
  it("ids are unique", () => expect(new Set(JOURNEYS.map((j) => j.id)).size).toBe(JOURNEYS.length));
  it.each(JOURNEYS.map((j) => [j.id, j] as const))("%s lands on a surface that has notes", (_id, j) => {
    const { state, nav } = buildPreset(j);
    const key = surfaceOf(state, nav);
    expect(NOTES[key], key).toBeDefined();
  });
  it("lands each key journey on the right surface", () => {
    expect(landing("first-paywall")).toBe("plans");
    expect(landing("exit-offer")).toBe("exitOffer");
    expect(landing("att")).toBe("att");
    expect(landing("att-system")).toBe("perm-tracking");
    expect(landing("video-locked")).toBe("plans");
    expect(landing("promo-popup")).toBe("promo");
    expect(landing("low-member")).toBe("sheet-topUp");
    expect(landing("rating")).toBe("rating");
    expect(landing("marketing-optin")).toBe("marketingOptIn");
    expect(landing("invite")).toBe("inviteFriends");
  });
  it("the region journey turns the web link off", () => {
    const { state } = buildPreset(JOURNEYS.find((x) => x.id === "region-other")!);
    expect(state.region).toBe("other");
  });
});
