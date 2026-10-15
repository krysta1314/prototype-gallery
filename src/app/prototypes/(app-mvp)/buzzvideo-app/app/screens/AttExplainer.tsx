import { StyleSheet, Text, View } from "react-native";
import Icon from "../components/Icon";
import PrimaryButton from "../components/PrimaryButton";
import { useInsets, useStore } from "../provider";
import { colors, radius, space, type } from "../theme";

/**
 * ATT 说明页(spec §8.1):引导页之后、登录之前,先讲清用途再弹系统追踪授权框。
 * 苹果允许先放说明页,但不能用奖励诱导点 Allow,所以这里不提任何积分或优惠。
 * 只有 iOS 有这一步;Android 直接跳过
 */
export default function AttExplainer() {
  const { dispatch } = useStore();
  const insets = useInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top + space.xxxl, paddingBottom: insets.bottom + space.lg }]}>
      <View style={styles.copy}>
        <View style={styles.icon}>
          <Icon name="shield" size={28} color={colors.ink} />
        </View>
        <Text style={styles.title} accessibilityRole="header">
          Help keep BuzzVideo affordable
        </Text>
        <Text style={styles.body}>
          BuzzVideo uses this to understand which ads bring people here, so we can spend less on ads and more on the product.
        </Text>
        <Text style={styles.body}>We never sell your data. You can change this anytime in Settings.</Text>
      </View>
      <PrimaryButton label="Continue" onPress={() => dispatch({ type: "requestPermission", kind: "tracking" })} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: space.xl, justifyContent: "space-between" },
  copy: { gap: space.md },
  icon: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.grouped,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: space.sm,
  },
  title: { ...type.title1, color: colors.ink },
  body: { ...type.body, color: colors.sub },
});
