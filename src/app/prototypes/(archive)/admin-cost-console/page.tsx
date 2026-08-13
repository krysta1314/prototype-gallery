"use client";

import { useMemo, useState } from "react";
import {
  Search, Users, Image as ImageIcon, Video, PenTool, Bot,
  ChevronLeft, ChevronDown, ChevronRight, TrendingUp,
} from "lucide-react";

/* ---------- Brand helpers (design.md) ---------- */
const APPLE_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif';
const gradText =
  "bg-gradient-to-r from-[#ffc078] to-[#ff5e1a] bg-clip-text text-transparent";
const ctaGrad = "bg-gradient-to-r from-[#FFA73C] to-[#FF5255]";
const money = (n: number) =>
  "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });

/* ---------- Types ---------- */
type TaskType = "image" | "video" | "canvas" | "agent";
type Plan = "Free" | "Starter" | "Pro" | "Ultra";
type Task = {
  id: string; type: TaskType; model: string; params: string;
  createdAt: string; date: string; cost: number; ref?: string;
};
type Project = { id: string; name: string; tasks: Task[] };
type User = {
  id: string; name: string; email: string; plan: Plan;
  lastActive: string; projects: Project[];
};

/* ---------- Mock data ---------- */
const USERS: User[] = [
  {
    id: "u1", name: "Sofia Almeida", email: "sofia@brightlabs.co",
    plan: "Ultra", lastActive: "Jul 5, 2026",
    projects: [
      {
        id: "u1p1", name: "Beverage Campaign",
        tasks: [
          { id: "t1", type: "video", model: "Seedance 2.5", params: "8s · 1080p", createdAt: "Jul 2, 2:41 PM", date: "2026-07-02", cost: 0.48 },
          { id: "t2", type: "video", model: "Seedance 2.5", params: "5s · 720p", createdAt: "Jul 2, 3:10 PM", date: "2026-07-02", cost: 0.31 },
          { id: "t3", type: "image", model: "Seedream", params: "×4", createdAt: "Jul 1, 11:02 AM", date: "2026-07-01", cost: 0.16 },
          { id: "t4", type: "agent", model: "Marketing Agent", params: "18 calls", createdAt: "Jul 1, 10:50 AM", date: "2026-07-01", cost: 0.014, ref: "AGT-9F3A21" },
          { id: "t5", type: "canvas", model: "Canvas", params: "3 edits", createdAt: "Jul 1, 10:40 AM", date: "2026-07-01", cost: 0.006, ref: "CNV-4821" },
        ],
      },
      {
        id: "u1p2", name: "Summer Skincare Launch",
        tasks: [
          { id: "t6", type: "image", model: "GPT-Image", params: "×8", createdAt: "Jun 28, 4:20 PM", date: "2026-06-28", cost: 0.32 },
          { id: "t7", type: "video", model: "Seedance 2.5", params: "10s · 1080p", createdAt: "Jun 28, 5:00 PM", date: "2026-06-28", cost: 0.58 },
          { id: "t8", type: "agent", model: "Marketing Agent", params: "9 calls", createdAt: "Jun 28, 3:55 PM", date: "2026-06-28", cost: 0.008, ref: "AGT-7B2C40" },
        ],
      },
      {
        id: "u1p3", name: "Autumn Denim Drop",
        tasks: [
          { id: "t9", type: "video", model: "Seedance 2.5", params: "12s · 1080p", createdAt: "Jun 20, 9:15 AM", date: "2026-06-20", cost: 0.6 },
          { id: "t10", type: "image", model: "Seedream", params: "×6", createdAt: "Jun 20, 8:40 AM", date: "2026-06-20", cost: 0.24 },
        ],
      },
    ],
  },
  {
    id: "u2", name: "Marcus Chen", email: "marcus@loopmedia.io",
    plan: "Pro", lastActive: "Jul 4, 2026",
    projects: [
      {
        id: "u2p1", name: "Beverage Campaign",
        tasks: [
          { id: "t11", type: "video", model: "Seedance 2.5", params: "6s · 1080p", createdAt: "Jul 3, 1:20 PM", date: "2026-07-03", cost: 0.39 },
          { id: "t12", type: "image", model: "Seedream", params: "×3", createdAt: "Jul 3, 1:05 PM", date: "2026-07-03", cost: 0.12 },
          { id: "t13", type: "agent", model: "Marketing Agent", params: "6 calls", createdAt: "Jul 3, 12:58 PM", date: "2026-07-03", cost: 0.006, ref: "AGT-3D8E15" },
        ],
      },
      {
        id: "u2p2", name: "Fitness App Onboarding",
        tasks: [
          { id: "t14", type: "canvas", model: "Canvas", params: "5 edits", createdAt: "Jun 25, 10:00 AM", date: "2026-06-25", cost: 0.008, ref: "CNV-3390" },
          { id: "t15", type: "image", model: "GPT-Image", params: "×5", createdAt: "Jun 25, 9:45 AM", date: "2026-06-25", cost: 0.2 },
        ],
      },
    ],
  },
  {
    id: "u3", name: "Priya Nair", email: "priya.nair@spark.studio",
    plan: "Starter", lastActive: "Jul 3, 2026",
    projects: [
      {
        id: "u3p1", name: "Holiday Gift Guide",
        tasks: [
          { id: "t16", type: "image", model: "Seedream", params: "×4", createdAt: "Jun 30, 2:10 PM", date: "2026-06-30", cost: 0.18 },
          { id: "t17", type: "video", model: "Seedance 2.5", params: "4s · 720p", createdAt: "Jun 30, 2:30 PM", date: "2026-06-30", cost: 0.24 },
        ],
      },
      {
        id: "u3p2", name: "Pet Food Rebrand",
        tasks: [
          { id: "t18", type: "agent", model: "Marketing Agent", params: "4 calls", createdAt: "Jun 22, 11:11 AM", date: "2026-06-22", cost: 0.005, ref: "AGT-6K1M88" },
        ],
      },
    ],
  },
  {
    id: "u4", name: "Diego Ferreira", email: "diego@nomadcreative.co",
    plan: "Pro", lastActive: "Jul 5, 2026",
    projects: [
      {
        id: "u4p1", name: "Beverage Campaign",
        tasks: [
          { id: "t19", type: "video", model: "Seedance 2.5", params: "8s · 1080p", createdAt: "Jul 4, 4:45 PM", date: "2026-07-04", cost: 0.52 },
          { id: "t20", type: "video", model: "Seedance 2.5", params: "6s · 1080p", createdAt: "Jul 4, 5:02 PM", date: "2026-07-04", cost: 0.4 },
          { id: "t21", type: "image", model: "GPT-Image", params: "×6", createdAt: "Jul 4, 4:20 PM", date: "2026-07-04", cost: 0.28 },
          { id: "t22", type: "agent", model: "Marketing Agent", params: "22 calls", createdAt: "Jul 4, 4:00 PM", date: "2026-07-04", cost: 0.018, ref: "AGT-5P7Q62" },
        ],
      },
      {
        id: "u4p2", name: "Travel Gear Teaser",
        tasks: [
          { id: "t23", type: "video", model: "Seedance 2.5", params: "10s · 1080p", createdAt: "Jun 27, 3:30 PM", date: "2026-06-27", cost: 0.55 },
          { id: "t24", type: "canvas", model: "Canvas", params: "2 edits", createdAt: "Jun 27, 3:10 PM", date: "2026-06-27", cost: 0.004, ref: "CNV-7654" },
        ],
      },
    ],
  },
  {
    id: "u5", name: "Hana Kobayashi", email: "hana.k@studiobloom.jp",
    plan: "Free", lastActive: "Jun 29, 2026",
    projects: [
      {
        id: "u5p1", name: "Personal Portfolio Refresh",
        tasks: [
          { id: "t25", type: "image", model: "Seedream", params: "×2", createdAt: "Jun 29, 1:15 PM", date: "2026-06-29", cost: 0.08 },
          { id: "t26", type: "canvas", model: "Canvas", params: "1 edit", createdAt: "Jun 29, 1:00 PM", date: "2026-06-29", cost: 0.002, ref: "CNV-1029" },
        ],
      },
    ],
  },
  {
    id: "u6", name: "Oliver Bennett", email: "oliver@northfieldads.com",
    plan: "Ultra", lastActive: "Jul 6, 2026",
    projects: [
      {
        id: "u6p1", name: "Beverage Campaign",
        tasks: [
          { id: "t27", type: "video", model: "Seedance 2.5", params: "12s · 1080p", createdAt: "Jul 5, 10:30 AM", date: "2026-07-05", cost: 0.6 },
          { id: "t28", type: "video", model: "Seedance 2.5", params: "10s · 1080p", createdAt: "Jul 5, 10:55 AM", date: "2026-07-05", cost: 0.55 },
          { id: "t29", type: "video", model: "Seedance 2.5", params: "8s · 1080p", createdAt: "Jul 5, 11:20 AM", date: "2026-07-05", cost: 0.48 },
          { id: "t30", type: "image", model: "GPT-Image", params: "×10", createdAt: "Jul 5, 9:50 AM", date: "2026-07-05", cost: 0.42 },
          { id: "t31", type: "agent", model: "Marketing Agent", params: "30 calls", createdAt: "Jul 5, 9:30 AM", date: "2026-07-05", cost: 0.02, ref: "AGT-2X4Y97" },
          { id: "t32", type: "canvas", model: "Canvas", params: "6 edits", createdAt: "Jul 5, 9:20 AM", date: "2026-07-05", cost: 0.01, ref: "CNV-5567" },
        ],
      },
      {
        id: "u6p2", name: "Auto Dealer National Push",
        tasks: [
          { id: "t33", type: "video", model: "Seedance 2.5", params: "15s · 1080p", createdAt: "Jun 24, 2:00 PM", date: "2026-06-24", cost: 0.6 },
          { id: "t34", type: "video", model: "Seedance 2.5", params: "12s · 1080p", createdAt: "Jun 24, 2:25 PM", date: "2026-06-24", cost: 0.56 },
          { id: "t35", type: "image", model: "Seedream", params: "×8", createdAt: "Jun 24, 1:40 PM", date: "2026-06-24", cost: 0.36 },
        ],
      },
      {
        id: "u6p3", name: "Fintech App Relaunch",
        tasks: [
          { id: "t36", type: "agent", model: "Marketing Agent", params: "40 calls", createdAt: "Jun 18, 9:00 AM", date: "2026-06-18", cost: 0.02, ref: "AGT-8H0N53" },
          { id: "t37", type: "image", model: "GPT-Image", params: "×5", createdAt: "Jun 18, 8:45 AM", date: "2026-06-18", cost: 0.22 },
        ],
      },
    ],
  },
  {
    id: "u7", name: "Isabelle Laurent", email: "isabelle@atelierpixel.fr",
    plan: "Starter", lastActive: "Jul 2, 2026",
    projects: [
      {
        id: "u7p1", name: "Perfume Teaser Series",
        tasks: [
          { id: "t38", type: "video", model: "Seedance 2.5", params: "6s · 1080p", createdAt: "Jul 1, 6:15 PM", date: "2026-07-01", cost: 0.35 },
          { id: "t39", type: "image", model: "Seedream", params: "×4", createdAt: "Jul 1, 5:50 PM", date: "2026-07-01", cost: 0.16 },
        ],
      },
      {
        id: "u7p2", name: "Bookstore Loyalty Program",
        tasks: [
          { id: "t40", type: "agent", model: "Marketing Agent", params: "5 calls", createdAt: "Jun 21, 10:10 AM", date: "2026-06-21", cost: 0.006, ref: "AGT-4T6U74" },
          { id: "t41", type: "canvas", model: "Canvas", params: "2 edits", createdAt: "Jun 21, 9:55 AM", date: "2026-06-21", cost: 0.003, ref: "CNV-8813" },
        ],
      },
    ],
  },
  {
    id: "u8", name: "Tariq Ahmadi", email: "tariq@dunesocial.ae",
    plan: "Pro", lastActive: "Jul 6, 2026",
    projects: [
      {
        id: "u8p1", name: "Beverage Campaign",
        tasks: [
          { id: "t42", type: "image", model: "Seedream", params: "×5", createdAt: "Jul 6, 8:10 AM", date: "2026-07-06", cost: 0.2 },
          { id: "t43", type: "video", model: "Seedance 2.5", params: "5s · 720p", createdAt: "Jul 6, 8:30 AM", date: "2026-07-06", cost: 0.28 },
        ],
      },
      {
        id: "u8p2", name: "Ramadan Retail Push",
        tasks: [
          { id: "t44", type: "video", model: "Seedance 2.5", params: "8s · 1080p", createdAt: "Jun 26, 7:40 PM", date: "2026-06-26", cost: 0.46 },
          { id: "t45", type: "agent", model: "Marketing Agent", params: "14 calls", createdAt: "Jun 26, 7:20 PM", date: "2026-06-26", cost: 0.012, ref: "AGT-1W9V36" },
        ],
      },
    ],
  },
  {
    id: "u9", name: "Wei Zhang", email: "wei.zhang@brightlabs.co",
    plan: "Free", lastActive: "Jun 15, 2026",
    projects: [
      {
        id: "u9p1", name: "Student Club Poster Set",
        tasks: [
          { id: "t46", type: "image", model: "Seedream", params: "×1", createdAt: "Jun 15, 3:00 PM", date: "2026-06-15", cost: 0.03 },
          { id: "t47", type: "canvas", model: "Canvas", params: "1 edit", createdAt: "Jun 15, 2:50 PM", date: "2026-06-15", cost: 0.001, ref: "CNV-2246" },
        ],
      },
    ],
  },
];

