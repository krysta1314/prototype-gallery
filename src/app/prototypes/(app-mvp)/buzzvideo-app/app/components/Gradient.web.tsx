import { StyleSheet, View } from "react-native";
import type { GradientProps } from "./gradient-types";

const DOTS = "radial-gradient(rgba(255,94,26,0.16) 1px, transparent 1.4px)";
const FADE = "linear-gradient(to bottom, black, transparent)";

export default function Gradient({ colors, angle = 180, dots, style, children, pointerEvents }: GradientProps) {
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
      {dots && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: 260,
            zIndex: -1,
            pointerEvents: "none",
            backgroundImage: DOTS,
            backgroundSize: "14px 14px",
            WebkitMaskImage: FADE,
            maskImage: FADE,
          }}
        />
      )}
      {children}
    </View>
  );
}

// zIndex:0 建立层叠上下文,让 zIndex:-1 的背景层留在本组件内部
const styles = StyleSheet.create({ ctx: { zIndex: 0 } });
