import { Pressable, StyleSheet, Text, View } from "react-native";
import type { IconName } from "../data";
import type { TabId } from "../nav";
import { useInsets, useNav } from "../provider";
import { colors, type } from "../theme";
import Icon from "./Icon";

const TABS: { id: TabId; label: string; icon: IconName }[] = [
  { id: "inspire", label: "Inspire", icon: "compass" },
  { id: "create", label: "Create", icon: "square-plus" },
  { id: "me", label: "Me", icon: "user-round" },
];

/** surface 底 + hairline 顶线;三项同级。选中:橙色加粗图标 + 主文字色标签;未选中:sub */
export default function TabBar() {
  const { nav, navigate } = useNav();
  const insets = useInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]} accessibilityRole="tablist">
      {TABS.map((t) => {
        const active = nav.tab === t.id;
        return (
          <Pressable
            key={t.id}
            onPress={() => navigate({ type: "tab", tab: t.id })}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={styles.item}
          >
            <Icon name={t.icon} size={24} color={active ? colors.accent : colors.sub} strokeWidth={active ? 2.25 : 1.75} />
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
    paddingTop: 6,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separator,
  },
  item: { flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center", gap: 2 },
  label: { ...type.caption, color: colors.sub },
  labelActive: { color: colors.ink },
});
