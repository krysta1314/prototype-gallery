/* Agent 的积分规则(spec §1):起始余额、扣费前检查、各处文案。纯函数,开发原型与评审原型共用。 */

import type { Outline } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";
import { voiceCost } from "./voice";

/** 没有真实余额接口时的起始余额 */
export const START_CREDITS = 35600;

export type CreditCheck = { ok: true } | { ok: false; needed: number; balance: number };

/** 扣费前检查:余额够才放行;不够返回需要多少、余额多少(进入积分不足状态:输入框上方横条 + Upgrade) */
export function checkCredits(balance: number, cost: number): CreditCheck {
  return cost <= balance ? { ok: true } : { ok: false, needed: cost, balance };
}

export const fmtCredits = (n: number) => n.toLocaleString("en-US");

/** 成片基础费(最终剪辑 + 渲染),不随镜头数变 */
export const BASE_COST = 40;

/** AI 补拍镜头数 */
export const aiShotCount = (outline: Outline) => outline.shots.filter((s) => s.source.kind === "generate").length;
/** 重试单个补拍镜头的费用 */
export const shotCost = (outline: Outline) => outline.credits.perGenerateShot;
/** 生成整条成片的费用 = 基础费 40 + 每个 AI 补拍 × 每镜积分 + 旁白(VOICE_COST × 句数)。
    只按真正要生成的东西算;实拍素材、字幕、字卡、音乐、剪辑都包在基础费里 */
export const reelCost = (outline: Outline) => (outline.credits.base ?? BASE_COST) + aiShotCount(outline) * shotCost(outline) + voiceCost(outline);

/** Regenerate 确认弹窗:标题 + 正文合起来就是 "Regenerate this reel? It uses {n} credits." */
export const REGENERATE_TITLE = "Regenerate this reel?";
export const regenerateBody = (cost: number) => `It uses ${fmtCredits(cost)} credits.`;
/** 积分不足横条(与 BuzzVideo 正式产品一致):文案 + 下划线链接;输入框发送键换成 Upgrade */
export const OUT_OF_CREDITS_TEXT = "You've run out of credits.";
export const OUT_OF_CREDITS_LINK = "Upgrade to continue";
export const UPGRADE_LABEL = "Upgrade";
export const UPGRADE_TOAST = "Upgrade isn't part of this prototype";

/** 停止生成的 Agent 回复:"Stopped. {n} credits refunded." */
export const stoppedText = (refund: number, lang: "zh" | "en" = "en") =>
  lang === "zh" ? `已停止。退回 ${fmtCredits(refund)} 积分。` : `Stopped. ${fmtCredits(refund)} credits refunded.`;
