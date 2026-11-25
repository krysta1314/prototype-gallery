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
    description: "Can Claude make videos? Not on its own. See what Claude can make, what Claude Motion is, and how BuzzVideo MCP lets Claude generate real video clips.",
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
      { q: "How long can a video made in Claude be?", a: "It depends on the model you ask for. Through BuzzVideo, Seedance 2.5 makes clips from 4 to 30 seconds at up to 1080p, and Kling 3.0 makes clips from 3 to 15 seconds." },
      { q: "Where do the videos I make in Claude go?", a: "Into your BuzzVideo library, the same one as the web app, on the same plan. The clip also comes back in the Claude conversation." },
      { q: "Can I use BuzzVideo MCP Skills in Claude?", a: "Yes. BuzzVideo has 26 MCP Skills, ready-made workflows such as Link to Ad and Long to Shorts. Ask Claude to use one by name and it runs the whole job." },
      { q: "Can I use videos made in Claude in my ads?", a: "Yes. Everything you generate on BuzzVideo can be used commercially on every plan, including clips you request from Claude through BuzzVideo MCP." },
    ],
    sources: [
      { label: "Claude Help Center: Get started with Claude Motion", url: "https://support.claude.com/en/articles/17454997-get-started-with-claude-motion" },
      { label: "Claude Help Center: Get started with custom connectors using remote MCP", url: "https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp" },
      { label: "Claude plans and pricing", url: "https://claude.com/pricing" },
    ],
    related: ["/claude-video-generator", "/mcp", "/mcp-skills", "/chatgpt-video-generator", "/can-chatgpt-make-videos"],
    howto: { name: "How to make videos in Claude with BuzzVideo MCP", steps: ["Open Customize, then Connectors, in Claude and choose Add custom connector.", "Paste the BuzzVideo connector URL https://mcp.buzzvideo.ai/mcp and name it BuzzVideo.", "Connect and sign in to BuzzVideo.", "Ask Claude for the video you want."] },
  },

  /* ───────────── Can ChatGPT make videos? ─────────────
     2026-11-25 逐页打开 OpenAI 官方页核对(见 sources):Sora 网页 / App 2026-04-26 停用、Sora API 2026-09-24 停用;
     ChatGPT Images 全档可用;插件从侧栏 Plugins 找、@ 提及调用，目录各套餐可见但能否安装 / 使用取决于套餐、工作区、角色、地区。
     「ChatGPT 现在不能自己出视频」是据此推断(官方没有一句原话),所以正文只陈述 Sora 停用 + 帮助中心只列图片生成。
     BuzzVideo 接入方式只用 repo 核实过的(v1.9 mcp FAQ:插件目录找 BuzzVideo 点 Add;v1.12 data.ts:@BuzzVideo),不写目录网址。 */
  {
    slug: "can-chatgpt-make-videos",
    group: "Questions",
    title: "Can ChatGPT Make Videos? What Works Today | BuzzVideo",
    description: "Can ChatGPT make videos? Not since OpenAI discontinued Sora in 2026. See what ChatGPT still makes and how BuzzVideo adds video models to the chat.",
    h1: "Can ChatGPT make videos?",
    answer:
      "Not on its own today. ChatGPT writes scripts, storyboards and prompts and creates images, but OpenAI discontinued Sora, its video product, on April 26, 2026. Add BuzzVideo to ChatGPT and it can call video models such as Seedance 2.5, Kling 4.0 and Wan 3.0 from the chat, with the finished clips saved to your BuzzVideo library.",
    card: "ChatGPT plans the video. BuzzVideo MCP generates it.",
    media: { from: "video", match: "unboxing video made from one product photo", caption: "An unboxing video made from one product photo with a BuzzVideo MCP Skill." },
    sections: [
      {
        id: "what-chatgpt-can-make",
        h2: "What can ChatGPT make by itself?",
        blocks: [
          { kind: "p", text: "ChatGPT is strongest at the planning half of a video: the concept, the script, the shot list, the voiceover copy and the prompts you hand to a video model. It also creates still images." },
          {
            kind: "ul",
            items: [
              "Scripts, hooks and voiceover copy for ads of any length.",
              "Shot lists and storyboards written out scene by scene.",
              "Prompts tuned for a specific video or image model.",
              "Still images. OpenAI's help center says ChatGPT Images is available on all tiers.",
            ],
          },
        ],
      },
      {
        id: "what-happened-to-sora",
        h2: "What happened to Sora?",
        blocks: [
          { kind: "p", text: "Sora was OpenAI's video generation product. OpenAI's help center says the Sora web and app experiences were discontinued on April 26, 2026, and the Sora API on September 24, 2026." },
          { kind: "p", text: "OpenAI's Sora page now points people to image creation in ChatGPT instead. To get a video out of a ChatGPT conversation today, ChatGPT has to call a video service through a plugin." },
        ],
      },
      {
        id: "connect-buzzvideo",
        h2: "How do I make videos in ChatGPT with BuzzVideo?",
        blocks: [
          {
            kind: "ol",
            items: [
              "Open Plugins in the ChatGPT sidebar and find BuzzVideo.",
              "Add it and sign in to your BuzzVideo account once.",
              "Start a new chat and type @BuzzVideo so ChatGPT uses it.",
              "Ask for what you need, for example: \"@BuzzVideo Make a 15-second 9:16 unboxing video of my product. Ask me to upload the product photo first.\"",
            ],
          },
          { kind: "note", text: "OpenAI's help center says the plugin directory is available across ChatGPT plans, but installing or using a plugin depends on your plan, workspace, role and region. BuzzVideo MCP itself needs a BuzzVideo Starter, Pro or Ultra plan." },
          { kind: "p", text: "For repeatable jobs, [MCP Skills](/mcp-skills) package a whole workflow, such as turning a product link into an ad or making a creator-style review from one product photo." },
        ],
      },
      {
        id: "which-models",
        h2: "Which video models can ChatGPT use through BuzzVideo?",
        blocks: [
          { kind: "p", text: "The same models as the BuzzVideo web app, including [Seedance 2.5](/seedance-2-5), Seedance 2.0, [Kling 3.0](/kling-3-0), [MiniMax H3](/minimax-h3) and [Gemini Omni 1.2 Flash](/gemini-omni-1-2-flash) for video, plus image models and Seed Audio 1.0 for voice. BuzzVideo names the model it used in the reply, and you can ask for a specific one." },
        ],
      },
      {
        id: "chatgpt-alone-vs-buzzvideo",
        h2: "What changes when BuzzVideo is added to ChatGPT?",
        blocks: [
          { kind: "p", text: "ChatGPT keeps doing the writing and the images. BuzzVideo adds the part ChatGPT no longer has: generating the video itself." },
          { kind: "table", head: ["", "ChatGPT on its own", "ChatGPT with BuzzVideo"], rows: [
            ["Scripts, hooks and shot lists", "Yes", "Yes"],
            ["Still images", "Yes, with ChatGPT Images", "Yes, plus BuzzVideo's image models"],
            ["Realistic video clips", "No, since Sora was discontinued", "Yes, on models such as Seedance 2.5, Kling 4.0 and Wan 3.0"],
            ["Clip length", "Not applicable", "Depends on the model: Seedance 2.5 makes 4 to 30 seconds per take"],
            ["Voiceover", "Script only", "Generated with Seed Audio 1.0"],
            ["Where results are saved", "The chat", "The chat and your BuzzVideo library"],
          ] },
        ],
      },
      {
        id: "prompt-tips",
        h2: "What should I ask ChatGPT for to get a good video?",
        blocks: [
          { kind: "p", text: "A video request works best when it reads like a short brief. Put these in the same message, after @BuzzVideo:" },
          { kind: "ul", items: [
            "The length and shape, for example \"15 seconds, 9:16\" for TikTok and Reels or \"16:9\" for a product page.",
            "What happens on screen, in order: the opening shot, the product moment and the last frame.",
            "The product photo or product page link, so the label and shape come from the real item.",
            "The model, if you have a preference, such as Seedance 2.5 for a premium hero shot or Kling 4.0 for a continuous take with sound.",
            "Any spoken line or voiceover script, word for word.",
          ] },
          { kind: "p", text: "A useful pattern is to let ChatGPT write three hooks first, pick one, then ask @BuzzVideo to make the video from it. Every clip lands in your library, so you can return to the best one later and ask for new versions." },
        ],
      },
    ],
    buzz: {
      title: "How to do it on BuzzVideo",
      steps: ["Add BuzzVideo to ChatGPT from Plugins and sign in.", "Start your message with @BuzzVideo.", "Describe the video, attaching a product photo or link if you have one."],
      cta: { label: "Connect BuzzVideo MCP", href: "/mcp" },
      note: "Everything you generate from ChatGPT lands in the same BuzzVideo library and uses the same plan as the web app.",
    },
    faq: [
      { q: "Can ChatGPT generate videos?", a: "Not by itself today. OpenAI discontinued Sora, its video product, in 2026. ChatGPT can write the script and prompts, and with a plugin such as BuzzVideo it can call a video model and return the clip in the chat." },
      { q: "Is Sora still available?", a: "No. OpenAI's help center says the Sora web and app experiences were discontinued on April 26, 2026, and the Sora API on September 24, 2026." },
      { q: "Can ChatGPT make images?", a: "Yes. OpenAI's help center says ChatGPT Images is available on all tiers. Images are a good starting point for video: generate a product shot, then ask BuzzVideo to animate it." },
      { q: "Is BuzzVideo free to use in ChatGPT?", a: `No. BuzzVideo MCP needs a BuzzVideo Starter, Pro or Ultra plan. The ${SIGNUP_CREDITS} free credits new BuzzVideo accounts get are for the web app's Seedream images and Seed Audio 1.0.` },
      { q: "Does the same setup work in Claude?", a: "Yes. In Claude you add BuzzVideo as a custom connector instead. See [Can Claude make videos?](/can-claude-make-videos)" },
      { q: "How do I add BuzzVideo to ChatGPT?", a: "Find BuzzVideo under Plugins in the ChatGPT sidebar, click Add and sign in to BuzzVideo once. Then start a message with @BuzzVideo. Whether you can install plugins depends on your ChatGPT plan, workspace, role and region." },
      { q: "Which video models can ChatGPT use through BuzzVideo?", a: "The same ones as the BuzzVideo web app, including Seedance 2.5, Seedance 2.0, Kling 3.0, MiniMax H3 and Gemini Omni 1.2 Flash. BuzzVideo names the model it used in the reply, and you can ask for a specific one." },
      { q: "Where do the videos I make in ChatGPT go?", a: "Into your BuzzVideo library, the same one as the web app, on the same plan. The clip also comes back in the chat." },
      { q: "Can I use BuzzVideo MCP Skills in ChatGPT?", a: "Yes. Ask ChatGPT to use a skill by name, such as the BuzzVideo link-to-ad or ugc-product-review skill, and it runs the whole workflow." },
      { q: "Can I use videos made in ChatGPT with BuzzVideo commercially?", a: "Yes. Everything you generate on BuzzVideo can be used commercially on every plan, including clips you request from ChatGPT." },
    ],
    sources: [
      { label: "OpenAI Help Center: What to know about the Sora discontinuation", url: "https://help.openai.com/en/articles/20001152-what-to-know-about-the-sora-discontinuation" },
      { label: "OpenAI: Sora 2 is here (discontinuation notice)", url: "https://openai.com/index/sora-2/" },
      { label: "OpenAI Help Center: Images in ChatGPT", url: "https://help.openai.com/en/articles/11084440-chatgpt-images" },
      { label: "OpenAI Help Center: Plugins in ChatGPT", url: "https://help.openai.com/en/articles/20001256-plugins-in-chatgpt" },
    ],
    related: ["/chatgpt-video-generator", "/mcp", "/mcp-skills", "/video-generation-mcp", "/can-claude-make-videos"],
    howto: { name: "How to make videos in ChatGPT with BuzzVideo", steps: ["Open Plugins in the ChatGPT sidebar and find BuzzVideo.", "Add BuzzVideo and sign in to your BuzzVideo account.", "Start a new chat and type @BuzzVideo.", "Ask for the video you want."] },
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
      {
        id: "anatomy",
        h2: "What does a UGC ad that works usually include?",
        blocks: [
          { kind: "p", text: "Most UGC ads that hold attention follow the same short structure. Treat it as a checklist when you write or review a script, not as a formula." },
          { kind: "table", head: ["Part", "What it does", "Example"], rows: [
            ["Hook", "Stops the scroll in the first seconds", "\"I didn't expect this to fix my dry skin.\""],
            ["Problem", "Names the situation the viewer is in", "\"Every moisturizer I tried felt greasy by noon.\""],
            ["Product in use", "Shows the product doing its job on camera", "Applying it, opening it, wearing it"],
            ["Proof", "Gives a reason to believe", "A close-up of the texture, the label or the result"],
            ["Call to action", "Tells the viewer what to do next", "\"Tap the link to try it.\""],
          ] },
          { kind: "p", text: "Keep the claims honest. A creator-style ad can say what the product is and how to use it, but it should not invent results, reviews or customer stories." },
        ],
      },
      {
        id: "mistakes",
        h2: "What are the most common UGC ad mistakes?",
        blocks: [
          { kind: "ul", items: [
            "Opening with a logo or a slow intro instead of the hook.",
            "Showing the product only at the end, after most viewers have scrolled past.",
            "Changing several things between versions, so you cannot tell which change made the difference.",
            "Calling a test after a day of spend instead of waiting for enough purchases or leads to compare.",
            "Exporting in 16:9 for a vertical feed. TikTok, Reels and Shorts are 9:16.",
          ] },
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
      { q: "What is a UGC ad?", a: "A UGC ad is a short video that looks like content a real person made, usually someone talking to camera about a product or using it. Brands run it as a paid ad, filmed by a creator or generated with AI." },
      { q: "Where do UGC ads work best?", a: "In vertical, sound-on feeds: TikTok, Instagram Reels and YouTube Shorts, where a person talking to camera looks like the posts around it. Make them in 9:16." },
      { q: "How many UGC versions should I test at once?", a: "Three to five is a practical start. Change one thing per version, such as the hook, the person or the setting, so you can see what moved the result." },
      { q: "Can I make UGC ads with AI from one product photo?", a: "Yes. On BuzzVideo you upload one product photo, describe the creator and the hook, and generate 9:16 videos with Kling 4.0, Seedance 2.5 or MiniMax H3. Kling 4.0 and Seedance 2.5 make single takes up to 30 seconds." },
      { q: "Can I use AI UGC ads made on BuzzVideo commercially?", a: "Yes. Everything you generate on BuzzVideo can be used commercially on every plan, including paid ads. Do not present an AI person as a real customer giving a real review." },
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
          { kind: "p", text: "You can also combine them: Hybrid Reel on BuzzVideo edits your real footage together with AI-generated shots." },
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
    description: `Create AI product videos free: what ${SIGNUP_CREDITS} BuzzVideo sign-up credits cover (product photos and voiceovers) and the cheapest way to animate them into video.`,
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
      {
        id: "prepare",
        h2: "What should I prepare before I spend credits on video?",
        blocks: [
          { kind: "p", text: "Video is the step that costs the most, so settle everything else first with the free credits. By the time you animate, you should only be choosing the motion." },
          { kind: "ul", items: [
            "The first frame: a product scene you are happy with. Seedream 4.5 outputs 2K or 4K in eight aspect ratios, including 9:16 for social and 16:9 for product pages, and takes up to 14 reference images.",
            "The voiceover: the script read the way you want it. Seed Audio 1.0 costs 0.5 credits per second, so a 30-second read is 15 credits.",
            "The shot: one sentence that says what moves, for example \"slow push-in on the bottle, steam rising from the cup behind it\".",
            "The length and shape: where the video will run decides 9:16 or 16:9 before you generate, not after.",
          ] },
        ],
      },
      {
        id: "plans",
        h2: "Which plan do I need to turn product photos into video?",
        blocks: [
          { kind: "table", head: ["Plan", "Product photos and audio", "Product video"], rows: [
            ["Free", `${SIGNUP_CREDITS} one-time credits on Seedream 4.5, Seedream 5.0 lite and Seed Audio 1.0`, "Not included"],
            ["Starter", "All image models", "Most video models, including Seedance 2.0 Fast and Seedance 2.0 Mini"],
            ["Pro and Ultra", "All image models", "Adds Seedance 2.5 and Seedance 2.0"],
          ] },
          { kind: "p", text: "Work made on the Free plan carries a watermark; Starter, Pro and Ultra remove it. Everything you generate on BuzzVideo can be used commercially on every plan, including Free. See [pricing](/pricing) for current plan prices." },
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
      { q: "Which plan do I need for AI product videos?", a: "Starter or above. Starter includes most video models, including Seedance 2.0 Fast and Seedance 2.0 Mini; Seedance 2.5 and Seedance 2.0 need Pro or Ultra." },
      { q: "How much does a free voiceover cost in credits?", a: "Seed Audio 1.0 costs 0.5 credits per second, so a 30-second voiceover uses 15 of your free credits." },
      { q: "Can I use images made with free credits commercially?", a: "Yes. Everything you generate on BuzzVideo can be used commercially on every plan, including Free. Work made on the Free plan carries a watermark, which Starter, Pro and Ultra remove." },
      { q: "Which model is best for cheap draft product videos?", a: "A short, fast model such as Seedance 2.0 Mini, which makes 4 to 15 second clips at 480p or 720p. Render the final version on a higher-quality model like Seedance 2.5 or Kling 4.0." },
      { q: "How long can an AI product video be?", a: "Up to 30 seconds in one take on Seedance 2.5, Kling 4.0 and Wan 3.0, at up to 1080p. For a longer video, generate several clips and join them." },
      { q: "What kind of product photo works best?", a: "A sharp, front-on photo with a readable label. Add more angles if you want a 3D turnaround, and say \"keep the label exactly the same\" in the prompt." },
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
      {
        id: "structure",
        h2: "How do I structure a 30 to 90 second Amazon product video?",
        blocks: [
          { kind: "p", text: "Amazon's guidance puts the most important feature in the first 5 to 10 seconds. A simple running order that respects that rule:" },
          { kind: "table", head: ["Time", "What to show"], rows: [
            ["0 to 10 s", "The product and its main benefit, in one clear shot"],
            ["10 to 40 s", "The product in use in an everyday setting"],
            ["40 to 70 s", "Two or three key features, one per shot, with close-ups of details and labels"],
            ["70 to 90 s", "What comes in the box, size or setup, and a final hero shot"],
          ] },
          { kind: "p", text: "For a 30-second video, keep the first and last rows and pick one in-use shot and one feature shot. Shorter is fine as long as the main feature comes first." },
        ],
      },
      {
        id: "mistakes",
        h2: "What should I check before I upload to Amazon?",
        blocks: [
          { kind: "ul", items: [
            "The main feature appears in the first 5 to 10 seconds, not after an intro.",
            "The file is .mp4 or .mov and under 5 GB.",
            "The resolution is no higher than 1080p, and the export is the best quality you have.",
            "Labels and small text are readable on a phone screen.",
            "You have a thumbnail ready if you don't want the system-generated one: .jpg, .png, .gif or .bmp.",
            "The length fits what the Seller Central upload screen shows for your marketplace.",
          ] },
        ],
      },
      {
        id: "ai",
        h2: "Can I make an Amazon product video from product photos with AI?",
        blocks: [
          { kind: "p", text: "Yes. An [AI product video generator](/ai-product-video-generator) animates your existing product photos, so the label and shape come from the real item. On BuzzVideo, Seedance 2.5, Kling 4.0 and Wan 3.0 make single takes of up to 30 seconds at up to 1080p, in 16:9 for listings and 9:16 for social from the same run." },
          { kind: "p", text: "Generate one clip per row of the running order above, then join them to reach 30 to 90 seconds. Add a voiceover with Seed Audio 1.0 if you want narration." },
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
      { q: "What resolution should an Amazon product video be?", a: "Up to 1080p. Amazon recommends uploading the highest quality available, within the 1080p and 5 GB limits." },
      { q: "What should the first 10 seconds of an Amazon video show?", a: "The product and its most important feature. Amazon's guidance says successful videos show the key feature in the first 5 to 10 seconds." },
      { q: "Can I use a custom thumbnail for an Amazon product video?", a: "Yes. Amazon accepts a system-generated thumbnail or a custom one in .jpg, .png, .gif or .bmp." },
      { q: "How many AI clips do I need for a 60-second Amazon video?", a: "Usually two to four. BuzzVideo models such as Seedance 2.5 and Kling 4.0 make single takes of up to 30 seconds, so join a few clips to reach 30 to 90 seconds." },
      { q: "Can I use AI-generated product videos commercially?", a: "Yes. Everything you generate on BuzzVideo can be used commercially on every plan. Make sure the video shows your product accurately before you upload it." },
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
      {
        id: "upload-or-link",
        h2: "Should I upload the video or link it from YouTube?",
        blocks: [
          { kind: "table", head: ["", "Upload to Shopify", "YouTube or Vimeo link"], rows: [
            ["Limits", "Up to 10 minutes, 1 GB and 4K", "Set by YouTube or Vimeo"],
            ["File types", ".mp4, .mov, .webm", "A standard watch link; YouTube Shorts links aren't supported"],
            ["Visibility rules", "None beyond your theme", "YouTube must be Public or Unlisted; Vimeo must allow embedding"],
            ["Streaming", "Shopify streams at 480p, 720p or 1080p", "Played through the YouTube or Vimeo player"],
            ["Best for", "Short product loops in the gallery", "Longer videos you already host elsewhere"],
          ] },
          { kind: "p", text: "For short clips that sit next to product photos, uploading keeps the video inside your store's media gallery with no outside player. Link a hosted video when it is long or you already publish it on a channel." },
        ],
      },
      {
        id: "what-to-show",
        h2: "What kind of video works best on a Shopify product page?",
        blocks: [
          { kind: "ul", items: [
            "A turntable or 3D turnaround that shows every side of the product.",
            "A close-up of the label, texture or finish that photos don't capture.",
            "The product in use, so shoppers see the size and how it works.",
            "A short loop that makes sense with the sound off.",
          ] },
          { kind: "p", text: "Put the video first in the Media section only if it shows the product clearly in the opening frame, because the first item is the featured media." },
        ],
      },
      {
        id: "checklist",
        h2: "What should I check after adding the video?",
        blocks: [
          { kind: "ol", items: [
            "Open the product page on your storefront and confirm the video plays.",
            "Check it on a phone, where most shoppers will see it.",
            "If it doesn't show, update your theme or switch to an Online Store 2.0 theme built by Shopify.",
            "Confirm the gallery order: the featured media should still be the image or video you want first.",
          ] },
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
      { q: "How many videos can a Shopify product have?", a: "A product can have up to 250 media items in total, counting images, 3D models and videos together." },
      { q: "Can a video be the main media on a Shopify product?", a: "Yes. Drag the video to the first position in the Media section; the first media item is the product's featured media." },
      { q: "Can I add a Vimeo video to a Shopify product?", a: "Yes. In the Media section, click Select existing, then Add from URL, and paste https://vimeo.com/[video-id]. The Vimeo video must allow embedding." },
      { q: "Does Shopify compress product videos?", a: "Shopify converts uploaded videos to .mp4 or HLS and streams them at 480p, 720p or 1080p depending on the viewer's connection." },
      { q: "Can I make a Shopify product video with AI?", a: "Yes. Upload a product photo to BuzzVideo's AI Product Video Generator, ask for a turntable, label close-up or in-use shot in 16:9 or 1:1, and add the MP4 in the product's Media section." },
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
    description: "How to make an AI avatar video from one photo: upload a portrait, add a voice track and get a lip-synced talking video up to 15 minutes long on BuzzVideo.",
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
        id: "models",
        h2: "Which AI avatar model should I choose?",
        blocks: [
          { kind: "table", head: ["", "Kling AI Avatar v2 Pro", "MiniMax H3 Max"], rows: [
            ["Voice track length", "Up to 5 minutes", "5 seconds to 15 minutes"],
            ["Who can be the avatar", "A person, an animal or a cartoon character", "One clear photo of a person"],
            ["Resolution choice", "No resolution setting", "480p, 768p, 1080p or 2K"],
            ["Direction", "Guide the delivery with a prompt", "Pick the output resolution"],
            ["Best for", "Expressive, natural delivery, mascots and pets", "Long presenter, training and explainer videos"],
          ] },
          { kind: "p", text: "The photo can be a JPG, PNG or WEBP up to 20 MB. The finished video is as long as your audio, so trim the voice track before you generate rather than after." },
        ],
      },
      {
        id: "avatar-vs-other",
        h2: "What is the difference between a talking avatar, lip sync and a spokesperson video?",
        blocks: [
          { kind: "ul", items: [
            "Talking avatar: starts from a still photo and generates the whole video, with the face moving to your voice track.",
            "[AI lip sync](/how-to-do-ai-lip-sync): starts from a video you already have and redraws the mouth to match new speech.",
            "[AI Spokesperson Video](/ai-spokesperson): a presenter who shows or holds your product, made with a video model from a brief.",
          ] },
          { kind: "p", text: "If you have no footage, start with a talking avatar. If you have a clip and only the words need to change, use lip sync." },
        ],
      },
      {
        id: "voice",
        h2: "How do I make the voice track for an avatar?",
        blocks: [
          { kind: "p", text: "Talking Avatar needs an audio file, not typed text. Three ways to get one:" },
          { kind: "ol", items: [
            "Record it yourself on a phone in a quiet room, one speaker, no music.",
            "Generate it from a script with [AI Voice Over](/ai-voice-over). Seed Audio 1.0 speaks 21 languages and costs 0.5 credits per second.",
            "Use your own cloned voice so the avatar sounds like you. See [How to clone your voice with AI](/clone-your-voice-with-ai).",
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
      { q: "Can I type a script instead of uploading audio?", a: "Not in Talking Avatar. Generate the speech first with AI Voice Over or record it yourself, then upload the audio file as the voice track." },
      { q: "What resolution is an AI avatar video?", a: "Up to 2K with MiniMax H3 Max, which offers 480p, 768p, 1080p and 2K." },
      { q: "What photo formats can I use for an AI avatar?", a: "JPG, PNG or WEBP, up to 20 MB. Use one clear, front-facing portrait with the mouth visible." },
      { q: "How is an AI avatar video different from lip sync?", a: "A talking avatar starts from a still photo and generates the whole video. AI Lip Sync starts from an existing video and re-syncs the mouth to new speech." },
      { q: "Can I use AI avatar videos in ads?", a: "Yes. Everything you generate on BuzzVideo can be used commercially on every plan. Use a photo you own or have permission to use, and label AI content where the ad platform requires it." },
      { q: "Can I make a talking avatar in Canvas?", a: "Yes. Select an image node in Canvas and pick Talking Avatar from the node toolbar; the result lands on the board as a new video node." },
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
      {
        id: "models",
        h2: "Which AI voice cloning model should I use?",
        blocks: [
          { kind: "table", head: ["Model", "What it does", "Best for"], rows: [
            ["Seed Audio 1.0", "Clones a voice from an uploaded sample (up to 3 reference voices) and reads any script in 21 languages; works with free credits", "Voiceovers and multi-speaker scenes in your own voice"],
            ["Voice Replication 2.0", "Clones a voice from a reference recording, in Chinese, English, Japanese, Spanish, Indonesian, Portuguese and more", "A reusable cloned voice for narration across many videos"],
          ] },
        ],
      },
      {
        id: "uses",
        h2: "What can I do with a cloned voice?",
        blocks: [
          { kind: "ul", items: [
            "Founder-voiced ads: your own voice on every ad without recording each one.",
            "Consistent narration: one narrator across a whole series of product or how-to videos.",
            "Other languages: paste a translated script and the cloned voice reads it.",
            "Dubbing: voice a translated script, then use [AI Lip Sync](/ai-lip-sync) to match the speaker's mouth to it. See [AI Dubbing](/ai-dubbing).",
            "Talking avatars: upload the cloned voiceover as the voice track for [an AI avatar video](/make-ai-avatar-video).",
          ] },
        ],
      },
      {
        id: "cost",
        h2: "How much does it cost to clone a voice on BuzzVideo?",
        blocks: [
          { kind: "p", text: `Audio made with Seed Audio 1.0 is billed at 0.5 credits per second, so a 30-second read in your cloned voice costs 15 credits and a 60-second read costs 30. Seed Audio 1.0 works with the ${SIGNUP_CREDITS} free credits new accounts get, and the price shows before you create.` },
          { kind: "p", text: "If a read comes back with the wrong pacing, change the punctuation in the script before regenerating: commas and full stops add pauses, and shorter sentences sound more natural than long ones." },
        ],
      },
    ],
    buzz: {
      title: "How to do it on BuzzVideo",
      steps: ["Open AI Voice Clone and upload your sample.", "Paste the script after the @Audio1 reference.", "Generate and use the voice on any video."],
      cta: { label: "Clone your voice", href: "/ai-voice-clone" },
      note: `Seed Audio 1.0 works with the ${SIGNUP_CREDITS} free credits new accounts get. Voice Replication 2.0 is available too.`,
    },
    faq: [
      { q: "How long does a voice sample need to be?", a: "Short is fine if it is clean: one speaker with no music or background noise matters more than length." },
      { q: "Is AI voice cloning free?", a: `On BuzzVideo it runs on Seed Audio 1.0, which works with the ${SIGNUP_CREDITS} free credits new accounts get.` },
      { q: "Can my cloned voice speak other languages?", a: "Yes. Paste a translated script and the cloned voice reads it; Seed Audio 1.0 speaks 21 languages. Check the result with a native speaker before you publish." },
      { q: "Can I clone a celebrity's voice?", a: "Not without permission. Platforms such as TikTok prohibit misusing a public figure's likeness, and many places have laws on voice and likeness." },
      { q: "How much does AI voice cloning cost?", a: "Seed Audio 1.0 is billed at 0.5 credits per second, so a 30-second read in your cloned voice costs 15 credits. The price shows before you create." },
      { q: "Which voice cloning models does BuzzVideo have?", a: "Two: Seed Audio 1.0, which clones from up to 3 reference voices and reads scripts in 21 languages, and Voice Replication 2.0, which clones a voice from a reference recording in Chinese, English, Japanese, Spanish, Indonesian, Portuguese and more." },
      { q: "Can I use my cloned voice in videos?", a: "Yes. Use the result as a voiceover on any video in Canvas, as the narrator of a faceless video or as the voice track of a talking avatar." },
      { q: "Can I dub a video into another language in my own voice?", a: "Yes, in two steps: have your cloned voice read the translated script, then use AI Lip Sync to match the speaker's mouth to the new audio." },
      { q: "Can I use my cloned voice in commercial ads?", a: "Yes. Everything you generate on BuzzVideo can be used commercially on every plan, including Free, as long as the voice is yours or you have permission to use it." },
      { q: "What makes a good voice sample?", a: "A recording of one speaker with no music or background noise, read in the tone you want back. A clean sample gives the closest match." },
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
    description: "How to do AI lip sync on a video: upload the clip, add new audio or a typed script, and generate. Steps, model limits and tips for clean results.",
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
      {
        id: "uses",
        h2: "What can I use AI lip sync for?",
        blocks: [
          { kind: "ul", items: [
            "Fix a line: change a price, an offer or a product name without reshooting.",
            "Hook tests: give the same clip several different opening lines and run them against each other.",
            "New languages: make a voiceover in another language, then sync the face to it.",
            "Re-voicing long videos: replace the whole audio of a talking-head video up to 15 minutes with MiniMax H3 Max.",
          ] },
        ],
      },
      {
        id: "dubbing",
        h2: "How do I dub a video into another language with lip sync?",
        blocks: [
          { kind: "p", text: "Dubbing on BuzzVideo is two steps, and lip sync is the second one." },
          { kind: "ol", items: [
            "Make the new-language voiceover from a translated script with Seed Audio 1.0, which speaks 21 languages, or MiniMax Speech 2.8 HD, which covers 40+ languages with 17 preset voices.",
            "Open AI Lip Sync, upload the original video and the new audio, and generate.",
          ] },
          { kind: "p", text: "Keep the translated script close to the original length. On MiniMax H3 Max the audio cannot be longer than the video. See [AI Dubbing](/ai-dubbing) for the full workflow." },
        ],
      },
      {
        id: "lengths",
        h2: "What happens if the audio and video are different lengths?",
        blocks: [
          { kind: "p", text: "On MiniMax H3 Max you choose how to handle it before you generate:" },
          { kind: "table", head: ["Option", "What it does"], rows: [
            ["Trim", "Cuts both to the shorter one"],
            ["Loop", "Repeats the video to fill the audio"],
            ["Bounce", "Plays the video forward, then backward"],
            ["Pad", "Adds silence to the end of the audio"],
          ] },
          { kind: "p", text: "Kling LipSync takes 2 to 60 seconds of audio for a 2 to 10 second clip, so trim long audio before you upload it." },
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
      { q: "Can I translate a video with lip sync?", a: "Yes: make the translated voiceover first with Seed Audio 1.0 or MiniMax Speech 2.8 HD, then lip sync the video to it. See [AI Dubbing](/ai-dubbing)." },
      { q: "Which lip sync model should I choose?", a: "Use Kling LipSync for short clips, when you want to type a script, or to keep the original quality. Use MiniMax H3 Max for longer videos with your own audio; it outputs 480p or 768p." },
      { q: "What kind of video works best for lip sync?", a: "A clip where the face is clear, well lit and mostly facing the camera. Covered mouths, extreme profiles and very fast head turns sync less accurately." },
      { q: "Is AI lip sync free?", a: `No. AI Lip Sync is a video tool and needs a Starter, Pro or Ultra plan. The voiceover itself can be made with Seed Audio 1.0 on the ${SIGNUP_CREDITS} free credits new accounts get.` },
      { q: "How is lip sync different from a talking avatar?", a: "Lip sync starts from an existing video and re-syncs the mouth to new speech. A talking avatar starts from a still photo and generates the whole video." },
      { q: "Can I use lip-synced videos in ads?", a: "Yes. Everything you generate on BuzzVideo can be used commercially on every plan, as long as the person on camera has agreed to the change." },
      { q: "What if my audio is longer than my video?", a: "On MiniMax H3 Max the audio cannot be longer than the video, so shorten the script or the audio. If the audio is shorter, choose Trim, Loop, Bounce or Pad." },
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
    description: "AI product photography, free to try: put your real product into new scenes from one packshot with the label unchanged. What it does well and where it fails.",
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
      {
        id: "packshot",
        h2: "What makes a good packshot for AI product photography?",
        blocks: [
          { kind: "p", text: "The AI can only keep what it can see. A weak reference photo is the most common reason a label comes out wrong, so spend two minutes on the input before you write a single prompt." },
          { kind: "ul", items: [
            "Sharp focus on the label, with no motion blur and no glare across the text.",
            "The product filling most of the frame, shot straight on rather than from a steep angle.",
            "Even, soft light so the true color of the packaging shows.",
            "A plain background, so the model doesn't mistake props or shadows for part of the product.",
            "Extra angles if the back or side matters. Nano Banana 2.1 accepts up to 14 reference photos and GPT Image 2.5 Sunburst up to 16.",
          ] },
        ],
      },
      {
        id: "models",
        h2: "Which AI model should I use for product photos?",
        blocks: [
          { kind: "p", text: "Pick the model by what the image has to do. Two of them run on the free credits new BuzzVideo accounts get." },
          { kind: "table", head: ["Model", "Best for", "Free credits?"], rows: [
            ["Seedream 4.5", "Consistent product sets with accurate text", "Yes"],
            ["Seedream 5.0 lite", "Budget infographics and trend visuals", "Yes"],
            ["Nano Banana 2.1", "Fast all-rounder: 14 aspect ratios, up to 4K, up to 14 references", "No"],
            ["GPT Image 2.5 Sunburst", "Fine print, labels and detailed close-ups, up to 16 references", "No"],
            ["Seedream 5.5", "Up to 2K with transparent backgrounds", "No"],
          ] },
        ],
      },
      {
        id: "check",
        h2: "What should I check before I publish an AI product photo?",
        blocks: [
          { kind: "ol", items: [
            "Zoom to 100% and read every word on the label against the real product.",
            "Compare color and finish side by side with your original photo.",
            "Count parts: caps, pumps, straps and buttons should match the real item.",
            "Check that props don't suggest something you don't sell or a claim you can't support.",
            "For a marketplace main image, check that marketplace's own image rules before you upload.",
          ] },
          { kind: "p", text: "Once the photos pass, the same packshot can become a video: see [How to create AI product videos for free](/create-ai-product-videos-free)." },
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
      { q: "How many product photos do I need to upload?", a: "One clear packshot is enough. Add more angles if the back or side matters: Nano Banana 2.1 takes up to 14 reference photos and GPT Image 2.5 Sunburst up to 16." },
      { q: "Can I use AI product photos commercially?", a: "Yes. Images you generate on BuzzVideo can be used commercially on every plan, including Free. Work made on the Free plan carries a watermark; Starter, Pro and Ultra remove it." },
      { q: "Can AI make a white or transparent background product photo?", a: "Yes. Seedream 5.5 can return a transparent PNG, and any image model can place the product on pure white. The [Remove Background](/remove-background) tool does it from an existing photo." },
      { q: "What sizes can AI product photos be?", a: "Nano Banana 2.1 covers 14 aspect ratios at up to 4K, including 1:1 for listings, 4:5 for feeds and 9:16 for stories. Seedream 5.5 goes up to 2K." },
      { q: "Which AI model is best for product labels and fine print?", a: "GPT Image 2.5 Sunburst, which is built for fine print, labels and detailed close-ups. Seedream 4.5 is the free-credit option for consistent product sets with accurate text." },
      { q: "Can I turn AI product photos into a video?", a: "Yes. The same packshot can drive an image-to-video model for unboxings, hero shots and 3D turnarounds with the [AI Product Video Generator](/ai-product-video-generator). Video models need a Starter, Pro or Ultra plan." },
    ],
    sources: [],
    related: ["/ai-product-photography", "/best-ai-product-photography-tools", "/create-ai-product-videos-free", "/remove-background"],
  },

  /* ───────────── TikTok AI video generator ───────────── */
  {
    slug: "tiktok-ai-video-generator",
    group: "Questions",
    title: "Does TikTok Have an AI Video Generator? | BuzzVideo",
    description: "AI TikTok video generator options: TikTok's own Symphony Creative Studio and AI Alive, how AI content is labeled, and when a multi-model tool fits better.",
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
          { kind: "table", head: ["", "TikTok Symphony Creative Studio", "Multi-model generator (BuzzVideo)"], rows: [
            ["Built for", "TikTok-first ideas and assets, organic and paid", "Ads and social videos for any platform"],
            ["Price", "Described by TikTok as free", "Video models need a Starter, Pro or Ultra plan"],
            ["Model choice", "TikTok's own tools", "Pick per shot: Kling 4.0, Seedance 2.5, Wan 3.0, MiniMax H3 and more"],
            ["Sizes", "TikTok-ready clips", "9:16 plus 1:1, 16:9 and other ratios the model supports"],
            ["Avatars and other languages", "Voiceover and product avatars; translate and dub", "Talking Avatar from a photo; AI Dubbing with a new voiceover plus AI Lip Sync"],
          ] },
        ],
      },
      {
        id: "how-to",
        h2: "How do I make a TikTok video with an AI video generator?",
        blocks: [
          { kind: "ol", items: [
            "Pick a TikTok-native format: get ready with me, POV, storytime, a roundup or a satisfying loop.",
            "Write the hook first. TikTok's creative guidance says to introduce your proposition in the first 3 seconds and prioritize the hook in the first 6.",
            "Choose a model that suits the shot. Kling 4.0 makes 3 to 30 seconds in one take at up to 1080p, with the voice generated alongside the picture.",
            "Generate in 9:16 and keep captions, faces and the product away from the bottom and right edges, where TikTok's buttons sit.",
            "Post with TikTok's AI-generated content label, or for an ad, turn on the AI disclosure in Ads Manager.",
          ] },
        ],
      },
      {
        id: "formats",
        h2: "Which TikTok formats work well with AI video?",
        blocks: [
          { kind: "ul", items: [
            "Get ready with me: a creator talking while doing a routine, so the product mention feels like conversation.",
            "POV: a first-person, handheld moment with a text overlay.",
            "Storytime: one person on camera telling a short story, with the product as the fix.",
            "Things I'd buy again: fast cuts of a few products, yours last.",
            "Satisfying loop: a close-up of the product pouring, peeling or clicking that ends where it began.",
          ] },
          { kind: "p", text: "Ready-made prompts for each are on the [AI TikTok video generator](/tiktok-videos) page." },
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
      { q: "What is the best AI TikTok video generator?", a: "It depends on the job. Symphony Creative Studio is built into TikTok for TikTok-first content; a multi-model generator such as BuzzVideo lets you choose the model per shot and export the same campaign for Reels, Shorts and Meta feeds." },
      { q: "Which AI model is best for TikTok videos?", a: "Kling 4.0 for people talking to camera: 3 to 30 seconds in one take at up to 1080p in 9:16, with the voice generated alongside the picture. Seedance 2.5 suits cinematic product clips." },
      { q: "How long should an AI TikTok video be?", a: "There is no single right length, but the opening matters most. TikTok advises introducing your proposition in the first 3 seconds and prioritizing the hook in the first 6." },
      { q: "Can I make AI TikTok videos for free?", a: `Not video on BuzzVideo: video models need a Starter, Pro or Ultra plan. The ${SIGNUP_CREDITS} free credits new accounts get cover Seedream images and Seed Audio 1.0 voiceovers, and TikTok describes Symphony Creative Studio as free.` },
      { q: "Can I add trending sounds to an AI TikTok video?", a: "Add licensed sounds inside TikTok after you upload. Depending on the model, BuzzVideo clips can be generated with or without their own audio." },
      { q: "Can I use AI TikTok videos commercially?", a: "Yes. Videos generated on BuzzVideo can be used commercially on every plan, but you still need to follow TikTok's AI disclosure rules for ads and realistic content." },
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
      {
        id: "pick",
        h2: "Which AI ad format should I start with?",
        blocks: [
          { kind: "p", text: "Start from what you already have. Each format above needs a different input, and the input decides how much the AI has to invent." },
          { kind: "table", head: ["You have", "Start with", "Where it usually runs"], rows: [
            ["One product photo", "UGC review, unboxing or 3D turnaround", "TikTok, Reels, product pages"],
            ["A few product stills", "Product commercial with camera moves", "Paid social, YouTube"],
            ["A product page link", "URL to video", "TikTok and Reels in 9:16"],
            ["A packshot and a campaign idea", "Product photos and static ads", "Listings, Meta feeds"],
            ["An ad that already works", "New hooks", "Wherever the original runs"],
            ["An ad in one language", "Dubbing: a new voiceover, then AI Lip Sync", "New markets"],
          ] },
        ],
      },
      {
        id: "before-run",
        h2: "What should I check before an AI ad goes live?",
        blocks: [
          { kind: "ol", items: [
            "The product: label, color and parts match the real item in every frame.",
            "The claims: the script says nothing the product can't back up, and an AI person doesn't claim personal results.",
            "The disclosure: turn on the platform's AI label, such as TikTok's AI-generated content toggle.",
            "The framing: captions and the product sit inside the safe zone for each placement.",
            "The specs: size, length and file type meet the platform's ad specs, such as [TikTok's](/tiktok-ad-specs).",
          ] },
        ],
      },
      {
        id: "where-ai-fits",
        h2: "Where does AI fit in an advertising workflow?",
        blocks: [
          { kind: "p", text: "Most teams use AI for the parts of an ad that are slow or expensive to produce by hand: first drafts of scripts and hooks, product shots without a studio, creator-style videos without shipping samples, and versions in other sizes and languages. People still decide the offer, the audience and which version runs." },
          { kind: "p", text: "That split also makes testing cheaper. Instead of one finished ad, you can generate several openings or presenters around the same product and let results pick the winner." },
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
      { q: "What is an example of AI in advertising?", a: "A creator-style UGC review generated from one product photo is a common one: an AI person talks to camera about the product in 9:16 for TikTok or Reels, with no creator or shipping involved." },
      { q: "Can AI make a whole video ad?", a: "Yes. Tools like BuzzVideo's [AI Ad Generator](/ai-ad-generator) turn a product photo, a product page link or a one-line brief into a finished ad with script, visuals and voiceover." },
      { q: "Can AI make ads in other languages?", a: "Yes. On BuzzVideo, dubbing takes two steps: make the new-language voiceover with Seed Audio 1.0 or MiniMax Speech 2.8 HD, then match the speaker's mouth with AI Lip Sync. Seed Audio 1.0 covers 21 languages." },
      { q: "Can I use AI-generated ads commercially?", a: "Yes. Everything generated on BuzzVideo can be used commercially on every plan, including Free. You are still responsible for the claims in the ad and for each platform's disclosure rules." },
      { q: "Which AI models make video ads on BuzzVideo?", a: "Video ads use models such as Seedance 2.5, Kling 4.0, Wan 3.0 and MiniMax H3; static ads use image models such as Nano Banana 2.1 and GPT Image 2.5 Sunburst. Every price shows before you generate." },
      { q: "Do I need real product photos to make AI ads?", a: "For anything that shows your product, yes. AI keeps the label and shape right by using your photo as a reference, so start from one clear packshot." },
    ],
    sources: [{ label: "TikTok Ads Manager: How to add disclaimers to ads", url: "https://ads.tiktok.com/help/article/add-disclaimers-to-ads" }],
    related: ["/ai-ad-generator", "/make-ugc-ads-with-ai", "/ai-product-video-generator", "/best-ai-ad-generators"],
  },

  /* ───────────── Make UGC ads with AI ───────────── */
  {
    slug: "make-ugc-ads-with-ai",
    group: "How-to guides",
    title: "How to Make UGC Ads with AI (Step by Step) | BuzzVideo",
    description: "How to make UGC ads with AI from one product photo: write the hook, describe the creator, generate in 9:16, check every frame and test the variations.",
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
          { kind: "p", text: "Every good UGC prompt covers the same five things:" },
          { kind: "ul", items: [
            "Length and framing: \"15s selfie video, 9:16\".",
            "The person: age range, style and energy, without naming a real person.",
            "The setting: where they are filming and the light.",
            "The exact lines, in quotes, so the model doesn't improvise claims.",
            "One product moment: when the label is on screen and for how long.",
          ] },
        ],
      },
      {
        id: "model",
        h2: "Which AI model should I use for UGC ads?",
        blocks: [
          { kind: "table", head: ["Model", "Clip length", "Why use it for UGC"], rows: [
            ["Kling 4.0", "3 to 30 seconds", "Long single takes with the voice generated alongside the picture, so the face changes across fewer cuts"],
            ["Seedance 2.5", "4 to 30 seconds", "Premium product shots, up to 30 reference images"],
            ["MiniMax H3", "5 to 15 seconds", "Native audio and lip sync, keeps a character consistent across clips"],
          ] },
          { kind: "p", text: "Kling 4.0 takes up to 10 reference images. To voice a script separately, Seed Audio 1.0 reads it in a preset voice or a cloned voice you own, in 21 languages." },
        ],
      },
      {
        id: "mistakes",
        h2: "What are common mistakes with AI UGC ads?",
        blocks: [
          { kind: "ul", items: [
            "A blurry or angled product photo, which leads to a wrong label.",
            "A hook that only works with sound. Add short on-screen text so the opening still reads with the sound off.",
            "Scripts where the AI person claims personal results, such as \"I lost 5 pounds\". Don't present an AI person as a real customer.",
            "Changing the hook, person and script at once, so you can't tell what made the difference.",
            "Skipping the AI label. TikTok requires AI-generated ad content to be disclosed.",
          ] },
        ],
      },
      {
        id: "variations",
        h2: "How many UGC ad variations should I make?",
        blocks: [
          { kind: "p", text: "Three to five is a practical first round. Keep the product, script body and call to action the same and change one thing per version: the hook line, the person or the setting. Run them against your current ad, keep the winner and build the next round from it." },
          { kind: "p", text: "For winning ads in one language, you can also dub them: generate a new-language voiceover with Seed Audio 1.0 or MiniMax Speech 2.8 HD, then match the mouth with [AI Lip Sync](/ai-lip-sync)." },
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
      { q: "How do you make UGC ads without creators?", a: "Generate the creator with AI. Upload one product photo, write the script, describe the person and setting, and a video model such as Kling 4.0 generates them talking to camera with your product." },
      { q: "Can I make AI UGC ads for free?", a: `Not the video. UGC clips use Kling 4.0, Seedance 2.5 and MiniMax H3, which need a Starter, Pro or Ultra plan. You can voice a UGC script with Seed Audio 1.0 on the ${SIGNUP_CREDITS} free credits new accounts get.` },
      { q: "Can I choose what the AI creator looks like?", a: "Yes. Describe age range, look and setting in the prompt, or add reference images: Kling 4.0 takes up to 10 and Seedance 2.5 up to 30." },
      { q: "What aspect ratio should a UGC ad be?", a: "9:16 for TikTok, Reels and Shorts. Kling 4.0 also outputs 16:9, 1:1 and 21:9 if you need other placements." },
      { q: "Can I make UGC ads in other languages?", a: "Yes. Remake the ad with a script in the new language, or dub the winner: make the voiceover with Seed Audio 1.0 (21 languages) or MiniMax Speech 2.8 HD, then run AI Lip Sync." },
      { q: "Can I use AI UGC ads commercially?", a: "Yes. Videos generated on BuzzVideo can be used commercially on every plan. Disclose that the person is AI-generated where the platform requires it." },
    ],
    sources: [
      { label: "TikTok Ads Manager: Creative best practices", url: "https://ads.tiktok.com/help/article/creative-best-practices" },
      { label: "16 CFR 255.2, Consumer endorsements (Cornell LII)", url: "https://www.law.cornell.edu/cfr/text/16/255.2" },
    ],
    related: ["/ai-ugc-video-generator", "/do-ugc-ads-work", "/ai-ugc-vs-human-ugc", "/ugc-ad-templates", "/ai-in-advertising-examples"],
    howto: { name: "How to make UGC ads with AI", steps: ["Pick one sharp product photo.", "Write a 15 to 30 second script with a hook.", "Describe the creator and setting.", "Generate in 9:16.", "Check frames and add captions.", "Test three to five variations."] },
  },

  /* ───────────── Write a good hook ───────────── */
  {
    slug: "write-a-good-hook",
    group: "How-to guides",
    title: "How to Write a Good Hook for Video Ads | BuzzVideo",
    description: "How to write a hook for a video ad: tell the right viewer why to keep watching in the first seconds. Six hook formulas, examples and how to test them.",
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
      {
        id: "step-by-step",
        h2: "How do I write a hook step by step?",
        blocks: [
          { kind: "ol", items: [
            "Name one viewer. \"Women 25 to 34 with dull skin\" gives you more to work with than \"everyone\".",
            "Write down the one problem or wish that viewer already has, in their words.",
            "Pick a formula from the table above that fits the product: a visible result suits \"show it working\", a common frustration suits \"problem first\".",
            "Write the line in under 12 words, then plan the opening shot that goes with it.",
            "Read it next to the rest of the ad. If the body doesn't deliver what the hook promises, rewrite the hook, not the body.",
            "Write four more using different formulas, so your test compares ideas rather than wording.",
          ] },
        ],
      },
      {
        id: "visual",
        h2: "Should a hook be a line or a visual?",
        blocks: [
          { kind: "p", text: "Ideally both, working together. The line tells the viewer why to stay; the first shot gives them something to look at while they decide. A spoken line alone fails with the sound off, and a striking visual alone can leave people unsure what the ad is about." },
          { kind: "table", head: ["Hook line", "Opening shot to pair with it"], rows: [
            ["\"Why does your skin look tired even after 8 hours of sleep?\"", "Close-up in a morning mirror, no makeup"],
            ["\"Day 1 vs day 7. Same lighting. Same phone.\"", "Split screen of two selfies"],
            ["\"This is the only step I never skip.\"", "Serum dropper landing on a fingertip"],
          ] },
        ],
      },
      {
        id: "mistakes",
        h2: "What are the most common hook mistakes?",
        blocks: [
          { kind: "ul", items: [
            "Starting with the logo or a slow brand intro before saying anything useful.",
            "Promising a result the ad never shows, which loses viewers right after the hook.",
            "Writing for everyone, so no one feels the ad is about them.",
            "Testing five near-identical lines instead of different ideas.",
            "Putting hook text where the platform's buttons and caption cover it. Preview the frame on a phone before you publish.",
          ] },
        ],
      },
    ],
    buzz: {
      title: "How to do it on BuzzVideo",
      steps: ["Upload the ad that already works, or your product photo.", "Ask for five new hooks across different formulas.", "Generate the new openings and test them."],
      cta: { label: "Make hook variations", href: "/ai-ad-generator" },
      note: "Want finished videos, not just lines? The [Marketing Agent](/marketing-agent) writes hooks and turns them into video variants.",
    },
    faq: [
      { q: "How long should a video ad hook be?", a: "The first 3 to 6 seconds. TikTok advises introducing your proposition in the first 3 seconds and prioritizing the hook in the first 6." },
      { q: "What is a hook in a TikTok ad?", a: "The opening seconds that make the right viewer stop scrolling: a line, a visual or both." },
      { q: "How many hooks should I test?", a: "Test several at once, ideally from different formulas, with the rest of the ad unchanged." },
      { q: "Can AI write and make ad hooks?", a: "Yes. AI can write hook lines and generate the new opening shots, keeping the rest of the ad the same." },
      { q: "How do you write a good hook?", a: "Name one viewer and one problem they already have, then say in under 12 words why this video is worth their time, paired with an opening shot that shows it. Write several from different formulas and test them." },
      { q: "What are examples of good video ad hooks?", a: "\"If your skin looks dull by 3 p.m., watch this\" calls out the viewer; \"I was using four products to do one job\" leads with the problem; a before-and-after in the first second leads with the result." },
      { q: "How many words should a hook have?", a: "Keep the spoken line short, under about 12 words. For on-screen text, TikTok recommends 5 to 10 words per second." },
      { q: "What is the difference between a hook and a headline?", a: "A headline is text you read; a video hook is the whole opening moment, the line, the first shot and the sound, that makes someone keep watching." },
      { q: "Can AI write video ad hooks?", a: "Yes. BuzzVideo's [Marketing Agent](/marketing-agent) drafts hook options in several styles from your product and audience, then turns them into video variants you can test." },
    ],
    sources: [{ label: "TikTok Ads Manager: Creative best practices", url: "https://ads.tiktok.com/help/article/creative-best-practices" }],
    related: ["/marketing-agent", "/make-ugc-ads-with-ai", "/tiktok-ad-specs", "/ad-hook-variants-mcp-skill"],
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
      {
        id: "safe-zone-pixels",
        h2: "Where exactly should I keep text in a TikTok ad?",
        blocks: [
          { kind: "p", text: "Because TikTok publishes template files rather than numbers, the pixel values below are a third-party measurement of TikTok's In-Feed standard template at 1080 x 1920. Treat them as a guide and check your final cut against the template." },
          { kind: "table", head: ["Edge", "Keep clear (at 1080 x 1920)"], rows: [
            ["Top", "240 px"],
            ["Bottom", "660 px"],
            ["Left and right", "120 px each"],
            ["Right-side buttons", "A 180 px wide column running 1,080 px up from the bottom"],
          ] },
          { kind: "p", text: "Longer captions and anchors push the bottom edge higher." },
        ],
      },
      {
        id: "vs-reels-shorts",
        h2: "How do TikTok ad specs compare with Reels and Shorts?",
        blocks: [
          { kind: "p", text: "All three are full-screen vertical feeds, so one 9:16 master usually works for all of them. The differences are in limits and safe areas." },
          { kind: "table", head: ["", "TikTok in-feed ad", "Instagram Reels ad", "YouTube Shorts (vertical video ad)"], rows: [
            ["Aspect ratio", "9:16 recommended", "9:16", "9:16"],
            ["Size", "At least 540 x 960 px", "1440 x 2560 recommended", "Safe zone given at 1080 x 1920"],
            ["Length", "Up to 10 minutes", "0 s to 15 min", "Not covered here"],
            ["File", ".mp4, .mov, .mpeg, .3gp, .avi; 500 MB", "MP4, MOV; 4 GB", "Not covered here"],
            ["Safe zone", "Measured: 240 px top, 660 px bottom, 120 px sides", "About 14% top, 35% bottom, 6% sides", "288 px top, 672 px bottom, 48 px left, 192 px right"],
          ] },
        ],
      },
      {
        id: "export",
        h2: "How do I export an AI video so it meets TikTok's specs?",
        blocks: [
          { kind: "ol", items: [
            "Generate in 9:16, at 1080p where the model supports it. On BuzzVideo, Kling 4.0, Seedance 2.5 and Wan 3.0 can each make up to 30 seconds in one take.",
            "Put the hook in the first seconds and keep captions inside the safe zone.",
            "Download the MP4, which is one of TikTok's accepted file types.",
            "If the file is over 500 MB, export it again at a lower bitrate; for a 16:9 cut, generate a 9:16 version instead of cropping.",
            "Upload in TikTok Ads Manager and turn on \"This ad contains AI-generated content\".",
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
      { q: "What file types does TikTok accept for video ads?", a: ".mp4, .mov, .mpeg, .3gp and .avi for non-Spark in-feed ads, with a bitrate of at least 516 kbps. Spark Ads take .mp4 or .mov." },
      { q: "What is the minimum resolution for TikTok ads?", a: "540 x 960 px for 9:16, 960 x 540 px for 16:9 and 640 x 640 px for 1:1. TikTok's creative guidance recommends shooting at least 720p." },
      { q: "What is the TikTok ad safe zone in pixels?", a: "TikTok publishes template files, not numbers. A third-party measurement of its In-Feed standard template at 1080 x 1920 gives 240 px at the top, 660 px at the bottom, 120 px each side and a 180 px button column on the right." },
      { q: "Can I use 16:9 or 1:1 videos for TikTok ads?", a: "Yes, both are accepted for non-Spark in-feed ads, but 9:16 is recommended because it fills the screen." },
      { q: "How long can the brand name be on a TikTok ad?", a: "One line of up to 20 characters, or 10 for Chinese, Japanese and Korean." },
      { q: "Can I use the same video for TikTok, Reels and Shorts?", a: "Usually, yes. All three are 9:16 vertical feeds, but their limits and safe zones differ, so check text placement for each one." },
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
    description: "AI video glossary: plain-English definitions of 24 AI video and ad terms, from text-to-video and first-last frame to lip sync, voice cloning, UGC and MCP.",
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
      { q: "What is the difference between lip sync and AI dubbing?", a: "Lip sync matches a speaker's mouth to an audio track that already exists. AI dubbing first makes the voice in a new language, then uses lip sync; on BuzzVideo that is Seed Audio 1.0 or MiniMax Speech 2.8 HD followed by AI Lip Sync." },
      { q: "What is first and last frame in AI video?", a: "You give the model the opening and closing images and it generates the motion between them. It is useful for transitions and product reveals where both ends must look exact." },
      { q: "What is a reference image in AI video?", a: "An image the model uses to keep a product, face or style consistent without making it the first frame. Kling 4.0 takes up to 10 reference images and Seedance 2.5 up to 30." },
      { q: "What is the difference between an AI avatar and AI UGC?", a: "An AI avatar is a presenter, often animated from one photo, who reads a script. AI UGC is a creator-style video where an AI-generated person reviews or uses a product as if filmed on a phone." },
      { q: "What is voice cloning?", a: "Learning a voice from a sample recording and using it to say new text. Only clone voices you own or have permission to use; on BuzzVideo, Seed Audio 1.0 does it." },
      { q: "What are credits in AI video tools?", a: "The unit of usage: each generation costs credits based on the model, length and resolution. On BuzzVideo the price shows before you generate, and new accounts get free credits for Seedream images and Seed Audio 1.0." },
    ],
    sources: [],
    related: ["/ai-video-generator", "/models", "/mcp"],
    terms: [
      { term: "AI video generator", def: "Software that creates video clips from text, images or other video using a generative model. BuzzVideo's AI Video Generator runs models such as Seedance 2.5, Kling 4.0 and Wan 3.0 on one account.", href: "/ai-video-generator" },
      { term: "Text-to-video", def: "Generating a video from a written prompt alone. On BuzzVideo you describe the scene, camera and sound and pick the model.", href: "/text-to-video" },
      { term: "Image-to-video", def: "Animating a still image into a video, so the product or character keeps its look. BuzzVideo uses your image as the first frame or reference.", href: "/image-to-video" },
      { term: "First and last frame", def: "Giving the model both the opening and closing image so it generates the motion in between. Available on BuzzVideo with models that support it, such as FLUX 3 Video.", href: "/flux-3-video" },
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
