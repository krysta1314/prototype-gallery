"use client";

import { useMemo, useState } from "react";
import {
  ColorArea,
  ColorField,
  ColorPicker,
  ColorSlider,
  ColorThumb,
  Input as AriaInput,
  Label,
  SliderOutput,
  SliderTrack,
} from "react-aria-components";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Check,
  ChevronDown,
  Trash2,
  TriangleAlert,
  Type,
  Undo2,
  X,
} from "lucide-react";

const APPLE_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif';

const ctaBtn =
  "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full bg-gradient-to-b from-[#ff5255] to-[#ffa73c] px-4 text-[13px] font-bold text-white shadow-[0_2px_0_#b65a42] transition hover:brightness-105 active:translate-y-px active:shadow-none disabled:pointer-events-none disabled:opacity-40";

/* ────────────────────────────────────────────────────────────────
   文字区域模型 —— 真实产品里来自 OCR:每段文字一个包围盒 + 识别出的样式。
   原型里手写成数据,坐标是画布百分比,和画布尺寸解耦。
   ──────────────────────────────────────────────────────────────── */

type Align = "left" | "center" | "right";
type Weight = "light" | "regular" | "bold";

/** 原图宽度(px)。字号用原图坐标系的 px,和画布显示尺寸解耦。 */
const IMAGE_W = 896;
const IMAGE_H = 1200;
const AD_IMAGE = "/prototypes/edit-text/ad.webp";

/** 把原图 px 换成画布百分比 */
const pctW = (px: number) => (px / IMAGE_W) * 100;
const pctH = (px: number) => (px / IMAGE_H) * 100;

/** 字号下拉的可选值,外加每个区域识别出的原始字号 */
const SIZE_OPTIONS = [12, 14, 16, 20, 24, 28, 32, 40, 48, 56, 64, 72, 88, 104];

/** 字体。中英混排的广告图常用这几款,真实产品应由后端给可用字体表。 */
const FONTS = ["Unbounded", "Inter", "Noto Sans SC", "Noto Serif SC", "Playfair Display"];

const WEIGHTS: { id: Weight; label: string; css: number }[] = [
  { id: "light", label: "Light", css: 300 },
  { id: "regular", label: "Regular", css: 600 },
  { id: "bold", label: "Bold", css: 900 },
];

const ALIGNS: { id: Align; label: string; Icon: typeof AlignLeft }[] = [
  { id: "left", label: "Left", Icon: AlignLeft },
  { id: "center", label: "Center", Icon: AlignCenter },
  { id: "right", label: "Right", Icon: AlignRight },
];

type Region = {
  id: string;
  text: string;
  /** 包围盒,画布百分比 —— 全部从 ad.webp 上逐个量出来的 */
  x: number;
  y: number;
  w: number;
  h: number;
  /** OCR 识别出的原始字号,原图 px */
  fontPx: number;
  color: string;
  weight: Weight;
  font: string;
  align: Align;
  /** 白色药丸底的文字(两条卖点与右下角徽标) */
  pill?: boolean;
  /** 文字压在产品包装上 —— 改动等于重画包装,选中时要提示 */
  onPackaging?: boolean;
};

const REGIONS: Region[] = [
  { id: "headline", text: "给它米其林级的爱", x: 11.6, y: 11.5, w: 77.2, h: 6.7, fontPx: 84, color: "#ffffff", weight: "bold", font: "Unbounded", align: "center" },
  { id: "point-1", text: "人食级别食材", x: 64.8, y: 26.8, w: 27.5, h: 5.25, fontPx: 36, color: "#1a1a2e", weight: "regular", font: "Noto Sans SC", align: "center", pill: true },
  { id: "point-2", text: "风干锁鲜工艺", x: 64.8, y: 33.9, w: 27.5, h: 5.2, fontPx: 36, color: "#1a1a2e", weight: "regular", font: "Noto Sans SC", align: "center", pill: true },
  { id: "pack", text: "Human Grade Food for Dogs", x: 65.2, y: 64.0, w: 16.7, h: 5.0, fontPx: 26, color: "#4a2f14", weight: "bold", font: "Playfair Display", align: "center", onPackaging: true },
  { id: "badge", text: "风干肉粮", x: 83.1, y: 93.6, w: 12.9, h: 2.9, fontPx: 20, color: "#1a1a2e", weight: "regular", font: "Noto Sans SC", align: "center", pill: true },
];

