"use client";

/* H3 Max Camera Control 的「Camera Move」:13 个预设(和 fal minimax/h3-max/camera-controls 的 free_camera_preset 一一对应)。
   每个选项一张小预览：画框里是一个小场景(天空 / 地面 / 人物),按这个运镜的样子动(推近、横移、摇镜、升降、旋转…),
   悬停或选中时播放;系统设置了减少动态效果时不动，只看箭头。 */

import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Minimize2, Maximize2, RotateCcw, RotateCw, Spline } from "lucide-react";
import type { ComponentType } from "react";

type Move = { from: string; to: string; mid?: string; Icon: ComponentType<{ className?: string }> };

/* 镜头往哪走，画面就往反方向动 */
const MOVES: Record<string, Move> = {
  "Dolly in": { from: "scale(1)", to: "scale(1.45)", Icon: Maximize2 },
  "Dolly out": { from: "scale(1.45)", to: "scale(1)", Icon: Minimize2 },
  "Truck left": { from: "translateX(-10%)", to: "translateX(10%)", Icon: ArrowLeft },
  "Truck right": { from: "translateX(10%)", to: "translateX(-10%)", Icon: ArrowRight },
  "Pan left": { from: "perspective(120px) rotateY(10deg) translateX(-8%)", to: "perspective(120px) rotateY(-10deg) translateX(12%)", Icon: ArrowLeft },
  "Pan right": { from: "perspective(120px) rotateY(-10deg) translateX(8%)", to: "perspective(120px) rotateY(10deg) translateX(-12%)", Icon: ArrowRight },
  "Tilt up": { from: "perspective(120px) rotateX(-10deg) translateY(-8%)", to: "perspective(120px) rotateX(10deg) translateY(12%)", Icon: ArrowUp },
  "Tilt down": { from: "perspective(120px) rotateX(10deg) translateY(8%)", to: "perspective(120px) rotateX(-10deg) translateY(-12%)", Icon: ArrowDown },
  "Pedestal up": { from: "translateY(-10%)", to: "translateY(12%)", Icon: ArrowUp },
  "Pedestal down": { from: "translateY(10%)", to: "translateY(-12%)", Icon: ArrowDown },
  "Roll left": { from: "rotate(0deg) scale(1.15)", to: "rotate(20deg) scale(1.15)", Icon: RotateCcw },
  "Roll right": { from: "rotate(0deg) scale(1.15)", to: "rotate(-20deg) scale(1.15)", Icon: RotateCw },
  "S-curve forward": { from: "scale(1) translateX(0)", mid: "scale(1.2) translateX(10%)", to: "scale(1.4) translateX(-8%)", Icon: Spline },
};

const key = (v: string) => `cm-${v.toLowerCase().replace(/[^a-z]+/g, "-")}`;

const CSS = Object.entries(MOVES)
  .map(([v, m]) => `@keyframes ${key(v)}{0%,12%{transform:${m.from}}${m.mid ? `50%{transform:${m.mid}}` : ""}88%,100%{transform:${m.to}}}`)
  .join("") +
  `.cm-tile:hover .cm-scene,.cm-tile[aria-pressed=true] .cm-scene{animation-duration:2.2s;animation-iteration-count:infinite;animation-timing-function:cubic-bezier(.45,0,.25,1);animation-direction:alternate}
@media (prefers-reduced-motion: reduce){.cm-scene{animation:none!important}}`;

/** 一个小场景：天空、地平线、一个人和一棵树(看得出镜头在怎么动) */
function Scene({ value }: { value: string }) {
  const m = MOVES[value];
  return (
    <span className="relative block h-[38px] w-full overflow-hidden rounded-md bg-[#cfe3f5]">
      <span className="cm-scene absolute -inset-[25%] block" style={{ animationName: key(value), transform: m?.from }}>
        <span className="absolute inset-x-0 bottom-0 h-[42%] bg-[#b9d9a5]" />
        <span className="absolute bottom-[38%] left-[30%] h-[22%] w-[7%] rounded-full bg-[#5a8a4a]" />
        <span className="absolute bottom-[40%] left-[56%] h-[16%] w-[6%] rounded-t-full bg-[#ff7a45]" />
        <span className="absolute bottom-[55%] left-[56.5%] size-[5%] rounded-full bg-[#ff7a45]" />
        <span className="absolute right-[24%] top-[30%] size-[8%] rounded-full bg-[#fff3b0]" />
      </span>
    </span>
  );
}

export function CameraMovePicker({ values, value, onChange }: { values: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <>
      <style>{CSS}</style>
      <div role="radiogroup" aria-label="Camera Move" className="mt-1.5 grid grid-cols-3 gap-1.5">
        {values.map((v) => {
          const on = v === value;
          const Icon = MOVES[v]?.Icon;
          return (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={on}
              aria-pressed={on}
              onClick={() => onChange(v)}
              className={`cm-tile flex flex-col gap-1 rounded-xl border p-1 text-left transition ${on ? "border-[#ff5e1a] bg-[#fff7f1]" : "border-[#ececf1] bg-white hover:border-[#d4d3df]"}`}
            >
              <Scene value={v} />
              <span className={`flex items-center gap-1 px-0.5 text-[11.5px] leading-tight ${on ? "font-semibold text-[#1a1a2e]" : "text-[#4a4b5c]"}`}>
                {Icon && <Icon className="size-3 shrink-0 text-[#9a9bb0]" />}
                {v}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
