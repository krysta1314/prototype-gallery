"use client";

import { useRef, useState } from "react";
import { X } from "lucide-react";
import { formatNumber } from "./data";
import { useTeam } from "./team-context";
import { useDialog } from "./use-dialog";

/** 与 rate card 的 top-up 包价同口径 —— 申请的数量必须是真能买到的包 */
const TOPUP_AMOUNTS = [50_000, 200_000, 500_000];
/** 追加分配额度只有 Enterprise 有,数量按池的量级给 */
const ALLOCATION_AMOUNTS = [20_000, 40_000, 80_000];
const SEAT_AMOUNTS = [1, 2, 5];

/**
 * 申请弹窗 —— Member / Admin 撞墙时的出口。
 * 评审要求「申请要站内通知到 Owner,而不是只提示去找管理员」,所以提交后
 * 这条申请会真的进 Owner 的通知中心,切角色就能看到并审批。
 */
export function RequestModal() {
  const { requestModal, closeRequestModal, submitRequest, team, seatsUsed, seatsTotal, isRequestCoolingDown, isPool, plan } =
    useTeam();
  const panelRef = useRef<HTMLDivElement>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [reason, setReason] = useState("");

  const kind = requestModal;
  useDialog({ ref: panelRef, onClose: closeRequestModal, active: kind !== false });

  if (kind === false) return null;

  const isSeats = kind === "seats";
  /** limit = 追加分配额度,只在 Enterprise 出现 —— per-seat 团队每席固定,没有上限可提 */
  const isAllocation = kind === "limit";
  const cooling = isRequestCoolingDown(kind);
  const amounts = isSeats ? SEAT_AMOUNTS : isAllocation ? ALLOCATION_AMOUNTS : TOPUP_AMOUNTS;
  const chosen = amount ?? amounts[1]!;

  const close = () => {
    closeRequestModal();
    setAmount(null);
    setReason("");
  };

  /*
   * 申请的东西按额度模型分三种,该找的人也不同:
   *   seats      → 加席位,归 Owner
   *   limit      → 追加分配额度（仅 Enterprise）,归 Owner 与 Admin
   *   topup      → 买 top-up,归 Owner 与账单联系人;
   *                per-seat 团队买给「我这个席位」,Enterprise 充进共享池
   */
  const title = isSeats
    ? "Request seats"
    : isAllocation
      ? "Request a bigger allocation"
      : isPool
        ? "Request a pool top-up"
        : "Request a top-up for my seat";

  const subtitle = isSeats
    ? `${team.name} is using ${seatsUsed} of ${seatsTotal} seats. Goes to the owner.`
    : isAllocation
      ? `Your allocation from ${team.name}'s shared pool is what's blocking you — the owner or an admin can raise it.`
      : isPool
        ? `Tops up ${team.name}'s shared pool. Goes to the owner and billing admins.`
        : `Credits are fixed per seat on ${plan.name}, so a top-up is bought for your seat and stays with it. Goes to the owner and billing admins of ${team.name}.`;

  return (
    <div
      className="fixed inset-x-0 bottom-0 top-[52px] z-[96] grid place-items-center bg-[#1a1a2e]/45 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className="w-full max-w-[460px] rounded-[24px] border border-[#ececf1] bg-white p-6 shadow-[0_30px_80px_rgba(26,26,46,0.28)] outline-none"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[18px] font-bold tracking-[-0.02em] text-[#28222e]">{title}</h2>
            <p className="mt-1 text-[13px] leading-snug text-[#8a8490]">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="grid size-9 shrink-0 place-items-center rounded-xl text-[#8a8490] transition hover:bg-[#f6f4f7] hover:text-[#28222e]"
          >
            <X className="size-[18px]" />
          </button>
        </div>

        <p className="mt-5 text-[12px] font-semibold text-[#8a8490]">
          {isSeats ? "How many seats?" : isAllocation ? "How many credits a month?" : "Which top-up pack?"}
        </p>
        <div className="mt-2 grid grid-cols-3 gap-2.5">
          {amounts.map((option) => {
            const active = chosen === option;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={active}
                onClick={() => setAmount(option)}
                className={`h-11 rounded-xl border text-[13px] font-bold transition ${
                  active ? "border-[#ff5e1a] bg-[#fff8f4] text-[#28222e]" : "border-[#ececf1] bg-white text-[#56505c] hover:border-[#ddd7df]"
                }`}
              >
                {isSeats ? `${option} seat${option > 1 ? "s" : ""}` : formatNumber(option)}
              </button>
            );
          })}
        </div>

        <label className="mt-5 block">
          <span className="text-[12px] font-semibold text-[#8a8490]">Why do you need it?</span>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            placeholder={
              isSeats
                ? "Two new designers start Monday."
                : isAllocation
                  ? "Q3 brand film needs another pass — my allocation is spent."
                  : "Finishing the BuzzMilk cutdowns this week — my seat is out for the month."
            }
            className="mt-1.5 w-full resize-none rounded-xl border border-[#ececf1] bg-white px-3.5 py-2.5 text-[13.5px] leading-relaxed text-[#28222e] outline-none transition focus:border-[#ff5e1a] placeholder:text-[#b4aeb8]"
          />
          <span className="mt-1.5 block text-[11px] text-[#9a94a0]">
            A reason gets requests approved faster — it&apos;s shown with the request.
          </span>
        </label>

        {cooling && (
          <p className="mt-4 rounded-xl bg-[#fffaf1] px-3.5 py-2.5 text-[12px] font-semibold leading-snug text-[#8f5514]">
            You already have a request like this waiting for a decision. You can send another once it&apos;s handled.
          </p>
        )}

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={close}
            className="h-11 rounded-xl border border-[#ececf1] text-[13px] font-bold text-[#56505c] transition hover:border-[#ddd7df] hover:bg-[#faf9fb]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={cooling}
            onClick={() => {
              submitRequest({ kind, amount: chosen, reason: reason.trim() || undefined });
              close();
            }}
            className="h-11 rounded-xl bg-[#24202a] text-[13px] font-bold text-white transition hover:bg-[#3b3442] disabled:cursor-not-allowed disabled:opacity-35"
          >
            Send request
          </button>
        </div>
      </div>
    </div>
  );
}
