/* 生成失败后的那一问(spec 2026-10-15-hybrid-reel-exceptions-design.md 第 1、2 条):不自动重试,失败即停下来问。
   等所有生成结算完、退回失败项的积分后,用 Claude 式提问卡问一次怎么继续。选项按失败原因变:

   AI 补拍失败(多个失败镜头合成一问;原因混着时只要有一个审核没过就按审核那一套):
   - 临时故障(busy:繁忙 / 超时 / 网络):Retry(推荐)/ Try another model / Animate a product photo / Use your footage instead / Cut it from the ad / Other
   - 审核没过(moderation:敏感参考图、真人脸、品牌 IP):Rewrite the prompt and retry(推荐,改完先给用户看新 prompt,点 Generate 才扣费)/
     Use a different reference / Animate a product photo / Use your footage instead / Cut it from the ad / Other
   - 「Animate a product photo」只在素材里有产品图时出现;「Use your footage instead」只在有可用视频片段时出现
   配音失败:
   - busy:Retry the voiceover(推荐)/ Try another voice / Skip the voiceover / Other
   - script(旁白稿含敏感词):Rewrite the script and retry(推荐,同样先给看新稿)/ Try another voice / Skip the voiceover / Other
   Other:写一句话 = 当作改稿要求(和在输入框里说一样)。
   提问卡、改写卡是产品 UI,一律英文;Agent 接下来的那句回复跟回复语言。纯函数。 */

import { onScreenSec, type ClipProfile, type Outline, type Shot } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";
import { LEGACY_VOICE, VOICES, voiceOf } from "@/lib/hybrid-reel/voices";
import { fmtCredits, shotCost } from "./credits";
import { listNums } from "./genGrid";
import type { Answers, Question } from "./questions";
import type { ShotFail, ShotFailKind, VoiceFailKind } from "./runs";
import { voiceCost } from "./voice";

/** 补拍失败的选项 */
export type FailureChoice = "retry" | "model" | "reference" | "rewrite" | "photo" | "footage" | "cut";
/** 配音失败的选项 */
export type VoiceChoice = "retry" | "voice" | "rewrite" | "skip";
/** 用户的回答:选了一项,或 Other 里写的一句话(当改稿处理) */
export type FailureAnswer = { choice: FailureChoice | VoiceChoice | EditChoice } | { other: string };

/** 「Try another model」换用的视频模型 */
export const FAST_MODEL = "Seedance 2.0 Fast";

/* 实拍可剪的素材身份(与 questions.ts 的 CUTTABLE 同口径;图片 / 品牌素材不拿来顶镜头) */
const CUTTABLE = new Set(["footage", "showcase", "evidence"]);
/* 产品图:图片素材里除了品牌 logo、风格参考、没用上的,都算 */
const NOT_PRODUCT = new Set(["brand", "reference", "unused"]);

type Seg = { clipIndex: number; start: number; end: number; roles: string[] };

/** 可以拿来顶替的素材片段:视频里的可用片段 */
function footagePool(profiles: ClipProfile[]): Seg[] {
  return profiles.flatMap((p, clipIndex) =>
    p.kind === "video" && CUTTABLE.has(p.identity ?? "footage")
      ? (p.segments ?? []).filter((g) => g.usable && g.end > g.start).map((g) => ({ clipIndex, start: g.start, end: g.end, roles: g.roles ?? [] }))
      : [],
  );
}

export const canUseFootage = (profiles: ClipProfile[]) => footagePool(profiles).length > 0;

/** 第一张产品图在素材里的下标;没有返回 undefined(「Animate a product photo」不出现) */
export function productPhoto(profiles: ClipProfile[]): number | undefined {
  const i = profiles.findIndex((p) => p.kind === "image" && !NOT_PRODUCT.has(p.identity ?? "showcase"));
  return i < 0 ? undefined : i;
}

const shotsLabel = (shots: number[]) => `${shots.length === 1 ? "Shot" : "Shots"} ${listNums(shots)}`;
const round1 = (n: number) => Math.round(n * 10) / 10;

/** 失败镜头加起来多长(删掉后成片短多少秒) */
export const failedSec = (outline: Outline, shots: number[]) => round1(shots.reduce((t, n) => t + (outline.shots[n - 1] ? onScreenSec(outline.shots[n - 1]) : 0), 0));

