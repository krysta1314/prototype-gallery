import type { Template } from "../types";

export const TEMPLATE: Template = {
  id: "seedance-25-teaser",
  name: "Seedance 2.5 · 上线预热",
  category: "产品与发布",
  tone: "normal",
  trigger: "上线前 3 天群发,面向近 90 天未生成过视频的沉睡用户 + 已注册但未付费用户(召回)",
  to: "全量注册用户,按沉睡 / 活跃分段发送",
  subject: "🚀 Get ready for Seedance 2.5! Your next video ad is one prompt away",
  shipped: true,
  blocks: [
    {
      t: "banner",
      bg: "/prototypes/homepage/new-model-festival-bg.png",
      art: "/prototypes/homepage/seedance-2-5-coming-soon-title.png",
      alt: "Seedance 2.5 coming soon",
    },
    { t: "p", text: "Hi there," },
    { t: "h", text: "Your next video ad, in one generation — Seedance 2.5 is coming to BuzzVideo!" },
    { t: "kicker", text: "Ad-ready AI video in one click" },
    { t: "p", text: "Seedance 2.5 is a next-generation multimodal video model built for the people who ship ads — creators, marketers and agency teams:" },
    {
      t: "features",
      items: [
        { icon: "🎬", text: "30-second native video output in one generation" },
        { icon: "🎨", text: "Up to 50 multimodal reference inputs" },
        { icon: "✂️", text: "Next-level video editing control" },
      ],
    },
    { t: "p", text: "From ad creatives and social content to product demos and explainer videos, Seedance 2.5 delivers production-quality results in minutes — so stay tuned for more." },
    {
      t: "box",
      title: "Try it free on BuzzVideo",
      items: ["No credit card required", "Instant access with your existing account"],
    },
    { t: "action", button: "Start Creating Now →", link: "Explore more of Seedance 2.5" },
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
    { t: "p", text: "Ready to see what's possible? Your account is all set — just click and create." },
    { t: "signoff", line: "Happy creating,", team: "The BuzzVideo Team" },
    { t: "hr" },
    { t: "p", text: "Any questions? Just write to info@buzzvideo.ai — we read every message." },
  ],
};
