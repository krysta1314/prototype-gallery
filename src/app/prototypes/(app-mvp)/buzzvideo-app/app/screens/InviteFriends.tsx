import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Icon from "../components/Icon";
import IconButton from "../components/IconButton";
import NavBar from "../components/NavBar";
import PrimaryButton from "../components/PrimaryButton";
import { INVITE } from "../data";
import { useNav, useStore } from "../provider";
import { colors, radius, smoothCorners, space, type } from "../theme";

const fmt = (n: number) => n.toLocaleString("en-US");
const STEPS = [
  "Share your invite link with friends",
  `Your friend signs up and gets ${fmt(INVITE.signupCredits)} credits instantly`,
  `When your friend subscribes, you both get ${fmt(INVITE.rewardCredits)} credits`,
];

/**
 * 邀请好友(spec §7.1):照搬网页的规则和文案。同一个邀请链接两端通用;
 * 真实 APP 里链接是 Adjust 深度链接,未安装的先去 App Store,装完打开带上邀请码
 */
export default function InviteFriends() {
  const { state, dispatch } = useStore();
  const { navigate } = useNav();
  const toast = (text: string) => dispatch({ type: "showToast", text });
  return (
    <View style={styles.page}>
      <NavBar left={<IconButton icon="chevron-left" onPress={() => navigate({ type: "pop" })} accessibilityLabel="Back" />} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title} accessibilityRole="header">
          {`Get ${fmt(INVITE.rewardCredits)} credits for every friend who subscribes`}
        </Text>

        <View style={styles.steps}>
          {STEPS.map((s, i) => (
            <View key={s} style={styles.step}>
              <View style={styles.num}>
                <Text style={styles.numText}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{s}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.note}>
          {state.inviteRewards >= INVITE.maxRewards
            ? `You've earned all ${INVITE.maxRewards} rewards. Friends still get ${INVITE.signupCredits} credits when they sign up.`
            : `Rewards apply to your first ${INVITE.maxRewards} subscribed friends · ${state.inviteRewards}/${INVITE.maxRewards} earned`}
        </Text>

        <View style={styles.linkBox}>
          <Text style={styles.link} numberOfLines={1}>
            {INVITE.link}
          </Text>
          <Pressable onPress={() => toast("Link copied")} accessibilityRole="button" style={styles.copy}>
            <Icon name="copy" size={16} color={colors.white} />
            <Text style={styles.copyText}>Copy</Text>
          </Pressable>
        </View>
        <PrimaryButton label="Share invite link" icon="share" onPress={() => toast("Opens the share sheet")} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space.lg, paddingBottom: space.xxl, gap: space.lg },
  title: { ...type.title1, color: colors.ink },
  steps: { gap: space.md },
  step: { flexDirection: "row", alignItems: "center", gap: space.md },
  num: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.grouped, alignItems: "center", justifyContent: "center" },
  numText: { ...type.subhead, fontWeight: "600", color: colors.ink },
  stepText: { flex: 1, ...type.body, color: colors.ink },
  note: { ...type.footnote, color: colors.sub },
  linkBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    padding: 6,
    paddingLeft: space.md,
    borderRadius: radius.md,
    ...smoothCorners,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.separator,
  },
  link: { flex: 1, ...type.subhead, color: colors.sub },
  copy: { flexDirection: "row", alignItems: "center", gap: 6, height: 36, paddingHorizontal: space.md, borderRadius: radius.md, backgroundColor: colors.ink },
  copyText: { ...type.subhead, fontWeight: "600", color: colors.white },
});
