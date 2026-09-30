import { Pressable, StyleSheet, Text, View } from "react-native";
import type { PermissionValue } from "../store";
import { useNav, useStore } from "../provider";
import { colors, radius, smoothCorners, type } from "../theme";

/** 模拟 iOS 26 系统授权弹窗(系统 UI,按 iOS 原样) */
const COPY = {
  push: {
    title: "“BuzzVideo” Would Like to Send You Notifications",
    message: "Notifications may include alerts, sounds and icon badges. These can be configured in Settings.",
    buttons: [
      { label: "Don’t Allow", value: "denied" },
      { label: "Allow", value: "granted" },
    ],
  },
  camera: {
    title: "“BuzzVideo” Would Like to Access the Camera",
    message: "Take photos and videos to use as references for your ads.",
    buttons: [
      { label: "Don’t Allow", value: "denied" },
      { label: "OK", value: "granted" },
    ],
  },
  photos: {
    title: "“BuzzVideo” Would Like to Access Your Photos",
    message: "Choose photos and videos to attach to your requests and upload to your asset library.",
    buttons: [
      { label: "Limit Access…", value: "limited" },
      { label: "Allow Full Access", value: "granted" },
      { label: "Don’t Allow", value: "denied" },
    ],
  },
} satisfies Record<string, { title: string; message: string; buttons: { label: string; value: PermissionValue }[] }>;

export default function PermissionPrompt() {
  const { state, dispatch } = useStore();
  const { navigate } = useNav();
  const prompt = state.permissionPrompt;
  if (!prompt) return null;
  const copy = COPY[prompt.kind];
  const vertical = copy.buttons.length > 2;

  const answer = (value: PermissionValue) => {
    dispatch({ type: "answerPermission", value });
    if (prompt.then === "openCamera" && value === "granted") navigate({ type: "push", route: { name: "camera" } });
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.alert}>
        <View style={styles.textBox}>
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.message}>{copy.message}</Text>
        </View>
        <View style={[styles.buttons, vertical && styles.buttonsVertical]}>
          {copy.buttons.map((b) => (
            <Pressable
              key={b.label}
              onPress={() => answer(b.value)}
              style={[styles.button, vertical ? styles.buttonVertical : styles.buttonHorizontal]}
            >
              <Text style={[styles.buttonText, b.value !== "denied" && styles.buttonStrong]}>{b.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.3)", alignItems: "center", justifyContent: "center" },
  // 模拟 iOS 26 系统弹窗(真机是系统自带的玻璃材质,这里用近白底 + 大圆角 + 胶囊按钮;系统样式,不走品牌色)
  alert: {
    width: 300,
    padding: 20,
    gap: 18,
    borderRadius: 34,
    ...smoothCorners,
    backgroundColor: "rgba(250,250,252,0.96)",
    boxShadow: "inset 0 1px 0.5px rgba(255,255,255,0.9), 0 20px 50px rgba(0,0,0,0.25)",
  },
  textBox: { gap: 6, paddingHorizontal: 4 },
  title: { ...type.headline, color: colors.black, textAlign: "center" },
  message: { ...type.footnote, color: "#3c3c43", textAlign: "center" },
  buttons: { flexDirection: "row", gap: 10 },
  buttonsVertical: { flexDirection: "column" },
  button: { height: 48, borderRadius: radius.full, backgroundColor: "rgba(120,120,128,0.14)", alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  buttonHorizontal: { flex: 1 },
  buttonVertical: {},
  buttonText: { ...type.headline, fontWeight: "500", color: colors.iosBlue },
  buttonStrong: { fontWeight: "600" },
});
