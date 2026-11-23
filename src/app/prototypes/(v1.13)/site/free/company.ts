// 帮助中心 / 全站 FAQ / Enterprise 用到的事实(2026-11-19)。
// 出处：
//   - 注册积分、免费积分能用的模型、哪些模型要哪个套餐:site/tools/credits.ts、tool-content.ts FREE_MODELS、model-content.ts PRO_ONLY;
//   - 套餐功能、积分重置 / 不结转 / 取消 / 退款、Enterprise 列表:线上 https://buzzvideo.ai/pricing(2026-11-19 WebFetch 核实);
//   - 团队额度模型(共享池、按人分配、角色):v1.6 team-workspace/_shared/data.ts;
//   - Design Studio 的企业级控制:v1.16 design-studio/app/entitlements.ts(文件注明「建议值，待 Ryan 确认」→ 页面上写 Planned)。
// 不写价格数字(价格让人去 /pricing 看)。

import { MODELS } from "../../site-nav/models-catalog";
import { SIGNUP_CREDITS } from "../tools/credits";

export type QA = { q: string; a: string };
const live = MODELS.filter((m) => m.release === "live");
const liveOf = (t: string) => live.filter((m) => m.type === t).length;

export const PRICING_URL = "https://buzzvideo.ai/pricing";

export const FAQ_GROUPS: { title: string; items: QA[] }[] = [
  {
    title: "Getting started",
    items: [
      { q: "What is BuzzVideo?", a: `BuzzVideo is an AI ad generator for marketers and creators. It brings ${live.length} AI models for video, image and audio into one account, plus a Marketing Agent that turns a brief into campaign-ready ads.` },
      { q: "Is BuzzVideo free to use?", a: `Yes, you can start free. New accounts get ${SIGNUP_CREDITS} one-time credits that work on Seedream 4.5 and Seedream 5.0 lite images and Seed Audio 1.0 voiceovers. Video generation needs a Starter, Pro or Ultra plan.` },
      { q: "What is the Marketing Agent?", a: "The Marketing Agent is BuzzVideo's chat-based assistant: describe your product and goal, and it plans the campaign, writes the copy and generates the ads with the right models. It is included on every plan, including Free." },
      { q: "Can I use BuzzVideo inside ChatGPT or Claude?", a: "Yes, through BuzzVideo MCP. Connect it to an AI chat app that supports MCP and create videos and images from the chat. MCP is included on every plan, including Free." },
    ],
  },
  {
    title: "Credits and plans",
    items: [
      { q: "How do BuzzVideo credits work?", a: "Every generation costs credits, and you see the exact credit price before you create. Price depends on the model, length and resolution." },
      { q: "Do unused credits roll over?", a: "No. Monthly and yearly plan credits reset each billing cycle, and leftover plan credits don't carry over at renewal. Bonus credits never expire." },
      { q: "What happens to my credits if I upgrade or downgrade?", a: "When you upgrade, your remaining credits carry over. When you downgrade, unused credits are forfeited at renewal." },
      { q: "Can I cancel my subscription?", a: "Yes. After you cancel, you keep your remaining credits and plan access until the end of the current billing period." },
      { q: "Does BuzzVideo offer refunds?", a: "Not routinely. Refunds may be considered when required by law or approved in special circumstances, and may be adjusted for credits already used. Contact support to ask." },
      { q: "Is there a watermark on the Free plan?", a: "Yes. Work made on the Free plan carries a watermark; Starter, Pro and Ultra remove it. The Free plan also doesn't include video generation." },
      { q: "Which plan do I need for Seedance 2.5?", a: "Seedance 2.5 and Seedance 2.0 are included on Pro and Ultra. Starter includes all image models and most video models, including Seedance 2.0 Fast and Mini." },
    ],
  },
  {
    title: "Models",
    items: [
      { q: "Which AI models does BuzzVideo have?", a: `${live.length} models are live today: ${liveOf("video")} for video, ${liveOf("image")} for images and ${liveOf("audio")} for audio, from providers such as ByteDance, Kuaishou, Alibaba, MiniMax and OpenAI. More arrive in the next release.` },
      { q: "How do I choose a model?", a: "Start from the job: long premium shots, native audio, text in images or price per image. Each model page lists its length, resolution and credit price, and the model hubs compare them side by side." },
    ],
  },
  {
    title: "Teams, API and enterprise",
    items: [
      { q: "Can I share my plan with my team?", a: "Not on Starter, Pro or Ultra; those plans are for one person. Multi-user access, seat management and shared workspaces come with Enterprise." },
      { q: "Does BuzzVideo have an API?", a: "Yes, for Enterprise customers. API access is listed on the Enterprise plan; contact sales to set it up." },
      { q: "Does BuzzVideo offer SOC 2 reports or a DPA?", a: "Enterprise customers can get SOC 2 reports, a custom DPA and data residency options. Contact sales for details." },
    ],
  },
  {
    title: "Free tools",
    items: [
      { q: "Are the free tools really free?", a: "Yes. The Video Resizer, Video Compressor, Video to GIF, Image Resizer, Safe Zone Checker and Meta Ad Size Guide need no account and run in your browser without uploading files." },
    ],
  },
];

