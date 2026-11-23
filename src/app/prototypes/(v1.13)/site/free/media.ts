// 免费工具共用的浏览器端媒体处理(2026-11-19)。全部在本机跑：不上传、不调后端、不调 AI。
// 视频导出 = canvas 逐帧画 + MediaRecorder 实时录(所以导出耗时 ≈ 片长);格式取浏览器支持的第一个:MP4 优先(新版 Chrome / Edge / Safari),Firefox 等退回 WebM。

export const fmtBytes = (n: number) => (n < 1024 ? `${n} B` : n < 1024 ** 2 ? `${(n / 1024).toFixed(0)} KB` : n < 1024 ** 3 ? `${(n / 1024 ** 2).toFixed(1)} MB` : `${(n / 1024 ** 3).toFixed(2)} GB`);
export const fmtTime = (s: number) => {
  if (!isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
};

/** 浏览器能录的格式(优先 WebM VP9 → VP8 → WebM → MP4) */
type RecFormat = { mime: string; ext: "webm" | "mp4"; label: string };
let FMT: RecFormat | null | undefined;
/** 结果缓存(useSyncExternalStore 要求同一引用) */
export function recorderFormat(): RecFormat | null {
  if (FMT !== undefined) return FMT;
  FMT = detectFormat();
  return FMT;
}
function detectFormat(): RecFormat | null {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") return null;
  /* MP4 优先：广告平台(Meta、TikTok)收 MP4 / MOV,不收 WebM。新版 Chrome / Edge 和 Safari 能直接录 MP4;录不了才退回 WebM。 */
  const list: [string, "webm" | "mp4", string][] = [
    ["video/mp4;codecs=avc1.640028,mp4a.40.2", "mp4", "MP4 (H.264)"],
    ["video/mp4;codecs=avc1,mp4a.40.2", "mp4", "MP4 (H.264)"],
    ["video/mp4;codecs=avc1", "mp4", "MP4 (H.264)"],
    ["video/mp4", "mp4", "MP4"],
    ["video/webm;codecs=vp9,opus", "webm", "WebM (VP9)"],
    ["video/webm;codecs=vp8,opus", "webm", "WebM (VP8)"],
    ["video/webm", "webm", "WebM"],
  ];
  for (const [mime, ext, label] of list) if (MediaRecorder.isTypeSupported(mime)) return { mime, ext, label };
  return null;
}

export function waitEvent(el: HTMLMediaElement, name: string) {
  return new Promise<void>((resolve, reject) => {
    const ok = () => {
      el.removeEventListener(name, ok);
      el.removeEventListener("error", bad);
      resolve();
    };
    const bad = () => {
      el.removeEventListener(name, ok);
      el.removeEventListener("error", bad);
      reject(new Error("This browser can't decode the video. Try an MP4 (H.264) or WebM file."));
    };
    el.addEventListener(name, ok);
    el.addEventListener("error", bad);
  });
}

export async function seek(v: HTMLVideoElement, t: number) {
  if (Math.abs(v.currentTime - t) < 0.001 && v.readyState >= 2) return;
  const p = waitEvent(v, "seeked");
  v.currentTime = t;
  await p;
}

/* 每个 <video> 只能 createMediaElementSource 一次，缓存起来 */
const AUDIO = new WeakMap<HTMLVideoElement, { ctx: AudioContext; src: MediaElementAudioSourceNode }>();
function audioTracks(v: HTMLVideoElement): MediaStreamTrack[] {
  try {
    let a = AUDIO.get(v);
    if (!a) {
      const ctx = new AudioContext();
      a = { ctx, src: ctx.createMediaElementSource(v) };
      AUDIO.set(v, a);
    }
    void a.ctx.resume();
    const dest = a.ctx.createMediaStreamDestination();
    a.src.disconnect();
    a.src.connect(dest);
    return dest.stream.getAudioTracks();
  } catch {
    return [];
  }
}

export type RenderOpts = {
  video: HTMLVideoElement;
  canvas: HTMLCanvasElement;
  /** 每帧把视频画到 canvas 上 */
  draw: () => void;
  videoBitsPerSecond: number;
  audioBitsPerSecond?: number;
  keepAudio?: boolean;
  onProgress?: (p: number) => void;
  signal?: AbortSignal;
};

/** 从头播一遍视频，边播边录 canvas(实时，所以耗时 ≈ 片长)。返回成片 Blob */
export async function renderVideo({ video, canvas, draw, videoBitsPerSecond, audioBitsPerSecond = 128000, keepAudio = true, onProgress, signal }: RenderOpts): Promise<{ blob: Blob; ext: string; label: string }> {
  const fmt = recorderFormat();
  if (!fmt || !("captureStream" in canvas)) throw new Error("This browser can't record video. Use a recent Chrome, Edge, Firefox or Safari.");
  video.pause();
  await seek(video, 0);
  const stream = canvas.captureStream(30);
  if (keepAudio) {
    video.muted = false;
    video.volume = 1;
    for (const t of audioTracks(video)) stream.addTrack(t);
  }
  const rec = new MediaRecorder(stream, { mimeType: fmt.mime, videoBitsPerSecond, audioBitsPerSecond });
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const stopped = new Promise<void>((r) => (rec.onstop = () => r()));
  draw();
  rec.start(250);
  let raf = 0;
  const loop = () => {
    draw();
    onProgress?.(video.duration ? Math.min(1, video.currentTime / video.duration) : 0);
    if (!video.ended && !video.paused) raf = requestAnimationFrame(loop);
  };
  const abort = () => video.pause();
  signal?.addEventListener("abort", abort);
  try {
    await video.play();
    raf = requestAnimationFrame(loop);
    await new Promise<void>((resolve) => {
      const done = () => {
        video.removeEventListener("ended", done);
        video.removeEventListener("pause", done);
        resolve();
      };
      video.addEventListener("ended", done);
      video.addEventListener("pause", done);
    });
  } finally {
    cancelAnimationFrame(raf);
    signal?.removeEventListener("abort", abort);
    draw();
    if (rec.state !== "inactive") rec.stop();
    await stopped;
    stream.getTracks().forEach((t) => t.stop());
    video.muted = true;
  }
  if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
  onProgress?.(1);
  return { blob: new Blob(chunks, { type: fmt.mime.split(";")[0] }), ext: fmt.ext, label: fmt.label };
}

/** 把一张图 / 一帧按「裁切铺满」或「完整放入 + 底色」画进目标尺寸。fx / fy = 裁切时的焦点(0–1) */
export function drawFit(
  ctx: CanvasRenderingContext2D,
  src: CanvasImageSource,
  sw: number,
  sh: number,
  W: number,
  H: number,
  mode: "crop" | "fit",
  bg: "black" | "white" | "blur",
  fx = 0.5,
  fy = 0.5,
) {
  if (!sw || !sh) return;
  if (mode === "crop") {
    const s = Math.max(W / sw, H / sh);
    const dw = sw * s, dh = sh * s;
    ctx.drawImage(src, (W - dw) * fx, (H - dh) * fy, dw, dh);
    return;
  }
  if (bg === "blur") {
    const s = Math.max(W / sw, H / sh) * 1.1;
    ctx.save();
    ctx.filter = "blur(28px) brightness(0.7)";
    ctx.drawImage(src, (W - sw * s) / 2, (H - sh * s) / 2, sw * s, sh * s);
    ctx.restore();
  } else {
    ctx.fillStyle = bg === "white" ? "#FFFFFF" : "#000000";
    ctx.fillRect(0, 0, W, H);
  }
  const s = Math.min(W / sw, H / sh);
  const dw = sw * s, dh = sh * s;
  ctx.drawImage(src, (W - dw) / 2, (H - dh) / 2, dw, dh);
}

export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export const baseName = (f: File) => f.name.replace(/\.[^.]+$/, "").replace(/[^\w-]+/g, "-").slice(0, 60) || "buzzvideo";
