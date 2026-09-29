/* 分镜(Story Outline,底层即 EDL JSON,PRD F3.1)的生成逻辑,供两个接口共用:
   · /api/hybrid-reel/options —— 按投放目的挑 3 种结构,各出一版
   · /api/hybrid-reel/outline —— 在选定的一版上按用户的话修改

   每格挂一个广告叙事环节;缺口 = 某个环节没素材可填,缺口一律 AI 补拍(没有红线、不让用户自己拍)。
   2026-09-29 起一版方案 = 完整的剪辑方案(docs/superpowers/specs/2026-09-29-hybrid-reel-edit-plan.md):
   每镜的画面处理、原声、字卡、音效,加上整片的旁白、音乐(含踩点)、封面、字幕样式,之后剪辑器里要用的东西全在这里定好。 */

import { ARK_MODELS, arkChat, extractJson } from "@/lib/ark";
import { STRUCTURES, STRUCTURE_IDS, DEFAULT_PICKS, beatsFor, type StructureId } from "./structures";
import { fixImageRefs } from "./prompt";
import { CARD_STYLES, CARD_SFX, cardStyleId } from "./cards";
import { LEGACY_VOICE, VOICES } from "./voices";

/** 给模型挑的音色:音色库里的,不含旧的描述型预设 */
const VOICE_CHOICES = VOICES.filter((v) => !(v.id in LEGACY_VOICE));

/** credits 口径照 Ryan 提案 §8.2:成片基础费 + Σ 补拍段,不按生成时长。系数暂定,待实测校准。 */
export const CREDITS = { base: 40, perGenerateShot: 50 };

export type Brief = {
  platform: string;
  durationSec: number;
  audience: string;
  sellingPoints: string[];
  cta: string;
  subtitleLang: string;
  productType?: "physical" | "saas" | "service";
  /** 用户六项之外的要求,原话 —— 排分镜时是硬约束 */
  notes?: string;
};

export type Profile = {
  label: string;
  kind: string;
  /** 素材身份(analyze 接口出,用户可改) */
  identity?: string;
  showcase?: string;
  audioKind?: string;
  sound?: string;
  soundNote?: string;
  description: string;
  tags: string[];
  hasVoice: boolean;
  voiceSummary?: string;
  faceVisible: boolean;
  /** 浏览器读出来的真实长度,排 in/out 点用 */
  durationSec?: number;
  /** 视频的场记:哪几段能用、各能当什么镜头(analyze 接口出) */
  segments?: Segment[];
};

export type Segment = {
  start: number;
  end: number;
  description: string;
  usable: boolean;
  reason?: string;
  roles: string[];
  sellingPoint?: string;
  sound?: string;
};

export type StructureRef = { id: StructureId; name: string; why: string };

const VALID = new Set(["hook", "pain", "proof", "usage", "cta"]);
const isZh = (brief: Brief) => /中文|chinese|粤|繁/i.test(brief.subtitleLang);

/** 素材清单(分镜和提案共用):视频带上场记,每段标出起止、能不能用、能当什么、证明了什么卖点 */
export function inventory(profiles: Profile[]) {
  return profiles
    .map((p, i) => {
      const id = p.identity ?? "footage";
      const what = id === "showcase" ? `showcase/${p.showcase ?? "photo"}` : id === "audio" ? `audio/${p.audioKind ?? "music"}` : id;
      const head = `[${i}] ${p.label} (${p.kind}${p.kind !== "image" && p.durationSec ? `, ${Math.round(p.durationSec * 10) / 10}s long` : ""}) IDENTITY: ${what.toUpperCase()}${IDENTITY_USE[id] ? ` (${IDENTITY_USE[id]})` : ""} — ${p.description} | tags: ${(p.tags ?? []).join(", ")} | speech: ${
        p.hasVoice ? p.voiceSummary || "yes" : "none"
      }${p.sound ? ` | sound: ${p.sound}${p.soundNote ? ` (${p.soundNote})` : ""}` : ""}`;
      const segs = (p.segments ?? []).map(
        (g) =>
          `    ${g.start}–${g.end}s ${g.usable ? "USABLE" : `UNUSABLE (${g.reason || "cut"})`}${g.roles.length ? ` · can be: ${g.roles.join("/")}` : ""} — ${g.description}${
            g.sellingPoint ? ` · shows: ${g.sellingPoint}` : ""
          }${g.sound ? ` · sound: ${g.sound}` : ""}`,
      );
      return segs.length ? `${head}\n  shot log:\n${segs.join("\n")}` : head;
    })
    .join("\n");
}

/** 每种身份在剪辑里怎么用 —— 写进素材清单给模型看 */
const IDENTITY_USE: Record<string, string> = {
  footage: "can be cut into the ad",
  reference: "STYLE ONLY — borrow its colours, tone and copy style; NEVER cut it into the ad",
  brand: "use for the end shot or as a generation reference; never as a plain cut",
  showcase: "can be cut in as a shot, or used as a generation reference / last frame",
  evidence: "proof beat only; show it faithfully, never rewrite it",
  audio: "sound only — goes on the music, voice or sound-effect track",
  unused: "leave out",
};

