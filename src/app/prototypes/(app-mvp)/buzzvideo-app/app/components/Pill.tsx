import { Pressable, StyleSheet, Text } from "react-native";
import type { IconName } from "../data";
import { colors } from "../theme";
import Icon from "./Icon";

type Props = { label: string; icon?: IconName; trailing?: IconName; onPress?: () => void; active?: boolean; small?: boolean; iconOnly?: boolean };

export default function Pill({ label, icon, trailing, onPress, active, small, iconOnly }: Props) {
  const hideLabel = !!iconOnly && !!icon;
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={hideLabel ? label : undefined}
      style={({ pressed }) => [styles.base, small && styles.small, hideLabel && styles.iconOnly, active && styles.active, pressed && styles.pressed]}
    >
      {icon && <Icon name={icon} size={small ? 14 : 16} color={active ? colors.accent : colors.ink} />}
      {!hideLabel && (
        <Text style={[styles.label, small && styles.labelSmall, active && styles.labelActive]} numberOfLines={1}>
          {label}
        </Text>
      )}
      {trailing && <Icon name={trailing} size={14} color={colors.sub} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  small: { height: 32, paddingHorizontal: 12 },
  iconOnly: { paddingHorizontal: 9, gap: 3 },
  active: { backgroundColor: colors.peach, borderColor: colors.peachLine },
  pressed: { opacity: 0.7 },
  label: { fontSize: 14, fontWeight: "600", color: colors.ink },
  labelSmall: { fontSize: 13 },
  labelActive: { color: colors.accent },
});
