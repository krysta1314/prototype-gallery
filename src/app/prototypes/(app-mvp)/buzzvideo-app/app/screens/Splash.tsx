import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text } from "react-native";
import { prefersReducedMotion } from "../components/motion";
import { A } from "../data";
import { colors, space, type } from "../theme";

/** logo 在 1 秒里从 0.8 倍缓慢放大到 1.04 倍,表示正在加载;启动页停留时长也取这个值 */
const GROW_FROM = 0.8;
const GROW_TO = 1.04;
export const GROW_MS = 1000;

/**
 * 启动页:暖白底,正中间品牌 logo + 品牌名。
 * 动效只有一个:logo 在 1 秒里从 0.8 倍缓慢放大到 1.04 倍(只放大一次,不缩回、不循环)。
 * 系统开了「减少动态效果」时 logo 直接以 1 倍静止显示。
 * 真实 APP:LaunchScreen.storyboard 放同样的暖白底 + logo(静态),JS 加载完后由这一页接着放大。
 */
export default function Splash() {
  const grow = useRef(new Animated.Value(0)).current;
  const reduced = useRef(prefersReducedMotion()).current;

  useEffect(() => {
    if (reduced) return;
    const anim = Animated.timing(grow, { toValue: 1, duration: GROW_MS, easing: Easing.out(Easing.sin), useNativeDriver: false });
    anim.start();
    return () => anim.stop();
  }, [grow, reduced]);

  return (
    <Animated.View style={styles.root} accessibilityLabel="BuzzVideo AI">
      <Animated.Image
        source={{ uri: `${A}/app-logo.svg` }}
        accessibilityIgnoresInvertColors
        style={[styles.logo, { transform: [{ scale: reduced ? 1 : grow.interpolate({ inputRange: [0, 1], outputRange: [GROW_FROM, GROW_TO] }) }] }]}
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
