import { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Coin from "../components/Coin";
import CountingNumber from "../components/CountingNumber";
import Gradient from "../components/Gradient";
import Icon from "../components/Icon";
import IconButton from "../components/IconButton";
import { pressScale } from "../components/motion";
import ProgressRing from "../components/ProgressRing";
import PlanBadge from "../components/PlanBadge";
import { assetsFor, type AssetItem } from "../assets";
import { A, INVITE, USER, planLabel, workspaceName } from "../data";
import { tabBarSpace } from "../components/TabBar";
import { useInsets, useNav, useStore } from "../provider";
import { LOW_CREDITS, canManageMembers, isEnterprise, isSubscribed, selfMember } from "../store";
import { colors, fill, radius, smoothCorners, space, type } from "../theme";

type AssetTab = "all" | AssetItem["type"] | "favorites";
const ASSET_TABS: { id: AssetTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "image", label: "Images" },
  { id: "video", label: "Videos" },
  { id: "audio", label: "Audio" },
  { id: "doc", label: "Docs" },
  { id: "favorites", label: "Favorites" },
];
const fmt = (n: number) => n.toLocaleString("en-US");

/**
 * Me(2026-10-23 定稿，工具类布局，参照 CapCut / 照片):一行小头像 → 积分、邀请两张并排小卡 → 作品(尽早露出来)。
 * 深色克制，橙色只给充值动作，不做大数字卡。
 * 状态都保留:Free / 会员 / 组织成员 / 余额不足 / 扣款失败 / 新用户没作品;组织空间多 Team tab,Owner / Admin 有 Members
 */
export default function Me() {
  const insets = useInsets();
  const { navigate } = useNav();
  return (
    <View style={styles.page}>
      <MemberBackdrop />
      {/* 顶栏只留设置;积分和邀请都挪进页面里，按顺序出现 */}
      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
        <IconButton icon="settings" accessibilityLabel="Settings" onPress={() => navigate({ type: "push", route: { name: "settings" } })} />
      </View>
      <ScrollView style={styles.root} contentContainerStyle={[styles.content, { paddingBottom: tabBarSpace(insets.bottom) + space.md }]} showsVerticalScrollIndicator={false}>
        <Profile />
        <BillingIssue />
        <ToolBlocks />
        <Works />
      </ScrollView>
    </View>
  );
}

/** 套餐色(和名字旁的套餐标同一色系，压暗后用在深色背景上) */
const TIER_TINT: Record<"starter" | "pro" | "ultra" | "enterprise", string> = {
  starter: "255,181,71",
  pro: "255,106,61",
  ultra: "155,107,255",
  enterprise: "232,197,131",
};

/**
 * 会员 Me 页顶部背景(2026-10-23 定稿：套餐色光晕):只给会员 / Enterprise,Free 保持纯底色。
 * 套餐色从左上角散开，从顶部一直铺到 Assets 标题和类型 tab 下面，再渐隐进页面底色;不随列表滚动
 */
function MemberBackdrop() {
  const { state } = useStore();
  const insets = useInsets();
  const org = isEnterprise(state) && state.workspace !== "personal";
  const tier = org ? "enterprise" : state.subscription.plan;
  if (tier === "free") return null;
  const tint = TIER_TINT[tier];
  return (
    <View style={[styles.backdrop, { height: insets.top + 480 }]} pointerEvents="none">
      <Gradient colors={[`rgba(${tint},0.42)`, `rgba(${tint},0.12)`, "rgba(15,15,19,0)"]} radial="150% 110% at 15% 0%" style={StyleSheet.absoluteFill} />
      <Gradient colors={["rgba(15,15,19,0)", colors.bg]} style={styles.backdropFade} pointerEvents="none" />
    </View>
  );
}

