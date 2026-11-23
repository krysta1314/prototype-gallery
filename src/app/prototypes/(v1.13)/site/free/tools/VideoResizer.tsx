"use client";

/* 免费工具：视频改比例(2026-11-19)。选文件 → 选比例 / 裁切或留边 / 清晰度 → canvas 实时预览 → MediaRecorder 本地导出。
   全程不上传。导出是实时录制(耗时 ≈ 片长);格式由浏览器决定(Chrome / Firefox = WebM,Safari = MP4),页面上照实写。 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, RotateCcw, X } from "lucide-react";
import { baseName, download, drawFit, fmtBytes, fmtTime, renderVideo } from "../media";
import { BTN, BTN2, ErrorLine, FilePick, Progress, Seg, ToolPanel, useRecorderFormat } from "../ui";

type Ratio = "9:16" | "1:1" | "4:5" | "16:9";
const SIZES: Record<Ratio, Record<"720" | "1080", [number, number]>> = {
  "9:16": { "720": [720, 1280], "1080": [1080, 1920] },
  "1:1": { "720": [720, 720], "1080": [1080, 1080] },
  "4:5": { "720": [720, 900], "1080": [1080, 1350] },
  "16:9": { "720": [1280, 720], "1080": [1920, 1080] },
};

export function VideoResizer() {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string>();
  const [ratio, setRatio] = useState<Ratio>("9:16");
  const [mode, setMode] = useState<"crop" | "fit">("crop");
  const [bg, setBg] = useState<"blur" | "black" | "white">("blur");
  const [res, setRes] = useState<"720" | "1080">("1080");
  const [focus, setFocus] = useState(50);
  const [busy, setBusy] = useState(false);
  const [prog, setProg] = useState(0);
  const [err, setErr] = useState<string>();
  const [out, setOut] = useState<{ blob: Blob; ext: string; label: string }>();
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const abort = useRef<AbortController | null>(null);
  const [W, H] = SIZES[ratio][res];
  const fmt = useRecorderFormat();
  const [meta, setMeta] = useState({ w: 0, h: 0, d: 0 });

  /* 对象网址在选文件时建，换文件 / 卸载时释放 */
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );

  const draw = useCallback(() => {
    const v = video.current, c = canvas.current;
    if (!v || !c || v.readyState < 2) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const portraitSrc = v.videoHeight > v.videoWidth;
    const f = focus / 100;
    drawFit(ctx, v, v.videoWidth, v.videoHeight, W, H, mode, bg, portraitSrc ? 0.5 : f, portraitSrc ? f : 0.5);
  }, [W, H, mode, bg, focus]);

  /* 预览：播放时逐帧画，暂停时画当前帧 */
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [draw, url]);

  const pick = (f: File) => {
    setErr(undefined);
    setOut(undefined);
    if (!f.type.startsWith("video/")) return setErr("That file isn't a video. Pick an MP4, MOV or WebM file.");
    setFile(f);
    setUrl(URL.createObjectURL(f));
  };

  const run = async () => {
    const v = video.current, c = canvas.current;
    if (!v || !c) return;
    setErr(undefined);
    setOut(undefined);
    setBusy(true);
    setProg(0);
    abort.current = new AbortController();
    try {
      const bits = res === "1080" ? 8_000_000 : 4_000_000;
      const r = await renderVideo({ video: v, canvas: c, draw, videoBitsPerSecond: bits, onProgress: setProg, signal: abort.current.signal });
      setOut(r);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setErr((e as Error).message || "Export failed. Try a shorter clip or another browser.");
    } finally {
      setBusy(false);
    }
  };

  if (!file || !url)
    return (
      <ToolPanel>
        <FilePick accept="video/*" onFile={pick} title="Choose a video" hint="MP4, MOV or WebM · the file stays on your device" />
        <ErrorLine text={err} />
      </ToolPanel>
    );

  const isPortraitSrc = meta.h > meta.w;
  return (
    <ToolPanel>
      <div className="grid gap-6 md:grid-cols-[1fr_340px]">
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[18px] bg-[#1C1C1C] p-4">
          <canvas ref={canvas} width={W} height={H} aria-label={`Preview at ${ratio}`} className="max-h-[520px] w-auto max-w-full rounded-[10px] bg-black" style={{ aspectRatio: `${W}/${H}` }} />
          <p className="mt-3 text-[12.5px] tabular-nums text-[#9F9F9F]">
            Output {W}×{H} · preview
          </p>
        </div>
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[14px] font-bold text-white">{file.name}</p>
              <p className="text-[12.5px] text-[#9F9F9F]">
                {fmtBytes(file.size)} · {fmtTime(meta.d)} · {meta.w}×{meta.h}
              </p>
            </div>
            <button type="button" aria-label="Choose another video" disabled={busy} onClick={() => (setFile(null), setUrl(undefined), setOut(undefined))} className="grid size-8 shrink-0 place-items-center rounded-full bg-white/[0.08] text-white hover:bg-white/15 disabled:opacity-50">
              <X className="size-4" />
            </button>
          </div>
          {/* 源视频(静音，用来播放和取帧) */}
          <video ref={video} src={url} muted playsInline controls={!busy} className="w-full rounded-[12px] bg-black" onLoadedMetadata={(e) => setMeta({ w: e.currentTarget.videoWidth, h: e.currentTarget.videoHeight, d: isFinite(e.currentTarget.duration) ? e.currentTarget.duration : 0 })} onLoadedData={draw} onSeeked={draw} onError={() => setErr("This browser can't play this video. Try an MP4 (H.264) or WebM file.")} />
          <Seg label="Aspect ratio" value={ratio} onChange={(v) => (setRatio(v), setOut(undefined))} disabled={busy} options={[{ value: "9:16", label: "9:16", hint: "Reels, TikTok" }, { value: "1:1", label: "1:1", hint: "Square" }, { value: "4:5", label: "4:5", hint: "Feed" }, { value: "16:9", label: "16:9", hint: "YouTube" }]} />
          <Seg label="Resize mode" value={mode} onChange={(v) => (setMode(v), setOut(undefined))} disabled={busy} options={[{ value: "crop", label: "Crop to fill" }, { value: "fit", label: "Fit with background" }]} />
          {mode === "crop" ? (
            <label className="block">
              <span className="mb-2 block text-[12.5px] font-semibold text-[#9F9F9F]">{isPortraitSrc ? "Crop position (top to bottom)" : "Crop position (left to right)"}</span>
              <input type="range" min={0} max={100} value={focus} disabled={busy} onChange={(e) => setFocus(+e.target.value)} className="w-full accent-[#FF744D]" />
            </label>
          ) : (
            <Seg label="Background" value={bg} onChange={setBg} disabled={busy} options={[{ value: "blur", label: "Blurred" }, { value: "black", label: "Black" }, { value: "white", label: "White" }]} />
          )}
          <Seg label="Resolution" value={res} onChange={(v) => (setRes(v), setOut(undefined))} disabled={busy} options={[{ value: "1080", label: "1080p" }, { value: "720", label: "720p", hint: "Smaller file" }]} />

          {busy ? (
            <div className="space-y-3">
              <Progress value={prog} label="Exporting in real time" />
              <button type="button" className={BTN2} onClick={() => abort.current?.abort()}>
                Cancel
              </button>
            </div>
          ) : out ? (
            <div className="space-y-2">
              <button type="button" className={`${BTN} w-full`} onClick={() => download(out.blob, `${baseName(file)}-${ratio.replace(":", "x")}.${out.ext}`)}>
                <Download className="size-4" /> Download {out.ext.toUpperCase()} · {fmtBytes(out.blob.size)}
              </button>
              <button type="button" className={`${BTN2} w-full`} onClick={() => setOut(undefined)}>
                <RotateCcw className="size-4" /> Change settings
              </button>
            </div>
          ) : (
            <button type="button" className={`${BTN} w-full`} onClick={run} disabled={!fmt}>
              Resize video
            </button>
          )}
          <p className="text-[12px] leading-relaxed text-[#9F9F9F]">
            {fmt ? `Exports as ${fmt.label} in this browser.` : "This browser can't record video; try Chrome, Edge, Firefox or Safari."} Export plays the clip once, so it takes as long as the video. Keep this tab open.
          </p>
          <ErrorLine text={err} />
        </div>
      </div>
    </ToolPanel>
  );
}
