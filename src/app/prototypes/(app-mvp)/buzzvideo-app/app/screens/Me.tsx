import { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Coin from "../components/Coin";
import CountingNumber from "../components/CountingNumber";
import Gradient from "../components/Gradient";
import GroupedSection from "../components/GroupedSection";
import Icon from "../components/Icon";
import IconButton from "../components/IconButton";
import { pressScale } from "../components/motion";
import PrimaryButton from "../components/PrimaryButton";
import ProgressRing from "../components/ProgressRing";
import Row from "../components/Row";
import Pill from "../components/Pill";
import PlanBadge from "../components/PlanBadge";
import Segmented from "../components/Segmented";
import WebLink from "../components/WebLink";
import { NO_FILTERS, assetsFor, type AssetFilters, type AssetItem, type AssetScope } from "../assets";
import { A, MONTHLY_USED, USER, planLabel, workspaceName } from "../data";
import { useInsets, useNav, useStore } from "../provider";
import { LOW_CREDITS, canManageMembers, isEnterprise, isSubscribed, selfMember } from "../store";
import { colors, radius, smoothCorners, space, type } from "../theme";

export default function Me() {
  const { state, dispatch } = useStore();
  const { navigate } = useNav();
  const insets = useInsets();
  const [scopeChoice, setScope] = useState<AssetScope>("my");
  const [filters, setFilters] = useState<AssetFilters>(NO_FILTERS);
  const personal = state.workspace === "personal";
  // 个人空间没有团队素材
  const scope: AssetScope = personal ? "my" : scopeChoice;
  const items = assetsFor(state, scope, filters);
  // 个人空间一个素材都没有(新用户)
  const nothingYet = scope === "my" && assetsFor(state, "my").length === 0;
  const filtered = filters.favorites || filters.type !== "all" || filters.source !== "all";
  const ws = workspaceName(state.workspace);

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
          <View style={styles.nameRow}>
            <Text style={styles.name}>{USER.name}</Text>
            <PlanBadge
              key={state.planUpgrade ? `up-${state.planUpgrade.from}-${state.planUpgrade.to}` : "badge"}
              tier={isEnterprise(state) && state.workspace !== "personal" ? "enterprise" : state.subscription.plan}
              celebrateFrom={state.planUpgrade?.from}
              onCelebrated={() => dispatch({ type: "consumePlanUpgrade" })}
            />
          </View>
          <Text style={styles.email}>{USER.email}</Text>
          {/* 只有 Enterprise 用户(属于组织)才有工作区切换;其他账号只有 Personal */}
          {isEnterprise(state) ? (
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
          ) : null}
        </View>
      </View>

      {/* 续费扣款失败的宽限期:仍是会员,提示更新付款方式,点了拉起 App Store 付款设置(spec §2.5) */}
      {personal && state.subscription.billingRetry ? (
        <Pressable
          onPress={() => dispatch({ type: "showToast", text: "Opens App Store payment settings" })}
          accessibilityRole="button"
          style={({ pressed }) => [styles.billing, pressed && styles.faded]}
        >
          <Icon name="circle-alert" size={18} color={colors.danger} />
          <View style={styles.billingBody}>
            <Text style={styles.billingTitle}>Payment issue</Text>
            <Text style={styles.billingText}>{`We couldn't renew your ${planLabel(state.subscription.plan)} plan. Update your payment method to keep it.`}</Text>
          </View>
          <Icon name="chevron-right" size={16} color={colors.sub} />
        </Pressable>
      ) : null}

      {/* 积分卡:这屏的主角。0.5s 看到的是一个大数字,而不是一排文字行 */}
      <CreditsCard />
      {personal && isSubscribed(state) ? (
        <GroupedSection variant="tinted">
          <Row label="Buy credits" detail="Never expire" onPress={() => navigate({ type: "sheet", sheet: { name: "topUp" } })} chevron />
        </GroupedSection>
      ) : null}
      {personal && isSubscribed(state) ? <WebLink label="Top up on web" /> : null}
      {personal ? (
        <GroupedSection variant="tinted">
          <Row label="Invite friends" detail="1,500 credits per friend who subscribes" onPress={() => navigate({ type: "push", route: { name: "inviteFriends" } })} chevron />
        </GroupedSection>
      ) : null}

      {canManageMembers(state) ? (
        <GroupedSection variant="tinted">
          <Row label="Members" onPress={() => navigate({ type: "push", route: { name: "members" } })} chevron />
        </GroupedSection>
      ) : null}

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
        {/* 新用户一个素材都没有时不显示筛选:对空列表筛选没有意义 */}
        {nothingYet ? null : (
        <>
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
        </>
        )}
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
        // 新用户空状态(2026-10-15 定):3 张示例成片 + 一段引导 + 去 Agent 的按钮
        <View style={styles.firstAd}>
          <View style={styles.examples} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {EXAMPLES.map((uri) => (
              <Image key={uri} source={{ uri }} style={styles.example} resizeMode="cover" />
            ))}
          </View>
          <Text style={styles.emptyTitle}>Make your first ad</Text>
          <Text style={styles.emptyText}>Tell the Agent what you sell. It plans, shoots and cuts a ready-to-post ad for you.</Text>
          <PrimaryButton
            label="Start with the Agent"
            onPress={() => {
              dispatch({ type: "selectSession", id: null });
              dispatch({ type: "setComposer", patch: { mode: "agent" } });
              navigate({ type: "tab", tab: "create" });
            }}
            style={styles.emptyBtn}
          />
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

/**
 * 积分卡(spec §2.5、§2.7):大字余额 + 一根分段条 + 一句话。
 * 个人会员:条分成「订阅积分(每月重置)」和「永久积分(积分包、赠送)」;
 * Free:注册送的积分,写明视频要付费套餐;组织空间:条是自己本月已用 / 上限。
 * 点卡片:个人空间进付费墙,组织空间提示本月用量
 */
function CreditsCard() {
  const { state, dispatch } = useStore();
  const ws = state.workspace;
  const personal = ws === "personal";
  const balance = state.credits[ws];
  const low = balance <= LOW_CREDITS;
  const me = selfMember(state);
  const fmt = (n: number) => n.toLocaleString("en-US");
  const sub = personal ? Math.min(state.subscriptionCredits, balance) : 0;
  const rest = balance - sub;

  // 分段:个人 = 订阅 / 永久;组织 = 已用 / 上限
  const segments: { w: number; color: string }[] = personal
    ? isSubscribed(state)
      ? [
          { w: balance > 0 ? sub / balance : 0, color: colors.accent },
          { w: balance > 0 ? rest / balance : 0, color: colors.ink },
        ]
      : []
    : me
      ? [{ w: Math.min(1, me.used / me.cap), color: colors.accent }]
      : [];
  const line = personal
    ? isSubscribed(state)
      ? [`${fmt(sub)} plan credits reset monthly`, rest > 0 ? `${fmt(rest)} never expire` : null].filter(Boolean).join(" · ")
      : "Sign-up credits. Video ads come with paid plans."
    : me
      ? `You've used ${fmt(me.used)} of your ${fmt(me.cap)} monthly limit`
      : `Shared by ${workspaceName(ws)}`;

  return (
    <Pressable
      onPress={() =>
        personal
          ? dispatch({ type: "openPaywall", trigger: "manual" })
          : dispatch({ type: "showToast", text: `${fmt(MONTHLY_USED[ws])} credits used this month` })
      }
      accessibilityRole="button"
      accessibilityLabel={`${fmt(balance)} credits. ${line}`}
      style={({ pressed }) => [styles.creditsCard, pressed && styles.faded]}
    >
      <View style={styles.creditsTop}>
        <Text style={styles.creditsLabel}>{personal ? "Credits" : `${workspaceName(ws)} credits`}</Text>
        {personal ? null : <Text style={styles.creditsPlan}>Managed by your admin</Text>}
      </View>
      <View style={styles.creditsHero}>
        <Coin size={22} />
        <CountingNumber value={balance} style={[styles.creditsValue, low && styles.balanceLow]} />
      </View>
      {segments.length ? (
        <View style={styles.creditsBar}>
          {segments.map((g, i) => (g.w > 0 ? <View key={i} style={{ flex: g.w, backgroundColor: g.color }} /> : null))}
          {!personal && me ? <View style={{ flex: Math.max(0, 1 - me.used / me.cap) }} /> : null}
        </View>
      ) : null}
      <Text style={styles.creditsLine}>{line}</Text>
      {low ? (
        <Text style={styles.creditsLow}>{personal ? "Running low. Top up or upgrade to keep creating." : "Running low. Ask your admin to add more."}</Text>
      ) : null}
    </Pressable>
  );
}

/** 新用户空状态里的 3 张示例成片 */
const EXAMPLES = [`${A}/usecase-latte.jpg`, `${A}/usecase-florist.jpg`, `${A}/usecase-lipstick.jpg`];

const styles = StyleSheet.create({
  firstAd: { alignItems: "center", gap: space.sm, paddingTop: space.lg, paddingBottom: space.xxl },
  examples: { flexDirection: "row", gap: space.sm, alignSelf: "stretch", marginBottom: space.md },
  example: { flex: 1, aspectRatio: 3 / 4, borderRadius: radius.md, ...smoothCorners },
  nameRow: { flexDirection: "row", alignItems: "center", gap: space.sm },
  creditsCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: space.lg, gap: space.sm, ...smoothCorners },
  creditsTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  creditsLabel: { ...type.footnote, fontWeight: "600", color: colors.sub },
  creditsPlan: { ...type.footnote, color: colors.sub },
  creditsHero: { flexDirection: "row", alignItems: "center", gap: space.sm },
  creditsValue: { fontSize: 40, lineHeight: 46, fontWeight: "700", letterSpacing: -1, color: colors.ink, fontVariant: ["tabular-nums"] },
  creditsBar: { flexDirection: "row", height: 6, borderRadius: radius.full, overflow: "hidden", backgroundColor: colors.grouped, gap: 2, marginTop: space.xs },
  creditsLine: { ...type.footnote, color: colors.sub, fontVariant: ["tabular-nums"] },
  creditsLow: { ...type.footnote, fontWeight: "600", color: colors.danger },
  billing: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "rgba(197,40,47,0.25)",
  },
  billingBody: { flex: 1, gap: 2 },
  billingTitle: { ...type.headline, color: colors.ink },
  billingText: { ...type.subhead, color: colors.sub },
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
  failedVeil: { backgroundColor: "rgba(15,15,19,0.45)" },
  failedBadge: { position: "absolute", left: 6, bottom: 6, flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, height: 18, borderRadius: radius.xs, backgroundColor: colors.dangerFill, justifyContent: "center" },
  badgeText: { ...type.caption, color: colors.white },
  cornerScrim: { position: "absolute", left: 0, right: 0, bottom: 0, height: 40 },
  // 视频角标:压图半透明圆,保证亮图上也看得见
  cornerTR: { position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: radius.full, backgroundColor: colors.onImage, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", gap: space.sm, paddingVertical: space.xxl },
  emptyTitle: { ...type.headline, color: colors.ink },
  emptyText: { ...type.subhead, color: colors.sub, textAlign: "center" },
  emptyBtn: { marginTop: space.sm, alignSelf: "stretch" },
});
