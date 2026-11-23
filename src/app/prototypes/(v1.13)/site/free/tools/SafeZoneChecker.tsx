"use client";

/* 免费工具：安全区检查(2026-11-19)。上传图片或视频(拖动选帧),叠上 TikTok / Reels / Stories / Shorts 的界面遮挡区。
   安全区数值见 ../specs.ts(官方来源 + TikTok 的第三方实测值，页面写明)。全在本机，不上传。不用虚线：遮挡区用半透明底 + 实线框。 */

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { fmtTime } from "../media";
import { ZONES, type Zone } from "../specs";
import { FilePick, Seg, ToolPanel } from "../ui";

const pct = (n: number) => `${(n * 100).toFixed(2)}%`;

function Overlay({ z, strong }: { z: Zone; strong: boolean }) {
  const shade = strong ? "bg-black/60" : "bg-black/35";
  const tag = "absolute rounded-full bg-black/70 px-2 py-0.5 text-[10.5px] font-semibold text-white";
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className={`absolute inset-x-0 top-0 ${shade}`} style={{ height: pct(z.top) }}>
        <span className={`${tag} bottom-1.5 left-1/2 -translate-x-1/2`}>Top UI</span>
      </div>
      <div className={`absolute inset-x-0 bottom-0 ${shade}`} style={{ height: pct(z.bottom) }}>
        <span className={`${tag} left-1/2 top-1.5 -translate-x-1/2 whitespace-nowrap`}>Caption, CTA &amp; buttons</span>
      </div>
      <div className={`absolute left-0 ${shade}`} style={{ top: pct(z.top), bottom: pct(z.bottom), width: pct(z.left) }} />
      {/* 右边：有按钮栏(TikTok)时整列按按钮栏宽度遮，和安全框右边对齐 */}
      <div className={`absolute right-0 ${shade}`} style={{ top: pct(z.top), bottom: pct(z.bottom), width: pct(z.rail ? Math.max(z.right, z.rail.width) : z.right) }} />
      <div
        className="absolute rounded-[4px] ring-2 ring-[#FF744D]"
        style={{ top: pct(z.top), bottom: pct(z.bottom), left: pct(z.left), right: pct(z.rail ? Math.max(z.right, z.rail.width) : z.right) }}
      >
        <span className="absolute left-1.5 top-1.5 rounded-full bg-[#FF744D] px-2 py-0.5 text-[10.5px] font-bold text-white">Safe zone</span>
      </div>
      {z.rail && (
        <div className="absolute right-0 ring-2 ring-white/70" style={{ bottom: pct(z.bottom), height: pct(z.rail.height - z.bottom), width: pct(z.rail.width) }}>
          <span className={`${tag} left-1/2 top-1.5 -translate-x-1/2 [writing-mode:vertical-rl]`}>Buttons</span>
        </div>
      )}
    </div>
  );
}

export function SafeZoneChecker() {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string>();
  const [kind, setKind] = useState<"image" | "video">("image");
  const [zone, setZone] = useState<Zone["key"]>("tiktok");
  const [strong, setStrong] = useState<"on" | "off">("on");
  const [dur, setDur] = useState(0);
  const [t, setT] = useState(0);
  const [ratio, setRatio] = useState<number>();
  const video = useRef<HTMLVideoElement>(null);
  const z = ZONES.find((x) => x.key === zone)!;

  /* 对象网址在选文件时建，换文件 / 卸载时释放 */
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );

  const pick = (f: File) => {
    if (!f.type.startsWith("image/") && !f.type.startsWith("video/")) return;
    setKind(f.type.startsWith("video/") ? "video" : "image");
    setT(0);
    setRatio(undefined);
    setFile(f);
    setUrl(URL.createObjectURL(f));
  };
  const off = ratio !== undefined && Math.abs(ratio - 9 / 16) > 0.02;

  return (
    <ToolPanel>
      <div className="grid gap-6 md:grid-cols-[minmax(0,420px)_1fr] md:items-start">
        <div className="mx-auto w-full max-w-[380px]">
          <div className="relative aspect-[9/16] overflow-hidden rounded-[18px] bg-[#1C1C1C] ring-1 ring-white/10">
            {url && kind === "image" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt="Your frame" className="absolute inset-0 size-full object-cover" onLoad={(e) => setRatio(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)} />
            )}
            {url && kind === "video" && (
              <video
                ref={video}
                src={url}
                muted
                playsInline
                preload="auto"
                className="absolute inset-0 size-full object-cover"
                onLoadedMetadata={(e) => {
                  setDur(isFinite(e.currentTarget.duration) ? e.currentTarget.duration : 0);
                  setRatio(e.currentTarget.videoWidth / e.currentTarget.videoHeight);
                }}
              />
            )}
            {!url && <p className="absolute inset-x-6 top-1/2 -translate-y-1/2 text-center text-[13px] text-white/60">Upload a 9:16 frame to see it under the overlay</p>}
            <Overlay z={z} strong={strong === "on"} />
          </div>
          {kind === "video" && url && dur > 0 && (
            <label className="mt-3 block">
              <span className="mb-1 flex justify-between text-[12.5px] font-semibold text-[#9F9F9F]">
                Frame <span className="tabular-nums text-white">{fmtTime(t)}</span>
              </span>
              <input
                type="range"
                min={0}
                max={dur}
                step={0.05}
                value={t}
                onChange={(e) => {
                  setT(+e.target.value);
                  if (video.current) video.current.currentTime = +e.target.value;
                }}
                className="w-full accent-[#FF744D]"
              />
            </label>
          )}
        </div>
        <div className="space-y-5">
          {file ? (
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 truncate text-[14px] font-bold text-white">{file.name}</p>
              <button type="button" aria-label="Remove file" onClick={() => (setFile(null), setUrl(undefined), setRatio(undefined))} className="grid size-8 shrink-0 place-items-center rounded-full bg-white/[0.08] text-white hover:bg-white/15">
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <FilePick compact accept="image/*,video/*" onFile={pick} title="Upload image or video" hint="Stays on your device · 1080×1920 works best" />
          )}
          <Seg label="Platform" value={zone} onChange={setZone} options={ZONES.map((x) => ({ value: x.key, label: x.label }))} />
          <Seg label="Overlay" value={strong} onChange={setStrong} options={[{ value: "on", label: "Strong" }, { value: "off", label: "Light" }]} />
          <div className="rounded-[14px] bg-white/[0.05] p-4">
            <p className="text-[13.5px] font-bold text-white">
              {z.label} safe zone{z.measured ? " (measured)" : ""}
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[#CACACA]">{z.basis}</p>
            <p className="mt-2 text-[12px] text-[#9F9F9F]">
              Source:{" "}
              {z.sources.map((s, i) => (
                <span key={s.url}>
                  {i > 0 && " · "}
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline decoration-white/30 underline-offset-4 hover:text-white">
                    {s.label}
                  </a>
                </span>
              ))}
            </p>
          </div>
          {off && <p className="text-[12.5px] text-[#FFF3EC]">This file isn&apos;t 9:16, so it is shown cropped to fill the frame, the way most vertical placements display it. Resize it first for an exact check.</p>}
        </div>
      </div>
    </ToolPanel>
  );
}
