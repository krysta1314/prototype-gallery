/* 字幕样式的开发参数:直接从 SUBTITLE_PRESETS 的样式数据里读出来翻成说明,和剪辑器画出来的是同一份,不手抄。
   页面上每张卡片下面列这些参数 + 一段可复制的 CSS。
   字号、行高、最大宽度、默认位置这几项是所有样式共用的,取自剪辑器预览(hybrid-reel/canvas/player.tsx、subtitles.tsx)。 */

import type { CSSProperties } from "react";
import type { SubtitlePreset } from "../hybrid-reel/canvas/subtitles";

export type SpecRow = { k: string; v: string };

/* next/font 生成的字体名形如 '__Montserrat_d6f1e9', '__Montserrat_Fallback_d6f1e9' —— 取第一个,还原成 Google Fonts 上的名字 */
function fontName(family: string | undefined): string | undefined {
  if (!family) return undefined;
  const first = family.split(",")[0].trim().replace(/^['"]|['"]$/g, "");
  return first.replace(/^__/, "").replace(/_[0-9a-f]{6,}$/i, "").replace(/_/g, " ");
}

/* 这些 Google 字体各自有哪些字重(fontSynthesis: none,设了没有的字重不会被假加粗,按最接近的一档显示) */
const WEIGHTS: Record<string, number[]> = {
  Anton: [400],
  "Luckiest Guy": [400],
  Montserrat: [700, 800, 900],
  Poppins: [600, 700],
  Fredoka: [600, 700],
  Rubik: [700, 800, 900],
  "Playfair Display": [600, 700, 800],
};

type Shadow = { x: number; y: number; blur: number; color: string };

function splitTop(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of s) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      out.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

function parseShadows(s: string | undefined): Shadow[] {
  if (!s) return [];
  return splitTop(s).map((seg) => {
    const color = seg.match(/(#[0-9a-f]{3,8}|rgba?\([^)]*\))/i)?.[0] ?? "";
    const nums = seg
      .replace(color, "")
      .trim()
      .split(/\s+/)
      .map((n) => parseFloat(n));
    return { x: nums[0] ?? 0, y: nums[1] ?? 0, blur: nums[2] ?? 0, color };
  });
}

/* 描边、阴影都是 em(跟着字号走);括号里附 1080 宽成片(字号 36.72px)下的像素值,方便开发核对 */
const EXPORT_FONT = 1080 * 0.034;
const px = (n: number) => `${Math.round(n * 1000) / 1000}em(≈${Math.round(n * EXPORT_FONT * 10) / 10}px)`;

/** 把 text-shadow 拆成人话:8 方向拼的描边 / 硬投影叠出的立体 / 发光 / 柔和阴影 */
function describeShadows(list: Shadow[]): { outline?: string; rest: string[] } {
  const rest: string[] = [];
  let outline: string | undefined;
  /* 8 方向描边:同色、无模糊、偏移落在 (±w,0)(0,±w)(±w,±w) 上 */
  const byKey = new Map<string, Shadow[]>();
  for (const s of list) {
    if (s.blur !== 0) continue;
    const w = Math.max(Math.abs(s.x), Math.abs(s.y));
    const onRing = (Math.abs(s.x) === w || s.x === 0) && (Math.abs(s.y) === w || s.y === 0) && w > 0;
    if (!onRing) continue;
    const key = `${s.color}|${w}`;
    byKey.set(key, [...(byKey.get(key) ?? []), s]);
  }
  const used = new Set<Shadow>();
  for (const [key, group] of byKey) {
    if (group.length >= 8) {
      const [color, w] = key.split("|");
      outline = `${color} · ${px(Number(w))}(8 个方向的 text-shadow 拼成,各浏览器一致)`;
      group.forEach((g) => used.add(g));
      break;
    }
  }
  const left = list.filter((s) => !used.has(s));
  /* 同色、无模糊、偏移逐层递增 → 立体厚度 */
  const hard = left.filter((s) => s.blur === 0 && (s.x !== 0 || s.y !== 0));
  if (hard.length >= 3 && hard.every((h) => h.color === hard[0].color)) {
    const last = hard[hard.length - 1];
    rest.push(`立体厚度:${hard.length} 层硬投影,${hard[0].color},每层偏移 +${px(hard[0].x)},最深 (${px(last.x)}, ${px(last.y)})`);
    hard.forEach((h) => used.add(h));
  }
  for (const s of list) {
    if (used.has(s)) continue;
    if (s.blur === 0) rest.push(`硬投影:${s.color},偏移 (${px(s.x)}, ${px(s.y)}),无模糊`);
    else if (s.x === 0 && s.y === 0) rest.push(`发光:${s.color},模糊 ${px(s.blur)}`);
    else rest.push(`阴影:${s.color},偏移 (${px(s.x)}, ${px(s.y)}),模糊 ${px(s.blur)}`);
  }
  return { outline, rest };
}

/** 一套字幕样式的全部开发参数 */
export function describePreset(p: SubtitlePreset): SpecRow[] {
  const b = p.base as CSSProperties & { WebkitTextStroke?: string; paintOrder?: string };
  const line = p.line;
  const font = fontName(b.fontFamily as string | undefined);
  const weight = Number(b.fontWeight ?? 400);
  const avail = font ? WEIGHTS[font] : undefined;
  const real = avail ? avail.reduce((a, c) => (Math.abs(c - weight) < Math.abs(a - weight) ? c : a), avail[0]) : weight;

  const rows: SpecRow[] = [];
  rows.push({
    k: "字体",
    v: font ? `${font}(Google Fonts)` : "系统默认无衬线(SF Pro / PingFang SC)",
  });
  rows.push({ k: "中文回退", v: "PingFang SC → Hiragino Sans GB → Microsoft YaHei(英文字体没有中文字形);font-synthesis: none" });
  rows.push({
    k: "字重",
    v:
      avail && real !== weight
        ? `设为 ${weight},但 ${font} 只有 ${avail.join(" / ")},实际显示 ${real};中文回退字体用它最粗的一档(PingFang SC 为 Semibold 600)`
        : `${weight}${weight >= 700 ? ";中文回退用最粗的一档(PingFang SC 为 Semibold 600)" : ""}`,
  });
  rows.push({ k: "字号", v: "画面宽的 3.4%(1080 宽成片 36.72px);剪辑器预览同样是 3.4cqw,不设上下限,预览和成片同比例;用户可拖选中框缩放 0.5–3 倍,全片统一" });
  rows.push({ k: "行高", v: "1.375(Tailwind leading-snug)" });
  rows.push({ k: "字距", v: b.letterSpacing ? String(b.letterSpacing) : "0(默认)" });
  rows.push({ k: "大小写", v: p.upper ? "英文全部转大写(中文不受影响)" : "原样" });
  rows.push({ k: "文字颜色", v: b.color === "transparent" ? "透明(镂空)" : String(b.color ?? "#fff") });

  if (b.WebkitTextStroke) {
    const [w, c] = String(b.WebkitTextStroke).split(" ");
    rows.push({
      k: "描边",
      v: `${c} · ${px(parseFloat(w))}(-webkit-text-stroke + paint-order: stroke fill,描边画在填色下面,字外实际露出 ${px(parseFloat(w) / 2)})`,
    });
  }
  const sh = describeShadows(parseShadows(b.textShadow as string | undefined));
  if (sh.outline) rows.push({ k: "描边", v: sh.outline });
  if (!b.WebkitTextStroke && !sh.outline) rows.push({ k: "描边", v: "无" });
  rows.push({ k: "阴影 / 发光", v: sh.rest.length ? sh.rest.join(";") : "无" });

  if (line?.background) {
    rows.push({
      k: "底框",
      v: `${line.background} · 内边距 ${line.padding ?? "0"} · 圆角 ${line.borderRadius ?? "0"};每行各自包一个底框(box-decoration-break: clone),不是整段一个大框`,
    });
  } else rows.push({ k: "底框", v: "无" });

  rows.push({ k: "对齐 / 换行", v: "居中;最宽为画面宽的 84%,超出自动换行,不限行数,每条字幕一句" });
  rows.push({ k: "默认位置", v: "水平居中,字幕中心在画面高的 84% 处;用户可在预览区拖动,全片统一" });
  rows.push({ k: "单位说明", v: "描边、阴影、内边距、圆角全部是 em(相对字号),任何分辨率下和字的比例都一样,预览 = 导出;括号里的 px 是 1080 宽成片的换算值" });
  return rows;
}

/** 可直接复制的 CSS(字号用 1080 宽成片的值) */
export function presetCss(p: SubtitlePreset): string {
  const b = p.base as Record<string, unknown>;
  const line = (p.line ?? {}) as Record<string, unknown>;
  const kebab = (k: string) => k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
  const decl: [string, unknown][] = [
    ["font-family", `${fontName(b.fontFamily as string | undefined) ? `"${fontName(b.fontFamily as string)}", ` : ""}"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif`],
    ["font-size", "36.72px /* 1080 宽成片 = 画面宽 3.4% */"],
    ["line-height", "1.375"],
    ["text-align", "center"],
    ...(p.upper ? ([["text-transform", "uppercase"]] as [string, unknown][]) : []),
    ...Object.entries(b).filter(([k]) => k !== "fontFamily"),
    ...Object.entries(line),
    ...(p.line ? ([["-webkit-box-decoration-break", "clone"], ["box-decoration-break", "clone"]] as [string, unknown][]) : []),
  ];
  return decl.map(([k, v]) => `${k.startsWith("-") || k.includes("-") ? k : kebab(k)}: ${v};`).join("\n");
}
