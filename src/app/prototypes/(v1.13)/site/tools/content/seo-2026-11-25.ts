// 工具落地页内容(2026-11-25,第 6 批 · SEO 补位):竞品(HeyGen / Higgsfield / invideo / Krea / Pippit / Topview / OpenArt / ImagineArt)都有、
// 搜索量高、我们还没有落地页的 8 个关键词，一级网址 /<slug>。
// 依据(只写这些地方核实过的事实):
// - ai-voice-generator:tool-content.ts 的 ai-voice-over / text-to-speech / ai-voice-clone + models/model-facts.ts(Seed Audio 1.0:
//   配音 / 音乐 / 音效一条音轨、可克隆、多人对话 21 种语言、MP3 / WAV;按秒 0.5 积分)。models-catalog 里 MiniMax Speech 2.8 HD 标 live,
//   但 hero-leads.ts 和现有 TTS 页都写「coming soon」→ 跟现有页一致放 nextModels,待 PM 确认。
// - ai-face-swap / video-face-swap:content/more.ts 的 video-character-swap + v1.12 ai-tools model-tools/specs.ts(minimax/h3-max/recast:
//   原片 5–30s、单镜头 ≤15s、角色照 1–4 张从左到右替换、可选提示词指定谁换谁、768p / 1080p、Enhance Realism)。
//   视频换人换的是整个人物(不是只换脸)。每秒积分在 specs.ts 里是示意价，不写。
//   2026-11-25 Monica 确认：照片换脸也有(v1.12 sidebarMenus.ts 的 Image Face Swap:Image 里传两张图 + 提示词)→ ai-face-swap 页视频、照片都写。
//   video-face-swap 取代 video-character-swap(同一功能改名，旧页跳转过来);ai-face-swap 是宽意图页。
// - ai-influencer-generator:content/image.ts 的 consistent-character(Nano Banana 2.1 ≤14 张参考、MiniMax H3 一致角色 ≤9 张参考)
//   + content/more.ts 的 talking-avatar(MiniMax H3 Max 照片 + 配音 → 说话视频，最长 15 分钟、最高 2K)+ ai-ugc-video-generator。
//   没有「一键建 AI 网红」的独立功能，页面讲清是这几个能力组合着做。
// - ai-art-generator / ai-cartoon-generator:ai-image-generator / image-to-image / ai-anime-generator / ai-animation-generator 的事实;
//   风格由提示词决定，没有风格预设按钮，不写。
// - ai-script-to-video:marketing-agent(先出计划、确认后才生成扣积分)+ faceless-video-generator(脚本 → 配音 + 画面 + 字幕)+ ai-animation-generator
//   (单条最长 30 秒，长片是多条剪在一起)。
// - ai-video-background-changer:取代 content/video.ts 的 ai-video-background-remover(旧页跳转过来)。换背景 = v1.12 video-gen-modes
//   capabilities.ts 的 Edit Video 模式(Seedance 2.5 原片 4–30s、Kling 4.0 3–30s、Kling 3.0 Omni 3–15s,都能加参考图);
//   Gemini Omni 1.2 Flash 也能编辑但上传视频在英国 / 欧洲不可用且是 v1.13,不列。
//   「去背景成透明」只能用 Transparent Video skill 生成新片，对自己拍的素材做不到(沿用旧页口径)。
// 规则同 tool-content.ts:免费积分只在 Seedream 4.5 / 5.0 lite / Seed Audio 1.0 上能用，视频要 Starter / Pro / Ultra;
// 商用授权没有核实过的统一说法 → 沿用 audio.ts 的口径「看套餐条款」。media 只复用现有条目已引用的真实成片。

import type { ToolEntry } from "../tool-content";
import { SIGNUP_CREDITS } from "../credits";

const LOCAL = "/prototypes/site/tools";
const POSTER = "/video-library/posters";
const SHOW = "/prototypes/mcp-skill-showcase";

/** 视频类工具的「免费吗」统一口径 */
const VIDEO_PLAN = "it needs a Starter, Pro or Ultra plan";
/** 商用授权：没有核实过的统一说法，沿用 audio.ts 的口径 */
/* 2026-11-25 Monica:所有套餐都可商用 */
const RIGHTS = "Yes. Everything you generate on BuzzVideo can be used commercially on every plan, including Free.";

/** 换人视频(两页共用同一段真实演示片) */
const SWAP_MEDIA = {
  kind: "video" as const,
  src: "/prototypes/ai-tools/character-swap-demo.mp4",
  aspect: "16:9",
  alt: "A rider in a black T-shirt and red boots on a white motorbike with red lightning decals, riding along a mountain road",
  caption: "The rider in this clip was replaced with a new character from one photo.",
  source: "v1.12 ai-tools character-swap 空状态演示片(specs.ts emptyDemo,同 video-character-swap 页)",
};

