"use client";

import { useEffect, type RefObject } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** 同时开着多个弹窗时,只有最后一个关闭才解锁滚动 */
let lockCount = 0;

/**
 * 锁住背景滚动。直接设 overflow:hidden 会让滚动条消失、页面横向跳一下,
 * 所以补一段等宽的 padding-right 顶住。
 */
function lockScroll() {
  lockCount += 1;
  if (lockCount > 1) return;
  const { body, documentElement } = document;
  const scrollbar = window.innerWidth - documentElement.clientWidth;
  body.dataset.prevOverflow = body.style.overflow;
  body.dataset.prevPaddingRight = body.style.paddingRight;
  body.style.overflow = "hidden";
  if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
}

function unlockScroll() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount > 0) return;
  const { body } = document;
  body.style.overflow = body.dataset.prevOverflow ?? "";
  body.style.paddingRight = body.dataset.prevPaddingRight ?? "";
  delete body.dataset.prevOverflow;
  delete body.dataset.prevPaddingRight;
}

/**
 * 弹窗共用行为:背景锁滚 + Esc 关闭 + 打开时把焦点移入 + Tab 焦点陷阱 +
 * 卸载时把焦点还给触发元素。与 org-members / promo-campaigns 里那份同源,
 * 这里多了锁滚 —— 评审第四节第 1 项。
 */
export function useDialog({
  ref,
  onClose,
  /** 传 false 可以在弹窗未挂载时跳过副作用 */
  active = true,
}: {
  ref: RefObject<HTMLElement | null>;
  onClose: () => void;
  active?: boolean;
}) {
  useEffect(() => {
    if (!active) return;
    lockScroll();
    return unlockScroll;
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active, onClose]);

  useEffect(() => {
    if (!active) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    ref.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const dialog = ref.current;
      if (!dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
      if (focusable.length === 0) {
        e.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      const activeEl = document.activeElement;
      if (e.shiftKey) {
        if (activeEl === first || !dialog.contains(activeEl)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (activeEl === last || !dialog.contains(activeEl)) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
  }, [active, ref]);
}
