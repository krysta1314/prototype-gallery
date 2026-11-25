// 工具落地页内容(2026-11-23,第 5 批):导航里已有入口、还没有落地页的 3 个 Agent / 聊天入口页，一级网址 /<slug>。
// 依据(只写这些地方核实过的事实):
// - marketing-agent:v1.12 video-gen-modes CreationTypeMenu.tsx 的 Marketing Agent 描述(照线上产品原文)、AgentPlan.tsx 的
//   「Video plan」卡(写明模型 / 模式 / 原因，可 Change 后 Regenerate)、changelog.ts 的 v1.4 更新(项目侧栏、可筛选的创作内容)。
//   Agent 按任务现场选模型，不固定 → models 留空(模板不显示模型行)。PM 2026-11-23 确认：先出计划，用户确认后才生成、才扣积分(与 ai-ad-generator 页一致)。
// - claude-video-generator:site/learn/content.ts「can-claude-make-videos」(已核实:Claude 自己不生成视频;Customize → Connectors →
//   Add custom connector;Claude 全部套餐可加自定义 connector,Free 限 1 个;BuzzVideo MCP 要 Starter / Pro / Ultra)+ v1.12 mcp/skills/data.ts(MCP_URL)。
// - chatgpt-video-generator:repo 里 ChatGPT 的接入方式只有 v1.9 mcp/page.tsx FAQ「在 Plugins Directory 找 BuzzVideo 点 Add」和
//   v1.12 data.ts 的 @BuzzVideo 用法;插件目录地址在 data.ts 里标着「推测，上线前核对」→ 页面不写具体网址、不写 ChatGPT 哪些套餐可用。
// - video-generation-mcp(2026-11-25):v1.9 mcp/page.tsx FAQ(可用客户端、连接方式、可调模型、带音频、参考图、批量、同一个库、Free 不能用)
//   + v1.12 mcp/skills/data.ts(MCP_URL、26 个 Skill)。只写 Claude / ChatGPT /「其它 MCP 客户端」;不写 MCP 工具名(repo 里没有)、
//   不写鉴权协议、不写 ChatGPT 插件目录网址。v1.9 FAQ 的 Veo、已下架的 Nano Banana 不列。
// media 只放本地有的真实成片(来源写在 source)。

import type { ToolEntry } from "../tool-content";
import { SIGNUP_CREDITS } from "../credits";

const LOCAL = "/prototypes/site/tools";
const POSTER = "/video-library/posters";
const MCP_URL = "https://mcp.buzzvideo.ai/mcp";

