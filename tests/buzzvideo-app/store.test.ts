import { describe, expect, it } from "vitest";
import {
  EMPTY_COMPOSER,
  GENERATION_MS,
  INITIAL_STATE,
  exitOfferLive,
  nextTier,
  memberCapCopy,
  OFFLINE_DRAFT_TOAST,
  OFFLINE_TOAST,
  OTHER_ACCOUNT_TOAST,
  PURCHASE_FAILED_TOAST,
  choiceLabel,
  SIGN_IN_FAILED_TOAST,
  pricesUnavailable,
  PURCHASE_PENDING_TOAST,
  LOW_CREDITS,
  UPLOAD_MS,
  canManageMembers,
  modelLocked,
  membersFor,
  composerFromUseCase,
  insufficientCopy,
  ownsWorkspace,
  REGENERATING_COPY,
  runningCount,
  sessionsFor,
  uploadProgress,
  worksFor,
  type Message,
  type StoreState,
} from "@/app/prototypes/(app-mvp)/buzzvideo-app/app/store";
// demoReducer 透传所有真实 action,另外接住演示 action(setRole / setCreditsLow / setWebSubscriber)
import { demoReducer as r, signedInAs } from "@/app/prototypes/(app-mvp)/buzzvideo-app/app/demo";
import { accountOf } from "@/app/prototypes/(app-mvp)/buzzvideo-app/app/accounts";
import { CREDITS_INITIAL, MODE_COST, PROMO_CAMPAIGN, USE_CASES, defaultModel, defaultModelFor } from "@/app/prototypes/(app-mvp)/buzzvideo-app/app/data";

const consented = (s: StoreState = INITIAL_STATE): StoreState => r(s, { type: "setAiConsent", on: true });
/** 已登录、能生成的用户(Starter):Free 的 Agent 停在视频那步、视频直接弹付费墙,见 growth.test */
const signedIn = (): StoreState => r(r(consented(), { type: "signIn" }), { type: "demo/setPlan", plan: "starter", source: "app", period: "monthly" });
/** 已登录的 Free 用户 */
const freeSignedIn = (): StoreState => r(consented(), { type: "signIn" });
const withText = (s: StoreState, text: string) => r(s, { type: "setComposer", patch: { text } });
const allowPush = (s: StoreState) => r(s, { type: "setPermission", kind: "push", value: "granted" });
const submit = (s: StoreState, text: string, id = "j1") => r(withText(s, text), { type: "submitPrompt", id });
const last = (s: StoreState): Message => {
  const list = s.messages[s.currentSessionId!];
  return list[list.length - 1];
};

describe("sign in", () => {
  it("signs in without raising the push prompt (it is asked on the Login screen instead)", () => {
    const s = r(INITIAL_STATE, { type: "signIn" });
    expect(s.signedIn).toBe(true);
    expect(s.permissionPrompt).toBeNull();
  });
});

describe("first-open flow", () => {
  it("starts as a fresh install", () => {
    expect([INITIAL_STATE.onboarded, INITIAL_STATE.aiConsent, INITIAL_STATE.paywallShownDay]).toEqual([false, false, null]);
  });
  it("records onboarding (AI consent is asked at the first send, not here)", () => {
    const s = r(INITIAL_STATE, { type: "completeOnboarding" });
    expect(s.onboarded).toBe(true);
    expect(s.aiConsent).toBe(false);
    expect(s.signedIn).toBe(false);
  });
  it("first sign-in of a free user requests the paywall once that day", () => {
    let s = r(INITIAL_STATE, { type: "signIn" });
    expect(s.paywallRequest?.trigger).toBe("first_login");
    expect(s.paywallShownDay).toBe(0);
    s = r(s, { type: "consumePaywallRequest" });
    expect(s.paywallRequest).toBeNull();
    s = r(r(s, { type: "signOut" }), { type: "signIn" });
    expect(s.paywallRequest).toBeNull();
  });
  it("signing out before the paywall opens clears the request but keeps the day marked", () => {
    const s = r(r(INITIAL_STATE, { type: "signIn" }), { type: "signOut" });
    expect(s.paywallRequest).toBeNull();
    expect(s.paywallShownDay).toBe(0);
  });
  it("web subscribers never get the paywall", () => {
    const s = r(r(INITIAL_STATE, { type: "demo/setWebSubscriber", on: true }), { type: "signIn" });
    expect(s.paywallRequest).toBeNull();
    expect(s.paywallShownDay).toBeNull();
  });
  it("sign out keeps the first-open flags", () => {
    let s = r(r(INITIAL_STATE, { type: "completeOnboarding" }), { type: "setAiConsent", on: true });
    s = r(r(s, { type: "signIn" }), { type: "signOut" });
    expect([s.onboarded, s.aiConsent, s.paywallShownDay]).toEqual([true, true, 0]);
  });
  it("delete account keeps device state (permissions, onboarding); AI consent resets but the new account sees the plans page again", () => {
    let s = r(r(INITIAL_STATE, { type: "completeOnboarding" }), { type: "setAiConsent", on: true });
    s = r(r(s, { type: "requestPermission", kind: "push" }), { type: "answerPermission", value: "granted" });
    s = r(r(s, { type: "signIn" }), { type: "deleteAccount" });
    expect([s.onboarded, s.aiConsent]).toEqual([true, false]);
    expect(s.permissions.push).toBe("granted");
    expect([s.paywallShownDay, s.paywallRequest]).toEqual([null, null]);
    expect(r(s, { type: "signIn" }).paywallRequest?.trigger).toBe("first_login");
  });
  it("reset (reinstall) clears everything, including device state", () => {
    let s = r(r(INITIAL_STATE, { type: "completeOnboarding" }), { type: "setAiConsent", on: true });
    s = r(r(s, { type: "requestPermission", kind: "push" }), { type: "answerPermission", value: "granted" });
    const f = r(r(s, { type: "signIn" }), { type: "reset" });
    expect([f.onboarded, f.aiConsent, f.paywallShownDay, f.paywallRequest]).toEqual([false, false, null, null]);
    expect(f.permissions.push).toBe("undetermined");
  });
});

describe("push permission on the Login screen", () => {
  it("Login mount requests push permission before sign in", () => {
    const s = r(INITIAL_STATE, { type: "requestPermission", kind: "push" });
    expect(s.signedIn).toBe(false);
    expect(s.permissionPrompt).toEqual({ kind: "push" });
  });
  it("does not ask again once answered, even after sign out and back", () => {
    let s = r(INITIAL_STATE, { type: "requestPermission", kind: "push" });
    s = r(s, { type: "answerPermission", value: "denied" });
    s = r(s, { type: "signIn" });
    s = r(s, { type: "signOut" });
    s = r(s, { type: "requestPermission", kind: "push" });
    expect(s.permissionPrompt).toBeNull();
    expect(s.permissions.push).toBe("denied");
  });
});

describe("submitPrompt", () => {
  it("creates a session, user message, plan and a running job, and charges credits", () => {
    const s = submit(signedIn(), "Make a latte ad for our cafe today");
    expect(s.currentSessionId).toBe("j1-s");
    expect(s.sessions[0]).toEqual({ id: "j1-s", title: "Iced Latte Summer Pour", updatedAt: 4, pinned: false, workspace: "personal" });
    expect(s.messages["j1-s"].map((m) => (m.role === "user" ? "user" : m.kind))).toEqual(["user", "plan", "job"]);
    expect(s.jobs[0]).toMatchObject({ id: "j1", status: "running", mode: "agent", workspace: "personal", sessionId: "j1-s", elapsedMs: 0 });
    expect(s.credits.personal).toBe(signedIn().credits.personal - MODE_COST.agent);
    expect(s.composer.text).toBe("");
    expect(s.composer.attachments).toEqual([]);
  });
  it("appends to the current session", () => {
    let s = r(signedIn(), { type: "selectSession", id: "s-latte" });
    const before = s.messages["s-latte"].length;
    s = submit(s, "Make it warmer");
    expect(s.messages["s-latte"]).toHaveLength(before + 3);
    expect(s.sessions).toHaveLength(INITIAL_STATE.sessions.length);
    expect(s.jobs[0].sessionId).toBe("s-latte");
  });
  it("keeps the mode and model for the next prompt", () => {
    let s = r(r(signedIn(), { type: "purchasePlan", plan: "starter", period: "monthly" }), { type: "setComposer", patch: { mode: "video", model: "veo-3" } });
    s = submit(s, "A sneaker shot");
    expect(s.composer).toMatchObject({ mode: "video", model: "veo-3", text: "" });
    expect(s.jobs[0]).toMatchObject({ mode: "video", model: "veo-3" });
  });
  it("ignores an empty prompt without attachments", () => {
    const s0 = signedIn();
    expect(r(s0, { type: "submitPrompt", id: "x" })).toBe(s0);
  });
  it("refuses blocked content without charging", () => {
    const s = submit(signedIn(), "make a deepfake of a celebrity", "x");
    expect(s.jobs.find((j) => j.id === "x")).toBeUndefined();
    expect(last(s)).toMatchObject({ role: "agent", kind: "notice" });
    expect(s.credits.personal).toBe(signedIn().credits.personal);
  });
  it("shows the personal low-credit notice and creates no job", () => {
    let s = r(signedIn(), { type: "demo/setCreditsLow", low: true });
    s = submit(s, "Make a latte ad", "x");
    expect(s.jobs.find((j) => j.id === "x")).toBeUndefined();
    expect(last(s)).toMatchObject({ kind: "notice", text: insufficientCopy(s) });
    expect(insufficientCopy(s)).not.toMatch(/admin/i);
  });
  it("tells organization members to contact their admin", () => {
    let s = r(signedIn(), { type: "setWorkspace", workspace: "presslogic" });
    s = r(s, { type: "demo/setCreditsLow", low: true });
    expect(insufficientCopy(s)).toMatch(/admin/i);
  });
  it("multiplies the cost by the batch count", () => {
    let s = r(signedIn(), { type: "setComposer", patch: { mode: "image", model: "seedream-5", batch: 3 } });
    s = submit(s, "Three posters");
    expect(s.credits.personal).toBe(signedIn().credits.personal - MODE_COST.image * 3);
  });
});

