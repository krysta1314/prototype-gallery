// 模型页内容生成(2026-11-18):每个模型 = 清单(models-catalog)+ 参数(model-facts)+ 价格(定价接口)+ 市场关键词(Google 自动补全)。
// 规则：只写能核实的事实 —— 描述用后台官方描述，参数来自后台 / Notion,价格来自线上定价接口;
// FAQ 的问题取自真实搜索(docs/research/keywords/2026-11-18-models.json),答案由上面的事实拼出，不编数字。
// Kling 4.0 有手写版(/prototypes/model-page),不走这里。

import { MERGED } from "../redirects";
import { MODEL_GEO } from "./geo-extra";
import { MODELS, type ModelEntry, type ModelType } from "../../site-nav/models-catalog";
import { factsOf, type ModelFacts } from "./model-facts";
import { mediaOf } from "./model-media";
import pricingLive from "./pricing-live.json";
/* 搜索词数据(原在 docs/research/keywords/,docs/ 不进 git,Vercel 构建找不到，所以复制一份到这里) */
import keywords from "./search-keywords.json";

type Sku = { dims: Record<string, string>; credits: number };
const LIVE = (pricingLive as unknown as { data: { items: { name: string; skus: Sku[] }[] } }).data.items;

/* 线上价格接口里叫法不同的 */
const PRICE_NAME: Record<string, string> = { "GPT Image 2": "GPT-image-2", "Seedream 5.0 lite": "Seedream 5.0 lite" };
/* 只在 UAT 上线、线上接口还没有的:用 UAT estimate_credits 的报价(2026-11-18) */
const UAT_QUOTES: Record<string, { label: string; credits: number }[]> = {
  "seedance-2-5-flash": [{ label: "10 s · 720p", credits: 303 }],
  "wan-3-0-prime": [{ label: "10 s · 720p", credits: 280 }],
  "seedream-5-5": [{ label: "1K image", credits: 4 }],
};
/* 套餐(pricing 页 + 2026-11-10 博客 BRIEF):Free 只能用 Seedream 4.5 / 5.0 lite 出图;Seedance 2.5 / 2.0 要 Pro 起 */
const FREE_OK = new Set(["seedream-4-5", "seedream-5-0-lite", "seed-audio-1-0"]);
const PRO_ONLY = new Set(["seedance-2-5", "seedance-2-0"]);
const PRO_YEARLY_USD_PER_CREDIT = (35 * 12) / (4900 * 12);

export type PriceRow = { label: string; credits: number };
export type ModelPageData = {
  m: ModelEntry;
  f?: ModelFacts;
  h1: string;
  typeWord: string;
  definition: string;
  metaTitle: string;
  metaDescription: string;
  facts: [string, string][];
  prices: PriceRow[];
  priceNote: string;
  fromCredits?: number;
  /** 只有一档报价时这一档的说明(如「10 s · 720p」),页面上写「X credits / 10 s · 720p」而不是「From X」 */
  fromSingle?: string;
  plans: string;
  howTo: { title: string; body: string }[];
  faq: { q: string; a: string }[];
  compare: { m: ModelEntry; from?: number }[];
  related: ModelEntry[];
  sources: { label: string; url: string }[];
  /** 「What is X good for?」:按这个模型的真实参数推出来的用途(不写参数之外的宣传话) */
  goodFor: { title: string; body: string }[];
  /** 「How to write an X prompt」:按类型 + 这个模型的上限写的要点 */
  promptTips: string[];
  /** 两栏对比(Gemini「Choose the right model」式):这个模型 + 搜索里最常一起比的 2 个同类模型 */
  matchup: { m: ModelEntry; rows: Record<string, string> }[];
  matchupRows: string[];
};

const TYPE_WORD: Record<ModelType, string> = { video: "video", image: "image", audio: "audio" };
/* 名字里已经带了功能词(Voice Clone / Create Voice / Sound Effects)的，副标题不再重复 */
/* 2026-11-19 SEO/GEO 审核：这 3 个模型的 h1 是「X on BuzzVideo」,标题里品牌重复、没关键词，单独定 */
const META_TITLE: Record<string, string> = {
  "minimax-voice-clone": "MiniMax Voice Clone: AI Voice Cloning | BuzzVideo",
  "kling-create-voice": "Kling Voice Clone: AI Voice Cloning | BuzzVideo",
  "elevenlabs-sound-effects-v3": "ElevenLabs Sound Effects v3: AI SFX | BuzzVideo",
};
function h1Of(m: ModelEntry, f?: ModelFacts) {
  if (m.type === "video") return `${m.name} AI Video Generator`;
  if (m.type === "image") return `${m.name} AI Image Generator`;
  if (/voice clone|create voice|sound effects/i.test(m.name)) return `${m.name} on BuzzVideo`;
  switch (f?.audioKind) {
    case "music":
      return `${m.name} AI Music Generator`;
    case "sound effects":
      return `${m.name} Sound Effects Generator`;
    case "voice clone":
      return `${m.name} AI Voice Cloning`;
    case "all-in-one":
      return `${m.name} AI Audio Generator`;
    default:
      return `${m.name} AI Voice Generator`;
  }
}

