/* /canvas 落地页文案与素材(2026-11-26 重做成完整 SEO/GEO 落地页)。
   Monica:「做成落地页介绍 canvas，canvas 相关的 SEO/GEO 关键词，场景词，长尾词去做这个落地页，做完整落地页」+「大屏幕有问题」。

   关键词(Google Ads 量，落地页清单):ai canvas 2,400/mo(主词 → H1)· ai canvas generator 320 · what is ai canvas · ai canvas online ·
   ai canvas app · ai canvas examples · how to use canvas ai tool · what is canvas ai tool · ai canvas art。
   不碰无关词义:Canvas LMS、Canva、AI 检测器、Cisco。
   场景 / 长尾(营销人):node-based AI workflow、visual AI workflow builder、storyboard to video、images / video / audio on one board、
   product ad from one photo、consistent character across shots、reuse an output as the next node's reference、team comments。

   竞品调研(2026-11-26):
   - Higgsfield Canvas:节点连线拼贴做首屏 + 模板卡片(Quick Start)→ 我们保留节点拼贴首屏，模板改成「示例 + 节点链」卡片;
   - Figma Weave(原 Weavy):「所有模型一起用」(模型 logo + 成片)→「专业工具」(Inpaint/Upscale/Relight)→「工作流变工具」→ 工作流模板卡，无 FAQ;
   - Flora:Ideate / Iterate(团队实时协作)/ Scale 三块 →「Every model. One canvas」→ 按行业的用途卡 → 可复用 Techniques(Character Lock 等)→ 单一订阅 + 50+ 模型清单;
   - Krea Nodes:进来就是产品页(New Workflow + Projects / Apps / Examples / Templates 标签),没有营销段;
   共同段落：节点画布首屏、模板 / 工作流示例、多模型同一画布、节点上跑工具、团队协作、按场景的用途、模型清单。都没有 FAQ —— 我们用 FAQ 补 GEO。
   素材只用 public/prototypes/site/ 里现成的文件，整页每个文件只出现一次(下面集中列出，方便核对)。 */

import { SIGNUP_CREDITS } from "../credits";

export const S = "/prototypes/site";
const D = `${S}/diagrams`;
const PG = `${S}/pages`;
const TL = `${S}/tools`;

/** 首屏节点画板用到的素材 */
export const HERO_MEDIA = {
  /* 2026-11-27 换成 Enterprise 作品墙里 Silkwave 冲凉那条的真实工作流素材 */
  product: `${PG}/canvas/sw-product.webp`,
  model: `${PG}/canvas/sw-model.webp`,
  image: `${PG}/canvas/sw-swap.webp`,
  final: { src: `${PG}/canvas/sw-final.mp4`, poster: `${PG}/canvas/sw-final.webp` },
};

export const HERO = {
  kicker: "BuzzVideo Canvas",
  h1: "AI Canvas",
  accent: "Images, video & audio on one board",
  lead: "BuzzVideo's AI Canvas is a node-based board where you generate images, video and audio and connect them into a whole ad. Use any output as the next node's reference, regenerate one shot without starting over, and review it with your team in one place.",
};

