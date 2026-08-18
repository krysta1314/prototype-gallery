import type { Template } from "../types";

export const TEMPLATE: Template = {
  id: "seed-audio-launch",
  name: "Seed-Audio 1.0 · 正式上线",
  category: "产品与发布",
  tone: "normal",
  trigger: "Seed-Audio 1.0 开放当天群发,面向全量注册用户",
  to: "全量注册用户",
  subject: "Seed-Audio 1.0 is live — turn any script into a voiceover",
  blocks: [
    {
      t: "banner",
      image:
        "https://assets.presslogic.com/aigc/tasks/images/11fb762a-09f0-477c-a759-b9e4b72b65c8/2026-08-18/b8dc4ece-d87d-485c-9089-7d982257a525.png",
      alt: "Seed-Audio 1.0",
    },
    { t: "h", text: "BuzzVideo now generates audio — meet Seed-Audio 1.0" },
    { t: "p", text: "Seed-Audio 1.0 turns text, an image or an existing clip into sound — and can clone a voice you want to keep using." },
    {
      t: "section",
      no: "01",
      title: "Text, image or audio in — sound out",
      text: "Start from a script, an image or an audio clip you already have. Pick from the voice library or clone a voice of your own, set speed, pitch and volume, then export as MP3 or WAV — with subtitles if you want a timed transcript.",
      button: "Try it now",
      image:
        "https://assets.presslogic.com/aigc/tasks/images/11fb762a-09f0-477c-a759-b9e4b72b65c8/2026-08-18/5664cc7a-4278-4e3b-8f03-e6d047b378e3.png",
    },
    {
      t: "section",
      no: "02",
      title: "Clone a voice and keep using it",
      text: "Upload a short sample and Seed-Audio 1.0 learns the voice. Save it to your library and every later generation can speak in it — one voice across a whole campaign.",
      button: "Try it now",
      image:
        "https://assets.presslogic.com/aigc/tasks/images/11fb762a-09f0-477c-a759-b9e4b72b65c8/2026-08-18/7a4c6a44-1169-4135-a860-8bbcaae84db0.png",
    },
    { t: "p", text: "Ten ad variants or one client concept — your first voiceover is one line away." },
    { t: "signoff", line: "Happy creating,", team: "The BuzzVideo Team" },
    { t: "hr" },
    { t: "p", text: "Any questions? Just write to info@buzzvideo.ai — we read every message." },
  ],
};
