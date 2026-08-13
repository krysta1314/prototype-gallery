"use client";

import Image from "next/image";
import Link from "next/link";
import localFont from "next/font/local";
import { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Lock,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Search,
  Trash2,
  Users,
  FolderOpen,
  Eye,
  AlertTriangle,
} from "lucide-react";
import { CURRENT_USER_ID, initials } from "../_shared/data";
import { TeamProvider, useTeam } from "../_shared/team-context";
import { TeamSwitcher } from "../_shared/team-switcher";
import { TeamQuota } from "../_shared/team-quota";
import { TeamOverlays } from "../_shared/team-overlays";
import { DemoBar } from "../_shared/demo-bar";
import { FinanceNotice } from "../_shared/finance-notice";

const CANVAS_ROOT = "/prototypes/homepage";
const ICON_ROOT = "/prototypes/starter-guide/icons";
const ICONS = {
  logo: `${ICON_ROOT}/buzz-video-logo.svg`,
  home: `${ICON_ROOT}/home.svg`,
  agent: `${ICON_ROOT}/marketing-agent.svg`,
  canvas: `${ICON_ROOT}/canvas.svg`,
  workflow: `${ICON_ROOT}/workflow.svg`,
};
const APPLE_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif';
const bricolageExtraBold = localFont({
  src: "../../../../fonts/BricolageGrotesque-ExtraBold.ttf",
  weight: "800",
  display: "swap",
});
const projectAssets = [
  "/prototypes/asset-library/images/img-01.jpg",
  "/prototypes/asset-library/images/img-02.jpg",
  "/prototypes/asset-library/images/img-03.jpg",
] as const;

type Project = {
  name: string;
  updatedAt: string;
  scenes: string[];
  scope: "private" | "team";
  authorId: string;
  authorName: string;
  authorColor: string;
};

const ME = { id: CURRENT_USER_ID, name: "Monica Zhou", color: "#ff7955" };
const A = (name: string, color: string) => ({ authorId: name === ME.name ? ME.id : `u-${name.split(" ")[0]!.toLowerCase()}`, authorName: name, authorColor: color });

const mk = (
  name: string,
  updatedAt: string,
  scenes: string[],
  scope: "private" | "team",
  author: ReturnType<typeof A> = A(ME.name, ME.color),
): Project => ({ name, updatedAt, scenes, scope, ...author });

const PRIVATE_BUCKET = "private";

/** 私有区跟人走(全局一份);团队区按 teamId 分,新建团队为空 → 走空状态 */
const PROJECT_BUCKETS: Record<string, Project[]> = {
  [PRIVATE_BUCKET]: [
    mk("Summer launch", "2026-07-22 20:34", [projectAssets[0], projectAssets[1], projectAssets[2]], "private"),
    mk("UGC refresh", "2026-07-22 18:12", [projectAssets[1], projectAssets[2], projectAssets[0]], "private"),
    mk("Skincare drop", "2026-07-21 14:46", [projectAssets[2], projectAssets[0], projectAssets[1]], "private"),
    mk("Back to school", "2026-07-16 09:20", [], "private"),
  ],
  "t-growth": [
    mk("Q3 brand film", "2026-07-23 11:05", [projectAssets[1], projectAssets[0], projectAssets[2]], "team", A("Alex Chen", "#1a1a2e")),
    mk("Retail promo cutdowns", "2026-07-22 16:40", [projectAssets[2], projectAssets[1], projectAssets[0]], "team", A("Vera Lam", "#5b6cff")),
    mk("Autumn lookbook", "2026-07-20 09:58", [projectAssets[0], projectAssets[2], projectAssets[1]], "team", A("Kenji Ito", "#12a594")),
    mk("Localized ad set", "2026-07-18 15:22", [], "team"),
  ],
  "t-beauty": [
    mk("Glow serum launch", "2026-07-23 10:15", [projectAssets[2], projectAssets[0], projectAssets[1]], "team", A("Sofia Ruiz", "#e0568a")),
    mk("Summer SPF reels", "2026-07-17 08:44", [projectAssets[0], projectAssets[1], projectAssets[2]], "team", A("Mei Wong", "#f0a020")),
  ],
};

type WorkflowCategory = "Image" | "Video" | "Audio" | "Tools";

type WorkflowTemplate = {
  title: string;
  image?: string;
  category: WorkflowCategory;
};

const WORKFLOW_FILTERS: readonly ("All" | WorkflowCategory)[] = ["All", "Image", "Video", "Audio", "Tools"];

