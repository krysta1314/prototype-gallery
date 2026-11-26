// 教程中心内容(v1.14,2026-11-26)。格式同 v1.13 learn/content.ts 的 Guide,用同一个 GuidePage 模板渲染。
// slug 不带前缀，网址是 /tutorials/<slug>。视频位：先用站内现有成片(media),发布到 YouTube 后把链接填进 YOUTUBE。
//
// 写法：教程偏「在 BuzzVideo 里一步步点哪里、选什么设置」,和 learn 里的 how-to 页(讲方法)互补，related 里互链。
// 事实来源(只写这些地方核实过的):
//   - 菜单 / 按钮 / 素材位叫法:v1.12 ai-tools sidebarMenus.ts(Video → Image to Video / URL to Video / Video Edit;Avatar → UGC Avatar / Talking Avatar)、
//     v1.12 video-gen-modes capabilities.ts(Omni Reference / First & Last Frame / Keyframes / Edit Video / Extend Video)、Slots.tsx(Start frame / End frame /
//     URL / Doc / Reference / Element)、BarMenus.tsx(Model Settings:Aspect Ratio / Duration / Resolution / With Audio / Number of videos)、
//     AgentPlan.tsx(Change → Regenerate)、model-tools/specs.ts(Talking Avatar:Photo / Voice Audio / Read the Speech First)、canvasTools.ts(节点工具栏)。
//   - 模型参数:v1.13 site/models/model-facts.ts;编辑 / 首尾帧 / 关键帧各模型支持情况:capabilities.ts。
//   - 套餐口径:docs/research/keywords/2026-11-25-geo-writing-rules.md、site/free/company.ts。
//   - MCP 连接方式:learn/content.ts「can-claude-make-videos」、tools/content/agent.ts、v1.12 mcp/skills/data.ts。
// 不写积分数字(生成前产品里会显示),不换算美元。
import type { Guide } from "../../../(v1.13)/site/learn/content";
import { SIGNUP_CREDITS } from "../../../(v1.13)/site/tools/credits";

const NO_FREE_VIDEO = `Video models on BuzzVideo need a Starter, Pro or Ultra plan. The ${SIGNUP_CREDITS} free credits new accounts get work on Seedream 4.5, Seedream 5.0 lite (images) and Seed Audio 1.0 (voice and music).`;
const MCP_URL = "https://mcp.buzzvideo.ai/mcp";

