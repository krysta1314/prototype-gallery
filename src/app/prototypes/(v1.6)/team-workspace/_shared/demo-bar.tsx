"use client";

import Link from "next/link";
import { PENDING_TEAM_KEY, ROLE_LABEL, type Role } from "./data";
import { STORAGE_KEY, useTeam, type AutoState, type PoolLevel, type SubState } from "./team-context";

const ROLES: Role[] = ["owner", "admin", "finance", "member"];

/** 演示控制条 —— 仅用于 demo,不属于真实产品 UI,故文案为中文 */
export function DemoBar({ page, sticky = true }: { page: "home" | "agent" | "canvas" | "assets" | "invite"; sticky?: boolean }) {
  const {
    team,
    teamsOnly,
    setActiveTeamId,
    isPool,
    role,
    roleOverride,
    setRoleOverride,
    seatsFullOverride,
    setSeatsFullOverride,
    poolLevel,
    setPoolLevel,
    myAllocationFull,
    setMyAllocationFull,
    autoState,
    setAutoState,
    isPersonal,
    setNoTeams,
    subState,
    setSubState,
  } = useTeam();

  const selectClass =
    "rounded-lg border border-white/15 bg-white/10 px-2 py-1 font-semibold text-white outline-none";

  return (
    <div className={`z-[120] h-[52px] overflow-x-auto border-b border-white/10 bg-[#141425] px-4 text-white ${sticky ? "sticky top-0" : ""}`}>
      <div className="mx-auto flex h-full w-max min-w-full max-w-[1600px] items-center gap-x-5 text-[12px]">
        <span className="shrink-0 font-bold tracking-wide text-white/90">演示控制</span>

        {/* 四个主页面靠侧边栏跳转,这里只留侧边栏到不了的页面 */}
        <Link
          href={page === "invite" ? "/prototypes/team-workspace/home" : "/prototypes/team-workspace/invite"}
          className="shrink-0 rounded-md bg-white/10 px-2.5 py-1 font-semibold text-white/75 transition hover:bg-white/20 hover:text-white"
        >
          {page === "invite" ? "← 回 Home" : "邀请落地页"}
        </Link>

        {/* 演示只分两个视角:个人账号(注册后的常态,还没有团队)与团队账号 */}
        <label className="flex shrink-0 items-center gap-1.5 text-white/55">
          视角
          <select
            value={isPersonal ? "personal" : "team"}
            onChange={(event) => setNoTeams(event.target.value === "personal")}
            className={selectClass}
          >
            <option value="personal" className="text-[#1a1a2e]">个人账号视角</option>
            <option value="team" className="text-[#1a1a2e]">团队账号视角</option>
          </select>
        </label>

        {/* 团队选择器 —— Atlas Media Group 是 Enterprise,切过去就是共享池那套模型 */}
        {!isPersonal && (
          <label className="flex shrink-0 items-center gap-1.5 text-white/55">
            团队
            <select value={team.id} onChange={(event) => setActiveTeamId(event.target.value)} className={selectClass}>
              {teamsOnly.map((item) => (
                <option key={item.id} value={item.id} className="text-[#1a1a2e]">
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {/* 角色是团队里的概念,个人账号只有自己,所以只在团队视角出现 */}
        {!isPersonal && (
          <>
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

            {/* per-seat 团队推的是「我这个席位」,Enterprise 推的才是组织共享池 */}
            <label className="flex shrink-0 items-center gap-1.5 text-white/55">
              {isPool ? "池用量" : "我的席位额度"}
              <select value={poolLevel} onChange={(event) => setPoolLevel(event.target.value as PoolLevel)} className={selectClass}>
                <option value="normal" className="text-[#1a1a2e]">正常</option>
                <option value="warn" className="text-[#1a1a2e]">80% 告警</option>
                <option value="full" className="text-[#1a1a2e]">100% 用尽</option>
              </select>
            </label>

            {/* 「分配额度」只有共享池才有 —— 每席固定的团队没有可分配的东西 */}
            {isPool && (
            <label className="flex shrink-0 items-center gap-1.5 text-white/55">
              我的分配额度
              <select
                value={myAllocationFull ? "full" : "ok"}
                onChange={(event) => setMyAllocationFull(event.target.value === "full")}
                className={selectClass}
              >
                <option value="ok" className="text-[#1a1a2e]">正常</option>
                <option value="full" className="text-[#1a1a2e]">已用满</option>
              </select>
            </label>
            )}

            {/* 订阅生命周期 —— 宽限期与终止态没法靠等时间演,只能从这里切 */}
            <label className="flex shrink-0 items-center gap-1.5 text-white/55">
              订阅
              <select value={subState} onChange={(event) => setSubState(event.target.value as SubState)} className={selectClass}>
                <option value="active" className="text-[#1a1a2e]">正常</option>
                <option value="pending" className="text-[#1a1a2e]">已签约待付款 · 未开通</option>
                <option value="grace" className="text-[#1a1a2e]">续费失败 · 7 天宽限期</option>
                <option value="expired" className="text-[#1a1a2e]">已终止 · 退回 Free</option>
              </select>
            </label>

            {/* 自动充值是池级动作,per-seat 团队没有池可充 */}
            {isPool && (
            <label className="flex shrink-0 items-center gap-1.5 text-white/55">
              自动充值
              <select value={autoState} onChange={(event) => setAutoState(event.target.value as AutoState)} className={selectClass}>
                <option value="active" className="text-[#1a1a2e]">正常</option>
                <option value="paused" className="text-[#1a1a2e]">失败已暂停</option>
                <option value="cap" className="text-[#1a1a2e]">撞月度封顶</option>
              </select>
            </label>
            )}
          </>
        )}

        {/*
         * 重置演示 —— 角色 / 额度 / 席位这些 override 都写进了 localStorage,
         * 上一场演示留下的状态会串到下一场。清掉两个 key 再硬刷新回到出厂状态:
         *   STORAGE_KEY      演示 override 本身
         *   PENDING_TEAM_KEY 收银台交接用的待落库团队(付款后中断会残留)
         */}
        <button
          type="button"
          onClick={() => {
            try {
              window.localStorage.removeItem(STORAGE_KEY);
              window.localStorage.removeItem(PENDING_TEAM_KEY);
            } catch {
              /* ignore */
            }
            // 用 replace 而不是 reload —— 顺手把 URL 上的场景参数也一起丢掉,
            // 否则清了存储又被 ?role=member 之类立刻覆盖回去
            window.location.replace(window.location.pathname);
          }}
          className="ml-auto shrink-0 rounded-md bg-white/10 px-2.5 py-1 font-semibold text-white/75 transition hover:bg-white/20 hover:text-white"
        >
          重置演示
        </button>
      </div>
    </div>
  );
}
