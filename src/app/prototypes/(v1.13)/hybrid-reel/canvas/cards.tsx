"use client";

/* 字卡样式库(剪辑方案 spec 2.6):和字幕样式分开的一套。
   字卡是画面上设计出来的文字 —— 钩子标题、卖点、价格、CTA —— 偏海报感:底板、描边、斜切、贴纸;
   字幕讲究好读不抢戏,两者方向不同,所以不复用 SUBTITLE_PRESETS。
   id 和说明在 src/lib/hybrid-reel/cards.ts(服务端排方案时按 id 挑),这里只管长什么样。
   强调色(accent)来自方案的 cardAccent,跟着参考素材 / 品牌调性走。 */

import type { CSSProperties } from "react";
import { Anton, Archivo_Black, Bodoni_Moda, Courier_Prime, Luckiest_Guy, Montserrat, Oswald, Playfair_Display, Rubik } from "next/font/google";
import { ArrowRight, Bell, Link2, Search } from "lucide-react";
import type { CardAnim, CardPos } from "../agent/chat/types";
import { CARD_STYLES, cardStyleId } from "@/lib/hybrid-reel/cards";

const anton = Anton({ weight: "400", subsets: ["latin"], display: "swap" });
const archivo = Archivo_Black({ weight: "400", subsets: ["latin"], display: "swap" });
const bodoni = Bodoni_Moda({ weight: ["500", "700"], subsets: ["latin"], display: "swap" });
const courier = Courier_Prime({ weight: ["400", "700"], subsets: ["latin"], display: "swap" });
const luckiest = Luckiest_Guy({ weight: "400", subsets: ["latin"], display: "swap" });
const oswald = Oswald({ weight: ["600", "700"], subsets: ["latin"], display: "swap" });
const playfair = Playfair_Display({ weight: ["600", "700"], subsets: ["latin"], display: "swap" });
const montserrat = Montserrat({ weight: ["600", "700", "800", "900"], subsets: ["latin"], display: "swap" });
const rubik = Rubik({ weight: ["700", "800", "900"], subsets: ["latin"], display: "swap" });

const CJK = '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';
const fam = (f: string): CSSProperties => ({ fontFamily: `${f}, ${CJK}`, fontSynthesis: "none" });
/* 仿 App 的几种(TikTok 框、聊天气泡、通知…)用系统字体,像原生界面 */
const sys: CSSProperties = { fontFamily: `-apple-system, "SF Pro Text", "Helvetica Neue", ${CJK}` };

/* 描边、阴影一律用 em(跟着字号走),预览 = 导出。原来按剪辑器预览约 12px 的字卡字号用 px 调的:
   em(值, k) 里 k 是那一层自己的字号倍数(比如 Poster 是 2.1em),换算后剪辑器里的样子不变 */
const REF = 12;
const em = (v: string, k = 1) => v.replace(/(-?\d*\.?\d+)px/g, (_, n: string) => `${Math.round((parseFloat(n) / (REF * k)) * 1000) / 1000}em`);

