"use client";

import { useEffect, useState } from "react";

/** 本机时间,iOS 状态栏格式:12 小时制、不带 AM/PM */
export function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 5000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export const formatStatusTime = (d: Date) =>
  `${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2, "0")}`;

/** 模拟 iOS 状态栏:左时间,右信号 / Wi-Fi / 电量;中间留给灵动岛 */
export default function StatusBar({ tint }: { tint: "light" | "dark" }) {
  const now = useClock();
  const color = tint === "light" ? "#fff" : "#000";
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-40 flex h-[54px] items-center justify-between px-[34px] pt-[6px] transition-colors duration-300"
      style={{ color }}
    >
      <span className="w-[76px] text-center text-[17px] font-semibold tracking-[-0.2px] tabular-nums">
        {formatStatusTime(now)}
      </span>
      <span className="flex w-[76px] items-center justify-center gap-[6px]">
        {/* 信号 */}
        <svg
          width="18"
          height="12"
          viewBox="0 0 18 12"
          fill="currentColor"
          aria-hidden
        >
          <rect x="0" y="8" width="3" height="4" rx="1" />
          <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
          <rect x="10" y="3" width="3" height="9" rx="1" />
          <rect x="15" y="0" width="3" height="12" rx="1" />
        </svg>
        {/* Wi-Fi */}
        <svg
          width="16"
          height="12"
          viewBox="0 0 16 12"
          fill="currentColor"
          aria-hidden
        >
          <path d="M8 2.2c2.3 0 4.4.9 6 2.4.2.2.5.2.7 0l.9-.9c.2-.2.2-.5 0-.7A11 11 0 0 0 8 0 11 11 0 0 0 .4 3c-.2.2-.2.5 0 .7l.9.9c.2.2.5.2.7 0A8.6 8.6 0 0 1 8 2.2Z" />
          <path d="M8 5.8c1.3 0 2.5.5 3.4 1.3.2.2.5.2.7 0l.9-.9c.2-.2.2-.5 0-.7A7 7 0 0 0 8 3.6a7 7 0 0 0-5 1.9c-.2.2-.2.5 0 .7l.9.9c.2.2.5.2.7 0 .9-.8 2.1-1.3 3.4-1.3Z" />
          <path d="M10.2 9.3c.2-.2.2-.5 0-.7A3.2 3.2 0 0 0 8 7.7c-.8 0-1.6.3-2.2.9-.2.2-.2.5 0 .7l1.8 1.8c.2.2.6.2.8 0l1.8-1.8Z" />
        </svg>
        {/* 电量 80% */}
        <svg width="27" height="13" viewBox="0 0 27 13" fill="none" aria-hidden>
          <rect
            x="0.5"
            y="0.5"
            width="23"
            height="12"
            rx="3.8"
            stroke="currentColor"
            strokeOpacity="0.4"
          />
          <rect
            x="2"
            y="2"
            width="16.5"
            height="9"
            rx="2.4"
            fill="currentColor"
          />
          <path
            d="M25 4.5v4c.8-.3 1.4-1.1 1.4-2s-.6-1.7-1.4-2Z"
            fill="currentColor"
            fillOpacity="0.45"
          />
        </svg>
      </span>
    </div>
  );
}
