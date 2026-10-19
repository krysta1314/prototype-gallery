"use client";

/* 评审外壳(解说用,中文),分两块:
   - JourneyNav:左栏,只放用户旅程,点一步 = 产品跳到该状态;
   - DemoPanel:产品下方的横条,三列 —— 这一屏的需求要点 / 状态开关 / 模拟事件;顶边可拖改高度。
   两块一起收起,收起后产品铺满整屏,左边缘留一条展开按钮(ExpandStrip)。 */

import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, RotateCcw, TriangleAlert } from "lucide-react";
import { useState, type PointerEvent as ReactPointerEvent } from "react";
import type { CreationType } from "../app/components/CreationTypePicker";
import { JOURNEYS, LANDING_STEPS, type AgentFail, type ReviewOpts, type StepId } from "./journeys";
import { ALL_GROUP_KEYS, NAV_TREE, keyOf, navLeaves, navPathOf, type NavNode } from "./navTree";

/** 「生成失败(Agent)」的五档 */
const AGENT_FAILS: [AgentFail, string][] = [
  ["none", "无"],
  ["shotBusy", "镜头·繁忙"],
  ["shotModeration", "镜头·审核"],
  ["voiceBusy", "配音·繁忙"],
  ["voiceScript", "配音·敏感词"],
];
import { NOTES, type StepNote } from "./notes";

export const NAV_W = 240;
/** 面板默认高度;可拖顶边改,范围 PANEL_MIN – 窗口 70% */
export const PANEL_H = 300;
export const PANEL_MIN = 160;
export const panelMax = () => Math.round(window.innerHeight * 0.7);
export const clampPanelH = (h: number) => Math.min(Math.max(h, PANEL_MIN), Math.max(PANEL_MIN, panelMax()));

const isExc = (id: StepId) => !!JOURNEYS.find((j) => j.id === id)?.group.includes("异常");

/** 导航路径:Agent › 生成 › 生成失败 › 镜头审核未过(右下「这一屏」、收起条都用这个) */
function crumb(id: StepId) {
  const j = JOURNEYS.find((x) => x.id === id);
  return j ? [...(navPathOf(id) ?? []), j.title].join(" › ") : "";
}

/* 「这一屏」的小节顺序;待定用橙色。界面文案(copy)只留在数据里,不在面板展示 */
const SECTIONS: { key: keyof StepNote; label: string; mono?: boolean; warn?: boolean }[] = [
  { key: "what", label: "需求说明" },
  { key: "rules", label: "交互规则" },
  { key: "edges", label: "边界情况" },
  { key: "errors", label: "异常处理" },
  { key: "open", label: "待定", warn: true },
];

/** 环节色的浅底 */
const tint = (hex: string, alpha: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};

/**
 * 左栏:顶部开关切 Agent / 画布剪辑器 两个产品模块,下面是这个模块的多级导航(环节 › 子流程 › 步骤)。
 * 每个环节一块自己颜色的浅底卡片(标题、当前点都用环节色),一眼分得清在哪个环节;环节可收起,
 * 收起的环节里有当前步骤时标题旁显示一个点。异常放在它发生的环节里,警示图标 + 暖色字;
 * 「只看异常」打开后只列异常步骤
 */
