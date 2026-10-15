/* 开头提问卡:只问 brief 里 AI 替用户定的项(平台、字幕语言、时长)+ 素材缺口要不要 AI 补拍。
   最多 4 题;答案写回 brief,补拍选择写进 brief.notes,分镜接口会照 notes 排。
   题 id 与评审录制数据 rellet.json 的 answers 键一致(platform / duration / shots);language 是拆出来的新题,没录答案时取默认。 */

import type { Brief, ClipProfile, Role } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";

export type Lang = "zh" | "en";
export type QuestionId = "platform" | "language" | "duration" | "shots";
export type QuestionOption = { value: string; label: string; description?: string };
export type Question = { id: QuestionId; title: string; multi: boolean; options: QuestionOption[]; defaults: string[] };
export type Answer = { picked: string[]; other?: string };
export type Answers = Partial<Record<QuestionId, Answer>>;

export const PLATFORMS = ["TikTok", "IG Reels", "FB Reels"] as const;
export const DURATIONS = [15, 20, 30] as const;
export const SUBTITLE_LANGS = ["English", "简体中文", "繁體中文"] as const;

const ROLES: Role[] = ["hook", "pain", "proof", "usage", "cta"];
/* 与 lib/hybrid-reel/outline.ts 的 isCuttable 同口径(那个文件引了服务端模型 SDK,前端不能 import) */
const CUTTABLE = new Set(["footage", "showcase", "evidence"]);

/* 补拍题的选项:名字 + 一句说明(提问卡像 Claude 那样,每个选项下面一行灰字) */
export const SHOT_LABEL: Record<Role, string> = { hook: "Hook", pain: "Pain point", proof: "Proof", usage: "Usage", cta: "End card" };
export const SHOT_DESC: Record<Role, string> = {
  hook: "A scroll-stopping opening",
  pain: "The problem before the product",
  proof: "A close-up that backs the claim",
  usage: "Someone using the product",
  cta: "Product, logo and call to action",
};
const PLATFORM_DESC: Record<string, string> = {
  TikTok: "Vertical 9:16, hook in the first 2 seconds, sound on",
  "IG Reels": "Vertical 9:16, polished on-brand look",
  "FB Reels": "Vertical 9:16, captions carry it with sound off",
};
const LANG_DESC: Record<string, string> = {
  English: "Subtitles in English",
  简体中文: "Subtitles in Simplified Chinese",
  繁體中文: "Subtitles in Traditional Chinese",
};
const DURATION_DESC: Record<number, string> = {
  15: "Hook, one key benefit and the call to action",
  20: "Adds room for a quick product demo",
  30: "Hook, problem, proof, demo and call to action",
};
/** 单选题把推荐项(默认值)挪到第一个,和 Claude 的提问一样 */
const recommendedFirst = (options: QuestionOption[], defaults: string[]) =>
  defaults.length ? [...options.filter((o) => defaults.includes(o.value)), ...options.filter((o) => !defaults.includes(o.value))] : options;

const TITLES: Record<QuestionId, string> = {
  platform: "Platform?",
  language: "Subtitle language?",
  duration: "Length?",
  shots: "Which shots should AI fill in?",
};

const langLabel = (lang: Lang) => (lang === "zh" ? "简体中文" : "English");

/** brief 里的字幕语言对到选项上;模型可能写成「中文」「Traditional Chinese」,对不上就按回复语言 */
export function subtitleOption(subtitleLang: string | undefined, lang: Lang): string {
  const t = (subtitleLang ?? "").trim().toLowerCase();
  if (/繁|traditional|cantonese|粵|粤/.test(t)) return "繁體中文";
  if (/简|簡|中文|chinese|mandarin|普通/.test(t)) return "简体中文";
  if (/english|英/.test(t)) return "English";
  return langLabel(lang);
}

/** Continue 能不能点:单选题必须有答案(选项或 Other 文本),多选题(补拍)可以全不选 */
export function canSubmit(questions: Question[], answers: Answers): boolean {
  return questions.every((q) => {
    if (q.multi) return true;
    const a = answers[q.id];
    return Boolean(a && (a.picked.length > 0 || a.other?.trim()));
  });
}

export function missingRoles(profiles: ClipProfile[]): Role[] {
  const covered = new Set<string>();
  for (const p of profiles) {
    if (p.kind === "audio" || !CUTTABLE.has(p.identity ?? "footage")) continue;
    const usable = (p.segments ?? []).filter((g) => g.usable);
    if (usable.length) usable.forEach((g) => g.roles.forEach((r) => covered.add(r)));
    else if (p.suggestedRole) covered.add(p.suggestedRole);
  }
  return ROLES.filter((r) => !covered.has(r));
}

