/* POST /api/hybrid-reel/brief
   看完素材之后,AI 给用户的第一段完整回复 —— 像真实产品 Marketing Agent 那样一段有逻辑的话:
   先应一句 → 根据素材说清产品是什么 → 素材覆盖了哪些广告环节、缺哪些(由代码算好喂进去,不让模型编)
   → 用文字带出 brief 七项(产品类型 + PRD F2.2 的平台 / 时长 / 受众 / 卖点 / 行动号召 / 字幕语言),用户没说的说明是先替他定的
   素材身份、产品类型都是 AI 判断、不给用户下拉选;用户要改就在对话里说,改稿时一并返回 identities
   → 结尾一句请他确认或提修改。没有按钮,用户回一句话即可。

   同时返回结构化的 brief,供后面排分镜用。
   带 change 时是用户回了一句话:判断他是「确认」还是「要改」,要改就在 current 上只改提到的。 */

import { NextResponse } from "next/server";
import { ARK_MODELS, arkChat, extractJson } from "@/lib/ark";
import { coveredRoles, inventory, type Profile as FootageProfile } from "@/lib/hybrid-reel/outline";

export const runtime = "nodejs";
export const maxDuration = 60;

type Brief = {
  platform: "IG Reels" | "FB Reels" | "TikTok";
  durationSec: 15 | 20 | 30;
  audience: string;
  sellingPoints: string[];
  cta: string;
  subtitleLang: string;
  /** 产品类型(剪辑方案 spec §1):实体产品 / SaaS / 服务,AI 从素材和 prompt 判断 */
  productType: "physical" | "saas" | "service";
  /** 用户 prompt 里六项之外的要求(风格、必须/不许出现的画面等),原话保留,排分镜时要遵守 */
  notes?: string;
};

type Profile = FootageProfile & { suggestedRole?: string };

const BRIEF_KEYS: (keyof Brief)[] = ["platform", "durationSec", "audience", "sellingPoints", "cta", "subtitleLang"];
const ROLES = ["hook", "pain", "proof", "usage", "cta"] as const;
const ROLE_LABEL: Record<(typeof ROLES)[number], { en: string; zh: string }> = {
  hook: { en: "hook", zh: "开场钩子" },
  pain: { en: "pain point", zh: "痛点" },
  proof: { en: "proof", zh: "证明" },
  usage: { en: "usage", zh: "使用场景" },
  cta: { en: "call to action", zh: "行动号召" },
};

const isZh = (text: string) => /[一-鿿]/.test(text);

/** 素材覆盖了哪些广告环节 —— 代码算,不让模型猜 */
function coverage(profiles: Profile[], lang: "zh" | "en") {
  /* 有场记就按能用的片段算:一条长镜头里可能同时有钩子和证明 */
  const covered = coveredRoles(profiles);
  const have = ROLES.filter((r) => covered.has(r)).map((r) => ROLE_LABEL[r][lang]);
  const miss = ROLES.filter((r) => !covered.has(r)).map((r) => ROLE_LABEL[r][lang]);
  return { have, miss };
}

