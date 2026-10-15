/* Agent 的积分规则(spec §1):起始余额、扣费前检查、各处文案。纯函数,开发原型与评审原型共用。 */

import type { Outline } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";

/** 没有真实余额接口时的起始余额 */
export const START_CREDITS = 35600;

export type CreditCheck = { ok: true } | { ok: false; needed: number; balance: number };

/** 扣费前检查:余额够才放行;不够返回需要多少、余额多少,给「Not enough credits」弹窗用 */
export function checkCredits(balance: number, cost: number): CreditCheck {
  return cost <= balance ? { ok: true } : { ok: false, needed: cost, balance };
}

export const fmtCredits = (n: number) => n.toLocaleString("en-US");

/** 生成整条成片的费用 = 分镜卡上的预估 */
export const reelCost = (outline: Outline) => outline.credits.total;
/** 重试单个补拍镜头的费用 */
export const shotCost = (outline: Outline) => outline.credits.perGenerateShot;

/** Regenerate 确认弹窗:标题 + 正文合起来就是 "Regenerate this reel? It uses {n} credits." */
export const REGENERATE_TITLE = "Regenerate this reel?";
export const regenerateBody = (cost: number) => `It uses ${fmtCredits(cost)} credits.`;
export const notEnoughText = (needed: number, balance: number) =>
  `This needs ${fmtCredits(needed)} credits and you have ${fmtCredits(balance)}.`;
export const TOP_UP_TOAST = "Top up isn't part of this prototype";

const lcFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** 单镜失败的 Agent 回复:"Shot {n} failed — {reason}. {cost} credits refunded." */
export const shotFailedText = (shot: number, reason: string, cost: number, lang: "zh" | "en" = "en") =>
  lang === "zh"
    ? `第 ${shot} 镜生成失败:${reason}。已退回 ${fmtCredits(cost)} 积分。`
    : `Shot ${shot} failed — ${lcFirst(reason)}. ${fmtCredits(cost)} credits refunded.`;

/** 停止生成的 Agent 回复:"Stopped. {n} credits refunded." */
export const stoppedText = (refund: number, lang: "zh" | "en" = "en") =>
  lang === "zh" ? `已停止。退回 ${fmtCredits(refund)} 积分。` : `Stopped. ${fmtCredits(refund)} credits refunded.`;
