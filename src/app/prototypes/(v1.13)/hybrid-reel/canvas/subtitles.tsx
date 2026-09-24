"use client";

/* 字幕预设样式。
   依据 2026 年短视频字幕的调研:粗无衬线(Anton / Montserrat);白字黑描边、黄字黑描边、黄字黑底最通用;
   一定要有描边或阴影。这一版只放静态样式;逐词动态(卡拉 OK 高亮 / 逐词弹出)的渲染能力留着,之后再上。
   预览区右上角的浮动工具条点「Presets」弹出样式网格,选中即应用到全片字幕。 */

import { useState } from "react";
import type { CSSProperties } from "react";
import { Anton, Montserrat, Poppins } from "next/font/google";
import { Ban, Check, X } from "lucide-react";
import type { Project } from "./project";
import type { EditApi } from "./timeline";

const anton = Anton({ weight: "400", subsets: ["latin"], display: "swap" });
const montserrat = Montserrat({ weight: ["700", "800", "900"], subsets: ["latin"], display: "swap" });
const poppins = Poppins({ weight: ["600", "700"], subsets: ["latin"], display: "swap" });

/* 英文字体没有中文字形,中文回退到系统字体;关掉字重合成,让 Anton 保持原样、中文用最粗的系统字重 */
const CJK = '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';
const family = (f: string): CSSProperties => ({ fontFamily: `${f}, ${CJK}`, fontSynthesis: "none" });

/** 8 个方向的 text-shadow 拼出描边,各浏览器都稳 */
const outline = (c: string, w = 2) =>
  [
    [w, 0],
    [-w, 0],
    [0, w],
    [0, -w],
    [w, w],
    [-w, -w],
    [w, -w],
    [-w, w],
  ]
    .map(([x, y]) => `${x}px ${y}px 0 ${c}`)
    .join(", ");

const BOX: CSSProperties = { padding: "0.12em 0.45em", borderRadius: "0.28em" };

type Mode = "static" | "karaoke" | "pop";

export type SubtitlePreset = {
  id: string;
  name: string;
  mode: Mode;
  /** 英文转大写(中文不受影响) */
  upper?: boolean;
  /** 每个词的样式 */
  base: CSSProperties;
  /** 当前说到的词(karaoke / pop) */
  active?: CSSProperties;
  /** 整行的底框 */
  line?: CSSProperties;
  /** pop:一次显示几个词 */
  group?: number;
};

/* Monica 从调研样式里选定的 13 种静态样式(逐词高亮 / 弹出的渲染能力保留在 SubtitleText 里,之后做动态字幕再加回来) */
export const SUBTITLE_PRESETS: SubtitlePreset[] = [
  { id: "none", name: "None", mode: "static", base: { color: "#fff", fontWeight: 700, textShadow: "0 2px 8px rgba(0,0,0,0.85)" } },
  {
    id: "classic",
    name: "Classic",
    mode: "static",
    base: { ...family(montserrat.style.fontFamily), fontWeight: 800, color: "#fff", textShadow: outline("#000", 2) },
  },
  {
    id: "yellow-outline",
    name: "Yellow",
    mode: "static",
    base: { ...family(montserrat.style.fontFamily), fontWeight: 800, color: "#ffe500", textShadow: outline("#000", 2) },
  },
  {
    id: "bold-caps",
    name: "Bold caps",
    mode: "static",
    upper: true,
    base: { ...family(anton.style.fontFamily), fontWeight: 900, color: "#fff", textShadow: `${outline("#000", 1.5)}, 0 4px 8px rgba(0,0,0,0.55)` },
  },
  {
    id: "black-box",
    name: "Black box",
    mode: "static",
    base: { ...family(montserrat.style.fontFamily), fontWeight: 800, color: "#fff" },
    line: { ...BOX, background: "#000" },
  },
  {
    id: "white-box",
    name: "White box",
    mode: "static",
    base: { ...family(montserrat.style.fontFamily), fontWeight: 800, color: "#111" },
    line: { ...BOX, background: "#fff", borderRadius: "0.2em" },
  },
  {
    id: "most-readable",
    name: "Most readable",
    mode: "static",
    base: { ...family(montserrat.style.fontFamily), fontWeight: 800, color: "#ffe500" },
    line: { ...BOX, background: "#000", borderRadius: "0.16em" },
  },
  {
    id: "highlighter",
    name: "Highlighter",
    mode: "static",
    base: { ...family(montserrat.style.fontFamily), fontWeight: 800, color: "#111" },
    line: { padding: "0.08em 0.35em", background: "#ffd400" },
  },
  {
    id: "glow",
    name: "Glow",
    mode: "static",
    base: { ...family(poppins.style.fontFamily), fontWeight: 700, color: "#fff", textShadow: "0 0 6px #ff4fd8, 0 0 14px #ff4fd8, 0 0 26px #ff4fd8" },
  },
  {
    id: "pop-blue",
    name: "Pop blue",
    mode: "static",
    base: { ...family(montserrat.style.fontFamily), fontWeight: 900, color: "#4d6bff", textShadow: `${outline("#0b1a8c", 1.5)}, 3px 3px 0 #0b1a8c` },
  },
  {
    id: "heavy",
    name: "Heavy",
    mode: "static",
    base: { ...family(montserrat.style.fontFamily), fontWeight: 900, color: "#fff", textShadow: outline("#000", 3) },
  },
  {
    id: "neon",
    name: "Neon",
    mode: "static",
    base: { ...family(montserrat.style.fontFamily), fontWeight: 800, color: "#7df0c0" },
    line: { ...BOX, background: "#0b0b0f" },
  },
  {
    id: "pink-glow",
    name: "Pink glow",
    mode: "static",
    base: { ...family(montserrat.style.fontFamily), fontWeight: 900, color: "#ff5c9a", textShadow: `${outline("#fff", 1.5)}, 0 0 10px #ff5c9a` },
  },
];

