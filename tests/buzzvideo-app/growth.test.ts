import { describe, expect, it } from "vitest";
import { INITIAL_STATE, isSubscribed, storeReducer as r, type StoreState } from "@/app/prototypes/(app-mvp)/buzzvideo-app/app/store";
import { CREDITS_INITIAL } from "@/app/prototypes/(app-mvp)/buzzvideo-app/app/data";

const signedIn = (day = 0): StoreState => r(r(INITIAL_STATE, { type: "appLaunched", day }), { type: "signIn" });

describe("paywall cadence", () => {
  it("first login requests the paywall on the Starter tab and marks today as shown", () => {
    const s = signedIn(3);
    expect(s.paywallRequest).toEqual({ trigger: "first_login", tab: "starter" });
    expect(s.paywallShownDay).toBe(3);
  });
  it("appLaunched same day shows nothing", () => {
    const s = r(r(signedIn(3), { type: "consumePaywallRequest" }), { type: "appLaunched", day: 3 });
    expect(s.paywallRequest).toBeNull();
    expect(s.promoOpen).toBeNull();
  });
  it("a cold start on a new day requests the daily paywall once", () => {
    let s = r(signedIn(3), { type: "consumePaywallRequest" });
    s = r(s, { type: "appLaunched", day: 4 });
    expect(s.paywallRequest).toEqual({ trigger: "daily", tab: "starter" });
    s = r(r(s, { type: "consumePaywallRequest" }), { type: "appLaunched", day: 4 });
    expect(s.paywallRequest).toBeNull();
  });
  it("subscribers never get paywall or exit offer", () => {
    let s = r(INITIAL_STATE, { type: "purchasePlan", plan: "pro", period: "yearly" });
    s = r(r(s, { type: "appLaunched", day: 1 }), { type: "signIn" });
    expect(s.paywallRequest).toBeNull();
    s = r(s, { type: "appLaunched", day: 2 });
    expect(s.paywallRequest).toBeNull();
    expect(r(s, { type: "closePaywall" }).exitOfferOpen).toBe(false);
  });
  it("openPaywall works for any trigger and defaults to Starter", () => {
    expect(r(signedIn(), { type: "openPaywall", trigger: "model_locked", tab: "pro" }).paywallRequest).toEqual({ trigger: "model_locked", tab: "pro" });
    expect(r(signedIn(), { type: "openPaywall", trigger: "manual" }).paywallRequest).toEqual({ trigger: "manual", tab: "starter" });
  });
});

describe("exit offer", () => {
  it("closing the paywall as a free user opens the exit offer once", () => {
    const s = r(signedIn(), { type: "closePaywall" });
    expect([s.exitOfferOpen, s.exitOfferUsed]).toEqual([true, true]);
  });
  it("exit offer only once per account", () => {
    const s = r(r(r(signedIn(), { type: "closePaywall" }), { type: "dismissExitOffer" }), { type: "closePaywall" });
    expect(s.exitOfferOpen).toBe(false);
  });
  it("accepting subscribes to Starter monthly and adds its credits", () => {
    const s = r(r(signedIn(), { type: "closePaywall" }), { type: "acceptExitOffer" });
    expect(s.subscription).toMatchObject({ plan: "starter", source: "app", period: "monthly" });
    expect(s.exitOfferOpen).toBe(false);
    expect(s.credits.personal).toBe(CREDITS_INITIAL.personal + 1900);
    expect(isSubscribed(s)).toBe(true);
  });
  it("web subscribers cannot buy in the app", () => {
    const web = { ...signedIn(), subscription: { plan: "pro" as const, source: "web" as const } };
    expect(r(web, { type: "purchasePlan", plan: "ultra", period: "monthly" })).toBe(web);
  });
});

import { signedInAs } from "@/app/prototypes/(app-mvp)/buzzvideo-app/app/demo";
import { CREDIT_PACKS, PROMO_CAMPAIGN } from "@/app/prototypes/(app-mvp)/buzzvideo-app/app/data";
import { promoBonus } from "@/app/prototypes/(app-mvp)/buzzvideo-app/app/store";

const live = (s: StoreState) => r(s, { type: "promoLoaded", campaign: PROMO_CAMPAIGN });
const subscribed = (day = 0) =>
  r(r(r(INITIAL_STATE, { type: "purchasePlan", plan: "pro", period: "monthly" }), { type: "appLaunched", day }), { type: "signIn" });

