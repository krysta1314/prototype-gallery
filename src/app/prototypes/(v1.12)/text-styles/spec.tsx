"use client";

/* 字卡样式的开发参数:字卡样式是写在组件里的(不像字幕有一份样式数据),所以直接从渲染出来的 DOM 读 computed style,
   一层一层列出来 —— 读的就是画出来的那一份,不会和效果对不上。
   长度一律写成 em(照 CSS 的规矩:font-size 相对上一层,其他相对这一层自己的字号);
   基准字号 = 画面宽的 3.6%(剪辑器里字卡的字号,1080 宽成片 38.88px),括号里附 1080 宽成片下的像素值。 */

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

const EXPORT_BASE = 1080 * 0.036;

type Layer = { label: string; rows: { k: string; v: string }[]; css: string[] };

/* next/font 的字体名 '__Montserrat_d6f1e9' → Montserrat;回退字体和中文字体不列 */
function fontName(f: string) {
  const first = f.split(",")[0].trim().replace(/^['"]|['"]$/g, "");
  if (/apple-system|SF Pro/i.test(first)) return "系统字体(SF Pro / PingFang SC)";
  return first.replace(/^__/, "").replace(/_[0-9a-f]{6,}$/i, "").replace(/_/g, " ");
}

/* CSS 里 em 的规矩:font-size 的 em 相对上一层字号,其他属性(描边、阴影、内边距、圆角…)的 em 相对这一层自己的字号。
   这里照这个规矩换算,开发照抄就对;括号里的 px = 1080 宽成片里的实际像素(按基准字号 38.88px 等比算) */
const round = (n: number, d = 1000) => Math.round(n * d) / d;
const toEm = (v: string, fs: number) => v.replace(/(-?\d*\.?\d+)px/g, (_, n: string) => `${round(parseFloat(n) / fs)}em`);
const toExportPx = (v: string, base: number) => v.replace(/(-?\d*\.?\d+)px/g, (_, n: string) => `${round((parseFloat(n) / base) * EXPORT_BASE, 10)}px`);
function show(v: string, fs: number, base: number) {
  const em = toEm(v, fs);
  return em === v ? v : `${em}(1080 成片 ${toExportPx(v, base)})`;
}

/* rgb(255, 255, 255) → #ffffff;带透明度的保留 rgba */
function hex(c: string) {
  const m = c.match(/rgba?\(([^)]+)\)/);
  if (!m) return c;
  const [r, g, b, a] = m[1].split(",").map((x) => parseFloat(x));
  const h = "#" + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, "0")).join("");
  return a !== undefined && a < 1 ? `rgba(${r}, ${g}, ${b}, ${a})` : h;
}
const colors = (v: string) => v.replace(/rgba?\([^)]+\)/g, hex);

/* text-shadow 拆段:8 个方向同色、无模糊的一圈 = 描边,合成一行;其余照列 */
function splitShadow(v: string): { ring?: { color: string; w: number }; rest: string } {
  const segs = v.split(/,(?![^(]*\))/).map((x) => x.trim());
  const parsed = segs.map((seg) => {
    const color = seg.match(/rgba?\([^)]*\)|#[0-9a-f]{3,8}/i)?.[0] ?? "";
    const nums = seg.replace(color, "").trim().split(/\s+/).map((x) => parseFloat(x));
    return { seg, color, x: nums[0] ?? 0, y: nums[1] ?? 0, blur: nums[2] ?? 0 };
  });
  const groups = new Map<string, typeof parsed>();
  for (const p of parsed) {
    const w = Math.max(Math.abs(p.x), Math.abs(p.y));
    if (p.blur !== 0 || w === 0 || !((Math.abs(p.x) === w || p.x === 0) && (Math.abs(p.y) === w || p.y === 0))) continue;
    const k = `${p.color}|${w}`;
    groups.set(k, [...(groups.get(k) ?? []), p]);
  }
  for (const [k, g] of groups) {
    if (g.length >= 8) {
      const [color, w] = k.split("|");
      return { ring: { color, w: Number(w) }, rest: parsed.filter((p) => !g.includes(p)).map((p) => p.seg).join(", ") };
    }
  }
  return { rest: v };
}

