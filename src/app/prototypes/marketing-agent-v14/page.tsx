"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import localFont from "next/font/local";
import {
  Plus,
  GitBranch,
  Frame,
  ChevronDown,
  SlidersHorizontal,
  History,
  HelpCircle,
  Search,
  VolumeX,
  MoreHorizontal,
  Pin,
  Pencil,
  Trash2,
  Check,
  Image as ImageIcon,
  Video,
  Palette,
  SwatchBook,
  Scissors,
  GalleryHorizontalEnd,
  Maximize2,
  Scaling,
  Layers,
  Sun,
  Eraser,
  Shirt,
  Speech,
  UserRound,
  Mic,
  Music,
  AudioLines,
  Wand2,
  StepForward,
  Languages,
  Users,
  Tv,
  Copy,
  Replace,
  Shuffle,
  MonitorPlay,
  Blend,
  Footprints,
  LayoutGrid,
  Camera,
  Zap,
  Home,
  Sparkles,
  Aperture,
  PackageOpen,
  Flame,
  SplitSquareHorizontal,
  GraduationCap,
  Package,
  PersonStanding,
  Images,
  GalleryHorizontal,
  ImagePlay,
  Paintbrush,
  VenetianMask,
  ScanFace,
  Rotate3d,
  Type,
  Clapperboard,
  AudioWaveform,
  PenLine,
  FileText,
  Megaphone,
  Hash,
  CalendarDays,
  FlaskConical,
  Link as LinkIcon,
  type LucideIcon,
} from "lucide-react";
import { type Mission } from "@/components/missions";

const bricolageExtraBold = localFont({
  src: "../../fonts/BricolageGrotesque-ExtraBold.ttf",
  weight: "800",
  display: "swap",
});

// ── design.md tokens ──────────────────────────────────────────────
const gradText =
  "bg-gradient-to-r from-[#ffc078] to-[#ff5e1a] bg-clip-text text-transparent";
const ctaGrad = "bg-gradient-to-r from-[#FFA73C] to-[#FF5255]";
const composerCta = "inline-flex h-10 shrink-0 items-center gap-2 rounded-[14px] bg-gradient-to-b from-[#ff5255] to-[#ffa73c] px-5 text-[15px] font-bold text-white shadow-[0_3px_0_#b65a42] transition hover:-translate-y-0.5 hover:brightness-105 active:translate-y-px active:shadow-none";

// Frontend-only placeholder: real per-model/resolution pricing is backend-configured and not wired up yet.
const ESTIMATED_CREDITS_PLACEHOLDER = 120;
const ESTIMATED_OUTPUT_COUNT_PLACEHOLDER = 4;
const DEMO_BALANCE_PRESETS = [63016, 500, 0];

// ── homepage hero content block (ported from prototypes/homepage) ──
const HP_ICON_ROOT = "/prototypes/starter-guide/icons";
const HP_ICONS = {
  logo: `${HP_ICON_ROOT}/buzz-video-logo.svg`,
  marketing: `${HP_ICON_ROOT}/marketing-agent.svg`,
  canvas: `${HP_ICON_ROOT}/canvas.svg`,
  nanoBanana: `${HP_ICON_ROOT}/nanobanana.svg`,
  byteDance: `${HP_ICON_ROOT}/bytedance.svg`,
  gemini: `${HP_ICON_ROOT}/gemini.svg`,
  new: `${HP_ICON_ROOT}/new.svg`,
  hot: `${HP_ICON_ROOT}/hot.svg`,
};

const memberPromoAssets = {
  sparkle: "/prototypes/homepage/member-sparkle.svg",
};

// 项目文件图标沿用 Try now 按钮那颗星(member-sparkle),用 mask 上色
const SPARKLE_MASK = {
  mask: "url('/prototypes/homepage/member-sparkle.svg') center / contain no-repeat",
  WebkitMask: "url('/prototypes/homepage/member-sparkle.svg') center / contain no-repeat",
} as const;

type QuickLinkCategory = "Image" | "Video" | "Audio" | "Tools";

type QuickLink = {
  name: string;
  description: string;
  Icon: LucideIcon;
  category: QuickLinkCategory;
  prompt: string;
  thumb?: string;
};

const QUICK_LINK_CATEGORIES: readonly QuickLinkCategory[] = ["Image", "Video", "Audio", "Tools"];

