import {
  CREDITS_INITIAL,
  MODE_COST,
  isModelLocked,
  planFor,
  resultFor,
  CAP_STEP,
  SEED_FAVORITES,
  SEED_MEMBERS,
  SEED_JOBS,
  TEAM_ASSETS,
  LIBRARY_ASSETS,
  SEED_MESSAGES,
  SEED_SESSIONS,
  defaultModel,
  workspaceName,
  planLabel,
  type Member,
  type PaidPlanId,
  type PlanId,
  type Mode,
  type UseCase,
  type WorkspaceId,
} from "./data";

/* ---------- 类型 ---------- */

export type SubscriptionSource = "none" | "web" | "app";
export type Subscription = { plan: PlanId; source: SubscriptionSource };
export const NO_SUBSCRIPTION: Subscription = { plan: "free", source: "none" };
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
  /** 最后修改序号(越大越新);reducer 取现有最大值 + 1,不读系统时钟。缺省视为 0 */
  modifiedAt?: number;
};

export type Attachment = { id: string; uri: string; kind: "photo" | "video" | "pdf"; label?: string; duration?: string };
export type Upload = { id: string; uri: string; kind: Attachment["kind"]; progress: number; workspace: WorkspaceId; modifiedAt?: number };
export type Role = "owner" | "admin" | "member";
export const ROLE_LABEL: Record<Role, string> = { owner: "Owner", admin: "Admin", member: "Member" };

export type Message =
  | { id: string; role: "user"; text: string; attachments: Attachment[] }
  | { id: string; role: "agent"; kind: "plan"; text: string; pills: string[] }
  | { id: string; role: "agent"; kind: "job"; jobId: string }
  /** cta: "plans" 时文案后带 See plans 入口(个人空间积分不足) */
  | { id: string; role: "agent"; kind: "notice"; text: string; cta?: "plans" };

/** updatedAt 是排序键(越大越新);reducer 保持纯,新值取现有最大值 + 1,不读系统时钟 */
export type Session = { id: string; title: string; updatedAt: number; pinned: boolean; workspace: WorkspaceId };

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
  /** 首次打开流程:看过 Onboarding / 同意过隐私弹窗 / 弹过订阅页。退出登录保留,删号与 reset 才清零 */
  onboarded: boolean;
  privacyAccepted: boolean;
  plansPromptShown: boolean;
  /** 首次登录后要自动打开订阅页(signIn 置位,UI 打开订阅页后 consumePlansPrompt 清掉) */
  plansPromptPending: boolean;
  /** 当前用户在各组织工作区的角色(个人空间没有角色) */
  roles: Partial<Record<WorkspaceId, Role>>;
  /** 各工作区的成员(含每月积分上限) */
  members: Record<WorkspaceId, Member[]>;
  /** 收藏的素材 id(作品、上传、素材库、团队素材通用) */
  favorites: string[];
  subscription: Subscription;
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
  | { type: "completeOnboarding" }
  | { type: "acceptPrivacy" }
  | { type: "consumePlansPrompt" }
  | { type: "signIn" }
  | { type: "signOut" }
  | { type: "deleteAccount" }
  | { type: "reset" }
  | { type: "purchasePlan"; plan: PaidPlanId }
  | { type: "restorePurchases" }
  | { type: "setWebSubscriber"; on: boolean }
  | { type: "setRole"; workspace: WorkspaceId; role: Role }
  | { type: "setMemberCap"; workspace: WorkspaceId; id: string; cap: number }
  | { type: "toggleFavorite"; id: string }
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
  | { type: "togglePinSession"; id: string }
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
/** 重新生成成功时的提示;积分不足时 reducer 改为提示 insufficientCopy */
export const REGENERATING_COPY = "Regenerating — we’ll notify you";

/** 内容过滤:演示用的关键词,真实 APP 由服务端审核 */
const BLOCKED = /\b(nude|naked|porn|gore|deepfake|violence)\b/i;
const REFUSAL =
  "I can’t help create that. BuzzVideo doesn’t generate sexual, violent, hateful or deceptive content about real people.";

