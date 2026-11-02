"use client";

/* 全屏编辑里的生成设置(配音 / 音乐 / AI 补拍 / 图片)统一用这个居中的输入框:
   上面是参考素材,中间是 Prompt,底部一条参数栏 —— 模型、参数小胶囊(点开浮层改细项)、积分、圆形生成按钮。
   画布上点节点出的右侧 Settings 面板不走这里 */

import { useEffect, useRef, useState } from "react";
import { ArrowUp, ChevronDown, Loader2, SlidersHorizontal, Trash2, X } from "lucide-react";
import { Tip } from "./tip";

export function ComposerShell({
  title,
  onDelete,
  onClose,
  refs,
  prompt,
  model,
  params,
  note,
  cost,
  busy,
  progress,
  canGenerate,
  cta,
  onGenerate,
}: {
  /** 左上角一行小标题:这是哪个节点 */
  title: string;
  onDelete: () => void;
  onClose: () => void;
  /** 参考素材一行(没有就不显示) */
  refs?: React.ReactNode;
  /** Prompt 输入区 */
  prompt: React.ReactNode;
  /** 底部栏最左边的模型下拉 */
  model?: React.ReactNode;
  /** 参数小胶囊:summary 显示当前参数,点开浮层里是完整的细项 */
  params?: { summary: string; content: React.ReactNode };
  /** 生成按钮左边的一行提示(比如缺 Prompt) */
  note?: React.ReactNode;
  cost: number;
  busy: boolean;
  progress?: number;
  canGenerate: boolean;
  /** 生成按钮的名字(悬停提示 / 读屏):Generate Video / Regenerate … */
  cta: string;
  onGenerate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    /* 点浮层外面收起;浮层里的下拉菜单、音色弹窗挂在 body 上,不算外面 */
    const off = (e: PointerEvent) => {
      const t = e.target as Element;
      if (wrapRef.current?.contains(t) || t.closest?.('[role="listbox"],[role="menu"],[role="dialog"]')) return;
      setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      setOpen(false);
    };
    document.addEventListener("pointerdown", off, true);
    window.addEventListener("keydown", esc, true);
    return () => {
      document.removeEventListener("pointerdown", off, true);
      window.removeEventListener("keydown", esc, true);
    };
  }, [open]);

  return (
    <section
      data-guide-panel
      data-nodrag
      aria-label={title}
      onPointerDown={(e) => e.stopPropagation()}
      className="flex max-h-full w-full flex-col rounded-2xl border border-[#ececf1] bg-white text-[#1a1a2e] shadow-[0_24px_60px_rgba(26,26,46,0.22)]"
    >
      <header className="flex items-center gap-1 px-4 pt-3">
        <h3 className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[#4a4b5c]">{title}</h3>
        <Tip label="Delete node" side="bottom">
          <button type="button" aria-label="Delete node" onClick={onDelete} className="grid size-8 place-items-center rounded-lg text-[#6a6b7b] transition hover:bg-[#f3f4f6] hover:text-[#d0342c]">
            <Trash2 className="size-4" />
          </button>
        </Tip>
        <Tip label="Close" side="bottom" align="end">
          <button type="button" aria-label="Close settings" onClick={onClose} className="grid size-8 place-items-center rounded-lg text-[#6a6b7b] transition hover:bg-[#f3f4f6] hover:text-[#1a1a2e]">
            <X className="size-4" />
          </button>
        </Tip>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-2 [scrollbar-width:none]">
        {refs && <div className="mb-3 mt-1">{refs}</div>}
        {prompt}
      </div>

      {/* 底部参数栏 */}
      <div ref={wrapRef} className="relative flex flex-wrap items-center gap-2 border-t border-[#f0f1f4] px-3 py-2.5">
        {model}
        {params && (
          <button
            type="button"
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className={`flex h-8 max-w-[60%] items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium transition ${open ? "bg-[#f3f4f6] text-[#1a1a2e]" : "text-[#4a4b5c] hover:bg-[#f3f4f6]"}`}
          >
            <SlidersHorizontal className="size-3.5 shrink-0" />
            <span className="truncate tabular-nums">{params.summary}</span>
            <ChevronDown className={`size-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        )}
        <span className="ml-auto flex items-center gap-3">
          {note && <span className="text-[12px] text-[#b45309]">{note}</span>}
          {busy ? (
            <span className="text-[12.5px] font-medium tabular-nums text-[#6a6b7b]">Generating… {progress ?? 0}%</span>
          ) : (
            cost > 0 && (
              <span className="flex items-center gap-1 text-[12.5px] font-medium tabular-nums text-[#6a6b7b]">
                <span className="size-2 rounded-full bg-[#ff7a36]" /> {cost}
              </span>
            )
          )}
          <Tip label={cta} side="top" align="end">
            <button
              type="button"
              aria-label={cta}
              disabled={busy || !canGenerate}
              onClick={() => {
                /* 提交后收起输入框;进度在时间线 / 封面格 / 画布节点上看 */
                onGenerate();
                onClose();
              }}
              className="grid size-9 place-items-center rounded-full bg-gradient-to-r from-[#FFA73C] to-[#FF5255] text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" strokeWidth={2.5} />}
            </button>
          </Tip>
        </span>
        {/* 参数浮层:往上开,盖在输入框上 */}
        {params && open && (
          <div role="dialog" aria-label="Settings" className="absolute bottom-[calc(100%+6px)] left-3 z-10 max-h-[min(440px,60vh)] w-[320px] space-y-5 overflow-y-auto rounded-xl bg-white p-4 shadow-[0_12px_32px_rgba(26,26,46,0.18),0_0_0_1px_rgba(26,26,46,0.07)] [scrollbar-width:none]">
            {params.content}
          </div>
        )}
      </div>
    </section>
  );
}
