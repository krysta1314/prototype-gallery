/* 短视频广告的叙事结构库。
   Ryan 提案 §3 的差异化是「目的驱动」:剪辑决策服务于投放目标。所以不写死一套环节,
   而是按投放目的从这几种业内常用结构里挑 3 种,各出一版分镜让用户选(提案 §4「输出 3 个分镜方案」)。
   每种结构按成片时长给出环节序列,一个环节 = 一个镜头。 */

export type Beat = "hook" | "pain" | "proof" | "usage" | "cta";
export type StructureId = "problem_solution" | "social_proof" | "demo" | "before_after" | "offer";

type Structure = {
  zh: string;
  en: string;
  /** 什么投放目的 / 素材适合用它 —— 给挑结构的模型看 */
  fit: string;
  /** 这种结构怎么讲 —— 写进排分镜的 prompt */
  intent: string;
  /** 创意角度:洞察和开场从哪切入。三个方案靠它拉开差距,否则都会被 brief 里最显眼的一点(比如折扣)带跑 */
  angle: string;
  beats: { 15: Beat[]; 20: Beat[]; 30: Beat[] };
};

export const STRUCTURES: Record<StructureId, Structure> = {
  problem_solution: {
    zh: "痛点解决型",
    en: "Problem → Solution",
    fit: "the audience has a clear, relatable problem the product fixes; good for acquiring new customers",
    intent: "Open on the problem the audience feels, show the product solving it, then back the claim up.",
    angle: "The insight is a specific frustration this audience lives with. The opening shows that frustration, not the product and not a discount.",
    beats: {
      15: ["hook", "pain", "usage", "cta"],
      20: ["hook", "pain", "usage", "proof", "cta"],
      30: ["hook", "pain", "pain", "usage", "proof", "cta"],
    },
  },
  social_proof: {
    zh: "口碑证言型",
    en: "Social proof",
    fit: "the footage has a real person, creator or customer vouching for the product; good when trust is the barrier",
    intent: "Lead with a real person vouching for it. Let their words carry the claim; product shots only support them.",
    angle: "The insight is about who this audience trusts. The opening is a real person's reaction or first-hand claim.",
    beats: {
      15: ["hook", "proof", "usage", "cta"],
      20: ["hook", "proof", "usage", "proof", "cta"],
      30: ["hook", "proof", "pain", "usage", "proof", "cta"],
    },
  },
  demo: {
    zh: "产品演示型",
    en: "Product demo",
    fit: "the selling point is visible on screen — texture, how it is used, how fast it works",
    intent: "Show, don't tell. Open on the product in action and walk through how it is used.",
    angle: "The insight is a sensory, visible moment (texture, application, how it feels). The opening is the product doing something satisfying on screen.",
    beats: {
      15: ["hook", "usage", "proof", "cta"],
      20: ["hook", "usage", "usage", "proof", "cta"],
      30: ["hook", "usage", "usage", "proof", "usage", "cta"],
    },
  },
  before_after: {
    zh: "前后对比型",
    en: "Before & after",
    fit: "the result is a visible change between before and after using the product",
    intent: "Contrast the before state with the after state. The change itself is the proof.",
    angle: "The insight is the visible change the audience wants. The opening is the before state.",
    beats: {
      15: ["hook", "pain", "proof", "cta"],
      20: ["hook", "pain", "usage", "proof", "cta"],
      30: ["hook", "pain", "usage", "proof", "proof", "cta"],
    },
  },
  offer: {
    zh: "优惠促销型",
    en: "Offer-led",
    fit: "there is a discount, bundle, limited-time deal or a specific place to buy; good for conversion campaigns",
    intent: "Put the offer or where-to-buy up front, show the product quickly, and close on why to act now.",
    angle: "The insight is about the deal and the timing. The opening states the offer.",
    /* 和产品演示型区分开:开头就亮优惠,收尾给足时间讲在哪买、为什么现在买 */
    beats: {
      15: ["hook", "usage", "cta"],
      20: ["hook", "usage", "proof", "cta"],
      30: ["hook", "usage", "proof", "usage", "cta"],
    },
  },
};

export const STRUCTURE_IDS = Object.keys(STRUCTURES) as StructureId[];

/** 挑不出来时的默认组合:覆盖「讲痛点 / 靠口碑 / 看效果」三种最常见的打法 */
export const DEFAULT_PICKS: StructureId[] = ["problem_solution", "social_proof", "demo"];

export function beatsFor(id: StructureId, durationSec: number): Beat[] {
  const s = STRUCTURES[id];
  const key = durationSec <= 17 ? 15 : durationSec <= 25 ? 20 : 30;
  return s.beats[key];
}

export function structureName(id: StructureId, lang: "zh" | "en") {
  return lang === "zh" ? STRUCTURES[id].zh : STRUCTURES[id].en;
}
