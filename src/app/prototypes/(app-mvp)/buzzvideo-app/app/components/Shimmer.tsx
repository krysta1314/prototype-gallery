import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import Gradient from "./Gradient";
import { prefersReducedMotion } from "./motion";

const SWEEP_MS = 1400;

/** 生成中的 shimmer:一道白色柔光从左扫到右,铺满父容器(父容器需 overflow hidden)。
 *  减少动态效果时不渲染 */
export default function Shimmer() {
  const [width, setWidth] = useState(0);
  const x = useRef(new Animated.Value(0)).current;
  const still = prefersReducedMotion();

  useEffect(() => {
    if (!width || still) return;
    const loop = Animated.loop(
      Animated.timing(x, { toValue: 1, duration: SWEEP_MS, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
    );
    loop.start();
    return () => loop.stop();
  }, [width, still, x]);

  const band = width * 0.8;
  // 插值节点保持稳定,不随每次 tick 重渲染重建
  const translateX = useMemo(() => x.interpolate({ inputRange: [0, 1], outputRange: [-band, width] }), [x, band, width]);
  if (still) return null;
  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {/* 光带从第一帧就挂载:若等量到宽度才挂载,它会和 loop.start() 落在同一次提交里,
          开发环境 StrictMode 对新子树的模拟卸载会把动画停掉 */}
      <Animated.View style={[styles.band, { width: band, transform: [{ translateX }] }]}>
        <Gradient colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.5)", "rgba(255,255,255,0)"]} angle={90} style={StyleSheet.absoluteFill} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  band: { position: "absolute", top: 0, bottom: 0, left: 0 },
});
