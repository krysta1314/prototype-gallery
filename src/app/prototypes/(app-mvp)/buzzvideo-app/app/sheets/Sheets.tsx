import AttachSheet from "./AttachSheet";
import ConfirmDeleteSheet from "./ConfirmDeleteSheet";
import ModeSheet from "./ModeSheet";
import ModelSheet from "./ModelSheet";
import ReportSheet from "./ReportSheet";
import SessionActionsSheet from "./SessionActionsSheet";
import SessionDrawer from "./SessionDrawer";
import ShareSheet from "./ShareSheet";
import WorkMoreSheet from "./WorkMoreSheet";
import WorkspaceSheet from "./WorkspaceSheet";
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
    case "share":
      return <ShareSheet workId={sheet.workId} onClose={close} />;
    case "workMore":
      return <WorkMoreSheet workId={sheet.workId} onClose={close} />;
    case "workspace":
      return <WorkspaceSheet onClose={close} />;
    case "confirmDelete":
      return <ConfirmDeleteSheet onClose={close} />;
  }
}
