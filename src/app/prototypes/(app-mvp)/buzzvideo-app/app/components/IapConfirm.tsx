import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, smoothCorners, type } from "../theme";

/** 模拟 App Store 应用内购买确认(系统弹窗,按 iOS 样式,不走品牌色) */
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

const styles = StyleSheet.create({
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.3)", alignItems: "center", justifyContent: "center", zIndex: 10 },
  alert: {
    width: 300,
    padding: 20,
    gap: 18,
    borderRadius: 34,
    ...smoothCorners,
    backgroundColor: "rgba(250,250,252,0.96)",
    boxShadow: "inset 0 1px 0.5px rgba(255,255,255,0.9), 0 20px 50px rgba(0,0,0,0.25)",
  },
  textBox: { gap: 6, paddingHorizontal: 4 },
  title: { ...type.headline, color: colors.black, textAlign: "center" },
  message: { ...type.footnote, color: "#3c3c43", textAlign: "center" },
  buttons: { flexDirection: "row", gap: 10 },
  flex: { flex: 1 },
  button: { height: 48, borderRadius: radius.full, backgroundColor: "rgba(120,120,128,0.14)", alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  buttonText: { ...type.headline, fontWeight: "500", color: colors.iosBlue },
  strong: { fontWeight: "600" },
});
