"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Sparkles,
  SlidersHorizontal,
  Megaphone,
  Share2,
  ShoppingBag,
  Clapperboard,
  Film,
  ChevronRight,
  ChevronDown,
  Plus,
  X,
  Video,
  Volume2,
  VolumeX,
  Image as ImageIcon,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "./site-header";
import { Loop, CardMedia } from "./media";

/* ---------- Brand helpers (design.md) ---------- */
const gradText =
  "bg-gradient-to-r from-[#ffc078] to-[#ff5e1a] bg-clip-text text-transparent";
const ctaBtn =
  "h-auto rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-7 py-3.5 text-base font-bold text-white shadow-[0_10px_30px_rgba(255,82,85,0.28)] transition hover:brightness-105 hover:shadow-[0_14px_38px_rgba(255,82,85,0.4)]";

/* BuzzVideo look: cyan accent + near-black primary button */
const ACCENT = "#0bb4c7";
const blackBtn =
  "rounded-[10px] bg-[#1a1a1a] px-6 py-2.5 text-[15px] font-semibold text-white transition hover:bg-black";

/* Dark body (everything below the hero): near-black surfaces + warm accent */
const headD =
  "font-[family-name:var(--font-display)] font-extrabold tracking-tight text-white";
const whiteBtn =
  "h-auto rounded-full bg-white px-6 py-3 text-[14px] font-semibold text-[#0a0a0c] transition hover:bg-white/85";

const ASSET = "/prototypes/seedance-2-5";

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

/* ---------- Data ---------- */
const FEATURES = [
  {
    title: "Generate Videos Up to 30 Seconds",
    paras: [
      "Create longer AI videos with up to 30 seconds of generation. Seedance 2.5 gives creators more room for complete product ads, multi-shot stories, avatar explainers, tutorials, cinematic scenes, and social video sequences without breaking the idea into short fragments.",
    ],
    media: "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-06-26/328832505492856832.mp4",
  },
  {
    title: "Longer Scene Continuity and Consistency",
    paras: [
      "Seedance 2.5 is designed to keep characters, camera movement, lighting, and scene structure more consistent across video. This makes it a stronger choice for storytelling, product demos, creator ads, and multi-shot video concepts.",
    ],
    media: "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-06-26/328824916013015040.mp4",
    reverse: true,
  },
  {
    title: "Control the Look with Multi-Reference Creation",
    paras: [
      "AI video users want more than random results. They want the character to stay consistent, the product to look right, the camera style to match the mood, and the final video to follow their creative direction.",
      "Guide generation with up to 50 multimodal reference assets, including images, video clips, and audio references. Seedance 2.5 gives creators more control over characters, products, scenes, motion, rhythm, and visual style across longer video workflows.",
    ],
    media: "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-06-26/328835361268621312.png",
    image: true,
  },
  {
    title: "Build Videos for Ads, Social Media, and Storytelling",
    paras: [
      "From a product launch teaser to a cinematic short scene, Seedance 2.5 is built for creators who need videos that can actually be used, shared, tested, and published.",
      "Marketers can create scroll-stopping ad concepts, ecommerce teams can turn product images into motion, and creators can build stylish social videos without starting from a blank editing timeline.",
    ],
    media: "https://assets.presslogic.com/buzzvideo/public/2026-06-15/324763823477153792.mp4",
    reverse: true,
  },
];
const BENEFITS = [
  {
    icon: Sparkles,
    title: "Higher-Quality AI Videos for Real Publishing",
    media: "https://assets.presslogic.com/buzzvideo/public/2026-06-15/324743022677909504.mp4",
    paras: [
      "Videos look more natural, cinematic, and visually complete. The result drops the “AI demo” feeling and lands closer to real campaign assets you can publish and share.",
      "Whether you are making a product reveal, a fashion clip, or a short cinematic scene, Seedance 2.5 helps you create videos that are easier to publish, present, and share.",
    ],
  },
  {
    icon: SlidersHorizontal,
    title: "More Control from Prompt to Final Video",
    media: "https://assets.presslogic.com/buzzvideo/public/2026-06-15/324746276853833728.mp4",
    paras: [
      "Great AI video is not just about generating something beautiful, it is about generating something close to your idea. Seedance 2.5 lets you guide the output with prompts, images, and references.",
      "That gives you more creative control when building consistent characters, branded visuals, product shots, or story-based video scenes.",
    ],
  },
  {
    icon: Megaphone,
    title: "Built for Social, Ads, Products, and Stories",
    media: "https://assets.presslogic.com/buzzvideo/public/2026-06-15/324795053161635840.mp4",
    paras: [
      "Built for creators who need videos with purpose. Use it for TikTok clips, Instagram Reels, YouTube Shorts, product showcases, ad concepts, music visuals, and cinematic storytelling.",
      "Instead of starting from a blank timeline, turn your idea into a strong first video draft, then refine it for the platform, audience, or campaign you are targeting.",
    ],
  },
];

