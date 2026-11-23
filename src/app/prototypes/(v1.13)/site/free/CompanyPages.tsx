"use client";

/* 公司 / 帮助页:/help、/faq、/changelog、/enterprise(2026-11-23)。
   不编：事实全部来自 company.ts / changelog.ts(出处写在那两个文件头);价格不写数字，指向 /pricing;Enterprise 的 CTA 去 /contact。 */

import { ArrowRight } from "lucide-react";
import type { OnLink } from "../../site-nav/SiteNavHeader";
import { OA_H2, OA_WRAP, OAChips, OACta, OAFaq, OAPanel } from "../oa/kit";
import { SIGNUP_CREDITS } from "../tools/credits";
import { RELEASES } from "./changelog";
import { ALL_FAQ, ENT_CREDITS, ENT_INCLUDED, ENT_PLANNED, FAQ_GROUPS, HELP_TOPICS, PLAN_ROWS, PRICING_URL } from "./company";
import { Chip, faqLd, FreeHero, JsonLd, linker, ORG, Sources } from "./ui";

const CARD = "rounded-[20px] bg-white/[0.05] p-6 ring-1 ring-white/[0.08]";
const PRICING_SRC = { label: "BuzzVideo pricing page (plans, Enterprise features, billing FAQ)", url: PRICING_URL };

