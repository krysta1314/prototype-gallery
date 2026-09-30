import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, type } from "../theme";

type Props<T extends string> = { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void };

/** iOS 分段控件:分组底,选中块更亮一层(raised),无阴影 */
export default function Segmented<T extends string>({ value, options, onChange }: Props<T>) {
  return (
    <View style={styles.wrap} accessibilityRole="tablist">
      {options.map((o) => {
        const active = o.id === value;
        return (
          <Pressable
            key={o.id}
            onPress={() => onChange(o.id)}
            hitSlop={{ top: 6, bottom: 6 }}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[styles.item, active && styles.active]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", backgroundColor: colors.grouped, borderRadius: radius.md, padding: 2 },
  item: { flex: 1, height: 32, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  active: { backgroundColor: colors.raised },
  label: { ...type.footnote, fontWeight: "500", color: colors.sub },
  labelActive: { color: colors.ink, fontWeight: "600" },
});
