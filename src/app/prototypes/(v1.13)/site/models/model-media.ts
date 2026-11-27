// 模型页的真实成片(2026-11-18)。只放用该模型真实生成过的图 / 视频 / 音频，不放假图。
// 来源优先级：线上 Use Cases(buzzvideo.ai/usecase/...,页面写明了模型)→ 博客实测素材 → 用 BuzzVideo dev 生成(先调研再生成)。
// 没有成片的模型，模板会用「参数图形卡」补位(ModelVisuals.tsx),不会出现空洞。

export type Sample = {
  kind: "image" | "video" | "audio";
  src: string;
  poster?: string;
  /** 宽:高,例如 "4:5" */
  aspect: string;
  /** 生成用的完整提示词(作品墙悬停 / 生成框里展示) */
  prompt: string;
  /** 一句话说明，给 alt 和卡片标题用 */
  alt: string;
  /** 出处(Use Case 页 / 博客 / dev 任务),给内部核对用，不上页面 */
  source: string;
};

const NB21 = "/prototypes/site/models/nano-banana-2-1";

export const MEDIA: Record<string, Sample[]> = {
  "nano-banana-2-1": [
    {
      kind: "image",
      src: `${NB21}/giant.jpg`,
      aspect: "4:5",
      alt: "A giant LUMEA vitamin C serum bottle standing in a city square next to a woman in a camel coat",
      prompt:
        "Surreal giant-product ad: the LUMEA vitamin C serum bottle from the reference, as tall as a person, standing in a sunny modern city square. A stylish woman in a camel coat leans against it. Natural daylight, 35mm photo look, keep the label exactly as in the reference.",
      source: "blog #58 nano-banana-2-1-vs-pro (2K, 4:5, 2026-11-09)",
    },
    {
      kind: "image",
      src: `${NB21}/portrait.jpg`,
      aspect: "4:5",
      alt: "A creator holds the LUMEA serum bottle beside her cheek against an orange wall",
      prompt:
        "Creator-style beauty portrait: a woman holds the LUMEA serum bottle beside her cheek, face fully visible, hard flash on a bright orange wall, glowing skin, label readable.",
      source: "blog #58 nano-banana-2-1-vs-pro (2K, 4:5, 2026-11-09)",
    },
    {
      kind: "image",
      src: `${NB21}/static.jpg`,
      aspect: "4:5",
      alt: "Static ad for LUMEA vitamin C serum with the headline Glow, bottled and three feature chips",
      prompt:
        'Static product ad on a peach background: headline "Glow, bottled." and three chips "15% Vitamin C", "Ferulic acid", "30 ml". The LUMEA bottle on the right with half an orange, soft palm-leaf shadow.',
      source: "blog #58 nano-banana-2-1-vs-pro (2K, 4:5, 2026-11-09)",
    },
  ],
};

/* 其余模型的成片(2026-11-19):从 docs/model-media-inventory.json 逐个挑过(去掉黑屏、真实品牌、重复图),本地文件压缩到 public/prototypes/site/models/<模型>/ */
import GEN from "./model-media-gen.json";
const GENERATED = GEN as unknown as Record<string, (Omit<Sample, "poster"> & { poster: string | null })[]>;
/* 对外展示的提示词(2026-11-19 UI 审核):原始工程提示词里的模板变量 {argument name=… default="x"} 换成默认值,
   @image 1 / @Image2 换成 the reference image,去掉 CRITICAL: 这类全大写指令和中文批注行;原始提示词仍在素材盘点里 */
export function cleanPrompt(p: string): string {
  return p
    .replace(/\{argument name="[^"]*" default="([^"]*)"\}/g, "$1")
    .replace(/\{argument[^}]*\}/g, "")
    .replace(/@image\s*\d+/gi, "the reference image")
    .replace(/\b[A-Z]{4,}:\s*/g, "")
    .split("\n")
    .filter((l) => !/[\u4e00-\u9fff]/.test(l))
    /* 只写了时长 / 比例 / 分辨率的参数行(如「15s」「16:9」「1080p」)不是提示词，去掉 */
    .filter((l) => !/^\s*(\d+(\.\d+)?\s*s|\d+:\d+|\d{3,4}p)\s*$/i.test(l))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
/** 穿帮的成片：不再在任何页面出现(文件保留，生成数据也不动，重新生成清单时不会被带回来)。
    2026-11-26 Monica 在 Grok Imagine Video 1.5 首屏圈出:唇膏塞进了嘴里 —— 不重做，换成本模型现成的奶奶滑板 */
const FLAWED = new Set(["/prototypes/site/models/grok-imagine-video-1-5/lp-ugc.mp4"]);
/* 2026-11-27 逐页审图：图里印着美元价格的素材($24 防晒、$4 苹果酒、$19/$29 节日促销、$120 跑鞋)不在页面上用 —— 页面价格只写积分 */
const PRICED = /\$\s?\d/;

export const mediaOf = (slug: string): Sample[] =>
  [...(MEDIA[slug] ?? []), ...(GENERATED[slug] ?? []).map((x) => ({ ...x, poster: x.poster ?? undefined }))].filter((x) => !FLAWED.has(x.src) && !PRICED.test(`${x.alt ?? ""} ${x.prompt ?? ""}`)).map((x) => ({ ...x, prompt: cleanPrompt(x.prompt) }));
