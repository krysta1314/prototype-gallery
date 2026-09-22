"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  Check,
  Copy,
  ExternalLink,
  Sparkles,
  Plus,
  Tag,
  BarChart3,
  RectangleHorizontal,
  Clock,
  Volume2,
  Download,
  RefreshCw,
  VolumeX,
  type LucideIcon,
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
  p5: `${CDN}/2026/07/09/8e587c86-c8a9-4459-b689-d5c7decf56c9_fd8afe68.mp4`,
  p6: `${CDN}/2026/05/29/c74a1c85-be68-429f-9d19-b8e132ce379a_d0ec8bc8.mp4`,
  L1: `${CDN}/2026/05/29/2d4a2eff-b274-4ee0-a765-817e7c69e8b1_471ed688.mp4`,
  L2: `${CDN}/2026/05/29/c6279d82-5ec4-4dc0-89d9-76956d194de4_2f7f618f.mp4`,
  L3: `${CDN}/2026/05/29/c7f3d1ba-206f-4dc4-bddd-283f3487471f_3f5ed6a1.mp4`,
};

function Vid({ src, className = "", radius = "rounded-xl", muteToggle = false }: { src: string; className?: string; radius?: string; muteToggle?: boolean }) {
  const wrap = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
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
  const toggleMute = () => {
    const vid = ref.current;
    if (!vid) return;
    vid.muted = !vid.muted;
    setMuted(vid.muted);
  };
  return (
    <div ref={wrap} className={`relative overflow-hidden ${radius} ${className}`}>
      <video ref={ref} src={src} autoPlay muted loop playsInline preload="none" className="size-full bg-black/10 object-cover" />
      {muteToggle && (
        <button
          onClick={toggleMute}
          aria-label={muted ? "Unmute" : "Mute"}
          className="absolute bottom-2 right-2 grid size-6 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/60"
        >
          {muted ? <VolumeX className="size-3.5" strokeWidth={2} /> : <Volume2 className="size-3.5" strokeWidth={2} />}
        </button>
      )}
    </div>
  );
}

/* ---------- Hero connect panel:客户端 tabs + 3 步 + URL(照 Magnific) ---------- */
/* 每个客户端有各自的接入步骤与连接方式 */
/* 连接面板:模式只留 MCP(CLI / Skill 两个 tab 已按需求去掉)× 客户端 + 三列编号步骤 */
const MODES = ["MCP"] as const;
const PANEL_CLIENTS = ["ChatGPT", "Claude", "Grok Bot"] as const;
type Mode = (typeof MODES)[number];
type Step = {
  t: string;
  d: string;
  hi?: string[];
  /** ghost = 描边幽灵按钮(外链),solid = 白底实心按钮(带客户端图标),url/cmd = 可复制胶囊 */
  action?: { kind: "url" | "cmd" | "ghost" | "solid"; value: string; href?: string };
};

function stepsFor(mode: Mode, client: string): Step[] {
  // 标题里的 [bv] 会渲染成 BuzzVideo 品牌图标,[>] 渲染成箭头。
  // 第一步给描边幽灵按钮(跳出去装),最后一步给白底实心按钮(回到客户端里开始用),
  // 主次靠按钮权重区分,不靠文案强调。
  const finalStep: Step = {
    t: "Connect and start creating",
    d: `After signing in, ask ${client} to generate an image or video with BuzzVideo.`,
    hi: ["generate an image or video with BuzzVideo."],
    action: { kind: "solid", value: "Start creating" },
  };

  // Claude 走「复制 URL → Customize → 连上」的三步:它没有插件目录,要手动粘 connector URL
  if (client === "Claude") {
    return [
      {
        t: "Copy the[bv]BuzzVideo connector URL",
        d: "You'll paste this URL into Claude in the next step",
        action: { kind: "url", value: "https://mcp.buzzvideo.ai/mcp" },
      },
      {
        t: "Go to Claude[>]Customize",
        d: "In Claude desktop or claude.ai, go to Customize[>]Connectors. Name it BuzzVideo and paste the URL",
        hi: ["BuzzVideo"],
        action: { kind: "ghost", value: "Open Claude Customize" },
      },
      {
        t: "Connect, sign in and start",
        d: "Sign in, then ask Claude to generate an image or video with BuzzVideo.",
        hi: ["generate an image or video with BuzzVideo."],
        action: { kind: "solid", value: "Start creating" },
      },
    ];
  }

  // Grok Bot 是需要先装的独立应用,比网页版客户端多一步 install
  if (client === "Grok Bot") {
    return [
      {
        t: "Install Grok Bot",
        d: "Download and install Grok Bot before adding the BuzzVideo plugin",
        action: { kind: "ghost", value: "Install Grok Bot", href: "https://x.ai/bot" },
      },
      {
        t: "Add[bv]BuzzVideo plugin to Grok Bot",
        d: "Add the BuzzVideo plugin, then sign in to connect your account",
        action: { kind: "ghost", value: "Add BuzzVideo plugin" },
      },
      // 图 1 里 Grok Bot 第三步没有按钮:前两步已经各有一个跳出去的按钮,
      // 第三步是「回到 Grok Bot 里说句话」,没有可点的落点
      { ...finalStep, action: undefined },
    ];
  }

  return [
    {
      t: `Add[bv]BuzzVideo plugin to ${client}`,
      d: "Find BuzzVideo in the Plugins Directory or click the button below. Then click Add and sign in",
      hi: ["BuzzVideo"],
      action: { kind: "ghost", value: "Add BuzzVideo plugin" },
    },
    finalStep,
  ];
}

/* 下方各区块的 CTA 统一滚回顶部的连接面板(原型里没有真实落地页) */
function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
  });
}

