"use client";

/* 静态字幕样式候选库(2026-09 调研)。只收静态样式:不做逐词高亮 / 弹出这类动态效果。
   来源:TikTok / Instagram Reels 自带文字样式、CapCut 与 Submagic 的热门模板(Hormozi / MrBeast / Ali Abdaal / Iman Gadzhi 等)、
   各家 2026 字幕趋势文章,以及抖音 / 小红书常见的中文花字。
   2026-09-28 Monica 从这里加选了 12 种,已经进了剪辑器的 SUBTITLE_PRESETS(subtitles.tsx 里按 id 引用这里的定义)。
   其余的只留作备选,页面上不再展示;要删这里的样式,先确认 subtitles.tsx 的 ADDED 没有引用它。 */

import type { CSSProperties } from "react";
import {
  Anton,
  Archivo_Black,
  Bangers,
  Bebas_Neue,
  Caveat,
  Courier_Prime,
  Fredoka,
  Luckiest_Guy,
  Montserrat,
  Oswald,
  Pacifico,
  Permanent_Marker,
  Playfair_Display,
  Poppins,
  Rubik,
} from "next/font/google";

const anton = Anton({ weight: "400", subsets: ["latin"], display: "swap" });
const archivo = Archivo_Black({ weight: "400", subsets: ["latin"], display: "swap" });
const bangers = Bangers({ weight: "400", subsets: ["latin"], display: "swap" });
const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"], display: "swap" });
const caveat = Caveat({ weight: ["600", "700"], subsets: ["latin"], display: "swap" });
const courier = Courier_Prime({ weight: ["400", "700"], subsets: ["latin"], display: "swap" });
const fredoka = Fredoka({ weight: ["600", "700"], subsets: ["latin"], display: "swap" });
const luckiest = Luckiest_Guy({ weight: "400", subsets: ["latin"], display: "swap" });
const montserrat = Montserrat({ weight: ["500", "700", "800", "900"], subsets: ["latin"], display: "swap" });
const oswald = Oswald({ weight: ["500", "700"], subsets: ["latin"], display: "swap" });
const pacifico = Pacifico({ weight: "400", subsets: ["latin"], display: "swap" });
const marker = Permanent_Marker({ weight: "400", subsets: ["latin"], display: "swap" });
const playfair = Playfair_Display({ weight: ["600", "700", "800"], style: ["normal", "italic"], subsets: ["latin"], display: "swap" });
const poppins = Poppins({ weight: ["500", "600", "700", "800"], subsets: ["latin"], display: "swap" });
const rubik = Rubik({ weight: ["700", "800", "900"], subsets: ["latin"], display: "swap" });

/* 英文字体没有中文字形:中文统一回退到系统粗体 */
const CJK = '"PingFang SC", "PingFang HK", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';
const f = (family: string): CSSProperties => ({ fontFamily: `${family}, ${CJK}`, fontSynthesis: "none" });

/** 描边:WebKit 描边 + paint-order,描边画在填色下面,字形不会被吃细 */
const stroke = (color: string, w: number): CSSProperties => ({
  WebkitTextStroke: `${w}px ${color}`,
  paintOrder: "stroke fill",
});
const shadow = (s: string): CSSProperties => ({ textShadow: s });

export type Group = "outline" | "box" | "creator" | "platform" | "shadow" | "cinema" | "fun" | "cn";

export const GROUPS: { id: Group; zh: string }[] = [
  { id: "outline", zh: "描边" },
  { id: "box", zh: "底框" },
  { id: "creator", zh: "博主同款" },
  { id: "platform", zh: "平台自带" },
  { id: "shadow", zh: "阴影" },
  { id: "cinema", zh: "影视 / 高级感" },
  { id: "fun", zh: "趣味" },
  { id: "cn", zh: "中文花字" },
];

export type CatalogStyle = {
  id: string;
  /** 产品里显示的样式名(英文) */
  name: string;
  group: Group;
  /** 给 Monica 看的一句说明:哪里流行、适合什么内容 */
  note: string;
  /** 文字本身 */
  text: CSSProperties;
  /** 整行的底框(逐行包裹) */
  line?: CSSProperties;
  /** 关键词(示例台词里 *包起来* 的那个词)单独的颜色 / 底色 —— 静态的,不随播放变化 */
  key?: CSSProperties;
  upper?: boolean;
};

