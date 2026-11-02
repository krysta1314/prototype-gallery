"use client";

/* 单个 Skill 的详情页(参考 higgsfield.ai/skills/ad-multiplier),和列表页同一套底色、字体、按钮。
   首屏左文右片(成片本身就是主视觉)→ 对话里会发生什么 + 你会拿到什么 → 换个说法(行列表，不堆卡片)
   → 接入 → 改提示词发送(做成真实的输入框)→ 同类 Skill。 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight, ArrowUp, ChevronRight, Clock, Copy } from "lucide-react";
import { useToast } from "@/app/prototypes/(v1.7)/blog/toast";
import { SKILLS, chatgptUrlFor, claudeUrlFor, type Skill } from "../data";
import { ChatDemo, ClaudeGlyph, Footer, grotesk, Nav, OpenAiGlyph, SetupSteps, SkillMedia, TryButton, openNew } from "../ui";

const PAGE = "#131517";
const SECONDARY = "#898a8b";
/* 展示用：去掉「Use the BuzzVideo xxx skill to」这类给模型看的前缀，发送时仍带完整提示词 */
const humanize = (p: string) => {
  const t = p.replace(/^Use the BuzzVideo [a-z0-9-]+ skill(?: to |\. )/, "");
  return t.charAt(0).toUpperCase() + t.slice(1);
};
const H2 = `${grotesk.className} font-bold uppercase leading-8 tracking-[-0.06rem] text-white [text-wrap:balance] text-[1.75rem] sm:text-[2rem] sm:leading-9 sm:tracking-[-0.08rem]`;

