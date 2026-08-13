'use client';

import { useEffect, type RefObject } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * 全屏 dialog 覆盖层共用的可访问性行为：Esc 关闭 + 打开时把焦点移入 + Tab/Shift+Tab 焦点陷阱 +
 * 卸载时把焦点还给打开前的触发元素。从 PromoModal 抽出，CampaignWizard 复用同一套逻辑。
 *
 * enabled=false 时（例如向导右侧常驻挂载的缩略预览）完全不挂任何监听、不抢焦点——
 * 否则会劫持宿主页面（向导表单）的 Tab 导航，这是之前刚修好的 Critical，行为必须保持不变。
 */
export function useDialogA11y({
  ref,
  onClose,
  enabled = true,
}: {
  ref: RefObject<HTMLElement | null>;
  onClose: () => void;
  enabled?: boolean;
}) {
  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, enabled]);

  // 焦点管理：打开时把焦点移进 dialog；Tab/Shift+Tab 在 dialog 内循环（焦点陷阱）；
  // 卸载时把焦点还给打开前的触发元素。
  useEffect(() => {
    if (!enabled) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    ref.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const dialog = ref.current;
      if (!dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        el => el.offsetParent !== null || el === document.activeElement,
      );
      if (focusable.length === 0) {
        e.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (e.shiftKey) {
        if (active === first || !dialog.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last || !dialog.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus();
    };
  }, [enabled, ref]);
}
