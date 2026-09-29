import { View } from "react-native";
import { colors, radius } from "../theme";

/** 积分图标:实心橙圆 + 一圈 1px 白色细环(用 View 画,不用字符) */
export default function Coin({ size = 14 }: { size?: number }) {
  const inset = Math.max(2, Math.round(size * 0.2));
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={{ width: size, height: size, borderRadius: radius.full, backgroundColor: colors.accent }}
    >
      <View
        style={{
          position: "absolute",
          top: inset,
          left: inset,
          right: inset,
          bottom: inset,
          borderRadius: radius.full,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.9)",
        }}
      />
    </View>
  );
}
