import { StyleSheet, Text, View } from "react-native";
import { type } from "../theme";
import Coin from "./Coin";

/**
 * Free 用户成片的 BuzzVideo 水印(spec §7.2,和网页一致;订阅后去掉)。
 * 原型里只是叠一层;真实 APP 里水印烧进导出的文件,保存 / 分享出去的也带
 */
export default function Watermark({ size = "lg" }: { size?: "sm" | "lg" }) {
  const sm = size === "sm";
  return (
    <View style={[styles.wrap, sm ? styles.posSm : styles.posLg, { pointerEvents: "none" }]} accessibilityLabel="BuzzVideo watermark">
      <Coin size={sm ? 10 : 14} />
      <Text style={[styles.text, sm && styles.textSm]}>BuzzVideo</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", flexDirection: "row", alignItems: "center", gap: 4, opacity: 0.85 },
  posLg: { right: 16, top: "42%" },
  posSm: { right: 8, top: 8 },
  text: { ...type.footnote, fontWeight: "700", color: "#ffffff", textShadowColor: "rgba(0,0,0,0.45)", textShadowRadius: 4 },
  textSm: { fontSize: 10, lineHeight: 12 },
});
