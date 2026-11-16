/* 贴纸风 · 登录 / 设置这一组第一版页面共用的积木(组件库 kit/gz.tsx 之外的)。
 * 规则同组件库：不用渐变 / 光晕 / 回弹;贴纸色各管一件事;贴纸上黑字;大字用展示字体，正文系统字，最小 12。 */

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { gz, type GZColor } from "../../kit/gz";
import { useSheetPresence } from "../../../buzzvideo-app/app/components/sheet-presence";
import { Icon, keyboardHeight, prefersReducedMotion, useInsets, useKeyboard, type IconName } from "../v1";

const c = gz.color;
/** 快速减速、不回弹(同组件库 useSlap) */
export const EASE = Easing.bezier(0.16, 1, 0.3, 1);
/** 出错 / 危险操作(删除账号、输入有误)。组件库没有红色贴纸，这是唯一的警示色 */
export const DANGER = "#FF4D5E";

/** 设置类列表的一行:左侧圆形图标 · 文字 · 右侧(值 / 开关 / 箭头)。没有卡片底，行与行之间发丝线 */
export function ListRow({ icon, iconColor, label, value, right, chevron, danger, onPress, first }: { icon?: IconName; iconColor?: GZColor; label: string; value?: ReactNode; right?: ReactNode; chevron?: boolean; danger?: boolean; onPress?: () => void; first?: boolean }) {
  const bg = iconColor ? (iconColor === "white" ? c.white : iconColor === "ink" ? c.ink : c[iconColor]) : c.raised;
  const body = (
    <>
      {icon ? (
        <View style={[styles.rowIcon, { backgroundColor: danger ? "rgba(255,77,94,0.16)" : bg }]}>
          <Icon name={icon} size={18} color={danger ? DANGER : iconColor ? c.ink : c.white} strokeWidth={2.4} />
        </View>
      ) : null}
      <Text style={[gz.body.body, { flex: 1, color: danger ? DANGER : c.white }]} numberOfLines={1}>
        {label}
      </Text>
      {typeof value === "string" ? <Text style={[gz.body.body, { color: c.text3 }]}>{value}</Text> : value}
      {right}
      {chevron ? <Icon name="chevron-right" size={18} color={c.text3} strokeWidth={2.4} /> : null}
    </>
  );
  const style = [styles.row, !first && styles.rowLine];
  if (!onPress) return <View style={style}>{body}</View>;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => [style, pressed && { backgroundColor: "rgba(255,255,255,0.05)" }]}>
      {body}
    </Pressable>
  );
}

/** 一组列表:上下发丝线框住，组与组之间留白(不用灰卡片) */
export function ListGroup({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <View style={{ marginTop: title ? 20 : 14 }}>
      {title ? <Text style={[gz.display.label, { color: c.text3, marginHorizontal: 16, marginBottom: 6 }]}>{title}</Text> : null}
      <View style={styles.group}>{children}</View>
    </View>
  );
}

/** 开关:深灰轨道;打开 = 青柠(开着 / 成功)+ 黑色滑块。平移用减速曲线，不回弹 */
export function GZToggle({ value, onValueChange, accessibilityLabel, disabled }: { value: boolean; onValueChange: (v: boolean) => void; accessibilityLabel?: string; disabled?: boolean }) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    if (prefersReducedMotion()) anim.setValue(value ? 1 : 0);
    else Animated.timing(anim, { toValue: value ? 1 : 0, duration: 200, easing: EASE, useNativeDriver: false }).start();
  }, [value, anim]);
  const { x, bg } = useMemo(() => ({ x: anim.interpolate({ inputRange: [0, 1], outputRange: [3, 52 - 26 - 3] }), bg: anim.interpolate({ inputRange: [0, 1], outputRange: [c.raised, c.lime] }) }), [anim]);
  return (
    <Pressable onPress={() => onValueChange(!value)} disabled={disabled} accessibilityRole="switch" accessibilityState={{ checked: value, disabled }} accessibilityLabel={accessibilityLabel} hitSlop={8} style={disabled ? { opacity: 0.4 } : undefined}>
      <Animated.View style={[styles.track, { backgroundColor: bg }]}>
        <Animated.View style={[styles.knob, { backgroundColor: value ? c.ink : c.white, transform: [{ translateX: x }] }]} />
      </Animated.View>
    </Pressable>
  );
}

/**
 * 底部面板(组件库 GZSheet 的形态):贴底，上面两个大圆角，抓手 + 展示字体标题 + 右上 ×。
 * 遵守第一版 Sheet 的出场约定(sheet-presence):visible 变 false 时先播退场，播完调 onExited 再卸载。
 * 进场快速减速滑上来，不回弹;键盘弹起时整块抬到键盘上方
 */
export function StickerSheet({ title, onClose, right, children }: { title?: string; onClose: () => void; right?: ReactNode | null; children: ReactNode }) {
  const insets = useInsets();
  const kb = useKeyboard();
  const kbH = keyboardHeight(kb);
  const [lift] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(lift, { toValue: kbH, duration: 250, easing: Easing.bezier(0.25, 0.1, 0.25, 1), useNativeDriver: false }).start();
  }, [kbH, lift]);
  const { visible, onExited } = useSheetPresence();
  const anim = useRef(new Animated.Value(0)).current;
  const visibleRef = useRef(visible);
  visibleRef.current = visible;
  useEffect(() => {
    Animated.timing(anim, visible ? { toValue: 1, duration: 300, easing: EASE, useNativeDriver: false } : { toValue: 0, duration: 220, easing: Easing.in(Easing.cubic), useNativeDriver: false }).start(({ finished }) => {
      if (finished && !visibleRef.current) onExited();
    });
  }, [visible, anim, onExited]);
  // 插值节点要稳定(同第一版 Sheet):整棵树频繁重渲染时，新建插值会停掉进行中的动画
  const translateY = useMemo(() => anim.interpolate({ inputRange: [0, 1], outputRange: [700, 0] }), [anim]);
  const action =
    right === undefined ? (
      <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={10}>
        <Icon name="x" size={22} color={c.text2} strokeWidth={2.4} />
      </Pressable>
    ) : (
      right
    );
  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: visible ? "auto" : "none" }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: anim }]}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }} onPress={onClose} accessibilityLabel="Close" />
      </Animated.View>
      <Animated.View style={[styles.sheet, { bottom: lift, transform: [{ translateY }] }]}>
        <View style={styles.grabber} />
        {title ? (
          <View style={styles.sheetHead}>
            <Text style={[gz.display.head, { color: c.white, maxWidth: "70%", textAlign: "center" }]} numberOfLines={1} accessibilityRole="header">
              {title}
            </Text>
            <View style={styles.sheetAction}>{action}</View>
          </View>
        ) : null}
        <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: kb.open ? 16 : insets.bottom + 12 }} bounces={false} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, minHeight: 56, paddingVertical: 8 },
  rowLine: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line },
  rowIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  group: { borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.line },
  track: { width: 52, height: 32, borderRadius: 16, justifyContent: "center" },
  knob: { position: "absolute", left: 0, width: 26, height: 26, borderRadius: 13 },
  sheet: { position: "absolute", left: 0, right: 0, maxHeight: "88%", backgroundColor: c.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: "hidden" },
  grabber: { alignSelf: "center", width: 40, height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.25)", marginTop: 8 },
  sheetHead: { height: 48, alignItems: "center", justifyContent: "center" },
  sheetAction: { position: "absolute", right: 16, top: 0, bottom: 0, justifyContent: "center" },
});
