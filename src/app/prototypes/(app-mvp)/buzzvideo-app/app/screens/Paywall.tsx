import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Gradient from "../components/Gradient";
import IapConfirm from "../components/IapConfirm";
import PriceError from "../components/PriceError";
import Icon from "../components/Icon";
import IconButton from "../components/IconButton";
import { prefersReducedMotion } from "../components/motion";
import PrimaryButton from "../components/PrimaryButton";
import WebLink from "../components/WebLink";
import { SUBSCRIPTION_PLANS, ULTRA_TIERS, formatDay, planById, planLabel, savePct, ultraTier, type Billing, type PaidPlanId, type UltraMultiplier } from "../data";
import { useInsets, useNav, useStore } from "../provider";
import { choiceLabel, exitOfferLive, isEnterprise, isSubscribed, planCredits, pricesUnavailable, promoBonus, withBonus, type PaywallTrigger } from "../store";
import { EXIT_OFFER } from "../data";
import { countdown, useNow } from "../components/useNow";
import { colors, ctaGradient, radius, smoothCorners, space, type } from "../theme";

/** ✕ 淡入前的等待(spec §3.1):先让用户看到成片和套餐 */
export const CLOSE_DELAY_MS = 3000;
const fmt = (n: number) => n.toLocaleString("en-US");
/** 和网页版一致：一张 GPT Image 2 图约 3 积分(1,900 积分 ≈ 633 张) */
const GPT_IMAGE_2_CREDITS = 3;
/**
 * 下半屏购买面板用浅色(2026-10-19 定):整个 APP 是深色，付费墙下半屏换成白底，
 * 价格和购买按钮更醒目，也更像 App Store 的购买面板。只在这块面板里用这套浅色
 */
const L = { bg: "#ffffff", grouped: "#f2f2f6", ink: "#16161d", sub: "#5f6070", faint: "#a0a1ae", separator: "#e3e3e8" };
/** 被动触发时面板顶部的一句说明;首登、每日、运营、手动打开不写 */
const TRIGGER_LINE: Partial<Record<PaywallTrigger, string>> = {
  video_locked: "Video ads come with a plan. Your draft is saved.",
  model_locked: "This model needs Pro. Your draft is saved.",
  low_credits: "You're out of credits. Your draft is saved.",
  parallel_limit: "Run more ads at the same time with a plan.",
};

/**
 * 付费墙(spec §3):即梦式顶部 tab 切换三档,整屏品牌渐变底(2026-10-20),上半屏是积分 + 产出换算 + 权益,
 * 下半屏白色面板放年付 / 月付两行和主按钮。每个 tab 默认年付;✕ 3 秒后淡入(拿不到价格时立即出现),关掉时 Free 用户首次弹挽留。
 * 被动触发(想生成视频、模型锁定、积分不足、同时生成数到上限)时，面板顶部一句话说明为什么弹、草稿还在(2026-10-19)。
 */