describe("tick", () => {
  it("completes a job after GENERATION_MS and shows the push banner when push is allowed", () => {
    let s = submit(allowPush(signedIn()), "hi");
    s = r(s, { type: "tick", ms: GENERATION_MS - 1 });
    expect(s.jobs[0].status).toBe("running");
    s = r(s, { type: "tick", ms: 1 });
    expect(s.jobs[0].status).toBe("done");
    expect(s.pushBanner).toEqual({ jobId: "j1" });
  });
  it("does not show the banner when push is denied", () => {
    let s = r(signedIn(), { type: "setPermission", kind: "push", value: "denied" });
    s = submit(s, "hi");
    s = r(s, { type: "tick", ms: GENERATION_MS });
    expect(s.jobs[0].status).toBe("done");
    expect(s.pushBanner).toBeNull();
  });
  it("returns the same state object when nothing is running or uploading", () => {
    const s = signedIn();
    expect(r(s, { type: "tick", ms: 250 })).toBe(s);
  });
  it("advances uploads from the phone", () => {
    let s = r(signedIn(), { type: "addAttachments", items: [{ id: "a1", uri: "/x.jpg", kind: "photo" }] });
    expect(uploadProgress(s, "a1")).toBe(0);
    s = r(s, { type: "tick", ms: UPLOAD_MS / 2 });
    expect(uploadProgress(s, "a1")).toBe(0.5);
    s = r(s, { type: "tick", ms: UPLOAD_MS });
    expect(uploadProgress(s, "a1")).toBe(1);
  });
  it("treats library attachments as already uploaded", () => {
    const s = r(signedIn(), { type: "addAttachments", items: [{ id: "a1", uri: "/x.jpg", kind: "photo", uploaded: true }] });
    expect(s.uploads).toEqual([]);
    expect(uploadProgress(s, "a1")).toBe(1);
    expect(s.composer.attachments.map((a) => a.id)).toEqual(["a1"]);
  });
});

describe("simulatePush", () => {
  it("finishes every running job and shows a banner", () => {
    let s = submit(allowPush(signedIn()), "one", "j1");
    s = submit(s, "two", "j2");
    s = r(s, { type: "simulatePush" });
    expect(s.jobs.filter((j) => j.status === "running")).toEqual([]);
    expect(s.pushBanner).toEqual({ jobId: "j2" });
  });
  it("shows a banner for the latest finished job when nothing is running", () => {
    const s = r(allowPush(signedIn()), { type: "simulatePush" });
    expect(s.pushBanner).toEqual({ jobId: "j-latte" });
  });
  it("shows nothing when push is not allowed", () => {
    const s = r(signedIn(), { type: "simulatePush" });
    expect(s.pushBanner).toBeNull();
  });
});

describe("locked model (Seedance 2.0) on retry / regenerate", () => {
  const COPY = "Seedance 2.0 is included with Pro. See plans to upgrade.";
  const orgLocked = (): StoreState => {
    const s = signedIn();
    const serum = s.jobs.find((j) => j.id === "j-serum")!;
    return { ...s, jobs: [{ ...serum, id: "j-org", workspace: "presslogic", sessionId: "s-opening", status: "failed" }, ...s.jobs] };
  };
  it("retry on Starter: no run, no charge, opens the paywall on Pro like a fresh send, notice to switch model", () => {
    const s0 = signedIn();
    const s = r(s0, { type: "retryJob", id: "j-serum" });
    expect(s.jobs.find((j) => j.id === "j-serum")!.status).toBe("failed");
    expect(s.credits).toEqual(s0.credits);
    expect(s.paywallRequest).toEqual({ trigger: "model_locked", tab: "pro" });
    const msgs = s.messages["s-serum"];
    expect(msgs[msgs.length - 1]).toMatchObject({ kind: "notice", text: COPY, cta: "model" });
  });
  it("regenerate on Starter: no new job, no charge, opens the paywall on Pro", () => {
    const s0 = signedIn();
    const s = r(s0, { type: "regenerateJob", id: "j-serum", newId: "j9" });
    expect(s.jobs).toEqual(s0.jobs);
    expect(s.credits).toEqual(s0.credits);
    expect(s.paywallRequest).toEqual({ trigger: "model_locked", tab: "pro" });
  });
  it("org workspace: the Enterprise contract includes every model, so it reruns", () => {
    const s0 = orgLocked();
    expect(r(s0, { type: "retryJob", id: "j-org" }).jobs.find((j) => j.id === "j-org")!.status).toBe("running");
    expect(r(s0, { type: "regenerateJob", id: "j-org", newId: "j9" }).jobs[0]).toMatchObject({ id: "j9", status: "running" });
  });
  it("unlocked (Pro) still retries and regenerates", () => {
    const pro = r(signedIn(), { type: "purchasePlan", plan: "pro", period: "monthly" });
    expect(r(pro, { type: "retryJob", id: "j-serum" }).jobs.find((j) => j.id === "j-serum")!.status).toBe("running");
    expect(r(pro, { type: "regenerateJob", id: "j-serum", newId: "j9" }).jobs[0]).toMatchObject({ id: "j9", status: "running" });
  });
});

describe("rerun rules match a fresh send (cross-account audit)", () => {
  it("retrying a failed job charges again, since the failure refunded it", () => {
    const pro = signedInAs("pro", 1);
    const s = r(pro, { type: "retryJob", id: "j-serum" });
    expect(s.credits.personal).toBe(pro.credits.personal - MODE_COST.video);
  });
  it("rerun with too few credits opens top-up for members and the paywall for Free", () => {
    const low = r(signedInAs("pro", 1), { type: "demo/setCredits", credits: 5 });
    expect(r(low, { type: "regenerateJob", id: "j-latte", newId: "j9" }).topUpRequested).toBe(true);
    expect(r(low, { type: "retryJob", id: "j-serum" }).topUpRequested).toBe(true);
  });
  it("rerun respects the parallel limit", () => {
    let s = signedInAs("starter", 1);
    for (const id of ["a", "b", "c", "d"]) s = r(r(s, { type: "setComposer", patch: { mode: "image", text: id } }), { type: "submitPrompt", id });
    const next = r(s, { type: "regenerateJob", id: "j-latte", newId: "j9" });
    expect(next.jobs.length).toBe(s.jobs.length);
    expect(next.toast).toMatch(/up to 4/);
  });
  it("in an Enterprise org every model is unlocked and video defaults to the top model", () => {
    const e = signedInAs("enterprise", 1);
    expect(modelLocked(e, "seedance-2")).toBe(false);
    expect(r(e, { type: "setComposer", patch: { mode: "video" } }).composer.model).toBe(defaultModelFor("video", "ultra"));
    const personal = r(e, { type: "setWorkspace", workspace: "personal" });
    expect(modelLocked(personal, "seedance-2")).toBe(true);
  });
});

