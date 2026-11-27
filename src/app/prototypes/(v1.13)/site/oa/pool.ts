// 落地页(OpenArt 版式)用的素材池和博客数据(2026-11-19)。
// 规则：只放 BuzzVideo 真实生成过的成片;知道是哪个模型做的就标模型名，不知道就只写「Made on BuzzVideo」,不张冠李戴。

import { MODELS, type ModelType } from "../../site-nav/models-catalog";
import { mediaOf, type Sample } from "../models/model-media";
import { modelHref } from "../models/model-content";

export type Pic = Sample & {
  model?: string;
  modelSlug?: string;
  /** 2026-11-26 画中画小卡：结果大图左上角固定放「原图 / 首帧 / 参考脸」(Face Swap、Image to Video 首屏和功能行) */
  inset?: Pic;
  insetLabel?: string;
};

/** 某一类(图片 / 视频 / 音频)的全部真实成片，带模型名 */
export function picsOf(type: ModelType): Pic[] {
  const out: Pic[] = [];
  for (const m of MODELS.filter((x) => x.type === type)) for (const s of mediaOf(m.slug)) if (s.kind === type) out.push({ ...s, model: m.name, modelSlug: m.slug });
  if (type === "video") out.push(...SKILL_VIDEOS);
  return out;
}

/* MCP Skill 示例片(工具页首屏用的那几条):多模型合成，不标单一模型 */
const LOCAL = "/prototypes/site/tools";
const POSTER = "/video-library/posters";
const SKILL_VIDEOS: Pic[] = [
  ["link-to-ad", "A vertical video ad made from a product page link", "9:16"],
  ["ugc-product-review", "A creator-style product review video", "9:16"],
  ["unboxing-ugc", "A 15-second unboxing video made from one product photo", "9:16"],
  ["product-ad", "A vertical product ad for a vitamin C serum bottle made from photos", "9:16"], /* 片子里是 LUMEA 精华，写进说明文字才能和别的 LUMEA 素材算同一主体 */
  ["talking-product", "A talking product character ad", "9:16"],
  ["3d-product-video", "A 3D product turnaround video", "9:16"],
].map(([slug, alt, aspect]) => ({ kind: "video" as const, src: `${LOCAL}/${slug}.mp4`, poster: `${POSTER}/skill-${slug}.jpg`, aspect, alt, prompt: "", source: `MCP Skill 示例 ${slug}` }));

/* ── 素材「主体」(2026-11-26 Monica:首屏不能放一样的素材，下面也不能重复)──
   同一个产品 / 同一个场景的多张变体(换光、换背景、前后对比、换语言…)算一个主体:首屏每个主体只放一张，整页同一个文件只出现一次。
   判定：① 显式登记(前后对比两张、"The same …" / "The original …" 跟着前一张);② 关键词归类(同一虚构品牌 / 同一产品跨模型也算一个);③ 都没有就按文件。 */
const SUBJ = new Map<string, string>();
const KEYWORDS: [RegExp, string][] = [
  [/\b(serum|lumea|vitamin c)\b/i, "serum"],
  [/\b(sunscreen|spf|fernwell)\b/i, "sunscreen"],
  [/\b(cold brew|iced latte)\b/i, "cold-brew"],
  [/\bcandles?\b/i, "candle"],
  [/\bnoir[ée]/i, "noire-perfume"], /* é 不算单词字符，后面不能加 \b */
  [/\bbuzzrose\b/i, "buzzrose"],
  [/\bsonora\b/i, "sonora"],
  [/\bbrivo\b/i, "brivo"],
  [/\b(cloudline|sneakers?|running shoes?)\b/i, "sneaker"],
  [/crumb & co|\b(croissants?|bakery|bakers|cinnamon rolls?|pastr(y|ies))\b/i, "bakery"],
  [/\b(coffee|latte|espresso)\b/i, "coffee"],
  [/\b(softly|lip balm)\b/i, "lip-balm"],
  [/\bheadphones?\b/i, "headphones"],
  [/crumb & co/i, "crumb"],
  [/\bshiba\b/i, "shiba"],
  [/\bcorgis?\b/i, "corgi"],
  [/\baven\b/i, "aven"],
];
const SAME = /^(the )?(same|original)\b/i;
/** 「Turn this photo into… / Use the image…」这类改图素材，说明文字里不写主体，要看提示词才知道改的是谁。
    2026-11-26 Monica 在 Nano Banana 首屏圈出两张同一只柯基(原图 + 杂志封面版):「重复了」 */
