import { Pressable, StyleSheet, Text } from "react-native";
import { useNav, useStore } from "../provider";
import { colors, shadow } from "../theme";

export default function CreditsPill() {
  const { state } = useStore();
  const { navigate } = useNav();
  return (
    <Pressable onPress={() => navigate({ type: "tab", tab: "me" })} style={styles.pill}>
      <Text style={styles.star}>✦</Text>
      <Text style={styles.text}>{state.credits[state.workspace].toLocaleString("en-US")}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.92)",
    boxShadow: shadow.card,
  },
  star: { fontSize: 13, fontWeight: "800", color: colors.accent },
  text: { fontSize: 14, fontWeight: "700", color: colors.ink },
});