export const SEO_NOV25_TOOLS: ToolEntry[] = [
  /* ───────── Audio ───────── */
  {
    slug: "ai-voice-generator",
    name: "AI Voice Generator",
    group: "Audio",
    h1: "AI Voice Generator",
    h1Tail: "natural voices for every ad and video",
    lead: "BuzzVideo's AI Voice Generator is text to speech for ads, explainers and social videos: it turns written text into natural speech in a preset voice or your own cloned voice. Generate voiceovers in 21 languages, with more than one speaker in a file, download MP3 or WAV, or place the audio straight onto your video, powered by Seed Audio 1.0.",
    mode: "audio",
    prompt: "Read this script in a [warm, confident] [English] voice for a [15s] product ad: [Paste your script here]",
    models: ["seed-audio-1-0", "minimax-speech-2-8-hd"], /* 2026-11-25 Monica 确认 MiniMax Speech 2.8 HD 已上线 */
    nextModels: ["elevenlabs-eleven-v3", "gemini-3-8-flash-tts", "voice-replication-2-0"],
    definition: {
      q: "What is an AI voice generator?",
      a: "An AI voice generator creates spoken audio from text with a synthetic voice, so you get narration without booking a voice actor or a studio. On BuzzVideo it runs on Seed Audio 1.0, which speaks 21 languages, voices several speakers in one file and can clone a voice from a short sample.",
    },
    steps: [
      { title: "Paste your text", body: "Add the script and a note on how it should sound, such as calm, upbeat or confident." },
      { title: "Choose the voice", body: "Pick a preset voice and language, or reference your own cloned voice." },
      { title: "Download or use it", body: "Save the audio as MP3 or WAV, or place it on your video in Canvas." },
    ],
    uses: [
      { title: "Ecommerce product ads", body: "A clear voiceover for every product video without a recording session." },
      { title: "UGC-style ads", body: "A natural, conversational read for creator-style clips on TikTok, Reels and YouTube." },
      { title: "Brand content", body: "One consistent brand voice, cloned once and used across a whole series." },
      { title: "Social videos in other languages", body: "The same script voiced in any of the 21 languages Seed Audio 1.0 speaks." },
    ],
    faq: [
      { q: "Is there a free AI voice generator?", a: `Yes. Seed Audio 1.0, the model behind the AI Voice Generator, works with the ${SIGNUP_CREDITS} free credits new accounts get, so you can voice your first scripts without a plan. You need a free account to generate.` },
      { q: "How many credits does an AI voice cost?", a: "Seed Audio 1.0 costs 0.5 credits per second of audio, so a 30-second voiceover costs 15 credits. The price shows before you create." },
      { q: "How many languages does the AI voice generator support?", a: "Seed Audio 1.0 speaks 21 languages. MiniMax Speech 2.8 HD adds expressive speech in 40+ languages." },
      { q: "Can I use the AI voice generator with my own voice?", a: "Yes. Upload a short, clean recording of one speaker, reference it in the prompt and paste your script; Seed Audio 1.0 reads it in that voice. Only clone voices you have permission to use." },
      { q: "Can I download the AI voice as MP3?", a: "Yes. Download it as MP3 or WAV from your assets, or use it directly on a video in Canvas." },
      { q: "Can it voice a conversation with two speakers?", a: "Yes. Seed Audio 1.0 can voice more than one speaker in a single file, which suits dialogue ads and podcast-style clips." },
      { q: "Can I use the AI voice in commercial ads?", a: RIGHTS },
      { q: "Can I add music under the voiceover?", a: "Yes. Seed Audio 1.0 can put voiceover, background music and sound effects in one track, or you can make them separately and mix them in Canvas." },
      { q: "How is BuzzVideo different from a standalone voice app like ElevenLabs?", a: "BuzzVideo puts the voice on the same account as your video and image models, so the voiceover lands next to the ad it belongs to. ElevenLabs v3 itself is also available on BuzzVideo." },
      { q: "How do I make an AI voice?", a: "Paste your script, add a note on how it should sound, pick a preset voice and language, and generate. To make an AI version of your own voice, upload a short, clean recording and reference it in the prompt." },
      { q: "Can I generate a celebrity AI voice?", a: "No. Only clone voices you own or have permission to use, which rules out a celebrity's voice without their consent. Describe the tone you want, such as deep and calm, and use a preset voice instead." },
      { q: "Can the AI voice generator make character voices?", a: "Yes. Say in the prompt how the character should sound, such as gruff, cheerful or whispering, and Seed Audio 1.0 reads the lines that way. It can voice several characters in one file for dialogue." },
    ],
    related: ["ai-voice-over", "text-to-speech", "ai-voice-clone", "faceless-video-generator"],
    metaTitle: "AI Voice Generator: Text to Speech, Free to Try | BuzzVideo",
    metaDescription: "AI voice generator: text to speech for ads and videos in 21 languages, with voice cloning, several speakers and MP3 or WAV download. Free to start.",
  },

  /* ───────── Video:换人(同一功能的两个搜索意图) ───────── */
  {
    slug: "ai-face-swap",
    name: "AI Face Swap",
    group: "Video",
    h1: "AI Face Swap",
    h1Tail: "put a new character into any video",
    lead: "BuzzVideo's AI Face Swap puts a new face or character into your videos and photos. For video, it replaces the people in a 5 to 30 second clip with characters from your photos, keeping the original movement, camera work and scene, swaps up to four people at once and outputs up to 1080p with MiniMax H3 Max. For a photo, upload the picture and the face to use, pick any image model and describe the swap.",
    mode: "video",
    prompt: "Swap the person in my video for [the character in my photo]. Keep the motion, camera and background.",
    models: ["minimax-h3-max"],
    media: SWAP_MEDIA,
    definition: {
      q: "What is AI face swap?",
      a: "AI face swap puts a different person into existing footage using a reference image, so the new person appears to have been filmed in the original shot. On BuzzVideo it works on video and photos. In a video, MiniMax H3 Max replaces each person with the character from your photo and keeps the motion, camera and scene. In a photo, any image model on BuzzVideo can swap in the face from a second picture.",
    },
    steps: [
      { title: "Upload a video", body: "A clip of 5 to 30 seconds, with no single shot longer than 15 seconds and each person clearly visible." },
      { title: "Add a photo of the new character", body: "One photo per person, up to four. They replace the people from left to right, or say who replaces whom in a prompt." },
      { title: "Generate", body: "Pick 768p or 1080p, turn on Enhance Realism for more natural skin and blending, and check the credit price first." },
    ],
    uses: [
      { title: "Ecommerce product ads", body: "Reuse a product video that performs and put a new presenter in it." },
      { title: "UGC ad testing", body: "Run the same creator-style ad with different faces to see which one converts." },
      { title: "Brand content", body: "Put your brand ambassador or AI character into existing footage." },
      { title: "Social campaigns by market", body: "Recast one social video with talent that fits each audience." },
    ],
    faq: [
      { q: "How do I AI face swap a video?", a: "Upload the video and a photo of the new character, then generate. MiniMax H3 Max swaps them in while keeping the movement, camera and background." },
      { q: "How do I AI face swap a photo?", a: "Open Image and pick any image model, such as Nano Banana 2.1 or Seedream 5.5. Upload the photo and a second picture with the face to use, then ask to swap the face in the first image with the face in the second and keep everything else the same." },
      { q: "Does it swap only the face or the whole person?", a: "In a video, the whole character: the person is replaced by the character in your photo, while the moves, camera and scene stay the same. In a photo, only the face changes." },
      { q: "How many faces can I swap at once?", a: "Up to four. Add one photo per character and they replace the people in the video from left to right, or say who replaces whom in the prompt." },
      { q: "How long can the video be?", a: "5 to 30 seconds, with no single shot longer than 15 seconds." },
      { q: "What resolution does it output?", a: "768p or 1080p. Turn on Enhance Realism for more natural skin and better blending into the scene." },
      { q: "Is AI face swap free?", a: `For video, no: ${VIDEO_PLAN}, and you see the credit price, based on the length of your video, before you generate. Photo face swap works with any image model, and the ${SIGNUP_CREDITS} free credits new accounts get work on Seedream 4.5 and Seedream 5.0 lite.` },
      { q: "Is AI face swap legal?", a: "Use photos of people who have agreed to it, such as your own talent or an AI character you made. Putting a real person into a video without consent, or passing an AI video off as real, can break platform rules and the law in many places." },
      { q: "Can I use face-swapped videos in ads?", a: `Only with consent from everyone shown, and check TikTok's and Meta's AI-disclosure rules before you run them. ${RIGHTS}` },
      { q: "Is there an AI face swap app?", a: "BuzzVideo is an online AI face swap tool that runs in the browser, so there is nothing to install. Upload the video or photo, add the new face and download the result." },
      { q: "Can I use AI face swap online with no sign in?", a: "No. You need a free BuzzVideo account to generate, and video face swap also needs a Starter, Pro or Ultra plan." },
    ],
    related: ["video-face-swap", "consistent-character", "ai-influencer-generator", "motion-control"],
    metaTitle: "AI Face Swap for Video & Photos Online | BuzzVideo",
    metaDescription: "AI face swap for video and photos: replace the people in a 5 to 30 second clip with characters from your photos, or swap a face in a picture. Up to 1080p.",
  },
  {
    slug: "video-face-swap",
    name: "Video Face Swap",
    group: "Video",
    h1: "Video Face Swap",
    h1Tail: "recast a video without reshooting",
    lead: "BuzzVideo's Video Face Swap replaces the people in an existing video with new characters from your photos while keeping every move, camera angle and scene. Upload a 5 to 30 second clip and up to four character photos, which replace the people from left to right, and get the recast video at up to 1080p with MiniMax H3 Max.",
    mode: "video",
    prompt: "Replace the rider in my video with [the character in my photo]. Keep the motion and the scene.",
    models: ["minimax-h3-max"],
    media: SWAP_MEDIA,
    definition: {
      q: "What is video face swap?",
      a: "Video face swap, also called character swap, replaces a person in a finished video with someone else while keeping the original motion, camera work and scene. On BuzzVideo it runs on MiniMax H3 Max, takes one to four character photos and replaces the whole character, not only the face.",
    },
    steps: [
      { title: "Upload your video", body: "Add a clip of 5 to 30 seconds in which no single shot is longer than 15 seconds." },
      { title: "Add the new characters", body: "Upload one photo per character, up to four. They replace the people from left to right; a prompt can say who replaces whom." },
      { title: "Generate", body: "Pick 768p or 1080p, turn on Enhance Realism for more natural skin and blending, then generate." },
    ],
    uses: [
      { title: "Localized ads", body: "Recast a winning product ad with talent that fits each market." },
      { title: "UGC creative testing", body: "Test the same creator-style ad with different faces before you pay for a new shoot." },
      { title: "Brand characters", body: "Swap a stand-in for your mascot or AI ambassador in footage you already have." },
      { title: "Social video refreshes", body: "Give a social clip that has run its course a new cast without changing the edit." },
    ],
    faq: [
      { q: "Can video face swap AI replace a person in a video?", a: "Yes. Upload the video and a photo of the new character; MiniMax H3 Max swaps them in while keeping the movement, camera and background." },
      { q: "How many people can I swap at once?", a: "Up to four. Add one photo per character and they replace the people in the video from left to right, or say who replaces whom in the prompt." },
      { q: "What kind of video works best?", a: "A clip of 5 to 30 seconds with no single shot longer than 15 seconds, where each person is clearly visible." },
      { q: "Does it keep the original camera moves and background?", a: "Yes. Only the people change; the motion, camera angles and scene come from your original video." },
      { q: "What resolution can I get?", a: "768p or 1080p. Enhance Realism gives more natural skin and better blending into the scene." },
      { q: "Is video face swap free?", a: `No, ${VIDEO_PLAN}. You see the credit price, based on the length of your video, before you generate.` },
      { q: "Can I face swap a photo instead of a video?", a: "Yes, with AI Face Swap. Video Face Swap works on video; for a photo, open Image, upload the photo and the face to use, and describe the swap." },
      { q: "Is video face swap the same as a deepfake?", a: "It uses the same idea, so use it responsibly: only swap in people who have agreed to it, or characters you created, and follow each platform's AI-disclosure rules." },
      { q: "What is the difference between video face swap and motion control?", a: "Video face swap keeps your video and changes who is in it. Motion Control keeps the character in your photo and makes it copy the moves from a reference video." },
      { q: "Can I use video face swap with no sign up?", a: "No. You need a BuzzVideo account to generate, and video face swap needs a Starter, Pro or Ultra plan." },
      { q: "Can I face swap a 10-minute video?", a: "Not in one pass. Video Face Swap takes clips of 5 to 30 seconds, with no single shot longer than 15 seconds. Cut longer footage into clips of that length first." },
      { q: "Does video face swap work online?", a: "Yes. It runs in the browser, with nothing to install: upload the clip and the character photos, generate and download the recast video." },
    ],
    related: ["ai-face-swap", "motion-control", "ai-lip-sync", "ai-ugc-video-generator"],
    metaTitle: "Video Face Swap AI: Replace People Online | BuzzVideo",
    metaDescription: "Video face swap AI online: replace up to four people in a 5 to 30 second clip with characters from your photos, keeping every move and camera angle, at 1080p.",
  },

  /* ───────── Avatar ───────── */
  {
    slug: "ai-influencer-generator",
    name: "AI Influencer Generator",
    group: "Avatar",
    h1: "AI Influencer Generator",
    h1Tail: "a virtual creator for your brand",
    lead: "BuzzVideo's AI Influencer Generator helps you create a virtual creator for your brand: design a character, keep the same face in every image and video, and have them talk to camera about your product. Build it with Nano Banana 2.1 and MiniMax H3 for consistency, then make UGC-style ads with Kling 4.0, MiniMax H3 Max and Seed Audio 1.0.",
    mode: "marketing",
    prompt: "Create an AI influencer for my brand: [a woman in her 20s with a relaxed, outdoorsy style]. Then make a [15s] video of her talking to camera about my product.",
    models: ["kling-4-0", "minimax-h3", "minimax-h3-max", "nano-banana-2-1", "seed-audio-1-0"],
    media: {
      kind: "video",
      src: `${LOCAL}/ugc-product-review.mp4`,
      poster: `${POSTER}/skill-ugc-product-review.jpg`,
      aspect: "9:16",
      alt: "A woman holding a serum bottle and talking to camera in a selfie-style UGC ad",
      caption: "An AI creator reviewing a product in an 8-second UGC-style ad, made from one product photo.",
      source: "MCP Skill 示例 ugc-product-review(视频库 skill-ugc-product-review,同 ai-ugc-video-generator 页)",
    },
    definition: {
      q: "What is an AI influencer?",
      a: "An AI influencer is a virtual creator, a generated person or character with a consistent look and personality, who appears in posts and videos like a real creator. On BuzzVideo you design the character in Nano Banana 2.1, keep it consistent with reference images and animate it talking about your product.",
    },
    steps: [
      { title: "Design the character", body: "Describe the look and style, or start from photos you have the rights to. Save several angles as references." },
      { title: "Keep them consistent", body: "Reuse the same references in every prompt: Nano Banana 2.1 takes up to 14 for images and MiniMax H3 up to 9 for video." },
      { title: "Make them talk", body: "Add a script and a voice, then let the Marketing Agent or the AI Avatar Video Generator make the talking video." },
    ],
    uses: [
      { title: "UGC-style product ads", body: "Your virtual creator reviews, unboxes and demos each new product." },
      { title: "Ecommerce launches", body: "The same face across product page videos, feed ads and stories." },
      { title: "Brand content", body: "A recurring host for tips, how-tos and behind-the-scenes posts." },
      { title: "Social channels", body: "A steady posting schedule on Instagram and TikTok without booking creators for every post." },
    ],
    faq: [
      { q: "How do I create an AI influencer?", a: "Design the character in Image with Nano Banana 2.1, save a few angles as references, then use those references in every new image and video so the face stays the same." },
      { q: "Can my AI influencer talk in videos?", a: "Yes. Make the voice with Seed Audio 1.0, then use the AI Avatar Video Generator, which turns one photo and a voice track into a talking video on MiniMax H3 Max, up to 15 minutes." },
      { q: "How do I keep the same face in every post?", a: "Use the same reference images every time and say in the prompt what must stay the same: face, hair and outfit. Several angles work better than one photo." },
      { q: "Is there a free AI influencer generator?", a: `For images, yes: Seedream 4.5 and Seedream 5.0 lite take reference images and work with the ${SIGNUP_CREDITS} free credits new accounts get, and so does Seed Audio 1.0 for the voice. Video ${VIDEO_PLAN}.` },
      { q: "Can my AI influencer have its own voice?", a: "Yes. Pick a preset voice in Seed Audio 1.0, or clone a voice you have permission to use and keep it for every video." },
      { q: "Can an AI influencer promote my products in ads?", a: "Yes, but label it. TikTok and Meta both have AI-disclosure rules, and an AI creator should not be presented as a real customer giving a real review." },
      { q: "Can I base my AI influencer on a real person?", a: "Only with that person's permission. Otherwise, create an original character so you own the look and avoid using someone's likeness without consent." },
      { q: "What video formats can I make?", a: "Ask for 9:16 for TikTok, Reels and Shorts, 1:1 or 4:5 for feeds, and 16:9 for YouTube; Kling 4.0 can do up to 30 seconds in one take." },
      { q: "What is the difference between an AI influencer and an AI avatar?", a: "An AI avatar is one talking video made from a photo. An AI influencer is a character you keep using: the same face across many images, videos and posts." },
      { q: "Can I make an AI influencer for Instagram?", a: "Yes. Make the character's photos in 4:5 or 1:1 for the feed and 9:16 videos for Reels and Stories, with the same reference images each time. Follow Instagram's rules on labeling AI content." },
    ],
    related: ["talking-avatar", "consistent-character", "ai-ugc-video-generator", "ai-spokesperson"],
    metaTitle: "AI Influencer Generator for Brand Content | BuzzVideo",
    metaDescription: "AI influencer generator: design a virtual creator with the same face in every post, then make UGC-style videos of them for Instagram, TikTok and ads.",
  },

  /* ───────── Image ───────── */
  {
    slug: "ai-art-generator",
    name: "AI Art Generator",
    group: "Image",
    h1: "AI Art Generator",
    h1Tail: "illustration, painting, 3D and anime styles",
    lead: "BuzzVideo's AI Art Generator turns a text prompt or reference image into artwork in the style you name, from watercolor and oil painting to flat illustration, 3D render and anime. Make stylized campaign visuals, social posts and product art in 1:1, 4:5 and 9:16 with Nano Banana 2.1, GPT Image 2.5 Sunburst, Seedream 5.5 and Seedream 4.5.",
    mode: "image",
    prompt: "A [watercolor illustration] of [my product on a picnic blanket in a spring meadow], soft pastel colors, space at the top for a headline.",
    models: ["nano-banana-2-1", "gpt-image-2-5-sunburst", "seedream-5-5", "seedream-4-5", "seedream-5-0-lite"],
    definition: {
      q: "What is an AI art generator?",
      a: "An AI art generator creates artwork from a text description, with the style, such as illustration, painting, 3D or anime, set in the prompt. It is the stylized sibling of an AI image generator. On BuzzVideo you can also add reference photos so your product or character stays recognizable in the new style.",
    },
    steps: [
      { title: "Name the style", body: "Say the medium and look: watercolor, oil painting, flat vector, 3D clay render or anime." },
      { title: "Describe the scene", body: "Add the subject, colors and mood, and upload your product or character as a reference." },
      { title: "Create and resize", body: "Make a few versions, keep the best and get it in 1:1, 4:5 and 9:16." },
    ],
    uses: [
      { title: "Stylized product ads", body: "Show your product as a painting or illustration to stand out in a feed of photos." },
      { title: "Campaign key art", body: "One art style across banners, posts and landing pages." },
      { title: "Social content", body: "Illustrated posts and story frames for daily posting." },
      { title: "Brand illustrations", body: "Spot illustrations for emails, packaging mock-ups and blog headers." },
    ],
    faq: [
      { q: "Is there a free AI art generator?", a: `Yes. Seedream 4.5 and Seedream 5.0 lite work with the ${SIGNUP_CREDITS} free credits new accounts get. Nano Banana 2.1, GPT Image 2.5 Sunburst and Seedream 5.5 are not covered by free credits.` },
      { q: "What art styles can it make?", a: "Any style you can describe: watercolor, oil painting, pencil sketch, flat vector, 3D render, claymation, pixel art, anime or fantasy character art for a D&D campaign. Name the medium, colors and mood in the prompt." },
      { q: "Can the AI art generator make art from a photo?", a: "Yes. Upload the photo as a reference and describe the style; the model redraws it as an illustration or painting while keeping the subject." },
      { q: "Will my product still look like my product?", a: "Add a product photo as a reference and say the shape and label must stay the same. Nano Banana 2.1 takes up to 14 reference images; check the label in the result." },
      { q: "What is the difference between an AI art generator and an AI image generator?", a: "They use the same models. An AI image generator usually aims for photoreal ad images; an AI art generator is about stylized looks such as illustration, painting and anime." },
      { q: "Which model is best for AI art with text on it?", a: "GPT Image 2.5 Sunburst is built for fine print and labels; Nano Banana 2.1 is a fast all-rounder with sharp text." },
      { q: "Can I use AI art in ads?", a: RIGHTS },
      { q: "Can I copy a famous artist's style?", a: "Describe the look you want, such as loose watercolor or bold flat colors, rather than copying a living artist's work or someone else's characters, which can break platform rules and copyright law." },
      { q: "Can I animate my AI art?", a: "Yes. Use the image as the first frame in Image to Video, or see the AI Animation Generator for cartoon and 3D clips." },
      { q: "How do I make AI art?", a: "Name the style, describe the scene and create. For example, ask for a watercolor illustration of your product in a spring meadow, then make a few versions and keep the best." },
      { q: "Can I use the AI art generator with no sign up?", a: `No. You need a free BuzzVideo account to generate. Signing up gives you ${SIGNUP_CREDITS} free credits, which work on Seedream 4.5 and Seedream 5.0 lite.` },
      { q: "Is there an AI art generator app?", a: "BuzzVideo runs in the browser, so there is nothing to install. Write the prompt online, add reference photos if you have them and download the art." },
    ],
    related: ["ai-image-generator", "ai-cartoon-generator", "ai-anime-generator", "image-to-image"],
    metaTitle: "AI Art Generator: Free to Start, Text or Photo | BuzzVideo",
    metaDescription: "AI art generator: turn a prompt or photo into watercolor, oil painting, illustration, 3D or anime art for ads and social posts. Free to start on Seedream 4.5.",
  },
  {
    slug: "ai-cartoon-generator",
    name: "AI Cartoon Generator",
    group: "Image",
    h1: "AI Cartoon Generator",
    h1Tail: "photos, products and ideas as cartoons",
    lead: "BuzzVideo's AI Cartoon Generator turns a photo, a product shot or a one-line idea into a cartoon-style image, from flat 2D characters to 3D cartoon mascots. Make playful ad visuals, product characters and social posts with Nano Banana 2.1, GPT Image 2.5 Sunburst and Seedream 4.5, then animate the cartoon into a video clip.",
    mode: "image",
    prompt: "Turn [my product photo] into a [3D cartoon] character with a friendly face, bright colors and a clean background. Keep the label readable.",
    models: ["nano-banana-2-1", "gpt-image-2-5-sunburst", "seedream-4-5", "seedream-5-0-lite"],
    media: {
      kind: "video",
      src: `${LOCAL}/talking-product.mp4`,
      poster: `${POSTER}/skill-talking-product.jpg`,
      aspect: "9:16",
      alt: "A cartoon-faced drink can on a kitchen counter that talks to camera",
      caption: "A product photo turned into a cartoon-faced character, then animated into a talking clip.",
      source: "MCP Skill 示例 talking-product(视频库 skill-talking-product,同 image-to-video 页)",
    },
    definition: {
      q: "What is an AI cartoon generator?",
      a: "An AI cartoon generator creates cartoon-style images from a text prompt or redraws a photo as a cartoon. On BuzzVideo you upload a photo or product shot as a reference, name the cartoon style and an image model redraws it; you can then animate the result with a video model.",
    },
    steps: [
      { title: "Add a photo or idea", body: "Upload a portrait or product shot as a reference, or describe the character from scratch." },
      { title: "Name the cartoon style", body: "Flat 2D, 3D cartoon, comic book or claymation, plus colors and expression." },
      { title: "Create, then animate", body: "Keep the best version and bring it to life with Image to Video." },
    ],
    uses: [
      { title: "Product mascots", body: "Give a bottle, can or box a cartoon face for playful ads." },
      { title: "Ecommerce promos", body: "Cartoon-style sale banners and launch visuals that stand out in a feed." },
      { title: "Brand content", body: "A cartoon version of your team or founder for posts and newsletters." },
      { title: "Social posts", body: "Comic-style frames and stickers for stories and carousels." },
    ],
    faq: [
      { q: "Is there a free AI cartoon generator?", a: `Yes. Seedream 4.5 and Seedream 5.0 lite take reference photos and work with the ${SIGNUP_CREDITS} free credits new accounts get. Nano Banana 2.1 and GPT Image 2.5 Sunburst are not covered by free credits.` },
      { q: "Can I turn a photo of myself into a cartoon?", a: "Yes. Upload the photo as a reference, name the cartoon style and say to keep your hair, glasses or outfit so it still looks like you." },
      { q: "Can I turn my product into a cartoon character?", a: "Yes. Upload a product photo and ask for a cartoon version with a face; say the label must stay readable so the brand is still clear." },
      { q: "What cartoon styles can I make?", a: "Any style you can describe, such as flat 2D, 3D cartoon, comic book, claymation or paper cut-out." },
      { q: "Can the AI cartoon generator make a cartoon video?", a: "Yes. Use the cartoon as the first frame in Image to Video, or see the AI Animation Generator for clips up to 30 seconds per take. Video needs a Starter, Pro or Ultra plan." },
      { q: "How do I keep the same cartoon character across images?", a: "Use the same cartoon image as a reference in every prompt; Nano Banana 2.1 takes up to 14 reference images." },
      { q: "What sizes can I make?", a: "Ask for 1:1, 4:5 or 9:16 so the cartoon fits feed posts, ads and stories." },
      { q: "Can I use AI cartoons in ads?", a: RIGHTS },
      { q: "Can I cartoon existing characters from TV or games?", a: "Create your own characters. Generating someone else's copyrighted characters can break platform rules and copyright law." },
      { q: "Can I make a cartoon from text only?", a: "Yes. Describe the character, the cartoon style, the colors and the expression, and the image is made from the prompt alone. A photo is optional." },
      { q: "What is the best AI cartoon generator model?", a: "Nano Banana 2.1 is the default, a fast all-rounder with strong reference following. Use GPT Image 2.5 Sunburst when a label or fine print must stay readable, and Seedream 4.5 to start on free credits." },
      { q: "Can I use the AI cartoon generator free with no sign up?", a: `No. You need a free BuzzVideo account to generate. Signing up gives you ${SIGNUP_CREDITS} free credits, which work on Seedream 4.5 and Seedream 5.0 lite.` },
    ],
    related: ["ai-art-generator", "ai-animation-generator", "ai-anime-generator", "image-to-video"],
    metaTitle: "AI Cartoon Generator: Free to Start Online | BuzzVideo",
    metaDescription: "AI cartoon generator: turn text, a photo or a product shot into a 2D or 3D cartoon image, then animate it into a video. Free to start on Seedream 4.5.",
  },

  /* ───────── Video ───────── */
  {
    slug: "ai-script-to-video",
    name: "AI Script to Video",
    group: "Video",
    h1: "AI Script to Video",
    h1Tail: "paste the script, get the edit",
    lead: "BuzzVideo's AI Script to Video turns a written script into a finished video: the Marketing Agent splits it into scenes, generates the visuals, adds a voiceover and captions, and edits them together. Paste an ad script or explainer and get a 9:16, 1:1 or 16:9 video made with Seedance 2.5, Kling 4.0, Nano Banana 2.1 and Seed Audio 1.0.",
    mode: "marketing",
    prompt: "Turn my script into a [30s] vertical video with a voiceover, captions and one scene per line: [Paste your script here]",
    models: ["seedance-2-5", "kling-4-0", "nano-banana-2-1", "seed-audio-1-0"],
    media: {
      kind: "video",
      src: `${SHOW}/faceless-money.mp4`,
      poster: `${SHOW}/faceless-money.jpg`,
      aspect: "9:16",
      alt: "A hand-drawn doodle-style explainer video about money",
      caption: "A scripted explainer with voiceover and captions, made by the Marketing Agent.",
      source: "MCP Skill 展示 faceless-money(同 faceless-video-generator 页)",
    },
    definition: {
      q: "What is AI script to video?",
      a: "AI script to video turns a written script into a video by matching each line to a generated scene, then adding a voiceover and captions. On BuzzVideo the Marketing Agent does this: it plans the scenes, picks a model for each shot and edits the result into one video.",
    },
    steps: [
      { title: "Paste the script", body: "Add your ad script or explainer, or give a topic and let the agent write it." },
      { title: "Confirm the plan", body: "The agent shows the scenes and the models it chose, and waits for you to confirm before it generates or spends credits." },
      { title: "Get the video", body: "Scenes, voiceover and captions come back as one edit. Ask for changes in the same chat." },
    ],
    uses: [
      { title: "Scripted product ads", body: "Turn an approved ad script into a video without a shoot." },
      { title: "UGC-style scripts", body: "Hand over a creator script and get a talking-to-camera version." },
      { title: "Brand explainers", body: "How-it-works videos with narration and captions." },
      { title: "Social series", body: "A week of scripted Shorts, TikToks and Reels from one batch of scripts." },
    ],
    faq: [
      { q: "How do I turn a script into a video with AI?", a: "Paste the script into the Marketing Agent and say the length and format. It plans the scenes, shows you the plan, and after you confirm it generates the visuals, voiceover and captions." },
      { q: "Is there a free AI script to video generator?", a: `Not for video: the scenes are made with Seedance 2.5 and Kling 4.0, which need a Starter, Pro or Ultra plan. The voiceover runs on Seed Audio 1.0, which works with the ${SIGNUP_CREDITS} free credits new accounts get.` },
      { q: "How long can the video be?", a: "Each generated shot can run up to 30 seconds on Seedance 2.5 and Kling 4.0. Longer scripts become several shots edited together." },
      { q: "Can I use my own voice for the narration?", a: "Yes. Clone your voice with Seed Audio 1.0 and use it as the narrator." },
      { q: "What languages can the voiceover be in?", a: "Seed Audio 1.0 speaks 21 languages, so you can voice the same script in another language for a new market." },
      { q: "What aspect ratios can I get?", a: "Ask for 9:16 for TikTok, Reels and Shorts, 1:1 or 4:5 for feeds, and 16:9 for YouTube in the same request." },
      { q: "Does the AI write the script for me?", a: "It can. Give it a topic or product and it writes the script and hook first, then makes the video." },
      { q: "Will it spend credits before I approve?", a: "No. The Marketing Agent shows its plan first and waits for you to confirm before it generates anything or spends credits." },
      { q: "How is script to video different from text to video?", a: "Text to video makes one clip from one prompt. Script to video takes a whole script, splits it into scenes and returns an edited video with voiceover and captions." },
      { q: "Can I turn a script into a video in ChatGPT or Claude?", a: "Yes. Connect BuzzVideo MCP to ChatGPT or Claude, paste the script and describe the video; it is generated on your BuzzVideo credits." },
      { q: "How do I script a video for AI?", a: "Open with a hook, write one short line per scene and end on a call to action. Each line becomes a scene, so keep one idea per line." },
      { q: "Can I use AI script to video with no sign up?", a: "No. You need a BuzzVideo account to generate, and the video scenes need a Starter, Pro or Ultra plan." },
    ],
    related: ["marketing-agent", "text-to-video", "faceless-video-generator", "ai-voice-over"],
    metaTitle: "AI Script to Video Generator with Voiceover | BuzzVideo",
    metaDescription: "AI script to video generator: paste a script; the Marketing Agent splits it into scenes, adds visuals, voiceover and captions, and edits a 9:16 or 16:9 video.",
  },
  {
    slug: "ai-video-background-changer",
    name: "AI Video Background Changer",
    group: "Video",
    h1: "AI Video Background Changer",
    h1Tail: "new setting, same people and motion",
    lead: "BuzzVideo's AI Video Background Changer replaces the background of an existing clip from a text instruction or a reference image, while the people, motion and timing stay the same. Move an ad to a new location or season with Seedance 2.5, Kling 4.0 or Kling 3.0 Omni. As a video background remover, it makes new clips with transparent backgrounds.",
    mode: "video",
    prompt: "In my video, [replace the background with a sunny beach at golden hour]. Keep the people, motion and timing exactly the same.",
    models: ["seedance-2-5", "kling-4-0", "kling-3-0-omni"],
    definition: {
      q: "What is an AI video background changer?",
      a: "An AI video background changer swaps the setting behind the people or products in a video without green screen or masking by hand. On BuzzVideo you do it in Edit Video mode: upload the clip, describe the new background or add a reference image, and Seedance 2.5, Kling 4.0 or Kling 3.0 Omni keeps the original motion.",
    },
    steps: [
      { title: "Upload your clip", body: "Seedance 2.5 takes 4 to 30 seconds, Kling 4.0 3 to 30 seconds and Kling 3.0 Omni 3 to 15 seconds." },
      { title: "Describe the new background", body: "Say where the scene should be and what must stay the same. Add a photo of the location as a reference if you have one." },
      { title: "Create and compare", body: "Check the result against the original, then cut and caption it in Canvas." },
    ],
    uses: [
      { title: "Localized ecommerce ads", body: "Move a winning product ad to a setting that fits each market." },
      { title: "Seasonal versions", body: "Put the same ad in a holiday or summer setting without a reshoot." },
      { title: "UGC clean-up", body: "Swap a messy room behind a creator for a tidy, on-brand set." },
      { title: "Social variations", body: "Test the same clip in several locations to see which one stops the scroll." },
    ],
    faq: [
      { q: "How do I change the background of a video with AI?", a: "Open Video, choose Edit Video mode on Seedance 2.5, Kling 4.0 or Kling 3.0 Omni, upload the clip and describe the new background. Say that the people, motion and timing stay the same." },
      { q: "Is this also a video background remover?", a: "Partly. You can replace the background of footage you filmed, but you cannot yet cut it out to a transparent background. For transparent elements, BuzzVideo generates new clips with a real alpha channel through the Transparent Video skill." },
      { q: "Can I remove the background from a video and make it transparent?", a: "Not for your own footage yet. New clips with transparent backgrounds, such as cut-out products, sparkles or smoke, export as ProRes 4444, WebM or PNG sequences; MP4 does not support transparency." },
      { q: "Can I use a photo as the new background?", a: "Yes. Edit Video on Seedance 2.5, Kling 4.0 and Kling 3.0 Omni accepts reference images, so you can upload the location you want." },
      { q: "Do I need a green screen?", a: "No. Describe the change and the model rebuilds the scene behind your subject, keeping the people and their motion." },
      { q: "How long can the video be?", a: "Up to 30 seconds on Seedance 2.5 and Kling 4.0, and up to 15 seconds on Kling 3.0 Omni. Split longer footage into parts." },
      { q: "Does it keep the original audio?", a: "Kling 3.0 Omni keeps the original sound by default when it edits a clip. With the other models, check the result and add your voiceover or music in Canvas if needed." },
      { q: "Is there a free AI video background changer?", a: `Not for video: Edit Video mode runs on video models, and ${VIDEO_PLAN}. For still photos, a pure white background on Seedream 4.5 or Seedream 5.0 lite works with the ${SIGNUP_CREDITS} free credits new accounts get.` },
      { q: "Can I change the background of a photo instead?", a: "Yes. Use Remove Background for transparent or white cutouts, or the AI Background Generator to put a product in a new scene." },
    ],
    related: ["ai-video-editor", "remove-background", "ai-background-generator", "ai-b-roll-generator"],
    metaTitle: "AI Video Background Changer & Remover | BuzzVideo",
    metaDescription: "Replace the background of a video from a text prompt or reference image while people and motion stay the same. Seedance 2.5, Kling 4.0 and Kling 3.0 Omni.",
  },
];
