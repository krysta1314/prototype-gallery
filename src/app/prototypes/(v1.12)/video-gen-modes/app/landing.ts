// 产品里通往 SEO / GEO 落地页的入口(2026-11-19,Monica:「直接做」P0 三个)。
// 做法见 docs/research/2026-11-19-tool-vs-landing-page.md 第 5 节：
//   P0-1 模型选择器每行的 ⓘ → 模型落地页;P0-2 生成页标题下「Guide & examples」→ 工具落地页;P0-3 生成结果卡「Made with {model}」→ 模型落地页。
// 线上是 buzzvideo.ai/models/<model>、/tools/<x>(真实 <a href>,新标签页打开，不打断正在做的事);
// 原型里落地页在 /prototypes/site/…(v1.13 官网原型);Kling 4.0 也用统一模板(2026-11-19 起，不再用手写版 /prototypes/model-page)。
import type { ModelKey } from "./capabilities";
import type { CreationType } from "./components/CreationTypeMenu";

const SITE = "/prototypes/site";

/* 生成器的模型 key → 官网模型页 slug */
const SLUG: Partial<Record<ModelKey, string>> = {
  "seedance-2.5": "seedance-2-5",
  "seedance-2.0": "seedance-2-0",
  "seedance-2.0-fast": "seedance-2-0-fast",
  "seedance-2.0-mini": "seedance-2-0-mini",
  "kling-4.0": "kling-4-0",
  "kling-3.0": "kling-3-0",
  "kling-3.0-omni": "kling-3-0-omni",
  "wan-3.0": "wan-3-0",
  "wan-3.0-prime": "wan-3-0-prime",
  h3: "minimax-h3",
  "h3-max": "minimax-h3-max",
  "vidu-q3": "vidu-q3-pro",
  "grok-1.5": "grok-imagine-video-1-5",
  "flux-3-max-video": "flux-3-max-video",
} as Partial<Record<ModelKey, string>>;

/* 模型工具(ai-tools/model-tools)里的变体 key:只映射确实是同一个模型的 */
const TOOL_VARIANT: Record<string, string> = { "h3-max-lipsync": "minimax-h3-max", "kling-3.0-motion": "kling-3-0" };

/** 模型落地页;没有对应页面的模型返回 undefined(不显示入口) */
export function modelLanding(key: ModelKey | string): string | undefined {
  const slug = SLUG[key as ModelKey] ?? TOOL_VARIANT[key];
  if (!slug) return undefined;
  return `${SITE}/${slug}`;
}

/** 当前生成类型对应的工具落地页(示例 + 教程 + FAQ 都在那一页) */
const TOOL: Record<CreationType, string> = {
  marketing: "ai-ad-generator",
  video: "ai-video-generator",
  image: "ai-image-generator",
  audio: "ai-voice-over",
  music: "ai-music-generator",
  sfx: "ai-sound-effects-generator",
};
export const toolLanding = (type: CreationType) => `${SITE}/${TOOL[type]}`;
