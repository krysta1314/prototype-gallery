// 2026-11-26 Monica:「新增规划里的页面配的素材很少，不要新做素材，从我们这些落地页里找合适的素材配上」。
// 问答页 / 数据页 / 对比页的配图 = 从主题相关的落地页(工具页、方案页、模型页)现有素材里取，不生成新素材。
// 来源顺序：本页手工指定(TOPIC)→ 页面 CTA 指向的落地页 → related 里的落地页。每个来源轮流取一条，视频优先，同一文件只用一次。
import { MODELS } from "../../site-nav/models-catalog";
import { mediaOf } from "../models/model-media";
import { PAGE_MEDIA } from "../page-media";
import { isTextHeavy, type Pic } from "../oa/pool";

/** 个别页面 related / CTA 指向的落地页素材不够切题，手工指定从哪几个落地页取 */
const TOPIC: Record<string, string[]> = {
  "what-is-lip-sync": ["ai-lip-sync", "ai-dubbing", "talking-avatar"],
  "what-is-ai-dubbing": ["ai-dubbing", "ai-lip-sync"],
  "how-to-face-swap-a-video": ["video-face-swap", "ai-face-swap"],
  "how-to-make-an-ai-dance-video": ["ai-dance-video", "motion-control"],
  "how-to-upscale-a-video-with-ai": ["upscale-video", "upscale-image"],
  "what-is-b-roll": ["ai-b-roll-generator", "faceless-video-generator"],
  "what-is-3d-video": ["3d-to-video", "image-to-3d"],
  "what-is-an-ai-influencer": ["ai-influencer-generator", "consistent-character", "talking-avatar"],
  "what-is-ugc-advertising": ["ai-ugc-ads", "ai-ugc-video-generator"],
  "buzzvideo-for-ugc-ads": ["ai-ugc-ads", "ai-ugc-video-generator"],
  "what-is-ai-art": ["ai-art-generator", "ai-anime-generator", "ai-cartoon-generator"],
  "what-is-voice-cloning": ["ai-voice-clone", "talking-avatar", "ai-dubbing"],
  "what-is-text-to-speech": ["text-to-speech", "ai-voice-over", "talking-avatar"],
  "clone-your-voice-with-ai": ["ai-voice-clone", "talking-avatar", "ai-dubbing"],
  "ai-avatar-american-accents": ["talking-avatar", "ai-spokesperson", "best-ai-avatar-video-generators"],
  "cheapest-realistic-ai-avatar": ["talking-avatar", "ai-spokesperson", "best-ai-avatar-video-generators"],
  "node-based-ai-video-canvas": ["ai-product-video-generator", "consistent-character", "image-to-video"],
  "what-is-an-mcp-server": ["video-generation-mcp", "claude-video-generator", "chatgpt-video-generator"],
  "can-claude-watch-videos": ["claude-video-generator", "video-generation-mcp"],
  "ai-video-for-dropshipping": ["dropshipping-ads", "url-to-video", "ai-ugc-video-generator"],
  "how-to-make-tiktok-shop-videos": ["tiktok-shop-videos", "tiktok-ai-video-generator", "ai-ugc-video-generator"],
  "tiktok-ads-benchmarks": ["tiktok-ai-video-generator", "tiktok-videos", "tiktok-shop-videos", "ai-ugc-ads"],
  "tiktok-ads-cpm": ["tiktok-videos", "tiktok-ai-video-generator", "ai-ugc-ads"],
  "best-time-to-post-ads": ["instagram-reels", "ai-ugc-ads", "tiktok-videos"],
  "ai-video-model-benchmarks": ["seedance-2-5", "kling-4-0", "wan-3-0", "minimax-h3"],
  "buzzvideo-ai-models": ["seedance-2-5", "kling-4-0", "nano-banana-2-1", "wan-3-0"],
  "multiple-ai-video-models-one-subscription": ["seedance-2-5", "kling-4-0", "wan-3-0", "minimax-h3"],
  "ai-video-best-value-per-credit": ["seedance-2-5", "kling-4-0", "wan-3-0"],
  "buzzvideo-credits-per-video": ["seedance-2-5", "kling-4-0", "wan-3-0"],
  "how-much-does-buzzvideo-cost": ["ai-video-generator", "ai-image-generator", "ai-ad-generator"],
  "buzzvideo-watermark": ["ai-video-generator", "ai-product-video-generator", "ai-ad-generator"],
  "is-buzzvideo-free": ["ai-image-generator", "ai-product-photography", "ai-art-generator"],
  "is-buzzvideo-legit": ["ai-ad-generator", "ai-product-video-generator", "ai-ugc-video-generator"],
  "how-to-use-ai-in-ecommerce": ["ai-video-for-ecommerce", "ai-product-photography", "ai-product-video-generator"],
  "how-to-add-video-to-amazon-listing": ["amazon-product-videos", "ai-product-video-generator", "product-demo-videos"],
  "how-to-write-a-video-ad-script": ["ai-script-to-video", "ai-ugc-ads", "ai-voice-over"],
  "what-video-software-do-youtubers-use": ["ai-b-roll-generator", "faceless-video-generator", "ai-music-video-generator"],
  "ai-tools-for-facebook-ads": ["ai-ad-generator", "ai-ugc-ads", "url-to-video"],
  "ai-ad-generator-agency-pricing": ["ai-video-for-agencies", "ai-ad-generator", "ai-ugc-ads"],
  "ai-video-for-marketing-teams": ["ai-marketing-videos", "ai-ad-generator", "ai-spokesperson"],
};