/* 模型页网址:Seedance 2.5 线上已有家族页 /models/seedance,一律链到那里 */
/* Seedance 2.5 指向线上已有的 buzzvideo.ai/models/seedance(Monica 2026-11-19) */
/* 2026-11-25 不单独做落地页的模型(redirects.ts 的 MERGED)直接链到同家族主型号页 */
export const modelHref = (slug: string) => (slug === "seedance-2-5" ? "/models/seedance" : MERGED[slug] ?? `/${slug}`);

/* 后台原始写法统一成对外写法:768P → 768p,std / pro → Standard / Pro */
const fmtRes = (r: string) =>
  r
    .replace(/^(\d+)P$/, "$1p")
    .replace(/^(\d+(?:\.\d+)?)k$/i, "$1K")
    .replace(/^std$/i, "Standard")
    .replace(/^pro$/i, "Pro");
const QUALITY: Record<string, string> = { low: "Low", medium: "Medium", high: "High", xhigh: "X-High", "x-high": "X-High", max: "Max", standard: "Standard", hd: "HD" };
const andList = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
const possessive = (v: string) => (v.endsWith("s") ? `${v}'` : `${v}'s`);
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;
/* 按词截断，不把单词切一半 */
const clip = (t: string, n: number) => (t.length <= n ? t : t.slice(0, t.lastIndexOf(" ", n - 1)).replace(/[,:;·|-]\s*$/, "").trim());

/* 价格表：视频每个时长都保底一行(最低分辨率),再按需要补最高分辨率，按时长排;图片按分辨率;找不到线上价就用 UAT 报价 */
function pricesOf(m: ModelEntry): PriceRow[] {
  if (UAT_QUOTES[m.slug]) return UAT_QUOTES[m.slug];
  if (m.slug === "seed-audio-1-0") return [{ label: "Per second of audio", credits: 0.5 }];
  const item = LIVE.find((x) => x.name === (PRICE_NAME[m.name] ?? m.name));
  if (!item || !item.skus.length) return [];
  const skus = item.skus.filter((s) => s.dims.input_has_video !== "yes" && s.dims.with_audio !== "no");
  if (m.type === "video") {
    const durations = [...new Set(skus.map((s) => Number(s.dims.duration)).filter((d) => !Number.isNaN(d)))].sort((a, b) => a - b);
    const pick = durations.length > 5 ? [...new Set([durations[0], ...durations.filter((d) => [5, 10, 15, 30].includes(d)), durations[durations.length - 1]])] : durations;
    const out: PriceRow[] = [];
    for (const d of pick) {
      const row = skus.filter((x) => Number(x.dims.duration) === d).sort((a, b) => a.credits - b.credits);
      if (!row.length) continue;
      const lo = row[0];
      const hi = row[row.length - 1];
      out.push({ label: `${d} s · ${fmtRes(lo.dims.resolution)}`, credits: lo.credits });
      if (hi !== lo && hi.dims.resolution !== lo.dims.resolution) out.push({ label: `${d} s · ${fmtRes(hi.dims.resolution)}`, credits: hi.credits });
    }
    return out.slice(0, 12);
  }
  if (m.type === "image") {
    const byRes = new Map<string, number>();
    for (const s of skus) {
      /* 比例有 1x1 / 1:1 两种写法;按比例分档的只取正方形，避免一行一个比例 */
      if (s.dims.aspect_ratio && !["1x1", "1:1"].includes(s.dims.aspect_ratio)) continue;
      const resQ = s.dims.resolution && QUALITY[s.dims.resolution.toLowerCase()];
      const k = [resQ ? `${resQ} quality` : s.dims.resolution && fmtRes(s.dims.resolution), s.dims.quality && `${QUALITY[s.dims.quality.toLowerCase()] ?? s.dims.quality} quality`].filter(Boolean).join(" · ");
      byRes.set(k, Math.min(byRes.get(k) ?? Infinity, s.credits));
    }
    return [...byRes].map(([k, c]) => ({ label: k ? (/quality/.test(k) ? k : `${k} image`) : "Per image", credits: c })).sort((a, b) => a.credits - b.credits);
  }
  return [];
}

/* 同类才比：音频要同一种(配音 / 克隆 / 音乐 / 音效 / 全能) */
const sameKind = (a: ModelEntry, b: ModelEntry) => a.type === b.type && (a.type !== "audio" || factsOf(a.slug)?.audioKind === factsOf(b.slug)?.audioKind);

/* 真实搜索问题:从关键词数据里挑出和这个模型有关的「vs」 */
type Kw = { name: string; suggest: string[]; questions: string[] };
const KW = keywords as unknown as Kw[];
/* 搜索里的简写补全：「seedance 2.5 vs 2.0」「nano banana 2.1 vs pro」「sunburst vs flare」→ 同家族型号 */
function resolveVs(m: ModelEntry, part: string): ModelEntry | undefined {
  const p = part.trim().toLowerCase();
  const name = m.name.toLowerCase();
  if (!p || p === name) return undefined;
  const words = name.split(" ");
  const family = name.replace(/\s[\d.]+.*$/, "");
  const cands = [p, `${family} ${p}`, `${words.slice(0, -1).join(" ")} ${p}`, `${words.slice(0, 2).join(" ")} ${p}`];
  for (const c of cands) {
    const hit = MODELS.find((x) => x.slug !== m.slug && x.name.toLowerCase() === c && sameKind(m, x));
    if (hit) return hit;
  }
  return undefined;
}
function topVs(m: ModelEntry): ModelEntry | undefined {
  return vsList(m, 1)[0];
}

