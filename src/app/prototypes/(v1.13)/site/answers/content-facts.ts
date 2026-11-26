// 问答页内容(2026-11-26)。格式同 learn/content.ts 的 Guide;GEO 写法见文件头注释。
// 产品事实问答页(9 页,group "Questions")。事实来源:
//   - 免费积分 / 可用模型 / 水印 / 套餐功能 / 积分重置 / 退款 / 取消 / 升降级：free/company.ts + 线上 https://buzzvideo.ai/pricing(2026-11-26 WebFetch 核对);
//   - 价格数字：线上定价页 2026-11-26 显示的年付价(Starter $14 / Pro $35 / Ultra $63 每月，年付 $168 / $420 / $756)和每月积分;
//   - 积分价：models/pricing-live.json(2026-11-26 仓库版本，按 input_has_video=no、带声音取值);
//   - 商用 / 所有权 / 肖像 / 年龄：线上 https://buzzvideo.ai/terms-of-service(5.1、6.2、8.1、8.6、第 1 节);
//   - 付款 Stripe、不拿内容训练、删除 30 天：线上 https://buzzvideo.ai/privacy-policy;
//   - 模型列表：site-nav/models-catalog.ts;UGC 能力：tools/tool-content.ts 的 ai-ugc-video-generator;
//   - 字节跳动旧 App:Archive Team wiki(记录其 2022-12-31 关停)。
// 不编数字：没有定价的模型不写积分，只说「生成前会显示」。

import { SIGNUP_CREDITS } from "../tools/credits";
import { MODELS, modelsOfType, type ModelType } from "../../site-nav/models-catalog";
import type { Guide } from "../learn/content";
import { MERGED, REMOVED } from "../redirects";
import { PLANS } from "../../model-page/model-data";

/* 套餐价:年付和每月积分取 model-data 的 PLANS(和对比页、模型页同一份);月付 2026-11-26 buzzvideo.ai/pricing 核对(同 content-tracked.ts)。
   定价页卡片当天显示的 2,660 / 6,860 / 12,460 是促销加赠后的数,和页内对比表不一致 → 这里写基础额度并注明促销以定价页为准。 */
const MONTHLY = { starter: 19, pro: 49, ultra: 89 };
const yearly = (p: { perMonth: number }) => `$${p.perMonth}/month ($${p.perMonth * 12}/year)`;
const cr = (p: { credits: number }) => p.credits.toLocaleString("en-US");

const PRICING = { label: "BuzzVideo pricing", url: "https://buzzvideo.ai/pricing" };
const TERMS = { label: "BuzzVideo Terms of Service", url: "https://buzzvideo.ai/terms-of-service" };
const PRIVACY = { label: "BuzzVideo Privacy Policy", url: "https://buzzvideo.ai/privacy-policy" };

const FREE_MODELS = "Seedream 4.5 and Seedream 5.0 lite (images), Seed Audio 1.0 (voice and music) and the AI Image Upscaler";
const STARTER_VIDEO = "Kling 4.0, Kling 3.0, Wan 3.0, Wan 3.0 Prime, MiniMax H3, MiniMax H3 Max, Gemini Omni Flash, Seedance 2.5 Flash, Seedance 2.0 Fast and Seedance 2.0 Mini";

/* 模型表：每类一张，取自 models-catalog(有落地页的模型) */
/* 被合并 / 下线的落地页(redirects.ts)不加链接 */
const hasPage = (slug: string) => !(slug in MERGED) && !REMOVED.has(slug);
const modelRows = (t: ModelType) => modelsOfType(t).map((m) => [hasPage(m.slug) ? `[${m.name}](/${m.slug})` : m.name, m.vendor, m.desc]);
const countOf = (t: ModelType) => modelsOfType(t).length;

