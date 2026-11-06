// 模型加工类工具页的纯逻辑(显示哪些输入 / 选项、校验、积分、拼 API 请求)。node 测试直接跑。

import { FLAT_CREDITS, type MediaKind, type ModelToolSpec, type ModelVariant, type SpecInput, type SpecOption } from "./specs";

export type Media = { id: string; name: string; kind: MediaKind; url: string; secs?: number };
/** Voice Clone 做出来的音色(存进 My voices,Lip Sync 的音色下拉里能选) */
export type MyVoice = { id: string; name: string; model: string; sample: string };
/** Lip Sync 音色选了 My voices 时 opts.voice 的写法 */
export const MY_VOICE = "my:";
export type ToolState = {
  model: string;
  files: Record<string, Media[]>;
  opts: Record<string, string>;
  prompt: string;
};

export const variantOf = (spec: ModelToolSpec, model: string): ModelVariant => spec.models.find((m) => m.key === model) ?? spec.models[0];

export const optValue = (v: ModelVariant, s: ToolState, id: string): string => s.opts[id] ?? v.options.find((o) => o.id === id)?.default ?? "";

const shown = (v: ModelVariant, s: ToolState, showIf?: { option: string; value: string }) => !showIf || optValue(v, s, showIf.option) === showIf.value;

export const visibleInputs = (v: ModelVariant, s: ToolState): SpecInput[] => v.inputs.filter((i) => shown(v, s, i.showIf));
export const visibleOptions = (v: ModelVariant, s: ToolState): SpecOption[] =>
  v.options.filter((o) => shown(v, s, o.showIf) && !(o.hideWhenFiles && (s.files[o.hideWhenFiles]?.length ?? 0) > 0));
export const promptVisible = (v: ModelVariant, s: ToolState): boolean => v.prompt.mode !== "none" && shown(v, s, v.prompt.showIf);
export const promptRequired = (v: ModelVariant, s: ToolState): boolean => promptVisible(v, s) && v.prompt.mode === "required";

export function initialState(spec: ModelToolSpec): ToolState {
  return { model: spec.models[0].key, files: {}, opts: {}, prompt: "" };
}

/** 换模型：只保留新模型也有的输入(同 id 同类型),选项回到默认 */
export function switchModel(spec: ModelToolSpec, s: ToolState, model: string): ToolState {
  const v = variantOf(spec, model);
  const files: Record<string, Media[]> = {};
  for (const inp of v.inputs) {
    const kept = (s.files[inp.id] ?? []).filter((m) => m.kind === inp.kind);
    if (kept.length) files[inp.id] = kept.slice(0, inp.max);
  }
  return { model: v.key, files, opts: {}, prompt: v.prompt.mode === "none" ? "" : s.prompt };
}

/** 生成的秒数(积分用);拿不到时返回 null */
export function outputSecs(v: ModelVariant, s: ToolState): number | null {
  const from = v.credits.secsFrom;
  if ("fixed" in from) return from.fixed;
  if ("option" in from) return parseFloat(optValue(v, s, from.option)) || null;
  return s.files[from.input]?.[0]?.secs ?? null;
}

export function cost(spec: ModelToolSpec, v: ModelVariant, s: ToolState): number | null {
  /* 按次计价的(Voice Clone):没传素材也先显示价格，和模型卡上写的一致 */
  const flat = FLAT_CREDITS[spec.key]?.[v.key];
  if (flat !== undefined) return flat;
  const secs = outputSecs(v, s);
  if (secs === null) return null;
  const tier = optValue(v, s, "quality") === "Standard" ? 0.6 : 1;
  const res = { "480p": 0.7, "768p": 1, "1080p": 1.5, "2K": 2 }[optValue(v, s, "resolution")] ?? 1;
  return Math.max(1, Math.round(v.credits.perSecond * secs * tier * res));
}

/** 不能生成的原因(英文，按钮悬停 / 报错用);可以生成返回 null */
/** 为什么还不能生成。missing = 还没传齐 / 没写必填提示词(只把按钮置灰，不出提示);
    否则是素材有问题(太长、太短、读不出时长、超出张数),要红字说明并把那张素材卡标红(input = 出问题的素材位) */
export type Blocker = { message: string; missing: boolean; input?: string };

/** 一个文件的时长合不合格(选文件时就用它挡掉不合格的);没问题返回 null */
export function secsProblem(inp: SpecInput, m: { name: string; secs?: number }): string | null {
  if (!inp.secs) return null;
  if (m.secs === undefined) return `We couldn't read how long ${m.name} is. Try an MP4${inp.kind === "audio" ? ", MP3 or WAV" : ""} file.`;
  if (m.secs < inp.secs[0] - 0.05) return `${inp.label} needs to be at least ${inp.secs[0]}s. ${m.name} is ${Math.round(m.secs * 10) / 10}s.`;
  if (m.secs > inp.secs[1] + 0.05)
    return `${inp.label} can be up to ${inp.secs[1] >= 120 ? `${Math.round(inp.secs[1] / 60)} min` : `${inp.secs[1]}s`}. ${m.name} is ${Math.round(m.secs)}s — trim it or pick a shorter clip.`;
  return null;
}

