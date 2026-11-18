"use client";

/* Design Studio 外框(照 Notion HTML 示意原型):顶栏 5 个分页 Image Builder / Brand Kit / Decks / Sites / Projects,
   右边 Brand 切换(切了以后当前设计、Deck、Site 全部换成该品牌的颜色)、积分、Export(开了审批且未批准时是 Submit for approval)。
   HTML 是独立页面，这里嵌在 BuzzVideo 侧边栏右边;视觉换成 BuzzVideo 浅色 + 品牌橙。 */

import { useEffect, useState } from "react";
import { Clock, FileUp, Folder as FolderIcon, LayoutTemplate, Lock, Menu, Presentation, Search, Sparkles, TriangleAlert, Upload, Users, Globe } from "lucide-react";
import { DropdownSelect } from "@/components/ui/dropdown-select";
import { atLimit, can, PLAN_LABEL } from "../entitlements";
import { FORMATS, TEMPLATES, color, designFromTemplate, formatLabel, recolor, type Design } from "../data";
import { canExport } from "../store";
import { BrandKitsPage } from "./BrandKits";
import { Decks } from "./Decks";
import { DesignCanvas } from "./DesignCanvas";
import { ExportDialog } from "./EditorDialogs";
import { ImageBuilder } from "./ImageBuilder";
import { Sites } from "./Sites";
import { CreditPill, Modal, ctaBtn, ghostBtn, iconBtn, kitOf, useStudio } from "./ui";

export type Tab = "image" | "brand" | "decks" | "sites" | "projects";
export type Route = { tab: Tab; designId?: string | null; siteId?: string | null };

const TABS: [Tab, string][] = [
  ["image", "Image Builder"],
  ["brand", "Brand Kit"],
  ["decks", "Decks"],
  ["sites", "Sites"],
  ["projects", "Projects"],
];

