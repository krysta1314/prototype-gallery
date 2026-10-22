import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Icon from "../components/Icon";
import IconButton from "../components/IconButton";
import { A } from "../data";
import { nextId } from "../ids";
import { useInsets, useNav, useStore } from "../provider";
import { colors, HIT, radius, space, type } from "../theme";

const SHOT = `${A}/camera-view.jpg`;

/**
 * 模拟相机(iOS 系统相机样式)。按快门 → 确认页(2026-10-22 补):底部左 Retake、右 Use Photo / Use Video,
 * 点 Use 才作为附件回到创作页。Video 模式录像要麦克风:没问过弹系统框，拒绝过弹去设置的提示框
 */
export default function Camera() {
  const { state, dispatch } = useStore();
  const { navigate } = useNav();
  const insets = useInsets();
  const [kind, setKind] = useState<"photo" | "video">("photo");
  const [taken, setTaken] = useState(false);
  const mic = state.permissions.microphone;

  const shoot = () => {
    if (kind === "video" && mic === "undetermined") return dispatch({ type: "requestPermission", kind: "microphone" });
    if (kind === "video" && mic === "denied") return dispatch({ type: "showSettingsAlert", kind: "microphone" });
    setTaken(true);
  };
  const use = () => {
    dispatch({ type: "addAttachments", items: [{ id: nextId("a"), uri: SHOT, kind, ...(kind === "video" ? { duration: "0:06" } : {}) }] });
    navigate({ type: "pop" });
  };

  if (taken) {
    return (
      <View style={styles.root}>
        <Image source={{ uri: SHOT }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        {kind === "video" ? (
          <View style={styles.playWrap} pointerEvents="none">
            <View style={styles.play}>
              <Icon name="play" size={28} color={colors.white} fill={colors.white} />
            </View>
          </View>
        ) : null}
        {/* iOS 系统相机拍完的确认栏：黑底，两个白色文字按钮 */}
        <View style={[styles.review, { paddingBottom: insets.bottom + space.md }]}>
          <Pressable onPress={() => setTaken(false)} accessibilityRole="button" hitSlop={8} style={({ pressed }) => [styles.reviewBtn, pressed && styles.pressed]}>
            <Text style={styles.reviewText}>Retake</Text>
          </Pressable>
          <Pressable onPress={use} accessibilityRole="button" hitSlop={8} style={({ pressed }) => [styles.reviewBtn, pressed && styles.pressed]}>
            <Text style={[styles.reviewText, styles.reviewUse]}>{kind === "video" ? "Use Video" : "Use Photo"}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Image source={{ uri: SHOT }} style={StyleSheet.absoluteFill} resizeMode="cover" />
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
  playWrap: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  play: { width: 64, height: 64, borderRadius: radius.full, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center", paddingLeft: 4 },
  review: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: space.lg,
    paddingHorizontal: space.xl,
    backgroundColor: colors.black,
  },
  reviewBtn: { minHeight: HIT, justifyContent: "center" },
  pressed: { opacity: 0.5 },
  reviewText: { fontSize: 17, lineHeight: 22, letterSpacing: -0.4, color: colors.white },
  reviewUse: { fontWeight: "600" },
});
