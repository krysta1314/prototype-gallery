"use client";

/* /enterprise(2026-11-23 Monica:「照 openart.ai/enterprise 一模一样设计」)。
   OpenArt 的骨架原样照搬：
     黑底首屏(满屏背景视频 + 左对齐两行大标题，第一词高亮、第二行灰 + 一句话 + 两个按钮)+ 首屏底部三张支柱小卡(POWERFUL / INTUITIVE / TRUSTED)
     → 浅灰底上三张白色大卡，左右交替(标签 + 标题 + 圆点要点 + Contact sales team + 右侧/左侧配图)
     → 页内销售表单(左视频 + 右灰底表单)。
   和 OpenArt 不同的地方(故意):
     - 配色只用官方色板：高亮和主按钮用品牌橙，不用品红;
     - 不编事实：权益全部来自 company.ts(线上定价页 + v1.6 team-workspace);Trusted 只写已确认的 SOC 2 报告 / 定制 DPA / 数据驻留 / SLA,
       不写 IP 检测和侵权赔偿(IP indemnity 在 Design Studio 的 Planned 清单里，未上线);
     - 表单不真发，提交后显示成功状态;公司规模用 DropdownSelect(不用原生 select)。 */

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ArrowRight, Check, Plus } from "lucide-react";
import { DropdownSelect } from "@/components/ui/dropdown-select";
import type { OnLink } from "../../site-nav/SiteNavHeader";
import { MODELS } from "../../site-nav/models-catalog";
import { linker, JsonLd, ORG } from "./ui";

const WRAP = "mx-auto max-w-[1200px] px-4 sm:px-6";
const POSTER = "/video-library/posters";
const LOCAL = "/prototypes/site/tools";
/* hero 背景片：BuzzVideo dev 生成的电影感广告镜头拼接(生成中，先用已有成片占位) */
const HERO_VIDEO = { src: `${LOCAL}/unboxing-ugc.mp4`, poster: `${POSTER}/skill-unboxing-ugc.jpg` };

const PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-6 py-3.5 text-[15px] font-bold text-white shadow-[0_10px_30px_rgba(255,82,85,0.3)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black";
const DARK_BTN =
  "inline-flex w-fit items-center gap-2 rounded-xl bg-[#240A03] px-5 py-3 text-[14.5px] font-bold text-white transition hover:bg-[#3a1a10] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF744D] focus-visible:ring-offset-2";

/* ── 视频：静音循环，进入视口才播;「减少动态效果」时只显示封面 ── */
function Loop({ src, poster, className = "", label }: { src: string; poster: string; className?: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: 0.15 });
    io.observe(v);
    return () => io.disconnect();
  }, []);
  return <video ref={ref} src={src} poster={poster} muted loop playsInline preload="metadata" aria-label={label} className={`size-full object-cover ${className}`} />;
}

/* ── 支柱标签(OpenArt 的描边小方签：POWERFUL / INTUITIVE / TRUSTED,整页只这一套) ── */
function Tag({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <span
      className={`inline-flex rounded-md px-2.5 py-1 text-[11.5px] font-bold uppercase tracking-[0.08em] ring-1 ring-inset ${
        dark ? "text-white/80 ring-white/25" : "text-[#240A03] ring-[#240A03]/20"
      }`}
    >
      {children}
    </span>
  );
}

const PILLARS = [
  { tag: "Powerful", body: "Every leading AI model on one plan, with dedicated capacity and a priority queue." },
  { tag: "Intuitive", body: "A Marketing Agent and tools built for teams that make ads, not for prompt engineers." },
  { tag: "Trusted", body: "SOC 2 reports, a custom DPA and data residency options for your security review." },
];

