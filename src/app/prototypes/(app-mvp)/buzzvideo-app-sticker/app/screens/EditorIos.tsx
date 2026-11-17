import { useState, type ReactNode } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { poster } from "../data";
import { BrandIcon, Icon, useInsets, type IconName } from "../v1";

const fmtT = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/** 相册里的示例素材(用 For You 里的宠物片子当「自己拍的」) */
export const LIBRARY = [
  { id: "poodle", dur: 6 },
  { id: "dogcam", dur: 5 },
  { id: "collie", dur: 6 },
  { id: "catfan", dur: 4 },
  { id: "dreamcore", dur: 9 },
  { id: "fruit", dur: 7 },
  { id: "museum", dur: 9 },
  { id: "gatsby", dur: 8 },
  { id: "hotel", dur: 9 },
];

/** iOS 系统照片选择器(PHPicker,照真机的深色样式) */
export function PhotoPicker({ onCancel, onAdd }: { onCancel: () => void; onAdd: (ids: string[]) => void }) {
  const insets = useInsets();
  const [picked, setPicked] = useState<string[]>([]);
  const toggle = (id: string) => setPicked((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id]));
  return (
    <View style={{ flex: 1, backgroundColor: "#000", paddingTop: insets.top + 10 }}>
      <View style={ios.sheet}>
        <View style={ios.grabber} />
        <View style={ios.head}>
          <Pressable onPress={onCancel} hitSlop={8}>
            <Text style={ios.link}>Cancel</Text>
          </Pressable>
          <Text style={ios.title}>Recents</Text>
          <Pressable onPress={() => picked.length && onAdd(picked)} disabled={!picked.length} hitSlop={8}>
            <Text style={[ios.link, { fontWeight: "600" }, !picked.length && { opacity: 0.4 }]}>{picked.length ? `Add (${picked.length})` : "Add"}</Text>
          </Pressable>
        </View>
        <View style={ios.seg}>
          <View style={[ios.segItem, ios.segOn]}>
            <Text style={ios.segText}>Photos</Text>
          </View>
          <View style={ios.segItem}>
            <Text style={ios.segText}>Collections</Text>
          </View>
        </View>
        <View style={ios.grid}>
          {LIBRARY.map((x) => {
            const n = picked.indexOf(x.id);
            return (
              <Pressable key={x.id} onPress={() => toggle(x.id)} style={ios.cell} accessibilityRole="checkbox" accessibilityState={{ checked: n >= 0 }} accessibilityLabel={`Video ${x.dur} seconds`}>
                <Image source={{ uri: poster(x.id) }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                <Text style={ios.dur}>0:{String(x.dur).padStart(2, "0")}</Text>
                <View style={[ios.check, n >= 0 && ios.checkOn]}>{n >= 0 ? <Text style={ios.checkN}>{n + 1}</Text> : null}</View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

/** iOS 系统分享面板(UIActivityViewController,照真机的深色样式) */
export function IosShareSheet({ postId, dur, onClose }: { postId: string; dur: number; onClose: (toast?: string) => void }) {
  const insets = useInsets();
  const apps: { label: string; node: ReactNode }[] = [
    { label: "TikTok", node: <BrandIcon brand="tiktok" size={60} style={{ borderRadius: 14 }} /> },
    { label: "Instagram", node: <BrandIcon brand="instagram" size={60} style={{ borderRadius: 14 }} /> },
    { label: "WhatsApp", node: <BrandIcon brand="whatsapp" size={60} style={{ borderRadius: 14 }} /> },
    { label: "Messages", node: <View style={[ios.appIcon, { backgroundColor: "#34C759" }]}><Icon name="message-circle-more" size={30} color="#fff" strokeWidth={2} /></View> },
  ];
  return (
    <View style={ios.scrim}>
      <Pressable style={{ flex: 1 }} onPress={() => onClose()} accessibilityLabel="Close share sheet" />
      <View style={[ios.share, { paddingBottom: insets.bottom + 10 }]}>
        <View style={ios.shareHead}>
          <Image source={{ uri: poster(postId) }} style={ios.shareThumb} />
          <View style={{ flex: 1 }}>
            <Text style={ios.shareTitle}>My edit.mp4</Text>
            <Text style={ios.shareSub}>Video · {fmtT(dur)}</Text>
          </View>
          <Pressable onPress={() => onClose()} style={ios.shareX} accessibilityLabel="Close">
            <Icon name="x" size={14} color="#fff" strokeWidth={2.6} />
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 18, paddingHorizontal: 18, paddingVertical: 16 }}>
          {apps.map((a) => (
            <Pressable key={a.label} onPress={() => onClose(`Opened ${a.label}`)} style={{ alignItems: "center", gap: 6, width: 64 }}>
              {a.node}
              <Text style={ios.appLabel}>{a.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <View style={ios.actions}>
          {[
            { label: "Copy", icon: "copy" as IconName, toast: "Copied" },
            { label: "Save Video", icon: "download" as IconName, toast: "Saved to Photos" },
            { label: "Save to Files", icon: "folder-open" as IconName, toast: "Saved to Files" },
          ].map((a, i) => (
            <Pressable key={a.label} onPress={() => onClose(a.toast)} style={[ios.actionRow, i > 0 && ios.actionSep]}>
              <Text style={ios.actionText}>{a.label}</Text>
              <Icon name={a.icon} size={20} color="#fff" strokeWidth={1.8} />
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}


/** iOS 系统界面(照真机):照片选择器、分享面板 */
const ios = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: "#1C1C1E", borderTopLeftRadius: 12, borderTopRightRadius: 12, overflow: "hidden" },
  grabber: { alignSelf: "center", width: 36, height: 5, borderRadius: 3, backgroundColor: "#48484A", marginTop: 6 },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  link: { color: "#0A84FF", fontSize: 17 },
  title: { color: "#fff", fontSize: 17, fontWeight: "600" },
  seg: { flexDirection: "row", marginHorizontal: 16, marginBottom: 10, padding: 2, borderRadius: 9, backgroundColor: "#2C2C2E" },
  segItem: { flex: 1, height: 28, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  segOn: { backgroundColor: "#636366" },
  segText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 2 },
  cell: { width: "33%", aspectRatio: 1, backgroundColor: "#2C2C2E" },
  dur: { position: "absolute", right: 5, bottom: 4, color: "#fff", fontSize: 12, fontWeight: "600", textShadowColor: "rgba(0,0,0,0.6)", textShadowRadius: 2, textShadowOffset: { width: 0, height: 1 } },
  check: { position: "absolute", right: 6, top: 6, width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: "#fff", backgroundColor: "rgba(0,0,0,0.2)", alignItems: "center", justifyContent: "center" },
  checkOn: { backgroundColor: "#0A84FF", borderColor: "#fff" },
  checkN: { color: "#fff", fontSize: 12, fontWeight: "700" },
  scrim: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.4)", zIndex: 40 },
  share: { backgroundColor: "#1C1C1E", borderTopLeftRadius: 14, borderTopRightRadius: 14 },
  shareHead: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#38383A" },
  shareThumb: { width: 48, height: 48, borderRadius: 8 },
  shareTitle: { color: "#fff", fontSize: 15, fontWeight: "600" },
  shareSub: { color: "#8E8E93", fontSize: 13 },
  shareX: { width: 30, height: 30, borderRadius: 15, backgroundColor: "#3A3A3C", alignItems: "center", justifyContent: "center" },
  appIcon: { width: 60, height: 60, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  appLabel: { color: "#fff", fontSize: 11 },
  actions: { marginHorizontal: 16, borderRadius: 12, backgroundColor: "#2C2C2E" },
  actionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, height: 48 },
  actionSep: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#48484A" },
  actionText: { color: "#fff", fontSize: 17 },
});

