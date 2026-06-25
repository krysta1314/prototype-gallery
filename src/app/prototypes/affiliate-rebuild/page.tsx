"use client";

import { useState } from "react";
import {
  ArrowRight,
  MousePointerClick,
  Share2,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal } from "@/components/reveal";

const TOLT_URL = "https://buzzvideo.tolt.com/login";
function openTolt() {
  window.open(TOLT_URL, "_blank", "noopener");
}
function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

/* ---------- Brand helpers (design.md 规范,原样复用) ---------- */
const gradText =
  "bg-gradient-to-r from-[#ffc078] to-[#ff5e1a] bg-clip-text text-transparent";
const ctaBtn =
  "h-auto rounded-xl bg-gradient-to-br from-[#FFA73C] to-[#FF5255] px-7 py-3.5 text-base font-bold text-white shadow-[0_10px_30px_rgba(255,82,85,0.28)] transition hover:brightness-105 hover:shadow-[0_14px_38px_rgba(255,82,85,0.4)]";
const kicker =
  "inline-block rounded-full bg-[#fff3ec] px-3.5 py-1.5 text-[13px] font-bold uppercase tracking-[0.14em] text-[#ff5e1a]";
const display =
  "font-[family-name:var(--font-display)] font-extrabold tracking-tight text-[#1a1a2e]";

const vsrc = (n: number) =>
  `/prototypes/2026-06-09-affiliate/assets/广告视频${n}.mp4`;

/* ============================================================= */

export default function AffiliateRebuildPage() {
  return (
    <main className="bg-white text-[#1a1a2e]">
      <Hero />
      <HowItWorks />
      <Calculator />
      <SocialProof />
      <Faq />
      <FinalCta />
    </main>
  );
}

