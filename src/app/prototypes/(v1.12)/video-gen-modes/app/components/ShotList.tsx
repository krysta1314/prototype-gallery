"use client";

/* Kling 的 Multi-shot:提示词框变成分镜列表，每段一句提示词 + 时长;总时长 = 各段之和。 */

import { GripVertical, Plus, X } from "lucide-react";
import { useState } from "react";
import { newId } from "../assets";
import type { Shot } from "../state";

export function ShotList({ shots, onChange, shotMax }: { shots: Shot[]; onChange: (s: Shot[]) => void; shotMax: number }) {
  const [drag, setDrag] = useState<number | null>(null);
  const set = (i: number, p: Partial<Shot>) => onChange(shots.map((x, j) => (j === i ? { ...x, ...p } : x)));
  return (
    <div className="space-y-1.5">
      {shots.map((s, i) => (
        <div
          key={s.id}
          draggable
          onDragStart={() => setDrag(i)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            if (drag === null || drag === i) return;
            const next = [...shots];
            const [m] = next.splice(drag, 1);
            next.splice(i, 0, m);
            onChange(next);
            setDrag(null);
          }}
          className="group flex items-center gap-2 rounded-xl border border-[#ececf1] bg-[#fcfbfd] px-2 py-1.5"
        >
          <GripVertical className="size-4 shrink-0 cursor-grab text-[#c9c8d3]" aria-hidden />
          <span className="w-12 shrink-0 text-[11.5px] font-semibold text-[#a0a1aa]">Shot {i + 1}</span>
          <input
            value={s.prompt}
            onChange={(e) => set(i, { prompt: e.target.value })}
            placeholder="What happens in this shot"
            aria-label={`Shot ${i + 1} prompt`}
            className="min-w-0 flex-1 bg-transparent text-[14px] text-[#1a1a2e] outline-none placeholder:text-[#b5b6c2]"
          />
          <label className="flex shrink-0 items-center gap-1 text-[12px] text-[#6a6b7b]">
            <input
              type="number"
              min={1}
              max={shotMax}
              value={s.secs}
              onChange={(e) => set(i, { secs: Math.max(0, Number(e.target.value) || 0) })}
              aria-label={`Shot ${i + 1} length in seconds`}
              className="w-11 rounded-md border border-[#ececf1] bg-white px-1.5 py-0.5 text-right tabular-nums outline-none focus:border-[#ff5e1a]"
            />
            s
          </label>
          <button
            type="button"
            aria-label={`Remove shot ${i + 1}`}
            disabled={shots.length <= 1}
            onClick={() => onChange(shots.filter((x) => x.id !== s.id))}
            className="grid size-6 shrink-0 place-items-center rounded-full text-[#b5b6c2] transition hover:bg-white hover:text-[#1a1a2e] disabled:invisible"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...shots, { id: newId("s"), prompt: "", secs: 3 }])}
        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12.5px] font-semibold text-[#ff5e1a] transition hover:bg-[#fff3ec]"
      >
        <Plus className="size-3.5" /> Add shot
      </button>
    </div>
  );
}

export const firstShots = (prompt: string): Shot[] => [
  { id: newId("s"), prompt, secs: 3 },
  { id: newId("s"), prompt: "", secs: 3 },
];
