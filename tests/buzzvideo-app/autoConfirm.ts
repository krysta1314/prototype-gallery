import { demoReducer } from "@/app/prototypes/(app-mvp)/buzzvideo-app/app/demo";
import type { StoreState } from "@/app/prototypes/(app-mvp)/buzzvideo-app/app/store";

/**
 * 测试用 reducer:Agent / Hybrid Reel 发送后先出生成计划(2026-10-23),要点 Confirm 才开始生成。
 * 老测试关心的是「发送 → 生成」,这里发送后自动点一下 Confirm(用同一个 id),计划卡本身另有测试(plan-confirm.test)
 */
export const r: typeof demoReducer = (s, a) => {
  const next = demoReducer(s, a);
  if (a.type !== "submitPrompt" || !next.currentSessionId) return next;
  const list = next.messages[next.currentSessionId] ?? [];
  const m = list[list.length - 1];
  if (!m || m.role !== "agent" || m.kind !== "gplan" || m.status !== "awaiting") return next;
  return demoReducer(next, { type: "confirmPlan", messageId: m.id, id: a.id });
};
export type { StoreState };
