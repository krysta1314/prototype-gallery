"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, CreditCard, Gauge, UserPlus } from "lucide-react";
import { formatNumber, type TeamRequest } from "./data";
import { useTeam } from "./team-context";

const KIND_META: Record<TeamRequest["kind"], { Icon: typeof Bell; label: string }> = {
  credits: { Icon: CreditCard, label: "Credits" },
  seats: { Icon: UserPlus, label: "Seats" },
  limit: { Icon: Gauge, label: "Monthly limit" },
};

/**
 * 通知中心 —— 支撑评审第三节「Member 的申请要通知到 Owner」。
 * 只有能处理申请的角色才看得到铃铛,免得给 Member 一个永远是空的入口。
 */
export function NotificationBell() {
  const { inboxRequests, approveRequest, dismissRequest, role, isPersonal } = useTeam();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Member 提不了别人的申请、也审不了,给他一个空铃铛没意义
  if (isPersonal || role === "member") return null;

  const count = inboxRequests.length;

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={count > 0 ? `Notifications — ${count} pending request${count > 1 ? "s" : ""}` : "Notifications"}
        className="relative grid size-8 place-items-center rounded-full text-[#9a9bb0] transition hover:bg-[#f6f4f7] hover:text-[#56505c]"
      >
        <Bell className="size-[18px]" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid min-w-[16px] place-items-center rounded-full bg-[#ee6545] px-1 text-[10px] font-bold leading-[16px] text-white">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+10px)] z-[60] w-[330px] overflow-hidden rounded-2xl border border-[#ececf1] bg-white text-left shadow-[0_18px_40px_rgba(26,26,46,0.16)]">
          <div className="border-b border-[#f0eef2] px-4 py-3">
            <p className="text-[13px] font-bold text-[#28222e]">Requests</p>
            <p className="mt-0.5 text-[11px] text-[#9a94a0]">
              {count > 0 ? `${count} waiting on you` : "Nothing waiting on you"}
            </p>
          </div>

          {count === 0 ? (
            <p className="px-4 py-8 text-center text-[12.5px] leading-relaxed text-[#9a94a0]">
              When a teammate runs out of credits or seats, their request shows up here.
            </p>
          ) : (
            <ul className="max-h-[340px] divide-y divide-[#f4f2f6] overflow-y-auto">
              {inboxRequests.map((req) => {
                const { Icon, label } = KIND_META[req.kind];
                return (
                  <li key={req.id} className="px-4 py-3.5">
                    <div className="flex items-start gap-2.5">
                      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-[#f6f4f7] text-[#56505c]">
                        <Icon className="size-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12.5px] font-semibold leading-snug text-[#28222e]">
                          {req.fromName} asked for{" "}
                          {req.kind === "seats"
                            ? `${req.amount} more seat${(req.amount ?? 1) > 1 ? "s" : ""}`
                            : req.kind === "credits"
                              ? `${formatNumber(req.amount ?? 0)} more credits`
                              : "a higher monthly limit"}
                        </p>
                        {req.reason && <p className="mt-1 text-[11.5px] leading-[1.5] text-[#7b7480]">“{req.reason}”</p>}
                        <p className="mt-1 text-[11px] text-[#a8a2ae]">
                          {label} · {req.at}
                        </p>
                        <div className="mt-2.5 flex gap-2">
                          <button
                            type="button"
                            onClick={() => approveRequest(req.id)}
                            className="h-8 rounded-lg bg-[#24202a] px-3 text-[11.5px] font-bold text-white transition hover:bg-[#3b3442]"
                          >
                            {req.kind === "limit" ? "Review" : "Approve"}
                          </button>
                          <button
                            type="button"
                            onClick={() => dismissRequest(req.id)}
                            className="h-8 rounded-lg px-2.5 text-[11.5px] font-semibold text-[#8a8490] transition hover:bg-[#f6f4f7] hover:text-[#56505c]"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
