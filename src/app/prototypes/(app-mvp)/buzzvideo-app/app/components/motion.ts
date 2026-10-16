import type { ViewStyle } from "react-native";

/** 系统「减少动态效果」:网页端读 matchMedia,原生端(无 window.matchMedia)视为关闭。
 *  真实 APP 换成 AccessibilityInfo.isReduceMotionEnabled() */
export function prefersReducedMotion(): boolean {
  const w = globalThis as { matchMedia?: (q: string) => { matches: boolean } };
  return typeof w.matchMedia === "function" && w.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const PRESSED: ViewStyle = { transform: [{ scale: 0.97 }] };

/** Pressable 按压态:0.97 缩放(减少动态效果时不缩放) */
export const pressScale = (pressed: boolean): ViewStyle | null => (pressed && !prefersReducedMotion() ? PRESSED : null);

/**
 * 面板 / 抽屉升起的弹簧(接近 iOS 原生 sheet):起步快、尾部自然减速;
 * overshootClamping 防止冲过头露出底部缝隙。收起仍用快速缓动(DURATION.sheetOut)
 */
export const SHEET_SPRING = { stiffness: 320, damping: 32, mass: 1, overshootClamping: true } as const;

/** 统一的动效时长(ms) */
export const DURATION = { fast: 150, base: 200, sheetIn: 280, sheetOut: 250 } as const;
