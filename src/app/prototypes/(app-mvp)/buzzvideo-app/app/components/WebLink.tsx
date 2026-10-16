import { Pressable, StyleSheet, Text } from "react-native";
import { useStore } from "../provider";
import { showWebLink } from "../store";
import { colors, type } from "../theme";

/**
 * 美区网页付款外链(spec §2.4):只在美区显示,不抢内购主按钮。
 * 真实 APP:系统浏览器打开已登录的 buzzvideo.ai(一次性 token),URL 带 APP 来源参数,成交归属 APP
 */
export default function WebLink({ label, tone = "light" }: { label: string; tone?: "light" | "dark" }) {
  const { state, dispatch } = useStore();
  if (!showWebLink(state)) return null;
  return (
    <Pressable
      onPress={() => dispatch({ type: "showToast", text: "Opens buzzvideo.ai in your browser" })}
      accessibilityRole="link"
      hitSlop={13}
      style={styles.wrap}
    >
      <Text style={[styles.link, tone === "dark" && styles.dark]}>{label} ›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: "center" },
  link: { ...type.footnote, color: colors.sub, fontWeight: "500" },
  dark: { color: "rgba(255,255,255,0.8)" },
});