/* ---------- Aggregation helpers ---------- */
function taskInRange(t: Task, from: string | null, to: string | null) {
  if (from && t.date < from) return false;
  if (to && t.date > to) return false;
  return true;
}
function taskMatch(t: Task, types: Set<TaskType> | null, from: string | null, to: string | null) {
  if (types && !types.has(t.type)) return false;
  return taskInRange(t, from, to);
}
function userTasks(u: User, types: Set<TaskType> | null, from: string | null, to: string | null) {
  return u.projects.flatMap((p) => p.tasks).filter((t) => taskMatch(t, types, from, to));
}
function userCost(u: User, types: Set<TaskType> | null, from: string | null, to: string | null) {
  return userTasks(u, types, from, to).reduce((s, t) => s + t.cost, 0);
}
function userTaskCount(u: User, types: Set<TaskType> | null, from: string | null, to: string | null) {
  return userTasks(u, types, from, to).length;
}

/* ---------- Small UI helpers ---------- */
function planBadge(plan: Plan) {
  switch (plan) {
    case "Free":
      return "bg-[#f1f1f4] text-[#6a6b7b]";
    case "Starter":
      return "bg-[#eef1fb] text-[#4b5b8c]";
    case "Pro":
      return "bg-[#fff3ec] text-[#ff5e1a]";
    case "Ultra":
      return `${ctaGrad} text-white`;
  }
}

