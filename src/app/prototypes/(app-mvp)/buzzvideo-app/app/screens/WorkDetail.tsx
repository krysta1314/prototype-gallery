import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Gradient from "../components/Gradient";
import Icon from "../components/Icon";
import IconButton from "../components/IconButton";
import MediaVideo from "../components/MediaVideo";
import PrimaryButton from "../components/PrimaryButton";
import ProgressBar from "../components/ProgressBar";
import { modeLabel, modelLabel, type IconName } from "../data";
import { useInsets, useNav, useStore } from "../provider";
import { jobProgress } from "../store";
import { colors } from "../theme";

function Action({ icon, label, onPress, disabled }: { icon: IconName; label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={disabled ? undefined : onPress} style={[styles.action, disabled && styles.disabled]}>
      <View style={styles.actionIcon}>
        <Icon name={icon} size={22} color={colors.white} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

export default function WorkDetail({ id }: { id: string }) {
  const { state, dispatch } = useStore();
  const { navigate } = useNav();
  const insets = useInsets();
  const job = state.jobs.find((j) => j.id === id);

  if (!job) {
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={styles.gone}>This work was deleted.</Text>
        <PrimaryButton variant="light" label="Back" onPress={() => navigate({ type: "pop" })} style={styles.backBtn} />
      </View>
    );
  }

  const done = job.status === "done";
  const p = jobProgress(job);

  return (
    <View style={styles.root}>
      {done && job.video ? (
        <MediaVideo uri={job.video} poster={job.cover} style={StyleSheet.absoluteFill} />
      ) : (
        <Image source={{ uri: job.cover }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      )}

      {done && job.mode === "audio" ? (
        <View style={styles.audio}>
          <Icon name="audio-lines" size={18} color={colors.white} />
          <Text style={styles.audioText}>0:30 · Voiceover + music</Text>
        </View>
      ) : null}

      {!done ? (
        <View style={[StyleSheet.absoluteFill, styles.dim, styles.center]}>
          <View style={styles.stateBox}>
            {job.status === "running" ? (
              <>
                <Text style={styles.stateTitle}>Generating · {Math.round(p * 100)}%</Text>
                <ProgressBar value={p} />
                <Text style={styles.stateSub}>You can leave — we’ll notify you when it’s ready.</Text>
              </>
            ) : (
              <>
                <Text style={styles.stateTitle}>Generation failed</Text>
                <Text style={styles.stateSub}>No credits were charged.</Text>
                <PrimaryButton label="Retry" icon="rotate-ccw" onPress={() => dispatch({ type: "retryJob", id: job.id })} />
              </>
            )}
          </View>
        </View>
      ) : null}

      <View style={[styles.top, { paddingTop: insets.top + 6 }]}>
        <IconButton tone="dark" icon="chevron-left" onPress={() => navigate({ type: "pop" })} />
        <IconButton tone="dark" icon="ellipsis" onPress={() => navigate({ type: "sheet", sheet: { name: "workMore", workId: job.id } })} />
      </View>

      <Gradient colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.78)"]} style={[styles.bottom, { paddingBottom: insets.bottom + 14 }]}>
        <Text style={styles.title} numberOfLines={1}>
          {job.title}
        </Text>
        <Text style={styles.meta}>
          {modeLabel(job.mode)}
          {job.model ? ` · ${modelLabel(job.model)}` : ""} · AI-generated
        </Text>
        <View style={styles.actions}>
          <Action icon="download" label="Save" disabled={!done} onPress={() => dispatch({ type: "showToast", text: "Saved to Photos" })} />
          <Action icon="share" label="Share" disabled={!done} onPress={() => navigate({ type: "sheet", sheet: { name: "share", workId: job.id } })} />
          <Action
            icon="message-square"
            label="Edit in chat"
            onPress={() => {
              dispatch({ type: "selectSession", id: job.sessionId });
              navigate({ type: "tab", tab: "create" });
            }}
          />
        </View>
      </Gradient>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.black },
  center: { alignItems: "center", justifyContent: "center" },
  gone: { color: colors.white, fontSize: 16, marginBottom: 16 },
  backBtn: { width: 160 },
  dim: { backgroundColor: "rgba(0,0,0,0.55)" },
  stateBox: { width: "78%", gap: 12, alignItems: "stretch" },
  stateTitle: { color: colors.white, fontSize: 20, fontWeight: "800", textAlign: "center" },
  stateSub: { color: "rgba(255,255,255,0.8)", fontSize: 14, textAlign: "center" },
  audio: { position: "absolute", alignSelf: "center", top: "46%", flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.45)" },
  audioText: { color: colors.white, fontSize: 14, fontWeight: "600" },
  top: { position: "absolute", left: 0, right: 0, top: 0, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 12 },
  bottom: { position: "absolute", left: 0, right: 0, bottom: 0, paddingTop: 100, paddingHorizontal: 20, gap: 6 },
  title: { color: colors.white, fontSize: 22, fontWeight: "800" },
  meta: { color: "rgba(255,255,255,0.75)", fontSize: 13 },
  actions: { flexDirection: "row", justifyContent: "space-around", marginTop: 14 },
  action: { alignItems: "center", gap: 6, minWidth: 80 },
  disabled: { opacity: 0.35 },
  actionIcon: { width: 54, height: 54, borderRadius: 27, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  actionLabel: { color: colors.white, fontSize: 12, fontWeight: "700" },
});
