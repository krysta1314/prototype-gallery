import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Icon from "../components/Icon";
import IconButton from "../components/IconButton";
import PrimaryButton from "../components/PrimaryButton";
import GroupedSection from "../components/GroupedSection";
import Row from "../components/Row";
import Sheet from "../components/Sheet";
import { LIBRARY_ASSETS, PDF_ATTACHMENT, RECENT_PHOTOS } from "../data";
import { nextId } from "../ids";
import { useNav, useStore } from "../provider";
import { colors } from "../theme";

/** ChatGPT 式「+」面板:相机 + 最近照片,下面 Photos / Files / Assets */
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
      dispatch({ type: "showToast", text: "Camera access is off. Turn it on in Settings." });
    }
  };

  const addSelected = () => {
    const items = RECENT_PHOTOS.filter((p) => selected.includes(p.id)).map((p) => ({ id: nextId("a"), uri: p.uri, kind: p.kind, duration: p.duration }));
    dispatch({ type: "addAttachments", items });
    onClose();
  };

  const addFromLibrary = () => {
    if (photos === "denied" || photos === "undetermined") {
      dispatch({ type: "showToast", text: "Photo access is off. Turn it on in Settings." });
      return;
    }
    const picks = visible.slice(-2);
    dispatch({ type: "addAttachments", items: picks.map((p) => ({ id: nextId("a"), uri: p.uri, kind: p.kind, duration: p.duration })) });
    onClose();
  };

  if (view === "assets") {
    return (
      <Sheet title="BuzzVideo assets" onClose={onClose}>
        <View style={styles.assetsHead}>
          <IconButton icon="chevron-left" onPress={() => setView("main")} />
          <Text style={styles.assetsHint}>Uploaded from web or app</Text>
        </View>
        <View style={styles.grid}>
          {LIBRARY_ASSETS.map((a) => (
            <Pressable
              key={a.id}
              onPress={() => {
                dispatch({ type: "addAttachments", items: [{ id: nextId("a"), uri: a.uri, kind: a.kind, label: a.label, uploaded: true }] });
                onClose();
              }}
              style={styles.gridItem}
            >
              <Image source={{ uri: a.uri }} style={styles.gridImg} resizeMode="cover" />
              <Text style={styles.gridLabel} numberOfLines={1}>
                {a.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Sheet>
    );
  }

  return (
    <Sheet onClose={onClose}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
        <Pressable onPress={openCamera} style={[styles.tile, styles.cameraTile]}>
          <Icon name="camera" size={26} color={colors.ink} />
        </Pressable>
        {visible.map((p) => {
          const on = selected.includes(p.id);
          return (
            <Pressable key={p.id} onPress={() => toggle(p.id)} style={styles.tile}>
              <Image source={{ uri: p.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              {p.duration ? <Text style={styles.duration}>{p.duration}</Text> : null}
              <View style={[styles.check, on && styles.checkOn]}>{on ? <Icon name="check" size={12} color={colors.white} strokeWidth={3} /> : null}</View>
            </Pressable>
          );
        })}
        {photos === "denied" ? (
          <View style={[styles.tile, styles.deniedTile]}>
            <Text style={styles.deniedText}>Allow photo access in Settings</Text>
          </View>
        ) : null}
      </ScrollView>
      {photos === "limited" ? <Text style={styles.limited}>Showing the photos you allowed. Manage in Settings.</Text> : null}
      {selected.length > 0 ? <PrimaryButton label={`Add ${selected.length}`} onPress={addSelected} style={styles.add} /> : null}
      <GroupedSection variant="plain" style={styles.rows}>
        <Row icon="images" label="Photos" detail="Choose from your photo library" onPress={addFromLibrary} chevron />
        <Row
          icon="file-text"
          label="Files"
          detail="PDFs like brand guidelines or product sheets"
          onPress={() => {
            dispatch({ type: "addAttachments", items: [{ id: nextId("a"), ...PDF_ATTACHMENT }] });
            onClose();
          }}
          chevron
        />
        <Row icon="folder-open" label="Assets" detail="Your BuzzVideo asset library" onPress={() => setView("assets")} chevron />
      </GroupedSection>
    </Sheet>
  );
}

const TILE = 92;
const styles = StyleSheet.create({
  strip: { gap: 8, paddingVertical: 6 },
  tile: { width: TILE, height: TILE, borderRadius: 16, overflow: "hidden", backgroundColor: colors.grouped },
  cameraTile: { alignItems: "center", justifyContent: "center" },
  duration: { position: "absolute", left: 6, bottom: 5, color: colors.white, fontSize: 11, fontWeight: "700" },
  check: { position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.white, backgroundColor: "rgba(0,0,0,0.2)", alignItems: "center", justifyContent: "center" },
  checkOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  deniedTile: { width: 150, padding: 12, justifyContent: "center" },
  deniedText: { fontSize: 13, color: colors.sub },
  limited: { fontSize: 13, color: colors.sub, marginTop: 4 },
  add: { marginTop: 10 },
  rows: { marginTop: 8 },
  assetsHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  assetsHint: { fontSize: 13, color: colors.sub },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  gridItem: { width: "31%", gap: 4 },
  gridImg: { width: "100%", aspectRatio: 1, borderRadius: 14, backgroundColor: colors.grouped },
  gridLabel: { fontSize: 13, color: colors.ink },
});
