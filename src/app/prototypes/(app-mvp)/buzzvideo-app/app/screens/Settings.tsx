import { ScrollView, StyleSheet, Text, View } from "react-native";
import IconButton from "../components/IconButton";
import Row from "../components/Row";
import { useInsets, useNav, useStore } from "../provider";
import { colors, font, shadow } from "../theme";

const PUSH_LABEL = { undetermined: "Not set", granted: "On", limited: "On", denied: "Off" } as const;

export default function Settings() {
  const { state, dispatch } = useStore();
  const { navigate } = useNav();
  const insets = useInsets();
  const toast = (text: string) => dispatch({ type: "showToast", text });

  const notifications = () => {
    if (state.permissions.push === "undetermined") dispatch({ type: "requestPermission", kind: "push" });
    else toast("Manage notifications in iOS Settings");
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <IconButton icon="chevron-left" onPress={() => navigate({ type: "pop" })} />
        <Text style={styles.title}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.group}>
          <Row icon="bell" label="Notifications" value={PUSH_LABEL[state.permissions.push]} onPress={notifications} chevron />
          <Row
            icon="sparkles"
            label="Marketing notifications"
            detail="New features and offers. Generation alerts are separate."
            value={state.marketingPush ? "On" : "Off"}
            onPress={() => {
              dispatch({ type: "setMarketingPush", on: !state.marketingPush });
              toast(state.marketingPush ? "Marketing notifications off" : "Marketing notifications on");
            }}
          />
          <Row icon="globe" label="Language" value="English" onPress={() => toast("More languages are coming soon")} chevron />
        </View>
        <View style={styles.group}>
          <Row icon="shield" label="Privacy Policy" onPress={() => toast("Opens Privacy Policy")} chevron />
          <Row icon="file-text" label="Terms of Service" onPress={() => toast("Opens Terms of Service")} chevron />
        </View>
        <View style={styles.group}>
          <Row
            icon="log-out"
            label="Sign out"
            onPress={() => {
              dispatch({ type: "signOut" });
              navigate({ type: "reset" });
            }}
          />
          <Row icon="trash" label="Delete account" danger onPress={() => navigate({ type: "sheet", sheet: { name: "confirmDelete" } })} />
        </View>
        <Text style={styles.footer}>BuzzVideo 1.0.0 · MVP prototype</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6 },
  title: { flex: 1, textAlign: "center", fontSize: font.h3, fontWeight: "700", color: colors.ink },
  headerSpacer: { width: 40 },
  content: { padding: 16, gap: 14 },
  group: { paddingHorizontal: 16, borderRadius: 22, backgroundColor: colors.surface, boxShadow: shadow.card },
  footer: { textAlign: "center", fontSize: 12, color: colors.faint, marginTop: 8 },
});
