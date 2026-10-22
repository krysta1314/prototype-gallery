import { StyleSheet, View } from "react-native";
import type { PermissionValue } from "../store";
import { colors, smoothCorners } from "../theme";
import HandGlyph from "./HandGlyph";
import TrackingGlyph from "./TrackingGlyph";
import { useNav, useStore } from "../provider";
import SystemAlert, { SystemAlertMessage } from "./SystemAlert";

/** 模拟 iOS 26 系统授权弹窗(系统 UI,按 iOS 原样;样式在 SystemAlert) */
const COPY = {
  push: {
    title: "“BuzzVideo” Would Like to Send You Notifications",
    message: "Notifications may include alerts, sounds, and icon badges. These can be configured in Settings.",
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
  microphone: {
    title: "“BuzzVideo” Would Like to Access the Microphone",
    message: "Record sound with your videos, like a voiceover or your shop’s ambience.",
    buttons: [
      { label: "Don’t Allow", value: "denied" },
      { label: "OK", value: "granted" },
    ],
  },
  /** 存到相册用的是「只添加」权限：系统框文案不同(NSPhotoLibraryAddUsageDescription) */
  photosAdd: {
    title: "“BuzzVideo” Would Like to Add to Your Photos",
    message: "Save the ads you make to your photo library.",
    buttons: [
      { label: "Don’t Allow", value: "denied" },
      { label: "Allow", value: "granted" },
    ],
  },
  /** iOS ATT:系统原文,message 是 Info.plist 的 NSUserTrackingUsageDescription(spec §8.1) */
  tracking: {
    title: "Allow “BuzzVideo” to track your activity across other companies’ apps and websites?",
    // NSUserTrackingUsageDescription(Info.plist):系统框里唯一能自己写的部分;不能提积分、优惠诱导 Allow
    message: "BuzzVideo uses this to measure which ads bring people to the app, so we can spend less on ads and more on the product. We never sell your data.",
    buttons: [
      { label: "Ask App Not to Track", value: "denied" },
      { label: "Allow", value: "granted" },
    ],
  },
} satisfies Record<string, { title: string; message: string; buttons: { label: string; value: PermissionValue }[] }>;

export default function PermissionPrompt() {
  const { state, dispatch } = useStore();
  const { navigate } = useNav();
  const prompt = state.permissionPrompt;
  if (!prompt) return null;
  const copy = prompt.kind === "photos" && (prompt.then === "save" || prompt.then === "saveWork") ? COPY.photosAdd : COPY[prompt.kind];

  const answer = (value: PermissionValue) => {
    dispatch({ type: "answerPermission", value });
    if (prompt.then === "openCamera" && value === "granted") navigate({ type: "push", route: { name: "camera" } });
  };

  return (
    <SystemAlert
      title={copy.title}
      buttons={copy.buttons.map((b) => ({ label: b.label, onPress: () => answer(b.value) }))}
      // ATT 框是 iOS 固定样式:APP 图标 + 蓝色小手角标,两个按钮上下排列(和真机截图一致);
      // 三个按钮的框(如相册「Allow Full Access」)iOS 也是上下排列
      vertical={prompt.kind === "tracking" || copy.buttons.length > 2}
      icon={prompt.kind === "tracking" ? <TrackingIcon /> : undefined}
    >
      <SystemAlertMessage>{copy.message}</SystemAlertMessage>
    </SystemAlert>
  );
}

/** ATT 框顶部的图标:iOS 系统「追踪」图标(橙色底 + 曲线连接的两个白方块,不是 APP 图标)+ 右下角蓝色小手 */
function TrackingIcon() {
  return (
    <View style={styles.appIcon}>
      <TrackingGlyph size={64} />
      <View style={styles.hand}>
        <HandGlyph size={24} color={colors.white} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  appIcon: { width: 64, height: 64 },
  // 角标:蓝色圆角方块(约图标一半宽),压在右下角、略出界,没有描边;里面是实心手掌(照真机)
  hand: {
    position: "absolute",
    right: -10,
    bottom: -8,
    width: 34,
    height: 34,
    borderRadius: 9,
    ...smoothCorners,
    backgroundColor: colors.iosBlue,
    alignItems: "center",
    justifyContent: "center",
  },
});
