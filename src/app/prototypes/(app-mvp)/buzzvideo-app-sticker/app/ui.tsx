import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Animated, Easing, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { GZCredits, GZFlame, GZIconButton, GZStack, gz, isErrorToast } from "../kit/gz";
import { STREAK, aspect, creator, isVertical, poster } from "./data";
import { useCredits, useV2 } from "./store";
import { useStill } from "./still";
import { Icon, USER, useInsets, useKeyboard, keyboardHeight, useNav, useStore } from "./v1";

/* 贴纸风新原型的公共积木。视觉全部按 kit/gz.tsx:不用渐变 / 光晕 / 回弹;青柠圈 = 有没看过的新内容 */

const c = gz.color;
/** 快速减速、不回弹(同组件库 useSlap) */
const EASE = Easing.bezier(0.16, 1, 0.3, 1);

/** 示例账号头像用哪条视频的封面，以及纵向取景位置(0 = 顶部) */
const AVATAR_OF: Record<string, string> = { mochi: "poodle", neon: "kpop", reel: "gatsby", oddhistory: "napoleon", fruitdrama: "fruit", kai: "scooter", luna: "alice" };
const AVATAR_Y: Record<string, number> = { mochi: 0.5, neon: 0.08, reel: 0.12, oddhistory: 0.1, fruitdrama: 0.3, kai: 0.55, luna: 0.25 };

/** 创作者头像(示例账号取自它的一条视频封面;官方号用 APP 图标);me = 当前用户。ring = 白描边(压在视频上) */
export function Avatar({ id, size = 40, ring }: { id: string | "me"; size?: number; ring?: boolean }) {
  const box = { width: size, height: size, borderRadius: size / 2, backgroundColor: c.raised };
  const border = ring ? { borderWidth: 2, borderColor: c.white } : null;
  if (id === "me") return <Image source={{ uri: USER.avatar }} style={[box, border]} accessibilityLabel="You" />;
  const cr = creator(id);
  if (id === "buzz")
    return (
      <View style={[box, border, { overflow: "hidden", alignItems: "center", justifyContent: "center", backgroundColor: "#000" }]} accessibilityLabel={cr.name}>
        <Image source={{ uri: "/prototypes/buzzvideo-app/app-logo.svg" }} style={{ width: size * 0.62, height: size * 0.62 }} resizeMode="contain" />
      </View>
    );
  const src = AVATAR_OF[cr.id] ?? "poodle";
  return (
    <View style={[box, border, { overflow: "hidden" }]} accessibilityLabel={cr.name}>
      {isVertical(src) ? <Image source={{ uri: poster(src) }} style={{ width: size, height: size * 1.78, marginTop: -size * (AVATAR_Y[cr.id] ?? 0.2) }} resizeMode="cover" /> : <Image source={{ uri: poster(src) }} style={{ width: size, height: size }} resizeMode="cover" />}
    </View>
  );
}

/** 圆形头像图(朋友等直接给图片地址的) */
export const Face = ({ uri, size = 40, border }: { uri: string; size?: number; border?: string }) => <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: c.raised, borderWidth: border ? 2 : 0, borderColor: border }} />;

/** 叠在一起的头像:社交证明的最小单位(组件库 GZStack) */
export function Stack({ uris, size = 22, ring = "#000" }: { uris: string[]; size?: number; ring?: string }) {
  return <GZStack uris={uris} size={size} ring={ring} />;
}

/** 头像圈:青柠粗圈 + 黑缝 = 有没看过的新作品;seen = 没有圈(只留同样的占位，排版不跳) */
export function RingAvatar({ children, size = 60, seen }: { children: ReactNode; size?: number; seen?: boolean }) {
  return (
    <View style={{ width: size + 8, height: size + 8, borderRadius: (size + 8) / 2, backgroundColor: seen ? "transparent" : c.lime, alignItems: "center", justifyContent: "center" }}>
      <View style={{ width: size + 3, height: size + 3, borderRadius: (size + 3) / 2, backgroundColor: c.page, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>{children}</View>
    </View>
  );
}

/** 火苗 + 天数:发作品的连续天数。chip = 橙色火苗贴纸(组件库 GZFlame);否则行内小火苗 + 展示字体数字 */
export function Flame({ n, size = 14, chip }: { n: number; size?: number; chip?: boolean }) {
  if (chip) return <GZFlame n={n} />;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }} accessibilityLabel={`${n}-day posting streak`}>
      <Icon name="flame" size={size + 3} color={c.orange} fill={n ? c.orange : "transparent"} strokeWidth={2} />
      <Text style={[gz.display.label, { color: c.white, fontSize: size, lineHeight: size + 3 }]}>{n}</Text>
    </View>
  );
}

