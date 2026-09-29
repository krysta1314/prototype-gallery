import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import AuthGlyph from "../components/AuthGlyph";
import Gradient from "../components/Gradient";
import MediaVideo from "../components/MediaVideo";
import PrimaryButton from "../components/PrimaryButton";
import { A } from "../data";
import { useInsets, useNav, useStore } from "../provider";
import { colors, space, type } from "../theme";

/** 登录:一条真实成片铺满全屏,品牌字标 + 短标题压在下半屏;深色图上只用白系按钮(这屏不用橙渐变) */
export default function Login() {
  const { dispatch } = useStore();
  const { navigate } = useNav();
  const insets = useInsets();
  const signIn = () => {
    navigate({ type: "reset" });
    dispatch({ type: "signIn" });
  };
  // 第一次打开 APP、登录页出现时就请求推送授权(已回答过则 store 忽略)
  useEffect(() => {
    dispatch({ type: "requestPermission", kind: "push" });
  }, [dispatch]);
  const legal = (doc: string) => dispatch({ type: "showToast", text: `Opens ${doc}` });

  return (
    <View style={styles.root}>
      <MediaVideo uri={`${A}/result-agent.mp4`} poster={`${A}/result-agent.jpg`} muted loop autoPlay style={StyleSheet.absoluteFill} />
      <Gradient colors={["rgba(0,0,0,0.4)", "rgba(0,0,0,0)"]} style={styles.topScrim} pointerEvents="none" />
      <Gradient colors={["rgba(26,26,46,0)", "rgba(26,26,46,0.6)", "rgba(26,26,46,0.85)", "rgba(26,26,46,0.94)"]} style={styles.bottomScrim} pointerEvents="none" />

      <Text style={[styles.wordmark, { top: insets.top + space.sm }]} accessibilityRole="header">
        BuzzVideo
      </Text>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + space.lg }]}>
        <View style={styles.copy}>
          <Text style={styles.title}>{"Ads from what\nyou shoot."}</Text>
          <Text style={styles.subtitle}>Film it on your phone. We’ll plan, edit and cut it into an ad.</Text>
        </View>
        <View style={styles.actions}>
          <PrimaryButton variant="white" label="Continue with Apple" leading={<AuthGlyph provider="apple" />} onPress={signIn} />
          <PrimaryButton variant="white" label="Continue with Google" leading={<AuthGlyph provider="google" size={18} />} onPress={signIn} />
          <PrimaryButton variant="onImage" icon="mail" label="Continue with email" onPress={signIn} />
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.black },
  topScrim: { position: "absolute", left: 0, right: 0, top: 0, height: 160 },
  bottomScrim: { position: "absolute", left: 0, right: 0, bottom: 0, height: "72%" },
  wordmark: { position: "absolute", left: space.xl, ...type.title1, color: colors.white },
  bottom: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: space.xl, gap: space.xl },
  copy: { gap: space.sm },
  title: { ...type.largeTitle, color: colors.white },
  subtitle: { ...type.subhead, color: "rgba(255,255,255,0.8)", maxWidth: 300 },
  actions: { gap: space.md },
  legal: { ...type.footnote, color: "rgba(255,255,255,0.7)", textAlign: "center" },
  link: { color: colors.white, textDecorationLine: "underline" },
});