/* ── 示例(ai canvas examples):成片 + 这块画布上的节点链 ── */
export type CanvasExample = { key: string; title: string; chain: string[]; src: string; poster?: string; kind: "video" | "image"; alt: string };
export const EXAMPLES: CanvasExample[] = [
  { key: "ugc", title: "Product photo to UGC ad", chain: ["Product photo", "Creator shot", "UGC video"], kind: "video", src: `${PG}/ai-ugc-ads/r2.mp4`, poster: `${PG}/ai-ugc-ads/r2.webp`, alt: "Creator UGC ad for LUMEA vitamin C serum built on an AI canvas" },
  { key: "unboxing", title: "Unboxing video", chain: ["Product photo", "Unboxing clip"], kind: "video", src: `${TL}/unboxing-ugc.mp4`, poster: `${TL}/unboxing-ugc.jpg`, alt: "A 15-second unboxing video made from one product photo" },
  { key: "talking", title: "Talking product ad", chain: ["Product photo", "Character", "Voiceover", "Lip Sync"], kind: "video", src: `${TL}/talking-product.mp4`, poster: `${TL}/talking-product.jpg`, alt: "A talking product character ad for a BRIVO can" },
  { key: "turntable", title: "360 product video", chain: ["Product photo", "3D", "Video"], kind: "video", src: `${TL}/3d-product-video.mp4`, poster: `${TL}/3d-product-video.jpg`, alt: "A 3D product turnaround video of wireless earbuds" },
  { key: "jewelry", title: "Jewelry close-up ad", chain: ["Product photo", "Model shot", "Video"], kind: "video", src: `${PG}/jewelry-ads/g1.mp4`, poster: `${PG}/jewelry-ads/g1.webp`, alt: "A gold necklace close-up ad on a model" },
  { key: "commercial", title: "Lifestyle commercial", chain: ["Storyboard", "Shots", "Edit"], kind: "video", src: `${PG}/ai-commercials/r1.mp4`, poster: `${PG}/ai-commercials/r1.webp`, alt: "A lifestyle commercial shot of a woman reading a newspaper on a tennis court" },
  { key: "mascot", title: "Brand mascot series", chain: ["Character", "Scene", "Video"], kind: "video", src: `${PG}/consistent-character/use3.mp4`, poster: `${PG}/consistent-character/use3-poster.webp`, alt: "Pip the fox mascot pours heart latte art behind a cafe counter" },
  { key: "photos", title: "Product photo set", chain: ["Product photo", "Scene", "Variations"], kind: "image", src: `${D}/own-out-1.webp`, alt: "LUMEA serum product shot on stone with sliced oranges and sunlight" },
];

/* ── 关键功能(左右交替) ── */
export const FEATURES = {
  title: "Key AI Canvas features",
  sub: "A visual AI workflow builder for ads: every image, clip and audio track sits on one board, connected to the shots it came from.",
  what: {
    title: "What is an AI canvas?",
    body: "An AI canvas is an infinite board where each image, video clip or audio track is generated as a node and connected to the others. Instead of one prompt and one result, you see the whole project at once, reuse what works and regenerate only what doesn't. BuzzVideo's Canvas runs the image, video and audio models on your BuzzVideo account, online in your browser.",
    media: { src: `${S}/nav/studios/canvas.mp4`, poster: `${S}/nav/studios/canvas.webp`, alt: "BuzzVideo Canvas with a prompt node, a reference image and a video node connected on one board" },
  },
  reference: {
    title: "Use any output as the next node's reference",
    body: "Connect a product photo to an image node and the same bottle shows up in every scene. Then connect that image to a video node to animate it. Each node remembers its prompt, model and references, so you can branch one product into many shots.",
    media: { from: `${D}/own-photo.webp`, outs: [`${D}/ref-out-1.webp`, `${D}/ref-out-2.webp`, `${D}/ref-out-3.webp`] },
  },
  character: {
    title: "Keep one character across every shot",
    body: "Add a character node once and wire it into every image and video. The same face, hair and styling carry through close-ups, wide shots and talking clips, so a multi-shot ad or a UGC series looks like one creator.",
    media: { from: `${D}/cons-close.webp`, outs: [`${D}/cons-life.webp`, `${D}/cons-wide.webp`, `${D}/long-ugc.webp`] },
  },
  tools: {
    title: "Run AI tools right on a node",
    body: "On a video node you can run Motion Control, Lip Sync, 3D to Video and Upscale. On an image node you can run Talking Avatar and Upscale. Each result lands on the board as a new node, next to the one it came from.",
    before: { kind: "image" as const, src: `${PG}/ai-lip-sync/what-before.webp`, aspect: "16:9", alt: "A man holds up a skincare tube in a bathroom", prompt: "", source: "" },
    after: { kind: "video" as const, src: `${PG}/ai-lip-sync/what.mp4`, poster: `${PG}/ai-lip-sync/what-poster.webp`, aspect: "16:9", alt: "The same man talks to the camera, lip-synced to a voiceover", prompt: "", source: "" },
  },
  team: {
    title: "Comment and build with your team",
    body: "Share a canvas with your team or client. Leave a comment on the exact shot, see who is working where, and swap a frame without breaking the rest of the ad. Agencies keep every version of a campaign on one board.",
    media: [`${D}/draft-1.webp`, `${D}/draft-2.webp`, `${D}/draft-4.webp`],
  },
};

