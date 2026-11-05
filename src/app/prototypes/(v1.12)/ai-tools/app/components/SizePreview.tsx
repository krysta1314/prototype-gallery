"use client";

/* 输出尺寸预览:原图 → 输出像素;长边 ≥ 10,000px 加 Print-ready 徽标和 300 dpi 英寸数。 */

import { Printer } from "lucide-react";
import { isPrintReady, outputSize, printCm, printInches, type UpscaleParams } from "../logic";

const fmt = (n: number) => n.toLocaleString("en-US");

export function SizePreview({
  source,
  params,
  emptyText = "Upload an image to see the output size.",
}: {
  source: { width: number; height: number } | null;
  params: UpscaleParams;
  /** 没有源图尺寸时的提示(画布里是「尺寸还没读到」,不是「去上传」) */
  emptyText?: string;
}) {
  /* outputSize 在宽或高为 0 时会除以 0,这里当作没有源图 */
  if (!source || !(source.width > 0) || !(source.height > 0)) {
    return (
      <div className="rounded-lg bg-[#f6f7f9] px-3 py-2.5 text-[12px] text-[#6a6b7b]">
        {emptyText}
      </div>
    );
  }
  const out = outputSize(source.width, source.height, params);
  const print = isPrintReady(out.w, out.h);
  const inch = printInches(out.w, out.h);
  const cm = printCm(out.w, out.h);
  return (
    <div className="rounded-lg bg-[#f6f7f9] px-3 py-2.5">
      <div className="text-[13px] font-semibold tabular-nums text-[#1a1a2e]">
        {fmt(source.width)} × {fmt(source.height)}
        <span className="mx-1.5 font-normal text-[#6a6b7b]">→</span>
        <span className="text-[#e2500f]">
          {fmt(out.w)} × {fmt(out.h)}
        </span>
        <span className="ml-1 font-normal text-[#6a6b7b]">px</span>
      </div>
      {print && (
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#e5f5ee] px-2 py-0.5 text-[11px] font-semibold text-[#12704b]">
            <Printer className="size-3" />
            Print-ready (300 dpi)
          </span>
          <span className="text-[12px] tabular-nums text-[#6a6b7b]">
            {inch.w} × {inch.h} in · {cm.w} × {cm.h} cm
          </span>
        </div>
      )}
      {params.mode === "target" && (
        <div className="mt-1.5 text-[12px] text-[#6a6b7b]">Max 2160p. For print, use Factor.</div>
      )}
    </div>
  );
}
