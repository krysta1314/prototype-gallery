"use client";

import { AppIconTile } from "./AppIcon";

/**
 * 灵动岛。平时是一颗黑色胶囊;在桌面上且有视频正在生成时,展开成 Live Activity:
 * 左边 App 图标,右边橙色进度环 —— 演示「退出 APP 也能看到生成进度」。
 */
export default function DynamicIsland({
  activity,
  onPress,
}: {
  activity: { progress: number } | null;
  onPress?: () => void;
}) {
  const R = 8;
  const C = 2 * Math.PI * R;
  const on = !!activity;
  return (
    <button
      type="button"
      onClick={on ? onPress : undefined}
      aria-label={
        on
          ? `Video generating in BuzzVideo AI, ${Math.round((activity?.progress ?? 0) * 100)}%`
          : undefined
      }
      tabIndex={on ? 0 : -1}
      className="absolute left-1/2 top-[11px] z-50 flex h-[37px] -translate-x-1/2 items-center justify-between overflow-hidden rounded-full bg-black px-[9px] transition-[width] duration-500"
      style={{
        width: on ? 180 : 126,
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        cursor: on ? "pointer" : "default",
      }}
    >
      <span
        className={`flex items-center gap-[6px] transition-opacity duration-300 ${on ? "opacity-100 delay-200" : "opacity-0"}`}
      >
        <AppIconTile size={22} glass={false} />
      </span>
      <span
        className={`flex items-center gap-[6px] transition-opacity duration-300 ${on ? "opacity-100 delay-200" : "opacity-0"}`}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          aria-hidden
          className="-rotate-90"
        >
          <circle
            cx="10"
            cy="10"
            r={R}
            fill="none"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="2.5"
          />
          <circle
            cx="10"
            cy="10"
            r={R}
            fill="none"
            stroke="#ff5e1a"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - (activity?.progress ?? 0))}
            style={{ transition: "stroke-dashoffset 250ms linear" }}
          />
        </svg>
      </span>
    </button>
  );
}
