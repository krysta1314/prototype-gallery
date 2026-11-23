// BuzzVideo Academy 解答页 / 教程页内容(2026-11-19)。纯数据，无 React 依赖(meta.ts 也从这里取 title / description)。
// GEO 写法:H1 = 真实搜索问题;answer = 2–3 句可被 AI 直接引用的直答;H2 用问句;步骤用有序列表;
// 「How to do it on BuzzVideo」一段 + CTA(appOf 进对应工具);FAQ 答案先给结论;来源写 URL,页面统一标「Last verified Nov 2026」。
// 事实来源:
//   - 平台规格 / 法规：逐条用 WebFetch 打开官方页面核对(TikTok Ads 帮助中心、Amazon sell.amazon.com、Shopify Help Center、
//     FTC / 16 CFR 255 & 465(Cornell LII 全文)、Meta 帮助中心与透明度中心、Claude 帮助中心)。2026-11-19 核对。
//   - 产品能力：tools/tool-content.ts、v1.12 ai-tools model-tools/specs.ts(Lip Sync / Talking Avatar 时长)、v1.9 mcp 页 FAQ(MCP 连接方式)。
//   - 不编数据：没有官方来源的效果数字(转化率、CTR 提升)一律不写。
// 文案里的 [文字](/href) 会渲染成站内链接(http 开头的是外链)。

import { SIGNUP_CREDITS } from "../tools/credits";

export type MediaRef = { from: "video" | "image" | "audio" | "extra"; match: string; caption: string };
export type Block =
  | { kind: "p"; text: string }
  | { kind: "ol" | "ul"; items: string[] }
  | { kind: "table"; head: string[]; rows: string[][] }
  | { kind: "note"; text: string }
  | { kind: "media"; media: MediaRef };
export type Section = { id: string; h2: string; blocks: Block[] };
export type Source = { label: string; url: string };
export type Term = { term: string; def: string; href?: string };
export type GuideGroup = "Questions" | "How-to guides" | "Specs and reference";

export type Guide = {
  slug: string;
  group: GuideGroup;
  /** <title>,≤60 字符，以 " | BuzzVideo" 结尾 */
  title: string;
  /** meta description,120–160 字符 */
  description: string;
  h1: string;
  /** 2–3 句直答(首段，给 AI 引用) */
  answer: string;
  /** 卡片上的一句话(Academy 总页用) */
  card: string;
  media?: MediaRef;
  sections: Section[];
  buzz: { title: string; steps: string[]; cta: { label: string; href: string }; note?: string };
  faq: { q: string; a: string }[];
  sources: Source[];
  related: string[];
  /** 法律类：页首和来源处标 not legal advice */
  legal?: boolean;
  /** 有步骤的教程：多输出 HowTo 结构化数据 */
  howto?: { name: string; steps: string[] };
  terms?: Term[];
};

const NO_FREE_VIDEO = `Video models on BuzzVideo need a Starter, Pro or Ultra plan. The ${SIGNUP_CREDITS} free credits new accounts get work on Seedream 4.5, Seedream 5.0 lite (images) and Seed Audio 1.0 (voice and music).`;

