import { Pressable, StyleSheet, Text, View } from "react-native";
import type { IconName } from "../data";
import { colors } from "../theme";
import Icon from "./Icon";

type Props = {
  icon?: IconName;
  label: string;
  detail?: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  selected?: boolean;
  chevron?: boolean;
};

export default function Row({ icon, label, detail, value, onPress, danger, selected, chevron }: Props) {
  const tint = danger ? colors.danger : colors.ink;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      {icon && (
        <View style={[styles.icon, danger && { backgroundColor: colors.dangerSoft }]}>
          <Icon name={icon} size={18} color={danger ? colors.danger : colors.accent} />
        </View>
      )}
      <View style={styles.body}>
        <Text style={[styles.label, { color: tint }]}>{label}</Text>
        {detail ? <Text style={styles.detail}>{detail}</Text> : null}
      </View>
      {value ? <Text style={styles.value}>{value}</Text> : null}
      {selected && <Icon name="check" size={18} color={colors.accent} />}
      {chevron && <Icon name="chevron-right" size={18} color={colors.faint} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  pressed: { opacity: 0.6 },
  icon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.peach, alignItems: "center", justifyContent: "center" },
  body: { flex: 1, gap: 2 },
  label: { fontSize: 16, fontWeight: "600" },
  detail: { fontSize: 13, color: colors.sub },
  value: { fontSize: 14, color: colors.sub },
});
