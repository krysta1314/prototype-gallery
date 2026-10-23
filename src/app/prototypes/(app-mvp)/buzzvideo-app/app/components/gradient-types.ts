import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";

export type GradientProps = {
  colors: readonly string[];
  /** CSS 角度:180 = 从上到下,90 = 从左到右 */
  angle?: number;
  /** 网页端：改用径向渐变，写 CSS radial-gradient 的括号内参数(不含颜色),如 "circle at 20% 0%";原生端退回线性 */
  radial?: string;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  pointerEvents?: "none" | "auto" | "box-none";
};
