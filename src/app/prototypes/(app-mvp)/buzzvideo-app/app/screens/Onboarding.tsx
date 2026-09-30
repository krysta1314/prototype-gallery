import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, Pressable, StyleSheet, Text, View, type ImageStyle, type ViewStyle } from "react-native";
import Icon from "../components/Icon";
import MediaVideo from "../components/MediaVideo";
import { prefersReducedMotion, pressScale } from "../components/motion";
import { A, type IconName } from "../data";
import { useInsets, useStore } from "../provider";
import { colors, radius, smoothCorners, space, type } from "../theme";

/**
 * 首次打开:单页拼贴(参照海螺 AI)。黑底,上半屏是错落的成片卡片 —— 中间一张主视觉,
 * 四周是 Image / Video / Agent 三张带标签的小卡,外加一条音频波形;下半屏是大标题、说明和白色胶囊按钮。
 * 点 Get started 进入隐私弹窗。卡片依次淡入上浮,系统开了「减少动态效果」时直接出现。
 *
 * 拼贴坐标按 402pt 宽的屏幕设计(单位 pt),实际按屏宽等比缩放;左右两侧的卡片故意出血。
 */
const DESIGN_W = 402;
/** 拼贴区高度(设计稿 pt) */
const COLLAGE_H = 500;

type Box = { left: number; top: number; width: number; height: number };
type Card = Box & { key: string; poster: string; video?: string; chip?: { icon: IconName; label: string }; muteBadge?: boolean };

const HERO: Card = { key: "hero", left: 70, top: 82, width: 262, height: 372, poster: `${A}/result-agent.jpg`, video: `${A}/result-agent.mp4` };
const CARDS: Card[] = [
  { key: "image", left: 22, top: 28, width: 110, height: 164, poster: `${A}/result-image.jpg`, chip: { icon: "image", label: "Image" } },
  { key: "audio", left: 288, top: 0, width: 130, height: 132, poster: `${A}/usecase-ramen.jpg`, muteBadge: true },
  { key: "video", left: -16, top: 276, width: 130, height: 180, poster: `${A}/result-video.jpg`, video: `${A}/result-video.mp4`, chip: { icon: "clapperboard", label: "Video" } },
  { key: "agent", left: 292, top: 298, width: 124, height: 176, poster: `${A}/usecase-opening.jpg`, chip: { icon: "message-square-text", label: "Agent" } },
];
/** 音频波形胶囊:压在右上卡片下沿 */
const WAVE: Box = { left: 252, top: 134, width: 170, height: 44 };
const WAVE_BARS = [8, 14, 22, 12, 28, 18, 10, 24, 30, 16, 20, 12, 26, 14, 8, 18, 24, 10, 16, 22];
/** 主视觉下沿的标语胶囊 */
const TAGLINE_TOP = 438;

const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);

