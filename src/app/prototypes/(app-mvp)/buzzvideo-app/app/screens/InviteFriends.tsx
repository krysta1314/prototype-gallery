import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Coin from "../components/Coin";
import Icon from "../components/Icon";
import IconButton from "../components/IconButton";
import NavBar from "../components/NavBar";
import PrimaryButton from "../components/PrimaryButton";
import { INVITE } from "../data";
import { useNav, useStore } from "../provider";
import { colors, radius, smoothCorners, space, type } from "../theme";

const fmt = (n: number) => n.toLocaleString("en-US");

/**
 * 邀请好友(spec §7.1):照搬网页的规则。同一个邀请链接两端通用;
 * 真实 APP 里链接是 Adjust 深度链接,未安装的先去 App Store,装完打开带上邀请码。
 * 0.5s:一个巨大的「1,500」浮在黑底上,下面一排 10 个好友位 —— 用户只关心能拿多少、拿了几个。
 * 规则只用一句话讲完,不做 1 / 2 / 3 步骤说明
 */
export default function InviteFriends() {
  const { state, dispatch } = useStore();
  const { navigate } = useNav();
  const toast = (text: string) => dispatch({ type: "showToast", text });
  const earned = Math.min(state.inviteRewards, INVITE.maxRewards);
  const full = earned >= INVITE.maxRewards;
  return (
    <View style={styles.page}>
      <NavBar left={<IconButton icon="chevron-left" onPress={() => navigate({ type: "pop" })} accessibilityLabel="Back" />} />
      <ScrollView contentContainerStyle={styles.content}>
        {/* 主角:每位好友能拿到的积分 */}
        <View style={styles.hero}>
          <View style={styles.amountRow}>
            <Coin size={30} />
            <Text style={styles.amount} accessibilityRole="header">
              {fmt(INVITE.rewardCredits)}
            </Text>
          </View>
          <Text style={styles.heroLine}>for you and each friend who subscribes</Text>
        </View>

        {/* 10 个好友位:已得奖励的点亮 */}
        <View style={styles.slotsBlock} accessibilityLabel={`${earned} of ${INVITE.maxRewards} rewards earned`}>
          <View style={styles.slots}>
            {Array.from({ length: INVITE.maxRewards }, (_, i) => (
              <View key={i} style={[styles.slot, i < earned && styles.slotOn]}>
                {i < earned ? <Icon name="check" size={14} color={colors.white} strokeWidth={2.5} /> : null}
              </View>
            ))}
          </View>
          <Text style={styles.slotsCaption}>
            {full
              ? `All ${INVITE.maxRewards} rewards earned. Friends still get ${fmt(INVITE.signupCredits)} credits when they sign up.`
              : `${earned} of ${INVITE.maxRewards} rewards earned · ${fmt(earned * INVITE.rewardCredits)} credits so far`}
          </Text>
        </View>

        <View style={styles.actions}>
          <Text style={styles.rule}>{`Friends get ${fmt(INVITE.signupCredits)} credits when they sign up. You both get ${fmt(INVITE.rewardCredits)} once they subscribe.`}</Text>
          <View style={styles.linkBox}>
            <Text style={styles.link} numberOfLines={1}>
              {INVITE.link}
            </Text>
            <Pressable onPress={() => toast("Link copied")} accessibilityRole="button" hitSlop={4} style={styles.copy}>
              <Icon name="copy" size={16} color={colors.onInverse} />
              <Text style={styles.copyText}>Copy</Text>
            </Pressable>
          </View>
          <PrimaryButton label="Share invite link" icon="share" onPress={() => toast("Opens the share sheet")} />
        </View>
      </ScrollView>
    </View>
  );
}

const SLOT = 26;

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, paddingHorizontal: space.lg, paddingBottom: space.xxl, gap: space.xxl },
  hero: { alignItems: "center", paddingTop: space.xxl, gap: space.xs },
  amountRow: { flexDirection: "row", alignItems: "center", gap: space.sm },
  amount: { fontSize: 72, lineHeight: 80, fontWeight: "700", letterSpacing: -2, color: colors.ink, fontVariant: ["tabular-nums"] },
  heroLine: { ...type.body, color: colors.sub, textAlign: "center" },
  slotsBlock: { alignItems: "center", gap: space.md },
  slots: { flexDirection: "row", gap: 6 },
  slot: {
    width: SLOT,
    height: SLOT,
    borderRadius: SLOT / 2,
    borderWidth: 1.5,
    borderColor: colors.faint,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  slotOn: { borderStyle: "solid", borderColor: colors.accent, backgroundColor: colors.accent },
  slotsCaption: { ...type.footnote, color: colors.sub, textAlign: "center", fontVariant: ["tabular-nums"] },
  actions: { marginTop: "auto", gap: space.md },
  rule: { ...type.footnote, color: colors.sub, textAlign: "center", paddingHorizontal: space.lg },
  linkBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    padding: 6,
    paddingLeft: space.md,
    borderRadius: radius.md,
    ...smoothCorners,
    backgroundColor: colors.surface,
  },
  link: { flex: 1, ...type.subhead, color: colors.sub },
  copy: { flexDirection: "row", alignItems: "center", gap: 6, height: 36, paddingHorizontal: space.md, borderRadius: radius.md, backgroundColor: colors.inverse },
  copyText: { ...type.subhead, fontWeight: "600", color: colors.onInverse },
});
