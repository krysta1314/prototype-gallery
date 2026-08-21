"use client";

import {
  Activity,
  Check,
  CircleUserRound,
  CreditCard,
  LogOut,
  Plus,
  Sparkle,
  Zap,
} from "lucide-react";
import { ScopeBadge, TIERS, TierBadge, tierGradient, type TierName } from "../team-workspace/_shared/plan-badge";

const APPLE_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif';

/** 规范页里的假用户,只为了看标签在真实菜单里的样子 */
const DEMO_USER = { initial: "R", name: "Rowan Song", email: "rowan@example.com" };

/** 菜单底部四项 —— 与 team-workspace 的身份菜单逐条对齐(含 Credits Top-up) */
const MENU_ITEMS = [
  { label: "Account Settings", Icon: CircleUserRound },
  { label: "Billing & Subscription", Icon: CreditCard },
  { label: "Credits Usage", Icon: Activity },
  { label: "Credits Top-up", Icon: Zap },
];

/** 个人档挂在个人账户上,团队三档挂在团队账户上 —— 顺带把 Personal / Team 徽章也演示到 */
const TEAM_TIERS = new Set<TierName>(["Team", "Scale", "Enterprise"]);

/** 切换器那一行的工作区名 */
const WORKSPACE_NAME: Record<TierName, string> = {
  Free: "Rowan Song",
  Starter: "Rowan Song",
  Pro: "Rowan Song",
  Ultra: "Rowan Song",
  Team: "Buzz Creative",
  Scale: "Atlas Media",
  Enterprise: "PressLogic Growth",
};

export default function TierBadgesPage() {
  return (
    <div className="min-h-screen bg-[#8a8a8a] px-6 py-12 sm:px-12" style={{ fontFamily: APPLE_FONT }}>
      <div className="mx-auto max-w-[1180px]">
        <header>
          <h1 className="text-[18px] font-semibold text-white">Buzz 订阅标签 · 渐变规范</h1>
          <p className="mt-1 text-[13px] text-[#e5e5e5]">
            135° 线性渐变 · 圆角 5px · 11px/600 · padding 2px 7px · 浅色底 + 同色系深字 · 无描边
          </p>
          <p className="mt-1 text-[13px] text-[#e5e5e5]">
            Enterprise 是唯一例外 —— 顶档走黑金(深底 + 金字),一眼与其余六档区分。
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

        <h2 className="mb-1.5 mt-10 text-[12px] font-semibold uppercase tracking-[0.06em] text-white/85">实际场景</h2>
        <p className="mb-3.5 text-[12px] text-white/70">
          与 team-workspace 现在的身份菜单同构:身份区 · 额度条 + Upgrade · 工作区切换 · Create team · 账户四项 · Log out。
        </p>
        <div className="flex flex-wrap gap-[22px]">
          {TIERS.map((tier) => (
            <IdentityMenuMock key={tier.id} tier={tier.name} />
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

/**
 * 身份菜单的静态复刻 —— 只为把标签放回真实上下文里看。
 * 交互与数据都在 team-workspace,这里不接 context,所以是一份纯展示的壳。
 */
function IdentityMenuMock({ tier }: { tier: TierName }) {
  const isTeam = TEAM_TIERS.has(tier);
  const workspace = WORKSPACE_NAME[tier];

  return (
    <div className="w-[268px] overflow-hidden rounded-2xl border border-[#ececf1] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.14)]">
      {/* 身份区:本人 + 当前工作区正在用的订阅 */}
      <div className="flex items-center gap-3 px-4 py-3.5">
        <span className="grid size-10 shrink-0 place-items-center rounded-[11px] bg-[#ff6b35] text-[17px] font-bold text-white">
          {DEMO_USER.initial}
        </span>
        <span className="min-w-0">
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-[14px] font-bold text-[#28222e]">{DEMO_USER.name}</span>
            <TierBadge tier={tier} />
          </span>
          <span className="mt-0.5 block truncate text-[12px] text-[#7b7480]">{DEMO_USER.email}</span>
        </span>
      </div>

      {/* 额度行:剩余额度 + 进度条 + Upgrade */}
      <div className="border-y border-[#f0eef2] px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-1.5">
            <Sparkle className="size-4 shrink-0 fill-[#ff5e1a] text-[#ff5e1a]" />
            <span className="truncate text-[13px] font-bold text-[#28222e]">1,240 credits left</span>
          </span>
          <span className="shrink-0 rounded-full bg-gradient-to-r from-[#ff9a3d] to-[#ff5424] px-2.5 py-1 text-[11px] font-extrabold text-white">
            Upgrade
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#f1eff3]">
          <div
            className="h-full w-[62%] rounded-full"
            style={{ background: "linear-gradient(90deg,#ff9a3d,#ff5424)" }}
          />
        </div>
      </div>

      {/* 工作区切换:标签在列表行里也要成立 */}
      <div className="p-2">
        <div className="flex items-center gap-1 rounded-xl bg-[#fff3ee] px-2">
          <span className="flex min-w-0 flex-1 items-center gap-2.5 py-2">
            <span
              className="grid size-[30px] shrink-0 place-items-center rounded-lg text-[13px] font-bold text-white"
              style={{ background: isTeam ? "#7b5cf0" : "#ff6b35" }}
            >
              {workspace.trim()[0]}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold text-[#28222e]">{workspace}</span>
              <span className="mt-0.5 flex items-center gap-1.5">
                <TierBadge tier={tier} />
                {isTeam && <span className="truncate text-[11px] text-[#7b7480]">· 6 members</span>}
              </span>
            </span>
            <ScopeBadge personal={!isTeam} />
          </span>
          <Check className="size-4 shrink-0 text-[#ee6545]" />
        </div>

        <span className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-[13px] font-bold text-[#ee6545]">
          <Plus className="size-4 text-[#ee6545]" />
          Create team
        </span>
      </div>

      <div className="border-t border-[#f0eef2] p-2">
        {MENU_ITEMS.map(({ label, Icon }) => (
          <span
            key={label}
            className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-[13px] font-semibold text-[#28222e]"
          >
            <Icon className="size-[18px] text-[#56505c]" />
            {label}
          </span>
        ))}
      </div>

      <div className="border-t border-[#f0eef2] p-2">
        <span className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-[13px] font-semibold text-[#d92d20]">
          <LogOut className="size-[18px]" />
          Log out
        </span>
      </div>
    </div>
  );
}
