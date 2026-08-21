"use client";

import { useEffect, useRef, useState } from "react";
import {
  Activity,
  Check,
  ChevronsUpDown,
  CircleUserRound,
  CreditCard,
  LogOut,
  Plus,
  Settings,
  Sparkle,
  Users,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { CURRENT_USER, formatNumber, pricingUrl, type Team } from "./data";
import { PlanBadge, ScopeBadge } from "./plan-badge";
import type { AccountTab } from "./account-settings-modal";
import { useTeam } from "./team-context";

/**
 * 全站头像统一:带圆角的方形 + 首字母,圆角按尺寸等比给(约 28%)。
 * 组织上传了 logo 就用 logo,没有才退回首字母 —— 两种形态尺寸与圆角完全一致。
 */
export function TeamAvatar({ team, size = 28 }: { team: Pick<Team, "name" | "color"> & { logo?: string }; size?: number }) {
  const radius = Math.max(5, Math.round(size * 0.28));
  if (team.logo) {
    return (
      // 上传的是 data URL,next/image 帮不上忙(也不该为演示图去配 loader)
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={team.logo}
        alt=""
        aria-hidden="true"
        className="shrink-0 object-cover"
        style={{ width: size, height: size, borderRadius: radius }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="grid shrink-0 place-items-center font-bold text-white"
      style={{
        width: size,
        height: size,
        background: team.color,
        borderRadius: radius,
        fontSize: Math.round(size * 0.44),
      }}
    >
      {team.name.trim()[0]?.toUpperCase()}
    </span>
  );
}

/**
 * 身份菜单 —— 顶栏右上角唯一的身份入口。
 * 原本「侧边栏团队切换器」和「右上角头像菜单」是两处,套餐徽章、设置入口、
 * credits 都各说一遍;现在合成一个:触发器同时呈现当前团队(方形)与本人(圆形角标),
 * 菜单里依次是「我 → 当前团队 credits → 切换工作区 → 账户设置 → 退出」。
 */
export function IdentityMenu() {
  const {
    teamsOnly,
    personalTeam,
    team,
    memberCount,
    setActiveTeamId,
    openSettings,
    openAccount,
    quota,
    role,
    showToast,
  } = useTeam();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [hoverId, setHoverId] = useState<string | null>(null);
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

  /** 顶栏同一套角色规则:Owner 能升级、Finance 能充值,其余角色不给入口 */
  const upgradeLabel = role === "owner" ? "Upgrade" : role === "finance" ? "Top up" : null;
  /** 进度条走「还剩多少」,和 credits left 文案同向 */
  const leftPct = Math.max(0, Math.min(100, Math.round((1 - quota.usedPct) * 100)));

  const workspaces = [personalTeam, ...teamsOnly];

  const item =
    "flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left text-[13px] font-semibold text-[#28222e] transition hover:bg-[#f6f4f7]";
  const go = (tab: AccountTab) => {
    openAccount(tab);
    setOpen(false);
  };

  const renderRow = (row: Team) => {
    const active = row.id === team.id;
    const people = memberCount(row.id);
    return (
      <div
        key={row.id}
        onMouseEnter={() => setHoverId(row.id)}
        onMouseLeave={() => setHoverId((current) => (current === row.id ? null : current))}
        className={`flex items-center gap-1 rounded-xl px-2 transition ${active ? "bg-[#fff3ee]" : "hover:bg-[#f6f4f7]"}`}
      >
        <button
          type="button"
          onClick={() => {
            setActiveTeamId(row.id);
            setOpen(false);
          }}
          className="flex min-w-0 flex-1 items-center gap-2.5 py-2 text-left"
        >
          <TeamAvatar team={row} size={30} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold text-[#28222e]">{row.name}</span>
            <span className="mt-0.5 flex items-center gap-1.5">
              <PlanBadge team={row} />
              {/* 个人账户只有本人,不显示成员数 —— 右边的 Personal 徽章已经说清它不是团队 */}
              {!row.personal && (
                <span className="truncate text-[11px] text-[#7b7480]">
                  · {people} {people === 1 ? "member" : "members"}
                </span>
              )}
            </span>
          </span>
          {/* 类型徽章:区分个人账号与团队(和左边的订阅徽章各说一件事) */}
          <ScopeBadge personal={!!row.personal} />
        </button>

        {/* 设置入口:每行 hover 都出,当前工作区常显 */}
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            // 个人账户没有团队设置,走账户设置
            if (row.personal) {
              setActiveTeamId(row.id);
              openAccount("account");
              return;
            }
            // 团队设置读的是当前团队,所以点别的团队的齿轮要先切过去
            if (!active) setActiveTeamId(row.id);
            openSettings("general");
          }}
          aria-label={`${row.name} settings`}
          title={row.personal ? "Account settings" : "Team settings"}
          className={`grid size-7 shrink-0 place-items-center rounded-lg text-[#8a8490] transition hover:bg-white hover:text-[#28222e] ${
            active || hoverId === row.id ? "opacity-100" : "opacity-0"
          }`}
        >
          <Settings className="size-4" />
        </button>

        {active ? (
          <Check className="size-4 shrink-0 text-[#ee6545]" />
        ) : (
          <span aria-hidden="true" className="size-4 shrink-0" />
        )}
      </div>
    );
  };

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${CURRENT_USER.name} · ${team.name}. Open account and workspace menu`}
        className="flex h-9 max-w-[240px] items-center gap-2 rounded-xl border border-[#ececf1] bg-white pl-1.5 pr-2 transition hover:border-[#ddd7df] hover:bg-[#faf9fb]"
      >
        <TeamAvatar team={team} size={26} />
        <span className="hidden min-w-0 truncate text-[13px] font-bold text-[#28222e] sm:block">{team.name}</span>
        <span className="hidden sm:block">
          <ScopeBadge personal={!!team.personal} />
        </span>
        <ChevronsUpDown className="size-3.5 shrink-0 text-[#8a8490]" />
      </button>

      {open && (
        <div
          role="menu"
          // 顶栏有 backdrop-blur(会成为 fixed 的包含块),所以这里只用 absolute + 宽度夹紧
          // 定宽 —— 个人视角和团队视角必须一样宽,不能跟着内容伸缩;横向一律不滚,长名字走 truncate
          className="absolute right-0 top-[calc(100%+8px)] z-50 max-h-[calc(100vh-96px)] w-[352px] max-w-[calc(100vw-24px)] overflow-y-auto overflow-x-hidden overscroll-contain rounded-2xl border border-[#ececf1] bg-white shadow-[0_18px_40px_rgba(26,26,46,0.14)]"
        >
          {/* 身份区:本人 —— 套餐徽章不放这儿,套餐属于工作区,下面每行自带 */}
          <div className="flex items-center gap-3 px-4 py-3.5">
            <TeamAvatar team={personalTeam} size={40} />
            <span className="min-w-0">
              <span className="flex min-w-0 items-center gap-1.5">
                <span className="truncate text-[14px] font-bold text-[#28222e]">{CURRENT_USER.name}</span>
                {/* 当前工作区正在用的订阅 —— 顶栏 Upgrade 和 credits 都是对着它 */}
                <PlanBadge team={team} />
              </span>
              <span className="mt-0.5 block truncate text-[12px] text-[#7b7480]">{CURRENT_USER.email}</span>
            </span>
          </div>

          {/* 积分行:剩余额度 + 进度条 + 升级入口(升级/充值按角色给) */}
          <div className="border-y border-[#f0eef2] px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => go("credits")}
                className="flex min-w-0 items-center gap-1.5 text-left transition hover:opacity-70"
              >
                <Sparkle className="size-4 shrink-0 fill-[#ff5e1a] text-[#ff5e1a]" />
                <span className="truncate text-[13px] font-bold text-[#28222e]">
                  {formatNumber(quota.available)} credits left
                </span>
              </button>

              {upgradeLabel && (
                <button
                  type="button"
                  onClick={() => {
                    // Upgrade 去订阅页比价;Top up(Finance)是产品内动作,仍留在 Billing
                    if (upgradeLabel === "Upgrade") router.push(pricingUrl(!!team.personal));
                    else openSettings("billing");
                    setOpen(false);
                  }}
                  className="shrink-0 rounded-full bg-gradient-to-r from-[#ff9a3d] to-[#ff5424] px-2.5 py-1 text-[11px] font-extrabold text-white transition hover:brightness-[1.04]"
                >
                  {upgradeLabel}
                </button>
              )}
            </div>

            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#f1eff3]">
              <div
                className="h-full rounded-full transition-[width] duration-300"
                style={{
                  width: `${leftPct}%`,
                  background:
                    leftPct <= 0
                      ? "#e35b3d"
                      : leftPct <= 20
                        ? "linear-gradient(90deg,#ffc061,#e08a1c)"
                        : "linear-gradient(90deg,#ff9a3d,#ff5424)",
                }}
              />
            </div>
          </div>

          {/* 切换工作区:平铺列表,个人/团队看订阅徽章与副行 */}
          <div className="p-2" onMouseLeave={() => setHoverId(null)}>
            <div className="grid gap-0.5">{workspaces.map(renderRow)}</div>


            <button
              type="button"
              // 建团队 = 购买,所以这里直接去订阅页,在那边挑档位、填团队名、付款
              onClick={() => {
                router.push(pricingUrl(false));
                setOpen(false);
              }}
              // 建团队是这里唯一的正向动作,只靠品牌橙的字色区分,不加底色
              className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-[13px] font-bold text-[#ee6545] transition hover:bg-[#fff3ee]"
            >
              <Plus className="size-4 text-[#ee6545]" />
              Create team
            </button>
          </div>

          <div className="border-t border-[#f0eef2] p-2">
            <button type="button" onClick={() => go("account")} className={item}>
              <CircleUserRound className="size-[18px] text-[#56505c]" />
              Account Settings
            </button>
            <button type="button" onClick={() => go("billing")} className={item}>
              <CreditCard className="size-[18px] text-[#56505c]" />
              Billing &amp; Subscription
            </button>
            <button type="button" onClick={() => go("credits")} className={item}>
              <Activity className="size-[18px] text-[#56505c]" />
              Credits Usage
            </button>
            <button type="button" onClick={() => go("topup")} className={item}>
              <Zap className="size-[18px] text-[#56505c]" />
              Credits Top-up
            </button>
          </div>

          <div className="border-t border-[#f0eef2] p-2">
            <button
              type="button"
              onClick={() => {
                showToast("Log out isn't wired up in this prototype.");
                setOpen(false);
              }}
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