/** 多个失败镜头合成一问时按哪一套问:有一个审核没过就按审核(原样重试对它没用) */
export const failureKind = (fail: ShotFail[]): ShotFailKind => (fail.some((f) => f.kind === "moderation") ? "moderation" : "busy");

/** 补拍失败的那一问。title 举例:"Shot 3 didn't generate. How should I continue?" / "Shots 2 and 3 didn't generate. How should I continue?" */
export function failureQuestion(outline: Outline, shots: number[], profiles: ClipProfile[], kind: ShotFailKind = "busy"): Question {
  const one = shots.length === 1;
  const cost = fmtCredits(shotCost(outline) * shots.length);
  const it = one ? "it" : "them";
  const photo =
    productPhoto(profiles) !== undefined
      ? [{ value: "photo", label: one ? "Animate a product photo" : "Animate product photos", description: "Pan and zoom over your product image · no credits" }]
      : [];
  const tail = [
    ...photo,
    ...(canUseFootage(profiles)
      ? [{ value: "footage", label: "Use your footage instead", description: `Fill ${one ? "this beat" : "these beats"} with your closest matching ${one ? "clip" : "clips"} · no credits` }]
      : []),
    { value: "cut", label: `Cut ${it} from the ad`, description: `Make the ad without ${one ? "this beat" : "these beats"} · the ad gets ${failedSec(outline, shots)}s shorter` },
  ];
  const head =
    kind === "moderation"
      ? [
          { value: "rewrite", label: one ? "Rewrite the prompt and retry" : "Rewrite the prompts and retry", description: "I'll soften what may have tripped the check and show you first" },
          { value: "reference", label: "Use a different reference", description: `Pick another image, or generate without one · ${cost} credits` },
        ]
      : [
          { value: "retry", label: `Retry ${one ? "shot" : "shots"} ${listNums(shots)}`, description: `Generate ${it} again · ${cost} credits` },
          { value: "model", label: "Try another model", description: `Generate ${it} with ${FAST_MODEL} · ${cost} credits` },
        ];
  return {
    id: "failure",
    title: `${shotsLabel(shots)} didn't generate. How should I continue?`,
    multi: false,
    options: [...head, ...tail],
    defaults: [kind === "moderation" ? "rewrite" : "retry"],
  };
}

/** 换一个音色:同语言、同性别优先的另一个音色 */
const ALT_VOICE: Record<string, string> = {
  "warm-f": "bright-f",
  "bright-f": "warm-f",
  "energy-f": "warm-f",
  "deep-m": "narr-m",
  "narr-m": "deep-m",
  "calm-m": "deep-m",
  "cn-f": "cn-m",
  "cn-m": "cn-f",
};
export function otherVoice(id?: string): { id: string; label: string } {
  const cur = voiceOf(id ? (LEGACY_VOICE[id] ?? id) : undefined).id;
  const alt = VOICES.find((v) => v.id === (ALT_VOICE[cur] ?? "bright-f")) ?? VOICES[1];
  return { id: alt.id, label: alt.label };
}

/** 配音失败的那一问 */
export function voiceFailureQuestion(outline: Outline, kind: VoiceFailKind = "busy"): Question {
  const cost = fmtCredits(voiceCost(outline));
  const head =
    kind === "script"
      ? { value: "rewrite", label: "Rewrite the script and retry", description: "I'll swap out words that may have tripped the check and show you first" }
      : { value: "retry", label: "Retry the voiceover", description: `Generate it again · ${cost} credits` };
  return {
    id: "failure",
    title: "The voiceover didn't generate. How should I continue?",
    multi: false,
    options: [
      head,
      { value: "voice", label: "Try another voice", description: `${otherVoice(outline.voiceover?.voice).label} · same cost` },
      { value: "skip", label: "Skip the voiceover", description: "Subtitles and music only · no credits" },
    ],
    defaults: [head.value],
  };
}

/** 提问卡的回答 → 选择;Skip 已在卡片里落到推荐项。Other 有字就当改稿。传了 question 时只认它里面的选项,认不出落到推荐项 */
export function failureAnswer(a: Answers, q?: Question): FailureAnswer {
  const ans = a.failure;
  const other = ans?.other?.trim();
  const pick = ans?.picked[0];
  if (!pick && other) return { other };
  if (q) return { choice: (q.options.some((o) => o.value === pick) ? pick : (q.defaults[0] ?? "retry")) as FailureChoice | VoiceChoice | EditChoice };
  return { choice: (pick ?? "retry") as FailureChoice | VoiceChoice | EditChoice };
}