describe("promo popup", () => {
  /** Free,今天的付费墙已经弹过(第 1 天首登),活动在线 */
  const freeSeen = () => live(r(signedIn(1), { type: "consumePaywallRequest" }));
  it("shows to Free on the next cold start after the paywall", () => {
    const s = r(freeSeen(), { type: "appLaunched", day: 1 });
    expect(s.promoOpen).toBe(PROMO_CAMPAIGN.id);
  });
  it("never shows to subscribers or Enterprise (same as web)", () => {
    expect(r(live(subscribed(0)), { type: "appLaunched", day: 1 }).promoOpen).toBeNull();
    expect(r(live(signedInAs("enterprise", 1)), { type: "appLaunched", day: 1 }).promoOpen).toBeNull();
  });
  it("never stacks with the paywall on the same cold start; paywall wins, promo waits for the next one", () => {
    const first = r(freeSeen(), { type: "appLaunched", day: 2 });
    expect(first.paywallRequest?.trigger).toBe("daily");
    expect(first.promoOpen).toBeNull();
    const second = r(r(first, { type: "consumePaywallRequest" }), { type: "appLaunched", day: 2 });
    expect(second.promoOpen).toBe(PROMO_CAMPAIGN.id);
  });
  it("respects maxPerUser = 1", () => {
    let s = r(r(freeSeen(), { type: "appLaunched", day: 1 }), { type: "dismissPromo" });
    s = r(r(r(s, { type: "appLaunched", day: 20 }), { type: "consumePaywallRequest" }), { type: "appLaunched", day: 20 });
    expect(s.promoOpen).toBeNull();
  });
  it("CTA closes the popup and opens the paywall on Starter with the promo trigger", () => {
    const s = r(r(freeSeen(), { type: "appLaunched", day: 1 }), { type: "promoCta" });
    expect(s.promoOpen).toBeNull();
    expect(s.paywallRequest).toEqual({ trigger: "promo", tab: "starter" });
  });
  it("bonus applies to subscriptions while live", () => {
    const s = r(live(signedIn()), { type: "purchasePlan", plan: "starter", period: "monthly" });
    expect(promoBonus(s)).toBe(35);
    expect(s.credits.personal).toBe(CREDITS_INITIAL.personal + Math.round(1900 * 1.35));
  });
});

describe("credit packs", () => {
  it("free users cannot buy packs", () => {
    const s = signedIn();
    expect(r(s, { type: "buyCreditPack", packId: CREDIT_PACKS[0].id, qty: 1 })).toBe(s);
  });
  it("subscribers add pack credits × quantity", () => {
    const s = r(subscribed(), { type: "buyCreditPack", packId: "pack-2000", qty: 3 });
    expect(s.credits.personal).toBe(CREDITS_INITIAL.personal + 4900 + 6000);
  });
});

describe("free users and video", () => {
  it("submitting a video request as a free user opens the paywall and keeps the draft", () => {
    let s = r(signedIn(), { type: "consumePaywallRequest" });
    s = r(s, { type: "setAiConsent", on: true });
    s = r(r(s, { type: "setComposer", patch: { mode: "video", text: "A sneaker ad" } }), { type: "submitPrompt", id: "v1" });
    expect(s.paywallRequest).toEqual({ trigger: "video_locked", tab: "starter" });
    expect(s.jobs.find((j) => j.id === "v1")).toBeUndefined();
    expect(s.composer.text).toBe("A sneaker ad");
  });
  it("organization workspaces are not blocked by the personal plan", () => {
    let s = r(r(signedIn(), { type: "setAiConsent", on: true }), { type: "setWorkspace", workspace: "presslogic" });
    s = r(r(s, { type: "setComposer", patch: { mode: "video", text: "Org video" } }), { type: "submitPrompt", id: "v2" });
    expect(s.jobs.some((j) => j.id === "v2")).toBe(true);
  });
});