export default function Paywall({ trigger, tab: initialTab, confirm = false }: { trigger: PaywallTrigger; tab: PaidPlanId; confirm?: boolean }) {
  const { state, dispatch } = useStore();
  const { navigate } = useNav();
  const insets = useInsets();
  const sub = state.subscription;
  const appMember = sub.source === "app" && sub.plan !== "free";
  /** 每个 tab 默认年付;APP 会员看自己当前档时默认选中自己的周期 */
  const defaultPeriod = (id: PaidPlanId): Billing => (appMember && id === sub.plan && sub.period ? sub.period : "yearly");
  const [tab, setTab] = useState<PaidPlanId>(initialTab);
  const [period, setPeriod] = useState<Billing>(defaultPeriod(initialTab));
  /** Ultra 的积分倍数(官网 Ultra 卡片上的滑块);Ultra 会员默认停在自己的倍数 */
  const [mult, setMult] = useState<UltraMultiplier>(sub.plan === "ultra" ? (sub.multiplier ?? 1) : 1);
  const [confirming, setConfirming] = useState(confirm);

  const closeOpacity = useRef(new Animated.Value(0)).current;
  const [closable, setClosable] = useState(false);
  // 拿不到价格时什么都买不了：✕ 立即出现，不让用户被卡住
  const noPrices = pricesUnavailable(state);
  useEffect(() => {
    const t = setTimeout(() => {
      setClosable(true);
      if (prefersReducedMotion()) closeOpacity.setValue(1);
      else Animated.timing(closeOpacity, { toValue: 1, duration: 240, useNativeDriver: false }).start();
    }, noPrices ? 0 : CLOSE_DELAY_MS);
    return () => clearTimeout(t);
  }, [closeOpacity, noPrices]);


  const { plan: current, source } = state.subscription;
  const p = planById(tab);
  // 这一档实际卖的东西:Ultra 按所选倍数,其他档就是套餐本身
  const tier = tab === "ultra" ? ultraTier(mult) : null;
  const offer = tier ?? { credits: p.credits, monthly: p.monthly, yearly: p.yearly, videos: p.videos, offMonthly: 0, offYearly: savePct(p.yearly, p.monthly * 12) };
  const bonus = promoBonus(state);
  // 大字是套餐每月积分;活动加赠只在第一次付款时给一次,单独一行写清楚(避免误以为每月都有)
  const credits = offer.credits;
  const bonusCredits = withBonus(state, offer.credits) - offer.credits;
  // 换算跟着加赠走:积分多了,能做的条数也多
  const videos = offer.videos;
  const price = period === "yearly" ? `$${fmt(offer.yearly)}/year` : `$${offer.monthly}/month`;
  /** Ultra 2× / 4× 的原价(89 × 倍数),月付行划线展示 */
  const listMonthly = tier && tier.multiplier > 1 ? p.monthly * tier.multiplier : null;
  // APP 会员换方案:比当前档(含倍数)积分多 = 升级,立即生效;否则(降级 / 换周期)下个续费日生效
  const onCurrentPlan = appMember && tab === current && (tab !== "ultra" || mult === (sub.multiplier ?? 1));
  const isSamePlanAndPeriod = onCurrentPlan && period === sub.period;
  const upgrading = appMember && !onCurrentPlan && planCredits(tab, tab === "ultra" ? mult : undefined) > planCredits(current as PaidPlanId, sub.multiplier);
  const switching = appMember && !upgrading && !isSamePlanAndPeriod;
  // 已取消自动续费:当前方案下可以 Resubscribe(恢复自动续费,不重复扣费)
  const resubscribing = isSamePlanAndPeriod && !!sub.cancelled;
  // 有待生效的降级 / 换周期:当前方案上可以撤销(Keep …),不扣费
  const keeping = isSamePlanAndPeriod && !sub.cancelled && !!sub.pendingChange;
  // 挽留优惠 24 小时内:Starter 月付行直接显示优惠价,可以在付费墙上买
  const now = useNow();
  const exitLive = tab === "starter" && exitOfferLive(state, now);
  const exitPrice = `$${EXIT_OFFER.firstMonth.toFixed(2)}`;
  const renewOn = sub.renewDay !== undefined ? formatDay(sub.renewDay) : "your next renewal";

  // 每个 tab 默认年付:切档时重置周期
  const pick = (id: PaidPlanId) => {
    setTab(id);
    setPeriod(defaultPeriod(id));
  };
  const close = () => {
    navigate({ type: "pop" });
    dispatch({ type: "closePaywall", now: Date.now() });
  };
  const toast = (text: string) => dispatch({ type: "showToast", text });
  /** 挽留优惠价:Starter 月付 + 优惠还在有效期 */
  const buyingExitOffer = exitLive && period === "monthly";
  const buy = () => {
    setConfirming(false);
    if (buyingExitOffer) dispatch({ type: "acceptExitOffer", now: Date.now() });
    else dispatch({ type: "purchasePlan", plan: tab, period, ...(tab === "ultra" ? { multiplier: mult } : {}) });
    // 内购失败:留在付费墙上可以再试;成功或等家长批准:关闭
    if (state.storekit.purchase !== "failed") navigate({ type: "pop" });
  };

  return (
    <View style={styles.root}>
      {/* 品牌渐变满版(2026-10-20 从 4 个方案里定了 A,替换原来的天空图):CTA 渐变反向，和挽留页同一张底;
          压一层暗色，白字在橙色上才够对比 */}
      <Gradient colors={[ctaGradient[1], ctaGradient[0]]} angle={200} style={styles.backdrop} pointerEvents="none" />
      <View style={[styles.backdrop, { backgroundColor: "rgba(60,10,0,0.18)" }]} pointerEvents="none" />

      <View style={[styles.top, { paddingTop: insets.top }]}>
        <View style={styles.bar}>
          <Animated.View style={{ opacity: closeOpacity, pointerEvents: closable ? "auto" : "none" }}>
            <IconButton icon="x" tone="onImage" onPress={close} accessibilityLabel="Close" />
          </Animated.View>
          <Pressable onPress={() => dispatch({ type: "restorePurchases" })} accessibilityRole="button" hitSlop={12}>
            <Text style={styles.restore}>Restore</Text>
          </Pressable>
        </View>

        <View style={styles.tabs} accessibilityRole="tablist">
          {SUBSCRIPTION_PLANS.map((x) => {
            const on = x.id === tab;
            return (
              <Pressable
                key={x.id}
                onPress={() => pick(x.id)}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                hitSlop={{ top: 2, bottom: 2 }}
                style={[styles.tab, on && styles.tabOn]}
              >
                <Text style={[styles.tabText, on && styles.tabTextOn]}>{x.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.hero}>
          <View style={styles.creditBlock}>
            <Text style={[styles.credits]} accessibilityRole="header">
              {fmt(credits)}
              <Text style={[styles.creditsUnit]}> credits/mo</Text>
            </Text>
            {/* 活动加赠:只这一行说明(+N% 与一次性),不再在上方叠角标,避免压到 tab */}
            {/* 挽留价和活动加赠不同享(2026-10-15 定):选中挽留价时不显示加赠 */}
            {bonusCredits > 0 && !buyingExitOffer ? (
              <Text style={[styles.bonusLine]}>{`+${fmt(bonusCredits)} bonus credits (${bonus}% extra) with your first payment`}</Text>
            ) : null}
            {/* 产出换算和网页版同一写法(2026-10-19):两行小字，图片按 GPT Image 2 每张 3 积分算 */}
            <View style={styles.outcomes}>
              <Text style={styles.outcome}>{`≈ ${fmt(Math.floor(credits / GPT_IMAGE_2_CREDITS))} GPT Image 2 images`}</Text>
              <Text style={styles.outcome}>{`≈ ${videos} Seedance 2.0 videos (HD · 10s video)`}</Text>
            </View>
          </View>
          {/* 9 条权益保持舒服的行距;放不下时(Ultra 多一条倍数滑块、小屏)在上半屏里滑动，不挤压行距 */}
          <ScrollView style={styles.perksScroll} contentContainerStyle={styles.perks} showsVerticalScrollIndicator={false}>
            {p.perks.map((perk) => (
              <View key={perk} style={styles.perk}>
                <View style={styles.perkIcon}>
                  <Icon name="check" size={14} color={colors.white} strokeWidth={2.4} />
                </View>
                <Text style={styles.perkText}>{perk}</Text>
              </View>
            ))}
          </ScrollView>
          {/* 底部换算说明那行去掉(2026-10-19):上面两行已写明按 HD 10 秒视频算 */}
        </View>
      </View>

      {/* 下半屏:白色面板 */}
      <View style={[styles.panel, { paddingBottom: insets.bottom + space.md }]}>
        {/* Enterprise 用户:说明这里买的是个人套餐,公司的组织空间不受影响(和订阅管理页一致) */}
        {isEnterprise(state) && source !== "web" && !isSubscribed(state) ? (
          <Text style={styles.personalNote}>For your personal workspace. Your company already covers PressLogic.</Text>
        ) : null}
        {/* 被动触发:说明为什么弹出来、草稿还在 */}
        {TRIGGER_LINE[trigger] && !onCurrentPlan && source !== "web" ? <Text style={styles.why}>{TRIGGER_LINE[trigger]}</Text> : null}
        {source === "web" ? (
          <View style={styles.status}>
            <Text style={styles.statusTitle}>{`Subscribed on the web · ${planLabel(current)}`}</Text>
            <Text style={styles.statusText}>Manage your plan at buzzvideo.ai</Text>
          </View>
        ) : null}
        {/* APP 会员看自己的当前方案:状态 + 订阅管理入口(取消只在订阅管理页) */}
        {onCurrentPlan ? (
          <View style={styles.status}>
            <Text style={styles.statusTitle}>{`You're on ${planLabel(current)}${sub.multiplier && sub.multiplier > 1 ? ` ${sub.multiplier}×` : ""} · ${sub.period === "monthly" ? "Monthly" : "Yearly"}`}</Text>
            <Text style={styles.statusText}>
              {sub.pendingChange
                ? `Changes to ${choiceLabel(sub.pendingChange)} on ${renewOn}`
                : sub.cancelled
                  ? `Ends on ${renewOn}`
                  : `Renews on ${renewOn}`}
            </Text>
            <Pressable onPress={() => navigate({ type: "push", route: { name: "subscription" } })} accessibilityRole="link" hitSlop={8}>
              <Text style={styles.manage}>Manage subscription ›</Text>
            </Pressable>
          </View>
        ) : null}
        {source === "web" ? null : pricesUnavailable(state) ? (
          <PriceError light />
        ) : (
          <>
            {tab === "ultra" ? <VolumeSlider value={mult} onChange={setMult} period={period} /> : null}
            <View style={styles.options} accessibilityRole="radiogroup">
              <Option
                selected={period === "yearly"}
                onPress={() => setPeriod("yearly")}
                label="Yearly"
                detail={`$${Math.round(offer.yearly / 12)}/mo · billed once a year`}
                price={`$${fmt(offer.yearly)}`}
                per="/yr"
                badge={`Save ${offer.offYearly}%`}
              />
              <Option
                selected={period === "monthly"}
                onPress={() => setPeriod("monthly")}
                label="Monthly"
                detail={
                  exitLive
                    ? `First month, then $${offer.monthly}/mo · ends in ${countdown(state.exitOfferExpiresAt - now)}`
                    : listMonthly
                      ? `$${listMonthly} → $${offer.monthly} every month`
                      : "Billed every month"
                }
                price={exitLive ? exitPrice : `$${offer.monthly}`}
                per="/mo"
                badge={exitLive ? "50% off" : offer.offMonthly ? `Save ${offer.offMonthly}%` : undefined}
              />
            </View>
            {isSamePlanAndPeriod && !resubscribing && !keeping ? null : (
              <PrimaryButton
                label={
                  buyingExitOffer
                    ? `Get 50% off · ${exitPrice} first month`
                    : resubscribing
                    ? "Resubscribe"
                    : keeping
                    ? `Keep ${p.label}`
                    : // 新订阅写 Continue(2026-10-19 定，APP 付费墙常见写法);价格已在上面的年付 / 月付行，按钮不再重复
                      upgrading
                      ? `Upgrade to ${p.label}`
                      : switching
                        ? `Switch to ${onCurrentPlan ? (period === "yearly" ? "Yearly" : "Monthly") : p.label}`
                        : "Continue"
                }
                onPress={() => setConfirming(true)}
              />
            )}
            {switching ? (
              <Text style={styles.changeNote}>{`Takes effect on ${renewOn}. You keep ${planLabel(current)} until then.`}</Text>
            ) : upgrading ? (
              <Text style={styles.changeNote}>Starts now. Apple refunds the unused part of your current plan.</Text>
            ) : appMember ? null : (
              <WebLink label="Or subscribe on buzzvideo.ai" tone="onLight" />
            )}
          </>
        )}
        {/* 自动续费说明这段去掉(2026-10-19 定):扣款与续费由 App Store 确认弹窗说明;Terms / Privacy 链接是审核必需，保留 */}
        <View style={styles.links}>
          <Pressable onPress={() => toast("Opens Terms of Service")} accessibilityRole="link" hitSlop={13}>
            <Text style={styles.link}>Terms</Text>
          </Pressable>
          <Text style={styles.dot}>·</Text>
          <Pressable onPress={() => toast("Opens Privacy Policy")} accessibilityRole="link" hitSlop={13}>
            <Text style={styles.link}>Privacy</Text>
          </Pressable>
        </View>
      </View>

      {confirming ? (
        <IapConfirm
          product={
            buyingExitOffer
              ? "BuzzVideo Starter (Monthly)"
              : `BuzzVideo ${p.label}${tier && tier.multiplier > 1 ? ` ${tier.multiplier}×` : ""} (${period === "yearly" ? "Yearly" : "Monthly"})`
          }
          badge={`${(buyingExitOffer ? "Starter" : p.label).toUpperCase()} ${buyingExitOffer || period === "monthly" ? "1M" : "1Y"}`}
          price={buyingExitOffer ? `${exitPrice} for 1 month, then $${EXIT_OFFER.then}/month` : price}
          terms={resubscribing || keeping ? `No charge today. Renews on ${renewOn} at ${price}. Cancel anytime in Settings > Apple Account.` : undefined}
          onCancel={() => setConfirming(false)}
          onConfirm={buy}
        />
      ) : null}
    </View>
  );
}

/**
 * Ultra 积分倍数(对应官网 Ultra 卡片的滑块):三档刻度 1× / 2× / 4×,点刻度切换。
 * 刻度上方是该档相对原价的折扣,下方是每月积分
 */
function VolumeSlider({ value, onChange, period }: { value: UltraMultiplier; onChange: (m: UltraMultiplier) => void; period: Billing }) {
  const idx = ULTRA_TIERS.findIndex((t) => t.multiplier === value);
  return (
    <View style={styles.volume}>
      <View style={styles.track} accessibilityRole="adjustable" accessibilityLabel={`Ultra ${value}×`}>
        <View style={styles.trackLine} />
        <View style={[styles.trackFill, { width: `${(idx / (ULTRA_TIERS.length - 1)) * 100}%` }]} />
        {ULTRA_TIERS.map((t, i) => {
          const on = t.multiplier === value;
          const off = period === "yearly" ? t.offYearly : t.offMonthly;
          return (
            <Pressable
              key={t.multiplier}
              onPress={() => onChange(t.multiplier)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${t.multiplier}×, ${fmt(t.credits)} credits per month`}
              hitSlop={10}
              style={[styles.stop, { left: `${(i / (ULTRA_TIERS.length - 1)) * 100}%` }]}
            >
              <Text style={[styles.stopOff, (t.multiplier === 1 || !off) && styles.hidden]}>{`${off}% off`}</Text>
              <View style={[styles.knob, i <= idx && styles.knobFilled, on && styles.knobOn]} />
              <Text style={[styles.stopLabel, on && styles.stopLabelOn]}>{`${t.multiplier}× · ${fmt(t.credits)}`}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Option({
  selected,
  onPress,
  label,
  detail,
  price,
  per,
  badge,
}: {
  selected: boolean;
  onPress: () => void;
  label: string;
  detail: string;
  /** 实际扣款金额(审核 3.1.2:最醒目的必须是实际扣款) */
  price: string;
  per: "/mo" | "/yr";
  badge?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${label}, ${price} ${per === "/yr" ? "per year" : "per month"}, ${detail}`}
      style={[styles.option, selected && styles.optionOn]}
    >
      <View style={styles.optionText}>
        <View style={styles.optionHead}>
          <Text style={styles.optionLabel}>{label}</Text>
          {badge ? <Text style={styles.save}>{badge}</Text> : null}
        </View>
        <Text style={styles.optionDetail}>{detail}</Text>
      </View>
      <Text style={styles.optionPrice}>
        {price}
        <Text style={styles.optionPer}>{per}</Text>
      </Text>
    </Pressable>
  );
}

const ON_BRAND_SUB = "rgba(255,255,255,0.85)";

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0a10" },
  backdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  top: { flex: 1, paddingHorizontal: space.lg },
  bar: { height: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginLeft: -space.sm },
  restore: { ...type.subhead, color: colors.white, fontWeight: "500" },

  tabs: { flexDirection: "row", gap: space.xs, marginTop: space.sm },
  tab: { flex: 1, height: 40, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  // 品牌色底上：选中 tab 是白色胶囊 + 品牌橙字，未选中白字(橙底上 62% 白不够对比)
  tabOn: { backgroundColor: colors.white },
  tabText: { ...type.subhead, fontWeight: "500", color: "rgba(255,255,255,0.85)" },
  tabTextOn: { color: "#e8430c", fontWeight: "700" },

  // 云朵 B 去掉后，积分和权益从 tab 下方固定距离开始(2026-10-19):三个 tab 起点一致，
  // 不随下方面板高度变化(Ultra 多一条倍数滑块，面板更高)
  hero: { flex: 1, justifyContent: "flex-start", paddingTop: space.sm, gap: space.sm },
  // 品牌色底上浅橙字看不见，用白色粗体
  bonusLine: { ...type.subhead, fontWeight: "700", color: colors.white, marginTop: -space.xs },
  creditBlock: { gap: space.sm },
  credits: { fontSize: 40, lineHeight: 44, fontWeight: "700", letterSpacing: -0.8, color: colors.white },
  creditsUnit: { ...type.headline, fontWeight: "500", color: ON_BRAND_SUB },
  outcomes: { gap: 2, marginTop: -space.xs },
  outcome: { ...type.footnote, color: "rgba(255,255,255,0.9)" },
  // 和上面的产出换算拉开一段距离，分出两组
  perksScroll: { flex: 1, marginTop: space.lg },
  perks: { gap: 8, paddingBottom: space.lg },
  perk: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  // 勾和第一行文字对齐(文字行高 18、勾 14)
  perkIcon: { paddingTop: 2 },
  perkText: { flex: 1, ...type.footnote, lineHeight: 18, color: colors.white },

  panel: {
    backgroundColor: L.bg,
    borderTopLeftRadius: radius.hero,
    borderTopRightRadius: radius.hero,
    ...smoothCorners,
    paddingHorizontal: space.lg,
    paddingTop: space.xl,
    gap: space.md,
  },
  options: { gap: space.sm },
  volume: { marginTop: -space.xs },
  // 刻度轨道:左右各留 28 给首尾刻度的文字;紧凑排版,不把上半屏挤没
  track: { height: 50, marginHorizontal: 28, justifyContent: "center" },
  trackLine: { position: "absolute", left: 0, right: 0, height: 4, borderRadius: 2, backgroundColor: L.grouped },
  trackFill: { position: "absolute", left: 0, height: 4, borderRadius: 2, backgroundColor: colors.accent },
  stop: { position: "absolute", width: 96, marginLeft: -48, alignItems: "center", gap: 3 },
  stopOff: { ...type.caption, color: colors.accent },
  hidden: { opacity: 0 },
  knob: { width: 14, height: 14, borderRadius: 7, backgroundColor: L.bg, borderWidth: 2, borderColor: L.separator },
  knobFilled: { borderColor: colors.accent },
  knobOn: { width: 22, height: 22, borderRadius: 11, borderWidth: 6, borderColor: colors.accent, marginVertical: -4 },
  stopLabel: { ...type.footnote, color: L.sub },
  stopLabelOn: { color: L.ink, fontWeight: "600" },
  option: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 64,
    paddingHorizontal: space.lg,
    borderRadius: radius.lg,
    ...smoothCorners,
    backgroundColor: L.grouped,
    borderWidth: 2,
    borderColor: "transparent",
  },
  optionOn: { backgroundColor: L.bg, borderColor: L.ink },
  optionText: { flex: 1, gap: 2 },
  optionHead: { flexDirection: "row", alignItems: "center", gap: space.sm },
  optionLabel: { ...type.headline, color: L.ink },
  // 折扣做成实心标签(参照截图「5.6折」):品牌橙底 + 白色粗体;整体高度 16,比旁边的「Yearly」小
  save: { fontSize: 11, lineHeight: 14, fontWeight: "700", color: colors.white, backgroundColor: colors.accent, borderRadius: 6, overflow: "hidden", paddingHorizontal: 6, paddingVertical: 1 },
  optionDetail: { ...type.footnote, color: L.sub },
  optionPrice: { ...type.title2, color: L.ink },
  optionPer: { ...type.footnote, color: L.sub, fontWeight: "400" },

  status: { backgroundColor: L.grouped, borderRadius: radius.md, padding: space.lg, gap: 2 },
  statusTitle: { ...type.headline, color: L.ink },
  statusText: { ...type.subhead, color: L.sub },
  personalNote: { ...type.footnote, color: L.sub, textAlign: "center" },
  why: { ...type.subhead, fontWeight: "600", color: L.ink, textAlign: "center" },
  manage: { ...type.subhead, fontWeight: "600", color: L.ink, marginTop: space.xs },
  changeNote: { ...type.footnote, color: L.sub, textAlign: "center", marginTop: -space.xs },

  links: { flexDirection: "row", justifyContent: "center", gap: space.sm },
  link: { ...type.footnote, color: L.sub, textDecorationLine: "underline" },
  dot: { ...type.footnote, color: L.faint },
});