/** 用素材顶上:每个失败镜头换成一段最接近的可用片段 —— 先挑还没用过、角色对得上的,再挑没用过的,最后才重复用;
    时长不超过原镜头,也不超出那一段。没有可用素材时原样返回(选项本来就不出现) */
export function fillWithFootage(outline: Outline, shots: number[], profiles: ClipProfile[]): Outline {
  const pool = footagePool(profiles);
  if (!pool.length) return outline;
  const usedBy = (seg: Seg, list: Shot[]) =>
    list.some((s) => s.source.kind === "clip" && s.source.clipIndex === seg.clipIndex && s.source.inSec < seg.end && s.source.outSec > seg.start);
  const next = [...outline.shots];
  for (const n of shots) {
    const shot = next[n - 1];
    if (shot?.source.kind !== "generate") continue;
    const rank = (g: Seg) => (usedBy(g, next) ? 2 : 0) + (g.roles.includes(shot.role) ? 0 : 1);
    const seg = [...pool].sort((a, b) => rank(a) - rank(b))[0];
    const outSec = round1(Math.min(seg.end, seg.start + shot.durationSec));
    next[n - 1] = {
      role: shot.role,
      durationSec: round1(outSec - seg.start),
      source: { kind: "clip", clipIndex: seg.clipIndex, inSec: seg.start, outSec },
      subtitle: shot.subtitle,
      ...(shot.cards ? { cards: shot.cards } : {}),
      ...(shot.delivery ? { delivery: shot.delivery } : {}),
      ...(shot.pace ? { pace: shot.pace } : {}),
    };
  }
  return { ...outline, shots: next };
}

/** 用产品图做动态镜头:失败的镜头换成产品图的静帧 + 慢推镜(和素材一样不扣积分),时长、台词、字卡不变 */
export function animatePhoto(outline: Outline, shots: number[], profiles: ClipProfile[]): Outline {
  const img = productPhoto(profiles);
  if (img === undefined) return outline;
  const next = outline.shots.map((shot, i) => {
    if (!shots.includes(i + 1) || shot.source.kind !== "generate") return shot;
    return {
      role: shot.role,
      durationSec: shot.durationSec,
      source: { kind: "clip" as const, clipIndex: img, inSec: 0, outSec: shot.durationSec },
      treatment: { motion: "push-in" as const, note: "Pan and zoom over your product photo" },
      subtitle: shot.subtitle,
      ...(shot.cards ? { cards: shot.cards } : {}),
      ...(shot.delivery ? { delivery: shot.delivery } : {}),
      ...(shot.pace ? { pace: shot.pace } : {}),
    };
  });
  return { ...outline, shots: next };
}

/** 改补拍镜头的生成参数(只动失败的那几镜) */
function mapGen(outline: Outline, shots: number[], f: (src: Extract<Shot["source"], { kind: "generate" }>, n: number) => Extract<Shot["source"], { kind: "generate" }>): Outline {
  return {
    ...outline,
    shots: outline.shots.map((shot, i) => (shots.includes(i + 1) && shot.source.kind === "generate" ? { ...shot, source: f(shot.source, i + 1) } : shot)),
  };
}

/** 换模型重跑:失败的镜头标上 Seedance 2.0 Fast */
export const withModel = (outline: Outline, shots: number[], model = FAST_MODEL) => mapGen(outline, shots, (src) => ({ ...src, model }));

/** 换参考图 / 不用参考图:原型里直接去掉参考图(和尾帧)再生成 */
export const withoutRefs = (outline: Outline, shots: number[]) =>
  mapGen(outline, shots, (src) => {
    const { refs: _refs, lastFrame: _lastFrame, ...rest } = src;
    void _refs;
    void _lastFrame;
    return rest;
  });

/** 删掉失败的镜头;封面指着的镜头号跟着挪 */
export function cutShots(outline: Outline, shots: number[]): Outline {
  const drop = new Set(shots.map((n) => n - 1));
  const kept = outline.shots.filter((_, i) => !drop.has(i));
  let cover = outline.cover;
  if (cover) {
    /* 被删的是封面镜头时落到它后面那一镜 */
    const idx = cover.shot - [...drop].filter((i) => i < cover!.shot).length;
    cover = { ...cover, shot: Math.max(0, Math.min(idx, kept.length - 1)) };
  }
  return { ...outline, shots: kept, ...(cover ? { cover } : {}) };
}

