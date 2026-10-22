import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { FeedCategory } from "../data";
import { colors, radius, space, type } from "../theme";

/**
 * 灵感流分类标签(2026-10-21 定，像抖音 / 剪映顶部频道):纯文字横排;
 * 选中 = 白色加粗 + 下方一道橙色短横线，其余灰字。左右滑动
 */
export default function CategoryTabs({ items, active, onPick }: { items: FeedCategory[]; active: string; onPick: (id: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} style={styles.bar}>
      {items.map((c) => {
        const on = c.id === active;
        return (
          <Pressable key={c.id} onPress={() => onPick(c.id)} accessibilityRole="tab" accessibilityState={{ selected: on }} hitSlop={{ top: 4, bottom: 4, left: 6, right: 6 }} style={styles.item}>
            <Text numberOfLines={1} style={on ? styles.on : styles.off}>
              {c.emoji ? `${c.emoji} ${c.label}` : c.label}
            </Text>
            <View style={[styles.underline, on && styles.underlineOn]} />
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bar: { flexGrow: 0, marginTop: space.sm },
  row: { flexDirection: "row", alignItems: "flex-end", gap: space.lg + 2, paddingHorizontal: space.lg, paddingVertical: space.xs },
  item: { height: 36, alignItems: "center", justifyContent: "flex-end", paddingBottom: 2 },
  off: { ...type.subhead, color: colors.sub },
  on: { ...type.subhead, fontWeight: "700", color: colors.ink },
  underline: { width: 16, height: 3, borderRadius: radius.xs, marginTop: 5, backgroundColor: "transparent" },
  underlineOn: { backgroundColor: colors.accent },
});
