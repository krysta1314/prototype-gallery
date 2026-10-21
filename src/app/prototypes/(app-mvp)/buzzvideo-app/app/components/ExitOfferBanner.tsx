import { Pressable, StyleSheet, Text, View } from "react-native";
import { useInsets, useStore } from "../provider";
import { exitOfferLive } from "../store";
import { colors, ctaGradient, radius } from "../theme";
import Gradient from "./Gradient";
import Icon from "./Icon";
import { tabBarSpace } from "./TabBar";
import { countdown, useNow } from "./useNow";

const ORANGE = "#e8430c";

/**
 * 挽留优惠 24 小时内的回访入口(spec §4):首页 Tab 栏上方，真实倒计时，点开重新打开挽留页;到期自动消失。
 * 版式(2026-10-20 从 4 个方案里定了 A「品牌条」,替换原来的细胶囊):和挽留页同一张品牌渐变底，
 * 左边大字「50% OFF」,中间大号倒计时，右边白色 Claim
 */
export default function ExitOfferBanner() {
  const { state, dispatch } = useStore();
  const insets = useInsets();
  const now = useNow();
  if (!exitOfferLive(state, now) || state.exitOfferOpen) return null;
  const left = countdown(state.exitOfferExpiresAt - now);
  return (
    <Pressable
      onPress={() => dispatch({ type: "openExitOffer", now: Date.now() })}
      accessibilityRole="button"
      accessibilityLabel={`50% off your first month, expires in ${left}. Claim offer`}
      // 压在首页内容上、悬浮 Tab 栏胶囊正上方 8px，不挡首页顶部的 Banner 和积分胶囊
      style={({ pressed }) => [styles.wrap, { bottom: tabBarSpace(insets.bottom) }, pressed && styles.pressed]}
    >
      <Gradient colors={[ctaGradient[1], ctaGradient[0]]} angle={110} style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.bigOff}>{"50%\nOFF"}</Text>
          <View style={styles.mid}>
            <Text style={styles.kick}>Your gift expires in</Text>
            <Text style={styles.clock}>{left}</Text>
          </View>
          <View style={styles.claim}>
            <Text style={styles.claimText}>Claim</Text>
            <Icon name="chevron-right" size={14} color={ORANGE} strokeWidth={2.6} />
          </View>
        </View>
      </Gradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // 左右各留 12,下面就是 Tab 栏
  wrap: { position: "absolute", left: 12, right: 12 },
  pressed: { opacity: 0.88 },
  card: { borderRadius: 18, overflow: "hidden", paddingHorizontal: 14, paddingVertical: 10, boxShadow: "0 10px 24px rgba(0,0,0,0.45)" } as object,
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  mid: { flex: 1, gap: 1 },
  bigOff: { fontSize: 20, lineHeight: 19, fontWeight: "900", color: colors.white, letterSpacing: -0.5 },
  kick: { fontSize: 12, lineHeight: 16, fontWeight: "600", color: "rgba(255,255,255,0.92)" },
  clock: { fontSize: 24, lineHeight: 28, fontWeight: "800", color: colors.white, fontVariant: ["tabular-nums"], letterSpacing: -0.5 },
  claim: { flexDirection: "row", alignItems: "center", gap: 2, height: 34, paddingLeft: 14, paddingRight: 10, borderRadius: radius.full, backgroundColor: colors.white },
  claimText: { fontSize: 15, lineHeight: 20, fontWeight: "700", color: ORANGE },
});
