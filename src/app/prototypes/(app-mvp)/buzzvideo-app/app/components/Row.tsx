import { createContext, useContext, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { IconName } from "../data";
import { colors, type } from "../theme";
import Icon from "./Icon";

type Props = {
  label: string;
  /** 次行说明;有 detail 时 label 用 headline、detail 用 subhead */
  detail?: string;
  /** 右侧灰字值(如 "On" / "English") */
  value?: string;
  /** 可选的 sub 色线性图标,无底色 tile */
  icon?: IconName;
  onPress?: () => void;
  danger?: boolean;
  /** 列表勾选(橙色 check) */
  selected?: boolean;
  chevron?: boolean;
  /** 右侧自定义节点,如 <Switch /> */
  right?: ReactNode;
  /** 由 GroupedSection 注入:是否在顶部画 hairline(首行不画) */
  separator?: boolean;
};

/** GroupedSection 通过 context 告诉 Row 左右内边距(inset 分组 16,平铺列表 0) */
export const RowInsetContext = createContext(16);

const ICON = 22;
const ICON_GAP = 12;

/** iOS inset-grouped 行:行高 ≥ 44,分隔线从文字起始处开始,chevron 用 faint */
export default function Row({ label, detail, value, icon, onPress, danger, selected, chevron, right, separator = false }: Props) {
  const pad = useContext(RowInsetContext);
  const textStart = pad + (icon ? ICON + ICON_GAP : 0);
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityState={selected !== undefined ? { selected } : undefined}
      style={({ pressed }) => [styles.row, { paddingHorizontal: pad }, pressed && !!onPress && styles.pressed]}
    >
      {separator ? <View style={[styles.sep, { left: textStart }]} /> : null}
      {icon ? <Icon name={icon} size={ICON} color={danger ? colors.danger : colors.sub} /> : null}
      <View style={[styles.body, detail ? styles.bodyTall : null]}>
        <Text style={[detail ? styles.labelStrong : styles.label, danger && styles.danger]}>{label}</Text>
        {detail ? <Text style={styles.detail}>{detail}</Text> : null}
      </View>
      {value ? <Text style={styles.value}>{value}</Text> : null}
      {right}
      {selected ? <Icon name="check" size={20} color={colors.accent} strokeWidth={2.25} /> : null}
      {chevron ? <Icon name="chevron-right" size={18} color={colors.faint} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: ICON_GAP, minHeight: 44 },
  pressed: { backgroundColor: "rgba(26,26,46,0.05)" },
  sep: { position: "absolute", top: 0, right: 0, height: StyleSheet.hairlineWidth, backgroundColor: colors.separator },
  body: { flex: 1, paddingVertical: 11 },
  bodyTall: { paddingVertical: 12, gap: 2 },
  label: { ...type.body, color: colors.ink },
  labelStrong: { ...type.headline, color: colors.ink },
  danger: { color: colors.danger },
  detail: { ...type.subhead, color: colors.sub },
  value: { ...type.body, color: colors.sub },
});