/** 头像 + 名字 + 套餐标 + 邮箱;Enterprise 用户多一个工作区切换。点头像换头像(不画编辑小标) */
function Profile() {
  const { state, dispatch } = useStore();
  const { navigate } = useNav();
  const ws = workspaceName(state.workspace);
  return (
    <View style={styles.profile}>
      <Pressable onPress={() => dispatch({ type: "showToast", text: "Opens photo picker" })} accessibilityRole="button" accessibilityLabel="Change photo">
        <Image source={{ uri: USER.avatar }} style={styles.avatar} />
      </Pressable>
      <View style={styles.profileBody}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {USER.name}
          </Text>
          <PlanBadge
            key={state.planUpgrade ? `up-${state.planUpgrade.from}-${state.planUpgrade.to}` : "badge"}
            tier={isEnterprise(state) && state.workspace !== "personal" ? "enterprise" : state.subscription.plan}
            celebrateFrom={state.planUpgrade?.from}
            onCelebrated={() => dispatch({ type: "consumePlanUpgrade" })}
          />
        </View>
        <Text style={styles.email} numberOfLines={1}>
          {USER.email}
        </Text>
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
  );
}

/**
 * 充值动作:Free → Upgrade(付费墙);个人会员 → Buy credits(积分包);
 * 组织 Owner / Admin → Members;组织普通成员没有充值动作(积分由管理员分配)
 */
function useTopUp() {
  const { state, dispatch } = useStore();
  const { navigate } = useNav();
  const personal = state.workspace === "personal";
  const free = personal && !isSubscribed(state) && !isEnterprise(state);
  if (free) return { label: "Upgrade", onPress: () => dispatch({ type: "openPaywall", trigger: "manual" }) };
  if (personal) return { label: "Buy credits", onPress: () => navigate({ type: "sheet", sheet: { name: "topUp" } }) };
  if (canManageMembers(state)) return { label: "Members", onPress: () => navigate({ type: "push", route: { name: "members" } }) };
  return null;
}

/** 续费扣款失败的宽限期(spec §2.5) */
function BillingIssue() {
  const { state, dispatch } = useStore();
  if (state.workspace !== "personal" || !state.subscription.billingRetry) return null;
  return (
    <Pressable onPress={() => dispatch({ type: "showToast", text: "Opens App Store payment settings" })} accessibilityRole="button" style={({ pressed }) => [styles.billing, pressed && styles.faded]}>
      <Icon name="circle-alert" size={18} color={colors.danger} />
      <View style={styles.billingBody}>
        <Text style={styles.billingTitle}>Payment issue</Text>
        <Text style={styles.billingText}>{`We couldn't renew your ${planLabel(state.subscription.plan)} plan. Update your payment method to keep it.`}</Text>
      </View>
      <Icon name="chevron-right" size={16} color={colors.sub} />
    </Pressable>
  );
}

/** 余额不足一条提示 */
function LowCredits() {
  const { state, dispatch } = useStore();
  const { navigate } = useNav();
  const personal = state.workspace === "personal";
  const balance = state.credits[state.workspace];
  if (balance > LOW_CREDITS) return null;
  return (
    <Pressable
      onPress={() => (personal ? (isSubscribed(state) ? navigate({ type: "sheet", sheet: { name: "topUp" } }) : dispatch({ type: "openPaywall", trigger: "low_credits" })) : undefined)}
      accessibilityRole="button"
      style={({ pressed }) => [styles.lowBar, pressed && styles.faded]}
    >
      <Icon name="circle-alert" size={16} color={colors.danger} />
      <Text style={styles.lowText}>{personal ? `Only ${balance} credits left. Top up or upgrade to keep creating.` : "Credits running low. Ask your admin to add more."}</Text>
    </Pressable>
  );
}

