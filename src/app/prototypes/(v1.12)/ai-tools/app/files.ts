// 放大结果的文件工具(纯模块,不含 React):大小显示、下载文件名、带进度的下载。
// Agent 结果卡、画布 toolbar、评审 journeys 共用。
import type { UpscaleResult } from "./api";

/** 文件大小:十进制 MB / KB,保留 1 位(38,200,000 → 38.2 MB) */
export function formatBytes(b: number): string {
  if (b >= 1e6) return `${(b / 1e6).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(b / 1e3))} KB`;
}

/** 下载后的文件名:upscaled-12442x8294.png */
export const resultFileName = (r: UpscaleResult) => `upscaled-${r.width}x${r.height}.${r.format}`;

/** 取下原文件并存盘;有 content-length 时按已读字节回调百分比(0–100),没有就只回调 0 和 100。
    成功 true,失败 false(不抛) */
export async function downloadWithProgress(url: string, fileName: string, onProgress: (pct: number) => void): Promise<boolean> {
  try {
    onProgress(0);
    const res = await fetch(url);
    if (!res.ok) return false;
    const total = Number(res.headers.get("content-length")) || 0;
    let blob: Blob;
    if (res.body && total > 0) {
      const reader = res.body.getReader();
      const chunks: BlobPart[] = [];
      let got = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value as BlobPart);
        got += value.byteLength;
        /* 压缩传输时 content-length 可能比实际小,读完之前最多显示 99% */
        onProgress(Math.min(99, Math.floor((got / total) * 100)));
      }
      blob = new Blob(chunks, { type: res.headers.get("content-type") ?? "" });
    } else {
      blob = await res.blob();
    }
    onProgress(100);
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
    return true;
  } catch {
    return false;
  }
}
