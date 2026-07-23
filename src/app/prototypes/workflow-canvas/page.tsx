"use client";

import Image from "next/image";
import Link from "next/link";
import localFont from "next/font/local";
import { useEffect, useState } from "react";
import {
  Copy,
  MoreHorizontal,
  Pencil,
  Pin,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

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
  src: "../../fonts/BricolageGrotesque-ExtraBold.ttf",
  weight: "800",
  display: "swap",
});
const projectAssets = [
  "/prototypes/asset-library/images/img-01.jpg",
  "/prototypes/asset-library/images/img-02.jpg",
  "/prototypes/asset-library/images/img-03.jpg",
] as const;

const projects = [
  { name: "Summer launch", updatedAt: "2026-07-22 20:34", scenes: [projectAssets[0], projectAssets[1], projectAssets[2]] },
  { name: "UGC refresh", updatedAt: "2026-07-22 18:12", scenes: [projectAssets[1], projectAssets[2], projectAssets[0]] },
  { name: "Skincare drop", updatedAt: "2026-07-21 14:46", scenes: [projectAssets[2], projectAssets[0], projectAssets[1]] },
  { name: "Back to school", updatedAt: "2026-07-16 09:20", scenes: [] },
] as const;

type WorkflowTemplate = {
  title: string;
  image?: string;
};

const workflowTemplates: WorkflowTemplate[] = [
  { title: "Word-of-mouth recommendation", image: projectAssets[0] },
  { title: "Product unboxing", image: projectAssets[1] },
  { title: "Product review", image: projectAssets[2] },
  { title: "Product comparison review", image: projectAssets[0] },
  { title: "Funny short drama", image: projectAssets[1] },
  { title: "Camera choreography", image: projectAssets[2] },
  { title: "Photoreal CGI product ad", image: projectAssets[0] },
  { title: "Mini episodes of Otome", image: projectAssets[1] },
  { title: "Tech product ads", image: projectAssets[2] },
  { title: "Creator launch story", image: projectAssets[0] },
] as const;

type View = "canvas" | "projects";

