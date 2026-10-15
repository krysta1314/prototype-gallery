/* 素材分析的浏览器端工具:读视频时长、逐条上传并调 /api/hybrid-reel/analyze。
   从 agent/chat/page.tsx 原样搬出,hybrid-reel 对话页与 hybrid-reel-agent 共用。 */

import type { ClipProfile } from "./types";

/** 读视频时长(秒);读不到就不给,分镜按描述估 */
export function videoLength(url: string): Promise<number | undefined> {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.muted = true;
    const done = (d?: number) => {
      v.removeAttribute("src");
      resolve(d && Number.isFinite(d) ? Math.round(d * 10) / 10 : undefined);
    };
    v.onloadedmetadata = () => done(v.duration);
    v.onerror = () => done();
    window.setTimeout(() => done(), 5000);
    v.src = url;
  });
}

/* 素材分析:一条素材一个请求(一条出错不拖累整批)。
   线上开了 Vercel Blob:浏览器先把文件直传到 Blob,再把链接交给分析接口 —— Vercel 接口的请求体上限 4.5MB,视频直接发会被拦。
   本地没开 Blob 就照旧把文件直接发过去(本地没有这个限制)。onUpload 报整体上传进度 */
export async function analyzeFiles(files: File[], zh: boolean, onUpload: (pct: number) => void): Promise<{ profiles: ClipProfile[]; model: string }> {
  const lang = zh ? "zh" : "en";
  const blob = await fetch("/api/hybrid-reel/upload")
    .then((r) => (r.ok ? (r.json() as Promise<{ enabled: boolean }>) : { enabled: false }))
    .catch(() => ({ enabled: false }));
  const loaded = files.map(() => 0);
  const total = files.reduce((n, f) => n + f.size, 0) || 1;
  const report = () => onUpload(Math.min(100, Math.round((loaded.reduce((n, x) => n + x, 0) / total) * 100)));
  /* 等每一条都结束(成功或失败)再汇总:一条先失败时别的还在传,直接抛错的话后面的进度会把错误信息盖掉 */
  const settled = await Promise.allSettled(
    files.map(async (file, i) => {
      let init: RequestInit;
      if (blob.enabled) {
        const { upload } = await import("@vercel/blob/client");
        const put = await upload(`hybrid-reel/${file.name}`, file, {
          access: "public",
          handleUploadUrl: "/api/hybrid-reel/upload",
          multipart: file.size > 20 * 1024 * 1024,
          onUploadProgress: (e) => {
            loaded[i] = Math.min(e.loaded, file.size - 1);
            report();
          },
        });
        loaded[i] = file.size;
        report();
        init = {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lang, items: [{ url: put.url, name: file.name, type: file.type, size: file.size }] }),
        };
      } else {
        const form = new FormData();
        form.append("file", file);
        form.append("lang", lang);
        init = { method: "POST", body: form };
      }
      const res = await fetch("/api/hybrid-reel/analyze", init);
      /* 被网关拦下时回来的不是 JSON(比如 "Request Entity Too Large"),给一句看得懂的 */
      const data = (await res.json().catch(() => ({ error: `${file.name}: HTTP ${res.status} ${res.statusText}` }))) as {
        profiles?: ClipProfile[];
        model?: string;
        error?: string;
      };
      if (!res.ok || !data.profiles) throw new Error(data.error ?? `HTTP ${res.status}`);
      return data;
    }),
  );
  const bad = settled.find((r): r is PromiseRejectedResult => r.status === "rejected");
  if (bad) throw bad.reason;
  const results = settled.map((r) => (r as PromiseFulfilledResult<{ profiles?: ClipProfile[]; model?: string }>).value);
  return { profiles: results.flatMap((r) => r.profiles ?? []), model: results[0]?.model ?? "" };
}
