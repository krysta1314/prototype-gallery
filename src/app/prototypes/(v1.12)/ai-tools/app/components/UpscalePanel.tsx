"use client";

/* 放大参数面板(纯受控):工具页、Agent 输入框和画布浮层共用。
   预计积分与提交按钮不在这里,由调用方按各自位置摆放。
   2026-11-05 按 fal(fal-ai/seedvr/upscale/image)的参数表平铺：模式 → 倍数 / 目标分辨率 → Noise scale → Format(Seed 2026-11-05 去掉，固定随机),
   不再折叠 Advanced;每项标题旁 ⓘ 悬停说明;倍数、噪声滑杆改过后出现橡皮擦「重置」。
   Format 默认仍是 PNG(fal 默认 jpg,产品为印刷无损定 PNG)。 */

import { useState } from "react";
import { Eraser, Info } from "lucide-react";
import { DropdownSelect } from "@/components/ui/dropdown-select";
import {
  DEFAULT_PARAMS,
  FACTOR_MAX,
  FACTOR_MIN,
  parseFactor,
  type OutputFormat,
  type TargetRes,
  type UpscaleMode,
  type UpscaleParams,
} from "../logic";
import { Segmented } from "./ToolKit";

export const FIELD =
  "rounded-lg border border-[#e1e3e9] bg-white text-[13px] text-[#1a1a2e] outline-none transition placeholder:text-[#74758a] hover:border-[#c9cad4] focus:border-[#ff5e1a] focus:ring-[3px] focus:ring-[#ff5e1a]/15";

export const TARGET_OPTIONS: { value: TargetRes; label: string }[] = [
  { value: "720p", label: "720p" },
  { value: "1080p", label: "1080p (Full HD)" },
  { value: "1440p", label: "1440p (2K)" },
  { value: "2160p", label: "2160p (4K)" },
];

export const MODE_OPTIONS: { value: UpscaleMode; label: string }[] = [
  { value: "factor", label: "Factor" },
  { value: "target", label: "Target" },
];

const FORMAT_OPTIONS: { value: OutputFormat; label: string }[] = [
  { value: "png", label: "PNG" },
  { value: "jpg", label: "JPG" },
  { value: "webp", label: "WEBP" },
];

/** 数字框:输入时保留草稿,失焦时由 parse 校正并回写;空 / 非数字由 parse 决定回到上一次合法值 */
export function NumberBox({
  value,
  parse,
  format,
  onCommit,
  label,
  inputMode = "decimal",
  placeholder,
  className = "",
}: {
  value: number | null;
  parse: (raw: string, prev: number | null) => number | null;
  format: (v: number | null) => string;
  onCommit: (v: number | null) => void;
  label: string;
  inputMode?: "decimal" | "numeric";
  placeholder?: string;
  className?: string;
}) {
  /* 草稿记着它是基于哪个值打的;外部值变了(滑杆、快捷档)草稿自动作废 */
  const [d, setD] = useState<{ text: string; base: number | null } | null>(null);
  const draft = d && d.base === value ? d.text : null;
  const setDraft = (text: string | null) => setD(text === null ? null : { text, base: value });
  const commit = () => {
    if (draft === null) return;
    const next = parse(draft, value);
    setDraft(null);
    if (next !== value) onCommit(next);
  };
  return (
    <input
      type="text"
      inputMode={inputMode}
      aria-label={label}
      placeholder={placeholder}
      value={draft ?? format(value)}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        /* Enter 只提交数值:拦掉默认行为、不移走焦点,免得按键落到别的按钮上(曾误展开 Advanced) */
        if (e.key === "Enter") {
          e.preventDefault();
          commit();
        } else if (e.key === "Escape") setDraft(null);
      }}
      className={`h-9 px-2.5 text-center tabular-nums ${FIELD} ${className}`}
    />
  );
}

/** 原生 range 的橙色已填充段 */
export const rangeStyle = (v: number, min: number, max: number): React.CSSProperties => ({
  background: `linear-gradient(to right, #ff5e1a ${((v - min) / (max - min)) * 100}%, #e6e7ec 0)`,
});
export const RANGE =
  "h-1.5 w-full cursor-pointer appearance-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40 [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#ff5e1a] [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-solid [&::-moz-range-thumb]:border-[#ff5e1a] [&::-moz-range-thumb]:bg-white";

/** 字段标题 + ⓘ(悬停 / 聚焦出说明,照 fal 参数表) */
export const Label = ({ children, info }: { children: React.ReactNode; info: string }) => (
  <div className="mb-1.5 flex items-center gap-1 text-[12px] font-semibold text-[#6a6b7b]">
    {children}
    <span className="group relative inline-flex">
      <button type="button" aria-label={`About ${String(children)}`} className="grid size-4 place-items-center rounded-full text-[#9a9bb0] outline-none transition hover:text-[#4a4b5c] focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40">
        <Info className="size-3.5" />
      </button>
      <span role="tooltip" className="pointer-events-none absolute -left-2 top-[calc(100%+6px)] z-50 w-[220px] rounded-lg bg-[#1a1a2e] px-2.5 py-1.5 text-[11.5px] font-normal leading-snug text-white opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-within:opacity-100">
        {info}
      </span>
    </span>
  </div>
);

