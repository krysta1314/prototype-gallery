"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ChevronRight, TriangleAlert } from "lucide-react";
import { JOURNEYS, type Journey } from "./journeys";
import { NAV_TREE, PAGE_TITLES, isPage, navLeaves, navPathOf, type NavNode } from "./navTree";

const BY_ID = new Map(JOURNEYS.map((j) => [j.id, j]));
/** 属于异常与边界的旅程,导航里用警示样式标出 */
const isEdge = (id: string) => BY_ID.get(id)?.group === "异常与边界";
const keyOf = (trail: string[]) => trail.join(" › ");
const hasEdge = (nodes: (NavNode | string)[]): boolean => nodes.some((n) => (typeof n === "string" ? isEdge(n) : hasEdge(n.children)));
const countLeaves = (nodes: (NavNode | string)[]) => navLeaves(nodes).length;

/** 模块色转成带透明度的底色 */
export function tint(hex: string | undefined, alpha: number) {
  if (!hex) return "transparent";
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

/**
 * 左栏:按用户旅程排的多级导航(一级阶段 › 二级功能 › 三级子流程 › 旅程)。
 * 默认只展开当前旅程所在的阶段,收起的阶段显示条数;「全部展开」一次打开全部。
 * 层级(2026-10-19 定，所有评审原型通用):一级阶段 = 模块色浅底整块 + 色块彩色标题;
 * 二级功能之间、三级子流程前后用细分隔线隔开，不再叠白卡片 / 边框
 */
export default function JourneyNav({ current, onSelect, onPage }: { current: string; onSelect: (j: Journey) => void; /** 点整页导航项(如埋点汇总) */ onPage: (id: string) => void }) {
  const path = navPathOf(current) ?? [];
  const [openMods, setOpenMods] = useState<Set<string>>(() => new Set(path.slice(0, 1)));
  const [closedGroups, setClosedGroups] = useState<Set<string>>(() => new Set());
  // 切到别的旅程时,展开它所在的阶段和分组
  useEffect(() => {
    const p = navPathOf(current) ?? [];
    if (p[0]) setOpenMods((prev) => (prev.has(p[0]) ? prev : new Set(prev).add(p[0])));
    setClosedGroups((prev) => {
      const next = new Set(prev);
      for (let i = 2; i <= p.length; i++) next.delete(keyOf(p.slice(0, i)));
      return next.size === prev.size ? prev : next;
    });
  }, [current]);
  // 「只看异常」:只列带警示图标的旅程
  const [onlyEdge, setOnlyEdge] = useState(false);
  const edgeCount = JOURNEYS.filter((j) => isEdge(j.id)).length;
  const allOpen = NAV_TREE.every((m) => openMods.has(m.label));
  const toggleMod = (label: string) =>
    setOpenMods((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  const toggleGroup = (k: string) =>
    setClosedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  const ctx: Ctx = { current, currentKey: keyOf(path), onlyEdge, closedGroups, toggleGroup, onSelect, onPage };

  return (
    <nav className="flex min-h-0 flex-col border-r border-black/[0.06] bg-[#f4f4f6]">
      <header className="px-5 pb-3 pt-5">
        <h1 className="text-[15px] font-semibold">BuzzVideo APP · 评审</h1>
        <p className="mt-1 text-[12px] leading-[18px] text-[#5f6070]">点任一步,真机直接跳到该状态;真机也可以自由点。</p>
        <div className="mt-2.5 flex items-center gap-2">
          <label className="flex flex-1 cursor-pointer items-center justify-between rounded-lg bg-white/70 px-2.5 py-1.5 text-[12.5px] text-[#3a3b45] ring-1 ring-black/[0.05]">
            <span className="flex items-center gap-1.5">
              <TriangleAlert size={13} strokeWidth={2.2} className="text-[#d9480f]" />
              只看异常({edgeCount})
            </span>
            <input type="checkbox" checked={onlyEdge} onChange={(e) => setOnlyEdge(e.target.checked)} className="size-3.5 accent-[#ff5e1a]" />
          </label>
          <button
            type="button"
            onClick={() => setOpenMods(allOpen ? new Set(path.slice(0, 1)) : new Set(NAV_TREE.map((m) => m.label)))}
            className="shrink-0 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-[#5f6070] ring-1 ring-black/[0.05] hover:bg-white"
          >
            {allOpen ? "收起" : "全部展开"}
          </button>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        {NAV_TREE.map((m, i) => {
          if (onlyEdge && !hasEdge(m.children)) return null;
          const open = onlyEdge || openMods.has(m.label);
          return <Module key={m.label} m={m} index={i + 1} open={open} holds={!open && path[0] === m.label} onToggle={() => toggleMod(m.label)} ctx={ctx} />;
        })}
      </div>
      <footer className="border-t border-black/[0.06] px-5 py-3">
        <a href="/prototypes/buzzvideo-app" className="inline-flex items-center gap-1 text-[12px] font-medium text-[#3a3b45] hover:text-[#ff5e1a]">
          开发原型(无外壳)
          <ArrowUpRight size={12} />
        </a>
      </footer>
    </nav>
  );
}

type Ctx = {
  current: string;
  /** 当前旅程所在分组的完整路径,收起的分组里有当前旅程时显示小点 */
  currentKey: string;
  onlyEdge: boolean;
  closedGroups: Set<string>;
  toggleGroup: (k: string) => void;
  onSelect: (j: Journey) => void;
  onPage: (id: string) => void;
};

/** 一级:旅程阶段。整块模块色浅底，标题用模块色;收起时只剩标题一行 + 条数 */
function Module({ m, index, open, holds, onToggle, ctx }: { m: NavNode; index: number; open: boolean; holds: boolean; onToggle: () => void; ctx: Ctx }) {
  const color = m.color ?? "#ff5e1a";
  // 只看异常时，只留有异常的段
  const segments = m.children.filter((n) => !ctx.onlyEdge || (typeof n === "string" ? isEdge(n) : hasEdge(n.children)));
  return (
    <section className="mt-2 rounded-xl p-1.5 first:mt-0" style={{ backgroundColor: tint(color, 0.07) }}>
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-2 rounded-lg px-2 py-[7px] text-left text-[13px] font-semibold hover:bg-white/50" style={{ color }}>
        <span className="size-2 shrink-0 rounded-[3px]" style={{ backgroundColor: color }} />
        <span className="flex-1">
          {index} · {m.label}
        </span>
        {holds ? <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} /> : null}
        {!open ? <span className="text-[12px] font-normal opacity-60">{countLeaves(m.children)}</span> : null}
        <ChevronRight size={13} strokeWidth={2.2} className={`shrink-0 opacity-60 transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      {open
        ? segments.map((n) => (
            // 二级之间:一条模块色细分隔线
            <div key={typeof n === "string" ? n : n.label} className="border-t pt-0.5" style={{ borderColor: tint(color, 0.18) }}>
              <Branch nodes={[n]} trail={[m.label]} depth={0} color={color} ctx={ctx} />
            </div>
          ))
        : null}
    </section>
  );
}

function Branch({ nodes, trail, depth, color, ctx }: { nodes: (NavNode | string)[]; trail: string[]; depth: number; color: string; ctx: Ctx }) {
  const indent = 8 + depth * 14;
  return (
    <ul>
      {nodes.map((n) => {
        if (typeof n === "string") {
          if (isPage(n)) {
            if (ctx.onlyEdge) return null;
            return (
              <li key={n}>
                <Row label={PAGE_TITLES[n]} indent={indent} on={n === ctx.current} edge={false} color={color} onClick={() => ctx.onPage(n)} />
              </li>
            );
          }
          const j = BY_ID.get(n);
          if (!j || (ctx.onlyEdge && !isEdge(n))) return null;
          const parent = trail[trail.length - 1];
          // 「Apple 登录:第一次」挂在「Apple 登录」下面时,只显示「第一次」
          const label = j.title.startsWith(`${parent}:`) ? j.title.slice(parent.length + 1) : j.title;
          return (
            <li key={n}>
              <Row label={label} indent={indent} on={n === ctx.current} edge={isEdge(n)} color={color} onClick={() => ctx.onSelect(j)} />
            </li>
          );
        }
        if (ctx.onlyEdge && !hasEdge(n.children)) return null;
        const k = keyOf([...trail, n.label]);
        const expanded = ctx.onlyEdge || !ctx.closedGroups.has(k);
        const holds = !expanded && (ctx.currentKey === k || ctx.currentKey.startsWith(`${k} › `));
        // 二级(depth 0)标题加粗,三级标题中等字重
        const sub = depth > 0;
        return (
          // 三级子流程:上下各一条浅分隔线，和同级的旅程分开
          <li key={k} className={sub ? "my-0.5 border-y" : ""} style={sub ? { borderColor: tint(color, 0.12) } : undefined}>
            <button
              type="button"
              onClick={() => ctx.toggleGroup(k)}
              aria-expanded={expanded}
              style={{ paddingLeft: indent }}
              className={`flex w-full items-center gap-1 rounded-lg py-[7px] pr-2 text-left text-[13px] text-[#1a1a2e] hover:bg-white/60 focus-visible:outline-2 focus-visible:outline-[#ff5e1a] ${sub ? "font-medium" : "font-semibold"}`}
            >
              <ChevronRight size={13} strokeWidth={2.2} className={`shrink-0 text-[#8a8b98] transition-transform ${expanded ? "rotate-90" : ""}`} />
              <span className="flex-1">{n.label}</span>
              {holds ? <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} /> : null}
            </button>
            {expanded ? <Branch nodes={n.children} trail={[...trail, n.label]} depth={depth + 1} color={color} ctx={ctx} /> : null}
          </li>
        );
      })}
    </ul>
  );
}

