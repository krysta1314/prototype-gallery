"use client";

import type { Pic } from "./pool";

/* 2026-11-26 画中画小卡(Face Swap 的参考脸 / Image to Video 的首帧):固定在结果左上角，大小按卡片宽度走，不换位置(见 memory cover-inset-fixed-position) */
export function InsetCard({ p, label }: { p: Pic; label?: string }) {
  const [w, h] = p.aspect.split(":").map(Number);
  const src = p.kind === "video" ? p.poster ?? p.src : p.src;
  return (
    <div className="pointer-events-none absolute left-[4%] top-[5%] z-10 w-[24%] min-w-[64px] max-w-[150px]">
      <div className="overflow-hidden rounded-[10px] bg-white shadow-[0_10px_28px_rgba(0,0,0,0.35)] ring-2 ring-white" style={{ aspectRatio: `${w || 1} / ${h || 1}` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={p.alt} loading="lazy" className="size-full object-cover" />
      </div>
      {label && <span className="mt-1.5 inline-block rounded-full bg-black/60 px-2 py-0.5 text-[10.5px] font-semibold text-white backdrop-blur">{label}</span>}
    </div>
  );
}

