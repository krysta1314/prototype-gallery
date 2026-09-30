import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { readyTitle } from "../data";
import { useInsets, useNav, useStore } from "../provider";
import { colors, elevation, radius, type, smoothCorners } from "../theme";
import Coin from "./Coin";

/** 模拟 iOS 通知横幅(深色模式通知材质) */
export default function PushBanner() {
  const { state, dispatch } = useStore();
  const { navigate } = useNav();
  const insets = useInsets();
  const anim = useRef(new Animated.Value(0)).current;
  const job = state.pushBanner ? state.jobs.find((j) => j.id === state.pushBanner!.jobId) : undefined;

  useEffect(() => {
    if (!job) return;
    anim.setValue(0);
    Animated.spring(anim, { toValue: 1, useNativeDriver: false, friction: 8 }).start();
  }, [job?.id, anim]);

  if (!job) return null;
  const open = () => {
    dispatch({ type: "dismissPush" });
    navigate({ type: "push", route: { name: "work", id: job.id } });
  };
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-140, 0] });

  return (
    <Animated.View style={[styles.wrap, { top: insets.top + 4, transform: [{ translateY }] }]}>
      <Pressable onPress={open} style={styles.banner}>
        {/* App 图标:深色方块 + 橙色 coin 标(与桌面深色图标一致) */}
        <View style={styles.appIcon}>
          <Coin size={20} />
        </View>
        <View style={styles.body}>
          <View style={styles.headRow}>
            <Text style={styles.app}>BuzzVideo</Text>
            <Text style={styles.time}>now</Text>
          </View>
          <Text style={styles.title}>{readyTitle(job.mode)}</Text>
          <Text style={styles.text} numberOfLines={2}>
            “{job.title}” is ready to review.
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

/** 通知材质的背景模糊(网页端 CSS;原生端由 UIVisualEffectView 提供) */
const BLUR = { backdropFilter: "blur(30px) saturate(180%)" } as unknown as ViewStyle;

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 8, right: 8 },
  banner: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    borderRadius: radius.lg,
    ...smoothCorners,
    backgroundColor: "rgba(37,37,40,0.82)",
    ...BLUR,
    boxShadow: elevation.float,
  },
  appIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    ...smoothCorners,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.separator,
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
