import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { useInsets } from "../provider";
import { colors, elevation, radius, type, smoothCorners } from "../theme";
import IconButton from "./IconButton";
import { DURATION } from "./motion";
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
  const { visible, onExited } = useSheetPresence();
  const anim = useRef(new Animated.Value(0)).current;
  const visibleRef = useRef(visible);
  visibleRef.current = visible;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: visible ? DURATION.sheetIn : DURATION.sheetOut,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && !visibleRef.current) onExited();
    });
  }, [visible, anim, onExited]);

  // 插值节点要稳定:任务在跑时整棵树每 250ms 重渲染,每次新建插值会在旧节点 detach 时把进行中的动画停掉
  const translateY = useMemo(() => anim.interpolate({ inputRange: [0, 1], outputRange: [600, 0] }), [anim]);
  const action = right === undefined ? <IconButton icon="x" color={colors.sub} onPress={onClose} accessibilityLabel="Close" /> : right;

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: visible ? "auto" : "none" }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: anim }]}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      </Animated.View>
      <Animated.View style={[styles.panel, { paddingBottom: insets.bottom + 16, transform: [{ translateY }] }]}>
        <View style={styles.grabber} />
        {title ? (
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
              {title}
            </Text>
            <View style={styles.action}>{action}</View>
          </View>
        ) : null}
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.scrim },
  panel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: "88%",
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    ...smoothCorners,
    paddingTop: 6,
    paddingHorizontal: 16,
    boxShadow: elevation.float,
  },
  grabber: { alignSelf: "center", width: 36, height: 5, borderRadius: radius.full, backgroundColor: "rgba(26,26,46,0.14)", marginBottom: 4 },
  header: { height: 44, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  title: { ...type.headline, color: colors.ink, maxWidth: "70%" },
  action: { position: "absolute", right: -12, top: 0, bottom: 0, justifyContent: "center" },
});
