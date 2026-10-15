/* 剪辑器的积分规则(spec 2026-10-15 §1):起始余额随 Agent 交接带过来(Handoff.credits),
   画布余额 = 带来的余额 − 画布里花的(Project.spentCredits)。任何扣费动作先过 checkCredits,
   不够就弹「Not enough credits」,不扣费、不开跑。退款(失败 / 停止 / 生成中删节点)全额退回该项。
   纯函数,不依赖 hybrid-reel-agent,开发版画布和评审原型共用。 */

/** 开发版没有交接(直接打开画布)时的起始余额 */
export const DEFAULT_CREDITS = 35600;

/** 画布当前余额,不会显示成负数 */
export function creditBalance(start: number, spent: number): number {
  return Math.max(0, start - spent);
}

export type CreditCheck = { ok: true } | { ok: false; needed: number; balance: number };

/** 花 cost 之前查余额:够就放行;不够返回需要多少、余额多少(弹窗里显示) */
export function checkCredits(balance: number, cost: number): CreditCheck {
  const needed = Math.max(0, Math.round(cost));
  if (needed === 0 || balance >= needed) return { ok: true };
  return { ok: false, needed, balance: Math.max(0, balance) };
}

/** 积分数字显示:千分位(35,600) */
export const formatCredits = (n: number) => Math.round(n).toLocaleString("en-US");
