/* 做不了 / 有风险的要求(异常处理 spec 第 7 条):不卡流程。
   用户的需求里点名真实明星、点名竞品、写了没法证实的功效时,方案照常出(明星 → 普通模特;竞品 → 不点名;功效 → 不写具体功效),
   方案总结末尾加一句说明改了什么;功效类在交付「Needs your check」里再提醒一次。
   原型里是确定的检测清单(不调模型);真实产品由 Agent 自己判断。纯函数。 */

import type { Lang, Msg } from "../store";

export type RiskFound = {
  /** 点名的真实明星(原文) */
  celebrities: string[];
  /** 点名的竞品品牌(原文) */
  competitors: string[];
  /** 没法证实的功效宣称(原文片段) */
  claims: string[];
};

/* 明星:常见的中英文名字(大小写不敏感;英文按整词) */
const CELEBRITIES = [
  "Taylor Swift", "Kim Kardashian", "Kylie Jenner", "Selena Gomez", "Rihanna", "Zendaya", "Hailey Bieber", "Beyonce", "Beyoncé",
  "杨幂", "刘亦菲", "赵丽颖", "迪丽热巴", "赵露思", "杨紫", "范冰冰", "周杰伦", "王一博", "肖战",
];
/* 竞品:护肤 / 美妆大牌;同一品牌的几种写法放一组,点名时用原文里出现的那个 */
const COMPETITORS: string[][] = [
  ["La Mer", "海蓝之谜"],
  ["SK-II", "SK2", "神仙水"],
  ["Estée Lauder", "Estee Lauder", "雅诗兰黛"],
  ["Lancôme", "Lancome", "兰蔻"],
  ["Avène", "Avene", "雅漾"],
  ["La Roche-Posay", "理肤泉"],
  ["Kiehl's", "Kiehls", "科颜氏"],
  ["Clinique", "倩碧"],
  ["Shiseido", "资生堂"],
];
/* 没法证实的功效:英文 cure / heal / eliminate 起头的一句、N% effective、guaranteed results、permanent(ly);
   中文 N 天祛痘 / 美白 / 去皱 / 见效、根治、治愈、100% 有效、永久 */
const CLAIMS: RegExp[] = [
  /\b(?:cures?|heals?|eliminates?|gets? rid of)\b[^,.;!?\n]*?(?=\s+and\b|[,.;!?\n]|$)/gi,
  /\b\d{2,3}\s*%\s*(?:effective|guaranteed|results?)\b/gi,
  /\bguaranteed\s+results?\b/gi,
  /\bpermanent(?:ly)?\s+[a-z]+(?:\s+[a-z]+)?/gi,
  /\d+\s*天(?:内)?(?:祛痘|美白|淡斑|去皱|祛斑|见效|告别[^，。,.!?！？\s]{1,4})/g,
  /(?:根治|治愈|永久)[^，。,.!?！？\s]{1,6}/g,
  /100\s*%\s*有效/g,
];

const CJK = /[㐀-鿿]/;
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** 名字出现在文本里:中文按子串,英文按整词(大小写不敏感) */
const mentions = (text: string, name: string) =>
  CJK.test(name) ? text.includes(name) : new RegExp(`(^|[^\\p{L}\\p{N}])${escape(name)}(?![\\p{L}\\p{N}])`, "iu").test(text);

const uniq = (xs: string[]) => xs.filter((x, i) => xs.findIndex((y) => y.toLowerCase() === x.toLowerCase()) === i);

/** 从用户说过的话里找出有风险的要求;什么都没有时三个数组都是空 */
export function detectRisks(text: string): RiskFound {
  const t = text ?? "";
  const claims: string[] = [];
  for (const re of CLAIMS) {
    re.lastIndex = 0;
    for (const m of t.matchAll(re)) {
      const hit = m[0].trim();
      if (hit && !claims.some((c) => c.includes(hit) || hit.includes(c))) claims.push(hit);
    }
  }
  return {
    celebrities: uniq(CELEBRITIES.filter((n) => mentions(t, n))),
    competitors: COMPETITORS.flatMap((names) => names.filter((n) => mentions(t, n)).slice(0, 1)),
    claims,
  };
}

export const hasRisks = (r: RiskFound) => r.celebrities.length + r.competitors.length + r.claims.length > 0;

const quoteEn = (xs: string[]) => {
  const q = xs.map((x) => `"${x}"`);
  return q.length <= 1 ? q.join("") : `${q.slice(0, -1).join(", ")} and ${q[q.length - 1]}`;
};
const quoteZh = (xs: string[]) => xs.map((x) => `「${x}」`).join("、");

/** 方案总结末尾的那一句(跟回复语言);没有风险返回 undefined。
    举例:I can't use a real celebrity, so a regular model plays the part. I also dropped the claim "cures acne in 3 days" — I can't verify it. */
export function riskNote(r: RiskFound, lang: Lang): string | undefined {
  if (!hasRisks(r)) return undefined;
  const parts: string[] = [];
  if (lang === "zh") {
    if (r.celebrities.length) parts.push("我不能用真实明星,换成了普通模特出镜。");
    if (r.competitors.length) parts.push(`也不能点名其他品牌(${quoteZh(r.competitors)}),对比只说「普通产品」。`);
    if (r.claims.length) parts.push(`${parts.length ? "另外" : ""}去掉了${quoteZh(r.claims)}这类宣称 —— 我没法核实。`);
    return parts.join("");
  }
  if (r.celebrities.length) parts.push("I can't use a real celebrity, so a regular model plays the part.");
  if (r.competitors.length) parts.push(`${parts.length ? "I also can't" : "I can't"} name another brand (${r.competitors.join(", ")}), so the comparison says "ordinary products" instead.`);
  if (r.claims.length) parts.push(`${parts.length ? "I also dropped" : "I dropped"} the ${r.claims.length === 1 ? "claim" : "claims"} ${quoteEn(r.claims)} — I can't verify ${r.claims.length === 1 ? "it" : "them"}.`);
  return parts.join(" ");
}

/** 交付「Needs your check」里功效类的提醒(只有功效类;明星 / 竞品已经在方案里改掉了,不用再确认) */
export function riskChecks(r: RiskFound, lang: Lang): string[] {
  if (!r.claims.length) return [];
  return lang === "zh"
    ? [`我没写${quoteZh(r.claims)}这条功效 —— 有检测报告等证据再加回去。`]
    : [`I left out ${quoteEn(r.claims)} — only add an efficacy claim back if you can back it up.`];
}

/** 第 upTo 条消息之前用户说过的话(prompt + 改稿;提问卡的回答小卡不算),拿来查风险要求 */
export function userAsks(messages: Msg[], upTo: number = messages.length): string {
  return messages
    .slice(0, upTo)
    .flatMap((m) => (m.kind === "user" && !m.rows?.length ? [m.text] : []))
    .join("\n");
}

/** 第 index 条消息(方案卡 / 成片)之前的风险要求 */
export const risksBefore = (messages: Msg[], index: number) => detectRisks(userAsks(messages, index));
