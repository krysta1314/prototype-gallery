"use client";

/* 字卡(屏幕文字)样式候选库(2026-09-29 调研)。字卡 ≠ 字幕:这里是设计出来的钩子标题、卖点、价格、口碑、CTA。
   来源:TikTok / Instagram 自带文字样式、CapCut 文字模板与剪映花字、Canva 文字特效、Submagic 预设、
   RocketShip HQ 等投放素材指南里常见的 UGC 广告字卡。全部是静态外观;原本靠动效定义的(打字、倒计时、上滑)只做它停住时的样子。
   Monica 在页面上挑,挑中的再进剪辑器的 CARD_STYLES(src/lib/hybrid-reel/cards.ts + canvas/cards.tsx)。 */

import type { CSSProperties, ReactNode } from "react";
import {
  Anton,
  Archivo_Black,
  Bodoni_Moda,
  Caveat,
  Courier_Prime,
  EB_Garamond,
  Fredoka,
  Luckiest_Guy,
  Montserrat,
  Oswald,
  Permanent_Marker,
  Playfair_Display,
  Rubik,
} from "next/font/google";
import { ArrowRight, BadgeCheck, Bell, Check, ChevronUp, Link2, Search, Star, X } from "lucide-react";

const anton = Anton({ weight: "400", subsets: ["latin"], display: "swap" });
const archivo = Archivo_Black({ weight: "400", subsets: ["latin"], display: "swap" });
const bodoni = Bodoni_Moda({ weight: ["500", "700"], subsets: ["latin"], display: "swap" });
const caveat = Caveat({ weight: ["600", "700"], subsets: ["latin"], display: "swap" });
const courier = Courier_Prime({ weight: ["400", "700"], subsets: ["latin"], display: "swap" });
const garamond = EB_Garamond({ weight: ["500", "600"], style: ["normal", "italic"], subsets: ["latin"], display: "swap" });
const fredoka = Fredoka({ weight: ["600", "700"], subsets: ["latin"], display: "swap" });
const luckiest = Luckiest_Guy({ weight: "400", subsets: ["latin"], display: "swap" });
const montserrat = Montserrat({ weight: ["500", "600", "700", "800", "900"], style: ["normal", "italic"], subsets: ["latin"], display: "swap" });
const oswald = Oswald({ weight: ["600", "700"], subsets: ["latin"], display: "swap" });
const marker = Permanent_Marker({ weight: "400", subsets: ["latin"], display: "swap" });
const playfair = Playfair_Display({ weight: ["600", "700"], style: ["normal", "italic"], subsets: ["latin"], display: "swap" });
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
    id: "ig-modern",
    name: "IG Modern",
    group: "native",
    note: "Instagram Modern:宽体全大写、略拉开字距。品牌 / 生活方式 Reels 常用。",
    recipe: "Montserrat 700,全大写,字距 0.12em,白字,可加纯色底",
    source: "Instagram",
    sample: { en: "Morning routine", zh: "晨间护肤流程" },
    render: (t) => (
      <span className={montserrat.className} style={{ ...f(montserrat.style.fontFamily), fontWeight: 700, fontSize: "1.15em", letterSpacing: "0.12em", textTransform: "uppercase", color: "#fff", textShadow: "0 2px 10px rgba(0,0,0,.35)" }}>
        {t}
      </span>
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
    id: "ig-directional",
    name: "IG Directional",
    group: "native",
    note: "Instagram Directional:斜着走的一行大写字,旅行、运动内容。",
    recipe: "Archivo Black,全大写,整行 rotate(-6deg);白字 + 硬投影",
    source: "Instagram",
    sample: { en: "Next stop: glow", zh: "下一站 · 发光肌" },
    render: (t) => (
      <span className={`${archivo.className} inline-block -rotate-6`} style={{ ...f(archivo.style.fontFamily), fontSize: "1.3em", textTransform: "uppercase", color: "#fff", textShadow: "3px 3px 0 rgba(0,0,0,.55)" }}>
        {t}
      </span>
    ),
  },
  {
    id: "ig-typewriter",
    name: "Typewriter",
    group: "native",
    note: "Instagram / TikTok 打字机体:小写等宽字,日记感、冷幽默。",
    recipe: "Courier Prime 400,小写,白底黑字 3px 小圆角",
    source: "Instagram · TikTok",
    sample: { en: "day 1. skin: chaos.", zh: "第 1 天。皮肤:崩溃。" },
    render: (t) => (
      <span className={`${courier.className} rounded-[3px] bg-white px-[0.5em] py-[0.2em] text-[#111]`} style={{ ...f(courier.style.fontFamily), fontSize: "1.05em", textTransform: "lowercase", ...clone }}>
        {t}
      </span>
    ),
  },
  {
    id: "ig-literature",
    name: "Literature",
    group: "native",
    note: "Instagram Literature:书卷气衬线,不加底,讲故事、引语。",
    recipe: "EB Garamond 500,句首大写,白字 + 柔和阴影",
    source: "Instagram",
    sample: { en: "It started with one small bottle", zh: "故事从一小瓶开始" },
    render: (t) => (
      <span className={garamond.className} style={{ ...f(garamond.style.fontFamily), fontWeight: 500, fontSize: "1.35em", color: "#fff", textShadow: "0 2px 12px rgba(0,0,0,.5)" }}>
        {t}
      </span>
    ),
  },
  {
    id: "ig-elegant",
    name: "Elegant",
    group: "native",
    note: "Instagram Elegant:高反差迪多体,全大写宽字距。美妆、奢品。",
    recipe: "Bodoni Moda 500,全大写,字距 0.18em,白字",
    source: "Instagram",
    sample: { en: "The glow edit", zh: "光感精选" },
    render: (t) => (
      <span className={bodoni.className} style={{ ...f(bodoni.style.fontFamily), fontWeight: 500, fontSize: "1.4em", letterSpacing: "0.18em", textTransform: "uppercase", color: "#fff", textShadow: "0 2px 12px rgba(0,0,0,.45)" }}>
        {t}
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
    id: "notification",
    name: "Notification",
    group: "native",
    note: "仿手机推送通知:毛玻璃卡片 + App 图标。发货、降价、限时类的紧迫感钩子。",
    recipe: "rgba(255,255,255,.75) + backdrop-filter blur,1.1em 圆角;左侧强调色铃铛图标,Semibold 正文,右上灰色「now」",
    source: "UGC 广告",
    sample: { en: "Your order is on its way 📦", zh: "你的订单已发货 📦" },
    render: (t) => (
      <span className="inline-flex w-[17em] max-w-full items-start gap-[0.55em] rounded-[1.1em] bg-white/75 px-[0.7em] py-[0.6em] text-left shadow-[0_8px_24px_rgba(0,0,0,.2)] backdrop-blur-md" style={{ ...sys, fontSize: "0.85em" }}>
        <span className="grid size-[2.1em] shrink-0 place-items-center rounded-[0.5em] bg-gradient-to-br from-[#FFA73C] to-[#FF5255] text-white">
          <Bell className="size-[1.1em]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className="font-semibold text-[#111]">Glow Lab</span>
            <span className="text-[0.8em] text-[#8a8b99]">now</span>
          </span>
          <span className="block leading-snug text-[#222]">{t}</span>
        </span>
      </span>
    ),
  },
  {
    id: "search-bar",
    name: "Search bar",
    group: "native",
    note: "仿搜索框:把用户会搜的问题打出来。原本靠打字动画,这里是打完停住的样子。",
    recipe: "白色胶囊,左侧灰色放大镜,深色系统字,末尾一根光标竖线",
    source: "TikTok · UGC",
    sample: { en: "how to fix dry skin fast", zh: "干皮怎么快速补水" },
    render: (t) => (
      <span className="inline-flex items-center gap-[0.45em] rounded-full bg-white px-[0.9em] py-[0.5em] text-[#222] shadow-[0_6px_18px_rgba(0,0,0,.2)]" style={{ ...sys, fontSize: "0.95em" }}>
        <Search className="size-[1em] shrink-0 text-[#8a8b99]" />
        <span>{t}</span>
        <span className="h-[1.1em] w-[2px] bg-[#0A84FF]" />
      </span>
    ),
  },
  {
    id: "notes-card",
    name: "Notes card",
    group: "native",
    note: "仿备忘录:暖白卡片 + 粗标题 + 列表。「我早该知道的几件事」清单类。",
    recipe: "#FFFBEA 卡片 12px 圆角,顶部黄色「Notes」条;系统字 Bold 标题 + 常规列表",
    source: "TikTok · UGC",
    sample: { en: "Things I wish I knew", zh: "早知道就好了" },
    render: (t) => (
      <span className="inline-block w-[14em] max-w-full overflow-hidden rounded-[0.7em] bg-[#FFFBEA] text-left shadow-[0_6px_18px_rgba(0,0,0,.2)]" style={{ ...sys, fontSize: "0.9em" }}>
        <span className="block bg-[#FFD60A] px-[0.8em] py-[0.25em] text-[0.7em] font-semibold text-[#5a4600]">Notes</span>
        <span className="block px-[0.8em] pb-[0.6em] pt-[0.4em]">
          <span className="block font-bold text-[#111]">{t}</span>
          <span className="mt-[0.2em] block text-[0.85em] leading-relaxed text-[#444]">1. SPF every day<br />2. Less is more</span>
        </span>
      </span>
    ),
  },
  {
    id: "poll",
    name: "Poll sticker",
    group: "native",
    note: "仿 Instagram 投票贴纸:问题 + 两个选项。互动钩子,「你选哪个」。",
    recipe: "白色圆角卡,顶部 IG 紫橙渐变条放问题(白色粗体),下方两个选项胶囊带百分比",
    source: "Instagram",
    sample: { en: "Which one would you pick?", zh: "你会选哪个?" },
    render: (t) => (
      <span className="inline-block w-[13em] max-w-full overflow-hidden rounded-[0.8em] bg-white text-center shadow-[0_6px_18px_rgba(0,0,0,.22)]" style={{ ...sys, fontSize: "0.9em" }}>
        <span className="block bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] px-[0.7em] py-[0.5em] font-bold text-white">{t}</span>
        <span className="flex gap-[0.4em] p-[0.5em] text-[0.85em] font-semibold">
          <span className="flex-1 rounded-full bg-[#f1f1f4] py-[0.3em] text-[#111]">A · 68%</span>
          <span className="flex-1 rounded-full bg-[#f1f1f4] py-[0.3em] text-[#111]">B · 32%</span>
        </span>
      </span>
    ),
  },

  /* ── 钩子标题 ── */
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
    id: "wait-for-it",
    name: "Wait for it",
    group: "hook",
    note: "「等等看」提示条:小白框 + 表情,放上三分之一,揭晓时撤掉。留存钩子。",
    recipe: "TikTok 白框同款(系统字 Semibold,8px 圆角),句尾 👀 表情",
    source: "TikTok",
    sample: { en: "Wait for the result 👀", zh: "看到最后 👀" },
    render: (t) => (
      <span className="rounded-[0.35em] bg-white px-[0.5em] py-[0.15em] text-[#111]" style={{ ...sys, fontWeight: 600, fontSize: "1em" }}>
        {t}
      </span>
    ),
  },
  {
    id: "keyword",
    name: "Keyword pop",
    group: "hook",
    note: "一句普通字 + 一个放大上色的关键词,例如「这瓶 $12 的精华」。价格 / 数字 / 痛点词最常用。",
    recipe: "Montserrat 700 白字;关键词 Montserrat 900,放大 1.35 倍,强调色实底白字,微倾斜 -2°",
    source: "UGC 广告",
    sample: { en: "This *$12* serum beat my $80 one", zh: "这瓶*¥89*的精华赢了大牌" },
    render: (t) => (
      <Keyword
        text={t}
        className={montserrat.className}
        base={{ ...f(montserrat.style.fontFamily), fontWeight: 700, fontSize: "1.15em", color: "#fff", textShadow: "0 2px 10px rgba(0,0,0,.5)" }}
        hi={{ display: "inline-block", fontWeight: 900, fontSize: "1.35em", background: "#ff5e1a", color: "#fff", padding: "0 0.25em", transform: "rotate(-2deg)", textShadow: "none" }}
      />
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
    id: "echo",
    name: "Hollow echo",
    group: "hook",
    note: "Canva Echo / Hollow:镂空描边大字向下叠几层,越来越淡。品牌标题、时尚。",
    recipe: "Archivo Black 全大写;顶层白色实心,下面 3 层透明填色 + 1.5px 白描边,每层下移 0.55em、透明度递减",
    source: "Canva",
    sample: { en: "New drop", zh: "新品上市" },
    render: (t) => (
      <span className={`${archivo.className} relative inline-block`} style={{ ...f(archivo.style.fontFamily), fontSize: "1.8em", lineHeight: 1, textTransform: "uppercase" }}>
        {[3, 2, 1].map((i) => (
          <span key={i} aria-hidden className="absolute left-0 whitespace-nowrap" style={{ top: `${i * 0.55}em`, color: "transparent", WebkitTextStroke: "1.5px #fff", opacity: 1 - i * 0.25 }}>
            {t}
          </span>
        ))}
        <span className="relative whitespace-nowrap text-white">{t}</span>
      </span>
    ),
  },
  {
    id: "splice",
    name: "Splice",
    group: "hook",
    note: "Canva Splice:实心字 + 错位的描边复制,复古、俏皮。",
    recipe: "Rubik 900 白字;后面一层同字透明填色 + 2px 强调色描边,向右下偏移 0.08em",
    source: "Canva",
    sample: { en: "Game changer", zh: "颠覆认知" },
    render: (t) => (
      <span className={`${rubik.className} relative inline-block`} style={{ ...f(rubik.style.fontFamily), fontWeight: 900, fontSize: "1.8em", lineHeight: 1.05 }}>
        <span aria-hidden className="absolute left-[0.08em] top-[0.08em] whitespace-nowrap text-transparent" style={{ WebkitTextStroke: "2px #ff5e1a" }}>
          {t}
        </span>
        <span className="relative whitespace-nowrap text-white">{t}</span>
      </span>
    ),
  },
  {
    id: "glitch",
    name: "Glitch",
    group: "hook",
    note: "RGB 错位故障字:红、青两色往两边偏。科技、游戏。通常配抖动动画。",
    recipe: "Archivo Black 全大写白字;text-shadow -2px 0 #ff2a55, 2px 0 #00e5ff",
    source: "Canva · CapCut",
    sample: { en: "Next level tech", zh: "黑科技" },
    render: (t) => (
      <span className={archivo.className} style={{ ...f(archivo.style.fontFamily), fontSize: "1.6em", textTransform: "uppercase", color: "#fff", textShadow: "-3px 0 #ff2a55, 3px 0 #00e5ff" }}>
        {t}
      </span>
    ),
  },

  /* ── 卖点 / 标注 ── */
  {
    id: "marker",
    name: "Marker",
    group: "selling",
    note: "荧光笔划重点:文字下半截一道手绘感的黄色笔触。核心卖点那一句。",
    recipe: "Montserrat 800 深色字;背景 linear-gradient(transparent 45%, #FFE14D 45%),行尾两端圆角,微旋转 -1°",
    source: "UGC 广告",
    sample: { en: "Absorbs in 3 seconds", zh: "3 秒就吸收" },
    render: (t) => (
      <span className={`${montserrat.className} inline-block -rotate-1 rounded-[0.3em] bg-white/90 px-[0.35em] py-[0.1em]`} style={{ ...f(montserrat.style.fontFamily), fontWeight: 800, fontSize: "1.2em", color: "#111" }}>
        <span className="rounded-[0.2em] px-[0.1em]" style={{ backgroundImage: "linear-gradient(transparent 45%, #FFE14D 45%, #FFE14D 92%, transparent 92%)" }}>
          {t}
        </span>
      </span>
    ),
  },
  {
    id: "tape",
    name: "Tape label",
    group: "selling",
    note: "和纸胶带标签:半透明胶带斜贴,锯齿边。氛围感 UGC,「Day 1」这类标签。",
    recipe: "rgba(245,230,200,.88) 矩形,两端 clip-path 锯齿;rotate(-4deg);Courier Prime 深棕字",
    source: "UGC · Canva",
    sample: { en: "Day 1 of 30", zh: "打卡第 1 天" },
    render: (t) => (
      <span
        className={`${courier.className} inline-block -rotate-[4deg] px-[1em] py-[0.35em]`}
        style={{
          ...f(courier.style.fontFamily),
          fontWeight: 700,
          fontSize: "1.1em",
          color: "#4a3520",
          background: "rgba(245,230,200,.9)",
          clipPath: "polygon(0 8%, 4% 0, 8% 10%, 12% 0, 88% 0, 92% 10%, 96% 0, 100% 8%, 100% 92%, 96% 100%, 92% 90%, 88% 100%, 12% 100%, 8% 90%, 4% 100%, 0 92%)",
        }}
      >
        {t}
      </span>
    ),
  },
  {
    id: "sticky-note",
    name: "Sticky note",
    group: "selling",
    note: "便利贴:浅黄方块 + 手写字,微倾斜带卷角阴影。小贴士、提醒。",
    recipe: "#FFF475 方块,Caveat 700 手写字,rotate(3deg),底部偏重的投影模拟卷角",
    source: "UGC · Canva",
    sample: { en: "Tip: apply on damp skin!", zh: "小贴士:趁脸湿的时候涂!" },
    render: (t) => (
      <span className={`${caveat.className} inline-block w-[9em] max-w-full rotate-3 px-[0.7em] py-[0.8em] text-left leading-tight`} style={{ ...f(caveat.style.fontFamily), fontWeight: 700, fontSize: "1.3em", color: "#2a2a2a", background: "#FFF475", boxShadow: "0 12px 14px -8px rgba(0,0,0,.45)" }}>
        {t}
      </span>
    ),
  },
  {
    id: "checklist",
    name: "Checklist",
    group: "selling",
    note: "对勾清单:绿色对勾一条条列卖点,可带红叉对比。「里面有什么」「我们 vs 别家」。",
    recipe: "深色半透明卡片 12px 圆角;每行绿色圆形 ✓ + Montserrat 700 白字,左对齐;对比项红色 ✗ + 删除线",
    source: "UGC 广告",
    sample: { en: "No fragrance", zh: "0 香精" },
    render: (t) => (
      <span className={`${montserrat.className} inline-flex flex-col gap-[0.35em] rounded-[0.7em] bg-black/55 px-[0.8em] py-[0.6em] text-left backdrop-blur`} style={{ ...f(montserrat.style.fontFamily), fontWeight: 700, fontSize: "0.95em", color: "#fff" }}>
        {[t, "Vegan"].map((x) => (
          <span key={x} className="flex items-center gap-[0.45em]">
            <span className="grid size-[1.1em] place-items-center rounded-full bg-[#22c55e]">
              <Check className="size-[0.75em]" strokeWidth={3.5} />
            </span>
            {x}
          </span>
        ))}
        <span className="flex items-center gap-[0.45em] text-white/60 line-through decoration-[#ef4444] decoration-2">
          <span className="grid size-[1.1em] place-items-center rounded-full bg-[#ef4444] text-white">
            <X className="size-[0.75em]" strokeWidth={3.5} />
          </span>
          Parabens
        </span>
      </span>
    ),
  },
  {
    id: "step",
    name: "Step badge",
    group: "selling",
    note: "步骤编号:品牌色圆形数字 + 右侧说明。教程、使用步骤。",
    recipe: "强调色圆形 1.8em,Anton 白色数字;右侧白色胶囊里 Montserrat 700 深色说明",
    source: "UGC 广告",
    sample: { en: "Shake well", zh: "用前摇匀" },
    render: (t) => (
      <span className="inline-flex items-center">
        <span className={`${anton.className} z-10 grid size-[1.9em] place-items-center rounded-full text-white`} style={{ ...f(anton.style.fontFamily), fontSize: "1.2em", background: "#ff5e1a" }}>
          1
        </span>
        <span className={`${montserrat.className} -ml-[0.8em] rounded-r-full bg-white py-[0.3em] pl-[1.2em] pr-[0.8em] text-[#111]`} style={{ ...f(montserrat.style.fontFamily), fontWeight: 700, fontSize: "1em" }}>
          {t}
        </span>
      </span>
    ),
  },
  {
    id: "arrow-callout",
    name: "Arrow callout",
    group: "selling",
    note: "手绘箭头 + 手写标注,指向产品上的某个细节。功能演示。",
    recipe: "SVG 手绘弧形箭头(白色 3px 圆头);Permanent Marker 白字 + 投影",
    source: "UGC 广告",
    sample: { en: "Ultra-fine mist", zh: "超细喷雾" },
    render: (t) => (
      <span className="inline-flex items-end gap-[0.2em]">
        <span className={marker.className} style={{ ...f(marker.style.fontFamily), fontSize: "1.3em", color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,.5)" }}>
          {t}
        </span>
        <svg viewBox="0 0 60 50" className="h-[2.2em] w-[2.6em] -scale-x-100 drop-shadow-[0_2px_4px_rgba(0,0,0,.4)]" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8 C 30 6, 48 18, 50 42" />
          <path d="M40 34 L 50 43 L 57 31" />
        </svg>
      </span>
    ),
  },
  {
    id: "before-after",
    name: "Before / After",
    group: "selling",
    note: "对比标签:左 BEFORE 灰黑、右 AFTER 品牌色,可带「第 1 天 / 第 30 天」。",
    recipe: "两个方角小胶囊,Montserrat 800 全大写字距 0.08em;BEFORE #1a1a1a,AFTER 强调色",
    source: "UGC 广告",
    sample: { en: "Day 30", zh: "第 30 天" },
    render: (t) => (
      <span className={`${montserrat.className} inline-flex gap-[0.5em]`} style={{ ...f(montserrat.style.fontFamily), fontWeight: 800, fontSize: "0.95em", letterSpacing: "0.08em" }}>
        <span className="rounded-[0.3em] bg-[#1a1a1a] px-[0.6em] py-[0.25em] text-white">BEFORE</span>
        <span className="flex flex-col items-center rounded-[0.3em] px-[0.6em] py-[0.25em] text-white" style={{ background: "#ff5e1a" }}>
          AFTER
          <span className="text-[0.6em] font-semibold tracking-normal text-white/85">{t}</span>
        </span>
      </span>
    ),
  },
  {
    id: "lower-third",
    name: "Lower third",
    group: "selling",
    note: "人名条:左侧色块 + 深底,粗名字 + 细头衔。专家、创始人出镜介绍。",
    recipe: "左对齐;0.3em 强调色竖条 + #111 半透明底;Montserrat 800 名字 + 500 小字头衔",
    source: "YouTube · 新闻",
    sample: { en: "Dr. Lin · Dermatologist", zh: "林医生 · 皮肤科医生" },
    render: (t) => {
      const [name, role] = t.split(" · ");
      return (
        <span className={`${montserrat.className} inline-flex overflow-hidden rounded-[0.25em] text-left`} style={f(montserrat.style.fontFamily)}>
          <span className="w-[0.3em]" style={{ background: "#ff5e1a" }} />
          <span className="bg-[#111]/85 px-[0.7em] py-[0.35em]">
            <span className="block font-extrabold text-white">{name}</span>
            {role && <span className="block text-[0.72em] font-medium text-white/75">{role}</span>}
          </span>
        </span>
      );
    },
  },

  /* ── 价格 / 优惠 ── */
  {
    id: "price-slash",
    name: "Price slash",
    group: "price",
    note: "划线价:原价缩小加红色删除线,现价放大加粗。电商最直接的降价表达。",
    recipe: "原价 Montserrat 700 白色(现价的 55% 大小),3px 红色删除线;现价 Anton 黄色 2.2em,货币符号上标",
    source: "TikTok Shop · 电商",
    sample: { en: "$39 $19", zh: "¥199 ¥99" },
    render: (t) => {
      const [was, now] = t.split(" ");
      return (
        <span className="inline-flex items-baseline gap-[0.4em]" style={{ textShadow: "0 3px 10px rgba(0,0,0,.45)" }}>
          <span className={montserrat.className} style={{ ...f(montserrat.style.fontFamily), fontWeight: 700, fontSize: "1.35em", color: "#fff", textDecoration: "line-through", textDecorationColor: "#ff2d2d", textDecorationThickness: "3px" }}>
            {was}
          </span>
          <span className={anton.className} style={{ ...f(anton.style.fontFamily), fontSize: "2.4em", lineHeight: 1, color: "#FFE14D" }}>
            {now}
          </span>
        </span>
      );
    },
  },
  {
    id: "burst",
    name: "Burst badge",
    group: "price",
    note: "爆炸星形徽章:红 / 黄星形 + 大号折扣,斜放。「-50%」「SALE」。",
    recipe: "clip-path 星形多边形,#ff2d2d 底,rotate(-12deg);Anton 白字 + 黑描边",
    source: "电商 · TikTok Shop",
    sample: { en: "-50%", zh: "5 折" },
    render: (t) => (
      <span
        className={`${anton.className} inline-grid size-[4.2em] -rotate-12 place-items-center`}
        style={{
          ...f(anton.style.fontFamily),
          background: "#ff2d2d",
          clipPath: "polygon(50% 0%, 61% 12%, 77% 6%, 80% 22%, 96% 25%, 90% 40%, 100% 52%, 88% 63%, 93% 79%, 77% 81%, 72% 97%, 57% 90%, 45% 100%, 36% 88%, 20% 94%, 18% 78%, 3% 72%, 11% 58%, 0% 45%, 12% 35%, 7% 19%, 23% 18%, 28% 3%, 42% 10%)",
        }}
      >
        <span style={{ fontSize: "1.45em", color: "#fff", ...stroke("#7a0000", 3) }}>{t}</span>
      </span>
    ),
  },
  {
    id: "coupon",
    name: "Coupon",
    group: "price",
    note: "优惠券:两侧半圆缺口 + 虚线分隔,券码用等宽字。放折扣码。",
    recipe: "白底卡片,左右 radial-gradient 挖半圆缺口,中间 2px 虚线;左边 Anton 强调色面额,右边 Courier Prime 券码",
    source: "电商",
    sample: { en: "SAVE20", zh: "新人券" },
    render: (t) => (
      <span
        className="inline-flex items-stretch text-[#111]"
        style={{
          fontSize: "0.95em",
          background: "radial-gradient(circle at 0 50%, transparent 0.45em, #fff 0.47em) left / 51% 100% no-repeat, radial-gradient(circle at 100% 50%, transparent 0.45em, #fff 0.47em) right / 51% 100% no-repeat",
          filter: "drop-shadow(0 6px 12px rgba(0,0,0,.25))",
        }}
      >
        <span className={`${anton.className} grid place-items-center px-[0.9em] py-[0.35em]`} style={{ ...f(anton.style.fontFamily), fontSize: "1.6em", color: "#ff5e1a" }}>
          20% OFF
        </span>
        <span className="my-[0.4em] border-l-2 border-dashed border-[#d0d0d8]" />
        <span className="flex flex-col justify-center px-[0.9em]">
          <span className="text-[0.62em] font-semibold uppercase tracking-[0.1em] text-[#8a8b99]" style={sys}>Code</span>
          <span className={`${courier.className} font-bold`} style={f(courier.style.fontFamily)}>
            {t}
          </span>
        </span>
      </span>
    ),
  },
  {
    id: "countdown",
    name: "Countdown",
    group: "price",
    note: "倒计时:深色分格 + 等宽数字 + 时 / 分 / 秒小字。限时促销,原本数字会跳。",
    recipe: "每格 #111 圆角方块,Oswald 700 等宽数字白色;格子下 0.55em 小字 HRS/MIN/SEC;上方红色胶囊文案",
    source: "电商 · 直播",
    sample: { en: "Ends tonight", zh: "今晚截止" },
    render: (t) => (
      <span className="inline-flex flex-col items-center gap-[0.35em]">
        <span className="rounded-full bg-[#ff2d2d] px-[0.7em] py-[0.15em] text-[0.8em] font-bold text-white" style={sys}>
          ⏰ {t}
        </span>
        <span className={`${oswald.className} inline-flex items-start gap-[0.25em]`} style={f(oswald.style.fontFamily)}>
          {[
            ["02", "HRS"],
            ["14", "MIN"],
            ["36", "SEC"],
          ].map(([n, l], i) => (
            <span key={l} className="flex items-start gap-[0.25em]">
              {i > 0 && <span className="text-[1.6em] font-bold leading-[1.2] text-white">:</span>}
              <span className="flex flex-col items-center">
                <span className="rounded-[0.25em] bg-[#111] px-[0.3em] text-[1.6em] font-bold tabular-nums leading-[1.3] text-white">{n}</span>
                <span className="mt-[0.15em] text-[0.55em] font-semibold tracking-[0.1em] text-white/80">{l}</span>
              </span>
            </span>
          ))}
        </span>
      </span>
    ),
  },
  {
    id: "ribbon",
    name: "Ribbon",
    group: "price",
    note: "缎带横幅:两端燕尾缺口的彩带。包邮、新品、限量。",
    recipe: "强调色矩形,两端 clip-path 燕尾;Montserrat 900 白色全大写,字距 0.06em",
    source: "电商",
    sample: { en: "Free shipping", zh: "全场包邮" },
    render: (t) => (
      <span
        className={`${montserrat.className} inline-block px-[1.3em] py-[0.35em]`}
        style={{ ...f(montserrat.style.fontFamily), fontWeight: 900, fontSize: "1.05em", letterSpacing: "0.06em", textTransform: "uppercase", color: "#fff", background: "#16a34a", clipPath: "polygon(0 0, 100% 0, 94% 50%, 100% 100%, 0 100%, 6% 50%)" }}
      >
        {t}
      </span>
    ),
  },

  /* ── 口碑 / 背书 ── */
  {
    id: "review-card",
    name: "Review card",
    group: "proof",
    note: "评价卡:五颗金星 + 一句评价 + 头像、名字、「Verified buyer」。口碑类广告主力。",
    recipe: "白色 16px 圆角卡 + 柔阴影;#FFB800 五星;正文系统字 Medium;底部小头像 + 名字 + 灰色 Verified ✓",
    source: "UGC 广告",
    sample: { en: "My skin has never felt this soft", zh: "皮肤从来没这么嫩过" },
    render: (t) => (
      <span className="inline-block w-[15em] max-w-full rounded-[1em] bg-white px-[0.9em] py-[0.7em] text-left shadow-[0_8px_24px_rgba(0,0,0,.22)]" style={{ ...sys, fontSize: "0.9em" }}>
        <span className="flex gap-[0.1em] text-[#FFB800]">
          {Array.from({ length: 5 }, (_, i) => (
            <Star key={i} className="size-[1em] fill-current" />
          ))}
        </span>
        <span className="mt-[0.35em] block font-medium leading-snug text-[#111]">&ldquo;{t}&rdquo;</span>
        <span className="mt-[0.5em] flex items-center gap-[0.4em] text-[0.75em]">
          <span className="size-[1.6em] rounded-full bg-gradient-to-br from-[#fbcfe8] to-[#f472b6]" />
          <span className="font-semibold text-[#111]">Sarah K.</span>
          <span className="flex items-center gap-[0.15em] text-[#8a8b99]">
            <BadgeCheck className="size-[1.1em] text-[#22c55e]" /> Verified buyer
          </span>
        </span>
      </span>
    ),
  },
  {
    id: "quote",
    name: "Big quote",
    group: "proof",
    note: "大引号金句:超大衬线引号 + 斜体引文 + 小字署名。用户证言、媒体评价。",
    recipe: "Playfair Display 700 引号 3em 强调色;引文 Playfair 600 斜体白字;署名 Montserrat 600 小号全大写",
    source: "UGC · 品牌广告",
    sample: { en: "The only mist I repurchase", zh: "唯一回购的喷雾" },
    render: (t) => (
      <span className="inline-flex flex-col items-center" style={{ textShadow: "0 2px 12px rgba(0,0,0,.45)" }}>
        <span className={playfair.className} style={{ ...f(playfair.style.fontFamily), fontWeight: 700, fontSize: "3em", lineHeight: 0.6, color: "#ff5e1a" }}>
          &ldquo;
        </span>
        <span className={playfair.className} style={{ ...f(playfair.style.fontFamily), fontWeight: 600, fontStyle: "italic", fontSize: "1.35em", color: "#fff" }}>
          {t}
        </span>
        <span className={`${montserrat.className} mt-[0.4em] text-[0.62em] font-semibold uppercase tracking-[0.14em] text-white/80`} style={f(montserrat.style.fontFamily)}>
          — Vogue Beauty
        </span>
      </span>
    ),
  },
  {
    id: "press",
    name: "As seen in",
    group: "proof",
    note: "媒体背书条:「AS SEEN IN」+ 一排灰白 logo。放开头或结尾建立信任。",
    recipe: "深色半透明横条;小号全大写标签 + 一排白色 60% 透明度的媒体字标(实际用 logo 图)",
    source: "品牌广告",
    sample: { en: "As seen in", zh: "媒体推荐" },
    render: (t) => (
      <span className="inline-flex flex-col items-center gap-[0.3em] rounded-[0.5em] bg-black/50 px-[1em] py-[0.5em] backdrop-blur">
        <span className="text-[0.6em] font-semibold uppercase tracking-[0.16em] text-white/75" style={sys}>
          {t}
        </span>
        <span className="flex items-center gap-[0.9em] text-white/70">
          <span className={playfair.className} style={{ ...f(playfair.style.fontFamily), fontWeight: 700, fontSize: "1.05em" }}>VOGUE</span>
          <span className={archivo.className} style={{ ...f(archivo.style.fontFamily), fontSize: "0.85em" }}>ELLE</span>
          <span className={garamond.className} style={{ ...f(garamond.style.fontFamily), fontWeight: 600, fontSize: "1em", fontStyle: "italic" }}>Allure</span>
        </span>
      </span>
    ),
  },
  {
    id: "tweet",
    name: "Post card",
    group: "proof",
    note: "仿 X / Reddit 帖子截图:头像、名字、@账号、正文、点赞数。真实感口碑,常斜叠几张。",
    recipe: "白卡 12px 圆角;圆头像 + 粗体名字 + 灰色 @handle;正文系统字 15px;底部灰色互动数",
    source: "UGC 广告",
    sample: { en: "ok this mist is actually insane for makeup", zh: "这个喷雾定妆真的绝了" },
    render: (t) => (
      <span className="inline-block w-[15em] max-w-full rotate-[-2deg] rounded-[0.7em] bg-white px-[0.8em] py-[0.65em] text-left shadow-[0_8px_24px_rgba(0,0,0,.22)]" style={{ ...sys, fontSize: "0.85em" }}>
        <span className="flex items-center gap-[0.45em]">
          <span className="size-[2em] rounded-full bg-gradient-to-br from-[#a5b4fc] to-[#6366f1]" />
          <span className="leading-tight">
            <span className="block font-bold text-[#111]">mia ✨</span>
            <span className="block text-[0.85em] text-[#8a8b99]">@miaglows</span>
          </span>
        </span>
        <span className="mt-[0.4em] block leading-snug text-[#111]">{t}</span>
        <span className="mt-[0.4em] block text-[0.8em] text-[#8a8b99]">♥ 12.4K · ↻ 1.2K</span>
      </span>
    ),
  },

  /* ── 行动号召 ── */
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
  {
    id: "swipe-up",
    name: "Swipe up",
    group: "cta",
    note: "上滑 / 点击提示:几层向上的箭头 + 小字。原本靠弹跳动画,这里是静止的样子。",
    recipe: "三层 ChevronUp 白色,透明度 40/70/100%;下方 Montserrat 800 小号全大写 + 柔阴影",
    source: "Instagram · TikTok",
    sample: { en: "Shop now", zh: "立即购买" },
    render: (t) => (
      <span className="inline-flex flex-col items-center text-white" style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,.45))" }}>
        {[0.4, 0.7, 1].map((o) => (
          <ChevronUp key={o} className="-my-[0.35em] size-[1.5em]" strokeWidth={3} style={{ opacity: o }} />
        ))}
        <span className={`${montserrat.className} mt-[0.3em] text-[0.9em] font-extrabold uppercase tracking-[0.1em]`} style={f(montserrat.style.fontFamily)}>
          {t}
        </span>
      </span>
    ),
  },
  {
    id: "cta-underline",
    name: "Arrow link",
    group: "cta",
    note: "极简 CTA:白字 + 下划线 + 箭头,不加按钮底。高级感品牌的收尾。",
    recipe: "Montserrat 700 白字,2px 白色下划线(偏移 0.25em),右侧 ArrowRight",
    source: "品牌广告",
    sample: { en: "Discover the collection", zh: "探索全系列" },
    render: (t) => (
      <span className={`${montserrat.className} inline-flex items-center gap-[0.35em] text-white`} style={{ ...f(montserrat.style.fontFamily), fontWeight: 700, fontSize: "1.1em", textShadow: "0 2px 10px rgba(0,0,0,.45)" }}>
        <span className="underline decoration-2 underline-offset-[0.25em]">{t}</span>
        <ArrowRight className="size-[1em]" />
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