const EDIT_ALT = /^(turn this|use the|use this|edit|change|replace|make this|keep)\b/i;
/** 说明文字里没写主体时，提示词里出现的虚构品牌名也算(只认品牌名，不认「咖啡」这类道具词，免得把不相干的图并成一个)。
    例:Seedream 4.5 的「Glow, bottled.」横幅，说明文字只写了横幅，提示词里才有 LUMEA */
const BRANDS: [RegExp, string][] = [
  [/lumea/i, "serum"],
  [/fernwell/i, "sunscreen"],
  [/noir[ée]/i, "noire-perfume"],
  [/buzzrose/i, "buzzrose"],
  [/sonora/i, "sonora"],
  [/brivo/i, "brivo"],
  [/cloudline/i, "sneaker"],
  [/crumb & co/i, "bakery"],
  [/softly/i, "lip-balm"],
  [/aven/i, "aven"],
];
const keyOf = (p: Pick<Pic, "src" | "alt"> & { prompt?: string }) =>
  KEYWORDS.find(([re]) => re.test(p.alt ?? ""))?.[1] ??
  (EDIT_ALT.test(p.alt ?? "") ? KEYWORDS.find(([re]) => re.test(p.prompt ?? ""))?.[1] : undefined) ??
  BRANDS.find(([re]) => re.test(p.prompt ?? ""))?.[1];
/** 一组按顺序排的素材：「The same / The original …」并到前一张的主体 */
export function linkSubjects(list: (Pic | null | undefined)[]) {
  let prev: Pic | undefined;
  for (const p of list) {
    if (!p) continue;
    if (!SUBJ.has(p.src)) {
      const k = keyOf(p) ?? (prev && SAME.test(p.alt ?? "") ? subjectOf(prev) : undefined);
      if (k) SUBJ.set(p.src, k);
    }
    prev = p;
  }
}
/** 显式指定主体(一套广告里的几张：同一产品的 UGC / 特写 / 静态图) */
export function setSubject(list: Pic[], key: string) {
  for (const p of list) SUBJ.set(p.src, key);
}
/** 前后对比两张算同一个主体 */
export function linkPair(a: Pic, b: Pic) {
  const k = SUBJ.get(a.src) ?? SUBJ.get(b.src) ?? keyOf(a) ?? keyOf(b) ?? a.src;
  SUBJ.set(a.src, k);
  SUBJ.set(b.src, k);
}
let modelsLinked = false;
export function subjectOf(p: Pick<Pic, "src" | "alt"> & { prompt?: string }): string {
  if (!modelsLinked) {
    modelsLinked = true;
    for (const m of MODELS) linkSubjects(mediaOf(m.slug));
  }
  return SUBJ.get(p.src) ?? keyOf(p) ?? p.src;
}

/** 整页素材登记：同一个文件(含视频封面)只用一次;distinct 时同一主体也只用一次 */
export function pageLedger() {
  const src = new Set<string>();
  const subj = new Set<string>();
  const usedFile = (p: Pic) => src.has(p.src) || (!!p.poster && src.has(p.poster));
  const mark = (p: Pic) => {
    src.add(p.src);
    if (p.poster) src.add(p.poster);
    if (p.inset) src.add(p.inset.src);
    subj.add(subjectOf(p));
    return p;
  };
  /** 从候选里按顺序取最多 n 张没用过的;distinct=true 时还要求主体没出现过 */
  const take = (cands: Pic[], n: number, distinct = false): Pic[] => {
    const out: Pic[] = [];
    for (const p of cands) {
      if (out.length >= n) break;
      if (usedFile(p) || (distinct && subj.has(subjectOf(p)))) continue;
      out.push(mark(p));
    }
    return out;
  };
  return { take, mark, usedFile, has: (p: Pic) => usedFile(p), subjects: subj, srcs: src };
}

