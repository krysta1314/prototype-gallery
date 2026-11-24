"use client";

/* 画布渲染：一页 = 品牌底色 + 按百分比摆放的图层。缩略图、编辑器、Present 共用。
   字号用 cqw(画布宽度的百分比),所以缩略图和大画布同一份数据。
   编辑时：点选图层、拖动(锁定的不能拖)、双击文字直接改。 */

import { useRef, type PointerEvent as RPointerEvent } from "react";
import { Lock, Sparkles } from "lucide-react";
import { color, type BrandKit, type Layer, type Page } from "../data";

const CHECKER = "repeating-conic-gradient(#ececf1 0% 25%, #ffffff 0% 50%) 50% / 14px 14px";

function LayerView({ l, kit }: { l: Layer; kit: BrandKit | undefined }) {
  if (l.kind === "image")
    return (
      <div className="relative size-full overflow-hidden" style={{ borderRadius: `${l.radius ?? 0}cqw`, background: l.bgRemoved ? (l.fill ?? color(kit, "primary")) : undefined }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={l.src}
          alt=""
          draggable={false}
          className={`size-full ${l.bgRemoved ? "object-contain object-bottom" : "object-cover"}`}
          /* 去背景演示：主体保留，背景淡出成品牌色(HTML:AI image · background removed) */
          style={l.bgRemoved ? { WebkitMaskImage: "radial-gradient(ellipse 34% 62% at 50% 62%, #000 70%, transparent 82%)", maskImage: "radial-gradient(ellipse 34% 62% at 50% 62%, #000 70%, transparent 82%)" } : undefined}
        />
        {l.bgRemoved && <span className="absolute left-[2.5cqw] top-[2.2cqw] text-[2.3cqw] text-white/75">AI image · background removed</span>}
      </div>
    );
  if (l.kind === "text")
    return (
      <p
        className={`whitespace-pre-line leading-[1.15] ${l.fill ? "flex size-full items-center justify-center rounded-full" : "size-full"}`}
        style={{ fontSize: `${l.size ?? 4}cqw`, fontWeight: l.weight ?? 600, color: l.color ?? "#1a1a2e", textAlign: l.align ?? "left", background: l.fill }}
      >
        {l.text}
      </p>
    );
  if (l.kind === "shape")
    return (
      <div
        className={`size-full ${l.shape === "circle" ? "rounded-full" : l.shape === "triangle" ? "" : "rounded-[0.4cqw]"}`}
        style={{ background: l.fill ?? l.color ?? color(kit, "accent"), clipPath: l.shape === "triangle" ? "polygon(50% 0, 100% 100%, 0 100%)" : undefined }}
      />
    );
  /* logo = 品牌字标(BUSINESSFOCUS);混用了别的品牌时显示那个品牌的字标 */
  const word = l.foreignBrand ? l.foreignBrand.toUpperCase() : (kit?.word ?? "YOUR LOGO");
  return (
    <div className="flex size-full items-center">
      <span className="truncate font-bold tracking-[0.04em]" style={{ fontSize: "3.3cqw", color: l.foreignBrand ? "#7A1F3D" : color(kit, "primary") }}>
        {word}
      </span>
    </div>
  );
}

export function DesignCanvas({
  page,
  ratio,
  kit,
  selected,
  onSelect,
  onChange,
  editable = false,
  safe,
  className = "",
  issues,
}: {
  page: Page;
  ratio: number;
  kit: BrandKit | undefined;
  selected?: string | null;
  onSelect?: (id: string | null) => void;
  onChange?: (id: string, patch: Partial<Layer>) => void;
  editable?: boolean;
  /** 平台安全区(上 / 下百分比) */
  safe?: { top: number; bottom: number };
  className?: string;
  /** Brand Check 标出来的图层 */
  issues?: Set<string>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; x: number; y: number; ox: number; oy: number; moved: boolean } | null>(null);

  const down = (e: RPointerEvent, l: Layer) => {
    if (!editable) return;
    e.stopPropagation();
    onSelect?.(l.id);
    if (l.lock) return;
    try {
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {
      /* 没有活动指针(合成事件)就不抓 */
    }
    drag.current = { id: l.id, x: e.clientX, y: e.clientY, ox: l.x, oy: l.y, moved: false };
  };
  const move = (e: RPointerEvent) => {
    const d = drag.current;
    const box = ref.current?.getBoundingClientRect();
    if (!d || !box) return;
    const dx = ((e.clientX - d.x) / box.width) * 100;
    const dy = ((e.clientY - d.y) / box.height) * 100;
    if (Math.abs(dx) + Math.abs(dy) < 0.4 && !d.moved) return;
    d.moved = true;
    onChange?.(d.id, { x: Math.round((d.ox + dx) * 10) / 10, y: Math.round((d.oy + dy) * 10) / 10 });
  };
  const up = () => {
    drag.current = null;
  };

  return (
    <div
      ref={ref}
      onPointerDown={() => editable && onSelect?.(null)}
      onPointerMove={move}
      onPointerUp={up}
      className={`relative w-full select-none overflow-hidden [container-type:inline-size] ${className}`}
      style={{ aspectRatio: String(ratio), background: page.bg || CHECKER }}
    >
      {page.layers.map((l) => {
        const on = editable && selected === l.id;
        const editText = on && l.kind === "text" && l.lock !== "all";
        return (
          <div
            key={l.id}
            onPointerDown={(e) => down(e, l)}
            className={`absolute ${editable ? (l.lock ? "cursor-pointer" : "cursor-move") : ""}`}
            style={{ left: `${l.x}%`, top: `${l.y}%`, width: `${l.w}%`, height: `${l.h}%` }}
          >
            {editText ? (
              <p
                contentEditable
                suppressContentEditableWarning
                onPointerDown={(e) => e.stopPropagation()}
                onBlur={(e) => {
                  const t = e.currentTarget.innerText;
                  if (t !== l.text) onChange?.(l.id, { text: t });
                }}
                className={`size-full cursor-text whitespace-pre-line leading-[1.15] outline-none ${l.fill ? "flex items-center justify-center rounded-full" : ""}`}
                style={{ fontSize: `${l.size ?? 4}cqw`, fontWeight: l.weight ?? 600, color: l.color ?? "#1a1a2e", textAlign: l.align ?? "left", background: l.fill }}
              >
                {l.text}
              </p>
            ) : (
              <LayerView l={l} kit={kit} />
            )}
            {editable && (on || issues?.has(l.id)) && (
              /* 选中框照 HTML:细描边 + 四角白色方块手柄;Brand Check 有问题的标红 */
              <span className={`pointer-events-none absolute -inset-[4px] border-[1.5px] ${issues?.has(l.id) ? "border-[#e5484d]" : l.lock ? "border-[#1a1a2e]/60" : "border-[#ff5e1a]"}`}>
                {on && !l.lock && ["-left-[5px] -top-[5px]", "-right-[5px] -top-[5px]", "-bottom-[5px] -left-[5px]", "-bottom-[5px] -right-[5px]"].map((p) => (
                  <span key={p} className={`absolute size-2 rounded-[2px] border-[1.5px] border-[#ff5e1a] bg-white ${p}`} />
                ))}
              </span>
            )}
            {editable && on && l.lock && (
              <span className="pointer-events-none absolute -top-6 left-0 inline-flex items-center gap-1 whitespace-nowrap rounded-md bg-[#1a1a2e] px-1.5 py-0.5 text-[10.5px] font-semibold text-white">
                <Lock className="size-2.5" /> {l.lock === "all" ? "Locked" : "Content only"}
              </span>
            )}
            {editable && l.ai && l.kind === "image" && !l.bgRemoved && (
              <span className="pointer-events-none absolute bottom-[3%] left-[3%] inline-flex items-center gap-0.5 rounded-full bg-black/45 px-1.5 py-0.5 text-[9.5px] font-semibold text-white backdrop-blur">
                <Sparkles className="size-2.5" /> AI
              </span>
            )}
          </div>
        );
      })}
      {safe && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 bg-[#2f6fed]/15" style={{ height: `${safe.top}%` }}>
            <span className="absolute bottom-1 left-2 text-[10px] font-semibold text-[#2f6fed]">Platform UI · keep clear</span>
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-[#2f6fed]/15" style={{ height: `${safe.bottom}%` }} />
        </>
      )}
    </div>
  );
}
