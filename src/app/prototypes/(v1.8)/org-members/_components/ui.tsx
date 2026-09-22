"use client";

import type { ReactNode } from "react";
import { bucketize, fmt } from "../_lib/agg";

export const APPLE_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif';

/** 骨架照搬老板的稿子,橙色换成 Buzz 橙,状态语义色沿用他那套 */
export const C = {
  brand: "#ff5e1a",
  brandSoft: "#fff3ec",
  brandDark: "#e04a0c",
  ink: "#0F172A",
  ink2: "#475569",
  ink3: "#8494A8",
  line: "#E7ECF2",
  line2: "#F1F5F9",
  bg: "#F7F9FC",
  ok: "#12A150",
  okSoft: "#E8F7EE",
  warn: "#D97706",
  warnSoft: "#FEF6E7",
  bad: "#E5484D",
  badSoft: "#FDECEC",
  info: "#3B72F6",
  infoSoft: "#EDF2FE",
  violet: "#7C5CFC",
  violetSoft: "#F1EDFE",
} as const;

export const CARD_SHADOW =
  "0 1px 2px rgba(15,23,42,.05), 0 8px 24px -18px rgba(15,23,42,.28)";

export const MONO = 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace';

export type Tone = "ok" | "warn" | "bad" | "info" | "violet" | "mut";

const TONE: Record<Tone, { fg: string; bg: string }> = {
  ok: { fg: "#0B7A3B", bg: C.okSoft },
  warn: { fg: "#9A5B06", bg: C.warnSoft },
  bad: { fg: "#B32328", bg: C.badSoft },
  info: { fg: "#2453C4", bg: C.infoSoft },
  violet: { fg: "#5B3FD4", bg: C.violetSoft },
  mut: { fg: C.ink2, bg: C.line2 },
};

export function Tag({
  tone = "mut",
  dot,
  children,
  title,
}: {
  tone?: Tone;
  dot?: boolean;
  children: ReactNode;
  title?: string;
}) {
  const t = TONE[tone];
  return (
    <span
      title={title}
      className="inline-flex items-center gap-1 rounded-full px-2 py-[3px] text-[10.5px] font-semibold whitespace-nowrap"
      style={{ color: t.fg, background: t.bg }}
    >
      {dot && (
        <i className="h-[5px] w-[5px] rounded-full" style={{ background: t.fg }} aria-hidden />
      )}
      {children}
    </span>
  );
}

export function Card({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`rounded-xl bg-white ${className}`}
      style={{ border: `1px solid ${C.line}`, boxShadow: CARD_SHADOW, ...style }}
    >
      {children}
    </div>
  );
}

type BtnProps = {
  children: ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: "default" | "primary" | "ghost";
  size?: "md" | "sm";
  title?: string;
  disabled?: boolean;
  type?: "button" | "submit";
};

