import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Gradient from "../components/Gradient";
import Icon from "../components/Icon";
import IconButton from "../components/IconButton";
import MediaVideo from "../components/MediaVideo";
import { pressScale } from "../components/motion";
import PrimaryButton from "../components/PrimaryButton";
import ProgressBar from "../components/ProgressBar";
import { modeLabel, modelLabel, type IconName } from "../data";
import { durationLabel } from "../generation";
import { useInsets, useNav, useStore } from "../provider";
import { jobProgress } from "../store";
import { colors, radius, space, type } from "../theme";

/** 次级圆形图标按钮:压在深色图上,文字说明只放在 accessibilityLabel 里 */
function RoundAction({ icon, label, onPress, disabled }: { icon: IconName; label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [styles.round, disabled && styles.disabled, pressScale(pressed && !disabled)]}
    >
      <Icon name={icon} size={22} color={colors.white} />
    </Pressable>
  );
}

export default function WorkDetail({ id }: { id: string }) {
  const { state, dispatch } = useStore();
  const { navigate } = useNav();
  const insets = useInsets();
  const [muted, setMuted] = useState(true);
  const [played, setPlayed] = useState(0);
  const job = state.jobs.find((j) => j.id === id);

  if (!job) {
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={styles.gone}>This work was deleted.</Text>
        <PrimaryButton variant="white" size="md" label="Back" onPress={() => navigate({ type: "pop" })} style={styles.backBtn} />
      </View>
    );
  }

  const done = job.status === "done";
  const playing = done && !!job.video;
  const pct = Math.round(jobProgress(job) * 100);
  const meta = [done ? durationLabel(job.mode) : null, modeLabel(job.mode), job.model ? modelLabel(job.model) : null, "AI-generated"].filter(Boolean).join(" · ");

  return (
    <View style={styles.root}>
      {playing ? (
        <MediaVideo uri={job.video!} poster={job.cover} muted={muted} onProgress={setPlayed} style={StyleSheet.absoluteFill} />
      ) : (
        <Image source={{ uri: job.cover }} blurRadius={done ? 0 : 24} style={StyleSheet.absoluteFill} resizeMode="cover" />
      )}

      {done && job.mode === "audio" ? (
        <View style={styles.audio}>
          <Icon name="audio-lines" size={20} color={colors.white} />
          <Text style={styles.audioText}>0:30 · Voiceover + music</Text>
        </View>
      ) : null}

      {!done ? (
        <View style={[StyleSheet.absoluteFill, job.status === "failed" ? styles.dimFailed : styles.dim, styles.center]}>
          <View style={styles.stateBox}>
            {job.status === "running" ? (
              <>
                <Text style={styles.stateTitle}>Rendering · {pct}%</Text>
                <ProgressBar value={pct / 100} height={2} tone="onImage" />
                <Text style={styles.stateSub}>You can leave. We’ll notify you when it’s ready.</Text>
              </>
            ) : (
              <>
                <Icon name="circle-alert" size={24} color={colors.white} />
                <Text style={styles.stateTitle}>Couldn’t render this one</Text>
                <Text style={styles.stateSub}>No credits charged.</Text>
                <PrimaryButton variant="white" size="md" label="Retry" onPress={() => dispatch({ type: "retryJob", id: job.id })} style={styles.retry} />
              </>
            )}
          </View>
        </View>
      ) : null}

      {/* 顶部压图:状态栏遮罩 + 返回 / 静音 / 更多 */}
      <Gradient colors={["rgba(0,0,0,0.45)", "rgba(0,0,0,0)"]} style={styles.topScrim} pointerEvents="none" />
      <View style={[styles.top, { paddingTop: insets.top }]}>
        <IconButton tone="onImage" icon="chevron-left" accessibilityLabel="Back" onPress={() => navigate({ type: "pop" })} />
        <View style={styles.topRight}>
          {playing ? (
            <IconButton
              tone="onImage"
              icon={muted ? "volume-x" : "volume-2"}
              accessibilityLabel={muted ? "Turn sound on" : "Mute"}
              onPress={() => setMuted((m) => !m)}
            />
          ) : null}
          <IconButton tone="onImage" icon="ellipsis" accessibilityLabel="More" onPress={() => navigate({ type: "sheet", sheet: { name: "workMore", workId: job.id } })} />
        </View>
      </View>

      <Gradient colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.55)", "rgba(0,0,0,0.8)"]} style={[styles.bottom, { paddingBottom: insets.bottom + space.sm }]}>
        {playing ? (
          <View style={styles.track} accessibilityElementsHidden importantForAccessibility="no">
            <View style={[styles.trackFill, { width: `${Math.round(played * 1000) / 10}%` }]} />
          </View>
        ) : null}
        <Text style={styles.title} numberOfLines={2}>
          {job.title}
        </Text>
        <Text style={styles.meta}>{meta}</Text>
        <View style={styles.actions}>
          <RoundAction icon="download" label="Save" disabled={!done} onPress={() => dispatch({ type: "showToast", text: "Saved" })} />
          <RoundAction
            icon="message-square"
            label="Edit in chat"
            onPress={() => {
              dispatch({ type: "selectSession", id: job.sessionId });
              navigate({ type: "tab", tab: "create" });
            }}
          />
          <PrimaryButton
            label="Share"
            icon="share"
            // 没完成时不给渐变:这屏的主动作是 Retry / 等待,别让一个灰掉的橙色块抢眼
            variant={done ? "cta" : "onImage"}
            disabled={!done}
            onPress={() => navigate({ type: "sheet", sheet: { name: "share", workId: job.id } })}
            style={styles.share}
          />
        </View>
      </Gradient>
    </View>
  );
}

const ROUND = 52;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.black },
  center: { alignItems: "center", justifyContent: "center" },
  gone: { ...type.body, color: colors.white, marginBottom: space.lg },
  backBtn: { width: 160 },
  dim: { backgroundColor: "rgba(0,0,0,0.45)" },
  dimFailed: { backgroundColor: "rgba(26,26,46,0.72)" },
  stateBox: { width: "78%", gap: space.md, alignItems: "center" },
  stateTitle: { ...type.headline, color: colors.white, textAlign: "center", fontVariant: ["tabular-nums"] },
  stateSub: { ...type.footnote, color: "rgba(255,255,255,0.8)", textAlign: "center" },
  retry: { marginTop: space.xs, minWidth: 120 },
  audio: {
    position: "absolute",
    alignSelf: "center",
    top: "46%",
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    paddingHorizontal: space.md,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.onImage,
  },
  audioText: { ...type.footnote, fontWeight: "600", color: colors.white },
  topScrim: { position: "absolute", left: 0, right: 0, top: 0, height: 120 },
  top: { position: "absolute", left: 0, right: 0, top: 0, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: space.xs },
  topRight: { flexDirection: "row" },
  bottom: { position: "absolute", left: 0, right: 0, bottom: 0, paddingTop: 120, paddingHorizontal: space.lg, gap: space.xs },
  track: { height: 2, borderRadius: radius.full, backgroundColor: "rgba(255,255,255,0.2)", marginBottom: space.md, overflow: "hidden" },
  trackFill: { height: 2, backgroundColor: "rgba(255,255,255,0.6)" },
  title: { ...type.title2, color: colors.white },
  meta: { ...type.footnote, color: "rgba(255,255,255,0.8)" },
  actions: { flexDirection: "row", alignItems: "center", gap: space.md, marginTop: space.lg },
  round: { width: ROUND, height: ROUND, borderRadius: radius.full, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
  disabled: { opacity: 0.4 },
  share: { flex: 1 },
});