export function StudioRoot({ route, setRoute, onMenu }: { route: Route; setRoute: (r: Route | null) => void; onMenu: () => void }) {
  const s = useStudio();
  const [exporting, setExporting] = useState(false);
  const [creating, setCreating] = useState(false);

  /* 当前在编辑的东西:Image Builder 用贴文类设计，Decks 用 Deck,Sites 用站点 */
  const post = s.designs.find((d) => d.id === route.designId && d.type !== "deck") ?? s.designs.find((d) => d.type !== "deck");
  const deck = s.designs.find((d) => d.id === route.designId && d.type === "deck") ?? s.designs.find((d) => d.type === "deck");
  const site = s.sites.find((x) => x.id === route.siteId) ?? s.sites[0];
  const current = route.tab === "decks" ? deck : route.tab === "image" ? post : undefined;

  /* 品牌以顶栏为准(HTML:切品牌，全部画面换色):当前打开的设计 / Deck / 站点品牌和顶栏不一致时，换成顶栏品牌的颜色 */
  const recolorTo = (d: Design, id: string) => {
    const from = kitOf(s, d.brandId);
    const to = kitOf(s, id);
    const map = new Map((from?.colors ?? []).map((c) => [c.hex.toLowerCase(), color(to, c.role)]));
    s.save({ ...d, brandId: id, pages: d.pages.map((p) => ({ ...p, bg: map.get(p.bg.toLowerCase()) ?? p.bg, layers: recolor(p.layers, from, to) })) });
  };
  const switchBrand = (id: string) => s.setKitId(id);
  useEffect(() => {
    const id = s.kitId;
    if (!id) return;
    if (current && current.brandId !== id) recolorTo(current, id);
    if (route.tab === "sites" && site && site.brandId !== id) s.saveSite({ ...site, brandId: id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.kitId, current?.id, route.tab]);

  const exportable = current ? canExport(current, s.approvalsOn) : true;
  const exportBtn =
    current && s.approvalsOn && !exportable ? (
      <button
        type="button"
        disabled={current.approval.status === "in_review"}
        onClick={() => {
          s.save({ ...current, approval: { ...current.approval, status: "in_review" } });
          s.notify(`Sent v${current.version} to Kelvin for approval`);
        }}
        className={ctaBtn}
      >
        {current.approval.status === "in_review" ? (
          <>
            <Clock className="size-3.5" /> In review
          </>
        ) : (
          "Submit for approval"
        )}
      </button>
    ) : (
      <button type="button" disabled={!current} onClick={() => setExporting(true)} className={ctaBtn}>
        <Upload className="size-3.5" /> Export
      </button>
    );

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col">
      <header className="flex min-h-[60px] shrink-0 flex-wrap items-center gap-x-3.5 gap-y-2 border-b border-[#f1f1f4] px-4 py-2 sm:px-5">
        <button type="button" onClick={onMenu} aria-label="Open menu" className={`${iconBtn} -ml-1.5 md:hidden`}>
          <Menu className="size-5" />
        </button>
        <span className="text-[16px] font-extrabold tracking-tight text-[#1a1a2e]">Design Studio</span>
        <nav className="flex flex-wrap gap-1" aria-label="Studio sections">
          {TABS.map(([k, l]) => (
            <button key={k} type="button" onClick={() => setRoute({ ...route, tab: k })} className={`h-[34px] rounded-lg px-3.5 text-[13.5px] font-semibold transition ${route.tab === k ? "bg-[#fff0e6] text-[#ff5e1a]" : "text-[#6a6b7b] hover:bg-[#f7f6f9] hover:text-[#1a1a2e]"}`}>
              {l}
            </button>
          ))}
        </nav>
        <span className="flex-1" />
        <span className="text-[12.5px] text-[#9a9bb0]">Brand</span>
        <div className="w-[170px] shrink-0"><DropdownSelect label="Brand" size="sm" value={s.kitId ?? s.kits[0].id} onChange={switchBrand} options={s.kits.map((k) => ({ value: k.id, label: k.name }))} /></div>
        <span className="hidden rounded-full bg-[#f4f3f6] px-2.5 py-1 text-[11.5px] font-semibold text-[#6a6b7b] sm:inline">{PLAN_LABEL[s.plan]}</span>
        <CreditPill credits={s.balance} className="rounded-full bg-[#fff7f1] px-2.5 py-1 text-[12px]" />
        {(route.tab === "image" || route.tab === "decks") && exportBtn}
      </header>

      {route.tab === "image" && post && <ImageBuilder key={post.id} design={post} openBrandKit={() => setRoute({ tab: "brand" })} />}
      {route.tab === "brand" && <BrandKitsPage onUse={() => setRoute({ tab: "image" })} />}
      {route.tab === "decks" && <Decks key={deck?.id ?? "none"} design={deck} onOpen={(id) => setRoute({ tab: "decks", designId: id })} />}
      {route.tab === "sites" && <Sites key={site?.id ?? "none"} site={site} />}
      {route.tab === "projects" && (
        <Projects
          onCreate={() => setCreating(true)}
          onOpen={(r) => {
            const b = r.designId ? s.designs.find((d) => d.id === r.designId)?.brandId : r.siteId ? s.sites.find((x) => x.id === r.siteId)?.brandId : null;
            if (b) s.setKitId(b);
            setRoute(r);
          }}
        />
      )}

      {exporting && current && <ExportDialog design={current} onClose={() => setExporting(false)} onFixIssues={() => setExporting(false)} />}
      {creating && (
        <CreateMenu
          onClose={() => setCreating(false)}
          go={(r) => {
            setCreating(false);
            setRoute(r);
          }}
        />
      )}
    </div>
  );
}

const TYPE_LABEL: Record<Design["type"], string> = { post: "Image", story: "Image", carousel: "Image", deck: "Deck" };

function Projects({ onCreate, onOpen }: { onCreate: () => void; onOpen: (r: Route) => void }) {
  const s = useStudio();
  const [q, setQ] = useState("");
  const [folder, setFolder] = useState<string | null>(null);
  const items = s.designs.filter((d) => (!folder || d.folderId === folder) && d.name.toLowerCase().includes(q.toLowerCase()));
  const sites = s.sites.filter((x) => !folder && x.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <main className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-5 px-5 py-7 sm:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[26px] font-extrabold tracking-tight text-[#1a1a2e]">Projects</h1>
          <label className="flex h-10 max-w-[420px] flex-[1_1_280px] items-center gap-2 rounded-lg border border-[#e1e3e9] px-3 focus-within:border-[#ff5e1a]">
            <Search className="size-4 text-[#9a9bb0]" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search designs, decks, sites" aria-label="Search designs" className="min-w-0 flex-1 bg-transparent text-[13.5px] outline-none placeholder:text-[#9a9bb0]" />
          </label>
          <span className="flex-1" />
          <button type="button" onClick={() => s.gate("team_folders") && s.notify("Team folder created")} className={ghostBtn}>
            + New folder {!can(s.plan, "team_folders") && <Lock className="size-3 text-[#9a9bb0]" />}
          </button>
          <button type="button" onClick={onCreate} className={ctaBtn}>
            + Create design
          </button>
        </div>
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9a9bb0]">Folders</p>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
          {s.folders.map((f) => {
            const locked = f.team && !can(s.plan, "team_folders");
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => (locked ? s.upgrade({ feature: "team_folders" }) : setFolder(folder === f.id ? null : f.id))}
                className={`flex items-center gap-3 rounded-xl border bg-white p-3.5 text-left transition ${folder === f.id ? "border-[#ff9a3d] bg-[#fff7f1]" : "border-[#ececf1] hover:border-[#d4d3df]"}`}
              >
                <FolderIcon className="size-5 shrink-0 text-[#ff5e1a]" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-semibold text-[#1a1a2e]">{f.name}</span>
                  <span className="flex items-center gap-1 text-[12px] text-[#9a9bb0]">
                    {f.team && <Users className="size-3" />}
                    {f.meta}
                  </span>
                </span>
                {locked && <Lock className="size-3.5 text-[#9a9bb0]" />}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9a9bb0]">{folder ? s.folders.find((f) => f.id === folder)?.name : "Recent"}</p>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3.5">
          {items.map((d) => {
            const k = kitOf(s, d.brandId);
            const locked = d.template && can(s.plan, "template_lock");
            return (
              <button key={d.id} type="button" onClick={() => onOpen({ tab: d.type === "deck" ? "decks" : "image", designId: d.id })} className="group flex flex-col gap-2 text-left">
                <div className="relative grid aspect-[4/5] place-items-center overflow-hidden rounded-[10px] bg-[#f4f3f6] p-3 ring-1 ring-[#ececf1] transition group-hover:ring-[#ff9a3d]">
                  <div className="w-full overflow-hidden rounded-md shadow-[0_6px_18px_rgba(26,26,46,0.12)]" style={{ maxWidth: d.ratio >= 1 ? "100%" : `${d.ratio * 125}%` }}>
                    <DesignCanvas page={d.pages[0]} ratio={d.ratio} kit={k} />
                  </div>
                  {d.approval.status === "approved" && <span className="absolute right-2 top-2 rounded-full bg-[#e8f7ee] px-2 py-0.5 text-[10.5px] font-semibold text-[#16a34a]">Approved</span>}
                </div>
                <b className="text-[13px] text-[#1a1a2e]">{d.name}</b>
                <span className="-mt-1.5 text-[11.5px] text-[#9a9bb0]">
                  {locked ? "Template · locked" : d.type === "deck" ? `Deck · ${d.pages.length} slides` : `${TYPE_LABEL[d.type]} · ${k?.name ?? "No brand"}`}
                </span>
              </button>
            );
          })}
          {sites.map((x) => {
            const k = kitOf(s, x.brandId);
            return (
              <button key={x.id} type="button" onClick={() => onOpen({ tab: "sites", siteId: x.id })} className="group flex flex-col gap-2 text-left">
                <div className="flex aspect-[4/5] flex-col justify-between overflow-hidden rounded-[10px] p-3.5 ring-1 ring-[#ececf1] transition group-hover:ring-[#ff9a3d]" style={{ background: color(k, "background", "#fff") }}>
                  <span className="text-[16px] font-black leading-tight" style={{ color: color(k, "primary") }}>
                    {x.sections[0]?.title}
                  </span>
                  <span className="self-start rounded-full px-2.5 py-1 text-[10.5px] font-bold" style={{ background: color(k, "accent"), color: color(k, "primary") }}>
                    Register now
                  </span>
                </div>
                <b className="text-[13px] text-[#1a1a2e]">{x.name}</b>
                <span className="-mt-1.5 text-[11.5px] text-[#9a9bb0]">Site · {x.status === "live" ? "live" : "draft"}</span>
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}

function CreateMenu({ onClose, go }: { onClose: () => void; go: (r: Route) => void }) {
  const s = useStudio();
  const [importing, setImporting] = useState(false);
  const kit = kitOf(s, s.kitId);
  const row = "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-[#f7f6f9]";
  const ic = "grid size-9 shrink-0 place-items-center rounded-[10px] bg-[#fff3ec] text-[#ff5e1a]";
  if (importing) return <ImportDialog onClose={onClose} onDone={(id) => go({ tab: "image", designId: id })} />;
  const blank = (key: (typeof FORMATS)[number]["key"]) => {
    const d = designFromTemplate({ ...TEMPLATES[0], format: key, locked: false }, kit, `Untitled · ${formatLabel(key)}`);
    s.add([d]);
    go({ tab: "image", designId: d.id });
  };
  return (
    <Modal title="Create a design" onClose={onClose} width={420}>
      {(
        [
          [Sparkles, "Generate on brand", "Image Builder › AI panel", () => go({ tab: "image" })],
          [Presentation, "Deck", "Outline first, then on-brand slides", () => go({ tab: "decks" })],
          [Globe, "One-page site", "Event pages, sign-ups, launches", () => (atLimit(s.plan, "sites", s.sites.length) ? (onClose(), s.upgrade({ limit: "sites", used: s.sites.length })) : go({ tab: "sites" }))],
          [FileUp, "Import", "Canva, PowerPoint, PDF or an image", () => setImporting(true)],
        ] as const
      ).map(([I, t, d, fn]) => (
        <button key={t} type="button" onClick={fn} className={row}>
          <span className={ic}>
            <I className="size-4" />
          </span>
          <span className="flex-1">
            <span className="block text-[13.5px] font-semibold text-[#1a1a2e]">{t}</span>
            <span className="block text-[12px] text-[#9a9bb0]">{d}</span>
          </span>
        </button>
      ))}
      <p className="mb-1 mt-3 px-3 text-[11.5px] font-bold uppercase tracking-[0.1em] text-[#9a9bb0]">Blank</p>
      <div className="grid grid-cols-2 gap-1">
        {FORMATS.map((f) => (
          <button key={f.key} type="button" onClick={() => blank(f.key)} className="rounded-xl px-3 py-2 text-left transition hover:bg-[#f7f6f9]">
            <span className="block text-[13px] font-semibold text-[#1a1a2e]">{f.label}</span>
            <span className="block text-[11px] text-[#9a9bb0]">{f.dims}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}

function ImportDialog({ onClose, onDone }: { onClose: () => void; onDone: (id: string) => void }) {
  const s = useStudio();
  const [step, setStep] = useState<"pick" | "working" | "report">("pick");
  const [src, setSrc] = useState("canva_pdf");
  useEffect(() => {
    if (step !== "working") return;
    const t = window.setTimeout(() => setStep("report"), 1600);
    return () => window.clearTimeout(t);
  }, [step]);
  const finish = () => {
    const d = designFromTemplate({ ...TEMPLATES[4], locked: false }, kitOf(s, s.kitId), "Imported · Townhall cover");
    s.add([d]);
    onDone(d.id);
  };
  if (step === "working")
    return (
      <Modal title="Importing" onClose={onClose} width={400}>
        <ul className="space-y-2.5 py-2 text-[13px] text-[#4a4b5c]">
          {["Reading pages", "Matching fonts", "Checking element licences"].map((x) => (
            <li key={x} className="flex items-center gap-2">
              <span className="size-1.5 animate-pulse rounded-full bg-[#ff9a3d]" /> {x}…
            </li>
          ))}
        </ul>
      </Modal>
    );
  if (step === "report")
    return (
      <Modal
        title="Import report"
        onClose={onClose}
        width={460}
        footer={
          <button type="button" onClick={finish} className={ctaBtn}>
            Open in Image Builder
          </button>
        }
      >
        <p className="text-[13px] text-[#4a4b5c]">1 page imported. Here’s what changed so nothing surprises you later.</p>
        <ul className="mt-3 space-y-2 text-[13px]">
          <li className="flex gap-2 rounded-xl bg-[#faf8f6] p-3">
            <LayoutTemplate className="mt-0.5 size-4 shrink-0 text-[#16a34a]" /> 6 text boxes and 3 images are editable
          </li>
          <li className="flex gap-2 rounded-xl bg-[#faf8f6] p-3">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-[#d97706]" /> 2 fonts replaced: “Canva Sans” → Inter, “Glacial Indifference” → Inter
          </li>
          <li className="flex gap-2 rounded-xl bg-[#fff7f1] p-3">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-[#ff5e1a]" />
            <span>
              3 elements may be Canva-licensed.
              <span className="block text-[12px] text-[#9a9bb0]">Replace them before commercial use — Canva’s licence doesn’t cover use outside Canva.</span>
            </span>
          </li>
        </ul>
      </Modal>
    );
  return (
    <Modal
      title="Import"
      onClose={onClose}
      width={460}
      footer={
        <>
          <button type="button" onClick={onClose} className={ghostBtn}>
            Cancel
          </button>
          <button type="button" onClick={() => setStep("working")} className={ctaBtn}>
            Choose file
          </button>
        </>
      }
    >
      {[
        ["canva_pptx", "Canva presentation (.pptx)", "Best fidelity: text boxes and images stay editable"],
        ["canva_pdf", "Canva design (PDF)", "Text and vectors are extracted"],
        ["pptx", "PowerPoint (.pptx)", "Slides become pages"],
        ["png", "Image (PNG / JPG)", "Split to Layers · 8 credits"],
      ].map(([k, t, d]) => (
        <button key={k} type="button" onClick={() => setSrc(k)} className={`mb-1.5 flex w-full items-start gap-3 rounded-xl p-3 text-left ring-1 transition ${src === k ? "bg-[#fff7f1] ring-[#ff9a3d]" : "ring-[#ececf1] hover:ring-[#d4d3df]"}`}>
          <span className={`mt-0.5 size-4 shrink-0 rounded-full border-2 ${src === k ? "border-[#ff5e1a] bg-[radial-gradient(circle,#ff5e1a_40%,transparent_45%)]" : "border-[#d4d3df]"}`} />
          <span>
            <span className="block text-[13px] font-semibold text-[#1a1a2e]">{t}</span>
            <span className="block text-[12px] text-[#9a9bb0]">{d}</span>
          </span>
        </button>
      ))}
      <p className="mt-2 text-[12px] text-[#9a9bb0]">Tip: in Canva, download presentations as PPTX and single designs as PDF.</p>
    </Modal>
  );
}

