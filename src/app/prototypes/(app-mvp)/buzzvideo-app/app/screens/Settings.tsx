import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import GroupedSection from "../components/GroupedSection";
import IconButton from "../components/IconButton";
import NavBar from "../components/NavBar";
import Row from "../components/Row";
import Toggle from "../components/Toggle";
import { useNav, useStore } from "../provider";
import { colors, type } from "../theme";

const PUSH_LABEL = { undetermined: "Not set", granted: "On", limited: "On", denied: "Off" } as const;

export default function Settings() {
  const { state, dispatch } = useStore();
  const { navigate } = useNav();
  const [scrolled, setScrolled] = useState(false);
  const toast = (text: string) => dispatch({ type: "showToast", text });

  const notifications = () => {
    if (state.permissions.push === "undetermined") dispatch({ type: "requestPermission", kind: "push" });
    else toast("Manage notifications in iOS Settings");
  };
  const setMarketing = (on: boolean) => {
    dispatch({ type: "setMarketingPush", on });
    toast(on ? "Marketing notifications on" : "Marketing notifications off");
  };

  return (
    <View style={styles.page}>
      <NavBar
        title="Settings"
        scrolled={scrolled}
        left={<IconButton icon="chevron-left" onPress={() => navigate({ type: "pop" })} accessibilityLabel="Back" />}
      />
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        scrollEventThrottle={16}
        onScroll={(e) => setScrolled(e.nativeEvent.contentOffset.y > 4)}
      >
        <GroupedSection header="Notifications" footer="Marketing covers new features and offers. Generation alerts are separate.">
          <Row label="Push notifications" value={PUSH_LABEL[state.permissions.push]} onPress={notifications} chevron />
          <Row
            label="Marketing notifications"
            right={
<Toggle value={state.marketingPush} onValueChange={setMarketing} accessibilityLabel="Marketing notifications" />
            }
          />
        </GroupedSection>
        <GroupedSection header="General">
          <Row label="Language" value="English" onPress={() => toast("More languages are coming soon")} chevron />
        </GroupedSection>
        <GroupedSection header="Legal">
          <Row label="Privacy Policy" onPress={() => toast("Opens Privacy Policy")} chevron />
          <Row label="Terms of Service" onPress={() => toast("Opens Terms of Service")} chevron />
        </GroupedSection>
        <GroupedSection>
          <Row
            label="Sign out"
            onPress={() => {
              dispatch({ type: "signOut" });
              navigate({ type: "reset" });
            }}
          />
        </GroupedSection>
        <GroupedSection>
          <Row label="Delete account" danger onPress={() => navigate({ type: "sheet", sheet: { name: "confirmDelete" } })} />
        </GroupedSection>
        <Text style={styles.footer}>BuzzVideo 1.0.0 · MVP prototype</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.grouped },
  root: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32, gap: 24 },
  footer: { ...type.footnote, textAlign: "center", color: colors.sub },
});