/** 换音色重做配音 */
export const withVoice = (outline: Outline, voice: string): Outline => ({
  ...outline,
  voiceover: { why: outline.voiceover?.why ?? "", ...outline.voiceover, on: true, voice },
});

/** 不要配音:字幕(台词照旧显示)+ 音乐出片;配音积分不再计 */
export const withoutVoiceover = (outline: Outline): Outline => ({
  ...outline,
  voiceover: { why: outline.voiceover?.why ?? "", ...outline.voiceover, on: false },
});

/* ── 改写(审核没过 / 旁白稿含敏感词):确定性改写,原型里不调模型 ── */

/* lang:这条规则只用在英文 / 中文 prompt 上 */
type Swap = { re: RegExp; to: string; what: { en: string; zh: string }; lang: "en" | "zh" };
/* prompt 里可能触发审核的说法 → 更中性的写法;what = Agent 那句里说去掉了什么 */
const FACE = { en: "the close-up of a face", zh: "人脸特写" };
const LOGO = { en: "the brand logo", zh: "品牌 logo" };
const PROMPT_SWAPS: Swap[] = [
  { re: /close[- ]up (handheld )?shot of (a|the) [^,.]*?(woman|girl|shopper)/gi, to: "Close-up shot of a hand", what: FACE, lang: "en" },
  { re: /(rubbing|touching) (her )?cheek/gi, to: "rubbing in lotion", what: FACE, lang: "en" },
  { re: /after washing her face/gi, to: "after washing up", what: FACE, lang: "en" },
  { re: /,?\s*frowning [^,.]*/gi, to: "", what: FACE, lang: "en" },
  { re: /(her )?frustrated expression/gi, to: "her hands", what: FACE, lang: "en" },
  { re: /(the )?dry skin on her cheek/gi, to: "the dry skin on her hand", what: FACE, lang: "en" },
  { re: /(official )?brand (logo|wordmark)( end frame)?/gi, to: "clean product end frame", what: LOGO, lang: "en" },
  { re: /25岁左右东亚女生|女生/g, to: "模特", what: FACE, lang: "zh" },
  { re: /[，,]?\s*对着(手机|镜子)自拍/g, to: "", what: FACE, lang: "zh" },
  { re: /脸颊|面部|脸上/g, to: "手背", what: FACE, lang: "zh" },
  { re: /[，,]?\s*(露出[^，。]*表情|表情[^，。]*)/g, to: "", what: FACE, lang: "zh" },
  { re: /品牌(官方)?logo(画面)?/g, to: "产品定格画面", what: LOGO, lang: "zh" },
];
const SAFE_LINE = { en: "No identifiable faces, no brand logos or trademarks.", zh: "画面中不出现可识别的人脸、品牌 logo 或商标。" };

const CJK = /[㐀-鿿]/;
const tidy = (t: string) =>
  t
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([,.，。])/g, "$1")
    .replace(/([,，])\s*([,，.。])/g, "$2")
    .replace(/^[,，]\s*/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

/** 改写一个补拍 prompt:去掉参考图引用(@Image n 那句)、人脸特写、品牌 logo 这类可能触发审核的内容,末尾加一句约束。
    removed = 去掉了什么(给 Agent 那句话用,跟回复语言) */
export function rewritePrompt(prompt: string, lang: "zh" | "en" = "en"): { after: string; removed: string[] } {
  const zh = CJK.test(prompt);
  const removed: string[] = [];
  const note = (w: { en: string; zh: string }) => {
    const label = lang === "zh" ? w.zh : w.en;
    if (!removed.includes(label)) removed.push(label);
  };
  let text = prompt;
  /* 参考图:整句去掉,其余地方的 @Image n (xxx) 换成 the product */
  if (/@Image\s*\d/.test(text)) {
    note({ en: "the reference image", zh: "参考图" });
    text = text
      .split("\n")
      .map((line) => (/^\s*@Image\s*\d/.test(line) ? "" : line))
      .join("\n")
      .replace(/(\bthe\s+(solid\s+white\s+)?)?@Image\s*\d+\s*(\([^)]*\))?(\s*end frame)?\s*/g, (m) => (zh ? "产品" : /end frame/.test(m) ? "a plain white product end frame " : "the product "));
  }
  for (const s of PROMPT_SWAPS) {
    if (s.lang !== (zh ? "zh" : "en")) continue;
    if (s.re.test(text)) {
      note(s.what);
      text = text.replace(s.re, s.to);
    }
    s.re.lastIndex = 0;
  }
  const safe = zh ? SAFE_LINE.zh : SAFE_LINE.en;
  return { after: `${tidy(text)}\n\n${safe}`, removed };
}

