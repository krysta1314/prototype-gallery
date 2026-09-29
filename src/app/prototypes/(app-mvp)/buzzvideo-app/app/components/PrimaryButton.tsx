import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from "react-native";
import type { IconName } from "../data";
import { colors, ctaGradient, shadow } from "../theme";
import Gradient from "./Gradient";
import Icon from "./Icon";

type Props = {
  label: string;
  onPress: () => void;
  icon?: IconName;
  variant?: "cta" | "light" | "dark" | "danger";
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

const TEXT: Record<NonNullable<Props["variant"]>, string> = {
  cta: colors.white,
  light: colors.ink,
  dark: colors.white,
  danger: colors.danger,
};

export default function PrimaryButton({ label, onPress, icon, variant = "cta", disabled, style }: Props) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [styles.base, styles[variant], disabled && styles.disabled, pressed && !disabled && styles.pressed, style]}
    >
      {variant === "cta" && <Gradient colors={ctaGradient} angle={90} style={StyleSheet.absoluteFill} pointerEvents="none" />}
      {icon && <Icon name={icon} size={18} color={TEXT[variant]} />}
      <Text style={[styles.label, { color: TEXT[variant] }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
    overflow: "hidden",
  },
  cta: { boxShadow: shadow.cta },
  light: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  dark: { backgroundColor: colors.ink },
  danger: { backgroundColor: colors.dangerSoft },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.85 },
  label: { fontSize: 16, fontWeight: "700" },
});