/** 能进视频轨的身份 */
const CUTTABLE = new Set(["footage", "showcase", "evidence"]);
export const isCuttable = (p: Pick<Profile, "identity" | "kind">) => p.kind !== "audio" && CUTTABLE.has(p.identity ?? "footage");

/** 素材覆盖了哪些环节:有场记按能用的片段算,没有按整条素材的 suggestedRole;参考、品牌、音频、不使用的不算 */
export function coveredRoles(profiles: (Profile & { suggestedRole?: string })[]) {
  const set = new Set<string>();
  for (const p of profiles.filter(isCuttable)) {
    const usable = (p.segments ?? []).filter((g) => g.usable);
    if (usable.length) usable.forEach((g) => g.roles.forEach((r) => set.add(r)));
    else if (p.suggestedRole) set.add(p.suggestedRole);
  }
  return set;
}

const PRODUCT_TYPE = {
  physical: "physical product",
  saas: "SaaS / app (software — its interface must be shown from real screenshots or recordings)",
  service: "service (a business people book or visit)",
};

/* 给模型挑的几个库:字幕样式、曲库(和 canvas/subtitles.tsx、canvas/project.ts 的 id 对齐) */
const SUBTITLE_STYLE_IDS = ["classic", "yellow-outline", "bold-caps", "black-box", "white-box", "most-readable", "highlighter", "glow", "pop-blue", "heavy", "neon", "pink-glow"];
const MUSIC_LIBRARY_IDS: { id: string; mood: string; bpm: number }[] = [
  { id: "m-bright", mood: "bright, marketing", bpm: 118 },
  { id: "m-calm", mood: "calm, emotional", bpm: 92 },
  { id: "m-pop", mood: "upbeat TikTok pop", bpm: 124 },
  { id: "m-drop", mood: "beat drop, energetic", bpm: 128 },
  { id: "m-launch", mood: "cinematic launch", bpm: 100 },
  { id: "m-bubble", mood: "playful, cute", bpm: 110 },
  { id: "m-rush", mood: "high-energy", bpm: 140 },
  { id: "m-home", mood: "warm, emotional", bpm: 84 },
];
const MOTIONS = new Set(["none", "push-in", "pull-out", "pan-left", "pan-right", "scroll"]);
const CARD_KINDS = new Set(["hook", "point", "action", "stat", "offer", "cta", "tagline"]);
const CARD_POS = new Set(["top", "upper", "center", "lower"]);
const CARD_ANIM = new Set(["pop", "slide", "type", "fade"]);
const SFX_KINDS = new Set<string>(CARD_SFX);
const PACES = new Set(["slow", "normal", "fast"]);

function briefBlock(brief: Brief) {
  return `BRIEF
Platform: ${brief.platform}
Length: ${brief.durationSec}s
Audience: ${brief.audience}
Selling points: ${brief.sellingPoints.join("; ")}
Call to action: ${brief.cta}
Subtitle language: ${brief.subtitleLang}
Product type: ${PRODUCT_TYPE[brief.productType ?? "physical"]}
${brief.notes ? `Extra instructions from the advertiser (hard constraints, obey them): ${brief.notes}\n` : ""}`;
}

/* ── 按投放目的挑 3 种结构 ── */
export async function pickStructures(profiles: Profile[], brief: Brief): Promise<StructureRef[]> {
  const zh = isZh(brief);
  const catalog = STRUCTURE_IDS.map((id) => `- ${id}: ${STRUCTURES[id].en}. Fits when ${STRUCTURES[id].fit}.`).join("\n");
  const name = (id: StructureId) => (zh ? STRUCTURES[id].zh : STRUCTURES[id].en);
  try {
    const raw = await arkChat({
      model: ARK_MODELS.understand,
      maxTokens: 600,
      messages: [
        {
          role: "user",
          content: `You are an ad strategist. Pick the 3 narrative structures that best serve this ad's goal, best first.

${briefBlock(brief)}
FOOTAGE
${inventory(profiles)}

STRUCTURES
${catalog}

Judge by what the ad is trying to achieve (the audience, the selling points, the call to action, any offer) and by what the footage can actually support.
Return ONLY JSON: {"picks":[{"id":"<structure id>","why":"one short sentence on why it fits THIS ad, in ${zh ? "Simplified Chinese" : "English"}"}]}
Exactly 3 different ids from the list.`,
        },
      ],
    });
    const { picks } = extractJson<{ picks: { id: string; why: string }[] }>(raw);
    const seen = new Set<StructureId>();
    const out: StructureRef[] = [];
    for (const p of picks ?? []) {
      const id = p.id as StructureId;
      if (!STRUCTURES[id] || seen.has(id)) continue;
      seen.add(id);
      out.push({ id, name: name(id), why: p.why ?? "" });
    }
    for (const id of DEFAULT_PICKS) {
      if (out.length >= 3) break;
      if (!seen.has(id)) out.push({ id, name: name(id), why: "" });
    }
    return out.slice(0, 3);
  } catch {
    return DEFAULT_PICKS.map((id) => ({ id, name: name(id), why: "" }));
  }
}