/* 旁白稿里可能触发审核的词(绝对化 / 功效夸大)→ 更稳妥的说法;word = Agent 那句里说换掉了哪个词 */
const SCRIPT_SWAPS: { re: RegExp; to: string; word: string }[] = [
  { re: /\ba perfect(ly)? even\b/gi, to: "an even", word: "perfect" },
  { re: /\bperfect(ly)?\s+/gi, to: "", word: "perfect" },
  { re: /\bimpossible\b/gi, to: "a hassle", word: "impossible" },
  { re: /\b1 full serum bottle\b/gi, to: "a serum's worth of care", word: "1 full serum bottle" },
  { re: /\bguaranteed?\b/gi, to: "made", word: "guaranteed" },
  { re: /\bbest\b/gi, to: "go-to", word: "best" },
  { re: /\bcures?\b/gi, to: "soothes", word: "cure" },
  { re: /爆皮/g, to: "起皮", word: "爆皮" },
  { re: /顶1瓶精华/g, to: "满满精华", word: "顶1瓶精华" },
  { re: /专属限时/g, to: "限时", word: "专属限时" },
  { re: /超(?=[一-鿿])/g, to: "很", word: "超" },
  { re: /最(?=[一-鿿])/g, to: "很", word: "最" },
];

/** 改写旁白稿:逐句换掉可能触发审核的词。swapped = 被换掉的原词(Agent 那句里列出来) */
export function rewriteScript(lines: string[]): { after: string[]; swapped: string[] } {
  const swapped: string[] = [];
  const after = lines.map((line) => {
    let t = line;
    for (const s of SCRIPT_SWAPS) {
      t = t.replace(s.re, () => {
        if (!swapped.includes(s.word)) swapped.push(s.word);
        return s.to;
      });
    }
    return t.replace(/\s{2,}/g, " ").trim();
  });
  return { after, swapped };
}

/** 改写卡的一项:补拍镜头(shot)或整条旁白稿(没有 shot);before / after 是改写前后的全文 */
export type RewriteItem = { shot?: number; before: string; after: string };
/** 改写提案:Agent 那句 + 改写卡;点 Generate 才扣 cost 并重跑 */
export type RewriteProposal = { text: string; items: RewriteItem[]; cost: number };

const joinWords = (ws: string[], lang: "zh" | "en") =>
  ws.length <= 1 ? ws.join("") : lang === "zh" ? `${ws.slice(0, -1).join("、")}和${ws[ws.length - 1]}` : ws.length <= 1 ? ws.join("") : `${ws.slice(0, -1).join(", ")} and ${ws[ws.length - 1]}`;

/** 补拍审核没过 → 改写这几镜的 prompt */
export function promptRewrite(outline: Outline, shots: number[], lang: "zh" | "en"): RewriteProposal {
  const items: RewriteItem[] = [];
  const removed: string[] = [];
  for (const n of shots) {
    const src = outline.shots[n - 1]?.source;
    if (src?.kind !== "generate") continue;
    const r = rewritePrompt(src.prompt, lang);
    r.removed.forEach((w) => !removed.includes(w) && removed.push(w));
    items.push({ shot: n, before: src.prompt, after: r.after });
  }
  const one = shots.length === 1;
  const what = joinWords(removed, lang);
  const text =
    lang === "zh"
      ? `我去掉了可能触发审核的${what || "敏感内容"}。第 ${shots.join("、")} 镜的新 prompt:`
      : `I removed ${what || "the parts"} that may have tripped the check. Here's the new prompt${one ? "" : "s"} for ${one ? "shot" : "shots"} ${listNums(shots)}:`;
  return { text, items, cost: shotCost(outline) * items.length };
}

