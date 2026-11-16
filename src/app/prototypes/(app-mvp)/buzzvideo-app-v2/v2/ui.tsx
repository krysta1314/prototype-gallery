import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Animated, Easing, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { STREAK, aspect, creator, isVertical, poster } from "./data";
import { KIconButton } from "./kit/components";
import { tk } from "./kit/tokens";
import { useCredits, useV2 } from "./store";
import { Coin, CountingNumber, Gradient, Icon, USER, useInsets, useKeyboard, keyboardHeight, useNav, useStore } from "./v1";

/* 第二版的公共积木。视觉全部按组件库(v2/kit,TikTok 风格);社交积木(头像叠、渐变圈、火苗)来自社交 APP 设计稿 */

const c = tk.color;
const t = tk.type;
export const BRAND = ["#FFA73C", "#FF5255"];

/** 示例账号头像用哪条视频的封面，以及纵向取景位置(0 = 顶部) */
const AVATAR_OF: Record<string, string> = { mochi: "poodle", neon: "kpop", reel: "gatsby", oddhistory: "napoleon", fruitdrama: "fruit", kai: "scooter", luna: "alice" };
const AVATAR_Y: Record<string, number> = { mochi: 0.5, neon: 0.08, reel: 0.12, oddhistory: 0.1, fruitdrama: 0.3, kai: 0.55, luna: 0.25 };

/** 创作者头像(示例账号取自它的一条视频封面;官方号用 APP 图标);me = 当前用户 */
export function Avatar({ id, size = 40, ring }: { id: string | "me"; size?: number; ring?: boolean }) {
  const box = { width: size, height: size, borderRadius: size / 2, backgroundColor: c.raised };
  const border = ring ? { borderWidth: 1.5, borderColor: c.white } : null;
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
export const Face = ({ uri, size = 40, border }: { uri: string; size?: number; border?: string }) => <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: c.raised, borderWidth: border ? 1.5 : 0, borderColor: border }} />;

/** 叠在一起的头像:社交证明的最小单位 */
export function Stack({ uris, size = 22, ring = "#000" }: { uris: string[]; size?: number; ring?: string }) {
  return (
    <View style={{ flexDirection: "row" }}>
      {uris.map((u, i) => (
        <Image key={i} source={{ uri: u }} style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 1.5, borderColor: ring, marginLeft: i ? -size * 0.35 : 0, backgroundColor: c.raised }} />
      ))}
    </View>
  );
}

/** 品牌渐变圈头像(朋友有没看过的新作品，像故事圈);seen = 灰圈 */
export function RingAvatar({ children, size = 60, seen }: { children: ReactNode; size?: number; seen?: boolean }) {
  return (
    <View style={{ width: size + 6, height: size + 6, borderRadius: (size + 6) / 2, overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
      {seen ? <View style={[StyleSheet.absoluteFill, { backgroundColor: c.line }]} /> : <Gradient colors={BRAND} angle={135} style={StyleSheet.absoluteFill} pointerEvents="none" />}
      <View style={{ width: size + 2, height: size + 2, borderRadius: (size + 2) / 2, backgroundColor: c.page, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>{children}</View>
    </View>
  );
}

/** 火苗 + 天数:发作品的连续天数 */
export function Flame({ n, size = 13, chip }: { n: number; size?: number; chip?: boolean }) {
  const body = (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }} accessibilityLabel={`${n}-day posting streak`}>
      <Icon name="flame" size={size + 3} color="#FF7A1A" fill={n ? "#FFB01A" : "transparent"} strokeWidth={1.5} />
      <Text style={{ color: c.white, fontSize: size, lineHeight: size + 4, fontWeight: "800" }}>{n}</Text>
    </View>
  );
  return chip ? <View style={styles.flameChip}>{body}</View> : body;
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

/** 二级页导航栏(组件库 KNavBar 的形态):返回 + 居中标题 + 右侧;onImage = 浮在画面上 */
export function Header({ title, right, onBack, tone = "page" }: { title?: string; right?: ReactNode; onBack?: () => void; tone?: "page" | "onImage" }) {
  const insets = useInsets();
  const { d } = useV2();
  return (
    <View style={[styles.header, { paddingTop: insets.top }, tone === "onImage" && styles.headerFloat]}>
      <KIconButton icon="chevron-left" onVideo={tone === "onImage"} onPress={onBack ?? (() => d({ type: "pop" }))} label="Back" />
      <Text style={[t.headline, { color: c.text, flex: 1, textAlign: "center" }]} numberOfLines={1} accessibilityRole="header">
        {title ?? ""}
      </Text>
      <View style={styles.headerRight}>{right}</View>
    </View>
  );
}

/** 积分胶囊:coin + 数字，点了进任务中心 */
export function CreditsChip({ onVideo }: { onVideo?: boolean }) {
  const credits = useCredits();
  const { d } = useV2();
  return (
    <Pressable onPress={() => d({ type: "push", route: { name: "rewards" } })} hitSlop={6} accessibilityLabel={`${credits} credits`} style={({ pressed }) => [styles.credits, { backgroundColor: onVideo ? c.onVideo : c.fill2 }, pressed && { opacity: 0.7 }]}>
      <Coin size={14} />
      <CountingNumber value={credits} style={[t.captionStrong, { color: c.white }]} />
    </Pressable>
  );
}

/** 底部面板:贴底通栏，只有上面两个角圆;标题 13pt 居中，右上 ×(组件库 KSheet 的形态，带进出场动画) */
export function BottomSheet({ title, onClose, children, maxH = 0.78, flush }: { title?: string; onClose: () => void; children: ReactNode; maxH?: number; flush?: boolean }) {
  const insets = useInsets();
  const kb = useKeyboard();
  const kbH = keyboardHeight(kb);
  const anim = useState(() => new Animated.Value(0))[0];
  const [h, setH] = useState(800);
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, stiffness: 320, damping: 32, mass: 1, overshootClamping: true, useNativeDriver: false }).start();
  }, [anim]);
  const close = () => Animated.timing(anim, { toValue: 0, duration: 220, easing: Easing.in(Easing.cubic), useNativeDriver: false }).start(() => onClose());
  // 插值节点要稳定:后面的视频在播、整棵树会重渲染，每次新建插值会把进行中的进场动画停掉
  const translateY = useMemo(() => anim.interpolate({ inputRange: [0, 1], outputRange: [700, 0] }), [anim]);
  return (
    <View style={StyleSheet.absoluteFill} onLayout={(e) => setH(e.nativeEvent.layout.height)}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: anim }]}>
        <Pressable style={{ flex: 1, backgroundColor: c.scrim }} onPress={close} accessibilityLabel="Close" />
      </Animated.View>
      <Animated.View style={[styles.sheet, { bottom: kbH, paddingBottom: kb.open ? 0 : insets.bottom, maxHeight: (h - kbH) * maxH, transform: [{ translateY }] }]}>
        <View style={styles.sheetHead}>
          <Text style={[t.captionStrong, { color: c.text }]}>{title ?? ""}</Text>
          <Pressable onPress={close} accessibilityLabel="Close" hitSlop={10} style={styles.sheetClose}>
            <Icon name="x" size={20} color={c.text2} strokeWidth={2} />
          </Pressable>
        </View>
        {flush ? children : <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>{children}</ScrollView>}
      </Animated.View>
    </View>
  );
}

