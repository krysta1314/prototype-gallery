import { StyleSheet, Text, View } from "react-native";
import { colors, type } from "../theme";
import type { ProgressRingProps } from "./ring-types";

/* 网页端:SVG 环形进度(纯橙弧 + 白 30% 轨道),中间百分比 */
export default function ProgressRing({ value, size = 44 }: ProgressRingProps) {
  const stroke = 3;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }} accessibilityLabel={`${pct}%`}>
      <svg width={size} height={size} aria-hidden style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={colors.accent}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          style={{ transition: "stroke-dashoffset 250ms linear" }}
        />
      </svg>
      <Text style={styles.pct}>{pct}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({ pct: { ...type.caption, color: colors.white, fontVariant: ["tabular-nums"] } });
