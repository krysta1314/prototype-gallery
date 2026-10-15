import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import GroupedSection from "../components/GroupedSection";
import IconButton from "../components/IconButton";
import NavBar from "../components/NavBar";
import PrimaryButton from "../components/PrimaryButton";
import Row from "../components/Row";
import { formatDay, planLabel, type PaidPlanId } from "../data";
import { useNav, useStore } from "../provider";
import { choiceLabel, isEnterprise, isSubscribed, planCredits } from "../store";
import { colors, radius, space, type } from "../theme";

const fmt = (n: number) => n.toLocaleString("en-US");

/**
 * 订阅管理(spec §2.5):当前方案、每月积分、续费日、待生效的变更。
 * 「Change plan」打开付费墙(升级立即生效,降级 / 换周期下个续费日生效);
 * 页面最底部的「Cancel subscription」是取消订阅的唯一入口,拉起 App Store 的系统订阅页。
 * 已取消自动续费:续费日改成「Ends on」,不额外提醒(spec §2.5)。
 * 网页 + App Store 重复订阅:以网页为准,引导取消 App Store 那份并申请退款(spec §11 #5)
 */
export default function Subscription() {
  const { state, dispatch } = useStore();
  const { navigate } = useNav();
  const sub = state.subscription;
  const toast = (text: string) => dispatch({ type: "showToast", text });
  const paid = isSubscribed(state);
  const plan = sub.plan as PaidPlanId;
  const renewOn = sub.renewDay !== undefined ? formatDay(sub.renewDay) : "—";
  const cancelled = !!sub.cancelled;
  const name = paid ? `${planLabel(sub.plan)}${sub.multiplier && sub.multiplier > 1 ? ` ${sub.multiplier}×` : ""}` : "Free";

  return (
    <View style={styles.page}>
      <NavBar left={<IconButton icon="chevron-left" onPress={() => navigate({ type: "pop" })} accessibilityLabel="Back" />} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.h1} accessibilityRole="header">
          Subscription
        </Text>

        <GroupedSection>
          <Row label="Plan" value={paid ? `${name} · ${sub.period === "monthly" ? "Monthly" : "Yearly"}` : "Free"} />
          {paid ? <Row label="Credits" value={`${fmt(planCredits(plan, sub.multiplier))} / month`} /> : null}
          {paid && sub.source === "app" ? (
            <Row
              label={cancelled ? "Ends on" : sub.pendingChange ? "Changes on" : "Renews on"}
              value={renewOn}
            />
          ) : null}
          {paid ? <Row label="Billed through" value={sub.source === "web" ? "buzzvideo.ai" : "App Store"} /> : null}
        </GroupedSection>

        {sub.pendingChange ? (
          <View style={styles.pending}>
            <Text style={styles.note}>
              {`Your plan changes to ${choiceLabel(sub.pendingChange)} on ${renewOn}. You keep ${name} until then.`}
            </Text>
            {/* 续费日前可以撤销:重新选当前方案,不扣费 */}
            <Pressable
              onPress={() => dispatch({ type: "purchasePlan", plan, period: sub.period ?? "monthly", ...(sub.multiplier ? { multiplier: sub.multiplier } : {}) })}
              accessibilityRole="button"
              hitSlop={8}
            >
              <Text style={styles.cancelChange}>{`Keep ${name} instead`}</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Enterprise 用户:组织空间由公司合同覆盖,这一页只管个人空间的套餐 */}
        {isEnterprise(state) ? (
          <Text style={styles.note}>Your company covers your PressLogic workspace. This page is for your personal plan.</Text>
        ) : null}

        {sub.billingRetry ? (
          <View style={styles.dup}>
            <Text style={styles.dupTitle}>Payment issue</Text>
            <Text style={styles.dupText}>{`We couldn't renew your plan. Update your payment method in the App Store to keep ${name}. Your new monthly credits arrive once payment goes through.`}</Text>
            <PrimaryButton label="Update payment method" variant="white" onPress={() => toast("Opens App Store payment settings")} />
          </View>
        ) : null}

        {cancelled ? (
          <Text style={styles.note}>{`Your plan won't renew. You keep ${name} until ${renewOn}, then move to Free. Credits you bought stay in your account.`}</Text>
        ) : null}

        {sub.duplicateApp ? (
          <View style={styles.dup}>
            <Text style={styles.dupTitle}>You also have an App Store subscription</Text>
            <Text style={styles.dupText}>{"Your buzzvideo.ai plan stays active. Cancel the App Store one so you aren't charged twice."}</Text>
            <PrimaryButton label="Cancel App Store subscription" variant="white" onPress={() => toast("Opens App Store subscriptions")} />
            <Pressable onPress={() => toast("Opens Apple's refund request")} accessibilityRole="link" hitSlop={8} style={styles.refund}>
              <Text style={styles.refundText}>Request a refund from Apple</Text>
            </Pressable>
          </View>
        ) : null}

        {sub.source === "web" ? (
          <Text style={styles.note}>You subscribed on buzzvideo.ai. Change or cancel your plan there.</Text>
        ) : (
          <PrimaryButton
            label={paid ? "Change plan" : "See plans"}
            variant={paid ? "white" : "cta"}
            onPress={() => dispatch({ type: "openPaywall", trigger: "manual" })}
          />
        )}

        <GroupedSection>
          <Row label="Restore purchases" onPress={() => dispatch({ type: "restorePurchases" })} />
        </GroupedSection>
      </ScrollView>

      {/* 取消订阅的唯一入口:放在最底部,不做成按钮,拉起系统订阅页 */}
      {paid && sub.source === "app" && !cancelled ? (
        <Pressable
          onPress={() => toast("Opens App Store subscriptions")}
          accessibilityRole="link"
          hitSlop={8}
          style={styles.cancel}
        >
          <Text style={styles.cancelText}>Cancel subscription</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.grouped },
  content: { paddingHorizontal: space.lg, paddingBottom: space.xxl, gap: space.lg },
  h1: { ...type.largeTitle, color: colors.ink, marginBottom: -space.sm },
  note: { ...type.footnote, color: colors.sub, paddingHorizontal: space.xs },
  dup: { backgroundColor: colors.bg, borderRadius: radius.md, padding: space.lg, gap: space.sm },
  dupTitle: { ...type.headline, color: colors.ink },
  dupText: { ...type.subhead, color: colors.sub, marginBottom: space.xs },
  refund: { alignSelf: "center", paddingTop: space.xs },
  refundText: { ...type.footnote, color: colors.sub, textDecorationLine: "underline" },
  pending: { gap: space.xs },
  cancelChange: { ...type.footnote, fontWeight: "600", color: colors.ink, paddingHorizontal: space.xs },
  cancel: { alignSelf: "center", paddingVertical: space.lg },
  cancelText: { ...type.footnote, color: colors.sub, textDecorationLine: "underline" },
});
