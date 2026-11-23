"use client";

/* 免费工具 / 公司页共用的小组件(2026-11-19)。版式跟 ../oa/kit.tsx 一套：黑底首屏 + 发光面板，浅底 #F6F6F6 教程段。
   规则：只用官方色板;不用虚线;不用原生 <select>(选项一律分段按钮)。 */

import { useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Upload } from "lucide-react";
import { go, type OnLink } from "../../site-nav/SiteNavHeader";
import { statusOf } from "../../site-nav/nav-data";
import { OA_H2, OA_WRAP, type LinkProps } from "../oa/kit";
import { recorderFormat } from "./media";

export const VERIFIED = "November 23, 2026";

export function linker(onLink: OnLink) {
  return (label: string, href: string, status = statusOf(href)): LinkProps => ({
    href,
    onClick: (e: React.MouseEvent) => {
      e.preventDefault();
      go(href, status, label, onLink);
    },
  });
}

/* 首屏：标签 + H1 + 两句答案 + 工具面板(代替提示词框) */
export function FreeHero({ chip, title, lead, children, wide = false }: { chip?: ReactNode; title: string; lead: string; children?: ReactNode; wide?: boolean }) {
  return (
    <section className="relative isolate overflow-hidden pb-16 md:pb-24">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-[-240px] -z-10 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-[#FF744D]/[0.16] blur-[120px]" />
      <div className={`${OA_WRAP} pt-10 text-center md:pt-20`}>
        {chip && <div className="flex justify-center">{chip}</div>}
        <h1 className={`mx-auto max-w-[min(1200px,94vw)] font-black uppercase leading-[0.95] tracking-[-0.03em] [text-wrap:balance] text-[clamp(40px,calc(30px+3.2vw),88px)] ${chip ? "mt-8" : ""}`}>{title}</h1>
        <p className="mx-auto mt-5 max-w-[680px] text-[16px] leading-[26px] text-white/75 [text-wrap:pretty]">{lead}</p>
      </div>
      {children && <div className={`mx-auto mt-10 px-4 sm:px-6 ${wide ? "max-w-[1240px]" : "max-w-[1080px]"}`}>{children}</div>}
    </section>
  );
}

export function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.07] px-3.5 py-1.5 text-[13px] font-semibold text-[#E8E8E8] ring-1 ring-white/10">
      <span className="size-1.5 rounded-full bg-[#FF744D]" />
      {children}
    </span>
  );
}

/* 工具面板(和 OAPromptBox 同一种发光框) */
export function ToolPanel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[24px] bg-[#0B0B0B] p-4 text-left shadow-[0_0_0_1px_rgba(255,116,77,0.55),0_0_44px_rgba(255,116,77,0.28)] sm:p-6 ${className}`}>{children}</div>;
}

/* 分段按钮(代替下拉) */
export function Seg<T extends string>({ label, options, value, onChange, disabled }: { label: string; options: { value: T; label: string; hint?: string }[]; value: T; onChange: (v: T) => void; disabled?: boolean }) {
  return (
    <div role="radiogroup" aria-label={label}>
      <p className="mb-2 text-[12.5px] font-semibold text-[#9F9F9F]">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={on}
              disabled={disabled}
              onClick={() => onChange(o.value)}
              className={`rounded-[10px] px-3 py-2 text-left text-[13px] font-semibold transition disabled:opacity-50 ${on ? "bg-white text-[#240A03]" : "bg-white/[0.07] text-[#E8E8E8] hover:bg-white/[0.12]"}`}
            >
              {o.label}
              {o.hint && <span className={`block text-[11px] font-medium ${on ? "text-[#6F6C6C]" : "text-[#9F9F9F]"}`}>{o.hint}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* 选文件：点或拖进来(实线框，不用虚线) */
export function FilePick({ accept, onFile, title, hint, compact = false }: { accept: string; onFile: (f: File) => void; title: string; hint: string; compact?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
      }}
      className={`flex flex-col items-center justify-center rounded-[18px] text-center ring-1 transition ${compact ? "px-4 py-5" : "px-6 py-14"} ${over ? "bg-[#FF744D]/[0.12] ring-[#FF744D]" : "bg-white/[0.04] ring-white/15"}`}
    >
      <input
        ref={input}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
      {!compact && (
        <span className="grid size-12 place-items-center rounded-full bg-white/[0.08] text-[#FF744D]">
          <Upload className="size-5" />
        </span>
      )}
      <button type="button" onClick={() => input.current?.click()} className={`${compact ? "" : "mt-4"} rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-5 py-2.5 text-[14.5px] font-bold text-white transition hover:brightness-105`}>
        {title}
      </button>
      <p className="mt-3 text-[13px] text-[#9F9F9F]">{hint}</p>
    </div>
  );
}

export function Progress({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div className="flex justify-between text-[12.5px] font-semibold text-[#CACACA]">
        <span>{label}</span>
        <span className="tabular-nums">{Math.round(value * 100)}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)} aria-label={label}>
        <div className="h-full rounded-full bg-gradient-to-r from-[#FFA73C] to-[#FF5255] transition-[width]" style={{ width: `${value * 100}%` }} />
      </div>
    </div>
  );
}

