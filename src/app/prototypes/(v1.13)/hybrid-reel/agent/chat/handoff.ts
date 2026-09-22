/* 落地页 composer → 对话页 的单向交接。
   File 对象放不进 sessionStorage,而 router.push 是客户端跳转、document 不换,
   所以用模块级变量托一程就够了。硬刷新会丢,对话页据此退回空态,提示回落地页重来。 */

export type PendingHandoff = {
  files: File[];
  prompt: string;
};

let pending: PendingHandoff | null = null;

export function setPendingHandoff(next: PendingHandoff) {
  pending = next;
}

/** 取走即清空,避免刷新/返回时重复触发分析 */
export function takePendingHandoff(): PendingHandoff | null {
  const current = pending;
  pending = null;
  return current;
}
