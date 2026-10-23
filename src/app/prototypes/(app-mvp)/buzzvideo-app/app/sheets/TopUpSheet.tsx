import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Coin from "../components/Coin";
import IapConfirm from "../components/IapConfirm";
import PrimaryButton from "../components/PrimaryButton";
import PriceError from "../components/PriceError";
import Sheet from "../components/Sheet";
import { CREDIT_PACKS } from "../data";
import { useStore } from "../provider";
import { pricesUnavailable, promoBonus, withBonus } from "../store";
import { colors, fill, radius, selectedBox, smoothCorners, space, type } from "../theme";

const fmt = (n: number) => n.toLocaleString("en-US");
const MAX_QTY = 10;

/**
 * 积分包(spec §2.3):和网页 Credits Top-up 一样 8 档,1 积分 = $0.01,永不过期,只有会员能买。
 * 一行 3 张卡(金币 + 积分 + 价格,Popular 标签压在上沿);选中 = 品牌色淡底 + 细边。运营活动在线时每档多一行 +加赠。真实 APP:每档一个消耗型内购商品,数量用 StoreKit quantity
 */
export default function TopUpSheet({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  const [selected, setSelected] = useState("pack-5000");
  const [qty, setQty] = useState(1);
  const [confirming, setConfirming] = useState(false);
  // 一行 3 张：按容器宽度算卡宽(百分比 + gap 会超 1px 掉成两列)
  const [gridW, setGridW] = useState(0);
  const cardW = gridW ? Math.floor((gridW - space.sm * 2) / 3) : undefined;
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
        <View style={styles.grid} accessibilityRole="radiogroup" onLayout={(e) => setGridW(e.nativeEvent.layout.width)}>
          {CREDIT_PACKS.map((p) => {
            const on = p.id === selected;
            return (
              <Pressable
                key={p.id}
                onPress={() => setSelected(p.id)}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                style={({ pressed }) => [styles.card, cardW ? { width: cardW } : null, on && selectedBox, pressed && !on && styles.cardPressed]}
              >
                {/* 标签压在卡片上沿正中(和模式面板的 Hot 同一套胶囊);选中是品牌色淡底 + 同色细边 */}
                {p.popular ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Popular</Text>
                  </View>
                ) : null}
                <Coin size={18} />
                <Text style={styles.amount}>{fmt(p.credits)}</Text>
                {bonus > 0 ? <Text style={styles.bonus}>{`+${fmt(withBonus(state, p.credits) - p.credits)}`}</Text> : null}
                <Text style={[styles.cardPrice, on && styles.cardPriceOn]}>{`$${p.price}`}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.qtyRow}>
          <Text style={styles.qtyLabel}>Quantity</Text>
          <View style={styles.stepper}>
            <Pressable onPress={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} accessibilityRole="button" accessibilityLabel="Decrease" hitSlop={{ top: 4, bottom: 4 }} style={styles.stepBtn}>
              <Text style={[styles.step, qty <= 1 && styles.stepOff]}>−</Text>
            </Pressable>
            <Text style={styles.qty}>{qty}</Text>
            <Pressable onPress={() => setQty((q) => Math.min(MAX_QTY, q + 1))} disabled={qty >= MAX_QTY} accessibilityRole="button" accessibilityLabel="Increase" hitSlop={{ top: 4, bottom: 4 }} style={styles.stepBtn}>
              <Text style={[styles.step, qty >= MAX_QTY && styles.stepOff]}>+</Text>
            </Pressable>
          </View>
        </View>

        <PrimaryButton label="Continue" onPress={() => setConfirming(true)} />
        </>
        )}
      </View>
      {confirming ? (
        <IapConfirm
          kind="purchase"
          product={`${fmt(pack.credits * qty)} BuzzVideo credits${bonus > 0 ? ` + ${fmt(withBonus(state, pack.credits * qty) - pack.credits * qty)} bonus` : ""}`}
          badge="CREDITS"
          price={`$${total}`}
          terms="One-time purchase. Credits never expire."
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
  // 左右内边距由 Sheet 统一给(20),这里不再叠一层;说明和卡片挨近，数量 + 购买键成一组
  body: { gap: space.md, paddingTop: space.xs },
  lead: { ...type.subhead, color: colors.sub },
  // 一行 3 张(2026-10-23):8 档排成 3 / 3 / 2;上面留出标签压边的空间
  grid: { flexDirection: "row", flexWrap: "wrap", columnGap: space.sm, rowGap: 14, paddingTop: 8 },
  card: {
    width: "31%",
    alignItems: "center",
    paddingTop: space.lg,
    paddingBottom: space.md,
    borderRadius: radius.control,
    ...smoothCorners,
    backgroundColor: colors.grouped,
    borderWidth: 1,
    borderColor: colors.edge,
    gap: 4,
  },
  cardPressed: { backgroundColor: fill.pressed },
  amount: { ...type.headline, fontWeight: "700", color: colors.ink, fontVariant: ["tabular-nums"], marginTop: 2 },
  cardPrice: { ...type.footnote, fontWeight: "600", color: colors.sub, fontVariant: ["tabular-nums"] },
  cardPriceOn: { color: colors.ink },
  bonus: { ...type.caption1, fontWeight: "700", color: colors.accent },
  badge: { position: "absolute", top: -9, alignSelf: "center", height: 18, paddingHorizontal: 8, borderRadius: radius.full, backgroundColor: colors.accent, justifyContent: "center" },
  badgeText: { ...type.caption, fontWeight: "800", color: colors.white },
  qtyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: space.sm },
  qtyLabel: { ...type.body, color: colors.ink },
  stepper: { flexDirection: "row", alignItems: "center", backgroundColor: colors.grouped, borderRadius: radius.full },
  stepBtn: { width: 44, height: 36, alignItems: "center", justifyContent: "center" },
  step: { ...type.title3, fontWeight: "400", color: colors.ink },
  stepOff: { color: colors.faint },
  qty: { ...type.headline, color: colors.ink, minWidth: 20, textAlign: "center" },
});
