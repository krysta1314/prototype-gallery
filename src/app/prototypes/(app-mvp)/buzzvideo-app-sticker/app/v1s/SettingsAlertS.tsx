/** 新版设计：文案从「广告 / 产品」改成普通人的说法，其余同第一版 */
import { useStore } from "../../../buzzvideo-app/app/provider";
import type { PermissionKind } from "../../../buzzvideo-app/app/store";
import SystemAlert, { SystemAlertMessage } from "../../../buzzvideo-app/app/components/SystemAlert";

const COPY: Partial<Record<PermissionKind, { title: string; body: string }>> = {
  camera: { title: "Camera Access Is Off", body: "Turn on Camera for BuzzVideo in Settings to record your Twin and take photos." },
  photos: { title: "Photo Access Is Off", body: "Turn on Photos for BuzzVideo in Settings to add photos and save the videos you make." },
  microphone: { title: "Microphone Access Is Off", body: "Turn on Microphone for BuzzVideo in Settings to record videos with sound." },
  push: { title: "Notifications Are Off", body: "Turn on Notifications for BuzzVideo in Settings to know when your videos are ready." },
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
