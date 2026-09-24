"use client";

/* 时间线片段的右键菜单:复制(直接在后面复制出一段)/ AI 生成 ▸ / 变速 ▸ / 导出 ▸。
   画布节点和全屏编辑共用。画布是 CSS 缩放的,fixed 定位会跟着缩放跑偏,所以用 portal 挂到 body 上 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronRight, Copy, Download, Gauge, Sparkles } from "lucide-react";
import { fmt } from "./project";

export const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

/** 页面提供的操作;剪贴板和导出由页面统一管,快捷键也走同一套 */
export type ClipMenuApi = {
  onCopy: (clipId: string) => void;
  onAiGenerate: (clipId: string) => void;
  onSpeed: (clipId: string, speed: number) => void;
  onExportClip: (clipId: string) => void;
  onExportAll: () => void;
};

const W = 216;
const SUB_W = 248;

export function ClipMenu({
  x,
  y,
  clipId,
  speed,
  range,
  total,
  canReference,
  api,
  onClose,
}: {
  x: number;
  y: number;
  clipId: string;
  speed: number;
  /** 这一段在成片里的起止秒数 */
  range: [number, number];
  total: number;
  /** 这一段有没有可用的画面(未生成的 AI 镜头不能当参考) */
  canReference: boolean;
  api: ClipMenuApi;
  onClose: () => void;
}) {
  const [sub, setSub] = useState<"ai" | "speed" | "export" | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const onBlur = () => onClose();
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onBlur);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onBlur);
      window.removeEventListener("blur", onBlur);
    };
  }, [onClose]);

  /* 贴着屏幕边缘时往回收;子菜单右边放不下就开在左边 */
  const vw = typeof window === "undefined" ? 1440 : window.innerWidth;
  const vh = typeof window === "undefined" ? 900 : window.innerHeight;
  const left = Math.min(x, vw - W - 8);
  const top = Math.min(y, vh - 230);
  const flip = left + W + SUB_W + 8 > vw;
  /* 靠近屏幕底部:子菜单底边对齐,往上展开 */
  const up = top > vh - 320;

  const run = (fn: () => void) => () => {
    fn();
    onClose();
  };
  const isMac = typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);
  const mod = isMac ? "⌘" : "Ctrl+";

  return createPortal(
    <>
      {/* 点菜单外任何地方都关掉;右键别处也是 */}
      <div
        className="fixed inset-0 z-[300]"
        onPointerDown={onClose}
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
        onWheel={onClose}
      />
      <div
        role="menu"
        aria-label="Clip actions"
        className="fixed z-[301] rounded-xl bg-white p-1 text-[13px] text-[#1a1a2e] shadow-[0_12px_32px_rgba(26,26,46,0.16),0_0_0_1px_rgba(26,26,46,0.07)] motion-safe:animate-[menu-in_120ms_cubic-bezier(0.22,1,0.36,1)]"
        style={{ left, top, width: W, fontFamily: "inherit" }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <Item icon={Copy} label="Copy" kbd={`${mod}C`} onHover={() => setSub(null)} onClick={run(() => api.onCopy(clipId))} />
        <Sep />
        <SubItem icon={Sparkles} label="AI generate" open={sub === "ai"} onOpen={() => setSub("ai")} flip={flip} up={up}>
          <Item
            label="Generate video from this clip"
            hint={canReference ? "Uses this clip as the reference" : "Generate this AI shot first"}
            disabled={!canReference}
            onClick={run(() => api.onAiGenerate(clipId))}
          />
        </SubItem>
        <SubItem icon={Gauge} label="Speed" value={`${speed}×`} open={sub === "speed"} onOpen={() => setSub("speed")} flip={flip} up={up} width={148}>
          {SPEEDS.map((s) => (
            <Item
              key={s}
              label={`${s}×`}
              checked={s === speed}
              onClick={run(() => api.onSpeed(clipId, s))}
            />
          ))}
        </SubItem>
        <Sep />
        <SubItem icon={Download} label="Export" open={sub === "export"} onOpen={() => setSub("export")} flip={flip} up={up}>
          <Item label="Export selected clip" aside={`${fmt(range[0])} – ${fmt(range[1])}`} onClick={run(() => api.onExportClip(clipId))} />
          <Item label="Export full video" aside={`00:00 – ${fmt(total)}`} onClick={run(api.onExportAll)} />
        </SubItem>
      </div>
      <style>{`@keyframes menu-in{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:none}}`}</style>
    </>,
    document.body,
  );
}

function Sep() {
  return <div role="separator" className="mx-2 my-1 h-px bg-[#eceef2]" />;
}

function Item({
  icon: Icon,
  label,
  hint,
  kbd,
  aside,
  checked,
  disabled,
  onClick,
  onHover,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  hint?: string;
  kbd?: string;
  aside?: string;
  checked?: boolean;
  disabled?: boolean;
  onClick: () => void;
  onHover?: () => void;
}) {
  return (
    <button
      type="button"
      role={checked === undefined ? "menuitem" : "menuitemradio"}
      aria-checked={checked}
      disabled={disabled}
      onClick={onClick}
      onPointerEnter={onHover}
      className="flex min-h-8 w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-[#f3f4f6] focus-visible:bg-[#f3f4f6] focus-visible:outline-none disabled:pointer-events-none disabled:text-[#b4b5c2]"
    >
      {Icon && <Icon className="size-4 shrink-0 text-[#6a6b7b]" />}
      {checked !== undefined && (
        <Check className={`size-3.5 shrink-0 text-[#ff5e1a] ${checked ? "" : "invisible"}`} strokeWidth={2.5} />
      )}
      <span className="min-w-0 flex-1">
        <span className={`block ${checked ? "font-semibold" : ""}`}>{label}</span>
        {hint && <span className="block text-[11.5px] leading-snug text-[#9a9bb0]">{hint}</span>}
      </span>
      {kbd && <kbd className="shrink-0 font-sans text-[11.5px] text-[#9a9bb0]">{kbd}</kbd>}
      {aside && <span className="shrink-0 text-[11.5px] tabular-nums text-[#9a9bb0]">{aside}</span>}
    </button>
  );
}

function SubItem({
  icon: Icon,
  label,
  value,
  open,
  onOpen,
  flip,
  up,
  width = SUB_W,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string;
  open: boolean;
  onOpen: () => void;
  flip: boolean;
  up: boolean;
  width?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="relative" onPointerEnter={onOpen}>
      <button
        type="button"
        role="menuitem"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={onOpen}
        className={`flex h-8 w-full items-center gap-2.5 rounded-lg px-2.5 text-left transition-colors hover:bg-[#f3f4f6] focus-visible:outline-none ${open ? "bg-[#f3f4f6]" : ""}`}
      >
        <Icon className="size-4 shrink-0 text-[#6a6b7b]" />
        <span className="flex-1">{label}</span>
        {value && <span className="text-[11.5px] tabular-nums text-[#9a9bb0]">{value}</span>}
        <ChevronRight className="size-3.5 shrink-0 text-[#9a9bb0]" />
      </button>
      {open && (
        <div
          role="menu"
          aria-label={label}
          className={`absolute ${up ? "-bottom-1" : "-top-1"} rounded-xl bg-white p-1 shadow-[0_12px_32px_rgba(26,26,46,0.16),0_0_0_1px_rgba(26,26,46,0.07)]`}
          style={{ width, ...(flip ? { right: "calc(100% + 6px)" } : { left: "calc(100% + 6px)" }) }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
