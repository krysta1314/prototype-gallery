import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import IosShareSheet from "../../../buzzvideo-app/app/components/IosShareSheet";
import { A, INVITE } from "../../../buzzvideo-app/app/data";
import { GZButton, GZPhoto, GZSticker, gz } from "../../kit/gz";
import { Header } from "../ui";
import { Coin, Icon, useInsets, useNav, useStore, type IconName } from "../v1";

const c = gz.color;
const fmt = (n: number) => n.toLocaleString("en-US");

/** 三步说明;每步图标的颜色 = 这一步的意思(天蓝 = 链接 / 分享，青柠 = 朋友，黄油 = 积分) */
const STEPS: { icon: IconName; color: "sky" | "lime" | "butter"; title: string; text: string }[] = [
  { icon: "link", color: "sky", title: "Share your invite link", text: "Tap Invite friends and send it to a friend." },
  { icon: "user-plus", color: "lime", title: "Your friend signs up and subscribes", text: `They get ${fmt(INVITE.signupCredits)} credits as soon as they sign up.` },
  { icon: "gift", color: "butter", title: `You both get ${fmt(INVITE.rewardCredits)} credits`, text: `For each friend who subscribes, up to ${INVITE.maxRewards} friends.` },
];

/**
 * 贴纸风邀请好友(逻辑同第一版 screens/InviteFriends,spec §7.1):
 * 头图做成一张歪着贴的白边照片贴纸;标题粗展示字，奖励「1,500 credits」是一颗黄油色积分贴纸;
 * 两个统计并排(发丝线隔开):已得积分(黄油)/ 已邀请的朋友(青柠圆章);唯一主操作是橙色 Invite friends。
 * Invite friends 和 + 都拉起 iOS 系统分享面板(系统界面原样保留)
 */
export default function InviteFriendsS() {
  const { state, dispatch } = useStore();
  const { navigate } = useNav();
  const insets = useInsets();
  const toast = (text: string) => dispatch({ type: "showToast", text });
  const earned = Math.min(state.inviteRewards, INVITE.maxRewards);
  const full = earned >= INVITE.maxRewards;
  const [sharing, setSharing] = useState(false);
  const share = () => setSharing(true);

  return (
    <View style={styles.page}>
      <Header onBack={() => navigate({ type: "pop" })} />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <GZPhoto uri={`${A}/invite-hero.jpg`} w={230} h={150} rotate={-4} radius={18} />
        </View>

        <View style={styles.head}>
          <Text style={[gz.display.hero, { color: c.white, textAlign: "center" }]} accessibilityRole="header" accessibilityLabel={`Invite friends, earn ${fmt(INVITE.rewardCredits)} credits`}>
            Invite friends, earn
          </Text>
          <GZSticker label={`${fmt(INVITE.rewardCredits)} credits`} color="butter" size="l" rotate={-3} style={{ alignSelf: "center" }} />
          <Text style={[gz.body.body, { color: c.text2, textAlign: "center", marginTop: 6 }]}>
            {full ? `All ${INVITE.maxRewards} rewards earned. Friends still get ${fmt(INVITE.signupCredits)} credits when they sign up.` : `Friends get ${fmt(INVITE.signupCredits)} credits when they sign up.`}
          </Text>
        </View>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={[gz.body.micro, { color: c.text3 }]}>Credits earned</Text>
            <View style={styles.statValue}>
              <Coin size={20} />
              <Text style={[gz.display.title, { color: c.butter, fontVariant: ["tabular-nums"] }]}>{fmt(earned * INVITE.rewardCredits)}</Text>
            </View>
          </View>
          <View style={[styles.stat, styles.statLine]}>
            <Text style={[gz.body.micro, { color: c.text3 }]}>{`Friends invited · ${earned}/${INVITE.maxRewards}`}</Text>
            <View style={styles.statValue}>
              {Array.from({ length: Math.min(earned, 3) }, (_, i) => (
                <View key={i} style={[styles.friend, i > 0 && styles.overlap]}>
                  <Icon name="check" size={14} color={c.ink} strokeWidth={3} />
                </View>
              ))}
              {full ? null : (
                <Pressable onPress={share} accessibilityRole="button" accessibilityLabel="Invite a friend" hitSlop={6} style={({ pressed }) => [styles.addFriend, earned > 0 && styles.overlap, pressed && { opacity: 0.6 }]}>
                  <Icon name="plus" size={16} color={c.white} strokeWidth={2.6} />
                </Pressable>
              )}
            </View>
          </View>
        </View>

        <View style={styles.cta}>
          <GZButton label="Invite friends" icon="share" onPress={share} />
          <Pressable onPress={() => toast("Link copied")} accessibilityRole="button" hitSlop={8} style={({ pressed }) => [styles.copy, pressed && { opacity: 0.6 }]}>
            <Text style={[gz.display.label, { color: c.sky }]}>Copy link</Text>
          </Pressable>
        </View>

        <Text style={[gz.display.head, { color: c.white, marginHorizontal: 20, marginTop: 14, marginBottom: 6 }]} accessibilityRole="header">
          Earn credits in 3 steps
        </Text>
        <View style={styles.steps}>
          {STEPS.map((s, i) => (
            <View key={s.title} style={[styles.step, i > 0 && styles.stepLine]}>
              <View style={[styles.stepIcon, { backgroundColor: c[s.color] }]}>
                <Icon name={s.icon} size={19} color={c.ink} strokeWidth={2.4} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[gz.body.strong, { color: c.white }]}>{`Step ${i + 1}. ${s.title}`}</Text>
                <Text style={[gz.body.caption, { color: c.text3 }]}>{s.text}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {sharing ? (
        <IosShareSheet
          title="Join me on BuzzVideo"
          thumb={`${A}/invite-hero.jpg`}
          isVideo={false}
          link={INVITE.link}
          onClose={() => setSharing(false)}
          onDone={(text) => {
            setSharing(false);
            toast(text);
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: c.page },
  hero: { alignItems: "center", paddingTop: 8, paddingBottom: 18 },
  head: { paddingHorizontal: 24, gap: 10, alignItems: "center" },
  stats: { flexDirection: "row", marginHorizontal: 16, marginTop: 22, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.line },
  stat: { flex: 1, paddingVertical: 14, paddingHorizontal: 8, gap: 8, alignItems: "center" },
  statLine: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: c.line },
  statValue: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 32 },
  friend: { width: 30, height: 30, borderRadius: 15, backgroundColor: c.lime, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: c.page },
  overlap: { marginLeft: -10 },
  addFriend: { width: 30, height: 30, borderRadius: 15, backgroundColor: c.raised, alignItems: "center", justifyContent: "center" },
  cta: { paddingHorizontal: 16, marginTop: 20 },
  copy: { alignSelf: "center", minHeight: 44, justifyContent: "center", paddingHorizontal: 16 },
  steps: { marginHorizontal: 16, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.line },
  step: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14 },
  stepLine: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line },
  stepIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
});
