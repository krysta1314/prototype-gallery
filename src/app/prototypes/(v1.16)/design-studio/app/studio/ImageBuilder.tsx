"use client";

/* Image Builder(照 Notion HTML 示意原型的版式):
   最左工具栏 Templates / Elements / Text / Uploads / Brand / AI → 旁边面板 → 中间画布台(上方选中属性条、下方 Magic Resize 格式条 + 状态)
   → 右栏 AI tools(7 张卡,Split to Layers 标 NEW)+ Layers。
   在 HTML 基础上的新增(市场调研):AI 卡标积分、余额不足 / 个人额度拦截、Admin 关掉的工具、Magic Resize 要 Starter、
   模板锁只在 Enterprise 生效、审批条、Brand Check、Free 档仅限个人使用。 */

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Ban,
  CheckCircle2,
  Clapperboard,
  Eraser,
  Expand,
  Heart,
  ImageUp,
  Layers as LayersIcon,
  LayoutGrid,
  Lock,
  MessageSquare,
  Palette,
  Redo2,
  ScanSearch,
  Scissors,
  Shapes,
  ShieldCheck,
  Sparkles,
  Star,
  SunMedium,
  TrendingUp,
  Type,
  Undo2,
  Upload,
  DollarSign,
} from "lucide-react";
import { can, isEnterprise, requiredPlan } from "../entitlements";
import { costOf, type AiAction } from "../pricing";
import { ASSETS, FORMATS, IMG, SAFE_ZONE, TEMPLATES, color, designFromTemplate, fontOf, talkPost, uid, type Design, type Layer } from "../data";
import { approve, brandCheck, fixIssues, requestChanges, setFormat } from "../store";
import { DesignCanvas } from "./DesignCanvas";
import { CreditPill, GateTag, LockBadge, PlanTag, ghostBtn, kitOf, useStudio } from "./ui";

type Tool = "templates" | "elements" | "text" | "uploads" | "brand" | "ai";
const TOOLS: { k: Tool; label: string; Icon: typeof Type }[] = [
  { k: "templates", label: "Templates", Icon: LayoutGrid },
  { k: "elements", label: "Elements", Icon: Shapes },
  { k: "text", label: "Text", Icon: Type },
  { k: "uploads", label: "Uploads", Icon: Upload },
  { k: "brand", label: "Brand", Icon: Palette },
  { k: "ai", label: "AI", Icon: Sparkles },
];

/** 右栏 AI tools(照 HTML 的 7 张卡;Magic Layers 改名 Split to Layers,和 Canva 同名功能区分) */
type AiCard = { action: AiAction | "to_video"; title: string; sub: string; Icon: typeof Type; isNew?: boolean; msg: string };
const AI_CARDS: AiCard[] = [
  { action: "remove_bg", title: "Remove background", sub: "Live in Marketing Agent → add to editor", Icon: Scissors, msg: "Background removed from AI image" },
  { action: "split_layers", title: "Split to Layers", sub: "NEW build: flat image → editable layers", Icon: LayersIcon, isNew: true, msg: "Split to Layers: 5 layers detected (text, person, logo, 2 objects)" },
  { action: "object_removal", title: "Object removal / Inpaint", sub: "Live in Marketing Agent → add to editor", Icon: Eraser, msg: "Brush an object to erase or replace it" },
  { action: "relight", title: "Relight / Style transfer", sub: "Live in Marketing Agent → add to editor", Icon: SunMedium, msg: "Relit to match the brand palette" },
  { action: "magic_expand", title: "Magic Expand", sub: "Outpaint to fit a new ratio", Icon: Expand, msg: "Expanded image to fill the canvas" },
  { action: "upscale", title: "Upscale", sub: "Live in Marketing Agent → add to editor", Icon: ImageUp, msg: "Upscaled 4× for export" },
  { action: "to_video", title: "Make it a video", sub: "Send design to BuzzVideo video gen", Icon: Clapperboard, msg: "Sent design to BuzzVideo video generation" },
];
/** Enterprise 里 Admin 关掉的工具(演示:Member 身份时 Relight 被关) */
const ADMIN_OFF: AiCard["action"][] = ["relight"];

const label = "text-[11px] font-bold uppercase tracking-[0.08em] text-[#9a9bb0]";
const card = "rounded-xl border border-[#ececf1] bg-white";
const field = "h-10 w-full rounded-lg border border-[#e1e3e9] bg-white px-3 text-[13px] outline-none placeholder:text-[#9a9bb0] focus:border-[#ff5e1a] focus:ring-[3px] focus:ring-[#ff5e1a]/15";