export default function SkillDetail() {
  const { slug } = useParams<{ slug: string }>();
  const s = SKILLS.find((x) => x.slug === slug);
  const [notify, toastNode] = useToast();

  const copy = async (text: string, msg: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notify(msg);
    } catch {
      notify("Couldn't copy. Select the text and copy it manually.", "error");
    }
  };

  if (!s) {
    const picks = SKILLS.filter((x) => x.featured).slice(0, 4);
    return (
      <div className="min-h-screen font-sans text-white" style={{ background: PAGE }}>
        <Nav />
        <div className="mx-auto max-w-[1180px] px-6 pb-28 pt-24 sm:px-8">
          <h1 className={`${grotesk.className} text-center text-[32px] font-bold uppercase tracking-[-0.04em]`}>This skill doesn&apos;t exist</h1>
          <p className="mt-3 text-center text-[15px]" style={{ color: SECONDARY }}>
            It may have been renamed. Here are a few popular ones, or{" "}
            <Link href="/prototypes/mcp/skills#skills" className="text-white underline decoration-white/30 underline-offset-4 hover:decoration-white">
              browse all skills
            </Link>
            .
          </p>
          <div className="mx-auto mt-12 grid max-w-[900px] grid-cols-2 gap-x-3 gap-y-6 lg:grid-cols-4">
            {picks.map((o) => (
              <OtherCard key={o.slug} s={o} />
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans text-[#f7f7f8] antialiased" style={{ background: PAGE }}>
      {toastNode}
      <Nav />

      {/* 首屏：左文右片 */}
      <header className="mx-auto max-w-[1180px] px-6 pb-20 pt-8 sm:px-8">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px]" style={{ color: SECONDARY }}>
          <Link href="/prototypes/mcp/skills" className="hover:text-white">
            Skills
          </Link>
          <ChevronRight className="size-3.5" />
          <span>{s.category}</span>
          <ChevronRight className="size-3.5" />
          <span className="text-white">{s.name}</span>
        </nav>
        <div className={`mt-10 grid grid-cols-1 items-center gap-12 lg:gap-16 ${s.ratio === "wide" ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]" : "lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]"}`}>
          <div>
            <h1 className={`${grotesk.className} max-w-[16ch] text-[2.5rem] font-bold uppercase leading-[1.02] tracking-[-0.1rem] [text-wrap:balance] sm:text-[3.25rem]`}>
              {s.headline}
            </h1>
            <p className="mt-5 max-w-[46ch] text-[17px] leading-7 text-white/70 [text-wrap:pretty]">{s.line}</p>
            <div className="mt-8 grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-center">
              <TryButton client="claude" size="lg" onClick={() => openNew(claudeUrlFor(s.prompt))} />
              <TryButton client="chatgpt" size="lg" onClick={() => openNew(chatgptUrlFor(s.prompt))} />
            </div>
            {/* 没接 BuzzVideo 就点试用会失败：在按钮下面明确给出先接入的入口 */}
            <div className="mt-5 flex max-w-[30rem] items-center gap-4 rounded-xl border border-white/10 px-4 py-3">
              <p className="min-w-0 flex-1 text-[14px] leading-5 text-white/70">First time? Connect BuzzVideo to your assistant first. It takes about a minute.</p>
              <a href="#setup" className="flex h-9 shrink-0 items-center rounded-lg bg-white/10 px-3 text-[13px] font-semibold text-white transition hover:bg-white/15">
                Set up
              </a>
            </div>
            <p className="mt-4 inline-flex items-center gap-1.5 text-[13px]" style={{ color: SECONDARY }}>
              <Clock className="size-3.5" /> Usually ready in about {s.minutes} minutes
            </p>
          </div>
          <div
            className={`relative mx-auto w-full overflow-hidden rounded-[20px] bg-black ring-1 ring-white/10 ${
              s.ratio === "wide" ? "aspect-video" : s.ratio === "1:1" ? "aspect-square" : "aspect-[9/16] max-w-[22rem]"
            }`}
          >
            <SkillMedia s={s} playing eager className="absolute inset-0 size-full" />
          </div>
        </div>
      </header>

      {/* 对话里会发生什么 + 你会拿到什么 */}
      <section className="mx-auto max-w-[1180px] px-6 sm:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-16">
          <div className="overflow-hidden rounded-[20px] border border-white/5 bg-[#222]">
            <ChatDemo s={s} />
          </div>
          <div>
            <h2 className={H2}>What you get</h2>
            <ol className="mt-6">
              {s.gets.map((g, i) => (
                <li key={g} className="flex gap-4 py-3">
                  <span className="w-5 shrink-0 pt-0.5 text-[14px] font-semibold tabular-nums text-[#ff6a2b]">{i + 1}</span>
                  <span className="text-[17px] leading-7 text-white">{g}</span>
                </li>
              ))}
            </ol>
            <p className="mt-6 max-w-[48ch] border-t border-white/10 pt-5 text-[15px] leading-6" style={{ color: SECONDARY }}>
              Nothing is generated until you approve the plan and the credit estimate in the chat.
            </p>
          </div>
        </div>
      </section>

      {/* 换个说法 */}
      <section className="mx-auto mt-28 max-w-[1180px] px-6 sm:px-8">
        <h2 className={H2}>Other ways to ask</h2>
        <p className="mt-2 text-[15px]" style={{ color: SECONDARY }}>
          Same skill, different starting points. Each one opens with the prompt filled in.
        </p>
        <ul className="mt-8 border-t border-white/10">
          {s.variations.map((v) => (
            <li key={v.title} className="flex flex-col gap-4 border-b border-white/10 py-6 md:flex-row md:items-center md:gap-10">
              <div className="min-w-0 flex-1">
                <div className="text-[17px] font-semibold text-white">{v.title}</div>
                <p className="mt-1.5 max-w-[70ch] text-[15px] leading-6" style={{ color: SECONDARY }}>
                  {humanize(v.prompt)}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <TryButton client="claude" size="sm" label="Claude" onClick={() => openNew(claudeUrlFor(v.prompt))} />
                <TryButton client="chatgpt" size="sm" label="ChatGPT" onClick={() => openNew(chatgptUrlFor(v.prompt))} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* 接入 */}
      <section id="setup" className="mx-auto mt-28 max-w-[1180px] scroll-mt-24 px-6 sm:px-8">
        <h2 className={H2}>Connect BuzzVideo</h2>
        <p className="mt-2 text-[15px]" style={{ color: SECONDARY }}>
          One time only. After that, {s.name} and every other skill work in any chat.
        </p>
        <div className="mt-8">
          <SetupSteps onCopy={(t) => copy(t, "Copied")} />
        </div>
      </section>

      {/* 改提示词发送 */}
      <TryPanel key={s.slug} s={s} onCopy={(t) => copy(t, "Prompt copied")} />

      {/* 同类 Skill */}
      <MoreSkills s={s} />

      <div className="mt-28">
        <Footer />
      </div>
    </div>
  );
}

/* 做成真实的对话输入框：左下切换客户端，右下复制和发送 */
function TryPanel({ s, onCopy }: { s: Skill; onCopy: (t: string) => void }) {
  const [client, setClient] = useState<"claude" | "chatgpt">("claude");
  /* 输入框里只放给人看的话；发送和复制时再补上调用 Skill 的那句 */
  const [text, setText] = useState(humanize(s.prompt));
  const full = `Use the BuzzVideo ${s.slug} skill. ${text.trim()}`;
  const send = () => openNew(client === "claude" ? claudeUrlFor(full) : chatgptUrlFor(full));
  return (
    <section className="mx-auto mt-28 max-w-[1180px] px-6 sm:px-8">
      <h2 className={H2}>Edit the prompt, then send it</h2>
      <p className="mt-2 text-[15px]" style={{ color: SECONDARY }}>
        Opens a new tab with your prompt already in the message box.
      </p>
      <div className="mt-8 max-w-[52rem] rounded-[20px] border border-white/10 bg-[#1c1d20] p-3 transition focus-within:border-white/25">
        <label>
          <span className="sr-only">Prompt</span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            className="w-full resize-none bg-transparent px-3 pt-2 text-[16px] leading-7 text-white outline-none placeholder:text-white/40"
            placeholder="Describe what you want to make"
          />
        </label>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex rounded-[10px] bg-white/5 p-1">
            {(["claude", "chatgpt"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setClient(c)}
                aria-pressed={client === c}
                className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium transition-colors ${
                  client === c ? "bg-white/10 text-white" : "text-white/50 hover:text-white"
                }`}
              >
                {c === "claude" ? <ClaudeGlyph className="size-3.5" /> : <OpenAiGlyph className="size-3.5" />}
                {c === "claude" ? "Claude" : "ChatGPT"}
              </button>
            ))}
          </div>
          <button
            onClick={() => onCopy(full)}
            aria-label="Copy prompt"
            className="ml-auto flex size-9 shrink-0 items-center justify-center rounded-[10px] text-white/60 transition hover:bg-white/5 hover:text-white"
          >
            <Copy className="size-4" />
          </button>
          <button
            onClick={send}
            disabled={!text.trim()}
            aria-label={client === "claude" ? "Send to Claude" : "Send to ChatGPT"}
            className="flex h-9 items-center gap-1.5 rounded-[10px] px-3.5 text-[14px] font-semibold text-white transition disabled:opacity-40"
            style={{ background: client === "claude" ? "#b8532f" : "#ffffff", color: client === "claude" ? "#fff" : "#131517" }}
          >
            Send <ArrowUp className="size-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

function MoreSkills({ s }: { s: Skill }) {
  const others = useMemo(() => {
    const same = SKILLS.filter((x) => x.category === s.category && x.slug !== s.slug);
    const rest = SKILLS.filter((x) => x.category !== s.category && x.media !== "none");
    return [...same, ...rest].slice(0, 4);
  }, [s]);
  return (
    <section className="mx-auto mt-28 max-w-[1180px] px-6 sm:px-8">
      <div className="flex items-end justify-between gap-4">
        <h2 className={H2}>Keep exploring</h2>
        <Link href="/prototypes/mcp/skills#skills" className="inline-flex shrink-0 items-center gap-1 text-[14px] font-medium text-white/70 hover:text-white">
          All skills <ArrowRight className="size-4" />
        </Link>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-6 lg:grid-cols-4">
        {others.map((o) => (
          <OtherCard key={o.slug} s={o} />
        ))}
      </div>
    </section>
  );
}

function OtherCard({ s }: { s: Skill }) {
  const [hover, setHover] = useState(false);
  return (
    <Link
      href={`/prototypes/mcp/skills/${s.slug}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="group block"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-[10px] bg-[#23262a]">
        <SkillMedia s={s} playing={hover} className="absolute inset-0 size-full transition-transform duration-700 ease-out group-hover:scale-[1.03] motion-reduce:transition-none" />
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-2 px-0.5">
        <span className="truncate text-[14px] font-medium text-white">{s.name}</span>
        <span className="flex shrink-0 items-center gap-1 text-[12px]" style={{ color: SECONDARY }}>
          <Clock className="size-3" /> ~{s.minutes} min
        </span>
      </div>
    </Link>
  );
}
