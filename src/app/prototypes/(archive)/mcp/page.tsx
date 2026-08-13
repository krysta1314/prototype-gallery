"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
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
/* 连接面板:两轴(模式 MCP/CLI/Skill × 客户端)+ 三列编号步骤(照图 2 / 图 3 结构) */
const MODES = ["MCP", "CLI", "Skill"] as const;
const PANEL_CLIENTS = ["Claude", "ChatGPT", "Cursor", "Codex", "OpenClaw", "Hermes"] as const;
type Mode = (typeof MODES)[number];
type Step = { t: string; d: string; hi?: string[]; action?: { kind: "url" | "cmd" | "button"; value: string } };

function stepsFor(mode: Mode, client: string): Step[] {
  if (mode === "CLI") {
    // OpenClaw 走 clawhub 那套
    if (client === "OpenClaw")
      return [
        { t: "Install & plug into your agent", d: 'Works with all agents. Then just say: "Generate an image/video with BuzzVideo."', hi: ['"Generate an image/video with BuzzVideo."'], action: { kind: "cmd", value: "openclaw skills install buzzvideo-generate" } },
        { t: "Sign in", d: "Opens a browser, takes 5 seconds. Run buzzvideo auth login and you're authenticated.", hi: ["buzzvideo auth login"], action: { kind: "cmd", value: "buzzvideo auth login" } },
        { t: "AI BuzzVideo skills in one place", d: "Marketing Video, Product Shots & UGC Ads - browse and install from the hub.", action: { kind: "url", value: "https://clawhub.ai/user/buzzvideo" } },
      ];
    // 其它客户端一致:skills hub 那套
    return [
      { t: "Install & plug into your agent", d: 'Works with all agents. Then just say: "Generate an image/video with BuzzVideo."', hi: ['"Generate an image/video with BuzzVideo."'], action: { kind: "cmd", value: "npm install -g @buzzvideo/cli" } },
      { t: "Sign in", d: "Opens a browser, takes 5 seconds. Run buzzvideo auth login and you're authenticated.", hi: ["buzzvideo auth login"], action: { kind: "cmd", value: "buzzvideo auth login" } },
      { t: "AI BuzzVideo skills in one place", d: "Marketing Video, Product Shots & UGC Ads - browse and install from the hub.", action: { kind: "cmd", value: "npx skills add buzzvideo-ai/skills" } },
    ];
  }

  // Skill:一键装技能包
  if (mode === "Skill")
    return [
      { t: "Add the skills", d: "One command pulls all three skills into your agent: generate, soul, and product photoshoot.", action: { kind: "cmd", value: "npx skills add buzzvideo-ai/skills" } },
      { t: "Sign in", d: "Connects your account so the skills can submit jobs through the buzzvideo CLI.", hi: ["buzzvideo"], action: { kind: "cmd", value: "buzzvideo auth login" } },
      { t: "Plug skills into your agent", d: "Marketing Video, Product Shots & UGC Ads - browse and install from the hub.", hi: ["Marketing Video, Product Shots & UGC Ads"], action: { kind: "cmd", value: "/buzzvideo:generate" } },
    ];

  // MCP 每个客户端流程不同
  if (client === "ChatGPT")
    return [
      { t: "Turn on Developer Mode", d: "Settings[>]Apps[>]Advanced settings[>]enable Developer Mode, then click Create app", hi: ["Create app"], action: { kind: "button", value: "ChatGPT Settings" } },
      { t: "Create the BuzzVideo App", d: "Name the app BuzzVideo and copy-paste the URL below as Connection.", hi: ["BuzzVideo", "Connection"], action: { kind: "url", value: "https://mcp.buzzvideo.ai/mcp" } },
      { t: "Connect and sign in", d: "Click Create, sign in with your BuzzVideo account. You're all set, now just ask ChatGPT to generate an image/video using @BuzzVideo.", hi: ["Create", "generate an image/video", "@BuzzVideo"] },
    ];

  if (client === "Cursor")
    return [
      { t: "Open Cursor marketplace", d: "Launch Cursor and open the built-in plugins via Settings[>]Marketplace.", hi: ["Cursor", "Settings", "Marketplace"], action: { kind: "button", value: "Open marketplace" } },
      { t: "Add the BuzzVideo plugin", d: "Find BuzzVideo or run the command directly:", hi: ["BuzzVideo"], action: { kind: "cmd", value: "/add-plugin buzzvideo" } },
      { t: "Connect and sign in", d: "Click Add[>]Connect, sign in with your BuzzVideo account. You're all set, now just ask Cursor to generate an image/video.", hi: ["Add", "Connect", "generate an image/video"] },
    ];

  // 默认(Claude 及其它):Connectors 流程
  return [
    { t: "Copy BuzzVideo URL", d: "Click the copy button. You will need it in the next step.", hi: ["next step"], action: { kind: "url", value: "https://mcp.buzzvideo.ai/mcp" } },
    { t: "Open Settings[>]Connectors", d: "Add a custom connector, name it BuzzVideo, and paste the URL from step 1.", hi: ["BuzzVideo", "paste the URL from step 1"], action: { kind: "button", value: "BuzzVideo auth login" } },
    { t: "Connect and sign in", d: `Click Add[>]Connect, and sign in with your BuzzVideo account. Now just ask ${client} to generate an image/video.`, hi: ["Add", "Connect", "generate an image/video"] },
  ];
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

/* CLI (命令行) 字形 */
function CliGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden>
      <path fillRule="evenodd" clipRule="evenodd" d="M1.5 4a2 2 0 0 1 2 -2h9a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2H3.5a2 2 0 0 1 -2 -2V4Zm2.6466666666666665 0.6466666666666666a0.5 0.5 0 0 1 0.7066666666666667 0l1.5 1.5a0.5 0.5 0 0 1 0 0.7066666666666667l-1.5 1.5a0.5 0.5 0 0 1 -0.7066666666666667 -0.7066666666666667l1.1466666666666665 -1.1466666666666665 -1.1466666666666665 -1.1466666666666665a0.5 0.5 0 0 1 0 -0.7066666666666667Zm2.8533333333333335 2.8533333333333335a0.5 0.5 0 0 0 0 1h2a0.5 0.5 0 0 0 0 -1h-2Z" />
    </svg>
  );
}