/**
 * 全屏播放的画面区:9:16 竖版铺满;其他比例(16:9、4:3、1:1)按原比例居中，上下留黑，不裁切
 */
export function Stage({ id, children }: { id: string; children: ReactNode }) {
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: c.black, alignItems: "center", justifyContent: "center" }]}>
      <View style={isVertical(id) ? StyleSheet.absoluteFill : { width: "100%", aspectRatio: aspect(id) }}>{children}</View>
    </View>
  );
}

/** 二级页导航栏:圆形返回 + 居中展示字体标题 + 右侧;onImage = 浮在画面上 */
export function Header({ title, right, onBack, tone = "page" }: { title?: string; right?: ReactNode; onBack?: () => void; tone?: "page" | "onImage" }) {
  const insets = useInsets();
  const { d } = useV2();
  return (
    <View style={[styles.header, { paddingTop: insets.top }, tone === "onImage" && styles.headerFloat]}>
      <View style={styles.headerSide}>
        <GZIconButton icon="chevron-left" size={36} onVideo={tone === "onImage"} onPress={onBack ?? (() => d({ type: "pop" }))} label="Back" />
      </View>
      <Text style={[gz.display.head, { color: c.white, flex: 1, textAlign: "center" }]} numberOfLines={1} accessibilityRole="header">
        {title ?? ""}
      </Text>
      <View style={[styles.headerSide, { alignItems: "flex-end" }]}>{right}</View>
    </View>
  );
}

/** 积分:黄油色硬币贴纸，点了进任务中心 */
export function CreditsChip({ onVideo }: { onVideo?: boolean }) {
  const credits = useCredits();
  const { d } = useV2();
  return (
    <Pressable onPress={() => d({ type: "push", route: { name: "rewards" } })} hitSlop={6} accessibilityRole="button" style={({ pressed }) => [pressed && { transform: [{ scale: 0.95 }] }]}>
      <GZCredits n={credits} onVideo={onVideo} />
    </Pressable>
  );
}

/** 底部面板(组件库 GZSheet 的形态):贴底，上面两个大圆角，抓手 + 展示字体标题 + 右上 ×;快速减速滑上来，不回弹 */
export function BottomSheet({ title, onClose, children, maxH = 0.78, flush }: { title?: string; onClose: () => void; children: ReactNode; maxH?: number; flush?: boolean }) {
  const insets = useInsets();
  const kb = useKeyboard();
  const kbH = keyboardHeight(kb);
  const anim = useState(() => new Animated.Value(0))[0];
  const [h, setH] = useState(800);
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 300, easing: EASE, useNativeDriver: false }).start();
  }, [anim]);
  const close = () => Animated.timing(anim, { toValue: 0, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: false }).start(() => onClose());
  // 插值节点要稳定:后面的视频在播、整棵树会重渲染，每次新建插值会把进行中的进场动画停掉
  const translateY = useMemo(() => anim.interpolate({ inputRange: [0, 1], outputRange: [700, 0] }), [anim]);
  return (
    <View style={StyleSheet.absoluteFill} onLayout={(e) => setH(e.nativeEvent.layout.height)}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: anim }]}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)" }} onPress={close} accessibilityLabel="Close" />
      </Animated.View>
      <Animated.View style={[styles.sheet, { bottom: kbH, paddingBottom: kb.open ? 0 : insets.bottom, maxHeight: (h - kbH) * maxH, transform: [{ translateY }] }]}>
        <View style={styles.grabber} />
        <View style={styles.sheetHead}>
          <Text style={[gz.display.head, { color: c.white }]}>{title ?? ""}</Text>
          <Pressable onPress={close} accessibilityLabel="Close" hitSlop={10} style={styles.sheetClose}>
            <Icon name="x" size={22} color={c.text2} strokeWidth={2.4} />
          </Pressable>
        </View>
        {flush ? children : <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>{children}</ScrollView>}
      </Animated.View>
    </View>
  );
}

