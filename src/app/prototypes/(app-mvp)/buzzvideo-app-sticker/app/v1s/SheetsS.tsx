import AttachSheet from "../../../buzzvideo-app/app/sheets/AttachSheet";
import ConfirmDeleteSheet from "./ConfirmDeleteSheetS";
import ContactSalesSheet from "../../../buzzvideo-app/app/sheets/ContactSalesSheet";
import FeedbackSheet from "./FeedbackSheetS";
import InviteSheet from "../../../buzzvideo-app/app/sheets/InviteSheet";
import MemberCapSheet from "../../../buzzvideo-app/app/sheets/MemberCapSheet";
import ModeSheet from "../../../buzzvideo-app/app/sheets/ModeSheet";
import ModelSheet from "../../../buzzvideo-app/app/sheets/ModelSheet";
import PromptSheet from "../../../buzzvideo-app/app/sheets/PromptSheet";
import ReportSheet from "../../../buzzvideo-app/app/sheets/ReportSheet";
import SessionActionsSheet from "../../../buzzvideo-app/app/sheets/SessionActionsSheet";
import SessionDrawer from "../../../buzzvideo-app/app/sheets/SessionDrawer";
import ShareSheet from "../../../buzzvideo-app/app/sheets/ShareSheet";
import ToolsSheet from "../../../buzzvideo-app/app/sheets/ToolsSheet";
import VoiceSheet from "../../../buzzvideo-app/app/sheets/VoiceSheet";
import TopUpSheet from "./TopUpSheetS";
import TransferWorkspaceSheet from "../../../buzzvideo-app/app/sheets/TransferWorkspaceSheet";
import WorkspaceSheet from "../../../buzzvideo-app/app/sheets/WorkspaceSheet";
import { useCallback, useEffect, useState } from "react";
import { SheetPresenceContext } from "../../../buzzvideo-app/app/components/sheet-presence";
import type { SheetState } from "../../../buzzvideo-app/app/nav";
import { useNav } from "../../../buzzvideo-app/app/provider";

/** 贴纸风:第一版面板的分发(同第一版 Sheets),积分包 / 反馈 / 删除账号换成贴纸风版本，其余仍用第一版。
 *  根据 nav.sheet 渲染当前打开的弹层。
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
      return <SessionDrawer onClose={close} menu={sheet.menu} select={sheet.select} />;
    case "sessionActions":
      return <SessionActionsSheet id={sheet.id} onClose={close} />;
    case "attach":
      return <AttachSheet onClose={close} />;
    case "mode":
      return <ModeSheet onClose={close} />;
    case "model":
      return <ModelSheet onClose={close} />;
    case "voice":
      return <VoiceSheet onClose={close} />;
    case "tools":
      return <ToolsSheet onClose={close} />;
    case "contactSales":
      return <ContactSalesSheet onClose={close} />;
    case "feedback":
      return <FeedbackSheet onClose={close} />;
    case "share":
      return <ShareSheet workId={sheet.workId} onClose={close} />;
    case "prompt":
      return <PromptSheet workId={sheet.workId} onClose={close} />;
    case "workspace":
      return <WorkspaceSheet onClose={close} />;
    case "confirmDelete":
      return <ConfirmDeleteSheet onClose={close} />;
    case "transferWorkspace":
      return <TransferWorkspaceSheet onClose={close} />;
    case "invite":
      return <InviteSheet onClose={close} />;
    case "memberCap":
      return <MemberCapSheet id={sheet.id} onClose={close} />;
    case "topUp":
      return <TopUpSheet onClose={close} />;
  }
}
