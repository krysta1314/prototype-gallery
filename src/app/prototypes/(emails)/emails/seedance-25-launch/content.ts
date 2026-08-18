import type { Template } from "../types";

export const TEMPLATE: Template = {
  id: "seedance-25-launch",
  name: "Seedance 2.5 · 正式上线",
  category: "产品与发布",
  tone: "normal",
  trigger: "模型正式开放当天群发,预热邮件的收件人全量再发一次(点过预热 CTA 的优先)",
  to: "全量注册用户",
  subject: "🎬 Seedance 2.5 is live! Make your first 30-second video ad today",
  shipped: true,
  blocks: [
    {
      t: "banner",
      bg: "/prototypes/homepage/new-model-festival-bg.png",
      art: "/prototypes/homepage/seedance-2-5-title.webp",
      alt: "Seedance 2.5 is live",
      cropTop: 14,
      label: "Now live",
    },
    { t: "p", text: "Hi there," },
    { t: "p", text: "The wait is over. Seedance 2.5 is live on BuzzVideo today — come and give it a try!" },
    { t: "h", text: "Turn one prompt into a finished video ad — Seedance 2.5 is live!" },
    { t: "kicker", text: "Ad-ready AI video in one click" },
    { t: "p", text: "Pick Seedance 2.5 from the model list, describe the ad you want, and generate. No timeline, no stitching:" },
    {
      t: "features",
      items: [
        { icon: "🎬", text: "30-second native video output in one generation" },
        { icon: "🎨", text: "Up to 50 multimodal reference inputs" },
        { icon: "✂️", text: "Next-level video editing control" },
      ],
    },
    { t: "p", text: "Characters, lighting and camera motion stay consistent from the first shot to the last, so Seedance 2.5 gives you a video you can actually publish — not a clip you have to fix." },
    {
      t: "box",
      title: "Try it free on BuzzVideo",
      items: ["No credit card required", "Instant access with your existing account"],
    },
    { t: "action", button: "Try Seedance 2.5 →", link: "Browse prompts in the template gallery" },
    {
      t: "grid",
      title: "Built for the teams who run ads:",
      items: [
        { icon: "📱", label: "Social ads", text: "Thumb-stopping creative for TikTok, Reels and Shorts" },
        { icon: "🛍️", label: "E-commerce", text: "A product ad for every SKU, no shoot required" },
        { icon: "📊", label: "Performance marketing", text: "Ten ad variants to test in an afternoon" },
        { icon: "🏢", label: "Agencies", text: "Client-ready ad concepts in minutes, not weeks" },
      ],
    },
    { t: "p", text: "Your first 30-second video is one prompt away. Open BuzzVideo and create it." },
    { t: "signoff", line: "Happy creating,", team: "The BuzzVideo Team" },
    { t: "hr" },
    { t: "p", text: "Any questions? Just write to info@buzzvideo.ai — we read every message." },
  ],
};
