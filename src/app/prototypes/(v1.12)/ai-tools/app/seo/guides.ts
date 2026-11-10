// 其余 6 个工具页的 SEO / GEO 内容(2026-11-10,照 Upscale Image 的样板铺开)+ 工具 → 内容的总表 GUIDES。
// 规格里的数字(时长、素材数量、每秒积分、分辨率)直接读 model-tools/specs.ts 和 video-upscale/logic.ts,产品配置改了这里跟着变。
// 首屏的标题和卖点沿用各工具空状态原有的文案(specs 里的 emptyTitle / emptyBody)。
// 收费口径(Monica 2026-11-10):图片工具注册送的积分直接能用;视频类工具要订阅 —— 所以这 6 个工具都不写 free,价格行写明要订阅。
// ⚠️ specs.ts 里的每秒积分标注是「示意」,上线前要和正式定价核对。
// 纯数据，无 UI 依赖。

import { RES_FACTOR, TIER_FACTOR } from "../model-tools/logic";
import { modelToolSpec, type ModelVariant } from "../model-tools/specs";
import type { ToolKey } from "../sidebarMenus";
import { MAX_UPSCALE_SECONDS, VIDEO_CREDITS_PER_MP } from "../video-upscale/logic";
import { FACTOR_MAX } from "../logic";
import { UPSCALE_GUIDE, type ToolGuide } from "./content";

const G = "/prototypes/ai-tools/guide";
const IMG_MB = 20;
const VIDEO_MB = 200;
const AUDIO_MB = 50;
const TO_4K = "Upscale clips up to 60 seconds to 4K.";
const SUBSCRIPTION = "Video tools need a BuzzVideo subscription.";

