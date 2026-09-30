import { StyleSheet, Text, View } from "react-native";
import { useInsets, useStore } from "../provider";
import { colors, elevation, radius, type } from "../theme";

export default function Toast() {
  const { state } = useStore();
  const insets = useInsets();
  if (!state.toast) return null;
  return (
    <View style={[styles.wrap, { bottom: insets.bottom + 96, pointerEvents: "none" }]} accessibilityLiveRegion="polite">
      <View style={styles.toast}>
        <Text style={styles.text}>{state.toast}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  toast: {
    maxWidth: "86%",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.full,
    backgroundColor: colors.raised,
    boxShadow: elevation.float,
  },
  text: { ...type.footnote, fontWeight: "500", color: colors.ink, textAlign: "center" },
});
