/* BuzzVideo APP · 贴纸风(Gen-Z sticker)组件库 · 2026-11-11
 * Monica:第二版去 AI 味，往更潮的 Gen-Z 贴纸风走;改设计要另起一个原型，先做组件库给她确认。
 * 原则:
 *  - 底子仍是黑色视频 APP;颜色来自「贴纸」色块，不用渐变、不用光晕
 *  - 每种贴纸色只有一个意思：橙 = 主操作 / 品牌，青柠 = 朋友 / 新的，黄油 = 积分 / 奖励，天蓝 = 信息 / 分享，丁香 = 等级 / 身份，粉 = 点赞
 *  - 贴纸 = 实色 + 白色模切边 + 轻微歪斜;贴纸上的字一律黑色(也解决了橙底白字对比度不够的问题)
 *  - 大标题、大数字、贴纸字用粗展示字(Bricolage Grotesque),正文用系统字
 *  - 动效：贴上去的「啪」一下(快速缩放，减速曲线，不回弹)
 * 纯展示组件，不依赖 store;手机屏内是 React Native(react-native-web)。 */

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Animated, Easing, Image, Pressable, StyleSheet, Text, TextInput, View, type StyleProp, type ViewStyle } from "react-native";
import { Coin, Icon, type IconName } from "../../buzzvideo-app-v2/v2/v1";

export const DISPLAY = "var(--font-gz), 'Arial Black', system-ui, sans-serif";
const BODY = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', Inter, system-ui, sans-serif";

export const gz = {
  color: {
    black: "#000000",
    /** 非视频页的底 */
    page: "#0E0E0E",
    /** 面板、卡片 */
    surface: "#1A1A1A",
    raised: "#262626",
    ink: "#0A0A0A",
    white: "#FFFFFF",
    text: "rgba(255,255,255,0.94)",
    text2: "rgba(255,255,255,0.7)",
    text3: "rgba(255,255,255,0.5)",
    line: "rgba(255,255,255,0.14)",
    /** 贴纸色:每种只有一个意思 */
    orange: "#FF5E1A", // 主操作 / 品牌
    lime: "#D4FF3A", // 朋友 / 新的
    butter: "#FFE04D", // 积分 / 奖励
    sky: "#7CCBFF", // 信息 / 分享
    lilac: "#C3B1FF", // 等级 / 身份
    pink: "#FF7AC6", // 点赞 / 喜欢
    like: "#FF3B5C",
    red: "#FF3B30", // 出错 / 失败(只给失败提示用，白字)
  },
  /** 贴纸的白色模切边 */
  cut: 2.5,
  /** 粗展示字的几档 */
  display: {
    hero: { fontFamily: DISPLAY, fontSize: 34, lineHeight: 34, fontWeight: "800", letterSpacing: -1 },
    title: { fontFamily: DISPLAY, fontSize: 24, lineHeight: 26, fontWeight: "800", letterSpacing: -0.6 },
    head: { fontFamily: DISPLAY, fontSize: 18, lineHeight: 20, fontWeight: "800", letterSpacing: -0.3 },
    label: { fontFamily: DISPLAY, fontSize: 14, lineHeight: 16, fontWeight: "800", letterSpacing: -0.1 },
    tiny: { fontFamily: DISPLAY, fontSize: 12, lineHeight: 13, fontWeight: "800", letterSpacing: 0 },
  },
  body: {
    body: { fontFamily: BODY, fontSize: 15, lineHeight: 20, fontWeight: "400" },
    strong: { fontFamily: BODY, fontSize: 15, lineHeight: 20, fontWeight: "600" },
    caption: { fontFamily: BODY, fontSize: 13, lineHeight: 17, fontWeight: "400" },
    micro: { fontFamily: BODY, fontSize: 12, lineHeight: 15, fontWeight: "600" },
  },
  textShadow: { textShadowColor: "rgba(0,0,0,0.5)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
} as const;

export type GZColor = "orange" | "lime" | "butter" | "sky" | "lilac" | "pink" | "red" | "white" | "ink";

/** 失败 / 出错类提示(断网、登录失败、付款失败、找不到购买记录…)用红色贴纸;其他提示用青柠 */
const ERROR_RE = /couldn['’]?t|can['’]?t|didn['’]?t|wasn['’]?t|failed|offline|no internet|not enough|try again|invalid|expired|no purchases|belongs to another|already has a subscription|unable|error|went wrong/i;
export const isErrorToast = (text: string) => ERROR_RE.test(text);
const c = gz.color;
const fill = (k: GZColor) => (k === "white" ? c.white : k === "ink" ? c.ink : c[k]);
const inkOn = (k: GZColor) => (k === "ink" || k === "orange" || k === "red" ? c.white : c.ink); // 橙底、红底一律白字

/** 贴上去的「啪」:从 1.25 倍快速落到 1,带一点旋转回正。减少动态效果时直接出现 */
export function useSlap(delay = 0) {
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      v.setValue(1);
      return;
    }
    const a = Animated.timing(v, { toValue: 1, duration: 260, delay, easing: Easing.bezier(0.16, 1, 0.3, 1), useNativeDriver: false });
    a.start();
    return () => a.stop();
  }, [v, delay]);
  return useMemo(() => ({ opacity: v.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }), transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1.25, 1] }) }] }), [v]);
}

