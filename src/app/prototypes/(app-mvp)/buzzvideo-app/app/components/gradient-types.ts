import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";

export type GradientProps = {
  colors: readonly string[];
  /** CSS 角度:180 = 从上到下,90 = 从左到右 */
  angle?: number;
  /** 顶部细点阵纹理(小云雀式) */
  dots?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  pointerEvents?: "none" | "auto" | "box-none";
};
