import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import PrimaryButton from "../components/PrimaryButton";
import Row from "../components/Row";
import Sheet from "../components/Sheet";
import { useStore } from "../provider";
import { colors } from "../theme";

const REASONS = [
  "Sexual or explicit content",
  "Violence or harm",
  "Hateful or harassing content",
  "Misleading or impersonates a real person",
  "Copyright or trademark",
  "Something else",
];

/** 举报:Apple / Google 对 AI 生成内容的硬性要求 */
export default function ReportSheet({ onClose }: { onClose: () => void }) {
  const { dispatch } = useStore();
  const [reason, setReason] = useState<string | null>(null);
  const submit = () => {
    dispatch({ type: "showToast", text: "Thanks — we’ll review this within 24 hours." });
    onClose();
  };
  return (
    <Sheet title="Report" onClose={onClose}>
      <Text style={styles.sub}>Why are you reporting this?</Text>
      <View>
        {REASONS.map((r) => (
          <Row key={r} label={r} selected={reason === r} onPress={() => setReason(r)} />
        ))}
      </View>
      <PrimaryButton label="Submit report" disabled={!reason} onPress={submit} style={styles.btn} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  sub: { fontSize: 14, color: colors.sub, marginBottom: 4 },
  btn: { marginTop: 12 },
});