export default function Onboarding() {
  const { dispatch } = useStore();
  const insets = useInsets();
  const [width, setWidth] = useState(DESIGN_W);
  const k = width / DESIGN_W;
  const px = (b: Box): ViewStyle => ({ left: b.left * k, top: b.top * k, width: b.width * k, height: b.height * k });

  // 入场:主视觉先出,四周卡片依次跟上,最后是文案和按钮
  const layers = useRef([0, 1, 2, 3, 4, 5, 6].map(() => new Animated.Value(0))).current;
  useEffect(() => {
    if (prefersReducedMotion()) {
      layers.forEach((v) => v.setValue(1));
      return;
    }
    const anim = Animated.stagger(
      70,
      layers.map((v) => Animated.timing(v, { toValue: 1, duration: 520, easing: EASE_OUT, useNativeDriver: false })),
    );
    anim.start();
    return () => anim.stop();
  }, [layers]);
  const rise = (i: number) => ({
    opacity: layers[i],
    transform: [{ translateY: layers[i].interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
  });

  return (
    <View style={styles.root} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <View style={[styles.collage, { marginTop: insets.top + space.sm, height: COLLAGE_H * k }]}>
        <Animated.View style={[styles.abs, px(HERO), rise(0)]}>
          <Media card={HERO} />
        </Animated.View>

        {CARDS.map((c, i) => (
          <Animated.View key={c.key} style={[styles.abs, px(c), rise(i + 1)]}>
            <Media card={c} />
            {c.muteBadge && (
              <View style={styles.mute}>
                <Icon name="volume-x" size={14} color={colors.white} />
              </View>
            )}
            {c.chip && (
              <View style={[styles.chip, c.left < 0 ? { left: space.sm - c.left * k } : { left: space.sm }]}>
                <Icon name={c.chip.icon} size={14} color={colors.white} />
                <Text style={styles.chipText}>{c.chip.label}</Text>
              </View>
            )}
          </Animated.View>
        ))}

        <Animated.View style={[styles.abs, styles.wave, px(WAVE), rise(5)]} accessibilityLabel="Audio">
          <Icon name="audio-lines" size={14} color={colors.white} />
          <View style={styles.bars}>
            {WAVE_BARS.map((h, i) => (
              <View key={i} style={[styles.bar, { height: h * k * 0.8 }]} />
            ))}
          </View>
        </Animated.View>

        <Animated.View style={[styles.taglineWrap, { top: TAGLINE_TOP * k }, rise(5)]}>
          <View style={styles.tagline}>
            <Text style={styles.taglineText}>One line in, a video out</Text>
          </View>
        </Animated.View>
      </View>

      <Animated.View style={[styles.bottom, { paddingBottom: insets.bottom + space.lg }, rise(6)]}>
        <View style={styles.copy}>
          <Text style={styles.title} accessibilityRole="header">
            Every idea is a <Text style={styles.titleAccent}>video</Text>
          </Text>
          <Text style={styles.body}>Marketing Agent, images, video and audio — with the same account, credits and assets as buzzvideo.ai.</Text>
        </View>
        <Pressable
          onPress={() => dispatch({ type: "completeOnboarding" })}
          accessibilityRole="button"
          style={({ pressed }) => [styles.cta, pressScale(pressed)]}
        >
          <Text style={styles.ctaText}>Get started</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

/** 卡片里的图或静音自动播放的视频 */
function Media({ card }: { card: Card }) {
  const fill = StyleSheet.absoluteFill;
  return (
    <View style={styles.card}>
      {card.video ? (
        <MediaVideo uri={card.video} poster={card.poster} style={fill} />
      ) : (
        <Image source={{ uri: card.poster }} style={fill as ImageStyle} resizeMode="cover" accessibilityIgnoresInvertColors />
      )}
    </View>
  );
}

const GLASS = { backgroundColor: "rgba(255,255,255,0.16)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.35)", backdropFilter: "blur(12px)" } as unknown as ViewStyle;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.black, overflow: "hidden" },
  collage: { width: "100%" },
  abs: { position: "absolute" },
  card: { flex: 1, borderRadius: radius.lg, ...smoothCorners, overflow: "hidden", backgroundColor: "#1c1c22" },
  mute: {
    position: "absolute",
    top: space.sm,
    right: space.xl,
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.onImage,
    alignItems: "center",
    justifyContent: "center",
  },
  chip: {
    position: "absolute",
    bottom: space.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: space.xs,
    height: 28,
    paddingHorizontal: space.md - 2,
    borderRadius: radius.full,
    ...GLASS,
  },
  chipText: { ...type.footnote, fontWeight: "600", color: colors.white },
  wave: { flexDirection: "row", alignItems: "center", gap: space.sm, paddingHorizontal: space.md, borderRadius: radius.full, ...GLASS },
  bars: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  bar: { width: 2, borderRadius: 1, backgroundColor: "rgba(255,255,255,0.85)" },
  taglineWrap: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  tagline: { paddingHorizontal: space.lg, height: 34, justifyContent: "center", borderRadius: radius.full, backgroundColor: "#FFE3CC" },
  taglineText: { ...type.subhead, fontWeight: "700", color: colors.ink },
  bottom: { flex: 1, justifyContent: "flex-end", paddingHorizontal: space.xl, gap: space.xxl },
  copy: { gap: space.md, alignItems: "center" },
  title: { ...type.title1, color: colors.white, textAlign: "center" },
  titleAccent: { color: colors.ctaA },
  body: { ...type.subhead, color: "rgba(255,255,255,0.6)", textAlign: "center" },
  cta: { height: 56, borderRadius: radius.full, backgroundColor: colors.white, alignItems: "center", justifyContent: "center" },
  ctaText: { ...type.headline, color: colors.ink },
});
