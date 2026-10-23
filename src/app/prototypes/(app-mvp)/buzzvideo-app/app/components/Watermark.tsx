import { StyleSheet, Text, View } from "react-native";
import { colors, radius, type } from "../theme";

/**
 * Free 用户成片的 BuzzVideo 水印(spec §7.2,和网页一致;订阅后去掉)。
 * 位置在画面右下角(和网页版一致)。bottom:下面压着播放条 / 操作栏时往上让出的距离。
 * 原型里只是叠一层;真实 APP 里水印烧进导出的文件(右下角),保存 / 分享出去的也带
 */
export default function Watermark({ size = "lg", bottom }: { size?: "sm" | "lg"; bottom?: number }) {
  const sm = size === "sm";
  return (
    <View style={[styles.wrap, sm ? styles.posSm : styles.posLg, bottom !== undefined && { bottom }, { pointerEvents: "none" }]} accessibilityLabel="BuzzVideo watermark">
      <Dot size={sm ? 10 : 14} />
      <Text style={[styles.text, sm && styles.textSm]}>BuzzVideo</Text>
    </View>
  );
}

/** 水印前的小圆标(实心橙圆 + 白色细环);和积分图标无关，积分图标 2026-10-21 换成了 credits.svg */
function Dot({ size }: { size: number }) {
  const inset = Math.max(2, Math.round(size * 0.2));
  return (
    <View style={{ width: size, height: size, borderRadius: radius.full, backgroundColor: colors.accent }}>
      <View style={{ position: "absolute", top: inset, left: inset, right: inset, bottom: inset, borderRadius: radius.full, borderWidth: 1, borderColor: "rgba(255,255,255,0.9)" }} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", flexDirection: "row", alignItems: "center", gap: 4, opacity: 0.85 },
  posLg: { right: 16, bottom: 16 },
  posSm: { right: 8, bottom: 8 },
  text: { ...type.footnote, fontWeight: "700", color: "#ffffff", textShadowColor: "rgba(0,0,0,0.45)", textShadowRadius: 4 },
  textSm: { fontSize: 11, lineHeight: 13 },
});
