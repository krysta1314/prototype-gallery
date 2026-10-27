import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, PanResponder, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextStyle } from "react-native";
import Icon from "../components/Icon";
import { DURATION, SHEET_SPRING } from "../components/motion";
import { useSheetPresence } from "../components/sheet-presence";
import { useInsets, useNav, useStore } from "../provider";
import { sessionsFor } from "../store";
import { colors, DRAWER_RATIO, HIT, radius, space, type } from "../theme";
import type { IconName } from "../data";

const noOutline = { outlineStyle: "none" } as unknown as TextStyle;

/**
 * 会话抽屉(2026-10-23 照豆包改版):从左滑出，主页面被 App 同步推到右边。
 * 顶部搜索胶囊 + 新对话键;会话不分组，一条列表(置顶的在最前、带图钉),只有标题。
 * 长按一条：这条浮起、其余变暗，下面弹出菜单(Rename / Pin / Select / Delete);Rename 就地改名。
 * 多选：长按菜单里的 Select 进入;顶部变成「N selected」+ ✕,每条前面一个圈(选中是品牌橙),底部 Pin | Delete
 */
export default function SessionDrawer({ onClose, menu, select: preselect }: { onClose: () => void; menu?: string; select?: string[] }) {
  const { state, dispatch } = useStore();
  const { navigate } = useNav();
  const insets = useInsets();
  const [query, setQuery] = useState("");
  const [width, setWidth] = useState(330);
  const [menuFor, setMenuFor] = useState<string | null>(menu ?? null);
  const [renaming, setRenaming] = useState<{ id: string; title: string } | null>(null);
  const [selecting, setSelecting] = useState(!!preselect);
  const [picked, setPicked] = useState<string[]>(preselect ?? []);
  const anim = useRef(new Animated.Value(0)).current;
  const menuAnim = useRef(new Animated.Value(0)).current;

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
    // 升起用弹簧(和 iOS 原生一致),收起用快速缓动
    (visible
      ? Animated.spring(anim, { toValue: 1, ...SHEET_SPRING, useNativeDriver: false })
      : Animated.timing(anim, { toValue: 0, duration: DURATION.sheetOut, easing: Easing.in(Easing.cubic), useNativeDriver: false })
    ).start(({ finished }) => {
      if (finished && !visibleRef.current) onExited();
    });
  }, [visible, anim, onExited]);

  // 长按菜单：从被按住的那条下面弹出(从左上角轻微放大);只动缩放不动透明度，动画被系统暂停时菜单也照样看得见
  useEffect(() => {
    if (!menuFor) return;
    menuAnim.setValue(0);
    Animated.timing(menuAnim, { toValue: 1, duration: 180, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [menuFor, menuAnim]);

  // 插值节点保持稳定:任务进行中每 250ms 会重渲染一次,新建节点可能打断进出场动画
  const translateX = useMemo(() => anim.interpolate({ inputRange: [0, 1], outputRange: [-width, 0] }), [anim, width]);
  const menuScale = useMemo(() => menuAnim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }), [menuAnim]);

  const q = query.trim().toLowerCase();
  const all = sessionsFor(state);
  const sessions = all.filter((s) => !q || s.title.toLowerCase().includes(q));
  const select = (id: string | null) => {
    dispatch({ type: "selectSession", id });
    navigate({ type: "tab", tab: "create" });
  };
  const startSelecting = (first?: string) => {
    setMenuFor(null);
    setSelecting(true);
    setPicked(first ? [first] : []);
  };
  const stopSelecting = () => {
    setSelecting(false);
    setPicked([]);
  };
  const togglePick = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const saveRename = () => {
    if (renaming) dispatch({ type: "renameSession", id: renaming.id, title: renaming.title });
    setRenaming(null);
  };

  // 多选底栏：选中的全是置顶 → Unpin,否则 Pin(只改需要改的)
  const pickedSessions = all.filter((s) => picked.includes(s.id));
  const allPinned = pickedSessions.length > 0 && pickedSessions.every((s) => s.pinned);
  const pinPicked = () => {
    pickedSessions.filter((s) => s.pinned === allPinned).forEach((s) => dispatch({ type: "togglePinSession", id: s.id }));
    stopSelecting();
  };
  const deletePicked = () => {
    picked.forEach((id) => dispatch({ type: "deleteSession", id }));
    dispatch({ type: "showToast", text: picked.length === 1 ? "Chat deleted" : `${picked.length} chats deleted` });
    stopSelecting();
  };

  const menuSession = all.find((s) => s.id === menuFor);
  const menuItems: { icon: IconName; label: string; danger?: boolean; onPress: () => void }[] = menuSession
    ? [
        {
          icon: "pencil",
          label: "Rename",
          onPress: () => {
            setMenuFor(null);
            setRenaming({ id: menuSession.id, title: menuSession.title });
          },
        },
        {
          icon: menuSession.pinned ? "pin-off" : "pin",
          label: menuSession.pinned ? "Unpin" : "Pin",
          onPress: () => {
            dispatch({ type: "togglePinSession", id: menuSession.id });
            setMenuFor(null);
          },
        },
        { icon: "list-checks", label: "Select", onPress: () => startSelecting(menuSession.id) },
        {
          icon: "trash",
          label: "Delete",
          danger: true,
          onPress: () => {
            dispatch({ type: "deleteSession", id: menuSession.id });
            dispatch({ type: "showToast", text: "Chat deleted" });
            setMenuFor(null);
          },
        },
      ]
    : [];
  const dim = menuFor ? styles.dimmed : null;

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
          { width: `${DRAWER_RATIO * 100}%` as const, paddingTop: insets.top + 8, paddingBottom: insets.bottom + (selecting ? 0 : 8) },
          { transform: [{ translateX }] },
        ]}
      >
        {/* 顶部：平时是搜索 + 新对话;多选时是「N selected」+ ✕ */}
        {selecting ? (
          <View style={styles.selectHead}>
            <Text style={styles.selectTitle}>{picked.length === 0 ? "Select chats" : `${picked.length} selected`}</Text>
            <Pressable onPress={stopSelecting} accessibilityRole="button" accessibilityLabel="Done selecting" style={({ pressed }) => [styles.roundBtn, pressed && styles.pressedBtn]}>
              <Icon name="x" size={20} color={colors.ink} />
            </Pressable>
          </View>
        ) : (
          <View style={[styles.head, dim]} pointerEvents={menuFor ? "none" : "auto"}>
            <View style={styles.search}>
              <Icon name="search" size={18} color={colors.faint} />
              <TextInput value={query} onChangeText={setQuery} placeholder="Search chats" placeholderTextColor={colors.faint} style={[styles.searchInput, noOutline]} />
            </View>
            <Pressable onPress={() => select(null)} accessibilityRole="button" accessibilityLabel="New chat" style={({ pressed }) => [styles.roundBtn, pressed && styles.pressedBtn]}>
              <Icon name="square-pen" size={19} color={colors.ink} />
            </Pressable>
          </View>
        )}

        <ScrollView style={styles.list} contentContainerStyle={[styles.listContent, menuFor ? styles.listContentMenu : null]} showsVerticalScrollIndicator={false}>
          {/* 菜单打开时：点空白处收起 */}
          {menuFor ? <Pressable style={styles.catcher} onPress={() => setMenuFor(null)} accessibilityLabel="Close menu" /> : null}
          {sessions.length === 0 ? <Text style={styles.empty}>{q ? "No chats match your search." : "Your chats will show up here."}</Text> : null}
          {sessions.map((s) => {
            const lifted = menuFor === s.id;
            const on = picked.includes(s.id);
            if (renaming?.id === s.id) {
              return (
                <View key={s.id} style={[styles.item, styles.itemEditing]}>
                  <TextInput
                    value={renaming.title}
                    onChangeText={(t) => setRenaming({ id: s.id, title: t })}
                    onSubmitEditing={saveRename}
                    onBlur={saveRename}
                    autoFocus
                    selectTextOnFocus
                    returnKeyType="done"
                    accessibilityLabel="Chat name"
                    style={[styles.itemText, styles.renameInput, noOutline]}
                  />
                </View>
              );
            }
            return (
              <View key={s.id} style={lifted ? styles.liftedWrap : null}>
                <Pressable
                  onPress={() => (selecting ? togglePick(s.id) : menuFor ? setMenuFor(null) : select(s.id))}
                  onLongPress={() => (selecting ? undefined : setMenuFor(s.id))}
                  delayLongPress={350}
                  accessibilityRole={selecting ? "checkbox" : "button"}
                  accessibilityState={selecting ? { checked: on } : { selected: s.id === state.currentSessionId }}
                  style={({ pressed }) => [
                    styles.item,
                    !selecting && s.id === state.currentSessionId && styles.itemActive,
                    lifted && styles.itemLifted,
                    menuFor && !lifted && styles.dimmed,
                    pressed && !lifted && styles.pressed,
                  ]}
                >
                  {selecting ? (
                    <View style={[styles.check, on && styles.checkOn]}>{on ? <Icon name="check" size={14} color={colors.white} strokeWidth={3} /> : null}</View>
                  ) : null}
                  <Text style={styles.itemText} numberOfLines={1}>
                    {s.title}
                  </Text>
                  {s.pinned && !selecting ? <Icon name="pin" size={14} color={colors.sub} /> : null}
                </Pressable>
                {lifted ? (
                  <Animated.View style={[styles.menu, { transform: [{ scale: menuScale }] }]} accessibilityRole="menu">
                    {menuItems.map((m) => (
                      <Pressable key={m.label} onPress={m.onPress} accessibilityRole="menuitem" style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}>
                        <Icon name={m.icon} size={20} color={m.danger ? colors.danger : colors.ink} />
                        <Text style={[styles.menuText, m.danger && styles.menuDanger]}>{m.label}</Text>
                      </Pressable>
                    ))}
                  </Animated.View>
                ) : null}
              </View>
            );
          })}
        </ScrollView>

        {/* 多选底栏:Pin | Delete,没选中时置灰 */}
        {selecting ? (
          <View style={[styles.selectBar, { paddingBottom: insets.bottom + 4 }]}>
            <Pressable onPress={pinPicked} disabled={picked.length === 0} accessibilityRole="button" style={({ pressed }) => [styles.barBtn, picked.length === 0 && styles.disabled, pressed && styles.faded]}>
              <Icon name={allPinned ? "pin-off" : "pin"} size={20} color={colors.ink} />
              <Text style={styles.barText}>{allPinned ? "Unpin" : "Pin"}</Text>
            </Pressable>
            <Pressable onPress={deletePicked} disabled={picked.length === 0} accessibilityRole="button" style={({ pressed }) => [styles.barBtn, picked.length === 0 && styles.disabled, pressed && styles.faded]}>
              <Icon name="trash" size={20} color={colors.danger} />
              <Text style={[styles.barText, styles.menuDanger]}>Delete</Text>
            </Pressable>
          </View>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  panel: { position: "absolute", left: 0, top: 0, bottom: 0, backgroundColor: colors.bg },
  head: { flexDirection: "row", alignItems: "center", gap: space.sm, paddingHorizontal: space.lg },
  search: { flex: 1, flexDirection: "row", alignItems: "center", gap: space.sm, height: 46, paddingHorizontal: space.lg, borderRadius: radius.full, backgroundColor: colors.grouped, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.edge },
  searchInput: { flex: 1, ...type.body, color: colors.ink },
  roundBtn: { width: 46, height: 46, borderRadius: radius.full, alignItems: "center", justifyContent: "center", backgroundColor: colors.grouped, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.edge },
  pressedBtn: { backgroundColor: colors.surface },
  selectHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingLeft: space.lg + 4, paddingRight: space.lg, minHeight: 46 },
  selectTitle: { ...type.headline, color: colors.ink },
  list: { flex: 1, marginTop: space.md },
  listContent: { paddingHorizontal: space.sm, paddingTop: space.xs, paddingBottom: space.xl },
  listContentMenu: { paddingBottom: 260 },
  catcher: { ...StyleSheet.absoluteFill, zIndex: 1 },
  item: { flexDirection: "row", alignItems: "center", gap: space.md, minHeight: HIT + 4, paddingHorizontal: space.md, borderRadius: radius.md },
  itemActive: { backgroundColor: colors.grouped },
  itemText: { flex: 1, ...type.body, color: colors.ink },
  // 长按浮起：整条亮一档、圆角胶囊，压在暗下去的列表之上
  liftedWrap: { zIndex: 3 },
  itemLifted: { backgroundColor: colors.raised, borderRadius: radius.lg },
  itemEditing: { backgroundColor: colors.grouped, borderWidth: 1, borderColor: colors.separator },
  renameInput: { height: HIT + 2 },
  dimmed: { opacity: 0.35 },
  pressed: { backgroundColor: colors.pressedOverlay },
  faded: { opacity: 0.5 },
  disabled: { opacity: 0.35 },
  empty: { ...type.subhead, color: colors.sub, textAlign: "center", paddingTop: space.xxl },
  menu: {
    position: "absolute",
    top: HIT + 12,
    left: 0,
    width: "78%",
    paddingVertical: space.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.edge,
    boxShadow: "0px 12px 32px rgba(0,0,0,0.55)",
    transformOrigin: "top left",
  } as object,
  menuItem: { flexDirection: "row", alignItems: "center", gap: space.md, minHeight: HIT, paddingHorizontal: space.lg },
  menuText: { ...type.body, color: colors.ink },
  menuDanger: { color: colors.danger },
  check: { width: 22, height: 22, borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.faint, alignItems: "center", justifyContent: "center" },
  checkOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  // 多选底栏：不要底色、分隔线，两个按钮直接放在页面上
  selectBar: { flexDirection: "row", alignItems: "center", paddingTop: space.sm },
  barBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.sm, height: 52 },
  barText: { ...type.headline, color: colors.ink },
});
