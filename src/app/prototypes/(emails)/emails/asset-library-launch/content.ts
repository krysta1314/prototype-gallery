import type { Template } from "../types";

export const TEMPLATE: Template = {
  id: "asset-library-launch",
  name: "Asset Library · 正式上线",
  category: "产品与发布",
  tone: "normal",
  trigger: "Asset Library 开放当天群发,面向所有注册用户(近 90 天有过生成记录的优先发送)",
  to: "全量注册用户",
  subject: "Asset Library is live — everything you've made, in one place",
  blocks: [
    {
      t: "banner",
      image:
        "https://assets.presslogic.com/aigc/tasks/images/11fb762a-09f0-477c-a759-b9e4b72b65c8/2026-08-18/5cfa4dc0-8668-4d37-828c-2e1e439d0994.png",
      alt: "Asset Library",
    },
    { t: "kicker", text: "Product update" },
    { t: "h", text: "Everything you've made, now in one place" },
    { t: "p", text: "Asset Library is here. Everything you generate — and everything you upload — now lives in one place, ready to pull into a Marketing Agent chat or a Canvas without uploading it again." },
    {
      t: "section",
      no: "01",
      title: "See all your creations, all together",
      text: "A new entry in your left sidebar. Everything you generate lands there automatically, grouped by date. Filter by type, or upload your own references.",
      button: "Try it now",
      href: "https://buzzvideo.ai/assets",
      image:
        "https://assets.presslogic.com/aigc/tasks/images/11fb762a-09f0-477c-a759-b9e4b72b65c8/2026-08-18/33370661-df8a-417e-a94d-d8b389c2078b.png",
    },
    {
      t: "section",
      no: "02",
      title: "Add your assets faster",
      text: "Pull any asset straight into a Marketing Agent chat or onto a Canvas as a reference. Open one to see the model and settings behind it, regenerate it, or multi-select and download a batch.",
      button: "Open Assets",
      href: "https://buzzvideo.ai/assets",
      image:
        "https://assets.presslogic.com/aigc/tasks/images/11fb762a-09f0-477c-a759-b9e4b72b65c8/2026-08-18/f582deef-1837-4b46-ac31-f70fecef18b8.png",
    },
    { t: "p", text: "Nothing to set up — your past generations are already there, on every plan including Free." },
    { t: "signoff", line: "Happy creating,", team: "The BuzzVideo Team" },
    { t: "hr" },
    { t: "p", text: "Any questions? Just write to info@buzzvideo.ai — we read every message." },
  ],
};