export const EMPTY_COMPOSER: Composer = { text: "", mode: "agent", model: null, batch: 1, ratio: "9:16", attachments: [] };

export const INITIAL_STATE: StoreState = {
  signedIn: false,
  onboarded: false,
  privacyAccepted: false,
  plansPromptShown: false,
  plansPromptPending: false,
  roles: { presslogic: "admin" },
  members: SEED_MEMBERS,
  favorites: [...SEED_FAVORITES],
  subscription: NO_SUBSCRIPTION,
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
/** 当前工作区的会话:置顶在前,其余按 updatedAt 倒序(不分组) */
export const sessionsFor = (s: StoreState) =>
  s.sessions
    .filter((x) => x.workspace === s.workspace)
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt);
const nextStamp = (list: Session[]) => list.reduce((m, x) => Math.max(m, x.updatedAt), 0) + 1;
/** 下一个「最后修改」序号:比当前所有作品、上传、素材库、团队素材都新 */
export const nextModified = (s: StoreState) =>
  Math.max(
    0,
    ...s.jobs.map((j) => j.modifiedAt ?? 0),
    ...s.uploads.map((u) => u.modifiedAt ?? 0),
    ...LIBRARY_ASSETS.map((x) => x.modifiedAt),
    ...TEAM_ASSETS.map((x) => x.modifiedAt),
  ) + 1;
/** 当前用户是否拥有任何组织工作区 */
export const ownsWorkspace = (s: StoreState) => Object.values(s.roles).includes("owner");
/** 当前工作区是组织,且当前用户是 admin / owner 时才能管理成员 */
export const canManageMembers = (s: StoreState) => {
  const role = s.roles[s.workspace];
  return s.workspace !== "personal" && (role === "admin" || role === "owner");
};
/** 当前工作区的成员;当前用户那一行的角色取自 roles */
export const membersFor = (s: StoreState): Member[] =>
  s.members[s.workspace].map((m) => (m.self ? { ...m, role: s.roles[s.workspace] ?? m.role } : m));
/** 上限合法:步长 100 的整数,且不低于该成员本月已用积分 */
export const isValidCap = (m: Member, cap: number) => Number.isInteger(cap) && cap % CAP_STEP === 0 && cap >= m.used && cap > 0;
export const runningCount = (s: StoreState) => worksFor(s).filter((j) => j.status === "running").length;
export const uploadsFor = (s: StoreState) => s.uploads.filter((u) => u.workspace === s.workspace);
export const uploadProgress = (s: StoreState, id: string) => s.uploads.find((u) => u.id === id)?.progress ?? 1;
/** 套餐锁定的模型:非 Pro / Ultra 用户不能用 */
export const modelLocked = (s: StoreState, modelId: string) => isModelLocked(s.subscription.plan, modelId);
export const insufficientCopy = (s: StoreState, ws: WorkspaceId = s.workspace) =>
  ws === "personal"
    ? "Not enough credits for this request."
    : `Not enough credits in ${workspaceName(ws)}. Contact your workspace admin.`;

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

/** 只在已登录、允许推送、且作品属于当前工作区时弹横幅 */
const withBanner = (s: StoreState, job: Job | undefined) =>
  job && s.signedIn && s.permissions.push === "granted" && job.workspace === s.workspace ? { jobId: job.id } : s.pushBanner;

