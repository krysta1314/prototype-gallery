import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { durationLabel, isPlanning } from "../generation";
import { useNav, useStore } from "../provider";
import { jobProgress, type Job } from "../store";
import { colors, radius, type } from "../theme";
import Gradient from "./Gradient";
import Icon from "./Icon";
import MediaVideo from "./MediaVideo";
import { DURATION, prefersReducedMotion } from "./motion";
import ProgressBar from "./ProgressBar";
import Shimmer from "./Shimmer";

type Props = {
  job: Job;
  /** 前面有思考步骤时:规划阶段先不出卡,渲染开始才出现骨架 */
  waitForPlan?: boolean;
};

/** 屏宽约 60%,9:16 */
export const CARD_W = 224;
const CARD_H = Math.round((CARD_W * 16) / 9);

/** 同一张 9:16 卡:渲染中是骨架 + shimmer,完成后变成可播放的结果卡,失败时灰化 + Retry */
export default function JobCard({ job, waitForPlan }: Props) {
  const { state, dispatch } = useStore();
  const { navigate } = useNav();
  const pushOn = state.permissions.push === "granted";
  const open = () => navigate({ type: "push", route: { name: "work", id: job.id } });

  // 结果卡淡入 + 0.98→1,只在「刚刚完成」时播(打开旧会话不播)。
  // 外层 Animated.View 在各状态间始终是同一个节点
  const reveal = useRef(new Animated.Value(1)).current;
  const wasDone = useRef(job.status === "done");
  useEffect(() => {
    if (job.status !== "done") {
      wasDone.current = false;
      return;
    }
    if (wasDone.current) return;
    wasDone.current = true;
    if (prefersReducedMotion()) return;
    reveal.setValue(0);
    Animated.timing(reveal, { toValue: 1, duration: DURATION.base + 100, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [job.status, reveal]);

  // 插值节点要稳定(见 Shimmer 的注释),否则每次 tick 重渲染都会把进行中的动画停掉
  const scale = useMemo(() => reveal.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }), [reveal]);
  if (waitForPlan && isPlanning(job)) return null;
  return <Animated.View style={[styles.wrap, { opacity: reveal, transform: [{ scale }] }]}>{renderBody()}</Animated.View>;

  function renderBody() {
    if (job.status === "running") {
      const pct = Math.round(jobProgress(job) * 100);
      return (
        <>
          <Pressable onPress={open} accessibilityLabel={`${job.title}, rendering ${pct}%`} style={styles.card}>
            <Image source={{ uri: job.cover }} blurRadius={28} style={[StyleSheet.absoluteFill, styles.ghost]} resizeMode="cover" />
            <Shimmer />
            <View style={styles.progressDock}>
              <ProgressBar value={jobProgress(job)} height={2} />
            </View>
          </Pressable>
          <Text style={styles.status}>
            <Text style={styles.statusStrong}>Rendering · {pct}%</Text>
            {pushOn ? " · We’ll notify you" : ""}
          </Text>
          {!pushOn ? (
            <Pressable
              onPress={() => dispatch({ type: "showToast", text: "Opens iOS Settings → Notifications" })}
              accessibilityRole="button"
              style={({ pressed }) => [styles.hint, pressed && styles.pressedText]}
            >
              <Icon name="bell" size={16} color={colors.sub} />
              <Text style={styles.hintText}>
                Get a heads-up when it’s ready. <Text style={styles.hintLink}>Turn on</Text>
              </Text>
            </Pressable>
          ) : null}
        </>
      );
    }

    if (job.status === "failed") {
      return (
        <Pressable onPress={open} accessibilityLabel={`${job.title}, failed`} style={[styles.card, styles.failed]}>
          <Image source={{ uri: job.cover }} style={[StyleSheet.absoluteFill, styles.failedImg]} resizeMode="cover" />
          <View style={styles.failedBody}>
            <Icon name="circle-alert" size={22} color={colors.sub} />
            <Text style={styles.failedTitle}>Couldn’t render this one</Text>
            <Text style={styles.failedSub}>No credits charged</Text>
            <Pressable
              onPress={() => dispatch({ type: "retryJob", id: job.id })}
              hitSlop={8}
              accessibilityRole="button"
              style={({ pressed }) => [styles.retry, pressed && styles.pressedText]}
            >
              <Icon name="rotate-ccw" size={16} color={colors.ink} />
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        </Pressable>
      );
    }

    const duration = durationLabel(job.mode);
    return (
      <Pressable onPress={open} accessibilityLabel={`${job.title}, ready`} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
        {job.video ? (
          <MediaVideo uri={job.video} poster={job.cover} muted loop autoPlay style={StyleSheet.absoluteFill} />
        ) : (
          <Image source={{ uri: job.cover }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        )}
        <Gradient colors={["rgba(26,26,46,0)", "rgba(26,26,46,0.7)"]} style={styles.scrim} pointerEvents="none" />
        <View style={styles.meta}>
          <Text style={styles.title} numberOfLines={2}>
            {job.title}
          </Text>
          {duration ? (
            <View style={styles.durationRow}>
              <Icon name={job.mode === "audio" ? "audio-lines" : "play"} size={12} color={colors.white} />
              <Text style={styles.duration}>{duration}</Text>
            </View>
          ) : null}
        </View>
      </Pressable>
    );
  }
}

const styles = StyleSheet.create({
  wrap: { alignSelf: "flex-start", gap: 8 },
  card: { width: CARD_W, height: CARD_H, borderRadius: radius.lg, overflow: "hidden", backgroundColor: colors.grouped },
  pressed: { transform: [{ scale: 0.97 }] },
  pressedText: { opacity: 0.5 },
  ghost: { opacity: 0.35 },
  progressDock: { position: "absolute", left: 16, right: 16, bottom: 16 },
  status: { ...type.footnote, color: colors.sub },
  statusStrong: { fontWeight: "500", color: colors.ink, fontVariant: ["tabular-nums"] },
  hint: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 44, maxWidth: 300 },
  hintText: { ...type.footnote, color: colors.sub, flexShrink: 1 },
  hintLink: { fontWeight: "600", color: colors.ink },
  failed: { alignItems: "center", justifyContent: "center" },
  failedImg: { opacity: 0.12 },
  failedBody: { alignItems: "center", gap: 4, paddingHorizontal: 16 },
  failedTitle: { ...type.headline, color: colors.ink, textAlign: "center", marginTop: 8 },
  failedSub: { ...type.footnote, color: colors.sub },
  retry: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12, height: 36, paddingHorizontal: 16, borderRadius: radius.full, backgroundColor: colors.surface },
  retryText: { ...type.footnote, fontWeight: "600", color: colors.ink },
  scrim: { position: "absolute", left: 0, right: 0, bottom: 0, height: 160 },
  meta: { position: "absolute", left: 16, right: 16, bottom: 16, gap: 4 },
  title: { ...type.headline, color: colors.white },
  durationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  duration: { ...type.footnote, fontWeight: "500", color: "rgba(255,255,255,0.85)", fontVariant: ["tabular-nums"] },
});