/** 充值、邀请两张并排小卡;组织空间邀请那张不出现，充值卡占满一行 */
function ToolBlocks() {
  const { state } = useStore();
  const { navigate } = useNav();
  const topUp = useTopUp();
  const personal = state.workspace === "personal";
  const balance = state.credits[state.workspace];
  const low = balance <= LOW_CREDITS;
  const me = selfMember(state);
  // 组织空间：一张整宽的卡，上半是组织积分，下半是自己本月用量(进度条 + 已用 / 上限 + 还剩多少),不再在卡外放一根细条(2026-10-23)
  if (!personal) {
    const used = me?.used ?? 0;
    const cap = me?.cap ?? 0;
    const ratio = cap ? Math.min(1, used / cap) : 0;
    const near = ratio >= 0.9;
    return (
      <View style={styles.blocks}>
        <Pressable onPress={topUp?.onPress} disabled={!topUp} accessibilityRole="button" accessibilityLabel={`${fmt(balance)} team credits${me ? `. You've used ${fmt(used)} of ${fmt(cap)} this month` : ""}`} style={({ pressed }) => [styles.orgCard, pressed && topUp && styles.faded]}>
          <View style={styles.orgTop}>
            <View style={styles.flex}>
              <View style={styles.tileHead}>
                <Coin size={16} />
                <Text style={styles.tileLabel}>{`${workspaceName(state.workspace)} credits`}</Text>
              </View>
              <CountingNumber value={balance} style={[styles.tileValue, low && styles.danger]} />
            </View>
            {topUp ? (
              <View style={styles.tileAction}>
                <Text style={styles.tileActionText}>{topUp.label}</Text>
                <Icon name="chevron-right" size={13} color={colors.accent} strokeWidth={2.4} />
              </View>
            ) : null}
          </View>
          {me ? (
            <View style={styles.orgUsage}>
              <View style={styles.orgUsageHead}>
                <Text style={styles.orgUsageLabel}>Your usage this month</Text>
                <Text style={styles.orgUsageValue}>
                  <Text style={[styles.orgUsageUsed, near && styles.danger]}>{fmt(used)}</Text>
                  {` / ${fmt(cap)}`}
                </Text>
              </View>
              <View style={styles.orgBar}>
                <View style={[styles.orgBarFill, near && styles.orgBarNear, { width: `${ratio * 100}%` }]} />
              </View>
              <Text style={styles.tileSub}>{`${fmt(Math.max(0, cap - used))} left · Managed by your admin`}</Text>
            </View>
          ) : (
            <Text style={styles.tileSub}>Managed by your admin</Text>
          )}
        </Pressable>
        <LowCredits />
      </View>
    );
  }
  return (
    <View style={styles.blocks}>
      <View style={styles.duo}>
        <Pressable onPress={topUp?.onPress} disabled={!topUp} accessibilityRole="button" accessibilityLabel={`${fmt(balance)} credits${topUp ? `. ${topUp.label}` : ""}`} style={({ pressed }) => [styles.tile2, pressed && topUp && styles.faded]}>
          <View style={styles.tileHead}>
            <Coin size={16} />
            <Text style={styles.tileLabel}>Credits</Text>
          </View>
          <CountingNumber value={balance} style={[styles.tileValue, low && styles.danger]} />
          {topUp ? (
            <View style={styles.tileAction}>
              <Text style={styles.tileActionText}>{topUp.label}</Text>
              <Icon name="chevron-right" size={13} color={colors.accent} strokeWidth={2.4} />
            </View>
          ) : (
            <Text style={styles.tileSub}>Managed by your admin</Text>
          )}
        </Pressable>
        {personal ? (
          <Pressable onPress={() => navigate({ type: "push", route: { name: "inviteFriends" } })} accessibilityRole="button" style={({ pressed }) => [styles.tile2, pressed && styles.faded]}>
            <View style={styles.tileHead}>
              <Icon name="gift" size={16} color={colors.ink} />
              <Text style={styles.tileLabel}>Invite friends</Text>
            </View>
            <Text style={styles.tileValue}>{`+${fmt(INVITE.rewardCredits)}`}</Text>
            <Text style={styles.tileSub}>credits per friend</Text>
          </Pressable>
        ) : null}
      </View>
      <LowCredits />
    </View>
  );
}

/** 素材区(2026-10-23 改):标题 Assets(组织空间下面多一个 My Assets / Team Assets 切换)+ 下划线 tab(All / Images / Videos / Audio,有文档才出 Docs,自己的素材多 Favorites)+ 三列网格;新用户空状态引导去 Agent */
function Works() {
  const { state, dispatch } = useStore();
  const { navigate } = useNav();
  const [tab, setTab] = useState<AssetTab>("all");
  // 组织空间：两个大字标题当切换，没选中的变灰
  const [scope, setScope] = useState<"my" | "team">("my");
  const personal = state.workspace === "personal";
  const mine = assetsFor(state, "my");
  const pool = !personal && scope === "team" ? assetsFor(state, "team") : mine;
  const items = tab === "all" ? pool : tab === "favorites" ? pool.filter((a) => a.favorite) : pool.filter((a) => a.type === tab);
  const tabs = ASSET_TABS.filter((t) => (t.id !== "doc" || pool.some((a) => a.type === "doc")) && (t.id !== "favorites" || scope === "my" || personal));
  const newUser = mine.length === 0;
  return (
    <View style={styles.works}>
      {/* 标题行：左边 Assets;组织空间右边一个小分段控件 Mine | Team(2026-10-23,不占额外一行，选中那段亮一档) */}
      <View style={styles.titleRow}>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          Assets
        </Text>
        {personal ? null : (
          <View style={styles.scope} accessibilityRole="tablist">
            {(
              [
                ["my", "Mine"],
                ["team", "Team"],
              ] as const
            ).map(([id, label]) => {
              const on = scope === id;
              return (
                <Pressable
                  key={id}
                  onPress={() => {
                    setScope(id);
                    setTab("all");
                  }}
                  accessibilityRole="tab"
                  accessibilityLabel={id === "my" ? "My assets" : "Team assets"}
                  accessibilityState={{ selected: on }}
                  style={[styles.scopeSeg, on && styles.scopeSegOn]}
                >
                  <Text style={[styles.scopeText, on && styles.scopeTextOn]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
      {newUser && personal ? null : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabs} accessibilityRole="tablist">
          {tabs.map((t) => {
            const on = tab === t.id;
            return (
              <Pressable key={t.id} onPress={() => setTab(t.id)} accessibilityRole="tab" accessibilityState={{ selected: on }} style={styles.tab}>
                <Text style={[styles.tabText, on && styles.tabTextOn]}>{t.label}</Text>
                {on ? <View style={styles.tabBar} /> : null}
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {items.length > 0 ? (
        <View style={styles.grid}>
          {items.map((item) => (
            <AssetTile key={item.id} item={item} />
          ))}
        </View>
      ) : tab === "all" && newUser && (personal || scope === "my") ? (
        <View style={styles.firstAd}>
          {/* 三张示例成片扇形叠放(2026-10-23 照参考图):中间一张正放、最大，两边各斜一点压在后面 */}
          <View style={styles.fan} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <Image source={{ uri: EXAMPLES[1] }} style={[styles.fanCard, styles.fanLeft]} resizeMode="cover" />
            <Image source={{ uri: EXAMPLES[2] }} style={[styles.fanCard, styles.fanRight]} resizeMode="cover" />
            <Image source={{ uri: EXAMPLES[0] }} style={[styles.fanCard, styles.fanMid]} resizeMode="cover" />
          </View>
          <Text style={styles.emptyTitle}>Make your first ad</Text>
          <Pressable
            onPress={() => {
              dispatch({ type: "selectSession", id: null });
              dispatch({ type: "setComposer", patch: { mode: "agent" } });
              navigate({ type: "tab", tab: "create" });
            }}
            accessibilityRole="button"
            style={({ pressed }) => [styles.emptyBtn, pressed && styles.faded]}
          >
            <Text style={styles.emptyBtnText}>Start creating</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{!personal && scope === "team" && tab === "all" ? "Nothing shared with your team yet." : tab === "favorites" ? "No favorites yet. Long-press any asset to keep it here." : tab === "all" ? "Nothing here yet." : `No ${ASSET_TABS.find((t) => t.id === tab)!.label.toLowerCase()} yet.`}</Text>
        </View>
      )}
    </View>
  );
}

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

/** 新用户空状态里的 3 张示例成片 */
const EXAMPLES = [`${A}/usecase-latte.jpg`, `${A}/usecase-florist.jpg`, `${A}/usecase-lipstick.jpg`];

const styles = StyleSheet.create({
  page: { flex: 1 },
  backdrop: { position: "absolute", left: 0, right: 0, top: 0, overflow: "hidden" },
  backdropFade: { position: "absolute", left: 0, right: 0, bottom: 0, height: 200 },
  root: { flex: 1 },
  content: { paddingHorizontal: space.lg, paddingBottom: space.xl, gap: space.lg },
  flex: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center" },
  faded: { opacity: 0.5 },
  danger: { color: colors.danger },
  topBar: { flexDirection: "row", justifyContent: "flex-end", paddingRight: space.xs, paddingBottom: 2 },

  // 个人信息
  profile: { flexDirection: "row", alignItems: "center", gap: space.md },
  avatar: { width: 52, height: 52, borderRadius: radius.full, backgroundColor: colors.grouped },
  profileBody: { flex: 1, gap: 2 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: space.sm },
  name: { ...type.title3, fontWeight: "700", color: colors.ink, flexShrink: 1 },
  email: { ...type.footnote, color: colors.sub },
  workspace: { flexDirection: "row", alignItems: "center", gap: space.xs, alignSelf: "flex-start", marginTop: space.xs },
  workspaceText: { ...type.footnote, fontWeight: "500", color: colors.ink },

  // 提示
  billing: { flexDirection: "row", alignItems: "center", gap: space.md, padding: space.lg, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: "rgba(197,40,47,0.25)" },
  billingBody: { flex: 1, gap: 2 },
  billingTitle: { ...type.headline, color: colors.ink },
  billingText: { ...type.subhead, color: colors.sub },
  lowBar: { flexDirection: "row", alignItems: "center", gap: space.sm, padding: space.md, borderRadius: radius.md, backgroundColor: "rgba(255,90,95,0.1)" },
  lowText: { flex: 1, ...type.footnote, color: colors.ink },
  blocks: { gap: space.md },

  // 组织空间的整宽积分卡
  orgCard: { padding: space.md, gap: space.md, borderRadius: radius.control, backgroundColor: colors.grouped, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.edge, ...smoothCorners },
  orgTop: { flexDirection: "row", alignItems: "flex-start", gap: space.sm },
  orgUsage: { gap: 8, paddingTop: space.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator },
  orgUsageHead: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  orgUsageLabel: { ...type.footnote, fontWeight: "600", color: colors.sub },
  orgUsageValue: { ...type.footnote, color: colors.sub, fontVariant: ["tabular-nums"] },
  orgUsageUsed: { ...type.subhead, fontWeight: "700", color: colors.ink },
  orgBar: { height: 6, borderRadius: radius.full, backgroundColor: fill.base, overflow: "hidden" },
  orgBarFill: { height: 6, borderRadius: radius.full, backgroundColor: colors.ink },
  orgBarNear: { backgroundColor: colors.danger },
  // 两张并排小卡
  duo: { flexDirection: "row", gap: space.sm },
  tile2: { flex: 1, padding: space.md, borderRadius: radius.control, backgroundColor: colors.grouped, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.edge, gap: 6, ...smoothCorners },
  tileHead: { flexDirection: "row", alignItems: "center", gap: 6 },
  tileLabel: { ...type.footnote, fontWeight: "600", color: colors.sub },
  tileValue: { ...type.title3, fontWeight: "700", color: colors.ink, fontVariant: ["tabular-nums"] },
  tileSub: { ...type.footnote, color: colors.sub },
  tileAction: { flexDirection: "row", alignItems: "center", gap: 2 },
  tileActionText: { ...type.footnote, fontWeight: "700", color: colors.accent },

  // 作品区
  works: { gap: space.md },
  // 标题行 + 组织空间的 Mine | Team 小分段控件
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: -space.xs },
  scope: { flexDirection: "row", padding: 2, borderRadius: radius.full, backgroundColor: colors.grouped },
  scopeSeg: { height: 28, minWidth: 56, paddingHorizontal: space.md, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  scopeSegOn: { backgroundColor: colors.raised },
  scopeText: { ...type.footnote, fontWeight: "600", color: colors.sub },
  scopeTextOn: { color: colors.ink },
  sectionTitle: { ...type.title3, fontWeight: "700", color: colors.ink },
  // 类型 tab:靠左排，下划线;整排底部一道细线
  tabsScroll: { flexGrow: 0, marginHorizontal: -space.lg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator },
  tabs: { gap: space.xl, paddingHorizontal: space.lg },
  tab: { alignItems: "center", paddingVertical: 10 },
  tabText: { ...type.subhead, fontWeight: "500", color: colors.sub },
  tabTextOn: { color: colors.ink, fontWeight: "700" },
  tabBar: { position: "absolute", bottom: 0, left: 0, right: 0, height: 2, borderRadius: radius.xs, backgroundColor: colors.ink } as object,
  // 3 列网格:格子自带 1px 内边距,拼出 2px 间距
  grid: { flexDirection: "row", flexWrap: "wrap", margin: -GAP / 2 },
  cell: { width: "33.3333%", aspectRatio: 3 / 4, padding: GAP / 2 },
  tile: { flex: 1, borderRadius: radius.xs, overflow: "hidden", backgroundColor: colors.grouped },
  veil: { backgroundColor: "rgba(0,0,0,0.4)" },
  failedVeil: { backgroundColor: "rgba(15,15,19,0.45)" },
  failedBadge: { position: "absolute", left: 6, bottom: 6, flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, height: 18, borderRadius: radius.xs, backgroundColor: colors.dangerFill, justifyContent: "center" },
  badgeText: { ...type.caption, color: colors.white },
  cornerScrim: { position: "absolute", left: 0, right: 0, bottom: 0, height: 40 },
  // 视频角标:压图半透明圆,保证亮图上也看得见
  cornerTR: { position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: radius.full, backgroundColor: colors.onImage, alignItems: "center", justifyContent: "center" },
  cornerTL: { position: "absolute", top: 6, left: 6, width: 22, height: 22, borderRadius: radius.full, backgroundColor: colors.onImage, alignItems: "center", justifyContent: "center" },
  author: { ...type.caption, position: "absolute", left: 6, right: 6, bottom: 6, color: colors.white },
  firstAd: { alignItems: "center", gap: space.sm, paddingTop: space.xl, paddingBottom: space.xxl },
  // 整体缩小(2026-10-23):不要太大，空状态只是一个引导
  fan: { width: 210, height: 136, alignItems: "center", justifyContent: "center", marginBottom: space.xs },
  fanCard: { position: "absolute", width: 72, height: 98, borderRadius: radius.md, backgroundColor: colors.grouped, ...smoothCorners },
  fanMid: { width: 90, height: 122, boxShadow: "0px 8px 20px rgba(0,0,0,0.55)" } as object,
  fanLeft: { left: 22, top: 22, transform: [{ rotate: "-14deg" }] },
  fanRight: { right: 22, top: 22, transform: [{ rotate: "14deg" }] },
  empty: { alignItems: "center", gap: space.sm, paddingVertical: space.xxl },
  emptyTitle: { ...type.headline, color: colors.ink },
  emptyText: { ...type.subhead, color: colors.sub, textAlign: "center" },
  // 空状态按钮用白色反相键：橙色留给充值
  // 小胶囊按钮(不占满一行);白底黑字，橙色留给充值
  emptyBtn: { height: 38, paddingHorizontal: space.lg, borderRadius: radius.full, backgroundColor: colors.inverse, alignItems: "center", justifyContent: "center" },
  emptyBtnText: { ...type.subhead, fontWeight: "700", color: colors.onInverse },
});
