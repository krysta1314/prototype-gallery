import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, Pressable, StyleSheet, Text, View, type ImageStyle, type ViewStyle } from "react-native";
import Gradient from "../components/Gradient";
import Icon from "../components/Icon";
import MediaVideo from "../components/MediaVideo";
import { prefersReducedMotion, pressScale } from "../components/motion";
import { A, type IconName } from "../data";
import { useInsets, useOnboardingDemo, useStore, type OnboardingAd } from "../provider";
import { colors, ctaGradient, elevation, radius, smoothCorners, space, type } from "../theme";

/**
 * 首次打开:一段 Seedance 生成的专业广告片 + 标题 + 渐变胶囊主按钮,点 Get started 进入隐私弹窗。
 * 主旨:BuzzVideo 是专业做 AI 广告的,用户在乎成果 —— 所以第一眼给一支像样的成片。
 * 演示阶段有三种版式对比(外壳下方的演示切换条控制):
 *   replace:上半屏一张圆角大卡播广告片(替换拼贴)
 *   hero:保留拼贴(参照海螺 AI),中间主视觉换成广告片,四周是 Image / Video / Agent 小卡和音频波形
 *   full:广告片铺满全屏,底部渐变压暗,白字标题
 * 元素依次淡入上浮,系统开了「减少动态效果」时直接出现。
 * 拼贴坐标按 402pt 宽的屏幕设计(单位 pt),实际按屏宽等比缩放;左右两侧的卡片故意出血。
 */
const DESIGN_W = 402;
/** 拼贴区高度(设计稿 pt) */
const COLLAGE_H = 500;

type Box = { left: number; top: number; width: number; height: number };
type Card = Box & { key: string; poster: string; video?: string; chip?: { icon: IconName; label: string }; muteBadge?: boolean };

/** 品牌广告片(Seedance 2.0 文生视频,竖版 12 秒):a = 多品类快切,b = 香水单品大片 */
const ADS: Record<OnboardingAd, { video: string; poster: string }> = {
  a: { video: `${A}/onboarding-ad-a.mp4`, poster: `${A}/onboarding-ad-a.jpg` },
  b: { video: `${A}/onboarding-ad-b.mp4`, poster: `${A}/onboarding-ad-b.jpg` },
};
const HERO_BOX = { key: "hero", left: 70, top: 82, width: 262, height: 372 };
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
  const { layout, ad } = useOnboardingDemo();
  const AD = ADS[ad];
  const HERO: Card = { ...HERO_BOX, ...AD };
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

  const onDark = layout === "full";
  const bottom = (
    <Animated.View style={[styles.bottom, { paddingBottom: insets.bottom + space.lg }, rise(6)]}>
      <View style={styles.copy}>
        <Text style={[styles.title, onDark && styles.onDark]} accessibilityRole="header">
          AI ads that <Text style={[styles.titleAccent, onDark && styles.titleAccentOnDark]}>win</Text> markets
        </Text>
        <Text style={[styles.body, onDark && styles.bodyOnDark]}>AI-generated video ads that actually convert — at the scale your business needs.</Text>
      </View>
      <Pressable
        onPress={() => dispatch({ type: "completeOnboarding" })}
        accessibilityRole="button"
        style={({ pressed }) => [styles.cta, pressScale(pressed)]}
      >
        <Gradient colors={ctaGradient} angle={90} style={StyleSheet.absoluteFill} pointerEvents="none" />
        <Text style={styles.ctaText}>Get started</Text>
      </Pressable>
    </Animated.View>
  );

  if (layout === "full") {
    return (
      <View style={[styles.root, styles.rootFull]} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        <MediaVideo uri={AD.video} poster={AD.poster} style={StyleSheet.absoluteFill} />
        <Gradient colors={["rgba(0,0,0,0.35)", "rgba(0,0,0,0)"]} style={[styles.topScrim, { pointerEvents: "none" }]} />
        <Gradient colors={["rgba(10,10,16,0)", "rgba(10,10,16,0.55)", "rgba(10,10,16,0.88)"]} style={[styles.bottomScrim, { pointerEvents: "none" }]} />
        <View style={styles.fullSpacer} />
        {bottom}
      </View>
    );
  }

  if (layout === "replace") {
    return (
      <View style={styles.root} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        <Animated.View style={[styles.adFrame, { marginTop: insets.top + space.sm }, rise(0)]}>
          <View style={styles.card}>
            <MediaVideo uri={AD.video} poster={AD.poster} style={StyleSheet.absoluteFill} />
          </View>
          <View style={[styles.chip, styles.madeWith]}>
            <Icon name="clapperboard" size={14} color={colors.white} />
            <Text style={styles.chipText}>Made with BuzzVideo AI</Text>
          </View>
        </Animated.View>
        {bottom}
      </View>
    );
  }

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
          <Icon name="audio-lines" size={14} color={colors.ink} />
          <View style={styles.bars}>
            {WAVE_BARS.map((h, i) => (
              <View key={i} style={[styles.bar, { height: h * k * 0.8 }]} />
            ))}
          </View>
        </Animated.View>

        <Animated.View style={[styles.taglineWrap, { top: TAGLINE_TOP * k }, rise(5)]}>
          <View style={styles.tagline}>
            <Text style={styles.taglineText}>One line in, an ad out</Text>
          </View>
        </Animated.View>
      </View>
      <View style={styles.fullSpacer} />
      {bottom}
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

/** 压在图片上的标签:深色半透明玻璃,浅色、深色图上都看得清 */
const GLASS = { backgroundColor: "rgba(26,26,46,0.45)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.25)", backdropFilter: "blur(12px)" } as unknown as ViewStyle;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, overflow: "hidden" },
  rootFull: { backgroundColor: colors.black },
  fullSpacer: { flex: 1 },
  topScrim: { position: "absolute", top: 0, left: 0, right: 0, height: 140 },
  bottomScrim: { position: "absolute", left: 0, right: 0, bottom: 0, height: "55%" },
  adFrame: { flex: 1, marginHorizontal: space.lg, marginBottom: space.xl },
  madeWith: { left: space.md, bottom: space.md },
  collage: { width: "100%" },
  abs: { position: "absolute" },
  card: { flex: 1, borderRadius: radius.lg, ...smoothCorners, overflow: "hidden", backgroundColor: colors.grouped },
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
  wave: { flexDirection: "row", alignItems: "center", gap: space.sm, paddingHorizontal: space.md, borderRadius: radius.full, backgroundColor: colors.surface, boxShadow: elevation.float } as ViewStyle,
  bars: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  bar: { width: 2, borderRadius: 1, backgroundColor: colors.ink },
  taglineWrap: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  tagline: { paddingHorizontal: space.lg, height: 34, justifyContent: "center", borderRadius: radius.full, backgroundColor: "#FFE3CC" },
  taglineText: { ...type.subhead, fontWeight: "700", color: colors.ink },
  bottom: { justifyContent: "flex-end", paddingHorizontal: space.xl, gap: space.xxl },
  copy: { gap: space.md, alignItems: "center" },
  title: { ...type.title1, color: colors.ink, textAlign: "center" },
  titleAccent: { color: colors.accent },
  onDark: { color: colors.white },
  titleAccentOnDark: { color: colors.ctaA },
  bodyOnDark: { color: "rgba(255,255,255,0.78)" },
  body: { ...type.subhead, color: colors.sub, textAlign: "center" },
  cta: { height: 56, borderRadius: radius.full, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  ctaText: { ...type.headline, color: colors.white },
});
