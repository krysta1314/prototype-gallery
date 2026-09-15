"use client";

/* 全站统一的 toast。
   规范写在根目录 design.md 的「Toast 提示」一节,改这里请同步改那里。
   要点:顶部居中、按语义分色(成功=绿)、自动消失、可手动关掉、同时只显示一条。 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Info, TriangleAlert, X } from "lucide-react";

export type ToastKind = "success" | "error" | "info";

const STYLE: Record<
  ToastKind,
  { bg: string; border: string; text: string; icon: React.ElementType; iconBg: string }
> = {
  success: {
    bg: "bg-[#e8f7ef]",
    border: "border-[#b7e6cb]",
    text: "text-[#166c40]",
    iconBg: "bg-[#1a7f4b]",
    icon: Check,
  },
  error: {
    bg: "bg-[#fff0f0]",
    border: "border-[#ffd1d1]",
    text: "text-[#c22f32]",
    iconBg: "bg-[#ff5255]",
    icon: TriangleAlert,
  },
  info: {
    bg: "bg-white",
    border: "border-[#e4e3ea]",
    text: "text-[#1a1a2e]",
    iconBg: "bg-[#1a1a2e]",
    icon: Info,
  },
};

const DURATION = 2600;

export type Notify = (message: string, kind?: ToastKind) => void;

/** 返回 [notify, toastNode] —— 把 node 放在页面最外层即可。 */
export function useToast(): [Notify, React.ReactNode] {
  const [toast, setToast] = useState<{ id: number; message: string; kind: ToastKind } | null>(null);
  const [shown, setShown] = useState(false);
  const timers = useRef<number[]>([]);

  const clear = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  useEffect(() => clear, []);

  const dismiss = useCallback(() => {
    clear();
    setShown(false);
    /* 等滑出动画走完再卸载,否则会直接消失 */
    timers.current.push(window.setTimeout(() => setToast(null), 200));
  }, []);

  const notify = useCallback<Notify>((message, kind = "success") => {
    clear();
    setToast({ id: Date.now(), message, kind });
    /* 先挂上去再翻到可见态,transition 才有起点 */
    timers.current.push(window.setTimeout(() => setShown(true), 10));
    timers.current.push(window.setTimeout(() => setShown(false), DURATION));
    timers.current.push(window.setTimeout(() => setToast(null), DURATION + 200));
  }, []);

  const node = toast ? (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-5 z-[200] flex justify-center px-4"
    >
      <div
        className={`pointer-events-auto flex max-w-[min(92vw,460px)] items-center gap-3 rounded-xl border py-3 pl-3.5 pr-2.5 shadow-[0_12px_32px_rgba(26,26,46,0.14)] transition-all duration-200 ease-out motion-reduce:transition-none ${
          STYLE[toast.kind].bg
        } ${STYLE[toast.kind].border} ${
          shown ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"
        }`}
      >
        <span
          className={`inline-flex size-5 shrink-0 items-center justify-center rounded-full text-white ${
            STYLE[toast.kind].iconBg
          }`}
        >
          {(() => {
            const Icon = STYLE[toast.kind].icon;
            return <Icon className="size-3" strokeWidth={3} />;
          })()}
        </span>
        <span className={`text-[14px] font-semibold leading-snug ${STYLE[toast.kind].text}`}>
          {toast.message}
        </span>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className={`ml-auto inline-flex size-6 shrink-0 items-center justify-center rounded-lg opacity-50 transition hover:bg-black/5 hover:opacity-100 ${
            STYLE[toast.kind].text
          }`}
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  ) : null;

  return [notify, node];
}
