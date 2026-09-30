import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { colors, smoothCorners } from "../theme";

export type AlertButton = { label: string; onPress: () => void; /** 推荐操作:蓝底白字 */ preferred?: boolean };

type Props = {
  title: string;
  /** 正文,可以是多段;段内可以嵌 SystemAlertLink */
  children: ReactNode;
  buttons: AlertButton[];
  /** 按钮超过 2 个时自动竖排 */
  vertical?: boolean;
};

/**
 * 模拟 iOS 26 系统弹窗(深色模式液态玻璃):大圆角连续曲率、深色半透明玻璃底,标题与正文左对齐,
 * 按钮是并排的胶囊(推荐操作蓝底白字,其余灰底白字)。这是系统 UI,不走品牌色。
 * 真实 APP:权限弹窗由系统弹出;隐私告知用 UIAlertController(preferredAction = Agree)。
 */
export default function SystemAlert({ title, children, buttons, vertical = buttons.length > 2 }: Props) {
  return (
    <View style={styles.overlay}>
      <View style={styles.alert} accessibilityViewIsModal accessibilityRole="alert">
        <View style={styles.textBox}>
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          {children}
        </View>
        <View style={[styles.buttons, vertical && styles.buttonsVertical]}>
          {buttons.map((b) => (
            <Pressable
              key={b.label}
              onPress={b.onPress}
              accessibilityRole="button"
              style={({ pressed }) => [styles.button, !vertical && styles.buttonHorizontal, b.preferred && styles.buttonPreferred, pressed && styles.pressed]}
            >
              <Text style={[styles.buttonText, b.preferred && styles.buttonTextPreferred]}>{b.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

/** 弹窗正文的一段 */
export function SystemAlertMessage({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "error" }) {
  return <Text style={[styles.message, tone === "error" && styles.error]}>{children}</Text>;
}

/** 正文里的链接(系统蓝) */
export function SystemAlertLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Text style={styles.link} accessibilityRole="link" onPress={onPress}>
      {label}
    </Text>
  );
}

const GLASS = {
  backgroundColor: "rgba(30,30,32,0.8)",
  backdropFilter: "blur(30px) saturate(180%)",
  boxShadow: "inset 0 1px 0.5px rgba(255,255,255,0.14), inset 0 0 0 0.5px rgba(255,255,255,0.08), 0 20px 50px rgba(0,0,0,0.5)",
} as unknown as ViewStyle;

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  alert: { width: 300, padding: 22, gap: 20, borderRadius: 34, ...smoothCorners, ...GLASS },
  textBox: { gap: 8 },
  title: { fontSize: 17, lineHeight: 22, fontWeight: "600", letterSpacing: -0.4, color: colors.white },
  message: { fontSize: 15, lineHeight: 20, letterSpacing: -0.2, color: "rgba(235,235,245,0.6)" },
  error: { color: colors.danger },
  link: { color: colors.iosBlue },
  buttons: { flexDirection: "row", gap: 10 },
  buttonsVertical: { flexDirection: "column" },
  button: { height: 48, borderRadius: 999, backgroundColor: colors.systemFill, alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  buttonHorizontal: { flex: 1 },
  buttonPreferred: { backgroundColor: colors.iosBlue },
  pressed: { opacity: 0.7 },
  buttonText: { fontSize: 17, lineHeight: 22, fontWeight: "500", letterSpacing: -0.4, color: colors.white },
  buttonTextPreferred: { color: colors.white, fontWeight: "600" },
});