function typeIcon(type: TaskType) {
  switch (type) {
    case "image":
      return ImageIcon;
    case "video":
      return Video;
    case "canvas":
      return PenTool;
    case "agent":
      return Bot;
  }
}
function typeLabel(type: TaskType) {
  switch (type) {
    case "image":
      return "Image";
    case "video":
      return "Video";
    case "canvas":
      return "Canvas";
    case "agent":
      return "Agent";
  }
}
const TYPE_COLOR: Record<TaskType, string> = {
  video: "#ff5e1a",
  image: "#ffa73c",
  agent: "#1f2030",
  canvas: "#d4d3df",
};

const TYPE_CHIPS: { label: string; value: TaskType | null }[] = [
  { label: "All", value: null },
  { label: "Image", value: "image" },
  { label: "Video", value: "video" },
  { label: "Canvas", value: "canvas" },
  { label: "Agent", value: "agent" },
];

const inputCls =
  "w-full rounded-xl border border-[#ececf1] bg-white py-2.5 pl-9 pr-3 text-sm text-[#1a1a2e] outline-none placeholder:text-[#a9aab6] focus-visible:border-[#ff5e1a] focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/20";

export default function AdminCostConsolePage() {
  /* ---------- List view state ---------- */
  const [query, setQuery] = useState("");
  const [emailQuery, setEmailQuery] = useState("");
  const [canvasId, setCanvasId] = useState("");
  const [agentId, setAgentId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [typeFilter, setTypeFilter] = useState<Set<TaskType> | null>(null);

  /* ---------- Detail view state ---------- */
  const [openUserId, setOpenUserId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const openUser = USERS.find((u) => u.id === openUserId) ?? null;

  const fromV = from || null;
  const toV = to || null;

  const onOpenUser = (id: string) => {
    setOpenUserId(id);
    setExpanded(new Set());
  };

  const toggleExpanded = (projectId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  };

  const rows = useMemo(() => {
    const cq = canvasId.trim().toLowerCase();
    const aq = agentId.trim().toLowerCase();
    return USERS.filter((u) => {
      const nameOk = u.name.toLowerCase().includes(query.trim().toLowerCase());
      const emailOk = u.email.toLowerCase().includes(emailQuery.trim().toLowerCase());
      const tasks = u.projects.flatMap((p) => p.tasks);
      const canvasOk =
        !cq || tasks.some((t) => t.type === "canvas" && t.ref?.toLowerCase().includes(cq));
      const agentOk =
        !aq || tasks.some((t) => t.type === "agent" && t.ref?.toLowerCase().includes(aq));
      return nameOk && emailOk && canvasOk && agentOk;
    })
      .map((u) => ({
        user: u,
        cost: userCost(u, typeFilter, fromV, toV),
        count: userTaskCount(u, typeFilter, fromV, toV),
      }))
      .sort((a, b) => b.cost - a.cost);
  }, [query, emailQuery, canvasId, agentId, from, to, typeFilter]);

  const totalCost = rows.reduce((s, r) => s + r.cost, 0);
  const totalTasks = rows.reduce((s, r) => s + r.count, 0);
  const top3 = rows.slice(0, 3).filter((r) => r.cost > 0);

  /* ---------- Detail view derived data ---------- */
  const dist = openUser
    ? (["video", "image", "agent", "canvas"] as TaskType[]).map((ty) => ({
        type: ty,
        cost: userTasks(openUser, new Set([ty]), fromV, toV).reduce((s, t) => s + t.cost, 0),
      }))
    : [];
  const distTotal = dist.reduce((s, d) => s + d.cost, 0) || 1;
  const openUserCost = openUser ? userCost(openUser, typeFilter, fromV, toV) : 0;

  if (openUser) {
    const projectsWithTasks = openUser.projects
      .map((p) => ({
        project: p,
        ptasks: p.tasks.filter((t) => taskMatch(t, typeFilter, fromV, toV)),
      }))
      .filter((pt) => pt.ptasks.length > 0);

    return (
      <div
        key="detail"
        className="min-h-screen animate-in fade-in bg-[#faf8f6] px-6 py-10 duration-300"
        style={{ fontFamily: APPLE_FONT }}
      >
        <div className="mx-auto max-w-[1100px]">
          <button
            type="button"
            onClick={() => setOpenUserId(null)}
            className="flex items-center gap-1.5 text-sm font-semibold text-[#6a6b7b] transition hover:text-[#ff5e1a]"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to accounts
          </button>

          {/* ---------- Header ---------- */}
          <div className="mt-4 rounded-2xl border border-[#ececf1] bg-white p-6 shadow-[0_4px_16px_rgba(26,26,46,0.06)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl font-extrabold tracking-tight text-[#1a1a2e]">
                    {openUser.name}
                  </h1>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${planBadge(
                      openUser.plan
                    )}`}
                  >
                    {openUser.plan}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[#6a6b7b]">{openUser.email}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#a9aab6]">
                  Cost (filtered period)
                </p>
                <p
                  className={`mt-1 font-extrabold tabular-nums ${gradText}`}
                  style={{ fontSize: "clamp(40px, 8vw, 56px)", lineHeight: 1.1 }}
                >
                  {money(openUserCost)}
                </p>
              </div>
            </div>

            {/* ---------- Type cost distribution bar ---------- */}
            <div className="mt-6">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#a9aab6]">
                Cost by type (all types, full period shown)
              </p>
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-[#f1f1f4]">
                {dist.map((d) =>
                  d.cost > 0 ? (
                    <div
                      key={d.type}
                      style={{
                        width: `${(d.cost / distTotal) * 100}%`,
                        backgroundColor: TYPE_COLOR[d.type],
                      }}
                    />
                  ) : null
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
                {dist.map((d) => (
                  <div key={d.type} className="flex items-center gap-1.5 text-sm">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: TYPE_COLOR[d.type] }}
                    />
                    <span className="text-[#6a6b7b]">{typeLabel(d.type)}</span>
                    <span className="font-semibold tabular-nums text-[#1a1a2e]">
                      {money(d.cost)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ---------- Project cards ---------- */}
          <div className="mt-4 space-y-3">
            {projectsWithTasks.length === 0 && (
              <div className="rounded-2xl border border-[#ececf1] bg-white p-10 text-center text-[#6a6b7b] shadow-[0_4px_16px_rgba(26,26,46,0.06)]">
                No tasks match the current filters for this account.
              </div>
            )}

            {projectsWithTasks.map(({ project, ptasks }) => {
              const pCost = ptasks.reduce((s, t) => s + t.cost, 0);
              const pDist = (["video", "image", "agent", "canvas"] as TaskType[])
                .map((ty) => ({
                  type: ty,
                  cost: ptasks.filter((t) => t.type === ty).reduce((s, t) => s + t.cost, 0),
                }))
                .filter((d) => d.cost > 0);
              const isOpen = expanded.has(project.id);

              return (
                <div
                  key={project.id}
                  className="rounded-2xl border border-[#ececf1] bg-white shadow-[0_4px_16px_rgba(26,26,46,0.06)]"
                >
                  <button
                    type="button"
                    onClick={() => toggleExpanded(project.id)}
                    className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-left"
                  >
                    <div className="flex items-center gap-3">
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 shrink-0 text-[#a9aab6]" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-[#a9aab6]" />
                      )}
                      <div>
                        <p className="font-bold text-[#1a1a2e]">{project.name}</p>
                        <p className="text-[13px] text-[#6a6b7b]">
                          {pDist.map((d) => `${typeLabel(d.type)} ${money(d.cost)}`).join(" · ")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm tabular-nums text-[#6a6b7b]">
                        {ptasks.length} tasks
                      </span>
                      <span className="font-bold tabular-nums text-[#1a1a2e]">
                        {money(pCost)}
                      </span>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-[#ececf1] px-5 py-2">
                      {ptasks.map((t) => {
                        const Icon = typeIcon(t.type);
                        return (
                          <div
                            key={t.id}
                            className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f1f1f4] py-3 last:border-0"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <span
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                                style={{
                                  backgroundColor: `${TYPE_COLOR[t.type]}1a`,
                                  color: TYPE_COLOR[t.type],
                                }}
                              >
                                <Icon className="h-4 w-4" />
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-[#1a1a2e]">
                                  {typeLabel(t.type)} · {t.model}
                                </p>
                                <p className="truncate text-[13px] text-[#6a6b7b]">
                                  {t.ref && (
                                    <span className="mr-1.5 font-mono text-[12px] text-[#6a6b7b]">
                                      {t.ref}
                                    </span>
                                  )}
                                  {t.params} · {t.createdAt}
                                </p>
                              </div>
                            </div>
                            <span className="font-semibold tabular-nums text-[#1a1a2e]">
                              {money(t.cost)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p className="mt-6 text-[13px] text-[#6a6b7b]">
            内部成本后台原型 · 数据为演示 mock，金额为示意真实模型成本($)。可按用户名/邮箱/日期/Canvas project
            ID/Agent session ID 搜索，点行进详情、展开项目卡看每个 task 单价。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      key="list"
      className="min-h-screen animate-in fade-in bg-[#faf8f6] px-6 py-10 duration-300"
      style={{ fontFamily: APPLE_FONT }}
    >
      <div className="mx-auto max-w-[1100px]">
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#ff5e1a]">Admin · Internal</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#1a1a2e]">
          Cost Console
        </h1>
        <p className="mt-3 text-[#6a6b7b]">{USERS.length} accounts loaded.</p>

        {/* ---------- Search bar ---------- */}
        <div className="mt-6 rounded-2xl border border-[#ececf1] bg-white p-5 shadow-[0_4px_16px_rgba(26,26,46,0.06)]">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#a9aab6]">
                Name
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a9aab6]" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name"
                  className={inputCls}
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#a9aab6]">
                Email
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a9aab6]" />
                <input
                  type="text"
                  value={emailQuery}
                  onChange={(e) => setEmailQuery(e.target.value)}
                  placeholder="Search by email"
                  className={inputCls}
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#a9aab6]">
                Canvas project ID
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a9aab6]" />
                <input
                  type="text"
                  value={canvasId}
                  onChange={(e) => setCanvasId(e.target.value)}
                  placeholder="e.g. CNV-4821"
                  className={inputCls}
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#a9aab6]">
                Agent session ID
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a9aab6]" />
                <input
                  type="text"
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  placeholder="e.g. AGT-9F3A21"
                  className={inputCls}
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#a9aab6]">
                From
              </label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full rounded-xl border border-[#ececf1] bg-white px-3 py-2 text-sm text-[#1a1a2e] outline-none focus-visible:border-[#ff5e1a] focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#a9aab6]">
                To
              </label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full rounded-xl border border-[#ececf1] bg-white px-3 py-2 text-sm text-[#1a1a2e] outline-none focus-visible:border-[#ff5e1a] focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/20"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {TYPE_CHIPS.map((chip) => {
              const active =
                chip.value === null ? typeFilter === null : !!typeFilter?.has(chip.value);
              return (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() =>
                    setTypeFilter(chip.value === null ? null : new Set([chip.value]))
                  }
                  className={`rounded-xl px-3.5 py-1.5 text-sm font-semibold transition ${
                    active
                      ? `${ctaGrad} text-white shadow-[0_4px_12px_rgba(255,82,85,0.25)]`
                      : "border border-[#ececf1] bg-white text-[#6a6b7b] hover:border-[#d4d3df]"
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ---------- Summary bar ---------- */}
        <div className="mt-4 rounded-2xl border border-[#ececf1] bg-white p-5 shadow-[0_4px_16px_rgba(26,26,46,0.06)]">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#a9aab6]">
                Total cost
              </p>
              <p className={`mt-1 text-3xl font-extrabold tabular-nums ${gradText}`}>
                {money(totalCost)}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#6a6b7b]">
              <Users className="h-4 w-4" />
              <span className="tabular-nums font-semibold text-[#1a1a2e]">{rows.length}</span>
              users
              <span className="mx-1 text-[#d4d3df]">·</span>
              <span className="tabular-nums font-semibold text-[#1a1a2e]">{totalTasks}</span>
              tasks
            </div>

            {top3.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[#a9aab6]">
                  Top spenders
                </span>
                {top3.map((r) => (
                  <span
                    key={r.user.id}
                    className="flex items-center gap-1.5 rounded-xl border border-[#ececf1] bg-[#fff7f1] px-3 py-1.5 text-sm"
                  >
                    <TrendingUp className="h-3.5 w-3.5 text-[#ff5e1a]" />
                    <span className="font-semibold text-[#1a1a2e]">{r.user.name}</span>
                    <span className="tabular-nums text-[#6a6b7b]">{money(r.cost)}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ---------- User table ---------- */}
        <div className="mt-4 overflow-x-auto rounded-2xl border border-[#ececf1] bg-white shadow-[0_4px_16px_rgba(26,26,46,0.06)]">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#ececf1] text-left text-[11px] font-semibold uppercase tracking-wide text-[#a9aab6]">
                <th className="px-5 py-3">Account</th>
                <th className="px-5 py-3">Plan</th>
                <th className="px-5 py-3 text-right">Cost</th>
                <th className="px-5 py-3 text-right">Tasks</th>
                <th className="hidden px-5 py-3 sm:table-cell">Last active</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ user, cost, count }) => (
                <tr
                  key={user.id}
                  onClick={() => onOpenUser(user.id)}
                  className="cursor-pointer border-b border-[#ececf1] transition last:border-0 hover:bg-[#fff7f1]"
                >
                  <td className="px-5 py-3">
                    <p className="font-bold text-[#1a1a2e]">{user.name}</p>
                    <p className="text-[13px] text-[#6a6b7b]">{user.email}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${planBadge(
                        user.plan
                      )}`}
                    >
                      {user.plan}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-bold tabular-nums text-[#1a1a2e]">
                    {money(cost)}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-[#6a6b7b]">{count}</td>
                  <td className="hidden px-5 py-3 text-[#6a6b7b] sm:table-cell">
                    {user.lastActive}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-[#6a6b7b]">
                    No accounts match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-6 text-[13px] text-[#6a6b7b]">
          内部成本后台原型 · 数据为演示 mock，金额为示意真实模型成本($)。可按用户名/邮箱/日期/Canvas project
          ID/Agent session ID 搜索，点行进详情、展开项目卡看每个 task 单价。
        </p>
      </div>
    </div>
  );
}