/* 2026-09-29 从评审页加进来的 21 套:评审页上字卡的基准字号约 20px,px 按 20px = 1em 换算(同样要除以那一层自己的字号倍数 k) */
const em20 = (v: string, k = 1) => v.replace(/(-?\d*\.?\d+)px/g, (_, n: string) => `${Math.round((parseFloat(n) / (20 * k)) * 1000) / 1000}em`);
const textStroke = (c: string, wPx: number, k: number): CSSProperties => ({ WebkitTextStroke: em20(`${wPx}px ${c}`, k), paintOrder: "stroke fill" });
/* 每行各自包底框(TikTok 经典框) */
const clone: CSSProperties = { boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" };

const stroke = (c: string, w = 3) =>
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

export { CARD_STYLES };

/** 字卡在画框里的纵向位置(字卡中心,占画框高的比例) */
export const CARD_Y: Record<CardPos, number> = { top: 0.14, upper: 0.3, center: 0.5, lower: 0.68 };

/** 深色强调色上配白字,浅色配深字 */
function inkOn(hex: string) {
  const n = parseInt(hex.replace("#", ""), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 160 ? "#1a1a2e" : "#ffffff";
}

/** 一张字卡的样子。progress = 进场动画进度 0–1(1 = 完全出现) */
export function CardText({
  text,
  style,
  accent = "#ff5e1a",
  anim = "pop",
  progress = 1,
  className = "",
}: {
  text: string;
  style: string;
  accent?: string;
  anim?: CardAnim;
  progress?: number;
  className?: string;
}) {
  const ink = inkOn(accent);
  const p = Math.min(1, Math.max(0, progress));
  /* 进场动效:弹出(过冲一下)/ 滑入 / 逐字打出 / 淡入 */
  const ease = 1 - Math.pow(1 - p, 3);
  const motion: CSSProperties =
    anim === "pop"
      ? { transform: `scale(${p < 1 ? 0.6 + 0.5 * ease - 0.1 * Math.sin(ease * Math.PI) : 1})`, opacity: Math.min(1, p * 3) }
      : anim === "slide"
        ? { transform: `translateY(${(1 - ease) * 40}%)`, opacity: ease }
        : anim === "fade"
          ? { opacity: ease }
          : {};
  const id = cardStyleId(style);
  /* 只有 Hormozi 用 *关键词* 标黄;其他样式把星号去掉。POV 自动加「POV:」前缀(文案里写了就去重) */
  const raw = id === "hormozi" ? text : text.replace(/\*/g, "");
  const typed = anim === "type" ? Array.from(raw).slice(0, Math.max(1, Math.ceil(Array.from(raw).length * Math.min(1, p * 1.4)))).join("") : raw;
  const shown = id === "pov" ? typed.replace(/^\s*pov\s*[:：]\s*/i, "") : typed;

  const body = (() => {
    switch (id) {
      case "poster":
        return (
          <span
            className={`${anton.className} block uppercase leading-[0.95]`}
            style={{ ...fam(anton.style.fontFamily), fontSize: "2.1em", fontWeight: 900, color: "#fff", textShadow: em(`${stroke("#111", 3)}, 0 6px 14px rgba(0,0,0,0.35)`, 2.1) }}
          >
            {shown}
          </span>
        );
      case "block":
        return (
          <span
            className={`${montserrat.className} inline-block rounded-[0.18em] px-[0.5em] py-[0.18em] font-extrabold`}
            style={{ ...fam(montserrat.style.fontFamily), fontSize: "1.25em", background: accent, color: ink, boxShadow: em("0 6px 16px rgba(0,0,0,0.22)", 1.25) }}
          >
            {shown}
          </span>
        );
      case "tag":
        return (
          <span
            className={`${montserrat.className} inline-flex items-center gap-[0.4em] rounded-full bg-white px-[0.75em] py-[0.3em] font-bold text-[#1a1a2e]`}
            style={{ ...fam(montserrat.style.fontFamily), fontSize: "0.95em", boxShadow: em("0 4px 14px rgba(0,0,0,0.18)", 0.95) }}
          >
            <span className="size-[0.5em] shrink-0 rounded-full" style={{ background: accent }} />
            {shown}
          </span>
        );
      case "sticker":
        return (
          <span
            className={`${montserrat.className} inline-block -rotate-6 rounded-[0.4em] border-[0.14em] border-white px-[0.6em] py-[0.25em] font-black uppercase`}
            style={{ ...fam(montserrat.style.fontFamily), fontSize: "1.2em", background: "#ffe14d", color: "#1a1a2e", boxShadow: "0.12em 0.16em 0 rgba(0,0,0,0.85)" }}
          >
            {shown}
          </span>
        );
      case "button":
        return (
          <span
            className={`${montserrat.className} inline-flex items-center gap-[0.4em] rounded-full px-[0.9em] py-[0.45em] font-extrabold`}
            style={{ ...fam(montserrat.style.fontFamily), fontSize: "1.05em", background: accent, color: ink, boxShadow: em("0 8px 20px rgba(0,0,0,0.28)", 1.05) }}
          >
            {shown}
            <ArrowRight className="size-[1em] shrink-0" />
          </span>
        );
      case "editorial":
        return (
          <span
            className={`${playfair.className} block italic`}
            style={{ ...fam(playfair.style.fontFamily), fontSize: "1.55em", fontWeight: 600, color: "#fff", textShadow: em("0 2px 14px rgba(0,0,0,0.55)", 1.55) }}
          >
            {shown}
          </span>
        );
      /* ── 平台原生 / 仿 App ── */
      case "tiktok-box":
        return (
          <span className="leading-[1.5]" style={{ ...sys, fontWeight: 600, fontSize: "1.05em" }}>
            <span className="rounded-[0.35em] bg-white px-[0.45em] py-[0.12em] text-[#111]" style={clone}>
              {shown}
            </span>
          </span>
        );
      case "wait-for-it":
        return (
          <span className="rounded-[0.35em] bg-white px-[0.5em] py-[0.15em] text-[#111]" style={{ ...sys, ...clone, fontWeight: 600, fontSize: "1em", lineHeight: 1.5 }}>
            {shown}
          </span>
        );
      case "link-in-bio":
        return (
          <span className="inline-flex items-center gap-[0.35em] rounded-[0.35em] bg-white px-[0.55em] py-[0.2em] text-[#111]" style={{ ...sys, fontWeight: 600, fontSize: "1em" }}>
            <Link2 className="size-[1em] shrink-0" />
            {shown}
          </span>
        );
      case "tiktok-outline":
        return <span style={{ ...sys, fontWeight: 600, fontSize: "1.2em", color: "#fff", textShadow: em20(stroke("#000", 1.6), 1.2) }}>{shown}</span>;
      case "ig-modern":
        return (
          <span className={montserrat.className} style={{ ...fam(montserrat.style.fontFamily), fontWeight: 700, fontSize: "1.15em", letterSpacing: "0.12em", textTransform: "uppercase", color: "#fff", textShadow: em20("0 2px 10px rgba(0,0,0,.35)", 1.15) }}>
            {shown}
          </span>
        );
      case "ig-strong":
        return (
          <span className="inline-block px-[0.4em] py-[0.05em]" style={{ background: accent }}>
            <span className={`${oswald.className} block -skew-x-[8deg]`} style={{ ...fam(oswald.style.fontFamily), fontWeight: 700, fontSize: "1.5em", lineHeight: 1.05, textTransform: "uppercase", color: ink }}>
              {shown}
            </span>
          </span>
        );
      case "ig-directional":
        return (
          <span className={`${archivo.className} inline-block -rotate-6`} style={{ ...fam(archivo.style.fontFamily), fontSize: "1.3em", textTransform: "uppercase", color: "#fff", textShadow: em20("3px 3px 0 rgba(0,0,0,.55)", 1.3) }}>
            {shown}
          </span>
        );
      case "ig-typewriter":
        return (
          <span className={`${courier.className} rounded-[0.15em] bg-white px-[0.5em] py-[0.2em] text-[#111]`} style={{ ...fam(courier.style.fontFamily), ...clone, fontSize: "1.05em", lineHeight: 1.6, textTransform: "lowercase" }}>
            {shown}
          </span>
        );
      case "ig-elegant":
        return (
          <span className={bodoni.className} style={{ ...fam(bodoni.style.fontFamily), fontWeight: 500, fontSize: "1.4em", letterSpacing: "0.18em", textTransform: "uppercase", color: "#fff", textShadow: em20("0 2px 12px rgba(0,0,0,.45)", 1.4) }}>
            {shown}
          </span>
        );
      case "comment-reply":
        return (
          <span className="relative inline-block max-w-[16em] rounded-[0.7em] bg-white px-[0.8em] py-[0.55em] text-left" style={{ ...sys, boxShadow: em20("0 6px 18px rgba(0,0,0,.22)") }}>
            <span className="block text-[0.62em] font-medium text-[#8a8b99]">Replying to a comment</span>
            <span className="mt-[0.15em] block text-[0.95em] font-semibold leading-snug text-[#111]">{shown}</span>
            <span className="absolute -bottom-[0.35em] left-[1em] size-[0.8em] rotate-45 bg-white" />
          </span>
        );
      case "imessage":
        return (
          <span className="inline-block max-w-[15em] rounded-[1.1em] rounded-bl-[0.3em] bg-[#E9E9EB] px-[0.75em] py-[0.4em] text-left text-[#111]" style={{ ...sys, fontSize: "0.95em" }}>
            {shown}
          </span>
        );
      case "notification":
        return (
          <span className="inline-flex w-[16em] max-w-full items-center gap-[0.55em] rounded-[1.1em] bg-white/75 px-[0.7em] py-[0.6em] text-left" style={{ ...sys, fontSize: "0.85em", boxShadow: em20("0 8px 24px rgba(0,0,0,.2)", 0.85), backdropFilter: em20("blur(12px)", 0.85), WebkitBackdropFilter: em20("blur(12px)", 0.85) }}>
            <span className="grid size-[2.1em] shrink-0 place-items-center rounded-[0.5em] text-white" style={{ background: accent }}>
              <Bell className="size-[1.1em]" />
            </span>
            <span className="min-w-0 flex-1 font-semibold leading-snug text-[#111]">{shown}</span>
            <span className="self-start text-[0.8em] text-[#8a8b99]">now</span>
          </span>
        );
      case "search-bar":
        return (
          <span className="inline-flex max-w-full items-center gap-[0.45em] rounded-full bg-white px-[0.9em] py-[0.5em] text-left text-[#222]" style={{ ...sys, fontSize: "0.95em", boxShadow: em20("0 6px 18px rgba(0,0,0,.2)", 0.95) }}>
            <Search className="size-[1em] shrink-0 text-[#8a8b99]" />
            <span className="min-w-0">{shown}</span>
            <span className="h-[1.1em] w-[0.1em] shrink-0 bg-[#0A84FF]" />
          </span>
        );

      /* ── 钩子标题 ── */
      case "hormozi": {
        /* *关键词* 标黄;没配对的星号去掉 */
        const parts = shown.split(/\*(.+?)\*/);
        return (
          <span className={`${anton.className} block`} style={{ ...fam(anton.style.fontFamily), fontSize: "2em", lineHeight: 1, textTransform: "uppercase", color: "#fff", ...textStroke("#000", 6, 2), textShadow: em20("0 4px 0 rgba(0,0,0,.6)", 2) }}>
            {parts.map((t, i) =>
              i % 2 ? (
                <span key={i} style={{ color: "#FFE500" }}>
                  {t}
                </span>
              ) : (
                <span key={i}>{t.replace(/\*/g, "")}</span>
              ),
            )}
          </span>
        );
      }
      case "beast-pop":
        return (
          <span className={`${luckiest.className} inline-block -rotate-3`} style={{ ...fam(luckiest.style.fontFamily), fontSize: "1.8em", lineHeight: 1.05, textTransform: "uppercase", color: "#FFE14D", ...textStroke("#000", 7, 1.8), textShadow: em20("0 5px 0 #000", 1.8) }}>
            {shown}
          </span>
        );
      case "pov":
        return (
          <span style={{ ...sys, fontSize: "1.15em", color: "#fff", textShadow: em20(stroke("#000", 1.4), 1.15) }}>
            <span className="font-extrabold">POV: </span>
            <span className="font-medium">{shown}</span>
          </span>
        );
      case "huazi":
        /* 三层叠:最底一层白字 + 红色粗外描边 + 立体投影,中间一层白色内描边,最上面渐变填色 */
        return (
          <span className="relative inline-block -rotate-[4deg]" style={{ ...fam(rubik.style.fontFamily), fontWeight: 900, fontSize: "2em", lineHeight: 1.1 }}>
            <span aria-hidden className={`${rubik.className} absolute inset-0`} style={{ color: "#fff", ...textStroke("#e0301e", 12, 2), textShadow: em20("0 5px 0 #7a1208", 2) }}>
              {shown}
            </span>
            <span aria-hidden className={`${rubik.className} absolute inset-0`} style={{ color: "#fff", ...textStroke("#fff", 6, 2) }}>
              {shown}
            </span>
            <span className={`${rubik.className} relative bg-gradient-to-b from-[#FFE14D] to-[#FF8A00] bg-clip-text text-transparent`}>{shown}</span>
          </span>
        );
      case "neon":
        return (
          <span className={montserrat.className} style={{ ...fam(montserrat.style.fontFamily), fontWeight: 600, fontSize: "1.5em", color: "#fff", textShadow: em20("0 0 4px #fff, 0 0 12px #ff3df2, 0 0 26px #ff3df2, 0 0 40px #ff3df2", 1.5) }}>
            {shown}
          </span>
        );
      case "splice":
        /* 错位那层和正文同宽、同样换行,只用 transform 挪开 */
        return (
          <span className={`${rubik.className} relative inline-block`} style={{ ...fam(rubik.style.fontFamily), fontWeight: 900, fontSize: "1.8em", lineHeight: 1.05 }}>
            <span aria-hidden className="absolute inset-0 translate-x-[0.08em] translate-y-[0.08em] text-transparent" style={{ WebkitTextStroke: em20(`2px ${accent}`, 1.8) }}>
              {shown}
            </span>
            <span className="relative text-white">{shown}</span>
          </span>
        );
      case "glitch":
        return (
          <span className={archivo.className} style={{ ...fam(archivo.style.fontFamily), fontSize: "1.6em", textTransform: "uppercase", color: "#fff", textShadow: em20("-3px 0 #ff2a55, 3px 0 #00e5ff", 1.6) }}>
            {shown}
          </span>
        );

      /* ── 标签 ── */
      case "tape":
        return (
          <span
            className={`${courier.className} inline-block -rotate-[4deg] px-[1em] py-[0.35em]`}
            style={{
              ...fam(courier.style.fontFamily),
              fontWeight: 700,
              fontSize: "1.1em",
              color: "#4a3520",
              background: "rgba(245,230,200,.9)",
              clipPath: "polygon(0 8%, 4% 0, 8% 10%, 12% 0, 88% 0, 92% 10%, 96% 0, 100% 8%, 100% 92%, 96% 100%, 92% 90%, 88% 100%, 12% 100%, 8% 90%, 4% 100%, 0 92%)",
            }}
          >
            {shown}
          </span>
        );

      case "glass":
      default:
        return (
          <span
            className={`${montserrat.className} inline-block rounded-[0.6em] border border-white/40 px-[0.8em] py-[0.35em] font-bold text-white`}
            style={{ ...fam(montserrat.style.fontFamily), fontSize: "1.05em", background: "rgba(255,255,255,0.18)", boxShadow: em("0 6px 20px rgba(0,0,0,0.2)", 1.05), backdropFilter: em("blur(12px)", 1.05), WebkitBackdropFilter: em("blur(12px)", 1.05) }}
          >
            {shown}
          </span>
        );
    }
  })();

  return (
    <span className={`inline-block max-w-full text-center [overflow-wrap:anywhere] ${className}`} style={motion}>
      {body}
    </span>
  );
}
