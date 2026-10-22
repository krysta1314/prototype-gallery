import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { nextId } from "../ids";
import { useInsets, useStore } from "../provider";
import { smoothCorners } from "../theme";
import Icon from "./Icon";

/* iOS 深色外观的系统色(文件选择器是系统 UI,不走品牌色) */
const IOS = {
  sheet: "#1c1c1e",
  field: "rgba(118,118,128,0.24)",
  glass: "rgba(120,120,128,0.32)",
  label: "#ffffff",
  secondary: "rgba(235,235,245,0.6)",
  tertiary: "rgba(235,235,245,0.3)",
  blue: "#0a84ff",
};

type FileItem = { name: string; ext: "pdf" | "docx" | "numbers"; date: string; size: string };
/** 最近文件。只接受 PDF(品牌手册、产品资料);别的格式灰掉点不了，和真机 UIDocumentPicker 限定类型一样 */
const FILES: FileItem[] = [
  { name: "Brand guidelines", ext: "pdf", date: "Oct 18, 2026", size: "2.4 MB" },
  { name: "Iced latte product sheet", ext: "pdf", date: "Oct 15, 2026", size: "860 KB" },
  { name: "Autumn menu", ext: "pdf", date: "Oct 9, 2026", size: "1.1 MB" },
  { name: "Price list", ext: "numbers", date: "Oct 6, 2026", size: "320 KB" },
  { name: "Shop story", ext: "docx", date: "Sep 28, 2026", size: "48 KB" },
  { name: "Wholesale catalog", ext: "pdf", date: "Sep 20, 2026", size: "5.8 MB" },
];
const EXT_TINT: Record<FileItem["ext"], string> = { pdf: "#ff453a", docx: "#0a84ff", numbers: "#30d158" };

/**
 * 模拟 iOS 26 文件选择器(2026-10-22):附件面板点 Files 弹出。整页 sheet,顶部 ✕ + Recents + 搜索框，
 * 三列文件格子，底部 Recents / Shared / Browse。点一个 PDF → 加进输入框。
 * 真实 APP 不画这一页，调 UIDocumentPickerViewController(forOpeningContentTypes: [.pdf])
 */
export default function IosFilesPicker() {
  const { state, dispatch } = useStore();
  const insets = useInsets();
  if (!state.filesPickerOpen) return null;
  const close = () => dispatch({ type: "closeFilesPicker" });
  const pick = (f: FileItem) => {
    dispatch({ type: "addAttachments", items: [{ id: nextId("a"), uri: "", kind: "pdf", label: `${f.name}.pdf` }] });
    close();
  };

  return (
    <View style={styles.root} accessibilityViewIsModal>
      <Pressable style={styles.backdrop} onPress={close} accessibilityLabel="Cancel" />
      <View style={[styles.sheet, { top: insets.top + 10 }]}>
        <View style={styles.head}>
          <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="Cancel" style={({ pressed }) => [styles.glassBtn, pressed && styles.pressed]}>
            <Icon name="x" size={18} color={IOS.label} strokeWidth={2.4} />
          </Pressable>
          <Text style={styles.title} accessibilityRole="header">
            Recents
          </Text>
          <View style={styles.glassBtn}>
            <Icon name="ellipsis" size={18} color={IOS.label} strokeWidth={2.4} />
          </View>
        </View>
        <View style={styles.search}>
          <Icon name="search" size={16} color={IOS.secondary} strokeWidth={2.2} />
          <Text style={styles.searchText}>Search</Text>
          <Icon name="mic" size={16} color={IOS.secondary} strokeWidth={2.2} />
        </View>

        <ScrollView contentContainerStyle={styles.grid}>
          {FILES.map((f) => {
            const ok = f.ext === "pdf";
            return (
              <Pressable key={f.name} disabled={!ok} onPress={() => pick(f)} accessibilityRole="button" accessibilityState={{ disabled: !ok }} style={({ pressed }) => [styles.file, !ok && styles.fileOff, pressed && styles.pressed]}>
                {/* 文档缩略图：白色纸张 + 底部格式色条 */}
                <View style={styles.doc}>
                  <View style={styles.docLines}>
                    {[0.9, 0.7, 0.85, 0.6, 0.75].map((w, i) => (
                      <View key={i} style={[styles.docLine, { width: `${w * 100}%` }]} />
                    ))}
                  </View>
                  <View style={[styles.docTag, { backgroundColor: EXT_TINT[f.ext] }]}>
                    <Text style={styles.docTagText}>{f.ext.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.fileName} numberOfLines={2}>
                  {f.name}
                </Text>
                <Text style={styles.fileMeta}>{f.date}</Text>
                <Text style={styles.fileMeta}>{f.size}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={[styles.tabs, { marginBottom: Math.max(insets.bottom - 14, 10) }]}>
          {[
            { icon: "rotate-ccw" as const, label: "Recents", on: true },
            { icon: "user-round" as const, label: "Shared", on: false },
            { icon: "folder-open" as const, label: "Browse", on: false },
          ].map((t) => (
            <View key={t.label} style={[styles.tab, t.on && styles.tabOn]}>
              <Icon name={t.icon} size={20} color={t.on ? IOS.blue : IOS.label} strokeWidth={2} />
              <Text style={[styles.tabText, t.on && styles.tabTextOn]}>{t.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 35 },
  backdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: IOS.sheet, borderTopLeftRadius: 38, borderTopRightRadius: 38, ...smoothCorners },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 16 },
  glassBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: IOS.glass, alignItems: "center", justifyContent: "center" },
  pressed: { opacity: 0.6 },
  title: { fontSize: 17, lineHeight: 22, fontWeight: "600", letterSpacing: -0.4, color: IOS.label },
  search: { flexDirection: "row", alignItems: "center", gap: 6, height: 40, marginHorizontal: 16, marginTop: 12, paddingHorizontal: 12, borderRadius: 20, backgroundColor: IOS.field },
  searchText: { flex: 1, fontSize: 17, lineHeight: 22, letterSpacing: -0.4, color: IOS.secondary },
  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 10, paddingTop: 20, paddingBottom: 20, rowGap: 20 },
  file: { width: "33.333%", alignItems: "center", paddingHorizontal: 6 },
  fileOff: { opacity: 0.35 },
  doc: { width: 70, height: 90, borderRadius: 6, backgroundColor: "#f2f2f7", padding: 9, justifyContent: "space-between", overflow: "hidden", marginBottom: 8 },
  docLines: { gap: 5 },
  docLine: { height: 3, borderRadius: 2, backgroundColor: "#c7c7cc" },
  docTag: { alignSelf: "flex-start", paddingHorizontal: 5, height: 15, borderRadius: 3, justifyContent: "center" },
  docTagText: { fontSize: 9, lineHeight: 11, fontWeight: "800", color: "#ffffff" },
  fileName: { fontSize: 13, lineHeight: 16, fontWeight: "500", color: IOS.label, textAlign: "center" },
  fileMeta: { fontSize: 11, lineHeight: 14, color: IOS.secondary, textAlign: "center" },
  tabs: { flexDirection: "row", alignSelf: "center", padding: 4, borderRadius: 32, backgroundColor: "rgba(44,44,46,0.92)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.12)" },
  tab: { width: 96, height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center", gap: 2 },
  tabOn: { backgroundColor: "rgba(255,255,255,0.1)" },
  tabText: { fontSize: 10, lineHeight: 12, fontWeight: "600", color: IOS.label },
  tabTextOn: { color: IOS.blue },
});