/** 把同一主体的变体错开排(A1 B1 C1 A2 B2…),示例区不会连着几张同一个产品 */
export function spreadSubjects(list: Pic[]): Pic[] {
  const groups = new Map<string, Pic[]>();
  for (const p of list) groups.set(subjectOf(p), [...(groups.get(subjectOf(p)) ?? []), p]);
  const out: Pic[] = [];
  for (let i = 0; out.length < list.length; i++) for (const g of groups.values()) if (g[i]) out.push(g[i]);
  return out;
}

/** 首屏拼贴：每个主体只放一张;优先 own(本页 / 本模型的成片),主体不够再用同类池里别的主体补(按页面 seed 错开起点)。
 *  ledger 传进来时，首屏用掉的素材登记进去，页面下面的板块就不会再用 */
export function heroPics(type: ModelType, own: Pic[] = [], n = 8, seed?: string, ledger = pageLedger(), fillPool?: Pic[], allowText = false): Pic[] {
  /* allowText:海报 / 信息图 / 传单 / Logo 这类页，字多的图就是主题，首屏照放 */
  const heavy = (p: Pic) => !allowText && isTextHeavy(p);
  /* fillPool:主题限定的页面(动漫、换脸)只拿同主题素材补位，不用通用素材池 */
  let pool = fillPool ?? (type === "audio" ? picsOf("image") : picsOf(type));
  /* 2026-11-26 Monica:「为什么每个模型这个位置都放这个?」—— 补位素材按页面(seed)错开起点，各页补位不同 */
  if (seed && pool.length) {
    let h = 0;
    for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const k = h % pool.length;
    pool = [...pool.slice(k), ...pool.slice(0, k)];
  }
  /* 2026-11-26 Monica 在 Nano Banana 2 / Qwen / Seedream 4.5 首屏圈出：海报的大标题被输入框和旁边卡片压住，「没显示完整」。
     首屏卡片叠压是定好的版式(照 OpenArt),字多的图(海报、横幅、信息图)关键文字多在顶部，正好被挡 ——
     首屏先放本模型的照片 / 视频，不够再用同类别别的模型的照片补，最后才用字多的图;字多的图留给下面完整显示的板块 */
  const ownV = own.filter((x) => x.kind !== "audio");
  /* 正中那格几乎不被遮挡。本模型排第一的素材(它的提示词就是输入框里先打出来的那条)如果是字多的图，放正中，画面和提示词对得上;
     本模型一张照片都没有时(比如主打图上文字的 Qwen),也拿一张它自己的字多的图放正中 */
  const lead = ownV[0] && heavy(ownV[0]) && n >= 3 ? ledger.take([ownV[0]], 1, true) : [];
  const mine = ledger.take(ownV.filter((x) => !heavy(x)), n - lead.length, true);
  const centre = lead.length ? lead : mine.length === 0 && n >= 3 ? ledger.take(ownV.filter(heavy), 1, true) : [];
  const fill = ledger.take(pool.filter((x) => !heavy(x)), n - mine.length - centre.length, true);
  const rest = ledger.take(ownV.filter(heavy), n - mine.length - centre.length - fill.length, true);
  const out = [...mine, ...fill, ...rest];
  if (centre[0]) out.splice(2, 0, centre[0]);
  return out;
}

/** 字多的图：海报、横幅、信息图、菜单、封面这类，主要信息是图上的字 */
const TEXT_HEAVY = /\b(posters?|banners?|infographics?|flyers?|headlines?|key visual|print ad|menu|title card|typography|magazine cover|cover|price tag|titled|sale|signage|storyboard|timeline|recipe card|carousel|thumbnail|tickets?|boarding pass|timetable|schedule|calendar|receipt|invitation|certificate|chart|callouts?|detail (page|image)|product detail|label design|wine label|brochure|newsletter|slide|kv|story ad|instagram (story|post)|social post|quote|greeting card|holiday card|loyalty card|menu board|web banner)\b/i;
const TEXT_FILE = /(poster|banner|infographic|flyer|kv|ticket|timetable|detail|menu|label|cover|chart|recipe|boarding|story|quote|card|carousel|-post)/i;
export const isTextHeavy = (p: Pick<Pic, "alt" | "prompt" | "kind" | "src">) =>
  p.kind === "image" && (TEXT_HEAVY.test(p.alt ?? "") || TEXT_HEAVY.test(p.prompt ?? "") || TEXT_FILE.test(p.src.split("/").pop() ?? ""));

