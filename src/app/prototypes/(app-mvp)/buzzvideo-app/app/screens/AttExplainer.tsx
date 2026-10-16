import { Image, StyleSheet, Text, View } from "react-native";
import Icon from "../components/Icon";
import PrimaryButton from "../components/PrimaryButton";
import { A } from "../data";
import { useInsets, useStore } from "../provider";
import { colors, radius, smoothCorners, space, type } from "../theme";

/**
 * ATT 说明页(spec §8.1):引导页之后、登录之前,先讲清用途再弹系统追踪授权框。
 * 0.5s:一条你点过的广告,一根虚线连到 BuzzVideo 图标 —— 用一张图讲清「我们只知道是哪条广告带你来的」,
 * 而不是图标 + 两段文字。苹果允许先放说明页,但不能用奖励诱导点 Allow,所以这里不提任何积分或优惠。
 * 只有 iOS 有这一步;Android 直接跳过
 */
export default function AttExplainer() {
  const { dispatch } = useStore();
  const insets = useInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top + space.xxl, paddingBottom: insets.bottom + space.lg }]}>
      <View style={styles.diagram} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={styles.node}>
          <Image source={{ uri: `${A}/usecase-latte.jpg` }} style={styles.ad} resizeMode="cover" />
          <Text style={styles.nodeLabel}>An ad you tapped</Text>
        </View>
        <View style={styles.link}>
          <View style={styles.dash} />
          <Icon name="chevron-right" size={16} color={colors.faint} />
        </View>
        <View style={styles.node}>
          {/* 和桌面上的 APP 图标一样:白底圆角 + 原版 logo(logo 本身不改,只给底色) */}
          <View style={styles.appIcon}>
            <Image source={{ uri: `${A}/app-logo.svg` }} style={styles.logo} resizeMode="contain" />
          </View>
          <Text style={styles.nodeLabel}>BuzzVideo</Text>
        </View>
      </View>
      <View style={styles.learn}>
        <Icon name="shield" size={14} color={colors.sub} />
        <Text style={styles.learnText}>We only learn which ad brought you here</Text>
      </View>

      <View style={styles.copy}>
        <Text style={styles.title} accessibilityRole="header">
          Help keep BuzzVideo affordable
        </Text>
        <Text style={styles.body}>Knowing which ads work lets us spend less on ads and more on the product.</Text>
        <Text style={styles.privacy}>We never sell your data. You can change this anytime in Settings.</Text>
      </View>
      <PrimaryButton label="Continue" onPress={() => dispatch({ type: "requestPermission", kind: "tracking" })} />
    </View>
  );
}

const AD_W = 96;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: space.xl },
  diagram: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.md, marginTop: space.xxxl + space.xl },
  node: { alignItems: "center", gap: space.sm },
  ad: { width: AD_W, height: AD_W * (16 / 9) * 0.8, borderRadius: radius.md, ...smoothCorners },
  appIcon: { width: 72, height: 72, borderRadius: 18, backgroundColor: colors.white, alignItems: "center", justifyContent: "center", ...smoothCorners },
  logo: { width: 48, height: 48 },
  nodeLabel: { ...type.footnote, color: colors.sub },
  link: { flexDirection: "row", alignItems: "center", marginBottom: space.xl },
  dash: { width: 44, borderTopWidth: 1.5, borderStyle: "dashed", borderColor: colors.faint },
  learn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "center",
    marginTop: space.xl,
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.grouped,
  },
  learnText: { ...type.footnote, color: colors.sub },
  copy: { marginTop: "auto", gap: space.md, marginBottom: space.xl },
  title: { ...type.title1, color: colors.ink },
  body: { ...type.body, color: colors.sub },
  privacy: { ...type.footnote, color: colors.sub },
});