describe("job actions", () => {
  it("retries a failed job", () => {
    const s = r(r(signedIn(), { type: "purchasePlan", plan: "pro", period: "monthly" }), { type: "retryJob", id: "j-serum" });
    expect(s.jobs.find((j) => j.id === "j-serum")).toMatchObject({ status: "running", elapsedMs: 0 });
  });
  it("regenerates into a new job in the same session", () => {
    const s = r(signedIn(), { type: "regenerateJob", id: "j-latte", newId: "j9" });
    expect(s.jobs[0]).toMatchObject({ id: "j9", status: "running", sessionId: "s-latte" });
    const msgs = s.messages["s-latte"];
    expect(msgs[msgs.length - 1]).toMatchObject({ kind: "job", jobId: "j9" });
  });
  it("tells the user the regeneration started", () => {
    const s = r(signedIn(), { type: "regenerateJob", id: "j-latte", newId: "j9" });
    expect(s.toast).toBe(REGENERATING_COPY);
  });
  it("charges the source job's workspace when regenerating", () => {
    let s = r(signedIn(), { type: "setWorkspace", workspace: "presslogic" });
    s = r(s, { type: "regenerateJob", id: "j-latte", newId: "j9" });
    expect(s.jobs[0]).toMatchObject({ id: "j9", workspace: "personal" });
    expect(s.credits.personal).toBe(signedIn().credits.personal - MODE_COST.agent);
    expect(s.credits.presslogic).toBe(CREDITS_INITIAL.presslogic);
  });
  it("checks the source workspace's balance when regenerating", () => {
    let s = r(signedIn(), { type: "setWorkspace", workspace: "presslogic" });
    s = { ...s, credits: { ...s.credits, personal: 0 } };
    s = r(s, { type: "regenerateJob", id: "j-latte", newId: "j9" });
    expect(s.jobs.find((j) => j.id === "j9")).toBeUndefined();
    expect(s.toast).toBe("Not enough credits for this request.");
  });
  it("does not regenerate when credits are insufficient", () => {
    let s = r(signedIn(), { type: "demo/setCreditsLow", low: true });
    s = r(s, { type: "demo/setCreditsLow", low: true });
    s = { ...s, credits: { ...s.credits, [s.workspace]: 0 } };
    const before = s.jobs.length;
    s = r(s, { type: "regenerateJob", id: "j-latte", newId: "j9" });
    expect(s.jobs.length).toBe(before);
    expect(s.jobs.find((j) => j.id === "j9")).toBeUndefined();
    expect(s.credits[s.workspace]).toBe(0);
    expect(s.toast).toBe(insufficientCopy(s));
  });
  it("low-credit regenerate in the personal workspace adds a See plans notice to the session (Free)", () => {
    // Free 只能重做非视频任务(视频 / Agent 会直接弹付费墙,见 growth.test);用音频任务 j-jingle 测积分不足提示
    let s = r(freeSignedIn(), { type: "demo/setCredits", credits: 0 });
    s = r(s, { type: "regenerateJob", id: "j-jingle", newId: "j9" });
    const list = s.messages["s-latte"];
    expect(list[list.length - 1]).toMatchObject({ kind: "notice", text: "Not enough credits for this request.", cta: "plans" });
  });
  it("low-credit regenerate in an organization adds a notice without a CTA", () => {
    let s = r(signedIn(), { type: "setWorkspace", workspace: "presslogic" });
    s = { ...s, credits: { ...s.credits, presslogic: 0 } };
    s = r(s, { type: "regenerateJob", id: "j-opening", newId: "j9" });
    const list = s.messages["s-opening"];
    const n = list[list.length - 1] as { kind: string; text: string; cta?: string };
    expect(n.kind).toBe("notice");
    expect(n.text).toMatch(/Contact your workspace admin/);
    expect(n.cta).toBeUndefined();
  });
  it("regenerates without a chat card after the session was deleted", () => {
    let s = r(signedIn(), { type: "deleteSession", id: "s-latte" });
    s = r(s, { type: "regenerateJob", id: "j-latte", newId: "j9" });
    expect(s.jobs[0]).toMatchObject({ id: "j9", status: "running" });
    expect(s.messages["s-latte"]).toBeUndefined();
  });
  it("deletes a job and its chat card", () => {
    const s = r(signedIn(), { type: "deleteJob", id: "j-latte" });
    expect(s.jobs.find((j) => j.id === "j-latte")).toBeUndefined();
    expect(s.messages["s-latte"].some((m) => m.role === "agent" && m.kind === "job")).toBe(false);
  });
});

describe("workspace and credits", () => {
  it("scopes works and the running badge to the current workspace", () => {
    let s = submit(signedIn(), "hi");
    expect(runningCount(s)).toBe(1);
    s = r(s, { type: "setWorkspace", workspace: "presslogic" });
    expect(runningCount(s)).toBe(0);
    expect(worksFor(s).map((j) => j.id)).toEqual(["j-opening"]);
  });
  it("toggles low credits for the current workspace only", () => {
    let s = r(signedIn(), { type: "demo/setCreditsLow", low: true });
    expect(s.credits).toEqual({ personal: LOW_CREDITS, presslogic: CREDITS_INITIAL.presslogic });
    s = r(s, { type: "demo/setCreditsLow", low: false });
    expect(s.credits.personal).toBe(CREDITS_INITIAL.personal);
  });
});

describe("permissions", () => {
  it("prompts once and remembers the answer", () => {
    let s = r(signedIn(), { type: "requestPermission", kind: "camera", then: "openCamera" });
    expect(s.permissionPrompt).toEqual({ kind: "camera", then: "openCamera" });
    s = r(s, { type: "answerPermission", value: "granted" });
    expect(s.permissions.camera).toBe("granted");
    expect(s.permissionPrompt).toBeNull();
    expect(r(s, { type: "requestPermission", kind: "camera" })).toBe(s);
  });
});

describe("sessions", () => {
  it("renames and deletes sessions", () => {
    let s = r(signedIn(), { type: "selectSession", id: "s-latte" });
    s = r(s, { type: "renameSession", id: "s-latte", title: "Latte v2" });
    expect(s.sessions.find((x) => x.id === "s-latte")!.title).toBe("Latte v2");
    s = r(s, { type: "deleteSession", id: "s-latte" });
    expect(s.sessions.find((x) => x.id === "s-latte")).toBeUndefined();
    expect(s.messages["s-latte"]).toBeUndefined();
    expect(s.currentSessionId).toBeNull();
  });
});

describe("composer normalization", () => {
  it("clears the model when switching to agent", () => {
    let s = r(signedIn(), { type: "setComposer", patch: { mode: "video", model: "veo-3" } });
    s = r(s, { type: "setComposer", patch: { mode: "agent" } });
    expect(s.composer.model).toBeNull();
  });
  it("uses the default model when switching from agent", () => {
    const s = r(signedIn(), { type: "setComposer", patch: { mode: "video" } });
    expect(s.composer.model).toBe(defaultModelFor("video", "free"));
  });
  it("clamps batch to 1..4", () => {
    expect(r(signedIn(), { type: "setComposer", patch: { batch: 0 } }).composer.batch).toBe(1);
    expect(r(signedIn(), { type: "setComposer", patch: { batch: 9 } }).composer.batch).toBe(4);
  });
});

describe("orphan sessions and drafts", () => {
  it("selecting a deleted session opens a new chat", () => {
    let s = r(signedIn(), { type: "deleteSession", id: "s-latte" });
    s = r(s, { type: "selectSession", id: "s-latte" });
    expect(s.currentSessionId).toBeNull();
  });
  it("keeps the draft when credits are insufficient", () => {
    let s = r(signedIn(), { type: "demo/setCreditsLow", low: true });
    s = submit(s, "Make a latte ad", "x");
    expect(s.composer.text).toBe("Make a latte ad");
  });
  it("keeps the draft when content is refused", () => {
    const s = submit(signedIn(), "make a deepfake of a celebrity", "x");
    expect(s.composer.text).toBe("make a deepfake of a celebrity");
  });
});