export function JourneyNav({ step, onStep, onCollapse }: { step: StepId; onStep: (s: StepId) => void; onCollapse: () => void }) {
  const [open, setOpen] = useState<Set<string>>(() => new Set(ALL_GROUP_KEYS));
  const [onlyExc, setOnlyExc] = useState(false);
  const path = navPathOf(step) ?? [];
  const currentKey = keyOf(path);
  /* 手动切到另一个模块只在当前步骤不变时生效;步骤一变(含 Edit in canvas 跳进剪辑器)就回到步骤所在的模块 */
  const [view, setView] = useState<{ part: string; at: StepId } | null>(null);
  const part = view && view.at === step ? view.part : path[0] ?? NAV_TREE[0].label;
  const mod = NAV_TREE.find((m) => m.label === part) ?? NAV_TREE[0];
  // 切到收起分组里的步骤时,把它所在的分组展开
  const [seen, setSeen] = useState(step);
  if (seen !== step) {
    setSeen(step);
    const next = new Set(open);
    for (let i = 2; i <= path.length; i++) next.add(keyOf(path.slice(0, i)));
    setOpen(next);
  }
  const toggle = (k: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  const excCount = navLeaves(mod.children).filter(isExc).length;

  return (
    <aside className="flex h-dvh shrink-0 flex-col border-r border-[#ececf1] bg-[#fafafb]" style={{ width: NAV_W }}>
      <div className="flex items-center justify-between border-b border-[#ececf1] px-4 py-3">
        <span className="text-[14px] font-semibold text-[#1a1a2e]">评审 · Hybrid Reel</span>
        <button type="button" onClick={onCollapse} aria-label="收起评审面板" className="text-[#6a6b7b] hover:text-[#1a1a2e]">
          <ChevronLeft className="size-4" />
        </button>
      </div>
      <div className="space-y-2 border-b border-[#ececf1] px-3 py-2.5">
        <div role="tablist" className="grid grid-cols-2 gap-1 rounded-xl bg-[#ececf1] p-1">
          {NAV_TREE.map((m) => {
            const on = m.label === mod.label;
            return (
              <button
                key={m.label}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setView({ part: m.label, at: step })}
                className={`rounded-lg px-2 py-1.5 text-center leading-tight ${on ? "bg-white shadow-sm" : "hover:bg-white/60"}`}
              >
                <span className={`block text-[12.5px] font-semibold ${on ? "text-[#1a1a2e]" : "text-[#6a6b7b]"}`}>{m.label}</span>
                <span className="block text-[10.5px] text-[#9a9bb0]">
                  {navLeaves(m.children).length} 步{!on && path[0] === m.label ? " · 当前" : ""}
                </span>
              </button>
            );
          })}
        </div>
        <label className="flex cursor-pointer items-center justify-between rounded-lg px-1.5 py-0.5 text-[12.5px] text-[#4a4b5c]">
          <span className="flex items-center gap-1.5">
            <TriangleAlert className="size-3.5 text-[#d9480f]" />
            只看异常({excCount})
          </span>
          <input type="checkbox" checked={onlyExc} onChange={(e) => setOnlyExc(e.target.checked)} className="size-3.5 accent-[#ff5e1a]" />
        </label>
      </div>
      <nav className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-3 py-3">
        {mod.children.map((n) => {
          if (typeof n === "string") return null;
          if (onlyExc && !hasExc(n.children)) return null;
          const color = n.color ?? "#ff5e1a";
          const trail = [mod.label, n.label];
          const k = keyOf(trail);
          const expanded = onlyExc || open.has(k);
          const holdsCurrent = !expanded && (currentKey === k || currentKey.startsWith(`${k} › `));
          return (
            <section key={k} className="rounded-xl p-1.5" style={{ backgroundColor: tint(color, 0.06) }}>
              <button
                type="button"
                onClick={() => toggle(k)}
                aria-expanded={expanded}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left text-[12.5px] font-semibold"
                style={{ color }}
              >
                <span className="size-2 shrink-0 rounded-[3px]" style={{ backgroundColor: color }} />
                <span className="flex-1">{n.label}</span>
                {holdsCurrent ? <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} /> : null}
                <ChevronRight className={`size-3.5 shrink-0 opacity-60 transition-transform ${expanded ? "rotate-90" : ""}`} />
              </button>
              {expanded ? (
                <NavBranch nodes={n.children} trail={trail} depth={0} open={open} toggle={toggle} step={step} currentKey={currentKey} onlyExc={onlyExc} color={color} onStep={onStep} />
              ) : null}
            </section>
          );
        })}
      </nav>
    </aside>
  );
}

const hasExc = (nodes: (NavNode | StepId)[]): boolean => nodes.some((n) => (typeof n === "string" ? isExc(n) : hasExc(n.children)));

