// 免费工具落地页的文案(2026-11-19)。规则：首屏两句(先定义、带 BuzzVideo,不写价格 / 积分);FAQ 第一句直接回答;
// 只写核实过的事实(平台规格见 specs.ts);AI 写作类的示例输出是虚构品牌 LUMEA 的示意，页面上标 Example。

import { SIGNUP_CREDITS } from "../tools/credits";
import type { WriterSpec } from "./tools/AiWriter";
import { SRC } from "./specs";

export type QA = { q: string; a: string };
export type FreeKind = "resizer" | "safe" | "image" | "gif" | "compress" | "sizes" | "writer";
export type FreeTool = {
  slug: string;
  name: string;
  kind: FreeKind;
  /** local = 真在浏览器里跑;agent = 打开 Marketing Agent;guide = 参考表 */
  runs: "local" | "agent" | "guide";
  h1: string;
  lead: string;
  card: string;
  steps: { title: string; body: string }[];
  faq: QA[];
  related: string[];
  sources?: { label: string; url: string }[];
  writer?: WriterSpec;
  examples?: { title: string; input: string; output: string }[];
};

const LOCAL_FAQ = (what: string): QA => ({
  q: `Is my ${what} uploaded anywhere?`,
  a: `No. The file is opened and processed by your browser on your own device; BuzzVideo never receives it. Closing the tab clears it.`,
});

