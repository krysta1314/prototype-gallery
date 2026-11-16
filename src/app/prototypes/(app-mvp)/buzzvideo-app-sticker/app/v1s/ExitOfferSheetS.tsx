import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { GZButton, GZSticker, gz, useSlap } from "../../kit/gz";
import IapConfirm from "../../../buzzvideo-app/app/components/IapConfirm";
import { countdown, useNow } from "../../../buzzvideo-app/app/components/useNow";
import { EXIT_OFFER } from "../../../buzzvideo-app/app/data";
import { CLOSE_DELAY_MS } from "../../../buzzvideo-app/app/screens/Paywall";
import { pricesUnavailable } from "../../../buzzvideo-app/app/store";
import { prefersReducedMotion, useInsets, useStore } from "../v1";
import { DelayedClose, PayPriceError } from "./parts-pay";

const c = gz.color;
const first = `$${EXIT_OFFER.firstMonth.toFixed(2)}`;

/**
 * 挽留页 · 贴纸风(逻辑同第一版 components/ExitOfferSheet,spec §4):Free 用户关付费墙时出现，盖住整个 APP;
 * 每台手机一次机会,24 小时内再关付费墙还会出现;真实倒计时，到期失效;续费价与优惠价同样醒目。
 * 样子：黑底，上半屏一张歪着贴的黄油色优惠券贴纸(黄油 = 奖励 / 礼物),券根是大倒计时;下半屏深灰面板放价格和唯一的橙色按钮。
 * 去掉了第一版的品牌渐变底、白色撕口券(虚线)和白色面板
 */
export default function ExitOfferSheet() {
  const { state, dispatch } = useStore();
  const insets = useInsets();
  const open = state.exitOfferOpen;
  // 进场从下往上推入，退场淡出后再卸载
  const [mounted, setMounted] = useState(open);
  const [anim] = useState(() => new Animated.Value(0));
  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  }, [open]);
  useEffect(() => {
    // 先挂载、下一轮再播入场：视图还没挂上就开始的动画不会推到视图上(停在透明)
    if (open && !mounted) {
      setMounted(true);
      return;
    }
    if (!mounted) return;
    const reduced = prefersReducedMotion();
    const a = Animated.timing(anim, { toValue: open ? 1 : 0, duration: reduced ? 0 : open ? 320 : 220, easing: open ? Easing.bezier(0.16, 1, 0.3, 1) : Easing.in(Easing.cubic), useNativeDriver: false });
    a.start(({ finished }) => {
      if (!finished && openRef.current === open) anim.setValue(open ? 1 : 0);
      if (!open && openRef.current === open) setMounted(false);
    });
  }, [open, mounted, anim]);
  // 插值节点要稳定：倒计时每秒重渲染，每次新建插值会把进行中的入场动画停掉
  const enter = useMemo(() => [styles.root, { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }] }], [anim]);
  const [confirming, setConfirming] = useState(state.demoExitIapOpen);
  const now = useNow();
  // ✕ 和付费墙一样晚 3 秒才淡入;拿不到价格时立即出现
  const noPricesNow = pricesUnavailable(state);
  const [closeOpacity] = useState(() => new Animated.Value(0));
  const [closable, setClosable] = useState(false);
  useEffect(() => {
    if (!open) {
      setClosable(false);
      closeOpacity.setValue(0);
      return;
    }
    const t = setTimeout(() => {
      setClosable(true);
      if (prefersReducedMotion()) closeOpacity.setValue(1);
      else Animated.timing(closeOpacity, { toValue: 1, duration: 240, useNativeDriver: false }).start();
    }, noPricesNow ? 0 : CLOSE_DELAY_MS);
    return () => clearTimeout(t);
  }, [open, closeOpacity, noPricesNow]);
  if (!mounted) return null;

  const dismiss = () => dispatch({ type: "dismissExitOffer" });
  const noPrices = pricesUnavailable(state);
  const left = state.exitOfferExpiresAt - now;
  return (
    <Animated.View style={enter} accessibilityViewIsModal>
      <View style={[styles.top, { paddingTop: insets.top }]}>
        <View style={styles.bar}>
          <DelayedClose opacity={closeOpacity} closable={closable} onPress={dismiss} />
        </View>
        <View style={styles.hero}>
          <Text style={[gz.display.hero, { color: c.white }]} accessibilityRole="header">
            Wait! A gift before you go
          </Text>
          <Coupon left={left} />
        </View>
      </View>

      <View style={[styles.panel, { paddingBottom: insets.bottom + 12 }]}>
        {/* 拿不到 App Store 价格：不显示写死的价格，也不能购买 */}
        {noPrices ? (
          <PayPriceError rows={1} />
        ) : (
          <>
            <View style={styles.priceRow}>
              <Text style={styles.price}>{first}</Text>
              <Text style={styles.strike}>{`$${EXIT_OFFER.then}`}</Text>
              <View style={{ alignSelf: "center" }}>
                <GZSticker label="50% off" color="lime" size="s" rotate={-4} />
              </View>
            </View>
            {/* 续费价和优惠价同样醒目，不藏 */}
            <Text style={[gz.body.strong, { color: c.text2, marginTop: -4 }]}>{`First month of Starter, then $${EXIT_OFFER.then}/month. Cancel anytime.`}</Text>
            <Text style={[gz.display.label, { color: c.lime, marginTop: -4 }]}>{`You save $${(EXIT_OFFER.then - EXIT_OFFER.firstMonth).toFixed(2)} on your first month`}</Text>
            <GZButton label="Get my 50% off now" onPress={() => setConfirming(true)} />
          </>
        )}
        <Pressable onPress={dismiss} accessibilityRole="button" hitSlop={8} style={{ alignSelf: "center", paddingVertical: 4 }}>
          <Text style={[gz.display.label, { color: c.text2 }]}>Maybe later</Text>
        </Pressable>
      </View>

      {/* App Store 内购确认：系统样式，照真机还原 */}
      {confirming ? (
        <IapConfirm
          product="BuzzVideo Starter (Monthly)"
          badge="STARTER 1M"
          price={`${first} for 1 month, then $${EXIT_OFFER.then}/month`}
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            setConfirming(false);
            dispatch({ type: "acceptExitOffer", now: Date.now() });
          }}
        />
      ) : null}
    </Animated.View>
  );
}

