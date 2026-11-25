// 落地页合并表(2026-11-25,按 docs/research/2026-11-25-landing-page-plan.md 执行)。纯数据，服务端 page.tsx 和导航都读这里。
// 规则：需求太低或和别的页抢同一个词的页面不删内容，旧网址永久跳转(308)到合并后的目标页，导航和 Footer 里不再出现。
// 上线时照这张表配 301。要恢复某页：从这里删掉那一行即可。

/** 旧网址(不带斜杠) → 目标网址(带斜杠) */
export const MERGED: Record<string, string> = {
  /* ── 模型指南 / 对比:46 页 → 8 页。只留 Seedance 2.5、Kling 4.0、Nano Banana Pro 的 pricing + prompt guide,
        外加 Seedance 2.5 vs Kling 4.0 和 Best AI Video Models;其余并进对应模型页(模型页已有参数表、价格、对比表) ── */
  "seedance-2-5-how-to-use": "/seedance-2-5-prompt-guide",
  "kling-4-0-how-to-use": "/kling-4-0-prompt-guide",
  "nano-banana-pro-how-to-use": "/nano-banana-pro-prompt-guide",
  "gpt-image-2-5-sunburst-prompt-guide": "/gpt-image-2-5-sunburst",
  "seedance-2-0-prompt-guide": "/seedance-2-0",
  "seedance-2-0-pricing": "/seedance-2-0",
  "seedance-2-0-how-to-use": "/seedance-2-0",
  "kling-3-0-prompt-guide": "/kling-3-0",
  "kling-3-0-how-to-use": "/kling-3-0",
  "wan-3-0-prompt-guide": "/wan-3-0",
  "wan-3-0-pricing": "/wan-3-0",
  "minimax-h3-prompt-guide": "/minimax-h3",
  "minimax-h3-pricing": "/minimax-h3",
  "minimax-h3-how-to-use": "/minimax-h3",
  "gemini-omni-flash-pricing": "/gemini-omni-flash",
  "nano-banana-2-prompt-guide": "/nano-banana-2",
  "nano-banana-2-how-to-use": "/nano-banana-2",
  "gpt-image-2-prompt-guide": "/gpt-image-2",
  "gpt-image-2-how-to-use": "/gpt-image-2",
  "seedream-4-5-prompt-guide": "/seedream-4-5",
  "seedance-2-5-vs-seedance-2-0": "/seedance", /* 原型里 Seedance 2.5 页在 /seedance(线上 /models/seedance 已 301 到 /seedance) */
  "seedance-2-5-vs-wan-3-0": "/seedance", /* 原型里 Seedance 2.5 页在 /seedance(线上 /models/seedance 已 301 到 /seedance) */
  "seedance-2-5-vs-minimax-h3": "/seedance", /* 原型里 Seedance 2.5 页在 /seedance(线上 /models/seedance 已 301 到 /seedance) */
  "gemini-omni-flash-vs-seedance-2-5": "/gemini-omni-flash",
  "nano-banana-pro-vs-nano-banana-2": "/nano-banana-pro",
  "gpt-image-vs-nano-banana": "/nano-banana-pro",
  "gpt-image-2-5-sunburst-vs-flare": "/gpt-image-2-5-sunburst",
  "lyria-3-5-vs-suno": "/lyria-3-5",
  "gemini-3-8-flash-tts-vs-elevenlabs": "/gemini-3-8-flash-tts",
  "seedance-2-0-vs-kling-3-0": "/seedance-2-0",
  "seedance-2-0-vs-fast-vs-mini": "/seedance-2-0",
  "kling-4-0-vs-kling-3-0": "/kling-4-0",
  "kling-3-0-vs-kling-3-0-omni": "/kling-3-0",
  "wan-3-0-vs-minimax-h3": "/wan-3-0",
  "minimax-h3-vs-minimax-h3-max": "/minimax-h3",
  "nano-banana-2-vs-nano-banana-2-1": "/nano-banana-2-1",
  "gpt-image-2-vs-gpt-image-2-5": "/gpt-image-2",
  "seedream-5-0-pro-vs-nano-banana-pro": "/seedream-5-5", /* 2026-11-25 5.0 Pro 不做落地页，改跳 5.5 */

  /* ── 模板页：搜索需求几乎为 0(Trends:tiktok / facebook ad templates < 100/月)。保留 /templates 总页 + UGC + 产品视频 ── */
  "unboxing-video-templates": "/product-video-templates", /* 2026-11-25 原目标 /templates 已删 */
  "before-and-after-templates": "/product-video-templates", /* 2026-11-25 原目标 /templates 已删 */
  "ugc-ad-script-templates": "/ai-ugc-ads", /* 2026-11-25 原目标 /ugc-ad-templates 已删 */
  "problem-solution-ad-template": "/product-video-templates", /* 2026-11-25 原目标 /templates 已删 */
  "talking-head-ad-template": "/product-video-templates", /* 2026-11-25 原目标 /templates 已删 */
  "street-interview-ad-template": "/product-video-templates", /* 2026-11-25 原目标 /templates 已删 */
  "grwm-ad-template": "/product-video-templates", /* 2026-11-25 原目标 /templates 已删 */
  "testimonial-ad-templates": "/product-video-templates", /* 2026-11-25 原目标 /templates 已删 */
  "tiktok-ad-templates": "/product-video-templates", /* 2026-11-25 原目标 /templates 已删 */
  "instagram-reels-templates": "/product-video-templates", /* 2026-11-25 原目标 /templates 已删 */
  "facebook-ad-templates": "/product-video-templates", /* 2026-11-25 原目标 /templates 已删 */
  "youtube-shorts-templates": "/product-video-templates", /* 2026-11-25 原目标 /templates 已删 */
  "black-friday-ad-templates": "/product-video-templates", /* 2026-11-25 原目标 /templates 已删 */
  "christmas-ad-templates": "/product-video-templates", /* 2026-11-25 原目标 /templates 已删 */
  "valentines-day-ad-templates": "/product-video-templates", /* 2026-11-25 原目标 /templates 已删 */
  "mothers-day-ad-templates": "/product-video-templates", /* 2026-11-25 原目标 /templates 已删 */

  /* ── 低需求工具并进同类页 ── */
  "ai-carousel-maker": "/ai-social-media-post-generator",
  /* 改名：搜「video face swap」「video background changer」的人更多 */
  "video-character-swap": "/video-face-swap",

  /* ── 问题页：搜索量 < 30/月，改成 /ai-ugc-ads 页里的 FAQ ── */
  "ai-ugc-vs-human-ugc": "/ai-ugc-ads",
  "are-ai-ugc-ads-legal": "/ai-ugc-ads",
  /* 改名(2026-11-25):对齐 OpenArt 等同类站的 /whats-new */
  changelog: "/whats-new",

  /* ── 2026-11-25 Monica 批注：这些模型产品里照常可用，只是不单独做落地页 → 并进同家族主型号页 ── */
  "seedance-2-0-fast": "/seedance-2-0",
  "seedance-2-0-mini": "/seedance-2-0",
  "seedance-2-5-flash": "/seedance",
  "kling-3-0-omni": "/kling-3-0",
  "qwen-image-3-0-pro": "/qwen-image-3-0",
  "seedream-5-0-pro": "/seedream-5-5",
  "seedream-5-0-lite": "/seedream-5-5",
  "nano-banana-2-lite": "/nano-banana-2",
  "wan-2-7-image": "/models",
  "wan-2-7-image-pro": "/models",

};

