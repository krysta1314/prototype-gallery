"use client";

import { useState } from "react";
import { ArrowUpRight, Plus, Minus } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Reveal } from "@/components/reveal";

const TOLT_URL = "https://buzzvideo.tolt.com/login";
function openTolt() {
  window.open(TOLT_URL, "_blank", "noopener");
}

/* 彻底换皮版:深色影院风 · Bricolage 编辑体 · 橙色单一强调
   跳出 design.md 的居中卡片体系,品牌只保留「橙」这一可识别符号。 */
const ORANGE = "#ff6a1f";
const head = { fontFamily: "var(--font-bricolage)" } as const;
const vsrc = (n: number) =>
  `/prototypes/2026-06-09-affiliate/assets/广告视频${n}.mp4`;

function Cta({
  children,
  full = false,
}: {
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <button
      onClick={openTolt}
      className={`group inline-flex items-center justify-center gap-2 rounded-full bg-[#ff6a1f] px-8 py-4 text-[15px] font-semibold text-[#15110c] transition hover:bg-[#ff7d3a] active:scale-[0.98] ${
        full ? "w-full" : ""
      }`}
    >
      {children}
      <ArrowUpRight className="size-[18px] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </button>
  );
}

export default function AffiliateBoldPage() {
  return (
    <main
      className="bg-[#0d0c10] text-[#f4f1ec] selection:bg-[#ff6a1f] selection:text-[#15110c]"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <style>{`
        @keyframes bold-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .bold-marquee-track { animation: bold-marquee 38s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .bold-marquee-track { animation: none; }
        }
      `}</style>

      <Hero />
      <Stats />
      <HowItWorks />
      <Calculator />
      <Voices />
      <Faq />
      <FinalCta />
    </main>
  );
}

