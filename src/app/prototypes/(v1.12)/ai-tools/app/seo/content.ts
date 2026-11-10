// 工具页的 SEO / GEO 内容(2026-11-10):Guide 标签页里首屏下面那一整段 —— 定义、步骤、样例、用途、规格、FAQ、收尾、相关工具。
// 每个工具一份 ToolGuide;页面的 <title> / description / 结构化数据(JSON-LD)也从这里生成，保证看得见的文字和给搜索引擎的数据是同一份。
// 规格里的数字直接取产品配置(logic.ts / SourceUpload.ts),改了参数这里跟着变，不会写出和产品对不上的规格。
// 文案原则(2026-11-10 独立评审后定):用用户会搜的说法，但同一个说法全页只出现一两次;不写绝对化的承诺;不写验证不了的数字。
// 纯数据，无 UI 依赖。

import { CREDITS_PER_MP, FACTOR_MAX, PRINT_DPI, PRINT_LONG_EDGE } from "../logic";
import { TOOLS, type ToolKey } from "../sidebarMenus";

/** 和 SourceUpload 的 MAX_MB.image 一致(那个文件是 client 组件，这里不能直接 import) */
export const IMAGE_MAX_MB = 20;
/** 注册送的积分(2026-11-10 Monica 确认：注册送 500;图片工具不用订阅就能用，只有视频要订阅) */
export const SIGNUP_CREDITS = 500;

/** 步骤上方配的产品界面片段(ToolGuide 里按 kind 画):
    file = 一张已上传的素材卡(缩略图 / 图标 + 文件名 + 一行信息);choice = 一排选项，其中一个选中，下面可带「从 → 到」一行;
    slider = 滑杆 + 数值框(和左栏真实控件一个样子);片段要和左栏的真实控件、默认值对得上(2026-11-10 UI 审核);
    result = 结果缩略图(给了 before 就左右各半)+ 下载按钮上的字 */
export type GuideVisual =
  | { kind: "file"; name: string; meta: string; thumb?: string; icon?: "image" | "video" | "audio" }
  | { kind: "choice"; /** 选项上面的小标签，写左栏里那个控件的名字 */ label?: string; options: string[]; selected: string; from?: string; to?: string }
  | { kind: "slider"; label: string; value: string; unit?: string; /** 滑块位置 0–100 */ percent: number; from?: string; to?: string }
  | { kind: "result"; before?: string; after: string; label: string };
export type GuideStep = { title: string; body: string; visual?: GuideVisual };
/** 定义段旁边的两格配图(Upscale 是同一处细节的 Before / After 特写;其他工具是输入和结果)+ 一行说明 */
export type GuideMedia = { items: { src: string; label: string; alt: string }[]; caption: string };
export type GuideUse = { title: string; body: string };
export type GuideSpec = { label: string; value: string };
export type GuideFaq = { q: string; a: string };
/** 前后对比样例。caption = 图下的一句说明;credit = 图片出处;alt 写清画面内容(图片搜索用) */
export type GuideExample = { before: string; after: string; width: number; height: number; caption: string; credit: string; alt: string; beforeAlt: string };
export type GuideRelated = { tool: ToolKey; body: string };

export type ToolGuide = {
  tool: ToolKey;
  /** 首屏 H1 和一句卖点(空状态现有的标题和描述) */
  h1: string;
  tagline: string;
  /** <title> 和 meta description */
  metaTitle: string;
  metaDescription: string;
  /** 开门见山的定义：AI 摘要最常引用的就是这一段。lead = 第一句，能单独拿出去读 */
  definition: { heading: string; lead: string; body: string; media?: GuideMedia };
  /** 分享图(1200×630);没有就不输出 og:image */
  ogImage?: string;
  /** 别的工具页「More AI tools」卡片上这个工具的缩略图;不填就用定义段配图的最后一张(结果图) */
  cardImage?: string;
  /** 卡片上自动播放的短视频(静音循环，640×400,几秒长;放在 public/prototypes/ai-tools/guide/cards/)。有就播视频、cardImage 当封面 */
  cardVideo?: string;
  steps: { heading: string; sub: string; items: GuideStep[] };
  examples?: { heading: string; sub: string; items: GuideExample[] };
  uses: { heading: string; sub: string; items: GuideUse[] };
  specs: { heading: string; items: GuideSpec[] };
  faq: { heading: string; items: GuideFaq[] };
  related: { heading: string; items: GuideRelated[] };
  /** 注册送的积分不订阅就能用(图片类工具)。视频类工具要订阅，不填 */
  freeToStart?: boolean;
  /** 页尾的行动区：标题、一句说明、按钮文字 */
  cta: { heading: string; body: string; button: string };
};

