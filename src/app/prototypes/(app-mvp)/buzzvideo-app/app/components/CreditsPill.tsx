import { Pressable, StyleSheet, Text, View } from "react-native";
import { useNav, useStore } from "../provider";
import { canManageMembers, isEnterprise, isSubscribed } from "../store";
import { colors, radius, type } from "../theme";
import Coin from "./Coin";
import CountingNumber from "./CountingNumber";
import { pressScale } from "./motion";

/**
 * 右上角积分胶囊:半透明深底 + coin + 数字(点了去 Me)。
 * Free 用户(2026-10-22,参照即梦「40 | 优惠开会员」):胶囊右半边多一段「Upgrade」,中间细竖线隔开，点这一段直接开付费墙;
 * 付费会员只显示积分。组织空间里只有 Owner / Admin 看得到组织积分;普通成员不显示(2026-10-20 定)
 * tone:onImage = 压在 Banner 图上(深色半透明毛玻璃);page = 放在纯色页面上(亮一档的实底 + 细亮边，参照即梦白胶囊放在浅灰页面上)
 */
export default function CreditsPill({ tone = "onImage" }: { tone?: "onImage" | "page" }) {
  const { state, dispatch } = useStore();
  const { navigate } = useNav();
  if (state.workspace !== "personal" && !canManageMembers(state)) return null;
  const balance = state.credits[state.workspace];
  const n = balance.toLocaleString("en-US");
  const free = state.workspace === "personal" && !isSubscribed(state) && !isEnterprise(state);
  return (
    <View style={[styles.pill, tone === "page" ? styles.onPage : styles.onImage]}>
      <Pressable onPress={() => navigate({ type: "tab", tab: "me" })} hitSlop={6} accessibilityLabel={`${n} credits`} style={({ pressed }) => [styles.part, pressScale(pressed)]}>
        <Coin size={14} />
        <CountingNumber value={balance} style={styles.text} />
      </Pressable>
      {free ? (
        <>
          <View style={styles.divider} />
          <Pressable
            onPress={() => dispatch({ type: "openPaywall", trigger: "manual" })}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel="Upgrade"
            style={({ pressed }) => [styles.part, pressScale(pressed)]}
          >
            <Text style={styles.upgrade}>Upgrade</Text>
          </Pressable>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { flexDirection: "row", alignItems: "center", height: 32, paddingHorizontal: 12, borderRadius: radius.full },
  onImage: { backgroundColor: "rgba(0,0,0,0.38)", backdropFilter: "blur(12px)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.18)" } as object,
  onPage: { backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.12)", boxShadow: "0 2px 10px rgba(0,0,0,0.35)" },
  part: { flexDirection: "row", alignItems: "center", gap: 6, height: 32 },
  text: { ...type.footnote, fontWeight: "600", color: colors.white, fontVariant: ["tabular-nums"] },
  divider: { width: StyleSheet.hairlineWidth, height: 14, marginHorizontal: 10, backgroundColor: "rgba(255,255,255,0.28)" },
  upgrade: { ...type.footnote, fontWeight: "600", color: colors.white },
});