const nonZero = (v: string) => v.split(" ").some((x) => parseFloat(x) !== 0);

function readLayers(root: HTMLElement, base: number): Layer[] {
  const layers: Layer[] = [];
  const els = [root, ...Array.from(root.querySelectorAll<HTMLElement | SVGElement>("*"))];
  let n = 0;
  for (const el of els) {
    if (el instanceof SVGElement && el.tagName.toLowerCase() !== "svg") continue;
    const cs = getComputedStyle(el);
    const parentEl = el.parentElement!;
    const pcs = getComputedStyle(parentEl);
    const fs = parseFloat(cs.fontSize);
    const pfs = parseFloat(pcs.fontSize);
    const rows: { k: string; v: string }[] = [];
    const css: string[] = [];
    const add = (k: string, v: string, prop: string, cssV = v) => {
      rows.push({ k, v });
      css.push(`${prop}: ${cssV};`);
    };

    if (el instanceof SVGElement) {
      const icon = Array.from(el.classList).find((c) => c.startsWith("lucide-") && c !== "lucide-icon");
      add("图标", `lucide ${icon?.replace("lucide-", "") ?? "svg"},${round(el.getBoundingClientRect().width / fs)}em 见方`, "/* icon */", icon ?? "svg");
      layers.push({ label: `第 ${++n} 层 · 图标`, rows, css });
      continue;
    }
    const own = Array.from(el.childNodes).some((x) => x.nodeType === 3 && x.textContent?.trim());
    const diff = (p: string) => cs.getPropertyValue(p) !== pcs.getPropertyValue(p);
    /* 有字的层把排版参数全列出来(不管是不是继承来的),没字的层只列它自己改了的 */
    const typo = (p: string) => own || diff(p);

    if (typo("font-family")) add("字体", fontName(cs.fontFamily), "font-family", `"${fontName(cs.fontFamily)}", "PingFang SC", sans-serif`);
    if (typo("font-size")) add("字号", `${round(fs / pfs)}em(相对上一层;1080 成片 ${round((fs / base) * EXPORT_BASE, 10)}px)`, "font-size", `${round(fs / pfs)}em`);
    /* 只有一个字重的字体(font-synthesis: none,不会被假加粗) */
    const single = ["Anton", "Luckiest Guy", "Archivo Black"].includes(fontName(cs.fontFamily));
    if (typo("font-weight"))
      add("字重", single && cs.fontWeight !== "400" ? `设为 ${cs.fontWeight},但 ${fontName(cs.fontFamily)} 只有 400 一档,实际显示 400` : cs.fontWeight, "font-weight", single ? "400" : cs.fontWeight);
    if (cs.fontStyle === "italic" && typo("font-style")) add("字形", "斜体", "font-style", "italic");
    if (typo("line-height") && cs.lineHeight !== "normal") add("行高", `${round(parseFloat(cs.lineHeight) / fs, 100)}`, "line-height");
    if (cs.letterSpacing !== "normal" && parseFloat(cs.letterSpacing) !== 0 && typo("letter-spacing")) add("字距", show(cs.letterSpacing, fs, base), "letter-spacing", toEm(cs.letterSpacing, fs));
    if (cs.textTransform !== "none" && typo("text-transform")) add("大小写", cs.textTransform === "uppercase" ? "英文全大写" : cs.textTransform === "lowercase" ? "英文全小写" : cs.textTransform, "text-transform", cs.textTransform);
    if (typo("color")) add("文字颜色", cs.color === "rgba(0, 0, 0, 0)" ? "透明(镂空 / 渐变填色)" : hex(cs.color), "color", hex(cs.color));

    const stroke = cs.getPropertyValue("-webkit-text-stroke-width");
    if (parseFloat(stroke) > 0 && diff("-webkit-text-stroke-width"))
      add("描边", `${hex(cs.getPropertyValue("-webkit-text-stroke-color"))} · ${show(stroke, fs, base)};-webkit-text-stroke,描边画在填色下面(paint-order: stroke fill),字外实际露出一半`, "-webkit-text-stroke", `${toEm(stroke, fs)} ${hex(cs.getPropertyValue("-webkit-text-stroke-color"))}`);
    if (cs.textShadow !== "none" && diff("text-shadow")) {
      const { ring, rest } = splitShadow(cs.textShadow);
      if (ring) add("描边", `${hex(ring.color)} · ${show(`${ring.w}px`, fs, base)};8 个方向的 text-shadow 拼成`, "/* 描边 */ text-shadow", `8 × (±${toEm(`${ring.w}px`, fs)}) 0 ${hex(ring.color)}`);
      if (rest) add("文字阴影", colors(show(rest, fs, base)), "text-shadow", colors(toEm(rest, fs)));
    }
    if (cs.backgroundColor !== "rgba(0, 0, 0, 0)") add("底色", hex(cs.backgroundColor), "background-color", hex(cs.backgroundColor));
    if (cs.backgroundImage !== "none") add("底图 / 渐变", colors(cs.backgroundImage).replace("in oklab, ", ""), "background-image", colors(cs.backgroundImage).replace("in oklab, ", ""));
    if (cs.backgroundClip === "text" || cs.getPropertyValue("-webkit-background-clip") === "text") add("填色方式", "渐变裁进文字(background-clip: text)", "background-clip", "text");
    if (nonZero(cs.padding)) add("内边距", show(cs.padding, fs, base), "padding", toEm(cs.padding, fs));
    if (nonZero(cs.borderRadius)) add("圆角", show(cs.borderRadius, fs, base), "border-radius", toEm(cs.borderRadius, fs));
    if (parseFloat(cs.borderTopWidth) > 0 || parseFloat(cs.borderLeftWidth) > 0)
      add("边框", `${show(cs.borderTopWidth, fs, base)} ${cs.borderTopStyle} ${hex(cs.borderTopColor)}`, "border", `${toEm(cs.borderTopWidth, fs)} ${cs.borderTopStyle} ${hex(cs.borderTopColor)}`);
    if (cs.boxShadow !== "none") add("投影", colors(show(cs.boxShadow, fs, base)), "box-shadow", colors(toEm(cs.boxShadow, fs)));
    if (cs.backdropFilter && cs.backdropFilter !== "none") add("背景模糊", show(cs.backdropFilter, fs, base), "backdrop-filter", toEm(cs.backdropFilter, fs));
    if (cs.clipPath !== "none") add("裁切形状", cs.clipPath, "clip-path");
    /* Tailwind v4 的旋转 / 位移 / 缩放是单独的 rotate / translate / scale 属性,斜切还在 transform 里 */
    if (cs.rotate && cs.rotate !== "none") add("旋转", cs.rotate, "rotate");
    if (cs.translate && cs.translate !== "none") add("位移", show(cs.translate, fs, base), "translate", toEm(cs.translate, fs));
    if (cs.scale && cs.scale !== "none" && el !== root) add("缩放", cs.scale, "scale");
    if (cs.transform !== "none" && el !== root) {
      const m = cs.transform.match(/matrix\(([^)]+)\)/)?.[1].split(",").map((x) => parseFloat(x));
      if (m && Math.abs(m[2]) > 0.001 && Math.abs(m[1]) < 0.001) add("斜切", `skewX(${Math.round((Math.atan(m[2] / m[3]) * 180) / Math.PI)}deg)`, "transform", `skewX(${Math.round((Math.atan(m[2] / m[3]) * 180) / Math.PI)}deg)`);
      else if (m && Math.abs(m[1]) > 0.001) add("旋转", `${Math.round((Math.atan2(m[1], m[0]) * 180) / Math.PI)}deg`, "transform", `rotate(${Math.round((Math.atan2(m[1], m[0]) * 180) / Math.PI)}deg)`);
    }
    if (parseFloat(cs.opacity) < 1) add("透明度", cs.opacity, "opacity");
    if (cs.textDecorationLine !== "none" && diff("text-decoration-line")) add("装饰线", `${cs.textDecorationLine} ${hex(cs.textDecorationColor)}`, "text-decoration", `${cs.textDecorationLine} ${hex(cs.textDecorationColor)}`);
    if (cs.boxDecorationBreak === "clone" || cs.getPropertyValue("-webkit-box-decoration-break") === "clone") add("换行底框", "每行各自包一个底框", "box-decoration-break", "clone");
    if (cs.position === "absolute" && el !== root) add("叠放", "绝对定位,和正文叠在同一个位置", "position", "absolute");

    if (rows.length) layers.push({ label: `第 ${++n} 层${own ? " · 文字" : ""}`, rows, css });
  }
  return layers;
}

