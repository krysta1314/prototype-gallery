"use client";

import { Users } from "lucide-react";
import { planOf, type Team } from "./data";

export type TierName = "Free" | "Starter" | "Pro" | "Ultra" | "Team" | "Scale" | "Enterprise";

/**
 * 订阅标签规范(见 /prototypes/tier-badges):
 * 135° 线性渐变 · 圆角 5px · 11px/600 · padding 2px 7px。
 * 七档全部走浅色底 + 同色系深字,不加描边。
 */
export const TIERS: { name: TierName; id: string; from: string; to: string; text: string }[] = [
  { name: "Free", id: "free", from: "#F2F2F0", to: "#E2E2DE", text: "#5C5650" },
  { name: "Starter", id: "starter", from: "#FFF3E0", to: "#FFE3BC", text: "#9A3412" },
  { name: "Pro", id: "pro", from: "#FFEADD", to: "#FFD4BE", text: "#9A3412" },
  { name: "Ultra", id: "ultra", from: "#F3E8FF", to: "#E4D4FF", text: "#6D28D9" },
  { name: "Team", id: "team", from: "#E0F7FD", to: "#C3ECFB", text: "#0369A1" },
  { name: "Scale", id: "scale", from: "#E7EEFE", to: "#CFDDFC", text: "#1D4ED8" },
  { name: "Enterprise", id: "enterprise", from: "#EFEBE3", to: "#DED5C6", text: "#5F4718" },
];

const BY_NAME = new Map(TIERS.map((tier) => [tier.name, tier]));

export function tierGradient(tier: { from: string; to: string }) {
  return `linear-gradient(135deg, ${tier.from}, ${tier.to})`;
}

/** 纯展示的标签,规范页和产品界面共用这一个实现 */
export function TierBadge({ tier }: { tier: TierName }) {
  const tone = BY_NAME.get(tier) ?? TIERS[0]!;
  return (
    <span
      className="inline-flex shrink-0 items-center whitespace-nowrap rounded-[5px] px-[7px] py-[2px] text-[11px] font-semibold leading-4 tracking-[0.01em]"
      style={{ background: tierGradient(tone), color: tone.text }}
    >
      {tone.name}
    </span>
  );
}

/** 工作区当前订阅 —— 身份菜单头部与列表每一行都用它 */
export function PlanBadge({ team }: { team: Team }) {
  return <TierBadge tier={planOf(team).name as TierName} />;
}

/** 工作区类型徽章:个人账户灰、团队紫 —— 切换器里靠它区分两类工作区 */
export function ScopeBadge({ personal }: { personal: boolean }) {
  return (
    <span
      className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        personal ? "bg-[#f1eff3] text-[#7b7480]" : "bg-[#efe9ff] text-[#7b5cf0]"
      }`}
    >
      {personal ? null : <Users className="size-3" />}
      {personal ? "Personal" : "Team"}
    </span>
  );
}
