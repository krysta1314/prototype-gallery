"use client";

import Link from "next/link";
import { ROLE_LABEL, type Role } from "./data";
import { useTeam, type AutoState, type PoolLevel } from "./team-context";

const ROLES: Role[] = ["owner", "admin", "finance", "member"];

/** 演示控制条 —— 仅用于 demo,不属于真实产品 UI,故文案为中文 */
export function DemoBar({ page, sticky = true }: { page: "home" | "agent" | "canvas" | "assets" | "invite"; sticky?: boolean }) {
  const {
    team,
    teams,
    role,
    roleOverride,
    setRoleOverride,
    seatsFullOverride,
    setSeatsFullOverride,
    poolLevel,
    setPoolLevel,
    myLimitFull,
    setMyLimitFull,
    autoState,
    setAutoState,
    setActiveTeamId,
    isPersonal,
  } = useTeam();

  const selectClass =
    "rounded-lg border border-white/15 bg-white/10 px-2 py-1 font-semibold text-white outline-none";

  return (
    <div className={`z-[120] h-[52px] overflow-x-auto border-b border-white/10 bg-[#141425] px-4 text-white ${sticky ? "sticky top-0" : ""}`}>
      <div className="mx-auto flex h-full w-max min-w-full max-w-[1600px] items-center gap-x-5 text-[12px]">
        <span className="shrink-0 font-bold tracking-wide text-white/90">演示控制</span>

        {/* 四个主页面靠侧边栏跳转,这里只留侧边栏到不了的邀请落地页 */}
        <Link
          href={page === "invite" ? "/prototypes/team-workspace/home" : "/prototypes/team-workspace/invite"}
          className="shrink-0 rounded-md bg-white/10 px-2.5 py-1 font-semibold text-white/75 transition hover:bg-white/20 hover:text-white"
        >
          {page === "invite" ? "← 回 Home" : "邀请落地页"}
        </Link>

        <label className="flex shrink-0 items-center gap-1.5 text-white/55">
          团队
          <select value={team.id} onChange={(event) => setActiveTeamId(event.target.value)} className={selectClass}>
            {teams.map((item) => (
              <option key={item.id} value={item.id} className="text-[#1a1a2e]">
                {item.name}
                {item.personal ? "(个人团队)" : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="flex shrink-0 items-center gap-1.5 text-white/55">
          角色
          <div className="flex items-center gap-1 rounded-lg bg-white/10 p-0.5">
            {ROLES.map((item) => {
              const active = role === item;
              return (
                <button
                  key={item}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setRoleOverride(item)}
                  className={`rounded-md px-2.5 py-1 font-semibold transition ${
                    active ? "bg-[#ff795f] text-white" : "text-white/65 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {ROLE_LABEL[item]}
                </button>
              );
            })}
          </div>
          {roleOverride && (
            <button type="button" onClick={() => setRoleOverride(null)} className="text-white/45 underline underline-offset-2 hover:text-white/80">
              还原
            </button>
          )}
        </label>

        {!isPersonal && (
          <>
            <label className="flex shrink-0 items-center gap-1.5 text-white/55">
              席位
              <select
                value={seatsFullOverride ? "full" : "ok"}
                onChange={(event) => setSeatsFullOverride(event.target.value === "full")}
                className={selectClass}
              >
                <option value="ok" className="text-[#1a1a2e]">充足</option>
                <option value="full" className="text-[#1a1a2e]">已满</option>
              </select>
            </label>

            <label className="flex shrink-0 items-center gap-1.5 text-white/55">
              池用量
              <select value={poolLevel} onChange={(event) => setPoolLevel(event.target.value as PoolLevel)} className={selectClass}>
                <option value="normal" className="text-[#1a1a2e]">正常</option>
                <option value="warn" className="text-[#1a1a2e]">80% 告警</option>
                <option value="full" className="text-[#1a1a2e]">100% 用尽</option>
              </select>
            </label>

            <label className="flex shrink-0 items-center gap-1.5 text-white/55">
              我的额度
              <select
                value={myLimitFull ? "full" : "ok"}
                onChange={(event) => setMyLimitFull(event.target.value === "full")}
                className={selectClass}
              >
                <option value="ok" className="text-[#1a1a2e]">正常</option>
                <option value="full" className="text-[#1a1a2e]">已用满</option>
              </select>
            </label>

            <label className="flex shrink-0 items-center gap-1.5 text-white/55">
              自动充值
              <select value={autoState} onChange={(event) => setAutoState(event.target.value as AutoState)} className={selectClass}>
                <option value="active" className="text-[#1a1a2e]">正常</option>
                <option value="paused" className="text-[#1a1a2e]">失败已暂停</option>
                <option value="cap" className="text-[#1a1a2e]">撞月度封顶</option>
              </select>
            </label>
          </>
        )}
      </div>
    </div>
  );
}
