import {
  CREDITS_INITIAL,
  MODE_COST,
  PLANS,
  RESULTS,
  SEED_JOBS,
  SEED_MESSAGES,
  SEED_SESSIONS,
  defaultModel,
  workspaceName,
  type Mode,
  type UseCase,
  type WorkspaceId,
} from "./data";

/* ---------- 类型 ---------- */

export type Region = "us" | "other";
export type PermissionKind = "push" | "camera" | "photos";
export type PermissionValue = "undetermined" | "granted" | "limited" | "denied";
export type JobStatus = "running" | "done" | "failed";

export type Job = {
  id: string;
  title: string;
  prompt: string;
  mode: Mode;
  model: string | null;
  status: JobStatus;
  elapsedMs: number;
  cover: string;
  video?: string;
  workspace: WorkspaceId;
  sessionId: string;
};

export type Attachment = { id: string; uri: string; kind: "photo" | "video" | "pdf"; label?: string };
export type Upload = { id: string; uri: string; kind: Attachment["kind"]; progress: number; workspace: WorkspaceId };

export type Message =
  | { id: string; role: "user"; text: string; attachments: Attachment[] }
  | { id: string; role: "agent"; kind: "plan"; text: string; pills: string[] }
  | { id: string; role: "agent"; kind: "job"; jobId: string }
  | { id: string; role: "agent"; kind: "notice"; text: string };

export type Session = { id: string; title: string; group: "today" | "yesterday" | "week" };

export type Composer = {
  text: string;
  mode: Mode;
  model: string | null;
  batch: number;
  ratio: "9:16" | "1:1" | "16:9";
  attachments: Attachment[];
};

export type PermissionPrompt = { kind: PermissionKind; then?: "openCamera" } | null;

export type StoreState = {
  signedIn: boolean;
  region: Region;
  workspace: WorkspaceId;
  credits: Record<WorkspaceId, number>;
  permissions: Record<PermissionKind, PermissionValue>;
  permissionPrompt: PermissionPrompt;
  jobs: Job[];
  uploads: Upload[];
  sessions: Session[];
  messages: Record<string, Message[]>;
  currentSessionId: string | null;
  composer: Composer;
  pushBanner: { jobId: string } | null;
  toast: string | null;
};

export type StoreAction =
  | { type: "signIn"; silent?: boolean }
  | { type: "signOut" }
  | { type: "deleteAccount" }
  | { type: "reset" }
  | { type: "setRegion"; region: Region }
  | { type: "setWorkspace"; workspace: WorkspaceId }
  | { type: "setCreditsLow"; low: boolean }
  | { type: "setPermission"; kind: PermissionKind; value: PermissionValue }
  | { type: "requestPermission"; kind: PermissionKind; then?: "openCamera" }
  | { type: "answerPermission"; value: PermissionValue }
  | { type: "setComposer"; patch: Partial<Composer> }
  | { type: "addAttachments"; items: (Attachment & { uploaded?: boolean })[] }
  | { type: "removeAttachment"; id: string }
  | { type: "submitPrompt"; id: string }
  | { type: "tick"; ms: number }
  | { type: "simulatePush" }
  | { type: "retryJob"; id: string }
  | { type: "regenerateJob"; id: string; newId: string }
  | { type: "deleteJob"; id: string }
  | { type: "dismissPush" }
  | { type: "selectSession"; id: string | null }
  | { type: "renameSession"; id: string; title: string }
  | { type: "deleteSession"; id: string }
  | { type: "showToast"; text: string }
  | { type: "hideToast" };

/* ---------- 常量 ---------- */

/** 模拟生成耗时 */
export const GENERATION_MS = 8000;
/** 模拟一个文件从手机上传完的耗时 */
export const UPLOAD_MS = 3000;
/** 演示「积分不足」时的余额 */
export const LOW_CREDITS = 20;

/** 内容过滤:演示用的关键词,真实 APP 由服务端审核 */
const BLOCKED = /\b(nude|naked|porn|gore|deepfake|violence)\b/i;
const REFUSAL =
  "I can’t help create that. BuzzVideo doesn’t generate sexual, violent, hateful or deceptive content about real people.";

export const EMPTY_COMPOSER: Composer = { text: "", mode: "agent", model: null, batch: 1, ratio: "9:16", attachments: [] };

export const INITIAL_STATE: StoreState = {
  signedIn: false,
  region: "us",
  workspace: "personal",
  credits: { ...CREDITS_INITIAL },
  permissions: { push: "undetermined", camera: "undetermined", photos: "undetermined" },
  permissionPrompt: null,
  jobs: SEED_JOBS,
  uploads: [],
  sessions: SEED_SESSIONS,
  messages: SEED_MESSAGES,
  currentSessionId: null,
  composer: EMPTY_COMPOSER,
  pushBanner: null,
  toast: null,
};