/* Skill (file-text) 字形 */
function SkillGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" />
      <path d="M14 2v5a1 1 0 0 0 1 1h5" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </svg>
  );
}

/* Claude 官方字形 */
function ClaudeGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" fillRule="evenodd" className={className} aria-hidden>
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

/* Cursor 官方字形 */
function CursorGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" fillRule="evenodd" className={className} aria-hidden>
      <path d="M22.106 5.68L12.5.135a.998.998 0 00-.998 0L1.893 5.68a.84.84 0 00-.419.726v11.186c0 .3.16.577.42.727l9.607 5.547a.999.999 0 00.998 0l9.608-5.547a.84.84 0 00.42-.727V6.407a.84.84 0 00-.42-.726zm-.603 1.176L12.228 22.92c-.063.108-.228.064-.228-.061V12.34a.59.59 0 00-.295-.51l-9.11-5.26c-.107-.062-.063-.228.062-.228h18.55c.264 0 .428.286.296.514z" />
    </svg>
  );
}

/* Codex 官方字形 */
function CodexGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" fillRule="evenodd" className={className} aria-hidden>
      <path clipRule="evenodd" d="M8.086.457a6.105 6.105 0 013.046-.415c1.333.153 2.521.72 3.564 1.7a.117.117 0 00.107.029c1.408-.346 2.762-.224 4.061.366l.063.03.154.076c1.357.703 2.33 1.77 2.918 3.198.278.679.418 1.388.421 2.126a5.655 5.655 0 01-.18 1.631.167.167 0 00.04.155 5.982 5.982 0 011.578 2.891c.385 1.901-.01 3.615-1.183 5.14l-.182.22a6.063 6.063 0 01-2.934 1.851.162.162 0 00-.108.102c-.255.736-.511 1.364-.987 1.992-1.199 1.582-2.962 2.462-4.948 2.451-1.583-.008-2.986-.587-4.21-1.736a.145.145 0 00-.14-.032c-.518.167-1.04.191-1.604.185a5.924 5.924 0 01-2.595-.622 6.058 6.058 0 01-2.146-1.781c-.203-.269-.404-.522-.551-.821a7.74 7.74 0 01-.495-1.283 6.11 6.11 0 01-.017-3.064.166.166 0 00.008-.074.115.115 0 00-.037-.064 5.958 5.958 0 01-1.38-2.202 5.196 5.196 0 01-.333-1.589 6.915 6.915 0 01.188-2.132c.45-1.484 1.309-2.648 2.577-3.493.282-.188.55-.334.802-.438.286-.12.573-.22.861-.304a.129.129 0 00.087-.087A6.016 6.016 0 015.635 2.31C6.315 1.464 7.132.846 8.086.457zm-.804 7.85a.848.848 0 00-1.473.842l1.694 2.965-1.688 2.848a.849.849 0 001.46.864l1.94-3.272a.849.849 0 00.007-.854l-1.94-3.393zm5.446 6.24a.849.849 0 000 1.695h4.848a.849.849 0 000-1.696h-4.848z" />
    </svg>
  );
}

