import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { TOOLS, defaultModel, type Tool } from "../data";
import { useNav, useStore } from "../provider";
import { colors, radius, space } from "../theme";
import Icon from "./Icon";
import { pressScale } from "./motion";
import TabGlyph from "./TabGlyph";
import ToolGlyph from "./ToolGlyph";

/** 点工具：进 Create 的 Agent 模式，输入框填上这个工具的提示词开头;要先选图 / 视频的工具直接弹「+」附件面板(首页宫格、创作页工具条、全部工具面板共用) */
export function useStartTool() {
  const { dispatch } = useStore();
  const { navigate } = useNav();
  return (t: Tool) => {
    dispatch({ type: "selectSession", id: null });
    dispatch({ type: "setComposer", patch: { mode: "agent", model: defaultModel("agent"), text: t.prompt } });
    navigate({ type: "tab", tab: "create" });
    if (t.needsMedia) navigate({ type: "sheet", sheet: { name: "attach" } });
  };
}

/** 工具图标:AI Agent 用两颗四角星线条，自绘的 cutout / hd,其余 Lucide */
export function ToolIcon({ t, size = 22, color = colors.white }: { t: Tool; size?: number; color?: string }) {
  if (t.id === "agent") return <TabGlyph name="create" size={size + 1} color={color} filled={false} outline />;
  if (t.glyph) return <ToolGlyph name={t.glyph} size={size} color={color} />;
  return <Icon name={t.icon} size={size} color={color} strokeWidth={1.6} />;
}

/** 每页两行、一行四个 */
const PER_ROW = 4;
const PER_PAGE = PER_ROW * 2;

/**
 * 首页 Banner 下面的工具入口(2026-10-21 定，参照剪映 / 必剪的工具宫格):
 * 圆形实底 + 一圈细亮边，里面白色线条图标(不加 AI 星星角标);圆下面是名字(固定两行高，上下对齐)。
 * 15 个工具(见 data.ts TOOLS),每页 2×4,左右滑动翻页，下面一排翻页小点。按住：圆底亮一档 + 轻微缩小
 */
export default function ToolEntries({ onStart }: { onStart: (t: Tool) => void }) {
  const [width, setWidth] = useState(0);
  const [page, setPage] = useState(0);
  const pages: Tool[][] = [];
  for (let i = 0; i < TOOLS.length; i += PER_PAGE) pages.push(TOOLS.slice(i, i + PER_PAGE));
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!width) return;
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== page) setPage(i);
  };

  return (
    <View style={styles.wrap} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScroll={onScroll} scrollEventThrottle={32}>
        {pages.map((tools, pi) => (
          <View key={pi} style={[styles.page, { width: width || 390 }]}>
            {tools.map((t) => (
              <Pressable key={t.id} onPress={() => onStart(t)} accessibilityRole="button" accessibilityLabel={t.label} style={styles.item}>
                {({ pressed }) => (
                  <>
                    <View style={[styles.circle, pressed && styles.circleOn, pressScale(pressed)]}>
                      <ToolIcon t={t} />
                    </View>
                    <Text style={styles.label} numberOfLines={2}>
                      {t.label}
                    </Text>
                  </>
                )}
              </Pressable>
            ))}
          </View>
        ))}
      </ScrollView>
      {pages.length > 1 ? (
        <View style={styles.dots} accessibilityLabel={`Tools page ${page + 1} of ${pages.length}`}>
          {pages.map((_, i) => (
            <View key={i} style={[styles.dot, i === page && styles.dotOn]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // 和下面的分类标签拉开(本块 12 + 分类栏 marginTop 8)
  wrap: { paddingTop: space.md, paddingBottom: space.md },
  page: { flexDirection: "row", flexWrap: "wrap", alignContent: "flex-start", paddingHorizontal: space.sm, rowGap: space.sm },
  item: { width: `${100 / PER_ROW}%`, alignItems: "center", gap: 6 } as object,
  // 2026-10-21 整体缩小：圆 60 → 50、图标 26 → 22、文字 12 → 11
  circle: {
    width: 50,
    height: 50,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    // 和页面同色系、亮一档的实底 + 细亮边
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  circleOn: { backgroundColor: colors.raised },
  // 文字区固定两行高：一行的名字也占两行位置，圆和文字上下对齐
  label: { fontSize: 11, lineHeight: 14, height: 28, fontWeight: "600", color: "rgba(244,244,247,0.78)", textAlign: "center", paddingHorizontal: 4 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 4, marginTop: space.xs },
  dot: { width: 6, height: 3, borderRadius: radius.xs, backgroundColor: "rgba(255,255,255,0.25)" },
  dotOn: { width: 14, backgroundColor: colors.white },
});
