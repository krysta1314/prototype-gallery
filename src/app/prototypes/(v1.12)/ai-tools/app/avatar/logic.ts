// Product Avatar / Custom Avatar 的纯逻辑(node 测试直接跑):
// 证言检测(FTC 提示)、一键写脚本、脚本时长与积分、按品类给默认手持方式、
// Custom Avatar 的拍摄素材时长检查、授权声明(人脸比对)状态机、我的分身列表操作与 sessionStorage 读写。
// 积分单价全是占位(待模型选型 / 定价):首帧 1 credit/张;视频 2 credits/秒;分身训练 100;同时克隆声音 +20。

/* ---------------- 证言检测(FTC) ---------------- */

/** 第一人称使用证言的说法:出现就提示「AI avatar — not a real customer testimonial」 */
const TESTIMONIAL_PATTERNS: RegExp[] = [
  /\bi(?:'ve| have) been using\b/,
  /\bi(?:'ve| have)? (?:used|tried)\b/,
  /\bsince i (?:started|switched|began)\b/,
  /\bmy (?:skin|hair|face|acne|wrinkles|body|results|scalp|lashes|weight)\b/,
  /\bchanged my life\b/,
  /\bi (?:swear by|can't live without|cannot live without)\b/,
  /\bworks? (?:so well |wonders |great )?for me\b/,
  /\bi (?:noticed|saw|lost|gained)\b/,
  /\bi (?:love|loved) (?:this|it|how|that|the)\b/,
  /\bbest (?:\w+ )?i(?:'ve| have)? ever\b/,
  /\bi(?:'m| am) (?:obsessed|hooked)\b/,
];

export type TestimonialHit = { phrase: string; index: number };

/** 找出脚本里的第一人称证言说法(不分大小写,弯撇号也认);按出现位置排序,同一位置只算一次 */
export function detectTestimonials(script: string): TestimonialHit[] {
  const text = script.replace(/[‘’ʼ]/g, "'").toLowerCase();
  const hits: TestimonialHit[] = [];
  for (const p of TESTIMONIAL_PATTERNS) {
    const re = new RegExp(p.source, "g");
    for (let m = re.exec(text); m; m = re.exec(text)) {
      if (!hits.some((h) => h.index === m!.index)) hits.push({ phrase: script.slice(m.index, m.index + m[0].length), index: m.index });
    }
  }
  return hits.sort((a, b) => a.index - b.index);
}

export const TESTIMONIAL_NOTICE = "AI avatar — not a real customer testimonial";

/* ---------------- 脚本 ---------------- */

export type ScriptLength = 15 | 30;

/** 口播语速(英文):每秒 2.5 个词 */
export const WORDS_PER_SECOND = 2.5;
export const MAX_SCRIPT_SECONDS = 60;
export const MAX_SCRIPT_CHARS = 900;

export const countWords = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

/** 脚本念完要几秒:按语速估算,向上取整到 5 秒,5–60;空脚本 = 0 */
export function scriptSeconds(script: string): number {
  const w = countWords(script);
  if (!w) return 0;
  return Math.min(MAX_SCRIPT_SECONDS, Math.max(5, Math.ceil(w / WORDS_PER_SECOND / 5) * 5));
}

/** 一键写脚本(fixture):商品名 + 卖点 → 15s / 30s 口播。用第二人称讲卖点,不写第一人称证言 */
export function writeScript({ product, benefits, length }: { product: string; benefits: string[]; length: ScriptLength }): string {
  const name = product.trim() || "this";
  const b = benefits.map((x) => x.trim().replace(/[.!]+$/, "")).filter(Boolean);
  const pick = (i: number, fallback: string) => b[i] ?? fallback;
  if (length === 15) {
    return [
      `Meet ${name}.`,
      `It ${pick(0, "does the hard work for you")}, and it ${pick(1, "fits right into your routine")}.`,
      `Tap the link and see it for yourself.`,
    ].join(" ");
  }
  return [
    `Looking for something that actually keeps up with your day? Meet ${name}.`,
    `First, it ${pick(0, "does the hard work for you")}.`,
    `It ${pick(1, "fits right into your routine")}, so there's no extra step to remember.`,
    `And it ${pick(2, "is made to last")}.`,
    `Small change, real difference.`,
    `Tap the link to get yours today.`,
  ].join(" ");
}

/* ---------------- 积分(占位) ---------------- */

export const FRAME_CREDITS = 1;
export const VIDEO_CREDITS_PER_SECOND = 2;
export const AVATAR_TRAIN_CREDITS = 100;
export const VOICE_CLONE_CREDITS = 20;

export const videoCredits = (seconds: number) => Math.max(0, Math.round(seconds)) * VIDEO_CREDITS_PER_SECOND;
export const trainCredits = (cloneVoice: boolean) => AVATAR_TRAIN_CREDITS + (cloneVoice ? VOICE_CLONE_CREDITS : 0);

/* ---------------- 手持方式 ---------------- */

export type HoldStyle = "hold" | "show" | "unbox" | "use";
export type ProductCategory = "beauty" | "electronics" | "food" | "fashion" | "other";

/** 按品类给默认手持方式:美妆 = 上脸用;电子 = 开箱;食品饮料 = 拿着;服饰 / 其他 = 对镜头展示 */
export function defaultHold(c: ProductCategory): HoldStyle {
  return ({ beauty: "use", electronics: "unbox", food: "hold", fashion: "show", other: "show" } as const)[c];
}

export const MAX_PRODUCT_IMAGES = 3;

/* ---------------- Custom Avatar:拍摄素材 ---------------- */

export const MIN_FOOTAGE_SECONDS = 30;
export const MAX_FOOTAGE_SECONDS = 120;

export type FootageCheck = "ok" | "too-short" | "too-long";
export function checkFootage(seconds: number): FootageCheck {
  if (seconds < MIN_FOOTAGE_SECONDS - 0.5) return "too-short";
  if (seconds > MAX_FOOTAGE_SECONDS + 0.5) return "too-long";
  return "ok";
}

/* ---------------- Custom Avatar:授权声明 + 人脸比对 ---------------- */

export type ConsentStep = "idle" | "recording" | "checking" | "passed" | "failed";
export type Consent = { step: ConsentStep; attempts: number };
export type ConsentAction = { type: "record" } | { type: "stop" } | { type: "result"; ok: boolean } | { type: "reset" };

export const CONSENT_START: Consent = { step: "idle", attempts: 0 };

/** 录(idle / failed 才能开始)→ 停(进入比对,次数 +1)→ 比对结果(通过 / 失败);换素材时 reset */
export function consentReduce(s: Consent, a: ConsentAction): Consent {
  switch (a.type) {
    case "record":
      return s.step === "idle" || s.step === "failed" ? { ...s, step: "recording" } : s;
    case "stop":
      return s.step === "recording" ? { step: "checking", attempts: s.attempts + 1 } : s;
    case "result":
      return s.step === "checking" ? { ...s, step: a.ok ? "passed" : "failed" } : s;
    case "reset":
      return CONSENT_START;
  }
}

/** 原型的比对结果:fixture 失败模式(?outcome=fail)下第一次比对失败、重试通过,好演示失败分支 */
export const faceMatchPassed = (apiOk: boolean, attempt: number) => apiOk || attempt > 1;

export function canSubmitAvatar(o: { footage: FootageCheck | null; consent: ConsentStep; name: string }): boolean {
  return o.footage === "ok" && o.consent === "passed" && o.name.trim().length > 0;
}

/* ---------------- 我的分身 ---------------- */

export type AvatarStatus = "training" | "ready" | "failed";
export type MyAvatar = {
  id: string;
  name: string;
  status: AvatarStatus;
  createdAt: number;
  /** 头像(拍摄素材抓的一帧,或样例图) */
  image: string;
  /** 勾了「Also clone my voice」:训练完成后 Product Avatar 的声音里出现「<名字>'s voice」 */
  voice: boolean;
  /** 训练扣了多少积分(失败全额退) */
  cost: number;
};

export const MAX_AVATAR_NAME = 40;

export type AvatarsAction =
  | { type: "add"; avatar: MyAvatar }
  | { type: "rename"; id: string; name: string }
  | { type: "remove"; id: string }
  | { type: "status"; id: string; status: "ready" | "failed" }
  | { type: "retry"; id: string }
  | { type: "load"; list: MyAvatar[] };

export function avatarsReduce(list: MyAvatar[], a: AvatarsAction): MyAvatar[] {
  switch (a.type) {
    case "add":
      return list.some((x) => x.id === a.avatar.id) ? list : [a.avatar, ...list];
    case "rename": {
      const name = a.name.trim().slice(0, MAX_AVATAR_NAME);
      if (!name) return list;
      return list.map((x) => (x.id === a.id ? { ...x, name } : x));
    }
    case "remove":
      return list.filter((x) => x.id !== a.id);
    case "status":
      return list.map((x) => (x.id === a.id && x.status === "training" ? { ...x, status: a.status } : x));
    case "retry":
      return list.map((x) => (x.id === a.id && x.status === "failed" ? { ...x, status: "training" } : x));
    case "load":
      return a.list;
  }
}

/** 默认名字:My avatar、My avatar 2、My avatar 3…(不和已有的重名) */
export function nextAvatarName(list: MyAvatar[], base = "My avatar"): string {
  const taken = new Set(list.map((x) => x.name.toLowerCase()));
  if (!taken.has(base.toLowerCase())) return base;
  for (let i = 2; ; i++) if (!taken.has(`${base} ${i}`.toLowerCase())) return `${base} ${i}`;
}

export const voiceNameOf = (a: Pick<MyAvatar, "name">) => `${a.name}'s voice`;

/** Product Avatar 能选的:训练好的 */
export const usableAvatars = (list: MyAvatar[]) => list.filter((x) => x.status === "ready");
export const clonedVoices = (list: MyAvatar[]) => list.filter((x) => x.status === "ready" && x.voice);

export const AVATARS_KEY = "ai-tools:my-avatars";

/** sessionStorage 读回:格式不对的条目丢掉;blob: 头像刷新后失效,换成占位 */
export function parseAvatars(raw: string | null, fallbackImage: string): MyAvatar[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    if (!Array.isArray(v)) return [];
    return v
      .filter(
        (x): x is MyAvatar =>
          x &&
          typeof x.id === "string" &&
          typeof x.name === "string" &&
          ["training", "ready", "failed"].includes(x.status) &&
          typeof x.createdAt === "number" &&
          typeof x.image === "string" &&
          typeof x.voice === "boolean" &&
          typeof x.cost === "number",
      )
      .map((x) => (x.image.startsWith("blob:") ? { ...x, image: fallbackImage } : x));
  } catch {
    return [];
  }
}

export function formatCreated(ms: number): string {
  return new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
