import { StyleSheet, View } from "react-native";
import { ctaGradient } from "../theme";
import Gradient from "./Gradient";

export default function ProgressBar({ value, height = 6 }: { value: number; height?: number }) {
  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }]}>
      <Gradient
        colors={ctaGradient}
        angle={90}
        style={{ width: `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%` as const, height, borderRadius: height / 2 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({ track: { width: "100%", backgroundColor: "#f1ece7", overflow: "hidden" } });
