"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Sparkles,
  Command,
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
  ArrowUpDown,
  Filter,
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
} from "lucide-react";

/* ---------- Brand helpers (design.md) ---------- */
const gradText =
  "bg-gradient-to-r from-[#ffc078] to-[#ff5e1a] bg-clip-text text-transparent";
const ctaGrad = "bg-gradient-to-br from-[#FFA73C] to-[#FF5255]";
const ctaBtn =
  "rounded-xl bg-gradient-to-br from-[#FFA73C] to-[#FF5255] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(255,82,85,0.28)] transition hover:brightness-105 active:translate-y-[1px]";
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
    createdAt: "Jun 14, 2:41 PM",
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
    createdAt: "Jun 14, 11:08 AM",
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
    createdAt: "Jun 14, 10:32 AM",
    prompt: "4x5 serum carousel, soft gradient",
    model: "Buzz Image v3",
    favorite: false,
    src: "/prototypes/asset-library/images/img-02.webp",
  },
  {
    id: "a5",
    source: "ai",
    type: "image",
    title: "Editorial poster",
    session: "Sunscreen Launch",
    createdAt: "Jun 13, 6:22 PM",
    prompt: "Editorial infographic poster, sunscreen tube",
    model: "Buzz Image v3",
    favorite: false,
    src: "/prototypes/asset-library/images/img-03.png",
  },
  {
    id: "a6",
    source: "ai",
    type: "image",
    title: "Model portrait A",
    session: "Lookbook SS",
    createdAt: "Jun 13, 3:50 PM",
    prompt: "Portrait, cherry blossom backdrop",
    model: "Buzz Image v3",
    favorite: false,
    src: "/prototypes/asset-library/images/img-04.png",
  },
  {
    id: "a7",
    source: "ai",
    type: "image",
    title: "Model portrait B",
    session: "Lookbook SS",
    createdAt: "Jun 13, 1:12 PM",
    prompt: "Portrait, lakeside golden hour",
    model: "Buzz Image v3",
    favorite: false,
    src: "/prototypes/asset-library/images/img-05.png",
  },
  {
    id: "a8",
    source: "ai",
    type: "video",
    title: "Lifestyle b-roll",
    session: "Brand Film",
    createdAt: "Jun 13, 10:05 AM",
    prompt: "Lifestyle b-roll, natural light",
    model: "Buzz Video v2",
    favorite: false,
    src: "/prototypes/asset-library/videos/video-03.mp4",
    duration: "0:12",
  },
  {
    id: "a9",
    source: "ai",
    type: "image",
    title: "Gallery scene",
    session: "Lookbook SS",
    createdAt: "Jun 12, 5:44 PM",
    prompt: "Model in art gallery interior",
    model: "Buzz Image v3",
    favorite: false,
    src: "/prototypes/asset-library/images/img-06.png",
  },
  {
    id: "a10",
    source: "ai",
    type: "image",
    title: "Beverage hero",
    session: "Beverage Campaign",
    createdAt: "Jun 12, 2:30 PM",
    prompt: "High-end beverage on dopamine set",
    model: "Buzz Image v3",
    favorite: false,
    src: "/prototypes/asset-library/images/img-07.webp",
  },
  {
    id: "a11",
    source: "upload",
    type: "image",
    title: "Desk lifestyle",
    session: "Product Lifestyle",
    createdAt: "Jun 12, 9:15 AM",
    prompt: "Product on white minimalist desk",
    model: "Buzz Image v3",
    favorite: false,
    src: "/prototypes/asset-library/images/img-08.jpg",
  },
  {
    id: "a12",
    source: "upload",
    type: "audio",
    title: "Background music.mp3",
    session: "Sonic Branding",
    createdAt: "Jun 12, 8:02 AM",
    prompt: "Upbeat background track",
    model: "Buzz Audio",
    favorite: false,
    src: "/prototypes/asset-library/audio/audio-01.mp3",
    meta: "2:38 - 2.6 MB",
  },
  {
    id: "a13",
    source: "upload",
    type: "image",
    title: "Flat lay food",
    session: "Food Campaign",
    createdAt: "Jun 11, 4:30 PM",
    prompt: "Flat lay food photography, overhead",
    model: "Buzz Image v3",
    favorite: false,
    src: "/prototypes/asset-library/images/img-09.jpg",
  },
  {
    id: "a14",
    source: "upload",
    type: "image",
    title: "OOTD post",
    session: "Social Content",
    createdAt: "Jun 11, 1:12 PM",
    prompt: "Instagram OOTD style post",
    model: "Buzz Image v3",
    favorite: false,
    src: "/prototypes/asset-library/images/img-10.jpg",
  },
  {
    id: "a15",
    source: "upload",
    type: "image",
    title: "KOL shot",
    session: "Influencer Kit",
    createdAt: "Jun 11, 10:40 AM",
    prompt: "KOL product holding shot",
    model: "Buzz Image v3",
    favorite: false,
    src: "/prototypes/asset-library/images/img-11.jpg",
  },
  {
    id: "a16",
    source: "ai",
    type: "video",
    title: "Teaser cut",
    session: "Brand Film",
    createdAt: "Jun 11, 9:02 AM",
    prompt: "20s teaser, fast cuts",
    model: "Buzz Video v2",
    favorite: false,
    src: "/prototypes/asset-library/videos/video-04.mp4",
    duration: "0:20",
  },
  {
    id: "a17",
    source: "ai",
    type: "image",
    title: "Lifestyle frame",
    session: "Product Lifestyle",
    createdAt: "Jun 10, 5:44 PM",
    prompt: "Lifestyle scene, warm tones",
    model: "Buzz Image v3",
    favorite: false,
    src: "/prototypes/asset-library/images/img-12.png",
  },
  {
    id: "a18",
    source: "ai",
    type: "image",
    title: "Catalog shot",
    session: "E-commerce",
    createdAt: "Jun 10, 2:18 PM",
    prompt: "Catalog product shot",
    model: "Buzz Image v3",
    favorite: false,
    src: "/prototypes/asset-library/images/img-13.jpg",
  },
  {
    id: "a19",
    source: "ai",
    type: "image",
    title: "Mini fan product",
    session: "Gadget Campaign",
    createdAt: "Jun 10, 10:11 AM",
    prompt: "Mini fan product on seamless",
    model: "Buzz Image v3",
    favorite: false,
    src: "/prototypes/asset-library/images/img-14.jpg",
  },
  {
    id: "a20",
    source: "upload",
    type: "pdf",
    title: "Campaign info.pdf",
    session: "Q3 Planning",
    createdAt: "Jun 10, 9:48 AM",
    prompt: "Campaign info deck",
    model: "Buzz Docs",
    favorite: false,
    src: "/prototypes/asset-library/pdf/doc-01.pdf",
    meta: "12 pages - 2.2 MB",
  },
  {
    id: "a21",
    source: "upload",
    type: "image",
    title: "Product close-up",
    session: "E-commerce",
    createdAt: "Jun 14, 8:30 AM",
    prompt: "Macro product close-up",
    model: "Buzz Image v3",
    favorite: false,
    src: "/prototypes/asset-library/images/img-15.jpg",
  },
  {
    id: "a22",
    source: "ai",
    type: "image",
    title: "Model studio",
    session: "Lookbook SS",
    createdAt: "Jun 14, 8:12 AM",
    prompt: "Model studio full body",
    model: "Buzz Image v3",
    favorite: false,
    src: "/prototypes/asset-library/images/img-16.png",
  },
  {
    id: "a23",
    source: "ai",
    type: "image",
    title: "Social tile",
    session: "Social Content",
    createdAt: "Jun 9, 11:05 AM",
    prompt: "Square social tile",
    model: "Buzz Image v3",
    favorite: false,
    src: "/prototypes/asset-library/images/img-17.webp",
  },
  {
    id: "a24",
    source: "ai",
    type: "avatar",
    title: "Brand avatar · calm",
    session: "AI Avatar",
    createdAt: "Jun 14, 7:50 AM",
    prompt: "Digital brand spokesperson, calm expression, studio backdrop",
    model: "Buzz Avatar v1",
    favorite: false,
    src: "/prototypes/asset-library/avatars/avatar-01.webp",
  },
  {
    id: "a25",
    source: "ai",
    type: "avatar",
    title: "Brand avatar · portrait",
    session: "AI Avatar",
    createdAt: "Jun 13, 11:30 AM",
    prompt: "Digital brand spokesperson, soft portrait lighting",
    model: "Buzz Avatar v1",
    favorite: false,
    src: "/prototypes/asset-library/avatars/avatar-02.png",
  },
];

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

