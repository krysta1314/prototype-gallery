/* 选文件时在浏览器里探测一下(落地页用):视频读时长,同时看浏览器能不能打开;图片试着解码。
   判不判损坏交给 logic/upload.ts 的 unreadableProbe(纯函数):只有浏览器报错、且文件头不是认得的容器才算损坏;
   5 秒没读出来只当「读不到时长」,不算损坏。 */

import type { MediaKind } from "./store";
import { unreadableProbe } from "./logic/upload";

const PROBE_MS = 5000;

/** 浏览器打开媒体:loaded = 读成功(视频带时长),error = 浏览器报错,timeout = 5 秒没结果 */
function openMedia(url: string, kind: "video" | "image"): Promise<{ result: "loaded" | "error" | "timeout"; durationSec?: number }> {
  return new Promise((resolve) => {
    let settled = false;
    const done = (result: "loaded" | "error" | "timeout", durationSec?: number) => {
      if (settled) return;
      settled = true;
      resolve({ result, durationSec });
    };
    const timer = window.setTimeout(() => done("timeout"), PROBE_MS);
    if (kind === "image") {
      const img = new Image();
      img.onload = () => {
        window.clearTimeout(timer);
        done("loaded");
      };
      img.onerror = () => {
        window.clearTimeout(timer);
        done("error");
      };
      img.src = url;
      return;
    }
    const v = document.createElement("video");
    v.preload = "metadata";
    v.muted = true;
    v.onloadedmetadata = () => {
      window.clearTimeout(timer);
      const d = v.duration;
      v.removeAttribute("src");
      done("loaded", Number.isFinite(d) ? Math.round(d * 10) / 10 : undefined);
    };
    v.onerror = () => {
      window.clearTimeout(timer);
      v.removeAttribute("src");
      done("error");
    };
    v.src = url;
  });
}

/** 探测一个选中的文件:视频返回读到的时长;unreadable = 文件损坏(选中时就拦)。音频不探测 */
export async function probeFile(file: File, url: string, kind: MediaKind | null): Promise<{ durationSec?: number; unreadable: boolean }> {
  if (kind !== "video" && kind !== "image") return { unreadable: file.size === 0 };
  const [opened, head] = await Promise.all([
    openMedia(url, kind),
    file
      .slice(0, 16)
      .arrayBuffer()
      .then((b) => new Uint8Array(b))
      .catch(() => new Uint8Array()),
  ]);
  return {
    durationSec: opened.durationSec,
    unreadable: unreadableProbe({ size: file.size, mediaError: opened.result === "error", head, kind }),
  };
}
