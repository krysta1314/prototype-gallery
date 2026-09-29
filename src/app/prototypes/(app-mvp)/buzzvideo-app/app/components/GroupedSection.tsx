import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { colors, radius, type } from "../theme";
import Row, { RowInsetContext } from "./Row";

type Props = {
  children: ReactNode;
  /** 分组上方的小标题(footnote,sub,不大写) */
  header?: string;
  /** 分组下方的说明(footnote,sub) */
  footer?: string;
  /** inset:白面 + md 圆角,放在 grouped 底上(Settings);tinted:grouped 面 + md 圆角,放在页面底上(Me);
   *  plain:无底色平铺,放在白色 sheet 里 */
  variant?: "inset" | "tinted" | "plain";
  style?: StyleProp<ViewStyle>;
};

/** iOS inset-grouped 分组:子元素里的 <Row> 自动在第二行起画 hairline 分隔线 */
export default function GroupedSection({ children, header, footer, variant = "inset", style }: Props) {
  const inset = variant !== "plain";
  // 只给 <Row> 注入 separator(不要用 Fragment 包 Row,否则拿不到分隔线)
  const rows = Children.toArray(children)
    .filter(isValidElement)
    .map((child, i) => (child.type === Row ? cloneElement(child as ReactElement<{ separator?: boolean }>, { separator: i > 0 }) : child));
  return (
    <View style={style}>
      {header ? <Text style={[styles.note, styles.header, !inset && styles.flush]}>{header}</Text> : null}
      <RowInsetContext.Provider value={inset ? 16 : 0}>
        <View style={inset ? [styles.inset, variant === "tinted" && styles.tinted] : null}>{rows}</View>
      </RowInsetContext.Provider>
      {footer ? <Text style={[styles.note, styles.footer, !inset && styles.flush]}>{footer}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  inset: { backgroundColor: colors.surface, borderRadius: radius.md, overflow: "hidden" },
  tinted: { backgroundColor: colors.grouped },
  note: { ...type.footnote, color: colors.sub, paddingHorizontal: 16 },
  flush: { paddingHorizontal: 0 },
  header: { marginBottom: 8 },
  footer: { marginTop: 8 },
});
