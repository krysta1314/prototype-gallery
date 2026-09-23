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
   真实产品里 History 栏来自服务端;原型里存在浏览器本地:
   - 对话文字(消息、素材分析、brief)→ localStorage
   - 素材文件本身 → IndexedDB(blob 太大,放不进 localStorage)
   blob URL 只在当前页面有效,所以存的时候记下「哪个 URL 对应哪个文件」,
   恢复时从 IndexedDB 取出文件、生成新 URL,再把记录里的旧 URL 全部换掉。
   这样刷新、关掉标签页、重启 dev server 之后 History 都还在。 */
export type StoredSession = {
  id: string;
  title: string;
  createdAt: number;
  messages: unknown[];
  profiles: unknown[];
  brief: unknown;
  queue: number[];
  lang?: "zh" | "en";
  /** 这次会话用到的素材:blob URL ↔ IndexedDB 里的 key */
  media?: { key: string; url: string }[];
};

const LS_KEY = "hybrid-reel:sessions:v1";
const MAX_SESSIONS = 30;
export const SESSIONS_EVENT = "hybrid-reel:sessions";

function readAll(): StoredSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    const list = raw ? (JSON.parse(raw) as StoredSession[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function writeAll(list: StoredSession[]) {
  try {
    const kept = list.slice(0, MAX_SESSIONS);
    window.localStorage.setItem(LS_KEY, JSON.stringify(kept));
    /* 被挤出去的会话,素材一并清掉 */
    const keep = new Set(kept.flatMap((s) => (s.media ?? []).map((m) => m.key)));
    const dropped = list.slice(MAX_SESSIONS).flatMap((s) => (s.media ?? []).map((m) => m.key));
    dropped.filter((k) => !keep.has(k)).forEach((k) => void deleteMedia(k));
  } catch {
    /* 隐私模式 / 配额满:这次不存,不影响对话本身 */
  }
  window.dispatchEvent(new Event(SESSIONS_EVENT));
}

export function saveSession(next: StoredSession) {
  /* 已有的原地更新(只是打开旧会话不该把它顶到最上面),新会话放最前 */
  const list = readAll();
  const i = list.findIndex((s) => s.id === next.id);
  if (i === -1) list.unshift(next);
  else list[i] = next;
  writeAll(list);
}

export function listSessions(): StoredSession[] {
  return readAll();
}

export function getSession(id: string | null): StoredSession | null {
  if (!id) return null;
  return readAll().find((s) => s.id === id) ?? null;
}

export function latestSession(): StoredSession | null {
  return readAll()[0] ?? null;
}

/* ── 素材文件:IndexedDB ── */
const DB_NAME = "hybrid-reel";
const STORE = "media";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = run(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function putMedia(key: string, file: Blob) {
  try {
    await tx("readwrite", (s) => s.put(file, key));
  } catch {
    /* 存不进去就只丢缩略图,对话文字照样保留 */
  }
}

async function deleteMedia(key: string) {
  try {
    await tx("readwrite", (s) => s.delete(key));
  } catch {}
}

/** 取回素材、生成新的 blob URL,并把会话记录里的旧 URL 全部替换掉 */
export async function hydrateSession(session: StoredSession): Promise<StoredSession> {
  const media = session.media ?? [];
  if (media.length === 0) return session;
  let json = JSON.stringify({ messages: session.messages, profiles: session.profiles });
  const fresh: { key: string; url: string }[] = [];
  for (const m of media) {
    let blob: Blob | undefined;
    try {
      blob = await tx<Blob | undefined>("readonly", (s) => s.get(m.key) as IDBRequest<Blob | undefined>);
    } catch {}
    if (!blob) {
      fresh.push(m);
      continue;
    }
    const url = URL.createObjectURL(blob);
    json = json.split(m.url).join(url);
    fresh.push({ key: m.key, url });
  }
  const { messages, profiles } = JSON.parse(json);
  return { ...session, messages, profiles, media: fresh };
}
