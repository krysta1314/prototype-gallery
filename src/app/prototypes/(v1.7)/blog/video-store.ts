"use client";

/* 上传的视频存 IndexedDB,不进 localStorage。
   一段 720p 视频动辄 5~50MB,localStorage 总共才 5MB —— 塞进去必炸,
   而且失败是静默的。所以文章里只存一个引用(idb:<id>),文件本体放 IndexedDB,
   渲染时再取出来转成 object URL。真实后台这一层换成对象存储 + CDN 地址。 */

const DB = "buzz-blog-media";
const STORE = "videos";
export const VIDEO_PREFIX = "idb:";
/** 单个文件上限。再大浏览器内存和写入耗时都不好看。 */
export const MAX_VIDEO_BYTES = 60 * 1024 * 1024;

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("indexedDB open failed"));
  });
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const req = run(db.transaction(STORE, mode).objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error ?? new Error("indexedDB request failed"));
      }),
  );
}

export type StoredVideo = { blob: Blob; name: string; type: string };

/** 存一个文件,返回可写进区块的引用。 */
export async function putVideo(file: File): Promise<string> {
  const key = `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  await tx("readwrite", (s) =>
    s.put({ blob: file, name: file.name, type: file.type } satisfies StoredVideo, key),
  );
  return VIDEO_PREFIX + key;
}

export async function getVideo(ref: string): Promise<StoredVideo | undefined> {
  if (!ref.startsWith(VIDEO_PREFIX)) return undefined;
  try {
    return await tx<StoredVideo | undefined>("readonly", (s) => s.get(ref.slice(VIDEO_PREFIX.length)));
  } catch {
    return undefined;
  }
}

export async function deleteVideo(ref: string): Promise<void> {
  if (!ref.startsWith(VIDEO_PREFIX)) return;
  try {
    await tx("readwrite", (s) => s.delete(ref.slice(VIDEO_PREFIX.length)));
  } catch {
    /* 删不掉就留着,不值得打断编辑 */
  }
}

/* ── 链接嵌入 ────────────────────────────────────────────── */

/** 认出 YouTube / Vimeo 链接,给出可嵌入的播放器地址;认不出返回 null。 */
export function embedUrl(raw: string): string | null {
  const url = raw.trim();
  if (!/^https?:\/\//i.test(url)) return null;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, "");

  if (host === "youtu.be") {
    const id = u.pathname.slice(1);
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  }
  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    if (u.pathname === "/watch") {
      const id = u.searchParams.get("v");
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    const m = u.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]+)/);
    return m ? `https://www.youtube-nocookie.com/embed/${m[1]}` : null;
  }
  if (host === "vimeo.com") {
    const id = u.pathname.split("/").filter(Boolean)[0];
    return /^\d+$/.test(id ?? "") ? `https://player.vimeo.com/video/${id}` : null;
  }
  if (host === "player.vimeo.com") return url;
  return null;
}

export const isUpload = (src: string) => src.startsWith(VIDEO_PREFIX);
