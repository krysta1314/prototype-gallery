'use client';

import { SCALES, SCALE_DISCOUNTS, type Scale } from '../../lib/pricing/pricing';

interface ScalingSliderProps {
  value: Scale;
  onChange: (s: Scale) => void;
  /** Aria-label for the slider (distinguishes between regions) */
  ariaLabel: string;
  /** Format function for each tick label. Defaults to "Nx" (e.g. "2x"). */
  tickFormat?: (s: Scale) => string;
  /** 自定义每档 discount chip 文案;返回 null 表示该档不显示 chip。默认用 SCALE_DISCOUNTS */
  chipFormat?: (s: Scale) => string | null;
}

export function ScalingSlider({ value, onChange, ariaLabel, tickFormat, chipFormat }: ScalingSliderProps) {
  const formatTick = tickFormat ?? ((s: Scale) => `${s}x`);
  const formatChip = chipFormat ?? ((s: Scale) => {
    // Fallback:用 monthly bulk discount(只在父组件没传 chipFormat 时用)
    const d = SCALE_DISCOUNTS.monthly[s];
    return d > 0 ? `${Math.round(d * 100)}% OFF` : null;
  });
  const idx = SCALES.indexOf(value);
  return (
    <div className="text-xs">
      {/* Discount badges, positioned above each non-1x tick. Edge chips anchor to edges to avoid overflow. */}
      <div className="relative w-full h-[18px] mb-1">
        {SCALES.map((s, i) => {
          const chipText = formatChip(s);
          if (!chipText) return null;
          const pct = (i / (SCALES.length - 1)) * 100;
          const isLast = pct === 100;
          const isFirst = pct === 0;
          const positionStyle: React.CSSProperties = isLast
            ? { right: 0 }
            : isFirst
            ? { left: 0 }
            : { left: `${pct}%`, transform: 'translateX(-50%)' };
          return (
            <span
              key={s}
              style={{
                ...positionStyle,
                background: 'linear-gradient(135deg, #ff0051 0%, #ff3577 100%)',
              }}
              className="absolute top-0 text-[9px] font-bold text-white rounded px-1.5 py-px leading-tight whitespace-nowrap tracking-wide"
            >
              {chipText}
            </span>
          );
        })}
      </div>
      <input
        type="range"
        min={0}
        max={SCALES.length - 1}
        step={1}
        value={idx}
        aria-label={ariaLabel}
        aria-valuetext={`${value}x credits, ${Math.round(SCALE_DISCOUNTS.monthly[value] * 100)}% bulk discount`}
        onChange={(e) => onChange(SCALES[Number(e.target.value)])}
        className="w-full h-1 rounded-full bg-neutral-200 appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-[18px] [&::-webkit-slider-thumb]:h-[18px]
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#0a0a0a]
          [&::-webkit-slider-thumb]:cursor-pointer
          [&::-webkit-slider-thumb]:shadow-[0_0_0_3px_#fff,0_0_0_4px_#e5e5e5]
          [&::-moz-range-thumb]:w-[18px] [&::-moz-range-thumb]:h-[18px]
          [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#0a0a0a]
          [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-white"
      />
      <div className="flex justify-between text-[10px] text-neutral-400 mt-1.5">
        {SCALES.map(s => (
          <span key={s} className={s === value ? 'font-bold text-[#0a0a0a]' : ''}>{formatTick(s)}</span>
        ))}
      </div>
    </div>
  );
}