/* ============ 贴纸 ============ */

/** 文字贴纸：实色 + 白模切边 + 歪一点。用在趋势、朋友、新、奖励这类「标签」上 */
export function GZSticker({ label, color = "lime", rotate = -3, icon, size = "m", slap, style }: { label: string; color?: GZColor; rotate?: number; icon?: IconName; size?: "s" | "m" | "l"; slap?: boolean; style?: StyleProp<ViewStyle> }) {
  const anim = useSlap();
  const h = size === "s" ? 22 : size === "l" ? 38 : 28;
  const body = (
    <View style={[styles.sticker, { height: h, paddingHorizontal: size === "s" ? 7 : size === "l" ? 14 : 10, backgroundColor: fill(color), transform: [{ rotate: `${rotate}deg` }] }, style]}>
      {icon ? <Icon name={icon} size={size === "s" ? 11 : size === "l" ? 18 : 14} color={inkOn(color)} fill={icon === "flame" || icon === "heart" ? inkOn(color) : undefined} strokeWidth={2.6} /> : null}
      <Text style={[size === "l" ? gz.display.head : size === "s" ? gz.display.tiny : gz.display.label, { color: inkOn(color), textTransform: size === "s" ? "uppercase" : "none" }]}>{label}</Text>
    </View>
  );
  return slap ? <Animated.View style={[{ alignSelf: "flex-start" }, anim]}>{body}</Animated.View> : body;
}

/** 图片贴纸：白色模切边 + 歪斜 + 投影，像贴在屏幕上的照片 */
export function GZPhoto({ uri, w, h, rotate = -5, radius = 14, children }: { uri: string; w: number; h: number; rotate?: number; radius?: number; children?: ReactNode }) {
  return (
    <View style={[styles.photo, { width: w, height: h, borderRadius: radius, transform: [{ rotate: `${rotate}deg` }] }]}>
      <Image source={{ uri }} style={{ width: "100%", height: "100%", borderRadius: radius - 3 }} resizeMode="cover" />
      {children}
    </View>
  );
}

/* ============ 按钮 ============ */

type BtnVariant = "primary" | "lime" | "white" | "dark" | "outline";
/**
 * 按钮：粗胶囊，展示字体。橙底白字，青柠 / 白底黑字。primary 橙(全 APP 唯一主操作色) · lime 朋友相关 · white 压在视频上 · dark 次要 · outline 最轻
 * l 52 高(页底主操作) · m 40(行内) · s 30(列表里)
 */
