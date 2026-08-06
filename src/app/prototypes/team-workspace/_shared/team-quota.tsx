"use client";

import { useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  CirclePlus,
  CircleUserRound,
  CreditCard,
  HelpCircle,
  Info,
  LogOut,
  Zap,
} from "lucide-react";
import { CURRENT_USER, formatNumber } from "./data";
import { useTeam } from "./team-context";

/**
 * 顶栏配额区 —— 对齐真实产品:Upgrade 与 credits 合并成一个胶囊,
 * 后面依次是 Earn Cash、帮助、头像。
 * 团队化改动:credits 取当前团队池余额,左半段随角色变化,80%/100% 变色。
 */
export function TeamQuota() {
  const { team, role, pool, myLimit, myUsed, openSettings, showToast } = useTeam();
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
    pool.alert === "full"
      ? { border: "border-[#f0b6a6]", bg: "bg-[#fff6f3]", accent: "text-[#c9432a]", number: "text-[#c9432a]" }
      : pool.alert === "warn"
        ? { border: "border-[#f0cf9e]", bg: "bg-[#fffaf1]", accent: "text-[#b06a1c]", number: "text-[#b06a1c]" }
        : {
          border: "border-[#ffc9ad]",
          bg: "bg-gradient-to-r from-[#ffe9dc] to-[#fff8f4]",
          accent: "text-[#ff5e1a]",
          number: "text-[#28222e]",
        };

  /** 胶囊左半段:Owner 可升级,Finance 可充值,其余角色不显示 */
  const leftSegment =
    role === "owner" ? { label: "Upgrade", tab: "billing" as const } : role === "finance" ? { label: "Top up", tab: "billing" as const } : null;

  const myPct = myLimit ? myUsed / myLimit.credits : 0;

  return (
    <>
      <div ref={rootRef} className="relative">
        <div className={`flex h-9 items-center rounded-full border ${alertTone.border} ${alertTone.bg} shadow-[0_1px_2px_rgba(26,26,46,0.04)]`}>
          {leftSegment && (
            <>
              <button
                type="button"
                onClick={() => openSettings(leftSegment.tab)}
                className={`h-full rounded-l-full px-3.5 text-[13px] font-bold ${alertTone.accent} transition hover:bg-white/45`}
              >
                {leftSegment.label}
              </button>
              <span aria-hidden="true" className="h-4 w-px shrink-0 bg-[#ffbf9e]" />
            </>
          )}

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={`${formatNumber(pool.remaining)} credits available to ${team.name}`}
            className={`flex h-full items-center gap-1.5 rounded-r-full px-3.5 text-[13px] transition hover:bg-white/45 ${leftSegment ? "" : "rounded-l-full"}`}
          >
            {pool.alert ? (
              <AlertTriangle className={`size-4 shrink-0 ${alertTone.accent}`} />
            ) : (
              <CirclePlus className="size-[18px] shrink-0 fill-[#ff7a2d] text-white" strokeWidth={2.2} />
            )}
            <span className={`font-bold tabular-nums ${alertTone.number}`}>{formatNumber(pool.remaining)}</span>
            <span className="font-medium text-[#8a8490]">credits</span>
          </button>
        </div>

        {/* 30% OFF 促销角标,仅 Owner 可见 */}
        {role === "owner" && (
          <span className="pointer-events-none absolute -left-2 -top-2.5 rounded-md bg-gradient-to-r from-[#ff3d8b] to-[#e60f5d] px-1.5 py-0.5 text-[10px] font-extrabold uppercase leading-none tracking-wide text-white shadow-[0_2px_8px_rgba(230,15,93,0.35)]">
            30% OFF
          </span>
        )}

        {open && (
          <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-[290px] rounded-2xl border border-[#ececf1] bg-white p-4 text-left shadow-[0_18px_40px_rgba(26,26,46,0.16)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#a8a2ae]">{team.name} pool</p>

            <div className="mt-3 space-y-3">
              <div>
                <div className="flex items-baseline justify-between text-[12px]">
                  <span className="font-semibold text-[#3b3442]">Subscription</span>
                  <span className="tabular-nums text-[#7b7480]">{formatNumber(pool.subRemaining)} left</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#f1eff3]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, Math.round(pool.usedPct * 100))}%`,
                      background: pool.alert === "full" ? "#e35b3d" : pool.alert === "warn" ? "#e07a3a" : "#5b6cff",
                    }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-[#9a94a0]">Resets monthly · no rollover</p>
              </div>

              <div>
                <div className="flex items-baseline justify-between text-[12px]">
                  <span className="font-semibold text-[#3b3442]">Top-up</span>
                  <span className="tabular-nums text-[#7b7480]">{formatNumber(pool.topupRemaining)} left</span>
                </div>
                <p className="mt-1 text-[11px] text-[#9a94a0]">
                  {pool.topupRemaining > 0 ? `Rolls over · expires ${team.topupExpires}` : "Rolls over for 12 months"}
                </p>
              </div>

              {myLimit && (
                <div className="border-t border-[#f0eef2] pt-3">
                  <div className="flex items-baseline justify-between text-[12px]">
                    <span className="font-semibold text-[#3b3442]">Your monthly limit</span>
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
                  <p className="mt-1 text-[11px] text-[#9a94a0]">{myLimit.mode === "hard" ? "Hard cap — blocks new work" : "Soft cap — warning only"}</p>
                </div>
              )}
            </div>

            {auto.enabled && (
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
                <button
                  type="button"
                  onClick={() => {
                    showToast("Only the owner and billing contacts can top up credits.");
                    setOpen(false);
                  }}
                  className="h-9 w-full rounded-xl border border-[#ececf1] text-[12px] font-bold text-[#56505c] transition hover:bg-[#faf9fb]"
                >
                  Ask the owner to top up
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => showToast("Earn Cash isn't wired up in this prototype.")}
        className="hidden items-center gap-1.5 rounded-full px-2 py-1.5 text-[13px] font-semibold text-[#28222e] transition hover:bg-[#f6f4f7] sm:flex"
      >
        <CircleDollarSign className="size-[18px] text-[#f0a020]" />
        Earn Cash
      </button>

      <button
        type="button"
        aria-label="Help"
        onClick={() => showToast("Help centre isn't wired up in this prototype.")}
        className="hidden size-8 place-items-center rounded-full text-[#9a9bb0] transition hover:bg-[#f6f4f7] hover:text-[#56505c] sm:grid"
      >
        <HelpCircle className="size-[18px]" />
      </button>

      <UserMenu />
    </>
  );
}

/** 用户头像:单色圆底 + 首字母 */
function Avatar({ size = 28 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="grid shrink-0 place-items-center rounded-full bg-[#d3ede2] font-bold text-[#1a7a5e]"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
    >
      {CURRENT_USER.name[0]}
    </span>
  );
}

/** 头像区:头像 + 用户名 + 下拉(对齐真实产品) */
function UserMenu() {
  const { openSettings, showToast, plan, pool } = useTeam();
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

  const item =
    "flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left text-[13px] font-semibold text-[#28222e] transition hover:bg-[#f6f4f7]";
  const toBilling = () => {
    openSettings("billing");
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full py-1 pl-1 pr-1.5 transition hover:bg-[#f6f4f7]"
      >
        <Avatar size={28} />
        <span className="hidden text-[13px] font-bold text-[#28222e] sm:block">{CURRENT_USER.name.split(" ")[0]}</span>
        <ChevronDown className="size-3.5 shrink-0 text-[#9a94a0]" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-[264px] overflow-hidden rounded-2xl border border-[#ececf1] bg-white shadow-[0_18px_40px_rgba(26,26,46,0.14)]"
        >
          {/* 身份区:头像居中 + 姓名 + 套餐徽章 + 邮箱 */}
          <div className="px-4 pb-4 pt-5 text-center">
            <div className="flex justify-center">
              <Avatar size={44} />
            </div>
            <p className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5">
              <span className="text-[14px] font-bold text-[#28222e]">{CURRENT_USER.name}</span>
              <span className="rounded-md bg-[#efe9ff] px-1.5 py-0.5 text-[10px] font-bold text-[#7b5cf0]">{plan.name}</span>
            </p>
            <p className="mt-1 truncate text-[12px] text-[#9a94a0]">{CURRENT_USER.email}</p>
          </div>

          {/* 积分行 */}
          <button
            type="button"
            onClick={toBilling}
            className="flex w-full items-center justify-between gap-3 border-y border-[#f0eef2] px-4 py-3 text-[13px] transition hover:bg-[#f6f4f7]"
          >
            <span className="font-semibold text-[#28222e]">Credits</span>
            <span className="flex items-center gap-1.5">
              <span className="font-bold tabular-nums text-[#28222e]">{formatNumber(pool.remaining)}</span>
              <ChevronRight className="size-4 text-[#b4aeb8]" />
            </span>
          </button>

          <div className="p-2">
            <button type="button" onClick={() => { showToast("Account settings aren't wired up in this prototype."); setOpen(false); }} className={item}>
              <CircleUserRound className="size-[18px] text-[#56505c]" />
              Account Settings
            </button>
            <button type="button" onClick={toBilling} className={item}>
              <CreditCard className="size-[18px] text-[#56505c]" />
              Billing &amp; Subscription
            </button>
            <button type="button" onClick={toBilling} className={item}>
              <Activity className="size-[18px] text-[#56505c]" />
              Credits Usage
            </button>
            <button type="button" onClick={toBilling} className={item}>
              <Zap className="size-[18px] text-[#56505c]" />
              Credits Top-up
            </button>
            <button type="button" onClick={() => { showToast("About Us isn't wired up in this prototype."); setOpen(false); }} className={`${item} justify-between`}>
              <span className="flex items-center gap-3">
                <Info className="size-[18px] text-[#56505c]" />
                About Us
              </span>
              <ChevronRight className="size-4 text-[#b4aeb8]" />
            </button>
          </div>

          <div className="border-t border-[#f0eef2] p-2">
            <button
              type="button"
              onClick={() => { showToast("Log out isn't wired up in this prototype."); setOpen(false); }}
              className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left text-[13px] font-semibold text-[#d92d20] transition hover:bg-[#fef3f2]"
            >
              <LogOut className="size-[18px]" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
