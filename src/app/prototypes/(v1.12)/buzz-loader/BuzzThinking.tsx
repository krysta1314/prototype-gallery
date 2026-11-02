"use client";

import { useId } from "react";

/**
 * Agent 状态指示器,参照 Claude 对话里的 Thinking:
 * logo 里的那颗四角星(原路径)+ 一行带高光扫过的状态字。
 * 只有一颗星,靠「转多快 / 怎么动」区分 Agent 状态:
 *
 * - thinking 思考中:边转边一缩一放,不紧不慢
 * - running  运行中(调工具、跑步骤):转得快,缩放幅度小,一看就是在干活
 * - waiting  等你回复 / 排队:不转,只慢慢呼吸
 * - done     完成:星星弹一下后停住
 * - stopped  已停止 / 失败:静止变灰,文字不扫光
 */
export type AgentState = "thinking" | "running" | "waiting" | "done" | "stopped";

export const AGENT_STATES: Record<AgentState, { duration: number; label: string; zh: string; note: string }> = {
  thinking: { duration: 1.8, label: "Thinking", zh: "思考中", note: "读素材、想方案。边转边一缩一放,1.8s 一圈。" },
  running: { duration: 0.8, label: "Running", zh: "运行中", note: "调工具、跑生成步骤。转得快,0.8s 一圈,缩放幅度小。" },
  waiting: { duration: 2.8, label: "Waiting for your reply", zh: "等待中", note: "等用户回答 / 排队。不转,2.8s 慢慢呼吸一次。" },
  done: { duration: 0.6, label: "Done", zh: "完成", note: "弹一下就停住,不再循环。" },
  stopped: { duration: 0, label: "Stopped", zh: "已停止", note: "用户停止或失败。星星变灰静止,文字不扫光。" },
};

// 取自 public/prototypes/buzzvideo-app/app-logo.svg 里的星星,原样引用
export const STAR_PATH =
  "M107.625 7.00037C109.102 17.8538 118.255 26.2677 129.251 26.2686C118.256 26.2696 109.104 34.6815 107.625 45.533C106.146 34.6817 96.9938 26.27 85.9993 26.2686C96.9951 26.2672 106.148 17.8535 107.625 7.00037Z";

const STAR_VIEWBOX = "84.5 5.5 46.25 41.53";

const CSS = `
.bzt { display:inline-flex; align-items:center; gap:.5em; line-height:1; }
.bzt-star { display:block; flex-shrink:0; overflow:visible; transform-origin:center; }

.bzt-thinking .bzt-star { animation:bzt-think var(--d) cubic-bezier(.65,0,.35,1) infinite; }
@keyframes bzt-think {
  0%   { transform:rotate(0)      scale(1);   }
  25%  { transform:rotate(90deg)  scale(.62); }
  50%  { transform:rotate(180deg) scale(1);   }
  75%  { transform:rotate(270deg) scale(.62); }
  100% { transform:rotate(360deg) scale(1);   }
}
.bzt-running .bzt-star { animation:bzt-run var(--d) linear infinite; }
@keyframes bzt-run {
  0%   { transform:rotate(0)      scale(1);   }
  50%  { transform:rotate(180deg) scale(.85); }
  100% { transform:rotate(360deg) scale(1);   }
}
.bzt-waiting .bzt-star { animation:bzt-wait var(--d) ease-in-out infinite; }
@keyframes bzt-wait { 0%,100% { transform:scale(.72); opacity:.55; } 50% { transform:scale(1); opacity:1; } }
.bzt-done .bzt-star { animation:bzt-done var(--d) cubic-bezier(.22,1,.36,1) 1 both; }
@keyframes bzt-done { 0% { transform:scale(.4) rotate(-90deg); } 60% { transform:scale(1.2) rotate(8deg); } 100% { transform:scale(1) rotate(0); } }

/* 文字:灰底上扫过一道橙色高光,只在进行中的状态扫 */
.bzt-label { font-weight:500; color:var(--base); }
.bzt-thinking .bzt-label, .bzt-running .bzt-label, .bzt-waiting .bzt-label {
  background:linear-gradient(90deg, var(--base) 0%, var(--base) 40%, #FF7A45 50%, var(--base) 60%, var(--base) 100%);
  background-size:250% 100%;
  -webkit-background-clip:text; background-clip:text; color:transparent;
  animation:bzt-shimmer var(--shine) linear infinite;
}
@keyframes bzt-shimmer { from { background-position:100% 0; } to { background-position:-150% 0; } }
.bzt-label-in { display:inline-block; animation:bzt-in .35s ease-out; }
@keyframes bzt-in { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:none; } }

@media (prefers-reduced-motion: reduce) {
  .bzt .bzt-star, .bzt .bzt-label, .bzt .bzt-label-in { animation:none !important; }
  .bzt .bzt-label { color:var(--base); background:none; }
}
`;

export function BuzzThinking({
  state = "thinking",
  label,
  size = 15,
  speed = 1,
  baseColor = "#8a8a9c",
  showLabel = true,
  className = "",
}: {
  state?: AgentState;
  /** 不填用该状态的默认英文文案 */
  label?: string;
  /** 字号(px),星星跟着等比缩放 */
  size?: number;
  /** 演示用倍速,产品里不用传 */
  speed?: number;
  baseColor?: string;
  showLabel?: boolean;
  className?: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const gradId = `bzt-g-${uid}`;
  const cfg = AGENT_STATES[state];
  const d = cfg.duration / speed;
  // 运行中扫光也快一点
  const shine = (state === "running" ? 1.4 : 2.2) / speed;
  const text = label ?? cfg.label;
  const settled = state === "done" || state === "stopped";

  return (
    <span
      role="status"
      aria-live="polite"
      className={`bzt bzt-${state} ${className}`}
      style={{ fontSize: size, ["--d" as string]: `${d}s`, ["--shine" as string]: `${shine}s`, ["--base" as string]: baseColor }}
    >
      <style>{CSS}</style>
      {/* key 带上状态:切到 done 时重新播一次弹出 */}
      <svg key={state} className="bzt-star" width={size * 1.25} height={size * 1.125} viewBox={STAR_VIEWBOX} aria-hidden>
        <defs>
          <linearGradient id={gradId} x1="86" y1="7" x2="129" y2="45.5" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFA73C" />
            <stop offset="0.966" stopColor="#FF5255" />
          </linearGradient>
        </defs>
        <path d={STAR_PATH} fill={state === "stopped" ? "#c4c5d0" : `url(#${gradId})`} />
      </svg>

      {showLabel && (
        <span key={text} className="bzt-label-in">
          <span className="bzt-label">{settled || /[….]$/.test(text) ? text : `${text}…`}</span>
        </span>
      )}
    </span>
  );
}
