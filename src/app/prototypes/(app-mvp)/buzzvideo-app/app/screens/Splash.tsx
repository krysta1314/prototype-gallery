import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet } from "react-native";
import { prefersReducedMotion } from "../components/motion";
import { A } from "../data";
import { colors, space, type } from "../theme";

/** expo-out:快速到位、平稳收尾 */
const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
/** 呼吸:1 → 1.04 → 1 一个来回 1.4 秒,表示正在加载 */
const BREATH_SCALE = 1.04;
const BREATH_HALF_MS = 700;

/**
 * 启动页:暖白底,正中间品牌 logo + 品牌名。
 * 入场动效:logo 从 0.8 倍放大并淡入(随图标放大一起到位),品牌名稍后从下方 8pt 淡入上移。
 * 入场结束后 logo 在 1 → 1.04 倍之间缓慢缩放(呼吸),表示正在加载;系统开了「减少动态效果」时不呼吸。
 * 真实 APP:LaunchScreen.storyboard 只放暖白底(静态),JS 加载完后由这一页播放入场动画。
 */
export default function Splash() {
  const logo = useRef(new Animated.Value(0)).current;
  const brand = useRef(new Animated.Value(0)).current;
  const breath = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (prefersReducedMotion()) {
      logo.setValue(1);
      brand.setValue(1);
      return;
    }
    const breathing = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, { toValue: 1, duration: BREATH_HALF_MS, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(breath, { toValue: 0, duration: BREATH_HALF_MS, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      ]),
    );
    Animated.parallel([
      Animated.timing(logo, { toValue: 1, duration: 600, easing: EASE_OUT, useNativeDriver: false }),
      Animated.timing(brand, { toValue: 1, duration: 500, delay: 250, easing: EASE_OUT, useNativeDriver: false }),
    ]).start(({ finished }) => finished && breathing.start());
    return () => breathing.stop();
  }, [logo, brand, breath]);

  return (
    <Animated.View style={styles.root} accessibilityLabel="BuzzVideo AI">
      <Animated.Image
        source={{ uri: `${A}/app-logo.svg` }}
        accessibilityIgnoresInvertColors
        style={[
          styles.logo,
          {
            opacity: logo,
            transform: [
              {
                scale: Animated.multiply(
                  logo.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }),
                  breath.interpolate({ inputRange: [0, 1], outputRange: [1, BREATH_SCALE] }),
                ),
              },
            ],
          },
        ]}
      />
      <Animated.Text
        style={[
          styles.brand,
          {
            opacity: brand,
            transform: [{ translateY: brand.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
          },
        ]}
      >
        BuzzVideo AI
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center", gap: space.md, backgroundColor: colors.bg },
  logo: { width: 104, height: 104 },
  brand: { ...type.title2, color: colors.ink },
});
