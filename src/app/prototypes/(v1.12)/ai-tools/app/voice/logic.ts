// Voice Enhancer 的纯逻辑(node 测试直接跑):积分、样例的「原声」合成、处理后的混音、自己上传音频的简化处理、
// 波形峰值、WAV 编码。
// 样例的做法:干净人声(voice-sample.mp3)= 「处理后」的上限;「原声」= 人声 × 忽大忽小的音量 + 回声 + 底噪(都在前端现算)。
// 处理后 = 按选项把三样东西各自去掉 / 留一部分(强度 Low / Medium / High 决定残留多少)。
// 积分占位:每开始的 10 秒 1 credit(最少 1),待定价。

export type Strength = "low" | "medium" | "high";
export type EnhanceOpts = { noise: boolean; echo: boolean; level: boolean; strength: Strength };

export const DEFAULT_OPTS: EnhanceOpts = { noise: true, echo: false, level: false, strength: "medium" };
export const MAX_AUDIO_SECONDS = 600;

export const enhanceCredits = (seconds: number) => Math.max(1, Math.ceil(Math.max(0, seconds) / 10));
export const anyOption = (o: EnhanceOpts) => o.noise || o.echo || o.level;
export const sameOpts = (a: EnhanceOpts, b: EnhanceOpts) => a.noise === b.noise && a.echo === b.echo && a.level === b.level && a.strength === b.strength;

/** 去噪 / 去回声后还残留多少(0–1) */
export const RESIDUAL: Record<Strength, number> = { low: 0.45, medium: 0.18, high: 0.04 };

/** 确定性的伪随机(同一 seed 每次一样,测试可复现) */
function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** 底噪:白噪 → 一阶低通(更像空调 / 街道的嗡嗡声),再加一点 50Hz 电流声 */
export function makeNoise(n: number, sampleRate: number, level = 0.06, seed = 7): Float32Array {
  const r = rng(seed);
  const out = new Float32Array(n);
  let lp = 0;
  for (let i = 0; i < n; i++) {
    lp = lp * 0.85 + (r() * 2 - 1) * 0.15;
    out[i] = (lp * 2.2 + Math.sin((2 * Math.PI * 50 * i) / sampleRate) * 0.25) * level;
  }
  return out;
}

/** 音量包络:每 1.6 秒一段,在 0.35–1 之间跳(模拟离麦克风忽远忽近),段与段之间平滑过渡 */
export function makeEnvelope(n: number, sampleRate: number, seed = 3): Float32Array {
  const r = rng(seed);
  const seg = Math.round(sampleRate * 1.6);
  const levels: number[] = [];
  for (let i = 0; i <= Math.ceil(n / seg) + 1; i++) levels.push(0.35 + r() * 0.65);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const k = Math.floor(i / seg);
    const f = (i % seg) / seg;
    const t = f * f * (3 - 2 * f);
    out[i] = levels[k] * (1 - t) + levels[k + 1] * t;
  }
  return out;
}

/** 回声(房间混响):几次衰减的延迟叠加 */
export function makeEcho(dry: Float32Array, sampleRate: number): Float32Array {
  const taps = [
    [0.09, 0.45],
    [0.21, 0.3],
    [0.37, 0.18],
    [0.55, 0.1],
  ] as const;
  const out = new Float32Array(dry.length);
  for (const [sec, g] of taps) {
    const d = Math.round(sec * sampleRate);
    for (let i = d; i < dry.length; i++) out[i] += dry[i - d] * g;
  }
  return out;
}

export type SampleParts = { clean: Float32Array; env: Float32Array; echo: Float32Array; noise: Float32Array };

/** 由干净人声拆出样例的四样东西(原声 = clean × env + echo + noise) */
export function sampleParts(clean: Float32Array, sampleRate: number): SampleParts {
  const env = makeEnvelope(clean.length, sampleRate);
  const dry = new Float32Array(clean.length);
  for (let i = 0; i < clean.length; i++) dry[i] = clean[i] * env[i];
  return { clean, env, echo: makeEcho(dry, sampleRate), noise: makeNoise(clean.length, sampleRate) };
}

const clip = (v: number) => (v > 1 ? 1 : v < -1 ? -1 : v);

export function mixOriginal(p: SampleParts): Float32Array {
  const out = new Float32Array(p.clean.length);
  for (let i = 0; i < out.length; i++) out[i] = clip(p.clean[i] * p.env[i] + p.echo[i] + p.noise[i]);
  return out;
}

