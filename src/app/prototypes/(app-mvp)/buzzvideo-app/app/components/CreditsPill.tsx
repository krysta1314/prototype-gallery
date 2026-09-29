import { Pressable, StyleSheet, Text } from "react-native";
import { useNav, useStore } from "../provider";
import { colors, radius, type } from "../theme";
import Coin from "./Coin";
import { pressScale } from "./motion";

/** 压在 Banner 图上的积分胶囊:半透明深底 + coin + 数字 */
export default function CreditsPill() {
  const { state } = useStore();
  const { navigate } = useNav();
  const n = state.credits[state.workspace].toLocaleString("en-US");
  return (
    <Pressable
      onPress={() => navigate({ type: "tab", tab: "me" })}
      hitSlop={6}
      accessibilityLabel={`${n} credits`}
      style={({ pressed }) => [styles.pill, pressScale(pressed)]}
    >
      <Coin size={14} />
      <Text style={styles.text}>{n}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 32,
    paddingHorizontal: 10,
    borderRadius: radius.full,
    backgroundColor: colors.onImage,
  },
  text: { ...type.footnote, fontWeight: "600", color: colors.white, fontVariant: ["tabular-nums"] },
});
