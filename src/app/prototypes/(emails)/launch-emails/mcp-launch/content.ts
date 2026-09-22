import type { Template } from "../../emails/types";

export const TEMPLATE: Template = {
  id: "mcp-launch",
  name: "BuzzVideo MCP · 正式上线",
  category: "产品与发布",
  tone: "normal",
  trigger: "MCP 上线当天群发,面向全量注册用户,不分段",
  to: "全量注册用户",
  subject: "BuzzVideo is now inside ChatGPT, Claude and Grok Bot",
  blocks: [
    {
      t: "banner",
      image:
        "https://assets.presslogic.com/aigc/tasks/images/5aa41036-7a0b-479b-aa81-687043ee33df/2026-09-22/36b5fc28-f2af-493f-9752-292d15a03500.png",
      alt: "BuzzVideo MCP",
    },
    { t: "p", text: "Hi there," },
    { t: "h", text: "Connect once — and generate video, images and audio in the chat you already use" },
    { t: "kicker", text: "BuzzVideo MCP is live" },
    {
      t: "p",
      text: "You no longer have to leave your assistant to make something. Add BuzzVideo once and ChatGPT, Claude or Grok Bot can generate with every model in your account — no new tab, no re-uploading your product shots.",
    },
    {
      t: "features",
      items: [
        { icon: "🔌", text: "One connection, three clients — ChatGPT, Claude and Grok Bot" },
        { icon: "🎬", text: "Every model you already pay for: video, image and audio" },
        { icon: "🗂️", text: "Everything you generate lands in the same BuzzVideo library" },
      ],
    },
    {
      t: "section",
      no: "01",
      title: "Set up in under a minute",
      text: "In ChatGPT and Grok Bot, find BuzzVideo in the Plugins Directory and click Add. In Claude, open Customize, then Connectors, and paste the BuzzVideo connector URL. Sign in once and you stay connected.",
      button: "Connect BuzzVideo",
      href: "/prototypes/mcp",
    },
    {
      t: "section",
      no: "02",
      title: "Ask for it the way you'd ask a teammate",
      text: "\"Turn this product photo into a 15s UGC ad.\" \"Clone this viral TikTok with my product.\" \"Give me every social format of this hero shot.\" BuzzVideo picks a fitting model, names it in the reply, and you can ask for a specific one anytime.",
      button: "See what you can ask",
      href: "/prototypes/mcp",
    },
    {
      t: "box",
      title: "Good to know",
      items: [
        "Included with Starter, Pro and Ultra — unlimited generations with any model",
        "Not available on the Free plan; upgrade to switch it on",
        "Same account, same library, same plan limits as the web app",
      ],
    },
    { t: "action", button: "Connect BuzzVideo now →", href: "/prototypes/mcp" },
    {
      t: "p",
      text: "Ten ad variants before your coffee goes cold — without ever leaving the chat.",
    },
    { t: "signoff", line: "Happy creating,", team: "The BuzzVideo Team" },
    { t: "hr" },
    { t: "p", text: "Any questions? Just write to info@buzzvideo.ai — we read every message." },
  ],
};