describe("not enough credits", () => {
  const broke = (s: StoreState): StoreState => ({ ...s, credits: { ...s.credits, personal: 10 } });
  const send = (s: StoreState) =>
    r(r(r(s, { type: "setAiConsent", on: true }), { type: "setComposer", patch: { text: "hi" } }), { type: "submitPrompt", id: "x" });
  const lastNotice = (s: StoreState) => s.messages[s.currentSessionId!].at(-1);
  it("free users get See plans", () => expect(lastNotice(send(broke(r(signedIn(), { type: "consumePaywallRequest" }))))).toMatchObject({ cta: "plans" }));
  it("subscribers get Top up", () => expect(lastNotice(send(broke(subscribed())))).toMatchObject({ cta: "topUp" }));
  it("organizations get no CTA", () => {
    const org = r(subscribed(), { type: "setWorkspace", workspace: "presslogic" });
    const s = send({ ...org, credits: { personal: 10, presslogic: 10 } });
    expect(lastNotice(s)).not.toHaveProperty("cta");
  });
});

import { USE_CASES } from "@/app/prototypes/(app-mvp)/buzzvideo-app/app/data";
import { GENERATION_MS, deepLinkUseCase, hasWatermark, needsAtt, showWebLink } from "@/app/prototypes/(app-mvp)/buzzvideo-app/app/store";

describe("ATT", () => {
  it("is needed after onboarding and before login until answered", () => {
    let s = r(INITIAL_STATE, { type: "completeOnboarding" });
    expect(needsAtt(s)).toBe(true);
    s = r(r(s, { type: "requestPermission", kind: "tracking" }), { type: "answerPermission", value: "denied" });
    expect(needsAtt(s)).toBe(false);
  });
});

describe("marketing push", () => {
  const generate = () => {
    let s = r(r(signedIn(), { type: "consumePaywallRequest" }), { type: "setAiConsent", on: true });
    // Free 能生成的是图片(Agent 到视频那步会停,见 decisions)
    s = r(r(s, { type: "setComposer", patch: { mode: "image", text: "Latte ad" } }), { type: "submitPrompt", id: "g1" });
    return r(s, { type: "tick", ms: GENERATION_MS });
  };
  it("asks once when the first result of the session is ready", () => {
    const s = generate();
    expect([s.marketingPromptOpen, s.marketingAsked]).toEqual([true, true]);
    let again = r(r(s, { type: "answerMarketingPrompt", on: false }), { type: "setComposer", patch: { text: "Again" } });
    again = r(again, { type: "submitPrompt", id: "g2" });
    expect(r(again, { type: "tick", ms: GENERATION_MS }).marketingPromptOpen).toBe(false);
  });
  it("answering on turns Offers & news on", () => expect(r(generate(), { type: "answerMarketingPrompt", on: true }).marketingPush).toBe(true));
  it("campaign push only reaches users who turned Offers & news on", () => {
    const base = r(signedIn(), { type: "promoLoaded", campaign: PROMO_CAMPAIGN });
    expect(r(base, { type: "campaignPushReceived", campaignId: PROMO_CAMPAIGN.id }).campaignBanner).toBeNull();
    const on = r(r(base, { type: "setMarketingPush", on: true }), { type: "setPermission", kind: "push", value: "granted" });
    expect(r(on, { type: "campaignPushReceived", campaignId: PROMO_CAMPAIGN.id }).campaignBanner).toBe(PROMO_CAMPAIGN.id);
  });
});

describe("rating prompt", () => {
  const done = () => signedIn().jobs.find((j) => j.status === "done")!;
  it("opens after the first save, only once", () => {
    const s = r(signedIn(), { type: "workSaved", id: done().id });
    expect(s.ratingPromptOpen).toBe(true);
    expect(r(r(s, { type: "dismissRating" }), { type: "workShared", id: done().id }).ratingPromptOpen).toBe(false);
  });
  it("is skipped for users who reported content", () => {
    const s = r(r(signedIn(), { type: "reportContent" }), { type: "workSaved", id: done().id });
    expect(s.ratingPromptOpen).toBe(false);
  });
});

describe("invite rewards", () => {
  it("grants 1,500 credits per subscribed friend, up to 10", () => {
    let s = signedIn();
    for (let i = 0; i < 12; i++) s = r(s, { type: "inviteRewardGranted" });
    expect(s.inviteRewards).toBe(10);
    expect(s.credits.personal).toBe(CREDITS_INITIAL.personal + 15000);
  });
});

