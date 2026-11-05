"use client";

/* 工具页共用件(Upscale Image / Resize & Expand / Video Resize / Auto Captions):
   - ToolLayout:左栏(标题 + 输入 / 参数 + 底部预计积分和主按钮)+ 右侧结果;< lg 单列,主按钮条固定在底部;
   - CostRow:预计积分一行;ctaBtn:主按钮样式;Segmented:分段控件;UploadDrop:空的上传位;
   - NotEnoughCreditsDialog:余额不够的弹窗(与画布同款);GEN_CSS / RunningTile:生成中动画。
   版式、颜色照 design.md 和 Upscale Image 原样,不另起风格。 */

import { useEffect, type CSSProperties, type ReactNode } from "react";
import { Coins } from "lucide-react";
import { formatCredits } from "@/app/prototypes/(v1.12)/hybrid-reel/canvas/credits";
import { ToolsTopBar } from "./ToolsTopBar";

export const ctaBtn =
  "inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-5 text-[15px] font-bold text-white shadow-[0_10px_30px_rgba(255,82,85,0.28)] transition hover:brightness-105 hover:shadow-[0_14px_38px_rgba(255,82,85,0.4)] disabled:opacity-40 disabled:shadow-none disabled:hover:brightness-100";

/** 次要按钮(白底描边) */
export const ghostBtn =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#e1e3e9] bg-white px-3 text-[13px] font-semibold text-[#1a1a2e] outline-none transition hover:border-[#c9cad4] hover:bg-[#fafafb] focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40 disabled:opacity-40";

export const FIELD =
  "rounded-lg border border-[#e1e3e9] bg-white text-[13px] text-[#1a1a2e] outline-none transition placeholder:text-[#74758a] hover:border-[#c9cad4] focus:border-[#ff5e1a] focus:ring-[3px] focus:ring-[#ff5e1a]/15";

/** 左栏小节标题 */
export function FieldLabel({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-2">
      <span className="text-[13px] font-semibold text-[#1a1a2e]">{children}</span>
      {hint && <span className="text-[12px] text-[#9a9bb0]">{hint}</span>}
    </div>
  );
}

