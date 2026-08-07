"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronsUpDown, Plus, Settings } from "lucide-react";
import { planOf, type Team } from "./data";
import { useTeam } from "./team-context";

export function TeamAvatar({ team, size = 28 }: { team: Pick<Team, "name" | "color">; size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="grid shrink-0 place-items-center rounded-[8px] font-bold text-white"
      style={{ width: size, height: size, background: team.color, fontSize: Math.round(size * 0.44) }}
    >
      {team.name.trim()[0]?.toUpperCase()}
    </span>
  );
}

/** 列表里用短名(Free / Basic / Pro / Scale),触发器上用完整套餐名 */
const SHORT_PLAN: Record<string, string> = { starter: "Free", basic: "Basic", pro: "Pro", scale: "Scale" };

function PlanBadge({ team, short = false, compact = false }: { team: Team; short?: boolean; compact?: boolean }) {
  const plan = planOf(team);
  const paid = plan.id !== "starter";
  return (
    <span
      className={`shrink-0 rounded font-bold ${compact ? "px-1 py-px text-[10px] leading-[1.35]" : "rounded-md px-1.5 py-0.5 text-[10px]"} ${
        paid ? "bg-[#efe9ff] text-[#7b5cf0]" : "bg-[#f1eff3] text-[#7b7480]"
      }`}
    >
      {short ? SHORT_PLAN[plan.id] : plan.name}
    </span>
  );
}

export function TeamSwitcher({ variant = "full" }: { variant?: "full" | "icon" }) {
  const { teams, team, memberCount, setActiveTeamId, openSettings, openAccount, setCreateTeamOpen } = useTeam();
  const [open, setOpen] = useState(false);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const activeMembers = memberCount(team.id);

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

  const renderRow = (item: Team) => {
    const active = item.id === team.id;
    const people = memberCount(item.id);
    return (
      <div
        key={item.id}
        onMouseEnter={() => setHoverId(item.id)}
        onMouseLeave={() => setHoverId((current) => (current === item.id ? null : current))}
        className={`flex items-center gap-1 rounded-xl px-2 transition ${active ? "bg-[#fff3ee]" : "hover:bg-[#f6f4f7]"}`}
      >
        <button
          type="button"
          onClick={() => {
            setActiveTeamId(item.id);
            setOpen(false);
          }}
          className="flex min-w-0 flex-1 items-center gap-2.5 py-2 text-left"
        >
          <TeamAvatar team={item} size={30} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold text-[#28222e]">{item.name}</span>
            <span className="mt-0.5 flex items-center gap-1.5">
              <PlanBadge team={item} short compact />
              <span className="truncate text-[11px] text-[#9a94a0]">
                · {people} {people === 1 ? "member" : "members"}
              </span>
            </span>
          </span>
        </button>

        {/* 设置入口:每行 hover 都出,当前团队常显 */}
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            // 个人空间没有团队设置,走账户设置
            if (item.personal) {
              setActiveTeamId(item.id);
              openAccount("account");
              return;
            }
            // 团队设置读的是当前团队,所以点别的团队的齿轮要先切过去
            if (!active) setActiveTeamId(item.id);
            openSettings("general");
          }}
          aria-label={`${item.name} settings`}
          title="Team settings"
          className={`grid size-7 shrink-0 place-items-center rounded-lg text-[#8a8490] transition hover:bg-white hover:text-[#28222e] ${
            active || hoverId === item.id ? "opacity-100" : "opacity-0"
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
    <div ref={rootRef} className={`relative ${variant === "icon" ? "" : "w-full"}`}>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={`Current team: ${team.name}. Switch team`}
          className="group relative grid size-10 place-items-center rounded-xl transition hover:bg-[#f6f4f7]"
        >
          <TeamAvatar team={team} size={28} />
          <span className="pointer-events-none absolute left-[52px] top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-lg bg-[#24202a] px-2.5 py-1.5 text-[12px] font-semibold text-white opacity-0 shadow-lg transition group-hover:opacity-100">
            {team.name}
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          className="flex w-full items-center gap-2.5 rounded-xl border border-[#ececf1] bg-white px-2.5 py-2 text-left transition hover:border-[#e0dae3] hover:bg-[#faf9fb]"
        >
          <TeamAvatar team={team} size={32} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-bold text-[#28222e]">{team.name}</span>
            <span className="mt-0.5 flex items-center gap-1.5">
              <PlanBadge team={team} short compact />
              <span className="truncate text-[11px] text-[#9a94a0]">
                · {activeMembers} {activeMembers === 1 ? "Member" : "Members"}
              </span>
            </span>
          </span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-[#9a94a0]" />
        </button>
      )}

      {open && (
        <div
          role="menu"
          className={`absolute z-50 w-[268px] rounded-2xl border border-[#ececf1] bg-white p-2 shadow-[0_18px_40px_rgba(26,26,46,0.14)] ${
            variant === "icon" ? "left-[52px] top-0" : "left-0 top-[calc(100%+8px)]"
          }`}
        >
          <div className="grid gap-0.5" onMouseLeave={() => setHoverId(null)}>
            {teams.map(renderRow)}
          </div>
          <div className="mt-1.5 border-t border-[#f0eef2] pt-1.5">
            <button
              type="button"
              onClick={() => {
                setCreateTeamOpen(true);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-[13px] font-semibold text-[#56505c] transition hover:bg-[#f6f4f7]"
            >
              <Plus className="size-4 text-[#8a8490]" />
              Create Team
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
