import type { Template } from "../../emails/types";

/* Hybrid Reel Agent + 视频剪辑器 上新邮件:一封讲两个功能,顺着用户的真实流程 ——
   先在 Agent 里把素材做成一条广告,再点 Edit in canvas 进剪辑器接着改。
   Hybrid Reel 只有 Enterprise 能用,但邮件发给全部用户:主按钮是开通 Enterprise,已经是 Enterprise 的走下面的小链接;
   剪辑器所有套餐都能用,第 02 节写明,非 Enterprise 用户读完也有马上能用的东西。
   版式用拼贴风(layout: "collage"):须知放在按钮下面当小字,所以 box 排在 action 之后 */
export const TEMPLATE: Template = {
  id: "hybrid-reel-launch",
  name: "Hybrid Reel + 剪辑器 · 正式上线",
  category: "产品与发布",
  tone: "normal",
  trigger: "上线当天群发,全量注册用户。Hybrid Reel 仅 Enterprise 可用:非 Enterprise 用户看主按钮(联系团队开通),Enterprise 用户点下面的小链接直接用",
  to: "全量注册用户",
  subject: "🎬 Turn the footage you already shot into a finished ad",
  layout: "collage",
  blocks: [
    { t: "h", text: "Turn the footage you ==already shot== into a finished ad" },
    {
      t: "banner",
      image: "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-10-22/371544158231388160.jpg",
      alt: "Hybrid Reel — your footage + AI shots, auto-edited into one finished ad",
      caption: "Hybrid Reel, with the new Video Editor",
    },
    {
      t: "p",
      text: "Most of your ad is already on your phone — a product close-up, someone using it, a quick before-and-after. Hybrid Reel turns those clips into a ready-to-run ad and lets AI shoot only the moments you're missing. Then the new Video Editor lets you fine-tune every cut.",
    },
    {
      t: "section",
      no: "01",
      title: "Drop in your footage — get back a finished ad",
      text: "Hybrid Reel watches every clip, plans the cut around the beats that sell — hook, problem, proof, demo, call to action — AI-shoots only what your footage can't cover, and edits it all together with voiceover, music and subtitles.",
      button: "See how Hybrid Reel works",
      href: "https://buzzvideo.ai/super-agent",
      toast: "去 https://buzzvideo.ai/super-agent",
      image: "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-10-22/371544158231388161.jpg",
      tag: "Agent",
    },
    {
      t: "section",
      no: "02",
      title: "Make it yours in the Video Editor",
      text: "Click Edit in canvas and your ad opens on the timeline. Trim and reorder clips, regenerate any AI shot, rewrite a voiceover line — the subtitles follow it — switch to 1:1 or 16:9, and export in 1080p. The Video Editor works on any canvas, on every plan.",
      button: "Open the Video Editor",
      href: "https://buzzvideo.ai/canvas",
      toast: "去 https://buzzvideo.ai/canvas",
      image: "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-10-22/371544157371555840.jpg",
      tag: "Video Editor",
    },
    {
      t: "features",
      items: [
        { icon: "🎥", text: "Your real footage stays the star — AI fills only the gaps" },
        { icon: "🎨", text: "AI shots match your product, light and look" },
        { icon: "💬", text: "Subtitles stay in sync with every voiceover line" },
        { icon: "📐", text: "One cut, every format: 9:16, 1:1 and 16:9" },
      ],
    },
    {
      t: "action",
      button: "Get Hybrid Reel for my team →",
      toast: "去 https://buzzvideo.ai/pricing",
      link: "Already on Enterprise? Open Hybrid Reel",
      linkToast: "去 https://buzzvideo.ai/super-agent",
    },
    {
      t: "box",
      title: "Good to know",
      items: [
        "Hybrid Reel is available on the Enterprise plan",
        "The Video Editor is included on every plan",
        "You see the credit cost before anything is generated",
      ],
    },
    { t: "signoff", line: "Happy creating,", team: "The BuzzVideo Team" },
    { t: "note", text: "Any questions? Just write to info@buzzvideo.ai — we read every message." },
  ],
};