const fmtInt = (n: number) => n.toLocaleString("en-US");

export const UPSCALE_GUIDE: ToolGuide = {
  tool: "upscale",
  freeToStart: true,
  cardImage: "/prototypes/ai-tools/upscale-demo-after.jpg",
  ogImage: "/prototypes/ai-tools/ai-image-upscaler-og.jpg",
  h1: "AI Image Upscaler",
  tagline: "From old family photos to product shots, upscale any image to crystal-clear 4K in seconds.",
  metaTitle: "Free AI Image Upscaler: Upscale to 4K Online | BuzzVideo",
  metaDescription: `Upscale images up to ${FACTOR_MAX}x or to 4K online. Keeps edges, faces and small text sharp. Free to start with ${SIGNUP_CREDITS} credits, no subscription. JPG, PNG, WEBP, AVIF.`,
  definition: {
    heading: "What is an AI image upscaler?",
    media: {
      caption: "Close-up of the label, before and after upscaling",
      items: [
        { src: "/prototypes/ai-tools/examples/label-closeup-before.jpg", label: "Before", alt: "Close-up of a lip balm label before AI upscaling: the brand name is blurred" },
        { src: "/prototypes/ai-tools/examples/label-closeup-after.jpg", label: "After", alt: "Close-up of the same lip balm label after AI upscaling: the brand name is sharp and readable" },
      ],
    },
    lead: "An AI image upscaler makes a picture larger and rebuilds the edges, texture and small text that ordinary resizing turns to blur.",
    body: `BuzzVideo AI Image Upscaler is an online tool from BuzzVideo, an AI ad-creative platform for marketers and e-commerce sellers. It runs on the SeedVR model and is free to start: new accounts get ${SIGNUP_CREDITS} credits, and image tools need no subscription. Upload an image up to ${IMAGE_MAX_MB} MB, enlarge it 2x, 4x, 8x or up to ${FACTOR_MAX}x, or to a preset resolution up to 2160p (4K), then download a PNG, JPG or WEBP.`,
  },
  steps: {
    heading: "How to increase image resolution online",
    sub: "Three steps, with no prompt to write and nothing to install.",
    items: [
      { title: "Upload your image", visual: { kind: "file", name: "lip-balm.jpg", meta: "1,200 × 900", thumb: "/prototypes/ai-tools/upscale-demo-before.jpg" }, body: `Drop in a JPG, PNG, WEBP, GIF, AVIF or HEIC file up to ${IMAGE_MAX_MB} MB.` },
      { title: "Choose the output size", visual: { kind: "slider", label: "Upscale Factor", value: "4", unit: "x", percent: 33, from: "1,200 × 900", to: "4,800 × 3,600 px" }, body: `Set a scale factor up to ${FACTOR_MAX}x, or pick a target resolution from 720p to 4K (measured on the short side). The size preview shows the exact pixel dimensions and the credit cost before you run it.` },
      { title: "Generate and download", visual: { kind: "result", before: "/prototypes/ai-tools/upscale-demo-before.jpg", after: "/prototypes/ai-tools/upscale-demo-after.jpg", label: "PNG" }, body: "Drag the slider to compare before and after, then download the full-size file as PNG, JPG or WEBP." },
    ],
  },
  /* 样例图(2026-11-10):公版老照片，出处美国国会图书馆(Rights advisory: no known restrictions on publication)。
     页面上不出现中文(2026-11-10 Monica):占位说明只写在这段注释和评审说明里，不显示在页面上。
     ⚠️ 原型占位:dev 环境还没有 SeedVR,After 是高清原始扫描、Before 是同一张缩小的低清版，不是工具真实输出。上线前必须换。
     目标用户是做电商和广告的，正式版还要补商品图、带小字的广告图、AI 生成图各一组(等 Monica 提供素材);老照片最多留一张。 */
  examples: {
    heading: "Before and after: low-resolution photos, upscaled",
    sub: "Drag each slider to compare the low-resolution original with the upscaled result.",
    items: [
      {
        before: "/prototypes/ai-tools/examples/family-1940-before.jpg",
        after: "/prototypes/ai-tools/examples/family-1940-after.jpg",
        width: 668,
        height: 614,
        caption: "Family photo, 1940",
        credit: "Russell Lee, Library of Congress",
        beforeAlt: "Low-resolution 1940 color family photo before AI upscaling",
        alt: "1940 color family photo after AI upscaling: a couple and four children, with sharp faces and fabric patterns",
      },
      {
        before: "/prototypes/ai-tools/examples/wedding-1915-before.jpg",
        after: "/prototypes/ai-tools/examples/wedding-1915-after.jpg",
        width: 1600,
        height: 1046,
        caption: "Wedding day, New York, 1915",
        credit: "Bain News Service, Library of Congress",
        beforeAlt: "Low-resolution 1915 black-and-white wedding photo before AI upscaling",
        alt: "1915 black-and-white wedding photo after AI upscaling: a bride holding a bouquet beside a car, with guests in straw hats",
      },
    ],
  },
  uses: {
    heading: "What can you use an image upscaler for?",
    sub: "One upscaler for every image that has to look sharp at a bigger size.",
    items: [
      { title: "Product photos", body: "Bring supplier images and phone shots up to the resolution that storefront zoom and marketplace listings ask for." },
      { title: "Ad creatives", body: "Reuse one image across feed, story and display placements without soft edges or fuzzy text." },
      { title: "Images for print", body: `At ${FACTOR_MAX}x, a 1,200 px photo becomes ${fmtInt(1200 * FACTOR_MAX)} px wide, enough for a ${Math.round((1200 * FACTOR_MAX) / PRINT_DPI)}-inch print at ${PRINT_DPI} DPI.` },
      { title: "AI-generated images", body: "Take a 1K render up to 4K before it goes into a video, a deck or a landing page." },
      { title: "Old photos and scans", body: "Enhance small family photos, screenshots and scanned prints so they hold up on a big screen or a reprint." },
    ],
  },
  specs: {
    heading: "Supported formats, sizes and pricing",
    items: [
      { label: "Price", value: `Free to start with ${SIGNUP_CREDITS} credits at sign-up. Then ${CREDITS_PER_MP} credits per megapixel of output, rounded up to the next whole credit. No subscription needed.` },
      { label: "Input formats", value: "JPG, PNG, WEBP, GIF, AVIF, HEIC" },
      { label: "Max file size", value: `${IMAGE_MAX_MB} MB` },
      { label: "Scale factor", value: `Up to ${FACTOR_MAX}x in one run` },
      { label: "Max output", value: `${FACTOR_MAX}x the original, for example 1,200 px to ${fmtInt(1200 * FACTOR_MAX)} px` },
      { label: "Target resolution", value: "720p, 1080p (Full HD), 1440p (2K), 2160p (4K), measured on the short side" },
      { label: "Output formats", value: "PNG (default), JPG, WEBP" },
      { label: "Model", value: "SeedVR" },
    ],
  },
  faq: {
    heading: "AI image upscaler FAQ",
    items: [
      { q: "Is the AI image upscaler free?", a: `It is free to start. You get ${SIGNUP_CREDITS} credits when you sign up, and image tools work without a subscription. A 4K upscale of a 16:9 image costs 1 credit, so those credits cover hundreds of images.` },
      { q: "Can I increase image resolution without losing quality?", a: "In most cases, yes. Ordinary resizing stretches the pixels you already have, which is why enlarged photos look soft; the upscaler rebuilds edges, texture and small text as it enlarges. It cannot recover detail that was never captured, so very small or heavily compressed images improve less." },
      { q: "Do I need to sign up to upscale an image?", a: `Yes, a free account. Signing up gives you ${SIGNUP_CREDITS} credits, and image tools work without a subscription.` },
      { q: "Can it fix blurry or pixelated photos?", a: "It sharpens images that look soft or pixelated because they are small or low-resolution. It is an upscaler rather than a deblurring tool, so photos with motion blur or missed focus improve less." },
      { q: "How much can I enlarge an image?", a: `Up to ${FACTOR_MAX}x in one run. If you need more, use Upscale again on the result to enlarge it a second time.` },
      { q: "Will upscaling change how my product looks?", a: "The upscaler works from the image you upload; it does not redraw it from a prompt. Noise scale sets how much new fine detail it adds: keep it low to stay close to the original, which is the safer choice for labels and small text." },
      { q: "How many credits does an upscale cost?", a: `Cost follows the output size: ${CREDITS_PER_MP} credits per megapixel, rounded up to the next whole credit. A 4K image (3840 × 2160, about 8.3 megapixels) costs 1 credit, and an 8,000 × 6,000 image (48 megapixels) costs 5. The Generate button shows the exact cost before you run it.` },
      { q: "Is the result sharp enough to print?", a: `For most print jobs, yes: ${PRINT_DPI} DPI needs ${fmtInt(PRINT_DPI * 10)} px for a 10-inch print, and a 4x upscale of a 1,200 px photo already gives you ${fmtInt(1200 * 4)} px. Outputs with a long edge of ${fmtInt(PRINT_LONG_EDGE)} px or more are marked print-ready in the size preview.` },
      { q: "How long does upscaling take?", a: "Most images are ready in seconds. Very large outputs, such as 10x enlargements for print, take longer." },
      { q: "Which file formats can I upload and download?", a: `Upload JPG, PNG, WEBP, GIF, AVIF or HEIC files up to ${IMAGE_MAX_MB} MB. Download as PNG, JPG or WEBP. PNG is the default because it is lossless.` },
      { q: "What happens if an upscale fails?", a: "The credits for that run are refunded, and you can retry with the same image and settings." },
    ],
  },
  related: {
    heading: "More AI tools",
    items: [
      { tool: "video-upscale", body: "Sharpen low-resolution clips the same way." },
      { tool: "talking-avatar", body: "Turn a sharp portrait into a talking video." },
      { tool: "motion-control", body: "Animate a character image with the motion from a reference video." },
    ],
  },
  cta: {
    heading: "Upscale your first image free",
    body: `${SIGNUP_CREDITS} credits when you sign up, no subscription needed.`,
    button: "Upload an image",
  },
};

