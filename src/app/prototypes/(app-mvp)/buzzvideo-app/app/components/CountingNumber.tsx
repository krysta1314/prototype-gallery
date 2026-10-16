import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Text, type StyleProp, type TextStyle } from "react-native";
import { prefersReducedMotion } from "./motion";

/**
 * 会滚动的数字:值变化时从旧值滚到新值(约 0.6 秒,先快后慢),用于积分余额。
 * 首次挂载直接显示,不滚;系统开了「减少动态效果」时直接跳到新值
 */
export default function CountingNumber({ value, style }: { value: number; style?: StyleProp<TextStyle> }) {
  const [shown, setShown] = useState(value);
  const [anim] = useState(() => new Animated.Value(value));
  const last = useRef(value);

  useEffect(() => {
    if (value === last.current) return;
    last.current = value;
    if (prefersReducedMotion()) {
      anim.setValue(value);
      return;
    }
    const id = anim.addListener(({ value: v }) => setShown(Math.round(v)));
    const run = Animated.timing(anim, { toValue: value, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: false });
    run.start(() => setShown(value));
    return () => {
      run.stop();
      anim.removeListener(id);
    };
  }, [value, anim]);

  // 减少动态效果:不经过动画,直接用最新值
  const text = prefersReducedMotion() ? value : shown;
  return <Text style={[style, { fontVariant: ["tabular-nums"] }]}>{text.toLocaleString("en-US")}</Text>;
}
