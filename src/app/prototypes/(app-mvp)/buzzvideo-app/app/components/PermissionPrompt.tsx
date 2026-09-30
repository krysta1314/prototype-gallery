import type { PermissionValue } from "../store";
import { useNav, useStore } from "../provider";
import SystemAlert, { SystemAlertMessage } from "./SystemAlert";

/** 模拟 iOS 26 系统授权弹窗(系统 UI,按 iOS 原样;样式在 SystemAlert) */
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

  const answer = (value: PermissionValue) => {
    dispatch({ type: "answerPermission", value });
    if (prompt.then === "openCamera" && value === "granted") navigate({ type: "push", route: { name: "camera" } });
  };

  return (
    <SystemAlert title={copy.title} buttons={copy.buttons.map((b) => ({ label: b.label, onPress: () => answer(b.value) }))}>
      <SystemAlertMessage>{copy.message}</SystemAlertMessage>
    </SystemAlert>
  );
}