/** 按顺序轮着取一张(给卡片配图用),跳过已用的 */
export function picker(pool: Pic[]) {
  const used = new Set<string>();
  let i = 0;
  return (): Pic | undefined => {
    for (let k = 0; k < pool.length; k++) {
      const p = pool[(i + k) % pool.length];
      if (!used.has(p.src)) {
        used.add(p.src);
        i = (i + k + 1) % pool.length;
        return p;
      }
    }
    return pool.length ? pool[i++ % pool.length] : undefined;
  };
}

export const posterOf = (p?: Pic) => (p ? (p.kind === "video" ? p.poster ?? p.src : p.src) : undefined);
export const modelLinkOf = (p: Pic) => (p.modelSlug ? modelHref(p.modelSlug) : undefined);

/* ── 线上博客(buzzvideo.ai/blog,2026-11-02 发布的 26 篇 Skill 教程)。封面用同一篇文章里的示例片封面 ── */
export type Post = { title: string; href: string; cover: string; date: string; topic: "ads" | "video" | "image" | "audio" | "design" };
const P = (skill: string, title: string, slug: string, topic: Post["topic"]): Post => ({ title, href: `/blog/${slug}`, cover: `${POSTER}/skill-${skill}.jpg`, date: "Nov 2, 2026", topic });
export const POSTS: Post[] = [
  P("ugc-product-review", "How to Make a UGC Product Review Video with AI", "ugc-product-review-video-ai", "ads"),
  P("product-ad", "How to Make an AI Product Commercial from Photos", "ai-product-commercial", "video"),
  P("product-photos", "AI Product Photography from One Photo", "ai-product-photography-from-one-photo", "image"),
  P("marketplace-listing", "How to Make Amazon Listing Images with AI", "amazon-listing-images-ai", "image"),
  P("link-to-ad", "Turn a Product Link into Ads in ChatGPT or Claude", "product-link-to-ad-chatgpt-claude", "ads"),
  P("3d-product-video", "How to Make a 360 Product Video with AI", "360-product-video-ai", "video"),
  P("unboxing-ugc", "How to Make an AI Unboxing Video", "ai-unboxing-video", "video"),
  P("try-on-ugc", "How to Make an AI Try-On Video of Your Clothing", "ai-try-on-video", "image"),
  P("talking-product", "How to Make a Talking Product Video with AI", "talking-product-video-ai", "audio"),
  P("ad-hook-variants", "How to Make Ad Hook Variations with AI", "ad-hook-variations-ai", "ads"),
  P("ad-localizer", "How to Localize a Video Ad with AI", "localize-video-ads-ai", "audio"),
  P("photo-to-3d", "How to Turn a Photo into a 3D Figurine with AI", "photo-to-3d-figurine-ai", "image"),
  { ...P("3d-director", "AI Video Camera Control with a 3D Blockout", "ai-video-camera-control-3d-blockout", "video"), cover: `${POSTER}/skill-3d-director-cover.jpg` } /* 2026-11-27 审图：原封面是上下两张拼图，卡片里只露出浅灰白模那半，像坏图 → 只用成片那半 */,
  P("faceless-explainer", "How to Make a Faceless Explainer Video with AI", "faceless-explainer-video-ai", "audio"),
  P("festival-campaign", "AI Christmas Campaign Creatives for the US & UK (2026)", "christmas-campaign-ai", "design"),
  P("ad-variations", "How to Make AI Ad Variations with New Talent", "ai-ad-variations-new-talent", "ads"),
];
/** exclude:本页已经用过的图片地址(2026-11-26 同一页素材不重复),封面撞了就换下一篇 */
export function postsFor(topic: Post["topic"], n = 3, exclude?: Set<string>): Post[] {
  const a = POSTS.filter((p) => p.topic === topic);
  const b = POSTS.filter((p) => p.topic !== topic);
  return [...a, ...b].filter((p) => !exclude?.has(p.cover)).slice(0, n);
}