const MODEL_NAME = new Map(MODELS.map((m) => [m.slug, m.name]));
const slugOf = (href: string) => href.replace(/^\//, "").split("#")[0].split("?")[0];

/** 某个落地页现有的素材(工具页 / 方案页的配图，或模型页的成片) */
function mediaOfPage(slug: string): Pic[] {
  const own = PAGE_MEDIA[slug];
  if (own?.length) return own;
  const name = MODEL_NAME.get(slug);
  return name ? mediaOf(slug).map((p) => ({ ...p, model: name, modelSlug: slug })) : [];
}

/* 说明图(三步示意、对比拼图)和字多的图不适合当示例;音频只在本来就是讲声音的页里用 */
const DIAGRAM = /(faq|steps?|models|runs-on)(-poster)?\.webp$/;
const usable = (p: Pic, audioOk: boolean) => (p.kind === "audio" ? audioOk : !isTextHeavy(p) && !DIAGRAM.test(p.src) && !/-before(-poster)?\./.test(p.src));

export function guideMedia(page: { slug: string; related: string[]; cta?: string }, n = 3, skip: Pic[] = []): Pic[] {
  const audioOk = /speech|voice|audio|dubbing/.test(page.slug);
  const listsOf = (slugs: string[]) =>
    slugs
      .filter((x, i, a) => x && a.indexOf(x) === i)
      .map((x) => mediaOfPage(x).filter((p) => usable(p, audioOk)))
      .filter((l) => l.length)
      .map((l) => [...l.filter((p) => p.kind === "video"), ...l.filter((p) => p.kind !== "video")]);
  const seen = new Set(skip.flatMap((p) => [p.src, p.poster ?? ""]));
  const out: Pic[] = [];
  /* 手工指定的来源先取完，不够再用 CTA / related 指向的落地页补 */
  for (const lists of [listsOf(TOPIC[page.slug] ?? []), listsOf([...(page.cta ? [slugOf(page.cta)] : []), ...page.related.map(slugOf)])])
    for (let round = 0; out.length < n && round < 6; round++)
      for (const l of lists) {
        const p = l.find((x) => !seen.has(x.src));
        if (p && out.length < n) {
          seen.add(p.src);
          out.push(p);
        }
      }
  return out;
}

/** 一组相关落地页的全部可用素材(方案 / 行业页按文字挑配图时，只在相关页面的素材里找，不满世界乱配) */
export function relatedPool(hrefs: string[]): Pic[] {
  const seen = new Set<string>();
  return hrefs
    .map(slugOf)
    .flatMap((x) => mediaOfPage(x))
    .filter((p) => usable(p, false) && !seen.has(p.src) && (seen.add(p.src), true));
}
