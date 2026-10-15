/* 录评审原型用的 RELLET 数据:经本地 dev server 真调 analyze → brief → outline → 改稿,中英各一套。
   用法:node scripts/record-hybrid-reel-fixture.mts ~/Desktop/演示素材
   只补录配音(不重录分析/脑暴/分镜):node scripts/record-hybrid-reel-fixture.mts --voice-only
   必须在仓库根目录运行。
   需要 dev server 在 3000 端口、ffmpeg/ffprobe 在 PATH。耗时约 15–25 分钟。 */

import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
// @ts-expect-error -- Node 25 runs this .mts directly and needs the .ts extension; tsc forbids it without allowImportingTsExtensions
import { applyAnswers, buildQuestions } from "../src/app/prototypes/(v1.13)/hybrid-reel-agent/app/logic/questions.ts";

const VOICE_ONLY = process.argv.includes("--voice-only");
const SRC = process.argv[2];
if (!VOICE_ONLY && !SRC) throw new Error("usage: node scripts/record-hybrid-reel-fixture.mts <footage dir> | --voice-only");
const HOST = "http://localhost:3000";
const PUB = "public/prototypes/hybrid-reel-agent/fixture";
const OUT = "src/app/prototypes/(v1.13)/hybrid-reel-agent/app/fixture/rellet.json";

const FILES = [
  { src: "SaveClip.App_AQNyGQz9V87Xw60AYhoKt4cagmdMfm2bqlUX4daFM7P7d8BXUt-gn_hwVvp4pr8KduS6hnCxINvIDlLveSYxNA5WGczL0XE4VBRhU5Y.mp4", name: "SaveClip.App_AQNyGQz9V87Xw60AYhoKt4cagmdMfm2bqlUX4daFM7P7d8BXUt.mp4", preview: "saveclip.mp4", type: "video/mp4" },
  { src: "images.jpeg", name: "images.jpeg", preview: "images.jpeg", type: "image/jpeg" },
  { src: "images.png", name: "images.png", preview: "images.png", type: "image/png" },
  { src: "IMG_3716.MOV", name: "IMG_3716.MOV", preview: "IMG_3716.mp4", type: "video/quicktime" },
];
const PROMPTS = {
  zh: { prompt: "制作一条广告", stated: "帮我做一条 30 秒的 TikTok 广告", revision: "开头换成雪山溪流" },
  en: { prompt: "Make an ad", stated: "Make a 30-second TikTok ad", revision: "Open with a snowy mountain stream instead" },
} as const;

async function post(path: string, body: BodyInit, json = true) {
  const res = await fetch(HOST + path, {
    method: "POST",
    body,
    headers: json ? { "Content-Type": "application/json" } : undefined,
    signal: AbortSignal.timeout(10 * 60_000),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`${path}: ${data.error ?? res.status}`);
  return data;
}

function previews() {
  mkdirSync(PUB, { recursive: true });
  for (const f of FILES) {
    const from = join(SRC, f.src);
    const to = join(PUB, f.preview);
    if (f.type === "video/quicktime") {
      execFileSync("ffmpeg", ["-y", "-v", "error", "-i", from, "-vf", "scale=-2:720", "-c:v", "libx264", "-crf", "30", "-preset", "slow", "-c:a", "aac", "-b:a", "64k", "-movflags", "+faststart", to]);
    } else copyFileSync(from, to);
  }
}

const duration = (file: string) =>
  Math.round(Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).toString().trim()) * 10) / 10;

async function recordLang(lang: "zh" | "en") {
  const p = PROMPTS[lang];
  const profiles = [];
  for (const f of FILES) {
    const form = new FormData();
    form.append("file", new Blob([readFileSync(join(SRC, f.src))], { type: f.type }), f.name);
    form.append("lang", lang);
    console.log(`[${lang}] analyze ${basename(f.name)}`);
    const data = await post("/api/hybrid-reel/analyze", form, false);
    const prof = data.profiles[0];
    profiles.push({
      ...prof,
      objectUrl: `/prototypes/hybrid-reel-agent/fixture/${f.preview}`,
      durationSec: f.type.startsWith("image/") ? undefined : duration(join(SRC, f.src)),
    });
  }
  console.log(`[${lang}] brief ×2`);
  const brief = await post("/api/hybrid-reel/brief", JSON.stringify({ prompt: p.prompt, profiles, lang }));
  const briefStated = await post("/api/hybrid-reel/brief", JSON.stringify({ prompt: p.stated, profiles, lang }));
  const questions = buildQuestions(brief.assumed, brief.brief, profiles, lang);
  const answers = Object.fromEntries(
    questions.map((q) => [q.id, { picked: q.id === "platform" ? ["TikTok"] : q.id === "duration" ? ["30"] : q.defaults }]),
  );
  const answered = applyAnswers(brief.brief, questions, answers, lang);
  console.log(`[${lang}] outline`);
  const outline = await post("/api/hybrid-reel/outline", JSON.stringify({ profiles, brief: answered }));
  console.log(`[${lang}] revise`);
  const revised = await post("/api/hybrid-reel/outline", JSON.stringify({ profiles, brief: answered, current: outline, change: p.revision }));
  return {
    prompt: p.prompt,
    promptStated: p.stated,
    profiles,
    brief: { reply: brief.reply, brief: brief.brief, assumed: brief.assumed },
    briefStated: { reply: briefStated.reply, brief: briefStated.brief, assumed: briefStated.assumed },
    answers,
    outline,
    revision: p.revision,
    revised,
  };
}

const VOICE_DIR = "public/prototypes/hybrid-reel-agent/fixture/voice";

async function recordVoice(set: { outline: { shots: { subtitle: { text: string } }[]; voiceover?: { voice?: string } }; revised: { shots: { subtitle: { text: string } }[] } }, lang: "zh" | "en") {
  mkdirSync(VOICE_DIR, { recursive: true });
  const lines = [...new Set([...set.outline.shots, ...set.revised.shots].map((s) => s.subtitle.text.trim()).filter(Boolean))];
  const voice = set.outline.voiceover?.voice;
  const out: { text: string; url: string; durationSec: number }[] = [];
  for (const [i, text] of lines.entries()) {
    console.log(`[${lang}] tts ${i + 1}/${lines.length}`);
    const data = await post("/api/hybrid-reel/tts", JSON.stringify({ text, ...(voice ? { voice } : {}) }));
    const file = `${lang}-${i + 1}.mp3`;
    writeFileSync(join(VOICE_DIR, file), Buffer.from(data.audio, "base64"));
    out.push({ text, url: `/prototypes/hybrid-reel-agent/fixture/voice/${file}`, durationSec: Math.round((data.duration || duration(join(VOICE_DIR, file))) * 10) / 10 });
  }
  return out;
}

if (VOICE_ONLY) {
  const data = JSON.parse(readFileSync(OUT, "utf8"));
  for (const lang of ["zh", "en"] as const) data[lang].voice = await recordVoice(data[lang], lang);
  writeFileSync(OUT, JSON.stringify(data, null, 2));
  console.log(`wrote voice into ${OUT}`);
} else {
  previews();
  const data = { zh: await recordLang("zh"), en: await recordLang("en") };
  for (const lang of ["zh", "en"] as const) (data[lang] as Record<string, unknown>).voice = await recordVoice(data[lang], lang);
  writeFileSync(OUT, JSON.stringify(data, null, 2));
  console.log(`wrote ${OUT}`);
}
