import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import IconButton from "../components/IconButton";
import { A } from "../data";
import { nextId } from "../ids";
import { useInsets, useNav, useStore } from "../provider";
import { colors } from "../theme";

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
      <View style={[styles.top, { paddingTop: insets.top + 6 }]}>
        <IconButton tone="onImage" icon="x" accessibilityLabel="Close" onPress={() => navigate({ type: "pop" })} />
      </View>
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.modes}>
          {(["video", "photo"] as const).map((k) => (
            <Pressable key={k} onPress={() => setKind(k)}>
              <Text style={[styles.mode, kind === k && styles.modeActive]}>{k.toUpperCase()}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={shoot} style={styles.shutterRing}>
          <View style={[styles.shutter, kind === "video" && styles.shutterVideo]} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.black },
  top: { position: "absolute", left: 12, top: 0 },
  bottom: { position: "absolute", left: 0, right: 0, bottom: 0, alignItems: "center", gap: 18, paddingTop: 20, backgroundColor: "rgba(0,0,0,0.45)" },
  modes: { flexDirection: "row", gap: 24 },
  mode: { color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "700", letterSpacing: 1 },
  modeActive: { color: "#ffd60a" },
  shutterRing: { width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: colors.white, alignItems: "center", justifyContent: "center" },
  shutter: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.white },
  shutterVideo: { backgroundColor: "#ff3b30" },
});