const quickLinks: readonly QuickLink[] = [
  { name: "Generate Image", description: "Text-to-image and image-to-image.", Icon: ImageIcon, category: "Image", prompt: "Generate a high-resolution hero image of my product on a clean studio backdrop, soft even lighting and a subtle reflection.", thumb: "https://assets.presslogic.com/buzzvideo/public/2026-07-30/341146043993350144.png" },
  { name: "Generate Video", description: "Text-to-video, image-to-video and reference-to-video.", Icon: Video, category: "Video", prompt: "Generate a 15-second vertical product video from this image with a slow cinematic push-in, soft studio lighting and a premium mood.", thumb: "https://assets.presslogic.com/buzzvideo/public/2026-07-30/341147564323692544.png" },
  { name: "Image Style Transfer", description: "Change style from one image to another.", Icon: Palette, category: "Image", prompt: "Restyle this product photo into a warm, editorial magazine look while keeping the product shape and details intact.", thumb: "https://assets.presslogic.com/buzzvideo/public/2026-07-30/341146044194676736.png" },
  { name: "Video Style Transfer", description: "Restyle footage to any look.", Icon: SwatchBook, category: "Video", prompt: "Restyle this footage into a warm, film-grain cinematic look while keeping the motion and product intact.", thumb: "https://assets.presslogic.com/buzzvideo/public/2026-07-30/341147564189474816.png" },
  { name: "Edit Video", description: "Replace subjects, add, remove or edit objects, and repair frames.", Icon: Scissors, category: "Video", prompt: "Replace the presenter in this clip, remove the logo in the corner and repair the shaky frames at the start.", thumb: "https://assets.presslogic.com/buzzvideo/public/2026-07-30/341147561937133568.png" },
  { name: "Extend Video", description: "Extend a clip forward or backward, or stitch up to 3 clips into one.", Icon: GalleryHorizontalEnd, category: "Video", prompt: "Extend this clip by 5 seconds with a smooth continuation, then stitch my three clips into one coherent video.", thumb: "https://assets.presslogic.com/buzzvideo/public/2026-07-30/341147562474004480.png" },
  { name: "Upscale Video", description: "Upscale any video to crisp 4K.", Icon: Maximize2, category: "Video", prompt: "Upscale this video to crisp 4K and smooth out compression artifacts while keeping the original motion.", thumb: "https://assets.presslogic.com/buzzvideo/public/2026-07-30/341147561492537344.png" },
  { name: "Upscale Image", description: "Enlarge images with sharp detail.", Icon: Scaling, category: "Image", prompt: "Upscale this product image to crisp 4K, sharpening fine detail and texture without adding artifacts.", thumb: "https://assets.presslogic.com/buzzvideo/public/2026-07-30/341146044303728640.png" },
  { name: "Remove/Change Background", description: "Clean cutouts, swap backgrounds.", Icon: Layers, category: "Image", prompt: "Remove the background from this product photo and give me a clean cutout on transparent and pure white backgrounds.", thumb: "https://assets.presslogic.com/buzzvideo/public/2026-07-30/341146200264728576.png" },
  { name: "Relight", description: "Relight product shots instantly.", Icon: Sun, category: "Image", prompt: "Relight this product shot with a soft studio key light and a gentle rim light to make it look premium.", thumb: "https://assets.presslogic.com/buzzvideo/public/2026-07-30/341146043070603264.png" },
  { name: "Object Removal", description: "Erase anything from a photo.", Icon: Eraser, category: "Image", prompt: "Remove the distracting objects and blemishes I mark in this photo and cleanly fill the background.", thumb: "https://assets.presslogic.com/buzzvideo/public/2026-07-30/341146044962234368.png" },
  { name: "Virtual Try-On", description: "Show products on a virtual model.", Icon: Shirt, category: "Image", prompt: "Show this apparel worn on a realistic model for my target audience [e.g. women 25–35] — full-body, natural pose, studio lighting.", thumb: "https://assets.presslogic.com/buzzvideo/public/2026-07-30/341146046350548992.png" },
  { name: "Product Photography", description: "High-quality professional product photography.", Icon: Camera, category: "Image", prompt: "Create high-quality professional product photography of my product in a bright lifestyle scene with on-brand props.", thumb: "https://assets.presslogic.com/buzzvideo/public/2026-07-30/341146045121617920.png" },
  { name: "AI Model", description: "Create lifelike AI fashion models.", Icon: PersonStanding, category: "Image", prompt: "Generate a lifelike AI fashion model wearing my product, studio lighting, clean e-commerce catalog style.", thumb: "https://assets.presslogic.com/buzzvideo/public/2026-07-30/341146044563775488.png" },
  { name: "Batch Edit", description: "Clean up a whole catalog in one pass.", Icon: Images, category: "Image", prompt: "Clean up my whole product catalog in one pass: remove backgrounds, normalize lighting and white balance, retouch blemishes, and export consistent 1:1 white-background shots ready for marketplace listings.", thumb: "https://assets.presslogic.com/buzzvideo/public/2026-07-30/341146044333088768.png" },
  { name: "Social Carousel", description: "Multi-slide carousels for social posts.", Icon: GalleryHorizontal, category: "Image", prompt: "Design a 5-slide Instagram carousel for my product: a hook slide, three benefit slides and a CTA slide.", thumb: "https://assets.presslogic.com/buzzvideo/public/2026-07-30/341146044135956480.png" },
  { name: "Thumbnail", description: "Click-worthy thumbnails for any video.", Icon: ImagePlay, category: "Image", prompt: "Design a bold, high-contrast YouTube thumbnail for my product video with a punchy 3-word headline and an expressive face.", thumb: "https://assets.presslogic.com/buzzvideo/public/2026-07-30/341146044664438784.png" },
  { name: "Inpaint", description: "Replace, add or remove any part of an image.", Icon: Paintbrush, category: "Image", prompt: "In the area I mark, remove the old label and seamlessly add my new brand logo, matching the lighting and texture.", thumb: "https://assets.presslogic.com/buzzvideo/public/2026-07-30/341146045469745152.png" },
  { name: "Image Character Swap", description: "Swap the person or character in a photo.", Icon: VenetianMask, category: "Image", prompt: "Swap the person in this photo for a model that fits my brand, keeping the pose, lighting and outfit.", thumb: "https://assets.presslogic.com/buzzvideo/public/2026-07-30/341146045528465408.png" },
  { name: "Image Face Swap", description: "Swap faces in any photo.", Icon: ScanFace, category: "Image", prompt: "Swap the face in this photo with the reference face, keeping the expression, lighting and skin tone consistent.", thumb: "https://assets.presslogic.com/buzzvideo/public/2026-07-30/341146044056264704.png" },
  { name: "Photo Angle Editor", description: "Reshoot a product from any angle.", Icon: Rotate3d, category: "Image", prompt: "Reshoot this product from a 3/4 top-down angle, keeping the exact same product, lighting and background.", thumb: "https://assets.presslogic.com/buzzvideo/public/2026-07-30/341146047541731328.png" },
  { name: "Add / Edit Text", description: "Add or edit any text in an image.", Icon: Type, category: "Image", prompt: "Add a clean promotional headline and price tag in my brand font, and fix the misspelled word on the packaging.", thumb: "https://assets.presslogic.com/buzzvideo/public/2026-07-30/341146151736631296.png" },
  { name: "Lip Sync", description: "Match lips to any voice track.", Icon: Speech, category: "Video", prompt: "Sync the speaker's lips in this video to my new English voiceover track.", thumb: "https://assets.presslogic.com/buzzvideo/public/2026-07-30/341147563287699456.png" },
  { name: "Talking Avatar", description: "Turn any script into a lifelike talking avatar video.", Icon: UserRound, category: "Video", prompt: "Turn this script into a lifelike talking-avatar video of a friendly female presenter in a bright modern office: [paste your script].", thumb: "https://assets.presslogic.com/buzzvideo/public/2026-07-30/341147564525019136.png" },
  { name: "UGC Ads", description: "Scroll-stopping UGC ads from AI creators.", Icon: Users, category: "Video", prompt: "Create a 9:16 UGC ad of an energetic young creator holding my product and talking to camera in a bright room, authentic handheld phone feel, scroll-stopping hook in the first 3 seconds.", thumb: "https://assets.presslogic.com/buzzvideo/public/2026-07-30/341147563094761472.png" },
  { name: "TVC Commercial", description: "Cinematic, broadcast-ready brand films.", Icon: Tv, category: "Video", prompt: "Create a cinematic 20-second TV commercial for my product with dramatic lighting, macro detail shots and an aspirational lifestyle scene.", thumb: "https://assets.presslogic.com/buzzvideo/public/2026-07-30/341147560997609472.png" },
  { name: "Video Clone", description: "Recreate any winning video with your product.", Icon: Copy, category: "Video", prompt: "Recreate this winning ad shot-for-shot with my product and brand, keeping the pacing, hooks and structure.", thumb: "https://assets.presslogic.com/buzzvideo/public/2026-07-30/341147561291210752.png" },
  { name: "Character Swap", description: "Swap the presenter or character in any clip.", Icon: Replace, category: "Video", prompt: "Swap the presenter in this video for a creator that fits my target audience, keeping the motion, timing and voice.", thumb: "https://assets.presslogic.com/buzzvideo/users/334875294122958848/2026-07-31/341420034310070272.png" },
  { name: "Ad Variations", description: "Spin one ad into dozens of hook variants.", Icon: Shuffle, category: "Video", prompt: "Generate 10 variations of this ad with different opening hooks and CTAs for A/B testing.", thumb: "https://assets.presslogic.com/buzzvideo/public/2026-07-30/341147562650165248.png" },
  { name: "Product Demo", description: "Turn a listing into a demo walkthrough.", Icon: MonitorPlay, category: "Video", prompt: "Turn my product listing into a 30-second demo video walking through the top 3 features with on-screen captions.", thumb: "https://assets.presslogic.com/buzzvideo/public/2026-07-30/341147561190547456.png" },
  { name: "Video Background", description: "Remove or swap the background in any clip.", Icon: Blend, category: "Video", prompt: "Replace the background in this clip with a clean studio gradient, keeping the subject sharp with clean edges.", thumb: "https://assets.presslogic.com/buzzvideo/public/2026-07-30/341147563484831744.png" },
  { name: "Motion / Choreography Reference", description: "Apply reference choreography or motion clips to any character.", Icon: Footprints, category: "Video", prompt: "Apply the motion from this reference clip to my character while keeping their appearance and outfit.", thumb: "https://assets.presslogic.com/buzzvideo/public/2026-07-30/341147649879105536.png" },
  { name: "Video Batch Variations", description: "Generate dozens of different hooks or video endings in a single click for A/B testing.", Icon: LayoutGrid, category: "Video", prompt: "Generate a dozen versions of this video with different hooks and endings so I can A/B test which performs best.", thumb: "https://assets.presslogic.com/buzzvideo/public/2026-07-30/341147561714835456.png" },
  { name: "Generate Voiceover", description: "Text-to-audio and reference-to-audio.", Icon: Mic, category: "Audio", prompt: "Generate a warm, upbeat female voiceover for this 15-second ad script in English: [paste your script].", thumb: "https://assets.presslogic.com/buzzvideo/users/334875294122958848/2026-07-30/341165579450769408.png" },
  { name: "Voice Cloning", description: "Clone any voice from a short sample.", Icon: AudioLines, category: "Audio", prompt: "Clone the voice from this sample and read my new script in the same tone and pacing.", thumb: "https://assets.presslogic.com/buzzvideo/public/2026-07-30/341142771853221888.png" },
  { name: "Generate BGM", description: "Background music with no lyrics.", Icon: Music, category: "Audio", prompt: "Generate 30 seconds of upbeat, royalty-free background music with no lyrics for a product ad — modern and energetic.", thumb: "https://assets.presslogic.com/buzzvideo/public/2026-07-30/341142773015044096.png" },
  { name: "Dubbing", description: "Translate and dub audio in any language.", Icon: Languages, category: "Audio", prompt: "Dub this video's audio into Spanish and Japanese, keeping the original speaker's tone and timing.", thumb: "https://assets.presslogic.com/buzzvideo/public/2026-07-30/341142771752558592.png" },
  { name: "Sound Effects", description: "Generate custom SFX for any scene.", Icon: AudioWaveform, category: "Audio", prompt: "Generate a crisp 'pop' and 'whoosh' sound-effect set for my product reveal animation.", thumb: "https://assets.presslogic.com/buzzvideo/public/2026-07-30/341142771798695936.png" },
  { name: "Avatar to Voice", description: "Generate a fitting voice from any character portrait.", Icon: Speech, category: "Audio", prompt: "Generate a fitting voice for this character portrait based on their look, age and art style.", thumb: "https://assets.presslogic.com/buzzvideo/users/334875294122958848/2026-07-30/341165577827573760.png" },
  { name: "Audio Inpainting", description: "Rewrite a misspoken clip in the original voice — no re-recording.", Icon: Wand2, category: "Audio", prompt: "Fix the misspoken word in this recording — rewrite it to '[correct text]' in the original voice and background.", thumb: "https://assets.presslogic.com/buzzvideo/public/2026-07-30/341142771702226944.png" },
  { name: "Audio Continuation", description: "Continue any audio in the same voice, tone and ambience.", Icon: StepForward, category: "Audio", prompt: "Continue this voiceover for two more sentences in the same voice, tone and ambience: [paste continuation text].", thumb: "https://assets.presslogic.com/buzzvideo/users/334875294122958848/2026-07-30/341165580830695424.png" },
  { name: "URL to Video", description: "Turn any product page into a ready-to-launch video.", Icon: LinkIcon, category: "Tools", prompt: "Turn this product page into a ready-to-launch 9:16 video ad: [paste product URL].", thumb: "https://assets.presslogic.com/buzzvideo/users/334875294122958848/2026-07-30/341165413301805056.png" },
  { name: "Storyboard to Video", description: "Turn a storyboard into a finished video.", Icon: Clapperboard, category: "Tools", prompt: "Turn my product into a 6-panel storyboard, then generate a continuous, consistent video from it.", thumb: "https://assets.presslogic.com/buzzvideo/public/2026-07-30/341144290052857856.png" },
  { name: "Ad Copy", description: "High-converting ad copy and headlines.", Icon: PenLine, category: "Tools", prompt: "Write 5 high-converting ad headlines and primary texts for my product targeting [audience] on Meta and TikTok.", thumb: "https://assets.presslogic.com/buzzvideo/users/334875294122958848/2026-07-31/341376415058419712.png" },
  { name: "Product Descriptions", description: "SEO product copy that sells.", Icon: FileText, category: "Tools", prompt: "Write an SEO-optimized product description for my product with key benefits, specs and a persuasive CTA.", thumb: "https://assets.presslogic.com/buzzvideo/users/334875294122958848/2026-07-30/341165413289222144.png" },
  { name: "Campaign Brief", description: "Turn one idea into a full campaign.", Icon: Megaphone, category: "Tools", prompt: "Turn this one idea into a full campaign brief: positioning, key messages, channels, formats and a content plan for my product.", thumb: "https://assets.presslogic.com/buzzvideo/public/2026-07-30/341144290497454080.png" },
  { name: "Captions & Hashtags", description: "On-brand captions and hashtags.", Icon: Hash, category: "Tools", prompt: "Write 5 on-brand social captions with relevant hashtags for my product launch post.", thumb: "https://assets.presslogic.com/buzzvideo/public/2026-07-30/341144290132549632.png" },
  { name: "Content Calendar", description: "Plan and schedule social posts.", Icon: CalendarDays, category: "Tools", prompt: "Plan a 2-week social content calendar for my product across TikTok, Instagram and YouTube with post ideas and hooks.", thumb: "https://assets.presslogic.com/buzzvideo/users/334875294122958848/2026-07-30/341165414769811456.png" },
  { name: "Copy A/B Test", description: "Generate copy variants to A/B test.", Icon: FlaskConical, category: "Tools", prompt: "Generate 8 A/B test variants of this ad copy with different angles, hooks and CTAs.", thumb: "https://assets.presslogic.com/buzzvideo/public/2026-07-30/341144454276636672.png" },
];

const SIDE_NAV: Array<{
  label: string;
  icon: string;
  active?: boolean;
  href?: string;
}> = [
  { label: "Home", icon: `${HP_ICON_ROOT}/home.svg`, href: "/prototypes/homepage" },
  { label: "Agent", icon: `${HP_ICON_ROOT}/marketing-agent.svg`, active: true },
  { label: "Canvas", icon: `${HP_ICON_ROOT}/canvas.svg`, href: "/prototypes/workflow-canvas" },
];