export const GUIDES: Guide[] = [
  /* ───────────── Can Claude make videos? ───────────── */
  {
    slug: "can-claude-make-videos",
    group: "Questions",
    title: "Can Claude Make Videos? What It Can and Can't Do | BuzzVideo",
    description: "Claude has no built-in model for realistic video. Here is what it can make, what Claude Motion is, and how BuzzVideo MCP lets Claude generate video.",
    h1: "Can Claude make videos?",
    answer:
      "Not on its own. Claude writes scripts, storyboards and prompts, and its Claude Motion beta builds code-based animations, but Anthropic does not ship a model that generates realistic video footage. Connect BuzzVideo MCP and Claude can call video models such as Seedance 2.5, Kling 4.0 and Wan 3.0 from the chat, with the finished clips saved to your BuzzVideo library.",
    card: "Claude needs a video model behind it. BuzzVideo MCP gives it one.",
    media: { from: "video", match: "product page link", caption: "A vertical ad made from a product page link with a BuzzVideo MCP Skill." },
    sections: [
      {
        id: "what-claude-can-make",
        h2: "What can Claude make by itself?",
        blocks: [
          { kind: "p", text: "Claude is a language model. On its own it is strongest at the planning half of a video: the concept, the script, the shot list, the voiceover copy and the prompts you hand to a video model." },
          {
            kind: "ul",
            items: [
              "Scripts, hooks and voiceover copy for ads of any length.",
              "Shot lists and storyboards written out scene by scene.",
              "Prompts tuned for a specific video or image model.",
              "Claude Motion (beta, Team and Enterprise plans): short code-based animations such as explainers and animated charts, downloadable as MP4. Anthropic says it does not use a video generation model, so it cannot produce realistic footage or people.",
            ],
          },
        ],
      },
      {
        id: "what-claude-cannot",
        h2: "Why can't Claude generate realistic video?",
        blocks: [
          { kind: "p", text: "Realistic footage, the kind with people, products and camera moves, comes from dedicated video models. Claude does not include one. What it can do is call one through a connector, which is how most \"Claude video\" workflows work in practice." },
          { kind: "p", text: "Claude supports remote MCP servers as custom connectors. Once a video service is connected, Claude can send it a prompt and your reference images, wait for the render and show you the result in the conversation." },
        ],
      },
      {
        id: "connect-buzzvideo",
        h2: "How do I make videos in Claude with BuzzVideo MCP?",
        blocks: [
          {
            kind: "ol",
            items: [
              "In Claude desktop or claude.ai, open Customize, then Connectors, and choose Add custom connector.",
              "Name it BuzzVideo and paste the connector URL: https://mcp.buzzvideo.ai/mcp",
              "Connect and sign in to your BuzzVideo account once.",
              "Ask for what you need, for example: \"Make a 10-second 9:16 video ad of this product photo with Seedance 2.5.\"",
            ],
          },
          { kind: "note", text: "Claude's help center says custom connectors are available on all Claude plans, with Free limited to one. BuzzVideo MCP itself needs a BuzzVideo Starter, Pro or Ultra plan." },
          { kind: "p", text: "For repeatable jobs, [MCP Skills](/mcp-skills) package a whole workflow, such as turning a product link into an ad or writing new hooks for an ad that already works." },
        ],
      },
      {
        id: "which-models",
        h2: "Which video models can Claude use through BuzzVideo?",
        blocks: [
          { kind: "p", text: "The same models as the BuzzVideo web app, including [Seedance 2.5](/seedance-2-5), Seedance 2.0, [Kling 3.0](/kling-3-0), [MiniMax H3](/minimax-h3) and [Gemini Omni 1.2 Flash](/gemini-omni-1-2-flash) for video, plus image models and Seed Audio 1.0 for voice. BuzzVideo names the model it used in the reply, and you can ask for a specific one." },
        ],
      },
    ],
    buzz: {
      title: "How to do it on BuzzVideo",
      steps: ["Copy the BuzzVideo connector URL from the BuzzVideo MCP page.", "Add it in Claude under Customize, then Connectors.", "Ask Claude for the video, attaching a product photo or link if you have one."],
      cta: { label: "Connect BuzzVideo MCP", href: "/mcp" },
      note: "Everything you generate from Claude lands in the same BuzzVideo library and uses the same plan as the web app.",
    },
    faq: [
      { q: "Can Claude generate videos?", a: "Not by itself. Claude has no built-in video generation model. It can write the script and prompts, and with a connector such as BuzzVideo MCP it can call a video model and return the clip in the chat." },
      { q: "What is Claude Motion?", a: "A beta Claude feature on Team and Enterprise plans that builds short animations as code, such as explainers and animated charts, and exports them as MP4. Anthropic says it does not use a video model, so it cannot make realistic footage or people." },
      { q: "Can Claude make AI avatar or UGC videos?", a: "Only through a connected video service. With BuzzVideo MCP, Claude can ask for a creator-style video or a talking presenter, and BuzzVideo generates it with a video model." },
      { q: "Is BuzzVideo MCP free to use in Claude?", a: `No. Adding a custom connector in Claude is available on Claude's plans, but BuzzVideo MCP needs a BuzzVideo Starter, Pro or Ultra plan. The ${SIGNUP_CREDITS} free credits new BuzzVideo accounts get are for the web app's Seedream images and Seed Audio 1.0.` },
      { q: "Does the same setup work in ChatGPT?", a: "Yes. BuzzVideo MCP also works in ChatGPT and other MCP-compatible clients. See the [ChatGPT Video Generator](/chatgpt-video-generator) page." },
    ],
    sources: [
      { label: "Claude Help Center: Get started with Claude Motion", url: "https://support.claude.com/en/articles/17454997-get-started-with-claude-motion" },
      { label: "Claude Help Center: Get started with custom connectors using remote MCP", url: "https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp" },
      { label: "Claude plans and pricing", url: "https://claude.com/pricing" },
    ],
    related: ["/claude-video-generator", "/mcp", "/mcp-skills", "/chatgpt-video-generator"],
    howto: { name: "How to make videos in Claude with BuzzVideo MCP", steps: ["Open Customize, then Connectors, in Claude and choose Add custom connector.", "Paste the BuzzVideo connector URL https://mcp.buzzvideo.ai/mcp and name it BuzzVideo.", "Connect and sign in to BuzzVideo.", "Ask Claude for the video you want."] },
  },

  /* ───────────── Do UGC ads work? ───────────── */
  {
    slug: "do-ugc-ads-work",
    group: "Questions",
    title: "Do UGC Ads Work? When They Win and Fail | BuzzVideo",
    description: "UGC ads often work on TikTok and Reels because they look like posts, not ads. Learn when they win, when they fail and how to test them with AI.",
    h1: "Do UGC ads work?",
    answer:
      "Often, yes. UGC ads, short videos of a person talking about or using a product, tend to suit TikTok, Reels and Shorts because they look like the posts around them. They are not a guarantee: the hook, the product and the offer decide results, so the reliable approach is to test several UGC versions against your current ads and keep what wins.",
    card: "Why creator-style ads fit TikTok and Reels, and how to test them.",
    media: { from: "video", match: "applying skincare and talking", caption: "A creator-style skincare video made with Seedance 2.0 on BuzzVideo." },
    sections: [
      {
        id: "why",
        h2: "Why do UGC ads work?",
        blocks: [
          { kind: "ul", items: [
            "They look native. A person filming on a phone blends into a For You or Reels feed in a way a studio spot does not.",
            "They show the product in use, which answers \"what is it and does it work\" in seconds.",
            "They put the hook up front. TikTok's own creative guidance says to prioritize the hook in the first 6 seconds and introduce your proposition in the first 3.",
            "They are cheap to vary. One script can become many hooks, people and settings to test.",
          ] },
        ],
      },
      {
        id: "when-not",
        h2: "When do UGC ads not work?",
        blocks: [
          { kind: "ul", items: [
            "When the product needs a detailed demo or spec comparison that a selfie video cannot show well.",
            "When the hook is weak. A creator format does not rescue an opening nobody stops for.",
            "When the review feels fake. Viewers notice, and US rules forbid presenting a scripted actor or AI person as a real customer without disclosure (see [Are AI UGC ads legal?](/are-ai-ugc-ads-legal)).",
            "When every ad looks the same. Running one creator and one script for months leads to fatigue.",
          ] },
        ],
      },
      {
        id: "test",
        h2: "How do I test whether UGC ads work for my product?",
        blocks: [
          { kind: "ol", items: [
            "Keep your current best ad as the control.",
            "Make three to five UGC versions that change one thing each: the hook, the person or the setting.",
            "Run them in the same ad set with the same budget and audience.",
            "Judge on cost per purchase or lead, not views alone, then remake the winner with new hooks.",
          ] },
          { kind: "p", text: "AI makes the second step fast: you can generate the versions from one product photo instead of booking several creators. See [How to make UGC ads with AI](/make-ugc-ads-with-ai)." },
        ],
      },
    ],
    buzz: {
      title: "How to do it on BuzzVideo",
      steps: ["Upload one product photo.", "Describe the creator and the hook, or ask for three hooks to test.", "Generate 9:16 UGC videos with Kling 4.0, Seedance 2.5 or MiniMax H3, then ask for new hooks on the winner."],
      cta: { label: "Make a UGC ad", href: "/ai-ugc-video-generator" },
      note: NO_FREE_VIDEO,
    },
    faq: [
      { q: "Are UGC ads better than polished ads?", a: "Not always. UGC tends to suit in-feed placements on TikTok and Reels; polished spots can still win for launches and premium products. Test both formats on the same budget." },
      { q: "How long should a UGC ad be?", a: "Short enough to keep the hook and the product in the first seconds. TikTok's creative guidance focuses on the first 3 to 6 seconds rather than a fixed length." },
      { q: "Do AI UGC ads work as well as real creators?", a: "There is no reliable public benchmark. Treat AI UGC as another variant: test it against creator content and your current ads, and keep what performs." },
      { q: "Do I have to disclose that a UGC ad is paid?", a: "In the US, the FTC expects material connections between a brand and an endorser to be disclosed clearly. This is not legal advice; see the FTC's Endorsement Guides." },
    ],
    sources: [
      { label: "TikTok Ads Manager: Creative best practices", url: "https://ads.tiktok.com/help/article/creative-best-practices" },
      { label: "FTC: Endorsement Guides, What People Are Asking", url: "https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking" },
    ],
    related: ["/make-ugc-ads-with-ai", "/ai-ugc-vs-human-ugc", "/are-ai-ugc-ads-legal", "/write-a-good-hook"],
  },

  /* ───────────── Are AI UGC ads legal? ───────────── */
  {
    slug: "are-ai-ugc-ads-legal",
    group: "Questions",
    legal: true,
    title: "Are AI UGC Ads Legal? FTC and Platform Rules | BuzzVideo",
    description: "AI UGC ads can be legal if they don't deceive. What the FTC endorsement rules, the fake reviews rule and TikTok and Meta AI labels say. Not legal advice.",
    h1: "Are AI UGC ads legal?",
    answer:
      "In the US, AI-generated people can generally appear in ads, but the ad must not mislead: you cannot present an AI character as a real customer sharing a real experience, and FTC guidance says ads that look like real consumers but are not should clearly disclose that. TikTok also requires AI-generated ad content to be labeled. This page summarizes the rules and is not legal advice.",
    card: "What the FTC, TikTok and Meta say about AI people in ads.",
    media: { from: "video", match: "creator-style product review", caption: "An AI-generated creator-style ad made on BuzzVideo. The person is an AI character, not a customer." },
    sections: [
      {
        id: "ftc",
        h2: "What do FTC rules say about AI testimonials?",
        blocks: [
          { kind: "p", text: "Two US rules matter most for UGC-style ads:" },
          { kind: "ul", items: [
            "FTC Endorsement Guides, 16 CFR 255.2(c): ads that present endorsements as coming from actual consumers should use actual consumers, or clearly and conspicuously disclose that the people shown are not actual consumers of the product.",
            "FTC rule on consumer reviews and testimonials, 16 CFR Part 465 (effective October 21, 2024): businesses may not create or disseminate reviews or testimonials that misrepresent that the reviewer exists, that they used the product, or what their experience was. The FTC can seek civil penalties under this rule.",
            "Endorsement Guides, 16 CFR 255: an endorsement must reflect the honest opinions or experience of the endorser, and material connections with an endorser should be disclosed.",
          ] },
          { kind: "p", text: "In practice, an AI person demonstrating a product in a clearly fictional or disclosed way is different from an AI person saying \"I've used this for three months and it fixed my skin\" as if it were a real review." },
        ],
      },
      {
        id: "tiktok",
        h2: "Does TikTok require AI ads to be labeled?",
        blocks: [
          { kind: "p", text: "Yes. TikTok's ads policy allows significantly edited or AI-generated content if it is disclosed, either with TikTok's AI-generated content label or your own disclaimer, caption, watermark or sticker. Undisclosed AI content can get an ad rejected or restricted." },
          { kind: "ul", items: [
            "In Ads Manager, non-Spark ads have a toggle labeled \"This ad contains AI-generated content\" for ads with fully AI-generated or significantly AI-modified image, video or audio.",
            "Spark ads follow the Community Guidelines' AI disclosure rules instead.",
            "TikTok lists making a person say something they didn't say with AI voice cloning as significant AI modification, and prohibits using a public figure's likeness without permission, including false endorsements.",
          ] },
        ],
      },
      {
        id: "meta",
        h2: "Does Meta label AI-generated ads?",
        blocks: [
          { kind: "p", text: "Meta says it applies an \"AI info\" label to ad images created or significantly edited with its own generative AI tools or with third-party AI tools, shown in the \"About this ad\" menu and sometimes next to the Sponsored label. Ads about social issues, elections or politics have stricter rules: advertisers must disclose photorealistic or realistic-sounding media that was digitally created or altered." },
        ],
      },
      {
        id: "checklist",
        h2: "How do I run AI UGC ads responsibly?",
        blocks: [
          { kind: "ol", items: [
            "Don't present an AI person as a real customer, or add a clear disclosure that the person is AI-generated or an actor.",
            "Only make claims about the product that you can back up, whoever says them.",
            "Turn on the platform's AI label (TikTok's AIGC toggle) or add your own disclaimer.",
            "Don't use the face or voice of a real person, public figure or private individual, without their permission.",
            "Keep records of how each ad was made and who approved it, and ask a lawyer for your market.",
          ] },
        ],
      },
    ],
    buzz: {
      title: "How to do it on BuzzVideo",
      steps: ["Generate the creator-style video from your product photo.", "Write the script as a demonstration, not a fake personal review.", "Add an \"AI-generated\" caption or use the platform's AI label when you upload the ad."],
      cta: { label: "Make an AI UGC ad", href: "/ai-ugc-video-generator" },
      note: "The people BuzzVideo generates are AI characters, not real customers.",
    },
    faq: [
      { q: "Is it legal to use AI-generated people in ads?", a: "Generally yes in the US, as long as the ad is not deceptive. Problems start when an AI person is presented as a real customer with a real experience. This is not legal advice." },
      { q: "Do I have to disclose AI in TikTok ads?", a: "Yes. TikTok's ads policy requires fully AI-generated or significantly AI-edited content to be disclosed, with its AI-generated content label or your own disclaimer; undisclosed AI content can be rejected or restricted." },
      { q: "Can AI write fake reviews for my product?", a: "No. The FTC's 2024 rule on consumer reviews and testimonials prohibits reviews that misrepresent that the reviewer exists or used the product, and it allows civil penalties." },
      { q: "Can I clone a celebrity's voice or face for an ad?", a: "Not without permission. TikTok's ads policy prohibits misusing a public figure's likeness, and many US states have right-of-publicity laws. Get written consent." },
      { q: "Is this page legal advice?", a: "No. It summarizes public rules as of November 2026. Ask a qualified lawyer about your ads and markets." },
    ],
    sources: [
      { label: "16 CFR 255.2, Consumer endorsements (Cornell LII)", url: "https://www.law.cornell.edu/cfr/text/16/255.2" },
      { label: "16 CFR 465.2, Fake or false consumer reviews and testimonials (Cornell LII)", url: "https://www.law.cornell.edu/cfr/text/16/465.2" },
      { label: "Federal Register: Trade Regulation Rule on the Use of Consumer Reviews and Testimonials (Aug 22, 2024)", url: "https://www.govinfo.gov/content/pkg/FR-2024-08-22/html/2024-18519.htm" },
      { label: "FTC: Endorsement Guides, What People Are Asking", url: "https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking" },
      { label: "TikTok Ads Policy: Misleading and false content", url: "https://ads.tiktok.com/help/article/tiktok-ads-policy-misleading-and-false-content" },
      { label: "TikTok Ads Manager: How to add disclaimers to ads", url: "https://ads.tiktok.com/help/article/add-disclaimers-to-ads" },
      { label: "Meta Help Center: How AI-generated images in ads are identified and labeled", url: "https://www.meta.com/help/artificial-intelligence/355108217670024/" },
      { label: "Meta Transparency Center: Ads about social issues, elections or politics", url: "https://transparency.meta.com/policies/ad-standards/SIEP-advertising/SIEP/" },
    ],
    related: ["/do-ugc-ads-work", "/ai-ugc-vs-human-ugc", "/make-ugc-ads-with-ai", "/clone-your-voice-with-ai"],
  },

  /* ───────────── AI UGC vs human UGC ───────────── */
  {
    slug: "ai-ugc-vs-human-ugc",
    group: "Questions",
    title: "AI UGC vs Human UGC: Which Should You Use? | BuzzVideo",
    description: "AI UGC is faster and easier to vary; human UGC brings real experience and real reviews. A side-by-side comparison and when to use each for ads.",
    h1: "AI UGC vs human UGC: which is better?",
    answer:
      "Neither wins everywhere. AI UGC is faster and easier to vary, so it suits hook testing, new markets and products you can't ship to creators yet; human UGC carries a real person's real experience, which is what reviews and testimonials need. Many teams use human creators for genuine reviews and AI for volume and variations.",
    card: "Speed and volume versus real experience, side by side.",
    media: { from: "video", match: "sitting on her bed talking", caption: "A creator-style video generated with Seedance 2.5 on BuzzVideo." },
    sections: [
      {
        id: "compare",
        h2: "How do AI UGC and human UGC compare?",
        blocks: [
          {
            kind: "table",
            head: ["", "AI UGC", "Human UGC"],
            rows: [
              ["Turnaround", "Minutes per clip once you have a product photo", "Days to weeks: briefing, shipping, filming, edits"],
              ["New variations", "Change the hook, person, setting or language in a prompt", "Usually a new shoot or a new creator"],
              ["Real experience", "None. The person is generated", "Yes, if the creator actually used the product"],
              ["Reviews and testimonials", "Should not be presented as a real customer review", "Can be genuine, with paid connections disclosed"],
              ["Product accuracy", "Depends on the model keeping your label and shape", "Real product on camera"],
              ["Rights and consent", "No real person's likeness, if you don't use one", "Needs usage rights and creator agreements"],
              ["Platform labels", "AI disclosure required on TikTok ads", "Paid partnership disclosure"],
            ],
          },
        ],
      },
      {
        id: "when-ai",
        h2: "When should I use AI UGC?",
        blocks: [
          { kind: "ul", items: [
            "Testing many hooks or angles before you spend on creators.",
            "Launching before inventory exists to ship to creators.",
            "Localizing a winning ad into other languages and markets.",
            "Refreshing creative when an ad starts to fatigue.",
          ] },
        ],
      },
      {
        id: "when-human",
        h2: "When should I use human creators?",
        blocks: [
          { kind: "ul", items: [
            "Reviews and testimonials that claim a real experience.",
            "Products where touch, texture or fit is the selling point.",
            "Long-term creator partnerships and organic posts on a creator's own account.",
          ] },
          { kind: "p", text: "You can also combine them: [Hybrid Reel](/hybrid-reel) edits your real footage together with AI-generated shots." },
        ],
      },
    ],
    buzz: {
      title: "How to do it on BuzzVideo",
      steps: ["Upload a product photo or paste a product page link.", "Describe the person, the setting and the hook.", "Generate, then ask for new hooks, people or languages of the version that works."],
      cta: { label: "Try AI UGC", href: "/ai-ugc-video-generator" },
      note: NO_FREE_VIDEO,
    },
    faq: [
      { q: "Is AI UGC cheaper than human UGC?", a: "Usually per variation, because there is no creator fee, shipping or reshoot. Your cost on BuzzVideo depends on the model and length; you see the credit price before you generate." },
      { q: "Does AI UGC look real?", a: "Current models such as Kling 4.0 and Seedance 2.5 produce convincing creator-style clips, but check every take for odd hands, text or label errors before you run it." },
      { q: "Can I use AI UGC for product reviews?", a: "Not as a real customer review. US rules prohibit testimonials that misrepresent that the reviewer exists or used the product. Use AI for demonstrations and disclosed content." },
      { q: "Should I stop working with creators?", a: "No. Real creators bring genuine experience and their own audience. AI is best for volume, testing and localization alongside them." },
    ],
    sources: [
      { label: "16 CFR 465.2, Fake or false consumer reviews and testimonials (Cornell LII)", url: "https://www.law.cornell.edu/cfr/text/16/465.2" },
      { label: "TikTok Ads Manager: How to add disclaimers to ads", url: "https://ads.tiktok.com/help/article/add-disclaimers-to-ads" },
    ],
    related: ["/do-ugc-ads-work", "/are-ai-ugc-ads-legal", "/make-ugc-ads-with-ai", "/best-ai-ugc-video-generators"],
  },

  /* ───────────── Create AI product videos for free ───────────── */
  {
    slug: "create-ai-product-videos-free",
    group: "How-to guides",
    title: "How to Create AI Product Videos for Free | BuzzVideo",
    description: `What you can make free on BuzzVideo with ${SIGNUP_CREDITS} sign-up credits: product photos and voiceovers, plus what you need to animate them into video ads.`,
    h1: "How do I create AI product videos for free?",
    answer: `On BuzzVideo, the free part is the stills and the sound: the ${SIGNUP_CREDITS} credits new accounts get cover product photos on Seedream 4.5 and Seedream 5.0 lite and voiceovers on Seed Audio 1.0. Turning them into video needs a video model, and those are on the Starter, Pro and Ultra plans, so the free path is to prepare your shots and voice first and animate only the ones you are sure about.`,
    card: "What the free credits cover, and the cheapest path to video.",
    media: { from: "extra", match: "product-photos", caption: "A product photo set made from one packshot on BuzzVideo." },
    sections: [
      {
        id: "what-free",
        h2: "What can I make for free on BuzzVideo?",
        blocks: [
          { kind: "table", head: ["What", "Model", "Free credits?"], rows: [
            ["Product photos and lifestyle scenes", "Seedream 4.5, Seedream 5.0 lite", "Yes"],
            ["Voiceover, music and sound effects", "Seed Audio 1.0", "Yes"],
            ["Video clips (unboxing, demos, UGC)", "Seedance, Kling, Wan, MiniMax and others", "No, Starter plan or above"],
          ] },
        ],
      },
      {
        id: "steps",
        h2: "What is the cheapest way to make a product video with AI?",
        blocks: [
          { kind: "ol", items: [
            "Make the first frames free: put your product into two or three scenes with [AI Product Photography](/ai-product-photography) on Seedream 4.5.",
            "Write and voice the script free with Seed Audio 1.0 in [AI Voice Over](/ai-voice-over).",
            "Pick the strongest still and animate only that one with [Image to Video](/image-to-video) on a plan. A first frame you already like means fewer re-rolls.",
            "Start with a short, fast model for drafts, such as Seedance 2.0 Mini, then render the final on a higher-quality model.",
          ] },
        ],
      },
      {
        id: "tips",
        h2: "How do I keep the product looking right?",
        blocks: [
          { kind: "ul", items: [
            "Use a sharp, front-on product photo with a readable label.",
            "Say \"keep the label exactly the same\" in the prompt.",
            "Keep camera moves simple for the first test: a slow push-in or a turntable.",
          ] },
        ],
      },
    ],
    buzz: {
      title: "How to do it on BuzzVideo",
      steps: ["Sign up and get your free credits.", "Make product scenes on Seedream 4.5 and a voiceover on Seed Audio 1.0.", "When you are ready, animate your best still on a plan."],
      cta: { label: "Start with free product photos", href: "/seedream-4-5" },
      note: NO_FREE_VIDEO,
    },
    faq: [
      { q: "Is there a free AI product video generator?", a: `Not for video on BuzzVideo: video models need a Starter, Pro or Ultra plan. The ${SIGNUP_CREDITS} free credits cover product images on Seedream 4.5 and Seedream 5.0 lite and audio on Seed Audio 1.0.` },
      { q: "Do the free credits expire or need a card?", a: "Check the pricing page for the current terms of the sign-up credits." },
      { q: "Can I make a product video from one photo?", a: "Yes, with an image-to-video model on a plan. Seedance 2.5 and Kling 4.0 animate your photo while keeping the label and shape." },
    ],
    sources: [],
    related: ["/ai-product-video-generator", "/ai-product-photography", "/can-ai-do-product-photography", "/amazon-product-video-length"],
    howto: { name: "How to create AI product videos for free", steps: ["Make product scenes on Seedream 4.5 with free credits.", "Voice the script on Seed Audio 1.0 with free credits.", "Animate the best still with an image-to-video model on a plan."] },
  },

  /* ───────────── Amazon product video length ───────────── */
  {
    slug: "amazon-product-video-length",
    group: "Specs and reference",
    title: "How Long Should an Amazon Product Video Be? | BuzzVideo",
    description: "Amazon says most successful product videos run 30 to 90 seconds. Upload specs, what to show first and how to make listing videos from product photos.",
    h1: "How long should an Amazon product video be?",
    answer:
      "Aim for 30 to 90 seconds. Amazon's own seller guidance says most successful product videos are 30 to 90 seconds long and show the most important feature in the first 5 to 10 seconds. Files go up as .mp4 or .mov, up to 1080p and 5 GB.",
    card: "30 to 90 seconds, key feature in the first 5 to 10.",
    media: { from: "video", match: "unboxing video made from one product photo", caption: "An unboxing video made from one product photo on BuzzVideo." },
    sections: [
      {
        id: "specs",
        h2: "What are Amazon's product video requirements?",
        blocks: [
          { kind: "table", head: ["Spec", "Amazon guidance"], rows: [
            ["Format", ".mov or .mp4"],
            ["Resolution", "Up to 1080p, highest available quality recommended"],
            ["File size", "Maximum 5 GB"],
            ["Length", "Listed as \"between 1 and 12 minutes\" in the spec list"],
            ["Recommended length", "Most successful videos: 30 to 90 seconds"],
            ["Thumbnail", "System-generated or custom .jpg, .png, .gif or .bmp"],
          ] },
          { kind: "note", text: "Amazon's article lists a 1 to 12 minute length in its spec list while recommending 30 to 90 seconds in the same article. Check the upload screen in Seller Central for your marketplace before you export." },
        ],
      },
      {
        id: "who",
        h2: "Who can upload videos to an Amazon listing?",
        blocks: [
          { kind: "p", text: "Amazon says both brand-registered and non-brand-registered sellers can add shoppable videos if they have a Professional selling account, live listings and at least three months of selling history." },
        ],
      },
      {
        id: "what-show",
        h2: "What should an Amazon product video show?",
        blocks: [
          { kind: "ol", items: [
            "The product and its main benefit in the first 5 to 10 seconds.",
            "The product in use in an everyday setting.",
            "Two or three key features, one per shot.",
            "What comes in the box, or a quick setup if it needs one.",
          ] },
        ],
      },
    ],
    buzz: {
      title: "How to do it on BuzzVideo",
      steps: ["Upload your product photos.", "Ask for a 16:9 product video: the hero feature first, then in-use shots.", "Generate clips and join them to the length you want, then export MP4."],
      cta: { label: "Make an Amazon product video", href: "/ai-product-video-generator" },
      note: `Single BuzzVideo takes run up to 30 seconds on models such as Seedance 2.5 and Kling 4.0. ${NO_FREE_VIDEO}`,
    },
    faq: [
      { q: "What is the best length for an Amazon product video?", a: "30 to 90 seconds. Amazon says most successful product videos fall in that range and show the key feature in the first 5 to 10 seconds." },
      { q: "What file format does Amazon accept for product videos?", a: ".mp4 or .mov, up to 1080p and a maximum of 5 GB, per Amazon's seller guidance." },
      { q: "Do I need Brand Registry to add a video on Amazon?", a: "No, according to Amazon: sellers with a Professional account, live listings and at least three months of selling history can add shoppable videos." },
      { q: "Can I make an Amazon product video with AI?", a: "Yes. Make 16:9 clips from your product photos with an AI product video generator, then edit them into a 30 to 90 second video." },
    ],
    sources: [{ label: "Amazon Sell blog: Amazon product videos (requirements and best practices)", url: "https://sell.amazon.com/blog/amazon-product-video" }],
    related: ["/amazon-product-videos", "/ai-product-video-generator", "/add-video-to-shopify-product-page", "/create-ai-product-videos-free"],
  },

  /* ───────────── Add video to Shopify product page ───────────── */
  {
    slug: "add-video-to-shopify-product-page",
    group: "How-to guides",
    title: "How to Add Video to a Shopify Product Page | BuzzVideo",
    description: "Add a video to a Shopify product page in a few clicks: upload an MP4 or link YouTube or Vimeo. Shopify's file limits and how to make the video with AI.",
    h1: "How do I add a video to a Shopify product page?",
    answer:
      "In Shopify admin, go to Products, open the product and add the video in the Media section with Upload new, drag and drop, or Select existing. Uploaded videos can be up to 10 minutes, 1 GB and 4K in .mp4, .mov or .webm, or you can add a YouTube or Vimeo link instead. Your theme must support video for it to show.",
    card: "Upload or link a video in the product's Media section.",
    media: { from: "video", match: "3D product turnaround", caption: "A 3D product turnaround video made on BuzzVideo." },
    sections: [
      {
        id: "upload",
        h2: "How do I upload a video to a Shopify product?",
        blocks: [
          { kind: "ol", items: [
            "From your Shopify admin, go to Products.",
            "Click the product you want to edit.",
            "In the Media section, click Upload new and select the video file, drag and drop the file, or click Select existing to use a file you already uploaded.",
            "Drag the video to the first position if you want it to lead the gallery. The first media item is the product's featured media.",
          ] },
        ],
      },
      {
        id: "youtube",
        h2: "How do I add a YouTube or Vimeo video to a product?",
        blocks: [
          { kind: "ol", items: [
            "Open the product and, in the Media section, click Select existing.",
            "Click Add from URL and paste the link.",
            "Use https://youtube.com/watch?v=[video-id] for YouTube (Shorts links aren't supported) or https://vimeo.com/[video-id] for Vimeo.",
            "Make sure the YouTube video is Public or Unlisted, or the Vimeo video allows embedding.",
          ] },
        ],
      },
      {
        id: "limits",
        h2: "What are Shopify's product video limits?",
        blocks: [
          { kind: "table", head: ["Spec", "Uploaded video"], rows: [
            ["Length", "Up to 10 minutes"],
            ["File size", "Up to 1 GB"],
            ["Resolution", "Up to 4K (4096 x 2160 px)"],
            ["File types", ".mp4, .mov, .webm"],
            ["Media per product", "Up to 250 images, 3D models or videos"],
          ] },
          { kind: "note", text: "Shopify converts uploads to .mp4 or HLS and streams them at 480p, 720p or 1080p depending on the viewer's connection. All Online Store 2.0 themes built by Shopify support video." },
        ],
      },
    ],
    buzz: {
      title: "How to do it on BuzzVideo",
      steps: ["Upload your product photo.", "Ask for a short loop: a turntable, a close-up of the label or the product in use.", "Download the MP4 and add it in the product's Media section."],
      cta: { label: "Make a product page video", href: "/ai-product-video-generator" },
      note: NO_FREE_VIDEO,
    },
    faq: [
      { q: "Why isn't my product video showing on Shopify?", a: "Most often the theme doesn't support video media. All Online Store 2.0 themes built by Shopify do; for third-party themes, update to a recent version." },
      { q: "What video format does Shopify accept?", a: ".mp4, .mov or .webm, up to 10 minutes, 1 GB and 4K for uploaded product videos." },
      { q: "Can I add a YouTube Short to a Shopify product?", a: "Not as a Shorts link. Shopify asks for the standard https://youtube.com/watch?v=[video-id] format." },
      { q: "How long should a product page video be?", a: "Shopify allows up to 10 minutes, but short loops that show the product in the first seconds suit a product gallery." },
    ],
    sources: [
      { label: "Shopify Help Center: Adding media", url: "https://help.shopify.com/en/manual/products/product-media/add-media" },
      { label: "Shopify Help Center: Product media types", url: "https://help.shopify.com/en/manual/products/product-media/product-media-types" },
    ],
    related: ["/shopify-product-videos", "/amazon-product-video-length", "/ai-product-video-generator", "/shopify-integration"],
    howto: { name: "How to add a video to a Shopify product page", steps: ["In Shopify admin, go to Products.", "Click the product you want to edit.", "In the Media section, click Upload new, drag and drop, or Select existing.", "Drag the video to the first position to make it the featured media."] },
  },

  /* ───────────── Make an AI avatar video ───────────── */
  {
    slug: "make-ai-avatar-video",
    group: "How-to guides",
    title: "How to Make an AI Avatar Video from a Photo | BuzzVideo",
    description: "Make an AI avatar video from one photo and a voice track: upload a portrait, add speech, and get a lip-synced talking video. Step by step on BuzzVideo.",
    h1: "How do I make an AI avatar video?",
    answer:
      "Upload one clear photo of the person or character, add the speech as an audio track and generate: the model animates the face and lip-syncs it to the voice. On BuzzVideo's Talking Avatar, Kling AI Avatar v2 Pro takes voice tracks up to 5 minutes and MiniMax H3 Max up to 15 minutes.",
    card: "One photo plus a voice track becomes a talking video.",
    media: { from: "extra", match: "avatar-result", caption: "A talking avatar frame generated from one photo and a voice track on BuzzVideo." },
    sections: [
      {
        id: "steps",
        h2: "What are the steps to make an AI avatar video?",
        blocks: [
          { kind: "ol", items: [
            "Pick a photo: one clear, front-facing portrait with the mouth visible. Kling AI Avatar v2 Pro also accepts animals and cartoon characters.",
            "Make the voice: upload a recording, or write a script and generate it with [AI Voice Over](/ai-voice-over) or your own [voice clone](/clone-your-voice-with-ai).",
            "Choose the model: Kling AI Avatar v2 Pro for voice tracks up to 5 minutes, MiniMax H3 Max for 5 seconds to 15 minutes.",
            "Generate, check the lip sync and download the MP4.",
          ] },
          { kind: "media", media: { from: "extra", match: "avatar-photo", caption: "The input: one portrait photo." } },
        ],
      },
      {
        id: "good-results",
        h2: "How do I get a natural-looking avatar?",
        blocks: [
          { kind: "ul", items: [
            "Use a sharp photo with even light and nothing covering the mouth.",
            "Record or generate clean speech with no music under it.",
            "Keep a single speaker per track.",
            "For a presenter holding your product, use [AI Spokesperson Video](/ai-spokesperson) instead.",
          ] },
        ],
      },
      {
        id: "rights",
        h2: "Whose photo can I use?",
        blocks: [
          { kind: "p", text: "Your own, a generated character's, or someone who has given you permission. TikTok's ads policy prohibits using a person's likeness without permission, and ads with significant AI modification need an AI label. See [Are AI UGC ads legal?](/are-ai-ugc-ads-legal)." },
        ],
      },
    ],
    buzz: {
      title: "How to do it on BuzzVideo",
      steps: ["Open Talking Avatar and upload the photo.", "Add the voice track.", "Pick Kling AI Avatar v2 Pro or MiniMax H3 Max and generate."],
      cta: { label: "Open Talking Avatar", href: "/talking-avatar" },
      note: `Talking Avatar is a video tool and needs a Starter, Pro or Ultra plan. Voiceovers on Seed Audio 1.0 work with the ${SIGNUP_CREDITS} free credits.`,
    },
    faq: [
      { q: "Can I make an AI avatar video from a photo?", a: "Yes. Upload one clear portrait and a voice track; Talking Avatar on BuzzVideo animates the face and lip-syncs it to the speech." },
      { q: "How long can an AI avatar video be?", a: "On BuzzVideo, up to 5 minutes of voice with Kling AI Avatar v2 Pro and up to 15 minutes with MiniMax H3 Max." },
      { q: "Can the avatar be a cartoon or a pet?", a: "Yes, with Kling AI Avatar v2 Pro, which accepts a person, animal or cartoon character." },
      { q: "Is there a free AI avatar video generator?", a: `Not on BuzzVideo: Talking Avatar needs a plan. You can make the voice free with Seed Audio 1.0 on the ${SIGNUP_CREDITS} sign-up credits.` },
    ],
    sources: [{ label: "TikTok Ads Policy: Misleading and false content", url: "https://ads.tiktok.com/help/article/tiktok-ads-policy-misleading-and-false-content" }],
    related: ["/talking-avatar", "/ai-spokesperson", "/how-to-do-ai-lip-sync", "/best-ai-avatar-video-generators"],
    howto: { name: "How to make an AI avatar video", steps: ["Upload one clear portrait photo.", "Add the speech as an audio track.", "Choose Kling AI Avatar v2 Pro or MiniMax H3 Max.", "Generate and download the MP4."] },
  },

  /* ───────────── Clone your voice ───────────── */
  {
    slug: "clone-your-voice-with-ai",
    group: "How-to guides",
    title: "How to Clone Your Voice with AI (Step by Step) | BuzzVideo",
    description: "Clone your voice with AI from a short, clean recording, then have it read any script as a voiceover. Steps, recording tips and consent rules on BuzzVideo.",
    h1: "How do I clone my voice with AI?",
    answer:
      "Record a short, clean sample of your voice with no music or background noise, upload it, and give the AI a script: it reads the new text in your voice. On BuzzVideo, Seed Audio 1.0 does the cloning, and it works with the free credits new accounts get. Only clone voices you have permission to use.",
    card: "A short clean sample, then any script in your voice.",
    media: { from: "audio", match: "voiceover for a skincare ad", caption: "A voiceover generated with Seed Audio 1.0 on BuzzVideo." },
    sections: [
      {
        id: "steps",
        h2: "What are the steps to clone a voice?",
        blocks: [
          { kind: "ol", items: [
            "Record a sample: one speaker, a quiet room, no music, natural pace.",
            "In BuzzVideo Audio, upload the sample. It becomes @Audio1.",
            "Write the prompt: \"Read my script in the voice from @Audio1:\" followed by your script.",
            "Generate, listen, and adjust the script's punctuation if the pacing is off.",
          ] },
        ],
      },
      {
        id: "sample",
        h2: "How do I record a good voice sample?",
        blocks: [
          { kind: "ul", items: [
            "Use a phone or USB mic close to your mouth, away from echoey walls.",
            "Read in the tone you want back: an energetic sample gives an energetic clone.",
            "Avoid background music, other voices and heavy noise reduction.",
          ] },
        ],
      },
      {
        id: "consent",
        h2: "Is it legal to clone a voice?",
        blocks: [
          { kind: "p", text: "Cloning your own voice, or a voice you have written permission to use, is the safe case. Cloning someone else's voice without consent can break platform rules and the law in many places. TikTok's ads policy treats making someone say something they didn't say with AI voice cloning as significant AI modification that must be disclosed. This is not legal advice." },
        ],
      },
    ],
    buzz: {
      title: "How to do it on BuzzVideo",
      steps: ["Open AI Voice Clone and upload your sample.", "Paste the script after the @Audio1 reference.", "Generate and use the voice on any video."],
      cta: { label: "Clone your voice", href: "/ai-voice-clone" },
      note: `Seed Audio 1.0 works with the ${SIGNUP_CREDITS} free credits new accounts get. MiniMax Voice Clone and Kling Voice Clone arrive in the next release.`,
    },
    faq: [
      { q: "How long does a voice sample need to be?", a: "Short is fine if it is clean: one speaker with no music or background noise matters more than length." },
      { q: "Is AI voice cloning free?", a: `On BuzzVideo it runs on Seed Audio 1.0, which works with the ${SIGNUP_CREDITS} free credits new accounts get.` },
      { q: "Can my cloned voice speak other languages?", a: "You can have the cloned voice read a translated script. Check the result with a native speaker before you publish." },
      { q: "Can I clone a celebrity's voice?", a: "Not without permission. Platforms such as TikTok prohibit misusing a public figure's likeness, and many places have laws on voice and likeness." },
    ],
    sources: [{ label: "TikTok Ads Policy: Misleading and false content", url: "https://ads.tiktok.com/help/article/tiktok-ads-policy-misleading-and-false-content" }],
    related: ["/ai-voice-clone", "/ai-voice-over", "/text-to-speech", "/make-ai-avatar-video"],
    howto: { name: "How to clone your voice with AI", steps: ["Record a short, clean voice sample.", "Upload it in BuzzVideo Audio as @Audio1.", "Write the script after the @Audio1 reference.", "Generate and download the voiceover."] },
  },

  /* ───────────── AI lip sync ───────────── */
  {
    slug: "how-to-do-ai-lip-sync",
    group: "How-to guides",
    title: "How to Do AI Lip Sync on a Video (Step by Step) | BuzzVideo",
    description: "Make the person in a video say new lines: upload the clip, add new audio or a typed script, and generate. AI lip sync steps, limits and tips on BuzzVideo.",
    h1: "How do I do AI lip sync on a video?",
    answer:
      "Upload a video with a clear face, add the new speech as an audio file or a typed script, and generate: AI lip sync redraws the mouth to match the new words. On BuzzVideo, Kling LipSync handles 2 to 10 second clips and can read a typed script in a preset voice, while MiniMax H3 Max handles videos from 5 seconds to 15 minutes with your own audio.",
    card: "New words on existing footage, no reshoot.",
    media: { from: "extra", match: "lip-2", caption: "A frame from a lip-synced clip on BuzzVideo: the mouth follows the new speech." },
    sections: [
      {
        id: "steps",
        h2: "What are the steps for AI lip sync?",
        blocks: [
          { kind: "ol", items: [
            "Upload the video. The face should be clear and mostly facing the camera.",
            "Add the new speech: upload an audio file, or with Kling LipSync type a script and pick one of 7 English preset voices at 0.8x to 2x speed.",
            "If the audio and video lengths differ on MiniMax H3 Max, choose Trim, Loop, Bounce or Pad.",
            "Generate, compare with the original and download.",
          ] },
        ],
      },
      {
        id: "models",
        h2: "Which lip sync model should I use?",
        blocks: [
          { kind: "table", head: ["", "Kling LipSync", "MiniMax H3 Max"], rows: [
            ["Video length", "2 to 10 seconds", "5 seconds to 15 minutes"],
            ["Speech", "Audio file (2 to 60 s) or typed script", "Your audio file, up to 15 minutes"],
            ["Best for", "Short ad hooks and quick line changes", "Long talking-head videos and full re-voicing"],
          ] },
        ],
      },
      {
        id: "tips",
        h2: "How do I get clean lip sync?",
        blocks: [
          { kind: "ul", items: [
            "Pick footage where the mouth is not covered by hands, products or microphones.",
            "Use dry speech with no music under it.",
            "Match the energy: a calm face with shouted audio looks wrong even when the sync is right.",
            "Get consent from the person on camera before changing what they say, and label AI edits where platforms require it.",
          ] },
        ],
      },
    ],
    buzz: {
      title: "How to do it on BuzzVideo",
      steps: ["Open AI Lip Sync and upload the video.", "Upload the new audio or type the script.", "Generate and download."],
      cta: { label: "Open AI Lip Sync", href: "/ai-lip-sync" },
      note: "AI Lip Sync is a video tool and needs a Starter, Pro or Ultra plan.",
    },
    faq: [
      { q: "Can AI change what someone says in a video?", a: "Yes. AI lip sync redraws the mouth to match new audio. Only do this with the person's consent, and disclose AI edits where platforms require it." },
      { q: "How long can a lip sync video be?", a: "On BuzzVideo, 2 to 10 seconds with Kling LipSync and 5 seconds to 15 minutes with MiniMax H3 Max." },
      { q: "Can I lip sync to text instead of audio?", a: "Yes, with Kling LipSync: type the script and choose one of 7 English preset voices." },
      { q: "Can I translate a video with lip sync?", a: "Yes: make the translated voiceover first, then lip sync the video to it. See [AI Dubbing](/ai-dubbing)." },
    ],
    sources: [{ label: "TikTok Ads Policy: Misleading and false content", url: "https://ads.tiktok.com/help/article/tiktok-ads-policy-misleading-and-false-content" }],
    related: ["/ai-lip-sync", "/make-ai-avatar-video", "/ai-dubbing", "/best-ai-lip-sync-tools"],
    howto: { name: "How to do AI lip sync on a video", steps: ["Upload a video with a clear face.", "Add new audio or type a script.", "Choose how to handle different lengths.", "Generate and download."] },
  },

  /* ───────────── Can AI do product photography? ───────────── */
  {
    slug: "can-ai-do-product-photography",
    group: "Questions",
    title: "Can AI Do Product Photography? Yes, Here's How | BuzzVideo",
    description: "AI can put your real product into new scenes from one packshot, label unchanged. What it does well, where it falls short and how to try it free on BuzzVideo.",
    h1: "Can AI do product photography?",
    answer:
      "Yes, for most catalog, listing and social images. AI product photography takes one real photo of your product and places it into a generated scene, so the result depends on keeping the product itself unchanged. It is weaker at exact textures, fine print on small items and anything that must be physically measured, so check every image before you publish.",
    card: "One packshot in, lifestyle scenes out, label unchanged.",
    media: { from: "image", match: "beside her cheek", caption: "A creator-style product portrait made with Nano Banana 2.1 on BuzzVideo." },
    sections: [
      {
        id: "good-at",
        h2: "What is AI product photography good at?",
        blocks: [
          { kind: "ul", items: [
            "Lifestyle scenes for listings: a bathroom shelf, a kitchen counter, a beach.",
            "Seasonal and campaign variations without a new shoot.",
            "Consistent sets in several aspect ratios for ads.",
            "Static ads with headlines and feature callouts.",
          ] },
          { kind: "media", media: { from: "image", match: "Glow, bottled", caption: "A static product ad with headline and feature chips, made with Nano Banana 2.1." } },
        ],
      },
      {
        id: "limits",
        h2: "Where does AI product photography fall short?",
        blocks: [
          { kind: "ul", items: [
            "Tiny text on small products can drift. Zoom in and check every label.",
            "Exact color and material matters for fashion and cosmetics. Compare against the real item.",
            "Images must not show features the product doesn't have; marketplaces and ad platforms treat that as misleading.",
          ] },
        ],
      },
      {
        id: "how",
        h2: "How do I do AI product photography?",
        blocks: [
          { kind: "ol", items: [
            "Shoot or pick one clean, front-on packshot.",
            "Describe the scene: surface, props, light and mood.",
            "Add \"keep the label exactly the same\" to the prompt.",
            "Ask for a set of angles or settings, then pick the best.",
          ] },
        ],
      },
    ],
    buzz: {
      title: "How to do it on BuzzVideo",
      steps: ["Upload your packshot.", "Describe the scene you want.", "Generate a set and download."],
      cta: { label: "Try AI Product Photography", href: "/ai-product-photography" },
      note: `Seedream 4.5 and Seedream 5.0 lite work with the ${SIGNUP_CREDITS} free credits new accounts get. Nano Banana 2.1, GPT Image 2.5 Sunburst and Seedream 5.5 are not covered by free credits.`,
    },
    faq: [
      { q: "Is AI replacing product photographers?", a: "For catalog variations and social content it often does the job; for hero campaigns many brands still shoot and use AI to extend the set." },
      { q: "Can I use AI product photos on Amazon or Shopify?", a: "Yes, as long as they show the real product accurately. Check each marketplace's image rules for the main image." },
      { q: "Can I try AI product photography for free?", a: `Yes, on BuzzVideo with Seedream 4.5 or Seedream 5.0 lite using the ${SIGNUP_CREDITS} free credits.` },
      { q: "Will the AI change my product's label?", a: "It can if you don't use your photo as a reference. BuzzVideo uses your packshot as the reference image and you should still check every label before publishing." },
    ],
    sources: [],
    related: ["/ai-product-photography", "/best-ai-product-photography-tools", "/create-ai-product-videos-free", "/remove-background"],
  },

  /* ───────────── TikTok AI video generator ───────────── */
  {
    slug: "tiktok-ai-video-generator",
    group: "Questions",
    title: "Does TikTok Have an AI Video Generator? | BuzzVideo",
    description: "Yes: TikTok has Symphony Creative Studio for advertisers and AI Alive in Stories. What each does, how AI is labeled, and other ways to make TikTok videos.",
    h1: "Does TikTok have an AI video generator?",
    answer:
      "Yes. TikTok's Symphony Creative Studio is a free AI tool for businesses that turns simple inputs into TikTok-ready video clips and adds avatars, translation and dubbing, and AI Alive turns a photo into a short video inside TikTok Stories. Both are built for TikTok; if you need the same ads for Reels, Shorts and other placements, a multi-model generator like BuzzVideo gives you every size from one brief.",
    card: "Symphony Creative Studio, AI Alive, and how they label AI.",
    media: { from: "video", match: "A product commercial made from photos", caption: "A 9:16 product commercial made from photos on BuzzVideo." },
    sections: [
      {
        id: "symphony",
        h2: "What is TikTok Symphony Creative Studio?",
        blocks: [
          { kind: "p", text: "TikTok describes Symphony Creative Studio as its end-to-end AI creative platform for TikTok-first ideas and assets, usable for organic and paid content. Its help page lists:" },
          { kind: "ul", items: [
            "Video generation from simple inputs.",
            "Image generation from text prompts.",
            "Avatars: a voiceover avatar that narrates your script and a product avatar that showcases an uploaded product or app screen.",
            "Translate and dub videos into other languages.",
            "A video editor and Symphony Agent, which turns a prompt into storyboards and generated videos.",
          ] },
        ],
      },
      {
        id: "ai-alive",
        h2: "What is TikTok AI Alive?",
        blocks: [
          { kind: "p", text: "AI Alive, announced in May 2025, turns a photo into a short video inside TikTok Stories. TikTok says AI Alive videos carry an AI-generated label and C2PA metadata." },
        ],
      },
      {
        id: "labels",
        h2: "Do AI-generated TikTok ads need a label?",
        blocks: [
          { kind: "p", text: "Yes. For ads, TikTok requires fully AI-generated or significantly AI-modified content to be disclosed, with the \"This ad contains AI-generated content\" toggle in Ads Manager or your own disclaimer. See [Are AI UGC ads legal?](/are-ai-ugc-ads-legal)." },
        ],
      },
      {
        id: "compare",
        h2: "When should I use another AI video generator for TikTok?",
        blocks: [
          { kind: "ul", items: [
            "When you want to choose the model, for example Kling 4.0 for 30-second single takes or Seedance 2.5 for premium shots.",
            "When the same campaign also runs on Reels, Shorts and Meta feeds in 1:1 and 16:9.",
            "When you want to work from ChatGPT or Claude through MCP.",
          ] },
        ],
      },
    ],
    buzz: {
      title: "How to do it on BuzzVideo",
      steps: ["Describe the TikTok ad or paste your product link.", "Ask for 9:16 with the hook in the first seconds.", "Generate, add the AI label when you upload it in TikTok Ads Manager."],
      cta: { label: "Make a TikTok video", href: "/tiktok-videos" },
      note: NO_FREE_VIDEO,
    },
    faq: [
      { q: "Does TikTok have an AI video generator?", a: "Yes. Symphony Creative Studio generates video for businesses, and AI Alive animates photos in Stories." },
      { q: "Is TikTok Symphony Creative Studio free?", a: "TikTok's help page describes it as a free tool for TikTok-first content." },
      { q: "Does TikTok label AI-generated videos?", a: "Yes. AI Alive outputs carry an AI-generated label and C2PA metadata, and AI-generated ads must be disclosed with TikTok's label or your own disclaimer." },
      { q: "What size should a TikTok video be?", a: "Vertical 9:16 is recommended, at least 540 x 960 px for ads. See [TikTok Ad Specs](/tiktok-ad-specs)." },
    ],
    sources: [
      { label: "TikTok Ads Manager: About Symphony Creative Studio", url: "https://ads.tiktok.com/help/article/about-symphony-creative-studio?lang=en" },
      { label: "TikTok Newsroom: Introducing TikTok AI Alive", url: "https://newsroom.tiktok.com/en-us/introducing-tiktok-ai-alive" },
      { label: "TikTok Ads Manager: How to add disclaimers to ads", url: "https://ads.tiktok.com/help/article/add-disclaimers-to-ads" },
    ],
    related: ["/tiktok-videos", "/tiktok-ad-specs", "/write-a-good-hook", "/tiktok-shop-videos"],
  },

  /* ───────────── AI in advertising examples ───────────── */
  {
    slug: "ai-in-advertising-examples",
    group: "Questions",
    title: "AI in Advertising Examples: 8 Ad Formats | BuzzVideo",
    description: "Real examples of AI in advertising: UGC reviews, unboxings, product commercials, talking products and more, all generated on BuzzVideo, with how each was made.",
    h1: "What are examples of AI in advertising?",
    answer:
      "The most common uses of AI in advertising today are making the creative itself: creator-style UGC videos, unboxings, product commercials from photos, talking-product characters, 3D turnarounds, product photos and new hooks or languages for ads that already work. Every example on this page was generated on BuzzVideo with fictional products.",
    card: "Eight ad formats, each with a real example made on BuzzVideo.",
    media: { from: "video", match: "talking product character", caption: "A talking-product character ad generated on BuzzVideo." },
    sections: [
      {
        id: "ugc",
        h2: "Can AI make UGC-style review ads?",
        blocks: [
          { kind: "p", text: "Yes. A generated person talks to camera about the product, from one product photo. Disclose that the person is AI-generated. Made with the [AI UGC Video Generator](/ai-ugc-video-generator)." },
          { kind: "media", media: { from: "video", match: "creator-style product review", caption: "UGC product review, generated from one product photo." } },
        ],
      },
      {
        id: "unboxing",
        h2: "Can AI make unboxing videos?",
        blocks: [
          { kind: "p", text: "Yes. Hands open the box and the camera settles on the label, without shipping a single unit. Made with the [AI Product Video Generator](/ai-product-video-generator)." },
          { kind: "media", media: { from: "video", match: "unboxing video made from one product photo", caption: "A 15-second unboxing from one product photo." } },
        ],
      },
      {
        id: "commercial",
        h2: "Can AI turn product photos into a commercial?",
        blocks: [
          { kind: "p", text: "Yes. Product stills become a short commercial with camera moves and sound. See the [AI Ad Generator](/ai-ad-generator)." },
          { kind: "media", media: { from: "video", match: "A product commercial made from photos", caption: "A product commercial made from photos." } },
        ],
      },
      {
        id: "link",
        h2: "Can AI make an ad from a product page link?",
        blocks: [
          { kind: "p", text: "Yes. The AI reads the page, picks the selling points and builds a vertical ad. See [URL to Video](/url-to-video)." },
          { kind: "media", media: { from: "video", match: "product page link", caption: "A vertical ad made from a product page link." } },
        ],
      },
      {
        id: "3d",
        h2: "Can AI make 3D product videos?",
        blocks: [
          { kind: "p", text: "Yes. A 360-degree turnaround from product photos, useful for product pages." },
          { kind: "media", media: { from: "video", match: "3D product turnaround", caption: "A 3D product turnaround video." } },
        ],
      },
      {
        id: "photos",
        h2: "Can AI make product photos and static ads?",
        blocks: [
          { kind: "p", text: "Yes. Your packshot in new scenes, with the label kept the same. See [Can AI do product photography?](/can-ai-do-product-photography)." },
          { kind: "media", media: { from: "image", match: "giant LUMEA", caption: "A surreal giant-product ad made with Nano Banana 2.1." } },
        ],
      },
      {
        id: "hooks",
        h2: "Can AI make new hooks for an ad that already works?",
        blocks: [
          { kind: "p", text: "Yes. Keep the body of a winning ad and generate new openings to fight creative fatigue. See [How to write a good hook](/write-a-good-hook)." },
          { kind: "media", media: { from: "extra", match: "hook-variants", caption: "The same product shot with an original hook and two new hook variants." } },
        ],
      },
      {
        id: "localize",
        h2: "Can AI localize ads into other languages?",
        blocks: [
          { kind: "p", text: "Yes. Translate the script, generate the voice and lip sync the presenter. See [AI Dubbing](/ai-dubbing)." },
          { kind: "media", media: { from: "extra", match: "ad-localizer", caption: "One ad localized for another market." } },
        ],
      },
    ],
    buzz: {
      title: "How to do it on BuzzVideo",
      steps: ["Pick the format you want from the examples above.", "Add a product photo, a page link or a one-line brief.", "Generate every size you need for TikTok, Reels and Meta."],
      cta: { label: "Make an AI ad", href: "/ai-ad-generator" },
      note: NO_FREE_VIDEO,
    },
    faq: [
      { q: "How is AI used in advertising?", a: "Mostly to make creative faster: scripts, product photos, video ads, voiceovers, new hooks and translations. Media buying tools also use AI for targeting and bidding." },
      { q: "Are these examples real ads?", a: "They are real outputs generated on BuzzVideo for fictional products, not client campaigns." },
      { q: "Do AI ads need to be labeled?", a: "On TikTok, yes: AI-generated ad content must be disclosed. Meta labels AI-made ad images with \"AI info\". See [Are AI UGC ads legal?](/are-ai-ugc-ads-legal)." },
    ],
    sources: [{ label: "TikTok Ads Manager: How to add disclaimers to ads", url: "https://ads.tiktok.com/help/article/add-disclaimers-to-ads" }],
    related: ["/ai-ad-generator", "/make-ugc-ads-with-ai", "/ai-product-video-generator", "/best-ai-ad-generators"],
  },

  /* ───────────── Make UGC ads with AI ───────────── */
  {
    slug: "make-ugc-ads-with-ai",
    group: "How-to guides",
    title: "How to Make UGC Ads with AI (Step by Step) | BuzzVideo",
    description: "Make UGC video ads with AI from one product photo: write the hook, pick the creator, generate in 9:16 and test variations. A step-by-step guide on BuzzVideo.",
    h1: "How do I make UGC ads with AI?",
    answer:
      "Start from one clear product photo, write a short script with a hook in the first seconds, describe the person and setting, and generate a 9:16 video with a model that keeps faces and labels consistent. Then make variations of the hook and person, test them, and disclose that the creator is AI-generated.",
    card: "From one product photo to tested 9:16 UGC ads.",
    media: { from: "video", match: "creator-style product review", caption: "An 8-second UGC product review made from one product photo on BuzzVideo." },
    sections: [
      {
        id: "steps",
        h2: "What are the steps to make a UGC ad with AI?",
        blocks: [
          { kind: "ol", items: [
            "Pick one sharp product photo with a readable label.",
            "Write a 15 to 30 second script: a hook, one problem, the product as the answer, a call to action. See [How to write a good hook](/write-a-good-hook).",
            "Describe the creator and setting: age range, style, where they are filming, selfie or tripod.",
            "Generate in 9:16. Kling 4.0 does up to 30 seconds in one take, so the face changes across fewer cuts.",
            "Check every frame for label errors and odd hands, then add captions.",
            "Make three to five variations of the hook or person and test them against your current ad.",
          ] },
        ],
      },
      {
        id: "prompt",
        h2: "What does a good UGC ad prompt look like?",
        blocks: [
          { kind: "p", text: "Example for a fictional serum: \"A 15s selfie video of a woman in her 20s in a bright bathroom, holding the serum from my photo. She says: 'I stopped buying three products after I found this one.' Close-up of the label at 8s. Ends with: 'Link's below.'\"" },
        ],
      },
      {
        id: "disclose",
        h2: "Do I need to disclose AI UGC ads?",
        blocks: [
          { kind: "p", text: "Yes on TikTok, which requires AI-generated ad content to be labeled, and US FTC guidance says people who look like real customers but aren't should be disclosed. Don't script the AI person to claim personal results. See [Are AI UGC ads legal?](/are-ai-ugc-ads-legal)." },
        ],
      },
    ],
    buzz: {
      title: "How to do it on BuzzVideo",
      steps: ["Upload your product photo to the AI UGC Video Generator.", "Paste the script or ask for three hooks.", "Generate 9:16, then ask for variations of the winner."],
      cta: { label: "Make a UGC ad", href: "/ai-ugc-video-generator" },
      note: NO_FREE_VIDEO,
    },
    faq: [
      { q: "Can AI make UGC ads?", a: "Yes. AI can generate a person talking about your product from one product photo and a script, in 9:16 for TikTok and Reels." },
      { q: "Which AI model is best for UGC ads?", a: "One that keeps the face and label consistent for the whole clip. On BuzzVideo, Kling 4.0 handles 30-second single takes and MiniMax H3 keeps characters consistent across clips." },
      { q: "How long should a UGC ad be?", a: "Most run 15 to 30 seconds, but the first 3 to 6 seconds matter most. TikTok advises prioritizing the hook in the first 6 seconds." },
      { q: "Is there a step-by-step tutorial?", a: "Yes, see the BuzzVideo blog post [How to Make a UGC Product Review Video with AI](/blog/ugc-product-review-video-ai)." },
    ],
    sources: [
      { label: "TikTok Ads Manager: Creative best practices", url: "https://ads.tiktok.com/help/article/creative-best-practices" },
      { label: "16 CFR 255.2, Consumer endorsements (Cornell LII)", url: "https://www.law.cornell.edu/cfr/text/16/255.2" },
    ],
    related: ["/ai-ugc-video-generator", "/do-ugc-ads-work", "/ai-ugc-vs-human-ugc", "/ugc-ad-templates"],
    howto: { name: "How to make UGC ads with AI", steps: ["Pick one sharp product photo.", "Write a 15 to 30 second script with a hook.", "Describe the creator and setting.", "Generate in 9:16.", "Check frames and add captions.", "Test three to five variations."] },
  },

  /* ───────────── Write a good hook ───────────── */
  {
    slug: "write-a-good-hook",
    group: "How-to guides",
    title: "How to Write a Good Hook for Video Ads | BuzzVideo",
    description: "A good video ad hook says who it's for and why to keep watching in the first seconds. Hook formulas, examples and TikTok's guidance on the first 3 to 6 seconds.",
    h1: "How do I write a good hook for a video ad?",
    answer:
      "A good hook tells the right viewer, in the first few seconds, why this video is worth their time: a problem they recognize, a surprising result or the product doing something visible. TikTok's creative guidance says to prioritize the hook in the first 6 seconds and introduce your proposition in the first 3. Write several and test them.",
    card: "Hook formulas and examples for the first 3 to 6 seconds.",
    media: { from: "extra", match: "hook-variants", caption: "One product shot, three hooks: original, creator selfie and studio portrait." },
    sections: [
      {
        id: "what",
        h2: "What makes a hook good?",
        blocks: [
          { kind: "ul", items: [
            "It is specific to one viewer and one problem.",
            "It shows, not only tells: the product moving, pouring, fixing or transforming.",
            "It matches what the rest of the ad delivers.",
            "Text on screen is short. TikTok recommends 5 to 10 words per second when using text.",
          ] },
        ],
      },
      {
        id: "formulas",
        h2: "What are proven hook formulas?",
        blocks: [
          { kind: "table", head: ["Formula", "Example (fictional serum brand LUMEA)"], rows: [
            ["Call out the viewer", "\"If your skin looks dull by 3 p.m., watch this.\""],
            ["Problem first", "\"I was using four products to do one job.\""],
            ["Result first", "Before-and-after in the first second, then: \"Here's what changed.\""],
            ["Show it working", "The serum drop hitting skin in macro, no words."],
            ["Unexpected visual", "A giant bottle standing in a city square."],
            ["Question", "\"Why does vitamin C go orange in the bottle?\""],
          ] },
        ],
      },
      {
        id: "test",
        h2: "How do I test hooks?",
        blocks: [
          { kind: "ol", items: [
            "Keep the body of the ad the same and change only the first 3 to 6 seconds.",
            "Write five hooks across different formulas, not five versions of one.",
            "Run them with equal budget and compare hold rate and cost per result.",
            "Keep the winner and write the next round from it.",
          ] },
        ],
      },
    ],
    buzz: {
      title: "How to do it on BuzzVideo",
      steps: ["Upload the ad that already works, or your product photo.", "Ask for five new hooks across different formulas.", "Generate the new openings and test them."],
      cta: { label: "Make hook variations", href: "/ai-ad-generator" },
      note: "Need lines only? The free [AI Hook Generator](/ai-hook-generator) writes opening lines with no sign-up.",
    },
    faq: [
      { q: "How long should a video ad hook be?", a: "The first 3 to 6 seconds. TikTok advises introducing your proposition in the first 3 seconds and prioritizing the hook in the first 6." },
      { q: "What is a hook in a TikTok ad?", a: "The opening seconds that make the right viewer stop scrolling: a line, a visual or both." },
      { q: "How many hooks should I test?", a: "Test several at once, ideally from different formulas, with the rest of the ad unchanged." },
      { q: "Can AI write and make ad hooks?", a: "Yes. AI can write hook lines and generate the new opening shots, keeping the rest of the ad the same." },
    ],
    sources: [{ label: "TikTok Ads Manager: Creative best practices", url: "https://ads.tiktok.com/help/article/creative-best-practices" }],
    related: ["/ai-hook-generator", "/make-ugc-ads-with-ai", "/tiktok-ad-specs", "/ad-hook-variants-mcp-skill"],
  },

  /* ───────────── TikTok ad specs ───────────── */
  {
    slug: "tiktok-ad-specs",
    group: "Specs and reference",
    title: "TikTok Ad Specs 2026: Size, Length, File Types | BuzzVideo",
    description: "TikTok video ad specs: 9:16 at 540x960 px or more, up to 10 minutes, 500 MB, MP4 or MOV, plus Spark Ads rules and creative tips. Checked Nov 2026.",
    h1: "What are the TikTok ad specs?",
    answer:
      "TikTok in-feed video ads should be vertical 9:16 at 540 x 960 px or larger (16:9 and 1:1 are also accepted), up to 10 minutes long and 500 MB, in .mp4, .mov, .mpeg, .3gp or .avi with a bitrate of at least 516 kbps. Spark Ads, which boost organic posts, take .mp4 or .mov with no length limit.",
    card: "Size, length, file types and safe zones for TikTok ads.",
    media: { from: "video", match: "A product commercial made from photos", caption: "A 9:16 video ad made on BuzzVideo." },
    sections: [
      {
        id: "video",
        h2: "What size and format should a TikTok video ad be?",
        blocks: [
          { kind: "table", head: ["Spec", "Non-Spark in-feed ads"], rows: [
            ["Aspect ratio", "9:16 (recommended), 16:9 or 1:1"],
            ["Minimum resolution", "9:16: 540 x 960 px · 16:9: 960 x 540 px · 1:1: 640 x 640 px"],
            ["Length", "Up to 10 minutes"],
            ["File size", "500 MB or less"],
            ["File types", ".mp4, .mov, .mpeg, .3gp, .avi"],
            ["Bitrate", "516 kbps or more"],
            ["Brand name", "1 line, up to 20 characters (10 for Chinese, Japanese and Korean)"],
          ] },
        ],
      },
      {
        id: "spark",
        h2: "What are the specs for Spark Ads?",
        blocks: [
          { kind: "p", text: "Spark Ads use an existing organic TikTok post. TikTok lists .mp4 or .mov with no duration restriction, and the caption comes from the organic post, up to 4 lines including emojis." },
        ],
      },
      {
        id: "safe-zone",
        h2: "What is the TikTok ad safe zone?",
        blocks: [
          { kind: "p", text: "TikTok's interface covers parts of the screen with the caption, buttons and account name. TikTok does not publish one fixed safe-zone size because it depends on the dimensions, caption length and ad format; it provides downloadable safe-zone templates in Ads Manager help. Keep faces, products and text away from the bottom and right edges." },
        ],
      },
      {
        id: "creative",
        h2: "What does TikTok recommend for ad creative?",
        blocks: [
          { kind: "ul", items: [
            "Shoot vertically at 9:16 and at least 720p.",
            "Use sound or music.",
            "Introduce the proposition in the first 3 seconds and prioritize the hook in the first 6.",
            "Show 5 to 10 words per second when using on-screen text.",
            "End with a clear call to action.",
          ] },
        ],
      },
    ],
    buzz: {
      title: "How to do it on BuzzVideo",
      steps: ["Describe the ad or upload your product photo.", "Ask for 9:16 at 1080p with the hook in the first seconds.", "Download the MP4 and upload it to TikTok Ads Manager, with the AI label on."],
      cta: { label: "Make a 9:16 video ad", href: "/ai-video-generator" },
      note: NO_FREE_VIDEO,
    },
    faq: [
      { q: "What is the best size for TikTok ads?", a: "Vertical 9:16, at least 540 x 960 px. 1080 x 1920 px is a common export size that meets the minimum." },
      { q: "How long can a TikTok ad be?", a: "Up to 10 minutes for non-Spark in-feed video ads; Spark Ads have no duration restriction. Most ads are far shorter." },
      { q: "What is the maximum file size for a TikTok video ad?", a: "500 MB for non-Spark ads." },
      { q: "Do AI-generated TikTok ads need a label?", a: "Yes. Turn on \"This ad contains AI-generated content\" in Ads Manager or add your own disclaimer." },
    ],
    sources: [
      { label: "TikTok Ads Manager: Video ads specifications", url: "https://ads.tiktok.com/help/article/video-ads-specifications" },
      { label: "TikTok Ads Manager: Creative best practices", url: "https://ads.tiktok.com/help/article/creative-best-practices" },
      { label: "TikTok Ads Manager: How to add disclaimers to ads", url: "https://ads.tiktok.com/help/article/add-disclaimers-to-ads" },
    ],
    related: ["/tiktok-ai-video-generator", "/write-a-good-hook", "/tiktok-ad-templates", "/tiktok-videos"],
  },

  /* ───────────── Glossary ───────────── */
  {
    slug: "glossary",
    group: "Specs and reference",
    title: "AI Video Glossary: 24 Terms Explained | BuzzVideo",
    description: "Plain-English definitions of AI video and ad terms: text-to-video, first and last frame, lip sync, AI avatar, voice cloning, UGC, MCP, hooks and more.",
    h1: "AI video glossary",
    answer:
      "Plain-English definitions of the terms you meet when making videos and ads with AI, from text-to-video and first-last frame to lip sync, voice cloning, UGC and MCP. Each entry says what the term means and where to do it on BuzzVideo.",
    card: "24 AI video and ad terms in plain English.",
    sections: [],
    buzz: { title: "Try it on BuzzVideo", steps: [], cta: { label: "Open the AI Video Generator", href: "/ai-video-generator" } },
    faq: [
      { q: "What is the difference between text-to-video and image-to-video?", a: "Text-to-video generates a clip from a written prompt only; image-to-video starts from an image you provide, which keeps a product or character looking the same." },
      { q: "What is an AI video model?", a: "The engine that generates the frames, such as Seedance 2.5, Kling 4.0 or Wan 3.0. BuzzVideo offers many models on one account so you can pick per shot." },
      { q: "What does MCP mean in AI?", a: "Model Context Protocol, an open standard that lets AI assistants such as Claude and ChatGPT use outside tools. BuzzVideo MCP lets them generate video and images." },
    ],
    sources: [],
    related: ["/learn", "/ai-video-generator", "/ai-video-models", "/mcp"],
    terms: [
      { term: "AI video generator", def: "Software that creates video clips from text, images or other video using a generative model. BuzzVideo's AI Video Generator runs models such as Seedance 2.5, Kling 4.0 and Wan 3.0 on one account.", href: "/ai-video-generator" },
      { term: "Text-to-video", def: "Generating a video from a written prompt alone. On BuzzVideo you describe the scene, camera and sound and pick the model.", href: "/text-to-video" },
      { term: "Image-to-video", def: "Animating a still image into a video, so the product or character keeps its look. BuzzVideo uses your image as the first frame or reference.", href: "/image-to-video" },
      { term: "First and last frame", def: "Giving the model both the opening and closing image so it generates the motion in between. Available on BuzzVideo with models that support keyframes.", href: "/first-last-frame" },
      { term: "Reference image", def: "An image the model uses to keep a product, face or style consistent without making it the first frame. On BuzzVideo you attach references in the prompt box." },
      { term: "Prompt", def: "The text instructions for a model: subject, action, setting, camera, light and sound. BuzzVideo shows each model's credit price before you send a prompt." },
      { term: "Aspect ratio", def: "The width-to-height shape of a video: 9:16 for TikTok and Reels, 1:1 or 4:5 for feeds, 16:9 for YouTube. BuzzVideo can output several ratios from one request." },
      { term: "Video extension", def: "Continuing an existing clip with new seconds that match it. BuzzVideo's AI Video Extender does this with supported models.", href: "/ai-video-extender" },
      { term: "Upscaling", def: "Increasing the resolution of a video or image, for example to 4K. BuzzVideo has upscalers for both.", href: "/upscale-video" },
      { term: "Lip sync", def: "Redrawing a person's mouth in a video to match new speech. BuzzVideo's AI Lip Sync takes new audio or a typed script.", href: "/ai-lip-sync" },
      { term: "AI avatar", def: "A digital presenter animated from a photo or generated from scratch that speaks a script. Make one from a single photo with BuzzVideo's Talking Avatar.", href: "/talking-avatar" },
      { term: "AI spokesperson", def: "An AI presenter, or a talking version of your product, that introduces what you sell. BuzzVideo makes these from a product photo and a script.", href: "/ai-spokesperson" },
      { term: "Text to speech (TTS)", def: "Turning written text into spoken audio with a synthetic voice. BuzzVideo's voiceover runs on Seed Audio 1.0, which works with free credits.", href: "/text-to-speech" },
      { term: "Voice cloning", def: "Learning a voice from a sample recording and using it to say new text. Only clone voices you have permission to use; on BuzzVideo, Seed Audio 1.0 does it.", href: "/ai-voice-clone" },
      { term: "AI dubbing", def: "Translating a video's speech into another language with a matching voice, often combined with lip sync. Available on BuzzVideo.", href: "/ai-dubbing" },
      { term: "UGC (user-generated content)", def: "Content made by customers or creators rather than the brand, usually filmed on a phone. In ads, \"UGC\" often means creator-style videos made for the brand.", href: "/do-ugc-ads-work" },
      { term: "AI UGC", def: "Creator-style videos where the person is AI-generated. BuzzVideo makes them from a product photo; disclose that the person is not a real customer.", href: "/ai-ugc-video-generator" },
      { term: "Hook", def: "The first seconds of a video ad that make the right viewer stop scrolling. BuzzVideo can generate new hooks for an ad that already works.", href: "/write-a-good-hook" },
      { term: "Creative fatigue", def: "When an ad's results drop because the same audience has seen it too often. The usual fix is new hooks or variations, which BuzzVideo generates from the winning ad." },
      { term: "Spark Ads", def: "TikTok's format for promoting an existing organic post as an ad. A BuzzVideo video posted organically can later run as a Spark Ad.", href: "/tiktok-ad-specs" },
      { term: "AI label (AIGC disclosure)", def: "A platform marker that an ad or post contains AI-generated content, such as TikTok's AIGC toggle or Meta's \"AI info\". Use it on AI videos you make with BuzzVideo.", href: "/are-ai-ugc-ads-legal" },
      { term: "C2PA", def: "An open standard for Content Credentials, metadata that records how media was made or edited. TikTok reads it to label AI content; it is relevant to anything you publish from BuzzVideo." },
      { term: "MCP (Model Context Protocol)", def: "An open protocol that lets AI assistants call outside tools. BuzzVideo MCP lets ChatGPT and Claude generate videos, images and audio on your BuzzVideo account.", href: "/mcp" },
      { term: "Credits", def: "BuzzVideo's unit of usage: each generation costs credits based on the model, length and resolution, shown before you generate. New accounts get free credits for Seedream images and Seed Audio 1.0.", href: "/pricing" },
    ],
  },
];

export const guideBySlug = (slug: string) => GUIDES.find((g) => g.slug === slug);

/* Academy 总页 */
export const LEARN = {
  slug: "learn",
  title: "BuzzVideo Academy: AI Video and Ad Guides | BuzzVideo",
  description: "Guides and straight answers on making video ads with AI: UGC, avatars, lip sync, voice cloning, TikTok and Amazon specs, plus step-by-step blog tutorials.",
  h1: "BuzzVideo Academy",
  lead: "BuzzVideo Academy is the free learning hub from BuzzVideo, the AI video and ad platform: short, sourced answers to the questions marketers search, plus step-by-step tutorials. Start with a question below, or jump to the blog tutorials for a full workflow.",
};
