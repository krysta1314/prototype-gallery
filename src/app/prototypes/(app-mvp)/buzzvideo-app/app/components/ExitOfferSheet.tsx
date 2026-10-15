import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { EXIT_OFFER } from "../data";
import { useStore } from "../provider";
import { colors, space, type } from "../theme";
import IapConfirm from "./IapConfirm";
import PrimaryButton from "./PrimaryButton";
import { countdown, useNow } from "./useNow";
import Sheet from "./Sheet";
import { SheetPresenceContext } from "./sheet-presence";

const first = `$${EXIT_OFFER.firstMonth.toFixed(2)}`;

/**
 * 挽留弹窗(spec §4):Free 用户第一次关付费墙时从底部升起,每账号一生一次。
 * 弹出起 24 小时有效:真实倒计时,期间可从首页横幅 / 付费墙回来买,到期就真的失效;续费价与优惠价同样醒目(FTC / 欧盟 UCPD)。
 * 真实 APP:单独的内购商品(如 starter_monthly_exit),同订阅组,首月 pay-as-you-go 50% off
 */
export default function ExitOfferSheet() {
  const { state, dispatch } = useStore();
  const open = state.exitOfferOpen;
  // 关掉后先播退场动画再卸载(和 Sheets 同一套 presence)
  const [mounted, setMounted] = useState(open);
  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);
  const onExited = useCallback(() => setMounted(false), []);
  const [confirming, setConfirming] = useState(false);
  const now = useNow();
  if (!mounted) return null;

  const dismiss = () => dispatch({ type: "dismissExitOffer" });
  return (
    <SheetPresenceContext.Provider value={{ visible: open, onExited }}>
      <Sheet onClose={dismiss}>
        <View style={styles.body}>
          <Text style={styles.title} accessibilityRole="header">
            Wait — your first month is 50% off
          </Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{first}</Text>
            <Text style={styles.strike}>{`$${EXIT_OFFER.then}`}</Text>
          </View>
          <Text style={styles.terms}>{`First month of Starter, then $${EXIT_OFFER.then}/month. Cancel anytime.`}</Text>
          {/* 真实倒计时:24 小时内可以从首页横幅 / 付费墙回来买,到期就真的失效 */}
          <Text style={styles.note}>{`Offer ends in ${countdown(state.exitOfferExpiresAt - now)}`}</Text>
          <PrimaryButton label="Get 50% off now" onPress={() => setConfirming(true)} />
          <Pressable onPress={dismiss} accessibilityRole="button" hitSlop={8} style={styles.skipWrap}>
            <Text style={styles.skip}>Maybe later</Text>
          </Pressable>
        </View>
      </Sheet>
      {confirming ? (
        <IapConfirm
          title="Confirm Subscription"
          message={`BuzzVideo Starter (Monthly)\n${first} for 1 month, then $${EXIT_OFFER.then}/month. Renews automatically until canceled.`}
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            setConfirming(false);
            dispatch({ type: "acceptExitOffer", now: Date.now() });
          }}
        />
      ) : null}
    </SheetPresenceContext.Provider>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: space.lg, gap: space.md },
  title: { ...type.title2, color: colors.ink },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: space.sm },
  price: { ...type.largeTitle, color: colors.ink },
  strike: { ...type.title2, fontWeight: "400", color: colors.sub, textDecorationLine: "line-through" },
  // 续费价用 body 粗体,和优惠价只差一级,不藏
  terms: { ...type.body, fontWeight: "600", color: colors.ink, marginTop: -space.xs },
  note: { ...type.footnote, color: colors.sub },
  skipWrap: { alignSelf: "center", paddingVertical: space.xs },
  skip: { ...type.subhead, color: colors.sub, fontWeight: "500" },
});
