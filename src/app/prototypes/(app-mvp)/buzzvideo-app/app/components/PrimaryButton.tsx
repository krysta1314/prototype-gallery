import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from "react-native";
import type { IconName } from "../data";
import { colors, ctaGradient, radius, type } from "../theme";
import Gradient from "./Gradient";
import Icon from "./Icon";
import { pressScale } from "./motion";

export type ButtonVariant =
  /** 每屏唯一的主按钮 —— 全 APP 唯一的渐变,无彩色阴影 */
  | "cta"
  /** 次级:分组底 + 墨色字 */
  | "light"
  /** 白底墨字:压在深色图上的主要按钮(如 Login 的 Apple / Google) */
  | "white"
  /** 墨色底白字 */
  | "dark"
  /** 透明底 + 白色细边 + 白字:压在深色图上的次级按钮 */
  | "onImage"
  /** 破坏性操作:分组底 + 红字 */
  | "danger";

type Props = {
  label: string;
  onPress: () => void;
  icon?: IconName;
  /** 自定义前置图形(如登录按钮的 Apple / Google 标),优先于 icon */
  leading?: ReactNode;
  variant?: ButtonVariant;
  /** lg = 52 高(默认),md = 44 高 */
  size?: "lg" | "md";
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

const TEXT: Record<ButtonVariant, string> = {
  cta: colors.white,
  light: colors.ink,
  white: colors.ink,
  dark: colors.white,
  onImage: colors.white,
  danger: colors.danger,
};

export default function PrimaryButton({ label, onPress, icon, leading, variant = "cta", size = "lg", disabled, accessibilityLabel, style }: Props) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        styles.base,
        size === "md" && styles.md,
        styles[variant],
        disabled && styles.disabled,
        pressScale(pressed && !disabled),
        style,
      ]}
    >
      {variant === "cta" && <Gradient colors={ctaGradient} angle={90} style={StyleSheet.absoluteFill} pointerEvents="none" />}
      {leading ?? (icon && <Icon name={icon} size={20} color={TEXT[variant]} />)}
      <Text style={[styles.label, { color: TEXT[variant] }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
    overflow: "hidden",
  },
  md: { height: 44, paddingHorizontal: 16 },
  cta: {},
  light: { backgroundColor: colors.grouped },
  white: { backgroundColor: colors.white },
  dark: { backgroundColor: colors.ink },
  onImage: { borderWidth: 1, borderColor: "rgba(255,255,255,0.6)" },
  danger: { backgroundColor: colors.grouped },
  disabled: { opacity: 0.4 },
  label: { ...type.headline },
});