/* ---------- selector ---------- */

export const jobProgress = (j: Job) => Math.min(1, j.elapsedMs / GENERATION_MS);
export const worksFor = (s: StoreState) => s.jobs.filter((j) => j.workspace === s.workspace);
export const runningCount = (s: StoreState) => worksFor(s).filter((j) => j.status === "running").length;
export const uploadsFor = (s: StoreState) => s.uploads.filter((u) => u.workspace === s.workspace);
export const uploadProgress = (s: StoreState, id: string) => s.uploads.find((u) => u.id === id)?.progress ?? 1;
/** 平台规则:只有美国区可以放「去网页充值」的外链 */
export const canTopUpOnWeb = (s: StoreState) => s.region === "us";
export const insufficientCopy = (s: StoreState) =>
  s.workspace === "personal"
    ? "Not enough credits for this request."
    : `Not enough credits in ${workspaceName(s.workspace)}. Contact your workspace admin.`;

export function composerFromUseCase(uc: UseCase, makeId: (prefix: string) => string): Composer {
  return {
    ...EMPTY_COMPOSER,
    text: uc.prompt,
    mode: uc.mode,
    model: uc.model ?? defaultModel(uc.mode),
    attachments: uc.attachments.map((uri) => ({ id: makeId("a"), uri, kind: "photo" as const })),
  };
}

/* ---------- reducer ---------- */

const titleFrom = (text: string) => {
  const words = text.trim().split(/\s+/).slice(0, 5).join(" ");
  return words ? words[0].toUpperCase() + words.slice(1) : "New request";
};

const withBanner = (s: StoreState, jobId: string | undefined) =>
  jobId && s.permissions.push === "granted" ? { jobId } : s.pushBanner;

function submitPrompt(s: StoreState, id: string): StoreState {
  const c = s.composer;
  const text = c.text.trim();
  if (!text && c.attachments.length === 0) return s;

  const ws = s.workspace;
  const sessionId = s.currentSessionId ?? `${id}-s`;
  const user: Message = { id: `${id}-u`, role: "user", text, attachments: c.attachments };
  const cost = MODE_COST[c.mode] * c.batch;
  let jobs = s.jobs;
  let credits = s.credits;
  let replies: Message[];

  if (BLOCKED.test(text)) {
    replies = [{ id: `${id}-n`, role: "agent", kind: "notice", text: REFUSAL }];
  } else if (credits[ws] < cost) {
    replies = [{ id: `${id}-n`, role: "agent", kind: "notice", text: insufficientCopy(s) }];
  } else {
    const job: Job = {
      id,
      title: titleFrom(text),
      prompt: text,
      mode: c.mode,
      model: c.model,
      status: "running",
      elapsedMs: 0,
      cover: RESULTS[c.mode].cover,
      video: RESULTS[c.mode].video,
      workspace: ws,
      sessionId,
    };
    jobs = [job, ...jobs];
    credits = { ...credits, [ws]: credits[ws] - cost };
    replies = [
      { id: `${id}-p`, role: "agent", kind: "plan", text: PLANS[c.mode].text, pills: PLANS[c.mode].pills },
      { id: `${id}-j`, role: "agent", kind: "job", jobId: id },
    ];
  }

  return {
    ...s,
    jobs,
    credits,
    sessions: s.currentSessionId ? s.sessions : [{ id: sessionId, title: titleFrom(text), group: "today" }, ...s.sessions],
    messages: { ...s.messages, [sessionId]: [...(s.messages[sessionId] ?? []), user, ...replies] },
    currentSessionId: sessionId,
    composer: { ...EMPTY_COMPOSER, mode: c.mode, model: c.model, batch: c.batch, ratio: c.ratio },
  };
}

function tick(s: StoreState, ms: number): StoreState {
  const busy = s.jobs.some((j) => j.status === "running") || s.uploads.some((u) => u.progress < 1);
  if (!busy) return s;
  let finished: string | undefined;
  const jobs = s.jobs.map((j) => {
    if (j.status !== "running") return j;
    const elapsedMs = j.elapsedMs + ms;
    if (elapsedMs < GENERATION_MS) return { ...j, elapsedMs };
    finished = j.id;
    return { ...j, elapsedMs: GENERATION_MS, status: "done" as const };
  });
  const uploads = s.uploads.map((u) => (u.progress >= 1 ? u : { ...u, progress: Math.min(1, u.progress + ms / UPLOAD_MS) }));
  return { ...s, jobs, uploads, pushBanner: withBanner(s, finished) };
}