const BOX: CSSProperties = { padding: "0.14em 0.5em", borderRadius: "0.3em", boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" };

export const CATALOG: CatalogStyle[] = [
  /* ── 描边:短视频最通用的一类 ── */
  {
    id: "white-black-outline",
    name: "Classic outline",
    group: "outline",
    note: "白字黑描边。2026 各平台出现最多的默认样式,任何画面都看得清。",
    text: { ...f(montserrat.style.fontFamily), fontWeight: 800, color: "#fff", ...stroke("#000", 5) },
  },
  {
    id: "yellow-black-outline",
    name: "Yellow outline",
    group: "outline",
    note: "黄字黑描边。和白字并列最常见,亮画面上比白字更醒目。",
    text: { ...f(montserrat.style.fontFamily), fontWeight: 800, color: "#ffe600", ...stroke("#000", 5) },
  },
  {
    id: "thin-outline",
    name: "Thin outline",
    group: "outline",
    note: "细描边 + 常规字重。干净、不抢画面,适合美妆 / 生活方式。",
    text: { ...f(poppins.style.fontFamily), fontWeight: 600, color: "#fff", ...stroke("#000", 2.5) },
  },
  {
    id: "heavy-caps",
    name: "Heavy caps",
    group: "outline",
    note: "Anton 压缩粗体全大写 + 粗描边。信息流里最「抓眼」的一种。",
    text: { ...f(anton.style.fontFamily), color: "#fff", letterSpacing: "0.02em", ...stroke("#000", 5) },
    upper: true,
  },
  {
    id: "double-outline",
    name: "Double outline",
    group: "outline",
    note: "白字 + 黑内描边 + 品牌色外描边。叠两层,贴纸感强。",
    text: {
      ...f(rubik.style.fontFamily),
      fontWeight: 900,
      color: "#fff",
      ...stroke("#000", 4),
      ...shadow("0 0 0 #ff5e1a, 3px 3px 0 #ff5e1a, -3px -3px 0 #ff5e1a, 3px -3px 0 #ff5e1a, -3px 3px 0 #ff5e1a, 0 4px 0 #ff5e1a, 4px 0 0 #ff5e1a"),
    },
  },
  {
    id: "hollow",
    name: "Hollow",
    group: "outline",
    note: "只有描边、中间镂空。做标题感的强调,不适合长句。",
    text: { ...f(archivo.style.fontFamily), color: "transparent", WebkitTextStroke: "2px #fff", ...shadow("0 2px 10px rgba(0,0,0,.35)") },
    upper: true,
  },

  /* ── 底框 ── */
  {
    id: "black-box",
    name: "Black box",
    group: "box",
    note: "黑底白字。TikTok 文字「填充背景」那一档,画面再乱都清楚。",
    text: { ...f(montserrat.style.fontFamily), fontWeight: 700, color: "#fff" },
    line: { ...BOX, background: "#000" },
  },
  {
    id: "white-box",
    name: "White box",
    group: "box",
    note: "白底黑字。TikTok / Instagram 最经典的背景字,小红书也常见。",
    text: { ...f(montserrat.style.fontFamily), fontWeight: 700, color: "#111" },
    line: { ...BOX, background: "#fff" },
  },
  {
    id: "translucent-box",
    name: "Translucent box",
    group: "box",
    note: "半透明黑底。接近 YouTube 自动字幕,稳妥、存在感低。",
    text: { ...f(poppins.style.fontFamily), fontWeight: 600, color: "#fff" },
    line: { ...BOX, borderRadius: "0.2em", background: "rgba(0,0,0,0.55)" },
  },
  {
    id: "yellow-box",
    name: "Yellow box",
    group: "box",
    note: "黄底黑字。促销、口播干货常用,和黑白画面对比最强。",
    text: { ...f(montserrat.style.fontFamily), fontWeight: 800, color: "#111" },
    line: { ...BOX, background: "#ffe600" },
  },
  {
    id: "brand-pill",
    name: "Brand pill",
    group: "box",
    note: "品牌色圆角胶囊底。统一品牌视觉时用,颜色可换成客户品牌色。",
    text: { ...f(poppins.style.fontFamily), fontWeight: 700, color: "#fff" },
    line: { ...BOX, padding: "0.18em 0.8em", borderRadius: "999px", background: "#ff5e1a" },
  },
  {
    id: "highlighter",
    name: "Highlighter",
    group: "box",
    note: "荧光笔划过的效果:字底下半截有一条色块。笔记 / 教程类很常见。",
    text: { ...f(montserrat.style.fontFamily), fontWeight: 800, color: "#111" },
    line: { padding: "0 0.2em", background: "linear-gradient(transparent 45%, #b6ff3b 45%, #b6ff3b 90%, transparent 90%)", boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" },
  },
  {
    id: "tilted-sticker",
    name: "Sticker",
    group: "box",
    note: "白底黑字 + 轻微倾斜 + 硬投影,像贴上去的贴纸。",
    text: { ...f(archivo.style.fontFamily), color: "#111" },
    line: { ...BOX, background: "#fff", boxShadow: "3px 3px 0 #111", display: "inline-block", transform: "rotate(-3deg)" },
  },

  /* ── 博主同款(CapCut / Submagic 的热门模板)── */
  {
    id: "hormozi",
    name: "Hormozi",
    group: "creator",
    note: "Alex Hormozi 同款:粗体全大写、字距拉开,关键词换成黄 / 绿色。商业、干货口播的标配。",
    text: { ...f(montserrat.style.fontFamily), fontWeight: 900, color: "#fff", letterSpacing: "0.04em", ...stroke("#000", 5) },
    key: { color: "#3bff5f" },
    upper: true,
  },
  {
    id: "mrbeast",
    name: "Beast",
    group: "creator",
    note: "MrBeast 同款:圆胖的漫画粗体 + 厚黑边,关键词换亮色。娱乐、挑战类。",
    text: { ...f(luckiest.style.fontFamily), color: "#fff", letterSpacing: "0.02em", ...stroke("#000", 6), ...shadow("0 4px 0 #000") },
    key: { color: "#ffe600" },
    upper: true,
  },
  {
    id: "ali-abdaal",
    name: "Ali",
    group: "creator",
    note: "Ali Abdaal 同款:Poppins 半粗、柔和阴影、小写。友好、好读,适合讲解和教程。",
    text: { ...f(poppins.style.fontFamily), fontWeight: 600, color: "#fff", letterSpacing: "0.01em", ...shadow("0 2px 12px rgba(0,0,0,.55)") },
  },
  {
    id: "iman",
    name: "Iman",
    group: "creator",
    note: "Iman Gadzhi 同款:细一些的全大写、字距很开、白字无底。显得高级克制。",
    text: { ...f(montserrat.style.fontFamily), fontWeight: 500, color: "#fff", letterSpacing: "0.16em", ...shadow("0 1px 8px rgba(0,0,0,.6)") },
    upper: true,
  },
  {
    id: "keyword-box",
    name: "Keyword box",
    group: "creator",
    note: "整句白字黑边,只把关键词放进彩色底框(Submagic Karl / Hormozi 系列的静态版)。",
    text: { ...f(montserrat.style.fontFamily), fontWeight: 800, color: "#fff", ...stroke("#000", 4) },
    key: { background: "#7c3aed", WebkitTextStroke: "0", padding: "0 0.25em", borderRadius: "0.2em" },
    upper: true,
  },
  {
    id: "two-tone",
    name: "Two tone",
    group: "creator",
    note: "上下两种颜色:关键词换成品牌色,其余白字。Devin 一类模板的静态版。",
    text: { ...f(bebas.style.fontFamily), color: "#fff", letterSpacing: "0.03em", ...shadow("0 3px 0 rgba(0,0,0,.55)") },
    key: { color: "#ff9563" },
    upper: true,
  },

  /* ── 平台自带文字样式(TikTok / Instagram)── */
  {
    id: "tiktok-classic",
    name: "TikTok Classic",
    group: "platform",
    note: "TikTok 自带 Classic:常规无衬线 + 细黑影。用户最眼熟的「原生感」。",
    text: { ...f("system-ui"), fontWeight: 700, color: "#fff", ...shadow("0 1px 2px rgba(0,0,0,.9)") },
  },
  {
    id: "typewriter",
    name: "Typewriter",
    group: "platform",
    note: "TikTok / Instagram 都有的打字机体。复古、日记感。",
    text: { ...f(courier.style.fontFamily), fontWeight: 700, color: "#fff" },
    line: { ...BOX, borderRadius: "0.15em", background: "rgba(0,0,0,0.6)" },
  },
  {
    id: "handwriting",
    name: "Handwriting",
    group: "platform",
    note: "手写体。TikTok 自带 Handwriting,适合 vlog 和温柔调性。",
    text: { ...f(caveat.style.fontFamily), fontWeight: 700, color: "#fff", fontSize: "1.25em", ...shadow("0 2px 6px rgba(0,0,0,.6)") },
  },
  {
    id: "neon",
    name: "Neon",
    group: "platform",
    note: "霓虹发光。TikTok / Instagram 都有,夜景、派对类。",
    text: { ...f(poppins.style.fontFamily), fontWeight: 700, color: "#fff", ...shadow("0 0 4px #ff3df2, 0 0 12px #ff3df2, 0 0 24px #ff3df2") },
  },
  {
    id: "serif-elegant",
    name: "Elegant serif",
    group: "platform",
    note: "衬线体。Instagram Elegant / TikTok Serif,美妆、奢品常用。",
    text: { ...f(playfair.style.fontFamily), fontWeight: 700, fontStyle: "italic", color: "#fff", ...shadow("0 2px 10px rgba(0,0,0,.55)") },
  },
  {
    id: "ig-strong",
    name: "Strong",
    group: "platform",
    note: "Instagram Strong:粗斜体全大写,运动、冲击感。",
    text: { ...f(archivo.style.fontFamily), fontStyle: "italic", color: "#fff", ...shadow("0 3px 0 rgba(0,0,0,.6)") },
    upper: true,
  },
  {
    id: "ig-modern",
    name: "Modern",
    group: "platform",
    note: "Instagram Modern:窄体全大写、字距开。简洁现代。",
    text: { ...f(oswald.style.fontFamily), fontWeight: 500, color: "#fff", letterSpacing: "0.1em", ...shadow("0 1px 6px rgba(0,0,0,.6)") },
    upper: true,
  },
  {
    id: "ig-bubble",
    name: "Bubble",
    group: "platform",
    note: "Instagram Bubble:圆体 + 彩色圆角底,活泼。",
    text: { ...f(fredoka.style.fontFamily), fontWeight: 700, color: "#fff" },
    line: { ...BOX, padding: "0.12em 0.6em", borderRadius: "0.6em", background: "#3b82f6" },
  },

  /* ── 阴影 ── */
  {
    id: "soft-shadow",
    name: "Soft shadow",
    group: "shadow",
    note: "白字 + 大范围柔和阴影,没有描边。画面干净的高级感做法。",
    text: { ...f(poppins.style.fontFamily), fontWeight: 700, color: "#fff", ...shadow("0 4px 18px rgba(0,0,0,.65)") },
  },
  {
    id: "hard-shadow",
    name: "Hard shadow",
    group: "shadow",
    note: "硬投影(右下偏移、不模糊)。复古海报感,比描边轻。",
    text: { ...f(archivo.style.fontFamily), color: "#fff", ...shadow("3px 3px 0 #000") },
    upper: true,
  },
  {
    id: "3d-extrude",
    name: "3D extrude",
    group: "shadow",
    note: "多层硬投影叠出立体厚度。标题、开场钩子。",
    text: {
      ...f(rubik.style.fontFamily),
      fontWeight: 900,
      color: "#ffe600",
      ...shadow("1px 1px 0 #d14a00, 2px 2px 0 #d14a00, 3px 3px 0 #d14a00, 4px 4px 0 #d14a00, 5px 5px 0 #d14a00, 6px 6px 6px rgba(0,0,0,.45)"),
    },
    upper: true,
  },
  {
    id: "glow",
    name: "Glow",
    group: "shadow",
    note: "白字 + 白色外发光。梦幻、护肤水润感。",
    text: { ...f(poppins.style.fontFamily), fontWeight: 700, color: "#fff", ...shadow("0 0 8px rgba(255,255,255,.9), 0 0 20px rgba(255,255,255,.6), 0 2px 6px rgba(0,0,0,.4)") },
  },

  /* ── 影视 / 高级感 ── */
  {
    id: "netflix",
    name: "Film subtitle",
    group: "cinema",
    note: "影视字幕规范:常规字重、细阴影、不加底。Netflix / 纪录片的样子,最不抢戏。",
    text: { ...f("system-ui"), fontWeight: 500, color: "#fff", ...shadow("0 1px 3px rgba(0,0,0,.95), 0 0 1px #000") },
  },
  {
    id: "cinematic-caps",
    name: "Cinematic",
    group: "cinema",
    note: "细体全大写、超大字距,电影片头的语气。适合品牌片。",
    text: { ...f(montserrat.style.fontFamily), fontWeight: 500, color: "#fff", letterSpacing: "0.32em", fontSize: "0.82em", ...shadow("0 1px 6px rgba(0,0,0,.7)") },
    upper: true,
  },
  {
    id: "editorial-serif",
    name: "Editorial",
    group: "cinema",
    note: "杂志感衬线正体 + 关键词斜体。时尚、奢品。",
    text: { ...f(playfair.style.fontFamily), fontWeight: 600, color: "#fff", ...shadow("0 2px 10px rgba(0,0,0,.5)") },
    key: { fontStyle: "italic", fontWeight: 800 },
  },
  {
    id: "lower-third",
    name: "Lower third",
    group: "cinema",
    note: "左侧一条品牌色竖线 + 深色底,像新闻 / 采访的人名条。",
    text: { ...f(poppins.style.fontFamily), fontWeight: 600, color: "#fff" },
    line: { padding: "0.18em 0.6em", background: "rgba(10,10,20,0.78)", borderLeft: "0.22em solid #ff5e1a", boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" },
  },

  /* ── 趣味 ── */
  {
    id: "comic",
    name: "Comic",
    group: "fun",
    note: "漫画字体黄字黑边。搞笑、反转类。",
    text: { ...f(bangers.style.fontFamily), color: "#ffe600", letterSpacing: "0.04em", fontSize: "1.1em", ...stroke("#000", 4), ...shadow("3px 3px 0 #000") },
    upper: true,
  },
  {
    id: "marker",
    name: "Marker",
    group: "fun",
    note: "马克笔手写,随手涂鸦感。开箱、测评。",
    text: { ...f(marker.style.fontFamily), color: "#fff", ...stroke("#000", 3) },
  },
  {
    id: "retro-script",
    name: "Retro script",
    group: "fun",
    note: "复古连笔 + 粉色投影,Y2K 风。",
    text: { ...f(pacifico.style.fontFamily), color: "#fff", ...shadow("3px 3px 0 #ff4fa3") },
  },
  {
    id: "rgb-split",
    name: "RGB split",
    group: "fun",
    note: "红蓝错位(静态故障风)。潮流、电子产品。",
    text: { ...f(archivo.style.fontFamily), color: "#fff", ...shadow("-2px 0 0 #ff2d55, 2px 0 0 #00e5ff") },
    upper: true,
  },
  {
    id: "cute-round",
    name: "Cute",
    group: "fun",
    note: "圆体白字 + 粉色粗描边,可爱风。母婴、宠物。",
    text: { ...f(fredoka.style.fontFamily), fontWeight: 700, color: "#fff", ...stroke("#ff6fa8", 6) },
  },

  /* ── 中文花字(抖音 / 小红书常见)── */
  {
    id: "cn-variety",
    name: "Variety",
    group: "cn",
    note: "综艺花字:黄字 + 红色描边 + 白色外描边 + 投影。抖音综艺剪辑最常见。",
    text: {
      fontFamily: CJK,
      fontWeight: 900,
      color: "#ffe600",
      ...stroke("#e8202a", 5),
      ...shadow("0 0 0 #fff, 2px 2px 0 #fff, -2px -2px 0 #fff, 2px -2px 0 #fff, -2px 2px 0 #fff, 0 5px 6px rgba(0,0,0,.4)"),
    },
  },
  {
    id: "cn-xhs",
    name: "Notes",
    group: "cn",
    note: "小红书风:白色圆角底 + 黑字,关键词标红。种草笔记感。",
    text: { fontFamily: CJK, fontWeight: 700, color: "#111" },
    line: { ...BOX, borderRadius: "0.45em", background: "#fff" },
    key: { color: "#ff2442" },
  },
  {
    id: "cn-douyin-yellow",
    name: "Douyin yellow",
    group: "cn",
    note: "抖音口播常见:黄字 + 黑色粗描边,关键词白色。",
    text: { fontFamily: CJK, fontWeight: 900, color: "#ffe600", ...stroke("#000", 5) },
    key: { color: "#fff" },
  },
  {
    id: "cn-pink-bubble",
    name: "Pink bubble",
    group: "cn",
    note: "粉色描边 + 白字,甜美系美妆常用。",
    text: { fontFamily: CJK, fontWeight: 900, color: "#fff", ...stroke("#ff5c9a", 6), ...shadow("0 3px 0 rgba(255,92,154,.45)") },
  },
];

/** 按样式渲染一句示例台词;*包起来* 的词用关键词样式 */
export function CatalogCaption({ style: s, text, className = "" }: { style: CatalogStyle; text: string; className?: string }) {
  const shown = s.upper ? text.toUpperCase() : text;
  const parts = shown.split(/(\*[^*]+\*)/).filter(Boolean);
  return (
    <span className={`inline leading-snug ${className}`} style={{ ...s.text, ...s.line }}>
      {parts.map((p, i) =>
        p.startsWith("*") ? (
          <span key={i} style={s.key}>
            {p.slice(1, -1)}
          </span>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </span>
  );
}
