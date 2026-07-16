"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Sparkles,
  Command,
  House,
  MessageCircle,
  GitBranch,
  Frame,
  SwatchBook,
  FolderOpen,
  Music,
  FileText,
  Download,
  Upload,
  UploadCloud,
  Wand2,
  Video,
  ExternalLink,
  ChevronUp,
  Check,
  Heart,
  Trash2,
  CircleAlert,
  ChevronDown,
  ListChecks,
  X,
  RefreshCw,
  Plus,
  Pencil,
  ChevronLeft,
  ArrowUp,
  History,
  SlidersHorizontal,
  UserRound,
  Search,
  Clapperboard,
  Play,
  Pause,
  ArrowRight,
  Clock,
  Scissors,
  Mic,
  Layers,
  Film,
  RectangleHorizontal,
  RectangleVertical,
  Square,
  Volume2,
  Loader2,
  CircleCheck,
  ChevronRight,
  Bell,
  MoreHorizontal,
  LayoutGrid,
  PanelLeft,
  Star,
  AtSign,
  Scan,
  Gem,
  Image as ImageIcon,
  Lock,
  Camera,
  Link2,
  ArrowDown,
  ChevronsUpDown,
} from "lucide-react";
import { useAdStudio } from "./lib/useAdStudio";
import type { ProductAnalysis, ProjectSummary, FrameState } from "./lib/adStudioClient";
import { listProjects } from "./lib/adStudioClient";

/* ---------- Brand helpers (design.md) ---------- */
const gradText =
  "bg-gradient-to-r from-[#ffc078] to-[#ff5e1a] bg-clip-text text-transparent";
const ctaGrad = "bg-gradient-to-r from-[#FFA73C] to-[#FF5255]";
const ctaBtn =
  "rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(255,82,85,0.28)] transition hover:brightness-105 active:translate-y-[1px]";
const ghostBtn =
  "rounded-xl border border-[#ececf1] bg-white px-4 py-2.5 text-sm font-bold text-[#1a1a2e] transition hover:border-[#ff5e1a] hover:bg-[#fff7f1] active:translate-y-[1px]";

/* ---------- Types ---------- */
type AssetType = "image" | "video" | "avatar" | "audio" | "pdf";
type Asset = {
  id: string;
  type: AssetType;
  title: string;
  session: string;
  createdAt: string;
  prompt: string;
  model: string;
  favorite: boolean;
  /** where it came from */
  source: "ai" | "upload";
  /** real asset path under /public; falls back to picsum seed if absent */
  src?: string;
  seed?: string;
  ratio?: "square" | "portrait" | "landscape";
  /** for video */
  duration?: string;
  /** for audio/pdf: size / pages */
  meta?: string;
};

/* ---------- Mock data: assets across sessions ---------- */
const RAW_ASSETS: Asset[] = [
  {
    id: "a1",
    source: "ai",
    type: "image",
    title: "Sparkling water hero",
    session: "Sparkling Water Launch",
    createdAt: "Jul 2, 2:41 PM",
    prompt: "Peach sparkling water bottle, dopamine color set, splashes",
    model: "Buzz Image v3",
    favorite: false,
    src: "/prototypes/asset-library/images/img-01.jpg",
  },
  {
    id: "a2",
    source: "ai",
    type: "video",
    title: "Product spin reel",
    session: "Sparkling Water Launch",
    createdAt: "Jul 2, 1:08 PM",
    prompt: "15s vertical product spin, bright studio",
    model: "Buzz Video v2",
    favorite: false,
    src: "/prototypes/asset-library/videos/video-01.mp4",
    duration: "0:15",
  },
  {
    id: "a3",
    source: "ai",
    type: "image",
    title: "Serum carousel frame",
    session: "CloudJelly Serum",
    createdAt: "Jul 2, 11:32 AM",
    prompt: "4x5 serum carousel, soft gradient",
    model: "Buzz Image v3",
    favorite: false,
    src: "/prototypes/asset-library/images/img-02.jpg",
  },
  {
    id: "a4",
    source: "ai",
    type: "avatar",
    title: "Brand avatar · calm",
    session: "AI Avatar",
    createdAt: "Jul 2, 10:20 AM",
    prompt: "Digital brand spokesperson, calm expression, studio backdrop",
    model: "Buzz Avatar v1",
    favorite: false,
    src: "/prototypes/asset-library/avatars/avatar-01.png",
  },
  {
    id: "a5",
    source: "upload",
    type: "image",
    title: "Product close-up",
    session: "E-commerce",
    createdAt: "Jul 1, 4:15 PM",
    prompt: "Macro product close-up",
    model: "Buzz Image v3",
    favorite: false,
    src: "/prototypes/asset-library/images/img-03.jpg",
  },
  {
    id: "a6",
    source: "upload",
    type: "audio",
    title: "Background music.mp3",
    session: "Sonic Branding",
    createdAt: "Jul 1, 9:40 AM",
    prompt: "Upbeat background track",
    model: "Buzz Audio",
    favorite: false,
    src: "/prototypes/asset-library/audio/audio-01.mp3",
    meta: "2:38 - 2.6 MB",
  },
  {
    id: "a7",
    source: "upload",
    type: "pdf",
    title: "Campaign info.pdf",
    session: "Q3 Planning",
    createdAt: "Jul 1, 8:02 AM",
    prompt: "Campaign info deck",
    model: "Buzz Docs",
    favorite: false,
    src: "/prototypes/asset-library/pdf/doc-01.pdf",
    meta: "8 pages - 2.2 MB",
  },
];

/* Pre-rendered page images for the demo PDF (browser PDF viewer is unreliable). */
const PDF_PAGES = Array.from(
  { length: 8 },
  (_, i) =>
    `/prototypes/asset-library/pdf/pages/page-${String(i + 1).padStart(2, "0")}.jpg`,
);

const FILTERS: { key: AssetType | "all" | "favorites"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "image", label: "Images" },
  { key: "video", label: "Videos" },
  { key: "avatar", label: "Avatar" },
  { key: "audio", label: "Audio" },
  { key: "pdf", label: "PDF" },
  { key: "favorites", label: "Favorites" },
];

/* ---------- Mock data: brand kits ---------- */
type BrandKit = {
  id: string;
  name: string;
  initials: string;
  description: string;
  website: string;
  colors: string[];
  fonts: string[];
  accent: string;
  knowledge: string;
  countries: string[];
  languages: string[];
  categories: string[];
  audience: string[];
};
const BRAND_KITS: BrandKit[] = [
  {
    id: "k0",
    name: "Buzz Agent",
    initials: "BA",
    description:
      "AI marketing agent that turns an idea into launch-ready ads in minutes. Synced from onboarding.",
    website: "app.buzzvideo.ai",
    colors: ["#1D1D1F", "#F7D290", "#F0B86C", "#E05A47"],
    fonts: ["Google Sans", "Roboto"],
    accent: "#E05A47",
    knowledge:
      "Buzz Agent is an AI-powered marketing and ad creation product within the Buzzvideo.ai ecosystem. The promise: go from idea to ready-to-run ads in minutes. It is positioned as a marketing agent that turns ideas into launch-ready advertising assets quickly, reducing the time and effort required to produce performant creative.",
    countries: ["United States"],
    languages: ["English"],
    categories: ["AI marketing software"],
    audience: [
      "Performance marketers who need to launch campaigns quickly",
      "Startup founders and lean growth teams",
      "Small businesses exploring AI for marketing",
    ],
  },
  {
    id: "k1",
    name: "Buzz Sunglasses",
    initials: "BS",
    description:
      "Bright, playful summer eyewear for gen-z. Confident, sunny, a little cheeky.",
    website: "buzzshades.com",
    colors: ["#ff5e1a", "#ffd23c", "#1a1a2e", "#fff3ec"],
    fonts: ["Plus Jakarta Sans", "Inter"],
    accent: "#ff5e1a",
    knowledge:
      "Buzz Sunglasses is bright, playful summer eyewear for gen-z. Tone of voice is confident, sunny and a little cheeky — never corporate. We lead with bold color and personality.",
    countries: ["United States", "United Kingdom"],
    languages: ["English"],
    categories: ["Eyewear", "Fashion"],
    audience: ["Gen-Z", "Festival-goers"],
  },
  {
    id: "k2",
    name: "Goose Coffee",
    initials: "GC",
    description:
      "Small-batch roastery. Warm, honest, craft-forward. Talks like a friendly barista.",
    website: "goosecoffee.co",
    colors: ["#6b4226", "#c98a5e", "#2d2018", "#f3e7d8"],
    fonts: ["Fraunces", "Inter"],
    accent: "#6b4226",
    knowledge:
      "Goose Coffee is a small-batch roastery. Tone is warm, honest and craft-forward — talks like a friendly barista who genuinely cares where the beans came from.",
    countries: ["United States"],
    languages: ["English"],
    categories: ["Coffee", "Food & Beverage"],
    audience: ["Home brewers", "Cafe regulars"],
  },
  {
    id: "k3",
    name: "Lumen Skincare",
    initials: "LS",
    description:
      "Clean, dermatologist-backed skincare. Calm, precise, reassuring tone of voice.",
    website: "lumenskin.com",
    colors: ["#e88aa4", "#f7d9e1", "#2b2730", "#ffffff"],
    fonts: ["Outfit", "Inter"],
    accent: "#e88aa4",
    knowledge:
      "Lumen Skincare is clean, dermatologist-backed skincare. Tone of voice is calm, precise and reassuring — confident without being clinical, warm without being fluffy.",
    countries: ["United States", "Canada"],
    languages: ["English"],
    categories: ["Skincare", "Beauty"],
    audience: ["Women 25–40", "Skincare enthusiasts"],
  },
];

/* ---------- Helpers ---------- */
function imgUrl(seed: string, w: number, h: number) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

type View = "agent" | "assets" | "brand" | "film";

export function AssetLibraryApp({
  initialView = "assets",
}: {
  initialView?: View;
}) {
  const [view, setView] = useState<View>(initialView);

  // Ad Studio 跳脱出产品外壳:独立全屏页,带返回入口
  if (view === "film") {
    return <FilmStudioPage onBack={() => setView("assets")} />;
  }

  return (
    <div className="min-h-screen bg-white text-[#1a1a2e]">
      <div className="flex">
        <Sidebar view={view} setView={setView} />
        <main className="min-w-0 flex-1">
          <TopBar />
          {view === "assets" ? (
            <AssetLibraryView />
          ) : view === "brand" ? (
            <BrandKitsView />
          ) : (
            <AgentView />
          )}
        </main>
      </div>
    </div>
  );
}

export default function AssetLibraryPrototype() {
  return <AssetLibraryApp initialView="assets" />;
}

