import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useInsets, useStore } from "../provider";
import { colors, elevation, radius, type } from "../theme";

/**
 * 全局提示：从顶部出现(灵动岛下方),约 2 秒后自动消失(2026-10-20 定，APP 里的提示统一用它)。
 * 样式定为纯文字胶囊(方案 A):一行时全圆角;文案折成两行时改成 16pt 圆角矩形，避免两头鼓成大半圆
 */
export default function Toast() {
  const { state } = useStore();
  const insets = useInsets();
  const [multiline, setMultiline] = useState(false);
  if (!state.toast) return null;
  return (
    <View style={[styles.wrap, { top: insets.top + 8, pointerEvents: "none" }]} accessibilityLiveRegion="polite">
      <View style={[styles.toast, multiline && styles.toastMultiline]}>
        <Text style={styles.text} onLayout={(e) => setMultiline(e.nativeEvent.layout.height > (type.footnote.lineHeight ?? 18) * 1.5)}>
          {state.toast}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 0, right: 0, alignItems: "center", zIndex: 60 },
  toast: {
    maxWidth: "86%",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.full,
    backgroundColor: "rgba(62,62,72,0.96)",
    boxShadow: elevation.float,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.edge,
  },
  toastMultiline: { borderRadius: radius.lg },
  text: { ...type.footnote, fontWeight: "500", color: colors.white, textAlign: "center" },
});