const SHOWCASES = [
  // ── TikTok · Symphony × Higgsfield 模板(8)· scenes/icon 待填素材 ──────────
  { title: "This Gadget Saved Me", subtitle: "Turn product features into a creator-led recommendation.", category: "TikTok", prompt: "Create a TikTok video where a creator excitedly recommends my product like a life-saving gadget, authentic handheld energy and a punchy first-three-second hook.", icon: "", scenes: ["https://assets.presslogic.com/aigc/tasks/videos/90a27364-a631-4348-9d24-038a3f965189/2026-07-30/82df518b-4210-4913-98d9-2e5775fb9494.mp4", "https://assets.presslogic.com/aigc/tasks/videos/90a27364-a631-4348-9d24-038a3f965189/2026-07-30/ea114f1c-d5f2-46cd-bbb2-ef89e584a11d.mp4", "https://asset.buzzvideo.ai/buzzvideo/video/2026/07/30/a091ca77-5dc9-4ee0-a02e-42c477b82166_ba475947.mp4"] },
  { title: "Couple Sharing At Home", subtitle: "A couple sharing the product at home.", category: "TikTok", prompt: "Create a cozy at-home TikTok of a couple casually sharing and reacting to my product, warm natural lighting and candid chemistry.", icon: "", scenes: ["", "", ""] },
  { title: "Selfie Testimonial", subtitle: "Authentic selfie-style testimonials.", category: "TikTok", prompt: "Create a selfie-style TikTok testimonial of a creator holding the phone at arm's length, genuine first-person voiceover about my product.", icon: "", scenes: ["", "", ""] },
  { title: "Direct-to-Camera", subtitle: "Creator speaking straight to camera.", category: "TikTok", prompt: "Create a direct-to-camera TikTok of a creator speaking straight to the viewer about my product with confident, native energy.", icon: "", scenes: ["", "", ""] },
  { title: "Secret Hack Reveal", subtitle: "Reveal a clever product hack.", category: "TikTok", prompt: "Create a TikTok that reveals a clever hack using my product, a curiosity hook up front and a satisfying payoff reveal.", icon: "", scenes: ["", "", ""] },
  { title: "Camera POV", subtitle: "Immersive point-of-view product moments.", category: "TikTok", prompt: "Create an immersive POV TikTok that puts the viewer in a first-person moment using my product, dynamic handheld motion.", icon: "", scenes: ["", "", ""] },
  { title: "Classic Meets Modern", subtitle: "Blend timeless and contemporary styles.", category: "TikTok", prompt: "Create a stylized TikTok that blends classical, timeless aesthetics with a modern product reveal for a striking contrast.", icon: "", scenes: ["", "", ""] },
  { title: "Mess to Fresh", subtitle: "From messy to fresh transformations.", category: "TikTok", prompt: "Create a satisfying messy-to-fresh transformation TikTok showing a clear before-and-after powered by my product.", icon: "", scenes: ["", "", ""] },

  // ── UGC 模板(10)· scenes/icon 待填素材 ──────────────────────────────────
  { title: "UGC", subtitle: "Realistic social media videos.", category: "UGC", prompt: "Create a realistic UGC-style social video of a creator naturally using and talking about my product, authentic phone-shot feel.", icon: "", scenes: ["", "", ""] },
  { title: "Giant Figure", subtitle: "Oversized, scroll-stopping product moments.", category: "UGC", prompt: "Create a scroll-stopping UGC video featuring a giant, oversized version of my product in a real-world scene for a surreal wow moment.", icon: "", scenes: ["", "", ""] },
  { title: "Unboxing Virtual Try-On", subtitle: "Unbox and try on in one take.", category: "UGC", prompt: "Create a UGC video where a creator unboxes my product and tries it on in one continuous, authentic take.", icon: "", scenes: ["", "", ""] },
  { title: "Unboxing ASMR", subtitle: "Satisfying ASMR unboxing experiences.", category: "UGC", prompt: "Create a satisfying ASMR unboxing UGC video of my product with crisp close-up sound and tactile detail.", icon: "", scenes: ["", "", ""] },
  { title: "Virtual Try-On Sneakers", subtitle: "Virtual sneaker try-on videos.", category: "UGC", prompt: "Create a UGC video of a creator virtually trying on my sneakers, showing fit and style from multiple angles.", icon: "", scenes: ["", "", ""] },
  { title: "UGC Addiction", subtitle: "Can't-put-it-down product obsession.", category: "UGC", prompt: "Create a UGC video capturing a creator's can't-put-it-down obsession with my product, playful and genuine energy.", icon: "", scenes: ["", "", ""] },
  { title: "Before and After", subtitle: "Showcase transformations and results.", category: "UGC", prompt: "Create a UGC before-and-after video that clearly showcases the transformation and results from using my product.", icon: "", scenes: ["", "", ""] },
  { title: "Tutorial", subtitle: "Step-by-step tutorials.", category: "UGC", prompt: "Create a clear step-by-step UGC tutorial showing how to use my product, friendly creator narration.", icon: "", scenes: ["", "", ""] },
  { title: "Unboxing", subtitle: "High-quality unboxing.", category: "UGC", prompt: "Create a high-quality UGC unboxing video of my product with premium close-ups and an anticipation-building reveal.", icon: "", scenes: ["", "", ""] },
  { title: "UGC Virtual Try On", subtitle: "Try before you buy.", category: "UGC", prompt: "Create a UGC virtual try-on video letting viewers see my product worn before they buy, realistic fit and movement.", icon: "", scenes: ["", "", ""] },
];

/* footer app 图标:标题 → lucide 图标 + 渐变底色(icon 图片留空时用)。 */
const SHOWCASE_ICON: Record<string, { Icon: LucideIcon; bg: string }> = {
  "This Gadget Saved Me": { Icon: Zap, bg: "linear-gradient(135deg,#22d3ee,#3b82f6)" },
  "Couple Sharing At Home": { Icon: Home, bg: "linear-gradient(135deg,#60a5fa,#6366f1)" },
  "Selfie Testimonial": { Icon: UserRound, bg: "linear-gradient(135deg,#f472b6,#a855f7)" },
  "Direct-to-Camera": { Icon: Camera, bg: "linear-gradient(135deg,#64748b,#1e293b)" },
  "Secret Hack Reveal": { Icon: Sparkles, bg: "linear-gradient(135deg,#a78bfa,#7c3aed)" },
  "Camera POV": { Icon: Aperture, bg: "linear-gradient(135deg,#38bdf8,#2563eb)" },
  "Classic Meets Modern": { Icon: Shuffle, bg: "linear-gradient(135deg,#2dd4bf,#0d9488)" },
  "Mess to Fresh": { Icon: Wand2, bg: "linear-gradient(135deg,#f472b6,#8b5cf6)" },
  "UGC": { Icon: Video, bg: "linear-gradient(135deg,#38bdf8,#2563eb)" },
  "Giant Figure": { Icon: Sparkles, bg: "linear-gradient(135deg,#f472b6,#a855f7)" },
  "Unboxing Virtual Try-On": { Icon: PackageOpen, bg: "linear-gradient(135deg,#fb7185,#f97316)" },
  "Unboxing ASMR": { Icon: Mic, bg: "linear-gradient(135deg,#a78bfa,#7c3aed)" },
  "Virtual Try-On Sneakers": { Icon: Footprints, bg: "linear-gradient(135deg,#c084fc,#7c3aed)" },
  "UGC Addiction": { Icon: Flame, bg: "linear-gradient(135deg,#60a5fa,#4f46e5)" },
  "Before and After": { Icon: SplitSquareHorizontal, bg: "linear-gradient(135deg,#a78bfa,#6366f1)" },
  "Tutorial": { Icon: GraduationCap, bg: "linear-gradient(135deg,#34d399,#059669)" },
  "Unboxing": { Icon: Package, bg: "linear-gradient(135deg,#22d3ee,#0891b2)" },
  "UGC Virtual Try On": { Icon: Shirt, bg: "linear-gradient(135deg,#a3e635,#65a30d)" },
};

function TikTokMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={className} fill="none">
      <path d="M17.2618 8.51118C15.7788 8.51118 14.4057 8.03996 13.2845 7.23914V13.0605C13.2845 15.9726 10.9226 18.3333 8.00903 18.3333C6.92195 18.3333 5.91156 18.0048 5.07222 17.4415C3.66193 16.495 2.7334 14.8858 2.7334 13.0605C2.7334 10.1486 5.09536 7.78785 8.00912 7.78791C8.25126 7.78779 8.4931 7.80423 8.73298 7.837V8.48335L8.73284 10.7533C8.50196 10.6801 8.25582 10.6404 8.00045 10.6404C6.6676 10.6404 5.58731 11.7203 5.58731 13.0522C5.58731 13.994 6.12731 14.8095 6.91475 15.2067C7.24125 15.3714 7.60999 15.4641 8.00048 15.4641C9.33059 15.4641 10.409 14.3886 10.4136 13.0605V1.66666H13.2844V2.03356C13.2945 2.14326 13.3091 2.25253 13.3281 2.36109C13.5274 3.49697 14.2069 4.46744 15.1501 5.0557C15.7835 5.45085 16.5153 5.65974 17.2618 5.65861L17.2618 8.51118Z" fill="currentColor" />
    </svg>
  );
}

function UgcMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5.75 6.75v-1a3 3 0 0 1 3-3h6.5a3 3 0 0 1 3 3v1m-12.5 0h12.5m-12.5 0v4h-1.5v3h1.5v7.5m12.5-14.5v9.5a3 3 0 0 1-3 3h-4v2m7-14.5h3M10.719 9.944h.01m4.115 0h.01m-.604 5.306c-1.75.25-3.52 0-4.25-1.25" />
    </svg>
  );
}

function CommercialMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 7.375V6.347m0 10.278v1.028m2.226-8.736C13.78 8.302 12.95 7.889 12 7.889h-.286c-1.26 0-2.283.818-2.283 1.827v.078c0 .722.51 1.382 1.316 1.705l2.506 1.002c.807.323 1.316.983 1.316 1.705 0 1.052-1.066 1.905-2.382 1.905H12c-.951 0-1.781-.413-2.226-1.028M21.25 12a9.25 9.25 0 1 1-18.5 0 9.25 9.25 0 0 1 18.5 0" />
    </svg>
  );
}

const SHOWCASE_FILTERS = [
  { label: "All" },
  { label: "TikTok", Icon: TikTokMark, badge: "NEW" },
  { label: "UGC", Icon: UgcMark },
  { label: "Commercial", Icon: CommercialMark },
];

const PROJECTS = [
  { name: "Summer launch" },
  { name: "UGC refresh" },
  { name: "Skincare drop" },
  { name: "Back to school" },
];