/* ---------- Hero:左对齐巨型字 + 底部视频跑马灯 ---------- */
function Hero() {
  return (
    <section className="relative min-h-[100dvh] overflow-hidden border-b border-white/8 pt-28">
      {/* 暖色光晕 */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-[10%] -top-[10%] size-[60vw] rounded-full opacity-50 blur-[120px]"
        style={{
          background: `radial-gradient(circle, ${ORANGE}55, transparent 70%)`,
        }}
      />
      <div className="relative mx-auto max-w-[1280px] px-6">
        <Reveal>
          <p className="text-[13px] font-medium uppercase tracking-[0.3em] text-white/40">
            BuzzVideo Affiliate Program
          </p>
          <h1
            className="mt-7 max-w-[14ch] text-[clamp(48px,9vw,128px)] font-extrabold leading-[0.92] tracking-[-0.03em]"
            style={head}
          >
            Get paid to share{" "}
            <span style={{ color: ORANGE }}>BuzzVideo.</span>
          </h1>
        </Reveal>

        <Reveal delay={120}>
          <div className="mt-9 flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
            <p className="max-w-[42ch] text-[clamp(16px,1.8vw,20px)] leading-relaxed text-white/60">
              50% commission. 1,500 free credits per customer. No cap on what
              you take home.
            </p>
            <Cta>Become a partner</Cta>
          </div>
        </Reveal>
      </div>

      {/* 视频跑马灯 */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden pb-10">
        <Reveal delay={220} y={40}>
          <div className="flex w-max bold-marquee-track gap-4 pl-4">
            {[...[1, 2, 3, 4, 5, 6], ...[1, 2, 3, 4, 5, 6]].map((n, i) => (
              <video
                key={i}
                src={vsrc(n)}
                autoPlay
                muted
                loop
                playsInline
                preload={i < 4 ? "metadata" : "none"}
                className="w-[148px] shrink-0 rounded-2xl object-cover shadow-[0_20px_50px_rgba(0,0,0,0.5)] [aspect-ratio:9/16]"
              />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- Stats:编辑式数字行,靠 hairline 分隔 ---------- */
const STATS = [
  { v: "50%", l: "commission on every sale" },
  { v: "$2M+", l: "paid out to partners" },
  { v: "1,500", l: "free credits per referral" },
];

function Stats() {
  return (
    <section className="border-b border-white/8 px-6 py-20 md:py-28">
      <div className="mx-auto grid max-w-[1280px] gap-px md:grid-cols-3">
        {STATS.map((s, i) => (
          <Reveal
            key={s.v}
            delay={i * 110}
            className="border-t border-white/10 pt-7 md:border-l md:border-t-0 md:pl-9 md:first:border-l-0 md:first:pl-0"
          >
            <div
              className="text-[clamp(56px,8vw,104px)] font-extrabold leading-none tracking-[-0.03em] tabular-nums"
              style={{ ...head, color: ORANGE }}
            >
              {s.v}
            </div>
            <div className="mt-4 max-w-[20ch] text-[15px] leading-snug text-white/50">
              {s.l}
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------- How it works:大号编号列表 ---------- */
const STEPS = [
  {
    no: "01",
    title: "Sign up free",
    desc: "Create your Tolt account to unlock your partner dashboard and a custom tracking link.",
  },
  {
    no: "02",
    title: "Share your link",
    desc: "Drop it in your videos, posts, newsletters or DMs. The more targeted the audience, the better the conversion.",
  },
  {
    no: "03",
    title: "Earn commission",
    desc: "Take 50% on every paying customer you bring in, plus 1,500 free credits for both of you.",
  },
];

function HowItWorks() {
  return (
    <section className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1280px]">
        <Reveal>
          <h2
            className="max-w-[16ch] text-[clamp(32px,5vw,64px)] font-extrabold leading-[1.02] tracking-[-0.02em]"
            style={head}
          >
            From link to payout in three moves.
          </h2>
        </Reveal>
        <div className="mt-16">
          {STEPS.map((s, i) => (
            <Reveal key={s.no} delay={i * 80}>
              <div className="grid items-baseline gap-4 border-t border-white/10 py-9 md:grid-cols-[140px_1fr_minmax(0,46ch)] md:gap-10 md:py-12">
                <div
                  className="text-[clamp(40px,5vw,64px)] font-extrabold leading-none tabular-nums text-white/15"
                  style={head}
                >
                  {s.no}
                </div>
                <h3
                  className="text-[clamp(22px,2.6vw,34px)] font-bold tracking-[-0.01em]"
                  style={head}
                >
                  {s.title}
                </h3>
                <p className="text-[16px] leading-relaxed text-white/55">
                  {s.desc}
                </p>
              </div>
            </Reveal>
          ))}
          <div className="border-t border-white/10" />
        </div>
      </div>
    </section>
  );
}

/* ---------- Calculator:深色玻璃面板 ---------- */
const COMMISSION: Record<string, { monthly: number; yearly: number }> = {
  starter: { monthly: 9.5, yearly: 84 },
  pro: { monthly: 24.5, yearly: 210 },
  ultra: { monthly: 44.5, yearly: 378 },
};

function Calculator() {
  const [plan, setPlan] = useState<keyof typeof COMMISSION>("pro");
  const [cycle, setCycle] = useState<"monthly" | "yearly">("yearly");
  const [refs, setRefs] = useState(30);
  const per = COMMISSION[plan][cycle];
  const total = per * refs;

  return (
    <section className="px-6 pb-24 md:pb-32">
      <div className="mx-auto max-w-[1280px]">
        <Reveal>
          <div className="grid overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] backdrop-blur-sm md:grid-cols-2">
            {/* 控件 */}
            <div className="border-b border-white/10 p-8 md:border-b-0 md:border-r md:p-12">
              <h2
                className="text-[clamp(26px,3vw,40px)] font-extrabold tracking-[-0.02em]"
                style={head}
              >
                Run the numbers.
              </h2>

              <Label>Plan your referrals are on</Label>
              <div className="mb-7 flex gap-2">
                {(["starter", "pro", "ultra"] as const).map((p) => (
                  <Pill key={p} active={plan === p} onClick={() => setPlan(p)}>
                    {p[0].toUpperCase() + p.slice(1)}
                  </Pill>
                ))}
              </div>

              <Label>Billing</Label>
              <div className="mb-8 flex w-fit gap-2">
                {(["monthly", "yearly"] as const).map((c) => (
                  <Pill key={c} active={cycle === c} onClick={() => setCycle(c)}>
                    {c[0].toUpperCase() + c.slice(1)}
                  </Pill>
                ))}
              </div>

              <div className="mb-3 flex items-center justify-between">
                <Label inline>Friends referred</Label>
                <div className="flex items-center gap-3">
                  <StepBtn onClick={() => setRefs((r) => Math.max(0, r - 1))}>
                    <Minus className="size-4" />
                  </StepBtn>
                  <span
                    className="w-10 text-center text-[22px] font-bold tabular-nums"
                    style={head}
                  >
                    {refs}
                  </span>
                  <StepBtn onClick={() => setRefs((r) => Math.min(100, r + 1))}>
                    <Plus className="size-4" />
                  </StepBtn>
                </div>
              </div>
              <Slider
                value={[refs]}
                onValueChange={(v) => setRefs(v[0])}
                min={0}
                max={100}
                step={1}
                className="[&_[data-slot=slider-range]]:bg-[#ff6a1f] [&_[data-slot=slider-thumb]]:border-[#ff6a1f] [&_[data-slot=slider-thumb]]:bg-[#ff6a1f] [&_[data-slot=slider-track]]:bg-white/12"
              />
            </div>

            {/* 结果 */}
            <div className="flex flex-col justify-center p-8 md:p-12">
              <div className="text-[13px] font-medium uppercase tracking-[0.22em] text-white/40">
                You could earn
              </div>
              <div
                className="mt-4 text-[clamp(56px,11vw,104px)] font-extrabold leading-none tracking-[-0.03em] tabular-nums"
                style={{ ...head, color: ORANGE }}
              >
                ${total.toLocaleString("en-US")}
              </div>
              <div className="mt-4 text-[15px] text-white/50">
                ${per.toLocaleString("en-US")} per referral · 50% commission on
                all sales
              </div>
              <div className="mt-9">
                <Cta full>Become a partner</Cta>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Label({
  children,
  inline = false,
}: {
  children: React.ReactNode;
  inline?: boolean;
}) {
  return (
    <div
      className={`text-[12px] font-medium uppercase tracking-[0.18em] text-white/40 ${
        inline ? "" : "mb-3 mt-8 first:mt-7"
      }`}
    >
      {children}
    </div>
  );
}

function Pill({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-5 py-2.5 text-[14px] font-medium transition ${
        active
          ? "border-[#ff6a1f] bg-[#ff6a1f] text-[#15110c]"
          : "border-white/15 text-white/60 hover:border-white/35 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function StepBtn({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex size-8 items-center justify-center rounded-full border border-white/15 text-white/70 transition hover:border-white/40 hover:text-white active:scale-95"
    >
      {children}
    </button>
  );
}

/* ---------- Voices:横向滚动证言 ---------- */
const VOICES = [
  {
    name: "Maya Robinson",
    role: "Social media marketer",
    quote:
      "BuzzVideo makes ad creative so much faster, so recommending it was a no-brainer. Now it pays me too.",
  },
  {
    name: "Daniel Carter",
    role: "Marketing consultant",
    quote:
      "When other marketers ask what I use, I just share my link. The commissions add up fast.",
  },
  {
    name: "Priya Sharma",
    role: "Newsletter writer",
    quote:
      "Every video in my newsletter is made with BuzzVideo, so featuring it felt completely natural.",
  },
  {
    name: "Marcus Thompson",
    role: "DTC brand owner",
    quote:
      "I make all my Shopify ads with BuzzVideo. I tell every store owner I know to try it.",
  },
];

function Voices() {
  return (
    <section className="border-y border-white/8 py-24 md:py-28">
      <div className="mx-auto mb-12 max-w-[1280px] px-6">
        <Reveal>
          <h2
            className="text-[clamp(32px,5vw,64px)] font-extrabold tracking-[-0.02em]"
            style={head}
          >
            Real partners. Real revenue.
          </h2>
        </Reveal>
      </div>
      <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {VOICES.map((v, i) => (
          <Reveal
            key={v.name}
            delay={i * 70}
            className="w-[82vw] shrink-0 snap-start sm:w-[420px]"
          >
            <figure className="flex h-full flex-col rounded-[22px] border border-white/10 bg-white/[0.03] p-8">
              <blockquote
                className="text-[clamp(19px,2.2vw,26px)] font-medium leading-snug tracking-[-0.01em]"
                style={head}
              >
                {v.quote}
              </blockquote>
              <figcaption className="mt-8 flex items-center gap-3 border-t border-white/10 pt-6">
                <span
                  className="flex size-10 items-center justify-center rounded-full text-[15px] font-bold text-[#15110c]"
                  style={{ ...head, background: ORANGE }}
                  aria-hidden
                >
                  {v.name[0]}
                </span>
                <span>
                  <span className="block text-[15px] font-semibold">
                    {v.name}
                  </span>
                  <span className="block text-[13px] text-white/45">
                    {v.role}
                  </span>
                </span>
              </figcaption>
            </figure>
          </Reveal>
        ))}
        <div className="w-2 shrink-0" aria-hidden />
      </div>
    </section>
  );
}

/* ---------- FAQ:深色 hairline 折叠 ---------- */
const FAQ = [
  {
    q: "How and when do I get paid?",
    a: "Commissions are paid monthly through Tolt via PayPal or bank transfer. Once a referral's first payment clears the 30-day refund window, your commission is approved and paid in the next cycle.",
  },
  {
    q: "Is there a minimum payout?",
    a: "Yes. You can withdraw once your balance reaches $100. Anything below that rolls over to the next cycle.",
  },
  {
    q: "What's the commission?",
    a: "50% on every paying customer you bring in, plus 1,500 free credits for both of you. One of the highest cash rates in the category, with no earning cap.",
  },
  {
    q: "How long does the referral cookie last?",
    a: "30 days, so you still get credit if your friend signs up within a month of clicking your link.",
  },
  {
    q: "Who can join?",
    a: "Anyone: creators, marketers, agencies and everyday Buzz fans. Signing up is free and takes minutes.",
  },
  {
    q: "Can I run paid ads?",
    a: "You can promote your link across most channels, but bidding on Buzz brand terms in paid search isn't allowed. When in doubt, reach out before running campaigns.",
  },
];

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="px-6 py-24 md:py-32">
      <div className="mx-auto grid max-w-[1280px] gap-12 md:grid-cols-[0.8fr_1.2fr]">
        <Reveal>
          <h2
            className="text-[clamp(32px,4vw,56px)] font-extrabold tracking-[-0.02em]"
            style={head}
          >
            Questions, answered.
          </h2>
        </Reveal>
        <Reveal delay={80}>
          <div>
            {FAQ.map((f, i) => {
              const isOpen = open === i;
              return (
                <div key={i} className="border-t border-white/10 last:border-b">
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-6 py-6 text-left"
                  >
                    <span
                      className="text-[clamp(17px,1.8vw,21px)] font-semibold"
                      style={head}
                    >
                      {f.q}
                    </span>
                    <span
                      className="grid size-7 shrink-0 place-items-center rounded-full border border-white/20 transition"
                      style={{
                        transform: isOpen ? "rotate(45deg)" : "none",
                        borderColor: isOpen ? ORANGE : undefined,
                        color: isOpen ? ORANGE : undefined,
                      }}
                    >
                      <Plus className="size-4" />
                    </span>
                  </button>
                  <div
                    className="grid transition-all duration-300 ease-out"
                    style={{
                      gridTemplateRows: isOpen ? "1fr" : "0fr",
                      opacity: isOpen ? 1 : 0,
                    }}
                  >
                    <div className="overflow-hidden">
                      <p className="max-w-[60ch] pb-6 text-[15px] leading-relaxed text-white/55">
                        {f.a}
                      </p>
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

/* ---------- Final CTA:满幅橙色收尾 ---------- */
function FinalCta() {
  return (
    <section className="px-6 pb-6">
      <Reveal>
        <div
          className="relative mx-auto max-w-[1280px] overflow-hidden rounded-[32px] px-8 py-24 text-center md:py-32"
          style={{
            background: `linear-gradient(135deg, ${ORANGE}, #ff8a3d)`,
          }}
        >
          <h2
            className="mx-auto max-w-[18ch] text-[clamp(36px,6vw,80px)] font-extrabold leading-[0.98] tracking-[-0.03em] text-[#15110c]"
            style={head}
          >
            Start earning this month.
          </h2>
          <p className="mx-auto mb-10 mt-6 max-w-[40ch] text-[clamp(16px,2vw,19px)] text-[#15110c]/70">
            Free to join, takes minutes, and there&apos;s no limit on what you
            can make.
          </p>
          <button
            onClick={openTolt}
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#15110c] px-9 py-4 text-[15px] font-semibold text-[#f4f1ec] transition hover:bg-black active:scale-[0.98]"
          >
            Become a partner
            <ArrowUpRight className="size-[18px] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </div>
      </Reveal>
    </section>
  );
}
