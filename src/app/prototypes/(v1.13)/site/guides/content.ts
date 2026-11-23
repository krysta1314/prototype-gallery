// 模型指南 / 价格 / 教程 / 对比页的文案(2026-11-19)。纯数据，不引 React。
// 事实来源:models-catalog.ts(描述)、model-facts.ts(参数)、model-content.ts(价格)、model-media.ts(真实提示词 + 成片);
//   Kling 4.0 另用手写模型页的数据(../../model-page/model-data.ts:成片、提示词模板、教程步骤);
//   Suno / ElevenLabs 只写官网公开页上核实过的事实(2026-11-19 打开 suno.com/pricing、elevenlabs.io/pricing/api),页面上带来源和核实日期。
// 规格表、价格表、FAQ 第一条「What is X?」由模板从上面的数据带出，这里只写需要编辑判断的文字。

export type QA = { q: string; a: string };
export type Pick = { job: string; pick: string; href: string; why: string };
export type Source = { label: string; url: string };
export type RelLink = { label: string; href: string };

export type GuideEntry = {
  slug: string;
  kind: "prompt" | "pricing" | "how-to";
  /** BuzzVideo 模型 slug */
  model: string;
  h1: string;
  /** 首屏副标题:2 句、40–60 词、先定义，不写价格 */
  lead: string;
  /** 「How do you structure a … prompt?」的要点(按这个模型核实过的能力写) */
  anatomy?: { title: string; body: string }[];
  tips?: string[];
  faq: QA[];
  related: RelLink[];
};

export type ComparisonEntry = {
  slug: string;
  h1: string;
  lead: string;
  /** 规格表的列(BuzzVideo 上的模型) */
  models: string[];
  /** 不在 BuzzVideo 上的竞品列(只放核实过的公开事实) */
  external?: { name: string; values: Record<string, string> };
  /** 给 BuzzVideo 模型补的公开事实行(如 ElevenLabs 官网的语种数),带来源 */
  extraRows?: { label: string; values: Record<string, string> }[];
  /** 同一提示词两边各跑一次的成对成片(按 alt 配对) */
  pairs?: [string, string];
  verdict: string;
  picks: Pick[];
  faq: QA[];
  sources?: Source[];
  related: RelLink[];
};

const FREE_NAMES = "Seedream 4.5, Seedream 5.0 lite and Seed Audio 1.0";

/* ───────── 指南 / 价格 / 教程 ───────── */

