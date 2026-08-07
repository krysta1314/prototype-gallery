"use client";

import { useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { useTeam } from "./team-context";
import { TeamSettingsModal } from "./team-settings-modal";
import { AccountSettingsModal } from "./account-settings-modal";

function CreateTeamModal() {
  const { createTeamOpen, setCreateTeamOpen, createTeam } = useTeam();
  const [name, setName] = useState("");

  if (!createTeamOpen) return null;

  const close = () => {
    setCreateTeamOpen(false);
    setName("");
  };

  return (
    <div className="fixed inset-x-0 bottom-0 top-[52px] z-[90] grid place-items-center bg-[#1a1a2e]/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Create team">
      <div className="w-full max-w-[460px] rounded-[24px] border border-[#ececf1] bg-white p-6 shadow-[0_30px_80px_rgba(26,26,46,0.28)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[18px] font-bold tracking-[-0.02em] text-[#28222e]">Create a team</h2>
            <p className="mt-1 text-[13px] text-[#8a8490]">After creating a team, you can invite others to join.</p>
          </div>
          <button type="button" onClick={close} aria-label="Close" className="grid size-9 shrink-0 place-items-center rounded-xl text-[#8a8490] transition hover:bg-[#f6f4f7] hover:text-[#28222e]">
            <X className="size-[18px]" />
          </button>
        </div>

        <label className="mt-5 block">
          <span className="text-[13px] font-semibold text-[#3b3442]">Team name</span>
          <input
            value={name}
            autoFocus
            onChange={(event) => setName(event.target.value)}
            placeholder="Add a name"
            className="mt-2 h-11 w-full rounded-xl border border-[#ececf1] bg-white px-3.5 text-[14px] text-[#28222e] outline-none transition focus:border-[#ff5e1a] placeholder:text-[#9a9bb0]"
          />
        </label>

        <div className="mt-5 flex justify-end gap-2.5">
          <button type="button" onClick={close} className="h-11 rounded-xl px-4 text-[13px] font-semibold text-[#8a8490] transition hover:text-[#56505c]">
            Cancel
          </button>
          <button
            type="button"
            disabled={!name.trim()}
            onClick={() => {
              createTeam(name.trim());
              close();
            }}
            className="h-11 rounded-xl bg-[#24202a] px-5 text-[13px] font-bold text-white transition hover:bg-[#3b3442] disabled:cursor-not-allowed disabled:opacity-35"
          >
            Create team
          </button>
        </div>
      </div>
    </div>
  );
}

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

/** 每个页面挂一次:设置弹窗 + 创建团队弹窗 + toast */
export function TeamOverlays() {
  return (
    <>
      <TeamSettingsModal />
      <AccountSettingsModal />
      <CreateTeamModal />
      <TeamToast />
    </>
  );
}