/** 一套字卡样式的开发参数面板 */
export function CardSpec({ previewRef, wrapped, deps }: { previewRef: React.RefObject<HTMLElement | null>; wrapped: boolean; deps: unknown[] }) {
  const [layers, setLayers] = useState<Layer[]>([]);
  const [copied, setCopied] = useState(false);
  const tick = useRef(0);
  useEffect(() => {
    const id = ++tick.current;
    const run = () => {
      const box = previewRef.current;
      /* 剪辑器里的样式外面包着 CardText 的进场动效层,真正的样式从它里面开始;候选直接就是样式本身 */
      const first = box?.firstElementChild as HTMLElement | null | undefined;
      const root = (wrapped ? first?.firstElementChild : first) as HTMLElement | null | undefined;
      if (!box || !root || id !== tick.current) return;
      const base = parseFloat(getComputedStyle(box).fontSize);
      setLayers(readLayers(root, base));
    };
    const raf = requestAnimationFrame(run);
    void document.fonts?.ready.then(run);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const css = layers.map((l) => `/* ${l.label} */\n${l.css.join("\n")}`).join("\n\n");
  const copy = () =>
    navigator.clipboard?.writeText(css).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });

  return (
    <div className="mt-3 border-t border-[#ececf1] pt-3">
      <dl className="grid grid-cols-[76px_1fr] gap-x-3 gap-y-1.5 text-[12.5px] leading-snug">
        <dt className="text-[#9a9bb0]">基准字号</dt>
        <dd className="text-[#2a2b3d]">画面宽的 3.6%(1080 宽成片 38.88px),第 1 层的字号相对它;用户可拖选中框缩放 0.5–3 倍</dd>
        <dt className="text-[#9a9bb0]">对齐 / 宽度</dt>
        <dd className="text-[#2a2b3d]">居中;最宽为画面宽的 86%,超出自动换行</dd>
        <dt className="text-[#9a9bb0]">单位</dt>
        <dd className="text-[#2a2b3d]">照 CSS 的规矩:字号的 em 相对上一层,描边、阴影、内边距、圆角的 em 相对这一层自己的字号;括号里是 1080 宽成片的像素</dd>
      </dl>
      {layers.map((l) => (
        <div key={l.label} className="mt-3">
          <p className="mb-1 text-[11.5px] font-semibold uppercase tracking-[0.04em] text-[#6a6b7b]">{l.label}</p>
          <dl className="grid grid-cols-[76px_1fr] gap-x-3 gap-y-1.5 text-[12.5px] leading-snug">
            {l.rows.map((r, i) => (
              <div key={i} className="contents">
                <dt className="text-[#9a9bb0]">{r.k}</dt>
                <dd className="min-w-0 break-words text-[#2a2b3d]">{r.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
      <div className="relative mt-3 rounded-lg bg-[#f6f6f9] ring-1 ring-inset ring-[#ececf1]">
        <button
          type="button"
          onClick={copy}
          className="absolute right-1.5 top-1.5 flex items-center gap-1 rounded-md bg-white px-2 py-1 text-[11.5px] font-medium text-[#4a4b5c] ring-1 ring-[#e1e3e9] transition hover:bg-[#f3f4f6]"
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          {copied ? "已复制" : "复制 CSS"}
        </button>
        <pre className="max-h-[260px] overflow-auto px-3 py-2.5 pr-24 font-mono text-[11.5px] leading-relaxed text-[#3a3b4d] [scrollbar-width:thin]">{css}</pre>
      </div>
    </div>
  );
}
