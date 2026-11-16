import { useEffect, useRef } from "react";
import { Animated, Easing, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Gradient, MediaVideo, colors, ctaGradient, prefersReducedMotion, pressScale, radius, space, type, useInsets, useStore } from "../v1";

/**
 * 第二版引导页(2026-11-11)。定位改成「人人可玩的 AI 视频游乐场」,所以:
 * - 文案:Bring any idea to life / Watch and create fun AI videos.(Monica 定)
 * - 背景片沿用第一版的结构和动效(信息流往上刷、点赞爆心、评论气泡),换成 3 条设计感强的 AI 视频
 *   (梦核飘浮房子、20 年代舞会、爱丽丝)，去掉 Sponsored / Shop now,评论改成对作品本身的反应。
 *   Remotion 工程:~/Desktop/BuzzVideo引导页工程(组合 OnboardingV2)
 * 布局、动效、弱网降级和第一版引导页一致。点 Get started 进入第一版的登录页
 */
const CLIP = { video: "/prototypes/buzzvideo-app-v2/onboarding.mp4", poster: "/prototypes/buzzvideo-app-v2/onboarding.jpg" };
const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);

export default function Onboarding2() {
  const { state, dispatch } = useStore();
  const insets = useInsets();
  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (prefersReducedMotion()) {
      enter.setValue(1);
      return;
    }
    const anim = Animated.timing(enter, { toValue: 1, duration: 520, delay: 200, easing: EASE_OUT, useNativeDriver: false });
    anim.start();
    return () => anim.stop();
  }, [enter]);

  return (
    <View style={styles.root}>
      <View style={styles.media}>
        {state.faults.media ? (
          <Image source={{ uri: CLIP.poster }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors />
        ) : (
          <MediaVideo key={CLIP.video} uri={CLIP.video} poster={CLIP.poster} style={StyleSheet.absoluteFill} />
        )}
      </View>
      <Gradient colors={["rgba(0,0,0,0.35)", "rgba(0,0,0,0)"]} style={[styles.topScrim, { pointerEvents: "none" }]} />
      <Gradient colors={["rgba(10,10,16,0)", "rgba(10,10,16,0.55)", "rgba(10,10,16,0.88)"]} style={[styles.bottomScrim, { pointerEvents: "none" }]} />

      <Animated.View style={[styles.bottom, { paddingBottom: insets.bottom + space.lg }, { opacity: enter, transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]}>
        <View style={styles.copy}>
          <Text style={styles.title} accessibilityRole="header">
            Bring any idea to life
          </Text>
          <Text style={styles.body}>Watch and create fun AI videos.</Text>
        </View>
        <Pressable onPress={() => dispatch({ type: "completeOnboarding" })} accessibilityRole="button" style={({ pressed }) => [styles.cta, pressScale(pressed)]}>
          <Gradient colors={ctaGradient} angle={90} style={StyleSheet.absoluteFill} pointerEvents="none" />
          <Text style={styles.ctaText}>Get started</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.black, overflow: "hidden", justifyContent: "flex-end" },
  media: { position: "absolute", top: 0, left: 0, right: 0, aspectRatio: 402 / 874, maxHeight: "100%" },
  topScrim: { position: "absolute", top: 0, left: 0, right: 0, height: 140 },
  bottomScrim: { position: "absolute", left: 0, right: 0, bottom: 0, height: "55%" },
  bottom: { paddingHorizontal: space.xl, gap: space.xxl },
  copy: { gap: space.md, alignItems: "center" },
  title: { ...type.title1, color: colors.white, textAlign: "center" },
  body: { ...type.subhead, color: "rgba(255,255,255,0.78)", textAlign: "center" },
  cta: { height: 56, borderRadius: radius.full, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  ctaText: { ...type.headline, color: colors.white },
});
