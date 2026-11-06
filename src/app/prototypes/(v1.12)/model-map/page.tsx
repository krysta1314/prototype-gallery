"use client";

// v1.12 模型思维导图:所有模型 → 支持的模式 → 模式参数 / 限制，标出 v1.12 新上的模型和模式。
// 视频数据由 SKILL.md 生成(video-data.ts);图片 / 音频来自 Notion 上新清单(other-data.ts)。

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AudioLines,
  ChevronRight,
  Clapperboard,
  ExternalLink,
  ImageIcon,
  Info,
  Maximize2,
  Mic,
  MonitorPlay,
  Minus,
  Plus,
  Music,
  Search,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import type { MapGroup, MapModel } from "./types";
import { VIDEO_MODELS } from "./video-data";
import { docParts } from "./docs";
import { MODE_LABEL, MODELS as VG_MODELS } from "../video-gen-modes/app/capabilities";
import { CLONE_MODELS, IMAGE_MODELS, SOUND_MODELS, TTS_MODELS } from "./other-data";

const APPLE_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif';

const GROUPS: MapGroup[] = [
  { key: "video", label: "Video", zh: "视频生成", color: "#ff5e1a", tint: "#fff3ec", models: VIDEO_MODELS },
  { key: "image", label: "Image", zh: "图片生成", color: "#2f6bff", tint: "#eef3ff", models: IMAGE_MODELS },
  { key: "tts", label: "Voiceover", zh: "配音 TTS", color: "#0f9488", tint: "#e6f7f4", models: TTS_MODELS },
  { key: "clone", label: "Voice Clone", zh: "音色克隆", color: "#d9467a", tint: "#fdebf2", models: CLONE_MODELS },
  { key: "sound", label: "SFX & Music", zh: "音效 · 音乐", color: "#6d4bff", tint: "#efeaff", models: SOUND_MODELS },
];

const GROUP_ICON: Record<string, typeof Clapperboard> = {
  video: Clapperboard,
  image: ImageIcon,
  tts: Mic,
  clone: AudioLines,
  sound: Music,
};

/* ---------- ids ---------- */
const gid = (g: MapGroup) => `g:${g.key}`;
const mid = (g: MapGroup, m: MapModel) => `m:${g.key}:${m.name}`;
const did = (g: MapGroup, m: MapModel, mode: string) => `d:${g.key}:${m.name}:${mode}`;
const LIMITS = "Limits";
const SETTINGS = "Settings";

/** 「看 UI」打开哪里：生成类模式 → Video Gen(带 ?model=&mode=);加工类(2026-11-05 拆成工具页)→ ai-tools 对应工具页 */
type UiTarget = { src: string; where: string };
const MODE_KEY_BY_LABEL = Object.entries(MODE_LABEL).map(([k, label]) => [k, label] as const);
const TOOL_PAGE_OF: [string, string, string][] = [
  ["Motion Control", "motion-control", "Motion Control"],
  ["Lip Sync", "lip-sync", "Lip Sync"],
  ["Talking Avatar", "talking-avatar", "Talking Avatar"],
  ["Recast", "character-swap", "Video Character Swap"],
  ["3D to Video", "render-3d", "3D to Video"],
];
function uiTargetOf(modelKey: string | undefined, name: string): UiTarget | undefined {
  if (name.startsWith("(")) return undefined;
  const tool = TOOL_PAGE_OF.find(([label]) => name.startsWith(label));
  /* 两个模型共用的工具页(Talking Avatar):带上 ?model= 预选当前模型 */
  if (tool) return { src: `/prototypes/ai-tools/${tool[1]}${tool[1] === "talking-avatar" && modelKey === "h3-max" ? "?model=h3-max" : ""}`, where: `工具页 · ${tool[2]}` };
  const caps = modelKey ? VG_MODELS.find((m) => m.key === modelKey) : undefined;
  if (!caps) return undefined;
  const base = `/prototypes/video-gen-modes/home?model=${encodeURIComponent(caps.key)}`;
  if (name.startsWith("Text-to-Video")) return { src: base, where: "Video Gen" };
  const hit = MODE_KEY_BY_LABEL.find(([, label]) => name.startsWith(label));
  return hit && caps.modes.includes(hit[0] as never) ? { src: `${base}&mode=${hit[0]}`, where: "Video Gen" } : undefined;
}

