"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";

const ASSET_BASE = "/legacy/2026-06-04-playad-onboarding/assets";

// ---- DATA ----
const DATA = {
  brandName: "Buzz Agent",
  url: "https://app.buzzvideo.ai/",
  defaultName: "Monica Zhou",
  palette: ["#1D1D1F", "#F7D290", "#F0B86C", "#E05A47"],
  fonts: ["Google Sans", "Roboto"],
  brandKnowledge:
    "Buzz Agent appears to be an AI-powered marketing and ad creation product within the Buzzvideo.ai ecosystem. The landing page presents a clear promise: users can go from idea to ready-to-run ads in minutes with Buzz Agent. Based on the visible messaging, the product is positioned as a marketing agent that helps transform ideas into launch-ready advertising assets quickly. The offer is framed around reducing the time and effort required to produce performant creative.",
  countries: ["United States"],
  languages: ["English"],
  categories: ["AI marketing software"],
  audience: [
    "Performance marketers who need to launch campaigns quickly",
    "Startup founders and lean growth teams",
    "Small businesses exploring AI for marketing",
  ],
  extractionTexts: ["Analyzing your website...", "Understanding brand DNA..."],
  formats: [
    { id: "feed11", label: "1:1", w: 40, h: 40 },
    { id: "feed45", label: "4:5", w: 34, h: 42 },
    { id: "carousel34", label: "3:4", w: 34, h: 44 },
    { id: "stories916", label: "9:16", w: 26, h: 46 },
    { id: "feed191", label: "16:9", w: 60, h: 34 },
  ],
  proTips: [
    { tag: "Authenticity", big: "55% Want Human", desc: "Over half of social users now trust human-made content more than AI-made, climbing above 60% for Millennials. Keep the AI speed — lose the AI look.", src: "Sprout Social · 2026" },
    { tag: "AI", big: "86% Use AI", desc: "86% of marketers now use AI for content and creative. In 2026 the gap isn't whether you use AI — it's how well. Speed is table stakes; taste is the edge.", src: "HubSpot State of Marketing · 2026" },
    { tag: "Short-form", big: "+49% Revenue", desc: "Brands using video see 49% faster revenue growth, and 31% of marketers rank short-form as their highest-ROI format. One sharp 9:16 still beats a polished anything.", src: "Sprout Social · 2026" },
    { tag: "Ad Spend", big: "$236B", desc: "Global video ad spend is projected to top $236B in 2026, with TikTok alone near $44B. The budget is chasing video — meet it with volume, not one hero film.", src: "Statista · 2026" },
    { tag: "Social Commerce", big: "$100B", desc: "US social commerce will cross $100B for the first time in 2026, up 18% year over year. Selling now happens inside the feed, not after the click.", src: "eMarketer · 2026" },
    { tag: "TikTok Shop", big: "+108%", desc: "TikTok Shop hit $15.8B in US sales in 2025, up 108% in a single year. If you sell physical product, this is the fastest-growing shelf on the internet.", src: "eMarketer · 2026" },
    { tag: "Live Shopping", big: "30% Convert", desc: "Live shopping converts at around 30% — many times a standard product page. Real-time demos plus scarcity move product.", src: "Ringly · 2026" },
    { tag: "Social Search", big: "60% Discover", desc: "More than 60% of product discovery now happens on TikTok, Instagram and YouTube — people search social before Google. Put keywords in your captions and on-screen text.", src: "Sprout Social · 2026" },
    { tag: "GEO", big: "54% → GEO", desc: "54% of US marketers plan to implement GEO (AI-search optimization) within 3–6 months. Write copy AI assistants can quote: clear claims, one intent per asset.", src: "eMarketer · 2026" },
    { tag: "Reels", big: "+30% ROI", desc: "Brands using Instagram Reels see about 30% higher ROI than other formats on the platform. Vertical, creator-style clips are the unit that pays.", src: "Sprout Social · 2026" },
    { tag: "Cadence", big: "Less, Better", desc: "In 2026 the data says post less but with more purpose — saturated feeds reward a few strong, serialized pieces over daily filler. If a post would vanish unnoticed, don't ship it.", src: "Sprout Social / Hootsuite · 2026" },
    { tag: "Mobile", big: "91% Phone", desc: "91% of social commerce happens on a smartphone. Design vertical-first and assume a thumb, a small screen, and sound off.", src: "Mordor Intelligence · 2026" },
  ],
  ads: [
    { id: 1, img: `${ASSET_BASE}/ad1.jpg` },
    { id: 2, img: `${ASSET_BASE}/ad2.jpg` },
    { id: 3, img: `${ASSET_BASE}/ad3.jpg` },
  ],
  plans: [
    { name: "Full Time", price: "$499", per: "/mo", features: ["Unlimited creatives", "3 ad accounts", "Email support"], featured: false },
    { name: "CMO", price: "$1799", per: "/mo", features: ["Everything in Full Time", "Dedicated strategist", "Priority generation", "Unlimited accounts"], featured: true },
  ],
};

const LOGIN_HERO_IMG = `${ASSET_BASE}/login-hero.jpg`;
const ASSET_IMGS = [
  `${ASSET_BASE}/asset-left.avif`,
  `${ASSET_BASE}/asset-center.avif`,
  `${ASSET_BASE}/asset-right.avif`,
];
const VIDEO_THUMBS = [
  `${ASSET_BASE}/video1.mp4`,
  `${ASSET_BASE}/video2.mp4`,
  `${ASSET_BASE}/video3.mp4`,
  `${ASSET_BASE}/video4.mp4`,
  `${ASSET_BASE}/video5.mp4`,
  `${ASSET_BASE}/video6.mp4`,
];