/** 某个站内网址是否已被合并(导航过滤用) */
export const isMerged = (href: string) => !!MERGED[href.replace(/^\//, "").split("#")[0]];

/** 站内链接输出前先换成合并后的目标网址(直接链到终点，不让爬虫走跳转链) */
export const resolveHref = (href: string) => {
  if (!href.startsWith("/")) return href;
  const [path, hash] = href.split("#");
  const to = MERGED[path.replace(/^\//, "")];
  return to ? to : hash !== undefined ? `${path}#${hash}` : path;
};

/* 2026-11-25 Monica 在落地页清单上划掉的 12 个页面：功能短期不做，落地页删除(返回 404,不跳转),导航链接和 Footer 里去掉。
   顶栏 Studios 菜单里同名的产品图卡(Design Studio、Image Builder 等)是产品入口，不在这里管。 */
export const REMOVED = new Set([
  "ai-website-builder", "ai-presentation-maker", "ai-graphic-design", "ai-lyrics-generator", "ai-voice-changer", "ai-video-translator",
  "ad-creative-maker", "ai-instagram-post-generator", "ai-social-media-post-generator", "ai-voice-enhancer", "brand-kit", "design-studio",
  /* 2026-11-25 第二批(Monica 在清单上划掉的 7 个工具页) */
  "first-last-frame", "ai-video-background-remover", "ai-storyboard-generator", "3d-studio", "ai-photo-relight", "ai-thumbnail-maker", "photo-angle-editor",
  /* 第三批:Hybrid Reel 和 5 个 MCP Skill 落地页(顶栏里它们是产品入口，直接链到产品) */
  "hybrid-reel", "link-to-ad-mcp-skill", "ugc-product-review-mcp-skill", "ad-hook-variants-mcp-skill", "ad-localizer-mcp-skill", "long-to-shorts-mcp-skill",
  /* 第四批(「其他」类) */
  "youtube-shorts", "pet-product-ads", "facebook-ads", "ai-model-photoshoot", "ugc-ad-templates", "templates", "seedance-2-5-vs-kling-4-0",
  /* 第五批：竞品替代页(TopView 那页是 UAT 已有的 /compare/topview,保留) */
  "buzzvideo-vs-arcads", "buzzvideo-vs-pippit", "buzzvideo-vs-makeugc", "buzzvideo-vs-creatify", "buzzvideo-vs-heygen", "buzzvideo-vs-higgsfield", "buzzvideo-vs-synthesia",
  /* 第六批(2026-11-25 Monica 批注「这期不做」):免费工具不单独做落地页(搜索量太低);原先并进 Hook Generator 的旧网址一起删。
     Help / FAQ / What's New / Enterprise 是网站基础页，照常保留，只是不算 SEO 落地页 */
  "video-to-gif", "video-compressor", "image-resizer", "video-resizer", "ai-hook-generator", "tiktok-caption-generator", "ad-size-guide", "safe-zone-checker",
  "ai-ad-script-generator", "ai-ad-copy-generator",
]);
export const isRemoved = (href: string) => REMOVED.has(href.replace(/^\//, "").split("#")[0]);