export const AGENT_TOOLS: ToolEntry[] = [
  {
    slug: "marketing-agent",
    name: "AI Marketing Agent",
    group: "Ads",
    h1: "AI Marketing Agent",
    h1Tail: "brief in, campaign-ready ads out",
    lead: "BuzzVideo's AI Marketing Agent is a marketing expert you brief in plain words: it plans the strategy, writes the ad copy and makes the video and image ads in one chat. Describe your product, add a photo or a product page link, and it breaks the job into steps and picks the right model for each one.",
    mode: "marketing",
    prompt: "Plan a launch campaign for [my product] and make [3] video ads for TikTok and Reels, plus matching image ads in 1:1.",
    models: [],
    media: {
      kind: "video",
      src: `${LOCAL}/product-ad.mp4`,
      poster: `${POSTER}/skill-product-ad.jpg`,
      aspect: "9:16",
      alt: "A vertical product ad for a vitamin C serum bottle on a sunlit bathroom shelf",
      caption: "A product ad made on BuzzVideo from one product photo.",
      source: "MCP Skill 示例 product-ad(视频库 skill-product-ad,同 ai-ad-generator 页)",
    },
    definition: {
      q: "What is an AI marketing agent?",
      a: "An AI marketing agent turns a brief into a campaign: it works out the strategy and messaging, writes the copy and generates the creatives. BuzzVideo's Marketing Agent has marketing and advertising know-how built in, breaks your task into steps, picks the tools and models itself and generates images and videos guided by that strategy.",
    },
    steps: [
      { title: "Brief the agent", body: "Describe your product, paste a brief or just an idea, and add a product photo or page link if you have one." },
      { title: "Confirm the plan", body: "Before it generates anything or spends credits, it shows a plan naming the model, the mode and why it chose them. Change either, then confirm to start." },
      { title: "Keep building", body: "Ask for more hooks, sizes or angles in the same chat. Every project and creation stays in your sidebar, filterable by type." },
    ],
    uses: [
      { title: "Product launches", body: "Founders and marketers give one brief and get the strategy, the ad copy and the first set of creatives in one chat. Add a product photo or a product page link, and the agent breaks the launch into steps and picks a model for each." },
      { title: "Always-on social ads", body: "Social and performance teams keep TikTok, Reels and Meta supplied with fresh video and image ads without a new shoot. Ask for more hooks, sizes or angles in the same chat, and every creation stays in your sidebar, filterable by type." },
      { title: "Small teams without a studio", body: "For a small business, one chat covers the strategist, the copywriter and the production. Before it spends credits, the agent shows a plan naming the model, the mode and why it chose them, and you can change either one." },
    ],
    faq: [
      { q: "What can the BuzzVideo Marketing Agent do?", a: "It plans marketing strategy, writes ad copy and generates the image and video creatives to match, in one conversation. It splits the job into steps and chooses the right tool and model for each." },
      { q: "How is the Marketing Agent different from Video Gen or Image Gen?", a: "Video Gen and Image Gen make one asset from your prompt with the model you pick. The Marketing Agent starts from a goal, works out what to make and picks the models for you, so one request can return copy, images and videos." },
      { q: "Can I choose the model myself?", a: "Yes. The agent's plan shows the model and mode it chose and why. Change either one before you confirm, or regenerate later with a different model." },
      { q: "Does the agent spend credits without asking?", a: "No. The Marketing Agent shows its plan first and waits for you to confirm before it generates anything or spends credits." },
      { q: "Is the Marketing Agent free?", a: `Video ads need a Starter, Pro or Ultra plan. The ${SIGNUP_CREDITS} free credits new accounts get work on Seedream 4.5 and Seedream 5.0 lite images and Seed Audio 1.0 voiceovers.` },
      { q: "Can I use the Marketing Agent from ChatGPT or Claude?", a: "You can make the same kinds of ads from ChatGPT or Claude by connecting BuzzVideo MCP. Generations use your BuzzVideo plan and land in the same library." },
      { q: "What do I need to give the Marketing Agent?", a: "A plain-words description of your product is enough. You can also paste a full brief and add a product photo or a product page link, and the agent works out the steps from there." },
      { q: "Can the Marketing Agent make ads for TikTok and Reels?", a: "Yes. It makes video and image ads for TikTok, Reels and Meta, and you can ask for more hooks, sizes or angles in the same chat." },
      { q: "Where do the ads the agent makes go?", a: "Into your BuzzVideo account. Every project and creation stays in your sidebar, where you can filter by type." },
      { q: "What is AI marketing?", a: "AI marketing uses AI to plan, write and produce marketing work, such as strategy, ad copy and ad creatives. An AI marketing agent does these steps in one chat instead of across separate tools." },
      { q: "How can I use AI in marketing?", a: "Start with jobs that repeat: planning a launch campaign, writing ad copy, and making video and image ads for TikTok, Reels and Meta. Brief the Marketing Agent in plain words and ask for more hooks, sizes or angles in the same chat." },
    ],
    related: ["ai-ad-generator", "url-to-video", "ai-ugc-video-generator"],
    metaTitle: "AI Marketing Agent: Brief In, Ads Out | BuzzVideo",
    metaDescription: "AI marketing agent you brief in plain words: BuzzVideo plans the strategy, writes the ad copy and makes video and image ads in one chat.",
  },
  {
    slug: "claude-video-generator",
    name: "Claude Video Generator",
    group: "Video",
    h1: "Claude Video Generator",
    h1Tail: "make videos without leaving Claude",
    lead: "Claude video generation works by connecting Claude to a real video model, because Claude writes scripts and prompts but does not generate realistic footage by itself. Add BuzzVideo MCP as a custom connector and Claude can call models such as Seedance 2.5, Kling 4.0 and Wan 3.0, returning the finished clip in the chat.",
    mode: "marketing",
    prompt: "Make a [10-second] [9:16] video ad of this product photo with [Seedance 2.5].",
    models: [],
    media: {
      kind: "video",
      src: `${LOCAL}/talking-product.mp4`,
      poster: `${POSTER}/skill-talking-product.jpg`,
      aspect: "9:16",
      alt: "A cartoon-faced drink can on a kitchen counter that talks to camera",
      caption: "A talking-product clip made through BuzzVideo MCP with the Talking Product skill.",
      source: "MCP Skill 示例 talking-product(视频库 skill-talking-product)",
    },
    definition: {
      q: "Can Claude create videos?",
      a: "Not on its own. Claude writes scripts, storyboards and prompts, and its Claude Motion beta builds code-based animations, but it has no model for realistic video. Connect BuzzVideo MCP and Claude can call BuzzVideo's video models from the chat, with the clips saved to your BuzzVideo library.",
    },
    steps: [
      { title: "Add the connector", body: `In Claude desktop or claude.ai, open Customize, then Connectors, choose Add custom connector, name it BuzzVideo and paste ${MCP_URL}.` },
      { title: "Sign in once", body: "Connect and sign in to your BuzzVideo account. Claude stays connected after that." },
      { title: "Ask for the video", body: "Describe the clip and attach a product photo or link if you have one. BuzzVideo names the model it used in the reply." },
    ],
    uses: [
      { title: "Script to finished ad", body: "Marketers write the script with Claude, then generate the clips in the same chat. Ask for a specific model, such as Seedance 2.5 for 4 to 30 second clips at up to 1080p, and BuzzVideo names the model it used in the reply." },
      { title: "Product videos from a photo", body: "Ecommerce sellers attach a product shot and ask for a vertical ad or a talking-product clip. The finished video comes back in the chat and saves to the same BuzzVideo library as the web app." },
      { title: "Video editing in Claude", body: "Creators with long footage ask Claude to run Long to Shorts, which cuts a long video into short clips. Claude has no built-in video editor, so the work runs on BuzzVideo through the connector." },
      { title: "Repeatable workflows", body: "Teams handle the jobs they run every week by asking for a skill by name. BuzzVideo has 26 MCP Skills, such as Link to Ad for a product page link, and each one runs the whole job from one request." },
    ],
    faq: [
      { q: "How do I generate a video in Claude?", a: `Add BuzzVideo MCP as a custom connector in Claude (Customize, then Connectors, then Add custom connector, URL ${MCP_URL}), sign in to BuzzVideo, then ask Claude for the video you want.` },
      { q: "Which video models can Claude use through BuzzVideo?", a: "The same ones as the BuzzVideo web app, including Seedance 2.5, Seedance 2.0, Kling 3.0, MiniMax H3 and Gemini Omni 1.2 Flash. BuzzVideo names the model it used, and you can ask for a specific one." },
      { q: "Can Claude make videos for free?", a: `No. Claude's help center says custom connectors are available on all Claude plans, with Free limited to one, but BuzzVideo MCP needs a BuzzVideo Starter, Pro or Ultra plan. The ${SIGNUP_CREDITS} free credits new BuzzVideo accounts get are for Seedream images and Seed Audio 1.0 in the web app.` },
      { q: "What is Claude Motion?", a: "A beta Claude feature on Team and Enterprise plans that builds short animations as code, such as explainers and animated charts, and exports them as MP4. It does not use a video model, so it cannot make realistic footage or people." },
      { q: "Where do the videos I make in Claude go?", a: "Into your BuzzVideo library, the same one as the web app, on the same plan." },
      { q: "Does Claude have a built-in AI video generator?", a: "No. Anthropic does not ship a model that generates realistic video footage, and Claude Motion only builds code-based animations. To get footage with people, products and camera moves, Claude has to call a video model through a connector such as BuzzVideo MCP." },
      { q: "Can Claude make UGC or AI avatar videos?", a: "Only through a connected video service. With BuzzVideo MCP, you can ask Claude for a creator-style video or a talking presenter and BuzzVideo generates it with a video model." },
      { q: "How long can a video made in Claude be?", a: "It depends on the model you ask for. Through BuzzVideo, Seedance 2.5 makes clips from 4 to 30 seconds at up to 1080p, and Kling 3.0 makes clips from 3 to 15 seconds." },
      { q: "Can I use BuzzVideo MCP Skills in Claude?", a: "Yes. BuzzVideo has 26 MCP Skills, ready-made workflows such as Link to Ad and Long to Shorts. Ask Claude to use one by name and it runs the whole job." },
      { q: "Can Claude edit videos?", a: "Not on its own: Claude has no built-in video editor. With BuzzVideo MCP connected, it can run workflows such as Long to Shorts, which cuts a long video into short clips." },
    ],
    related: ["chatgpt-video-generator", "link-to-ad-mcp-skill", "long-to-shorts-mcp-skill"],
    metaTitle: "Claude Video Generator: Make Videos in Claude | BuzzVideo",
    metaDescription: "Claude video generator: Claude can't make realistic video on its own. Connect BuzzVideo MCP and it calls Seedance 2.5, Kling 4.0 and Wan 3.0 in the chat.",
  },
  {
    slug: "chatgpt-video-generator",
    name: "ChatGPT Video Generator",
    group: "Video",
    h1: "ChatGPT Video Generator",
    h1Tail: "make ads from a ChatGPT chat",
    lead: "A ChatGPT video generator lets you ask ChatGPT for a video and get the finished clip back in the chat, with BuzzVideo MCP doing the generating on BuzzVideo's video models. Add BuzzVideo to ChatGPT, mention @BuzzVideo in your message, and describe the ad, attaching a product photo or link if you have one.",
    mode: "marketing",
    prompt: "@BuzzVideo Make a [15-second] [9:16] unboxing video of my product. Ask me to upload the product photo first.",
    models: [],
    media: {
      kind: "video",
      src: `${LOCAL}/unboxing-ugc.mp4`,
      poster: `${POSTER}/skill-unboxing-ugc.jpg`,
      aspect: "9:16",
      alt: "Hands opening a pink gift box with a perfume bottle inside",
      caption: "An unboxing video made through BuzzVideo MCP with the Unboxing UGC skill.",
      source: "MCP Skill 示例 unboxing-ugc(视频库 skill-unboxing-ugc)",
    },
    definition: {
      q: "How does a ChatGPT video generator work?",
      a: "ChatGPT plans the video with you, and a connected service generates it. With BuzzVideo MCP connected, ChatGPT sends your prompt and reference images to BuzzVideo, which renders the clip on one of its video models and returns it to the chat and your BuzzVideo library.",
    },
    steps: [
      { title: "Add BuzzVideo to ChatGPT", body: "Find BuzzVideo in ChatGPT's plugins directory, click Add and sign in to your BuzzVideo account once." },
      { title: "Mention @BuzzVideo", body: "Start your message with @BuzzVideo so ChatGPT uses it, then describe the video." },
      { title: "Get the clip", body: "BuzzVideo picks a model, names it in the reply and returns the video. Ask for a specific model at any time." },
    ],
    uses: [
      { title: "Ads from a chat", body: "Marketers brainstorm the hook in ChatGPT, then start a message with @BuzzVideo to generate the ad without switching apps. Give the length and aspect ratio, such as 15 seconds in 9:16, and the clip comes back in the chat." },
      { title: "Product pages to ads", body: "Store owners share a product page link and ask ChatGPT to use the BuzzVideo link-to-ad skill. The skill runs the whole workflow, and the ads save to your BuzzVideo library on the same plan as the web app." },
      { title: "Creator-style videos", body: "Ecommerce brands get UGC reviews and unboxing clips from one product photo, using skills such as ugc-product-review. BuzzVideo picks a video model and names it in the reply, and you can ask for a specific one such as Seedance 2.5." },
      { title: "Text to video in ChatGPT", body: "Creators with no footage describe the video in text and get a clip back. A product photo or link is optional, and the models include Seedance 2.5, Kling 3.0, MiniMax H3 and Gemini Omni 1.2 Flash." },
    ],
    faq: [
      { q: "Can ChatGPT make videos with BuzzVideo?", a: "Yes. BuzzVideo MCP works in ChatGPT and other MCP-compatible clients. Once BuzzVideo is added, ask for a video and it is generated on your BuzzVideo account." },
      { q: "How do I add BuzzVideo to ChatGPT?", a: "Find BuzzVideo in ChatGPT's plugins directory, click Add and sign in to BuzzVideo once. Then start a message with @BuzzVideo. Which ChatGPT plans can add plugins is set by OpenAI, so check OpenAI's help center for yours." },
      { q: "Is the ChatGPT video generator free?", a: `No. BuzzVideo MCP needs a BuzzVideo Starter, Pro or Ultra plan. The ${SIGNUP_CREDITS} free credits new accounts get are for Seedream images and Seed Audio 1.0 in the BuzzVideo web app.` },
      { q: "Can I use BuzzVideo MCP Skills in ChatGPT?", a: "Yes. Ask ChatGPT to use a skill by name, such as the BuzzVideo link-to-ad or ugc-product-review skill, and it runs the whole workflow." },
      { q: "Does it also work in Claude?", a: "Yes. In Claude you add BuzzVideo as a custom connector instead. See the Claude Video Generator page." },
      { q: "Does ChatGPT have a video generator?", a: "Not a built-in one today. ChatGPT writes scripts, storyboards and prompts and creates still images, but to get a video out of a chat it has to call a video service through a plugin such as BuzzVideo." },
      { q: "Is Sora still available in ChatGPT?", a: "No. OpenAI's help center says the Sora web and app experiences were discontinued on April 26, 2026, and the Sora API on September 24, 2026." },
      { q: "Which video models can ChatGPT use through BuzzVideo?", a: "The same ones as the BuzzVideo web app, including Seedance 2.5, Seedance 2.0, Kling 3.0, MiniMax H3 and Gemini Omni 1.2 Flash. BuzzVideo names the model it used in the reply, and you can ask for a specific one." },
      { q: "Where do the videos I make in ChatGPT go?", a: "Into your BuzzVideo library, the same one as the web app, on the same plan. The clip also comes back in the chat." },
      { q: "How do I write a ChatGPT video generator prompt?", a: "Start with @BuzzVideo, then give the length, the aspect ratio and what happens in the clip, for example a 15-second 9:16 unboxing video of your product. Attach a product photo or link if you have one." },
      { q: "Can the ChatGPT video generator make a video from text?", a: "Yes. Describe the video in text and BuzzVideo generates it on one of its video models. A product photo or link is optional." },
    ],
    related: ["claude-video-generator", "link-to-ad-mcp-skill", "ugc-product-review-mcp-skill"],
    metaTitle: "ChatGPT Video Generator: Make Ads in ChatGPT | BuzzVideo",
    metaDescription: "ChatGPT video generator: add BuzzVideo to ChatGPT, mention @BuzzVideo and describe your ad. BuzzVideo MCP makes the video and returns it to the chat.",
  },
  {
    slug: "video-generation-mcp",
    name: "Video Generation MCP Server",
    group: "Video",
    h1: "Video Generation MCP Server",
    h1Tail: "one URL for video, image and audio",
    lead: `BuzzVideo MCP is a Model Context Protocol server that lets AI assistants such as Claude and ChatGPT generate video, images and audio on BuzzVideo's models. Point an MCP-compatible client at ${MCP_URL}, sign in once and ask for a clip in plain words; the result comes back in the chat and saves to your BuzzVideo library.`,
    mode: "marketing",
    prompt: "Use BuzzVideo to make a [15-second] [9:16] UGC review video of my product with [Seedance 2.5]. Ask me for the product photo first.",
    models: [],
    media: {
      kind: "video",
      src: `${LOCAL}/ugc-product-review.mp4`,
      poster: `${POSTER}/skill-ugc-product-review.jpg`,
      aspect: "9:16",
      alt: "A woman holding a serum bottle and talking to camera in a selfie-style UGC ad",
      caption: "An 8-second UGC product review made through BuzzVideo MCP with the UGC Product Review skill.",
      source: "MCP Skill 示例 ugc-product-review(视频库 skill-ugc-product-review,同 ai-ugc-video-generator 页)",
    },
    definition: {
      q: "What is a video generation MCP server?",
      a: "A video generation MCP server gives an AI assistant a video model to call. MCP, the Model Context Protocol, is an open standard that lets assistants use outside tools. BuzzVideo MCP is one server for video, image and audio: the assistant sends your prompt and reference images, BuzzVideo renders the result and returns it to the chat.",
    },
    steps: [
      { title: "Copy the server URL", body: `The BuzzVideo MCP server URL is ${MCP_URL}. It is the same URL for every client.` },
      { title: "Add it to your AI client", body: "In Claude, open Customize, then Connectors, choose Add custom connector and paste the URL. In ChatGPT, find BuzzVideo in the plugins directory and click Add. Sign in to BuzzVideo once." },
      { title: "Ask for what you need", body: "Describe the video, image or voiceover and attach a product photo if you have one. BuzzVideo picks a model, names it in the reply and returns the file." },
    ],
    uses: [
      { title: "Video ads from a chat", body: "Marketers write the script with their assistant, then generate the clips in the same conversation. Name a model such as Seedance 2.5 or Kling 3.0, or let BuzzVideo pick one and name it in the reply." },
      { title: "Product photos to video", body: "Ecommerce teams attach a product shot and ask for a UGC ad, a product shot or an animated version of it. The assistant sends the photo to BuzzVideo as a reference image, and most videos come back in a couple of minutes." },
      { title: "Ready-made workflows", body: "Teams run one of 26 MCP Skills, such as Link to Ad or UGC Product Review, by asking for it by name. The same server URL works in Claude, ChatGPT and other MCP clients, and every file lands in one BuzzVideo library." },
    ],
    faq: [
      { q: "Which clients does the BuzzVideo MCP server work with?", a: "Claude (desktop and claude.ai) and ChatGPT today. Other MCP-compatible clients work too: point them at the BuzzVideo server URL and sign in." },
      { q: "What is the BuzzVideo MCP server URL?", a: `${MCP_URL}. Paste it wherever your client asks for a remote MCP server or custom connector URL, then sign in to your BuzzVideo account.` },
      { q: "Which models can the MCP server call?", a: "The same ones as the BuzzVideo web app. Video includes Seedance 2.5, Seedance 2.0, Kling 3.0, MiniMax H3 and Gemini Omni 1.2 Flash. Image includes GPT Image 2.5 Sunburst, Nano Banana Pro and Seedream 5.0 Pro. Seed Audio 1.0 covers voiceover and music. Ask for a specific model at any time." },
      { q: "Can it generate video with audio?", a: "Yes. Ask for a clip with sound and BuzzVideo returns a video with a matched audio track. Seed Audio 1.0 can also generate a voiceover or music on its own." },
      { q: "MCP server vs MCP Skills: what is the difference?", a: "The MCP server is the connection that lets the assistant call BuzzVideo. MCP Skills are ready-made BuzzVideo workflows the assistant runs through that server, such as turning a product page link into ads or cutting a long video into shorts. Ask for a skill by name and it runs the whole job." },
      { q: "Is the video generation MCP server free?", a: `No. BuzzVideo MCP is not available on the Free plan. It needs a BuzzVideo Starter, Pro or Ultra plan. The ${SIGNUP_CREDITS} free credits new accounts get are for Seedream images and Seed Audio 1.0 in the BuzzVideo web app.` },
      { q: "Where do the files I generate go?", a: "Into your BuzzVideo library. It is one account: everything you generate from a chat client lands in the same library as the web app, on the same plan." },
      { q: "Can I use my own product photos over MCP?", a: "Yes. Attach an image in the chat and ask for a UGC ad, a product shot or an animated version of it. The assistant sends the photo to BuzzVideo as a reference image." },
      { q: "How long does a generation take over MCP?", a: "Images come back in seconds and most videos in a couple of minutes, depending on the model and the clip length." },
      { q: "What is an MCP server?", a: "An MCP server is a service that gives an AI assistant tools it can call, using the Model Context Protocol, an open standard. BuzzVideo's MCP server gives Claude, ChatGPT and other MCP clients tools to generate video, images and audio." },
      { q: "MCP server vs API: what is the difference?", a: "An API is called by code that a developer writes. An MCP server is called by the AI assistant itself, so you ask in plain words in the chat and the assistant makes the request for you." },
    ],
    related: ["claude-video-generator", "chatgpt-video-generator", "link-to-ad-mcp-skill"],
    metaTitle: "Video Generation MCP Server for Claude & ChatGPT | BuzzVideo",
    metaDescription: "Video generation MCP server for Claude, ChatGPT and other MCP clients: one URL lets your AI chat make video, images and audio on BuzzVideo's models.",
  },
];