/* OpenClaw 字形 */
function OpenClawGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" fillRule="evenodd" className={className} aria-hidden>
      <path d="M9.046 7.104a.527.527 0 110 1.055.527.527 0 010-1.055z" />
      <path d="M15.376 7.104a.528.528 0 110 1.056.528.528 0 010-1.056z" />
      <path clipRule="evenodd" d="M16.877 1.912c.58-.27 1.14-.323 1.616-.037a.317.317 0 01-.326.542c-.227-.136-.547-.153-1.022.068-.352.165-.765.45-1.234.866 2.683 1.17 4.4 3.5 5.148 5.921a6.421 6.421 0 00-.704.184c-.578.016-1.174.204-1.502.735-.338.55-.268 1.276.072 2.069l.005.012.007.014c.523 1.045 1.318 1.91 2.2 2.284-.912 3.274-3.44 6.144-5.972 6.988v2.109h-2.11v-2.11c-1.043.417-2.086.01-2.11 0v2.11h-2.11v-2.11c-2.531-.843-5.061-3.713-5.973-6.987.882-.373 1.678-1.238 2.2-2.284l.007-.014.006-.012c.34-.793.41-1.518.071-2.069-.327-.531-.923-.719-1.503-.735a6.409 6.409 0 00-.704-.183c.749-2.421 2.466-4.751 5.149-5.922-.47-.416-.88-.701-1.234-.866-.474-.221-.794-.204-1.021-.068a.318.318 0 01-.435-.109.317.317 0 01.109-.433c.476-.286 1.036-.233 1.615.037.49.229 1.031.628 1.621 1.182A9.924 9.924 0 0112 2.568c1.199 0 2.284.19 3.256.526.59-.554 1.13-.953 1.62-1.182zM8.835 6.577a1.266 1.266 0 100 2.532 1.266 1.266 0 000-2.532zm6.33 0a1.267 1.267 0 100 2.533 1.267 1.267 0 000-2.533z" />
      <path d="M.395 13.118c-.966-1.932-.163-3.863 2.41-3.365v-.001l.05.01c.084.018.17.038.26.06.033.009.067.017.1.027.084.022.168.048.255.076l.09.027c.528 0 .95.158 1.16.501.212.343.212.87-.105 1.61-.085.17-.178.333-.276.489l-.01.017a4.967 4.967 0 01-.62.791l-.019.02c-1.092 1.117-2.496 1.336-3.295-.262z" />
      <path d="M21.193 9.753c2.574-.5 3.378 1.433 2.411 3.365-.58 1.159-1.476 1.361-2.342.96l-.011-.005a2.419 2.419 0 01-.114-.056l-.019-.01a2.751 2.751 0 01-.115-.067l-.023-.014c-.035-.022-.071-.044-.106-.068l-.05-.035c-.55-.388-1.062-1.007-1.44-1.76-.276-.647-.311-1.132-.174-1.472.176-.439.636-.639 1.23-.639.032-.011.066-.02.099-.03.08-.026.16-.05.238-.072l.117-.03a5.502 5.502 0 01.3-.067z" />
    </svg>
  );
}