/* ── 按一种结构出分镜(或在现有分镜上改) ── */
function buildPrompt(profiles: Profile[], brief: Brief, structure: StructureId, siblings: StructureId[] = []) {
  const s = STRUCTURES[structure];
  const others = siblings.filter((id) => id !== structure);
  const beats = beatsFor(structure, brief.durationSec);
  const zh = isZh(brief);
  return `You are planning the complete edit of a ${brief.durationSec}-second vertical ad for ${brief.platform}. Every decision the editor will need is made here; the advertiser only fine-tunes afterwards.

${briefBlock(brief)}
FILES THE ADVERTISER UPLOADED
${inventory(profiles)}

NARRATIVE STRUCTURE: ${s.en}. ${s.intent}
CREATIVE ANGLE: ${s.angle}${
    others.length
      ? `\nThis is one of ${others.length + 1} routes shown side by side. The others are ${others
          .map((id) => `${STRUCTURES[id].en} (${STRUCTURES[id].angle})`)
          .join("; ")}. Your concept must be clearly different from them: a different insight, a different opening, different taglines.${
          structure === "offer" ? "" : " Do not lead with the discount or price — that belongs to another route; mention it only in the call to action."
        }`
      : ""
  }
Use exactly these beats, one shot per beat, in this order: ${beats.join(" → ")}.
hook = stops the scroll. pain = names the problem. proof = why believe you. usage = the product doing its job. cta = what to do next.
"role" MUST be exactly one of: hook, pain, proof, usage, cta. A transition or bridge shot is NOT a role — give it the role of the beat it serves.

Rules:
1. Fill every beat you can from the footage above. Only files whose IDENTITY is FOOTAGE, SHOWCASE or EVIDENCE can be a "clip" source — never REFERENCE, BRAND, AUDIO or UNUSED. For a video with a shot log, "inSec"–"outSec" MUST sit inside ONE USABLE segment — never across an UNUSABLE one, never outside the clip's real length. The same clip can fill several beats with different segments. When a segment visibly shows a selling point (see "shows:"), use it for the beat that needs that proof instead of generating one. A clip shot's "durationSec" equals outSec − inSec (for an image, pick 2–4 s).
2. A beat with nothing suitable is a GAP. Every gap is AI-generated (source kind "generate"). There is no "blocked" option and never ask the advertiser to shoot anything.
3. At most 4 generated shots.
4. Generated shots are made by Seedance 2.0, whose shortest clip is 4 seconds. A generated shot's "durationSec" MUST be a whole number from 4 to 8 — plan the other shots around it.
5. The finished ad must run about ${brief.durationSec} seconds ON SCREEN. A slowed or sped-up clip plays for (outSec − inSec) ÷ speed seconds — a 3 s segment at speed 0.5 fills 6 s — so when you slow a shot down, pick a shorter segment. Add up the on-screen lengths, not the source lengths.
6. END SHOT: the last shot (cta) is the brand end shot. If there is a BRAND or SHOWCASE image, make it a generated shot that ends exactly on that image: set "lastFrame": {"clipIndex": that image}. Its prompt animates towards it (e.g. the bottle turning in water, settling on the pack shot). The tagline and the call to action are cards on this shot, never drawn by the video model.

VOICEOVER — decide from the footage and the product whether this ad needs a voiceover. A clip where someone already talks to camera keeps their own voice. A physical product whose footage speaks for itself can run on cards + music alone; software and services usually need a voiceover to explain.
- "voiceover": {"on": true/false, "why": "one short sentence", "voice": one of ${VOICE_CHOICES.map((v) => `"${v.id}" (${v.label}: ${v.desc})`).join("; ")} — match the language of the voiceover, "delivery": "the tone and emotion of the whole read, a few words, NO speed words — e.g. 'warm, relaxed, friendly'", "pace": "slow" | "normal" | "fast"}.
- Per shot, only when this line should be read differently: "delivery" (tone, no speed words, e.g. 'punchy, excited') and/or "pace" ("slow" | "normal" | "fast") — e.g. the hook punchier and fast, the end line warmer and slow.
- Per shot "subtitle": if the clip has speech, source "stt" and what is said. Else if the voiceover is on, source "authored" and the voiceover line in ${brief.subtitleLang}, short enough to be spoken inside the shot (about 2.5 English words or 4 Chinese characters per second). Else text "" and source "authored".

PICTURE TREATMENT per shot ("treatment"), choose what the shot needs, omit the rest:
- "speed": 1 = normal. Slow texture moments (mist, liquid, fabric) to about 0.5; speed through waiting (typing, loading) to 2–4.
- "motion": for images and screenshots always pick one of "push-in" | "pull-out" | "pan-left" | "pan-right" | "scroll" (scroll = a web page scrolling down); "none" for video.
- SaaS / app: "zoom": {"x","y","w","h" as 0–1 fractions of the frame, "target": "what is zoomed to, e.g. the Export button", "follow": true when it should track the cursor}; "device": "phone" | "laptop" to frame the UI; "highlight": true to ring clicks.
- Evidence (reviews, data): "asCard": true to crop it into a card.
- "stabilize": true for shaky handheld footage; "cutout": true to lift the product off its background; "pip": {"clipIndex": n} for a small picture-in-picture window.
- "keepWhole": true when the action must play out in full (a spray must finish) — beat sync may not trim it.
- "note": one short line on the creative intent, in ${zh ? "Simplified Chinese" : "English"} (e.g. "0.5 倍慢放，突出雾感").

ORIGINAL SOUND per clip shot ("sound"): {"keep": true/false, "volume": 0–100, "note": "what it is"}. Speech → keep 100. A sound that sells the product (spray, pour, click) → keep, about 80. Ambient → about 30. Noise → keep false.

CARDS ("cards") — designed on-screen text, separate from subtitles. Kinds: hook (opening title), point (selling point), action (cue like "Just one spritz"), stat (data / rating), offer (price / discount), cta, tagline.
- Text in ${brief.subtitleLang}, at most 6 words or 10 characters. Several cards in one shot appear one after another.
- "inSec"/"outSec" are seconds from the shot's start ON SCREEN (after speed) and sit inside it. Give each card at least 1.2 s so it can be read.
- "pos": "top" | "upper" | "center" | "lower". Subtitles sit at the bottom, so when a shot has subtitles use "top", "upper" or "center".
- "style": one of ${CARD_STYLES.map((c) => `"${c.id}" (${c.fit})`).join("; ")}.
- "anim": "pop" | "slide" | "type" | "fade". "sfx": optional emphasis sound when it lands, one of ${CARD_SFX.join(", ")}.
- If the voiceover already says it, don't repeat it on a card — cards carry what isn't said (numbers, price, the CTA).
- The hook shot opens with a hook card; the end shot carries the tagline and the cta card.
- "cardAccent": one hex colour for card plates, taken from the reference footage or the brand look (e.g. an ocean blue).

SOUND EFFECTS — sounds inside a shot come with the shot (original sound, or the generated shot's own audio). Per shot "sfx" is only for sounds outside the picture: a brand sting on the end shot, an extra punch on a key action. Keep it sparse (at most one every 2–3 seconds). Kinds: ${CARD_SFX.join(", ")}. "atSec" relative to the shot start. Never a transition whoosh — there are no transitions; every cut is a hard cut.

MUSIC ("music"): {"source": "upload" if an AUDIO file of kind music exists (then "clipIndex"), else "ai"; "title": a short evocative track name in English, 2–4 words (e.g. "Morning Mist"); "prompt": one line describing the track to generate (mood, instruments, tempo); "bpm": number; "beatSync": true}. The cut points are nudged onto the beat later, so plan natural cut points.

COVER ("cover"): {"shot": index, "atSec": a moment inside that shot, "title": short cover title in ${brief.subtitleLang}, "prompt": an image-generation prompt in English for designing the cover from that frame — layout, where the title sits, colours, style; say the title text must read exactly as given}.
SUBTITLE STYLE ("subtitleStyle"): one of ${SUBTITLE_STYLE_IDS.join(", ")} — matters only when there are subtitles.

HOW TO WRITE A GENERATED SHOT (Seedance 2.0 prompt framework)
- "refs": up to 9 files above that keep the shot consistent with the rest of the ad — decide per shot which ones it needs: a frame of the advertiser's footage for the look, the SHOWCASE product image so the product is the real one, a BRAND asset, a REFERENCE for style. For a video, "atSec" is a moment inside a USABLE segment where the thing is clearly visible. Never AUDIO or UNUSED. The refs are passed to the model as @Image 1, @Image 2, … in the order you list them.
- "withAudio": true unless the shot is pure mood — the model generates the shot's own sound effects.
- "summary": one short line for the storyboard table: what the viewer sees, in ${zh ? "Simplified Chinese" : "English"}.
- "prompt": the full generation prompt in ${zh ? "Simplified Chinese" : "English"}, written from the audience and selling points, not from "what looks nice". Exactly three paragraphs separated by a blank line:
  1. Global settings — lock the subject, product and environment. Map every ref explicitly, e.g. "@Image 1 (the RELLET hyaluronic mist bottle) is the product". After EVERY "@Image N" put its noun in parentheses, never a verb or number right after it.
  2. Time-sliced storyboard covering the whole shot, e.g. "0–2s: …; 2–4s: …". Each slice: precise subject, concrete action, setting, light and tone, and exactly ONE camera movement (e.g. slow push-in, fixed camera, macro pan) — never two at once. Use @Image N (noun) when the product appears.
  3. Quality, sound and constraints — e.g. 4K HD, rich detail, the chosen visual style; the product shape and label stay sharp and undistorted; the natural sounds of the action (e.g. a fine mist hiss) and explicitly no music, no voiceover, no speech; no on-screen text, no logo card, no subtitles.
  The eight elements must all be covered: subject, action, setting, light, camera movement, visual style, image quality, constraints.

Return ONLY JSON:
{
  "productType": "physical|saas|service",
  "voiceover": { "on": true, "why": "...", "voice": "...", "delivery": "...", "pace": "normal" },
  "music": { "source": "ai|upload", "title": "...", "prompt": "...", "bpm": 110, "beatSync": true },
  "cover": { "shot": 0, "atSec": 1, "title": "...", "prompt": "..." },
  "cardAccent": "#1f6fd1",
  "subtitleStyle": "classic",
  "shots": [
    {
      "role": "hook|pain|proof|usage|cta",
      "durationSec": number,
      "source": { "kind": "clip", "clipIndex": number, "inSec": number, "outSec": number }
                | { "kind": "generate", "genType": "bridge|broll", "summary": "...", "prompt": "three paragraphs as described", "refs": [{ "clipIndex": number, "atSec": number }], "lastFrame": { "clipIndex": number }, "withAudio": true },
      "subtitle": { "text": "...", "source": "stt|authored" },
      "delivery": "...",
      "pace": "fast",
      "treatment": { "speed": 1, "motion": "none", "note": "..." },
      "sound": { "keep": true, "volume": 80, "note": "..." },
      "cards": [{ "kind": "hook", "text": "...", "inSec": 0, "outSec": 2, "pos": "upper", "style": "poster", "anim": "pop", "sfx": "pop" }],
      "sfx": [{ "kind": "ding", "atSec": 1.5 }]
    }
  ],
  "direction": "two sentences on the angle this cut takes and why — written in ${isZh(brief) ? "Simplified Chinese" : "the same language as the subtitle language"}",
  "bgmPrompt": "same as music.prompt",
  "concept": {
    "title": "a short, evocative creative name for this route (2–6 words), built from THIS route's insight — it must not reuse the product name or the audience alone, and must read clearly differently from the other routes",
    "insight": "one sentence: the consumer insight this route plays on, specific to this audience and product",
    "hook": "one sentence: exactly what happens in the first 2 seconds to stop the scroll",
    "taglines": ["three short on-screen tagline options for this route"],
    "tone": "3–5 words on tone and pace"
  }
}
Write every "concept" field in ${isZh(brief) ? "Simplified Chinese" : "English"}. Make it concrete to THIS product and footage — no generic ad talk.`
}