/* 旧工程里存的样式 id → 新预设 */
const LEGACY: Record<string, string> = {
  "1": "none",
  "2": "black-box",
  "3": "black-box",
  /* 这次没选中的样式 → 最接近的保留样式 */
  sticker: "heavy",
  cartoon: "bold-caps",
  "subtitle-block": "black-box",
  "brand-block": "black-box",
  minimal: "none",
  elegant: "none",
  /* 上一版的动态样式 */
  hormozi: "bold-caps",
  "word-pop": "bold-caps",
  beast: "heavy",
  karaoke: "classic",
  "box-highlight": "classic",
  /* 最早一版 */
  "purple-box": "black-box",
  "yellow-box": "highlighter",
  "blue-3d": "pop-blue",
  "neon-box": "neon",
  "green-drop": "classic",
  sunset: "yellow-outline",
  buzz: "black-box",
};

export function subtitlePreset(id: string | number | undefined): SubtitlePreset {
  const key = LEGACY[String(id)] ?? String(id ?? "none");
  return SUBTITLE_PRESETS.find((p) => p.id === key) ?? SUBTITLE_PRESETS[0];
}

/* ── 分词:英文按空格;中文用 Intl.Segmenter 按词切,标点并到前一个词上 ── */
type Token = { t: string; space: boolean };
function tokenize(text: string): Token[] {
  const clean = text.trim();
  if (!clean) return [];
  if (/\s/.test(clean)) return clean.split(/\s+/).map((t) => ({ t, space: true }));
  let parts: string[];
  try {
    parts = [...new Intl.Segmenter("zh", { granularity: "word" }).segment(clean)].map((s) => s.segment);
  } catch {
    parts = clean.match(/.{1,2}/gu) ?? [clean];
  }
  const out: Token[] = [];
  for (const p of parts) {
    if (/^[\p{P}\s]+$/u.test(p) && out.length) out[out.length - 1].t += p;
    else out.push({ t: p, space: false });
  }
  return out;
}

/** 按预设渲染一行字幕;progress = 这句字幕播到哪了(0–1),决定逐词高亮 / 弹出到哪个词 */
export function SubtitleText({
  text,
  preset,
  progress,
  className = "",
  fallbackBox = false,
}: {
  text: string;
  preset: SubtitlePreset;
  progress: number;
  className?: string;
  /** 画面还是空的(未生成 / 缺素材)时,无底框的样式看不清,临时加一层暗底 */
  fallbackBox?: boolean;
}) {
  const shown = preset.upper ? text.toUpperCase() : text;
  const line: CSSProperties = {
    ...(preset.line ?? (fallbackBox ? { ...BOX, background: "rgba(0,0,0,0.62)" } : {})),
    boxDecorationBreak: "clone",
    WebkitBoxDecorationBreak: "clone",
  };
  if (preset.mode === "static") {
    return (
      <span className={`inline leading-snug ${className}`} style={{ ...preset.base, ...line }}>
        {shown}
      </span>
    );
  }
  const tokens = tokenize(shown);
  const active = Math.min(tokens.length - 1, Math.max(0, Math.floor(progress * tokens.length)));
  let list = tokens.map((tok, i) => ({ ...tok, i }));
  if (preset.mode === "pop") {
    const g = preset.group ?? 2;
    const start = Math.floor(active / g) * g;
    list = list.slice(start, start + g);
  }
  return (
    <span className={`inline leading-snug ${className}`} style={line}>
      {list.map(({ t, space, i }) => (
        <span key={i}>
          <span
            className="inline-block transition-[transform,color,background-color] duration-150"
            style={{ ...preset.base, ...(i === active ? preset.active : null) }}
          >
            {t}
          </span>
          {space && " "}
        </span>
      ))}
    </span>
  );
}

