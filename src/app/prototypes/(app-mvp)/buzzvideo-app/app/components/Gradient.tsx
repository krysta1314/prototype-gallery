import { View } from "react-native";
import type { GradientProps } from "./gradient-types";

/* 原生端:真实 APP 用 expo-linear-gradient 替换,这里先用末端色兜底 */
export default function Gradient({ colors, style, children, pointerEvents }: GradientProps) {
  return (
    <View style={[{ backgroundColor: colors[colors.length - 1] }, pointerEvents ? { pointerEvents } : null, style]}>
      {children}
    </View>
  );
}
