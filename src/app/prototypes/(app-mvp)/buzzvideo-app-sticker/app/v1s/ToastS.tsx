import { useEffect, useMemo, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { gz, isErrorToast } from "../../kit/gz";
import { prefersReducedMotion, useInsets, useStore } from "../v1";
import { EASE } from "./parts-auth";

const c = gz.color;

/**
 * 贴纸风全局提示(逻辑同第一版 components/Toast):从顶部出现(灵动岛下方),显示 / 消失仍由第一版 store 的 state.toast 控制(约 2 秒)。
 * 样子同组件库 GZToast:一颗青柠贴纸(失败类提示是红色白字)(白模切边、歪 -2°),啪地贴上(快速缩放、减速、不回弹);文案长时换行，圆角矩形不变形
 */
export default function ToastS({ offset = 0 }: { offset?: number }) {
  const { state } = useStore();
  const insets = useInsets();
  if (!state.toast) return null;
  return (
    <View style={[styles.wrap, { top: insets.top + 8 + offset, pointerEvents: "none" }]} accessibilityLiveRegion="polite">
      <Sticker key={state.toast} text={state.toast} />
    </View>
  );
}

function Sticker({ text }: { text: string }) {
  const [v] = useState(() => new Animated.Value(prefersReducedMotion() ? 1 : 0));
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const a = Animated.timing(v, { toValue: 1, duration: 260, easing: EASE, useNativeDriver: false });
    a.start();
    return () => a.stop();
  }, [v]);
  const anim = useMemo(() => ({ opacity: v.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }), transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1.2, 1] }) }, { rotate: "-2deg" }] }), [v]);
  return (
    <Animated.View style={[styles.toast, isErrorToast(text) && { backgroundColor: c.red }, anim]}>
      <Text style={[gz.display.label, { color: isErrorToast(text) ? c.white : c.ink, textAlign: "center" }]}>{text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 0, right: 0, alignItems: "center", zIndex: 60 },
  toast: { maxWidth: "86%", paddingHorizontal: 16, paddingVertical: 10, minHeight: 40, borderRadius: 12, borderWidth: gz.cut, borderColor: c.white, backgroundColor: c.lime, justifyContent: "center" },
});
