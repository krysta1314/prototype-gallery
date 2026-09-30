import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import GroupedSection from "../components/GroupedSection";
import IconButton from "../components/IconButton";
import NavBar from "../components/NavBar";
import Row from "../components/Row";
import Toggle from "../components/Toggle";
import { useNav, useStore } from "../provider";
import { LOW_CREDITS, ownsWorkspace } from "../store";
import { colors, space, type } from "../theme";

/** 大标题占的高度:滚过它才在导航栏显示小标题 */
const LARGE_TITLE_H = 41;

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

  return (
    <View style={styles.page}>
      <NavBar
        title={scrolled ? "Settings" : undefined}
        scrolled={scrolled}
        left={<IconButton icon="chevron-left" onPress={() => navigate({ type: "pop" })} accessibilityLabel="Back" />}
      />
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        scrollEventThrottle={16}
        onScroll={(e) => setScrolled(e.nativeEvent.contentOffset.y > LARGE_TITLE_H)}
      >
        {/* iOS Large Title:滚过大标题后,导航栏出现居中小标题 + hairline */}
        <Text style={styles.h1} accessibilityRole="header">
          Settings
        </Text>
        <GroupedSection header="Notifications" footer="We’ll notify you when a result is ready.">
          <Row label="Generation notifications" value={PUSH_LABEL[state.permissions.push]} onPress={notifications} chevron />
        </GroupedSection>
        <GroupedSection header="General">
          <Row label="Language" value="English" onPress={() => toast("More languages are coming soon")} chevron />
        </GroupedSection>
        <GroupedSection header="Privacy & legal">
          <Row label="AI data sharing" onPress={() => navigate({ type: "sheet", sheet: { name: "aiDataSharing" } })} chevron />
          <Row label="Privacy Policy" onPress={() => toast("Opens Privacy Policy")} chevron />
          <Row label="Terms of Service" onPress={() => toast("Opens Terms of Service")} chevron />
          <Row label="AI Use Policy" onPress={() => toast("Opens AI Use Policy")} chevron />
        </GroupedSection>
        <GroupedSection header="Account">
          <Row label="Restore purchases" onPress={() => dispatch({ type: "restorePurchases" })} />
          <Row
            label="Sign out"
            onPress={() => {
              dispatch({ type: "signOut" });
              navigate({ type: "reset" });
            }}
          />
        </GroupedSection>
        <GroupedSection>
          <Row
            label="Delete account"
            danger
            onPress={() => navigate({ type: "sheet", sheet: { name: ownsWorkspace(state) ? "transferWorkspace" : "confirmDelete" } })}
          />
        </GroupedSection>
        <Text style={styles.footer}>BuzzVideo 1.0.0 · MVP prototype</Text>
        {/* 演示用:切换当前用户在组织里的角色,查看拥有者删号流程 */}
        <GroupedSection header="Demo" footer="Demo-only controls. I own a workspace: shows the owner flow when deleting the account. Low credits: drops the current workspace’s balance to test See plans. Web subscriber: simulates a plan bought on buzzvideo.ai, managed there.">
          <Row
            label="I own a workspace"
            right={
              <Toggle
                value={ownsWorkspace(state)}
                onValueChange={(on) => dispatch({ type: "setRole", workspace: "presslogic", role: on ? "owner" : "admin" })}
                accessibilityLabel="I own a workspace"
              />
            }
          />
          <Row
            label="Low credits"
            right={
              <Toggle
                value={state.credits[state.workspace] <= LOW_CREDITS}
                onValueChange={(low) => dispatch({ type: "setCreditsLow", low })}
                accessibilityLabel="Low credits"
              />
            }
          />
          <Row
            label="Web subscriber (Pro)"
            right={
              <Toggle
                value={state.subscription.source === "web"}
                onValueChange={(on) => dispatch({ type: "setWebSubscriber", on })}
                accessibilityLabel="Web subscriber (Pro)"
              />
            }
          />
        </GroupedSection>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.grouped },
  root: { flex: 1 },
  content: { paddingHorizontal: space.lg, paddingBottom: space.xxl, gap: space.xl },
  h1: { ...type.largeTitle, color: colors.ink, marginBottom: -space.sm },
  footer: { ...type.footnote, textAlign: "center", color: colors.sub },
});
