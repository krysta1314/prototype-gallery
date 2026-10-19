import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import GroupedSection from "../components/GroupedSection";
import IconButton from "../components/IconButton";
import NavBar from "../components/NavBar";
import Row from "../components/Row";
import Toggle from "../components/Toggle";
import { hasSupport, planLabel } from "../data";
import { useInsets, useNav, useStore } from "../provider";
import { isEnterprise, ownsWorkspace } from "../store";
import { colors, space, type } from "../theme";

/** 大标题占的高度:滚过它才在导航栏显示小标题 */
const LARGE_TITLE_H = 41;

const PUSH_LABEL = { undetermined: "Not set", granted: "On", limited: "On", denied: "Off" } as const;

export default function Settings() {
  const { state, dispatch } = useStore();
  const { navigate } = useNav();
  const [scrolled, setScrolled] = useState(false);
  const insets = useInsets();
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
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space.xxl }]}
        scrollEventThrottle={16}
        onScroll={(e) => setScrolled(e.nativeEvent.contentOffset.y > LARGE_TITLE_H)}
      >
        {/* iOS Large Title:滚过大标题后,导航栏出现居中小标题 + hairline */}
        <Text style={styles.h1} accessibilityRole="header">
          Settings
        </Text>
        <GroupedSection header="Notifications" footer="Offers & news: new models and credit offers, one message per campaign.">
          <Row label="Generation updates" value={PUSH_LABEL[state.permissions.push]} onPress={notifications} chevron />
          <Row
            label="Offers & news"
            right={
              <Toggle
                value={state.marketingPush}
                // 和营销轻问同一套逻辑:打开时推送未决定 → 弹系统框;已拒绝 → 引导去系统设置
                onValueChange={(on) => dispatch({ type: "answerMarketingPrompt", on })}
                accessibilityLabel="Offers & news"
              />
            }
          />
        </GroupedSection>
        <GroupedSection header="General">
          <Row label="Language" value="English" onPress={() => toast("More languages are coming soon")} chevron />
        </GroupedSection>
        <GroupedSection
          header="Privacy & legal"
          footer="Your prompts and uploads are sent to our third-party AI model providers to generate results. Turn off to stop sharing — you’ll be asked again before your next generation."
        >
          <Row
            label="AI data sharing"
            right={<Toggle value={state.aiConsent} onValueChange={(on) => dispatch({ type: "setAiConsent", on })} accessibilityLabel="AI data sharing" />}
          />
        </GroupedSection>
        <GroupedSection>
          <Row label="Privacy Policy" onPress={() => toast("Opens Privacy Policy")} chevron />
          <Row label="Terms of Service" onPress={() => toast("Opens Terms of Service")} chevron />
          <Row label="AI Use Policy" onPress={() => toast("Opens AI Use Policy")} chevron />
        </GroupedSection>
        {/* 技术支持:Pro / Ultra 和 Enterprise 有人工支持(Enterprise 是专属客户经理);Free / Starter 只有帮助中心 */}
        <GroupedSection header="Help">
          {isEnterprise(state) ? (
            <Row label="Your account manager" onPress={() => toast("Opens a chat with your account manager")} chevron />
          ) : hasSupport(state.subscription.plan) ? (
            <Row label="Contact support" onPress={() => toast("Opens a chat with our support team")} chevron />
          ) : null}
          <Row label="Help Center" onPress={() => toast("Opens Help Center")} chevron />
        </GroupedSection>
        <GroupedSection header="Account">
          <Row label="Subscription" value={planLabel(state.subscription.plan)} onPress={() => navigate({ type: "push", route: { name: "subscription" } })} chevron />
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