describe("workspace isolation", () => {
  const inPressLogic = () => r(signedIn(), { type: "setWorkspace", workspace: "presslogic" });
  it("new sessions belong to the current workspace", () => {
    const s = submit(inPressLogic(), "hello", "x");
    expect(s.sessions[0].workspace).toBe("presslogic");
  });
  it("switching workspace clears the current chat and draft", () => {
    let s = r(signedIn(), { type: "selectSession", id: "s-latte" });
    s = withText(s, "draft");
    s = r(s, { type: "setWorkspace", workspace: "presslogic" });
    expect(s.currentSessionId).toBeNull();
    expect(s.composer).toEqual(EMPTY_COMPOSER);
  });
  it("setting the same workspace returns the same state", () => {
    const s = withText(signedIn(), "draft");
    expect(r(s, { type: "setWorkspace", workspace: "personal" })).toBe(s);
  });
  it("cannot select a session from another workspace", () => {
    const s = r(inPressLogic(), { type: "selectSession", id: "s-latte" });
    expect(s.currentSessionId).toBeNull();
    expect(r(inPressLogic(), { type: "selectSession", id: "s-opening" }).currentSessionId).toBe("s-opening");
  });
  it("sessionsFor lists only the current workspace", () => {
    expect(sessionsFor(signedIn()).map((x) => x.id)).toEqual(["s-latte", "s-serum"]);
    expect(sessionsFor(inPressLogic()).map((x) => x.id)).toEqual(["s-opening"]);
  });
  it("simulatePush leaves other workspaces' running jobs alone", () => {
    let s = submit(allowPush(signedIn()), "one", "j1");
    s = r(s, { type: "setWorkspace", workspace: "presslogic" });
    s = r(s, { type: "simulatePush" });
    expect(s.jobs.find((j) => j.id === "j1")!.status).toBe("running");
  });
  it("tick does not banner a job from another workspace", () => {
    let s = submit(allowPush(signedIn()), "one", "j1");
    s = r(s, { type: "setWorkspace", workspace: "presslogic" });
    s = r(s, { type: "tick", ms: GENERATION_MS });
    expect(s.jobs.find((j) => j.id === "j1")!.status).toBe("done");
    expect(s.pushBanner).toBeNull();
  });
  it("deleting a job clears the banner pointing at it", () => {
    let s = r(allowPush(signedIn()), { type: "simulatePush" });
    expect(s.pushBanner).toEqual({ jobId: "j-latte" });
    s = r(s, { type: "deleteJob", id: "j-latte" });
    expect(s.pushBanner).toBeNull();
  });
  it("no banner after signing out", () => {
    let s = submit(allowPush(signedIn()), "one", "j1");
    s = r(s, { type: "signOut" });
    s = r(s, { type: "tick", ms: GENERATION_MS });
    expect(s.pushBanner).toBeNull();
    s = r(s, { type: "simulatePush" });
    expect(s.pushBanner).toBeNull();
  });
});

describe("favorites and roles", () => {
  it("toggles a favorite on and off", () => {
    let s = signedIn();
    expect(s.favorites).not.toContain("j-serum");
    s = r(s, { type: "toggleFavorite", id: "j-serum" });
    expect(s.favorites).toContain("j-serum");
    s = r(s, { type: "toggleFavorite", id: "j-serum" });
    expect(s.favorites).not.toContain("j-serum");
  });
  it("users belong to no org by default; setRole to owner makes the user a workspace owner", () => {
    let s = signedIn();
    expect(s.roles.presslogic).toBeUndefined();
    expect(ownsWorkspace(s)).toBe(false);
    s = r(s, { type: "demo/setRole", workspace: "presslogic", role: "owner" });
    expect(ownsWorkspace(s)).toBe(true);
  });
  it("deleting the account empties the personal library", () => {
    expect(INITIAL_STATE.library.length).toBeGreaterThan(0);
    expect(r(signedIn(), { type: "deleteAccount" }).library).toEqual([]);
    expect(r(signedIn(), { type: "reset" }).library.length).toBeGreaterThan(0);
  });
  it("deleting the account clears favorites", () => {
    expect(r(signedIn(), { type: "deleteAccount" }).favorites).toEqual([]);
  });
  it("new jobs and uploads get a newer modifiedAt than anything existing", () => {
    const s = submit(signedIn(), "a poster", "jn");
    const before = Math.max(...INITIAL_STATE.jobs.map((j) => j.modifiedAt ?? 0));
    expect(s.jobs[0].modifiedAt).toBeGreaterThan(before);
  });
});

describe("account", () => {
  it("deleting the account signs out, resets data and the subscription", () => {
    let s = r(signedIn(), { type: "purchasePlan", plan: "pro", period: "monthly" });
    s = submit(s, "hi");
    s = r(s, { type: "deleteAccount" });
    expect(s.signedIn).toBe(false);
    expect(s.subscription).toEqual({ plan: "free", source: "none" });
    expect(s.jobs).toEqual([]);
    expect(s.sessions).toEqual([]);
    expect(s.messages).toEqual({});
    expect(s.uploads).toEqual([]);
    expect(s.toast).toMatch(/deleted/i);
  });
});

describe("composerFromUseCase", () => {
  it("prefills prompt, mode, model and attachments", () => {
    let n = 0;
    const c = composerFromUseCase(USE_CASES[0], (p) => `${p}${++n}`);
    expect(c).toMatchObject({ text: USE_CASES[0].prompt, mode: "agent", model: null, batch: 1 });
    expect(c.attachments).toEqual([{ id: "a1", uri: USE_CASES[0].attachments[0], kind: "photo" }]);
  });
});

describe("sessions: flat list with pin", () => {
  const ids = (s: StoreState) => sessionsFor(s).map((x) => x.id);
  it("has no group field and sorts newest first", () => {
    const s = signedIn();
    expect(s.sessions.every((x) => !("group" in x) && typeof x.updatedAt === "number" && x.pinned === false)).toBe(true);
    expect(ids(s)).toEqual(["s-latte", "s-serum"]);
  });
  it("puts a pinned session on top, whatever its age", () => {
    const s = r(signedIn(), { type: "togglePinSession", id: "s-serum" });
    expect(s.sessions.find((x) => x.id === "s-serum")?.pinned).toBe(true);
    expect(ids(s)).toEqual(["s-serum", "s-latte"]);
  });
  it("unpinning drops it back to its time position", () => {
    let s = r(signedIn(), { type: "togglePinSession", id: "s-serum" });
    s = r(s, { type: "togglePinSession", id: "s-serum" });
    expect(ids(s)).toEqual(["s-latte", "s-serum"]);
  });
  it("a new session goes first among the unpinned, but below pinned ones", () => {
    let s = submit(signedIn(), "Fresh idea", "jn");
    expect(ids(s)[0]).toBe("jn-s");
    s = r(s, { type: "togglePinSession", id: "s-serum" });
    s = r(s, { type: "selectSession", id: null });
    s = submit(s, "Another idea", "jm");
    expect(ids(s)).toEqual(["s-serum", "jm-s", "jn-s", "s-latte"]);
  });
  it("a new message in an old session moves it to the front", () => {
    let s = r(signedIn(), { type: "selectSession", id: "s-serum" });
    s = submit(s, "One more cut", "jo");
    expect(ids(s)).toEqual(["s-serum", "s-latte"]);
  });
  it("deleting a pinned session removes it and its messages", () => {
    let s = r(signedIn(), { type: "togglePinSession", id: "s-serum" });
    s = r(s, { type: "deleteSession", id: "s-serum" });
    expect(ids(s)).toEqual(["s-latte"]);
    expect(s.messages["s-serum"]).toBeUndefined();
  });
});

describe("members", () => {
  const cap = (id: string, v: number, s: StoreState = INITIAL_STATE) => r(s, { type: "setMemberCap", workspace: "presslogic", id, cap: v });
  const get = (s: StoreState, id: string) => s.members.presslogic.find((m) => m.id === id)!;

  it("updates a member's cap", () => {
    expect(get(cap("m-marcus", 3000), "m-marcus").cap).toBe(3000);
  });
  it("rejects a cap below credits already used", () => {
    const s = cap("m-marcus", 900);
    expect(s).toBe(INITIAL_STATE);
  });
  it("accepts a cap equal to used when it is a multiple of 100", () => {
    expect(get(cap("m-marcus", 1000), "m-marcus").cap).toBe(1000);
  });
  it("rejects caps that are not a multiple of 100", () => {
    expect(cap("m-marcus", 2050)).toBe(INITIAL_STATE);
  });
  it("ignores unknown members", () => {
    expect(cap("nope", 1000)).toBe(INITIAL_STATE);
  });
});

describe("members visibility", () => {
  it("shows only in an org workspace for admin / owner", () => {
    const org = r(r(INITIAL_STATE, { type: "demo/setRole", workspace: "presslogic", role: "admin" }), { type: "setWorkspace", workspace: "presslogic" });
    expect(canManageMembers(INITIAL_STATE)).toBe(false);
    expect(canManageMembers(org)).toBe(true);
    expect(canManageMembers(r(org, { type: "demo/setRole", workspace: "presslogic", role: "owner" }))).toBe(true);
    expect(canManageMembers(r(org, { type: "demo/setRole", workspace: "presslogic", role: "member" }))).toBe(false);
  });
  it("shows the current user's role from roles", () => {
    const org = r(r(INITIAL_STATE, { type: "setWorkspace", workspace: "presslogic" }), { type: "demo/setRole", workspace: "presslogic", role: "owner" });
    expect(membersFor(org).find((m) => m.self)!.role).toBe("owner");
  });
  it("when the user is owner, the seeded owner shows as admin (only one Owner)", () => {
    const org = r(r(INITIAL_STATE, { type: "setWorkspace", workspace: "presslogic" }), { type: "demo/setRole", workspace: "presslogic", role: "owner" });
    expect(membersFor(org).filter((m) => m.role === "owner").map((m) => m.self)).toEqual([true]);
    expect(membersFor(org).find((m) => m.id === "m-priya")!.role).toBe("admin");
    const admin = r(INITIAL_STATE, { type: "setWorkspace", workspace: "presslogic" });
    expect(membersFor(admin).find((m) => m.id === "m-priya")!.role).toBe("owner");
  });
});