/* BuzzVideo 品牌图标(官方 logo.svg,渐变 id 加前缀避免与页面其它 svg 撞) */
function BuzzGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden>
      <path fillRule="evenodd" clipRule="evenodd" d="M27.4314 23.0865C27.4314 20.2419 25.7419 18.2453 23.3585 17.3929C22.5004 17.0873 21.559 16.9285 20.5696 16.9285L19.2279 18.5639L11.1557 28.4007L11.2613 22.8104C11.3181 19.7644 10.2453 18.1247 7.09167 18.1507L5.15548 18.1637L14.1691 6.3469L14.1913 13.1933C14.1993 15.4519 15.383 16.8078 17.7984 16.9285C20.9955 16.9285 23.6087 14.3677 23.6087 11.2436C23.6087 8.11513 20.9955 5.55957 17.7984 5.55957H8.67188C6.78626 5.55957 5.84345 5.55957 5.25766 6.14536C4.67188 6.73114 4.67188 7.67395 4.67188 9.55957V25.2445C4.67188 27.1301 4.67188 28.0729 5.25766 28.6587C5.84345 29.2445 6.78626 29.2445 8.67188 29.2445H21.1366C24.599 29.2445 27.4314 26.4728 27.4314 23.0865Z" fill="url(#bv-glyph-a)" />
      <path d="M24.9326 0.650635C25.2625 3.07517 27.3071 4.95474 29.7635 4.95495C27.3074 4.95516 25.2629 6.83431 24.9326 9.25842C24.6022 6.83436 22.5576 4.95526 20.1016 4.95495C22.5579 4.95465 24.6026 3.07512 24.9326 0.650635Z" fill="url(#bv-glyph-b)" />
      <defs>
        <linearGradient id="bv-glyph-a" x1="4.67188" y1="5.55957" x2="32.3461" y2="19.4595" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFA73C" />
          <stop offset="0.966346" stopColor="#FF5255" />
        </linearGradient>
        <linearGradient id="bv-glyph-b" x1="20.1016" y1="0.650635" x2="31.0463" y2="7.07198" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFA73C" />
          <stop offset="0.966346" stopColor="#FF5255" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* MCP (Model Context Protocol) 官方字形 */
function McpGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" fillRule="evenodd" className={className} aria-hidden>
      <path d="M15.688 2.343a2.588 2.588 0 00-3.61 0l-9.626 9.44a.863.863 0 01-1.203 0 .823.823 0 010-1.18l9.626-9.44a4.313 4.313 0 016.016 0 4.116 4.116 0 011.204 3.54 4.3 4.3 0 013.609 1.18l.05.05a4.115 4.115 0 010 5.9l-8.706 8.537a.274.274 0 000 .393l1.788 1.754a.823.823 0 010 1.18.863.863 0 01-1.203 0l-1.788-1.753a1.92 1.92 0 010-2.754l8.706-8.538a2.47 2.47 0 000-3.54l-.05-.049a2.588 2.588 0 00-3.607-.003l-7.172 7.034-.002.002-.098.097a.863.863 0 01-1.204 0 .823.823 0 010-1.18l7.273-7.133a2.47 2.47 0 00-.003-3.537z" />
      <path d="M14.485 4.703a.823.823 0 000-1.18.863.863 0 00-1.204 0l-7.119 6.982a4.115 4.115 0 000 5.9 4.314 4.314 0 006.016 0l7.12-6.982a.823.823 0 000-1.18.863.863 0 00-1.204 0l-7.119 6.982a2.588 2.588 0 01-3.61 0 2.47 2.47 0 010-3.54l7.12-6.982z" />
    </svg>
  );
}

/* Claude 官方字形 */
function ClaudeGlyph({ className }: { className?: string }) {
  return (
    // 官方彩色版:固定品牌橙,不跟 currentColor —— 选中态底色转白时它仍然认得出
    <svg viewBox="0 0 24 24" fill="#D97757" fillRule="evenodd" className={className} aria-hidden>
      <path d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z" />
    </svg>
  );
}

/* OpenAI (ChatGPT) 官方字形 */
function OpenAiGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" fillRule="evenodd" className={className} aria-hidden>
      <path d="M9.205 8.658v-2.26c0-.19.072-.333.238-.428l4.543-2.616c.619-.357 1.356-.523 2.117-.523 2.854 0 4.662 2.212 4.662 4.566 0 .167 0 .357-.024.547l-4.71-2.759a.797.797 0 00-.856 0l-5.97 3.473zm10.609 8.8V12.06c0-.333-.143-.57-.429-.737l-5.97-3.473 1.95-1.118a.433.433 0 01.476 0l4.543 2.617c1.309.76 2.189 2.378 2.189 3.948 0 1.808-1.07 3.473-2.76 4.163zM7.802 12.703l-1.95-1.142c-.167-.095-.239-.238-.239-.428V5.899c0-2.545 1.95-4.472 4.591-4.472 1 0 1.927.333 2.712.928L8.23 5.067c-.285.166-.428.404-.428.737v6.898zM12 15.128l-2.795-1.57v-3.33L12 8.658l2.795 1.57v3.33L12 15.128zm1.796 7.23c-1 0-1.927-.332-2.712-.927l4.686-2.712c.285-.166.428-.404.428-.737v-6.898l1.974 1.142c.167.095.238.238.238.428v5.233c0 2.545-1.974 4.472-4.614 4.472zm-5.637-5.303l-4.544-2.617c-1.308-.761-2.188-2.378-2.188-3.948A4.482 4.482 0 014.21 6.327v5.423c0 .333.143.571.428.738l5.947 3.449-1.95 1.118a.432.432 0 01-.476 0zm-.262 3.9c-2.688 0-4.662-2.021-4.662-4.519 0-.19.024-.38.047-.57l4.686 2.71c.286.167.571.167.856 0l5.97-3.448v2.26c0 .19-.07.333-.237.428l-4.543 2.616c-.619.357-1.356.523-2.117.523zm5.899 2.83a5.947 5.947 0 005.827-4.756C22.287 18.339 24 15.84 24 13.296c0-1.665-.713-3.282-1.998-4.448.119-.5.19-.999.19-1.498 0-3.401-2.759-5.947-5.946-5.947-.642 0-1.26.095-1.88.31A5.962 5.962 0 0010.205 0a5.947 5.947 0 00-5.827 4.757C1.713 5.447 0 7.945 0 10.49c0 1.666.713 3.283 1.998 4.448-.119.5-.19 1-.19 1.499 0 3.401 2.759 5.946 5.946 5.946.642 0 1.26-.095 1.88-.309a5.96 5.96 0 004.162 1.713z" />
    </svg>
  );
}

/* Grok 字形。原稿是「白圆 + 黑色记号」三段路径,那样在选中态的白底上整个圆会消失;
   这里合成一条路径走 evenodd,让记号从圆里镂空出来,单色跟随 currentColor,
   和这一排其它字形的行为一致,深底浅底都认得出。
   viewBox 收到图形实际边界(原稿只占 24×24 的中间约 61%,不收的话同样 size 下会比
   Claude / ChatGPT 明显小一圈)。 */
function GrokGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="4.6 4.6 15.2 15.2" fill="currentColor" fillRule="evenodd" clipRule="evenodd" className={className} aria-hidden>
      <path d="M11.625 4.75916C15.6777 4.50184 19.1704 7.58146 19.4225 11.6345C19.6746 15.6875 16.5905 19.1762 12.5372 19.423C8.49119 19.6695 5.01021 16.5923 4.75856 12.5466C4.50691 8.50096 7.57971 5.01603 11.625 4.75916Z M12.0828 8.25977C12.929 8.26003 12.953 8.87363 13.3058 9.48718C13.6262 10.0445 13.8786 10.6459 13.0794 10.9323C12.3606 11.0373 12.0822 9.85397 11.7776 9.37397C11.4848 8.91258 11.4272 8.41032 12.0828 8.25977Z M15.0385 7.52298C15.2174 7.48551 15.3807 7.58436 15.7677 7.97224C16.1548 8.36012 16.8465 9.81042 16.4798 10.1111C16.2553 10.1701 15.9677 10.1242 15.8276 9.92287C15.6301 9.63895 15.5109 9.31031 15.3602 8.99988C15.1755 8.61927 14.9692 8.24409 14.7961 7.85878C14.7279 7.75201 14.8596 7.56046 15.0385 7.52298Z" />
    </svg>
  );
}

const CLIENT_GLYPH: Record<string, (p: { className?: string }) => React.ReactElement> = {
  ChatGPT: OpenAiGlyph,
  Claude: ClaudeGlyph,
  "Grok Bot": GrokGlyph,
};

/* 在描述里把指定词组高亮成白色,其余保持灰色 */
function highlight(text: string, hi: string[] | undefined, keyPrefix: string): React.ReactNode[] {
  if (!hi || hi.length === 0) return [text];
  const esc = hi.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`(${esc.join("|")})`, "g");
  return text.split(re).map((part, i) =>
    hi.includes(part) ? (
      <span key={`${keyPrefix}-${i}`} className="text-white">{part}</span>
    ) : (
      part
    ),
  );
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
      className="inline-flex h-11 max-w-full items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 font-mono text-[13px] text-white/90 transition hover:bg-black/40"
    >
      <span className="truncate">{value}</span>
      {copied ? <Check className="ml-auto size-4 shrink-0 text-[#ff6a1f]" /> : <Copy className="ml-auto size-4 shrink-0 text-white/50" />}
    </button>
  );
}

