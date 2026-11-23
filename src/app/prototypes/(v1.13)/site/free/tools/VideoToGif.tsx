"use client";

/* 免费工具：视频转 GIF(2026-11-19)。逐帧 seek 取帧画到 canvas → 自己写的 GIF 编码器(../gif.ts)。全在本机。
   限制写清楚：最长 10 秒;GIF 只有 256 色，渐变会有色带;文件通常比原视频大。 */

import { useEffect, useRef, useState } from "react";
import { Download, RotateCcw, X } from "lucide-react";
import { encodeGif } from "../gif";
import { baseName, download, fmtBytes, fmtTime, seek } from "../media";
import { BTN, BTN2, ErrorLine, FilePick, Progress, Seg, ToolPanel } from "../ui";

const MAX_LEN = 10;

export function VideoToGif() {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string>();
  const [meta, setMeta] = useState({ w: 0, h: 0, d: 0 });
  const [start, setStart] = useState(0);
  const [len, setLen] = useState(3);
  const [fps, setFps] = useState<"8" | "12" | "15">("12");
  const [width, setWidth] = useState<"320" | "480" | "640">("480");
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState("");
  const [prog, setProg] = useState(0);
  const [err, setErr] = useState<string>();
  const [gif, setGif] = useState<{ blob: Blob; url: string }>();
  const video = useRef<HTMLVideoElement>(null);
  const cancel = useRef(false);

  /* 对象网址在选文件时建，换文件 / 卸载时释放 */
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );
  useEffect(() => () => (gif ? URL.revokeObjectURL(gif.url) : undefined), [gif]);

  const maxLen = Math.max(0.5, Math.min(MAX_LEN, meta.d - start));
  const useLen = Math.min(len, maxLen);
  const outW = meta.w ? Math.min(+width, meta.w - (meta.w % 2)) : +width;
  const outH = meta.w ? Math.max(2, Math.round((outW * meta.h) / meta.w)) : 0;
  const frames = Math.max(1, Math.round(useLen * +fps));

  const pick = (f: File) => {
    setErr(undefined);
    setGif(undefined);
    if (!f.type.startsWith("video/")) return setErr("That file isn't a video. Pick an MP4, MOV or WebM file.");
    setStart(0);
    setFile(f);
    setUrl(URL.createObjectURL(f));
  };

  const run = async () => {
    const v = video.current;
    if (!v || !outH) return;
    setErr(undefined);
    setGif(undefined);
    setBusy(true);
    cancel.current = false;
    try {
      v.pause();
      const c = document.createElement("canvas");
      c.width = outW;
      c.height = outH;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("Canvas is not available in this browser.");
      const data: Uint8ClampedArray[] = [];
      setStage("Reading frames");
      for (let i = 0; i < frames; i++) {
        if (cancel.current) throw new DOMException("Cancelled", "AbortError");
        await seek(v, Math.min(meta.d - 0.01, start + i / +fps));
        ctx.drawImage(v, 0, 0, outW, outH);
        data.push(ctx.getImageData(0, 0, outW, outH).data);
        setProg(((i + 1) / frames) * 0.5);
      }
      setStage("Encoding GIF");
      const blob = await encodeGif(data, outW, outH, 1000 / +fps, (p) => {
        if (cancel.current) throw new DOMException("Cancelled", "AbortError");
        setProg(0.5 + p * 0.5);
      });
      setGif({ blob, url: URL.createObjectURL(blob) });
    } catch (e) {
      if ((e as Error).name !== "AbortError") setErr((e as Error).message || "Conversion failed. Try a shorter clip or a smaller size.");
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

  return (
    <ToolPanel>
      <div className="grid gap-6 md:grid-cols-[1fr_340px]">
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[18px] bg-[#1C1C1C] p-4">
          {gif ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={gif.url} alt="Your GIF preview" className="max-h-[460px] max-w-full rounded-[10px]" />
          ) : (
            <video
              ref={video}
              src={url}
              muted
              playsInline
              controls={!busy}
              className="max-h-[460px] w-full rounded-[12px] bg-black"
              onLoadedMetadata={(e) => setMeta({ w: e.currentTarget.videoWidth, h: e.currentTarget.videoHeight, d: isFinite(e.currentTarget.duration) ? e.currentTarget.duration : 0 })}
              onError={() => setErr("This browser can't play this video. Try an MP4 (H.264) or WebM file.")}
            />
          )}
          <p className="mt-3 text-[12.5px] tabular-nums text-[#9F9F9F]">{gif ? `GIF ${outW}×${outH} · ${frames} frames` : `Clip ${fmtTime(start)} – ${fmtTime(start + useLen)}`}</p>
        </div>
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[14px] font-bold text-white">{file.name}</p>
              <p className="text-[12.5px] tabular-nums text-[#9F9F9F]">
                {fmtBytes(file.size)} · {fmtTime(meta.d)} · {meta.w}×{meta.h}
              </p>
            </div>
            <button type="button" aria-label="Choose another video" disabled={busy} onClick={() => (setFile(null), setUrl(undefined), setGif(undefined))} className="grid size-8 shrink-0 place-items-center rounded-full bg-white/[0.08] text-white hover:bg-white/15 disabled:opacity-50">
              <X className="size-4" />
            </button>
          </div>
          <label className="block">
            <span className="mb-2 flex justify-between text-[12.5px] font-semibold text-[#9F9F9F]">
              Start <span className="tabular-nums text-white">{start.toFixed(1)} s</span>
            </span>
            <input
              type="range"
              min={0}
              max={Math.max(0, meta.d - 0.5)}
              step={0.1}
              value={start}
              disabled={busy || !!gif}
              onChange={(e) => {
                setStart(+e.target.value);
                if (video.current) video.current.currentTime = +e.target.value;
              }}
              className="w-full accent-[#FF744D]"
            />
          </label>
          <label className="block">
            <span className="mb-2 flex justify-between text-[12.5px] font-semibold text-[#9F9F9F]">
              Length <span className="tabular-nums text-white">{useLen.toFixed(1)} s</span>
            </span>
            <input type="range" min={0.5} max={maxLen} step={0.5} value={useLen} disabled={busy || !!gif} onChange={(e) => setLen(+e.target.value)} className="w-full accent-[#FF744D]" />
          </label>
          <Seg label="Width" value={width} onChange={setWidth} disabled={busy || !!gif} options={[{ value: "320", label: "320 px" }, { value: "480", label: "480 px" }, { value: "640", label: "640 px" }]} />
          <Seg label="Frame rate" value={fps} onChange={setFps} disabled={busy || !!gif} options={[{ value: "8", label: "8 fps" }, { value: "12", label: "12 fps" }, { value: "15", label: "15 fps" }]} />

          {busy ? (
            <div className="space-y-3">
              <Progress value={prog} label={stage} />
              <button type="button" className={BTN2} onClick={() => (cancel.current = true)}>
                Cancel
              </button>
            </div>
          ) : gif ? (
            <div className="space-y-2">
              <button type="button" className={`${BTN} w-full`} onClick={() => download(gif.blob, `${baseName(file)}.gif`)}>
                <Download className="size-4" /> Download GIF · {fmtBytes(gif.blob.size)}
              </button>
              <button type="button" className={`${BTN2} w-full`} onClick={() => setGif(undefined)}>
                <RotateCcw className="size-4" /> Make another
              </button>
            </div>
          ) : (
            <button type="button" className={`${BTN} w-full`} onClick={run} disabled={!meta.d}>
              Convert to GIF
            </button>
          )}
          <p className="text-[12px] leading-relaxed text-[#9F9F9F]">Up to {MAX_LEN} seconds. GIFs use 256 colors and no sound, so they are often larger than the video they came from.</p>
          <ErrorLine text={err} />
        </div>
      </div>
    </ToolPanel>
  );
}