/** 旁白稿含敏感词 → 改写整条旁白稿 */
export function scriptRewrite(outline: Outline, lines: string[], lang: "zh" | "en"): RewriteProposal {
  const { after, swapped } = rewriteScript(lines);
  const quoted = swapped.map((w) => (lang === "zh" ? `「${w}」` : `“${w}”`));
  const what = joinWords(quoted, lang);
  const text =
    lang === "zh"
      ? `我换掉了可能触发审核的${what || "说法"}。新的旁白稿:`
      : `I swapped out ${what || "the wording"} that may have tripped the check. Here's the new script:`;
  return { text, items: [{ before: lines.join("\n"), after: after.join("\n") }], cost: voiceCost(outline) };
}

/** 用(可能被用户改过的)新 prompt 重跑:写回这几镜的 prompt,去掉参考图 */
export function applyPrompts(outline: Outline, items: RewriteItem[]): Outline {
  const byShot = new Map(items.flatMap((it) => (it.shot ? [[it.shot, it.after] as const] : [])));
  const shots = [...byShot.keys()];
  return mapGen(withoutRefs(outline, shots), shots, (src, n) => ({ ...src, prompt: byShot.get(n) ?? src.prompt }));
}

/** 用(可能被用户改过的)新旁白稿重做配音:按顺序写回有旁白台词的镜头;行数少了的保留原句 */
export function applyScript(outline: Outline, script: string): Outline {
  const lines = script.split("\n").map((l) => l.trim()).filter(Boolean);
  let k = 0;
  return {
    ...outline,
    shots: outline.shots.map((s) => {
      if (s.subtitle?.source !== "authored" || !s.subtitle.text.trim()) return s;
      const line = lines[k++];
      return line ? { ...s, subtitle: { ...s.subtitle, text: line } } : s;
    }),
  };
}

/* ── 回答之后怎么续跑(provider 与评审预置共用) ── */

/** 续跑:outline = 续跑用的分镜,cost = 这次扣多少,mode = 只重跑镜头 / 只重做配音 / 直接剪;voiceLabel = 换上的音色名(Agent 那句用) */
export type ContinuePlan = { outline: Outline; cost: number; mode: { only?: number[]; editOnly?: boolean; voiceOnly?: boolean }; voiceLabel?: string };

/** 补拍失败的选择 → 续跑怎么跑:要生成的只重跑失败的镜头(扣每镜积分),其余直接剪 */
export function shotPlan(choice: FailureChoice, outline: Outline, shots: number[], profiles: ClipProfile[]): ContinuePlan {
  const gen = (o: Outline): ContinuePlan => ({ outline: o, cost: shotCost(o) * shots.length, mode: { only: shots } });
  const edit = (o: Outline): ContinuePlan => ({ outline: o, cost: 0, mode: { editOnly: true } });
  switch (choice) {
    case "model":
      return gen(withModel(outline, shots, FAST_MODEL));
    case "reference":
      return gen(withoutRefs(outline, shots));
    case "photo":
      return edit(animatePhoto(outline, shots, profiles));
    case "footage":
      return edit(fillWithFootage(outline, shots, profiles));
    case "cut":
      return edit(cutShots(outline, shots));
    default:
      return gen(outline);
  }
}

/** 配音失败的选择 → 续跑:重做 / 换音色只重做配音(扣配音积分),不要配音直接剪 */
export function voicePlan(choice: VoiceChoice, outline: Outline): ContinuePlan {
  if (choice === "skip") return { outline: withoutVoiceover(outline), cost: 0, mode: { editOnly: true } };
  if (choice === "voice") {
    const v = otherVoice(outline.voiceover?.voice);
    return { outline: withVoice(outline, v.id), cost: voiceCost(outline), mode: { voiceOnly: true }, voiceLabel: v.label };
  }
  return { outline, cost: voiceCost(outline), mode: { voiceOnly: true } };
}

