import { StyleSheet, View } from "react-native";
import { colors, radius } from "../theme";

type Props = {
  value: number;
  /** 2–3px,默认 3 */
  height?: number;
  /** default:分组底轨道;onImage:压在深色图上的白色半透明轨道 */
  tone?: "default" | "onImage";
};

/** 纯橙细进度线(不用渐变) */
export default function ProgressBar({ value, height = 3, tone = "default" }: Props) {
  const pct = `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%` as const;
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
      style={[styles.track, { height }, tone === "onImage" && styles.trackOnImage]}
    >
      <View style={[styles.fill, { width: pct }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: "100%", borderRadius: radius.full, backgroundColor: colors.grouped, overflow: "hidden" },
  trackOnImage: { backgroundColor: "rgba(255,255,255,0.25)" },
  fill: { height: "100%", borderRadius: radius.full, backgroundColor: colors.accent },
});
