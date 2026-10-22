"use client";

/* Hybrid Reel 上新邮件 · 排版探索:同一份文案和三张图,换三种版式对比。
   每一版都按 600px 邮件宽度、单栏、系统字体 / Georgia(邮件客户端能显示的字体)来画,方便之后落到邮件模板里 */

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";

const LOGO = "/prototypes/starter-guide/icons/buzz-video-logo.svg";
const IMG = "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-10-22";
const BANNER = `${IMG}/371544158231388160.jpg`;
const SHOT_AGENT = `${IMG}/371544158231388161.jpg`;
const SHOT_EDITOR = `${IMG}/371544157371555840.jpg`;

const COPY = {
  headline: "Turn the footage you already shot into a finished ad",
  intro:
    "Most of your ad is already on your phone — a product close-up, someone using it, a quick before-and-after. Hybrid Reel turns those clips into a ready-to-run ad and lets AI shoot only the moments you're missing. Then the new Video Editor lets you fine-tune every cut.",
  s1: {
    title: "Drop in your footage — get back a finished ad",
    text: "Hybrid Reel watches every clip, plans the cut around the beats that sell — hook, problem, proof, demo, call to action — AI-shoots only what your footage can't cover, and edits it all together with voiceover, music and subtitles.",
    button: "See how Hybrid Reel works",
  },
  s2: {
    title: "Make it yours in the Video Editor",
    text: "Click Edit in canvas and your ad opens on the timeline. Trim and reorder clips, regenerate any AI shot, rewrite a voiceover line — the subtitles follow it — switch to 1:1 or 16:9, and export in 1080p. The Video Editor works on any canvas, on every plan.",
    button: "Open the Video Editor",
  },
  features: [
    "Your real footage stays the star — AI fills only the gaps",
    "AI shots match your product, light and look",
    "Subtitles stay in sync with every voiceover line",
    "One cut, every format: 9:16, 1:1 and 16:9",
  ],
  good: [
    "Hybrid Reel is available on the Enterprise plan",
    "The Video Editor is included on every plan",
    "You see the credit cost before anything is generated",
  ],
  cta: "Get Hybrid Reel for my team",
  link: "Already on Enterprise? Open Hybrid Reel",
};

const SERIF = 'Georgia, "Times New Roman", serif';
const SANS = '-apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, sans-serif';