/** 顶部 toast(组件库 KToast:8pt 圆角深色小条) */
export function Toast2() {
  const { s } = useV2();
  const insets = useInsets();
  if (!s.toast) return null;
  return (
    <View style={[styles.toastWrap, { top: insets.top + 8, pointerEvents: "none" }]} accessibilityLiveRegion="polite">
      <View style={styles.toast}>
        <Text style={[t.caption, { color: c.white, fontWeight: "500", textAlign: "center" }]}>{s.toast}</Text>
      </View>
    </View>
  );
}

/** 签到到账横幅:打开 APP 自动领，顶部滑下来，4 秒后自己收起;点一下进任务中心 */
export function DailyBanner() {
  const { s, d } = useV2();
  const insets = useInsets();
  // 从略高处滑下并淡入;收起靠计时器直接卸载(不等动画回调，后台标签页里动画会暂停)
  const [y] = useState(() => new Animated.Value(0));
  const b = s.banner;
  useEffect(() => {
    if (!b) return;
    y.setValue(0);
    Animated.spring(y, { toValue: 1, useNativeDriver: false, bounciness: 6 }).start();
    const tm = setTimeout(() => d({ type: "hideBanner" }), 4000);
    return () => clearTimeout(tm);
  }, [b, y, d]);
  const anim = useMemo(() => ({ opacity: y.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }), transform: [{ translateY: y.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }] }), [y]);
  if (!b) return null;
  const next = STREAK[b.day % STREAK.length];
  return (
    <Animated.View style={[styles.banner, { top: insets.top + 6 }, anim]}>
      <Pressable onPress={() => d({ type: "push", route: { name: "rewards" } })} style={styles.bannerIn} accessibilityRole="button" accessibilityLabel={`Day ${b.day}: ${b.amount} credits added`}>
        <View style={styles.bannerIcon}>
          <Gradient colors={BRAND} angle={135} style={StyleSheet.absoluteFill} pointerEvents="none" />
          <Icon name="gift" size={20} color={c.white} strokeWidth={2.2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[t.bodyStrong, { color: c.white }]}>Day {b.day} · {b.amount} credits added</Text>
          <Text style={[t.caption, { color: c.text2 }]}>{b.day === 7 ? "You finished the week. It starts over tomorrow." : `Come back tomorrow for ${next}.`}</Text>
        </View>
        <Text style={styles.bannerAmt}>+{b.amount}</Text>
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
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 4, minHeight: 44, backgroundColor: c.page, zIndex: 5 },
  headerFloat: { position: "absolute", left: 0, right: 0, top: 0, backgroundColor: "transparent" },
  headerRight: { minWidth: 44, alignItems: "center", flexDirection: "row", justifyContent: "flex-end" },
  credits: { flexDirection: "row", alignItems: "center", gap: 5, height: 30, paddingHorizontal: 10, borderRadius: tk.radius.full },
  flameChip: { height: 26, paddingHorizontal: 8, borderRadius: 13, backgroundColor: "rgba(255,122,26,0.16)", justifyContent: "center" },
  sheet: { position: "absolute", left: 0, right: 0, backgroundColor: c.surface, borderTopLeftRadius: tk.radius.lg, borderTopRightRadius: tk.radius.lg, overflow: "hidden" },
  sheetHead: { height: 48, alignItems: "center", justifyContent: "center" },
  sheetClose: { position: "absolute", right: 14, top: 14 },
  toastWrap: { position: "absolute", left: 0, right: 0, alignItems: "center", zIndex: 60 },
  toast: { maxWidth: "86%", paddingHorizontal: 14, paddingVertical: 10, borderRadius: tk.radius.md, backgroundColor: "rgba(40,40,40,0.96)" },
  banner: { position: "absolute", left: 8, right: 8, zIndex: 70 },
  bannerIn: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: tk.radius.lg, backgroundColor: "rgba(30,30,30,0.97)", borderWidth: StyleSheet.hairlineWidth, borderColor: c.line },
  bannerIcon: { width: 40, height: 40, borderRadius: 20, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  bannerAmt: { fontSize: 20, lineHeight: 24, fontWeight: "800", color: c.primary },
});
