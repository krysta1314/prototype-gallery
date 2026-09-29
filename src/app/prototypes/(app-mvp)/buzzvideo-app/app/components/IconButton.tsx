import { Pressable, StyleSheet, Text, View } from "react-native";
import type { IconName } from "../data";
import { colors, HIT, radius, type } from "../theme";
import Icon from "./Icon";

type Props = {
  icon: IconName;
  onPress: () => void;
  /** 右上角数字角标(0 不显示) */
  badge?: number;
  /** plain:无底色(导航栏、列表);onImage:压在图片上的半透明深色圆 */
  tone?: "plain" | "onImage";
  /** plain 时的图标色,默认 ink */
  color?: string;
  accessibilityLabel?: string;
};

/** 图标按钮:22px 图标,44×44 点击区 */
export default function IconButton({ icon, onPress, badge = 0, tone = "plain", color, accessibilityLabel }: Props) {
  const onImage = tone === "onImage";
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? icon}
      style={({ pressed }) => [styles.hit, pressed && styles.pressed]}
    >
      <View style={[styles.glyph, onImage && styles.onImage]}>
        <Icon name={icon} size={22} color={onImage ? colors.white : (color ?? colors.ink)} />
      </View>
      {badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: { width: HIT, height: HIT, alignItems: "center", justifyContent: "center" },
  // iOS 导航栏按钮按下是变淡,不缩放
  pressed: { opacity: 0.5 },
  glyph: { width: 36, height: 36, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  onImage: { backgroundColor: colors.onImage },
  badge: {
    position: "absolute",
    top: 4,
    right: 3,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { ...type.caption, color: colors.white, fontVariant: ["tabular-nums"] },
});
