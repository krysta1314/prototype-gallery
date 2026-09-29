import { StyleSheet, View } from "react-native";
import type { GradientProps } from "./gradient-types";

export default function Gradient({ colors, angle = 180, style, children, pointerEvents }: GradientProps) {
  return (
    <View style={[styles.ctx, pointerEvents ? { pointerEvents } : null, style]}>
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          zIndex: -1,
          borderRadius: "inherit",
          pointerEvents: "none",
          backgroundImage: `linear-gradient(${angle}deg, ${colors.join(", ")})`,
        }}
      />
      {children}
    </View>
  );
}

// zIndex:0 建立层叠上下文,让 zIndex:-1 的背景层留在本组件内部
const styles = StyleSheet.create({ ctx: { zIndex: 0 } });
