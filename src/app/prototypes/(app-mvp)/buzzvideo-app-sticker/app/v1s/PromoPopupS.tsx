import { Animated, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { GZButton, GZIconButton, GZSticker, gz, useSlap } from "../../kit/gz";
import type { PromoCampaign } from "../../../buzzvideo-app/app/data";
import { Icon, useStore } from "../v1";

const c = gz.color;

/**
 * 首页运营弹窗 · 贴纸风(逻辑同第一版 components/PromoPopup,spec §6.2):和 admin 营销活动同一套模板 ——
 * 媒体 → 标题 → 描述 → 最多 3 条「粗体一行 + 灰色一行」→ 一个大 CTA。只送积分不打折;CTA 进付费墙。频控由 store 决定。
 * 样子：深灰卡片啪地贴上;图上压一张大的黄油色「+N% credits」贴纸(黄油 = 积分 / 加赠)代替第一版的渐变压暗 + 白字;
 * 每条权益前一颗黄油色硬币圆点;唯一的橙色主按钮
 */
export default function PromoPopup() {
  const { state, dispatch } = useStore();
  const c0 = state.activePromo;
  if (!c0 || state.promoOpen !== c0.id) return null;
  return <PromoCard c0={c0} close={() => dispatch({ type: "dismissPromo" })} onCta={() => dispatch({ type: "promoCta" })} />;
}

/** 打开时才挂载，「啪」地贴上的动效每次打开都播 */
function PromoCard({ c0, close, onCta }: { c0: PromoCampaign; close: () => void; onCta: () => void }) {
  const slap = useSlap();
  return (
    <View style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Close" />
      <Animated.View style={[styles.cardWrap, slap]}>
        <View style={styles.card} accessibilityViewIsModal>
          <View style={styles.media}>
            <Image source={{ uri: c0.media }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            {/* 弹窗图要带大字：活动力度做成贴纸压在图的左下(不压主体) */}
            <View style={styles.mediaCopy}>
              <GZSticker label={c0.kicker} color="white" size="s" rotate={-4} />
              <GZSticker label={`+${c0.bonusPct}% credits`} color="butter" size="l" rotate={-3} style={styles.bigSticker} />
            </View>
            <View style={styles.close}>
              <GZIconButton icon="x" onVideo size={36} onPress={close} label="Close" />
            </View>
          </View>
          <View style={styles.body}>
            <Text style={[gz.display.title, { color: c.white }]} accessibilityRole="header">
              {c0.title}
            </Text>
            <Text style={[gz.body.caption, { color: c.text2, marginBottom: 4 }]}>{c0.description}</Text>
            {c0.items.slice(0, 3).map((it) => (
              <View key={it.title} style={styles.item}>
                <View style={styles.dot}>
                  <Icon name="check" size={11} color={c.ink} strokeWidth={3.4} />
                </View>
                <View style={{ flex: 1, gap: 1 }}>
                  <Text style={[gz.display.label, { color: c.white }]}>{it.title}</Text>
                  <Text style={[gz.body.caption, { color: c.text2 }]}>{it.subtitle}</Text>
                </View>
              </View>
            ))}
            <GZButton label={c0.ctaText} onPress={onCta} style={{ marginTop: 8 }} />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", padding: 24 },
  cardWrap: { width: "100%", maxWidth: 340 },
  card: { backgroundColor: c.surface, borderRadius: 24, overflow: "hidden" },
  media: { height: 190, backgroundColor: c.raised },
  mediaCopy: { position: "absolute", left: 14, bottom: 14, gap: 6 },
  bigSticker: { height: 46, paddingHorizontal: 14 },
  close: { position: "absolute", top: 10, right: 10 },
  body: { padding: 16, paddingTop: 18, gap: 10 },
  item: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  dot: { width: 18, height: 18, borderRadius: 9, backgroundColor: c.butter, alignItems: "center", justifyContent: "center", marginTop: 1 },
});
