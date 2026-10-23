import { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Coin from "../components/Coin";
import Gradient from "../components/Gradient";
import Icon from "../components/Icon";
import IconButton from "../components/IconButton";
import IosShareSheet from "../components/IosShareSheet";
import PrimaryButton from "../components/PrimaryButton";
import { A, INVITE, type IconName } from "../data";
import { useInsets, useNav, useStore } from "../provider";
import { colors, fill, radius, smoothCorners, space, type } from "../theme";

const fmt = (n: number) => n.toLocaleString("en-US");

const STEPS: { icon: IconName; title: string; text: string }[] = [
  { icon: "link", title: "Share your invite link", text: "Tap Invite friends and send it to a friend." },
  { icon: "user-plus", title: "Your friend signs up and subscribes", text: `They get ${fmt(INVITE.signupCredits)} credits as soon as they sign up.` },
  { icon: "gift", title: `You both get ${fmt(INVITE.rewardCredits)} credits`, text: `For each friend who subscribes, up to ${INVITE.maxRewards} friends.` },
];

/**
 * 邀请好友(spec §7.1,2026-10-23 照参考图改版):
 * 头图(两只手传一枚橙色金币)+ 左上返回;下面两张圆角卡叠在头图上 ——
 * ① 标题「Invite friends, earn 1,500 credits」+ 一句说明 + 两个统计格(已得积分 / 已邀请人数)+ 主按钮 Invite friends + Copy link;
 * ② 「Earn credits in 3 steps」三步说明。
 * 同一个邀请链接两端通用;真实 APP 里链接是 Adjust 深度链接，未安装的先去 App Store,装完打开带上邀请码
 */
export default function InviteFriends() {
  const { state, dispatch } = useStore();
  const { navigate } = useNav();
  const insets = useInsets();
  const toast = (text: string) => dispatch({ type: "showToast", text });
  const earned = Math.min(state.inviteRewards, INVITE.maxRewards);
  const full = earned >= INVITE.maxRewards;
  // Invite friends 和统计格里的 + 都直接打开系统分享面板(分享邀请链接)
  const [sharing, setSharing] = useState(false);
  const share = () => setSharing(true);

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + space.xl }} showsVerticalScrollIndicator={false}>
        {/* 头图(BuzzVideo 生成：两只手传一枚发光的橙色金币，夜空背景，底部压暗接页面底色) */}
        <View style={[styles.hero, { height: insets.top + 190 }]}>
          <Image source={{ uri: `${A}/invite-hero.jpg` }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <Gradient colors={["rgba(15,15,19,0.35)", "rgba(15,15,19,0)"]} style={styles.heroTop} pointerEvents="none" />
        </View>

        <View style={styles.cards}>
          {/* ① 奖励 + 进度 + 邀请 */}
          <View style={[styles.card, styles.cardMain]}>
            <Text style={styles.title} accessibilityRole="header">
              {"Invite friends, earn "}
              <Text style={styles.titleHot}>{fmt(INVITE.rewardCredits)}</Text>
              {" credits"}
            </Text>
            <Text style={styles.sub}>
              {full ? `All ${INVITE.maxRewards} rewards earned. Friends still get ${fmt(INVITE.signupCredits)} credits when they sign up.` : `Friends get ${fmt(INVITE.signupCredits)} credits when they sign up.`}
            </Text>

            <View style={styles.stats}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Credits earned</Text>
                <View style={styles.statValueRow}>
                  <Coin size={18} />
                  <Text style={styles.statValue}>{fmt(earned * INVITE.rewardCredits)}</Text>
                </View>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>{`Friends invited · ${earned}/${INVITE.maxRewards}`}</Text>
                <View style={styles.statValueRow}>
                  {Array.from({ length: Math.min(earned, 3) }, (_, i) => (
                    <View key={i} style={[styles.friend, i > 0 && styles.friendOverlap]}>
                      <Icon name="check" size={12} color={colors.white} strokeWidth={2.6} />
                    </View>
                  ))}
                  {full ? null : (
                    <Pressable onPress={share} accessibilityRole="button" accessibilityLabel="Invite a friend" hitSlop={6} style={({ pressed }) => [styles.addFriend, earned > 0 && styles.friendOverlap, pressed && styles.faded]}>
                      <Icon name="plus" size={16} color={colors.ink} strokeWidth={2.2} />
                    </Pressable>
                  )}
                </View>
              </View>
            </View>

            <PrimaryButton label="Invite friends" icon="share" onPress={share} style={styles.cta} />
            <Pressable onPress={() => toast("Link copied")} accessibilityRole="button" hitSlop={8} style={({ pressed }) => [styles.copy, pressed && styles.faded]}>
              <Text style={styles.copyText}>Copy link</Text>
            </Pressable>
          </View>

          {/* ② 三步说明 */}
          <View style={styles.card}>
            <Text style={styles.stepsTitle} accessibilityRole="header">
              Earn credits in 3 steps
            </Text>
            {STEPS.map((s, i) => (
              <View key={s.title} style={[styles.step, i > 0 && styles.stepLine]}>
                <View style={styles.stepIcon}>
                  <Icon name={s.icon} size={20} color={colors.ink} />
                </View>
                <View style={styles.stepBody}>
                  <Text style={styles.stepTitle}>{`Step ${i + 1}. ${s.title}`}</Text>
                  <Text style={styles.stepText}>{s.text}</Text>
                </View>
              </View>
            ))}
          </View>
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

      {/* 顶栏压在头图上：返回 */}
      <View style={[styles.top, { paddingTop: insets.top }]} pointerEvents="box-none">
        <IconButton tone="onImage" icon="chevron-left" accessibilityLabel="Back" onPress={() => navigate({ type: "pop" })} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  hero: { overflow: "hidden" },
  heroTop: { position: "absolute", left: 0, right: 0, top: 0, height: 120 },
  top: { position: "absolute", left: 0, right: 0, top: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: space.xs },
  cards: { marginTop: -36, gap: space.sm },
  card: { marginHorizontal: space.sm, padding: space.lg, borderRadius: radius.hero, backgroundColor: colors.surface, ...smoothCorners },
  cardMain: { paddingTop: space.xl, alignItems: "stretch" },
  title: { ...type.title2, fontWeight: "800", color: colors.ink, textAlign: "center" },
  titleHot: { color: colors.accent },
  sub: { ...type.subhead, color: colors.sub, textAlign: "center", marginTop: space.xs },
  stats: { flexDirection: "row", gap: space.sm, marginTop: space.lg },
  stat: { flex: 1, padding: space.md, gap: space.sm, borderRadius: radius.lg, backgroundColor: colors.grouped, ...smoothCorners },
  statLabel: { ...type.footnote, fontWeight: "600", color: colors.sub },
  statValueRow: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 30 },
  statValue: { ...type.title2, fontWeight: "700", color: colors.ink, fontVariant: ["tabular-nums"] },
  friend: { width: 30, height: 30, borderRadius: radius.full, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.grouped },
  friendOverlap: { marginLeft: -10 },
  addFriend: { width: 30, height: 30, borderRadius: radius.full, backgroundColor: fill.strong, alignItems: "center", justifyContent: "center" },
  cta: { marginTop: space.lg },
  copy: { alignSelf: "center", minHeight: 44, justifyContent: "center", paddingHorizontal: space.md },
  copyText: { ...type.subhead, fontWeight: "600", color: colors.sub },
  stepsTitle: { ...type.headline, color: colors.ink, textAlign: "center", marginBottom: space.sm },
  step: { flexDirection: "row", alignItems: "center", gap: space.md, paddingVertical: space.md },
  stepLine: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator },
  stepIcon: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.grouped, alignItems: "center", justifyContent: "center", ...smoothCorners },
  stepBody: { flex: 1, gap: 2 },
  stepTitle: { ...type.subhead, fontWeight: "700", color: colors.ink },
  stepText: { ...type.footnote, color: colors.sub },
  faded: { opacity: 0.5 },
});
