"use client";

/* 改写卡(审核没过选「Rewrite the prompt and retry」/ 旁白稿含敏感词选「Rewrite the script and retry」后出现):
   改写前 → 改写后(等宽字体)对照;底部 Edit prompt(就地把「改写后」变成可编辑)和 Generate · N credits。
   只有点 Generate 才扣费并重跑那一项;点过之后按钮收起,卡片留作记录。样式与提问卡同一套(白底圆角边框)。 */

import { useState } from "react";
import { ArrowDown, Pencil } from "lucide-react";
import { fmtCredits } from "../logic/credits";
import type { RewriteItem } from "../logic/failure";

export function RewriteCard({
  items,
  cost,
  status,
  disabled,
  onGenerate,
}: {
  items: RewriteItem[];
  cost: number;
  /** generated = 已点 Generate;dropped = 没点、用户改了需求 */
  status?: "generated" | "dropped";
  disabled?: boolean;
  onGenerate: (texts: string[]) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [texts, setTexts] = useState(() => items.map((it) => it.after));
  const script = items.every((it) => it.shot === undefined);
  const done = status !== undefined;
  const ready = texts.every((t) => t.trim());
  return (
    <div className="overflow-hidden rounded-2xl border border-[#ececf1] bg-white">
      {items.map((it, i) => (
        <div key={it.shot ?? "script"} className="border-b border-[#f1f1f4] px-4 py-3 last:border-b-0">
          <p className="mb-2 text-[14.5px] font-semibold text-[#1a1a2e]">{it.shot !== undefined ? `Shot ${it.shot} · New prompt` : "Voiceover · New script"}</p>
          <p className="mb-1 text-[12px] font-semibold text-[#9a9bb0]">Before</p>
          <pre className="max-h-28 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-[#f6f5f8] px-3 py-2 font-mono text-[12px] leading-relaxed text-[#9a9bb0] line-through decoration-[#c9cad6]">
            {it.before}
          </pre>
          <ArrowDown className="mx-auto my-1.5 size-4 text-[#c9cad6]" aria-hidden />
          <p className="mb-1 text-[12px] font-semibold text-[#9a9bb0]">After</p>
          {editing && !done ? (
            <textarea
              value={texts[i]}
              onChange={(e) => setTexts((prev) => prev.map((t, k) => (k === i ? e.target.value : t)))}
              aria-label={it.shot !== undefined ? `Shot ${it.shot} prompt` : "Voiceover script"}
              rows={Math.min(12, Math.max(4, texts[i].split("\n").length + 2))}
              className="w-full resize-y rounded-lg border border-[#ff5e1a] bg-white px-3 py-2 font-mono text-[12px] leading-relaxed text-[#1a1a2e] outline-none"
            />
          ) : (
            <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-[#fff7f1] px-3 py-2 font-mono text-[12px] leading-relaxed text-[#1a1a2e]">
              {texts[i]}
            </pre>
          )}
        </div>
      ))}
      <div className="flex items-center justify-end gap-2 border-t border-[#f1f1f4] px-4 py-2.5">
        {done ? (
          <span className="text-[13px] text-[#9a9bb0]">{status === "generated" ? "Generated" : "Not used"}</span>
        ) : (
          <>
            {!editing && (
              <button
                type="button"
                disabled={disabled}
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#f1f1f4] px-3 py-1.5 text-[13px] font-semibold text-[#4a4b5c] transition hover:bg-[#e8e8ee] disabled:opacity-40"
              >
                <Pencil className="size-3.5" /> {script ? "Edit script" : "Edit prompt"}
              </button>
            )}
            <button
              type="button"
              disabled={disabled || !ready}
              onClick={() => onGenerate(texts)}
              className="rounded-lg bg-[#1a1a2e] px-3 py-1.5 text-[13px] font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-[#c9cad6]"
            >
              Generate · {fmtCredits(cost)} credits
            </button>
          </>
        )}
      </div>
    </div>
  );
}