/* ── 样式卡片 ── */
export function PresetGrid({
  value,
  onPick,
  compact = false,
}: {
  value: string | number | undefined;
  onPick: (id: string) => void;
  compact?: boolean;
}) {
  const current = subtitlePreset(value).id;
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {SUBTITLE_PRESETS.map((p) => {
        const on = p.id === current;
        return (
          <button
            key={p.id}
            type="button"
            aria-label={p.name}
            aria-pressed={on}
            onClick={() => onPick(p.id)}
            className={`relative flex flex-col items-center justify-center gap-1.5 overflow-hidden rounded-xl bg-[linear-gradient(160deg,#5b6673_0%,#2a3039_100%)] transition ${
              compact ? "h-[68px]" : "h-[84px]"
            } ${on ? "ring-2 ring-[#ff5e1a] ring-offset-2" : "hover:brightness-110"}`}
          >
            {p.id === "none" ? (
              <Ban className="size-5 text-white/70" />
            ) : (
              <SubtitleText text="Text" preset={p} progress={0} className={compact ? "text-[14px]" : "text-[17px]"} />
            )}
            <span className="text-[10.5px] font-medium text-white/65">{p.name}</span>
            {on && (
              <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-[#ff5e1a] text-white">
                <Check className="size-2.5" strokeWidth={3.5} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* 参考产品的「预设」图标:圆角方框右下角一颗星 */
function PresetIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M13 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7" />
      <path d="m18 15.5.9 1.9 2.1.3-1.5 1.5.35 2.1L18 20.3l-1.85.99.35-2.1L15 17.7l2.1-.3z" fill="currentColor" strokeWidth={1} />
    </svg>
  );
}

/* ── 预览区右上角的浮动工具条 + 预设面板 ── */
export function PresetsDock({ project, edit }: { project: Project; edit: EditApi }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="absolute right-3 top-3 z-20 rounded-2xl bg-white p-1 shadow-[0_4px_16px_rgba(26,26,46,0.10)]" data-nodrag>
        <button
            type="button"
            aria-label="Subtitle presets"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className={`flex w-[60px] flex-col items-center gap-1 rounded-xl px-1 py-2 text-center text-[11px] font-medium leading-tight transition ${
              open ? "bg-[#fff3ec] text-[#ff5e1a]" : "text-[#4a4b5c] hover:bg-[#f3f4f6] hover:text-[#1a1a2e]"
            }`}
          >
            <PresetIcon />
            Subtitle styles
          </button>
      </div>

      {open && (
        <div
          role="dialog"
          aria-label="Subtitle presets"
          data-nodrag
          onWheel={(e) => e.stopPropagation()}
          className="absolute bottom-3 right-[88px] top-3 z-20 flex w-[288px] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_12px_32px_rgba(26,26,46,0.16)]"
        >
          <div className="flex items-center px-4 pb-1 pt-3.5">
            <h3 className="text-[15px] font-bold text-[#1a1a2e]">Subtitle styles</h3>
            <button
              type="button"
              aria-label="Close presets"
              onClick={() => setOpen(false)}
              className="ml-auto grid size-7 place-items-center rounded-lg text-[#6a6b7b] transition hover:bg-[#f3f4f6]"
            >
              <X className="size-4" />
            </button>
          </div>
          <p className="px-4 pb-2.5 text-[11.5px] text-[#9a9bb0]">Applies to every subtitle in the reel.</p>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-1 [scrollbar-width:thin] [scrollbar-color:#d9dae2_transparent]">
            <PresetGrid value={project.subtitleStyle} onPick={(id) => edit.commit((p) => ({ ...p, subtitleStyle: id }))} />
          </div>
        </div>
      )}
    </>
  );
}
