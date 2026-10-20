import { StyleSheet, Text, View } from "react-native";
import { useStore } from "../provider";
import { colors, radius, space, type } from "../theme";
import PrimaryButton from "./PrimaryButton";

/**
 * 拿不到 App Store 价格(断网或拉价失败)时代替价格选项和购买按钮:
 * 骨架 + 说明 + Retry,不显示写死的价格,也不能购买(spec §2.5)
 */
export default function PriceError({ rows = 2, light }: { rows?: number; /** 放在浅色面板上(付费墙) */ light?: boolean }) {
  const { state, dispatch } = useStore();
  const retry = () =>
    dispatch({ type: "showToast", text: state.faults.offline ? "Still offline. Check your connection." : "Still couldn't load prices. Try again later." });
  return (
    <View style={styles.wrap}>
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} style={[styles.skeleton, light && styles.skeletonLight]} />
      ))}
      <Text style={[styles.text, light && styles.textLight]}>{state.faults.offline ? "You're offline, so we can't show prices." : "Couldn't load prices."}</Text>
      <PrimaryButton label="Retry" variant={light ? "cta" : "white"} onPress={retry} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  skeleton: { height: 56, borderRadius: radius.md, backgroundColor: colors.grouped },
  text: { ...type.subhead, color: colors.sub, textAlign: "center", marginVertical: space.xs },
  skeletonLight: { backgroundColor: "#f2f2f6" },
  textLight: { color: "#5f6070" },
});
