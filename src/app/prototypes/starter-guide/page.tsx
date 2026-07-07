"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import {
  ArrowUp,
  Plus,
  Sparkles,
  Command,
  MessageCircle,
  GitBranch,
  Frame,
  ChevronDown,
  SlidersHorizontal,
  History,
  HelpCircle,
  Menu,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Play,
  Clock,
  Image as ImageIcon,
  Video,
  Film,
  Search,
  Pencil,
  Pin,
  Eye,
} from "lucide-react";
import { PresetUseCases, type Mission } from "@/components/missions";

// ── design.md brand tokens (product shell) ────────────────────────
const gradText =
  "bg-gradient-to-r from-[#ffc078] to-[#ff5e1a] bg-clip-text text-transparent";
const ctaGrad = "bg-gradient-to-r from-[#FFA73C] to-[#FF5255]";

const ORANGE = "#ff5e1a";
const INK = "#1a1a2e";
const LOGO = "/prototypes/starter-guide/logo.png";

// Apple system font stack (project standard going forward, see design.md)
const APPLE_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif';

const SIDE_NAV = [
  { key: "agent", label: "Agent", Icon: Command },
  { key: "chat", label: "Chat", Icon: MessageCircle },
  { key: "workflows", label: "Workflows", Icon: GitBranch },
  { key: "canvas", label: "Canvas", Icon: Frame },
];

type Section = "agent" | "chat" | "workflows" | "canvas";

// which product surface each step opens (composer steps stay on Agent)
const TARGET_VIEW: Record<string, Section> = {
  "agent-picker": "agent",
  "mode-picker": "agent",
  "use-cases": "agent",
  chat: "chat",
  workflows: "workflows",
  canvas: "canvas",
};

const CAMPAIGN_TEMPLATES = [
  "Perfume Commercial",
  "Meal Prep Video Ad",
  "IG Ergonomic Pillow Campaign",
  "UGC style video",
  "Power Bank Campaign",
  "High-End Beauty Device Campaign",
];

// 首页分类分区(tab 胶囊 + 各自一行模板),点 tab 平滑定位到对应 section
const CAMPAIGN_SECTIONS = ["What's New", "Content Creation"];
const catSlug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-");

