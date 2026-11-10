"use client";

/* 工具页共用件(Upscale Image / Resize & Expand / Video Resize / Auto Captions):
   - ToolLayout:左栏(标题 + 输入 / 参数 + 底部预计积分和主按钮)+ 右侧结果;< lg 单列,主按钮条固定在底部;
   - CostRow:预计积分一行;ctaBtn:主按钮样式;Segmented:分段控件;UploadDrop:空的上传位;
   - NotEnoughCreditsDialog:余额不够的弹窗(与画布同款);GEN_CSS / RunningTile:生成中动画。
   版式、颜色照 design.md 和 Upscale Image 原样,不另起风格。 */

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Coins, Info, Trash2, Volume2, VolumeX } from "lucide-react";
import { formatCredits } from "@/app/prototypes/(v1.12)/hybrid-reel/canvas/credits";
import { ToolsTopBar } from "./ToolsTopBar";
import { ResultsTabs, TeamResults, useResultsTabs } from "./TeamSharing";
import type { ToolKey } from "../sidebarMenus";
import type { Notify } from "./TopToast";

export const ctaBtn =
  "inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-5 text-[15px] font-bold text-white shadow-[0_10px_30px_rgba(255,82,85,0.28)] transition hover:brightness-105 hover:shadow-[0_14px_38px_rgba(255,82,85,0.4)] disabled:opacity-40 disabled:shadow-none disabled:hover:brightness-100";

/** 次要按钮(白底描边) */
export const ghostBtn =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#e1e3e9] bg-white px-3 text-[13px] font-semibold text-[#1a1a2e] outline-none transition hover:border-[#c9cad4] hover:bg-[#fafafb] focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40 disabled:opacity-40";

export const FIELD =
  "rounded-lg border border-[#e1e3e9] bg-white text-[13px] text-[#1a1a2e] outline-none transition placeholder:text-[#74758a] hover:border-[#c9cad4] focus:border-[#ff5e1a] focus:ring-[3px] focus:ring-[#ff5e1a]/15";

/** 左栏小节标题 */
/** 字段说明收进 ⓘ(2026-11-06 Monica 定：说明不单独摆一行，悬停 / 聚焦图标才出)。
    浮层贴着外层带 relative 的那一行左边铺开，不会被左栏的滚动区裁掉 */