type View = "agent" | "assets" | "brand";

export function AssetLibraryApp({
  initialView = "assets",
}: {
  initialView?: View;
}) {
  const [view, setView] = useState<View>(initialView);

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
  return <AssetLibraryApp initialView="agent" />;
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
    { key: "agent", label: "Agent", Icon: Command, view: "agent" as const },
    { key: "chat", label: "Chat", Icon: MessageCircle, view: null },
    { key: "workflows", label: "Workflows", Icon: GitBranch, view: null },
    { key: "canvas", label: "Canvas", Icon: Frame, view: null },
  ] as const;
  const libItems = [
    { key: "assets", label: "Asset Library", Icon: FolderOpen },
    { key: "brand", label: "Brand Kits", Icon: SwatchBook },
  ] as const;

  return (
    <aside className="sticky top-0 hidden h-screen w-[180px] shrink-0 flex-col gap-1 bg-white px-3 py-4 lg:flex">
      <div className="mb-4 flex items-center gap-2 px-2">
        <span className={`grid size-8 place-items-center rounded-[9px] ${ctaGrad} text-white`}>
          <Sparkles className="size-4" />
        </span>
        <span className="font-[family-name:var(--font-display)] font-extrabold tracking-tight">
          Buzz
        </span>
      </div>
      {topItems.map(({ key, label, Icon, view: target }) => {
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
            <Icon className="size-[18px]" />
            {label}
          </button>
        );
      })}

      {libItems.map(({ key, label, Icon }) => {
        const isActive = view === key;
        return (
          <button
            key={key}
            onClick={() => setView(key as View)}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition ${
              isActive
                ? "bg-[#fff3ec] text-[#ff5e1a]"
                : "text-[#6a6b7b] hover:bg-[#fff7f1] hover:text-[#ff5e1a]"
            }`}
          >
            <Icon className="size-[18px]" />
            {label}
          </button>
        );
      })}
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
        className="flex max-h-[82vh] w-full max-w-[860px] flex-col overflow-hidden rounded-[22px] bg-white shadow-[0_24px_70px_rgba(26,26,46,0.28)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center justify-between border-b border-[#ececf1] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className={`grid size-8 place-items-center rounded-[9px] ${ctaGrad} text-white`}>
              <FolderOpen className="size-4" />
            </span>
            <div>
              <p className="text-sm font-bold">Add from Asset Library</p>
              <p className="text-[12px] text-[#9a9bb0]">
                Reference generated results & uploads in your prompt
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

        {/* filter tabs */}
        <div className="flex flex-wrap gap-2 px-6 pt-4">
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
        <div className="flex items-center justify-between border-t border-[#ececf1] px-6 py-4">
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
  // 记住选择器是否由「@」唤起,Add 后把那个 @ 删掉
  const atTriggerRef = useRef(false);

  const openPicker = (viaAt: boolean) => {
    atTriggerRef.current = viaAt;
    setPlusOpen(false);
    setPickerOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    // 新打了一个结尾的「@」→ 唤起选择器
    if (v.length > draft.length && v.endsWith("@")) {
      setDraft(v);
      openPicker(true);
      return;
    }
    setDraft(v);
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

          <textarea
            value={draft}
            onChange={handleChange}
            rows={2}
            placeholder="Describe your idea or campaign. Use @ or + to reference assets from your library."
            className="w-full resize-none bg-transparent px-2 pt-1 text-[15px] leading-relaxed text-[#1a1a2e] outline-none placeholder:text-[#9a9bb0]"
          />

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
                        title="Asset Library"
                        desc="Reuse uploaded & generated file"
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
          演示:点输入框里的 + → Asset Library,或在框内打 @,弹出资产选择器
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
  const [favIds, setFavIds] = useState<Set<string>>(
    () => new Set(RAW_ASSETS.filter((a) => a.favorite).map((a) => a.id)),
  );
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [menu, setMenu] = useState<"sort" | "filter" | null>(null);
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
    // RAW_ASSETS is authored newest-first; reverse for oldest
    return sortOrder === "newest" ? list : [...list].reverse();
  }, [assets, filter, source, favIds, sortOrder, demoEmpty]);

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
      <div className="mb-6">
        <h1 className="font-[family-name:var(--font-display)] text-[clamp(26px,3.4vw,36px)] font-extrabold leading-tight tracking-tight">
          Asset Library
        </h1>
      </div>

      {/* filter tabs (hidden when empty) */}
      {demoEmpty !== "global" && (
      <div className="mb-6 flex items-center gap-6">
        {FILTERS.map(({ key, label }) => {
          const active = filter === key;
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`-mb-px border-b-2 pb-2.5 text-[15px] font-semibold transition ${
                active
                  ? "border-[#ff5e1a] text-[#1a1a2e]"
                  : "border-transparent text-[#9a9bb0] hover:text-[#1a1a2e]"
              }`}
            >
              {label}
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-1 pb-1.5">
          {/* sort */}
          <div className="relative">
            <ToolbarButton
              icon={ArrowUpDown}
              label={sortOrder === "newest" ? "Newest" : "Oldest"}
              caret
              onClick={() => setMenu(menu === "sort" ? null : "sort")}
            />
            {menu === "sort" && (
              <Dropdown align="left" onClose={() => setMenu(null)}>
                <MenuItem
                  label="Newest first"
                  active={sortOrder === "newest"}
                  onClick={() => {
                    setSortOrder("newest");
                    setMenu(null);
                  }}
                />
                <MenuItem
                  label="Oldest first"
                  active={sortOrder === "oldest"}
                  onClick={() => {
                    setSortOrder("oldest");
                    setMenu(null);
                  }}
                />
              </Dropdown>
            )}
          </div>

          {/* select */}
          <ToolbarButton
            icon={ListChecks}
            label={selecting ? "Done" : "Select"}
            active={selecting}
            onClick={() => (selecting ? exitSelect() : setSelecting(true))}
          />

          {/* filter (source) */}
          <div className="relative">
            <ToolbarButton
              icon={Filter}
              label="Filter"
              caret
              active={source !== "all"}
              onClick={() => setMenu(menu === "filter" ? null : "filter")}
            />
            {menu === "filter" && (
              <Dropdown align="right" onClose={() => setMenu(null)}>
                <p className="px-3 pb-1 pt-1.5 text-[11px] font-bold uppercase tracking-wider text-[#b4b4c2]">
                  Source
                </p>
                <MenuItem label="All sources" active={source === "all"} onClick={() => { setSource("all"); setMenu(null); }} />
                <MenuItem label="AI generated" active={source === "ai"} onClick={() => { setSource("ai"); setMenu(null); }} />
                <MenuItem label="User uploaded" active={source === "upload"} onClick={() => { setSource("upload"); setMenu(null); }} />
              </Dropdown>
            )}
          </div>

          {/* upload */}
          <button
            onClick={() => flash("Upload dialog (demo)")}
            className={`ml-1 flex items-center gap-1.5 rounded-lg ${ctaGrad} px-3 py-1.5 text-sm font-bold text-white shadow-[0_6px_16px_rgba(255,82,85,0.26)] transition hover:brightness-105`}
          >
            <Plus className="size-4" /> Upload
          </button>
        </div>
      </div>
      )}

      {/* content grouped by date */}
      {emptyLabel ? (
        <EmptyState label={emptyLabel} />
      ) : (
        <div className="space-y-9">
          {groups.map(([day, items]) => (
            <section key={day}>
              <h3 className="mb-4 font-[family-name:var(--font-display)] text-xl font-extrabold tracking-tight text-[#1a1a2e]">
                {day}
              </h3>
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

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
  active,
  caret,
}: {
  icon: typeof Filter;
  label: string;
  onClick: () => void;
  active?: boolean;
  caret?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold transition ${
        active
          ? "bg-[#fff3ec] text-[#ff5e1a]"
          : "text-[#6a6b7b] hover:bg-[#f4f3f7] hover:text-[#1a1a2e]"
      }`}
    >
      <Icon className="size-4" />
      {label}
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
  { src: "/prototypes/asset-library/1.webp", rot: -13, y: 16, z: 4 },
  { src: "/prototypes/asset-library/2.png", rot: -4, y: 2, z: 3 },
  { src: "/prototypes/asset-library/3.png", rot: 5, y: 6, z: 2 },
  { src: "/prototypes/asset-library/4.png", rot: 14, y: 16, z: 1 },
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
        <Sparkles className="size-4" /> Generate
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
    "/prototypes/asset-library/images/img-05.png",
    "/prototypes/asset-library/images/img-16.png",
    "/prototypes/asset-library/images/img-04.png",
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