const USE_CASES = [
  {
    icon: Share2,
    title: "Social Media Videos That Stop the Scroll",
    media: "https://asset.buzzvideo.ai/buzzvideo/video/2026/06/26/c889902a-2b0f-445e-9131-e9ecd454693e_39984ab3.mp4",
    paras: [
      "Create eye-catching videos for TikTok, Instagram Reels, and YouTube Shorts from a simple idea, selfie, or product image, ready for social feeds.",
      "Turn a cinematic lifestyle clip, a fashion transformation, or a viral concept into content that looks dynamic, shareable, and ready to post.",
    ],
  },
  {
    icon: ShoppingBag,
    title: "Product Ads and Ecommerce Showcases",
    media: "https://assets.presslogic.com/buzzvideo/public/2026-06-15/324747139299205120.mp4",
    paras: [
      "Bring product photos and campaign ideas to life with product reveals, ad concepts, beauty shots, and ecommerce visuals without building every shot from scratch.",
      "For marketers and online sellers, it is easier to test creative directions, draft campaigns, and turn static product images into motion that feels more engaging.",
    ],
  },
  {
    icon: Clapperboard,
    title: "Cinematic Stories and Creative Short Films",
    media: "https://asset.buzzvideo.ai/buzzvideo/video/2026/06/26/a9480f2a-4b7f-4cdf-8220-b9494d326fbe_1ecbe13f.mp4",
    paras: [
      "Build atmospheric scenes, character moments, music visuals, and short film concepts with more control over mood, motion, and visual style.",
      "Use prompts and reference materials to guide the look, camera feeling, and story direction for portfolios, concept tests, and creative experiments.",
    ],
  },
];

const STEPS = [
  {
    no: "01",
    title: "Open Seedance 2.5",
    desc: "Choose the Seedance 2.5. This gives you direct access to the model for creating high-quality AI videos from text, images, and references.",
    media: "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-06-26/328859800534310912.png",
  },
  {
    no: "02",
    title: "Add Your Prompt and References",
    desc: "Enter a detailed prompt describing your scene, subject, motion, camera style, and visual mood. Upload images or reference materials to guide the character, product, style, or overall video direction more precisely.",
    media: "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-06-26/328859823749783552.png",
  },
  {
    no: "03",
    title: "Generate, Refine, and Save",
    desc: "Click generate and let Seedance 2.5 turn your idea into a cinematic AI video. Review the result, refine your prompt or references if needed, then save your video for social media, ads, product showcases, or creative projects.",
    media: "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-06-26/328859840455696384.png",
  },
];

const TESTIMONIALS = [
  {
    name: "Vera Drew",
    date: "June 3",
    avatar: "https://randomuser.me/api/portraits/women/65.jpg",
    quote:
      "I tried Seedance 2.5 for a product teaser, and the result felt much more polished than the quick AI clips I usually get.",
  },
  {
    name: "Alice Moreau",
    date: "June 1",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    quote:
      "I love that I can start with just an idea and a few references. Seedance 2.5 understood the visual mood I wanted and gave me a cinematic video that looked close to my original concept.",
  },
  {
    name: "Bohai Lin",
    date: "May 28",
    avatar: "https://randomuser.me/api/portraits/men/52.jpg",
    quote:
      "As a social creator, I need videos that feel ready for Reels and TikTok. A simple prompt turned into a stylish short in minutes.",
  },
  {
    name: "Cathy Okonkwo",
    date: "May 24",
    avatar: "https://randomuser.me/api/portraits/women/90.jpg",
    quote:
      "The best part for me is the control. I uploaded reference images for the product and style, and the final video stayed close to the look I wanted.",
  },
  {
    name: "David Reyes",
    date: "May 20",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    quote:
      "I made a fashion-style video from a single still image. The camera movement, lighting, and overall scene felt genuinely cinematic.",
  },
  {
    name: "Emma Lindqvist",
    date: "May 16",
    avatar: "https://randomuser.me/api/portraits/women/12.jpg",
    quote:
      "For ad concepts this is a huge time-saver. I test different product video ideas fast before asking my team to build a full campaign.",
  },
];

