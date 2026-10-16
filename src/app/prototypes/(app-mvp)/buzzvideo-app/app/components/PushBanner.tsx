import { useEffect, useRef } from "react";
import { Animated, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { A, readyTitle } from "../data";
import { useInsets, useNav, useStore } from "../provider";
import { colors, elevation, radius, type, smoothCorners } from "../theme";

/** 模拟 iOS 通知横幅:作品完成,或运营活动推送(只发给打开了 Offers & news 的用户,spec §6.3) */
export default function PushBanner() {
  const { state, dispatch } = useStore();
  const { navigate } = useNav();
  const insets = useInsets();
  const anim = useRef(new Animated.Value(0)).current;
  const job = state.pushBanner ? state.jobs.find((j) => j.id === state.pushBanner!.jobId) : undefined;
  const campaign = !job && state.campaignBanner && state.activePromo?.id === state.campaignBanner ? state.activePromo : null;
  const key = job?.id ?? campaign?.id;

  useEffect(() => {
    if (!key) return;
    anim.setValue(0);
    Animated.spring(anim, { toValue: 1, useNativeDriver: false, friction: 8 }).start();
  }, [key, anim]);

  if (!job && !campaign) return null;
  const open = () => {
    if (job) {
      dispatch({ type: "dismissPush" });
      navigate({ type: "push", route: { name: "work", id: job.id } });
    } else {
      dispatch({ type: "dismissCampaignBanner" });
      dispatch({ type: "openPaywall", trigger: "promo" });
    }
  };
  const title = job ? readyTitle(job.mode) : campaign!.title;
  const text = job ? `“${job.title}” is ready to review.` : campaign!.description;
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-140, 0] });

  return (
    <Animated.View style={[styles.wrap, { top: insets.top + 4, transform: [{ translateY }] }]}>
      <Pressable onPress={open} style={styles.banner}>
        {/* App 图标:白底方块 + 橙色 coin 标 */}
        <View style={styles.appIcon}>
          <Image source={{ uri: `${A}/app-logo.svg` }} style={{ width: 30, height: 30 }} resizeMode="contain" />
        </View>
        <View style={styles.body}>
          <View style={styles.headRow}>
            <Text style={styles.app}>BuzzVideo</Text>
            <Text style={styles.time}>now</Text>
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.text} numberOfLines={2}>
            {text}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 8, right: 8 },
  banner: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    borderRadius: radius.lg,
    ...smoothCorners,
    backgroundColor: "rgba(40,40,46,0.97)",
    boxShadow: elevation.float,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.edge,
  },
  appIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    ...smoothCorners,
    backgroundColor: colors.appIconBg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.edge,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1, gap: 1 },
  headRow: { flexDirection: "row", justifyContent: "space-between" },
  app: { ...type.footnote, color: colors.sub },
  time: { ...type.footnote, color: colors.sub },
  title: { ...type.subhead, fontWeight: "600", color: colors.ink },
  text: { ...type.subhead, color: colors.ink },
});
