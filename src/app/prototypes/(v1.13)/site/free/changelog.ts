// What's New 的条目(2026-11-19)。只从仓库里已有的版本记录整理：src/lib/prototypes.ts 的 version 字段 + 各原型说明;
// 模型上新取 models-catalog.ts 里 release = "v1.13" 的模型。不写日期(仓库里的日期是原型日期，不是上线日期)。
// 状态标签只在导航数据(nav-data.ts)里有明确状态时才标:live = Live,uat = In testing;v1.13 模型 = Next release。

import { MODELS } from "../../site-nav/models-catalog";

export type Change = { title: string; body: string; href?: string; status?: "Live" | "In testing" | "Next release" };
/* date = 上线日期(2026-11-25 Monica:标签放日期，日期从 Google Chat「Buzzvideo - Information distribution & product testing ground & feedback」和测试沟通群的发版公告里取)。
   内容按 Notion「正式环境上线 Log」;日期和 Log 冲突时以 Chat 公告为准(2026-11-25 Monica 定):v1.2 6/25、v1.3 8/4、v1.4 8/12、v1.5.0 8/28、v1.8.0 9/29、v1.9.0 10/15、v1.10.0 10/30、v1.11.0 11/24(Monica 2026-11-25 指定;Chat 里 11/17 是 UAT 公告)。
   没找到公告的不写：v1.6、v1.7(只找到 v1.7.1 模型补丁 10/12)→ 标签退回版本号;v1.12 / v1.13 还没发版 → 标签显示 Coming soon。 */
export type Release = { version: string; date?: string; upcoming?: boolean; summary: string; items: Change[] };

const nextModels = MODELS.filter((m) => m.release === "v1.13");

