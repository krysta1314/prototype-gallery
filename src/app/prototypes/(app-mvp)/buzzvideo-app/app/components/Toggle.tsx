import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet } from "react-native";
import { colors, radius } from "../theme";
import { prefersReducedMotion } from "./motion";

type Props = { value: boolean; onValueChange: (v: boolean) => void; accessibilityLabel?: string; disabled?: boolean };

const TRACK_W = 64;
const TRACK_H = 28;
const INSET = 3;
const KNOB_W = 38;
const KNOB_H = TRACK_H - INSET * 2;

/**
 * iOS 26 开关(2026-10-22 自己画，系统 Switch 还是旧的圆形滑块):宽胶囊轨道 + 胶囊形白色滑块。
 * 打开：品牌橙轨道，滑块在右;关闭:iOS 深色模式灰轨道。切换时滑块平移、轨道颜色渐变。真实 APP 用系统 UISwitch(iOS 26 自带这个样子)
 */
export default function Toggle({ value, onValueChange, accessibilityLabel, disabled }: Props) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    if (prefersReducedMotion()) anim.setValue(value ? 1 : 0);
    else Animated.timing(anim, { toValue: value ? 1 : 0, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [value, anim]);
  const { x, bg } = useMemo(
    () => ({
      x: anim.interpolate({ inputRange: [0, 1], outputRange: [INSET, TRACK_W - KNOB_W - INSET] }),
      bg: anim.interpolate({ inputRange: [0, 1], outputRange: ["rgba(120,120,128,0.36)", colors.accent] }),
    }),
    [anim],
  );
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      style={disabled ? styles.disabled : undefined}
    >
      <Animated.View style={[styles.track, { backgroundColor: bg }]}>
        <Animated.View style={[styles.knob, { transform: [{ translateX: x }] }]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: { width: TRACK_W, height: TRACK_H, borderRadius: radius.full, justifyContent: "center" },
  knob: { position: "absolute", left: 0, width: KNOB_W, height: KNOB_H, borderRadius: radius.full, backgroundColor: colors.white, boxShadow: "0 1px 3px rgba(0,0,0,0.25)" },
  disabled: { opacity: 0.4 },
});
