"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Check,
  Copy,
  Sparkles,
  Plus,
  Tag,
} from "lucide-react";
import { Reveal } from "@/components/reveal";
import { SiteHeader } from "@/components/site-header/site-header";

/* ============================================================================
   BuzzVideo MCP · 落地页(结构对标 magnific.com/mcp:深色 hero → 浅暖白 body → 深色 footer)
   - 复刻 Magnific 的信息架构与分段:hero + connect 面板(客户端 tabs)、
     inside-the-chat 能力行、大 demo、若干 feature 分段、MCP vs Agents 对比、
     Prompts 示例、FAQ、多栏 footer。文案为 BuzzVideo 原创,素材用真实 BuzzVideo 视频。
   - 反 AI 味:真实产出物 + 真接入命令 + 真渲染 in-client 聊天,零假截图、零 em-dash。
   ========================================================================== */

const ORANGE = "#ff6a1f";
const head = { fontFamily: "var(--font-bricolage)" } as const;

const CDN = "https://asset.buzzvideo.ai/buzzvideo/video";
const V = {
  p1: `${CDN}/2026/05/29/d4328730-24af-46ee-bc89-e26bbe325a32_a2a4cd65.mp4`,
  p2: `${CDN}/2026/05/29/c945fe67-451e-45c5-b366-f87163cb4dc4_475816e0.mp4`,
  p3: `${CDN}/2026/05/29/9bfad240-2a88-4c13-bbd1-40270292c083_aab1787b.mp4`,
  p4: `${CDN}/2026/05/29/63856cf7-367d-403a-8dea-e2df80488850_61460b08.mp4`,
  p5: `${CDN}/2026/05/29/2d0829c4-69f9-4321-95ef-20cb998ccc01_a1905c91.mp4`,
  p6: `${CDN}/2026/05/29/c74a1c85-be68-429f-9d19-b8e132ce379a_d0ec8bc8.mp4`,
  L1: `${CDN}/2026/05/29/2d4a2eff-b274-4ee0-a765-817e7c69e8b1_471ed688.mp4`,
  L2: `${CDN}/2026/05/29/c6279d82-5ec4-4dc0-89d9-76956d194de4_2f7f618f.mp4`,
  L3: `${CDN}/2026/05/29/c7f3d1ba-206f-4dc4-bddd-283f3487471f_3f5ed6a1.mp4`,
};