describe("subscription", () => {
  it("starts free with no source", () => {
    expect(INITIAL_STATE.subscription).toEqual({ plan: "free", source: "none" });
  });
  it("purchasing records the plan and queues the badge celebration on Me instead of a toast", () => {
    const s = r(signedIn(), { type: "purchasePlan", plan: "pro", period: "monthly" });
    expect(s.subscription).toMatchObject({ plan: "pro", source: "app", period: "monthly" });
    expect(s.planUpgrade).toEqual({ from: "starter", to: "pro" });
    expect(s.toast).toBeNull();
    expect(r(s, { type: "consumePlanUpgrade" }).planUpgrade).toBeNull();
  });
  it("downgrades and undoing a pending change don't celebrate", () => {
    const pro = signedInAs("pro", 1);
    expect(r(pro, { type: "purchasePlan", plan: "starter", period: "yearly" }).planUpgrade).toBeNull();
    const free = r(r(INITIAL_STATE, { type: "signIn" }), { type: "purchasePlan", plan: "starter", period: "monthly" });
    expect(free.planUpgrade).toEqual({ from: "free", to: "starter" });
  });
  it("an app subscriber can change plan", () => {
    const s = r(r(signedIn(), { type: "purchasePlan", plan: "starter", period: "monthly" }), { type: "purchasePlan", plan: "ultra", period: "monthly" });
    expect(s.subscription).toMatchObject({ plan: "ultra", source: "app", period: "monthly" });
  });
  it("a web subscriber cannot buy again in the app", () => {
    const web = r(signedIn(), { type: "demo/setWebSubscriber", on: true });
    expect(web.subscription).toEqual({ plan: "pro", source: "web" });
    const s = r(web, { type: "purchasePlan", plan: "ultra", period: "monthly" });
    expect(s).toBe(web);
  });
  it("turning the demo web subscriber off returns to free", () => {
    const s = r(r(signedIn(), { type: "demo/setWebSubscriber", on: true }), { type: "demo/setWebSubscriber", on: false });
    expect(s.subscription).toEqual({ plan: "free", source: "none" });
  });
  it("turning the demo web switch off keeps an app purchase", () => {
    const sub = r(signedIn(), { type: "purchasePlan", plan: "starter", period: "monthly" });
    expect(r(sub, { type: "demo/setWebSubscriber", on: false }).subscription).toMatchObject({ plan: "starter", source: "app", period: "monthly" });
  });
  it("restoring purchases only toasts and keeps the subscription", () => {
    const sub = r(signedIn(), { type: "purchasePlan", plan: "starter", period: "monthly" });
    const s = r(sub, { type: "restorePurchases" });
    expect(s.toast).toBe("Purchases restored");
    expect(s.subscription).toEqual(sub.subscription);
    const web = r(signedIn(), { type: "demo/setWebSubscriber", on: true });
    expect(r(web, { type: "restorePurchases" }).subscription).toEqual(web.subscription);
  });
  it("Seedance 2.0 is locked unless Pro or Ultra", () => {
    const at = (plan: "starter" | "pro" | "ultra") => r(signedIn(), { type: "purchasePlan", plan, period: "monthly" });
    expect(modelLocked(signedIn(), "seedance-2")).toBe(true);
    expect(modelLocked(at("starter"), "seedance-2")).toBe(true);
    expect(modelLocked(at("pro"), "seedance-2")).toBe(false);
    expect(modelLocked(at("ultra"), "seedance-2")).toBe(false);
    expect(modelLocked(r(signedIn(), { type: "demo/setWebSubscriber", on: true }), "seedance-2")).toBe(false);
    expect(modelLocked(at("starter"), "seedance-2-5")).toBe(true);
  });
  it("personal low-credit notice offers See plans; organization does not", () => {
    const low = (s: StoreState) => r(s, { type: "demo/setCreditsLow", low: true });
    let s = submit(low(freeSignedIn()), "a video", "jl");
    expect(last(s)).toMatchObject({ kind: "notice", cta: "plans" });
    s = r(signedIn(), { type: "setWorkspace", workspace: "presslogic" });
    s = submit(r(s, { type: "demo/setCreditsLow", low: true }), "a video", "jo");
    expect(last(s)).toMatchObject({ kind: "notice" });
    expect((last(s) as { cta?: string }).cta).toBeUndefined();
  });
});

describe("AI data consent (asked at the first send)", () => {
  const fresh = () => r(r(INITIAL_STATE, { type: "signIn" }), { type: "demo/setPlan", plan: "starter", source: "app", period: "monthly" });

  it("starts without consent and without a prompt", () => {
    expect([INITIAL_STATE.aiConsent, INITIAL_STATE.aiConsentPrompt]).toEqual([false, null]);
  });
  it("submitPrompt without consent is held back: draft and credits untouched, pending recorded", () => {
    const before = withText(fresh(), "A latte ad");
    const s = r(before, { type: "submitPrompt", id: "c1" });
    expect(s.aiConsentPrompt).toEqual({ pending: { type: "submitPrompt", id: "c1" } });
    expect(s.jobs).toBe(before.jobs);
    expect(s.credits).toEqual(before.credits);
    expect(s.composer.text).toBe("A latte ad");
  });
  it("retryJob and regenerateJob without consent are held back", () => {
    const base = fresh();
    const a = r(base, { type: "retryJob", id: base.jobs[0].id });
    expect(a.aiConsentPrompt).toEqual({ pending: { type: "retryJob", id: base.jobs[0].id } });
    expect(a.jobs).toBe(base.jobs);
    const b = r(base, { type: "regenerateJob", id: base.jobs[0].id, newId: "rg1" });
    expect(b.aiConsentPrompt).toEqual({ pending: { type: "regenerateJob", id: base.jobs[0].id, newId: "rg1" } });
    expect(b.jobs).toBe(base.jobs);
    expect(b.credits).toEqual(base.credits);
  });
  it("Allow turns consent on and then runs the pending submit (job starts, credits charged)", () => {
    const held = r(withText(fresh(), "A latte ad"), { type: "submitPrompt", id: "c1" });
    const s = r(held, { type: "allowAiConsent" });
    expect(s.aiConsent).toBe(true);
    expect(s.aiConsentPrompt).toBeNull();
    expect(s.jobs.some((j) => j.id === "c1" && j.status === "running")).toBe(true);
    expect(s.credits.personal).toBeLessThan(held.credits.personal);
  });
  it("Allow runs a pending regenerate", () => {
    const base = fresh();
    const held = r(base, { type: "regenerateJob", id: base.jobs[0].id, newId: "rg1" });
    const s = r(held, { type: "allowAiConsent" });
    expect(s.jobs.some((j) => j.id === "rg1" && j.status === "running")).toBe(true);
  });
  it("Not now clears the prompt and does nothing else; the draft stays", () => {
    const held = r(withText(fresh(), "A latte ad"), { type: "submitPrompt", id: "c1" });
    const s = r(held, { type: "dismissAiConsent" });
    expect(s.aiConsentPrompt).toBeNull();
    expect(s.aiConsent).toBe(false);
    expect(s.jobs).toBe(held.jobs);
    expect(s.composer.text).toBe("A latte ad");
  });
  it("sending again after Not now asks again", () => {
    let s = r(r(withText(fresh(), "x"), { type: "submitPrompt", id: "c1" }), { type: "dismissAiConsent" });
    s = r(s, { type: "submitPrompt", id: "c2" });
    expect(s.aiConsentPrompt?.pending).toEqual({ type: "submitPrompt", id: "c2" });
  });
  it("turning consent off in Settings makes the next send ask again; on lets it through", () => {
    let s = withText(signedIn(), "A latte ad");
    s = r(r(s, { type: "setAiConsent", on: false }), { type: "submitPrompt", id: "c1" });
    expect(s.aiConsentPrompt).not.toBeNull();
    s = r(r(s, { type: "dismissAiConsent" }), { type: "setAiConsent", on: true });
    expect(r(s, { type: "submitPrompt", id: "c1" }).aiConsentPrompt).toBeNull();
  });
  it("sign out keeps consent; delete account and reset clear it", () => {
    expect(r(signedIn(), { type: "signOut" }).aiConsent).toBe(true);
    expect(r(signedIn(), { type: "deleteAccount" }).aiConsent).toBe(false);
    expect(r(signedIn(), { type: "reset" }).aiConsent).toBe(false);
  });
});

