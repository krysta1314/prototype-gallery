// 模型 logo(2026-11-24 Monica 给的文件，~/Downloads/模型 logo/ → public/prototypes/site/logos/)。
// 顶栏 Models 列表、悬停详情卡、All Models 卡片共用。按模型系列对应，不是只按厂商：
// Nano Banana 用香蕉、Gemini / Lyria 用 Gemini、Qwen 用 Qwen、Wan 用 Wan 自己的 logo、MiniMax 的视频模型(H3)用海螺、语音 / 音乐用 MiniMax。
// HeyGen 用品牌包里的 symbol(~/Downloads/heygen-brandkit/heygen-symbol-blue-logo.svg)。

import type { ModelEntry } from "./models-catalog";

const DIR = "/prototypes/site/logos";
/** 单色线稿(fill=currentColor,img 里显示成黑色):放在深色底上要反白 */
export const MONO_LOGOS = new Set(["elevenlabs.svg", "flux.svg", "grok.svg", "openai.svg"]);

function fileOf(m: Pick<ModelEntry, "slug" | "vendor" | "type">): string | undefined {
  const s = m.slug;
  if (s.startsWith("nano-banana")) return "nanobanana-color.svg";
  if (s.startsWith("qwen")) return "qwen-color.svg";
  if (s.startsWith("wan")) return "wan.svg";
  if (s.startsWith("muse")) return "muse-color.svg";
  if (s.startsWith("mureka")) return "mureka.webp";
  switch (m.vendor) {
    case "Google": return "gemini-color.svg";
    case "ByteDance": return "bytedance-color.svg";
    case "OpenAI": return "openai.svg";
    case "Kuaishou": return "kling-color.svg";
    case "Alibaba": return "alibaba-color.svg";
    case "MiniMax": return m.type === "video" ? "hailuo-color.svg" : "minimax-color.svg";
    case "Black Forest Labs": return "flux.svg";
    case "xAI": return "grok.svg";
    case "Meta": return "muse-color.svg";
    case "Microsoft": return "microsoft-color.svg";
    case "ShengShu": return "vidu-color.svg";
    case "ElevenLabs": return "elevenlabs.svg";
    case "Kunlun Tech": return "mureka.webp";
    case "HeyGen": return "heygen-color.svg";
    default: return undefined;
  }
}

export function modelLogo(m: Pick<ModelEntry, "slug" | "vendor" | "type">): { src: string; mono: boolean } | undefined {
  const f = fileOf(m);
  return f ? { src: `${DIR}/${f}`, mono: MONO_LOGOS.has(f) } : undefined;
}
