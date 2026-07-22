"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import localFont from "next/font/local";
import { MarketingAgentPromptComposer } from "../marketing-agent-v14/page";

const ASSET_ROOT = "/prototypes/asset-library";
const ASSETS = {
  portrait: `${ASSET_ROOT}/images/img-01.jpg`,
  creator: `${ASSET_ROOT}/images/img-02.jpg`,
  product: `${ASSET_ROOT}/images/img-03.jpg`,
  video: `${ASSET_ROOT}/videos/video-01.mp4`,
  seedance: "/prototypes/homepage/seedance-2.0.mp4",
};

const ICON_ROOT = "/prototypes/starter-guide/icons";
const PROMO_ROOT = "/prototypes/starter-guide/promo";
const REFERO_ROOT = "/prototypes/starter-guide/refero";
const promoAssets = {
  dots: `${PROMO_ROOT}/promo-dots.svg`,
  gradient: `${PROMO_ROOT}/promo-gradient.png`,
  collage: `${PROMO_ROOT}/promo-collage.png`,
  tag: `${PROMO_ROOT}/promo-tag.svg`,
  button: "/prototypes/homepage/hero-button.svg",
};
const memberPromoAssets = {
  campaign: "/prototypes/homepage/member-campaign.png",
  dots: "/prototypes/homepage/member-dots.svg",
  sparkle: "/prototypes/homepage/member-sparkle.svg",
  tool: "/prototypes/homepage/member-tool.svg",
  history: "/prototypes/homepage/member-history.svg",
};
const freePromoAssets = {
  dots: "/prototypes/homepage/free-dots.svg",
  orb: "/prototypes/homepage/free-orb.png",
  display: "/prototypes/homepage/free-offer-display.png",
  check: "/prototypes/homepage/free-check.svg",
  timer: "/prototypes/homepage/free-time.svg",
  timerBackground: "/prototypes/homepage/free-timer-bg.svg",
  button: "/prototypes/homepage/free-offer-button.svg",
  badge: "/prototypes/homepage/free-offer-badge.png",
  wreathLeft: "/prototypes/homepage/free-wreath-left.svg",
  wreathRight: "/prototypes/homepage/free-wreath-right.svg",
};
const referoAssets = {
  visual: `${REFERO_ROOT}/refero-mcp.png`,
};

const HOMEPAGE_ROOT = "/prototypes/homepage";
const canvasAssets = {
  grid: `${HOMEPAGE_ROOT}/canvas-grid.svg`,
  glow: `${HOMEPAGE_ROOT}/canvas-glow.png`,
  demo: `${HOMEPAGE_ROOT}/canvas-demo.png`,
};

const bricolageExtraBold = localFont({
  src: "../../fonts/BricolageGrotesque-ExtraBold.ttf",
  weight: "800",
  display: "swap",
});

const ICONS = {
  logo: `${ICON_ROOT}/buzz-video-logo.svg`,
  home: `${ICON_ROOT}/home.svg`,
  agent: `${ICON_ROOT}/agent.svg`,
  marketing: `${ICON_ROOT}/marketing-agent.svg`,
  image: `${ICON_ROOT}/ai-image.svg`,
  video: `${ICON_ROOT}/ai-video.svg`,
  workflow: `${ICON_ROOT}/workflow.svg`,
  canvas: `${ICON_ROOT}/canvas.svg`,
  chat: `${ICON_ROOT}/chat.svg`,
  nanoBanana: `${ICON_ROOT}/nanobanana.svg`,
  byteDance: `${ICON_ROOT}/bytedance.svg`,
  gemini: `${ICON_ROOT}/gemini.svg`,
  claude: `${ICON_ROOT}/claude.svg`,
  new: `${ICON_ROOT}/new.svg`,
  hot: `${ICON_ROOT}/hot.svg`,
};

type QuickLink = {
  name: string;
  description: string;
  icon: string;
  type?: string;
  badge?: "new" | "hot";
};

type PromoUserState = "logged-out" | "logged-in-free" | "member";
type PromoOfferPreviewState = "countdown" | "expired";

const promoUserStates: readonly { value: PromoUserState; label: string }[] = [
  { value: "logged-out", label: "未登录" },
  { value: "logged-in-free", label: "已登录 · 非会员" },
  { value: "member", label: "已登录 · 会员" },
];

const promoOfferPreviewStates: readonly { value: PromoOfferPreviewState; label: string }[] = [
  { value: "countdown", label: "24h 内" },
  { value: "expired", label: "24h 后" },
];

const quickLinks: readonly QuickLink[] = [
  { name: "Marketing Studio", description: "Turn ideas into campaign-ready ads in seconds", icon: ICONS.marketing, badge: "hot" },
  { name: "Canvas", description: "Moodboard and chain workflows on one canvas", icon: ICONS.canvas },
  { name: "Seedance 2.0", description: "Create high-quality videos in seconds", type: "Video", icon: ICONS.byteDance },
  { name: "Nano Banana Pro", description: "Generate high-quality visuals", type: "Image", icon: ICONS.nanoBanana },
  { name: "Gemini Omni Flash", description: "Generate and edit from any input", icon: ICONS.gemini, badge: "new" },
  { name: "Seedream 5.0 Pro", description: "ByteDance's flagship image model", icon: ICONS.byteDance, badge: "new" },
];

const HERO_ROOT = "/prototypes/homepage";
const HERO_CDN_ROOT = "https://assets.presslogic.com/buzzvideo/users/334875294122958848/2026-07-15";
const NANO_BANANA_IMAGE = "https://assets.presslogic.com/cdn-cgi/image/width=1920,quality=80,format=auto,fit=scale-down/buzzvideo/public/2026-07-03/331315710884110336.png";
const heroSlides = [
  {
    title: "Seedance 2.0 Mini is now live",
    image: `${HERO_CDN_ROOT}/335599615837528064.mp4`,
    kind: "video" as const,
  },
  {
    title: "Gemini Omni Flash Now Live",
    image: `${HERO_ROOT}/hero-2.mov`,
    kind: "video" as const,
  },
  {
    title: "Seedance 2.5 - Coming Soon in July",
    image: `${HERO_CDN_ROOT}/335599619067142144.mp4`,
    kind: "video" as const,
  },
  {
    title: "Seedance 2.0 in 4K — Now Available",
    image: `${HERO_CDN_ROOT}/335599617473306624.mp4`,
    kind: "video" as const,
  },
  {
    title: "Nano Banana 2 Lite is here",
    image: NANO_BANANA_IMAGE,
    kind: "image" as const,
  },
] as const;

const seedreamGalleryColumns = [
  [
    { image: ASSETS.creator, ratio: "aspect-[4/3]" },
    { image: ASSETS.product, ratio: "aspect-[9/16]" },
    { image: ASSETS.portrait, ratio: "aspect-square" },
    { image: ASSETS.creator, ratio: "aspect-[16/9]" },
  ],
  [
    { image: ASSETS.product, ratio: "aspect-[9/16]" },
    { image: ASSETS.portrait, ratio: "aspect-[16/9]" },
    { image: ASSETS.creator, ratio: "aspect-[4/3]" },
    { image: ASSETS.product, ratio: "aspect-square" },
  ],
  [
    { image: ASSETS.portrait, ratio: "aspect-square" },
    { image: ASSETS.creator, ratio: "aspect-[4/3]" },
    { image: ASSETS.product, ratio: "aspect-[16/9]" },
    { image: ASSETS.portrait, ratio: "aspect-[9/16]" },
  ],
  [
    { image: ASSETS.creator, ratio: "aspect-[16/9]" },
    { image: ASSETS.portrait, ratio: "aspect-[9/16]" },
    { image: ASSETS.product, ratio: "aspect-square" },
    { image: ASSETS.creator, ratio: "aspect-[4/3]" },
  ],
] as const;

