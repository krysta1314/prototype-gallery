"use client";

import { useMemo, useState } from "react";
import { formatNumber } from "./data";
import type { UsageSeries } from "./usage-series";

/**
 * 堆叠面积图 —— 自绘 SVG,不引图表库。
 * 交互:鼠标横向移动出十字线 + 当日各序列读数。默认态就是完整的图,
 * 没有任何「滚到才出现」的入场动画,所以在无头渲染和后台标签页里也照样画得出来。
 */
export function StackedAreaChart({
  labels,
  series,
  height = 190,
  unit = "credits",
}: {
  labels: string[];
  series: UsageSeries[];
  height?: number;
  unit?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const width = 1000; // viewBox 宽,实际按容器缩放
  const padY = 10;

  const { stacks, max, ticks } = useMemo(() => {
    const totals = labels.map((_, index) => series.reduce((sum, item) => sum + (item.points[index] ?? 0), 0));
    const peak = Math.max(1, ...totals);
    const step = Math.pow(10, Math.floor(Math.log10(peak)));
    const niceMax = Math.ceil(peak / step) * step;
    // 每条序列的累积上沿
    let running = labels.map(() => 0);
    const built = series.map((item) => {
      const lower = running;
      const upper = labels.map((_, index) => lower[index]! + (item.points[index] ?? 0));
      running = upper;
      return { ...item, lower, upper };
    });
    return {
      stacks: built,
      max: niceMax,
      ticks: [0, niceMax / 2, niceMax],
    };
  }, [labels, series]);

  const x = (index: number) => (labels.length === 1 ? 0 : (index / (labels.length - 1)) * width);
  const y = (value: number) => padY + (1 - value / max) * (height - padY * 2);

  const areaPath = (lower: number[], upper: number[]) => {
    const top = upper.map((value, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(1)},${y(value).toFixed(1)}`);
    const bottom = [...lower]
      .map((value, index) => ({ value, index }))
      .reverse()
      .map(({ value, index }) => `L${x(index).toFixed(1)},${y(value).toFixed(1)}`);
    return `${top.join("")}${bottom.join("")}Z`;
  };

  const linePath = (upper: number[]) =>
    upper.map((value, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(1)},${y(value).toFixed(1)}`).join("");

  const onMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    setHover(Math.max(0, Math.min(labels.length - 1, Math.round(ratio * (labels.length - 1)))));
  };

  const hoverTotal = hover === null ? 0 : series.reduce((sum, item) => sum + (item.points[hover] ?? 0), 0);

  return (
    <div className="relative">
      <div className="flex gap-3">
        {/* y 轴刻度 */}
        <div className="relative w-10 shrink-0" style={{ height }}>
          {ticks
            .slice()
            .reverse()
            .map((tick) => (
              <span
                key={tick}
                className="absolute right-0 -translate-y-1/2 text-[11px] tabular-nums text-[#9a94a0]"
                style={{ top: y(tick) }}
              >
                {tick >= 1000 ? `${Math.round(tick / 1000)}k` : Math.round(tick)}
              </span>
            ))}
        </div>

        <div className="min-w-0 flex-1">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
            className="block w-full touch-none"
            style={{ height }}
            role="img"
            aria-label={`Stacked usage over ${labels.length} days, ${formatNumber(
              series.reduce((sum, item) => sum + item.total, 0),
            )} ${unit} total`}
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
          >
            {ticks.map((tick) => (
              <line
                key={tick}
                x1={0}
                x2={width}
                y1={y(tick)}
                y2={y(tick)}
                stroke="#f0eef2"
                strokeWidth={1}
                strokeDasharray={tick === 0 ? undefined : "4 6"}
                vectorEffect="non-scaling-stroke"
              />
            ))}

            {stacks.map((item) => (
              <g key={item.key}>
                <path d={areaPath(item.lower, item.upper)} fill={item.color} fillOpacity={0.32} />
                <path
                  d={linePath(item.upper)}
                  fill="none"
                  stroke={item.color}
                  strokeWidth={1.75}
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            ))}

            {hover !== null && (
              <line
                x1={x(hover)}
                x2={x(hover)}
                y1={padY}
                y2={height - padY}
                stroke="#28222e"
                strokeWidth={1}
                strokeDasharray="3 3"
                vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>

          <div className="mt-1.5 flex justify-between text-[11px] tabular-nums text-[#9a94a0]">
            <span>{labels[0]}</span>
            <span className="hidden sm:inline">{labels[Math.floor(labels.length / 2)]}</span>
            <span>{labels[labels.length - 1]}</span>
          </div>
        </div>
      </div>

      {/* 悬停读数 —— 放在图下方,不遮内容 */}
      {hover !== null && (
        <div className="mt-3 rounded-xl border border-[#ececf1] bg-white px-3.5 py-2.5 shadow-[0_10px_30px_rgba(26,26,46,0.1)]">
          <p className="flex items-baseline justify-between gap-3 text-[12px]">
            <span className="font-bold text-[#28222e]">{labels[hover]}</span>
            <span className="font-semibold tabular-nums text-[#7b7480]">
              {formatNumber(hoverTotal)} {unit}
            </span>
          </p>
          <div className="mt-1.5 grid gap-x-4 gap-y-1 sm:grid-cols-2">
            {series
              .map((item) => ({ item, value: item.points[hover] ?? 0 }))
              .sort((a, b) => b.value - a.value)
              .slice(0, 6)
              .map(({ item, value }) => (
                <span key={item.key} className="flex items-center gap-1.5 text-[11.5px] text-[#56505c]">
                  <span aria-hidden="true" className="size-2 shrink-0 rounded-sm" style={{ background: item.color }} />
                  <span className="min-w-0 flex-1 truncate">{item.key}</span>
                  <span className="tabular-nums font-semibold text-[#3b3442]">{formatNumber(value)}</span>
                </span>
              ))}
          </div>
        </div>
      )}

      {/* 图例 */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {series.map((item) => (
          <span key={item.key} className="flex items-center gap-1.5 text-[11.5px] text-[#56505c]">
            <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ background: item.color }} />
            {item.key}
            <span className="tabular-nums text-[#9a94a0]">{formatNumber(item.total)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