export function GZButton({ label, onPress, variant = "primary", size = "l", icon, disabled, block, style }: { label: string; onPress?: () => void; variant?: BtnVariant; size?: "l" | "m" | "s"; icon?: IconName; disabled?: boolean; block?: boolean; style?: StyleProp<ViewStyle> }) {
  const h = size === "l" ? 52 : size === "m" ? 40 : 30;
  const bg = variant === "primary" ? c.orange : variant === "lime" ? c.lime : variant === "white" ? c.white : variant === "dark" ? c.raised : "transparent";
  const fg = variant === "primary" || variant === "dark" || variant === "outline" ? c.white : c.ink;
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        styles.btn,
        { height: h, paddingHorizontal: size === "l" ? 22 : size === "m" ? 16 : 12, backgroundColor: bg, alignSelf: block ?? size === "l" ? "stretch" : "flex-start" },
        variant === "outline" && { borderWidth: 2, borderColor: c.white },
        pressed && { transform: [{ scale: 0.96 }] },
        disabled && { opacity: 0.35 },
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={size === "s" ? 14 : 18} color={fg} strokeWidth={2.6} /> : null}
      <Text style={[size === "s" ? gz.display.tiny : size === "m" ? gz.display.label : gz.display.head, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

/** 圆形图标按钮：压在视频上(半透明黑)或页面上(深灰) */
export function GZIconButton({ icon, onPress, onVideo, badge, label, size = 40 }: { icon: IconName; onPress?: () => void; onVideo?: boolean; badge?: number; label: string; size?: number }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => [{ width: size, height: size, borderRadius: size / 2, alignItems: "center", justifyContent: "center", backgroundColor: onVideo ? "rgba(0,0,0,0.35)" : c.raised }, pressed && { opacity: 0.7 }]}>
      <Icon name={icon} size={Math.round(size * 0.52)} color={c.white} strokeWidth={2.4} />
      {badge ? (
        <View style={styles.badge}>
          <Text style={[gz.display.tiny, { color: c.ink, fontSize: 11 }]}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/* ============ 基础 ============ */

/** 头像:ring = 有没看过的新内容(青柠粗圈 + 黑缝);普通头像没有圈 */
export function GZAvatar({ uri, size = 40, ring, border }: { uri: string; size?: number; ring?: boolean; border?: boolean }) {
  if (!ring) return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: c.raised, borderWidth: border ? 2 : 0, borderColor: c.white }} />;
  return (
    <View style={{ width: size + 8, height: size + 8, borderRadius: (size + 8) / 2, backgroundColor: c.lime, alignItems: "center", justifyContent: "center" }}>
      <View style={{ width: size + 3, height: size + 3, borderRadius: (size + 3) / 2, backgroundColor: c.page, alignItems: "center", justifyContent: "center" }}>
        <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />
      </View>
    </View>
  );
}

/** 头像叠:朋友 */
export function GZStack({ uris, size = 22, ring = "#000" }: { uris: string[]; size?: number; ring?: string }) {
  return (
    <View style={{ flexDirection: "row" }}>
      {uris.map((u, i) => (
        <Image key={i} source={{ uri: u }} style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: ring, marginLeft: i ? -size * 0.38 : 0, backgroundColor: c.raised }} />
      ))}
    </View>
  );
}

/** 积分：黄油色硬币贴纸 */
export function GZCredits({ n, onVideo }: { n: number; onVideo?: boolean }) {
  return (
    <View style={[styles.credits, onVideo && { borderColor: "rgba(0,0,0,0.2)" }]} accessibilityLabel={`${n} credits`}>
      <Coin size={15} />
      <Text style={[gz.display.label, { color: c.ink }]}>{n.toLocaleString("en-US")}</Text>
    </View>
  );
}

/** 筛选:描边胶囊，选中填色(颜色跟着分类走) */
export function GZChip({ label, on, color = "white", onPress }: { label: string; on?: boolean; color?: GZColor; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: !!on }} style={[styles.chip, on && { backgroundColor: fill(color), borderColor: fill(color) }]}>
      <Text style={[gz.display.label, { color: on ? inkOn(color) : c.text }]}>{label}</Text>
    </Pressable>
  );
}

