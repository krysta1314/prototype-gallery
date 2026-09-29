import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextStyle } from "react-native";
import Icon from "../components/Icon";
import { GROUP_LABEL } from "../data";
import { useInsets, useNav, useStore } from "../provider";
import { sessionsFor, type Session } from "../store";
import { colors, DRAWER_RATIO } from "../theme";

const noOutline = { outlineStyle: "none" } as unknown as TextStyle;
const GROUPS: Session["group"][] = ["today", "yesterday", "week"];

/** ChatGPT 式会话抽屉:从左滑出,主页面被 App 同步推到右边 */
export default function SessionDrawer({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  const { navigate } = useNav();
  const insets = useInsets();
  const [query, setQuery] = useState("");
  const [width, setWidth] = useState(330);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [anim]);

  const q = query.trim().toLowerCase();
  const sessions = sessionsFor(state).filter((s) => !q || s.title.toLowerCase().includes(q));
  const select = (id: string | null) => {
    dispatch({ type: "selectSession", id });
    navigate({ type: "tab", tab: "create" });
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: anim }]}>
        <Pressable style={styles.backdrop} onPress={onClose} />
      </Animated.View>
      <Animated.View
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        style={[
          styles.panel,
          { width: `${DRAWER_RATIO * 100}%` as const, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 },
          { transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [-width, 0] }) }] },
        ]}
      >
        <View style={styles.search}>
          <Icon name="search" size={16} color={colors.faint} />
          <TextInput value={query} onChangeText={setQuery} placeholder="Search chats" placeholderTextColor={colors.faint} style={[styles.searchInput, noOutline]} />
        </View>
        <Pressable onPress={() => select(null)} style={styles.newChat}>
          <Icon name="square-pen" size={18} color={colors.accent} />
          <Text style={styles.newChatText}>New chat</Text>
        </Pressable>
        <ScrollView style={styles.list}>
          {GROUPS.map((g) => {
            const items = sessions.filter((s) => s.group === g);
            if (items.length === 0) return null;
            return (
              <View key={g} style={styles.group}>
                <Text style={styles.groupLabel}>{GROUP_LABEL[g]}</Text>
                {items.map((s) => (
                  <Pressable
                    key={s.id}
                    onPress={() => select(s.id)}
                    onLongPress={() => navigate({ type: "sheet", sheet: { name: "sessionActions", id: s.id } })}
                    style={[styles.item, s.id === state.currentSessionId && styles.itemActive]}
                  >
                    <Text style={styles.itemText} numberOfLines={1}>
                      {s.title}
                    </Text>
                  </Pressable>
                ))}
              </View>
            );
          })}
        </ScrollView>
        <Text style={styles.tip}>Long-press a chat to rename or delete it.</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(26,26,46,0.25)" },
  panel: { position: "absolute", left: 0, top: 0, bottom: 0, paddingHorizontal: 14, backgroundColor: colors.surface, boxShadow: "8px 0px 30px rgba(26,26,46,0.12)" },
  search: { flexDirection: "row", alignItems: "center", gap: 8, height: 42, paddingHorizontal: 12, borderRadius: 14, backgroundColor: colors.surfaceMuted },
  searchInput: { flex: 1, fontSize: 15, color: colors.ink },
  newChat: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 14, paddingHorizontal: 4 },
  newChatText: { fontSize: 16, fontWeight: "700", color: colors.ink },
  list: { flex: 1 },
  group: { marginBottom: 14 },
  groupLabel: { fontSize: 12, fontWeight: "700", color: colors.faint, marginBottom: 4, paddingHorizontal: 4 },
  item: { paddingVertical: 11, paddingHorizontal: 10, borderRadius: 12 },
  itemActive: { backgroundColor: colors.peach },
  itemText: { fontSize: 15, color: colors.ink },
  tip: { fontSize: 12, color: colors.faint, textAlign: "center", paddingTop: 8 },
});