describe("cancelled and duplicate subscriptions (spec §2.5, §11 #5)", () => {
  it("demo/setCancelled only applies to App Store subscriptions", () => {
    const s = r(signedIn(), { type: "demo/setCancelled", on: true });
    expect(s.subscription.cancelled).toBe(true);
    expect(r(s, { type: "demo/setCancelled", on: false }).subscription.cancelled).toBeUndefined();
    const web = r(signedIn(), { type: "demo/setPlan", plan: "pro", source: "web" });
    expect(r(web, { type: "demo/setCancelled", on: true }).subscription.cancelled).toBeUndefined();
  });

  it("resubscribing to the same plan turns auto-renew back on without adding credits", () => {
    const s = r(signedIn(), { type: "demo/setCancelled", on: true });
    const next = r(s, { type: "purchasePlan", plan: "starter", period: "monthly" });
    expect(next.subscription.cancelled).toBeUndefined();
    expect(next.subscription.renewDay).toBe(s.subscription.renewDay);
    expect(next.credits.personal).toBe(s.credits.personal);
  });

  it("switching plan while cancelled schedules the change and turns auto-renew back on", () => {
    const pro = r(signedIn(), { type: "purchasePlan", plan: "pro", period: "monthly" });
    const s = r(pro, { type: "demo/setCancelled", on: true });
    const next = r(s, { type: "purchasePlan", plan: "starter", period: "monthly" });
    expect(next.subscription.cancelled).toBeUndefined();
    expect(next.subscription.pendingChange).toMatchObject({ plan: "starter" });
  });

  it("duplicate subscription keeps the web plan as the active one", () => {
    const s = r(signedIn(), { type: "demo/setDuplicate", on: true });
    expect(s.subscription).toMatchObject({ source: "web", duplicateApp: true });
    expect(r(s, { type: "demo/setDuplicate", on: false }).subscription.duplicateApp).toBeUndefined();
  });
});

describe("StoreKit results (spec §2.5)", () => {
  const sk = (s: StoreState, patch: Partial<StoreState["storekit"]>) => r(s, { type: "demo/setStoreKit", patch });

  it("a failed purchase changes nothing and says the user wasn't charged", () => {
    const s = sk(freeSignedIn(), { purchase: "failed" });
    const next = r(s, { type: "purchasePlan", plan: "pro", period: "yearly" });
    expect(next.subscription.plan).toBe("free");
    expect(next.credits).toEqual(s.credits);
    expect(next.toast).toBe(PURCHASE_FAILED_TOAST);
  });

  it("a pending (Ask to Buy) purchase changes nothing until approved", () => {
    const next = r(sk(freeSignedIn(), { purchase: "pending" }), { type: "purchasePlan", plan: "starter", period: "monthly" });
    expect(next.subscription.plan).toBe("free");
    expect(next.toast).toBe(PURCHASE_PENDING_TOAST);
  });

  it("a failed exit-offer purchase keeps the offer window open", () => {
    const opened = r(freeSignedIn(), { type: "closePaywall", now: 1000 });
    const next = r(sk(opened, { purchase: "failed" }), { type: "acceptExitOffer", now: 2000 });
    expect(next.subscription.plan).toBe("free");
    expect(next.exitOfferExpiresAt).toBe(opened.exitOfferExpiresAt);
  });

  it("a failed credit pack purchase adds no credits", () => {
    const s = sk(signedIn(), { purchase: "failed" });
    expect(r(s, { type: "buyCreditPack", packId: "pack-1000", qty: 1 }).credits).toEqual(s.credits);
  });

  it("restore reports each App Store result", () => {
    expect(r(sk(freeSignedIn(), { restore: "none" }), { type: "restorePurchases" }).toast).toBe("No purchases to restore on this Apple ID");
    expect(r(sk(freeSignedIn(), { restore: "otherAccount" }), { type: "restorePurchases" }).toast).toBe("This subscription belongs to another BuzzVideo account");
  });

  it("billing retry only applies to App Store subscriptions", () => {
    expect(r(signedIn(), { type: "demo/setBillingRetry", on: true }).subscription.billingRetry).toBe(true);
    expect(r(freeSignedIn(), { type: "demo/setBillingRetry", on: true }).subscription.billingRetry).toBeUndefined();
  });
});

describe("network and loading faults", () => {
  const fault = (s: StoreState, patch: Partial<StoreState["faults"]>) => r(s, { type: "demo/setFaults", patch });

  it("offline submit keeps the draft and charges nothing", () => {
    const s = r(fault(freeSignedIn(), { offline: true }), { type: "setComposer", patch: { mode: "image", text: "Latte" } });
    const next = r(s, { type: "submitPrompt", id: "x" });
    expect(next.toast).toBe(OFFLINE_DRAFT_TOAST);
    expect(next.composer.text).toBe("Latte");
    expect(next.jobs).toEqual(s.jobs);
    expect(next.credits).toEqual(s.credits);
  });

  it("offline blocks purchases, restore and sign-in", () => {
    const off = fault(freeSignedIn(), { offline: true });
    expect(r(off, { type: "purchasePlan", plan: "pro", period: "yearly" }).subscription.plan).toBe("free");
    expect(r(off, { type: "restorePurchases" }).toast).toBe(OFFLINE_TOAST);
    const out = fault(INITIAL_STATE, { offline: true });
    expect(r(out, { type: "signIn" }).signedIn).toBe(false);
  });

  it("a failed third-party sign-in stays on the login screen", () => {
    const next = r(fault(INITIAL_STATE, { signIn: true }), { type: "signIn" });
    expect(next.signedIn).toBe(false);
    expect(next.toast).toBe(SIGN_IN_FAILED_TOAST);
    expect(next.paywallRequest).toBeNull();
  });

  it("prices are unavailable when offline or when the price fetch fails", () => {
    expect(pricesUnavailable(INITIAL_STATE)).toBe(false);
    expect(pricesUnavailable(fault(INITIAL_STATE, { prices: true }))).toBe(true);
    expect(pricesUnavailable(fault(INITIAL_STATE, { offline: true }))).toBe(true);
  });
});

describe("demo accounts (Free / Starter / Pro / Ultra / Enterprise)", () => {
  it("each account signs in to its own plan and credits", () => {
    expect(accountOf(signedInAs("free", 1))).toBe("free");
    const pro = signedInAs("pro", 1);
    expect(pro.subscription).toMatchObject({ plan: "pro", source: "app", period: "yearly" });
    expect(pro.credits.personal).toBe(4900);
    expect(signedInAs("ultra", 1).credits.personal).toBe(8900);
    expect(signedInAs("starter", 1).workspace).toBe("personal");
  });

  it("enterprise users land in their org and never get an automatic paywall, exit offer or promo", () => {
    const e = signedInAs("enterprise", 1);
    expect(accountOf(e)).toBe("enterprise");
    expect(e.workspace).toBe("presslogic");
    expect(e.paywallRequest).toBeNull();
    const nextDay = r(r(e, { type: "promoLoaded", campaign: PROMO_CAMPAIGN }), { type: "appLaunched", day: 2 });
    expect(nextDay.paywallRequest).toBeNull();
    expect(nextDay.promoOpen).toBeNull();
    expect(r(e, { type: "closePaywall", now: 1 }).exitOfferOpen).toBe(false);
  });

  it("an enterprise user's personal space still paywalls video on demand", () => {
    const personal = r(signedInAs("enterprise", 1), { type: "setWorkspace", workspace: "personal" });
    const s = r(personal, { type: "setComposer", patch: { mode: "video", text: "Ad" } });
    expect(r(s, { type: "submitPrompt", id: "v" }).paywallRequest).toMatchObject({ trigger: "video_locked" });
  });

  it("switching account keeps settings but replaces plan, org and credits", () => {
    const s = r(signedInAs("enterprise", 1), { type: "demo/setAccount", account: "starter" });
    expect(accountOf(s)).toBe("starter");
    expect(s.roles).toEqual({});
    expect(s.workspace).toBe("personal");
    expect(s.signedIn).toBe(true);
  });
});