type Edit = { text?: string; size?: number; font?: string; color?: string; weight?: Weight; align?: Align; deleted?: boolean };

const EDIT_LABELS: Record<keyof Edit, string> = {
  text: "内容",
  size: "字号",
  font: "字体",
  color: "颜色",
  weight: "字重",
  align: "对齐",
  deleted: "删除",
};

function changedKeys(edit: Edit | undefined): (keyof Edit)[] {
  if (!edit) return [];
  return (Object.keys(edit) as (keyof Edit)[]).filter((k) => edit[k] !== undefined);
}

function merge(region: Region, edit: Edit | undefined) {
  return {
    ...region,
    text: edit?.text ?? region.text,
    color: edit?.color ?? region.color,
    weight: edit?.weight ?? region.weight,
    align: edit?.align ?? region.align,
    font: edit?.font ?? region.font,
    fontPx: edit?.size ?? region.fontPx,
    removed: Boolean(edit?.deleted),
  };
}

/* ── 画布 ──────────────────────────────────────────────────────── */

/** 背景场景占位。接真图时整个换成 <img>,文字区域坐标不用动。 */
function Scene() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[linear-gradient(175deg,#efe7dc_0%,#e6dccd_46%,#d8c7ae_100%)]">
      <div className="absolute -right-[10%] top-0 h-[62%] w-[58%] rotate-[8deg] bg-[linear-gradient(200deg,rgba(255,250,236,0.95),rgba(255,247,230,0))] blur-[2px]" />
      <div className="absolute inset-x-0 bottom-0 h-[42%] bg-[linear-gradient(180deg,#d9bf9c,#c8a87f)]">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="absolute inset-y-0 w-px bg-black/5" style={{ left: `${(i + 1) * 10}%` }} />
        ))}
      </div>
      <div className="absolute bottom-[12%] left-[52%] h-[34%] w-[26%] rounded-[6px] bg-[linear-gradient(160deg,#f5b722,#e08c14)] shadow-[0_18px_30px_rgba(0,0,0,0.22)]">
        <div className="absolute inset-x-0 top-0 h-[10%] rounded-t-[6px] bg-[#c2521f]" />
        <div className="absolute inset-x-[12%] top-[34%] h-[30%] rounded bg-white/85" />
      </div>
      <div className="absolute bottom-[9%] left-[30%] h-[9%] w-[22%] rounded-[999px] bg-[linear-gradient(180deg,#fdfbf7,#e7e0d4)] shadow-[0_10px_18px_rgba(0,0,0,0.18)]" />
      <div className="absolute bottom-[14%] left-[16%] h-[56%] w-[32%] rounded-[999px_999px_38%_38%] bg-[linear-gradient(170deg,#e9cc9c,#c79a5e)] shadow-[0_16px_30px_rgba(0,0,0,0.18)]" />
    </div>
  );
}

/** 画布只呈现原图 —— 改动全部交给后端,前端不做任何预览 */
function Artboard() {
  return (
    <div className="absolute inset-0">
      {/* 占位场景垫在底下 —— ad.webp 没放进 public 时页面不会白掉 */}
      <Scene />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={AD_IMAGE} alt="" className="absolute inset-0 size-full object-cover" />
    </div>
  );
}

/* ── 气泡里的小弹层 ────────────────────────────────────────────── */

