import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Image, PanResponder, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextStyle } from "react-native";
import Icon from "../components/Icon";
import { DURATION } from "../components/motion";
import { useSheetPresence } from "../components/sheet-presence";
import { useInsets, useNav, useStore } from "../provider";
import { sessionsFor } from "../store";
import { colors, DRAWER_RATIO, elevation, HIT, radius, space, type } from "../theme";

const noOutline = { outlineStyle: "none" } as unknown as TextStyle;

/** ChatGPT 式会话抽屉:从左滑出,主页面被 App 同步推到右边 */
export default function SessionDrawer({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  const { navigate } = useNav();
  const insets = useInsets();
  const [query, setQuery] = useState("");
  const [width, setWidth] = useState(330);
  const anim = useRef(new Animated.Value(0)).current;

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dx < -12 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderRelease: (_, g) => {
        if (g.dx < -40 && Math.abs(g.dx) > Math.abs(g.dy)) closeRef.current();
      },
    }),
  ).current;
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  // 进场 / 退场;退场结束后才卸载(App 的主页面同步右移、归位)
  const { visible, onExited } = useSheetPresence();
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

  // 插值节点保持稳定:任务进行中每 250ms 会重渲染一次,新建节点可能打断进出场动画
  const translateX = useMemo(() => anim.interpolate({ inputRange: [0, 1], outputRange: [-width, 0] }), [anim, width]);

  const q = query.trim().toLowerCase();
  const sessions = sessionsFor(state).filter((s) => !q || s.title.toLowerCase().includes(q));
  // 每个会话最新一个作品的封面,做成 32×32 缩略图
  const coverOf = (sid: string) => state.jobs.find((j) => j.sessionId === sid)?.cover;
  const select = (id: string | null) => {
    dispatch({ type: "selectSession", id });
    navigate({ type: "tab", tab: "create" });
  };

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: visible ? "auto" : "none" }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: anim }]}>
        <Pressable style={styles.backdrop} onPress={onClose} />
      </Animated.View>
      <Animated.View
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        {...pan.panHandlers}
        style={[
          styles.panel,
          { width: `${DRAWER_RATIO * 100}%` as const, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 },
          { transform: [{ translateX }] },
        ]}
      >
        <View style={styles.search}>
          <Icon name="search" size={16} color={colors.faint} />
          <TextInput value={query} onChangeText={setQuery} placeholder="Search chats" placeholderTextColor={colors.faint} style={[styles.searchInput, noOutline]} />
        </View>
        <Pressable onPress={() => select(null)} accessibilityRole="button" style={({ pressed }) => [styles.newChat, pressed && styles.pressed]}>
          <View style={styles.newChatIcon}>
            <Icon name="square-pen" size={22} color={colors.ink} />
          </View>
          <Text style={styles.newChatText}>New chat</Text>
        </Pressable>
        <ScrollView style={styles.list}>
          {sessions.map((s) => {
            const cover = coverOf(s.id);
            return (
              <Pressable
                key={s.id}
                onPress={() => select(s.id)}
                onLongPress={() => navigate({ type: "sheet", sheet: { name: "sessionActions", id: s.id } })}
                accessibilityRole="button"
                accessibilityState={{ selected: s.id === state.currentSessionId }}
                style={({ pressed }) => [styles.item, s.id === state.currentSessionId && styles.itemActive, pressed && styles.pressed]}
              >
                {cover ? (
                  <Image source={{ uri: cover }} style={styles.thumb} resizeMode="cover" />
                ) : (
                  <View style={[styles.thumb, styles.thumbEmpty]}>
                    <Icon name="message-square" size={16} color={colors.sub} />
                  </View>
                )}
                <Text style={styles.itemText} numberOfLines={1}>
                  {s.title}
                </Text>
                {s.pinned ? <Icon name="pin" size={14} color={colors.sub} /> : null}
              </Pressable>
            );
          })}
        </ScrollView>
        <Text style={styles.tip}>Long-press a chat to pin, rename or delete it.</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  panel: { position: "absolute", left: 0, top: 0, bottom: 0, paddingHorizontal: space.md, backgroundColor: colors.surface, boxShadow: elevation.float },
  search: { flexDirection: "row", alignItems: "center", gap: space.sm, height: 40, paddingHorizontal: space.md, borderRadius: radius.md, backgroundColor: colors.grouped },
  searchInput: { flex: 1, ...type.subhead, color: colors.ink },
  newChat: { flexDirection: "row", alignItems: "center", gap: space.md, minHeight: HIT, marginTop: space.sm, paddingHorizontal: space.sm, borderRadius: radius.md },
  newChatIcon: { width: 32, alignItems: "center" },
  newChatText: { ...type.headline, color: colors.ink },
  pressed: { backgroundColor: colors.pressed },
  list: { flex: 1, marginTop: space.sm },
  item: { flexDirection: "row", alignItems: "center", gap: space.md, minHeight: HIT, paddingVertical: 6, paddingHorizontal: space.sm, borderRadius: radius.md },
  itemActive: { backgroundColor: colors.grouped },
  thumb: { width: 32, height: 32, borderRadius: radius.xs, backgroundColor: colors.grouped },
  thumbEmpty: { alignItems: "center", justifyContent: "center" },
  itemText: { flex: 1, ...type.subhead, color: colors.ink },
  tip: { ...type.footnote, color: colors.sub, textAlign: "center", paddingTop: space.sm },
});