function Vid({ src, className = "", radius = "rounded-xl" }: { src: string; className?: string; radius?: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = wrap.current;
    const vid = ref.current;
    if (!el || !vid) return;
    vid.muted = true;
    const io = new IntersectionObserver(
      ([e]) => (e.isIntersecting ? vid.play().catch(() => {}) : vid.pause()),
      { rootMargin: "400px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={wrap} className={`relative overflow-hidden ${radius} ${className}`}>
      <video ref={ref} src={src} autoPlay muted loop playsInline preload="none" className="size-full bg-black/10 object-cover" />
    </div>
  );
}

/* ---------- Hero connect panel:客户端 tabs + 3 步 + URL(照 Magnific) ---------- */
/* 每个客户端有各自的接入步骤与连接方式 */
/* 连接面板:两轴(模式 MCP/CLI/Skill × 客户端)+ 三列编号步骤(照图 2 / 图 3 结构) */
const MODES = ["MCP", "CLI"] as const;
const PANEL_CLIENTS = ["Claude", "ChatGPT", "Cursor", "Codex", "VS Code", "OpenClaw", "Hermes"] as const;
type Mode = (typeof MODES)[number];
type Step = { t: string; d: string; action?: { kind: "url" | "cmd" | "button"; value: string } };

function stepsFor(mode: Mode, client: string): Step[] {
  if (mode === "MCP")
    return [
      { t: "Copy BuzzVideo URL", d: "Click the copy button. You will need it in the next step.", action: { kind: "url", value: "https://mcp.buzzvideo.ai" } },
      { t: "Open Settings, then Connectors", d: "Add a custom connector, name it BuzzVideo, and paste the URL.", action: { kind: "button", value: "BuzzVideo auth login" } },
      { t: "Connect and sign in", d: `Click Add, then Connect, and sign in with your BuzzVideo account. Now just ask ${client} to generate.` },
    ];
  return [
    { t: "Install and plug into your agent", d: 'Works with every agent. Then just say: "Generate a video with BuzzVideo."', action: { kind: "cmd", value: "npm install -g @buzzvideo/cli" } },
    { t: "Sign in", d: "Opens a browser, takes 5 seconds. Run the command and you are authenticated.", action: { kind: "cmd", value: "buzzvideo auth login" } },
    { t: "Run it", d: `Ask ${client} to generate, and it creates for you.` },
  ];
}

function CopyPill({ value, kind }: { value: string; kind: "url" | "cmd" }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };
  return (
    <button
      onClick={copy}
      className="inline-flex max-w-full items-center gap-2 rounded-lg border border-[#ff6a1f]/40 bg-[#ff6a1f]/10 px-3 py-2 font-mono text-[12.5px] text-[#ffb98a] transition hover:bg-[#ff6a1f]/15"
    >
      <span className="truncate">{value}</span>
      {copied ? <Check className="size-3.5 shrink-0 text-[#ff6a1f]" /> : <Copy className="size-3.5 shrink-0 opacity-70" />}
    </button>
  );
}

function ConnectPanel() {
  const [mode, setMode] = useState<Mode>("MCP");
  const [client, setClient] = useState<string>("Claude");
  const steps = stepsFor(mode, client);
  return (
    <div className="w-full max-w-[900px]">
      <div className="rounded-2xl border border-white/10 bg-white/15 p-5 backdrop-blur-lg md:p-6">
      {/* header:左模式 tabs,右客户端 tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex gap-1 rounded-full bg-black/25 p-1">
          {MODES.map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition ${
                m === mode ? "bg-white text-[#0c0b0e]" : "text-white/55 hover:text-white/80"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="inline-flex flex-wrap gap-1 rounded-full bg-black/25 p-1">
          {PANEL_CLIENTS.map((c) => (
            <button
              key={c}
              onClick={() => setClient(c)}
              className={`rounded-full px-3 py-1.5 text-[12.5px] font-medium transition ${
                c === client ? "bg-white text-[#0c0b0e]" : "text-white/45 hover:text-white/75"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* 三列编号步骤(固定最小高度:MCP/CLI 等高,切换不触发重排) */}
      <div className="mt-7 grid gap-8 md:min-h-[188px] md:grid-cols-3 md:gap-6">
        {steps.map((s, i) => (
          <div key={i} className="md:[&:not(:first-child)]:border-l md:[&:not(:first-child)]:border-white/10 md:[&:not(:first-child)]:pl-6">
            <span className="grid size-7 place-items-center rounded-full bg-white/10 text-[12px] font-bold text-white">{i + 1}</span>
            <h3 className="mt-4 text-[15px] font-bold text-white">{s.t}</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-white/45">{s.d}</p>
            {s.action && (
              <div className="mt-4">
                {s.action.kind === "button" ? (
                  <button className="inline-flex items-center gap-1.5 rounded-lg bg-[#ff6a1f] px-3.5 py-2 text-[12.5px] font-bold text-[#15110c] transition hover:bg-[#ff7d3a]">
                    {s.action.value}
                    <ArrowUpRight className="size-3.5" />
                  </button>
                ) : (
                  <CopyPill value={s.action.value} kind={s.action.kind} />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      </div>

      {/* 卡片下方的提示(不在卡内) */}
      <p className="mt-4 text-center text-[12.5px] text-white/45">
        Using Claude Code, Codex, or another CLI agent? The CLI is the fastest way to connect.
      </p>
    </div>
  );
}

/* ---------- Agent 产出卡(真实渲染 mini agent UI:编号 + prompt + 真视频产出 + 结果 chip) ---------- */
function ToolkitCard({ prompt, vid, chips }: { prompt: string; vid: string; chips: string[] }) {
  return (
    <div className="rounded-2xl border border-black/[0.06] bg-[#f6f5f2] p-4 shadow-[0_2px_10px_rgba(23,21,15,0.06)]">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-[#ff6a1f] text-[11px] font-bold text-white">1</span>
        <p className="flex-1 rounded-xl bg-white px-3 py-2 text-[12.5px] leading-snug text-[#3a362f] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">{prompt}</p>
      </div>
      <div className="mt-3 overflow-hidden rounded-xl border border-black/[0.06] bg-black">
        <Vid src={vid} radius="rounded-none" className="aspect-video w-full" />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {chips.map((c) => (
          <span key={c} className="rounded-md bg-white px-2.5 py-1 text-[11px] font-medium text-[#6f6a61] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">{c}</span>
        ))}
        <span className="ml-auto grid size-6 place-items-center rounded-md bg-[#171512] text-white">
          <svg viewBox="0 0 24 24" fill="currentColor" className="size-3"><path d="M8 5v14l11-7z" /></svg>
        </span>
      </div>
    </div>
  );
}

/* ============================ HERO (dark, left-aligned) ============================
   sentinel 放在 hero 末尾:滚过它 → header 变实底(浅色 body 上)。 */
function Hero({ heroRef }: { heroRef: React.Ref<HTMLElement> }) {
  return (
    <section ref={heroRef} className="relative flex min-h-[86vh] flex-col justify-center overflow-hidden bg-[#0c0b0e] px-6 pb-24 pt-64 text-[#f4f1ec]">
      {/* hero 背景图 + 50% 黑蒙版 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-08/333171937956126720.png"
        alt=""
        aria-hidden
        className="absolute inset-0 size-full object-cover"
      />
      <div aria-hidden className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 mx-auto max-w-[1320px]">
        <h1 className="max-w-[20ch] text-[clamp(38px,6vw,76px)] font-extrabold leading-[0.98] tracking-[-0.03em]" style={head}>
          BuzzVideo MCP for any AI
        </h1>
        <p className="mt-6 max-w-[52ch] text-[clamp(16px,1.6vw,19px)] leading-relaxed text-white/60">
          Connect once. Generate video and images from the chats you already use.
        </p>
        {/* free-trial 提示条(干净深色玻璃 + 橙徽章) */}
        <a
          href="#"
          className="group mt-6 inline-flex items-center gap-2.5 rounded-xl bg-black/40 px-4 py-2.5 backdrop-blur-md transition hover:bg-black/50 active:scale-[0.99]"
        >
          <Tag className="size-4 shrink-0 text-[#ff6a1f]" strokeWidth={2} />
          <span className="text-[14px] font-medium text-white">
            Connect MCP &amp; access unlimited generations
          </span>
          <span className="ml-1 inline-flex items-center gap-1 rounded-md bg-[#ff6a1f] px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-white">
            Upgrade
            <ArrowUpRight className="size-3" strokeWidth={2.5} />
          </span>
        </a>
        <div className="mt-10">
          <ConnectPanel />
        </div>
      </div>
    </section>
  );
}

/* ============================ THE ENTIRE TOOLKIT ============================
   居中大标题 + 交替行:一侧 agent 产出卡,一侧 category + 大写 outcome 标题 + 深色 CTA。 */
const TOOLKIT = [
  {
    cat: "Video analyzer",
    t: "Turn any video into a prompt",
    d: "Drop in a reference clip and BuzzVideo breaks down its structure, pacing, and shots, then hands back a ready-to-run prompt.",
    cta: "Analyze a video",
    prompt: "Analyze this clip and recreate the look.",
    vid: V.L1,
    chips: ["All scenes", "Copy breakdown", "Recreate"],
  },
  {
    cat: "Marketing video generator",
    t: "Turn product pages into launch videos",
    d: "Paste a product URL and BuzzVideo pulls the details it needs to build a polished launch video.",
    cta: "Generate a video",
    prompt: "Make a launch video from this product URL.",
    vid: V.p4,
    chips: ["Download", "Predict virality", "Regenerate"],
  },
  {
    cat: "Character training",
    t: "Train a reusable brand character",
    d: "Upload reference photos once, then reuse the same consistent character across campaigns, videos, and posts.",
    cta: "Train a character",
    prompt: "Train a character named Maya from these photos.",
    vid: V.p2,
    chips: ["20+ photos", "One style"],
  },
  {
    cat: "Image to video",
    t: "Animate product shots with cinematic motion",
    d: "Start from a still, pick a camera-move preset, and BuzzVideo animates it into a cinematic shot.",
    cta: "Animate an image",
    prompt: "Animate this product photo, slow 360 orbit.",
    vid: V.p5,
    chips: ["Download", "Regenerate"],
  },
  {
    cat: "Clip generator",
    t: "Cut long videos into social clips",
    d: "Send a long video and BuzzVideo finds the vertical moments, adds subtitles, and formats them for Reels or TikTok.",
    cta: "Create clips",
    prompt: "Cut this interview into 3 vertical clips with subtitles.",
    vid: V.L2,
    chips: ["3 clips", "9:16", "Subtitles"],
  },
  {
    cat: "Virality prediction",
    t: "Score the hook before you publish",
    d: "Check hook strength, retention risk, and viral potential before a video goes live.",
    cta: "Score a video",
    prompt: "Score this video's hook and retention risk.",
    vid: V.p6,
    chips: ["Hook 78", "Retention"],
  },
];

function Toolkit() {
  return (
    <section className="bg-[#f2f0ec] px-6 py-24 text-[#171512] md:py-28">
      <div className="mx-auto max-w-[1200px]">
        <Reveal>
          <h2 className="text-center text-[clamp(28px,4vw,46px)] font-extrabold uppercase tracking-[-0.01em]" style={head}>
            The entire toolkit
          </h2>
        </Reveal>
        <div className="mt-16 flex flex-col gap-20 md:mt-20 md:gap-28">
          {TOOLKIT.map((f, i) => {
            const cardLeft = i % 2 === 0;
            return (
              <div key={f.t} className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
                <Reveal className={cardLeft ? "lg:order-1" : "lg:order-2"}>
                  <ToolkitCard prompt={f.prompt} vid={f.vid} chips={f.chips} />
                </Reveal>
                <Reveal delay={90} className={cardLeft ? "lg:order-2" : "lg:order-1"}>
                  <div>
                    <div className="mb-3 text-[12.5px] font-semibold text-[#8a857b]">{f.cat}</div>
                    <h3 className="max-w-[16ch] text-[clamp(24px,3vw,38px)] font-extrabold uppercase leading-[1.04] tracking-[-0.01em]" style={head}>
                      {f.t}
                    </h3>
                    <p className="mt-4 max-w-[42ch] text-[15px] leading-relaxed text-[#5f5a51]">{f.d}</p>
                    <button className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-[#171512] px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-black active:scale-[0.98]">
                      {f.cta}
                    </button>
                  </div>
                </Reveal>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ============================ FAQ ============================ */
const FAQ = [
  { q: "Where does BuzzVideo MCP work?", a: "Any MCP-compatible client, including Claude Desktop, Claude Code, ChatGPT, Cursor, Codex, VS Code, and Gemini." },
  { q: "Which models can I call?", a: "The current top image and video models, routed automatically. New models become available through the same connection." },
  { q: "Can I generate video with audio?", a: "Yes. Ask for a clip with sound and BuzzVideo returns a video with a matched audio track." },
  { q: "Can I run bulk operations?", a: "Yes. Batch requests like resizing a hero shot into every social format run in one message." },
  { q: "Does my plan cover the MCP?", a: "Yes. You sign in with your BuzzVideo account, so your plan, credits, and saved styles all work the same." },
  { q: "How is my data handled?", a: "Renders are tied to your account and follow the same privacy and retention rules as the BuzzVideo web app." },
  { q: "How do I know which model is used?", a: "BuzzVideo names the model it rendered with in its reply, and you can request a specific one anytime." },
  { q: "What is the difference between the MCP and the API?", a: "The MCP is a no-code connection for chat clients. The API is for building BuzzVideo into your own product." },
];

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="bg-[#f2f0ec] px-6 py-24 text-[#171512] md:py-28">
      <div className="mx-auto grid max-w-[1100px] gap-12 md:grid-cols-[0.8fr_1.2fr]">
        <Reveal>
          <h2 className="text-[clamp(28px,4vw,48px)] font-extrabold tracking-[-0.02em]" style={head}>FAQs</h2>
        </Reveal>
        <Reveal delay={80}>
          <div>
            {FAQ.map((f, i) => {
              const isOpen = open === i;
              return (
                <div key={i} className="border-t border-black/10 last:border-b">
                  <button onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen} className="flex w-full items-center justify-between gap-6 py-5 text-left">
                    <span className="text-[16px] font-semibold" style={head}>{f.q}</span>
                    <span className="grid size-7 shrink-0 place-items-center rounded-full border border-black/15 transition" style={{ transform: isOpen ? "rotate(45deg)" : "none", borderColor: isOpen ? ORANGE : undefined, color: isOpen ? ORANGE : undefined }}>
                      <Plus className="size-4" />
                    </span>
                  </button>
                  <div className="grid transition-all duration-300 ease-out" style={{ gridTemplateRows: isOpen ? "1fr" : "0fr", opacity: isOpen ? 1 : 0 }}>
                    <div className="overflow-hidden">
                      <p className="max-w-[60ch] pb-5 text-[15px] leading-relaxed text-[#5f5a51]">{f.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ============================ FOOTER (dark) ============================ */
const FOOTER = [
  { h: "Product", items: ["Images", "Videos", "Editor", "Models", "Pricing"] },
  { h: "Clients", items: ["Claude", "ChatGPT", "Cursor", "VS Code", "Gemini"] },
  { h: "Resources", items: ["Docs", "API", "Status", "Changelog", "Support"] },
  { h: "Company", items: ["About", "Blog", "Careers", "Privacy", "Terms"] },
];

function Footer() {
  return (
    <footer className="bg-[#0c0b0e] px-6 py-16 text-[#f4f1ec]">
      <div className="mx-auto grid max-w-[1320px] gap-12 md:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div>
          <div className="flex items-center gap-2 font-extrabold tracking-tight" style={head}>
            <span className="grid size-7 place-items-center rounded-md text-[#15110c]" style={{ background: `linear-gradient(135deg,#ff9a3d,${ORANGE})` }}>
              <svg viewBox="0 0 24 24" fill="currentColor" className="size-3.5"><path d="M8 5v14l11-7z" /></svg>
            </span>
            <span className="text-[16px]">BuzzVideo</span>
          </div>
          <p className="mt-4 max-w-[30ch] text-[13.5px] leading-relaxed text-white/45">
            A video and image studio for every AI, one connection away.
          </p>
        </div>
        {FOOTER.map((col) => (
          <div key={col.h}>
            <div className="mb-4 text-[13px] font-semibold text-white/80">{col.h}</div>
            <ul className="space-y-2.5">
              {col.items.map((it) => (
                <li key={it}><a href="#" className="text-[14px] text-white/55 transition hover:text-white">{it}</a></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-14 flex max-w-[1320px] flex-col gap-3 border-t border-white/8 pt-8 text-[13px] text-white/40 sm:flex-row sm:items-center sm:justify-between">
        <span>© 2026 PressLogic. All rights reserved.</span>
        <span>BuzzVideo MCP</span>
      </div>
    </footer>
  );
}

export default function BuzzVideoMcpMagnificPage() {
  // header 透明覆在深色 hero 上;hero 完全滚出后切实底白(浅色 body 上)。
  // 观测整个 hero(高元素,比例平滑变化),避免 1px sentinel 被快速/跳转滚动跨过而不触发回调。
  const hero = useRef<HTMLElement>(null);
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const el = hero.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setSolid(!e.isIntersecting), {
      rootMargin: "-64px 0px 0px 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <main className="bg-[#f2f0ec] selection:bg-[#ff6a1f] selection:text-[#15110c]" style={{ fontFamily: "var(--font-sans)" }}>
      {/* 隐藏页面滚动条(仍可滚动) */}
      <style>{`
        html { scrollbar-width: none; -ms-overflow-style: none; }
        html::-webkit-scrollbar { width: 0; height: 0; display: none; }
      `}</style>
      <SiteHeader solid={solid} notify={() => {}} />
      <Hero heroRef={hero} />
      <Toolkit />
      <Faq />
    </main>
  );
}