export function buildQuestions(assumed: string[] | undefined, brief: Brief, profiles: ClipProfile[], lang: Lang): Question[] {
  const guessed = new Set(assumed ?? ["platform", "durationSec", "subtitleLang"]);
  const out: Question[] = [];
  if (guessed.has("platform")) {
    out.push({
      id: "platform",
      title: TITLES.platform,
      multi: false,
      options: recommendedFirst(
        PLATFORMS.map((p) => ({ value: p, label: p, description: PLATFORM_DESC[p] })),
        (PLATFORMS as readonly string[]).includes(brief.platform) ? [brief.platform] : [],
      ),
      defaults: (PLATFORMS as readonly string[]).includes(brief.platform) ? [brief.platform] : [],
    });
  }
  if (guessed.has("subtitleLang")) {
    out.push({
      id: "language",
      title: TITLES.language,
      multi: false,
      options: recommendedFirst(
        SUBTITLE_LANGS.map((l) => ({ value: l, label: l, description: LANG_DESC[l] })),
        [subtitleOption(brief.subtitleLang, lang)],
      ),
      defaults: [subtitleOption(brief.subtitleLang, lang)],
    });
  }
  if (guessed.has("durationSec")) {
    out.push({
      id: "duration",
      title: TITLES.duration,
      multi: false,
      options: recommendedFirst(
        DURATIONS.map((d) => ({ value: String(d), label: `${d}s`, description: DURATION_DESC[d] })),
        [String(brief.durationSec)],
      ),
      defaults: [String(brief.durationSec)],
    });
  }
  const gaps = missingRoles(profiles);
  if (gaps.length) {
    out.push({
      id: "shots",
      title: TITLES.shots,
      multi: true,
      options: gaps.map((r) => ({ value: r, label: SHOT_LABEL[r], description: SHOT_DESC[r] })),
      defaults: gaps,
    });
  }
  return out;
}

export function applyAnswers(brief: Brief, questions: Question[], answers: Answers, lang: Lang): Brief {
  const next: Brief = { ...brief };
  const notes: string[] = brief.notes ? [brief.notes] : [];
  for (const q of questions) {
    const a = answers[q.id];
    if (!a) continue;
    const pick = a.picked[0];
    if (q.id === "platform" && pick) next.platform = pick;
    /* 字幕语言是自由文本字段,Other 里写的语言(如 Japanese)直接用;都没填就把 brief 原值对到选项上 */
    if (q.id === "language") next.subtitleLang = pick || a.other?.trim() || subtitleOption(brief.subtitleLang, lang);
    if (q.id === "duration" && pick) next.durationSec = Number(pick);
    if (q.id === "shots") {
      notes.push(a.picked.length ? `AI-shoot these beats: ${a.picked.join(", ")}.` : "Do not AI-shoot any shots; cut the ad only from the footage.");
    }
    if (a.other?.trim()) notes.push(`${q.title.replace(/\?$/, "")}: ${a.other.trim()}`);
  }
  next.notes = notes.join("\n");
  return next;
}

/** 答完后的小卡:每题一行「题目 / 答案」,答案等于推荐项时带 (Recommended);跳过的题写 Skipped */
export type AnswerRow = { question: string; answer: string };
export function answerRows(questions: Question[], answers: Answers): AnswerRow[] {
  return questions.map((q) => {
    const a = answers[q.id];
    if (!a || (!a.picked.length && !a.other?.trim() && !q.multi)) return { question: q.title, answer: "Skipped" };
    const labels = a.picked.map((v) => q.options.find((o) => o.value === v)?.label ?? v);
    if (a.other?.trim()) labels.push(a.other.trim());
    if (!labels.length) return { question: q.title, answer: "None" };
    const recommended = !q.multi && !a.other?.trim() && a.picked.length === 1 && q.defaults.includes(a.picked[0]);
    return { question: q.title, answer: `${labels.join(", ")}${recommended ? " (Recommended)" : ""}` };
  });
}

export function answerTranscript(questions: Question[], answers: Answers): string {
  return questions
    .filter((q) => answers[q.id])
    .map((q) => {
      const a = answers[q.id]!;
      const labels = a.picked.map((v) => q.options.find((o) => o.value === v)?.label ?? v);
      if (a.other?.trim()) labels.push(a.other.trim());
      return `Q: ${q.title}\nA: ${labels.join(", ") || "None"}`;
    })
    .join("\n\n");
}