const COMPOSER_ICON_ROOT = "/prototypes/marketing-agent/composer-icons";
const COMPOSER_ICONS = {
  member: `${COMPOSER_ICON_ROOT}/member.svg`,
  marketing: `${COMPOSER_ICON_ROOT}/marketing-agent.svg`,
  image: `${COMPOSER_ICON_ROOT}/image.svg`,
  video: `${COMPOSER_ICON_ROOT}/video.svg`,
};

type ComposerMenu = "agent" | "settings" | null;
type AgentKind = "marketing" | "image" | "video";
type ModelMode = "image" | "video";
type ModelOption = { name: string; description: string; icon: string };

const AGENT_OPTIONS: ReadonlyArray<{
  id: AgentKind;
  label: string;
  description: string;
  premium?: boolean;
}> = [
  {
    id: "marketing",
    label: "Marketing Agent",
    description: "AI marketing expert — marketing strategy, ad copy, and creatives in one.",
  },
  {
    id: "image",
    label: "Image Gen",
    description: "Fast high-quality image generation, best for fast creative iteration.",
  },
  {
    id: "video",
    label: "Video Gen",
    description: "Up to 15 seconds of cinematic-quality video with synced audio and visuals.",
    premium: true,
  },
];

const MODEL_OPTIONS: Record<ModelMode, readonly ModelOption[]> = {
  image: [
    { name: "Seedream 5.0 Pro", description: "ByteDance's top-tier reasoning image model", icon: HP_ICONS.byteDance },
    { name: "Nano Banana 2 Lite", description: "Fastest speed, lowest cost", icon: HP_ICONS.nanoBanana },
    { name: "GPT-image-2", description: "OpenAI best image generation model", icon: COMPOSER_ICONS.image },
    { name: "Seedream 5.0 lite", description: "Intelligent visual reasoning", icon: HP_ICONS.byteDance },
    { name: "Nano Banana 2", description: "Pro-level quality at Flash speed", icon: HP_ICONS.nanoBanana },
  ],
  video: [
    { name: "Seedance 2.0", description: "Create high-quality videos in seconds", icon: HP_ICONS.byteDance },
    { name: "Veo 3", description: "Cinematic generation with native audio", icon: COMPOSER_ICONS.video },
  ],
};

function AgentIcon({ kind, className = "size-5", brandColor = false }: { kind: AgentKind; className?: string; brandColor?: boolean }) {
  const src = kind === "marketing" ? COMPOSER_ICONS.marketing : kind === "image" ? COMPOSER_ICONS.image : COMPOSER_ICONS.video;
  return <img src={src} alt="" className={className} style={brandColor ? { filter: "invert(47%) sepia(95%) saturate(1894%) hue-rotate(345deg) brightness(103%) contrast(101%)" } : undefined} />;
}

function AgentPicker({
  selectedAgent,
  onSelect,
}: {
  selectedAgent: AgentKind;
  onSelect: (agent: AgentKind) => void;
}) {
  return (
    <div className="w-[min(260px,calc(100vw-48px))] rounded-[16px] border border-white/80 bg-white/95 p-1.5 shadow-[0_10px_28px_rgba(26,26,46,0.14)] backdrop-blur-xl">
      <p className="px-2.5 pb-1.5 pt-1 text-[12px] font-medium text-[#a0a1aa]">Creation type</p>
      {AGENT_OPTIONS.map(({ id, label, premium }) => {
        const isSelected = id === selectedAgent;
        return (
          <button
            key={id}
            type="button"
            role="option"
            aria-selected={isSelected}
            onClick={() => onSelect(id)}
            className={`flex w-full items-center gap-2 rounded-[11px] px-2.5 py-2 text-left transition ${
              isSelected ? "bg-[#f1f1f2]" : "hover:bg-[#fafafd]"
            }`}
          >
            <span className={`grid size-7 shrink-0 place-items-center ${isSelected ? "text-[#ff6a2e]" : "text-[#485063]"}`}>
              <AgentIcon kind={id} className="size-[18px]" />
            </span>
            <span className="flex min-w-0 flex-1 items-center gap-1.5 text-[13px] font-medium leading-4 text-[#15182b]">
                {label}
                {premium && <img src={COMPOSER_ICONS.member} alt="Member" className="size-4" />}
            </span>
            {isSelected && <Check className="size-3.5 shrink-0 text-[#15182b]" />}
          </button>
        );
      })}
    </div>
  );
}