function NavBranch({
  nodes,
  trail,
  depth,
  open,
  toggle,
  step,
  currentKey,
  onlyExc,
  color,
  onStep,
}: {
  nodes: (NavNode | StepId)[];
  trail: string[];
  depth: number;
  open: Set<string>;
  toggle: (k: string) => void;
  step: StepId;
  currentKey: string;
  onlyExc: boolean;
  /** 所在环节的颜色:当前步骤的点用它 */
  color: string;
  onStep: (s: StepId) => void;
}) {
  const indent = 4 + depth * 14;
  return (
    <ul>
      {nodes.map((n) => {
        if (typeof n === "string") {
          const j = JOURNEYS.find((x) => x.id === n);
          if (!j) return null;
          const exc = isExc(n);
          if (onlyExc && !exc) return null;
          const on = n === step;
          return (
            <li key={n}>
              <button
                type="button"
                onClick={() => onStep(n)}
                aria-current={on ? "step" : undefined}
                style={{ paddingLeft: indent }}
                className={`flex w-full items-center gap-1 rounded-lg py-[6px] pr-2 text-left text-[13px] ${
                  on ? "bg-white font-semibold text-[#1a1a2e] shadow-[0_1px_2px_rgba(26,26,46,0.08)]" : exc ? "text-[#8a3b12] hover:bg-white/70" : "text-[#1a1a2e] hover:bg-white/70"
                }`}
              >
                {/* 左边图标位只放当前点;异常的警示图标放进文字列,和同级文字的起点对齐 */}
                <span className="flex w-3.5 shrink-0 justify-center">{on ? <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} /> : null}</span>
                {exc ? <TriangleAlert className="mr-1 size-3 shrink-0 text-[#d9480f]" /> : null}
                {j.title}
              </button>
            </li>
          );
        }
        if (onlyExc && !hasExc(n.children)) return null;
        const k = keyOf([...trail, n.label]);
        const expanded = onlyExc || open.has(k);
        const holdsCurrent = !expanded && (currentKey === k || currentKey.startsWith(`${k} › `));
        return (
          <li key={k}>
            <button
              type="button"
              onClick={() => toggle(k)}
              aria-expanded={expanded}
              style={{ paddingLeft: indent }}
              className="flex w-full items-center gap-1 rounded-lg py-[6px] pr-2 text-left text-[13px] font-medium text-[#1a1a2e] hover:bg-white/70"
            >
              <ChevronRight className={`size-3.5 shrink-0 text-[#9a9bb0] transition-transform ${expanded ? "rotate-90" : ""}`} />
              <span className="flex-1">{n.label}</span>
              {holdsCurrent ? <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} /> : null}
            </button>
            {expanded ? (
              <NavBranch nodes={n.children} trail={[...trail, n.label]} depth={depth + 1} open={open} toggle={toggle} step={step} currentKey={currentKey} onlyExc={onlyExc} color={color} onStep={onStep} />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export function DemoPanel({
  step,
  opts,
  onOpts,
  onReplay,
  generating,
  onSendWhileGenerating,
  editorStep,
  height,
  onHeight,
  onCollapse,
}: {
  /** 只收起下方这一条(左栏不动) */
  onCollapse?: () => void;
  step: StepId;
  opts: ReviewOpts;
  onOpts: (o: ReviewOpts) => void;
  onReplay: () => void;
  generating: boolean;
  onSendWhileGenerating: () => void;
  /** 当前是剪辑器步骤:只对 Agent 生效的开关(分析失败 / 分镜失败 / 生成失败(Agent)/ 剪辑失败 / 旁白超长)置灰,「补拍生成失败」只对剪辑器生效;「积分不足」两边都生效 */
  editorStep: boolean;
  height: number;
  /** 拖动中每帧调用(done = false),松手时再调一次(done = true,用来存 localStorage) */
  onHeight: (h: number, done: boolean) => void;
}) {
  /* 拖顶边:往上拖变高 */
  const startDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const y0 = e.clientY;
    const h0 = height;
    let h = h0;
    const move = (ev: PointerEvent) => {
      h = clampPanelH(h0 + y0 - ev.clientY);
      onHeight(h, false);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      onHeight(h, true);
    };
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  const toggle = (label: string, on: boolean, set: (v: boolean) => void, disabled = false, hint?: string) => (
    <label className={`flex items-center justify-between py-0.5 text-[13px] ${disabled ? "opacity-40" : ""}`} title={disabled ? hint : undefined}>
      {label}
      <input
        type="checkbox"
        checked={on}
        disabled={disabled}
        onChange={(e) => set(e.target.checked)}
        className="size-4 accent-[#ff5e1a]"
      />
    </label>
  );
  const agentOnly = "只对 Agent 步骤生效";
  const seg = <T extends string | number>(label: string, value: T, choices: [T, string][], set: (v: T) => void, disabled = false, hint?: string) => (
    <div className={`flex items-center justify-between py-0.5 text-[13px] ${disabled ? "pointer-events-none opacity-40" : ""}`} title={disabled ? hint : undefined}>
      {label}
      <span className="flex overflow-hidden rounded-full border border-[#ececf1] bg-white">
        {choices.map(([v, l]) => (
          <button
            key={String(v)}
            type="button"
            onClick={() => set(v)}
            className={`px-2.5 py-0.5 text-[12px] ${value === v ? "bg-[#1a1a2e] text-white" : "text-[#4a4b5c]"}`}
          >
            {l}
          </button>
        ))}
      </span>
    </div>
  );
  const title = JOURNEYS.find((j) => j.id === step);
  const note = NOTES[step];

  return (
    <section className="relative flex shrink-0 gap-6 border-t border-[#ececf1] bg-[#fafafb] px-6 py-4" style={{ height }}>
      <div
        role="separator"
        aria-orientation="horizontal"
        aria-label="拖动调整面板高度"
        onPointerDown={startDrag}
        className="absolute inset-x-0 -top-[3px] z-10 h-1.5 cursor-row-resize hover:bg-[#ff5e1a]/30"
      />
      {onCollapse && (
        <button
          type="button"
          onClick={onCollapse}
          aria-label="收起下方面板"
          title="收起下方面板"
          className="absolute right-3 top-2 z-10 grid size-7 place-items-center rounded-lg text-[#9a9bb0] transition hover:bg-[#ececf1] hover:text-[#1a1a2e]"
        >
          <ChevronDown className="size-4" />
        </button>
      )}
      <div className="min-w-0 flex-1 overflow-y-auto pr-2">
        <p className="mb-2 flex items-center gap-2 text-[12px] font-semibold text-[#9a9bb0]">
          这一屏 · {crumb(step)}
          {/* 异常分支的步骤:标题旁一个浅红小标,和左栏的异常卡片同色 */}
          {title?.group.includes("异常") && (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#ffd9d2] bg-[#fff5f3] px-2 py-[1px] text-[11px] font-semibold text-[#d13d2a]">
              <TriangleAlert className="size-3" /> 异常分支
            </span>
          )}
        </p>
        <div className="space-y-3">
          {SECTIONS.map(({ key, label, mono, warn }) => {
            const items = note[key] ?? [];
            if (!items.length) return null;
            return (
              <div key={key}>
                <p className={`mb-1 text-[12px] font-semibold ${warn ? "text-[#d24f14]" : "text-[#4a4b5c]"}`}>{label}</p>
                <ul
                  className={`list-disc space-y-1.5 pl-4 leading-relaxed ${
                    warn ? "text-[13px] text-[#d24f14]" : mono ? "font-mono text-[12px] text-[#4a4b5c]" : "text-[13px] text-[#1a1a2e]"
                  }`}
                >
                  {items.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
      <div className="w-[260px] shrink-0 overflow-y-auto border-l border-[#ececf1] pl-6">
        <p className="mb-1 text-[12px] font-semibold text-[#9a9bb0]">状态</p>
        {seg<CreationType>(
          "创作类型",
          opts.creationType,
          [["hybrid", "Hybrid"], ["marketing", "Agent"], ["image", "图片"], ["video", "视频"]],
          (creationType) => onOpts({ ...opts, creationType }),
          !LANDING_STEPS.includes(step),
          "只对落地页步骤生效",
        )}
        {seg("回复语言", opts.lang, [["zh", "中文"], ["en", "English"]], (lang) => onOpts({ ...opts, lang }))}
        {toggle("旁白", opts.voiceover, (voiceover) => onOpts({ ...opts, voiceover }))}
        {seg<"recorded" | 0>("AI 补拍镜头", opts.aiShots, [["recorded", "按录制"], [0, "0"]], (aiShots) => onOpts({ ...opts, aiShots }))}
        {toggle("分析失败", opts.failAnalyze, (failAnalyze) => onOpts({ ...opts, failAnalyze }), editorStep, agentOnly)}
        {toggle("分镜失败", opts.failOutline, (failOutline) => onOpts({ ...opts, failOutline }), editorStep, agentOnly)}
        {toggle("视频加载失败", opts.failVideo, (failVideo) => onOpts({ ...opts, failVideo }))}
        {toggle("积分不足", opts.noCredits, (noCredits) => onOpts({ ...opts, noCredits }))}
        {/* 五档放不下一行:标签单独一行,选项换行排 */}
        <div className={`py-0.5 text-[13px] ${editorStep ? "pointer-events-none opacity-40" : ""}`} title={editorStep ? agentOnly : undefined}>
          生成失败(Agent)
          <span className="mt-1 flex flex-wrap gap-1">
            {AGENT_FAILS.map(([v, l]) => (
              <button
                key={v}
                type="button"
                onClick={() => onOpts({ ...opts, agentFail: v })}
                aria-pressed={opts.agentFail === v}
                className={`rounded-full border px-2.5 py-0.5 text-[12px] ${opts.agentFail === v ? "border-[#1a1a2e] bg-[#1a1a2e] text-white" : "border-[#ececf1] bg-white text-[#4a4b5c]"}`}
              >
                {l}
              </button>
            ))}
          </span>
        </div>
        {toggle("剪辑失败", opts.failEdit, (failEdit) => onOpts({ ...opts, failEdit }), editorStep, agentOnly)}
        {toggle("旁白超长", opts.longScript, (longScript) => onOpts({ ...opts, longScript }), editorStep, agentOnly)}
        {toggle("发送失败", opts.failSend, (failSend) => onOpts({ ...opts, failSend }), editorStep, agentOnly)}
        {toggle("补拍生成失败", opts.failShot, (failShot) => onOpts({ ...opts, failShot }), !editorStep, "只对剪辑器步骤生效")}
      </div>
      <div className="w-[180px] shrink-0 border-l border-[#ececf1] pl-6">
        <p className="mb-2 text-[12px] font-semibold text-[#9a9bb0]">模拟事件</p>
        <div className="flex flex-col items-start gap-2">
          <button type="button" onClick={onReplay} className="inline-flex items-center gap-1 rounded-full border border-[#ececf1] bg-white px-3 py-1.5 text-[12.5px]">
            <RotateCcw className="size-3.5" /> 重放这一步
          </button>
          <button
            type="button"
            disabled={editorStep || !generating}
            title={editorStep ? agentOnly : generating ? undefined : "生成中才能用"}
            onClick={onSendWhileGenerating}
            className="rounded-full border border-[#ececf1] bg-white px-3 py-1.5 text-[12.5px] disabled:opacity-40"
          >
            生成中发一句话
          </button>
        </div>
      </div>
    </section>
  );
}

/** 下方面板收起后:底部一条细栏,写着这一屏是哪一步,点了展开 */
export function PanelStrip({ step, onExpand }: { step: StepId; onExpand: () => void }) {
  return (
    <button
      type="button"
      onClick={onExpand}
      aria-label="展开下方面板"
      className="flex h-8 shrink-0 items-center gap-2 border-t border-[#ececf1] bg-[#fafafb] px-6 text-left text-[12px] font-semibold text-[#9a9bb0] transition hover:text-[#1a1a2e]"
    >
      <ChevronUp className="size-4" />
      展开需求说明 · {crumb(step)}
    </button>
  );
}

export function ExpandStrip({ onExpand }: { onExpand: () => void }) {
  return (
    <button
      type="button"
      onClick={onExpand}
      aria-label="展开评审面板"
      className="fixed left-0 top-1/2 z-50 grid h-24 w-7 -translate-y-1/2 place-items-center rounded-r-xl bg-[#1a1a2e] text-white shadow-lg"
    >
      <ChevronRight className="size-4" />
    </button>
  );
}
