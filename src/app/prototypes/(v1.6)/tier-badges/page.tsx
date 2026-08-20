"use client";

import { ChevronRight } from "lucide-react";
import { TIERS, TierBadge, tierGradient } from "../team-workspace/_shared/plan-badge";

const APPLE_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif';

/** 规范页里的假用户,只为了看标签在真实菜单里的样子 */
const DEMO_USER = { initial: "R", name: "Rowan Song", email: "rowan@example.com" };
const MENU_ITEMS = ["Account Settings", "Billing & Subscription", "Credits Usage", "Log out"];

export default function TierBadgesPage() {
  return (
    <div className="min-h-screen bg-[#8a8a8a] px-6 py-12 sm:px-12" style={{ fontFamily: APPLE_FONT }}>
      <div className="mx-auto max-w-[1180px]">
        <header>
          <h1 className="text-[18px] font-semibold text-white">Buzz 订阅标签 · 渐变规范</h1>
          <p className="mt-1 text-[13px] text-[#e5e5e5]">
            135° 线性渐变 · 圆角 5px · 11px/600 · padding 2px 7px · 浅色底 + 同色系深字 · 无描边
          </p>
        </header>

        <h2 className="mb-3.5 mt-10 text-[12px] font-semibold uppercase tracking-[0.06em] text-white/85">色板</h2>
        <div className="flex flex-wrap gap-3">
          {TIERS.map((tier) => (
            <div key={tier.id} className="w-[186px] rounded-[10px] bg-white p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.12)]">
              <div className="mb-3 flex items-center justify-between gap-2">
                <TierBadge tier={tier.name} />
                <span className="text-[11px] lowercase text-[#a1a1aa]">{tier.id}</span>
              </div>
              <div
                className="mb-2.5 h-[30px] rounded-md"
                style={{ background: tierGradient(tier) }}
              />
              <div className="flex justify-between font-mono text-[10.5px] text-[#52525b]">
                <span>{tier.from}</span>
                <span>{tier.to}</span>
              </div>
            </div>
          ))}
        </div>

        <h2 className="mb-3.5 mt-10 text-[12px] font-semibold uppercase tracking-[0.06em] text-white/85">实际场景</h2>
        <div className="flex flex-wrap gap-[22px]">
          {TIERS.map((tier) => (
            <div
              key={tier.id}
              className="w-[222px] overflow-hidden rounded-xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.14)]"
            >
              <div className="px-3.5 pb-3 pt-4 text-center">
                <span className="mx-auto mb-2 grid size-[26px] place-items-center rounded-full bg-[#ffe4d3] text-[12px] font-semibold text-[#ff6b35]">
                  {DEMO_USER.initial}
                </span>
                <p className="flex items-center justify-center gap-1.5 text-[13px] font-semibold text-[#18181b]">
                  {DEMO_USER.name}
                  <TierBadge tier={tier.name} />
                </p>
                <p className="mt-[3px] text-[11px] text-[#a1a1aa]">{DEMO_USER.email}</p>
              </div>

              <div className="flex items-center justify-between border-y border-[#f0f0ef] px-3.5 py-[9px] text-[12.5px] text-[#18181b]">
                <span>Credits</span>
                <span className="flex items-center gap-1 text-[#71717a]">
                  100
                  <ChevronRight className="size-3.5" />
                </span>
              </div>

              <div className="py-1.5">
                {MENU_ITEMS.map((label) => (
                  <p key={label} className="px-3.5 py-[7px] text-[12.5px] text-[#3f3f46]">
                    {label}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-10 text-[12px] leading-[1.6] text-white/70">
          说明:七档标签由 <code className="font-mono">_shared/plan-badge.tsx</code> 统一提供,team-workspace
          的身份菜单直接复用同一个组件——改这里的色值,产品界面同步生效。
        </p>
      </div>
    </div>
  );
}
