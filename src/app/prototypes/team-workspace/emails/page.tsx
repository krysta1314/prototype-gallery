"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, Check, Copy, Mail } from "lucide-react";
import { CATEGORIES, SAMPLE, TEMPLATES, type Block, type Template } from "./data";

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

/** 变量模式下把 {{x}} 标出来;两种模式都解析 **加粗** 与 ==高亮== */
function Text({ value, mode }: { value: string; mode: Mode }) {
  const parts = value.split(/(\{\{\w+\}\}|\*\*[^*]+\*\*|==[^=]+==)/g).filter(Boolean);
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
      return (
        <div className="relative -mx-8 -mt-7 mb-6 flex h-[260px] items-center justify-center overflow-hidden bg-[#0b0b18]">
          <Image src={block.bg} alt="" fill priority sizes="600px" className="object-cover" />
          <div className="relative flex flex-col items-center">
            {block.label && (
              <span className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#ff5e1a] px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white">
                {block.label}
              </span>
            )}
            {/* cropTop 用来裁掉素材自带的 COMING SOON 字样 */}
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
          <span className="inline-flex h-12 items-center rounded-xl bg-[#ff5e1a] px-8 text-[15px] font-bold text-white">
            {block.button}
          </span>
          <p className="mt-3.5 text-[13px] font-semibold text-[#ff5e1a] underline underline-offset-2">{block.link}</p>
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
          <span className="font-bold text-[#28222e]">{block.team}</span>
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
      return (
        <p className="-mx-8 mt-7 -mb-7 border-t border-[#f2f0f4] bg-[#faf9fb] py-4 text-center text-[12px] text-[#9a94a0]">
          {block.links.join(" · ")}
        </p>
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
    if (block.t === "h" || block.t === "kicker" || block.t === "ps") lines.push("", fill(block.text, mode));
    if (block.t === "features") lines.push("", ...block.items.map((i) => `${i.icon} ${fill(i.text, mode)}`));
    if (block.t === "box") lines.push("", fill(block.title, mode), ...block.items.map((i) => `✅ ${fill(i, mode)}`));
    if (block.t === "action") lines.push("", `[${block.button}]`, block.link);
    if (block.t === "grid")
      lines.push("", block.title, ...block.items.map((i) => `${i.icon} ${i.label} — ${i.text}`));
    if (block.t === "signoff") lines.push("", block.line, block.team);
    if (block.t === "hr") lines.push("", "—".repeat(24));
    if (block.t === "footer") lines.push("", block.links.join(" · "));
  }
  return lines.join("\n");
}

export default function EmailTemplatesPage() {
  const [activeId, setActiveId] = useState(TEMPLATES[0]!.id);
  const [mode, setMode] = useState<Mode>("sample");
  const [copied, setCopied] = useState(false);

  const tpl = useMemo(() => TEMPLATES.find((t) => t.id === activeId) ?? TEMPLATES[0]!, [activeId]);

  const copy = async () => {
    await navigator.clipboard.writeText(toPlainText(tpl, mode));
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="min-h-screen bg-[#fcfbfd] text-[#24202a]" style={{ fontFamily: APPLE_FONT }}>
      {/* 演示控制条 —— 不属于真实产品 UI,故用中文 */}
      <div className="sticky top-0 z-30 flex h-[52px] items-center gap-4 border-b border-white/10 bg-[#141425] px-4 text-[12px] text-white">
        <span className="shrink-0 font-bold tracking-wide text-white/90">邮件模板管理</span>
        <Link
          href="/prototypes/team-workspace/home"
          className="flex shrink-0 items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1 font-semibold text-white/75 transition hover:bg-white/20 hover:text-white"
        >
          <ArrowLeft className="size-3.5" />
          回团队原型
        </Link>
        <span className="ml-auto shrink-0 text-white/45">共 {TEMPLATES.length} 封 · 产品文案为英文,分类与说明为演示辅助</span>
      </div>

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

            {CATEGORIES.map((category) => {
              const items = TEMPLATES.filter((t) => t.category === category);
              return (
                <div key={category}>
                  <p className="px-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#9a94a0]">
                    {category} <span className="font-semibold text-[#c3bcc8]">· {items.length}</span>
                  </p>
                  <div className="mt-2 grid gap-1">
                    {items.map((item) => {
                      const active = item.id === tpl.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setActiveId(item.id)}
                          className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition ${
                            active ? "bg-[#fff3ee] ring-1 ring-[#ffd9c6]" : "hover:bg-[#f6f4f7]"
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className="size-1.5 shrink-0 rounded-full"
                            style={{ background: TONE_DOT[item.tone] }}
                          />
                          <span className={`truncate text-[13px] ${active ? "font-bold text-[#28222e]" : "font-semibold text-[#56505c]"}`}>
                            {item.name}
                          </span>
                        </button>
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
              <div className="mt-4 overflow-hidden rounded-2xl border border-[#e6e2ea] bg-white shadow-[0_10px_30px_rgba(26,26,46,0.07)]">
                <div className="flex items-center justify-center gap-2 border-b border-[#f2f0f4] px-8 py-5">
                  <Image src={LOGO} alt="BuzzVideo" width={32} height={32} />
                  <span className="text-[21px] font-bold tracking-[-0.01em] text-[#28222e]">BuzzVideo</span>
                </div>

                <div className="overflow-hidden px-8 py-7">
                  {tpl.heading && (
                    <h2 className="text-[22px] font-bold leading-[1.3] tracking-[-0.02em] text-[#1a1a2e]">
                      <Text value={tpl.heading} mode={mode} />
                    </h2>
                  )}
                  {tpl.blocks.map((block, i) => (
                    <EmailBlock key={i} block={block} mode={mode} />
                  ))}
                </div>

              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
