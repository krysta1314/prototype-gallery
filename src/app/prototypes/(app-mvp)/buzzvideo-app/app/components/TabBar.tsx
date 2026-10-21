import { useEffect, useMemo, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import type { IconName } from "../data";
import type { TabId } from "../nav";
import { useKeyboard } from "../keyboard";
import { useInsets, useNav } from "../provider";
import { colors, radius } from "../theme";
import Gradient from "./Gradient";
import Icon from "./Icon";
import TabGlyph from "./TabGlyph";
import { prefersReducedMotion } from "./motion";

const TABS: { id: TabId; label: string; icon: IconName }[] = [
  // 2026-10-21:Inspire 改名 Home(房子图标),Create 换成两颗星(AI 创作)
  { id: "inspire", label: "Home", icon: "house" },
  { id: "create", label: "Create", icon: "sparkles" },
  { id: "me", label: "Me", icon: "user-round" },
];

/** 胶囊高度(46 + 上下各 4 的内边距;2026-10-21 从 62 压到 54,接近 iOS 26 原生胶囊) */
const BAR_H = 54;
/** 胶囊离屏幕底边的距离:iPhone 上 20(Home 横条区 34 − 14) */
export const tabBarBottom = (insetBottom: number) => Math.max(insetBottom - 14, 8);
/**
 * Tab 页底部要留出的空白 = 胶囊高度 + 离底距离 + 8 的呼吸位。
 * 胶囊是悬浮的，不占布局;各 Tab 页(灵感 / 创作 / 我的)把内容底部垫高这么多，滑到底最后一条也不被挡住
 */
export const tabBarSpace = (insetBottom: number) => BAR_H + tabBarBottom(insetBottom) + 8;
/** 同上，打字时(键盘弹起、Tab 栏收起)为 0 */
export const useTabBarSpace = () => {
  const insets = useInsets();
  return useKeyboard().open ? 0 : tabBarSpace(insets.bottom);
};

/** 胶囊内边距、格子间距 */
const PAD = 4;
const GAP = 4;

/**
 * 底部 Tab 栏(2026-10-21 定:iOS 26 液态玻璃悬浮胶囊，尽量还原原生):
 * - 材质：通透的玻璃(背景模糊 + 提饱和 + 压暗一点保证可读)+ 顶边一道镜面高光 + 细亮边
 * - 选中：一块浅色玻璃底 + 橙色图标文字;切换时这块底像水滴一样滑过去，途中横向拉长、到位回弹
 * - 按压：按住那一格轻轻放大(原生的「镜片」反馈)
 * - 滚动时不缩小、不隐藏(不做原生的自动缩小);内容不会被挡住：各 Tab 页底部垫了 tabBarSpace
 * 真实 APP 用系统原生 Tab 栏，这些效果由 iOS 提供(见交互说明)
 */
export default function TabBar() {
  const { nav, navigate } = useNav();
  const insets = useInsets();
  const [w, setW] = useState(0);
  const idx = Math.max(0, TABS.findIndex((t) => t.id === nav.tab));
  const [pos] = useState(() => new Animated.Value(idx));
  const [stretch] = useState(() => new Animated.Value(1));
  const [pressed, setPressed] = useState<TabId | null>(null);
  useEffect(() => {
    if (prefersReducedMotion()) {
      pos.setValue(idx);
      return;
    }
    // 位移用弹簧(轻微回弹);同时横向拉长再收回，像液体被拖过去
    Animated.parallel([
      Animated.spring(pos, { toValue: idx, stiffness: 170, damping: 20, mass: 1, useNativeDriver: false }),
      Animated.sequence([
        Animated.timing(stretch, { toValue: 1.2, duration: 160, easing: Easing.out(Easing.quad), useNativeDriver: false }),
        Animated.spring(stretch, { toValue: 1, stiffness: 300, damping: 18, useNativeDriver: false }),
      ]),
    ]).start();
  }, [idx, pos, stretch]);
  const itemW = w ? (w - PAD * 2 - GAP * (TABS.length - 1)) / TABS.length : 0;
  // 动画节点要稳定，别每次渲染新建(否则进行中的滑动会被打断)
  const tx = useMemo(() => Animated.multiply(pos, itemW + GAP), [pos, itemW]);

  return (
    <View style={[styles.wrap, { bottom: tabBarBottom(insets.bottom) }]} pointerEvents="box-none">
      <View style={[styles.bar, glass]} accessibilityRole="tablist" onLayout={(e) => setW(e.nativeEvent.layout.width)}>
        {/* 顶边镜面高光 */}
        <Gradient colors={["rgba(255,255,255,0.14)", "rgba(255,255,255,0)"]} style={styles.sheen} pointerEvents="none" />
        {itemW ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.indicator,
              { width: itemW, left: PAD },
              { transform: [{ translateX: tx }, { scaleX: stretch }] },
            ]}
          />
        ) : null}
        {TABS.map((t) => {
          const on = nav.tab === t.id;
          const down = pressed === t.id && !prefersReducedMotion();
          return (
            <Pressable
              key={t.id}
              onPress={() => navigate({ type: "tab", tab: t.id })}
              onPressIn={() => setPressed(t.id)}
              onPressOut={() => setPressed(null)}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              style={[styles.item, down && styles.itemDown]}
            >
              {/* 选中：实心图标(iOS 原生选中态是填充的 SF Symbol);未选中：线条 */}
              {t.id === "me" ? (
                <Icon name={t.icon} size={22} color={on ? colors.accent : colors.ink} strokeWidth={on ? 2.25 : 1.75} />
              ) : (
                <TabGlyph name={t.id === "inspire" ? "home" : "create"} size={22} color={on ? colors.accent : colors.ink} filled={on} />
              )}
              <Text style={[styles.label, on && styles.labelOn]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** 液态玻璃：半透明深底 + 背景模糊 / 提饱和 / 略压暗 + 细亮边(网页端 backdrop-filter;真实 APP 用 iOS 26 系统 Tab 栏) */
const glass = {
  backgroundColor: "rgba(40,40,48,0.5)",
  backdropFilter: "blur(20px) saturate(1.8) brightness(0.78)",
  WebkitBackdropFilter: "blur(20px) saturate(1.8) brightness(0.78)",
  boxShadow: "inset 0 0.5px 0 rgba(255,255,255,0.35), inset 0 0 0 0.5px rgba(255,255,255,0.14), 0 8px 28px rgba(0,0,0,0.4)",
} as object;

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 16, right: 16, zIndex: 20 },
  bar: { flexDirection: "row", gap: GAP, padding: PAD, borderRadius: radius.full, overflow: "hidden" },
  sheen: { position: "absolute", left: 0, right: 0, top: 0, height: "45%" },
  indicator: { position: "absolute", top: PAD, bottom: PAD, borderRadius: radius.full, backgroundColor: "rgba(255,255,255,0.16)", boxShadow: "inset 0 0.5px 0 rgba(255,255,255,0.25)" } as object,
  item: { flex: 1, height: 46, borderRadius: radius.full, alignItems: "center", justifyContent: "center", gap: 1, transitionProperty: "transform", transitionDuration: "180ms" } as object,
  itemDown: { transform: [{ scale: 1.08 }] },
  label: { fontSize: 10, lineHeight: 13, fontWeight: "600", color: colors.ink },
  labelOn: { color: colors.accent },
});