function Popover({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute bottom-[calc(100%+8px)] left-1/2 z-20 -translate-x-1/2 rounded-xl border border-[#eceaf0] bg-white p-2 shadow-[0_10px_26px_rgba(26,26,46,0.16)]">
      {children}
    </div>
  );
}

/* ── 页面 ──────────────────────────────────────────────────────── */

export default function EditTextPage() {
  const [edits, setEdits] = useState<Record<string, Edit>>({});
  const [selected, setSelected] = useState<string | null>("headline");
  const [menu, setMenu] = useState<"font" | "size" | "color" | "style" | null>(null);
  const [listOpen, setListOpen] = useState(false);
  /** 字号弹层顶部的自定义输入 —— 预设档位之外,用户可以直接敲一个数 */
  const [customSize, setCustomSize] = useState("");
  /** 字体同理:后端可用字体表之外,允许用户直接敲字体名 */
  const [customFont, setCustomFont] = useState("");
  const [toast, setToast] = useState("");

  const region = REGIONS.find((r) => r.id === selected) ?? null;
  const edit = selected ? edits[selected] : undefined;

  const changeList = useMemo(
    () => REGIONS.map((r) => ({ region: r, keys: changedKeys(edits[r.id]) })).filter(({ keys }) => keys.length > 0),
    [edits],
  );
  const dirty = changeList.length > 0;

  const patch = (key: keyof Edit, value: Edit[keyof Edit]) => {
    if (!selected) return;
    setEdits((prev) => {
      const next = { ...(prev[selected] ?? {}) } as Edit;
      if (next[key] === value) delete next[key];
      else (next as Record<string, unknown>)[key] = value;
      const all = { ...prev, [selected]: next };
      if (changedKeys(next).length === 0) delete all[selected];
      return all;
    });
  };

  const undoRegion = (id: string) =>
    setEdits((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };


  const sizePx = edit?.size ?? region?.fontPx ?? 16;
  /** 下拉里始终包含该区域识别出的原始字号 */
  const sizeChoices = region ? Array.from(new Set([...SIZE_OPTIONS, region.fontPx])).sort((a, b) => a - b) : SIZE_OPTIONS;
  /** 靠画面顶部的文字,气泡翻到下方,否则会飘出画布 */
  const bubbleBelow = region ? region.y < 26 : false;

  return (
    <main className="min-h-screen bg-[#f4f2f5] pb-16" style={{ fontFamily: APPLE_FONT }}>
      {/* 演示控制条 —— 不属于真实产品 UI,故用中文 */}
      <div className="sticky top-0 z-40 flex h-[52px] items-center gap-3 border-b border-white/10 bg-[#141425] px-5 text-[12px] text-white">
        <span className="font-bold tracking-wide">Edit Text · 删除文字与文字属性</span>
        <span className="text-white/35">|</span>
        <span className="text-white/60">
          改动先攒着,Apply 才提交后端;全程没有实时预览
        </span>
        {toast && <span className="ml-auto rounded-full bg-white/15 px-3 py-1 text-white/90">{toast}</span>}
      </div>

      <div className="mx-auto max-w-[760px] px-5 py-6">
        <div className="overflow-hidden rounded-[20px] border border-[#e8e4ec] bg-white shadow-[0_18px_44px_rgba(26,26,46,0.10)]">
          <div className="flex items-center justify-between border-b border-[#f0eef3] px-5 py-3.5">
            <h1 className="text-[15px] font-bold text-[#1a1a2e]">Edit Image</h1>
            <button type="button" className="grid size-8 place-items-center rounded-lg text-[#9a94a0] transition hover:bg-[#f6f4f7]">
              <X className="size-4" />
            </button>
          </div>

          <div className="p-5">
            {/* 顶部常驻工具条 —— 改动计数挪到这里,因为没有右侧属性栏 */}
            <div className="relative z-30 mx-auto mb-4 flex w-fit max-w-full flex-wrap items-center gap-2 rounded-full border border-[#eceaf0] bg-white px-2.5 py-2 shadow-[0_6px_18px_rgba(26,26,46,0.10)]">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff3ec] px-2.5 py-1 text-[12px] font-bold text-[#ff5e1a]">
                <Type className="size-3.5" /> Edit Text
              </span>
              <span className="text-[12px] text-[#b6b1bd]">Click text to edit</span>
              <span className="h-4 w-px bg-[#eceaf0]" />

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setListOpen((v) => !v)}
                      disabled={!dirty}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12.5px] font-semibold transition ${
                        dirty ? "text-[#ff5e1a] hover:bg-[#fff3ec]" : "cursor-default text-[#c9c5d0]"
                      }`}
                    >
                      {changeList.length} change{changeList.length === 1 ? "" : "s"}
                      {dirty && <ChevronDown className={`size-3.5 transition ${listOpen ? "rotate-180" : ""}`} />}
                    </button>
                    {listOpen && dirty && (
                      <div className="absolute left-1/2 top-[calc(100%+10px)] z-40 w-[280px] -translate-x-1/2 rounded-2xl border border-[#eceaf0] bg-white p-2 shadow-[0_14px_34px_rgba(26,26,46,0.16)]">
                        {changeList.map(({ region: r, keys }) => (
                          <div key={r.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[#fafafd]">
                            <button
                              type="button"
                              onClick={() => {
                                setSelected(r.id);
                                setListOpen(false);
                              }}
                              className="min-w-0 flex-1 truncate text-left text-[12.5px] font-semibold text-[#1a1a2e]"
                            >
                              {r.text}
                            </button>
                            <span className="shrink-0 text-[11px] text-[#9a94a0]">{keys.map((k) => EDIT_LABELS[k]).join(" / ")}</span>
                            <button
                              type="button"
                              onClick={() => undoRegion(r.id)}
                              aria-label="Undo"
                              className="grid size-5 shrink-0 place-items-center rounded text-[#b6b1bd] transition hover:text-[#c9432a]"
                            >
                              <Undo2 className="size-3" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            setEdits({});
                            setListOpen(false);
                          }}
                          className="mt-1 w-full rounded-lg py-1.5 text-[12px] font-semibold text-[#9a94a0] transition hover:bg-[#f6f4f7] hover:text-[#c9432a]"
                        >
                          Clear all
                        </button>
                      </div>
                    )}
                  </div>
                  <button type="button" className="rounded-full px-2.5 py-1 text-[12.5px] font-semibold text-[#6a6b7b] transition hover:bg-[#f6f4f7]">
                    Cancel
                  </button>
                  <button type="button" disabled={!dirty} className={ctaBtn}>
                    Apply
                  </button>
            </div>

            {/* 画布 */}
            <div className="relative mx-auto aspect-[3/4] w-full max-w-[560px] overflow-visible">
              <div className="absolute inset-0 overflow-hidden ring-1 ring-[#e8e4ec]">
                <Artboard />
              </div>

              {/* 文字区域的三种状态 —— 放在裁剪容器外,气泡才能溢出画布 */}
              {
                REGIONS.map((r) => {
                  const e = edits[r.id];
                  const keys = changedKeys(e);
                  const isSelected = selected === r.id;
                  const isDeleted = Boolean(e?.deleted);
                  // 选中只是把同色描边加深,不另起白色选中态 —— 白环在照片上很跳
                  const border = isDeleted
                    ? "border-dashed border-[#c9432a] bg-[#c9432a]/10"
                    : keys.length > 0
                      ? isSelected
                        ? "border-[#ff5e1a] bg-[#ff5e1a]/20"
                        : "border-[#ff5e1a]/75 bg-[#ff5e1a]/10"
                      : isSelected
                        ? "border-[#4b7bec] bg-[#4b7bec]/20"
                        : "border-[#4b7bec]/65 bg-[#4b7bec]/10";
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        setSelected(r.id);
                        setMenu(null);
                      }}
                      className={`absolute rounded-[6px] border-2 transition ${border} ${isSelected ? "" : "hover:brightness-110"}`}
                      style={{ left: `${r.x - 0.8}%`, top: `${r.y - 0.6}%`, width: `${r.w + 1.6}%`, height: `${r.h + 1.2}%` }}
                      aria-label={r.text}
                    >
                      {isDeleted && <span className="absolute inset-x-2 top-1/2 h-px bg-[#c9432a]" />}
                      {keys.length > 0 && !isDeleted && (
                        <span className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-[#ff5e1a] text-[10px] font-bold text-white">
                          {keys.length}
                        </span>
                      )}
                      {isDeleted && (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(ev) => {
                            ev.stopPropagation();
                            undoRegion(r.id);
                          }}
                          className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-[#c9432a] text-white"
                        >
                          <Undo2 className="size-3" />
                        </span>
                      )}
                    </button>
                  );
                })}

              {/* ── 气泡:工具条 + 输入框 ─────────────────────────── */}
              {region && (
                <div
                  className="absolute z-30 w-[min(340px,92%)]"
                  style={{
                    left: `${Math.min(Math.max(region.x + region.w / 2, 24), 76)}%`,
                    top: bubbleBelow ? `${region.y + region.h + 1.5}%` : undefined,
                    bottom: bubbleBelow ? undefined : `${100 - region.y + 1.5}%`,
                    transform: "translateX(-50%)",
                  }}
                >
                  <div className="overflow-visible rounded-[16px] border border-[#eceaf0] bg-white shadow-[0_12px_30px_rgba(26,26,46,0.20)]">
                    {edit?.deleted ? (
                      <div className="flex items-center gap-2 px-3 py-2.5">
                        <TriangleAlert className="size-4 shrink-0 text-[#c9432a]" />
                        <span className="min-w-0 flex-1 text-[12.5px] font-semibold text-[#c9432a]">Marked for removal</span>
                        <button
                          type="button"
                          onClick={() => patch("deleted", undefined)}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#e2dfe6] px-2 py-1 text-[12px] font-semibold text-[#6a6b7b] transition hover:border-[#c9c5d0]"
                        >
                          <Undo2 className="size-3" /> Undo
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* 工具条 */}
                        <div className="flex items-center gap-1 border-b border-[#f2f0f5] px-2 py-1.5">
                          {/* 字体 */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setMenu(menu === "font" ? null : "font")}
                              className="flex h-7 w-[92px] items-center gap-0.5 rounded-lg px-1.5 text-[12px] font-semibold text-[#1a1a2e] transition hover:bg-[#f6f4f7]"
                              aria-label="Font"
                            >
                              <span className="min-w-0 flex-1 truncate text-left">{edit?.font ?? region.font}</span>
                              <ChevronDown className="size-3 shrink-0 text-[#9a94a0]" />
                            </button>
                            {menu === "font" && (
                              <Popover>
                                <div className="w-[176px]">
                                  <form
                                    onSubmit={(ev) => {
                                      ev.preventDefault();
                                      const name = customFont.trim();
                                      if (!name) return;
                                      patch("font", name);
                                      setCustomFont("");
                                      setMenu(null);
                                    }}
                                    className="mb-1 flex items-center gap-1 rounded-lg border border-[#e4e1e9] px-1.5 py-1 focus-within:border-[#ff5e1a]"
                                  >
                                    <input
                                      value={customFont}
                                      onChange={(ev) => setCustomFont(ev.target.value)}
                                      placeholder="Custom font"
                                      aria-label="Custom font"
                                      className="w-full min-w-0 bg-transparent text-[12.5px] text-[#1a1a2e] outline-none placeholder:text-[#b6b1bd]"
                                    />
                                    <button
                                      type="submit"
                                      disabled={!customFont.trim()}
                                      aria-label="Use this font"
                                      className="grid size-5 shrink-0 place-items-center rounded text-[#ff5e1a] transition disabled:text-[#d6d2dc]"
                                    >
                                      <Check className="size-3.5" />
                                    </button>
                                  </form>
                                  {/* 用户敲进来的字体不在预设表里,单独列一行,免得看起来没生效 */}
                                  {!FONTS.includes(edit?.font ?? region.font) && (
                                    <button
                                      type="button"
                                      onClick={() => setMenu(null)}
                                      className="flex w-full items-center gap-2 rounded-lg bg-[#f1eff4] px-2 py-1.5 text-left text-[12.5px] font-semibold text-[#1a1a2e]"
                                    >
                                      <span className="min-w-0 flex-1 truncate">{edit?.font ?? region.font}</span>
                                      <Check className="size-3.5 shrink-0 text-[#ff5e1a]" />
                                    </button>
                                  )}
                                  {FONTS.map((f) => {
                                    const active = (edit?.font ?? region.font) === f;
                                    return (
                                      <button
                                        key={f}
                                        type="button"
                                        onClick={() => {
                                          patch("font", f);
                                          setMenu(null);
                                        }}
                                        className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12.5px] transition ${
                                          active ? "bg-[#f1eff4] font-semibold text-[#1a1a2e]" : "text-[#4c4754] hover:bg-[#fafafd]"
                                        }`}
                                      >
                                        <span className="min-w-0 flex-1 truncate">{f}</span>
                                        {active && <Check className="size-3.5 shrink-0 text-[#ff5e1a]" />}
                                      </button>
                                    );
                                  })}
                                </div>
                              </Popover>
                            )}
                          </div>

                          <span className="mx-0.5 h-4 w-px bg-[#eceaf0]" />

                          {/* 字号 */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setMenu(menu === "size" ? null : "size")}
                              className="flex h-7 items-center gap-0.5 rounded-lg px-1.5 text-[12px] font-semibold text-[#1a1a2e] transition hover:bg-[#f6f4f7]"
                              aria-label="Font size"
                            >
                              {sizePx}
                              <ChevronDown className="size-3 text-[#9a94a0]" />
                            </button>
                            {menu === "size" && (
                              <Popover>
                                <div className="w-[104px]">
                                  {/* 自定义输入放最上面:字号最终是要交给 AI 重新生图的参数,不该被预设档位限死 */}
                                  <form
                                    onSubmit={(ev) => {
                                      ev.preventDefault();
                                      const n = Math.round(Number(customSize));
                                      if (!Number.isFinite(n) || n < 8 || n > 400) return;
                                      patch("size", n);
                                      setCustomSize("");
                                      setMenu(null);
                                    }}
                                    className="mb-1 flex items-center gap-1 rounded-lg border border-[#e4e1e9] px-1.5 py-1 focus-within:border-[#ff5e1a]"
                                  >
                                    <input
                                      value={customSize}
                                      onChange={(ev) => setCustomSize(ev.target.value.replace(/[^0-9]/g, ""))}
                                      inputMode="numeric"
                                      placeholder="Custom"
                                      aria-label="Custom font size"
                                      className="w-full min-w-0 bg-transparent text-[12.5px] text-[#1a1a2e] outline-none placeholder:text-[#b6b1bd]"
                                    />
                                    <button
                                      type="submit"
                                      disabled={!customSize}
                                      aria-label="Use this size"
                                      className="grid size-5 shrink-0 place-items-center rounded text-[#ff5e1a] transition disabled:text-[#d6d2dc]"
                                    >
                                      <Check className="size-3.5" />
                                    </button>
                                  </form>
                                  <p className="px-1 pb-1 text-[10.5px] text-[#b6b1bd]">8–400</p>
                                  <div className="max-h-[152px] overflow-y-auto">
                                  {sizeChoices.map((n) => {
                                    const active = sizePx === n;
                                    return (
                                      <button
                                        key={n}
                                        type="button"
                                        onClick={() => {
                                          patch("size", n);
                                          setMenu(null);
                                        }}
                                        className={`flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-[12.5px] transition ${
                                          active ? "bg-[#f1eff4] font-semibold text-[#1a1a2e]" : "text-[#4c4754] hover:bg-[#fafafd]"
                                        }`}
                                      >
                                        <span className="flex-1">{n}</span>
                                        {active && <Check className="size-3.5 shrink-0 text-[#ff5e1a]" />}
                                      </button>
                                    );
                                  })}
                                  </div>
                                </div>
                              </Popover>
                            )}
                          </div>

                          <span className="mx-0.5 h-4 w-px bg-[#eceaf0]" />

                          {/* 颜色 */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setMenu(menu === "color" ? null : "color")}
                              className="grid size-7 place-items-center rounded-lg transition hover:bg-[#f6f4f7]"
                              aria-label="Color"
                            >
                              <span className="size-4 rounded-full ring-1 ring-black/15" style={{ background: edit?.color ?? region.color }} />
                            </button>
                            {menu === "color" && (
                              <Popover>
                                {/* React Aria ColorPicker —— 版式对齐官方示例 */}
                                <ColorPicker
                                  value={edit?.color ?? region.color}
                                  onChange={(c) => patch("color", c.toString("hex"))}
                                >
                                  <div className="w-[188px]">
                                    <ColorArea
                                      colorSpace="hsb"
                                      xChannel="saturation"
                                      yChannel="brightness"
                                      className="h-[176px] w-full rounded-lg"
                                    >
                                      <ColorThumb className="size-4 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.3)]" />
                                    </ColorArea>

                                    <ColorSlider colorSpace="hsb" channel="hue" className="mt-3">
                                      <div className="flex items-center justify-between text-[11.5px] text-[#6a6b7b]">
                                        <Label>Hue</Label>
                                        <SliderOutput />
                                      </div>
                                      <SliderTrack className="mt-1 h-3.5 rounded-full">
                                        <ColorThumb className="top-1/2 size-4 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.3)]" />
                                      </SliderTrack>
                                    </ColorSlider>

                                    <ColorField className="mt-3 block">
                                      <Label className="text-[11.5px] text-[#6a6b7b]">Hex</Label>
                                      <AriaInput className="mt-1 w-full rounded-lg border border-[#e4e1e9] px-2 py-1.5 text-[12.5px] uppercase text-[#1a1a2e] outline-none transition focus:border-[#ff5e1a]" />
                                    </ColorField>
                                  </div>
                                </ColorPicker>
                              </Popover>
                            )}
                          </div>

                          {/* 字重 + 对齐 收在一个弹层里,否则一行放不下 */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setMenu(menu === "style" ? null : "style")}
                              className="flex h-7 items-center gap-0.5 rounded-lg px-1.5 text-[12px] font-bold text-[#6a6b7b] transition hover:bg-[#f6f4f7]"
                              aria-label="Text style"
                            >
                              Aa <ChevronDown className="size-3" />
                            </button>
                            {menu === "style" && (
                              <Popover>
                                <div className="w-[196px]">
                                  <p className="px-1 pb-1 text-[11px] text-[#9a94a0]">Weight</p>
                                  <div className="grid grid-cols-3 rounded-lg bg-[#f1eff4] p-0.5">
                                    {WEIGHTS.map(({ id, label }) => (
                                      <button
                                        key={id}
                                        type="button"
                                        onClick={() => patch("weight", id)}
                                        className={`rounded-md py-1 text-[11.5px] font-semibold transition ${
                                          (edit?.weight ?? region.weight) === id ? "bg-white text-[#1a1a2e] shadow-sm" : "text-[#a8a2b0]"
                                        }`}
                                      >
                                        {label}
                                      </button>
                                    ))}
                                  </div>
                                  <p className="px-1 pb-1 pt-2 text-[11px] text-[#9a94a0]">Alignment</p>
                                  <div className="grid grid-cols-3 rounded-lg bg-[#f1eff4] p-0.5">
                                    {ALIGNS.map(({ id, label, Icon }) => (
                                      <button
                                        key={id}
                                        type="button"
                                        onClick={() => patch("align", id)}
                                        aria-label={label}
                                        className={`grid place-items-center rounded-md py-1 transition ${
                                          (edit?.align ?? region.align) === id ? "bg-white text-[#1a1a2e] shadow-sm" : "text-[#a8a2b0]"
                                        }`}
                                      >
                                        <Icon className="size-3.5" />
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </Popover>
                            )}
                          </div>

                          <span className="mx-0.5 h-4 w-px bg-[#eceaf0]" />

                          {/* 删除 */}
                          <button
                            type="button"
                            onClick={() => patch("deleted", true)}
                            className="grid size-7 place-items-center rounded-lg text-[#c9432a] transition hover:bg-[#fff3ee]"
                            aria-label="Remove this text"
                            title="Remove this text"
                          >
                            <Trash2 className="size-3.5" />
                          </button>

                          {changedKeys(edit).length > 0 && (
                            <button
                              type="button"
                              onClick={() => undoRegion(region.id)}
                              className="ml-auto inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-[11.5px] font-semibold text-[#9a94a0] transition hover:bg-[#f6f4f7]"
                            >
                              <Undo2 className="size-3" /> Reset
                            </button>
                          )}
                        </div>

                        {/* 原有的输入框那一行 */}
                        <div className="flex items-center gap-2 px-2.5 py-2">
                          <input
                            value={edit?.text ?? region.text}
                            onChange={(e) => patch("text", e.target.value)}
                            className="min-w-0 flex-1 bg-transparent text-[13.5px] text-[#1a1a2e] outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setSelected(null)}
                            className="grid size-7 shrink-0 place-items-center rounded-full bg-[#ffd9c6] text-[#c2521f] transition hover:brightness-105"
                            aria-label="Done"
                          >
                            <Check className="size-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {region.onPackaging && !edit?.deleted && (
                    <p className="mt-1.5 flex gap-1.5 rounded-lg bg-[#c9432a] px-2.5 py-1.5 text-[11px] leading-[16px] text-white shadow-lg">
                      <TriangleAlert className="mt-px size-3 shrink-0" />
                      This text is printed on the package — editing it may alter the packaging.
                    </p>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </main>
  );
}
