import { StyleSheet, Text, View } from "react-native";
import { colors, radius, type } from "../theme";
import type { ProgressRingProps } from "./ring-types";

/* 原生端兜底:白 30% 圆环 + 百分比。真实 APP 用 react-native-svg 画进度弧(见 ProgressRing.web.tsx) */
export default function ProgressRing({ value, size = 44 }: ProgressRingProps) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <View style={[styles.ring, { width: size, height: size }]} accessibilityLabel={`${pct}%`}>
      <Text style={styles.pct}>{pct}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: { borderRadius: radius.full, borderWidth: 3, borderColor: "rgba(255,255,255,0.3)", alignItems: "center", justifyContent: "center" },
  pct: { ...type.caption, color: colors.white },
});
