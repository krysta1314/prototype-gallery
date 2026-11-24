"use client";

/* Brand Kit(照 Notion HTML 示意原型):左边品牌列表 + New brand kit;右边「<品牌> Brand Kit」标题 + Shared with organisation、
   Import from Canva Brand Kit / Use in new design;区块 Logos / Colours / Fonts / Brand voice / Locked templates。
   新增(调研):用量 x / y 和满额升级、From website 自动抽取、Member 只读、降级后超额只读、Audience & selling points、
   锁定模板要 Enterprise、品牌风格模型(E3)。 */

import { useEffect, useState } from "react";
import { Globe, Lock, MessageSquareText, Plus, Sparkles, X } from "lucide-react";
import { atLimit, can, PLAN_LABEL } from "../entitlements";
import { EXTRACTED_KIT, TEMPLATES, color, talkPost, uid, type BrandKit } from "../data";
import { addBrandKit } from "../store";
import { DesignCanvas } from "./DesignCanvas";
import { GateTag, Modal, PlanTag, UsageMeter, ctaBtn, ghostBtn, useStudio } from "./ui";

const ROLE_LABEL: Record<string, string> = { primary: "Primary", secondary: "Secondary", accent: "Accent", text: "Text", background: "Background" };
const sec = "flex flex-col gap-3 rounded-2xl border border-[#ececf1] bg-white p-[18px]";
const h2 = "text-[15px] font-semibold text-[#1a1a2e]";
const field = "h-10 w-full rounded-lg border border-[#e1e3e9] bg-white px-3 text-[13.5px] outline-none focus:border-[#ff5e1a] focus:ring-[3px] focus:ring-[#ff5e1a]/15 disabled:bg-[#faf8f6] disabled:text-[#6a6b7b]";

