import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useStore } from "../provider";
import { colors, radius, smoothCorners, space, type } from "../theme";
import Gradient from "./Gradient";
import IconButton from "./IconButton";
import PrimaryButton from "./PrimaryButton";

/**
 * 首页运营弹窗(spec §6.2):和 admin 营销活动同一套模板 ——
 * 媒体 → 标题 → 描述 → 最多 3 条「粗体一行 + 灰色一行」→ 一个大 CTA。
 * 只送积分不打折;CTA 进付费墙(付费墙上显示加赠后的积分)。频控与「同天不叠加付费墙」由 store 决定
 */
export default function PromoPopup() {
  const { state, dispatch } = useStore();
  const c = state.activePromo;
  if (!c || state.promoOpen !== c.id) return null;
  const close = () => dispatch({ type: "dismissPromo" });
  return (
    <View style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Close" />
      <View style={styles.card} accessibilityViewIsModal>
        <View style={styles.media}>
          <Image source={{ uri: c.media }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <Gradient colors={["rgba(10,10,16,0)", "rgba(10,10,16,0.75)"]} style={StyleSheet.absoluteFill} pointerEvents="none" />
          {/* 弹窗图要带大字:在图上直接写活动力度 */}
          <View style={styles.mediaCopy}>
            <Text style={styles.kicker}>{c.kicker}</Text>
            <Text style={styles.big}>{`+${c.bonusPct}% credits`}</Text>
          </View>
          <View style={styles.close}>
            <IconButton icon="x" tone="onImage" onPress={close} accessibilityLabel="Close" />
          </View>
        </View>
        <View style={styles.body}>
          <Text style={styles.title} accessibilityRole="header">
            {c.title}
          </Text>
          <Text style={styles.desc}>{c.description}</Text>
          {c.items.slice(0, 3).map((it) => (
            <View key={it.title} style={styles.item}>
              <Text style={styles.itemTitle}>{it.title}</Text>
              <Text style={styles.itemSub}>{it.subtitle}</Text>
            </View>
          ))}
          <PrimaryButton label={c.ctaText} onPress={() => dispatch({ type: "promoCta" })} style={styles.cta} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.scrim, alignItems: "center", justifyContent: "center", padding: space.xl },
  card: { width: "100%", maxWidth: 340, backgroundColor: colors.surface, borderRadius: radius.lg, ...smoothCorners, overflow: "hidden" },
  media: { height: 190 },
  mediaCopy: { position: "absolute", left: space.lg, bottom: space.md, gap: 2 },
  kicker: { ...type.footnote, fontWeight: "600", color: "rgba(255,255,255,0.85)" },
  big: { fontSize: 34, lineHeight: 38, fontWeight: "700", letterSpacing: -0.6, color: colors.white },
  close: { position: "absolute", top: space.xs, right: space.xs },
  body: { padding: space.lg, gap: space.sm },
  title: { ...type.headline, color: colors.ink },
  desc: { ...type.subhead, color: colors.sub, marginBottom: space.xs },
  item: { gap: 1 },
  itemTitle: { ...type.subhead, fontWeight: "600", color: colors.ink },
  itemSub: { ...type.footnote, color: colors.sub },
  cta: { marginTop: space.sm },
});