function ProjectCard({
  project,
  menuOpen = false,
  onMenuChange,
}: {
  project: (typeof projects)[number];
  menuOpen?: boolean;
  onMenuChange?: (open: boolean) => void;
}) {
  const emptyProjectMaskId = `project-mask-${project.name.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <article className="group relative z-0 flex aspect-video min-w-0 flex-col overflow-visible rounded-[24px] border border-[#ececf1] bg-white p-1.5 shadow-[0_10px_26px_rgba(26,26,46,0.04)] transition hover:z-20 hover:-translate-y-0.5 hover:border-[#ff8c6c] hover:ring-2 hover:ring-[#ff8c6c]/15 hover:shadow-[0_14px_32px_rgba(26,26,46,0.08)] focus-within:z-20 min-[640px]:aspect-auto">
      {project.scenes.length > 0 ? (
        <div className="grid min-h-0 flex-1 grid-cols-[1.8fr_0.72fr] gap-1.5 min-[640px]:aspect-video min-[640px]:flex-none">
          <div className="relative min-h-0 overflow-hidden rounded-[15px] bg-[#f0edf0]">
            <Image
              src={project.scenes[0]}
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
          <p className="mt-1 truncate text-[12px] font-medium tabular-nums text-[#89828d]">{project.updatedAt}</p>
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
              <button type="button" onClick={() => onMenuChange?.(false)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-semibold text-[#1a1a2e] transition hover:bg-[#f5f3f4]"><Pin className="size-4" /> Pin to top</button>
              <button type="button" onClick={() => onMenuChange?.(false)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-semibold text-[#1a1a2e] transition hover:bg-[#fff7f1]"><Pencil className="size-4" /> Rename</button>
              <button type="button" onClick={() => onMenuChange?.(false)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-semibold text-[#1a1a2e] transition hover:bg-[#fff7f1]"><Copy className="size-4" /> Copy</button>
              <button type="button" onClick={() => onMenuChange?.(false)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-semibold text-[#ef5139] transition hover:bg-[#fff7f1]"><Trash2 className="size-4" /> Delete</button>
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
      <div className="pointer-events-none absolute -top-3 right-[5%] z-[4] rotate-[7deg] sm:-top-4 sm:right-[7%]">
        <span className="relative block rounded-[10px] bg-[#ff5255] px-3.5 py-2 text-[11px] font-bold tracking-[-0.01em] text-white shadow-[0_8px_18px_rgba(255,82,85,0.3)] sm:px-4 sm:text-[13px]">
          New feature launched
          <span
            aria-hidden="true"
            className="absolute -bottom-[7px] left-[46%] size-0 border-x-[8px] border-t-[9px] border-x-transparent border-t-[#ff5255]"
          />
        </span>
      </div>
    </div>
  );
}

export default function WorkflowCanvasPage() {
  const [view, setView] = useState<View>("canvas");
  const [projectQuery, setProjectQuery] = useState("");
  const [openProjectMenu, setOpenProjectMenu] = useState<string | null>(null);
  const recentProjects = projects.slice(0, 4);
  const visibleProjects = projects.filter(({ name }) =>
    name.toLowerCase().includes(projectQuery.trim().toLowerCase()),
  );

  useEffect(() => {
    if (!openProjectMenu) return;
    const closeProjectMenu = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest("[data-project-menu]")) setOpenProjectMenu(null);
    };
    document.addEventListener("mousedown", closeProjectMenu);
    return () => document.removeEventListener("mousedown", closeProjectMenu);
  }, [openProjectMenu]);

  return (
    <div className="min-h-screen bg-[#fcfbfd] text-[#24202a]" style={{ fontFamily: APPLE_FONT }}>
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[216px] flex-col border-r border-[#ebe8ee] bg-white px-4 py-5 lg:flex">
        <Link href="/" className={`${bricolageExtraBold.className} flex items-center gap-2.5 px-2 text-[18px] tracking-[-0.04em] text-[#211b29]`}>
          <Image src={ICONS.logo} alt="Buzz" width={32} height={32} className="size-8" />
          Buzz
        </Link>
        <nav className="mt-12 grid gap-1" aria-label="Primary navigation">
          <Link href="/prototypes/homepage" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-semibold text-[#706a78] transition hover:bg-[#fff3ee] hover:text-[#ef6646]">
            <Image src={ICONS.home} alt="" width={18} height={18} className="size-[18px]" />
            Home
          </Link>
          <Link href="/prototypes/marketing-agent-v14" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-semibold text-[#706a78] transition hover:bg-[#fff3ee] hover:text-[#ef6646]">
            <Image src={ICONS.agent} alt="" width={18} height={18} className="size-[18px]" />
            Marketing Agent
          </Link>
          <span className="flex items-center gap-3 rounded-xl bg-[#fff0ea] px-3 py-2.5 text-[14px] font-bold text-[#ee6545]">
            <Image src={ICONS.canvas} alt="" width={18} height={18} className="size-[18px]" />
            Canvas
          </span>
        </nav>
        <div className="mt-auto rounded-2xl border border-[#f0e4de] bg-[#fff8f4] p-3.5">
          <p className="text-[12px] font-bold text-[#342d38]">Your creative workspace</p>
          <p className="mt-1 text-[11px] leading-relaxed text-[#817985]">Connect ideas, assets, and generated content in one flow.</p>
        </div>
      </aside>

      <main className="min-h-screen lg:ml-[216px]">
        <div className="mx-auto max-w-[1600px] px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
          <div className="border-b border-[#e8e5eb]">
            <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 lg:hidden"><Image src={ICONS.logo} alt="Buzz" width={28} height={28} className="size-7" /><span className={`${bricolageExtraBold.className} text-[16px]`}>Buzz</span></div>
              <h1 className={`${bricolageExtraBold.className} mt-5 text-[clamp(30px,3vw,42px)] tracking-[-0.05em] text-[#211b29] lg:mt-0`}>Canvas</h1>
            </div>
            <button className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#24202a] px-4 py-2.5 text-[13px] font-bold text-white shadow-sm transition hover:bg-[#3b3442]">
              <Plus className="size-4" />
              Create project
            </button>
            </div>
            <div className="mt-5 flex gap-6" role="tablist" aria-label="Canvas view">
                {(["canvas", "projects"] as const).map((tab) => {
                  const active = tab === view;
                  return (
                    <button
                      key={tab}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setView(tab)}
                      className={`relative pb-4 text-[15px] font-bold transition ${active ? "text-[#25202a]" : "text-[#8a8490] hover:text-[#56505c]"}`}
                    >
                      {tab === "canvas" ? "Canvas" : "My projects"}
                      {active && <span className="absolute inset-x-0 -bottom-px h-[3px] rounded-t-full bg-[#ff7955]" />}
                    </button>
                  );
                })}
            </div>
          </div>

          {view === "canvas" ? (
            <div className="space-y-12 pt-7 sm:space-y-16 sm:pt-8">
              <CanvasHero />

              <section>
                <div className="mb-5 flex items-center justify-between gap-4">
                  <h2 className={`${bricolageExtraBold.className} text-[24px] tracking-[-0.035em] text-[#28222e]`}>Recent projects</h2>
                  <button type="button" onClick={() => setView("projects")} className="shrink-0 text-[13px] font-bold text-[#625b68] transition hover:text-[#ef6646]">View all</button>
                </div>
                <div className="grid grid-cols-1 gap-4 min-[640px]:grid-cols-2 min-[900px]:grid-cols-3 min-[1280px]:grid-cols-4 min-[1440px]:grid-cols-5">
                  <button type="button" className="group flex aspect-video flex-col overflow-hidden rounded-[24px] border border-dashed border-[#d8d0d6] bg-white p-1.5 text-[#6b6470] transition hover:border-[#ff9579] hover:bg-[#fff8f4] hover:text-[#ef6646] min-[640px]:aspect-auto">
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
                        <ProjectCard project={project} menuOpen={openProjectMenu === project.name} onMenuChange={(open) => setOpenProjectMenu(open ? project.name : null)} />
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="pb-10">
                <div className="mb-5">
                  <h2 className={`${bricolageExtraBold.className} text-[24px] tracking-[-0.035em] text-[#28222e]`}>Workflows</h2>
                </div>
                <div className="grid gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  {workflowTemplates.map((workflow) => (
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
          ) : (
            <section className="pt-8">
              <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><h2 className={`${bricolageExtraBold.className} text-[26px] tracking-[-0.04em] text-[#28222e]`}>My projects</h2><p className="mt-1 text-[14px] text-[#7b7480]">All of your Canvas work, in one place.</p></div><label className="flex h-10 w-full min-w-0 items-center gap-2 rounded-xl border border-[#ececf1] bg-white px-3 text-sm transition focus-within:border-[#ff5e1a] sm:w-[240px]"><Search className="size-4 shrink-0 text-[#9a9bb0]" /><input value={projectQuery} onChange={(event) => setProjectQuery(event.target.value)} placeholder="Search projects" className="w-full bg-transparent text-[#1a1a2e] outline-none placeholder:text-[#9a9bb0]" /></label></div>
              {visibleProjects.length > 0 ? <div className="grid grid-cols-1 gap-x-4 gap-y-8 min-[640px]:grid-cols-2 min-[820px]:grid-cols-3 min-[960px]:grid-cols-4 min-[1440px]:grid-cols-5">{visibleProjects.map((project) => <ProjectCard key={project.name} project={project} menuOpen={openProjectMenu === project.name} onMenuChange={(open) => setOpenProjectMenu(open ? project.name : null)} />)}</div> : <div className="rounded-2xl border border-dashed border-[#ddd7df] bg-white px-5 py-14 text-center text-sm text-[#8a8490]">No projects found</div>}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
