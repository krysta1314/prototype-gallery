import AttachSheet from "./AttachSheet";
import ModeSheet from "./ModeSheet";
import ModelSheet from "./ModelSheet";
import ReportSheet from "./ReportSheet";
import SessionActionsSheet from "./SessionActionsSheet";
import SessionDrawer from "./SessionDrawer";
import { useNav } from "../provider";

/** 根据 nav.sheet 渲染当前打开的弹层 */
export default function Sheets() {
  const { nav, navigate } = useNav();
  const sheet = nav.sheet;
  if (!sheet) return null;
  const close = () => navigate({ type: "closeSheet" });
  switch (sheet.name) {
    case "report":
      return <ReportSheet onClose={close} />;
    case "sessions":
      return <SessionDrawer onClose={close} />;
    case "sessionActions":
      return <SessionActionsSheet id={sheet.id} onClose={close} />;
    case "attach":
      return <AttachSheet onClose={close} />;
    case "mode":
      return <ModeSheet onClose={close} />;
    case "model":
      return <ModelSheet onClose={close} />;
    default:
      void close;
      return null;
  }
}
