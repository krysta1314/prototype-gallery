// What's New 的条目(2026-11-19)。只从仓库里已有的版本记录整理：src/lib/prototypes.ts 的 version 字段 + 各原型说明;
// 模型上新取 models-catalog.ts 里 release = "v1.13" 的模型。不写日期(仓库里的日期是原型日期，不是上线日期)。
// 状态标签只在导航数据(nav-data.ts)里有明确状态时才标:live = Live,uat = In testing;v1.13 模型 = Next release。

import { MODELS } from "../../site-nav/models-catalog";

export type Change = { title: string; body: string; href?: string; status?: "Live" | "In testing" | "Next release" };
export type Release = { version: string; summary: string; items: Change[] };

const nextModels = MODELS.filter((m) => m.release === "v1.13");

export const RELEASES: Release[] = [
  {
    version: "v1.16",
    summary: "Design Studio arrives inside BuzzVideo.",
    items: [
      { title: "Design Studio", body: "A design suite for ad creatives, decks and simple sites, with five areas: Image Builder, Brand Kit, Decks, Sites and Projects. It sits in the sidebar below 3D Studio.", href: "/design-studio", status: "In testing" },
      { title: "Brand Kit", body: "Save your logo, colors and fonts once so Design Studio keeps every layout on brand.", href: "/brand-kit", status: "In testing" },
    ],
  },
  {
    version: "v1.13",
    summary: `${nextModels.length} new AI models across video, image and audio.`,
    items: [
      { title: "New video models", body: nextModels.filter((m) => m.type === "video").map((m) => m.name).join(", ") || "None in this release.", href: "/ai-video-models", status: "Next release" },
      { title: "New image models", body: nextModels.filter((m) => m.type === "image").map((m) => m.name).join(", ") || "None in this release.", href: "/ai-image-models", status: "Next release" },
      { title: "New voiceover, music and sound effects models", body: nextModels.filter((m) => m.type === "audio").map((m) => m.name).join(", ") || "None in this release.", href: "/ai-audio-models", status: "Next release" },
    ],
  },
  {
    version: "v1.12",
    summary: "Video modes, AI tools in the sidebar, Hybrid Reel Agent and MCP Skills.",
    items: [
      { title: "Video generation modes", body: "Every video model now exposes the input modes its API supports, such as first and last frame, edit, extend and lip sync, on the home page, in the Marketing Agent and on Canvas video nodes." },
      { title: "Image, Video, Audio and Avatar tools", body: "New tool pages in the sidebar, including upscale, background removal, virtual try-on, talking avatar and lip sync, sharing the same credits as generation." },
      { title: "Hybrid Reel Agent", body: "Upload your own footage and a prompt; the agent reads the clips, plans a storyboard, generates the missing shots and hands the cut to the editor.", href: "/hybrid-reel", status: "In testing" },
      { title: "Subtitle styles", body: "18 static subtitle styles plus 5 word-by-word animated styles in the Hybrid Reel editor." },
      { title: "MCP Skills", body: "Ready-made ad workflows you can run from your AI chat through BuzzVideo MCP.", href: "/mcp-skills", status: "In testing" },
    ],
  },
  {
    version: "v1.11",
    summary: "3D Studio and editing a plan step on Canvas.",
    items: [
      { title: "3D Studio", body: "Build a simple 3D scene and camera move, then generate the exact shot from it.", href: "/3d-studio", status: "In testing" },
      { title: "Edit in Canvas from a generation plan", body: "Each phase of a Marketing Agent plan has an Edit in canvas button that opens that step on Canvas with its prompt, model, ratio and references." },
    ],
  },
  {
    version: "v1.10",
    summary: "Choose the language model behind the Marketing Agent.",
    items: [{ title: "LLM picker in the Marketing Agent", body: "Pick which large language model drives the agent's thinking, right next to the Create button." }],
  },
  {
    version: "v1.9",
    summary: "BuzzVideo MCP.",
    items: [{ title: "BuzzVideo MCP", body: "Create videos and images inside any AI chat that supports MCP, using your BuzzVideo account and credits.", href: "/mcp", status: "Live" }],
  },
  {
    version: "v1.8",
    summary: "Announcements and member usage for organizations.",
    items: [
      { title: "In-app announcements", body: "Model launches, feature launches and limited-time credit offers now appear as announcements on the home page." },
      { title: "Member usage for organizations", body: "Enterprise admins can see credit usage per member across the organization." },
    ],
  },
  {
    version: "v1.7",
    summary: "The BuzzVideo blog.",
    items: [{ title: "Blog", body: "Guides and tutorials for making ads with AI.", href: "/blog", status: "Live" }],
  },
  {
    version: "v1.6",
    summary: "Teams and business plans.",
    items: [
      { title: "Team workspaces", body: "Invite teammates into a shared workspace across Home, Marketing Agent, Canvas and Assets, with roles and credit settings." },
      { title: "Business pricing", body: "The pricing page adds a Business tab next to Individual plans.", href: "/pricing", status: "Live" },
      { title: "Enterprise setup", body: "Enterprise organizations are set up by the BuzzVideo sales team rather than self-serve checkout.", href: "/enterprise" },
    ],
  },
  {
    version: "v1.5",
    summary: "Asset Library and audio generation.",
    items: [
      { title: "Asset Library", body: "Everything you generate or upload in one place, grouped by date and filterable by images, videos, audio and PDF." },
      { title: "Audio generation", body: "Generate voiceovers from text in the Marketing Agent and as a Generate Audio node on Canvas." },
      { title: "About page", body: "A new page about BuzzVideo.", href: "/about", status: "Live" },
    ],
  },
  {
    version: "v1.4",
    summary: "New home page, Marketing Agent update and Canvas.",
    items: [
      { title: "New home page", body: "Model and feature entry points, the inspiration feed and responsive phone and tablet layouts." },
      { title: "Marketing Agent update", body: "A project sidebar, filterable creations and the same collapsible chat box as the home page.", href: "/marketing-agent" },
      { title: "Canvas", body: "A node-based workspace for building multi-step generations.", href: "/canvas", status: "Live" },
    ],
  },
  {
    version: "v1.3",
    summary: "Affiliate program, credit top-ups and web search in the Marketing Agent.",
    items: [
      { title: "Affiliate program", body: "Earn commission by referring new paying customers.", href: "/affiliate", status: "Live" },
      { title: "Credit top-ups", body: "Paid plans can buy extra credits from account settings." },
      { title: "Web search missions", body: "Ready-made Marketing Agent missions that read and search the web for research, creatives and ad launches." },
    ],
  },
  {
    version: "v1.2",
    summary: "Plans and pricing.",
    items: [{ title: "Pricing plans", body: "Free, Starter, Pro and Ultra plans with monthly credits.", href: "/pricing", status: "Live" }],
  },
];