export const ALL_FAQ: QA[] = FAQ_GROUPS.flatMap((g) => g.items);

/* 帮助中心：上手话题(全部指向已有页面) */
export const HELP_TOPICS: { title: string; body: string; href: string; label: string }[] = [
  { title: "Make your first ad", body: "Describe your product to the Marketing Agent and let it plan and generate the ads.", href: "/marketing-agent", label: "AI Marketing Agent" },
  { title: "Generate a video", body: "Pick a video model, write a prompt or add an image, and see the credit price before you create.", href: "/ai-video-generator", label: "AI Video Generator" },
  { title: "Generate images", body: "Product shots, ad images and edits with the leading image models.", href: "/ai-image-generator", label: "AI Image Generator" },
  { title: "Build on Canvas", body: "Chain image, video and audio steps as nodes for multi-shot ads.", href: "/canvas", label: "Canvas" },
  { title: "Use BuzzVideo in your AI chat", body: "Connect BuzzVideo MCP to create videos and images from ChatGPT, Claude and other MCP apps.", href: "/mcp", label: "BuzzVideo MCP" },
  { title: "Find a prompt", body: "Browse real prompts and results, then reuse them.", href: "/usecase", label: "Prompt Library" },
  { title: "Choose a model", body: "Compare video models by length, resolution and credit price.", href: "/ai-video-models", label: "AI video models" },
  { title: "Prepare files for each platform", body: "Resize, compress and check safe zones for free in your browser.", href: "/free-tools", label: "Free tools" },
];

/* 套餐对比(只写功能，不写价格):线上定价页 */
export const PLAN_ROWS: { label: string; free: string; starter: string; pro: string; ultra: string; ent: string }[] = [
  { label: "Credits", free: `${SIGNUP_CREDITS} one-time`, starter: "Monthly", pro: "Monthly", ultra: "Monthly", ent: "Custom allocation" },
  { label: "Marketing Agent", free: "Yes", starter: "Yes", pro: "Yes", ultra: "Yes", ent: "Yes" },
  { label: "Image generation", free: "Seedream 4.5, Seedream 5.0 lite", starter: "All image models", pro: "All models", ultra: "All models", ent: "All models" },
  { label: "Video generation", free: "No", starter: "Most video models", pro: "All, incl. Seedance 2.5", ultra: "All, incl. Seedance 2.5", ent: "All models" },
  { label: "No watermark", free: "No", starter: "Yes", pro: "Yes", ultra: "Yes", ent: "Yes" },
  { label: "Parallel generations", free: "1", starter: "Up to 4", pro: "Up to 8", ultra: "Up to 12", ent: "Priority queue" },
  { label: "MCP", free: "Yes", starter: "Yes", pro: "Yes", ultra: "Yes", ent: "Yes" },
  { label: "Technical support", free: "No", starter: "No", pro: "Yes", ultra: "Yes", ent: "SLA + account manager" },
  { label: "Team seats & API", free: "No", starter: "No", pro: "No", ultra: "No", ent: "Yes" },
];

/* Enterprise:线上定价页确认的权益 */
export const ENT_INCLUDED: { title: string; body: string }[] = [
  { title: "Shared workspaces and seats", body: "Multi-user access, seat management, shared workspaces and team workflows in one organization." },
  { title: "Custom credit allocation", body: "Credits sized to your team, allocated where they are needed instead of one fixed plan per person." },
  { title: "Every model, dedicated capacity", body: "Access to all models, with dedicated model capacity and a priority processing queue." },
  { title: "API and MCP access", body: "Connect BuzzVideo to your own tools with the API, or create from AI chat apps with MCP." },
  { title: "SLA and account manager", body: "A service level agreement, a dedicated account manager, and team training and onboarding." },
  { title: "Security and compliance", body: "SOC 2 reports, a custom DPA and data residency options for your legal and IT review." },
];

/* Enterprise 团队额度怎么管(v1.6 team-workspace 的产品设计) */
export const ENT_CREDITS: { title: string; body: string }[] = [
  { title: "One shared credit pool", body: "The organization has one pool. Admins set an allocation per member, as a soft or hard limit, and unallocated credits stay in the pool." },
  { title: "Top up the pool or a person", body: "Add credits to the whole pool or to one member. Auto top-up can refill the pool below a threshold, with a monthly cap for finance." },
  { title: "Roles for every job", body: "Owner, Admin, Billing Admin and Member. Billing Admins manage invoices and usage without taking a creative seat." },
  { title: "Usage you can act on", body: "Owners, Admins and Billing Admins see usage per teammate and when each seat was last active, so idle seats are easy to reassign." },
];

/* Design Studio 的企业级控制(entitlements.ts,建议值未定 → Planned) */
export const ENT_PLANNED = ["Approvals and approval rules", "Locked brand templates", "Brand Check", "AI model allowlist", "Per-member credit limits", "Audit log", "SSO / SCIM", "Restrict share links to your company", "Data residency", "IP indemnity"];
