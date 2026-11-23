// 工具落地页内容(2026-11-23,第 5 批):导航里已有入口、还没有落地页的 3 个 Agent / 聊天入口页，一级网址 /<slug>。
// 依据(只写这些地方核实过的事实):
// - marketing-agent:v1.12 video-gen-modes CreationTypeMenu.tsx 的 Marketing Agent 描述(照线上产品原文)、AgentPlan.tsx 的
//   「Video plan」卡(写明模型 / 模式 / 原因，可 Change 后 Regenerate)、changelog.ts 的 v1.4 更新(项目侧栏、可筛选的创作内容)。
//   Agent 按任务现场选模型，不固定 → models 留空(模板不显示模型行)。PM 2026-11-23 确认：先出计划，用户确认后才生成、才扣积分(与 ai-ad-generator 页一致)。
// - claude-video-generator:site/learn/content.ts「can-claude-make-videos」(已核实:Claude 自己不生成视频;Customize → Connectors →
//   Add custom connector;Claude 全部套餐可加自定义 connector,Free 限 1 个;BuzzVideo MCP 要 Starter / Pro / Ultra)+ v1.12 mcp/skills/data.ts(MCP_URL)。
// - chatgpt-video-generator:repo 里 ChatGPT 的接入方式只有 v1.9 mcp/page.tsx FAQ「在 Plugins Directory 找 BuzzVideo 点 Add」和
//   v1.12 data.ts 的 @BuzzVideo 用法;插件目录地址在 data.ts 里标着「推测，上线前核对」→ 页面不写具体网址、不写 ChatGPT 哪些套餐可用。
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
      { title: "Product launches", body: "Strategy, ad copy and the first set of creatives from one brief." },
      { title: "Always-on social ads", body: "Fresh video and image ads for TikTok, Reels and Meta without a new shoot." },
      { title: "Small teams without a studio", body: "One chat covers the strategist, the copywriter and the production." },
    ],
    faq: [
      { q: "What can the BuzzVideo Marketing Agent do?", a: "It plans marketing strategy, writes ad copy and generates the image and video creatives to match, in one conversation. It splits the job into steps and chooses the right tool and model for each." },
      { q: "How is the Marketing Agent different from Video Gen or Image Gen?", a: "Video Gen and Image Gen make one asset from your prompt with the model you pick. The Marketing Agent starts from a goal, works out what to make and picks the models for you, so one request can return copy, images and videos." },
      { q: "Can I choose the model myself?", a: "Yes. The agent's plan shows the model and mode it chose and why. Change either one before you confirm, or regenerate later with a different model." },
      { q: "Does the agent spend credits without asking?", a: "No. The Marketing Agent shows its plan first and waits for you to confirm before it generates anything or spends credits." },
      { q: "Is the Marketing Agent free?", a: `Video ads need a Starter, Pro or Ultra plan. The ${SIGNUP_CREDITS} free credits new accounts get work on Seedream 4.5 and Seedream 5.0 Lite images and Seed Audio 1.0 voiceovers.` },
      { q: "Can I use the Marketing Agent from ChatGPT or Claude?", a: "You can make the same kinds of ads from ChatGPT or Claude by connecting BuzzVideo MCP. Generations use your BuzzVideo plan and land in the same library." },
    ],
    related: ["ai-ad-generator", "url-to-video", "ai-ugc-video-generator"],
    metaTitle: "AI Marketing Agent: Brief In, Ads Out | BuzzVideo",
    metaDescription: "Brief BuzzVideo's AI Marketing Agent in plain words and get strategy, ad copy and video and image ads in one chat, with the right model picked for each shot.",
  },
  {
    slug: "claude-video-generator",
    name: "Claude Video Generator",
    group: "Video",
    h1: "Claude Video Generator",
    h1Tail: "make videos without leaving Claude",
    lead: "A Claude video generator connects Claude to a real video model, because Claude writes scripts and prompts but does not generate realistic footage by itself. Add BuzzVideo MCP as a custom connector and Claude can call models such as Seedance 2.5, Kling 4.0 and Wan 3.0, returning the finished clip in the chat.",
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
      q: "Can Claude make videos?",
      a: "Not on its own. Claude writes scripts, storyboards and prompts, and its Claude Motion beta builds code-based animations, but it has no model for realistic video. Connect BuzzVideo MCP and Claude can call BuzzVideo's video models from the chat, with the clips saved to your BuzzVideo library.",
    },
    steps: [
      { title: "Add the connector", body: `In Claude desktop or claude.ai, open Customize, then Connectors, choose Add custom connector, name it BuzzVideo and paste ${MCP_URL}.` },
      { title: "Sign in once", body: "Connect and sign in to your BuzzVideo account. Claude stays connected after that." },
      { title: "Ask for the video", body: "Describe the clip and attach a product photo or link if you have one. BuzzVideo names the model it used in the reply." },
    ],
    uses: [
      { title: "Script to finished ad", body: "Write the script with Claude, then generate the clips in the same chat." },
      { title: "Product videos from a photo", body: "Attach a product shot and ask for a vertical ad or a talking-product clip." },
      { title: "Repeatable workflows", body: "Use MCP Skills such as Link to Ad or Long to Shorts for jobs you run every week." },
    ],
    faq: [
      { q: "How do I generate a video in Claude?", a: `Add BuzzVideo MCP as a custom connector in Claude (Customize, then Connectors, then Add custom connector, URL ${MCP_URL}), sign in to BuzzVideo, then ask Claude for the video you want.` },
      { q: "Which video models can Claude use through BuzzVideo?", a: "The same ones as the BuzzVideo web app, including Seedance 2.5, Seedance 2.0, Kling 3.0, MiniMax H3 and Gemini Omni 1.2 Flash. BuzzVideo names the model it used, and you can ask for a specific one." },
      { q: "Is the Claude video generator free?", a: `No. Claude's help center says custom connectors are available on all Claude plans, with Free limited to one, but BuzzVideo MCP needs a BuzzVideo Starter, Pro or Ultra plan. The ${SIGNUP_CREDITS} free credits new BuzzVideo accounts get are for Seedream images and Seed Audio 1.0 in the web app.` },
      { q: "What is Claude Motion?", a: "A beta Claude feature on Team and Enterprise plans that builds short animations as code, such as explainers and animated charts, and exports them as MP4. It does not use a video model, so it cannot make realistic footage or people." },
      { q: "Where do the videos I make in Claude go?", a: "Into your BuzzVideo library, the same one as the web app, on the same plan." },
    ],
    related: ["chatgpt-video-generator", "link-to-ad-mcp-skill", "long-to-shorts-mcp-skill"],
    metaTitle: "Claude Video Generator: Make Videos in Claude | BuzzVideo",
    metaDescription: "Claude can't generate realistic video on its own. Connect BuzzVideo MCP and Claude calls Seedance 2.5, Kling 4.0 and Wan 3.0 to make clips in the chat.",
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
      { title: "Ads from a chat", body: "Brainstorm the hook in ChatGPT, then generate the ad without switching apps." },
      { title: "Product pages to ads", body: "Run the Link to Ad skill on a product page link." },
      { title: "Creator-style videos", body: "UGC reviews and unboxing clips from one product photo." },
    ],
    faq: [
      { q: "Can ChatGPT make videos with BuzzVideo?", a: "Yes. BuzzVideo MCP works in ChatGPT and other MCP-compatible clients. Once BuzzVideo is added, ask for a video and it is generated on your BuzzVideo account." },
      { q: "How do I add BuzzVideo to ChatGPT?", a: "Find BuzzVideo in ChatGPT's plugins directory, click Add and sign in to BuzzVideo once. Then start a message with @BuzzVideo. Which ChatGPT plans can add plugins is set by OpenAI, so check OpenAI's help center for yours." },
      { q: "Is the ChatGPT video generator free?", a: `No. BuzzVideo MCP needs a BuzzVideo Starter, Pro or Ultra plan. The ${SIGNUP_CREDITS} free credits new accounts get are for Seedream images and Seed Audio 1.0 in the BuzzVideo web app.` },
      { q: "Can I use BuzzVideo MCP Skills in ChatGPT?", a: "Yes. Ask ChatGPT to use a skill by name, such as the BuzzVideo link-to-ad or ugc-product-review skill, and it runs the whole workflow." },
      { q: "Does it also work in Claude?", a: "Yes. In Claude you add BuzzVideo as a custom connector instead. See the Claude Video Generator page." },
    ],
    related: ["claude-video-generator", "link-to-ad-mcp-skill", "ugc-product-review-mcp-skill"],
    metaTitle: "ChatGPT Video Generator: Make Ads in ChatGPT | BuzzVideo",
    metaDescription: "Add BuzzVideo to ChatGPT, mention @BuzzVideo and describe your ad. BuzzVideo MCP generates the video on its models and returns it to the chat.",
  },
];
