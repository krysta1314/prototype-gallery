import { Pressable, StyleSheet, Text, View } from "react-native";
import { exitOfferLive } from "../../../buzzvideo-app/app/store";
import { countdown, useNow } from "../../../buzzvideo-app/app/components/useNow";
import { gz } from "../../kit/gz";
import { Icon, useStore } from "../v1";

const c = gz.color;

/**
 * 挽留优惠 24 小时内的回访入口(逻辑同第一版 ExitOfferBanner):首页底部栏正上方，真实倒计时，点开重新打开挽留页;到期 / 买了自动消失。
 * 新版设计样式：和挽留页同一张黄油色券(白模切边，放正不歪)，左边大字 50% OFF,中间倒计时，右边黑色 Claim。
 * (2026-11-11 试过橙色票根，Monica 要求换回这一版)
 */
export default function ExitOfferBannerS() {
  const { state, dispatch } = useStore();
  const now = useNow();
  if (!exitOfferLive(state, now) || state.exitOfferOpen) return null;
  const left = countdown(state.exitOfferExpiresAt - now);
  return (
    <Pressable
      onPress={() => dispatch({ type: "openExitOffer", now: Date.now() })}
      accessibilityRole="button"
      accessibilityLabel={`50% off your first month, expires in ${left}. Claim offer`}
      style={({ pressed }) => [styles.wrap, pressed && { transform: [{ scale: 0.98 }] }]}
    >
      <View style={styles.coupon}>
        <Text style={[gz.display.title, styles.off]}>{"50%\nOFF"}</Text>
        <View style={styles.mid}>
          <Text style={[gz.body.caption, { color: c.ink, opacity: 0.75 }]}>Your gift expires in</Text>
          <Text style={[gz.display.title, styles.clock]}>{left}</Text>
        </View>
        <View style={styles.claim}>
          <Text style={[gz.display.label, { color: c.white }]}>Claim</Text>
          <Icon name="chevron-right" size={14} color={c.white} strokeWidth={2.8} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // 压在首页视频上，底部栏正上方
  wrap: { position: "absolute", left: 12, right: 12, bottom: 10, zIndex: 20 },
  coupon: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, backgroundColor: c.butter, borderWidth: gz.cut, borderColor: c.white },
  off: { color: c.ink, fontSize: 18, lineHeight: 18 },
  mid: { flex: 1, gap: 2 },
  clock: { color: c.ink, fontVariant: ["tabular-nums"] },
  claim: { flexDirection: "row", alignItems: "center", gap: 2, height: 34, paddingLeft: 14, paddingRight: 10, borderRadius: 999, backgroundColor: c.ink },
});
