import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, shadow } from "../theme";

type Props<T extends string> = { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void };

export default function Segmented<T extends string>({ value, options, onChange }: Props<T>) {
  return (
    <View style={styles.wrap}>
      {options.map((o) => {
        const active = o.id === value;
        return (
          <Pressable key={o.id} onPress={() => onChange(o.id)} style={[styles.item, active && styles.active]}>
            <Text style={[styles.label, active && styles.labelActive]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", backgroundColor: colors.surfaceMuted, borderRadius: 14, padding: 3 },
  item: { flex: 1, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  active: { backgroundColor: colors.surface, boxShadow: shadow.card },
  label: { fontSize: 14, fontWeight: "600", color: colors.sub },
  labelActive: { color: colors.ink, fontWeight: "700" },
});
