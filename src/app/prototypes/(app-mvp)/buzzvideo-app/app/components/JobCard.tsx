import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { modeLabel } from "../data";
import { useNav, useStore } from "../provider";
import { jobProgress, type Job } from "../store";
import { colors, radius, type } from "../theme";
import Icon from "./Icon";
import Pill from "./Pill";
import ProgressBar from "./ProgressBar";

export default function JobCard({ job }: { job: Job }) {
  const { state, dispatch } = useStore();
  const { navigate } = useNav();
  const p = jobProgress(job);
  const pushOn = state.permissions.push === "granted";
  const open = () => navigate({ type: "push", route: { name: "work", id: job.id } });

  return (
    <View style={styles.wrap}>
      <Pressable onPress={open} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
        <Image source={{ uri: job.cover }} style={[styles.thumb, job.status !== "done" && styles.thumbDim]} resizeMode="cover" />
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={1}>
            {job.title}
          </Text>
          <Text style={styles.meta}>{modeLabel(job.mode)}</Text>
          {job.status === "running" ? (
            <>
              <ProgressBar value={p} />
              <Text style={styles.status}>
                Generating · {Math.round(p * 100)}%{pushOn ? " · we’ll notify you" : ""}
              </Text>
            </>
          ) : null}
          {job.status === "done" ? <Text style={[styles.status, { color: colors.success }]}>Ready · Tap to review</Text> : null}
          {job.status === "failed" ? (
            <View style={styles.failRow}>
              <Text style={[styles.status, { color: colors.danger }]}>Failed · no credits charged</Text>
              <Pill icon="rotate-ccw" label="Retry" onPress={() => dispatch({ type: "retryJob", id: job.id })} />
            </View>
          ) : null}
        </View>
      </Pressable>
      {job.status === "running" && !pushOn ? (
        <Pressable
          onPress={() => dispatch({ type: "showToast", text: "Opens iOS Settings → Notifications" })}
          style={styles.hint}
        >
          <Icon name="bell" size={16} color={colors.sub} />
          <Text style={styles.hintText}>Turn on notifications to know when it’s ready</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  card: { flexDirection: "row", gap: 12, padding: 10, borderRadius: radius.lg, backgroundColor: colors.surface, maxWidth: 320 },
  pressed: { transform: [{ scale: 0.97 }] },
  thumb: { width: 64, height: 96, borderRadius: radius.md, backgroundColor: colors.grouped },
  thumbDim: { opacity: 0.55 },
  body: { flex: 1, justifyContent: "center", gap: 6 },
  title: { ...type.subhead, fontWeight: "600", color: colors.ink },
  meta: { ...type.footnote, color: colors.sub },
  status: { ...type.footnote, fontWeight: "500", color: colors.sub },
  failRow: { gap: 6, alignItems: "flex-start" },
  hint: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.md, backgroundColor: colors.grouped },
  hintText: { ...type.footnote, color: colors.ink },
});
