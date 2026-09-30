import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text } from "react-native";
import { prefersReducedMotion } from "../components/motion";
import { A } from "../data";
import { colors, space, type } from "../theme";

/** 呼吸:1 → 1.04 → 1 一个来回 1.4 秒,表示正在加载 */
const BREATH_SCALE = 1.04;
export const BREATH_MS = 1400;

/**
 * 启动页:暖白底,正中间品牌 logo + 品牌名。
 * 动效只有一个:logo 在 1 → 1.04 倍之间缓慢缩放,一个来回 1.4 秒,像在呼吸;没有入场动画。
 * 系统开了「减少动态效果」时 logo 静止。
 * 真实 APP:LaunchScreen.storyboard 放同样的暖白底 + logo(静态),JS 加载完后由这一页接着呼吸。
 */
export default function Splash() {
  const breath = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const half = { duration: BREATH_MS / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: false };
    const breathing = Animated.loop(
      Animated.sequence([Animated.timing(breath, { toValue: 1, ...half }), Animated.timing(breath, { toValue: 0, ...half })]),
    );
    breathing.start();
    return () => breathing.stop();
  }, [breath]);

  return (
    <Animated.View style={styles.root} accessibilityLabel="BuzzVideo AI">
      <Animated.Image
        source={{ uri: `${A}/app-logo.svg` }}
        accessibilityIgnoresInvertColors
        style={[styles.logo, { transform: [{ scale: breath.interpolate({ inputRange: [0, 1], outputRange: [1, BREATH_SCALE] }) }] }]}
      />
      <Text style={styles.brand}>BuzzVideo AI</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center", gap: space.md, backgroundColor: colors.bg },
  logo: { width: 104, height: 104 },
  brand: { ...type.title2, color: colors.ink },
});