export function InfoTip({ label, text }: { label: string; text: ReactNode }) {
  return (
    <span
      className="group/info inline-flex"
      /* 放在 <label> 里时点图标不要顺带切换开关 */
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <button type="button" aria-label={`About ${label}`} className="grid size-4 place-items-center rounded-full text-[#9a9bb0] outline-none transition hover:text-[#4a4b5c] focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40">
        <Info className="size-3.5" />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-0 right-0 top-[calc(100%+4px)] z-30 rounded-lg bg-[#1a1a2e] px-2.5 py-1.5 text-[11.5px] font-normal leading-snug text-white opacity-0 shadow-lg transition group-focus-within/info:opacity-100 group-hover/info:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}

export function FieldLabel({ children, hint, info }: { children: ReactNode; hint?: ReactNode; info?: ReactNode }) {
  return (
    <div className="relative mb-2 flex items-baseline justify-between gap-2">
      <span className="flex items-center gap-1 text-[13px] font-semibold text-[#1a1a2e]">
        {children}
        {info && <InfoTip label={typeof children === "string" ? children : "this setting"} text={info} />}
      </span>
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
export function CtaCost({ cost, rate }: { cost: number | null; /** 还算不出总数时(没传素材)显示的单价，如 14 = 「14/s」 */ rate?: number }) {
  if (cost === null && rate === undefined) return null;
  if (cost === null)
    return (
      <span className="ml-1 inline-flex items-center gap-1.5 tabular-nums" aria-label={`${rate} credits per second`}>
        <span
          aria-hidden
          className="size-3.5 shrink-0 bg-white"
          style={{ mask: "url(/prototypes/ai-tools/credits.svg) center / contain no-repeat", WebkitMask: "url(/prototypes/ai-tools/credits.svg) center / contain no-repeat" }}
        />
        {formatCredits(rate!)}/s
      </span>
    );
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
/* ---------- 记住上次的参数(2026-11-06 Monica 定) ----------
   每个工具页的参数(模式、倍数、格式、选项等,不含素材和提示词)记在浏览器本地，下次打开沿用;没有记录就用默认值。
   用法：const [p, setP] = useState(DEFAULT); useRememberedSettings("upscale-video", p, setP); */
const SETTINGS_PREFIX = "buzz-tool-settings:";
export function useRememberedSettings<T>(key: string, value: T, restore: (v: T) => void, enabled = true) {
  const loaded = useRef(false);
  /* 挂载后读回(放 effect 里，服务端渲染和首屏一致) */
  useEffect(() => {
    if (!enabled) return;
    try {
      const raw = localStorage.getItem(SETTINGS_PREFIX + key);
      if (raw) restore(JSON.parse(raw) as T);
    } catch {
      /* 读不到就用默认值 */
    }
    loaded.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);
  /* 改了就写回(读回之前不写，免得默认值盖掉上次的) */
  useEffect(() => {
    if (!enabled || !loaded.current) return;
    try {
      localStorage.setItem(SETTINGS_PREFIX + key, JSON.stringify(value));
    } catch {
      /* 存不了就算了 */
    }
  }, [key, value, enabled]);
}

/** 删除结果的二次确认：结果会从生成历史和 Assets 里一起删掉(2026-11-06 Monica 定) */
export function ConfirmDeleteDialog({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#1a1a2e]/30 p-4" onClick={onCancel}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="delete-dialog-title" onClick={(e) => e.stopPropagation()} className="w-full max-w-[380px] rounded-2xl bg-white p-5 text-[#1a1a2e] shadow-[0_16px_48px_rgba(26,26,46,0.22)]">
        <span className="grid size-10 place-items-center rounded-xl bg-[#fff1f0] text-[#e5484d]">
          <Trash2 className="size-5" />
        </span>
        <h2 id="delete-dialog-title" className="mt-3 text-[16px] font-bold">
          Delete this result?
        </h2>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#6a6b7b]">
          It will also be removed from your Assets. This can&apos;t be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" autoFocus onClick={onCancel} className="rounded-full border border-[#ececf1] px-4 py-2 text-[13px] font-semibold text-[#1a1a2e] transition hover:bg-[#f6f5f8]">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="rounded-full bg-[#e5484d] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[#d43b40]">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

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
export function ToolEmptyDemo({ title, body, children, guide }: { title: string; body: string; children: ReactNode; /** 首屏下面接着的落地页内容(ToolGuide);传了它，这一块就是 Guide 标签页的首屏:标题是整页的 H1,不再撑满整屏 */ guide?: ReactNode }) {
  if (guide)
    return (
      <article className="w-full">
        <div className="flex w-full flex-col items-center px-6 pb-2 pt-[clamp(16px,5vh,56px)] text-center">
          <h1 className="text-balance text-[26px] font-extrabold tracking-[-0.02em] text-[#1a1a2e]">{title}</h1>
          <p className="mt-2 max-w-[52ch] text-balance text-[14px] leading-relaxed text-[#5b5c6e]">{body}</p>
          <div className="flex w-full justify-center">{children}</div>
        </div>
        {guide}
      </article>
    );
  return (
    <div className="flex min-h-full w-full flex-col items-center justify-center px-6 py-6 text-center">
      <h3 className="text-balance text-[26px] font-extrabold tracking-[-0.02em] text-[#1a1a2e]">{title}</h3>
      <p className="mt-2 max-w-[52ch] text-pretty text-[14px] leading-relaxed text-[#6a6b7b]">{body}</p>
      <div className="flex w-full justify-center">{children}</div>
    </div>
  );
}

/* 2026-11-06 Monica 定：所有工具页空状态都用 Upscale Image 的排版 —— 标题 + 一句说明 + 一个演示(不再摆输入素材 → 箭头 → 结果) */

/** 演示框：和 Upscale Image 同一个框(圆角 + 阴影，最宽 640、最高约 52vh,按比例收窄) */
/** 圆角裁切(2026-11-06 修锯齿):外层只管圆角和阴影，内层用 clip-path 圆角裁(抗锯齿比 overflow-hidden 平滑),
    底色只放在内层，圆角边上不会露出一圈黑边 */
export const SMOOTH_CLIP: CSSProperties = { clipPath: "inset(0 round 16px)", WebkitMaskImage: "-webkit-radial-gradient(white, black)", isolation: "isolate" };

export function DemoStage({ ratio, children, className = "" }: { ratio: number; children: ReactNode; className?: string }) {
  return (
    <div className="relative mt-5 w-full rounded-2xl shadow-[0_18px_40px_rgba(26,26,46,0.16)]" style={{ aspectRatio: ratio, maxWidth: `min(640px, calc(52vh * ${ratio}))` }}>
      <div className={`absolute inset-0 overflow-hidden rounded-2xl ${className}`} style={SMOOTH_CLIP}>
        {children}
      </div>
    </div>
  );
}

/** 一条演示视频(默认静音、循环自动播，右上角可开声音);读到视频真实比例后框跟着变 */
export function DemoVideo({ url, ratio: initial = 16 / 9, sound = true }: { url: string; ratio?: number; /** false = 片子没有声音，不显示声音按钮 */ sound?: boolean }) {
  const [ratio, setRatio] = useState(initial);
  const [muted, setMuted] = useState(true);
  return (
    <DemoStage ratio={ratio} className="bg-black">
      {sound && <button
        type="button"
        onClick={() => setMuted((m) => !m)}
        aria-label={muted ? "Turn sound on" : "Turn sound off"}
        aria-pressed={!muted}
        className="absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
      </button>}
      <video
        src={url}
        muted={muted}
        loop
        playsInline
        autoPlay
        onLoadedMetadata={(e) => {
          const v = e.currentTarget;
          if (v.videoWidth && v.videoHeight) setRatio(v.videoWidth / v.videoHeight);
        }}
        className="absolute inset-0 size-full object-cover"
      />
    </DemoStage>
  );
}

/** 两段视频左右对比(拖中间的线看前后):左边 before、右边 after,两段同时播、时间对齐(3D to Video 用) */
export function DemoVideoCompare({ before, after, beforeLabel, afterLabel, ratio }: { before: string; after: string; beforeLabel: string; afterLabel: string; ratio: number }) {
  const [pos, setPos] = useState(50);
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef(false);
  const left = useRef<HTMLVideoElement>(null);
  const right = useRef<HTMLVideoElement>(null);
  const moveTo = (x: number) => {
    const r = box.current?.getBoundingClientRect();
    if (r && r.width > 0) setPos(Math.min(100, Math.max(0, ((x - r.left) / r.width) * 100)));
  };
  /* 两段视频对齐时间，免得左右画面错开 */
  const sync = () => {
    if (left.current && right.current && Math.abs(left.current.currentTime - right.current.currentTime) > 0.08) left.current.currentTime = right.current.currentTime;
  };
  return (
    <div
      ref={box}
      onPointerDown={(e) => {
        drag.current = true;
        e.currentTarget.setPointerCapture?.(e.pointerId);
        moveTo(e.clientX);
      }}
      onPointerMove={(e) => drag.current && moveTo(e.clientX)}
      onPointerUp={() => (drag.current = false)}
      onPointerCancel={() => (drag.current = false)}
      className="relative mt-5 w-full cursor-ew-resize touch-pan-y select-none rounded-2xl shadow-[0_18px_40px_rgba(26,26,46,0.16)]"
      style={{ aspectRatio: ratio, maxWidth: `min(640px, calc(52vh * ${ratio}))` }}
    >
      <div className="absolute inset-0 overflow-hidden rounded-2xl bg-black" style={SMOOTH_CLIP}>
      <video ref={right} src={after} muted loop playsInline autoPlay onTimeUpdate={sync} className="absolute inset-0 size-full object-cover" />
      <video ref={left} src={before} muted loop playsInline autoPlay aria-hidden className="absolute inset-0 size-full object-cover" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }} />
      <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-[#1a1a2e]/70 px-2 py-[3px] text-[11px] font-semibold text-white">{beforeLabel}</span>
      <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-[#1a1a2e]/70 px-2 py-[3px] text-[11px] font-semibold text-white">{afterLabel}</span>
      <span className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_6px_rgba(26,26,46,0.35)]" style={{ left: `${pos}%` }}>
        <span className="absolute left-1/2 top-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-[#1a1a2e] shadow-[0_2px_8px_rgba(26,26,46,0.25)]">
          <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M6 4 2 8l4 4M10 4l4 4-4 4" />
          </svg>
        </span>
      </span>
      <input
        type="range"
        min={0}
        max={100}
        step={0.5}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label={`Compare ${beforeLabel} and ${afterLabel}`}
        className="pointer-events-none absolute inset-0 size-full appearance-none bg-transparent opacity-0"
      />
      </div>
    </div>
  );
}

/** 声音类工具的演示：一张可播放的声音卡 */
export function DemoAudio({ title, note, url }: { title: string; note?: string; url: string }) {
  return (
    <div className="mt-5 w-full max-w-[520px] rounded-2xl bg-[#fff7f1] p-5 text-left shadow-[0_18px_40px_rgba(26,26,46,0.12)]">
      <p className="text-[16px] font-bold text-[#1a1a2e]">{title}</p>
      <audio src={url} controls className="mt-3 w-full" />
      {note && <p className="mt-2 text-[12.5px] text-[#6a6b7b]">{note}</p>}
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
  guide,
  resultCount = 0,
  children,
  tool,
  notify,
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
  /** 工具介绍(首屏演示 + SEO 内容区):传了就在结果区多一个 Guide tab */
  guide?: ReactNode;
  /** 自己的结果有几条：0 时默认停在 Guide,变多(提交了新任务)时自动切回结果 */
  resultCount?: number;
  /** 弹窗等 */
  children?: ReactNode;
  /** 传了 = 团队工作区下结果区分 My Results / Team Results(2026-11-06) */
  tool?: ToolKey;
  notify?: Notify;
}) {
  const tabs = useResultsTabs(tool);
  /* Guide tab(2026-11-10):工具介绍(首屏演示 + SEO 内容区)常驻在结果区的最后一个 tab。
     还没有结果时默认停在 Guide(新访客和搜索引擎第一眼看到的就是它);一提交任务自动切到结果;之后随时点 Guide 回去看。 */
  const [guidePick, setGuidePick] = useState<boolean | null>(null);
  const [seenCount, setSeenCount] = useState(resultCount);
  if (seenCount !== resultCount) {
    setSeenCount(resultCount);
    if (resultCount > seenCount) setGuidePick(false);
  }
  const onGuide = !!guide && (guidePick ?? resultCount === 0);
  const showTabs = tabs.enabled || !!guide;
  /* Guide 首屏自己有 H1(SEO 主关键词),这时左栏标题降成普通文字，一页只留一个 H1 */
  const TitleTag = onGuide ? "p" : "h1";
  return (
    <div className="relative flex h-full min-w-0 flex-1 flex-col">
      <style>{GEN_CSS}</style>
      <ToolsTopBar credits={credits} onMenu={onMenu} onInvite={onInvite} notify={notify} />
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
              <TitleTag className="text-[20px] font-extrabold tracking-tight text-[#1a1a2e]">{title}</TitleTag>
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
          {showTabs ? (
            <div className="shrink-0 px-1 pb-4">
              <ResultsTabs
                tab={onGuide ? "guide" : tabs.tab}
                team={tabs.enabled}
                guide={!!guide}
                onTab={(t) => {
                  setGuidePick(t === "guide");
                  if (t !== "guide") tabs.setTab(t);
                }}
              />
            </div>
          ) : (
            <div className="flex shrink-0 items-baseline justify-between gap-3 px-1 pb-3">
              <h2 className="text-[15px] font-bold text-[#1a1a2e]">{resultsLabel}</h2>
              {resultsMeta}
            </div>
          )}
          <div ref={resultsRef} className={`min-h-0 flex-1 lg:overflow-y-auto lg:pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${onGuide || tabs.tab === "team" ? "hidden" : ""}`}>
            {results}
          </div>
          {/* 不在 Guide 时只是藏起来，内容一直在页面源码里 */}
          {guide && <div className={`min-h-0 flex-1 lg:overflow-y-auto lg:pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${onGuide ? "" : "hidden"}`}>{guide}</div>}
          {!onGuide && tabs.tab === "team" && tool && (
            <div className="min-h-0 flex-1 lg:overflow-y-auto lg:pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <TeamResults tool={tool} notify={notify} />
            </div>
          )}
        </section>
      </div>
      <div className="shrink-0 space-y-2 border-t border-[#ececf1] bg-white/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-6px_20px_rgba(26,26,46,0.06)] backdrop-blur sm:px-6 lg:hidden">
        {action}
      </div>
      {children}
    </div>
  );
}
