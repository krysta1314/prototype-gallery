import { ScrollView, StyleSheet, Text, View } from "react-native";
import { planLabel } from "../../../buzzvideo-app/app/data";
import { ownsWorkspace } from "../../../buzzvideo-app/app/store";
import { GZSticker, gz } from "../../kit/gz";
import { Header } from "../ui";
import { useInsets, useNav, useStore } from "../v1";
import { GZToggle, ListGroup, ListRow } from "./parts-auth";

const c = gz.color;
const PUSH_LABEL = { undetermined: "Not set", granted: "On", limited: "On", denied: "Off" } as const;

/**
 * 贴纸风设置页(逻辑同第一版 screens/Settings):圆形返回 + 展示字体标题;
 * 列表不用灰卡片，分组之间留白、行与行发丝线。颜色只出现在有意思的地方：
 * 当前方案 = 丁香贴纸(等级 / 身份),邀请奖励 = 黄油贴纸(积分),开关打开 = 青柠;删除账号红字
 */
export default function SettingsS() {
  const { state, dispatch } = useStore();
  const { navigate } = useNav();
  const insets = useInsets();
  const toast = (text: string) => dispatch({ type: "showToast", text });

  const notifications = () => {
    if (state.permissions.push === "undetermined") dispatch({ type: "requestPermission", kind: "push" });
    else dispatch({ type: "openIosSettings" });
  };

  return (
    <View style={styles.page}>
      <Header title="Settings" onBack={() => navigate({ type: "pop" })} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        <ListGroup>
          <ListRow first icon="gem" label="Subscription" value={<GZSticker label={planLabel(state.subscription.plan)} color="lilac" size="s" rotate={-3} />} onPress={() => navigate({ type: "push", route: { name: "subscription" } })} chevron />
          <ListRow icon="rotate-ccw" label="Restore purchases" onPress={() => dispatch({ type: "restorePurchases" })} chevron />
          <ListRow icon="user-round" label="Invite friends" value={<GZSticker label="+1,500 credits" color="butter" size="s" rotate={3} />} onPress={() => navigate({ type: "push", route: { name: "inviteFriends" } })} chevron />
        </ListGroup>
        <ListGroup>
          <ListRow first icon="bell" label="Generation updates" value={PUSH_LABEL[state.permissions.push]} onPress={notifications} chevron />
          <ListRow
            icon="megaphone"
            label="Offers & news"
            right={
              <GZToggle
                value={state.marketingPush}
                // 打开时推送未决定 → 弹系统框;已拒绝 → 弹去设置的提示框
                onValueChange={(on) => dispatch({ type: "answerMarketingPrompt", on })}
                accessibilityLabel="Offers & news"
              />
            }
          />
        </ListGroup>
        <ListGroup>
          <ListRow first icon="shield" label="AI data sharing" right={<GZToggle value={state.aiConsent} onValueChange={(on) => dispatch({ type: "setAiConsent", on })} accessibilityLabel="AI data sharing" />} />
          <ListRow icon="lock" label="Privacy Policy" onPress={() => toast("Opens Privacy Policy")} chevron />
          <ListRow icon="file-text" label="Terms of Service" onPress={() => toast("Opens Terms of Service")} chevron />
          <ListRow icon="info" label="AI Use Policy" onPress={() => toast("Opens AI Use Policy")} chevron />
        </ListGroup>
        {/* 帮助与反馈:Help Center 打开反馈面板(和网页 Give Feedback 一致) */}
        <ListGroup>
          <ListRow first icon="circle-alert" label="Help Center" onPress={() => navigate({ type: "sheet", sheet: { name: "feedback" } })} chevron />
        </ListGroup>
        <ListGroup>
          <ListRow
            first
            icon="log-out"
            label="Sign out"
            onPress={() => {
              dispatch({ type: "signOut" });
              navigate({ type: "reset" });
            }}
          />
          <ListRow icon="trash" label="Delete account" danger onPress={() => navigate({ type: "sheet", sheet: { name: ownsWorkspace(state) ? "transferWorkspace" : "confirmDelete" } })} />
        </ListGroup>
        <Text style={[gz.body.caption, styles.footer]}>BuzzVideo 1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: c.page },
  footer: { textAlign: "center", color: c.text3, marginTop: 24 },
});
