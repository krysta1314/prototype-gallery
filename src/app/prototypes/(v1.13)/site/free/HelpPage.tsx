"use client";

/* /help —— Help Center(2026-11-24 Monica:版式照 Higgsfield Creator Hub 的 Help Center 做；并入线上 /contact，以后只保留 Help Center)。
   结构：标题 + 搜索框 → Popular topics(横滑高卡) → Browse by topics(四列小卡) → Contact(Send feedback / Email us)。
   不编：问答来自 company.ts 的 FAQ_GROUPS，上手话题来自 HELP_TOPICS；Contact 两块文案照线上 buzzvideo.ai/contact 原文。
   没照搬的：Higgsfield 搜索框里的「Ask AI」(我们没有这个功能)，换成常搜词；标题不用渐变字(design.md)。 */

import { useMemo, useRef, useState } from "react";
import { ArrowRight, ArrowUp, MessageSquare, Search, Upload, X } from "lucide-react";
import type { OnLink } from "../../site-nav/SiteNavHeader";
import { OA_CTA } from "../oa/kit";
import { ALL_FAQ, FAQ_GROUPS, HELP_TOPICS, qaSlug } from "./company";
import { JsonLd, linker, ORG } from "./ui";

const WRAP = "mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-12";
const H2 = "text-[24px] font-semibold leading-tight tracking-[-0.015em] text-white md:text-[28px]";
const SUPPORT_EMAIL = "info@buzzvideo.ai";
const QUICK = ["Credits", "Refund", "Models", "MCP"];
const FEEDBACK_TYPES = ["Bug", "Feature Request", "Other"] as const;

