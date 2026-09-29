import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useInsets } from "../provider";
import { colors, type } from "../theme";

type Props = {
  /** 居中标题(headline);Large Title 页面在滚动后才传 */
  title?: string;
  /** 左侧槽位,通常是一个 IconButton */
  left?: ReactNode;
  /** 右侧槽位,可放多个 IconButton */
  right?: ReactNode;
  /** 页面已滚动:出现 92% 页面底色 + hairline 底线 */
  scrolled?: boolean;
  /** 是否在顶部加安全区(默认 true) */
  inset?: boolean;
};

/** iOS 标准导航栏:高 44,标题居中,左右图标按钮无底色 */
export default function NavBar({ title, left, right, scrolled, inset = true }: Props) {
  const insets = useInsets();
  return (
    <View style={[styles.wrap, { paddingTop: inset ? insets.top : 0 }, scrolled && styles.scrolled]}>
      <View style={styles.bar}>
        <View style={styles.side}>{left}</View>
        <View style={[styles.side, styles.right]}>{right}</View>
        {title ? (
          <View style={styles.titleBox}>
            <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
              {title}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { zIndex: 1, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "transparent" },
  scrolled: { backgroundColor: "rgba(250,248,246,0.92)", borderBottomColor: colors.separator },
  bar: { height: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4 },
  side: { flexDirection: "row", alignItems: "center", zIndex: 1 },
  right: { justifyContent: "flex-end" },
  // 标题绝对居中,不受左右按钮数量影响;两侧各留 3 个按钮的宽度
  titleBox: { position: "absolute", left: 92, right: 92, top: 0, bottom: 0, alignItems: "center", justifyContent: "center", pointerEvents: "none" },
  title: { ...type.headline, color: colors.ink },
});
