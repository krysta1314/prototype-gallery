import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { GZButton, gz } from "../../kit/gz";
import IapConfirm from "../../../buzzvideo-app/app/components/IapConfirm";
import { CREDIT_PACKS } from "../../../buzzvideo-app/app/data";
import { pricesUnavailable, promoBonus, withBonus } from "../../../buzzvideo-app/app/store";
import { Coin, Icon, useStore } from "../v1";
import { PayPriceError, PaySheet, fmt } from "./parts-pay";

const c = gz.color;
const MAX_QTY = 10;
const GAP = 8;

/**
 * 积分包 · 贴纸风(逻辑同第一版 sheets/TopUpSheet,spec §2.3):8 档,1 积分 = $0.01,永不过期，只有会员能买。
 * 一行 3 张卡;选中的那张变成一块黄油色贴纸(黄油 = 积分)、白模切边、歪一点;Popular 是压在上沿的青柠小贴纸。
 * 运营活动在线时每档多一行 +加赠。面板出入场沿用第一版 Sheet 的 SheetPresence 契约(见 parts-pay PaySheet)
 */
export default function TopUpSheet({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  const [selected, setSelected] = useState("pack-5000");
  const [qty, setQty] = useState(1);
  const [confirming, setConfirming] = useState(false);
  // 一行 3 张：按容器宽度算卡宽(百分比 + gap 会超 1px 掉成两列)
  const [gridW, setGridW] = useState(0);
  const cardW = gridW ? Math.floor((gridW - GAP * 2) / 3) : undefined;
  const pack = CREDIT_PACKS.find((p) => p.id === selected)!;
  const bonus = promoBonus(state);
  const total = pack.price * qty;

  return (
    <PaySheet
      title="Buy credits"
      onClose={onClose}
      overlay={
        // App Store 内购确认：系统样式，照真机还原;盖整屏，不放进面板的滚动区
        confirming ? (
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
              // 内购失败时留在面板上，可以再试
              if (state.storekit.purchase !== "failed") onClose();
            }}
          />
        ) : null
      }
    >
      <View style={{ gap: 14 }}>
        <Text style={[gz.body.caption, { color: c.text2 }]}>{bonus > 0 ? `Top-up credits never expire. +${bonus}% bonus while the offer is live.` : "Top-up credits never expire."}</Text>
        {pricesUnavailable(state) ? (
          <PayPriceError rows={3} />
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
                    accessibilityLabel={`${fmt(p.credits)} credits, $${p.price}`}
                    style={({ pressed }) => [styles.card, cardW ? { width: cardW } : null, on && styles.cardOn, pressed && !on && { opacity: 0.75 }]}
                  >
                    {p.popular ? (
                      <View style={styles.popular}>
                        <Text style={[gz.display.tiny, { color: c.ink }]}>Popular</Text>
                      </View>
                    ) : null}
                    <Coin size={18} />
                    <Text style={[gz.display.head, { color: on ? c.ink : c.white, fontVariant: ["tabular-nums"], marginTop: 2 }]}>{fmt(p.credits)}</Text>
                    {bonus > 0 ? <Text style={[gz.display.tiny, { color: on ? c.ink : c.butter }]}>{`+${fmt(withBonus(state, p.credits) - p.credits)}`}</Text> : null}
                    <Text style={[gz.display.label, { color: on ? c.ink : c.text2, fontVariant: ["tabular-nums"] }]}>{`$${p.price}`}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.qtyRow}>
              <Text style={[gz.display.label, { color: c.white }]}>Quantity</Text>
              <View style={styles.stepper}>
                <Pressable onPress={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} accessibilityRole="button" accessibilityLabel="Decrease" hitSlop={{ top: 4, bottom: 4 }} style={[styles.stepBtn, qty <= 1 && { opacity: 0.3 }]}>
                  {/* 图标库没有 minus:画一道和 plus 同粗的横线 */}
                  <View style={{ width: 13, height: 2.8, borderRadius: 2, backgroundColor: c.white }} />
                </Pressable>
                <Text style={[gz.display.head, { color: c.white, minWidth: 22, textAlign: "center" }]}>{qty}</Text>
                <Pressable onPress={() => setQty((q) => Math.min(MAX_QTY, q + 1))} disabled={qty >= MAX_QTY} accessibilityRole="button" accessibilityLabel="Increase" hitSlop={{ top: 4, bottom: 4 }} style={[styles.stepBtn, qty >= MAX_QTY && { opacity: 0.3 }]}>
                  <Icon name="plus" size={18} color={c.white} strokeWidth={2.8} />
                </Pressable>
              </View>
            </View>

            <GZButton label="Continue" onPress={() => setConfirming(true)} />
          </>
        )}
      </View>
    </PaySheet>
  );
}

const styles = StyleSheet.create({
  // 8 档排成 3 / 3 / 2;上面留出 Popular 压边的空间
  grid: { flexDirection: "row", flexWrap: "wrap", columnGap: GAP, rowGap: 14, paddingTop: 8 },
  card: { width: "31%", alignItems: "center", paddingTop: 16, paddingBottom: 12, borderRadius: 16, backgroundColor: c.raised, borderWidth: gz.cut, borderColor: "transparent", gap: 3 },
  cardOn: { backgroundColor: c.butter, borderColor: c.white, transform: [{ rotate: "-2deg" }] },
  popular: { position: "absolute", top: -11, alignSelf: "center", height: 22, paddingHorizontal: 8, borderRadius: 7, backgroundColor: c.lime, borderWidth: 2, borderColor: c.white, justifyContent: "center", transform: [{ rotate: "3deg" }] },
  qtyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  stepper: { flexDirection: "row", alignItems: "center", backgroundColor: c.raised, borderRadius: 999 },
  stepBtn: { width: 44, height: 38, alignItems: "center", justifyContent: "center" },
});
