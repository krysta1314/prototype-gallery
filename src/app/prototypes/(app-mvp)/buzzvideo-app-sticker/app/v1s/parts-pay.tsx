/* 贴纸风 · 付费相关几块屏(付费墙 / 挽留页 / 积分包 / 首页运营弹窗)共用的小积木。
 * 逻辑照搬第一版(PriceError / WebLink / Sheet 的出入场契约),只换样子:黑底、贴纸色、展示字体，不用渐变 / 光晕 / 回弹 */

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { GZButton, GZIconButton, gz } from "../../kit/gz";
import { useSheetPresence } from "../../../buzzvideo-app/app/components/sheet-presence";
import { showWebLink } from "../../../buzzvideo-app/app/store";
import { Icon, keyboardHeight, prefersReducedMotion, useInsets, useKeyboard, useStore } from "../v1";

const c = gz.color;
/** 快速减速、不回弹(同组件库 useSlap) */
export const EASE = Easing.bezier(0.16, 1, 0.3, 1);
export const fmt = (n: number) => n.toLocaleString("en-US");

/**
 * 拿不到 App Store 价格(断网或拉价失败)时代替价格选项和购买按钮(同第一版 PriceError,spec §2.5):
 * 骨架 + 说明 + Retry,不显示写死的价格，也不能购买
 */
export function PayPriceError({ rows = 2 }: { rows?: number }) {
  const { state, dispatch } = useStore();
  const retry = () => dispatch({ type: "showToast", text: state.faults.offline ? "Still offline. Check your connection." : "Still couldn't load prices. Try again later." });
  return (
    <View style={{ gap: 8 }}>
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} style={styles.skeleton} />
      ))}
      <Text style={[gz.body.caption, { color: c.text2, textAlign: "center", marginVertical: 4 }]}>{state.faults.offline ? "You're offline, so we can't show prices." : "Couldn't load prices."}</Text>
      <GZButton label="Retry" variant="white" onPress={retry} />
    </View>
  );
}

/** 美区网页付款外链(同第一版 WebLink,spec §2.4):只在美区显示，不抢内购主按钮 */
export function PayWebLink({ label }: { label: string }) {
  const { state, dispatch } = useStore();
  if (!showWebLink(state)) return null;
  return (
    <Pressable onPress={() => dispatch({ type: "showToast", text: "Opens buzzvideo.ai in your browser" })} accessibilityRole="link" hitSlop={13} style={{ alignSelf: "center" }}>
      <Text style={[gz.display.label, { color: c.text2 }]}>{label} ›</Text>
    </Pressable>
  );
}

/** Terms · Privacy(审核必需) */
export function LegalLinks() {
  const { dispatch } = useStore();
  const toast = (text: string) => dispatch({ type: "showToast", text });
  return (
    <View style={{ flexDirection: "row", justifyContent: "center", gap: 8 }}>
      <Pressable onPress={() => toast("Opens Terms of Service")} accessibilityRole="link" hitSlop={13}>
        <Text style={[gz.body.caption, styles.link]}>Terms</Text>
      </Pressable>
      <Text style={[gz.body.caption, { color: c.text3 }]}>·</Text>
      <Pressable onPress={() => toast("Opens Privacy Policy")} accessibilityRole="link" hitSlop={13}>
        <Text style={[gz.body.caption, styles.link]}>Privacy</Text>
      </Pressable>
    </View>
  );
}

/** ✕ 晚一点淡入:closable 前不可点 */
export function DelayedClose({ opacity, closable, onPress }: { opacity: Animated.Value; closable: boolean; onPress: () => void }) {
  return (
    <Animated.View style={{ opacity }} pointerEvents={closable ? "auto" : "none"}>
      <GZIconButton icon="x" onPress={onPress} label="Close" />
    </Animated.View>
  );
}

/**
 * 底部面板(贴纸风):贴底，上面两个大圆角，抓手 + 展示字体标题 + 右上 ×。
 * 出入场契约同第一版 Sheet:读 SheetPresence,visible=false 时播退场，播完调 onExited 再卸载;
 * 进出都用快速缓动，不用弹簧
 */
export function PaySheet({ title, onClose, children, overlay }: { title: string; onClose: () => void; children: ReactNode; /** 盖在整屏上的一层(如 App Store 内购确认),不放进面板的滚动区 */ overlay?: ReactNode }) {
  const insets = useInsets();
  const kb = useKeyboard();
  const kbH = keyboardHeight(kb);
  const { visible, onExited } = useSheetPresence();
  const [anim] = useState(() => new Animated.Value(0));
  const visibleRef = useRef(visible);
  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);
  useEffect(() => {
    const reduced = prefersReducedMotion();
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: reduced ? 0 : visible ? 300 : 220,
      easing: visible ? EASE : Easing.in(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && !visibleRef.current) onExited();
    });
  }, [visible, anim, onExited]);
  // 插值节点要稳定：整棵树重渲染时每次新建插值会把进行中的动画停掉
  const translateY = useMemo(() => anim.interpolate({ inputRange: [0, 1], outputRange: [700, 0] }), [anim]);
  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: visible ? "auto" : "none" }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: anim }]}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }} onPress={onClose} accessibilityLabel="Close" />
      </Animated.View>
      <Animated.View style={[styles.sheet, { bottom: kbH, paddingBottom: kb.open ? 0 : insets.bottom, transform: [{ translateY }] }]}>
        <View style={styles.grabber} />
        <View style={styles.sheetHead}>
          <Text style={[gz.display.head, { color: c.white }]} accessibilityRole="header">
            {title}
          </Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={10} style={styles.sheetClose}>
            <Icon name="x" size={22} color={c.text2} strokeWidth={2.4} />
          </Pressable>
        </View>
        <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          {children}
        </ScrollView>
      </Animated.View>
      {overlay}
    </View>
  );
}

/** 小实色标签(不歪;歪的是贴纸)。黑字 */
export function PayTag({ label, bg }: { label: string; bg: string }) {
  return (
    <View style={{ height: 22, paddingHorizontal: 7, borderRadius: 6, backgroundColor: bg, justifyContent: "center" }}>
      <Text style={[gz.display.tiny, { color: c.ink }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: { height: 56, borderRadius: 16, backgroundColor: c.raised },
  link: { color: c.text3, textDecorationLine: "underline" },
  sheet: { position: "absolute", left: 0, right: 0, maxHeight: "88%", backgroundColor: c.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  grabber: { alignSelf: "center", width: 40, height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.25)", marginTop: 8 },
  sheetHead: { height: 48, alignItems: "center", justifyContent: "center" },
  sheetClose: { position: "absolute", right: 16 },
});