describe("parallel generation limits (Free 1 / Starter 4 / Pro 8 / Ultra 12)", () => {
  const submitImage = (s: StoreState, id: string) => r(r(s, { type: "setComposer", patch: { mode: "image", text: `Poster ${id}` } }), { type: "submitPrompt", id });
  const running = (s: StoreState) => s.jobs.filter((j) => j.status === "running").length;

  it("Free can run only one generation at a time and keeps the draft", () => {
    const one = submitImage(signedInAs("free", 1), "a");
    expect(running(one)).toBe(1);
    const two = submitImage(one, "b");
    expect(running(two)).toBe(1);
    expect(two.credits).toEqual(one.credits);
    expect(two.composer.text).toBe("Poster b");
    const last = two.messages[two.currentSessionId!].at(-1)!;
    expect(last).toMatchObject({ kind: "notice", cta: "upgrade" });
    expect(nextTier("free")).toBe("starter");
    expect(nextTier("starter")).toBe("pro");
  });

  it("Starter runs up to 4; Ultra hits its limit without an upgrade prompt", () => {
    let s = signedInAs("starter", 1);
    for (const id of ["a", "b", "c", "d", "e"]) s = submitImage(s, id);
    expect(running(s)).toBe(4);
    let u = signedInAs("ultra", 1);
    for (let i = 0; i < 13; i++) u = submitImage(u, `u${i}`);
    expect(running(u)).toBe(12);
    expect(u.messages[u.currentSessionId!].at(-1)).not.toHaveProperty("cta");
  });
});

describe("promo CTA by account", () => {
  it("opens the paywall on the member's own plan, Starter for Free", () => {
    const open = (id: Parameters<typeof signedInAs>[0]) => r(r(signedInAs(id, 1), { type: "promoLoaded", campaign: PROMO_CAMPAIGN }), { type: "promoCta" }).paywallRequest;
    expect(open("free")).toEqual({ trigger: "promo", tab: "starter" });
    expect(open("pro")).toEqual({ trigger: "promo", tab: "pro" });
    expect(open("ultra")).toEqual({ trigger: "promo", tab: "ultra" });
  });
});

describe("exit offer and Enterprise", () => {
  it("a live exit offer is hidden once the user belongs to an Enterprise org", () => {
    const opened = r(r(INITIAL_STATE, { type: "signIn" }), { type: "closePaywall", now: 1000 });
    expect(exitOfferLive(opened, 2000)).toBe(true);
    expect(exitOfferLive(r(opened, { type: "demo/setAccount", account: "enterprise" }), 2000)).toBe(false);
  });
});

describe("independent review fixes", () => {
  it("Ask to Buy closes the exit offer sheet; a failed purchase keeps it open", () => {
    const opened = r(r(INITIAL_STATE, { type: "signIn" }), { type: "closePaywall", now: 1000 });
    const pending = r(r(opened, { type: "demo/setStoreKit", patch: { purchase: "pending" } }), { type: "acceptExitOffer", now: 2000 });
    expect(pending.exitOfferOpen).toBe(false);
    const failed = r(r(opened, { type: "demo/setStoreKit", patch: { purchase: "failed" } }), { type: "acceptExitOffer", now: 2000 });
    expect(failed.exitOfferOpen).toBe(true);
  });
  it("rerun charges the same number of images as the original send", () => {
    let s = r(signedInAs("pro", 1), { type: "setComposer", patch: { mode: "image", text: "Poster", batch: 4 } });
    s = r(s, { type: "submitPrompt", id: "b4" });
    const before = s.credits.personal;
    const again = r(s, { type: "regenerateJob", id: "b4", newId: "b5" });
    expect(before - again.credits.personal).toBe(MODE_COST.image * 4);
  });
  it("blocks a new subscription when this Apple ID's subscription belongs to another account", () => {
    const s = r(r(INITIAL_STATE, { type: "signIn" }), { type: "demo/setStoreKit", patch: { restore: "otherAccount" } });
    const next = r(s, { type: "purchasePlan", plan: "pro", period: "yearly" });
    expect(next.subscription.plan).toBe("free");
    expect(next.toast).toBe(OTHER_ACCOUNT_TOAST);
  });
  it("Enterprise users get no campaign push", () => {
    let s = r(r(signedInAs("enterprise", 1), { type: "promoLoaded", campaign: PROMO_CAMPAIGN }), { type: "setMarketingPush", on: true });
    s = r(s, { type: "campaignPushReceived", campaignId: PROMO_CAMPAIGN.id });
    expect(s.campaignBanner).toBeNull();
  });
  it("sign-out returns to the personal workspace", () => {
    expect(r(signedInAs("enterprise", 1), { type: "signOut" }).workspace).toBe("personal");
  });
  it("switching account resets account-bound records and re-picks the model", () => {
    let s = r(r(INITIAL_STATE, { type: "signIn" }), { type: "closePaywall", now: 1000 });
    s = r(r(s, { type: "demo/setAccount", account: "pro" }), { type: "setComposer", patch: { mode: "video" } });
    expect(s.composer.model).toBe("seedance-2-5");
    s = r(s, { type: "demo/setAccount", account: "starter" });
    expect(s.composer.model).toBe("seedance-2-fast");
    s = r(s, { type: "demo/setAccount", account: "free" });
    expect(s.exitOfferUsed).toBe(false);
    expect(s.exitOfferExpiresAt).toBe(0);
  });
  it("a pending Ultra multiplier downgrade names the multiplier", () => {
    expect(choiceLabel({ plan: "ultra", period: "yearly", multiplier: 2 })).toBe("Ultra 2× (yearly)");
    expect(choiceLabel({ plan: "starter", period: "monthly" })).toBe("Starter (monthly)");
  });
});

describe("subscription credits follow App Store / Google Play upgrade rules", () => {
  it("Free's 500 sign-up credits stay; the plan's credits arrive as subscription credits", () => {
    const s = r(r(INITIAL_STATE, { type: "signIn" }), { type: "purchasePlan", plan: "starter", period: "monthly" });
    expect(s.credits.personal).toBe(500 + 1900);
    expect(s.subscriptionCredits).toBe(1900);
  });
  it("upgrading replaces unused subscription credits instead of stacking them", () => {
    const pro = signedInAs("pro", 1);
    const ultra = r(pro, { type: "purchasePlan", plan: "ultra", period: "yearly" });
    expect(ultra.credits.personal).toBe(8900);
    expect(ultra.subscriptionCredits).toBe(8900);
  });
  it("spending uses subscription credits first; packs survive a cancelled plan's expiry", () => {
    let s = r(signedInAs("pro", 1), { type: "buyCreditPack", packId: "pack-1000", qty: 1 });
    s = r(r(s, { type: "setComposer", patch: { mode: "agent", text: "Plan" } }), { type: "submitPrompt", id: "sp" });
    expect(s.subscriptionCredits).toBe(4900 - MODE_COST.agent);
    s = r(r(s, { type: "demo/setCancelled", on: true }), { type: "subscriptionRenewed" });
    expect(s.subscription.plan).toBe("free");
    expect(s.credits.personal).toBe(1000);
    expect(s.subscriptionCredits).toBe(0);
  });
  it("a pending downgrade takes effect on the renewal day with the new plan's credits", () => {
    let s = r(signedInAs("pro", 1), { type: "purchasePlan", plan: "starter", period: "yearly" });
    expect(s.subscription.plan).toBe("pro");
    s = r(s, { type: "subscriptionRenewed" });
    expect(s.subscription).toMatchObject({ plan: "starter", period: "yearly" });
    expect(s.subscription.pendingChange).toBeUndefined();
    expect(s.subscriptionCredits).toBe(1900);
  });
  it("monthly reset refills subscription credits without stacking, even on yearly plans", () => {
    let s = r(r(signedInAs("pro", 1), { type: "setComposer", patch: { mode: "agent", text: "Plan" } }), { type: "submitPrompt", id: "m" });
    s = r(s, { type: "monthlyCreditsReset" });
    expect(s.credits.personal).toBe(4900);
  });
  it("no renewal or new credits during the billing grace period", () => {
    const s = r(signedInAs("pro", 1), { type: "demo/setBillingRetry", on: true });
    expect(r(s, { type: "subscriptionRenewed" })).toBe(s);
    expect(r(s, { type: "monthlyCreditsReset" })).toBe(s);
  });
});

describe("undo a pending change", () => {
  it("re-choosing the current plan cancels a pending downgrade without charging", () => {
    const pro = signedInAs("pro", 1);
    const pending = r(pro, { type: "purchasePlan", plan: "starter", period: "yearly" });
    expect(pending.subscription.pendingChange).toBeDefined();
    const kept = r(pending, { type: "purchasePlan", plan: "pro", period: "yearly" });
    expect(kept.subscription.pendingChange).toBeUndefined();
    expect(kept.subscription.plan).toBe("pro");
    expect(kept.credits).toEqual(pending.credits);
  });
});

describe("exit offer and promo bonus don't stack", () => {
  it("buying at the exit-offer price gives no campaign bonus", () => {
    let s = r(r(r(INITIAL_STATE, { type: "signIn" }), { type: "promoLoaded", campaign: PROMO_CAMPAIGN }), { type: "closePaywall", now: 1000 });
    s = r(s, { type: "acceptExitOffer", now: 2000 });
    expect(s.subscription.plan).toBe("starter");
    expect(s.credits.personal).toBe(500 + 1900);
  });
});