/** 分段控件:灰槽 + 白色滑块 */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  size = "md",
}: {
  value: T;
  options: readonly { value: T; label: string; title?: string }[];
  onChange: (v: T) => void;
  label: string;
  size?: "sm" | "md";
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-0.5 rounded-lg bg-[#eef0f3] p-0.5">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            title={o.title}
            onClick={() => onChange(o.value)}
            className={`flex-1 rounded-md font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40 ${size === "sm" ? "h-7 text-[12px]" : "h-8 text-[13px]"} ${
              on ? "bg-white text-[#1a1a2e] shadow-[0_1px_2px_rgba(26,26,46,0.12)]" : "text-[#6a6b7b] hover:text-[#1a1a2e]"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* 滑块:样式同 Upscale Image 参数区(左段品牌橙、白色圆点) */
export const RANGE =
  "h-1.5 w-full cursor-pointer appearance-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40 [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#ff5e1a] [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-solid [&::-moz-range-thumb]:border-[#ff5e1a] [&::-moz-range-thumb]:bg-white";
/** origin = 填色起点(居中的滑块如 −90°…90° 从 0 往两边填) */
export const rangeStyle = (v: number, min: number, max: number, origin = min): CSSProperties => {
  const p = (x: number) => ((x - min) / (max - min)) * 100;
  const a = Math.min(p(v), p(origin));
  const b = Math.max(p(v), p(origin));
  return { background: `linear-gradient(to right, #e6e7ec ${a}%, #ff5e1a ${a}%, #ff5e1a ${b}%, #e6e7ec ${b}%)` };
};

/** 一行滑块:标题 + 当前值 + 滑块 */
export function SliderRow({
  label,
  value,
  display,
  min,
  max,
  step = 1,
  origin,
  onChange,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step?: number;
  origin?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2 text-[12.5px]">
        <span className="font-semibold text-[#4a4b5c]">{label}</span>
        <span className="font-semibold tabular-nums text-[#1a1a2e]">{display}</span>
      </div>
      <input
        type="range"
        aria-label={label}
        aria-valuetext={display}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={rangeStyle(value, min, max, origin)}
        className={RANGE}
      />
    </div>
  );
}

/** 主按钮里的积分(2026-11-05 照真实产品「Generate Video ● 1706」:积分放进按钮，按钮上方不再单独一行 Estimated cost)。
    cost = null(还算不出来，比如没传素材)不显示;0 显示 Free */
export function CtaCost({ cost }: { cost: number | null }) {
  if (cost === null) return null;
  return (
    <span className="ml-1 inline-flex items-center gap-1.5 tabular-nums" aria-label={cost === 0 ? "Free" : `${cost} credits`}>
      {cost === 0 ? (
        "Free"
      ) : (
        <>
          {/* 真实产品的积分图标(uat-app.buzzvideo.ai/icons/credits.svg)当遮罩染白：白色圆角块 + 镂空星星透出按钮的橙色 */}
          <span
            aria-hidden
            className="size-3.5 shrink-0 bg-white"
            style={{ mask: "url(/prototypes/ai-tools/credits.svg) center / contain no-repeat", WebkitMask: "url(/prototypes/ai-tools/credits.svg) center / contain no-repeat" }}
          />
          {formatCredits(cost)}
        </>
      )}
    </span>
  );
}

/** 预计积分一行(旧样式，工具页已改用按钮里的 CtaCost);cost = null 表示还算不出来(没传素材) */
export function CostRow({ cost, note }: { cost: number | null; note?: string }) {
  return (
    <div className="flex items-center justify-between gap-2 text-[13px]">
      <span className="text-[#6a6b7b]">
        Estimated cost{note && <span className="ml-1 text-[12px] text-[#9a9bb0]">· {note}</span>}
      </span>
      <span
        className="flex shrink-0 items-center gap-1.5 font-semibold tabular-nums text-[#1a1a2e]"
        aria-label={cost === null ? "Estimated credits: unknown" : `Estimated credits: ${cost}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/prototypes/homepage/credits-icon.svg" alt="" className="size-3.5" />
        {cost === null ? "–" : cost === 0 ? "Free" : `${formatCredits(cost)} ${cost === 1 ? "credit" : "credits"}`}
      </span>
    </div>
  );
}

/** 空的上传位(点击 / 拖拽);拖拽事件挂在 ToolLayout 的左栏上 */
export function UploadDrop({
  icon,
  title,
  hint,
  dragging,
  onPick,
}: {
  icon: ReactNode;
  title: string;
  hint: string;
  dragging: boolean;
  onPick: () => void;
}) {
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onPick}
        className={`flex h-[136px] w-full flex-col items-center justify-center gap-1.5 rounded-xl border px-6 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40 ${
          dragging ? "border-[#ff5e1a] bg-[#fff7f1]" : "border-[#e1e3e9] bg-[#fafafb] hover:border-[#ffbd99] hover:bg-[#fffaf7]"
        }`}
      >
        <span className="grid size-9 place-items-center rounded-[10px] bg-[#fff3ec] text-[#ff5e1a]">{icon}</span>
        <span className="text-[14px] font-semibold text-[#1a1a2e]">{title}</span>
        <span className="text-[12px] leading-snug text-[#9a9bb0]">{hint}</span>
      </button>
    </div>
  );
}

/** 拖文件进左栏的事件(只认文件)。给了 onFiles 就把拖进来的全部文件交给它(多素材工具页);否则只取第一个 */
export function fileDropProps(setDragging: (v: boolean) => void, onFile: (f: File | undefined) => void, onFiles?: (fs: File[]) => void) {
  return {
    onDragOver: (e: React.DragEvent) => {
      if (!Array.from(e.dataTransfer.types).includes("Files")) return;
      e.preventDefault();
      setDragging(true);
    },
    onDragLeave: (e: React.DragEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
    },
    onDrop: (e: React.DragEvent) => {
      if (!Array.from(e.dataTransfer.types).includes("Files")) return;
      e.preventDefault();
      setDragging(false);
      if (onFiles) onFiles(Array.from(e.dataTransfer.files));
      else onFile(e.dataTransfer.files[0]);
    },
  };
}

/* 处理中卡片:与 GenGrid 同一套动画(斜向重复渐变 5s 平移、三点依次闪) */
export const GEN_CSS = `
.gen-anim { background: repeating-linear-gradient(135deg, rgba(255,219,179,0.95) 0%, rgba(255,179,180,0.9) 25%, rgba(255,219,179,0.95) 50%); background-size: 200% 200%; animation: gradient-shift 5s linear infinite; }
@keyframes gradient-shift { 0% { background-position: 0% 0%; } 100% { background-position: 100% 100%; } }
.gg-d2 { animation: gg-d2 1.2s steps(1) infinite; }
.gg-d3 { animation: gg-d3 1.2s steps(1) infinite; }
@keyframes gg-d2 { 0% { opacity: 0; } 33% { opacity: 1; } }
@keyframes gg-d3 { 0% { opacity: 0; } 66% { opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .gen-anim { animation: none; } .gg-d2, .gg-d3 { animation: none; opacity: 1; } }
`;

/** 生成中的占位(铺满父元素) */
export function RunningTile({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label} className="absolute inset-0 overflow-hidden">
      <div className="gen-anim absolute inset-0" />
      <span className="absolute left-2.5 top-2.5 rounded-full bg-white/55 px-2 py-[3px] text-[11px] font-semibold text-[#1a1a2e] backdrop-blur-sm">
        {label}
        <span>.</span>
        <span className="gg-d2">.</span>
        <span className="gg-d3">.</span>
      </span>
    </div>
  );
}

/** 余额不够(与画布同款):显示需要多少、还剩多少;不扣费、不开跑 */
export function NotEnoughCreditsDialog({
  needed,
  balance,
  onClose,
  message = "Top up to keep creating. Nothing was charged.",
}: {
  needed: number;
  balance: number;
  onClose: () => void;
  message?: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#1a1a2e]/30 p-4" onClick={onClose}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="credits-dialog-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[380px] rounded-2xl bg-white p-5 text-[#1a1a2e] shadow-[0_16px_48px_rgba(26,26,46,0.22)]"
      >
        <span className="grid size-10 place-items-center rounded-xl bg-[#fff3ec] text-[#ff5e1a]">
          <Coins className="size-5" />
        </span>
        <h2 id="credits-dialog-title" className="mt-3 text-[16px] font-bold">
          Not enough credits
        </h2>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#6a6b7b]">{message}</p>
        <dl className="mt-4 space-y-1.5 rounded-xl bg-[#f7f8fa] px-3.5 py-3 text-[13px] tabular-nums">
          <div className="flex justify-between">
            <dt className="text-[#6a6b7b]">Needed</dt>
            <dd className="font-semibold">{formatCredits(needed)} credits</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[#6a6b7b]">Your balance</dt>
            <dd className="font-semibold text-[#d0342c]">{formatCredits(balance)} credits</dd>
          </div>
        </dl>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            autoFocus
            onClick={onClose}
            className="rounded-full border border-[#ececf1] px-4 py-2 text-[13px] font-semibold text-[#1a1a2e] transition hover:bg-[#f6f5f8]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/** 右侧结果区为空时 */
export function EmptyResults({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="grid min-h-[280px] place-items-center rounded-[22px] border border-[#e4e2e9] bg-[#FAFBFC] px-6 py-10 text-center lg:h-full">
      <div className="max-w-[300px]">
        <span className="mx-auto grid size-9 place-items-center rounded-[10px] bg-[#fff3ec] text-[#ff5e1a]">{icon}</span>
        <p className="mt-3 text-[14px] font-semibold text-[#1a1a2e]">{title}</p>
        <p className="mt-1 text-[13px] leading-relaxed text-[#6a6b7b]">{body}</p>
      </div>
    </div>
  );
}

/** 工具页空状态(2026-11-05 统一照 Upscale Image):功能标题 → 一句描述 → 效果演示，整体在结果区上下左右居中 */
export function ToolEmptyDemo({ title, body, children }: { title: string; body: string; children: ReactNode }) {
  return (
    <div className="flex min-h-full w-full flex-col items-center justify-center px-6 py-10 text-center">
      <h3 className="text-balance text-[30px] font-extrabold tracking-[-0.02em] text-[#1a1a2e]">{title}</h3>
      <p className="mt-2 max-w-[52ch] text-pretty text-[14px] leading-relaxed text-[#6a6b7b]">{body}</p>
      <div className="mt-7 flex w-full max-w-[860px] flex-wrap items-center justify-center gap-4">{children}</div>
    </div>
  );
}

/** 演示里的一个素材格(图 / 视频 / 音频)+ 下面一行名字 */
export function DemoTile({ kind, url, label, tall = false }: { kind: "image" | "video" | "audio"; url?: string; label: string; tall?: boolean }) {
  return (
    <figure className="w-[148px] text-left">
      <div className={`relative overflow-hidden rounded-xl bg-[#f1f2f5] ring-1 ring-[#ececf1] ${tall ? "h-[200px]" : "h-[96px]"}`}>
        {kind === "image" && url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="size-full object-cover" />
        ) : kind === "video" && url ? (
          <video src={url} muted loop playsInline autoPlay className="size-full object-cover" />
        ) : (
          <span className="grid size-full place-items-center text-[#ff5e1a]">
            <svg viewBox="0 0 48 24" className="h-6 w-12" aria-hidden="true">
              {[4, 10, 16, 8, 20, 12, 6, 14, 9, 4].map((h, i) => (
                <rect key={i} x={i * 5} y={12 - h / 2} width="3" height={h} rx="1.5" fill="currentColor" />
              ))}
            </svg>
          </span>
        )}
      </div>
      <figcaption className="mt-1 truncate text-[12px] font-semibold text-[#4a4b5c]">{label}</figcaption>
    </figure>
  );
}

/**
 * 工具页骨架(照 Upscale Image):
 * 宽屏 = 左栏 384px(标题 / 可滚动的输入区 / 底部积分 + 主按钮)| 竖线 | 右侧结果(自己滚);
 * < lg = 单列一起滚,「积分 + 主按钮」固定在底部。顶栏叠在白色面板顶部。
 */
export function ToolLayout({
  title,
  badge,
  subtitle,
  settingsLabel,
  credits,
  onMenu,
  onInvite,
  panelRef,
  dropProps,
  settings,
  action,
  results,
  resultsLabel = "Results",
  resultsMeta,
  resultsRef,
  children,
}: {
  title: string;
  badge?: string;
  subtitle: string;
  settingsLabel: string;
  credits: number;
  onMenu?: () => void;
  onInvite?: () => void;
  panelRef?: React.Ref<HTMLElement>;
  dragging?: boolean;
  dropProps?: ReturnType<typeof fileDropProps>;
  settings: ReactNode;
  action: ReactNode;
  results: ReactNode;
  resultsLabel?: string;
  resultsMeta?: ReactNode;
  resultsRef?: React.Ref<HTMLDivElement>;
  /** 弹窗等 */
  children?: ReactNode;
}) {
  return (
    <div className="relative flex h-full min-w-0 flex-1 flex-col">
      <style>{GEN_CSS}</style>
      <ToolsTopBar credits={credits} onMenu={onMenu} onInvite={onInvite} />
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pb-4 pt-14 text-[#1a1a2e] sm:px-6 lg:flex-row lg:gap-6 lg:overflow-hidden lg:pb-0 lg:pl-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <section
          ref={panelRef}
          aria-label={settingsLabel}
          {...dropProps}
          /* 整栏都能放文件，但拖进来时只高亮上传框(2026-11-05 Monica 定),不再整栏变色 */
          className="flex min-h-0 w-full shrink-0 flex-col rounded-2xl lg:h-full lg:w-[384px] lg:rounded-none lg:border-r lg:border-[#F0F0F2]"
        >
          <header className="shrink-0 px-1 pb-3 pt-2 lg:px-5">
            <div className="flex items-center gap-2">
              <h1 className="text-[20px] font-extrabold tracking-tight text-[#1a1a2e]">{title}</h1>
              {badge && (
                <span className="rounded-full bg-[#fff3ec] px-2 py-[2px] text-[11px] font-bold text-[#ff5e1a]" title="Model">
                  {badge}
                </span>
              )}
            </div>
            <p className="mt-1 text-[13px] leading-snug text-[#6a6b7b]">{subtitle}</p>
          </header>
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-1 pb-4 lg:px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{settings}</div>
          <footer className="hidden shrink-0 space-y-2.5 border-t border-[#F0F0F2] px-5 pb-5 pt-3.5 lg:block">{action}</footer>
        </section>
        <section aria-label={resultsLabel} className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="flex shrink-0 items-baseline justify-between gap-3 px-1 pb-3">
            <h2 className="text-[15px] font-bold text-[#1a1a2e]">{resultsLabel}</h2>
            {resultsMeta}
          </div>
          <div ref={resultsRef} className="min-h-0 flex-1 lg:overflow-y-auto lg:pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {results}
          </div>
        </section>
      </div>
      <div className="shrink-0 space-y-2 border-t border-[#ececf1] bg-white/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-6px_20px_rgba(26,26,46,0.06)] backdrop-blur sm:px-6 lg:hidden">
        {action}
      </div>
      {children}
    </div>
  );
}
