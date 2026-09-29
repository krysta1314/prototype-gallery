import { describe, expect, it } from "vitest";
import {
  GENERATION_MS,
  INITIAL_STATE,
  LOW_CREDITS,
  UPLOAD_MS,
  canTopUpOnWeb,
  composerFromUseCase,
  insufficientCopy,
  runningCount,
  storeReducer as r,
  uploadProgress,
  worksFor,
  type Message,
  type StoreState,
} from "@/app/prototypes/(app-mvp)/buzzvideo-app/app/store";
import { CREDITS_INITIAL, MODE_COST, USE_CASES, defaultModel } from "@/app/prototypes/(app-mvp)/buzzvideo-app/app/data";

const signedIn = (): StoreState => r(INITIAL_STATE, { type: "signIn", silent: true });
const withText = (s: StoreState, text: string) => r(s, { type: "setComposer", patch: { text } });
const allowPush = (s: StoreState) => r(s, { type: "setPermission", kind: "push", value: "granted" });
const submit = (s: StoreState, text: string, id = "j1") => r(withText(s, text), { type: "submitPrompt", id });
const last = (s: StoreState): Message => {
  const list = s.messages[s.currentSessionId!];
  return list[list.length - 1];
};

describe("sign in", () => {
  it("asks for push permission right after the first sign in", () => {
    const s = r(INITIAL_STATE, { type: "signIn" });
    expect(s.signedIn).toBe(true);
    expect(s.permissionPrompt).toEqual({ kind: "push" });
  });
  it("does not ask again once answered", () => {
    let s = r(INITIAL_STATE, { type: "signIn" });
    s = r(s, { type: "answerPermission", value: "denied" });
    s = r(s, { type: "signOut" });
    s = r(s, { type: "signIn" });
    expect(s.permissionPrompt).toBeNull();
    expect(s.permissions.push).toBe("denied");
  });
  it("silent sign in (demo jumps) skips the prompt", () => {
    expect(signedIn().permissionPrompt).toBeNull();
  });
});

describe("submitPrompt", () => {
  it("creates a session, user message, plan and a running job, and charges credits", () => {
    const s = submit(signedIn(), "Make a latte ad for our cafe today");
    expect(s.currentSessionId).toBe("j1-s");
    expect(s.sessions[0]).toEqual({ id: "j1-s", title: "Make a latte ad for", group: "today" });
    expect(s.messages["j1-s"].map((m) => (m.role === "user" ? "user" : m.kind))).toEqual(["user", "plan", "job"]);
    expect(s.jobs[0]).toMatchObject({ id: "j1", status: "running", mode: "agent", workspace: "personal", sessionId: "j1-s", elapsedMs: 0 });
    expect(s.credits.personal).toBe(CREDITS_INITIAL.personal - MODE_COST.agent);
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
    let s = r(signedIn(), { type: "setComposer", patch: { mode: "video", model: "veo-3" } });
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
    expect(s.credits.personal).toBe(CREDITS_INITIAL.personal);
  });
  it("shows the personal low-credit notice and creates no job", () => {
    let s = r(signedIn(), { type: "setCreditsLow", low: true });
    s = submit(s, "Make a latte ad", "x");
    expect(s.jobs.find((j) => j.id === "x")).toBeUndefined();
    expect(last(s)).toMatchObject({ kind: "notice", text: insufficientCopy(s) });
    expect(insufficientCopy(s)).not.toMatch(/admin/i);
  });
  it("tells organization members to contact their admin", () => {
    let s = r(signedIn(), { type: "setWorkspace", workspace: "presslogic" });
    s = r(s, { type: "setCreditsLow", low: true });
    expect(insufficientCopy(s)).toMatch(/admin/i);
  });
  it("multiplies the cost by the batch count", () => {
    let s = r(signedIn(), { type: "setComposer", patch: { mode: "image", model: "seedream-5", batch: 3 } });
    s = submit(s, "Three posters");
    expect(s.credits.personal).toBe(CREDITS_INITIAL.personal - MODE_COST.image * 3);
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

describe("job actions", () => {
  it("retries a failed job", () => {
    const s = r(signedIn(), { type: "retryJob", id: "j-serum" });
    expect(s.jobs.find((j) => j.id === "j-serum")).toMatchObject({ status: "running", elapsedMs: 0 });
  });
  it("regenerates into a new job in the same session", () => {
    const s = r(signedIn(), { type: "regenerateJob", id: "j-latte", newId: "j9" });
    expect(s.jobs[0]).toMatchObject({ id: "j9", status: "running", sessionId: "s-latte" });
    const msgs = s.messages["s-latte"];
    expect(msgs[msgs.length - 1]).toMatchObject({ kind: "job", jobId: "j9" });
  });
  it("charges the current workspace when regenerating", () => {
    const src = signedIn().jobs.find((j) => j.id === "j-latte")!;
    const s = r(signedIn(), { type: "regenerateJob", id: "j-latte", newId: "j9" });
    expect(s.credits[s.workspace]).toBe(CREDITS_INITIAL[s.workspace] - MODE_COST[src.mode]);
  });
  it("does not regenerate when credits are insufficient", () => {
    let s = r(signedIn(), { type: "setCreditsLow", low: true });
    s = r(s, { type: "setCreditsLow", low: true });
    s = { ...s, credits: { ...s.credits, [s.workspace]: 0 } };
    const before = s.jobs.length;
    s = r(s, { type: "regenerateJob", id: "j-latte", newId: "j9" });
    expect(s.jobs.length).toBe(before);
    expect(s.jobs.find((j) => j.id === "j9")).toBeUndefined();
    expect(s.credits[s.workspace]).toBe(0);
    expect(s.toast).toBe(insufficientCopy(s));
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
    let s = r(signedIn(), { type: "setCreditsLow", low: true });
    expect(s.credits).toEqual({ personal: LOW_CREDITS, presslogic: CREDITS_INITIAL.presslogic });
    s = r(s, { type: "setCreditsLow", low: false });
    expect(s.credits.personal).toBe(CREDITS_INITIAL.personal);
  });
  it("only offers the web top-up link in the US", () => {
    expect(canTopUpOnWeb(signedIn())).toBe(true);
    expect(canTopUpOnWeb(r(signedIn(), { type: "setRegion", region: "other" }))).toBe(false);
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
    expect(s.composer.model).toBe(defaultModel("video"));
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
    let s = r(signedIn(), { type: "setCreditsLow", low: true });
    s = submit(s, "Make a latte ad", "x");
    expect(s.composer.text).toBe("Make a latte ad");
  });
  it("keeps the draft when content is refused", () => {
    const s = submit(signedIn(), "make a deepfake of a celebrity", "x");
    expect(s.composer.text).toBe("make a deepfake of a celebrity");
  });
});

describe("account", () => {
  it("deleting the account signs out, resets data and keeps the demo region", () => {
    let s = r(signedIn(), { type: "setRegion", region: "other" });
    s = submit(s, "hi");
    s = r(s, { type: "deleteAccount" });
    expect(s.signedIn).toBe(false);
    expect(s.region).toBe("other");
    expect(s.jobs).toEqual(INITIAL_STATE.jobs);
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