function normalizeComposer(cur: Composer, patch: Partial<Composer>): Composer {
  const next = { ...cur, ...patch };
  if (next.mode === "agent") next.model = null;
  else if (patch.mode !== undefined && patch.model === undefined) next.model = defaultModel(next.mode);
  next.batch = Math.min(4, Math.max(1, Math.round(next.batch) || 1));
  return next;
}

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
    replies = [{ id: `${id}-n`, role: "agent", kind: "notice", text: insufficientCopy(s), ...(ws === "personal" ? { cta: "plans" as const } : {}) }];
  } else {
    const result = resultFor(c.mode, text);
    const job: Job = {
      id,
      title: result.title ?? titleFrom(text),
      prompt: text,
      mode: c.mode,
      model: c.model,
      status: "running",
      elapsedMs: 0,
      cover: result.cover,
      video: result.video,
      workspace: ws,
      sessionId,
      modifiedAt: nextModified(s),
    };
    jobs = [job, ...jobs];
    credits = { ...credits, [ws]: credits[ws] - cost };
    replies = [
      { id: `${id}-p`, role: "agent", kind: "plan", ...planFor(c.mode, text) },
      { id: `${id}-j`, role: "agent", kind: "job", jobId: id },
    ];
  }

  // 被拒或积分不足:保留草稿,不清空输入框
  const created = jobs !== s.jobs;
  return {
    ...s,
    jobs,
    credits,
    sessions: s.currentSessionId
      ? s.sessions.map((x) => (x.id === sessionId && created ? { ...x, updatedAt: nextStamp(s.sessions) } : x))
      : [
          { id: sessionId, title: resultFor(c.mode, text).title ?? titleFrom(text), updatedAt: nextStamp(s.sessions), pinned: false, workspace: ws },
          ...s.sessions,
        ],
    messages: { ...s.messages, [sessionId]: [...(s.messages[sessionId] ?? []), user, ...replies] },
    currentSessionId: sessionId,
    composer: created ? { ...EMPTY_COMPOSER, mode: c.mode, model: c.model, batch: c.batch, ratio: c.ratio } : c,
  };
}

function tick(s: StoreState, ms: number): StoreState {
  const busy = s.jobs.some((j) => j.status === "running") || s.uploads.some((u) => u.progress < 1);
  if (!busy) return s;
  let finished: Job | undefined;
  const jobs = s.jobs.map((j) => {
    if (j.status !== "running") return j;
    const elapsedMs = j.elapsedMs + ms;
    if (elapsedMs < GENERATION_MS) return { ...j, elapsedMs };
    const done = { ...j, elapsedMs: GENERATION_MS, status: "done" as const };
    finished = done;
    return done;
  });
  const uploads = s.uploads.map((u) => (u.progress >= 1 ? u : { ...u, progress: Math.min(1, u.progress + ms / UPLOAD_MS) }));
  return { ...s, jobs, uploads, pushBanner: withBanner(s, finished) };
}

