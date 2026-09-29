import { StyleSheet, Text, View } from "react-native";
import Gradient from "../components/Gradient";
import PrimaryButton from "../components/PrimaryButton";
import { useInsets, useNav, useStore } from "../provider";
import { colors, ctaGradient, font } from "../theme";

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
  logoText: { color: colors.white, fontSize: 38, fontWeight: "900" },
  title: { fontSize: font.title, fontWeight: "800", color: colors.ink, textAlign: "center", letterSpacing: -0.5 },
  subtitle: { fontSize: font.body, color: colors.sub, textAlign: "center", lineHeight: 21, maxWidth: 280 },
  actions: { gap: 12 },
  legal: { marginTop: 8, fontSize: 12, color: colors.sub, textAlign: "center", lineHeight: 18 },
  link: { color: colors.ink, textDecorationLine: "underline" },
});