const apps = [
  ["Hook Studio", "Find the first line that stops the scroll.", ICONS.marketing, ASSETS.creator],
  ["Product Ads", "Turn a product shot into a ready-to-run ad.", ICONS.image, ASSETS.product],
  ["Creator UGC", "Build creator-style performance concepts.", ICONS.video, ASSETS.creator],
  ["Brand World", "Keep every visual on-brand, every time.", ICONS.canvas, ASSETS.portrait],
  ["Campaign Builder", "From research to launch assets in one flow.", ICONS.workflow, ASSETS.product],
  ["Social Studio", "Adapt stories for every channel.", ICONS.chat, ASSETS.creator],
  ["Image Studio", "Generate polished visual systems.", ICONS.image, ASSETS.product],
  ["Video Studio", "Create motion-led campaign creative.", ICONS.video, ASSETS.portrait],
] as const;

const inspiration = [
  { image: ASSETS.portrait, kind: "image" as const, ratio: "aspect-[3/4]" },
  { image: ASSETS.video, kind: "video" as const, ratio: "aspect-video" },
  { image: ASSETS.product, kind: "image" as const, ratio: "aspect-[16/10]" },
  { image: ASSETS.creator, kind: "image" as const, ratio: "aspect-square" },
  { image: ASSETS.portrait, kind: "image" as const, ratio: "aspect-[4/5]" },
  { image: ASSETS.product, kind: "image" as const, ratio: "aspect-[16/9]" },
  { image: ASSETS.video, kind: "video" as const, ratio: "aspect-[9/16]" },
  { image: ASSETS.creator, kind: "image" as const, ratio: "aspect-[3/4]" },
  { image: ASSETS.portrait, kind: "image" as const, ratio: "aspect-square" },
  { image: ASSETS.product, kind: "image" as const, ratio: "aspect-[4/5]" },
  { image: ASSETS.creator, kind: "image" as const, ratio: "aspect-[16/10]" },
  { image: ASSETS.portrait, kind: "image" as const, ratio: "aspect-[3/4]" },
  { image: ASSETS.creator, kind: "image" as const, ratio: "aspect-square" },
  { image: ASSETS.product, kind: "image" as const, ratio: "aspect-[3/4]" },
  { image: ASSETS.portrait, kind: "image" as const, ratio: "aspect-[16/10]" },
  { image: ASSETS.video, kind: "video" as const, ratio: "aspect-square" },
  { image: ASSETS.creator, kind: "image" as const, ratio: "aspect-[4/5]" },
  { image: ASSETS.product, kind: "image" as const, ratio: "aspect-square" },
  { image: ASSETS.portrait, kind: "image" as const, ratio: "aspect-[4/5]" },
  { image: ASSETS.creator, kind: "image" as const, ratio: "aspect-[3/4]" },
] as const;

const soulCinema = [
  { image: ASSETS.portrait, kind: "image" as const, ratio: "aspect-[3/4]" },
  { image: ASSETS.creator, kind: "image" as const, ratio: "aspect-square" },
  { image: ASSETS.video, kind: "video" as const, ratio: "aspect-[9/16]" },
  { image: ASSETS.product, kind: "image" as const, ratio: "aspect-[4/5]" },
  { image: ASSETS.portrait, kind: "image" as const, ratio: "aspect-[16/10]" },
  { image: ASSETS.creator, kind: "image" as const, ratio: "aspect-[3/4]" },
  { image: ASSETS.product, kind: "image" as const, ratio: "aspect-square" },
  { image: ASSETS.video, kind: "video" as const, ratio: "aspect-video" },
  { image: ASSETS.portrait, kind: "image" as const, ratio: "aspect-[4/5]" },
  { image: ASSETS.creator, kind: "image" as const, ratio: "aspect-[16/10]" },
  { image: ASSETS.product, kind: "image" as const, ratio: "aspect-[3/4]" },
  { image: ASSETS.portrait, kind: "image" as const, ratio: "aspect-square" },
  { image: ASSETS.creator, kind: "image" as const, ratio: "aspect-[4/5]" },
  { image: ASSETS.product, kind: "image" as const, ratio: "aspect-[16/10]" },
  { image: ASSETS.portrait, kind: "image" as const, ratio: "aspect-[3/4]" },
  { image: ASSETS.creator, kind: "image" as const, ratio: "aspect-square" },
  { image: ASSETS.video, kind: "video" as const, ratio: "aspect-square" },
  { image: ASSETS.product, kind: "image" as const, ratio: "aspect-[4/5]" },
  { image: ASSETS.portrait, kind: "image" as const, ratio: "aspect-[16/10]" },
  { image: ASSETS.creator, kind: "image" as const, ratio: "aspect-[3/4]" },
] as const;

// Seedance gallery 信息流:只放横屏视频(16:9 / 4:3)。按列顺序:列1 / 列3 / 列2
const seedanceStream = [
  // 列 1
  { image: ASSETS.video, kind: "video" as const, ratio: "aspect-video" },
  { image: ASSETS.seedance, kind: "video" as const, ratio: "aspect-[4/3]" },
  { image: ASSETS.video, kind: "video" as const, ratio: "aspect-[4/3]" },
  // 列 2(原第 3 列)
  { image: ASSETS.video, kind: "video" as const, ratio: "aspect-[4/3]" },
  { image: ASSETS.video, kind: "video" as const, ratio: "aspect-video" },
  { image: ASSETS.video, kind: "video" as const, ratio: "aspect-video" },
  // 列 3(原第 2 列)
  { image: ASSETS.video, kind: "video" as const, ratio: "aspect-video" },
  { image: ASSETS.video, kind: "video" as const, ratio: "aspect-video" },
  { image: ASSETS.seedance, kind: "video" as const, ratio: "aspect-[4/3]" },
] as const;

const inspirationTabs = ["All", "Hooks", "UGC"] as const;

const footerGroups = [
  ["Tools", "AI image generator", "Image style transfer", "AI art generator", "Image to image", "Text to image", "Generate image from text", "AI video generator", "Text to video", "Image to video", "Video style transfer", "AI motion effects", "Generate video from text"],
  ["Models", "Nano Banana 2 Lite", "GPT-image-2", "Seedream 5.0 lite", "Nano Banana 2", "Nano Banana Pro", "Nano Banana", "Seedream 4.5", "Gemini Omni Flash", "Seedance 2.5", "Seedance 2.0 Mini", "Seedance 2.0 Fast", "Seedance 2.0", "Kling 3.0", "Veo3.1 Fast", "Veo 3.1", "Seedance 1.5 Pro"],
  ["Resources", "Pricing", "Help Center", "Affiliate"],
  ["Legal", "Privacy Policy", "Terms of Service"],
] as const;

const footerSocials = ["Youtube", "Instagram", "Tiktok"] as const;