export function storeReducer(s: StoreState, a: StoreAction): StoreState {
  switch (a.type) {
    case "signIn":
      return {
        ...s,
        signedIn: true,
        permissionPrompt: !a.silent && s.permissions.push === "undetermined" ? { kind: "push" } : s.permissionPrompt,
      };
    case "signOut":
      return { ...s, signedIn: false, pushBanner: null, permissionPrompt: null, currentSessionId: null };
    case "deleteAccount":
      return { ...INITIAL_STATE, region: s.region, toast: "Your account has been deleted." };
    case "reset":
      return INITIAL_STATE;
    case "setRegion":
      return { ...s, region: a.region };
    case "setWorkspace":
      return { ...s, workspace: a.workspace };
    case "setCreditsLow":
      return { ...s, credits: { ...s.credits, [s.workspace]: a.low ? LOW_CREDITS : CREDITS_INITIAL[s.workspace] } };
    case "setPermission":
      return { ...s, permissions: { ...s.permissions, [a.kind]: a.value } };
    case "requestPermission":
      if (s.permissions[a.kind] !== "undetermined") return s;
      return { ...s, permissionPrompt: a.then ? { kind: a.kind, then: a.then } : { kind: a.kind } };
    case "answerPermission":
      if (!s.permissionPrompt) return s;
      return { ...s, permissions: { ...s.permissions, [s.permissionPrompt.kind]: a.value }, permissionPrompt: null };
    case "setComposer":
      return { ...s, composer: { ...s.composer, ...a.patch } };
    case "addAttachments": {
      const attachments = a.items.map(({ uploaded: _uploaded, ...att }) => att);
      const uploads: Upload[] = a.items
        .filter((i) => !i.uploaded)
        .map((i) => ({ id: i.id, uri: i.uri, kind: i.kind, progress: 0, workspace: s.workspace }));
      return {
        ...s,
        composer: { ...s.composer, attachments: [...s.composer.attachments, ...attachments] },
        uploads: [...uploads, ...s.uploads],
      };
    }
    case "removeAttachment":
      return { ...s, composer: { ...s.composer, attachments: s.composer.attachments.filter((x) => x.id !== a.id) } };
    case "submitPrompt":
      return submitPrompt(s, a.id);
    case "tick":
      return tick(s, a.ms);
    case "simulatePush": {
      const running = worksFor(s).filter((j) => j.status === "running");
      if (running.length === 0) {
        const latest = worksFor(s).find((j) => j.status === "done");
        return { ...s, pushBanner: withBanner(s, latest?.id) };
      }
      return {
        ...s,
        jobs: s.jobs.map((j) => (running.includes(j) ? { ...j, status: "done" as const, elapsedMs: GENERATION_MS } : j)),
        pushBanner: withBanner(s, running[0].id),
      };
    }
    case "retryJob":
      return { ...s, jobs: s.jobs.map((j) => (j.id === a.id ? { ...j, status: "running" as const, elapsedMs: 0 } : j)) };
    case "regenerateJob": {
      const src = s.jobs.find((j) => j.id === a.id);
      if (!src) return s;
      const job: Job = { ...src, id: a.newId, status: "running", elapsedMs: 0 };
      const card: Message = { id: `${a.newId}-j`, role: "agent", kind: "job", jobId: a.newId };
      return {
        ...s,
        jobs: [job, ...s.jobs],
        messages: { ...s.messages, [src.sessionId]: [...(s.messages[src.sessionId] ?? []), card] },
      };
    }
    case "deleteJob": {
      const messages = Object.fromEntries(
        Object.entries(s.messages).map(([k, list]) => [
          k,
          list.filter((m) => !(m.role === "agent" && m.kind === "job" && m.jobId === a.id)),
        ]),
      );
      return {
        ...s,
        jobs: s.jobs.filter((j) => j.id !== a.id),
        messages,
        pushBanner: s.pushBanner?.jobId === a.id ? null : s.pushBanner,
      };
    }
    case "dismissPush":
      return { ...s, pushBanner: null };
    case "selectSession":
      return { ...s, currentSessionId: a.id, composer: EMPTY_COMPOSER };
    case "renameSession":
      return { ...s, sessions: s.sessions.map((x) => (x.id === a.id ? { ...x, title: a.title.trim() || x.title } : x)) };
    case "deleteSession": {
      const { [a.id]: _removed, ...messages } = s.messages;
      return {
        ...s,
        sessions: s.sessions.filter((x) => x.id !== a.id),
        messages,
        currentSessionId: s.currentSessionId === a.id ? null : s.currentSessionId,
      };
    }
    case "showToast":
      return { ...s, toast: a.text };
    case "hideToast":
      return { ...s, toast: null };
  }
}
