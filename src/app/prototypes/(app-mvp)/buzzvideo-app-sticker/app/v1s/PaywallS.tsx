import { useEffect, useState } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { GZButton, GZSticker, gz } from "../../kit/gz";
import IapConfirm from "../../../buzzvideo-app/app/components/IapConfirm";
import { countdown, useNow } from "../../../buzzvideo-app/app/components/useNow";
import { EXIT_OFFER, SUBSCRIPTION_PLANS, ULTRA_TIERS, formatDay, planById, planLabel, savePct, ultraTier, type Billing, type PaidPlanId, type UltraMultiplier } from "../../../buzzvideo-app/app/data";
import { exitOfferLive, isEnterprise, isSubscribed, planCredits, pricesUnavailable, promoBonus, withBonus, type PaywallTrigger } from "../../../buzzvideo-app/app/store";
import { CLOSE_DELAY_MS } from "../../../buzzvideo-app/app/screens/Paywall";
import { Icon, prefersReducedMotion, useInsets, useNav, useStore } from "../v1";
import { DelayedClose, LegalLinks, PayPriceError, PayTag, PayWebLink, fmt } from "./parts-pay";

const c = gz.color;
/** 和网页版一致：一张 GPT Image 2 图约 3 积分(1,900 积分 ≈ 633 张) */
const GPT_IMAGE_2_CREDITS = 3;
/** 每档右上角那张照片贴纸:社区里的一条示例作品(第一版的 mood 图是天空底图，不适合当贴纸) */

/**
 * 付费墙 · 贴纸风(逻辑同第一版 screens/Paywall,spec §3):
 * 黑底;顶部三档 tab(丁香 = 套餐 / 等级);上半屏大字积分(黄油 = 积分)+ 产出换算 + 权益(青柠勾),右上一张该档的照片贴纸;
 * 下半屏深灰面板放年付 / 月付两行和唯一的橙色主按钮。去掉了第一版的品牌渐变底和白色面板。
 * ✕ 3 秒后淡入(拿不到价格时立即出现);内购确认面板是 iOS 系统样式，原样保留
 */
/** 套餐卖点沿用第一版，只把给商家的说法换成普通人的说法 */
const PERK_COPY: Record<string, string> = {
  "Marketing Agent for ad ideas and copy": "AI Director plans and makes whole videos",
  "Unlimited AI Avatars": "Unlimited talking photos",
  "Web Explore & MCP": "Use it on the web too",
  "Marketing Agent for full campaign workflows": "AI Director for longer, multi-scene videos",
  "Highest credit allowance for high-volume production": "The most credits, for making lots of videos",
};
const funPerk = (perk: string) => PERK_COPY[perk] ?? perk;

