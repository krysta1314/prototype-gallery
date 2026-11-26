// 工具落地页内容(2026-11-26,第 7 批 · SEO 补位):竞品 3 家都有、我们还缺的 2 个工具关键词，一级网址 /<slug>。
// 来源:docs/research/2026-11-25-competitor-landing-pages.md(#32 ai hairstyle changer:Higgsfield / OpenArt / ImagineArt;
// #61 remove object from video:Topview / Higgsfield / ImagineArt);美国月搜约 3,800 / 1,100(Monica 2026-11-26 给的数)。
// 依据(只写这些地方核实过的事实):
// - ai-hairstyle-changer:Monica 2026-11-26 确认能做 = 走 Image Gen 的图片编辑(上传照片当参考 + 描述新发型),做法同 content/more.ts 的
//   remove-object / photo-angle-editor。models 同 remove-object(Nano Banana 2.1 / GPT Image 2.5 Sunburst / Seedream 4.5 / 5.0 lite)
//   + Seedream 5.5(ai-face-swap 照片换脸 FAQ 里已写可用)。参考图上限、分辨率取 models/model-facts.ts:
//   Nano Banana 2.1 ≤14 张、1K / 2K / 4K;GPT Image 2.5 Sunburst ≤16 张;Seedream 4.5 2K / 4K。
//   没有发型预设库、没有脸型检测、没有一次出多款的专门按钮 → 不写;「一次出几个版本」只说可以在提示词里要求放在一张图里，或多跑几次。
// - remove-object-from-video:Monica 2026-11-26 确认能做 = Video Gen 的 Edit Video 模式(v1.12 video-gen-modes/app/capabilities.ts):
//   Seedance 2.5 原片 4–30s、Kling 4.0 3–30s、Kling 3.0 Omni 3–15s,三个都能加参考图;Kling 3.0 Omni 编辑默认保留原声(keep_audio,
//   同 ai-video-background-changer 页口径)。输出分辨率:Seedance 2.5 480p / 720p / 1080p,Kling 4.0 720p / 1080p(model-facts.ts)。
//   Gemini Omni 1.2 Flash / FLUX 3 Video / Grok 也有编辑，但上传视频在英国 / 欧洲受限或参数没核实 → 不列(同 background-changer 的处理)。
//   没有画笔 / 蒙版 / 逐帧追踪 → 写成「用文字描述要去掉的东西」;去水印只说「自己有权使用的素材」。
// 规则同 seo-2026-11-25.ts:免费积分只在 Seedream 4.5 / 5.0 lite / Seed Audio 1.0 上能用，视频要 Starter / Pro / Ultra;
// 所有套餐可商用;必须注册;是网页产品不是 App。media 不在这里写，配图走 page-media.ts 的 PAGE_ROWS(今天只复用现有素材)。

import type { ToolEntry } from "../tool-content";
import { SIGNUP_CREDITS } from "../credits";

const VIDEO_PLAN = "it needs a Starter, Pro or Ultra plan";
const RIGHTS = "Yes. Everything you generate on BuzzVideo can be used commercially on every plan, including Free.";