export const FREE_TOOLS: FreeTool[] = [
  {
    slug: "video-resizer",
    name: "Video Resizer",
    kind: "resizer",
    runs: "local",
    h1: "Free video resizer",
    lead: "BuzzVideo's Video Resizer is a free browser tool that converts a video to 9:16, 1:1, 4:5 or 16:9 by cropping or padding it. You preview the new frame live and export it on your own device, with no upload and no sign-up.",
    card: "Reframe a video to 9:16, 1:1, 4:5 or 16:9",
    steps: [
      { title: "Choose a video", body: "Pick an MP4, MOV or WebM file from your device. It opens in the browser and is never uploaded." },
      { title: "Pick the new ratio", body: "Choose 9:16, 1:1, 4:5 or 16:9, then crop to fill and slide the crop position, or fit the whole frame on a blurred, black or white background." },
      { title: "Export and download", body: "The tool plays the clip once and records the new frame. When it finishes, download the file: MP4 in recent Chrome, Edge and Safari, WebM in browsers that can't record MP4, such as Firefox." },
    ],
    faq: [
      { q: "How do I resize a video for Instagram Reels or TikTok?", a: "Choose 9:16 in the Video Resizer, crop to fill or fit with a background, then export. Meta recommends 9:16 at 1440 × 2560 for Reels; this tool exports 1080 × 1920, which keeps the same ratio." },
      { q: "What format does the video resizer export?", a: "It exports MP4 (H.264 with AAC audio) in recent versions of Chrome, Edge and Safari. Browsers that can't record MP4, such as Firefox, export WebM instead, which Meta and TikTok ad uploads don't accept, so use Chrome, Edge or Safari for ad files. The tool shows the format before you export." },
      LOCAL_FAQ("video"),
      { q: "Why does exporting take as long as the video?", a: "Because the browser re-records the clip in real time while it plays. A 30-second video takes about 30 seconds; keep the tab open and in front until it finishes." },
      { q: "Will resizing change the video quality?", a: "Yes, slightly. The video is re-encoded at about 8 Mbps for 1080p and 4 Mbps for 720p, and cropping enlarges part of the frame. Start from the highest-quality source you have." },
      { q: "Is there a file size or length limit?", a: "There is no fixed limit, but very long or 4K files use a lot of memory in the browser. Clips under a few minutes work best." },
    ],
    related: ["safe-zone-checker", "video-compressor", "ad-size-guide", "video-to-gif"],
    sources: [SRC.metaIgReelsVideo, SRC.metaFbFeedVideo],
  },
  {
    slug: "safe-zone-checker",
    name: "Safe Zone Checker",
    kind: "safe",
    runs: "local",
    h1: "Safe zone checker",
    lead: "BuzzVideo's Safe Zone Checker is a free tool that lays TikTok, Instagram Reels, Stories and YouTube Shorts interface safe zones over your own frame. Upload an image or video, scrub to any moment and see which text or logos the app buttons and captions will cover.",
    card: "See where TikTok, Reels and Shorts UI covers your ad",
    steps: [
      { title: "Upload a frame", body: "Drop in a 9:16 image or video. For video, drag the slider to the frame you want to check. Nothing leaves your device." },
      { title: "Pick the platform", body: "Switch between TikTok, Instagram Reels, Facebook and Instagram Stories, and YouTube Shorts. The shaded areas are where each app draws its own interface." },
      { title: "Move what's covered", body: "Keep headlines, logos, prices and faces inside the orange safe zone. Anything in the shaded areas may sit under captions, buttons or the profile row." },
    ],
    faq: [
      { q: "What is the Instagram Reels safe zone?", a: "Meta recommends keeping about 14% at the top, 35% at the bottom and 6% on each side of a Reels ad free of text and logos. On a 1080 × 1920 frame that is roughly 269 px at the top, 672 px at the bottom and 65 px per side." },
      { q: "What is the TikTok safe zone in pixels?", a: "TikTok doesn't publish numbers; it publishes template files. Measured from TikTok's In-Feed Standard LTR template, the safe area at 1080 × 1920 sits 240 px from the top, 660 px from the bottom and 120 px from each side, with a 180 px button column on the right." },
      { q: "What is the YouTube Shorts safe zone?", a: "Google's vertical video ad diagram for 1080 × 1920 keeps 288 px at the top, 672 px at the bottom, 48 px on the left and 192 px on the right clear of logos, products and supers." },
      { q: "Are Stories and Reels safe zones the same?", a: "Yes, in Meta's current Ads Guide. Both Instagram Stories and Facebook Stories specs give the same 14% top, 35% bottom and 6% side guidance as Reels." },
      LOCAL_FAQ("file"),
      { q: "Why does my frame look cropped?", a: "If the file isn't 9:16, the checker fills the vertical frame the way most vertical placements display it. Resize it to 9:16 first for an exact check." },
    ],
    related: ["video-resizer", "ad-size-guide", "image-resizer", "tiktok-caption-generator"],
    sources: [SRC.metaIgReelsVideo, SRC.metaIgStoryImage, SRC.metaFbStoryVideo, SRC.youtube, SRC.tiktokSpec, SRC.tiktokMeasured],
  },
  {
    slug: "image-resizer",
    name: "Image Resizer for Facebook Ads",
    kind: "image",
    runs: "local",
    h1: "Image resizer for Facebook ads",
    lead: "BuzzVideo's Image Resizer is a free tool that resizes a photo to Meta's ad sizes: 4:5 for Feed, 9:16 for Stories and Reels, plus 1:1 and 1.91:1. It crops or pads the image in your browser and saves a PNG or JPG, with nothing uploaded.",
    card: "Resize images to Meta ad sizes, then save PNG or JPG",
    steps: [
      { title: "Choose an image", body: "Pick a JPG, PNG or WebP. It opens in your browser and is not uploaded." },
      { title: "Pick an ad size", body: "Feed 4:5 (1440 × 1800) and Stories & Reels 9:16 (1440 × 2560) are Meta's recommended sizes. Square and 1.91:1 landscape are also supported in Feed." },
      { title: "Crop or pad, then download", body: "Crop to fill and slide the crop position, or fit the whole image on white, black or a blurred copy. Save as JPG for a smaller file or PNG for lossless." },
    ],
    faq: [
      { q: "What size should a Facebook ad image be?", a: "Meta recommends 4:5 at 1440 × 1800 pixels for Facebook Feed image ads, as a JPG or PNG up to 30 MB. For Stories and Reels, use 9:16 at 1440 × 2560." },
      { q: "What image ratios does Instagram Feed accept?", a: "Meta's Ads Guide lists 4:5 as recommended and supports ratios from 1.91:1 to 4:5 in Instagram Feed, with a 1% tolerance." },
      { q: "Should I use JPG or PNG for ads?", a: "Use JPG for photos because it is much smaller; use PNG for graphics with sharp text or flat color. Meta accepts both, up to 30 MB." },
      LOCAL_FAQ("image"),
      { q: "Can I resize several images at once?", a: "Not yet. Resize and download one image at a time; the settings stay selected for the next image." },
    ],
    related: ["ad-size-guide", "safe-zone-checker", "video-resizer", "ai-ad-copy-generator"],
    sources: [SRC.metaFbFeedImage, SRC.metaIgFeedImage, SRC.metaIgStoryImage],
  },
  {
    slug: "video-to-gif",
    name: "Video to GIF",
    kind: "gif",
    runs: "local",
    h1: "Video to GIF converter",
    lead: "BuzzVideo's Video to GIF is a free converter that turns up to 10 seconds of any video into a looping animated GIF. You pick the start, length, width and frame rate, and the GIF is built in your browser, so the video never leaves your device.",
    card: "Turn up to 10 seconds of video into a looping GIF",
    steps: [
      { title: "Choose a video", body: "Pick an MP4, MOV or WebM file. It plays in your browser, not on a server." },
      { title: "Set the clip", body: "Drag Start to the moment you want, set the length (up to 10 seconds), then pick a width of 320, 480 or 640 px and a frame rate of 8, 12 or 15 fps." },
      { title: "Convert and download", body: "The tool reads each frame, builds a 256-color palette and encodes the GIF. Preview it, then download." },
    ],
    faq: [
      { q: "How do I turn a video into a GIF for free?", a: "Open the Video to GIF tool, choose your video, set the start and length, and click Convert to GIF. It runs in your browser with no sign-up and no watermark." },
      { q: "Why is my GIF bigger than the video?", a: "GIF is an old format with weak compression and no inter-frame prediction, so it is usually larger than the MP4 it came from. Use a shorter clip, 320 or 480 px width, or 8 fps to shrink it." },
      { q: "Does the GIF keep sound?", a: "No. GIF has no audio track. Use the Video Compressor if you need a small file with sound." },
      { q: "Why do gradients look banded?", a: "A GIF can hold only 256 colors. The tool picks the best 256 from your clip, but smooth skies and skin gradients can still show bands." },
      LOCAL_FAQ("video"),
    ],
    related: ["video-compressor", "video-resizer", "safe-zone-checker", "ai-hook-generator"],
  },
  {
    slug: "video-compressor",
    name: "Video Compressor",
    kind: "compress",
    runs: "local",
    h1: "Free video compressor",
    lead: "BuzzVideo's Video Compressor is a free browser tool that makes a video file smaller by re-encoding it at a lower bitrate and, if you choose, a lower resolution. It shows an estimated size first and runs entirely on your device, so nothing is uploaded.",
    card: "Shrink a video file in your browser",
    steps: [
      { title: "Choose a video", body: "Pick an MP4, MOV or WebM. You'll see its size, length and resolution." },
      { title: "Pick a preset", body: "Light keeps up to 1080p at 4 Mbps, Balanced up to 720p at 2 Mbps, and Smallest up to 480p at 0.8 Mbps. You can also drop the audio." },
      { title: "Compress and compare", body: "The video is re-encoded in real time. Compare the result with the original and download it only if it's smaller." },
    ],
    faq: [
      { q: "How do I compress a video without uploading it?", a: "Use BuzzVideo's Video Compressor: it re-encodes the file inside your browser with MediaRecorder, so the video never leaves your computer." },
      { q: "What format does the compressor output?", a: "MP4 (H.264 with AAC audio) in recent Chrome, Edge and Safari. Browsers that can't record MP4, such as Firefox, save WebM, which ad platforms like Meta don't accept; use Chrome, Edge or Safari, or a desktop encoder such as HandBrake, if you need MP4." },
      { q: "Why is the compressed file sometimes bigger?", a: "If the original was already efficiently encoded, re-encoding at the chosen bitrate can't make it smaller. The tool tells you when that happens; keep the original or try Smallest." },
      { q: "How long does compression take?", a: "About as long as the video plays, because browsers encode in real time. Keep the tab open and in front." },
      { q: "Is this as good as HandBrake or FFmpeg?", a: "No. Browser encoders are built for live video and are less efficient than desktop two-pass encoders. This tool trades some quality for convenience and privacy." },
      LOCAL_FAQ("video"),
    ],
    related: ["video-resizer", "video-to-gif", "ad-size-guide", "safe-zone-checker"],
  },
  {
    slug: "ad-size-guide",
    name: "Meta Ad Size Guide",
    kind: "sizes",
    runs: "guide",
    h1: "Meta ad size guide",
    lead: "BuzzVideo's Meta Ad Size Guide lists the recommended Facebook and Instagram ad sizes for Feed, Stories and Reels in one table: ratio, resolution, file types, file size limits and safe zones. Every value comes from Meta's own Ads Guide, linked in each row.",
    card: "Every Meta ad size, ratio and limit in one table",
    steps: [
      { title: "Find your placement", body: "Look up the Feed, Stories or Reels row for your image or video ad." },
      { title: "Build at the recommended size", body: "Export at the listed ratio and resolution. 4:5 at 1440 × 1800 for Feed; 9:16 at 1440 × 2560 for Stories and Reels." },
      { title: "Check the safe zone", body: "For 9:16 placements, keep text and logos out of the top 14%, bottom 35% and 6% on each side. Test it with the Safe Zone Checker." },
    ],
    faq: [
      { q: "What is the best size for Instagram Reels ads?", a: "9:16 at 1440 × 2560 pixels, per Meta's Ads Guide, with videos up to 4 GB and 0 seconds to 15 minutes long." },
      { q: "What size are Facebook Feed ads?", a: "Meta recommends 4:5 at 1440 × 1800 for both image and video Feed ads. Images can be JPG or PNG up to 30 MB; videos MP4, MOV or GIF up to 4 GB." },
      { q: "What size are Instagram Stories ads?", a: "9:16 at 1440 × 2560 pixels. Leave about 14% at the top, 35% at the bottom and 6% on each side free of text and logos." },
      { q: "Can one video work across Feed, Stories and Reels?", a: "Yes, if you design for 9:16 and keep key content in the center safe zone, then make a 4:5 version for Feed. The Video Resizer makes the 4:5 cut in your browser." },
      { q: "How current is this guide?", a: "Each row was checked against Meta's Ads Guide on November 23, 2026, and links to the page it came from. Meta updates specs from time to time, so check the linked page before a big launch." },
    ],
    related: ["image-resizer", "video-resizer", "safe-zone-checker", "ai-ad-copy-generator"],
    sources: [SRC.metaFbFeedImage, SRC.metaFbFeedVideo, SRC.metaIgFeedImage, SRC.metaIgFeedVideo, SRC.metaIgStoryImage, SRC.metaFbStoryVideo, SRC.metaIgReelsVideo],
  },
  /* ── AI 写作类：表单 → Marketing Agent ── */
  {
    slug: "ai-hook-generator",
    name: "AI Hook Generator",
    kind: "writer",
    runs: "agent",
    h1: "AI hook generator",
    lead: "BuzzVideo's AI Hook Generator writes the opening line of a short video ad: the first two seconds that decide whether people keep watching. Describe your product and audience below, and BuzzVideo's Marketing Agent drafts hook options you can turn straight into video.",
    card: "Opening lines for TikTok, Reels and Shorts ads",
    steps: [
      { title: "Describe the product", body: "Add the product or offer, who it's for and one detail that makes it different." },
      { title: "Open the Marketing Agent", body: "Your brief opens in BuzzVideo's Marketing Agent, which drafts hook options in several styles: question, bold claim, problem, before-and-after." },
      { title: "Turn hooks into videos", body: "Ask the agent to make the best hooks into short video variants, or copy them into your own edit." },
    ],
    faq: [
      { q: "What is a hook in a video ad?", a: "A hook is the first line or shot of a video ad, usually the first one to three seconds, written to stop the scroll. It names a problem, makes a claim or opens a question the rest of the ad answers." },
      { q: "Is the AI Hook Generator free?", a: `Signing up is free, and the Marketing Agent is included on the Free plan. New accounts get ${SIGNUP_CREDITS} free credits, which work on Seedream 4.5 and Seedream 5.0 Lite images and Seed Audio 1.0 voiceovers; video models need a Starter, Pro or Ultra plan.` },
      { q: "How many hooks should I test?", a: "Test several. Hooks are the cheapest part of an ad to change, so marketers usually write five to ten and keep the two or three that hold viewers longest." },
      { q: "Can the agent make the hook into a video?", a: "Yes. In the same Marketing Agent chat you can ask it to produce video variants of each hook, using the video models your plan includes." },
    ],
    related: ["ai-ad-script-generator", "ai-ad-copy-generator", "tiktok-caption-generator", "safe-zone-checker"],
    writer: {
      option: { label: "Hook style", values: ["Mixed", "Question", "Bold claim", "Problem first", "Before & after"] },
      productHint: "e.g. LUMEA vitamin C serum",
      audienceHint: "e.g. women 25–34 with dull skin",
      extraLabel: "Key benefit or proof (optional)",
      extraHint: "e.g. visible glow in 7 days",
      cta: "Write hooks in Marketing Agent",
      build: ({ product, audience, option, extra }) =>
        `Write 10 scroll-stopping opening hooks (first 2 seconds, under 12 words each) for a short video ad.\nProduct: ${product}\nAudience: ${audience}${extra ? `\nKey benefit: ${extra}` : ""}\nStyle: ${option === "Mixed" ? "mix question, bold claim, problem-first and before-and-after hooks" : option}.\nFor each hook, add the matching opening shot.`,
    },
    examples: [
      { title: "Question hook", input: "LUMEA vitamin C serum · women 25–34 with dull skin", output: "“Why does your skin look tired even after 8 hours of sleep?”\nShot: close-up, morning mirror, no makeup." },
      { title: "Before & after hook", input: "LUMEA vitamin C serum · women 25–34 with dull skin", output: "“Day 1 vs day 7. Same lighting. Same phone.”\nShot: split screen of two selfies." },
      { title: "Bold claim hook", input: "LUMEA vitamin C serum · women 25–34 with dull skin", output: "“This is the only step I never skip.”\nShot: serum dropper landing on a fingertip." },
    ],
  },
  {
    slug: "ai-ad-script-generator",
    name: "AI Ad Script Generator",
    kind: "writer",
    runs: "agent",
    h1: "AI ad script generator",
    lead: "BuzzVideo's AI Ad Script Generator turns a product and an audience into a shot-by-shot video ad script with a hook, voiceover lines and a call to action. Fill in the brief below and BuzzVideo's Marketing Agent writes the script, then can produce the video from it.",
    card: "Shot-by-shot video ad scripts from a product brief",
    steps: [
      { title: "Fill in the brief", body: "Add the product, the audience, the length you need and one proof point." },
      { title: "Get the script", body: "The Marketing Agent writes a script with timed shots, on-screen text, voiceover and a call to action." },
      { title: "Make the video", body: "Ask the agent to generate the shots, voiceover and edit in the same chat, or export the script for your own shoot." },
    ],
    faq: [
      { q: "What should a video ad script include?", a: "A good short ad script has a hook in the first seconds, a problem or desire, the product as the answer, one proof point and a clear call to action, each tied to a shot and an on-screen line." },
      { q: "Is the AI ad script generator free?", a: `Signing up is free, and the Marketing Agent is included on the Free plan. New accounts get ${SIGNUP_CREDITS} free credits, which work on Seedream 4.5 and Seedream 5.0 Lite images and Seed Audio 1.0 voiceovers; turning the script into video needs a Starter, Pro or Ultra plan.` },
      { q: "How long should a TikTok or Reels ad script be?", a: "Most short-form ads run 15 to 30 seconds. Pick the length in the form; the agent paces the shots and word count to fit." },
      { q: "Can I use the script with my own footage?", a: "Yes. The script is plain text with shot descriptions, so you can film it yourself, or use BuzzVideo's Hybrid Reel to mix your footage with AI-made shots." },
    ],
    related: ["ai-hook-generator", "ai-ad-copy-generator", "tiktok-caption-generator", "video-resizer"],
    writer: {
      option: { label: "Length", values: ["15 seconds", "30 seconds", "45 seconds"] },
      productHint: "e.g. LUMEA vitamin C serum",
      audienceHint: "e.g. busy professionals who skip skincare",
      extraLabel: "Proof point or offer (optional)",
      extraHint: "e.g. 20% off first order",
      cta: "Write script in Marketing Agent",
      build: ({ product, audience, option, extra }) =>
        `Write a ${option} vertical video ad script for TikTok and Reels.\nProduct: ${product}\nAudience: ${audience}${extra ? `\nProof point / offer: ${extra}` : ""}\nFormat as a table: time, shot, on-screen text, voiceover. Start with a hook in the first 2 seconds and end with a clear call to action.`,
    },
    examples: [
      { title: "0–2 s · Hook", input: "LUMEA vitamin C serum · 15 seconds", output: "Shot: hand wipes a foggy bathroom mirror.\nOn screen: “Tired skin? 7-day reset.”\nVO: “Your skin isn't tired. It's thirsty.”" },
      { title: "3–10 s · Product", input: "LUMEA vitamin C serum · 15 seconds", output: "Shot: two drops of serum, pressed into the cheek.\nOn screen: “One step. Every morning.”\nVO: “One step of LUMEA, every morning.”" },
      { title: "11–15 s · Call to action", input: "LUMEA vitamin C serum · 15 seconds", output: "Shot: bottle on an orange wall, soft daylight.\nOn screen: “Try LUMEA today.”\nVO: “Tap to get yours.”" },
    ],
  },
  {
    slug: "ai-ad-copy-generator",
    name: "AI Ad Copy Generator",
    kind: "writer",
    runs: "agent",
    h1: "AI ad copy generator",
    lead: "BuzzVideo's AI Ad Copy Generator writes primary text, headlines and descriptions for Facebook, Instagram and TikTok ads from a short product brief. Enter your product and audience below and BuzzVideo's Marketing Agent drafts several angles you can test side by side.",
    card: "Primary text, headlines and descriptions for ads",
    steps: [
      { title: "Describe the offer", body: "Add the product, audience and any offer or proof you want in the copy." },
      { title: "Pick the platform", body: "Choose Meta or TikTok; the agent follows each platform's ad text fields." },
      { title: "Test the angles", body: "The Marketing Agent writes several angles. Pick the best, or ask it to make matching images or videos." },
    ],
    faq: [
      { q: "What is AI ad copy?", a: "AI ad copy is ad text, such as primary text, headlines and descriptions, drafted by a language model from your brief. BuzzVideo's Marketing Agent writes it and can then make the matching creative." },
      { q: "Is the AI ad copy generator free?", a: `Signing up is free, and the Marketing Agent is included on the Free plan. New accounts get ${SIGNUP_CREDITS} free credits, which work on Seedream 4.5 and Seedream 5.0 Lite images and Seed Audio 1.0 voiceovers; video models need a Starter, Pro or Ultra plan.` },
      { q: "How many copy variations should I run?", a: "Start with three to five angles that differ in the promise, not just the wording, such as price, result and social proof, so the test tells you something." },
      { q: "Can it write in my brand voice?", a: "Yes. Paste a few lines of past copy or describe your tone in the optional field, and the agent follows it." },
    ],
    related: ["ai-hook-generator", "ai-ad-script-generator", "image-resizer", "ad-size-guide"],
    writer: {
      option: { label: "Platform", values: ["Facebook & Instagram", "TikTok"] },
      productHint: "e.g. LUMEA vitamin C serum",
      audienceHint: "e.g. skincare beginners in the US",
      extraLabel: "Offer, proof or tone (optional)",
      extraHint: "e.g. free shipping, friendly tone",
      cta: "Write copy in Marketing Agent",
      build: ({ product, audience, option, extra }) =>
        `Write ad copy for ${option} ads in 4 different angles (result, price/offer, social proof, problem).\nProduct: ${product}\nAudience: ${audience}${extra ? `\nOffer / tone: ${extra}` : ""}\nFor each angle give: primary text (under 125 characters first line), headline (under 40 characters) and a short description.`,
    },
    examples: [
      { title: "Result angle", input: "LUMEA vitamin C serum · Facebook & Instagram", output: "Primary text: Brighter-looking skin starts with one morning step.\nHeadline: Your 7-day glow routine\nDescription: Lightweight vitamin C serum." },
      { title: "Problem angle", input: "LUMEA vitamin C serum · Facebook & Instagram", output: "Primary text: Dull skin by noon? Your routine is missing one thing.\nHeadline: Meet LUMEA\nDescription: Absorbs in seconds." },
      { title: "Offer angle", input: "LUMEA vitamin C serum · Facebook & Instagram", output: "Primary text: First bottle, free shipping. Glow on us.\nHeadline: Try LUMEA today\nDescription: Ships in 2 days." },
    ],
  },
  {
    slug: "tiktok-caption-generator",
    name: "TikTok Caption Generator",
    kind: "writer",
    runs: "agent",
    h1: "TikTok caption generator",
    lead: "BuzzVideo's TikTok Caption Generator writes short captions and hashtag sets for product videos on TikTok. Describe the video, product and audience below and BuzzVideo's Marketing Agent drafts caption options in the tone you pick, each with a short hashtag set, ready to paste into TikTok.",
    card: "Short TikTok captions with hashtags",
    steps: [
      { title: "Describe the video", body: "Say what happens in the video and which product it features." },
      { title: "Pick a tone", body: "Choose playful, informative or urgent; the agent matches it." },
      { title: "Paste and post", body: "Copy a caption and its hashtags into TikTok, or ask the agent for more options." },
    ],
    faq: [
      { q: "How long should a TikTok caption be?", a: "Short. The first line shows before the “more” cut, so put the hook there and keep the whole caption to one or two lines plus a few relevant hashtags." },
      { q: "Is the TikTok caption generator free?", a: `Signing up is free, and the Marketing Agent is included on the Free plan. New accounts get ${SIGNUP_CREDITS} free credits, which work on Seedream 4.5 and Seedream 5.0 Lite images and Seed Audio 1.0 voiceovers; video models need a Starter, Pro or Ultra plan.` },
      { q: "How many hashtags should I use on TikTok?", a: "A few relevant ones beat a long list. Mix one broad tag with two or three specific to the product or niche." },
      { q: "Will captions cover my video?", a: "Captions sit at the bottom of the TikTok screen. Use the Safe Zone Checker to make sure your on-screen text stays clear of them." },
    ],
    related: ["ai-hook-generator", "ai-ad-copy-generator", "safe-zone-checker", "video-resizer"],
    writer: {
      option: { label: "Tone", values: ["Playful", "Informative", "Urgent"] },
      productHint: "e.g. LUMEA vitamin C serum",
      audienceHint: "e.g. Gen Z skincare fans",
      extraLabel: "What happens in the video (optional)",
      extraHint: "e.g. morning routine, before and after",
      cta: "Write captions in Marketing Agent",
      build: ({ product, audience, option, extra }) =>
        `Write 8 TikTok captions (one or two lines each, ${option.toLowerCase()} tone) with 3–5 relevant hashtags each.\nProduct: ${product}\nAudience: ${audience}${extra ? `\nVideo: ${extra}` : ""}\nPut the hook in the first line.`,
    },
    examples: [
      { title: "Playful", input: "LUMEA vitamin C serum · morning routine video", output: "POV: your skin finally got the memo ☀️\n#skincareroutine #vitaminc #glowup" },
      { title: "Informative", input: "LUMEA vitamin C serum · morning routine video", output: "Vitamin C goes on before moisturizer. Here's why.\n#skincaretips #vitamincserum #morningroutine" },
      { title: "Urgent", input: "LUMEA vitamin C serum · morning routine video", output: "Last day for free shipping on LUMEA. Don't sleep on it.\n#skincare #glowskin #dealoftheday" },
    ],
  },
];

export const freeBySlug = (slug: string) => FREE_TOOLS.find((t) => t.slug === slug);
