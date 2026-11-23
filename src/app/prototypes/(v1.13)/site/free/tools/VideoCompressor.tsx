"use client";

/* 免费工具：视频压缩(2026-11-19)。本地用 MediaRecorder 以更低码率 + 可选降分辨率重新编码。
   老实写清限制：实时编码(耗时 ≈ 片长)、浏览器编码器不如 HandBrake / FFmpeg 高效、输出是 WebM(Safari 是 MP4)、
   原片已经很省的话结果可能反而更大(这时提示保留原片)。 */

import { useEffect, useRef, useState } from "react";
import { Download, RotateCcw, X } from "lucide-react";
import { baseName, download, fmtBytes, fmtTime, renderVideo } from "../media";
import { BTN, BTN2, ErrorLine, FilePick, Progress, Seg, ToolPanel, useRecorderFormat } from "../ui";

type Level = "high" | "balanced" | "small";
const LEVELS: Record<Level, { label: string; hint: string; long: number; vbps: number; abps: number }> = {
  high: { label: "Light", hint: "Up to 1080p · 4 Mbps", long: 1920, vbps: 4_000_000, abps: 128_000 },
  balanced: { label: "Balanced", hint: "Up to 720p · 2 Mbps", long: 1280, vbps: 2_000_000, abps: 96_000 },
  small: { label: "Smallest", hint: "Up to 480p · 0.8 Mbps", long: 854, vbps: 800_000, abps: 64_000 },
};

export function VideoCompressor() {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string>();
  const [meta, setMeta] = useState({ w: 0, h: 0, d: 0 });
  const [level, setLevel] = useState<Level>("balanced");
  const [audio, setAudio] = useState<"keep" | "drop">("keep");
  const [busy, setBusy] = useState(false);
  const [prog, setProg] = useState(0);
  const [err, setErr] = useState<string>();
  const [out, setOut] = useState<{ blob: Blob; ext: string; label: string }>();
  const fmt = useRecorderFormat();
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const abort = useRef<AbortController | null>(null);

  /* 对象网址在选文件时建，换文件 / 卸载时释放 */
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );

  const L = LEVELS[level];
  const scale = meta.w && meta.h ? Math.min(1, L.long / Math.max(meta.w, meta.h)) : 1;
  const W = Math.max(2, Math.round((meta.w * scale) / 2) * 2);
  const H = Math.max(2, Math.round((meta.h * scale) / 2) * 2);
  const estimate = meta.d ? ((L.vbps + (audio === "keep" ? L.abps : 0)) * meta.d) / 8 : 0;

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
    const ctx = c.getContext("2d");
    try {
      const r = await renderVideo({
        video: v,
        canvas: c,
        draw: () => ctx?.drawImage(v, 0, 0, W, H),
        videoBitsPerSecond: L.vbps,
        audioBitsPerSecond: L.abps,
        keepAudio: audio === "keep",
        onProgress: setProg,
        signal: abort.current.signal,
      });
      setOut(r);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setErr((e as Error).message || "Compression failed. Try a shorter clip or another browser.");
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

  const saved = out ? 1 - out.blob.size / file.size : 0;
  return (
    <ToolPanel>
      <div className="grid gap-6 md:grid-cols-[1fr_340px]">
        <div className="flex flex-col justify-center rounded-[18px] bg-[#1C1C1C] p-4">
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
          <canvas ref={canvas} width={W} height={H} className="hidden" />
          <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[
              ["Original", fmtBytes(file.size)],
              ["Estimate", estimate ? `≈ ${fmtBytes(estimate)}` : "—"],
              ["Result", out ? fmtBytes(out.blob.size) : "—"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-[12px] bg-white/[0.05] px-2 py-3">
                <dt className="text-[11.5px] font-semibold text-[#9F9F9F]">{k}</dt>
                <dd className="mt-1 text-[15px] font-bold tabular-nums text-white">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[14px] font-bold text-white">{file.name}</p>
              <p className="text-[12.5px] tabular-nums text-[#9F9F9F]">
                {fmtTime(meta.d)} · {meta.w}×{meta.h} → {W}×{H}
              </p>
            </div>
            <button type="button" aria-label="Choose another video" disabled={busy} onClick={() => (setFile(null), setUrl(undefined), setOut(undefined))} className="grid size-8 shrink-0 place-items-center rounded-full bg-white/[0.08] text-white hover:bg-white/15 disabled:opacity-50">
              <X className="size-4" />
            </button>
          </div>
          <Seg label="Compression" value={level} onChange={(v) => (setLevel(v), setOut(undefined))} disabled={busy} options={(Object.keys(LEVELS) as Level[]).map((k) => ({ value: k, label: LEVELS[k].label, hint: LEVELS[k].hint }))} />
          <Seg label="Audio" value={audio} onChange={(v) => (setAudio(v), setOut(undefined))} disabled={busy} options={[{ value: "keep", label: "Keep audio" }, { value: "drop", label: "Remove audio" }]} />

          {busy ? (
            <div className="space-y-3">
              <Progress value={prog} label="Re-encoding in real time" />
              <button type="button" className={BTN2} onClick={() => abort.current?.abort()}>
                Cancel
              </button>
            </div>
          ) : out ? (
            <div className="space-y-2">
              {saved > 0 ? (
                <p className="text-[13.5px] font-semibold text-white">{Math.round(saved * 100)}% smaller than the original.</p>
              ) : (
                <p className="text-[13.5px] font-semibold text-[#FFF3EC]">The result is not smaller: this file was already well compressed. Keep the original, or try Smallest.</p>
              )}
              <button type="button" className={`${BTN} w-full`} onClick={() => download(out.blob, `${baseName(file)}-compressed.${out.ext}`)}>
                <Download className="size-4" /> Download {out.ext.toUpperCase()} · {fmtBytes(out.blob.size)}
              </button>
              <button type="button" className={`${BTN2} w-full`} onClick={() => setOut(undefined)}>
                <RotateCcw className="size-4" /> Change settings
              </button>
            </div>
          ) : (
            <button type="button" className={`${BTN} w-full`} onClick={run} disabled={!fmt || !meta.d}>
              Compress video
            </button>
          )}
          <p className="text-[12px] leading-relaxed text-[#9F9F9F]">
            {fmt ? `Saves as ${fmt.label} in this browser.` : "This browser can't record video; try Chrome, Edge, Firefox or Safari."} Encoding runs in real time, so a 60-second clip takes about a minute. The estimate is a target bitrate, not a guarantee.
          </p>
          <ErrorLine text={err} />
        </div>
      </div>
    </ToolPanel>
  );
}
