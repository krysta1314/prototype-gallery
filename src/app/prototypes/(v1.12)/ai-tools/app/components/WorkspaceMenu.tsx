"use client";

/* 顶栏右上角的账号 / 工作区切换(2026-11-06 Monica 定，样式和规则照 v1.6 team-workspace 的身份菜单):
   触发器 = 当前工作区头像 + 名字 + Personal / Team 徽章;
   菜单 = 本人(头像、名字、邮箱)→ 工作区列表(个人账号 + 所在团队，各带订阅徽章、成员数、类型徽章，当前的打勾)→ Account Settings / Log out。
   切到哪个工作区，顶栏的积分就换成那个工作区的余额(外壳订阅 workspace store)。 */

import { useEffect, useRef, useState } from "react";
import { Check, ChevronsUpDown, LogOut, Settings } from "lucide-react";
import { PlanBadge, ScopeBadge } from "@/app/prototypes/(v1.6)/team-workspace/_shared/plan-badge";
import { CURRENT_USER, MEMBER_COUNT, PERSONAL_ID, WORKSPACES, setWorkspace, useWorkspace, type Workspace } from "./workspace";

/** 工作区头像：圆角方块 + 首字母(和 v1.6 一致) */
function WsAvatar({ ws, size }: { ws: Pick<Workspace, "name" | "color">; size: number }) {
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center font-bold text-white"
      style={{ width: size, height: size, background: ws.color, borderRadius: Math.max(5, Math.round(size * 0.28)), fontSize: Math.round(size * 0.44) }}
    >
      {ws.name.trim()[0]?.toUpperCase()}
    </span>
  );
}

export function WorkspaceMenu({ compact = false, notify }: { compact?: boolean; notify?: (text: string) => void }) {
  const ws = useWorkspace();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const personal = WORKSPACES.find((w) => w.id === PERSONAL_ID)!;
  const list = [personal, ...WORKSPACES.filter((w) => w.id !== PERSONAL_ID)];
  const soon = (t: string) => {
    setOpen(false);
    notify?.(`${t} isn't available in this prototype.`);
  };

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${CURRENT_USER.name} · ${ws.name}. Switch account or workspace`}
        className={
          compact
            ? "grid size-8 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40"
            : "ml-1 flex h-8 max-w-[260px] items-center gap-2 rounded-full border border-[#ececf1] bg-white py-1 pl-1 pr-2.5 transition hover:border-[#ddd7df] hover:bg-[#faf9fb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40"
        }
      >
        <WsAvatar ws={ws} size={compact ? 30 : 24} />
        {!compact && (
          <>
            <span className="min-w-0 truncate text-[13px] font-semibold text-[#1a1a2e]">{ws.name}</span>
            <ScopeBadge personal={ws.personal} />
            <ChevronsUpDown className="size-3.5 shrink-0 text-[#9a9bb0]" />
          </>
        )}
      </button>

      {open && (
        <div role="menu" aria-label="Account and workspaces" className="absolute right-0 top-[calc(100%+8px)] z-50 w-[320px] max-w-[calc(100vw-24px)] rounded-2xl border border-[#ececf1] bg-white p-2 shadow-[0_16px_48px_rgba(26,26,46,0.16)]">
          <div className="flex items-center gap-3 px-2.5 py-2.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-full text-[15px] font-bold text-white" style={{ background: CURRENT_USER.color }} aria-hidden>
              {CURRENT_USER.name[0]}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[14px] font-bold text-[#1a1a2e]">{CURRENT_USER.name}</span>
              <span className="block truncate text-[12px] text-[#7b7480]">{CURRENT_USER.email}</span>
            </span>
          </div>

          <div className="my-1 h-px bg-[#f0eef2]" />
          <p className="px-2.5 pb-1 pt-1.5 text-[12px] font-semibold text-[#7b7480]">Switch workspace</p>
          <div className="grid gap-0.5">
            {list.map((row) => {
              const active = row.id === ws.id;
              const people = MEMBER_COUNT[row.id];
              return (
                <button
                  key={row.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  onClick={() => {
                    setOpen(false);
                    if (active) return;
                    /* 切换提示由外壳统一弹(它同时换积分余额) */
                    setWorkspace(row.id);
                  }}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition ${active ? "bg-[#fff3ee]" : "hover:bg-[#f6f4f7]"}`}
                >
                  <WsAvatar ws={row} size={30} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-[#28222e]">{row.name}</span>
                    <span className="mt-0.5 flex items-center gap-1.5">
                      <PlanBadge team={row} />
                      {!row.personal && people && <span className="truncate text-[11px] text-[#7b7480]">· {people} members</span>}
                    </span>
                  </span>
                  <ScopeBadge personal={row.personal} />
                  {active ? <Check className="size-4 shrink-0 text-[#ee6545]" /> : <span aria-hidden className="size-4 shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="my-1 h-px bg-[#f0eef2]" />
          <button type="button" role="menuitem" onClick={() => soon(ws.personal ? "Account settings" : "Team settings")} className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left text-[13px] font-semibold text-[#28222e] transition hover:bg-[#f6f4f7]">
            <Settings className="size-4 text-[#8a8490]" /> {ws.personal ? "Account Settings" : "Team Settings"}
          </button>
          <button type="button" role="menuitem" onClick={() => soon("Logging out")} className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left text-[13px] font-semibold text-[#e5484d] transition hover:bg-[#fff1f0]">
            <LogOut className="size-4" /> Log out
          </button>
        </div>
      )}
    </div>
  );
}
