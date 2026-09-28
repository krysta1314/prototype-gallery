"use client";

/* 时间线的右键菜单。
   - ClipMenu:画面片段 —— 复制 / 在播放头分割 / 替换素材 / 删除 · AI 生成 ▸ / 变速 ▸ · 导出 ▸
   - PartMenu:字幕、配音、音乐、音效 —— 菜单项由时间线按块的类型给
   画布节点和全屏编辑共用。画布是 CSS 缩放的,fixed 定位会跟着缩放跑偏,所以用 portal 挂到 body 上 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronRight, Copy, Download, Gauge, Replace, Scissors, Sparkles, Trash2 } from "lucide-react";
import { fmt } from "./project";

export const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

/** 页面提供的操作;剪贴板和导出由页面统一管,快捷键也走同一套 */
export type ClipMenuApi = {
  onCopy: (clipId: string) => void;
  /** 在播放头的位置把这一段切成两段 */
  onSplit: (clipId: string) => void;
  /** 换这一段用的素材:打开 Media 面板,点素材上的 Replace */
  onReplace: (clipId: string) => void;
  onDelete: (clipId: string) => void;
  onAiGenerate: (clipId: string) => void;
  onSpeed: (clipId: string, speed: number) => void;
  onExportClip: (clipId: string) => void;
  onExportAll: () => void;
  /** 字幕 / 配音 / 音乐 / 音效的右键「删除」:和工具栏删除、Delete 键走同一个逻辑 */
  onDeletePart: (id: string, part: "sub" | "voice" | "music" | "sfx") => void;
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
  canSplit,
  api,
  onClose,
}: {
  /** 播放头在这一段里面(离两头都够远)才能在这里分割 */
  canSplit: boolean;
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

  /* 子菜单右边放不下就开在左边 */
  const vw = typeof window === "undefined" ? 1440 : window.innerWidth;
  const left = Math.min(x, vw - W - 8);
  const flip = left + W + SUB_W + 8 > vw;
  const vh = typeof window === "undefined" ? 900 : window.innerHeight;
  /* 靠近屏幕底部:子菜单底边对齐,往上展开 */
  const up = Math.min(y, vh - 330) > vh - 320;

  const run = (fn: () => void) => () => {
    fn();
    onClose();
  };
  const isMac = typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);
  const mod = isMac ? "⌘" : "Ctrl+";

  return (
    <MenuShell x={x} y={y} height={330} label="Clip actions" onClose={onClose}>
        <Item icon={Copy} label="Copy" kbd={`${mod}C`} onHover={() => setSub(null)} onClick={run(() => api.onCopy(clipId))} />
        <Item
          icon={Scissors}
          label="Split at playhead"
          hint={canSplit ? undefined : "Move the playhead into this clip first"}
          kbd="S"
          disabled={!canSplit}
          onHover={() => setSub(null)}
          onClick={run(() => api.onSplit(clipId))}
        />
        <Item icon={Replace} label="Replace footage" onHover={() => setSub(null)} onClick={run(() => api.onReplace(clipId))} />
        <Item icon={Trash2} label="Delete" kbd="⌫" onHover={() => setSub(null)} onClick={run(() => api.onDelete(clipId))} />
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
    </MenuShell>
  );
}

export type PartMenuItem =
  | "sep"
  | { icon: React.ComponentType<{ className?: string }>; label: string; hint?: string; kbd?: string; disabled?: boolean; onClick: () => void };

/** 字幕 / 配音 / 音乐 / 音效的右键菜单:样式和画面片段的一样,菜单项由调用方给 */
export function PartMenu({ x, y, label, items, onClose }: { x: number; y: number; label: string; items: PartMenuItem[]; onClose: () => void }) {
  return (
    <MenuShell x={x} y={y} height={items.length * 34 + 8} label={label} onClose={onClose}>
      {items.map((it, i) =>
        it === "sep" ? (
          <Sep key={i} />
        ) : (
          <Item
            key={it.label}
            icon={it.icon}
            label={it.label}
            hint={it.hint}
            kbd={it.kbd}
            disabled={it.disabled}
            onClick={() => {
              it.onClick();
              onClose();
            }}
          />
        ),
      )}
    </MenuShell>
  );
}

/** 菜单外壳:挂到 body、贴边往回收、点外面 / 右键别处 / 滚轮 / Esc / 窗口失焦都关 */
function MenuShell({ x, y, height, label, onClose, children }: { x: number; y: number; height: number; label: string; onClose: () => void; children: React.ReactNode }) {
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

  /* 贴着屏幕边缘时往回收 */
  const vw = typeof window === "undefined" ? 1440 : window.innerWidth;
  const vh = typeof window === "undefined" ? 900 : window.innerHeight;
  const left = Math.min(x, vw - W - 8);
  const top = Math.max(8, Math.min(y, vh - height - 8));
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
        aria-label={label}
        className="fixed z-[301] rounded-xl bg-white p-1 text-[13px] text-[#1a1a2e] shadow-[0_12px_32px_rgba(26,26,46,0.16),0_0_0_1px_rgba(26,26,46,0.07)] motion-safe:animate-[menu-in_120ms_cubic-bezier(0.22,1,0.36,1)]"
        style={{ left, top, width: W, fontFamily: "inherit" }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {children}
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
        {hint && <span className="block text-[12px] leading-snug text-[#6a6b7b]">{hint}</span>}
      </span>
      {kbd && <kbd className="shrink-0 font-sans text-[12px] text-[#6a6b7b]">{kbd}</kbd>}
      {aside && <span className="shrink-0 text-[12px] tabular-nums text-[#6a6b7b]">{aside}</span>}
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
        {value && <span className="text-[12px] tabular-nums text-[#6a6b7b]">{value}</span>}
        <ChevronRight className="size-3.5 shrink-0 text-[#6a6b7b]" />
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
