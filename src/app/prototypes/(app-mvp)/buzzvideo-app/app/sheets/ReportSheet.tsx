import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import PrimaryButton from "../components/PrimaryButton";
import Sheet from "../components/Sheet";
import { useStore } from "../provider";
import { colors, radius, type } from "../theme";

const REASONS = [
  "Sexual or explicit content",
  "Violent or hateful content",
  "Misleading or impersonates a real person",
  "Something else",
];

/** 举报:Apple / Google 对 AI 生成内容的硬性要求 */
export default function ReportSheet({ onClose }: { onClose: () => void }) {
  const { dispatch } = useStore();
  const [reason, setReason] = useState<string | null>(null);
  const submit = () => {
    dispatch({ type: "reportContent" });
    onClose();
  };
  return (
    <Sheet title="Report" onClose={onClose}>
      <Text style={styles.sub}>Why are you reporting this?</Text>
      {/* 单选：左边单选圆圈(2026-10-21 从右侧打勾改成 radio button) */}
      <View accessibilityRole="radiogroup">
        {REASONS.map((r, i) => {
          const on = reason === r;
          return (
            <Pressable
              key={r}
              onPress={() => setReason(r)}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              style={[styles.option, i < REASONS.length - 1 && styles.optionLine]}
            >
              <View style={[styles.radio, on && styles.radioOn]}>{on ? <View style={styles.radioDot} /> : null}</View>
              <Text style={styles.optionText}>{r}</Text>
            </Pressable>
          );
        })}
      </View>
      {/* 白色按钮(2026-10-21):举报不是转化动作，不用品牌渐变 */}
      <PrimaryButton label="Submit report" variant="dark" disabled={!reason} onPress={submit} style={styles.btn} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  sub: { ...type.subhead, color: colors.sub, marginBottom: 4 },
  btn: { marginTop: 12 },
  option: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 48, paddingVertical: 10 },
  optionLine: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator },
  optionText: { ...type.body, color: colors.ink, flex: 1 },
  radio: { width: 22, height: 22, borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.faint, alignItems: "center", justifyContent: "center" },
  radioOn: { borderColor: colors.ink },
  radioDot: { width: 12, height: 12, borderRadius: radius.full, backgroundColor: colors.ink },
});
