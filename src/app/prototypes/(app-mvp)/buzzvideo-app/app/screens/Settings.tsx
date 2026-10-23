import { ScrollView, StyleSheet, Text, View } from "react-native";
import GroupedSection from "../components/GroupedSection";
import IconButton from "../components/IconButton";
import NavBar from "../components/NavBar";
import Row from "../components/Row";
import Toggle from "../components/Toggle";
import { planLabel } from "../data";
import { useInsets, useNav, useStore } from "../provider";
import { ownsWorkspace } from "../store";
import { colors, space, type } from "../theme";

const PUSH_LABEL = { undetermined: "Not set", granted: "On", limited: "On", denied: "Off" } as const;

export default function Settings() {
  const { state, dispatch } = useStore();
  const { navigate } = useNav();
  const insets = useInsets();
  const toast = (text: string) => dispatch({ type: "showToast", text });

  const notifications = () => {
    if (state.permissions.push === "undetermined") dispatch({ type: "requestPermission", kind: "push" });
    else dispatch({ type: "openIosSettings" });
  };

  // 2026-10-23 照即梦设置页改：导航栏居中标题 + 返回;一组组深色圆角卡片，每行左边线条图标，不再用大标题和分组小标题
  return (
    <View style={styles.page}>
      <NavBar title="Settings" left={<IconButton icon="chevron-left" onPress={() => navigate({ type: "pop" })} accessibilityLabel="Back" />} />
      <ScrollView style={styles.root} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space.xxl }]}>
        <GroupedSection>
          <Row icon="gem" iconColor={colors.ink} label="Subscription" value={planLabel(state.subscription.plan)} onPress={() => navigate({ type: "push", route: { name: "subscription" } })} chevron />
          <Row icon="rotate-ccw" iconColor={colors.ink} label="Restore purchases" onPress={() => dispatch({ type: "restorePurchases" })} chevron />
          <Row icon="user-round" iconColor={colors.ink} label="Invite friends" value="+1,500 credits" onPress={() => navigate({ type: "push", route: { name: "inviteFriends" } })} chevron />
        </GroupedSection>
        <GroupedSection>
          <Row icon="bell" iconColor={colors.ink} label="Generation updates" value={PUSH_LABEL[state.permissions.push]} onPress={notifications} chevron />
          <Row
            icon="megaphone"
            iconColor={colors.ink}
            label="Offers & news"
            right={
              <Toggle
                value={state.marketingPush}
                // 打开时推送未决定 → 弹系统框;已拒绝 → 弹去设置的提示框
                onValueChange={(on) => dispatch({ type: "answerMarketingPrompt", on })}
                accessibilityLabel="Offers & news"
              />
            }
          />
        </GroupedSection>
        <GroupedSection>
          <Row icon="shield" iconColor={colors.ink} label="AI data sharing" right={<Toggle value={state.aiConsent} onValueChange={(on) => dispatch({ type: "setAiConsent", on })} accessibilityLabel="AI data sharing" />} />
          <Row icon="lock" iconColor={colors.ink} label="Privacy Policy" onPress={() => toast("Opens Privacy Policy")} chevron />
          <Row icon="file-text" iconColor={colors.ink} label="Terms of Service" onPress={() => toast("Opens Terms of Service")} chevron />
          <Row icon="info" iconColor={colors.ink} label="AI Use Policy" onPress={() => toast("Opens AI Use Policy")} chevron />
        </GroupedSection>
        {/* 帮助与反馈(2026-10-23):去掉客户经理 / Contact support,Help Center 打开反馈面板(和网页 Give Feedback 一致) */}
        <GroupedSection>
          <Row icon="circle-alert" iconColor={colors.ink} label="Help Center" onPress={() => navigate({ type: "sheet", sheet: { name: "feedback" } })} chevron />
        </GroupedSection>
        <GroupedSection>
          <Row
            icon="log-out"
            iconColor={colors.ink}
            label="Sign out"
            onPress={() => {
              dispatch({ type: "signOut" });
              navigate({ type: "reset" });
            }}
          />
          <Row icon="trash" label="Delete account" danger onPress={() => navigate({ type: "sheet", sheet: { name: ownsWorkspace(state) ? "transferWorkspace" : "confirmDelete" } })} />
        </GroupedSection>
        <Text style={styles.footer}>BuzzVideo 1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // 页面纯黑底，卡片深灰(即梦那样的对比),组与组之间留 8
  page: { flex: 1, backgroundColor: colors.bg },
  root: { flex: 1 },
  content: { paddingHorizontal: space.md, paddingTop: space.sm, paddingBottom: space.xxl, gap: space.sm },
  footer: { ...type.footnote, textAlign: "center", color: colors.sub },
});