function allIds(level: "groups" | "models" | "all") {
  const ids = new Set<string>(["root"]);
  for (const g of GROUPS) {
    ids.add(gid(g));
    if (level === "groups") continue;
    for (const m of g.models) {
      ids.add(mid(g, m));
      if (level === "models") continue;
      for (const d of m.modes) ids.add(did(g, m, d.name));
      if (m.limits.length) ids.add(did(g, m, LIMITS));
      if (m.settings?.length) ids.add(did(g, m, SETTINGS));
    }
  }
  return ids;
}

/* ---------- search ---------- */
function hits(text: string, q: string) {
  return q !== "" && text.toLowerCase().includes(q);
}

function Hl({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>;
  const i = text.toLowerCase().indexOf(q);
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded-[3px] bg-[#ffe1cc] px-0.5 text-inherit">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

/* ---------- tree layout ---------- */
/** 组织架构图：父节点在上居中，子节点在下一行横向排开(根 → 类型 → 模型) */
function OrgBranch({ node, kids, line }: { node: ReactNode; kids?: ReactNode[]; line: string }) {
  return (
    <div className="flex flex-col items-center" style={{ ["--line" as string]: line }}>
      {node}
      {kids && kids.length > 0 && (
        <>
          <span className="oc-stub" />
          <div className="oc-children">
            {kids.map((k, i) => (
              <div key={i} className="oc-child">
                {k}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * 模型以下(模式 → 参数)在该模型这一列里往下排：子节点缩进，左侧竖线 + 短横线连接。
 * tick = 子节点顶部到连接线的距离，对准子节点第一行。
 */
function Branch({ node, kids, line, tick = 16 }: { node: ReactNode; kids?: ReactNode[]; line: string; tick?: number }) {
  return (
    <div style={{ ["--line" as string]: line }}>
      {node}
      {kids && kids.length > 0 && (
        <div className="vt-children" style={{ ["--tick" as string]: `${tick}px` }}>
          {kids.map((k, i) => (
            <div key={i} className="vt-child">
              {k}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NewBadge({ small }: { small?: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full bg-gradient-to-r from-[#FFA73C] to-[#FF5255] font-bold uppercase tracking-wide text-white ${
        small ? "px-1.5 py-px text-[9px]" : "px-2 py-0.5 text-[10px]"
      }`}
    >
      New
    </span>
  );
}

function Caret({ open, color }: { open: boolean; color: string }) {
  return (
    <ChevronRight
      className="size-3.5 shrink-0 transition-transform duration-200"
      style={{ color, transform: open ? "rotate(90deg)" : undefined }}
    />
  );
}

export default function ModelMapPage() {
  const [open, setOpen] = useState<Set<string>>(() => allIds("all"));
  const [query, setQuery] = useState("");
  const [onlyNew, setOnlyNew] = useState(false);
  const [groupFilter, setGroupFilter] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const [zoom, setZoom] = useState(1);
  /** 右侧「看 UI」面板：嵌开发原型(Video Gen 的模型 + 模式，或加工类的工具页) */
  const [ui, setUi] = useState<{ src: string; where: string; title: string } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const treeRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; l: number; t: number } | null>(null);

  /** 根节点在最上方居中：把画布横向滚到中间、纵向回到顶部 */
  const centerRoot = () => {
    const c = canvasRef.current;
    const t = treeRef.current;
    if (!c || !t) return;
    c.scrollLeft = (c.scrollWidth - c.clientWidth) / 2;
    c.scrollTop = 0;
  };
  useEffect(() => {
    const raf = requestAnimationFrame(centerRoot);
    return () => cancelAnimationFrame(raf);
  }, [q, onlyNew, groupFilter, zoom]);

  /** 整棵树刚好放进画布的缩放比例(最小 0.2) */
  const fitZoom = () => {
    const c = canvasRef.current;
    const t = treeRef.current;
    if (!c || !t) return;
    const w = t.scrollWidth / zoom;
    const h = t.scrollHeight / zoom;
    setZoom(Math.max(0.2, Math.min(1, (c.clientWidth - 32) / w, (c.clientHeight - 32) / h)));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button, a, mark, .select-text")) return;
    const el = canvasRef.current;
    if (!el || e.pointerType !== "mouse") return;
    drag.current = { x: e.clientX, y: e.clientY, l: el.scrollLeft, t: el.scrollTop };
    el.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const el = canvasRef.current;
    if (!el || !drag.current) return;
    el.scrollLeft = drag.current.l - (e.clientX - drag.current.x);
    el.scrollTop = drag.current.t - (e.clientY - drag.current.y);
  };
  const endDrag = () => {
    drag.current = null;
  };


  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  /** 过滤后的树 + 搜索时自动展开的节点 */
  const { groups, autoOpen } = useMemo(() => {
    const auto = new Set<string>();
    const out: MapGroup[] = [];
    for (const g of GROUPS) {
      if (groupFilter && g.key !== groupFilter) continue;
      const models: MapModel[] = [];
      for (const m of g.models) {
        let modes = m.modes;
        if (onlyNew && !m.isNew) {
          modes = modes.filter((d) => d.isNew);
          if (modes.length === 0) continue;
        }
        if (q) {
          const modelHit = hits(m.name, q) || hits(m.provider, q);
          const modeHits = modes.filter(
            (d) => hits(d.name, q) || d.params.some((p) => hits(p.v, q) || hits(p.k, q)),
          );
          const limitHit = m.limits.some((p) => hits(p.v, q) || hits(p.k, q));
          const settingHit = (m.settings ?? []).some((p) => hits(p.v, q) || hits(p.k, q));
          if (!modelHit && modeHits.length === 0 && !limitHit && !settingHit) continue;
          if (settingHit) auto.add(did(g, m, SETTINGS));
          if (modeHits.length || limitHit || settingHit) auto.add(mid(g, m));
          for (const d of modeHits) if (!hits(d.name, q)) auto.add(did(g, m, d.name));
          if (limitHit) auto.add(did(g, m, LIMITS));
        }
        models.push({ ...m, modes });
      }
      if (models.length) out.push({ ...g, models });
    }
    return { groups: out, autoOpen: auto };
  }, [q, onlyNew, groupFilter]);

  const isOpen = (id: string) => open.has(id) || autoOpen.has(id) || (q !== "" && id.startsWith("g:"));

  const stats = useMemo(() => {
    const all = GROUPS.flatMap((g) => g.models);
    const newModes = new Set(VIDEO_MODELS.flatMap((m) => m.modes.filter((d) => d.isNew).map((d) => d.name.split(" — ")[0])));
    return { models: all.length, newModels: all.filter((m) => m.isNew).length, newModes: newModes.size };
  }, []);

  const shownModels = groups.reduce((n, g) => n + g.models.length, 0);


  /* ---------- nodes ---------- */
  const renderModel = (g: MapGroup, m: MapModel) => {
    const id = mid(g, m);
    const o = isOpen(id);
    const defaults = m.modes.filter((d) => d.isDefault).length;
    const node = (
      <button
        type="button"
        onClick={() => toggle(id)}
        aria-expanded={o}
        className="group flex w-[248px] max-w-full shrink-0 flex-col gap-1 rounded-[14px] border bg-white px-3 py-2.5 text-left shadow-[0_2px_8px_rgba(26,26,46,0.05)] transition hover:-translate-y-px hover:shadow-[0_6px_18px_rgba(26,26,46,0.09)]"
        style={{ borderColor: m.isNew ? `${g.color}66` : "#ececf1" }}
      >
        <span className="flex items-center gap-1.5">
          <Caret open={o} color={g.color} />
          <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-[#1a1a2e]">
            <Hl text={m.name} q={q} />
          </span>
          {m.isNew && <NewBadge />}
        </span>
        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 pl-5 text-[11px] text-[#6a6b7b]">
          <span>{m.provider}</span>
          <span className="text-[#c4c5d0]">·</span>
          <span>
            {m.modes.length} {m.modes.length === 1 ? "mode" : "modes"}
          </span>
          {defaults > 0 && (
            <span className="inline-flex items-center gap-0.5 font-medium text-[#b45309]">
              <Star className="size-2.5 fill-current" /> Default ×{defaults}
            </span>
          )}
        </span>
        {m.price && <span className="pl-5 text-[11px] font-medium tabular-nums text-[#1a1a2e]/70">{m.price}</span>}
        {m.note && (
          <span className="ml-5 mt-0.5 flex gap-1 rounded-md bg-[#fff7f1] px-1.5 py-1 text-[11px] leading-snug text-[#9a4a1c]">
            <Info className="mt-px size-3 shrink-0" />
            {m.note}
          </span>
        )}
      </button>
    );
    if (!o) return <Branch line={g.color} node={node} />;

    const modeNodes = m.modes.map((d) => {
      const dId = did(g, m, d.name);
      const dOpen = isOpen(dId);
      const pill = (
        <button
          type="button"
          onClick={() => toggle(dId)}
          aria-expanded={dOpen}
          className="flex w-[222px] max-w-full shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-left text-[12.5px] font-medium transition hover:brightness-[0.98]"
          style={{
            borderColor: d.isNew ? g.color : `${g.color}33`,
            background: d.isNew ? "#fff" : g.tint,
            color: "#1a1a2e",
          }}
        >
          <Caret open={dOpen} color={g.color} />
          <span className="min-w-0 flex-1 truncate">
            <Hl text={d.name} q={q} />
          </span>
          {d.isDefault && <Star className="size-3 shrink-0 fill-[#f59e0b] text-[#f59e0b]" aria-label="Default model for this mode" />}
          {d.isNew && <NewBadge small />}
        </button>
      );
      const target = g.key === "video" || g.key === "clone" ? uiTargetOf(m.key, d.name) : undefined;
      const uiActive = !!target && ui?.src === target.src;
      const pillRow =
        target === undefined ? (
          pill
        ) : (
          <div className="flex max-w-full items-center gap-1">
            {pill}
            <button
              type="button"
              onClick={() => setUi({ src: target.src, where: target.where, title: `${m.name} · ${d.name}` })}
              aria-label={`See the UI for ${d.name} on ${m.name}`}
              title={`See it in ${target.where.startsWith("工具页") ? "its tool page" : "Video Gen"}`}
              className={`grid size-7 shrink-0 place-items-center rounded-full border transition ${uiActive ? "border-transparent bg-[#1a1a2e] text-white" : "border-[#ececf1] bg-white text-[#6a6b7b] hover:border-[#ff5e1a]/50 hover:text-[#ff5e1a]"}`}
            >
              <MonitorPlay className="size-3.5" />
            </button>
          </div>
        );
      return (
        <Branch
          key={d.name}
          line={g.color}
          node={pillRow}
          tick={14}
          kids={dOpen ? d.params.map((p) => <Leaf key={p.k} k={p.k} v={p.v} q={q} color={g.color} />) : undefined}
        />
      );
    });

    if (m.settings?.length) {
      const sId = did(g, m, SETTINGS);
      const sOpen = isOpen(sId);
      modeNodes.push(
        <Branch
          key={SETTINGS}
          line={g.color}
          node={
            <button
              type="button"
              onClick={() => toggle(sId)}
              aria-expanded={sOpen}
              className="flex w-[222px] max-w-full shrink-0 items-center gap-1.5 rounded-full border border-dashed px-2.5 py-1.5 text-left text-[12.5px] font-medium text-[#1a1a2e] transition hover:brightness-[0.98]"
              style={{ borderColor: `${g.color}66`, background: "#fff" }}
            >
              <Caret open={sOpen} color={g.color} />
              Extra settings
              <span className="ml-auto text-[11px] tabular-nums text-[#9a9bab]">{m.settings.length}</span>
            </button>
          }
          tick={14}
          kids={sOpen ? m.settings.map((p, i) => <Leaf key={`${p.k}-${i}`} k={p.k} v={p.v} q={q} color={g.color} />) : undefined}
        />,
      );
    }

    if (m.limits.length) {
      const lId = did(g, m, LIMITS);
      const lOpen = isOpen(lId);
      modeNodes.push(
        <Branch
          key={LIMITS}
          line="#c4c5d0"
          node={
            <button
              type="button"
              onClick={() => toggle(lId)}
              aria-expanded={lOpen}
              className="flex w-[222px] max-w-full shrink-0 items-center gap-1.5 rounded-full border border-dashed border-[#c4c5d0] bg-white px-2.5 py-1.5 text-left text-[12.5px] font-medium text-[#6a6b7b] transition hover:border-[#9a9bab]"
            >
              <Caret open={lOpen} color="#9a9bab" />
              Limits & specs
              <span className="ml-auto text-[11px] tabular-nums text-[#9a9bab]">{m.limits.length}</span>
            </button>
          }
          tick={14}
          kids={lOpen ? m.limits.map((p) => <Leaf key={p.k} k={p.k} v={p.v} q={q} color="#9a9bab" />) : undefined}
        />,
      );
    }
    return <Branch line={g.color} node={node} kids={modeNodes} />;
  };

  const renderGroup = (g: MapGroup) => {
    const id = gid(g);
    const o = isOpen(id);
    const Icon = GROUP_ICON[g.key];
    const newCount = g.models.filter((m) => m.isNew).length;
    const node = (
      <button
        type="button"
        onClick={() => toggle(id)}
        aria-expanded={o}
        className="flex w-[176px] shrink-0 items-center gap-2.5 rounded-[16px] px-3 py-3 text-left text-white shadow-[0_8px_20px_rgba(26,26,46,0.12)] transition hover:-translate-y-px"
        style={{ background: g.color }}
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-white/20">
          <Icon className="size-[18px]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-semibold leading-tight">{g.label}</span>
          <span className="block text-[11px] leading-tight text-white/80">
            {g.zh} · {g.models.length}
            {newCount > 0 && ` · ${newCount} new`}
          </span>
        </span>
        <ChevronRight className="size-4 shrink-0 transition-transform" style={{ transform: o ? "rotate(90deg)" : undefined }} />
      </button>
    );
    return <OrgBranch key={g.key} line={g.color} node={node} kids={o ? g.models.map((m) => <div key={m.name} className="self-start">{renderModel(g, m)}</div>) : undefined} />;
  };

  const root = (
    <div className="flex w-[188px] shrink-0 flex-col gap-1 rounded-[20px] bg-[#1a1a2e] px-4 py-4 text-white shadow-[0_12px_28px_rgba(26,26,46,0.22)]">
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#ffc078]">BuzzVideo · v1.12</span>
      <span className="text-[17px] font-bold leading-tight">All Models</span>
      <span className="text-[11.5px] text-white/65">
        {shownModels} models · {groups.length} types
      </span>
    </div>
  );

  return (
    <div className="flex min-h-dvh flex-col bg-[#faf8f6] md:h-dvh text-[#1a1a2e]" style={{ fontFamily: APPLE_FONT }}>
      <style>{`
        .vt-children{margin-left:10px}
        .vt-child{position:relative;padding:8px 0 0 16px}
        .vt-child::before{content:"";position:absolute;left:0;top:calc(8px + var(--tick));width:14px;border-top:1.5px solid var(--line);opacity:.55}
        .vt-child::after{content:"";position:absolute;left:0;top:0;bottom:0;border-left:1.5px solid var(--line);opacity:.55}
        .vt-child:last-child::after{bottom:auto;height:calc(8px + var(--tick))}
        .oc-stub{display:block;width:0;height:22px;border-left:1.5px solid var(--line);opacity:.55}
        .oc-children{display:flex;align-items:flex-start}
        .oc-child{position:relative;display:flex;flex-direction:column;align-items:center;padding:22px 10px 0}
        .oc-child::before{content:"";position:absolute;top:0;left:0;right:0;border-top:1.5px solid var(--line);opacity:.55}
        .oc-child:first-child::before{left:50%}
        .oc-child:last-child::before{right:50%}
        .oc-child:only-child::before{display:none}
        .oc-child::after{content:"";position:absolute;top:0;left:50%;height:22px;border-left:1.5px solid var(--line);opacity:.55}
        .mm-canvas{background-image:radial-gradient(#e4e0db 1px,transparent 1px);background-size:18px 18px}
      `}</style>

      {/* header */}
      <header className="border-b border-[#ececf1] bg-white/90 px-4 pb-4 pt-5 backdrop-blur sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ff5e1a]">v1.12 · Model Map</p>
            <h1 className="mt-1 text-[22px] font-bold leading-tight sm:text-[26px]">
              模型 → 模式 →{" "}
              <span className="bg-gradient-to-r from-[#ffc078] to-[#ff5e1a] bg-clip-text text-transparent">参数</span>
            </h1>
            <p className="mt-1 max-w-[640px] text-[13px] leading-relaxed text-[#6a6b7b]">
              所有在用模型的思维导图。点模型展开它支持的模式，点模式看接口和参数，「Extra settings」是 Thinking、Prompt Enhance 这类额外开关，「Limits & specs」是时长 / 比例 / 分辨率 / 文件上限;蓝色端点点开是官方 API 文档，视频模式旁的屏幕图标在右侧打开 Video Gen 对应界面。视频数据来自各模型 Agent skill;新模型来自 Notion「v1.12 上新模型清单」(成本价)。
            </p>
          </div>
          <div className="flex gap-2 text-center">
            <Stat n={stats.models} label="Models" />
            <Stat n={stats.newModels} label="New models" accent />
            <Stat n={stats.newModes} label="New modes" accent />
          </div>
        </div>

        {/* toolbar */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <label className="flex h-9 min-w-0 flex-1 basis-[220px] items-center gap-2 rounded-full border border-[#ececf1] bg-white px-3 focus-within:border-[#ff5e1a]/60 sm:max-w-[320px]">
            <Search className="size-4 shrink-0 text-[#9a9bab]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search model, mode or parameter…"
              className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-[#9a9bab]"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="text-[#9a9bab] hover:text-[#1a1a2e]">
                <X className="size-3.5" />
              </button>
            )}
          </label>

          <button
            type="button"
            onClick={() => setOnlyNew((v) => !v)}
            aria-pressed={onlyNew}
            className={`flex h-9 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-medium transition ${
              onlyNew ? "border-transparent bg-gradient-to-r from-[#FFA73C] to-[#FF5255] text-white" : "border-[#ececf1] bg-white text-[#1a1a2e] hover:border-[#ff5e1a]/40"
            }`}
          >
            <Sparkles className="size-3.5" /> 只看 NEW
          </button>

          <div className="flex h-9 items-center rounded-full border border-[#ececf1] bg-white p-0.5 text-[12px] font-medium">
            {(
              [
                ["groups", "收起"],
                ["models", "展开到模式"],
                ["all", "全部展开"],
              ] as const
            ).map(([lvl, label]) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setOpen(allIds(lvl))}
                className="h-full rounded-full px-3 text-[#6a6b7b] transition hover:bg-[#fff3ec] hover:text-[#ff5e1a]"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="-mx-4 mt-3 flex gap-1.5 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] sm:mx-0 sm:px-0">
          <Chip active={groupFilter === null} onClick={() => setGroupFilter(null)} color="#1a1a2e">
            All
          </Chip>
          {GROUPS.map((g) => (
            <Chip key={g.key} active={groupFilter === g.key} onClick={() => setGroupFilter(groupFilter === g.key ? null : g.key)} color={g.color}>
              {g.label} <span className="opacity-60">{g.models.length}</span>
            </Chip>
          ))}
        </div>
      </header>

      {/* legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-[#ececf1] bg-white px-4 py-2 text-[11.5px] text-[#6a6b7b] sm:px-6">
        <span className="flex items-center gap-1.5">
          <NewBadge /> v1.12 新上的模型 / 模式
        </span>
        <span className="flex items-center gap-1.5">
          <Star className="size-3 fill-[#f59e0b] text-[#f59e0b]" /> 该模式的默认模型(Auto 时用它)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3.5 w-6 rounded-full border border-dashed border-[#c4c5d0]" /> 时长 / 比例 / 分辨率 / 文件上限
        </span>
        <span className="flex items-center gap-1.5">
          <Info className="size-3 text-[#9a4a1c]" /> 备注(替代关系、价格变动等)
        </span>
        <span className="ml-auto hidden text-[#9a9bab] md:inline">拖动画布平移 · 左下角缩放</span>
      </div>

      {/* canvas */}
      <div className="relative h-[82dvh] md:h-auto md:min-h-0 md:flex-1">
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-0.5 rounded-full border border-[#ececf1] bg-white p-1 shadow-[0_6px_18px_rgba(26,26,46,0.10)]">
        <button type="button" aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(0.2, +(z - 0.1).toFixed(2)))} className="grid size-8 place-items-center rounded-full text-[#6a6b7b] hover:bg-[#fff3ec] hover:text-[#ff5e1a]">
          <Minus className="size-4" />
        </button>
        <button type="button" onClick={() => setZoom(1)} className="h-8 min-w-[52px] rounded-full px-2 text-[12px] font-medium tabular-nums text-[#1a1a2e] hover:bg-[#fff3ec]">
          {Math.round(zoom * 100)}%
        </button>
        <button type="button" aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(1.5, +(z + 0.1).toFixed(2)))} className="grid size-8 place-items-center rounded-full text-[#6a6b7b] hover:bg-[#fff3ec] hover:text-[#ff5e1a]">
          <Plus className="size-4" />
        </button>
        <button type="button" aria-label="Fit to screen" title="Fit to screen" onClick={fitZoom} className="grid size-8 place-items-center rounded-full text-[#6a6b7b] hover:bg-[#fff3ec] hover:text-[#ff5e1a]">
          <Maximize2 className="size-3.5" />
        </button>
      </div>
      <div
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="mm-canvas absolute inset-0 cursor-grab overflow-auto active:cursor-grabbing"
      >
        <div ref={treeRef} className={`inline-flex min-w-full justify-center px-6 pb-24 pt-6 sm:px-10 sm:pt-8 ${ui ? "lg:pr-[500px]" : ""}`} style={{ zoom }}>
          {groups.length === 0 ? (
            <div className="grid min-h-[40vh] place-items-center text-center text-[13px] text-[#6a6b7b]">
              <div>
                <p className="font-medium text-[#1a1a2e]">No models match “{query}”</p>
                <p className="mt-1">换个关键词，或关掉「只看 NEW」/ 类型筛选。</p>
              </div>
            </div>
          ) : (
            <OrgBranch line="#1a1a2e" node={root} kids={groups.map(renderGroup)} />
          )}
        </div>
      </div>
      {ui && (
        <aside aria-label="Video Gen UI" className="absolute inset-y-0 right-0 z-20 flex w-full flex-col border-l border-[#ececf1] bg-white shadow-[-12px_0_32px_rgba(26,26,46,0.10)] sm:w-[480px]">
          <div className="flex items-center gap-2 border-b border-[#ececf1] px-3 py-2.5">
            <MonitorPlay className="size-4 shrink-0 text-[#ff5e1a]" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-[#1a1a2e]">{ui.title}</p>
              <p className="text-[11px] text-[#9a9bab]">{ui.where} · 开发原型(可直接操作)</p>
            </div>
            <a href={ui.src} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-full px-2 py-1 text-[12px] text-[#6a6b7b] hover:bg-[#fff3ec] hover:text-[#ff5e1a]">
              <ExternalLink className="size-3.5" /> 新窗口
            </a>
            <button type="button" aria-label="Close UI panel" onClick={() => setUi(null)} className="grid size-7 place-items-center rounded-full text-[#6a6b7b] hover:bg-[#f4f4f6]">
              <X className="size-4" />
            </button>
          </div>
          <iframe key={ui.src} src={ui.src} title={ui.title} className="min-h-0 flex-1 bg-[#faf8f6]" />
        </aside>
      )}
      </div>
    </div>
  );
}


function Leaf({ k, v, q, color }: { k: string; v: string; q: string; color: string }) {
  return (
    <div className="w-[240px] max-w-full shrink-0 cursor-text rounded-[10px] border border-[#ececf1] bg-white px-2.5 py-1.5 text-[12px] leading-snug shadow-[0_1px_3px_rgba(26,26,46,0.04)] select-text">
      <span className="mr-1.5 text-[10.5px] font-semibold uppercase tracking-wide" style={{ color }}>
        {k}
      </span>
      <span className="break-words text-[#1a1a2e]/85">
        {k === "Endpoint" || k === "Model"
          ? docParts(v).map((p, i) =>
              p.url ? (
                <a key={i} href={p.url} target="_blank" rel="noreferrer" title="Open the API docs" className="text-[#2f6bff] underline decoration-[#2f6bff]/30 underline-offset-2 hover:decoration-[#2f6bff]">
                  <Hl text={p.text} q={q} />
                  <ExternalLink className="ml-0.5 inline size-3 align-[-1px]" />
                </a>
              ) : (
                <Hl key={i} text={p.text} q={q} />
              ),
            )
          : <Hl text={v} q={q} />}
      </span>
    </div>
  );
}

function Stat({ n, label, accent }: { n: number; label: string; accent?: boolean }) {
  return (
    <div className={`min-w-[74px] rounded-[12px] border px-3 py-1.5 ${accent ? "border-[#ffd9c2] bg-[#fff7f1]" : "border-[#ececf1] bg-white"}`}>
      <div className={`text-[20px] font-bold tabular-nums leading-tight ${accent ? "text-[#ff5e1a]" : ""}`}>{n}</div>
      <div className="text-[10.5px] text-[#6a6b7b]">{label}</div>
    </div>
  );
}

function Chip({ active, onClick, color, children }: { active: boolean; onClick: () => void; color: string; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="flex h-8 shrink-0 items-center gap-1 rounded-full border px-3 text-[12px] font-medium transition"
      style={active ? { background: color, borderColor: color, color: "#fff" } : { background: "#fff", borderColor: "#ececf1", color: "#1a1a2e" }}
    >
      {children}
    </button>
  );
}