/* ── 三步教程(how to use canvas ai tool) ── */
export const STEPS = [
  { title: "Add nodes", body: "Open a blank canvas or start from a template, then add an image, video or audio node." },
  { title: "Connect the shots", body: "Drag a line from one node to the next to use its frame or clip as the reference." },
  { title: "Swap and finish", body: "Regenerate any shot, add a voiceover, then put the clips and audio together." },
];
export const STEP_MEDIA = {
  from: `${D}/var-1.webp`,
  to: `${D}/draft-3.webp`,
  timeline: [`${D}/var-2.webp`, `${D}/var-3.webp`, `${D}/var-4.webp`],
};

/* ── 用途(场景词)── */
export type CanvasUse =
  | { key: string; title: string; body: string; pair: { before: { src: string; alt: string }; after: { src: string; poster: string; alt: string }; beforeLabel: string; afterLabel: string; model?: string } }
  | { key: string; title: string; body: string; video: { src: string; poster: string; alt: string } }
  | { key: string; title: string; body: string; image: { src: string; alt: string } };
export const USES: CanvasUse[] = [
  {
    key: "product",
    title: "Product ads from one photo",
    body: "Ecommerce brands drop in one product photo and branch it into lifestyle shots, model shots and short videos on the same board. The product node keeps the packaging the same in every shot.",
    pair: { before: { src: `${PG}/image-to-video/product-before.webp`, alt: "A caramel leather tote on a bentwood chair in a sunny cafe" }, after: { src: `${PG}/image-to-video/product-after.mp4`, poster: `${PG}/image-to-video/product-after.webp`, alt: "The camera slowly orbits the leather tote as leaf shadows drift" }, beforeLabel: "Photo", afterLabel: "Video" },
  },
  {
    key: "storyboard",
    title: "Storyboard to video",
    body: "Lay out the frames of an ad first, get them approved, then connect each frame to a video node. The shot keeps the framing of the sketch, so what the client signed off is what you get.",
    pair: { before: { src: `${PG}/image-to-video/storyboard-before.webp`, alt: "A pencil storyboard sketch of a kid on a bike with a dog" }, after: { src: `${PG}/image-to-video/storyboard-after.mp4`, poster: `${PG}/image-to-video/storyboard-after.webp`, alt: "The sketch rendered as a live-action shot of a kid biking with his dog" }, beforeLabel: "Sketch", afterLabel: "Video" },
  },
  {
    key: "series",
    title: "UGC series with the same creator",
    body: "Build a run of creator-style ads with one consistent character: a morning routine, a commute, a review. Each shot is a node, so swapping the location never changes the face.",
    image: { src: `${PG}/consistent-character/use2.webp`, alt: "The same red-haired woman in three different scenes of a UGC series" },
  },
  {
    key: "hooks",
    title: "A/B test hooks and variations",
    body: "Duplicate the winning branch and change only the opening shot. Three hooks, one body and one end card, all on one board and ready to test on Meta or TikTok.",
    video: { src: `${S}/pages/ai-video-for-agencies/r2.mp4`, poster: `${S}/pages/ai-video-for-agencies/r2.webp`, alt: "One serum ad with three different opening hooks side by side" },
  },
  {
    key: "resize",
    title: "One ad for every placement",
    body: "Keep the 9:16, 1:1 and 16:9 versions of an ad side by side. Change a shot once and rebuild each ratio from the same nodes for Reels, feeds and YouTube.",
    video: { src: `${S}/pages/ai-video-for-agencies/r4.mp4`, poster: `${S}/pages/ai-video-for-agencies/r4.webp`, alt: "One ad resized for YouTube, Reels and Stories" },
  },
];

