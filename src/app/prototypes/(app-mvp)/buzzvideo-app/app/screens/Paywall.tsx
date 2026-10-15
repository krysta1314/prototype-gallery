import { useEffect, useRef, useState } from "react";
import { Animated, Image, Pressable, StyleSheet, Text, View } from "react-native";
import Gradient from "../components/Gradient";
import IapConfirm from "../components/IapConfirm";
import PriceError from "../components/PriceError";
import Icon from "../components/Icon";
import IconButton from "../components/IconButton";
import { prefersReducedMotion } from "../components/motion";
import PrimaryButton from "../components/PrimaryButton";
import WebLink from "../components/WebLink";
import { SUBSCRIPTION_PLANS, ULTRA_TIERS, formatDay, planById, planLabel, ultraTier, type Billing, type PaidPlanId, type UltraMultiplier } from "../data";
import { useInsets, useNav, useStore } from "../provider";
import { choiceLabel, exitOfferLive, isEnterprise, isSubscribed, planCredits, pricesUnavailable, promoBonus, withBonus, type PaywallTrigger } from "../store";
import { EXIT_OFFER } from "../data";
import { countdown, useNow } from "../components/useNow";
import { colors, radius, smoothCorners, space, type } from "../theme";

/** ✕ 淡入前的等待(spec §3.1):先让用户看到成片和套餐 */
export const CLOSE_DELAY_MS = 3000;
const fmt = (n: number) => n.toLocaleString("en-US");
const LEGAL = "Payment is charged to your Apple ID at confirmation. Renews automatically until canceled. Cancel anytime in your App Store settings.";

/**
 * 付费墙(spec §3):即梦式顶部 tab 切换三档,上半屏是该档的氛围图 + 积分 + 产出换算 + 权益,
 * 下半屏白色面板放年付 / 月付两行和主按钮。每个 tab 默认年付;✕ 3 秒后淡入,关掉时 Free 用户首次弹挽留。
 * trigger 只用于埋点(paywall_view.trigger),界面不区分来源。
 */