const ALL_RELEASES: Release[] = [
  /* 2026-11-25 Monica:v1.16 Design Studio 还没上线，先不放进 What's New(v1.13 是最新一条);上线后再加回来 */
  {
    version: "v1.13",
    upcoming: true,
    summary: `${nextModels.length} new AI models across video, image and audio.`,
    items: [
      { title: "New video models", body: nextModels.filter((m) => m.type === "video").map((m) => m.name).join(", ") || "None in this release.", href: "/ai-video-models", status: "Next release" },
      { title: "New image models", body: nextModels.filter((m) => m.type === "image").map((m) => m.name).join(", ") || "None in this release.", href: "/ai-image-models", status: "Next release" },
      { title: "New voiceover, music and sound effects models", body: nextModels.filter((m) => m.type === "audio").map((m) => m.name).join(", ") || "None in this release.", href: "/ai-audio-models", status: "Next release" },
    ],
  },
  {
    version: "v1.12",
    upcoming: true,
    summary: "Video modes, AI tools in the sidebar, Hybrid Reel Agent and MCP Skills.",
    items: [
      { title: "Video generation modes", body: "Every video model now exposes the input modes its API supports, such as first and last frame, edit, extend and lip sync, on the home page, in the Marketing Agent and on Canvas video nodes." },
      { title: "Image, Video, Audio and Avatar tools", body: "New tool pages in the sidebar, including upscale, background removal, virtual try-on, talking avatar and lip sync, sharing the same credits as generation." },
      { title: "Hybrid Reel Agent", body: "Upload your own footage and a prompt; the agent reads the clips, plans a storyboard, generates the missing shots and hands the cut to the editor." },
      { title: "Subtitle styles", body: "18 static subtitle styles plus 5 word-by-word animated styles in the Hybrid Reel editor." },
      { title: "MCP Skills", body: "Ready-made ad workflows you can run from your AI chat through BuzzVideo MCP.", href: "/mcp-skills" },
    ],
  },
  /* ── 2026-11-25 Monica:「不准」→ 按 Notion「正式环境上线 Log」(BuzzVideo Product Management)逐条重写。
        只放对外的产品变化;内部事项(白名单、团队额度、故障、内部 SOP、后台成本页)不放。
        Log 里没有的 v1.6(团队 / Business 定价)、v1.7(Blog)、v1.3 的 Affiliate、v1.5 的 About 页删掉;
        团队功能对应 Log 里 9/20 的 Enterprise 上线。两次版本之间单独发的模型(Seedance 2.5、v1.5.2、v1.7.1、Kling 4.0)各占一条。
        日期以 Google Chat 公告为准(2026-11-25 Monica 定):v1.2 6/25、v1.5 8/28、v1.10 10/30;v1.8 / v1.9 / v1.10 / Kling 4.0 只有 UAT 上线日期;v1.11 来自 Google Chat 公告(Log 未收录)。 ── */
  {
    version: "v1.11",
    date: "2026-11-24",
    summary: "3D Studio and editing a plan step on Canvas.",
    items: [
      { title: "3D Studio", body: "Build a simple 3D scene and camera move, then generate the exact shot from it." },
      { title: "Edit in Canvas from a generation plan", body: "Each phase of a Marketing Agent plan has an Edit in canvas button that opens that step on Canvas with its prompt, model, ratio and references." },
    ],
  },
  {
    version: "v1.10",
    date: "2026-10-30",
    summary: "Pick the model behind the Marketing Agent, and audio in the agent.",
    items: [
      { title: "Model picker in the Marketing Agent", body: "Choose Gemini, Grok, Qwen or DeepSeek to drive the conversation, with a thinking level for each.", href: "/marketing-agent" },
      { title: "Audio in the Marketing Agent", body: "The agent can now generate voiceovers and other audio alongside images and videos." },
      { title: "Clearer generation plans", body: "Plan cards now read like a receipt, and a generation picks up where it left off after a dropped connection." },
      { title: "Canvas layout", body: "The input panel sits right under the selected node, and the AI Assistant is a floating card you can drag anywhere." },
      { title: "Reference audio uploads", body: "Upload your own audio as a reference in Video and Audio generation. SVG and TIFF images are converted automatically." },
      { title: "MCP Skills", body: "Ready-made ad workflows you can run from your AI chat through BuzzVideo MCP.", href: "/mcp-skills" },
      { title: "Fairer agent billing", body: "Marketing Agent chats are now charged by the tokens actually used." },
    ],
  },
  {
    version: "kling-4-0",
    date: "2026-10-29",
    summary: "Kling 4.0 is here.",
    items: [
      { title: "Kling 4.0", body: "Up to 30 seconds in a single generation, with high-quality stereo sound and lip sync, 720p and 1080p, and a 21:9 ultra-wide ratio.", href: "/kling-4-0" },
      { title: "Omni Reference", body: "Use up to 15 references in one generation: up to 10 images, 5 videos (about 30 seconds) and 7 subjects, plus up to 10 keyframes." },
    ],
  },
  {
    version: "v1.9",
    date: "2026-10-15",
    summary: "BuzzVideo MCP: create inside ChatGPT and Claude.",
    items: [
      { title: "BuzzVideo MCP", body: "Generate images, videos and voiceovers right inside ChatGPT, Claude and other AI chats. Works on every plan and uses the same credits. Results show as cards, and you can upload files and clone voices from the chat.", href: "/mcp", status: "Live" },
      { title: "Connected apps", body: "See and manage the AI chats linked to your account under Integrations. Credits used through MCP are labelled with the app they came from." },
      { title: "Share a canvas", body: "Invite people to a canvas as viewers, or set general access for anyone with the link." },
      { title: "Agent replies in your language", body: "The Marketing Agent answers in the language you write in." },
      { title: "Updated Privacy Policy and Terms of Service", body: "New versions dated October 13, 2026.", href: "/privacy-policy" },
    ],
  },
  {
    version: "v1.7.1",
    date: "2026-10-12",
    summary: "Three new models: Grok Imagine 2.0, Nano Banana 2.1 and Wan 3.0.",
    items: [
      { title: "Grok Imagine 2.0", body: "Images with clear text and controllable layouts, plus a new Quality setting.", href: "/grok-imagine-2-0" },
      { title: "Nano Banana 2.1", body: "Consistent image series and text in many languages.", href: "/nano-banana-2-1" },
      { title: "Wan 3.0", body: "The next generation of Wan video.", href: "/wan-3-0" },
      { title: "No credits lost on bad settings", body: "If a setting is not supported by the model, the request is stopped before it is sent and no credits are charged." },
    ],
  },
  {
    version: "v1.8",
    date: "2026-09-29",
    summary: "Canvas tags and team usage analytics.",
    items: [
      { title: "Canvas project tags", body: "Tag canvases and filter by tag, from a tag list shared across your team (up to 5 tags per canvas, 100 per team)." },
      { title: "Team usage analytics", body: "Usage over the last 14 or 180 days, this month, last month or a custom range, with period-over-period change, a page per member and credits by project tag." },
      { title: "Redesigned settings", body: "Settings can open as a full page, with a new layout." },
    ],
  },
  {
    version: "enterprise",
    date: "2026-09-20",
    summary: "BuzzVideo Enterprise.",
    items: [
      { title: "Personal and Enterprise accounts", body: "Switch between your personal account and your organization from the top-right corner." },
      { title: "Team projects", body: "Team projects are visible across the organization; only the creator can edit, and others can copy and reuse the assets. Move projects between personal and team space inside the organization." },
      { title: "Credit limits per member", body: "Admins choose Unlimited, Soft limit or Hard limit for each member's monthly credits.", href: "/enterprise" },
    ],
  },
  {
    version: "v1.5.2",
    date: "2026-09-15",
    summary: "GPT Image 2.5 and MiniMax H3 Max.",
    items: [
      { title: "GPT Image 2.5 Sunburst and Flare", body: "The only image models that can output a transparent background, with a new Background option.", href: "/gpt-image-2-5-sunburst" },
      { title: "MiniMax H3 Max", body: "Very fast video with native stereo sound.", href: "/minimax-h3-max" },
    ],
  },
  {
    version: "v1.5",
    date: "2026-08-28",
    summary: "Asset Library, audio generation and new models.",
    items: [
      { title: "Asset Library", body: "Everything you generate or upload in one place." },
      { title: "Audio generation", body: "Generate audio in Audio Gen and with a new audio node on Canvas." },
      { title: "MiniMax H3 and Seedream 5.0 Pro", body: "A new video model and a new image model.", href: "/seedream-5-5" },
      { title: "Simpler billing", body: "Yearly plans now grant credits every month, and watermark-free assets are kept for good." },
      { title: "BuzzVideo AI", body: "One brand name across the product, and lighter pages that load faster." },
    ],
  },
  {
    version: "seedance-2-5-1080p",
    date: "2026-08-20",
    summary: "Seedance 2.5 now renders in 1080p.",
    items: [{ title: "Seedance 2.5 in 1080p", body: "Generate Seedance 2.5 videos in full HD.", href: "/seedance-2-5" }],
  },
  {
    version: "v1.4",
    date: "2026-08-12",
    summary: "New home page, Use Cases and Gallery, and credit estimates.",
    items: [
      { title: "New home page", body: "A new home page and a new Marketing Agent landing page." },
      { title: "Use Cases and Gallery", body: "A content hub of use cases and finished work to start from.", href: "/usecase", status: "Live" },
      { title: "See the cost before you generate", body: "Every generation shows its estimated credits first, and the default number of outputs is now 1 instead of 4." },
      { title: "Canvas templates", body: "Adding a template keeps what is already on your canvas." },
      { title: "Seedance hub", body: "One page for the Seedance models with a side-by-side comparison.", href: "/seedance" },
      { title: "Faster and safer", body: "The first screen loads about 10x lighter, and sign-in is more secure." },
    ],
  },
  {
    version: "seedance-2-5",
    date: "2026-08-07",
    summary: "Seedance 2.5 is here.",
    items: [{ title: "Seedance 2.5", body: "Videos up to 30 seconds, with up to 30 reference images, 10 reference videos and 10 reference audio clips.", href: "/seedance-2-5" }],
  },

  {
    version: "v1.3",
    date: "2026-08-04",
    summary: "The Marketing Agent can browse the web.",
    items: [
      { title: "Web browsing in the Marketing Agent", body: "The agent reads the links you paste and searches the web on its own. Credits used for browsing show up as it works.", href: "/marketing-agent" },
      { title: "Nano Banana 2 Lite and Gemini Omni Flash", body: "A new image model and a new video model, plus an audio on/off switch for video.", href: "/nano-banana-2-lite" },
      { title: "Credit packs", body: "Buy credits on their own. They never expire and are used before your plan credits." },
    ],
  },
  {
    version: "v1.2",
    date: "2026-06-25",
    summary: "Plans and pricing.",
    items: [{ title: "Pricing plans", body: "Free, Starter, Pro and Ultra plans with monthly credits.", href: "/pricing", status: "Live" }],
  },
  /* 2026-11-25 Monica「UAT 的内容最后全部都进了正式环境」→ 补上 v1.2 之前的两条，日期和内容只按 Notion「正式环境上线 Log」第一阶段写 */
  {
    version: "canvas",
    date: "2026-03-25",
    /* 2026-11-25 Monica:「就是 canvas 没有 agent」「这里就换成 canvas 就可以」—— 这一版上的是 Canvas,没有 Ad Agent / Canvas Agent */
    summary: "Canvas is here.",
    items: [
      { title: "Canvas", body: "Generate images and videos as connected nodes on one board: a prompt and a reference make an image, and the image becomes a video.", href: "/canvas" },
    ],
  },
  /* 2026-11-25 Monica:「中间要加一个 marketing agent」—— Notion 上线 Log 3 月 25 日「Ad Agent + Canvas Agent」里的 Ad Agent 就是 Marketing Agent 的前身，拆成单独一条 */
  {
    version: "marketing-agent",
    date: "2026-03-25",
    summary: "Marketing Agent.",
    items: [
      { title: "Marketing Agent", body: "Describe the ad you want in a chat, and the agent turns your idea into ad content.", href: "/marketing-agent" },
    ],
  },
  {
    version: "beta",
    date: "2026-02-07",
    summary: "BuzzVideo beta is live.",
    items: [{ title: "BuzzVideo beta", body: "The first version of BuzzVideo, for creating AI ad content, opens at app.buzzvideo.ai." }],
  },
];

/* 2026-11-25 Monica:还没发版的(v1.12 / v1.13)先不放进 What's New;条目留在上面，发版后填上 date、去掉 upcoming 就会显示 */
export const RELEASES: Release[] = ALL_RELEASES.filter((r) => !r.upcoming);