/** 优惠券贴纸：黄油色实色 + 白模切边 + 歪 -3°,啪地贴上;中间一条实线隔开券根(大倒计时) */
/** 挽留券：票根形状(第一版的券样式，Monica 指定)——上下两联中间一道撕口，左右各咬一个半圆缺口;新版设计的黄油色 + 白模切边，放正不歪 */
function Coupon({ left }: { left: number }) {
  const slap = useSlap(120);
  // 缺口对齐上下两联的分界线
  const [cutY, setCutY] = useState(0);
  return (
    <Animated.View style={slap}>
      <View style={styles.ticket}>
        <View style={styles.coupon}>
          <View style={styles.couponTop} onLayout={(e) => setCutY(e.nativeEvent.layout.height + 3)}>
            <Text style={styles.big}>50% OFF</Text>
            <Text style={[gz.body.strong, { color: c.ink }]}>Make watermark-free videos all month for just $9.50</Text>
          </View>
          <View style={styles.cut} />
          <View style={styles.stub}>
            <Text style={[gz.display.label, { color: "rgba(0,0,0,0.65)" }]}>This offer expires in</Text>
            <Text style={styles.count}>{countdown(left)}</Text>
          </View>
        </View>
        {cutY ? (
          <>
            <View style={[styles.notch, { top: cutY - NOTCH / 2, left: -NOTCH / 2 }]} />
            <View style={[styles.notch, { top: cutY - NOTCH / 2, right: -NOTCH / 2 }]} />
          </>
        ) : null}
      </View>
    </Animated.View>
  );
}

const NOTCH = 28;

const styles = StyleSheet.create({
  // 盖住整个 APP(含 Tab 栏),是一页而不是首页上的弹层
  root: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 30, backgroundColor: c.black },
  top: { flex: 1, paddingHorizontal: 16 },
  bar: { height: 52, flexDirection: "row", alignItems: "center" },
  hero: { flex: 1, justifyContent: "center", gap: 22, paddingBottom: 24, paddingHorizontal: 4 },

  // 券面放正(Monica:这里不要倾斜)，倒计时数字要好读
  // 外层裁掉缺口伸到券外的那一半;缺口是页面底色的圆 + 白边，正好接上券的白模切边
  ticket: { position: "relative", overflow: "hidden", borderRadius: 22 },
  coupon: { backgroundColor: c.butter, borderRadius: 22, borderWidth: 3, borderColor: c.white },
  notch: { position: "absolute", width: NOTCH, height: NOTCH, borderRadius: NOTCH / 2, backgroundColor: c.black, borderWidth: 3, borderColor: c.white },
  couponTop: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, gap: 6 },
  big: { fontFamily: gz.display.hero.fontFamily, fontWeight: "800", fontSize: 72, lineHeight: 70, letterSpacing: -3, color: c.ink },
  // 撕口：一道实线(不用虚线)，两头留给缺口
  cut: { height: 2, marginHorizontal: NOTCH / 2 + 8, backgroundColor: "rgba(0,0,0,0.18)" },
  stub: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 18, alignItems: "center", gap: 2 },
  count: { fontFamily: gz.display.hero.fontFamily, fontWeight: "800", fontSize: 46, lineHeight: 50, letterSpacing: -1, color: c.ink, fontVariant: ["tabular-nums"] },

  panel: { backgroundColor: c.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingTop: 20, gap: 12 },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 10 },
  price: { fontFamily: gz.display.hero.fontFamily, fontWeight: "800", fontSize: 44, lineHeight: 46, letterSpacing: -1.5, color: c.white },
  strike: { ...gz.display.title, color: c.text3, textDecorationLine: "line-through" },
});
