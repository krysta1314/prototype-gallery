"use client";

/* Skills 介绍页的共用件：深色舞台的 token、品牌字形、试用按钮、媒体、模拟对话演示、接入步骤。
   视觉方向：深色舞台让成片当主角(参考 Higgsfield /skills),品牌色仍是 Buzz 橙;不用渐变文字。 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, ChevronDown, CircleArrowUp, Copy, Loader2, Menu, X } from "lucide-react";
import { siInstagram, siTiktok, siYoutube } from "simple-icons";
import { Space_Grotesk } from "next/font/google";
import { CHATGPT_PLUGIN_URL, CLAUDE_CONNECT_URL, MCP_URL, mediaSrc, type Skill } from "./data";

export const APPLE_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif';

/* 深色舞台 token。正文 #a9a8b3 对 #0b0b0e 约 8:1,够读 */
export const T = {
  bg: "bg-[#0b0b0e]",
  surface: "bg-[#141418]",
  raised: "bg-[#1c1c22]",
  line: "border-white/[0.08]",
  ink: "text-[#f6f4f1]",
  muted: "text-[#a9a8b3]",
  orange: "text-[#ff7a3d]",
};

/* 标题字体：照 higgsfield.ai/skills 用 Space Grotesk 700 全大写 */
export const grotesk = Space_Grotesk({ subsets: ["latin"], weight: ["700"] });

export const openNew = (url: string) => window.open(url, "_blank", "noopener");

export function useReducedMotion() {
  const [r, setR] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setR(m.matches);
    const f = () => setR(m.matches);
    m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, []);
  return r;
}

export function BuzzLogo({ className }: { className?: string }) {
  return <img src="/prototypes/seedance-2-5/logo.svg" alt="" aria-hidden className={className} />;
}