export function storeReducer(s: StoreState, a: StoreAction): StoreState {
  switch (a.type) {
    case "completeOnboarding":
      return { ...s, onboarded: true };
    case "acceptPrivacy":
      return { ...s, privacyAccepted: true };
    case "consumePlansPrompt":
      return { ...s, plansPromptPending: false };
    case "signIn": {
      // 推送授权在隐私弹窗同意后、登录页上由 App 请求(requestPermission)
      // Free 用户首次登录后自动打开一次订阅页;网页订阅者(plan 非 free)不弹
      const prompt = s.subscription.plan === "free" && !s.plansPromptShown;
      return { ...s, signedIn: true, plansPromptShown: s.plansPromptShown || prompt, plansPromptPending: prompt };
    }
    case "signOut":
      return { ...s, signedIn: false, plansPromptPending: false, pushBanner: null, permissionPrompt: null, currentSessionId: null };
    case "deleteAccount":
      return { ...INITIAL_STATE, jobs: [], sessions: [], messages: {}, uploads: [], favorites: [], toast: "Your account has been deleted." };
    case "reset":
      return INITIAL_STATE;
    case "purchasePlan":
      // 已在网页订阅:不能再在 APP 内购买(订阅页也不显示 Subscribe)
      if (s.subscription.source === "web") return s;
      return { ...s, subscription: { plan: a.plan, source: "app" }, toast: `You're on ${planLabel(a.plan)}` };
    case "restorePurchases":
      return { ...s, toast: "Purchases restored" };
    case "setWebSubscriber":
      if (a.on) return { ...s, subscription: { plan: "pro", source: "web" } };
      // 关闭演示开关只撤销网页订阅,不动 APP 内购买
      return s.subscription.source === "web" ? { ...s, subscription: NO_SUBSCRIPTION } : s;
    case "setRole":
      return { ...s, roles: { ...s.roles, [a.workspace]: a.role } };
    case "setMemberCap": {
      const m = s.members[a.workspace].find((x) => x.id === a.id);
      if (!m || !isValidCap(m, a.cap)) return s;
      return {
        ...s,
        members: { ...s.members, [a.workspace]: s.members[a.workspace].map((x) => (x.id === a.id ? { ...x, cap: a.cap } : x)) },
      };
    }
    case "toggleFavorite":
      return { ...s, favorites: s.favorites.includes(a.id) ? s.favorites.filter((x) => x !== a.id) : [...s.favorites, a.id] };
    case "setWorkspace":
      if (a.workspace === s.workspace) return s;
      return { ...s, workspace: a.workspace, currentSessionId: null, composer: EMPTY_COMPOSER };
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
      return { ...s, composer: normalizeComposer(s.composer, a.patch) };
    case "addAttachments": {
      const attachments = a.items.map(({ uploaded: _uploaded, ...att }) => att);
      const uploads: Upload[] = a.items
        .filter((i) => !i.uploaded)
        .map((i, n) => ({ id: i.id, uri: i.uri, kind: i.kind, progress: 0, workspace: s.workspace, modifiedAt: nextModified(s) + n }));
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
        return { ...s, pushBanner: withBanner(s, latest) };
      }
      return {
        ...s,
        jobs: s.jobs.map((j) => (running.includes(j) ? { ...j, status: "done" as const, elapsedMs: GENERATION_MS } : j)),
        pushBanner: withBanner(s, { ...running[0], status: "done" }),
      };
    }
    case "retryJob":
      return { ...s, jobs: s.jobs.map((j) => (j.id === a.id ? { ...j, status: "running" as const, elapsedMs: 0, modifiedAt: nextModified(s) } : j)) };
    case "regenerateJob": {
      const src = s.jobs.find((j) => j.id === a.id);
      if (!src) return s;
      const ws = src.workspace;
      const cost = MODE_COST[src.mode];
      if (s.credits[ws] < cost) {
        // 仍弹 toast;同时在该任务所在会话里补一条提示(个人空间带 See plans,组织不带)
        const notice: Message = {
          id: `${a.newId}-n`,
          role: "agent",
          kind: "notice",
          text: insufficientCopy(s, ws),
          ...(ws === "personal" ? { cta: "plans" as const } : {}),
        };
        return {
          ...s,
          toast: insufficientCopy(s, ws),
          messages: s.sessions.some((x) => x.id === src.sessionId)
            ? { ...s.messages, [src.sessionId]: [...(s.messages[src.sessionId] ?? []), notice] }
            : s.messages,
        };
      }
      const job: Job = { ...src, id: a.newId, status: "running", elapsedMs: 0, workspace: ws, modifiedAt: nextModified(s) };
      const card: Message = { id: `${a.newId}-j`, role: "agent", kind: "job", jobId: a.newId };
      const hasSession = s.sessions.some((x) => x.id === src.sessionId);
      return {
        ...s,
        jobs: [job, ...s.jobs],
        credits: { ...s.credits, [ws]: s.credits[ws] - cost },
        toast: REGENERATING_COPY,
        messages: hasSession
          ? { ...s.messages, [src.sessionId]: [...(s.messages[src.sessionId] ?? []), card] }
          : s.messages,
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
      return {
        ...s,
        currentSessionId: a.id !== null && s.sessions.some((x) => x.id === a.id && x.workspace === s.workspace) ? a.id : null,
        composer: EMPTY_COMPOSER,
      };
    case "renameSession":
      return { ...s, sessions: s.sessions.map((x) => (x.id === a.id ? { ...x, title: a.title.trim() || x.title } : x)) };
    case "togglePinSession":
      return { ...s, sessions: s.sessions.map((x) => (x.id === a.id ? { ...x, pinned: !x.pinned } : x)) };
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