export function BrandKitsPage({ onUse }: { onUse: () => void }) {
  const s = useStudio();
  const [creating, setCreating] = useState(false);
  const used = s.kits.filter((k) => !k.readOnly).length;
  const full = atLimit(s.plan, "brandKits", used);
  const kit = s.kits.find((k) => k.id === s.kitId) ?? s.kits[0];
  const editable = s.role === "admin" && !kit.readOnly;
  const setKit = (k: BrandKit) => s.setKits((all) => all.map((x) => (x.id === k.id ? k : x)));
  const [avoid, setAvoid] = useState("");

  return (
    <div className="flex min-h-0 flex-1 max-md:flex-col max-md:overflow-y-auto">
      <aside className="flex w-[260px] shrink-0 flex-col gap-2 overflow-y-auto border-r border-[#f1f1f4] bg-[#fcfcfd] p-4 max-md:w-full max-md:border-b max-md:border-r-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9a9bb0]">Brand kits</p>
        <div className="flex flex-col gap-1">
          {s.kits.map((k) => (
            <button key={k.id} type="button" onClick={() => s.setKitId(k.id)} className={`flex h-10 items-center gap-2.5 rounded-lg border px-3 text-left text-[13.5px] font-medium text-[#1a1a2e] ${k.id === kit.id ? "border-[#ff9a3d] bg-[#fff7f1]" : "border-transparent hover:bg-[#f4f3f6]"}`}>
              <span className="size-3 shrink-0 rounded-full" style={{ background: color(k, "accent"), boxShadow: `0 0 0 2px ${color(k, "primary")}` }} />
              <span className="min-w-0 flex-1 truncate">{k.name}</span>
              {k.readOnly && <Lock className="size-3 text-[#9a9bb0]" />}
            </button>
          ))}
        </div>
        {s.role === "admin" &&
          (full ? (
            <button type="button" onClick={() => s.upgrade({ limit: "brandKits", used })} className={`${ghostBtn} mt-2`}>
              <Lock className="size-3.5" /> Upgrade to add more
            </button>
          ) : (
            <button type="button" onClick={() => setCreating(true)} className={`${ghostBtn} mt-2`}>
              + New brand kit
            </button>
          ))}
        <UsageMeter k="brandKits" used={used} label="kits" />
        <p className="text-[12px] leading-relaxed text-[#9a9bb0]">One kit per PressLogic brand or enterprise client. Admins/Editors edit; Members use.</p>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8 sm:py-7 max-md:shrink-0 max-md:overflow-visible">
        <div className="mx-auto flex max-w-[1080px] flex-col gap-5">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[26px] font-extrabold tracking-tight text-[#1a1a2e]">{kit.name} Brand Kit</h1>
            <span className="inline-flex h-6 items-center rounded-md bg-[#f4f3f6] px-2 text-[11.5px] font-medium text-[#4a4b5c]">Shared with organisation</span>
            <span className="flex-1" />
            <button type="button" onClick={() => s.notify("Canva Brand Kits can't be exported — copy colours here and upload your own logo and font files")} className={ghostBtn}>
              Import from Canva Brand Kit
            </button>
            <button type="button" onClick={onUse} className={ctaBtn}>
              Use in new design
            </button>
          </div>
          {!editable && (
            <p className="flex items-center gap-2 rounded-xl bg-[#f4f3f6] px-3.5 py-2.5 text-[12.5px] text-[#4a4b5c]">
              <Lock className="size-3.5" />
              {kit.readOnly ? `Read-only · over the ${PLAN_LABEL[s.plan]} brand kit limit. You can still use it in designs.` : "View only · ask a brand admin to change this kit"}
            </p>
          )}

          <section className={sec}>
            <h2 className={h2}>Logos</h2>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
              {[
                [color(kit, "background", "#fff"), color(kit, "primary"), "PRIMARY LOGO"],
                [color(kit, "primary"), color(kit, "background", "#fff"), "REVERSED"],
                [color(kit, "accent"), color(kit, "primary"), "ICON"],
              ].map(([b, f, n]) => (
                <div key={n} className="flex h-24 flex-col items-center justify-center rounded-[10px] ring-1 ring-black/5" style={{ background: b, color: f }}>
                  <span className="text-[15px] font-bold tracking-[0.04em]">{n === "ICON" ? kit.initials : kit.word}</span>
                  <span className="mt-1 text-[10.5px] opacity-60">[{n}]</span>
                </div>
              ))}
              <button type="button" disabled={!editable} onClick={() => s.notify("Choose an SVG or PNG logo")} className="flex h-24 items-center justify-center rounded-[10px] border border-[#e1e3e9] bg-[#fafafb] text-[13px] text-[#9a9bb0] hover:border-[#ff9a3d] disabled:opacity-50">
                + Upload logo
              </button>
            </div>
          </section>

          <section className={sec}>
            <h2 className={h2}>
              Colours <span className="text-[12.5px] font-normal text-[#9a9bb0]">· sample palette</span>
            </h2>
            <div className="flex flex-wrap gap-3.5">
              {kit.colors.map((c, i) => (
                <label key={c.role} className="flex w-[110px] flex-col gap-1.5">
                  <span className="h-[72px] rounded-[10px] ring-1 ring-black/10" style={{ background: c.hex }} />
                  <b className="text-[13px] text-[#1a1a2e]">{c.name}</b>
                  <input disabled={!editable} value={c.hex} onChange={(e) => setKit({ ...kit, colors: kit.colors.map((x, j) => (j === i ? { ...x, hex: e.target.value } : x)) })} className="rounded-md bg-transparent text-[12px] tabular-nums text-[#9a9bb0] outline-none focus:text-[#1a1a2e]" />
                </label>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
            <section className={sec}>
              <h2 className={h2}>Fonts</h2>
              {kit.fonts.map((f, i) => (
                <div key={f.role} className={`flex items-baseline justify-between gap-3 pb-2.5 ${i < kit.fonts.length - 1 ? "border-b border-[#ececf1]" : ""}`}>
                  <span className={f.role === "heading" ? "text-[24px] font-black" : f.role === "subheading" ? "text-[17px] font-semibold" : "text-[14px]"} style={{ color: "#1a1a2e" }}>
                    {f.role === "heading" ? "標題 Heading" : f.role === "subheading" ? "Subheading" : "Body text for captions"}
                  </span>
                  <span className="text-right text-[12px] text-[#9a9bb0]">
                    {f.family}
                    <span className="mt-0.5 block text-[10.5px] font-semibold text-[#16a34a]">Commercial use OK</span>
                  </span>
                </div>
              ))}
            </section>
            <section className={sec}>
              <h2 className={`${h2} flex items-center gap-2`}>
                Brand voice → feeds AI copy tools <GateTag feature="brand_voice" />
              </h2>
              <p className="text-[13px] leading-relaxed text-[#4a4b5c]">Passed into Ad Copy, Captions &amp; Hashtags and Campaign Brief when “Use brand kit” is on.</p>
              <label htmlFor="ds-tone" className="text-[12px] text-[#9a9bb0]">
                Tone of voice
              </label>
              <input id="ds-tone" disabled={!editable} value={kit.voice.tone} onChange={(e) => setKit({ ...kit, voice: { ...kit.voice, tone: e.target.value } })} className={field} />
              <span className="text-[12px] text-[#9a9bb0]">Avoid</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {kit.voice.avoid.map((w) => (
                  <span key={w} className="inline-flex items-center gap-1 rounded-full bg-[#fdecec] px-2.5 py-1 text-[12px] text-[#c2410c]">
                    {w}
                    {editable && (
                      <button type="button" aria-label={`Remove ${w}`} onClick={() => setKit({ ...kit, voice: { ...kit.voice, avoid: kit.voice.avoid.filter((x) => x !== w) } })}>
                        <X className="size-3" />
                      </button>
                    )}
                  </span>
                ))}
                {editable && (
                  <input
                    value={avoid}
                    onChange={(e) => setAvoid(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && avoid.trim()) {
                        setKit({ ...kit, voice: { ...kit.voice, avoid: [...kit.voice.avoid, avoid.trim()] } });
                        setAvoid("");
                      }
                    }}
                    placeholder="Add, press Enter"
                    className="h-7 w-32 rounded-full border border-[#e1e3e9] px-2.5 text-[12px] outline-none focus:border-[#ff5e1a]"
                  />
                )}
              </div>
            </section>
          </div>

          <section className={sec}>
            <h2 className={h2}>Audience &amp; selling points</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <textarea disabled={!editable} rows={3} value={kit.audience} onChange={(e) => setKit({ ...kit, audience: e.target.value })} className={`${field} h-auto resize-none py-2`} />
              <ul className="space-y-1.5">
                {kit.sellingPoints.map((p, i) => (
                  <li key={i}>
                    <input disabled={!editable} value={p} onChange={(e) => setKit({ ...kit, sellingPoints: kit.sellingPoints.map((x, j) => (j === i ? e.target.value : x)) })} className={field} />
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-[12px] text-[#9a9bb0]">Selling points drive bulk variants (one design per selling point){can(s.plan, "bulk_variants") ? "." : " · Ultra"}</p>
          </section>

          <section className={sec}>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className={h2}>Locked templates</h2>
              <span className="inline-flex h-6 items-center rounded-md bg-[#f4f3f6] px-2 text-[11.5px] font-medium text-[#4a4b5c]">Members can edit text and photos only</span>
              {!can(s.plan, "template_lock") && <PlanTag plan="e1" />}
            </div>
            <div className={`grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3 ${can(s.plan, "template_lock") ? "" : "opacity-50"}`}>
              {[
                [TEMPLATES[0], "BF · IG post · Headline"],
                [TEMPLATES[1], "Quote card"],
              ].map(([t, n]) => {
                const tp = t as (typeof TEMPLATES)[number];
                return (
                  <div key={tp.id}>
                    <div className="overflow-hidden rounded-lg ring-1 ring-black/5">
                      <DesignCanvas page={{ id: tp.id, bg: color(kit, "background", "#fff"), layers: talkPost(kit, { headline: tp.headline, img: tp.img }) }} ratio={4 / 5} kit={kit} />
                    </div>
                    <p className="mt-1 text-[12px] font-semibold text-[#1a1a2e]">{(n as string).replace("BF", kit.initials)}</p>
                  </div>
                );
              })}
              <div>
                {/* Story cover(HTML 原有):品牌辅色底 + 居中标题 */}
                <div className="flex aspect-[4/5] items-center justify-center rounded-lg p-2.5 text-center text-[12px] font-extrabold ring-1 ring-black/5" style={{ background: color(kit, "accent"), color: color(kit, "primary") }}>
                  Story cover
                </div>
                <p className="mt-1 text-[12px] font-semibold text-[#1a1a2e]">Story cover</p>
              </div>
              {[
                ["Deck theme", "#ffffff"],
                ["MediaLens report", "#dce3ec"],
              ].map(([n, b]) => (
                <div key={n}>
                  <div className="flex aspect-[4/5] flex-col justify-between rounded-lg p-2.5 text-[11px] font-extrabold ring-1 ring-black/5" style={{ background: b, color: color(kit, "primary") }}>
                    {kit.word}
                    <span className="h-1 w-8 rounded" style={{ background: color(kit, "accent") }} />
                  </div>
                  <p className="mt-1 text-[12px] font-semibold text-[#1a1a2e]">{n}</p>
                </div>
              ))}
            </div>
            {!can(s.plan, "template_lock") && (
              <button type="button" onClick={() => s.upgrade({ feature: "template_lock" })} className="self-start text-[12.5px] font-semibold text-[#ff5e1a]">
                Lock templates so your team only edits content · Enterprise
              </button>
            )}
          </section>

          <div className="flex flex-wrap items-center gap-2 pb-4">
            <button type="button" onClick={() => (s.gate("brand_style_model") ? s.notify("Training a brand style model from your best designs") : undefined)} className={ghostBtn}>
              Train brand style <GateTag feature="brand_style_model" />
            </button>
            <span className="text-[12px] text-[#9a9bb0]">Saved automatically</span>
          </div>
        </div>
      </main>
      {creating && <NewKit onClose={() => setCreating(false)} onSaved={() => setCreating(false)} />}
    </div>
  );
}

function NewKit({ onClose, onSaved }: { onClose: () => void; onSaved: (id: string) => void }) {
  const s = useStudio();
  const [step, setStep] = useState<"pick" | "url" | "extracting" | "review">("pick");
  const [url, setUrl] = useState("aurelia-skin.com");
  const [draft, setDraft] = useState<BrandKit>({ ...EXTRACTED_KIT, id: uid("bk") });
  const [fail, setFail] = useState(false);
  useEffect(() => {
    if (step !== "extracting") return;
    const t = window.setTimeout(() => {
      if (url.includes("blocked")) {
        setFail(true);
        setStep("url");
      } else setStep("review");
    }, 2400);
    return () => window.clearTimeout(t);
  }, [step, url]);

  const save = () => {
    const r = addBrandKit(s.kits, draft, s.plan);
    if (!r.ok) {
      onClose();
      return s.upgrade({ limit: "brandKits", used: s.kits.length });
    }
    s.setKits(() => r.kits);
    s.setKitId(draft.id);
    s.notify(`${draft.name} saved`);
    onSaved(draft.id);
  };

  if (step === "pick")
    return (
      <Modal title="New brand kit" onClose={onClose} width={440}>
        {[
          { k: "url", Icon: Globe, t: "From your website", d: "We pull logo, colours, fonts, voice and selling points. Your first one is free.", go: () => setStep("url") },
          {
            k: "agent",
            Icon: MessageSquareText,
            t: "Describe it to the Agent",
            d: "No website yet? Chat through your brand in Marketing Agent.",
            go: () => {
              onClose();
              s.notify("Opening Marketing Agent with a brand brief");
            },
          },
          {
            k: "blank",
            Icon: Plus,
            t: "Start blank",
            d: "Add logos, colours and fonts yourself.",
            go: () => {
              setDraft({ ...draft, name: "New brand", initials: "NB", source: "manual", sourceUrl: undefined });
              setStep("review");
            },
          },
        ].map(({ k, Icon, t, d, go }) => (
          <button key={k} type="button" onClick={go} className="flex w-full items-start gap-3 rounded-xl p-3 text-left transition hover:bg-[#f7f6f9]">
            <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-[#fff3ec] text-[#ff5e1a]">
              <Icon className="size-4" />
            </span>
            <span>
              <span className="block text-[13.5px] font-semibold text-[#1a1a2e]">{t}</span>
              <span className="block text-[12px] leading-relaxed text-[#9a9bb0]">{d}</span>
            </span>
          </button>
        ))}
      </Modal>
    );
  if (step === "url" || step === "extracting")
    return (
      <Modal
        title="Build from your website"
        onClose={onClose}
        width={440}
        footer={
          <>
            <button type="button" onClick={() => setStep("pick")} className={ghostBtn}>
              Back
            </button>
            <button type="button" disabled={step === "extracting" || !url.trim()} onClick={() => (setFail(false), setStep("extracting"))} className={ctaBtn}>
              <Sparkles className="size-3.5" /> {step === "extracting" ? "Reading your site…" : "Build brand kit · Free"}
            </button>
          </>
        }
      >
        <label className="flex h-10 items-center gap-2 rounded-xl border border-[#e1e3e9] px-3 focus-within:border-[#ff5e1a] focus-within:ring-[3px] focus-within:ring-[#ff5e1a]/15">
          <Globe className="size-4 text-[#9a9bb0]" />
          <input value={url} onChange={(e) => setUrl(e.target.value)} className="min-w-0 flex-1 bg-transparent text-[13.5px] outline-none" placeholder="yourbrand.com or an Instagram page" />
        </label>
        {fail && <p className="mt-2 text-[12.5px] text-[#e5484d]">We couldn’t read this site. Add details manually or describe your brand to the Agent.</p>}
        {step === "extracting" && (
          <ul className="mt-4 space-y-2">
            {["Finding your logo", "Sampling colours", "Detecting fonts", "Learning your voice and selling points"].map((x, i) => (
              <li key={x} className="flex items-center gap-2 text-[13px] text-[#4a4b5c] opacity-0" style={{ animation: `ds-in 0.3s ${i * 0.5}s forwards` }}>
                <span className="size-1.5 rounded-full bg-[#ff9a3d]" /> {x}
              </li>
            ))}
          </ul>
        )}
        <style>{`@keyframes ds-in{to{opacity:1}}`}</style>
        <p className="mt-3 text-[12px] text-[#9a9bb0]">You’ll review everything before it’s saved. Try “blocked.com” to see the failure state.</p>
      </Modal>
    );
  return (
    <Modal
      title="Review your brand kit"
      onClose={onClose}
      width={560}
      footer={
        <>
          <button type="button" onClick={onClose} className={ghostBtn}>
            Cancel
          </button>
          <button type="button" onClick={save} className={ctaBtn}>
            Save brand kit
          </button>
        </>
      }
    >
      {draft.sourceUrl && <p className="mb-3 text-[12.5px] text-[#6a6b7b]">From {draft.sourceUrl} — check anything we got wrong.</p>}
      <KitFields kit={draft} onChange={setDraft} editable />
    </Modal>
  );
}

function KitFields({ kit, onChange, editable }: { kit: BrandKit; onChange: (k: BrandKit) => void; editable: boolean }) {
  const s = useStudio();
  const [avoid, setAvoid] = useState("");
  const input = "w-full rounded-lg border border-[#e1e3e9] px-2.5 py-1.5 text-[13px] outline-none focus:border-[#ff5e1a] disabled:bg-[#faf8f6] disabled:text-[#6a6b7b]";
  const label = "mb-1.5 text-[11.5px] font-bold uppercase tracking-[0.1em] text-[#9a9bb0]";
  return (
    <div className="space-y-5">
      <section>
        <p className={label}>Name & logo</p>
        <div className="flex items-center gap-3">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl text-[18px] font-black text-white" style={{ background: color(kit, "primary") }}>
            {kit.initials}
          </span>
          <input disabled={!editable} value={kit.name} onChange={(e) => onChange({ ...kit, name: e.target.value })} className={input} />
        </div>
      </section>
      <section>
        <p className={label}>Colours</p>
        <div className="grid grid-cols-5 gap-2">
          {kit.colors.map((c, i) => (
            <label key={c.role} className="space-y-1">
              <span className="block h-12 rounded-xl ring-1 ring-black/5" style={{ background: c.hex }} />
              <input
                disabled={!editable}
                value={c.hex}
                onChange={(e) => onChange({ ...kit, colors: kit.colors.map((x, j) => (j === i ? { ...x, hex: e.target.value } : x)) })}
                className={`${input} px-1.5 py-1 text-center text-[11.5px] tabular-nums`}
              />
              <span className="block text-center text-[10.5px] text-[#9a9bb0]">{ROLE_LABEL[c.role]}</span>
            </label>
          ))}
        </div>
      </section>
      <section>
        <p className={label}>Fonts</p>
        <div className="space-y-1.5">
          {kit.fonts.map((f) => (
            <div key={f.role} className="flex items-center gap-3 rounded-xl bg-[#faf8f6] px-3 py-2">
              <span className="w-24 text-[11.5px] font-semibold capitalize text-[#9a9bb0]">{f.role}</span>
              <span className="flex-1 truncate text-[14px] text-[#1a1a2e]" style={{ fontWeight: f.weight }}>
                {f.family}
              </span>
              <span className="rounded-full bg-white px-2 py-0.5 text-[10.5px] font-semibold text-[#16a34a] ring-1 ring-[#e8f7ee]">Commercial use OK</span>
            </div>
          ))}
        </div>
      </section>
      <section>
        <p className={`${label} flex items-center gap-2`}>
          Brand voice <GateTag feature="brand_voice" />
        </p>
        <p className="mb-2 text-[12px] text-[#9a9bb0]">Goes into Ad Copy, Captions & Hashtags, Campaign Brief, and Deck / Site copy.</p>
        <textarea disabled={!editable} rows={2} value={kit.voice.tone} onChange={(e) => onChange({ ...kit, voice: { ...kit.voice, tone: e.target.value } })} className={`${input} resize-none`} />
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-[12px] text-[#6a6b7b]">Avoid:</span>
          {kit.voice.avoid.map((w) => (
            <span key={w} className="inline-flex items-center gap-1 rounded-full bg-[#fdecec] px-2 py-0.5 text-[12px] text-[#c2410c]">
              {w}
              {editable && (
                <button type="button" aria-label={`Remove ${w}`} onClick={() => onChange({ ...kit, voice: { ...kit.voice, avoid: kit.voice.avoid.filter((x) => x !== w) } })}>
                  <X className="size-3" />
                </button>
              )}
            </span>
          ))}
          {editable && (
            <input
              value={avoid}
              onChange={(e) => setAvoid(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && avoid.trim()) {
                  onChange({ ...kit, voice: { ...kit.voice, avoid: [...kit.voice.avoid, avoid.trim()] } });
                  setAvoid("");
                }
              }}
              placeholder="Add a word, press Enter"
              className="h-7 w-44 rounded-full border border-[#e1e3e9] px-2.5 text-[12px] outline-none focus:border-[#ff5e1a]"
            />
          )}
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className={label}>Audience</p>
          <textarea disabled={!editable} rows={3} value={kit.audience} onChange={(e) => onChange({ ...kit, audience: e.target.value })} className={`${input} resize-none`} />
        </div>
        <div>
          <p className={label}>Selling points</p>
          <ul className="space-y-1">
            {kit.sellingPoints.map((p, i) => (
              <li key={i}>
                <input disabled={!editable} value={p} onChange={(e) => onChange({ ...kit, sellingPoints: kit.sellingPoints.map((x, j) => (j === i ? e.target.value : x)) })} className={input} />
              </li>
            ))}
          </ul>
          <p className="mt-1 text-[11.5px] text-[#9a9bb0]">Used for bulk variants by selling point{can(s.plan, "bulk_variants") ? "" : " (Ultra)"}.</p>
        </div>
      </section>
    </div>
  );
}