/* ── /help ── */
export function HelpPage({ onLink }: { onLink: OnLink }) {
  const a = linker(onLink);
  const faq = FAQ_GROUPS.flatMap((g) => g.items.slice(0, 2));
  return (
    <main className="bg-black text-white">
      <FreeHero
        chip={<Chip>Help Center</Chip>}
        title="How can we help?"
        lead="The BuzzVideo Help Center explains how to make your first AI ad, choose a model and understand credits and plans. Start with a topic below, read the most common answers, or contact the BuzzVideo team if you still need a hand."
      />
      <section className="pb-20">
        <div className={OA_WRAP}>
          <h2 className={OA_H2}>Where do I start?</h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {HELP_TOPICS.map((t) => (
              <li key={t.title}>
                <a {...a(t.label, t.href)} className={`group flex h-full flex-col ${CARD} transition hover:-translate-y-0.5 hover:bg-white/[0.08]`}>
                  <span className="text-[17px] font-extrabold">{t.title}</span>
                  <span className="mt-2 flex-1 text-[14.5px] leading-relaxed text-[#CACACA]">{t.body}</span>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-bold text-[#FF744D]">
                    {t.label} <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <OAFaq title="Most asked questions" items={faq} />
      <OAChips
        title="More help"
        chips={[
          { label: "Full FAQ", link: a("FAQ", "/faq") },
          { label: "What's New", link: a("What's New", "/changelog") },
          { label: "Pricing", link: a("Pricing", "/pricing") },
          { label: "Enterprise", link: a("Enterprise", "/enterprise") },
          { label: "Free tools", link: a("Free tools", "/free-tools") },
        ]}
      />
      <OACta title="Still stuck? Talk to us" sub="Send the BuzzVideo team your question and we'll get back to you." cta={{ label: "Contact us", link: a("Contact", "/contact") }} />
      <div className="pb-14" />
      <JsonLd data={[{ "@context": "https://schema.org", "@type": "WebPage", name: "BuzzVideo Help Center", url: "https://buzzvideo.ai/help", publisher: ORG }, faqLd(faq)]} />
    </main>
  );
}

/* ── /faq ── */
export function FaqPage({ onLink }: { onLink: OnLink }) {
  const a = linker(onLink);
  return (
    <main className="bg-black text-white">
      <FreeHero
        chip={<Chip>{ALL_FAQ.length} answers</Chip>}
        title="BuzzVideo FAQ"
        lead="This BuzzVideo FAQ answers common questions about the AI ad generator: getting started, which models each plan includes, how billing works, cancellations, refunds, teams and API access. Answers on plans and billing follow BuzzVideo's current pricing page, which is linked at the bottom."
      />
      <nav aria-label="FAQ sections" className="pb-6">
        <ul className={`${OA_WRAP} flex flex-wrap justify-center gap-2`}>
          {FAQ_GROUPS.map((g) => (
            <li key={g.title}>
              <a href={`#${slugOf(g.title)}`} className="inline-block rounded-full bg-white/[0.07] px-4 py-2 text-[13.5px] font-semibold text-[#E8E8E8] ring-1 ring-white/10 hover:bg-white/[0.12]">
                {g.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      {FAQ_GROUPS.map((g) => (
        <div key={g.title} id={slugOf(g.title)} className="scroll-mt-28">
          <OAFaq title={g.title} items={g.items} />
        </div>
      ))}
      <OACta title="Didn't find your answer?" sub="Ask the BuzzVideo team directly, or browse the Help Center." cta={{ label: "Contact us", link: a("Contact", "/contact") }} />
      <Sources items={[PRICING_SRC]} note="Plan, credit and billing answers follow the pricing page." />
      <JsonLd data={[faqLd(ALL_FAQ)]} />
    </main>
  );
}
const slugOf = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

/* ── /changelog ── */
const STATUS_STYLE: Record<string, string> = {
  Live: "bg-white text-[#240A03]",
  "In testing": "bg-white/[0.1] text-[#E8E8E8]",
  "Next release": "bg-[#FFF3EC] text-[#240A03]",
};
export function ChangelogPage({ onLink }: { onLink: OnLink }) {
  const a = linker(onLink);
  const faq = [
    { q: "What's new in BuzzVideo?", a: `The latest release, ${RELEASES[0].version}, adds ${RELEASES[0].items.map((i) => i.title).join(" and ")}. ${RELEASES[1].version} brings ${RELEASES[1].summary.charAt(0).toLowerCase()}${RELEASES[1].summary.slice(1)}` },
    { q: "What do the status labels mean?", a: "Live means you can use it on buzzvideo.ai today. In testing means it is being tested before release. Next release means it is planned for the coming version." },
    { q: "Where can I ask about a feature?", a: "Contact the BuzzVideo team from the Contact page; the Help Center and FAQ cover the most common questions." },
  ];
  return (
    <main className="bg-black text-white">
      <FreeHero
        chip={<Chip>Release notes</Chip>}
        title="What's new in BuzzVideo"
        lead={`BuzzVideo's release notes list what changed in each version of the AI ad generator, from ${RELEASES[RELEASES.length - 1].version} to ${RELEASES[0].version}. Each entry says what the feature does and whether it is live, in testing or planned for the next release.`}
      />
      <section className="pb-20">
        <ol className={`${OA_WRAP} max-w-[920px] space-y-12`}>
          {RELEASES.map((r) => (
            <li key={r.version} id={r.version.replace(/\./g, "-")} className="grid gap-4 md:grid-cols-[140px_1fr]">
              <div>
                <h2 className="text-[28px] font-black tabular-nums">{r.version}</h2>
              </div>
              <div>
                <p className="text-[17px] font-semibold text-white">{r.summary}</p>
                <ul className="mt-5 space-y-3">
                  {r.items.map((i) => (
                    <li key={i.title} className={CARD}>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="text-[17px] font-extrabold">{i.title}</h3>
                        {i.status && <span className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-bold ${STATUS_STYLE[i.status]}`}>{i.status}</span>}
                      </div>
                      <p className="mt-2 text-[15px] leading-relaxed text-[#CACACA]">{i.body}</p>
                      {i.href && (
                        <a {...a(i.title, i.href)} className="mt-3 inline-flex items-center gap-1.5 text-[14px] font-bold text-[#FF744D]">
                          Learn more <ArrowRight className="size-4" />
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <OAFaq items={faq} />
      <OACta title="Try what's new" sub={`New accounts get ${SIGNUP_CREDITS} free credits for images and voiceovers.`} cta={{ label: "Get started for free", link: a("AI Marketing Agent", "/marketing-agent") }} />
      <div className="pb-14" />
      <JsonLd data={[{ "@context": "https://schema.org", "@type": "WebPage", name: "BuzzVideo release notes", url: "https://buzzvideo.ai/changelog", publisher: ORG }, faqLd(faq)]} />
    </main>
  );
}

/* ── /enterprise ── */
export function EnterprisePage({ onLink }: { onLink: OnLink }) {
  const a = linker(onLink);
  const contact = a("Contact Sales", "/contact");
  const faq = [
    { q: "What is BuzzVideo Enterprise?", a: "BuzzVideo Enterprise is the BuzzVideo plan for brands and agencies that make ads as a team. It adds multi-user access, seat management, shared workspaces, custom credit allocation, API access, an SLA and a dedicated account manager." },
    { q: "How is Enterprise different from Pro or Ultra?", a: "Starter, Pro and Ultra are for one person. Enterprise adds team seats and shared workspaces, custom credits, dedicated model capacity, a priority processing queue, API access, onboarding and an account manager." },
    { q: "Does Enterprise include API access?", a: "Yes. API access is available on Enterprise plans only. MCP is included on every plan." },
    { q: "Can we get SOC 2 reports or a DPA?", a: "Yes. Enterprise customers can get SOC 2 reports, a custom DPA and data residency options." },
    { q: "How much does Enterprise cost?", a: "Enterprise pricing isn't listed on the pricing page. Contact sales for a quote." },
  ];
  const cols: { k: keyof (typeof PLAN_ROWS)[number]; label: string }[] = [
    { k: "free", label: "Free" },
    { k: "starter", label: "Starter" },
    { k: "pro", label: "Pro" },
    { k: "ultra", label: "Ultra" },
    { k: "ent", label: "Enterprise" },
  ];
  return (
    <main className="bg-black text-white">
      <FreeHero
        chip={<Chip>For brands and agencies</Chip>}
        title="BuzzVideo for teams"
        lead="BuzzVideo Enterprise is the AI ad generator plan for brands and agencies that create video and image ads as a team. It adds shared workspaces, seat management and custom credit allocation, plus API access, an SLA and a dedicated account manager."
      >
        <div className="flex justify-center">
          <a {...contact} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-6 py-3.5 text-[15.5px] font-bold text-white transition hover:brightness-105">
            Contact sales <ArrowRight className="size-4" />
          </a>
        </div>
      </FreeHero>

      <OAPanel title="What does Enterprise include?" sub="The Enterprise features listed on BuzzVideo's pricing page and in its billing FAQ.">
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ENT_INCLUDED.map((f) => (
            <li key={f.title} className={CARD}>
              <h3 className="text-[18px] font-extrabold">{f.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-[#CACACA]">{f.body}</p>
            </li>
          ))}
        </ul>
      </OAPanel>

      <section className="bg-[#F6F6F6] py-20 text-[#240A03] md:py-28">
        <div className={OA_WRAP}>
          <h2 className={OA_H2}>How do team credits work?</h2>
          <p className="mt-4 max-w-[44rem] text-[17px] leading-relaxed text-[#240A03]/80">One organization, one credit pool, and clear controls over who spends what.</p>
          <ul className="mt-12 grid gap-5 md:grid-cols-2">
            {ENT_CREDITS.map((c) => (
              <li key={c.title} className="rounded-[24px] bg-white p-7 shadow-[0_20px_50px_rgba(36,10,3,0.06)]">
                <h3 className="text-[18px] font-extrabold">{c.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[#240A03]/80">{c.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <OAPanel title="How does Enterprise compare with other plans?" sub={<>Features only; see <a {...a("Pricing", "/pricing")} className="underline underline-offset-4">Pricing</a> for current prices.</>}>
        <div className="overflow-x-auto rounded-[20px] bg-white/[0.04] ring-1 ring-white/[0.08]">
          <table className="w-full min-w-[760px] text-left text-[14px]">
            <caption className="sr-only">BuzzVideo plan features</caption>
            <thead className="text-[12.5px] uppercase tracking-[0.04em] text-[#9F9F9F]">
              <tr>
                <th scope="col" className="px-4 py-3 font-bold">
                  Feature
                </th>
                {cols.map((c) => (
                  <th key={c.k} scope="col" className={`px-4 py-3 font-bold ${c.k === "ent" ? "text-[#FF744D]" : ""}`}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PLAN_ROWS.map((r) => (
                <tr key={r.label} className="border-t border-white/[0.08] text-[#E8E8E8]">
                  <th scope="row" className="px-4 py-3.5 font-bold text-white">
                    {r.label}
                  </th>
                  {cols.map((c) => (
                    <td key={c.k} className={`px-4 py-3.5 ${c.k === "ent" ? "font-semibold text-white" : ""}`}>
                      {r[c.k]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </OAPanel>

      <OAPanel title="What's planned for Enterprise in Design Studio?" sub="These Design Studio controls are planned for Enterprise organizations and are not available yet.">
        <ul className="flex flex-wrap gap-2.5">
          {ENT_PLANNED.map((p) => (
            <li key={p} className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-4 py-2 text-[14px] font-semibold text-[#E8E8E8] ring-1 ring-white/10">
              {p}
              <span className="rounded-full bg-white/[0.1] px-2 py-0.5 text-[11px] font-bold text-[#CACACA]">Planned</span>
            </li>
          ))}
        </ul>
      </OAPanel>

      <OAFaq items={faq} />
      <OACta title="Bring BuzzVideo to your team" sub="Tell us about your team and the ads you make, and we'll set up a plan that fits." cta={{ label: "Contact sales", link: contact }} />
      <Sources items={[PRICING_SRC]} note="Enterprise features follow the pricing page." />
      <JsonLd
        data={[
          { "@context": "https://schema.org", "@type": "WebPage", name: "BuzzVideo Enterprise", url: "https://buzzvideo.ai/enterprise", publisher: ORG },
          faqLd(faq),
        ]}
      />
    </main>
  );
}
