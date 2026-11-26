// 2026-11-24 第二批模型子页。纯数据，只 import type(content.ts 会 import 这里，别反向 import 运行时值)。
// 事实来源:models-catalog.ts(描述)、model-facts.ts(时长 / 分辨率 / 比例 / 参考素材 / 声音)、model-content.ts + pricing-live.json(积分价和套餐)、
//   model-media.ts(Seedance 2.0 的真实提示词)。文案里的「about two thirds / about a quarter」这类比例都是按 2026-11-25 的积分价算的，调价后要重核。
// FAQ 的问题取自 search-keywords.json 里各模型的真实搜索(price / prompt / how to use / is it free / vs)。
import type { GuideEntry, QA, RelLink } from "./content";
import { SIGNUP_CREDITS } from "../tools/credits";

const FREE_NAMES = "Seedream 4.5, Seedream 5.0 lite and Seed Audio 1.0";
const FREE_NOTE = `New accounts get ${SIGNUP_CREDITS} free credits, but they work only on ${FREE_NAMES}.`;
const PRICE_SHOWS = "The credit price shows next to the Create button and updates when you change length or resolution.";
const mcpQA = (name: string): QA => ({
  q: `Can I use ${name} inside ChatGPT or Claude?`,
  a: `Yes. Connect BuzzVideo MCP to ChatGPT or Claude and ask for a ${name} video in the chat. It uses your BuzzVideo credits.`,
});
const L = (label: string, href: string): RelLink => ({ label, href });

