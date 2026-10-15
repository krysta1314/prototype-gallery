import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Coin from "../components/Coin";
import IapConfirm from "../components/IapConfirm";
import Icon from "../components/Icon";
import PrimaryButton from "../components/PrimaryButton";
import PriceError from "../components/PriceError";
import Sheet from "../components/Sheet";
import WebLink from "../components/WebLink";
import { CREDIT_PACKS } from "../data";
import { useStore } from "../provider";
import { pricesUnavailable, promoBonus, withBonus } from "../store";
import { colors, radius, smoothCorners, space, type } from "../theme";

const fmt = (n: number) => n.toLocaleString("en-US");
const MAX_QTY = 10;

/**
 * 积分包(spec §2.3):和网页 Credits Top-up 一样 8 档,1 积分 = $0.01,永不过期,只有会员能买。
 * 运营活动在线时每档显示加赠后的积分。真实 APP:每档一个消耗型内购商品,数量用 StoreKit quantity
 */
export default function TopUpSheet({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  const [selected, setSelected] = useState("pack-5000");
  const [qty, setQty] = useState(1);
  const [confirming, setConfirming] = useState(false);
  const pack = CREDIT_PACKS.find((p) => p.id === selected)!;
  const bonus = promoBonus(state);
  const total = pack.price * qty;

  return (
    <Sheet title="Buy credits" onClose={onClose}>
      <View style={styles.body}>
        <Text style={styles.lead}>{bonus > 0 ? `Top-up credits never expire. +${bonus}% bonus while the offer is live.` : "Top-up credits never expire."}</Text>
        {pricesUnavailable(state) ? (
          <PriceError rows={3} />
        ) : (
        <>
        <View style={styles.grid} accessibilityRole="radiogroup">
          {CREDIT_PACKS.map((p) => {
            const on = p.id === selected;
            return (
              <Pressable
                key={p.id}
                onPress={() => setSelected(p.id)}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                style={[styles.card, on && styles.cardOn]}
              >
                <View style={styles.cardHead}>
                  <Coin size={14} />
                  <Text style={styles.amount}>{fmt(p.credits)}</Text>
                </View>
                {bonus > 0 ? <Text style={styles.bonus}>{`+${fmt(withBonus(state, p.credits) - p.credits)} bonus`}</Text> : null}
                <Text style={styles.cardPrice}>{`$${p.price}`}</Text>
                {p.popular ? <Text style={styles.popular}>Popular</Text> : null}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.qtyRow}>
          <Text style={styles.qtyLabel}>Quantity</Text>
          <View style={styles.stepper}>
            <Pressable onPress={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} accessibilityRole="button" accessibilityLabel="Decrease" style={styles.stepBtn}>
              <Text style={[styles.step, qty <= 1 && styles.stepOff]}>−</Text>
            </Pressable>
            <Text style={styles.qty}>{qty}</Text>
            <Pressable onPress={() => setQty((q) => Math.min(MAX_QTY, q + 1))} disabled={qty >= MAX_QTY} accessibilityRole="button" accessibilityLabel="Increase" style={styles.stepBtn}>
              <Text style={[styles.step, qty >= MAX_QTY && styles.stepOff]}>+</Text>
            </Pressable>
          </View>
        </View>

        <PrimaryButton label={`Buy for $${total}`} onPress={() => setConfirming(true)} />
        </>
        )}
        <WebLink label="Or top up on buzzvideo.ai" />
        <View style={styles.hint}>
          <Icon name="info" size={14} color={colors.sub} />
          <Text style={styles.hintText}>Used after your monthly plan credits run out.</Text>
        </View>
      </View>
      {confirming ? (
        <IapConfirm
          title="Confirm Purchase"
          message={`${fmt(pack.credits * qty)} BuzzVideo credits${bonus > 0 ? ` + ${fmt(withBonus(state, pack.credits * qty) - pack.credits * qty)} bonus` : ""}\n$${total}. One-time purchase.`}
          confirmLabel="Buy"
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            setConfirming(false);
            dispatch({ type: "buyCreditPack", packId: pack.id, qty });
            // 内购失败时留在面板上,可以再试
            if (state.storekit.purchase !== "failed") onClose();
          }}
        />
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: space.lg, gap: space.md },
  lead: { ...type.subhead, color: colors.sub },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  card: {
    width: "48.5%",
    padding: space.md,
    borderRadius: radius.md,
    ...smoothCorners,
    backgroundColor: colors.grouped,
    borderWidth: 2,
    borderColor: "transparent",
    gap: 2,
  },
  cardOn: { backgroundColor: colors.surface, borderColor: colors.ink },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 6 },
  amount: { ...type.headline, color: colors.ink },
  cardPrice: { ...type.subhead, color: colors.sub },
  bonus: { ...type.footnote, fontWeight: "600", color: colors.accent },
  popular: { position: "absolute", top: space.md, right: space.md, ...type.caption, color: colors.accent },
  qtyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  qtyLabel: { ...type.body, color: colors.ink },
  stepper: { flexDirection: "row", alignItems: "center", backgroundColor: colors.grouped, borderRadius: radius.full },
  stepBtn: { width: 44, height: 36, alignItems: "center", justifyContent: "center" },
  step: { fontSize: 20, lineHeight: 22, color: colors.ink },
  stepOff: { color: colors.faint },
  qty: { ...type.headline, color: colors.ink, minWidth: 20, textAlign: "center" },
  hint: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "center" },
  hintText: { ...type.footnote, color: colors.sub },
});
