import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { colors, radius, smoothCorners, type } from "../theme";

/** 模拟 App Store 应用内购买确认(系统弹窗,按 iOS 深色模式样式,不走品牌色) */
export default function IapConfirm({
  title,
  message,
  onCancel,
  onConfirm,
}: {
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <View style={styles.overlay}>
      <View style={styles.alert} accessibilityViewIsModal>
        <View style={styles.textBox}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
        </View>
        <View style={styles.buttons}>
          <Pressable onPress={onCancel} accessibilityRole="button" style={[styles.button, styles.flex]}>
            <Text style={styles.buttonText}>Cancel</Text>
          </Pressable>
          <Pressable onPress={onConfirm} accessibilityRole="button" style={[styles.button, styles.flex]}>
            <Text style={[styles.buttonText, styles.strong]}>Subscribe</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/** 系统材质的背景模糊(网页端 CSS;原生端由 UIVisualEffectView 提供) */
const BLUR = { backdropFilter: "blur(30px) saturate(180%)" } as unknown as ViewStyle;

const styles = StyleSheet.create({
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center", zIndex: 10 },
  alert: {
    width: 300,
    padding: 20,
    gap: 18,
    borderRadius: 34,
    ...smoothCorners,
    backgroundColor: "rgba(30,30,32,0.8)",
    ...BLUR,
    boxShadow: "inset 0 1px 0.5px rgba(255,255,255,0.14), inset 0 0 0 0.5px rgba(255,255,255,0.08), 0 20px 50px rgba(0,0,0,0.5)",
  },
  textBox: { gap: 6, paddingHorizontal: 4 },
  title: { ...type.headline, color: colors.white, textAlign: "center" },
  message: { ...type.footnote, color: "rgba(235,235,245,0.6)", textAlign: "center" },
  buttons: { flexDirection: "row", gap: 10 },
  flex: { flex: 1 },
  button: { height: 48, borderRadius: radius.full, backgroundColor: colors.systemFill, alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  buttonText: { ...type.headline, fontWeight: "500", color: colors.iosBlue },
  strong: { fontWeight: "600" },
});