/* ── 更多工具(品牌色底卡片):每张卡一个本页没用过的文件 ── */
export const WAYS: { slug: string; desc: string; pic: { kind: "video" | "image"; src: string; poster?: string; alt: string } }[] = [
  { slug: "ai-storyboard-generator", desc: "Turn a script into frames you can send to Canvas", pic: { kind: "video", src: `${PG}/image-to-video/v1-after.mp4`, poster: `${PG}/image-to-video/v1-before.webp`, alt: "A golden retriever on a lake dock at sunrise" } },
  { slug: "consistent-character", desc: "Lock a face or mascot across every image", pic: { kind: "image", src: `${PG}/consistent-character/use1.webp`, alt: "The same fox mascot in three scenes" } },
  { slug: "ai-lip-sync", desc: "Make any face speak your voiceover", pic: { kind: "video", src: `${PG}/ai-lip-sync/use1.mp4`, poster: `${PG}/ai-lip-sync/use1-poster.webp`, alt: "A lip-synced talking clip" } },
  { slug: "motion-control", desc: "Copy the moves from a reference clip", pic: { kind: "video", src: `${PG}/motion-control/use1.mp4`, poster: `${PG}/motion-control/use1-poster.webp`, alt: "A motion control clip" } },
  { slug: "ai-video-editor", desc: "Cut, caption and finish the ad", pic: { kind: "video", src: `${PG}/ai-video-editor/captions-cuts.mp4`, poster: `${PG}/ai-video-editor/captions-cuts.webp`, alt: "A cake ad cut together with text stickers and an end card" } },
  { slug: "image-to-video", desc: "Animate any still from your board", pic: { kind: "video", src: `${PG}/image-to-video/social-after.mp4`, poster: `${PG}/image-to-video/social-after.webp`, alt: "A man raises a film camera on a Brooklyn rooftop and smiles" } },
  { slug: "hybrid-reel", desc: "Mix your own footage with AI shots", pic: { kind: "video", src: `${PG}/ai-commercials/hf-h1.mp4`, poster: `${PG}/ai-commercials/hf-h1.webp`, alt: "A traveller looks out of an airport window at sunset" } },
];

/** 模型卡：canvas 条目里的模型(more.ts),素材取各自模型页成片的第几条 */
export const MODEL_CARDS: { slug: string; pick: number }[] = [
  { slug: "seedance-2-5", pick: 0 },
  { slug: "kling-4-0", pick: 0 },
  { slug: "nano-banana-2-1", pick: 2 },
];

/* ── FAQ:第一句直接回答，方便 AI 搜索引用;事实来自 more.ts 的 canvas 条目 ── */
export const FAQ: { q: string; a: string }[] = [
  { q: "What is an AI canvas?", a: "An AI canvas is a visual board where every image, video clip and audio track is generated as a connected node. You see the whole project at once, use one output as the reference for the next and regenerate any single shot. BuzzVideo's Canvas is built for making ads this way, shot by shot." },
  { q: "Is BuzzVideo Canvas free?", a: `Canvas itself is part of BuzzVideo; what you generate on it is billed in credits. The ${SIGNUP_CREDITS} free credits you get at sign-up cover Seedream images and Seed Audio 1.0, and video models need a Starter, Pro or Ultra plan. You see the credit cost on each node before you generate.` },
  { q: "How do I use the AI canvas?", a: "Add a node, connect it, then swap and finish. Start from a blank canvas or a template, generate an image, video or audio node, drag a line to use its output as the next node's reference, and regenerate any shot until the ad is right." },
  { q: "Which models run on Canvas?", a: "Canvas runs the models on your BuzzVideo account, such as Seedance 2.5 and Kling 4.0 for video, Nano Banana 2.1 for images and Seed Audio 1.0 for voiceover, music and sound effects. You pick the model on each node." },
  { q: "What is an AI canvas generator?", a: "An AI canvas generator is a canvas where each node generates content and passes it on to the next. On BuzzVideo's Canvas, a product photo can feed an image node, that image can feed a video node, and a voiceover node can sit on top, so a whole ad is generated from one board." },
  { q: "Can I use BuzzVideo Canvas online, or is there an app?", a: "BuzzVideo Canvas runs online in your web browser, so there is nothing to install. Your canvases, nodes and results are saved to your BuzzVideo account and library." },
  { q: "How is Canvas different from Video Gen?", a: "Video Gen makes one clip from one prompt. Canvas keeps every image, clip and audio track of a project on one board, so one shot can be the reference for the next and you can rebuild part of an ad without starting over." },
  { q: "How long can a clip on Canvas be?", a: "Up to 30 seconds per clip with Seedance 2.5 or Kling 4.0. Longer ads are built from several connected shots on the board, then put together with the voiceover and captions." },
];

export const CTA_SUB = `Start a canvas with ${SIGNUP_CREDITS} free credits and build your next ad, shot by shot, with the leading AI models on one BuzzVideo account.`;
