"use client";

import Image from "next/image";
import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, Check, Copy, Mail, MousePointerClick } from "lucide-react";
import { CATEGORIES, LAUNCH_CATEGORIES, SAMPLE, type Block, type Template } from "./types";
import { LAUNCH_TEMPLATES, TEAM_TEMPLATES } from "./data";

const APPLE_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif';
const LOGO = "/prototypes/starter-guide/icons/buzz-video-logo.svg";

type Mode = "sample" | "vars";

const TONE_DOT: Record<Template["tone"], string> = {
  normal: "#9a94a0",
  warn: "#e8892b",
  alert: "#d92d20",
};
const TONE_LABEL: Record<Template["tone"], string> = {
  normal: "常规",
  warn: "提醒",
  alert: "告警",
};

function fill(text: string, mode: Mode) {
  if (mode === "vars") return text;
  return text.replace(/\{\{(\w+)\}\}/g, (raw, key: string) => SAMPLE[key] ?? raw);
}

/** 变量模式下把 {{x}} 标出来;两种模式都解析 **加粗**、==高亮==,以及把邮箱渲染成 mailto 链接 */
function Text({ value, mode }: { value: string; mode: Mode }) {
  const parts = value.split(/(\{\{\w+\}\}|\*\*[^*]+\*\*|==[^=]+==|[\w.+-]+@[\w-]+\.[\w.]+)/g).filter(Boolean);
  return (
    <>
      {parts.map((part, i) => {
        if (/^\{\{\w+\}\}$/.test(part)) {
          return mode === "vars" ? (
            <span key={i} className="rounded bg-[#fff1e8] px-1 font-semibold text-[#c2521f]">
              {part}
            </span>
          ) : (
            <span key={i}>{fill(part, mode)}</span>
          );
        }
        if (/^\*\*[^*]+\*\*$/.test(part)) {
          return (
            <strong key={i} className="font-bold text-[#28222e]">
              <Text value={part.slice(2, -2)} mode={mode} />
            </strong>
          );
        }
        if (/^[\w.+-]+@[\w-]+\.[\w.]+$/.test(part)) {
          return (
            <a key={i} href={`mailto:${part}`} className="underline underline-offset-2 decoration-[#c3bcc8]">
              {part}
            </a>
          );
        }
        if (/^==[^=]+==$/.test(part)) {
          return (
            <span key={i} className="bg-[#ffe9b8] px-0.5">
              <Text value={part.slice(2, -2)} mode={mode} />
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

/** 配图占位 —— 纯灰块,图还没做。要放什么图记在 data.ts 的 shot 字段里,拿到图后换成 <Image>。 */
function ShotPlaceholder({ ratio }: { ratio: string }) {
  return <div className="rounded-xl bg-[#eceaef]" style={{ aspectRatio: ratio }} />;
}

/* 点邮件里的 CTA:不直接跳走，弹一条演示提示，说明真实邮件里点了会去哪 */
type CtaHit = { label: string; text?: string };
const CtaContext = createContext<(hit: CtaHit) => void>(() => {});

function Cta({ label, text, className, suffix }: CtaHit & { className: string; suffix?: string }) {
  const hit = useContext(CtaContext);
  return (
    <button type="button" onClick={() => hit({ label, text })} className={className}>
      {label}
      {suffix}
    </button>
  );
}

/** 演示提示条:一句话「点击 XX,会怎样」,顶部居中,3.5 秒后自己收起 */
function CtaToast({ hit, onClose }: { hit: CtaHit; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [hit, onClose]);
  return (
    <div
      role="status"
      className="fixed left-1/2 top-[68px] z-40 flex w-max max-w-[min(520px,calc(100vw-32px))] -translate-x-1/2 items-center gap-2.5 rounded-xl bg-[#1a1a2e] px-4 py-3 text-[13px] leading-[1.55] text-white shadow-[0_18px_48px_rgba(26,26,46,0.35)] animate-in fade-in slide-in-from-top-2"
    >
      <MousePointerClick className="size-4 shrink-0 text-[#ff8a4c]" />
      <p>
        点击 {hit.label},{hit.text ?? "跳转到对应页面"}
      </p>
    </div>
  );
}

/* ───────── 拼贴版式(tpl.layout === "collage") ─────────
   暖白底;主视觉和小节配图做成带白边的相片,微微歪着贴、压一条胶带,小节图右上角一张贴纸;
   标题里的 ==高亮== 画成荧光笔。只用于营销邮件里的这几种块,其余块退回默认渲染 */
function Tape({ className }: { className: string }) {
  return <span aria-hidden="true" className={`absolute h-6 w-20 bg-[#ffd9a8]/80 ${className}`} />;
}

/** 荧光笔:==x== 画成下半截的橙色马克笔,其余照常 */
function Marker({ value, mode }: { value: string; mode: Mode }) {
  return (
    <>
      {value.split(/(==[^=]+==)/g).filter(Boolean).map((part, i) =>
        /^==[^=]+==$/.test(part) ? (
          <span key={i} className="bg-[linear-gradient(transparent_55%,#ffcf9e_55%)] px-0.5">
            {fill(part.slice(2, -2), mode)}
          </span>
        ) : (
          <Text key={i} value={part} mode={mode} />
        ),
      )}
    </>
  );
}

const PRINT = "relative bg-white p-2.5 shadow-[0_14px_34px_rgba(26,26,46,0.15)]";
/** 小节配图轮流往两边歪 */
const SECTION_TILT = ["rotate-[1.5deg]", "rotate-[-1.2deg]"];

function CollageBlock({ block, mode, index }: { block: Block; mode: Mode; index: number }) {
  switch (block.t) {
    case "banner":
      if (!block.image) return <EmailBlock block={block} mode={mode} />;
      return (
        <div className={`${PRINT} mt-8 rotate-[-1.5deg] ${block.caption ? "pb-9" : ""}`}>
          <Tape className="-top-3 left-1/2 -translate-x-1/2 rotate-2" />
          <Image src={block.image} alt={block.alt} width={1200} height={675} priority className="block w-full" />
          {block.caption && <p className="absolute bottom-3 left-4 text-[12.5px] text-[#8a8490]">{block.caption}</p>}
        </div>
      );
    case "h":
      return (
        <h2 className="mt-2 text-[38px] font-black leading-[1.05] tracking-[-0.03em] text-[#1a1a2e]">
          <Marker value={block.text} mode={mode} />
        </h2>
      );
    case "p":
      return (
        <p className="mt-6 text-[15.5px] leading-[1.7] text-[#3b3442]">
          <Text value={block.text} mode={mode} />
        </p>
      );
    case "section":
      return (
        <div className="mt-12">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full border-2 border-[#1a1a2e] text-[18px] font-black text-[#1a1a2e]">
              {Number(block.no) || block.no}
            </span>
            <h3 className="pt-1 text-[24px] font-black leading-[1.15] tracking-[-0.02em] text-[#1a1a2e]">
              <Text value={block.title} mode={mode} />
            </h3>
          </div>
          {block.image && (
            <div className={`${PRINT} mt-6 ${SECTION_TILT[index % 2]}`}>
              <Tape className={index % 2 ? "-top-3 left-6 -rotate-6" : "-top-3 left-6 rotate-3"} />
              <Image src={block.image} alt={block.title} width={1200} height={675} className="block w-full" />
              {block.tag && (
                <span className="absolute -right-3 -top-4 rotate-6 rounded-full bg-[#1a1a2e] px-3.5 py-1.5 text-[12px] font-bold text-white">
                  {block.tag}
                </span>
              )}
            </div>
          )}
          <p className="mt-6 text-[14.5px] leading-[1.7] text-[#56505c]">
            <Text value={block.text} mode={mode} />
          </p>
          {block.button && (
            <Cta
              label={block.button}
              suffix=" →"
              text={block.toast}
              className="mt-4 inline-flex h-11 items-center rounded-full border-2 border-[#1a1a2e] px-5 text-[14px] font-black text-[#1a1a2e] transition hover:bg-[#1a1a2e] hover:text-white"
            />
          )}
        </div>
      );
    case "features":
      return (
        <div className="mt-12 border-t-2 border-[#1a1a2e]">
          {block.items.map((item) => (
            <p key={item.text} className="border-b border-[#e3dfe6] py-3.5 text-[15px] font-semibold leading-[1.45] text-[#1a1a2e]">
              <Text value={item.text} mode={mode} />
            </p>
          ))}
        </div>
      );
    case "action":
      return (
        <div className="mt-12 text-center">
          <Cta
            label={block.button}
            text={block.toast}
            className="inline-flex h-14 items-center rounded-full bg-[#ff5e1a] px-8 text-[16px] font-black text-white transition hover:bg-[#ee5312]"
          />
          {block.link && (
            <p className="mt-4">
              <Cta
                label={block.link}
                text={block.linkToast}
                className="text-[13px] font-bold text-[#1a1a2e] underline underline-offset-4"
              />
            </p>
          )}
        </div>
      );
    case "box":
      /* 拼贴版里「须知」退成按钮下方的一行小字 */
      return (
        <p className="mt-6 text-center text-[12px] leading-[1.7] text-[#8a8490]">
          {block.items.map((item) => fill(item, mode)).join(" · ")}
        </p>
      );
    case "signoff":
      return (
        <p className="mt-8 text-center text-[12.5px] leading-[1.7] text-[#8a8490]">
          {block.line} {block.team}
        </p>
      );
    case "note":
      return (
        <p className="mt-1 text-center text-[12.5px] leading-[1.7] text-[#8a8490]">
          <Text value={block.text} mode={mode} />
        </p>
      );
    case "hr":
      return null;
    default:
      return <EmailBlock block={block} mode={mode} />;
  }
}

function EmailBlock({ block, mode }: { block: Block; mode: Mode }) {
  switch (block.t) {
    case "p":
      return (
        <p className="mt-4 text-[15px] leading-[1.65] text-[#3b3442]">
          <Text value={block.text} mode={mode} />
        </p>
      );
    case "bullets":
      return (
        <ul className="mt-4 grid gap-2">
          {block.items.map((item) => (
            <li key={item} className="flex gap-2.5 text-[15px] leading-[1.6] text-[#3b3442]">
              <Check className="mt-1 size-4 shrink-0 text-[#ee6545]" />
              <span>
                <Text value={item} mode={mode} />
              </span>
            </li>
          ))}
        </ul>
      );
    case "stat":
      return (
        <div className="mt-5 overflow-hidden rounded-xl border border-[#ececf1]">
          {block.rows.map((row, i) => (
            <div
              key={row.k}
              className={`flex items-center justify-between gap-4 px-4 py-3 text-[14px] ${i > 0 ? "border-t border-[#f2f0f4]" : ""}`}
            >
              <span className="text-[#8a8490]">{row.k}</span>
              <span className="text-right font-semibold text-[#28222e]">
                <Text value={row.v} mode={mode} />
              </span>
            </div>
          ))}
        </div>
      );
    case "cta":
      return (
        <div className="mt-6">
          <span className="inline-flex h-11 items-center rounded-xl bg-[#ff5e1a] px-6 text-[14px] font-bold text-white">
            {block.text}
          </span>
        </div>
      );
    case "callout":
      return (
        <div
          className={`mt-5 flex gap-2.5 rounded-xl px-4 py-3 text-[14px] leading-[1.55] ${
            block.tone === "warn" ? "bg-[#fff6ed] text-[#8a4b12]" : "bg-[#f6f4f7] text-[#56505c]"
          }`}
        >
          {block.tone === "warn" && <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#e8892b]" />}
          <span>
            <Text value={block.text} mode={mode} />
          </span>
        </div>
      );
    case "note":
      return (
        <p className="mt-5 text-[13px] leading-[1.6] text-[#9a94a0]">
          <Text value={block.text} mode={mode} />
        </p>
      );
    case "banner":
      if (block.image)
        return (
          <Image
            src={block.image}
            alt={block.alt}
            width={1200}
            height={675}
            priority
            className="-mx-8 -mt-7 mb-6 w-[calc(100%+4rem)] max-w-none"
          />
        );
      if (block.placeholder)
        return (
          <div className="-mx-8 -mt-7 mb-6 h-[260px] bg-[#eceaef]" />
        );
      return (
        <div className="relative -mx-8 -mt-7 mb-6 flex h-[260px] items-center justify-center overflow-hidden bg-[#0b0b18]">
          {block.bg && <Image src={block.bg} alt="" fill priority sizes="600px" className="object-cover" />}
          <div className="relative flex flex-col items-center">
            {block.label && (
              <span className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#ff5e1a] px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white">
                {block.label}
              </span>
            )}
            {block.art ? (
              /* cropTop 用来裁掉素材自带的 COMING SOON 字样 */
              <span className="block w-[76%] max-w-[400px] overflow-hidden" style={{ aspectRatio: `3 / ${2 * (1 - (block.cropTop ?? 0) / 100)}` }}>
                <Image
                  src={block.art}
                  alt={block.alt}
                  width={420}
                  height={280}
                  className="w-full object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
                  style={{ marginTop: `-${block.cropTop ?? 0}%` }}
                />
              </span>
            ) : (
              /* 没有字标素材时用纯文字排字标 */
              <span className="block px-8 text-center">
                <span className="block font-[family-name:var(--font-display)] text-[40px] font-extrabold leading-[1.05] tracking-[-0.03em] text-white drop-shadow-[0_8px_24px_rgba(0,0,0,0.55)]">
                  {block.wordmark}
                </span>
                {block.tagline && (
                  <span className="mt-2.5 block text-[12px] font-semibold uppercase tracking-[0.22em] text-white/70">
                    {block.tagline}
                  </span>
                )}
              </span>
            )}
          </div>
        </div>
      );
    case "h":
      return (
        <h3 className="mt-7 text-[20px] font-bold leading-[1.35] tracking-[-0.02em] text-[#1a1a2e]">
          <Text value={block.text} mode={mode} />
        </h3>
      );
    case "kicker":
      return (
        <p className="mt-1.5 text-[12px] font-bold uppercase tracking-[0.06em] text-[#ff5e1a]">
          <Text value={block.text} mode={mode} />
        </p>
      );
    case "features":
      return (
        <div className="mt-5 grid gap-2.5">
          {block.items.map((item) => (
            <div
              key={item.text}
              className="flex items-center gap-2.5 rounded-r-lg border-l-[3px] border-[#ff5e1a] bg-[#f7f6f9] py-3 pl-3.5 pr-4 text-[14px] leading-[1.5] text-[#3b3442]"
            >
              <span aria-hidden="true">{item.icon}</span>
              <span>
                <Text value={item.text} mode={mode} />
              </span>
            </div>
          ))}
        </div>
      );
    case "box":
      return (
        <div className="mt-6 rounded-xl bg-[#fff6f1] px-5 py-4">
          <p className="text-[15px] font-bold text-[#c2521f]">
            <Text value={block.title} mode={mode} />
          </p>
          <ul className="mt-2.5 grid gap-1.5">
            {block.items.map((item) => (
              <li key={item} className="flex gap-2 text-[14px] leading-[1.5] text-[#3b3442]">
                <span aria-hidden="true">✅</span>
                <span>
                  <Text value={item} mode={mode} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      );
    case "action":
      return (
        <div className="mt-7 text-center">
          <Cta
            label={block.button}
            text={block.toast}
            className="inline-flex h-12 items-center rounded-xl bg-[#ff5e1a] px-8 text-[15px] font-bold text-white transition hover:bg-[#ee5312]"
          />
          {block.link && (
            <p className="mt-3.5">
              <Cta
                label={block.link}
                text={block.linkToast}
                className="text-[13px] font-semibold text-[#ff5e1a] underline underline-offset-2"
              />
            </p>
          )}
        </div>
      );
    case "section":
      return (
        <div className="mt-9 border-t border-[#ececf1] pt-7">
          <p className="text-[12px] font-bold tracking-[0.18em] text-[#b3acba]">{block.no}</p>
          <h3 className="mt-2.5 text-[20px] font-bold leading-[1.3] tracking-[-0.02em] text-[#1a1a2e]">
            <Text value={block.title} mode={mode} />
          </h3>
          <p className="mt-2 text-[14px] leading-[1.6] text-[#56505c]">
            <Text value={block.text} mode={mode} />
          </p>
          {block.button && (
            <Cta
              label={block.button}
              text={block.toast}
              className="mt-4 inline-flex h-10 items-center rounded-full bg-[#ff5e1a] px-6 text-[14px] font-bold text-white transition hover:bg-[#ee5312]"
            />
          )}
          {block.image ? (
            <Image
              src={block.image}
              alt={block.title}
              width={1200}
              height={675}
              className="mt-5 w-full rounded-xl"
            />
          ) : (
            block.shot && (
              <div className="mt-5">
                <ShotPlaceholder ratio="16 / 9" />
              </div>
            )
          )}
        </div>
      );
    case "grid":
      return (
        <div className="mt-8">
          <p className="text-[15px] font-bold text-[#28222e]">{block.title}</p>
          <div className="mt-3 grid gap-x-5 gap-y-3 sm:grid-cols-2">
            {block.items.map((item) => (
              <p key={item.label} className="text-[13px] leading-[1.5] text-[#56505c]">
                <span aria-hidden="true" className="mr-1.5">
                  {item.icon}
                </span>
                <span className="font-bold text-[#28222e]">{item.label}</span> — {item.text}
              </p>
            ))}
          </div>
        </div>
      );
    case "signoff":
      return (
        <p className="mt-6 text-[15px] leading-[1.65] text-[#3b3442]">
          {block.line}
          <br />
          <br />
          <span className="font-bold text-[#28222e]">{block.team}</span>
          {block.title && (
            <>
              <br />
              {block.title}
            </>
          )}
        </p>
      );
    case "hr":
      return <hr className="mt-6 border-t border-[#ececf1]" />;
    case "ps":
      return (
        <p className="mt-6 border-t border-[#ececf1] pt-5 text-[13px] italic leading-[1.6] text-[#8a8490]">
          <Text value={block.text} mode={mode} />
        </p>
      );
    case "footer":
      /* hidden 的页脚只进「复制文案」,预览里不渲染 */
      if (block.hidden) return null;
      return (
        <div className="-mx-8 mt-7 -mb-7 border-t border-[#f2f0f4] bg-[#faf9fb] px-8 py-4 text-center text-[12px] leading-[1.6] text-[#9a94a0]">
          {block.text && <p>{block.text}</p>}
          <p className={block.text ? "mt-1" : undefined}>
            {block.links.map((link, i) => (
              <span key={link}>
                {i > 0 && " · "}
                <span className="underline underline-offset-2">{link}</span>
              </span>
            ))}
          </p>
        </div>
      );
  }
}

/** 邮件正文的纯文本形式,给「复制文案」用 */
function toPlainText(tpl: Template, mode: Mode) {
  const lines = [`Subject: ${fill(tpl.subject, mode)}`];
  if (tpl.heading) lines.push("", fill(tpl.heading, mode));
  for (const block of tpl.blocks) {
    if (block.t === "p" || block.t === "note" || block.t === "callout") lines.push("", fill(block.text, mode));
    if (block.t === "bullets") lines.push("", ...block.items.map((i) => `• ${fill(i, mode)}`));
    if (block.t === "stat") lines.push("", ...block.rows.map((r) => `${r.k}: ${fill(r.v, mode)}`));
    if (block.t === "cta") lines.push("", `[${block.text}]`);
    if (block.t === "banner") lines.push("", `[banner: ${block.alt}]`);
    /* ==高亮== 只是版式标记,导出纯文本时去掉 */
    if (block.t === "h" || block.t === "kicker" || block.t === "ps") lines.push("", fill(block.text, mode).replace(/==([^=]+)==/g, "$1"));
    if (block.t === "features") lines.push("", ...block.items.map((i) => `${i.icon} ${fill(i.text, mode)}`));
    if (block.t === "box") lines.push("", fill(block.title, mode), ...block.items.map((i) => `✅ ${fill(i, mode)}`));
    if (block.t === "section") {
      lines.push("", block.no, fill(block.title, mode), fill(block.text, mode));
      if (block.button) lines.push(`[${block.button}]${block.href ? ` ${block.href}` : ""}`);
      if (block.shot) lines.push(`[配图: ${block.shot}]`);
    }
    if (block.t === "action") lines.push("", `[${block.button}]`, ...(block.link ? [block.link] : []));
    if (block.t === "grid")
      lines.push("", block.title, ...block.items.map((i) => `${i.icon} ${i.label} — ${i.text}`));
    if (block.t === "signoff") {
      lines.push("", block.line, block.team);
      if (block.title) lines.push(block.title);
    }
    if (block.t === "hr") lines.push("", "—".repeat(24));
    if (block.t === "footer") {
      lines.push("");
      if (block.text) lines.push(block.text);
      lines.push(block.links.join(" · "));
    }
  }
  return lines.join("\n");
}


/**
 * 两个原型共用这个视图，只是侧栏装的邮件不同。
 * collection 决定左侧列什么、顶部面包屑写什么、链接指向哪条路由。
 */
type Collection = "team" | "launch";

const COLLECTIONS: Record<Collection, { title: string; base: string; templates: Template[]; categories: readonly string[] }> = {
  team: { title: "邮件模板管理", base: "/prototypes/emails", templates: TEAM_TEMPLATES, categories: CATEGORIES },
  launch: { title: "功能发布邮件", base: "/prototypes/launch-emails", templates: LAUNCH_TEMPLATES, categories: LAUNCH_CATEGORIES },
};

/** 单封邮件的完整视图。左侧列表是路由链接,每封邮件都有自己的 URL,可单独分享。 */
export function EmailView({ tpl, collection = "team" }: { tpl: Template; collection?: Collection }) {
  const nav = COLLECTIONS[collection];
  const [mode, setMode] = useState<Mode>("sample");
  const [copied, setCopied] = useState(false);
  const [ctaHit, setCtaHit] = useState<(CtaHit & { id: number }) | null>(null);
  const onCta = useCallback((hit: CtaHit) => setCtaHit({ ...hit, id: Date.now() }), []);
  const closeCta = useCallback(() => setCtaHit(null), []);
  const collage = tpl.layout === "collage";
  const hasHiddenFooter = tpl.blocks.some((b) => b.t === "footer" && b.hidden);

  const copy = async () => {
    await navigator.clipboard.writeText(toPlainText(tpl, mode));
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="min-h-screen bg-[#fcfbfd] text-[#24202a]" style={{ fontFamily: APPLE_FONT }}>
      {/* 演示控制条 —— 不属于真实产品 UI,故用中文 */}
      <div className="sticky top-0 z-30 flex h-[52px] items-center gap-4 border-b border-white/10 bg-[#141425] px-4 text-[12px] text-white">
        <Link
          href={nav.base}
          className="flex shrink-0 items-center gap-1.5 font-bold tracking-wide text-white/90 transition hover:text-white"
        >
          <ArrowLeft className="size-3.5" />
          {nav.title}
        </Link>
        <span className="shrink-0 text-white/35">/</span>
        <span className="shrink-0 truncate text-white/70">{tpl.name}</span>
        <span className="ml-auto shrink-0 text-white/45">
          这一封的独立链接:{nav.base}/{tpl.id}
        </span>
      </div>

      {ctaHit && <CtaToast key={ctaHit.id} hit={ctaHit} onClose={closeCta} />}

      <div className="mx-auto flex max-w-[1400px] gap-6 px-5 py-6">
        {/* 模板列表 */}
        <aside className="w-[264px] shrink-0">
          <div className="sticky top-[76px] grid gap-5">
            <div className="flex items-center gap-2 rounded-xl border border-[#f0eef2] bg-white px-3 py-2.5">
              <button
                type="button"
                onClick={() => setMode("sample")}
                className={`flex-1 rounded-lg py-1.5 text-[12px] font-semibold transition ${
                  mode === "sample" ? "bg-[#24202a] text-white" : "text-[#8a8490] hover:text-[#28222e]"
                }`}
              >
                示例数据
              </button>
              <button
                type="button"
                onClick={() => setMode("vars")}
                className={`flex-1 rounded-lg py-1.5 text-[12px] font-semibold transition ${
                  mode === "vars" ? "bg-[#24202a] text-white" : "text-[#8a8490] hover:text-[#28222e]"
                }`}
              >
                显示变量
              </button>
            </div>

            {nav.categories.map((category) => {
              const items = nav.templates.filter((t) => t.category === category);
              return (
                <div key={category}>
                  <p className="px-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#9a94a0]">
                    {category} <span className="font-semibold text-[#c3bcc8]">· {items.length}</span>
                  </p>
                  <div className="mt-2 grid gap-1">
                    {items.map((item) => {
                      const active = item.id === tpl.id;
                      return (
                        <Link
                          key={item.id}
                          href={`${nav.base}/${item.id}`}
                          aria-current={active ? "page" : undefined}
                          className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition ${
                            active ? "bg-[#fff3ee] ring-1 ring-[#ffd9c6]" : "hover:bg-[#f6f4f7]"
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className="size-1.5 shrink-0 rounded-full"
                            style={{ background: TONE_DOT[item.tone] }}
                          />
                          <span
                            className={`truncate text-[13px] ${active ? "font-bold text-[#28222e]" : "font-semibold text-[#56505c]"}`}
                          >
                            {item.name}
                          </span>
                          {item.shipped && (
                            <span className="ml-auto shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold text-[#0f7a5a] ring-1 ring-[#bfe6d6]">
                              已上线
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* 预览 */}
        <main className="min-w-0 flex-1">
          <div className="rounded-2xl border border-[#f0eef2] bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <h1 className="text-[18px] font-bold tracking-[-0.02em] text-[#28222e]">{tpl.name}</h1>
                <span
                  className="rounded-md px-2 py-0.5 text-[11px] font-bold"
                  style={{ background: `${TONE_DOT[tpl.tone]}1f`, color: TONE_DOT[tpl.tone] }}
                >
                  {TONE_LABEL[tpl.tone]}
                </span>
                {tpl.shipped && (
                  <span className="rounded-md bg-[#e6f7f0] px-2 py-0.5 text-[11px] font-bold text-[#0f7a5a]">已上线</span>
                )}
              </div>
              <button
                type="button"
                onClick={copy}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-[#ececf1] px-3 text-[12px] font-semibold text-[#56505c] transition hover:border-[#e0dae3] hover:bg-[#faf9fb]"
              >
                {copied ? <Check className="size-3.5 text-[#0f7a5a]" /> : <Copy className="size-3.5" />}
                {copied ? "已复制" : "复制文案"}
              </button>
            </div>

            <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9a94a0]">邮件主题</dt>
                <dd className="mt-1 flex items-center gap-2 text-[14px] leading-[1.55] text-[#28222e]">
                  <Mail className="size-4 shrink-0 text-[#8a8490]" />
                  <span>
                    <Text value={tpl.subject} mode={mode} />
                  </span>
                </dd>
              </div>
              {[
                { k: "触发时机", v: tpl.trigger },
                { k: "收件人", v: tpl.to },
              ].map((row) => (
                <div key={row.k}>
                  <dt className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9a94a0]">{row.k}</dt>
                  <dd className="mt-1 text-[13px] leading-[1.55] text-[#3b3442]">{row.v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* 收件箱里的样子 + 邮件本体 */}
          <div className="mt-4 rounded-2xl bg-[#f2f0f4] p-6">
            <div className="mx-auto max-w-[600px]">
              <div
                className={`mt-4 overflow-hidden rounded-2xl border border-[#e6e2ea] shadow-[0_10px_30px_rgba(26,26,46,0.07)] ${
                  collage ? "bg-[#fbf7f2]" : "bg-white"
                }`}
              >
                {collage ? (
                  <div className="flex items-center gap-2 px-9 pt-7">
                    <Image src={LOGO} alt="BuzzVideo" width={24} height={24} />
                    <span className="text-[16px] font-bold text-[#1a1a2e]">BuzzVideo</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 border-b border-[#f2f0f4] px-8 py-5">
                    <Image src={LOGO} alt="BuzzVideo" width={32} height={32} />
                    <span className="text-[21px] font-bold tracking-[-0.01em] text-[#28222e]">BuzzVideo</span>
                  </div>
                )}

                <div className={collage ? "overflow-hidden px-9 pb-10 pt-8" : "overflow-hidden px-8 py-7"}>
                  {tpl.heading && (
                    <h2 className="text-[22px] font-bold leading-[1.3] tracking-[-0.02em] text-[#1a1a2e]">
                      <Text value={tpl.heading} mode={mode} />
                    </h2>
                  )}
                  <CtaContext.Provider value={onCta}>
                    {tpl.blocks.map((block, i) =>
                      collage ? (
                        <CollageBlock
                          key={i}
                          block={block}
                          mode={mode}
                          index={tpl.blocks.slice(0, i).filter((b) => b.t === "section").length}
                        />
                      ) : (
                        <EmailBlock key={i} block={block} mode={mode} />
                      ),
                    )}
                  </CtaContext.Provider>
                </div>
              </div>

              {/* 演示说明 —— 不属于真实邮件内容,故用中文 */}
              {hasHiddenFooter && (
                <p className="mt-4 text-center text-[12px] leading-[1.6] text-[#9a94a0]">
                  这封信的 Unsubscribe 页脚已写进模板数据与「复制文案」导出,预览里刻意不渲染
                  —— 人工回信要看起来是一封干净的私人邮件。
                </p>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
