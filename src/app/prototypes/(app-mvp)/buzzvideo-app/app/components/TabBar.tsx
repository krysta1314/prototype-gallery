import { Pressable, StyleSheet, Text, View } from "react-native";
import type { IconName } from "../data";
import type { TabId } from "../nav";
import { useInsets, useNav } from "../provider";
import { colors, ctaGradient } from "../theme";
import Gradient from "./Gradient";
import Icon from "./Icon";

const TABS: { id: TabId; label: string; icon: IconName }[] = [
  { id: "inspire", label: "Inspire", icon: "compass" },
  { id: "create", label: "Create", icon: "sparkles" },
  { id: "me", label: "Me", icon: "user-round" },
];

export default function TabBar() {
  const { nav, navigate } = useNav();
  const insets = useInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {TABS.map((t) => {
        const active = nav.tab === t.id;
        const center = t.id === "create";
        return (
          <Pressable key={t.id} onPress={() => navigate({ type: "tab", tab: t.id })} style={styles.item}>
            {center ? (
              <Gradient colors={ctaGradient} angle={135} style={styles.center}>
                <Icon name={t.icon} size={20} color={colors.white} />
              </Gradient>
            ) : (
              <Icon name={t.icon} size={24} color={active ? colors.accent : colors.faint} />
            )}
            <Text style={[styles.label, active && styles.labelActive]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    paddingTop: 8,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  item: { flex: 1, alignItems: "center", gap: 3 },
  center: { width: 40, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  label: { fontSize: 11, fontWeight: "600", color: colors.faint },
  labelActive: { color: colors.accent },
});