/* ===================== Shell ===================== */
function Sidebar({
  view,
  setView,
}: {
  view: View;
  setView: (v: View) => void;
}) {
  const topItems = [
    { key: "home", label: "Home", Icon: House, view: null },
    { key: "agent", label: "Marketing Studio", Icon: Command, view: "agent" as const },
    {
      key: "film",
      label: "Ad Studio",
      Icon: Clapperboard,
      view: "film" as const,
      isNew: true,
    },
    { key: "canvas", label: "Canvas", Icon: Frame, view: null },
    { key: "audio", label: "Audio", Icon: Music, view: null },
    { key: "avatar", label: "Avatar", Icon: UserRound, view: null },
  ] as const;

  return (
    <aside className="sticky top-0 hidden h-screen w-[180px] shrink-0 flex-col gap-1 bg-white px-3 py-4 lg:flex">
      <div className="mb-4 flex items-center gap-2 px-2">
        <span className={`grid size-8 place-items-center rounded-[9px] ${ctaGrad} text-white`}>
          <Sparkles className="size-4" />
        </span>
        <span className="whitespace-nowrap font-[family-name:var(--font-display)] font-extrabold tracking-tight">
          BuzzVideo
        </span>
      </div>
      {topItems.map((item) => {
        const { key, label, Icon, view: target } = item;
        const isNew = "isNew" in item && item.isNew;
        const isActive = target !== null && view === target;
        return (
          <button
            key={key}
            onClick={() => target && setView(target)}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition ${
              isActive
                ? "bg-[#fff3ec] text-[#ff5e1a]"
                : "text-[#1a1a2e] hover:bg-[#fff7f1] hover:text-[#ff5e1a]"
            }`}
          >
            <Icon className="size-[18px] shrink-0" />
            <span className="whitespace-nowrap">{label}</span>
            {isNew && (
              <span className="ml-auto shrink-0 rounded-lg border border-[#ff5e1a] px-2 py-0.5 text-[11px] font-bold text-[#ff5e1a]">
                New
              </span>
            )}
          </button>
        );
      })}

      <div className="mx-3 my-2 border-t border-[#ececf1]" />

      <button
        onClick={() => setView("assets")}
        className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition ${
          view === "assets"
            ? "bg-[#fff3ec] text-[#ff5e1a]"
            : "text-[#1a1a2e] hover:bg-[#fff7f1] hover:text-[#ff5e1a]"
        }`}
      >
        <FolderOpen className="size-[18px] shrink-0" />
        <span className="whitespace-nowrap">Assets</span>
      </button>
    </aside>
  );
}

function TopBar() {
  return (
    <header className="flex items-center justify-end gap-3 bg-white/70 px-6 py-3 backdrop-blur">
      <span className="grid size-8 place-items-center rounded-full bg-[#1a1a2e] text-xs font-bold text-white">
        M
      </span>
    </header>
  );
}

/* ===================== Agent ===================== */
const ASSET_BY_ID: Record<string, Asset> = Object.fromEntries(
  RAW_ASSETS.map((a) => [a.id, a]),
);

/** 复用的资产缩略图填充(图片/视频帧/音频·PDF 图标) */
function AssetThumb({ asset }: { asset: Asset }) {
  const isMedia =
    asset.type === "image" || asset.type === "video" || asset.type === "avatar";
  if (asset.type === "video") {
    return (
      <video
        src={`${asset.src}#t=0.1`}
        muted
        playsInline
        preload="metadata"
        className="size-full object-cover"
      />
    );
  }
  if (isMedia) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={asset.src ?? imgUrl(asset.seed!, 400, 400)}
        alt={asset.title}
        loading="lazy"
        className="size-full object-cover"
      />
    );
  }
  return (
    <div className="grid size-full place-items-center bg-[#fff7f1] text-[#ff5e1a]">
      {asset.type === "audio" ? (
        <Music className="size-5" />
      ) : (
        <FileText className="size-5" />
      )}
    </div>
  );
}

const PICKER_FILTERS = FILTERS.filter((f) => f.key !== "favorites");

/** 弹窗网格选择器:多选资产引用进 composer */
function AssetPicker({
  initial,
  onAdd,
  onClose,
}: {
  initial: string[];
  onAdd: (ids: string[]) => void;
  onClose: () => void;
}) {
  const [filter, setFilter] = useState<AssetType | "all">("all");
  const [sel, setSel] = useState<Set<string>>(() => new Set(initial));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const list = useMemo(
    () =>
      filter === "all"
        ? RAW_ASSETS
        : RAW_ASSETS.filter((a) => a.type === filter),
    [filter],
  );

  const toggle = (id: string) =>
    setSel((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex h-[82vh] w-full max-w-[860px] flex-col overflow-hidden rounded-[22px] bg-white shadow-[0_24px_70px_rgba(26,26,46,0.28)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 grid size-8 place-items-center rounded-full text-[#6a6b7b] transition hover:bg-[#f1f0f4]"
        >
          <X className="size-4" />
        </button>

        {/* filter tabs */}
        <div className="flex flex-wrap gap-2 px-6 pt-5">
          {PICKER_FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key as AssetType | "all")}
                className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition ${
                  active
                    ? "bg-[#1a1a2e] text-white"
                    : "bg-[#f1f0f4] text-[#6a6b7b] hover:bg-[#e7e6ec]"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* grid */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {list.length === 0 ? (
            <div className="grid h-40 place-items-center text-sm text-[#9a9bb0]">
              No assets in this category yet.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {list.map((a) => {
                const selected = sel.has(a.id);
                return (
                  <button
                    key={a.id}
                    onClick={() => toggle(a.id)}
                    className={`group relative aspect-square overflow-hidden rounded-xl bg-[#f1f0f4] text-left transition ${
                      selected ? "ring-2 ring-[#ff5e1a] ring-offset-2" : "hover:opacity-90"
                    }`}
                  >
                    <AssetThumb asset={a} />
                    {a.type === "video" && a.duration && (
                      <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {a.duration}
                      </span>
                    )}
                    <span
                      className={`absolute left-2 top-2 grid size-6 place-items-center rounded-full border-2 transition ${
                        selected
                          ? "border-transparent bg-[#ff5e1a] text-white"
                          : "border-white bg-black/25 text-transparent group-hover:bg-black/35"
                      }`}
                    >
                      <Check className="size-3.5" strokeWidth={3} />
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* footer */}
        <div className="flex items-center justify-between px-6 py-4">
          <span className="text-[13px] font-semibold text-[#6a6b7b]">
            {sel.size} selected
          </span>
          <div className="flex items-center gap-2.5">
            <button onClick={onClose} className={ghostBtn}>
              Cancel
            </button>
            <button
              onClick={() => onAdd([...sel])}
              disabled={sel.size === 0}
              className={`${ctaBtn} disabled:cursor-not-allowed disabled:opacity-40`}
            >
              Add {sel.size > 0 ? sel.size : ""}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** composer 里的引用 chip */
function RefChip({ asset, onRemove }: { asset: Asset; onRemove: () => void }) {
  return (
    <span className="group/chip relative flex items-center gap-2 rounded-lg border border-[#ececf1] bg-white py-1 pl-1 pr-2.5 shadow-[0_1px_3px_rgba(26,26,46,0.06)]">
      <span className="size-7 shrink-0 overflow-hidden rounded-md bg-[#f1f0f4]">
        <AssetThumb asset={asset} />
      </span>
      <span className="max-w-[140px] truncate text-[12.5px] font-semibold text-[#1a1a2e]">
        {asset.title}
      </span>
      <button
        onClick={onRemove}
        aria-label={`Remove ${asset.title}`}
        className="grid size-4 place-items-center rounded-full text-[#9a9bb0] transition hover:bg-[#f1f0f4] hover:text-[#1a1a2e]"
      >
        <X className="size-3.5" />
      </button>
    </span>
  );
}

/** composer 里的品牌 chip(首字母色块 + 品牌名) */
function BrandChip({ kit, onRemove }: { kit: BrandKit; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-2 rounded-lg border border-[#ececf1] bg-white py-1 pl-1 pr-2.5 shadow-[0_1px_3px_rgba(26,26,46,0.06)]">
      <span
        className="grid size-7 shrink-0 place-items-center rounded-md text-[11px] font-extrabold text-white"
        style={{ backgroundColor: kit.accent }}
        aria-hidden
      >
        {kit.initials}
      </span>
      <span className="max-w-[140px] truncate text-[12.5px] font-semibold text-[#1a1a2e]">
        {kit.name}
      </span>
      <button
        onClick={onRemove}
        aria-label={`Remove ${kit.name}`}
        className="grid size-4 place-items-center rounded-full text-[#9a9bb0] transition hover:bg-[#f1f0f4] hover:text-[#1a1a2e]"
      >
        <X className="size-3.5" />
      </button>
    </span>
  );
}

/** 单选品牌选择器:一次只挂一个 brand kit */
function BrandKitPicker({
  selectedId,
  onSelect,
  onClose,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[82vh] w-full max-w-[560px] flex-col overflow-hidden rounded-[22px] bg-white shadow-[0_24px_70px_rgba(26,26,46,0.28)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#ececf1] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className={`grid size-8 place-items-center rounded-[9px] ${ctaGrad} text-white`}>
              <SwatchBook className="size-4" />
            </span>
            <div>
              <p className="text-sm font-bold">Apply a Brand Kit</p>
              <p className="text-[12px] text-[#9a9bb0]">
                Generations stay on-brand. One kit at a time.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid size-8 place-items-center rounded-full text-[#6a6b7b] transition hover:bg-[#f1f0f4]"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-4">
          {BRAND_KITS.map((kit) => {
            const active = selectedId === kit.id;
            return (
              <button
                key={kit.id}
                onClick={() => onSelect(kit.id)}
                className={`flex w-full items-center gap-3.5 rounded-2xl border p-3 text-left transition ${
                  active
                    ? "border-[#ff5e1a] bg-[#fff7f1]"
                    : "border-[#ececf1] hover:border-[#d4d3df] hover:bg-[#faf8f6]"
                }`}
              >
                <span
                  className="grid size-11 shrink-0 place-items-center rounded-xl text-sm font-extrabold text-white"
                  style={{ backgroundColor: kit.accent }}
                  aria-hidden
                >
                  {kit.initials}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[14.5px] font-bold text-[#1a1a2e]">
                      {kit.name}
                    </span>
                    <span className="flex gap-1">
                      {kit.colors.slice(0, 4).map((c, i) => (
                        <span
                          key={i}
                          className="size-3 rounded-full ring-1 ring-black/5"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </span>
                  </span>
                  <span className="mt-0.5 block truncate text-[12.5px] text-[#9a9bb0]">
                    {kit.website} · {kit.description}
                  </span>
                </span>
                {active && (
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#ff5e1a] text-white">
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AgentView() {
  const [draft, setDraft] = useState("");
  const [refs, setRefs] = useState<string[]>([]);
  const [brandKitId, setBrandKitId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [brandPickerOpen, setBrandPickerOpen] = useState(false);
  const [plusOpen, setPlusOpen] = useState(false);
  // 「@」就地唤起的引用小窗
  const [mentionOpen, setMentionOpen] = useState(false);
  // 记住选择器是否由「@」唤起,Add 后把那个 @ 删掉
  const atTriggerRef = useRef(false);

  const openPicker = (viaAt: boolean) => {
    atTriggerRef.current = viaAt;
    setPlusOpen(false);
    setPickerOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    setDraft(v);
    // 新打了一个结尾的「@」→ 就地弹出引用小窗;否则收起
    if (v.length > draft.length && v.endsWith("@")) {
      setMentionOpen(true);
    } else if (!v.endsWith("@")) {
      setMentionOpen(false);
    }
  };

  // 从「@」小窗里选一个资产:加进引用、删掉结尾的 @、收起小窗
  const pickMention = (id: string) => {
    setRefs((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setDraft((d) => d.replace(/@$/, ""));
    setMentionOpen(false);
  };

  const handleAdd = (ids: string[]) => {
    setRefs(ids);
    if (atTriggerRef.current) {
      setDraft((d) => d.replace(/@$/, ""));
      atTriggerRef.current = false;
    }
    setPickerOpen(false);
  };

  const removeRef = (id: string) =>
    setRefs((prev) => prev.filter((x) => x !== id));

  return (
    <div className="px-6 pb-20">
      <h1 className="mt-8 text-center font-[family-name:var(--font-display)] text-[clamp(28px,4vw,40px)] font-extrabold leading-[1.12] tracking-tight">
        From idea to ready-to-run ads
        <br className="hidden sm:block" /> in minutes with{" "}
        <span className={gradText}>Buzz Agent</span>
      </h1>

      <div className="mx-auto mt-7 max-w-[720px]">
        <div className="rounded-[22px] border border-[#ececf1] bg-white p-3.5 shadow-[0_4px_16px_rgba(26,26,46,0.06)] transition focus-within:border-[#ff5e1a] focus-within:ring-2 focus-within:ring-[#ff5e1a]/20">
          {/* 引用 chips */}
          {(refs.length > 0 || brandKitId) && (
            <div className="mb-2.5 flex flex-wrap gap-2 px-1">
              {brandKitId &&
                (() => {
                  const kit = BRAND_KITS.find((k) => k.id === brandKitId);
                  return kit ? (
                    <BrandChip kit={kit} onRemove={() => setBrandKitId(null)} />
                  ) : null;
                })()}
              {refs.map((id) => {
                const a = ASSET_BY_ID[id];
                return a ? (
                  <RefChip key={id} asset={a} onRemove={() => removeRef(id)} />
                ) : null;
              })}
            </div>
          )}

          <div className="relative">
            <textarea
              value={draft}
              onChange={handleChange}
              rows={2}
              placeholder="Describe your idea or campaign. Use @ or + to reference assets from your library."
              className="w-full resize-none bg-transparent px-2 pt-1 text-[15px] leading-relaxed text-[#1a1a2e] outline-none placeholder:text-[#9a9bb0]"
            />

            {/* 「@」引用小窗 */}
            {mentionOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setMentionOpen(false)}
                />
                <div className="absolute left-1 top-9 z-40 w-[288px] overflow-hidden rounded-2xl border border-[#ececf1] bg-white py-2 shadow-[0_16px_40px_rgba(26,26,46,0.16)]">
                  <button
                    onClick={() => {
                      setMentionOpen(false);
                      openPicker(true);
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left transition hover:bg-[#f7f6fa]"
                  >
                    <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#f1f0f4] text-[#6a6b7b]">
                      <FolderOpen className="size-4" />
                    </span>
                    <span className="truncate text-sm text-[#1a1a2e]">
                      Add from assets
                    </span>
                  </button>
                  <div className="mx-3 my-1.5 border-t border-[#ececf1]" />
                  <div className="max-h-[212px] overflow-y-auto">
                    {RAW_ASSETS.filter((a) => a.id === "a1" || a.id === "a2").map((a) => (
                      <button
                        key={a.id}
                        onClick={() => pickMention(a.id)}
                        className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left transition hover:bg-[#f7f6fa]"
                      >
                        <span className="size-7 shrink-0 overflow-hidden rounded-lg bg-[#f1f0f4]">
                          <AssetThumb asset={a} />
                        </span>
                        <span className="truncate text-sm text-[#1a1a2e]">
                          {a.id === "a1" ? "image 1" : a.id === "a2" ? "image 2" : a.title}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 px-1 pt-2">
            <div className="flex items-center gap-2 text-[#6a6b7b]">
              {/* + 菜单 */}
              <div className="relative">
                <button
                  onClick={() => setPlusOpen((o) => !o)}
                  aria-label="Add reference"
                  className={`grid size-8 place-items-center rounded-lg border transition ${
                    plusOpen
                      ? "border-[#ff5e1a] bg-[#fff7f1] text-[#ff5e1a]"
                      : "border-[#ececf1] hover:border-[#ff5e1a] hover:text-[#ff5e1a]"
                  }`}
                >
                  <Plus className="size-4" />
                </button>
                {plusOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setPlusOpen(false)}
                    />
                    <div className="absolute bottom-full left-0 z-40 mb-2 w-[260px] overflow-hidden rounded-2xl border border-[#ececf1] bg-white py-1.5 shadow-[0_16px_40px_rgba(26,26,46,0.16)]">
                      <PlusItem
                        Icon={UploadCloud}
                        title="Local Upload"
                        desc="Support image, video, pdf, audio"
                      />
                      <PlusItem
                        Icon={UserRound}
                        title="Avatar Library"
                        desc="Use AI avatars or upload your own"
                      />
                      <PlusItem
                        Icon={FolderOpen}
                        title="Assets"
                        desc="Reuse generated & uploaded file"
                        onClick={() => openPicker(false)}
                      />
                      <PlusItem
                        Icon={SwatchBook}
                        title="Brand Kits"
                        desc="Apply your brand colors, fonts & voice"
                        onClick={() => {
                          setPlusOpen(false);
                          setBrandPickerOpen(true);
                        }}
                      />
                    </div>
                  </>
                )}
              </div>

              <span className="flex items-center gap-1.5 rounded-lg border border-[#ececf1] px-2.5 py-1.5 text-xs font-semibold">
                <Sparkles className="size-3.5 text-[#ff5e1a]" /> Marketing Agent
                <ChevronDown className="size-3.5" />
              </span>
              <span className="hidden items-center gap-1.5 rounded-lg border border-[#ececf1] px-2.5 py-1.5 text-xs font-semibold sm:flex">
                <SlidersHorizontal className="size-3.5" /> Auto
              </span>
              <History className="hidden size-4 text-[#9a9bb0] sm:block" />
            </div>

            <button
              aria-label="Send"
              className={`grid size-9 place-items-center rounded-xl ${ctaGrad} text-white shadow-[0_8px_20px_rgba(255,82,85,0.3)] transition hover:brightness-105`}
            >
              <ArrowUp className="size-4" />
            </button>
          </div>
        </div>
        <p className="mt-3 text-center text-[12.5px] text-[#9a9bb0]">
          演示:点输入框里的 + → Assets 弹出资产选择器;或在框内打 @,就地弹出引用小窗
        </p>
      </div>

      {pickerOpen && (
        <AssetPicker
          initial={refs}
          onAdd={handleAdd}
          onClose={() => setPickerOpen(false)}
        />
      )}

      {brandPickerOpen && (
        <BrandKitPicker
          selectedId={brandKitId}
          onSelect={(id) => {
            setBrandKitId(id);
            setBrandPickerOpen(false);
          }}
          onClose={() => setBrandPickerOpen(false)}
        />
      )}
    </div>
  );
}

function PlusItem({
  Icon,
  title,
  desc,
  onClick,
}: {
  Icon: typeof FolderOpen;
  title: string;
  desc: string;
  onClick?: () => void;
}) {
  const disabled = !onClick;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-start gap-3 px-3.5 py-2.5 text-left transition ${
        disabled
          ? "cursor-default opacity-55"
          : "hover:bg-[#fff7f1]"
      }`}
    >
      <span
        className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg ${
          disabled ? "bg-[#f1f0f4] text-[#9a9bb0]" : "bg-[#fff3ec] text-[#ff5e1a]"
        }`}
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-[13.5px] font-semibold text-[#1a1a2e]">
          {title}
        </span>
        <span className="block text-[12px] leading-snug text-[#9a9bb0]">
          {desc}
        </span>
      </span>
    </button>
  );
}

/* ===================== Asset Library ===================== */
function AssetLibraryView() {
  const [assets] = useState<Asset[]>(RAW_ASSETS);
  const [filter, setFilter] = useState<AssetType | "all" | "favorites">("all");
  const [source, setSource] = useState<"all" | "ai" | "upload">("all");
  const [query, setQuery] = useState("");
  const [favIds, setFavIds] = useState<Set<string>>(
    () => new Set(RAW_ASSETS.filter((a) => a.favorite).map((a) => a.id)),
  );
  const [sortOrder, setSortOrder] = useState<"modified" | "created" | "alpha">(
    "modified",
  );
  const [menu, setMenu] = useState<"sort" | "source" | "type" | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{
    count: number;
    fromSelect: boolean;
  } | null>(null);
  // 演示用:强制空状态。"global"=整库空, "tab"=单类型空
  const [demoEmpty, setDemoEmpty] = useState<null | "global" | "tab">(null);

  const toggleFav = (id: string) =>
    setFavIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const visible = useMemo(() => {
    if (demoEmpty) return [];
    let list = assets;
    if (filter === "favorites") list = list.filter((a) => favIds.has(a.id));
    else if (filter !== "all") list = list.filter((a) => a.type === filter);
    if (source !== "all") list = list.filter((a) => a.source === source);
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((a) => a.title.toLowerCase().includes(q));
    // RAW_ASSETS is authored newest-first (= last modified)
    if (sortOrder === "alpha")
      return [...list].sort((a, b) => a.title.localeCompare(b.title));
    if (sortOrder === "created") return [...list].reverse();
    return list;
  }, [assets, filter, source, favIds, sortOrder, query, demoEmpty]);

  const currentLabel = FILTERS.find((f) => f.key === filter)?.label ?? "All";
  // which empty state to show, and its category label
  const emptyLabel =
    demoEmpty === "global"
      ? "all"
      : demoEmpty === "tab"
        ? currentLabel === "All"
          ? "Videos"
          : currentLabel
        : visible.length === 0
          ? currentLabel
          : null;

  // group by day (preserve current order)
  const groups = useMemo(() => {
    const map = new Map<string, Asset[]>();
    for (const a of visible) {
      const day = a.createdAt.split(",")[0];
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(a);
    }
    return [...map.entries()];
  }, [visible]);

  const open = assets.find((a) => a.id === openId) || null;

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const exitSelect = () => {
    setSelecting(false);
    setSelected(new Set());
  };

  return (
    <div className="px-6 pb-24 pt-6">
      {/* heading */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="font-[family-name:var(--font-display)] text-[clamp(26px,3.4vw,36px)] font-extrabold leading-tight tracking-tight">
          Assets
        </h1>
        <div className="flex shrink-0 items-center gap-2">
          {/* search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9a9bb0]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search assets..."
              className="w-56 rounded-lg border border-[#d8d7e0] bg-white py-1.5 pl-9 pr-3 text-sm font-medium text-[#1a1a2e] placeholder:text-[#9a9bb0] focus:border-[#ff8a5c] focus:outline-none"
            />
          </div>
          <button
            onClick={() => flash("Upload dialog (demo)")}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg ${ctaGrad} px-4 py-1.5 text-sm font-bold text-white shadow-[0_6px_16px_rgba(255,82,85,0.26)] transition hover:brightness-105`}
          >
            <Upload className="size-4" /> Upload
          </button>
        </div>
      </div>

      {/* filter row (hidden when empty) */}
      {demoEmpty !== "global" && (
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {/* favorites toggle */}
        <Pill
          active={filter === "favorites"}
          onClick={() =>
            setFilter(filter === "favorites" ? "all" : "favorites")
          }
        >
          <Heart
            className={`size-4 ${filter === "favorites" ? "fill-current" : ""}`}
          />
          Favorites
        </Pill>

        {/* type */}
        <div className="relative">
          <Pill
            caret
            active={filter !== "all" && filter !== "favorites"}
            onClick={() => setMenu(menu === "type" ? null : "type")}
          >
            {filter !== "all" && filter !== "favorites"
              ? (FILTERS.find((f) => f.key === filter)?.label ?? "All types")
              : "All types"}
          </Pill>
          {menu === "type" && (
            <Dropdown align="left" onClose={() => setMenu(null)}>
              {PICKER_FILTERS.map((f) => (
                <MenuItem
                  key={f.key}
                  label={f.key === "all" ? "All types" : f.label}
                  active={filter === f.key}
                  onClick={() => {
                    setFilter(f.key as AssetType | "all");
                    setMenu(null);
                  }}
                />
              ))}
            </Dropdown>
          )}
        </div>

        {/* source */}
        <div className="relative">
          <Pill
            caret
            active={source !== "all"}
            onClick={() => setMenu(menu === "source" ? null : "source")}
          >
            {source === "all"
              ? "All sources"
              : source === "ai"
                ? "Generated"
                : "Uploaded"}
          </Pill>
          {menu === "source" && (
            <Dropdown align="left" onClose={() => setMenu(null)}>
              <MenuItem label="All sources" active={source === "all"} onClick={() => { setSource("all"); setMenu(null); }} />
              <MenuItem label="Generated" active={source === "ai"} onClick={() => { setSource("ai"); setMenu(null); }} />
              <MenuItem label="Uploaded" active={source === "upload"} onClick={() => { setSource("upload"); setMenu(null); }} />
            </Dropdown>
          )}
        </div>

        {/* sort */}
        <div className="relative">
          <Pill
            caret
            active={sortOrder !== "modified"}
            onClick={() => setMenu(menu === "sort" ? null : "sort")}
          >
            {sortOrder === "modified"
              ? "Last modified"
              : sortOrder === "created"
                ? "Date created"
                : "Alphabetical"}
          </Pill>
          {menu === "sort" && (
            <Dropdown align="left" onClose={() => setMenu(null)}>
              <MenuItem label="Last modified" active={sortOrder === "modified"} onClick={() => { setSortOrder("modified"); setMenu(null); }} />
              <MenuItem label="Date created" active={sortOrder === "created"} onClick={() => { setSortOrder("created"); setMenu(null); }} />
              <MenuItem label="Alphabetical" active={sortOrder === "alpha"} onClick={() => { setSortOrder("alpha"); setMenu(null); }} />
            </Dropdown>
          )}
        </div>

        {/* select (multi-select) */}
        <Pill
          bare
          active={selecting}
          onClick={() => (selecting ? exitSelect() : setSelecting(true))}
          className="ml-auto"
        >
          <ListChecks className="size-4" />
          {selecting ? "Done" : "Select"}
        </Pill>
      </div>
      )}

      {/* content grouped by date */}
      {emptyLabel ? (
        <EmptyState label={emptyLabel} />
      ) : (
        <div>
          {groups.map(([day, items]) => (
            <section key={day}>
              <div className="grid [grid-template-columns:repeat(auto-fill,minmax(190px,1fr))]">
                {items.map((a) => (
                  <AssetCard
                    key={a.id}
                    asset={a}
                    selecting={selecting}
                    selected={selected.has(a.id)}
                    favorited={favIds.has(a.id)}
                    onOpen={() => setOpenId(a.id)}
                    onToggleSelect={() => toggleSelect(a.id)}
                    onToggleFav={() => toggleFav(a.id)}
                    onDownload={() => flash(`Downloading ${a.title}`)}
                    onDelete={() =>
                      setPendingDelete({ count: 1, fromSelect: false })
                    }
                  />
                ))}
              </div>
            </section>
          ))}
          <p className="pt-2 text-center text-xs text-[#b4b4c2]">
            You've reached the bottom
          </p>
        </div>
      )}

      {/* batch action bar */}
      {selecting && selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-2xl bg-[#1a1a2e] px-3 py-2.5 text-white shadow-[0_16px_36px_rgba(26,26,46,0.28)]">
          <span className="px-2 text-sm font-bold tabular-nums">
            {selected.size} selected
          </span>
          <span className="h-5 w-px bg-white/15" />
          <button onClick={() => flash(`Downloading ${selected.size} assets`)} className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold transition hover:bg-white/10">
            <Download className="size-4" /> Download
          </button>
          <button
            onClick={() => {
              setFavIds((prev) => new Set([...prev, ...selected]));
              flash(`Added ${selected.size} to favorites`);
            }}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold transition hover:bg-white/10"
          >
            <Heart className="size-4" /> Favorite
          </button>
          <button onClick={() => setPendingDelete({ count: selected.size, fromSelect: true })} className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold text-[#ff8a8a] transition hover:bg-white/10">
            <Trash2 className="size-4" /> Delete
          </button>
          <span className="h-5 w-px bg-white/15" />
          <button onClick={exitSelect} className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold transition hover:bg-white/10">
            <X className="size-4" /> Cancel
          </button>
        </div>
      )}

      {/* detail drawer */}
      {open && (
        <DetailDrawer
          asset={open}
          onClose={() => setOpenId(null)}
          flash={flash}
          favorited={favIds.has(open.id)}
          onToggleFav={() => toggleFav(open.id)}
          onPrev={(() => {
            const i = visible.findIndex((a) => a.id === open.id);
            return i > 0 ? () => setOpenId(visible[i - 1].id) : undefined;
          })()}
          onNext={(() => {
            const i = visible.findIndex((a) => a.id === open.id);
            return i < visible.length - 1
              ? () => setOpenId(visible[i + 1].id)
              : undefined;
          })()}
        />
      )}

      {/* delete confirmation */}
      {pendingDelete && (
        <ConfirmDelete
          count={pendingDelete.count}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            flash(
              `Deleted ${pendingDelete.count} ${pendingDelete.count > 1 ? "assets" : "asset"}`,
            );
            if (pendingDelete.fromSelect) exitSelect();
            setOpenId(null);
            setPendingDelete(null);
          }}
        />
      )}

      {/* 演示控制:切换两种空状态(非产品 UI,固定右下角) */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
        <DemoToggle
          active={demoEmpty === "global"}
          label="演示:全局空状态"
          onClick={() =>
            setDemoEmpty((v) => (v === "global" ? null : "global"))
          }
        />
        <DemoToggle
          active={demoEmpty === "tab"}
          label="演示:类型空状态"
          onClick={() => setDemoEmpty((v) => (v === "tab" ? null : "tab"))}
        />
      </div>

      {/* toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#1a1a2e] px-4 py-2 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function Pill({
  children,
  onClick,
  active,
  caret,
  bare,
  className = "",
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  caret?: boolean;
  bare?: boolean;
  className?: string;
}) {
  const variant = bare
    ? active
      ? "bg-[#fff3ec] text-[#ff5e1a]"
      : "text-[#4a4b5c] hover:bg-[#f4f3f7] hover:text-[#1a1a2e]"
    : active
      ? "border border-[#ffd4bf] bg-[#fff3ec] text-[#ff5e1a]"
      : "border border-[#d8d7e0] bg-white text-[#4a4b5c] hover:border-[#c2c1cc] hover:text-[#1a1a2e]";
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition ${variant} ${className}`}
    >
      {children}
      {caret && <ChevronDown className="size-3.5 opacity-60" />}
    </button>
  );
}

function Dropdown({
  children,
  onClose,
  align = "left",
}: {
  children: React.ReactNode;
  onClose: () => void;
  align?: "left" | "right";
}) {
  return (
    <>
      <button
        className="fixed inset-0 z-30 cursor-default"
        onClick={onClose}
        aria-label="Close menu"
        tabIndex={-1}
      />
      <div
        className={`absolute top-full z-40 mt-1 min-w-[180px] rounded-xl border border-[#ececf1] bg-white p-1 shadow-[0_12px_36px_rgba(26,26,46,0.16)] ${
          align === "right" ? "right-0" : "left-0"
        }`}
      >
        {children}
      </div>
    </>
  );
}

function MenuItem({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold text-[#1a1a2e] transition hover:bg-[#fff7f1]"
    >
      {label}
      {active && <Check className="size-4 text-[#ff5e1a]" />}
    </button>
  );
}

function AssetCard({
  asset,
  selecting,
  selected,
  favorited,
  onOpen,
  onToggleSelect,
  onToggleFav,
  onDownload,
  onDelete,
}: {
  asset: Asset;
  selecting: boolean;
  selected: boolean;
  favorited: boolean;
  onOpen: () => void;
  onToggleSelect: () => void;
  onToggleFav: () => void;
  onDownload: () => void;
  onDelete: () => void;
}) {
  const isMedia =
    asset.type === "image" ||
    asset.type === "video" ||
    asset.type === "avatar";
  const videoRef = useRef<HTMLVideoElement>(null);
  return (
    <div
      onClick={selecting ? onToggleSelect : onOpen}
      onMouseEnter={() => {
        if (asset.type === "video") videoRef.current?.play().catch(() => {});
      }}
      onMouseLeave={() => {
        const v = videoRef.current;
        if (v) {
          v.pause();
          v.currentTime = 0;
        }
      }}
      className={`group relative aspect-square w-full cursor-pointer overflow-hidden bg-[#f1f0f4] transition hover:opacity-90 ${
        selected ? "z-10 ring-2 ring-inset ring-[#ff5e1a]" : ""
      }`}
    >
      {/* hover quick actions: download / delete appear on hover (no reserved
          space); favorite stays flush in the corner, persistent when favorited */}
      {!selecting && (
        <div className="absolute right-2 top-2 z-10 flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
            aria-label="Download"
            className="hidden size-7 place-items-center rounded-md bg-black/40 text-white backdrop-blur transition hover:bg-black/55 group-hover:grid"
          >
            <Download className="size-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label="Delete"
            className="hidden size-7 place-items-center rounded-md bg-black/40 text-white backdrop-blur transition hover:bg-[#e05656] group-hover:grid"
          >
            <Trash2 className="size-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFav();
            }}
            aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
            className={`size-7 place-items-center rounded-md bg-black/40 text-white backdrop-blur transition hover:bg-black/55 ${
              favorited ? "grid" : "hidden group-hover:grid"
            }`}
          >
            <Heart
              className={`size-3.5 ${favorited ? "fill-[#ff5e1a] text-[#ff5e1a]" : ""}`}
            />
          </button>
        </div>
      )}
      {selecting && (
        <span
          className={`absolute left-2 top-2 z-10 grid size-6 place-items-center rounded-full border-2 transition ${
            selected
              ? "border-transparent bg-[#ff5e1a] text-white"
              : "border-white bg-black/25 text-transparent"
          }`}
        >
          <Check className="size-3.5" strokeWidth={3} />
        </span>
      )}
      {isMedia ? (
        <>
          {asset.type === "video" ? (
            <video
              ref={videoRef}
              src={`${asset.src}#t=0.1`}
              muted
              loop
              playsInline
              preload="metadata"
              className="size-full object-cover"
            />
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={asset.src ?? imgUrl(asset.seed!, 400, 400)}
              alt={asset.title}
              loading="lazy"
              className="size-full object-cover"
            />
          )}
          {asset.type === "video" && (
            <span className="absolute bottom-2 right-2 rounded-md bg-black/55 px-1.5 py-0.5 text-[11px] font-bold text-white">
              {asset.duration}
            </span>
          )}
        </>
      ) : (
        <div className="flex size-full flex-col items-center justify-center gap-3 bg-[#fff7f1] px-4 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-[#ffe7d6] text-[#ff5e1a]">
            {asset.type === "audio" ? (
              <Music className="size-6" />
            ) : (
              <FileText className="size-6" />
            )}
          </span>
          <div className="min-w-0 max-w-full">
            <p className="truncate text-[12.5px] font-semibold text-[#1a1a2e]">
              {asset.title}
            </p>
            <p className="truncate text-[11px] text-[#9a9bb0]">{asset.meta}</p>
          </div>
        </div>
      )}
    </div>
  );
}

const FAN_TILES = [
  {
    src: "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-06-29/329899838449704960.jpg",
    rot: -13,
    y: 16,
    z: 4,
  },
  {
    src: "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-05-28/318341142179557376.png",
    rot: -4,
    y: 2,
    z: 3,
  },
  {
    src: "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-05-28/318341383679193088.png",
    rot: 5,
    y: 6,
    z: 2,
  },
  {
    src: "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-06-29/329899610011131904.png",
    rot: 14,
    y: 16,
    z: 1,
  },
];

function EmptyState({ label = "all" }: { label?: string }) {
  const isAll = label === "all" || label === "All";
  const noun = isAll ? "assets" : label.toLowerCase();
  return (
    <div className="flex min-h-[calc(100vh-180px)] flex-col items-center justify-center text-center">
      {/* fanned preview tiles */}
      <div className="mb-7 flex items-start justify-center">
        {FAN_TILES.map((t) => (
          <span
            key={t.src}
            className="-mx-1 overflow-hidden rounded-2xl shadow-[0_10px_24px_rgba(26,26,46,0.16)]"
            style={{
              transform: `rotate(${t.rot}deg) translateY(${t.y}px)`,
              zIndex: t.z,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={t.src}
              alt=""
              className="h-[100px] w-[88px] object-cover"
            />
          </span>
        ))}
      </div>

      <p className="font-[family-name:var(--font-display)] text-lg font-extrabold text-[#1a1a2e]">
        No {noun} yet
      </p>
      <p className="mt-1 max-w-[58ch] text-sm text-[#6a6b7b]">
        Everything you generate lands here. You can also upload your own images
        and videos to use across the agent and canvas.
      </p>
      <button className={`${ctaBtn} mt-5 flex items-center gap-2`}>
        <Plus className="size-4" /> Generate
      </button>
    </div>
  );
}

function DemoToggle({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border border-dashed px-4 py-2 text-xs font-semibold shadow-sm backdrop-blur transition ${
        active
          ? "border-[#ff5e1a] bg-[#fff3ec] text-[#ff5e1a]"
          : "border-[#d4d3df] bg-white/90 text-[#9a9bb0] hover:border-[#ff5e1a] hover:text-[#ff5e1a]"
      }`}
    >
      {label}
    </button>
  );
}

function ConfirmDelete({
  count,
  onCancel,
  onConfirm,
}: {
  count: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const many = count > 1;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        onClick={onCancel}
        aria-label="Cancel"
        className="absolute inset-0 bg-[#1a1a2e]/40 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-[420px] rounded-2xl bg-white p-6 shadow-[0_24px_70px_rgba(26,26,46,0.34)]">
        <div className="flex items-center justify-center gap-2">
          <CircleAlert className="size-5 text-[#ff5e1a]" />
          <h2 className="font-[family-name:var(--font-display)] text-lg font-extrabold tracking-tight text-[#1a1a2e]">
            {many ? `Delete ${count} assets?` : "Delete asset?"}
          </h2>
        </div>
        <p className="mt-3 text-center text-sm leading-relaxed text-[#6a6b7b]">
          This action cannot be undone. Are you sure you want to delete{" "}
          {many ? "them" : "it"}?
        </p>
        <div className="mt-6 flex justify-center gap-2.5">
          <button onClick={onCancel} className={ghostBtn}>
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-xl bg-[#e24b4a] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#cf3f3e] active:translate-y-[1px]"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

const DETAIL_ACTIONS: { icon: typeof Video; label: string }[] = [
  { icon: RefreshCw, label: "Regenerate" },
  { icon: Frame, label: "Edit in canvas" },
  { icon: Video, label: "Generate video" },
  { icon: ExternalLink, label: "Go to session" },
];

function DetailDrawer({
  asset,
  onClose,
  flash,
  favorited,
  onToggleFav,
  onPrev,
  onNext,
}: {
  asset: Asset;
  onClose: () => void;
  flash: (m: string) => void;
  favorited: boolean;
  onToggleFav: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  const isMedia =
    asset.type === "image" || asset.type === "avatar" || asset.type === "video";
  // variant thumbnails (prototype: reuse a few library images)
  const thumbs = [
    asset.src ?? imgUrl(asset.seed ?? "x", 200, 200),
    "/prototypes/asset-library/images/img-01.jpg",
    "/prototypes/asset-library/images/img-02.jpg",
    "/prototypes/asset-library/images/img-03.jpg",
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <button
        onClick={onClose}
        className="absolute inset-0 bg-[#1a1a2e]/50 backdrop-blur-sm"
        aria-label="Close"
      />
      <div className="relative flex h-[84vh] w-full max-w-[1400px] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_70px_rgba(26,26,46,0.34)]">
        {/* top bar */}
        <div className="flex shrink-0 items-center justify-between px-4 py-2.5">
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid size-9 place-items-center rounded-lg text-[#6a6b7b] transition hover:bg-[#f4f3f7] hover:text-[#1a1a2e]"
          >
            <X className="size-5" />
          </button>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => flash("Download started")}
              className="flex items-center gap-1.5 rounded-lg border border-[#ececf1] bg-white px-4 py-2 text-sm font-bold text-[#1a1a2e] shadow-sm transition hover:bg-[#f4f3f7]"
            >
              <Download className="size-4" /> Download
            </button>
            <button
              onClick={onToggleFav}
              aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
              className="grid size-9 place-items-center rounded-lg text-[#6a6b7b] transition hover:bg-[#f4f3f7]"
            >
              <Heart
                className={`size-5 ${favorited ? "fill-[#ff5e1a] text-[#ff5e1a]" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* body */}
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          {/* main preview */}
          <div className="relative flex min-h-[260px] flex-1 items-center justify-center bg-white p-6 pr-20">
            {asset.type === "video" ? (
              <video
                src={asset.src}
                controls
                playsInline
                className="max-h-full max-w-full rounded-lg bg-black object-contain"
              />
            ) : asset.type === "image" || asset.type === "avatar" ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={asset.src ?? imgUrl(asset.seed!, 1000, 1000)}
                alt={asset.title}
                className="max-h-full max-w-full rounded-lg object-contain"
              />
            ) : asset.type === "audio" ? (
              <div className="flex w-full flex-col items-center gap-4">
                <Music className="size-14 text-[#b4b4c2]" />
                <audio src={asset.src} controls className="w-full max-w-[360px]" />
              </div>
            ) : asset.type === "pdf" ? (
              <div className="absolute inset-6 right-20 overflow-y-auto rounded-lg border border-[#ececf1] bg-[#f4f3f7]">
                <div className="flex flex-col items-center gap-3 p-3">
                  {PDF_PAGES.map((src, i) => (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      key={i}
                      src={src}
                      alt={`${asset.title} — page ${i + 1}`}
                      loading="lazy"
                      className="w-full max-w-[520px] rounded-md bg-white shadow-[0_4px_14px_rgba(26,26,46,0.10)]"
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-[#b4b4c2]">
                <FileText className="size-14" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {asset.meta}
                </span>
              </div>
            )}
            {/* prev / next */}
            {(onPrev || onNext) && (
              <div className="absolute right-4 top-1/2 flex -translate-y-1/2 flex-col gap-2">
                <button
                  onClick={onPrev}
                  disabled={!onPrev}
                  aria-label="Previous"
                  className="grid size-9 place-items-center rounded-full bg-white text-[#1a1a2e] shadow-md transition hover:bg-[#fff7f1] disabled:opacity-30"
                >
                  <ChevronUp className="size-5" />
                </button>
                <button
                  onClick={onNext}
                  disabled={!onNext}
                  aria-label="Next"
                  className="grid size-9 place-items-center rounded-full bg-white text-[#1a1a2e] shadow-md transition hover:bg-[#fff7f1] disabled:opacity-30"
                >
                  <ChevronDown className="size-5" />
                </button>
              </div>
            )}
          </div>

          {/* sidebar */}
          <div className="flex w-full shrink-0 flex-col overflow-y-auto md:w-[340px]">
            <div className="p-5">
              {/* reference images */}
              {isMedia && (
                <div className="mb-5">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#b4b4c2]">
                    Reference Images
                  </p>
                  <div className="flex gap-2">
                    {thumbs.map((t, i) => (
                      <span
                        key={i}
                        className="aspect-square w-[58px] overflow-hidden rounded-lg ring-1 ring-[#ececf1]"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={t} alt="" className="size-full object-cover" />
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[11px] font-bold uppercase tracking-wider text-[#b4b4c2]">
                Prompt
              </p>
              <p className="mt-1 text-sm leading-relaxed text-[#1a1a2e]">
                {asset.prompt}
              </p>

              {/* model config */}
              <div className="mt-5">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#b4b4c2]">
                  Model Config
                </p>
                <dl className="space-y-1.5">
                  <ConfigRow k="Model" v={asset.model} />
                  {asset.type !== "audio" && asset.type !== "pdf" ? (
                    <>
                      <ConfigRow
                        k="Aspect Ratio"
                        v={
                          asset.ratio === "portrait"
                            ? "3:4"
                            : asset.ratio === "landscape"
                              ? "4:3"
                              : "1:1"
                        }
                      />
                      <ConfigRow
                        k="Resolution"
                        v={asset.type === "video" ? "720p" : "2048 px"}
                      />
                      {asset.type === "video" && (
                        <ConfigRow k="Duration" v={asset.duration ?? "-"} />
                      )}
                    </>
                  ) : (
                    <ConfigRow k="File" v={asset.meta ?? "-"} />
                  )}
                  <ConfigRow
                    k="Source"
                    v={asset.source === "ai" ? "AI generated" : "User uploaded"}
                  />
                </dl>
              </div>
            </div>

            {/* action grid */}
            <div className="mt-auto p-3">
              <div className="grid grid-cols-2 gap-1.5">
                {DETAIL_ACTIONS.map(({ icon: Icon, label }) => (
                  <button
                    key={label}
                    onClick={() => flash(label)}
                    className="group/act flex items-center gap-2 rounded-lg border border-[#ececf1] bg-white px-3 py-2.5 text-left text-[13px] font-semibold text-[#1a1a2e] transition hover:border-[#ff5e1a] hover:bg-[#fff7f1] hover:text-[#ff5e1a]"
                  >
                    <Icon className="size-4 shrink-0 text-[#6a6b7b] transition group-hover/act:text-[#ff5e1a]" />
                    <span className="truncate">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfigRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-4 text-[13px]">
      <dt className="w-28 shrink-0 text-[#9a9bb0]">{k}</dt>
      <dd className="text-[#1a1a2e]">{v}</dd>
    </div>
  );
}

/* ===================== Brand Kits ===================== */
function BrandKitsView() {
  const [openKit, setOpenKit] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  // 演示用:强制空状态(非产品 UI,固定右下角)
  const [demoEmpty, setDemoEmpty] = useState(false);
  const kit = BRAND_KITS.find((k) => k.id === openKit) || null;

  if (kit) {
    return <BrandKitDetail kit={kit} onBack={() => setOpenKit(null)} />;
  }

  const isEmpty = demoEmpty || BRAND_KITS.length === 0;

  return (
    <div className="px-6 pb-24 pt-6">
      {creating && <CreateBrandKitModal onClose={() => setCreating(false)} />}
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="font-[family-name:var(--font-display)] text-[clamp(26px,3.4vw,36px)] font-extrabold leading-tight tracking-tight">
          Brand Kits
        </h1>
        {!isEmpty && (
          <button
            onClick={() => setCreating(true)}
            className={`flex items-center gap-1.5 rounded-lg ${ctaGrad} px-3.5 py-2 text-sm font-bold text-white shadow-[0_6px_16px_rgba(255,82,85,0.26)] transition hover:brightness-105`}
          >
            <Plus className="size-4" /> Create
          </button>
        )}
      </div>

      {isEmpty ? (
        <BrandKitsEmpty onCreate={() => setCreating(true)} />
      ) : (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {BRAND_KITS.map((k) => (
          <button
            key={k.id}
            onClick={() => setOpenKit(k.id)}
            className="group rounded-2xl bg-white p-5 text-left shadow-[0_4px_16px_rgba(26,26,46,0.06)] transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <span
                className="grid size-11 place-items-center rounded-xl text-sm font-extrabold text-white"
                style={{ backgroundColor: k.accent }}
              >
                {k.initials}
              </span>
              <div className="min-w-0">
                <p className="truncate font-bold text-[#1a1a2e]">{k.name}</p>
                <p className="truncate text-xs text-[#9a9bb0]">{k.website}</p>
              </div>
            </div>
            <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-[#6a6b7b]">
              {k.description}
            </p>
            <div className="mt-4 flex items-center gap-1.5">
              {k.colors.map((c) => (
                <span
                  key={c}
                  className="size-5 rounded-full border border-black/5"
                  style={{ backgroundColor: c }}
                />
              ))}
              <span className="ml-auto flex items-center gap-1 text-xs font-bold text-[#ff5e1a] opacity-0 transition group-hover:opacity-100">
                Edit <Pencil className="size-3" />
              </span>
            </div>
          </button>
        ))}
      </div>
      )}

      {/* 演示控制:切换空状态(非产品 UI,固定右下角) */}
      <div className="fixed bottom-6 right-6 z-40">
        <DemoToggle
          active={demoEmpty}
          label="演示:品牌资产空状态"
          onClick={() => setDemoEmpty((v) => !v)}
        />
      </div>
    </div>
  );
}

function BrandKitsEmpty({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex min-h-[calc(100vh-180px)] flex-col items-center justify-center text-center">
      {/* placeholder brand kit card */}
      <div className="relative mb-8">
        <div className="absolute -inset-3 -rotate-6 rounded-3xl bg-[#fff3ec]" />
        <div className="relative w-[260px] rounded-2xl border border-[#f0eff4] bg-white p-5 text-left shadow-[0_14px_34px_rgba(26,26,46,0.12)]">
          <div className="flex items-center gap-3">
            <span className={`grid size-11 place-items-center rounded-xl ${ctaGrad} text-white`}>
              <SwatchBook className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <span className="block h-2.5 w-3/4 rounded-full bg-[#ececf1]" />
              <span className="mt-1.5 block h-2 w-1/2 rounded-full bg-[#f3f2f6]" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <span className="block h-2 w-full rounded-full bg-[#f3f2f6]" />
            <span className="block h-2 w-4/5 rounded-full bg-[#f3f2f6]" />
          </div>
          <div className="mt-5 flex items-center gap-1.5">
            {["#ff5e1a", "#ffd23c", "#1a1a2e", "#fff3ec"].map((c) => (
              <span
                key={c}
                className="size-5 rounded-full border border-black/5"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </div>

      <p className="font-[family-name:var(--font-display)] text-lg font-extrabold text-[#1a1a2e]">
        No brand kits yet
      </p>
      <p className="mt-1 max-w-[52ch] text-sm text-[#6a6b7b]">
        Save your logo, colors, fonts and tone of voice in a brand kit, so every
        ad stays on-brand.
      </p>
      <button
        onClick={onCreate}
        className={`${ctaBtn} mt-5 flex items-center gap-2`}
      >
        <Plus className="size-4" /> Create brand kit
      </button>
    </div>
  );
}

/* ---------- Create brand kit: input → fetching → brand DNA editor ---------- */
const EXTRACTION_TEXTS = [
  "Reading your website…",
  "Extracting logo & colors…",
  "Detecting typography…",
  "Learning your brand voice…",
];

type ExtractedDNA = {
  brandName: string;
  initials: string;
  accent: string;
  colors: string[];
  fonts: string[];
  knowledge: string;
  countries: string[];
  languages: string[];
  categories: string[];
  audience: string[];
};
const EXTRACTED_DNA: ExtractedDNA = {
  brandName: "Aurelia",
  initials: "AU",
  accent: "#ff5e1a",
  colors: ["#ff5e1a", "#1a1a2e", "#ffd23c", "#fff3ec"],
  fonts: ["Plus Jakarta Sans", "Inter"],
  knowledge:
    "Aurelia is a clean, dermatologist-backed skincare brand. Tone of voice is calm, precise and reassuring — confident without being clinical, warm without being fluffy.",
  countries: ["United States", "United Kingdom"],
  languages: ["English"],
  categories: ["Skincare", "Beauty"],
  audience: ["Women 25–40", "Skincare enthusiasts"],
};

function CreateBrandKitModal({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<"input" | "fetching" | "result">("input");
  const [url, setUrl] = useState("");
  const [ti, setTi] = useState(0);

  // 演示用:loading 文案轮播 + 自动进入结果态
  useEffect(() => {
    if (phase !== "fetching") return;
    const rot = setInterval(
      () => setTi((p) => Math.min(p + 1, EXTRACTION_TEXTS.length - 1)),
      1100,
    );
    const done = setTimeout(() => setPhase("result"), 4200);
    return () => {
      clearInterval(rot);
      clearTimeout(done);
    };
  }, [phase]);

  const wide = phase === "result";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute inset-0 bg-[#1a1a2e]/40 backdrop-blur-sm"
      />
      <div
        className={`relative w-full overflow-hidden rounded-2xl bg-white shadow-[0_24px_70px_rgba(26,26,46,0.34)] transition-[max-width] ${
          wide ? "max-w-[680px]" : "max-w-[440px]"
        }`}
      >
        {phase === "result" ? (
          <BrandDNAEditor dna={EXTRACTED_DNA} url={url} onClose={onClose} />
        ) : (
          <div className="p-6">
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute right-3 top-3 grid size-8 place-items-center rounded-lg text-[#9a9bb0] transition hover:bg-[#f4f3f7] hover:text-[#1a1a2e]"
            >
              <X className="size-4" />
            </button>

            {phase === "input" ? (
              <>
                <h2 className="font-[family-name:var(--font-display)] text-xl font-extrabold tracking-tight">
                  Create brand kit
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-[#6a6b7b]">
                  Paste your website and we&apos;ll extract all your brand
                  assets.
                </p>

                <label className="mt-5 mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#b4b4c2]">
                  Website
                </label>
                <input
                  autoFocus
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Enter URL"
                  className="w-full rounded-xl border border-[#ececf1] bg-white px-3.5 py-2.5 text-sm text-[#1a1a2e] outline-none transition placeholder:text-[#b4b4c2] focus:border-[#ff5e1a] focus:ring-2 focus:ring-[#ff5e1a]/20"
                />

                <button
                  onClick={() => setPhase("fetching")}
                  className={`${ctaBtn} mt-5 flex w-full items-center justify-center gap-2`}
                >
                  <Wand2 className="size-4" /> Fetch brand assets
                </button>
                <button
                  onClick={onClose}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-[#6a6b7b] transition hover:bg-[#f4f3f7]"
                >
                  <Upload className="size-4" /> Upload your own
                </button>
              </>
            ) : (
              // fetching
              <div className="flex flex-col items-center px-2 py-10 text-center">
                <span className="relative grid size-16 place-items-center">
                  <span className={`absolute inset-0 rounded-2xl ${ctaGrad} opacity-15`} />
                  <span className="size-9 animate-spin rounded-full border-[3px] border-[#ffd9c2] border-t-[#ff5e1a]" />
                </span>
                <h2 className="mt-5 font-[family-name:var(--font-display)] text-xl font-extrabold tracking-tight">
                  Fetching brand assets
                </h2>
                <p className="mt-1.5 text-sm text-[#9a9bb0]">
                  {url.trim() || "your website"}
                </p>
                <p className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#6a6b7b]">
                  <Sparkles className="size-4 text-[#ff5e1a]" />
                  {EXTRACTION_TEXTS[ti]}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function BrandDNAEditor({
  dna,
  url,
  onClose,
}: {
  dna: ExtractedDNA;
  url: string;
  onClose: () => void;
}) {
  const [v, setV] = useState<DNAFields>({
    name: dna.brandName,
    colors: dna.colors,
    fonts: dna.fonts,
    knowledge: dna.knowledge,
    countries: dna.countries,
    languages: dna.languages,
    categories: dna.categories,
    audience: dna.audience,
  });
  const set = <K extends keyof DNAFields>(k: K, val: DNAFields[K]) =>
    setV((p) => ({ ...p, [k]: val }));

  return (
    <div className="flex max-h-[88vh] flex-col">
      {/* header */}
      <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-[#f0eff4] bg-white px-6 pt-5 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-extrabold tracking-tight">
              Edit your Brand DNA
            </h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#fff3ec] px-2.5 py-1 text-[11px] font-bold text-[#ff5e1a]">
              <Check className="size-3" /> Extracted
            </span>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-[#6a6b7b]">
            Review what Buzz pulled from{" "}
            <span className="font-semibold text-[#1a1a2e]">
              {url.trim() || "your website"}
            </span>{" "}
            before saving your brand kit.
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="grid size-8 shrink-0 place-items-center rounded-lg text-[#9a9bb0] transition hover:bg-[#f4f3f7] hover:text-[#1a1a2e]"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* body */}
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        <BrandDNAFields
          v={v}
          set={set}
          accent={dna.accent}
          initials={dna.initials}
        />
      </div>

      {/* footer */}
      <div className="sticky bottom-0 flex justify-end gap-3 border-t border-[#f0eff4] bg-white px-6 py-4">
        <button onClick={onClose} className={ghostBtn}>
          Cancel
        </button>
        <button onClick={onClose} className={ctaBtn}>
          Save brand kit
        </button>
      </div>
    </div>
  );
}

/* ---------- Shared Brand DNA editable fields (create flow + kit detail) ---------- */
type DNAFields = {
  name: string;
  colors: string[];
  fonts: string[];
  knowledge: string;
  countries: string[];
  languages: string[];
  categories: string[];
  audience: string[];
};

type BrandDoc = { name: string; size: string };
// 演示用:点击上传位时轮流追加这几个假文档
const MOCK_DOCS: BrandDoc[] = [
  { name: "Brand-guidelines.pdf", size: "2.4 MB" },
  { name: "Tone-of-voice.pdf", size: "880 KB" },
  { name: "Product-catalog-2026.pdf", size: "5.1 MB" },
];

function BrandDNAFields({
  v,
  set,
  accent,
  initials,
  initialDocs,
}: {
  v: DNAFields;
  set: <K extends keyof DNAFields>(k: K, val: DNAFields[K]) => void;
  accent: string;
  initials: string;
  initialDocs?: BrandDoc[];
}) {
  const [docs, setDocs] = useState<BrandDoc[]>(initialDocs ?? []);
  const addMockDoc = () =>
    setDocs((p) => [...p, MOCK_DOCS[p.length % MOCK_DOCS.length]]);

  return (
    <div className="space-y-6">
      <Field label="Brand name">
        <input
          value={v.name}
          onChange={(e) => set("name", e.target.value)}
          className="w-full rounded-xl border border-[#ececf1] bg-white px-3.5 py-2.5 text-sm text-[#1a1a2e] outline-none transition focus:border-[#ff5e1a] focus:ring-2 focus:ring-[#ff5e1a]/20"
        />
      </Field>

      <Field label="Logo">
        <div className="flex items-center gap-4">
          <span
            className="grid size-16 shrink-0 place-items-center rounded-2xl text-xl font-extrabold text-white"
            style={{ backgroundColor: accent }}
          >
            {initials}
          </span>
          <div>
            <button className="inline-flex items-center gap-1.5 rounded-lg border border-[#ececf1] bg-[#f6f6f8] px-3 py-1.5 text-sm font-semibold text-[#1a1a2e] transition hover:border-[#ff5e1a] hover:bg-[#fff7f1]">
              <UploadCloud className="size-4" /> Upload
            </button>
            <p className="mt-1.5 text-xs text-[#9a9bb0]">
              Square image in png, jpg, webp formats, up to 2MB.
            </p>
          </div>
        </div>
      </Field>

      <Field label="Brand colors">
        <div className="grid grid-cols-2 gap-2.5">
          {v.colors.map((c, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-[#ececf1] px-3 py-2 transition focus-within:border-[#ff5e1a] focus-within:ring-2 focus-within:ring-[#ff5e1a]/20"
            >
              <span
                className="relative size-8 shrink-0 overflow-hidden rounded-md border border-black/5"
                style={{ backgroundColor: c }}
              >
                <input
                  type="color"
                  value={c}
                  onChange={(e) =>
                    set(
                      "colors",
                      v.colors.map((x, xi) => (xi === i ? e.target.value : x)),
                    )
                  }
                  className="absolute inset-0 size-full cursor-pointer opacity-0"
                />
              </span>
              <input
                value={c}
                onChange={(e) =>
                  set(
                    "colors",
                    v.colors.map((x, xi) => (xi === i ? e.target.value : x)),
                  )
                }
                className="flex-1 bg-transparent text-sm uppercase tabular-nums text-[#1a1a2e] outline-none"
              />
              <button
                onClick={() =>
                  set(
                    "colors",
                    v.colors.filter((_, xi) => xi !== i),
                  )
                }
                className="grid size-7 shrink-0 place-items-center rounded-lg text-[#b4b4c2] transition hover:bg-[#fff3ec] hover:text-[#ff5e1a]"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
          <button
            onClick={() => set("colors", [...v.colors, "#000000"])}
            className="col-span-2 w-full rounded-xl border-2 border-dashed border-[#e0dfe7] py-2.5 text-sm font-bold text-[#6a6b7b] transition hover:border-[#ff5e1a] hover:text-[#ff5e1a]"
          >
            + Add color
          </button>
        </div>
      </Field>

      <Field label="Typography">
        <div className="grid grid-cols-2 gap-2.5">
          {v.fonts.map((ft, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-xl border border-[#ececf1] py-1.5 pl-3.5 pr-2 transition focus-within:border-[#ff5e1a] focus-within:ring-2 focus-within:ring-[#ff5e1a]/20"
            >
              <input
                value={ft}
                onChange={(e) =>
                  set(
                    "fonts",
                    v.fonts.map((x, xi) => (xi === i ? e.target.value : x)),
                  )
                }
                placeholder="Font name"
                className="flex-1 bg-transparent text-sm text-[#1a1a2e] outline-none"
              />
              <button
                onClick={() =>
                  set(
                    "fonts",
                    v.fonts.filter((_, xi) => xi !== i),
                  )
                }
                className="grid size-7 shrink-0 place-items-center rounded-lg text-[#b4b4c2] transition hover:bg-[#fff3ec] hover:text-[#ff5e1a]"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
          <button
            onClick={() => set("fonts", [...v.fonts, ""])}
            className="col-span-2 w-full rounded-xl border-2 border-dashed border-[#e0dfe7] py-2.5 text-sm font-bold text-[#6a6b7b] transition hover:border-[#ff5e1a] hover:text-[#ff5e1a]"
          >
            + Add font
          </button>
        </div>
      </Field>

      <Field label="Brand knowledge">
        <textarea
          rows={5}
          value={v.knowledge}
          onChange={(e) => set("knowledge", e.target.value)}
          className="w-full resize-none rounded-xl border border-[#ececf1] bg-white px-3.5 py-2.5 text-sm leading-relaxed text-[#1a1a2e] outline-none transition focus:border-[#ff5e1a] focus:ring-2 focus:ring-[#ff5e1a]/20"
        />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Countries">
          <TagEditor
            items={v.countries}
            onChange={(val) => set("countries", val)}
            placeholder="Add a country"
          />
        </Field>
        <Field label="Languages">
          <TagEditor
            items={v.languages}
            onChange={(val) => set("languages", val)}
            placeholder="Add a language"
          />
        </Field>
      </div>

      <Field label="Categories">
        <TagEditor
          items={v.categories}
          onChange={(val) => set("categories", val)}
          placeholder="Add a category"
        />
      </Field>

      <Field label="Target audience">
        <TagEditor
          items={v.audience}
          onChange={(val) => set("audience", val)}
          placeholder="Add an audience segment"
        />
      </Field>

      <Field label="Documents">
        <div className="space-y-2.5">
          {docs.map((d, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-[#ececf1] bg-white px-3 py-2.5"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#fff3ec] text-[#ff5e1a]">
                <FileText className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#1a1a2e]">
                  {d.name}
                </p>
                <p className="text-xs text-[#9a9bb0]">{d.size}</p>
              </div>
              <button
                onClick={() => setDocs((p) => p.filter((_, xi) => xi !== i))}
                className="grid size-7 shrink-0 place-items-center rounded-lg text-[#b4b4c2] transition hover:bg-[#fff3ec] hover:text-[#ff5e1a]"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
          <button
            onClick={addMockDoc}
            className="flex w-full flex-col items-center gap-1.5 rounded-xl border-2 border-dashed border-[#e0dfe7] px-4 py-5 text-center text-[#6a6b7b] transition hover:border-[#ff5e1a] hover:bg-[#fff7f1] hover:text-[#ff5e1a]"
          >
            <Upload className="size-5" />
            <span className="text-sm font-bold">Upload PDF</span>
            <span className="text-xs text-[#9a9bb0]">
              Brand guidelines, tone of voice, product specs — PDF up to 10MB
            </span>
          </button>
        </div>
      </Field>
    </div>
  );
}

function TagEditor({
  items,
  onChange,
  placeholder,
}: {
  items: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");
  function add() {
    const v = draft.trim();
    if (!v || items.includes(v)) return;
    onChange([...items, v]);
    setDraft("");
  }
  return (
    <div className="rounded-xl border border-[#ececf1] bg-white p-2.5 transition focus-within:border-[#ff5e1a] focus-within:ring-2 focus-within:ring-[#ff5e1a]/20">
      <div className="flex flex-wrap gap-1.5">
        {items.map((it) => (
          <span
            key={it}
            className="inline-flex items-center gap-1 rounded-full bg-[#fff3ec] py-1 pl-2.5 pr-1.5 text-xs font-semibold text-[#1a1a2e]"
          >
            {it}
            <button
              onClick={() => onChange(items.filter((x) => x !== it))}
              className="grid size-4 place-items-center rounded-full text-[#c08a6c] transition hover:bg-[#ffd9c2] hover:text-[#ff5e1a]"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className="min-w-[8ch] flex-1 bg-transparent px-1.5 py-1 text-sm text-[#1a1a2e] outline-none placeholder:text-[#b4b4c2]"
        />
      </div>
    </div>
  );
}

function BrandKitDetail({ kit, onBack }: { kit: BrandKit; onBack: () => void }) {
  const [v, setV] = useState<DNAFields>({
    name: kit.name,
    colors: kit.colors,
    fonts: kit.fonts,
    knowledge: kit.knowledge,
    countries: kit.countries,
    languages: kit.languages,
    categories: kit.categories,
    audience: kit.audience,
  });
  const set = <K extends keyof DNAFields>(k: K, val: DNAFields[K]) =>
    setV((p) => ({ ...p, [k]: val }));

  return (
    <div className="px-6 pb-24 pt-6">
      <button
        onClick={onBack}
        className="mb-5 flex items-center gap-1.5 text-sm font-bold text-[#6a6b7b] transition hover:text-[#ff5e1a]"
      >
        <ChevronLeft className="size-4" /> Brand Kits
      </button>

      <div>
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-extrabold tracking-tight">
            {kit.name}
          </h1>
          <button onClick={onBack} className={`${ctaBtn}`}>
            Save changes
          </button>
        </div>

        <div className="mt-6">
          <BrandDNAFields
            v={v}
            set={set}
            accent={kit.accent}
            initials={kit.initials}
            initialDocs={[
              { name: "Brand-guidelines.pdf", size: "2.4 MB" },
              { name: "Tone-of-voice.pdf", size: "880 KB" },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#b4b4c2]">
        {label}
      </label>
      {children}
    </div>
  );
}

/* ============================================================
   Ad Studio — 功能首页 / 创作库(跳脱产品外壳的独立全屏页)
   暗色影院风:featured showcase + My Projects + 分类片墙
   3 套方向:A 影院墙 / B 策展画廊 / C 工作台,底部切换演示
   ============================================================ */

const FS_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

/** 影院海报底图:真实图片,统一压暗做低饱和处理,靠 scrim + 标题成「一图」 */
function poster(seed: string, w = 640, h = 360) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

type FilmRating = "9:16" | "16:9" | "1:1";
type Film = {
  id: string;
  title: string;
  seed: string;
  year: number;
  runtime: string;
  rating: FilmRating;
  logline: string;
};

/** 广告案例母表(跨品类复用):title = 品牌广告 spot,rating 位复用为画幅,runtime 为片长 */
const FILMS: Record<string, Film> = {
  cloudjelly: { id: "cloudjelly", title: "CloudJelly Serum", seed: "ad-serum-dew", year: 2026, runtime: "0:30", rating: "9:16", logline: "Dewy macro hero for a hydrating serum in cool morning light." },
  aurelle: { id: "aurelle", title: "Aurelle Lip", seed: "ad-lip-gloss", year: 2026, runtime: "0:15", rating: "9:16", logline: "Bold color swatch spot with studio gloss and shine." },
  muse: { id: "muse", title: "Muse Mascara", seed: "ad-mascara-lash", year: 2026, runtime: "0:15", rating: "9:16", logline: "Lash macro caught in a mirror reflection." },
  glow: { id: "glow", title: "Glow Tonic", seed: "ad-tonic-dropper", year: 2026, runtime: "0:15", rating: "1:1", logline: "Skincare texture pour from a glass dropper." },
  sol: { id: "sol", title: "Sol Sunscreen", seed: "ad-sunscreen-beach", year: 2026, runtime: "0:30", rating: "9:16", logline: "Sun-flared beach lifestyle spot, skin left glowing." },
  vela: { id: "vela", title: "Vela Fragrance", seed: "ad-perfume-silk", year: 2026, runtime: "0:30", rating: "16:9", logline: "Editorial perfume film of silk, light, and slow motion." },
  foldrunner: { id: "foldrunner", title: "Fold Runner", seed: "ad-sneaker-studio", year: 2026, runtime: "0:20", rating: "9:16", logline: "Kinetic sneaker reveal on a raw concrete set." },
  pace: { id: "pace", title: "Pace Tee", seed: "ad-athlete-motion", year: 2026, runtime: "0:20", rating: "16:9", logline: "Athlete motion cut of sweat, grit, and speed." },
  lumen: { id: "lumen", title: "Lumen Watch", seed: "ad-watch-steel", year: 2026, runtime: "0:15", rating: "9:16", logline: "Wrist close-up, brushed steel against night-city bokeh." },
  halo: { id: "halo", title: "Halo Earbuds", seed: "ad-earbuds-orbit", year: 2026, runtime: "0:15", rating: "1:1", logline: "A 360 product orbit in matte black and chrome." },
  aria: { id: "aria", title: "Aria Speaker", seed: "ad-speaker-dark", year: 2026, runtime: "0:20", rating: "16:9", logline: "Sound-reactive product spot in a dark studio." },
  peachy: { id: "peachy", title: "Peachy Fizz", seed: "ad-drink-splash", year: 2026, runtime: "0:20", rating: "16:9", logline: "Splash-in-motion drink reveal on a dopamine palette." },
  brew: { id: "brew", title: "Brew Co. Cold Brew", seed: "ad-coldbrew-ice", year: 2026, runtime: "0:15", rating: "16:9", logline: "Slow-motion pour over ice, glass beaded with cold." },
  crisp: { id: "crisp", title: "Crisp Kombucha", seed: "ad-kombucha-pour", year: 2026, runtime: "0:15", rating: "9:16", logline: "Fizzy pour with fresh fruit and condensation." },
  nordchair: { id: "nordchair", title: "Nord Chair", seed: "ad-chair-warm", year: 2026, runtime: "0:30", rating: "16:9", logline: "Slow rotating furniture spot in a warm sunlit room." },
  nimbus: { id: "nimbus", title: "Nimbus Sofa", seed: "ad-sofa-daylight", year: 2026, runtime: "0:30", rating: "16:9", logline: "Showroom pan across a sofa in soft daylight." },
  terra: { id: "terra", title: "Terra Candle", seed: "ad-candle-amber", year: 2026, runtime: "0:20", rating: "9:16", logline: "Cozy flame close-up bathed in amber glow." },
};

const ROWS: { label: string; ids: string[] }[] = [
  { label: "Trending", ids: ["cloudjelly", "vela", "peachy", "foldrunner", "lumen", "nimbus", "halo", "sol"] },
  { label: "Beauty & Skincare", ids: ["cloudjelly", "aurelle", "muse", "glow", "sol"] },
  { label: "Fashion & Apparel", ids: ["vela", "foldrunner", "pace", "lumen", "aurelle"] },
  { label: "Food & Drink", ids: ["peachy", "brew", "crisp"] },
  { label: "Website & Mobile Apps", ids: ["lumen", "halo", "aria"] },
  { label: "Home & Living", ids: ["nordchair", "nimbus", "terra"] },
];

type Project = { id: string; name: string; edited: string; scenes: number; seed: string; progress: number };
const FS_PROJECTS: Project[] = [
  { id: "p1", name: "Peachy launch spot", edited: "8 minutes ago", scenes: 2, seed: "fs-proj-peach", progress: 40 },
  { id: "p2", name: "CloudJelly brand film", edited: "30 minutes ago", scenes: 6, seed: "fs-proj-serum", progress: 75 },
  { id: "p3", name: "Founder interview cut", edited: "Yesterday", scenes: 4, seed: "fs-proj-founder", progress: 90 },
];

const FEATURED = FILMS.vela;

/* Light-mode 影院首页:暖白 chrome + 墨色文字 + Buzz 橙作唯一强调色。
   海报本身仍是彩色影像内容(缩略图带底部 scrim 让白色片名可读),
   页面外壳全程 light,不做主题翻转。 */

/* ---------- 影院海报卡 ---------- */
function PosterTile({
  film,
  className = "",
  onOpen,
}: {
  film: Film;
  className?: string;
  onOpen?: (f: Film) => void;
}) {
  return (
    <button
      onClick={() => onOpen?.(film)}
      className={`group relative block shrink-0 overflow-hidden rounded-[12px] bg-[#161619] text-left ring-1 ring-white/10 transition duration-300 hover:-translate-y-0.5 hover:ring-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${className}`}
    >
      <div className="relative aspect-video overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={poster(film.seed)}
          alt={film.title}
          loading="lazy"
          className="size-full object-cover saturate-[0.96] transition duration-500 group-hover:scale-[1.06]"
        />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/75 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-3.5">
          <div className="text-[13.5px] font-semibold leading-tight tracking-tight text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
            {film.title}
          </div>
        </div>
        {/* hover 浮层:加一层暗底让播放键 + logline 可读 */}
        <div className="absolute inset-0 flex flex-col justify-between bg-black/45 p-3.5 opacity-0 transition duration-300 group-hover:opacity-100">
          <div className="flex justify-end">
            <span className="rounded border border-white/30 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-white/85">
              {film.rating}
            </span>
          </div>
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-full bg-white text-[#1a1a2e]">
                <Play className="ml-0.5 size-4" fill="currentColor" />
              </span>
              <span className="grid size-8 place-items-center rounded-full border border-white/40 bg-white/10 text-white backdrop-blur">
                <Plus className="size-4" />
              </span>
            </div>
            <p className="line-clamp-2 text-[11px] font-medium leading-snug text-white/85">
              {film.logline}
            </p>
          </div>
        </div>
      </div>
    </button>
  );
}

/* ---------- 横向片墙(可左右滚) ---------- */
function PosterRow({
  label,
  films,
  tile = "w-[248px]",
  onOpen,
}: {
  label: string;
  films: Film[];
  tile?: string;
  onOpen?: (f: Film) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) =>
    ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.85, behavior: "smooth" });
  return (
    <section className="group/row">
      <div className="mb-3 flex items-center gap-3 px-5 md:px-6">
        <h2 className="text-[19px] font-bold tracking-tight text-[#1a1a2e]">{label}</h2>
        <div className="ml-auto flex items-center gap-1 opacity-0 transition group-hover/row:opacity-100">
          <button
            onClick={() => scroll(-1)}
            className="grid size-8 place-items-center rounded-full border border-[#ececf1] bg-white text-[#5b5b6b] transition hover:bg-[#f5f3f0] hover:text-[#1a1a2e]"
            aria-label="Scroll left"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={() => scroll(1)}
            className="grid size-8 place-items-center rounded-full border border-[#ececf1] bg-white text-[#5b5b6b] transition hover:bg-[#f5f3f0] hover:text-[#1a1a2e]"
            aria-label="Scroll right"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
      <div className="relative">
        <div
          ref={ref}
          className="flex gap-3 overflow-x-auto scroll-smooth px-5 pb-3 pt-1 md:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {films.map((f) => (
            <PosterTile key={f.id + label} film={f} className={tile} onOpen={onOpen} />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-5 bg-gradient-to-r from-[#faf8f5] to-transparent md:w-6" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#faf8f5] to-transparent md:w-12" />
      </div>
    </section>
  );
}

/* ---------- My Projects 行 ---------- */
function ProjectsRow() {
  return (
    <section className="px-5 md:px-6">
      <div className="mb-3 flex items-center gap-3">
        <h2 className="text-[19px] font-bold tracking-tight text-[#1a1a2e]">Your projects</h2>
        <button className="ml-auto flex items-center gap-1 text-[13px] font-semibold text-[#9a9aa8] transition hover:text-[#1a1a2e]">
          All projects <ChevronRight className="size-3.5" />
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-3 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button className="group flex aspect-video w-[248px] shrink-0 flex-col items-center justify-center gap-2 rounded-[12px] border border-dashed border-[#d4d3df] bg-white text-[#6a6b7b] transition hover:border-[#ff5e1a] hover:bg-[#fff7f1] hover:text-[#1a1a2e]">
          <span className="grid size-11 place-items-center rounded-full bg-[#1a1a2e] text-white transition group-hover:scale-105">
            <Plus className="size-5" />
          </span>
          <span className="text-[13px] font-semibold">New project</span>
        </button>
        {FS_PROJECTS.map((p) => (
          <button
            key={p.id}
            className="group relative aspect-video w-[248px] shrink-0 overflow-hidden rounded-[12px] bg-white text-left shadow-[0_2px_10px_rgba(26,26,46,0.06)] ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(26,26,46,0.14)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={poster(p.seed)}
              alt={p.name}
              loading="lazy"
              className="size-full object-cover transition duration-500 group-hover:scale-[1.05]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
            <div className="absolute inset-0 grid place-items-center opacity-0 transition group-hover:opacity-100">
              <span className="grid size-11 place-items-center rounded-full bg-white text-[#1a1a2e]">
                <Play className="ml-0.5 size-5" fill="currentColor" />
              </span>
            </div>
            <div className="absolute inset-x-0 bottom-0 p-3.5">
              <div className="truncate text-[14px] font-semibold text-white">{p.name}</div>
              <div className="mt-0.5 flex items-center gap-2 text-[11px] text-white/70">
                <span>{p.edited}</span>
                <span className="size-0.5 rounded-full bg-white/50" />
                <span>{p.scenes} scenes</span>
              </div>
              <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-white/25">
                <span className="block h-full rounded-full bg-white" style={{ width: `${p.progress}%` }} />
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ---------- Featured showcase(内嵌大 banner) ---------- */
const HERO_SLIDES = [
  {
    video: "https://assets.presslogic.com/buzzvideo/public/2026-06-15/324742732310437888.mp4",
    title: "Luxury Fashion Ads",
    sub: "Editorial fashion films with studio polish. Set the mood, style the looks, and export a runway-ready spot in a click.",
    badges: ["60s Video", "4K Cinematic quality"],
  },
  {
    video: "https://assets.presslogic.com/buzzvideo/public/2026-06-15/324746276853833728.mp4",
    title: "Beauty That Sells",
    sub: "Serum heroes, dewy macro shots, and morning-light routines rendered from a single product photo.",
    badges: ["30s Video", "Product-true"],
  },
  {
    video: "https://assets.presslogic.com/buzzvideo/public/2026-06-15/324763823477153792.mp4",
    title: "Launch Films for Apps",
    sub: "Turn one product screen into a scroll-stopping launch spot for web and mobile.",
    badges: ["45s Video", "Auto storyboard"],
  },
];

function FeaturedHero({
  onOpen,
  onCreate,
}: {
  onOpen?: (f: Film) => void;
  onCreate?: () => void;
}) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % HERO_SLIDES.length), 6000);
    return () => clearInterval(t);
  }, []);
  const slide = HERO_SLIDES[idx];
  return (
    <section className="relative h-[500px] overflow-hidden rounded-2xl md:h-[560px]">
      {HERO_SLIDES.map((s, i) => (
        <video
          key={s.video}
          src={s.video}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className={`absolute inset-0 size-full object-cover transition-opacity duration-700 ${
            i === idx ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/15 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

      {/* 头像浮在影院墙右上角 */}
      <span className="absolute right-5 top-4 z-10 grid size-8 place-items-center rounded-full bg-black/35 text-[13px] font-semibold text-white ring-1 ring-white/40 backdrop-blur">
        M
      </span>

      <div className="absolute inset-0 flex items-end">
          <div key={idx} className="w-full max-w-[680px] p-8 md:p-12">
            <div className="mb-3 flex items-center gap-2">
              {slide.badges.map((b) => (
                <span key={b} className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white backdrop-blur">
                  {b}
                </span>
              ))}
            </div>
            <h1 className="text-[clamp(32px,4.4vw,54px)] font-bold leading-[1.02] tracking-tight text-white drop-shadow-[0_1px_10px_rgba(0,0,0,0.45)]">
              {slide.title}
            </h1>
            <p className="mt-4 max-w-[32rem] text-[15px] leading-relaxed text-white/85">
              {slide.sub}
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button
                onClick={() => onCreate?.()}
                className="inline-flex items-center gap-2 rounded-full bg-[#ff5e1a] px-6 py-3 text-[15px] font-bold text-white transition hover:bg-[#ff6f33] active:translate-y-[1px]"
              >
                <Plus className="size-4" />
                Create Project
              </button>
            </div>
          </div>
        </div>

      {/* 轮播圆点 */}
      <div className="absolute bottom-6 right-8 z-10 flex items-center gap-2">
        {HERO_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            aria-label={`Slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${
              i === idx ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </section>
  );
}

/* ---------- 侧边栏(Ad Studio 自己的壳,light) ---------- */
function HomeSidebar({ onBack, onCreate, onHome, homeActive, projects, onOpenProject }: { onBack: () => void; onCreate?: () => void; onHome?: () => void; homeActive?: boolean; projects?: ProjectSummary[]; onOpenProject?: (id: string) => void }) {
  const [switcherOpen, setSwitcherOpen] = useState(false);
  return (
    <aside className="hidden h-full w-[236px] shrink-0 flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-[#ececf1] lg:flex">
      <div className="relative flex items-center justify-between px-3 pb-2 pt-4">
        <button
          onClick={() => setSwitcherOpen((v) => !v)}
          className="mr-2 flex flex-1 items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-[#f5f3f0]"
        >
          <Clapperboard className="size-[18px] text-[#1a1a2e]" strokeWidth={2} />
          <span className="text-[13px] font-semibold tracking-tight text-[#1a1a2e]">
            Ad Studio
          </span>
          <ChevronsUpDown className="size-3.5 text-[#9a9aa8]" />
        </button>
        <button className="text-[#9a9aa8] transition hover:text-[#1a1a2e]" aria-label="Collapse">
          <PanelLeft className="size-[17px]" />
        </button>

        {switcherOpen && (
          <>
            <button
              className="fixed inset-0 z-30 cursor-default"
              aria-hidden
              onClick={() => setSwitcherOpen(false)}
            />
            <div className="absolute inset-x-3 top-[54px] z-40 overflow-hidden rounded-xl bg-white p-1 shadow-2xl shadow-black/10 ring-1 ring-[#ececf1]">
              <button className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition hover:bg-[#f5f3f0]">
                <Clapperboard className="size-[17px] text-[#1a1a2e]" strokeWidth={2} />
                <span className="text-[13px] font-medium text-[#1a1a2e]">Ad Studio</span>
                <Check className="ml-auto size-4 text-[#ff8a50]" />
              </button>
              <button
                onClick={() => {
                  setSwitcherOpen(false);
                  onBack();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition hover:bg-[#f5f3f0]"
              >
                <span className={`grid size-[18px] shrink-0 place-items-center rounded-md ${ctaGrad} text-white`}>
                  <Sparkles className="size-3" />
                </span>
                <span className="text-[13px] font-medium text-[#5b5b6b]">BuzzVideo AI</span>
              </button>
            </div>
          </>
        )}
      </div>

      <div className="space-y-0.5 px-3 pt-1">
        <button
          onClick={() => onHome?.()}
          className={
            "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-semibold transition " +
            (homeActive
              ? "bg-[#e9e5df] text-[#1a1a2e]"
              : "text-[#1a1a2e] hover:bg-[#f5f3f0]")
          }
        >
          <House className="size-[18px] shrink-0" strokeWidth={2} />
          Home
        </button>
        <button className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-semibold text-[#1a1a2e] transition hover:bg-[#f5f3f0]">
          <LayoutGrid className="size-[18px] shrink-0" strokeWidth={2} />
          All generations
        </button>
        <button className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-semibold text-[#1a1a2e] transition hover:bg-[#f5f3f0]">
          <Heart className="size-[18px] shrink-0" strokeWidth={2} />
          My favorites
        </button>
      </div>

      <div className="px-3 pt-4">
        <div className="flex items-center justify-between px-2 pb-2">
          <span className="text-[12px] font-semibold text-[#9a9aa8]">Projects</span>
          <button onClick={() => onCreate?.()} className="text-[#9a9aa8] transition hover:text-[#ff8a50]" aria-label="New project">
            <Plus className="size-4" />
          </button>
        </div>
        <div className="relative mb-2 px-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#9a9aa8]" />
          <input
            placeholder="Search projects"
            className="w-full rounded-lg border border-[#ececf1] bg-[#f5f3f0] py-2 pl-8 pr-3 text-[13px] text-[#1a1a2e] outline-none transition placeholder:text-[#9a9aa8] focus:border-[#ff5e1a]/60 focus:ring-2 focus:ring-[#ff5e1a]/20"
          />
        </div>
        {!projects || projects.length === 0 ? (
          <div className="mt-6 flex flex-col items-center px-3 text-center">
            <span className="grid size-11 place-items-center rounded-2xl bg-[#f5f3f0] text-[#9a9aa8] ring-1 ring-[#ececf1]">
              <Clapperboard className="size-5" />
            </span>
            <p className="mt-3 text-[13px] font-semibold text-[#5b5b6b]">No projects yet</p>
            <p className="mt-1 text-[12px] leading-relaxed text-[#9a9aa8]">
              Start your first studio-grade ad film.
            </p>
            <button
              onClick={() => onCreate?.()}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#ff5e1a] px-3 py-1.5 text-[12.5px] font-semibold text-white transition hover:bg-[#ff6f33]"
            >
              <Plus className="size-3.5" />
              New project
            </button>
          </div>
        ) : (
          <nav className="space-y-0.5">
            {projects.map((p) => (
              <button
                key={p.project_id}
                onClick={() => onOpenProject?.(p.project_id)}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-[#5b5b6b] transition hover:bg-[#f5f3f0] hover:text-[#1a1a2e]"
              >
                <Clapperboard className="size-4 shrink-0 opacity-70" />
                <span className="truncate">{p.title}</span>
              </button>
            ))}
          </nav>
        )}
      </div>
    </aside>
  );
}

/* ---------- 顶栏(light) ---------- */
function HomeTopBar() {
  return (
    <header className="flex h-14 shrink-0 items-center border-b border-[#ececf1] bg-white px-5 md:px-6">
      <span className="ml-auto grid size-8 place-items-center rounded-full bg-[#1a1a2e] text-[12px] font-semibold text-white">
        M
      </span>
    </header>
  );
}

/* ---------- 影片详情浮层(点海报打开,light) ---------- */
function FilmDetailModal({ film, onClose }: { film: Film | null; onClose: () => void }) {
  useEffect(() => {
    if (!film) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [film, onClose]);
  if (!film) return null;
  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[840px] overflow-hidden rounded-[20px] bg-white shadow-[0_30px_80px_rgba(0,0,0,0.25)] ring-1 ring-[#ececf1]"
      >
        <div className="relative aspect-video overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={poster(film.seed, 1280, 720)}
            alt={film.title}
            className="size-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/20" />
          <button
            onClick={onClose}
            className="absolute right-4 top-4 grid size-9 place-items-center rounded-full bg-black/45 text-white backdrop-blur transition hover:bg-black/65"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
          <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
            <h2 className="text-[clamp(28px,3.4vw,44px)] font-bold leading-tight tracking-tight text-white drop-shadow-[0_1px_10px_rgba(0,0,0,0.45)]">
              {film.title}
            </h2>
          </div>
        </div>
        <div className="p-6 md:p-8">
          <div className="mb-4 flex items-center gap-2.5 text-[13px] font-semibold text-[#5b5b6b]">
            <span className="rounded border border-[#ececf1] px-1.5 py-0.5 text-[11px] font-bold text-[#1a1a2e]">
              {film.rating}
            </span>
            <span>{film.year}</span>
            <span className="size-0.5 rounded-full bg-[#d4d3df]" />
            <span>{film.runtime}</span>
          </div>
          <p className="max-w-[52ch] text-[16px] leading-relaxed text-[#5b5b6b]">
            {film.logline}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 rounded-full bg-[#ff5e1a] px-6 py-3 text-[15px] font-semibold text-white transition hover:bg-[#ea5313] active:translate-y-[1px]">
              <Play className="size-4" fill="currentColor" />
              Play
            </button>
            <button className="inline-flex items-center gap-2 rounded-full border border-[#ececf1] bg-[#f5f3f0] px-6 py-3 text-[15px] font-semibold text-[#1a1a2e] transition hover:bg-[#ececf1] active:translate-y-[1px]">
              <Plus className="size-4" />
              Remix into project
            </button>
            <button className="inline-flex items-center gap-2 rounded-full border border-[#ececf1] px-4 py-3 text-[15px] font-semibold text-[#5b5b6b] transition hover:bg-[#f5f3f0] hover:text-[#1a1a2e]">
              <Star className="size-4" />
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   页面 — A 影院墙(light mode)
   ============================================================ */
/* ---------- Create Project 会话页(在右卡内切换,不是新路由) ---------- */
type SessionMode = "image" | "video";
const SESSION_MODEL: Record<SessionMode, string> = {
  image: "Seedream 5.0",
  video: "Seedance 2.5",
};

/* 分镜稿 mock:产品图 → 锁参考/风格 → 按场分组的关键帧 */
const REF_PRODUCT = "/prototypes/asset-library/images/img-02.jpg";
type Shot = {
  id: string;
  title: string;
  desc: string;
  camera: string;
  dur: string;
  vo?: string;
  seed: string;
};
const STORYBOARD: { scene: string; shots: Shot[] }[] = [
  {
    scene: "Scene 1 · Hook",
    shots: [
      { id: "s1", title: "Dew on skin", desc: "Extreme macro: a single serum droplet beads on fresh skin in cool morning light.", camera: "Macro · slow push-in", dur: "0:04", seed: "sb-dew-skin", vo: "" },
      { id: "s2", title: "Product reveal", desc: "The CloudJelly bottle rises on a soft-lit pedestal, condensation catching the light.", camera: "Product · 360 orbit", dur: "0:05", seed: "sb-hero-bottle", vo: "Meet CloudJelly." },
    ],
  },
  {
    scene: "Scene 2 · Story",
    shots: [
      { id: "s3", title: "Morning routine", desc: "A woman presses the serum into her cheek beside a bright window.", camera: "Medium · handheld", dur: "0:06", seed: "sb-morning-apply", vo: "One drop, every morning." },
      { id: "s4", title: "Absorption", desc: "Close-up: the serum melts into skin, texture turning luminous.", camera: "Macro · static", dur: "0:05", seed: "sb-absorb-glow", vo: "" },
      { id: "s5", title: "Out the door", desc: "She steps into a sunlit street, glowing and unhurried.", camera: "Wide · tracking", dur: "0:06", seed: "sb-sunlit-street", vo: "Skin that keeps up with you." },
    ],
  },
  {
    scene: "Scene 3 · Payoff",
    shots: [
      { id: "s6", title: "Pack shot", desc: "The bottle centered on a soft gradient, logo fading in.", camera: "Product · locked", dur: "0:05", seed: "sb-pack-logo", vo: "CloudJelly." },
    ],
  },
];
const SB_FLAT = STORYBOARD.flatMap((s) => s.shots);
const SB_TOTAL_SHOTS = SB_FLAT.length;
const SB_TOTAL_DUR = "0:31";
const CLIP_VIDEO = "/prototypes/asset-library/videos/video-01.mp4";
const durSec = (d: string) => {
  const [m, s] = d.split(":").map(Number);
  return m * 60 + s;
};
const SB_TOTAL_SEC = SB_FLAT.reduce((n, s) => n + durSec(s.dur), 0);

/* 分镜脚本字段(脚本无图,逐字段展示供确认) */
type SceneDetail = {
  scene_number: number;
  scene_name: string;
  description: string;
  duration: number;
  dialogue?: string;
  character_description?: string;
  voice_description?: string;
  camera_angle?: string;
  mood?: string;
  characters_present?: string[];
};

function ShotLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-semibold text-[#9a9aa8]">{children}</p>;
}

function ShotField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <ShotLabel>{label}</ShotLabel>
      <p className="mt-1 max-w-[64ch] text-[14px] leading-relaxed text-[#3a3a4e]">{children}</p>
    </div>
  );
}

/* 单个镜头:拍片台本 shot sheet 的一行 —— 首帧槽 + 台本内容 */
function Shot({
  scene,
  index,
  frame,
  onGenerate,
}: {
  scene: SceneDetail;
  index: number;
  frame: FrameState;
  onGenerate: () => void;
}) {
  const present = scene.characters_present ?? [];
  const hasMeta = Boolean(scene.camera_angle || scene.mood || present.length);
  const num = String(index).padStart(2, "0");
  return (
    <div className="grid grid-cols-1 gap-4 border-t border-[#efece8] py-7 first:border-t-0 first:pt-0 sm:grid-cols-[176px_1fr] sm:gap-6">
      {/* 首帧槽:已生成显示首帧,未生成为场记板占位 + hover「Generate scene」 */}
      <div className="group/slate relative aspect-[3/2] w-full overflow-hidden rounded-xl bg-[#21212e]">
        {frame.status === "done" && frame.url ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={frame.url} alt={scene.scene_name} className="size-full object-cover" />
            <span className="absolute left-2.5 top-2.5 rounded-md bg-black/55 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-white backdrop-blur">
              {num} · {scene.duration}s
            </span>
            <button
              onClick={onGenerate}
              className="absolute inset-0 flex items-end justify-end p-2.5 opacity-0 transition group-hover/slate:opacity-100"
              aria-label="Regenerate scene"
            >
              <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11.5px] font-semibold text-[#1a1a2e] shadow-sm">
                <RefreshCw className="size-3 text-[#ff5e1a]" />
                Redo
              </span>
            </button>
          </>
        ) : (
          <>
            <div className="absolute inset-x-0 top-0 flex h-3.5">
              {Array.from({ length: 10 }).map((_, i) => (
                <span
                  key={i}
                  className={i % 2 === 0 ? "flex-1 skew-x-[18deg] bg-[#33333f]" : "flex-1 skew-x-[18deg] bg-[#20202a]"}
                />
              ))}
            </div>
            <div className="absolute inset-0 flex flex-col justify-end p-3.5">
              <span className="font-display text-[28px] font-bold leading-none tabular-nums text-white/92">{num}</span>
              <span className="mt-1.5 flex items-center gap-1 text-[11px] font-medium tabular-nums text-white/55">
                <Clock className="size-3" />
                {scene.duration}s
              </span>
            </div>

            {frame.status === "generating" ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#21212e]/85">
                <Loader2 className="size-5 animate-spin text-white/80" />
                <span className="text-[11px] font-medium text-white/70">Generating frame…</span>
              </div>
            ) : (
              <button
                onClick={onGenerate}
                className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover/slate:bg-[#21212e]/55 group-hover/slate:opacity-100 focus-visible:bg-[#21212e]/55 focus-visible:opacity-100"
              >
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[12.5px] font-semibold text-[#1a1a2e] shadow-sm">
                  <Sparkles className="size-3.5 text-[#ff5e1a]" />
                  {frame.status === "error" ? "Retry scene" : "Generate scene"}
                </span>
              </button>
            )}
          </>
        )}
      </div>

      {/* 台本内容 */}
      <div className="min-w-0">
        <h3 className="font-display text-[16px] font-semibold leading-snug text-[#1a1a2e]">
          {scene.scene_name}
        </h3>

        <ShotField label="Scene description">{scene.description}</ShotField>

        {scene.dialogue ? (
          <div className="mt-4">
            <ShotLabel>Dialogue / Narration</ShotLabel>
            <div className="mt-1.5 rounded-xl bg-[#f7f5f2] px-4 py-3">
              <p className="text-[15px] font-medium italic leading-relaxed text-[#2a2a3e]">
                <span className="mr-0.5 font-display text-[18px] not-italic text-[#ff8a50]">&ldquo;</span>
                {scene.dialogue}
                <span className="ml-0.5 font-display text-[18px] not-italic text-[#ff8a50]">&rdquo;</span>
              </p>
            </div>
          </div>
        ) : null}

        {scene.character_description ? (
          <ShotField label="Character action">{scene.character_description}</ShotField>
        ) : null}
        {scene.voice_description ? (
          <ShotField label="Voice">{scene.voice_description}</ShotField>
        ) : null}

        {hasMeta ? (
          <div className="mt-4 flex flex-wrap gap-x-8 gap-y-3 border-t border-[#f0eff3] pt-4">
            {scene.mood ? (
              <div>
                <ShotLabel>Mood</ShotLabel>
                <p className="mt-1 text-[13px] text-[#3a3a4e]">{scene.mood}</p>
              </div>
            ) : null}
            {scene.camera_angle ? (
              <div>
                <ShotLabel>Camera</ShotLabel>
                <p className="mt-1 inline-flex items-center gap-1.5 text-[13px] text-[#3a3a4e]">
                  <Camera className="size-3.5 text-[#9a9aa8]" />
                  {scene.camera_angle}
                </p>
              </div>
            ) : null}
            {present.length ? (
              <div>
                <ShotLabel>Characters</ShotLabel>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {present.map((c) => (
                    <span
                      key={c}
                      className="rounded-md bg-[#f4f2ee] px-2 py-0.5 text-[12px] font-medium text-[#5b5b6b]"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* 生成中的阶段轮播:随后端真实流水线(读产品 → 找钩子 → 排镜头 → 定节奏)推进 */
const COOK_STAGES = [
  "Reading your product",
  "Finding the hook",
  "Blocking out the shots",
  "Setting the pace",
  "Polishing the dialogue",
];

function CookingState() {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStage((s) => (s + 1) % COOK_STAGES.length), 2200);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="mx-auto max-w-3xl">
      {/* 导演开工:呼吸标记 + 轮播状态语 */}
      <div className="mb-9 flex items-center gap-3.5">
        <span className="relative grid size-10 shrink-0 place-items-center">
          <span className="buzz-breathe absolute inset-0 rounded-full bg-[#ff7a2f]" aria-hidden />
          <span className="relative grid size-10 place-items-center rounded-full bg-gradient-to-br from-[#ffb066] to-[#ff5e1a] shadow-[0_6px_16px_-6px_rgba(255,94,26,0.55)]">
            <Clapperboard className="size-[18px] text-white" />
          </span>
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-1 text-[15px] font-semibold text-[#1a1a2e]">
            <span key={stage} className="animate-in fade-in slide-in-from-bottom-1 duration-300">
              {COOK_STAGES[stage]}
            </span>
            <span className="text-[#ff5e1a]">…</span>
          </p>
          <p className="mt-0.5 text-[12.5px] text-[#9a9aa8]">Directing your storyboard with Seedance 2.5</p>
        </div>
      </div>

      {/* shot-sheet 骨架:片格 + 台本行,暖色扫光,像分镜正被逐格写出 */}
      <div className="border-t border-[#efece8] pt-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="grid grid-cols-1 gap-4 border-t border-[#efece8] py-7 first:border-t-0 first:pt-0 sm:grid-cols-[176px_1fr] sm:gap-6"
          >
            <div className="buzz-skeleton aspect-[3/2] w-full rounded-xl" />
            <div className="min-w-0 space-y-2.5">
              <div className="buzz-skeleton h-4 w-40 rounded" />
              <div className="buzz-skeleton h-3 w-full rounded" />
              <div className="buzz-skeleton h-3 w-5/6 rounded" />
              <div className="buzz-skeleton mt-2 h-11 w-full rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* 分镜看板本体 */
function StoryboardBody({
  generating,
  onGenerateClips,
  scenes,
  title,
  style,
  totalDuration,
  analysis,
  productImage,
  frames,
  onGenerateScene,
}: {
  generating?: boolean;
  onGenerateClips?: () => void;
  scenes: SceneDetail[];
  title?: string;
  style?: string;
  totalDuration?: number;
  analysis?: ProductAnalysis | null;
  productImage?: string | null;
  frames?: Record<number, FrameState>;
  onGenerateScene?: (sceneNumber: number) => void;
}) {
  const totalShots = scenes.length;
  const totalSec = scenes.reduce((n, s) => n + s.duration, 0);
  const duration = totalDuration ?? totalSec;
  const frameMap = frames ?? {};
  const readyCount = scenes.filter((s) => frameMap[s.scene_number]?.status === "done").length;
  const allFramesReady = totalShots > 0 && readyCount === totalShots;
  return (
    <>
      <div className="flex-1 overflow-y-auto px-5 pb-5 md:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* 脚本总结条 */}
        <div className="sticky top-0 z-10 -mx-5 mb-6 border-b border-[#ececf1] bg-white/92 px-5 py-4 backdrop-blur md:-mx-8 md:px-8">
          <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
            <div className="min-w-0 flex-1">
              {generating ? (
                <>
                  <div className="h-[21px] w-56 max-w-[70%] animate-pulse rounded bg-[#efece8]" />
                  <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                    <div className="h-3.5 w-24 animate-pulse rounded bg-[#f2efeb]" />
                    <div className="h-3.5 w-20 animate-pulse rounded bg-[#f2efeb]" />
                    <div className="h-3.5 w-16 animate-pulse rounded bg-[#f2efeb]" />
                  </div>
                </>
              ) : (
                <>
                  <h2 className="truncate font-display text-[20px] font-bold tracking-tight text-[#1a1a2e]">{title || "Ad storyboard"}</h2>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-5 gap-y-1 text-[12.5px] text-[#9a9aa8]">
                    {style ? (
                      <span>Style <span className="font-medium text-[#1a1a2e]">{style}</span></span>
                    ) : null}
                    <span>Duration <span className="font-medium tabular-nums text-[#1a1a2e]">{duration}s</span></span>
                    <span>Scenes <span className="font-medium tabular-nums text-[#1a1a2e]">{totalShots}</span></span>
                  </div>
                </>
              )}
            </div>
            <button className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[#ececf1] px-2.5 py-1.5 text-[12.5px] font-semibold text-[#5b5b6b] transition hover:bg-[#f5f3f0] hover:text-[#1a1a2e]">
              <RefreshCw className="size-3.5" />
              Regenerate all
            </button>
          </div>
        </div>

        {(analysis || productImage) && !generating ? (
          <div className="mx-auto mb-8 max-w-3xl animate-in fade-in duration-300">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
              {productImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={productImage}
                  alt={analysis?.product_name || "Product"}
                  className="aspect-square w-full shrink-0 rounded-2xl object-cover ring-1 ring-[#ececf1] sm:w-36"
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#ff5e1a]">The brief</p>
                <h3 className="mt-1.5 font-display text-[19px] font-semibold leading-snug text-[#1a1a2e]">
                  {analysis?.product_name || title || "Product brief"}
                </h3>
                {analysis?.category ? (
                  <p className="mt-0.5 text-[12.5px] text-[#9a9aa8]">{analysis.category}</p>
                ) : null}
                {analysis?.ad_angle ? (
                  <p className="mt-3 max-w-[60ch] text-[14px] leading-relaxed text-[#3a3a4e]">{analysis.ad_angle}</p>
                ) : null}
                {analysis?.selling_points?.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {analysis.selling_points.slice(0, 4).map((s) => (
                      <span
                        key={s}
                        className="rounded-full bg-[#fff2ea] px-2.5 py-1 text-[12px] font-medium text-[#c4491a]"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                ) : null}
                {analysis?.target_audience ? (
                  <p className="mt-4 text-[12.5px] text-[#9a9aa8]">
                    For <span className="font-medium text-[#5b5b6b]">{analysis.target_audience}</span>
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {generating ? (
          <CookingState />
        ) : (
          <div className="mx-auto max-w-3xl border-t border-[#efece8] pt-1 animate-in fade-in duration-300">
            {scenes.map((scene, i) => (
              <Shot
                key={scene.scene_number}
                index={i + 1}
                scene={scene}
                frame={frameMap[scene.scene_number] ?? { status: "idle" }}
                onGenerate={() => onGenerateScene?.(scene.scene_number)}
              />
            ))}
            <button className="mt-5 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-medium text-[#9a9aa8] transition hover:text-[#ff5e1a]">
              <Plus className="size-4" />
              Add shot
            </button>
          </div>
        )}
      </div>

      {/* 底部动作条 */}
      <div className="flex shrink-0 items-center gap-3 border-t border-[#ececf1] bg-white/95 px-5 py-3 md:px-8">
        {generating ? (
          <div className="flex w-full items-center gap-3">
            <span className="shrink-0 text-[12.5px] font-medium text-[#9a9aa8]">Working on it</span>
            <span className="relative h-1 flex-1 overflow-hidden rounded-full bg-[#f0ede9]">
              <span className="buzz-indeterminate absolute inset-y-0 left-0 w-1/3 rounded-full bg-gradient-to-r from-[#ffb066] to-[#ff5e1a]" />
            </span>
          </div>
        ) : (
          <>
            <span className="text-[12.5px] font-medium text-[#9a9aa8]">
              {allFramesReady ? (
                <span className="text-[#1a1a2e]">All frames ready</span>
              ) : (
                <>
                  <span className="tabular-nums text-[#1a1a2e]">{readyCount}</span>
                  <span> / {totalShots} frames ready</span>
                </>
              )}
            </span>
            <button
              onClick={onGenerateClips}
              disabled={!allFramesReady}
              title={allFramesReady ? undefined : "Generate every scene frame first"}
              className="ml-auto inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-semibold text-white transition active:translate-y-[1px] disabled:cursor-not-allowed disabled:bg-[#e7e4e0] disabled:text-[#a5a2ad] disabled:active:translate-y-0 enabled:bg-[#ff5e1a] enabled:hover:bg-[#ea5313]"
            >
              Generate clips
              <ArrowRight className="size-4" />
            </button>
          </>
        )}
      </div>
    </>
  );
}

/* ---------- ③ Clip timeline:逐片段生成(渲染队列) ---------- */
type ClipState = "queued" | "rendering" | "done";

function ClipCard({
  sceneNumber,
  index,
  state,
  url,
}: {
  sceneNumber: number;
  index: number;
  state: ClipState;
  url?: string;
}) {
  return (
    <div className="group overflow-hidden rounded-xl bg-white ring-1 ring-[#ececf1] transition hover:ring-[#d8d6e0]">
      <div className="relative aspect-video overflow-hidden bg-[#1c1c20]">
        {state === "done" && url ? (
          <video
            src={url}
            muted
            loop
            playsInline
            autoPlay
            className="size-full object-cover saturate-[0.9]"
          />
        ) : null}
        <span className="absolute left-2.5 top-2.5 grid size-6 place-items-center rounded-md bg-black/55 text-[11px] font-bold text-white backdrop-blur">
          {index}
        </span>

        {state === "queued" && (
          <div className="absolute inset-0 grid place-items-center bg-black/45">
            <span className="rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-semibold text-white/70 backdrop-blur">
              Queued
            </span>
          </div>
        )}

        {state === "rendering" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50">
            <Loader2 className="size-6 animate-spin text-white/90" />
            <span className="text-[12px] font-semibold text-white/90 tabular-nums">Rendering</span>
          </div>
        )}

        {state === "done" && (
          <>
            <span className="absolute left-2.5 bottom-2.5 grid size-5 place-items-center rounded-full bg-[#ff5e1a] text-white">
              <CircleCheck className="size-4" />
            </span>
            <div className="absolute inset-0 grid place-items-center opacity-0 transition group-hover:opacity-100">
              <span className="grid size-11 place-items-center rounded-full bg-white/95 text-black">
                <Play className="ml-0.5 size-5" fill="currentColor" />
              </span>
            </div>
          </>
        )}
      </div>
      <div className="flex items-center gap-2 px-3.5 py-2.5">
        <span className="truncate text-[12.5px] font-semibold text-[#1a1a2e]">Scene {sceneNumber}</span>
        <span
          className={`ml-auto shrink-0 text-[11px] font-semibold ${
            state === "done" ? "text-[#ff8a50]" : "text-[#9a9aa8]"
          }`}
        >
          {state === "done" ? "Ready" : state === "rendering" ? "Rendering" : "Queued"}
        </span>
      </div>
    </div>
  );
}

function ClipsBody({
  onAssemble,
  clips,
}: {
  onAssemble: () => void;
  clips: { scene_number: number; status: string; url?: string }[];
}) {
  const view = clips.map((c) => ({
    ...c,
    label:
      c.status === "generated" || c.status === "regenerated"
        ? ("done" as const)
        : c.status?.startsWith("generat")
          ? ("rendering" as const)
          : ("queued" as const),
  }));
  const allDone = view.length > 0 && view.every((c) => c.label === "done");
  const doneCount = view.filter((c) => c.label === "done").length;
  const total = view.length;

  return (
    <>
      <div className="flex-1 overflow-y-auto px-5 pb-5 md:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* 进度 + 一致性 */}
        <div className="sticky top-0 z-10 -mx-5 mb-6 border-b border-[#ececf1] bg-white/92 px-5 py-3 backdrop-blur md:-mx-8 md:px-8">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#1a1a2e]">
              {allDone ? (
                <>
                  <CircleCheck className="size-4 text-[#ff8a50]" />
                  All clips ready
                </>
              ) : (
                <>
                  <Loader2 className="size-4 animate-spin text-[#ff8a50]" />
                  Rendering clips
                </>
              )}
              <span className="ml-1 text-[#9a9aa8] tabular-nums">
                {doneCount}/{total}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#9a9aa8]">
              <Lock className="size-3" />
              Same reference and style across every clip
            </div>
            <div className="ml-auto hidden h-1.5 w-40 overflow-hidden rounded-full bg-[#ececf1] sm:block">
              <span
                className="block h-full bg-[#ff5e1a] transition-[width] duration-300"
                style={{ width: `${total ? Math.round((doneCount / total) * 100) : 0}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {view.map((c, i) => (
            <ClipCard
              key={c.scene_number}
              sceneNumber={c.scene_number}
              index={i + 1}
              state={c.label}
              url={c.url}
            />
          ))}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3 border-t border-[#ececf1] bg-white/95 px-5 py-3 md:px-8">
        <span className="flex items-center gap-1.5 text-[13px] font-medium text-[#5b5b6b]">
          {doneCount}/{total} clips
        </span>
        <button
          onClick={onAssemble}
          disabled={!allDone}
          className="ml-auto inline-flex items-center gap-2 rounded-full bg-[#ff5e1a] px-5 py-2.5 text-[14px] font-semibold text-white transition hover:bg-[#ea5313] active:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Assemble video
          <ArrowRight className="size-4" />
        </button>
      </div>
    </>
  );
}

/* ---------- ④ Assembly:合成长片(时间线) ---------- */
function AssemblyBody({
  finalUrl,
  merging,
}: {
  finalUrl: string | null;
  merging: boolean;
}) {
  const vidRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const toggle = () => {
    const v = vidRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const showMerging = merging || !finalUrl;

  return (
    <>
      {/* 预览 */}
      <div className="flex min-h-0 flex-1 items-center justify-center p-5 md:p-6">
        <div className="relative aspect-video w-full max-w-[860px] overflow-hidden rounded-xl bg-black ring-1 ring-white/10">
          {showMerging ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50">
              <Loader2 className="size-6 animate-spin text-white/90" />
              <span className="text-[12px] font-semibold text-white/90 tabular-nums">Merging final video</span>
            </div>
          ) : (
            <>
              <video
                ref={vidRef}
                src={finalUrl}
                playsInline
                loop
                muted
                preload="metadata"
                onEnded={() => setPlaying(false)}
                className="size-full object-cover"
              />
              <button onClick={toggle} className="absolute inset-0 grid place-items-center" aria-label="Play preview">
                {!playing && (
                  <span className="grid size-14 place-items-center rounded-full bg-white/95 text-black shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
                    <Play className="ml-0.5 size-6" fill="currentColor" />
                  </span>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* 时间线面板 */}
      <div className="shrink-0 border-t border-[#ececf1] bg-white px-5 py-4 md:px-8">
        {/* transport + export */}
        <div className="mb-3 flex items-center gap-3">
          <button
            onClick={toggle}
            className="grid size-9 place-items-center rounded-full bg-[#1a1a2e] text-white transition hover:bg-[#2a2a3e]"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause className="size-4" /> : <Play className="ml-0.5 size-4" fill="currentColor" />}
          </button>
          <span className="text-[13px] font-semibold text-[#1a1a2e] tabular-nums">0:00 / {SB_TOTAL_DUR}</span>
          <button className="grid size-8 place-items-center rounded-lg text-[#5b5b6b] transition hover:bg-[#f5f3f0] hover:text-[#1a1a2e]" aria-label="Mute">
            <Volume2 className="size-4" />
          </button>
          <span className="ml-auto hidden items-center gap-1.5 sm:flex">
            <span className="rounded-md bg-[#f5f3f0] px-2 py-1 text-[11.5px] font-semibold text-[#5b5b6b]">16:9</span>
            <span className="rounded-md bg-[#f5f3f0] px-2 py-1 text-[11.5px] font-semibold text-[#5b5b6b]">1080p</span>
          </span>
          <button className="inline-flex items-center gap-2 rounded-full bg-[#ff5e1a] px-5 py-2.5 text-[14px] font-semibold text-white transition hover:bg-[#ea5313] active:translate-y-[1px]">
            <Download className="size-4" />
            Export
          </button>
        </div>

        {/* tracks */}
        <div className="relative">
          {/* playhead */}
          <div className="pointer-events-none absolute inset-y-0 left-[7%] z-10 w-px bg-[#1a1a2e]">
            <span className="absolute -left-1 -top-1 size-2 rounded-full bg-[#1a1a2e]" />
          </div>

          <div className="space-y-1.5">
            {/* Video */}
            <div className="flex items-center gap-2">
              <span className="w-12 shrink-0 text-[10.5px] font-semibold uppercase tracking-wide text-[#9a9aa8]">Video</span>
              <div className="flex flex-1 gap-0.5">
                {SB_FLAT.map((shot) => (
                  <div
                    key={shot.id}
                    style={{ width: `${(durSec(shot.dur) / SB_TOTAL_SEC) * 100}%` }}
                    className="relative h-11 overflow-hidden rounded-[5px] ring-1 ring-[#ececf1]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={poster(shot.seed)} alt="" className="size-full object-cover saturate-[0.85]" />
                  </div>
                ))}
              </div>
            </div>

            {/* Audio */}
            <div className="flex items-center gap-2">
              <span className="w-12 shrink-0 text-[10.5px] font-semibold uppercase tracking-wide text-[#9a9aa8]">Audio</span>
              <div className="flex h-8 flex-1 items-center gap-2 rounded-[5px] bg-[#ff5e1a]/12 px-2.5 ring-1 ring-[#ff5e1a]/25">
                <Music className="size-3.5 shrink-0 text-[#ff8a50]" />
                <span className="truncate text-[11.5px] font-semibold text-[#ff8a50]">Warm ambient score</span>
                <div className="flex flex-1 items-center gap-[2px] overflow-hidden opacity-60">
                  {Array.from({ length: 90 }).map((_, i) => (
                    <span
                      key={i}
                      className="w-[2px] shrink-0 rounded-full bg-[#ff8a50]"
                      style={{ height: `${4 + ((i * 7) % 12)}px` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Captions */}
            <div className="flex items-center gap-2">
              <span className="w-12 shrink-0 text-[10.5px] font-semibold uppercase tracking-wide text-[#9a9aa8]">Text</span>
              <div className="flex flex-1 gap-0.5">
                {SB_FLAT.map((shot) => (
                  <div
                    key={shot.id}
                    style={{ width: `${(durSec(shot.dur) / SB_TOTAL_SEC) * 100}%` }}
                    className={`flex h-8 items-center overflow-hidden rounded-[5px] px-2 ${
                      shot.vo ? "bg-[#f5f3f0] ring-1 ring-[#ececf1]" : "bg-[#faf8f5]"
                    }`}
                  >
                    {shot.vo ? (
                      <span className="truncate text-[10.5px] font-medium text-[#5b5b6b]">{shot.vo}</span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ---------- Consecutive 方法(Seedance 2.0):概念 → beat 列表 → 首尾帧链式 ---------- */
const BEAT_DRAFT = [
  "The CloudJelly bottle sits on wet stone as dawn light creeps in.",
  "Camera pushes in while a single drop rolls down the glass.",
  "A hand lifts the bottle, the label catching soft light.",
  "Serum is pressed onto skin, the texture turning luminous.",
  "Pull back to the bottle on a gradient as the logo settles.",
];
const BEAT_SEEDS = ["chain-dawn", "chain-drop", "chain-hand", "chain-skin", "chain-logo", "chain-x1", "chain-x2", "chain-x3"];
const beatSeed = (i: number) => BEAT_SEEDS[i % BEAT_SEEDS.length];
const fmtSec = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

function BeatsBody({
  beats,
  setBeats,
  onGenerate,
}: {
  beats: string[];
  setBeats: (fn: (b: string[]) => string[]) => void;
  onGenerate: () => void;
}) {
  const total = beats.length * 5;
  return (
    <>
      <div className="flex-1 overflow-y-auto px-5 pb-5 md:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="sticky top-0 z-10 -mx-5 mb-6 border-b border-[#ececf1] bg-white/92 px-5 py-3 backdrop-blur md:-mx-8 md:px-8">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={REF_PRODUCT} alt="Product reference" className="size-9 rounded-lg object-cover ring-1 ring-[#ececf1]" />
              <div className="leading-tight">
                <div className="text-[13px] font-semibold text-[#1a1a2e]">CloudJelly serum</div>
                <div className="text-[11px] text-[#9a9aa8]">First-frame reference</div>
              </div>
            </div>
            <div className="h-7 w-px bg-[#ececf1]" />
            <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[#ff8a50]">
              <Lock className="size-3.5" />
              Seedance 2.0
            </div>
            <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#9a9aa8]">
              <Link2 className="size-3" />
              Each beat continues from the last frame of the one before
            </div>
            <span className="ml-auto text-[12px] font-medium text-[#9a9aa8]">Drafted from your concept</span>
          </div>
        </div>

        <div className="mx-auto max-w-[760px]">
          {beats.map((b, i) => (
            <div key={i}>
              <div className="flex gap-3 rounded-xl bg-white p-3.5 ring-1 ring-[#ececf1]">
                <div className="flex w-8 shrink-0 flex-col items-center gap-1 pt-0.5">
                  <span className="grid size-6 place-items-center rounded-md bg-[#f5f3f0] text-[11px] font-bold text-[#1a1a2e]">
                    {i + 1}
                  </span>
                  <span className="text-[10px] font-semibold text-[#9a9aa8]">5s</span>
                </div>
                <textarea
                  value={b}
                  onChange={(e) => setBeats((arr) => arr.map((x, idx) => (idx === i ? e.target.value : x)))}
                  rows={2}
                  className="min-w-0 flex-1 resize-none bg-transparent pt-0.5 text-[14px] leading-relaxed text-[#1a1a2e] outline-none placeholder:text-[#9a9aa8]"
                  placeholder="Describe this beat..."
                />
                <button
                  onClick={() => setBeats((arr) => arr.filter((_, idx) => idx !== i))}
                  aria-label="Remove beat"
                  className="grid size-8 shrink-0 place-items-center rounded-lg text-[#9a9aa8] transition hover:bg-[#f5f3f0] hover:text-[#1a1a2e]"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              {i < beats.length - 1 && (
                <div className="flex items-center gap-2 py-1.5 pl-[26px] text-[11.5px] font-medium text-[#9a9aa8]">
                  <span className="grid size-5 place-items-center rounded-full bg-[#f5f3f0] text-[#ff8a50]">
                    <Link2 className="size-3" />
                  </span>
                  last frame carries forward
                </div>
              )}
            </div>
          ))}
          <button
            onClick={() => setBeats((arr) => [...arr, "New beat..."])}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#ececf1] py-3.5 text-[13px] font-semibold text-[#5b5b6b] transition hover:border-[#d8d6e0] hover:text-[#1a1a2e]"
          >
            <Plus className="size-4" />
            Add beat
          </button>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3 border-t border-[#ececf1] bg-white/95 px-5 py-3 md:px-8">
        <span className="flex items-center gap-1.5 text-[13px] font-medium text-[#5b5b6b]">
          {beats.length} beats
          <span className="size-0.5 rounded-full bg-[#d8d6e0]" />
          {fmtSec(total)}
        </span>
        <button
          onClick={onGenerate}
          className="ml-auto inline-flex items-center gap-2 rounded-full bg-[#ff5e1a] px-5 py-2.5 text-[14px] font-semibold text-white transition hover:bg-[#ea5313] active:translate-y-[1px]"
        >
          Generate video
          <ArrowRight className="size-4" />
        </button>
      </div>
    </>
  );
}

function ChainingBody({ beats, onAssemble }: { beats: string[]; onAssemble: () => void }) {
  const enterRef = useRef(0);
  const [, setTick] = useState(0);
  if (enterRef.current === 0) enterRef.current = Date.now();
  useEffect(() => {
    const iv = setInterval(() => setTick((t) => t + 1), 180);
    return () => clearInterval(iv);
  }, []);
  const DUR = 1400;
  const stateOf = (i: number): { st: ClipState; pct: number } => {
    const local = Date.now() - enterRef.current - i * DUR; // 顺序:每段依赖上一段尾帧
    if (local < 0) return { st: "queued", pct: 0 };
    if (local < DUR) return { st: "rendering", pct: Math.min(98, Math.round((local / DUR) * 100)) };
    return { st: "done", pct: 100 };
  };
  const doneCount = beats.filter((_, i) => stateOf(i).st === "done").length;
  const allDone = doneCount === beats.length;

  return (
    <>
      <div className="flex-1 overflow-y-auto px-5 pb-5 md:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="sticky top-0 z-10 -mx-5 mb-6 border-b border-[#ececf1] bg-white/92 px-5 py-3 backdrop-blur md:-mx-8 md:px-8">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#1a1a2e]">
              {allDone ? (
                <>
                  <CircleCheck className="size-4 text-[#ff8a50]" />
                  Continuous video ready
                </>
              ) : (
                <>
                  <Loader2 className="size-4 animate-spin text-[#ff8a50]" />
                  Chaining from last frame
                </>
              )}
              <span className="ml-1 text-[#9a9aa8] tabular-nums">
                {doneCount}/{beats.length}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#9a9aa8]">
              <Lock className="size-3" />
              Seedance 2.0
            </div>
            <div className="ml-auto hidden h-1.5 w-40 overflow-hidden rounded-full bg-[#ececf1] sm:block">
              <span className="block h-full bg-[#ff5e1a] transition-[width] duration-300" style={{ width: `${Math.round((doneCount / beats.length) * 100)}%` }} />
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-[760px]">
          {beats.map((b, i) => {
            const s = stateOf(i);
            return (
              <div key={i}>
                <div className="flex gap-3.5">
                  <div className="relative aspect-video w-[168px] shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-[#ececf1]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={poster(beatSeed(i))}
                      alt=""
                      loading="lazy"
                      className={`size-full object-cover transition duration-500 ${s.st === "done" ? "saturate-[0.9]" : "scale-105 saturate-0 brightness-50"}`}
                    />
                    <span className="absolute left-2 top-2 grid size-5 place-items-center rounded bg-black/55 text-[10px] font-bold text-white backdrop-blur">
                      {i + 1}
                    </span>
                    {s.st === "queued" && (
                      <div className="absolute inset-0 grid place-items-center bg-black/45 text-[11px] font-semibold text-white/70">
                        Queued
                      </div>
                    )}
                    {s.st === "rendering" && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/55">
                        <Loader2 className="size-5 animate-spin text-white/90" />
                        <span className="text-[11px] font-semibold text-white/90 tabular-nums">{s.pct}%</span>
                      </div>
                    )}
                    {s.st === "done" && (
                      <span className="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[9.5px] font-semibold text-[#ff8a50] backdrop-blur">
                        end frame
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 py-1">
                    <div className="flex items-center gap-2 text-[11.5px] font-semibold text-[#9a9aa8]">
                      Beat {i + 1}
                      <span className="size-0.5 rounded-full bg-[#d8d6e0]" />
                      5s
                      <span className={`ml-auto ${s.st === "done" ? "text-[#ff8a50]" : "text-[#9a9aa8]"}`}>
                        {s.st === "done" ? "Ready" : s.st === "rendering" ? "Rendering" : "Queued"}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[13.5px] leading-snug text-[#5b5b6b]">{b}</p>
                  </div>
                </div>
                {i < beats.length - 1 && (
                  <div className={`flex items-center gap-2 py-2 pl-[74px] text-[11.5px] font-medium transition ${stateOf(i).st === "done" ? "text-[#ff8a50]" : "text-[#9a9aa8]"}`}>
                    <ArrowDown className="size-3.5" />
                    last frame becomes the next first frame
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3 border-t border-[#ececf1] bg-white/95 px-5 py-3 md:px-8">
        <span className="flex items-center gap-1.5 text-[13px] font-medium text-[#5b5b6b]">
          {doneCount}/{beats.length} clips
          <span className="size-0.5 rounded-full bg-[#d8d6e0]" />
          {fmtSec(beats.length * 5)}
        </span>
        <button
          onClick={onAssemble}
          disabled={!allDone}
          className="ml-auto inline-flex items-center gap-2 rounded-full bg-[#ff5e1a] px-5 py-2.5 text-[14px] font-semibold text-white transition hover:bg-[#ea5313] active:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Assemble video
          <ArrowRight className="size-4" />
        </button>
      </div>
    </>
  );
}

type GenMethod = "storyboard" | "consecutive";
type SessionStage =
  | "compose"
  | "generating"
  | "storyboard"
  | "clips"
  | "beats"
  | "chaining"
  | "assembly";

/* ---------- 单页 storyboard 画布:Generate 后的统一落地页(接真实数据) ---------- */
function fmtStart(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function CanvasView({ ad, onBack }: { ad: ReturnType<typeof useAdStudio>; onBack: () => void }) {
  const [active, setActive] = useState<number | null>(null);
  const script = ad.script;
  const scenes = script?.scenes ?? [];
  const generating = ad.phase === "scripting" || !script;
  const frames = ad.frames;
  const clipMap = new Map(ad.clips.map((c) => [c.scene_number, c] as const));
  const readyCount = scenes.filter((s) => frames[s.scene_number]?.status === "done").length;
  const allFramesReady = scenes.length > 0 && readyCount === scenes.length;
  const totalSec = scenes.reduce((n, s) => n + s.duration, 0);
  const clipsDone = ad.clips.filter((c) => c.status === "done").length;
  const rendering = ad.phase === "clips";
  const merging = ad.phase === "merging";
  const finalReady = Boolean(ad.finalVideoUrl);

  let acc = 0;
  const starts = scenes.map((s) => {
    const st = acc;
    acc += s.duration;
    return st;
  });

  const createVideo = async () => {
    await ad.generateClips();
    await ad.assemble();
  };

  return (
    <div className="flex h-full flex-col bg-[#141319] text-[#ececf1]">
      {/* top bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/8 px-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-medium text-[#a9a7b4] transition hover:bg-white/5 hover:text-white"
        >
          <ChevronLeft className="size-4" />
          Back
        </button>
        <div className="flex min-w-0 items-center gap-2 text-[13.5px]">
          <span className="truncate font-[var(--font-display)] font-semibold text-white">
            {script?.title || "Storyboard"}
          </span>
          {script?.style ? (
            <>
              <span className="text-white/25">·</span>
              <span className="hidden text-[#a9a7b4] sm:inline">{script.style}</span>
            </>
          ) : null}
        </div>
        <div className="flex items-center gap-0.5">
          <span className="mr-1 hidden text-[12px] text-white/40 sm:inline tabular-nums">
            {scenes.length} shots · {totalSec}s
          </span>
          <button className="grid size-8 place-items-center rounded-lg text-[#a9a7b4] transition hover:bg-white/5 hover:text-white">
            <Bell className="size-4" />
          </button>
          <button className="grid size-8 place-items-center rounded-lg text-[#a9a7b4] transition hover:bg-white/5 hover:text-white">
            <MoreHorizontal className="size-4" />
          </button>
          <span className="ml-1.5 grid size-8 place-items-center rounded-full bg-[#ff5e1a] text-[12px] font-semibold text-white">
            M
          </span>
        </div>
      </header>

      {/* shot row */}
      <main className="flex-1 overflow-x-auto overflow-y-hidden px-4 py-6 [scrollbar-width:thin]">
        {generating ? (
          <div className="flex h-full min-h-[420px] min-w-max items-stretch gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex w-[300px] shrink-0 flex-col overflow-hidden rounded-2xl border border-white/8 bg-[#1c1b23]">
                <div className="buzz-skeleton aspect-[16/10] w-full" />
                <div className="space-y-2.5 p-3.5">
                  <div className="buzz-skeleton h-4 w-2/3 rounded" />
                  <div className="buzz-skeleton h-3 w-full rounded" />
                  <div className="buzz-skeleton h-3 w-5/6 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full min-h-[420px] min-w-max items-stretch gap-4">
            {scenes.map((scene, i) => (
              <CanvasShotCard
                key={scene.scene_number}
                scene={scene}
                index={i + 1}
                start={fmtStart(starts[i])}
                frame={frames[scene.scene_number] ?? { status: "idle" }}
                clipUrl={clipMap.get(scene.scene_number)?.url}
                active={active === scene.scene_number}
                onSelect={() => setActive(scene.scene_number)}
                onGenerate={() => ad.generateScene(scene.scene_number)}
              />
            ))}
            <button className="flex h-full w-[132px] shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/12 text-[12.5px] font-medium text-white/40 transition hover:border-white/25 hover:text-white/70">
              <Plus className="size-5" />
              Add shot
            </button>
          </div>
        )}
      </main>

      {/* timeline */}
      <section className="shrink-0 border-t border-white/8 bg-[#17161d] px-4 pb-3 pt-2.5">
        <div className="flex gap-1">
          {scenes.map((scene, i) => {
            const f = frames[scene.scene_number];
            const clip = clipMap.get(scene.scene_number);
            const thumb = clip?.url ? undefined : f?.status === "done" ? f.url : undefined;
            return (
              <button
                key={scene.scene_number}
                onClick={() => setActive(scene.scene_number)}
                style={{ flexGrow: scene.duration }}
                className={
                  "relative h-12 shrink-0 overflow-hidden rounded-md border text-left transition " +
                  (active === scene.scene_number
                    ? "border-[#ff5e1a] ring-1 ring-[#ff5e1a]"
                    : "border-white/10 hover:border-white/25")
                }
              >
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumb} alt="" className="absolute inset-0 size-full object-cover opacity-80" />
                ) : (
                  <span className="absolute inset-0 bg-[#22212b]" />
                )}
                <span className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-1.5 pb-1 pt-3 text-[10px] font-semibold tabular-nums text-white/90">
                  {String(i + 1).padStart(2, "0")}
                  <span className="text-white/55">{scene.duration}s</span>
                </span>
                {clip?.url ? (
                  <CircleCheck className="absolute right-1 top-1 size-3.5 text-[#4ade80]" />
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      {/* control bar */}
      <footer className="flex shrink-0 items-center gap-2 border-t border-white/8 bg-[#141319] px-4 py-3">
        <div className="hidden items-center gap-1.5 sm:flex">
          <CanvasPill icon={<RectangleHorizontal className="size-3.5" />} label="16:9" />
          <CanvasPill icon={<Clock className="size-3.5" />} label={`${totalSec}s`} />
          <CanvasPill icon={<Mic className="size-3.5" />} label="1 voice" />
          <CanvasPill icon={<Music className="size-3.5" />} label="No music" />
        </div>

        <div className="ml-auto flex items-center gap-3">
          {generating ? (
            <span className="flex items-center gap-2 text-[13px] font-medium text-white/60">
              <Loader2 className="size-4 animate-spin text-[#ff8a50]" />
              Directing your storyboard…
            </span>
          ) : finalReady ? (
            <>
              <span className="flex items-center gap-1.5 text-[13px] font-medium text-white/70">
                <CircleCheck className="size-4 text-[#4ade80]" />
                Video ready
              </span>
              <a
                href={ad.finalVideoUrl ?? "#"}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#ff5e1a] px-5 py-2.5 text-[14px] font-semibold text-white transition hover:bg-[#ea5313] active:translate-y-[1px]"
              >
                <Play className="size-4" />
                Play video
              </a>
            </>
          ) : merging ? (
            <span className="flex items-center gap-2 text-[13px] font-medium text-white/60">
              <Loader2 className="size-4 animate-spin text-[#ff8a50]" />
              Merging the film…
            </span>
          ) : rendering ? (
            <span className="flex items-center gap-2 text-[13px] font-medium text-white/60">
              <Loader2 className="size-4 animate-spin text-[#ff8a50]" />
              Rendering clips {clipsDone}/{scenes.length}…
            </span>
          ) : (
            <>
              <span className="text-[12.5px] font-medium text-white/50">
                {allFramesReady ? (
                  <span className="text-white/80">All frames ready</span>
                ) : (
                  <>
                    <span className="tabular-nums text-white/80">{readyCount}</span> / {scenes.length} frames ready
                  </>
                )}
              </span>
              <button
                onClick={createVideo}
                disabled={!allFramesReady}
                title={allFramesReady ? undefined : "Generate every scene frame first"}
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-semibold text-white transition active:translate-y-[1px] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35 disabled:active:translate-y-0 enabled:bg-[#ff5e1a] enabled:hover:bg-[#ea5313]"
              >
                <Sparkles className="size-4" />
                Create video
              </button>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}

function CanvasPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[12.5px] font-medium text-[#c8c6d2]">
      <span className="text-white/45">{icon}</span>
      {label}
    </span>
  );
}

function CanvasShotCard({
  scene,
  index,
  start,
  frame,
  clipUrl,
  active,
  onSelect,
  onGenerate,
}: {
  scene: SceneDetail;
  index: number;
  start: string;
  frame: FrameState;
  clipUrl?: string;
  active: boolean;
  onSelect: () => void;
  onGenerate: () => void;
}) {
  const num = String(index).padStart(2, "0");
  return (
    <article
      onClick={onSelect}
      className={
        "group flex h-full w-[300px] shrink-0 cursor-pointer flex-col overflow-hidden rounded-2xl border bg-[#1c1b23] transition " +
        (active ? "border-[#ff5e1a]/70 ring-1 ring-[#ff5e1a]/40" : "border-white/8 hover:border-white/16")
      }
    >
      <div className="group/slate relative aspect-[16/10] w-full overflow-hidden bg-[#232230]">
        {clipUrl ? (
          <>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video src={clipUrl} muted playsInline className="size-full object-cover" />
            <span className="absolute left-2.5 top-2.5 rounded-md bg-black/55 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-white backdrop-blur">
              {num}
            </span>
            <span className="absolute inset-0 grid place-items-center">
              <span className="grid size-9 place-items-center rounded-full bg-black/45 text-white backdrop-blur">
                <Play className="size-4" />
              </span>
            </span>
          </>
        ) : frame.status === "done" && frame.url ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={frame.url} alt={scene.scene_name} className="size-full object-cover" />
            <span className="absolute left-2.5 top-2.5 rounded-md bg-black/55 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-white backdrop-blur">
              {num}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); onGenerate(); }}
              className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11.5px] font-semibold text-[#1a1a2e] opacity-0 shadow-sm transition group-hover:opacity-100"
            >
              <RefreshCw className="size-3 text-[#ff5e1a]" />
              Redo
            </button>
          </>
        ) : (
          <>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5">
              <span className="font-[var(--font-display)] text-[22px] font-bold tabular-nums text-white/25">{num}</span>
              {frame.status !== "generating" ? (
                <button
                  onClick={(e) => { e.stopPropagation(); onGenerate(); }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-[#1a1a2e] opacity-0 shadow-sm transition group-hover:opacity-100"
                >
                  <Wand2 className="size-3.5 text-[#ff5e1a]" />
                  {frame.status === "error" ? "Retry scene" : "Generate scene"}
                </button>
              ) : null}
            </div>
            {frame.status === "generating" ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#232230]/85">
                <Loader2 className="size-5 animate-spin text-white/80" />
                <span className="text-[11px] font-medium text-white/70">Generating frame…</span>
              </div>
            ) : null}
          </>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-3.5">
        <h3 className="text-[13.5px] font-semibold leading-snug text-white">{scene.scene_name}</h3>
        <p className="mt-1.5 line-clamp-4 text-[12.5px] leading-relaxed text-[#a9a7b4]">{scene.description}</p>
        {scene.dialogue ? (
          <p className="mt-2.5 rounded-lg bg-white/5 px-2.5 py-1.5 text-[12px] italic leading-snug text-[#d7d5e0]">
            &ldquo;{scene.dialogue}&rdquo;
          </p>
        ) : null}
        <div className="mt-auto flex items-center justify-between pt-3 text-[11.5px] font-medium tabular-nums text-white/40">
          <span>{start}</span>
          <span>{scene.duration}s</span>
        </div>
      </div>
    </article>
  );
}

function SessionView({ onBack, openProjectId }: { onBack: () => void; openProjectId?: string | null }) {
  const [prompt, setPrompt] = useState("");
  const [method, setMethod] = useState<GenMethod>("storyboard");
  const [beats, setBeats] = useState<string[]>([]);
  const [stage, setStage] = useState<SessionStage>("compose");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ad = useAdStudio();
  const [productFile, setProductFile] = useState<File | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);
  const avatarInput = useRef<HTMLInputElement | null>(null);
  const productPreview = useMemo(
    () => (productFile ? URL.createObjectURL(productFile) : null),
    [productFile],
  );
  const avatarPreview = useMemo(
    () => (avatarFile ? URL.createObjectURL(avatarFile) : null),
    [avatarFile],
  );

  useEffect(() => {
    if (openProjectId) {
      ad.loadProject(openProjectId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openProjectId]);

  useEffect(() => {
    return () => {
      if (productPreview) URL.revokeObjectURL(productPreview);
    };
  }, [productPreview]);
  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const generate = () => {
    if (method === "consecutive") {
      setBeats(BEAT_DRAFT);
      setStage("beats");
      return;
    }
    if (!productFile) return;
    setStage("generating");
    ad.start(productFile, prompt, avatarFile);
  };

  useEffect(() => {
    if (method !== "storyboard") return;
    if (ad.phase === "storyboard") setStage("storyboard");
    else if (ad.phase === "clips") setStage("clips");
    else if (ad.phase === "merging") setStage("assembly");
    else if (ad.phase === "done") setStage("assembly");
    else if (ad.phase === "error") setStage("compose");
  }, [ad.phase, method]);
  const handleBack = () => {
    if (stage === "assembly") setStage(method === "consecutive" ? "chaining" : "clips");
    else if (stage === "clips") setStage("storyboard");
    else if (stage === "chaining") setStage("beats");
    else if (stage === "storyboard" || stage === "generating" || stage === "beats") setStage("compose");
    else onBack();
  };
  // 与后台生成引擎四步对齐:剧本 / 参考图 / 视频 / 合成
  const crumbs =
    method === "consecutive"
      ? ["Brief", "Beats", "Video"]
      : ["Script", "References", "Video", "Merge"];
  const crumbActive =
    stage === "beats"
      ? "Beats"
      : stage === "chaining"
        ? "Video"
        : stage === "clips"
          ? "Video"
          : stage === "assembly"
            ? method === "consecutive"
              ? "Video"
              : "Merge"
            : "Script";

  // storyboard 模式:一旦离开 compose,整块交给统一的单页画布(自带顶栏,不走分步 chrome)
  if (method === "storyboard" && stage !== "compose") {
    return <CanvasView ad={ad} onBack={onBack} />;
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-[#faf8f5]">
      {/* 顶行 */}
      <div className="flex h-14 shrink-0 items-center justify-between px-5 md:px-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-semibold text-[#5b5b6b] transition hover:bg-[#f5f3f0] hover:text-[#1a1a2e]"
        >
          <ChevronLeft className="size-4" />
          Back
        </button>
        {stage === "compose" ? (
          <div />
        ) : (
          <div className="flex items-center gap-1.5 text-[12.5px] font-medium">
            {crumbs.map((c, i) => (
              <span key={c} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="size-3 text-[#9a9aa8]" />}
                <span className={c === crumbActive ? "font-semibold text-[#1a1a2e]" : "text-[#9a9aa8]"}>
                  {c}
                </span>
              </span>
            ))}
          </div>
        )}
        <span className="grid size-8 place-items-center rounded-full bg-[#f5f3f0] text-[12px] font-semibold text-[#1a1a2e] ring-1 ring-[#ececf1]">
          M
        </span>
      </div>

      {ad.errorMsg && (
        <div className="mx-5 mb-2 rounded-lg border border-[#ff5e1a]/40 bg-[#ff5e1a]/10 px-3 py-2 text-[13px] text-[#1a1a2e] md:mx-6">
          Generation failed: {ad.errorMsg}
        </div>
      )}

      {stage === "compose" ? (
        <>
          {/* 空状态 */}
          <div className="flex flex-1 items-center justify-center px-6">
            <div className="flex flex-col items-center text-center">
              <span className={`grid size-16 place-items-center rounded-[20px] ${ctaGrad} text-white shadow-[0_10px_40px_rgba(0,0,0,0.5)]`}>
                <Sparkles className="size-7" />
              </span>
              <h1 className="mt-6 text-[clamp(24px,3vw,34px)] font-extrabold uppercase leading-[1.1] tracking-tight">
                Start creating with
                <br />
                <span className="text-[#9a9aa8]">{method === "consecutive" ? "Seedance 2.0" : SESSION_MODEL.video}</span>
              </h1>
              <p className="mt-3 max-w-[32rem] text-[15px] leading-relaxed text-[#5b5b6b]">
                {method === "consecutive"
                  ? "Upload your product and model photos, pick a style, and we chain 5s clips into a studio-grade ad film."
                  : "Upload your product and model photos, pick a style, and we produce a studio-grade ad film."}
              </p>
            </div>
          </div>

          {/* composer */}
          <div className="px-4 pb-5 md:px-6">
            {/* 方法切换 */}
            <div className="mx-auto mb-2 flex max-w-[1040px] items-center gap-2">
              <div className="inline-flex rounded-full border border-[#ececf1] bg-[#f5f3f0] p-0.5">
                {(
                  [
                    { k: "storyboard", label: "Storyboard" },
                    { k: "consecutive", label: "Consecutive" },
                  ] as { k: GenMethod; label: string }[]
                ).map((m) => (
                  <button
                    key={m.k}
                    onClick={() => setMethod(m.k)}
                    className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition ${
                      method === m.k ? "bg-white text-[#1a1a2e] shadow-sm" : "text-[#9a9aa8] hover:text-[#5b5b6b]"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <span className="text-[12px] font-medium text-[#9a9aa8]">
                {method === "consecutive"
                  ? "Chained 5s clips, one continuous take. Seedance 2.0 only."
                  : "AI storyboards shots you can direct one by one."}
              </span>
            </div>
            <div className="mx-auto flex max-w-[1040px] items-stretch gap-2 rounded-[20px] border border-[#ececf1] bg-white p-2 shadow-[0_16px_50px_rgba(0,0,0,0.08)] backdrop-blur">

              <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
                {/* 隐藏的文件选择器:PRODUCT / AVATAR 上传位触发 */}
                <input ref={fileInput} type="file" accept="image/*" className="hidden"
                  onChange={(e) => setProductFile(e.target.files?.[0] ?? null)} />
                <input ref={avatarInput} type="file" accept="image/*" className="hidden"
                  onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)} />
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={2}
                  placeholder={
                    method === "consecutive"
                      ? "One line: a serum ad that flows from bottle to glowing skin..."
                      : "A warm, cinematic serum ad. Product hero, morning routine, glowing skin..."
                  }
                  className="w-full resize-none bg-transparent px-2 pt-1.5 text-[15px] leading-relaxed text-[#1a1a2e] outline-none placeholder:text-[#9a9aa8]"
                />
                <div className="flex flex-wrap items-center gap-1.5 px-1 pt-1">
                  <button aria-label="Add" className="grid size-8 place-items-center rounded-lg bg-[#f5f3f0] text-[#5b5b6b] transition hover:bg-[#ececf1] hover:text-[#1a1a2e]">
                    <Plus className="size-4" />
                  </button>
                  <button aria-label="Reference" className="grid size-8 place-items-center rounded-lg bg-[#f5f3f0] text-[#5b5b6b] transition hover:bg-[#ececf1] hover:text-[#1a1a2e]">
                    <AtSign className="size-4" />
                  </button>
                  <button className="flex items-center gap-1.5 rounded-lg bg-[#f5f3f0] px-2.5 py-1.5 text-[13px] font-semibold text-[#1a1a2e] transition hover:bg-[#ececf1]">
                    <span className="grid size-4 place-items-center rounded bg-[#ff5e1a]">
                      <Sparkles className="size-2.5" />
                    </span>
                    {method === "consecutive" ? "Seedance 2.0" : SESSION_MODEL.video}
                    {method === "consecutive" ? (
                      <Lock className="size-3 text-[#9a9aa8]" />
                    ) : (
                      <ChevronDown className="size-3.5 text-[#9a9aa8]" />
                    )}
                  </button>
                  <button className="flex items-center gap-1.5 rounded-lg bg-[#f5f3f0] px-2.5 py-1.5 text-[13px] font-semibold text-[#5b5b6b] transition hover:bg-[#ececf1] hover:text-[#1a1a2e]">
                    <Scan className="size-3.5" />
                    Auto
                  </button>
                  <button className="flex items-center gap-1.5 rounded-lg bg-[#f5f3f0] px-2.5 py-1.5 text-[13px] font-semibold text-[#5b5b6b] transition hover:bg-[#ececf1] hover:text-[#1a1a2e]">
                    <Gem className="size-3.5" />
                    High
                  </button>
                  <button className="rounded-lg bg-[#f5f3f0] px-2.5 py-1.5 text-[13px] font-semibold text-[#5b5b6b] transition hover:bg-[#ececf1] hover:text-[#1a1a2e]">
                    5 min
                  </button>
                </div>
              </div>

              {/* PRODUCT / AVATAR 上传位:+ 左上角,标签左下角(照图 2) */}
              <button
                onClick={() => fileInput.current?.click()}
                className="group relative flex w-[92px] shrink-0 flex-col items-start justify-between overflow-hidden rounded-2xl bg-[#f5f3f0] p-3 text-left ring-1 ring-inset ring-[#ececf1] transition hover:ring-[#ff5e1a]"
              >
                {productPreview ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={productPreview} alt="Product" className="absolute inset-0 size-full object-cover" />
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 pb-2.5 pt-6 text-[13px] font-extrabold uppercase tracking-wide text-white">
                      Product
                    </span>
                  </>
                ) : (
                  <>
                    <span className="grid size-9 place-items-center rounded-full bg-white text-[#9a9aa8] ring-1 ring-[#e4e3ea] transition group-hover:text-[#ff5e1a]">
                      <Plus className="size-[18px]" />
                    </span>
                    <span className="text-[13px] font-extrabold uppercase tracking-wide text-[#1a1a2e]">Product</span>
                  </>
                )}
              </button>
              <button
                onClick={() => avatarInput.current?.click()}
                className="group relative flex w-[92px] shrink-0 flex-col items-start justify-between overflow-hidden rounded-2xl bg-[#f5f3f0] p-3 text-left ring-1 ring-inset ring-[#ececf1] transition hover:ring-[#ff5e1a]"
              >
                {avatarPreview ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={avatarPreview} alt="Avatar" className="absolute inset-0 size-full object-cover" />
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 pb-2.5 pt-6 text-[13px] font-extrabold uppercase tracking-wide text-white">
                      Avatar
                    </span>
                  </>
                ) : (
                  <>
                    <span className="grid size-9 place-items-center rounded-full bg-white text-[#9a9aa8] ring-1 ring-[#e4e3ea] transition group-hover:text-[#ff5e1a]">
                      <Plus className="size-[18px]" />
                    </span>
                    <span className="text-[13px] font-extrabold uppercase tracking-wide text-[#1a1a2e]">Avatar</span>
                  </>
                )}
              </button>

              <button
                onClick={generate}
                disabled={!productFile}
                className={`flex shrink-0 flex-col items-center justify-center gap-1 rounded-2xl bg-[#ff5e1a] px-7 text-white transition hover:bg-[#ea5313] active:translate-y-[1px] ${productFile ? "" : "opacity-50 pointer-events-none"}`}
              >
                <span className="text-[14px] font-bold uppercase tracking-wide">Generate</span>
                <span className="flex items-center gap-1.5 text-[12px] font-semibold">
                  <Sparkles className="size-3.5" />
                  <span className="text-white/55 line-through">120</span>
                  <span className="text-white">100</span>
                </span>
              </button>
            </div>
          </div>
        </>
      ) : stage === "beats" ? (
        <BeatsBody beats={beats} setBeats={setBeats} onGenerate={() => setStage("chaining")} />
      ) : stage === "chaining" ? (
        <ChainingBody beats={beats} onAssemble={() => setStage("assembly")} />
      ) : stage === "clips" ? (
        <ClipsBody clips={ad.clips} onAssemble={() => ad.assemble()} />
      ) : stage === "assembly" ? (
        <AssemblyBody finalUrl={ad.finalVideoUrl} merging={ad.phase === "merging"} />
      ) : (
        <StoryboardBody
          generating={stage === "generating" || ad.phase === "scripting"}
          scenes={ad.script?.scenes ?? []}
          title={ad.script?.title}
          style={ad.script?.style}
          totalDuration={ad.script?.total_duration}
          analysis={ad.productAnalysis}
          productImage={ad.productImage}
          frames={ad.frames}
          onGenerateScene={(n) => ad.generateScene(n)}
          onGenerateClips={() => ad.generateClips()}
        />
      )}
    </div>
  );
}

function FilmStudioPage({ onBack }: { onBack: () => void }) {
  const [openFilm, setOpenFilm] = useState<Film | null>(null);
  const [inSession, setInSession] = useState(false);
  const [activeCat, setActiveCat] = useState<string>("All");
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [openProjectId, setOpenProjectId] = useState<string | null>(null);
  const loadProjects = useCallback(() => {
    listProjects().then(setProjects).catch(() => setProjects([]));
  }, []);
  // inSession starts false, so this also covers the initial load; reloads on return to home.
  useEffect(() => { if (!inSession) loadProjects(); }, [inSession, loadProjects]);
  const rowFilms = (ids: string[]) => ids.map((id) => FILMS[id]);
  const createProject = () => { setOpenProjectId(null); setInSession(true); };
  const openProject = (id: string) => { setOpenProjectId(id); setInSession(true); };

  const scrollToCat = (label: string) => {
    const sc = document.querySelector<HTMLDivElement>("[data-scroll-root]");
    if (!sc) return;
    setActiveCat(label); // highlight the clicked chip immediately
    if (label === "All") {
      sc.scrollTop = 0;
      return;
    }
    const el = sc.querySelector<HTMLElement>(`[data-cat="${label}"]`);
    if (!el) return;
    sc.scrollTop =
      sc.scrollTop +
      (el.getBoundingClientRect().top - sc.getBoundingClientRect().top) -
      64;
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const sc = e.currentTarget;
    const threshold = sc.getBoundingClientRect().top + 80;
    let current = "All";
    sc.querySelectorAll<HTMLElement>("[data-cat]").forEach((el) => {
      if (el.getBoundingClientRect().top - threshold <= 4) current = el.dataset.cat ?? current;
    });
    setActiveCat(current);
  };

  return (
    <div
      className="flex h-screen gap-1.5 bg-[#faf8f5] p-1.5 text-[#1a1a2e]"
      style={{ fontFamily: FS_FONT }}
    >
      <HomeSidebar onBack={onBack} onCreate={createProject} onHome={() => setInSession(false)} homeActive={!inSession} projects={projects} onOpenProject={openProject} />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-[#ececf1]">
        {inSession ? (
          <SessionView key={openProjectId ?? "new"} onBack={() => setInSession(false)} openProjectId={openProjectId} />
        ) : (
          <div
            data-scroll-root
            onScroll={handleScroll}
            className="flex-1 space-y-6 overflow-y-auto pb-12 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden bg-[#faf8f5]"
          >
            <FeaturedHero onOpen={setOpenFilm} onCreate={createProject} />
            <div className="sticky top-0 z-20 mb-2 bg-[#faf8f5]/90 backdrop-blur-md">
              <div className="flex items-center gap-2 overflow-x-auto px-5 pb-2 pt-3.5 md:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {["All", ...ROWS.map((r) => r.label)].map((label) => {
                  const active = activeCat === label;
                  return (
                    <button
                      key={label}
                      onClick={() => scrollToCat(label)}
                      className={
                        "shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition " +
                        (active
                          ? "border border-[#1a1a2e] bg-[#1a1a2e] text-white"
                          : "border border-[#ececf1] bg-white text-[#5b5b6b] hover:bg-[#f5f3f0] hover:text-[#1a1a2e]")
                      }
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
            {ROWS.map((r) => (
              <div key={r.label} data-cat={r.label} className="scroll-mt-16">
                <PosterRow
                  label={r.label}
                  films={rowFilms(r.ids)}
                  onOpen={setOpenFilm}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      <FilmDetailModal film={openFilm} onClose={() => setOpenFilm(null)} />
    </div>
  );
}