function ModelSettings({
  autoEnabled,
  onAutoChange,
  modelMode,
  onModelModeChange,
  resolution,
  onResolutionChange,
  aspectRatio,
  onAspectRatioChange,
  selectedModel,
  onSelectedModelChange,
}: {
  autoEnabled: boolean;
  onAutoChange: (value: boolean) => void;
  modelMode: ModelMode;
  onModelModeChange: (mode: ModelMode) => void;
  resolution: string;
  onResolutionChange: (value: string) => void;
  aspectRatio: string;
  onAspectRatioChange: (value: string) => void;
  selectedModel: string;
  onSelectedModelChange: (model: string) => void;
}) {
  const resolutions = ["Low", "Medium", "High"];
  const ratios = ["1:1", "3:4", "4:3", "4:5", "9:16", "16:9"];
  const isImage = modelMode === "image";
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const models = MODEL_OPTIONS[modelMode];

  return (
    <div role="dialog" aria-label="Model settings" className="w-[min(300px,calc(100vw-32px))] rounded-[18px] border border-[#ececf1] bg-white p-3 shadow-[0_12px_30px_rgba(26,26,46,0.16)]">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-bold text-[#27160f]">Model Settings</h2>
        <button
          type="button"
          role="switch"
          aria-checked={autoEnabled}
          onClick={() => onAutoChange(!autoEnabled)}
          className="flex items-center gap-2 text-[12px] text-[#a0a1aa]"
        >
          Auto
          <span className={`relative h-6 w-10 rounded-full transition ${autoEnabled ? ctaGrad : "bg-[#d9d9df]"}`}>
            <span className={`absolute top-1 size-4 rounded-full bg-white shadow-sm transition ${autoEnabled ? "left-5" : "left-1"}`} />
          </span>
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 rounded-xl bg-[#f7f7f8] p-1">
        {(["image", "video"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => { onModelModeChange(mode); onSelectedModelChange(MODEL_OPTIONS[mode][0].name); setModelPickerOpen(false); }}
            className={`rounded-lg px-2 py-2 text-[12px] font-medium transition ${
              modelMode === mode ? "bg-white text-[#3a2f2b] shadow-[0_2px_7px_rgba(26,26,46,0.08)]" : "text-[#b6b7be]"
            }`}
          >
            {mode === "image" ? "Image Model" : "Video Model"}
          </button>
        ))}
      </div>

      <div className="relative mt-3">
        <span className="text-[12px] font-medium text-[#a0a1aa]">Model</span>
        <button type="button" onClick={() => setModelPickerOpen((open) => !open)} className="mt-1.5 flex w-full items-center justify-between rounded-xl border border-[#ececf1] px-3 py-2 text-left">
          <span className="flex items-center gap-2 text-[13px] text-[#776f70]">
            {isImage ? <img src={COMPOSER_ICONS.image} alt="" className="size-4" /> : <img src={COMPOSER_ICONS.video} alt="" className="size-4" />}
            {selectedModel}
            <img src={COMPOSER_ICONS.member} alt="Member" className="size-3.5" />
          </span>
          <ChevronDown className="size-5 text-[#b7b8be]" />
        </button>
        {modelPickerOpen && (
          <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 overflow-hidden rounded-xl border border-[#ececf1] bg-white p-1 shadow-[0_12px_30px_rgba(26,26,46,0.15)]">
            {models.map(({ name, description, icon }) => {
              const isSelected = selectedModel === name;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => { onSelectedModelChange(name); setModelPickerOpen(false); }}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition ${isSelected ? "bg-[#f1f1f2]" : "hover:bg-[#fafafd]"}`}
                >
                  <Image src={icon} alt="" width={20} height={20} className="size-5 shrink-0 object-contain" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-[12px] font-medium text-[#27160f]">{name}<img src={COMPOSER_ICONS.member} alt="Member" className="size-3" /></span>
                    <span className="mt-0.5 block text-[10px] leading-3 text-[#94969e]">{description}</span>
                  </span>
                  {isSelected && <Check className="size-3.5 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-3">
        <span className="text-[12px] font-medium text-[#a0a1aa]">Resolution</span>
        <div className="mt-1.5 grid grid-cols-3 rounded-xl bg-[#f7f7f8] p-1">
          {resolutions.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onResolutionChange(value)}
              className={`rounded-lg py-2 text-[12px] transition ${resolution === value ? "bg-white text-[#766b67] shadow-[0_2px_7px_rgba(26,26,46,0.08)]" : "text-[#b5b6bd]"}`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3">
        <span className="text-[12px] font-medium text-[#a0a1aa]">Aspect Ratio</span>
        <div className="mt-1.5 grid grid-cols-6 gap-1 rounded-xl bg-[#f7f7f8] p-1.5">
          {ratios.map((ratio) => (
            <button
              key={ratio}
              type="button"
              onClick={() => onAspectRatioChange(ratio)}
              className={`flex w-full flex-col items-center justify-center gap-1 rounded-lg px-1 py-1.5 text-center text-[11px] transition ${aspectRatio === ratio ? "bg-white text-[#766b67] shadow-[0_2px_7px_rgba(26,26,46,0.08)]" : "text-[#b5b6bd]"}`}
            >
              <span className="flex h-7 items-center justify-center">
                <span className={`block w-6 rounded-[4px] border-2 border-current ${ratio === "1:1" ? "aspect-square" : ratio === "9:16" || ratio === "3:4" || ratio === "4:5" ? "h-7" : "h-4"}`} />
              </span>
              {ratio}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ComposerControls({
  openMenu,
  onMenuChange,
  selectedAgent,
  onAgentChange,
  autoEnabled,
  onAutoChange,
  modelMode,
  onModelModeChange,
  resolution,
  onResolutionChange,
  aspectRatio,
  onAspectRatioChange,
  selectedModel,
  onSelectedModelChange,
  showHistory = false,
  menuPlacement = "up",
}: {
  openMenu: ComposerMenu;
  onMenuChange: (menu: ComposerMenu) => void;
  selectedAgent: AgentKind;
  onAgentChange: (agent: AgentKind) => void;
  autoEnabled: boolean;
  onAutoChange: (value: boolean) => void;
  modelMode: ModelMode;
  onModelModeChange: (mode: ModelMode) => void;
  resolution: string;
  onResolutionChange: (value: string) => void;
  aspectRatio: string;
  onAspectRatioChange: (value: string) => void;
  selectedModel: string;
  onSelectedModelChange: (model: string) => void;
  showHistory?: boolean;
  menuPlacement?: "up" | "down";
}) {
  const agentLabel = AGENT_OPTIONS.find(({ id }) => id === selectedAgent)?.label ?? "Marketing Agent";

  return (
    <div data-composer-menu className="relative flex items-center gap-2 text-[#6a6b7b]">
      <span className="grid size-9 place-items-center rounded-lg border border-[#ececf1] bg-white">
        <Plus className="size-[18px]" />
      </span>
      <div className="relative">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={openMenu === "agent"}
          onClick={() => onMenuChange(openMenu === "agent" ? null : "agent")}
          className="flex items-center gap-1.5 rounded-lg border border-[#ececf1] bg-white px-3 py-[7px] text-[13px] font-semibold text-[#ff5e1a] transition hover:border-[#ffbd99] hover:bg-[#fffaf7]"
        >
          <AgentIcon kind={selectedAgent} className="size-4" brandColor /> {agentLabel}
          <ChevronDown className={`size-4 transition ${openMenu === "agent" ? "rotate-180" : ""}`} />
        </button>
        {openMenu === "agent" && (
          <div className={`absolute left-0 z-[60] ${menuPlacement === "down" ? "top-[calc(100%+12px)]" : "bottom-[calc(100%+12px)]"}`}>
            <AgentPicker selectedAgent={selectedAgent} onSelect={(agent) => { onAgentChange(agent); onMenuChange(null); }} />
          </div>
        )}
      </div>
      <div className="relative">
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={openMenu === "settings"}
          onClick={() => onMenuChange(openMenu === "settings" ? null : "settings")}
          className="hidden items-center gap-1.5 rounded-lg border border-[#ececf1] bg-white px-3 py-[7px] text-[13px] font-semibold transition hover:border-[#ffbd99] hover:bg-[#fffaf7] sm:flex"
        >
          <SlidersHorizontal className="size-4" /> {autoEnabled ? "Auto" : "Manual"}
        </button>
        {openMenu === "settings" && (
          <div className={`absolute left-0 z-[60] ${menuPlacement === "down" ? "top-[calc(100%+12px)]" : "bottom-[calc(100%+12px)]"}`}>
            <ModelSettings
              autoEnabled={autoEnabled}
              onAutoChange={onAutoChange}
              modelMode={modelMode}
              onModelModeChange={onModelModeChange}
              resolution={resolution}
              onResolutionChange={onResolutionChange}
              aspectRatio={aspectRatio}
              onAspectRatioChange={onAspectRatioChange}
              selectedModel={selectedModel}
              onSelectedModelChange={onSelectedModelChange}
            />
          </div>
        )}
      </div>
      {showHistory && <History className="hidden size-[18px] text-[#9a9bb0] sm:block" />}
    </div>
  );
}

// Global credit icon — used anywhere a credits amount is shown.
function CreditIcon({ className = "size-3.5" }: { className?: string }) {
  const gradientId = useId();
  return (
    <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <path
        d="M7 0C7.92884 0 8.39331 0.000427014 8.7832 0.0517578C11.4755 0.406254 13.5937 2.52448 13.9482 5.2168C13.9996 5.60669 14 6.07116 14 7C14 7.92884 13.9996 8.39331 13.9482 8.7832C13.5937 11.4755 11.4755 13.5937 8.7832 13.9482C8.39331 13.9996 7.92884 14 7 14C6.07116 14 5.60669 13.9996 5.2168 13.9482C2.52448 13.5937 0.406254 11.4755 0.0517578 8.7832C0.000427014 8.39331 0 7.92884 0 7C0 6.07116 0.000427014 5.60669 0.0517578 5.2168C0.406254 2.52448 2.52448 0.406254 5.2168 0.0517578C5.60669 0.000427014 6.07116 0 7 0ZM8.08008 3.5957C8.00244 3.57102 7.91868 3.57077 7.84082 3.59473C7.76297 3.61868 7.69388 3.66642 7.64355 3.73047L6.375 5.36035C6.33245 5.41476 6.27816 5.4595 6.2168 5.49121C6.15545 5.52285 6.08751 5.54074 6.01855 5.54395L3.95703 5.6416C3.8758 5.6457 3.79786 5.67503 3.7334 5.72461C3.66895 5.77429 3.62041 5.8424 3.5957 5.91992C3.57102 5.99756 3.57077 6.08132 3.59473 6.15918C3.61868 6.23703 3.66643 6.30612 3.73047 6.35645L5.36035 7.625C5.47022 7.711 5.53695 7.84154 5.54395 7.98145L5.6416 10.043C5.6457 10.1242 5.67502 10.2021 5.72461 10.2666C5.77429 10.331 5.8424 10.3796 5.91992 10.4043C5.99756 10.429 6.08132 10.4292 6.15918 10.4053C6.23703 10.3813 6.30612 10.3336 6.35645 10.2695L7.625 8.63965C7.66755 8.58524 7.72184 8.5405 7.7832 8.50879C7.84455 8.47715 7.91249 8.45926 7.98145 8.45605L10.043 8.3584C10.1242 8.3543 10.2021 8.32497 10.2666 8.27539C10.331 8.22572 10.3796 8.1576 10.4043 8.08008C10.429 8.00244 10.4292 7.91868 10.4053 7.84082C10.3813 7.76297 10.3336 7.69388 10.2695 7.64355L8.63965 6.375C8.58524 6.33245 8.54051 6.27816 8.50879 6.2168C8.47715 6.15545 8.45926 6.08751 8.45605 6.01855L8.3584 3.95703C8.3543 3.87581 8.32497 3.79786 8.27539 3.7334C8.22572 3.66895 8.1576 3.62041 8.08008 3.5957Z"
        fill={`url(#${gradientId})`}
      />
      <defs>
        <linearGradient id={gradientId} x1="13.5" y1="13.5" x2="1" y2="-0.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFA73C" />
          <stop offset="1" stopColor="#FF5255" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Shows the estimated credit cost of the current selection. Manual mode only —
// Auto mode picks the model dynamically so no cost can be shown ahead of time.
// Click cycles a demo balance so the Create → Upgrade swap below can be tested.
function CreditEstimateBadge({
  cost,
  creditsBalance,
  onCycleDemoBalance,
}: {
  cost: number;
  creditsBalance: number;
  onCycleDemoBalance: () => void;
}) {
  const [open, setOpen] = useState(false);
  const unitCost = Math.round(cost / ESTIMATED_OUTPUT_COUNT_PLACEHOLDER);

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={onCycleDemoBalance}
        className="flex items-center gap-1.5 rounded-lg border border-[#ececf1] bg-white px-3 py-[7px] text-[13px] font-semibold text-[#6a6b7b] transition hover:border-[#ffbd99] hover:bg-[#fffaf7]"
        title="演示：点击切换余额，查看余额不足效果"
      >
        <CreditIcon />
        {cost.toLocaleString("en-US")}
      </button>
      {open && (
        // pb bridges the gap to the trigger button with an invisible hit-area, so moving the
        // mouse from the button up into this panel never leaves the hoverable region.
        <div className="absolute bottom-full right-0 z-[70] pb-[10px]">
          <div className="flex items-center gap-2 whitespace-nowrap rounded-2xl bg-white px-5 py-4 shadow-[0_20px_40px_rgba(26,26,46,0.16)]">
            <span className="flex items-center gap-1.5 text-[15px] font-bold text-[#1a1a2e]">
              <CreditIcon />
              {ESTIMATED_OUTPUT_COUNT_PLACEHOLDER} × {unitCost.toLocaleString("en-US")} = {cost.toLocaleString("en-US")}
            </span>
            <span className="text-[#d8d8de]">|</span>
            <span className="text-[15px] text-[#8d8e9d]">Credits left: {creditsBalance.toLocaleString("en-US")}</span>
            <button
              type="button"
              className="text-[15px] font-medium text-[#8d8e9d] underline underline-offset-2 transition hover:text-[#5f5b68]"
            >
              Upgrade
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Swaps to an Upgrade CTA when the estimated cost exceeds the (demo) balance.
function CreateOrUpgradeButton({
  insufficientBalance,
  className = composerCta,
}: {
  insufficientBalance: boolean;
  className?: string;
}) {
  if (insufficientBalance) {
    return (
      <button type="button" className={className}>
        Upgrade
      </button>
    );
  }
  return (
    <button type="button" className={className}>
      <Image src={memberPromoAssets.sparkle} alt="" width={42} height={42} className="size-[18px]" />
      Create
    </button>
  );
}

export function MarketingAgentPromptComposer({
  className = "",
  scrollReactive = false,
}: {
  className?: string;
  scrollReactive?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [openMenu, setOpenMenu] = useState<ComposerMenu>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentKind>("marketing");
  const [autoEnabled, setAutoEnabled] = useState(true);
  const [modelMode, setModelMode] = useState<ModelMode>("image");
  const [selectedModel, setSelectedModel] = useState("GPT-image-2");
  const [resolution, setResolution] = useState("Low");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [demoBalanceIndex, setDemoBalanceIndex] = useState(0);
  const creditsBalance = DEMO_BALANCE_PRESETS[demoBalanceIndex];
  const cycleDemoBalance = () => setDemoBalanceIndex((i) => (i + 1) % DEMO_BALANCE_PRESETS.length);
  const insufficientBalance = !autoEnabled && ESTIMATED_CREDITS_PLACEHOLDER > creditsBalance;
  const lastScrollY = useRef(0);

  useEffect(() => {
    if (!openMenu) return;

    const closeMenu = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest("[data-composer-menu]")) {
        setOpenMenu(null);
      }
    };

    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, [openMenu]);

  useEffect(() => {
    if (!scrollReactive) return;
    lastScrollY.current = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY.current;

      if (scrollDelta < -4) {
        setExpanded(true);
      } else if (scrollDelta > 4) {
        setExpanded(false);
        setOpenMenu(null);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrollReactive]);

  // External entry points (e.g. homepage cards) can preset the agent + prompt.
  useEffect(() => {
    const onPreset = (event: Event) => {
      const detail = (event as CustomEvent).detail as { agent?: AgentKind; prompt?: string } | undefined;
      if (detail?.agent) setSelectedAgent(detail.agent);
      if (typeof detail?.prompt === "string") setDraft(detail.prompt);
      setExpanded(true);
      setOpenMenu(null);
    };
    window.addEventListener("composer:preset", onPreset as EventListener);
    return () => window.removeEventListener("composer:preset", onPreset as EventListener);
  }, []);

  return (
    <div className={className}>
      <div className="rounded-[22px] border border-[#ececf1] bg-white/95 shadow-[0_20px_50px_rgba(26,26,46,0.18)] backdrop-blur-xl transition-all duration-300 focus-within:border-[#ff5e1a] focus-within:ring-2 focus-within:ring-[#ff5e1a]/20">
        {expanded ? (
          <div className="p-3">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Describe your idea or campaign..."
              className="h-[72px] w-full resize-none bg-transparent px-2 pt-1 text-[15px] leading-relaxed text-[#1a1a2e] outline-none placeholder:text-[#9a9bb0]"
              aria-label="Marketing campaign prompt"
            />
            <div className="flex items-center justify-between gap-2 px-1 pt-2">
              <ComposerControls
                openMenu={openMenu}
                onMenuChange={setOpenMenu}
                selectedAgent={selectedAgent}
                onAgentChange={setSelectedAgent}
                autoEnabled={autoEnabled}
                onAutoChange={setAutoEnabled}
                modelMode={modelMode}
                onModelModeChange={setModelMode}
                resolution={resolution}
                onResolutionChange={setResolution}
                aspectRatio={aspectRatio}
                onAspectRatioChange={setAspectRatio}
                selectedModel={selectedModel}
                onSelectedModelChange={setSelectedModel}
              />
              <div className="flex shrink-0 items-center gap-2">
                {!autoEnabled && (
                  <CreditEstimateBadge
                    cost={ESTIMATED_CREDITS_PLACEHOLDER}
                    creditsBalance={creditsBalance}
                    onCycleDemoBalance={cycleDemoBalance}
                  />
                )}
                <CreateOrUpgradeButton insufficientBalance={insufficientBalance} />
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            onFocus={() => setExpanded(true)}
            className="flex h-[62px] w-full items-center gap-3 px-3 text-left"
            aria-label="Expand Marketing Agent prompt"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-[#ececf1] text-[#707186]">
              <Plus className="size-4" />
            </span>
            <span className="min-w-0 flex-1 truncate border-l border-[#ededf2] pl-3 text-[15px] text-[#9a9bb0]">
              {draft || "Describe your idea or campaign..."}
            </span>
            <span className={composerCta}>
              <Image src={memberPromoAssets.sparkle} alt="" width={42} height={42} className="size-[18px]" />
              Create
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

export default function MarketingAgentMissions() {
  const [draft, setDraft] = useState("");
  const [attached, setAttached] = useState<Mission["attachments"]>(undefined);
  const [openProjectMenu, setOpenProjectMenu] = useState<string | null>(null);
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [activeProject, setActiveProject] = useState<string>(PROJECTS[0].name);
  const [projectQuery, setProjectQuery] = useState("");
  const [activeShowcaseFilter, setActiveShowcaseFilter] = useState("All");
  const [quickCat, setQuickCat] = useState<QuickLinkCategory>("Image");
  const [showFloatingComposer, setShowFloatingComposer] = useState(false);
  const [floatingComposerExpanded, setFloatingComposerExpanded] = useState(false);
  const [openComposerMenu, setOpenComposerMenu] = useState<ComposerMenu>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentKind>("marketing");
  const [autoEnabled, setAutoEnabled] = useState(true);
  const [modelMode, setModelMode] = useState<ModelMode>("image");
  const [selectedModel, setSelectedModel] = useState("GPT-image-2");
  const [resolution, setResolution] = useState("Low");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [demoBalanceIndex, setDemoBalanceIndex] = useState(0);
  const creditsBalance = DEMO_BALANCE_PRESETS[demoBalanceIndex];
  const cycleDemoBalance = () => setDemoBalanceIndex((i) => (i + 1) % DEMO_BALANCE_PRESETS.length);
  const insufficientBalance = !autoEnabled && ESTIMATED_CREDITS_PLACEHOLDER > creditsBalance;
  const topComposerRef = useRef<HTMLDivElement>(null);
  const heroTextareaRef = useRef<HTMLTextAreaElement>(null);
  const showcaseSectionRef = useRef<HTMLElement>(null);
  const atmosphereRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const floatingComposerHoveredRef = useRef(false);

  useEffect(() => {
    const updateFloatingComposer = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY.current;
      const topComposer = topComposerRef.current?.getBoundingClientRect();
      const showcaseSection = showcaseSectionRef.current?.getBoundingClientRect();
      const shouldShow = Boolean(
        topComposer &&
          showcaseSection &&
          topComposer.bottom <= 0 &&
          showcaseSection.top < window.innerHeight,
      );

      setShowFloatingComposer((shown) => (shown === shouldShow ? shown : shouldShow));

      if (!shouldShow) {
        setFloatingComposerExpanded(false);
        setOpenComposerMenu(null);
      } else if (Math.abs(scrollDelta) > 4) {
        if (scrollDelta < 0) {
          setFloatingComposerExpanded(true);
        } else if (!floatingComposerHoveredRef.current) {
          setFloatingComposerExpanded(false);
          setOpenComposerMenu(null);
        }
      }

      lastScrollY.current = currentScrollY;
    };

    lastScrollY.current = window.scrollY;
    const frame = window.requestAnimationFrame(updateFloatingComposer);
    window.addEventListener("scroll", updateFloatingComposer, { passive: true });
    window.addEventListener("resize", updateFloatingComposer);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateFloatingComposer);
      window.removeEventListener("resize", updateFloatingComposer);
    };
  }, []);

  useEffect(() => {
    if (!openComposerMenu) return;

    const closeMenu = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest("[data-composer-menu]")) {
        setOpenComposerMenu(null);
      }
    };

    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, [openComposerMenu]);

  useEffect(() => {
    if (!openProjectMenu) return;
    const handlePointerDown = (event: MouseEvent) => {
      if ((event.target as HTMLElement).closest("[data-project-menu]")) return;
      setOpenProjectMenu(null);
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [openProjectMenu]);

  const tryShowcase = (prompt: string) => {
    setDraft(prompt);
    setAttached(undefined);
    window.scrollTo({ top: 0, behavior: "smooth" });
    requestAnimationFrame(() => heroTextareaRef.current?.focus());
  };

  const visibleShowcases =
    activeShowcaseFilter === "All"
      ? SHOWCASES
      : SHOWCASES.filter(({ category }) => category === activeShowcaseFilter);

  const visibleProjects = PROJECTS.filter(({ name }) =>
    name.toLowerCase().includes(projectQuery.trim().toLowerCase()),
  );

  return (
    <div
      className="relative isolate min-h-screen bg-[#fffdfb] text-[#1a1a2e]"
      onPointerMove={(event) => {
        const atmosphere = atmosphereRef.current;
        if (!atmosphere) return;
        atmosphere.style.setProperty("--ma-pointer-x", `${event.clientX}px`);
        atmosphere.style.setProperty("--ma-pointer-y", `${event.clientY + window.scrollY}px`);
        atmosphere.style.setProperty("--ma-pointer-opacity", "1");
      }}
      onPointerLeave={() => {
        atmosphereRef.current?.style.setProperty("--ma-pointer-opacity", "0");
      }}
    >
      <div ref={atmosphereRef} className="marketing-agent-brand-field" aria-hidden="true" />
      <div className="relative z-10 flex">
        {/* left icon rail (collapsed nav) */}
        <aside className={`fixed inset-y-0 left-0 z-40 hidden w-[72px] flex-col items-center gap-1 overflow-y-auto border-r border-[#ececf1] bg-white py-4 ${projectsOpen ? "lg:flex" : ""}`}>
          <span className={`mb-3 grid size-9 place-items-center rounded-[11px] ${ctaGrad} text-white`}>
            <img src="/prototypes/marketing-agent/brand-logo-white.svg" alt="Buzz" className="size-5" />
          </span>
          {SIDE_NAV.map(({ label, icon, active, href }) => {
            const className = `group flex w-14 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] font-semibold leading-none transition ${
              active
                ? "bg-[#fff3ec] text-[#ff5e1a]"
                : "text-[#6a6b7b] hover:bg-[#fff7f1] hover:text-[#ff5e1a]"
            }`;
            const content = (
              <>
                <span
                  aria-hidden="true"
                  className={`size-[20px] transition ${
                    active
                      ? "bg-[#ff5e1a]"
                      : "bg-[#6a6b7b] group-hover:bg-[#ff5e1a]"
                  }`}
                  style={{
                    mask: `url('${icon}') center / contain no-repeat`,
                    WebkitMask: `url('${icon}') center / contain no-repeat`,
                  }}
                />
                {label}
              </>
            );

            return href ? (
              <Link key={label} href={href} className={className}>
                {content}
              </Link>
            ) : (
              <button key={label} type="button" className={className}>
                {content}
              </button>
            );
          })}
        </aside>

        {/* projects sidebar */}
        <aside className={`fixed inset-y-0 z-40 hidden flex-col border-r border-[#ececf1] bg-white lg:flex ${projectsOpen ? "left-[72px] w-[264px]" : "left-0 w-[72px] items-center"}`}>
          {projectsOpen ? (
          <>
            <div className="flex items-center justify-between gap-2 border-b border-[#ececf1] px-4 py-[18px]">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  aria-hidden="true"
                  className="size-5 shrink-0 bg-[#1a1a2e]"
                  style={{
                    mask: `url('${HP_ICONS.marketing}') center / contain no-repeat`,
                    WebkitMask: `url('${HP_ICONS.marketing}') center / contain no-repeat`,
                  }}
                />
                <span className="truncate font-[family-name:var(--font-display)] text-[15px] font-extrabold tracking-tight">
                  Marketing Agent
                </span>
              </div>
              <button
                onClick={() => setProjectsOpen(false)}
                className="grid size-7 shrink-0 place-items-center rounded-lg text-[#8d8e9d] transition hover:bg-[#fff3ec] hover:text-[#ff5e1a]"
                aria-label="Collapse projects panel"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  preserveAspectRatio="xMidYMid meet"
                  fill="none"
                  role="presentation"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M17.5 3A4.5 4.5 0 0 1 22 7.5v9a4.5 4.5 0 0 1-4.5 4.5h-11A4.5 4.5 0 0 1 2 16.5v-9A4.5 4.5 0 0 1 6.5 3h11Zm-6.3 16h6.3a2.5 2.5 0 0 0 2.5-2.5v-9A2.5 2.5 0 0 0 17.5 5h-6.3v14ZM6.5 5A2.5 2.5 0 0 0 4 7.5v9A2.5 2.5 0 0 0 6.5 19h2.7V5H6.5Z"
                    fill="currentColor"
                  />
                </svg>
              </button>
            </div>

            <div className="flex items-center justify-between px-4 pb-2 pt-2">
              <span className="text-[13px] font-bold text-[#8d8e9d]">
                Projects
              </span>
              <button
                className="grid size-7 place-items-center rounded-lg text-[#6a6b7b] transition hover:bg-[#fff3ec] hover:text-[#ff5e1a]"
                aria-label="New project"
              >
                <Plus className="size-4" />
              </button>
            </div>

            <div className="px-3 pb-2">
              <div className="flex items-center gap-2 rounded-xl border border-[#ececf1] bg-[#fafafd] px-3 py-2 text-sm transition focus-within:border-[#ff5e1a] focus-within:bg-white">
                <Search className="size-4 shrink-0 text-[#9a9bb0]" />
                <input
                  value={projectQuery}
                  onChange={(e) => setProjectQuery(e.target.value)}
                  placeholder="Search projects"
                  className="w-full bg-transparent text-[#1a1a2e] outline-none placeholder:text-[#9a9bb0]"
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-0.5 px-2 pb-4">
              {visibleProjects.map(({ name }) => {
                const menuOpen = openProjectMenu === name;
                const isActive = activeProject === name;
                return (
                  <div key={name} className="group relative">
                    <button
                      onClick={() => setActiveProject(name)}
                      className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm font-semibold transition ${
                        isActive
                          ? "bg-[#f7f7f9] text-[#1a1a2e]"
                          : "text-[#4a4b5c] hover:bg-[#fafafd]"
                      }`}
                    >
                      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#f3f3f6]">
                        <span aria-hidden className="size-4 bg-[#c2c2ce]" style={SPARKLE_MASK} />
                      </span>
                      <span className="min-w-0 flex-1 truncate capitalize">{name}</span>
                    </button>
                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                      <button
                        data-project-menu
                        onClick={() => setOpenProjectMenu(menuOpen ? null : name)}
                        className={`grid size-7 place-items-center rounded-lg text-[#777889] transition hover:bg-white hover:text-[#ff5e1a] ${
                          menuOpen
                            ? "bg-white text-[#ff5e1a]"
                            : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
                        }`}
                        aria-label={`More actions for ${name}`}
                        aria-expanded={menuOpen}
                      >
                        <MoreHorizontal className="size-4" />
                      </button>
                    </div>
                    {menuOpen && (
                      <div data-project-menu className="absolute left-full top-0 z-50 ml-2 w-40 overflow-hidden rounded-xl border border-[#ececf1] bg-white py-1 shadow-[0_14px_30px_rgba(26,26,46,0.16)]">
                        <button onClick={() => setOpenProjectMenu(null)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-semibold text-[#1a1a2e] transition hover:bg-[#fff7f1]">
                          <Pin className="size-4" /> Pin
                        </button>
                        <button onClick={() => setOpenProjectMenu(null)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-semibold text-[#1a1a2e] transition hover:bg-[#fff7f1]">
                          <Pencil className="size-4" /> Rename
                        </button>
                        <div className="my-1 border-t border-[#fff0ea]" />
                        <button onClick={() => setOpenProjectMenu(null)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-semibold text-[#ef5139] transition hover:bg-[#fff7f1]">
                          <Trash2 className="size-4" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              {visibleProjects.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-[#9a9bb0]">No projects found</p>
              )}
            </div>
          </>
          ) : (
          <>
            <button
              onClick={() => setProjectsOpen(true)}
              aria-label="Expand projects panel"
              className={`mt-4 grid size-9 place-items-center rounded-[11px] ${ctaGrad} text-white`}
            >
              <img src="/prototypes/marketing-agent/brand-logo-white.svg" alt="Buzz" className="size-5" />
            </button>
            <div className="my-3 h-px w-8 bg-[#ececf1]" />
            <button
              aria-label="New project"
              className="grid size-11 place-items-center rounded-xl border border-dashed border-[#d4d4dd] text-[#6a6b7b] transition hover:border-[#ff5e1a] hover:text-[#ff5e1a]"
            >
              <Plus className="size-[18px]" />
            </button>
            <div className="mt-3 flex min-h-0 flex-1 flex-col items-center gap-2 overflow-y-auto">
              {PROJECTS.map(({ name }) => {
                const isActive = activeProject === name;
                return (
                  <button
                    key={name}
                    title={name}
                    onClick={() => setActiveProject(name)}
                    className={`grid size-11 shrink-0 place-items-center rounded-xl transition ${
                      isActive
                        ? "border-2 border-[#1a1a2e] bg-white"
                        : "bg-[#f2f2f6] hover:bg-[#ececf1]"
                    }`}
                  >
                    <span aria-hidden className={`size-[18px] ${isActive ? "bg-[#1a1a2e]" : "bg-[#9a9bb0]"}`} style={SPARKLE_MASK} />
                  </button>
                );
              })}
            </div>
            <button className="mb-5 mt-3 flex flex-col items-center gap-1 text-[11px] font-semibold leading-none text-[#8d8e9d] transition hover:text-[#ff5e1a]">
              <MoreHorizontal className="size-5" />
              More
            </button>
          </>
          )}
        </aside>

        {/* main */}
        <main className={`min-w-0 flex-1 transition-[margin] ${projectsOpen ? "lg:ml-[336px]" : "lg:ml-[72px]"}`}>
          {/* top bar */}
          <header className="flex items-center justify-end gap-3 px-6 py-3">
            <nav className="mr-auto flex items-center gap-2 lg:hidden" aria-label="Creative tools">
              <Link
                href="/prototypes/workflow-canvas#workflows"
                className="flex items-center gap-1.5 rounded-full border border-[#ececf1] bg-white px-3 py-1.5 text-xs font-bold text-[#5f5b68] shadow-sm transition hover:border-[#ffc7a9] hover:text-[#ff5e1a]"
              >
                <GitBranch className="size-3.5" />
                Workflows
              </Link>
              <Link
                href="/prototypes/workflow-canvas"
                className="flex items-center gap-1.5 rounded-full border border-[#ececf1] bg-white px-3 py-1.5 text-xs font-bold text-[#5f5b68] shadow-sm transition hover:border-[#ffc7a9] hover:text-[#ff5e1a]"
              >
                <Frame className="size-3.5" />
                Canvas
              </Link>
            </nav>
            <button
              type="button"
              onClick={cycleDemoBalance}
              className="flex items-center gap-1.5 rounded-full bg-[#fff3ec] px-3 py-1.5 text-xs font-bold text-[#ff5e1a] transition hover:bg-[#ffe8db]"
              title="演示：点击切换余额，查看余额不足效果"
            >
              <CreditIcon />
              {creditsBalance.toLocaleString("en-US")} credits
            </button>
            <button className={`rounded-full ${ctaGrad} px-4 py-1.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(255,82,85,0.28)]`}>
              Upgrade
            </button>
            <HelpCircle className="size-5 text-[#9a9bb0]" />
            <span className="grid size-8 place-items-center rounded-full bg-[#1a1a2e] text-xs font-bold text-white">
              S
            </span>
          </header>

          <div className="px-6">
            {/* hero */}
            <h1 className={`${bricolageExtraBold.className} mt-6 text-center text-[clamp(30px,3.6vw,48px)] leading-[1.1] tracking-[-0.04em]`}>
              <span className={gradText}>Marketing Agent:</span> Your ideas,
              <br /> campaign-ready in seconds
            </h1>

            {/* composer */}
            <div ref={topComposerRef} className="mx-auto mt-7 w-[922px] max-w-full">
              <div className="flex h-[178px] flex-col rounded-[22px] border border-[#ececf1] bg-white p-3.5 shadow-[0_4px_16px_rgba(26,26,46,0.06)] transition focus-within:border-[#ff5e1a] focus-within:ring-2 focus-within:ring-[#ff5e1a]/20">
                {attached && attached.length > 0 && (
                  <div className="mb-1.5 flex flex-wrap items-center gap-2 px-1">
                    {attached.map((a) => (
                      <div key={a.label} className="relative">
                        {a.type === "video" ? (
                          <video
                            src={a.url}
                            muted
                            playsInline
                            className="size-11 rounded-lg object-cover ring-1 ring-[#ececf1]"
                          />
                        ) : (
                          <img
                            src={a.url}
                            alt={a.label}
                            className="size-11 rounded-lg object-cover ring-1 ring-[#ececf1]"
                          />
                        )}
                        <button
                          onClick={() =>
                            setAttached((prev) =>
                              prev?.filter((x) => x.label !== a.label),
                            )
                          }
                          className="absolute -right-1.5 -top-1.5 grid size-4 place-items-center rounded-full bg-[#1a1a2e] text-[10px] leading-none text-white"
                          aria-label={`Remove ${a.label}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <textarea
                  ref={heroTextareaRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Describe your idea or campaign, or paste a product / landing page / IG post URL. Use @ to reference uploaded files."
                  className="w-full flex-1 resize-none bg-transparent px-2 pt-1 text-[15px] leading-relaxed text-[#1a1a2e] outline-none placeholder:text-[#9a9bb0]"
                />
                <div className="flex items-center justify-between gap-2 px-1 pt-2">
                  <ComposerControls
                    openMenu={openComposerMenu}
                    onMenuChange={setOpenComposerMenu}
                    selectedAgent={selectedAgent}
                    onAgentChange={setSelectedAgent}
                    autoEnabled={autoEnabled}
                    onAutoChange={setAutoEnabled}
                    modelMode={modelMode}
                    onModelModeChange={setModelMode}
                    resolution={resolution}
                    onResolutionChange={setResolution}
                    aspectRatio={aspectRatio}
                    onAspectRatioChange={setAspectRatio}
                    selectedModel={selectedModel}
                    onSelectedModelChange={setSelectedModel}
                    menuPlacement="down"
                  />
                  <div className="flex shrink-0 items-center gap-2">
                    {!autoEnabled && (
                      <CreditEstimateBadge
                        cost={ESTIMATED_CREDITS_PLACEHOLDER}
                        creditsBalance={creditsBalance}
                        onCycleDemoBalance={cycleDemoBalance}
                      />
                    )}
                    <CreateOrUpgradeButton insufficientBalance={insufficientBalance} />
                  </div>
                </div>
              </div>
            </div>

            {/* homepage hero content block (replaces former My projects cards) */}
            <section className="mx-auto mt-10 w-full max-w-[1400px]">
              <div className="mb-6 flex flex-wrap items-center justify-center gap-2" role="tablist" aria-label="Tool categories">
                {QUICK_LINK_CATEGORIES.map((cat) => {
                  const isActive = quickCat === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setQuickCat(cat)}
                      className={`relative flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border px-[18px] text-[13px] font-semibold leading-4 shadow-[0_2px_2px_rgba(26,26,46,0.06),inset_0_1px_2px_rgba(255,255,255,0.9)] backdrop-blur-xl transition-[background-color,color,filter] motion-reduce:transition-none ${
                        isActive
                          ? "border-transparent bg-[#1a1a2e] text-white shadow-[0_3px_8px_rgba(26,26,46,0.18),inset_0_1px_2px_rgba(255,255,255,0.16)]"
                          : "border-white/70 bg-white/35 text-[#626371] shadow-[0_3px_8px_rgba(26,26,46,0.06),inset_0_1px_1px_rgba(255,255,255,0.78)] hover:border-white/90 hover:bg-white/55 hover:text-[#1a1a2e]"
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
              <div className="grid grid-cols-2 items-stretch gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {quickLinks.filter(({ category }) => category === quickCat).map(({ name, description, prompt, thumb }) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => tryShowcase(prompt)}
                    className="group relative flex min-w-0 flex-col overflow-hidden rounded-[18px] border border-[#efe7e2] bg-white text-left shadow-[0_10px_30px_rgba(83,73,100,0.08)] transition hover:-translate-y-0.5 hover:border-[#ff9a72] hover:shadow-[0_14px_34px_rgba(255,94,26,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fff6f0]"
                  >
                    <div className="relative overflow-hidden bg-[#f2eef1]">
                      {thumb ? (
                        <img src={thumb} alt="" className="block h-auto w-full transition duration-500 group-hover:scale-105" />
                      ) : (
                        <span className="grid aspect-[16/10] w-full place-items-center text-[#cfc8d0]"><ImageIcon className="size-7" strokeWidth={1.5} /></span>
                      )}
                    </div>
                    <div className="p-3.5">
                      <h3 className="truncate text-[14px] font-bold leading-tight tracking-[-0.02em] text-[#17151b]">
                        {name}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-[12px] leading-[1.4] text-[#726d78]">
                        {description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section ref={showcaseSectionRef} className="mx-auto mb-20 mt-12 max-w-[1400px] xl:pt-[26px]">
              <div className="mb-6 flex flex-wrap items-center justify-center gap-2 xl:mb-[26px]" role="tablist" aria-label="Creation categories">
                {SHOWCASE_FILTERS.map(({ label, Icon, badge }) => {
                  const isActive = activeShowcaseFilter === label;
                  const tabId = `showcase-tab-${label.toLowerCase().replaceAll(" ", "-")}`;
                  return (
                    <button
                      key={label}
                      id={tabId}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-controls="showcase-panel"
                      onClick={() => setActiveShowcaseFilter(label)}
                      className={`relative flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border px-[18px] text-[13px] font-semibold leading-4 shadow-[0_2px_2px_rgba(26,26,46,0.06),inset_0_1px_2px_rgba(255,255,255,0.9)] backdrop-blur-xl transition-[background-color,color,filter] motion-reduce:transition-none ${
                        isActive
                          ? "border-transparent bg-[#1a1a2e] text-white shadow-[0_3px_8px_rgba(26,26,46,0.18),inset_0_1px_2px_rgba(255,255,255,0.16)]"
                          : "border-white/70 bg-white/35 text-[#626371] shadow-[0_3px_8px_rgba(26,26,46,0.06),inset_0_1px_1px_rgba(255,255,255,0.78)] hover:border-white/90 hover:bg-white/55 hover:text-[#1a1a2e]"
                      }`}
                    >
                      {Icon && <Icon className="size-4 shrink-0" />}
                      {label}
                      {badge && <img src="/prototypes/starter-guide/icons/new.svg" alt="New" className="h-[18px] w-auto" />}
                    </button>
                  );
                })}
              </div>

              <div
                id="showcase-panel"
                role="tabpanel"
                aria-labelledby={`showcase-tab-${activeShowcaseFilter.toLowerCase().replaceAll(" ", "-")}`}
                className="grid gap-5 lg:grid-cols-2"
              >
                {visibleShowcases.map(({ title, subtitle, icon, scenes, prompt }) => (
                  <article
                    key={title}
                    className="flex flex-col rounded-[26px] border border-[#ececf1] bg-white p-3 shadow-[0_12px_34px_rgba(26,26,46,0.04)]"
                  >
                    <div className="grid grid-cols-3 gap-2">
                      {scenes.map((scene, index) => (
                        <button
                          key={index}
                          onClick={() => tryShowcase(prompt)}
                          className="group relative aspect-[0.72] overflow-hidden rounded-[17px] bg-[#efeff4] text-left xl:aspect-[0.59]"
                          aria-label={`Recreate ${title} scene ${index + 1}`}
                        >
                          {scene ? (
                            /\.(mp4|webm|mov)$/i.test(scene) ? (
                              <video
                                src={scene}
                                autoPlay
                                muted
                                loop
                                playsInline
                                className="size-full object-cover transition duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <img
                                src={scene}
                                alt=""
                                className="size-full object-cover transition duration-500 group-hover:scale-105"
                              />
                            )
                          ) : (
                            <span className="grid size-full place-items-center bg-[repeating-linear-gradient(45deg,#f0eef2,#f0eef2_10px,#e9e7ec_10px,#e9e7ec_20px)] text-[11px] font-semibold text-[#b8b7c0]">
                              {index + 1}
                            </span>
                          )}
                          <span className="absolute inset-0 bg-[#1a1a2e]/18 opacity-0 transition duration-200 group-hover:opacity-100" />
                          <span className="absolute right-2 top-2 grid size-8 scale-90 place-items-center rounded-full bg-[#1a1a2e]/75 text-white opacity-0 shadow-sm backdrop-blur-sm transition duration-200 group-hover:scale-100 group-hover:opacity-100">
                            <VolumeX className="size-4" />
                          </span>
                          <span className="absolute inset-x-2 bottom-2 flex translate-y-2 items-center justify-center rounded-lg bg-white px-2 py-2 text-xs font-extrabold text-[#1a1a2e] opacity-0 shadow-[0_8px_20px_rgba(26,26,46,0.2)] transition duration-200 group-hover:translate-y-0 group-hover:opacity-100">
                            Recreate
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="mt-3 flex h-[45px] items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        {icon ? (
                          <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-2xl border border-white bg-[#fff7f2] shadow-[0_7px_16px_rgba(255,94,26,0.1)]">
                            <img src={icon} alt="" className="size-full object-contain" />
                          </span>
                        ) : (
                          (() => {
                            const meta = SHOWCASE_ICON[title];
                            const Glyph = meta?.Icon ?? Sparkles;
                            return (
                              <span
                                className="grid size-11 shrink-0 place-items-center rounded-2xl text-white shadow-[0_7px_16px_rgba(26,26,46,0.18)]"
                                style={{ backgroundImage: meta?.bg ?? "linear-gradient(135deg,#FFA73C,#FF6B4E)" }}
                              >
                                <Glyph className="size-5" />
                              </span>
                            );
                          })()
                        )}
                        <div>
                          <h3 className="text-[17px] font-semibold leading-tight">{title}</h3>
                          <p className="mt-0.5 text-sm leading-snug text-[#7b7c8d]">{subtitle}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => tryShowcase(prompt)}
                        className="shrink-0 rounded-lg bg-gradient-to-r from-[#FFA73C] to-[#FF6B4E] px-4 py-2 text-sm font-extrabold text-white shadow-[0_8px_18px_rgba(255,94,26,0.2)] transition hover:brightness-105"
                      >
                        Try
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>

      {showFloatingComposer && (
        <div
          className={`fixed bottom-5 left-1/2 z-50 w-[min(860px,calc(100vw-32px))] -translate-x-1/2 transition-all duration-300 ease-out ${projectsOpen ? "lg:left-[calc(50%+168px)]" : "lg:left-[calc(50%+36px)]"}`}
          onMouseEnter={() => {
            floatingComposerHoveredRef.current = true;
            setFloatingComposerExpanded(true);
          }}
          onMouseLeave={() => {
            floatingComposerHoveredRef.current = false;
          }}
        >
          <div className="rounded-[22px] border border-[#ececf1] bg-white/95 shadow-[0_20px_50px_rgba(26,26,46,0.18)] backdrop-blur-xl transition-all duration-300 focus-within:border-[#ff5e1a] focus-within:ring-2 focus-within:ring-[#ff5e1a]/20">
            {floatingComposerExpanded ? (
              <div className="p-3">
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Describe your idea or campaign..."
                  className="h-[72px] w-full resize-none bg-transparent px-2 pt-1 text-[15px] leading-relaxed text-[#1a1a2e] outline-none placeholder:text-[#9a9bb0]"
                  aria-label="Floating campaign prompt"
                />
                <div className="flex items-center justify-between gap-2 px-1 pt-2">
                  <ComposerControls
                    openMenu={openComposerMenu}
                    onMenuChange={setOpenComposerMenu}
                    selectedAgent={selectedAgent}
                    onAgentChange={setSelectedAgent}
                    autoEnabled={autoEnabled}
                    onAutoChange={setAutoEnabled}
                    modelMode={modelMode}
                    onModelModeChange={setModelMode}
                    resolution={resolution}
                    onResolutionChange={setResolution}
                    aspectRatio={aspectRatio}
                    onAspectRatioChange={setAspectRatio}
                    selectedModel={selectedModel}
                    onSelectedModelChange={setSelectedModel}
                  />
                  <div className="flex shrink-0 items-center gap-2">
                    {!autoEnabled && (
                      <CreditEstimateBadge
                        cost={ESTIMATED_CREDITS_PLACEHOLDER}
                        creditsBalance={creditsBalance}
                        onCycleDemoBalance={cycleDemoBalance}
                      />
                    )}
                    <CreateOrUpgradeButton insufficientBalance={insufficientBalance} />
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setFloatingComposerExpanded(true)}
                onFocus={() => setFloatingComposerExpanded(true)}
                className="flex h-[62px] w-full items-center gap-3 px-3 text-left"
                aria-label="Expand campaign prompt"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-[#ececf1] text-[#707186]">
                  <Plus className="size-4" />
                </span>
                <span className="min-w-0 flex-1 truncate border-l border-[#ededf2] pl-3 text-[15px] text-[#9a9bb0]">
                  {draft || "Describe your idea or campaign..."}
                </span>
                <span className={composerCta}>
                  <Image src={memberPromoAssets.sparkle} alt="" width={42} height={42} className="size-[18px]" />
                  Create
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