function ConnectPanel() {
  const [mode, setMode] = useState<Mode>("MCP");
  const [client, setClient] = useState<string>(PANEL_CLIENTS[0]);
  // 所有客户端都显示 MCP / CLI / Skill;OpenClaw/Hermes 的 MCP、Skill 复用标准流程,CLI 各自专属
  const availableModes: readonly Mode[] = MODES;
  const activeMode: Mode = mode;
  const steps = stepsFor(activeMode, client);
  const ClientGlyph = CLIENT_GLYPH[client];
  return (
    <div className="w-full max-w-[1280px]">
      <div className="rounded-2xl border border-white/10 bg-white/15 p-5 backdrop-blur-lg md:p-6">
      {/* header:左模式 tabs,右客户端 tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex flex-wrap gap-1 rounded-full bg-black/25 p-1">
            {PANEL_CLIENTS.map((c) => {
              const Glyph = CLIENT_GLYPH[c];
              return (
                <button
                  key={c}
                  onClick={() => setClient(c)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium transition ${
                    c === client ? "bg-white text-[#0c0b0e]" : "text-white/45 hover:text-white/75"
                  }`}
                >
                  {Glyph && <Glyph className="size-3.5" />}
                  {c}
                </button>
              );
            })}
        </div>
        <div className="inline-flex gap-1 rounded-full bg-black/25 p-1">
          {availableModes.map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                // MCP 对 OpenClaw/Hermes 无原生流程,点 MCP 时把客户端切回 Claude
                if (m === "MCP" && (client === "OpenClaw" || client === "Hermes")) setClient("Claude");
              }}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-semibold transition ${
                m === activeMode ? "bg-white text-[#0c0b0e]" : "text-white/55 hover:text-white/80"
              }`}
            >
              <McpGlyph className="size-3.5" />
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* 两列编号步骤,中间一条竖分隔线 */}
      <div className={`mt-7 grid gap-8 md:min-h-[188px] md:gap-6 ${steps.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
        {steps.map((s, i) => (
          <div key={`${client}-${i}`} className="flex h-full flex-col md:[&:not(:first-child)]:border-l md:[&:not(:first-child)]:border-white/10 md:[&:not(:first-child)]:pl-6">
            <span className="grid size-7 place-items-center rounded-full bg-white/10 text-[12px] font-bold text-white">{i + 1}</span>
            <h3 className="mt-4 flex flex-wrap items-center gap-x-1.5 text-[15px] font-bold text-white">
              {s.t.split(/(\[>\]|\[bv\])/).map((part, idx) =>
                part === "[>]" ? (
                  <ArrowRight key={idx} className="size-3.5 shrink-0" strokeWidth={2.5} />
                ) : part === "[bv]" ? (
                  <BuzzGlyph key={idx} className="size-[18px] shrink-0" />
                ) : (
                  <span key={idx}>{part}</span>
                ),
              )}
            </h3>
            <p className="mt-1.5 text-[14px] leading-relaxed text-white/75">
              {s.d.split("[>]").flatMap((part, idx) => {
                const seg = highlight(part, s.hi, `d${idx}`);
                return idx === 0
                  ? seg
                  : [<ArrowRight key={`d${idx}`} className="mx-1 inline-block size-3.5 shrink-0 -translate-y-px align-middle" strokeWidth={2.5} />, ...seg];
              })}
            </p>
            {s.action && (
              <div className="mt-auto pt-5">
                {s.action.kind === "ghost" ? (
                  (() => {
                    const ghostCls =
                      "inline-flex h-11 items-center gap-2 rounded-xl border border-white/20 px-4 text-[12.5px] font-bold text-white transition hover:border-white/40 hover:bg-white/5";
                    const inner = (
                      <>
                        <ExternalLink className="size-3.5" strokeWidth={2.5} />
                        {s.action!.value}
                      </>
                    );
                    return s.action!.href ? (
                      <a href={s.action!.href} target="_blank" rel="noreferrer" className={ghostCls}>
                        {inner}
                      </a>
                    ) : (
                      <button className={ghostCls}>{inner}</button>
                    );
                  })()
                ) : s.action.kind === "solid" ? (
                  <button className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-4 text-[12.5px] font-bold text-[#0c0b0e] transition hover:bg-white/90">
                    {ClientGlyph && <ClientGlyph className="size-4" />}
                    {s.action.value}
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

    </div>
  );
}

/* ---------- Agent 产出卡(真实渲染 mini agent UI) ---------- */
type ChatAction = { label: string; icon?: LucideIcon; primary?: boolean; badge?: string };
type ChatConfig = { icon: LucideIcon; label: string };
type ChatMsg = { prompt: string; refImg?: string; vid: string; config?: ChatConfig[]; caption?: string; actions: ChatAction[] };
type Analyzer = {
  prompt: string;
  refImg?: string;
  vid: string;
  config?: ChatConfig[];
};

/* 幽灵/主按钮动作 */
function ActionButton({ a }: { a: ChatAction }) {
  return a.primary ? (
    <button className="inline-flex items-center gap-1 rounded-lg bg-[#ff6a1f] px-2.5 py-1 text-[11px] font-bold text-white transition hover:bg-[#ff7d3a]">
      {a.icon && <a.icon className="size-3" strokeWidth={2.5} />}
      {a.label}
    </button>
  ) : (
    <button className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-[11px] font-medium text-[#6f6a61] shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition hover:text-[#3a362f]">
      {a.icon && <a.icon className="size-3" strokeWidth={2} />}
      {a.label}
      {a.badge && <span className="ml-0.5 rounded bg-black/[0.06] px-1 py-px text-[9px] font-semibold text-[#8a857b]">{a.badge}</span>}
    </button>
  );
}

/* UGC Ads Maker 卡:输入(参考图 + prompt)→ 参数胶囊 → 产出视频 → 下载/重新生成 */
function AnalyzerCard({ a, n }: { a: Analyzer; n: number }) {
  return (
    <div className="w-[560px] max-w-full rounded-2xl border border-black/[0.06] bg-[#f6f5f2] p-4 shadow-[0_2px_10px_rgba(23,21,15,0.06)]">
      {/* 输入消息:编号 + 右对齐用户气泡(参考图靠左 + prompt) */}
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-[#ff6a1f] text-[11px] font-bold text-white">{n}</span>
        <div className="ml-auto min-w-0 max-w-[440px] rounded-xl bg-white p-2 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          {a.refImg && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={a.refImg} alt="Image1" className="mb-2 block size-14 rounded-lg border border-black/[0.06] object-cover" />
          )}
          <p className="break-words px-1 pt-0.5 text-[12.5px] leading-snug text-[#3a362f]">{a.prompt}</p>
        </div>
      </div>
      {/* 模型参数 chips */}
      {a.config && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {a.config.map((c) => (
            <span key={c.label} className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-[#6f6a61] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              <c.icon className="size-3 text-[#9a958b]" strokeWidth={2} />
              {c.label}
            </span>
          ))}
        </div>
      )}
      {/* 产出视频 */}
      <div className="mt-3">
        <Vid src={a.vid} radius="rounded-xl" className="aspect-video w-full" muteToggle />
      </div>
      {/* 动作 */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <ActionButton a={DL} />
        <ActionButton a={RG} />
      </div>
    </div>
  );
}

/* Agent 对话卡:两轮(提问 → 带模型参数的产出) */
function ChatCard({ chat, n }: { chat: ChatMsg[]; n: number }) {
  return (
    <div className="w-[560px] max-w-full rounded-2xl border border-black/[0.06] bg-[#f6f5f2] p-4 shadow-[0_2px_10px_rgba(23,21,15,0.06)]">
      {chat.map((m, i) => (
        <div key={i} className={i === 0 ? "" : "mt-5"}>
          {/* 提问行:编号 + 右对齐气泡 */}
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-[#ff6a1f] text-[11px] font-bold text-white">{i === 0 ? n : i + 1}</span>
            <div className="ml-auto min-w-0 max-w-[440px] rounded-xl bg-white px-3 py-2 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              {m.refImg && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={m.refImg} alt="Image1" className="mb-2 block size-14 rounded-lg border border-black/[0.06] object-cover" />
              )}
              <p className="break-words text-[12.5px] leading-snug text-[#3a362f]">{m.prompt}</p>
            </div>
          </div>
          {/* 模型参数 chips */}
          {m.config && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {m.config.map((c) => (
                <span key={c.label} className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-[#6f6a61] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                  <c.icon className="size-3 text-[#9a958b]" strokeWidth={2} />
                  {c.label}
                </span>
              ))}
            </div>
          )}
          {/* 产出视频 */}
          <div className="mt-3">
            <Vid src={m.vid} radius="rounded-xl" className="aspect-video w-full" muteToggle />
          </div>
          {/* 回复文案 */}
          {m.caption && <p className="mt-2.5 text-[12px] leading-snug text-[#6f6a61]">{m.caption}</p>}
          {/* 动作按钮 */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {m.actions.map((a) => <ActionButton key={a.label} a={a} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

/* 分发:analyzer 变体渲染分镜卡,否则渲染对话卡 */
function ToolkitCard({ n, chat, analyzer }: { n: number; chat?: ChatMsg[]; analyzer?: Analyzer }) {
  if (analyzer) return <AnalyzerCard a={analyzer} n={n} />;
  return <ChatCard chat={chat!} n={n} />;
}

/* ============================ HERO (dark, left-aligned) ============================
   sentinel 放在 hero 末尾:滚过它 → header 变实底(浅色 body 上)。 */
function Hero({ heroRef }: { heroRef: React.Ref<HTMLElement> }) {
  return (
    <section ref={heroRef} className="relative flex min-h-[60vh] flex-col justify-center overflow-hidden bg-[#0c0b0e] px-6 pb-24 pt-44 text-[#f4f1ec]">
      {/* hero 背景图 + 50% 黑蒙版 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-08/333171937956126720.png"
        alt=""
        aria-hidden
        className="absolute inset-0 size-full object-cover"
      />
      <div aria-hidden className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 mx-auto w-full max-w-[1440px]">
        <h1 className="max-w-[20ch] text-[clamp(38px,6vw,76px)] font-extrabold leading-[0.98] tracking-[-0.03em]" style={head}>
          BuzzVideo MCP for any AI
        </h1>
        {/* 宽屏一行不折:窄屏仍按自然换行,免得横向溢出 */}
        <p className="mt-6 text-[clamp(16px,1.6vw,19px)] leading-relaxed text-white/60 lg:whitespace-nowrap">
          Connect once. Generate video and images from the chats you already use.
        </p>
        {/* free-trial 提示条(干净深色玻璃 + 橙徽章) */}
        <a
          href="#"
          className="group mt-6 inline-flex items-center gap-2.5 rounded-xl bg-black/40 px-4 py-2.5 backdrop-blur-md transition hover:bg-black/50 active:scale-[0.99]"
        >
          <Tag className="size-4 shrink-0 text-[#ff6a1f]" strokeWidth={2} />
          <span className="text-[14px] font-medium text-white">
            Connect MCP &amp; access unlimited generations with up to 50% off
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
const DL: ChatAction = { label: "Download", icon: Download, primary: true };
const RG: ChatAction = { label: "Regenerate", icon: RefreshCw };

const TOOLKIT: {
  cat: string;
  t: string;
  d: string;
  cta: string;
  chat?: ChatMsg[];
  analyzer?: Analyzer;
}[] = [
  {
    cat: "UGC Ads Maker",
    t: "Turn any product into UGC Ads",
    d: "Upload any product and BuzzVideo turns it into a viral UGC ad, with the creator, voiceover, and native feel all generated for you.",
    cta: "Create UGC Ads",
    analyzer: {
      prompt: "Create a 15s UGC-style video for my product",
      refImg: "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330599160594096128.jpg",
      vid: "https://asset.buzzvideo.ai/buzzvideo/video/2026/07/09/eb9bd680-f25f-48dc-91ee-cac3a8dfeb40_e4e88bf7.mp4",
      config: [{ icon: BarChart3, label: "Seedance 2.0" }, { icon: RectangleHorizontal, label: "16:9" }, { icon: Clock, label: "15s" }, { icon: Volume2, label: "Audio" }],
    },
  },
  {
    cat: "Marketing video generator",
    t: "Clone viral TikTok product ads",
    d: "Clone any viral product video and replace it with your own product.",
    cta: "Generate a video",
    chat: [
      { prompt: "Clone this ad and replace with my product", refImg: "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330617304301756416.png", vid: "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-02/330951725844324352.mp4", config: [{ icon: BarChart3, label: "Seedance 2.0" }, { icon: RectangleHorizontal, label: "16:9" }, { icon: Clock, label: "10s" }, { icon: Volume2, label: "Audio" }], actions: [DL, RG] },
    ],
  },
  {
    cat: "Brand character",
    t: "Reusable brand character",
    d: "Upload model photos once, then reuse the same consistent character across campaigns, videos, and posts.",
    cta: "Create a video",
    chat: [
      { prompt: "Now put Tina in a sunny cafe, holding our new iced latte.", refImg: "https://assets.presslogic.com/avatar/kol/KOL33072/front-1783498399893.jpeg", vid: "https://asset.buzzvideo.ai/buzzvideo/video/2026/07/09/fd53d84b-7a98-4ee0-8b1d-355a05487f48_1248f184.mp4", config: [{ icon: BarChart3, label: "Seedance 2.0" }, { icon: RectangleHorizontal, label: "16:9" }, { icon: Clock, label: "15s" }, { icon: Volume2, label: "Audio" }], caption: "Tina, on model and on brand. Reuse her in any image/video.", actions: [DL, RG] },
    ],
  },
  {
    cat: "Image to video",
    t: "Animate product shots with cinematic motion",
    d: "Start from a still, pick a camera-move preset, and BuzzVideo animates it into a cinematic shot.",
    cta: "Animate an image",
    chat: [
      { prompt: 'Animate this product photo into a 6-second cinematic shot. Use the "Bullet Time" preset with a slow 360 camera move.', refImg: "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-09/333557466459594752.jpg", vid: V.p5, config: [{ icon: BarChart3, label: "Seedance 2.0" }, { icon: RectangleHorizontal, label: "16:9" }, { icon: Clock, label: "6s" }, { icon: Volume2, label: "Audio" }], actions: [DL, RG] },
    ],
  },
];

function Toolkit() {
  return (
    <section className="bg-[#f2f0ec] px-6 py-24 text-[#171512] md:py-28">
      <div className="mx-auto max-w-[1200px]">
        <Reveal>
          <h2 className="text-center text-[clamp(28px,4vw,46px)] font-extrabold uppercase tracking-[-0.01em]" style={head}>
            All of BuzzVideo inside the chat
          </h2>
        </Reveal>
        <div className="mt-16 flex flex-col gap-20 md:mt-20 md:gap-28">
          {TOOLKIT.map((f, i) => {
            const cardLeft = i % 2 === 0;
            return (
              <div key={f.t} className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
                <Reveal className={cardLeft ? "lg:order-1" : "lg:order-2"}>
                  <ToolkitCard n={i + 1} chat={f.chat} analyzer={f.analyzer} />
                </Reveal>
                <Reveal delay={90} className={cardLeft ? "lg:order-2" : "lg:order-1"}>
                  <div>
                    <div className="mb-3">
                      <span className="inline-flex items-center rounded-full bg-[#171512]/[0.06] px-3 py-1 text-[12px] font-semibold text-[#8a857b]">{f.cat}</span>
                    </div>
                    <h3 className="max-w-[16ch] text-[clamp(24px,3vw,38px)] font-extrabold uppercase leading-[1.04] tracking-[-0.01em]" style={head}>
                      {f.t}
                    </h3>
                    <p className="mt-4 max-w-[42ch] text-[15px] leading-relaxed text-[#5f5a51]">{f.d}</p>
                    <button onClick={scrollToTop} className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-[#171512] px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-black active:scale-[0.98]">
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

/* ======================= EXPLORE MORE MODELS ======================= */
/* 各家官方彩色标。渐变 id 加了 bv- 前缀,避免和页面其它 svg 撞;
   同一个组件重复渲染时 id 会重复,但定义完全相同,浏览器取第一个,渲染结果一致 */
function GoogleGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M23 12.245c0-.905-.075-1.565-.236-2.25h-10.54v4.083h6.186c-.124 1.014-.797 2.542-2.294 3.569l-.021.136 3.332 2.53.23.022C21.779 18.417 23 15.593 23 12.245z" fill="#4285F4" />
      <path d="M12.225 23c3.03 0 5.574-.978 7.433-2.665l-3.542-2.688c-.948.648-2.22 1.1-3.891 1.1a6.745 6.745 0 01-6.386-4.572l-.132.011-3.465 2.628-.045.124C4.043 20.531 7.835 23 12.225 23z" fill="#34A853" />
      <path d="M5.84 14.175A6.65 6.65 0 015.463 12c0-.758.138-1.491.361-2.175l-.006-.147-3.508-2.67-.115.054A10.831 10.831 0 001 12c0 1.772.436 3.447 1.197 4.938l3.642-2.763z" fill="#FBBC05" />
      <path d="M12.225 5.253c2.108 0 3.529.892 4.34 1.638l3.167-3.031C17.787 2.088 15.255 1 12.225 1 7.834 1 4.043 3.469 2.197 7.062l3.63 2.763a6.77 6.77 0 016.398-4.572z" fill="#EB4335" />
    </svg>
  );
}

function ByteGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M14.944 18.587l-1.704-.445V10.01l1.824-.462c1-.254 1.84-.461 1.88-.453.032 0 .056 2.235.056 4.972v4.973l-.176-.008c-.104 0-.952-.207-1.88-.446z" fill="#00C8D2" fillRule="nonzero" />
      <path d="M7 16.542c0-2.736.024-4.98.064-4.98.032-.008.872.2 1.88.454l1.816.461-.016 4.05-.024 4.049-1.632.422c-.896.23-1.736.445-1.856.469L7 21.523v-4.98z" fill="#3C8CFF" fillRule="nonzero" />
      <path d="M19.24 12.477c0-9.03.008-9.515.144-9.475.072.024.784.207 1.576.406.792.207 1.576.405 1.744.445l.296.08-.016 8.56-.024 8.568-1.624.414c-.888.23-1.728.437-1.856.47l-.24.055v-9.523z" fill="#78E6DC" fillRule="nonzero" />
      <path d="M1 12.509c0-4.678.024-8.505.064-8.505.032 0 .872.207 1.872.454l1.824.461v7.582c0 4.16-.016 7.574-.032 7.574-.024 0-.872.215-1.88.47L1 21.013v-8.505z" fill="#325AB4" />
    </svg>
  );
}

function KlingGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M5.412 13.775A23.193 23.193 0 017.41 9.32c3.17-5.492 7.795-8.757 10.33-7.294C12.038-1.266 4.598.944 1.122 6.964A13.378 13.378 0 00.085 9.22c-.259.739.092 1.534.77 1.926l4.557 2.63z" fill="url(#bv-kling-0)" />
      <path d="M18.588 10.164a23.188 23.188 0 01-1.999 4.455c-3.17 5.492-7.795 8.758-10.33 7.294 5.703 3.293 13.143 1.082 16.619-4.938a13.392 13.392 0 001.037-2.255c.259-.738-.092-1.534-.77-1.925l-4.557-2.63z" fill="url(#bv-kling-1)" />
      <path d="M16.59 14.62c3.17-5.492 3.686-11.13 1.15-12.594C15.207.563 10.582 3.83 7.41 9.32c2.074-3.59 5.809-5.315 8.344-3.852 2.534 1.464 2.908 5.56.835 9.151z" fill="url(#bv-kling-2)" />
      <path d="M7.41 9.32c-3.17 5.492-3.686 11.13-1.15 12.593 2.534 1.464 7.159-1.802 10.33-7.294-2.074 3.591-5.809 5.316-8.344 3.852-2.534-1.463-2.908-5.56-.835-9.15z" fill="url(#bv-kling-3)" />
      <defs>
        <radialGradient cx="0" cy="0" gradientTransform="matrix(7.47772 -12.51022 17.14368 10.24728 5.173 13.637)" gradientUnits="userSpaceOnUse" id="bv-kling-0" r="1">
          <stop offset=".095" stopColor="#FFF959" /><stop offset=".326" stopColor="#0DF35E" /><stop offset=".64" stopColor="#0BF2F9" /><stop offset="1" stopColor="#04A6F0" />
        </radialGradient>
        <radialGradient cx="0" cy="0" gradientTransform="rotate(120.868 6.491 10.491) scale(14.5747 19.9728)" gradientUnits="userSpaceOnUse" id="bv-kling-1" r="1">
          <stop offset=".095" stopColor="#FFF959" /><stop offset=".326" stopColor="#0DF35E" /><stop offset=".64" stopColor="#0BF2F9" /><stop offset="1" stopColor="#04A6F0" />
        </radialGradient>
        <linearGradient gradientUnits="userSpaceOnUse" id="bv-kling-2" x1="15.578" x2="18.062" y1="1.798" y2="9.861">
          <stop stopColor="#003EFF" /><stop offset="1" stopColor="#0BFFE7" />
        </linearGradient>
        <linearGradient gradientUnits="userSpaceOnUse" id="bv-kling-3" x1="8.422" x2="5.938" y1="22.142" y2="14.079">
          <stop stopColor="#003EFF" /><stop offset="1" stopColor="#0BFFE7" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* MiniMax 海螺 */
function HailuoGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M24 12C24 5.373 18.6-.017 11.97 0 5.39.017.015 5.39 0 11.97-.017 18.6 5.373 24 12 24h7.885a4.108 4.108 0 004.108-4.108V12.4c.004-.133.007-.266.007-.4zM5.829 18.664c-1.91-1.63-3.088-4.24-3.033-6.9.004-.186.013-.372.03-.558v-.012c.277-3.174 2.327-6.134 5.2-7.509 2.874-1.375 6.466-1.112 9.11.664 2.644 1.777 4.243 5.004 4.056 8.184a11.38 11.38 0 01-.329 2.063c-.066.27-.147.549-.338.75-.19.201-.524.295-.75.134-.216-.154-.248-.456-.266-.72-.15-2.134-.72-4.335-2.162-5.915A6.636 6.636 0 0013.1 6.743a6.858 6.858 0 00-4.577 1.252c-1.099.787-1.962 1.914-2.38 3.2-.416 1.285-.374 2.726.175 3.962a5.24 5.24 0 001.9 2.24c1.467.963 3.475 1.1 5 .23 1.524-.87 2.435-2.758 2.047-4.47-.389-1.712-2.124-3.047-3.87-2.866-.266.027-.648-.002-.657-.27-.008-.207.241-.316.445-.353 1.771-.318 3.67.582 4.64 2.097.973 1.515 1.022 3.544.229 5.16-.794 1.615-2.37 2.795-4.118 3.221-2.357.575-4.491-.105-6.103-1.482h-.002z" fill="url(#bv-hailuo)" />
      <defs>
        <linearGradient gradientUnits="userSpaceOnUse" id="bv-hailuo" x1=".539" x2="27.487" y1=".884" y2="27.022">
          <stop offset=".09" stopColor="#FFAB0C" /><stop offset=".31" stopColor="#FF5538" /><stop offset=".46" stopColor="#E9405D" /><stop offset=".75" stopColor="#D266DA" /><stop offset=".89" stopColor="#D584EF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* fal 的四菱形字形 */
function FalGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M7 3.2 9.9 6.1 7 9 4.1 6.1 7 3.2Zm10 0L19.9 6.1 17 9l-2.9-2.9L17 3.2ZM7 15l2.9 2.9L7 20.8 4.1 17.9 7 15Zm10 0 2.9 2.9-2.9 2.9-2.9-2.9L17 15Z" />
    </svg>
  );
}

type ModelGroup = {
  label: string;
  /** img 给了就用静态图当封面;vid 给了就用指定视频;都没给则轮用页面里的成片素材 */
  items: { name: string; glyph: (p: { className?: string }) => React.ReactElement; img?: string; vid?: string }[];
};

/* 模型墙按能力分三块:图片 → 视频 → 音频。字形跟着模型的提供方走 */
const MODEL_GROUPS: ModelGroup[] = [
  {
    label: "Video models",
    items: [
      { name: "Seedance 2.5", glyph: ByteGlyph, vid: "https://assets.presslogic.com/buzzvideo/public/2026-08-12/345831915154104320.mp4" },
      { name: "Seedance 2.0", glyph: ByteGlyph, vid: "https://assets.presslogic.com/buzzvideo/public/2026-07-29/340778900600709120.mp4" },
      { name: "Seedance 2.0 Mini", glyph: ByteGlyph, vid: "https://assets.presslogic.com/buzzvideo/public/2026-07-29/340788772281049088.mp4" },
      { name: "Seedance 2.0 Fast", glyph: ByteGlyph, vid: "https://assets.presslogic.com/buzzvideo/public/2026-07-29/340778056568332288.mp4" },
      { name: "Kling 3.0", glyph: KlingGlyph, vid: "https://assets.presslogic.com/buzzvideo/public/2026-06-15/324742076992380928.mp4" },
      { name: "Gemini Omni Flash", glyph: GoogleGlyph, vid: "https://assets.presslogic.com/buzzvideo/public/2026-07-22/338168723166781440.mp4" },
      { name: "MiniMax H3 Max", glyph: HailuoGlyph, vid: "https://assets.presslogic.com/buzzvideo/public/2026-07-22/338168974464311296.mp4" },
      { name: "MiniMax H3", glyph: HailuoGlyph, vid: "https://assets.presslogic.com/buzzvideo/public/2026-07-22/338168062349991936.mp4" },
    ],
  },
  {
    label: "Image models",
    items: [
      { name: "GPT Image 2.5 Sunburst", glyph: FalGlyph, img: "https://assets.presslogic.com/aigc/tasks/images/5aa41036-7a0b-479b-aa81-687043ee33df/2026-09-22/41e84722-2481-4772-8bdd-59405d0c1a3b.png" },
      { name: "GPT Image 2.5 Flare", glyph: FalGlyph, img: "https://assets.presslogic.com/aigc/tasks/images/5aa41036-7a0b-479b-aa81-687043ee33df/2026-09-22/4ccb1bdd-33d1-43a1-9acc-ec59014cab81.png" },
      { name: "GPT-image-2", glyph: OpenAiGlyph, img: "https://assets.presslogic.com/buzzvideo/public/2026-07-22/338151480492089344.png" },
      { name: "Nano Banana Pro", glyph: GoogleGlyph, img: "https://assets.presslogic.com/buzzvideo/public/2026-07-22/338152310918144000.png" },
      { name: "Seedream 5.0 lite", glyph: ByteGlyph, img: "https://assets.presslogic.com/buzzvideo/public/2026-07-29/340768870484729856.png" },
      { name: "Nano Banana 2", glyph: GoogleGlyph, img: "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-06-24/328062976504422400.png" },
      { name: "Nano Banana 2 Lite", glyph: GoogleGlyph, img: "https://assets.presslogic.com/buzzvideo/public/2026-07-22/338150973748862976.png" },
      { name: "Nano Banana", glyph: GoogleGlyph, img: "https://assets.presslogic.com/buzzvideo/public/2026-07-29/340764226748473344.png" },
      { name: "Seedream 5.0 Pro", glyph: ByteGlyph, img: "https://assets.presslogic.com/buzzvideo/public/2026-07-29/340773736443600896.png" },
    ],
  },
  {
    label: "Audio models",
    items: [{ name: "Seed Audio 1.0", glyph: ByteGlyph }],
  },
];

/* 封面复用页面里已有的成片素材,按顺序轮用 */
const MODEL_COVERS = [V.p1, V.p2, V.p3, V.p4, V.p5, V.p6, V.L1, V.L2, V.L3];

function ExploreModels() {
  let coverIndex = 0;
  return (
    <section className="bg-[#0c0b0e] px-6 pb-24 pt-20 text-[#f4f1ec] md:pb-28">
      <div className="mx-auto max-w-[1320px]">
        <h2 className="text-center text-[clamp(28px,4vw,40px)] font-extrabold leading-[1.12] tracking-tight" style={head}>
          Explore more AI models
        </h2>
        <p className="mx-auto mt-5 max-w-[560px] text-center text-[16px] leading-relaxed text-white/60">
          The latest models, all in one place.
        </p>

        {MODEL_GROUPS.map((g) => (
          <div key={g.label} className="mt-14">
            <div className="flex items-baseline gap-3">
              <h3 className="text-[13px] font-bold uppercase tracking-[0.12em] text-white/50">{g.label}</h3>
              <span className="h-px flex-1 bg-white/10" />
              <span className="text-[13px] font-semibold text-white/35">{g.items.length}</span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {g.items.map((m) => {
                const Glyph = m.glyph;
                const cover = MODEL_COVERS[coverIndex++ % MODEL_COVERS.length];
                return (
                  <button
                    key={m.name}
                    onClick={scrollToTop}
                    className="group relative aspect-square overflow-hidden rounded-2xl bg-[#17161a] text-left"
                  >
                    {m.img ? (
                      <img src={m.img} alt="" aria-hidden className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-[1.04]" />
                    ) : (
                      <Vid src={m.vid ?? cover} radius="rounded-none" className="absolute inset-0 size-full transition duration-500 group-hover:scale-[1.04]" />
                    )}
                    {/* 底部压一层渐变,保证白字在任何画面上都读得清 */}
                    <span aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(to_top,rgba(8,7,10,0.85),rgba(8,7,10,0))]" />
                    <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 px-3 pb-5 text-center text-[15px] font-bold text-white">
                      <Glyph className="size-4 shrink-0" />
                      {m.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============================ FAQ ============================ */
const FAQ = [
  { q: "Where does BuzzVideo MCP work?", a: "ChatGPT, Claude (desktop and claude.ai), and Grok Bot today. Any other MCP-compatible client works too: point it at the BuzzVideo connector URL and sign in." },
  { q: "How do I connect?", a: "In ChatGPT and Grok Bot, find BuzzVideo in the Plugins Directory and click Add. In Claude, go to Customize, then Connectors, and paste the BuzzVideo connector URL. Either way you sign in once and stay connected." },
  { q: "Which models can I call?", a: "All of them. Video: Seedance 2.5, Seedance 2.0, Seedance 2.0 Mini, Seedance 2.0 Fast, Kling 3.0, Gemini Omni Flash, MiniMax H3 Max, and MiniMax H3. Image: GPT Image 2.5 Sunburst, GPT Image 2.5 Flare, GPT-image-2, Nano Banana Pro, Nano Banana 2, Nano Banana 2 Lite, Nano Banana, Seedream 5.0 Pro, and Seedream 5.0 lite. Audio: Seed Audio 1.0. New models become available through the same connection." },
  { q: "How do I know which model is used?", a: "BuzzVideo picks a model that fits the request and names it in the reply. Ask for a specific one at any time and it uses that instead." },
  { q: "Can I generate video with audio?", a: "Yes. Ask for a clip with sound and BuzzVideo returns a video with a matched audio track. Seed Audio 1.0 can also generate voiceover or music on its own." },
  { q: "Can I use my own product photos?", a: "Yes. Attach an image in the chat and ask for a UGC ad, a product shot, or an animated version of it. The reference stays consistent across everything generated from it." },
  { q: "Can I run bulk operations?", a: "Yes. Batch requests like resizing a hero shot into every social format run in one message." },
  { q: "How long does a generation take?", a: "Images come back in seconds and most videos in a couple of minutes, depending on the model and length. The chat keeps working while a render is in progress." },
  { q: "Does my plan cover the MCP?", a: "MCP is not available on the Free plan. Starter, Pro, and Ultra subscribers get unlimited image and video generation with any AI model." },
  { q: "Do generations from chat use the same account?", a: "Yes. It is one BuzzVideo account: everything you generate from a chat client lands in the same library as the web app, with the same plan and limits." },
  { q: "Can I use what I generate commercially?", a: "Yes. Everything you generate is yours to use in ads, campaigns, and client work, with no extra licensing." },
  { q: "How is my data handled?", a: "Renders are tied to your account and follow the same privacy and retention rules as the BuzzVideo web app." },
];


function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="bg-white px-6 py-24 text-[#171512] md:py-28">
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

/* ============================ FOOTER ============================ */
const FOOTER_SOCIAL = [
  { name: "TikTok", src: "/prototypes/homepage-tvc/social/tiktok.svg" },
  { name: "YouTube", src: "/prototypes/homepage-tvc/social/youtube.svg" },
  { name: "Instagram", src: "/prototypes/homepage-tvc/social/instagram.svg" },
];

function Footer() {
  return (
    <footer className="bg-white px-6 pb-14 pt-10 text-[#171512]">
      <div className="mx-auto max-w-[1100px]">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2.5">
              <img src="/prototypes/seedance-2-5/logo.svg" alt="" aria-hidden className="size-7" />
              <span className="text-[17px] font-extrabold tracking-tight" style={head}>BuzzVideo AI</span>
            </span>
            <span className="flex items-center gap-2">
              {FOOTER_SOCIAL.map((sN) => (
                <a
                  key={sN.name}
                  href="#"
                  aria-label={sN.name}
                  className="grid size-7 place-items-center rounded-full bg-[#171512] transition hover:bg-black"
                >
                  {/* 图标是深色矢量,放在黑底上要反色 */}
                  <img src={sN.src} alt="" aria-hidden className="size-3.5 invert" />
                </a>
              ))}
            </span>
          </div>

          <button
            onClick={scrollToTop}
            className="inline-flex items-center gap-2 text-[14px] text-[#5f5a51] transition hover:text-[#171512]"
          >
            Page Top
            <span className="grid size-6 place-items-center rounded-full border border-black/15">
              <ArrowUp className="size-3.5" strokeWidth={2.5} />
            </span>
          </button>
        </div>

        <p className="mt-8 text-[12.5px] text-[#8a857b]">
          © 2026 PressLogic Limited. All Rights Reserved.{" "}
          <span className="px-1 text-black/15">|</span>
          <a href="#" className="transition hover:text-[#171512]">Privacy Policy</a>
          <span className="px-1 text-black/15">|</span>
          <a href="#" className="transition hover:text-[#171512]">Terms of Service</a>
        </p>
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
      <ExploreModels />
      <Faq />
      <Footer />
    </main>
  );
}
