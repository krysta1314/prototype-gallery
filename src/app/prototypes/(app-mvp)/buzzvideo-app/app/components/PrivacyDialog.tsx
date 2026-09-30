import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useStore } from "../provider";
import { colors, radius, smoothCorners, type } from "../theme";
import PrimaryButton from "./PrimaryButton";

const DOCS = ["Terms of Service", "Privacy Policy", "AI Use Policy"] as const;

/** 首次打开的隐私弹窗:盖在登录页上,同意后才能用登录页。Disagree 只在弹窗里提示,不关闭 */
export default function PrivacyDialog() {
  const { dispatch } = useStore();
  const [declined, setDeclined] = useState(false);
  const open = (doc: string) => dispatch({ type: "showToast", text: `Opens ${doc}` });
  const doc = (name: (typeof DOCS)[number]) => (
    <Text key={name} style={styles.link} accessibilityRole="link" onPress={() => open(name)}>
      {name}
    </Text>
  );

  return (
    <View style={styles.overlay}>
      <View style={styles.card} accessibilityViewIsModal>
        <Text style={styles.title} accessibilityRole="header">
          Your privacy
        </Text>
        <Text style={styles.body}>
          By tapping Agree, you accept our {doc("Terms of Service")}, {doc("Privacy Policy")} and {doc("AI Use Policy")}.
        </Text>
        <Text style={styles.body}>
          To generate results, your prompts and uploads are processed by our third-party AI model providers. They don’t receive your account info or use your content for training.
        </Text>
        {declined && (
          <Text style={styles.error} accessibilityRole="alert">
            You need to agree to use BuzzVideo
          </Text>
        )}
        <View style={styles.actions}>
          <PrimaryButton label="Agree" onPress={() => dispatch({ type: "acceptPrivacy" })} />
          <PrimaryButton variant="light" label="Disagree" onPress={() => setDeclined(true)} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.scrim, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, zIndex: 10 },
  card: { width: "100%", maxWidth: 342, backgroundColor: colors.surface, borderRadius: radius.lg, padding: 20, gap: 12, ...smoothCorners },
  title: { ...type.title2, color: colors.ink },
  body: { ...type.subhead, color: colors.sub },
  link: { color: colors.accent, fontWeight: "600" },
  error: { ...type.footnote, color: colors.danger },
  actions: { gap: 8, marginTop: 4 },
});
