import { useStore } from "../provider";
import type { PermissionKind } from "../store";
import SystemAlert, { SystemAlertMessage } from "./SystemAlert";

const COPY: Partial<Record<PermissionKind, { title: string; body: string }>> = {
  camera: { title: "Camera Access Is Off", body: "Turn on Camera for BuzzVideo in Settings to take photos and videos of your products." },
  photos: { title: "Photo Access Is Off", body: "Turn on Photos for BuzzVideo in Settings to add photos from your library and save the ads you make." },
  microphone: { title: "Microphone Access Is Off", body: "Turn on Microphone for BuzzVideo in Settings to record videos with sound." },
  push: { title: "Notifications Are Off", body: "Turn on Notifications for BuzzVideo in Settings to know when your ads are ready." },
};

/**
 * 权限拒绝过后再用到这个功能：系统不会再弹授权框，APP 自己弹系统样式提示框(2026-10-22,原来是一条 toast)。
 * Settings → 跳到 iOS 设置 › BuzzVideo;Cancel → 关掉，什么都不做。真实 APP:UIAlertController + openSettingsURLString
 */
export default function SettingsAlert() {
  const { state, dispatch } = useStore();
  const kind = state.settingsAlert;
  const copy = kind ? COPY[kind] : undefined;
  if (!copy) return null;
  return (
    <SystemAlert
      title={copy.title}
      buttons={[
        { label: "Cancel", onPress: () => dispatch({ type: "dismissSettingsAlert" }) },
        { label: "Settings", onPress: () => dispatch({ type: "openIosSettings" }), preferred: true },
      ]}
    >
      <SystemAlertMessage>{copy.body}</SystemAlertMessage>
    </SystemAlert>
  );
}
