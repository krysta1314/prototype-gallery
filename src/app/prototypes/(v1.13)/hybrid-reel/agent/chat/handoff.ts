/* 落地页 composer → 对话页 的单向交接。
   File 对象放不进 sessionStorage,而 router.push 是客户端跳转、document 不换,
   所以用模块级变量托一程就够了。硬刷新会丢,对话页据此退回空态,提示回落地页重来。 */

export type PendingHandoff = {
  files: File[];
  prompt: string;
};

let pending: PendingHandoff | null = null;

export function setPendingHandoff(next: PendingHandoff) {
  pending = next;
}

/** 取走即清空,避免刷新/返回时重复触发分析 */
export function takePendingHandoff(): PendingHandoff | null {
  const current = pending;
  pending = null;
  return current;
}

/* ── 会话记录 ──
   真实产品里 History 栏来自服务端;原型里把跑过的 Hybrid Reel 会话记在模块内存,
   落地页和对话页共用同一个 History 栏都读它。素材是 blob URL,同一 document 内一直有效,
   所以客户端跳转回来能原样恢复;硬刷新会丢,那时 History 里就没有了,和真实产品「未保存草稿」一致。 */
export type StoredSession = {
  id: string;
  title: string;
  createdAt: number;
  messages: unknown[];
  profiles: unknown[];
  brief: unknown;
  queue: number[];
};

const sessions: StoredSession[] = [];

export function saveSession(next: StoredSession) {
  const i = sessions.findIndex((s) => s.id === next.id);
  if (i === -1) sessions.unshift(next);
  else sessions[i] = next;
}

export function listSessions(): StoredSession[] {
  return sessions;
}

export function getSession(id: string | null): StoredSession | null {
  if (!id) return null;
  return sessions.find((s) => s.id === id) ?? null;
}

export function latestSession(): StoredSession | null {
  return sessions[0] ?? null;
}
