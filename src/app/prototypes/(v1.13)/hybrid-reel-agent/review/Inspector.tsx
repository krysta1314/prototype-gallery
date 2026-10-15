"use client";

/* 评审外壳(解说用,中文),分两块:
   - JourneyNav:左栏,只放用户旅程,点一步 = 产品跳到该状态;
   - DemoPanel:产品下方的横条,三列 —— 这一屏的需求要点 / 状态开关 / 模拟事件;顶边可拖改高度。
   两块一起收起,收起后产品铺满整屏,左边缘留一条展开按钮(ExpandStrip)。 */

import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { JOURNEYS, isEditorStep, type ReviewOpts, type StepId } from "./journeys";
import { NOTES, type StepNote } from "./notes";

export const NAV_W = 240;
/** 面板默认高度;可拖顶边改,范围 PANEL_MIN – 窗口 70% */
export const PANEL_H = 300;
export const PANEL_MIN = 160;
export const panelMax = () => Math.round(window.innerHeight * 0.7);
export const clampPanelH = (h: number) => Math.min(Math.max(h, PANEL_MIN), Math.max(PANEL_MIN, panelMax()));

/** 按旅程里的实际位置算步骤范围(如「1–15」),不写死;不连续时用「、」分段 */
function stepRange(pick: (id: StepId) => boolean) {
  const runs: [number, number][] = [];
  JOURNEYS.forEach((j, i) => {
    if (!pick(j.id)) return;
    const last = runs.at(-1);
    if (last && last[1] === i) last[1] = i + 1;
    else runs.push([i + 1, i + 1]);
  });
  return runs.map(([a, b]) => (a === b ? `${a}` : `${a}–${b}`)).join("、");
}
const AGENT_RANGE = stepRange((id) => !isEditorStep(id));
const EDITOR_RANGE = stepRange(isEditorStep);

/* 「这一屏」的小节顺序;界面文案用等宽小字,待定用橙色 */
const SECTIONS: { key: keyof StepNote; label: string; mono?: boolean; warn?: boolean }[] = [
  { key: "what", label: "需求说明" },
  { key: "rules", label: "交互规则" },
  { key: "edges", label: "边界情况" },
  { key: "errors", label: "异常处理" },
  { key: "copy", label: "界面文案", mono: true },
  { key: "open", label: "待定", warn: true },
];

export function JourneyNav({ step, onStep, onCollapse }: { step: StepId; onStep: (s: StepId) => void; onCollapse: () => void }) {
  const groups = [...new Set(JOURNEYS.map((j) => j.group))];
  return (
    <aside className="flex h-dvh shrink-0 flex-col border-r border-[#ececf1] bg-[#fafafb]" style={{ width: NAV_W }}>
      <div className="flex items-center justify-between border-b border-[#ececf1] px-4 py-3">
        <span className="text-[14px] font-semibold text-[#1a1a2e]">评审 · Hybrid Reel Agent</span>
        <button type="button" onClick={onCollapse} aria-label="收起评审面板" className="text-[#6a6b7b] hover:text-[#1a1a2e]">
          <ChevronLeft className="size-4" />
        </button>
      </div>
      <nav className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {groups.map((g) => (
          <div key={g}>
            <p className="mb-1 px-1 text-[11.5px] font-semibold text-[#9a9bb0]">{g}</p>
            {JOURNEYS.filter((j) => j.group === g).map((j) => (
              <button
                key={j.id}
                type="button"
                onClick={() => onStep(j.id)}
                aria-current={j.id === step}
                className={`block w-full rounded-lg px-2.5 py-1.5 text-left text-[13px] ${
                  j.id === step ? "bg-[#fff3ec] font-semibold text-[#d24f14]" : "text-[#1a1a2e] hover:bg-white"
                }`}
              >
                {JOURNEYS.indexOf(j) + 1}. {j.title}
              </button>
            ))}
          </div>
        ))}
      </nav>
    </aside>
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
}: {
  step: StepId;
  opts: ReviewOpts;
  onOpts: (o: ReviewOpts) => void;
  onReplay: () => void;
  generating: boolean;
  onSendWhileGenerating: () => void;
  /** 当前是剪辑器步骤:只对 Agent 生效的开关置灰,「补拍生成失败」只对剪辑器生效 */
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
  const agentOnly = `只对 Agent 步骤(${AGENT_RANGE})生效`;
  const seg = <T extends string | number>(label: string, value: T, choices: [T, string][], set: (v: T) => void) => (
    <div className="flex items-center justify-between py-0.5 text-[13px]">
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
      <div className="min-w-0 flex-1 overflow-y-auto pr-2">
        <p className="mb-2 text-[12px] font-semibold text-[#9a9bb0]">
          这一屏 · {title ? `${JOURNEYS.indexOf(title) + 1}. ${title.title}` : ""}
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
        {seg("回复语言", opts.lang, [["zh", "中文"], ["en", "English"]], (lang) => onOpts({ ...opts, lang }))}
        {toggle("旁白", opts.voiceover, (voiceover) => onOpts({ ...opts, voiceover }))}
        {seg<"recorded" | 0>("AI 补拍镜头", opts.aiShots, [["recorded", "按录制"], [0, "0"]], (aiShots) => onOpts({ ...opts, aiShots }))}
        {toggle("分析失败", opts.failAnalyze, (failAnalyze) => onOpts({ ...opts, failAnalyze }), editorStep, agentOnly)}
        {toggle("分镜失败", opts.failOutline, (failOutline) => onOpts({ ...opts, failOutline }), editorStep, agentOnly)}
        {toggle("视频加载失败", opts.failVideo, (failVideo) => onOpts({ ...opts, failVideo }))}
        {toggle("补拍生成失败", opts.failShot, (failShot) => onOpts({ ...opts, failShot }), !editorStep, `只对剪辑器步骤(${EDITOR_RANGE})生效`)}
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