export const VIDEO_GUIDES: GuideEntry[] = [
  /* ───────── Seedance 2.5 ───────── */
  {
    slug: "seedance-2-5-how-to-use",
    kind: "how-to",
    model: "seedance-2-5",
    h1: "How to Use Seedance 2.5",
    lead: "Seedance 2.5 is ByteDance's flagship AI video model on BuzzVideo, and it turns a prompt plus image, video and audio references into clips of 4 to 30 seconds. This step-by-step guide shows how to open Seedance 2.5 on BuzzVideo, add references, pick length, ratio and resolution, and draft before the final render.",
    tips: [
      "Say what each reference is for: the product, the creator or the poster to animate.",
      "State the length (4 to 30 seconds) and split the clip into timecoded beats.",
      "Put spoken lines in quotes, or write \"No voiceover\" if nobody should speak.",
      "Draft at 480p first, then re-run the keeper at 1080p with the same prompt.",
    ],
    faq: [
      { q: "How do I use Seedance 2.5 on BuzzVideo?", a: "In BuzzVideo, choose Video and pick Seedance 2.5 in the model menu, or ask the Marketing Agent to use it. Write a prompt, add your references, then pick the length, resolution and aspect ratio. The credit price shows before you press Create." },
      { q: "Can I use Seedance 2.5 for free?", a: `No. Seedance 2.5 is available on the Pro and Ultra plans. ${FREE_NOTE}` },
      { q: "How long can a Seedance 2.5 video be?", a: "Between 4 and 30 seconds per generation on BuzzVideo, at 480p, 720p or 1080p. Six aspect ratios are available: 1:1, 3:4, 4:3, 9:16, 16:9 and 21:9." },
      { q: "How many references can I add to Seedance 2.5?", a: "Up to 30 reference images, 10 videos and 10 audio clips in one prompt. Use them to lock the product, the character and the voice or music." },
      { q: "Can I turn off sound in Seedance 2.5?", a: "Yes. Native audio is optional for Seedance 2.5 on BuzzVideo, so you can generate silent footage and add your own voiceover and music." },
      { q: "How do I use Seedance 2.5 cheaply?", a: "Draft at 480p and the shortest length that shows the idea. For volume, Seedance 2.5 Flash is the faster Seedance 2.5 tier and runs on the Starter plan." },
      mcpQA("Seedance 2.5"),
    ],
    related: [
      L("Seedance 2.5", "/models/seedance"),
      L("Seedance 2.5 Prompt Guide", "/seedance-2-5-prompt-guide"),
      L("Seedance 2.5 Pricing", "/seedance-2-5-pricing"),
      L("Seedance 2.5 vs MiniMax H3", "/seedance-2-5-vs-minimax-h3"),
      L("Seedance 2.5 vs Kling 4.0", "/seedance-2-5-vs-kling-4-0"),
      L("Gemini Omni Flash vs Seedance 2.5", "/gemini-omni-flash-vs-seedance-2-5"),
    ],
  },

  /* ───────── Seedance 2.0 ───────── */
  {
    slug: "seedance-2-0-pricing",
    kind: "pricing",
    model: "seedance-2-0",
    h1: "Seedance 2.0 Pricing",
    lead: "Seedance 2.0 is ByteDance's AI video model on BuzzVideo for cinematic hero ads, priced in credits per clip by length and resolution. This page lists what Seedance 2.0 clips cost on BuzzVideo from 480p to 4K, which plans include the model and how to spend fewer credits while you test ideas.",
    tips: [
      "Draft at 480p and the shortest length that shows the idea, then re-run the keeper at a higher resolution with the same prompt.",
      "Render in 4K only for the final master. A 4K clip costs about 11 times the credits of the same clip at 480p.",
      "Test hooks on Seedance 2.0 Mini or Seedance 2.0 Fast, which cost less and run on the Starter plan.",
      "Lock the product and character with reference images so fewer takes go to waste.",
    ],
    faq: [
      { q: "Is Seedance 2.0 free?", a: `No. Seedance 2.0 is available on the Pro and Ultra plans. ${FREE_NOTE}` },
      { q: "What is the Seedance 2.0 price per second?", a: "About 14 credits per second at 480p and about 156 credits per second at 4K on BuzzVideo. The table on this page lists the price for 4, 5, 10 and 15 second clips." },
      { q: "Is Seedance 2.0 cheaper than Seedance 2.5?", a: "Yes. At the same length at 480p, Seedance 2.0 costs about two thirds of Seedance 2.5. Seedance 2.0 also renders in 4K, which Seedance 2.5 does not." },
      { q: "What is the cheapest Seedance 2.0 model?", a: "Seedance 2.0 Mini. At 480p it costs about half the credits of Seedance 2.0, and Seedance 2.0 Fast is about 20% cheaper. Both run on the Starter plan and output up to 720p." },
      { q: "Does 4K cost more in Seedance 2.0?", a: "Yes. 4K is the most expensive setting, and a 15-second 4K clip is the highest price in the table. Draft at 480p and render 4K once." },
      { q: "Where do I see the exact Seedance 2.0 price before I create?", a: `In the BuzzVideo generator. ${PRICE_SHOWS}` },
    ],
    related: [
      L("Seedance 2.0", "/seedance-2-0"),
      L("Seedance 2.0 Prompt Guide", "/seedance-2-0-prompt-guide"),
      L("How to Use Seedance 2.0", "/seedance-2-0-how-to-use"),
      L("Seedance 2.0 vs Fast vs Mini", "/seedance-2-0-vs-fast-vs-mini"),
      L("Seedance 2.5 vs Seedance 2.0", "/seedance-2-5-vs-seedance-2-0"),
      L("Pricing", "/pricing"),
    ],
  },
  {
    slug: "seedance-2-0-prompt-guide",
    kind: "prompt",
    model: "seedance-2-0",
    h1: "Seedance 2.0 Prompt Guide",
    lead: "Seedance 2.0 is ByteDance's AI video model on BuzzVideo for cinematic hero ads up to 15 seconds, with image, video and audio references and output up to 4K. This guide shows how to structure a Seedance 2.0 prompt, with real prompts from BuzzVideo and the videos they produced.",
    anatomy: [
      {
        title: "Say what each reference is",
        body: "Open by naming the references: one image as the creator, one as the exact product. Seedance 2.0 takes up to 9 reference images, 3 videos and 3 audio clips. Then list what must stay the same, such as the bottle shape, the cap and the label.",
      },
      {
        title: "Set the format in the first line",
        body: "State the length (4 to 15 seconds), the aspect ratio (1:1, 3:4, 4:3, 9:16, 16:9 or 21:9) and the kind of ad, such as \"15-second vertical 9:16 unboxing video\".",
      },
      {
        title: "Write timecoded beats with the exact lines",
        body: "Split the clip into beats such as 0:00–0:03 and 0:03–0:06. Say what happens in each and put the dialogue in quotes. The real prompts below do this for 15-second clips.",
      },
      {
        title: "Tell the camera what to do, and what not to do",
        body: "Choose one camera style and hold it: \"locked on a tripod\" or \"subtle handheld movement\". If the camera must stay still, list what is off limits, such as pans, zooms and reframing.",
      },
      {
        title: "Add an audio timeline",
        body: "Seedance 2.0 generates native audio, and you can switch it off. If you keep it, write the sound for each beat and the voiceover line, or write \"No dialogue\" for a silent beat.",
      },
    ],
    tips: [
      "Keep the product name and its key details identical every time they appear in the prompt.",
      "Describe physical actions step by step, such as open the flap, slide the product out, place it down.",
      "Draft at 480p first, then re-run the keeper at 1080p or 4K with the same prompt.",
      "Say \"exactly one\" product if a second copy must not appear in the frame.",
    ],
    faq: [
      { q: "What is a good Seedance 2.0 prompt structure?", a: "References first, then format, then timecoded beats, camera rules and audio. Name what each reference image is, state length and ratio, write each beat with its dialogue in quotes, and end with what must not change." },
      { q: "How long should a Seedance 2.0 prompt be?", a: "As long as the clip needs. The real Seedance 2.0 prompts on this page run from a three-beat sportswear spot to a detailed 15-second UGC script. Add beats, not adjectives." },
      { q: "Can I use reference images in a Seedance 2.0 prompt?", a: "Yes. Seedance 2.0 on BuzzVideo accepts up to 9 reference images, 3 videos and 3 audio clips. Say which image is the creator and which is the product." },
      { q: "Can Seedance 2.0 speak the lines I write?", a: "Yes. Seedance 2.0 generates native audio with the picture. Put each spoken line in quotes inside the beat where it is said, as the UGC prompts on this page do." },
      { q: "Can I reuse Seedance 2.0 prompts on Seedance 2.5?", a: "Yes. Both models read beat-by-beat prompts with product and character locks. Seedance 2.5 also makes clips up to 30 seconds, so you can add more beats." },
      { q: "Which plan do I need for Seedance 2.0?", a: `Seedance 2.0 is available on the Pro and Ultra plans. The free sign-up credits work only on ${FREE_NAMES}.` },
    ],
    related: [
      L("Seedance 2.0", "/seedance-2-0"),
      L("How to Use Seedance 2.0", "/seedance-2-0-how-to-use"),
      L("Seedance 2.0 Pricing", "/seedance-2-0-pricing"),
      L("Seedance 2.0 vs Kling 3.0", "/seedance-2-0-vs-kling-3-0"),
      L("Seedance 2.0 vs Fast vs Mini", "/seedance-2-0-vs-fast-vs-mini"),
      L("Seedance 2.5 Prompt Guide", "/seedance-2-5-prompt-guide"),
    ],
  },
  {
    slug: "seedance-2-0-how-to-use",
    kind: "how-to",
    model: "seedance-2-0",
    h1: "How to Use Seedance 2.0",
    lead: "Seedance 2.0 is ByteDance's AI video model on BuzzVideo, and it turns a prompt plus image, video and audio references into a 4 to 15 second clip at up to 4K. This step-by-step guide shows how to open Seedance 2.0 on BuzzVideo, write the prompt, pick settings and draft before the final render.",
    tips: [
      "Name each reference image in the prompt: which one is the creator and which is the product.",
      "State the length (4 to 15 seconds) and write the clip as timecoded beats.",
      "Put spoken lines in quotes inside the beat where they are said.",
      "Draft at 480p first, then re-run the keeper at 1080p or 4K with the same prompt.",
    ],
    faq: [
      { q: "How do I use Seedance 2.0 on BuzzVideo?", a: "In BuzzVideo, choose Video and pick Seedance 2.0 in the model menu, or ask the Marketing Agent to use it. Write a prompt, add up to 9 reference images, then pick the length, resolution and aspect ratio." },
      { q: "Can I use Seedance 2.0 for free?", a: `No. Seedance 2.0 is available on the Pro and Ultra plans. ${FREE_NOTE}` },
      { q: "How long can a Seedance 2.0 video be?", a: "Between 4 and 15 seconds per generation on BuzzVideo. For clips up to 30 seconds, use Seedance 2.5." },
      { q: "Can Seedance 2.0 make 4K video?", a: "Yes. Seedance 2.0 outputs 480p, 720p, 1080p and 4K on BuzzVideo, in six aspect ratios from 9:16 to 21:9." },
      { q: "Can I turn off sound in Seedance 2.0?", a: "Yes. Native audio is optional for Seedance 2.0 on BuzzVideo, so you can generate silent footage and add your own track." },
      { q: "What are Seedance 2.0 Fast and Seedance 2.0 Mini?", a: "They are lower-priced Seedance 2.0 tiers on BuzzVideo. Seedance 2.0 Fast is about 20% cheaper for quick product and scenery clips, and Seedance 2.0 Mini is the affordable pick for short social clips and tests. Both output up to 720p." },
      mcpQA("Seedance 2.0"),
    ],
    related: [
      L("Seedance 2.0", "/seedance-2-0"),
      L("Seedance 2.0 Prompt Guide", "/seedance-2-0-prompt-guide"),
      L("Seedance 2.0 Pricing", "/seedance-2-0-pricing"),
      L("Seedance 2.0 vs Fast vs Mini", "/seedance-2-0-vs-fast-vs-mini"),
      L("Seedance 2.0 vs Kling 3.0", "/seedance-2-0-vs-kling-3-0"),
      L("AI Video Generator", "/ai-video-generator"),
    ],
  },

  /* ───────── Kling 4.0 ───────── */
  {
    slug: "kling-4-0-pricing",
    kind: "pricing",
    model: "kling-4-0",
    h1: "Kling 4.0 Pricing",
    lead: "Kling 4.0 is Kuaishou's AI video model on BuzzVideo that generates one continuous 3 to 30 second clip with native sound, priced in credits by length and resolution. This page lists Kling pricing on BuzzVideo: what Kling 4.0 clips cost at 720p and 1080p, which plans include the model and how to spend fewer credits.",
    tips: [
      "Run the opening beat as a short 720p draft before you pay for the full take.",
      "Use 720p for tests. 1080p costs about 50% more credits at every length.",
      "Lock the product and character with reference images so fewer takes go to waste.",
      "Check the credit price in the generator before you press Create; it updates as you change length and resolution.",
    ],
    faq: [
      { q: "Is Kling 4.0 free?", a: `Not on the Free plan. Kling 4.0 is available on the Starter, Pro and Ultra plans. ${FREE_NOTE}` },
      { q: "What is the Kling 4.0 price per second?", a: "About 31 credits per second at 720p and 47 credits per second at 1080p on BuzzVideo. The table on this page lists the price for 3, 5, 10, 15 and 30 second clips." },
      { q: "Does a 30-second Kling 4.0 clip cost more?", a: "Yes. The price grows with length, so a 30-second clip costs about ten times a 3-second clip at the same resolution. A 30-second 1080p clip is the most expensive setting." },
      { q: "Is Kling 4.0 cheaper than Seedance 2.5?", a: "Yes. At the same length at 1080p, Kling 4.0 costs less than half the credits of Seedance 2.5. Kling 4.0 also runs on the Starter plan, while Seedance 2.5 needs Pro or Ultra." },
      { q: "Is Kling 4.0 more expensive than Kling 3.0?", a: "Yes, at the lowest setting. Kling 3.0 at its Standard setting costs fewer credits than Kling 4.0 at 720p for the same length. Kling 3.0 stops at 15 seconds, and Kling 4.0 runs to 30." },
      { q: "Where do I see the exact Kling 4.0 price before I create?", a: `In the BuzzVideo generator. ${PRICE_SHOWS}` },
      { q: "Which Kling pricing plans include Kling 4.0?", a: "Starter, Pro and Ultra. Starter is $14 a month billed yearly with 1,900 credits a month, Pro includes 4,900 credits and Ultra 8,900." },
      { q: "How much is a 10-second Kling 4.0 video?", a: "314 credits at 720p and 470 credits at 1080p on BuzzVideo. A 30-second take costs 942 credits at 720p and 1,410 credits at 1080p." },
      { q: "How many Kling 4.0 videos can I make on the Starter plan?", a: "Starter includes 1,900 credits a month. That covers about 12 five-second clips or 6 ten-second clips at 720p, or one 30-second take at 1080p." },
      { q: "Can I use Kling 4.0 videos commercially?", a: "Yes. Everything you generate on BuzzVideo can be used commercially, on every plan." },
    ],
    related: [{ label: "Kling 4.0", href: "/kling-4-0" }, { label: "Kling 4.0 Prompt Guide", href: "/kling-4-0-prompt-guide" }, { label: "Kling 3.0", href: "/kling-3-0" }, { label: "Seedance 2.5 Pricing", href: "/seedance-2-5-pricing" }, { label: "Best AI Video Models", href: "/best-ai-video-models" }, { label: "Pricing", href: "/pricing" }],
  },

  /* ───────── Kling 3.0 ───────── */
  {
    slug: "kling-3-0-prompt-guide",
    kind: "prompt",
    model: "kling-3-0",
    h1: "Kling 3.0 Prompt Guide",
    lead: "Kling 3.0 is Kuaishou's AI video model on BuzzVideo for multi-shot story ads with dialogue, in clips of 3 to 15 seconds at up to 4K. This guide shows how to structure a Kling 3.0 prompt shot by shot, lock a character with reference images and write lines the model can speak.",
    anatomy: [
      {
        title: "Plan the story as numbered shots",
        body: "Kling 3.0 is built for multi-shot story ads. Write the clip as Shot 1, Shot 2 and Shot 3, and give each shot one action and one framing. A clip runs 3 to 15 seconds, so keep it to a few shots.",
      },
      {
        title: "Describe the character once, then repeat the name",
        body: "Describe the person at the top: age, hair and outfit. Use the same short name for them in every shot. Kling 3.0 takes up to 2 reference images, so attach one for the character and one for the product.",
      },
      {
        title: "Put the dialogue inside each shot",
        body: "Write the spoken line in quotes in the shot where it is said, and say who speaks. Keep lines short enough to say in that shot.",
      },
      {
        title: "Set ratio, length and resolution",
        body: "Pick 16:9, 9:16 or 1:1, a length from 3 to 15 seconds, and 720p, 1080p or 4K. Draft at a lower setting first.",
      },
      {
        title: "Decide on sound",
        body: "Kling 3.0 generates native audio, and you can turn it off. Keep it on for dialogue ads. Turn it off when you plan to add your own voiceover and music.",
      },
    ],
    tips: [
      "Give each shot one action. Two actions in one shot often blur together.",
      "Name the product the same way in every shot and say \"keep the label unchanged\".",
      "Read the dialogue out loud with a timer to check it fits the clip length.",
      "Need more than 2 reference images? Kling 3.0 Omni takes up to 7.",
    ],
    faq: [
      { q: "What is a good Kling 3.0 prompt structure?", a: "Character first, then numbered shots, then settings. Describe the person once, write each shot with one action and its dialogue in quotes, and pick the ratio, length and resolution last." },
      { q: "How do I write a multi-shot prompt for Kling 3.0?", a: "Write each shot on its own line and number it. Say the framing, the action and the spoken line for each one. Keep the whole story within the 3 to 15 second clip." },
      { q: "How many reference images does Kling 3.0 take?", a: "Up to 2 reference images in one prompt on BuzzVideo. Kling 3.0 Omni takes up to 7, and Kling 4.0 takes up to 10 images and 5 videos." },
      { q: "Can Kling 3.0 generate dialogue?", a: "Yes. Kling 3.0 generates native audio with the picture, and BuzzVideo lists it for multi-shot story ads with dialogue. You can also turn the sound off." },
      { q: "How long can a Kling 3.0 video be?", a: "Between 3 and 15 seconds per generation on BuzzVideo, in 16:9, 9:16 or 1:1. For one continuous take up to 30 seconds, use Kling 4.0." },
      { q: "Which plan do I need for Kling 3.0?", a: `Kling 3.0 is available on the Starter, Pro and Ultra plans. The free sign-up credits work only on ${FREE_NAMES}.` },
    ],
    related: [
      L("Kling 3.0", "/kling-3-0"),
      L("How to Use Kling 3.0", "/kling-3-0-how-to-use"),
      L("Kling 4.0 vs Kling 3.0", "/kling-4-0-vs-kling-3-0"),
      L("Kling 3.0 vs Kling 3.0 Omni", "/kling-3-0-vs-kling-3-0-omni"),
      L("Seedance 2.0 vs Kling 3.0", "/seedance-2-0-vs-kling-3-0"),
      L("Kling 4.0 Prompt Guide", "/kling-4-0-prompt-guide"),
    ],
  },
  {
    slug: "kling-3-0-how-to-use",
    kind: "how-to",
    model: "kling-3-0",
    h1: "How to Use Kling 3.0",
    lead: "Kling 3.0 is Kuaishou's AI video model on BuzzVideo for multi-shot story ads with dialogue, and it turns a prompt and up to 2 reference images into a 3 to 15 second clip. This step-by-step guide shows how to open Kling 3.0 on BuzzVideo, write the shots, pick settings and check the price.",
    tips: [
      "Describe the character once at the top and reuse the same name in every shot.",
      "Number the shots and give each one a single action.",
      "Put spoken lines in quotes inside the shot where they are said.",
      "Pick 9:16 for social and 16:9 for YouTube; 1:1 is also available.",
    ],
    faq: [
      { q: "How do I use Kling 3.0 on BuzzVideo?", a: "In BuzzVideo, choose Video and pick Kling 3.0 in the model menu, or ask the Marketing Agent to use it. Write a prompt, add up to 2 reference images, then pick the length, resolution and aspect ratio." },
      { q: "Can I use Kling 3.0 for free?", a: `Not on the Free plan. Kling 3.0 is available on the Starter, Pro and Ultra plans. ${FREE_NOTE}` },
      { q: "How do I use Kling 3.0 multi-shot?", a: "Write the story as numbered shots in one prompt. Give each shot its framing, action and spoken line. BuzzVideo lists Kling 3.0 for multi-shot story ads with dialogue, in clips of 3 to 15 seconds." },
      { q: "How do I use Kling 3.0 Omni?", a: "Pick Kling 3.0 Omni in the same model menu. It is a separate model on BuzzVideo for reference-driven clips and video edits, with up to 7 reference images and output up to 4K." },
      { q: "Can I turn off sound in Kling 3.0?", a: "Yes. Native audio is optional for Kling 3.0 on BuzzVideo. Kling 4.0, by contrast, always generates sound." },
      { q: "What is the difference between Kling 3.0 and Kling 4.0?", a: "Kling 4.0 makes one continuous take up to 30 seconds and takes up to 10 reference images and 5 videos. Kling 3.0 makes clips up to 15 seconds with 2 reference images, renders up to 4K and lets you turn sound off." },
      mcpQA("Kling 3.0"),
    ],
    related: [
      L("Kling 3.0", "/kling-3-0"),
      L("Kling 3.0 Prompt Guide", "/kling-3-0-prompt-guide"),
      L("Kling 3.0 vs Kling 3.0 Omni", "/kling-3-0-vs-kling-3-0-omni"),
      L("Kling 4.0 vs Kling 3.0", "/kling-4-0-vs-kling-3-0"),
      L("Seedance 2.0 vs Kling 3.0", "/seedance-2-0-vs-kling-3-0"),
      L("How to Use Kling 4.0", "/kling-4-0-how-to-use"),
    ],
  },

  /* ───────── Wan 3.0 ───────── */
  {
    slug: "wan-3-0-prompt-guide",
    kind: "prompt",
    model: "wan-3-0",
    h1: "Wan 3.0 Prompt Guide",
    lead: "Wan 3.0 is Alibaba's AI video model on BuzzVideo for long single takes with audio, from 2 to 30 seconds at up to 1080p. This guide shows how to structure a Wan 3.0 prompt for product demos, use image, video, audio and web page references, and direct the sound.",
    anatomy: [
      {
        title: "Start from your references",
        body: "Wan 3.0 takes up to 10 reference images, 5 videos and 5 audio clips. It also reads web pages and documents you add as a URL or Doc reference. Say what each one is for, such as the product photo or the product page.",
      },
      {
        title: "Set the length and ratio",
        body: "State the length, from 2 to 30 seconds, and the aspect ratio: 9:16, 16:9, 1:1, 3:4 or 4:3. Auto is also available if you want the ratio picked for you.",
      },
      {
        title: "Write one take as timecoded beats",
        body: "Wan 3.0 is listed for long 30-second single takes. Split the take into beats such as 0–5s and 5–12s. Say what the hands, the product and the camera do in each.",
      },
      {
        title: "Direct the sound",
        body: "Wan 3.0 generates native audio, and you can turn it off. If you keep it, name the voice, the room sound and the music, and put spoken lines in quotes.",
      },
      {
        title: "End with what must not change",
        body: "List what must stay fixed: one product, the same label, the same person and outfit. Add what must not appear, such as extra text, logos or watermarks.",
      },
    ],
    tips: [
      "Describe demo actions step by step so the product behaves like the real thing.",
      "Draft a short 480p version first, then re-run the keeper at 1080p with the same prompt.",
      "Keep the product name identical every time it appears in the prompt.",
      "For a long take, add beats rather than adjectives.",
    ],
    faq: [
      { q: "What is a good Wan 3.0 prompt structure?", a: "References, format, beats, sound, then an avoid list. Say what each reference is, state length and ratio, write the take as timecoded beats, direct the audio and end with what must not change." },
      { q: "How do I use references in a Wan 3.0 prompt?", a: "Attach them and name each one in the prompt. Wan 3.0 on BuzzVideo takes up to 10 images, 5 videos and 5 audio clips, plus web pages and documents added as a URL or Doc reference." },
      { q: "How long can a Wan 3.0 video be?", a: "Between 2 and 30 seconds per generation on BuzzVideo, at 480p, 720p or 1080p." },
      { q: "Can I write dialogue in a Wan 3.0 prompt?", a: "Yes. Wan 3.0 generates native audio with the picture. Put the spoken lines in quotes inside the beat where they are said. You can also turn the sound off." },
      { q: "What is Wan 3.0 good for?", a: "Long single takes with audio, such as product demos. BuzzVideo lists Wan 3.0 for 30-second single takes, and it starts at 2 seconds for short bumpers." },
      { q: "Which plan do I need for Wan 3.0?", a: `Wan 3.0 is available on the Starter, Pro and Ultra plans. The free sign-up credits work only on ${FREE_NAMES}.` },
    ],
    related: [
      L("Wan 3.0", "/wan-3-0"),
      L("Wan 3.0 Pricing", "/wan-3-0-pricing"),
      L("Wan 3.0 vs MiniMax H3", "/wan-3-0-vs-minimax-h3"),
      L("Seedance 2.5 vs Wan 3.0", "/seedance-2-5-vs-wan-3-0"),
      L("Wan 3.0 Prime", "/wan-3-0-prime"),
      L("AI Product Video Generator", "/ai-product-video-generator"),
    ],
  },
  {
    slug: "wan-3-0-pricing",
    kind: "pricing",
    model: "wan-3-0",
    h1: "Wan 3.0 Pricing",
    lead: "Wan 3.0 is Alibaba's AI video model on BuzzVideo for long single takes with audio, priced in credits per clip by length and resolution. This page lists what Wan 3.0 clips cost on BuzzVideo from 2 to 30 seconds, which plans include the model and how to spend fewer credits on drafts.",
    tips: [
      "Draft at 480p. A 1080p clip costs four times the credits of the same clip at 480p.",
      "Test the hook as a 2-second clip, the shortest length Wan 3.0 offers.",
      "Add your product photo or page as a reference so fewer takes go to waste.",
      "Check the credit price in the generator before you press Create; it updates as you change length and resolution.",
    ],
    faq: [
      { q: "Is Wan 3.0 free?", a: `Not on the Free plan. Wan 3.0 is available on the Starter, Pro and Ultra plans. ${FREE_NOTE}` },
      { q: "What is the Wan 3.0 price per second?", a: "10 credits per second at 480p and 40 credits per second at 1080p on BuzzVideo. The table on this page lists the price for 2, 5, 10, 15 and 30 second clips." },
      { q: "Is Wan 3.0 cheaper than Seedance 2.5?", a: "Yes. At 1080p, Wan 3.0 costs about a third of Seedance 2.5's credits for the same length, and about half at 480p. Both make clips up to 30 seconds." },
      { q: "Is Wan 3.0 cheaper than Kling 4.0?", a: "Yes, by a small margin at 1080p. The comparison table on this page lists both at the same length. Wan 3.0 also has 480p drafts, while Kling 4.0 starts at 720p." },
      { q: "Does a 30-second Wan 3.0 clip cost more?", a: "Yes. The price grows in step with length, so a 30-second clip costs three times a 10-second clip at the same resolution." },
      { q: "Where do I see the exact Wan 3.0 price before I create?", a: `In the BuzzVideo generator. ${PRICE_SHOWS}` },
    ],
    related: [
      L("Wan 3.0", "/wan-3-0"),
      L("Wan 3.0 Prompt Guide", "/wan-3-0-prompt-guide"),
      L("Wan 3.0 vs MiniMax H3", "/wan-3-0-vs-minimax-h3"),
      L("Seedance 2.5 vs Wan 3.0", "/seedance-2-5-vs-wan-3-0"),
      L("Wan 3.0 Prime", "/wan-3-0-prime"),
      L("Pricing", "/pricing"),
    ],
  },

  /* ───────── MiniMax H3 ───────── */
  {
    slug: "minimax-h3-pricing",
    kind: "pricing",
    model: "minimax-h3",
    h1: "MiniMax H3 Pricing",
    lead: "MiniMax H3 is MiniMax's AI video model on BuzzVideo with native audio and lip sync, priced in credits per clip by length and resolution. This page lists what MiniMax H3 clips cost on BuzzVideo from 768p to 4K, which plans include the model and how to spend fewer credits.",
    tips: [
      "Draft at 768p and 5 seconds, the lowest-priced MiniMax H3 setting, then re-run the keeper in 4K.",
      "Use MiniMax H3 Max for first drafts. It starts at 480p and costs fewer credits at its lowest setting.",
      "Lock the character with reference images so fewer takes go to waste.",
      "Check the credit price in the generator before you press Create; it updates as you change length and resolution.",
    ],
    faq: [
      { q: "Is MiniMax H3 free?", a: `Not on the Free plan. MiniMax H3 is available on the Starter, Pro and Ultra plans. ${FREE_NOTE}` },
      { q: "What is the MiniMax H3 price per second?", a: "15 credits per second at 768p and 40 credits per second at 4K on BuzzVideo. The table on this page lists the price for 5, 10 and 15 second clips." },
      { q: "How much does MiniMax H3 cost in 4K?", a: "40 credits per second on BuzzVideo, which is under three times the 768p price. At the same length in 4K, that is about a quarter of Seedance 2.0's credits." },
      { q: "What is the MiniMax H3 Max price?", a: "MiniMax H3 Max starts lower than MiniMax H3 because it has a 480p setting. Its lowest setting costs two thirds of MiniMax H3's lowest. MiniMax H3 Max tops out at 1080p, and MiniMax H3 goes to 4K." },
      { q: "What is the cheapest MiniMax H3 setting?", a: "A 5-second clip at 768p. MiniMax H3 clips run 5 to 15 seconds, and the price grows in step with length." },
      { q: "Where do I see the exact MiniMax H3 price before I create?", a: `In the BuzzVideo generator. ${PRICE_SHOWS}` },
    ],
    related: [
      L("MiniMax H3", "/minimax-h3"),
      L("MiniMax H3 Prompt Guide", "/minimax-h3-prompt-guide"),
      L("How to Use MiniMax H3", "/minimax-h3-how-to-use"),
      L("MiniMax H3 vs MiniMax H3 Max", "/minimax-h3-vs-minimax-h3-max"),
      L("Wan 3.0 vs MiniMax H3", "/wan-3-0-vs-minimax-h3"),
      L("Pricing", "/pricing"),
    ],
  },
  {
    slug: "minimax-h3-prompt-guide",
    kind: "prompt",
    model: "minimax-h3",
    h1: "MiniMax H3 Prompt Guide",
    lead: "MiniMax H3 is MiniMax's AI video model on BuzzVideo with native audio and lip sync, built to keep characters consistent in clips of 5 to 15 seconds at up to 4K. This guide shows how to structure a MiniMax H3 prompt: lock the character, write the spoken lines and set the format.",
    anatomy: [
      {
        title: "Lock the character first",
        body: "MiniMax H3 is listed for consistent characters. Describe the person once at the top: age, hair and outfit. Attach a reference image of them; MiniMax H3 takes up to 9 reference images, 3 videos and 3 audio clips.",
      },
      {
        title: "Write the exact spoken lines",
        body: "MiniMax H3 generates native audio with lip sync, and the sound is always on. Put each line in quotes and say who speaks it, so the mouth has words to match.",
      },
      {
        title: "Split the clip into beats",
        body: "A clip runs 5 to 15 seconds. Use two to four timecoded beats, and give each one an action, a framing and its line.",
      },
      {
        title: "Set the ratio and resolution",
        body: "Pick one of six aspect ratios: 1:1, 3:4, 4:3, 9:16, 16:9 or 21:9. Then choose 768p, 2K or 4K. Draft at 768p.",
      },
      {
        title: "End with what must not change",
        body: "List what must stay fixed: the same face, hair and outfit, one product and a readable label. Add what must not appear, such as subtitles, logos or watermarks.",
      },
    ],
    tips: [
      "Keep dialogue short enough to say within the clip. Read it out loud with a timer first.",
      "Frame the speaker's face clearly in the beats where they talk.",
      "Name the music and room sound you want, since MiniMax H3 always generates audio.",
      "Draft at 768p, then re-run the keeper in 4K with the same prompt.",
    ],
    faq: [
      { q: "What is a good MiniMax H3 prompt template?", a: "Character, lines, beats, format, then an avoid list. Describe the person once, write each spoken line in quotes, split the clip into timecoded beats and pick the ratio and resolution last." },
      { q: "How do I keep a character consistent in MiniMax H3?", a: "Attach a reference image and describe the person once at the top of the prompt. MiniMax H3 takes up to 9 reference images, and BuzzVideo lists it for consistent characters." },
      { q: "Should I write dialogue in a MiniMax H3 prompt?", a: "Yes. MiniMax H3 generates native audio with lip sync, so write the exact lines in quotes. The sound cannot be turned off on BuzzVideo." },
      { q: "How do I use reference to video in MiniMax H3?", a: "Attach your references and name each one in the prompt. MiniMax H3 on BuzzVideo takes up to 9 images, 3 videos and 3 audio clips in one prompt." },
      { q: "How long can a MiniMax H3 video be?", a: "Between 5 and 15 seconds per generation on BuzzVideo, at 768p, 2K or 4K." },
      { q: "Which plan do I need for MiniMax H3?", a: `MiniMax H3 is available on the Starter, Pro and Ultra plans. The free sign-up credits work only on ${FREE_NAMES}.` },
    ],
    related: [
      L("MiniMax H3", "/minimax-h3"),
      L("How to Use MiniMax H3", "/minimax-h3-how-to-use"),
      L("MiniMax H3 Pricing", "/minimax-h3-pricing"),
      L("MiniMax H3 vs MiniMax H3 Max", "/minimax-h3-vs-minimax-h3-max"),
      L("Seedance 2.5 vs MiniMax H3", "/seedance-2-5-vs-minimax-h3"),
      L("AI Lip Sync", "/ai-lip-sync"),
    ],
  },
  {
    slug: "minimax-h3-how-to-use",
    kind: "how-to",
    model: "minimax-h3",
    h1: "How to Use MiniMax H3",
    lead: "MiniMax H3 is MiniMax's AI video model on BuzzVideo with native audio and lip sync, and it turns a prompt plus image, video and audio references into a 5 to 15 second clip. This step-by-step guide shows how to open MiniMax H3 on BuzzVideo, write the prompt, pick settings and check the price.",
    tips: [
      "Describe the character once at the top and attach a reference image of them.",
      "Put every spoken line in quotes and say who speaks it.",
      "State the length (5 to 15 seconds) and split the clip into timecoded beats.",
      "Draft at 768p, then re-run the keeper in 2K or 4K with the same prompt.",
    ],
    faq: [
      { q: "How do I use MiniMax H3 on BuzzVideo?", a: "In BuzzVideo, choose Video and pick MiniMax H3 in the model menu, or ask the Marketing Agent to use it. Write a prompt, add up to 9 reference images, then pick the length, resolution and aspect ratio." },
      { q: "Can I use MiniMax H3 for free?", a: `Not on the Free plan. MiniMax H3 is available on the Starter, Pro and Ultra plans. ${FREE_NOTE}` },
      { q: "How do I use MiniMax H3 reference to video?", a: "Add your references next to the prompt and say what each one is for. MiniMax H3 takes up to 9 reference images, 3 videos and 3 audio clips on BuzzVideo." },
      { q: "What is MiniMax H3 good for?", a: "Talking characters. BuzzVideo lists MiniMax H3 for native audio and lip sync with consistent characters, in 5 to 15 second clips at up to 4K." },
      { q: "Can I turn off sound in MiniMax H3?", a: "No. MiniMax H3 always generates an audio track on BuzzVideo. Mute or replace it when you edit if you need silent footage." },
      { q: "What is MiniMax H3 Max?", a: "MiniMax H3 Max is a separate MiniMax model on BuzzVideo for fast drafts with first- and last-frame control. It outputs 480p to 1080p, while MiniMax H3 outputs 768p to 4K." },
      mcpQA("MiniMax H3"),
    ],
    related: [
      L("MiniMax H3", "/minimax-h3"),
      L("MiniMax H3 Prompt Guide", "/minimax-h3-prompt-guide"),
      L("MiniMax H3 Pricing", "/minimax-h3-pricing"),
      L("MiniMax H3 vs MiniMax H3 Max", "/minimax-h3-vs-minimax-h3-max"),
      L("Wan 3.0 vs MiniMax H3", "/wan-3-0-vs-minimax-h3"),
      L("Seedance 2.5 vs MiniMax H3", "/seedance-2-5-vs-minimax-h3"),
    ],
  },

  /* ───────── Gemini Omni Flash ───────── */
  {
    slug: "gemini-omni-flash-pricing",
    kind: "pricing",
    model: "gemini-omni-flash",
    h1: "Gemini Omni Flash Pricing",
    lead: "Gemini Omni Flash is Google's fast multimodal AI video model on BuzzVideo, and it makes 4 to 10 second 720p clips with native audio, priced in credits by clip length. This page lists what Gemini Omni Flash clips cost on BuzzVideo, which plans include the model and how to spend fewer credits.",
    tips: [
      "Test the idea as a 4-second clip, the shortest and lowest-priced setting.",
      "Add up to 5 reference images so the product matches and fewer takes go to waste.",
      "Write the hook and the product moment into one short clip instead of generating two.",
      "Check the credit price in the generator before you press Create; it updates as you change the length.",
    ],
    faq: [
      { q: "Is Gemini Omni Flash free?", a: `Not on the Free plan. Gemini Omni Flash is available on the Starter, Pro and Ultra plans. ${FREE_NOTE}` },
      { q: "Is there a Gemini Omni Flash free trial on BuzzVideo?", a: `No. The ${SIGNUP_CREDITS} free sign-up credits work only on ${FREE_NAMES}. Video models, including Gemini Omni Flash, need a Starter, Pro or Ultra plan.` },
      { q: "What is the Gemini Omni Flash price per second?", a: "About 20 credits per second on BuzzVideo. Clips are 4, 6, 8 or 10 seconds at 720p, and the table on this page lists each price." },
      { q: "Does resolution change the Gemini Omni Flash price?", a: "No. Gemini Omni Flash outputs 720p only on BuzzVideo, so the price depends on clip length alone." },
      { q: "Is Gemini Omni Flash cheaper than Kling 4.0?", a: "Yes. A 10-second 720p clip costs about two thirds of Kling 4.0's credits. Kling 4.0 makes clips up to 30 seconds, and Gemini Omni Flash stops at 10." },
      { q: "Where do I see the exact Gemini Omni Flash price before I create?", a: "In the BuzzVideo generator. The credit price shows next to the Create button and updates when you change the length." },
    ],
    related: [
      L("Gemini Omni Flash", "/gemini-omni-flash"),
      L("Gemini Omni Flash vs Seedance 2.5", "/gemini-omni-flash-vs-seedance-2-5"),
      L("Seedance 2.5 Pricing", "/seedance-2-5-pricing"),
      L("Kling 4.0 Pricing", "/kling-4-0-pricing"),
      L("Pricing", "/pricing"),
    ],
  },
];

