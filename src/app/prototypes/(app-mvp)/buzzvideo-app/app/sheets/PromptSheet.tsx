import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Icon from "../components/Icon";
import Sheet from "../components/Sheet";
import { modeLabel, modelLabel, type Mode } from "../data";
import { useStore } from "../provider";
import { colors, space, type } from "../theme";

/** 参数快照(store.jobParams 的顺序)每一项叫什么 */
const PARAM_LABELS: Record<Mode, string[]> = {
  image: ["Model", "Aspect Ratio", "Resolution"],
  video: ["Model", "Aspect Ratio", "Resolution", "Duration"],
  audio: ["Model", "Sample Rate"],
  agent: [],
  hybrid: [],
};

/**
 * 成片「…」→ View prompt(2026-10-23,照网页版):标题 + Prompt(右侧复制键)+ 一道分隔 + Model Config(模型、比例、清晰度、时长…)。
 * Agent / Hybrid Reel 没有单一模型，Model Config 写模式 + Auto
 */
export default function PromptSheet({ workId, onClose }: { workId: string; onClose: () => void }) {
  const { state, dispatch } = useStore();
  const job = state.jobs.find((j) => j.id === workId);
  if (!job) return null;
  const labels = PARAM_LABELS[job.mode];
  const rows: [string, string][] = job.params?.length
    ? job.params.map((v, i) => [labels[i] ?? "", v] as [string, string]).filter(([k]) => k)
    : [
        ["Mode", modeLabel(job.mode)],
        ["Model", job.model ? modelLabel(job.model) : "Auto"],
      ];
  return (
    <Sheet title={job.title} onClose={onClose}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.head}>
          <Text style={styles.label}>Prompt</Text>
          <Pressable onPress={() => dispatch({ type: "showToast", text: "Prompt copied" })} hitSlop={10} accessibilityRole="button" accessibilityLabel="Copy prompt" style={({ pressed }) => pressed && styles.faded}>
            <Icon name="copy" size={18} color={colors.ink} />
          </Pressable>
        </View>
        <Text style={styles.prompt} selectable>
          {job.prompt}
        </Text>
        <View style={styles.sep} />
        <Text style={styles.label}>Model Config</Text>
        <View style={styles.rows}>
          {rows.map(([k, v]) => (
            <View key={k} style={styles.row}>
              <Text style={styles.key}>{k}</Text>
              <Text style={styles.value}>{v}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  scroll: { maxHeight: 460 },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: space.sm },
  label: { ...type.subhead, fontWeight: "600", color: colors.ink },
  prompt: { ...type.subhead, color: colors.sub, lineHeight: 22 },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: colors.separator, marginVertical: space.lg },
  rows: { marginTop: space.sm, gap: space.sm, paddingBottom: space.md },
  row: { flexDirection: "row" },
  key: { width: 116, ...type.footnote, color: colors.sub },
  value: { flex: 1, ...type.footnote, color: colors.ink },
  faded: { opacity: 0.5 },
});