describe("deep links", () => {
  it("resolves to the use case", () => {
    const s = r(INITIAL_STATE, { type: "openDeepLink", useCaseId: USE_CASES[0].id });
    expect(deepLinkUseCase(s)?.id).toBe(USE_CASES[0].id);
  });
  it("unknown deep link is ignored", () => {
    expect(r(INITIAL_STATE, { type: "openDeepLink", useCaseId: "nope" }).deepLink).toBeNull();
  });
});

describe("watermark and web link", () => {
  it("free personal results carry a watermark; subscribers and orgs do not", () => {
    const s = signedIn();
    const job = s.jobs.find((j) => j.workspace === "personal")!;
    expect(hasWatermark(s, job)).toBe(true);
    expect(hasWatermark(r(s, { type: "purchasePlan", plan: "starter", period: "monthly" }), job)).toBe(false);
    expect(hasWatermark(s, { ...job, workspace: "presslogic" })).toBe(false);
  });
  it("web payment links only show in the US", () => {
    expect(showWebLink(INITIAL_STATE)).toBe(true);
    expect(showWebLink(r(INITIAL_STATE, { type: "setRegion", region: "other" }))).toBe(false);
  });
});

describe("final review fixes", () => {
  const starter = () => r(r(signedIn(), { type: "consumePaywallRequest" }), { type: "purchasePlan", plan: "starter", period: "monthly" });
  it("Starter defaults video to an unlocked model", () => {
    const s = r(starter(), { type: "setComposer", patch: { mode: "video" } });
    expect(s.composer.model).toBe("seedance-2-fast");
  });
  it("submitting a locked model opens the Pro paywall and keeps the draft", () => {
    let s = r(starter(), { type: "setAiConsent", on: true });
    s = r(r(s, { type: "setComposer", patch: { mode: "video", model: "seedance-2-5", text: "Serum ad" } }), { type: "submitPrompt", id: "lk" });
    expect(s.paywallRequest).toEqual({ trigger: "model_locked", tab: "pro" });
    expect(s.jobs.some((j) => j.id === "lk")).toBe(false);
    expect(s.composer.text).toBe("Serum ad");
  });
  it("retrying a locked job as Starter points See plans at the Pro paywall", () => {
    const starterUser = r(r(signedIn(), { type: "setAiConsent", on: true }), { type: "purchasePlan", plan: "starter", period: "monthly" });
    const s = r(starterUser, { type: "retryJob", id: "j-serum" });
    const list = s.messages[s.jobs.find((j) => j.id === "j-serum")!.sessionId];
    expect(list.at(-1)).toMatchObject({ cta: "model" });
  });
  it("opening from a deep link on a new day skips the daily paywall", () => {
    let s = r(signedIn(1), { type: "consumePaywallRequest" });
    s = r(r(s, { type: "openDeepLink", useCaseId: USE_CASES[0].id }), { type: "appLaunched", day: 2 });
    expect(s.paywallRequest).toBeNull();
  });
  it("users who already turned Offers & news on are not asked again", () => {
    let s = r(r(r(signedIn(), { type: "consumePaywallRequest" }), { type: "setAiConsent", on: true }), { type: "setMarketingPush", on: true });
    s = r(r(s, { type: "setComposer", patch: { text: "Latte" } }), { type: "submitPrompt", id: "m1" });
    expect(r(s, { type: "tick", ms: GENERATION_MS }).marketingPromptOpen).toBe(false);
  });
  it("campaign push needs system push permission", () => {
    const base = r(r(signedIn(), { type: "promoLoaded", campaign: PROMO_CAMPAIGN }), { type: "setMarketingPush", on: true });
    expect(r(base, { type: "campaignPushReceived", campaignId: PROMO_CAMPAIGN.id }).campaignBanner).toBeNull();
    const granted = r(base, { type: "setPermission", kind: "push", value: "granted" });
    expect(r(granted, { type: "campaignPushReceived", campaignId: PROMO_CAMPAIGN.id }).campaignBanner).toBe(PROMO_CAMPAIGN.id);
  });
});