export const SEO_NOV26_TOOLS: ToolEntry[] = [
  /* ───────── Image ───────── */
  {
    slug: "ai-hairstyle-changer",
    name: "AI Hairstyle Changer",
    group: "Image",
    h1: "AI Hairstyle Changer",
    h1Tail: "try a new cut or color on your photo",
    lead: "BuzzVideo's AI Hairstyle Changer shows you with a new haircut, length or hair color while your face, outfit and background stay the same. Upload a selfie or portrait, describe the style or add a photo of the cut you like, and get a realistic preview from Nano Banana 2.1, GPT Image 2.5 Sunburst or Seedream, free to start on Seedream 4.5.",
    mode: "image",
    prompt: "Give the person in my photo [a shoulder-length bob with curtain bangs] in [warm honey blonde]. Keep the face, skin, outfit and background exactly the same.",
    models: ["nano-banana-2-1", "gpt-image-2-5-sunburst", "seedream-5-5", "seedream-4-5", "seedream-5-0-lite"],
    definition: {
      q: "What is an AI hairstyle changer?",
      a: "An AI hairstyle changer edits the hair in a photo of a real person, so you can preview a new cut, length or color before you commit to it. On BuzzVideo you do it in Image Gen: upload your photo as a reference, describe the hairstyle, and an image model redraws the hair while keeping your face and the rest of the picture.",
    },
    steps: [
      { title: "Upload your photo", body: "Add a clear, front-facing selfie or portrait in good light as a reference in Image Gen." },
      { title: "Describe the new hair", body: "Name the cut, length, texture and color, or add a photo of the hairstyle you like as a second reference. Say that the face must stay the same." },
      { title: "Compare and refine", body: "Check the result against your photo, then change one detail at a time, such as a shorter fringe or a darker shade, and run it again." },
    ],
    uses: [
      { title: "Try it before the salon", body: "See a bob, a pixie cut or curtain bangs on your own face before you book. Show the preview to your stylist so you both agree on the cut. Seedream 4.5 and Seedream 5.0 lite work with the free credits new accounts get." },
      { title: "Test a new hair color", body: "Preview balayage, copper, platinum blonde or a bold pink on your photo without dye. Name the exact shade and where it goes, such as face-framing highlights, and keep the cut the same so you only judge the color." },
      { title: "Men's cuts, fades and beards", body: "Compare a skin fade, a textured crop or a longer swept-back cut, with or without a beard trim. Ask for each version on the same photo so the face, light and angle stay identical and the hair is the only change." },
      { title: "Salon and beauty brand content", body: "Salons, barbers and hair care brands make before-and-after visuals and style lookbooks for Instagram and TikTok. Use photos of models or clients who have agreed to it, and make each look in 4:5 for the feed or 9:16 for stories." },
    ],
    faq: [
      { q: "How do I change my hairstyle in a photo with AI?", a: "Open Image, pick a model such as Nano Banana 2.1, upload your photo and describe the new hairstyle. Add a line such as \"keep the face, skin, outfit and background exactly the same\" so only the hair changes." },
      { q: "Is there a free AI hairstyle changer?", a: `Yes. Seedream 4.5 and Seedream 5.0 lite take your photo as a reference and work with the ${SIGNUP_CREDITS} free credits new accounts get. Nano Banana 2.1, GPT Image 2.5 Sunburst and Seedream 5.5 need a Starter, Pro or Ultra plan.` },
      { q: "Can I try on hairstyles with my own picture?", a: "Yes. Upload your own selfie or portrait as the reference image; the model redraws the hair on your photo, so you see the style on your face, not on a stock model." },
      { q: "Can I copy a hairstyle from another photo?", a: "Yes. Add a photo of the cut you like as a second reference and say to give the person in the first photo the hairstyle from the second. Nano Banana 2.1 takes up to 14 reference images." },
      { q: "Can I try different hair colors with AI?", a: "Yes. Name the shade in the prompt, such as ash brown, copper or platinum blonde, and say whether the cut should stay the same. Describe highlights or balayage by where they go, such as face-framing pieces." },
      { q: "What hairstyle suits me?", a: "The quickest way to find out is to try several on your own photo. Ask for three or four cuts on the same picture, compare them side by side and take the one you like to your stylist." },
      { q: "Will my face still look like me?", a: "Usually, if you say so in the prompt. The model redraws the image, so small details can shift; ask to keep the face, skin tone and expression exactly the same and check them before you share the result." },
      { q: "Does the AI hairstyle changer work for men?", a: "Yes. Describe the cut the way you would to a barber, such as a mid fade with a textured top or a buzz cut, and add a beard style if you want one." },
      { q: "What photo works best?", a: "A sharp, front-facing photo in even light with your hair and hairline visible. Hats, heavy shadows and hands over the face make the result less accurate." },
      { q: "Is there an AI hairstyle changer app?", a: "No. BuzzVideo is a website, not an app you install. Sign in from your phone or computer browser, upload the photo, describe the hairstyle and download the result." },
      { q: "Can I use the AI hairstyle changer with no sign up?", a: `No. You need a free BuzzVideo account to generate. Signing up gives you ${SIGNUP_CREDITS} free credits, which work on Seedream 4.5 and Seedream 5.0 lite.` },
      { q: "Can I use hairstyle previews in salon ads?", a: `${RIGHTS} Use photos of clients or models who have agreed to it, and present the images as previews, not real results.` },
    ],
    related: ["ai-image-editor", "virtual-try-on", "ai-headshot-generator", "ai-face-swap"],
    metaTitle: "AI Hairstyle Changer: Try Haircuts Free | BuzzVideo",
    metaDescription: "AI hairstyle changer: upload your photo and try a new haircut, bangs or hair color while your face stays the same. Free to start, for men and women.",
  },

  /* ───────── Image · 2026-11-26 透明 PNG(Monica 批了 1–4 项;名字 / 网址按自动补全选「AI Transparent PNG Generator」/transparent-png-generator)─────────
     事实:接口 background=transparent 在 GPT Image 2.5 / 2.6(Sunburst、Flare)和 Seedream 5.5 上可用(model-facts.ts);免费积分只在 Seedream 4.5 / 5.0 lite 上能用，
     这两个不出透明底 → 透明 PNG 要 Starter / Pro / Ultra。去掉已有图片背景是另一个工具(Remove Background),在页里分清。 */
  {
    slug: "transparent-png-generator",
    name: "AI Transparent PNG Generator",
    group: "Image",
    h1: "AI Transparent PNG Generator",
    h1Tail: "logos, stickers and cutouts with no background",
    lead: "BuzzVideo's AI Transparent PNG Generator creates images that already have a transparent background, so a logo, sticker, product cutout or design element drops straight onto any slide, ad or video. Describe the object, pick GPT Image 2.5, GPT Image 2.6 or Seedream 5.5 with Transparent background on, and download a PNG with an alpha channel.",
    mode: "image",
    prompt: "A [round enamel pin of a smiling lemon] on a transparent background, flat vector style, bold outline, no shadow.",
    models: ["gpt-image-2-5-sunburst", "gpt-image-2-6-sunburst", "gpt-image-2-6-flare", "gpt-image-2-5-flare", "seedream-5-5"],
    definition: {
      q: "What is an AI transparent PNG generator?",
      a: "An AI transparent PNG generator makes a new image whose background is see-through, saved as a PNG with an alpha channel. Unlike a background remover, there is no photo to cut out first: you describe the object and the model draws only the object. On BuzzVideo you turn on Transparent background in Image Gen with GPT Image 2.5, GPT Image 2.6 or Seedream 5.5.",
    },
    steps: [
      { title: "Pick a model that supports transparency", body: "Open Image and choose GPT Image 2.5 or 2.6 (Sunburst or Flare) or Seedream 5.5, then turn on Transparent background." },
      { title: "Describe one object", body: "Name the object, its style and its outline, such as a flat vector sticker with a white border. Say no shadow and no scene so only the object is drawn." },
      { title: "Download the PNG", body: "Check the edges on the checkerboard preview, then download the PNG and drop it onto your slide, ad, thumbnail or video." },
    ],
    uses: [
      { title: "Logos and brand marks", body: "Sketch logo ideas, monograms and badges that sit cleanly on light and dark backgrounds. Generate a few directions, pick one, and hand the PNG to your designer to refine as a vector." },
      { title: "Stickers and emoji packs", body: "Make sticker sets, reaction emoji and enamel pin designs in one consistent style. Ask for a white die-cut border so each sticker reads well on any chat or product photo." },
      { title: "Product cutouts for ads", body: "Create a product-style render with no background, then place it on seasonal backdrops, sale banners or marketplace listings without masking anything by hand. To remove the background from a real product photo instead, use Remove Background." },
      { title: "Design elements to combine", body: "Generate icons, badges, fruit, splashes and props as separate PNGs, then layer them into one poster, slide or thumbnail. Keep the same style words in every prompt so the pieces match." },
    ],
    faq: [
      { q: "How do I make a transparent PNG with AI?", a: "Open Image on BuzzVideo, pick GPT Image 2.5, GPT Image 2.6 or Seedream 5.5, turn on Transparent background and describe a single object with no scene behind it. The result downloads as a PNG with an alpha channel." },
      { q: "Which AI image models can make transparent backgrounds?", a: "On BuzzVideo, GPT Image 2.5 Sunburst and Flare, GPT Image 2.6 Sunburst and Flare, and Seedream 5.5 can return a transparent background. Nano Banana models cannot; make the image there and run it through Remove Background instead." },
      { q: "Is the transparent PNG generator free?", a: `No. Transparent backgrounds need a Starter, Pro or Ultra plan, because the models that support them are not part of the ${SIGNUP_CREDITS} free signup credits. The free credits work on Seedream 4.5 and Seedream 5.0 lite, which return a regular background.` },
      { q: "What is the difference between a transparent PNG generator and a background remover?", a: "A transparent PNG generator draws a new object with no background from a text prompt. A background remover takes an existing photo and cuts the subject out. Use Remove Background when you already have the picture." },
      { q: "Can I make a transparent logo with AI?", a: "Yes. Describe the mark, its colors and style, and ask for a flat design with no shadow on a transparent background. Treat the PNG as a concept and have it redrawn as a vector before you print it large." },
      { q: "How do I get clean edges?", a: "Ask for a bold outline or a white sticker border, avoid soft glows, smoke and fine hair, and say no shadow. Check the edges on a dark and a light background before you use the file." },
      { q: "Can I use the PNGs in videos?", a: "Yes. Drop the PNG onto a clip in your editor or use it as a reference image in Video Gen, for example to keep a logo or mascot the same across shots." },
      { q: "Can I use transparent PNGs commercially?", a: RIGHTS },
    ],
    related: ["remove-background", "ai-logo-generator", "ai-image-generator", "ai-mockup-generator"],
    metaTitle: "AI Transparent PNG Generator: No Background | BuzzVideo",
    metaDescription: "AI transparent PNG generator: describe a logo, sticker or product and download a PNG with a transparent background, with GPT Image 2.5, 2.6 or Seedream 5.5.",
  },

  /* ───────── Video ───────── */
  {
    slug: "remove-object-from-video",
    name: "Remove Object from Video",
    group: "Video",
    h1: "Remove Object from Video",
    h1Tail: "describe it, and it leaves the shot",
    lead: "Remove Object from Video on BuzzVideo erases a passerby, a sign, a cable or stray text from your footage while the people, motion and timing stay the same. Upload a clip of up to 30 seconds, describe what should go, and Seedance 2.5, Kling 4.0 or Kling 3.0 Omni rebuild the shot without it, with no masking or frame-by-frame work.",
    mode: "video",
    prompt: "In my video, remove [the man walking behind the presenter]. Keep the presenter, the camera move, the lighting and the timing exactly the same.",
    models: ["seedance-2-5", "kling-4-0", "kling-3-0-omni"],
    definition: {
      q: "How do you remove an object from a video with AI?",
      a: "You give an AI video model the clip and tell it what to take out, and it regenerates the footage without that object while keeping the rest. On BuzzVideo you do this in Edit Video mode: upload the clip, name the object and where it is, and say what must stay the same, such as the people, motion and timing.",
    },
    steps: [
      { title: "Upload the clip", body: "Seedance 2.5 takes 4 to 30 seconds, Kling 4.0 3 to 30 seconds and Kling 3.0 Omni 3 to 15 seconds. Split longer footage first." },
      { title: "Say what should go", body: "Name the object and where it is, such as the cup on the left or the person crossing behind her, and list what must stay the same." },
      { title: "Review and finish", body: "Play the result next to the original, check the area the object left, then cut, caption or add sound in Canvas." },
    ],
    uses: [
      { title: "Passers-by in a product shot", body: "Someone walks through the back of an otherwise perfect take. Name the person and where they cross, and ask to keep the presenter, the product and the camera move. Seedance 2.5 rebuilds clips of 4 to 30 seconds at up to 1080p." },
      { title: "Clean up real estate and travel footage", body: "Agents and creators take out parked cars, bins, cables and crowds from walkthroughs and travel clips. List every item in one prompt, and add a photo of the empty location as a reference image if you have one." },
      { title: "Text, stickers and logos on your own footage", body: "Marketers lift an old price sticker, a caption burned into the frame or a logo on a prop before reusing a clip they own. Say which text and where it sits. Do not use it to remove other people's watermarks or credits." },
      { title: "Fix a take instead of reshooting", body: "A boom mic, a light stand or a crew member at the edge of frame can be removed instead of booking a new shoot. Kling 3.0 Omni keeps the original sound by default when it edits a clip, so dialogue stays in place." },
    ],
    faq: [
      { q: "How do I remove an object from a video?", a: "Open Video, choose Edit Video mode on Seedance 2.5, Kling 4.0 or Kling 3.0 Omni, and upload the clip. Describe what to remove and where it is, and say that the people, motion and timing stay the same." },
      { q: "Can I remove a person from a video?", a: "Yes. Describe who should go, such as the man in the grey hoodie behind her, and the model rebuilds the background where they were. Only edit footage you have the rights to." },
      { q: "Do I need to mask or brush over the object?", a: "No. You name the object in your prompt and the model works out the area across the clip. There is no masking, tracking or frame-by-frame painting." },
      { q: "Is there a free way to remove an object from a video?", a: `Not for video: Edit Video mode runs on video models, and ${VIDEO_PLAN}. For a still frame or photo, Remove Object from Photo works on Seedream 4.5 and Seedream 5.0 lite with the ${SIGNUP_CREDITS} free credits new accounts get.` },
      { q: "How long can the video be?", a: "Up to 30 seconds on Seedance 2.5 and Kling 4.0, and up to 15 seconds on Kling 3.0 Omni. Cut longer footage into parts and edit each one." },
      { q: "Does it keep the original audio?", a: "Yes on Kling 3.0 Omni, which keeps the original sound by default when it edits a clip. With Seedance 2.5 and Kling 4.0, check the sound in the result and add your voiceover or music in Canvas if needed." },
      { q: "What resolution is the cleaned video?", a: "Seedance 2.5 outputs 480p, 720p or 1080p, and Kling 4.0 outputs 720p or 1080p. Pick the resolution before you generate; the credit price shows first." },
      { q: "Can AI remove a watermark or text from a video?", a: "Yes, on footage you own or have permission to edit: it can remove text, stickers and logos that you describe. Do not use it to strip another creator's watermark or a stock library's mark." },
      { q: "Will anything else in the video change?", a: "Small details can shift, because the model regenerates the shot. Say clearly what must stay the same, such as faces, the product label and the camera move, and compare the result with the original before you publish." },
      { q: "Can I replace the object instead of removing it?", a: "Yes. Describe what should take its place, such as a potted plant instead of the bin, or add a reference image of the new object." },
      { q: "Is this the same as removing an object from a photo?", a: "No. For a still image, use Remove Object from Photo, which runs on image models and costs less. This page is for video clips, where the object has to disappear in every frame." },
      { q: "Can I use the cleaned video commercially?", a: `${RIGHTS} BuzzVideo runs in your browser, so there is no app to install; you need a free account to generate.` },
    ],
    related: ["ai-video-editor", "remove-object", "upscale-video", "ai-inpainting"],
    metaTitle: "Remove Object from Video Online with AI | BuzzVideo",
    metaDescription: "Remove object from video online with AI: describe the person, sign or clutter to erase and Seedance 2.5 or Kling rebuilds the shot. No masking, up to 30s.",
  },
];