type Point = { title: string; body: string };
const POWERFUL: Point[] = [
  { title: "One plan, every leading model", body: "Video, image and audio models from ByteDance, Google, OpenAI, Kuaishou and more, plus MCP for ChatGPT, Claude and your team's tools." },
  { title: "Enterprise administration", body: "Seats, roles and shared workspaces, with one credit pool your admins control." },
  { title: "Custom credit allocation", body: "Credits sized to your team and set per member as a soft or hard limit, with auto top-up and a monthly cap." },
  { title: "API access and dedicated capacity", body: "Bring generation into your own workflows, with dedicated model capacity and a priority processing queue." },
];
const INTUITIVE: Point[] = [
  { title: "Built for marketing teams", body: "Start from a product link, a photo or a brief instead of a blank prompt." },
  { title: "AI Marketing Agent", body: "Describe the product and the goal. The agent plans the campaign, writes the copy and generates the ads with the right models." },
  { title: "Canvas and Studios", body: "Chain image, video and audio steps on Canvas, or start from ready-made templates in Studios." },
  { title: "Onboarding and an account manager", body: "Team training, onboarding and a dedicated account manager from day one." },
];
const TRUSTED: Point[] = [
  { title: "SOC 2 reports", body: "Get our SOC 2 reports for your security and IT review." },
  { title: "Custom DPA", body: "A data processing agreement written for your legal team." },
  { title: "Data residency", body: "Options for where your team's data is stored." },
  { title: "SLA", body: "A service level agreement, backed by a dedicated account manager." },
];

