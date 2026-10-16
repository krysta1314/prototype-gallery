import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text } from "react-native";
import Gradient from "./Gradient";
import { prefersReducedMotion } from "./motion";

/**
 * 订阅标签:和网页端同一套规范(/prototypes/tier-badges)—— 135° 渐变 · 圆角 5 · 11/600 · padding 2×7。
 * 前几档浅色底 + 同色系深字;Enterprise 是唯一的深色档(黑底金字)。
 *
 * celebrateFrom:刚付费升级时传入旧档位,标签先显示旧档,缩一下换成新档、弹簧弹回,再划过一道高光;
 * 播完调用 onCelebrated。系统开了「减少动态效果」时直接换成新档,不播动画
 */
export type BadgeTier = "free" | "starter" | "pro" | "ultra" | "enterprise";

const TIERS: Record<BadgeTier, { label: string; from: string; to: string; text: string }> = {
  free: { label: "Free", from: "#F2F2F0", to: "#E2E2DE", text: "#5C5650" },
  starter: { label: "Starter", from: "#FFF3E0", to: "#FFE3BC", text: "#9A3412" },
  pro: { label: "Pro", from: "#FFEADD", to: "#FFD4BE", text: "#9A3412" },
  ultra: { label: "Ultra", from: "#F3E8FF", to: "#E4D4FF", text: "#6D28D9" },
  enterprise: { label: "Enterprise", from: "#2C2620", to: "#100E0B", text: "#E8C583" },
};

export default function PlanBadge({
  tier,
  celebrateFrom,
  onCelebrated,
}: {
  tier: BadgeTier;
  celebrateFrom?: BadgeTier | null;
  onCelebrated?: () => void;
}) {
  const [swapped, setSwapped] = useState(false);
  const [width, setWidth] = useState(0);
  const [scale] = useState(() => new Animated.Value(1));
  const [shine] = useState(() => new Animated.Value(0));
  const done = useRef(onCelebrated);
  useEffect(() => {
    done.current = onCelebrated;
  });
  const celebrating = !!celebrateFrom && celebrateFrom !== tier && !prefersReducedMotion();
  // 庆祝时先显示旧档,换档那一刻切到新档
  const shown: BadgeTier = celebrating && !swapped ? celebrateFrom! : tier;

  useEffect(() => {
    if (!celebrateFrom || celebrateFrom === tier) return;
    if (!celebrating) {
      done.current?.();
      return;
    }
    shine.setValue(0);
    // 停一拍让用户看清旧档 → 缩小换档 → 弹簧弹回 → 高光划过
    const anim = Animated.sequence([
      Animated.delay(450),
      Animated.timing(scale, { toValue: 0.82, duration: 140, easing: Easing.in(Easing.quad), useNativeDriver: false }),
    ]);
    anim.start(({ finished }) => {
      if (!finished) return;
      setSwapped(true);
      Animated.sequence([
        Animated.spring(scale, { toValue: 1, friction: 4, tension: 160, useNativeDriver: false }),
        Animated.timing(shine, { toValue: 1, duration: 650, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }),
      ]).start(() => done.current?.());
    });
    return () => anim.stop();
  }, [celebrateFrom, tier, celebrating, scale, shine]);

  const t = TIERS[shown];
  const translateX = shine.interpolate({ inputRange: [0, 1], outputRange: [-40, width + 40] });
  return (
    <Animated.View style={[styles.wrap, { transform: [{ scale }] }]} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {/* Enterprise 是深色档:深色页面上加一道淡金边,不然黑底会融进背景 */}
      <Gradient colors={[t.from, t.to]} angle={135} style={[styles.badge, shown === "enterprise" && styles.badgeDark]}>
        <Text style={[styles.text, { color: t.text }]} accessibilityLabel={`${t.label} plan`}>
          {t.label}
        </Text>
        {celebrateFrom ? (
          <Animated.View pointerEvents="none" style={[styles.shine, { transform: [{ translateX }, { rotate: "20deg" }] }]}>
            <Gradient colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.85)", "rgba(255,255,255,0)"]} angle={90} style={StyleSheet.absoluteFill} />
          </Animated.View>
        ) : null}
      </Gradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: "flex-start" },
  badge: { borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2, overflow: "hidden" },
  badgeDark: { borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(232,197,131,0.45)" },
  text: { fontSize: 11, lineHeight: 16, fontWeight: "600", letterSpacing: 0.1 },
  shine: { position: "absolute", top: -8, bottom: -8, left: 0, width: 22 },
});
