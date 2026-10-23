import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { MODE_COST, type IconName } from "../data";
import { isPlanning } from "../generation";
import { nextId } from "../ids";
import Coin from "./Coin";
import { useNav, useStore } from "../provider";
import { hasWatermark, jobProgress, type Job } from "../store";
import Watermark from "./Watermark";
import { colors, ctaGradient, fill, radius, type, smoothCorners } from "../theme";
import Icon from "./Icon";
import ChatVideo from "./ChatVideo";
import Gradient from "./Gradient";
import { DURATION, prefersReducedMotion } from "./motion";
import GenFill from "./GenFill";

type Props = {
  job: Job;
  /** 前面有思考步骤时:规划阶段先不出卡,渲染开始才出现骨架 */
  waitForPlan?: boolean;
};

/** 屏宽约 60%,9:16 */
export const CARD_W = 224;
const CARD_H = Math.round((CARD_W * 16) / 9);
/** 单独生成的卡按选的比例出(1:1 是方的),Agent 成片固定 9:16 */
/** 音频卡(2026-10-23,照网页版):一条宽而矮的卡，完成后是播放条 */
const AUDIO_W = 300;
const AUDIO_H = 96;
/** 完成后多一行右上角操作 */
const AUDIO_DONE_H = 116;
const cardSize = (job: Job) => {
  if (job.mode === "audio") return { width: AUDIO_W, height: job.status === "done" ? AUDIO_DONE_H : AUDIO_H };
  const r = job.params?.[1];
  if (!r || !/^\d+:\d+$/.test(r)) return null;
  const [w, h] = r.split(":").map(Number);
  return { width: CARD_W, height: Math.round((CARD_W * h) / w) };
};

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
  // 单独 Image / Video / Audio 生成(2026-10-23,照网页版):卡片上面一行「提示词 + 模型 · 比例 · 清晰度」,
  // 下面 Edit(把提示词放回输入框改)/ Retry · 积分(同样参数再来一次);生成中卡片左上角「Generating…」
  const single = !!job.params;
  const cost = MODE_COST[job.mode] * (job.batch ?? 1);
  return (
    <Animated.View style={[styles.wrap, { opacity: reveal, transform: [{ scale }] }]}>
      {single ? (
        <Text style={styles.head} numberOfLines={2}>
          <Text style={styles.headPrompt}>{job.prompt}</Text>
          <Text style={styles.headParams}>{`  ${job.params!.join(" · ")}`}</Text>
        </Text>
      ) : null}
      {renderBody()}
      {single ? (
        <View style={styles.actions}>
          <Pressable
            onPress={() => dispatch({ type: "setComposer", patch: { text: job.prompt, mode: job.mode, model: job.model } })}
            accessibilityRole="button"
            style={({ pressed }) => [styles.action, pressed && styles.pressedText]}
          >
            <Icon name="square-pen" size={14} color={colors.ink} />
            <Text style={styles.actionText}>Edit</Text>
          </Pressable>
          {/* 生成中 Retry 置灰点不了 */}
          <Pressable
            disabled={job.status === "running"}
            onPress={() => dispatch({ type: "regenerateJob", id: job.id, newId: nextId("j") })}
            accessibilityRole="button"
            accessibilityState={{ disabled: job.status === "running" }}
            style={({ pressed }) => [styles.action, job.status === "running" && styles.actionOff, pressed && styles.pressedText]}
          >
            <Icon name="rotate-ccw" size={14} color={colors.ink} />
            <Text style={styles.actionText}>Retry</Text>
            <View style={styles.actionCost}>
              <Coin size={12} />
              <Text style={styles.actionCostText}>{cost}</Text>
            </View>
          </Pressable>
        </View>
      ) : null}
    </Animated.View>
  );

  function renderBody() {
    if (job.status === "running") {
      const pct = Math.round(jobProgress(job) * 100);
      return (
        <>
          <Pressable onPress={open} accessibilityLabel={`${job.title}, rendering ${pct}%`} style={[styles.card, cardSize(job)]}>
            {/* 生成中：杏粉色流动渐变(和网页版一致),不再用模糊的封面图 */}
            <GenFill />
            <View style={styles.generating}>
              <Text style={styles.generatingText}>Generating…</Text>
            </View>
          </Pressable>
          {/* 生成中不显示进度条和百分比(2026-10-23):卡片的流动渐变 + Generating… 就够了 */}
          {!pushOn ? (
            <Pressable
              // 没问过 → 系统推送框;拒绝过 → 直接跳 iOS 设置(这里已经是用户主动点的按钮，不再多弹一层)
              onPress={() => dispatch(state.permissions.push === "undetermined" ? { type: "requestPermission", kind: "push" } : { type: "openIosSettings" })}
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
        <Pressable onPress={open} accessibilityLabel={`${job.title}, failed`} style={[styles.card, cardSize(job), styles.failed]}>
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

    // 完成(2026-10-23,照网页版):视频卡是内嵌播放器，图片卡点了打开详情;右上角一排操作(和网页版一致):编辑提示词 / @ 引用 / 收藏 / 下载 / 重新生成。
    // 不再在卡片上压标题和时长
    const liked = state.favorites.includes(job.id);
    // @ 引用：把这条结果作为参考素材放进输入框
    const asAttachment = { id: nextId("a"), uri: job.cover, kind: (job.video ? "video" : "photo") as "video" | "photo", label: job.title, uploaded: true };
    const tools: { icon: IconName; label: string; on?: boolean; onPress: () => void }[] = [
      // 编辑：把这条的提示词(连同模式、模型)带回输入框，改一改再发
      { icon: "pencil", label: "Edit prompt", onPress: () => dispatch({ type: "setComposer", patch: { text: job.prompt, mode: job.mode, model: job.model } }) },
      // @:把它当参考素材引用进下一条
      { icon: "at-sign", label: "Use as reference", onPress: () => dispatch({ type: "addAttachments", items: [asAttachment] }) },
      { icon: "heart", label: liked ? "Remove from favorites" : "Favorite", on: liked, onPress: () => dispatch({ type: "toggleFavorite", id: job.id }) },
      { icon: "download", label: "Download", onPress: () => dispatch({ type: "workSaved", id: job.id }) },
      { icon: "rotate-ccw", label: "Regenerate", onPress: () => dispatch({ type: "regenerateJob", id: job.id, newId: nextId("j") }) },
    ];
    return (
      <View style={[styles.card, cardSize(job)]}>
        {job.mode === "audio" ? (
          // 音频(照网页版):右上角一排操作(收藏 / 下载 / 重新生成),下面一条灰底播放条：橙色渐变圆形播放键 + 波形 + 时间
          <View style={styles.audioCard}>
            <View style={styles.audioTools}>
              {tools
                .filter((t) => t.icon === "heart" || t.icon === "download" || t.icon === "rotate-ccw")
                .map((t) => (
                  <Pressable key={t.icon} onPress={t.onPress} accessibilityRole="button" accessibilityLabel={t.label} hitSlop={6} style={({ pressed }) => [styles.audioTool, pressed && styles.pressedDim]}>
                    <Icon name={t.icon} size={15} color={t.on ? "#ff375f" : colors.sub} fill={t.on ? "#ff375f" : undefined} strokeWidth={2} />
                  </Pressable>
                ))}
            </View>
            <AudioPlayer />
          </View>
        ) : job.video ? (
          <ChatVideo uri={job.video} poster={job.cover} onFullscreen={open} />
        ) : (
          <Pressable onPress={open} accessibilityLabel={`${job.title}, ready`} style={({ pressed }) => [StyleSheet.absoluteFill, pressed && styles.pressedDim]}>
            <Image source={{ uri: job.cover }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          </Pressable>
        )}
        {/* 视频卡底部有播放条，水印让到播放条上面 */}
        {hasWatermark(state, job) ? <Watermark size="sm" bottom={job.video ? 56 : undefined} /> : null}
        {job.mode !== "audio" ? (
          <View style={styles.tools} pointerEvents="box-none">
            {tools.map((t) => (
              <Pressable key={t.icon} onPress={t.onPress} accessibilityRole="button" accessibilityLabel={t.label} hitSlop={4} style={({ pressed }) => [styles.tool, pressed && styles.pressedDim]}>
                <Icon name={t.icon} size={13} color={t.on ? "#ff375f" : colors.white} fill={t.on ? "#ff375f" : undefined} strokeWidth={2.2} />
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  wrap: { alignSelf: "flex-start", gap: 8 },
  head: { maxWidth: 320 },
  headPrompt: { ...type.footnote, fontWeight: "600", color: colors.ink },
  headParams: { ...type.caption1, color: colors.sub },
  generating: { position: "absolute", top: 10, left: 10, height: 22, paddingHorizontal: 8, borderRadius: radius.xs + 2, backgroundColor: "rgba(0,0,0,0.18)", justifyContent: "center" },
  generatingText: { ...type.caption1, fontWeight: "600", color: colors.white },
  actions: { flexDirection: "row", gap: 6 },
  action: { flexDirection: "row", alignItems: "center", gap: 5, height: 32, paddingHorizontal: 12, borderRadius: radius.full, backgroundColor: "rgba(255,255,255,0.07)", borderWidth: StyleSheet.hairlineWidth, borderColor: colors.edge },
  actionText: { ...type.caption1, fontWeight: "600", color: colors.ink },
  actionCost: { flexDirection: "row", alignItems: "center", gap: 3, marginLeft: 2, paddingLeft: 6, borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.separator },
  actionCostText: { ...type.caption1, fontWeight: "600", color: colors.ctaA, fontVariant: ["tabular-nums"] },
  card: { width: CARD_W, height: CARD_H, borderRadius: radius.lg, overflow: "hidden", backgroundColor: colors.grouped, ...smoothCorners },
  pressed: { transform: [{ scale: 0.97 }] },
  pressedText: { opacity: 0.5 },
  ghost: { opacity: 0.35 },
  actionOff: { opacity: 0.4 },
  audioCard: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, padding: 10, gap: 6, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.edge },
  audioTools: { flexDirection: "row", justifyContent: "flex-end", gap: 14, paddingHorizontal: 4, height: 20, alignItems: "center" },
  audioTool: { alignItems: "center", justifyContent: "center" },
  audio: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 10, borderRadius: radius.md, backgroundColor: fill.base },
  audioPlay: { width: 36, height: 36, borderRadius: radius.full, alignItems: "center", justifyContent: "center", overflow: "hidden", paddingLeft: 2, boxShadow: "0 4px 12px rgba(255,82,85,0.35)" },
  audioMain: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  audioWave: { flex: 1, height: 24, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  audioBar: { width: 2, borderRadius: 1, backgroundColor: "rgba(255,255,255,0.3)" },
  audioBarOn: { backgroundColor: colors.accent },
  audioTime: { ...type.caption1, color: colors.sub, fontVariant: ["tabular-nums"] },
  tools: { position: "absolute", top: 8, right: 8, flexDirection: "row", gap: 5 },
  tool: { width: 26, height: 26, borderRadius: radius.full, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.38)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.35)" },
  pressedDim: { opacity: 0.7 },
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

/** 音频结果：橙色渐变播放键 + 波形 + 时间;点播放波形从左往右变橙(原型里模拟 4 秒) */
const AUDIO_BARS = Array.from({ length: 30 }, (_, i) => 0.25 + Math.abs(Math.sin(i * 1.7)) * 0.65 + (i % 5 === 0 ? 0.1 : 0));
const AUDIO_LEN = 4;
function AudioPlayer() {
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setT((x) => (x + 0.25 >= AUDIO_LEN ? (setPlaying(false), 0) : x + 0.25)), 250);
    return () => clearInterval(id);
  }, [playing]);
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const done = t / AUDIO_LEN;
  return (
    <View style={styles.audio}>
      <Pressable onPress={() => setPlaying((p) => !p)} accessibilityRole="button" accessibilityLabel={playing ? "Pause" : "Play"} style={({ pressed }) => [styles.audioPlay, pressed && styles.pressedDim]}>
        <Gradient colors={ctaGradient} angle={135} style={StyleSheet.absoluteFill} pointerEvents="none" />
        <Icon name={playing ? "pause" : "play"} size={14} color={colors.white} strokeWidth={2.6} />
      </Pressable>
      <View style={styles.audioMain}>
        <View style={styles.audioWave}>
          {AUDIO_BARS.map((h, i) => (
            <View key={i} style={[styles.audioBar, { height: `${Math.min(1, h) * 100}%` }, i / AUDIO_BARS.length < done && styles.audioBarOn]} />
          ))}
        </View>
        <Text style={styles.audioTime}>{`${fmt(t)} / ${fmt(AUDIO_LEN)}`}</Text>
      </View>
    </View>
  );
}
