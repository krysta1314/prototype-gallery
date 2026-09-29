import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { readyTitle } from "../data";
import { useInsets, useNav, useStore } from "../provider";
import { colors, ctaGradient } from "../theme";
import Gradient from "./Gradient";

/** 模拟 iOS 通知横幅 */
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
        <Gradient colors={ctaGradient} angle={135} style={styles.appIcon}>
          <Text style={styles.appIconText}>B</Text>
        </Gradient>
        <View style={styles.body}>
          <View style={styles.headRow}>
            <Text style={styles.app}>BUZZVIDEO</Text>
            <Text style={styles.time}>now</Text>
          </View>
          <Text style={styles.title}>{readyTitle(job.mode)}</Text>
          <Text style={styles.text} numberOfLines={1}>
            “{job.title}” is ready to review.
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
    gap: 10,
    padding: 12,
    borderRadius: 22,
    backgroundColor: "rgba(250,250,250,0.97)",
    boxShadow: "0px 12px 32px rgba(0,0,0,0.18)",
  },
  appIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  appIconText: { color: colors.white, fontSize: 20, fontWeight: "900" },
  body: { flex: 1, gap: 1 },
  headRow: { flexDirection: "row", justifyContent: "space-between" },
  app: { fontSize: 12, fontWeight: "600", color: colors.sub, letterSpacing: 0.5 },
  time: { fontSize: 12, color: colors.sub },
  title: { fontSize: 15, fontWeight: "700", color: colors.ink },
  text: { fontSize: 14, color: colors.ink },
});
