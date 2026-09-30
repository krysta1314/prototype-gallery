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
import Pill from "../components/Pill";
import Segmented from "../components/Segmented";
import { NO_FILTERS, assetsFor, type AssetFilters, type AssetItem, type AssetScope } from "../assets";
import { MONTHLY_USED, USER, workspaceName } from "../data";
import { useInsets, useNav, useStore } from "../provider";
import { LOW_CREDITS, canTopUpOnWeb } from "../store";
import { colors, radius, space, type } from "../theme";

export default function Me() {
  const { state, dispatch } = useStore();
  const { navigate } = useNav();
  const insets = useInsets();
  const [scopeChoice, setScope] = useState<AssetScope>("my");
  const [filters, setFilters] = useState<AssetFilters>(NO_FILTERS);
  const balance = state.credits[state.workspace];
  const personal = state.workspace === "personal";
  const low = balance <= LOW_CREDITS;
  // 个人空间没有团队素材
  const scope: AssetScope = personal ? "my" : scopeChoice;
  const items = assetsFor(state, scope, filters);
  const filtered = filters.favorites || filters.type !== "all" || filters.source !== "all";
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

      <View style={styles.assetsHead}>
        <Text style={styles.h2} accessibilityRole="header">
          Assets
        </Text>
        {personal ? null : (
          <Segmented
            value={scope}
            onChange={setScope}
            options={[
              { id: "my", label: "My Assets" },
              { id: "team", label: "Team Assets" },
            ]}
          />
        )}
        <View style={styles.chipRow}>
          <Pill label="Favorites" icon="heart" active={filters.favorites} onPress={() => setFilters({ ...filters, favorites: !filters.favorites })} />
          <View style={styles.flex} />
          <Pill label="Last modified" trailing="chevron-down" />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow} style={styles.chipScroll}>
          {TYPES.map((t) => (
            <Pill key={t.id} label={t.label} active={filters.type === t.id} onPress={() => setFilters({ ...filters, type: t.id })} />
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow} style={styles.chipScroll}>
          {SOURCES.map((t) => (
            <Pill key={t.id} label={t.label} active={filters.source === t.id} onPress={() => setFilters({ ...filters, source: t.id })} />
          ))}
        </ScrollView>
      </View>

      {items.length > 0 ? (
        <View style={styles.grid}>
          {items.map((item) => (
            <AssetTile key={item.id} item={item} />
          ))}
        </View>
      ) : filtered ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Nothing here</Text>
          <Text style={styles.emptyText}>No assets match these filters.</Text>
          <PrimaryButton variant="light" label="Clear filters" onPress={() => setFilters(NO_FILTERS)} style={styles.emptyBtn} />
        </View>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No assets yet</Text>
          <Text style={styles.emptyText}>Your ads and uploads show up here.</Text>
          <PrimaryButton label="Start creating" onPress={() => navigate({ type: "tab", tab: "create" })} style={styles.emptyBtn} />
        </View>
      )}
    </ScrollView>
  );
}

const TYPES: { id: AssetFilters["type"]; label: string }[] = [
  { id: "all", label: "All" },
  { id: "image", label: "Images" },
  { id: "video", label: "Videos" },
  { id: "audio", label: "Audio" },
  { id: "doc", label: "Docs" },
];
const SOURCES: { id: AssetFilters["source"]; label: string }[] = [
  { id: "all", label: "All" },
  { id: "ai", label: "AI" },
  { id: "upload", label: "Upload" },
];