export function ImageBuilder({ design, openBrandKit }: { design: Design; openBrandKit: () => void }) {
  const s = useStudio();
  const kit = kitOf(s, design.brandId);
  const [tool, setTool] = useState<Tool>("templates");
  const [panelOpen, setPanelOpen] = useState(true);
  const [sel, setSel] = useState<string | null>(() => design.pages[0].layers.find((l) => l.name === "Headline")?.id ?? null);
  const [busy, setBusy] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [past, setPast] = useState<Design[]>([]);
  const [future, setFuture] = useState<Design[]>([]);
  const [checking, setChecking] = useState(false);
  /* 窄屏(lg 以下)右栏收起，点「AI tools」从底部弹出 */
  const [sheet, setSheet] = useState(false);

  /* 窄屏左面板默认收起，不挡画布 */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (window.matchMedia("(max-width: 767px)").matches) setPanelOpen(false);
  }, []);

  /* 模板锁只在 Enterprise 生效：套餐不够时按「不锁」显示(数据里的锁保留) */
  const lockOn = can(s.plan, "template_lock");
  const raw = design.pages[0];
  const page = lockOn ? raw : { ...raw, layers: raw.layers.map((l) => ({ ...l, lock: undefined })) };
  const selected = page.layers.find((l) => l.id === sel) ?? null;
  const issues = useMemo(() => (checking ? brandCheck(design, kit) : []), [checking, design, kit]);
  const issueIds = useMemo(() => new Set(issues.map((i) => i.layerId)), [issues]);

  const say = (m: string) => {
    setStatus(m);
    s.notify(m);
  };
  /** 改设计：记一步撤销;草稿直接存，已提交 / 已批准的回 Draft、版本 +1(审批绑定版本) */
  const update = (fn: (d: Design) => Design) => {
    setPast((p) => [...p.slice(-30), design]);
    setFuture([]);
    const next = fn(design);
    const back = design.approval.status !== "draft";
    s.save({ ...next, edited: "Just now", ...(back ? { version: design.version + 1, approval: { ...design.approval, status: "draft" as const } } : {}) });
  };
  const mapLayers = (fn: (ls: Layer[]) => Layer[]) => update((d) => ({ ...d, pages: d.pages.map((p, i) => (i === 0 ? { ...p, layers: fn(p.layers) } : p)) }));
  const patch = (id: string, p: Partial<Layer>) => mapLayers((ls) => ls.map((l) => (l.id === id ? { ...l, ...p } : l)));
  const add = (l: Omit<Layer, "id">) => {
    const id = uid("l");
    mapLayers((ls) => [...ls, { ...l, id }]);
    setSel(id);
  };
  const setBg = (hex: string) => update((d) => ({ ...d, pages: d.pages.map((p, i) => (i === 0 ? { ...p, bg: hex } : p)) }));

  const runAi = (c: AiCard) => {
    if (c.action === "to_video") return say(c.msg);
    const act: AiAction = c.action;
    const target = selected?.kind === "image" ? selected : page.layers.find((l) => l.kind === "image");
    if (!target) return say("Select an image layer first");
    if (!s.charge(costOf(act))) return;
    setBusy(target.id);
    window.setTimeout(() => {
      setBusy(null);
      if (act === "remove_bg") patch(target.id, { bgRemoved: true, fill: color(kit, "primary") });
      else if (act === "split_layers") add({ kind: "text", name: "Detected text", x: target.x + 4, y: target.y + 4, w: 60, h: 7, text: "Investment Talk 2027", size: 3.4, weight: 800, color: "#ffffff" });
      else patch(target.id, { ai: true });
      say(`${c.msg} · ${costOf(act)} credits`);
    }, 1100);
  };

  const approvalsOn = s.approvalsOn;
  const st = design.approval.status;
  const safe = SAFE_ZONE[design.format];
  const selLabel = selected ? (selected.name ?? selected.kind) : "Page";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {approvalsOn && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[#f1f1f4] bg-[#faf8f6] px-4 py-2 text-[12.5px]">
          <ShieldCheck className="size-4 text-[#6a6b7b]" />
          {st === "draft" && <span className="text-[#4a4b5c]">{design.approval.approvedVersion ? `Edited after approval (v${design.approval.approvedVersion} was approved) · needs re-approval before export` : "Needs approval before export"}</span>}
          {st === "in_review" && <span className="text-[#4a4b5c]">v{design.version} is waiting for Kelvin</span>}
          {st === "approved" && (
            <span className="inline-flex items-center gap-1 text-[#16a34a]">
              <CheckCircle2 className="size-3.5" /> Approved by {design.approval.reviewer} · ready to export
            </span>
          )}
          {st === "changes" && <span className="text-[#e5484d]">Kelvin requested changes — edit and resubmit</span>}
          {st === "in_review" && s.role === "admin" && (
            <span className="ml-auto flex items-center gap-1.5">
              <span className="text-[11.5px] text-[#9a9bb0]">Reviewer</span>
              <button type="button" onClick={() => (s.save(requestChanges(design)), s.notify("Changes requested"))} className={`${ghostBtn} h-7 px-2.5 text-[12px]`}>
                Request changes
              </button>
              <button type="button" onClick={() => (s.save(approve(design)), s.notify(`v${design.version} approved`))} className="inline-flex h-7 items-center rounded-lg bg-[#1a1a2e] px-3 text-[12px] font-bold text-white">
                Approve
              </button>
            </span>
          )}
        </div>
      )}
      <div className="relative flex min-h-0 flex-1">
        {/* 工具栏 */}
        <nav className="flex w-[76px] shrink-0 flex-col items-center gap-1 border-r border-[#f1f1f4] bg-white py-3" aria-label="Image Builder tools">
          {TOOLS.map(({ k, label: l, Icon }) => (
            <button
              key={k}
              type="button"
              onClick={() => (tool === k ? setPanelOpen(!panelOpen) : (setTool(k), setPanelOpen(true)))}
              className={`flex w-16 flex-col items-center gap-1 rounded-[10px] py-2 text-[10.5px] font-semibold transition ${tool === k && panelOpen ? "bg-[#fff3ec] text-[#ff5e1a]" : "text-[#6a6b7b] hover:bg-[#f7f6f9]"}`}
            >
              <Icon className="size-5" strokeWidth={1.7} />
              {l}
            </button>
          ))}
        </nav>

        {/* 面板 */}
        {panelOpen && (
          <aside className="flex w-[288px] shrink-0 flex-col gap-3 overflow-y-auto border-r border-[#f1f1f4] bg-[#fcfcfd] p-4 max-md:absolute max-md:inset-y-0 max-md:left-[76px] max-md:z-20 max-md:shadow-xl">
            <Panel tool={tool} design={design} kit={kit} add={add} update={update} setBg={setBg} selected={selected} patch={patch} say={say} openBrandKit={openBrandKit} lockOn={lockOn} />
          </aside>
        )}

        {/* 画布台 */}
        <main className="flex min-w-0 flex-1 flex-col bg-[#f3f1ee]">
          <div className="flex min-h-12 shrink-0 flex-wrap items-center gap-2 border-b border-[#ece9e4] bg-white px-4 py-2">
            <span className="text-[13px] text-[#9a9bb0]">Selected:</span>
            <span className="text-[13px] font-semibold text-[#1a1a2e]">{selLabel}</span>
            {selected?.lock && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#f4f3f6] px-2 py-0.5 text-[10.5px] font-semibold text-[#4a4b5c]">
                <Lock className="size-2.5" /> {selected.lock === "all" ? "Locked" : "Content only"}
              </span>
            )}
            <span className="mx-1.5 h-5 w-px bg-[#ececf1]" />
            {selected?.kind === "text" ? (
              <>
                <span className={`${ghostBtn} h-[30px] px-2.5 text-[12.5px]`}>{fontOf(kit, (selected.size ?? 0) > 5 ? "heading" : "body")?.family ?? "Inter"}</span>
                <span className="inline-flex h-[30px] items-center rounded-xl border border-[#ececf1] px-1 text-[12.5px]">
                  <button type="button" aria-label="Smaller" disabled={!!selected.lock} onClick={() => patch(selected.id, { size: Math.max(1.4, (selected.size ?? 4) - 0.4) })} className="px-1.5 text-[#6a6b7b] disabled:opacity-40">
                    −
                  </button>
                  <span className="w-7 text-center font-semibold tabular-nums">{Math.round((selected.size ?? 4) * 9.6)}</span>
                  <button type="button" aria-label="Bigger" disabled={!!selected.lock} onClick={() => patch(selected.id, { size: (selected.size ?? 4) + 0.4 })} className="px-1.5 text-[#6a6b7b] disabled:opacity-40">
                    +
                  </button>
                </span>
                <button type="button" aria-label="Bold" disabled={!!selected.lock} onClick={() => patch(selected.id, { weight: (selected.weight ?? 600) >= 800 ? 500 : 900 })} className={`${ghostBtn} h-[30px] w-[30px] px-0 font-black disabled:opacity-40`}>
                  B
                </button>
              </>
            ) : null}
            <button type="button" onClick={() => say("Animate: fade-in applied for MP4 / GIF export")} className={`${ghostBtn} h-[30px] px-2.5 text-[12.5px]`}>
              Animate
            </button>
            <span className="flex-1" />
            <button type="button" onClick={() => setSheet(true)} className={`${ghostBtn} h-[30px] px-2.5 text-[12.5px] lg:hidden`}>
              <Sparkles className="size-3.5 text-[#ff5e1a]" /> AI tools
            </button>
            <button type="button" aria-label="Undo" disabled={!past.length} onClick={() => (setFuture((f) => [design, ...f]), s.save(past[past.length - 1]), setPast((p) => p.slice(0, -1)))} className={`${ghostBtn} h-[30px] w-[30px] px-0`}>
              <Undo2 className="size-3.5" />
            </button>
            <button type="button" aria-label="Redo" disabled={!future.length} onClick={() => (setPast((p) => [...p, design]), s.save(future[0]), setFuture((f) => f.slice(1)))} className={`${ghostBtn} h-[30px] w-[30px] px-0`}>
              <Redo2 className="size-3.5" />
            </button>
          </div>

          <div className="relative min-h-0 flex-1" onPointerDown={() => setSel(null)}>
            {/* 画布按画布台宽高等比放进去(cqw / cqh),四种格式都完整可见 */}
            <div className="absolute inset-5 grid place-items-center [container-type:size] sm:inset-8">
              <div className="relative shadow-[0_12px_32px_rgba(26,26,46,0.16)]" style={{ width: `min(100cqw, ${design.ratio} * 100cqh, 620px)` }} onPointerDown={(e) => e.stopPropagation()}>
                <DesignCanvas page={page} ratio={design.ratio} kit={kit} selected={sel} onSelect={setSel} onChange={patch} editable safe={safe} issues={issueIds} />
                {busy && (
                  <div className="pointer-events-none absolute inset-0 grid place-items-center bg-white/40 backdrop-blur-[1px]">
                    <span className="rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-[#1a1a2e] shadow">Working…</span>
                  </div>
                )}
              </div>
            </div>
            {!can(s.plan, "commercial_use") && <p className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-[#1a1a2e]/80 px-3 py-1 text-[11.5px] text-white">Free plan · personal use only</p>}
          </div>

          <div className="flex min-h-14 shrink-0 flex-wrap items-center gap-2 border-t border-[#ece9e4] bg-white px-4 py-2">
            <span className={`${label} mr-1 inline-flex items-center gap-1.5`}>
              Magic Resize <GateTag feature="magic_resize" />
            </span>
            {FORMATS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => {
                  if (f.key === design.format) return;
                  if (!s.gate("magic_resize")) return;
                  update((d) => setFormat(d, f.key));
                  say(`Resized to ${f.label}${SAFE_ZONE[f.key] ? " · platform safe zones shown" : ""}`);
                }}
                className={`h-8 rounded-lg border px-3 text-[12.5px] font-semibold transition ${design.format === f.key ? "border-[#ff9a3d] bg-[#fff7f1] text-[#1a1a2e]" : "border-[#ececf1] text-[#6a6b7b] hover:border-[#d4d3df]"}`}
              >
                {f.label}
              </button>
            ))}
            <span className="flex-1" />
            <span role="status" className="text-[12.5px] font-medium text-[#ff5e1a]">
              {status}
            </span>
          </div>
        </main>

        {/* 右栏 AI tools + Layers */}
        <aside
          className={`w-[300px] shrink-0 flex-col gap-3 overflow-y-auto border-l border-[#f1f1f4] bg-white p-4 lg:flex ${
            sheet ? "flex max-lg:absolute max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-30 max-lg:max-h-[60%] max-lg:w-auto max-lg:rounded-t-[20px] max-lg:border-l-0 max-lg:shadow-[0_-12px_32px_rgba(26,26,46,0.16)]" : "hidden"
          }`}
        >
          <div className="flex items-center gap-2">
            <p className={`${label} flex-1`}>
              AI tools <span className="font-normal normal-case tracking-normal">· most already live in Marketing Agent</span>
            </p>
            <button type="button" onClick={() => setSheet(false)} className="rounded-lg px-2 py-1 text-[12px] font-semibold text-[#6a6b7b] hover:bg-[#f4f3f6] lg:hidden">
              Done
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {AI_CARDS.map((c) => {
              const off = isEnterprise(s.plan) && s.role === "member" && ADMIN_OFF.includes(c.action);
              const act = c.action;
              const credits = act === "to_video" ? null : costOf(act);
              return (
                <button
                  key={c.title}
                  type="button"
                  disabled={off || !!busy}
                  title={off ? "Disabled by your admin" : undefined}
                  onClick={() => runAi(c)}
                  className="flex w-full items-center gap-2.5 rounded-xl border border-[#ececf1] bg-white px-3 py-2.5 text-left transition hover:border-[#ffcfb3] hover:bg-[#fff7f1] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-[#ececf1] disabled:hover:bg-white"
                >
                  <span className="grid size-[30px] shrink-0 place-items-center rounded-lg bg-[#fff3ec] text-[#ff5e1a]">
                    <c.Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-[13px] font-semibold text-[#1a1a2e]">
                      {c.title}
                      {c.isNew && <span className="rounded bg-[#ff5e1a] px-1.5 py-px text-[10px] font-bold text-white">NEW</span>}
                    </span>
                    <span className="block text-[11.5px] leading-snug text-[#9a9bb0]">{off ? "Disabled by your admin" : c.sub}</span>
                  </span>
                  {off ? <Ban className="size-3.5 text-[#9a9bb0]" /> : credits !== null ? <CreditPill credits={credits} /> : <span className="text-[11px] font-semibold text-[#9a9bb0]">Video Gen</span>}
                </button>
              );
            })}
          </div>

          <p className={`${label} mt-1.5`}>Layers</p>
          <div className="flex flex-col gap-1">
            {[...page.layers].reverse().map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setSel(l.id)}
                className={`flex h-9 w-full items-center gap-2 rounded-lg border px-2.5 text-left text-[13px] transition ${sel === l.id ? "border-[#ff9a3d] bg-[#fff7f1]" : issueIds.has(l.id) ? "border-[#f5b5b5] bg-[#fdecec]" : "border-transparent hover:bg-[#f7f6f9]"}`}
              >
                <span className="w-11 text-[11px] text-[#9a9bb0]">{l.kind === "image" ? "Image" : l.kind === "logo" ? "Logo" : l.kind === "shape" ? "Shape" : "Text"}</span>
                <span className="min-w-0 flex-1 truncate text-[#1a1a2e]">{l.name ?? l.text?.split("\n")[0] ?? l.kind}</span>
                {l.lock && <Lock className="size-3 text-[#9a9bb0]" aria-label="Locked by brand" />}
              </button>
            ))}
            <div className="flex h-9 items-center gap-2 px-2.5 text-[13px] text-[#1a1a2e]">
              <span className="w-11 text-[11px] text-[#9a9bb0]">Fill</span>
              <span className="flex-1">Background</span>
              <span className="size-3.5 rounded ring-1 ring-black/10" style={{ background: page.bg }} />
              {lockOn && design.template && <Lock className="size-3 text-[#9a9bb0]" aria-label="Locked by brand" />}
            </div>
          </div>

          <p className={`${label} mt-1.5 flex items-center gap-1.5`}>
            Brand Check <GateTag feature="brand_check" />
          </p>
          {!can(s.plan, "brand_check") ? (
            <button type="button" onClick={() => s.upgrade({ feature: "brand_check" })} className="rounded-xl bg-[#faf8f6] p-3 text-left text-[12.5px] leading-relaxed text-[#4a4b5c] transition hover:bg-[#f4f3f6]">
              Check fonts, colours and logos against the brand kit before anything ships.
            </button>
          ) : !checking ? (
            <button type="button" onClick={() => setChecking(true)} className={`${ghostBtn} w-full`}>
              <ScanSearch className="size-3.5" /> Run Brand Check
            </button>
          ) : issues.length === 0 ? (
            <p className="flex items-center gap-2 rounded-xl bg-[#e8f7ee] p-3 text-[12.5px] text-[#15803d]">
              <ShieldCheck className="size-4" /> On brand. Nothing to fix.
            </p>
          ) : (
            <div className="space-y-2">
              {issues.map((i) => (
                <button key={i.layerId} type="button" onClick={() => setSel(i.layerId)} className="w-full rounded-xl bg-[#fdecec] p-2.5 text-left text-[12.5px] text-[#b91c1c]">
                  {i.message}
                  {i.fix && <span className="block text-[11.5px] text-[#9a9bb0]">Fix: {i.fix}</span>}
                </button>
              ))}
              {kit && (
                <button type="button" onClick={() => (update((d) => fixIssues(d, kit)), say("Fixed to match the brand kit"))} className={`${ghostBtn} w-full`}>
                  Fix all
                </button>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Panel({
  tool,
  design,
  kit,
  add,
  update,
  setBg,
  selected,
  patch,
  say,
  openBrandKit,
  lockOn,
}: {
  tool: Tool;
  design: Design;
  kit: ReturnType<typeof kitOf>;
  add: (l: Omit<Layer, "id">) => void;
  update: (fn: (d: Design) => Design) => void;
  setBg: (hex: string) => void;
  selected: Layer | null;
  patch: (id: string, p: Partial<Layer>) => void;
  say: (m: string) => void;
  openBrandKit: () => void;
  lockOn: boolean;
}) {
  const s = useStudio();
  const [tag, setTag] = useState<string>("Brand");
  const [prompt, setPrompt] = useState("IG post for our 2027 investment outlook talk, navy and gold, confident, space for headline");
  const [count, setCount] = useState<1 | 4 | 12>(4);
  const primary = color(kit, "primary");
  const accent = color(kit, "accent");
  const bg = color(kit, "background", "#ffffff");

  if (tool === "templates")
    return (
      <>
        <p className={label}>Templates</p>
        <input className={field} placeholder="Search brand templates" aria-label="Search templates" />
        <div className="flex flex-wrap gap-1.5">
          {["Brand", "IG post", "Story", "Imported from Canva"].map((t) => (
            <button key={t} type="button" onClick={() => setTag(t)} className={`h-6 rounded-md px-2 text-[11.5px] font-medium ${tag === t ? "bg-[#fff0e6] text-[#ff5e1a]" : "bg-[#f4f3f6] text-[#4a4b5c]"}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {TEMPLATES.filter((t) => tag === "Brand" || t.tag === tag).map((t) => (
            <button
              key={t.id}
              type="button"
              disabled={!!design.template && lockOn}
              onClick={() => {
                const fresh = designFromTemplate(t, kit);
                update((d) => ({ ...d, format: fresh.format, ratio: fresh.ratio, type: fresh.type, template: lockOn ? fresh.template : undefined, pages: fresh.pages }));
                say(`Applied “${t.name}”`);
              }}
              className="group relative text-left disabled:opacity-40"
            >
              <div className="overflow-hidden rounded-lg ring-1 ring-[#ececf1] transition group-hover:ring-[#ff9a3d]">
                <DesignCanvas page={{ id: t.id, bg, layers: talkPost(kit, { headline: t.headline, img: t.img }) }} ratio={4 / 5} kit={kit} />
              </div>
              {t.locked && lockOn && (
                <span className="absolute left-1.5 top-1.5">
                  <LockBadge />
                </span>
              )}
              <span className="mt-1 block truncate text-[11.5px] font-semibold text-[#1a1a2e]">{t.name}</span>
            </button>
          ))}
        </div>
        {!!design.template && lockOn && <p className="rounded-lg bg-[#f4f3f6] px-2.5 py-2 text-[12px] text-[#4a4b5c]">This design uses a locked brand template. You can change text and photos only.</p>}
        {!lockOn && (
          <p className="flex items-center gap-1.5 text-[11.5px] text-[#9a9bb0]">
            Lock templates for your team <PlanTag plan="e1" />
          </p>
        )}
        <button type="button" onClick={() => say("Import: Canva PDF / PNG → Split to Layers → editable template")} className={ghostBtn}>
          Import from Canva (PDF / PNG)
        </button>
        <p className="text-[12px] leading-relaxed text-[#9a9bb0]">Imports run through Split to Layers so text and objects become editable. Canva-licensed elements are flagged before commercial use.</p>
      </>
    );

  if (tool === "elements") {
    const sym: [string, ReactNode][] = [
      ["↗", <TrendingUp key="t" className="size-6" />],
      ["$", <DollarSign key="d" className="size-6" />],
      ["★", <Star key="s" className="size-6" />],
      ["💬", <MessageSquare key="m" className="size-6" />],
      ["♥", <Heart key="h" className="size-6" />],
    ];
    return (
      <>
        <p className={label}>Elements</p>
        <input className={field} placeholder="Search icons, stickers, shapes" aria-label="Search elements" />
        <p className="text-[12px] text-[#9a9bb0]">Shapes</p>
        <div className="grid grid-cols-4 gap-2">
          {([
            ["Rectangle", "rect", 18, 14],
            ["Circle", "circle", 14, 11.2],
            ["Triangle", "triangle", 16, 13],
            ["Line", "line", 30, 0.8],
          ] as const).map(([n, shape, w, h]) => (
            <button key={n} type="button" aria-label={n} onClick={() => add({ kind: "shape", shape, name: n, x: 60, y: 14, w, h, fill: accent })} className={`${card} grid aspect-square place-items-center transition hover:border-[#ff9a3d]`}>
              <span
                className={`bg-[#c9cad4] ${shape === "circle" ? "rounded-full" : shape === "rect" ? "rounded-[3px]" : ""}`}
                style={{ width: shape === "line" ? 30 : 28, height: shape === "line" ? 3 : 28, clipPath: shape === "triangle" ? "polygon(50% 0, 100% 100%, 0 100%)" : undefined }}
              />
            </button>
          ))}
        </div>
        <p className="text-[12px] text-[#9a9bb0]">Brand graphics</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            [`${kit?.initials ?? "BR"} badge`, primary, accent],
            ["Arrow tag", accent, primary],
            ["Frame", bg, primary],
          ].map(([n, b, f]) => (
            <button
              key={n}
              type="button"
              onClick={() => add({ kind: "text", name: n, x: 62, y: 14, w: 30, h: 7, text: n === "Arrow tag" ? "NEW →" : n, size: 2.8, weight: 800, color: f, fill: b, align: "center" })}
              className="grid aspect-square place-items-center rounded-lg text-[10px] font-bold ring-1 ring-black/5 transition hover:ring-[#ff9a3d]"
              style={{ background: b, color: f }}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="text-[12px] text-[#9a9bb0]">Icons</p>
        <div className="grid grid-cols-5 gap-2 text-[#6a6b7b]">
          {sym.map(([ch, ic]) => (
            <button key={ch} type="button" onClick={() => add({ kind: "text", name: "Icon", x: 78, y: 14, w: 12, h: 9, text: ch, size: 7, weight: 700, color: primary, align: "center" })} className="grid h-10 place-items-center rounded-lg hover:bg-[#f4f3f6] hover:text-[#ff5e1a]">
              {ic}
            </button>
          ))}
        </div>
        <p className="text-[11.5px] leading-relaxed text-[#9a9bb0]">Every element here is cleared for commercial use; its licence is saved with the design.</p>
      </>
    );
  }

  if (tool === "text")
    return (
      <>
        <p className={label}>Text</p>
        {(
          [
            ["Add a heading", 6.7, 900, "h-[52px] text-[20px] font-bold"],
            ["Add a subheading", 4, 700, "h-11 text-[15px] font-semibold"],
            ["Add body text", 2.8, 500, "h-9 text-[13px]"],
          ] as const
        ).map(([t, size, weight, cls]) => (
          <button key={t} type="button" onClick={() => add({ kind: "text", name: t.replace("Add a ", "").replace("Add ", ""), x: 8, y: 40, w: 84, h: size * 1.6, text: t, size, weight, color: color(kit, "text") })} className={`${ghostBtn} justify-start ${cls}`}>
            {t}
          </button>
        ))}
        <p className={`${label} mt-2`}>Brand text styles</p>
        <button type="button" onClick={() => selected?.kind === "text" && patch(selected.id, { size: 6.7, weight: 900 })} className={`${card} p-3 text-left`}>
          <span className="block text-[18px] font-black text-[#1a1a2e]">標題 Heading</span>
          <span className="text-[12px] text-[#9a9bb0]">{fontOf(kit, "heading")?.spec ?? "Noto Sans TC Black · 64 / 72"}</span>
        </button>
        <button type="button" onClick={() => selected?.kind === "text" && patch(selected.id, { size: 2.8, weight: 500 })} className={`${card} p-3 text-left`}>
          <span className="block font-medium text-[#1a1a2e]">Body copy</span>
          <span className="text-[12px] text-[#9a9bb0]">{fontOf(kit, "body")?.spec ?? "Inter Medium · 28 / 40"}</span>
        </button>
        <button type="button" onClick={() => s.charge(costOf("magic_write")) && say("Magic Write (Ad Copy / Captions tool): 3 caption options ready")} className={`${ghostBtn} justify-between`}>
          Magic Write: draft caption <CreditPill credits={costOf("magic_write")} />
        </button>
        {!can(s.plan, "brand_voice") && (
          <p className="flex items-center gap-1.5 text-[11.5px] text-[#9a9bb0]">
            Write in your brand voice <PlanTag plan="starter" />
          </p>
        )}
      </>
    );

  if (tool === "uploads")
    return (
      <>
        <p className={label}>Uploads &amp; generations</p>
        <button type="button" onClick={() => say("Choose files to upload")} className="inline-flex h-9 items-center justify-center rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] text-[13px] font-bold text-white">
          Upload files
        </button>
        <p className="text-[12px] text-[#9a9bb0]">From your BuzzVideo Assets (My / Team)</p>
        <div className="grid grid-cols-2 gap-2.5">
          {ASSETS.map((a) => (
            <button key={a.id} type="button" onClick={() => add({ kind: "image", name: a.label.startsWith("Upload") ? "Upload" : "AI image", x: 20, y: 18, w: 60, h: 46, src: a.src, ai: a.ai, radius: 2 })} className="relative aspect-[4/5] overflow-hidden rounded-lg ring-1 ring-[#ececf1] hover:ring-[#ff9a3d]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.src} alt="" className="size-full object-cover" />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2 pb-1.5 pt-4 text-left text-[10.5px] text-white">{a.label}</span>
            </button>
          ))}
        </div>
      </>
    );

  if (tool === "brand") {
    const others = s.kits.filter((k) => k.id !== kit?.id);
    return (
      <>
        <p className={label}>{kit?.name ?? "No brand"} kit</p>
        <p className="text-[12px] text-[#9a9bb0]">Logos</p>
        <div className="grid grid-cols-2 gap-2">
          {[bg, primary].map((b, i) => (
            <button key={b} type="button" onClick={() => add({ kind: "logo", name: "Wordmark", x: 5, y: 4, w: 55, h: 5 })} className="grid h-14 place-items-center rounded-lg text-[12px] font-bold ring-1 ring-black/5 transition hover:ring-[#ff9a3d]" style={{ background: b, color: i ? bg : primary }}>
              {kit?.word ?? "[LOGO]"}
            </button>
          ))}
        </div>
        <p className="text-[12px] text-[#9a9bb0]">Colours</p>
        <div className="flex gap-2">
          {(kit?.colors ?? []).map((c) => (
            <button
              key={c.hex}
              type="button"
              title={`${c.name} ${c.hex}`}
              onClick={() => (selected && selected.kind !== "image" && selected.kind !== "logo" ? patch(selected.id, selected.fill ? { fill: c.hex } : { color: c.hex }) : setBg(c.hex))}
              className="size-10 rounded-lg ring-1 ring-black/10 transition hover:scale-105"
              style={{ background: c.hex }}
            />
          ))}
        </div>
        <p className="text-[11px] text-[#9a9bb0]">Applies to the selected text or shape, otherwise the background.</p>
        <p className="text-[12px] text-[#9a9bb0]">Fonts</p>
        <div className={`${card} px-3 py-2.5 text-[13px] text-[#1a1a2e]`}>
          Heading · {fontOf(kit, "heading")?.family ?? "—"}
          <br />
          <span className="text-[#9a9bb0]">Body · {fontOf(kit, "body")?.family ?? "—"}</span>
        </div>
        <button type="button" onClick={openBrandKit} className="text-left text-[13px] font-semibold text-[#ff5e1a] hover:underline">
          Open Brand Kit
        </button>
        {others.length > 0 && (
          <>
            <p className="mt-2 text-[12px] text-[#9a9bb0]">Other brand kits</p>
            {others.map((o) => (
              <button key={o.id} type="button" onClick={() => add({ kind: "logo", name: `${o.name} wordmark`, x: 5, y: 92, w: 55, h: 5, foreignBrand: o.name })} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12px] text-[#4a4b5c] hover:bg-[#f4f3f6]">
                <span className="size-3 rounded-full" style={{ background: color(o, "accent"), boxShadow: `0 0 0 2px ${color(o, "primary")}` }} />
                Add {o.name} logo
              </button>
            ))}
          </>
        )}
      </>
    );
  }

  /* AI:Generate on brand */
  const credits = costOf("generate_on_brand", count);
  return (
    <>
      <label className={label} htmlFor="ds-aiprompt">
        Generate on brand
      </label>
      <textarea id="ds-aiprompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} className="h-24 resize-none rounded-lg border border-[#e1e3e9] bg-white px-3 py-2.5 text-[13px] leading-relaxed outline-none focus:border-[#ff5e1a]" />
      <div className="flex flex-wrap gap-1.5">
        <span className="inline-flex h-6 items-center rounded-md bg-[#fff0e6] px-2 text-[11.5px] font-medium text-[#ff5e1a]">Use brand kit</span>
        <span className="inline-flex h-6 items-center rounded-md bg-[#f4f3f6] px-2 text-[11.5px] font-medium text-[#4a4b5c]">{FORMATS.find((f) => f.key === design.format)?.label.split(" ").pop() ?? "4:5"}</span>
        {([1, 4] as const).map((n) => (
          <button key={n} type="button" onClick={() => setCount(n)} className={`h-6 rounded-md px-2 text-[11.5px] font-medium ${count === n ? "bg-[#1a1a2e] text-white" : "bg-[#f4f3f6] text-[#4a4b5c]"}`}>
            x{n} variants
          </button>
        ))}
        <button type="button" onClick={() => s.gate("bulk_variants") && setCount(12)} className={`inline-flex h-6 items-center gap-1 rounded-md px-2 text-[11.5px] font-medium ${count === 12 ? "bg-[#1a1a2e] text-white" : "bg-[#f4f3f6] text-[#4a4b5c]"}`}>
          By selling point ×12 {!can(s.plan, "bulk_variants") && <PlanTag plan={requiredPlan("bulk_variants")} />}
        </button>
      </div>
      <button
        type="button"
        disabled={!prompt.trim()}
        onClick={() =>
          s.confirmCredits({
            title: `Generate ${count} on-brand design${count > 1 ? "s" : ""}`,
            credits,
            detail: kit ? `Logo, colours and fonts from ${kit.name} are applied to every result.` : "No brand selected — results use neutral styles.",
            onConfirm: () => {
              const imgs = [IMG.speaker, IMG.model, IMG.promo, IMG.review];
              const heads = count === 12 && kit ? kit.sellingPoints : ["2027 投資展望\n三個必看板塊"];
              const out: Design[] = Array.from({ length: count }, (_, i) => ({
                ...design,
                id: uid("ds"),
                name: `${kit?.name ?? "Design"} · variant ${i + 1}`,
                version: 1,
                approval: { status: "draft" },
                template: undefined,
                edited: "Just now",
                pages: [{ id: uid("p"), bg: i % 2 ? color(kit, "secondary", "#ffffff") : bg, layers: talkPost(kit, { headline: heads[i % heads.length], img: imgs[i % imgs.length] }) }],
              }));
              s.add(out, true);
              say(`${count} on-brand variants ready · ${credits} credits`);
            },
          })
        }
        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] text-[13px] font-bold text-white disabled:opacity-40"
      >
        Generate · {credits} credits
      </button>
      <p className="text-[12px] leading-relaxed text-[#9a9bb0]">Results open as editable designs: logo, colours and fonts from the kit applied automatically.</p>
      {kit && (
        <p className="text-[12px] leading-relaxed text-[#9a9bb0]">
          Voice: {can(s.plan, "brand_voice") ? kit.voice.tone : "upgrade to Starter to use brand voice"}
        </p>
      )}
    </>
  );
}

