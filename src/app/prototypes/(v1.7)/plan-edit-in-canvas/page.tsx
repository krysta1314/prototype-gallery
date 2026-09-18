"use client";

/* Generation plan 卡片 · Edit in canvas 入口
   需求:agent 给出生成计划后,用户想先手动调某一条 phase,而不是直接让 agent 跑。
   本原型只覆盖「入口长什么样」—— 不做移除 phase、不联动积分合计、不画 canvas 那一侧。 */

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Image as ImageIcon,
  Layers,
  Frame,
  Play,
  X,
} from "lucide-react";
import { useToast } from "../blog/toast";

const APPLE_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif';
const ctaGrad = "bg-gradient-to-r from-[#FFA73C] to-[#FF5255]";

/* ---------- 数据 ---------- */

type Phase = {
  id: string;
  title: string;
  prompt: string;
  model: string;
  ratio: string;
  credits: number;
  refs: string[];
};

const REF_A = "https://assets.presslogic.com/buzzvideo/public/2026-07-30/341142771702226944.png";
const REF_B = "https://assets.presslogic.com/buzzvideo/public/2026-07-30/341144290052857856.png";

const PHASES: Phase[] = [
  {
    id: "p1",
    title: "Phase 1: Tease — Macro Texture Conflict",
    prompt:
      "Extreme macro shot of the lipstick bullet, cracked matte surface against a glossy droplet. Hard rim light, deep shadow, no model in frame. Editorial beauty campaign, shot on 100mm macro.",
    model: "GPT-image-2",
    ratio: "4:5",
    credits: 183,
    refs: [REF_A, REF_B],
  },
  {
    id: "p2",
    title: "Phase 2: Reveal — Product & Model Hero",
    prompt:
      "Half-body portrait of the model holding the product at chin level, direct eye contact, soft key light with warm bounce. Product label fully legible. Clean neutral backdrop.",
    model: "GPT-image-2",
    ratio: "4:5",
    credits: 183,
    refs: [REF_A, REF_B],
  },
  {
    id: "p3",
    title: "Phase 3: Convert — Swatch & Offer Layout",
    prompt:
      "Flat-lay of four shade swatches arranged in a row with the product beside them, generous negative space on the right for offer copy. Top-down, even soft light.",
    model: "GPT-image-2",
    ratio: "4:5",
    credits: 183,
    refs: [REF_A, REF_B],
  },
];

const TOTAL = PHASES.reduce((sum, p) => sum + p.credits, 0);

/* ---------- 小部件 ---------- */

function CreditIcon() {
  return (
    <span className="inline-flex size-[15px] items-center justify-center rounded-full bg-[#ff5e1a] text-[10px] font-black leading-none text-white">
      ✦
    </span>
  );
}

function Thumb({ src }: { src: string }) {
  return (
    <span className="block size-7 overflow-hidden rounded-md border border-[#ececf1] bg-[#faf8f6]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="size-full object-cover" />
    </span>
  );
}

/** 「Edit in canvas」按钮本体 —— 两种摆位共用同一颗按钮,只是挂载点不同 */
function EditInCanvasButton({
  onClick,
  compact = false,
}: {
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "group inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#ececf1] bg-white font-semibold text-[#6a6b7b] " +
        "transition hover:border-[#ff5e1a] hover:bg-[#fff7f1] hover:text-[#ff5e1a] " +
        "focus-visible:border-[#ff5e1a] focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/20 focus-visible:outline-none " +
        (compact ? "px-2 py-1 text-[12px]" : "px-2.5 py-1.5 text-[12.5px]")
      }
    >
      <Frame className="size-3.5 transition group-hover:scale-110" />
      Edit in canvas
    </button>
  );
}

/* ---------- Phase 行 ---------- */