const variant = (tool: string, key?: string): ModelVariant => {
  const models = modelToolSpec(tool).models;
  return (key ? models.find((m) => m.key === key) : models[0])!;
};
const range = (v: ModelVariant, input: string): [number, number] => v.inputs.find((i) => i.id === input)!.secs!;
const maxFiles = (v: ModelVariant, input: string) => v.inputs.find((i) => i.id === input)!.max;
const option = (v: ModelVariant, id: string) => v.options.find((o) => o.id === id)!.values;
const mins = (s: number) => `${s / 60} min`;
/** 每秒积分 = 基础价 × 档位系数(和 model-tools/logic.ts 的 cost() 同一套系数);最多一位小数 */
const rate = (v: ModelVariant, factor = 1) => String(Math.round(v.credits.perSecond * factor * 10) / 10);
/** 「6.3 at 480p, 9 at 768p and 13.5 at 1080p」 */
const byRes = (v: ModelVariant) => {
  const parts = option(v, "resolution").map((res) => `${rate(v, RES_FACTOR[res])} at ${res}`);
  return parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}` : parts[0];
};
/** N 秒的积分，按分辨率各算一个:「63, 90 or 135」 */
const totalByRes = (v: ModelVariant, secs: number) => {
  const parts = option(v, "resolution").map((res) => String(Math.round(v.credits.perSecond * RES_FACTOR[res] * secs)));
  return parts.length > 1 ? `${parts.slice(0, -1).join(", ")} or ${parts.at(-1)}` : parts[0];
};
const FORMATS = { image: `JPG, PNG or WEBP, up to ${IMG_MB} MB`, video: `MP4, MOV, WEBM or M4V, up to ${VIDEO_MB} MB`, audio: `MP3, WAV, M4A, AAC or OGG, up to ${AUDIO_MB} MB` };
const REFUND = { q: "What happens if a generation fails?", a: "The credits for that run are refunded, and you can generate again with the same files and settings." };
const hero = (tool: string) => ({ h1: modelToolSpec(tool).emptyTitle, tagline: modelToolSpec(tool).emptyBody });

/* ---------------- Upscale Video ---------------- */
const fourK5s = Math.ceil(((3840 * 2160 * 5 * 30) / 1_000_000) * VIDEO_CREDITS_PER_MP);
const VIDEO_UPSCALE_GUIDE: ToolGuide = {
  tool: "video-upscale",
  cardVideo: `${G}/cards/video-upscale.mp4`,
  ogImage: "/prototypes/ai-tools/ai-video-upscaler-og.jpg",
  h1: "AI Video Upscaler",
  tagline: "Transform low-quality videos into high-resolution with AI-powered enhancement.",
  metaTitle: "AI Video Upscaler: Upscale Video to 4K Online | BuzzVideo",
  metaDescription: `Upscale video up to ${FACTOR_MAX}x or to 4K online. Sharpens faces, edges and on-screen text in low-resolution clips. MP4, MOV, WEBM in; MP4, MOV, WEBM or GIF out.`,
  definition: {
    heading: "What is an AI video upscaler?",
    lead: "An AI video upscaler raises the resolution of a clip and rebuilds detail frame by frame, so low-resolution footage looks sharp on a larger screen.",
    body: `BuzzVideo AI Video Upscaler is an online video enhancer built on the SeedVR model, made for ad footage, AI-generated clips and user-generated content. Upload a clip up to ${MAX_UPSCALE_SECONDS} seconds, enlarge it up to ${FACTOR_MAX}x or to a preset resolution up to 2160p (4K), and export MP4, WEBM, MOV or GIF.`,
    media: {
      caption: "The same frame, before and after upscaling",
      items: [
        { src: `${G}/video-upscale-before.jpg`, label: "Before", alt: "Low-resolution video frame of lips with lip gloss before AI upscaling, soft and blurred" },
        { src: `${G}/video-upscale-after.jpg`, label: "After", alt: "The same video frame after AI upscaling, with sharp skin texture and highlights" },
      ],
    },
  },
  steps: {
    heading: "How to upscale a video online",
    sub: "Works on clips you already have: no editing software and no re-export settings to learn.",
    items: [
      { title: "Upload your video", visual: { kind: "file", name: "product-clip.mp4", meta: "1280 × 720 · 8s", thumb: `${G}/video-upscale-before.jpg` }, body: `Drop in an MP4, MOV, WEBM or M4V file up to ${MAX_UPSCALE_SECONDS} seconds and ${VIDEO_MB} MB.` },
      { title: "Choose the output size", visual: { kind: "choice", label: "Target Resolution", options: ["720p", "1080p", "1440p", "2160p"], selected: "2160p", from: "1280 × 720", to: "3840 × 2160 px" }, body: `Set a scale factor up to ${FACTOR_MAX}x, or pick a target resolution from 720p to 4K (measured on the short side). The Generate button shows the credit cost first.` },
      { title: "Generate and download", visual: { kind: "result", before: `${G}/video-upscale-before.jpg`, after: `${G}/video-upscale-after.jpg`, label: "MP4" }, body: "Play the result, then download MP4 for sharing, WEBM for the web, MOV (ProRes) for editing or GIF." },
    ],
  },
  uses: {
    heading: "What can you use a video upscaler for?",
    sub: "For any clip that has to hold up on a bigger screen than it was made for.",
    items: [
      { title: "Ad creatives", body: "Bring 720p product clips up to 1080p or 4K before they run on connected TV, YouTube or a landing page." },
      { title: "AI-generated video", body: "Raise 720p and 1080p model outputs to 4K so they cut cleanly next to camera footage." },
      { title: "User-generated content", body: "Sharpen creator and customer clips that were compressed by messaging apps or social downloads." },
      { title: "Old footage", body: "Enhance archive clips and screen recordings for reuse in new edits." },
    ],
  },
  specs: {
    heading: "Supported formats, sizes and pricing",
    items: [
      { label: "Price", value: `${VIDEO_CREDITS_PER_MP} credits per megapixel of output across all frames, rounded up to the next whole credit. ${SUBSCRIPTION}` },
      { label: "Input formats", value: "MP4, MOV, WEBM, M4V" },
      { label: "Max length and size", value: `${MAX_UPSCALE_SECONDS} seconds, ${VIDEO_MB} MB` },
      { label: "Scale factor", value: `Up to ${FACTOR_MAX}x in one run` },
      { label: "Target resolution", value: "720p, 1080p (Full HD), 1440p (2K), 2160p (4K), measured on the short side" },
      { label: "Output formats", value: "MP4 (default), WEBM, MOV (ProRes), GIF" },
      { label: "Model", value: "SeedVR" },
    ],
  },
  faq: {
    heading: "AI video upscaler FAQ",
    items: [
      { q: "Can I upscale a video to 4K?", a: "Yes. Choose the 2160p (4K) target, or a scale factor that takes your clip there: 2x turns 1080p into 4K, and 3x turns 720p into 4K." },
      { q: "How much does it cost to upscale a video on BuzzVideo?", a: `Cost follows the amount of output: ${VIDEO_CREDITS_PER_MP} credits per megapixel across every frame. A 5-second clip at 30 fps upscaled to 4K is about ${fourK5s.toLocaleString("en-US")} credits. The Generate button shows the exact cost before you run it. ${SUBSCRIPTION}` },
      { q: "How long a video can I upscale?", a: `Up to ${MAX_UPSCALE_SECONDS} seconds and ${VIDEO_MB} MB per clip. Split longer videos into parts and upscale them one at a time.` },
      { q: "Will it fix a blurry video?", a: "It sharpens clips that look soft because they are low-resolution or compressed. Footage with heavy motion blur or missed focus improves less, because that detail was never recorded." },
      { q: "Which output format should I choose?", a: "MP4 plays everywhere. WEBM is smaller for web pages, MOV (ProRes) is best for further editing, and GIF is for short silent loops." },
      { q: "What happens if a video upscale fails?", a: "The credits for that run are refunded, and you can retry with the same clip and settings." },
    ],
  },
  related: {
    heading: "More AI tools",
    items: [
      { tool: "upscale", body: "Upscale still images up to 10x or to 4K." },
      { tool: "lip-sync", body: "Make the person in a video say new lines." },
      { tool: "motion-control", body: "Animate a character with the moves from a video." },
    ],
  },
  cta: { heading: "Upscale your first video", body: "Upload a clip and see the cost before you run it.", button: "Upload a video" },
};

/* ---------------- Motion Control ----------------
   配图(2026-11-10 Monica):动作参考不要用 3D 白模那段视频的画面，用真人舞台舞蹈的画面 */
const mc = variant("motion-control");
const mcSecs = range(mc, "motion");
const MOTION_CONTROL_GUIDE: ToolGuide = {
  tool: "motion-control",
  cardVideo: `${G}/cards/motion-control.mp4`,
  ogImage: "/prototypes/ai-tools/ai-motion-control-og.jpg",
  ...hero("motion-control"),
  metaTitle: "Kling Motion Control: Animate a Photo from Video | BuzzVideo",
  metaDescription: `Make a character photo copy the moves in a reference video. Upload one image and a ${mcSecs[0]}–${mcSecs[1]}s motion clip, powered by Kling 3.0 Motion Control.`,
  definition: {
    heading: "What is AI motion control?",
    lead: "AI motion control, also called motion transfer, copies the body movement in a reference video onto a character from a single photo, so the character performs the same moves.",
    body: `BuzzVideo AI Motion Control runs ${mc.label} in the browser. Upload one character photo and a motion video of ${mcSecs[0]} to ${mcSecs[1]} seconds, and get a new video in which your character follows the motion, with the original sound kept if you want it. It transfers how a body moves; it is not a camera-movement setting.`,
    /* 配图(2026-11-10 Monica):都从这页首屏那条演示片里截 —— 左边真人跳舞是动作参考，右边卡通角色做同样的动作是结果。
       3D 白模、舞台女团那两段的画面她都不要 */
    media: {
      caption: "The moves in the reference video, performed by a new character",
      items: [
        { src: `${G}/motion-reference.jpg`, label: "Motion Video", alt: "Frame from the motion reference video: a woman in a leather jacket dancing with her hands by her face" },
        { src: `${G}/motion-result.jpg`, label: "Result", alt: "The same dance move performed by an animated character after AI motion control" },
      ],
    },
  },
  steps: {
    heading: "How to animate a character with motion control",
    sub: "One photo, one reference clip, one click.",
    items: [
      { title: "Add a character photo", visual: { kind: "file", name: "character.png", meta: "Character", thumb: `${G}/motion-character.jpg` }, body: `Upload one clear photo of who should move, JPG, PNG or WEBP up to ${IMG_MB} MB.` },
      { title: "Add a motion video", visual: { kind: "file", name: "dance-moves.mp4", meta: "Motion Video · 10s", thumb: `${G}/motion-reference.jpg` }, body: `Upload the clip to copy, ${mcSecs[0]} to ${mcSecs[1]} seconds. Choose whether the character faces like the video (better for complex moves) or like the image (better for camera moves, up to 10 seconds).` },
      { title: "Generate and download", visual: { kind: "result", before: `${G}/motion-reference.jpg`, after: `${G}/motion-result.jpg`, label: "MP4" }, body: "Pick Standard or Pro quality, keep or drop the original sound, and optionally describe the scene in a prompt. Then generate and download the video." },
    ],
  },
  uses: {
    heading: "What can you use motion control for?",
    sub: "Reuse one performance across as many characters as you need.",
    items: [
      { title: "Dance and trend videos", body: "Put a brand mascot, model or avatar into a trending routine without a shoot." },
      { title: "Product demos", body: "Have a consistent presenter repeat the same gestures across different outfits or settings." },
      { title: "Localized ads", body: "Keep one proven performance and swap the character for each market." },
      { title: "Character animation", body: "Animate illustrated or AI-generated characters from a filmed reference instead of keyframing." },
    ],
  },
  specs: {
    heading: "Supported inputs, options and pricing",
    items: [
      { label: "Price", value: `${rate(mc, TIER_FACTOR.Pro)} credits per second of the motion video in Pro, ${rate(mc, TIER_FACTOR.Standard)} in Standard. ${SUBSCRIPTION}` },
      { label: "File formats", value: `Photo: ${FORMATS.image}. Video: ${FORMATS.video}.` },
      { label: "Character", value: `${maxFiles(mc, "character")} photo, up to ${IMG_MB} MB` },
      { label: "Motion video", value: `${mcSecs[0]}–${mcSecs[1]} seconds facing like the video; up to 10 seconds facing like the image` },
      { label: "Quality", value: option(mc, "quality").join(" or ") },
      { label: "Sound", value: "Keep or remove the audio from the motion video" },
      { label: "Prompt", value: "Optional, to describe the scene or style" },
      { label: "Model", value: mc.label },
    ],
  },
  faq: {
    heading: "AI motion control FAQ",
    items: [
      { q: "What do I need to use motion control?", a: `One character photo and one motion video of ${mcSecs[0]} to ${mcSecs[1]} seconds. A prompt is optional.` },
      { q: "How long can a motion control video be?", a: `Up to ${mcSecs[1]} seconds when the character faces like the video, and up to 10 seconds when it faces like the image.` },
      { q: "What is the difference between facing like the video and like the image?", a: "Like the video follows the performer's orientation and suits complex moves such as dance. Like the image keeps the pose direction of your photo and follows camera moves better." },
      { q: "Does the result keep the music from my reference video?", a: "Yes, if Keep Original Sound is on. Turn it off to get a silent clip you can score yourself." },
      { q: "How much does AI motion control cost on BuzzVideo?", a: `${rate(mc, TIER_FACTOR.Pro)} credits per second of the motion video in Pro and ${rate(mc, TIER_FACTOR.Standard)} in Standard, so a 10-second clip is ${Math.round(mc.credits.perSecond * 10)} or ${Math.round(mc.credits.perSecond * TIER_FACTOR.Standard * 10)} credits. ${SUBSCRIPTION}` },
      { q: "What kind of character photo works best?", a: "A clear, well-lit photo of the character. Busy backgrounds and cropped limbs make the motion harder to follow." },
      REFUND,
    ],
  },
  related: {
    heading: "More AI tools",
    items: [
      { tool: "character-swap", body: "Replace the people in an existing video." },
      { tool: "render-3d", body: "Turn a 3D blockout into a realistic video." },
      { tool: "video-upscale", body: TO_4K },
    ],
  },
  cta: { heading: "Animate your character", body: "Add a photo and a motion clip to get started.", button: "Add a character photo" },
};

/* ---------------- Video Character Swap ---------------- */
const cs = variant("character-swap");
const csSecs = range(cs, "source");
const CHARACTER_SWAP_GUIDE: ToolGuide = {
  tool: "character-swap",
  cardVideo: `${G}/cards/character-swap.mp4`,
  ogImage: "/prototypes/ai-tools/ai-video-character-swap-og.jpg",
  ...hero("character-swap"),
  metaTitle: "AI Character Swap: Replace People in a Video | BuzzVideo",
  metaDescription: `Replace the people in a video with new characters and keep the moves, camera and scene. ${csSecs[0]}–${csSecs[1]}s clips, up to ${maxFiles(cs, "people")} characters, 1080p output.`,
  definition: {
    heading: "What is AI video character swap?",
    lead: "AI video character swap, also called character replacement or recasting, replaces the people in an existing video with new characters while keeping the original motion, camera work and scene.",
    body: `BuzzVideo AI Video Character Swap recasts finished footage with ${cs.label}. Upload a video of ${csSecs[0]} to ${csSecs[1]} seconds and one to ${maxFiles(cs, "people")} character photos; the photos replace the people in the video from left to right, at up to 1080p.`,
    /* 配图:都从这页首屏的演示片里截(同一个骑摩托的镜头，换人前 / 换人后) */
    media: {
      caption: "The same shot, before and after the swap",
      items: [
        { src: `${G}/character-swap-original.jpg`, label: "Original", alt: "Frame from the original video: a man in a black T-shirt riding a white motorbike on a mountain road" },
        { src: `${G}/character-swap-result.jpg`, label: "Result", alt: "The same shot after AI character swap: a red-haired rider in a varsity jacket on the same motorbike" },
      ],
    },
  },
  steps: {
    heading: "How to replace a person in a video",
    sub: "Upload the video, add the new cast, generate.",
    items: [
      { title: "Upload your video", visual: { kind: "file", name: "ride-clip.mp4", meta: "Video · 8s", thumb: `${G}/character-swap-original.jpg` }, body: `Add a clip of ${csSecs[0]} to ${csSecs[1]} seconds in which no single shot is longer than 15 seconds.` },
      { title: "Add the new characters", visual: { kind: "file", name: "new-rider.png", meta: "Character Image · 1 of 4", thumb: `${G}/character-swap-character.jpg` }, body: `Upload one photo per character, up to ${maxFiles(cs, "people")}. They replace the people in the video from left to right; a prompt can say who replaces whom.` },
      { title: "Generate and download", visual: { kind: "result", before: `${G}/character-swap-original.jpg`, after: `${G}/character-swap-result.jpg`, label: "MP4" }, body: "Choose 768p or 1080p, turn on Enhance Realism for more natural skin and blending, then generate and download." },
    ],
  },
  uses: {
    heading: "What can you use character swap for?",
    sub: "Keep the shot you already have and change who is in it.",
    items: [
      { title: "Ad localization", body: "Reshoot nothing: swap the talent in a winning ad for each market or audience." },
      { title: "Creative testing", body: "Test the same script and edit with different presenters to see who converts." },
      { title: "Brand characters", body: "Put a mascot or a consistent AI model into existing lifestyle footage." },
      { title: "Casting options", body: "Show a client the same scene with different talent before committing to a shoot." },
    ],
  },
  specs: {
    heading: "Supported inputs, options and pricing",
    items: [
      { label: "Price", value: `Credits per second of the source video: ${byRes(cs)}. ${SUBSCRIPTION}` },
      { label: "File formats", value: `Video: ${FORMATS.video}. Photos: ${FORMATS.image} each.` },
      { label: "Video", value: `${csSecs[0]}–${csSecs[1]} seconds, no single shot longer than 15 seconds` },
      { label: "Characters", value: `1–${maxFiles(cs, "people")} photos, one per character` },
      { label: "Resolution", value: option(cs, "resolution").join(" or ") },
      { label: "Enhance Realism", value: "Optional, for more natural skin and blending" },
      { label: "Prompt", value: "Optional, to say who replaces whom" },
      { label: "Model", value: cs.label },
    ],
  },
  faq: {
    heading: "AI video character swap FAQ",
    items: [
      { q: "How many people can I replace in one video?", a: `Up to ${maxFiles(cs, "people")}. Upload one photo per character; they are matched to the people in the video from left to right.` },
      { q: "Does character swap keep the original movement and camera?", a: "That is what it is built for: the moves, camera motion, timing and background are kept, and only the people change." },
      { q: "How long can a character swap video be?", a: `${csSecs[0]} to ${csSecs[1]} seconds, and no single shot can run longer than 15 seconds.` },
      { q: "How do I control who replaces whom?", a: "By default the photos replace people from left to right. To be specific, add a prompt such as: @Image1 replaces the woman on the left." },
      { q: "How many credits does AI character swap use?", a: `Credits per second of the source video: ${byRes(cs)}. A 10-second clip is ${totalByRes(cs, 10)} credits. ${SUBSCRIPTION}` },
      { q: "Is this the same as a face swap?", a: "No. A face swap changes only the face. Character swap replaces the whole person with the character in your photo." },
      REFUND,
    ],
  },
  related: {
    heading: "More AI tools",
    items: [
      { tool: "motion-control", body: "Make a character copy the moves in a video." },
      { tool: "render-3d", body: "Turn a 3D blockout into a realistic video." },
      { tool: "lip-sync", body: "Change what the person in a video says." },
    ],
  },
  cta: { heading: "Recast your video", body: "Upload a clip and the new characters to get started.", button: "Upload a video" },
};

/* ---------------- 3D to Video ---------------- */
const r3 = variant("render-3d");
const r3Secs = range(r3, "source");
const RENDER_3D_GUIDE: ToolGuide = {
  tool: "render-3d",
  cardVideo: `${G}/cards/render-3d.mp4`,
  ogImage: "/prototypes/ai-tools/ai-3d-to-video-og.jpg",
  ...hero("render-3d"),
  metaTitle: "3D to Video AI: Blockouts and Previz to Video | BuzzVideo",
  metaDescription: `Turn a 3D blockout or previz into a photoreal video that keeps your camera and timing. Up to ${r3Secs[1]}s, up to ${maxFiles(r3, "refs")} look references, 1080p output.`,
  definition: {
    heading: "What is 3D-to-video AI?",
    lead: "3D-to-video AI renders a rough 3D blockout or previz as a realistic video, keeping the camera moves, staging and timing you already set.",
    body: `BuzzVideo AI 3D to Video takes a viewport or clay render exported from Blender, Unreal Engine, Cinema 4D or Maya and finishes it with ${r3.label}. Upload a 3D render up to ${r3Secs[1]} seconds, add up to ${maxFiles(r3, "refs")} look references or let the AI create them, and get a finished video at up to 1080p.`,
    /* 配图(2026-11-10 Monica):都用这页首屏那组水上飞机素材(白模 / 成片同一时刻)。跳舞的白模和舞台女团画面全部不用 */
    media: {
      caption: "The same shot as a 3D blockout and as the finished video",
      items: [
        { src: `${G}/3d-plane-before.jpg`, label: "3D Render", alt: "Untextured 3D blockout frame: a seaplane flying over grey clay hills and flat water" },
        { src: `${G}/3d-plane-after.jpg`, label: "AI Video", alt: "The same shot rendered as a realistic video: a red and white seaplane flying past a rocky coastline over blue sea" },
      ],
    },
  },
  steps: {
    heading: "How to turn a 3D render into a video",
    sub: "Block it in 3D, then let the AI do the lighting, materials and people.",
    items: [
      { title: "Upload your 3D render", visual: { kind: "file", name: "seaplane-blockout.mp4", meta: "3D Render · 8s", thumb: `${G}/3d-plane-before.jpg` }, body: `Add a blockout or previz clip up to ${r3Secs[1]} seconds and 32 shots.` },
      { title: "Set the look", visual: { kind: "choice", label: "Auto Look References", options: option(r3, "looks"), selected: "2" }, body: `Upload up to ${maxFiles(r3, "refs")} look references for the environment, subject and details. With none, the AI first creates 1, 2, 4 or 8 references and renders to match them. A prompt can say what your blocks stand for.` },
      { title: "Generate and download", visual: { kind: "result", before: `${G}/3d-plane-before.jpg`, after: `${G}/3d-plane-after.jpg`, label: "MP4" }, body: "Choose 480p, 768p or 1080p, generate, and compare the result with your render." },
    ],
  },
  uses: {
    heading: "What can you use 3D to video for?",
    sub: "Direct the shot in 3D and skip the render farm.",
    items: [
      { title: "Ad previz to final", body: "Turn an approved animatic into a finished-looking spot without modeling, texturing and lighting every asset." },
      { title: "Product films", body: "Block a product move in 3D and render it in a real-world setting." },
      { title: "Pitch and concept videos", body: "Show clients a realistic version of a storyboard before committing budget." },
      { title: "Stage and event visuals", body: "Plan choreography and camera in a blockout and see it as a lit performance." },
    ],
  },
  specs: {
    heading: "Supported inputs, options and pricing",
    items: [
      { label: "Price", value: `Credits per second of the 3D render: ${byRes(r3)}. ${SUBSCRIPTION}` },
      { label: "File formats", value: `Render: ${FORMATS.video}. Look references: ${FORMATS.image} each.` },
      { label: "3D render", value: `Up to ${r3Secs[1]} seconds and 32 shots` },
      { label: "Look references", value: `Optional, up to ${maxFiles(r3, "refs")} images` },
      { label: "Auto look references", value: `${option(r3, "looks").join(", ")} (when you upload none)` },
      { label: "Resolution", value: option(r3, "resolution").join(", ") },
      { label: "Prompt", value: "Optional, to say what your blocks stand for" },
      { label: "Model", value: r3.label },
    ],
  },
  faq: {
    heading: "AI 3D to video FAQ",
    items: [
      { q: "What kind of 3D file do I upload?", a: "A video of your render, not the 3D scene file. Export a blockout, grey-box or previz clip from Blender, Unreal Engine, Cinema 4D, Maya or any other 3D software and upload it as a video." },
      { q: "Does 3D to video keep my camera moves?", a: "Yes. The camera path, staging and timing of your render are kept; the AI adds materials, lighting, people and environment." },
      { q: "Do I need look references?", a: `No. With no references, the AI creates its own first and renders to match them. Upload up to ${maxFiles(r3, "refs")} when you want control over the environment, subject or details.` },
      { q: "How long can the 3D render be?", a: `Up to ${r3Secs[1]} seconds and 32 shots per run.` },
      { q: "How much does 3D to video cost on BuzzVideo?", a: `Credits per second of the render: ${byRes(r3)}. A 10-second clip is ${totalByRes(r3, 10)} credits. ${SUBSCRIPTION}` },
      { q: "How do I tell the AI what a block is?", a: "Use the prompt. For example: the moving box is a red sports car." },
      REFUND,
    ],
  },
  related: {
    heading: "More AI tools",
    items: [
      { tool: "motion-control", body: "Make a character copy the moves in a video." },
      { tool: "character-swap", body: "Replace the people in an existing video." },
      { tool: "video-upscale", body: TO_4K },
    ],
  },
  cta: { heading: "Render your blockout", body: "Upload a 3D render to get started.", button: "Upload a 3D render" },
};

/* ---------------- Lip Sync ---------------- */
const lsK = variant("lip-sync", "kling-lipsync");
const lsH = variant("lip-sync", "h3-max-lipsync");
const lsKv = range(lsK, "source");
const lsKa = range(lsK, "speech");
const lsHv = range(lsH, "source");
const LIP_SYNC_GUIDE: ToolGuide = {
  tool: "lip-sync",
  cardVideo: `${G}/cards/lip-sync.mp4`,
  ogImage: "/prototypes/ai-tools/ai-lip-sync-og.jpg",
  ...hero("lip-sync"),
  metaTitle: "AI Lip Sync: Sync Video to New Audio or a Script | BuzzVideo",
  metaDescription: `Sync the lips in a video to new audio or a typed script. Short clips with ${lsK.label}, or videos up to ${mins(lsHv[1])} with ${lsH.label}.`,
  definition: {
    heading: "What is AI lip sync?",
    lead: "AI lip sync changes the mouth movement of a person in a video so it matches new speech, from an audio file or a typed script.",
    body: `BuzzVideo AI Lip Sync is a lip sync video generator for re-voicing ad footage without a reshoot. It offers two models: ${lsK.label} for ${lsKv[0]}–${lsKv[1]} second clips, with uploaded audio or a typed script read by a preset voice, and ${lsH.label} for videos from ${lsHv[0]} seconds to ${mins(lsHv[1])} with your own audio.`,
    /* 配图(2026-11-10):从这页首屏的演示片(Monica 的素材库链接，已同意下载截帧)里截两帧嘴型明显不同的画面。
       两帧都是对好口型的成片，所以标签写时间点，不写 Original / Result —— 那条片子没有改口型前的版本 */
    media: {
      caption: "Two moments from a lip-synced clip: the mouth follows the new speech",
      items: [
        { src: `${G}/lip-sync-frame-1.jpg`, label: "0:09", alt: "Frame from a lip-synced video: a woman in a pink dress holding a lipstick, lips closed between words" },
        { src: `${G}/lip-sync-frame-2.jpg`, label: "0:05", alt: "Another frame from the same lip-synced video: the woman mid-word with her mouth open" },
      ],
    },
  },
  steps: {
    heading: "How to lip sync a video online",
    sub: "Upload the video, add the new words, generate.",
    items: [
      { title: "Upload your video", visual: { kind: "file", name: "lipstick-ad.mp4", meta: "Video · 10s", thumb: `${G}/lip-sync-frame-1.jpg` }, body: `Add a clip with a clear face: ${lsKv[0]}–${lsKv[1]} seconds for ${lsK.label}, or ${lsHv[0]} seconds to ${mins(lsHv[1])} for ${lsH.label}.` },
      { title: "Add the new speech", visual: { kind: "choice", label: "What should they say?", options: option(lsK, "from"), selected: "Upload audio" }, body: `Upload an audio file, or with ${lsK.label} type a script and pick one of ${option(lsK, "voice").length} English preset voices and a speed from 0.8x to 2x.` },
      { title: "Generate and download", visual: { kind: "result", after: `${G}/lip-sync-frame-2.jpg`, label: "MP4" }, body: "Generate, switch between the result and the original to check the sync, then download." },
    ],
  },
  uses: {
    heading: "What can you use lip sync for?",
    sub: "Change the words without booking the talent again.",
    items: [
      { title: "Script fixes", body: "Correct a price, a date or a product name in a finished ad without a reshoot." },
      { title: "Ad variations", body: "Record one take and produce several hooks or offers from it." },
      { title: "Dubbing and localization", body: "Upload a translated voice track and match the speaker's lips to it." },
      { title: "UGC and avatars", body: "Give creator clips and AI presenters new lines for each campaign." },
    ],
  },
  specs: {
    heading: "Supported inputs, models and pricing",
    items: [
      { label: "Price", value: `Credits per second of video: ${lsK.credits.perSecond} with ${lsK.label}; ${byRes(lsH)} with ${lsH.label}. ${SUBSCRIPTION}` },
      { label: lsK.label, value: `Video ${lsKv[0]}–${lsKv[1]} seconds; audio ${lsKa[0]}–${lsKa[1]} seconds or a typed script; keeps the original quality` },
      { label: lsH.label, value: `Video ${lsHv[0]} seconds to ${mins(lsHv[1])}; uploaded audio only; output ${option(lsH, "resolution").join(" or ")}` },
      { label: "Typed script", value: `${option(lsK, "voice").length} English preset voices, speed ${option(lsK, "speed")[0]} to ${option(lsK, "speed").at(-1)}` },
      { label: "If lengths differ", value: `${lsH.label}: ${option(lsH, "fit").join(", ")}` },
      { label: "File formats", value: `Video: ${FORMATS.video}. Audio: ${FORMATS.audio}.` },
    ],
  },
  faq: {
    heading: "AI lip sync FAQ",
    items: [
      { q: "Can I lip sync a video without recording audio?", a: `Yes, with ${lsK.label}. Type a script, pick a preset English voice and a speed, and the tool generates the speech and syncs the lips to it.` },
      { q: "How long can a lip-sync video be?", a: `${lsKv[0]}–${lsKv[1]} seconds with ${lsK.label}, and from ${lsHv[0]} seconds to ${mins(lsHv[1])} with ${lsH.label}.` },
      { q: "Which model should I choose?", a: `Use ${lsK.label} for short clips, when you want to type a script, or when you need the original resolution kept. Use ${lsH.label} for longer videos with your own audio.` },
      { q: "What if my audio and video are different lengths?", a: `With ${lsH.label} you choose: Trim cuts to the shorter one, Loop repeats the video, Bounce plays it forward then back, and Pad adds silence to the audio (the audio cannot be longer than the video).` },
      { q: "Can I use my own voice?", a: "Yes. Record or generate the speech as an audio file and upload it. The preset voices only apply when you type a script." },
      { q: "How much does AI lip sync cost on BuzzVideo?", a: `Credits per second of video: ${lsK.credits.perSecond} with ${lsK.label}, and ${byRes(lsH)} with ${lsH.label}. ${SUBSCRIPTION}` },
      { q: "How is lip sync different from a talking avatar?", a: "Lip Sync starts from an existing video and re-syncs the mouth to new speech. Talking Avatar starts from a still photo and generates the whole video." },
      { q: "What kind of video works best?", a: "A clip where the face is clear, well lit and mostly facing the camera. Covered mouths, extreme profiles and very fast head turns sync less accurately." },
      REFUND,
    ],
  },
  related: {
    heading: "More AI tools",
    items: [
      { tool: "talking-avatar", body: "Turn one photo and a voice track into a talking video." },
      { tool: "character-swap", body: "Replace the people in an existing video." },
      { tool: "video-upscale", body: TO_4K },
    ],
  },
  cta: { heading: "Give your video new lines", body: "Upload a clip with a clear face to get started.", button: "Upload a video" },
};

/* ---------------- Talking Avatar ---------------- */
const taK = variant("talking-avatar", "kling-avatar");
const taH = variant("talking-avatar", "h3-max");
const taKa = range(taK, "voice");
const taHa = range(taH, "voice");
const TALKING_AVATAR_GUIDE: ToolGuide = {
  tool: "talking-avatar",
  cardVideo: `${G}/cards/talking-avatar.mp4`,
  ogImage: "/prototypes/ai-tools/ai-talking-avatar-og.jpg",
  ...hero("talking-avatar"),
  metaTitle: "AI Talking Avatar: Make a Photo Talk Online | BuzzVideo",
  metaDescription: `Turn one photo and a voice track into a talking video. Up to ${mins(taKa[1])} with ${taK.label}, or up to ${mins(taHa[1])} and 2K with ${taH.label}.`,
  definition: {
    heading: "What is an AI talking avatar?",
    lead: "An AI talking avatar, also called a talking photo, is a video of a person or character, generated from a single photo, that speaks your audio with matching lip movement and natural expressions.",
    body: `BuzzVideo AI Talking Avatar makes presenter videos for ads and product pages from one photo and one voice track. It offers two models: ${taK.label} for expressive delivery you can direct with a prompt, with audio up to ${mins(taKa[1])}, and ${taH.label} for long videos up to ${mins(taHa[1])} at up to 2K.`,
    /* 配图:和这页首屏的演示片是同一个人(之前用的是另一位男士的样片，和首屏对不上) */
    media: {
      caption: "One photo in, a talking video out",
      items: [
        { src: `${G}/talking-avatar-photo.jpg`, label: "Photo", alt: "Portrait of a young woman with blue sunglasses on her head, used as the source photo for an AI talking avatar" },
        { src: `${G}/talking-avatar-result.jpg`, label: "Talking Video", alt: "Frame from the generated talking avatar video: the same woman speaking to camera" },
      ],
    },
  },
  steps: {
    heading: "How to make a photo talk",
    sub: "A photo, a voice track, and one click.",
    items: [
      { title: "Upload a photo", visual: { kind: "file", name: "presenter.jpg", meta: "Photo", thumb: `${G}/talking-avatar-photo.jpg` }, body: `Add one clear photo, JPG, PNG or WEBP up to ${IMG_MB} MB. ${taK.label} also works with animals and cartoon characters.` },
      { title: "Add the voice", visual: { kind: "file", name: "voiceover.mp3", meta: "Voice Audio · 16s", icon: "audio" }, body: `Upload the speech to lip-sync to: up to ${mins(taKa[1])} with ${taK.label}, or ${taHa[0]} seconds to ${mins(taHa[1])} with ${taH.label}.` },
      { title: "Generate and download", visual: { kind: "result", after: `${G}/talking-avatar-result.jpg`, label: "MP4" }, body: `With ${taK.label}, add an optional prompt to direct the delivery. With ${taH.label}, pick a resolution from 480p to 2K. Then generate and download.` },
    ],
  },
  uses: {
    heading: "What can you use a talking avatar for?",
    sub: "Put a face on any script without a camera.",
    items: [
      { title: "UGC-style ads", body: "Create presenter-led product videos from a model photo and a voiceover." },
      { title: "Product explainers", body: "Turn a recorded or AI-generated voiceover into a spokesperson video for a landing page or listing." },
      { title: "Localization", body: "Keep the same presenter and swap the voice track for each language." },
      { title: "Training and updates", body: "Produce long talking videos, up to 15 minutes, from one photo." },
    ],
  },
  specs: {
    heading: "Supported inputs, models and pricing",
    items: [
      { label: "Price", value: `Credits per second of audio: ${taK.credits.perSecond} with ${taK.label}; ${byRes(taH)} with ${taH.label}. ${SUBSCRIPTION}` },
      { label: taK.label, value: `Person, animal or cartoon photo; audio up to ${mins(taKa[1])}; optional prompt to direct the delivery` },
      { label: taH.label, value: `One clear photo of a person; audio ${taHa[0]} seconds to ${mins(taHa[1])}; output ${option(taH, "resolution").join(", ")}` },
      { label: "File formats", value: `Photo: ${FORMATS.image}. Audio: ${FORMATS.audio}.` },
      { label: "Video length", value: "Matches the length of your audio" },
    ],
  },
  faq: {
    heading: "AI talking avatar FAQ",
    items: [
      { q: "What do I need to make a talking avatar?", a: "One photo and one audio file with the speech. The video is as long as the audio." },
      { q: "How long can a talking avatar video be?", a: `Up to ${mins(taKa[1])} with ${taK.label} and up to ${mins(taHa[1])} with ${taH.label}.` },
      { q: "Which model should I choose?", a: `Use ${taK.label} for natural expressions and head movement, for non-human characters, or when you want to direct the delivery with a prompt. Use ${taH.label} for long videos and for output up to 2K.` },
      { q: "Can I use a cartoon or an animal?", a: `Yes, with ${taK.label}. ${taH.label} works best with a clear photo of a person.` },
      { q: "Can I type a script instead of uploading audio?", a: "Not on this page. Record the speech yourself, or generate it with AI Voiceover in BuzzVideo, then upload the audio file here." },
      { q: "How much does an AI talking avatar cost on BuzzVideo?", a: `Credits per second of audio: ${taK.credits.perSecond} with ${taK.label}, and ${byRes(taH)} with ${taH.label}. ${SUBSCRIPTION}` },
      { q: "How is this different from lip sync?", a: "Talking Avatar starts from a still photo and generates the whole video. Lip Sync starts from an existing video and re-syncs the mouth to new speech." },
      REFUND,
    ],
  },
  related: {
    heading: "More AI tools",
    items: [
      { tool: "lip-sync", body: "Change what the person in an existing video says." },
      { tool: "motion-control", body: "Make a character copy the moves in a video." },
      { tool: "upscale", body: "Sharpen the photo before you animate it." },
    ],
  },
  cta: { heading: "Make your photo talk", body: "Upload a photo and a voice track to get started.", button: "Upload a photo" },
};

/** 工具 → 内容 */
export const GUIDES: Partial<Record<ToolKey, ToolGuide>> = {
  upscale: UPSCALE_GUIDE,
  "video-upscale": VIDEO_UPSCALE_GUIDE,
  "motion-control": MOTION_CONTROL_GUIDE,
  "character-swap": CHARACTER_SWAP_GUIDE,
  "render-3d": RENDER_3D_GUIDE,
  "lip-sync": LIP_SYNC_GUIDE,
  "talking-avatar": TALKING_AVATAR_GUIDE,
};
