import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Gradient from "../components/Gradient";
import PrimaryButton from "../components/PrimaryButton";
import { useInsets, useNav, useStore } from "../provider";
import { colors, ctaGradient, type } from "../theme";

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
    <View style={[styles.root, { paddingTop: insets.top + 72, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.hero}>
        <Gradient colors={ctaGradient} angle={135} style={styles.logo}>
          <Text style={styles.logoText}>B</Text>
        </Gradient>
        <Text style={styles.title}>Welcome to BuzzVideo AI</Text>
        <Text style={styles.subtitle}>Shoot, generate and share ads — right from your phone.</Text>
      </View>
      <View style={styles.actions}>
        <PrimaryButton variant="dark" label="Continue with Apple" onPress={signIn} />
        <PrimaryButton variant="light" label="Continue with Google" onPress={signIn} />
        <PrimaryButton variant="light" label="Continue with email" onPress={signIn} />
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
  root: { flex: 1, paddingHorizontal: 24, justifyContent: "space-between" },
  hero: { alignItems: "center", gap: 14 },
  logo: { width: 76, height: 76, borderRadius: 24, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  logoText: { color: colors.white, fontSize: 38, fontWeight: "700" },
  title: { ...type.title1, color: colors.ink, textAlign: "center" },
  subtitle: { ...type.subhead, color: colors.sub, textAlign: "center", maxWidth: 280 },
  actions: { gap: 12 },
  legal: { ...type.footnote, marginTop: 8, color: colors.sub, textAlign: "center" },
  link: { color: colors.ink, textDecorationLine: "underline" },
});