/** 处理后:Volume leveling 把忽大忽小拉平(用干净人声 × 统一增益);去噪 / 去回声按强度留残余;没勾的原样保留 */
export function mixEnhanced(p: SampleParts, o: EnhanceOpts): Float32Array {
  const keepNoise = o.noise ? RESIDUAL[o.strength] : 1;
  const keepEcho = o.echo ? RESIDUAL[o.strength] : 1;
  const out = new Float32Array(p.clean.length);
  const gain = o.level ? levelGain(p.clean) : 1;
  for (let i = 0; i < out.length; i++) {
    const voice = o.level ? p.clean[i] * gain : p.clean[i] * p.env[i];
    out[i] = clip(voice + p.echo[i] * keepEcho + p.noise[i] * keepNoise);
  }
  return out;
}

/** 让峰值到 0.9 的增益(最多放大 4 倍) */
function levelGain(x: Float32Array): number {
  let peak = 0;
  for (let i = 0; i < x.length; i++) peak = Math.max(peak, Math.abs(x[i]));
  return peak > 0 ? Math.min(4, 0.9 / peak) : 1;
}

export function rms(x: Float32Array, from = 0, to = x.length): number {
  let s = 0;
  for (let i = from; i < to; i++) s += x[i] * x[i];
  return to > from ? Math.sqrt(s / (to - from)) : 0;
}

/**
 * 自己上传的音频(没有拆开的干净人声):原型里只做简化处理——
 * Noise removal = 噪声门(每 20ms 一帧,能量低于门限的帧按强度压低);
 * Volume leveling = 每 0.5 秒按目标响度调增益(0.5–3 倍,帧间平滑);Echo removal 原型里不处理(待模型)。
 */
export function enhanceUpload(x: Float32Array, sampleRate: number, o: EnhanceOpts): Float32Array {
  const out = Float32Array.from(x);
  if (o.level) {
    const win = Math.max(1, Math.round(sampleRate * 0.5));
    const target = 0.12;
    let prev = 1;
    for (let s = 0; s < out.length; s += win) {
      const e = Math.min(out.length, s + win);
      const r = rms(out, s, e);
      const g = r > 0.005 ? Math.min(3, Math.max(0.5, target / r)) : prev;
      for (let i = s; i < e; i++) {
        const t = (i - s) / (e - s);
        out[i] = clip(out[i] * (prev * (1 - t) + g * t));
      }
      prev = g;
    }
  }
  if (o.noise) {
    const frame = Math.max(1, Math.round(sampleRate * 0.02));
    const gate = 0.02;
    const keep = RESIDUAL[o.strength];
    for (let s = 0; s < out.length; s += frame) {
      const e = Math.min(out.length, s + frame);
      if (rms(out, s, e) < gate) for (let i = s; i < e; i++) out[i] *= keep;
    }
  }
  return out;
}

/** 波形:分成 buckets 段,每段取最大绝对值(0–1) */
export function peaks(x: Float32Array, buckets: number): number[] {
  const out: number[] = [];
  if (!x.length || buckets <= 0) return out;
  const size = x.length / buckets;
  for (let b = 0; b < buckets; b++) {
    const s = Math.floor(b * size);
    const e = Math.max(s + 1, Math.floor((b + 1) * size));
    let m = 0;
    for (let i = s; i < e && i < x.length; i++) m = Math.max(m, Math.abs(x[i]));
    out.push(Math.min(1, m));
  }
  return out;
}

/** 单声道 16-bit PCM WAV */
export function encodeWav(x: Float32Array, sampleRate: number): ArrayBuffer {
  const buf = new ArrayBuffer(44 + x.length * 2);
  const v = new DataView(buf);
  const str = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i));
  };
  str(0, "RIFF");
  v.setUint32(4, 36 + x.length * 2, true);
  str(8, "WAVE");
  str(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  str(36, "data");
  v.setUint32(40, x.length * 2, true);
  for (let i = 0; i < x.length; i++) {
    const s = clip(x[i]);
    v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buf;
}

/** 选项的短描述(结果卡标题用) */
export function optsSummary(o: EnhanceOpts): string {
  const parts = [o.noise && "Noise", o.echo && "Echo", o.level && "Leveling"].filter(Boolean) as string[];
  return `${parts.join(" + ")} · ${o.strength[0].toUpperCase()}${o.strength.slice(1)}`;
}

export const AUDIO_TYPES = ["mp3", "wav", "m4a", "aac", "ogg"];
export const VIDEO_TYPES_AV = ["mp4", "mov", "webm", "m4v"];
export const fileKind = (name: string): "audio" | "video" | null => {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return AUDIO_TYPES.includes(ext) ? "audio" : VIDEO_TYPES_AV.includes(ext) ? "video" : null;
};

export const baseName = (name: string) => name.replace(/\.[^.]+$/, "");
