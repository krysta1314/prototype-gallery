import { Pressable, StyleSheet, Text, View } from "react-native";
import type { PermissionValue } from "../store";
import { useNav, useStore } from "../provider";
import { colors } from "../theme";

/** 模拟 iOS 系统授权弹窗(系统 UI,按 iOS 原样) */
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
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center" },
  alert: { width: 270, borderRadius: 14, backgroundColor: "rgba(246,246,246,0.98)", overflow: "hidden" },
  textBox: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 16, gap: 4 },
  title: { fontSize: 17, fontWeight: "600", color: colors.black, textAlign: "center" },
  message: { fontSize: 13, color: colors.black, textAlign: "center", lineHeight: 17 },
  buttons: { flexDirection: "row", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#c6c6c8" },
  buttonsVertical: { flexDirection: "column" },
  button: { height: 44, alignItems: "center", justifyContent: "center" },
  buttonHorizontal: { flex: 1, borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: "#c6c6c8" },
  buttonVertical: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#c6c6c8" },
  buttonText: { fontSize: 17, color: colors.iosBlue },
  buttonStrong: { fontWeight: "600" },
});
