import { Pressable, StyleSheet, Text } from "react-native";
import type { IconName } from "../data";
import { colors, radius, type } from "../theme";
import Icon from "./Icon";
import { pressScale } from "./motion";

type Props = {
  label: string;
  icon?: IconName;
  trailing?: IconName;
  onPress?: () => void;
  /** 选中:墨色底白字(橙色留给主动作) */
  active?: boolean;
  /** 只显示图标,label 作为无障碍名称 */
  iconOnly?: boolean;
};

/** 轻量胶囊:无边框、分组底、footnote 500;高 36,hitSlop 补足 44 */
export default function Pill({ label, icon, trailing, onPress, active, iconOnly }: Props) {
  const hideLabel = !!iconOnly && !!icon;
  const tint = active ? colors.white : colors.ink;
  return (
    <Pressable
      onPress={onPress}
      hitSlop={{ top: 4, bottom: 4, left: 2, right: 2 }}
      accessibilityRole="button"
      accessibilityLabel={hideLabel ? label : undefined}
      accessibilityState={{ selected: !!active }}
      style={({ pressed }) => [styles.base, hideLabel && styles.iconOnly, active && styles.active, pressScale(pressed)]}
    >
      {icon && <Icon name={icon} size={16} color={tint} />}
      {!hideLabel && (
        <Text style={[styles.label, { color: tint }]} numberOfLines={1}>
          {label}
        </Text>
      )}
      {trailing && <Icon name={trailing} size={14} color={active ? colors.white : colors.sub} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: radius.full,
    backgroundColor: colors.grouped,
  },
  iconOnly: { paddingHorizontal: 10 },
  active: { backgroundColor: colors.ink },
  label: { ...type.footnote, fontWeight: "500" },
});
