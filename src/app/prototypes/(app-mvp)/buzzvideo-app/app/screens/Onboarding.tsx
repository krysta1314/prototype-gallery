import { useEffect, useRef } from "react";
import { Animated, Easing, Image, Pressable, StyleSheet, Text, View } from "react-native";
import Gradient from "../components/Gradient";
import MediaVideo from "../components/MediaVideo";
import { prefersReducedMotion, pressScale } from "../components/motion";
import { A } from "../data";
import { useInsets, useStore } from "../provider";
import { colors, ctaGradient, radius, space, type } from "../theme";

/** 引导页广告片(2026-10-19):信息流卡片里往上刷 3 条 AI 广告(巴黎街拍、纽约街头攀岩墙、滑雪),点赞爆心 + 评论气泡,6 秒无缝循环。Seedance 2.5 出镜头,Remotion 合成,工程在 ~/Desktop/BuzzVideo引导页工程 */
const AD = { video: `${A}/onboarding-ad.mp4`, poster: `${A}/onboarding-ad.jpg` };

const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);

/**
 * 首次打开:广告片铺满全屏(静音循环),底部渐变压暗,白字标题 + 渐变胶囊主按钮。
 * 主旨:BuzzVideo 是专业做 AI 广告的,用户在乎成果 —— 第一眼就给一支像样的成片。
 * 点 Get started 进入登录页。文案和按钮淡入上浮,系统开了「减少动态效果」时直接出现。
 */
export default function Onboarding() {
  const { state, dispatch } = useStore();
  const ad = AD;
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
      {/* 广告片加载失败 / 弱网:只显示首帧封面,按钮照常可点,不阻塞流程 */}
      {state.faults.media ? (
        <Image source={{ uri: ad.poster }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors />
      ) : (
        <MediaVideo key={ad.video} uri={ad.video} poster={ad.poster} style={StyleSheet.absoluteFill} />
      )}
      <Gradient colors={["rgba(0,0,0,0.35)", "rgba(0,0,0,0)"]} style={[styles.topScrim, { pointerEvents: "none" }]} />
      <Gradient colors={["rgba(10,10,16,0)", "rgba(10,10,16,0.55)", "rgba(10,10,16,0.88)"]} style={[styles.bottomScrim, { pointerEvents: "none" }]} />

      <Animated.View
        style={[
          styles.bottom,
          { paddingBottom: insets.bottom + space.lg },
          { opacity: enter, transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] },
        ]}
      >
        <View style={styles.copy}>
          <Text style={styles.title} accessibilityRole="header">
            Turn any product into a video ad
          </Text>
          <Text style={styles.body}>Add a photo, describe your idea, get a ready-to-post ad.</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.black, overflow: "hidden", justifyContent: "flex-end" },
  topScrim: { position: "absolute", top: 0, left: 0, right: 0, height: 140 },
  bottomScrim: { position: "absolute", left: 0, right: 0, bottom: 0, height: "55%" },
  bottom: { paddingHorizontal: space.xl, gap: space.xxl },
  copy: { gap: space.md, alignItems: "center" },
  title: { ...type.title1, color: colors.white, textAlign: "center" },
  body: { ...type.subhead, color: "rgba(255,255,255,0.78)", textAlign: "center" },
  cta: { height: 56, borderRadius: radius.full, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  ctaText: { ...type.headline, color: colors.white },
});
