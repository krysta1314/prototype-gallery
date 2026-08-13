"use client";

import { useState } from "react";
import { HelpCircle, Coins, DollarSign } from "lucide-react";
import { AgentScene } from "./agent-scene";
import { CanvasScene } from "./canvas-scene";

const APPLE_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif';
const ctaGrad = "bg-gradient-to-r from-[#FFA73C] to-[#FF5255]";

type Tab = "agent" | "canvas";

export default function Page() {
  const [tab, setTab] = useState<Tab>("canvas");
  return (
    <div className="min-h-screen bg-[#f3f3f5]" style={{ fontFamily: APPLE_FONT }}>
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-[#ececf1] bg-white px-4 py-2.5">
        <div className="flex items-center gap-3">
          <div className={`grid size-8 place-items-center rounded-lg ${ctaGrad} text-white font-black`}>B</div>
          {/* Segmented tab */}
          <div className="ml-2 flex rounded-xl bg-[#f3f3f5] p-1">
            {(["agent", "canvas"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-lg px-4 py-1.5 text-sm font-bold capitalize transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/30 ${
                  tab === t ? "bg-white text-[#1a1a2e] shadow-sm" : "text-[#6a6b7b]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm font-semibold text-[#1a1a2e]">
          <span className="flex items-center gap-1 rounded-full bg-[#fff3ec] px-3 py-1 text-[#ff5e1a]">
            <Coins className="size-4" /> 409,288 credits
          </span>
          <button aria-label="Earn Cash" className="flex items-center gap-1 text-[#6a6b7b]"><DollarSign className="size-4" /> Earn Cash</button>
          <HelpCircle className="size-5 text-[#6a6b7b]" />
          <div className="grid size-8 place-items-center rounded-full bg-[#1a1a2e] text-xs font-bold text-white">S</div>
        </div>
      </header>

      {/* Scene */}
      <main className="relative">{tab === "agent" ? <AgentScene /> : <CanvasScene />}</main>

      {/* 演示说明(中文,非产品 UI) */}
      <p className="pointer-events-none fixed bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-4 py-1.5 text-xs text-[#6a6b7b] shadow-sm">
        切换上方 Agent / Canvas 查看两种音频生成用法
      </p>
    </div>
  );
}