/* Hermes Agent 字形 */
function HermesGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" fillRule="evenodd" className={className} aria-hidden>
      <path clipRule="evenodd" d="M11.981.009c.226-.012.453-.011.679 0 .247.01.495.024.74.062.401.064.798.157 1.19.273.463.138.92.299 1.356.511a7.31 7.31 0 012.948 2.642c.292.469.536.963.739 1.479.219.556.446 1.11.623 1.683.204.654.329 1.326.458 1.997.097.504.182 1.01.29 1.511.156.722.329 1.44.494 2.16.186.812.4 1.615.63 2.415.102.355.193.713.282 1.072.11.436.202.876.254 1.323.031.278.066.557.073.837a7.56 7.56 0 01-.017.88c-.037.413-.1.818-.226 1.212a5.017 5.017 0 01-.915 1.649l-.13.156.018.023c.043-.023.088-.041.127-.068.2-.138.373-.307.531-.49.4-.46.721-.973.975-1.529a3.59 3.59 0 00.325-1.72c-.024-.424-.097-.834-.3-1.213-.013-.027-.015-.06-.03-.121.05.035.082.048.101.072.107.13.22.258.315.398.33.494.46 1.052.486 1.64a3.75 3.75 0 01-.47 1.97c-.36.655-.887 1.14-1.526 1.506-.193.111-.394.21-.595.308-.157.078-.248.211-.318.365a.522.522 0 00-.033.406.359.359 0 01.013.139c-.005.077-.077.155-.14.162-.054.006-.125-.043-.15-.116a1.206 1.206 0 01-.06-.233c-.04-.314-.155-.6-.308-.87a3.906 3.906 0 00-.73-.91 2.129 2.129 0 00-.897-.524 4.093 4.093 0 00-.692-.131c-.075-.008-.15-.04-.22.01.18.06.363.11.538.18.434.173.82.43 1.18.728.308.255.58.543.794.884.098.155.186.315.227.496.027.123.042.25.067.375.013.062-.002.109-.053.144-.047.033-.122.034-.163-.01a.455.455 0 01-.08-.14c-.03-.073-.038-.159-.078-.225a7.314 7.314 0 00-1.423-1.664c-.16-.137-.329-.26-.537-.323-.376-.114-.753-.203-1.15-.154-.213.025-.427.032-.64.053a1.6 1.6 0 00-.736.278 5.14 5.14 0 00-.834.72c-.329.342-.642.699-.955 1.055-.136.155-.264.319-.314.531a5.227 5.227 0 00-.012.051.096.096 0 01-.09.076h-.31c-.046 0-.082-.048-.072-.094.023-.108.045-.216.07-.324.075-.325.19-.635.368-.917.024-.039.04-.088.104-.08l.01.049.027.077c.28-.435.571-.834.996-1.135.283-.204.584-.378.89-.55a.196.196 0 00-.098-.002c-.162.043-.325.084-.485.134-.402.124-.764.33-1.11.566-.147.1-.298.193-.414.333a7.314 7.314 0 00-1.07 1.767.845.845 0 00-.04.12.075.075 0 01-.072.056h-.494c-.04 0-.062-.051-.036-.082.123-.14.246-.282.377-.415.275-.281.58-.532.777-.884.027-.048.063-.09.095-.135.238-.333.54-.607.818-.902.082-.086.175-.16.26-.24.029-.027.053-.057.079-.085l-.018-.025-.135.041c-.034.017-.07.031-.102.05-.248.144-.494.292-.743.433-.408.23-.825.439-1.209.711-.281.2-.591.358-.889.533-.02.012-.044.015-.08.028-.015-.135.143-.201.108-.336-.033.014-.064.02-.085.038-.111.096-.227.19-.328.296-.148.157-.284.325-.425.488-.125.143-.25.286-.373.431A.153.153 0 019.89 24H8.762a.316.316 0 00.016-.042c.028-.09.085-.172.083-.28-.091-.018-.162.001-.212.077a4.45 4.45 0 00-.136.215c-.01.016-.024.03-.042.03h-.093c-.019 0-.029-.022-.017-.037.071-.088.14-.178.209-.268.001-.002-.006-.012-.012-.024-.014.004-.03.006-.045.013-.176.09-.352.181-.527.274a.363.363 0 01-.168.042H5.202c-.026 0-.039-.036-.019-.053.21-.178.402-.374.558-.605.335-.496.538-1.047.667-1.629.004-.02-.003-.043-.006-.091-.037.048-.059.072-.076.1a1.943 1.943 0 01-.334.415c-.28.258-.59.448-.983.464-.297.012-.588 0-.865-.127-.46-.21-.722-.57-.794-1.072-.025-.17-.017-.171-.182-.219A3.513 3.513 0 011.97 20.6a2.286 2.286 0 01-.808-1.13 3.569 3.569 0 01-.16-1.245c.002-.034.016-.067.024-.1.032.023.046.043.05.066.033.153.059.308.096.46.086.355.257.664.516.92.258.256.571.419.91.532.358.118.717.138 1.07-.016a1.89 1.89 0 00.621-.452c.328-.348.533-.76.648-1.223.009-.034.005-.071.007-.11-.015.006-.026.006-.03.011-.031.05-.064.1-.093.152-.284.502-.679.887-1.196 1.135-.351.17-.718.255-1.11.159a1.607 1.607 0 01-.971-.64 2.006 2.006 0 01-.368-.924 2.903 2.903 0 01.02-.886c.05-.439.466-1.17.742-1.271-.02.063-.035.112-.053.16-.043.116-.097.227-.13.345a1.901 1.901 0 00-.05.82c.033.212.09.416.204.6.147.236.346.407.62.465.11.023.225.014.338.018a.576.576 0 00.386-.131c.164-.128.282-.292.366-.481.168-.375.24-.777.309-1.179.05-.296.093-.594.133-.893.039-.281.071-.563.104-.845.026-.232.048-.464.074-.696.024-.228.052-.455.076-.683.024-.227.047-.455.069-.683.013-.14.022-.28.034-.42l.037-.417c.022-.25.041-.5.065-.748.008-.082-.02-.132-.09-.177a2.46 2.46 0 01-.492-.418c-.1-.109-.188-.228-.282-.342-.035-.042-.056-.097-.116-.118a2.084 2.084 0 00.275.597c.06.092.131.176.196.265.063.086.182.115.234.226-.028.003-.046.01-.06.006a4.74 4.74 0 01-.22-.057 2.71 2.71 0 01-1.287-.819c-.435-.487-.656-1.076-.71-1.723a5.206 5.206 0 01.014-1.06c.072-.602.22-1.186.45-1.745.155-.376.338-.741.526-1.102.205-.393.466-.75.765-1.076.512-.559 1.104-1.024 1.726-1.448.717-.49 1.478-.898 2.277-1.233C8.244.828 8.767.632 9.31.494c.655-.166 1.31-.33 1.982-.415.229-.03.458-.058.688-.07z" />
    </svg>
  );
}