function Shot({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return <Image src={src} alt={alt} width={1200} height={675} className={`block w-full ${className}`} />;
}

/* ───────── A · 杂志风:白底黑字,Georgia 大标题,细线分隔,文字链 CTA ───────── */
function Editorial() {
  return (
    <div className="bg-white text-[#141414]" style={{ fontFamily: SANS }}>
      <div className="flex items-center justify-between border-b border-[#141414] px-10 py-4">
        <span className="flex items-center gap-2 text-[13px] font-bold tracking-[0.02em]">
          <Image src={LOGO} alt="BuzzVideo" width={20} height={20} /> BuzzVideo
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6b6b6b]">New release</span>
      </div>
      <div className="px-10 pb-8 pt-10">
        <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-[#ff5e1a]">Hybrid Reel + Video Editor</p>
        <h1 className="mt-4 text-[40px] leading-[1.08] tracking-[-0.01em]" style={{ fontFamily: SERIF }}>
          Turn the footage you already shot into <em>a finished ad</em>
        </h1>
      </div>
      <Shot src={BANNER} alt="Hybrid Reel" />
      <div className="px-10 py-9">
        <p className="text-[17px] leading-[1.65] text-[#2b2b2b]" style={{ fontFamily: SERIF }}>
          <span className="float-left mr-2 mt-1 text-[52px] leading-[0.8]" style={{ fontFamily: SERIF }}>M</span>
          {COPY.intro.slice(1)}
        </p>
      </div>

      {[
        { no: "01", ...COPY.s1, img: SHOT_AGENT },
        { no: "02", ...COPY.s2, img: SHOT_EDITOR },
      ].map((s) => (
        <div key={s.no} className="border-t border-[#141414]">
          <div className="flex gap-6 px-10 pb-7 pt-8">
            <span className="w-14 shrink-0 text-[44px] italic leading-none text-[#ff5e1a]" style={{ fontFamily: SERIF }}>
              {s.no}
            </span>
            <div>
              <h2 className="text-[24px] leading-[1.2]" style={{ fontFamily: SERIF }}>{s.title}</h2>
              <p className="mt-3 text-[14.5px] leading-[1.65] text-[#4a4a4a]">{s.text}</p>
              <span className="mt-4 inline-block border-b-2 border-[#141414] pb-0.5 text-[14px] font-bold">{s.button} →</span>
            </div>
          </div>
          <Shot src={s.img} alt={s.title} />
        </div>
      ))}

      <div className="border-t border-[#141414] px-10 py-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6b6b6b]">Why it works</p>
        <ul className="mt-3">
          {COPY.features.map((f) => (
            <li key={f} className="border-b border-[#e6e6e6] py-3 text-[17px] leading-[1.45]" style={{ fontFamily: SERIF }}>
              {f}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-[#141414] px-10 py-10 text-center text-white">
        <h3 className="text-[26px] leading-[1.25]" style={{ fontFamily: SERIF }}>Bring Hybrid Reel to your team</h3>
        <span className="mt-6 inline-block bg-white px-8 py-3.5 text-[14px] font-bold uppercase tracking-[0.12em] text-[#141414]">{COPY.cta}</span>
        <p className="mt-4 text-[13px] text-white/70 underline underline-offset-4">{COPY.link}</p>
      </div>
      <div className="px-10 py-7 text-[12px] leading-[1.7] text-[#6b6b6b]">
        <p>{COPY.good.join(" · ")}.</p>
        <p className="mt-3">Happy creating, The BuzzVideo Team · Questions? info@buzzvideo.ai</p>
      </div>
    </div>
  );
}

/* ───────── B · 暗调电影感:深暖黑底,和三张图同一调子,图片贴边,渐变胶囊按钮 ───────── */
const ICONS = [
  <path key="a" d="M4 6h11v12H4zM15 10l5-3v10l-5-3" />,
  <path key="b" d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />,
  <path key="c" d="M4 5h16v10H9l-5 4z" />,
  <path key="d" d="M4 4h7v16H4zM14 8h6v8h-6z" />,
];
function DarkLuxe() {
  return (
    <div className="bg-[#120d0a] text-[#f6efe8]" style={{ fontFamily: SANS }}>
      <div className="flex items-center justify-center gap-2 py-6">
        <Image src={LOGO} alt="BuzzVideo" width={24} height={24} />
        <span className="text-[16px] font-bold">BuzzVideo</span>
      </div>
      <Shot src={BANNER} alt="Hybrid Reel" />
      <div className="px-10 pb-4 pt-10 text-center">
        <span className="inline-block rounded-full border border-[#ff7a36]/50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#ff9a5c]">Now live</span>
        <h1 className="mx-auto mt-5 max-w-[480px] text-[34px] font-extrabold leading-[1.12] tracking-[-0.02em]">{COPY.headline}</h1>
        <p className="mx-auto mt-5 max-w-[470px] text-[15px] leading-[1.7] text-[#f6efe8]/70">{COPY.intro}</p>
      </div>

      {[
        { no: "01", label: "In the Agent", ...COPY.s1, img: SHOT_AGENT },
        { no: "02", label: "In the Video Editor", ...COPY.s2, img: SHOT_EDITOR },
      ].map((s) => (
        <div key={s.no} className="pt-12">
          <div className="px-10">
            <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#ff9a5c]">
              {s.no} · {s.label}
            </p>
            <h2 className="mt-3 text-[24px] font-bold leading-[1.25] tracking-[-0.01em]">{s.title}</h2>
            <p className="mt-3 text-[14.5px] leading-[1.7] text-[#f6efe8]/68">{s.text}</p>
          </div>
          <div className="mt-6 px-6">
            <Shot src={s.img} alt={s.title} className="rounded-2xl" />
          </div>
          <div className="mt-5 px-10">
            <span className="inline-block rounded-full bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-6 py-3 text-[14px] font-bold text-white">{s.button}</span>
          </div>
        </div>
      ))}

      <div className="mt-12 grid grid-cols-2 gap-3 px-6">
        {COPY.features.map((f, i) => (
          <div key={f} className="rounded-2xl bg-white/[0.06] p-5 ring-1 ring-white/10">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ff9a5c" strokeWidth="1.8" strokeLinejoin="round">
              {ICONS[i]}
            </svg>
            <p className="mt-3 text-[13.5px] leading-[1.5] text-[#f6efe8]/85">{f}</p>
          </div>
        ))}
      </div>

      <div className="mx-6 mt-10 rounded-2xl bg-gradient-to-br from-[#2a1a10] to-[#1a110c] px-8 py-9 text-center ring-1 ring-[#ff7a36]/25">
        <h3 className="text-[24px] font-extrabold tracking-[-0.01em]">Bring Hybrid Reel to your team</h3>
        <ul className="mx-auto mt-4 max-w-[400px] space-y-1.5 text-[13px] text-[#f6efe8]/65">
          {COPY.good.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
        <span className="mt-6 inline-block rounded-full bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-8 py-3.5 text-[15px] font-bold text-white shadow-[0_10px_30px_rgba(255,90,60,0.35)]">{COPY.cta} →</span>
        <p className="mt-4 text-[13px] font-semibold text-[#ff9a5c] underline underline-offset-4">{COPY.link}</p>
      </div>
      <div className="px-10 py-9 text-center text-[12px] leading-[1.7] text-[#f6efe8]/45">
        <p>Happy creating, The BuzzVideo Team</p>
        <p>Questions? info@buzzvideo.ai — we read every message.</p>
      </div>
    </div>
  );
}

/* ───────── C · 大字海报风:白底超大粗标题,流程条 Footage → Agent → Editor → Export,步骤卡 ───────── */
function Poster() {
  return (
    <div className="bg-white text-[#1a1a2e]" style={{ fontFamily: SANS }}>
      <div className="flex items-center gap-2 px-8 pt-7">
        <Image src={LOGO} alt="BuzzVideo" width={24} height={24} />
        <span className="text-[16px] font-bold">BuzzVideo</span>
      </div>
      <div className="px-8 pb-8 pt-9">
        <h1 className="text-[50px] font-black leading-[0.98] tracking-[-0.035em]">
          Shot it?
          <br />
          <span className="text-[#ff5e1a]">Ship it.</span>
        </h1>
        <p className="mt-5 max-w-[470px] text-[17px] font-semibold leading-[1.45]">{COPY.headline} — with Hybrid Reel and the new Video Editor.</p>
        <div className="mt-6 flex flex-wrap items-center gap-1.5 text-[12.5px] font-bold">
          {["Your footage", "Agent", "Video Editor", "Export"].map((step, i, a) => (
            <span key={step} className="flex items-center gap-1.5">
              <span className={`rounded-full px-3 py-1.5 ${i === a.length - 1 ? "bg-[#ff5e1a] text-white" : "bg-[#f3f1f5]"}`}>{step}</span>
              {i < a.length - 1 && <span className="text-[#b3acba]">→</span>}
            </span>
          ))}
        </div>
      </div>
      <div className="px-4">
        <Shot src={BANNER} alt="Hybrid Reel" className="rounded-3xl" />
      </div>
      <p className="px-8 pt-8 text-[15px] leading-[1.7] text-[#56505c]">{COPY.intro}</p>

      {[
        { step: "Step 1", ...COPY.s1, img: SHOT_AGENT, bg: "bg-[#fff3ec]" },
        { step: "Step 2", ...COPY.s2, img: SHOT_EDITOR, bg: "bg-[#f3f1f5]" },
      ].map((s) => (
        <div key={s.step} className={`mx-4 mt-8 overflow-hidden rounded-3xl ${s.bg}`}>
          <div className="px-6 pb-6 pt-7">
            <p className="text-[13px] font-black uppercase tracking-[0.06em] text-[#ff5e1a]">{s.step}</p>
            <h2 className="mt-2 text-[26px] font-black leading-[1.1] tracking-[-0.025em]">{s.title}</h2>
            <p className="mt-3 text-[14.5px] leading-[1.65] text-[#56505c]">{s.text}</p>
            <span className="mt-5 inline-block rounded-xl bg-[#1a1a2e] px-5 py-3 text-[14px] font-bold text-white">{s.button} →</span>
          </div>
          <Shot src={s.img} alt={s.title} />
        </div>
      ))}

      <div className="mx-4 mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-[#ececf1]">
        {COPY.features.map((f, i) => (
          <div key={f} className="bg-white p-5">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff5e1a" strokeWidth="2" strokeLinejoin="round">
              {ICONS[i]}
            </svg>
            <p className="mt-3 text-[13.5px] font-semibold leading-[1.45]">{f}</p>
          </div>
        ))}
      </div>

      <div className="px-8 pb-4 pt-10 text-center">
        <span className="block rounded-2xl bg-[#ff5e1a] py-4 text-[16px] font-black text-white">{COPY.cta} →</span>
        <p className="mt-4 text-[13px] font-bold text-[#ff5e1a] underline underline-offset-4">{COPY.link}</p>
        <p className="mt-6 text-[12px] leading-[1.7] text-[#8a8490]">{COPY.good.join(" · ")}</p>
      </div>
      <div className="mt-6 border-t border-[#f0eef2] px-8 py-7 text-[12.5px] leading-[1.7] text-[#8a8490]">
        Happy creating, The BuzzVideo Team · Questions? info@buzzvideo.ai
      </div>
    </div>
  );
}

/* ───────── D · 拼贴风:图片像照片一样歪着贴、带胶带和贴纸标签,荧光笔划重点 ───────── */
function Tape({ className }: { className: string }) {
  return <span aria-hidden className={`absolute h-6 w-20 bg-[#ffd9a8]/80 ${className}`} />;
}
function Highlight({ children }: { children: React.ReactNode }) {
  return <span className="bg-[linear-gradient(transparent_55%,#ffcf9e_55%)] px-0.5">{children}</span>;
}
function Collage() {
  return (
    <div className="overflow-hidden bg-[#fbf7f2] text-[#1a1a2e]" style={{ fontFamily: SANS }}>
      <div className="flex items-center gap-2 px-9 pt-7">
        <Image src={LOGO} alt="BuzzVideo" width={22} height={22} />
        <span className="text-[15px] font-bold">BuzzVideo</span>
      </div>
      <div className="px-9 pb-2 pt-8">
        <h1 className="text-[38px] font-black leading-[1.05] tracking-[-0.03em]">
          Turn the footage you <Highlight>already shot</Highlight> into a finished ad
        </h1>
      </div>
      <div className="relative mx-9 mb-4 mt-8 rotate-[-1.5deg] bg-white p-2.5 pb-9 shadow-[0_14px_34px_rgba(26,26,46,0.16)]">
        <Tape className="-top-3 left-1/2 -translate-x-1/2 rotate-2" />
        <Shot src={BANNER} alt="Hybrid Reel" />
        <p className="absolute bottom-3 left-4 text-[12.5px] text-[#8a8490]">Hybrid Reel, with the new Video Editor</p>
      </div>
      <p className="px-9 pt-6 text-[15.5px] leading-[1.7] text-[#3b3442]">{COPY.intro}</p>

      {[
        { no: "1", ...COPY.s1, img: SHOT_AGENT, tilt: "rotate-[1.5deg]", sticker: "Agent" },
        { no: "2", ...COPY.s2, img: SHOT_EDITOR, tilt: "rotate-[-1.2deg]", sticker: "Video Editor" },
      ].map((s) => (
        <div key={s.no} className="px-9 pt-12">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full border-2 border-[#1a1a2e] text-[18px] font-black">{s.no}</span>
            <h2 className="pt-1 text-[24px] font-black leading-[1.15] tracking-[-0.02em]">{s.title}</h2>
          </div>
          <div className={`relative mt-6 bg-white p-2.5 shadow-[0_14px_34px_rgba(26,26,46,0.14)] ${s.tilt}`}>
            <Tape className="-top-3 left-6 -rotate-6" />
            <Shot src={s.img} alt={s.title} />
            <span className="absolute -right-3 -top-4 rotate-6 rounded-full bg-[#1a1a2e] px-3.5 py-1.5 text-[12px] font-bold text-white">{s.sticker}</span>
          </div>
          <p className="mt-6 text-[14.5px] leading-[1.7] text-[#56505c]">{s.text}</p>
          <span className="mt-4 inline-block rounded-full border-2 border-[#1a1a2e] px-5 py-2.5 text-[14px] font-black">{s.button} →</span>
        </div>
      ))}

      <div className="mx-9 mt-12 border-t-2 border-[#1a1a2e]">
        {COPY.features.map((f) => (
          <p key={f} className="border-b border-[#e3dfe6] py-3.5 text-[15px] font-semibold leading-[1.45]">{f}</p>
        ))}
      </div>

      <div className="px-9 pb-10 pt-12 text-center">
        <span className="inline-block rounded-full bg-[#ff5e1a] px-8 py-4 text-[16px] font-black text-white">{COPY.cta} →</span>
        <p className="mt-4 text-[13px] font-bold underline underline-offset-4">{COPY.link}</p>
        <p className="mt-6 text-[12px] leading-[1.7] text-[#8a8490]">{COPY.good.join(" · ")}</p>
        <p className="mt-6 text-[12.5px] text-[#8a8490]">Happy creating, The BuzzVideo Team · info@buzzvideo.ai</p>
      </div>
    </div>
  );
}

/* ───────── E · 极简留白:浅灰底、全部居中、字很少,图片像产品发布页一样一张一屏 ───────── */
function Minimal() {
  return (
    <div className="bg-[#f5f5f7] text-[#1d1d1f]" style={{ fontFamily: SANS }}>
      <div className="flex justify-center pt-10">
        <Image src={LOGO} alt="BuzzVideo" width={30} height={30} />
      </div>
      <div className="px-12 pb-10 pt-12 text-center">
        <p className="text-[15px] font-semibold text-[#ff5e1a]">New</p>
        <h1 className="mt-2 text-[44px] font-semibold leading-[1.06] tracking-[-0.025em]">Hybrid Reel</h1>
        <p className="mx-auto mt-4 max-w-[400px] text-[20px] leading-[1.4] text-[#6e6e73] [text-wrap:balance]">Your footage. AI fills the gaps. One finished ad.</p>
        <div className="mt-6 flex justify-center gap-6 text-[15px] font-medium text-[#ff5e1a]">
          <span>{COPY.s1.button} ›</span>
        </div>
      </div>
      <div className="px-6">
        <Shot src={BANNER} alt="Hybrid Reel" className="rounded-[28px]" />
      </div>
      <p className="mx-auto max-w-[460px] px-6 pb-4 pt-12 text-center text-[16px] leading-[1.65] text-[#6e6e73]">{COPY.intro}</p>

      {[
        { eyebrow: "Agent", ...COPY.s1, img: SHOT_AGENT },
        { eyebrow: "Video Editor", ...COPY.s2, img: SHOT_EDITOR },
      ].map((s) => (
        <div key={s.eyebrow} className="mt-10 bg-white pb-6 pt-12 text-center">
          <p className="text-[14px] font-semibold text-[#6e6e73]">{s.eyebrow}</p>
          <h2 className="mx-auto mt-1.5 max-w-[440px] px-6 text-[30px] [text-wrap:balance] font-semibold leading-[1.12] tracking-[-0.02em]">{s.title}</h2>
          <p className="mx-auto mt-4 max-w-[440px] px-6 text-[15px] leading-[1.65] text-[#6e6e73]">{s.text}</p>
          <span className="mt-5 inline-block text-[15px] font-medium text-[#ff5e1a]">{s.button} ›</span>
          <div className="mt-8 px-6">
            <Shot src={s.img} alt={s.title} className="rounded-[22px]" />
          </div>
        </div>
      ))}

      <div className="px-12 pb-8 pt-14 text-center">
        <div className="mx-auto grid max-w-[460px] grid-cols-2 gap-x-8 gap-y-6 text-left">
          {COPY.features.map((f) => (
            <p key={f} className="border-t border-[#d2d2d7] pt-3 text-[14px] leading-[1.5] text-[#1d1d1f]">{f}</p>
          ))}
        </div>
        <span className="mt-12 inline-block rounded-full bg-[#ff5e1a] px-7 py-3 text-[15px] font-medium text-white">{COPY.cta}</span>
        <p className="mt-4 text-[14px] text-[#ff5e1a]">{COPY.link} ›</p>
        <p className="mx-auto mt-10 max-w-[420px] text-[12px] leading-[1.7] text-[#86868b]">{COPY.good.join(". ")}.</p>
        <p className="mt-4 text-[12px] text-[#86868b]">The BuzzVideo Team · info@buzzvideo.ai</p>
      </div>
    </div>
  );
}

/* ───────── F · 剪辑时间线:整封信本身就是一条时间线,左边时间码,每节是一个镜头 ───────── */
const MONO = 'SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';
function Timeline() {
  const rows = [
    { tc: "00:00", tag: "HOOK", body: <h1 className="text-[32px] font-extrabold leading-[1.1] tracking-[-0.02em]">{COPY.headline}</h1> },
    { tc: "00:03", tag: "FOOTAGE", body: <Shot src={BANNER} alt="Hybrid Reel" className="rounded-lg" /> },
    { tc: "00:06", tag: "VOICEOVER", body: <p className="text-[15px] leading-[1.7] text-white/75">{COPY.intro}</p> },
    {
      tc: "00:12",
      tag: "AI SHOT · AGENT",
      ai: true,
      body: (
        <>
          <h2 className="text-[22px] font-bold leading-[1.25]">{COPY.s1.title}</h2>
          <p className="mt-2 text-[14px] leading-[1.7] text-white/65">{COPY.s1.text}</p>
          <Shot src={SHOT_AGENT} alt={COPY.s1.title} className="mt-4 rounded-lg" />
          <span className="mt-4 inline-block rounded-md bg-[#ff5e1a] px-4 py-2.5 text-[13.5px] font-bold">{COPY.s1.button} →</span>
        </>
      ),
    },
    {
      tc: "00:20",
      tag: "EDIT · VIDEO EDITOR",
      body: (
        <>
          <h2 className="text-[22px] font-bold leading-[1.25]">{COPY.s2.title}</h2>
          <p className="mt-2 text-[14px] leading-[1.7] text-white/65">{COPY.s2.text}</p>
          <Shot src={SHOT_EDITOR} alt={COPY.s2.title} className="mt-4 rounded-lg" />
          <span className="mt-4 inline-block rounded-md bg-[#ff5e1a] px-4 py-2.5 text-[13.5px] font-bold">{COPY.s2.button} →</span>
        </>
      ),
    },
    {
      tc: "00:26",
      tag: "SUBTITLES",
      body: (
        <ul className="space-y-2">
          {COPY.features.map((f) => (
            <li key={f} className="rounded-md bg-[#ff5e1a]/15 px-3 py-2 text-[14px] font-semibold text-[#ffb98f]">{f}</li>
          ))}
        </ul>
      ),
    },
    {
      tc: "00:30",
      tag: "CALL TO ACTION",
      ai: true,
      body: (
        <>
          <span className="inline-block rounded-md bg-[#ff5e1a] px-6 py-3.5 text-[15px] font-bold">{COPY.cta} →</span>
          <p className="mt-3 text-[13px] text-white/70 underline underline-offset-4">{COPY.link}</p>
          <p className="mt-5 text-[12px] leading-[1.7] text-white/45">{COPY.good.join(" · ")}</p>
        </>
      ),
    },
  ];
  return (
    <div className="bg-[#16161d] text-white" style={{ fontFamily: SANS }}>
      <div className="flex items-center justify-between border-b border-white/10 px-7 py-5">
        <span className="flex items-center gap-2 text-[15px] font-bold">
          <Image src={LOGO} alt="BuzzVideo" width={22} height={22} /> BuzzVideo
        </span>
        <span className="flex items-center gap-2 text-[11px] text-white/55" style={{ fontFamily: MONO }}>
          <span className="size-2 rounded-full bg-[#ff3b30]" /> REC · HYBRID_REEL_v1
        </span>
      </div>
      <div className="relative px-7 py-8">
        <span aria-hidden className="absolute bottom-8 left-[88px] top-8 w-px bg-white/15" />
        {rows.map((r) => (
          <div key={r.tc} className="relative flex gap-6 pb-10 last:pb-0">
            <div className="w-[50px] shrink-0 pt-0.5 text-right text-[12px] text-white/50" style={{ fontFamily: MONO }}>
              {r.tc}
            </div>
            <span aria-hidden className={`absolute left-[57px] top-1.5 size-2.5 rounded-full ${r.ai ? "bg-[#ff5e1a] shadow-[0_0_10px_#ff5e1a]" : "bg-white/60"}`} />
            <div className="min-w-0 flex-1">
              <p className={`mb-2.5 text-[11px] tracking-[0.14em] ${r.ai ? "text-[#ff8a4c]" : "text-white/45"}`} style={{ fontFamily: MONO }}>
                {r.tag}
              </p>
              {r.body}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 px-7 py-6 text-[12px] text-white/45" style={{ fontFamily: MONO }}>
        END · Happy creating, The BuzzVideo Team · info@buzzvideo.ai
      </div>
    </div>
  );
}

/* ───────── G · 满版品牌橙:整封橙色打底,白字,图片压在白卡里,最响亮 ───────── */
function Drenched() {
  return (
    <div className="bg-[#ff5e1a] text-white" style={{ fontFamily: SANS }}>
      <div className="flex items-center gap-2 px-9 pt-7">
        <span className="grid size-8 place-items-center rounded-lg bg-white">
          <Image src={LOGO} alt="BuzzVideo" width={22} height={22} />
        </span>
        <span className="text-[15px] font-bold">BuzzVideo</span>
      </div>
      <div className="px-9 pb-9 pt-10">
        <p className="text-[13px] font-bold uppercase tracking-[0.16em] text-white/80">Hybrid Reel + Video Editor</p>
        <h1 className="mt-3 text-[46px] font-black leading-[0.98] tracking-[-0.035em]">
          Your footage.
          <br />
          AI fills the gaps.
          <br />
          <span className="text-[#1a1a2e]">One finished ad.</span>
        </h1>
      </div>
      <div className="mx-5 rounded-[26px] bg-white p-2">
        <Shot src={BANNER} alt="Hybrid Reel" className="rounded-[20px]" />
      </div>
      <p className="px-9 pt-8 text-[16px] font-medium leading-[1.65] text-white/90">{COPY.intro}</p>

      {[
        { no: "01", ...COPY.s1, img: SHOT_AGENT },
        { no: "02", ...COPY.s2, img: SHOT_EDITOR },
      ].map((s) => (
        <div key={s.no} className="mx-5 mt-9 rounded-[26px] bg-white p-2 text-[#1a1a2e]">
          <div className="px-6 pb-6 pt-6">
            <p className="text-[56px] font-black leading-none tracking-[-0.04em] text-[#ff5e1a]">{s.no}</p>
            <h2 className="mt-3 text-[24px] font-black leading-[1.15] tracking-[-0.02em]">{s.title}</h2>
            <p className="mt-3 text-[14.5px] leading-[1.65] text-[#56505c]">{s.text}</p>
            <span className="mt-5 inline-block rounded-full bg-[#1a1a2e] px-5 py-3 text-[14px] font-bold text-white">{s.button} →</span>
          </div>
          <Shot src={s.img} alt={s.title} className="rounded-[20px]" />
        </div>
      ))}

      <div className="grid grid-cols-2 gap-x-6 gap-y-5 px-9 pt-10">
        {COPY.features.map((f) => (
          <p key={f} className="border-t-2 border-white/40 pt-3 text-[14.5px] font-bold leading-[1.4]">{f}</p>
        ))}
      </div>

      <div className="px-9 pb-10 pt-12 text-center">
        <span className="block rounded-2xl bg-[#1a1a2e] py-4 text-[16px] font-black">{COPY.cta} →</span>
        <p className="mt-4 text-[13.5px] font-bold underline underline-offset-4">{COPY.link}</p>
        <p className="mt-6 text-[12px] leading-[1.7] text-white/80">{COPY.good.join(" · ")}</p>
        <p className="mt-5 text-[12.5px] text-white/80">Happy creating, The BuzzVideo Team · info@buzzvideo.ai</p>
      </div>
    </div>
  );
}

const VARIANTS = [
  { id: "editorial", name: "A · 杂志风", note: "白底黑字 + Georgia 衬线大标题，细线分隔，编号做成斜体大数字;按钮是带下划线的文字链，收尾一块黑底大按钮。克制、有品牌感。", C: Editorial },
  { id: "dark", name: "B · 暗调电影感", note: "整封深暖黑底，跟三张图同一个调子，图片几乎贴边;渐变胶囊按钮、卖点做成 2×2 玻璃小卡。最有氛围，适合偏视觉的受众。", C: DarkLuxe },
  { id: "poster", name: "C · 大字海报风", note: "超大粗体口号「Shot it? Ship it.」+ 流程条(素材 → Agent → 剪辑器 → 导出),两步做成彩色大卡片。信息最直白，适合扫读。", C: Poster },
  { id: "collage", name: "D · 拼贴风", note: "图片像照片一样歪着贴，带胶带和贴纸标签，标题里荧光笔划重点，圆圈编号 + 描边按钮。像创作者的手账,TikTok/小红书味最重。", C: Collage },
  { id: "minimal", name: "E · 极简留白", note: "浅灰底、全部居中、字号大但字很少，按钮多是「›」文字链，一节一屏。像苹果产品发布页，高级但信息密度最低。", C: Minimal },
  { id: "timeline", name: "F · 剪辑时间线", note: "整封信就是一条时间线：左边时间码 00:00–00:30,每节标成 HOOK / FOOTAGE / AI SHOT / CTA,AI 节点发橙光。和产品本身最贴，有记忆点。", C: Timeline },
  { id: "drenched", name: "G · 满版品牌橙", note: "整封品牌橙打底，白色大字三连「Your footage. AI fills the gaps. One finished ad.」,图片压在白卡里。最响亮，收件箱里一眼认出。", C: Drenched },
] as const;

export default function Page() {
  const [active, setActive] = useState<(typeof VARIANTS)[number]["id"]>("collage");
  const v = VARIANTS.find((x) => x.id === active)!;
  return (
    <div className="min-h-screen bg-[#f2f0f4] text-[#24202a]" style={{ fontFamily: SANS }}>
      {/* 演示控制条 —— 不属于邮件本身,故用中文 */}
      <div className="sticky top-0 z-30 flex h-[52px] items-center gap-4 border-b border-white/10 bg-[#141425] px-4 text-[12px] text-white">
        <Link href="/prototypes/launch-emails/hybrid-reel-launch" className="flex items-center gap-1.5 font-bold text-white/90 hover:text-white">
          <ArrowLeft className="size-3.5" /> Hybrid Reel + 剪辑器 · 正式上线
        </Link>
        <span className="text-white/35">/</span>
        <span className="text-white/70">排版探索</span>
        <div className="ml-auto flex gap-1 rounded-lg bg-white/10 p-1">
          {VARIANTS.map((x) => (
            <button
              key={x.id}
              type="button"
              onClick={() => setActive(x.id)}
              className={`rounded-md px-3 py-1.5 font-semibold transition ${active === x.id ? "bg-white text-[#141425]" : "text-white/70 hover:text-white"}`}
            >
              {x.name}
            </button>
          ))}
        </div>
      </div>
      <div className="mx-auto max-w-[600px] px-0 py-8">
        <p className="mb-5 px-4 text-[13px] leading-[1.65] text-[#56505c]">{v.note}</p>
        <div className="overflow-hidden rounded-2xl shadow-[0_10px_30px_rgba(26,26,46,0.1)]">
          <v.C />
        </div>
      </div>
    </div>
  );
}
