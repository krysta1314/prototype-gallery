import { useStore } from "../provider";
import SystemAlert, { SystemAlertLink, SystemAlertMessage } from "./SystemAlert";

/** 第一次把内容发给 AI 时的同意弹窗(系统弹窗样式):只讲第三方 AI 这一件事,拒绝不锁 APP,只是这次不发送 */
export default function AiConsentDialog() {
  const { dispatch } = useStore();
  return (
    <SystemAlert
      title="Share your content with AI providers?"
      buttons={[
        { label: "Not now", onPress: () => dispatch({ type: "dismissAiConsent" }) },
        { label: "Allow", onPress: () => dispatch({ type: "allowAiConsent" }), preferred: true },
      ]}
    >
      <SystemAlertMessage>
        To create your ads, BuzzVideo sends your prompts and the photos, videos and files you upload to our third-party AI model providers (such as BytePlus). They use it only to generate your results — they don’t receive your account info or train their models on your content. You can change this anytime in Settings.
      </SystemAlertMessage>
      <SystemAlertMessage>
        <SystemAlertLink label="Privacy Policy" onPress={() => dispatch({ type: "showToast", text: "Opens Privacy Policy" })} />
      </SystemAlertMessage>
    </SystemAlert>
  );
}
