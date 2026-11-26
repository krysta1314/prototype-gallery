// 2026-11-24 第二批模型子页。纯数据，只 import type(content.ts 会 import 这里，别反向 import 运行时值)。
// 事实来源:models-catalog.ts(描述)、model-facts.ts(分辨率 / 比例 / 参考图上限)、model-content.ts + pricing-live.json(积分价、套餐)、
//   model-media.ts / model-media-gen.json(真实提示词和成片)、tools/credits.ts(注册送的积分)。
// FAQ 的问题取自 search-keywords.json 里各模型的真实搜索词(price / prompt / how to use / is it free / vs)。
// 「What is X?」和价格页 / 教程页的「How much does X cost?」由模板自动带出，这里不重复写。
import type { GuideEntry } from "./content";
import { SIGNUP_CREDITS } from "../tools/credits";

const FREE_NAMES = "Seedream 4.5, Seedream 5.0 lite and Seed Audio 1.0";
/** 免费积分的统一说法(brief:只能用在这 3 个模型上，视频要付费套餐) */
const FREE_RULE = `New accounts get ${SIGNUP_CREDITS} free credits, usable only on ${FREE_NAMES}`;
const MCP = (name: string) => `Yes. Connect BuzzVideo MCP to ChatGPT or Claude and ask for ${name} in the chat. It uses your BuzzVideo credits.`;

