import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { EXIT_OFFER } from "../data";
import { useInsets, useStore } from "../provider";
import { pricesUnavailable } from "../store";
import { colors, ctaGradient, radius, smoothCorners, space, type } from "../theme";
import Gradient from "./Gradient";
import IapConfirm from "./IapConfirm";
import IconButton from "./IconButton";
import { prefersReducedMotion } from "./motion";
import { CLOSE_DELAY_MS } from "../screens/Paywall";
import PriceError from "./PriceError";
import PrimaryButton from "./PrimaryButton";
import { countdown, useNow } from "./useNow";

const first = `$${EXIT_OFFER.firstMonth.toFixed(2)}`;
/** 下半屏购买面板的浅色(和付费墙一致) */
const L = { bg: "#ffffff", ink: "#16161d", sub: "#5f6070" };

/**
 * 挽留页(spec §4;2026-10-19 改成单独全屏页，不再是首页上的底部抽屉):Free 用户关付费墙时出现;每台手机一次机会(存本机),24 小时内再关付费墙还会出现。
 * 版式(2026-10-20 从 5 个方案里定了 E「品牌色 + 优惠券」):整屏品牌渐变，上半屏一张白色撕口优惠券(券根是大倒计时),下半屏白色面板放价格和按钮。
 * 弹出起 24 小时有效：真实倒计时，期间可从首页横幅 / 付费墙回来买，到期就真的失效;续费价与优惠价同样醒目(FTC / 欧盟 UCPD)。
 * 真实 APP:单独的内购商品(如 starter_monthly_exit),同订阅组，首月 pay-as-you-go 50% off
 */
export default function ExitOfferSheet() {
  const { state, dispatch } = useStore();
  const insets = useInsets();
  const open = state.exitOfferOpen;
  // 进场从下往上推入，退场淡出后再卸载
  const [mounted, setMounted] = useState(open);
  const [anim] = useState(() => new Animated.Value(0));
  const openRef = useRef(open);
  openRef.current = open;
  useEffect(() => {
    // 先挂载、下一轮再播入场：视图还没挂上就开始的动画不会推到视图上(停在透明)
    if (open && !mounted) {
      setMounted(true);
      return;
    }
    if (!mounted) return;
    const reduced = prefersReducedMotion();
    const a = Animated.timing(anim, { toValue: open ? 1 : 0, duration: reduced ? 0 : open ? 320 : 220, easing: open ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic), useNativeDriver: false });
    a.start(({ finished }) => {
      // 动画被中途打断(视图在入场时被重挂，比如从首页横幅点进来、横幅同一刻卸载):直接落到终点，不停在透明
      if (!finished && openRef.current === open) anim.setValue(open ? 1 : 0);
      if (!open && openRef.current === open) setMounted(false);
    });
  }, [open, mounted, anim]);
  // 插值节点要稳定：倒计时每秒重渲染，每次新建插值会在旧节点 detach 时把进行中的入场动画停掉(停在透明)
  const enter = useMemo(() => [styles.root, { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }] }], [anim]);
  const [confirming, setConfirming] = useState(state.demoExitIapOpen);
  const now = useNow();
  // ✕ 和付费墙一样晚 3 秒才淡入(2026-10-22);拿不到价格时什么都买不了，✕ 立即出现，不让用户被卡住
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
      {/* 背景：品牌色满版(CTA 渐变反向),压一层暗色，白字在橙色上才够对比 */}
      <Gradient colors={[ctaGradient[1], ctaGradient[0]]} angle={200} style={StyleSheet.absoluteFill} pointerEvents="none" />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(60,10,0,0.18)" }]} pointerEvents="none" />

      <View style={[styles.top, { paddingTop: insets.top }]}>
        <View style={styles.bar}>
          <Animated.View style={{ opacity: closeOpacity }} pointerEvents={closable ? "auto" : "none"}>
            <IconButton icon="x" tone="onImage" onPress={dismiss} accessibilityLabel="Close" />
          </Animated.View>
        </View>
        <HeroCombo left={left} />
      </View>

      <View style={[styles.panel, { paddingBottom: insets.bottom + space.md }]}>
        {/* 拿不到 App Store 价格(断网 / 拉价失败):不显示写死的价格，也不能购买 */}
        {noPrices ? (
          <PriceError rows={1} light />
        ) : (
          <>
            <View style={styles.priceRow}>
              <Text style={styles.price}>{first}</Text>
              <Text style={styles.strike}>{`$${EXIT_OFFER.then}`}</Text>
              <Text style={styles.save}>50% off</Text>
            </View>
            {/* 续费价和优惠价同样醒目，不藏 */}
            <Text style={styles.terms}>{`First month of Starter, then $${EXIT_OFFER.then}/month. Cancel anytime.`}</Text>
            <Text style={styles.save2}>{`You save $${(EXIT_OFFER.then - EXIT_OFFER.firstMonth).toFixed(2)} on your first month`}</Text>
            <PrimaryButton label="Get my 50% off now" onPress={() => setConfirming(true)} />
          </>
        )}
        <Pressable onPress={dismiss} accessibilityRole="button" hitSlop={8} style={styles.skipWrap}>
          <Text style={styles.skip}>Maybe later</Text>
        </Pressable>
      </View>

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