/** 这些页的 <title> / description(meta.ts 合并进去) */
export const VIDEO_META: Record<string, { title: string; description: string }> = {
  "seedance-2-5-how-to-use": {
    title: "How to Use Seedance 2.5: Step-by-Step | BuzzVideo",
    description: "Step-by-step guide to Seedance 2.5 on BuzzVideo: open the model, add image, video and audio references, set length, ratio and resolution, then draft first.",
  },
  "seedance-2-0-pricing": {
    title: "Seedance 2.0 Pricing: Credits per Clip | BuzzVideo",
    description: "What Seedance 2.0 costs on BuzzVideo: credits per clip from 480p to 4K, the price per second, which plans include it and how it compares with Seedance 2.5.",
  },
  "seedance-2-0-prompt-guide": {
    title: "Seedance 2.0 Prompt Guide: Real Examples | BuzzVideo",
    description: "How to write Seedance 2.0 prompts for video ads: name references, timecoded beats, camera rules and an audio timeline, with real prompts and their videos.",
  },
  "seedance-2-0-how-to-use": {
    title: "How to Use Seedance 2.0: Step-by-Step | BuzzVideo",
    description: "Step-by-step guide to Seedance 2.0 on BuzzVideo: open the model, write the prompt, add references, set length, ratio and resolution up to 4K, then draft.",
  },
  "kling-4-0-pricing": {
    title: "Kling Pricing: Kling 4.0 Credits per Clip | BuzzVideo",
    description: "Kling pricing on BuzzVideo: Kling 4.0 costs about 31 credits a second at 720p and 47 at 1080p, for 3 to 30 second clips on the Starter, Pro and Ultra plans.",
  },
  "kling-3-0-prompt-guide": {
    title: "Kling 3.0 Prompt Guide: Multi-Shot Ads | BuzzVideo",
    description: "Write Kling 3.0 prompts for multi-shot story ads: numbered shots, a locked character, dialogue in quotes and the right length, ratio and resolution.",
  },
  "kling-3-0-how-to-use": {
    title: "How to Use Kling 3.0: Step-by-Step Guide | BuzzVideo",
    description: "Step-by-step guide to Kling 3.0 on BuzzVideo: open the model, write a multi-shot prompt, add reference images, set length, ratio and resolution, then create.",
  },
  "wan-3-0-prompt-guide": {
    title: "Wan 3.0 Prompt Guide: Structure & Tips | BuzzVideo",
    description: "How to write Wan 3.0 prompts for long product demos: image, video, audio and URL references, timecoded beats for one take, sound direction and avoid lists.",
  },
  "wan-3-0-pricing": {
    title: "Wan 3.0 Pricing: Credits per Clip | BuzzVideo",
    description: "What Wan 3.0 costs on BuzzVideo: credits per clip from 2 to 30 seconds at 480p and 1080p, the price per second, plans and how it compares with Seedance 2.5.",
  },
  "minimax-h3-pricing": {
    title: "MiniMax H3 Pricing: Credits per Clip | BuzzVideo",
    description: "What MiniMax H3 costs on BuzzVideo: credits per clip from 768p to 4K, the price per second, which plans include it and how it compares with MiniMax H3 Max.",
  },
  "minimax-h3-prompt-guide": {
    title: "MiniMax H3 Prompt Guide: Template & Tips | BuzzVideo",
    description: "How to write MiniMax H3 prompts for talking-character ads: lock the character, write lines for lip sync, split the clip into beats and set ratio and resolution.",
  },
  "minimax-h3-how-to-use": {
    title: "How to Use MiniMax H3: Step-by-Step | BuzzVideo",
    description: "Step-by-step guide to MiniMax H3 on BuzzVideo: open the model, write the prompt, add image, video and audio references, set length and resolution, then create.",
  },
  "gemini-omni-flash-pricing": {
    title: "Gemini Omni Flash Pricing: Credits per Clip | BuzzVideo",
    description: "What Gemini Omni Flash costs on BuzzVideo: credits for 4, 6, 8 and 10 second 720p clips, the price per second, which plans include it and whether it is free.",
  },
};