const workflowTemplates: WorkflowTemplate[] = [
  { title: "Word-of-mouth recommendation", image: projectAssets[0], category: "Video" },
  { title: "Product unboxing", image: projectAssets[1], category: "Video" },
  { title: "Product review", image: projectAssets[2], category: "Video" },
  { title: "Product comparison review", image: projectAssets[0], category: "Video" },
  { title: "Funny short drama", image: projectAssets[1], category: "Video" },
  { title: "Camera choreography", image: projectAssets[2], category: "Video" },
  { title: "Photoreal CGI product ad", image: projectAssets[0], category: "Video" },
  { title: "Mini episodes of Otome", image: projectAssets[1], category: "Video" },
  { title: "Tech product ads", image: projectAssets[2], category: "Video" },
  { title: "Creator launch story", image: projectAssets[0], category: "Video" },
  { title: "UGC Spokesperson Ad", image: projectAssets[1], category: "Video" },
  { title: "Before / After Demo", image: projectAssets[2], category: "Video" },
  { title: "Problem-Solution Ad", image: projectAssets[0], category: "Video" },
  { title: "Ad Variation Batch", image: projectAssets[1], category: "Video" },
  { title: "Multi-language Localized Ad", image: projectAssets[2], category: "Video" },
  { title: "Product hero shots", image: projectAssets[1], category: "Image" },
  { title: "Lifestyle scene set", image: projectAssets[2], category: "Image" },
  { title: "AI model lookbook", image: projectAssets[0], category: "Image" },
  { title: "White-Background Listing Set", image: projectAssets[1], category: "Image" },
  { title: "Voiceover ad read", image: projectAssets[1], category: "Audio" },
  { title: "Brand jingle", image: projectAssets[2], category: "Audio" },
  { title: "Podcast promo", image: projectAssets[0], category: "Audio" },
  { title: "URL to campaign", image: projectAssets[1], category: "Tools" },
  { title: "Full campaign brief", image: projectAssets[2], category: "Tools" },
  { title: "Content calendar plan", image: projectAssets[0], category: "Tools" },
  { title: "URL to Video Ad", image: projectAssets[1], category: "Tools" },
] as const;

type View = "canvas" | "projects" | "team";

