import { Pressable, StyleSheet, Text, View } from "react-native";
import type { IconName } from "../data";
import { colors } from "../theme";
import Icon from "./Icon";

type Props = { icon: IconName; onPress: () => void; badge?: number; tone?: "light" | "dark" };

export default function IconButton({ icon, onPress, badge = 0, tone = "light" }: Props) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.btn, tone === "dark" && styles.dark, pressed && styles.pressed]}
    >
      <Icon name={icon} size={20} color={tone === "dark" ? colors.white : colors.ink} />
      {badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.75)",
  },
  dark: { backgroundColor: "rgba(0,0,0,0.35)" },
  pressed: { opacity: 0.6 },
  badge: {
    position: "absolute",
    top: 1,
    right: 1,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: "800" },
});
