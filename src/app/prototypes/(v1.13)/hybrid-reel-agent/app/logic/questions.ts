/* 开头提问卡:只问 brief 里 AI 替用户定的项(平台、字幕语言、时长)+ 素材缺口要不要 AI 补拍。
   最多 4 题;答案写回 brief,补拍选择写进 brief.notes,分镜接口会照 notes 排。
   题 id 与评审录制数据 rellet.json 的 answers 键一致(platform / duration / shots);language 是拆出来的新题,没录答案时取默认。 */

import type { Brief, ClipProfile, Role } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";

export type Lang = "zh" | "en";
export type QuestionId = "platform" | "language" | "duration" | "shots";
export type QuestionOption = { value: string; label: string };
export type Question = { id: QuestionId; title: string; multi: boolean; options: QuestionOption[]; defaults: string[] };
export type Answer = { picked: string[]; other?: string };
export type Answers = Partial<Record<QuestionId, Answer>>;

export const PLATFORMS = ["TikTok", "IG Reels", "FB Reels"] as const;
export const DURATIONS = [15, 20, 30] as const;
export const SUBTITLE_LANGS = ["English", "简体中文", "繁體中文"] as const;

const ROLES: Role[] = ["hook", "pain", "proof", "usage", "cta"];
/* 与 lib/hybrid-reel/outline.ts 的 isCuttable 同口径(那个文件引了服务端模型 SDK,前端不能 import) */
const CUTTABLE = new Set(["footage", "showcase", "evidence"]);

export const SHOT_LABEL: Record<Role, string> = {
  hook: "Hook · a scroll-stopping opening",
  pain: "Pain point · the problem before the product",
  proof: "Proof · a close-up that backs the claim",
  usage: "Usage · someone using the product",
  cta: "End card · product, logo and call to action",
};

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
      options: PLATFORMS.map((p) => ({ value: p, label: p })),
      defaults: (PLATFORMS as readonly string[]).includes(brief.platform) ? [brief.platform] : [],
    });
  }
  if (guessed.has("subtitleLang")) {
    out.push({
      id: "language",
      title: TITLES.language,
      multi: false,
      options: SUBTITLE_LANGS.map((l) => ({ value: l, label: l })),
      defaults: [subtitleOption(brief.subtitleLang, lang)],
    });
  }
  if (guessed.has("durationSec")) {
    out.push({
      id: "duration",
      title: TITLES.duration,
      multi: false,
      options: DURATIONS.map((d) => ({ value: String(d), label: `${d}s` })),
      defaults: [String(brief.durationSec)],
    });
  }
  const gaps = missingRoles(profiles);
  if (gaps.length) {
    out.push({
      id: "shots",
      title: TITLES.shots,
      multi: true,
      options: gaps.map((r) => ({ value: r, label: SHOT_LABEL[r] })),
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