/** 滑杆改过默认值后出现的「重置」小按钮(fal 上的橡皮擦按钮) */
export const ResetButton = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button type="button" aria-label={label} title="Reset to default" onClick={onClick} className={`grid size-9 shrink-0 place-items-center text-[#6a6b7b] hover:text-[#1a1a2e] ${FIELD}`}>
    <Eraser className="size-3.5" />
  </button>
);

const INFO = {
  mode: "Factor multiplies the width and height. Target scales the image to a standard size.",
  factor: "How many times larger the image gets, from 1x to 10x.",
  target: "The output size. The short side matches this resolution.",
  noise: "Higher adds more fine detail; lower stays closer to the original.",
  format: "The file type of the upscaled image.",
};

export function UpscalePanel({
  params,
  onChange,
  compact = false,
}: {
  params: UpscaleParams;
  onChange: (p: UpscaleParams) => void;
  source: { width: number; height: number } | null;
  /** 画布浮层用:窄一点 */
  compact?: boolean;
  /** 没有源图尺寸时尺寸预览里的提示;不传用默认的「上传图片」提示 */
  sizeEmptyText?: string;
}) {
  const set = (patch: Partial<UpscaleParams>) => onChange({ ...params, ...patch });

  return (
    <div className={`flex flex-col gap-4 text-[#1a1a2e] w-full ${compact ? "min-w-0" : ""}`}>
      <div>
        <Label info={INFO.mode}>Upscale Mode</Label>
        <Segmented label="Upscale mode" value={params.mode} options={MODE_OPTIONS} onChange={(mode) => set({ mode })} />
      </div>

      {params.mode === "factor" ? (
        <div>
          <Label info={INFO.factor}>Upscale Factor</Label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              aria-label="Upscale factor"
              min={FACTOR_MIN}
              max={FACTOR_MAX}
              step={0.1}
              value={params.factor}
              onChange={(e) => set({ factor: parseFactor(e.target.value, params.factor) })}
              style={rangeStyle(params.factor, FACTOR_MIN, FACTOR_MAX)}
              className={RANGE}
            />
            <div className="flex shrink-0 items-center gap-1">
              <NumberBox
                label="Upscale factor value"
                className="w-14"
                value={params.factor}
                parse={(raw, prev) => parseFactor(raw, prev ?? params.factor)}
                format={(v) => String(v ?? params.factor)}
                onCommit={(v) => v !== null && set({ factor: v })}
              />
              <span className="text-[13px] text-[#6a6b7b]">x</span>
            </div>
            {params.factor !== DEFAULT_PARAMS.factor && <ResetButton label="Reset upscale factor" onClick={() => set({ factor: DEFAULT_PARAMS.factor })} />}
          </div>
        </div>
      ) : (
        <div>
          <Label info={INFO.target}>Target Resolution</Label>
          <DropdownSelect size="sm" label="Target resolution" value={params.target} options={TARGET_OPTIONS} onChange={(target) => set({ target })} />
        </div>
      )}

      {/* 「原图 → 输出尺寸」那一条 2026-11-05 去掉(工具页和画布浮层都不显示) */}

      <div>
        <Label info={INFO.noise}>Noise Scale</Label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            aria-label="Noise scale"
            min={0}
            max={1}
            step={0.001}
            value={params.noiseScale}
            onChange={(e) => set({ noiseScale: Number(e.target.value) })}
            style={rangeStyle(params.noiseScale, 0, 1)}
            className={`${RANGE} mr-1`}
          />
          <NumberBox
            label="Noise scale value"
            className="w-16 shrink-0"
            value={params.noiseScale}
            parse={(raw, prev) => {
              const n = Number(raw);
              if (raw.trim() === "" || !Number.isFinite(n)) return prev;
              return Math.min(1, Math.max(0, Math.round(n * 1000) / 1000));
            }}
            format={(v) => String(v ?? params.noiseScale)}
            onCommit={(v) => v !== null && set({ noiseScale: v })}
          />
          {params.noiseScale !== DEFAULT_PARAMS.noiseScale && <ResetButton label="Reset noise scale" onClick={() => set({ noiseScale: DEFAULT_PARAMS.noiseScale })} />}
        </div>
      </div>

      <div>
        <Label info={INFO.format}>Format</Label>
        <Segmented label="Output format" value={params.format} options={FORMAT_OPTIONS} onChange={(format) => set({ format })} />
      </div>
    </div>
  );
}