/** 顶栏：照 BuzzVideo 官网 header(logo + BuzzVideo AI、中间主导航、右侧渐变 Go to Dashboard);本页属于 MCP,所以 MCP 高亮 */
type SubLink = { label: string; desc: string; href: string; active?: boolean };
const NAV_LINKS: { label: string; menu?: boolean; active?: boolean; href?: string; sub?: SubLink[] }[] = [
  { label: "Marketing Agent" },
  { label: "Features", menu: true },
  { label: "Use Cases", menu: true },
  { label: "AI Models", menu: true },
  { label: "Resources", menu: true },
  { label: "Affiliate" },
  {
    label: "MCP",
    menu: true,
    active: true,
    href: "/prototypes/mcp/skills",
    /* MCP 悬停小窗：MCP Skills 是本页入口 */
    sub: [{ label: "MCP Skills", desc: "Ready-made skills for Claude and ChatGPT", href: "/prototypes/mcp/skills", active: true }],
  },
  { label: "Pricing" },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30 bg-[#131517]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-4 sm:gap-6 sm:px-8 lg:h-[4.5rem] lg:px-14">
        <Link href="/prototypes/mcp/skills" className="flex shrink-0 items-center gap-2">
          <BuzzLogo className="size-7 sm:size-8" />
          <span className="whitespace-nowrap text-[17px] font-bold tracking-[-0.01em] text-white sm:text-[19px]">BuzzVideo AI</span>
        </Link>
        <nav className="mx-auto hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((l) => {
            const trigger = (
              <Link
                href={l.href ?? "#"}
                aria-current={l.active ? "page" : undefined}
                aria-haspopup={l.sub ? "true" : undefined}
                className={`flex items-center gap-1 whitespace-nowrap text-[14px] font-medium transition-colors ${
                  l.active ? "text-white" : "text-white/80 hover:text-white"
                }`}
              >
                {l.label}
                {l.menu && (
                  <ChevronDown className={`size-3.5 ${l.sub ? "transition-transform duration-200 group-hover:rotate-180 group-focus-within:rotate-180" : ""}`} />
                )}
              </Link>
            );
            if (!l.sub) return <span key={l.label}>{trigger}</span>;
            return (
              <div key={l.label} className="group relative">
                {trigger}
                {/* pt-3 是触发项和小窗之间的透明桥，鼠标移过去不会断开 hover */}
                <div className="invisible absolute left-1/2 top-full z-40 -translate-x-1/2 translate-y-1 pt-3 opacity-0 transition duration-150 ease-out group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 motion-reduce:transition-none">
                  <div className="w-[15.5rem] rounded-xl border border-white/[0.08] bg-[#1c1e20] p-1.5 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.6)]">
                    {l.sub.map((s) => (
                      <Link
                        key={s.label}
                        href={s.href}
                        aria-current={s.active ? "page" : undefined}
                        className={`block rounded-lg px-3 py-2.5 transition-colors hover:bg-white/[0.06] ${s.active ? "bg-white/[0.04]" : ""}`}
                      >
                        <span className="min-w-0">
                          <span className="block text-[14px] font-medium text-white">{s.label}</span>
                          <span className="block text-[12.5px] leading-snug text-white/60">{s.desc}</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>
        <a
          href="https://app.buzzvideo.ai"
          target="_blank"
          rel="noopener"
          className="ml-auto flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-3 py-2 text-[13px] font-semibold text-white transition hover:brightness-105 sm:px-3.5 sm:text-[14px] lg:ml-0"
        >
          <span className="sm:hidden">Dashboard</span>
          <span className="hidden sm:inline">Go to Dashboard</span>
          <ArrowUpRight className="size-4" />
        </a>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="-mr-1.5 flex size-10 shrink-0 items-center justify-center rounded-lg text-white hover:bg-white/5 lg:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {open && (
        <nav className="border-t border-white/[0.06] px-4 pb-4 pt-2 sm:px-8 lg:hidden">
          {NAV_LINKS.map((l) => (
            <div key={l.label} className="border-b border-white/[0.06] last:border-0">
              <Link
                href={l.href ?? "#"}
                onClick={() => setOpen(false)}
                aria-current={l.active && !l.sub ? "page" : undefined}
                className={`flex h-12 items-center justify-between text-[16px] font-medium ${l.active ? "text-white" : "text-white/75"}`}
              >
                {l.label}
                {l.menu && <ChevronDown className="size-4 text-white/50" />}
              </Link>
              {l.sub?.map((s) => (
                <Link
                  key={s.label}
                  href={s.href}
                  onClick={() => setOpen(false)}
                  aria-current={s.active ? "page" : undefined}
                  className={`-mt-1 mb-2 flex h-10 items-center pl-3 text-[15px] ${s.active ? "text-white" : "text-white/70"}`}
                >
                  {s.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      )}
    </header>
  );
}

export function TryButton({
  client,
  onClick,
  size = "md",
  label,
}: {
  client: "chatgpt" | "claude";
  onClick: () => void;
  size?: "sm" | "md" | "lg";
  label?: string;
}) {
  /* 和列表页卡片的 Recreate 同一套：10px 圆角、实色，不用渐变药丸 */
  const pad = size === "lg" ? "h-12 px-5 text-[15px]" : size === "md" ? "h-10 px-4 text-[14px]" : "h-9 px-3 text-[13px]";
  const text = label ?? (client === "claude" ? "Try in Claude" : "Try in ChatGPT");
  const tone =
    client === "claude"
      ? "bg-[#b8532f] text-white hover:bg-[#c25a35]"
      : "bg-white text-[#131517] hover:bg-white/90";
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition active:scale-[0.98] motion-reduce:transition-none ${tone} ${pad}`}
    >
      {client === "claude" ? <ClaudeGlyph className="size-4" white /> : <OpenAiGlyph className="size-4" />}
      {text}
    </button>
  );
}

/** 卡片 / 详情里的效果媒体。视频默认不加载，悬停或入场才播 */
export function SkillMedia({
  s,
  playing,
  className = "",
  eager,
  contain,
  backdrop = "blur",
}: {
  s: Skill;
  playing: boolean;
  className?: string;
  eager?: boolean;
  /** 横向大容器里放竖版成片：完整显示，两侧用同一画面的模糊放大版铺底，不裁字幕 */
  contain?: boolean;
  /** contain 时两侧的铺底：默认同画面模糊放大;"black" 是 TikTok 播横版片的纯黑上下边 */
  backdrop?: "blur" | "black";
}) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (playing) v.play().catch(() => {});
    else v.pause();
  }, [playing]);

  if (s.media === "none") {
    // 报告类 Skill 没有成片：用一张小报告示意——三条在投广告缩略图 + 拆解要点，不画空线框
    // 缩略图取自产品用例库里三条真实的 UGC 广告
    const ads = [
      "2026-06-25/328355888601554944.jpg",
      "2026-07-31/341491392675110912.jpg",
      "2026-06-25/328377175164116992.jpg",
    ].map((p) => `https://assets.presslogic.com/cdn-cgi/image/width=360,quality=75,format=auto/buzzvideo/public/${p}`);
    return (
      <div className={`flex flex-col gap-3 overflow-hidden bg-[#18191c] p-[5%] ${className}`}>
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[13px] font-semibold text-white">Competitor ad report</span>
          <span className="text-[11px] text-white/55">3 live ads</span>
        </div>
        {/* 缩略图区占满剩余高度，容器多扁都不会把上下两段挤出去 */}
        <div className="grid min-h-0 flex-1 grid-cols-3 gap-2">
          {ads.map((a) => (
            <img key={a} src={a} alt="" className="size-full min-h-0 rounded-md object-cover" />
          ))}
        </div>
        <dl className="grid shrink-0 grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[11px]">
          {[
            ["Hook", "Problem in the first second"],
            ["Format", "Creator talking to camera"],
            ["Offer", "Bundle, ends this week"],
          ].map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-white/55">{k}</dt>
              <dd className="truncate text-white/90">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    );
  }
  if (contain) {
    return (
      <div className={`overflow-hidden ${backdrop === "black" ? "bg-black" : ""} ${className}`}>
        {backdrop === "blur" && (
          <img
            src={mediaSrc(s, "jpg")}
            alt=""
            aria-hidden
            className="absolute inset-0 size-full scale-110 object-cover opacity-60 blur-2xl"
          />
        )}
        {s.media === "image" ? (
          <img src={mediaSrc(s, "jpg")} alt={`${s.name} example`} className="relative mx-auto h-full w-auto max-w-full object-contain" />
        ) : (
          <video
            ref={ref}
            src={mediaSrc(s, "mp4")}
            poster={mediaSrc(s, "jpg")}
            muted
            loop
            playsInline
            preload={eager ? "auto" : "none"}
            autoPlay={eager}
            className="relative mx-auto h-full w-auto max-w-full object-contain shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
          />
        )}
      </div>
    );
  }
  if (s.media === "image") {
    return (
      <img
        src={mediaSrc(s, "jpg")}
        alt={`${s.name} example`}
        className={`${s.ratio === "wide" ? "object-contain" : "object-cover"} ${className}`}
      />
    );
  }
  return (
    <video
      ref={ref}
      src={mediaSrc(s, "mp4")}
      poster={mediaSrc(s, "jpg")}
      muted
      loop
      playsInline
      preload={eager ? "auto" : "none"}
      autoPlay={eager}
      className={`object-cover ${className}`}
    />
  );
}

/** 模拟一次对话：用户提示词 → 「正在使用技能」→ 三步进度逐条完成 → 完成。参考 Higgsfield 详情页的左栏 */
export function ChatDemo({ s, client = "claude" }: { s: Skill; client?: "claude" | "chatgpt" }) {
  const reduced = useReducedMotion();
  const [stage, setStage] = useState(reduced ? 5 : 0);
  useEffect(() => {
    if (reduced) {
      setStage(5);
      return;
    }
    setStage(0);
    const ids = [600, 1400, 2600, 3800, 5000].map((t, i) => setTimeout(() => setStage(i + 1), t));
    return () => ids.forEach(clearTimeout);
  }, [s.slug, reduced]);

  return (
    <div className="flex h-full flex-col gap-4 p-5 sm:p-7">
      <div className="flex items-center justify-center gap-2 text-[15px] font-bold text-white/90">
        {client === "claude" ? <ClaudeGlyph className="size-5" /> : <OpenAiGlyph className="size-5" />}
        {client === "claude" ? "Claude" : "ChatGPT"}
      </div>
      <div className="ml-auto max-w-[88%] rounded-2xl rounded-tr-md bg-white/[0.07] px-4 py-3 text-[14px] leading-relaxed text-white/90">
        {s.prompt.replace(/^Use the BuzzVideo [a-z0-9-]+ skill\. /, "")}
      </div>
      <Reveal show={stage >= 1}>
        <p className="text-[14px] leading-relaxed text-[#c9c8d0]">
          On it. I&apos;ll ask a couple of quick questions, show you the plan and the credit quote, then make it.
        </p>
      </Reveal>
      <Reveal show={stage >= 1}>
        <div className="flex items-center gap-2 text-[14px] font-medium text-white/80">
          <BuzzLogo className="size-5 rounded-[0.3rem]" /> BuzzVideo <span className="text-white/45">running {s.name}</span>
        </div>
      </Reveal>
      <ul className="space-y-2.5">
        {s.steps.map((t, i) => {
          const done = stage >= i + 3;
          const active = stage === i + 2;
          return (
            <Reveal key={t} show={stage >= i + 2}>
              <li className="flex items-center gap-2.5 text-[14px] text-[#c9c8d0]">
                {done ? (
                  <Check className="size-4 text-[#3ecf8e]" strokeWidth={3} />
                ) : (
                  <Loader2 className={`size-4 text-[#ff8a52] ${active ? "animate-spin" : ""}`} />
                )}
                {t}
              </li>
            </Reveal>
          );
        })}
      </ul>
      <Reveal show={stage >= 5}>
        <p className="text-[14px] leading-relaxed text-white">Done. Checked frame by frame, and here&apos;s your file.</p>
      </Reveal>
    </div>
  );
}

/** 逐条出现：只做透明度和轻微位移;关掉动效时直接显示 */
function Reveal({ show, children }: { show: boolean; children: React.ReactNode }) {
  return (
    <div
      className={`transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
        show ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0"
      }`}
    >
      {children}
    </div>
  );
}

/** 接入卡：照 Higgsfield /skills 原样——白 5% 外壳 + 右上角客户端切换、内层黑 30% 卡片三栏(竖向渐变分隔线),每步底下一条可复制 / 可打开的字段 */
export function SetupSteps({ onCopy }: { onCopy: (text: string) => void }) {
  const [client, setClient] = useState<"claude" | "chatgpt">("claude");
  type Step = { t: string; d: React.ReactNode; field: string; copy?: string; go?: string };
  const steps: Step[] =
    client === "claude"
      ? [
          { t: "Copy the connector URL", d: <>One URL gives Claude every BuzzVideo skill,{" "}<br className="hidden lg:block" />from ads and UGC to 3D and editing.</>, field: MCP_URL, copy: MCP_URL },
          { t: "Add it in Claude", d: <>Open <strong>Customize → Connectors</strong>, add a custom connector named BuzzVideo and paste the URL.</>, field: "claude.ai/customize/connectors", go: CLAUDE_CONNECT_URL },
          { t: "Sign in and ask", d: <><strong>Sign in to BuzzVideo once.</strong>{" "}<br className="hidden lg:block" />Then ask for any skill in plain words.</>, field: "Use BuzzVideo to make a UGC ad", copy: "Use BuzzVideo to make a UGC ad" },
        ]
      : [
          { t: "Open the BuzzVideo plugin", d: <>Find BuzzVideo in the ChatGPT plugins directory.</>, field: "chatgpt.com/plugins/buzzvideo", go: CHATGPT_PLUGIN_URL },
          { t: "Add and sign in", d: <>Click <strong>Add</strong>, then sign in to your BuzzVideo account.</>, field: "Add → Sign in to BuzzVideo" },
          { t: "Mention @BuzzVideo", d: <><strong>Start any chat with @BuzzVideo</strong>{" "}<br className="hidden lg:block" />or press Recreate on a skill below.</>, field: "@BuzzVideo", copy: "@BuzzVideo " },
        ];
  const divider =
    "lg:before:absolute lg:before:inset-y-0 lg:before:left-0 lg:before:w-px lg:before:bg-[linear-gradient(180deg,transparent_0%,rgba(255,255,255,0.1)_50%,transparent_100%)]";
  return (
    <div className="w-full rounded-[1.25rem] bg-white/5 p-1 pt-2.5 backdrop-blur-2xl">
      <div className="flex w-full items-center justify-end px-2">
        <div className="flex shrink-0 items-center rounded-full sm:px-1.5">
          {(["claude", "chatgpt"] as const).map((c) => (
            <button
              key={c}
              onClick={() => setClient(c)}
              aria-pressed={client === c}
              className={`relative inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-full px-2 text-[14px] font-medium leading-5 transition-colors duration-150 motion-reduce:transition-none ${
                client === c ? "text-white" : "text-white/50 hover:text-white"
              }`}
            >
              {c === "claude" ? <ClaudeGlyph className="size-4" /> : <OpenAiGlyph className="size-4" />}
              <span className="px-1">{c === "claude" ? "Claude" : "ChatGPT"}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="relative mt-2.5 overflow-hidden rounded-2xl bg-black/30 p-5">
        <div className="grid grid-cols-1 lg:grid-cols-3">
          {steps.map((st, i) => (
            <article
              key={st.t}
              className={`relative flex min-h-[11.75rem] min-w-0 flex-col items-start pb-5 lg:px-6 lg:pb-0 ${
                i === 0 ? "lg:pl-0" : `border-t border-white/10 pt-6 lg:border-t-0 lg:pt-0 ${divider}`
              } ${i === 2 ? "lg:pr-0" : ""}`}
            >
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-[14px] font-semibold text-white">{i + 1}</div>
              <div className="mt-5 flex w-full min-w-0 flex-1 flex-col">
                <div className="flex min-w-0 flex-col gap-2">
                  <h3 className="text-[16px] font-medium leading-6 text-white">{st.t}</h3>
                  <div className="text-[14px] leading-5 text-[#898a8b] [&_strong]:font-normal [&_strong]:text-white">{st.d}</div>
                </div>
                <div className="mt-auto pt-6">
                  <button
                    type="button"
                    onClick={() => (st.copy ? onCopy(st.copy) : st.go ? openNew(st.go) : undefined)}
                    className="inline-flex h-10 w-full items-center justify-between gap-3 rounded-[0.625rem] bg-white/5 px-3 text-left text-[14px] leading-5 transition-colors hover:bg-white/10"
                  >
                    <code className="min-w-0 flex-1 truncate font-sans text-white">{st.field}</code>
                    {st.copy ? <Copy className="size-4 shrink-0 text-white" /> : st.go ? <ArrowUpRight className="size-4 shrink-0 text-white" /> : <Check className="size-4 shrink-0 text-white/60" />}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ClaudeGlyph({ className, white }: { className?: string; white?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={white ? "#fff" : "#D97757"} fillRule="evenodd" className={className} aria-hidden>
      <path d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z" />
    </svg>
  );
}

export function OpenAiGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" fillRule="evenodd" className={className} aria-hidden>
      <path d="M9.205 8.658v-2.26c0-.19.072-.333.238-.428l4.543-2.616c.619-.357 1.356-.523 2.117-.523 2.854 0 4.662 2.212 4.662 4.566 0 .167 0 .357-.024.547l-4.71-2.759a.797.797 0 00-.856 0l-5.97 3.473zm10.609 8.8V12.06c0-.333-.143-.57-.429-.737l-5.97-3.473 1.95-1.118a.433.433 0 01.476 0l4.543 2.617c1.309.76 2.189 2.378 2.189 3.948 0 1.808-1.07 3.473-2.76 4.163zM7.802 12.703l-1.95-1.142c-.167-.095-.239-.238-.239-.428V5.899c0-2.545 1.95-4.472 4.591-4.472 1 0 1.927.333 2.712.928L8.23 5.067c-.285.166-.428.404-.428.737v6.898zM12 15.128l-2.795-1.57v-3.33L12 8.658l2.795 1.57v3.33L12 15.128zm1.796 7.23c-1 0-1.927-.332-2.712-.927l4.686-2.712c.285-.166.428-.404.428-.737v-6.898l1.974 1.142c.167.095.238.238.238.428v5.233c0 2.545-1.974 4.472-4.614 4.472zm-5.637-5.303l-4.544-2.617c-1.308-.761-2.188-2.378-2.188-3.948A4.482 4.482 0 014.21 6.327v5.423c0 .333.143.571.428.738l5.947 3.449-1.95 1.118a.432.432 0 01-.476 0zm-.262 3.9c-2.688 0-4.662-2.021-4.662-4.519 0-.19.024-.38.047-.57l4.686 2.71c.286.167.571.167.856 0l5.97-3.448v2.26c0 .19-.07.333-.237.428l-4.543 2.616c-.619.357-1.356.523-2.117.523zm5.899 2.83a5.947 5.947 0 005.827-4.756C22.287 18.339 24 15.84 24 13.296c0-1.665-.713-3.282-1.998-4.448.119-.5.19-.999.19-1.498 0-3.401-2.759-5.947-5.946-5.947-.642 0-1.26.095-1.88.31A5.962 5.962 0 0010.205 0a5.947 5.947 0 00-5.827 4.757C1.713 5.447 0 7.945 0 10.49c0 1.666.713 3.283 1.998 4.448-.119.5-.19 1-.19 1.499 0 3.401 2.759 5.946 5.946 5.946.642 0 1.26-.095 1.88-.309a5.96 5.96 0 004.162 1.713z" />
    </svg>
  );
}

/** 页脚：照 BuzzVideo 官网 footer(logo + 社媒、右侧 Page Top、底行版权与条款),配色反成深色 */
const SOCIALS = [
  { icon: siTiktok, label: "TikTok", href: "https://www.tiktok.com/" },
  { icon: siYoutube, label: "YouTube", href: "https://www.youtube.com/" },
  { icon: siInstagram, label: "Instagram", href: "https://www.instagram.com/" },
];

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06]">
      <div className="mx-auto max-w-[1440px] px-5 pb-12 pt-14 sm:px-8 lg:px-10">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <Link href="/prototypes/mcp/skills" className="flex items-center gap-2">
              <BuzzLogo className="size-8" />
              <span className="whitespace-nowrap text-[19px] font-bold tracking-[-0.01em] text-white">BuzzVideo AI</span>
            </Link>
            <div className="flex items-center gap-2.5">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener"
                  aria-label={s.label}
                  className="flex size-8 items-center justify-center rounded-full bg-white text-[#131517] transition hover:bg-white/85"
                >
                  <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
                    <path d={s.icon.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex shrink-0 items-center gap-2 text-[16px] text-white/85 transition hover:text-white"
          >
            Page Top <CircleArrowUp className="size-5" strokeWidth={1.5} />
          </button>
        </div>
        <p className="mt-10 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] text-white/60">
          <span>© 2026 PressLogic Limited. All Rights Reserved.</span>
          {["Privacy Policy", "Terms of Service", "Contact"].map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <span aria-hidden>|</span>
              <a href="#" className="hover:text-white">
                {t}
              </a>
            </span>
          ))}
        </p>
      </div>
    </footer>
  );
}