function PhaseRow({
  phase,
  placement,
  onEdit,
}: {
  phase: Phase;
  placement: "params" | "header";
  onEdit: (p: Phase) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-[#ececf1] bg-white p-3.5 transition hover:border-[#d4d3df]">
      {/* 标题行 */}
      <div className="flex items-start gap-2">
        <ImageIcon className="mt-[2px] size-4 shrink-0 text-[#9a9bab]" />
        <p className="flex-1 text-[14px] font-bold text-[#1a1a2e]">{phase.title}</p>
        {placement === "header" && (
          <EditInCanvasButton compact onClick={() => onEdit(phase)} />
        )}
        <span className="inline-flex shrink-0 items-center gap-1 text-[13px] font-bold text-[#1a1a2e] tabular-nums">
          <CreditIcon />
          {phase.credits}
        </span>
      </div>

      {/* View prompt */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-1.5 ml-6 inline-flex items-center gap-1 text-[12.5px] text-[#8d8e9d] transition hover:text-[#ff5e1a]"
      >
        {open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
        View prompt
      </button>
      {open && (
        <p className="mt-2 ml-6 rounded-lg bg-[#faf8f6] px-3 py-2.5 text-[12.5px] leading-relaxed text-[#6a6b7b]">
          {phase.prompt}
        </p>
      )}

      {/* 参数行 */}
      <div className="mt-2.5 ml-6 flex flex-wrap items-center gap-2">
        <span className="rounded-lg border border-[#ececf1] bg-white px-2.5 py-1.5 text-[12px] font-medium text-[#6a6b7b]">
          {phase.model} | {phase.ratio}
        </span>
        <span className="flex items-center gap-1.5">
          {phase.refs.map((src) => (
            <Thumb key={src} src={src} />
          ))}
        </span>
        {placement === "params" && (
          <span className="ml-auto">
            <EditInCanvasButton onClick={() => onEdit(phase)} />
          </span>
        )}
      </div>
    </div>
  );
}

/* ---------- 页面 ---------- */

export default function Page() {
  const [notify, toastNode] = useToast();
  const [placement, setPlacement] = useState<"params" | "header">("params");
  const [collapsed, setCollapsed] = useState(false);

  const handleEdit = (p: Phase) => {
    notify(`Opening “${p.title.split(":")[0]}” in canvas…`, "info");
  };

  return (
    <div style={{ fontFamily: APPLE_FONT }} className="min-h-screen bg-[#faf8f6]">
      {toastNode}

      {/* 演示控制条(中文,不属于真实产品 UI) */}
      <div className="border-b border-[#ececf1] bg-white">
        <div className="mx-auto flex max-w-[900px] flex-wrap items-center gap-3 px-6 py-3.5">
          <span className="text-[13px] font-bold text-[#1a1a2e]">演示控制</span>
          <span className="text-[13px] text-[#6a6b7b]">入口摆位:</span>
          {(
            [
              ["params", "参数行右侧(推荐)"],
              ["header", "标题行右上角"],
            ] as const
          ).map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => setPlacement(val)}
              className={
                "rounded-full px-3.5 py-1.5 text-[12.5px] font-bold transition " +
                (placement === val
                  ? `${ctaGrad} text-white shadow-[0_6px_16px_rgba(255,82,85,0.28)]`
                  : "border border-[#ececf1] bg-white text-[#6a6b7b] hover:border-[#d4d3df]")
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-[900px] px-6 py-10">
        {/* agent 的上文,给卡片一点语境 */}
        <div className="mb-4 flex gap-3">
          <span
            className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${ctaGrad} text-[13px] font-black text-white`}
          >
            B
          </span>
          <p className="max-w-[560px] rounded-2xl rounded-tl-md border border-[#ececf1] bg-white px-4 py-3 text-[14px] leading-relaxed text-[#1a1a2e]">
            Here&apos;s a three-phase plan for the lipstick launch — tease, reveal, then convert.
            Review it and confirm when you&apos;re ready.
          </p>
        </div>

        {/* Generation plan 卡片 */}
        <div className="overflow-hidden rounded-2xl border border-[#ececf1] bg-white shadow-[0_4px_16px_rgba(26,26,46,0.06)]">
          {/* 卡头 */}
          <div className="flex items-center gap-2 px-4 py-3">
            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              className="inline-flex items-center gap-2 text-[14px] font-bold text-[#1a1a2e] transition hover:text-[#ff5e1a]"
            >
              {collapsed ? (
                <ChevronRight className="size-4" />
              ) : (
                <ChevronDown className="size-4" />
              )}
              Generation plan
            </button>
            <span className="ml-auto rounded-md bg-[#fff7e3] px-2 py-1 text-[11.5px] font-bold text-[#a06a00]">
              Awaiting confirmation
            </span>
            <span className="inline-flex items-center gap-1 text-[12.5px] text-[#9a9bab]">
              <Layers className="size-3.5" />
              {PHASES.length} items
            </span>
          </div>

          {!collapsed && (
            <>
              <div className="space-y-2.5 bg-[#fcfcfd] px-3 pb-3">
                {PHASES.map((p) => (
                  <PhaseRow
                    key={p.id}
                    phase={p}
                    placement={placement}
                    onEdit={handleEdit}
                  />
                ))}
              </div>

              {/* 执行条 */}
              <div className="flex flex-wrap items-center gap-3 border-t border-[#ececf1] bg-[#faf8f6] px-4 py-3">
                <p className="text-[13px] text-[#6a6b7b]">
                  Execute this plan? It will use about{" "}
                  <span className="font-bold text-[#1a1a2e] tabular-nums">{TOTAL}</span> credits.
                </p>
                <div className="ml-auto flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => notify("Plan cancelled", "info")}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#ececf1] bg-white px-3.5 py-2 text-[13px] font-bold text-[#1a1a2e] transition hover:border-[#d4d3df]"
                  >
                    <X className="size-3.5" />
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => notify("Running the plan…", "info")}
                    className={`inline-flex items-center gap-1.5 rounded-lg ${ctaGrad} px-3.5 py-2 text-[13px] font-bold text-white shadow-[0_8px_22px_rgba(255,82,85,0.28)] transition hover:brightness-105`}
                  >
                    <Play className="size-3.5" />
                    Confirm · {TOTAL} credits
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