/* 其余工具的内容在 guides.ts;工具 → 内容的总表 GUIDES 也在那 */

/** 结构化数据(schema.org):工具本身 + 步骤 + FAQ + 面包屑，一个 @graph 输出。文字全部取自上面看得见的内容。
    注意(2026-11-10 SEO 审核):Google 已不给普通网站展示 FAQ / HowTo 富摘要，这两块是给 Bing 和 AI 搜索读的，不要为它们追加投入;
    没有真实评分就不要加 aggregateRating。 */
export function guideJsonLd(g: ToolGuide, opts: { origin: string; image?: string }) {
  const url = opts.origin + TOOLS[g.tool].href;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: `BuzzVideo ${g.h1}`,
        url,
        description: g.metaDescription,
        applicationCategory: "MultimediaApplication",
        operatingSystem: "Web",
        browserRequirements: "Requires JavaScript",
        inLanguage: "en",
        /* 只有免费能用的工具(图片类)才标 0 元;视频类要订阅，不标价格，免得误导 */
        ...(g.freeToStart ? { offers: { "@type": "Offer", name: `Free to start: ${SIGNUP_CREDITS} credits at sign-up`, price: "0", priceCurrency: "USD", description: g.specs.items.find((s) => s.label === "Price")?.value } } : {}),
        ...(opts.image ? { image: opts.origin + opts.image } : {}),
        featureList: g.specs.items.map((s) => `${s.label}: ${s.value}`),
        publisher: { "@type": "Organization", name: "BuzzVideo", url: "https://buzzvideo.ai" },
      },
      {
        "@type": "HowTo",
        name: g.steps.heading,
        step: g.steps.items.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.title, text: s.body })),
      },
      {
        "@type": "FAQPage",
        mainEntity: g.faq.items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "AI Tools", item: opts.origin + "/prototypes/ai-tools" },
          /* 分类(Image / Video…)目前没有自己的页面，面包屑不放没有网址的一级;最后一级的名字和页面 H1 一致 */
          { "@type": "ListItem", position: 2, name: g.h1, item: url },
        ],
      },
    ],
  };
}