// Inline CSS (keyframes, custom utility classes, scrollbar, flow-border) that can't
// be expressed as Tailwind arbitrary values. Injected as a global <style> block.
const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Montserrat:wght@500;600&display=swap');
.playad-root { background: #F1F1F3; color: #111827; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; min-height: 100vh; }
@keyframes playadFadeIn { from { opacity: 0; } to { opacity: 1; } }
.playad-root .fade-in { animation: playadFadeIn .35s ease-out; }
@keyframes playadSpin { to { transform: rotate(360deg); } }
.playad-root .spin { animation: playadSpin 1s linear infinite; }
.playad-root .btn-grad { background-image: linear-gradient(135deg, #FFA73C 0%, #FF5255 100%); color: #fff; }
.playad-root .btn-grad:hover { opacity: .92; }
@keyframes playadShimmerText { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.playad-root .shimmer-text { background: linear-gradient(90deg, #9CA3AF 35%, #111827 50%, #9CA3AF 65%); background-size: 200% 100%; -webkit-background-clip: text; background-clip: text; color: transparent; animation: playadShimmerText 3.4s linear infinite; }
.playad-root * { scrollbar-width: thin; scrollbar-color: rgba(17,24,39,.18) transparent; }
.playad-root ::-webkit-scrollbar { width: 8px; height: 8px; }
.playad-root ::-webkit-scrollbar-track { background: transparent; }
.playad-root ::-webkit-scrollbar-thumb { background: rgba(17,24,39,.18); border-radius: 9999px; border: 2px solid transparent; background-clip: padding-box; }
.playad-root ::-webkit-scrollbar-thumb:hover { background: rgba(17,24,39,.32); background-clip: padding-box; }
@keyframes playadPulseRing { 0% { box-shadow: 0 0 0 0 rgba(255,82,85,.45); } 70% { box-shadow: 0 0 0 12px rgba(255,82,85,0); } 100% { box-shadow: 0 0 0 0 rgba(255,82,85,0); } }
.playad-root .pulse-ring { animation: playadPulseRing 1.9s ease-out infinite; }
@keyframes playadHintFloat { 0%,100% { transform: translateY(0) rotate(-4deg); } 50% { transform: translateY(-4px) rotate(-4deg); } }
.playad-root .hint-float { animation: playadHintFloat 2s ease-in-out infinite; }
@property --flowA { syntax: "<angle>"; inherits: false; initial-value: 0deg; }
@keyframes playadFlowSpin { to { --flowA: 360deg; } }
.playad-root .flow-border { position: relative; }
.playad-root .flow-border::before {
  content: ""; position: absolute; inset: 0; border-radius: inherit; padding: 2px; pointer-events: none;
  background: conic-gradient(from var(--flowA), transparent 0 58%, #FFA73C 74%, #FF5255 84%, transparent 92% 100%);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude;
  animation: playadFlowSpin 4.8s linear infinite;
}
.playad-root .flow-border:nth-child(2)::before { animation-delay: -1.6s; }
.playad-root .flow-border:nth-child(3)::before { animation-delay: -3.2s; }
@supports not (background: conic-gradient(from var(--flowA), red, blue)) {
  .playad-root .flow-border::before { display: none; }
}
`;

declare global {
  interface Window {
    __toast?: ((m: string) => void) | null;
  }
}

function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div
        className="w-full h-full flex items-center justify-center text-white font-extrabold rounded-[28%]"
        style={{ background: "linear-gradient(145deg, #F7A23B 0%, #E0492E 100%)", fontSize: size * 0.62, lineHeight: 1 }}
      >
        B
      </div>
      <svg
        className="absolute"
        style={{ width: size * 0.42, height: size * 0.42, top: -size * 0.12, right: -size * 0.12 }}
        viewBox="0 0 24 24"
        fill="#F7A23B"
      >
        <path d="M12 0c.6 5.4 2.4 7.2 12 12-9.6 4.8-11.4 6.6-12 12-.6-5.4-2.4-7.2-12-12C9.6 7.2 11.4 5.4 12 0z" />
      </svg>
    </div>
  );
}

function Logo({ size = 28 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2">
      <BrandMark size={size} />
      <span className="font-extrabold text-lg tracking-tight text-gray-900">AI Buzz Video</span>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.6 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.3 5.3C41.9 35.7 44 30.3 44 24c0-1.3-.1-2.3-.4-3.5z" />
    </svg>
  );
}

function JordanAvatar() {
  return (
    <div className="w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center shrink-0">
      <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
        <path fillRule="evenodd" clipRule="evenodd" d="M27.4314 23.0865C27.4314 20.2419 25.7419 18.2453 23.3585 17.3929C22.5004 17.0873 21.559 16.9285 20.5696 16.9285L19.2279 18.5639L11.1557 28.4007L11.2613 22.8104C11.3181 19.7644 10.2453 18.1247 7.09167 18.1507L5.15548 18.1637L14.1691 6.3469L14.1913 13.1933C14.1993 15.4519 15.383 16.8078 17.7984 16.9285C20.9955 16.9285 23.6087 14.3677 23.6087 11.2436C23.6087 8.11513 20.9955 5.55957 17.7984 5.55957H8.67188C6.78626 5.55957 5.84345 5.55957 5.25766 6.14536C4.67188 6.73114 4.67188 7.67395 4.67188 9.55957V25.2445C4.67188 27.1301 4.67188 28.0729 5.25766 28.6587C5.84345 29.2445 6.78626 29.2445 8.67188 29.2445H21.1366C24.599 29.2445 27.4314 26.4728 27.4314 23.0865Z" fill="url(#buzzAvA)" />
        <path d="M24.9326 0.650635C25.2625 3.07517 27.3071 4.95474 29.7635 4.95495C27.3074 4.95516 25.2629 6.83431 24.9326 9.25842C24.6022 6.83436 22.5576 4.95526 20.1016 4.95495C22.5579 4.95465 24.6026 3.07512 24.9326 0.650635Z" fill="url(#buzzAvB)" />
        <defs>
          <linearGradient id="buzzAvA" x1="4.67188" y1="5.55957" x2="32.3461" y2="19.4595" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFA73C" />
            <stop offset="0.966346" stopColor="#FF5255" />
          </linearGradient>
          <linearGradient id="buzzAvB" x1="20.1016" y1="0.650635" x2="31.0463" y2="7.07198" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFA73C" />
            <stop offset="0.966346" stopColor="#FF5255" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function Modal({ children, onClose, maxW = "max-w-lg" }: { children: ReactNode; onClose: () => void; maxW?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm fade-in" onClick={onClose}>
      <div className={`bg-white rounded-2xl shadow-xl border border-gray-200 w-full ${maxW} max-h-[90vh] overflow-auto`} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function Card({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-gray-200 rounded-2xl shadow-sm p-5 ${className}`}>
      {title && <h3 className="font-semibold text-gray-900 mb-3">{title}</h3>}
      {children}
    </div>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return <span className="inline-block text-sm bg-gray-100 text-gray-800 rounded-lg px-3 py-1.5 border border-gray-200">{children}</span>;
}

function AppShell({
  step,
  onRestart,
  onSkip,
  children,
}: {
  step: number;
  onRestart: () => void;
  onSkip?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen p-3 sm:p-4">
      <div className="relative border border-gray-200 rounded-3xl bg-white/40 min-h-[calc(100vh-1.5rem)] sm:min-h-[calc(100vh-2rem)]">
        {step > 0 && step < 7 && onSkip && (
          <button
            onClick={onSkip}
            className="absolute top-5 right-6 z-30 text-sm text-gray-500 hover:text-gray-900 bg-white border border-gray-200 shadow-sm hover:bg-gray-50 px-4 py-2 rounded-lg transition-all"
          >
            Skip
          </button>
        )}
        <main>{children}</main>
        {step > 0 && (
          <button
            onClick={onRestart}
            className="fixed bottom-6 left-6 z-30 text-sm text-gray-500 hover:text-gray-900 bg-white border border-gray-200 shadow-sm hover:bg-gray-50 px-3.5 py-2 rounded-lg transition-all"
          >
            Restart demo
          </button>
        )}
      </div>
    </div>
  );
}

function LoginScreen({ onNext }: { onNext: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 overflow-auto" style={{ background: "#F1F1F3" }}>
      <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden w-full max-w-4xl grid md:grid-cols-2 mx-auto">
        <div className="px-8 sm:px-12 py-12 flex flex-col items-center text-center">
          <BrandMark size={56} />
          <h2 className="mt-6 text-2xl sm:text-3xl font-extrabold text-gray-900">Welcome to AI Buzz Video</h2>
          <p className="mt-2 text-gray-400">Sign in or sign up to continue</p>

          <div className="relative w-full mt-16">
            <div className="hint-float absolute -top-10 left-1 flex items-end gap-1.5 text-[#FF5255] font-bold text-xl pointer-events-none select-none">
              <span style={{ fontFamily: "'Bradley Hand','Comic Sans MS',cursive" }}>For demo, just click here</span>
              <svg width="34" height="30" viewBox="0 0 34 30" fill="none" stroke="#FF5255" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6c10 1 17 6 19 16" />
                <path d="M14 21l8 1 1-8" />
              </svg>
            </div>
            <button
              onClick={onNext}
              className="pulse-ring w-full border-2 border-[#FF5255]/40 rounded-xl px-3 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-all"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 text-white flex items-center justify-center text-sm font-semibold shrink-0">M</div>
              <div className="flex-1 text-left leading-tight">
                <div className="font-semibold text-gray-900 text-sm">Sign in as SZ_Monica</div>
                <div className="text-xs text-gray-500">monica.zhou@presslogic.com</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
                <path d="M6 9l6 6 6-6" />
              </svg>
              <GoogleIcon />
            </button>
          </div>

          <div className="flex items-center gap-4 w-full my-6 text-gray-400 text-sm">
            <div className="flex-1 h-px bg-gray-200" /> Or <div className="flex-1 h-px bg-gray-200" />
          </div>

          <input placeholder="Enter your email address" className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-gray-400 transition-all" />

          <button onClick={onNext} className="btn-grad mt-4 w-full rounded-xl py-3 font-semibold shadow-sm transition-all">
            Continue
          </button>

          <p className="mt-6 text-xs text-gray-400 leading-relaxed">
            By clicking Continue, you agree to our <span className="underline cursor-pointer">Terms of Service</span> and <span className="underline cursor-pointer">Privacy Policy</span>.
          </p>
        </div>

        <div className="relative hidden md:block min-h-[560px] overflow-hidden">
          <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, #ECE3DC 0%, #D8C2B6 45%, #B98E7E 100%)" }} />
          {LOGIN_HERO_IMG && <img src={LOGIN_HERO_IMG} alt="" className="absolute inset-0 w-full h-full object-cover" />}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 55%)" }} />
          <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
            <span className="inline-block text-xs border border-white/50 rounded-full px-3 py-1 mb-3">Multi-Agent for Marketing</span>
            <h3 className="text-2xl font-bold tracking-wide">MARKETING AGENT</h3>
            <p className="mt-2 text-white/85 text-sm max-w-sm">Your AI marketing team — strategy, copy, visuals, and variants all-in-one</p>
            <div className="mt-5 flex gap-2">
              <span className="h-1 w-10 rounded-full bg-white" />
              <span className="h-1 w-10 rounded-full bg-white/40" />
              <span className="h-1 w-10 rounded-full bg-white/40" />
              <span className="h-1 w-10 rounded-full bg-white/40" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Typewriter({ text, speed = 18, startDelay = 220, onDone }: { text: string; speed?: number; startDelay?: number; onDone?: () => void }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let i = 0;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setN(0); // reset typing progress when the text prop changes
    let interval: ReturnType<typeof setInterval>;
    const start = setTimeout(() => {
      interval = setInterval(() => {
        i += 1;
        setN(i);
        if (i >= text.length) {
          clearInterval(interval);
          if (onDone) onDone();
        }
      }, speed);
    }, startDelay);
    return () => {
      clearTimeout(start);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);
  const done = n >= text.length;
  return (
    <span>
      {text.slice(0, n)}
      {!done && <span className="inline-block w-0.5 h-[1.05em] align-text-bottom bg-gray-700 ml-0.5 animate-pulse" />}
    </span>
  );
}

function AvatarLine({ children, className = "mb-6", muted = false }: { children: ReactNode; className?: string; muted?: boolean }) {
  return (
    <div className={"flex items-start gap-3 " + className}>
      <div className="fade-in shrink-0">
        <JordanAvatar />
      </div>
      <p className={"text-base pt-1 min-h-[1.75rem] " + (muted ? "text-gray-500" : "text-gray-900")}>{children}</p>
    </div>
  );
}

function AvatarMessage({ text, className = "mb-6", children }: { text: string; className?: string; children?: ReactNode }) {
  const [typed, setTyped] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setTyped(true), 6000);
    return () => clearTimeout(id);
  }, []);
  return (
    <>
      <AvatarLine className={className}>
        <Typewriter text={text} onDone={() => setTyped(true)} />
      </AvatarLine>
      {typed && <div className="fade-in">{children}</div>}
    </>
  );
}

function Spinner({ size = 48 }: { size?: number }) {
  return (
    <svg className="spin" width={size} height={size} viewBox="0 0 50 50">
      <defs>
        <linearGradient id="brandSpin" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFA73C" />
          <stop offset="100%" stopColor="#FF5255" />
        </linearGradient>
      </defs>
      <circle cx="25" cy="25" r="20" fill="none" stroke="url(#brandSpin)" strokeWidth="5" strokeLinecap="round" strokeDasharray="90 150" />
    </svg>
  );
}

function EntryLoading({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const id = setTimeout(onDone, 650);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center" style={{ background: "#F1F1F3" }}>
      <svg className="spin" width="56" height="56" viewBox="0 0 50 50">
        <defs>
          <linearGradient id="spinGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFA73C" />
            <stop offset="100%" stopColor="#FF5255" />
          </linearGradient>
        </defs>
        <circle cx="25" cy="25" r="20" fill="none" stroke="url(#spinGrad)" strokeWidth="5" strokeLinecap="round" strokeDasharray="90 150" />
      </svg>
    </div>
  );
}

function LoadingButton({ onClick, children, className = "", disabled = false }: { onClick: () => void; children: ReactNode; className?: string; disabled?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  if (done) return null;
  return (
    <button
      disabled={loading || disabled}
      onClick={() => {
        if (disabled) return;
        setLoading(true);
        setTimeout(() => {
          setDone(true);
          onClick();
        }, 900);
      }}
      className={"btn-grad font-semibold rounded-xl px-7 py-3 transition-all inline-flex items-center justify-center gap-2 disabled:opacity-80 disabled:cursor-not-allowed " + className}
    >
      {loading && <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white spin inline-block" />}
      {children}
    </button>
  );
}

const ROLES = [
  { e: "🛍️", t: "E-commerce / DTC brand owner" },
  { e: "🚀", t: "Founder/ Entrepreneur/ Business owner" },
  { e: "📈", t: "Performance marketer" },
  { e: "📣", t: "In-house marketer" },
  { e: "🤝", t: "Agency / Consultant" },
  { e: "💡", t: "Other" },
];

function BasicDetailsCard({ onNext }: { onNext: () => void }) {
  const [loaded, setLoaded] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [otherText, setOtherText] = useState("");
  useEffect(() => {
    const id = setTimeout(() => setLoaded(true), 1000);
    return () => clearTimeout(id);
  }, []);
  if (!loaded) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="grid md:grid-cols-3 gap-5">
          {[0, 1, 2].map((i) => (
            <div key={i}>
              <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-12 w-full bg-gray-100 rounded-xl animate-pulse" />
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-8">
          <div className="h-11 w-28 bg-gray-200 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 fade-in">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Basic details</h2>
      <div className="grid md:grid-cols-3 gap-5">
        <div>
          <label className="text-sm font-medium text-gray-700">Name</label>
          <input defaultValue={DATA.defaultName} className="mt-1.5 w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-gray-400 transition-all" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Language</label>
          <select defaultValue="English" className="mt-1.5 w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-gray-400 bg-white transition-all">
            <option>English</option>
            <option>中文</option>
            <option>Español</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Timezone</label>
          <select defaultValue="Asia/Shanghai (CST)" className="mt-1.5 w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-gray-400 bg-white transition-all">
            <option>Asia/Shanghai (CST)</option>
            <option>America/New_York (EST)</option>
            <option>Europe/London (GMT)</option>
          </select>
        </div>
      </div>

      <label className="block mt-8 text-sm font-medium text-gray-700">What best describes your role?</label>
      <div className="grid md:grid-cols-3 gap-4 mt-1.5">
        {ROLES.map((r) => {
          const on = role === r.t;
          return (
            <button
              key={r.t}
              onClick={() => setRole(r.t)}
              className={`rounded-2xl border-2 p-5 text-center transition-all ${on ? "border-[#FF7A45] bg-orange-50" : "border-gray-200 hover:bg-gray-50"}`}
            >
              <div className="text-3xl leading-none">{r.e}</div>
              <div className="mt-3 text-sm font-medium text-gray-800">{r.t}</div>
            </button>
          );
        })}
      </div>
      {role === "Other" && (
        <input autoFocus value={otherText} onChange={(e) => setOtherText(e.target.value)} placeholder="Please specify" className="mt-4 w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-gray-400 transition-all fade-in" />
      )}
      <div className="flex justify-end mt-8">
        <LoadingButton onClick={onNext} disabled={role === "Other" && !otherText.trim()}>
          Continue
        </LoadingButton>
      </div>
    </div>
  );
}

function BasicDetailsForm({ onNext }: { onNext: () => void }) {
  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <AvatarMessage text="Hi Monica! I'm Buzz, your marketing director. Let's set up your basic details.">
        <BasicDetailsCard onNext={onNext} />
      </AvatarMessage>
    </div>
  );
}

function AssetFan() {
  const slot = "w-32 h-44 rounded-2xl bg-gray-200 border border-white/20 shadow-lg overflow-hidden shrink-0";
  return (
    <div className="h-56 w-full flex items-center justify-center">
      <div className={slot + " z-0"} style={{ transform: "rotate(-8deg) translateY(8px)" }}>
        {ASSET_IMGS[0] && <img src={ASSET_IMGS[0]} alt="" className="w-full h-full object-cover" />}
      </div>
      <div className={slot + " z-10 -ml-8"} style={{ transform: "rotate(0deg) translateY(-2px)" }}>
        {ASSET_IMGS[1] && <img src={ASSET_IMGS[1]} alt="" className="w-full h-full object-cover" />}
      </div>
      <div className={slot + " z-20 -ml-8"} style={{ transform: "rotate(8deg) translateY(8px)" }}>
        {ASSET_IMGS[2] && <img src={ASSET_IMGS[2]} alt="" className="w-full h-full object-cover" />}
      </div>
    </div>
  );
}

const BRAND_DNA_COLORS = ["#C07044", "#8CA389", "#F2BA35"];

function UrlBody({ onNext }: { onNext: () => void }) {
  const [shown, setShown] = useState(0);
  const [url, setUrl] = useState("");
  const [submitted, setSubmitted] = useState(false);
  useEffect(() => {
    if (shown >= 4) return;
    const id = setTimeout(() => setShown((s) => s + 1), shown === 0 ? 120 : 480);
    return () => clearTimeout(id);
  }, [shown]);
  const cardCls = "bg-gray-50 border border-gray-200 rounded-2xl p-6 flex flex-col fade-in";
  return (
    <div>
      <div className="grid md:grid-cols-3 gap-5 mb-8 items-stretch">
        {shown > 0 && (
          <div className={cardCls}>
            <h3 className="font-bold text-gray-900 text-center mb-4">Extract brand assets</h3>
            <AssetFan />
          </div>
        )}
        {shown > 1 && (
          <div className={cardCls}>
            <h3 className="font-bold text-gray-900 text-center mb-4">Brand DNA collection</h3>
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="flex justify-center gap-3.5 mb-5">
                {BRAND_DNA_COLORS.map((c) => (
                  <div key={c} className="w-20 h-20 rounded-lg shadow-sm" style={{ background: c }} />
                ))}
              </div>
              <div className="text-center">
                <div className="text-2xl text-gray-900" style={{ fontFamily: "'Recoleta','Fraunces',Georgia,serif", fontWeight: 600 }}>Header</div>
                <div className="text-base text-gray-700 mt-1.5" style={{ fontFamily: "'Avenir','Avenir Next','Nunito Sans',sans-serif" }}>Body</div>
                <div className="text-xs text-gray-400 mt-1.5 tracking-wide" style={{ fontFamily: "'Montserrat',sans-serif" }}>Caption</div>
              </div>
            </div>
          </div>
        )}
        {shown > 2 && (
          <div className={cardCls}>
            <h3 className="font-bold text-gray-900 text-center mb-4">Pinpoint target audience</h3>
            <div className="flex-1 flex flex-col items-center justify-center gap-2 px-2 text-center">
              <div className="flex flex-wrap items-baseline justify-center gap-x-4 gap-y-1">
                <span className="text-base leading-tight" style={{ color: "#1D1D1F", fontWeight: 600 }}>Mindful Living</span>
                <span className="text-sm leading-tight" style={{ color: "#1D1D1F", fontWeight: 600 }}>Eco-Conscious</span>
              </div>
              <div className="flex flex-wrap items-baseline justify-center gap-x-4 gap-y-1">
                <span className="text-xl leading-tight" style={{ color: "#1D1D1F", fontWeight: 700 }}>Craft Brand Loyalists</span>
                <span className="text-3xl leading-tight" style={{ color: "#1D1D1F", fontWeight: 800 }}>Coffee Enthusiasts</span>
                <span className="text-xl leading-tight" style={{ color: "#1D1D1F", fontWeight: 700 }}>Home Baristas</span>
              </div>
              <div className="flex justify-center">
                <span className="text-lg leading-tight" style={{ color: "#1D1D1F", fontWeight: 700 }}>Ritual-driven Daily Consumption</span>
              </div>
            </div>
          </div>
        )}
      </div>
      {shown >= 4 && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 fade-in">
          <h2 className="text-xl font-bold text-gray-900">What&apos;s your brand?</h2>
          <p className="text-gray-500 mt-1 mb-5">Drop your URL and we&apos;ll make your first ad in less than 30 seconds.</p>
          <input value={url} onChange={(e) => setUrl(e.target.value)} disabled={submitted} placeholder="Enter URL" className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-gray-400 transition-all disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed" />
          <div className="flex justify-end mt-6">
            <LoadingButton
              onClick={() => {
                setSubmitted(true);
                onNext();
              }}
              disabled={!url.trim()}
            >
              Continue
            </LoadingButton>
          </div>
        </div>
      )}
    </div>
  );
}

function UrlInputScreen({ onNext }: { onNext: () => void }) {
  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <AvatarMessage text="Drop your website and we'll make your first ad. I can analyze your brand identity, positioning, and competitors. I do this so I can:" className="mb-8">
        <UrlBody onNext={onNext} />
      </AvatarMessage>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-800 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#FF5255] focus:ring-2 focus:ring-[#FF5255]/15 transition-all";

function TrashBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#FF5255] hover:bg-red-50 transition-all">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
        <path d="M10 11v6M14 11v6" />
      </svg>
    </button>
  );
}

const isHex = (c: string) => /^#[0-9a-fA-F]{6}$/.test(c);

function ListEditor({ items, onChange, placeholder, addLabel = "+ Add" }: { items: string[]; onChange: (v: string[]) => void; placeholder?: string; addLabel?: string }) {
  function setItem(i: number, v: string) {
    const a = [...items];
    a[i] = v;
    onChange(a);
  }
  function remove(i: number) {
    onChange(items.filter((_, x) => x !== i));
  }
  function add() {
    onChange([...items, ""]);
  }
  return (
    <div className="space-y-2.5">
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-2 border border-gray-300 rounded-xl pl-3.5 pr-2 py-1.5 focus-within:border-[#FF5255] focus-within:ring-2 focus-within:ring-[#FF5255]/15 transition-all">
          <input value={it} onChange={(e) => setItem(i, e.target.value)} placeholder={placeholder} className="flex-1 bg-transparent text-sm text-gray-900 outline-none" />
          <TrashBtn onClick={() => remove(i)} />
        </div>
      ))}
      <button onClick={add} className="w-full border-2 border-dashed border-gray-300 rounded-xl py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">
        {addLabel}
      </button>
    </div>
  );
}

type Option = { name: string; flag?: string };

const COUNTRIES: Option[] = [
  { name: "United States", flag: "🇺🇸" }, { name: "United Kingdom", flag: "🇬🇧" }, { name: "Canada", flag: "🇨🇦" },
  { name: "Australia", flag: "🇦🇺" }, { name: "Germany", flag: "🇩🇪" }, { name: "France", flag: "🇫🇷" },
  { name: "Spain", flag: "🇪🇸" }, { name: "Italy", flag: "🇮🇹" }, { name: "Netherlands", flag: "🇳🇱" },
  { name: "Sweden", flag: "🇸🇪" }, { name: "Singapore", flag: "🇸🇬" }, { name: "Japan", flag: "🇯🇵" },
  { name: "South Korea", flag: "🇰🇷" }, { name: "China", flag: "🇨🇳" }, { name: "Hong Kong", flag: "🇭🇰" },
  { name: "Taiwan", flag: "🇹🇼" }, { name: "India", flag: "🇮🇳" }, { name: "Indonesia", flag: "🇮🇩" },
  { name: "Brazil", flag: "🇧🇷" }, { name: "Mexico", flag: "🇲🇽" }, { name: "United Arab Emirates", flag: "🇦🇪" },
  { name: "New Zealand", flag: "🇳🇿" }, { name: "Ireland", flag: "🇮🇪" }, { name: "Switzerland", flag: "🇨🇭" },
];

function SearchSelectField({ items, onChange, options, placeholder }: { items: string[]; onChange: (v: string[]) => void; options: Option[]; placeholder: string }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const flagFor = (name: string) => {
    const o = options.find((x) => x.name === name);
    return o ? o.flag : "";
  };
  const avail = options.filter((o) => !items.includes(o.name) && o.name.toLowerCase().includes(q.toLowerCase().trim()));
  function add(name: string) {
    onChange([...items, name]);
    setQ("");
    setOpen(false);
  }
  function remove(name: string) {
    onChange(items.filter((x) => x !== name));
  }
  return (
    <div className="space-y-2.5">
      {items.map((it) => (
        <div key={it} className="flex items-center gap-2.5 border border-gray-300 rounded-xl pl-3.5 pr-2 py-2.5">
          {flagFor(it) && <span className="text-base leading-none">{flagFor(it)}</span>}
          <span className="flex-1 text-sm text-gray-900">{it}</span>
          <TrashBtn onClick={() => remove(it)} />
        </div>
      ))}
      <div className="relative">
        <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-gray-500 hover:bg-gray-50 transition-all">
          <span>{placeholder}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        {open && (
          <div className="absolute z-20 mt-1.5 w-full bg-white border border-gray-200 rounded-xl shadow-lg p-2">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" autoFocus className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#FF5255] mb-1.5" />
            <div className="max-h-52 overflow-auto space-y-0.5">
              {avail.length === 0 && <p className="text-sm text-gray-400 py-3 text-center">No results.</p>}
              {avail.map((o) => (
                <button key={o.name} onClick={() => add(o.name)} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 text-left text-sm text-gray-900 transition-all">
                  {o.flag && <span className="text-base leading-none">{o.flag}</span>}
                  {o.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const LANGUAGES: Option[] = [
  "English", "Spanish", "French", "German", "Italian", "Portuguese", "Dutch", "Swedish",
  "Japanese", "Korean", "Chinese (Simplified)", "Chinese (Traditional)", "Cantonese", "Hindi",
  "Indonesian", "Arabic", "Russian", "Thai", "Vietnamese", "Turkish", "Polish",
].map((n) => ({ name: n }));

const GOOGLE_FONTS = [
  "Google Sans", "Inter", "Roboto", "Open Sans", "Lato", "Montserrat", "Poppins", "Raleway",
  "Nunito", "Playfair Display", "Merriweather", "Source Sans Pro", "Oswald", "Rubik", "Work Sans",
  "DM Sans", "Manrope", "Mulish", "Quicksand", "Bebas Neue", "Josefin Sans", "Karla", "Figtree",
  "Space Grotesk", "Outfit", "Plus Jakarta Sans", "Lora", "PT Sans", "Noto Sans", "Archivo", "Libre Franklin",
];

function FontPicker({ existing, onAdd, onClose }: { existing: string[]; onAdd: (name: string) => void; onClose: () => void }) {
  const [tab, setTab] = useState<"upload" | "google">("google");
  const [q, setQ] = useState("");
  const fontFileRef = useRef<HTMLInputElement>(null);
  const list = GOOGLE_FONTS.filter((fn) => fn.toLowerCase().includes(q.toLowerCase().trim()));
  function onFontFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    const name = file.name.replace(/\.(ttf|otf|woff2?|eot)$/i, "").trim();
    if (name) onAdd(name);
    onClose();
  }
  return (
    <Modal onClose={onClose} maxW="max-w-md">
      <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-900">Add typography</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-900 text-xl leading-none">✕</button>
      </div>
      <div className="p-6">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5">
          {([["upload", "Upload"], ["google", "Google Fonts"]] as const).map(([k, lbl]) => (
            <button key={k} onClick={() => setTab(k)} className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${tab === k ? "bg-gray-900 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"}`}>
              {lbl}
            </button>
          ))}
        </div>
        {tab === "google" ? (
          <div className="h-80 flex flex-col">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search Google Fonts…" className={inputCls + " mb-2"} autoFocus />
            <p className="text-xs text-gray-400 mb-3">Popular fonts are shown by default. Search for more options.</p>
            <div className="flex-1 overflow-auto space-y-1.5 -mr-2 pr-2">
              {list.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">No fonts found.</p>}
              {list.map((fn) => {
                const added = existing.includes(fn);
                return (
                  <button
                    key={fn}
                    disabled={added}
                    onClick={() => {
                      onAdd(fn);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between border rounded-xl px-3.5 py-2.5 text-left transition-all ${added ? "border-gray-200 bg-gray-50 cursor-default" : "border-gray-200 hover:border-[#FF7A45] hover:bg-orange-50"}`}
                  >
                    <span className="text-sm text-gray-900">{fn}</span>
                    <span className={`text-xs font-medium ${added ? "text-gray-400" : "text-[#FF5255]"}`}>{added ? "Added" : "Add"}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="h-80 flex flex-col">
            <input ref={fontFileRef} type="file" accept=".ttf,.otf,.woff,.woff2" className="hidden" onChange={onFontFile} />
            <button onClick={() => fontFileRef.current?.click()} className="flex-1 w-full border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-500 hover:bg-gray-50 transition-all">
              <UploadIcon />
              <span className="text-sm font-medium">Upload font file</span>
              <span className="text-xs text-gray-400">.ttf, .otf, .woff, .woff2</span>
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

type DNA = {
  brandName: string;
  url: string;
  logos: string[];
  palette: string[];
  fonts: string[];
  brandKnowledge: string;
  countries: string[];
  languages: string[];
  categories: string[];
  audience: string[];
};

function EditBrandDNAModal({ dna, onSave, onClose }: { dna: DNA; onSave: (d: DNA) => void; onClose: () => void }) {
  const [f, setF] = useState<DNA>({
    brandName: dna.brandName,
    url: dna.url,
    logos: [...dna.logos],
    palette: [...dna.palette],
    fonts: [...dna.fonts],
    brandKnowledge: dna.brandKnowledge,
    countries: [...dna.countries],
    languages: [...dna.languages],
    categories: [...dna.categories],
    audience: [...dna.audience],
  });
  const logoRef = useRef<HTMLInputElement>(null);
  const [fontPicker, setFontPicker] = useState(false);
  function set<K extends keyof DNA>(k: K, v: DNA[K]) {
    setF((p) => ({ ...p, [k]: v }));
  }
  function onLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = [...(e.target.files || [])];
    e.target.value = "";
    files.forEach((file) => {
      const r = new FileReader();
      r.onload = () => setF((p) => (p.logos.length < 3 ? { ...p, logos: [...p.logos, r.result as string] } : p));
      r.readAsDataURL(file);
    });
  }
  function removeLogo(idx: number) {
    setF((p) => ({ ...p, logos: p.logos.filter((_, i) => i !== idx) }));
  }
  function setColor(idx: number, v: string) {
    setF((p) => {
      const palette = [...p.palette];
      palette[idx] = v;
      return { ...p, palette };
    });
  }
  function removeColor(idx: number) {
    setF((p) => ({ ...p, palette: p.palette.filter((_, i) => i !== idx) }));
  }
  function addColor() {
    setF((p) => ({ ...p, palette: [...p.palette, "#000000"] }));
  }
  function setFont(idx: number, v: string) {
    setF((p) => {
      const fonts = [...p.fonts];
      fonts[idx] = v;
      return { ...p, fonts };
    });
  }
  function removeFont(idx: number) {
    setF((p) => ({ ...p, fonts: p.fonts.filter((_, i) => i !== idx) }));
  }
  function addFontName(name: string) {
    setF((p) => (p.fonts.includes(name) ? p : { ...p, fonts: [...p.fonts, name] }));
  }
  function save() {
    onSave({
      brandName: f.brandName.trim(),
      url: f.url.trim(),
      logos: f.logos,
      palette: f.palette.filter(isHex),
      fonts: f.fonts.map((s) => s.trim()).filter(Boolean),
      brandKnowledge: f.brandKnowledge.trim(),
      countries: f.countries.map((s) => s.trim()).filter(Boolean),
      languages: f.languages.map((s) => s.trim()).filter(Boolean),
      categories: f.categories.map((s) => s.trim()).filter(Boolean),
      audience: f.audience.map((s) => s.trim()).filter(Boolean),
    });
    onClose();
  }
  const checker = "bg-[length:14px_14px] bg-[linear-gradient(45deg,#f3f4f6_25%,transparent_25%,transparent_75%,#f3f4f6_75%),linear-gradient(45deg,#f3f4f6_25%,transparent_25%,transparent_75%,#f3f4f6_75%)] bg-[position:0_0,7px_7px]";
  return (
    <Modal onClose={onClose} maxW="max-w-2xl">
      <div className="flex items-center justify-between px-7 pt-6 pb-4 border-b border-gray-200 sticky top-0 bg-white z-10">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Edit your Brand DNA</h2>
          <p className="text-sm text-gray-500 mt-0.5">Adjust any of the details Buzz extracted before generating your first ads creatives.</p>
        </div>
        <button onClick={onClose} className="w-9 h-9 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all shrink-0">✕</button>
      </div>
      <div className="px-7 py-6 space-y-5">
        <Field label="Brand name">
          <input className={inputCls} value={f.brandName} onChange={(e) => set("brandName", e.target.value)} />
        </Field>
        <Field label="Logo">
          <input ref={logoRef} type="file" accept="image/*" multiple className="hidden" onChange={onLogoUpload} />
          <div className="flex items-center gap-3 flex-wrap">
            {f.logos.map((lg, i) => (
              <div key={i} className={`group relative w-24 h-24 rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden shrink-0 ${checker}`}>
                {lg === "default" ? <BrandMark size={44} /> : <img src={lg} alt="" className="max-h-20 max-w-[85%] object-contain" />}
                <button onClick={() => removeLogo(i)} title="Remove logo" className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/55 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-all hover:bg-black/75">✕</button>
              </div>
            ))}
            {f.logos.length < 3 && (
              <button onClick={() => logoRef.current?.click()} title="Upload logo" className={`group relative w-24 h-24 rounded-xl border border-gray-200 hover:border-[#FF7A45] flex flex-col items-center justify-center gap-1.5 text-gray-500 transition-all shrink-0 overflow-hidden ${checker}`}>
                <span className="absolute inset-0 bg-white/70 group-hover:bg-white/80 transition-all" />
                <span className="relative flex flex-col items-center gap-1.5">
                  <UploadIcon />
                  <span className="text-xs font-medium">Upload</span>
                </span>
              </button>
            )}
          </div>
        </Field>
        <Field label="Brand colors">
          <div className="space-y-2.5">
            {f.palette.map((c, i) => (
              <div key={i} className="flex items-center gap-3 border border-gray-300 rounded-xl px-3 py-2">
                <span className="relative w-8 h-8 rounded-md border border-gray-200 overflow-hidden shrink-0" style={{ background: isHex(c) ? c : "#fff" }}>
                  <input type="color" value={isHex(c) ? c : "#000000"} onChange={(e) => setColor(i, e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </span>
                <input value={c} onChange={(e) => setColor(i, e.target.value)} placeholder="#000000" className="flex-1 bg-transparent text-sm text-gray-900 uppercase outline-none" />
                <TrashBtn onClick={() => removeColor(i)} />
              </div>
            ))}
            <button onClick={addColor} className="w-full border-2 border-dashed border-gray-300 rounded-xl py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">+ Add color</button>
          </div>
        </Field>
        <Field label="Typography">
          <div className="space-y-2.5">
            {f.fonts.map((ft, i) => (
              <div key={i} className="flex items-center gap-2 border border-gray-300 rounded-xl pl-3.5 pr-2 py-1.5 focus-within:border-[#FF5255] focus-within:ring-2 focus-within:ring-[#FF5255]/15 transition-all">
                <input value={ft} onChange={(e) => setFont(i, e.target.value)} placeholder="Font name" className="flex-1 bg-transparent text-sm text-gray-900 outline-none" />
                <TrashBtn onClick={() => removeFont(i)} />
              </div>
            ))}
            <button onClick={() => setFontPicker(true)} className="w-full border-2 border-dashed border-gray-300 rounded-xl py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">+ Add font</button>
          </div>
        </Field>
        <Field label="Brand knowledge">
          <textarea rows={5} className={inputCls + " resize-none"} value={f.brandKnowledge} onChange={(e) => set("brandKnowledge", e.target.value)} />
        </Field>
        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Countries">
            <SearchSelectField items={f.countries} onChange={(v) => set("countries", v)} options={COUNTRIES} placeholder="Search Country" />
          </Field>
          <Field label="Languages">
            <SearchSelectField items={f.languages} onChange={(v) => set("languages", v)} options={LANGUAGES} placeholder="Search Language" />
          </Field>
        </div>
        <Field label="Categories">
          <ListEditor items={f.categories} onChange={(v) => set("categories", v)} placeholder="Add a category" addLabel="+ Add category" />
        </Field>
        <Field label="Target audience">
          <ListEditor items={f.audience} onChange={(v) => set("audience", v)} placeholder="Add an audience segment" addLabel="+ Add audience" />
        </Field>
      </div>
      <div className="flex justify-end gap-3 px-7 py-4 border-t border-gray-200 sticky bottom-0 bg-white">
        <button onClick={onClose} className="border border-gray-300 rounded-xl px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all">Cancel</button>
        <button onClick={save} className="btn-grad rounded-xl px-6 py-2.5 text-sm font-semibold transition-all">Save changes</button>
      </div>
      {fontPicker && <FontPicker existing={f.fonts} onAdd={addFontName} onClose={() => setFontPicker(false)} />}
    </Modal>
  );
}

function BrandDNA({ onNext, active }: { onNext: () => void; active: boolean }) {
  const [phase, setPhase] = useState<"fetching" | "completed">("fetching");
  const [editing, setEditing] = useState(false);
  const [dna, setDna] = useState<DNA>({
    brandName: DATA.brandName,
    url: DATA.url,
    logos: ["default"],
    palette: DATA.palette,
    fonts: DATA.fonts,
    brandKnowledge: DATA.brandKnowledge,
    countries: [...DATA.countries],
    languages: [...DATA.languages],
    categories: [...DATA.categories],
    audience: [...DATA.audience],
  });
  const [i, setI] = useState(0);
  const [revealed, setRevealed] = useState(0);
  useEffect(() => {
    const rot = setInterval(() => setI((p) => Math.min(p + 1, DATA.extractionTexts.length - 1)), 1500);
    const done = setTimeout(() => setPhase("completed"), 4500);
    return () => {
      clearInterval(rot);
      clearTimeout(done);
    };
  }, []);
  const loading = phase === "fetching";
  useEffect(() => {
    if (loading) return;
    let n = 0;
    const iv = setInterval(() => {
      n += 1;
      setRevealed(n);
      if (n >= 9) clearInterval(iv);
    }, 200);
    return () => clearInterval(iv);
  }, [loading]);
  const R = (idx: number, node: ReactNode) => (revealed > idx ? <div className="fade-in">{node}</div> : null);
  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-6 sm:p-8 fade-in">
        <div className="flex items-center gap-3 mb-5">
          <h2 className="text-xl font-bold text-gray-900">{loading ? "Fetching your brand DNA" : "Your brand DNA"}</h2>
          {loading ? (
            <span className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full pl-1.5 pr-4 py-1 text-sm text-gray-500">
              <Spinner size={18} />
              {DATA.extractionTexts[i]}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 bg-gray-900 text-white text-sm rounded-full pl-2 pr-3 py-1 fade-in">
              <span className="w-4 h-4 rounded-full bg-white text-gray-900 flex items-center justify-center text-[10px] font-bold">✓</span>
              Completed
            </span>
          )}
          {!loading && (
            <button onClick={() => setEditing(true)} className="ml-auto fade-in inline-flex items-center gap-1.5 border border-gray-300 rounded-xl px-3.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
              Edit
            </button>
          )}
        </div>

        <Card className="mb-5">
          {loading ? (
            <p className="text-gray-800 font-semibold">{dna.url}</p>
          ) : (
            <div className="fade-in">
              <h3 className="text-2xl font-extrabold text-gray-900">{dna.brandName}</h3>
              <p className="text-gray-400 text-sm mt-1">{dna.url}</p>
            </div>
          )}
        </Card>

        {!loading && (
          <div>
            <div className="grid md:grid-cols-3 gap-5 mb-5">
              {R(
                0,
                <Card title="Logo">
                  {dna.logos.length ? (
                    <div className="flex gap-2 h-24">
                      {dna.logos.map((lg, idx) => (
                        <div key={idx} className="flex-1 rounded-xl border border-gray-100 flex items-center justify-center overflow-hidden bg-[length:16px_16px] bg-[linear-gradient(45deg,#f3f4f6_25%,transparent_25%,transparent_75%,#f3f4f6_75%),linear-gradient(45deg,#f3f4f6_25%,transparent_25%,transparent_75%,#f3f4f6_75%)] bg-[position:0_0,8px_8px]">
                          {lg === "default" ? <Logo size={28} /> : <img src={lg} alt="" className="max-h-20 max-w-[85%] object-contain" />}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-24 rounded-xl border border-gray-100 flex items-center justify-center text-xs text-gray-400">No logo</div>
                  )}
                </Card>
              )}
              {R(
                1,
                <Card title="Color">
                  <div className="flex h-24 rounded-xl overflow-hidden border border-gray-100">
                    {dna.palette.map((c, ci) => (
                      <div key={ci} className="flex-1" style={{ background: c }} />
                    ))}
                  </div>
                </Card>
              )}
              {R(
                2,
                <Card title="Typography">
                  <div className="flex gap-6 items-end h-24">
                    {dna.fonts.map((fnt) => (
                      <div key={fnt} className="text-center">
                        <div className="text-4xl text-gray-900">Aa</div>
                        <div className="text-xs text-gray-500 mt-1">{fnt}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            <div className="grid md:grid-cols-3 gap-5 mb-5">
              {revealed > 3 && (
                <div className="fade-in md:col-span-2">
                  <Card title="Brand Knowledge">
                    <p className="text-sm font-semibold text-gray-900 mb-1">Brand Overview</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{dna.brandKnowledge}</p>
                  </Card>
                </div>
              )}
              {R(
                4,
                <Card title="Assets">
                  <div className="rounded-lg overflow-hidden border border-gray-100 shadow-sm">
                    <img src={`${ASSET_BASE}/brand-asset.png`} alt="" className="w-full h-[140px] object-cover block" />
                  </div>
                </Card>
              )}
            </div>

            <div className="grid md:grid-cols-3 gap-5 mb-5">
              {R(5, <Card title="Countries"><div className="flex flex-wrap gap-2">{dna.countries.map((c) => <Chip key={c}>{c}</Chip>)}</div></Card>)}
              {R(6, <Card title="Languages"><div className="flex flex-wrap gap-2">{dna.languages.map((c) => <Chip key={c}>{c}</Chip>)}</div></Card>)}
              {R(7, <Card title="Categories"><div className="flex flex-wrap gap-2">{dna.categories.map((c) => <Chip key={c}>{c}</Chip>)}</div></Card>)}
            </div>

            {R(
              8,
              <Card title="Target Audience">
                <div className="space-y-2">
                  {dna.audience.map((a) => (
                    <p key={a} className="text-gray-600 text-sm">{a}</p>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>

      {!loading && active && revealed > 8 && (
        <div className="flex flex-col items-center gap-3 mt-6 fade-in">
          <p className="text-base text-gray-700 text-center">Your Brand DNA is ready. Get 3 ready-to-run ads in seconds.</p>
          <button onClick={onNext} className="btn-grad font-semibold rounded-xl px-7 py-3 transition-all">Generate &amp; Analyze</button>
        </div>
      )}

      {editing && <EditBrandDNAModal dna={dna} onSave={setDna} onClose={() => setEditing(false)} />}
    </div>
  );
}

function UploadIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 16V4M7 9l5-5 5 5M5 16v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}

const CHECKER = "bg-[length:14px_14px] bg-[linear-gradient(45deg,#eee_25%,transparent_25%,transparent_75%,#eee_75%),linear-gradient(45deg,#eee_25%,transparent_25%,transparent_75%,#eee_75%)] bg-[position:0_0,7px_7px]";

type FormatItem = { id: string; label: string; w: number; h: number };
type LogoItem = { id: string; kind: "mark" | "full" | "img"; src?: string };
type AssetItem = { id: string; kind: "builtin" | "img"; src?: string };

function ConfigModal({
  selectedFormats,
  setSelectedFormats,
  onSubmit,
  onClose,
}: {
  selectedFormats: string[];
  setSelectedFormats: React.Dispatch<React.SetStateAction<string[]>>;
  onSubmit: () => void;
  onClose: () => void;
}) {
  const [sub, setSub] = useState(0);
  const [logo, setLogo] = useState("mark");
  const [assets, setAssets] = useState<string[]>(["a1"]);
  const [submitting, setSubmitting] = useState(false);
  const [formatItems, setFormatItems] = useState<FormatItem[]>(DATA.formats);
  const [logoItems, setLogoItems] = useState<LogoItem[]>([
    { id: "mark", kind: "mark" },
    { id: "full", kind: "full" },
  ]);
  const [assetItems, setAssetItems] = useState<AssetItem[]>([{ id: "a1", kind: "builtin" }]);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const assetInputRef = useRef<HTMLInputElement>(null);
  const idRef = useRef(0);
  function nextId() {
    idRef.current += 1;
    return "up" + idRef.current;
  }
  function onLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const files = [...(e.target.files || [])];
    e.target.value = "";
    files.forEach((file) => {
      const r = new FileReader();
      r.onload = () => {
        const id = nextId();
        setLogoItems((prev) => [...prev, { id, kind: "img", src: r.result as string }]);
        setLogo(id);
      };
      r.readAsDataURL(file);
    });
  }
  function removeLogo(id: string) {
    setLogoItems((prev) => prev.filter((l) => l.id !== id));
    setLogo((cur) => (cur === id ? "" : cur));
  }
  function toggleAsset(key: string) {
    setAssets((a) => (a.includes(key) ? a.filter((x) => x !== key) : a.length < 3 ? [...a, key] : a));
  }
  function onAssetFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = [...(e.target.files || [])];
    e.target.value = "";
    files.forEach((file) => {
      const r = new FileReader();
      r.onload = () => {
        const id = nextId();
        setAssetItems((prev) => [...prev, { id, kind: "img", src: r.result as string }]);
        setAssets((a) => (a.includes(id) ? a : a.length < 3 ? [...a, id] : a));
      };
      r.readAsDataURL(file);
    });
  }
  function removeAsset(id: string) {
    setAssetItems((prev) => prev.filter((a) => a.id !== id));
    setAssets((a) => a.filter((x) => x !== id));
  }
  function removeFormat(id: string) {
    setFormatItems((prev) => prev.filter((ft) => ft.id !== id));
    setSelectedFormats((p) => p.filter((x) => x !== id));
  }
  function handleSubmit() {
    setSubmitting(true);
    setTimeout(() => onSubmit(), 1100);
  }
  const titles = ["Choose formats", "Choose a logo", "Add visual references"];
  const subs = [
    "Choose up to three sizes for the first batch.",
    "Use an existing logo or upload a new one. This keeps the first outputs recognizable.",
    "Select up to 3 assets so the ads can use real product and brand context.",
  ];
  function toggleFormat(id: string) {
    setSelectedFormats((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < 3 ? [...p, id] : p));
  }
  const Check = () => <span className="absolute top-2 left-2 z-10 w-5 h-5 rounded-full btn-grad flex items-center justify-center text-white text-[11px]">✓</span>;
  const DelX = ({ onDel }: { onDel: () => void }) => (
    <span
      onClick={(e) => {
        e.stopPropagation();
        onDel();
      }}
      title="Remove"
      className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-black/55 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-all hover:bg-black/75 cursor-pointer"
    >
      ✕
    </span>
  );
  return (
    <Modal onClose={onClose} maxW="max-w-3xl">
      <div className="flex flex-col">
        <div className="flex items-center justify-between px-7 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Set up your first ads</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 text-xl leading-none">✕</button>
        </div>

        <div className="px-7 py-6">
          <h3 className="text-xl font-bold text-gray-900">{titles[sub]}</h3>
          <p className="text-gray-500 mt-1 mb-6">{subs[sub]}</p>

          <div className="min-h-[290px]">
            {sub === 0 && (
              <div className="flex flex-wrap justify-center gap-4">
                {formatItems.map((ft) => {
                  const on = selectedFormats.includes(ft.id);
                  return (
                    <button
                      key={ft.id}
                      onClick={() => toggleFormat(ft.id)}
                      style={{ width: "calc((100% - 2rem) / 3)" }}
                      className={`group relative rounded-2xl border-2 p-3 transition-all ${on ? "border-[#FF7A45] bg-orange-50" : "border-gray-200 hover:bg-gray-50"}`}
                    >
                      {on && <Check />}
                      <DelX onDel={() => removeFormat(ft.id)} />
                      <div className="h-20 flex items-center justify-center">
                        <div className="bg-gray-100 border border-gray-200 rounded-md" style={{ width: ft.w, height: ft.h }} />
                      </div>
                      <div className="mt-1 text-center text-sm font-medium text-gray-800">{ft.label}</div>
                    </button>
                  );
                })}
              </div>
            )}

            {sub === 1 && (
              <div className="grid grid-cols-3 gap-4">
                <input ref={logoInputRef} type="file" accept="image/*" multiple className="hidden" onChange={onLogoFile} />
                <button onClick={() => logoInputRef.current?.click()} className="rounded-2xl border-2 border-dashed border-gray-300 hover:bg-gray-50 h-40 flex flex-col items-center justify-center gap-2 text-gray-500 transition-all">
                  <UploadIcon />
                  <span className="text-sm font-medium">Upload Logo</span>
                </button>
                {logoItems.map((lg) => {
                  const on = logo === lg.id;
                  const extra = lg.kind === "mark" ? "" : CHECKER;
                  return (
                    <button
                      key={lg.id}
                      onClick={() => setLogo(on ? "" : lg.id)}
                      style={lg.kind === "mark" ? { background: "#FFF4EC" } : undefined}
                      className={`group relative rounded-2xl border-2 h-40 flex items-center justify-center overflow-hidden transition-all ${extra} ${on ? "border-[#FF7A45]" : "border-gray-200 hover:bg-gray-50"}`}
                    >
                      {on && <Check />}
                      <DelX onDel={() => removeLogo(lg.id)} />
                      {lg.kind === "mark" ? <BrandMark size={76} /> : lg.kind === "full" ? <Logo size={26} /> : <img src={lg.src} alt="" className="max-h-28 max-w-[80%] object-contain" />}
                    </button>
                  );
                })}
              </div>
            )}

            {sub === 2 && (
              <div className="grid grid-cols-3 gap-4">
                <input ref={assetInputRef} type="file" accept="image/*" multiple className="hidden" onChange={onAssetFiles} />
                <button onClick={() => assetInputRef.current?.click()} className="rounded-2xl border-2 border-dashed border-gray-300 hover:bg-gray-50 h-36 flex flex-col items-center justify-center gap-2 text-gray-500 transition-all">
                  <UploadIcon />
                  <span className="text-sm font-medium">Upload Assets</span>
                </button>
                {assetItems.map((as) => {
                  const on = assets.includes(as.id);
                  return (
                    <button key={as.id} onClick={() => toggleAsset(as.id)} className={`group relative rounded-2xl border-2 h-36 overflow-hidden transition-all ${CHECKER} ${on ? "border-[#FF7A45]" : "border-gray-200 hover:bg-gray-50"}`}>
                      {on && <Check />}
                      <DelX onDel={() => removeAsset(as.id)} />
                      {as.kind === "builtin" ? (
                        <div className="absolute inset-3 rounded-lg" style={{ background: "radial-gradient(circle at 60% 35%, #5a3b2e, #1a1410)" }} />
                      ) : (
                        <img src={as.src} alt="" className="absolute inset-0 w-full h-full object-cover" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-7 py-4 border-t border-gray-200">
          <button onClick={() => (sub === 0 ? onClose() : setSub(sub - 1))} className="border border-gray-300 rounded-xl px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all">
            Back
          </button>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((s) => (
              <div key={s} className={`h-1.5 w-8 rounded-full transition-all ${s <= sub ? "btn-grad" : "bg-gray-200"}`} />
            ))}
          </div>
          <button
            onClick={() => (sub < 2 ? setSub(sub + 1) : handleSubmit())}
            disabled={submitting || (sub === 0 && selectedFormats.length < 1)}
            className="btn-grad font-semibold rounded-xl px-6 py-2.5 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting && (
              <svg className="spin" width="16" height="16" viewBox="0 0 50 50">
                <circle cx="25" cy="25" r="20" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeDasharray="90 150" />
              </svg>
            )}
            {sub < 2 ? "Next" : submitting ? "Submitting…" : "Submit"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function VideoTile({ src, onTry }: { src: string; onTry?: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  function onEnter() {
    const v = ref.current;
    if (!v) return;
    document.querySelectorAll("video").forEach((o) => {
      if (o !== v) o.pause();
    });
    const p = v.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  }
  function onLeave() {
    const v = ref.current;
    if (v) v.pause();
  }
  function toggleMute(e: React.MouseEvent) {
    e.stopPropagation();
    const v = ref.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }
  return (
    <div className="group relative aspect-[9/16] rounded-xl overflow-hidden bg-gray-200 border border-gray-100" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      {src && <video ref={ref} src={src} className="w-full h-full object-cover" loop muted={muted} playsInline />}
      {src && (
        <button onClick={toggleMute} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/55 hover:bg-black/70 text-white flex items-center justify-center transition-all">
          {muted ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 5 6 9H2v6h4l5 4z" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 5 6 9H2v6h4l5 4z" />
              <path d="M15.5 8.5a5 5 0 0 1 0 7" />
              <path d="M19 5a9 9 0 0 1 0 14" />
            </svg>
          )}
        </button>
      )}
      {src && (
        <div className="absolute inset-x-0 bottom-0 p-2 flex justify-center opacity-0 group-hover:opacity-100 transition-all bg-gradient-to-t from-black/50 to-transparent pt-8">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onTry) onTry();
            }}
            className="btn-grad text-xs font-semibold rounded-full px-4 py-2 shadow-lg"
          >
            Try it now
          </button>
        </div>
      )}
    </div>
  );
}

function VideoAdsCard({ className = "", message }: { className?: string; message: string }) {
  const [paywall, setPaywall] = useState(false);
  return (
    <div className={"bg-white border border-gray-200 rounded-2xl shadow-sm p-6 " + className}>
      <div className="flex items-center gap-2">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF5255" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="6" width="14" height="12" rx="2" />
          <path d="M16 10l6-3v10l-6-3" />
        </svg>
        <h2 className="font-bold text-gray-900">{message}</h2>
      </div>
      <p className="text-gray-500 text-sm mt-1.5 mb-5">Buzz can also make short-form video ads for hooks, feature demos, UGC-style concepts, and social cutdowns when you&apos;re ready to expand beyond image creatives.</p>
      <div className="grid grid-cols-6 gap-3">
        {VIDEO_THUMBS.map((src, i) => (
          <VideoTile key={i} src={src} onTry={() => setPaywall(true)} />
        ))}
      </div>
      {paywall && <UpgradeModal onClose={() => setPaywall(false)} />}
    </div>
  );
}

type UseCase = {
  title: string;
  desc: string;
  bg: string;
  icon: ReactNode;
  cat?: string;
  badge?: string;
  avatars?: string[];
};

function UseCaseCard({ uc, onRun }: { uc: UseCase; onRun: () => void }) {
  return (
    <div className="h-full bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all">
      <div className="relative h-36 flex items-center justify-center" style={{ background: uc.bg }}>
        {uc.badge && <span className="absolute top-3 right-3 text-[11px] font-semibold text-indigo-700 bg-white/90 rounded-full px-2.5 py-1 shadow-sm">{uc.badge}</span>}
        <div className="w-16 h-16 rounded-2xl bg-white/85 backdrop-blur flex items-center justify-center text-indigo-600 shadow-md">{uc.icon}</div>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-gray-900 text-[15px]">{uc.title}</h3>
        <p className="text-sm text-gray-500 mt-1 flex-1">{uc.desc}</p>
        <div className="flex items-center justify-end mt-4">
          <button onClick={onRun} className="flex items-center gap-1 text-sm font-semibold text-gray-800 hover:text-[#FF5255] transition-all">
            Run <span>›</span>
          </button>
        </div>
      </div>
    </div>
  );
}

const ALL_USE_CASES: UseCase[] = [
  { title: "Create Ads From Competitor Signals", cat: "creatives", desc: "Turn competitor ad patterns into new concepts.", bg: "linear-gradient(135deg,#EEF0FF 0%,#E6E2FF 100%)", icon: <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /><path d="M11 8v6M8 11h6" /></svg> },
  { title: "Create Short Video Ads", cat: "creatives", desc: "Produce short video ad concepts from brand assets.", badge: "Part Time Plan", bg: "linear-gradient(135deg,#EDE9FF 0%,#DCD6FF 100%)", icon: <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg> },
  { title: "Create Weekly Ad Creatives", cat: "creatives", desc: "Generate fresh ad concepts for this week.", bg: "linear-gradient(135deg,#EEF0FF 0%,#DDE3FF 100%)", icon: <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg> },
  { title: "Create From Saved Inspiration", cat: "idea", desc: "Use saved references to create a new image ad.", bg: "linear-gradient(135deg,#EFEAFF 0%,#E2DAFF 100%)", icon: <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg> },
  { title: "Brainstorm New Ad Angles", cat: "idea", desc: "Explore fresh creative directions for your brand.", bg: "linear-gradient(135deg,#EDEBFF 0%,#E0DBFF 100%)", icon: <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6M10 22h4" /><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1h6c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z" /></svg> },
  { title: "A/B Test Ad Variants", cat: "testing", desc: "Spin up variants and compare performance.", bg: "linear-gradient(135deg,#FFF4E0 0%,#FCE8C7 100%)", icon: <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3H5a2 2 0 0 0-2 2v4M15 3h4a2 2 0 0 1 2 2v4M3 15v4a2 2 0 0 0 2 2h4M21 15v4a2 2 0 0 1-2 2h-4" /></svg> },
  { title: "Creative Quality Check", cat: "testing", desc: "Score creatives before you spend on them.", bg: "linear-gradient(135deg,#FFF2DB 0%,#FBE4BE 100%)", icon: <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg> },
  { title: "Competitor Ad Report", cat: "analysis", desc: "Analyze competitors' recent ad activity.", bg: "linear-gradient(135deg,#E9E6FF 0%,#D9D4FF 100%)", icon: <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /><path d="M12 3v4M12 17v4M3 12h4M17 12h4" /></svg> },
  { title: "Daily Performance Report", cat: "analysis", desc: "Review yesterday's performance and today's priorities.", bg: "linear-gradient(135deg,#EAEFFF 0%,#DCE8FF 100%)", icon: <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M7 15l3-4 3 2 4-6" /></svg> },
  { title: "TikTok Video Campaign", cat: "launch", desc: "Create TikTok-style videos and prepare launch.", badge: "Full Time Plan", bg: "linear-gradient(135deg,#E9E6FF 0%,#D6E8FF 100%)", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M16 3c.3 2.3 2 4 4.3 4.3v3c-1.6 0-3-.5-4.3-1.3V15a6 6 0 1 1-6-6c.3 0 .7 0 1 .1v3.1A3 3 0 1 0 13 15V3z" /></svg> },
  { title: "Launch Meta Image Campaign", cat: "launch", desc: "Create image ads and prepare a Meta launch plan.", bg: "linear-gradient(135deg,#E9F0FF 0%,#DCE6FF 100%)", icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1877F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 16c2.5 0 3.5-8 6-8s3.5 8 6 8 3-6 4-6" /><path d="M4 16c-1 0-2-1-2-3s1-5 3-5 3 4 3 4" /><path d="M20 16c1 0 2-1 2-3s-1-5-3-5-3 4-3 4" /></svg> },
  { title: "Meta Reels Video Campaign", cat: "launch", desc: "Create Reels-style video ads and prepare a Meta launch plan.", badge: "Part Time Plan", bg: "linear-gradient(135deg,#EBE7FF 0%,#DCE6FF 100%)", icon: <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.5" /><path d="m10 8 6 4-6 4z" /></svg> },
  { title: "Google Keyword Ads", cat: "launch", desc: "Research keywords and plan a Google Search campaign.", badge: "Full Time Plan", bg: "linear-gradient(135deg,#EEF1FF 0%,#E2E9FF 100%)", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#34A853" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg> },
];

const UC_CATEGORIES = [
  { key: "all", label: "All", emoji: "✨" },
  { key: "creatives", label: "Creatives", emoji: "🎨" },
  { key: "idea", label: "New Idea", emoji: "💡" },
  { key: "testing", label: "Testing", emoji: "🧪" },
  { key: "analysis", label: "Analysis", emoji: "📊" },
  { key: "launch", label: "Ad Launch", emoji: "🚀" },
];

function AllUseCasesModal({ onClose, onRun }: { onClose: () => void; onRun: (uc: UseCase) => void }) {
  const [cat, setCat] = useState("all");
  const list = cat === "all" ? ALL_USE_CASES : ALL_USE_CASES.filter((u) => u.cat === cat);
  return (
    <div className="fixed inset-0 z-50 bg-[#F1F1F3] overflow-auto fade-in">
      <button onClick={onClose} className="fixed top-5 right-5 z-10 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm text-gray-500 hover:bg-gray-50 transition-all">✕</button>
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center">What do you want to do next?</h2>
        <p className="text-gray-500 text-center mt-2">Pick a use case you want Buzz to continue with.</p>
        <div className="flex flex-wrap justify-center gap-2.5 mt-7">
          {UC_CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setCat(c.key)}
              className={"inline-flex items-center gap-2 rounded-full pl-3 pr-4 py-2 text-sm font-semibold transition-all " + (cat === c.key ? "bg-white border-2 border-[#FF7A45] text-gray-900 shadow-sm" : "bg-white border-2 border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-900")}
            >
              <span className="text-base leading-none">{c.emoji}</span>
              {c.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mt-9">
          {list.map((uc, i) => (
            <UseCaseCard key={cat + i} uc={uc} onRun={() => onRun(uc)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  useEffect(() => {
    const id = setTimeout(onDone, 3000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-gray-900 text-white text-sm rounded-xl px-4 py-3 shadow-lg fade-in flex items-center gap-2.5 max-w-[90vw]">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFA73C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
      {msg}
    </div>
  );
}

const RUN_TOAST = "跳转 Agent 首页并自动粘贴 Prompt 到 Marketing Agent";

function NextSteps() {
  const [paywall, setPaywall] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [toast, setToast] = useState(false);
  const [typed, setTyped] = useState(false);
  const [shown, setShown] = useState(0);
  function runCard(uc: UseCase) {
    if (uc.badge) setPaywall(true);
    else setToast(true);
  }
  useEffect(() => {
    if (!typed) return;
    let n = 0;
    const iv = setInterval(() => {
      n += 1;
      setShown(n);
      if (n >= 4) clearInterval(iv);
    }, 320);
    return () => clearInterval(iv);
  }, [typed]);
  const ucs: UseCase[] = [
    { title: "Create Ads From Competitor Signals", desc: "Turn competitor ad patterns into new concepts.", avatars: ["alt", "buzz"], bg: "linear-gradient(135deg,#EEF0FF 0%,#E6E2FF 100%)", icon: <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /><path d="M11 8v6M8 11h6" /></svg> },
    { title: "Launch Meta Image Campaign", desc: "Create image ads and prepare a Meta launch plan.", avatars: ["buzz", "gray"], bg: "linear-gradient(135deg,#E9F0FF 0%,#DCE6FF 100%)", icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1877F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 16c2.5 0 3.5-8 6-8s3.5 8 6 8 3-6 4-6" /><path d="M4 16c-1 0-2-1-2-3s1-5 3-5 3 4 3 4" /><path d="M20 16c1 0 2-1 2-3s-1-5-3-5-3 4-3 4" /></svg> },
    { title: "TikTok Video Campaign", desc: "Create TikTok-style videos and prepare launch.", badge: "Pro Plan", avatars: ["buzz", "gray"], bg: "linear-gradient(135deg,#EDE9FF 0%,#DCD6FF 100%)", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M16 3c.3 2.3 2 4 4.3 4.3v3c-1.6 0-3-.5-4.3-1.3V15a6 6 0 1 1-6-6c.3 0 .7 0 1 .1v3.1A3 3 0 1 0 13 15V3z" /></svg> },
  ];
  return (
    <div className="mt-8">
      <AvatarLine className="mb-6">
        <Typewriter text="✅ Your onboarding setup is ready. Pick what you want to do next, and I’ll continue in chat with the brand context, competitor references, and first ads we just created." onDone={() => setTyped(true)} />
      </AvatarLine>
      {typed && (
        <div className="grid grid-cols-4 gap-5">
          {ucs.map(
            (uc, i) =>
              shown > i && (
                <div key={i} className="fade-in">
                  <UseCaseCard uc={uc} onRun={() => runCard(uc)} />
                </div>
              )
          )}
          {shown > 3 && (
            <button onClick={() => setShowAll(true)} className="fade-in bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-3 text-gray-800 hover:shadow-md hover:text-[#FF5255] transition-all">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z" />
                <path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z" />
              </svg>
              <span className="font-bold">Show All Use Cases</span>
            </button>
          )}
        </div>
      )}
      {showAll && <AllUseCasesModal onClose={() => setShowAll(false)} onRun={runCard} />}
      {paywall && <UpgradeModal onClose={() => setPaywall(false)} />}
      {toast && <Toast msg={RUN_TOAST} onDone={() => setToast(false)} />}
    </div>
  );
}

function GenerationLoading({ onDone }: { onDone: () => void }) {
  const groups = Math.ceil(DATA.proTips.length / 3);
  const [group, setGroup] = useState(() => Math.floor(Math.random() * groups));
  const [shown, setShown] = useState(0);
  const [typed, setTyped] = useState(false);
  const firstShow = useRef(true);
  useEffect(() => {
    const done = setTimeout(onDone, 10000);
    const fb = setTimeout(() => setTyped(true), 4000);
    return () => {
      clearTimeout(done);
      clearTimeout(fb);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!typed) return;
    const rot = setInterval(() => setGroup((g) => (g + 1) % groups), 9000);
    return () => clearInterval(rot);
  }, [typed, groups]);
  useEffect(() => {
    if (!typed) return;
    if (!firstShow.current) {
      setShown(3);
      return;
    }
    firstShow.current = false;
    setShown(0);
    let n = 0;
    const iv = setInterval(() => {
      n += 1;
      setShown(n);
      if (n >= 3) clearInterval(iv);
    }, 350);
    return () => clearInterval(iv);
  }, [group, typed]);
  const tips = DATA.proTips.slice(group * 3, group * 3 + 3);
  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <AvatarLine className="mb-6">
        <span className="shimmer-text font-medium">
          <Typewriter text="Buzz is creating ads... This may take a few minutes." onDone={() => setTyped(true)} />
        </span>
      </AvatarLine>
      {typed && (
        <>
          <div className="grid md:grid-cols-3 gap-5 items-stretch">
            {tips.map(
              (t, i) =>
                shown > i && (
                  <div key={group + "-" + i} className="flow-border bg-white border border-gray-200 rounded-2xl shadow-sm p-6 flex flex-col min-h-[230px] fade-in">
                    <div className="flex items-center justify-between mb-8">
                      <span className="text-xs font-bold tracking-wide text-[#FF5255]">PRO TIP</span>
                      <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2.5 py-1">{t.tag}</span>
                    </div>
                    <div className="text-3xl font-extrabold mb-3 leading-tight bg-gradient-to-br from-[#FFA73C] to-[#FF5255] bg-clip-text text-transparent">{t.big}</div>
                    <p className="text-sm text-gray-700 leading-relaxed">{t.desc}</p>
                    <p className="text-xs text-gray-400 mt-auto pt-4">{t.src}</p>
                  </div>
                )
            )}
          </div>
          {shown >= 3 && <VideoAdsCard className="mt-8 fade-in" message="While you wait, you can checkout video ads below" />}
        </>
      )}
    </div>
  );
}

type Ad = { id: number; img: string };

function AdPoster({ ad, onOpen, onGenerateVideo }: { ad: Ad; onOpen: () => void; onGenerateVideo: () => void }) {
  return (
    <div className="group relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-all bg-white">
      <button onClick={onOpen} className="block w-full">
        <img src={ad.img} alt="" className="w-full aspect-square object-cover block" />
      </button>
      <div className="absolute inset-x-0 bottom-0 p-4 flex justify-center opacity-0 group-hover:opacity-100 transition-all bg-gradient-to-t from-black/55 to-transparent pt-12 pointer-events-none">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onGenerateVideo();
          }}
          className="btn-grad rounded-full px-5 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 shadow-lg pointer-events-auto"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="6" width="14" height="12" rx="2" />
            <path d="M16 10l6-3v10l-6-3" />
          </svg>
          Generate video
        </button>
      </div>
    </div>
  );
}

function Lightbox({ ads, index, onClose }: { ads: Ad[]; index: number; onClose: () => void }) {
  const [i, setI] = useState(index);
  const prev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setI((p) => (p - 1 + ads.length) % ads.length);
  };
  const next = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setI((p) => (p + 1) % ads.length);
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const navBtn = "absolute top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-sm transition-all";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 fade-in" onClick={onClose}>
      <button onClick={onClose} className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center text-xl backdrop-blur-sm transition-all">✕</button>
      <button onClick={prev} className={navBtn + " left-5"} aria-label="Previous">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <img src={ads[i].img} alt="" onClick={(e) => e.stopPropagation()} className="max-h-[86vh] max-w-[86vw] rounded-2xl object-contain shadow-2xl" />
      <button onClick={next} className={navBtn + " right-5"} aria-label="Next">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {ads.map((_, k) => (
          <span key={k} className={"h-1.5 rounded-full transition-all " + (k === i ? "w-6 bg-white" : "w-1.5 bg-white/40")} />
        ))}
      </div>
    </div>
  );
}

function UpgradeModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-[#F1F1F3] overflow-auto fade-in">
      <button onClick={onClose} className="fixed top-5 right-5 z-10 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 text-gray-600 flex items-center justify-center text-xl transition-all">✕</button>
      <div className="min-h-full flex flex-col items-center justify-center px-6 pt-16 pb-32">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center">Upgrade to keep creating</h2>
        <p className="text-gray-500 mt-3 text-center max-w-lg">You&apos;ve used your free creatives. Pick a plan to generate unlimited ads, videos, and connect your ad accounts.</p>
        <div className="grid md:grid-cols-2 gap-6 mt-10 w-full max-w-3xl">
          {DATA.plans.map((p) => (
            <div key={p.name} className={`rounded-2xl p-7 bg-white border ${p.featured ? "border-[#FF7A45] ring-2 ring-orange-100 relative shadow-md" : "border-gray-200 shadow-sm"}`}>
              {p.featured && <span className="absolute -top-3 right-5 btn-grad text-xs font-semibold rounded-full px-3 py-1">Popular</span>}
              <h3 className="font-bold text-gray-900 text-lg">{p.name}</h3>
              <div className="mt-2">
                <span className="text-4xl font-extrabold text-gray-900">{p.price}</span>
                <span className="text-gray-500">{p.per}</span>
              </div>
              <ul className="mt-6 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="text-sm text-gray-600 flex gap-2">
                    <span className="text-[#FF5255]">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button className={`mt-7 w-full rounded-xl py-3 font-semibold transition-all ${p.featured ? "btn-grad" : "border border-gray-300 text-gray-700 hover:bg-gray-50"}`}>Choose {p.name}</button>
            </div>
          ))}
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-gray-200 px-6 sm:px-10 py-4 flex items-center justify-between">
        <div>
          <p className="font-semibold text-gray-900">Not ready to upgrade?</p>
          <p className="text-sm text-gray-500">Your current setup will keep working — upgrade anytime from Settings.</p>
        </div>
        <button
          onClick={() => {
            onClose();
            if (typeof window !== "undefined" && window.__toast) window.__toast("已返回首页,当前配置继续可用");
          }}
          className="flex items-center gap-1.5 font-semibold text-gray-900 hover:text-[#FF5255] transition-all shrink-0"
        >
          Continue without upgrading
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function Dashboard() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [paywall, setPaywall] = useState(false);
  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <AvatarLine className="mb-8">🎉 Congrats on creating your first ads! Later, you can make video ads too.</AvatarLine>
      <div className="grid grid-cols-3 gap-5">
        {DATA.ads.map((ad, i) => (
          <AdPoster key={ad.id} ad={ad} onOpen={() => setLightboxIndex(i)} onGenerateVideo={() => setPaywall(true)} />
        ))}
      </div>

      <VideoAdsCard className="mt-8" message="You can create video ads, too" />

      <NextSteps />

      {lightboxIndex !== null && <Lightbox ads={DATA.ads} index={lightboxIndex} onClose={() => setLightboxIndex(null)} />}
      {paywall && <UpgradeModal onClose={() => setPaywall(false)} />}
    </div>
  );
}

export default function PlayAdOnboardingPage() {
  const [screen, setScreen] = useState<"login" | "loading" | "app">("login");
  const [step, setStep] = useState(1);
  const [selectedFormats, setSelectedFormats] = useState<string[]>(["feed11"]);
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    window.__toast = (m: string) => setToast(m);
    return () => {
      window.__toast = null;
    };
  }, []);

  // 渐进式单页:页面变高就平滑滚动到最新内容。
  useEffect(() => {
    if (screen !== "app") return;
    let last = document.documentElement.scrollHeight;
    let raf = 0;
    function toBottom() {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
    }
    function check() {
      if (step === 5) {
        last = document.documentElement.scrollHeight;
        return;
      }
      const h = document.documentElement.scrollHeight;
      if (h > last + 4) {
        last = h;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(toBottom);
      }
    }
    const obs = new MutationObserver(check);
    obs.observe(document.body, { childList: true, subtree: true, characterData: true });
    const id = setTimeout(check, 120);
    return () => {
      obs.disconnect();
      clearTimeout(id);
      cancelAnimationFrame(raf);
    };
  }, [screen, step]);

  function restart() {
    setSelectedFormats(["feed11"]);
    setStep(1);
    setScreen("login");
    window.scrollTo({ top: 0 });
  }

  let body: ReactNode;
  if (screen === "login") {
    body = <LoginScreen onNext={() => setScreen("loading")} />;
  } else if (screen === "loading") {
    body = <EntryLoading onDone={() => setScreen("app")} />;
  } else {
    body = (
      <AppShell
        step={step}
        onRestart={restart}
        onSkip={() => {
          setStep(7);
          window.scrollTo({ top: 0 });
        }}
      >
        <div className="space-y-2">
          <div data-step="1">
            <BasicDetailsForm onNext={() => setStep(2)} />
          </div>
          {step >= 2 && (
            <div data-step="2" className="fade-in">
              <UrlInputScreen onNext={() => setStep(3)} />
            </div>
          )}
          {step >= 3 && (
            <div data-step="3" className="fade-in">
              <BrandDNA onNext={() => setStep(5)} active={step === 3} />
            </div>
          )}
          {step === 6 && (
            <div data-step="6" className="fade-in">
              <GenerationLoading onDone={() => setStep(7)} />
            </div>
          )}
          {step >= 7 && (
            <div data-step="7" className="fade-in">
              <Dashboard />
            </div>
          )}
        </div>
        {step === 5 && <ConfigModal selectedFormats={selectedFormats} setSelectedFormats={setSelectedFormats} onSubmit={() => setStep(6)} onClose={() => setStep(3)} />}
        {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
      </AppShell>
    );
  }

  return (
    <div className="playad-root">
      <style dangerouslySetInnerHTML={{ __html: STYLE }} />
      {body}
    </div>
  );
}