const CLIENT_GLYPH: Record<string, (p: { className?: string }) => React.ReactElement> = {
  Claude: ClaudeGlyph,
  ChatGPT: OpenAiGlyph,
  Cursor: CursorGlyph,
  Codex: CodexGlyph,
  OpenClaw: OpenClawGlyph,
  Hermes: HermesGlyph,
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
      className="inline-flex max-w-full items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3 font-mono text-[13px] text-white/90 transition hover:bg-black/40"
    >
      <span className="truncate">{value}</span>
      {copied ? <Check className="ml-auto size-4 shrink-0 text-[#ff6a1f]" /> : <Copy className="ml-auto size-4 shrink-0 text-white/50" />}
    </button>
  );
}

function ConnectPanel() {
  const [mode, setMode] = useState<Mode>("MCP");
  const [client, setClient] = useState<string>("Claude");
  // 所有客户端都显示 MCP / CLI / Skill;OpenClaw/Hermes 的 MCP、Skill 复用标准流程,CLI 各自专属
  const availableModes: readonly Mode[] = MODES;
  const activeMode: Mode = mode;
  const steps = stepsFor(activeMode, client);
  return (
    <div className="w-full max-w-[1280px]">
      <div className="rounded-2xl border border-white/10 bg-white/15 p-5 backdrop-blur-lg md:p-6">
      {/* header:左模式 tabs,右客户端 tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
              {m === "MCP" ? <McpGlyph className="size-3.5" /> : m === "CLI" ? <CliGlyph className="size-3.5" /> : <SkillGlyph className="size-3.5" />}
              {m}
            </button>
          ))}
        </div>
        {activeMode !== "Skill" && (
          <div className="inline-flex flex-wrap gap-1 rounded-full bg-black/25 p-1">
            {PANEL_CLIENTS.map((c) => {
              const Glyph = CLIENT_GLYPH[c];
              return (
                <button
                  key={c}
                  onClick={() => {
                    setClient(c);
                    // OpenClaw / Hermes 原生只有 CLI,选中时自动切到 CLI
                    if (c === "OpenClaw" || c === "Hermes") setMode("CLI");
                  }}
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
        )}
      </div>

      {/* 三列编号步骤(固定最小高度:MCP/CLI 等高,切换不触发重排) */}
      <div className="mt-7 grid gap-8 md:min-h-[188px] md:grid-cols-3 md:gap-6">
        {steps.map((s, i) => (
          <div key={i} className="md:[&:not(:first-child)]:border-l md:[&:not(:first-child)]:border-white/10 md:[&:not(:first-child)]:pl-6">
            <span className="grid size-7 place-items-center rounded-full bg-white/10 text-[12px] font-bold text-white">{i + 1}</span>
            <h3 className="mt-4 flex flex-wrap items-center gap-x-1.5 text-[15px] font-bold text-white">
              {s.t.split("[>]").flatMap((part, idx) =>
                idx === 0
                  ? [<span key={idx}>{part}</span>]
                  : [<ArrowRight key={`a${idx}`} className="size-3.5 shrink-0" strokeWidth={2.5} />, <span key={idx}>{part}</span>],
              )}
            </h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-white/45">
              {s.d.split("[>]").flatMap((part, idx) => {
                const seg = highlight(part, s.hi, `d${idx}`);
                return idx === 0
                  ? seg
                  : [<ArrowRight key={`d${idx}`} className="mx-1 inline-block size-3.5 shrink-0 -translate-y-px align-middle" strokeWidth={2.5} />, ...seg];
              })}
            </p>
            {s.action && (
              <div className="mt-4">
                {s.action.kind === "button" ? (
                  <button className="inline-flex items-center gap-1.5 rounded-xl bg-[#ff6a1f] px-4 py-2.5 text-[12.5px] font-bold text-white transition hover:bg-[#ff7d3a]">
                    {s.action.value}
                    <ExternalLink className="size-3.5" strokeWidth={2.5} />
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
      <div className="relative z-10 mx-auto max-w-[1440px]">
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

/* ======================= EXPLORE MORE MODELS ======================= */
const MODELS = [
  "Seedance 2.5",
  "Seedance 2.0",
  "Seedance 2.0 Mini",
  "Seedance 2.0 Fast",
  "Seedance 1.5 Pro",
  "Kling 3.0",
  "Veo 3.1",
  "Veo3.1 Fast",
  "GPT-image-2",
  "Seedream 5.0 lite",
  "Seedream 4.5",
  "Nano Banana 2",
  "Nano Banana Pro",
  "Nano Banana",
];

function ExploreModels() {
  return (
    <section className="bg-[#f2f0ec] px-6 pb-24 pt-4 text-[#171512]">
      <div className="mx-auto max-w-[1200px] rounded-[28px] border border-black/[0.06] bg-white px-6 py-20 text-center shadow-[0_2px_16px_rgba(23,21,15,0.05)]">
        <h2 className="text-[clamp(28px,4vw,40px)] font-extrabold leading-[1.12] tracking-tight" style={head}>
          Explore more AI models
        </h2>
        <p className="mx-auto mt-5 max-w-[560px] text-[16px] leading-relaxed text-[#5f5a51]">
          The latest models, all in one place.
        </p>
        <div className="mx-auto mt-12 flex max-w-[920px] flex-wrap justify-center gap-3">
          {MODELS.map((m) => (
            <button
              key={m}
              className="rounded-full border border-black/[0.06] bg-[#f2f0ec] px-5 py-2.5 text-[14px] font-medium text-[#3a362f] transition hover:border-[#ff6a1f]/60 hover:text-[#171512]"
            >
              {m}
            </button>
          ))}
        </div>
        <div className="mt-12 flex justify-center">
          <button className="inline-flex h-auto items-center rounded-full bg-[#171512] px-6 py-3 text-[14px] font-semibold text-white transition hover:bg-black">
            Create video <ArrowRight className="ml-2 size-[18px]" />
          </button>
        </div>
      </div>
    </section>
  );
}

/* ============================ FAQ ============================ */
const FAQ = [
  { q: "Where does BuzzVideo MCP work?", a: "Any MCP-compatible client, including Claude Desktop, Claude Code, ChatGPT, Cursor, Codex, OpenClaw, and Hermes." },
  { q: "Which models can I call?", a: "All of them. Image: Nano Banana 2 Lite, GPT-image-2, Seedream 5.0 lite, Nano Banana 2, Nano Banana Pro, Nano Banana, and Seedream 4.5. Video: Gemini Omni Flash, Seedance 2.5, Seedance 2.0 Mini, Seedance 2.0 Fast, Seedance 2.0, Kling 3.0, Veo 3.1 Fast, Veo 3.1, and Seedance 1.5 Pro. New models become available through the same connection." },
  { q: "Can I generate video with audio?", a: "Yes. Ask for a clip with sound and BuzzVideo returns a video with a matched audio track." },
  { q: "Can I run bulk operations?", a: "Yes. Batch requests like resizing a hero shot into every social format run in one message." },
  { q: "Does my plan cover the MCP?", a: "MCP is not available on the Free plan. Starter, Pro, and Ultra subscribers get unlimited image and video generation with any AI model." },
  { q: "What's the difference between MCP, CLI, and Skill?", a: "MCP connects BuzzVideo to chat clients, the CLI runs it from your terminal, and the Skill drops it into agent workflows. Same account, same models, same generations." },
  { q: "Can I use what I generate commercially?", a: "Yes. Everything you generate is yours to use in ads, campaigns, and client work, with no extra licensing." },
  { q: "How is my data handled?", a: "Renders are tied to your account and follow the same privacy and retention rules as the BuzzVideo web app." },
  { q: "How do I know which model is used?", a: "BuzzVideo names the model it rendered with in its reply, and you can request a specific one anytime." },
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
      <ExploreModels />
      <Faq />
    </main>
  );
}
