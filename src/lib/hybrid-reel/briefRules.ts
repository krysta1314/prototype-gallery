/* brief 接口的规则部分:平台 / 时长 / 字幕语言的关键词识别 + 「只打了句空话」判定。
   关键词就在句子里,规则比模型稳 —— 实测模型把「IG Reels」映成过 FB Reels。
   纯函数,无服务端依赖,单测直接 import。 */

export type Platform = "IG Reels" | "FB Reels" | "TikTok";
export type DurationSec = 15 | 20 | 30;
export type SubtitleLang = "English" | "简体中文" | "繁體中文";

export type RuleHits = { platform?: Platform; durationSec?: DurationSec; subtitleLang?: SubtitleLang };

export const DURATION_CHOICES: readonly DurationSec[] = [15, 20, 30];

/** 吸附到最近的可选时长(15 / 20 / 30) */
export function snapDuration(sec: number): DurationSec {
  return DURATION_CHOICES.reduce((best, cand) => (Math.abs(cand - sec) < Math.abs(best - sec) ? cand : best));
}

const ZH_DIGIT: Record<string, number> = { 零: 0, 〇: 0, 一: 1, 二: 2, 两: 2, 兩: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };

/** 中文数字 一..九十九:十 / 十五 / 二十 / 二十五 / 四十五 / 六十;认不出返回 NaN */
export function parseZhNumber(s: string): number {
  if (!s) return NaN;
  /* 一百二十 / 一百零五 / 两百:百位单独算,余下按两位数读 */
  const hundred = s.indexOf("百");
  if (hundred !== -1) {
    const h = hundred === 0 ? 1 : s.slice(0, hundred).length === 1 && s.slice(0, hundred) in ZH_DIGIT ? ZH_DIGIT[s.slice(0, hundred)] : NaN;
    let rest = s.slice(hundred + 1);
    if (rest.startsWith("零") || rest.startsWith("〇")) rest = rest.slice(1);
    /* 「一百二」= 120 */
    const r = rest === "" ? 0 : rest.length === 1 && s.slice(hundred + 1).length === 1 ? ZH_DIGIT[rest] * 10 : parseZhNumber(rest.startsWith("十") ? `一${rest}` : rest);
    return h * 100 + r;
  }
  const ten = s.indexOf("十");
  if (ten === -1) return s.length === 1 && s in ZH_DIGIT ? ZH_DIGIT[s] : NaN;
  if (s.indexOf("十", ten + 1) !== -1) return NaN;
  const head = s.slice(0, ten);
  const tail = s.slice(ten + 1);
  const tens = head === "" ? 1 : head.length === 1 && head in ZH_DIGIT ? ZH_DIGIT[head] : NaN;
  const units = tail === "" ? 0 : tail.length === 1 && tail in ZH_DIGIT ? ZH_DIGIT[tail] : NaN;
  return tens * 10 + units;
}

const toNum = (s: string) => (/^\d/.test(s) ? Number(s) : parseZhNumber(s));

/** 文本里说的时长(秒),认 30s / 30 s / 30-second / 30 sec / 30秒 / 二十五秒 / 半分钟 / 1 分钟 / 一分钟 / 1 minute;没说返回 undefined */
export function parseDurationSec(text: string): number | undefined {
  const t = text.toLowerCase();
  if (/半\s*分[钟鐘]|half\s*(?:a\s*)?minute/.test(t)) return 30;
  /* 中文数字整段贪婪匹配,避免「二十五」只抓到「十五」 */
  const num = "(\\d+(?:\\.\\d+)?|[零〇一二两兩三四五六七八九十百]+)";
  for (const [unit, mult] of [["(?:分[钟鐘]|minutes?\\b|mins?\\b)", 60], ["(?:秒|s\\b|secs?\\b|seconds?\\b)", 1]] as const) {
    const m = t.match(new RegExp(`${num}\\s*-?\\s*${unit}`));
    if (!m) continue;
    const n = toNum(m[1]);
    if (Number.isFinite(n)) return n * mult;
  }
  return undefined;
}

export function detectPlatform(text: string): Platform | undefined {
  const t = text.toLowerCase();
  const fb = /\b(fb|facebook)\b/.test(t);
  if (/\b(ig|instagram|insta|ins)\b/.test(t) && !fb) return "IG Reels";
  if (fb) return "FB Reels";
  if (/tiktok|tik tok|抖音/.test(t)) return "TikTok";
  if (/\breels?\b/.test(t)) return "IG Reels";
  return undefined;
}

/** 用户明确写了字幕 / 语言才算;同一句提到两种语言(如「中文字幕改成英文」)算拿不准,交给模型 */
export function detectSubtitleLang(text: string): SubtitleLang | undefined {
  const t = text.toLowerCase();
  const hits: SubtitleLang[] = [];
  const trad = /繁[體体]|traditional chinese|粵語|粤语|廣東話|广东话|cantonese/.test(t);
  if (trad) hits.push("繁體中文");
  if (/简体|簡體|普通话|普通話|\bmandarin\b|simplified chinese/.test(t) || (!trad && /中文|\bchinese\b/.test(t))) hits.push("简体中文");
  if (/\benglish\b|英文|英语|英語/.test(t)) hits.push("English");
  return hits.length === 1 ? hits[0] : undefined;
}

export function ruleBased(text: string): RuleHits {
  const out: RuleHits = {};
  const platform = detectPlatform(text);
  if (platform) out.platform = platform;
  const sec = parseDurationSec(text);
  if (sec !== undefined && sec > 0) out.durationSec = snapDuration(sec);
  const lang = detectSubtitleLang(text);
  if (lang) out.subtitleLang = lang;
  return out;
}

/* 中文填充词照旧按子串去;英文按单词边界去(旧写法 /an?/ 会把每个字母 a 都删掉) */
const ZH_FILLER = /帮我|请|生成|制作|做|一条|一个|广告片?|视频|短片/g;
const EN_FILLER = /\b(?:ads?|videos?|make|create|an?|the|for me|please)\b/gi;
const GENERIC_MIN = 6;

/** 用户只打了句空话(「制作一条广告」「Make an ad」)—— 去掉填充词后剩不到 6 个字符 */
export function isGenericPrompt(prompt: string): boolean {
  const said = prompt.replace(ZH_FILLER, "").replace(EN_FILLER, " ").replace(/[\s.,!?。，！？、]+/g, " ").trim();
  return said.length < GENERIC_MIN;
}

/** 哪些 brief 项是 AI 替用户定的:平台 / 时长 / 字幕语言看规则有没有从原句抓到,其余看模型的 assumed;只打了句空话就全算 */
export function assumedKeys<K extends string>(keys: readonly K[], rules: RuleHits, prompt: string, modelAssumed: readonly string[] | undefined): K[] {
  const generic = isGenericPrompt(prompt);
  const model = new Set(modelAssumed ?? []);
  return keys.filter((k) => {
    if (k === "platform" || k === "durationSec") return !(k in rules);
    if (k === "subtitleLang" && "subtitleLang" in rules) return false;
    return generic || model.has(k);
  });
}