type Shot = {
  role?: string;
  durationSec?: number;
  source: {
    kind: string;
    genType?: string;
    summary?: string;
    prompt?: string;
    suggestion?: string;
    reason?: string;
    refs?: { clipIndex?: number; atSec?: number }[];
    lastFrame?: { clipIndex?: number };
    withAudio?: boolean;
  };
  subtitle?: { text?: string; source?: string };
  treatment?: Record<string, unknown>;
  sound?: { keep?: boolean; volume?: number; note?: string };
  cards?: Record<string, unknown>[];
  sfx?: { kind?: string; atSec?: number }[];
  delivery?: string;
  pace?: string;
};

type Plan = {
  shots: Shot[];
  direction?: string;
  bgmPrompt?: string;
  concept?: unknown;
  productType?: string;
  voiceover?: { on?: boolean; why?: string; voice?: string; delivery?: string; pace?: string };
  music?: { source?: string; title?: string; prompt?: string; clipIndex?: number; libraryId?: string; bpm?: number; beatSync?: boolean };
  cover?: { shot?: number; atSec?: number; title?: string; prompt?: string };
  cardAccent?: string;
  subtitleStyle?: string;
};

const r1 = (n: number) => Math.round(n * 10) / 10;
const clamp = (n: unknown, lo: number, hi: number, dflt: number) => {
  const v = Number(n);
  return Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : dflt;
};