/** 回答后 Agent 的那一句(跟回复语言)。shots 为空 = 配音那一问 */
export function continueText(choice: FailureChoice | VoiceChoice, shots: number[], lang: "zh" | "en", voiceLabel?: string): string {
  const zhNums = shots.join("、");
  const label = `${shots.length === 1 ? "shot" : "shots"} ${listNums(shots)}`;
  if (!shots.length) {
    if (lang === "zh") {
      if (choice === "voice") return `换成 ${voiceLabel ?? "另一个音色"} 重新配音,好了接着剪。`;
      if (choice === "skip") return "这次不要配音,用字幕和音乐接着剪。";
      return "重新生成配音,好了接着剪。";
    }
    if (choice === "voice") return `Redoing the voiceover with ${voiceLabel ?? "another voice"}, then I'll finish the edit.`;
    if (choice === "skip") return "Skipping the voiceover and finishing the edit with subtitles and music.";
    return "Retrying the voiceover, then I'll finish the edit.";
  }
  if (lang === "zh") {
    if (choice === "retry") return `重新生成第 ${zhNums} 镜,好了接着剪。`;
    if (choice === "model") return `第 ${zhNums} 镜换 ${FAST_MODEL} 重新生成,好了接着剪。`;
    if (choice === "reference") return `第 ${zhNums} 镜不带参考图重新生成,好了接着剪。`;
    if (choice === "rewrite") return `用新 prompt 重新生成第 ${zhNums} 镜,好了接着剪。`;
    if (choice === "photo") return `第 ${zhNums} 镜换成产品图的动态镜头,接着剪。`;
    if (choice === "footage") return `第 ${zhNums} 镜换成你的素材,接着剪。`;
    return `去掉第 ${zhNums} 镜,接着剪。`;
  }
  if (choice === "retry") return `Retrying ${label}, then I'll finish the edit.`;
  if (choice === "model") return `Retrying ${label} with ${FAST_MODEL}, then I'll finish the edit.`;
  if (choice === "reference") return `Retrying ${label} without the reference image, then I'll finish the edit.`;
  if (choice === "rewrite") return `Generating ${label} with the new prompt, then I'll finish the edit.`;
  if (choice === "photo") return `Animating your product photo for ${label} and finishing the edit.`;
  if (choice === "footage") return `Filling ${label} with your footage and finishing the edit.`;
  return `Cutting ${label} from the ad and finishing the edit.`;
}

/** 改写后点 Generate 的那一句(配音:shots 为空) */
export const rewriteGenerateText = (shots: number[], lang: "zh" | "en") =>
  shots.length
    ? continueText("rewrite", shots, lang)
    : lang === "zh"
      ? "用新旁白稿重新配音,好了接着剪。"
      : "Redoing the voiceover with the new script, then I'll finish the edit.";

/* ── 剪辑 / 渲染失败(异常处理 spec 第 8 条):所有生成都成功、Agent 自己剪的时候失败 ──
   已生成的镜头和配音都留着、不重扣;失败时先退 40 基础费,问一次:重剪(推荐,只重跑剪辑,开跑时再扣 40)/ 进画布自己剪 / Other(改稿)。 */

/** 剪辑失败那一问的选项 */
export type EditChoice = "retry" | "canvas";

/** 失败时退的基础费 = 重剪要扣的 */
export const editCost = (outline: Outline) => outline.credits.base ?? 40;

/** 失败时 Agent 那一句(跟回复语言):说清已生成的还在 + 退了多少 */
export function editFailText(outline: Outline, refund: number, lang: "zh" | "en"): string {
  const shots = outline.shots.some((s) => s.source.kind === "generate");
  const voice = voiceCost(outline) > 0;
  if (lang === "zh") {
    const kept = shots && voice ? "已生成的镜头和配音都还在" : shots ? "已生成的镜头都还在" : voice ? "已生成的配音还在" : "你的素材都还在";
    return `剪辑没完成 —— ${kept}。退回 ${fmtCredits(refund)} 积分。`;
  }
  const kept = shots && voice ? "your shots and voiceover are safe" : shots ? "your shots are safe" : voice ? "your voiceover is safe" : "your footage is safe";
  return `I couldn't finish the edit — ${kept}. ${fmtCredits(refund)} credits refunded.`;
}

/** 剪辑失败那一问(产品 UI,英文) */
export function editFailureQuestion(outline: Outline): Question {
  return {
    id: "failure",
    title: "The edit didn't finish. How should I continue?",
    multi: false,
    options: [
      { value: "retry", label: "Retry the edit", description: `Re-cut with what's already generated · ${fmtCredits(editCost(outline))} credits` },
      { value: "canvas", label: "Open in canvas", description: "Everything is on the canvas to edit yourself" },
    ],
    defaults: ["retry"],
  };
}

/** 选「Retry the edit」:不再生成,只重跑剪辑,开跑时扣基础费 */
export const editPlan = (outline: Outline): ContinuePlan => ({ outline, cost: editCost(outline), mode: { editOnly: true } });

/** 选「Retry the edit」后 Agent 那一句 */
export const editRetryText = (lang: "zh" | "en") => (lang === "zh" ? "用已生成的镜头和配音重新剪。" : "Re-cutting the reel with what's already generated.");
