import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { formatDay, planById, planLabel, type PaidPlanId } from "../../../buzzvideo-app/app/data";
import { choiceLabel, isEnterprise, isSubscribed, planCredits } from "../../../buzzvideo-app/app/store";
import { GZBlock, GZButton, GZPhoto, gz } from "../../kit/gz";
import { Header } from "../ui";
import { useInsets, useNav, useStore } from "../v1";
import { ListGroup, ListRow } from "./parts-auth";

const c = gz.color;
const fmt = (n: number) => n.toLocaleString("en-US");

/**
 * 贴纸风订阅管理(逻辑同第一版 screens/Subscription,spec §2.5):
 * 会员卡 = 一整块丁香色(等级 / 身份)色块，档位名用大展示字，右上角贴一张付费墙同款氛围图的照片贴纸;免费用户是深灰块、没有照片。
 * 「Change plan」打开付费墙;最底部「Cancel subscription」是取消订阅的唯一入口(拉起 App Store 系统订阅页)。
 * 网页 + App Store 重复订阅、扣款失败的提示是发丝线框住的说明区，不再叠灰卡片
 */
export default function SubscriptionS() {
  const { state, dispatch } = useStore();
  const { navigate } = useNav();
  const insets = useInsets();
  const sub = state.subscription;
  const toast = (text: string) => dispatch({ type: "showToast", text });
  const paid = isSubscribed(state);
  const plan = sub.plan as PaidPlanId;
  const renewOn = sub.renewDay !== undefined ? formatDay(sub.renewDay) : "—";
  const cancelled = !!sub.cancelled;
  const name = paid ? `${planLabel(sub.plan)}${sub.multiplier && sub.multiplier > 1 ? ` ${sub.multiplier}×` : ""}` : "Free";
  const ink = paid ? c.ink : c.white;
  const inkSub = paid ? "rgba(0,0,0,0.7)" : c.text2;

  return (
    <View style={styles.page}>
      <Header onBack={() => navigate({ type: "pop" })} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <Text style={[gz.display.hero, { color: c.white, paddingHorizontal: 20 }]} accessibilityRole="header">
          Subscription
        </Text>

        {/* 会员卡:0.5s 看到的是自己的档位 */}
        <View style={{ paddingHorizontal: 16, marginTop: 18 }}>
          <GZBlock color={paid ? "lilac" : "ink"} rotate={paid ? -1 : 0} style={[styles.card, !paid && styles.cardFree]}>
            {paid ? (
              <View style={styles.cardPhoto}>
                <GZPhoto uri={planById(plan).mood} w={82} h={100} rotate={7} radius={12} />
              </View>
            ) : null}
            <Text style={[gz.display.label, { color: inkSub }]}>Your plan</Text>
            <Text style={[gz.display.hero, { color: ink, fontSize: 40, lineHeight: 44, marginTop: 4, paddingRight: paid ? 92 : 0 }]} numberOfLines={1}>
              {name}
            </Text>
            <Text style={[gz.body.body, { color: inkSub, marginTop: 4, paddingRight: paid ? 80 : 0 }]}>
              {paid ? `${sub.period === "monthly" ? "Monthly" : "Yearly"} · ${fmt(planCredits(plan, sub.multiplier))} credits a month` : "Sign-up credits only · no monthly credits"}
            </Text>
            {paid ? (
              <Text style={[gz.display.label, { color: c.ink, marginTop: 12 }]}>
                {sub.source === "web" ? "Billed through buzzvideo.ai" : cancelled ? `Ends on ${renewOn}` : sub.pendingChange ? `Changes on ${renewOn}` : `Renews on ${renewOn}`}
              </Text>
            ) : null}
          </GZBlock>
        </View>

        {paid && sub.source === "app" ? (
          <ListGroup>
            <ListRow first label="Billed through" value="App Store" />
          </ListGroup>
        ) : null}

        {sub.pendingChange ? (
          <View style={styles.noteBlock}>
            <Text style={[gz.body.caption, styles.note]}>{`Your plan changes to ${choiceLabel(sub.pendingChange)} on ${renewOn}. You keep ${name} until then.`}</Text>
            {/* 续费日前可以撤销：重新选当前方案，不扣费 */}
            <Pressable
              onPress={() => dispatch({ type: "purchasePlan", plan, period: sub.period ?? "monthly", ...(sub.multiplier ? { multiplier: sub.multiplier } : {}) })}
              accessibilityRole="button"
              hitSlop={13}
              style={({ pressed }) => pressed && { opacity: 0.6 }}
            >
              <Text style={[gz.display.label, { color: c.sky }]}>{`Keep ${name} instead`}</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Enterprise 用户：组织空间由公司合同覆盖，这一页只管个人空间的套餐 */}
        {isEnterprise(state) ? <Text style={[gz.body.caption, styles.note, styles.noteBlock]}>Your company covers your PressLogic workspace. This page is for your personal plan.</Text> : null}

        {sub.billingRetry ? (
          <View style={styles.notice}>
            <Text style={[gz.display.head, { color: c.white }]}>Payment issue</Text>
            <Text style={[gz.body.body, { color: c.text2 }]}>{`We couldn't renew your plan. Update your payment method in the App Store to keep ${name}. Your new monthly credits arrive once payment goes through.`}</Text>
            <GZButton label="Update payment method" variant="white" size="m" block onPress={() => toast("Opens App Store payment settings")} style={{ marginTop: 4 }} />
          </View>
        ) : null}

        {cancelled ? <Text style={[gz.body.caption, styles.note, styles.noteBlock]}>{`Your plan won't renew. You keep ${name} until ${renewOn}, then move to Free. Credits you bought stay in your account.`}</Text> : null}

        {sub.duplicateApp ? (
          <View style={styles.notice}>
            <Text style={[gz.display.head, { color: c.white }]}>You also have an App Store subscription</Text>
            <Text style={[gz.body.body, { color: c.text2 }]}>{"Your buzzvideo.ai plan stays active. Cancel the App Store one so you aren't charged twice."}</Text>
            <GZButton label="Cancel App Store subscription" variant="white" size="m" block onPress={() => toast("Opens App Store subscriptions")} style={{ marginTop: 4 }} />
            <Pressable onPress={() => toast("Opens Apple's refund request")} accessibilityRole="link" hitSlop={13} style={({ pressed }) => [{ alignSelf: "center", paddingTop: 4 }, pressed && { opacity: 0.6 }]}>
              <Text style={[gz.display.label, { color: c.sky }]}>Request a refund from Apple</Text>
            </Pressable>
          </View>
        ) : null}

        {sub.source === "web" ? (
          <Text style={[gz.body.caption, styles.note, styles.noteBlock]}>You subscribed on buzzvideo.ai. Change or cancel your plan there.</Text>
        ) : (
          <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
            <GZButton label={paid ? "Change plan" : "See plans"} variant={paid ? "white" : "primary"} onPress={() => dispatch({ type: "openPaywall", trigger: "manual" })} />
          </View>
        )}

        <ListGroup>
          <ListRow first label="Restore purchases" onPress={() => dispatch({ type: "restorePurchases" })} chevron />
        </ListGroup>
      </ScrollView>

      {/* 取消订阅的唯一入口：放在最底部，不做成按钮，拉起系统订阅页 */}
      {paid && sub.source === "app" && !cancelled ? (
        <Pressable onPress={() => toast("Opens App Store subscriptions")} accessibilityRole="link" hitSlop={13} style={({ pressed }) => [styles.cancel, { marginBottom: insets.bottom }, pressed && { opacity: 0.6 }]}>
          <Text style={[gz.body.caption, { color: c.text3, textDecorationLine: "underline" }]}>Cancel subscription</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: c.page },
  content: { paddingTop: 4 },
  card: { paddingVertical: 20, paddingHorizontal: 18, minHeight: 150 },
  cardFree: { backgroundColor: c.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: c.line },
  cardPhoto: { position: "absolute", right: 14, top: -14 },
  noteBlock: { paddingHorizontal: 20, marginTop: 16, gap: 6 },
  note: { color: c.text2 },
  notice: { marginHorizontal: 16, marginTop: 18, paddingVertical: 16, gap: 8, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.line },
  cancel: { alignSelf: "center", paddingVertical: 16 },
});