export default function Paywall({ trigger: _trigger, tab: initialTab, confirm = false }: { trigger: PaywallTrigger; tab: PaidPlanId; confirm?: boolean }) {
  const { state, dispatch } = useStore();
  const { navigate } = useNav();
  const insets = useInsets();
  const sub = state.subscription;
  const appMember = sub.source === "app" && sub.plan !== "free";
  /** 每个 tab 默认年付;APP 会员看自己当前档时默认选中自己的周期 */
  const defaultPeriod = (id: PaidPlanId): Billing => (appMember && id === sub.plan && sub.period ? sub.period : "yearly");
  const [tab, setTab] = useState<PaidPlanId>(initialTab);
  const [period, setPeriod] = useState<Billing>(defaultPeriod(initialTab));
  /** Ultra 的积分倍数;Ultra 会员默认停在自己的倍数 */
  const [mult, setMult] = useState<UltraMultiplier>(sub.plan === "ultra" ? (sub.multiplier ?? 1) : 1);
  const [confirming, setConfirming] = useState(confirm);

  const [closeOpacity] = useState(() => new Animated.Value(0));
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
  const tier = tab === "ultra" ? ultraTier(mult) : null;
  const offer = tier ?? { credits: p.credits, monthly: p.monthly, yearly: p.yearly, videos: p.videos, offMonthly: 0, offYearly: savePct(p.yearly, p.monthly * 12) };
  const bonus = promoBonus(state);
  const credits = offer.credits;
  const bonusCredits = withBonus(state, offer.credits) - offer.credits;
  const videos = offer.videos;
  const price = period === "yearly" ? `$${fmt(offer.yearly)}/year` : `$${offer.monthly}/month`;
  const listMonthly = tier && tier.multiplier > 1 ? p.monthly * tier.multiplier : null;
  const onCurrentPlan = appMember && tab === current && (tab !== "ultra" || mult === (sub.multiplier ?? 1));
  const isSamePlanAndPeriod = onCurrentPlan && period === sub.period;
  const upgrading = appMember && !onCurrentPlan && planCredits(tab, tab === "ultra" ? mult : undefined) > planCredits(current as PaidPlanId, sub.multiplier);
  const switching = appMember && !upgrading && !isSamePlanAndPeriod;
  const resubscribing = isSamePlanAndPeriod && !!sub.cancelled;
  const keeping = isSamePlanAndPeriod && !sub.cancelled && !!sub.pendingChange;
  const now = useNow();
  const exitLive = tab === "starter" && exitOfferLive(state, now);
  const exitPrice = `$${EXIT_OFFER.firstMonth.toFixed(2)}`;
  const renewOn = sub.renewDay !== undefined ? formatDay(sub.renewDay) : "your next renewal";

  const pick = (id: PaidPlanId) => {
    setTab(id);
    setPeriod(defaultPeriod(id));
  };
  const close = () => {
    navigate({ type: "pop" });
    dispatch({ type: "closePaywall", now: Date.now() });
  };
  const buyingExitOffer = exitLive && period === "monthly";
  const buy = () => {
    setConfirming(false);
    if (buyingExitOffer) dispatch({ type: "acceptExitOffer", now: Date.now() });
    else dispatch({ type: "purchasePlan", plan: tab, period, ...(tab === "ultra" ? { multiplier: mult } : {}) });
    // 内购失败：留在付费墙上可以再试;成功或等家长批准：关闭
    if (state.storekit.purchase !== "failed") navigate({ type: "pop" });
  };

  return (
    <View style={styles.root}>
      <View style={[styles.top, { paddingTop: insets.top }]}>
        <View style={styles.bar}>
          <DelayedClose opacity={closeOpacity} closable={closable} onPress={close} />
          <Pressable onPress={() => dispatch({ type: "restorePurchases" })} accessibilityRole="button" hitSlop={12}>
            <Text style={[gz.display.label, { color: c.text2 }]}>Restore</Text>
          </Pressable>
        </View>

        {/* 三档:丁香 = 套餐 / 等级。选中的那档是一块歪一点的丁香贴纸 */}
        <View style={styles.tabs} accessibilityRole="tablist">
          {SUBSCRIPTION_PLANS.map((x) => {
            const on = x.id === tab;
            return (
              <Pressable key={x.id} onPress={() => pick(x.id)} accessibilityRole="tab" accessibilityState={{ selected: on }} hitSlop={{ top: 2, bottom: 2 }} style={[styles.tab, on && styles.tabOn]}>
                <Text style={[gz.display.head, { fontSize: 16, color: on ? c.ink : c.text2 }]}>{x.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.hero}>
          <View style={styles.heroHead}>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={styles.credits} accessibilityRole="header" accessibilityLabel={`${fmt(credits)} credits per month`}>
                {fmt(credits)}
              </Text>
              <Text style={[gz.display.label, { color: c.text2, marginTop: -2 }]}>credits/mo</Text>
              {/* 活动加赠只在第一次付款时给一次，单独一行写清楚;挽留价和活动加赠不同享 */}
              {bonusCredits > 0 && !buyingExitOffer ? (
                <View style={[styles.bonusRow, { marginTop: 6 }]}>
                  <GZSticker label={`+${fmt(bonusCredits)} bonus credits`} color="butter" size="s" rotate={-3} />
                  <Text style={[gz.body.caption, { color: c.text2 }]}>{`(${bonus}% extra) with your first payment`}</Text>
                </View>
              ) : null}
              <View style={{ gap: 2, marginTop: 6 }}>
                <Text style={[gz.body.caption, { color: c.text2 }]}>{`≈ ${fmt(Math.floor(credits / GPT_IMAGE_2_CREDITS))} GPT Image 2 images`}</Text>
                <Text style={[gz.body.caption, { color: c.text2 }]}>{`≈ ${videos} Seedance 2.0 videos (HD · 10s video)`}</Text>
              </View>
            </View>
          </View>
          <ScrollView style={styles.perksScroll} contentContainerStyle={styles.perks} showsVerticalScrollIndicator={false}>
            {p.perks.map(funPerk).map((perk) => (
              <View key={perk} style={styles.perk}>
                <View style={styles.perkIcon}>
                  <Icon name="check" size={12} color={c.ink} strokeWidth={3.4} />
                </View>
                <Text style={[gz.body.caption, { flex: 1, color: c.text, lineHeight: 18 }]}>{perk}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* 下半屏：深灰面板 */}
      <View style={[styles.panel, { paddingBottom: insets.bottom + 12 }]}>
        {isEnterprise(state) && source !== "web" && !isSubscribed(state) ? (
          <Text style={[gz.body.caption, { color: c.text2, textAlign: "center" }]}>For your personal workspace. Your company already covers PressLogic.</Text>
        ) : null}
        {source === "web" ? (
          <View style={styles.status}>
            <Text style={[gz.display.label, { color: c.white }]}>{`Subscribed on the web · ${planLabel(current)}`}</Text>
            <Text style={[gz.body.caption, { color: c.text2 }]}>Manage your plan at buzzvideo.ai</Text>
          </View>
        ) : null}
        {source === "web" ? null : pricesUnavailable(state) ? (
          <PayPriceError />
        ) : (
          <>
            {tab === "ultra" ? <VolumeSlider value={mult} onChange={setMult} period={period} /> : null}
            <View style={{ gap: 8 }} accessibilityRole="radiogroup">
              <Option
                selected={onCurrentPlan ? sub.period === "yearly" : period === "yearly"}
                disabled={onCurrentPlan}
                current={onCurrentPlan && sub.period === "yearly"}
                onPress={() => setPeriod("yearly")}
                label="Yearly"
                detail={`$${Math.round(offer.yearly / 12)}/mo · billed once a year`}
                price={`$${fmt(offer.yearly)}`}
                per="/yr"
                badge={`Save ${offer.offYearly}%`}
              />
              <Option
                selected={onCurrentPlan ? sub.period === "monthly" : period === "monthly"}
                disabled={onCurrentPlan}
                current={onCurrentPlan && sub.period === "monthly"}
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
            {(onCurrentPlan || isSamePlanAndPeriod) && !resubscribing && !keeping ? null : (
              <GZButton
                label={
                  buyingExitOffer
                    ? `Get 50% off · ${exitPrice} first month`
                    : resubscribing
                      ? "Resubscribe"
                      : keeping
                        ? `Keep ${p.label}`
                        : upgrading
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
              <PayWebLink label="Or subscribe on buzzvideo.ai" />
            )}
          </>
        )}
        <LegalLinks />
      </View>

      {/* App Store 内购确认：系统样式，照真机还原，不换风格 */}
      {confirming ? (
        <IapConfirm
          product={buyingExitOffer ? "BuzzVideo Starter (Monthly)" : `BuzzVideo ${p.label}${tier && tier.multiplier > 1 ? ` ${tier.multiplier}×` : ""} (${period === "yearly" ? "Yearly" : "Monthly"})`}
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

/** Ultra 积分倍数:三档刻度 1× / 2× / 4×,点刻度切换。丁香 = 套餐档位;刻度上方的折扣是青柠(划算) */
function VolumeSlider({ value, onChange, period }: { value: UltraMultiplier; onChange: (m: UltraMultiplier) => void; period: Billing }) {
  const idx = ULTRA_TIERS.findIndex((t) => t.multiplier === value);
  return (
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
            <Text style={[gz.display.tiny, { color: c.lime }, (t.multiplier === 1 || !off) && { opacity: 0 }]}>{`${off}% off`}</Text>
            <View style={[styles.knob, i <= idx && { borderColor: c.lilac }, on && styles.knobOn]} />
            <Text style={[on ? gz.display.tiny : gz.body.micro, { color: on ? c.white : c.text3, fontWeight: on ? "800" : "600" }]}>{`${t.multiplier}× · ${fmt(t.credits)}`}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Option({
  selected,
  disabled,
  current,
  onPress,
  label,
  detail,
  price,
  per,
  badge,
}: {
  selected: boolean;
  disabled?: boolean;
  current?: boolean;
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
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled: !!disabled }}
      accessibilityLabel={`${label}, ${price} ${per === "/yr" ? "per year" : "per month"}, ${detail}`}
      style={[styles.option, selected && !disabled && styles.optionOn, disabled && { opacity: 0.5 }]}
    >
      <View style={[styles.radio, selected && styles.radioOn]}>{selected ? <View style={styles.radioDot} /> : null}</View>
      <View style={{ flex: 1, gap: 3 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={[gz.display.head, { fontSize: 17, color: c.white }]}>{label}</Text>
          {current ? <PayTag label="Current plan" bg={c.lilac} /> : badge && !disabled ? <PayTag label={badge} bg={c.lime} /> : null}
        </View>
        <Text style={[gz.body.caption, { color: c.text2 }]}>{detail}</Text>
      </View>
      <Text style={[gz.display.title, { color: c.white }]}>
        {price}
        <Text style={[gz.body.caption, { color: c.text2 }]}>{per}</Text>
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.black },
  top: { flex: 1, paddingHorizontal: 16 },
  bar: { height: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },

  tabs: { flexDirection: "row", padding: 3, borderRadius: 999, backgroundColor: c.raised, marginTop: 4 },
  tab: { flex: 1, height: 38, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  tabOn: { backgroundColor: c.lilac, borderWidth: gz.cut, borderColor: c.white, transform: [{ rotate: "-2deg" }] },

  hero: { flex: 1, paddingTop: 16, gap: 10 },
  heroHead: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  credits: { fontFamily: gz.display.hero.fontFamily, fontWeight: "800", fontSize: 56, lineHeight: 56, letterSpacing: -2, color: c.butter, fontVariant: ["tabular-nums"] },
  bonusRow: { alignItems: "flex-start", gap: 4 },
  perksScroll: { flex: 1, marginTop: 8 },
  perks: { gap: 9, paddingBottom: 16 },
  perk: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  perkIcon: { width: 18, height: 18, borderRadius: 9, backgroundColor: c.lime, alignItems: "center", justifyContent: "center" },

  panel: { backgroundColor: c.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingTop: 20, gap: 12 },
  option: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 66, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, backgroundColor: c.raised, borderWidth: gz.cut, borderColor: "transparent" },
  optionOn: { borderColor: c.white },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: c.text3, alignItems: "center", justifyContent: "center" },
  radioOn: { borderColor: c.white, backgroundColor: c.white },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: c.ink },

  track: { height: 54, marginHorizontal: 30, justifyContent: "center" },
  trackLine: { position: "absolute", left: 0, right: 0, height: 4, borderRadius: 2, backgroundColor: c.raised },
  trackFill: { position: "absolute", left: 0, height: 4, borderRadius: 2, backgroundColor: c.lilac },
  stop: { position: "absolute", width: 100, marginLeft: -50, alignItems: "center", gap: 4 },
  knob: { width: 14, height: 14, borderRadius: 7, backgroundColor: c.surface, borderWidth: 2, borderColor: c.text3 },
  knobOn: { width: 22, height: 22, borderRadius: 11, borderWidth: 6, borderColor: c.lilac, backgroundColor: c.white, marginVertical: -4 },

  status: { backgroundColor: c.raised, borderRadius: 16, padding: 16, gap: 4 },
  changeNote: { ...gz.body.caption, color: c.text2, textAlign: "center", marginTop: -4 },
});
