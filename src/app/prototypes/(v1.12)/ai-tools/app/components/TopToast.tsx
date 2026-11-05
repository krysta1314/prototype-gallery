"use client";

/* 顶部居中的轻提示(design.md §6.5):同一时刻只一条,2.6s 自动消失(带 Retry 的留 6s),右侧 X 手动关。
   用 absolute 而不是 fixed:放在产品外壳(relative)里,评审原型里只盖产品区。 */

import { useEffect } from "react";
import { Check, Info, TriangleAlert, X } from "lucide-react";

export type ToastKind = "success" | "error" | "info";
/** retry:带 Retry 按钮(如下载失败重下) */
export type TopToastData = { id: string; text: string; kind?: ToastKind; retry?: () => void };
export type Notify = (text: string, kind?: ToastKind, retry?: () => void) => void;

const TOAST_MS = 2600;
const RETRY_MS = 6000;

const STYLE: Record<ToastKind, { box: string; dot: string; Icon: typeof Check }> = {
  success: { box: "border-[#B7E6CB] bg-[#E8F7EF] text-[#166C40]", dot: "bg-[#1A7F4B]", Icon: Check },
  error: { box: "border-[#FFD1D1] bg-[#FFF0F0] text-[#C22F32]", dot: "bg-[#FF5255]", Icon: TriangleAlert },
  info: { box: "border-[#E4E3EA] bg-white text-[#1A1A2E]", dot: "bg-[#1A1A2E]", Icon: Info },
};

export function TopToast({ toast, onDismiss }: { toast: TopToastData | null; onDismiss: (id: string) => void }) {
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => onDismiss(toast.id), toast.retry ? RETRY_MS : TOAST_MS);
    return () => window.clearTimeout(t);
  }, [toast, onDismiss]);
  if (!toast) return null;
  const { box, dot, Icon } = STYLE[toast.kind ?? "info"];
  return (
    <div className="pointer-events-none absolute inset-x-0 top-5 z-[200] flex justify-center px-4" role="status" aria-live="polite">
      <div
        key={toast.id}
        className={`pointer-events-auto flex max-w-[min(92vw,520px)] items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-[14px] font-semibold shadow-[0_12px_32px_rgba(26,26,46,0.14)] animate-in fade-in slide-in-from-top-1 duration-200 motion-reduce:animate-none ${box}`}
      >
        <span className={`grid size-5 shrink-0 place-items-center rounded-full text-white ${dot}`}>
          <Icon className="size-3" strokeWidth={2.6} />
        </span>
        <span className="min-w-0">{toast.text}</span>
        {toast.retry && (
          <button
            type="button"
            onClick={() => {
              onDismiss(toast.id);
              toast.retry?.();
            }}
            className="shrink-0 font-bold text-[#ff5e1a] hover:underline"
          >
            Retry
          </button>
        )}
        <button type="button" aria-label="Dismiss" onClick={() => onDismiss(toast.id)} className="shrink-0 opacity-50 transition hover:opacity-100">
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