export const GUIDES: GuideEntry[] = [
  {
    slug: "seedance-2-5-prompt-guide",
    kind: "prompt",
    model: "seedance-2-5",
    h1: "Seedance 2.5 Prompt Guide",
    lead: "Seedance 2.5 is ByteDance's flagship AI video model on BuzzVideo, built for premium ads up to 30 seconds with image, video and audio references. This guide shows how to structure a Seedance 2.5 prompt, with real prompts from BuzzVideo and the videos they produced.",
    anatomy: [
      {
        title: "Lock the product and the people first",
        body: "Open with what must not change: the product from your reference image, plus the creator's face, hair and outfit. Seedance 2.5 takes up to 30 reference images, 10 videos and 10 audio clips, so attach the real packshot and write \"use the uploaded image as the only product reference\".",
      },
      {
        title: "Set the format and the take",
        body: "State the length (4 to 30 seconds), the aspect ratio (1:1, 3:4, 4:3, 9:16, 16:9 or 21:9) and whether it is one continuous take or hard cuts. For a UGC ad, write \"one continuous take, natural smartphone footage\".",
      },
      {
        title: "Write the beats with timecodes",
        body: "Split the clip into beats such as 0–3s and 3–6s, and say what happens, where the camera goes and the exact dialogue in quotes. The real prompts below run from five beats in 15 seconds to nine beats in 30 seconds.",
      },
      {
        title: "Direct the sound",
        body: "Seedance 2.5 generates native audio, and you can switch it off. If you keep it, name the music, ambience and voice, or write \"No voiceover\" so nothing extra appears.",
      },
      {
        title: "End with an avoid list",
        body: "List what must not happen: no second product, no face or outfit change, no warped hands, no subtitles, logos or watermarks. Every Seedance 2.5 prompt on this page ends this way.",
      },
    ],
    tips: [
      "Only put on-screen text in the prompt if you want it in the picture, and write it as named lines (Main:, Tags:).",
      "Describe physical actions step by step (wet hands, rub, foam, rinse) so the product behaves like the real thing.",
      "Draft a short 480p version first, then re-run the keeper at 1080p with the same prompt.",
      "Keep the product name identical every time it appears in the prompt.",
    ],
    faq: [
      { q: "How long should a Seedance 2.5 prompt be?", a: "As long as the video needs. The Seedance 2.5 prompts on this page range from a short paragraph that animates a poster to a beat-by-beat script for a 30-second one-take UGC ad. Longer clips need more beats, not more adjectives." },
      { q: "Can I use reference images with Seedance 2.5?", a: "Yes. Seedance 2.5 on BuzzVideo accepts up to 30 reference images, 10 videos and 10 audio clips. Say what each reference is for, such as the product, the creator or the poster to animate." },
      { q: "Should I write dialogue in a Seedance 2.5 prompt?", a: "Yes, if someone should speak. Put the exact lines in quotes inside the beat where they are said, as the UGC prompts on this page do. Seedance 2.5 generates the audio together with the picture." },
      { q: "Can I turn off sound in Seedance 2.5?", a: "Yes. Native audio is optional for Seedance 2.5 on BuzzVideo, so you can generate silent footage and add your own voiceover and music." },
      { q: "Which plan do I need for Seedance 2.5?", a: `Seedance 2.5 is available on the Pro and Ultra plans. The free sign-up credits work only on ${FREE_NAMES}.` },
    ],
    related: [
      { label: "Seedance 2.5", href: "/models/seedance" },
      { label: "Seedance 2.5 Pricing", href: "/seedance-2-5-pricing" },
      { label: "Seedance 2.5 vs Kling 4.0", href: "/seedance-2-5-vs-kling-4-0" },
      { label: "Seedance 2.5 vs Seedance 2.0", href: "/seedance-2-5-vs-seedance-2-0" },
      { label: "Seedance 2.5 vs Wan 3.0", href: "/seedance-2-5-vs-wan-3-0" },
      { label: "Kling 4.0 Prompt Guide", href: "/kling-4-0-prompt-guide" },
    ],
  },
  {
    slug: "kling-4-0-prompt-guide",
    kind: "prompt",
    model: "kling-4-0",
    h1: "Kling 4.0 Prompt Guide",
    lead: "Kling 4.0 is Kuaishou's AI video model on BuzzVideo that generates one continuous 3 to 30 second clip with native sound. This guide shows how to write Kling 4.0 prompts for one-take UGC ads, product demos and story ads, with a reusable template and real Kling 4.0 videos.",
    anatomy: [
      {
        title: "Describe the character once, in detail",
        body: "Write the person at the top, with age, hair and outfit, and add \"keep identical for the full clip\". Kling 4.0 makes one continuous take, so the face has to hold for up to 30 seconds.",
      },
      {
        title: "Split the take into timecoded beats",
        body: "Use beats like 0–4 s, 4–11 s and 11–15 s, and say what happens in each. That keeps a mini story inside a single clip without a cut.",
      },
      {
        title: "Write the exact dialogue",
        body: "Kling 4.0 always generates sound on BuzzVideo, so put the spoken lines in quotes. For a 30-second take, write about 70 to 80 spoken words and time them out loud first.",
      },
      {
        title: "Attach references for the product",
        body: "Add up to 10 reference images and 5 short videos so the packaging, product and character match what you sell.",
      },
      {
        title: "Leave prices and dates out of the picture",
        body: "Add prices, dates and offers as text when you edit, so you can reuse the same clip after the offer changes.",
      },
    ],
    tips: [
      "Spell unusual brand names phonetically in the dialogue line.",
      "Run the opening beat as a 5-second 720p draft before you pay for the full take.",
      "Choose 9:16 for social and 16:9 for YouTube; Auto, 1:1 and 21:9 are also available.",
      "Keep one product in frame and say \"keep the label readable and unchanged\".",
    ],
    faq: [
      { q: "How long can a Kling 4.0 video be?", a: "Between 3 and 30 seconds per generation on BuzzVideo, at 720p or 1080p. Longer clips cost more credits, and the price shows before you create." },
      { q: "How many words of dialogue fit in a Kling 4.0 clip?", a: "About 70 to 80 spoken words fit a 30-second take. Read the script out loud with a timer before you generate, and cut words rather than speeding up the speech." },
      { q: "Can I turn off sound in Kling 4.0?", a: "No. Kling 4.0 always generates an audio track on BuzzVideo. Mute or replace it when you edit if you need silent footage." },
      { q: "How many reference images does Kling 4.0 take?", a: "Up to 10 reference images and 5 reference videos in one prompt, so the product and character stay the same for the whole clip." },
      { q: "Which plan do I need for Kling 4.0?", a: `Kling 4.0 is available on the Starter, Pro and Ultra plans. The free sign-up credits work only on ${FREE_NAMES}.` },
    ],
    related: [
      { label: "Kling 4.0", href: "/kling-4-0" },
      { label: "How to Use Kling 4.0", href: "/kling-4-0-how-to-use" },
      { label: "Seedance 2.5 vs Kling 4.0", href: "/seedance-2-5-vs-kling-4-0" },
      { label: "Seedance 2.5 Prompt Guide", href: "/seedance-2-5-prompt-guide" },
      { label: "AI UGC Video Generator", href: "/ai-ugc-video-generator" },
    ],
  },
  {
    slug: "gpt-image-2-5-sunburst-prompt-guide",
    kind: "prompt",
    model: "gpt-image-2-5-sunburst",
    h1: "GPT Image 2.5 Sunburst Prompt Guide",
    lead: "GPT Image 2.5 Sunburst is OpenAI's AI image model on BuzzVideo for fine print, product labels and detailed portraits, with up to 16 reference images. This guide shows how to structure a Sunburst prompt for ad creatives and which quality level to pick, with real Sunburst images made on BuzzVideo.",
    anatomy: [
      { title: "Start with the ad format and the subject", body: "Say what the image is for and what is in it: a top-down flat-lay, a candid phone photo, a packshot. Name one product and where it sits in the frame." },
      { title: "Lock the product with references", body: "Attach your product photo (Sunburst takes up to 16 reference images) and write \"keep the label exactly the same\" so the packaging is not redesigned." },
      { title: "Put every word in quotes", body: "Sunburst is BuzzVideo's pick for fine print and labels. Write each headline, label line or ingredient list in quotes, exactly as it should read." },
      { title: "Describe light, setting and framing", body: "Give the background color or room, the light (window light, hard flash, sunset) and the camera framing. Pick the ratio you will run: 1:1, 3:4, 4:3, 4:5, 9:16 or 16:9." },
      { title: "Choose the quality level last", body: "Sunburst has five quality levels: Low, Medium, High, X-High and Max. Test ideas at Low or Medium, then re-run the winner at X-High or Max with the same prompt." },
    ],
    tips: [
      "Say what must not appear (extra products, stray text, extra fingers); that is where most rejects come from.",
      "Leave empty space where your headline and offer will go, and say where.",
      "Zoom to 100% and check every line of text before you use the image.",
      "Need speed for a big batch of concepts? Run the same prompt on GPT Image 2.5 Flare.",
    ],
    faq: [
      { q: "Can GPT Image 2.5 Sunburst write text on images?", a: "Yes. BuzzVideo lists Sunburst for fine print and labels. Put the exact words in quotes and check them at full size before you publish." },
      { q: "Which quality level should I use with Sunburst?", a: "Use Low or Medium to test ideas, then X-High or Max for the final. Higher quality levels cost more credits, and the price shows before you create." },
      { q: "How many reference images can GPT Image 2.5 Sunburst use?", a: "Up to 16 reference images in one prompt, so your product, label and style stay the same across a set." },
      { q: "What is the difference between GPT Image 2.5 Sunburst and Flare?", a: "They share the same quality levels, ratios and credit prices on BuzzVideo. Sunburst is meant for fine print, labels and detailed portraits; Flare for fast photoreal product shots in bulk." },
      { q: "Which plan do I need for GPT Image 2.5 Sunburst?", a: `It is available on the Starter, Pro and Ultra plans. The free sign-up credits work only on ${FREE_NAMES}.` },
    ],
    related: [
      { label: "GPT Image 2.5 Sunburst", href: "/gpt-image-2-5-sunburst" },
      { label: "GPT Image 2.5 Sunburst vs Flare", href: "/gpt-image-2-5-sunburst-vs-flare" },
      { label: "GPT Image vs Nano Banana", href: "/gpt-image-vs-nano-banana" },
      { label: "Nano Banana Pro Prompt Guide", href: "/nano-banana-pro-prompt-guide" },
      { label: "AI Product Photography", href: "/ai-product-photography" },
    ],
  },
  {
    slug: "nano-banana-pro-prompt-guide",
    kind: "prompt",
    model: "nano-banana-pro",
    h1: "Nano Banana Pro Prompt Guide",
    lead: "Nano Banana Pro is Google's AI image model on BuzzVideo for the highest-fidelity hero visuals and text-heavy layouts, with up to 14 reference images. This guide shows how to structure a Nano Banana Pro prompt for product ads, with three real prompts and the images Nano Banana Pro made from them.",
    anatomy: [
      { title: "Name the ad format first", body: "Open with what the image is: \"Static product ad\", \"Creator-style beauty portrait\" or \"Surreal giant-product ad\". The three real prompts below all start this way." },
      { title: "Lock the product to your reference", body: "Attach the product photo (up to 14 references) and say \"keep the label exactly as in the reference\" or \"label readable\"." },
      { title: "Quote every word of on-image text", body: "Write the headline and each chip in quotes, such as the headline \"Glow, bottled.\" and three chips. Say how many text items there are." },
      { title: "Spell out the pose", body: "Be literal about hands and placement: \"holds the bottle beside her cheek, face fully visible\" leaves less to chance than \"holding the product\"." },
      { title: "Give light, lens and size", body: "Add the light and look (hard flash, natural daylight, 35mm photo look), then pick 1K, 2K or 4K and one of 10 aspect ratios, from 9:16 to 21:9." },
    ],
    tips: [
      "Keep one product per image unless the brief needs more.",
      "Use a plain colored background for static ads so the text has room.",
      "Run the same prompt on Nano Banana 2.1 when you need a cheaper first pass.",
      "Check hands, label text and product shape at full size.",
    ],
    faq: [
      { q: "How do I get accurate text with Nano Banana Pro?", a: "Put every word in quotes, say how many text items there are and where they go, and keep the list short. Then check the result at full size." },
      { q: "How many reference images can Nano Banana Pro use?", a: "Up to 14 reference images in one prompt, so your product and characters stay the same across a set." },
      { q: "What resolution does Nano Banana Pro support?", a: "1K, 2K and 4K, in 10 aspect ratios: 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9 and 21:9." },
      { q: "Were these prompts also tested on other models?", a: "Yes. The same three prompts were run on Nano Banana 2.1 on BuzzVideo for a side-by-side test, so you can reuse them on either model." },
      { q: "Which plan do I need for Nano Banana Pro?", a: `It is available on the Starter, Pro and Ultra plans. The free sign-up credits work only on ${FREE_NAMES}.` },
    ],
    related: [
      { label: "Nano Banana Pro", href: "/nano-banana-pro" },
      { label: "Nano Banana Pro vs Nano Banana 2", href: "/nano-banana-pro-vs-nano-banana-2" },
      { label: "GPT Image vs Nano Banana", href: "/gpt-image-vs-nano-banana" },
      { label: "Nano Banana 2.1", href: "/nano-banana-2-1" },
      { label: "GPT Image 2.5 Prompt Guide", href: "/gpt-image-2-5-sunburst-prompt-guide" },
    ],
  },
  {
    slug: "seedance-2-5-pricing",
    kind: "pricing",
    model: "seedance-2-5",
    h1: "Seedance 2.5 Pricing",
    lead: "Seedance 2.5 is ByteDance's flagship AI video model on BuzzVideo, priced in credits per clip by length and resolution. This page lists what Seedance 2.5 clips cost on BuzzVideo, which plans include the model and how to keep credit spend low while you test ideas.",
    tips: [
      "Draft at 480p and the shortest length that shows the idea, then re-run the keeper at 1080p with the same prompt.",
      "Lock the product and character with reference images so fewer takes go to waste.",
      "Test many hooks on a cheaper model, such as Seedance 2.5 Flash or Wan 3.0, and save Seedance 2.5 for the final.",
      "Check the credit price in the generator before you press Create; it updates as you change length and resolution.",
    ],
    faq: [
      { q: "Is Seedance 2.5 free?", a: `No. Seedance 2.5 is available on the Pro and Ultra plans. New accounts get free credits, but they work only on ${FREE_NAMES}.` },
      { q: "Does a longer Seedance 2.5 clip cost more?", a: "Yes. The price grows with length and resolution, as the table on this page shows. A 30-second 1080p clip is the most expensive setting." },
      { q: "Where do I see the exact price before I create?", a: "In the BuzzVideo generator. The credit price shows next to the Create button and updates when you change length or resolution." },
      { q: "Is Seedance 2.5 more expensive than Seedance 2.0?", a: "Yes, at the same length and resolution. In exchange, Seedance 2.5 makes clips up to 30 seconds and takes more references. The comparison table on this page shows both." },
      { q: "Can I use Seedance 2.5 credits in ChatGPT or Claude?", a: "Yes. Connect BuzzVideo MCP to ChatGPT or Claude and ask for Seedance 2.5 in the chat; it uses the same BuzzVideo credits." },
    ],
    related: [
      { label: "Seedance 2.5", href: "/models/seedance" },
      { label: "Seedance 2.5 Prompt Guide", href: "/seedance-2-5-prompt-guide" },
      { label: "Seedance 2.5 vs Seedance 2.0", href: "/seedance-2-5-vs-seedance-2-0" },
      { label: "Seedance 2.5 Flash", href: "/seedance-2-5-flash" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    slug: "kling-4-0-how-to-use",
    kind: "how-to",
    model: "kling-4-0",
    h1: "How to Use Kling 4.0",
    lead: "Kling 4.0 is Kuaishou's AI video model on BuzzVideo that turns a prompt and reference images into one continuous 3 to 30 second clip with native sound. This step-by-step guide shows how to open Kling 4.0 on BuzzVideo, write the take, pick settings and draft before you render the full clip.",
    faq: [
      { q: "When was Kling 4.0 released?", a: "Kuaishou opened a limited Kling 4.0 Flash preview on September 28, 2026, and released the full Kling 4.0 globally in October 2026. It is live on BuzzVideo now." },
      { q: "How long can a Kling 4.0 video be?", a: "Between 3 and 30 seconds per generation. On BuzzVideo you can pick any whole second in that range, at 720p or 1080p." },
      { q: "Can I turn off sound in Kling 4.0?", a: "No. Kling 4.0 always generates an audio track on BuzzVideo. Mute or replace it when you edit if you need silent footage." },
      { q: "Is Kling 4.0 free?", a: `Not on the Free plan. Kling 4.0 starts on the Starter plan. New accounts get free credits that work only on ${FREE_NAMES}.` },
      { q: "Can I use Kling 4.0 inside ChatGPT or Claude?", a: "Yes. Connect BuzzVideo MCP to ChatGPT or Claude and ask for a Kling 4.0 video in the chat; it uses your BuzzVideo credits." },
    ],
    related: [
      { label: "Kling 4.0", href: "/kling-4-0" },
      { label: "Kling 4.0 Prompt Guide", href: "/kling-4-0-prompt-guide" },
      { label: "Seedance 2.5 vs Kling 4.0", href: "/seedance-2-5-vs-kling-4-0" },
      { label: "AI Video Generator", href: "/ai-video-generator" },
      { label: "AI UGC Video Generator", href: "/ai-ugc-video-generator" },
    ],
  },
];

/* ───────── 对比页 ───────── */

const SUNO_SRC: Source = { label: "Suno pricing page", url: "https://suno.com/pricing" };
const ELEVEN_SRC: Source = { label: "ElevenLabs API pricing page", url: "https://elevenlabs.io/pricing/api" };

export const COMPARISONS: ComparisonEntry[] = [
  {
    slug: "seedance-2-5-vs-kling-4-0",
    h1: "Seedance 2.5 vs Kling 4.0",
    lead: "Seedance 2.5 and Kling 4.0 are AI video models on BuzzVideo, from ByteDance and Kuaishou, that both make clips up to 30 seconds with native sound. This comparison puts their specs, credit prices and real BuzzVideo results side by side, and shows which one to pick for each kind of ad.",
    models: ["seedance-2-5", "kling-4-0"],
    verdict:
      "Pick Seedance 2.5 when one shot carries heavy reference work: it takes up to 30 reference images, 10 videos and 10 audio clips, drafts at 480p and lets you switch sound off. Pick Kling 4.0 for long one-take UGC and demos on a budget: at the same length and 1080p it costs less than half the credits, and it runs on the Starter plan.",
    picks: [
      { job: "Hero ad with many product angles and a fixed look", pick: "Seedance 2.5", href: "/models/seedance", why: "Up to 30 reference images, 10 videos and 10 audio clips, against 10 images and 5 videos for Kling 4.0." },
      { job: "20–30 second one-take UGC testimonial", pick: "Kling 4.0", href: "/kling-4-0", why: "One continuous 3–30 s take with native sound, for less than half the credits of Seedance 2.5 at 1080p." },
      { job: "Silent b-roll for your own voiceover", pick: "Seedance 2.5", href: "/models/seedance", why: "Native audio can be switched off. Kling 4.0 always generates sound on BuzzVideo." },
      { job: "Matching a voice or music reference", pick: "Seedance 2.5", href: "/models/seedance", why: "Accepts up to 10 audio references; Kling 4.0 takes image and video references only." },
      { job: "Cheap first drafts", pick: "Seedance 2.5 at 480p", href: "/seedance-2-5-pricing", why: "Seedance 2.5 starts at 480p. Kling 4.0's lowest setting is 720p." },
      { job: "You are on the Starter plan", pick: "Kling 4.0", href: "/kling-4-0", why: "Kling 4.0 runs on Starter, Pro and Ultra. Seedance 2.5 needs Pro or Ultra." },
    ],
    faq: [
      { q: "Is Seedance 2.5 better than Kling 4.0?", a: "It depends on the ad. Seedance 2.5 is BuzzVideo's flagship for premium ads with heavy reference use; Kling 4.0 is the better value for long one-take UGC and demo clips with sound." },
      { q: "Which is cheaper, Seedance 2.5 or Kling 4.0?", a: "Kling 4.0, at the same length and resolution. At 1080p it costs less than half the credits of Seedance 2.5; the price table on this page lists both." },
      { q: "Can both models make 30-second videos?", a: "Yes. Seedance 2.5 makes 4–30 second clips and Kling 4.0 makes 3–30 second clips in one generation." },
      { q: "Which one supports more reference images?", a: "Seedance 2.5, with up to 30 images, 10 videos and 10 audio clips. Kling 4.0 takes up to 10 images and 5 videos." },
      { q: "Can I turn off the sound?", a: "In Seedance 2.5, yes. Kling 4.0 always generates sound on BuzzVideo; mute it when you edit." },
    ],
    related: [
      { label: "Seedance 2.5 Prompt Guide", href: "/seedance-2-5-prompt-guide" },
      { label: "Kling 4.0 Prompt Guide", href: "/kling-4-0-prompt-guide" },
      { label: "Seedance 2.5 Pricing", href: "/seedance-2-5-pricing" },
      { label: "Seedance 2.5 vs Wan 3.0", href: "/seedance-2-5-vs-wan-3-0" },
      { label: "Seedance 2.5 vs Seedance 2.0", href: "/seedance-2-5-vs-seedance-2-0" },
    ],
  },
  {
    slug: "seedance-2-5-vs-seedance-2-0",
    h1: "Seedance 2.5 vs Seedance 2.0",
    lead: "Seedance 2.5 and Seedance 2.0 are ByteDance AI video models on BuzzVideo, and Seedance 2.5 is the newer flagship for premium ads up to 30 seconds. This comparison sets their specs, credit prices and real BuzzVideo results side by side, so you can decide when the upgrade is worth the extra credits.",
    models: ["seedance-2-5", "seedance-2-0"],
    verdict:
      "Seedance 2.5 doubles the maximum length to 30 seconds and takes far more references: 30 images, 10 videos and 10 audio clips against 9, 3 and 3. Seedance 2.0 is the pick when you need a 4K master or a lower price per clip: at 480p it costs about two thirds of Seedance 2.5.",
    picks: [
      { job: "Clips longer than 15 seconds", pick: "Seedance 2.5", href: "/models/seedance", why: "Up to 30 seconds in one generation; Seedance 2.0 stops at 15." },
      { job: "4K master for a landing page or YouTube", pick: "Seedance 2.0", href: "/seedance-2-0", why: "Seedance 2.0 renders up to 4K; Seedance 2.5 tops out at 1080p." },
      { job: "Many product angles, characters or audio references", pick: "Seedance 2.5", href: "/models/seedance", why: "More than three times the reference images, videos and audio clips." },
      { job: "15-second UGC ad with one or two references", pick: "Seedance 2.0", href: "/seedance-2-0", why: "Enough references for the job, at a lower price per clip." },
      { job: "Quick, cheaper Seedance clips in volume", pick: "Seedance 2.0 Fast", href: "/seedance-2-0-fast", why: "About 20% cheaper than Seedance 2.0 for quick product and scenery clips." },
    ],
    faq: [
      { q: "What is the difference between Seedance 2.5 and 2.0?", a: "Seedance 2.5 makes clips up to 30 seconds and takes up to 30 images, 10 videos and 10 audio clips as references. Seedance 2.0 makes clips up to 15 seconds, takes 9 images, 3 videos and 3 audio clips, and can render in 4K." },
      { q: "Is Seedance 2.5 more expensive than Seedance 2.0?", a: "Yes. At the same length at 480p, Seedance 2.0 costs about two thirds of Seedance 2.5. The price table on this page lists both." },
      { q: "Can Seedance 2.5 make 4K video?", a: "No. Seedance 2.5 outputs 480p, 720p and 1080p on BuzzVideo. Use Seedance 2.0 when you need 4K." },
      { q: "Do I need a different plan for Seedance 2.5?", a: "No. Both Seedance 2.5 and Seedance 2.0 are available on the Pro and Ultra plans." },
      { q: "Can I reuse my Seedance 2.0 prompts on Seedance 2.5?", a: "Yes. Both models read beat-by-beat prompts with product and character locks, as the examples on this page show. Run the same prompt on both and compare." },
    ],
    related: [
      { label: "Seedance 2.5 Prompt Guide", href: "/seedance-2-5-prompt-guide" },
      { label: "Seedance 2.5 Pricing", href: "/seedance-2-5-pricing" },
      { label: "Seedance 2.5 vs Kling 4.0", href: "/seedance-2-5-vs-kling-4-0" },
      { label: "Seedance 2.0 Mini", href: "/seedance-2-0-mini" },
      { label: "Seedance 2.5 Flash", href: "/seedance-2-5-flash" },
    ],
  },
  {
    slug: "seedance-2-5-vs-wan-3-0",
    h1: "Seedance 2.5 vs Wan 3.0",
    lead: "Seedance 2.5 and Wan 3.0 are AI video models on BuzzVideo, from ByteDance and Alibaba, that both make single clips up to 30 seconds with optional native audio. This comparison sets their specs, credit prices and real BuzzVideo results side by side, and shows which one fits each kind of ad.",
    models: ["seedance-2-5", "wan-3-0"],
    verdict:
      "Both run up to 30 seconds at up to 1080p, with sound you can switch off. At 1080p, Wan 3.0 costs about a third of Seedance 2.5's credits for the same length and runs on the Starter plan, so it suits long demos and volume. Seedance 2.5 takes three times the reference images (30 against 10) for premium hero ads.",
    picks: [
      { job: "Premium hero ad with many references", pick: "Seedance 2.5", href: "/models/seedance", why: "Up to 30 images, 10 videos and 10 audio clips as references." },
      { job: "30-second product demo on a budget", pick: "Wan 3.0", href: "/wan-3-0", why: "Same 30-second ceiling for about a third of the credits at 1080p." },
      { job: "Building a video from a product page or doc", pick: "Wan 3.0", href: "/wan-3-0", why: "Wan 3.0 reads web pages and documents you add as a URL or Doc reference." },
      { job: "Very short bumpers", pick: "Wan 3.0", href: "/wan-3-0", why: "Clips start at 2 seconds; Seedance 2.5 starts at 4." },
      { job: "You are on the Starter plan", pick: "Wan 3.0", href: "/wan-3-0", why: "Wan 3.0 runs on Starter, Pro and Ultra. Seedance 2.5 needs Pro or Ultra." },
    ],
    faq: [
      { q: "Which is cheaper, Seedance 2.5 or Wan 3.0?", a: "Wan 3.0. At 1080p it costs about a third of Seedance 2.5's credits for the same length, and about half at 480p. The price table on this page lists both." },
      { q: "Can both make 30-second videos?", a: "Yes. Seedance 2.5 makes 4–30 second clips and Wan 3.0 makes 2–30 second clips, both at up to 1080p." },
      { q: "Do both models generate sound?", a: "Yes. Both generate native audio, and on both you can switch it off." },
      { q: "Which one takes more references?", a: "Seedance 2.5, with up to 30 images, 10 videos and 10 audio clips. Wan 3.0 takes up to 10 images, 5 videos and 5 audio clips, plus web pages and documents." },
      { q: "Which plan do I need?", a: "Wan 3.0 is on Starter, Pro and Ultra. Seedance 2.5 is on Pro and Ultra." },
    ],
    related: [
      { label: "Wan 3.0", href: "/wan-3-0" },
      { label: "Wan 3.0 Prime", href: "/wan-3-0-prime" },
      { label: "Seedance 2.5 Prompt Guide", href: "/seedance-2-5-prompt-guide" },
      { label: "Seedance 2.5 vs Kling 4.0", href: "/seedance-2-5-vs-kling-4-0" },
      { label: "Seedance 2.5 Pricing", href: "/seedance-2-5-pricing" },
    ],
  },
  {
    slug: "nano-banana-pro-vs-nano-banana-2",
    h1: "Nano Banana Pro vs Nano Banana 2",
    lead: "Nano Banana Pro and Nano Banana 2 are Google AI image models on BuzzVideo: Pro aims at the highest fidelity for hero and text-heavy layouts, while Nano Banana 2 brings Pro-level text at Flash speed. This comparison sets their specs, credit prices and real results side by side, and shows which to pick for each ad.",
    models: ["nano-banana-pro", "nano-banana-2", "nano-banana-2-1"],
    verdict:
      "Both take up to 14 reference images and output at 1K, 2K or 4K. Nano Banana 2 costs less at every resolution and adds extreme banner ratios (1:4, 1:8, 4:1 and 8:1); Nano Banana Pro is the pick for hero visuals and text-heavy layouts where fidelity matters most. Nano Banana 2.1, the newer all-rounder, is cheaper than both.",
    picks: [
      { job: "Hero visual or text-heavy static ad", pick: "Nano Banana Pro", href: "/nano-banana-pro", why: "BuzzVideo's highest-fidelity Nano Banana for hero and text-heavy layouts." },
      { job: "Ultra-wide or ultra-tall banners", pick: "Nano Banana 2", href: "/nano-banana-2", why: "Supports 1:4, 1:8, 4:1 and 8:1 on top of the standard ratios." },
      { job: "Many variations on a budget", pick: "Nano Banana 2.1", href: "/nano-banana-2-1", why: "The lowest credit price of the three at every resolution." },
      { job: "4K output for print", pick: "Any of the three", href: "/nano-banana-pro", why: "All three render at 1K, 2K and 4K." },
    ],
    faq: [
      { q: "What is the difference between Nano Banana Pro and Nano Banana 2?", a: "Nano Banana Pro aims at the highest fidelity for hero and text-heavy layouts. Nano Banana 2 brings Pro-level text at Flash speed, costs fewer credits and supports more aspect ratios. Both take up to 14 reference images." },
      { q: "Is Nano Banana 2 cheaper than Nano Banana Pro?", a: "Yes, at 1K, 2K and 4K. The price table on this page lists both, plus Nano Banana 2.1." },
      { q: "Which aspect ratios does each model support?", a: "Nano Banana Pro supports 10 ratios from 9:16 to 21:9. Nano Banana 2 supports 14, including 1:4, 1:8, 4:1 and 8:1." },
      { q: "Where does Nano Banana 2.1 fit?", a: "Nano Banana 2.1 is BuzzVideo's fast all-rounder with sharp text and consistent characters. It costs the least of the three and has the same 14 reference images and 1K to 4K output." },
      { q: "Can I run the same prompt on both?", a: "Yes. Pick a different model in the menu next to the prompt and generate again; the credit price shows before you create." },
    ],
    related: [
      { label: "Nano Banana Pro Prompt Guide", href: "/nano-banana-pro-prompt-guide" },
      { label: "GPT Image vs Nano Banana", href: "/gpt-image-vs-nano-banana" },
      { label: "Nano Banana Pro", href: "/nano-banana-pro" },
      { label: "Nano Banana 2", href: "/nano-banana-2" },
      { label: "Nano Banana 2 Lite", href: "/nano-banana-2-lite" },
    ],
  },
  {
    slug: "gpt-image-vs-nano-banana",
    h1: "GPT Image vs Nano Banana",
    lead: "GPT Image and Nano Banana are the AI image model families from OpenAI and Google, and BuzzVideo runs current versions of both on one account. This comparison sets GPT Image 2.5 and GPT Image 2 against Nano Banana 2.1, Pro and 2 by specs, credit price and real results, and shows which to pick for each ad.",
    models: ["gpt-image-2-5-sunburst", "gpt-image-2-5-flare", "gpt-image-2", "nano-banana-2-1", "nano-banana-pro", "nano-banana-2"],
    verdict:
      "GPT Image 2.5 takes the most references (16) and has the cheapest drafts at its Low quality level, and BuzzVideo lists Sunburst for fine print and labels. Nano Banana renders at fixed pixel sizes up to 4K, covers more aspect ratios (up to 14, including 8:1 banners), and Nano Banana 2.1 is the fast all-rounder for sharp text and consistent characters.",
    picks: [
      { job: "Packshots with labels and fine print", pick: "GPT Image 2.5 Sunburst", href: "/gpt-image-2-5-sunburst", why: "BuzzVideo's pick for fine print, labels and detailed portraits." },
      { job: "Photoreal product shots in bulk", pick: "GPT Image 2.5 Flare", href: "/gpt-image-2-5-flare", why: "The fast GPT Image 2.5 tier, at the same credit price as Sunburst." },
      { job: "Consistent characters across a set", pick: "Nano Banana 2.1", href: "/nano-banana-2-1", why: "Fast all-rounder with sharp text and consistent characters, up to 14 references." },
      { job: "Banners in extreme ratios", pick: "Nano Banana 2 or 2.1", href: "/nano-banana-2", why: "Ratios from 1:8 to 8:1; GPT Image covers six standard ratios." },
      { job: "4K pixels for print or big screens", pick: "Nano Banana Pro", href: "/nano-banana-pro", why: "Fixed 1K, 2K and 4K output; GPT Image uses quality levels instead of pixel sizes." },
      { job: "Testing dozens of concepts cheaply", pick: "GPT Image 2.5 at Low", href: "/gpt-image-2-5-flare", why: "The lowest credit price among the models on this page; re-run the winner at a higher level." },
    ],
    faq: [
      { q: "Is GPT Image or Nano Banana better for ads?", a: "Neither wins every job. GPT Image 2.5 Sunburst is BuzzVideo's pick for fine print and labels; Nano Banana 2.1 for fast, consistent characters; Nano Banana Pro for high-fidelity hero visuals. Run the same prompt on two models before you standardize." },
      { q: "Which family takes more reference images?", a: "GPT Image 2.5, with up to 16. Nano Banana 2.1, Pro and 2 take up to 14; GPT Image 2 takes up to 10." },
      { q: "Which is cheaper?", a: "At their lowest settings, GPT Image 2.5 is cheaper per image than any Nano Banana model on this page. The price table lists every level." },
      { q: "What is coming next for GPT Image on BuzzVideo?", a: "GPT Image 2.6 Sunburst and Flare arrive in the next BuzzVideo release, with transparent backgrounds and SVG output." },
      { q: "Can I use both on one BuzzVideo account?", a: "Yes. Every model on this page runs on the same BuzzVideo account and credits; switch models in the menu next to the prompt." },
    ],
    related: [
      { label: "GPT Image 2.5 Prompt Guide", href: "/gpt-image-2-5-sunburst-prompt-guide" },
      { label: "Nano Banana Pro Prompt Guide", href: "/nano-banana-pro-prompt-guide" },
      { label: "GPT Image 2.5 Sunburst vs Flare", href: "/gpt-image-2-5-sunburst-vs-flare" },
      { label: "Nano Banana Pro vs Nano Banana 2", href: "/nano-banana-pro-vs-nano-banana-2" },
      { label: "GPT Image 2.6 Sunburst", href: "/gpt-image-2-6-sunburst" },
    ],
  },
  {
    slug: "gpt-image-2-5-sunburst-vs-flare",
    h1: "GPT Image 2.5 Sunburst vs Flare",
    lead: "GPT Image 2.5 Sunburst and GPT Image 2.5 Flare are the two tiers of OpenAI's GPT Image 2.5 model on BuzzVideo: Sunburst for fine print, labels and detailed portraits, Flare for fast photoreal product shots in bulk. This comparison shows their specs, credit prices and the same prompts run on both.",
    models: ["gpt-image-2-5-sunburst", "gpt-image-2-5-flare"],
    pairs: ["gpt-image-2-5-sunburst", "gpt-image-2-5-flare"],
    verdict:
      "On BuzzVideo the two tiers share the same specs (five quality levels from Low to Max, six aspect ratios and up to 16 reference images) and cost the same credits at every quality level. So pick by the job: Sunburst for packshots and anything with readable text, Flare for fast product and lifestyle shots in volume.",
    picks: [
      { job: "Testing 10–30 ad concepts", pick: "Flare, Low or Medium", href: "/gpt-image-2-5-flare", why: "The fast tier; at low quality levels you only need to see the idea." },
      { job: "Packshot with an ingredients list or small print", pick: "Sunburst", href: "/gpt-image-2-5-sunburst", why: "BuzzVideo's pick for fine print and labels." },
      { job: "Detailed portrait for a hero image", pick: "Sunburst", href: "/gpt-image-2-5-sunburst", why: "Listed for detailed portraits." },
      { job: "Photoreal product shots in bulk", pick: "Flare", href: "/gpt-image-2-5-flare", why: "Built for fast photoreal product shots in volume." },
    ],
    faq: [
      { q: "What is the difference between GPT Image 2.5 Sunburst and Flare?", a: "They are two tiers of the same OpenAI model. Sunburst is meant for fine print, labels and detailed portraits; Flare for fast photoreal product shots in bulk. On BuzzVideo they share the same settings and credit prices." },
      { q: "Does Sunburst cost more than Flare?", a: "No. On BuzzVideo both cost the same credits at every quality level, from Low to Max." },
      { q: "Do Sunburst and Flare support the same sizes?", a: "Yes. Both have five quality levels (Low, Medium, High, X-High, Max), six aspect ratios (1:1, 3:4, 4:3, 4:5, 9:16, 16:9) and up to 16 reference images." },
      { q: "Can I run the same prompt on both?", a: "Yes, and the image pairs on this page were made that way: one prompt, run once on each model on BuzzVideo." },
      { q: "Is there a newer version?", a: "GPT Image 2.6 Sunburst and Flare arrive in the next BuzzVideo release, with transparent backgrounds and SVG output." },
    ],
    related: [
      { label: "GPT Image 2.5 Prompt Guide", href: "/gpt-image-2-5-sunburst-prompt-guide" },
      { label: "GPT Image vs Nano Banana", href: "/gpt-image-vs-nano-banana" },
      { label: "GPT Image 2.5 Sunburst", href: "/gpt-image-2-5-sunburst" },
      { label: "GPT Image 2.5 Flare", href: "/gpt-image-2-5-flare" },
      { label: "GPT Image 2.6 Flare", href: "/gpt-image-2-6-flare" },
    ],
  },
  {
    slug: "lyria-3-5-vs-suno",
    h1: "Lyria 3.5 vs Suno",
    lead: "Lyria 3.5 is Google's AI music model for full songs with vocals and lyrics, coming to BuzzVideo in the next release, while Suno is a standalone AI music app. This comparison lists what each one offers, using BuzzVideo's model notes and Suno's public pricing page, and shows which fits ad soundtracks.",
    models: ["lyria-3-5"],
    external: {
      name: "Suno",
      values: {
        Developer: "Suno",
        "Where you use it": "suno.com",
        Status: "Available now",
        "What it makes": "Songs, billed in song credits",
        Models: "v6 and v6-wild on paid plans; v6-mini on Free",
        "Free option": "Free plan: 50 song credits per day, no commercial rights",
        "Paid plans": "Pro $8/mo billed yearly ($10 monthly) · Premier $24/mo ($30) · Platinum $100/mo ($120)",
        "Commercial use": "Included on paid plans",
      },
    },
    verdict:
      "Choose Lyria 3.5 when the music is for an ad you are making on BuzzVideo: the soundtrack sits on the same account and credits as your video, image and voiceover models. Choose Suno when you want a dedicated songwriting app; its paid plans include commercial rights and its Free plan does not. Until Lyria 3.5 launches, Seed Audio 1.0 makes music on BuzzVideo today.",
    picks: [
      { job: "A song with vocals for an ad you make on BuzzVideo", pick: "Lyria 3.5 (next release)", href: "/lyria-3-5", why: "Full songs with vocals and lyrics, about 2 minutes each, on the same credits as your video." },
      { job: "Music on BuzzVideo today", pick: "Seed Audio 1.0", href: "/seed-audio-1-0", why: "Live now; makes voiceover, music and sound effects in one track, and works with the free sign-up credits." },
      { job: "Background bed timed to the second", pick: "MiniMax Music 3", href: "/minimax-music-3", why: "Background music priced by the second (next release)." },
      { job: "Long scores up to 10 minutes", pick: "ElevenLabs Music v2.5", href: "/elevenlabs-music-v2-5", why: "From 3 seconds to 10 minutes, instrumental or with lyrics (next release)." },
      { job: "A standalone songwriting app", pick: "Suno", href: "https://suno.com", why: "A dedicated music app with Free, Pro, Premier and Platinum plans." },
    ],
    faq: [
      { q: "Is Lyria 3.5 available on BuzzVideo?", a: "Lyria 3.5 arrives with the next BuzzVideo release. Plans and credit prices will be confirmed at launch; until then, Seed Audio 1.0 makes music on BuzzVideo." },
      { q: "Is Suno available on BuzzVideo?", a: "No. Suno is a separate app at suno.com. On BuzzVideo you can use Seed Audio 1.0 today and Lyria 3.5, ElevenLabs Music v2.5, Mureka V9.5 and MiniMax Music 3 from the next release." },
      { q: "How long are Lyria 3.5 songs?", a: "About 2 minutes each, with vocals and lyrics, according to BuzzVideo's model notes." },
      { q: "Can I use Suno songs commercially?", a: "Suno's pricing page lists commercial rights on its paid plans (Pro, Premier and Platinum) and not on the Free plan." },
      { q: "How much does Suno cost?", a: "Suno's pricing page lists Pro at $8 a month billed yearly ($10 monthly), Premier at $24 ($30 monthly) and Platinum at $100 ($120 monthly), plus a Free plan with 50 song credits per day." },
    ],
    sources: [SUNO_SRC],
    related: [
      { label: "Lyria 3.5", href: "/lyria-3-5" },
      { label: "AI Music Generator", href: "/ai-music-generator" },
      { label: "Seed Audio 1.0", href: "/seed-audio-1-0" },
      { label: "Gemini 3.8 Flash TTS vs ElevenLabs", href: "/gemini-3-8-flash-tts-vs-elevenlabs" },
      { label: "ElevenLabs Music v2.5", href: "/elevenlabs-music-v2-5" },
    ],
  },
  {
    slug: "gemini-3-8-flash-tts-vs-elevenlabs",
    h1: "Gemini 3.8 Flash TTS vs ElevenLabs",
    lead: "Gemini 3.8 Flash TTS is Google's low-cost multilingual text-to-speech model, and ElevenLabs makes the Eleven voice models; both are coming to BuzzVideo in the next release. This comparison sets BuzzVideo's notes on each against ElevenLabs' public API page, and shows which voice model fits each kind of ad voiceover.",
    models: ["gemini-3-8-flash-tts", "elevenlabs-eleven-v4", "elevenlabs-eleven-v4-turbo", "elevenlabs-eleven-v3"],
    extraRows: [
      { label: "Languages (ElevenLabs API page)", values: { "elevenlabs-eleven-v4": "90+", "elevenlabs-eleven-v4-turbo": "90+", "elevenlabs-eleven-v3": "70+" } },
      { label: "ElevenLabs API price per 1K characters", values: { "elevenlabs-eleven-v4": "$0.08", "elevenlabs-eleven-v4-turbo": "$0.04", "elevenlabs-eleven-v3": "$0.08" } },
    ],
    verdict:
      "Pick Gemini 3.8 Flash TTS for low-cost multilingual voiceover in volume. Pick an ElevenLabs model when you need captions or fine control: Eleven v4 returns character-level timestamps and takes up to 5,000 characters per generation, v4 Turbo supports audio tags and IPA pronunciation, and v3 covers 70+ languages with word-level timestamps.",
    picks: [
      { job: "Many language versions of one ad, on a budget", pick: "Gemini 3.8 Flash TTS", href: "/gemini-3-8-flash-tts", why: "Low-cost multilingual text to speech from Google." },
      { job: "Voiceover with captions synced to it", pick: "ElevenLabs v4 or v3", href: "/elevenlabs-eleven-v4", why: "Character-level (v4) or word-level (v3) timestamps for captions." },
      { job: "Brand names that must be pronounced right", pick: "ElevenLabs v4 Turbo", href: "/elevenlabs-eleven-v4-turbo", why: "Supports audio tags and IPA pronunciation." },
      { job: "Long explainer scripts", pick: "ElevenLabs v4", href: "/elevenlabs-eleven-v4", why: "Up to 5,000 characters per generation." },
      { job: "Cantonese voiceover", pick: "MiniMax Speech 2.6 HD", href: "/minimax-speech-2-6-hd", why: "Includes Cantonese, with pause markers and a pronunciation dictionary." },
      { job: "Voiceover on BuzzVideo today", pick: "Seed Audio 1.0", href: "/seed-audio-1-0", why: "Live now, with multi-speaker scenes in 21 languages." },
    ],
    faq: [
      { q: "Is Gemini 3.8 Flash TTS cheaper than ElevenLabs?", a: "BuzzVideo positions Gemini 3.8 Flash TTS as its low-cost multilingual voice model. Credit prices for both arrive with the next release and show before you create." },
      { q: "Which ElevenLabs models are coming to BuzzVideo?", a: "ElevenLabs v4, v4 Turbo and v3 for voiceover, plus ElevenLabs Music v2.5 and Sound Effects v3, all in the next release." },
      { q: "How many languages does ElevenLabs support?", a: "ElevenLabs' API pricing page lists 90+ languages for Eleven v4 and v4 Turbo, and 70+ for Eleven v3." },
      { q: "Which voice model is best for captions?", a: "An ElevenLabs model. Eleven v4 returns character-level timestamps and Eleven v3 word-level timestamps, which help you time captions to the voice." },
      { q: "Can I make a voiceover on BuzzVideo today?", a: "Yes, with Seed Audio 1.0. It makes voiceover, music and sound effects, supports voice cloning and works with the free sign-up credits." },
    ],
    sources: [ELEVEN_SRC],
    related: [
      { label: "Gemini 3.8 Flash TTS", href: "/gemini-3-8-flash-tts" },
      { label: "ElevenLabs v4", href: "/elevenlabs-eleven-v4" },
      { label: "AI Voice Over", href: "/ai-voice-over" },
      { label: "Text to Speech", href: "/text-to-speech" },
      { label: "Lyria 3.5 vs Suno", href: "/lyria-3-5-vs-suno" },
    ],
  },
];

export const guideOf = (slug: string) => GUIDES.find((g) => g.slug === slug);
export const comparisonOf = (slug: string) => COMPARISONS.find((c) => c.slug === slug);
