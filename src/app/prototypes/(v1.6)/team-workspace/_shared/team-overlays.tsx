"use client";

import { CheckCircle2 } from "lucide-react";
import { useTeam } from "./team-context";
import { TeamSettingsModal } from "./team-settings-modal";
import { AccountSettingsModal } from "./account-settings-modal";
import { RequestModal } from "./request-modal";

/*
 * 建团队 = 购买,但这个动作已经不在工作区里了 —— Create team 直接去订阅页(pricing 原型),
 * 在那边 Get Team / Get Scale 一路走完「团队名 → 席位 + 周期 + 付款」。
 * 所以这里原来那个四步向导整块删掉,避免同一件事有两套流程。
 */

function TeamToast() {
  const { toast, toastTone } = useTeam();
  if (!toast) return null;
  const success = toastTone === "success";
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[100] -translate-x-1/2" role="status" aria-live="polite">
      <div
        className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold shadow-[0_14px_36px_rgba(26,26,46,0.32)] ${
          success ? "bg-[#0f7a5a] text-white" : "bg-[#24202a] text-white"
        }`}
      >
        {success && <CheckCircle2 className="size-4 shrink-0" />}
        {toast}
      </div>
    </div>
  );
}

/** 每个页面挂一次:设置弹窗 + 账户弹窗 + 额度申请 + toast(建团队已挪到订阅页) */
export function TeamOverlays() {
  return (
    <>
      <TeamSettingsModal />
      <AccountSettingsModal />
      <RequestModal />
      <TeamToast />
    </>
  );
}