const fromOf = (x: ModelEntry) => {
  const p = pricesOf(x);
  return p.length ? Math.min(...p.map((y) => y.credits)) : undefined;
};

/* vs 答案：从规格差异里推出「什么时候选谁」,只用能核实的数字 */
function vsRule(m: ModelEntry, o: ModelEntry): string {
  const a = factsOf(m.slug);
  const b = factsOf(o.slug);
  const rules: string[] = [];
  if (a?.durations && b?.durations && a.durations[1] !== b.durations[1]) {
    const [long, short] = a.durations[1] > b.durations[1] ? [m, o] : [o, m];
    rules.push(`${long.name} makes longer clips (up to ${Math.max(a.durations[1], b.durations[1])} s, against ${Math.min(a.durations[1], b.durations[1])} s for ${short.name})`);
  }
  if (a?.refs?.images && b?.refs?.images && a.refs.images !== b.refs.images) {
    const more = a.refs.images > b.refs.images ? m : o;
    rules.push(`${more.name} takes more reference images (${Math.max(a.refs.images, b.refs.images)} against ${Math.min(a.refs.images, b.refs.images)})`);
  }
  /* 只在同一档位(同时长 + 同分辨率 / 同画质)上比价，不拿 4 s 480p 去比 10 s 720p */
  const pa = pricesOf(m);
  const pb = pricesOf(o);
  const same = pa.map((x) => [x, pb.find((y) => y.label === x.label)] as const).find(([, y]) => !!y);
  if (same && same[1] && same[0].credits !== same[1].credits) {
    const [x, y] = same;
    rules.push(`${x.credits < y!.credits ? m.name : o.name} is cheaper at ${x.label} (${Math.min(x.credits, y!.credits)} against ${Math.max(x.credits, y!.credits)} credits)`);
  }
  const lead = `${m.name}: ${m.desc}. ${o.name}: ${o.desc}.`;
  const bothLive = m.release === "live" && o.release === "live";
  return [lead, rules.length ? `In short, ${rules.join("; ")}.` : "", bothLive ? "You can run the same prompt on both in BuzzVideo and see each price before you create." : ""].filter(Boolean).join(" ");
}

/* 搜索里和这个模型一起比的同类模型(按关键词数据里出现的顺序，最多 n 个) */
function vsList(m: ModelEntry, n: number): ModelEntry[] {
  const k = KW.find((x) => x.name === m.name);
  const lower = m.name.toLowerCase();
  const out: ModelEntry[] = [];
  for (const q of [...(k?.suggest ?? []), ...(k?.questions ?? [])]) {
    if (!q.includes(" vs ")) continue;
    const parts = q.split(" vs ").map((s) => s.trim());
    /* 第一段是自己才认;其余段逐个补全简写 */
    if (!parts[0].includes(lower)) continue;
    for (const part of parts.slice(1)) {
      const hit = resolveVs(m, part.replace(/\b(reddit|which is better|price|pricing)\b.*$/, "").trim());
      if (hit && !out.includes(hit)) out.push(hit);
    }
    if (out.length >= n) break;
  }
  return out;
}
const kwText = (m: ModelEntry) => {
  const k = KW.find((x) => x.name === m.name);
  return [...(k?.suggest ?? []), ...(k?.questions ?? [])].join(" | ").toLowerCase();
};
const maxRes = (f?: ModelFacts) => (f?.resolutions?.length ? fmtRes(f.resolutions[f.resolutions.length - 1]) : undefined);

/* 对比行：只放每个模型都有真实数据的维度 */
function matchupRow(x: ModelEntry): Record<string, string> {
  const f = factsOf(x.slug);
  const from = fromOf(x);
  const row: Record<string, string> = { Developer: x.vendor, "Best for": x.desc };
  if (x.type === "video") {
    row["Clip length"] = f?.durations ? `${f.durations[0]}–${f.durations[1]} s` : "—";
    row["Max resolution"] = maxRes(f) ?? "—";
    row["Native audio"] = f ? (f.soundOff ? "Yes, can turn off" : "Yes") : "—";
  }
  if (x.type === "image") row["Max quality"] = maxRes(f) ?? "—";
  if (x.type !== "audio") row["Reference images"] = f?.refs?.images ? String(f.refs.images) : "—";
  row["Price on BuzzVideo"] = x.release === "v1.13" ? "At launch" : from ? `From ${from} credits` : "—";
  return row;
}

