import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import type { Mode } from "../data";
import { THINKING, type StepStatus } from "../generation";
import { colors, radius, type } from "../theme";
import Icon from "./Icon";
import { prefersReducedMotion } from "./motion";

type Props = { mode: Mode; statuses: StepStatus[] };

/** Agent 的思考过程(无头像,纯文字):一行可展开的标题 + 依次点亮的步骤 */
export default function ThinkingSteps({ mode, statuses }: Props) {
  const [open, setOpen] = useState(false);
  const t = THINKING[mode];
  const finished = statuses.every((s) => s === "done");
  const failed = statuses.includes("failed");
  // 失败发生在渲染阶段,规划本身已完成
  const heading = finished || failed ? t.doneTitle : t.title;

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        hitSlop={{ top: 6, bottom: 6, left: 4, right: 12 }}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${heading}, ${t.steps.length} steps`}
        style={({ pressed }) => [styles.head, pressed && styles.pressed]}
      >
        <Text style={styles.headText}>
          {heading} · {t.steps.length} steps
        </Text>
        <View style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }}>
          <Icon name="chevron-down" size={16} color={colors.sub} />
        </View>
      </Pressable>

      {open ? (
        <View style={styles.list}>
          {t.steps.map((s, i) => (
            <View key={s.label} style={styles.item}>
              <View style={styles.itemMark}>
                <Mark status={statuses[i]} />
              </View>
              <View style={styles.itemBody}>
                <Text style={[styles.itemLabel, statuses[i] === "pending" && styles.pendingText]}>{s.label}</Text>
                <Text style={styles.itemDetail}>{statuses[i] === "failed" ? "Stopped here — try again below" : s.detail}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : finished || failed ? null : (
        <View style={styles.inline}>
          {t.steps.map((s, i) => (
            <View key={s.label} style={styles.inlineItem}>
              <Mark status={statuses[i]} />
              <Text style={[styles.inlineText, statuses[i] === "active" && styles.activeText]}>{s.label}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

/** 完成 = 细勾;进行中 = 呼吸的橙点;失败 = 提示图标;未开始 = 空心小圆 */
function Mark({ status }: { status: StepStatus }) {
  if (status === "done") return <Icon name="check" size={14} color={colors.sub} strokeWidth={2.25} />;
  if (status === "failed") return <Icon name="circle-alert" size={14} color={colors.danger} />;
  if (status === "active") return <PulseDot />;
  return <View style={styles.pendingDot} />;
}

function PulseDot() {
  const a = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(a, { toValue: 0.35, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: false }),
        Animated.timing(a, { toValue: 1, duration: 500, easing: Easing.in(Easing.quad), useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [a]);
  return (
    <View style={styles.markBox}>
      <Animated.View style={[styles.activeDot, { opacity: a }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: "stretch" },
  head: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", minHeight: 32, paddingVertical: 6 },
  pressed: { opacity: 0.5 },
  headText: { ...type.footnote, fontWeight: "500", color: colors.sub },
  inline: { flexDirection: "row", flexWrap: "wrap", columnGap: 12, rowGap: 4 },
  inlineItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  inlineText: { ...type.footnote, color: colors.sub },
  activeText: { color: colors.ink, fontWeight: "600" },
  pendingText: { color: colors.sub },
  list: { gap: 12, paddingTop: 4 },
  item: { flexDirection: "row", gap: 8 },
  itemMark: { width: 14, height: 18, alignItems: "center", justifyContent: "center" },
  itemBody: { flex: 1, gap: 2 },
  itemLabel: { ...type.footnote, fontWeight: "600", color: colors.ink },
  itemDetail: { ...type.footnote, color: colors.sub },
  markBox: { width: 14, height: 14, alignItems: "center", justifyContent: "center" },
  activeDot: { width: 8, height: 8, borderRadius: radius.full, backgroundColor: colors.accent },
  pendingDot: { width: 8, height: 8, marginHorizontal: 3, borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.separator },
});
