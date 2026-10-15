"use client";

import { useEffect, useState } from "react";
import { AGENT_STATES, BuzzThinking, type AgentState } from "./BuzzThinking";

const STATE_ORDER: AgentState[] = ["thinking", "running", "waiting", "done", "stopped"];

// 对话示例里自动播一遍:思考 → 跑工具 → 完成,停一下再从头来
const CHAT_FLOW: { state: AgentState; label: string; ms: number }[] = [
  { state: "thinking", label: "Reading 4 files", ms: 3200 },
  { state: "running", label: "Generating shot 2 of 5", ms: 3200 },
  { state: "done", label: "Your reel is ready", ms: 2400 },
];

const kicker =
  "inline-block rounded-full bg-[#fff3ec] px-3.5 py-1.5 text-[13px] font-bold " +
  "uppercase tracking-[0.14em] text-[#ff5e1a]";

export default function BuzzLoaderPage() {
  const [dark, setDark] = useState(false);
  const [speed, setSpeed] = useState(1);

  const bg = dark ? "bg-[#0f0f17]" : "bg-white";
  const text = dark ? "text-white" : "text-[#1a1a2e]";
  const sub = dark ? "text-white/55" : "text-[#6b6b80]";
  const card = dark ? "border-white/10 bg-white/[0.03]" : "border-[#ececf1] bg-[#fafafc]";

  const chip = (on: boolean) =>
    `rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
      on
        ? "bg-gradient-to-r from-[#FFA73C] to-[#FF5255] text-white"
        : dark
          ? "bg-white/10 text-white/70 hover:bg-white/15"
          : "bg-[#f3f3f7] text-[#4a4a5e] hover:bg-[#ececf1]"
    }`;

  return (
    <main className={`min-h-screen ${bg} ${text} transition-colors`}>
      <div className="mx-auto max-w-5xl px-6 py-14">
        <span className={kicker}>Brand motion</span>
        <h1 className="mt-4 font-[family-name:var(--font-heading)] text-4xl font-extrabold tracking-tight">
          Buzz loading 动画
        </h1>
        <p className={`mt-3 max-w-2xl ${sub}`}>
          用 logo 里那颗四角星(原路径,形状不改)做 Agent 的状态指示,参照 Claude 对话里的 Thinking。组件见
          <code className="mx-1 rounded bg-black/5 px-1.5 py-0.5 text-[13px]">buzz-loader/BuzzThinking.tsx</code>。
        </p>

        {/* 演示控件 */}
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
          <div className="flex items-center gap-2">
            <span className={sub}>背景</span>
            <button className={chip(!dark)} onClick={() => setDark(false)}>浅</button>
            <button className={chip(dark)} onClick={() => setDark(true)}>深</button>
          </div>
          <div className="flex items-center gap-2">
            <span className={sub}>速度</span>
            {[0.5, 1, 1.5].map((s) => (
              <button key={s} className={chip(speed === s)} onClick={() => setSpeed(s)}>
                {s}×
              </button>
            ))}
          </div>
        </div>

        {/* Agent 状态:一颗星,按状态分速度 */}
        <h2 className="mt-10 text-xl font-bold">Agent 状态</h2>
        <p className={`mt-1 text-sm ${sub}`}>
          只用 logo 里那颗星,靠转多快、怎么动区分 Agent 在干什么;旁边一行状态字,进行中会有高光扫过。
        </p>
        <div className={`mt-5 divide-y rounded-2xl border ${card} ${dark ? "divide-white/10" : "divide-[#ececf1]"}`}>
          {STATE_ORDER.map((st) => {
            const c = AGENT_STATES[st];
            return (
              <div key={st} className="grid items-center gap-x-6 gap-y-2 px-6 py-5 md:grid-cols-[220px_90px_1fr]">
                <BuzzThinking state={st} size={17} speed={speed} baseColor={dark ? "#9a9aab" : "#8a8a9c"} />
                <div className="text-sm font-semibold">
                  {c.zh} <span className={`font-mono text-xs font-normal ${sub}`}>{st}</span>
                </div>
                <p className={`text-sm ${sub}`}>{c.note}</p>
              </div>
            );
          })}
        </div>

        {/* 对话里的样子 */}
        <ChatDemo speed={speed} card={card} sub={sub} dark={dark} />

        <p className={`mt-12 text-xs ${sub}`}>
          系统开了「减少动态效果」时,星星和文字都停止动画,只保留静态图形和文案。
        </p>
      </div>
    </main>
  );
}

function ChatDemo({ speed, card, sub, dark }: { speed: number; card: string; sub: string; dark: boolean }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setI((n) => (n + 1) % CHAT_FLOW.length), CHAT_FLOW[i].ms / speed);
    return () => clearTimeout(t);
  }, [i, speed]);
  const f = CHAT_FLOW[i];

  return (
    <div className={`mt-5 rounded-2xl border p-6 ${card}`}>
      <div className={`mb-4 text-xs font-semibold uppercase tracking-[0.14em] ${sub}`}>在 Agent 对话里 · 自动播一遍</div>
      <div className="flex justify-end">
        <div className="max-w-sm rounded-2xl rounded-br-md bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-4 py-2.5 text-[15px] text-white">
          Make a 30s TikTok ad from these clips
        </div>
      </div>
      <div className="mt-5 pl-1">
        <BuzzThinking state={f.state} label={f.label} size={15} speed={speed} baseColor={dark ? "#9a9aab" : "#8a8a9c"} />
      </div>
    </div>
  );
}