export function Btn({
  children,
  onClick,
  variant = "default",
  size = "md",
  title,
  disabled,
  type = "button",
}: BtnProps) {
  const pad = size === "sm" ? "px-2.5 py-[5px] text-[11.5px]" : "px-3 py-[7px] text-[12px]";
  const base =
    "inline-flex items-center gap-1.5 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/25";
  const style: React.CSSProperties =
    variant === "primary"
      ? { background: C.brand, color: "#fff", border: `1px solid ${C.brand}` }
      : variant === "ghost"
        ? { background: "transparent", color: C.ink2, border: `1px solid transparent` }
        : { background: "#fff", color: C.ink2, border: `1px solid ${C.line}` };
  return (
    <button
      type={type}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${pad} ${variant === "primary" ? "hover:brightness-105" : "hover:bg-[#F1F5F9]"}`}
      style={style}
    >
      {children}
    </button>
  );
}

export function Kpi({
  label,
  value,
  small,
  sub,
  accent,
}: {
  label: string;
  value: ReactNode;
  small?: ReactNode;
  sub?: ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className="rounded-xl bg-white px-3.5 py-3"
      style={{
        border: `1px solid ${accent ? "#ffd8c2" : C.line}`,
        background: accent ? C.brandSoft : "#fff",
        boxShadow: CARD_SHADOW,
      }}
    >
      <div
        className="text-[9.5px] font-bold tracking-[0.09em] uppercase"
        style={{ color: C.ink3 }}
      >
        {label}
      </div>
      <div
        className="mt-1.5 text-[21px] leading-none font-extrabold tracking-tight"
        style={{ color: accent ? C.brandDark : C.ink }}
      >
        {value}
        {small && (
          <small className="ml-1 text-[11px] font-semibold" style={{ color: C.ink3 }}>
            {small}
          </small>
        )}
      </div>
      {sub && (
        <div className="mt-2 text-[10.5px]" style={{ color: C.ink3 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

export function DeltaText({ d, invert }: { d: number | null; invert?: boolean }) {
  if (d === null || !isFinite(d))
    return <span style={{ color: C.ink3 }}>no prior data</span>;
  const up = d >= 0;
  const good = invert ? !up : up;
  return (
    <>
      <span style={{ color: good ? "#0B7A3B" : "#B32328", fontWeight: 700 }}>
        {up ? "▲" : "▼"} {Math.abs(d).toFixed(0)}%
      </span>{" "}
      <span style={{ color: C.ink3 }}>vs prev period</span>
    </>
  );
}

/** 预算进度条,配色分四档:超支 / 高 / 正常 / 低 */
export function Bar({ pct, tone }: { pct: number; tone?: "over" | "hi" | "lo" | "" }) {
  const fill =
    tone === "over" ? C.bad : tone === "hi" ? C.warn : tone === "lo" ? "#94A3B8" : C.brand;
  return (
    <div className="h-[5px] w-full overflow-hidden rounded-full" style={{ background: C.line2 }}>
      <i
        className="block h-full rounded-full transition-[width] duration-300"
        style={{ width: `${Math.min(100, pct)}%`, background: fill }}
      />
    </div>
  );
}

export function Spark({ series, target = 28 }: { series: number[]; target?: number }) {
  const buckets = bucketize(series, target);
  const mx = Math.max(...buckets, 1);
  return (
    <div className="flex h-[24px] items-end gap-[1.5px]">
      {buckets.map((v, i) => (
        <i
          key={i}
          className="w-[3px] rounded-[1px]"
          style={{
            height: Math.max(2, (v / mx) * 22),
            background: v > mx * 0.6 ? C.brand : "#CBD5E1",
          }}
        />
      ))}
    </div>
  );
}

/** 详情页的日耗柱图:橙 = 成功交付,琥珀 = 失败/放弃(仍被模型厂商计费) */
export function Chart({ series, usdPerCredit }: { series: number[]; usdPerCredit: number }) {
  const b = bucketize(series, 34);
  const mx = Math.max(...b, 1);
  return (
    <div className="flex h-[112px] items-end gap-[3px]">
      {b.map((v, i) => {
        const h = Math.max(1, (v / mx) * 100);
        const f = h * 0.11;
        return (
          <div key={i} className="group relative flex flex-1 flex-col justify-end">
            <span
              className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 rounded-md px-2 py-1 text-[10.5px] whitespace-nowrap text-white opacity-0 transition-opacity group-hover:opacity-100"
              style={{ background: C.ink }}
            >
              {fmt(Math.round(v))} cr · ${(v * usdPerCredit).toFixed(2)}
            </span>
            <i className="block w-full rounded-t-[2px]" style={{ height: f, background: "#FBBF24" }} />
            <i className="block w-full" style={{ height: h - f, background: C.brand }} />
          </div>
        );
      })}
    </div>
  );
}

export function Callout({ children }: { children: ReactNode }) {
  return (
    <div
      className="rounded-lg px-3 py-2.5 text-[11.5px] leading-[1.6]"
      style={{ background: C.brandSoft, color: "#8a3b12", border: `1px solid #ffd8c2` }}
    >
      {children}
    </div>
  );
}

export function Note({ children, amber }: { children: ReactNode; amber?: boolean }) {
  return (
    <div
      className="rounded-lg px-3 py-2.5 text-[11.5px] leading-[1.6]"
      style={{
        background: amber ? C.warnSoft : C.line2,
        color: amber ? "#8a5a08" : C.ink2,
        border: `1px solid ${amber ? "#f5e2bd" : C.line}`,
      }}
    >
      {children}
    </div>
  );
}

/** 期间切换那一排分段按钮 */
export function Seg<T extends string>({
  items,
  value,
  onChange,
}: {
  items: { k: T; label: string }[];
  value: T;
  onChange: (k: T) => void;
}) {
  return (
    <div
      className="inline-flex overflow-hidden rounded-lg p-[2px]"
      style={{ background: C.line2, border: `1px solid ${C.line}` }}
    >
      {items.map((it) => {
        const on = it.k === value;
        return (
          <button
            key={it.k}
            type="button"
            onClick={() => onChange(it.k)}
            className="rounded-md px-2.5 py-[5px] text-[11.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/25"
            style={{
              background: on ? "#fff" : "transparent",
              color: on ? C.brandDark : C.ink2,
              boxShadow: on ? "0 1px 2px rgba(15,23,42,.08)" : undefined,
            }}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

/** 筛选条里的小胶囊容器(包 select / input / 日期) */
export function Fld({ children }: { children: ReactNode }) {
  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-[5px] text-[11.5px]"
      style={{ background: "#fff", border: `1px solid ${C.line}`, color: C.ink2 }}
    >
      {children}
    </div>
  );
}

export const selectCls =
  "bg-transparent text-[11.5px] outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/25 rounded";

export const inputCls =
  "w-full rounded-lg px-2.5 py-[7px] text-[12px] outline-none focus:border-[#ff5e1a] focus:ring-2 focus:ring-[#ff5e1a]/20";

export const inputStyle: React.CSSProperties = {
  border: `1px solid ${C.line}`,
  background: "#fff",
  color: C.ink,
};

export function Avatar({
  name,
  seed,
  size = 28,
  colorOf,
}: {
  name: string;
  seed: number;
  size?: number;
  colorOf: (s: number) => string;
}) {
  const initials = name
    .replace(/[_.]/g, " ")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{
        width: size,
        height: size,
        background: colorOf(seed),
        fontSize: size * 0.36,
      }}
    >
      {initials}
    </div>
  );
}