/** 叶子和同级的分组标题对齐:都是「13px 图标位 + 文字」,图标位放展开箭头 / 当前小点;异常的警示图标在文字列开头 */
function Row({ label, indent, on, edge, color, onClick }: { label: string; indent: number; on: boolean; edge: boolean; color: string; onClick: () => void }) {
  // 当前旅程滚到可见处(从链接打开、或在真机里点到别的旅程时)
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (on) ref.current?.scrollIntoView({ block: "nearest" });
  }, [on]);
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-current={on ? "step" : undefined}
      // 当前旅程：模块色浅底上用白底 + 加粗标出
      style={{ paddingLeft: indent }}
      className={`flex w-full items-center gap-1 rounded-lg py-[6px] pr-2 text-left text-[13px] transition-colors focus-visible:outline-2 focus-visible:outline-[#ff5e1a] ${
        on ? "bg-white font-semibold text-[#1a1a2e] shadow-[0_1px_2px_rgba(26,26,46,0.08)]" : edge ? "text-[#8a3b12] hover:bg-white/60" : "text-[#3a3b45] hover:bg-white/60"
      }`}
    >
      <span className="flex w-[13px] shrink-0 justify-center">{on ? <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} /> : null}</span>
      {edge ? <TriangleAlert size={12} strokeWidth={2.2} className="mr-1 shrink-0 text-[#d9480f]" /> : null}
      {label}
    </button>
  );
}
