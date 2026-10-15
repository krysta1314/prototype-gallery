import { describe, expect, it } from "vitest";
import { demoReducer as d } from "@/app/prototypes/(app-mvp)/buzzvideo-app/app/demo";
import { INITIAL_STATE, storeReducer } from "@/app/prototypes/(app-mvp)/buzzvideo-app/app/store";

describe("demoReducer", () => {
  it("passes real actions through to the store reducer", () => {
    expect(d(INITIAL_STATE, { type: "signIn" })).toEqual(storeReducer(INITIAL_STATE, { type: "signIn" }));
  });
  it("sets plan and source without touching credits", () => {
    const s = d(INITIAL_STATE, { type: "demo/setPlan", plan: "pro", source: "web" });
    expect(s.subscription).toEqual({ plan: "pro", source: "web" });
    expect(s.credits).toEqual(INITIAL_STATE.credits);
    expect(d(s, { type: "demo/setPlan", plan: "free", source: "app" }).subscription).toEqual({ plan: "free", source: "none" });
  });
  it("sets the current workspace balance", () => {
    expect(d(INITIAL_STATE, { type: "demo/setCredits", credits: 20 }).credits.personal).toBe(20);
  });
  it("resets the exit offer and promo frequency", () => {
    const used = { ...INITIAL_STATE, exitOfferUsed: true, promoViews: { x: 1 }, promoLastDay: { x: 3 } };
    expect(d(used, { type: "demo/resetExitOffer" }).exitOfferUsed).toBe(false);
    expect(d(used, { type: "demo/resetPromo" })).toMatchObject({ promoViews: {}, promoLastDay: {} });
  });
  it("forces a permission without a prompt", () => {
    expect(d(INITIAL_STATE, { type: "demo/setPermission", kind: "tracking", value: "granted" }).permissions.tracking).toBe("granted");
  });
});
