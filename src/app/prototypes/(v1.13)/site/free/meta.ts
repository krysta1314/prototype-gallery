// 免费工具 + 公司 / 帮助页的 <title> 和 meta description(2026-11-19;11-23 补完 registry)。
// 服务端 generateMetadata 读这里，所以这个文件不能 import 任何 React 组件。registry.tsx 也从这里取，保证两边一致。

export const META: Record<string, { title: string; description: string; image?: string }> = {
  "video-resizer": {
    title: "Free Video Resizer for 9:16, 1:1, 4:5 | BuzzVideo",
    description: "Resize a video to 9:16, 1:1, 4:5 or 16:9 in your browser. Crop or pad with blur, preview it, then download. Free, no sign-up, nothing is uploaded.",
  },
  "safe-zone-checker": {
    title: "Safe Zone Checker for TikTok, Reels, Shorts | BuzzVideo",
    description: "Upload a frame and see TikTok, Instagram Reels, Stories and YouTube Shorts UI safe zones on top. Free, runs in your browser, with the sources cited.",
  },
  "image-resizer": {
    title: "Image Resizer for Facebook & Instagram Ads | BuzzVideo",
    description: "Resize an image to Meta's recommended ad sizes: 4:5 feed, 9:16 Stories and Reels, 1:1 and 1.91:1. Crop or pad, then download PNG or JPG. Free.",
  },
  "video-to-gif": {
    title: "Video to GIF Converter, Free & Private | BuzzVideo",
    description: "Turn up to 10 seconds of any video into a looping GIF in your browser. Pick the start, length, size and frame rate. Free, nothing is uploaded.",
  },
  "video-compressor": {
    title: "Free Video Compressor in Your Browser | BuzzVideo",
    description: "Make a video file smaller without uploading it. Choose a size preset, see the estimate, and re-encode it locally to MP4 or WebM. Free, no sign-up.",
  },
  "ad-size-guide": {
    title: "Meta Ad Size Guide 2026: Feed, Stories, Reels | BuzzVideo",
    description: "Every recommended Meta ad size in one table: Facebook and Instagram Feed, Stories and Reels ratios, resolutions, file limits and safe zones, with sources.",
  },
  "ai-hook-generator": {
    title: "AI Hook Generator for Video Ads | BuzzVideo",
    description: "Describe your product and audience, then get scroll-stopping opening lines for TikTok, Reels and Shorts ads from BuzzVideo's Marketing Agent.",
  },
  "ai-ad-script-generator": {
    title: "AI Ad Script Generator for Video Ads | BuzzVideo",
    description: "Turn a product and an audience into a shot-by-shot video ad script with hook, voiceover and call to action, written by BuzzVideo's Marketing Agent.",
  },
  "ai-ad-copy-generator": {
    title: "AI Ad Copy Generator for Meta & TikTok | BuzzVideo",
    description: "Get primary text, headlines and descriptions for Facebook, Instagram and TikTok ads. Enter your product and audience; the Marketing Agent writes the copy.",
  },
  "tiktok-caption-generator": {
    title: "TikTok Caption Generator with Hashtags | BuzzVideo",
    description: "Write short TikTok captions with hashtags for your product videos. Add the product and audience, then let BuzzVideo's Marketing Agent draft options.",
  },
  help: {
    title: "Help Center: Credits, Plans & Getting Started | BuzzVideo",
    description: "Get started with BuzzVideo: make your first ad, pick a model, understand credits and plans, and reach the support team.",
  },
  faq: {
    title: "FAQ: Credits, Plans, Models and Teams | BuzzVideo",
    description: "Answers to common BuzzVideo questions: free credits, which models each plan includes, credit resets, cancellations, refunds, teams, API and MCP access.",
  },
  changelog: {
    title: "What's New: Release Notes by Version | BuzzVideo",
    description: "What changed in each BuzzVideo release, from v1.2 to v1.16: new AI models, video modes, Canvas, MCP, Hybrid Reel, Design Studio and more.",
  },
  enterprise: {
    title: "Enterprise AI Video & Creative Platform for Teams | BuzzVideo",
    description: "BuzzVideo Enterprise: every leading AI video and image model, shared projects with review, SSO, API access, one credit pool and an SLA for teams.",
    /* 分享图 1200×630(~/Desktop/Enterprise落地页工程/og/):Monica 选了 B 多人画布;备用 og-alt.jpg 是首屏滑板 */
    image: "/prototypes/site/enterprise/og.jpg",
  },
};