/** 顶部提示:一颗青柠贴纸，啪地贴上(组件库 GZToast 的样子;文字可能比较长，所以允许换行) */
export function Toast2() {
  const { s } = useV2();
  const insets = useInsets();
  if (!s.toast) return null;
  return (
    <View style={[styles.toastWrap, { top: insets.top + 8, pointerEvents: "none" }]} accessibilityLiveRegion="polite">
      <ToastSticker key={s.toast} text={s.toast} />
    </View>
  );
}
function ToastSticker({ text }: { text: string }) {
  const [v] = useState(() => new Animated.Value(0));
  // 旅程图(静帧)里直接停在贴好的样子(后台标签页动画不走)
  const still = useStill();
  useEffect(() => {
    if (still) {
      v.setValue(1);
      return;
    }
    const a = Animated.timing(v, { toValue: 1, duration: 260, easing: EASE, useNativeDriver: false });
    a.start();
    return () => a.stop();
  }, [v, still]);
  const anim = useMemo(() => ({ opacity: v.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }), transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1.2, 1] }) }, { rotate: "-2deg" }] }), [v]);
  return (
    <Animated.View style={[styles.toast, isErrorToast(text) && { backgroundColor: c.red }, anim]}>
      <Text style={[gz.display.label, { color: isErrorToast(text) ? c.white : c.ink, textAlign: "center" }]}>{text}</Text>
    </Animated.View>
  );
}

/** 签到到账横幅:打开 APP 自动领，顶部一块黄油色贴纸(黄油 = 积分 / 今天)啪地贴上，4 秒后自己收起;点一下进任务中心 */
export function DailyBanner() {
  const { s, d } = useV2();
  const insets = useInsets();
  // 收起靠计时器直接卸载(不等动画回调，后台标签页里动画会暂停)
  const [y] = useState(() => new Animated.Value(0));
  const b = s.banner;
  // 旅程图(静帧)里横幅停在贴上的那一刻，不自动收起，不然截图里看不到
  const still = useStill();
  useEffect(() => {
    if (!b) return;
    if (still) {
      y.setValue(1);
      return;
    }
    y.setValue(0);
    Animated.timing(y, { toValue: 1, duration: 280, easing: EASE, useNativeDriver: false }).start();
    const tm = setTimeout(() => d({ type: "hideBanner" }), 4000);
    return () => clearTimeout(tm);
  }, [b, y, d, still]);
  const anim = useMemo(() => ({ opacity: y.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }), transform: [{ scale: y.interpolate({ inputRange: [0, 1], outputRange: [1.12, 1] }) }, { rotate: "-1.5deg" }] }), [y]);
  if (!b) return null;
  const next = STREAK[b.day % STREAK.length];
  return (
    <Animated.View style={[styles.banner, { top: insets.top + 6 }, anim]}>
      <Pressable onPress={() => d({ type: "push", route: { name: "rewards" } })} style={styles.bannerIn} accessibilityRole="button" accessibilityLabel={`Day ${b.day}: ${b.amount} credits added`}>
        <View style={styles.bannerIcon}>
          <Icon name="gift" size={20} color={c.butter} strokeWidth={2.4} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[gz.display.label, { color: c.ink }]}>
            Day {b.day} · {b.amount} credits added
          </Text>
          <Text style={[gz.body.caption, { color: "rgba(0,0,0,0.7)", marginTop: 2 }]}>{b.day === 7 ? "You finished the week. It starts over tomorrow." : `Come back tomorrow for ${next}.`}</Text>
        </View>
        <Text style={[gz.display.title, { color: c.ink }]}>+{b.amount}</Text>
      </Pressable>
    </Animated.View>
  );
}

/** 打开第一版的全屏页(设置、付费墙…) */
export function useV1Routes() {
  const { navigate } = useNav();
  const { dispatch } = useStore();
  return {
    settings: () => navigate({ type: "push", route: { name: "settings" } }),
    invite: () => navigate({ type: "push", route: { name: "inviteFriends" } }),
    paywall: () => dispatch({ type: "openPaywall", trigger: "manual" }),
  };
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, minHeight: 52, backgroundColor: c.page, zIndex: 5 },
  headerFloat: { position: "absolute", left: 0, right: 0, top: 0, backgroundColor: "transparent" },
  headerSide: { minWidth: 44, flexDirection: "row", alignItems: "center" },
  sheet: { position: "absolute", left: 0, right: 0, backgroundColor: c.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: "hidden" },
  grabber: { alignSelf: "center", width: 40, height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.25)", marginTop: 8 },
  sheetHead: { height: 48, alignItems: "center", justifyContent: "center" },
  sheetClose: { position: "absolute", right: 16, top: 13 },
  toastWrap: { position: "absolute", left: 0, right: 0, alignItems: "center", zIndex: 60 },
  toast: { maxWidth: "86%", paddingHorizontal: 16, paddingVertical: 10, minHeight: 40, borderRadius: 12, borderWidth: gz.cut, borderColor: c.white, backgroundColor: c.lime, justifyContent: "center" },
  banner: { position: "absolute", left: 10, right: 10, zIndex: 70 },
  bannerIn: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 18, backgroundColor: c.butter, borderWidth: gz.cut, borderColor: c.white },
  bannerIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.ink, alignItems: "center", justifyContent: "center" },
});
