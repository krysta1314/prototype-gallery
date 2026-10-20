import { Pressable, StyleSheet, Text } from "react-native";
import { useInsets, useStore } from "../provider";
import { exitOfferLive } from "../store";
import { colors, radius, space, type } from "../theme";
import { countdown, useNow } from "./useNow";

/**
 * 挽留优惠 24 小时内的回访入口(spec §4):首页 Tab 栏上方一条细胶囊,真实倒计时,点开重新打开挽留页;到期自动消失
 */
export default function ExitOfferBanner() {
  const { state, dispatch } = useStore();
  const insets = useInsets();
  const now = useNow();
  if (!exitOfferLive(state, now) || state.exitOfferOpen) return null;
  return (
    <Pressable
      onPress={() => dispatch({ type: "openExitOffer", now: Date.now() })}
      accessibilityRole="button"
      hitSlop={7}
      // 放在 Tab 栏上方,不挡首页顶部的 Banner 和积分胶囊
      style={({ pressed }) => [styles.bar, { bottom: insets.bottom + 64 }, pressed && styles.pressed]}
    >
      <Text style={styles.text} numberOfLines={1}>
        {`50% off your first month · ends in ${countdown(state.exitOfferExpiresAt - now)} ›`}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    alignSelf: "center",
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.inverse,
  },
  pressed: { opacity: 0.85 },
  text: { ...type.footnote, fontWeight: "600", color: colors.onInverse, fontVariant: ["tabular-nums"] },
});
