import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { TOOLS } from "../data";
import { useNav } from "../provider";
import { colors, radius, space, type } from "../theme";
import Gradient from "./Gradient";
import Icon from "./Icon";
import { pressScale } from "./motion";
import { ToolIcon, useStartTool } from "./ToolEntries";

/**
 * 创作页输入框上方的快捷工具条(2026-10-21 定，参照即梦):一排小胶囊左右滑，右边固定一个「全部工具」按钮，
 * 点了从底部弹出两列工具卡。点任一工具和首页宫格一样(useStartTool)
 */
export default function ToolStrip() {
  const startTool = useStartTool();
  const { navigate } = useNav();
  return (
    <View style={styles.wrap}>
      <View style={styles.scroll}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {TOOLS.map((t) => (
            <Pressable key={t.id} onPress={() => startTool(t)} accessibilityRole="button" style={({ pressed }) => [styles.chip, pressed && styles.chipOn, pressScale(pressed)]}>
              <ToolIcon t={t} size={13} color={colors.sub} />
              <Text style={styles.label}>{t.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
        {/* 右边渐隐：被截断的胶囊淡出，不会硬切在半个字上，也提示还能往右滑 */}
        <Gradient colors={["rgba(15,15,19,0)", colors.bg]} angle={90} style={styles.fade} pointerEvents="none" />
      </View>
      <Pressable
        onPress={() => navigate({ type: "sheet", sheet: { name: "tools" } })}
        accessibilityRole="button"
        accessibilityLabel="All tools"
        hitSlop={6}
        style={({ pressed }) => [styles.more, pressed && styles.chipOn, pressScale(pressed)]}
      >
        <Icon name="layout-grid" size={15} color={colors.ink} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  // 2026-10-22 改：去掉胶囊描边，换成更淡的实底;图标降成次要色，文字是主角
  wrap: { flexDirection: "row", alignItems: "center", paddingRight: space.md, marginBottom: space.sm, gap: 6 },
  scroll: { flex: 1, minWidth: 0 },
  row: { gap: 6, paddingLeft: space.md, paddingRight: 28 },
  fade: { position: "absolute", top: 0, bottom: 0, right: 0, width: 28 },
  chip: { flexDirection: "row", alignItems: "center", gap: 5, height: 30, paddingHorizontal: 11, borderRadius: radius.full, backgroundColor: "rgba(255,255,255,0.07)" },
  chipOn: { backgroundColor: "rgba(255,255,255,0.14)" },
  label: { ...type.caption1, fontWeight: "500", color: "rgba(244,244,247,0.86)" },
  more: { width: 30, height: 30, borderRadius: radius.full, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.07)" },
});
