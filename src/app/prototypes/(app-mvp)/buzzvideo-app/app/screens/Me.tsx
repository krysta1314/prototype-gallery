import { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Coin from "../components/Coin";
import Icon from "../components/Icon";
import IconButton from "../components/IconButton";
import Pill from "../components/Pill";
import PrimaryButton from "../components/PrimaryButton";
import ProgressBar from "../components/ProgressBar";
import Segmented from "../components/Segmented";
import { LIBRARY_ASSETS, MONTHLY_USED, USER, modeLabel, modelLabel, workspaceName } from "../data";
import { useInsets, useNav, useStore } from "../provider";
import { LOW_CREDITS, canTopUpOnWeb, insufficientCopy, jobProgress, uploadsFor, worksFor, type Job } from "../store";
import { colors, radius, type } from "../theme";

export default function Me() {
  const { state, dispatch } = useStore();
  const { navigate } = useNav();
  const insets = useInsets();
  const [tab, setTab] = useState<"works" | "assets">("works");
  const balance = state.credits[state.workspace];
  const personal = state.workspace === "personal";
  const works = worksFor(state);
  const uploads = uploadsFor(state);

  return (
    <ScrollView style={styles.root} contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Text style={styles.h1}>Me</Text>
        <IconButton icon="settings" onPress={() => navigate({ type: "push", route: { name: "settings" } })} />
      </View>

      <View style={styles.profile}>
        <Image source={{ uri: USER.avatar }} style={styles.avatar} />
        <View style={styles.profileBody}>
          <Text style={styles.name}>{USER.name}</Text>
          <Text style={styles.email}>{USER.email}</Text>
        </View>
        <Pill label={workspaceName(state.workspace)} trailing="chevron-down" onPress={() => navigate({ type: "sheet", sheet: { name: "workspace" } })} />
      </View>

      <View style={styles.credits}>
        <Text style={styles.creditsLabel}>{personal ? "Your credits" : `${workspaceName(state.workspace)} credits · shared`}</Text>
        <View style={styles.balanceRow}>
          <Coin size={16} />
          <Text style={styles.balance}>{balance.toLocaleString("en-US")}</Text>
        </View>
        <Text style={styles.used}>{MONTHLY_USED[state.workspace].toLocaleString("en-US")} used this month</Text>
        {balance <= LOW_CREDITS ? (
          <View style={styles.low}>
            <Icon name="circle-alert" size={16} color={colors.danger} />
            <Text style={styles.lowText}>{insufficientCopy(state)}</Text>
          </View>
        ) : null}
        {personal && canTopUpOnWeb(state) ? (
          <PrimaryButton
            variant="light"
            icon="external-link"
            label="Top up on web"
            onPress={() => dispatch({ type: "showToast", text: "Opens buzzvideo.ai in your browser" })}
            style={styles.topUp}
          />
        ) : null}
      </View>

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { id: "works", label: `Works · ${works.length}` },
          { id: "assets", label: `Assets · ${LIBRARY_ASSETS.length + uploads.length}` },
        ]}
      />

      {tab === "works" ? (
        works.length > 0 ? (
          <View style={styles.list}>
            {works.map((j) => (
              <WorkRow key={j.id} job={j} />
            ))}
          </View>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No works yet</Text>
            <PrimaryButton label="Start creating" onPress={() => navigate({ type: "tab", tab: "create" })} />
          </View>
        )
      ) : (
        <View style={styles.grid}>
          {uploads.map((u) => (
            <View key={u.id} style={styles.tile}>
              {u.kind === "pdf" ? (
                <View style={[styles.tileImg, styles.pdf]}>
                  <Icon name="file-text" size={22} color={colors.ink} />
                </View>
              ) : (
                <Image source={{ uri: u.uri }} style={styles.tileImg} resizeMode="cover" />
              )}
              {u.progress < 1 ? (
                <View style={styles.tileUploading}>
                  <Text style={styles.tileUploadingText}>{Math.round(u.progress * 100)}%</Text>
                </View>
              ) : null}
            </View>
          ))}
          {LIBRARY_ASSETS.map((a) => (
            <View key={a.id} style={styles.tile}>
              <Image source={{ uri: a.uri }} style={styles.tileImg} resizeMode="cover" />
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function WorkRow({ job }: { job: Job }) {
  const { dispatch } = useStore();
  const { navigate } = useNav();
  const p = jobProgress(job);
  return (
    <Pressable onPress={() => navigate({ type: "push", route: { name: "work", id: job.id } })} style={({ pressed }) => [styles.work, pressed && styles.pressed]}>
      <Image source={{ uri: job.cover }} style={styles.workThumb} resizeMode="cover" />
      <View style={styles.workBody}>
        <Text style={styles.workTitle} numberOfLines={1}>
          {job.title}
        </Text>
        <Text style={styles.workMeta}>
          {modeLabel(job.mode)}
          {job.model ? ` · ${modelLabel(job.model)}` : ""}
        </Text>
        {job.status === "running" ? (
          <>
            <ProgressBar value={p} />
            <Text style={styles.workStatus}>Generating · {Math.round(p * 100)}%</Text>
          </>
        ) : null}
        {job.status === "done" ? <Text style={[styles.workStatus, { color: colors.success }]}>Ready to review</Text> : null}
        {job.status === "failed" ? (
          <View style={styles.failRow}>
            <Text style={[styles.workStatus, { color: colors.danger }]}>Failed</Text>
            <Pill icon="rotate-ccw" label="Retry" onPress={() => dispatch({ type: "retryJob", id: job.id })} />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 24, gap: 16 },
  pressed: { opacity: 0.8 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  h1: { ...type.largeTitle, color: colors.ink },
  profile: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.grouped },
  profileBody: { flex: 1, gap: 2 },
  name: { ...type.headline, color: colors.ink },
  email: { fontSize: 13, color: colors.sub },
  credits: { padding: 16, borderRadius: radius.md, backgroundColor: colors.surface, gap: 4 },
  creditsLabel: { fontSize: 13, fontWeight: "600", color: colors.sub },
  balanceRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  balance: { ...type.title1, color: colors.ink, fontVariant: ["tabular-nums"] },
  used: { fontSize: 13, color: colors.sub },
  low: { flexDirection: "row", gap: 8, alignItems: "center", marginTop: 10, padding: 10, borderRadius: radius.md, backgroundColor: colors.grouped },
  lowText: { flex: 1, fontSize: 13, color: colors.ink },
  topUp: { marginTop: 12, height: 44 },
  list: { gap: 10 },
  work: { flexDirection: "row", gap: 12, padding: 10, borderRadius: radius.md, backgroundColor: colors.surface },
  workThumb: { width: 60, height: 84, borderRadius: 12, backgroundColor: colors.grouped },
  workBody: { flex: 1, justifyContent: "center", gap: 5 },
  workTitle: { ...type.subhead, fontWeight: "600", color: colors.ink },
  workMeta: { ...type.footnote, color: colors.sub },
  workStatus: { ...type.footnote, fontWeight: "500", color: colors.sub },
  failRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  empty: { alignItems: "center", gap: 12, paddingVertical: 32 },
  emptyText: { fontSize: 15, color: colors.sub },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tile: { width: "32%", aspectRatio: 1 },
  tileImg: { width: "100%", height: "100%", borderRadius: 14, backgroundColor: colors.grouped },
  pdf: { alignItems: "center", justifyContent: "center", backgroundColor: colors.grouped },
  tileUploading: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, borderRadius: 14, backgroundColor: "rgba(26,26,46,0.45)", alignItems: "center", justifyContent: "center" },
  tileUploadingText: { color: colors.white, fontSize: 13, fontWeight: "700" },
});