function Points({ items }: { items: Point[] }) {
  return (
    <ul className="mt-8 space-y-5">
      {items.map((p) => (
        <li key={p.title} className="grid grid-cols-[14px_1fr] gap-x-2.5">
          <span aria-hidden className="mt-[9px] size-[6px] rounded-full bg-[#240A03]" />
          <div>
            <h3 className="text-[16px] font-bold leading-[24px] text-[#240A03]">{p.title}</h3>
            <p className="mt-1 text-[14.5px] leading-[22px] text-[#6F6C6C] [text-wrap:pretty]">{p.body}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ── 浅底上的一张白色大卡：一边文字一边配图，左右交替 ── */
function Feature({ id, tag, title, points, media, flip = false, onContact }: { id: string; tag: string; title: string; points: Point[]; media: ReactNode; flip?: boolean; onContact: () => void }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-24">
      <div className="grid items-center gap-10 rounded-[28px] [&>*]:min-w-0 bg-white p-6 shadow-[0_1px_0_rgba(36,10,3,0.04),0_24px_60px_rgba(36,10,3,0.06)] sm:p-10 lg:grid-cols-2 lg:gap-14 lg:p-14">
        <div className={flip ? "lg:order-2" : ""}>
          <Tag>{tag}</Tag>
          <h2 id={`${id}-h`} className="mt-5 max-w-[16ch] text-[clamp(28px,3vw,40px)] font-bold leading-[1.12] tracking-[-0.015em] text-[#240A03] [text-wrap:balance]">
            {title}
          </h2>
          <Points items={points} />
          <button type="button" onClick={onContact} className={`${DARK_BTN} mt-9`}>
            Contact sales team <ArrowRight className="size-4" />
          </button>
        </div>
        <div className={flip ? "lg:order-1" : ""}>{media}</div>
      </div>
    </section>
  );
}

/* ── Powerful 配图：厂商圆章一排排缓慢横移(OpenArt 是 logo 圆章墙;我们没有厂商 logo 授权，用字标) ── */
const VENDORS = Array.from(new Set(MODELS.filter((m) => m.release === "live").map((m) => m.vendor)));
function VendorWall() {
  const rows = [VENDORS.slice(0, 4), VENDORS.slice(4, 8), VENDORS.slice(8).concat(VENDORS.slice(0, 2))].map((r) => (r.length ? r : VENDORS.slice(0, 4)));
  return (
    <div className="relative overflow-hidden rounded-[24px] bg-[#F6F6F6] py-10" aria-label={`Models from ${VENDORS.join(", ")}`}>
      <div className="space-y-4">
        {rows.map((r, i) => (
          <div key={i} className="flex w-max gap-4 motion-safe:animate-[ent-drift_38s_linear_infinite]" style={{ animationDirection: i % 2 ? "reverse" : "normal", marginLeft: i % 2 ? -60 : 0 }}>
            {[...r, ...r, ...r, ...r].map((v, j) => (
              <span
                key={j}
                aria-hidden
                className="grid size-[104px] shrink-0 place-items-center rounded-full bg-white px-3 text-center text-[13px] font-bold leading-tight text-[#240A03] shadow-[0_8px_24px_rgba(36,10,3,0.08)]"
              >
                {v}
              </span>
            ))}
          </div>
        ))}
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#F6F6F6] to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#F6F6F6] to-transparent" />
      <p className="relative mt-8 text-center text-[13px] font-semibold text-[#6F6C6C]">
        {MODELS.filter((m) => m.release === "live").length} models live today, more every release
      </p>
    </div>
  );
}

/* ── Intuitive 配图：成片上压一个 Marketing Agent 输入框，逐字打出 brief ── */
const BRIEF = "Make a 15-second UGC ad for our vitamin C serum, vertical, for TikTok";
function AgentCard() {
  const [n, setN] = useState(BRIEF.length);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !box.current) return;
    let timer: number | undefined;
    const io = new IntersectionObserver(([e]) => {
      window.clearInterval(timer);
      if (!e.isIntersecting) return;
      setN(0);
      let i = 0;
      timer = window.setInterval(() => {
        i += 1;
        setN(i);
        if (i >= BRIEF.length + 40) i = 0; // 打完停 2 秒再重来
      }, 50);
    }, { threshold: 0.4 });
    io.observe(box.current);
    return () => {
      io.disconnect();
      window.clearInterval(timer);
    };
  }, []);
  return (
    <div ref={box} className="relative aspect-[4/5] overflow-hidden rounded-[24px] bg-[#1C1C1C] sm:aspect-[5/4] lg:aspect-[4/5]">
      <Loop src={`${LOCAL}/ugc-product-review.mp4`} poster={`${POSTER}/skill-ugc-product-review.jpg`} label="A creator-style product review video made on BuzzVideo" className="object-[50%_25%]" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      <div className="absolute inset-x-4 bottom-4 rounded-[18px] bg-white p-4 shadow-[0_20px_50px_rgba(0,0,0,0.3)] sm:inset-x-6 sm:bottom-6">
        <p className="text-[11.5px] font-bold text-[#FF744D]">Marketing Agent</p>
        <p className="mt-1.5 min-h-[44px] text-[15px] leading-[22px] text-[#240A03]">
          {BRIEF.slice(0, Math.min(n, BRIEF.length))}
          <span aria-hidden className="ml-0.5 inline-block h-[17px] w-[2px] translate-y-[3px] bg-[#FF744D] motion-safe:animate-pulse" />
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span aria-hidden className="grid size-8 place-items-center rounded-full bg-[#F6F6F6] text-[#240A03]">
            <Plus className="size-4" />
          </span>
          <span aria-hidden className="grid size-8 place-items-center rounded-full bg-gradient-to-r from-[#FFA73C] to-[#FF5255] text-white">
            <ArrowRight className="size-4 -rotate-90" />
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Trusted 配图：组织后台的「安全与合规」页(按 v1.6 team-workspace 的角色体系画) ── */
function AdminCard() {
  const rows = [
    { k: "SOC 2 report", v: "Available on request", act: "Request" },
    { k: "Data processing agreement", v: "Custom DPA", act: "Request" },
    { k: "Data residency", v: "Set with your account manager", act: "Contact" },
  ];
  const roles = [
    { r: "Owner", n: 1 },
    { r: "Admin", n: 2 },
    { r: "Billing Admin", n: 1 },
    { r: "Member", n: 24 },
  ];
  return (
    <div className="overflow-hidden rounded-[24px] bg-[#141414] p-2 shadow-[0_30px_70px_rgba(36,10,3,0.18)]" aria-label="Organization security settings in BuzzVideo">
      <div className="flex items-center gap-1.5 px-3 py-2.5" aria-hidden>
        <span className="size-2.5 rounded-full bg-white/15" />
        <span className="size-2.5 rounded-full bg-white/15" />
        <span className="size-2.5 rounded-full bg-white/15" />
        <span className="ml-3 text-[12px] font-semibold text-white/55">Organization settings</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-[150px_1fr]">
        <nav aria-hidden className="hidden flex-col gap-1 rounded-[16px] bg-white/[0.04] p-2 text-[13px] font-semibold text-white/55 sm:flex">
          {["Members", "Credits", "Security", "Billing"].map((t) => (
            <span key={t} className={`rounded-lg px-3 py-2 ${t === "Security" ? "bg-white/10 text-white" : ""}`}>
              {t}
            </span>
          ))}
        </nav>
        <div className="rounded-[16px] bg-white/[0.04] p-4 sm:p-5">
          <p className="text-[15px] font-bold text-white">Security and compliance</p>
          <ul className="mt-3 divide-y divide-white/[0.07]">
            {rows.map((r) => (
              <li key={r.k} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-[13.5px] font-semibold text-white">{r.k}</p>
                  <p className="text-[12.5px] text-white/55">{r.v}</p>
                </div>
                <span aria-hidden className="shrink-0 rounded-lg bg-white/10 px-3 py-1.5 text-[12.5px] font-bold text-white">
                  {r.act}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[13px] font-bold text-white">Roles</p>
          <ul className="mt-2 grid grid-cols-2 gap-2">
            {roles.map((r) => (
              <li key={r.r} className="flex items-center justify-between rounded-xl bg-white/[0.05] px-3 py-2.5 text-[12.5px] text-white/75">
                <span className="font-semibold text-white">{r.r}</span>
                <span className="tabular-nums">{r.n}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ── 销售表单 ── */
const SIZES = [
  { value: "", label: "Select company size" },
  { value: "1-10", label: "1–10 employees" },
  { value: "11-50", label: "11–50 employees" },
  { value: "51-200", label: "51–200 employees" },
  { value: "201-1000", label: "201–1,000 employees" },
  { value: "1000+", label: "More than 1,000 employees" },
] as const;
type Size = (typeof SIZES)[number]["value"];
const FREE_MAIL = /@(gmail|yahoo|hotmail|outlook|icloud|aol|proton|protonmail|qq|163)\./i;

function Field({ id, label, required, error, children }: { id: string; label: string; required?: boolean; error?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="block text-[13.5px] font-semibold text-[#240A03]">
        {label}
        {required && <span className="text-[#E5484D]"> *</span>}
      </label>
      <div className="mt-1.5">{children}</div>
      {error && (
        <p id={`${id}-err`} className="mt-1.5 text-[12.5px] font-medium text-[#D93A3F]">
          {error}
        </p>
      )}
    </div>
  );
}
const INPUT = "h-11 w-full rounded-lg border bg-white px-3 text-[14px] text-[#240A03] outline-none transition placeholder:text-[#8A8585] focus:border-[#FF744D] focus:ring-2 focus:ring-[#FF744D]/20";

function ContactForm() {
  const [f, setF] = useState({ first: "", last: "", company: "", title: "", email: "", use: "" });
  const [size, setSize] = useState<Size>("");
  const [err, setErr] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setF((p) => ({ ...p, [k]: e.target.value }));
    if (err[k]) setErr((p) => ({ ...p, [k]: "" }));
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const n: Record<string, string> = {};
    if (!f.first.trim()) n.first = "Enter your first name.";
    if (!f.last.trim()) n.last = "Enter your last name.";
    if (!f.company.trim()) n.company = "Enter your company name.";
    if (!size) n.size = "Choose your company size.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) n.email = "Enter a valid email address.";
    else if (FREE_MAIL.test(f.email)) n.email = "Use your work email so we can match you to your company.";
    setErr(n);
    if (Object.keys(n).length) {
      document.getElementById(`ent-${Object.keys(n)[0]}`)?.focus();
      return;
    }
    setSent(true);
  };
  const aria = (k: string) => ({ "aria-invalid": !!err[k] || undefined, "aria-describedby": err[k] ? `ent-${k}-err` : undefined });
  const border = (k: string) => (err[k] ? "border-[#D93A3F]" : "border-[#240A03]/15");

  if (sent)
    return (
      <div className="flex h-full flex-col justify-center py-10" role="status">
        <span className="grid size-12 place-items-center rounded-full bg-[#FFF3EC] text-[#FF744D]">
          <Check className="size-6" />
        </span>
        <h3 className="mt-5 text-[26px] font-bold leading-tight text-[#240A03]">Thanks, {f.first.trim()}.</h3>
        <p className="mt-3 max-w-[36ch] text-[15px] leading-[24px] text-[#6F6C6C]">
          Our sales team will reply to <span className="font-semibold text-[#240A03]">{f.email.trim()}</span> to set up a demo and a plan for {f.company.trim()}.
        </p>
      </div>
    );

  return (
    <form noValidate onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <Field id="ent-first" label="First name" required error={err.first}>
        <input id="ent-first" autoComplete="given-name" value={f.first} onChange={set("first")} className={`${INPUT} ${border("first")}`} {...aria("first")} />
      </Field>
      <Field id="ent-last" label="Last name" required error={err.last}>
        <input id="ent-last" autoComplete="family-name" value={f.last} onChange={set("last")} className={`${INPUT} ${border("last")}`} {...aria("last")} />
      </Field>
      <Field id="ent-company" label="Company" required error={err.company}>
        <input id="ent-company" autoComplete="organization" value={f.company} onChange={set("company")} className={`${INPUT} ${border("company")}`} {...aria("company")} />
      </Field>
      <Field id="ent-title" label="Job title">
        <input id="ent-title" autoComplete="organization-title" value={f.title} onChange={set("title")} className={`${INPUT} border-[#240A03]/15`} />
      </Field>
      <Field id="ent-size" label="Company size" required error={err.size}>
        <DropdownSelect
          label="Company size"
          value={size}
          onChange={(v) => {
            setSize(v);
            if (err.size) setErr((p) => ({ ...p, size: "" }));
          }}
          options={SIZES}
          className="[&>button]:h-11"
        />
      </Field>
      <Field id="ent-email" label="Work email" required error={err.email}>
        <input id="ent-email" type="email" autoComplete="email" inputMode="email" value={f.email} onChange={set("email")} placeholder="you@company.com" className={`${INPUT} ${border("email")}`} {...aria("email")} />
      </Field>
      <div className="sm:col-span-2">
        <Field id="ent-use" label="What will your team use BuzzVideo for?">
          <textarea
            id="ent-use"
            rows={4}
            value={f.use}
            onChange={set("use")}
            placeholder="For example: 200 product videos a month for TikTok and Meta across 3 markets"
            className={`${INPUT} h-auto resize-none border-[#240A03]/15 py-2.5 leading-[22px]`}
          />
        </Field>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2">
        <p className="text-[12.5px] text-[#6F6C6C]">We only use this to contact you about BuzzVideo.</p>
        <button type="submit" className={PRIMARY.replace("focus-visible:ring-offset-black", "focus-visible:ring-offset-white")}>
          Submit <ArrowRight className="size-4" />
        </button>
      </div>
    </form>
  );
}

export function EnterprisePage({ onLink }: { onLink: OnLink }) {
  const a = linker(onLink);
  const toForm = () => {
    const el = document.getElementById("contact");
    el?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    window.setTimeout(() => document.getElementById("ent-first")?.focus({ preventScroll: true }), 500);
  };

  return (
    <main className="bg-black text-white">
      <style>{`@keyframes ent-drift{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>

      {/* ── 首屏：满屏背景视频，文字左对齐压在左侧暗区 ── */}
      <section className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden pb-10 pt-28 md:pb-14">
        <div className="absolute inset-0 -z-10">
          <Loop src={HERO_VIDEO.src} poster={HERO_VIDEO.poster} label="Cinematic ad scenes made on BuzzVideo" className="object-[70%_50%]" />
          {/* 背景片是明亮的多巴胺色：只在左侧文字区压暗，右侧保留原色 */}
          <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 via-40% to-transparent to-70%" />
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/85 to-transparent" />
          <div aria-hidden className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/60 to-transparent" />
        </div>

        <div className={`${WRAP} w-full`}>
          <h1 className="max-w-[13ch] text-[clamp(44px,6.4vw,92px)] font-extrabold leading-[0.98] tracking-[-0.035em] [text-wrap:balance]">
            <span className="text-[#FF744D]">Scale</span> your team&apos;s <span className="text-white/55">ad production</span>
          </h1>
          <p className="mt-6 max-w-[34rem] text-[17px] leading-[27px] text-white/80 [text-wrap:pretty]">
            Give your marketing team every leading AI model for video, image and audio, an AI Marketing Agent, and the controls to run it all as a team.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <button type="button" onClick={toForm} className={PRIMARY}>
              Contact sales team
            </button>
            <a
              {...a("Pricing", "/pricing")}
              className="inline-flex items-center justify-center rounded-xl px-6 py-3.5 text-[15px] font-bold text-white ring-1 ring-inset ring-white/40 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Enterprise pricing
            </a>
          </div>

          <ul className="mt-16 grid gap-3 md:mt-24 md:grid-cols-3">
            {PILLARS.map((p) => (
              <li key={p.tag}>
                <a
                  href={`#${p.tag.toLowerCase()}`}
                  className="block h-full rounded-[18px] bg-white/[0.06] p-5 ring-1 ring-inset ring-white/10 backdrop-blur-md transition hover:bg-white/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                >
                  <Tag dark>{p.tag}</Tag>
                  <p className="mt-3 text-[14.5px] leading-[22px] text-white/75">{p.body}</p>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── 浅底：三张交替白卡 + 表单 ── */}
      <div className="bg-[#F6F6F6] pb-20 pt-16 md:pb-28 md:pt-24">
        <div className={`${WRAP} space-y-8 md:space-y-12`}>
          <Feature id="powerful" tag="Powerful" title="Everything your team needs to create at scale" points={POWERFUL} media={<VendorWall />} onContact={toForm} />
          <Feature id="intuitive" tag="Intuitive" title="A tool your marketing team will actually use" points={INTUITIVE} media={<AgentCard />} flip onContact={toForm} />
          <Feature id="trusted" tag="Trusted" title="Built for companies with compliance requirements" points={TRUSTED} media={<AdminCard />} onContact={toForm} />

          <section id="contact" aria-labelledby="contact-h" className="scroll-mt-24">
            <div className="grid gap-2 rounded-[28px] bg-white p-2 [&>*]:min-w-0 shadow-[0_1px_0_rgba(36,10,3,0.04),0_24px_60px_rgba(36,10,3,0.06)] lg:grid-cols-[0.85fr_1.15fr]">
              <div className="relative hidden min-h-[560px] overflow-hidden rounded-[22px] bg-[#1C1C1C] lg:block">
                <Loop src={`${LOCAL}/product-ad.mp4`} poster={`${POSTER}/skill-product-ad.jpg`} label="A product commercial made on BuzzVideo" />
              </div>
              <div className="rounded-[22px] bg-[#F6F6F6] p-6 sm:p-10">
                <h2 id="contact-h" className="text-[clamp(28px,3vw,36px)] font-bold leading-tight tracking-[-0.015em] text-[#240A03]">
                  Contact our team
                </h2>
                <p className="mb-8 mt-3 max-w-[44ch] text-[15px] leading-[24px] text-[#6F6C6C]">Tell us about your team and the ads you make. We&apos;ll get back to you with a demo and a plan that fits.</p>
                <ContactForm />
              </div>
            </div>
          </section>
        </div>
      </div>

      <JsonLd data={[{ "@context": "https://schema.org", "@type": "WebPage", name: "BuzzVideo Enterprise", url: "https://buzzvideo.ai/enterprise", publisher: ORG }]} />
    </main>
  );
}
