import { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Coin from "../components/Coin";
import Gradient from "../components/Gradient";
import GroupedSection from "../components/GroupedSection";
import Icon from "../components/Icon";
import IconButton from "../components/IconButton";
import { pressScale } from "../components/motion";
import PrimaryButton from "../components/PrimaryButton";
import ProgressRing from "../components/ProgressRing";
import Row from "../components/Row";
import Segmented from "../components/Segmented";
import { LIBRARY_ASSETS, MONTHLY_USED, USER, workspaceName } from "../data";
import { durationLabel } from "../generation";
import { useInsets, useNav, useStore } from "../provider";
import { LOW_CREDITS, canTopUpOnWeb, jobProgress, uploadsFor, worksFor, type Job } from "../store";
import { colors, radius, space, type } from "../theme";

export default function Me() {
  const { state, dispatch } = useStore();
  const { navigate } = useNav();
  const insets = useInsets();
  const [tab, setTab] = useState<"works" | "assets">("works");
  const balance = state.credits[state.workspace];
  const personal = state.workspace === "personal";
  const low = balance <= LOW_CREDITS;
  const works = worksFor(state);
  const uploads = uploadsFor(state);
  const ws = workspaceName(state.workspace);

  const creditsNote = [
    personal ? null : `Shared by ${ws} · managed by your admin`,
    low ? (personal ? "You’re running low. Each video uses about 60 credits." : "Running low. Ask your admin to add more.") : null,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <ScrollView style={styles.root} contentContainerStyle={[styles.content, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.h1} accessibilityRole="header">
          Me
        </Text>
        <IconButton icon="settings" accessibilityLabel="Settings" onPress={() => navigate({ type: "push", route: { name: "settings" } })} />
      </View>

      <View style={styles.profile}>
        <Image source={{ uri: USER.avatar }} style={styles.avatar} />
        <View style={styles.profileBody}>
          <Text style={styles.name}>{USER.name}</Text>
          <Text style={styles.email}>{USER.email}</Text>
          <Pressable
            onPress={() => navigate({ type: "sheet", sheet: { name: "workspace" } })}
            hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={`Workspace: ${ws}. Switch workspace`}
            style={({ pressed }) => [styles.workspace, pressed && styles.faded]}
          >
            <Text style={styles.workspaceText}>{ws}</Text>
            <Icon name="chevron-down" size={16} color={colors.ink} strokeWidth={2} />
          </Pressable>
        </View>
      </View>

      <GroupedSection variant="tinted" footer={creditsNote || undefined}>
        <Row
          label="Credits"
          onPress={() => dispatch({ type: "showToast", text: `${MONTHLY_USED[state.workspace].toLocaleString("en-US")} credits used this month` })}
          right={
            <View style={styles.balance}>
              <Coin size={16} />
              <Text style={[styles.balanceText, low && styles.balanceLow]}>{balance.toLocaleString("en-US")}</Text>
            </View>
          }
          chevron
        />
        {personal && canTopUpOnWeb(state) ? (
          <Row
            label="Top up on web"
            onPress={() => dispatch({ type: "showToast", text: "Opens buzzvideo.ai in your browser" })}
            right={<Icon name="arrow-up-right" size={18} color={colors.faint} />}
          />
        ) : null}
      </GroupedSection>

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
          <View style={styles.grid}>
            {works.map((j) => (
              <WorkTile key={j.id} job={j} />
            ))}
          </View>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No works yet</Text>
            <Text style={styles.emptyText}>Your ads show up here once they’re rendered.</Text>
            <PrimaryButton label="Start creating" onPress={() => navigate({ type: "tab", tab: "create" })} style={styles.emptyBtn} />
          </View>
        )
      ) : (
        <View style={styles.grid}>
          {uploads.map((u) => (
            <View key={u.id} style={styles.cellSquare} accessibilityLabel={u.progress < 1 ? `Uploading, ${Math.round(u.progress * 100)}%` : "Uploaded asset"}>
              <View style={styles.tile}>
                {u.kind === "pdf" ? (
                  <View style={[StyleSheet.absoluteFill, styles.pdf]}>
                    <Icon name="file-text" size={24} color={colors.sub} />
                  </View>
                ) : (
                  <Image source={{ uri: u.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                )}
                {u.progress < 1 ? (
                  <View style={[StyleSheet.absoluteFill, styles.veil, styles.center]}>
                    <ProgressRing value={u.progress} size={36} />
                  </View>
                ) : null}
              </View>
            </View>
          ))}
          {LIBRARY_ASSETS.map((a) => (
            <View key={a.id} style={styles.cellSquare} accessibilityLabel={a.label}>
              <View style={styles.tile}>
                <Image source={{ uri: a.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                {a.kind === "video" ? (
                  <View style={styles.cornerTR}>
                    <Icon name="play" size={12} color={colors.white} strokeWidth={2.25} />
                  </View>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

/** 作品格:9:16,状态叠在缩略图上 */
function WorkTile({ job }: { job: Job }) {
  const { navigate } = useNav();
  const p = jobProgress(job);
  const duration = durationLabel(job.mode);
  const status = job.status === "running" ? `rendering ${Math.round(p * 100)}%` : job.status === "failed" ? "failed" : duration ?? "ready";
  return (
    <Pressable
      onPress={() => navigate({ type: "push", route: { name: "work", id: job.id } })}
      accessibilityRole="button"
      accessibilityLabel={`${job.title}, ${status}`}
      style={({ pressed }) => [styles.cellTall, pressScale(pressed)]}
    >
      <View style={styles.tile}>
        <Image source={{ uri: job.cover }} blurRadius={job.status === "running" ? 12 : 0} style={StyleSheet.absoluteFill} resizeMode="cover" />
        {job.status === "running" ? (
          <View style={[StyleSheet.absoluteFill, styles.veil, styles.center]}>
            <ProgressRing value={p} />
          </View>
        ) : null}
        {job.status === "failed" ? (
          <>
            <View style={[StyleSheet.absoluteFill, styles.failedVeil]} />
            <View style={styles.failedBadge}>
              <Text style={styles.badgeText}>Failed</Text>
            </View>
          </>
        ) : null}
        {job.status === "done" && duration ? (
          <>
            <Gradient colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.5)"]} style={styles.cornerScrim} pointerEvents="none" />
            <Text style={styles.duration}>{duration}</Text>
          </>
        ) : null}
      </View>
    </Pressable>
  );
}

const GAP = 2;

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: space.lg, paddingBottom: space.xl, gap: space.lg },
  center: { alignItems: "center", justifyContent: "center" },
  faded: { opacity: 0.5 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginRight: -space.md, marginTop: space.xs },
  h1: { ...type.largeTitle, color: colors.ink },
  profile: { flexDirection: "row", alignItems: "center", gap: space.md },
  avatar: { width: 48, height: 48, borderRadius: radius.full, backgroundColor: colors.grouped },
  profileBody: { flex: 1, gap: 2 },
  name: { ...type.headline, color: colors.ink },
  email: { ...type.footnote, color: colors.sub },
  workspace: { flexDirection: "row", alignItems: "center", gap: space.xs, alignSelf: "flex-start", marginTop: space.xs },
  workspaceText: { ...type.footnote, fontWeight: "500", color: colors.ink },
  balance: { flexDirection: "row", alignItems: "center", gap: 6 },
  balanceText: { ...type.body, fontWeight: "600", color: colors.ink, fontVariant: ["tabular-nums"] },
  balanceLow: { color: colors.danger },
  // 3 列网格:格子自带 1px 内边距,拼出 2px 间距
  grid: { flexDirection: "row", flexWrap: "wrap", margin: -GAP / 2, marginTop: -space.sm },
  cellTall: { width: "33.3333%", aspectRatio: 9 / 16, padding: GAP / 2 },
  cellSquare: { width: "33.3333%", aspectRatio: 1, padding: GAP / 2 },
  tile: { flex: 1, borderRadius: radius.xs, overflow: "hidden", backgroundColor: colors.grouped },
  veil: { backgroundColor: "rgba(0,0,0,0.4)" },
  failedVeil: { backgroundColor: "rgba(250,248,246,0.35)" },
  failedBadge: { position: "absolute", left: 6, bottom: 6, paddingHorizontal: 6, height: 18, borderRadius: radius.xs, backgroundColor: colors.danger, justifyContent: "center" },
  badgeText: { ...type.caption, color: colors.white },
  cornerScrim: { position: "absolute", left: 0, right: 0, bottom: 0, height: 40 },
  duration: { ...type.caption, position: "absolute", right: 6, bottom: 6, color: colors.white, fontVariant: ["tabular-nums"] },
  // 视频角标:压图半透明圆,保证亮图上也看得见
  cornerTR: { position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: radius.full, backgroundColor: colors.onImage, alignItems: "center", justifyContent: "center" },
  pdf: { alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", gap: space.sm, paddingVertical: space.xxl },
  emptyTitle: { ...type.headline, color: colors.ink },
  emptyText: { ...type.subhead, color: colors.sub, textAlign: "center" },
  emptyBtn: { marginTop: space.sm, alignSelf: "stretch" },
});