describe("decisions 2026-10-14", () => {
  const ready = () => r(r(signedIn(), { type: "consumePaywallRequest" }), { type: "setAiConsent", on: true });
  const send = (s: StoreState, text: string, id: string) => r(r(s, { type: "setComposer", patch: { text } }), { type: "submitPrompt", id });
  it("free users out of credits get the paywall opened automatically", () => {
    const s = send({ ...ready(), credits: { ...ready().credits, personal: 5 } }, "Image ad", "c1");
    expect(s.paywallRequest).toEqual({ trigger: "low_credits", tab: "starter" });
  });
  it("subscribers out of credits get the top-up sheet requested", () => {
    const sub = r(ready(), { type: "purchasePlan", plan: "pro", period: "monthly" });
    const s = send({ ...sub, credits: { ...sub.credits, personal: 5 } }, "Image ad", "c2");
    expect(s.topUpRequested).toBe(true);
    expect(r(s, { type: "consumeTopUpRequest" }).topUpRequested).toBe(false);
  });
  it("organizations out of credits get neither", () => {
    const org = r(ready(), { type: "setWorkspace", workspace: "presslogic" });
    const s = send({ ...org, credits: { ...org.credits, presslogic: 5 } }, "Image ad", "c3");
    expect([s.paywallRequest, s.topUpRequested]).toEqual([null, false]);
  });
  it("free agent requests show the plan, then stop at the video step with the paywall", () => {
    const s = send(ready(), "Iced latte ad", "a1");
    const list = s.messages[s.currentSessionId!];
    expect(list.some((m) => m.role === "agent" && m.kind === "plan")).toBe(true);
    expect(list.at(-1)).toMatchObject({ kind: "notice", cta: "video" });
    expect(s.jobs.some((j) => j.id === "a1")).toBe(false);
    expect(s.credits.personal).toBe(CREDITS_INITIAL.personal);
    expect(s.paywallRequest).toEqual({ trigger: "video_locked", tab: "starter" });
  });
  it("free image requests still run", () => {
    const s = send(r(ready(), { type: "setComposer", patch: { mode: "image" } }), "Poster", "i1");
    expect(s.jobs.some((j) => j.id === "i1")).toBe(true);
  });
  it("no rating prompt when the latest generation failed", () => {
    let s = r(ready(), { type: "purchasePlan", plan: "pro", period: "monthly" });
    s = send(s, "Latte", "f1");
    s = { ...s, jobs: s.jobs.map((j) => (j.id === "f1" ? { ...j, status: "failed" as const } : j)) };
    s = r(s, { type: "workSaved", id: "j-latte" });
    expect([s.ratingPromptOpen, s.ratingPrompted]).toEqual([false, false]);
  });
});

describe("Ultra volume tiers", () => {
  it("buying Ultra 4x adds 35,600 credits and records the multiplier", () => {
    const s = r(r(INITIAL_STATE, { type: "signIn" }), { type: "purchasePlan", plan: "ultra", period: "monthly", multiplier: 4 });
    expect(s.subscription).toMatchObject({ plan: "ultra", source: "app", period: "monthly", multiplier: 4 });
    expect(s.credits.personal).toBe(CREDITS_INITIAL.personal + 35600);
  });
  it("other plans ignore the multiplier", () => {
    const s = r(r(INITIAL_STATE, { type: "signIn" }), { type: "purchasePlan", plan: "pro", period: "monthly", multiplier: 4 });
    expect(s.subscription).toMatchObject({ plan: "pro", source: "app", period: "monthly" });
    expect(s.credits.personal).toBe(CREDITS_INITIAL.personal + 4900);
  });
});

describe("free users cannot regenerate or retry video", () => {
  const free = () => r(r(r(INITIAL_STATE, { type: "signIn" }), { type: "consumePaywallRequest" }), { type: "setAiConsent", on: true });
  it("regenerating an agent video opens the Starter paywall without charging", () => {
    const s0 = free();
    const s = r(s0, { type: "regenerateJob", id: "j-latte", newId: "rg" });
    expect(s.paywallRequest).toEqual({ trigger: "video_locked", tab: "starter" });
    expect(s.jobs).toBe(s0.jobs);
    expect(s.credits).toEqual(s0.credits);
  });
  it("retrying a Seedance 2.0 video opens the Pro paywall", () => {
    const s0 = free();
    const s = r(s0, { type: "retryJob", id: "j-serum" });
    expect(s.paywallRequest).toEqual({ trigger: "model_locked", tab: "pro" });
    expect(s.jobs.find((j) => j.id === "j-serum")?.status).toBe("failed");
  });
  it("free users can still regenerate images", () => {
    const s0 = free();
    const img = s0.jobs.find((j) => j.mode === "image" && j.workspace === "personal");
    if (!img) return;
    expect(r(s0, { type: "regenerateJob", id: img.id, newId: "rg2" }).jobs.some((j) => j.id === "rg2")).toBe(true);
  });
});

