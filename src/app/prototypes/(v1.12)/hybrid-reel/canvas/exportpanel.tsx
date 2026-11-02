"use client";

/* 全屏编辑右上角 Export 点开的导出设置:视频封面 + 名称 + 分辨率 / 格式,底部一个 Export。
   设置记在这次打开的剪辑器里(下次打开还是上次选的),名称默认是当前时间 */

import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { DropdownSelect } from "@/components/ui/dropdown-select";
import { FOCUS } from "./ui";

export type ExportRes = "360p" | "480p" | "720p" | "1080p";
/* 分辨率选项:720p / 1080p 带一行说明(各投放平台的推荐值) */
const RES_OPTIONS: { value: ExportRes; label: string; hint?: string }[] = [
  { value: "360p", label: "360p" },
  { value: "480p", label: "480p" },
  { value: "720p", label: "720p", hint: "Recommended for TikTok Ads Manager" },
  { value: "1080p", label: "1080p", hint: "Recommended for TikTok" },
];
export type ExportOpts = {
  name: string;
  res: ExportRes;
  format: "MP4" | "MOV";
};

/** 默认名称:导出那一刻的本机时间,例如 202610221113 */
export function defaultExportName(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}`;
}

export const DEFAULT_EXPORT: Omit<ExportOpts, "name"> = { res: "1080p", format: "MP4" };

export function ExportPanel({
  value,
  cover,
  onCover,
  onExport,
  onClose,
}: {
  /** 上次选的设置(名称每次打开重新取当前时间) */
  value: Omit<ExportOpts, "name">;
  cover?: string;
  /** 点封面:打开封面弹窗换封面 */
  onCover?: () => void;
  onExport: (opts: ExportOpts) => void;
  onClose: () => void;
}) {
  const [opts, setOpts] = useState<ExportOpts>(() => ({ ...value, name: defaultExportName() }));
  const set = <K extends keyof ExportOpts>(k: K, v: ExportOpts[K]) => setOpts((o) => ({ ...o, [k]: v }));
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    /* 点面板外面收起;面板里的下拉菜单挂在 body 上,不算外面 */
    const off = (e: PointerEvent) => {
      const t = e.target as Element;
      if (ref.current?.contains(t) || t.closest?.('[role="listbox"]') || t.closest?.('[data-export-trigger]')) return;
      onClose();
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose();
    };
    document.addEventListener("pointerdown", off, true);
    window.addEventListener("keydown", esc, true);
    return () => {
      document.removeEventListener("pointerdown", off, true);
      window.removeEventListener("keydown", esc, true);
    };
  }, [onClose]);

  const field = (label: string, control: React.ReactNode) => (
    <div>
      <p className="mb-1.5 text-[13px] font-semibold text-[#1a1a2e]">{label}</p>
      {control}
    </div>
  );
  const select = <K extends "res" | "format">(k: K, label: string, options: ExportOpts[K][]) =>
    field(
      label,
      <DropdownSelect size="sm" label={label} value={opts[k]} options={options.map((o) => ({ value: o, label: o }))} onChange={(v) => set(k, v as ExportOpts[K])} />,
    );

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Export settings"
      className="absolute right-2 top-12 z-[70] w-[340px] rounded-2xl border border-[#ececf1] bg-white p-5 text-[#1a1a2e] shadow-[0_18px_48px_rgba(26,26,46,0.18)]"
    >
      <div className="flex items-center">
        <h3 className="flex-1 text-[15px] font-bold">Export settings</h3>
        <button type="button" aria-label="Close export settings" onClick={onClose} className="grid size-8 place-items-center rounded-lg text-[#6a6b7b] transition hover:bg-[#f3f4f6] hover:text-[#1a1a2e]">
          <X className="size-4" />
        </button>
      </div>

      <div className="mt-4 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-semibold">Cover</p>
          <button
            type="button"
            aria-label={cover ? "Change cover" : "Add a cover"}
            onClick={onCover}
            className={`group relative grid h-[68px] w-[104px] place-items-center overflow-hidden rounded-lg bg-black text-white/70 ${FOCUS}`}
          >
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt="" className="size-full object-contain" />
            ) : (
              <ImagePlus className="size-5" />
            )}
            <span className="absolute inset-0 grid place-items-center bg-black/45 text-[12px] font-semibold text-white opacity-0 transition group-hover:opacity-100">Change</span>
          </button>
        </div>
        {field(
          "Name",
          <input
            aria-label="Name"
            value={opts.name}
            onChange={(e) => set("name", e.target.value)}
            className="h-9 w-full rounded-lg border border-[#e1e3e9] bg-white px-3 text-[13px] outline-none transition focus:border-[#ff5e1a] focus:ring-[3px] focus:ring-[#ff5e1a]/15"
          />,
        )}
        {field("Resolution", <DropdownSelect size="sm" label="Resolution" value={opts.res} options={RES_OPTIONS} onChange={(v) => set("res", v)} />)}
        {select("format", "Format", ["MP4", "MOV"])}
      </div>

      <button
        type="button"
        onClick={() => {
          onExport({ ...opts, name: opts.name.trim() || defaultExportName() });
          onClose();
        }}
        className="mt-5 h-10 w-full rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] text-[14px] font-semibold text-white transition hover:brightness-105"
      >
        Export
      </button>
    </div>
  );
}
