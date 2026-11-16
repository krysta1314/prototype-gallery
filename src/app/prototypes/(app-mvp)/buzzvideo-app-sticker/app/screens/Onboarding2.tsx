import { useEffect, useRef } from "react";
import { Animated, Easing, Image, StyleSheet, Text, View } from "react-native";
import { GZButton, gz } from "../../kit/gz";
import { Scrim } from "../parts";
import { MediaVideo, prefersReducedMotion, useInsets, useStore } from "../v1";

/**
 * 新版设计引导页。主标题换回 Bring any idea to life(Monica 原话 Turn any ideas to life 的通顺英文，2026-11-11 定);副标题讲「一个想法或一张图 → 几秒变成视频」(不说用户自己出镜，不是人人都想出镜)。
 * 标题换成粗展示字，按钮换成橙色粗胶囊(白字)，不再用品牌渐变。
 * 背景片(Monica 指定):梦核飘浮房子 → 名画走上巴黎街头 → 头巾小狗。Remotion 工程 ~/Desktop/BuzzVideo引导页工程，组合 OnboardingSticker。点 Get started 进入第一版的登录页
 */
const CLIP = { video: "/prototypes/buzzvideo-app-sticker/onboarding.mp4", poster: "/prototypes/buzzvideo-app-sticker/onboarding.jpg" };
const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const c = gz.color;

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
      <Scrim edge="top" height={140} strength={0.35} />
      <Scrim edge="bottom" height={420} strength={0.88} />

      <Animated.View style={[styles.bottom, { paddingBottom: insets.bottom + 16 }, { opacity: enter, transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]}>
        <View style={styles.copy}>
          <Text style={[gz.display.hero, { color: c.white, textAlign: "center", fontSize: 40, lineHeight: 42 }]} accessibilityRole="header">
            Bring any idea to life
          </Text>
          <Text style={[gz.body.body, { color: "rgba(255,255,255,0.8)", textAlign: "center", fontSize: 16, lineHeight: 22 }]}>Type an idea or drop a photo. Watch it become a video in seconds.</Text>
        </View>
        <GZButton label="Get started" onPress={() => dispatch({ type: "completeOnboarding" })} style={{ height: 56 }} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.black, overflow: "hidden", justifyContent: "flex-end" },
  media: { position: "absolute", top: 0, left: 0, right: 0, aspectRatio: 402 / 874, maxHeight: "100%" },
  bottom: { paddingHorizontal: 24, gap: 28 },
  copy: { gap: 12, alignItems: "center" },
});