export const FACTS: Guide[] = [
  /* ───────────── Is BuzzVideo free? ───────────── */
  {
    slug: "is-buzzvideo-free",
    group: "Questions",
    title: "Is BuzzVideo Free? What the Free Plan Includes | BuzzVideo",
    description: `Is BuzzVideo free? You can start free with ${SIGNUP_CREDITS} one-time credits for images and audio. Video needs a paid plan, and Free work carries a watermark.`,
    h1: "Is BuzzVideo free?",
    answer: `You can start for free, but video generation is not free. New accounts get ${SIGNUP_CREDITS} one-time credits that work on Seedream 4.5 and Seedream 5.0 lite images, Seed Audio 1.0 audio and the AI Image Upscaler. Video models need a Starter, Pro or Ultra plan, and work made on the Free plan carries a watermark.`,
    card: `${SIGNUP_CREDITS} free credits for images and audio. Video needs a paid plan.`,
    media: { from: "image", match: "beside her cheek", caption: "A creator-style product portrait made on BuzzVideo." },
    sections: [
      {
        id: "what-free-includes",
        h2: "What does the BuzzVideo Free plan include?",
        blocks: [
          { kind: "p", text: "The Free plan is for trying BuzzVideo before you pay. You need a free account to generate anything; there is no generation without signing up." },
          {
            kind: "table",
            head: ["Feature", "Free plan"],
            rows: [
              ["Credits", `${SIGNUP_CREDITS}, one time (they don't refill)`],
              ["Image models", "Seedream 4.5, Seedream 5.0 lite"],
              ["Audio", "Seed Audio 1.0"],
              ["AI Image Upscaler", "Yes"],
              ["Video generation", "No"],
              ["Marketing Agent", "Yes"],
              ["BuzzVideo MCP (ChatGPT, Claude)", "Yes"],
              ["Watermark", "Yes, on work made on Free"],
              ["Parallel generations", "1 at a time"],
            ],
          },
        ],
      },
      {
        id: "free-video",
        h2: "Can I make AI videos on BuzzVideo for free?",
        blocks: [
          { kind: "p", text: `No. Every video model, including Seedance, Kling, Wan and MiniMax, needs a paid plan. The free credits only cover ${FREE_MODELS}.` },
          { kind: "p", text: `Starter includes most video models: ${STARTER_VIDEO}. Seedance 2.5 and Seedance 2.0 need Pro or Ultra.` },
        ],
      },
      {
        id: "watermark",
        h2: "Does the Free plan add a watermark?",
        blocks: [
          { kind: "p", text: "Yes. Images and audio made on the Free plan carry a watermark. Starter, Pro and Ultra remove it. See [Does BuzzVideo add a watermark?](/buzzvideo-watermark) for details." },
        ],
      },
      {
        id: "upgrade",
        h2: "How do I upgrade from the Free plan?",
        blocks: [
          {
            kind: "ol",
            items: [
              "Open the pricing page from your BuzzVideo account.",
              "Pick Starter, Pro or Ultra. Pro and Ultra add Seedance 2.5 and Seedance 2.0.",
              "Pay by card. Upgrades take effect right away, and your remaining credits carry over.",
            ],
          },
          { kind: "p", text: "See [How much does BuzzVideo cost?](/how-much-does-buzzvideo-cost) for what each plan costs." },
        ],
      },
    ],
    buzz: {
      title: "How to try BuzzVideo for free",
      steps: ["Create a free BuzzVideo account.", "Generate a product image with Seedream 4.5 or Seedream 5.0 lite.", "Add a voiceover with Seed Audio 1.0, then upgrade when you need video."],
      cta: { label: "Try the AI Image Generator", href: "/ai-image-generator" },
      note: "The credit price shows before you generate, so you always know what a run will cost.",
    },
    faq: [
      { q: "Is BuzzVideo completely free?", a: `No. BuzzVideo has a Free plan with ${SIGNUP_CREDITS} one-time credits for images and audio, and paid Starter, Pro and Ultra plans for video and the rest of the models.` },
      { q: "Do I need to sign up to use BuzzVideo?", a: "Yes. You need a free account to generate anything. Creating the account is free, and it comes with the one-time sign-up credits." },
      { q: "Do the free credits refill every month?", a: `No. The ${SIGNUP_CREDITS} free credits are a one-time grant. Monthly credits come with the Starter, Pro and Ultra plans.` },
      { q: "Which models can I use with free credits?", a: `Seedream 4.5 and Seedream 5.0 lite for images, Seed Audio 1.0 for voice and music, and the AI Image Upscaler. Video models are not included.` },
      { q: "Is the Marketing Agent free?", a: "Yes. The Marketing Agent is included on every plan, including Free. What it can generate for you on Free is limited to the free models." },
      { q: "Can I use BuzzVideo in ChatGPT or Claude for free?", a: "Yes. BuzzVideo MCP is listed on every plan, including Free. Generations made through it use your BuzzVideo credits and plan, so video still needs a paid plan." },
    ],
    sources: [PRICING],
    related: ["/how-much-does-buzzvideo-cost", "/buzzvideo-watermark", "/buzzvideo-credits-per-video", "/create-ai-product-videos-free", "/faq"],
  },

  /* ───────────── How much does BuzzVideo cost? ───────────── */
  {
    slug: "how-much-does-buzzvideo-cost",
    group: "Questions",
    title: "How Much Does BuzzVideo Cost? Plans & Pricing | BuzzVideo",
    description: `How much does BuzzVideo cost? Starter is $${MONTHLY.starter} a month or $${PLANS.starter.perMonth} billed yearly, Pro $${MONTHLY.pro} or $${PLANS.pro.perMonth}, Ultra $${MONTHLY.ultra} or $${PLANS.ultra.perMonth}. Free to start.`,
    h1: "How much does BuzzVideo cost?",
    answer: `BuzzVideo is free to start, and paid plans begin at $${MONTHLY.starter} a month, or $${PLANS.starter.perMonth} a month billed yearly. On the pricing page on November 26, 2026, Starter is $${MONTHLY.starter}, Pro is $${MONTHLY.pro} and Ultra is $${MONTHLY.ultra} a month on monthly billing, or $${PLANS.starter.perMonth}, $${PLANS.pro.perMonth} and $${PLANS.ultra.perMonth} a month on yearly billing, and Enterprise is priced by quote. Each plan gives you monthly credits, and each generation spends credits based on the model and settings.`,
    card: "Free, then Starter, Pro and Ultra, plus Enterprise by quote.",
    sections: [
      {
        id: "plans",
        h2: "What are BuzzVideo's plans and prices?",
        blocks: [
          {
            kind: "table",
            head: ["Plan", "Billed yearly", "Billed monthly", "Credits each month", "Video models"],
            rows: [
              ["Free", "$0", "$0", `${SIGNUP_CREDITS} one-time`, "No"],
              ["Starter", yearly(PLANS.starter), `$${MONTHLY.starter}/month`, cr(PLANS.starter), "Most, not Seedance 2.5 or 2.0"],
              ["Pro", yearly(PLANS.pro), `$${MONTHLY.pro}/month`, cr(PLANS.pro), "All, including Seedance 2.5"],
              ["Ultra", yearly(PLANS.ultra), `$${MONTHLY.ultra}/month`, cr(PLANS.ultra), "All, including Seedance 2.5"],
              ["Enterprise", "Contact sales", "Contact sales", "Custom allocation", "All"],
            ],
          },
          { kind: "note", text: "Prices are as listed on buzzvideo.ai/pricing on November 26, 2026. Credits are each plan's standard monthly amount; the pricing page may show extra bonus credits during a promotion, and it is always the source of truth." },
        ],
      },
      {
        id: "differences",
        h2: "What is the difference between Starter, Pro and Ultra?",
        blocks: [
          {
            kind: "table",
            head: ["", "Starter", "Pro", "Ultra"],
            rows: [
              ["Seedance 2.5 and 2.0", "No", "Yes", "Yes"],
              ["All image models", "Yes", "Yes", "Yes"],
              ["No watermark", "Yes", "Yes", "Yes"],
              ["Parallel generations", "Up to 4", "Up to 8", "Up to 12"],
              ["Technical support", "No", "Yes", "Yes"],
            ],
          },
          { kind: "p", text: "Starter, Pro and Ultra are for one person. Shared workspaces, seats and API access come with [Enterprise](/enterprise)." },
        ],
      },
      {
        id: "credits",
        h2: "How do BuzzVideo credits work?",
        blocks: [
          { kind: "p", text: "Every generation costs credits. The price depends on the model, length and resolution, and it shows next to the Create button before you generate. See [How many credits does a BuzzVideo video cost?](/buzzvideo-credits-per-video) for a table by model." },
          {
            kind: "ul",
            items: [
              "Plan credits reset monthly and don't roll over.",
              "Yearly plans deliver credits monthly on your subscription date.",
              "One-time bonus credits never expire and work like purchased credits.",
            ],
          },
        ],
      },
      {
        id: "cancel-refund",
        h2: "Can I cancel, and does BuzzVideo give refunds?",
        blocks: [
          { kind: "p", text: "You can cancel anytime with no cancellation fee. You keep your plan and remaining credits until the end of the billing period, then move to Free." },
          { kind: "p", text: "BuzzVideo doesn't offer routine refunds. Refunds may be considered where the law requires them or in special circumstances, and may be adjusted for credits already used." },
        ],
      },
    ],
    buzz: {
      title: "How to pick a plan",
      steps: ["Start on Free to try images and audio.", "Choose Starter if you need video with Kling, Wan or MiniMax.", "Choose Pro or Ultra for Seedance 2.5 and more parallel generations."],
      cta: { label: "Compare all models", href: "/models" },
    },
    faq: [
      { q: "How much is BuzzVideo per month?", a: `Starter is $${MONTHLY.starter}, Pro is $${MONTHLY.pro} and Ultra is $${MONTHLY.ultra} a month on monthly billing. On yearly billing they work out to $${PLANS.starter.perMonth}, $${PLANS.pro.perMonth} and $${PLANS.ultra.perMonth} a month, as listed on the pricing page on November 26, 2026.` },
      { q: "Is BuzzVideo cheaper on yearly billing?", a: `Yes. Yearly billing brings Starter from $${MONTHLY.starter} to $${PLANS.starter.perMonth} a month, Pro from $${MONTHLY.pro} to $${PLANS.pro.perMonth} and Ultra from $${MONTHLY.ultra} to $${PLANS.ultra.perMonth}. Yearly plans are paid up front and deliver credits monthly.` },
      { q: "Is there a free plan?", a: `Yes. The Free plan gives ${SIGNUP_CREDITS} one-time credits for Seedream 4.5 and Seedream 5.0 lite images, Seed Audio 1.0 and the AI Image Upscaler. It does not include video generation.` },
      { q: "Which plan do I need for Seedance 2.5?", a: "Pro or Ultra. Starter includes most video models, such as Kling 4.0, Wan 3.0 and Seedance 2.5 Flash, but not Seedance 2.5 or Seedance 2.0." },
      { q: "What happens if I upgrade mid-cycle?", a: "The upgrade takes effect right away. You pay the full new plan price, a new billing cycle starts, unused days aren't refunded and your remaining credits carry over." },
      { q: "What happens if I downgrade?", a: "The downgrade takes effect at the end of the current billing period. Unused credits are forfeited at renewal." },
      { q: "Does BuzzVideo have a team or enterprise plan?", a: "Yes. Enterprise adds shared workspaces, seat management, custom credit allocation, API access, an SLA and an account manager. Contact sales for a quote." },
    ],
    sources: [PRICING],
    related: ["/is-buzzvideo-free", "/buzzvideo-credits-per-video", "/enterprise", "/models", "/faq"],
  },

  /* ───────────── Credits per video ───────────── */
  {
    slug: "buzzvideo-credits-per-video",
    group: "Questions",
    title: "How Many Credits Does a BuzzVideo Video Cost? | BuzzVideo",
    description: "How many credits a BuzzVideo video costs by model, length and resolution: Seedance, Kling, Wan and MiniMax, from 34 credits for a 5-second clip.",
    h1: "How many credits does a BuzzVideo video cost?",
    answer: "A 5-second BuzzVideo clip costs from 34 credits (Seedance 2.0 Mini at 480p) to 569 credits (Seedance 2.5 at 1080p) in the current price list, and longer clips cost proportionally more. The price depends on the model, length and resolution, and it always shows next to the Create button before you generate.",
    card: "From 34 credits for 5 seconds. Price shows before you generate.",
    media: { from: "video", match: "A product commercial made from photos", caption: "A 9:16 video ad made on BuzzVideo." },
    sections: [
      {
        id: "video-table",
        h2: "How many credits does each video model cost?",
        blocks: [
          { kind: "p", text: "Credits for a clip with no video reference, with sound on where the model allows it." },
          {
            kind: "table",
            head: ["Model", "Resolution", "5 seconds", "10 seconds", "15 seconds", "Max length"],
            rows: [
              ["[Seedance 2.5](/seedance-2-5)", "480p / 720p / 1080p", "103 / 232 / 569", "206 / 463 / 1,138", "309 / 694 / 1,706", "30s: 617 / 1,387 / 3,412"],
              ["[Seedance 2.0](/seedance-2-0)", "480p / 720p / 1080p / 4K", "69 / 145 / 377 / 778", "137 / 289 / 754 / 1,556", "205 / 433 / 1,131 / 2,333", "15s"],
              ["Seedance 2.0 Fast", "480p / 720p", "55 / 116", "109 / 231", "164 / 346", "15s"],
              ["Seedance 2.0 Mini", "480p / 720p", "34 / 72", "68 / 145", "102 / 216", "15s"],
              ["[Kling 4.0](/kling-4-0)", "720p / 1080p", "157 / 235", "314 / 470", "471 / 705", "30s: 942 / 1,410"],
              ["[Kling 3.0](/kling-3-0)", "Standard / Pro / 4K", "100 / 135 / 335", "200 / 270 / 670", "300 / 405 / 1,005", "15s"],
              ["[Wan 3.0](/wan-3-0)", "480p / 720p / 1080p", "50 / 100 / 200", "100 / 200 / 400", "150 / 300 / 600", "30s: 300 / 600 / 1,200"],
              ["[MiniMax H3](/minimax-h3)", "768p / 2K / 4K", "75 / 163 / 200", "150 / 325 / 400", "225 / 488 / 600", "15s"],
              ["MiniMax H3 Max", "480p / 768p / 1080p", "50 / 80 / 160", "100 / 160 / 320", "150 / 240 / 480", "15s"],
              ["Gemini Omni Flash", "720p", "4s: 81", "203", "Not available", "10s"],
            ],
          },
          { kind: "note", text: "From BuzzVideo's price list on November 26, 2026. Prices can change; the price shown in the app before you generate is the one you pay. Kling 3.0 without sound costs less, and adding a video reference to Seedance or MiniMax H3 Max changes the price." },
        ],
      },
      {
        id: "what-changes-price",
        h2: "What changes the credit price of a video?",
        blocks: [
          {
            kind: "ul",
            items: [
              "Length: most models price each second, so a 10-second clip costs about twice a 5-second one.",
              "Resolution: 1080p and 4K cost more than 480p or 720p. Drafting at a low resolution and re-running the keeper at full resolution saves credits.",
              "Model: Seedance 2.5 is the most expensive per second; Seedance 2.0 Mini and Wan 3.0 at 480p are the cheapest.",
              "Sound and references: on some models, turning sound off or adding a video reference changes the price.",
            ],
          },
        ],
      },
      {
        id: "image-table",
        h2: "How many credits does an image cost?",
        blocks: [
          {
            kind: "table",
            head: ["Model", "Credits per image"],
            rows: [
              ["[Seedream 4.5](/seedream-4-5)", "8"],
              ["Seedream 5.0 lite", "7"],
              ["Seedream 5.0 Pro", "9 to 18"],
              ["[Nano Banana 2.1](/nano-banana-2-1)", "7 to 23, by resolution"],
              ["Nano Banana Pro", "27 to 48, by resolution"],
              ["GPT Image 2.5 Sunburst", "1 to 43, by quality and ratio"],
            ],
          },
          { kind: "p", text: "Models not listed here show their price in the app before you generate." },
        ],
      },
      {
        id: "failed",
        h2: "Do I lose credits if a generation fails?",
        blocks: [
          { kind: "p", text: "No. BuzzVideo's Terms of Service say credits for failed generations are returned automatically." },
        ],
      },
    ],
    buzz: {
      title: "How to see the price before you generate",
      steps: ["Open the AI Video Generator and pick a model.", "Set the length and resolution.", "Read the credit price next to the Create button, then generate."],
      cta: { label: "Open the AI Video Generator", href: "/ai-video-generator" },
    },
    faq: [
      { q: "What is the cheapest video model on BuzzVideo?", a: "In the current price list, Seedance 2.0 Mini at 480p is the cheapest at 34 credits for 5 seconds. Wan 3.0 and MiniMax H3 Max at 480p cost 50 credits for 5 seconds." },
      { q: "How many credits is a 30-second video?", a: "Only Seedance 2.5, Kling 4.0 and Wan 3.0 make 30-second takes in this table. A 30-second clip costs 300 to 1,200 credits on Wan 3.0, 942 to 1,410 on Kling 4.0 and 617 to 3,412 on Seedance 2.5, depending on resolution." },
      { q: "How much does Seedance 2.5 cost on BuzzVideo?", a: "232 credits for 5 seconds at 720p and 569 credits at 1080p. Seedance 2.5 is on the Pro and Ultra plans. See [Seedance 2.5 pricing](/seedance-2-5-pricing) for more." },
      { q: "How much does Kling 4.0 cost on BuzzVideo?", a: "157 credits for 5 seconds at 720p and 235 credits at 1080p, up to 1,410 credits for 30 seconds at 1080p. See [Kling 4.0 pricing](/kling-4-0-pricing)." },
      { q: "Can I use free credits for video?", a: `No. The ${SIGNUP_CREDITS} free credits work only on Seedream 4.5, Seedream 5.0 lite, Seed Audio 1.0 and the AI Image Upscaler. Video needs a Starter, Pro or Ultra plan.` },
    ],
    sources: [PRICING, TERMS],
    related: ["/how-much-does-buzzvideo-cost", "/seedance-2-5-pricing", "/kling-4-0-pricing", "/best-ai-video-models", "/models"],
  },

  /* ───────────── Watermark ───────────── */
  {
    slug: "buzzvideo-watermark",
    group: "Questions",
    title: "Does BuzzVideo Add a Watermark? Free vs Paid | BuzzVideo",
    description: "Does BuzzVideo add a watermark? Only on the Free plan. Starter, Pro, Ultra and Enterprise remove it, so paid-plan videos and images export clean.",
    h1: "Does BuzzVideo add a watermark?",
    answer: "Only on the Free plan. Work made on the Free plan carries a BuzzVideo watermark, and Starter, Pro, Ultra and Enterprise remove it. Since video generation needs a paid plan anyway, every BuzzVideo video comes without a watermark.",
    card: "Watermark on Free only. Paid plans export clean.",
    sections: [
      {
        id: "by-plan",
        h2: "Which BuzzVideo plans have a watermark?",
        blocks: [
          {
            kind: "table",
            head: ["Plan", "Watermark"],
            rows: [
              ["Free", "Yes"],
              ["Starter", "No"],
              ["Pro", "No"],
              ["Ultra", "No"],
              ["Enterprise", "No"],
            ],
          },
        ],
      },
      {
        id: "video",
        h2: "Do BuzzVideo videos have a watermark?",
        blocks: [
          { kind: "p", text: "No. Video models are only available on Starter, Pro, Ultra and Enterprise, and none of those plans add a watermark. The watermark applies to images and audio made with free credits." },
        ],
      },
      {
        id: "remove",
        h2: "How do I remove the BuzzVideo watermark?",
        blocks: [
          { kind: "p", text: "Upgrade to any paid plan. New work you generate after upgrading comes without a watermark. See [How much does BuzzVideo cost?](/how-much-does-buzzvideo-cost) for the plans." },
        ],
      },
    ],
    buzz: {
      title: "How to get watermark-free work",
      steps: ["Upgrade to Starter, Pro or Ultra.", "Generate your video or image.", "Download it from your library without a watermark."],
      cta: { label: "Open the AI Video Generator", href: "/ai-video-generator" },
    },
    faq: [
      { q: "Does the Free plan add a watermark?", a: "Yes. Work made on the Free plan carries a watermark. Starter, Pro and Ultra remove it." },
      { q: "Does Starter have a watermark?", a: "No. Starter, the lowest paid plan, already removes the watermark." },
      { q: "Can I remove the watermark from work I made on Free?", a: "Upgrade to a paid plan and generate it again. Work generated after you upgrade comes without a watermark." },
      { q: "Do videos made through BuzzVideo MCP have a watermark?", a: "Not on a paid plan. MCP uses the same account and plan as the web app, so the same watermark rules apply." },
    ],
    sources: [PRICING],
    related: ["/is-buzzvideo-free", "/how-much-does-buzzvideo-cost", "/buzzvideo-commercial-use", "/faq"],
  },

  /* ───────────── Commercial use ───────────── */
  {
    slug: "buzzvideo-commercial-use",
    group: "Questions",
    title: "Can I Use BuzzVideo Videos in Commercial Ads? | BuzzVideo",
    description: "Yes. What you generate on BuzzVideo can be used commercially on every plan: ads, social posts, product pages and client work. What the Terms say.",
    h1: "Can I use BuzzVideo videos in commercial ads?",
    answer: "Yes. Everything you generate on BuzzVideo can be used commercially on every plan, covering ads, social posts, product pages and paid client work. BuzzVideo's Terms of Service give you a royalty-free, perpetual, worldwide license to use, modify and distribute what you generate, including to earn revenue from it. Video generation needs a Starter, Pro or Ultra plan, and those plans export without a watermark.",
    card: "Yes: ads, social, product pages and client work.",
    legal: true,
    media: { from: "video", match: "creator-style product review", caption: "A UGC-style ad made on BuzzVideo. The person is an AI character." },
    sections: [
      {
        id: "where",
        h2: "Where can I use BuzzVideo videos commercially?",
        blocks: [
          { kind: "p", text: "BuzzVideo's Terms license what you generate for commercial use, and its pricing page gives these examples:" },
          { kind: "ul", items: ["Paid ads on TikTok, Meta, YouTube and other platforms.", "Organic social posts.", "Product pages and online stores.", "Paid client work, if you are an agency or freelancer."] },
          { kind: "p", text: "Video generation is only available on paid plans, so every BuzzVideo video comes without a watermark. Images and audio made on the Free plan can be used commercially too, but they carry a watermark." },
        ],
      },
      {
        id: "ownership",
        h2: "Who owns the videos I make with BuzzVideo?",
        blocks: [
          { kind: "p", text: "The Terms of Service don't describe it as ownership. Section 5.1 grants you a royalty-free, perpetual, irrevocable, worldwide, non-exclusive license to use, modify and distribute your output and to earn revenue from it." },
          { kind: "p", text: "Section 8.1 adds that AI output may not be protectable by intellectual property rights. In practice, that means you can use the video, but you may not be able to stop others from using similar AI output." },
          { kind: "p", text: "BuzzVideo does not use your prompts, uploads or generated content to train AI models (Terms 6.2 and 8.3, and the Privacy Policy). Enterprise customers have separate terms." },
        ],
      },
      {
        id: "your-responsibility",
        h2: "What am I responsible for when I run BuzzVideo videos as ads?",
        blocks: [
          {
            kind: "ul",
            items: [
              "Your inputs: the Terms make you responsible for the content you upload and the output made from it.",
              "Real people: if a video uses a real person's face or voice, you need that person's express written consent covering commercial use (Terms 8.6).",
              "Brands and music: don't upload logos, characters or audio you don't have rights to.",
              "Ad claims and disclosure: claims in the ad, and each platform's AI-disclosure rules, are still on you. See [AI UGC ads](/ai-ugc-ads).",
            ],
          },
        ],
      },
    ],
    buzz: {
      title: "How to make an ad you can run",
      steps: ["Upload your own product photo or link.", "Generate the video with the AI Ad Generator.", "Add any AI disclosure the ad platform requires, then publish."],
      cta: { label: "Open the AI Ad Generator", href: "/ai-ad-generator" },
    },
    faq: [
      { q: "Can I use BuzzVideo videos for client work?", a: "Yes. Paid client work is one of the commercial uses BuzzVideo's pricing page lists. Reselling access to BuzzVideo itself, or sharing one account among unrelated users, is not allowed." },
      { q: "Do I own the copyright to BuzzVideo videos?", a: "The Terms of Service grant you a perpetual, worldwide license to use and earn from your output rather than describing ownership, and they note AI output may not be protectable by IP rights. Ask a lawyer if copyright ownership matters for your use; this page is not legal advice." },
      { q: "Does BuzzVideo train on my videos?", a: "No. The Terms and the Privacy Policy say BuzzVideo does not use your prompts, uploads or generated content to train AI or machine learning models." },
      { q: "Can I use a real person's face in a commercial BuzzVideo ad?", a: "Only with that person's express written consent covering your intended use, including commercial use. The Terms also forbid making it look like someone said or did something they did not." },
      { q: "Can I use Free-plan images commercially?", a: "Yes. The license in BuzzVideo's Terms covers what you generate on every plan, including Free. Free-plan work carries a watermark, so for ads most people move to a paid plan, which removes it." },
    ],
    sources: [TERMS, PRICING, PRIVACY],
    related: ["/buzzvideo-watermark", "/ai-ugc-ads", "/ai-ad-generator", "/content-policy", "/trust"],
  },

  /* ───────────── Is BuzzVideo legit? ───────────── */
  {
    slug: "is-buzzvideo-legit",
    group: "Questions",
    title: "Is BuzzVideo Legit and Safe to Use? | BuzzVideo",
    description: "Is BuzzVideo legit? It is run by PressLogic Limited, takes card payments through Stripe and doesn't train AI on your content. Safety facts in one place.",
    h1: "Is BuzzVideo legit and safe to use?",
    answer: "Yes. BuzzVideo is an AI ad generator run by PressLogic Limited, with published Terms of Service and a Privacy Policy. Payments are processed by Stripe, BuzzVideo says it does not use your prompts, uploads or generated content to train AI models, and you can cancel a plan anytime.",
    card: "Run by PressLogic Limited. Stripe payments. No training on your content.",
    sections: [
      {
        id: "who",
        h2: "Who runs BuzzVideo?",
        blocks: [
          { kind: "p", text: "BuzzVideo is operated by PressLogic Limited, the company named on buzzvideo.ai. Its Terms of Service are governed by the laws of the Hong Kong Special Administrative Region." },
          { kind: "p", text: "BuzzVideo is not the ByteDance video app of the same name, which shut down at the end of 2022. See [What is BuzzVideo used for?](/what-is-buzzvideo)." },
        ],
      },
      {
        id: "payments",
        h2: "Is it safe to pay for BuzzVideo?",
        blocks: [
          {
            kind: "ul",
            items: [
              "Card details are collected and processed directly by Stripe; BuzzVideo receives only limited billing data.",
              "Plans are billed in advance, monthly or yearly.",
              "You can cancel anytime with no cancellation fee and keep access until the end of the billing period.",
              "Refunds aren't routine but may be considered where the law requires or in special circumstances.",
            ],
          },
        ],
      },
      {
        id: "data",
        h2: "What does BuzzVideo do with my data?",
        blocks: [
          {
            kind: "table",
            head: ["Question", "What the Privacy Policy says"],
            rows: [
              ["Is my content used to train AI?", "No. Prompts, uploads and generated content are not used to train AI or machine learning models."],
              ["Is my data sold?", "No."],
              ["Who else sees my inputs?", "The AI model providers that run your generation, such as Google and ByteDance."],
              ["How do I delete things?", "Delete items in Assets; they are removed from active systems within 30 days. You can also request account deletion."],
              ["How is it protected?", "Industry-standard measures such as encryption and access controls."],
            ],
          },
        ],
      },
      {
        id: "content-safety",
        h2: "How does BuzzVideo handle harmful content?",
        blocks: [
          { kind: "p", text: "BuzzVideo's Terms prohibit unlawful, harassing, pornographic, hateful and misleading content, and content harmful to minors. Using a real person's face or voice requires their express written consent. BuzzVideo can remove content that breaks the rules and close the account." },
          { kind: "p", text: "Read the full rules in the [BuzzVideo Content Policy](/content-policy) and the security overview on [Trust & Safety](/trust)." },
        ],
      },
    ],
    buzz: {
      title: "How to check BuzzVideo before you pay",
      steps: ["Create a free account.", "Try image and audio generation with the free credits.", "Upgrade by card through Stripe when you need video."],
      cta: { label: "Try the AI Image Generator", href: "/ai-image-generator" },
    },
    faq: [
      { q: "Is BuzzVideo a scam?", a: "No. BuzzVideo is a paid AI ad generator run by PressLogic Limited, with published terms, a privacy policy, a Free plan to try it and cancel-anytime subscriptions." },
      { q: "Is BuzzVideo safe for my credit card?", a: "Card payments are collected and processed by Stripe, not stored by BuzzVideo. BuzzVideo receives only limited billing data." },
      { q: "Does BuzzVideo use my uploads to train AI?", a: "No. Both the Terms of Service and the Privacy Policy say BuzzVideo does not use your prompts, uploads or generated content to train AI or machine learning models." },
      { q: "Is BuzzVideo owned by ByteDance?", a: "No. BuzzVideo is run by PressLogic Limited. It offers ByteDance models such as Seedance and Seedream, but it is not the ByteDance app that used the same name until 2022." },
      { q: "How old do I have to be to use BuzzVideo?", a: "At least 13, or 16 in the EEA, UK and Switzerland. Users under 18 need a parent or guardian's permission and supervision." },
      { q: "Does BuzzVideo offer SOC 2 reports?", a: "Yes, for Enterprise customers, along with a custom DPA and data residency options. Contact sales." },
    ],
    sources: [TERMS, PRIVACY, PRICING],
    related: ["/trust", "/content-policy", "/what-is-buzzvideo", "/enterprise", "/faq"],
  },

  /* ───────────── Which AI models? ───────────── */
  {
    slug: "buzzvideo-ai-models",
    group: "Questions",
    title: "Which AI Models Can I Use on BuzzVideo? | BuzzVideo",
    description: "Which AI models are on BuzzVideo? Video models like Seedance 2.5, Kling 4.0 and Wan 3.0, image models like Nano Banana 2.1, plus voice and music models.",
    h1: "Which AI models can I use on BuzzVideo?",
    answer: `BuzzVideo has ${countOf("video")} video models, ${countOf("image")} image models and ${countOf("audio")} audio models with their own pages, from ByteDance, Google, OpenAI, Kuaishou, Alibaba, MiniMax, xAI, ElevenLabs and others. Headline models include Seedance 2.5, Kling 4.0 and Wan 3.0 for video, Nano Banana 2.1 and GPT Image 2.6 Sunburst for images, and Seed Audio 1.0 for voice and music.`,
    card: `${MODELS.length} models across video, image and audio in one account.`,
    sections: [
      {
        id: "video",
        h2: "Which AI video models are on BuzzVideo?",
        blocks: [
          { kind: "table", head: ["Model", "Maker", "Best for"], rows: modelRows("video") },
          { kind: "p", text: "Video models need a paid plan. Seedance 2.5 and Seedance 2.0 are on Pro and Ultra; Starter includes most of the others." },
        ],
      },
      {
        id: "image",
        h2: "Which AI image models are on BuzzVideo?",
        blocks: [
          { kind: "table", head: ["Model", "Maker", "Best for"], rows: modelRows("image") },
          { kind: "p", text: "Seedream 4.5 and Seedream 5.0 lite work with the free credits new accounts get. Starter and up include all image models." },
        ],
      },
      {
        id: "audio",
        h2: "Which AI voice and music models are on BuzzVideo?",
        blocks: [
          { kind: "table", head: ["Model", "Maker", "Best for"], rows: modelRows("audio") },
          { kind: "p", text: "Seed Audio 1.0 works with the free credits. The [Models](/models) page also lists tool models, such as lip sync, avatars and upscalers, that power BuzzVideo's tool pages." },
        ],
      },
      {
        id: "choose",
        h2: "How do I choose a model on BuzzVideo?",
        blocks: [
          {
            kind: "ul",
            items: [
              "Long single takes up to 30 seconds: Seedance 2.5, Kling 4.0 or Wan 3.0.",
              "Talking people with native audio and lip sync: MiniMax H3 or Kling 4.0.",
              "Cheap drafts and tests: Seedance 2.0 Mini or Wan 3.0 at 480p.",
              "Text inside images: Nano Banana Pro, GPT Image 2 or Seedream 4.5.",
              "Not sure: describe the job to the Marketing Agent and it picks a model.",
            ],
          },
          { kind: "p", text: "See [Best AI video models](/best-ai-video-models) for a side-by-side comparison." },
        ],
      },
    ],
    buzz: {
      title: "How to use any model on BuzzVideo",
      steps: ["Open the AI Video or Image Generator.", "Pick the model from the model menu, or let the Marketing Agent choose.", "Check the credit price, then generate."],
      cta: { label: "See all models", href: "/models" },
    },
    faq: [
      { q: "Does BuzzVideo have Seedance 2.5?", a: "Yes. Seedance 2.5 makes 4 to 30 second clips at up to 1080p and is on the Pro and Ultra plans." },
      { q: "Does BuzzVideo have Kling 4.0?", a: "Yes. Kling 4.0 makes continuous clips up to 30 seconds with sound, and it is included from the Starter plan." },
      { q: "Does BuzzVideo have Veo or Sora?", a: "No. Neither is in BuzzVideo's current model list. Google's models on BuzzVideo include Gemini Omni Flash for video and Nano Banana for images." },
      { q: "Can I use these models in ChatGPT or Claude?", a: "Yes. Through BuzzVideo MCP, ChatGPT, Claude and other MCP clients can call the same models on your BuzzVideo account. See [Video generation MCP](/video-generation-mcp)." },
      { q: "Which BuzzVideo models are free?", a: `Seedream 4.5, Seedream 5.0 lite and Seed Audio 1.0 work with the ${SIGNUP_CREDITS} free credits. Every video model needs a paid plan.` },
    ],
    sources: [PRICING],
    related: ["/models", "/best-ai-video-models", "/buzzvideo-credits-per-video", "/ai-video-generator", "/ai-image-generator"],
  },

  /* ───────────── What is BuzzVideo? ───────────── */
  {
    slug: "what-is-buzzvideo",
    group: "Questions",
    title: "What Is BuzzVideo Used For? AI Ad Generator | BuzzVideo",
    description: "What is BuzzVideo? An AI ad generator that turns a product photo, link or idea into video and image ads, with leading AI models and a Marketing Agent.",
    h1: "What is BuzzVideo used for?",
    answer: "BuzzVideo is an AI ad generator for marketers and creators. It brings AI video, image and audio models into one account, and its Marketing Agent turns a product photo, product link or idea into campaign-ready video and image ads. It is run by PressLogic Limited and is not related to ByteDance's former BuzzVideo app.",
    card: "An AI ad generator: product photo, link or idea in, ads out.",
    media: { from: "video", match: "product page link", caption: "A vertical ad made from a product page link on BuzzVideo." },
    sections: [
      {
        id: "uses",
        h2: "What do people use BuzzVideo for?",
        blocks: [
          {
            kind: "ul",
            items: [
              "Video ads for TikTok, Reels and Meta from one product photo or a product page link. See the [AI Ad Generator](/ai-ad-generator).",
              "UGC-style ads with an AI creator talking about the product. See the [AI UGC Video Generator](/ai-ugc-video-generator).",
              "Product videos such as unboxings, demos and turnarounds. See the [AI Product Video Generator](/ai-product-video-generator).",
              "Product photos, static ads and voiceovers with image and audio models.",
              "Making videos and images from ChatGPT or Claude through BuzzVideo MCP.",
            ],
          },
        ],
      },
      {
        id: "how",
        h2: "How does BuzzVideo work?",
        blocks: [
          {
            kind: "ol",
            items: [
              "Tell the Marketing Agent what you are selling, or open a video, image or audio tool directly.",
              "Add a product photo, link or reference, and pick a model or let the agent choose.",
              "Check the credit price and generate. Results are saved to your library.",
            ],
          },
          { kind: "p", text: "BuzzVideo is a web app. There is also a [Canvas](/canvas) for chaining images, video and audio on one board." },
        ],
      },
      {
        id: "bytedance",
        h2: "Is this the BuzzVideo app from ByteDance?",
        blocks: [
          { kind: "p", text: "No. ByteDance used to run a video hosting app called BuzzVideo. Archive Team records that app as shut down on December 31, 2022. Today's BuzzVideo at buzzvideo.ai is a different product: an AI ad generator run by PressLogic Limited." },
          { kind: "p", text: "BuzzVideo does offer ByteDance's AI models, such as Seedance and Seedream, alongside models from Google, OpenAI, Kuaishou, Alibaba and others." },
        ],
      },
      {
        id: "who",
        h2: "Who is BuzzVideo for?",
        blocks: [
          { kind: "p", text: "Ecommerce brands, performance marketers, agencies and creators who need many ad variations quickly. Starter, Pro and Ultra are for one person; teams use [Enterprise](/enterprise) for shared workspaces and seats." },
        ],
      },
    ],
    buzz: {
      title: "How to make your first ad",
      steps: ["Open the Marketing Agent.", "Describe your product or paste its link.", "Review the plan and generate the ads."],
      cta: { label: "Open the Marketing Agent", href: "/marketing-agent" },
    },
    faq: [
      { q: "What is BuzzVideo AI?", a: "BuzzVideo is an AI ad generator. It combines video, image and audio models, such as Seedance, Kling, Nano Banana and GPT Image, with a Marketing Agent that turns ideas into ads." },
      { q: "Is BuzzVideo the same as the old BuzzVideo app?", a: "No. The old BuzzVideo was a ByteDance video app that Archive Team records as shut down on December 31, 2022. Today's BuzzVideo is an AI ad generator run by PressLogic Limited." },
      { q: "Does BuzzVideo have a mobile app?", a: "BuzzVideo is a website, not a mobile app: you use it in the browser. You can also use it inside ChatGPT or Claude through BuzzVideo MCP." },
      { q: "Is BuzzVideo free?", a: `You can start free with ${SIGNUP_CREDITS} credits for images and audio. Video needs a paid plan. See [Is BuzzVideo free?](/is-buzzvideo-free).` },
      { q: "Can I use BuzzVideo for ads?", a: "Yes. Ads are what it is built for, and everything you generate can be used commercially on every plan." },
    ],
    sources: [
      { label: "Archive Team wiki: BuzzVideo", url: "https://wiki.archiveteam.org/index.php/BuzzVideo" },
      TERMS,
      PRICING,
    ],
    related: ["/marketing-agent", "/ai-ad-generator", "/is-buzzvideo-legit", "/buzzvideo-ai-models", "/is-buzzvideo-free"],
  },

  /* ───────────── UGC ads ───────────── */
  {
    slug: "buzzvideo-for-ugc-ads",
    group: "Questions",
    title: "Is BuzzVideo Good for UGC Ads? Honest Answer | BuzzVideo",
    description: "Is BuzzVideo good for UGC ads? Yes for testing many creator-style hooks from one product photo; less so for real testimonials or detailed product demos.",
    h1: "Is BuzzVideo good for UGC ads?",
    answer: "Yes, for making and testing many creator-style ads quickly. BuzzVideo turns one product photo and a short brief into a real-looking person talking about your product, with single takes up to 30 seconds on Kling 4.0. It is not a replacement for real customer testimonials, and you should not present an AI person as a real customer.",
    card: "Good for hook testing and volume. Not for real testimonials.",
    media: { from: "video", match: "creator-style product review", caption: "An AI-generated UGC product review made from one product photo. The person is an AI character." },
    sections: [
      {
        id: "good-for",
        h2: "What is BuzzVideo good at for UGC ads?",
        blocks: [
          {
            kind: "ul",
            items: [
              "Hook testing: one product, several hooks, each as its own video.",
              "Volume without logistics: no creator sourcing, product shipping or reshoots.",
              "Consistent product: all versions start from the same product photo, so the label and shape stay the same.",
              "Long single takes: Kling 4.0 and Seedance 2.5 make up to 30 seconds in one take, so the face has fewer cuts to change across.",
              "Other languages: Seed Audio 1.0 voices scripts in 21 languages.",
            ],
          },
        ],
      },
      {
        id: "not-for",
        h2: "When is BuzzVideo not the right choice for UGC?",
        blocks: [
          {
            kind: "ul",
            items: [
              "Real testimonials. An AI person is not a customer, and presenting one as a real reviewer is deceptive.",
              "Detailed demos. If the ad has to show exactly how a product works, real footage is more reliable.",
              "Using a specific real creator. You need their express written consent to use their face or voice.",
              "Free use. UGC videos need a paid plan; the free credits cover images and audio only.",
            ],
          },
        ],
      },
      {
        id: "models",
        h2: "Which BuzzVideo models are best for UGC ads?",
        blocks: [
          {
            kind: "table",
            head: ["Model", "Length", "Why use it for UGC"],
            rows: [
              ["[Kling 4.0](/kling-4-0)", "3 to 30 seconds", "Long single takes with sound"],
              ["[Seedance 2.5](/seedance-2-5)", "4 to 30 seconds", "Up to 30 reference images for the person and product"],
              ["[MiniMax H3](/minimax-h3)", "5 to 15 seconds", "Native audio, lip sync and consistent characters"],
            ],
          },
        ],
      },
      {
        id: "disclosure",
        h2: "Do AI UGC ads need a disclosure?",
        blocks: [
          { kind: "p", text: "Often, yes. TikTok and Meta both have AI-disclosure rules for ads. Check each platform's ad policy before you run them. See [AI UGC ads](/ai-ugc-ads) for what the rules say." },
        ],
      },
    ],
    buzz: {
      title: "How to make a UGC ad on BuzzVideo",
      steps: ["Upload one clear product photo.", "Describe the creator and the hook, or let the agent write three hooks to test.", "Generate in 9:16 and add any required AI disclosure."],
      cta: { label: "Open the AI UGC Video Generator", href: "/ai-ugc-video-generator" },
    },
    faq: [
      { q: "Can BuzzVideo make UGC videos from a product photo?", a: "Yes. One clear product photo and a short brief are enough. BuzzVideo writes the script, generates the person and product shots and adds the voice." },
      { q: "How long can a BuzzVideo UGC ad be?", a: "Up to 30 seconds in one take with Kling 4.0 or Seedance 2.5. MiniMax H3 makes 5 to 15 seconds." },
      { q: "Can I choose what the AI creator looks like?", a: "Yes. Describe the age, look and setting in the brief, or add reference images." },
      { q: "Are BuzzVideo UGC ads free?", a: "No. UGC videos use video models that need a Starter, Pro or Ultra plan." },
      { q: "Can I use a real influencer's face?", a: "Only with their express written consent covering your intended use, including commercial use. BuzzVideo's Terms forbid impersonation." },
    ],
    sources: [TERMS, PRICING],
    related: ["/ai-ugc-video-generator", "/ai-ugc-ads", "/make-ugc-ads-with-ai", "/best-ai-ugc-video-generators", "/do-ugc-ads-work"],
  },
];
