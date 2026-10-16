"use client";

/* 字卡(屏幕文字)样式候选库(2026-09-29 调研)。字卡 ≠ 字幕:这里是设计出来的钩子标题、卖点、价格、口碑、CTA。
   来源:TikTok / Instagram 自带文字样式、CapCut 文字模板与剪映花字、Canva 文字特效、Submagic 预设、
   RocketShip HQ 等投放素材指南里常见的 UGC 广告字卡。全部是静态外观;原本靠动效定义的(打字、倒计时、上滑)只做它停住时的样子。
   Monica 在页面上挑,挑中的再进剪辑器的 CARD_STYLES(src/lib/hybrid-reel/cards.ts + canvas/cards.tsx)。 */

import type { CSSProperties, ReactNode } from "react";
import {
  Anton,
  Luckiest_Guy,
  Montserrat,
  Oswald,
  Rubik,
} from "next/font/google";
import { Link2 } from "lucide-react";

const anton = Anton({ weight: "400", subsets: ["latin"], display: "swap" });
const luckiest = Luckiest_Guy({ weight: "400", subsets: ["latin"], display: "swap" });
const montserrat = Montserrat({ weight: ["500", "600", "700", "800", "900"], style: ["normal", "italic"], subsets: ["latin"], display: "swap" });
const oswald = Oswald({ weight: ["600", "700"], subsets: ["latin"], display: "swap" });
const rubik = Rubik({ weight: ["700", "800", "900"], subsets: ["latin"], display: "swap" });

const CJK = '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';
const SYS = `-apple-system, "SF Pro Text", "Helvetica Neue", ${CJK}`;
const f = (family: string): CSSProperties => ({ fontFamily: `${family}, ${CJK}`, fontSynthesis: "none" });
const sys: CSSProperties = { fontFamily: SYS };

const ring = (c: string, w: number) =>
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
const stroke = (c: string, w: number): CSSProperties => ({ WebkitTextStroke: `${w}px ${c}`, paintOrder: "stroke fill" });

export type Group = "native" | "hook" | "selling" | "price" | "proof" | "cta";

export const GROUPS: { id: Group; zh: string }[] = [
  { id: "native", zh: "平台原生 / 仿 App" },
  { id: "hook", zh: "钩子标题" },
  { id: "selling", zh: "卖点 / 标注" },
  { id: "price", zh: "价格 / 优惠" },
  { id: "proof", zh: "口碑 / 背书" },
  { id: "cta", zh: "行动号召" },
];

type Sample = { en: string; zh: string };
export type TextStyle = {
  id: string;
  name: string;
  group: Group;
  /** 哪里流行、广告里拿来干什么 */
  note: string;
  /** 做法要点(给开发 / 评审看) */
  recipe: string;
  source: string;
  sample: Sample;
  render: (text: string) => ReactNode;
};