/** 画面处理:只留认得的字段,数值收进合理范围 */
function cleanTreatment(t: Record<string, unknown> | undefined, p: Profile | undefined, profiles: Profile[]) {
  if (!t || typeof t !== "object") return p?.kind === "image" ? { motion: "push-in" } : undefined;
  const out: Record<string, unknown> = {};
  if (t.speed !== undefined) out.speed = r1(clamp(t.speed, 0.25, 4, 1));
  const motion = MOTIONS.has(String(t.motion)) ? String(t.motion) : undefined;
  /* 图片、截图静止不动会很死,没给动效默认缓慢推近 */
  out.motion = motion ?? (p?.kind === "image" ? "push-in" : undefined);
  const z = t.zoom as Record<string, unknown> | undefined;
  if (z && typeof z === "object") {
    const w = clamp(z.w, 0.15, 1, 0.5);
    const h = clamp(z.h, 0.15, 1, 0.5);
    out.zoom = { x: clamp(z.x, 0, 1 - w, 0.25), y: clamp(z.y, 0, 1 - h, 0.25), w, h, target: String(z.target ?? ""), follow: z.follow === true };
  }
  if (t.device === "phone" || t.device === "laptop") out.device = t.device;
  for (const k of ["highlight", "asCard", "stabilize", "cutout", "keepWhole"] as const) if (t[k] === true) out[k] = true;
  const pip = t.pip as { clipIndex?: number } | undefined;
  if (pip && typeof pip.clipIndex === "number" && profiles[pip.clipIndex] && isCuttable(profiles[pip.clipIndex])) out.pip = { clipIndex: pip.clipIndex };
  if (typeof t.note === "string" && t.note.trim()) out.note = t.note.trim();
  Object.keys(out).forEach((k) => out[k] === undefined && delete out[k]);
  return Object.keys(out).length ? out : undefined;
}

