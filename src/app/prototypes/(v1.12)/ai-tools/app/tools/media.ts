"use client";

/* 新工具页的浏览器端小工具:存文件、读图片 / 视频的尺寸和时长、取图片平均色(Fit 补边用)。 */

/** 把 Blob 存成文件 */
export function saveBlob(blob: Blob, fileName: string) {
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => (img.naturalWidth > 0 ? resolve(img) : reject(new Error("empty")));
    img.onerror = () => reject(new Error("unreadable"));
    img.src = url;
  });
}

/** 图片平均色(缩到 8×8 取平均);读不了返回中性灰 */
export function averageColor(img: HTMLImageElement): string {
  try {
    const c = document.createElement("canvas");
    c.width = 8;
    c.height = 8;
    const ctx = c.getContext("2d");
    if (!ctx) return "#e9e9ec";
    ctx.drawImage(img, 0, 0, 8, 8);
    const d = ctx.getImageData(0, 0, 8, 8).data;
    let r = 0;
    let g = 0;
    let b = 0;
    for (let i = 0; i < d.length; i += 4) {
      r += d[i];
      g += d[i + 1];
      b += d[i + 2];
    }
    const n = d.length / 4;
    const hex = (v: number) => Math.round(v / n).toString(16).padStart(2, "0");
    return `#${hex(r)}${hex(g)}${hex(b)}`;
  } catch {
    return "#e9e9ec";
  }
}

/** 读视频的宽高和时长;读不出来返回 null */
export function probeVideo(url: string): Promise<{ width: number; height: number; duration: number } | null> {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.muted = true;
    v.onloadedmetadata = () =>
      resolve(v.videoWidth > 0 && Number.isFinite(v.duration) ? { width: v.videoWidth, height: v.videoHeight, duration: v.duration } : null);
    v.onerror = () => resolve(null);
    v.src = url;
  });
}

export const VIDEO_TYPES = ["mp4", "mov", "webm", "m4v"];
export const isVideoFile = (name: string) => VIDEO_TYPES.includes(name.split(".").pop()?.toLowerCase() ?? "");

/** 抓视频某一帧当封面(JPEG data URL,长边最多 640);抓不到返回 null。
    结果卡平时只显示封面、悬停才挂 <video>:同时挂太多视频,浏览器会回收解码器、画面变黑 */
export function captureFrame(url: string, t = 0.5): Promise<string | null> {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    v.muted = true;
    v.preload = "auto";
    v.playsInline = true;
    const done = (r: string | null) => {
      v.removeAttribute("src");
      v.load();
      resolve(r);
    };
    v.onloadeddata = () => {
      v.currentTime = Math.min(t, Math.max(0, v.duration - 0.1));
    };
    v.onseeked = () => {
      try {
        const k = Math.min(1, 640 / Math.max(v.videoWidth, v.videoHeight));
        const c = document.createElement("canvas");
        c.width = Math.round(v.videoWidth * k);
        c.height = Math.round(v.videoHeight * k);
        c.getContext("2d")?.drawImage(v, 0, 0, c.width, c.height);
        done(c.toDataURL("image/jpeg", 0.82));
      } catch {
        done(null);
      }
    };
    v.onerror = () => done(null);
    v.src = url;
  });
}
