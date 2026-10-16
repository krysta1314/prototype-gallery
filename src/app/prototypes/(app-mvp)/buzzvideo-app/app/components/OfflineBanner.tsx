import { StyleSheet, Text, View } from "react-native";
import { useInsets, useStore } from "../provider";
import { colors, radius, space, type } from "../theme";
import Icon from "./Icon";

/** 断网时状态栏下方的常驻提示;恢复网络后自动消失。断网期间提交、购买、登录都会被拦下并提示 */
export default function OfflineBanner() {
  const { state } = useStore();
  const insets = useInsets();
  if (!state.faults.offline) return null;
  return (
    <View style={[styles.wrap, { top: insets.top + space.xs, pointerEvents: "none" }]} accessibilityLiveRegion="polite">
      <View style={styles.pill}>
        <Icon name="circle-alert" size={14} color={colors.white} />
        <Text style={styles.text}>No internet connection</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.xs,
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: "rgba(62,62,72,0.96)",
  },
  text: { ...type.footnote, fontWeight: "600", color: colors.white },
});
