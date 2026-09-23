"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContext, useContext } from "react";
import { setPendingHandoff } from "./chat/handoff";
import { HistoryList } from "./chat/shell";
import localFont from "next/font/local";
import {
  Plus,
  ArrowRight,
  Loader2,
  FolderOpen,
  Paperclip,
  X,
  Lock,
  Globe,
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
  src: "../../../../fonts/BricolageGrotesque-ExtraBold.ttf",
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
  { label: "Home", icon: `${HP_ICON_ROOT}/home.svg`, href: "/prototypes/hybrid-reel" },
  { label: "Agent", icon: `${HP_ICON_ROOT}/marketing-agent.svg`, active: true },
  { label: "Canvas", icon: `${HP_ICON_ROOT}/canvas.svg`, href: "/prototypes/hybrid-reel/canvas" },
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

/* 演示用的账号状态。真实产品里这来自登录态,原型里由页面顶部那条演示条切换。
   企业账号直接进功能,非企业账号撞门禁。 */
const DemoAccountContext = createContext(false);

/* composer 里挂着的本地素材。上传发生在「+」→ Local Upload(系统文件选择器),
   Create 时连同 prompt 一起带给对话页做分析 —— 对话页自己不再出上传卡。 */
type LocalFile = { file: File; url: string };
const ComposerFilesContext = createContext<{
  files: LocalFile[];
  openPicker: () => void;
  removeFile: (index: number) => void;
}>({ files: [], openPicker: () => {}, removeFile: () => {} });

type ComposerMenu = "agent" | "settings" | "tools" | null;
type AgentKind = "marketing" | "image" | "video" | "hybrid";
type ModelMode = "image" | "video";
type ModelOption = { name: string; description: string; icon: string };

const AGENT_OPTIONS: ReadonlyArray<{
  id: AgentKind;
  label: string;
  description: string;
  premium?: boolean;
  enterprise?: boolean;
  features: string[];
  howTo: string;
}> = [
  {
    id: "marketing",
    label: "Marketing Agent",
    description: "AI marketing expert — marketing strategy, ad copy, and creatives in one.",
    features: [
      "Built-in marketing and advertising expertise",
      "Automatically breaks down your task and selects the right tools",
      "Plans full campaigns — strategy, messaging, and creative direction",
      "Generates images and videos guided by marketing strategy",
    ],
    howTo:
      "Describe your product, brief or just an idea. It handles the full picture — marketing strategy, ad copy, and the creatives to go with it.",
  },
  {
    id: "image",
    label: "Image Gen",
    description: "Fast high-quality image generation, best for fast creative iteration.",
    features: [
      "Text-to-image and image-to-image in one place",
      "Swap models without leaving the composer",
      "Reference your uploaded files with @",
      "Built for iterating on a look, fast",
    ],
    howTo: "Describe the shot you want, or drop a reference image and say what to change.",
  },
  {
    id: "video",
    label: "Video Gen",
    description: "Up to 15 seconds of cinematic-quality video with synced audio and visuals.",
    premium: true,
    features: [
      "Up to 15 seconds per generation",
      "Synced audio and visuals",
      "Image or video reference for consistency",
      "Cinematic camera language out of the box",
    ],
    howTo: "Describe the scene and the camera move. Add a reference frame to lock the look.",
  },
  {
    /* Hybrid Reel 是一种创作类型,不是「+」里的上传工具 —— 排在 Video Gen 下面。
       企业功能:选它先弹 request demo / contact sales(Ryan 提案结尾那段红字)。 */
    id: "hybrid",
    label: "Hybrid Reel",
    description:
      "Turn footage you already shot into a ready-to-run ad — AI plans the cut and shoots what is missing.",
    enterprise: true,
    features: [
      "Reads every clip you upload — picture and sound in one pass",
      "Plans the cut around ad beats: hook, pain, proof, usage, CTA",
      "Finds the beat your footage can't fill, and shoots only that",
    ],
    howTo:
      "Drop in whatever you already shot, answer six questions about the campaign, and approve the storyboard before anything is rendered.",
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
  if (kind === "hybrid") {
    return <Clapperboard className={className} style={brandColor ? { color: "#ff5e1a" } : undefined} />;
  }
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
  const isEnterprise = useContext(DemoAccountContext);
  const [gateOpen, setGateOpen] = useState(false);
  /* 右栏跟着鼠标走;没 hover 时讲当前选中的那一条 */
  const [hovered, setHovered] = useState<AgentKind | null>(null);
  const detail =
    AGENT_OPTIONS.find(({ id }) => id === (hovered ?? selectedAgent)) ?? AGENT_OPTIONS[0];

  return (
    <>
      <div
        onMouseLeave={() => setHovered(null)}
        className="flex w-[min(624px,calc(100vw-48px))] overflow-hidden rounded-[16px] border border-white/80 bg-white/95 shadow-[0_10px_28px_rgba(26,26,46,0.14)] backdrop-blur-xl"
      >
        {/* 左:创作类型 */}
        <div className="w-[252px] shrink-0 p-1.5">
          <p className="px-2.5 pb-1.5 pt-1 text-[12px] font-medium text-[#a0a1aa]">Creation type</p>
          {AGENT_OPTIONS.map(({ id, label, premium, enterprise }) => {
            const isSelected = id === selectedAgent;
            const isHovered = id === (hovered ?? selectedAgent);
            return (
              <button
                key={id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setHovered(id)}
                onFocus={() => setHovered(id)}
                onClick={() =>
                  enterprise && !isEnterprise ? setGateOpen(true) : onSelect(id)
                }
                className={`flex w-full items-center gap-2 rounded-[11px] px-2.5 py-2 text-left transition ${
                  isHovered ? "bg-[#f1f1f2]" : "hover:bg-[#fafafd]"
                }`}
              >
                <span
                  className={`grid size-7 shrink-0 place-items-center ${
                    isSelected ? "text-[#ff6a2e]" : "text-[#485063]"
                  }`}
                >
                  <AgentIcon kind={id} className="size-[18px]" />
                </span>
                <span className="flex min-w-0 flex-1 items-center gap-1.5 whitespace-nowrap text-[13px] font-medium leading-4 text-[#15182b]">
                  {label}
                  {premium && <img src={COMPOSER_ICONS.member} alt="Member" className="size-4" />}
                  {enterprise && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#ff5e1a] px-1.5 py-[1px] text-[9.5px] font-bold uppercase tracking-wide text-white">
                      <Lock className="size-2.5" /> Enterprise
                    </span>
                  )}
                </span>
                {isSelected && <Check className="size-3.5 shrink-0 text-[#15182b]" />}
              </button>
            );
          })}
        </div>

        {/* 右:hover 到哪条就讲哪条 */}
        <div className="hidden min-w-0 flex-1 border-l border-[#ececf1] p-4 sm:block">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-[#fff3ec] text-[#ff6a2e]">
              <AgentIcon kind={detail.id} className="size-[18px]" brandColor />
            </span>
            <span className="text-[15px] font-bold text-[#15182b]">{detail.label}</span>
          </div>

          <p className="mt-3 text-[13px] leading-relaxed text-[#6a6b7b]">{detail.description}</p>

          <p className="mt-4 border-t border-[#ececf1] pt-3 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-[#a0a1aa]">
            Key features
          </p>
          <ul className="mt-2 space-y-1.5">
            {detail.features.map((f) => (
              <li key={f} className="flex gap-2 text-[13px] leading-snug text-[#15182b]">
                <span className="mt-[6px] size-1.5 shrink-0 rounded-full bg-[#ff5e1a]" />
                {f}
              </li>
            ))}
          </ul>

          <p className="mt-4 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-[#a0a1aa]">
            How to use
          </p>
          <p className="mt-2 rounded-xl bg-[#f6f5f8] px-3 py-2.5 text-[13px] leading-relaxed text-[#15182b]">
            {detail.howTo}
          </p>
        </div>
      </div>
      {gateOpen && <EnterpriseGate onClose={() => setGateOpen(false)} />}
    </>
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

/* 「+」drawer —— 真实产品里这里只有三件事:本地上传 / 数字人库 / 资产库。
   Hybrid Reel 不在这里,它是一种创作类型,在 Creation type 下拉里(见 AGENT_OPTIONS)。 */
function ToolsDrawer({ onClose }: { onClose: () => void }) {
  const { openPicker } = useContext(ComposerFilesContext);
  const items = [
    {
      icon: Paperclip,
      label: "Local Upload",
      hint: "Support image, video, pdf, audio",
      onClick: () => {
        onClose();
        openPicker();
      },
    },
    { icon: UserRound, label: "Avatar Library", hint: "Use AI avatars or upload your own" },
    { icon: FolderOpen, label: "Assets", hint: "Reuse generated & uploaded file" },
  ];

  return (
    <div className="w-[300px] rounded-2xl border border-[#ececf1] bg-white p-1.5 shadow-[0_16px_40px_rgba(26,26,46,0.16)]">
      {items.map(({ icon: Icon, label, hint, onClick }) => (
        <button
          key={label}
          type="button"
          onClick={onClick}
          className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-[#faf8f6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/30"
        >
          <Icon className="mt-[3px] size-[18px] shrink-0 text-[#6a6b7b]" />
          <span className="min-w-0 flex-1">
            <span className="block text-[13.5px] font-semibold text-[#1a1a2e]">{label}</span>
            <span className="mt-0.5 block text-[12px] leading-snug text-[#9a9bb0]">{hint}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

/* 企业门禁 + Contact Sales
   ─────────────────────────────────────────────────────────────
   Ryan 提案结尾那段红字定死了形态:插件式新模块对 freemium 隐藏,
   drawer/列表里一个按钮,点进去弹 request demo / contact sales。

   门禁弹窗的设计取舍(product register):
   · 不列功能清单 —— 下拉右栏 hover 时已经讲完,再列一遍是体积不是信息。
   · 一块完整的面,只有演示旁路用虚线分出去,因为那不是产品的一部分。
   · 橙色只出现在身份徽章与主行动两处。
   · 只留一颗 CTA:Request a demo,通向同名表单。

   Request a demo 表单复刻真实产品里 Contact Sales 那张的结构(Name / Email / Description + Cancel / Send),
   不另造一套:原型的标准是能被直接复刻进生产代码。 */

const SALES_EMAIL_PLACEHOLDER = "monica.zhou@presslogic.com";
const DESCRIPTION_LIMIT = 2000;

function EnterpriseGate({ onClose }: { onClose: () => void }) {
  const [shown, setShown] = useState(false);
  const [view, setView] = useState<"gate" | "contact">("gate");

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(true));
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const openContact = () => setView("contact");

  return (
    <div
      className={`fixed inset-0 z-[200] grid place-items-center bg-[#1a1a2e]/35 px-4 transition-opacity duration-200 ease-out motion-reduce:transition-none ${
        shown ? "opacity-100" : "opacity-0"
      }`}
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className={`w-full transition duration-200 ease-out motion-reduce:transition-none ${
          view === "contact" ? "max-w-[492px]" : "max-w-[520px]"
        } ${shown ? "translate-y-0 scale-100 opacity-100" : "translate-y-1 scale-[0.985] opacity-0"}`}
      >
        {view === "gate" ? (
          <GatePanel onClose={onClose} onContact={openContact} />
        ) : (
          <ContactSalesPanel onClose={onClose} onBack={() => setView("gate")} />
        )}
      </div>
    </div>
  );
}

/* 现在市面上 AI 产品的功能锁弹窗(Runway / Higgsfield / Cursor 这一类)有一个共同点:
   先把你看不到的东西摆出来,再谈解锁。纯文字的「这是付费功能」是上一代做法。

   这里顶部那条是这个功能真正的产出物:你手上零散的几条素材 → 一条可投放的竖版广告。
   用的是仓库里已有的真实素材 URL,不画假截图。 */

const GATE_RAW_CLIPS = [
  "https://assets.presslogic.com/buzzvideo/public/2026-07-30/341142771702226944.png",
  "https://assets.presslogic.com/buzzvideo/public/2026-07-30/341142771798695936.png",
  "https://assets.presslogic.com/buzzvideo/public/2026-07-30/341144290052857856.png",
];
const GATE_RESULT = "https://assets.presslogic.com/buzzvideo/public/2026-07-30/341142773015044096.png";

const GATE_POINTS = [
  "Reads every clip, picture and sound",
  "Cuts to hook, proof, usage, CTA",
  "Shoots the shot you never filmed",
];

function GatePanel({ onClose, onContact }: { onClose: () => void; onContact: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="hybrid-gate-title"
      className="relative overflow-hidden rounded-[20px] bg-white text-left shadow-[0_24px_60px_rgba(26,26,46,0.22)]"
    >
      {/* 你看不到的东西:零散素材 → 成片 */}
      <div className="relative flex items-center gap-4 overflow-hidden bg-[#f6f5f8] px-7 py-6">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 grid size-7 place-items-center rounded-lg bg-white/80 text-[#6a6b7b] backdrop-blur transition hover:bg-white hover:text-[#1a1a2e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/30"
        >
          <X className="size-3.5" />
        </button>
        <div className="flex shrink-0 gap-2">
          {GATE_RAW_CLIPS.map((src, i) => (
            <span
              key={src}
              className="block aspect-[3/4] w-[58px] overflow-hidden rounded-lg bg-[#e7e6ec] ring-1 ring-black/5"
              style={{ transform: `rotate(${(i - 1) * 2.5}deg)` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="size-full object-cover opacity-70 grayscale" />
            </span>
          ))}
        </div>

        <span className="shrink-0 text-[#c6c8d4]">
          <ArrowRight className="size-4" />
        </span>

        <span className="relative block aspect-[9/16] w-[88px] shrink-0 overflow-hidden rounded-[10px] shadow-[0_10px_24px_rgba(26,26,46,0.2)] ring-1 ring-black/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={GATE_RESULT} alt="" className="size-full object-cover" />
          <span className="absolute inset-x-1.5 bottom-1.5 rounded bg-black/60 px-1 py-[3px] text-center text-[8px] font-bold tracking-[0.06em] leading-tight text-white">
            READY TO RUN
          </span>
        </span>

        <p className="min-w-0 self-center text-[13px] font-medium leading-snug text-[#6a6b7b]">
          Your footage,
          <br />
          cut into an ad.
        </p>
      </div>

      <div className="px-7 pb-6 pt-5">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#ff5e1a] px-2 py-[3px] text-[10px] font-bold uppercase tracking-[0.08em] text-white">
          <Lock className="size-2.5" /> Enterprise
        </span>

        <h2
          id="hybrid-gate-title"
          className="mt-3 text-[21px] font-extrabold leading-[1.2] tracking-[-0.02em] text-[#1a1a2e]"
        >
          Unlock Hybrid Reel
        </h2>

        <ul className="mt-3.5 space-y-2">
          {GATE_POINTS.map((point) => (
            <li key={point} className="flex items-center gap-2.5 text-[13.5px] text-[#1a1a2e]">
              <span className="grid size-[18px] shrink-0 place-items-center rounded-full bg-[#fff3ec] text-[#ff5e1a]">
                <Check className="size-3" strokeWidth={3} />
              </span>
              {point}
            </li>
          ))}
        </ul>

        <button
          type="button"
          autoFocus
          onClick={onContact}
          className="mt-6 w-full rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-6 py-3 text-[14.5px] font-bold text-white shadow-[0_8px_20px_rgba(255,82,85,0.26)] transition duration-150 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40 focus-visible:ring-offset-2 motion-reduce:transition-none"
        >
          Request a demo
        </button>

      </div>
    </div>
  );
}

type FieldErrors = { name?: string; email?: string; description?: string };

function ContactSalesPanel({
  onClose,
  onBack,
}: {
  onClose: () => void;
  onBack: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState(SALES_EMAIL_PLACEHOLDER);
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const validate = () => {
    const next: FieldErrors = {};
    if (!name.trim()) next.name = "Tell us who you are.";
    if (!email.trim()) next.email = "We need an address to reply to.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      next.email = "That doesn't look like an email address.";
    if (!description.trim()) next.description = "A line or two is enough.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = () => {
    if (sending || !validate()) return;
    setSending(true);
    /* 会落库的操作要有在途态,别让反馈只靠结果页 —— design.md 的约定 */
    window.setTimeout(() => {
      setSending(false);
      setSent(true);
    }, 650);
  };

  if (sent) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-sent-title"
        className="relative overflow-hidden rounded-[18px] bg-white px-7 py-8 text-left shadow-[0_18px_48px_rgba(26,26,46,0.18)]"
      >
        <span className="grid size-10 place-items-center rounded-full bg-[#e8f7ef] text-[#1a7f4b]">
          <Check className="size-5" strokeWidth={3} />
        </span>
        <h2
          id="contact-sent-title"
          className="mt-4 text-[19px] font-extrabold tracking-[-0.015em] text-[#1a1a2e]"
        >
          Thanks, we&apos;ll be in touch
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-[#6a6b7b]">
          We&apos;ll reach out to {email} within 1 business day to set up your demo.
        </p>
        <button
          type="button"
          autoFocus
          onClick={onClose}
          className="mt-6 rounded-xl bg-[#1a1a2e] px-5 py-2.5 text-[14px] font-bold text-white transition duration-150 hover:bg-[#2a2a42] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40 focus-visible:ring-offset-2 motion-reduce:transition-none"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="request-demo-title"
      className="relative overflow-hidden rounded-[18px] bg-white text-left shadow-[0_18px_48px_rgba(26,26,46,0.18)]"
    >
      <button
        type="button"
        onClick={onBack}
        aria-label="Close"
        className="absolute right-2.5 top-2.5 grid size-7 place-items-center rounded-lg text-[#b4b5c0] transition hover:bg-[#f4f4f7] hover:text-[#1a1a2e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/30"
      >
        <X className="size-3.5" />
      </button>

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        className="px-7 pb-6 pt-7"
      >
        <h2
          id="request-demo-title"
          className="text-[19px] font-extrabold tracking-[-0.015em] text-[#1a1a2e]"
        >
          Request a demo
        </h2>
        <p className="mt-1.5 max-w-[48ch] text-[13.5px] leading-relaxed text-[#6a6b7b]">
          Tell us about your team size and what you&apos;d like to see. We&apos;ll set up a session
          within 1 business day.
        </p>

        <div className="mt-5 space-y-4">
          <Field label="Name" required error={errors.name} htmlFor="cs-name">
            <input
              id="cs-name"
              value={name}
              autoFocus
              onChange={(event) => setName(event.target.value)}
              aria-invalid={Boolean(errors.name)}
              className={inputCls(Boolean(errors.name))}
            />
          </Field>

          <Field label="Email" required error={errors.email} htmlFor="cs-email">
            <input
              id="cs-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={Boolean(errors.email)}
              className={inputCls(Boolean(errors.email))}
            />
          </Field>

          <Field label="Description" required error={errors.description} htmlFor="cs-description">
            <textarea
              id="cs-description"
              rows={4}
              value={description}
              maxLength={DESCRIPTION_LIMIT}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Tell us about your team size, use case, and any specific needs..."
              aria-invalid={Boolean(errors.description)}
              className={`${inputCls(Boolean(errors.description))} resize-none leading-relaxed`}
            />
            <span className="mt-1 block text-right text-[12px] tabular-nums text-[#9a9bb0]">
              {description.length} / {DESCRIPTION_LIMIT}
            </span>
          </Field>
        </div>

        <div className="mt-5 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl border border-[#ececf1] bg-white px-5 py-2.5 text-[14px] font-bold text-[#1a1a2e] transition duration-150 hover:border-[#d4d3df] hover:bg-[#faf8f6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/30 motion-reduce:transition-none"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={sending}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1a1a2e] px-6 py-2.5 text-[14px] font-bold text-white transition duration-150 hover:bg-[#2a2a42] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40 focus-visible:ring-offset-2 disabled:opacity-60 motion-reduce:transition-none"
          >
            {sending && <Loader2 className="size-4 animate-spin" />}
            {sending ? "Sending..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}

function inputCls(invalid: boolean) {
  return [
    "w-full rounded-xl border bg-white px-3.5 py-2.5 text-[14px] text-[#1a1a2e] outline-none transition",
    "placeholder:text-[#8a8b99]",
    invalid
      ? "border-[#ff5255] focus-visible:ring-2 focus-visible:ring-[#ff5255]/25"
      : "border-[#ececf1] focus-visible:border-[#ff5e1a] focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/20",
  ].join(" ");
}

/* 标签在输入框上方,错误在下方,不用 placeholder 当标签 */
function Field({
  label,
  required,
  error,
  htmlFor,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[13px] font-semibold text-[#1a1a2e]">
        {label}
        {required && <span className="ml-0.5 text-[#ff5255]">*</span>}
      </label>
      {children}
      {error && (
        <span role="alert" className="text-[12.5px] font-medium text-[#c22f32]">
          {error}
        </span>
      )}
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
      <div className="relative">
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={openMenu === "tools"}
          aria-label="Open tools"
          onClick={() => onMenuChange(openMenu === "tools" ? null : "tools")}
          className={`grid size-9 place-items-center rounded-lg border bg-white transition ${
            openMenu === "tools"
              ? "border-[#ffbd99] bg-[#fffaf7] text-[#ff5e1a]"
              : "border-[#ececf1] hover:border-[#ffbd99]"
          }`}
        >
          <Plus className={`size-[18px] transition ${openMenu === "tools" ? "rotate-45" : ""}`} />
        </button>
        {openMenu === "tools" && (
          <div
            className={`absolute left-0 z-[60] ${menuPlacement === "down" ? "top-[calc(100%+12px)]" : "bottom-[calc(100%+12px)]"}`}
          >
            <ToolsDrawer onClose={() => onMenuChange(null)} />
          </div>
        )}
      </div>
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

/**
 * 调用方可以接管这个按钮的「拦截态」。v1.7 team-workspace 复用这个 composer 时,
 * 会把团队池 / 个人上限的真实状态传进来,好让按钮换成 Top up / Request 而不是死的 Create。
 * 不传就是原来的行为,v1.4 与归档页不受影响。
 */
export type ComposerQuotaOverride = {
  blocked: boolean;
  label: string;
  onAction: () => void;
  /** 受限原因不是「额度用尽」时覆盖 placeholder —— 例如订阅已终止,充值救不了 */
  blockedHint?: string;
};

// Swaps to an Upgrade CTA when the estimated cost exceeds the (demo) balance.
function CreateOrUpgradeButton({
  insufficientBalance,
  className = composerCta,
  quota,
  onCreate,
}: {
  insufficientBalance: boolean;
  className?: string;
  quota?: ComposerQuotaOverride;
  /** 选中 Hybrid Reel 时,Create 带用户进那条流程 */
  onCreate?: () => void;
}) {
  if (quota?.blocked) {
    return (
      <button type="button" onClick={quota.onAction} className={className}>
        {quota.label}
      </button>
    );
  }
  if (insufficientBalance) {
    return (
      <button type="button" className={className}>
        Upgrade
      </button>
    );
  }
  return (
    <button type="button" onClick={onCreate} className={className}>
      <Image src={memberPromoAssets.sparkle} alt="" width={42} height={42} className="size-[18px]" />
      Create
    </button>
  );
}

export function MarketingAgentPromptComposer({
  className = "",
  scrollReactive = false,
  quota,
}: {
  className?: string;
  scrollReactive?: boolean;
  quota?: ComposerQuotaOverride;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [openMenu, setOpenMenu] = useState<ComposerMenu>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentKind>("marketing");
  const [autoEnabled, setAutoEnabled] = useState(true);
  const [modelMode, setModelMode] = useState<ModelMode>("image");
  const [selectedModel, setSelectedModel] = useState("GPT-image-2");
  const [resolution, setResolution] = useState("Low");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const startCreate = () => {
    if (selectedAgent === "hybrid") router.push("/prototypes/hybrid-reel/agent/chat");
  };
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
              disabled={quota?.blocked}
              placeholder={
                quota?.blocked
                  ? quota.blockedHint ?? "You can't start new work until credits are topped up."
                  : "Describe your idea or campaign..."
              }
              className="h-[72px] w-full resize-none bg-transparent px-2 pt-1 text-[15px] leading-relaxed text-[#1a1a2e] outline-none placeholder:text-[#9a9bb0] disabled:cursor-not-allowed disabled:placeholder:text-[#c9432a]"
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
                <CreateOrUpgradeButton insufficientBalance={insufficientBalance} quota={quota} onCreate={startCreate} />
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => (quota?.blocked ? quota.onAction() : setExpanded(true))}
            onFocus={() => setExpanded(true)}
            className="flex h-[62px] w-full items-center gap-3 px-3 text-left"
            aria-label={quota?.blocked ? quota.label : "Expand Marketing Agent prompt"}
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-[#ececf1] text-[#707186]">
              <Plus className="size-4" />
            </span>
            <span
              className={`min-w-0 flex-1 truncate border-l border-[#ededf2] pl-3 text-[15px] ${
                quota?.blocked ? "text-[#c9432a]" : "text-[#9a9bb0]"
              }`}
            >
              {quota?.blocked
                ? quota.blockedHint ?? "You can't start new work until credits are topped up."
                : draft || "Describe your idea or campaign..."}
            </span>
            {/* 折叠态也要换态,否则额度用尽时这里仍是一个高亮的 Create */}
            {quota?.blocked ? (
              <span className={composerCta}>{quota.label}</span>
            ) : (
              <span className={composerCta}>
                <Image src={memberPromoAssets.sparkle} alt="" width={42} height={42} className="size-[18px]" />
                Create
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default function MarketingAgentMissions() {
  /* 演示状态:真实产品里来自登录态,原型里由顶部那条演示条切换。
     默认企业账号 —— 评审时主线是走通功能,门禁是顺带看一眼的分支 */
  const [enterpriseAccount, setEnterpriseAccount] = useState(true);
  const router = useRouter();
  const [draft, setDraft] = useState("");
  /* 「+」→ Local Upload 选进来的本地素材 */
  const [localFiles, setLocalFiles] = useState<LocalFile[]>([]);
  const localFileInputRef = useRef<HTMLInputElement>(null);
  const addLocalFiles = (list: FileList | null) => {
    if (!list) return;
    /* FileList 是活对象 —— 必须在这里同步取出,否则 onChange 里紧跟着的 value = "" 会把它清空,
       等 setState 的 updater 真正执行时已经是空的了 */
    const picked = Array.from(list).map((file) => ({ file, url: URL.createObjectURL(file) }));
    setLocalFiles((prev) => [...prev, ...picked]);
  };
  const removeLocalFile = (index: number) =>
    setLocalFiles((prev) => {
      URL.revokeObjectURL(prev[index]?.url ?? "");
      return prev.filter((_, i) => i !== index);
    });
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
  /* 这个原型的主线就是 Hybrid Reel,默认选中,省得每次进来都要去下拉里挑 */
  const [selectedAgent, setSelectedAgent] = useState<AgentKind>("hybrid");
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

  /* 选中 Hybrid Reel 之后点 Create:素材 + prompt 一起带给对话页做分析。
     没挂素材就直接拉起文件选择器 —— 这条流程没有素材无从开始。 */
  const startCreate = () => {
    if (selectedAgent !== "hybrid") return;
    if (localFiles.length === 0) {
      localFileInputRef.current?.click();
      return;
    }
    setPendingHandoff({ files: localFiles.map((f) => f.file), prompt: draft.trim() });
    router.push("/prototypes/hybrid-reel/agent/chat");
  };

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
    <DemoAccountContext.Provider value={enterpriseAccount}>
    <ComposerFilesContext.Provider
      value={{
        files: localFiles,
        openPicker: () => localFileInputRef.current?.click(),
        removeFile: removeLocalFile,
      }}
    >
    <input
      ref={localFileInputRef}
      type="file"
      multiple
      accept="video/*,image/*"
      className="hidden"
      onChange={(event) => {
        addLocalFiles(event.target.files);
        event.target.value = "";
      }}
    />
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
      <div className="sticky top-0 z-[90] h-[52px] overflow-x-auto border-b border-[#30313a] bg-[#1a1a2e] px-3 text-white shadow-[0_4px_14px_rgba(26,26,46,0.18)] sm:px-5">
        <div className="mx-auto flex h-full w-max min-w-full max-w-[1600px] items-center gap-3">
          <span className="shrink-0 text-[12px] font-bold tracking-[0.02em] text-white/70">
            账号状态预览
          </span>
          <div
            className="flex shrink-0 items-center gap-1 rounded-xl bg-white/10 p-1"
            role="group"
            aria-label="切换账号状态"
          >
            {[
              { value: false, label: "非企业账号" },
              { value: true, label: "企业账号" },
            ].map((state) => {
              const active = state.value === enterpriseAccount;
              return (
                <button
                  key={state.label}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setEnterpriseAccount(state.value)}
                  className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold transition sm:px-4 ${
                    active
                      ? "bg-white text-[#1a1a2e] shadow-[0_2px_8px_rgba(0,0,0,0.18)]"
                      : "text-white/65 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {state.label}
                </button>
              );
            })}
          </div>
          <span className="shrink-0 text-[12px] text-white/45">
            Creation type 里的 Hybrid Reel:非企业撞门禁,企业直接进
          </span>
        </div>
      </div>

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
                aria-label="Collapse history panel"
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

            {/* 与对话页同一个 History 栏 —— 刚跑过的 Hybrid Reel 会话在这里,点回去就能接着看 */}
            <div className="flex items-center justify-between px-4 pb-2 pt-2">
              <span className="text-[13px] font-bold text-[#8d8e9d]">History</span>
            </div>
            <HistoryList />
          </>
          ) : (
          <>
            <button
              onClick={() => setProjectsOpen(true)}
              aria-label="Expand history panel"
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
                href="/prototypes/hybrid-reel/canvas"
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
                {localFiles.length > 0 && (
                  <div className="mb-1.5 flex flex-wrap items-center gap-2 px-1">
                    {localFiles.map((f, index) => (
                      <div key={f.url} className="relative">
                        {f.file.type.startsWith("image/") ? (
                          <img
                            src={f.url}
                            alt={f.file.name}
                            className="size-11 rounded-lg object-cover ring-1 ring-[#ececf1]"
                          />
                        ) : (
                          <video
                            src={f.url}
                            muted
                            playsInline
                            className="size-11 rounded-lg object-cover ring-1 ring-[#ececf1]"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => removeLocalFile(index)}
                          className="absolute -right-1.5 -top-1.5 grid size-4 place-items-center rounded-full bg-[#1a1a2e] text-[10px] leading-none text-white"
                          aria-label={`Remove ${f.file.name}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <span className="text-[12px] text-[#9a9bb0]">
                      {localFiles.length} file{localFiles.length === 1 ? "" : "s"} attached
                    </span>
                  </div>
                )}
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
                  placeholder={
                    selectedAgent === "hybrid"
                      ? "Attach your footage with +, then tell me about the ad: where it runs, how long, who it's for, what to sell and what they should do next."
                      : "Describe your idea or campaign, or paste a product / landing page / IG post URL. Use @ to reference uploaded files."
                  }
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
                    <CreateOrUpgradeButton insufficientBalance={insufficientBalance} onCreate={startCreate} />
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
                    <CreateOrUpgradeButton insufficientBalance={insufficientBalance} onCreate={startCreate} />
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
    </ComposerFilesContext.Provider>
    </DemoAccountContext.Provider>
  );
}
