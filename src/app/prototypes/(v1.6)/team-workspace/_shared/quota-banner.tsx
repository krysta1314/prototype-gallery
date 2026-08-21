"use client";

import { AlertTriangle, Gauge } from "lucide-react";
import { useTeam } from "./team-context";
import type { QuotaAction } from "./team-context";

/**
 * 常驻额度横幅 —— 评审第三节。
 * 之前 80% / 100% 只体现在顶栏那个积分小胶囊的颜色上,走查时几乎看不见;
 * 而这正是用户购买意愿最高的一刻,所以给它一条占位置的常驻横幅。
 *
 * 文案严格区分「团队池」和「你的个人上限」——两者该找的人和解法完全不同。
 */
export function QuotaBanner({ className = "" }: { className?: string }) {
  const { quotaState, runQuotaAction, isPersonal, isExpired } = useTeam();

  if (quotaState.level === "ok") return null;

  const blocked = quotaState.level === "blocked";
  const isPool = quotaState.source === "pool";

  const tone = blocked
    ? {
      wrap: "border-[#f3b7a6] bg-[#fff5f1]",
      icon: "text-[#c9432a]",
      title: "text-[#a5331d]",
      body: "text-[#8d5344]",
      cta: "bg-[#c9432a] text-white hover:bg-[#ad361f]",
      chip: "bg-[#fbdcd3] text-[#a5331d]",
    }
    : {
      wrap: "border-[#f0cf9e] bg-[#fffaf1]",
      icon: "text-[#b06a1c]",
      title: "text-[#8f5514]",
      body: "text-[#8a6a41]",
      cta: "bg-[#b06a1c] text-white hover:bg-[#955915]",
      chip: "bg-[#fbeacc] text-[#8f5514]",
    };

  const Icon = blocked ? AlertTriangle : Gauge;

  const run = (action: QuotaAction) => runQuotaAction(action);

  return (
    <div
      role={blocked ? "alert" : "status"}
      className={`flex flex-wrap items-start gap-x-4 gap-y-3 rounded-2xl border px-4 py-3.5 ${tone.wrap} ${className}`}
    >
      <Icon className={`mt-0.5 size-[18px] shrink-0 ${tone.icon}`} />
      <div className="min-w-[240px] flex-1">
        <p className="flex flex-wrap items-center gap-2">
          <span className={`text-[13.5px] font-bold tracking-[-0.01em] ${tone.title}`}>{quotaState.title}</span>
          {/*
            * 让「是团队的问题还是我的问题」在一眼之内可辨。
            * 终止是订阅问题,既不是池也不是我的席位 —— 所以单独一个徽章。
            */}
          {!isPersonal && (
            <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tone.chip}`}>
              {isExpired ? "No plan" : isPool ? "Team pool" : "Your limit"}
            </span>
          )}
        </p>
        <p className={`mt-1 text-[12.5px] leading-[1.5] ${tone.body}`}>{quotaState.body}</p>
      </div>
      {quotaState.cta && (
        <button
          type="button"
          onClick={() => run(quotaState.cta!.action)}
          className={`h-9 shrink-0 rounded-xl px-4 text-[12.5px] font-bold transition ${tone.cta}`}
        >
          {quotaState.cta.label}
        </button>
      )}
    </div>
  );
}