/** 字卡:样式 / 位置 / 动效不认得的换默认值,时间收进镜头里 */
function cleanCards(cards: Record<string, unknown>[] | undefined, len: number) {
  if (!Array.isArray(cards)) return undefined;
  const out = cards
    .filter((c) => c && typeof c.text === "string" && c.text.trim())
    .map((c) => {
      /* 每张字卡至少留 1 秒(镜头太短就整镜) —— 短于这个读不完 */
      const inSec = r1(clamp(c.inSec, 0, Math.max(0, len - 1), 0));
      const outSec = r1(clamp(c.outSec, Math.min(len, inSec + 1), len, len));
      return {
        kind: CARD_KINDS.has(String(c.kind)) ? String(c.kind) : "point",
        text: String(c.text).trim(),
        inSec,
        outSec,
        pos: CARD_POS.has(String(c.pos)) ? String(c.pos) : "upper",
        style: cardStyleId(String(c.style)),
        anim: CARD_ANIM.has(String(c.anim)) ? String(c.anim) : "pop",
        ...(SFX_KINDS.has(String(c.sfx)) ? { sfx: String(c.sfx) } : {}),
      };
    });
  return out.length ? out : undefined;
}

export async function generateOutline({
  profiles,
  brief,
  structure,
  siblings,
  current,
  change,
}: {
  profiles: Profile[];
  brief: Brief;
  structure: StructureRef;
  /** 同时给用户看的其他结构 —— 用来拉开三个方案的创意差距 */
  siblings?: StructureId[];
  current?: unknown;
  change?: string;
}) {
  /* 用户对分镜回了一句话要改:在现有方案上只动他提到的,其余原样 */
  const revision =
    current && change
      ? `\n\nCURRENT STORYBOARD (JSON):\n${JSON.stringify(current)}\n\nThe advertiser replied: """${change}"""\nApply ONLY what they asked. Keep every other shot exactly as it is (same order, sources, durations, subtitles). Return the full storyboard in the same JSON shape, with "direction" rewritten in one sentence to note what changed.`
      : "";
  const beats = beatsFor(structure.id, brief.durationSec);
  const prompt = buildPrompt(profiles, brief, structure.id, siblings) + revision;
  const ask = async (content: string) =>
    extractJson<Plan>(
      await arkChat({ model: ARK_MODELS.understand, messages: [{ role: "user", content }], maxTokens: 7000 }),
    );

  let edl = await ask(prompt);
  /* 首版镜头数必须和结构的环节数一致,否则三个方案会长得差不多;不一致就带着说明重试一次 */
  if (!revision && edl.shots.length !== beats.length) {
    try {
      const retry = await ask(
        `${prompt}\n\nYour previous answer had ${edl.shots.length} shots. It must have EXACTLY ${beats.length} shots, one per beat: ${beats.join(" → ")}.`,
      );
      if (retry.shots.length === beats.length) edl = retry;
    } catch {
      /* 重试失败就用第一版 */
    }
  }

  /* 首版严格按结构的环节走:镜头数对得上就逐格校正 role;
     改稿时用户可能增删镜头,只把五环节之外的词归一到最近的环节 */
  const strict = !revision && edl.shots.length === beats.length;
  edl.shots = edl.shots.map((shot, i) => {
    if (strict) return { ...shot, role: beats[i] };
    const r = String(shot.role ?? "").toLowerCase();
    return { ...shot, role: VALID.has(r) ? r : beats[Math.min(i, beats.length - 1)] };
  });

  /* 旧规则留下的「请自己拍」,或者挑了不能进视频轨的素材(参考、品牌、音频…):一律改成 AI 补拍 */
  edl.shots = edl.shots.map((shot) => {
    const src = shot.source as { kind: string; clipIndex?: number };
    const bad = src.kind === "blocked" || (src.kind === "clip" && (typeof src.clipIndex !== "number" || !profiles[src.clipIndex] || !isCuttable(profiles[src.clipIndex])));
    if (!bad) return shot;
    const summary = shot.source.suggestion || shot.source.summary || shot.source.reason || "";
    return { ...shot, source: { kind: "generate", genType: "broll", summary, prompt: summary, refs: [], withAudio: true } };
  });

  /* 用素材的镜头:in / out 收进素材真实长度,时长跟着 in / out 走 */
  edl.shots = edl.shots.map((shot) => {
    const src = shot.source as { kind: string; clipIndex?: number; inSec?: number; outSec?: number };
    if (src.kind !== "clip" || typeof src.clipIndex !== "number") return shot;
    const p = profiles[src.clipIndex];
    if (!p) return shot;
    if (p.kind !== "video") return { ...shot, durationSec: r1(clamp(shot.durationSec, 1, 6, 3)) };
    const len = p.durationSec ?? Infinity;
    const inSec = Math.max(0, Math.min(Number(src.inSec) || 0, len - 0.5));
    const outSec = Math.min(len, Math.max(inSec + 0.5, Number(src.outSec) || inSec + (shot.durationSec ?? 2)));
    return { ...shot, durationSec: r1(outSec - inSec), source: { ...shot.source, inSec: r1(inSec), outSec: r1(outSec) } };
  });

  /* 补拍镜头:时长取整、不短于 Seedance 的 4 秒;参考素材每镜由 AI 挑,去掉越界、音频和不使用的,最多 9 张(Seedance 上限);
     尾帧图必须是图片 */
  edl.shots = edl.shots.map((shot) => {
    if (shot.source.kind !== "generate") return shot;
    const usableRef = (i?: number) => typeof i === "number" && !!profiles[i] && profiles[i].kind !== "audio" && profiles[i].identity !== "unused" && profiles[i].identity !== "audio";
    const refs = (shot.source.refs ?? [])
      .filter((r) => usableRef(r.clipIndex))
      .slice(0, 9)
      .map((r) => ({ clipIndex: r.clipIndex!, atSec: Math.max(0, Number(r.atSec) || 0) }));
    const last = shot.source.lastFrame?.clipIndex;
    const lastFrame = usableRef(last) && profiles[last!].kind === "image" ? { clipIndex: last! } : undefined;
    const prompt = shot.source.prompt;
    return {
      ...shot,
      durationSec: Math.min(15, Math.max(4, Math.round(shot.durationSec ?? 4))),
      source: {
        ...shot.source,
        refs,
        lastFrame,
        withAudio: shot.source.withAudio !== false,
        ...(typeof prompt === "string" ? { prompt: fixImageRefs(prompt, refs.length) } : {}),
      },
    };
  });

  /* 每镜的画面处理、原声、字卡、音效 */
  const voiceOn = edl.voiceover?.on !== false;
  edl.shots = edl.shots.map((shot) => {
    const src = shot.source as { kind: string; clipIndex?: number };
    /* 字卡、音效的时间按上屏长度算:慢放的镜头上屏比素材长(之前按素材长度收边,把字卡截成了 0.3 秒) */
    const speed = src.kind === "clip" ? clamp((shot.treatment as { speed?: number } | undefined)?.speed, 0.25, 4, 1) : 1;
    const len = (shot.durationSec ?? 3) / speed;
    const p = src.kind === "clip" ? profiles[src.clipIndex!] : undefined;
    const sub = shot.subtitle ?? {};
    /* 旁白关着:没人说话的镜头就没有字幕(字幕 = 说出来的话) */
    const subtitle = sub.source === "stt" ? { text: String(sub.text ?? ""), source: "stt" } : { text: voiceOn ? String(sub.text ?? "") : "", source: "authored" };
    const sound =
      p && p.kind === "video"
        ? { keep: shot.sound?.keep !== false, volume: Math.round(clamp(shot.sound?.volume, 0, 100, p.sound === "noise" ? 0 : p.sound === "ambient" ? 30 : 100)), ...(shot.sound?.note ? { note: String(shot.sound.note) } : {}) }
        : undefined;
    const sfx = (shot.sfx ?? [])
      .filter((x) => SFX_KINDS.has(String(x.kind)))
      .map((x) => ({ kind: String(x.kind), atSec: r1(clamp(x.atSec, 0, len, 0)) }));
    return {
      ...shot,
      subtitle,
      treatment: cleanTreatment(shot.treatment, p, profiles),
      ...(sound ? { sound } : { sound: undefined }),
      cards: cleanCards(shot.cards, len),
      sfx: sfx.length ? sfx : undefined,
      delivery: voiceOn && typeof shot.delivery === "string" && shot.delivery.trim() ? shot.delivery.trim().slice(0, 80) : undefined,
      pace: voiceOn && PACES.has(String(shot.pace)) ? String(shot.pace) : undefined,
    };
  });

  /* 成片时长按上屏长度算(变速后):超出 brief 0.5 秒以上就从可剪的镜头里往回收,
     先收没标 keepWhole 的、最长的;每镜上屏至少留 1.5 秒。模型常忘了慢放会把镜头拉长(实测 15 秒排出 17 秒) */
  const onScreen = (s: Shot) => {
    const sp = Number((s.treatment as { speed?: number } | undefined)?.speed) || 1;
    return s.source.kind === "clip" ? (s.durationSec ?? 0) / sp : s.durationSec ?? 0;
  };
  let excess = edl.shots.reduce((n, s) => n + onScreen(s), 0) - brief.durationSec;
  if (excess > 0.5) {
    for (const pass of [false, true]) {
      const order = edl.shots
        .map((s, i) => ({ s, i }))
        .filter(({ s }) => s.source.kind === "clip" && !!(s.treatment as { keepWhole?: boolean } | undefined)?.keepWhole === pass)
        .sort((a, b) => onScreen(b.s) - onScreen(a.s));
      for (const { s, i } of order) {
        if (excess <= 0.3) break;
        const cut = Math.min(excess, onScreen(s) - 1.5);
        if (cut <= 0) continue;
        const sp = Number((s.treatment as { speed?: number } | undefined)?.speed) || 1;
        const src = s.source as { kind: string; clipIndex?: number; inSec?: number; outSec?: number };
        const srcCut = r1(cut * sp);
        const next = { ...s, durationSec: r1((s.durationSec ?? 0) - srcCut) };
        if (typeof src.outSec === "number") next.source = { ...s.source, outSec: r1(src.outSec - srcCut) } as Shot["source"];
        /* 字卡、音效收进变短后的镜头里 */
        const len = onScreen(next);
        next.cards = cleanCards(next.cards as Record<string, unknown>[] | undefined, len);
        next.sfx = next.sfx?.filter((x) => (x.atSec ?? 0) < len);
        edl.shots[i] = next;
        excess -= cut;
      }
      if (excess <= 0.3) break;
    }
  }

  /* 整片设定 */
  const productType = ["physical", "saas", "service"].includes(String(edl.productType)) ? edl.productType : brief.productType ?? "physical";
  const voice = VOICES.find((v) => v.id === edl.voiceover?.voice)?.id ?? VOICES[0].id;
  const uploadMusic = profiles.findIndex((p) => p.kind === "audio" && (p.audioKind ?? "music") === "music");
  const m = edl.music ?? {};
  const musicFromUpload = m.source === "upload" && typeof m.clipIndex === "number" && profiles[m.clipIndex]?.kind === "audio" ? m.clipIndex : m.source === "upload" && uploadMusic >= 0 ? uploadMusic : undefined;
  const bpm = Math.round(clamp(m.bpm, 60, 180, 110));
  const lib = MUSIC_LIBRARY_IDS.reduce((best, x) => (Math.abs(x.bpm - bpm) < Math.abs(best.bpm - bpm) ? x : best));
  const music = {
    source: musicFromUpload !== undefined ? "upload" : m.source === "library" ? "library" : "ai",
    prompt: String(m.prompt || edl.bgmPrompt || ""),
    ...(m.title && String(m.title).trim() ? { title: String(m.title).trim().slice(0, 40) } : {}),
    ...(musicFromUpload !== undefined ? { clipIndex: musicFromUpload } : {}),
    libraryId: m.libraryId && MUSIC_LIBRARY_IDS.some((x) => x.id === m.libraryId) ? m.libraryId : lib.id,
    bpm,
    beatSync: m.beatSync !== false,
  };
  const coverShot = Math.round(clamp(edl.cover?.shot, 0, edl.shots.length - 1, 0));
  const cover = {
    shot: coverShot,
    atSec: r1(clamp(edl.cover?.atSec, 0, edl.shots[coverShot]?.durationSec ?? 1, 0.5)),
    ...(edl.cover?.title ? { title: String(edl.cover.title) } : {}),
    ...(edl.cover?.prompt ? { prompt: String(edl.cover.prompt).slice(0, 800) } : {}),
  };
  const cardAccent = /^#[0-9a-f]{6}$/i.test(String(edl.cardAccent)) ? String(edl.cardAccent) : "#ff5e1a";
  const subtitleStyle = SUBTITLE_STYLE_IDS.includes(String(edl.subtitleStyle)) ? String(edl.subtitleStyle) : "classic";

  const generated = edl.shots.filter((s) => s.source.kind === "generate").length;
  return {
    ...edl,
    productType,
    voiceover: {
      on: voiceOn,
      why: String(edl.voiceover?.why ?? ""),
      voice,
      ...(edl.voiceover?.delivery ? { delivery: String(edl.voiceover.delivery).slice(0, 80) } : {}),
      pace: PACES.has(String(edl.voiceover?.pace)) ? String(edl.voiceover?.pace) : "normal",
    },
    music,
    bgmPrompt: music.prompt,
    cover,
    cardAccent,
    subtitleStyle,
    structure,
    credits: {
      base: CREDITS.base,
      perGenerateShot: CREDITS.perGenerateShot,
      generatedShots: generated,
      total: CREDITS.base + CREDITS.perGenerateShot * generated,
    },
    model: ARK_MODELS.understand,
  };
}
