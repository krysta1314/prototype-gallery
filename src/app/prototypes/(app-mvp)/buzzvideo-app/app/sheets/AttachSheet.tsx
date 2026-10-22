import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Icon from "../components/Icon";
import Sheet from "../components/Sheet";
import { pressScale } from "../components/motion";
import { RECENT_PHOTOS, type IconName } from "../data";
import { nextId } from "../ids";
import { useNav, useStore } from "../provider";
import { colors, radius, space, type, smoothCorners } from "../theme";

/**
 * 「+」附件面板(2026-10-22 按即梦「添加」面板重做):
 * 不放标题(2026-10-22 去掉 Add),顶部直接一排胶囊入口(Camera / Assets / Files)→ 最近照片三列圆角网格(不加小标题)，右上角圆圈多选 →
 * 选了才出现整条「Add N」按钮。点 Assets 进素材库页(All / Videos / Images 下划线 tab)
 */
export default function AttachSheet({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  const { navigate } = useNav();
  const [view, setView] = useState<"main" | "assets">("main");
  const [selected, setSelected] = useState<string[]>([]);
  const photos = state.permissions.photos;
  const camera = state.permissions.camera;

  // 相册权限在打开面板时请求(用到时才请求)
  useEffect(() => {
    dispatch({ type: "requestPermission", kind: "photos" });
  }, [dispatch]);

  const visible = photos === "granted" ? RECENT_PHOTOS : photos === "limited" ? RECENT_PHOTOS.slice(0, 3) : [];
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const openCamera = () => {
    if (camera === "granted") {
      navigate({ type: "push", route: { name: "camera" } });
    } else if (camera === "undetermined") {
      dispatch({ type: "requestPermission", kind: "camera", then: "openCamera" });
    } else {
      // 拒绝过：系统不会再弹授权框，APP 弹提示框引导去设置
      dispatch({ type: "showSettingsAlert", kind: "camera" });
    }
  };

  const addPhotos = () => {
    const items = RECENT_PHOTOS.filter((p) => selected.includes(p.id)).map((p) => ({ id: nextId("a"), uri: p.uri, kind: p.kind, duration: p.duration }));
    dispatch({ type: "addAttachments", items });
    onClose();
  };

  if (view === "assets") return <AssetsView onBack={() => setView("main")} onClose={onClose} />;

  const entries: { id: string; icon: IconName; label: string; onPress: () => void }[] = [
    { id: "camera", icon: "camera", label: "Camera", onPress: openCamera },
    { id: "assets", icon: "folder-open", label: "Assets", onPress: () => setView("assets") },
    {
      id: "files",
      icon: "file-text",
      label: "Files",
      // 关掉面板，弹 iOS 系统文件选择器
      onPress: () => {
        onClose();
        dispatch({ type: "openFilesPicker" });
      },
    },
  ];

  return (
    <Sheet onClose={onClose}>
      <View style={styles.entries}>
        {entries.map((e) => (
          <Pressable key={e.id} onPress={e.onPress} accessibilityRole="button" style={({ pressed }) => [styles.entry, pressed && styles.entryOn, pressScale(pressed)]}>
            <Icon name={e.icon} size={17} color={colors.ink} strokeWidth={2} />
            <Text style={styles.entryLabel}>{e.label}</Text>
          </Pressable>
        ))}
      </View>

      {photos === "denied" || photos === "undetermined" ? (
        <View style={styles.denied}>
          <Icon name="images" size={22} color={colors.sub} />
          <Text style={styles.deniedText}>Allow photo access to pick from your library.</Text>
          {/* 面板里本来就有明确的按钮，直接跳设置，不用再弹一层提示框 */}
          <Pressable onPress={() => dispatch({ type: "openIosSettings" })} accessibilityRole="button" style={({ pressed }) => [styles.settingsBtn, pressScale(pressed)]}>
            <Text style={styles.settingsBtnText}>Open Settings</Text>
          </Pressable>
        </View>
      ) : (
        <PhotoGrid items={visible} selected={selected} onToggle={toggle} />
      )}
      {photos === "limited" ? <Text style={styles.limited}>Showing the photos you allowed. Manage in Settings.</Text> : null}

      <Footer count={selected.length} onNext={addPhotos} />
    </Sheet>
  );
}

type GridItem = { id: string; uri: string; kind: "photo" | "video"; duration?: string };

/** 三列圆角方格(每格单独圆角，4pt 缝);右上角圆圈，选中变橙色并显示第几张，格子微微缩小 + 压暗 */
function PhotoGrid({ items, selected, onToggle }: { items: GridItem[]; selected: string[]; onToggle: (id: string) => void }) {
  const [w, setW] = useState(0);
  const cell = w ? (w - GAP * 2) / 3 : 0;
  return (
    <View style={styles.grid} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {items.map((p) => {
        const n = selected.indexOf(p.id) + 1;
        return (
          <Pressable key={p.id} onPress={() => onToggle(p.id)} accessibilityRole="checkbox" accessibilityState={{ checked: n > 0 }} style={[styles.cell, { width: cell, height: cell }, n > 0 && styles.cellPicked]}>
            <Image source={{ uri: p.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            {n > 0 ? <View style={styles.cellOn} pointerEvents="none" /> : null}
            {p.duration ? (
              <View style={styles.durationPill}>
                <Icon name="play" size={9} color={colors.white} fill={colors.white} strokeWidth={2} />
                <Text style={styles.duration}>{p.duration}</Text>
              </View>
            ) : null}
            <View style={[styles.check, n > 0 && styles.checkOn]}>{n > 0 ? <Text style={styles.checkNum}>{n}</Text> : null}</View>
          </Pressable>
        );
      })}
    </View>
  );
}

/** 选了才出现的整条按钮「Add 2」;没选时不放一个灰掉的死按钮 */
function Footer({ count, onNext }: { count: number; onNext: () => void }) {
  if (count === 0) return null;
  return (
    <Pressable onPress={onNext} accessibilityRole="button" style={({ pressed }) => [styles.cta, pressScale(pressed)]}>
      <Text style={styles.ctaText}>{`Add ${count}`}</Text>
    </Pressable>
  );
}

const ASSET_TABS = [
  { id: "all", label: "All" },
  { id: "video", label: "Videos" },
  { id: "photo", label: "Images" },
] as const;

/** 素材库(参照即梦「我的资产」):左上 ✕ 回到添加面板;All / Videos / Images 三个 tab;同样的三列网格 + 底部 Next */
function AssetsView({ onBack, onClose }: { onBack: () => void; onClose: () => void }) {
  const { state, dispatch } = useStore();
  const [tab, setTab] = useState<(typeof ASSET_TABS)[number]["id"]>("all");
  const [selected, setSelected] = useState<string[]>([]);
  const list = state.library.filter((a) => tab === "all" || a.kind === tab);
  const add = () => {
    const items = state.library
      .filter((a) => selected.includes(a.id))
      .map((a) => ({ id: nextId("a"), uri: a.uri, kind: a.kind, label: a.label, uploaded: true }));
    dispatch({ type: "addAttachments", items });
    onClose();
  };
  return (
    <Sheet onClose={onClose}>
      <View style={styles.assetsTall}>
        <View style={styles.assetsHead}>
          <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Back" hitSlop={6} style={({ pressed }) => [styles.round, pressScale(pressed)]}>
            <Icon name="chevron-left" size={18} color={colors.ink} strokeWidth={2.4} />
          </Pressable>
          <Text style={styles.assetsTitle} accessibilityRole="header">
            Assets
          </Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={6} style={({ pressed }) => [styles.round, pressScale(pressed)]}>
            <Icon name="x" size={16} color={colors.ink} strokeWidth={2.4} />
          </Pressable>
        </View>
        <View style={styles.tabs} accessibilityRole="tablist">
          {ASSET_TABS.map((t) => {
            const on = t.id === tab;
            return (
              <Pressable key={t.id} onPress={() => setTab(t.id)} accessibilityRole="tab" accessibilityState={{ selected: on }} style={styles.tab}>
                <Text style={[styles.tabText, on && styles.tabTextOn]}>{t.label}</Text>
                {on ? <View style={styles.tabBar} /> : null}
              </Pressable>
            );
          })}
        </View>
        {list.length === 0 ? (
          <View style={styles.empty}>
            <Icon name="folder-open" size={40} color={colors.faint} strokeWidth={1.4} />
            <Text style={styles.emptyText}>No assets yet. Anything you upload on web or phone shows up here.</Text>
          </View>
        ) : (
          <PhotoGrid items={list} selected={selected} onToggle={(id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))} />
        )}
        <View style={styles.flex} />
        <Footer count={selected.length} onNext={add} />
      </View>
    </Sheet>
  );
}

const GAP = 4;
const GLASS = "rgba(255,255,255,0.08)";
const styles = StyleSheet.create({
  flex: { flex: 1 },
  round: { width: 32, height: 32, borderRadius: radius.full, alignItems: "center", justifyContent: "center", backgroundColor: GLASS },
  entries: { flexDirection: "row", gap: space.sm, marginTop: space.sm, marginBottom: space.lg },
  entry: { flex: 1, height: 44, borderRadius: radius.full, backgroundColor: GLASS, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  entryOn: { backgroundColor: "rgba(255,255,255,0.14)" },
  entryLabel: { ...type.footnote, fontWeight: "600", color: colors.ink },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: GAP },
  cell: { backgroundColor: colors.grouped, borderRadius: radius.md, overflow: "hidden", ...smoothCorners },
  cellPicked: { transform: [{ scale: 0.93 }] },
  cellOn: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.3)" },
  durationPill: { position: "absolute", left: 6, bottom: 6, flexDirection: "row", alignItems: "center", gap: 3, height: 18, paddingHorizontal: 6, borderRadius: radius.full, backgroundColor: "rgba(0,0,0,0.45)" },
  duration: { ...type.caption, color: colors.white, fontVariant: ["tabular-nums"] },
  check: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.92)",
    backgroundColor: "rgba(0,0,0,0.12)",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 1px 3px rgba(0,0,0,0.35)",
  },
  checkOn: { backgroundColor: colors.accent, borderColor: colors.white },
  checkNum: { ...type.caption1, lineHeight: 14, fontWeight: "700", color: colors.white },
  denied: { alignItems: "center", gap: space.sm, paddingVertical: space.xl, paddingHorizontal: space.xl, borderRadius: radius.lg, backgroundColor: colors.grouped },
  deniedText: { ...type.footnote, color: colors.sub, textAlign: "center" },
  settingsBtn: { height: 34, paddingHorizontal: 16, borderRadius: radius.full, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center", marginTop: space.xs },
  settingsBtnText: { ...type.footnote, fontWeight: "600", color: colors.ink },
  limited: { ...type.footnote, color: colors.sub, marginTop: space.sm },
  cta: { height: 50, marginTop: space.lg, borderRadius: radius.full, backgroundColor: colors.inverse, alignItems: "center", justifyContent: "center" },
  ctaText: { ...type.headline, color: colors.onInverse },
  assetsTall: { minHeight: 560 },
  assetsHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 2, marginBottom: space.md },
  assetsTitle: { ...type.headline, color: colors.ink },
  // 下划线 tab(2026-10-22 按即梦「我的资产」):选中粗体白字 + 底下一条粗短线，整排下面一条细分隔线
  tabs: { flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator, marginBottom: space.md },
  tab: { flex: 1, alignItems: "center", paddingTop: 6, paddingBottom: 12 },
  tabText: { ...type.subhead, fontWeight: "500", color: colors.sub },
  tabTextOn: { color: colors.ink, fontWeight: "700" },
  tabBar: { position: "absolute", bottom: -1, width: 34, height: 3, borderRadius: radius.xs, backgroundColor: colors.accent },
  empty: { alignItems: "center", gap: space.md, paddingTop: 120, paddingHorizontal: space.xl },
  emptyText: { ...type.footnote, color: colors.sub, textAlign: "center" },
});
