import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import AuthGlyph from "../components/AuthGlyph";
import Gradient from "../components/Gradient";
import Icon from "../components/Icon";
import MediaVideo from "../components/MediaVideo";
import { pressScale } from "../components/motion";
import { A } from "../data";
import { useInsets, useNav, useStore } from "../provider";
import { colors, radius, space, type } from "../theme";

/**
 * 登录(参照即梦):成片铺满全屏,下半屏压暗;标题 + 注册福利居中;三个全圆角胶囊登录按钮(图标靠左、文字居中);
 * 最底部一行说明「By continuing, you agree to…」(海外常见做法,不做勾选框)。深色图上只用白系按钮(这屏不用橙渐变)。
 */
export default function Login() {
  const { dispatch } = useStore();
  const { navigate } = useNav();
  const insets = useInsets();
  const signIn = () => {
    navigate({ type: "reset" });
    dispatch({ type: "signIn" });
  };
  const legal = (doc: string) => dispatch({ type: "showToast", text: `Opens ${doc}` });

  return (
    <View style={styles.root}>
      <MediaVideo uri={`${A}/result-agent.mp4`} poster={`${A}/result-agent.jpg`} muted loop autoPlay style={StyleSheet.absoluteFill} />
      <Gradient colors={["rgba(0,0,0,0.4)", "rgba(0,0,0,0)"]} style={styles.topScrim} pointerEvents="none" />
      <Gradient colors={["rgba(16,16,24,0)", "rgba(16,16,24,0.55)", "rgba(16,16,24,0.88)", "rgba(16,16,24,0.96)"]} style={styles.bottomScrim} pointerEvents="none" />

      <View style={[styles.bottom, { paddingBottom: insets.bottom + space.md }]}>
        <View style={styles.copy}>
          <Text style={styles.title} accessibilityRole="header">
            Make your first AI ad
          </Text>
          <Text style={styles.subtitle}>Sign up free and get credits for your first ads</Text>
        </View>

        <View style={styles.actions}>
          <LoginButton leading={<AuthGlyph provider="apple" />} label="Continue with Apple" onPress={signIn} />
          <LoginButton leading={<AuthGlyph provider="google" size={18} />} label="Continue with Google" onPress={signIn} />
          <LoginButton leading={<Icon name="mail" size={18} color={colors.ink} />} label="Continue with email" onPress={signIn} />
        </View>

        <Text style={styles.legal}>
          By continuing, you agree to our{" "}
          <Text style={styles.link} onPress={() => legal("Terms of Service")}>
            Terms of Service
          </Text>{" "}
          and{" "}
          <Text style={styles.link} onPress={() => legal("Privacy Policy")}>
            Privacy Policy
          </Text>
          .
        </Text>
      </View>
    </View>
  );
}

/** 全圆角浅色胶囊:图标固定在左侧,文字在整条按钮里居中 */
function LoginButton({ leading, label, onPress }: { leading: ReactNode; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => [styles.button, pressScale(pressed)]}>
      <View style={styles.buttonIcon}>{leading}</View>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.black },
  topScrim: { position: "absolute", left: 0, right: 0, top: 0, height: 160 },
  bottomScrim: { position: "absolute", left: 0, right: 0, bottom: 0, height: "62%" },
  bottom: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: space.xl, gap: space.xl },
  copy: { gap: space.sm, alignItems: "center" },
  title: { ...type.title1, color: colors.white, textAlign: "center" },
  subtitle: { ...type.subhead, color: "rgba(255,255,255,0.8)", textAlign: "center" },
  actions: { gap: space.md },
  button: {
    height: 56,
    borderRadius: radius.full,
    backgroundColor: "rgba(255,255,255,0.94)",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonIcon: { position: "absolute", left: space.xl, top: 0, bottom: 0, justifyContent: "center" },
  buttonText: { ...type.headline, fontWeight: "500", color: colors.ink },
  legal: { ...type.footnote, color: "rgba(255,255,255,0.7)", textAlign: "center" },
  link: { color: colors.white, fontWeight: "600" },
});
