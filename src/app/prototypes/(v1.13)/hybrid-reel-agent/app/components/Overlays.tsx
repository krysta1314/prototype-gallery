"use client";

/* 对话页的弹窗与 toast:重新生成确认 / 删除成片确认(积分不足是输入框上方的横条,见 AgentChat);底部 toast(删除带 Undo、下载失败带 Retry,5 秒后消失)。
   状态在 reducer(dialog / toast),评审原型可以直接预置。 */

import { useEffect } from "react";
import { OUT_OF_CREDITS_LINK, OUT_OF_CREDITS_TEXT, REGENERATE_TITLE, UPGRADE_LABEL, regenerateBody } from "../logic/credits";
import type { Dialog, Toast } from "../store";

const UNDO_MS = 5000;
const TOAST_MS = 2200;

export function AgentDialog({
  dialog,
  onClose,
  onRegenerate,
  onDelete,
}: {
  dialog: Dialog | null;
  onClose: () => void;
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
    dialog.kind === "regenerate"
      ? { title: REGENERATE_TITLE, body: regenerateBody(dialog.cost), confirm: "Regenerate", onConfirm: onRegenerate, danger: false }
      : { title: "Delete this reel?", body: "You can undo this for a few seconds.", confirm: "Delete", onConfirm: onDelete, danger: true };

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

export function AgentToast({
  toast,
  onDismiss,
  onUndo,
  onRetry,
}: {
  toast: Toast | null;
  onDismiss: (id: string) => void;
  onUndo: () => void;
  /** 下载失败 toast 的 Retry:重下 toast.retry 里的文件 */
  onRetry?: (retry: NonNullable<Toast["retry"]>) => void;
}) {
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => onDismiss(toast.id), toast.undo || toast.retry ? UNDO_MS : TOAST_MS);
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
      {toast.retry && onRetry && (
        <button
          type="button"
          onClick={() => {
            onDismiss(toast.id);
            onRetry(toast.retry!);
          }}
          className="font-semibold text-[#ffa73c] hover:text-[#ffc27a]"
        >
          Retry
        </button>
      )}
    </div>
  );
}

/** 积分不足横条(BuzzVideo 正式产品同款):输入框正上方,浅粉底 + 橙色积分图标 + 红橙文案 + 下划线「Upgrade to continue」 */
export function OutOfCreditsBanner({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    /* 照 BuzzVideo 正式产品:浅粉到浅红的横向渐变底、圆角、左边产品积分图标、红色文案 + 加粗下划线链接 */
    <div role="alert" className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#fff4f1] to-[#ffe9e9] px-4 py-2.5 text-[13.5px] text-[#f0473d]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/prototypes/homepage/credits-icon.svg" alt="" className="size-4 shrink-0" />
      <span>
        {OUT_OF_CREDITS_TEXT}{" "}
        <button type="button" onClick={onUpgrade} className="font-semibold underline underline-offset-2 hover:text-[#d63a22]">
          {OUT_OF_CREDITS_LINK}
        </button>
      </span>
    </div>
  );
}

/** 积分不足时替换输入框的圆形发送键 */
export function UpgradeButton({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <button
      type="button"
      onClick={onUpgrade}
      className="inline-flex h-10 items-center rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-5 text-[14px] font-semibold text-white transition hover:brightness-105"
    >
      {UPGRADE_LABEL}
    </button>
  );
}