export function HelpPage({ onLink }: { onLink: OnLink }) {
  const a = linker(onLink);
  const [query, setQuery] = useState("");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [feedbackType, setFeedbackType] = useState<(typeof FEEDBACK_TYPES)[number]>("Bug");
  const inputRef = useRef<HTMLInputElement>(null);

  const q = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (q.length < 2) return [];
    const guides = HELP_TOPICS.filter((t) => `${t.title} ${t.body} ${t.label}`.toLowerCase().includes(q)).map((t) => ({ kind: "Guide", title: t.title, body: t.body, link: a(t.label, t.href) }));
    const answers = ALL_FAQ.filter((f) => `${f.q} ${f.a}`.toLowerCase().includes(q)).map((f) => ({ kind: "Answer", title: f.q, body: f.a, link: { href: `faq#${qaSlug(f.q)}` } }));
    return [...guides, ...answers].slice(0, 6);
  }, [q, a]);

  return (
    <main className="bg-black text-white">
      {/* ── 标题 + 搜索 ── */}
      <section className="pb-16 pt-14 md:pb-20 md:pt-20">
        <div className={`${WRAP} text-center`}>
          <h1 className="text-[clamp(32px,calc(22px+1.6vw),44px)] font-semibold leading-[1.05] tracking-[-0.02em]">How can we help?</h1>
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              inputRef.current?.focus();
            }}
            className="mx-auto mt-8 max-w-[714px] rounded-[20px] bg-[#0E0E0F] p-4 text-left ring-1 ring-white/10 transition focus-within:ring-[#FF744D]/70"
          >
            <label htmlFor="help-search" className="sr-only">
              Search the Help Center
            </label>
            <input
              id="help-search"
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search credits, plans, models..."
              autoComplete="off"
              className="h-12 w-full bg-transparent px-1 text-[15px] text-white outline-none placeholder:text-white/55"
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <ul className="flex flex-wrap items-center gap-1.5">
                <li className="flex items-center gap-1.5 pr-1 text-[13px] font-medium text-white/60">
                  <Search className="size-4" /> Try
                </li>
                {QUICK.map((w) => (
                  <li key={w}>
                    <button type="button" onClick={() => setQuery(w)} className="h-8 rounded-full bg-white/[0.07] px-3 text-[13px] font-medium text-white ring-1 ring-white/10 transition hover:bg-white/[0.14]">
                      {w}
                    </button>
                  </li>
                ))}
              </ul>
              <button type="submit" aria-label="Search" className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-[#FF744D] text-[#240A03] transition hover:brightness-110">
                <ArrowUp className="size-4" strokeWidth={2.5} />
              </button>
            </div>
          </form>

          {q.length >= 2 && (
            <div className="mx-auto mt-3 max-w-[714px] rounded-[20px] bg-[#0E0E0F] p-2 text-left ring-1 ring-white/10" aria-live="polite">
              {results.length === 0 ? (
                <p className="px-4 py-5 text-[14.5px] text-white/70">
                  No results for &ldquo;{query.trim()}&rdquo;.{" "}
                  <a href="#contact" className="font-semibold text-[#FF744D] hover:underline">
                    Ask the BuzzVideo team
                  </a>
                </p>
              ) : (
                <ul>
                  {results.map((r) => (
                    <li key={`${r.kind}-${r.title}`}>
                      <a {...r.link} className="group flex items-start gap-3 rounded-[14px] px-4 py-3 transition hover:bg-white/[0.06]">
                        <span className="mt-0.5 w-[58px] shrink-0 text-[12px] font-semibold text-white/55">{r.kind}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[15px] font-semibold text-white">{r.title}</span>
                          <span className="mt-0.5 line-clamp-1 block text-[13.5px] text-white/60">{r.body}</span>
                        </span>
                        <ArrowRight className="mt-1 size-4 shrink-0 text-white/40 transition group-hover:translate-x-0.5 group-hover:text-white" />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 2026-11-24 去 AI 味(Monica):原来是三段全大写粗黑标题 + 一排只露两行答案的高卡 + 8 张一模一样的图标卡。
          改成能直接读、直接点的列表：问题按主题分栏，点了跳到 FAQ 里对应那一条;上手指南是两栏链接行;联系方式一块面板。 */}
      <section className="pb-16 md:pb-24">
        <div className={WRAP}>
          <h2 className={H2}>Popular questions</h2>
          <div className="mt-8 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {FAQ_GROUPS.map((g) => (
              <div key={g.title}>
                <h3 className="text-[14px] font-medium text-white/60">{g.title}</h3>
                <ul className="mt-3 border-t border-white/10">
                  {g.items.slice(0, 3).map((item) => (
                    <li key={item.q} className="border-b border-white/10">
                      {/* 线上网址是 /faq#<slug>;原型里用相对路径，保证带着锚点跳过去 */}
                      <a href={`faq#${qaSlug(item.q)}`} className="group flex items-start justify-between gap-4 py-3.5 text-[16px] leading-snug text-white transition-colors hover:text-[#FF744D]">
                        {item.q}
                        <ArrowRight className="mt-1 size-4 shrink-0 text-white/40 transition group-hover:translate-x-0.5 group-hover:text-[#FF744D] motion-reduce:transition-none" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="flex items-end">
              <a {...a("FAQ", "/faq")} className="group inline-flex items-center gap-1.5 text-[15px] font-semibold text-[#FF744D] hover:underline">
                See all {ALL_FAQ.length} answers <ArrowRight className="size-4 transition group-hover:translate-x-0.5 motion-reduce:transition-none" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-16 md:pb-24">
        <div className={WRAP}>
          <h2 className={H2}>Get started</h2>
          <ul className="mt-8 grid gap-x-10 border-t border-white/10 md:grid-cols-2">
            {HELP_TOPICS.map((t) => (
              <li key={t.title} className="border-b border-white/10">
                <a {...a(t.label, t.href)} className="group flex items-start justify-between gap-6 py-5">
                  <span>
                    <span className="block text-[17px] font-medium text-white transition-colors group-hover:text-[#FF744D]">{t.title}</span>
                    <span className="mt-1 block max-w-[52ch] text-[15px] leading-6 text-white/70">{t.body}</span>
                  </span>
                  <span className="mt-1 inline-flex shrink-0 items-center gap-1.5 text-[13px] font-medium text-white/60 transition-colors group-hover:text-white">
                    {t.label} <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5 motion-reduce:transition-none" />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Contact(并入线上 /contact;文案照线上原文) ── */}
      <section id="contact" className="scroll-mt-28 pb-24 md:pb-32">
        <div className={WRAP}>
          <h2 className={H2}>Contact &amp; support</h2>
          <p className="mt-3 text-[15px] text-white/70">Need help with BuzzVideo? We&apos;re here to help.</p>
          <div className="mt-8 grid rounded-[20px] ring-1 ring-white/10 md:grid-cols-2 md:divide-x md:divide-white/10">
            <div className="flex flex-col p-6 md:p-8">
              <h3 className="text-[20px] font-medium">Send feedback</h3>
              <p className="mt-2 max-w-[48ch] flex-1 text-[15px] leading-6 text-white/70">Report a bug, request a feature or tell us anything else. You can attach screenshots or screen recordings.</p>
              <button
                type="button"
                onClick={() => {
                  setSent(false);
                  setFeedbackOpen(true);
                }}
                className={`${OA_CTA} mt-6 w-fit px-5 py-3`}
              >
                <MessageSquare className="size-4" /> Give Feedback
              </button>
            </div>
            <div className="flex flex-col border-t border-white/10 p-6 md:border-t-0 md:p-8">
              <h3 className="text-[20px] font-medium">Email us</h3>
              <p className="mt-2 max-w-[48ch] flex-1 text-[15px] leading-6 text-white/70">Questions about your account, billing, credits or anything else.</p>
              <a href={`mailto:${SUPPORT_EMAIL}`} className="mt-6 w-fit text-[18px] font-semibold text-[#FF744D] hover:underline">
                {SUPPORT_EMAIL}
              </a>
              <p className="mt-2 text-[13px] text-white/60">We usually reply within 2 business days.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 反馈弹窗：2026-11-24 Monica「feedback 我们自己本来就用」—— 照产品里现有的 Give Feedback 弹窗还原(她给的截图):
          白底、Feedback Type 三选一(Bug / Feature Request / Other)、Description、Attachments(Images 0/20, Videos 0/5)、
          上传区「Click or drag files here (max 50MB each)」、Cancel / Submit Feedback。上传区线上是虚线框，这里按 design.md 用实线。 */}
      {feedbackOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 p-4" onClick={() => setFeedbackOpen(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="feedback-title" onClick={(e) => e.stopPropagation()} className="relative w-full max-w-[520px] rounded-[20px] bg-white p-6 text-[#240A03] shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
            <button type="button" onClick={() => setFeedbackOpen(false)} aria-label="Close" className="absolute right-4 top-4 grid size-8 place-items-center rounded-full text-[#6F6C6C] hover:bg-[#F6F6F6] hover:text-[#240A03]">
              <X className="size-[18px]" />
            </button>
            <h3 id="feedback-title" className="text-[18px] font-bold tracking-[-0.01em]">
              {sent ? "Thanks for the feedback" : "Give Feedback"}
            </h3>
            {sent ? (
              <p className="mt-3 text-[14px] leading-6 text-[#6F6C6C]">Your feedback has been submitted.</p>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSent(true);
                }}
              >
                <p className="mt-5 text-[13px] font-medium text-[#6F6C6C]">Feedback Type</p>
                <div role="radiogroup" aria-label="Feedback Type" className="mt-2 flex flex-wrap gap-2">
                  {FEEDBACK_TYPES.map((x) => {
                    const on = feedbackType === x;
                    return (
                      <button
                        key={x}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => setFeedbackType(x)}
                        className={`flex h-10 items-center gap-2 rounded-[10px] px-3 text-[14px] font-medium ring-1 ring-inset transition-colors ${on ? "bg-[#FFF3EC] text-[#240A03] ring-[#FF744D]" : "bg-white text-[#240A03] ring-[#E5E5E5] hover:bg-[#F6F6F6]"}`}
                      >
                        <span className={`grid size-4 place-items-center rounded-full ring-1 ring-inset ${on ? "ring-[#FF744D]" : "ring-[#CACACA]"}`}>{on && <span className="size-2 rounded-full bg-[#FF744D]" />}</span>
                        {x}
                      </button>
                    );
                  })}
                </div>
                <label htmlFor="feedback-text" className="mt-5 block text-[13px] font-medium text-[#6F6C6C]">
                  Description
                </label>
                <textarea id="feedback-text" required rows={4} autoFocus placeholder="Describe your issue or suggestion in detail..." className="mt-2 w-full resize-none rounded-[12px] bg-white p-3 text-[14px] text-[#240A03] outline-none ring-1 ring-inset ring-[#E5E5E5] placeholder:text-[#9B9898] focus:ring-[#FF744D]" />
                <p className="mt-5 text-[13px] font-medium text-[#6F6C6C]">
                  Attachments <span className="font-normal text-[#9B9898]">(Images: 0/20, Videos: 0/5)</span>
                </p>
                <button type="button" className="mt-2 flex h-[112px] w-full flex-col items-center justify-center gap-2 rounded-[12px] bg-white text-[13px] text-[#9B9898] ring-1 ring-inset ring-[#E5E5E5] transition-colors hover:bg-[#FAFAFA]">
                  <span className="grid size-9 place-items-center rounded-full bg-[#F6F6F6]">
                    <Upload className="size-4 text-[#6F6C6C]" />
                  </span>
                  Click or drag files here (max 50MB each)
                </button>
                <div className="mt-6 flex items-center justify-end gap-4">
                  <button type="button" onClick={() => setFeedbackOpen(false)} className="px-2 text-[14px] font-semibold text-[#6F6C6C] hover:text-[#240A03]">
                    Cancel
                  </button>
                  <button type="submit" className={`${OA_CTA} px-5 py-2.5`}>
                    Submit Feedback
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <JsonLd data={[{ "@context": "https://schema.org", "@type": "WebPage", name: "BuzzVideo Help Center", url: "https://buzzvideo.ai/help", publisher: ORG }, { "@context": "https://schema.org", "@type": "ContactPage", name: "Contact & Support", url: "https://buzzvideo.ai/help#contact", publisher: ORG }]} />
    </main>
  );
}