describe("plan changes for app subscribers", () => {
  const sub = (plan: "starter" | "pro" | "ultra", period: "monthly" | "yearly", multiplier?: 1 | 2 | 4) =>
    r(r(r(INITIAL_STATE, { type: "appLaunched", day: 10 }), { type: "signIn" }), { type: "purchasePlan", plan, period, ...(multiplier ? { multiplier } : {}) });
  it("a new subscription renews after one period", () => {
    expect(sub("pro", "yearly").subscription.renewDay).toBe(10 + 365);
    expect(sub("pro", "monthly").subscription.renewDay).toBe(10 + 30);
  });
  it("upgrading takes effect immediately and replaces subscription credits with the new plan's", () => {
    const s0 = sub("pro", "yearly");
    const s = r(s0, { type: "purchasePlan", plan: "ultra", period: "monthly", multiplier: 2 });
    expect(s.subscription).toMatchObject({ plan: "ultra", period: "monthly", multiplier: 2 });
    expect(s.subscription.pendingChange).toBeUndefined();
    expect(s.credits.personal).toBe(s0.credits.personal - s0.subscriptionCredits + 17800);
    expect(s.subscriptionCredits).toBe(17800);
  });
  it("downgrading is scheduled for the next renewal and keeps the current plan", () => {
    const s0 = sub("pro", "yearly");
    const s = r(s0, { type: "purchasePlan", plan: "starter", period: "yearly" });
    expect(s.subscription).toMatchObject({ plan: "pro", period: "yearly", pendingChange: { plan: "starter", period: "yearly" } });
    expect(s.credits).toEqual(s0.credits);
  });
  it("switching billing period on the same plan is scheduled too", () => {
    expect(r(sub("pro", "yearly"), { type: "purchasePlan", plan: "pro", period: "monthly" }).subscription.pendingChange).toEqual({ plan: "pro", period: "monthly" });
  });
  it("lowering the Ultra multiplier is a downgrade", () => {
    const s = r(sub("ultra", "monthly", 4), { type: "purchasePlan", plan: "ultra", period: "monthly", multiplier: 1 });
    expect(s.subscription).toMatchObject({ plan: "ultra", multiplier: 4, pendingChange: { plan: "ultra", period: "monthly" } });
  });
  it("buying the current plan again does nothing", () => {
    const s0 = sub("pro", "yearly");
    expect(r(s0, { type: "purchasePlan", plan: "pro", period: "yearly" })).toBe(s0);
  });
  it("subscribers open the paywall on their own plan", () => {
    expect(r(sub("pro", "yearly"), { type: "openPaywall", trigger: "manual" }).paywallRequest).toEqual({ trigger: "manual", tab: "pro" });
  });
});

describe("cold start closes transient overlays", () => {
  it("clears open sheets and prompts but keeps what already happened", () => {
    let s = r(r(signedIn(1), { type: "consumePaywallRequest" }), { type: "closePaywall" });
    s = { ...s, ratingPromptOpen: true, marketingPromptOpen: true, permissionPrompt: { kind: "camera" }, campaignBanner: "x", pushBanner: { jobId: "j-latte" }, aiConsentPrompt: { pending: { type: "signOut" } } };
    s = r(s, { type: "appLaunched", day: 2 });
    expect([s.exitOfferOpen, s.ratingPromptOpen, s.marketingPromptOpen, s.permissionPrompt, s.campaignBanner, s.pushBanner, s.aiConsentPrompt]).toEqual([false, false, false, null, null, null, null]);
    expect(s.exitOfferUsed).toBe(true);
    expect(s.paywallRequest?.trigger).toBe("daily");
  });
});

describe("free video with a model Starter cannot use", () => {
  const free = () => r(r(r(INITIAL_STATE, { type: "signIn" }), { type: "consumePaywallRequest" }), { type: "setAiConsent", on: true });
  const send = (model: string) =>
    r(r(free(), { type: "setComposer", patch: { mode: "video", model, text: "Serum ad" } }), { type: "submitPrompt", id: "fv" });
  it("opens the Pro paywall once for Seedance 2.5", () => {
    expect(send("seedance-2-5").paywallRequest).toEqual({ trigger: "model_locked", tab: "pro" });
  });
  it("opens the Starter paywall for models Starter includes", () => {
    expect(send("seedance-2-fast").paywallRequest).toEqual({ trigger: "video_locked", tab: "starter" });
  });
});