describe("org member monthly cap (same as web)", () => {
  const capped = () => r(signedInAs("enterprise", 1), { type: "setMemberCap", workspace: "presslogic", id: "m-alex", cap: 1900 });
  it("org generations count toward the member's monthly usage", () => {
    const s = r(r(signedInAs("enterprise", 1), { type: "setComposer", patch: { mode: "image", text: "P" } }), { type: "submitPrompt", id: "o1" });
    expect(s.members.presslogic.find((m) => m.self)!.used).toBe(1850 + MODE_COST.image);
  });
  it("blocks a generation that would exceed the cap: no job, no charge, ask the admin", () => {
    const s0 = r(capped(), { type: "setComposer", patch: { mode: "agent", text: "Plan" } });
    const s = r(s0, { type: "submitPrompt", id: "o2" });
    expect(s.jobs.length).toBe(s0.jobs.length);
    expect(s.credits).toEqual(s0.credits);
    expect(s.messages[s.currentSessionId!].at(-1)).toMatchObject({ kind: "notice", text: memberCapCopy("presslogic") });
  });
});

describe("Free Agent while a job runs", () => {
  it("still plans and stops at the video step, ignoring the 1-at-a-time limit", () => {
    let s = r(r(signedInAs("free", 1), { type: "setComposer", patch: { mode: "image", text: "Poster" } }), { type: "submitPrompt", id: "img" });
    s = r(r(s, { type: "setComposer", patch: { mode: "agent", text: "Make a 15s ad" } }), { type: "submitPrompt", id: "ag" });
    expect(s.paywallRequest).toMatchObject({ trigger: "video_locked" });
    expect(s.messages[s.currentSessionId!].at(-1)).toMatchObject({ cta: "video" });
  });
});

describe("email code sign-in (same flow as web)", () => {
  const start = () => r(r(INITIAL_STATE, { type: "completeOnboarding" }), { type: "startEmailLogin" });
  const atCode = () => r(start(), { type: "submitEmail", email: "monica.zhou@presslogic.com", now: 1000 });
  it("only a valid email moves to the code step", () => {
    expect(r(start(), { type: "submitEmail", email: "monica@", now: 1 }).emailAuth?.step).toBe("email");
    expect(atCode().emailAuth).toMatchObject({ step: "code", email: "monica.zhou@presslogic.com", sentAt: 1000 });
  });
  it("a correct code signs in like Apple / Google and opens the first-login paywall", () => {
    const s = r(atCode(), { type: "verifyEmailCode", code: "123456" });
    expect(s.signedIn).toBe(true);
    expect(s.emailAuth).toBeNull();
    expect(s.paywallRequest?.trigger).toBe("first_login");
  });
  it("wrong codes count down and lock after 5 tries; resend unlocks", () => {
    let s = r(atCode(), { type: "demo/setEmailCodeSim", sim: "wrong" });
    s = r(s, { type: "verifyEmailCode", code: "000000" });
    expect(s.emailAuth).toMatchObject({ error: "wrong", attempts: 1 });
    for (let i = 0; i < 4; i++) s = r(s, { type: "verifyEmailCode", code: "000000" });
    expect(s.emailAuth?.error).toBe("locked");
    expect(r(s, { type: "verifyEmailCode", code: "000000" }).emailAuth?.attempts).toBe(5);
    const re = r(s, { type: "resendEmailCode", now: 2000 });
    expect(re.emailAuth).toMatchObject({ error: null, attempts: 0, sentAt: 2000 });
  });
  it("resend waits 60 s unless the code expired", () => {
    expect(r(atCode(), { type: "resendEmailCode", now: 30_000 }).emailAuth?.sentAt).toBe(1000);
    expect(r(atCode(), { type: "resendEmailCode", now: 61_000 }).emailAuth?.sentAt).toBe(61_000);
    const exp = r(r(atCode(), { type: "demo/setEmailCodeSim", sim: "expired" }), { type: "verifyEmailCode", code: "111111" });
    expect(r(exp, { type: "resendEmailCode", now: 5000 }).emailAuth?.sentAt).toBe(5000);
  });
  it("back goes from code to email (keeping the address), then out to Login", () => {
    const back = r(atCode(), { type: "emailBack" });
    expect(back.emailAuth).toMatchObject({ step: "email", email: "monica.zhou@presslogic.com" });
    expect(r(back, { type: "emailBack" }).emailAuth).toBeNull();
  });
});

describe("Apple / Google sign-in system flows", () => {
  const login = () => r(INITIAL_STATE, { type: "completeOnboarding" });

  it("Apple: system sheet → Face ID → signed in with first-login paywall, and remembered next time", () => {
    let s = r(login(), { type: "startThirdPartyLogin", provider: "apple" });
    expect(s.thirdPartyAuth).toEqual({ provider: "apple", step: "sheet" });
    s = r(s, { type: "thirdPartyContinue" });
    expect(s.thirdPartyAuth).toEqual({ provider: "apple", step: "verifying" });
    expect(s.signedIn).toBe(false);
    s = r(s, { type: "thirdPartyComplete" });
    expect(s.thirdPartyAuth).toBeNull();
    expect(s.signedIn).toBe(true);
    expect(s.paywallRequest?.trigger).toBe("first_login");
    expect(s.appleKnown).toBe(true);
  });

  it("Google: system alert → account chooser → signed in", () => {
    let s = r(login(), { type: "startThirdPartyLogin", provider: "google" });
    expect(s.thirdPartyAuth).toEqual({ provider: "google", step: "alert" });
    s = r(s, { type: "thirdPartyContinue" });
    expect(s.thirdPartyAuth).toEqual({ provider: "google", step: "chooser" });
    s = r(s, { type: "thirdPartyComplete" });
    expect(s.signedIn).toBe(true);
    expect(s.appleKnown).toBe(false);
  });

  it("cancelling goes back to the login page silently", () => {
    const s = r(r(login(), { type: "startThirdPartyLogin", provider: "google" }), { type: "thirdPartyCancel" });
    expect(s.thirdPartyAuth).toBeNull();
    expect(s.signedIn).toBe(false);
    expect(s.toast).toBeNull();
  });

  it("server failure or offline: back on the login page with a retry toast, no sign-in", () => {
    const failing = r(login(), { type: "demo/setFaults", patch: { signIn: true } });
    let s = r(r(failing, { type: "startThirdPartyLogin", provider: "apple" }), { type: "thirdPartyContinue" });
    s = r(s, { type: "thirdPartyComplete" });
    expect(s.signedIn).toBe(false);
    expect(s.thirdPartyAuth).toBeNull();
    expect(s.toast).toBe(SIGN_IN_FAILED_TOAST);

    const offline = r(login(), { type: "demo/setFaults", patch: { offline: true } });
    const o = r(r(r(offline, { type: "startThirdPartyLogin", provider: "google" }), { type: "thirdPartyContinue" }), { type: "thirdPartyComplete" });
    expect(o.signedIn).toBe(false);
    expect(o.toast).toBe(OFFLINE_TOAST);
  });
});

describe("restore purchases: success", () => {
  it("a Free account gets the Apple ID's subscription back with the badge celebration", () => {
    const s = r(freeSignedIn(), { type: "restorePurchases" });
    expect(s.subscription).toMatchObject({ source: "app", plan: "pro", period: "monthly" });
    expect(s.planUpgrade).toEqual({ from: "free", to: "pro" });
  });
  it("a member just sees a confirmation, the plan is unchanged", () => {
    const before = signedIn();
    const s = r(before, { type: "restorePurchases" });
    expect(s.subscription).toEqual(before.subscription);
    expect(s.toast).toBe("Purchases restored");
  });
});

describe("push permission is asked at the first real generation", () => {
  const ready = () => r(r(freeSignedIn(), { type: "setPermission", kind: "push", value: "undetermined" }), { type: "setComposer", patch: { mode: "image", text: "Iced latte" } });
  it("asks once when the first job is actually submitted", () => {
    const s = r(ready(), { type: "submitPrompt", id: "p1" });
    expect(s.permissionPrompt).toEqual({ kind: "push" });
  });
  it("does not ask when push was already answered", () => {
    const s = r(r(ready(), { type: "setPermission", kind: "push", value: "denied" }), { type: "submitPrompt", id: "p1" });
    expect(s.permissionPrompt).toBeNull();
  });
  it("does not ask when the submit was blocked (Free trying video)", () => {
    const s = r(r(ready(), { type: "setComposer", patch: { mode: "video" } }), { type: "submitPrompt", id: "p1" });
    expect(s.permissionPrompt).toBeNull();
  });
});