export const BTN = "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-5 py-3 text-[15px] font-bold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50";
export const BTN2 = "inline-flex items-center justify-center gap-2 rounded-xl bg-white/[0.08] px-4 py-2.5 text-[14px] font-semibold text-white transition hover:bg-white/15 disabled:opacity-50";

export function Note({ children }: { children: ReactNode }) {
  return <p className="mt-4 text-center text-[13px] leading-relaxed text-[#9F9F9F]">{children}</p>;
}

export function ErrorLine({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <p role="alert" className="mt-3 rounded-[12px] bg-[#FF5255]/15 px-4 py-3 text-[13.5px] font-medium text-[#FFF3EC]">
      {text}
    </p>
  );
}

/* 浅底三步教程(纯文字卡，不配假截图) */
export function HowTo({ title, steps }: { title: string; steps: { title: string; body: string }[] }) {
  return (
    <section id="how" className="scroll-mt-28 bg-[#F6F6F6] py-20 text-[#240A03] md:py-28">
      <div className={OA_WRAP}>
        <h2 className={`${OA_H2} text-center`}>{title}</h2>
        <ol className={`mt-14 grid gap-5 ${steps.length === 4 ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
          {steps.map((s, i) => (
            <li key={s.title} className="rounded-[24px] bg-white p-7 shadow-[0_20px_50px_rgba(36,10,3,0.06)]">
              <span className="grid size-10 place-items-center rounded-full bg-[#FFF3EC] text-[15px] font-black text-[#FF5255]">{i + 1}</span>
              <h3 className="mt-5 text-[18px] font-extrabold">{s.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-[#240A03]/80">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* 出处(对比 / 规格页要写来源和核实日期) */
export function Sources({ items, note }: { items: { label: string; url: string }[]; note?: string }) {
  return (
    <section className="pb-6 pt-2">
      <div className={`${OA_WRAP} text-[13px] leading-relaxed text-[#9F9F9F]`}>
        <h2 className="text-[14px] font-bold text-[#CACACA]">Sources</h2>
        <ul className="mt-2 space-y-1">
          {items.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline decoration-white/30 underline-offset-4 hover:text-white">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-3">{note ? `${note} ` : ""}Last verified {VERIFIED}.</p>
      </div>
    </section>
  );
}

export function JsonLd({ data }: { data: object[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export const faqLd = (items: { q: string; a: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map((q) => ({ "@type": "Question", name: q.q, acceptedAnswer: { "@type": "Answer", text: q.a } })),
});
export const howToLd = (name: string, steps: { title: string; body: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "HowTo",
  name,
  step: steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.title, text: s.body })),
});
export const ORG = { "@type": "Organization", name: "BuzzVideo AI", url: "https://buzzvideo.ai" };

/** 浏览器能录的视频格式(服务端渲染时为 null,水合后读真实值) */
const noop = () => () => {};
export const useRecorderFormat = () => useSyncExternalStore(noop, recorderFormat, () => null);
