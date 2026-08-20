"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Gift, HelpCircle, Sparkle, Zap } from "lucide-react";
import { formatNumber } from "./data";
import { IdentityMenu } from "./identity-menu";
import { NotificationBell } from "./notification-bell";
import { useTeam } from "./team-context";

/**
 * 顶栏配额区 —— 对齐真实产品:credits + Upgrade 合成一颗浅橙胶囊(带 -30% 角标)
 * → Earn Cash 礼物图标 → 通知 → 帮助 → 身份菜单(账户 + 工作区切换合并在这一处)。
 * 团队化改动:credits 取当前团队池余额,左半段随角色变化,80%/100% 变色。
 */
export function TeamQuota() {
  const { team, role, quota, isPool, myLimit, myUsed, openSettings, openRequestModal, nextBill, showToast } = useTeam();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const auto = team.autoTopUp;

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

  // 阈值告警:80% 转琥珀,100% 转红
  const alertTone =
    quota.alert === "full"
      ? { border: "border-[#f0b6a6]", bg: "bg-[#fff6f3]", accent: "text-[#c9432a]", number: "text-[#c9432a]" }
      : quota.alert === "warn"
        ? { border: "border-[#f0cf9e]", bg: "bg-[#fffaf1]", accent: "text-[#b06a1c]", number: "text-[#b06a1c]" }
        : {
          border: "border-[#ffc9ad]",
          bg: "bg-gradient-to-r from-[#ffe9dc] to-[#fff8f4]",
          accent: "text-[#ff5e1a]",
          number: "text-[#ff5424]",
        };

  /** 胶囊左半段:Owner 可升级,Finance 可充值,其余角色不显示 */
  const leftSegment =
    role === "owner" ? { label: "Upgrade", tab: "billing" as const } : role === "finance" ? { label: "Top up", tab: "billing" as const } : null;

  const myPct = myLimit ? myUsed / myLimit.credits : 0;

  return (
    <>
      {/* credits + Upgrade 一颗胶囊:浅橙渐变底 + 星形积分章 + 右端嵌实心 CTA,-30% 角标挂在下方 */}
      <div ref={rootRef} className="relative">
        <div
          className={`flex h-9 items-center rounded-full ${
            quota.alert === "full"
              ? "bg-gradient-to-r from-[#fff1ec] to-[#ffe2da]"
              : quota.alert === "warn"
                ? "bg-gradient-to-r from-[#fff8ec] to-[#ffefd8]"
                : "bg-gradient-to-r from-[#fff6f1] to-[#ffe9de]"
          } ${leftSegment ? "pl-1 pr-0" : "pl-1 pr-3.5"}`}
        >
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={`${formatNumber(quota.available)} credits available ${isPool ? `in ${team.name}'s shared pool` : "on your seat"}`}
            className="flex h-full items-center gap-1.5 rounded-full px-1 transition hover:opacity-80"
          >
            <span
              aria-hidden="true"
              className={`grid size-[26px] shrink-0 place-items-center rounded-full bg-gradient-to-br ${
                quota.alert === "full"
                  ? "from-[#f08a70] to-[#d9432a]"
                  : quota.alert === "warn"
                    ? "from-[#ffc061] to-[#e08a1c]"
                    : "from-[#ff9a3d] to-[#ff5e1a]"
              }`}
            >
              {quota.alert ? (
                <AlertTriangle className="size-3.5 text-white" strokeWidth={2.4} />
              ) : (
                <Sparkle className="size-3.5 fill-white text-white" />
              )}
            </span>
            <span className={`text-[15px] font-extrabold tabular-nums ${alertTone.number}`}>
              {formatNumber(quota.available)}
            </span>
          </button>

          {/* Upgrade / Top up:嵌在胶囊右端,略微出框 */}
          {leftSegment && (
            <button
              type="button"
              onClick={() => openSettings(leftSegment.tab)}
              className="-mr-1.5 ml-2 h-9 shrink-0 rounded-full bg-gradient-to-r from-[#ff9a3d] to-[#ff5424] px-4 text-[13px] font-extrabold text-white shadow-[0_2px_10px_rgba(255,84,36,0.32)] transition hover:brightness-[1.04]"
            >
              {leftSegment.label}
            </button>
          )}
        </div>

        {/* 促销角标:挂在 Upgrade 下沿,仅 Owner 可见 */}
        {leftSegment && role === "owner" && (
          <span className="pointer-events-none absolute -bottom-2.5 right-1 rounded-full bg-gradient-to-r from-[#ff2b7d] to-[#e60f5d] px-2 py-0.5 text-[11px] font-extrabold leading-[1.3] text-white shadow-[0_2px_8px_rgba(230,15,93,0.35)]">
            -30%
          </span>
        )}

        {open && (
          <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-[290px] rounded-2xl border border-[#ececf1] bg-white p-4 text-left shadow-[0_18px_40px_rgba(26,26,46,0.16)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#a8a2ae]">
              {isPool ? `${team.name} shared pool` : team.personal ? "Your credits" : "Your seat"}
            </p>

            <div className="mt-3 space-y-3">
              <div>
                <div className="flex items-baseline justify-between text-[12px]">
                  <span className="font-semibold text-[#3b3442]">{isPool ? "Monthly pool" : "This month"}</span>
                  <span className="tabular-nums text-[#7b7480]">
                    {formatNumber(quota.remaining)} of {formatNumber(quota.total)} left
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#f1eff3]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, Math.round(quota.usedPct * 100))}%`,
                      background: quota.alert === "full" ? "#e35b3d" : quota.alert === "warn" ? "#e07a3a" : "#5b6cff",
                    }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-[#9a94a0]">
                  {isPool ? "Resets monthly · no rollover" : "Fixed per seat · resets monthly · no rollover"}
                </p>
              </div>

              <div>
                <div className="flex items-baseline justify-between text-[12px]">
                  <span className="font-semibold text-[#3b3442]">{isPool ? "Pool top-up" : "Seat top-up"}</span>
                  <span className="tabular-nums text-[#7b7480]">{formatNumber(quota.topupRemaining)} left</span>
                </div>
                <p className="mt-1 text-[11px] text-[#9a94a0]">
                  {quota.topupRemaining > 0 ? `Rolls over · expires ${team.topupExpires}` : "Rolls over for 12 months"}
                </p>
              </div>

              {myLimit && (
                <div className="border-t border-[#f0eef2] pt-3">
                  <div className="flex items-baseline justify-between text-[12px]">
                    <span className="font-semibold text-[#3b3442]">Your allocation</span>
                    <span className={`tabular-nums ${myPct >= 1 ? "font-bold text-[#c9432a]" : "text-[#7b7480]"}`}>
                      {formatNumber(myUsed)} / {formatNumber(myLimit.credits)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#f1eff3]">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.min(100, Math.round(myPct * 100))}%`, background: myPct >= 1 ? "#e35b3d" : myPct >= 0.8 ? "#e07a3a" : "#12a594" }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-[#9a94a0]">
                    {myLimit.mode === "hard" ? "Hard cap — blocks new work" : "Soft cap — warning only"} · resets {nextBill}
                  </p>
                </div>
              )}
            </div>

            {isPool && auto.enabled && (
              <p className="mt-3 flex items-start gap-1.5 border-t border-[#f0eef2] pt-3 text-[11px] leading-snug text-[#7b7480]">
                <Zap className="mt-0.5 size-3 shrink-0 text-[#8a8490]" />
                {auto.status === "paused"
                  ? "Auto top-up is paused — the card was declined."
                  : auto.status === "cap-reached"
                    ? "Auto top-up hit this month's cap."
                    : `Auto-recharges ${formatNumber(auto.amount)} when the pool drops below ${formatNumber(auto.threshold)}.`}
              </p>
            )}

            <div className="mt-3.5">
              {role === "owner" || role === "finance" ? (
                <button
                  type="button"
                  onClick={() => {
                    openSettings("billing");
                    setOpen(false);
                  }}
                  className="h-9 w-full rounded-xl bg-[#24202a] text-[12px] font-bold text-white transition hover:bg-[#3b3442]"
                >
                  Manage credits
                </button>
              ) : (
                // 之前这里只弹一句「去找 Owner」就没下文了 —— 现在真的能提申请
                <button
                  type="button"
                  onClick={() => {
                    openRequestModal("topup");
                    setOpen(false);
                  }}
                  className="h-9 w-full rounded-xl border border-[#ececf1] text-[12px] font-bold text-[#56505c] transition hover:border-[#ddd7df] hover:bg-[#faf9fb]"
                >
                  Request more credits
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        aria-label="Earn Cash"
        title="Earn Cash"
        onClick={() => showToast("Earn Cash isn't wired up in this prototype.")}
        className="relative hidden size-8 place-items-center rounded-full transition hover:bg-[#f6f4f7] sm:grid"
      >
        <Gift className="size-[19px] text-[#ff5e1a]" />
        <span aria-hidden="true" className="absolute right-[5px] top-[5px] size-[7px] rounded-full bg-[#ff3d8b] ring-2 ring-white" />
      </button>

      <NotificationBell />

      <button
        type="button"
        aria-label="Help"
        onClick={() => showToast("Help centre isn't wired up in this prototype.")}
        className="hidden size-8 place-items-center rounded-full text-[#9a9bb0] transition hover:bg-[#f6f4f7] hover:text-[#56505c] sm:grid"
      >
        <HelpCircle className="size-[18px]" />
      </button>

      <IdentityMenu />
    </>
  );
}
