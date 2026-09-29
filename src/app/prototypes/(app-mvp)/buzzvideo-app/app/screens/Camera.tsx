import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import IconButton from "../components/IconButton";
import { A } from "../data";
import { nextId } from "../ids";
import { useInsets, useNav, useStore } from "../provider";
import { colors, HIT, radius, space, type } from "../theme";

/** 模拟相机:拍完直接作为附件回到创作页 */
export default function Camera() {
  const { dispatch } = useStore();
  const { navigate } = useNav();
  const insets = useInsets();
  const [kind, setKind] = useState<"photo" | "video">("photo");

  const shoot = () => {
    dispatch({ type: "addAttachments", items: [{ id: nextId("a"), uri: `${A}/camera-view.jpg`, kind }] });
    navigate({ type: "pop" });
  };

  return (
    <View style={styles.root}>
      <Image source={{ uri: `${A}/camera-view.jpg` }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <View style={[styles.top, { paddingTop: insets.top }]}>
        <IconButton tone="onImage" icon="x" accessibilityLabel="Close" onPress={() => navigate({ type: "pop" })} />
      </View>
      <View style={[styles.bottom, { paddingBottom: insets.bottom + space.xl }]}>
        <View style={styles.modes}>
          {(["video", "photo"] as const).map((k) => (
            <Pressable
              key={k}
              onPress={() => setKind(k)}
              accessibilityRole="button"
              accessibilityState={{ selected: kind === k }}
              style={styles.modeHit}
            >
              <Text style={[styles.mode, kind === k && styles.modeActive]}>{k === "video" ? "Video" : "Photo"}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={shoot} style={styles.shutterRing} accessibilityRole="button" accessibilityLabel={kind === "video" ? "Record video" : "Take photo"}>
          <View style={[styles.shutter, kind === "video" && styles.shutterVideo]} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.black },
  top: { position: "absolute", left: space.xs, top: 0 },
  bottom: { position: "absolute", left: 0, right: 0, bottom: 0, alignItems: "center", gap: space.md, paddingTop: space.md, backgroundColor: "rgba(0,0,0,0.45)" },
  modes: { flexDirection: "row", gap: space.sm },
  modeHit: { minHeight: HIT, paddingHorizontal: space.md, justifyContent: "center" },
  mode: { ...type.footnote, fontWeight: "600", color: "rgba(255,255,255,0.7)" },
  // iOS 相机的模式选中色
  modeActive: { color: "#ffd60a" },
  shutterRing: { width: 76, height: 76, borderRadius: radius.full, borderWidth: 4, borderColor: colors.white, alignItems: "center", justifyContent: "center" },
  shutter: { width: 60, height: 60, borderRadius: radius.full, backgroundColor: colors.white },
  shutterVideo: { backgroundColor: "#ff3b30" },
});