/** 把 geo-extra.ts 里按真实搜索词补的 FAQ 接在后面;和已有问题重复的(忽略大小写和标点)不重复加 */
function withGeoFaq(slug: string, faq: { q: string; a: string }[]) {
  const norm = (q: string) => q.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const have = new Set(faq.map((f) => norm(f.q)));
  return [...faq, ...(MODEL_GEO[slug]?.faq ?? []).filter((f) => !have.has(norm(f.q)))];
}

export function modelPageData(slug: string): ModelPageData | undefined {
  const m = MODELS.find((x) => x.slug === slug);
  if (!m) return undefined;
  const f = factsOf(slug);
  const prices = pricesOf(m);
  const from = prices.length ? Math.min(...prices.map((p) => p.credits)) : undefined;
  const fromLabel = prices.find((p) => p.credits === from)?.label;
  /* 2026-11-19 审核：只有一档报价(如 UAT 单档 10 s · 720p)时不是真正的起价，不说 from,直接写这一档 */
  const single = prices.length === 1;
  const isNew = m.release === "v1.13";
  const plans = FREE_OK.has(slug) ? "Free, Starter, Pro and Ultra" : PRO_ONLY.has(slug) ? "Pro and Ultra" : "Starter, Pro and Ultra";
  const h1 = h1Of(m, f);
  const kind = f?.audioKind;
  const what =
    m.type === "video" ? "AI video model" : m.type === "image" ? "AI image model" : kind === "music" ? "AI music model" : kind === "sound effects" ? "AI sound effects model" : kind === "voice clone" ? "voice cloning model" : kind === "all-in-one" ? "AI audio model" : "AI voice model";
  /* 定义句(GEO):一句话写全「名字 + 厂商 + 是什么 + 输入 + 规格」,能被 AI 单独引用;第二句写在 BuzzVideo 的起价(积分 + 美元) */
  const art = (w: string) => (/^[aeiou]/i.test(w) ? "an" : "a");
  const r0 = f?.refs;
  const refBits = [r0?.images && r0.images > 1 ? plural(r0.images, "reference image") : r0?.images ? "a reference image" : "", r0?.videos ? plural(r0.videos, "video") : "", r0?.audios ? plural(r0.audios, "audio clip") : ""].filter(Boolean) as string[];
  const qualityLevels = !!f?.resolutions?.length && f.resolutions.every((x) => QUALITY[x.toLowerCase()]);
  const topRes = f?.resolutions?.length && !qualityLevels ? fmtRes(f.resolutions[f.resolutions.length - 1]) : undefined;
  const capability =
    m.type === "video"
      ? `that turns text${refBits.length ? ` and up to ${andList(refBits)}` : ""} into ${f?.durations ? `${f.durations[0]}–${f.durations[1]} second clips` : "video clips"}${topRes ? ` at up to ${topRes}` : ""}${f ? (f.soundOff ? " with optional native audio" : " with native audio") : ""}`
      : m.type === "image"
        ? `that creates and edits images from text${refBits.length ? ` and up to ${andList(refBits)}` : ""}${topRes ? `, up to ${topRes}` : qualityLevels ? `, with ${f!.resolutions!.length} quality levels from ${f!.resolutions![0]} to ${f!.resolutions![f!.resolutions!.length - 1]}` : ""}`
        : "";
  /* 价格档位写成一句话里能读的说法：「10 s · 720p」→「10-second 720p clip」,「1K image」保持 */
  const tierPhrase = (l: string) => {
    const v = l.match(/^(\d+) s · (.+)$/);
    if (v) return `a ${v[1]}-second ${v[2]} clip`;
    if (/^per /i.test(l)) return `each ${l.replace(/^per /i, "").toLowerCase()}`;
    if (/quality/.test(l)) return `a ${l.replace(/ · /g, ", ").replace(/ quality/g, "-quality").toLowerCase().replace(/(\d)k/g, "$1K")} image`;
    return `a ${l}`;
  };
  const fromUsd = from !== undefined ? usdOf(from) : undefined;
  const definition = `${m.name} is ${art(what)} ${what} from ${m.vendor}${capability ? ` ${capability}` : ""}.${m.type === "audio" ? ` ${m.desc.replace(/\.$/, "")}.` : ""} ${
    isNew
      ? `${m.type === "audio" ? "" : `It is built for ${m.desc.charAt(0).toLowerCase()}${m.desc.slice(1).replace(/\.$/, "")}. `}It is coming to BuzzVideo in the next release.`
      : /* 2026-11-19 SEO/GEO 审核：定义句不带价格(调价会过期、AI 会引用旧价);价格只在 FAQ「How much does … cost?」里 */
        "It is available on BuzzVideo now."
  }`;

  const facts: [string, string][] = [["Developer", m.vendor], ["Type", what.replace(/^AI /, "").replace(/^\w/, (c) => c.toUpperCase())]];
  if (isNew) facts.push(["Status", "Coming in the next release"]);
  if (f?.durations) facts.push(["Video length", `${f.durations[0]}–${f.durations[1]} s`]);
  if (f?.resolutions?.length) facts.push([m.type === "image" && /Low|High/.test(f.resolutions.join()) ? "Quality levels" : "Resolution", f.resolutions.map(fmtRes).join(", ")]);
  if (f?.ratios?.length) facts.push(["Aspect ratios", f.ratios.join(", ")]);
  const r = f?.refs;
  if (r && (r.images || r.videos || r.audios)) facts.push(["References", [r.images && plural(r.images, "image"), r.videos && plural(r.videos, "video"), r.audios && plural(r.audios, "audio clip")].filter(Boolean).join(", ")]);
  if (m.type === "video" && f) facts.push(["Sound", f.soundOff ? "Native audio, can be turned off" : "Native audio, always on"]);
  if (!isNew) facts.push(["Plans", plans]);
  if (from) facts.push(["Price on BuzzVideo", `From ${from} credits`]);

  const priceNote = isNew
    ? "Credit prices appear here and in the generator at launch. You always see the exact price before you press Create."
    : slug === "seed-audio-1-0"
      ? "Billed by the second of audio you generate. Available on every plan, including Free."
      : prices.length
        ? `Credits per generation. Dollar values use the Pro yearly plan (about $${PRO_YEARLY_USD_PER_CREDIT.toFixed(4)} per credit).`
        : "The exact price shows in the generator before you press Create.";

  const where = m.type === "video" ? "Video" : m.type === "image" ? "Image" : "Audio";
  const step2 =
    m.type !== "audio"
      ? { title: "Describe what you want", body: `Write a prompt${r?.images ? ` and add up to ${plural(r.images, "reference image")}` : ""}, then pick the ${m.type === "video" ? "length, resolution" : "resolution"} and aspect ratio.` }
      : kind === "voice clone"
        ? { title: "Upload a voice sample", body: `Upload a short, clean recording of the voice${f?.notes?.find((n) => /\d+\s*(–|-|to)\s*\d+\s*s/.test(n)) ? ` (${f.notes.find((n) => /\d+\s*(–|-|to)\s*\d+\s*s/.test(n))})` : ""}, then type the script it should read.` }
        : kind === "music"
          ? { title: "Describe the track", body: "Describe the mood, genre and length, or paste your own lyrics." }
          : kind === "sound effects"
            ? { title: "Describe the sound", body: "Describe the sound you need and set how long it should run." }
            : { title: "Paste your script", body: "Paste the script, then pick a voice, language and speed." };
  const howTo = [
    {
      title: isNew ? `At launch, open ${m.name}` : `Open ${m.name}`,
      body: isNew ? `When it launches, choose ${where} in BuzzVideo and pick ${m.name} in the model menu, or ask the Marketing Agent to use it.` : `In BuzzVideo, choose ${where} and pick ${m.name} in the model menu, or ask the Marketing Agent to use it.`,
    },
    step2,
    { title: "Check the price, then create", body: "The credit price shows before you press Create. Download the result or keep editing in Canvas." },
  ];

  const vs = topVs(m) ?? MODELS.find((x) => x.slug !== m.slug && x.vendor === m.vendor && sameKind(m, x)) ?? MODELS.find((x) => x.slug !== m.slug && sameKind(m, x));
  const FREE_NAMES = "Seedream 4.5, Seedream 5.0 lite and Seed Audio 1.0";
  const faq: { q: string; a: string }[] = [
    { q: `What is ${m.name}?`, a: definition },
    {
      q: `Is ${m.name} free?`,
      a: isNew
        ? `${m.name} arrives with the next BuzzVideo release. Which plans include it will be confirmed at launch.`
        : FREE_OK.has(slug)
          ? `Yes. ${m.name} works on the Free plan, which includes 500 one-time credits. Free credits work on ${FREE_NAMES}.`
          : `Not on the Free plan. ${m.name} is available on ${plans}. Free credits work on ${FREE_NAMES}.`,
    },
  ];
  /* 2026-11-25 GEO:AI 回答「where can I use <模型>」引用的都是聚合平台 —— 每个模型页直接回答「在 BuzzVideo 能用」 */
  faq.splice(1, 0, {
    q: `Where can I use ${m.name}?`,
    a: isNew
      ? `${m.name} is coming to BuzzVideo in the next release, where it will sit alongside ${MODELS.length - 1} other AI video, image and audio models on one account.`
      : `You can use ${m.name} on BuzzVideo, alongside ${MODELS.length - 1} other AI video, image and audio models on one account and one credit balance. Open ${m.name} in the ${m.type} generator, write a prompt and generate.`,
  });
  if (from) faq.push({ q: `How much does ${m.name} cost?`, a: `On BuzzVideo, ${single ? `${tierPhrase(fromLabel ?? "")} with ${m.name} costs ${from} credits` : `${m.name} starts at ${from} credits${fromLabel ? ` (${fromLabel})` : ""}`}. ${prices.length > 1 ? `The full price list by ${m.type === "video" ? "length and resolution" : "setting"} is on this page.` : ""}`.trim() });
  faq.push({ q: `How do I use ${m.name}?`, a: `${howTo[0].body} ${howTo[1].body}` });
  if (vs) faq.push({ q: `${m.name} vs ${vs.name}: which should I use?`, a: vsRule(m, vs) });
  /* 只有 MCP list_models 里查到的模型才说能在 ChatGPT / Claude 里用 */
  if (!isNew && f?.source === "list_models") faq.push({ q: `Can I use ${m.name} in ChatGPT or Claude?`, a: `Yes. Connect BuzzVideo MCP to ChatGPT or Claude and ask for ${m.name} in the chat; it uses your BuzzVideo credits.` });

  /* ── 按这个模型的真实搜索补问题(docs/research/keywords/2026-11-18-models.json):时长 / 分辨率 / 比例 / 参考图 / prompt / API / 第二个 vs / 上线时间 ── */
  const kw = kwText(m);
  const top = maxRes(f);
  if (m.type === "video" && f?.durations) faq.push({ q: /video$/i.test(m.name) ? `How long can ${m.name} clips be?` : `How long can a ${m.name} video be?`, a: `${m.name} makes clips from ${f.durations[0]} to ${f.durations[1]} seconds in one generation${top ? `, at up to ${top}` : ""}. Longer clips cost more credits; the price shows before you create.` });
  if (f?.resolutions?.length && m.type !== "audio") faq.push({ q: f.resolutions.some((x) => /low|medium|high|max/i.test(String(x))) ? `What quality levels does ${m.name} support?` : `What resolution does ${m.name} support?`, a: `${m.name} outputs at ${andList(f.resolutions.map(fmtRes))}${f.ratios?.length ? `, in ${andList(f.ratios.filter((x) => /\d/.test(x)))} aspect ratios` : ""}.` });
  if (r?.images && r.images > 1) faq.push({ q: `How many reference images can ${m.name} use?`, a: `Up to ${plural(r.images, "reference image")}${r.videos ? `, ${plural(r.videos, "reference video")}` : ""}${r.audios ? ` and ${plural(r.audios, "audio clip")}` : ""} in one prompt, so a product, character or style stays the same across results.` });
  if ((/prompt/.test(kw) || m.type !== "audio") && kind !== "voice clone")
    faq.push({
      q: `How do I write a good ${m.name} prompt?`,
      a:
        m.type === "video"
          ? `Write it like a shot list: who or what is on screen, what happens, the camera move, light and length. Name the product the same way every time${r?.images ? ` and add up to ${plural(r.images, "reference image")} so it stays on model` : ""}.${mediaOf(m.slug).some((x) => x.prompt) ? ` Real ${m.name} prompts are shown on this page.` : ""}`
          : m.type === "image"
            ? `Say the subject, setting, light and framing, and put any on-image text in quotes. Add your product photo as a reference${r?.images && r.images > 1 ? ` (up to ${r.images})` : ""} and say "keep the label exactly the same".`
            : `Paste the exact script or describe the sound, then add direction: tone, pace and language${kind === "music" ? ", or genre, mood and length" : ""}.`,
    });
  if (!isNew && /\bapi\b/.test(kw)) faq.push({ q: `Is there ${art(m.name)} ${m.name} API on BuzzVideo?`, a: `BuzzVideo MCP lets ChatGPT, Claude and other AI agents call ${m.name} with your BuzzVideo credits.` });
  const more = vsList(m, 3).filter((x) => x.slug !== vs?.slug);
  if (more[0]) faq.push({ q: `${m.name} vs ${more[0].name}: what's the difference?`, a: vsRule(m, more[0]) });
  if (isNew && /release|launch/.test(kw)) faq.push({ q: `When is ${m.name} coming to BuzzVideo?`, a: `${m.name} is part of the next BuzzVideo release. This page will show prices and real examples when it goes live.` });

  /* 用途：只从真实参数推 */
  /* 2026-11-26 Monica:「所有落地页 Best uses for 全部写的太少了」—— 每条从一句话扩成 2–3 句：谁用它做什么 + 这个模型的真实参数 + 成品用在哪。仍然只用 model-facts / 价格里的事实。 */
  const goodFor: { title: string; body: string }[] = [];
  const N = m.name;
  const refLine = r?.images ? `${N} takes up to ${andList([plural(r.images, "reference image"), ...(r.videos ? [plural(r.videos, "reference video")] : []), ...(r.audios ? [plural(r.audios, "audio clip")] : [])])} in one prompt.` : "";
  const fromLine = from ? `Prices start at ${from} credits${fromLabel ? ` (${fromLabel})` : ""}, and the exact cost shows before you create.` : "The credit cost shows before you create.";
  if (m.type === "video") {
    if (f?.durations && f.durations[1] >= 20) goodFor.push({ title: "Long single takes", body: `Make UGC testimonials, product demos and walkthroughs in one continuous shot of up to ${f.durations[1]} seconds, with no cut to stitch. ${f.durations[0] < f.durations[1] ? `Clips start at ${f.durations[0]} seconds, so the same model also covers short hooks. ` : ""}A single take keeps the face, voice and product consistent from the first second to the last.` });
    if (r?.images && r.images >= 7) goodFor.push({ title: "Consistent products and characters", body: `${refLine} Upload the product from several angles, plus a face or a style frame, and the same bottle, logo and person show up in every shot. That lets you build a multi-clip ad or a series without the product drifting.` });
    if (top && /4K|2K/i.test(top)) goodFor.push({ title: "Big-screen hero shots", body: `Render the final cut at ${top} for landing page headers, YouTube and connected TV, where soft footage shows. Draft at a lower resolution first to save credits, then run the keeper at ${top}.` });
    if (f && !f.soundOff) goodFor.push({ title: "Clips with sound built in", body: `${N} generates dialogue, ambience and sound effects together with the picture, so lips and actions line up with what you hear. Clips come out ready to post on TikTok, Reels and YouTube Shorts without a separate audio pass.` });
    if (f?.soundOff) goodFor.push({ title: "Sound on or off", body: `Keep the native audio ${N} generates with the picture, or switch it off for a silent clip. Silent output is useful when you already have a voiceover, a licensed track or brand music to lay on top in the edit.` });
    if (from && from <= 60) goodFor.push({ title: "Fast, cheap drafts", body: `${fromLine} At that price you can test several hooks, angles or opening lines for one ad, then spend more only on the version that works. It suits daily social posts and ad testing where volume matters.` });
  } else if (m.type === "image") {
    if (/text|label|type|print/i.test(m.desc)) goodFor.push({ title: "Ads with readable text", body: `${N} renders headlines, price tags, labels and fine print spelled the way you typed them. Put the exact wording in quotes in your prompt. It suits sale banners, product packaging shots and social ads where a misspelled word would mean a redo.` });
    if (r?.images && r.images >= 8) goodFor.push({ title: "Product shots that stay on model", body: `${refLine} Upload your real product photos and ${N} keeps the shape, color and label as they are while it changes the scene, light and angle. One product can become a full set of lifestyle and studio shots.` });
    if (f?.notes?.some((n) => /transparent/i.test(n))) goodFor.push({ title: "Cutouts and transparent assets", body: `${N} can output images with a transparent background, so there is no separate cutout step. Use them for marketplace listings, stickers, logos and layered ad designs where the product sits on your own background.` });
    if (f?.ratios && f.ratios.length >= 8) goodFor.push({ title: "Every placement from one prompt", body: `${N} supports ${f.ratios.length} aspect ratios, from vertical stories and Reels covers to square feed posts and wide banners. Generate the same concept in each size instead of cropping one image and losing the product or the headline.` });
    if (from && from <= 5) goodFor.push({ title: "High-volume variations", body: `${fromLine} That makes it practical to generate dozens of versions of one ad with different backgrounds, colors or headlines, then test them against each other. It also suits catalog work with many products.` });
    if (top && /4K|2K|Max|X-High/i.test(top)) goodFor.push({ title: "Detail for print and hero visuals", body: `Output goes up to ${top}, enough for website hero images, posters and packaging mockups where fine texture and small type must hold up. Explore ideas at a lower setting, then render the final at ${top}.` });
  } else {
    if (kind === "music") goodFor.push({ title: "Ad soundtracks", body: `Describe the genre, mood, tempo and length and ${N} writes a track to fit your video, so you are not searching stock libraries for something close. Use it for ad beds, product launches and social videos. Everything you generate can be used commercially.` });
    if (kind === "sound effects") goodFor.push({ title: "Product reveals and transitions", body: `Describe a sound in plain words and ${N} generates it: whooshes, hits, clicks, pours and room ambience. Layer them under product reveals, text animations and scene changes so the cut feels finished.` });
    if (kind === "voice clone") goodFor.push({ title: "Your own voice on every ad", body: `Record a short sample once and ${N} reads any new script in that voice. Founders and creators can voice every ad, update and explainer without booking another recording session. Only clone voices you have the right to use.` });
    if (!kind || kind === "voiceover" || kind === "all-in-one") goodFor.push({ title: "Voiceover for ads and explainers", body: `Paste a script and ${N} returns natural narration you can drop onto a video. Set the tone and pace in the prompt. It suits product ads, explainers, tutorials and YouTube videos where you need a clean read without a recording booth.` });
    if (kind === "all-in-one") goodFor.push({ title: "Music and sound effects in the same tool", body: `${N} also makes background music and sound effects, so one model covers the whole audio track of an ad. Voiceover, music bed and effects all run on the same BuzzVideo credits.` });
    if (kind === "voiceover" || kind === "voice clone") goodFor.push({ title: "Social videos and localized versions", body: `Use ${N} for TikTok, Reels and YouTube Shorts voiceovers, or to re-voice the same ad for another market. ${fromLine}` });
    if (kind === "music") goodFor.push({ title: "Jingles, intros and podcast themes", body: `Use ${N} tracks as podcast intros, background music for YouTube videos or the base for a brand jingle. Name the style and instruments in the prompt, then trim the part you need in the editor. A short cut works well as a sound logo at the end of an ad.` });
  }
  /* 兜底：保证每页至少 3 条 */
  if (goodFor.length < 3) goodFor.push({ title: m.type === "video" ? "Ads and social videos" : m.type === "image" ? "Ads and product visuals" : "Audio for ads and videos", body: `${m.desc}. On BuzzVideo, ${N} sits next to every other ${m.type} model on one account, so you can run the same prompt on two models and keep the better result. ${fromLine}` });
  if (goodFor.length < 3 && refLine) goodFor.push({ title: "Work from your own references", body: `${refLine} Start from a real product photo, a brand frame or an earlier result instead of describing everything in words, and the output stays close to what you already have.` });
  if (goodFor.length < 3) goodFor.push({ title: "Inside the Marketing Agent", body: `Use ${N} on its own in the BuzzVideo generator, or let the Marketing Agent pick it as one step of a campaign plan, next to the image, video and audio models the plan needs. Both run on the same credits.` });

  const promptTips =
    m.type === "video"
      ? ["Subject and action first", "Then camera move and framing", `Then light, mood and length${f?.durations ? ` (${f.durations[0]}–${f.durations[1]} s)` : ""}`, r?.images ? `Add up to ${plural(r.images, "reference image")} for the product or character` : "Name the product the same way every time"]
      : m.type === "image"
        ? ["Subject, setting and light", "Framing and lens", "Any on-image text in quotes", r?.images ? `Product photo as a reference (up to ${r.images})` : "Keep the label wording exact"]
        : ["The exact script or sound", "Tone and pace", "Language and accent", kind === "music" ? "Genre, mood and length" : "Where pauses go"];

  const matchupModels = [m, ...(vs ? [vs] : []), ...more].filter((x, i, arr) => arr.indexOf(x) === i).slice(0, 3);
  const matchupAll = matchupModels.map((x) => ({ m: x, rows: matchupRow(x) }));
  /* 有效对比维度少于 2 个(比如两边都是「At launch」的音频)就不放对比 */
  const useful = Object.keys(matchupAll[0]?.rows ?? {}).filter((k) => !["Developer", "Best for"].includes(k) && matchupAll.some((x) => !["—", "At launch"].includes(x.rows[k])));
  const matchup = matchupAll.length > 1 && useful.length >= 2 ? matchupAll : matchupAll.slice(0, 1);
  const matchupRows = Object.keys(matchup[0]?.rows ?? {});

  const sameType = MODELS.filter((x) => x.slug !== m.slug && sameKind(m, x));
  const compare = [m, ...[...sameType.filter((x) => x.featured), ...sameType.filter((x) => !x.featured)].slice(0, 5)].map((x) => ({ m: x, from: fromOf(x) }));
  const allType = MODELS.filter((x) => x.type === m.type && x.slug !== m.slug);
  const related = [...allType.filter((x) => x.vendor === m.vendor), ...allType.filter((x) => x.vendor !== m.vendor)].slice(0, 8);

  const sources = isNew ? [] : [{ label: "BuzzVideo pricing (live credit prices)", url: "https://buzzvideo.ai/pricing" }];

  return {
    m,
    f,
    h1,
    typeWord: TYPE_WORD[m.type],
    definition,
    /* ≤60 字符、品牌后缀一定在：按候选依次取第一个放得下的 */
    metaTitle: MODEL_GEO[m.slug]?.metaTitle ?? (META_TITLE[m.slug] ? [META_TITLE[m.slug]] : isNew ? [`${h1}: Specs & Release | BuzzVideo`, `${h1} | BuzzVideo`] : [`${h1}: Price, Specs & Prompts | BuzzVideo`, `${h1}: Price & Specs | BuzzVideo`, `${h1} | BuzzVideo`]).concat(`${m.name} | BuzzVideo`).find((x) => x.length <= 60) ?? `${m.name} | BuzzVideo`,
    /* 按整句拼，超长就去掉后面的句子，不在半句处截断(2026-11-19 审核) */
    metaDescription: MODEL_GEO[m.slug]?.metaDescription ?? [
      `${m.desc.replace(/\.$/, "")}.`,
      isNew ? `${m.name} is coming soon to BuzzVideo.` : `Use ${m.name}${m.name.toLowerCase().includes(m.vendor.toLowerCase().split(" ")[0]) ? "" : ` by ${m.vendor}`} on BuzzVideo${from !== undefined ? (single ? `, ${from} credits for ${fromLabel}` : `, from ${from} credits`) : ""}.`,
      isNew ? "Specs, examples and FAQ." : "Specs, prices, prompts and FAQ.",
      /* 2026-11-25 SEO:描述太短(<120 字符)的再补一句，放得下才加 */
      `Compare it with other AI ${m.type} models on one account.`,
    ].reduce((acc, x) => (acc.length + x.length + 1 <= 160 ? `${acc} ${x}`.trim() : acc), ""),
    facts,
    prices,
    priceNote,
    fromCredits: from,
    fromSingle: single ? fromLabel : undefined,
    plans,
    howTo,
    faq: withGeoFaq(m.slug, isNew ? faq : [...faq, { q: `Can I use ${m.name} outputs commercially?`, a: `Yes. Everything you generate on BuzzVideo, including with ${m.name}, can be used commercially on every plan.` }]),
    compare,
    related,
    sources,
    goodFor: goodFor.slice(0, 4),
    promptTips,
    matchup,
    matchupRows,
  };
}

export const usdOf = (credits: number) => (credits * PRO_YEARLY_USD_PER_CREDIT).toFixed(2);
