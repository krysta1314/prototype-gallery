/* 贴纸风 Create 自己的浮层(面板、抽屉、成片查看)。
 * Create 是一个 Tab,页面在底部栏上面;浮层要盖住底部栏，所以用 portal 挂到 APP 根节点(AppS 的 root,overflow: hidden 那层)。
 * 第一版的面板渲染器会画旧样式，所以模式 / 模型 / 音色 / 会话这些面板都走这里的本地状态 */

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Animated, Easing, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { GZSheet, gz } from "../../kit/gz";

const HostCtx = createContext<HTMLElement | null>(null);

/** 从 Create 页往上找到 APP 根(第一个 overflow: hidden 的祖先) */
export function useOverlayHost() {
  const ref = useRef<never>(null);
  const [host, setHost] = useState<HTMLElement | null>(null);
  useEffect(() => {
    let el = ref.current as unknown as HTMLElement | null;
    while (el?.parentElement) {
      el = el.parentElement;
      if (getComputedStyle(el).overflow === "hidden") break;
    }
    setHost(el ?? null);
  }, []);
  return { ref, host };
}

export const OverlayHostProvider = HostCtx.Provider;

/** 盖满整台手机的一层(z 轴在所有页面和底部栏之上) */
export function Overlay({ children }: { children: ReactNode }) {
  const host = useContext(HostCtx);
  if (!host) return null;
  return createPortal(<View style={styles.layer}>{children}</View>, host);
}

/** 进场:快速减速曲线，不回弹(贴纸风动效规则) */
function useEnter(duration = 260) {
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const a = Animated.timing(v, { toValue: 1, duration, easing: Easing.bezier(0.16, 1, 0.3, 1), useNativeDriver: false });
    a.start();
    return () => a.stop();
  }, [v, duration]);
  return v;
}

/** 底部面板：黑色半透明遮罩 + 贴底的 GZSheet,内容超高时可滚动 */
export function BottomSheet({ title, onClose, children, scroll = true, maxH = 0.86 }: { title: string; onClose: () => void; children: ReactNode; scroll?: boolean; maxH?: number }) {
  const v = useEnter();
  const host = useContext(HostCtx);
  // 面板最高占屏幕 86%,减去把手和标题那 60pt 就是内容区能滚的高度
  const bodyMax = Math.max(240, (host?.clientHeight ?? 800) * maxH - 60);
  const y = useMemo(() => v.interpolate({ inputRange: [0, 1], outputRange: [60, 0] }), [v]);
  return (
    <Overlay>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: v }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
      </Animated.View>
      <View style={styles.bottom} pointerEvents="box-none">
        <Animated.View style={{ opacity: v, transform: [{ translateY: y }] }}>
          <GZSheet title={title} onClose={onClose}>
            {scroll ? (
              <ScrollView style={{ maxHeight: bodyMax }} contentContainerStyle={styles.sheetBody} showsVerticalScrollIndicator={false}>
                {children}
              </ScrollView>
            ) : (
              <View style={styles.sheetBody}>{children}</View>
            )}
          </GZSheet>
        </Animated.View>
      </View>
    </Overlay>
  );
}

/** 左侧抽屉(会话列表) */
export function Drawer({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  const v = useEnter(240);
  const x = useMemo(() => v.interpolate({ inputRange: [0, 1], outputRange: [-340, 0] }), [v]);
  return (
    <Overlay>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: v }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close chats" />
      </Animated.View>
      <Animated.View style={[styles.drawer, { transform: [{ translateX: x }] }]}>{children}</Animated.View>
    </Overlay>
  );
}

/** 全屏(成片查看) */
export function FullScreen({ children }: { children: ReactNode }) {
  const v = useEnter(220);
  return (
    <Overlay>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: gz.color.black, opacity: v }]}>{children}</Animated.View>
    </Overlay>
  );
}

const styles = StyleSheet.create({
  layer: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 },
  backdrop: { backgroundColor: "rgba(0,0,0,0.6)" },
  bottom: { position: "absolute", left: 0, right: 0, bottom: 0, top: 0, justifyContent: "flex-end" },
  sheetBody: { paddingHorizontal: 16, paddingBottom: 28, gap: 18 },
  drawer: { position: "absolute", top: 0, bottom: 0, left: 0, width: "84%", backgroundColor: gz.color.page, borderTopRightRadius: 24, borderBottomRightRadius: 24, overflow: "hidden" },
});