export function blockerInfo(v: ModelVariant, s: ToolState): Blocker | null {
  for (const inp of visibleInputs(v, s)) {
    const list = s.files[inp.id] ?? [];
    if (list.length < inp.min) return { message: inp.missing ?? `Add a ${inp.label.toLowerCase()}.`, missing: true, input: inp.id };
    if (list.length > inp.max) return { message: `${inp.label} takes up to ${inp.max}. Remove ${list.length - inp.max} to continue.`, missing: false, input: inp.id };
    /* 选文件时已经挡掉不合格的;这里兜底(如旧数据)*/
    for (const m of list) {
      const p = secsProblem(inp, m);
      if (p) return { message: p, missing: false, input: inp.id };
    }
  }
  /* Motion Control:朝向跟图片时动作视频最长 10s */
  if (optValue(v, s, "orientation") === "Like the image") {
    const m = s.files.motion?.[0];
    if (m?.secs && m.secs > 10.05) return { message: "Motion videos can be up to 10s when facing like the image. Pick \"Like the video\" or use a shorter clip.", missing: false, input: "motion" };
  }
  if (promptRequired(v, s) && !s.prompt.trim()) return { message: v.prompt.label === "Script" ? "Type what they should say." : "Describe what you want first.", missing: true };
  return null;
}

export function blocker(v: ModelVariant, s: ToolState): string | null {
  return blockerInfo(v, s)?.message ?? null;
}

/** 结果卡上的一句人话摘要，如「Faces like the video · Pro quality · Original sound kept」 */
export function summaryOf(spec: ModelToolSpec, v: ModelVariant, s: ToolState, voices: MyVoice[] = []): string {
  const parts: string[] = [];
  if (spec.models.length > 1) parts.push(v.label);
  for (const o of visibleOptions(v, s)) {
    const val = optValue(v, s, o.id);
    if (val.startsWith(MY_VOICE)) {
      parts.push(voices.find((x) => MY_VOICE + x.id === val)?.name ?? "My voice");
      continue;
    }
    const i = o.values.indexOf(val);
    const said = o.say && i >= 0 ? o.say[i] : val;
    if (said) parts.push(said);
  }
  return parts.join(" · ") || v.label;
}

export type ModelRequest = {
  endpoint: string;
  body: Record<string, unknown>;
  /** 要先跑的一步(Lip Sync 用 My voices 的音色时，先用克隆音色把台词读成音频) */
  before?: { endpoint: string; body: Record<string, unknown> };
};

/** 拼给模型的请求体(原型里不真发，测试和 Marketing Agent 对照用) */
export function requestBody(v: ModelVariant, s: ToolState, voices: MyVoice[] = []): ModelRequest {
  /* Lip Sync 选了克隆音色：Kling 打字台词只认自带的 46 个音色，所以先 TTS 成音频，再走 audio-to-video */
  const voiceVal = optValue(v, s, "voice");
  if (voiceVal.startsWith(MY_VOICE) && visibleOptions(v, s).some((o) => o.id === "voice")) {
    const mine = voices.find((x) => MY_VOICE + x.id === voiceVal);
    const speed = v.options.find((o) => o.id === "speed");
    const spd = speed ? speed.apiValues?.[speed.values.indexOf(optValue(v, s, "speed"))] ?? 1 : 1;
    const before =
      mine?.model === "kling-create-voice"
        ? { endpoint: "Kling voice → speech: To confirm", body: { voice_id: mine.id, text: s.prompt.trim() } }
        : { endpoint: "fal-ai/minimax/speech-02-hd", body: { text: s.prompt.trim(), voice_setting: { voice_id: mine?.id ?? voiceVal.slice(MY_VOICE.length), speed: spd } } };
    const video = s.files.source?.[0]?.url;
    return {
      endpoint: v.endpoint.replace(/lipsync\/[a-z-]+$/, "lipsync/audio-to-video"),
      body: { ...(video ? { video_url: video } : {}), audio_url: "<audio from step 1>" },
      before,
    };
  }
  const body: Record<string, unknown> = {};
  let endpoint = v.endpoint;
  for (const inp of visibleInputs(v, s)) {
    const list = (s.files[inp.id] ?? []).map((m) => m.url);
    if (!list.length) continue;
    body[inp.api] = inp.max > 1 ? list : list[0];
  }
  for (const o of visibleOptions(v, s)) {
    const val = optValue(v, s, o.id);
    const i = o.values.indexOf(val);
    const api = i >= 0 && o.apiValues ? o.apiValues[i] : val;
    if (o.api === "endpoint" || o.api === "endpoint tier") {
      /* 选项决定端点:Lip Sync 的 audio / text、Motion Control 的 standard / pro */
      const seg = String(api);
      endpoint = o.api === "endpoint" ? endpoint.replace(/lipsync\/[a-z-]+$/, seg) : endpoint.replace(/v3\/(pro|standard)/, seg);
      continue;
    }
    body[o.api] = api;
    if (i >= 0 && o.sets?.[i]) Object.assign(body, o.sets[i]);
  }
  if (promptVisible(v, s) && s.prompt.trim()) body[v.prompt.api] = s.prompt.trim();
  /* Relight:比例跟原片(API 默认 16:9,要显式传 adaptive) */
  if (v.endpoint.endsWith("/relight")) body.aspect_ratio = "adaptive";
  return { endpoint, body };
}
