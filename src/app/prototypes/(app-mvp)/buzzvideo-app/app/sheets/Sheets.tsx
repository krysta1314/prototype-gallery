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
import { useCallback, useEffect, useState } from "react";
import { SheetPresenceContext } from "../components/sheet-presence";
import type { SheetState } from "../nav";
import { useNav } from "../provider";

/** 根据 nav.sheet 渲染当前打开的弹层。
 *  nav.sheet 变为 null 后仍保留上一个面板并把 visible 置 false,等它播完退场动画(onExited)再卸载 */
export default function Sheets() {
  const { nav, navigate } = useNav();
  const [shown, setShown] = useState<SheetState | null>(nav.sheet);
  useEffect(() => {
    if (nav.sheet) setShown(nav.sheet);
  }, [nav.sheet]);
  const onExited = useCallback(() => setShown(null), []);
  const sheet = nav.sheet ?? shown;
  if (!sheet) return null;
  const close = () => navigate({ type: "closeSheet" });
  return <SheetPresenceContext.Provider value={{ visible: !!nav.sheet, onExited }}>{render(sheet, close)}</SheetPresenceContext.Provider>;
}

function render(sheet: SheetState, close: () => void) {
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