function Asset({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return <Image src={src} alt={alt} fill sizes="(max-width: 768px) 100vw, 50vw" className={`object-cover ${className}`} />;
}

function ProductIcon({ src, label, className = "size-6" }: { src: string; label: string; className?: string }) {
  return <Image src={src} alt="" aria-label={label} width={28} height={28} className={className} />;
}

function Action({ children, inverse = false }: { children: React.ReactNode; inverse?: boolean }) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-full px-4 py-2.5 text-[13px] font-bold transition hover:-translate-y-0.5 ${
        inverse ? "bg-gradient-to-r from-[#FFA73C] to-[#FF5255] text-white" : "border border-[#ff5e1a]/30 bg-white text-[#ff5e1a] hover:bg-[#fff3ec]"
      }`}
    >
      {children} <span className="ml-2 text-base leading-none">→</span>
    </button>
  );
}

const NEW_USER_OFFER_SECONDS = 23 * 60 * 60 + 59 * 60 + 47;

function LoggedInFreePromoCard({ forceExpired = false }: { forceExpired?: boolean }) {
  const [offerSecondsLeft, setOfferSecondsLeft] = useState(NEW_USER_OFFER_SECONDS);
  const benefits = [
    "Unlimited image & video generation",
    "Unlimited use of Marketing Agent",
    "Unlimited access to all AI models – Seedance 2.0, GPT-image-2 & more",
  ] as const;

  useEffect(() => {
    const storageKey = "buzzvideo-new-user-offer-end-v2";
    const now = Date.now();
    const storedTargetValue = window.localStorage.getItem(storageKey);
    const storedTarget = Number(storedTargetValue);
    const target = storedTargetValue !== null && Number.isFinite(storedTarget)
      ? storedTarget
      : now + NEW_USER_OFFER_SECONDS * 1000;

    if (storedTargetValue === null || !Number.isFinite(storedTarget)) {
      window.localStorage.setItem(storageKey, String(target));
    }

    const updateCountdown = () => {
      setOfferSecondsLeft(Math.max(0, Math.ceil((target - Date.now()) / 1000)));
    };

    updateCountdown();
    if (target <= now) return;
    const countdownTimer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(countdownTimer);
  }, []);

  const countdownHours = String(Math.floor(offerSecondsLeft / 3600)).padStart(2, "0");
  const countdownMinutes = String(Math.floor((offerSecondsLeft % 3600) / 60)).padStart(2, "0");
  const countdownSeconds = String(offerSecondsLeft % 60).padStart(2, "0");
  const countdownLabel = `${countdownHours}:${countdownMinutes}:${countdownSeconds}`;
  const offerExpired = forceExpired || offerSecondsLeft <= 0;

  return (
    <>
      <Image src={freePromoAssets.dots} alt="" fill sizes="(max-width: 900px) 100vw, 40vw" className="pointer-events-none object-cover opacity-75" />

      <div className="pointer-events-none absolute inset-y-0 left-[-18%] right-[-2%]">
        <Image src={freePromoAssets.orb} alt="" fill sizes="(max-width: 900px) 118vw, 48vw" className="object-cover object-right" />
      </div>

      <div className="relative z-10 flex h-full w-[62%] flex-col items-start p-[clamp(16px,4.5cqw,42px)] pr-0 sm:max-[899px]:p-[3.8cqw] sm:max-[899px]:pr-0">
        <div className={`${bricolageExtraBold.className} tracking-[-0.055em] text-black`}>
          {offerExpired ? (
            <h2 className="max-w-[58cqw] text-[clamp(20px,5cqw,48px)] leading-[0.95]">
              <span className="block">Upgrade with up to</span>
              <span className="mt-[1.7cqw] flex w-fit items-center gap-[0.7cqw] whitespace-nowrap rounded-[1.5cqw] bg-gradient-to-r from-[#ff8a59]/90 to-[#ff5b64]/80 px-[1.8cqw] py-[0.7cqw] text-[clamp(18px,5.4cqw,52px)] text-white shadow-[0_3px_12px_rgba(215,70,58,0.2)]">
                <Image src={freePromoAssets.wreathLeft} alt="" width={42} height={42} className="size-[clamp(17px,4cqw,38px)]" />
                50% OFF
                <Image src={freePromoAssets.wreathRight} alt="" width={42} height={42} className="size-[clamp(17px,4cqw,38px)]" />
              </span>
            </h2>
          ) : (
            <>
              <div className="flex items-center gap-[1.6cqw] whitespace-nowrap text-[clamp(20px,5cqw,48px)] leading-[0.95]">
                <span>New User</span>
                <span className="flex items-center gap-[0.7cqw] text-[clamp(18px,5.4cqw,52px)] text-white drop-shadow-[0_1px_1px_rgba(255,82,85,0.16)]">
                  <Image src={freePromoAssets.wreathLeft} alt="" width={42} height={42} className="size-[clamp(17px,4cqw,38px)]" />
                  50% OFF
                  <Image src={freePromoAssets.wreathRight} alt="" width={42} height={42} className="size-[clamp(17px,4cqw,38px)]" />
                </span>
              </div>
              <h2 className="mt-[1.7cqw] text-[clamp(20px,5cqw,48px)] leading-[0.95]">Special offer</h2>
            </>
          )}
        </div>

        {!offerExpired && (
          <div className="relative mt-[3.2cqw] flex aspect-[323/42] w-[clamp(215px,50cqw,390px)] items-center pl-[9%] pr-[6%] sm:max-[899px]:mt-[2cqw] sm:max-[899px]:w-[min(42cqw,340px)]">
            <Image src={freePromoAssets.timerBackground} alt="" fill sizes="390px" className="object-fill" />
            <Image src={freePromoAssets.timer} alt="" width={31} height={31} className="relative z-10 h-[58%] w-auto shrink-0" />
            <span className="relative z-10 ml-[1.2cqw] whitespace-nowrap text-[clamp(9px,2.35cqw,18px)] font-bold tabular-nums text-white">
              This Offer Ends In {countdownLabel}
            </span>
          </div>
        )}

        <ul className={`${offerExpired ? "mt-[5cqw] sm:max-[899px]:mt-[4cqw]" : "mt-[2.6cqw] sm:max-[899px]:mt-[1.8cqw]"} space-y-[1.8cqw] text-[clamp(10px,2.25cqw,20px)] leading-[1.35] text-[#66666b] sm:max-[899px]:space-y-[1cqw] sm:max-[899px]:text-[clamp(10px,1.9cqw,17px)]`}>
          {benefits.map((benefit) => (
            <li key={benefit} className="flex max-w-[55cqw] items-start gap-[1.8cqw]">
              <Image src={freePromoAssets.check} alt="" width={24} height={24} className="mt-[0.12em] size-[clamp(12px,2.5cqw,22px)] shrink-0" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>

        <button aria-label="Get 50% off" className="relative mt-auto w-[clamp(150px,31cqw,300px)] pb-[2cqw] transition hover:-translate-y-0.5 active:translate-y-0.5 sm:max-[899px]:w-[clamp(150px,26cqw,230px)] sm:max-[899px]:pb-[1.5cqw]">
          <Image src={freePromoAssets.button} alt="Get 50% OFF" width={312} height={102} className="h-auto w-full" />
          <Image src={freePromoAssets.badge} alt="Limited-time offer" width={270} height={42} className="absolute bottom-0 left-1/2 w-[80%] -translate-x-1/2" />
        </button>
      </div>

      <div className="pointer-events-none absolute bottom-0 right-[1.5%] z-10 w-[45%] sm:w-[33%] min-[900px]:!w-[45%]">
        <Image src={freePromoAssets.display} alt="50% off new-user offer" width={926} height={1358} sizes="(max-width: 900px) 45vw, 22vw" className="h-auto w-full" />
      </div>
    </>
  );
}

function MemberPromoCard() {
  return (
    <>
      <Image src={memberPromoAssets.dots} alt="" fill sizes="(max-width: 900px) 100vw, 40vw" className="pointer-events-none object-cover opacity-55" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-[58%] bg-[radial-gradient(ellipse_at_center_bottom,rgba(255,134,94,0.26),transparent_72%)]" />

      <div className="relative z-10 p-[clamp(18px,5cqw,38px)]">
        <h2 className={`${bricolageExtraBold.className} max-w-[70%] text-[clamp(22px,6.4cqw,44px)] leading-[0.96] tracking-[-0.055em] text-black`}>
          Marketing <span className="bg-gradient-to-r from-[#ffa73c] to-[#ff5255] bg-clip-text text-transparent">Agent</span>
        </h2>
        <p className="mt-[1.5cqw] max-w-[62%] text-[clamp(10px,2.45cqw,18px)] leading-[1.3] text-[#66666b]">Your ideas, campaign-ready in seconds</p>
      </div>

      <button className="absolute right-[5cqw] top-[5cqw] z-20 flex h-[clamp(34px,7.2cqw,54px)] w-[clamp(108px,25cqw,180px)] items-center justify-center gap-[1.5cqw] rounded-[clamp(10px,2.4cqw,18px)] bg-gradient-to-b from-[#ff5255] to-[#ffa73c] text-[clamp(14px,3cqw,21px)] font-bold text-white shadow-[0_3px_0_#b65a42] transition hover:-translate-y-0.5 active:translate-y-1 active:shadow-none">
        <Image src={memberPromoAssets.sparkle} alt="" width={42} height={42} className="size-[clamp(18px,4cqw,28px)]" />
        Try now
      </button>

      <div className="absolute left-[5cqw] right-[5cqw] top-[40%] h-[73%] overflow-visible rounded-[clamp(18px,4cqw,34px)] border border-[#ff5a52] bg-white shadow-[0_-4px_12px_rgba(255,92,52,0.58),0_-18px_48px_rgba(255,116,65,0.34),0_10px_28px_rgba(112,44,28,0.14)]">
        <div className="flex items-center gap-[1.5cqw] px-[3cqw] pb-[2.5cqw] pt-[3cqw]">
          <Image src={ICONS.logo} alt="" width={32} height={32} className="size-[clamp(17px,3.2cqw,26px)]" />
          <span className="bg-gradient-to-r from-[#ffa73c] to-[#ff5255] bg-clip-text text-[clamp(11px,2.5cqw,18px)] font-bold text-transparent">Marketing Agent</span>
        </div>
        <div className="mx-[3cqw] h-px bg-[#d7d4d2]" />

        <p className="mt-[3cqw] max-w-[57%] px-[3cqw] text-[clamp(10px,2.35cqw,18px)] leading-[1.4] text-[#99999d] min-[900px]:max-w-[64%] lg:!max-w-[57%] 2xl:!max-w-[68%]">
          Create a full campaign for @BuzzMilk, with assets tailored for every social platform
        </p>

        <div className="absolute bottom-[12cqw] left-[3cqw] z-10 flex items-center gap-[1.2cqw]">
          <button aria-label="Add campaign material" className="grid size-[clamp(28px,5cqw,42px)] place-items-center rounded-full border border-[#eeeeee] bg-white text-[clamp(18px,3cqw,26px)] leading-none shadow-sm">+</button>
          <button className="flex h-[clamp(28px,5cqw,42px)] items-center gap-1 rounded-full border border-[#ff665c] bg-[#fff8f2] px-[clamp(10px,2.5cqw,18px)] text-[clamp(9px,2cqw,14px)] font-semibold text-[#ff6a45]">
            <Image src={memberPromoAssets.sparkle} alt="" width={42} height={42} className={`size-[clamp(13px,2.5cqw,18px)] ${ORANGE_FILTER}`} />
            Marketing Agent
          </button>
          <button aria-label="Campaign tools" className="rounded-full">
            <Image src={memberPromoAssets.tool} alt="" width={56} height={56} className="size-[clamp(28px,5cqw,42px)]" />
          </button>
          <button aria-label="Campaign history" className="rounded-full">
            <Image src={memberPromoAssets.history} alt="" width={56} height={56} className="size-[clamp(28px,5cqw,42px)]" />
          </button>
        </div>

      </div>

      <div className="pointer-events-none absolute bottom-0 right-[-3cqw] z-20 h-[45%] w-[42%]">
        <Image src={memberPromoAssets.campaign} alt="BuzzMilk campaign preview" fill sizes="(max-width: 900px) 42vw, 20vw" className="object-contain object-right-bottom" />
      </div>
    </>
  );
}

type GalleryItem = { image: string; kind: "image" | "video"; ratio: string };

// 5 列 masonry 网格 + 底部白色渐变淡出 + 圆角按钮(不含外层白卡/标题)。
// Make the moment / Soul Cinema / Seedance 电视机区块共用。
function MasonryStream({
  items,
  cta,
  ctaHref,
  maxH = "max-h-[1180px]",
  cols = "columns-2 lg:columns-4 xl:columns-5",
}: {
  items: readonly GalleryItem[];
  cta: string;
  ctaHref?: string;
  maxH?: string;
  cols?: string;
}) {
  return (
    <div className="relative">
      <div className={`${maxH} overflow-hidden`}>
        <div className={`[column-gap:0.5rem] sm:[column-gap:0.75rem] ${cols}`}>
          {items.map((it, index) => (
            <article
              key={`${it.image}-${index}`}
              className={`group relative mb-2 block break-inside-avoid overflow-hidden rounded-xl bg-[#fff3ec] sm:mb-3 sm:rounded-2xl ${it.ratio}`}
            >
              {it.kind === "video" ? (
                <video autoPlay muted loop playsInline src={it.image} className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-105" />
              ) : (
                <Asset src={it.image} alt="" className="transition duration-700 group-hover:scale-105" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
            </article>
          ))}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-56 items-end justify-center bg-gradient-to-t from-white via-white/90 to-transparent">
        {ctaHref ? (
          <Link href={ctaHref} className="pointer-events-auto inline-flex items-center gap-2 rounded-xl bg-[#fff3ec] px-6 py-3 text-[14px] font-bold text-[#ff5e1a] shadow-[0_4px_16px_rgba(255,94,26,0.12)] transition hover:-translate-y-0.5 hover:bg-[#ffe7d6]">
            {cta}
            <span className="text-base leading-none">↗</span>
          </Link>
        ) : (
          <button className="pointer-events-auto inline-flex items-center gap-2 rounded-xl bg-[#fff3ec] px-6 py-3 text-[14px] font-bold text-[#ff5e1a] shadow-[0_4px_16px_rgba(255,94,26,0.12)] transition hover:-translate-y-0.5 hover:bg-[#ffe7d6]">
            {cta}
            <span className="text-base leading-none">↗</span>
          </button>
        )}
      </div>
    </div>
  );
}

// 白卡瀑布流,Make the moment / Soul Cinema 共用

// 白卡瀑布流区块:标题(招牌渐变强调词)+ 搜索 + All/Image/Video tab + 5 列 masonry
// + 底部渐变淡出 + 圆角按钮。Make the moment / Soul Cinema 共用。
function MasonryGallery({
  title,
  desc,
  items,
  cta,
  ctaHref,
}: {
  title: React.ReactNode;
  desc: string;
  items: readonly GalleryItem[];
  cta: string;
  ctaHref?: string;
}) {
  const [tab, setTab] = useState<(typeof inspirationTabs)[number]>("All");
  const shown = items.filter((it) =>
    tab === "All" ? true : tab === "UGC" ? it.kind === "video" : it.kind === "image",
  );

  return (
    <section className="px-3 py-4 sm:px-5 sm:py-6 lg:px-6">
      <div className="mx-auto max-w-[1600px] rounded-[24px] border border-[#ececf1] bg-white p-6 shadow-[0_4px_16px_rgba(26,26,46,0.04)] sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className={`${bricolageExtraBold.className} text-[clamp(22px,2.2vw,34px)] leading-tight tracking-[-0.035em] text-[#1a1a2e]`}>{title}</h2>
            <p className="mt-2 max-w-[460px] text-[12px] leading-relaxed text-[#6a6b7b] sm:text-[13px]">{desc}</p>
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          {inspirationTabs.map((t) => {
            const active = t === tab;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-full px-5 py-2 text-[14px] font-semibold transition ${
                  active ? "bg-[#1a1a2e] text-white" : "text-[#6a6b7b] hover:bg-[#f2f1f4] hover:text-[#1a1a2e]"
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>

        <div className="mt-7">
          <MasonryStream items={shown} cta={cta} ctaHref={ctaHref} />
        </div>
      </div>
    </section>
  );
}

export function HomepageContent({
  embedded = false,
  promoUserState = "logged-out",
  promoOfferPreviewState = "countdown",
}: {
  embedded?: boolean;
  promoUserState?: PromoUserState;
  promoOfferPreviewState?: PromoOfferPreviewState;
}) {
  const heroTrackRef = useRef<HTMLDivElement>(null);
  const [heroAtStart, setHeroAtStart] = useState(true);
  const [heroAtEnd, setHeroAtEnd] = useState(false);
  const seedreamGalleryRef = useRef<HTMLDivElement>(null);

  const updateHeroEdges = () => {
    const track = heroTrackRef.current;
    if (!track) return;
    setHeroAtStart(track.scrollLeft <= 1);
    setHeroAtEnd(track.scrollLeft >= track.scrollWidth - track.clientWidth - 1);
  };

  const scrollHero = (direction: 1 | -1) => {
    const track = heroTrackRef.current;
    if (!track) return;
    const card = track.querySelector<HTMLElement>("[data-hero-card]");
    const step = card ? card.offsetWidth + 16 : track.clientWidth * 0.25;
    track.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  useEffect(() => {
    updateHeroEdges();
    window.addEventListener("resize", updateHeroEdges);
    return () => window.removeEventListener("resize", updateHeroEdges);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const stream = seedreamGalleryRef.current;
      if (stream) stream.scrollTop = stream.scrollHeight / 3;
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const loopSeedreamGallery = (event: React.UIEvent<HTMLDivElement>) => {
    const stream = event.currentTarget;
    const sectionHeight = stream.scrollHeight / 3;
    if (!sectionHeight) return;

    if (stream.scrollTop < sectionHeight * 0.45) {
      stream.scrollTop += sectionHeight;
    } else if (stream.scrollTop > sectionHeight * 1.55) {
      stream.scrollTop -= sectionHeight;
    }
  };

  return (
    <div data-promo-user-state={promoUserState} data-promo-offer-state={promoOfferPreviewState} className="min-h-full overflow-x-hidden bg-[#fbfafc] text-[#1a1a2e]">
      <section className="px-3 py-4 sm:px-5 sm:py-6 lg:px-6">
        <div className="mx-auto max-w-[1600px]">
          <div className={embedded ? "hidden" : "mb-3 flex items-center justify-between rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-4 py-2 text-[11px] font-extrabold tracking-[0.06em] text-white sm:px-5 sm:text-[12px]"}>
            <span>CREATE YOUR FIRST CAMPAIGN WITH EXTRA CREDITS</span>
            <span className="hidden rounded-full bg-white/20 px-2.5 py-1 text-[10px] text-white sm:block">LIMITED OFFER</span>
          </div>

          <div className={embedded ? "hidden" : "mb-5 flex items-center justify-between px-1 sm:mb-6"}>
            <div className="flex items-center gap-2.5">
              <Image src={ICONS.logo} alt="Buzz Video" width={36} height={36} className="size-9" priority />
              <span className="text-[17px] font-extrabold tracking-tight">BuzzVideo</span>
            </div>
            <div className="hidden items-center gap-4 text-[13px] font-semibold text-[#6a6b7b] lg:flex">
              <span>Image</span><span>Video</span><span>Agent</span><span>Canvas</span><span>Community</span>
            </div>
            <Action inverse>Start creating</Action>
          </div>

        </div>

        <div className="relative mx-auto max-w-[1600px]">
          <div
            ref={heroTrackRef}
            onScroll={updateHeroEdges}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-1 scroll-px-[14vw] sm:snap-none sm:scroll-px-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {heroSlides.map((slide, index) => (
              <div key={slide.title} data-hero-card className="group w-[72vw] shrink-0 snap-center sm:w-[46%] sm:snap-none lg:w-[calc((100%_-_3rem)/3.5)]">
                <div className="relative aspect-video overflow-hidden rounded-[20px] border border-[#ececf1] bg-[#fff3ec] shadow-[0_10px_26px_rgba(26,26,46,0.1)]">
                  {slide.kind === "video" ? (
                    <video autoPlay muted loop playsInline preload={index === 0 ? "auto" : "metadata"} src={slide.image} className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-105" />
                  ) : (
                    <Asset src={slide.image} alt={slide.title} className="transition duration-700 group-hover:scale-105" />
                  )}
                </div>
                <p className="mt-3 w-fit text-[15px] font-bold tracking-[0.01em] text-[#1a1a2e] transition-colors group-hover:bg-gradient-to-r group-hover:from-[#ffc078] group-hover:to-[#ff5e1a] group-hover:bg-clip-text group-hover:text-transparent">{slide.title}</p>
              </div>
            ))}
          </div>
          {!heroAtStart && <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-24 bg-gradient-to-r from-[#fbfafc] via-[#fbfafc]/80 to-transparent sm:block" />}
          {!heroAtEnd && <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-24 bg-gradient-to-l from-[#fbfafc] via-[#fbfafc]/80 to-transparent sm:block" />}
          {!heroAtStart && <button onClick={() => scrollHero(-1)} aria-label="Previous" className="absolute left-2 top-[calc(50%-16px)] z-20 hidden size-10 -translate-y-1/2 place-items-center rounded-full border border-[#ececf1] bg-white/90 text-lg text-[#1a1a2e] shadow-[0_6px_18px_rgba(26,26,46,0.14)] backdrop-blur transition hover:border-[#ff5e1a] hover:text-[#ff5e1a] sm:left-4 sm:grid">←</button>}
          {!heroAtEnd && <button onClick={() => scrollHero(1)} aria-label="Next" className="absolute right-2 top-[calc(50%-16px)] z-20 hidden size-10 -translate-y-1/2 place-items-center rounded-full border border-[#ececf1] bg-white/90 text-lg text-[#1a1a2e] shadow-[0_6px_18px_rgba(26,26,46,0.14)] backdrop-blur transition hover:border-[#ff5e1a] hover:text-[#ff5e1a] sm:right-4 sm:grid">→</button>}
        </div>

        <div className="mx-auto max-w-[1600px]">
          <div className="mt-5 grid items-stretch gap-4 min-[900px]:h-[clamp(270px,calc(468px-14.4vw),324px)] min-[900px]:grid-cols-[minmax(0,1.8fr)_minmax(0,1.6fr)] lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,0.6fr)_minmax(0,1.1fr)] 2xl:grid-cols-[calc((100%_-_3rem)/3.5)_minmax(0,1fr)]">
            <article className={`relative aspect-[3/2] overflow-hidden rounded-[24px] border shadow-[0_10px_26px_rgba(255,123,83,0.12)] [container-type:inline-size] ${
              promoUserState === "member"
                ? "border-[#f0eeee] bg-white sm:aspect-[1.9/1] min-[900px]:h-full min-[900px]:!aspect-auto"
                : promoUserState === "logged-in-free"
                  ? "border-[#ffe0dc] bg-[linear-gradient(105deg,#fff_0%,#fff7f5_17%,#ffaaa4_58%,#ff7583_100%)] sm:aspect-[1.9/1] min-[900px]:h-full min-[900px]:!aspect-auto"
                : "border-[#ffe3d7] bg-[radial-gradient(circle_at_90%_0%,#ffe9dc_0%,#fff_45%,#fff6f0_100%)] sm:aspect-video md:aspect-[2.4/1] min-[900px]:h-full min-[900px]:!aspect-auto"
            }`}>
              {promoUserState === "member" ? (
                <MemberPromoCard />
              ) : promoUserState === "logged-in-free" ? (
                <LoggedInFreePromoCard forceExpired={promoOfferPreviewState === "expired"} />
              ) : (
                <>
                  <Image src={promoAssets.dots} alt="" fill sizes="(max-width: 1024px) 100vw, 40vw" className="pointer-events-none object-cover opacity-55" />
                  <Image src={promoAssets.gradient} alt="" fill sizes="(max-width: 1024px) 100vw, 40vw" className="pointer-events-none object-cover object-bottom opacity-85" />
                  <div className="pointer-events-none absolute right-[-10cqw] top-[48%] h-[min(48cqw,290px)] w-[min(52cqw,340px)] -translate-y-1/2 md:right-[-8cqw] md:top-1/2 md:h-[min(54cqw,380px)] md:w-[min(62cqw,460px)] min-[900px]:!right-[-10cqw] min-[900px]:!top-[48%] min-[900px]:!h-[min(48cqw,290px)] min-[900px]:!w-[min(52cqw,340px)] 2xl:!right-[-12cqw] 2xl:!top-[51%] 2xl:!h-[min(62cqw,320px)] 2xl:!w-[min(70cqw,380px)]">
                    <Image src={promoAssets.collage} alt="" fill sizes="(max-width: 1024px) 75vw, 36vw" className="object-contain object-center" />
                  </div>
                  <div className="relative z-10 flex h-full flex-col items-start p-[clamp(20px,5cqw,40px)]">
                    <Image src={promoAssets.tag} alt="Member bonus" width={242} height={42} className="h-[clamp(14px,4.5cqw,25px)] w-auto" />
                    <h2 className={`${bricolageExtraBold.className} mt-[3.8cqw] max-w-[15.5ch] text-[clamp(18px,5.7cqw,34px)] leading-[0.94] tracking-[-0.055em] text-black`}>
                      <span className="block">SIGN UP AND GET</span>
                      <span className="whitespace-nowrap"><span className="bg-gradient-to-r from-[#ffa73c] to-[#ff5255] bg-clip-text text-transparent">FREE</span> CREDITS</span>
                    </h2>
                    <p className="mt-[2.8cqw] max-w-[42cqw] text-[clamp(10px,2.65cqw,14px)] leading-[1.35] text-[#68686d]">Free credits to spend across every model.</p>
                    <button aria-label="Get Free Credits" className="mt-auto block w-[clamp(180px,44cqw,320px)] transition hover:-translate-y-0.5 active:translate-y-0.5 md:w-[clamp(180px,34cqw,260px)] min-[900px]:!w-[clamp(180px,44cqw,320px)]">
                      <Image src={promoAssets.button} alt="" width={412} height={102} className="h-auto w-full" />
                    </button>
                    <p className="mt-[1.3cqw] max-w-[88cqw] text-[clamp(9px,2.35cqw,13px)] leading-[1.35] text-[#68686d]">Start free. 500 free credits on sign-up, no credit card required.</p>
                  </div>
                </>
              )}
            </article>

            <div className="grid min-h-[280px] self-stretch grid-cols-2 gap-3 sm:min-h-[320px] min-[900px]:h-full min-[900px]:!min-h-0 min-[900px]:grid-cols-3 min-[900px]:grid-rows-2">
              {quickLinks.map(({ name, description, type, icon, badge }) => (
                <button key={name} className="group relative flex min-h-[136px] min-w-0 flex-col overflow-hidden rounded-2xl border border-[#ececf1] bg-white p-4 text-left shadow-[0_4px_16px_rgba(26,26,46,0.04)] transition hover:-translate-y-0.5 hover:border-[#ffc7a9] hover:bg-[#fffaf7] hover:shadow-[0_10px_24px_rgba(26,26,46,0.08)] sm:min-h-[154px] sm:p-5 min-[900px]:!min-h-0 min-[900px]:!p-4">
                  <div className="flex items-start justify-between gap-3">
                    <ProductIcon src={icon} label={name} className="size-7 min-[900px]:size-6 2xl:size-7" />
                    {badge ? (
                      <Image src={badge === "hot" ? ICONS.hot : ICONS.new} alt={badge === "hot" ? "Hot" : "New"} width={42} height={21} className="absolute right-3 top-3 h-5 w-auto" />
                    ) : type ? (
                      <span className="rounded-full bg-[#f5f3f1] px-2.5 py-1 text-[10px] font-bold text-[#6a6b7b]">{type}</span>
                    ) : null}
                  </div>
                  <div className="mt-auto pt-3">
                    <h3 className="truncate text-[16px] font-extrabold tracking-tight min-[900px]:text-[15px] 2xl:text-[16px]">{name}</h3>
                    <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-[#6a6b7b] min-[900px]:text-[11px] 2xl:text-[12px]">{description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-3 py-4 sm:px-5 sm:py-6 lg:px-6">
        <div className="mx-auto max-w-[1600px] overflow-hidden rounded-[24px] border border-[#ffe0d4] bg-[linear-gradient(130deg,#fffdfb_0%,#fff4ef_54%,#fff9f5_100%)] p-5 text-[#1a1a2e] shadow-[0_14px_34px_rgba(255,123,83,0.1)] sm:p-6 lg:p-7">
          <div className="grid gap-5 sm:gap-8 xl:h-[320px] xl:grid-cols-[minmax(430px,35fr)_minmax(0,65fr)]">
            <div className="flex min-h-0 min-w-0 flex-col sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(300px,0.95fr)] sm:items-center sm:gap-6 md:grid-cols-[minmax(0,1fr)_minmax(330px,0.95fr)] md:gap-8 xl:flex xl:h-full xl:flex-col xl:items-stretch xl:gap-0">
              <div className="sm:self-center xl:self-auto">
                <span className="text-[10px] font-extrabold tracking-[0.08em] text-[#ff6b3d]">LIMITED-TIME BOOST</span>
                <h2 className={`${bricolageExtraBold.className} mt-2 text-[clamp(22px,2.2vw,34px)] leading-tight tracking-[-0.035em] text-[#1a1a2e] xl:whitespace-nowrap`}>Discover <span className="bg-gradient-to-r from-[#ffa73c] to-[#ff5255] bg-clip-text text-transparent">ChatGPT Image 2.0</span></h2>
                <p className="mt-2 max-w-[460px] text-[12px] leading-relaxed text-[#6a6b7b] sm:text-[13px]">Experience our latest image model and receive 35% bonus credits during this limited-time launch offer.</p>
              </div>

              <div className="relative mx-auto mt-10 h-[132px] w-[330px] max-w-full sm:mt-0 sm:w-[300px] sm:justify-self-end md:w-[330px] lg:h-[218px] lg:w-[530px] lg:origin-center lg:scale-[0.8] xl:mt-auto xl:origin-bottom-left">
                {[
                  ["https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-05-28/318341142179557376.png", "left-1 bottom-2 z-10 -rotate-[8deg]"],
                  ["https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-06-24/328062986071629824.png", "left-[22%] bottom-0 z-20 -rotate-[2deg]"],
                  ["https://assets.presslogic.com/buzzvideo/public/2026-07-03/331328468790861824.png", "left-[45%] bottom-2 z-30 rotate-[4deg]"],
                  ["https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-05-28/318341383679193088.png", "left-[68%] bottom-4 z-10 rotate-[10deg]"],
                ].map(([image, position], index) => (
                  <div key={index} className={`absolute h-[116px] w-[86px] overflow-hidden rounded-[12px] border-2 border-white/90 bg-[#fff3ec] shadow-[0_16px_30px_rgba(151,72,48,.2)] lg:h-[180px] lg:w-[136px] lg:rounded-[16px] ${position}`}>
                    <Asset src={image} alt="Seedream creation preview" />
                  </div>
                ))}
              </div>
            </div>

            <div ref={seedreamGalleryRef} onScroll={loopSeedreamGallery} className="seedream-stream relative mx-auto h-[240px] w-full min-w-0 max-w-[620px] overflow-x-hidden overflow-y-scroll overscroll-contain rounded-[14px] border border-[#ffe4d9] bg-white [scrollbar-width:none] lg:max-w-none xl:h-full">
              <div className="grid grid-cols-2 bg-[#fff5f0] [&>*]:min-w-0 lg:grid-cols-3 xl:grid-cols-4">
                {seedreamGalleryColumns.map((column, columnIndex) => (
                  <div key={columnIndex} className={`${columnIndex === 2 ? "hidden lg:flex" : columnIndex === 3 ? "hidden xl:flex" : "flex"} flex-col border-r border-[#fff5f0] last:border-r-0`}>
                    {[...column, ...column, ...column].map(({ image, ratio }, imageIndex) => (
                      <button key={`${columnIndex}-${imageIndex}`} aria-label="Explore Seedream creation" className={`group relative block w-full shrink-0 overflow-hidden bg-white text-left transition duration-300 hover:z-10 hover:scale-[1.02] ${ratio}`}>
                        <Asset src={image} alt="Seedream creation" className="transition duration-500 group-hover:scale-105" />
                        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#ff9c75]/25 to-transparent" />
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="hidden border-y border-[#ececf1] bg-white px-3 py-14 sm:px-5 sm:py-18 lg:px-6">
        <div className="mx-auto grid max-w-[1600px] gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="relative min-h-[360px] overflow-hidden rounded-2xl bg-[linear-gradient(160deg,#ffe6a3_0%,#ffb08a_43%,#fff3ec_100%)] p-6 text-[#1a1a2e]">
            <span className="rounded-full bg-black/12 px-2.5 py-1 text-[10px] font-extrabold tracking-[0.12em]">9 DAYS LEFT</span>
            <h2 className="mt-5 text-[36px] font-black leading-[0.92] tracking-[-0.06em]">$100 000<br />BUZZ APP<br />CONTEST</h2>
            <p className="mt-5 text-[13px] leading-relaxed text-black/65">Build your best app on BuzzVideo and show the world what your creative system can do.</p>
            <div className="absolute bottom-6 left-6"><Action inverse>Join the contest</Action></div>
          </aside>

          <div>
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2"><button className="rounded-full bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-4 py-2 text-[12px] font-bold text-white">All apps</button><button className="rounded-full border border-[#ececf1] px-4 py-2 text-[12px] font-bold text-[#6a6b7b]">Made with Buzz</button></div>
              <label className="rounded-full border border-[#ececf1] bg-[#fbfafc] px-4 py-2 text-[12px] text-[#9a9bb0]">Search apps</label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {apps.map(([name, description, icon, image], index) => (
                <article key={name} className="group overflow-hidden rounded-xl border border-[#ececf1] bg-white transition hover:-translate-y-1 hover:shadow-[0_10px_28px_rgba(26,26,46,.08)]">
                  <div className="relative aspect-[4/3] overflow-hidden"><Asset src={image} alt={name} className="transition duration-500 group-hover:scale-105" />{index < 2 && <span className="absolute right-2 top-2 rounded-md bg-[#fff3ec] px-2 py-1 text-[9px] font-black text-[#ff5e1a]">NEW</span>}</div>
                  <div className="p-3.5"><div className="flex items-center gap-2"><ProductIcon src={icon} label={name} /><h3 className="text-[14px] font-bold">{name}</h3></div><p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-[#6a6b7b]">{description}</p><p className="mt-4 text-[10px] text-[#9a9bb0]">{(523 + index * 184).toLocaleString()} views&nbsp;&nbsp;·&nbsp;&nbsp;{40 + index * 11} credits</p></div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-3 py-4 sm:px-5 sm:py-6 lg:px-6">
        <div className="mx-auto max-w-[1600px] overflow-hidden rounded-[24px] border border-[#ececf1] bg-white shadow-[0_4px_16px_rgba(26,26,46,0.04)]">
          {/* 电视机外框笼罩视频:视频铺底,边框图叠上,满宽贴合卡片左/右/上边缘 */}
          <div className="relative aspect-[1916/821]">
            {/* 视频严格限制在内屏红框内(容器 overflow-hidden 防止溢出),略盖边框黑线避免角缝 */}
            <div className="absolute overflow-hidden" style={{ top: "8.4%", bottom: "7.3%", left: "4%", right: "4.1%" }}>
              <video autoPlay muted loop playsInline src={ASSETS.seedance} className="size-full object-cover" />
            </div>
            <img src="/prototypes/homepage/tv-frame.png" alt="" aria-hidden className="pointer-events-none absolute inset-0 size-full select-none" />
          </div>

          {/* 下方信息流 */}
          <div className="p-4 pt-6 sm:p-6 lg:p-8">
            <MasonryStream items={seedanceStream} cta="Explore Seedance gallery" ctaHref="/prototypes/seedance-gallery" maxH="max-h-[1100px]" cols="columns-2 lg:columns-3" />
          </div>
        </div>
      </section>

      <section className="hidden px-3 py-4 sm:px-5 sm:py-6 lg:px-6">
        <div className="relative mx-auto flex max-w-[1600px] flex-col overflow-hidden rounded-[24px] border border-[#ececf1] bg-white sm:block sm:min-h-[390px]">
          <div className="relative order-2 h-[250px] w-full shrink-0 sm:absolute sm:inset-y-0 sm:right-0 sm:h-auto sm:w-[68%]">
            <Image src={referoAssets.visual} alt="BuzzVideo MCP integrations" fill sizes="(max-width: 640px) 100vw, 68vw" className="object-contain object-bottom sm:object-right" />
          </div>
          <div className="absolute inset-y-0 left-[34%] hidden w-[32%] bg-gradient-to-r from-white via-white/90 to-transparent sm:block" />

          <div className="relative z-10 order-1 flex max-w-[520px] flex-col justify-center p-7 sm:min-h-[390px] sm:p-10">
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-[#94e3cb] bg-[#e7fbf4] px-3 py-1 text-[11px] font-semibold text-[#0ba878]">New</span>
              <span className="rounded-full bg-[#13151d] px-3 py-1 text-[11px] font-semibold text-white">BuzzVideo MCP</span>
            </div>
            <h2 className={`${bricolageExtraBold.className} mt-7 text-[clamp(22px,2.2vw,34px)] leading-tight tracking-[-0.035em] text-[#151722] lg:whitespace-nowrap`}>Give your AI agent <span className="bg-gradient-to-r from-[#ffa73c] to-[#ff5255] bg-clip-text text-transparent">real design taste</span></h2>
            <p className="mt-6 max-w-[420px] text-[15px] leading-relaxed text-[#6a6b7b] sm:text-[17px]">Thousands of real product screens and full user flows your coding agent can search and study before it builds.</p>
            <button aria-label="Get BuzzVideo MCP" className="mt-8 w-fit transition hover:-translate-y-0.5">
              <img src="/prototypes/homepage/mcp-button.svg" alt="Get BuzzVideo MCP" className="h-12 w-auto select-none sm:h-[52px]" />
            </button>
          </div>
        </div>
      </section>

      <section className="px-3 py-4 sm:px-5 sm:py-6 lg:px-6">
        <div className="relative mx-auto min-h-[300px] max-w-[1600px] overflow-hidden rounded-[24px] border border-[#ffe0d4] bg-[#fff6f2] sm:min-h-[360px]">
          {/* 底图:透视网格房间 + 边缘内发光 */}
          <Image src={canvasAssets.grid} alt="" fill sizes="100vw" className="pointer-events-none object-cover" />
          <Image src={canvasAssets.glow} alt="" fill sizes="100vw" className="pointer-events-none object-fill" />
          {/* 前景演示流程(右侧,顶部对齐,底部溢出被裁) */}
          <div className="pointer-events-none absolute right-4 top-7 hidden w-[62%] sm:block sm:right-6 lg:right-10 xl:w-[52%]">
            <img src={canvasAssets.demo} alt="Canvas workflow demo" className="w-full select-none" />
          </div>

          <div className="relative z-10 flex min-h-[300px] max-w-[520px] flex-col justify-center p-7 sm:min-h-[360px] sm:p-10">
            <h2 className={`${bricolageExtraBold.className} text-[clamp(22px,2.2vw,34px)] leading-tight tracking-[-0.035em] text-[#151722] lg:whitespace-nowrap`}>One canvas. <span className="bg-gradient-to-r from-[#ffa73c] to-[#ff5255] bg-clip-text text-transparent">Every workflow</span>.</h2>
            <p className="mt-6 max-w-[420px] text-[15px] leading-relaxed text-[#6a6b7b] sm:text-[17px]">Moodboard and chain workflows, all on one canvas.</p>
            <button aria-label="Try Canvas" className="mt-8 w-fit transition hover:-translate-y-0.5">
              <img src="/prototypes/homepage/canvas-button.svg" alt="Try Canvas" className="h-12 w-auto select-none sm:h-[52px]" />
            </button>
            <p className="mt-2.5 text-[13px] leading-[1.4] text-[#68686d]">Start free. 500 free credits on sign-up, no credit card required.</p>
          </div>
        </div>
      </section>

      <section className="hidden px-3 py-14 sm:px-5 lg:px-6">
        <div className="mx-auto grid max-w-[1600px] overflow-hidden rounded-2xl bg-[linear-gradient(110deg,#fff2df_0%,#ffe2d1_52%,#fff8f4_100%)] md:grid-cols-[.9fr_1.1fr]">
          <div className="flex min-h-[290px] flex-col justify-center p-7 sm:p-10"><span className="w-fit rounded-full border border-[#ff5e1a]/25 bg-white/50 px-2.5 py-1 text-[10px] font-bold tracking-[0.14em] text-[#ff5e1a]">PHOTODUMP</span><h2 className="mt-4 text-[clamp(32px,4vw,52px)] font-black leading-[0.9] tracking-[-0.06em]">DIFFERENT SCENES.<br />SAME STAR.</h2><p className="mt-4 max-w-sm text-[14px] leading-relaxed text-[#6a6b7b]">Build your character. One click does the rest.</p><div className="mt-6"><Action>Try Photodump</Action></div></div>
          <div className="relative min-h-[290px]"><div className="absolute inset-y-5 left-[12%] w-[36%] -rotate-6 overflow-hidden rounded-xl border-4 border-white/80 shadow-2xl"><Asset src={ASSETS.creator} alt="Photodump creator" /></div><div className="absolute inset-y-5 right-[10%] w-[43%] rotate-6 overflow-hidden rounded-xl border-4 border-white/80 shadow-2xl"><Asset src={ASSETS.portrait} alt="Photodump portrait" /></div></div>
        </div>
      </section>

      <MasonryGallery
        title={<>Marketing <span className="bg-gradient-to-r from-[#ffa73c] to-[#ff5255] bg-clip-text text-transparent">Studio</span></>}
        desc="See what creators and brands are making with Marketing Studio."
        items={soulCinema}
        cta="View all of Marketing Studio"
        ctaHref="/prototypes/marketing-studio-community"
      />

      <footer className="border-t border-[#ececf1] bg-[#fbfafc] px-5 py-12 text-[#6a6b7b] lg:px-6">
        <div className="mx-auto max-w-[1600px]"><div className="grid gap-10 py-10 lg:grid-cols-[0.8fr_2fr] lg:gap-12"><h2 className={`${bricolageExtraBold.className} max-w-[16ch] text-[clamp(22px,2.2vw,34px)] font-extrabold uppercase leading-[1.05] tracking-[-0.02em] text-[#1a1a2e]`}>The ultimate AI-powered Ads Generator for Marketers &amp; Creators</h2><div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">{footerGroups.map(([title, ...items]) => <div key={title}><h3 className="text-[13px] font-bold text-[#1a1a2e]">{title}</h3><div className="mt-4 grid gap-2.5 text-[12px]">{items.map((item) => <span key={item}>{item}</span>)}</div></div>)}</div></div><div className="mt-12 flex flex-col gap-3 pt-6 text-[13px] sm:flex-row sm:items-center sm:justify-between"><span>© 2026 BuzzVideo. All rights reserved.</span><div className="flex flex-wrap gap-x-5 gap-y-2">{footerSocials.map((s) => <span key={s} className="transition hover:text-[#ff5e1a]">{s}</span>)}</div></div></div>
      </footer>
    </div>
  );
}

// Apple system font stack (project standard, see design.md)
const APPLE_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif';

// 左侧产品导航(与 starter-guide 外壳一致)
const SHELL_NAV = [
  { key: "home", label: "Home", icon: ICONS.home },
  { key: "agent", label: "Agent", icon: ICONS.agent },
  { key: "chat", label: "Chat", icon: ICONS.chat },
  { key: "workflows", label: "Workflows", icon: ICONS.workflow },
  { key: "canvas", label: "Canvas", icon: ICONS.canvas },
] as const;

// 把导航图标染成品牌橙(激活态)
const ORANGE_FILTER =
  "[filter:invert(47%)_sepia(95%)_saturate(1894%)_hue-rotate(345deg)_brightness(103%)_contrast(101%)]";

export default function HomepagePrototype() {
  const [activeNav, setActiveNav] = useState<string>("home");
  const [promoUserState, setPromoUserState] = useState<PromoUserState>("logged-out");
  const [promoOfferPreviewState, setPromoOfferPreviewState] = useState<PromoOfferPreviewState>("countdown");

  return (
    <div className="min-h-screen bg-white text-[#1a1a2e]" style={{ fontFamily: APPLE_FONT }}>
      <div className="sticky top-0 z-[60] h-[52px] overflow-x-auto border-b border-[#30313a] bg-[#1a1a2e] px-3 text-white shadow-[0_4px_14px_rgba(26,26,46,0.18)] sm:px-5">
        <div className="mx-auto flex h-full w-max min-w-full max-w-[1600px] items-center gap-3">
          <span className="shrink-0 text-[12px] font-bold tracking-[0.02em] text-white/70">卡片状态预览</span>
          <div className="flex shrink-0 items-center gap-1 rounded-xl bg-white/10 p-1" role="group" aria-label="切换促销卡片用户状态">
            {promoUserStates.map((state) => {
              const active = state.value === promoUserState;
              return (
                <button
                  key={state.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setPromoUserState(state.value)}
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
          {promoUserState === "logged-in-free" && (
            <div className="flex shrink-0 items-center gap-1 rounded-xl bg-white/10 p-1" role="group" aria-label="切换非会员优惠阶段">
              {promoOfferPreviewStates.map((state) => {
                const active = state.value === promoOfferPreviewState;
                return (
                  <button
                    key={state.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setPromoOfferPreviewState(state.value)}
                    className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold transition ${
                      active
                        ? "bg-[#ff795f] text-white shadow-[0_2px_8px_rgba(0,0,0,0.18)]"
                        : "text-white/65 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {state.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex">
        <aside className="sticky top-[52px] hidden h-[calc(100vh-52px)] w-[160px] shrink-0 self-start flex-col gap-1 border-r border-[#ececf1] bg-white px-3 py-4 lg:flex">
          <div className="mb-3 flex items-center gap-2 px-2">
            <Image src={ICONS.logo} alt="Buzz Video" width={32} height={32} className="size-8 object-contain" />
            <span className="font-extrabold tracking-tight">Buzz</span>
          </div>
          {SHELL_NAV.map((it) => {
            const active = it.key === activeNav;
            return (
              <button
                key={it.key}
                onClick={() => setActiveNav(it.key)}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  active ? "bg-[#fff3ec] text-[#ff5e1a]" : "text-[#6a6b7b] hover:bg-[#fff7f1] hover:text-[#ff5e1a]"
                }`}
              >
                <Image src={it.icon} alt="" width={18} height={18} className={`size-[18px] ${active ? ORANGE_FILTER : ""}`} />
                {it.label}
              </button>
            );
          })}
        </aside>

        <main className="min-w-0 flex-1 pb-16 lg:pb-0">
          <header className="flex items-center justify-end gap-2.5 px-4 py-3 sm:px-6">
            <span className="hidden items-center gap-1.5 rounded-full bg-[#fff3ec] px-3 py-1.5 text-xs font-bold text-[#ff5e1a] sm:flex">
              63,016 credits
            </span>
            <div className="relative">
              <button className="rounded-lg border border-[#ff5e1a]/50 bg-[#fff3ec] px-5 py-1.5 text-sm font-bold text-[#ff5e1a] transition hover:bg-[#ffe7d6]">
                Upgrade
              </button>
              <span className="pointer-events-none absolute -left-2 -top-2 rounded-md bg-gradient-to-r from-[#ff3d8b] to-[#e60f5d] px-1.5 py-0.5 text-[10px] font-extrabold uppercase leading-none tracking-wide text-white shadow-[0_2px_8px_rgba(230,15,93,0.35)]">
                30% OFF
              </span>
            </div>
            <span className="grid size-8 place-items-center rounded-full bg-[#1a1a2e] text-xs font-bold text-white">S</span>
          </header>

          <HomepageContent embedded promoUserState={promoUserState} promoOfferPreviewState={promoOfferPreviewState} />
          <MarketingAgentPromptComposer scrollReactive className="fixed bottom-5 left-1/2 z-50 w-[min(860px,calc(100vw-32px))] -translate-x-1/2 lg:left-[calc(50%+80px)]" />
        </main>
      </div>

      {/* 移动端底部 tab bar(桌面隐藏) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-1 border-t border-[#ececf1] bg-white px-2 py-1.5 lg:hidden">
        {SHELL_NAV.map((it) => {
          const active = it.key === activeNav;
          return (
            <button
              key={it.key}
              onClick={() => setActiveNav(it.key)}
              className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-semibold transition ${
                active ? "text-[#ff5e1a]" : "text-[#6a6b7b]"
              }`}
            >
              <Image src={it.icon} alt="" width={19} height={19} className={`size-[19px] ${active ? ORANGE_FILTER : ""}`} />
              {it.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