function ProjectCard({
  project,
  menuOpen = false,
  onMenuChange,
  isPinned = false,
  onTogglePin,
  onPublish,
  onUnpublish,
  onDelete,
  canDelete = true,
  canUnpublish = true,
  canEdit = true,
}: {
  project: Project;
  menuOpen?: boolean;
  onMenuChange?: (open: boolean) => void;
  isPinned?: boolean;
  onTogglePin?: () => void;
  onPublish?: () => void;
  onUnpublish?: () => void;
  onDelete?: () => void;
  canDelete?: boolean;
  canUnpublish?: boolean;
  canEdit?: boolean;
}) {
  const emptyProjectMaskId = `project-mask-${project.name.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <article className="group relative z-0 flex aspect-video min-w-0 flex-col overflow-visible rounded-[24px] border border-[#ececf1] bg-white p-1.5 shadow-[0_10px_26px_rgba(26,26,46,0.04)] transition hover:z-20 hover:-translate-y-0.5 hover:border-[#ff8c6c] hover:ring-2 hover:ring-[#ff8c6c]/15 hover:shadow-[0_14px_32px_rgba(26,26,46,0.08)] focus-within:z-20 min-[640px]:aspect-auto">
      {isPinned && (
        <button
          type="button"
          onClick={onTogglePin}
          aria-label={`Unpin ${project.name}`}
          className="absolute left-3 top-3 z-10 text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)] transition hover:scale-110"
        >
          <Pin className="size-5 fill-white" />
        </button>
      )}
      {!canEdit && (
        <span className="pointer-events-none absolute right-3 top-3 z-10 flex items-center gap-1 rounded-md bg-black/45 px-1.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur">
          <Eye className="size-3" />
          Read-only
        </span>
      )}
      {project.scenes.length > 0 ? (
        <div className="grid min-h-0 flex-1 grid-cols-[1.8fr_0.72fr] gap-1.5 min-[640px]:aspect-video min-[640px]:flex-none">
          <div className="relative min-h-0 overflow-hidden rounded-[15px] bg-[#f0edf0]">
            <Image
              src={project.scenes[0]!}
              alt=""
              fill
              sizes="(max-width: 700px) 56vw, (max-width: 1100px) 24vw, 17vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          </div>
          <div className="grid min-h-0 gap-1.5">
            {project.scenes.slice(1).map((scene) => (
              <div key={scene} className="relative min-h-0 overflow-hidden rounded-[15px] bg-[#f0edf0]">
                <Image
                  src={scene}
                  alt=""
                  fill
                  sizes="(max-width: 700px) 20vw, (max-width: 1100px) 8vw, 6vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="relative grid min-h-0 flex-1 grid-cols-[1.8fr_0.72fr] gap-1.5 overflow-hidden min-[640px]:aspect-video min-[640px]:flex-none">
          <svg viewBox="0 0 1000 560" preserveAspectRatio="none" aria-hidden="true" className="absolute inset-0 size-full">
            <defs>
              <clipPath id={emptyProjectMaskId}>
                <rect x="0" y="0" width="710" height="560" rx="54" />
                <rect x="730" y="0" width="270" height="272" rx="54" />
                <rect x="730" y="288" width="270" height="272" rx="54" />
              </clipPath>
            </defs>
            <g clipPath={`url(#${emptyProjectMaskId})`}>
              <rect width="1000" height="560" fill="#f4f1f3" />
              <image
                href={ICONS.logo}
                x="56"
                y="-164"
                width="888"
                height="888"
                preserveAspectRatio="xMidYMid meet"
                opacity="0.14"
                style={{ filter: "grayscale(1)" }}
              />
            </g>
          </svg>
        </div>
      )}
      <div className="flex min-h-[64px] min-w-0 items-start gap-2 px-2 py-2 text-left">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-bold tracking-[-0.02em] text-[#29232f]">{project.name}</p>
          {project.scope === "team" ? (
            <p className="mt-1 flex min-w-0 items-center gap-1.5 text-[12px] font-medium text-[#89828d]">
              <span aria-hidden="true" className="grid size-4 shrink-0 place-items-center rounded-full text-[8px] font-bold text-white" style={{ background: project.authorColor }}>
                {initials(project.authorName)}
              </span>
              <span className="truncate">
                by {project.authorId === CURRENT_USER_ID ? "you" : project.authorName} · <span className="tabular-nums">{project.updatedAt}</span>
              </span>
            </p>
          ) : (
            <p className="mt-1 truncate text-[12px] font-medium tabular-nums text-[#89828d]">{project.updatedAt}</p>
          )}
        </div>
        <span className="relative mt-0.5 shrink-0" data-project-menu>
          <button
            type="button"
            data-project-menu
            onClick={() => onMenuChange?.(!menuOpen)}
            aria-label={`More actions for ${project.name}`}
            aria-expanded={menuOpen}
            className={`grid size-8 place-items-center rounded-lg text-[#777889] transition hover:bg-[#fff3ec] hover:text-[#ff5e1a] ${menuOpen ? "bg-[#fff3ec] text-[#ff5e1a]" : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"}`}
          >
            <MoreHorizontal className="size-4" />
          </button>
          {menuOpen && (
            <div data-project-menu className="absolute bottom-10 right-0 z-20 w-44 overflow-hidden rounded-xl border border-[#ececf1] bg-white py-1 shadow-[0_14px_30px_rgba(26,26,46,0.16)]">
              <button type="button" onClick={() => { onTogglePin?.(); onMenuChange?.(false); }} className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-semibold text-[#1a1a2e] transition hover:bg-[#f5f3f4]">{isPinned ? <><PinOff className="size-4" /> Unpin</> : <><Pin className="size-4" /> Pin to top</>}</button>
              <button
                type="button"
                disabled={!canEdit}
                title={canEdit ? undefined : "Only the author can edit this project."}
                onClick={() => onMenuChange?.(false)}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-semibold text-[#1a1a2e] transition hover:bg-[#fff7f1] disabled:cursor-not-allowed disabled:text-[#c3bcc8] disabled:hover:bg-transparent"
              >
                <Pencil className="size-4" /> Rename
              </button>
              <button type="button" onClick={() => onMenuChange?.(false)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-semibold text-[#1a1a2e] transition hover:bg-[#fff7f1]"><Copy className="size-4" /> Copy</button>
              {project.scope === "private" && onPublish && (
                <button type="button" onClick={() => { onPublish(); onMenuChange?.(false); }} className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-semibold text-[#1a1a2e] transition hover:bg-[#fff7f1]"><Users className="size-4" /> Publish to team</button>
              )}
              {project.scope === "team" && onUnpublish && canUnpublish && (
                <button type="button" onClick={() => { onUnpublish(); onMenuChange?.(false); }} className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-semibold text-[#1a1a2e] transition hover:bg-[#fff7f1]"><Lock className="size-4" /> Move to my projects</button>
              )}
              <button
                type="button"
                disabled={!canDelete}
                title={canDelete ? undefined : "Only the author, admins, or the owner can delete this."}
                onClick={() => { onDelete?.(); onMenuChange?.(false); }}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-semibold text-[#ef5139] transition hover:bg-[#fff7f1] disabled:cursor-not-allowed disabled:text-[#c3bcc8] disabled:hover:bg-transparent"
              >
                <Trash2 className="size-4" /> Delete
              </button>
            </div>
          )}
        </span>
      </div>
    </article>
  );
}

function CanvasHero() {
  return (
    <div className="relative mx-auto max-w-[1600px]">
      <div className="relative isolate h-[300px] overflow-hidden rounded-[24px] border border-[#ffe0d4] bg-[#fff6f2] sm:h-[340px]">
        <Image
          src={`${CANVAS_ROOT}/canvas-grid.svg`}
          alt=""
          fill
          sizes="100vw"
          className="pointer-events-none z-0 object-cover"
          priority
        />
        <Image
          src="/prototypes/workflow-canvas/frame-46341.png"
          alt="Canvas workflow connecting a prompt, image generation, and video creation"
          width={2724}
          height={869}
          sizes="100vw"
          className="pointer-events-none absolute left-1/2 top-[70%] z-[1] h-auto w-full max-w-none -translate-x-1/2 -translate-y-1/2 select-none"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[2] rounded-[inherit]"
          style={{
            background: [
              "linear-gradient(90deg, rgba(255, 111, 76, 0.48) 0%, rgba(255, 111, 76, 0.12) 8%, transparent 18%, transparent 82%, rgba(255, 111, 76, 0.12) 92%, rgba(255, 111, 76, 0.48) 100%)",
              "linear-gradient(180deg, rgba(255, 111, 76, 0.54) 0%, rgba(255, 111, 76, 0.12) 16%, transparent 32%, transparent 68%, rgba(255, 111, 76, 0.16) 86%, rgba(255, 111, 76, 0.54) 100%)",
              "radial-gradient(ellipse at center, transparent 0%, transparent 52%, rgba(255, 111, 76, 0.06) 66%, rgba(255, 111, 76, 0.16) 84%, rgba(255, 111, 76, 0.34) 100%)",
            ].join(", "),
            boxShadow:
              "inset 0 0 18px rgba(255, 111, 76, 0.3), inset 0 0 60px rgba(255, 111, 76, 0.18)",
          }}
        />
        <div className="relative z-[3] flex h-full items-center justify-center px-6 text-center sm:px-10">
          <div className="relative z-20 flex flex-col items-center">
            <h2 className={`${bricolageExtraBold.className} text-[clamp(22px,2.2vw,34px)] leading-tight tracking-[-0.035em] text-[#151722] lg:whitespace-nowrap`}>
              One canvas.{" "}
              <span className="bg-gradient-to-r from-[#ffa73c] to-[#ff5255] bg-clip-text text-transparent">
                Every workflow
              </span>
              .
            </h2>
            <p className="mt-3 max-w-[520px] text-[15px] leading-relaxed text-[#6a6b7b] sm:text-[17px]">
              Moodboard and chain workflows, all on one canvas.
            </p>
            <button aria-label="Try Canvas" className="mt-5 w-fit transition hover:-translate-y-0.5">
              <Image
                src={`${CANVAS_ROOT}/canvas-button.svg`}
                alt="Try Canvas"
                width={198}
                height={56}
                className="h-12 w-auto select-none sm:h-[52px]"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


function ProjectGrid({
  items,
  render,
}: {
  items: Project[];
  render: (project: Project) => React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-8 min-[640px]:grid-cols-2 min-[820px]:grid-cols-3 min-[960px]:grid-cols-4 min-[1440px]:grid-cols-5">
      {items.map((project) => (
        <div key={project.name} className="min-w-0">
          {render(project)}
        </div>
      ))}
    </div>
  );
}

function CanvasWorkspace() {
  const { role, isPersonal, team, showToast, quotaBlock, openSettings } = useTeam();
  const [buckets, setBuckets] = useState<Record<string, Project[]>>(PROJECT_BUCKETS);
  const privateProjects = buckets[PRIVATE_BUCKET] ?? [];
  const teamProjects = buckets[team.id] ?? [];
  /** 在两个桶之间搬一条记录,同时改 scope */
  const moveProject = (project: Project, from: string, to: string, scope: "private" | "team") =>
    setBuckets((prev) => ({
      ...prev,
      [from]: (prev[from] ?? []).filter((p) => p.name !== project.name),
      [to]: [{ ...project, scope }, ...(prev[to] ?? [])],
    }));
  const [view, setView] = useState<View>("canvas");
  const [projectQuery, setProjectQuery] = useState("");
  const [openProjectMenu, setOpenProjectMenu] = useState<string | null>(null);
  const [workflowFilter, setWorkflowFilter] = useState<"All" | WorkflowCategory>("All");
  const [pinnedNames, setPinnedNames] = useState<string[]>(["Skincare drop"]);
  const [publishTarget, setPublishTarget] = useState<Project | null>(null);
  const [newScope, setNewScope] = useState<"private" | "team">("private");
  const [scopeMenuOpen, setScopeMenuOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);

  /** 撞到硬上限或池空时不放行,弹出对应说明 */
  const startCreate = () => {
    if (role === "finance") {
      showToast("Billing contacts don't have product access.");
      return;
    }
    if (quotaBlock) {
      setBlockOpen(true);
      return;
    }
    showToast(`New project will be created in ${newScope === "team" ? "Team Projects" : "My Projects"}.`);
  };

  const canModerate = role === "owner" || role === "admin";
  const canDelete = (project: Project) => project.scope === "private" || canModerate || project.authorId === CURRENT_USER_ID;
  const canEdit = (project: Project) => project.scope === "private" || project.authorId === CURRENT_USER_ID;
  // 撤回发布 = 把作品挪回自己的私有区,只有作者本人能做
  const canUnpublish = (project: Project) => project.authorId === CURRENT_USER_ID;

  // 个人团队没有 Team Projects
  useEffect(() => {
    if (isPersonal && view === "team") setView("projects");
    if (isPersonal && newScope === "team") setNewScope("private");
  }, [isPersonal, view, newScope]);

  useEffect(() => {
    setNewScope(view === "team" ? "team" : "private");
  }, [view]);

  const togglePin = (name: string) =>
    setPinnedNames((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [name, ...prev]));

  const publish = (project: Project) => {
    moveProject(project, PRIVATE_BUCKET, team.id, "team");
    showToast("Moved to Team Projects");
    setPublishTarget(null);
  };

  const unpublish = (project: Project) => {
    moveProject(project, team.id, PRIVATE_BUCKET, "private");
    showToast("Moved to My Projects");
  };

  const removeProject = (project: Project) => {
    const bucket = project.scope === "team" ? team.id : PRIVATE_BUCKET;
    setBuckets((prev) => ({ ...prev, [bucket]: (prev[bucket] ?? []).filter((p) => p.name !== project.name) }));
    showToast(`${project.name} deleted.`);
  };

  const matches = (project: Project) => project.name.toLowerCase().includes(projectQuery.trim().toLowerCase());
  const recentProjects = [...privateProjects, ...(isPersonal ? [] : teamProjects)].slice(0, 4);

  const visiblePrivate = privateProjects.filter(matches);
  const visibleTeam = teamProjects.filter(matches);
  const pinnedVisible = pinnedNames
    .map((name) => visiblePrivate.find((project) => project.name === name))
    .filter((project): project is Project => Boolean(project));
  const unpinnedVisible = visiblePrivate.filter((project) => !pinnedNames.includes(project.name));

  useEffect(() => {
    if (!openProjectMenu) return;
    const closeProjectMenu = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest("[data-project-menu]")) setOpenProjectMenu(null);
    };
    document.addEventListener("mousedown", closeProjectMenu);
    return () => document.removeEventListener("mousedown", closeProjectMenu);
  }, [openProjectMenu]);

  useEffect(() => {
    if (!scopeMenuOpen) return;
    const close = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest("[data-scope-menu]")) setScopeMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [scopeMenuOpen]);

  const cardProps = (project: Project) => ({
    project,
    menuOpen: openProjectMenu === project.name,
    onMenuChange: (open: boolean) => setOpenProjectMenu(open ? project.name : null),
    isPinned: pinnedNames.includes(project.name),
    onTogglePin: () => togglePin(project.name),
    onPublish: isPersonal ? undefined : () => setPublishTarget(project),
    onUnpublish: () => unpublish(project),
    onDelete: () => removeProject(project),
    canDelete: canDelete(project),
    canUnpublish: canUnpublish(project),
    canEdit: canEdit(project),
  });

  const tabs: { key: View; label: string }[] = [
    { key: "canvas", label: "Canvas" },
    { key: "projects", label: "My Projects" },
    ...(isPersonal ? [] : [{ key: "team" as View, label: "Team Projects" }]),
  ];

  return (
    <div className="min-h-screen bg-[#fcfbfd] text-[#24202a]" style={{ fontFamily: APPLE_FONT }}>
      <DemoBar page="canvas" />

      <aside className="fixed bottom-0 left-0 top-[52px] z-20 hidden w-[216px] flex-col border-r border-[#ebe8ee] bg-white px-4 py-5 lg:flex">
        <Link href="/" className={`${bricolageExtraBold.className} flex items-center gap-2.5 px-2 text-[18px] tracking-[-0.04em] text-[#211b29]`}>
          <Image src={ICONS.logo} alt="Buzz" width={32} height={32} className="size-8" />
          Buzz
        </Link>
        <div className="mt-4">
          <TeamSwitcher />
        </div>
        <nav className="mt-3 grid gap-1" aria-label="Primary navigation">
          <Link href="/prototypes/team-workspace/home" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-semibold text-[#706a78] transition hover:bg-[#fff3ee] hover:text-[#ef6646]">
            <Image src={ICONS.home} alt="" width={18} height={18} className="size-[18px]" />
            Home
          </Link>
          <Link href="/prototypes/team-workspace/agent" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-semibold text-[#706a78] transition hover:bg-[#fff3ee] hover:text-[#ef6646]">
            <Image src={ICONS.agent} alt="" width={18} height={18} className="size-[18px]" />
            Marketing Agent
          </Link>
          <span className="flex items-center gap-3 rounded-xl bg-[#fff0ea] px-3 py-2.5 text-[14px] font-bold text-[#ee6545]">
            <span
              aria-hidden="true"
              className="size-[18px] bg-[#ee6545]"
              style={{
                mask: `url('${ICONS.canvas}') center / contain no-repeat`,
                WebkitMask: `url('${ICONS.canvas}') center / contain no-repeat`,
              }}
            />
            Canvas
          </span>
          <Link href="/prototypes/team-workspace/assets" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-semibold text-[#706a78] transition hover:bg-[#fff3ee] hover:text-[#ef6646]">
            <FolderOpen className="size-[18px]" />
            Assets
          </Link>
        </nav>
      </aside>

      <main className="min-h-screen lg:ml-[216px]">
        <header className="flex items-center justify-end gap-2.5 px-4 py-3 sm:px-6">
          <TeamQuota />
        </header>

        <div className="mx-auto max-w-[1600px] px-5 pb-8 sm:px-8 lg:px-10">
          <FinanceNotice className="mb-5" />
          <div className="border-b border-[#e8e5eb]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5 lg:hidden"><Image src={ICONS.logo} alt="Buzz" width={28} height={28} className="size-7" /><span className={`${bricolageExtraBold.className} text-[16px]`}>Buzz</span></div>
                <h1 className={`${bricolageExtraBold.className} mt-5 text-[clamp(30px,3vw,42px)] tracking-[-0.05em] text-[#211b29] lg:mt-0`}>Canvas</h1>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {!isPersonal && (
                  <div className="relative" data-scope-menu>
                    <button
                      type="button"
                      data-scope-menu
                      onClick={() => setScopeMenuOpen((v) => !v)}
                      aria-expanded={scopeMenuOpen}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#ececf1] bg-white px-3 py-2.5 text-[13px] font-semibold text-[#56505c] transition hover:border-[#ddd7df]"
                    >
                      {newScope === "team" ? <Users className="size-4 text-[#8a8490]" /> : <Lock className="size-4 text-[#8a8490]" />}
                      in {newScope === "team" ? "Team Projects" : "My Projects"}
                      <ChevronDown className="size-3.5 text-[#9a94a0]" />
                    </button>
                    {scopeMenuOpen && (
                      <div data-scope-menu className="absolute right-0 top-[calc(100%+6px)] z-30 w-[220px] rounded-xl border border-[#ececf1] bg-white p-1.5 shadow-[0_14px_32px_rgba(26,26,46,0.14)]">
                        {(["private", "team"] as const).map((scope) => (
                          <button
                            key={scope}
                            type="button"
                            onClick={() => { setNewScope(scope); setScopeMenuOpen(false); }}
                            className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-semibold transition ${newScope === scope ? "bg-[#fff3ee] text-[#ee6545]" : "text-[#56505c] hover:bg-[#f6f4f7]"}`}
                          >
                            {scope === "team" ? <Users className="size-4" /> : <Lock className="size-4" />}
                            {scope === "team" ? "Team Projects" : "My Projects"}
                          </button>
                        ))}
                        <p className="px-2.5 pb-1.5 pt-2 text-[11px] leading-snug text-[#9a94a0]">
                          Team projects are visible to everyone in {team.name}.
                        </p>
                      </div>
                    )}
                  </div>
                )}
                <button
                  type="button"
                  onClick={startCreate}
                  disabled={role === "finance"}
                  title={role === "finance" ? "Billing contacts don't have product access." : undefined}
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#24202a] px-4 py-2.5 text-[13px] font-bold text-white shadow-sm transition hover:bg-[#3b3442] disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <Plus className="size-4" />
                  Create Project
                </button>
              </div>
            </div>
            <div className="mt-5 flex gap-6" role="tablist" aria-label="Canvas view">
              {tabs.map((tab) => {
                const active = tab.key === view;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setView(tab.key)}
                    className={`relative pb-4 text-[15px] font-bold transition ${active ? "text-[#25202a]" : "text-[#8a8490] hover:text-[#56505c]"}`}
                  >
                    {tab.label}
                    {active && <span className="absolute inset-x-0 -bottom-px h-[3px] rounded-t-full bg-[#ff7955]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {view === "canvas" && (
            <div className="space-y-12 pt-7 sm:space-y-16 sm:pt-8">
              <CanvasHero />

              <section>
                <div className="mb-5 flex items-center justify-between gap-4">
                  <h2 className={`${bricolageExtraBold.className} text-[24px] tracking-[-0.035em] text-[#28222e]`}>Recent projects</h2>
                  <button type="button" onClick={() => setView("projects")} className="group inline-flex shrink-0 items-center gap-0.5 text-[13px] font-bold text-[#625b68] transition hover:text-[#ef6646]">View all<ChevronRight className="size-4 transition group-hover:translate-x-0.5" /></button>
                </div>
                <div className="grid grid-cols-1 gap-4 min-[640px]:grid-cols-2 min-[900px]:grid-cols-3 min-[1280px]:grid-cols-4 min-[1440px]:grid-cols-5">
                  <button type="button" onClick={startCreate} className="group flex aspect-video flex-col overflow-hidden rounded-[24px] border border-dashed border-[#d8d0d6] bg-white p-1.5 text-[#6b6470] transition hover:border-[#ff9579] hover:bg-[#fff8f4] hover:text-[#ef6646] min-[640px]:aspect-auto">
                    <span className="flex min-h-0 flex-1 items-center justify-center rounded-[15px] bg-[#f4f2f4] min-[640px]:aspect-video min-[640px]:flex-none"><span className="grid size-11 place-items-center rounded-full bg-[#fff0ea] text-[#ef6646] transition group-hover:scale-105"><Plus className="size-5" /></span></span>
                    <span className="flex min-h-[64px] items-center px-2 text-left text-[14px] font-bold">Create new project</span>
                  </button>
                  {recentProjects.map((project, index) => {
                    const visibility = [
                      "hidden min-[640px]:block",
                      "hidden min-[900px]:block",
                      "hidden min-[1280px]:block",
                      "hidden min-[1440px]:block",
                    ][index];
                    return (
                      <div key={project.name} className={`min-w-0 ${visibility}`}>
                        <ProjectCard {...cardProps(project)} />
                      </div>
                    );
                  })}
                </div>
              </section>

              <section id="workflows" className="scroll-mt-6 pb-10">
                <div className="mb-5">
                  <h2 className={`${bricolageExtraBold.className} text-[24px] tracking-[-0.035em] text-[#28222e]`}>Workflows</h2>
                  <div className="mt-4 flex flex-wrap items-center gap-2" role="tablist" aria-label="Workflow categories">
                    {WORKFLOW_FILTERS.map((filter) => {
                      const isActive = workflowFilter === filter;
                      return (
                        <button
                          key={filter}
                          type="button"
                          role="tab"
                          aria-selected={isActive}
                          onClick={() => setWorkflowFilter(filter)}
                          className={`relative flex h-8 shrink-0 items-center justify-center rounded-lg border px-[14px] text-[13px] font-semibold leading-4 backdrop-blur-xl transition-[background-color,color,filter] motion-reduce:transition-none ${
                            isActive
                              ? "border-transparent bg-[#1a1a2e] text-white shadow-[0_3px_8px_rgba(26,26,46,0.18)]"
                              : "border-[#ece7ea] bg-white/60 text-[#7b7480] shadow-[0_2px_6px_rgba(31,25,35,0.05)] hover:border-[#e3dae0] hover:bg-white hover:text-[#28222e]"
                          }`}
                        >
                          {filter}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="grid gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  {workflowTemplates
                    .filter((workflow) => workflowFilter === "All" || workflow.category === workflowFilter)
                    .map((workflow) => (
                    <button key={workflow.title} type="button" className="group min-w-0 text-left">
                      <div className="relative aspect-[1.78] overflow-hidden rounded-[16px] border border-[#e8e5e8] bg-[#f4f2f4] shadow-[0_5px_16px_rgba(31,25,35,0.04)] transition duration-200 group-hover:-translate-y-0.5 group-hover:border-[#ff987d] group-hover:shadow-[0_10px_24px_rgba(31,25,35,0.1)]">
                        {workflow.image ? (
                          <Image src={workflow.image} alt="" fill sizes="(max-width: 640px) 90vw, (max-width: 1024px) 43vw, (max-width: 1280px) 29vw, 18vw" className="object-cover transition duration-500 group-hover:scale-105" />
                        ) : (
                          <div className="absolute inset-0 bg-[linear-gradient(135deg,#f7f5f6_0%,#eeebee_100%)]" />
                        )}
                      </div>
                      <p className="mt-2 truncate text-[14px] font-semibold tracking-[-0.01em] text-[#302a35] transition group-hover:text-[#ef6646]">{workflow.title}</p>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}

          {view === "projects" && (
            <section className="pt-8">
              <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className={`${bricolageExtraBold.className} text-[26px] tracking-[-0.04em] text-[#28222e]`}>My Projects</h2>
                  <p className="mt-1 text-[14px] text-[#7b7480]">Private to you. Publish one to share it with your team.</p>
                </div>
                <label className="flex h-10 w-full min-w-0 items-center gap-2 rounded-xl border border-[#ececf1] bg-white px-3 text-sm transition focus-within:border-[#ff5e1a] sm:w-[240px]"><Search className="size-4 shrink-0 text-[#9a9bb0]" /><input value={projectQuery} onChange={(event) => setProjectQuery(event.target.value)} placeholder="Search projects" className="w-full bg-transparent text-[#1a1a2e] outline-none placeholder:text-[#9a9bb0]" /></label>
              </div>
              {visiblePrivate.length > 0 ? (
                <div className="space-y-8">
                  {pinnedVisible.length > 0 && (
                    <section>
                      <h3 className="mb-4 text-[15px] font-semibold tracking-[-0.01em] text-[#29232f]">Pinned</h3>
                      <ProjectGrid items={pinnedVisible} render={(project) => <ProjectCard {...cardProps(project)} />} />
                    </section>
                  )}
                  {unpinnedVisible.length > 0 && (
                    <section>
                      {pinnedVisible.length > 0 && (
                        <h3 className="mb-4 text-[15px] font-semibold tracking-[-0.01em] text-[#29232f]">All projects</h3>
                      )}
                      <ProjectGrid items={unpinnedVisible} render={(project) => <ProjectCard {...cardProps(project)} />} />
                    </section>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[#ddd7df] bg-white px-5 py-14 text-center">
                  <p className="text-sm font-semibold text-[#56505c]">{projectQuery.trim() ? "No projects found" : "Nothing here yet"}</p>
                  <p className="mt-1 text-sm text-[#8a8490]">
                    {projectQuery.trim() ? "Try a different search." : `Create your first project in ${team.name}.`}
                  </p>
                </div>
              )}
            </section>
          )}

          {view === "team" && (
            <section className="pt-8">
              <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className={`${bricolageExtraBold.className} text-[26px] tracking-[-0.04em] text-[#28222e]`}>Team Projects</h2>
                  <p className="mt-1 text-[14px] text-[#7b7480]">Shared with everyone in {team.name}.</p>
                </div>
                <label className="flex h-10 w-full min-w-0 items-center gap-2 rounded-xl border border-[#ececf1] bg-white px-3 text-sm transition focus-within:border-[#ff5e1a] sm:w-[240px]"><Search className="size-4 shrink-0 text-[#9a9bb0]" /><input value={projectQuery} onChange={(event) => setProjectQuery(event.target.value)} placeholder="Search projects" className="w-full bg-transparent text-[#1a1a2e] outline-none placeholder:text-[#9a9bb0]" /></label>
              </div>
              {visibleTeam.length > 0 ? (
                <ProjectGrid items={visibleTeam} render={(project) => <ProjectCard {...cardProps(project)} />} />
              ) : (
                <div className="rounded-2xl border border-dashed border-[#ddd7df] bg-white px-5 py-14 text-center">
                  <p className="text-sm font-semibold text-[#56505c]">No team projects yet.</p>
                  <p className="mt-1 text-sm text-[#8a8490]">Publish one from My Projects to share it with your team.</p>
                </div>
              )}
            </section>
          )}
        </div>
      </main>

      {publishTarget && (
        <div className="fixed inset-x-0 bottom-0 top-[52px] z-[90] grid place-items-center bg-[#1a1a2e]/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Publish to team">
          <div className="w-full max-w-[420px] rounded-[24px] border border-[#ececf1] bg-white p-6 shadow-[0_30px_80px_rgba(26,26,46,0.28)]">
            <h2 className="text-[17px] font-bold tracking-[-0.02em] text-[#28222e]">Publish &ldquo;{publishTarget.name}&rdquo; to the team?</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-[#7b7480]">
              Everyone in {team.name} will be able to view and download it. Only you can edit it.
            </p>
            <div className="mt-6 flex justify-end gap-2.5">
              <button type="button" onClick={() => setPublishTarget(null)} className="h-11 rounded-xl px-4 text-[13px] font-semibold text-[#8a8490] transition hover:text-[#56505c]">
                Cancel
              </button>
              <button type="button" onClick={() => publish(publishTarget)} className="h-11 rounded-xl bg-[#24202a] px-5 text-[13px] font-bold text-white transition hover:bg-[#3b3442]">
                Publish to team
              </button>
            </div>
          </div>
        </div>
      )}

      {blockOpen && quotaBlock && (
        <div className="fixed inset-x-0 bottom-0 top-[52px] z-[90] grid place-items-center bg-[#1a1a2e]/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={quotaBlock.title}>
          <div className="w-full max-w-[440px] rounded-[24px] border border-[#ececf1] bg-white p-6 shadow-[0_30px_80px_rgba(26,26,46,0.28)]">
            <span className="grid size-11 place-items-center rounded-full bg-[#fdeae5] text-[#c9432a]">
              <AlertTriangle className="size-5" />
            </span>
            <h2 className="mt-4 text-[17px] font-bold tracking-[-0.02em] text-[#28222e]">{quotaBlock.title}</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-[#7b7480]">{quotaBlock.body}</p>
            <div className="mt-6 flex justify-end gap-2.5">
              <button type="button" onClick={() => setBlockOpen(false)} className="h-11 rounded-xl px-4 text-[13px] font-semibold text-[#8a8490] transition hover:text-[#56505c]">
                Close
              </button>
              {(quotaBlock.kind === "member-hard" && (role === "owner" || role === "admin")) && (
                <button
                  type="button"
                  onClick={() => { setBlockOpen(false); openSettings("members"); }}
                  className="h-11 rounded-xl bg-[#24202a] px-5 text-[13px] font-bold text-white transition hover:bg-[#3b3442]"
                >
                  Adjust limits
                </button>
              )}
              {(quotaBlock.kind === "pool" && (role === "owner" || role === "finance")) && (
                <button
                  type="button"
                  onClick={() => { setBlockOpen(false); openSettings("billing"); }}
                  className="h-11 rounded-xl bg-[#24202a] px-5 text-[13px] font-bold text-white transition hover:bg-[#3b3442]"
                >
                  Buy credits
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <TeamOverlays />
    </div>
  );
}

export default function TeamWorkspaceCanvasPage() {
  return (
    <TeamProvider>
      <CanvasWorkspace />
    </TeamProvider>
  );
}