/** 素材格:AI 作品与上传混排;状态叠在缩略图上 */
function AssetTile({ item }: { item: AssetItem }) {
  const { navigate } = useNav();
  const { dispatch } = useStore();
  const busy = item.status === "running" || item.status === "uploading";
  const status =
    item.status === "running" ? `rendering ${Math.round(item.progress * 100)}%` : item.status === "uploading" ? `uploading ${Math.round(item.progress * 100)}%` : item.status === "failed" ? "failed, tap to retry" : "ready";
  const onPress = () => {
    if (item.status === "failed" && item.jobId) dispatch({ type: "retryJob", id: item.jobId });
    else if (busy) return;
    else if (item.jobId) navigate({ type: "push", route: { name: "work", id: item.jobId } });
    else dispatch({ type: "showToast", text: item.author ? `${item.title} · ${item.author}` : item.title });
  };
  return (
    <Pressable
      onPress={onPress}
      onLongPress={() => dispatch({ type: "toggleFavorite", id: item.id })}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${status}${item.favorite ? ", favorite" : ""}`}
      style={({ pressed }) => [styles.cell, pressScale(pressed)]}
    >
      <View style={styles.tile}>
        {item.type === "doc" || !item.cover ? (
          <View style={[StyleSheet.absoluteFill, styles.center]}>
            <Icon name="file-text" size={28} color={colors.sub} />
          </View>
        ) : (
          <Image source={{ uri: item.cover }} blurRadius={item.status === "running" ? 12 : 0} style={StyleSheet.absoluteFill} resizeMode="cover" />
        )}
        {busy ? (
          <View style={[StyleSheet.absoluteFill, styles.veil, styles.center]}>
            <ProgressRing value={item.progress} size={item.source === "ai" ? 44 : 36} />
          </View>
        ) : null}
        {item.status === "failed" ? (
          <>
            <View style={[StyleSheet.absoluteFill, styles.failedVeil]} />
            <View style={styles.failedBadge}>
              <Icon name="rotate-ccw" size={11} color={colors.white} strokeWidth={2.25} />
              <Text style={styles.badgeText}>Retry</Text>
            </View>
          </>
        ) : null}
        {!busy && item.type !== "image" && item.type !== "doc" ? (
          <View style={styles.cornerTR}>
            <Icon name={item.type === "audio" ? "audio-lines" : "play"} size={12} color={colors.white} strokeWidth={2.25} />
          </View>
        ) : null}
        {item.favorite ? (
          <View style={styles.cornerTL}>
            <Icon name="heart" size={12} color={colors.white} strokeWidth={2.25} />
          </View>
        ) : null}
        {item.author ? (
          <>
            <Gradient colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.55)"]} style={styles.cornerScrim} pointerEvents="none" />
            <Text style={styles.author} numberOfLines={1}>
              {item.author}
            </Text>
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
  grid: { flexDirection: "row", flexWrap: "wrap", margin: -GAP / 2, marginTop: -space.xs },
  cell: { width: "33.3333%", aspectRatio: 3 / 4, padding: GAP / 2 },
  flex: { flex: 1 },
  h2: { ...type.title2, color: colors.ink },
  assetsHead: { gap: space.md },
  chipRow: { flexDirection: "row", alignItems: "center", gap: space.sm },
  chipScroll: { flexGrow: 0, marginHorizontal: -space.lg, paddingHorizontal: space.lg },
  cornerTL: { position: "absolute", top: 6, left: 6, width: 22, height: 22, borderRadius: radius.full, backgroundColor: colors.onImage, alignItems: "center", justifyContent: "center" },
  author: { ...type.caption, position: "absolute", left: 6, right: 6, bottom: 6, color: colors.white },
  tile: { flex: 1, borderRadius: radius.xs, overflow: "hidden", backgroundColor: colors.grouped },
  veil: { backgroundColor: "rgba(0,0,0,0.4)" },
  failedVeil: { backgroundColor: "rgba(250,248,246,0.35)" },
  failedBadge: { position: "absolute", left: 6, bottom: 6, flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, height: 18, borderRadius: radius.xs, backgroundColor: colors.danger, justifyContent: "center" },
  badgeText: { ...type.caption, color: colors.white },
  cornerScrim: { position: "absolute", left: 0, right: 0, bottom: 0, height: 40 },
  // 视频角标:压图半透明圆,保证亮图上也看得见
  cornerTR: { position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: radius.full, backgroundColor: colors.onImage, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", gap: space.sm, paddingVertical: space.xxl },
  emptyTitle: { ...type.headline, color: colors.ink },
  emptyText: { ...type.subhead, color: colors.sub, textAlign: "center" },
  emptyBtn: { marginTop: space.sm, alignSelf: "stretch" },
});
