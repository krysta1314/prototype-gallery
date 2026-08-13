"use client";

import { useState } from "react";
import {
  ArrowRight,
  Pencil,
  Share2,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const TOLT_URL = "https://buzzvideo.tolt.com/login";

function openTolt() {
  window.open(TOLT_URL, "_blank", "noopener");
}

/* ---------- Brand helpers ---------- */
const gradText =
  "bg-gradient-to-r from-[#ffc078] to-[#ff5e1a] bg-clip-text text-transparent";
const ctaBtn =
  "h-auto rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-7 py-3.5 text-base font-bold text-white shadow-[0_10px_30px_rgba(255,82,85,0.28)] transition hover:brightness-105 hover:shadow-[0_14px_38px_rgba(255,82,85,0.4)]";
const kicker =
  "inline-block rounded-full bg-[#fff3ec] px-3.5 py-1.5 text-[13px] font-bold uppercase tracking-[0.14em] text-[#ff5e1a]";

/* ---------- Earnings calculator ---------- */
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
  const pct = refs / 100;

  return (
    <section className="bg-[#faf8f6] px-6 py-20">
      <div className="mx-auto max-w-[1040px]">
        <div className="rounded-[22px] border border-[#ececf1] bg-white p-9 shadow-[0_4px_16px_rgba(26,26,46,0.06)]">
          <div className="mb-9 text-center">
            <div className={kicker}>Affiliate Earnings Calculator</div>
            <h2 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(28px,4vw,40px)] font-extrabold tracking-tight text-[#1a1a2e]">
              Ready to scale your earnings?
            </h2>
            <p className="mt-3.5 text-[17px] leading-relaxed text-[#6a6b7b]">
              Calculate your commission for every customer you bring to BuzzVideo.
            </p>
          </div>

          {/* Plan */}
          <Label>Plan</Label>
          <div className="mb-6 flex gap-2.5">
            {(["starter", "pro", "ultra"] as const).map((p) => (
              <Chip key={p} active={plan === p} onClick={() => setPlan(p)}>
                {p[0].toUpperCase() + p.slice(1)}
              </Chip>
            ))}
          </div>

          {/* Billing */}
          <Label>Billing</Label>
          <div className="mb-7 flex w-fit gap-2.5">
            {(["monthly", "yearly"] as const).map((c) => (
              <Chip key={c} active={cycle === c} onClick={() => setCycle(c)} grow={false}>
                {c[0].toUpperCase() + c.slice(1)}
              </Chip>
            ))}
          </div>

          {/* Slider */}
          <Label>Friends referred</Label>
          <div className="relative pt-12">
            <div
              className="pointer-events-none absolute top-0 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#1f2030] px-3 py-1.5 text-[13px] font-bold text-white shadow-[0_6px_16px_rgba(31,32,48,0.28)] after:absolute after:left-1/2 after:top-full after:-translate-x-1/2 after:border-[5px] after:border-transparent after:border-t-[#1f2030] after:content-['']"
              style={{ left: `calc(${pct * 100}% + ${(0.5 - pct) * 22}px)` }}
            >
              {refs} referral{refs === 1 ? "" : "s"}
            </div>
            <Slider
              value={[refs]}
              onValueChange={(v) => setRefs(v[0])}
              min={0}
              max={100}
              step={1}
              className="[&_[data-slot=slider-range]]:bg-[#1f2030] [&_[data-slot=slider-thumb]]:border-[#1f2030] [&_[data-slot=slider-track]]:bg-[#ececf1]"
            />
          </div>

          <div className="mt-7 text-center">
            <div
              className={`font-[family-name:var(--font-display)] text-[clamp(40px,8vw,56px)] font-extrabold leading-none tracking-tight tabular-nums ${gradText}`}
            >
              ${total.toLocaleString("en-US")}
            </div>
            <div className="mt-3 text-[13px] text-[#6a6b7b]">
              *Numbers are illustrative with 50% commission on all sales.
            </div>
          </div>
        </div>

        <div className="mt-9 text-center">
          <Button className={ctaBtn} onClick={openTolt}>
            Become a partner now <ArrowRight className="ml-2 size-[19px]" />
          </Button>
        </div>
      </div>
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
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
          ? "border-transparent bg-gradient-to-r from-[#FFA73C] to-[#FF5255] text-white shadow-[0_6px_18px_rgba(255,82,85,0.3)]"
          : "border-[#ececf1] text-[#6a6b7b] hover:border-[#d4d3df] hover:text-[#1a1a2e]"
      }`}
    >
      {children}
    </button>
  );
}

/* ---------- Stat ---------- */
function StatCounter() {
  return (
    <div
      className={`font-[family-name:var(--font-display)] text-[clamp(52px,9vw,88px)] font-extrabold leading-none tracking-tight tabular-nums ${gradText}`}
    >
      $2,000,000+
    </div>
  );
}

/* ---------- Testimonials ---------- */
const TESTIMONIALS = [
  { name: "Maya Robinson", role: "Social media marketer", quote: "BuzzVideo makes ad creative so much faster in my day-to-day work, so recommending it to other marketers and friends was a no-brainer — now it pays me too." },
  { name: "Daniel Carter", role: "Marketing consultant", quote: "I ship ad creative with BuzzVideo every week. When other marketers ask what I use, I just share my link — and the commissions add up fast." },
  { name: "Priya Sharma", role: "Newsletter writer", quote: "All the images and videos in my newsletter and blog are made with BuzzVideo, so featuring it in my posts felt completely natural — and the commissions are a nice bonus." },
  { name: "Marcus Thompson", role: "DTC brand owner", quote: "I make all my Shopify ads with BuzzVideo and honestly couldn't recommend it more — I tell every store owner I know to try it." },
  { name: "Lena Fischer", role: "Performance marketer", quote: "I test dozens of ad creatives every week and BuzzVideo lets me spin them up fast. Recommending it to other performance marketers was an easy call." },
  { name: "Omar Haddad", role: "In-house marketer", quote: "I make all our brand's ad creative in BuzzVideo. It just works, so I've passed my link to half the marketers in my network." },
];

/* ---------- How it works ---------- */
const STEPS = [
  { no: "01", title: "Sign up", icon: Pencil, desc: "Create your Tolt account to unlock your partner dashboard and custom tracking link." },
  { no: "02", title: "Share everywhere", icon: Share2, desc: "Promote your link in your videos, posts, newsletters, or recommendations. The more targeted, the better." },
  { no: "03", title: "Earn commission", icon: TrendingUp, desc: "Earn 50% commission on every paying customer plus 1,500 free credits for both of you." },
];

/* ---------- FAQ ---------- */
const FAQ = [
  { q: "How and when do I get paid?", a: "Commissions are paid out monthly through Tolt. You can choose PayPal or bank transfer. Once a referral's first payment clears the 30-day refund window, your commission is approved and paid in the next monthly cycle." },
  { q: "Is there a minimum payout?", a: "Yes — you can withdraw once your balance reaches $100. Anything below that rolls over to the next cycle." },
  { q: "What's the commission?", a: "You earn 50% commission for every paying customer you bring in, plus 1,500 free credits for both of you — one of the highest cash rates in the category, with no limit on how much you can earn." },
  { q: "How long does the referral cookie last?", a: "The referral cookie lasts 30 days, so you still get credit if your friend signs up within a month of clicking your link." },
  { q: "Who can join?", a: "Anyone — creators, marketers, agencies and everyday Buzz fans. Signing up is free and takes minutes." },
  { q: "Can I refer myself?", a: "No. Self-referrals don't qualify for commission. Referrals must be genuine new users." },
  { q: "Can I run paid ads?", a: "You can promote your link across most channels, but bidding on Buzz brand terms in paid search isn't allowed. When in doubt, reach out before running campaigns." },
  { q: "Where do I track earnings?", a: "Everything lives in your Tolt dashboard — track your clicks, conversions and payouts in one place." },
  { q: "What terms apply to the program?", a: "Full affiliate terms are available here. If you're unsure about any part of the program, contact our team at info@presslogic.com." },
];

const VIDEOS = [1, 2, 3, 4, 5, 6];
const VIDEOS_2 = [4, 5, 6, 1, 2, 3];
const vsrc = (n: number, t: string) =>
  `/prototypes/2026-06-09-affiliate/assets/广告视频${n}.mp4#t=${t}`;

export default function AffiliatePage() {
  return (
    <main className="bg-white text-[#1a1a2e]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[linear-gradient(160deg,#ffe7d2_0%,#ffffff_52%,#ffdedf_100%)] px-6 py-[110px] text-center">
        <div className="relative z-[2]">
          <div className="inline-block rounded-full border border-[rgba(255,94,26,0.28)] px-3.5 py-1.5 text-[13px] font-bold uppercase tracking-[0.18em] text-[#ff5e1a]">
            BuzzVideo Affiliate Program
          </div>
          <h1 className="mx-auto mt-7 max-w-[880px] font-[family-name:var(--font-display)] text-[clamp(34px,6vw,64px)] font-extrabold leading-[1.08] tracking-tight">
            Become BuzzVideo&apos;s
            <br />
            <span className={gradText}>Affiliate Partner</span>
          </h1>
          <p className="mx-auto mt-6 text-[clamp(15px,2vw,19px)] leading-relaxed text-[#6a6b7b]">
            Earn 50% commission plus 1500 free credits for each paying customer you bring in.
            <br />
            There&apos;s no limit to how much you can earn.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3.5">
            <Button className={ctaBtn} onClick={openTolt}>
              Apply Now <ArrowRight className="ml-2 size-[19px]" />
            </Button>
            <Button
              variant="outline"
              className="h-auto rounded-xl border-[#ececf1] bg-white px-6 py-3.5 text-base font-bold text-[#1a1a2e] hover:border-[#ff5e1a] hover:bg-[#fff7f1]"
              onClick={() =>
                document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              See how it works
            </Button>
          </div>
        </div>
      </section>

      <Calculator />

      {/* How it works */}
      <section id="how" className="bg-white px-6 py-20">
        <div className="mx-auto max-w-[1040px]">
          <div className={kicker}>Become an Affiliate</div>
          <h2 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(28px,4vw,40px)] font-extrabold tracking-tight">
            How it works
          </h2>
          <p className="mb-10 mt-3 text-[17px] text-[#6a6b7b]">
            Share your link. Your referral subscribes. You earn 50% commission. That&apos;s it.
          </p>
          <div className="grid gap-[22px] md:grid-cols-3">
            {STEPS.map((s) => (
              <div
                key={s.no}
                className="rounded-[18px] border border-[#ececf1] bg-white p-[30px] shadow-[0_4px_16px_rgba(26,26,46,0.06)]"
              >
                <div className="mb-[22px] flex size-11 items-center justify-center rounded-[11px] bg-gradient-to-r from-[#FFA73C] to-[#FF5255] text-white">
                  <s.icon className="size-[22px]" />
                </div>
                <p className="mb-3.5 flex items-baseline gap-2.5 text-base font-extrabold uppercase tracking-[0.04em]">
                  <span className={`text-lg ${gradText}`}>{s.no}</span> {s.title}
                </p>
                <p className="text-[15px] leading-relaxed text-[#6a6b7b]">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-11 text-center">
            <Button className={ctaBtn} onClick={openTolt}>
              Apply Now <ArrowRight className="ml-2 size-[19px]" />
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-[#faf8f6] px-6 py-20">
        <div className="mx-auto max-w-[1040px] text-center">
          <div className={kicker}>Testimonials</div>
          <h2 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(28px,4vw,40px)] font-extrabold tracking-tight">
            Real partners. Real revenue.
          </h2>
          <p className="mx-auto mb-11 mt-3.5 text-center text-[17px] leading-relaxed text-[#6a6b7b]">
            BuzzVideo partners are earning more money with just a few simple links.
          </p>

          <div className="grid gap-[22px] text-left md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="flex flex-col rounded-[18px] border border-[#ececf1] bg-white p-7 shadow-[0_4px_16px_rgba(26,26,46,0.06)]"
              >
                <div className="mb-2.5 font-[family-name:var(--font-display)] text-[56px] font-extrabold leading-[0.7] text-[#ff5e1a] opacity-30">
                  &ldquo;
                </div>
                <p className="mb-5 text-[15px] leading-[1.65]">{t.quote}</p>
                <div className="mt-auto border-t border-[#ececf1] pt-[18px]">
                  <div className="text-[15px] font-bold">{t.name}</div>
                  <div className="mt-0.5 text-[13px] text-[#6a6b7b]">{t.role}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Stat banner */}
          <div className="mt-7 rounded-3xl border border-[#ececf1] bg-white p-14 text-center shadow-[0_4px_16px_rgba(26,26,46,0.06)]">
            <div className="text-[22px] font-bold">Our partners have earned</div>
            <div className="my-3">
              <StatCounter />
            </div>
            <div className="text-[15px] font-bold uppercase tracking-[0.14em] text-[#6a6b7b]">
              paid to partners
            </div>
          </div>
          <div className="mt-9 text-center">
            <Button className={ctaBtn} onClick={openTolt}>
              Become a partner now <ArrowRight className="ml-2 size-[19px]" />
            </Button>
          </div>
        </div>
      </section>

      {/* Final CTA + video wall */}
      <section className="bg-white px-6 py-20">
        <div className="relative mx-auto h-[680px] max-w-[1040px] overflow-hidden rounded-[28px] bg-[linear-gradient(110deg,#ffe3cf_0%,#fff2e8_45%,#fff7f0_100%)] px-10 pt-[72px]">
          {/* 同心圆装饰 */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-[-8%] top-1/2 z-[1] size-[760px] -translate-y-1/2 rounded-full"
            style={{
              background:
                "radial-gradient(circle, transparent 0 28%, rgba(255,255,255,.45) 28% 28.4%, transparent 28.4%), radial-gradient(circle, transparent 0 40%, rgba(255,255,255,.4) 40% 40.4%, transparent 40.4%), radial-gradient(circle, transparent 0 52%, rgba(255,255,255,.35) 52% 52.4%, transparent 52.4%)",
            }}
          />
          <div className="relative z-[2] text-center">
            <h2 className="font-[family-name:var(--font-display)] text-[clamp(30px,5vw,48px)] font-extrabold tracking-tight">
              Become an affiliate partner today
            </h2>
            <p className="mx-auto mb-8 mt-4 text-[clamp(15px,2vw,18px)] text-[#6a6b7b]">
              Recommend BuzzVideo and start earning today.
            </p>
            <Button className={ctaBtn} onClick={openTolt}>
              Become an affiliate partner <ArrowRight className="ml-2 size-[19px]" />
            </Button>
          </div>

          {/* video wall */}
          <div className="relative z-[2] mt-[145px] flex flex-col gap-3.5">
            <div className="flex justify-center gap-3.5">
              {VIDEOS.map((n, i) => (
                <video
                  key={`a${n}`}
                  src={vsrc(n, "0.5")}
                  muted
                  playsInline
                  preload="auto"
                  className={`w-[124px] rounded-[18px] border-4 border-white object-cover shadow-[0_16px_36px_rgba(26,26,46,0.2)] [aspect-ratio:9/16] ${i % 2 === 1 ? "translate-y-6" : ""}`}
                />
              ))}
            </div>
            <div className="-mb-[140px] flex justify-center gap-3.5">
              {VIDEOS_2.map((n, i) => (
                <video
                  key={`b${n}`}
                  src={vsrc(n, "1.2")}
                  muted
                  playsInline
                  preload="auto"
                  className={`w-[124px] rounded-[18px] border-4 border-white object-cover shadow-[0_16px_36px_rgba(26,26,46,0.2)] [aspect-ratio:9/16] ${i % 2 === 1 ? "translate-y-6" : ""}`}
                />
              ))}
            </div>
          </div>

          {/* bottom gradient mask */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-[200px] bg-[linear-gradient(#14141400,#141414)]" />
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-[#faf8f6] px-6 py-20 text-center">
        <div className="mx-auto max-w-[1040px]">
          <div className={kicker}>FAQ</div>
          <h2 className="mb-9 mt-4 font-[family-name:var(--font-display)] text-[clamp(28px,4vw,40px)] font-extrabold tracking-tight">
            Frequently asked questions
          </h2>
          <Accordion type="single" collapsible className="mx-auto max-w-[760px] text-left">
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
        </div>
      </section>
    </main>
  );
}
