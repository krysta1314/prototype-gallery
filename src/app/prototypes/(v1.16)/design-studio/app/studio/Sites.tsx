"use client";

/* Sites(照 Notion HTML 示意原型):顶部「Generate site」输入框 +「Generate」;左边 Sections(Hero / Speakers / Agenda / Register form / Footer)
   + Add section + Edit HTML;中间浏览器样式预览;右边「Publish to」四选一 + Publish。
   新增(调研):托管在独立根域名 *.buzzsite.io(不用 buzzvideo.ai,防钓鱼连累主站)、站点数 / 自定义域名额度、
   Free 页脚标识、表单 / Edit HTML / Download HTML 要 Ultra、密码(Pro)、搜索引擎开关、发布前扫描、Google Sites 推荐整页嵌入。 */

import { useState } from "react";
import { Copy, Globe, ShieldAlert } from "lucide-react";
import { atLimit, can, requiredPlan } from "../entitlements";
import { costOf } from "../pricing";
import { IMG, SITE_SECTIONS, color, uid, type Site, type SiteSection } from "../data";
import { CreditPill, GateTag, PlanTag, UsageMeter, ctaBtn, ghostBtn, iconBtn, kitOf, useStudio } from "./ui";

const label = "text-[11px] font-bold uppercase tracking-[0.08em] text-[#9a9bb0]";
const KIND_LABEL: Record<SiteSection["kind"], string> = { hero: "Hero", speakers: "Speakers", agenda: "Agenda", form: "Register form", footer: "Footer" };
type Target = "buzz" | "domain" | "google" | "html";