const FAQ = [
  {
    q: "What is the Seedance 2.5 AI Video Generator?",
    a: "It is an AI video creation tool on AI BuzzVideo, powered by the Seedance 2.5 model. It turns text prompts, images, and references into polished videos for social media, product showcases, ads, and cinematic storytelling, without starting from a blank timeline.",
  },
  {
    q: "How do I start creating with Seedance 2.5?",
    a: "Open the Seedance 2.5 generator on AI BuzzVideo, add a prompt and optional reference images, then generate. New accounts get starter credits so you can explore the model before choosing a plan.",
  },
  {
    q: "What can I create with Seedance 2.5?",
    a: "Cinematic clips, social media videos, product ads, ecommerce showcases, music visuals, concept videos, short film scenes, and story-driven content, especially when turning simple ideas or static images into motion.",
  },
  {
    q: "Can I use images and references with Seedance 2.5?",
    a: "Yes. The tool supports reference-based generation, letting you guide results with images and creative materials so the model understands the subject, visual style, product appearance, character direction, camera mood, and scene atmosphere.",
  },
  {
    q: "How do I get better results from Seedance 2.5 prompts?",
    a: "Strong prompts include subject, action, scene, camera movement, lighting, mood, and style. Adding reference images improves accuracy, and clearer guidance through prompts and references increases the likelihood of results matching your creative goals.",
  },
];

// Keep in sync with MODEL_GROUPS in the header (all image + video models).
const MODELS = [
  "Seedance 2.5",
  "Seedance 2.0",
  "Seedance 2.0 Mini",
  "Seedance 2.0 Fast",
  "Seedance 1.5 Pro",
  "Kling 3.0",
  "Veo 3.1",
  "Veo3.1 Fast",
  "GPT-image-2",
  "Seedream 5.0 lite",
  "Seedream 4.5",
  "Nano Banana 2",
  "Nano Banana Pro",
  "Nano Banana",
];

const WALL = [
  "https://assets.presslogic.com/buzzvideo/public/2026-06-15/324784444911181824.mp4",
  "https://assets.presslogic.com/buzzvideo/public/2026-06-15/324787241400459264.mp4",
  "https://assets.presslogic.com/buzzvideo/public/2026-06-15/324765417878904832.mp4",
  "https://assets.presslogic.com/buzzvideo/public/2026-06-26/328742133781553152.mp4",
  "https://assets.presslogic.com/buzzvideo/public/2026-06-15/324763823477153792.mp4",
  "https://assets.presslogic.com/buzzvideo/public/2026-06-15/324784703385165824.mp4",
];

// Tools dropdown (hover) menu
// Hero generation-mode switcher (Video Gen pill dropdown)
const GEN_MODES = [
  {
    name: "Marketing Agent",
    desc: "AI marketing expert. Marketing strategy, ad copy, and creatives in one.",
    icon: Sparkles,
    brand: true,
  },
  {
    name: "Image Gen",
    desc: "Fast high-quality image generation, best for fast creative iteration.",
    icon: ImageIcon,
  },
  {
    name: "Video Gen",
    desc: "Up to 15 seconds of cinematic-quality video with synced audio and visuals.",
    icon: Video,
    active: true,
  },
  {
    name: "Long Video",
    desc: "Auto scene planning for high-quality long-form videos.",
    icon: Film,
    soon: true,
  },
];

