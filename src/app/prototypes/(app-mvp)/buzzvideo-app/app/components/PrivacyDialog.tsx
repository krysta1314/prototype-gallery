import { useState } from "react";
import { useStore } from "../provider";
import SystemAlert, { SystemAlertLink, SystemAlertMessage } from "./SystemAlert";

/** 首次打开的隐私弹窗:系统原生弹窗样式,盖在登录页上,同意后才能用登录页。Disagree 只在弹窗里提示,不关闭 */
export default function PrivacyDialog() {
  const { dispatch } = useStore();
  const [declined, setDeclined] = useState(false);
  const doc = (name: string) => <SystemAlertLink label={name} onPress={() => dispatch({ type: "showToast", text: `Opens ${name}` })} />;

  return (
    <SystemAlert
      title="Your privacy"
      buttons={[
        { label: "Disagree", onPress: () => setDeclined(true) },
        { label: "Agree", onPress: () => dispatch({ type: "acceptPrivacy" }), preferred: true },
      ]}
    >
      <SystemAlertMessage>
        By tapping Agree, you accept our {doc("Terms of Service")}, {doc("Privacy Policy")} and {doc("AI Use Policy")}.
      </SystemAlertMessage>
      <SystemAlertMessage>
        To generate results, your prompts and uploads are processed by our third-party AI model providers. They don’t receive your account info or use your content for training.
      </SystemAlertMessage>
      {declined && <SystemAlertMessage tone="error">You need to agree to use BuzzVideo</SystemAlertMessage>}
    </SystemAlert>
  );
}
