import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Gradient from "../components/Gradient";
import Sheet from "../components/Sheet";
import { pressScale } from "../components/motion";
import { A, MODES, type Mode } from "../data";
import { useNav, useStore } from "../provider";
import { colors, fill, radius, selectedBox, smoothCorners, space, type } from "../theme";

/** 横幅右半边的成品图：这个模式做出来的样子(音频没有画面，用画出来的声波卡，见 AudioArt) */
const PREVIEW: Record<Exclude<Mode, "audio">, string> = {
  agent: `${A}/usecase-latte.jpg`,
  image: `${A}/usecase-lipstick.jpg`,
  video: `${A}/usecase-skincare.jpg`,
  hybrid: `${A}/photo-3.jpg`,
};
/** 右上角运营标签：Hot = 最多人用，New = 新上(真实 APP 由后台配置) */
const BADGE: Partial<Record<Mode, "Hot" | "New">> = { agent: "Hot", hybrid: "New" };
/** 声波柱高度(0–1),固定一组，看起来像一段人声 */
const WAVE = [0.3, 0.55, 0.8, 0.45, 0.95, 0.6, 0.35, 0.7, 1, 0.5, 0.75, 0.4, 0.65, 0.3, 0.5];

/**
 * 创作模式(2026-10-22 定 E 横幅;试过一行两张卡，又换回来):每个模式一条横幅，左边名字 + 做出什么(可换两行),
 * 右半边是成品图渐隐进来;右上角 Hot / New 运营标签;选中只亮边。不在面板上标套餐(Free 选了视频类模式，发送时再弹付费墙)。
 * Hybrid Reel 开放可用：选了之后如果还没放素材，直接弹「+」面板让用户先放自己的实拍片段
 */
export default function ModeSheet({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  const { navigate } = useNav();
  const current = state.composer.mode;
  const pick = (m: Mode) => {
    // 只改模式：默认模型由 store 按套餐选(没锁的第一个)
    dispatch({ type: "setComposer", patch: { mode: m } });
    onClose();
    if (m === "hybrid" && state.composer.attachments.length === 0) navigate({ type: "sheet", sheet: { name: "attach" } });
  };

  return (
    <Sheet title="Creation mode" onClose={onClose}>
      <View style={styles.list}>
        {MODES.map((m) => {
          const on = current === m.id;
          const badge = BADGE[m.id];
          return (
            <Pressable
              key={m.id}
              onPress={() => pick(m.id)}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              style={({ pressed }) => [styles.banner, on && styles.bannerOn, pressScale(pressed)]}
            >
              {m.id === "audio" ? <AudioArt /> : <Image source={{ uri: PREVIEW[m.id] }} style={styles.img} resizeMode="cover" />}
              <Gradient colors={[colors.grouped, colors.grouped, "rgba(26,26,32,0.92)", "rgba(26,26,32,0)"]} angle={90} style={styles.fade} pointerEvents="none" />
              <View style={styles.text}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{m.title}</Text>
                  {m.tag ? <Text style={styles.tag}>{m.tag}</Text> : null}
                </View>
                <Text style={styles.outcome} numberOfLines={2}>
                  {m.outcome}
                </Text>
              </View>
              {badge ? (
                <View style={[styles.badge, badge === "Hot" && styles.badgeHot]}>
                  <Text style={[styles.badgeText, badge === "Hot" && styles.badgeTextHot]}>{badge}</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </Sheet>
  );
}

/** Audio 横幅右半边：固定画的一张声波卡(深青到紫的渐变 + 声波柱),里面三张小标签 Voiceover / Music / SFX */
function AudioArt() {
  return (
    <View style={styles.img}>
      <Gradient colors={["#1f6f6a", "#3b2a6e"]} angle={120} style={StyleSheet.absoluteFill} pointerEvents="none" />
      <View style={styles.wave}>
        {WAVE.map((h, i) => (
          <View key={i} style={[styles.waveBar, { height: `${h * 100}%` }]} />
        ))}
      </View>
      <View style={styles.audioTags}>
        {["Voiceover", "Music", "SFX"].map((t) => (
          <Text key={t} style={styles.audioTag}>
            {t}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: space.sm, paddingTop: space.xs },
  banner: { minHeight: 76, borderRadius: radius.lg, overflow: "hidden", backgroundColor: colors.grouped, borderWidth: 1.5, borderColor: "transparent", justifyContent: "center", ...smoothCorners },
  bannerOn: selectedBox,
  // 图占右边 60%(从卡片约 40% 处开始),左边文字区压暗：说明文字不会压到亮图上
  // 图的左边缘再羽化一小段(约 40pt):和左边压暗区之间是柔和过渡，没有一条硬边
  img: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: "60%",
    maskImage: "linear-gradient(to right, transparent 0%, #000 22%)",
    WebkitMaskImage: "linear-gradient(to right, transparent 0%, #000 22%)",
  } as object,
  fade: { position: "absolute", left: 0, top: 0, bottom: 0, width: "55%" },
  // 描述可以换行(最多两行),文字区收到图片左边，不压图
  text: { paddingHorizontal: space.lg, paddingVertical: space.md, maxWidth: "66%" },
  name: { ...type.subhead, fontWeight: "700", color: colors.ink },
  // 描述窄一点(约卡片 40% 处就换行),和右边的图之间留出空
  outcome: { ...type.footnote, color: colors.sub, marginTop: 3, maxWidth: 170 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap", rowGap: 3 },
  // 名字旁的灰色小标签(像即梦「分钟级成片」)
  tag: { ...type.caption, lineHeight: 18, fontWeight: "600", color: colors.sub, paddingHorizontal: 7, borderRadius: radius.full, overflow: "hidden", backgroundColor: fill.base },
  // 右上角运营标签:New 白底黑字,Hot 品牌橙底白字
  badge: { position: "absolute", top: 8, right: 8, height: 18, paddingHorizontal: 7, borderRadius: radius.full, backgroundColor: colors.inverse, justifyContent: "center" },
  badgeHot: { backgroundColor: colors.accent },
  badgeText: { ...type.caption, fontWeight: "800", color: colors.onInverse },
  badgeTextHot: { color: colors.white },
  wave: { position: "absolute", left: 28, right: 12, top: 12, bottom: 30, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  waveBar: { width: 3, borderRadius: radius.xs, backgroundColor: "rgba(255,255,255,0.75)" },
  audioTags: { position: "absolute", left: 8, right: 8, bottom: 8, flexDirection: "row", gap: 4, justifyContent: "flex-end" },
  audioTag: { flexShrink: 0, whiteSpace: "nowrap", ...type.caption, lineHeight: 16, fontWeight: "700", color: colors.white, paddingHorizontal: 6, borderRadius: radius.full, overflow: "hidden", backgroundColor: fill.strong } as object,
});