/* 每行各自包底框(TikTok 经典框) */
const clone: CSSProperties = { boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" };

export const STYLES: TextStyle[] = [
  /* ── 平台原生 / 仿 App ── */
  {
    id: "tiktok-box",
    name: "TikTok box",
    group: "native",
    note: "TikTok 自带的经典白底文字,每行一个框。TikTok 投放里最常见的开头钩子,越像原生越不像广告。",
    recipe: "系统无衬线 Semibold,句首大写;白底黑字,每行各自包一个 8px 圆角框(box-decoration-break: clone)",
    source: "TikTok · Kapwing",
    sample: { en: "I tried every serum so you don't have to", zh: "试遍所有精华\n只留下这一瓶" },
    render: (t) => (
      <span className="whitespace-pre-line leading-[1.5]" style={{ ...sys, fontWeight: 600, fontSize: "1.05em" }}>
        <span className="rounded-[0.35em] bg-white px-[0.45em] py-[0.12em] text-[#111]" style={clone}>
          {t}
        </span>
      </span>
    ),
  },
  {
    id: "tiktok-outline",
    name: "TikTok outline",
    group: "native",
    note: "TikTok 无底框样式:白字细黑边。口播 UGC 的「自然感」字卡。",
    recipe: "系统无衬线 Semibold,白字 + 2px 黑色描边(8 方向 text-shadow)",
    source: "TikTok",
    sample: { en: "3 weeks later…", zh: "用了三周后…" },
    render: (t) => (
      <span style={{ ...sys, fontWeight: 600, fontSize: "1.2em", color: "#fff", textShadow: ring("#000", 1.6) }}>{t}</span>
    ),
  },
  {
    id: "ig-strong",
    name: "IG Strong",
    group: "native",
    note: "Instagram Strong:粗斜压缩体全大写 + 色块。强观点、大字报。",
    recipe: "Oswald 700 斜体(skew -8°),全大写,行距紧;强调色实底,深色强调色配白字、浅色配深字",
    source: "Instagram",
    sample: { en: "Stop wasting money", zh: "别再乱花钱" },
    render: (t) => (
      <span className="inline-block px-[0.4em] py-[0.05em]" style={{ background: "#ff3b30" }}>
        <span className={`${oswald.className} block -skew-x-[8deg]`} style={{ ...f(oswald.style.fontFamily), fontWeight: 700, fontSize: "1.5em", lineHeight: 1.05, textTransform: "uppercase", color: "#fff" }}>
          {t}
        </span>
      </span>
    ),
  },
  {
    id: "comment-reply",
    name: "Comment reply",
    group: "native",
    note: "TikTok「回复 @xx 的评论」气泡。UGC 广告头号钩子:借用户的疑问开场,再用视频回答。",
    recipe: "白色 0.7em 圆角卡片 + 柔阴影;顶部灰色小字「Replying to a comment」,正文黑色 Semibold 左对齐,左下角小尾巴",
    source: "TikTok · MB Adv",
    sample: { en: "Does it actually work on oily skin??", zh: "油皮用真的有用吗??" },
    render: (t) => (
      <span className="relative inline-block max-w-[16em] rounded-[0.7em] bg-white px-[0.8em] py-[0.55em] text-left shadow-[0_6px_18px_rgba(0,0,0,.22)]" style={sys}>
        <span className="block text-[0.62em] font-medium text-[#8a8b99]">Reply to @jess.skin&apos;s comment</span>
        <span className="mt-[0.15em] block text-[0.95em] font-semibold leading-snug text-[#111]">{t}</span>
        <span className="absolute -bottom-[0.35em] left-[1em] size-[0.8em] rotate-45 bg-white" />
      </span>
    ),
  },
  {
    id: "imessage",
    name: "Chat bubble",
    group: "native",
    note: "仿 iMessage 聊天气泡,常叠 2–4 条。「朋友发消息问我…」类开场。",
    recipe: "1.1em 大圆角气泡(左下角收小当尾巴),系统字体,灰底 #E9E9EB 黑字;剪辑器里一张字卡一个气泡",
    source: "UGC 广告",
    sample: { en: "what are you using on your skin?", zh: "你最近用什么护肤品?" },
    render: (t) => (
      <span className="inline-flex flex-col items-stretch gap-[0.3em] text-left" style={{ ...sys, fontSize: "0.95em" }}>
        <span className="self-start rounded-[1.1em] rounded-bl-[0.3em] bg-[#E9E9EB] px-[0.75em] py-[0.4em] text-[#111]">{t}</span>
        <span className="self-end rounded-[1.1em] rounded-br-[0.3em] bg-[#0A84FF] px-[0.75em] py-[0.4em] text-white">omg let me show you 😭</span>
      </span>
    ),
  },
  {
    id: "hormozi",
    name: "Hormozi bold",
    group: "hook",
    note: "Alex Hormozi 同款:压缩粗体全大写 + 厚黑边,关键词换黄色。1–3 个词,信息流里最抓眼。",
    recipe: "Anton,全大写;白字 + 5px 黑描边(text-stroke,描边在填色下)+ 投影;关键词 #FFE500",
    source: "Submagic",
    sample: { en: "This changed *everything*", zh: "这瓶*改变了一切*" },
    render: (t) => <Keyword text={t} base={{ ...f(anton.style.fontFamily), fontSize: "2em", lineHeight: 1, textTransform: "uppercase", color: "#fff", ...stroke("#000", 6), textShadow: "0 4px 0 rgba(0,0,0,.6)" }} hi={{ color: "#FFE500" }} className={anton.className} />,
  },
  {
    id: "beast-pop",
    name: "Beast pop",
    group: "hook",
    note: "MrBeast 同款标题:圆胖漫画体 + 厚黑边 + 硬投影,微微倾斜。YouTube Shorts 开场。",
    recipe: "Luckiest Guy,全大写,rotate(-3deg);黄字 + 6px 黑描边 + (0,5px) 黑色硬投影",
    source: "YouTube Shorts",
    sample: { en: "I can't believe this", zh: "简直不敢相信" },
    render: (t) => (
      <span className={`${luckiest.className} inline-block -rotate-3`} style={{ ...f(luckiest.style.fontFamily), fontSize: "1.8em", lineHeight: 1.05, textTransform: "uppercase", color: "#FFE14D", ...stroke("#000", 7), textShadow: "0 5px 0 #000" }}>
        {t}
      </span>
    ),
  },
  {
    id: "pov",
    name: "POV hook",
    group: "hook",
    note: "「POV:」开场:格式本身就是样式,前缀加粗,放画面上三分之一。",
    recipe: "系统字;「POV:」Bold,后半句 Medium;白字细黑边,无底框",
    source: "TikTok",
    sample: { en: "you finally found a serum that works", zh: "你终于找到一瓶有用的精华" },
    render: (t) => (
      <span style={{ ...sys, fontSize: "1.15em", color: "#fff", textShadow: ring("#000", 1.4) }}>
        <span className="font-extrabold">POV: </span>
        <span className="font-medium">{t}</span>
      </span>
    ),
  },
  {
    id: "huazi",
    name: "Variety 花字",
    group: "hook",
    note: "剪映 / 综艺花字:渐变字 + 白色内描边 + 彩色外描边 + 立体投影,倾斜。电商、综艺感。",
    recipe: "Rubik 900;黄→橙渐变填色(background-clip:text);白色 3px 内描边 + #e0301e 外描边(text-shadow 叠两圈)+ 4px 硬投影;rotate(-4deg)",
    source: "剪映 · Canva",
    sample: { en: "So good!!", zh: "绝绝子!!" },
    render: (t) => (
      <span className="relative inline-block -rotate-[4deg]" style={{ ...f(rubik.style.fontFamily), fontWeight: 900, fontSize: "2em", lineHeight: 1.1 }}>
        <span aria-hidden className={`${rubik.className} absolute inset-0`} style={{ color: "#fff", ...stroke("#e0301e", 12), textShadow: "0 5px 0 #7a1208" }}>
          {t}
        </span>
        <span aria-hidden className={`${rubik.className} absolute inset-0`} style={{ color: "#fff", ...stroke("#fff", 6) }}>
          {t}
        </span>
        <span className={`${rubik.className} relative bg-gradient-to-b from-[#FFE14D] to-[#FF8A00] bg-clip-text text-transparent`}>{t}</span>
      </span>
    ),
  },
  {
    id: "neon",
    name: "Neon",
    group: "hook",
    note: "霓虹发光字:白芯 + 彩色外发光。夜景、派对、潮流。",
    recipe: "Montserrat 600;白字,text-shadow 0 0 4px #fff, 0 0 12px #ff3df2, 0 0 26px #ff3df2",
    source: "Instagram · TikTok · Canva",
    sample: { en: "Glow mode on", zh: "发光模式开启" },
    render: (t) => (
      <span className={montserrat.className} style={{ ...f(montserrat.style.fontFamily), fontWeight: 600, fontSize: "1.5em", color: "#fff", textShadow: "0 0 4px #fff, 0 0 12px #ff3df2, 0 0 26px #ff3df2, 0 0 40px #ff3df2" }}>
        {t}
      </span>
    ),
  },
  {
    id: "link-in-bio",
    name: "Link in bio",
    group: "cta",
    note: "「链接在主页」:原生白框 + 🔗 / 👇,放在底部安全区上方。自然流量转化。",
    recipe: "TikTok 白框同款(系统字 Semibold),前面 Link 图标,后缀 👇",
    source: "TikTok · Instagram",
    sample: { en: "Link in bio 👇", zh: "链接在主页 👇" },
    render: (t) => (
      <span className="inline-flex items-center gap-[0.35em] rounded-[0.35em] bg-white px-[0.55em] py-[0.2em] text-[#111]" style={{ ...sys, fontWeight: 600, fontSize: "1em" }}>
        <Link2 className="size-[1em]" />
        {t}
      </span>
    ),
  },
];

/** 示例文案里 *包起来* 的那段单独上样式 */
function Keyword({ text, base, hi, className = "" }: { text: string; base: CSSProperties; hi: CSSProperties; className?: string }) {
  const parts = text.split(/\*(.+?)\*/);
  return (
    <span className={className} style={base}>
      {parts.map((p, i) =>
        i % 2 ? (
          <span key={i} style={hi}>
            {p}
          </span>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </span>
  );
}