export const IMAGE_GUIDES: GuideEntry[] = [
  /* ───────── Nano Banana Pro ───────── */
  {
    slug: "nano-banana-pro-pricing",
    kind: "pricing",
    model: "nano-banana-pro",
    h1: "Nano Banana Pro Pricing",
    lead: "Nano Banana Pro is Google's AI image model on BuzzVideo for the highest-fidelity hero visuals and text-heavy layouts, priced per image by resolution. This page lists what a Nano Banana Pro image costs on BuzzVideo, which plans include the model and how to spend less while you test ideas.",
    tips: [
      "Pick 2K over 1K. Both cost 27 credits on Nano Banana Pro, so the smaller size saves nothing.",
      "Keep 4K for the final. A 4K image costs 48 credits, against 27 credits at 1K or 2K.",
      "Test ideas on a cheaper model first. Nano Banana 2.1 starts at 7 credits and Nano Banana 2 at 14 credits for a 1K image.",
      "Attach your product photo as a reference (up to 14) so fewer images are wasted on a wrong label.",
      "Check the credit price in the generator before you press Create. It updates when you change the resolution.",
    ],
    faq: [
      { q: "What is the Nano Banana Pro price per image?", a: "On BuzzVideo, a Nano Banana Pro image costs 27 credits at 1K, 27 credits at 2K and 48 credits at 4K. The price is per image generated, and it shows before you create." },
      { q: "Is Nano Banana Pro free?", a: `No. On BuzzVideo, Nano Banana Pro is available on the Starter, Pro and Ultra plans. ${FREE_RULE}.` },
      { q: "Does a 4K Nano Banana Pro image cost more?", a: "Yes. 4K costs 48 credits per image. 1K and 2K both cost 27 credits, so 2K is the better pick for drafts." },
      { q: "Nano Banana Pro vs Nano Banana 2: which costs more?", a: "Nano Banana Pro, at every resolution. Nano Banana 2 costs 14 credits at 1K, 21 at 2K and 31 at 4K. Nano Banana Pro costs 27, 27 and 48 credits. Nano Banana Pro is BuzzVideo's pick for the highest fidelity and text-heavy layouts." },
      { q: "Nano Banana Pro vs Nano Banana 2.1: which costs more?", a: "Nano Banana Pro. A 1K image costs 7 credits on Nano Banana 2.1 and 27 credits on Nano Banana Pro. You can draft on Nano Banana 2.1 and re-run the winner on Nano Banana Pro with the same prompt." },
      { q: "Is there a Nano Banana Pro price per month?", a: "No. BuzzVideo does not charge a monthly fee for one model. Credits come with your Starter, Pro or Ultra plan, and each Nano Banana Pro image takes credits from that balance." },
      { q: "Can I use my Nano Banana Pro credits in ChatGPT or Claude?", a: MCP("Nano Banana Pro") },
      { q: "Can I use Nano Banana Pro with no login?", a: "No. You need a BuzzVideo account to generate, and sign-up is free. Nano Banana Pro itself runs on the Starter, Pro and Ultra plans." },
      { q: "Is there a Nano Banana Pro app on BuzzVideo?", a: "No separate app is needed: BuzzVideo is a web product, so you use Nano Banana Pro in your browser with nothing to install. You can also call it from ChatGPT or Claude through BuzzVideo MCP." },
      { q: "Nano Banana Pro vs GPT Image 2: which should I use?", a: "Both run on BuzzVideo. Nano Banana Pro renders at 1K, 2K or 4K in 10 aspect ratios with up to 14 reference images. GPT Image 2 uses Low, Medium and High quality levels in 6 ratios with up to 10 references." },
    ],
    related: [{ label: "Nano Banana Pro", href: "/nano-banana-pro" }, { label: "Nano Banana Pro Prompt Guide", href: "/nano-banana-pro-prompt-guide" }, { label: "Nano Banana 2", href: "/nano-banana-2" }, { label: "Nano Banana 2.1", href: "/nano-banana-2-1" }, { label: "Seedream 5.5", href: "/seedream-5-5" }, { label: "Pricing", href: "/pricing" }],
  },
  {
    slug: "nano-banana-pro-how-to-use",
    kind: "how-to",
    model: "nano-banana-pro",
    h1: "How to Use Nano Banana Pro",
    lead: "Nano Banana Pro is Google's AI image model on BuzzVideo that creates and edits images from text and up to 14 reference images, at up to 4K. This step-by-step guide shows how to open Nano Banana Pro on BuzzVideo, write the prompt, pick a resolution and aspect ratio, and check the price before you create.",
    tips: [
      "Name the ad format first, such as \"Static product ad\" or \"Creator-style beauty portrait\".",
      "Attach the product photo and write \"keep the label exactly as in the reference\".",
      "Put every word of on-image text in quotes, and say how many text items there are.",
      "Describe the pose literally: where the hands are and where the product sits.",
      "Pick the aspect ratio for the placement, then 2K for drafts and 4K for the final.",
      "Check hands, label text and product shape at full size before you use the image.",
    ],
    faq: [
      { q: "How do I use Nano Banana Pro on BuzzVideo?", a: "In BuzzVideo, choose Image and pick Nano Banana Pro in the model menu, or ask the Marketing Agent to use it. Write a prompt, add up to 14 reference images, then pick the resolution and aspect ratio. The credit price shows before you press Create." },
      { q: "How do I use Nano Banana Pro for free?", a: `You can't on BuzzVideo. Nano Banana Pro is available on the Starter, Pro and Ultra plans. ${FREE_RULE}.` },
      { q: "How do I use Nano Banana Pro in Claude or ChatGPT?", a: "Connect BuzzVideo MCP to Claude or ChatGPT, then ask for a Nano Banana Pro image in the chat. It uses your BuzzVideo credits." },
      { q: "How do I use Nano Banana Pro instead of Nano Banana 2?", a: "Pick Nano Banana Pro in the model menu before you create. The same prompt and reference images work on both models, so you can run a draft on Nano Banana 2 and the final on Nano Banana Pro." },
      { q: "What is Nano Banana Pro used for?", a: "BuzzVideo lists Nano Banana Pro for the highest-fidelity hero visuals and text-heavy layouts. It outputs at 1K, 2K and 4K in 10 aspect ratios, so one prompt can cover stories, feed posts and wide banners." },
      { q: "How many reference images can Nano Banana Pro use?", a: "Up to 14 reference images in one prompt, so a product, character or style stays the same across results." },
      { q: "What can I do with a Nano Banana Pro image after I create it?", a: "Download it, or keep editing it in Canvas on BuzzVideo." },
    ],
    related: [
      { label: "Nano Banana Pro", href: "/nano-banana-pro" },
      { label: "Nano Banana Pro Prompt Guide", href: "/nano-banana-pro-prompt-guide" },
      { label: "Nano Banana Pro Pricing", href: "/nano-banana-pro-pricing" },
      { label: "Nano Banana Pro vs Nano Banana 2", href: "/nano-banana-pro-vs-nano-banana-2" },
      { label: "AI Image Generator", href: "/ai-image-generator" },
      { label: "BuzzVideo MCP", href: "/mcp" },
    ],
  },

  /* ───────── Nano Banana 2 ───────── */
  {
    slug: "nano-banana-2-prompt-guide",
    kind: "prompt",
    model: "nano-banana-2",
    h1: "Nano Banana 2 Prompt Guide",
    lead: "Nano Banana 2 is Google's AI image model on BuzzVideo that creates and edits images from text and up to 14 reference images, at up to 4K. This guide shows how to structure a Nano Banana 2 prompt for ad creatives, from the subject and the product reference to quoted text, framing and output size.",
    anatomy: [
      { title: "Start with the format and the subject", body: "Say what the image is for and what is in it: a static product ad, a creator-style portrait, a banner. Name one product and where it sits in the frame." },
      { title: "Lock the product with references", body: "Attach your product photo (Nano Banana 2 takes up to 14 reference images) and write \"keep the label exactly the same\". Say what each reference is for." },
      { title: "Put on-image text in quotes", body: "BuzzVideo lists Nano Banana 2 for Pro-level text at Flash speed. Write each headline and label line in quotes, exactly as it should read, and say where it goes." },
      { title: "Describe setting, light and framing", body: "Give the background or room, the light and the camera framing. A plain background leaves room for a headline." },
      { title: "Pick the ratio and the resolution last", body: "Nano Banana 2 has 14 aspect ratios, from 9:16 stories to 21:9 banners, plus extreme strips such as 1:8 and 8:1. Draft at 1K, then re-run the winner at 2K or 4K with the same prompt." },
    ],
    tips: [
      "Keep one product per image unless the brief needs more.",
      "Say how many text items there are, and keep the list short.",
      "Use the same product name every time it appears in the prompt.",
      "Draft at 1K. It costs 14 credits, against 21 at 2K and 31 at 4K.",
      "Zoom to 100% and check every line of text before you use the image.",
      "Need more fidelity for a hero visual? Run the same prompt on Nano Banana Pro.",
    ],
    faq: [
      { q: "How do I write a good Nano Banana 2 prompt?", a: "Say the subject, setting, light and framing, and put any on-image text in quotes. Add your product photo as a reference (up to 14) and write \"keep the label exactly the same\"." },
      { q: "How many reference images can Nano Banana 2 use?", a: "Up to 14 reference images in one prompt, so a product, character or style stays the same across results." },
      { q: "What resolution and aspect ratios does Nano Banana 2 support?", a: "1K, 2K and 4K, in 14 aspect ratios: 1:1, 1:4, 1:8, 2:3, 3:2, 3:4, 4:1, 4:3, 4:5, 5:4, 8:1, 9:16, 16:9 and 21:9." },
      { q: "What is the Nano Banana 2 price per image?", a: "On BuzzVideo, a Nano Banana 2 image costs 14 credits at 1K, 21 credits at 2K and 31 credits at 4K. The price shows before you create." },
      { q: "Is Nano Banana 2 free?", a: `No. On BuzzVideo, Nano Banana 2 is available on the Starter, Pro and Ultra plans. ${FREE_RULE}.` },
      { q: "Nano Banana 2 vs Nano Banana Pro: which should I prompt?", a: "Use Nano Banana 2 for drafts and volume. It costs 14 credits at 1K, against 27 on Nano Banana Pro. Use Nano Banana Pro when the image is a hero visual or a text-heavy layout. Both take up to 14 reference images, so one prompt works on both." },
      { q: "Can I reuse a Nano Banana 2 prompt on Nano Banana 2.1?", a: "Yes. Both models take up to 14 reference images and share the same 14 aspect ratios on BuzzVideo, so you can run the same prompt on each and compare." },
    ],
    related: [
      { label: "Nano Banana 2", href: "/nano-banana-2" },
      { label: "How to Use Nano Banana 2", href: "/nano-banana-2-how-to-use" },
      { label: "Nano Banana 2 vs Nano Banana 2.1", href: "/nano-banana-2-vs-nano-banana-2-1" },
      { label: "Nano Banana Pro vs Nano Banana 2", href: "/nano-banana-pro-vs-nano-banana-2" },
      { label: "Nano Banana Pro Prompt Guide", href: "/nano-banana-pro-prompt-guide" },
      { label: "GPT Image vs Nano Banana", href: "/gpt-image-vs-nano-banana" },
    ],
  },
  {
    slug: "nano-banana-2-how-to-use",
    kind: "how-to",
    model: "nano-banana-2",
    h1: "How to Use Nano Banana 2",
    lead: "Nano Banana 2 is Google's AI image model on BuzzVideo that creates and edits images from text and up to 14 reference images, at up to 4K. This step-by-step guide shows how to open Nano Banana 2 on BuzzVideo, write the prompt, add references, pick a resolution and aspect ratio, and check the price first.",
    tips: [
      "Say the subject, the setting and the light in the first sentence.",
      "Attach the product photo and write \"keep the label exactly the same\".",
      "Put every word of on-image text in quotes.",
      "Pick the aspect ratio for the placement. Nano Banana 2 has 14 to choose from.",
      "Draft at 1K, then re-run the winner at 2K or 4K with the same prompt.",
      "Check label text and product shape at full size before you use the image.",
    ],
    faq: [
      { q: "How do I use Nano Banana 2 on BuzzVideo?", a: "In BuzzVideo, choose Image and pick Nano Banana 2 in the model menu, or ask the Marketing Agent to use it. Write a prompt, add up to 14 reference images, then pick the resolution and aspect ratio. The credit price shows before you press Create." },
      { q: "How do I access Nano Banana 2?", a: "Open BuzzVideo, choose Image and pick Nano Banana 2 in the model menu. It is available on the Starter, Pro and Ultra plans." },
      { q: "How do I use Nano Banana 2 for free?", a: `You can't on BuzzVideo. Nano Banana 2 is available on the Starter, Pro and Ultra plans. ${FREE_RULE}.` },
      { q: "What is Nano Banana 2 good for?", a: "BuzzVideo lists Nano Banana 2 for Pro-level text at Flash speed. It outputs at 1K, 2K and 4K in 14 aspect ratios, so it suits ad creatives with readable text in many placements." },
      { q: "How do I use Nano Banana Pro instead of Nano Banana 2?", a: "Pick Nano Banana Pro in the model menu before you create. The same prompt and reference images work on both. A 1K image costs 27 credits on Nano Banana Pro and 14 credits on Nano Banana 2." },
      { q: "Can I use Nano Banana 2 in ChatGPT or Claude?", a: MCP("Nano Banana 2") },
      { q: "What can I do with a Nano Banana 2 image after I create it?", a: "Download it, or keep editing it in Canvas on BuzzVideo." },
    ],
    related: [
      { label: "Nano Banana 2", href: "/nano-banana-2" },
      { label: "Nano Banana 2 Prompt Guide", href: "/nano-banana-2-prompt-guide" },
      { label: "Nano Banana 2 vs Nano Banana 2.1", href: "/nano-banana-2-vs-nano-banana-2-1" },
      { label: "Nano Banana Pro vs Nano Banana 2", href: "/nano-banana-pro-vs-nano-banana-2" },
      { label: "AI Image Generator", href: "/ai-image-generator" },
      { label: "BuzzVideo MCP", href: "/mcp" },
    ],
  },

  /* ───────── GPT Image 2 ───────── */
  {
    slug: "gpt-image-2-prompt-guide",
    kind: "prompt",
    model: "gpt-image-2",
    h1: "GPT Image 2 Prompt Guide",
    lead: "GPT Image 2 is OpenAI's AI image model on BuzzVideo for ad creatives with accurate in-image text, with up to 10 reference images and three quality levels. This guide shows how to structure a GPT Image 2 prompt, with real prompts from BuzzVideo and the images GPT Image 2 made from them.",
    anatomy: [
      { title: "Name the ad type and the style first", body: "Open with what the image is: \"beverage advertisement banner\", \"3D food advertisement scene\" or \"a vertical hero still in Art Nouveau style\". Three of the real prompts below start this way." },
      { title: "Describe the model, product and props separately", body: "Give each element its own line: who is in the image, what the product looks like, which props sit next to it and what the background is. The beverage banner prompt below does this as structured fields." },
      { title: "Quote every word and give it a position", body: "Write the lettering in quotes, such as \"FLEUR,\" with a small tagline. For a busy layout, list each text block with its position, such as top-left or left, and how many lines it has." },
      { title: "Point at your reference image", body: "GPT Image 2 takes up to 10 reference images. Say what the reference is for, as in \"image ads for the product from the reference image\", so the product is kept and not redesigned." },
      { title: "Set the ratio and the quality level last", body: "Pick 1:1, 3:4, 4:3, 4:5, 9:16 or 16:9, then a quality level. Test ideas at Low or Medium and re-run the winner at High with the same prompt." },
    ],
    tips: [
      "Test at Low quality first. It costs 4 credits, against 13 at Medium and 44 at High.",
      "Keep the text list short, and say how many text blocks there are.",
      "Describe light and mood in plain words, such as \"soft studio lighting\" or \"bright sunlight\".",
      "Name the style when you want one, such as a poster style or a 3D look.",
      "Zoom to 100% and check every line of text before you use the image.",
      "Need finer print or more references? Run the same prompt on GPT Image 2.5 Sunburst.",
    ],
    faq: [
      { q: "How do I write a good GPT Image 2 prompt?", a: "Say the ad type, the subject, the setting and the light, and put any on-image text in quotes with its position. Add your product photo as a reference (up to 10) and say what it is for." },
      { q: "Can GPT Image 2 write text on images?", a: "Yes. BuzzVideo lists GPT Image 2 for accurate in-image text for ad creatives. Put the exact words in quotes and check them at full size before you publish." },
      { q: "Can I write a GPT Image 2 prompt as structured fields?", a: "Yes. The beverage banner on this page was made from a prompt written as structured fields: type, visuals and layout, with each text block listed by position. Plain paragraphs work too, as the other prompts on this page show." },
      { q: "Which quality level should I use with GPT Image 2?", a: "Use Low or Medium to test ideas and High for the final. On BuzzVideo, Low costs 4 credits, Medium 13 and High 44 per image." },
      { q: "How many reference images can GPT Image 2 use?", a: "Up to 10 reference images in one prompt, so a product, character or style stays the same across results." },
      { q: "Is GPT Image 2 free?", a: `No. On BuzzVideo, GPT Image 2 is available on the Starter, Pro and Ultra plans. ${FREE_RULE}.` },
      { q: "GPT Image 2 vs GPT Image 2.5: do the same prompts work?", a: "Yes. GPT Image 2.5 Sunburst and Flare use the same six aspect ratios on BuzzVideo. They add two quality levels, X-High and Max, and take up to 16 reference images against 10." },
    ],
    related: [
      { label: "GPT Image 2", href: "/gpt-image-2" },
      { label: "How to Use GPT Image 2", href: "/gpt-image-2-how-to-use" },
      { label: "GPT Image 2 vs GPT Image 2.5", href: "/gpt-image-2-vs-gpt-image-2-5" },
      { label: "GPT Image 2.5 Prompt Guide", href: "/gpt-image-2-5-sunburst-prompt-guide" },
      { label: "GPT Image vs Nano Banana", href: "/gpt-image-vs-nano-banana" },
      { label: "AI Ad Generator", href: "/ai-ad-generator" },
    ],
  },
  {
    slug: "gpt-image-2-how-to-use",
    kind: "how-to",
    model: "gpt-image-2",
    h1: "How to Use GPT Image 2",
    lead: "GPT Image 2 is OpenAI's AI image model on BuzzVideo that creates and edits images from text and up to 10 reference images, with three quality levels. This step-by-step guide shows how to open GPT Image 2 on BuzzVideo, write the prompt, add references, pick a quality level and aspect ratio, and check the price first.",
    tips: [
      "Name the ad type first, such as \"beverage advertisement banner\".",
      "Describe the model, the product, the props and the background as separate lines.",
      "Put every word of on-image text in quotes, and say where each block goes.",
      "Attach the product photo and say what the reference is for.",
      "Test at Low quality, then re-run the winner at High with the same prompt.",
      "Check every line of text at full size before you use the image.",
    ],
    faq: [
      { q: "How do I use GPT Image 2 on BuzzVideo?", a: "In BuzzVideo, choose Image and pick GPT Image 2 in the model menu, or ask the Marketing Agent to use it. Write a prompt, add up to 10 reference images, then pick the quality level and aspect ratio. The credit price shows before you press Create." },
      { q: "How do I use GPT Image 2 for free?", a: `You can't on BuzzVideo. GPT Image 2 is available on the Starter, Pro and Ultra plans. ${FREE_RULE}.` },
      { q: "How do I use GPT Image 2 in ChatGPT or Claude?", a: "Connect BuzzVideo MCP to ChatGPT or Claude, then ask for a GPT Image 2 image in the chat. It uses your BuzzVideo credits." },
      { q: "Which quality levels and aspect ratios does GPT Image 2 have?", a: "Three quality levels, Low, Medium and High, in six aspect ratios: 1:1, 3:4, 4:3, 4:5, 9:16 and 16:9." },
      { q: "What is the GPT Image 2 price per image?", a: "On BuzzVideo, a GPT Image 2 image costs 4 credits at Low quality, 13 at Medium and 44 at High. The price shows before you create." },
      { q: "How do I use GPT Image 2.5 instead of GPT Image 2?", a: "Pick GPT Image 2.5 Sunburst or GPT Image 2.5 Flare in the model menu before you create. They use the same six aspect ratios, add the X-High and Max quality levels and take up to 16 reference images." },
      { q: "What can I do with a GPT Image 2 image after I create it?", a: "Download it, or keep editing it in Canvas on BuzzVideo." },
    ],
    related: [
      { label: "GPT Image 2", href: "/gpt-image-2" },
      { label: "GPT Image 2 Prompt Guide", href: "/gpt-image-2-prompt-guide" },
      { label: "GPT Image 2 vs GPT Image 2.5", href: "/gpt-image-2-vs-gpt-image-2-5" },
      { label: "GPT Image vs Nano Banana", href: "/gpt-image-vs-nano-banana" },
      { label: "AI Image Generator", href: "/ai-image-generator" },
      { label: "BuzzVideo MCP", href: "/mcp" },
    ],
  },

  /* ───────── Seedream 4.5(免费积分可用) ───────── */
  {
    slug: "seedream-4-5-prompt-guide",
    kind: "prompt",
    model: "seedream-4-5",
    h1: "Seedream 4.5 Prompt Guide",
    lead: "Seedream 4.5 is ByteDance's AI image model on BuzzVideo for consistent product sets with accurate text, with up to 14 reference images at 2K or 4K. This guide shows how to structure a Seedream 4.5 prompt for ad creatives, with real Seedream 4.5 images made on BuzzVideo.",
    anatomy: [
      { title: "Say what kind of graphic it is", body: "Open with the format: a static product ad with one headline, or a how-to graphic. Both formats appear in the Seedream 4.5 images below." },
      { title: "Lock the product with references", body: "Attach your product photo (Seedream 4.5 takes up to 14 reference images) and write \"keep the label exactly the same\". That is how a set of images keeps one product." },
      { title: "Put every word in quotes", body: "BuzzVideo lists Seedream 4.5 for accurate text. Write the headline in quotes, exactly as it should read, such as \"Your iced latte, sorted\"." },
      { title: "Describe setting, light and framing", body: "Give the background, the light and the camera framing, and say where the product and the text sit in the frame." },
      { title: "Pick the ratio, then go straight to 4K", body: "Choose 1:1, 2:3, 3:2, 3:4, 4:3, 9:16, 16:9 or 21:9. On BuzzVideo, 2K and 4K cost the same on Seedream 4.5, so pick the size your placement needs." },
    ],
    tips: [
      "Reuse the same product reference and product name across a set, and change only the scene.",
      "Keep one headline per image, and say where it goes.",
      "Leave empty space for the offer or logo you will add later, and say where.",
      "Say what must not appear, such as extra products or stray text.",
      "Zoom to 100% and check every line of text before you use the image.",
      "Need 3K output? Run the same prompt on Seedream 5.0 lite.",
    ],
    faq: [
      { q: "How do I write a good Seedream 4.5 prompt?", a: "Say the subject, setting, light and framing, and put any on-image text in quotes. Add your product photo as a reference (up to 14) and write \"keep the label exactly the same\"." },
      { q: "What is a good Seedream 4.5 prompt structure?", a: "Format first, then the product and its reference, then the quoted text, then setting, light and framing, and the aspect ratio and resolution last. The five steps on this page follow that order." },
      { q: "Is Seedream 4.5 free?", a: `Yes, to start. ${FREE_RULE}. Video needs the Starter, Pro or Ultra plan.` },
      { q: "What is the Seedream 4.5 price per image?", a: "On BuzzVideo, a Seedream 4.5 image costs 8 credits at 2K and 8 credits at 4K. The price shows before you create." },
      { q: "How many reference images can Seedream 4.5 use?", a: "Up to 14 reference images in one prompt, so a product, character or style stays the same across results." },
      { q: "What resolution and aspect ratios does Seedream 4.5 support?", a: "2K and 4K, in eight aspect ratios: 1:1, 2:3, 3:2, 3:4, 4:3, 9:16, 16:9 and 21:9." },
      { q: "Seedream 4.5 vs Seedream 5.0 lite: which should I prompt?", a: "Both work with the free sign-up credits and take up to 14 reference images. BuzzVideo lists Seedream 4.5 for consistent product sets with accurate text, and Seedream 5.0 lite as the budget pick for infographics and trend visuals. A 2K image costs 8 credits on Seedream 4.5 and 7 on Seedream 5.0 lite." },
      { q: "Seedream 4.5 vs Nano Banana Pro: which should I use?", a: "Seedream 4.5 is cheaper: 8 credits for a 2K image, against 27 on Nano Banana Pro. It also works with the free sign-up credits. Nano Banana Pro is BuzzVideo's pick for the highest-fidelity hero visuals and text-heavy layouts." },
    ],
    related: [
      { label: "Seedream 4.5", href: "/seedream-4-5" },
      { label: "Seedream 5.5", href: "/seedream-5-5" },
      { label: "Nano Banana Pro Prompt Guide", href: "/nano-banana-pro-prompt-guide" },
      { label: "AI Product Photography", href: "/ai-product-photography" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
];

/** 这些页的 <title> / description(meta.ts 合并进去) */
export const IMAGE_META: Record<string, { title: string; description: string }> = {
  "nano-banana-pro-pricing": {
    title: "Nano Banana Pro Pricing: Credits per Image | BuzzVideo",
    description: "Nano Banana Pro pricing on BuzzVideo: what an image costs (27 credits at 1K or 2K, 48 at 4K) on Starter, Pro and Ultra, with Nano Banana 2 and 2.1 compared.",
  },
  "nano-banana-pro-how-to-use": {
    title: "How to Use Nano Banana Pro: Step-by-Step | BuzzVideo",
    description: "Step-by-step guide to Nano Banana Pro on BuzzVideo: open the model, write the prompt, add up to 14 reference images, then pick resolution and aspect ratio.",
  },
  "nano-banana-2-prompt-guide": {
    title: "Nano Banana 2 Prompt Guide: Ad Creatives | BuzzVideo",
    description: "Write Nano Banana 2 prompts for ad creatives: format, product references, quoted text, framing, and which of 14 aspect ratios and three resolutions to pick.",
  },
  "nano-banana-2-how-to-use": {
    title: "How to Use Nano Banana 2: Step-by-Step | BuzzVideo",
    description: "Step-by-step guide to Nano Banana 2 on BuzzVideo: open the model, write the prompt, add up to 14 reference images, then pick resolution and aspect ratio.",
  },
  "gpt-image-2-prompt-guide": {
    title: "GPT Image 2 Prompt Guide: Real Examples | BuzzVideo",
    description: "How to prompt GPT Image 2 for ad creatives: ad type, product references, quoted text with positions and quality levels, with real prompts and their images.",
  },
  "gpt-image-2-how-to-use": {
    title: "How to Use GPT Image 2: Step-by-Step Guide | BuzzVideo",
    description: "Step-by-step guide to GPT Image 2 on BuzzVideo: open the model, write the prompt, add up to 10 reference images, then pick a quality level and aspect ratio.",
  },
  "seedream-4-5-prompt-guide": {
    title: "Seedream 4.5 Prompt Guide: Product Ads | BuzzVideo",
    description: "Write Seedream 4.5 prompts for product ads: format, product references, quoted headlines, framing and resolution, with real Seedream 4.5 images on BuzzVideo.",
  },
};