const PROPOSE = (prompt: string, profiles: Profile[], lang: "zh" | "en") => {
  const cov = coverage(profiles, lang);
  const langLine =
    lang === "zh"
      ? "Write the reply in Simplified Chinese (简体中文), the same language the user typed in."
      : "Write the reply in English, the same language the user typed in.";
  return `You are the Marketing Agent inside a video ad tool. A small business owner uploaded footage they shot themselves and typed a request. You have already watched every clip.

WHAT THEY TYPED
"""${prompt || "(nothing — they only uploaded footage)"}"""

WHAT IS IN THE FOOTAGE
${inventory(profiles)}

AD BEATS THE FOOTAGE ALREADY COVERS: ${cov.have.join(", ") || "(none)"}
AD BEATS WITH NO FOOTAGE YET: ${cov.miss.join(", ") || "(none)"}

HARD RULES — the reply must answer THIS user, not a generic one:
- Anything the user stated in what they typed is FIXED. Copy it into the brief in their own words. Never override, rephrase into something else, or "improve" it. Only decide the items they did not mention.
- If they gave a product name, platform, length, audience, selling point, CTA or subtitle language, the reply must reflect exactly that.
- If they asked for anything beyond those six items (a tone, a shot that must or must not appear, "don't show faces", "keep the logo at the end", music style…), you MUST address it explicitly in the footage paragraph (item 3 below): repeat the requirement and say concretely how you will honour it with this footage — e.g. if they said no faces and a clip shows a face, say you will use only that clip's voice/product moments or replace the shot with an AI-generated one. Also put the requirement verbatim into "notes" so the storyboard step obeys it. Silently recording it in "notes" is not enough.
- Never contradict the footage: do not claim things about the product that neither the footage nor the user said.

Write ONE coherent reply, as a real strategist would, in this order:
1. One short line acknowledging the job in the user's own terms — echo what they asked for (e.g. if they typed "帮我做一条 15 秒的 TikTok 广告", say "没问题，我来帮你做这条 15 秒的 TikTok 广告。"). If they said nothing specific, "没问题，我来帮你策划并制作这条广告片。" is fine.
2. "根据你提供的素材，产品是 …" — say what the product is (and so whether it is a physical product, a SaaS / app, or a service — put that into "productType") and what the person on camera claims about it, in one or two sentences. Never invent claims that are not in the footage.
3. One short paragraph on the footage: which ad beats it already covers, and which beats have no footage yet (use the two lists above verbatim; do not add or drop beats). Say that the missing beats will be shot by AI to match the user's footage. Do NOT suggest the user shoot anything themselves.
4. The brief, as prose with a bold label per item, seven items exactly: 产品类型 / 平台 / 时长 / 受众 / 卖点 / 行动号召 / 字幕语言 (in English: Product type / Platform / Length / Audience / Selling points / Call to action / Subtitles). 产品类型 is one of 实体产品 / SaaS / App / 服务 (Physical product / SaaS / app / Service), judged from the footage, with a few words on why — it decides how the ad is structured and what the call to action looks like. EVERY item must state its actual content — the selling points line lists the 2-3 concrete points, the call-to-action line gives the actual line the viewer will see (e.g. "去屈臣氏购买"), never a placeholder like "按素材梳理". Where the user did not say, decide it yourself from the footage and mark it briefly ("我先按…来定"). Defaults only when nothing helps: IG Reels, 15 seconds, subtitles in the user's language.
5. Close with one or two lines that say what happens once they confirm — you will cut the ad from THEIR footage and AI-shoot the missing beats to match it — and invite them to confirm or tell you what to change. Example in Chinese: "确认后，我会用你提供的素材排出分镜，缺失的镜头由 AI 补拍并与你的素材风格保持一致。有想调整的地方直接告诉我。" Never say "输出脚本" / "output a script"; the deliverable is the cut itself. No lists of options, no buttons, no other follow-up questions.

${langLine} Use short paragraphs. Markdown allowed: **bold**, "-" bullets. No headings, no tables, no emoji.

Return ONLY JSON:
{
  "reply": "the full reply text in markdown",
  "brief": {
    "platform": "IG Reels" | "FB Reels" | "TikTok",
    "durationSec": 15 | 20 | 30,
    "audience": "one line",
    "sellingPoints": ["2-3 short points the footage can actually show"],
    "cta": "one line",
    "subtitleLang": "e.g. 简体中文 / English",
    "productType": "physical" | "saas" | "service",
    "notes": "any extra requirement the user typed, verbatim; empty string if none"
  },
  "assumed": ["brief keys the user did NOT state and you decided"]
}`;
};

const REVISE = (current: Brief, change: string, profiles: Profile[], lang: "zh" | "en") => `You are the Marketing Agent inside a video ad tool. You proposed this brief for a short vertical ad:
${JSON.stringify(current, null, 2)}

The user replied: """${change}"""

Footage available, for reference:
${inventory(profiles)}

First decide: is the user agreeing to proceed (action "confirm"), or asking to change something (action "revise")?
- If "revise": apply only what they asked, keep everything else exactly as is (including "notes" — append new extra requirements to it), and write a short reply that restates the updated brief as prose (bold label per item, seven items including 产品类型 / Product type, each with its actual content) and ends with one line: once confirmed you will cut the ad from their footage and AI-shoot the missing beats; they can confirm or change more.
- The user may also correct what a FILE is for (e.g. "the SaveClip one is just a reference", "use the logo only at the end", "that photo is a customer review"). Put each correction into "identities" as {"index": file number in the list above, "identity": "footage"|"reference"|"brand"|"showcase"|"evidence"|"unused"} and mention it in one short line of the reply, naming the file the way a person would ("SaveClip 那条", "the logo") — never by its number in the list. Audio files stay "audio". Leave "identities" empty when they didn't talk about files.
- If "confirm": keep the brief unchanged and write one short line saying you're now laying out the storyboard from their footage, and the missing shots will be AI-shot afterwards (e.g. "好，我用你的素材来排分镜，缺的镜头之后会由 AI 补拍。").

${lang === "zh" ? "Write in Simplified Chinese, the same language the user uses." : "Write in English, the same language the user uses."} No buttons, no headings, no emoji.

Return ONLY JSON: { "action": "confirm" | "revise", "reply": "...", "brief": { ...all six fields, plus "productType" and "notes"... }, "identities": [] }`;