export const TUTORIALS: Guide[] = [
  /* ───────────── 1. Marketing Agent ───────────── */
  {
    slug: "marketing-agent",
    group: "How-to guides",
    title: "How to Make Ads with the Marketing Agent | BuzzVideo",
    description: "BuzzVideo Marketing Agent tutorial: write the brief, add a product photo or link, review the plan it shows, then get video and image ads in one chat.",
    h1: "How to make ads with the BuzzVideo Marketing Agent",
    answer:
      "Open the Marketing Agent, describe your product and the ads you want in plain words, add a product photo or a product page link, then confirm the plan it shows. The agent breaks the job into steps, picks a model for each one and returns ad copy, image ads and video ads in the same chat. A short brief is enough to start.",
    card: "Brief the agent, confirm its plan, get video and image ads.",
    media: { from: "video", match: "product commercial made from photos", caption: "A product ad made on BuzzVideo from one product photo." },
    sections: [
      {
        id: "before-you-start",
        h2: "What do you need before you start?",
        blocks: [
          {
            kind: "ul",
            items: [
              "A BuzzVideo account. Creating one is free, and the Marketing Agent is included on every plan.",
              "A brief in plain words: what the product is, who it is for, where the ads will run and how many you want.",
              "A product photo or a product page link, if you have one. The upload box takes images, videos, PDFs and audio.",
              "A Starter, Pro or Ultra plan if you want video ads. Image ads and voiceovers can run on free credits.",
            ],
          },
          { kind: "note", text: NO_FREE_VIDEO },
        ],
      },
      {
        id: "write-the-brief",
        h2: "How do you write a brief the agent can act on?",
        blocks: [
          { kind: "p", text: "Say the goal, the formats and the count in one or two sentences. The Marketing Agent has marketing and advertising know-how built in, so it works out the strategy and messaging from there. A brief that works: \"Plan a launch campaign for my vitamin C serum and make 3 video ads for TikTok and Reels, plus matching image ads in 1:1.\"" },
          {
            kind: "table",
            head: ["Put this in the brief", "Example", "Why it helps"],
            rows: [
              ["The product and one key benefit", "A vitamin C serum that absorbs in seconds", "The agent builds the hook and copy around it"],
              ["Where the ads run", "TikTok and Reels", "It sets the aspect ratio, such as 9:16"],
              ["How many, and which kind", "3 video ads plus image ads in 1:1", "One request returns the whole set"],
              ["What must not change", "Keep the label exactly as in my photo", "The product photo is used as the reference"],
            ],
          },
          { kind: "media", media: { from: "image", match: "Static ad for LUMEA vitamin C serum", caption: "An image ad for a serum generated on BuzzVideo with Nano Banana 2.1. The agent can return image ads like this next to the videos." } },
        ],
      },
      {
        id: "read-the-plan",
        h2: "What does the plan show, and what can you change?",
        blocks: [
          { kind: "p", text: "Before it generates anything or spends credits, the agent shows a plan. For a video step, the plan names the model, the input mode and the reason it chose them." },
          {
            kind: "ol",
            items: [
              "Read each step of the plan and the credit total.",
              "Click Change on a video plan to pick a different model or input mode, then Regenerate.",
              "Use Edit in canvas on a phase if you want to adjust that step by hand on [Canvas](/canvas).",
              "Confirm the plan to start generating.",
            ],
          },
          { kind: "p", text: "After the first results arrive, keep working in the same chat: ask for more hooks, another size or a different angle. Every project and creation stays in your sidebar, where you can filter by type." },
        ],
      },
      {
        id: "models-and-settings",
        h2: "Which model and settings should you pick?",
        blocks: [
          { kind: "p", text: "You don't have to pick one. The agent chooses a model for each step and tells you why. If you want to override it, these are the video models it most often uses for ads:" },
          {
            kind: "table",
            head: ["Model", "Clip length", "Resolution", "Good for"],
            rows: [
              ["Kling 4.0", "3 to 30 seconds", "720p, 1080p", "Long single takes with the voice generated alongside the picture"],
              ["Seedance 2.5", "4 to 30 seconds", "480p, 720p, 1080p", "Premium product shots, with up to 30 reference images"],
              ["Wan 3.0", "2 to 30 seconds", "480p, 720p, 1080p", "Ads made from a product page link or a document"],
              ["MiniMax H3", "5 to 15 seconds", "768P, 2K, 4K", "The same character across several clips"],
            ],
          },
          { kind: "p", text: "For social placements, ask for 9:16. Kling 4.0 also outputs 16:9, 1:1 and 21:9, and Seedance 2.5 adds 3:4 and 4:3." },
        ],
      },
      {
        id: "fix-problems",
        h2: "How do you fix common problems?",
        blocks: [
          {
            kind: "table",
            head: ["Problem", "Fix"],
            rows: [
              ["The plan is too big for a first test", "Ask for one video and one image first, then scale the winner in the same chat"],
              ["The label or packaging looks wrong", "Upload a sharp, front-on product photo and say \"keep the label exactly the same\""],
              ["The model isn't the one you wanted", "Click Change on the plan, pick the model and input mode, then Regenerate"],
              ["The ad says something you can't claim", "Paste the exact lines in quotes so the agent doesn't write its own claims"],
              ["You only need one clip, not a campaign", "Switch the creation type to Video Gen and prompt the model directly"],
            ],
          },
        ],
      },
    ],
    buzz: {
      title: "How to do it on BuzzVideo",
      steps: ["Open the Marketing Agent and describe your product and the ads you want.", "Add a product photo or a product page link.", "Review the plan, change a model if you need to, then confirm.", "Ask for more hooks, sizes or angles in the same chat."],
      cta: { label: "Open the Marketing Agent", href: "/marketing-agent" },
      note: NO_FREE_VIDEO,
    },
    faq: [
      { q: "Does the Marketing Agent spend credits without asking?", a: "No. It shows its plan first and waits for you to confirm before it generates anything or spends credits." },
      { q: "Can I choose the model myself?", a: "Yes. The plan shows the model and input mode the agent chose and why. Click Change to pick another one, then Regenerate." },
      { q: "What can I upload with my brief?", a: "Images, videos, PDFs and audio, plus a product page link pasted into the brief. A plain-words description on its own is also enough." },
      { q: "Is the Marketing Agent free?", a: `The agent itself is included on every plan, including Free. Video ads need a Starter, Pro or Ultra plan. The ${SIGNUP_CREDITS} free credits new accounts get work on Seedream 4.5 and Seedream 5.0 lite images and Seed Audio 1.0 voiceovers.` },
      { q: "How is the Marketing Agent different from Video Gen?", a: "Video Gen makes one clip from your prompt with the model you pick. The Marketing Agent starts from a goal, works out what to make and picks the models, so one request can return copy, images and videos." },
      { q: "Where do the ads go after they are generated?", a: "Into your BuzzVideo account. Every project and creation stays in your sidebar, where you can filter by type." },
    ],
    sources: [],
    related: ["/marketing-agent", "/ai-ad-generator", "/make-ugc-ads-with-ai", "/write-a-good-hook", "/canvas"],
    howto: {
      name: "How to make ads with the BuzzVideo Marketing Agent",
      steps: [
        "Open the Marketing Agent in BuzzVideo.",
        "Describe your product, the audience and the ads you want.",
        "Upload a product photo or paste a product page link.",
        "Review the plan: the model, the input mode and the reason for each step.",
        "Change a model or input mode if you need to, then confirm the plan.",
        "Ask for more hooks, sizes or angles in the same chat.",
      ],
    },
  },

  /* ───────────── 2. URL to Video ───────────── */
  {
    slug: "url-to-video",
    group: "How-to guides",
    title: "How to Turn a Product Link into a Video Ad | BuzzVideo",
    description: "URL to video tutorial: paste a product page link into the URL / Doc slot, pick length and aspect ratio, and Wan 3.0 turns the page into a video ad.",
    h1: "How to turn a product link into a video ad",
    answer:
      "Open URL to Video in BuzzVideo, paste a public product page link into the URL / Doc slot, pick the length and aspect ratio, and generate. Wan 3.0 reads the page, picks the selling points and returns a 2 to 30 second ad with sound. You need the link and a Starter, Pro or Ultra plan, and there is no script to write.",
    card: "Paste a product page link and get a vertical video ad.",
    media: { from: "video", match: "product page link", caption: "A vertical ad for a wireless charging stand, made from its product page link." },
    sections: [
      {
        id: "before-you-start",
        h2: "What do you need before you start?",
        blocks: [
          {
            kind: "ul",
            items: [
              "A public product page or landing page link. Pages behind a login can't be read.",
              "Or a document instead of a link: a PDF, Word or TXT file.",
              "Optional: your own product photos. Next to the link, Wan 3.0 takes up to 10 reference images.",
              "A Starter, Pro or Ultra plan, because Wan 3.0 is a video model.",
            ],
          },
        ],
      },
      {
        id: "paste-the-link",
        h2: "Where do you paste the link?",
        blocks: [
          { kind: "p", text: "URL to Video sits in the Video menu of the sidebar. It opens Video Gen with Wan 3.0 and the Omni Reference input mode already selected, because Wan 3.0 is the model that reads web pages and documents." },
          {
            kind: "ol",
            items: [
              "In the sidebar, open Video and choose URL to Video.",
              "Click the URL / Doc slot next to the prompt box.",
              "Choose Web page and paste the link, or choose Document and upload a PDF, Word or TXT file.",
              "Edit the pre-filled prompt: \"A 15s vertical ad from the page I added: hook in 2s, top 3 selling points, end on the product with Shop now.\"",
              "Add product photos to the Reference slot if the page images are small or cluttered.",
            ],
          },
          { kind: "media", media: { from: "video", match: "sage-green headphones", caption: "A vertical product demo with a voiceover, generated with Wan 3.0." } },
        ],
      },
      {
        id: "models-and-settings",
        h2: "Which model and settings should you pick?",
        blocks: [
          { kind: "p", text: "Keep Wan 3.0 and Omni Reference, then open Model Settings for the rest:" },
          {
            kind: "table",
            head: ["Setting", "Options on Wan 3.0", "What to pick for an ad"],
            rows: [
              ["Aspect Ratio", "Auto, 9:16, 16:9, 1:1, 3:4, 4:3", "9:16 for TikTok, Reels and Shorts"],
              ["Duration", "2 to 30 seconds", "Around 15 seconds for a hook, three selling points and a call to action"],
              ["Resolution", "480p, 720p, 1080p", "A lower resolution for a test, 1080p for the final"],
              ["With Audio", "On or off", "On for native sound; off if you will add your own voiceover"],
            ],
          },
          { kind: "p", text: "You see the credit price for your settings before you generate." },
        ],
      },
      {
        id: "other-ways",
        h2: "What are the other ways to make an ad from a link?",
        blocks: [
          {
            kind: "table",
            head: ["Way", "What you get", "Use it when"],
            rows: [
              ["URL to Video (this tutorial)", "One clip made straight from the page with Wan 3.0", "You want a quick first cut for one product"],
              ["[Marketing Agent](/marketing-agent)", "A script plus video and image ads in several sizes", "You want a full set for a campaign"],
              ["Link to Ad, an MCP Skill", "Three ad angles as images and short videos, made from ChatGPT or Claude", "You already work in an AI chat"],
            ],
          },
        ],
      },
      {
        id: "fix-problems",
        h2: "How do you fix common problems?",
        blocks: [
          {
            kind: "table",
            head: ["Problem", "Fix"],
            rows: [
              ["The page can't be read", "Check that the link opens without a login, or upload the content as a document"],
              ["The ad leads with the wrong selling points", "Name the three points to lead with in the prompt"],
              ["The product looks different from the real one", "Add clear product photos to the Reference slot"],
              ["The clip feels rushed", "Raise the duration, or cut the prompt to one hook and two points"],
              ["You need cuts, captions or a new voiceover", "Open the result in Canvas and finish it there"],
            ],
          },
        ],
      },
    ],
    buzz: {
      title: "How to do it on BuzzVideo",
      steps: ["Open Video, then URL to Video.", "Paste the product page link in the URL / Doc slot.", "Set the duration and aspect ratio in Model Settings.", "Check the credit price and generate."],
      cta: { label: "Try URL to Video", href: "/url-to-video" },
      note: "URL to Video runs on Wan 3.0, a video model, so it needs a Starter, Pro or Ultra plan.",
    },
    faq: [
      { q: "What kinds of links work?", a: "Public product pages, landing pages and documents. The page has to open without a login. Documents can be PDF, Word or TXT files." },
      { q: "How long can the video be?", a: "From 2 to 30 seconds in one clip. Wan 3.0 generates at 480p, 720p or 1080p." },
      { q: "Does URL to Video download the video from a page?", a: "No. It does not convert or download an existing video. It reads the page's text and images and makes a new video ad from them." },
      { q: "Can I add my own product photos as well as the link?", a: "Yes. In Omni Reference, Wan 3.0 takes up to 10 reference images, 5 videos and 5 audio clips next to the link." },
      { q: "Is URL to Video free?", a: "Not for video. URL to Video runs on Wan 3.0, which needs a Starter, Pro or Ultra plan. You see the credit price before you generate." },
      { q: "Can ChatGPT or Claude turn a link into a video?", a: "Yes, with BuzzVideo MCP connected. Share the product page link in the chat and ask for an ad. The video is generated on your BuzzVideo plan and saved to your library." },
    ],
    sources: [],
    related: ["/url-to-video", "/wan-3-0", "/ai-ad-generator", "/ai-product-video-generator", "/add-video-to-shopify-product-page"],
    howto: {
      name: "How to turn a product link into a video ad",
      steps: [
        "Open Video in the BuzzVideo sidebar and choose URL to Video.",
        "Paste your public product page link in the URL / Doc slot.",
        "Edit the prompt to name the hook and the selling points to lead with.",
        "Set the aspect ratio, duration and resolution in Model Settings.",
        "Check the credit price and generate.",
        "Review the clip, then finish cuts and captions in Canvas.",
      ],
    },
  },

  /* ───────────── 3. AI UGC video ───────────── */
  {
    slug: "ai-ugc-video",
    group: "How-to guides",
    title: "How to Make an AI UGC Video Ad, Step by Step | BuzzVideo",
    description: "AI UGC video tutorial: start from UGC Avatar, upload one product photo, describe the creator and hook, confirm the plan and get a 9:16 creator-style ad.",
    h1: "How to make an AI UGC video ad",
    answer:
      "Open UGC Avatar in BuzzVideo, upload one clear product photo, describe the creator and the hook, and confirm the plan. BuzzVideo writes the script, generates the person talking to camera with your product and adds the voice, in 9:16 for TikTok and Reels. You need one product photo and a Starter, Pro or Ultra plan.",
    card: "One product photo in, a creator-style 9:16 ad out.",
    media: { from: "video", match: "UGC selfie video of a woman reviewing", caption: "A UGC selfie review of a vitamin C serum, generated with Seedance 2.5." },
    sections: [
      {
        id: "before-you-start",
        h2: "What do you need before you start?",
        blocks: [
          {
            kind: "ul",
            items: [
              "One sharp product photo with a readable label. A front view works best.",
              "A short idea of who is talking: age range, style and where they are filming.",
              "A hook, or let the agent write three to test. See [How to write a good hook](/write-a-good-hook).",
              "A Starter, Pro or Ultra plan. UGC clips use video models.",
            ],
          },
        ],
      },
      {
        id: "where-to-start",
        h2: "Where do you start in BuzzVideo?",
        blocks: [
          { kind: "p", text: "UGC Avatar is the first item in the Avatar menu. It opens the Marketing Agent with a prompt you can edit, so the agent handles the script, the person, the product shots and the voice." },
          {
            kind: "ol",
            items: [
              "In the sidebar, open Avatar and choose UGC Avatar.",
              "Upload your product photo.",
              "Edit the pre-filled prompt: \"A 15s UGC video of a woman in her 20s talking to camera about my product, ending with Shop now.\"",
              "Add the exact lines in quotes if the wording matters, or ask the agent to write the script.",
              "Read the plan, change the model if you want to, and confirm.",
            ],
          },
          { kind: "media", media: { from: "video", match: "creator-style product review", caption: "An 8-second creator-style product review made from one product photo." } },
        ],
      },
      {
        id: "models-and-settings",
        h2: "Which model and settings should you pick?",
        blocks: [
          {
            kind: "table",
            head: ["Model", "Clip length", "Resolution", "Why use it for UGC"],
            rows: [
              ["Kling 4.0", "3 to 30 seconds", "720p, 1080p", "Up to 30 seconds in one take, so the face has fewer cuts to change across. Speech is generated with the video."],
              ["Seedance 2.5", "4 to 30 seconds", "480p, 720p, 1080p", "Premium product shots, with up to 30 reference images"],
              ["MiniMax H3", "5 to 15 seconds", "768P, 2K, 4K", "Native audio and lip sync, and the same character across several clips"],
            ],
          },
          { kind: "p", text: "Pick 9:16 for TikTok Shop, Reels and Shorts. To voice a script separately, Seed Audio 1.0 reads it in a preset voice or a cloned voice you own, in 21 languages." },
        ],
      },
      {
        id: "hook-variations",
        h2: "How do you get hook variations to test?",
        blocks: [
          { kind: "p", text: "Stay in the same chat and ask for versions that change one thing. Keep the product photo, the script body and the call to action, and change the hook line, the person or the setting. Because every version starts from the same product photo, the label and shape stay the same." },
          {
            kind: "ul",
            items: [
              "\"Make three versions with different hooks. Keep everything else the same.\"",
              "\"Same script, but a man in his 30s filming in his car.\"",
              "\"Remake the winner in Spanish with a different creator.\"",
            ],
          },
          { kind: "media", media: { from: "video", match: "Hook B", caption: "One hook from a set of variations for the same serum ad, generated with Wan 3.0 Prime." } },
          { kind: "p", text: "For the method behind the test, see [How do I make UGC ads with AI?](/make-ugc-ads-with-ai)." },
        ],
      },
      {
        id: "fix-problems",
        h2: "How do you fix common problems?",
        blocks: [
          {
            kind: "table",
            head: ["Problem", "Fix"],
            rows: [
              ["The label is wrong or blurry", "Use a sharper, front-on product photo and check every frame before you publish"],
              ["The face changes between shots", "Ask for a single take, or pick Kling 4.0, which holds one take for up to 30 seconds"],
              ["The creator says a claim you didn't write", "Put the exact lines in quotes in the prompt"],
              ["The hook only works with sound on", "Add short on-screen text so the opening reads with the sound off"],
              ["The person looks like a real customer giving a review", "Don't script personal results, and label the ad as AI-generated where the platform requires it"],
            ],
          },
        ],
      },
    ],
    buzz: {
      title: "How to do it on BuzzVideo",
      steps: ["Open Avatar, then UGC Avatar.", "Upload one product photo and edit the prompt.", "Confirm the plan to generate the 9:16 video.", "Ask for hook variations in the same chat."],
      cta: { label: "Make a UGC video", href: "/ai-ugc-video-generator" },
      note: NO_FREE_VIDEO,
    },
    faq: [
      { q: "How long can an AI UGC video be?", a: "Up to 30 seconds in a single take. Kling 4.0 makes 3 to 30 second clips, Seedance 2.5 makes 4 to 30 seconds and MiniMax H3 runs 5 to 15 seconds." },
      { q: "Can the AI creator speak my script?", a: "Yes. Paste your script or let the agent write it. Kling 4.0 and MiniMax H3 generate the speech with the video, and Seed Audio 1.0 can voice it in a preset voice or your own cloned voice." },
      { q: "Can I choose what the AI creator looks like?", a: "Yes. Describe the age range, look and setting in the prompt, or add reference images. Kling 4.0 takes up to 10 and Seedance 2.5 up to 30." },
      { q: "Can I make an AI UGC video for free?", a: `Not the video. UGC clips use Kling 4.0, Seedance 2.5 and MiniMax H3, which need a Starter, Pro or Ultra plan. You can voice a UGC script with Seed Audio 1.0 on the ${SIGNUP_CREDITS} free credits new accounts get.` },
      { q: "Do I need to disclose that the creator is AI?", a: "TikTok requires AI-generated ad content to be labeled, so check each platform's ad policy before you run the ad. Don't present an AI person as a real customer giving a real review." },
      { q: "Can I use AI UGC videos commercially?", a: "Yes. Videos generated on BuzzVideo can be used commercially on every plan." },
    ],
    sources: [],
    related: ["/ai-ugc-video-generator", "/make-ugc-ads-with-ai", "/write-a-good-hook", "/do-ugc-ads-work", "/ai-spokesperson"],
    howto: {
      name: "How to make an AI UGC video ad",
      steps: [
        "Open Avatar in the BuzzVideo sidebar and choose UGC Avatar.",
        "Upload one sharp product photo with a readable label.",
        "Describe the creator, the setting and the hook in the prompt.",
        "Review the plan and pick the model you want.",
        "Confirm the plan to generate the 9:16 video.",
        "Check every frame, then ask for hook variations in the same chat.",
      ],
    },
  },

  /* ───────────── 4. Product video from one photo ───────────── */
  {
    slug: "product-video-from-photo",
    group: "How-to guides",
    title: "How to Make a Product Video from One Photo | BuzzVideo",
    description: "Product video tutorial: upload one front-on product photo, write the shot in one line and get unboxings, demos and hero shots in 9:16 and 16:9.",
    h1: "How to make a product video from one photo",
    answer:
      "Upload one front-on product photo to the Marketing Agent, write the shot you want in one line, such as an unboxing or a hero close-up, and confirm the plan. BuzzVideo uses the photo as a reference so the label and shape stay the same, and returns 9:16 for social and 16:9 for your product page. You need the photo and a Starter, Pro or Ultra plan.",
    card: "Unboxings, demos and hero shots from a single product photo.",
    media: { from: "video", match: "unboxing video made from one product photo", caption: "A 15-second unboxing video made from one product photo." },
    sections: [
      {
        id: "before-you-start",
        h2: "What do you need before you start?",
        blocks: [
          {
            kind: "ul",
            items: [
              "One front-on product photo with a readable label, on a clean background if you have one.",
              "More angles if you want a 3D turnaround.",
              "One line that says the shot: what happens, and where the clip ends.",
              "A Starter, Pro or Ultra plan for video.",
            ],
          },
          { kind: "media", media: { from: "image", match: "Studio packshot of a BRIVO", caption: "A clean, front-on packshot like this one makes a good input photo: the label is sharp and nothing covers the product." } },
        ],
      },
      {
        id: "write-the-shot",
        h2: "How do you describe the shot you want?",
        blocks: [
          { kind: "p", text: "Write one shot per request. Say the length, what happens and what the last frame is. The agent picks the video model by shot type, and you can change it on the plan." },
          {
            kind: "table",
            head: ["Shot", "One-line prompt", "Model that suits it"],
            rows: [
              ["Unboxing", "A 15s unboxing video of my product: hands open the box, slow close-up on the label, end on the product.", "Kling 4.0, for a continuous take with sound"],
              ["Hero close-up", "A 6s hero shot of my product on wet black stone, slow push-in, soft rim light.", "Seedance 2.5, for premium product shots"],
              ["In-use demo", "A 20s demo: a hand picks up my product, uses it at a kitchen counter, sets it down label forward.", "Wan 3.0, for long demos on a budget"],
              ["3D turnaround", "A 3D turnaround of my product on a white background, one full rotation.", "Add more angles of the product as references"],
            ],
          },
          { kind: "media", media: { from: "video", match: "3D product turnaround", caption: "A 3D product turnaround made from product photos." } },
        ],
      },
      {
        id: "models-and-settings",
        h2: "Which model and settings should you pick?",
        blocks: [
          {
            kind: "table",
            head: ["Model", "Clip length", "Resolution", "Reference images", "Good for"],
            rows: [
              ["Seedance 2.5", "4 to 30 seconds", "480p, 720p, 1080p", "Up to 30", "Premium hero shots"],
              ["Kling 4.0", "3 to 30 seconds", "720p, 1080p", "Up to 10", "Continuous takes with sound"],
              ["Wan 3.0", "2 to 30 seconds", "480p, 720p, 1080p", "Up to 10", "Long demos on a budget"],
            ],
          },
          { kind: "p", text: "All three output 9:16, 16:9 and 1:1. Ask for 9:16 for TikTok and Reels and 16:9 for Shopify and Amazon product pages. You can get both from the same run." },
          { kind: "note", text: `No paid plan yet? With the ${SIGNUP_CREDITS} free credits new accounts get, you can make still product shots on Seedream 4.5 or Seedream 5.0 lite and use them as first frames later.` },
        ],
      },
      {
        id: "fix-problems",
        h2: "How do you fix common problems?",
        blocks: [
          {
            kind: "table",
            head: ["Problem", "Fix"],
            rows: [
              ["Small label text is wrong", "Use a sharper photo, ask for a close-up on the label and check the text before you publish"],
              ["The product changes shape when it turns", "Add photos from more angles as references"],
              ["Too much happens in one clip", "Split it into one shot per request, then join the clips in Canvas"],
              ["You need a different size", "Ask for 16:9 or 1:1 of the same shot in the same chat"],
              ["You want to animate the exact photo", "Use it as the Start frame instead. See [How to turn an image into a video](/image-to-video)."],
            ],
          },
        ],
      },
    ],
    buzz: {
      title: "How to do it on BuzzVideo",
      steps: ["Open the Marketing Agent and upload a front-on product photo.", "Write the shot in one line: unboxing, demo or hero close-up.", "Confirm the plan and generate.", "Ask for 9:16 and 16:9 of the same shot."],
      cta: { label: "Make a product video", href: "/ai-product-video-generator" },
      note: NO_FREE_VIDEO,
    },
    faq: [
      { q: "Can AI make a product video from one image?", a: "Yes. Upload the product photo and describe the shot. Seedance 2.5 and Kling 4.0 animate it while keeping the label and shape from your photo." },
      { q: "Will my product look the same as in my photo?", a: "Yes in most cases, because the photo is used as a reference in every shot. Add more angles for turnarounds and check small label text before you publish." },
      { q: "What kinds of product videos can I make?", a: "Unboxings, hero close-ups, in-use demos, 3D turnarounds and a person holding the product. Write the shot in one line." },
      { q: "What sizes and resolution can I get?", a: "Up to 1080p on Seedance 2.5, Kling 4.0 and Wan 3.0. All three output 9:16 for social, 16:9 for product pages and 1:1." },
      { q: "Is there a free way to make a product video?", a: `Not for video. Seedance 2.5, Kling 4.0 and Wan 3.0 need a Starter, Pro or Ultra plan. The ${SIGNUP_CREDITS} free credits new accounts get can make still product shots on Seedream 4.5 or Seedream 5.0 lite.` },
      { q: "Can I start from a product page link instead of a photo?", a: "Yes. Use URL to Video: paste the link and Wan 3.0 reads the page and makes a short ad from it." },
    ],
    sources: [],
    related: ["/ai-product-video-generator", "/ai-product-photography", "/image-to-video", "/amazon-product-video-length", "/add-video-to-shopify-product-page"],
    howto: {
      name: "How to make a product video from one photo",
      steps: [
        "Open the Marketing Agent in BuzzVideo.",
        "Upload one front-on product photo with a readable label.",
        "Write the shot in one line, such as an unboxing or a hero close-up.",
        "Review the plan and the model it picked for the shot.",
        "Confirm the plan to generate the video.",
        "Ask for 9:16 and 16:9 versions, then check the label in every frame.",
      ],
    },
  },

  /* ───────────── 5. Image to video ───────────── */
  {
    slug: "image-to-video",
    group: "How-to guides",
    title: "How to Turn an Image into a Video with AI | BuzzVideo",
    description: "Image to video tutorial: set your photo as the Start frame, describe the motion, choose duration and resolution, and generate with Seedance or Kling.",
    h1: "How to turn an image into a video",
    answer:
      "Open Image to Video in BuzzVideo, add your photo as the Start frame, describe the camera move and what moves in the scene, then pick the duration and resolution and generate. The image becomes the first frame, so the product, person or scene stays the same. You need one sharp image and a Starter, Pro or Ultra plan.",
    card: "Set a photo as the Start frame and describe the motion.",
    media: { from: "video", match: "Flower shop time-lapse", caption: "A flower shop going from day to rainy night, made from a first and last frame with MiniMax H3 Max." },
    sections: [
      {
        id: "before-you-start",
        h2: "What do you need before you start?",
        blocks: [
          {
            kind: "ul",
            items: [
              "One sharp image. For products, a clean front view keeps the label readable.",
              "A sentence about the motion: the camera move, what moves in the scene and how long.",
              "Optional: a second image for the last frame, if you want to control where the clip lands.",
              "A Starter, Pro or Ultra plan. You can make the starting image itself on free credits.",
            ],
          },
        ],
      },
      {
        id: "set-the-frames",
        h2: "How do you add the image and describe the motion?",
        blocks: [
          {
            kind: "ol",
            items: [
              "In the sidebar, open Video and choose Image to Video. It opens Video Gen with a prompt you can edit.",
              "Set the input mode to First & Last Frame.",
              "Click the Start frame slot and add your image from Local Upload or from your Assets.",
              "Optional: add a second image to the End frame slot.",
              "Describe the motion, for example: \"Animate my product image into a 5s vertical clip with a slow push-in.\"",
            ],
          },
          { kind: "p", text: "A motion prompt has three parts: the camera move (push-in, pan, orbit, static), what moves in the scene (steam rises, hair moves, a hand reaches in) and the pace. With both frames set, describe how the start frame turns into the end frame." },
          { kind: "media", media: { from: "image", match: "Petal & Stem flower shop on a Brooklyn street in daylight", caption: "A daytime still of the flower shop. A still like this goes in the Start frame slot." } },
          { kind: "media", media: { from: "image", match: "same flower shop turned into a rainy evening", caption: "The same shop on a rainy evening. In the End frame slot, it tells the model where the clip lands." } },
        ],
      },
      {
        id: "input-modes",
        h2: "Which input mode should you use?",
        blocks: [
          {
            kind: "table",
            head: ["Input mode", "What it does", "Use it when"],
            rows: [
              ["First & Last Frame", "Set the first frame, the last frame, or both", "You want the clip to start exactly on your image"],
              ["Keyframes", "Pin frames along the way between start and end", "You have several stills the clip must pass through. Kling 4.0 takes up to 8 middle frames."],
              ["Omni Reference", "Mix images, videos and audio as references", "The image is a guide for the look, not the exact first frame"],
            ],
          },
        ],
      },
      {
        id: "models-and-settings",
        h2: "Which model and settings should you pick?",
        blocks: [
          {
            kind: "table",
            head: ["Model", "Clip length", "Resolution", "Good for"],
            rows: [
              ["Seedance 2.5", "4 to 30 seconds", "480p, 720p, 1080p", "Product and ad shots. The aspect ratio follows your start frame."],
              ["Kling 4.0", "3 to 30 seconds", "720p, 1080p", "Long takes with sound, plus Keyframes"],
              ["Wan 3.0", "2 to 30 seconds", "480p, 720p, 1080p", "Long clips on a budget"],
              ["MiniMax H3", "5 to 15 seconds", "768P, 2K, 4K", "Sharp output up to 4K"],
            ],
          },
          { kind: "p", text: "Open Model Settings to set Aspect Ratio, Duration and Resolution. On Seedance 2.5 and Wan 3.0 the With Audio switch turns the native sound off. Kling 4.0 and MiniMax H3 always include it." },
        ],
      },
      {
        id: "fix-problems",
        h2: "How do you fix common problems?",
        blocks: [
          {
            kind: "table",
            head: ["Problem", "Fix"],
            rows: [
              ["The subject changes during the clip", "Shorten the clip, simplify the motion and say what must stay the same"],
              ["The clip ends in the wrong place", "Add an End frame so the model knows where to land"],
              ["The image gets cropped", "Make the image in the aspect ratio you want the video in before you upload it"],
              ["The motion is too busy", "Ask for one camera move and one thing moving"],
              ["You don't want the generated sound", "Turn off With Audio on Seedance 2.5 or Wan 3.0, or replace the track in Canvas"],
            ],
          },
        ],
      },
    ],
    buzz: {
      title: "How to do it on BuzzVideo",
      steps: ["Open Video, then Image to Video.", "Add your image to the Start frame slot.", "Describe the camera move and what moves.", "Set the duration and resolution, then generate."],
      cta: { label: "Animate an image", href: "/image-to-video" },
      note: `Animating an image needs a Starter, Pro or Ultra plan. The ${SIGNUP_CREDITS} free credits new accounts get can make the starting image on Seedream 4.5 or Seedream 5.0 lite.`,
    },
    faq: [
      { q: "Which models can turn an image into a video?", a: "Most video models on BuzzVideo take a starting image, including Seedance 2.5, Kling 4.0, Wan 3.0 and MiniMax H3. Many also take an end image so you control where the clip lands." },
      { q: "How long can an image-to-video clip be?", a: "Up to 30 seconds on Seedance 2.5, Kling 4.0 and Wan 3.0, and 5 to 15 seconds on MiniMax H3." },
      { q: "Can I set both the first and the last frame?", a: "Yes. Choose the First & Last Frame input mode, add a Start frame and an End frame, and the model generates the motion between them." },
      { q: "Does the video come with sound?", a: "Yes. The video models generate native audio with the clip. On Seedance 2.5 and Wan 3.0 you can switch it off. Kling 4.0 and MiniMax H3 always include it." },
      { q: "What kind of photo works best?", a: "A sharp photo in the aspect ratio you want the video in. For products, a clean front view keeps the label readable." },
      { q: "Is image to video free on BuzzVideo?", a: `Not for video. Animating a photo needs a Starter, Pro or Ultra plan. The ${SIGNUP_CREDITS} free credits new accounts get can make the starting image on Seedream 4.5 or Seedream 5.0 lite.` },
    ],
    sources: [],
    related: ["/image-to-video", "/text-to-video", "/ai-video-extender", "/kling-4-0", "/ai-product-video-generator"],
    howto: {
      name: "How to turn an image into a video",
      steps: [
        "Open Video in the BuzzVideo sidebar and choose Image to Video.",
        "Set the input mode to First & Last Frame.",
        "Add your image to the Start frame slot.",
        "Add an End frame if you want to control where the clip lands.",
        "Describe the camera move and what moves in the scene.",
        "Set the duration and resolution in Model Settings.",
        "Check the credit price and generate.",
      ],
    },
  },

  /* ───────────── 6. Edit a video with a prompt ───────────── */
  {
    slug: "edit-video-with-a-prompt",
    group: "How-to guides",
    title: "How to Edit a Video with a Text Prompt | BuzzVideo",
    description: "Edit a video with a text prompt: upload the clip in Edit Video mode, say what to change and what to keep, add a reference image and generate the new cut.",
    h1: "How to edit a video with a text prompt",
    answer:
      "Open Video Edit in BuzzVideo, upload the clip, type what to change and what to keep, and generate. Edit Video mode on Seedance 2.5 rebuilds that part of the scene while the people, motion and timing stay the same. You need a clip of 4 to 30 seconds and a Starter, Pro or Ultra plan, and there is no masking or green screen.",
    card: "Swap a background, outfit or object by describing the change.",
    media: { from: "extra", match: "edit-after", caption: "After: one text prompt changed only the coat, from a red trench to a camel wool coat. Her face, the walk, the street and the camera move stayed the same. Edited with Seedance 2.5 on BuzzVideo." },
    sections: [
      {
        id: "before-you-start",
        h2: "What do you need before you start?",
        blocks: [
          {
            kind: "ul",
            items: [
              "The clip you want to change, 4 to 30 seconds long for Seedance 2.5. Split longer footage into parts.",
              "One sentence that says the change, and one that says what must stay the same.",
              "Optional: a reference image of the new background, outfit or product.",
              "A Starter, Pro or Ultra plan.",
            ],
          },
        ],
      },
      {
        id: "upload-and-describe",
        h2: "How do you upload the clip and describe the edit?",
        blocks: [
          {
            kind: "ol",
            items: [
              "In the sidebar, open Video and choose Video Edit. It opens Video Gen in Edit Video mode on Seedance 2.5.",
              "Add your clip to the Edit video slot.",
              "Optional: add an image of the new background or product to the Reference slot.",
              "Edit the pre-filled prompt: \"In my video, replace the background with a beach. Keep the people, motion and timing.\"",
              "Check the credit price and generate. The result is the same length as your source clip.",
            ],
          },
          { kind: "p", text: "Name one change per run. If you need a new background and a new outfit, do the background first, check it, then edit the result again." },
        ],
      },
      {
        id: "prompt-patterns",
        h2: "What does a good edit prompt look like?",
        blocks: [
          {
            kind: "table",
            head: ["Edit", "Prompt"],
            rows: [
              ["Swap the background", "In my video, replace the background with a beach at sunset. Keep the people, motion and timing."],
              ["Change an outfit", "Change her camel coat to a red trench coat. Keep her face, hair, walk and the street the same."],
              ["Remove an object", "Remove the logo on the cup. Keep the hands, the motion and the timing the same."],
              ["Swap a product", "Replace the can she is holding with the can in my reference image. Keep everything else the same."],
              ["Make a seasonal version", "Put the same scene in a living room with a Christmas tree. Keep the people and their motion."],
            ],
          },
          { kind: "media", media: { from: "extra", match: "edit-before", caption: "Before: the original clip that went into Edit Video. Compare it with the result at the top of this page; only the coat changed." } },
        ],
      },
      {
        id: "models-and-settings",
        h2: "Which model and settings should you pick?",
        blocks: [
          {
            kind: "table",
            head: ["Model", "Source clip", "Reference images", "Notes"],
            rows: [
              ["Seedance 2.5", "4 to 30 seconds", "Yes", "The default for Video Edit. Outputs 480p, 720p or 1080p."],
              ["Kling 4.0", "3 to 30 seconds", "Yes", "Also has an Edit Video mode"],
              ["Seedance 2.0", "2 to 15 seconds", "Yes", "For shorter clips"],
            ],
          },
          { kind: "p", text: "Edit Video changes what is inside the shot. Two other input modes cover nearby jobs: Extend Video keeps a video going from where it ends, and captions and cuts are done in [Canvas](/canvas)." },
        ],
      },
      {
        id: "fix-problems",
        h2: "How do you fix common problems?",
        blocks: [
          {
            kind: "table",
            head: ["Problem", "Fix"],
            rows: [
              ["Too much of the scene changed", "Add a line that lists what must stay: the people, motion, timing and camera"],
              ["The new background isn't the one you had in mind", "Upload an image of it to the Reference slot"],
              ["The clip is longer than 30 seconds", "Split it into parts and edit each one"],
              ["The original sound is gone or different", "Check the audio in the result and add your own voiceover or music in Canvas"],
              ["Faces drift after several edits", "Go back to the original clip and combine the changes into fewer runs"],
            ],
          },
        ],
      },
    ],
    buzz: {
      title: "How to do it on BuzzVideo",
      steps: ["Open Video, then Video Edit.", "Add your clip to the Edit video slot.", "Type the change and what must stay the same.", "Generate, then compare with the original."],
      cta: { label: "Open the AI Video Generator", href: "/ai-video-generator" },
      note: "Edit Video mode runs on video models, so it needs a Starter, Pro or Ultra plan.",
    },
    faq: [
      { q: "How do I edit a video with an AI prompt?", a: "Open Video, choose Video Edit, upload the clip and describe the change. Say what must stay the same, such as the people, motion and timing." },
      { q: "Do I need a green screen or masking?", a: "No. Describe the change and Seedance 2.5 rebuilds that part of the scene, keeping the people and their motion." },
      { q: "How long can the video be?", a: "Seedance 2.5 works with clips from 4 to 30 seconds. Split longer footage into parts." },
      { q: "Can I use a reference image for the edit?", a: "Yes. Add it to the Reference slot, for example the new background or location you want in the shot." },
      { q: "Does the edit keep the original audio?", a: "Not always. Check the sound in the result and add your own voiceover or music in Canvas if needed." },
      { q: "Is editing a video with a prompt free?", a: `No. Edit Video mode runs on video models, which need a Starter, Pro or Ultra plan. The ${SIGNUP_CREDITS} free credits new accounts get cover image edits on Seedream 4.5 and Seedream 5.0 lite, not video.` },
    ],
    sources: [],
    related: ["/remove-object-from-video", "/ai-video-extender", "/ai-video-generator", "/ai-image-editor", "/canvas"],
    howto: {
      name: "How to edit a video with a text prompt",
      steps: [
        "Open Video in the BuzzVideo sidebar and choose Video Edit.",
        "Add your clip to the Edit video slot.",
        "Add a reference image if the edit needs a specific background or product.",
        "Type what to change and what must stay the same.",
        "Check the credit price and generate.",
        "Compare the result with the original, then cut and caption it in Canvas.",
      ],
    },
  },

  /* ───────────── 7. Talking avatar ───────────── */
  {
    slug: "talking-avatar",
    group: "How-to guides",
    title: "How to Make a Talking Avatar Video | BuzzVideo",
    description: "Talking avatar tutorial: upload one photo and a voice track, choose Kling AI Avatar v2 Pro or MiniMax H3 Max, and generate a video up to 15 minutes.",
    h1: "How to make a talking avatar video",
    answer:
      "Open Talking Avatar in BuzzVideo, upload one photo and one voice track, choose a model and click Generate. The photo speaks your audio with matching lip movement, and the video runs as long as the audio: up to 5 minutes with Kling AI Avatar v2 Pro or 15 minutes with MiniMax H3 Max. You need a photo, an audio file and a Starter, Pro or Ultra plan.",
    card: "One photo plus one voice track makes a talking video.",
    media: { from: "extra", match: "avatar-video", caption: "A talking avatar video made on BuzzVideo from one portrait photo and one voiceover track." },
    sections: [
      {
        id: "before-you-start",
        h2: "What do you need before you start?",
        blocks: [
          {
            kind: "ul",
            items: [
              "One clear photo as a JPG, PNG or WEBP, up to 20 MB. Use a photo you have the rights to.",
              "A voice track: the speech as an audio file. The tool takes audio, not a typed script.",
              "A Starter, Pro or Ultra plan for the video.",
            ],
          },
          { kind: "media", media: { from: "extra", match: "avatar-video-photo", caption: "The portrait photo used as the input for the video above. The face is clear, well lit and looks toward the camera." } },
        ],
      },
      {
        id: "make-the-voice",
        h2: "How do you make the voice track?",
        blocks: [
          { kind: "p", text: "Record the speech yourself, or generate it on BuzzVideo first. Open Voiceover in the sidebar and choose AI Voiceover, pick a voice, paste the script and download the audio. Seed Audio 1.0 reads a script in a preset voice or a cloned voice you own, and it works with free credits." },
          { kind: "p", text: "Keep the audio clean. Speech with little background noise gives tighter lip sync. To use your own voice without recording each script, see [How to clone your voice with AI](/clone-your-voice-with-ai)." },
        ],
      },
      {
        id: "upload-and-generate",
        h2: "How do you upload the photo and audio?",
        blocks: [
          {
            kind: "ol",
            items: [
              "In the sidebar, open Avatar and choose Talking Avatar.",
              "Add your photo to the Photo slot.",
              "Add your audio file to the Voice Audio slot.",
              "Choose the model: Kling AI Avatar v2 Pro or MiniMax H3 Max.",
              "On Kling, add an optional prompt for the delivery, such as \"energetic, looks at the camera\". On MiniMax H3 Max, pick the resolution.",
              "Click Generate.",
            ],
          },
          { kind: "p", text: "You can also do this on Canvas: select an image node, pick Talking Avatar from the node toolbar, and the result lands on the board as a new video node." },
        ],
      },
      {
        id: "models-and-settings",
        h2: "Which model and settings should you pick?",
        blocks: [
          {
            kind: "table",
            head: ["Model", "Audio length", "Photo can be", "Settings", "Good for"],
            rows: [
              ["Kling AI Avatar v2 Pro", "Up to 5 minutes", "A person, an animal or a cartoon character", "Optional prompt to direct the delivery", "Natural expressions and head movement, mascots and characters"],
              ["MiniMax H3 Max", "5 seconds to 15 minutes", "One clear photo of a person", "480p, 768p, 1080p or 2K, plus Read the Speech First", "Long presenter videos and sharp output up to 2K"],
            ],
          },
          { kind: "p", text: "Read the Speech First is on by default on MiniMax H3 Max. It reads the words before generating, for tighter lip sync. Turn it off for audio with a lot of non-speech sound." },
        ],
      },
      {
        id: "fix-problems",
        h2: "How do you fix common problems?",
        blocks: [
          {
            kind: "table",
            head: ["Problem", "Fix"],
            rows: [
              ["The lips don't match the words", "Use cleaner audio, and keep Read the Speech First on with MiniMax H3 Max"],
              ["The delivery feels flat", "Use Kling AI Avatar v2 Pro and describe the delivery in the prompt"],
              ["The audio is longer than 5 minutes", "Switch to MiniMax H3 Max, which takes audio up to 15 minutes"],
              ["The photo is a cartoon or a pet", "Use Kling AI Avatar v2 Pro. MiniMax H3 Max needs a photo of a person."],
              ["You already have a video and only want new speech", "Use [AI Lip Sync](/ai-lip-sync), which re-syncs the mouth in an existing video"],
            ],
          },
        ],
      },
    ],
    buzz: {
      title: "How to do it on BuzzVideo",
      steps: ["Open Avatar, then Talking Avatar.", "Add one photo and one voice track.", "Choose Kling AI Avatar v2 Pro or MiniMax H3 Max.", "Click Generate."],
      cta: { label: "Make a talking avatar", href: "/talking-avatar" },
      note: `Talking Avatar needs a Starter, Pro or Ultra plan. You can make the voice track with Seed Audio 1.0, which works with the ${SIGNUP_CREDITS} free credits new accounts get.`,
    },
    faq: [
      { q: "How long can a talking avatar video be?", a: "Up to 5 minutes with Kling AI Avatar v2 Pro and up to 15 minutes with MiniMax H3 Max. The video is as long as your audio." },
      { q: "Can I type a script instead of uploading audio?", a: "Not in this tool. Record the speech or make it with AI Voiceover on BuzzVideo, then upload the audio file as the voice track." },
      { q: "Can the avatar be a cartoon or an animal?", a: "Yes, with Kling AI Avatar v2 Pro. MiniMax H3 Max needs one clear photo of a person." },
      { q: "What resolution is the video?", a: "Up to 2K with MiniMax H3 Max, which offers 480p, 768p, 1080p and 2K." },
      { q: "How is a talking avatar different from lip sync?", a: "A talking avatar starts from a still photo and generates the whole video. AI Lip Sync starts from an existing video and re-syncs the mouth to new speech." },
      { q: "Can I make a talking avatar for free?", a: `No, the video needs a Starter, Pro or Ultra plan. You can make the voice track with Seed Audio 1.0 on the ${SIGNUP_CREDITS} free credits new accounts get.` },
    ],
    sources: [],
    related: ["/talking-avatar", "/make-ai-avatar-video", "/ai-lip-sync", "/ai-voice-over", "/clone-your-voice-with-ai"],
    howto: {
      name: "How to make a talking avatar video",
      steps: [
        "Record or generate the speech as an audio file.",
        "Open Avatar in the BuzzVideo sidebar and choose Talking Avatar.",
        "Add one clear photo to the Photo slot.",
        "Add the audio file to the Voice Audio slot.",
        "Choose Kling AI Avatar v2 Pro or MiniMax H3 Max and set its options.",
        "Click Generate.",
      ],
    },
  },

  /* ───────────── 8. Canvas ───────────── */
  {
    slug: "canvas",
    group: "How-to guides",
    title: "How to Build a Workflow on Canvas | BuzzVideo",
    description: "Canvas tutorial: generate images, video and audio as connected nodes, use one shot as the next one's reference, and build a whole ad on one board.",
    h1: "How to build a workflow on Canvas",
    answer:
      "Open Canvas in BuzzVideo, create a project, and generate each shot as a node: an image, a video, a voiceover or music. Use one node as the reference for the next so the shots match, regenerate any node without redoing the rest, then put the clips and audio together. You need a BuzzVideo account, and video nodes need a Starter, Pro or Ultra plan.",
    card: "Build an ad shot by shot with connected nodes on one board.",
    media: { from: "video", match: "Fast-cut vertical ad for the BRIVO can", caption: "A fast-cut vertical ad for a drink can, generated with Kling 4.0. On Canvas, each shot of an ad like this is its own node." },
    sections: [
      {
        id: "before-you-start",
        h2: "What do you need before you start?",
        blocks: [
          {
            kind: "ul",
            items: [
              "A BuzzVideo account. Canvas is part of BuzzVideo, and what you generate on it is billed in credits.",
              "A shot list: three to five shots is enough for a 15-second ad.",
              "A product photo or a character reference, so every shot starts from the same look.",
              "A Starter, Pro or Ultra plan for video nodes. Image and audio nodes can run on free credits.",
            ],
          },
        ],
      },
      {
        id: "nodes",
        h2: "What can each node on Canvas do?",
        blocks: [
          { kind: "p", text: "Every image, clip and audio track on the board is a node. Select a node to see its toolbar, which holds the tools that work on that kind of media. Each result lands on the board as a new node next to its source." },
          {
            kind: "table",
            head: ["Node", "What it makes", "Models you can use", "Tools on its toolbar"],
            rows: [
              ["Image", "Product stills, key frames, character references", "Such as Nano Banana 2.1", "Talking Avatar, Upscale"],
              ["Video", "One shot, up to 30 seconds", "Such as Seedance 2.5 and Kling 4.0", "Lip Sync, Character Swap, Motion Control, 3D to Video, Upscale"],
              ["Voiceover", "A script read in a preset or cloned voice", "Such as Seed Audio 1.0", "Lip Sync, Talking Avatar"],
              ["Music and Sound Effects", "Background music, whooshes and ambience", "The audio models on your account", "Generate more from the same reference"],
            ],
          },
        ],
      },
      {
        id: "build-an-ad",
        h2: "How do you build an ad shot by shot?",
        blocks: [
          {
            kind: "ol",
            items: [
              "Open Canvas from the sidebar and create a new project, or start from a workflow template.",
              "Add an image node and generate the product still that sets the look, for example: \"My product on a rainy night street, close-up, 9:16.\"",
              "Add a video node and use that still as its reference or first frame. Describe the motion: \"slow push-in\".",
              "Add the next video node and use a frame or the clip from the previous one as its reference, so the shots match.",
              "Add a voiceover node for the script and a music node for the bed.",
              "Regenerate any node you don't like. The other nodes stay as they are.",
              "Put the clips and audio together, then add cuts and captions.",
            ],
          },
          { kind: "media", media: { from: "image", match: "Studio packshot of a BRIVO", caption: "A product still generated with Nano Banana 2.1. On Canvas, a still like this is the first node and the reference for the video nodes after it." } },
          { kind: "media", media: { from: "image", match: "same BRIVO can on a striped picnic blanket", caption: "The same can in a second scene. Generating each scene from the same product reference keeps the shots consistent." } },
        ],
      },
      {
        id: "models-and-settings",
        h2: "Which model and settings should you pick?",
        blocks: [
          { kind: "p", text: "Canvas runs the models on your BuzzVideo account, and each node has its own model and settings. A common setup for an ad:" },
          {
            kind: "table",
            head: ["Job", "Model", "Limits", "Why"],
            rows: [
              ["Product stills and key frames", "Nano Banana 2.1", "1K, 2K or 4K, up to 14 reference images", "Keeps the product and character consistent across stills"],
              ["Hero product shots", "Seedance 2.5", "4 to 30 seconds, up to 1080p", "Premium product shots"],
              ["Long takes with sound", "Kling 4.0", "3 to 30 seconds, 720p or 1080p", "Fewer cuts for a face to change across"],
              ["Voiceover and music", "Seed Audio 1.0", "21 languages, MP3 or WAV", "Voice, music and sound effects in one model"],
            ],
          },
          { kind: "p", text: "To compare models, generate the same shot on two video nodes side by side and keep the better one." },
        ],
      },
      {
        id: "from-the-agent",
        h2: "Can you start a Canvas workflow from the Marketing Agent?",
        blocks: [
          { kind: "p", text: "Yes. Each phase of a [Marketing Agent](/marketing-agent) plan has an Edit in canvas button. It opens that step on Canvas with its prompt, model, ratio and references already filled in, so you can adjust one step by hand instead of letting the agent run it." },
        ],
      },
      {
        id: "fix-problems",
        h2: "How do you fix common problems?",
        blocks: [
          {
            kind: "table",
            head: ["Problem", "Fix"],
            rows: [
              ["Shots don't match each other", "Generate every shot from the same product or character reference, and repeat what must stay the same in each prompt"],
              ["One shot is wrong", "Regenerate only that node. The nodes around it don't change."],
              ["The ad needs to be longer than 30 seconds", "Build it from several video nodes. One clip runs up to 30 seconds on Seedance 2.5 or Kling 4.0."],
              ["A clip is too soft for the final", "Run Upscale from the video node's toolbar"],
              ["The voice doesn't match the mouth", "Run Lip Sync from the video node's toolbar with the voiceover node as the speech"],
            ],
          },
        ],
      },
    ],
    buzz: {
      title: "How to do it on BuzzVideo",
      steps: ["Open Canvas and create a project.", "Generate a product still as the first node.", "Add video nodes that use it as their reference.", "Add voiceover and music nodes.", "Regenerate any shot, then put it together."],
      cta: { label: "Open Canvas", href: "/canvas" },
      note: `Canvas itself is part of BuzzVideo. What you generate is billed in credits: the ${SIGNUP_CREDITS} free credits cover Seedream 4.5 and Seedream 5.0 lite images and Seed Audio 1.0, and video models need a Starter, Pro or Ultra plan.`,
    },
    faq: [
      { q: "What can I make on Canvas?", a: "Images, video clips, voiceovers, music and sound effects, all on one board and from one BuzzVideo account." },
      { q: "How is Canvas different from Video Gen?", a: "Video Gen makes one clip from one prompt. Canvas keeps every image, clip and audio track of a project on one board, so one shot can be the reference for the next." },
      { q: "Which tools can I run on a Canvas node?", a: "On a video node: Motion Control, Lip Sync, 3D to Video and Upscale. On an image node: Talking Avatar and Upscale. Each result lands on the board as a new node." },
      { q: "How long can a clip on Canvas be?", a: "Up to 30 seconds per clip with Seedance 2.5 or Kling 4.0. Longer ads are built from several shots on the board." },
      { q: "Can I add a voiceover and captions in Canvas?", a: "Yes. Make the voiceover or music with Seed Audio 1.0 and place it on your clips. Captions and cuts are also done in Canvas." },
      { q: "Is Canvas free?", a: `Canvas itself is part of BuzzVideo. What you generate is billed in credits: the ${SIGNUP_CREDITS} free credits cover Seedream 4.5 and Seedream 5.0 lite images and Seed Audio 1.0, and video models need a Starter, Pro or Ultra plan.` },
    ],
    sources: [],
    related: ["/canvas", "/marketing-agent", "/node-based-ai-video-canvas", "/consistent-character", "/ai-short-drama"],
    howto: {
      name: "How to build a workflow on Canvas",
      steps: [
        "Open Canvas in BuzzVideo and create a project.",
        "Add an image node and generate the product still that sets the look.",
        "Add a video node and use the still as its reference or first frame.",
        "Add more video nodes, each using the previous shot as its reference.",
        "Add voiceover and music nodes for the sound.",
        "Regenerate any node that isn't right.",
        "Put the clips and audio together and add captions.",
      ],
    },
  },

  /* ───────────── 9. BuzzVideo MCP ───────────── */
  {
    slug: "buzzvideo-mcp",
    group: "How-to guides",
    title: "How to Make Videos in Claude & ChatGPT with MCP | BuzzVideo",
    description: "BuzzVideo MCP tutorial: add the connector URL in Claude or add BuzzVideo in ChatGPT, sign in once, then ask for videos, images and voiceovers in the chat.",
    h1: "How to make videos in Claude and ChatGPT with BuzzVideo MCP",
    answer:
      `Add BuzzVideo MCP to your AI chat, sign in to BuzzVideo once, then ask for the video in plain words. In Claude, paste the connector URL ${MCP_URL} under Customize, then Connectors. In ChatGPT, find BuzzVideo in the plugins directory and click Add. The clip comes back in the chat and saves to your BuzzVideo library.`,
    card: "Connect once, then ask Claude or ChatGPT for the video.",
    media: { from: "video", match: "creator-style product review", caption: "An 8-second UGC product review made through BuzzVideo MCP with the UGC Review skill." },
    sections: [
      {
        id: "before-you-start",
        h2: "What do you need before you start?",
        blocks: [
          {
            kind: "ul",
            items: [
              "A BuzzVideo account on any plan. Connecting is free, including on Free, and generations from the chat use the same plan and credits as the web app.",
              "A Starter, Pro or Ultra plan for video, the same as in the web app. On Free you can make Seedream 4.5 and Seedream 5.0 lite images and Seed Audio 1.0 voiceovers with your free credits.",
              "Claude (desktop or claude.ai) or ChatGPT. Other MCP-compatible clients work too.",
              `The connector URL: ${MCP_URL}. It is the same URL for every client.`,
            ],
          },
          { kind: "note", text: "Claude's help center says custom connectors are available on all Claude plans, with Free limited to one." },
        ],
      },
      {
        id: "connect-claude",
        h2: "How do you connect BuzzVideo MCP to Claude?",
        blocks: [
          {
            kind: "ol",
            items: [
              "In Claude desktop or claude.ai, open Customize, then Connectors.",
              "Choose Add custom connector.",
              `Name it BuzzVideo and paste the connector URL: ${MCP_URL}`,
              "Click Connect and sign in to your BuzzVideo account.",
              "Start a new chat and ask for a video. You sign in once and stay connected.",
            ],
          },
        ],
      },
      {
        id: "connect-chatgpt",
        h2: "How do you connect BuzzVideo MCP to ChatGPT?",
        blocks: [
          {
            kind: "ol",
            items: [
              "In ChatGPT, find BuzzVideo in the plugins directory and click Add.",
              "Sign in to your BuzzVideo account when asked.",
              "Start your message with @BuzzVideo, then describe what you want.",
            ],
          },
          { kind: "p", text: "For other MCP clients, paste the same connector URL wherever the client asks for a remote MCP server, then sign in." },
        ],
      },
      {
        id: "what-to-ask",
        h2: "What should you ask for?",
        blocks: [
          { kind: "p", text: "Ask the way you would brief a person: the length, the aspect ratio, what happens and, if you care, the model. Attach a product photo and the assistant sends it to BuzzVideo as a reference image." },
          {
            kind: "table",
            head: ["Job", "What to type"],
            rows: [
              ["One clip", "Make a 10-second 9:16 video ad of this product photo with Seedance 2.5."],
              ["A UGC ad", "Use BuzzVideo to make a 15-second 9:16 UGC review video of my product. Ask me for the product photo first."],
              ["Ads from a product page", "Use the BuzzVideo link-to-ad skill. Turn my product page into ready-to-run ads. Ask me for the product link first."],
              ["A voiceover", "Read this script in a warm, friendly voice with Seed Audio 1.0."],
            ],
          },
          { kind: "p", text: "The third row runs an MCP Skill. [MCP Skills](/mcp-skills) are 26 ready-made workflows, such as Link to Ad, UGC Review and Long to Shorts. Ask for one by name and it runs the whole job." },
          { kind: "media", media: { from: "video", match: "talking product character", caption: "A talking-product ad, one of the MCP Skill examples." } },
        ],
      },
      {
        id: "models-and-settings",
        h2: "Which model and settings should you pick?",
        blocks: [
          { kind: "p", text: "If you don't name a model, BuzzVideo picks one that fits the request and names it in the reply. To choose, say the model, the length and the aspect ratio in your message:" },
          {
            kind: "table",
            head: ["Model", "Clip length", "Resolution", "Good for"],
            rows: [
              ["Seedance 2.5", "4 to 30 seconds", "480p, 720p, 1080p", "Premium product and ad shots"],
              ["Seedance 2.0", "4 to 15 seconds", "480p to 4K", "Cinematic hero ads at up to 4K"],
              ["Kling 3.0", "3 to 15 seconds", "720p, 1080p, 4K", "Multi-shot story ads with dialogue"],
              ["MiniMax H3", "5 to 15 seconds", "768P, 2K, 4K", "The same character across clips, with native audio"],
            ],
          },
          { kind: "p", text: "Images come back in seconds and most videos in a couple of minutes, depending on the model and the clip length." },
        ],
      },
      {
        id: "fix-problems",
        h2: "How do you fix common problems?",
        blocks: [
          {
            kind: "table",
            head: ["Problem", "Fix"],
            rows: [
              ["The assistant writes a script but makes no video", "Mention BuzzVideo in the request, or start with @BuzzVideo in ChatGPT, and check that the connector is turned on for the chat"],
              ["It asks you to sign in again", "Reconnect BuzzVideo in the connector settings and sign in to the same BuzzVideo account"],
              ["It used a model you didn't want", "Name the model in your message. BuzzVideo names the model it used in every reply."],
              ["You can't find the clip later", "Open your BuzzVideo library. Everything generated from a chat lands there."],
              ["The product looks different", "Attach a sharp product photo in the chat and ask to keep the label exactly the same"],
            ],
          },
        ],
      },
    ],
    buzz: {
      title: "How to do it on BuzzVideo",
      steps: ["Copy the BuzzVideo connector URL from the BuzzVideo MCP page.", "Add it in Claude under Customize, then Connectors, or add BuzzVideo in ChatGPT.", "Sign in to BuzzVideo once.", "Ask for the video, attaching a product photo or link."],
      cta: { label: "Connect BuzzVideo MCP", href: "/mcp" },
      note: "Everything you generate from Claude or ChatGPT lands in the same BuzzVideo library and uses the same plan as the web app.",
    },
    faq: [
      { q: "What is the BuzzVideo MCP connector URL?", a: `${MCP_URL}. Paste it wherever your client asks for a remote MCP server or custom connector URL, then sign in to your BuzzVideo account.` },
      { q: "Which AI chats does BuzzVideo MCP work with?", a: "Claude (desktop and claude.ai) and ChatGPT today. Other MCP-compatible clients work too: point them at the connector URL and sign in." },
      { q: "Is BuzzVideo MCP free?", a: `Connecting it is free on every plan, including Free. Video made through it needs a Starter, Pro or Ultra plan, as in the web app; on Free, the ${SIGNUP_CREDITS} free credits new accounts get cover Seedream 4.5 and Seedream 5.0 lite images and Seed Audio 1.0 audio, and Free work carries a watermark.` },
      { q: "Which models can I use from the chat?", a: "The same ones as the BuzzVideo web app, including Seedance 2.5, Seedance 2.0, Kling 3.0 and MiniMax H3 for video, plus image models and Seed Audio 1.0 for voice. Ask for a specific model at any time." },
      { q: "Where do the videos I make in the chat go?", a: "Into your BuzzVideo library, the same one as the web app, on the same plan. The clip also comes back in the conversation." },
      { q: "Can I use my own product photos?", a: "Yes. Attach an image in the chat and ask for a UGC ad, a product shot or an animated version of it. The assistant sends the photo to BuzzVideo as a reference image." },
      { q: "What is the difference between BuzzVideo MCP and MCP Skills?", a: "BuzzVideo MCP is the connection that lets the assistant call BuzzVideo. MCP Skills are ready-made workflows the assistant runs through that connection, such as turning a product page link into ads. Ask for a skill by name." },
    ],
    sources: [
      { label: "Claude Help Center: Get started with custom connectors using remote MCP", url: "https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp" },
    ],
    related: ["/video-generation-mcp", "/claude-video-generator", "/chatgpt-video-generator", "/can-claude-make-videos", "/can-chatgpt-make-videos"],
    howto: {
      name: "How to make videos in Claude and ChatGPT with BuzzVideo MCP",
      steps: [
        "Copy the BuzzVideo connector URL https://mcp.buzzvideo.ai/mcp.",
        "Open Customize, then Connectors, in Claude and choose Add custom connector, or find BuzzVideo in the ChatGPT plugins directory and click Add.",
        "Paste the connector URL and name it BuzzVideo.",
        "Sign in to your BuzzVideo account.",
        "Ask for the video, naming the length, aspect ratio and model if you want one.",
        "Attach a product photo or link, or ask for an MCP Skill by name.",
      ],
    },
  },

  /* ───────────── 10. Consistent character ───────────── */
  {
    slug: "consistent-character",
    group: "How-to guides",
    title: "How to Keep a Character Consistent Across Shots | BuzzVideo",
    description: "Consistent character tutorial: build a set of reference images, attach the same ones to every prompt, then animate each still as the start frame of its shot.",
    h1: "How to keep a character consistent across shots",
    answer:
      "Make or upload a small set of reference images of the character, attach the same references to every prompt, and say what must stay the same: face, hair and outfit. Generate each shot as a still first, then animate it with a video model that takes reference images. Nothing is trained, and Nano Banana 2.1 takes up to 14 references per image.",
    card: "Same face, hair and outfit in every image and clip.",
    media: { from: "video", match: "short-drama confrontation", caption: "A vertical short-drama scene generated with MiniMax H3, which keeps a character consistent across clips." },
    sections: [
      {
        id: "before-you-start",
        h2: "What do you need before you start?",
        blocks: [
          {
            kind: "ul",
            items: [
              "Reference images of the character: real photos you have the rights to, or a character you generate first.",
              "Several angles. A front view plus a few others works better than one photo.",
              "A shot list, so you know which scenes need the character.",
              "A Starter, Pro or Ultra plan for the video shots. The stills can be made on free credits with Seedream 4.5.",
            ],
          },
        ],
      },
      {
        id: "build-references",
        h2: "How do you build the character references?",
        blocks: [
          {
            kind: "ol",
            items: [
              "Open Image in the sidebar and choose Text to Image, then pick Nano Banana 2.1.",
              "Generate the character once, in neutral light, facing the camera. Keep the outfit simple and specific.",
              "Use that image as a reference and generate a few more angles: side view, three-quarter view, full body.",
              "Save the best four or five. These are the references you attach to every shot from now on.",
            ],
          },
          { kind: "media", media: { from: "image", match: "creator holds the LUMEA serum bottle beside her cheek", caption: "A character still generated with Nano Banana 2.1. A clear, front-facing image like this is a good first reference." } },
        ],
      },
      {
        id: "generate-shots",
        h2: "How do you generate each shot with the same character?",
        blocks: [
          { kind: "p", text: "Make every shot as a still first. Attach the same references each time, describe only the new scene and action, and repeat the line that locks the look." },
          {
            kind: "ul",
            items: [
              "Prompt pattern: \"Show the woman in my reference photos unboxing my product at a kitchen table. Keep her face, hair and outfit exactly the same.\"",
              "Change one thing per shot: the scene, the action or the framing.",
              "Check each still against the references before you animate it. Fixing a still costs less than fixing a clip.",
            ],
          },
          { kind: "p", text: "Then turn each still into a clip. In Video Gen, set the still as the Start frame in First & Last Frame mode, or add your references in Omni Reference mode. On Kling 4.0, Omni Reference also has an Element slot for a character: pick a front view first, then up to 3 more angles." },
          { kind: "media", media: { from: "video", match: "holding a serum bottle and talking to camera in her bathroom", caption: "A talking-to-camera clip generated with MiniMax H3, with native audio and lip sync." } },
        ],
      },
      {
        id: "models-and-settings",
        h2: "Which model and settings should you pick?",
        blocks: [
          {
            kind: "table",
            head: ["Model", "Type", "Reference images", "Output", "Good for"],
            rows: [
              ["Nano Banana 2.1", "Image", "Up to 14", "1K, 2K or 4K", "The character stills and extra angles"],
              ["GPT Image 2.5 Sunburst", "Image", "Up to 16", "Quality from Low to Max", "Stills that need the most references"],
              ["Seedream 4.5", "Image", "Up to 14", "2K or 4K", "Stills on free credits"],
              ["MiniMax H3", "Video", "Up to 9", "5 to 15 seconds, up to 4K", "The same character across clips, with native audio and lip sync"],
              ["Kling 4.0", "Video", "Up to 10", "3 to 30 seconds, up to 1080p", "Long single takes, so the face has fewer cuts to change across"],
              ["Seedance 2.5", "Video", "Up to 30", "4 to 30 seconds, up to 1080p", "Shots that need many references at once"],
            ],
          },
        ],
      },
      {
        id: "fix-problems",
        h2: "How do you fix common problems?",
        blocks: [
          {
            kind: "table",
            head: ["Problem", "Fix"],
            rows: [
              ["The face drifts from shot to shot", "Attach the same references to every prompt, not the previous shot's output"],
              ["The outfit changes", "Name the outfit in every prompt and include a full-body reference"],
              ["The character looks right in stills but changes in video", "Use the still as the Start frame and keep the clip short, or use one long take"],
              ["Side views look like a different person", "Add side and three-quarter views to the references"],
              ["Two characters blend together", "Generate each character's references separately and name who is who in the prompt"],
            ],
          },
        ],
      },
    ],
    buzz: {
      title: "How to do it on BuzzVideo",
      steps: ["Generate or upload four or five reference images of the character.", "Attach the same references to every image prompt.", "Say what must stay the same: face, hair and outfit.", "Animate each still with MiniMax H3 or Kling 4.0."],
      cta: { label: "Make a consistent character", href: "/consistent-character" },
      note: `For images, Seedream 4.5 takes up to 14 reference images and works with the ${SIGNUP_CREDITS} free credits new accounts get. Animating the character needs a Starter, Pro or Ultra plan.`,
    },
    faq: [
      { q: "How do I keep the same character in AI images?", a: "Use the same reference images in every prompt and say what must stay the same: face, hair and outfit. Several angles of the character work better than one photo." },
      { q: "Do I need to train a LoRA?", a: "No. Nothing is trained and there is no adapter to set up. Every shot is generated from the same reference photos you attach to the prompt." },
      { q: "How many reference images can I use?", a: "Up to 14 on Nano Banana 2.1 and Seedream 4.5, and up to 16 on GPT Image 2.5 Sunburst. In video, MiniMax H3 takes up to 9, Kling 4.0 up to 10 and Seedance 2.5 up to 30." },
      { q: "Which model keeps a character consistent in video?", a: "MiniMax H3 is built for consistent characters and makes 5 to 15 second clips with native audio and lip sync. Kling 4.0 holds one take for up to 30 seconds, so there are fewer cuts for the face to change across." },
      { q: "Can I use a real person as the character?", a: "Yes, if you have the rights to the photos. You can also generate a character first and use those images as the references." },
      { q: "Can I make a consistent character for free?", a: `For images, yes. Seedream 4.5 takes up to 14 reference images and works with the ${SIGNUP_CREDITS} free credits new accounts get. Animating the character needs a Starter, Pro or Ultra plan.` },
    ],
    sources: [],
    related: ["/consistent-character", "/ai-influencer-generator", "/minimax-h3", "/ai-short-drama", "/image-to-video"],
    howto: {
      name: "How to keep a character consistent across shots",
      steps: [
        "Generate or upload a front-facing image of the character.",
        "Make a few more angles from that image and save four or five references.",
        "Attach the same references to every image prompt.",
        "Describe each new scene and repeat what must stay the same.",
        "Check each still against the references.",
        "Animate each still as the Start frame, or add the references in Omni Reference mode.",
      ],
    },
  },
];

/** 教程发布到 YouTube 后的链接(slug → 网址)。现在都还没发布，留空;有了链接页面会多一个「Watch on YouTube」按钮 */
export const YOUTUBE: Record<string, string> = {};
