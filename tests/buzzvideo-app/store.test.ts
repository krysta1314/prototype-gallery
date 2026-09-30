import { describe, expect, it } from "vitest";
import {
  EMPTY_COMPOSER,
  GENERATION_MS,
  INITIAL_STATE,
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
  storeReducer as r,
  uploadProgress,
  worksFor,
  type Message,
  type StoreState,
} from "@/app/prototypes/(app-mvp)/buzzvideo-app/app/store";
import { CREDITS_INITIAL, MODE_COST, USE_CASES, defaultModel } from "@/app/prototypes/(app-mvp)/buzzvideo-app/app/data";

const signedIn = (): StoreState => r(INITIAL_STATE, { type: "signIn" });
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
  it("tells the user the regeneration started", () => {
    const s = r(signedIn(), { type: "regenerateJob", id: "j-latte", newId: "j9" });
    expect(s.toast).toBe(REGENERATING_COPY);
  });
  it("charges the source job's workspace when regenerating", () => {
    let s = r(signedIn(), { type: "setWorkspace", workspace: "presslogic" });
    s = r(s, { type: "regenerateJob", id: "j-latte", newId: "j9" });
    expect(s.jobs[0]).toMatchObject({ id: "j9", workspace: "personal" });
    expect(s.credits.personal).toBe(CREDITS_INITIAL.personal - MODE_COST.agent);
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
  it("demo org role is admin; setRole to owner makes the user a workspace owner", () => {
    let s = signedIn();
    expect(s.roles.presslogic).toBe("admin");
    expect(ownsWorkspace(s)).toBe(false);
    s = r(s, { type: "setRole", workspace: "presslogic", role: "owner" });
    expect(ownsWorkspace(s)).toBe(true);
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
    let s = r(signedIn(), { type: "purchasePlan", plan: "pro" });
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
    const org = r(INITIAL_STATE, { type: "setWorkspace", workspace: "presslogic" });
    expect(canManageMembers(INITIAL_STATE)).toBe(false);
    expect(canManageMembers(org)).toBe(true);
    expect(canManageMembers(r(org, { type: "setRole", workspace: "presslogic", role: "owner" }))).toBe(true);
    expect(canManageMembers(r(org, { type: "setRole", workspace: "presslogic", role: "member" }))).toBe(false);
  });
  it("shows the current user's role from roles", () => {
    const org = r(r(INITIAL_STATE, { type: "setWorkspace", workspace: "presslogic" }), { type: "setRole", workspace: "presslogic", role: "owner" });
    expect(membersFor(org).find((m) => m.self)!.role).toBe("owner");
  });
});

describe("subscription", () => {
  it("starts free with no source", () => {
    expect(INITIAL_STATE.subscription).toEqual({ plan: "free", source: "none" });
  });
  it("purchasing records the plan with source app and toasts", () => {
    const s = r(signedIn(), { type: "purchasePlan", plan: "pro" });
    expect(s.subscription).toEqual({ plan: "pro", source: "app" });
    expect(s.toast).toBe("You're on Pro");
  });
  it("an app subscriber can change plan", () => {
    const s = r(r(signedIn(), { type: "purchasePlan", plan: "starter" }), { type: "purchasePlan", plan: "ultra" });
    expect(s.subscription).toEqual({ plan: "ultra", source: "app" });
  });
  it("a web subscriber cannot buy again in the app", () => {
    const web = r(signedIn(), { type: "setWebSubscriber", on: true });
    expect(web.subscription).toEqual({ plan: "pro", source: "web" });
    const s = r(web, { type: "purchasePlan", plan: "ultra" });
    expect(s).toBe(web);
  });
  it("turning the demo web subscriber off returns to free", () => {
    const s = r(r(signedIn(), { type: "setWebSubscriber", on: true }), { type: "setWebSubscriber", on: false });
    expect(s.subscription).toEqual({ plan: "free", source: "none" });
  });
  it("restoring purchases only toasts and keeps the subscription", () => {
    const sub = r(signedIn(), { type: "purchasePlan", plan: "starter" });
    const s = r(sub, { type: "restorePurchases" });
    expect(s.toast).toBe("Purchases restored");
    expect(s.subscription).toEqual(sub.subscription);
    const web = r(signedIn(), { type: "setWebSubscriber", on: true });
    expect(r(web, { type: "restorePurchases" }).subscription).toEqual(web.subscription);
  });
  it("Seedance 2.0 is locked unless Pro or Ultra", () => {
    const at = (plan: "starter" | "pro" | "ultra") => r(signedIn(), { type: "purchasePlan", plan });
    expect(modelLocked(signedIn(), "seedance-2")).toBe(true);
    expect(modelLocked(at("starter"), "seedance-2")).toBe(true);
    expect(modelLocked(at("pro"), "seedance-2")).toBe(false);
    expect(modelLocked(at("ultra"), "seedance-2")).toBe(false);
    expect(modelLocked(r(signedIn(), { type: "setWebSubscriber", on: true }), "seedance-2")).toBe(false);
    expect(modelLocked(signedIn(), "seedance-2-5")).toBe(false);
  });
  it("personal low-credit notice offers See plans; organization does not", () => {
    const low = (s: StoreState) => r(s, { type: "setCreditsLow", low: true });
    let s = submit(low(signedIn()), "a video", "jl");
    expect(last(s)).toMatchObject({ kind: "notice", cta: "plans" });
    s = r(signedIn(), { type: "setWorkspace", workspace: "presslogic" });
    s = submit(r(s, { type: "setCreditsLow", low: true }), "a video", "jo");
    expect(last(s)).toMatchObject({ kind: "notice" });
    expect((last(s) as { cta?: string }).cta).toBeUndefined();
  });
});