/** 撕口缺口的半径 */
const NOTCH_R = 12;
/**
 * 优惠券：上半(top)+ 撕口虚线 + 券根(stub)。两侧缺口是真镂空(遮罩挖掉半圆，透出背后的背景),
 * 不是盖一个同色圆(背景是渐变时颜色永远对不上)
 */
function Ticket({ top, stub }: { top: ReactNode; stub: ReactNode }) {
  const [cutY, setCutY] = useState(0);
  const y = cutY + NOTCH_R; // 缺口圆心 = 上半的高度 + 半个撕口
  const hole = (x: string) => `radial-gradient(circle ${NOTCH_R}px at ${x} ${y}px, transparent ${NOTCH_R - 0.5}px, #000 ${NOTCH_R}px)`;
  const mask = cutY ? { WebkitMaskImage: `${hole("0")}, ${hole("100%")}`, WebkitMaskComposite: "source-in", maskImage: `${hole("0")}, ${hole("100%")}`, maskComposite: "intersect" } : null;
  return (
    <View style={[styles.ticket, mask as object]}>
        <View onLayout={(e) => setCutY(e.nativeEvent.layout.height)}>{top}</View>
        <View style={styles.perf}>
          <View style={styles.perfLine} />
        </View>
        {stub}
    </View>
  );
}

/**整屏品牌渐变上放一张白色撕口优惠券，券根是大倒计时 */
function HeroCombo({ left }: { left: number }) {
  return (
    <View style={[styles.hero, { justifyContent: "center", gap: space.lg }]}>
      <Text style={styles.comboWait} accessibilityRole="header">
        Wait! A gift before you go
      </Text>
      {/* 不加阴影：阴影会投进缺口里，让缺口比背景深、看起来像两颗圆点 */}
      <Ticket
        top={
          <View style={styles.ticketTop}>
            <Text style={styles.comboBig}>50% OFF</Text>
            <Text style={styles.ticketSub}>Make watermark-free video ads all month for just $9.50</Text>
          </View>
        }
        stub={
          <View style={styles.comboStub}>
            <Text style={styles.stubLabel}>This offer expires in</Text>
            <Text style={styles.comboNum}>{countdown(left)}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // 盖住整个 APP(含 Tab 栏),是一页而不是首页上的弹层
  root: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 30, backgroundColor: "#0a0a10" },
  top: { flex: 1, paddingHorizontal: space.lg },
  bar: { height: 44, flexDirection: "row", alignItems: "center", marginLeft: -space.sm },
  hero: { flex: 1, justifyContent: "center", gap: space.lg, paddingBottom: space.xl },

  panel: {
    backgroundColor: L.bg,
    borderTopLeftRadius: radius.hero,
    borderTopRightRadius: radius.hero,
    ...smoothCorners,
    paddingHorizontal: space.lg,
    paddingTop: space.xl,
    gap: space.md,
  },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: space.sm },
  price: { ...type.largeTitle, color: L.ink },
  strike: { ...type.title2, fontWeight: "400", color: L.sub, textDecorationLine: "line-through" },
  // 折扣标签和旁边的划线价 $19 一样高(划线价 22/28):标签整体 28 高。
  // 一行按文字基线对齐;标签底边比自身文字基线低 8,上移 8 让底边落在 $9.50 / $19 的底线上
  save: { fontSize: 15, lineHeight: 20, fontWeight: "700", color: colors.white, backgroundColor: colors.accent, borderRadius: radius.full, overflow: "hidden", paddingHorizontal: 8, paddingVertical: 4, transform: [{ translateY: -8 }] },
  // 续费说明：二级文本色、小一号(2026-10-20 定);仍在价格正下方、对比度够(约 6:1),续费价看得清
  terms: { ...type.subhead, fontWeight: "500", color: L.sub, marginTop: -space.xs },
  skipWrap: { alignSelf: "center", paddingVertical: space.xs },
  skip: { ...type.subhead, color: L.sub, fontWeight: "500" },
  save2: { ...type.footnote, fontWeight: "700", color: "#c2410c", marginTop: -space.sm },

  // 优惠券
  ticket: { borderRadius: radius.lg, backgroundColor: colors.white, overflow: "visible" },
  ticketTop: { paddingHorizontal: 22, paddingTop: 24, paddingBottom: 18, gap: 6 },
  ticketSub: { ...type.subhead, fontWeight: "600", color: L.ink },
  perf: { height: NOTCH_R * 2, justifyContent: "center" },
  perfLine: { marginHorizontal: 18, borderTopWidth: 2, borderStyle: "dashed", borderColor: "#e3e3e8" },
  stubLabel: { ...type.subhead, fontWeight: "600", color: L.sub },

  comboWait: { fontSize: 30, lineHeight: 36, fontWeight: "800", color: colors.white, letterSpacing: -0.5 },
  comboBig: { fontSize: 76, lineHeight: 78, fontWeight: "900", color: "#e8430c", letterSpacing: -2 },
  comboStub: { paddingHorizontal: 22, paddingTop: 4, paddingBottom: 22, alignItems: "center", gap: 2 },
  comboNum: { fontSize: 48, lineHeight: 54, fontWeight: "800", color: L.ink, fontVariant: ["tabular-nums"], letterSpacing: -1 },

});
