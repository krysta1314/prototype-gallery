import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Icon from "../components/Icon";
import IconButton from "../components/IconButton";
import IapConfirm from "../components/IapConfirm";
import NavBar from "../components/NavBar";
import PrimaryButton from "../components/PrimaryButton";
import { SUBSCRIPTION_PLANS, planLabel, yearlyPrice, type Billing, type SubscriptionPlan } from "../data";
import { useNav, useStore } from "../provider";
import { colors, radius, smoothCorners, space, type } from "../theme";

const LEGAL = "Subscriptions renew automatically until canceled. Cancel anytime in your App Store or Google Play settings.";
const fmt = (n: number) => n.toLocaleString("en-US");
const money = (n: number) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;

export default function Plans() {
  const { state, dispatch } = useStore();
  const { navigate } = useNav();
  const { plan: current, source } = state.subscription;
  const [billing, setBilling] = useState<Billing>("monthly");
  const [selected, setSelected] = useState<SubscriptionPlan["id"]>("pro");
  const [confirming, setConfirming] = useState(false);
  const close = () => navigate({ type: "pop" });
  const toast = (text: string) => dispatch({ type: "showToast", text });
  const subscribed = source !== "none" && current !== "free";
  const chosen = SUBSCRIPTION_PLANS.find((p) => p.id === selected)!;
  const priceLine = (p: SubscriptionPlan) => (billing === "yearly" ? `${money(yearlyPrice(p.monthly))} per year` : `${money(p.monthly)} per month`);

  const confirm = () => {
    setConfirming(false);
    dispatch({ type: "purchasePlan", plan: selected });
    close();
  };

  const visible = subscribed ? SUBSCRIPTION_PLANS.filter((p) => p.id === current) : SUBSCRIPTION_PLANS;

  return (
    <View style={styles.page}>
      <NavBar right={<IconButton icon="x" onPress={close} accessibilityLabel="Close" />} />
      <ScrollView style={styles.root} contentContainerStyle={styles.content}>
        <Text style={styles.h1} accessibilityRole="header">
          Choose your plan
        </Text>

        {subscribed ? (
          <View style={styles.status}>
            <Text style={styles.statusTitle}>{source === "web" ? "Subscribed on the web" : `You're on ${planLabel(current)}`}</Text>
            {source === "web" ? <Text style={styles.statusText}>Manage your plan at buzzvideo.ai</Text> : null}
          </View>
        ) : (
          <View style={styles.toggle} accessibilityRole="tablist">
            {(["monthly", "yearly"] as const).map((b) => {
              const active = billing === b;
              return (
                <Pressable
                  key={b}
                  onPress={() => setBilling(b)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  style={[styles.toggleItem, active && styles.toggleActive]}
                >
                  <Text style={[styles.toggleLabel, active && styles.toggleLabelActive]}>{b === "monthly" ? "Monthly" : "Yearly"}</Text>
                  {b === "yearly" ? (
                    <View style={styles.save}>
                      <Text style={styles.saveText}>Save 30%</Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        )}

        {visible.map((p) => {
          const isSel = !subscribed && p.id === selected;
          const yearly = billing === "yearly" && !subscribed;
          return (
            <Pressable
              key={p.id}
              disabled={subscribed}
              onPress={() => setSelected(p.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSel }}
              accessibilityLabel={`${p.label} plan`}
              style={[styles.card, (isSel || subscribed) && styles.cardActive]}
            >
              <View style={styles.cardHead}>
                <Text style={styles.planName}>{p.label}</Text>
                {p.popular ? (
                  <View style={styles.popular}>
                    <Text style={styles.popularText}>Most popular</Text>
                  </View>
                ) : null}
                <View style={styles.flex} />
                {subscribed ? <Text style={styles.currentTag}>Current plan</Text> : <View style={[styles.radio, isSel && styles.radioOn]}>{isSel ? <Icon name="check" size={14} color={colors.white} strokeWidth={2.5} /> : null}</View>}
              </View>
              {yearly ? (
                <>
                  <Text style={styles.price}>
                    {money(yearlyPrice(p.monthly))}
                    <Text style={styles.per}> / year</Text>
                  </Text>
                  <Text style={styles.sub}>{`${money(Math.round((yearlyPrice(p.monthly) / 12) * 100) / 100)}/mo, billed yearly`}</Text>
                </>
              ) : (
                <Text style={styles.price}>
                  {money(p.monthly)}
                  <Text style={styles.per}> / month</Text>
                </Text>
              )}
              <Text style={styles.credits}>{fmt(p.credits)} credits / month</Text>
              <View style={styles.perks}>
                {p.perks.map((perk) => (
                  <View key={perk} style={styles.perk}>
                    <Icon name="check" size={16} color={colors.accent} strokeWidth={2.25} />
                    <Text style={styles.perkText}>{perk}</Text>
                  </View>
                ))}
              </View>
            </Pressable>
          );
        })}

        {source === "app" ? (
          <PrimaryButton variant="light" label="Manage subscription" onPress={() => toast("Opening subscription settings…")} />
        ) : source === "none" || current === "free" ? (
          <PrimaryButton label="Subscribe" onPress={() => setConfirming(true)} />
        ) : null}

        <Text style={styles.legal}>{LEGAL}</Text>
        <View style={styles.links}>
          <Pressable onPress={() => dispatch({ type: "restorePurchases" })} accessibilityRole="button" hitSlop={8}>
            <Text style={styles.link}>Restore purchases</Text>
          </Pressable>
          <Pressable onPress={() => toast("Opens Terms of Service")} accessibilityRole="button" hitSlop={8}>
            <Text style={styles.link}>Terms of Service</Text>
          </Pressable>
          <Pressable onPress={() => toast("Opens Privacy Policy")} accessibilityRole="button" hitSlop={8}>
            <Text style={styles.link}>Privacy Policy</Text>
          </Pressable>
        </View>
      </ScrollView>
      {confirming ? (
        <IapConfirm
          title="Confirm Subscription"
          message={`BuzzVideo ${chosen.label} (${billing === "yearly" ? "Yearly" : "Monthly"})\n${priceLine(chosen)}. Renews automatically until canceled.`}
          onCancel={() => setConfirming(false)}
          onConfirm={confirm}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  root: { flex: 1 },
  flex: { flex: 1 },
  content: { paddingHorizontal: space.lg, paddingBottom: space.xxl, gap: space.md },
  h1: { ...type.title1, color: colors.ink, marginBottom: space.xs },
  toggle: { flexDirection: "row", backgroundColor: colors.grouped, borderRadius: radius.md, padding: 2, marginBottom: space.xs },
  toggleItem: { flex: 1, height: 40, borderRadius: 10, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  toggleActive: { backgroundColor: colors.surface },
  toggleLabel: { ...type.subhead, fontWeight: "500", color: colors.sub },
  toggleLabelActive: { color: colors.ink, fontWeight: "600" },
  save: { backgroundColor: colors.ink, borderRadius: radius.full, paddingHorizontal: 7, paddingVertical: 2 },
  saveText: { ...type.caption, color: colors.white },
  status: { backgroundColor: colors.grouped, borderRadius: radius.md, padding: space.lg, gap: 2 },
  statusTitle: { ...type.headline, color: colors.ink },
  statusText: { ...type.subhead, color: colors.sub },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, ...smoothCorners, borderWidth: 1.5, borderColor: colors.separator, padding: space.lg, gap: 4 },
  cardActive: { borderColor: colors.accent },
  cardHead: { flexDirection: "row", alignItems: "center", gap: space.sm },
  planName: { ...type.headline, color: colors.ink },
  popular: { backgroundColor: colors.grouped, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  popularText: { ...type.caption, color: colors.ink },
  currentTag: { ...type.footnote, color: colors.sub },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: colors.faint, alignItems: "center", justifyContent: "center" },
  radioOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  price: { ...type.title1, color: colors.ink, marginTop: 2 },
  per: { ...type.subhead, color: colors.sub, fontWeight: "400" },
  sub: { ...type.footnote, color: colors.sub },
  credits: { ...type.subhead, color: colors.ink, fontWeight: "600", marginTop: 2 },
  perks: { gap: 6, marginTop: space.sm },
  perk: { flexDirection: "row", gap: space.sm, alignItems: "flex-start" },
  perkText: { flex: 1, ...type.subhead, color: colors.ink },
  legal: { ...type.footnote, color: colors.sub, textAlign: "center", marginTop: space.sm },
  links: { flexDirection: "row", justifyContent: "center", flexWrap: "wrap", gap: space.lg },
  link: { ...type.footnote, color: colors.ink, textDecorationLine: "underline" },
});
