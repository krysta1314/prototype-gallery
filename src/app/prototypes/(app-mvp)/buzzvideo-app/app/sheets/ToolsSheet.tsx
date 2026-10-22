import { Pressable, StyleSheet, Text, View } from "react-native";
import Sheet from "../components/Sheet";
import { pressScale } from "../components/motion";
import { ToolIcon, useStartTool } from "../components/ToolEntries";
import { TOOLS } from "../data";
import { colors, radius, smoothCorners, space, type } from "../theme";

/** 创作页工具条右边「全部工具」:两列工具卡(图标 + 名字 + 一句话),点了关面板并开始用这个工具 */
export default function ToolsSheet({ onClose }: { onClose: () => void }) {
  const startTool = useStartTool();
  return (
    <Sheet title="All tools" onClose={onClose}>
      <View style={styles.grid}>
        {TOOLS.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => {
              onClose();
              startTool(t);
            }}
            accessibilityRole="button"
            style={({ pressed }) => [styles.card, pressed && styles.cardOn, pressScale(pressed)]}
          >
            <View style={styles.icon}>
              <ToolIcon t={t} size={18} />
            </View>
            <Text style={styles.label} numberOfLines={1}>
              {t.label}
            </Text>
            <Text style={styles.desc} numberOfLines={2}>
              {t.desc}
            </Text>
          </Pressable>
        ))}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: space.sm, paddingTop: space.xs },
  card: { width: "48.6%", padding: space.md, gap: 2, borderRadius: radius.md, backgroundColor: colors.grouped, ...smoothCorners } as object,
  cardOn: { backgroundColor: colors.raised },
  icon: { width: 32, height: 32, borderRadius: radius.full, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface, marginBottom: space.sm },
  label: { ...type.subhead, fontWeight: "600", color: colors.ink },
  desc: { ...type.footnote, color: colors.sub, minHeight: 36 },
});