/* ---------- Hero:左右分栏,右侧视频墙做首屏视觉 ---------- */
function Hero() {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(160deg,#ffe7d2_0%,#ffffff_56%,#ffdedf_100%)]">
      <div className="mx-auto grid max-w-[1160px] items-center gap-12 px-6 pt-20 pb-16 md:grid-cols-[1.05fr_0.95fr] md:pt-24 md:pb-20">
        {/* 左:文案 */}
        <Reveal>
          <div className="inline-block rounded-full border border-[rgba(255,94,26,0.28)] px-3.5 py-1.5 text-[13px] font-bold uppercase tracking-[0.18em] text-[#ff5e1a]">
            BuzzVideo Affiliate Program
          </div>
          <h1
            className={`mt-6 text-[clamp(38px,5.6vw,62px)] leading-[1.05] ${display}`}
          >
            Get paid to share
            <br />
            <span className={gradText}>BuzzVideo</span>
          </h1>
          <p className="mt-5 max-w-[32ch] text-[clamp(16px,1.6vw,19px)] leading-relaxed text-[#6a6b7b]">
            Earn up to 50% commission plus 1,500 free credits for every paying
            customer you bring in. No earning cap.
          </p>
          <div className="mt-8 flex flex-wrap gap-3.5">
            <Button className={ctaBtn} onClick={openTolt}>
              Become a partner <ArrowRight className="ml-2 size-[19px]" />
            </Button>
            <Button
              variant="outline"
              className="h-auto rounded-xl border-[#ececf1] bg-white px-6 py-3.5 text-base font-bold text-[#1a1a2e] hover:border-[#ff5e1a] hover:bg-[#fff7f1]"
              onClick={() => scrollTo("how")}
            >
              See how it works
            </Button>
          </div>
        </Reveal>

        {/* 右:三支竖屏视频错落 */}
        <Reveal delay={120} className="relative">
          <div className="flex justify-center gap-3.5 md:justify-end">
            {[1, 2, 3].map((n, i) => (
              <video
                key={n}
                src={vsrc(n)}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                className={`w-[30%] max-w-[150px] rounded-[20px] border-4 border-white object-cover shadow-[0_20px_44px_rgba(26,26,46,0.22)] [aspect-ratio:9/16] ${
                  i === 1 ? "-translate-y-6" : "translate-y-3"
                }`}
              />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- How it works:横向时间线(避开三等分卡片套路) ---------- */
const STEPS = [
  {
    no: "01",
    title: "Sign up free",
    icon: MousePointerClick,
    desc: "Create your Tolt account to unlock your partner dashboard and custom tracking link.",
  },
  {
    no: "02",
    title: "Share your link",
    icon: Share2,
    desc: "Drop it in your videos, posts, newsletters or DMs. The more targeted the audience, the better.",
  },
  {
    no: "03",
    title: "Earn commission",
    icon: Wallet,
    desc: "Earn 30% to 50% as you refer more, plus 1,500 free credits for both of you.",
  },
];

function HowItWorks() {
  return (
    <section id="how" className="bg-white px-6 py-24">
      <div className="mx-auto max-w-[1040px]">
        <Reveal className="max-w-[640px]">
          <div className={kicker}>Become an affiliate</div>
          <h2 className={`mt-4 text-[clamp(28px,4vw,40px)] ${display}`}>
            Three steps to your first payout
          </h2>
          <p className="mt-3 text-[17px] leading-relaxed text-[#6a6b7b]">
            Share your link. Your referral subscribes. You earn up to 50%
            commission. That&apos;s it.
          </p>
        </Reveal>

        <div className="relative mt-14 grid gap-y-12 md:grid-cols-3 md:gap-x-9">
          {/* 桌面连接线 */}
          <div className="pointer-events-none absolute left-0 right-0 top-[22px] hidden h-px bg-[linear-gradient(90deg,#ffd9bd,#ffb38a,#ffd9bd)] md:block" />
          {STEPS.map((s, i) => (
            <Reveal key={s.no} delay={i * 110} className="relative">
              <div className="flex items-center gap-4 md:block">
                <div className="relative z-[1] flex size-11 shrink-0 items-center justify-center rounded-[13px] bg-gradient-to-br from-[#FFA73C] to-[#FF5255] text-white shadow-[0_8px_20px_rgba(255,82,85,0.3)]">
                  <s.icon className="size-[21px]" />
                </div>
                <span
                  className={`text-[15px] font-extrabold uppercase tracking-[0.16em] ${gradText} md:hidden`}
                >
                  Step {s.no}
                </span>
              </div>
              <p
                className={`mt-5 hidden text-[14px] font-extrabold uppercase tracking-[0.16em] md:block ${gradText}`}
              >
                Step {s.no}
              </p>
              <h3 className={`mt-3 text-[21px] ${display}`}>{s.title}</h3>
              <p className="mt-2.5 max-w-[34ch] text-[15px] leading-relaxed text-[#6a6b7b]">
                {s.desc}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Calculator:左右分栏,右侧实时结果面板 ----------
   阶梯佣金:推荐越多佣金率越高。1-24 → 30%、25-49 → 40%、50+ → 50%。 */
const PRICE: Record<string, { monthly: number; yearly: number }> = {
  starter: { monthly: 19, yearly: 168 },
  pro: { monthly: 49, yearly: 420 },
  ultra: { monthly: 89, yearly: 756 },
};
const TIERS = [
  { rate: 0.3, label: "30%", range: "1-24" },
  { rate: 0.4, label: "40%", range: "25-49" },
  { rate: 0.5, label: "50%", range: "50+" },
] as const;
const tierIndex = (refs: number) => (refs >= 50 ? 2 : refs >= 25 ? 1 : 0);

function Calculator() {
  const [plan, setPlan] = useState<keyof typeof PRICE>("pro");
  const [cycle, setCycle] = useState<"monthly" | "yearly">("yearly");
  const [refs, setRefs] = useState(30);

  const ti = tierIndex(refs);
  const rate = TIERS[ti].rate;
  const total = Math.round(PRICE[plan][cycle] * rate * refs);

  return (
    <section className="bg-[#faf8f6] px-6 py-24">
      <div className="mx-auto max-w-[1040px]">
        <Reveal className="max-w-[640px]">
          <div className={kicker}>Earnings calculator</div>
          <h2 className={`mt-4 text-[clamp(28px,4vw,40px)] ${display}`}>
            See what you could earn
          </h2>
          <p className="mt-3 text-[17px] leading-relaxed text-[#6a6b7b]">
            Drag the slider to estimate your commission for the customers you
            bring to BuzzVideo.
          </p>
        </Reveal>

        <Reveal delay={100} className="mt-12">
          <div className="grid overflow-hidden rounded-[24px] border border-[#ececf1] bg-white shadow-[0_4px_16px_rgba(26,26,46,0.06)] md:grid-cols-[1.15fr_1fr]">
            {/* 左:控件 */}
            <div className="p-8 md:p-10">
              <FieldLabel>Plan your referrals are on</FieldLabel>
              <div className="mb-7 flex gap-2.5">
                {(["starter", "pro", "ultra"] as const).map((p) => (
                  <Chip key={p} active={plan === p} onClick={() => setPlan(p)}>
                    {p[0].toUpperCase() + p.slice(1)}
                  </Chip>
                ))}
              </div>

              <FieldLabel>Billing</FieldLabel>
              <div className="mb-8 flex w-fit gap-2.5">
                {(["monthly", "yearly"] as const).map((c) => (
                  <Chip
                    key={c}
                    active={cycle === c}
                    onClick={() => setCycle(c)}
                    grow={false}
                  >
                    {c[0].toUpperCase() + c.slice(1)}
                  </Chip>
                ))}
              </div>

              <div className="mb-2 flex items-baseline justify-between">
                <FieldLabel>Friends referred</FieldLabel>
                <span className={`text-[20px] font-extrabold tabular-nums ${gradText}`}>
                  {refs}
                </span>
              </div>
              <Slider
                value={[refs]}
                onValueChange={(v) => setRefs(v[0])}
                min={0}
                max={100}
                step={1}
                className="[&_[data-slot=slider-range]]:bg-[#1f2030] [&_[data-slot=slider-thumb]]:border-[#1f2030] [&_[data-slot=slider-track]]:bg-[#ececf1]"
              />

              {/* 阶梯档位:当前档高亮 */}
              <div className="mt-7">
                <FieldLabel>Commission tier</FieldLabel>
                <div className="grid grid-cols-3 gap-2.5">
                  {TIERS.map((t, i) => {
                    const on = i === ti;
                    return (
                      <div
                        key={t.label}
                        className={`rounded-xl border px-3 py-2.5 transition ${
                          on
                            ? "border-transparent bg-gradient-to-br from-[#FFA73C] to-[#FF5255] text-white shadow-[0_6px_18px_rgba(255,82,85,0.28)]"
                            : "border-[#ececf1] bg-white text-[#6a6b7b]"
                        }`}
                      >
                        <div className="text-[18px] font-extrabold tabular-nums">
                          {t.label}
                        </div>
                        <div className={`mt-0.5 text-[11px] ${on ? "text-white/85" : "text-[#9a9aa8]"}`}>
                          {t.range} refs
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 右:结果 */}
            <div className="flex flex-col justify-center border-t border-[#ececf1] bg-[linear-gradient(150deg,#fff4ec,#ffe9e2)] p-8 text-center md:border-l md:border-t-0 md:p-10">
              <div className="text-[13px] font-bold uppercase tracking-[0.14em] text-[#6a6b7b]">
                Your estimated commission
              </div>
              <div
                className={`mt-3 text-[clamp(46px,8vw,64px)] font-extrabold leading-none tracking-tight tabular-nums ${gradText}`}
                style={{ fontFamily: "var(--font-display)" }}
              >
                ${total.toLocaleString("en-US")}
              </div>
              <div className="mt-3 text-[14px] text-[#6a6b7b]">
                At {Math.round(rate * 100)}% commission · {refs} referral
                {refs === 1 ? "" : "s"} on {plan[0].toUpperCase() + plan.slice(1)}
              </div>
              <Button className={`${ctaBtn} mt-7 w-full justify-center`} onClick={openTolt}>
                Become a partner <ArrowRight className="ml-2 size-[19px]" />
              </Button>
              <p className="mt-3 text-[12px] text-[#9a9aa8]">
                Numbers are illustrative. Your rate rises with referrals: 30% to
                40% to 50%.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 text-[12.5px] font-bold uppercase tracking-[0.08em] text-[#6a6b7b]">
      {children}
    </div>
  );
}

function Chip({
  children,
  active,
  onClick,
  grow = true,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  grow?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`${grow ? "flex-1" : "px-6"} rounded-xl border px-4 py-3 text-[15px] font-semibold transition ${
        active
          ? "border-transparent bg-gradient-to-br from-[#FFA73C] to-[#FF5255] text-white shadow-[0_6px_18px_rgba(255,82,85,0.3)]"
          : "border-[#ececf1] text-[#6a6b7b] hover:border-[#d4d3df] hover:text-[#1a1a2e]"
      }`}
    >
      {children}
    </button>
  );
}

/* ---------- Social proof:证言 + $2M 统计带 ---------- */
const TESTIMONIALS = [
  {
    name: "Maya Robinson",
    role: "Social media marketer",
    quote:
      "BuzzVideo makes ad creative so much faster, so recommending it to other marketers was a no-brainer. Now it pays me too.",
  },
  {
    name: "Daniel Carter",
    role: "Marketing consultant",
    quote:
      "I ship ad creative every week. When other marketers ask what I use, I share my link and the commissions add up fast.",
  },
  {
    name: "Priya Sharma",
    role: "Newsletter writer",
    quote:
      "All the images and videos in my newsletter are made with BuzzVideo, so featuring it felt natural. The commission is a bonus.",
  },
];

function SocialProof() {
  return (
    <section className="bg-white px-6 py-24">
      <div className="mx-auto max-w-[1040px]">
        <Reveal className="max-w-[640px]">
          <div className={kicker}>Testimonials</div>
          <h2 className={`mt-4 text-[clamp(28px,4vw,40px)] ${display}`}>
            Real partners. Real revenue.
          </h2>
          <p className="mt-3 text-[17px] leading-relaxed text-[#6a6b7b]">
            BuzzVideo partners are earning more with just a few simple links.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-[22px] md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={i * 100}>
              <figure className="flex h-full flex-col rounded-[18px] border border-[#ececf1] bg-white p-7 shadow-[0_4px_16px_rgba(26,26,46,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(26,26,46,0.1)]">
                <div
                  className="mb-2.5 text-[52px] font-extrabold leading-[0.6] text-[#ff5e1a] opacity-25"
                  style={{ fontFamily: "var(--font-display)" }}
                  aria-hidden
                >
                  &ldquo;
                </div>
                <blockquote className="mb-5 text-[15px] leading-[1.65]">
                  {t.quote}
                </blockquote>
                <figcaption className="mt-auto border-t border-[#ececf1] pt-[18px]">
                  <div className="text-[15px] font-bold">{t.name}</div>
                  <div className="mt-0.5 text-[13px] text-[#6a6b7b]">
                    {t.role}
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>

        {/* $2M 统计带 */}
        <Reveal delay={120} className="mt-7">
          <div className="flex flex-col items-center gap-3 rounded-[24px] bg-[linear-gradient(135deg,#1f2030,#2c2533)] px-8 py-14 text-center">
            <div className="text-[15px] font-semibold text-white/70">
              Our partners have earned
            </div>
            <div
              className={`text-[clamp(52px,9vw,88px)] font-extrabold leading-none tracking-tight tabular-nums ${gradText}`}
              style={{ fontFamily: "var(--font-display)" }}
            >
              $2,000,000+
            </div>
            <div className="text-[13px] font-bold uppercase tracking-[0.18em] text-white/50">
              paid to partners
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- FAQ ---------- */
const FAQ = [
  {
    q: "How and when do I get paid?",
    a: "Commissions are paid out monthly through Tolt. You can choose PayPal or bank transfer. Once a referral's first payment clears the 30-day refund window, your commission is approved and paid in the next monthly cycle.",
  },
  {
    q: "Is there a minimum payout?",
    a: "Yes. You can withdraw once your balance reaches $100. Anything below that rolls over to the next cycle.",
  },
  {
    q: "What's the commission?",
    a: "Commission is tiered and rises with volume: 30% up to 24 paying customers, 40% from 25 to 49, and 50% at 50 and above. Plus 1,500 free credits for both of you, with no limit on how much you can earn.",
  },
  {
    q: "How long does the referral cookie last?",
    a: "The referral cookie lasts 30 days, so you still get credit if your friend signs up within a month of clicking your link.",
  },
  {
    q: "Who can join?",
    a: "Anyone: creators, marketers, agencies and everyday Buzz fans. Signing up is free and takes minutes.",
  },
  {
    q: "Can I refer myself?",
    a: "No. Self-referrals don't qualify for commission. Referrals must be genuine new users.",
  },
  {
    q: "Can I run paid ads?",
    a: "You can promote your link across most channels, but bidding on Buzz brand terms in paid search isn't allowed. When in doubt, reach out before running campaigns.",
  },
  {
    q: "Where do I track earnings?",
    a: "Everything lives in your Tolt dashboard. Track your clicks, conversions and payouts in one place.",
  },
];

function Faq() {
  return (
    <section className="bg-[#faf8f6] px-6 py-24">
      <div className="mx-auto max-w-[760px]">
        <Reveal>
          <div className={kicker}>FAQ</div>
          <h2 className={`mb-9 mt-4 text-[clamp(28px,4vw,40px)] ${display}`}>
            Frequently asked questions
          </h2>
        </Reveal>
        <Reveal delay={80}>
          <Accordion type="single" collapsible className="text-left">
            {FAQ.map((f, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="mb-3 rounded-2xl border border-[#ececf1] bg-white px-5 shadow-[0_4px_16px_rgba(26,26,46,0.06)]"
              >
                <AccordionTrigger className="py-5 text-base font-semibold hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-[15px] leading-relaxed text-[#6a6b7b]">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- Final CTA:视频墙收尾 ---------- */
const WALL = [1, 2, 3, 4, 5, 6];

function FinalCta() {
  return (
    <section className="bg-white px-6 py-24">
      <div className="relative mx-auto max-w-[1040px] overflow-hidden rounded-[28px] bg-[linear-gradient(110deg,#ffe3cf_0%,#fff2e8_45%,#fff7f0_100%)] px-6 pt-16 pb-0">
        <div className="relative z-[2] text-center">
          <h2 className={`text-[clamp(30px,5vw,48px)] ${display}`}>
            Become a partner today
          </h2>
          <p className="mx-auto mb-8 mt-4 max-w-[44ch] text-[clamp(15px,2vw,18px)] text-[#6a6b7b]">
            Recommend BuzzVideo and start earning on every customer you send.
          </p>
          <Button className={ctaBtn} onClick={openTolt}>
            Become a partner <ArrowRight className="ml-2 size-[19px]" />
          </Button>
        </div>

        <div className="relative z-[2] mt-14 flex justify-center gap-3.5 overflow-hidden">
          {WALL.map((n, i) => (
            <video
              key={n}
              src={vsrc(n)}
              autoPlay
              muted
              loop
              playsInline
              preload="none"
              className={`w-[15%] max-w-[120px] rounded-t-[18px] border-4 border-b-0 border-white object-cover shadow-[0_16px_36px_rgba(26,26,46,0.2)] [aspect-ratio:9/16] ${
                i % 2 === 1 ? "translate-y-5" : ""
              }`}
            />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-[120px] bg-[linear-gradient(rgba(255,247,240,0),#fff7f0)]" />
      </div>
    </section>
  );
}
