"use client";

/* 对话页的弹窗与 toast:重新生成确认 / 删除成片确认(积分不足是输入框上方的横条,见 AgentChat);底部 toast(删除带 Undo、下载失败带 Retry,5 秒后消失)。
   状态在 reducer(dialog / toast),评审原型可以直接预置。 */

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import type { Outline } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";
import { redoCost } from "../logic/followup";
import { reelPrompts } from "../logic/plan";
import { aiShotNumbers } from "../logic/storyboard";
import { OUT_OF_CREDITS_LINK, OUT_OF_CREDITS_TEXT, REGENERATE_TITLE, UPGRADE_LABEL, fmtCredits, regenerateBody } from "../logic/credits";
import type { Dialog, Toast } from "../store";

const UNDO_MS = 5000;
const TOAST_MS = 2200;

export function AgentDialog({
  dialog,
  onClose,
  onRegenerate,
  onDelete,
  onRedo,
}: {
  dialog: Dialog | null;
  onClose: () => void;
  onRegenerate: () => void;
  onDelete: () => void;
  /** Redo a shot 里点 Redo:勾选的镜头号 */
  onRedo: (shots: number[]) => void;
}) {
  useEffect(() => {
    if (!dialog) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dialog, onClose]);
  if (!dialog) return null;
  if (dialog.kind === "redoShots") return <RedoShotsDialog outline={dialog.outline} initial={dialog.picked} onClose={onClose} onRedo={onRedo} />;

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

/** 成片 ⋯ → Redo a shot:列出这条成片的 AI 补拍镜头(实拍不是生成的,不在这里重做),勾几个重做几个;
    底部按钮带这几镜的积分,一个没勾时不可点。其余镜头、配音不动,重做完重新剪一版(异常处理 spec 第 20 条) */
function RedoShotsDialog({ outline, initial, onClose, onRedo }: { outline: Outline; initial?: number[]; onClose: () => void; onRedo: (shots: number[]) => void }) {
  const shots = aiShotNumbers(outline);
  const prompts = reelPrompts(outline);
  /* 从镜头卡的「重新生成」打开:这一镜预先勾好 */
  const [picked, setPicked] = useState<number[]>(initial ?? []);
  const cost = redoCost(outline, picked);
  const toggle = (n: number) => setPicked((p) => (p.includes(n) ? p.filter((x) => x !== n) : [...p, n].sort((a, b) => a - b)));
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#1a1a2e]/30 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="redo-dialog-title"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-full w-full max-w-[460px] flex-col rounded-2xl bg-white p-5 shadow-[0_16px_48px_rgba(26,26,46,0.22)]"
      >
        <h2 id="redo-dialog-title" className="text-[16px] font-bold text-[#1a1a2e]">
          Redo a shot
        </h2>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#6a6b7b]">Pick the AI shots to redo. Everything else stays as it is, and the reel is re-cut.</p>
        <div className="mt-4 min-h-0 space-y-2 overflow-y-auto">
          {shots.map((n) => {
            const on = picked.includes(n);
            const p = prompts.find((x) => x.title === `Shot ${n} · AI`);
            return (
              <button
                key={n}
                type="button"
                role="checkbox"
                aria-checked={on}
                onClick={() => toggle(n)}
                className={`flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition ${on ? "border-[#ffbd99] bg-[#fff7f1]" : "border-[#ececf1] hover:bg-[#fafafb]"}`}
              >
                <span className={`mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-[5px] border ${on ? "border-[#ff5e1a] bg-[#ff5e1a] text-white" : "border-[#c9cad6] bg-white"}`}>
                  {on && <Check className="size-3" strokeWidth={3} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2 text-[14px] font-semibold text-[#1a1a2e]">
                    Shot {n} · AI
                    <span className="shrink-0 text-[12px] font-normal text-[#9a9bb0]">{fmtCredits(redoCost(outline, [n]))} credits</span>
                  </span>
                  {p && <span className="mt-0.5 line-clamp-2 text-[12.5px] leading-snug text-[#6a6b7b]">{p.text}</span>}
                </span>
              </button>
            );
          })}
        </div>
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
            disabled={!picked.length}
            onClick={() => onRedo(picked)}
            className="rounded-full bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-4 py-2 text-[13px] font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100"
          >
            {picked.length ? `Redo · ${fmtCredits(cost)} credits` : "Redo"}
          </button>
        </div>
      </div>
    </div>
  );
}
