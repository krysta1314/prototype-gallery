import { StyleSheet, Text, View } from "react-native";
import { useInsets, useStore } from "../provider";
import { colors } from "../theme";

export default function Toast() {
  const { state } = useStore();
  const insets = useInsets();
  if (!state.toast) return null;
  return (
    <View style={[styles.wrap, { bottom: insets.bottom + 96 }]} pointerEvents="none">
      <View style={styles.toast}>
        <Text style={styles.text}>{state.toast}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  toast: { maxWidth: "86%", paddingHorizontal: 16, paddingVertical: 11, borderRadius: 999, backgroundColor: "rgba(26,26,46,0.92)" },
  text: { color: colors.white, fontSize: 14, fontWeight: "600", textAlign: "center" },
});