/** 分段：一条深灰底，选中是一块白色贴纸 */
export function GZSegmented({ options, value, onChange }: { options: string[]; value: string; onChange?: (v: string) => void }) {
  return (
    <View style={styles.seg}>
      {options.map((o) => (
        <Pressable key={o} onPress={() => onChange?.(o)} style={[styles.segItem, o === value && { backgroundColor: c.white }]} accessibilityRole="tab" accessibilityState={{ selected: o === value }}>
          <Text style={[gz.display.label, { color: o === value ? c.ink : c.text2 }]}>{o}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/** 输入框：深灰圆角，聚焦白边 */
export function GZInput({ value, placeholder, onChangeText, icon, focus }: { value?: string; placeholder?: string; onChangeText?: (v: string) => void; icon?: IconName; focus?: boolean }) {
  return (
    <View style={[styles.input, focus && { borderColor: c.white }]}>
      {icon ? <Icon name={icon} size={18} color={c.text2} strokeWidth={2.4} /> : null}
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={c.text3} style={[gz.body.body, { flex: 1, color: c.white, outlineStyle: "none" } as object]} />
    </View>
  );
}

/* ============ 视频流 ============ */

/** 顶部频道：展示字体，选中的一块白色贴纸(歪一点)，没选中半透明 */
export function GZFeedTabs({ tabs, current, onChange }: { tabs: string[]; current: string; onChange?: (t: string) => void }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }} accessibilityRole="tablist">
      {tabs.map((t) => {
        const on = t === current;
        return (
          <Pressable key={t} onPress={() => onChange?.(t)} accessibilityRole="tab" accessibilityState={{ selected: on }} style={[styles.feedTab, on && { backgroundColor: c.white, transform: [{ rotate: "-2deg" }] }]}>
            <Text style={[gz.display.label, { fontSize: 15, color: on ? c.ink : "rgba(255,255,255,0.75)" }, !on && gz.textShadow]}>{t}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** 首页顶栏:消息 · 频道居中 · 搜索 */
export function GZFeedHeader({ tabs, current, onChange, unread }: { tabs: string[]; current: string; onChange?: (t: string) => void; unread?: number }) {
  return (
    <View style={styles.feedHead}>
      <View pointerEvents="box-none" style={styles.feedHeadCenter}>
        <GZFeedTabs tabs={tabs} current={current} onChange={onChange} />
      </View>
      <GZIconButton icon="bell" onVideo badge={unread} label="Inbox" size={38} />
      <View style={{ flex: 1 }} />
      <GZIconButton icon="search" onVideo label="Search" size={38} />
    </View>
  );
}

/** 右侧操作:粗白图标 + 展示字体数字;点赞变粉、收藏变黄油 */
export function GZRailAction({ icon, count, active, tint = c.pink, onPress, label }: { icon: IconName; count: string; active?: boolean; tint?: string; onPress?: () => void; label: string }) {
  const color = active ? tint : c.white;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={{ alignItems: "center", gap: 3, marginBottom: 14 }}>
      <View style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.45))" } as object}>
        <Icon name={icon} size={32} color={color} fill={color} strokeWidth={0.6} />
      </View>
      <Text style={[gz.display.tiny, { color: c.white }, gz.textShadow]}>{count}</Text>
    </Pressable>
  );
}

/** 作者头像 + 关注:关注是一颗青柠「+」贴纸 */
export function GZRailAvatar({ uri, following, onFollow }: { uri: string; following?: boolean; onFollow?: () => void }) {
  return (
    <View style={{ alignItems: "center", marginBottom: 16 }}>
      <GZAvatar uri={uri} size={46} border />
      {!following ? (
        <Pressable onPress={onFollow} accessibilityRole="button" accessibilityLabel="Follow" style={styles.followPlus}>
          <Icon name="plus" size={14} color={c.ink} strokeWidth={3.2} />
        </Pressable>
      ) : null}
    </View>
  );
}

/** Remix 入口:这条视频的封面做成一张白边照片贴纸，歪着贴，上面压一颗橙色 REMIX 字贴纸 */
export function GZRemixSticker({ uri, onPress }: { uri: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Remix this video" style={({ pressed }) => [{ alignItems: "center", width: 64, height: 70 }, pressed && { transform: [{ scale: 0.94 }] }]}>
      <GZPhoto uri={uri} w={46} h={56} rotate={-8} radius={10} />
      <View style={{ position: "absolute", bottom: 0 }}>
        <GZSticker label="REMIX" color="orange" size="s" rotate={4} />
      </View>
    </Pressable>
  );
}

/** 左下作品信息:作者(展示字体) · 文案 · 一颗情境贴纸(只放最强的一个信号) */
export function GZCaption({ name, caption, signal }: { name: string; caption: string; signal?: ReactNode }) {
  return (
    <View style={{ gap: 7 }}>
      {signal}
      <Text style={[gz.display.head, { color: c.white }, gz.textShadow]} numberOfLines={1}>
        {name}
      </Text>
      <Text style={[gz.body.body, { color: c.white }, gz.textShadow]} numberOfLines={2}>
        {caption}
      </Text>
    </View>
  );
}

/** 底部栏:黑条，Home / Me 展示字体;Create 是一颗橙色大贴纸(白模切边、歪 -3°) */
export type GZTab = "home" | "create" | "me";
export const GZ_TAB_H = 60;
export function GZTabBar({ current, onChange, dot, insetBottom = 0 }: { current: GZTab; onChange?: (t: GZTab) => void; dot?: GZTab; insetBottom?: number }) {
  const item = (id: GZTab, label: string) => {
    const on = current === id;
    return (
      <Pressable key={id} onPress={() => onChange?.(id)} accessibilityRole="tab" accessibilityState={{ selected: on }} style={styles.tabItem}>
        <Text style={[gz.display.head, { color: on ? c.white : "rgba(255,255,255,0.45)" }]}>{label}</Text>
        {on ? <View style={styles.tabUnder} /> : null}
        {dot === id ? <View style={styles.tabDot} /> : null}
      </Pressable>
    );
  };
  return (
    <View style={[styles.tabBar, { paddingBottom: insetBottom }]} accessibilityRole="tablist">
      {item("home", "Home")}
      <Pressable onPress={() => onChange?.("create")} accessibilityRole="button" accessibilityLabel="Create" style={({ pressed }) => [styles.tabItem, pressed && { transform: [{ scale: 0.94 }] }]}>
        <View style={styles.createSticker}>
          <Icon name="plus" size={20} color={c.white} strokeWidth={3.2} />
          <Text style={[gz.display.head, { color: c.white }]}>Create</Text>
        </View>
      </Pressable>
      {item("me", "Me")}
    </View>
  );
}

/** 视频底部进度 */
export function GZProgress({ value }: { value: number }) {
  return (
    <View style={{ height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.25)" }}>
      <View style={{ width: `${value * 100}%`, height: 3, borderRadius: 2, backgroundColor: c.white }} />
    </View>
  );
}

/* ============ 面板和提示 ============ */

/** 底部面板:贴底，上面两个大圆角;标题展示字体 */
export function GZSheet({ title, children, onClose }: { title: string; children: ReactNode; onClose?: () => void }) {
  return (
    <View style={styles.sheet}>
      <View style={styles.grabber} />
      <View style={styles.sheetHead}>
        <Text style={[gz.display.head, { color: c.white }]}>{title}</Text>
        <Pressable onPress={onClose} accessibilityLabel="Close" hitSlop={10} style={{ position: "absolute", right: 16 }}>
          <Icon name="x" size={22} color={c.text2} strokeWidth={2.4} />
        </Pressable>
      </View>
      {children}
    </View>
  );
}

/** 顶部提示：一颗青柠贴纸(歪一点)，啪地贴上;失败类提示用红色(isErrorToast) */
export function GZToast({ text, color = "lime" }: { text: string; color?: GZColor }) {
  const anim = useSlap();
  return (
    <Animated.View style={[{ alignSelf: "center" }, anim]}>
      <View style={[styles.toast, { backgroundColor: fill(color) }]}>
        <Text style={[gz.display.label, { color: inkOn(color) }]}>{text}</Text>
      </View>
    </Animated.View>
  );
}

/** 评论一行 */
export function GZCommentRow({ avatar, name, text, meta, likes, liked, tag, onLike }: { avatar: string; name: string; text: string; meta: string; likes: string; liked?: boolean; tag?: ReactNode; onLike?: () => void }) {
  return (
    <View style={{ flexDirection: "row", gap: 10, paddingVertical: 10 }}>
      <GZAvatar uri={avatar} size={34} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={[gz.body.micro, { color: c.text2 }]}>{name}</Text>
          {tag}
        </View>
        <Text style={[gz.body.body, { color: c.white, marginTop: 2 }]}>{text}</Text>
        <Text style={[gz.body.caption, { color: c.text3, marginTop: 4 }]}>{meta} · Reply</Text>
      </View>
      <Pressable onPress={onLike} accessibilityLabel="Like comment" style={{ alignItems: "center", gap: 2, width: 32 }}>
        <Icon name="heart" size={18} color={liked ? c.pink : c.text3} fill={liked ? c.pink : undefined} strokeWidth={2.4} />
        <Text style={[gz.body.micro, { color: c.text3 }]}>{likes}</Text>
      </Pressable>
    </View>
  );
}

/* ============ 内容 ============ */

/** 数据三栏:展示字体大数字 */
export function GZStats({ items }: { items: { n: string; label: string; color?: GZColor }[] }) {
  return (
    <View style={{ flexDirection: "row" }}>
      {items.map((x) => (
        <View key={x.label} style={{ flex: 1, alignItems: "center" }}>
          <Text style={[gz.display.title, { color: x.color ? fill(x.color) : c.white }]}>{x.n}</Text>
          <Text style={[gz.body.caption, { color: c.text3, marginTop: 2 }]}>{x.label}</Text>
        </View>
      ))}
    </View>
  );
}

/** 作品网格一格:8pt 圆角 + 3pt 缝;左上可选贴纸，左下播放数 */
export function GZGridCell({ uri, width, count, sticker, progress }: { uri: string; width: number; count?: string; sticker?: ReactNode; progress?: number }) {
  return (
    <View style={{ width, height: width * 1.33, borderRadius: 8, overflow: "hidden", backgroundColor: c.raised }}>
      <Image source={{ uri }} style={[StyleSheet.absoluteFill, progress !== undefined ? { opacity: 0.35 } : null]} resizeMode="cover" />
      {sticker ? <View style={{ position: "absolute", left: 5, top: 6 }}>{sticker}</View> : null}
      {progress !== undefined ? (
        <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
          <Text style={[gz.display.title, { color: c.white }]}>{Math.round(progress * 100)}%</Text>
        </View>
      ) : null}
      {count ? (
        <View style={{ position: "absolute", left: 6, bottom: 5, flexDirection: "row", alignItems: "center", gap: 3 }}>
          <Icon name="play" size={11} color={c.white} fill={c.white} strokeWidth={1} />
          <Text style={[gz.display.tiny, { color: c.white }, gz.textShadow]}>{count}</Text>
        </View>
      ) : null}
    </View>
  );
}

/** 列表行:左头像 / 图标 · 文字 · 右侧 */
export function GZListRow({ leading, title, sub, right, onPress }: { leading: ReactNode; title: ReactNode; sub?: string; right?: ReactNode; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { backgroundColor: "rgba(255,255,255,0.05)" }]}>
      {leading}
      <View style={{ flex: 1 }}>
        <Text style={[gz.body.body, { color: c.white }]} numberOfLines={2}>
          {title}
        </Text>
        {sub ? <Text style={[gz.body.caption, { color: c.text3, marginTop: 2 }]}>{sub}</Text> : null}
      </View>
      {right}
    </Pressable>
  );
}

/** 色块卡:一整块贴纸色，黑字(里程碑、挑战、提醒) */
export function GZBlock({ color = "lime", rotate = 0, children, style }: { color?: GZColor; rotate?: number; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.block, { backgroundColor: fill(color), transform: [{ rotate: `${rotate}deg` }] }, style]}>{children}</View>;
}

/* ============ 激励 ============ */

/** 签到 7 天：已领 = 黑底青柠勾的圆章;今天 = 黄油贴纸;第 7 天礼物 */
export function GZStreak({ rewards, done, today }: { rewards: number[]; done: number; today: number }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      {rewards.map((n, i) => {
        const got = i < done;
        const now = i === today;
        return (
          <View key={i} style={{ alignItems: "center", gap: 5 }}>
            <View style={[styles.day, got && { backgroundColor: c.lime }, now && { backgroundColor: c.butter, transform: [{ rotate: "-6deg" }, { scale: 1.08 }] }]}>
              {got ? <Icon name="check" size={18} color={c.ink} strokeWidth={3.4} /> : i === rewards.length - 1 ? <Icon name="gift" size={18} color={now ? c.ink : c.butter} strokeWidth={2.6} /> : <Text style={[gz.display.tiny, { color: now ? c.ink : c.white }]}>+{n}</Text>}
            </View>
            <Text style={[gz.body.micro, { color: now ? c.butter : c.text3, fontWeight: "600" }]}>{now ? "Today" : `D${i + 1}`}</Text>
          </View>
        );
      })}
    </View>
  );
}

/** 火苗天数贴纸 */
export function GZFlame({ n }: { n: number }) {
  return <GZSticker label={`${n}`} icon="flame" color="orange" size="s" rotate={-4} />;
}

const styles = StyleSheet.create({
  sticker: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", borderRadius: 8, borderWidth: gz.cut, borderColor: c.white },
  photo: { padding: 3, backgroundColor: c.white, boxShadow: "0 6px 14px rgba(0,0,0,0.35)" } as object,
  btn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 999 },
  badge: { position: "absolute", top: -3, right: -4, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: c.lime, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: c.black },
  credits: { flexDirection: "row", alignItems: "center", gap: 5, height: 30, paddingLeft: 7, paddingRight: 11, borderRadius: 999, backgroundColor: c.butter, borderWidth: 2, borderColor: c.white, transform: [{ rotate: "-2deg" }] },
  chip: { height: 34, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.35)", justifyContent: "center" },
  seg: { flexDirection: "row", padding: 3, borderRadius: 999, backgroundColor: c.raised },
  segItem: { flex: 1, height: 34, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  input: { flexDirection: "row", alignItems: "center", gap: 10, height: 48, paddingHorizontal: 16, borderRadius: 16, backgroundColor: c.raised, borderWidth: 2, borderColor: "transparent" },
  feedTab: { height: 32, paddingHorizontal: 11, borderRadius: 10, justifyContent: "center" },
  feedHead: { flexDirection: "row", alignItems: "center", height: 48, paddingHorizontal: 10 },
  feedHeadCenter: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  followPlus: { position: "absolute", bottom: -9, width: 22, height: 22, borderRadius: 11, backgroundColor: c.lime, borderWidth: 2, borderColor: c.black, alignItems: "center", justifyContent: "center" },
  tabBar: { flexDirection: "row", alignItems: "center", backgroundColor: c.black, height: undefined },
  tabItem: { flex: 1, height: GZ_TAB_H, alignItems: "center", justifyContent: "center" },
  tabUnder: { position: "absolute", bottom: 10, width: 18, height: 4, borderRadius: 2, backgroundColor: c.orange },
  tabDot: { position: "absolute", top: 14, right: "30%", width: 9, height: 9, borderRadius: 5, backgroundColor: c.lime, borderWidth: 2, borderColor: c.black },
  createSticker: { flexDirection: "row", alignItems: "center", gap: 4, height: 42, paddingLeft: 12, paddingRight: 16, borderRadius: 14, backgroundColor: c.orange, borderWidth: 3, borderColor: c.white, transform: [{ rotate: "-3deg" }] },
  sheet: { backgroundColor: c.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 12 },
  grabber: { alignSelf: "center", width: 40, height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.25)", marginTop: 8 },
  sheetHead: { height: 48, alignItems: "center", justifyContent: "center" },
  toast: { paddingHorizontal: 16, height: 40, borderRadius: 12, borderWidth: gz.cut, borderColor: c.white, justifyContent: "center", transform: [{ rotate: "-2deg" }] },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 10 },
  block: { borderRadius: 20, padding: 16 },
  day: { width: 38, height: 38, borderRadius: 19, backgroundColor: c.raised, alignItems: "center", justifyContent: "center" },
});