/* ---------- Small pieces ---------- */
/* How it works: left steps drive a sticky preview that crossfades as you scroll. */
function HowItWorks({ onCta }: { onCta: () => void }) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const i = Number((e.target as HTMLElement).dataset.idx);
            if (!Number.isNaN(i)) setActive(i);
          }
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    refs.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <section id="how" className="bg-[#0f0f12] px-6 py-24">
      <div className="mx-auto max-w-[1200px]">
        <h2 className={`mx-auto max-w-[760px] text-center text-[clamp(28px,4vw,40px)] leading-[1.14] ${headD}`}>
          How to use the Seedance 2.5 AI Video Generator
        </h2>

        <div className="mt-14 grid gap-12 md:grid-cols-[0.78fr_1.22fr] md:items-center">
          {/* Steps */}
          <div className="flex flex-col gap-3">
            {STEPS.map((s, i) => {
              const on = active === i;
              return (
                <div
                  key={s.no}
                  data-idx={i}
                  ref={(el) => {
                    refs.current[i] = el;
                  }}
                  onClick={() => setActive(i)}
                  className={`relative cursor-pointer rounded-[16px] py-5 pl-7 pr-4 transition-all duration-300 ${
                    on ? "bg-white/[0.04]" : "hover:bg-white/[0.02]"
                  }`}
                >
                  <span
                    className={`absolute left-0 top-1/2 w-[3px] -translate-y-1/2 rounded-full bg-gradient-to-b from-[#FFA73C] to-[#FF5255] transition-all duration-300 ${
                      on
                        ? "h-[78%] opacity-100 shadow-[0_0_14px_rgba(255,94,26,0.65)]"
                        : "h-0 opacity-0"
                    }`}
                  />
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-[family-name:var(--font-display)] text-[14px] font-extrabold transition-colors ${
                        on ? "text-[#ff7a3d]" : "text-white/30"
                      }`}
                    >
                      Step {i + 1}
                    </span>
                    <h3
                      className={`text-[18px] font-[family-name:var(--font-display)] font-extrabold tracking-tight transition-colors ${
                        on ? "text-white" : "text-white/35"
                      }`}
                    >
                      {s.title}
                    </h3>
                  </div>
                  <p
                    className={`mt-2 text-[15px] leading-relaxed transition-colors ${
                      on ? "text-white/60" : "text-white/25"
                    }`}
                  >
                    {s.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Sticky preview */}
          <div className="md:sticky md:top-[18vh]">
            <div className="relative flex items-center justify-center overflow-hidden rounded-[24px] border border-white/10 bg-black">
              {STEPS.map((s, i) => (
                <CardMedia
                  key={s.no}
                  src={s.media}
                  alt={s.title}
                  className={`w-full object-contain transition-opacity duration-500 ${
                    active === i ? "opacity-100" : "absolute inset-0 size-full opacity-0"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-14 flex justify-center">
          <Button className={`${whiteBtn} inline-flex items-center`} onClick={onCta}>
            Try Seedance 2.5 Now <ArrowRight className="ml-2 size-[18px]" />
          </Button>
        </div>
      </div>
    </section>
  );
}

/* Testimonials: two rows that scroll in opposite directions, pause on hover. */
function TestimonialCard({ t }: { t: (typeof TESTIMONIALS)[number] }) {
  return (
    <div className="flex w-[400px] shrink-0 gap-4 rounded-[18px] border border-white/10 bg-white/[0.03] p-6">
      <img
        src={t.avatar}
        alt={t.name}
        loading="lazy"
        className="size-10 shrink-0 rounded-full object-cover"
      />
      <div>
        <p className="text-[15px] leading-[1.6] text-white/85">&ldquo;{t.quote}&rdquo;</p>
        <div className="mt-3 text-[14px] text-white/45">
          <span className="font-semibold text-white/80">{t.name}</span>
          <span className="px-1.5">&middot;</span>
          {t.date}
        </div>
      </div>
    </div>
  );
}

function Testimonials() {
  const row1 = TESTIMONIALS.slice(0, 3);
  const row2 = TESTIMONIALS.slice(3);
  return (
    <section className="overflow-hidden bg-[#0a0a0c] py-24">
      <style>{`
        @keyframes tmarqL { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes tmarqR { from { transform: translateX(-50%); } to { transform: translateX(0); } }
        .tmarq-track { display: flex; gap: 22px; width: max-content; padding-right: 22px; }
        .tmarq-row:hover .tmarq-track { animation-play-state: paused; }
        .tmarq-l { animation: tmarqL 48s linear infinite; }
        .tmarq-r { animation: tmarqR 56s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .tmarq-l, .tmarq-r { animation: none; }
        }
      `}</style>
      <div className="mx-auto mb-12 max-w-[760px] px-6 text-center">
        <h2 className={`text-[clamp(28px,4vw,40px)] ${headD}`}>
          What creators say about Seedance 2.5
        </h2>
      </div>
      <div className="flex flex-col gap-[22px]">
        <div className="tmarq-row relative">
          <div className="tmarq-track tmarq-l">
            {[...row1, ...row1].map((t, i) => (
              <TestimonialCard key={`r1-${i}`} t={t} />
            ))}
          </div>
        </div>
        <div className="tmarq-row relative">
          <div className="tmarq-track tmarq-r">
            {[...row2, ...row2].map((t, i) => (
              <TestimonialCard key={`r2-${i}`} t={t} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* FAQ: editorial two-column, sticky display heading + hairline-divided list. */
function FaqSection() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="bg-[#0f0f12] px-6 py-28">
      <div className="mx-auto grid max-w-[1200px] gap-x-16 gap-y-10 md:grid-cols-[0.8fr_1.2fr]">
        <div className="md:sticky md:top-28 md:self-start">
          <h2 className={`text-[clamp(34px,5vw,52px)] leading-[1.04] ${headD}`}>
            Questions,
            <br />
            answered.
          </h2>
        </div>
        <div>
          {FAQ.map((f, i) => {
            const on = open === i;
            return (
              <div key={i} className="border-t border-white/10">
                <button
                  onClick={() => setOpen(on ? -1 : i)}
                  className="flex w-full items-center justify-between gap-6 py-6 text-left"
                >
                  <span className="text-[18px] font-semibold text-white">{f.q}</span>
                  <span
                    className={`flex size-7 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                      on ? "border border-[#ff5e1a]/70 text-[#ff5e1a]" : "text-white/40"
                    }`}
                  >
                    {on ? <X className="size-4" /> : <Plus className="size-[18px]" />}
                  </span>
                </button>
                <div
                  className={`grid transition-all duration-300 ${
                    on ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="max-w-[640px] pb-6 text-[15px] leading-relaxed text-white/55">
                      {f.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------- Page ---------- */
export default function SeedancePage() {
  // Header is transparent over the hero video, fades to solid white once scrolled past it.
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const hero = document.getElementById("top");
    if (!hero) return;
    const obs = new IntersectionObserver(([e]) => setSolid(!e.isIntersecting), {
      rootMargin: "-92% 0px 0px 0px",
    });
    obs.observe(hero);
    return () => obs.disconnect();
  }, []);

  // hero 背景视频静音控制(默认静音以允许自动播放)
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const toggleMute = () => {
    const v = heroVideoRef.current;
    const next = !muted;
    setMuted(next);
    if (v) {
      v.muted = next;
      if (!next) v.play().catch(() => {});
    }
  };

  // 原型交互提示 toast
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notify = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };

  return (
    <main className="bg-[#0a0a0c] text-white">
      {/* hide page scrollbar (scoped to this page's lifetime) */}
      <style>{`html{scrollbar-width:none;-ms-overflow-style:none}html::-webkit-scrollbar{display:none}`}</style>

      {/* Structured data: FAQ rich results + breadcrumb trail */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "/" },
              { "@type": "ListItem", position: 2, name: "Models", item: "/" },
              { "@type": "ListItem", position: 3, name: "Seedance 2.5 AI Video Generator" },
            ],
          }),
        }}
      />
      {/* Nav */}
      <SiteHeader solid={solid} notify={notify} />

      {/* Hero */}
      <section id="top" className="relative min-h-[100dvh] w-full overflow-hidden">
        {/* cinematic background video */}
        <video
          ref={heroVideoRef}
          src="https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-06-26/328824726103318528.mp4"
          poster="https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-06-26/328821717151571968.png"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-black/40" />

        {/* breadcrumb */}
        <nav aria-label="Breadcrumb" className="absolute inset-x-0 top-0 z-10">
          <ol className="mx-auto flex max-w-[1200px] items-center gap-2 px-8 pt-20 text-[14px] text-white/65">
            <li>
              <a href="/" className="hover:text-white/90">Home</a>
            </li>
            <ChevronRight className="size-3.5 opacity-60" />
            <li>
              <a href="/" className="hover:text-white/90">Models</a>
            </li>
            <ChevronRight className="size-3.5 opacity-60" />
            <li aria-current="page" className="text-white/45">Seedance 2.5</li>
          </ol>
        </nav>

        {/* content */}
        <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-[1000px] flex-col items-center justify-end px-6 pb-5 pt-28 text-center">
          <h1 className="mx-auto max-w-[1000px] font-[family-name:var(--font-display)] text-[clamp(28px,4.6vw,50px)] font-extrabold leading-[1.1] tracking-tight text-white md:whitespace-nowrap">
            Seedance 2.5 AI Video Generator
          </h1>
          <p className="mx-auto mt-6 max-w-[760px] text-[clamp(13px,1.3vw,15px)] leading-relaxed text-white/85">
            Turn text prompts, images, and references into cinematic clips, product videos, and
            social ads with the Seedance 2.5 model. Smoother motion, stronger scene control,
            more consistent results.
          </p>

          {/* generation panel */}
          <div className="mt-10 flex h-[168px] w-[632px] max-w-full flex-col justify-between rounded-[20px] bg-white p-5 text-left shadow-[0_30px_80px_rgba(0,0,0,0.35)] 2xl:w-[800px]">
            <div className="flex gap-4">
              <button
                onClick={() => notify("带上数据跳转首页")}
                className="flex size-[78px] shrink-0 items-center justify-center rounded-[14px] border border-[#e3e3e8] bg-[#f6f6f9] text-[#9a9aa8] transition hover:bg-[#ececef] hover:text-[#6a6b7b] active:scale-[0.97]"
              >
                <Plus className="size-7" strokeWidth={1.75} />
              </button>
              <input
                type="text"
                placeholder="Generate A Cinematic AI Video From Text, Images, And Audio Instantly"
                className="flex-1 self-stretch bg-transparent pt-2 text-[14px] leading-snug text-[#1a1a2e] outline-none placeholder:text-[#8a8a96]"
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="group/vg relative">
                  <span
                    className="flex cursor-pointer items-center gap-1.5 rounded-full bg-[#e7f7fa] px-3.5 py-2 text-[14px] font-semibold"
                    style={{ color: ACCENT }}
                  >
                    <Video className="size-4" /> Video Gen <ChevronDown className="size-3.5" />
                  </span>
                  <div className="invisible absolute bottom-full left-0 z-50 mb-2 translate-y-1 pb-1 opacity-0 transition-all duration-150 group-hover/vg:visible group-hover/vg:translate-y-0 group-hover/vg:opacity-100">
                    <div className="w-[330px] rounded-2xl border border-[#ececf1] bg-white p-2 shadow-[0_24px_60px_rgba(26,26,46,0.2)]">
                      {GEN_MODES.map((m) => (
                        <button
                          key={m.name}
                          disabled={m.soon}
                          onClick={() => notify(`已切换到 ${m.name}`)}
                          className={`flex w-full items-start gap-3 rounded-xl px-2.5 py-2.5 text-left transition ${m.soon ? "cursor-default opacity-60" : m.active ? "bg-[#fff3ec]" : "hover:bg-[#f6f6f9]"}`}
                        >
                          <span
                            className={`flex size-9 shrink-0 items-center justify-center rounded-[10px] ${m.brand ? "bg-gradient-to-r from-[#FFA73C] to-[#FF5255] text-white" : "bg-[#f3f3f6] text-[#6a6b7b]"}`}
                          >
                            <m.icon className="size-[18px]" strokeWidth={1.75} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span className="text-[14px] font-semibold text-[#1a1a2e]">{m.name}</span>
                              {m.soon && (
                                <span className="rounded-full bg-[#fdebd0] px-1.5 py-0.5 text-[10px] font-semibold text-[#b97f17]">
                                  Coming Soon
                                </span>
                              )}
                            </span>
                            <span className="mt-0.5 block text-[12px] leading-snug text-[#8a8a96]">{m.desc}</span>
                          </span>
                          {m.active && <Check className="ml-1 mt-1 size-4 shrink-0 text-[#ff5e1a]" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <span className="flex items-center gap-2 rounded-full border border-[#ececf1] bg-white px-3.5 py-2 text-[14px] font-medium text-[#5a5a66]">
                  <span className="flex items-center gap-1.5">
                    <img src={`${ASSET}/bytedance.svg`} alt="ByteDance" className="size-4 grayscale" /> Seedance 2.5
                  </span>
                  <span className="text-[13px] text-[#aeaeb6]">1:1 &middot; 480p &middot; 4s</span>
                </span>
              </div>
              <button className={blackBtn} onClick={() => notify("带上数据跳转首页")}>
                Generate
              </button>
            </div>
          </div>

          {/* try other models */}
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {["Try Seedance 2.0", "Try GPT Image 2", "Try Nano Banana 2", "Try Veo 3.1"].map((t) => (
              <button
                key={t}
                onClick={() => notify(`跳转首页,模型选中 ${t.replace("Try ", "")}`)}
                className="rounded-full border border-white/25 bg-black/30 px-5 py-2.5 text-[14px] font-medium text-white/90 backdrop-blur-sm transition hover:bg-black/45"
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* mute / unmute */}
        <button
          onClick={toggleMute}
          aria-label={muted ? "Unmute video" : "Mute video"}
          className="absolute bottom-6 right-6 z-20 flex size-11 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition hover:bg-black/60"
        >
          {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
        </button>
      </section>

      {/* Features */}
      <section id="features" className="bg-[#0a0a0c] px-6 py-24">
        <div className="mx-auto max-w-[1200px]">
          <div className="mx-auto max-w-[720px] text-center">
            <h2 className={`text-[clamp(28px,4vw,40px)] ${headD}`}>
              Create more controllable AI videos with Seedance 2.5
            </h2>
            <p className="mx-auto mt-5 max-w-[620px] text-[16px] leading-relaxed text-white/55">
              With the Seedance 2.5 AI Video Generator, creators move beyond simple AI
              clips and turn ideas, images, and references into polished videos for social media,
              ads, product showcases, and cinematic storytelling.
            </p>
          </div>

          <div className="mt-24 flex flex-col gap-24">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className={`grid items-center gap-10 md:grid-cols-2 ${f.reverse ? "md:[&>*:first-child]:order-2" : ""}`}
              >
                <div>
                  <h3 className={`text-[clamp(22px,2.6vw,30px)] leading-tight ${headD}`}>
                    {f.title}
                  </h3>
                  {f.paras.map((p) => (
                    <p key={p} className="mt-4 text-[15px] leading-relaxed text-white/55">
                      {p}
                    </p>
                  ))}
                  <Button
                    className={`${whiteBtn} mt-7 inline-flex items-center`}
                    onClick={() => notify("跳转首页")}
                  >
                    Try Seedance 2.5 Now <ArrowRight className="ml-2 size-[18px]" />
                  </Button>
                </div>
                <div className="rounded-[26px] bg-white/[0.04] p-3">
                  <div className="overflow-hidden rounded-[18px] bg-black">
                    {f.image ? (
                      <img src={f.media} alt={f.title} className="aspect-video w-full object-cover" />
                    ) : (
                      <Loop src={f.media} controls className="aspect-video w-full object-cover" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-[#0f0f12] px-6 py-28">
        <div className="mx-auto max-w-[1200px]">
          <div className="mx-auto max-w-[720px] text-center">
            <h2 className={`text-[clamp(28px,4vw,40px)] leading-[1.12] ${headD}`}>
              Benefits of using Seedance 2.5
            </h2>
            <p className="mt-5 text-[16px] leading-relaxed text-white/55">
              Seedance 2.5 helps creators, marketers, and brands generate AI videos that look more
              polished, feel more controllable, and fit real content needs.
            </p>
          </div>
          <div className="mt-14 grid gap-x-10 gap-y-12 md:grid-cols-3">
            {BENEFITS.map((b) => (
              <div key={b.title} className="flex flex-col text-center">
                <div className="overflow-hidden rounded-[18px] bg-black">
                  <CardMedia src={b.media} alt={b.title} className="aspect-[4/3] w-full object-cover" />
                </div>
                <h3 className={`mt-6 text-[19px] leading-snug ${headD}`}>{b.title}</h3>
                {b.paras.map((p, j) => (
                  <p key={j} className="mt-3 text-[14px] leading-relaxed text-white/55">
                    {p}
                  </p>
                ))}
              </div>
            ))}
          </div>
          <div className="mt-16 flex justify-center">
            <Button className={`${whiteBtn} inline-flex items-center`} onClick={() => notify("跳转首页")}>
              Try Seedance 2.5 Now <ArrowRight className="ml-2 size-[18px]" />
            </Button>
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section id="use-cases" className="bg-[#0a0a0c] px-6 py-24">
        <div className="mx-auto max-w-[1200px]">
          <div className="mx-auto max-w-[720px] text-center">
            <h2 className={`text-[clamp(28px,4vw,40px)] leading-[1.12] ${headD}`}>
              Use Cases of Seedance 2.5
            </h2>
            <p className="mt-5 text-[16px] leading-relaxed text-white/55">
              From social clips to product campaigns and cinematic stories, Seedance 2.5 turns
              prompts, images, and references into high-quality AI videos for real creative work.
            </p>
          </div>
          <div className="mt-14 grid gap-x-10 gap-y-12 md:grid-cols-3">
            {USE_CASES.map((u) => (
              <div key={u.title} className="flex flex-col text-center">
                <div className="overflow-hidden rounded-[18px] bg-black">
                  <CardMedia src={u.media} alt={u.title} className="aspect-[4/3] w-full object-cover" />
                </div>
                <h3 className={`mt-6 text-[19px] leading-snug ${headD}`}>{u.title}</h3>
                {u.paras.map((p, j) => (
                  <p key={j} className="mt-3 text-[14px] leading-relaxed text-white/55">
                    {p}
                  </p>
                ))}
              </div>
            ))}
          </div>
          <div className="mt-16 flex justify-center">
            <Button className={`${whiteBtn} inline-flex items-center`} onClick={() => notify("跳转首页")}>
              Try Seedance 2.5 Now <ArrowRight className="ml-2 size-[18px]" />
            </Button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <HowItWorks onCta={() => notify("跳转首页")} />

      {/* Testimonials */}
      <Testimonials />

      {/* Explore more models */}
      <section className="bg-[#0f0f12] px-6 py-28">
        <div className="mx-auto max-w-[1200px] text-center">
          <h2 className={`text-[clamp(28px,4vw,40px)] leading-[1.12] ${headD}`}>
            Explore more AI models
          </h2>
          <p className="mx-auto mt-5 max-w-[560px] text-[16px] leading-relaxed text-white/55">
            Switch models anytime to match the look, speed, and budget your project needs.
          </p>
          <div className="mx-auto mt-12 flex max-w-[920px] flex-wrap justify-center gap-3">
            {MODELS.map((m) => (
              <button
                key={m}
                onClick={() => notify("跳转首页")}
                className="rounded-full border border-white/12 bg-white/[0.03] px-5 py-2.5 text-[14px] font-medium text-white/70 transition hover:border-[#ff7a3d]/60 hover:bg-white/[0.06] hover:text-white"
              >
                {m}
              </button>
            ))}
          </div>
          <div className="mt-12 flex justify-center">
            <Button className={`${whiteBtn} inline-flex items-center`} onClick={() => notify("跳转首页")}>
              Try Seedance 2.5 Now <ArrowRight className="ml-2 size-[18px]" />
            </Button>
          </div>
        </div>
      </section>

      {/* Final CTA + video wall */}
      <section className="bg-[#0a0a0c] px-6 py-24">
        <div className="relative mx-auto max-w-[1200px] overflow-hidden rounded-[28px] bg-[#0f0f12] px-10 pt-[72px]">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-1/3 left-1/2 z-[1] h-[420px] w-[680px] -translate-x-1/2 rounded-full opacity-50 blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(255,94,26,0.35), transparent 70%)" }}
          />
          <div className="relative z-[2] text-center">
            <h2 className={`text-[clamp(30px,5vw,48px)] ${headD}`}>
              Start creating with Seedance 2.5
            </h2>
            <p className="mx-auto mb-8 mt-4 max-w-[620px] text-[clamp(15px,2vw,18px)] text-white/60">
              Turn your ideas, images, and references into cinematic AI videos. Try it with free
              credits and create for social, product ads, brand campaigns, and storytelling.
            </p>
            <Button className={ctaBtn} onClick={() => notify("跳转首页")}>
              Try Seedance 2.5 Now <ArrowRight className="ml-2 size-[19px]" />
            </Button>
          </div>

          <div className="relative z-[2] mt-14 flex justify-center gap-3.5 pb-2">
            {WALL.map((n, i) => (
              <div
                key={i}
                className={`w-[124px] overflow-hidden rounded-[18px] border border-white/10 shadow-[0_16px_36px_rgba(0,0,0,0.5)] ${i % 2 === 1 ? "translate-y-6" : ""} ${i > 3 ? "hidden sm:block" : ""}`}
              >
                <Loop src={n} className="aspect-[9/16] w-full object-cover" />
              </div>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-[120px] bg-[linear-gradient(rgba(15,15,18,0),#0f0f12)]" />
        </div>
      </section>

      {/* FAQ (last section) */}
      <FaqSection />

      {/* 原型交互提示 toast */}
      <div
        className={`pointer-events-none fixed inset-x-0 bottom-8 z-[60] flex justify-center px-4 transition-all duration-300 ${
          toast ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        {toast && (
          <div className="flex items-center gap-2 rounded-full bg-[#1a1a2e] px-4 py-2.5 text-[13px] text-white shadow-[0_12px_32px_rgba(0,0,0,0.35)]">
            <Megaphone className="size-4 text-[#ffb27a]" />
            <span className="font-bold text-[#ffb27a]">交互提示</span>
            <span className="text-white/25">|</span>
            <span className="font-medium">{toast}</span>
          </div>
        )}
      </div>
    </main>
  );
}