export default function Paywall({ tab: initialTab }: { trigger: PaywallTrigger; tab: PaidPlanId }) {
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
  const [confirming, setConfirming] = useState(false);

  const closeOpacity = useRef(new Animated.Value(0)).current;
  const [closable, setClosable] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => {
      setClosable(true);
      if (prefersReducedMotion()) closeOpacity.setValue(1);
      else Animated.timing(closeOpacity, { toValue: 1, duration: 240, useNativeDriver: false }).start();
    }, CLOSE_DELAY_MS);
    return () => clearTimeout(t);
  }, [closeOpacity]);


  const { plan: current, source } = state.subscription;
  const p = planById(tab);
  // 这一档实际卖的东西:Ultra 按所选倍数,其他档就是套餐本身
  const tier = tab === "ultra" ? ultraTier(mult) : null;
  const offer = tier ?? { credits: p.credits, monthly: p.monthly, yearly: p.yearly, videos: p.videos, offMonthly: 0, offYearly: 30 };
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
      {/* 上半屏:该档氛围图,切 tab 整屏换图 */}
      <Image key={p.mood} source={{ uri: p.mood }} style={styles.mood} resizeMode="cover" accessibilityIgnoresInvertColors />
      <Gradient colors={["rgba(10,10,16,0.35)", "rgba(10,10,16,0)", "rgba(10,10,16,0.55)"]} style={styles.moodScrim} pointerEvents="none" />

      <View style={[styles.top, { paddingTop: insets.top }]}>
        <View style={styles.bar}>
          <Animated.View style={{ opacity: closeOpacity, pointerEvents: closable ? "auto" : "none" }}>
            <IconButton icon="x" tone="onImage" onPress={close} accessibilityLabel="Close" />
          </Animated.View>
          <Pressable onPress={() => dispatch({ type: "restorePurchases" })} accessibilityRole="button" hitSlop={8}>
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
                style={[styles.tab, on && styles.tabOn]}
              >
                <Text style={[styles.tabText, on && styles.tabTextOn]}>{x.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.hero}>
          <Text style={styles.credits} accessibilityRole="header">
            {fmt(credits)}
            <Text style={styles.creditsUnit}> credits/mo</Text>
          </Text>
          {/* 活动加赠:只这一行说明(+N% 与一次性),不再在上方叠角标,避免压到 tab */}
          {/* 挽留价和活动加赠不同享(2026-10-15 定):选中挽留价时不显示加赠 */}
          {bonusCredits > 0 && !buyingExitOffer ? <Text style={styles.bonusLine}>{`+${fmt(bonusCredits)} bonus credits (${bonus}% extra) with your first payment`}</Text> : null}
          <Text style={styles.outcome}>{`Enough for about ${videos} HD video ads a month`}</Text>
          <View style={styles.perks}>
            {p.perks.map((perk) => (
              <View key={perk} style={styles.perk}>
                <Icon name="check" size={16} color={colors.white} strokeWidth={2.25} />
                <Text style={styles.perkText}>{perk}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.footnote}>
            {tab === "starter"
              ? "Estimated with 10s HD Seedance 2.0 videos. Starter uses Seedance 2.0 Fast / Mini, which cost fewer credits."
              : "Based on 10s HD Seedance 2.0 videos. Actual usage varies."}
          </Text>
        </View>
      </View>

      {/* 下半屏:白色面板 */}
      <View style={[styles.panel, { paddingBottom: insets.bottom + space.md }]}>
        {/* Enterprise 用户:说明这里买的是个人套餐,公司的组织空间不受影响(和订阅管理页一致) */}
        {isEnterprise(state) && source !== "web" && !isSubscribed(state) ? (
          <Text style={styles.personalNote}>For your personal workspace. Your company already covers PressLogic.</Text>
        ) : null}
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
          <PriceError />
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
                per="/year"
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
                    : `${upgrading ? `Upgrade to ${p.label}` : switching ? `Switch to ${onCurrentPlan ? (period === "yearly" ? "Yearly" : "Monthly") : p.label}` : "Subscribe"} for ${price}`
                }
                onPress={() => setConfirming(true)}
              />
            )}
            {switching ? (
              <Text style={styles.changeNote}>{`Takes effect on ${renewOn}. You keep ${planLabel(current)} until then.`}</Text>
            ) : upgrading ? (
              <Text style={styles.changeNote}>Starts now. Apple refunds the unused part of your current plan.</Text>
            ) : appMember ? null : (
              <WebLink label="Or subscribe on buzzvideo.ai" />
            )}
          </>
        )}
        {source === "web" ? null : <Text style={styles.legal}>{LEGAL}</Text>}
        <View style={styles.links}>
          <Pressable onPress={() => toast("Opens Terms of Service")} accessibilityRole="link" hitSlop={8}>
            <Text style={styles.link}>Terms</Text>
          </Pressable>
          <Text style={styles.dot}>·</Text>
          <Pressable onPress={() => toast("Opens Privacy Policy")} accessibilityRole="link" hitSlop={8}>
            <Text style={styles.link}>Privacy</Text>
          </Pressable>
        </View>
      </View>

      {confirming ? (
        <IapConfirm
          title="Confirm Subscription"
          message={
            buyingExitOffer
              ? `BuzzVideo Starter (Monthly)\n${exitPrice} for 1 month, then $${EXIT_OFFER.then}/month. Renews automatically until canceled.`
              : resubscribing || keeping
              ? `BuzzVideo ${p.label} (${period === "yearly" ? "Yearly" : "Monthly"})\nNo charge today. Renews on ${renewOn} at ${price}.`
              : `BuzzVideo ${p.label}${tier && tier.multiplier > 1 ? ` ${tier.multiplier}×` : ""} (${period === "yearly" ? "Yearly" : "Monthly"})\n${fmt(credits)} credits/mo · ${price}. Renews automatically until canceled.`
          }
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
  per: "/mo" | "/year";
  badge?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${label}, ${price} ${per === "/year" ? "per year" : "per month"}, ${detail}`}
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

const ON_IMAGE_SUB = "rgba(255,255,255,0.78)";

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0a10" },
  // 整张背景(含 B 形云朵)由 BuzzVideo 生成,不叠图层。图比上半屏高(延伸到白色面板下面),
  // 这样 cover 裁掉的顶部更少,云朵往下落到 tab 与积分数字之间,不压 tab 和 Restore
  mood: { position: "absolute", top: "-2%", left: 0, right: 0, height: "82%" },
  moodScrim: { position: "absolute", top: 0, left: 0, right: 0, height: "64%" },
  top: { flex: 1, paddingHorizontal: space.lg },
  bar: { height: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginLeft: -space.sm },
  restore: { ...type.subhead, color: ON_IMAGE_SUB, fontWeight: "500" },

  tabs: { flexDirection: "row", gap: space.xs, marginTop: space.sm },
  tab: { flex: 1, height: 40, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  tabOn: { backgroundColor: "rgba(255,255,255,0.18)" },
  tabText: { ...type.subhead, fontWeight: "500", color: "rgba(255,255,255,0.62)" },
  tabTextOn: { color: colors.white, fontWeight: "600" },

  hero: { flex: 1, justifyContent: "flex-end", paddingBottom: space.xl, gap: space.sm },
  bonusLine: { ...type.subhead, fontWeight: "600", color: "#FFC59E", marginTop: -space.xs, maxWidth: "62%" },
  credits: { fontSize: 44, lineHeight: 50, fontWeight: "700", letterSpacing: -0.8, color: colors.white },
  creditsUnit: { ...type.headline, fontWeight: "500", color: ON_IMAGE_SUB },
  // 积分与换算只占左侧约 62%:右侧留给背景里的 B 形云,不叠字
  outcome: { ...type.body, color: colors.white, marginTop: -space.xs, maxWidth: "62%" },
  perks: { gap: 6, marginTop: space.sm },
  perk: { flexDirection: "row", alignItems: "center", gap: space.sm },
  perkText: { flex: 1, ...type.subhead, color: colors.white },
  footnote: { ...type.footnote, color: "rgba(255,255,255,0.6)", marginTop: space.xs },

  panel: {
    backgroundColor: colors.surface,
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
  trackLine: { position: "absolute", left: 0, right: 0, height: 4, borderRadius: 2, backgroundColor: colors.grouped },
  trackFill: { position: "absolute", left: 0, height: 4, borderRadius: 2, backgroundColor: colors.accent },
  stop: { position: "absolute", width: 96, marginLeft: -48, alignItems: "center", gap: 3 },
  stopOff: { ...type.caption, color: colors.accent },
  hidden: { opacity: 0 },
  knob: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.separator },
  knobFilled: { borderColor: colors.accent },
  knobOn: { width: 22, height: 22, borderRadius: 11, borderWidth: 6, borderColor: colors.accent, marginVertical: -4 },
  stopLabel: { ...type.footnote, color: colors.sub },
  stopLabelOn: { color: colors.ink, fontWeight: "600" },
  option: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 64,
    paddingHorizontal: space.lg,
    borderRadius: radius.lg,
    ...smoothCorners,
    backgroundColor: colors.grouped,
    borderWidth: 2,
    borderColor: "transparent",
  },
  optionOn: { backgroundColor: colors.surface, borderColor: colors.ink },
  optionText: { flex: 1, gap: 2 },
  optionHead: { flexDirection: "row", alignItems: "center", gap: space.sm },
  optionLabel: { ...type.headline, color: colors.ink },
  save: { ...type.footnote, fontWeight: "600", color: colors.accent },
  optionDetail: { ...type.footnote, color: colors.sub },
  optionPrice: { ...type.title2, color: colors.ink },
  optionPer: { ...type.footnote, color: colors.sub, fontWeight: "400" },

  status: { backgroundColor: colors.grouped, borderRadius: radius.md, padding: space.lg, gap: 2 },
  statusTitle: { ...type.headline, color: colors.ink },
  statusText: { ...type.subhead, color: colors.sub },
  personalNote: { ...type.footnote, color: colors.sub, textAlign: "center" },
  manage: { ...type.subhead, fontWeight: "600", color: colors.ink, marginTop: space.xs },
  changeNote: { ...type.footnote, color: colors.sub, textAlign: "center", marginTop: -space.xs },

  legal: { ...type.footnote, color: colors.sub, textAlign: "center" },
  links: { flexDirection: "row", justifyContent: "center", gap: space.sm, marginTop: -space.sm },
  link: { ...type.footnote, color: colors.sub, textDecorationLine: "underline" },
  dot: { ...type.footnote, color: colors.faint },
});