export function Sites({ site }: { site: Site | undefined }) {
  const s = useStudio();
  const kit = kitOf(s, s.kitId ?? site?.brandId);
  const [prompt, setPrompt] = useState("One-page sign-up site for our investment talk: hero, speakers, agenda, register form");
  const [sel, setSel] = useState<string | null>(site?.sections[0]?.id ?? null);
  const [target, setTarget] = useState<Target>("buzz");
  const [domain, setDomain] = useState(site?.domain ?? "talk.businessfocus.io");
  const [pw, setPw] = useState(!!site?.password);
  const [noindex, setNoindex] = useState(site?.noindex ?? false);
  const [testPw, setTestPw] = useState(false);
  const [scan, setScan] = useState<"idle" | "running" | "blocked">("idle");
  const [status, setStatus] = useState("");

  const say = (m: string) => {
    setStatus(m);
    s.notify(m);
  };
  const generate = () => {
    const isNew = !site;
    if (isNew && atLimit(s.plan, "sites", s.sites.length)) return s.upgrade({ limit: "sites", used: s.sites.length });
    s.confirmCredits({
      title: `Generate a ${SITE_SECTIONS().length}-section site`,
      credits: costOf("site_section", SITE_SECTIONS().length),
      detail: `${costOf("site_section")} credits per section, in ${kit?.name ?? "neutral"} style.`,
      onConfirm: () => {
        const next: Site = site ? { ...site, sections: SITE_SECTIONS() } : { id: uid("st"), name: prompt.slice(0, 36), brandId: kit?.id ?? null, slug: "bf-talk-2", sections: SITE_SECTIONS(), status: "draft", noindex: true };
        s.saveSite(next);
        setSel(next.sections[0].id);
        say("Site generated: 5 sections");
      },
    });
  };

  if (!site)
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <PromptBar prompt={prompt} setPrompt={setPrompt} onGenerate={generate} />
        <div className="grid flex-1 place-items-center bg-[#f3f1ee] text-[13px] text-[#9a9bb0]">Describe your page above to generate a site.</div>
      </div>
    );

  const set = (p: Partial<Site>) => s.saveSite({ ...site, ...p });
  const setSection = (id: string, p: Partial<SiteSection>) => set({ sections: site.sections.map((x) => (x.id === id ? { ...x, ...p } : x)) });
  const primary = color(kit, "primary");
  const accent = color(kit, "accent");
  const bg = color(kit, "background", "#ffffff");
  const domainsUsed = s.sites.filter((x) => x.domain && x.id !== site.id).length;
  const url = target === "domain" && domain ? domain : `${site.slug}.buzzsite.io`;

  const pickTarget = (t: Target) => {
    if (t === "domain") {
      if (!s.gate("custom_domain")) return;
      if (atLimit(s.plan, "domains", domainsUsed)) return s.upgrade({ limit: "domains", used: domainsUsed });
    }
    if (t === "html" && !s.gate("site_html")) return;
    setTarget(t);
  };
  const publish = () => {
    if (target === "html") return say("Downloaded site.zip (HTML, CSS and images)");
    setScan("running");
    window.setTimeout(() => {
      if (testPw) return setScan("blocked");
      setScan("idle");
      set({ status: "live", domain: target === "domain" ? domain : undefined, password: pw, noindex });
      say(target === "google" ? `Live at ${url} · paste the URL into Google Sites` : `Live at ${url}`);
    }, 1100);
  };

  const TARGETS: { k: Target; title: string; sub: string; tag?: ReturnType<typeof requiredPlan> }[] = [
    { k: "buzz", title: "BuzzVideo site URL", sub: `${site.slug}.buzzsite.io · hosted, SSL, analytics` },
    { k: "domain", title: "Custom domain", sub: "e.g. talk.businessfocus.io · add a CNAME", tag: can(s.plan, "custom_domain") ? undefined : requiredPlan("custom_domain") },
    { k: "google", title: "Google Sites", sub: "Embed by URL; Sites shows it in a frame" },
    { k: "html", title: "Download HTML", sub: "Zip of HTML, CSS and images", tag: can(s.plan, "site_html") ? undefined : requiredPlan("site_html") },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PromptBar prompt={prompt} setPrompt={setPrompt} onGenerate={generate} />
      <div className="flex min-h-0 flex-1 max-lg:flex-col max-lg:overflow-y-auto">
        <aside className="flex w-[220px] shrink-0 flex-col gap-2 overflow-y-auto border-r border-[#f1f1f4] bg-[#fcfcfd] p-3 max-lg:w-full max-lg:border-b max-lg:border-r-0">
          <p className={label}>Sections</p>
          {site.sections.map((x) => (
            <button key={x.id} type="button" onClick={() => setSel(x.id)} className={`flex items-center justify-between rounded-xl border bg-white px-3 py-2.5 text-left text-[13px] font-medium text-[#1a1a2e] ${sel === x.id ? "border-[#ff9a3d]" : "border-[#ececf1] hover:border-[#d4d3df]"}`}>
              {KIND_LABEL[x.kind]}
              {x.kind === "form" && <GateTag feature="site_forms" />}
            </button>
          ))}
          <button
            type="button"
            onClick={() => s.charge(costOf("site_section")) && (set({ sections: [...site.sections.slice(0, -1), { id: uid("s"), kind: "agenda", title: "FAQ", body: "[QUESTIONS ATTENDEES ASK]" }, site.sections[site.sections.length - 1]] }), say("Section added"))}
            className={`${ghostBtn} justify-between`}
          >
            + Add section <CreditPill credits={costOf("site_section")} />
          </button>
          <button type="button" onClick={() => s.gate("site_html") && say("HTML editor opened")} className={`${ghostBtn} justify-between`}>
            Edit HTML {!can(s.plan, "site_html") && <PlanTag plan={requiredPlan("site_html")} />}
          </button>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto bg-[#f3f1ee] p-5 sm:p-7 max-lg:shrink-0 max-lg:overflow-visible">
          <div className="mx-auto max-w-[860px] overflow-hidden rounded-[10px] bg-white shadow-[0_12px_32px_rgba(26,26,46,0.12)] ring-1 ring-black/5">
            <div className="flex h-9 items-center gap-2 bg-[#f4f3f6] px-3">
              <span className="size-2.5 rounded-full bg-[#d4d3df]" />
              <span className="size-2.5 rounded-full bg-[#d4d3df]" />
              <span className="size-2.5 rounded-full bg-[#d4d3df]" />
              <span className="ml-2 flex h-[22px] flex-1 items-center rounded-md bg-white px-2.5 text-[12px] text-[#9a9bb0]">{url}</span>
            </div>
            {site.sections.map((x) => {
              const on = sel === x.id ? "outline outline-2 -outline-offset-2 outline-[#ff5e1a]" : "";
              const edit = (f: "title" | "body") => ({
                contentEditable: sel === x.id,
                suppressContentEditableWarning: true,
                onBlur: (e: React.FocusEvent<HTMLElement>) => setSection(x.id, { [f]: e.currentTarget.innerText }),
              });
              if (x.kind === "hero")
                return (
                  <section key={x.id} onClick={() => setSel(x.id)} className={`flex flex-wrap items-center gap-7 px-8 py-10 sm:px-11 ${on}`} style={{ background: bg }}>
                    <div className="flex min-w-[260px] flex-[1_1_300px] flex-col gap-3.5">
                      <span className="text-[13px] font-bold tracking-[0.05em]" style={{ color: primary }}>
                        {kit?.word ?? "BRAND"} INVESTMENT TALK
                      </span>
                      <h1 {...edit("title")} className="text-[36px] font-black leading-[1.15] outline-none" style={{ color: primary }}>
                        {x.title}
                      </h1>
                      <p {...edit("body")} className="text-[15px] leading-relaxed text-[#3a4553] outline-none">
                        {x.body}
                      </p>
                      <span className="inline-flex h-10 items-center self-start rounded-full px-[18px] text-[14px] font-bold" style={{ background: accent, color: primary }}>
                        Register now
                      </span>
                    </div>
                    <div className="relative h-[220px] min-w-[200px] flex-[1_1_220px] overflow-hidden rounded-xl" style={{ background: primary }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={IMG.speaker} alt="" className="absolute inset-x-0 bottom-0 mx-auto h-[92%] object-contain" style={{ WebkitMaskImage: "radial-gradient(ellipse 34% 62% at 50% 62%, #000 70%, transparent 82%)", maskImage: "radial-gradient(ellipse 34% 62% at 50% 62%, #000 70%, transparent 82%)" }} />
                    </div>
                  </section>
                );
              if (x.kind === "speakers")
                return (
                  <section key={x.id} onClick={() => setSel(x.id)} className={`grid grid-cols-3 gap-4 bg-white px-8 py-7 sm:px-11 ${on}`}>
                    {x.body.split(" · ").map((n, i) => (
                      <div key={i} className="flex flex-col gap-1.5">
                        <span className="size-12 rounded-full bg-[#dce3ec]" />
                        <span className="text-[13px] font-bold" style={{ color: primary }}>
                          {n}
                        </span>
                      </div>
                    ))}
                  </section>
                );
              if (x.kind === "form")
                return (
                  <section key={x.id} onClick={() => setSel(x.id)} className={`px-8 py-7 sm:px-11 ${on}`} style={{ background: bg }}>
                    <h2 className="text-[20px] font-black" style={{ color: primary }}>
                      {x.title}
                    </h2>
                    <div className={`mt-3 grid gap-2 sm:grid-cols-3 ${can(s.plan, "site_forms") ? "" : "opacity-40"}`}>
                      {x.body.split(" · ").map((f) => (
                        <span key={f} className="rounded-lg border border-[#e1e3e9] bg-white px-3 py-2 text-[12.5px] text-[#9a9bb0]">
                          {f}
                        </span>
                      ))}
                    </div>
                    {!can(s.plan, "site_forms") && (
                      <button type="button" onClick={() => s.upgrade({ feature: "site_forms" })} className="mt-3 text-[12.5px] font-semibold text-[#ff5e1a]">
                        Collect sign-ups with forms · Ultra
                      </button>
                    )}
                  </section>
                );
              if (x.kind === "footer")
                return (
                  <footer key={x.id} onClick={() => setSel(x.id)} className={`flex items-center justify-between border-t border-[#f1f1f4] px-8 py-4 text-[11.5px] text-[#9a9bb0] sm:px-11 ${on}`}>
                    <span>{x.body}</span>
                    {!can(s.plan, "remove_badge") && <span className="rounded-full bg-[#faf8f6] px-2 py-0.5 font-semibold text-[#6a6b7b]">Made with BuzzVideo</span>}
                  </footer>
                );
              return (
                <section key={x.id} onClick={() => setSel(x.id)} className={`bg-white px-8 py-6 sm:px-11 ${on}`}>
                  <h2 {...edit("title")} className="text-[18px] font-black outline-none" style={{ color: primary }}>
                    {x.title}
                  </h2>
                  <p {...edit("body")} className="mt-1 text-[14px] text-[#4a4b5c] outline-none">
                    {x.body}
                  </p>
                </section>
              );
            })}
          </div>
          <p className="mt-3 text-center text-[11.5px] text-[#9a9bb0]">Select a section, then click its text to edit.</p>
        </main>

        <aside className="flex w-[300px] shrink-0 flex-col gap-2 overflow-y-auto border-l border-[#f1f1f4] bg-white p-4 max-lg:w-full max-lg:border-l-0 max-lg:border-t">
          <p className={label}>Publish to</p>
          {TARGETS.map((t) => (
            <button key={t.k} type="button" onClick={() => pickTarget(t.k)} className={`flex w-full flex-col items-start gap-0.5 rounded-xl border px-3 py-2.5 text-left ${target === t.k ? "border-[#ff9a3d] bg-[#fff7f1]" : "border-[#ececf1] hover:border-[#d4d3df]"}`}>
              <span className="flex w-full items-center justify-between text-[13px] font-semibold text-[#1a1a2e]">
                {t.title} {t.tag && <PlanTag plan={t.tag} />}
              </span>
              <span className="text-[11.5px] text-[#9a9bb0]">{t.sub}</span>
            </button>
          ))}
          {target === "domain" && (
            <div className="space-y-1.5 rounded-xl bg-[#faf8f6] p-3">
              <input value={domain} onChange={(e) => setDomain(e.target.value)} className="h-9 w-full rounded-lg border border-[#e1e3e9] bg-white px-2.5 text-[12.5px] outline-none focus:border-[#ff5e1a]" />
              <p className="text-[11.5px] text-[#6a6b7b]">Point a CNAME to sites.buzzsite.io. HTTPS is issued once DNS is found.</p>
              <UsageMeter k="domains" used={domainsUsed + 1} label="domains" />
            </div>
          )}
          {target === "google" && (
            <div className="space-y-2 rounded-xl bg-[#faf8f6] p-3">
              <p className="text-[12px] text-[#6a6b7b]">In Google Sites: Insert › Embed › By URL › Whole page, then paste:</p>
              <div className="flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 ring-1 ring-[#ececf1]">
                <span className="min-w-0 flex-1 truncate text-[12px] text-[#1a1a2e]">https://{site.slug}.buzzsite.io</span>
                <button type="button" aria-label="Copy URL" onClick={() => say("URL copied")} className={`${iconBtn} size-7`}>
                  <Copy className="size-3.5" />
                </button>
              </div>
              <button type="button" onClick={() => say("Embed code copied")} className="text-[11.5px] font-semibold text-[#ff5e1a]">
                Or copy embed code
              </button>
            </div>
          )}
          <div className="space-y-1.5 px-1 pt-1 text-[12.5px] text-[#1a1a2e]">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={noindex} onChange={(e) => setNoindex(e.target.checked)} className="accent-[#ff5e1a]" /> Hide from search engines
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={pw} onChange={(e) => (e.target.checked ? s.gate("share_password") && setPw(true) : setPw(false))} className="accent-[#ff5e1a]" /> Password protect <GateTag feature="share_password" />
            </label>
            <label className="flex items-center gap-2 text-[11.5px] text-[#9a9bb0]">
              <input type="checkbox" checked={testPw} onChange={(e) => setTestPw(e.target.checked)} className="accent-[#ff5e1a]" /> Demo: page has a password field
            </label>
          </div>
          {scan === "blocked" && (
            <p className="flex gap-2 rounded-xl bg-[#fdecec] p-3 text-[12px] text-[#b91c1c]">
              <ShieldAlert className="mt-0.5 size-4 shrink-0" /> Publishing blocked: pages can’t ask for passwords or card details.
            </p>
          )}
          <button type="button" disabled={scan === "running"} onClick={publish} className={ctaBtn}>
            <Globe className="size-3.5" /> {scan === "running" ? "Checking page…" : target === "html" ? "Download" : site.status === "live" ? "Update" : "Publish"}
          </button>
          <span role="status" className="text-[12.5px] font-medium text-[#ff5e1a]">
            {status}
          </span>
          <UsageMeter k="sites" used={s.sites.length} label="sites" />
          <p className="text-[11.5px] leading-relaxed text-[#9a9bb0]">
            Google Sites has no publish API — BuzzVideo hosts the live page on its own domain (buzzsite.io) and you embed it.
          </p>
        </aside>
      </div>
    </div>
  );
}

function PromptBar({ prompt, setPrompt, onGenerate }: { prompt: string; setPrompt: (v: string) => void; onGenerate: () => void }) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2.5 border-b border-[#f1f1f4] bg-white px-5 py-3">
      <label htmlFor="ds-siteprompt" className={label}>
        Generate site
      </label>
      <input id="ds-siteprompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} className="h-10 min-w-0 flex-[1_1_360px] rounded-lg border border-[#e1e3e9] px-3 text-[13.5px] outline-none focus:border-[#ff5e1a] focus:ring-[3px] focus:ring-[#ff5e1a]/15" />
      <button type="button" disabled={!prompt.trim()} onClick={onGenerate} className={ctaBtn}>
        Generate
      </button>
    </div>
  );
}
