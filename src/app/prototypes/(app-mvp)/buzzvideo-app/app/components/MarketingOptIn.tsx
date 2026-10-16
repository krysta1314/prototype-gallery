import { StyleSheet, Text, View } from "react-native";
import { useInsets, useStore } from "../provider";
import { colors, elevation, radius, smoothCorners, space, type } from "../theme";
import PrimaryButton from "./PrimaryButton";

/**
 * 营销推送轻问(spec §6.3):这次会话第一条成片完成时问一次,只问一次。
 * 不是全屏遮罩;Not now 只是不开「Offers & news」,不影响生成完成的通知
 */
export default function MarketingOptIn() {
  const { state, dispatch } = useStore();
  const insets = useInsets();
  if (!state.marketingPromptOpen || !state.signedIn) return null;
  const answer = (on: boolean) => dispatch({ type: "answerMarketingPrompt", on });
  return (
    <View style={[styles.card, { bottom: insets.bottom + 92 }]} accessibilityRole="alert">
      <Text style={styles.title}>Get notified about bonus credits and new models?</Text>
      <Text style={styles.sub}>One message per campaign. Turn it off anytime in Settings.</Text>
      <View style={styles.row}>
        <PrimaryButton variant="light" size="md" label="Not now" onPress={() => answer(false)} style={styles.flex} />
        <PrimaryButton variant="dark" size="md" label="Turn on" onPress={() => answer(true)} style={styles.flex} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "absolute",
    left: space.md,
    right: space.md,
    padding: space.lg,
    gap: space.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...smoothCorners,
    boxShadow: elevation.float,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.edge,
  },
  title: { ...type.headline, color: colors.ink },
  sub: { ...type.footnote, color: colors.sub },
  row: { flexDirection: "row", gap: space.sm, marginTop: space.sm },
  flex: { flex: 1 },
});