describe("minor fixes", () => {
  const starter = () => r(r(r(INITIAL_STATE, { type: "signIn" }), { type: "setAiConsent", on: true }), { type: "purchasePlan", plan: "starter", period: "monthly" });
  it("locked-model copy names the actual model", () => {
    const base = starter();
    const s = { ...base, jobs: base.jobs.map((j) => (j.id === "j-serum" ? { ...j, model: "seedance-2-5" } : j)) };
    const out = r(s, { type: "retryJob", id: "j-serum" });
    expect(out.paywallRequest).toEqual({ trigger: "model_locked", tab: "pro" });
    expect(out.messages["s-serum"].at(-1)).toMatchObject({ text: "Seedance 2.5 is included with Pro. See plans to upgrade." });
  });
  it("free agent stop uses its own CTA so analytics records video_locked", () => {
    const s = r(r(r(r(INITIAL_STATE, { type: "signIn" }), { type: "setAiConsent", on: true }), { type: "setComposer", patch: { text: "Latte ad" } }), { type: "submitPrompt", id: "fa" });
    expect(s.messages[s.currentSessionId!].at(-1)).toMatchObject({ cta: "video" });
  });
  it("each campaign is pushed at most once", () => {
    let s = r(r(r(signedIn(), { type: "promoLoaded", campaign: PROMO_CAMPAIGN }), { type: "setMarketingPush", on: true }), { type: "setPermission", kind: "push", value: "granted" });
    s = r(r(s, { type: "campaignPushReceived", campaignId: PROMO_CAMPAIGN.id }), { type: "dismissCampaignBanner" });
    expect(r(s, { type: "campaignPushReceived", campaignId: PROMO_CAMPAIGN.id }).campaignBanner).toBeNull();
  });
  it("turning offers on asks for push permission when undetermined", () => {
    const s = r({ ...signedIn(), marketingPromptOpen: true }, { type: "answerMarketingPrompt", on: true });
    expect(s.permissionPrompt).toEqual({ kind: "push" });
  });
  it("turning offers on with push denied points to Settings", () => {
    const denied = r(signedIn(), { type: "setPermission", kind: "push", value: "denied" });
    const s = r({ ...denied, marketingPromptOpen: true }, { type: "answerMarketingPrompt", on: true });
    expect(s.toast).toBe("Turn on notifications in Settings to get offers");
    expect(s.marketingPush).toBe(true);
  });
});

import { EXIT_OFFER_MS, exitOfferLive } from "@/app/prototypes/(app-mvp)/buzzvideo-app/app/store";

describe("exit offer lasts 24 hours", () => {
  const T = 1_800_000_000_000;
  const shown = () => r(r(signedIn(), { type: "consumePaywallRequest" }), { type: "closePaywall", now: T });
  it("starts a real 24h window when shown", () => {
    const s = shown();
    expect(s.exitOfferExpiresAt).toBe(T + EXIT_OFFER_MS);
    expect(exitOfferLive(s, T + 60 * 60_000)).toBe(true);
    expect(exitOfferLive(s, T + EXIT_OFFER_MS)).toBe(false);
  });
  it("closing the sheet keeps the offer; it can be reopened while live", () => {
    let s = r(shown(), { type: "dismissExitOffer" });
    expect(s.exitOfferOpen).toBe(false);
    s = r(s, { type: "openExitOffer", now: T + 3_600_000 });
    expect(s.exitOfferOpen).toBe(true);
  });
  it("cannot be reopened or accepted after it expires", () => {
    const s = r(r(shown(), { type: "dismissExitOffer" }), { type: "openExitOffer", now: T + EXIT_OFFER_MS + 1 });
    expect(s.exitOfferOpen).toBe(false);
    const after = r(s, { type: "acceptExitOffer", now: T + EXIT_OFFER_MS + 1 });
    expect(after.subscription.plan).toBe("free");
  });
  it("accepting ends the window", () => {
    const s = r(shown(), { type: "acceptExitOffer", now: T + 1000 });
    expect(s.subscription.plan).toBe("starter");
    expect(exitOfferLive(s, T + 2000)).toBe(false);
  });
});
