"use client";

/* 对话页的弹窗与 toast:积分不足 / 重新生成确认 / 删除成片确认;底部 toast(删除带 Undo,5 秒后消失)。
   状态在 reducer(dialog / toast),评审原型可以直接预置。 */

import { useEffect } from "react";
import { REGENERATE_TITLE, fmtCredits, notEnoughText, regenerateBody } from "../logic/credits";
import type { Dialog, Toast } from "../store";

const UNDO_MS = 5000;
const TOAST_MS = 2200;

export function AgentDialog({
  dialog,
  onClose,
  onTopUp,
  onRegenerate,
  onDelete,
}: {
  dialog: Dialog | null;
  onClose: () => void;
  onTopUp: () => void;
  onRegenerate: () => void;
  onDelete: () => void;
}) {
  useEffect(() => {
    if (!dialog) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dialog, onClose]);
  if (!dialog) return null;

  const view =
    dialog.kind === "noCredits"
      ? {
          title: "Not enough credits",
          body: notEnoughText(dialog.needed, dialog.balance),
          extra: (
            <dl className="mt-3 grid grid-cols-2 gap-y-1 rounded-xl bg-[#f6f7f9] px-3 py-2.5 text-[13px] tabular-nums">
              <dt className="text-[#6a6b7b]">Needed</dt>
              <dd className="text-right font-semibold text-[#1a1a2e]">{fmtCredits(dialog.needed)}</dd>
              <dt className="text-[#6a6b7b]">Your balance</dt>
              <dd className="text-right font-semibold text-[#1a1a2e]">{fmtCredits(dialog.balance)}</dd>
            </dl>
          ),
          confirm: "Top up",
          onConfirm: onTopUp,
          danger: false,
        }
      : dialog.kind === "regenerate"
        ? { title: REGENERATE_TITLE, body: regenerateBody(dialog.cost), extra: null, confirm: "Regenerate", onConfirm: onRegenerate, danger: false }
        : { title: "Delete this reel?", body: "You can undo this for a few seconds.", extra: null, confirm: "Delete", onConfirm: onDelete, danger: true };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#1a1a2e]/30 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="agent-dialog-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[380px] rounded-2xl bg-white p-5 shadow-[0_16px_48px_rgba(26,26,46,0.22)]"
      >
        <h2 id="agent-dialog-title" className="text-[16px] font-bold text-[#1a1a2e]">
          {view.title}
        </h2>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#6a6b7b]">{view.body}</p>
        {view.extra}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#ececf1] px-4 py-2 text-[13px] font-semibold text-[#1a1a2e] transition hover:bg-[#f6f7f9]"
          >
            Cancel
          </button>
          <button
            type="button"
            autoFocus
            onClick={view.onConfirm}
            className={`rounded-full px-4 py-2 text-[13px] font-semibold text-white transition hover:brightness-105 ${
              view.danger ? "bg-[#e5484d]" : "bg-gradient-to-r from-[#FFA73C] to-[#FF5255]"
            }`}
          >
            {view.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AgentToast({ toast, onDismiss, onUndo }: { toast: Toast | null; onDismiss: (id: string) => void; onUndo: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => onDismiss(toast.id), toast.undo ? UNDO_MS : TOAST_MS);
    return () => window.clearTimeout(t);
  }, [toast, onDismiss]);
  if (!toast) return null;
  return (
    <div
      role="status"
      className="fixed bottom-28 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full bg-[#1a1a2e] px-4 py-2 text-[13px] text-white shadow-[0_8px_24px_rgba(26,26,46,0.25)]"
    >
      {toast.text}
      {toast.undo && (
        <button type="button" onClick={onUndo} className="font-semibold text-[#ffa73c] hover:text-[#ffc27a]">
          Undo
        </button>
      )}
    </div>
  );
}
