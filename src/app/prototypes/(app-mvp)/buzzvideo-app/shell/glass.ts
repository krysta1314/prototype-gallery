import type { CSSProperties } from "react";

/**
 * iOS 26「液态玻璃」(Liquid Glass) 的网页近似:
 * 透出并模糊背景 + 提饱和度,边缘一圈高光(上亮下暗,模拟折射),外加很轻的投影。
 * 只用于演示外壳(桌面、Dock、通知),不属于 APP 本身。
 */

export const SQUIRCLE = { cornerShape: "squircle" } as CSSProperties;

/** 深色模式的通透玻璃:Dock、搜索条、小组件(底偏暗,高光更收敛) */
export const clearGlass: CSSProperties = {
  background: "linear-gradient(160deg, rgba(40,40,44,0.55) 0%, rgba(20,20,24,0.45) 45%, rgba(30,30,34,0.5) 100%)",
  backdropFilter: "blur(18px) saturate(180%)",
  WebkitBackdropFilter: "blur(18px) saturate(180%)",
  boxShadow: [
    "inset 0 1px 0.5px rgba(255,255,255,0.22)",
    "inset 0 -1px 0.5px rgba(255,255,255,0.06)",
    "inset 0 0 0 0.5px rgba(255,255,255,0.12)",
    "0 8px 24px rgba(0,0,0,0.3)",
  ].join(","),
};

/** 深色通知材质:通知横幅(承载白色正文,底要更实) */
export const frostedGlass: CSSProperties = {
  background: "linear-gradient(160deg, rgba(44,44,48,0.82) 0%, rgba(30,30,34,0.76) 100%)",
  backdropFilter: "blur(24px) saturate(190%)",
  WebkitBackdropFilter: "blur(24px) saturate(190%)",
  boxShadow: [
    "inset 0 1px 0.5px rgba(255,255,255,0.16)",
    "inset 0 0 0 0.5px rgba(255,255,255,0.1)",
    "0 10px 30px rgba(0,0,0,0.4)",
  ].join(","),
};

/** App 图标的玻璃边:顶部高光 + 细描边 + 底部暗边,叠在图标底色上 */
export const iconRim =
  "inset 0 1.5px 1px rgba(255,255,255,0.28), inset 0 0 0 0.5px rgba(255,255,255,0.16), inset 0 -2px 3px rgba(0,0,0,0.25), 0 3px 10px rgba(0,0,0,0.35)";

/** 图标上半部的镜面反光 */
export const iconSheen = "linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.03) 48%, rgba(255,255,255,0) 52%)";

/** iOS 26 图标:64pt,圆角更大 */
export const ICON_SIZE = 64;
export const ICON_RADIUS = 17;