/** 平台和时长的关键词就在句子里,规则比模型稳 —— 实测模型把「IG Reels」映成过 FB Reels。 */
function ruleBased(text: string): Partial<Pick<Brief, "platform" | "durationSec">> {
  const out: Partial<Pick<Brief, "platform" | "durationSec">> = {};
  const t = text.toLowerCase();
  if (/\b(ig|instagram|insta)\b|\bins\b|reels?\b/.test(t) && !/\b(fb|facebook)\b/.test(t)) out.platform = "IG Reels";
  else if (/\b(fb|facebook)\b/.test(t)) out.platform = "FB Reels";
  else if (/tiktok|抖音|tik tok/.test(t)) out.platform = "TikTok";
  const m = t.match(/(\d{1,3})\s*(秒|s\b|sec|second)/);
  if (m) {
    const n = Number(m[1]);
    out.durationSec = ([15, 20, 30] as const).reduce((best, cand) =>
      Math.abs(cand - n) < Math.abs(best - n) ? cand : best,
    );
  }
  return out;
}

const FALLBACK: Brief = {
  platform: "IG Reels",
  durationSec: 15,
  audience: "People who already buy in this category",
  sellingPoints: ["Show the product doing its job"],
  cta: "Link in bio",
  subtitleLang: "English",
  productType: "physical",
  notes: "",
};

export async function POST(request: Request) {
  let body: { prompt?: string; profiles?: Profile[]; current?: Brief; change?: string; lang?: "zh" | "en" };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求体不是 JSON" }, { status: 400 });
  }
  const prompt = String(body.prompt ?? "").trim();
  const profiles = body.profiles ?? [];
  const revising = Boolean(body.current && body.change);
  const lang: "zh" | "en" = body.lang ?? (isZh(revising ? String(body.change) : prompt) ? "zh" : "en");

  try {
    const raw = await arkChat({
      model: ARK_MODELS.understand,
      messages: [
        {
          role: "user",
          content: revising
            ? REVISE(body.current as Brief, String(body.change), profiles, lang)
            : PROPOSE(prompt, profiles, lang),
        },
      ],
      maxTokens: 1400,
    });
    const parsed = extractJson<{ reply?: string; brief?: Partial<Brief>; assumed?: string[]; action?: string; identities?: { index?: number; identity?: string }[] }>(raw);
    /* 用户在对话里纠正某个文件的身份(不给下拉,全靠说):只收认得的身份、存在的文件,音频不改 */
    const VALID_ID = new Set(["footage", "reference", "brand", "showcase", "evidence", "unused"]);
    const identities = (parsed.identities ?? []).filter(
      (x) => typeof x.index === "number" && profiles[x.index] && profiles[x.index].kind !== "audio" && VALID_ID.has(String(x.identity)),
    ) as { index: number; identity: string }[];
    const rules = ruleBased(revising ? String(body.change) : prompt);
    const brief: Brief = { ...FALLBACK, ...(body.current ?? {}), ...(parsed.brief ?? {}), ...rules };
    if (!["physical", "saas", "service"].includes(brief.productType)) brief.productType = FALLBACK.productType;

    /* 哪些是 AI 替用户定的:平台/时长看规则有没有从原句抓到;其余看用户到底说了没 —— 只打了句空话就全算 */
    const said = prompt.replace(/帮我|请|生成|制作|做|一条|一个|广告片?|视频|短片|ad|video|make|create|an?|the|for me/gi, "").trim();
    const generic = said.length < 6;
    const modelAssumed = new Set(parsed.assumed ?? []);
    const assumed = revising
      ? []
      : BRIEF_KEYS.filter((k) => {
          if (k === "platform" || k === "durationSec") return !(k in rules);
          return generic || modelAssumed.has(k);
        });

    return NextResponse.json({
      reply: parsed.reply ?? "",
      brief,
      assumed,
      action: revising ? (identities.length && parsed.action === "confirm" ? "revise" : parsed.action === "confirm" ? "confirm" : "revise") : "propose",
      identities,
      lang,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