function CampaignSections() {
  const [active, setActive] = useState<string | null>(null);
  const go = (title: string) => {
    setActive(title);
    document
      .getElementById(catSlug(title))
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <section className="mx-auto mb-16 mt-12 max-w-[1100px]">
      {/* 分类 tab 胶囊 */}
      <div className="mb-5 flex flex-wrap gap-2">
        {CAMPAIGN_SECTIONS.map((title) => {
          const on = active === title;
          return (
            <button
              key={title}
              onClick={() => go(title)}
              className={
                "rounded-full border bg-white px-4 py-1.5 text-[13px] font-semibold transition " +
                (on
                  ? "border-[#ff5e1a] text-[#ff5e1a]"
                  : "border-[#ececf1] text-[#6a6b7b] hover:border-[#d4d3df] hover:text-[#1a1a2e]")
              }
            >
              {title}
            </button>
          );
        })}
      </div>

      {CAMPAIGN_SECTIONS.map((title) => (
        <div key={title} id={catSlug(title)} className="mb-8 scroll-mt-24 last:mb-0">
          <h3 className="mb-3 text-sm font-bold text-[#1a1a2e]">{title}</h3>
          <div className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {CAMPAIGN_TEMPLATES.map((it) => (
              <div key={it} className="w-[170px] shrink-0">
                <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-[#f1f0f4] to-[#e7e6ec]" />
                <p className="mt-2 truncate text-xs font-medium text-[#6a6b7b]">
                  {it}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

type Step = { target: string; title: string; body: string };

const STEPS: Step[] = [
  {
    target: "agent-picker",
    title: "Choose creative mode",
    body: "Pick how you create: Marketing Agent for full campaigns, Image Gen and Video Gen for direct creation.",
  },
  {
    target: "mode-picker",
    title: "Select AI model and format",
    body: "Select AI model, set format and resolution for creating image and video.",
  },
  {
    target: "use-cases",
    title: "Start from a use case",
    body: "Not sure where to begin? Tap a use case to drop in a ready-made prompt.",
  },
  {
    target: "chat",
    title: "Your chat history",
    body: "Every conversation is saved here. Search it, pin the important ones, or rename to stay organized.",
  },
  {
    target: "workflows",
    title: "Start from a workflow",
    body: "Choose a saved workflow to kick off a repeatable piece of work in a single click.",
  },
  {
    target: "canvas",
    title: "Compose on the canvas",
    body: "Drag images and video onto an open board. Best for freeform, hands-on builds.",
  },
];

const DONE = STEPS.length;

// Editorial placeholder imagery for the Campaign variant. Grayscale so
// mismatched stock reads as one cohesive set; an orange duotone overlay
// makes them on-brand. Swap the seeds for real Buzz campaign shots.
// TODO: replace picsum seeds with brand photography in public/prototypes/starter-guide/
const CAMP_COVER = "https://picsum.photos/seed/buzz-campaign-studio/900/1200?grayscale";

type Variant = "campaign" | "checklist" | "annotated" | "spotlight";
const VARIANTS: { key: Variant; label: string }[] = [
  { key: "campaign", label: "D · 大片感" },
  { key: "checklist", label: "A · 清单式" },
  { key: "annotated", label: "B · 手绘批注" },
  { key: "spotlight", label: "C · 柔光聚焦" },
];

type Rect = { top: number; left: number; width: number; height: number };
type Side = "right" | "left" | "below" | "above";
type Layout = {
  panel: { left: number; top: number };
  conn: { x1: number; y1: number; x2: number; y2: number };
  side: Side;
};

const PANEL_W = 336;
const PANEL_H = 176;

function visibleTarget(key: string): HTMLElement | null {
  const nodes = Array.from(
    document.querySelectorAll<HTMLElement>(`[data-tour="${key}"]`),
  );
  return nodes.find((n) => n.getClientRects().length > 0) ?? null;
}
function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function computeLayout(
  rect: Rect,
  vw: number,
  vh: number,
  forceSide = false,
): Layout {
  const mobile = vw < 1024;
  const GAP = 60;
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  if (mobile) {
    const below = cy < vh / 2;
    const left = clamp(cx - PANEL_W / 2, 12, vw - PANEL_W - 12);
    const top = below ? rect.top + rect.height + GAP : rect.top - GAP - PANEL_H;
    const x = clamp(cx, left + 24, left + PANEL_W - 24);
    return {
      panel: { left, top },
      side: below ? "below" : "above",
      conn: below
        ? { x1: x, y1: top - 2, x2: cx, y2: rect.top + rect.height + 6 }
        : { x1: x, y1: top + PANEL_H + 2, x2: cx, y2: rect.top - 6 },
    };
  }

  const spaceRight = vw - (rect.left + rect.width);
  const onLeftRail = rect.left < 180;
  const upper = rect.top < vh * 0.42;

  if ((onLeftRail || forceSide) && spaceRight >= PANEL_W + GAP) {
    const left = rect.left + rect.width + GAP;
    const top = clamp(cy - PANEL_H / 2, 16, vh - PANEL_H - 16);
    const y = clamp(cy, top + 24, top + PANEL_H - 24);
    return {
      panel: { left, top },
      side: "right",
      conn: { x1: left - 2, y1: y, x2: rect.left + rect.width + 6, y2: cy },
    };
  }
  if (upper && rect.top + rect.height + GAP + PANEL_H < vh) {
    const left = clamp(cx - PANEL_W / 2, 16, vw - PANEL_W - 16);
    const top = rect.top + rect.height + GAP;
    const x = clamp(cx, left + 24, left + PANEL_W - 24);
    return {
      panel: { left, top },
      side: "below",
      conn: { x1: x, y1: top - 2, x2: cx, y2: rect.top + rect.height + 6 },
    };
  }
  if (spaceRight >= PANEL_W + GAP) {
    const left = rect.left + rect.width + GAP;
    const top = clamp(cy - PANEL_H / 2, 16, vh - PANEL_H - 16);
    const y = clamp(cy, top + 24, top + PANEL_H - 24);
    return {
      panel: { left, top },
      side: "right",
      conn: { x1: left - 2, y1: y, x2: rect.left + rect.width + 6, y2: cy },
    };
  }
  const left = clamp(rect.left - GAP - PANEL_W, 16, vw - PANEL_W - 16);
  const top = clamp(cy - PANEL_H / 2, 16, vh - PANEL_H - 16);
  const y = clamp(cy, top + 24, top + PANEL_H - 24);
  return {
    panel: { left, top },
    side: "left",
    conn: { x1: left + PANEL_W + 2, y1: y, x2: rect.left - 6, y2: cy },
  };
}

export default function StarterGuide() {
  const [draft, setDraft] = useState("");
  const [mobileNav, setMobileNav] = useState(false);

  const [variant, setVariant] = useState<Variant>("checklist");
  const [open, setOpen] = useState(true);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [view, setView] = useState<Section>("agent");
  // A (checklist) has an in-place welcome; the tour hasn't really started
  // until "Start" is clicked. Gate step chrome (dropdown) on this.
  const [checklistStarted, setChecklistStarted] = useState(false);
  const [showSub, setShowSub] = useState(false); // subscription modal (A)

  const onStep = open && step >= 0 && step < STEPS.length;
  const preWelcome = variant === "checklist" && !checklistStarted;

  // auto-open the surface the current step points at
  useEffect(() => {
    if (onStep) setView(TARGET_VIEW[STEPS[step].target] ?? "agent");
  }, [onStep, step]);

  // sidebar-only steps (nav items live in the drawer on mobile) → pop the
  // drawer so the highlight ring has a visible target on small screens.
  // On desktop the drawer is `lg:hidden`, so this is a visual no-op there.
  useEffect(() => {
    const sidebarStep =
      onStep && ["chat", "workflows", "canvas"].includes(STEPS[step].target);
    setMobileNav(sidebarStep);
  }, [onStep, step]);

  // is a composer dropdown open for this step?
  const openMenu =
    onStep && STEPS[step].target === "agent-picker"
      ? "agent"
      : onStep && STEPS[step].target === "mode-picker"
        ? "mode"
        : null;

  const measure = useCallback(() => {
    if (!onStep) return;
    const el = visibleTarget(STEPS[step].target);
    if (!el) return setRect(null);
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [onStep, step]);

  useLayoutEffect(() => {
    if (!onStep) return;
    const el = visibleTarget(STEPS[step].target);
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
    const id = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(id);
  }, [onStep, step, variant, measure, mobileNav]);

  useEffect(() => {
    if (!onStep) return;
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [onStep, measure]);

  const pick = (m: Mission) => setDraft(m.prompt);

  const go = (s: number) => setStep(clamp(s, 0, DONE));
  const back = () => go(step - 1);
  const close = () => setOpen(false);
  const restart = () => {
    setStep(0);
    setChecklistStarted(false);
    setShowSub(false);
    setOpen(true);
  };
  // A ends by opening the subscription modal (no "done" card); others reach DONE
  const atLast = step === STEPS.length - 1;
  const advance = () => {
    if (variant === "checklist" && atLast) setShowSub(true);
    else go(step + 1);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") advance();
      else if (e.key === "ArrowLeft") back();
      else if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, step, variant]);

  const navItem = (item: (typeof SIDE_NAV)[number], mobile = false) => {
    const active = item.key === view;
    if (mobile) {
      return (
        <button
          key={item.key}
          data-tour={item.key}
          onClick={() => {
            setView(item.key as Section);
            setMobileNav(false);
          }}
          className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-semibold transition ${
            active ? "text-[#ff5e1a]" : "text-[#6a6b7b]"
          }`}
        >
          <item.Icon className="size-[19px]" />
          {item.label}
        </button>
      );
    }
    return (
      <button
        key={item.key}
        data-tour={item.key}
        onClick={() => setView(item.key as Section)}
        className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition ${
          active
            ? "bg-[#fff3ec] text-[#ff5e1a]"
            : "text-[#6a6b7b] hover:bg-[#fff7f1] hover:text-[#ff5e1a]"
        }`}
      >
        <item.Icon className="size-[18px]" />
        {item.label}
      </button>
    );
  };

  const tourProps = {
    step,
    rect,
    onNext: advance,
    onBack: back,
    onClose: close,
    onGo: go,
  };

  return (
    <div
      className="min-h-screen bg-white text-[#1a1a2e]"
      style={{ fontFamily: APPLE_FONT }}
    >
      <div className="flex">
        <aside className="hidden w-[160px] shrink-0 flex-col gap-1 border-r border-[#ececf1] bg-white px-3 py-4 lg:flex">
          <div className="mb-3 flex items-center gap-2 px-2">
            <img src={LOGO} alt="" className="size-8 object-contain" />
            <span className="font-extrabold tracking-tight">
              Buzz
            </span>
          </div>
          {SIDE_NAV.map((it) => navItem(it))}
        </aside>

        <main className="min-w-0 flex-1">
          <header className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <button
              onClick={() => setMobileNav(true)}
              className="grid size-9 place-items-center rounded-lg border border-[#ececf1] text-[#6a6b7b] lg:hidden"
              aria-label="Menu"
            >
              <Menu className="size-5" />
            </button>
            <div className="ml-auto flex items-center gap-2.5">
              <span className="hidden items-center gap-1.5 rounded-full bg-[#fff3ec] px-3 py-1.5 text-xs font-bold text-[#ff5e1a] sm:flex">
                63,016 credits
              </span>
              <button
                className={`rounded-full ${ctaGrad} px-4 py-1.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(255,82,85,0.28)]`}
              >
                Upgrade
              </button>
              <HelpCircle className="hidden size-5 text-[#9a9bb0] sm:block" />
              <span className="grid size-8 place-items-center rounded-full bg-[#1a1a2e] text-xs font-bold text-white">
                S
              </span>
            </div>
          </header>

          {view === "agent" && (
          <div className="px-4 sm:px-6">
            <h1 className="mt-8 text-center text-[clamp(26px,4vw,40px)] font-extrabold leading-[1.12] tracking-tight sm:mt-10">
              <span className={gradText}>Marketing Agent</span>: Your ideas,
              <br className="hidden sm:block" /> campaign-ready in seconds
            </h1>

            <div className="mx-auto mt-7 w-[768px] max-w-full">
              <div className="flex min-h-[168px] flex-col rounded-[22px] border border-[#ececf1] bg-white p-3.5 shadow-[0_4px_16px_rgba(26,26,46,0.06)] transition focus-within:border-[#ff5e1a] focus-within:ring-2 focus-within:ring-[#ff5e1a]/20">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Describe your idea or campaign, or paste a product / landing page / IG post URL. Use @ to reference uploaded files."
                  className="w-full flex-1 resize-none bg-transparent px-2 pt-1 text-[15px] leading-relaxed text-[#1a1a2e] outline-none placeholder:text-[#9a9bb0]"
                />
                <div className="flex items-center justify-between gap-2 px-1 pt-2">
                  <div className="flex items-center gap-2 text-[#6a6b7b]">
                    <span className="grid size-8 place-items-center rounded-lg border border-[#ececf1]">
                      <Plus className="size-4" />
                    </span>
                    <span
                      data-tour="agent-picker"
                      className="flex items-center gap-1.5 rounded-lg border border-[#ececf1] px-2.5 py-1.5 text-xs font-semibold"
                    >
                      <Sparkles className="size-3.5 text-[#ff5e1a]" /> Marketing
                      Agent
                      <ChevronDown className="size-3.5" />
                    </span>
                    <span
                      data-tour="mode-picker"
                      className="flex items-center gap-1.5 rounded-lg border border-[#ececf1] px-2.5 py-1.5 text-xs font-semibold"
                    >
                      <SlidersHorizontal className="size-3.5" /> Auto
                    </span>
                    <History className="hidden size-4 text-[#9a9bb0] sm:block" />
                  </div>
                  <button
                    className={`grid size-9 place-items-center rounded-xl ${ctaGrad} text-white shadow-[0_8px_20px_rgba(255,82,85,0.3)] transition hover:brightness-105`}
                  >
                    <ArrowUp className="size-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* real product use-case component (category pills → cards) */}
            <div className="mx-auto mt-6 max-w-[1100px]">
              <PresetUseCases
                onPick={pick}
                activeCategory={
                  onStep && STEPS[step].target === "use-cases"
                    ? "Marketing Video"
                    : null
                }
              />
            </div>

            <CampaignSections />
          </div>
          )}

          {view === "chat" && <ChatView />}
          {view === "workflows" && <WorkflowsView />}
          {view === "canvas" && <CanvasView />}
        </main>
      </div>

      {mobileNav && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setMobileNav(false)}
        >
          <div className="absolute inset-0 bg-[#0f0f19]/40" />
          <div
            className="absolute inset-y-0 left-0 w-[220px] bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-2 px-1">
              <img src={LOGO} alt="" className="size-8 object-contain" />
              <span className="font-extrabold tracking-tight">
                Buzz
              </span>
            </div>
            <div className="flex flex-col gap-1">
              {SIDE_NAV.map((it) => navItem(it))}
            </div>
          </div>
        </div>
      )}

      {/* composer dropdown opened by the tour (sits above the veil) */}
      {open && openMenu && rect && !preWelcome && (
        <ComposerMenu kind={openMenu} rect={rect} />
      )}

      {/* subscription modal — A ends here instead of a "done" card */}
      {showSub && (
        <SubscribeModal
          onClose={() => {
            setShowSub(false);
            close();
          }}
        />
      )}

      {/* ── ONBOARDING (selectable directions) ───────────────────── */}
      {/* A (checklist) has no done card; it ends via the subscription modal */}
      {open &&
        step === DONE &&
        variant !== "checklist" &&
        (variant === "campaign" ? (
          <CampaignDone onClose={close} />
        ) : (
          <DoneCard onClose={close} />
        ))}
      {open &&
        !showSub &&
        step !== DONE &&
        (variant === "campaign" ? (
          <CampaignTour {...tourProps} />
        ) : variant === "checklist" ? (
          <ChecklistTour
            {...tourProps}
            started={checklistStarted}
            onStart={() => setChecklistStarted(true)}
          />
        ) : variant === "annotated" ? (
          <AnnotatedTour {...tourProps} />
        ) : (
          <SpotlightTour {...tourProps} />
        ))}

      {/* demo-only 风格切换器(非产品 UI) */}
      <div className="fixed left-1/2 top-3 z-[90] flex -translate-x-1/2 items-center gap-1 rounded-full border border-[#e7e6ec] bg-white/90 p-1 shadow-[0_8px_24px_rgba(26,26,46,0.1)] backdrop-blur">
        {VARIANTS.map((v) => (
          <button
            key={v.key}
            onClick={() => {
              setVariant(v.key);
              if (!open) restart();
            }}
            className={`rounded-full px-3 py-1.5 text-[12px] font-bold transition ${
              variant === v.key
                ? "bg-[#1a1a2e] text-white"
                : "text-[#6a6b7b] hover:text-[#1a1a2e]"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {!open && (
        <button
          onClick={restart}
          className="fixed bottom-20 right-4 z-30 flex items-center gap-2 rounded-full border border-[#e7e6ec] bg-white/90 px-4 py-2.5 text-sm font-semibold text-[#1a1a2e] shadow-[0_10px_30px_rgba(26,26,46,0.1)] backdrop-blur transition hover:-translate-y-0.5 lg:bottom-6"
        >
          <span className="size-1.5 rounded-full" style={{ background: ORANGE }} />
          再看一遍引导
        </button>
      )}
    </div>
  );
}

type TourProps = {
  step: number;
  rect: Rect | null;
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
  onGo: (s: number) => void;
};

// ══════════════════════════════════════════════════════════════════
// A · GUIDE COMPANION — no scrim. A docked guide that greets you, then
//     walks the 6 stops as an editorial timeline rail. Quiet, crafted.
// ══════════════════════════════════════════════════════════════════
function ChecklistTour({
  step,
  rect,
  onNext,
  onBack,
  onClose,
  onGo,
  started,
  onStart,
}: TourProps & { started: boolean; onStart: () => void }) {
  const shell =
    // mobile: docked bottom-sheet flush to the bottom edge; desktop: floating card bottom-right
    "fixed inset-x-0 bottom-0 z-[62] w-full overflow-hidden rounded-t-[22px] border border-b-0 border-[#eceaf0] bg-white shadow-[0_-12px_40px_rgba(26,26,46,0.16)] motion-safe:animate-in motion-safe:slide-in-from-bottom-4 " +
    "lg:inset-x-auto lg:right-4 lg:bottom-6 lg:w-[336px] lg:max-w-[calc(100vw-24px)] lg:rounded-[20px] lg:border-b lg:shadow-[0_24px_60px_rgba(26,26,46,0.18)]";

  const header = (
    <div className="flex items-center justify-between px-5 pt-4">
      <div className="flex items-center gap-2">
        <img src={LOGO} alt="" className="size-6 object-contain" />
        <span className="text-[14px] font-extrabold tracking-tight text-[#1a1a2e]">
          BuzzVideo
        </span>
      </div>
      <button
        onClick={onClose}
        className="grid size-7 place-items-center rounded-lg text-[#9a9bb0] transition hover:bg-[#f7f6f9] hover:text-[#6a6b7b]"
        aria-label="Close"
      >
        <X className="size-4" />
      </button>
    </div>
  );

  // WELCOME state (was missing) — greet + preview the 6 stops, in-place
  if (!started) {
    return (
      <div className={shell}>
        {/* oversized logo mark as a background watermark (echoes the step numeral) */}
        <img
          src={LOGO}
          aria-hidden
          alt=""
          className="pointer-events-none absolute -right-6 -top-6 z-0 size-[128px] rotate-12 opacity-[0.08]"
        />

        <div className="relative z-[1]">{header}</div>
        <div className="relative z-[1] px-5 pb-5 pt-3">
          <h2 className="text-[18px] font-extrabold leading-tight tracking-tight text-[#1a1a2e]">
            Welcome Monica. Let&apos;s find your way around.
          </h2>
          <p className="mt-2 text-[13.5px] leading-relaxed text-[#6a6b7b]">
            Six quick stops so you know where everything lives before your first
            campaign.
          </p>

          <ol className="mt-4 space-y-2.5">
            {STEPS.map((s, i) => (
              <li key={s.target} className="flex items-center gap-3">
                <span className="w-4 shrink-0 text-right text-[13px] font-extrabold text-[#d9d7e0]">
                  {i + 1}
                </span>
                <span className="text-[13px] font-semibold text-[#4a4a5e]">
                  {s.title}
                </span>
              </li>
            ))}
          </ol>

          <button
            onClick={onStart}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition hover:brightness-105 active:scale-[0.98]"
            style={{ background: ORANGE }}
          >
            Start <ArrowRight className="size-4" />
          </button>
          <button
            onClick={onClose}
            className="mt-2 w-full text-center text-[13px] font-semibold text-[#9a9bb0] transition hover:text-[#6a6b7b]"
          >
            Skip for now
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* subtle ring on the live element (A's signature: no dimming) */}
      {rect && (
        <div
          className="pointer-events-none fixed z-[55] rounded-[10px] transition-all duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            boxShadow: `0 0 0 2px ${ORANGE}, 0 0 0 6px rgba(255,94,26,0.12)`,
          }}
        />
      )}

      <div className={shell}>
        {/* oversized step numeral as a background watermark */}
        <span
          aria-hidden
          className="pointer-events-none absolute -top-5 right-1 z-0 text-[104px] font-extrabold leading-none"
          style={{ color: ORANGE, opacity: 0.08 }}
        >
          {String(step + 1).padStart(2, "0")}
        </span>

        <div className="relative z-[1]">{header}</div>

        {/* editorial timeline rail */}
        <div className="relative z-[1] px-5 pb-4 pt-5">
          <span className="pointer-events-none absolute bottom-6 left-[26px] top-6 w-px bg-[#eceaf0]" />
          {STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <button
                key={s.target}
                onClick={() => onGo(i)}
                className="relative flex w-full items-start gap-3 py-1.5 text-left"
              >
                <span
                  className="relative z-[1] mt-0.5 grid size-3.5 shrink-0 place-items-center rounded-full bg-white transition"
                  style={
                    done
                      ? { boxShadow: `inset 0 0 0 7px ${ORANGE}` }
                      : active
                        ? { boxShadow: `0 0 0 2px ${ORANGE}` }
                        : { boxShadow: "inset 0 0 0 1.5px #d9d7e0" }
                  }
                >
                  {done && <Check className="size-2.5 text-white" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={`block leading-snug transition ${
                      active
                        ? "text-[15px] font-extrabold text-[#1a1a2e]"
                        : done
                          ? "text-[13px] font-semibold text-[#a7a6b3]"
                          : "text-[13px] font-semibold text-[#6a6b7b]"
                    }`}
                  >
                    {s.title}
                  </span>
                  {active && (
                    <span className="mt-1.5 block text-[13px] leading-relaxed text-[#6a6b7b]">
                      {s.body}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative z-[1] flex items-center justify-between gap-2 px-4 py-3">
          <button
            onClick={onBack}
            disabled={step === 0}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[13px] font-bold text-[#6a6b7b] transition hover:text-[#1a1a2e] disabled:opacity-35"
          >
            <ArrowLeft className="size-4" /> Back
          </button>
          <button
            onClick={onNext}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-bold text-white transition active:scale-[0.98]"
            style={{ background: ORANGE }}
          >
            {step === STEPS.length - 1 ? "Start creating" : "Next"}
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════
// B · ANNOTATED — warm paper wash, big numeral, drawn ink connector
// ══════════════════════════════════════════════════════════════════
function AnnotatedTour({ step, rect, onNext, onBack, onClose }: TourProps) {
  const [vw, setVw] = useState(1280);
  const [vh, setVh] = useState(800);
  useEffect(() => {
    const r = () => {
      setVw(window.innerWidth);
      setVh(window.innerHeight);
    };
    r();
    window.addEventListener("resize", r);
    return () => window.removeEventListener("resize", r);
  }, []);

  const data = STEPS[step];
  const layout = rect ? computeLayout(rect, vw, vh) : null;
  const hole = rect
    ? {
        top: rect.top - 7,
        left: rect.left - 7,
        width: rect.width + 14,
        height: rect.height + 14,
      }
    : null;

  return (
    <>
      <div className="fixed inset-0 z-[59]" onClick={onClose} />

      {hole && (
        <div
          className="pointer-events-none fixed z-[60] rounded-[12px] transition-all duration-[450ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
            top: hole.top,
            left: hole.left,
            width: hole.width,
            height: hole.height,
            boxShadow: `0 0 0 2px ${INK}, 0 0 0 9999px rgba(249,243,234,0.9)`,
          }}
        />
      )}

      {layout && (
        <svg className="pointer-events-none fixed inset-0 z-[61] h-full w-full">
          <line
            x1={layout.conn.x1}
            y1={layout.conn.y1}
            x2={layout.conn.x2}
            y2={layout.conn.y2}
            stroke={INK}
            strokeWidth={1.5}
            strokeLinecap="round"
            className="motion-safe:[animation:dashdraw_.55s_ease-out]"
          />
          <circle cx={layout.conn.x2} cy={layout.conn.y2} r={3.5} fill={INK} />
        </svg>
      )}

      {layout && (
        <div
          className="fixed z-[62] w-[336px] max-w-[calc(100vw-24px)] motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-300"
          style={{ left: layout.panel.left, top: layout.panel.top }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative overflow-hidden rounded-[4px] border-2 border-[#1a1a2e] bg-[#fffaf3] p-5 shadow-[6px_7px_0_rgba(26,26,46,0.9)]">
            <div className="flex items-start gap-3.5">
              <span
                className="text-[52px] font-extrabold leading-[0.8]"
                style={{ color: ORANGE }}
              >
                {String(step + 1).padStart(2, "0")}
              </span>
              <div className="pt-1">
                <h2 className="text-[19px] font-extrabold leading-tight tracking-tight text-[#1a1a2e]">
                  {data.title}
                </h2>
              </div>
            </div>
            <p className="mt-3 text-[14px] leading-relaxed text-[#54525e]">
              {data.body}
            </p>

            <div className="mt-5 flex items-center justify-between border-t border-dashed border-[#d8d2c6] pt-3.5">
              <button
                onClick={onClose}
                className="text-[12.5px] font-bold text-[#a29b8c] transition hover:text-[#54525e]"
              >
                Skip
              </button>
              <div className="flex items-center gap-2">
                <span className="mr-1 text-[12px] font-bold tabular-nums text-[#a29b8c]">
                  {step + 1}/{STEPS.length}
                </span>
                <button
                  onClick={onBack}
                  className="grid size-9 place-items-center rounded-[4px] border-2 border-[#1a1a2e] text-[#1a1a2e] transition hover:bg-[#1a1a2e] hover:text-white active:scale-[0.96]"
                  aria-label="Back"
                >
                  <ArrowLeft className="size-4" />
                </button>
                <button
                  onClick={onNext}
                  className="flex items-center gap-1.5 rounded-[4px] border-2 border-[#1a1a2e] bg-[#1a1a2e] px-4 py-2 text-sm font-bold text-white transition hover:brightness-125 active:scale-[0.98]"
                >
                  {step === STEPS.length - 1 ? "Done" : "Next"}
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes dashdraw{from{stroke-dasharray:120;stroke-dashoffset:120}to{stroke-dasharray:120;stroke-dashoffset:0}}`}</style>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════
// C · SPOTLIGHT — frosted-white veil, lifted target, tailed tooltip
// ══════════════════════════════════════════════════════════════════
function SpotlightTour({ step, rect, onNext, onBack, onClose }: TourProps) {
  const [vw, setVw] = useState(1280);
  const [vh, setVh] = useState(800);
  useEffect(() => {
    const r = () => {
      setVw(window.innerWidth);
      setVh(window.innerHeight);
    };
    r();
    window.addEventListener("resize", r);
    return () => window.removeEventListener("resize", r);
  }, []);

  const data = STEPS[step];
  const layout = rect ? computeLayout(rect, vw, vh) : null;
  const hole = rect
    ? {
        top: rect.top - 7,
        left: rect.left - 7,
        width: rect.width + 14,
        height: rect.height + 14,
      }
    : null;

  // tail position from panel-side anchor
  const tail = layout ? { x: layout.conn.x1, y: layout.conn.y1 } : null;

  return (
    <>
      <div className="fixed inset-0 z-[59]" onClick={onClose} />

      {hole && (
        <div
          className="pointer-events-none fixed z-[60] rounded-[12px] bg-white/0 transition-all duration-[450ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
            top: hole.top,
            left: hole.left,
            width: hole.width,
            height: hole.height,
            boxShadow: `0 0 0 1px rgba(26,26,46,0.08), 0 14px 40px rgba(26,26,46,0.16), 0 0 0 9999px rgba(255,255,255,0.74)`,
          }}
        />
      )}

      {tail && (
        <div
          className="pointer-events-none fixed z-[61] size-3 rotate-45 border border-[#ececf1] bg-white"
          style={{ left: tail.x - 6, top: tail.y - 6 }}
        />
      )}

      {layout && (
        <div
          className="fixed z-[62] w-[336px] max-w-[calc(100vw-24px)] motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-300"
          style={{ left: layout.panel.left, top: layout.panel.top }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative overflow-hidden rounded-[18px] border border-[#ececf1] bg-white p-5 shadow-[0_24px_60px_rgba(26,26,46,0.18)]">
            {/* thin progress */}
            <div className="flex gap-1">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className="h-[3px] flex-1 rounded-full transition-colors"
                  style={{
                    background:
                      i === step
                        ? ORANGE
                        : i < step
                          ? "rgba(255,94,26,0.35)"
                          : "#ececf1",
                  }}
                />
              ))}
            </div>

            <h2 className="mt-4 text-[19px] font-extrabold leading-tight tracking-tight text-[#1a1a2e]">
              {data.title}
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-[#6a6b7b]">
              {data.body}
            </p>

            <div className="mt-5 flex items-center justify-between">
              <button
                onClick={onClose}
                className="text-[13px] font-semibold text-[#9a9bb0] transition hover:text-[#6a6b7b]"
              >
                Skip tour
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={onBack}
                  disabled={step === 0}
                  className="grid size-9 place-items-center rounded-full border border-[#ececf1] text-[#6a6b7b] transition hover:border-[#ff5e1a] hover:text-[#ff5e1a] disabled:opacity-35 active:scale-[0.96]"
                  aria-label="Back"
                >
                  <ArrowLeft className="size-4" />
                </button>
                <button
                  onClick={onNext}
                  className="flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-bold text-white transition hover:brightness-105 active:scale-[0.98]"
                  style={{
                    background: ORANGE,
                    boxShadow: "0 8px 20px rgba(255,94,26,0.3)",
                  }}
                >
                  {step === STEPS.length - 1 ? "Finish" : "Next"}
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ══════════════════════════════════════════════════════════════════
// D · CAMPAIGN — editorial / ad-poster energy, orange color-blocking,
//     lookbook index numerals, a bold cover moment. Brand-forward.
// ══════════════════════════════════════════════════════════════════
function CampaignTour({ step, rect, onNext, onBack, onClose }: TourProps) {
  const [vw, setVw] = useState(1280);
  const [vh, setVh] = useState(800);
  const [cover, setCover] = useState(true);
  useEffect(() => {
    const r = () => {
      setVw(window.innerWidth);
      setVh(window.innerHeight);
    };
    r();
    window.addEventListener("resize", r);
    return () => window.removeEventListener("resize", r);
  }, []);

  const data = STEPS[step];
  const num = String(step + 1).padStart(2, "0");
  // composer steps open a dropdown below the chip, so push the card to the side
  const isComposer = data?.target?.includes("picker");
  const layout = rect ? computeLayout(rect, vw, vh, isComposer) : null;
  const hole = rect
    ? {
        top: rect.top - 8,
        left: rect.left - 8,
        width: rect.width + 16,
        height: rect.height + 16,
      }
    : null;

  // COVER — a campaign key-visual moment before the walkthrough
  if (cover) {
    return (
      <div className="fixed inset-0 z-[70] grid place-items-center bg-[#14141f]/45 p-4 backdrop-blur-[2px] motion-safe:animate-in motion-safe:fade-in">
        <div className="w-full max-w-[420px] overflow-hidden rounded-[26px] bg-white shadow-[0_30px_80px_rgba(15,15,25,0.35)] motion-safe:animate-in motion-safe:zoom-in-95">
          {/* editorial header band with brand lockup */}
          <div className="relative h-[128px] overflow-hidden bg-[#1a1a2e]">
            <img
              src={CAMP_COVER}
              alt=""
              className="absolute inset-0 h-full w-full object-cover grayscale"
            />
            <div className="absolute inset-0 bg-[#ff5220] mix-blend-multiply opacity-45" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#120a06]/70 to-transparent" />
            <div className="absolute left-6 top-5 flex items-center gap-2">
              <span
                className="grid size-8 place-items-center rounded-[9px] text-white shadow-[0_4px_12px_rgba(255,82,85,0.4)]"
                style={{ background: "linear-gradient(to right,#FFA73C 0%,#FF5255 100%)" }}
              >
                <Sparkles className="size-4" />
              </span>
              <span className="text-[15px] font-extrabold tracking-tight text-white">
                BuzzVideo
              </span>
            </div>
          </div>

          {/* welcome body */}
          <div className="p-7">
            <h2 className="text-[26px] font-extrabold leading-[1.08] tracking-tight text-[#1a1a2e]">
              Welcome to <span className={gradText}>Buzz</span>.
            </h2>
            <p className="mt-2 text-[14.5px] leading-relaxed text-[#6a6b7b]">
              A one-minute tour of where everything lives, so your first campaign
              flies.
            </p>

            {/* orientation preview: the 4 stops you'll visit */}
            <p className="mb-3 mt-6 text-[11px] font-bold uppercase tracking-[0.18em] text-[#b6b6c2]">
              What you&apos;ll see
            </p>
            <div className="grid grid-cols-4 gap-2">
              {SIDE_NAV.map((it) => (
                <div
                  key={it.key}
                  className="flex flex-col items-center gap-1.5 rounded-xl bg-[#faf9fb] py-3 text-[#6a6b7b]"
                >
                  <it.Icon className="size-[18px] text-[#ff5e1a]" />
                  <span className="text-[11px] font-semibold">{it.label}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setCover(false)}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[15px] font-bold text-white transition hover:brightness-105 active:scale-[0.98]"
              style={{
                background: "linear-gradient(to right,#FFA73C 0%,#FF5255 100%)",
                boxShadow: "0 12px 28px rgba(255,82,85,0.34)",
              }}
            >
              Take the tour <ArrowRight className="size-4" />
            </button>
            <button
              onClick={onClose}
              className="mt-2.5 w-full text-center text-[13.5px] font-semibold text-[#9a9bb0] transition hover:text-[#6a6b7b]"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-[59]" onClick={onClose} />

      {hole && (
        <div
          className="pointer-events-none fixed z-[60] rounded-[12px] transition-all duration-[450ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
            top: hole.top,
            left: hole.left,
            width: hole.width,
            height: hole.height,
            boxShadow: `0 0 0 3px ${ORANGE}, 0 14px 40px rgba(255,82,85,0.28), 0 0 0 9999px rgba(26,26,46,0.16)`,
          }}
        />
      )}

      {layout && (
        <svg className="pointer-events-none fixed inset-0 z-[61] h-full w-full">
          <line
            x1={layout.conn.x1}
            y1={layout.conn.y1}
            x2={layout.conn.x2}
            y2={layout.conn.y2}
            stroke={ORANGE}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
          <circle cx={layout.conn.x2} cy={layout.conn.y2} r={4} fill={ORANGE} />
        </svg>
      )}

      {layout && (
        <div
          className="fixed z-[62] w-[360px] max-w-[calc(100vw-24px)] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300"
          style={{ left: layout.panel.left, top: layout.panel.top }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative overflow-hidden rounded-[20px] bg-white p-6 shadow-[0_24px_60px_rgba(26,26,46,0.2)]">
            {/* oversized step numeral as a top-right watermark, softened by an overlay */}
            <span
              aria-hidden
              className="pointer-events-none absolute -right-3 -top-8 text-[128px] font-extrabold leading-none"
              style={{ color: ORANGE, opacity: 0.1 }}
            >
              {num}
            </span>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-l from-white/70 to-transparent" />

            <div className="relative flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#b6b6c2]">
                {num} / {String(STEPS.length).padStart(2, "0")}
              </span>
              <button
                onClick={onClose}
                className="-mr-1 grid size-7 place-items-center rounded-lg text-[#9a9bb0] transition hover:bg-[#f7f6f9] hover:text-[#6a6b7b]"
                aria-label="Skip"
              >
                <X className="size-4" />
              </button>
            </div>

            <h2 className="relative mt-4 max-w-[15ch] text-[21px] font-extrabold leading-[1.05] tracking-tight text-[#1a1a2e]">
              {data.title}
            </h2>

            <p className="relative mt-2 text-[14px] leading-relaxed text-[#6a6b7b]">
              {data.body}
            </p>

            <div className="relative mt-5 flex items-center justify-end gap-2">
              <button
                onClick={onBack}
                disabled={step === 0}
                className="grid size-9 place-items-center rounded-full border border-[#ececf1] text-[#6a6b7b] transition hover:border-[#ff5e1a] hover:text-[#ff5e1a] disabled:opacity-35 active:scale-[0.96]"
                aria-label="Back"
              >
                <ArrowLeft className="size-4" />
              </button>
              <button
                onClick={onNext}
                className="flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-105 active:scale-[0.98]"
                style={{
                  background: "linear-gradient(to right,#FFA73C 0%,#FF5255 100%)",
                  boxShadow: "0 10px 24px rgba(255,82,85,0.32)",
                }}
              >
                {step === STEPS.length - 1 ? "Finish" : "Next"}
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CampaignDone({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-[#14141f]/45 p-4 backdrop-blur-[2px] motion-safe:animate-in motion-safe:fade-in">
      <div
        className="relative w-full max-w-[420px] overflow-hidden rounded-[26px] p-8 text-white shadow-[0_30px_80px_rgba(255,82,85,0.4)] motion-safe:animate-in motion-safe:zoom-in-95"
        style={{
          background: "linear-gradient(150deg,#ff8a3d 0%,#ff5e1a 46%,#ff4655 100%)",
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -right-3 -top-8 text-[140px] font-extrabold leading-none text-white/[0.14]"
        >
          06
        </span>
        <p className="text-[12px] font-bold uppercase tracking-[0.28em] text-white/80">
          You&apos;re set
        </p>
        <h2 className="mt-4 text-[32px] font-extrabold leading-[1] tracking-tight">
          Go make
          <br /> something loud.
        </h2>
        <p className="mt-3 max-w-[300px] text-[15px] leading-relaxed text-white/85">
          Drop an idea in the box and the Marketing Agent takes it from there.
        </p>
        <button
          onClick={onClose}
          className="mt-7 flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[15px] font-bold text-[#ff5220] transition hover:brightness-95 active:scale-[0.98]"
        >
          Start creating <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

// shared light done card
function DoneCard({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-[#14141f]/30 p-4 backdrop-blur-[2px] motion-safe:animate-in motion-safe:fade-in">
      <div className="w-full max-w-[360px] rounded-[22px] border border-[#ececf1] bg-white p-7 text-center shadow-[0_28px_70px_rgba(26,26,46,0.22)] motion-safe:animate-in motion-safe:zoom-in-95">
        <span
          className="mx-auto grid size-12 place-items-center rounded-full text-white"
          style={{ background: ORANGE }}
        >
          <Check className="size-6" />
        </span>
        <h2 className="mt-4 text-[21px] font-extrabold tracking-tight text-[#1a1a2e]">
          That&apos;s the tour
        </h2>
        <p className="mx-auto mt-2 max-w-[280px] text-[14px] leading-relaxed text-[#6a6b7b]">
          Type an idea in the box and the Marketing Agent takes it from there.
        </p>
        <button
          onClick={onClose}
          className="mt-6 w-full rounded-xl px-5 py-3 text-sm font-bold text-white transition hover:brightness-105 active:scale-[0.98]"
          style={{ background: ORANGE }}
        >
          Start creating
        </button>
      </div>
    </div>
  );
}

// ── subscription modal (A ends here) ──────────────────────────────
// 占位:真正的订阅/定价 UI 由独立原型负责,这里只居中示意「订阅弹窗」。
// 点背景关闭。
function SubscribeModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center bg-[#14141f]/55 p-4 backdrop-blur-[2px] motion-safe:animate-in motion-safe:fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="grid aspect-[4/3] w-full max-w-[400px] place-items-center rounded-[24px] border-2 border-dashed border-[#d4d3df] bg-white/90 text-center shadow-[0_30px_80px_rgba(15,15,25,0.3)] motion-safe:animate-in motion-safe:zoom-in-95"
      >
        <span className="px-6 text-[15px] font-semibold text-[#9a9bb0]">
          这里弹出订阅弹窗
        </span>
      </div>
    </div>
  );
}

// ── composer dropdown the tour opens (fixed, above the veil) ──────
function ComposerMenu({
  kind,
  rect,
}: {
  kind: "agent" | "mode";
  rect: Rect;
}) {
  const agents = [
    {
      name: "Marketing Agent",
      desc: "AI marketing expert. Marketing strategy, ad copy, and creatives in one.",
      Icon: Sparkles,
    },
    {
      name: "Image Gen",
      desc: "Fast high-quality image generation, best for fast creative iteration.",
      Icon: ImageIcon,
    },
    {
      name: "Video Gen",
      desc: "Up to 15 seconds of cinematic-quality video with synced audio and visuals.",
      Icon: Video,
    },
    {
      name: "Long Video",
      desc: "Auto scene planning for high-quality long-form videos.",
      Icon: Film,
      soon: true,
    },
  ];
  const width = kind === "agent" ? 320 : 296;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
  const left = clamp(rect.left, 12, vw - width - 12);
  const top = rect.top + rect.height + 8;

  if (kind === "mode") {
    return <ModelSettings top={top} left={left} width={width} />;
  }

  return (
    <div
      className="fixed z-[61] overflow-hidden rounded-2xl border border-[#ececf1] bg-white p-1.5 shadow-[0_18px_44px_rgba(26,26,46,0.18)] motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95"
      style={{ top, left, width }}
    >
      {agents.map((it, i) => {
        const selected = i === 0;
        return (
          <div
            key={it.name}
            className={`flex items-start gap-3 rounded-xl px-2.5 py-2.5 ${
              selected ? "bg-[#fff5ef]" : ""
            } ${it.soon ? "opacity-55" : ""}`}
          >
            <span
              className="grid size-8 shrink-0 place-items-center rounded-lg"
              style={
                selected
                  ? { background: "#ffe1cf", color: ORANGE }
                  : { background: "#f3f2f6", color: "#8a8a99" }
              }
            >
              <it.Icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[13.5px] font-bold text-[#1a1a2e]">
                  {it.name}
                </span>
                {it.soon && (
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                    style={{ background: "#fff3ec", color: ORANGE }}
                  >
                    Coming Soon
                  </span>
                )}
              </div>
              <span className="mt-0.5 block text-[11.5px] leading-snug text-[#9a9bb0]">
                {it.desc}
              </span>
            </div>
            {selected && (
              <Check className="mt-1 size-4 shrink-0" style={{ color: ORANGE }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Model Settings panel (the mode-picker dropdown) — matches the reference
function ModelSettings({
  top,
  left,
  width,
}: {
  top: number;
  left: number;
  width: number;
}) {
  const [imageTab, setImageTab] = useState(true);
  const [res, setRes] = useState("Low");
  const [ratio, setRatio] = useState("1:1");

  const label = "mb-2 text-[12px] font-semibold text-[#9a9bb0]";
  const RATIOS = [
    { name: "1:1", w: 1, h: 1 },
    { name: "3:4", w: 3, h: 4 },
    { name: "4:3", w: 4, h: 3 },
    { name: "4:5", w: 4, h: 5 },
    { name: "9:16", w: 9, h: 16 },
    { name: "16:9", w: 16, h: 9 },
  ];

  return (
    <div
      className="fixed z-[61] rounded-2xl border border-[#ececf1] bg-white p-4 shadow-[0_18px_44px_rgba(26,26,46,0.18)] motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95"
      style={{ top, left, width }}
    >
      {/* header + Auto toggle */}
      <div className="flex items-center justify-between">
        <span className="text-[15px] font-extrabold tracking-tight text-[#1a1a2e]">
          Model Settings
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-[#9a9bb0]">Auto</span>
          <span
            className="relative h-5 w-9 rounded-full"
            style={{ background: "#ffb38a" }}
          >
            <span className="absolute right-0.5 top-0.5 size-4 rounded-full bg-white shadow-sm" />
          </span>
        </div>
      </div>

      {/* Image / Video tabs */}
      <div className="mt-4 flex rounded-xl bg-[#f3f2f6] p-1">
        {[
          { k: true, t: "Image Model" },
          { k: false, t: "Video Model" },
        ].map((tab) => {
          const active = imageTab === tab.k;
          return (
            <button
              key={tab.t}
              onClick={() => setImageTab(tab.k)}
              className={`flex-1 rounded-lg py-1.5 text-[13px] font-bold transition ${
                active
                  ? "bg-white text-[#1a1a2e] shadow-sm"
                  : "text-[#9a9bb0]"
              }`}
            >
              {tab.t}
            </button>
          );
        })}
      </div>

      {/* Model select */}
      <div className="mt-4">
        <p className={label}>Model</p>
        <div className="flex items-center gap-2.5 rounded-xl border border-[#ececf1] px-3 py-2.5">
          <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#1a1a2e] text-white">
            <Sparkles className="size-3" />
          </span>
          <span className="flex-1 text-[13px] font-semibold text-[#1a1a2e]">
            {imageTab ? "GPT-image-2" : "Veo-3"}
          </span>
          <ChevronDown className="size-4 text-[#9a9bb0]" />
        </div>
      </div>

      {/* Resolution */}
      <div className="mt-4">
        <p className={label}>Resolution</p>
        <div className="flex rounded-xl bg-[#f3f2f6] p-1">
          {["Low", "Medium", "High"].map((r) => {
            const active = res === r;
            return (
              <button
                key={r}
                onClick={() => setRes(r)}
                className={`flex-1 rounded-lg py-1.5 text-[13px] font-bold transition ${
                  active ? "bg-white text-[#1a1a2e] shadow-sm" : "text-[#9a9bb0]"
                }`}
              >
                {r}
              </button>
            );
          })}
        </div>
      </div>

      {/* Aspect Ratio */}
      <div className="mt-4">
        <p className={label}>Aspect Ratio</p>
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {RATIOS.map((r) => {
            const active = ratio === r.name;
            const box = 20;
            const w = r.w >= r.h ? box : Math.round((box * r.w) / r.h);
            const h = r.h >= r.w ? box : Math.round((box * r.h) / r.w);
            return (
              <button
                key={r.name}
                onClick={() => setRatio(r.name)}
                className={`flex w-[52px] shrink-0 flex-col items-center gap-1.5 rounded-xl border py-2 transition ${
                  active
                    ? "border-[#ff5e1a] bg-[#fff5ef]"
                    : "border-[#ececf1] hover:border-[#d4d3df]"
                }`}
              >
                <span className="grid h-[22px] place-items-center">
                  <span
                    className="rounded-[3px] border-[1.5px]"
                    style={{
                      width: w,
                      height: h,
                      borderColor: active ? ORANGE : "#c4c3cf",
                    }}
                  />
                </span>
                <span
                  className={`text-[11px] font-semibold ${
                    active ? "text-[#ff5e1a]" : "text-[#9a9bb0]"
                  }`}
                >
                  {r.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── mock product surfaces the tour opens ──────────────────────────
const viewHeading =
  "text-[clamp(24px,3vw,32px)] font-extrabold tracking-tight text-[#1a1a2e]";

function ChatView() {
  const pinned = [
    { title: "Summer sale, sunglasses line", when: "Yesterday" },
    { title: "Q3 always-on retargeting brief", when: "Mar 4" },
  ];
  const recent = [
    { title: "Meal-prep UGC hooks, round 2", when: "2h ago" },
    { title: "Power bank launch, IG carousel", when: "Yesterday" },
    { title: "Ergonomic pillow, angle tests", when: "Mon" },
    { title: "Beauty device, 15s video cutdowns", when: "Feb 28" },
    { title: "Sunscreen, competitor scan", when: "Feb 26" },
  ];

  const row = (c: { title: string; when: string }, isPinned = false) => (
    <div
      key={c.title}
      className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-[#faf9fb]"
    >
      <MessageCircle className="size-4 shrink-0 text-[#b6b6c2]" />
      <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-[#1a1a2e]">
        {c.title}
      </span>
      <span className="shrink-0 text-[12px] text-[#9a9bb0] group-hover:hidden">
        {c.when}
      </span>
      {/* rename / pin affordances appear on hover */}
      <div className="hidden shrink-0 items-center gap-1 group-hover:flex">
        <span
          className="grid size-7 place-items-center rounded-lg text-[#9a9bb0] hover:bg-[#f1f0f4] hover:text-[#6a6b7b]"
          title="Rename"
        >
          <Pencil className="size-3.5" />
        </span>
        <span
          className="grid size-7 place-items-center rounded-lg hover:bg-[#f1f0f4]"
          title={isPinned ? "Unpin" : "Pin"}
          style={{ color: isPinned ? ORANGE : "#9a9bb0" }}
        >
          <Pin className="size-3.5" />
        </span>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-[760px] px-4 py-8 sm:px-6">
      <h2 className={viewHeading}>Chat</h2>
      <p className="mt-1 text-[14px] text-[#6a6b7b]">
        Every conversation is saved here. Search, pin, or rename to stay
        organized.
      </p>

      {/* search */}
      <div className="mt-6 flex items-center gap-2.5 rounded-xl border border-[#ececf1] bg-white px-3.5 py-2.5">
        <Search className="size-4 text-[#9a9bb0]" />
        <span className="text-[14px] text-[#9a9bb0]">Search chats</span>
      </div>

      {/* pinned */}
      <p className="mb-1 mt-6 flex items-center gap-1.5 px-3 text-[12px] font-bold uppercase tracking-[0.14em] text-[#b6b6c2]">
        <Pin className="size-3" /> Pinned
      </p>
      <div>{pinned.map((c) => row(c, true))}</div>

      {/* recent */}
      <p className="mb-1 mt-4 px-3 text-[12px] font-bold uppercase tracking-[0.14em] text-[#b6b6c2]">
        Recent
      </p>
      <div>{recent.map((c) => row(c))}</div>
    </div>
  );
}

const WORKFLOW_SECTIONS = [
  {
    title: "Ads",
    items: [
      { name: "Advertising", seed: "perfume-bottle-ad" },
      { name: "Ad Clone", seed: "sparkling-drink-lime" },
      { name: "Ecommerce", seed: "street-headphones-model" },
    ],
  },
  {
    title: "Editing Tools",
    items: [
      { name: "Remove & Change Backgrounds", seed: "speaker-product-bg" },
      { name: "Upscale & Enhance", seed: "photo-upscale-detail" },
    ],
  },
  {
    title: "UGC",
    items: [
      { name: "Cream Product UGC Style Video", seed: "cream-ugc-model" },
      { name: "UGC Style Product Review Video", seed: "ugc-tumbler-review" },
    ],
  },
  {
    title: "Others",
    items: [
      { name: "Pet Products", seed: "pet-dog-outdoor" },
      { name: "Fashion", seed: "fashion-model-studio" },
    ],
  },
];

function WorkflowCard({ name, seed }: { name: string; seed: string }) {
  return (
    <button className="group text-left">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#f1f0f4]">
        <img
          src={`https://picsum.photos/seed/${seed}/600/450`}
          alt={name}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-1.5 text-[13px] font-semibold text-[#1a1a2e] shadow-sm">
            <Eye className="size-4" />
            Preview
          </span>
        </div>
      </div>
      <p className="mt-2 text-[14px] font-semibold text-[#1a1a2e]">{name}</p>
    </button>
  );
}

function WorkflowsView() {
  const [active, setActive] = useState<string | null>(null);
  const go = (title: string) => {
    setActive(title);
    document
      .getElementById(`wf-${catSlug(title)}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6">
      <h2 className={viewHeading}>Workflows</h2>

      {/* 分类 tab 胶囊 */}
      <div className="mt-5 flex flex-wrap gap-2">
        {WORKFLOW_SECTIONS.map((s) => {
          const on = active === s.title;
          return (
            <button
              key={s.title}
              onClick={() => go(s.title)}
              className={
                "rounded-full border bg-white px-4 py-1.5 text-[13px] font-semibold transition " +
                (on
                  ? "border-[#ff5e1a] text-[#ff5e1a]"
                  : "border-[#ececf1] text-[#6a6b7b] hover:border-[#d4d3df] hover:text-[#1a1a2e]")
              }
            >
              {s.title}
            </button>
          );
        })}
      </div>

      {WORKFLOW_SECTIONS.map((s) => (
        <div
          key={s.title}
          id={`wf-${catSlug(s.title)}`}
          className="mt-8 scroll-mt-24"
        >
          <h3 className="mb-3 text-sm font-bold text-[#1a1a2e]">{s.title}</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
            {s.items.map((t) => (
              <WorkflowCard key={t.name} name={t.name} seed={t.seed} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function CanvasView() {
  return (
    <div className="mx-auto max-w-[1000px] px-4 py-8 sm:px-6">
      <h2 className={viewHeading}>Canvas</h2>
      <p className="mt-1 text-[14px] text-[#6a6b7b]">
        Arrange and refine your generated images and videos on an open board.
      </p>
      <div
        className="mt-8 grid grid-cols-2 gap-4 rounded-2xl border border-[#ececf1] p-5 sm:grid-cols-4"
        style={{
          backgroundColor: "#faf9fb",
          backgroundImage:
            "radial-gradient(#e2e1e8 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      >
        <div className="col-span-2 row-span-2 aspect-square rounded-xl bg-gradient-to-br from-[#ffd9c2] to-[#ffb38a]" />
        <div className="aspect-square rounded-xl bg-gradient-to-br from-[#f1f0f4] to-[#e2e1e8]" />
        <div className="aspect-square rounded-xl bg-gradient-to-br from-[#ffe7d6] to-[#ffcaa8]" />
        <div className="col-span-2 flex items-center rounded-xl border border-[#ececf1] bg-white px-4 text-[13px] font-medium text-[#6a6b7b]">
          Hook: &quot;Shade that keeps up with summer.&quot;
        </div>
      </div>
    </div>
  );
}
