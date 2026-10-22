import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { keyboardHeight, useKeyboard } from "../keyboard";
import { useInsets } from "../provider";
import { colors, elevation, radius, type, smoothCorners } from "../theme";
import IconButton from "./IconButton";
import { DURATION, SHEET_SPRING } from "./motion";
import { useSheetPresence } from "./sheet-presence";

type Props = {
  /** 居中 headline 标题;不传则只有 grabber */
  title?: string;
  onClose: () => void;
  /** 标题行右侧;默认是关闭 x。传 null 不显示 */
  right?: ReactNode;
  children: ReactNode;
};

/** 底部面板:grabber + 标准标题行;进场 280ms ease-out,退场 250ms 后才卸载(见 sheet-presence) */
export default function Sheet({ title, onClose, right, children }: Props) {
  const insets = useInsets();
  // 面板里的输入框打字时，面板整体抬到键盘上方(和键盘同一条曲线)
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
    // 升起用弹簧(和 iOS 原生一致),收起用快速缓动
    (visible
      ? Animated.spring(anim, { toValue: 1, ...SHEET_SPRING, useNativeDriver: false })
      : Animated.timing(anim, { toValue: 0, duration: DURATION.sheetOut, easing: Easing.in(Easing.cubic), useNativeDriver: false })
    ).start(({ finished }) => {
      if (finished && !visibleRef.current) onExited();
    });
  }, [visible, anim, onExited]);

  // 插值节点要稳定:任务在跑时整棵树每 250ms 重渲染,每次新建插值会在旧节点 detach 时把进行中的动画停掉
  const translateY = useMemo(() => anim.interpolate({ inputRange: [0, 1], outputRange: [600, 0] }), [anim]);
  // 悬浮面板离屏幕底的距离：盖住 Home 横条那一段，最少 8pt;键盘弹起时贴着键盘留 8pt
  const gap = kb.open ? SHEET_INSET : Math.max(insets.bottom - 26, SHEET_INSET);
  const action = right === undefined ? <IconButton icon="x" color={colors.sub} onPress={onClose} accessibilityLabel="Close" /> : right;

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: visible ? "auto" : "none" }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: anim }]}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      </Animated.View>
      {/* iOS 26:面板不再贴满屏幕，左右底各留 8pt 悬浮，四个角都是大圆角(和系统分享面板一致) */}
      <Animated.View style={[styles.panel, { bottom: lift, marginBottom: gap, transform: [{ translateY }] }]}>
        <View style={styles.grabber} />
        {title ? (
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
              {title}
            </Text>
            <View style={styles.action}>{action}</View>
          </View>
        ) : null}
        {/* 内容超过 88% 屏高时在面板里滚动，最后一行不会被底部横条压住 */}
        <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: kb.open ? 16 : Math.max(insets.bottom - gap, 0) + 12 }} bounces={false} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

/** iOS 26 悬浮面板：离屏幕边 8pt,四角 38pt(和 IosShareSheet 一致) */
const SHEET_INSET = 8;
const SHEET_RADIUS = 38;

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.scrim },
  body: { flexShrink: 1 },
  panel: {
    position: "absolute",
    left: SHEET_INSET,
    right: SHEET_INSET,
    bottom: 0,
    maxHeight: "88%",
    backgroundColor: colors.surface,
    borderRadius: SHEET_RADIUS,
    overflow: "hidden",
    ...smoothCorners,
    paddingTop: 6,
    paddingHorizontal: 20,
    boxShadow: elevation.float,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.edge,
  },
  grabber: { alignSelf: "center", width: 36, height: 5, borderRadius: radius.full, backgroundColor: "rgba(255,255,255,0.22)", marginBottom: 4 },
  header: { height: 44, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  title: { ...type.headline, color: colors.ink, maxWidth: "70%" },
  action: { position: "absolute", right: -12, top: 0, bottom: 0, justifyContent: "center" },
});
