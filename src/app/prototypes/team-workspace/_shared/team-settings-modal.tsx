"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpDown,
  Coins,
  Building2,
  Check,
  CreditCard,
  Crown,
  Infinity as InfinityIcon,
  LogOut,
  Mail,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  Search,
  Users,
  X,
  Zap,
} from "lucide-react";
import {
  CREDIT_PACKS,
  CURRENT_USER_ID,
  formatNumber,
  formatTokens,
  PLANS,
  ROLE_BLURB,
  ROLE_LABEL,
  SEAT_PRICE,
  type Member,
  type MemberLimit,
  type PlanId,
  type Role,
} from "./data";
import { useTeam } from "./team-context";
import { TeamAvatar } from "./team-switcher";
import { InviteModal } from "./invite-modal";

type Tab = "general" | "members" | "credits" | "billing";

const ALL_TABS: { key: Tab; label: string; icon: typeof Building2 }[] = [
  { key: "general", label: "Team Details", icon: Building2 },
  { key: "members", label: "Manage Team Users", icon: Users },
  { key: "credits", label: "Credits and Usage", icon: Coins },
  { key: "billing", label: "Plans and Billing", icon: CreditCard },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function UsageBar({
  label,
  right,
  pct,
  tone = "#ff7955",
  note,
}: {
  label: string;
  right: string;
  pct: number;
  tone?: string;
  note?: string;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-[13px]">
        <span className="font-semibold text-[#3b3442]">{label}</span>
        <span className="text-[#7b7480]">{right}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#f1eff3]">
        <div className="h-full rounded-full transition-[width]" style={{ width: `${Math.min(100, Math.round(pct * 100))}%`, background: tone }} />
      </div>
      {note && <p className="mt-1.5 text-[11px] text-[#9a94a0]">{note}</p>}
    </div>
  );
}

/* ============================ General ============================ */

function GeneralTab() {
  const { team, role, isPersonal, members, renameTeam, deleteTeam, leaveTeam, transferOwnership, hasActiveSubscription, paymentMethod, openSettings } = useTeam();
  const [name, setName] = useState(team.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [confirmTransfer, setConfirmTransfer] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const canEdit = !isPersonal && (role === "owner" || role === "admin");
  const transferTarget = members.find((m) => m.id === transferTo);

  useEffect(() => {
    setName(team.name);
    setConfirmDelete(false);
    setDeleteInput("");
    setTransferTo("");
    setConfirmTransfer(false);
    setConfirmLeave(false);
  }, [team.id, team.name]);

  return (
    <div className="space-y-8">
      <section>
        {/* 头像 + 名称输入并排:头像高度与输入框一致(44px),底对齐即精确对齐 */}
        <div className="flex items-end gap-4">
          <TeamAvatar team={team} size={44} />
          <label className="min-w-0 flex-1 block">
            <span className="text-[12px] text-[#9a94a0]">Team name</span>
            <input
              value={name}
              disabled={!canEdit}
              onChange={(event) => setName(event.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-[#ececf1] bg-white px-3.5 text-[14px] text-[#28222e] outline-none transition focus:border-[#ff5e1a] disabled:bg-[#faf9fb] disabled:text-[#8a8490]"
            />
          </label>
        </div>

        {isPersonal ? (
          <p className="mt-4 rounded-xl border border-[#ececf1] bg-[#faf9fb] px-4 py-3 text-[13px] text-[#7b7480]">
            This is your personal space. It can&apos;t be renamed, shared, or deleted.
          </p>
        ) : canEdit ? (
          <button
            type="button"
            onClick={() => renameTeam(name.trim() || team.name)}
            disabled={name.trim() === team.name || !name.trim()}
            className="mt-5 rounded-xl bg-[#24202a] px-4 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#3b3442] disabled:cursor-not-allowed disabled:opacity-35"
          >
            Save changes
          </button>
        ) : (
          <p className="mt-4 text-[13px] text-[#8a8490]">Only owners and admins can edit team details.</p>
        )}
      </section>

      {!isPersonal && role === "owner" && (
        <section className="rounded-2xl border border-[#f2d5cd] bg-[#fffaf8] p-5">
          <h3 className="flex items-center gap-2 text-[15px] font-bold text-[#b23a1c]">
            <AlertTriangle className="size-4" />
            Danger zone
          </h3>

          <div className="mt-4 border-b border-[#f5e2dc] pb-5">
            <div className="flex flex-wrap items-end gap-3">
              <label className="min-w-[220px] flex-1">
                <span className="text-[13px] font-semibold text-[#3b3442]">Transfer ownership</span>
                <select
                  value={transferTo}
                  onChange={(event) => {
                    setTransferTo(event.target.value);
                    setConfirmTransfer(false);
                  }}
                  className="mt-2 h-10 w-full rounded-xl border border-[#ececf1] bg-white px-3 text-[13px] text-[#28222e] outline-none focus:border-[#ff5e1a]"
                >
                  <option value="">Select a member…</option>
                  {members
                    .filter((m) => m.status === "active" && m.id !== CURRENT_USER_ID && m.role !== "finance")
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                </select>
              </label>
              <button
                type="button"
                disabled={!transferTo}
                onClick={() => setConfirmTransfer(true)}
                className="h-10 rounded-xl border border-[#e0a08e] bg-white px-4 text-[13px] font-bold text-[#b23a1c] transition hover:bg-[#fff1ec] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Transfer
              </button>
            </div>
            {confirmTransfer && transferTarget && (
              <div className="mt-3 rounded-xl border border-[#e0a08e] bg-white p-3.5">
                <p className="text-[13px] leading-relaxed text-[#3b3442]">
                  Make <span className="font-bold">{transferTarget.name}</span> the owner of {team.name}? You&apos;ll be
                  downgraded to Admin and lose access to billing.
                </p>
                {paymentMethod && (
                  <p className="mt-2.5 flex items-start gap-2 rounded-lg bg-[#fff3ec] px-3 py-2.5 text-[12px] font-semibold leading-snug text-[#b23a1c]">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                    The {paymentMethod.brand} ending {paymentMethod.last4}{" "}
                    and the auto top-up settings stay on this team — update them first if the card is yours, or you&apos;ll keep being charged.
                  </p>
                )}
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      transferOwnership(transferTo);
                      setTransferTo("");
                      setConfirmTransfer(false);
                    }}
                    className="h-9 rounded-lg bg-[#c9432a] px-3 text-[12px] font-bold text-white transition hover:bg-[#b23a1c]"
                  >
                    Yes, transfer ownership
                  </button>
                  <button type="button" onClick={() => setConfirmTransfer(false)} className="h-9 px-2 text-[12px] font-semibold text-[#8a8490] hover:text-[#56505c]">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-5">
            <p className="text-[13px] font-semibold text-[#3b3442]">Delete this team</p>
            <p className="mt-1 text-[12px] text-[#8a8490]">
              Team projects and any remaining credits are removed for everyone. This can&apos;t be undone.
            </p>
            {hasActiveSubscription ? (
              <div className="mt-3 rounded-xl border border-[#e0a08e] bg-white px-3.5 py-3">
                <p className="text-[12px] font-semibold leading-snug text-[#b23a1c]">Cancel your plan before deleting this team.</p>
                <p className="mt-1 text-[12px] leading-snug text-[#8a8490]">
                  {team.name} is on a paid plan. Cancel it in Billing, then come back to delete the team.
                </p>
                <button
                  type="button"
                  onClick={() => openSettings("billing")}
                  className="mt-2.5 text-[12px] font-bold text-[#ee6545] underline underline-offset-2 hover:text-[#b23a1c]"
                >
                  Go to Billing
                </button>
              </div>
            ) : confirmDelete ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <p className="w-full text-[12px] leading-relaxed text-[#8a8490]">
                  You&apos;ll lose {formatNumber(team.topupRemaining)} top-up credits, {members.length} member
                  {members.length === 1 ? "" : "s"}, and every project published to this team.
                </p>
                <input
                  value={deleteInput}
                  onChange={(event) => setDeleteInput(event.target.value)}
                  placeholder={`Type "${team.name}" to confirm`}
                  className="h-10 w-full max-w-[280px] rounded-xl border border-[#e0a08e] bg-white px-3 text-[13px] outline-none focus:border-[#e35b3d]"
                />
                <button
                  type="button"
                  disabled={deleteInput !== team.name}
                  onClick={deleteTeam}
                  className="h-10 rounded-xl bg-[#c9432a] px-4 text-[13px] font-bold text-white transition hover:bg-[#b23a1c] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Delete team
                </button>
                <button type="button" onClick={() => setConfirmDelete(false)} className="h-10 px-2 text-[13px] font-semibold text-[#8a8490] hover:text-[#56505c]">
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="mt-3 h-10 rounded-xl border border-[#e0a08e] bg-white px-4 text-[13px] font-bold text-[#b23a1c] transition hover:bg-[#fff1ec]"
              >
                Delete team
              </button>
            )}
          </div>
        </section>
      )}

      {!isPersonal && role !== "owner" && (
        <section className="rounded-2xl border border-[#ececf1] bg-[#faf9fb] p-5">
          <h3 className="text-[15px] font-bold text-[#28222e]">Leave team</h3>
          <p className="mt-1 text-[12px] text-[#8a8490]">
            You&apos;ll lose access to {team.name} and its team projects. Anything you published stays with the team.
          </p>
          {confirmLeave ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[13px] font-semibold text-[#3b3442]">Leave {team.name}?</span>
              <button type="button" onClick={leaveTeam} className="h-10 rounded-xl bg-[#c9432a] px-4 text-[13px] font-bold text-white transition hover:bg-[#b23a1c]">
                Yes, leave
              </button>
              <button type="button" onClick={() => setConfirmLeave(false)} className="h-10 px-2 text-[13px] font-semibold text-[#8a8490] hover:text-[#56505c]">
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmLeave(true)}
              className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl border border-[#ddd7df] bg-white px-4 text-[13px] font-bold text-[#56505c] transition hover:border-[#e0a08e] hover:text-[#b23a1c]"
            >
              <LogOut className="size-4" />
              Leave team
            </button>
          )}
        </section>
      )}

      {!isPersonal && role === "owner" && (
        <p className="text-[12px] text-[#9a94a0]">Owners can&apos;t leave a team. Transfer ownership first, then leave from this page.</p>
      )}
    </div>
  );
}

/* ============================ Members ============================ */

function LimitDialog({ member, onClose }: { member: Member; onClose: () => void }) {
  const { setMemberLimit, nextBill, pool } = useTeam();
  const [mode, setMode] = useState<"none" | "soft" | "hard">(member.limit ? member.limit.mode : "none");
  const [credits, setCredits] = useState(String(member.limit?.credits ?? 5000));
  const value = Number(credits.replace(/[^\d]/g, "")) || 0;

  return (
    <div className="fixed inset-x-0 bottom-0 top-[52px] z-[95] grid place-items-center bg-[#1a1a2e]/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Monthly limit">
      <div className="w-full max-w-[460px] rounded-[24px] border border-[#ececf1] bg-white p-6 shadow-[0_30px_80px_rgba(26,26,46,0.28)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[18px] font-bold tracking-[-0.02em] text-[#28222e]">Monthly limit</h2>
            <p className="mt-1 text-[13px] text-[#8a8490]">
              For {member.name}. Used {formatNumber(member.usedThisCycle)} of the team pool this cycle.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-9 shrink-0 place-items-center rounded-xl text-[#8a8490] transition hover:bg-[#f6f4f7] hover:text-[#28222e]">
            <X className="size-[18px]" />
          </button>
        </div>

        <div className="mt-5 grid gap-2.5">
          {(
            [
              { key: "none" as const, title: "No limit", body: "Can use the whole team pool." },
              { key: "soft" as const, title: "Soft cap", body: "Warn at the cap, but let them keep creating." },
              { key: "hard" as const, title: "Hard cap", body: "Block new work once the cap is reached." },
            ]
          ).map((option) => {
            const active = mode === option.key;
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => setMode(option.key)}
                className={`flex items-start gap-3 rounded-2xl border p-3.5 text-left transition ${
                  active ? "border-[#ff5e1a] bg-[#fff8f4]" : "border-[#ececf1] bg-white hover:border-[#ddd7df]"
                }`}
              >
                <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 ${active ? "border-[#ff5e1a] bg-[#ff5e1a] text-white" : "border-[#d8d4dc]"}`}>
                  {active && <Check className="size-3" strokeWidth={3} />}
                </span>
                <span>
                  <span className="block text-[14px] font-bold text-[#28222e]">{option.title}</span>
                  <span className="mt-0.5 block text-[12px] text-[#8a8490]">{option.body}</span>
                </span>
              </button>
            );
          })}
        </div>

        {mode !== "none" && (
          <label className="mt-4 block">
            <span className="text-[13px] font-semibold text-[#3b3442]">Credits per cycle</span>
            <input
              value={credits}
              onChange={(event) => setCredits(event.target.value)}
              inputMode="numeric"
              className="mt-2 h-11 w-full rounded-xl border border-[#ececf1] bg-white px-3.5 text-[14px] text-[#28222e] outline-none transition focus:border-[#ff5e1a]"
            />
            <span className="mt-1.5 block text-[11px] text-[#9a94a0]">
              Resets on your billing date ({nextBill}). The team pool is {formatNumber(pool.subTotal)} credits per cycle.
            </span>
          </label>
        )}

        <div className="mt-5 flex justify-end gap-2.5">
          <button type="button" onClick={onClose} className="h-11 rounded-xl px-4 text-[13px] font-semibold text-[#8a8490] transition hover:text-[#56505c]">
            Cancel
          </button>
          <button
            type="button"
            disabled={mode !== "none" && value <= 0}
            onClick={() => {
              setMemberLimit(member.id, mode === "none" ? null : { credits: value, mode });
              onClose();
            }}
            className="h-11 rounded-xl bg-[#24202a] px-5 text-[13px] font-bold text-white transition hover:bg-[#3b3442] disabled:cursor-not-allowed disabled:opacity-35"
          >
            Save limit
          </button>
        </div>
      </div>
    </div>
  );
}

/** 用量区:上限标签 + 已用/总量 + 进度条 + 编辑入口(对齐参考稿) */
function UsageCell({ member, onEdit }: { member: Member; onEdit: () => void }) {
  const { role } = useTeam();
  const canManage = role === "owner" || role === "admin";

  if (member.role === "finance") {
    return <p className="text-[12px] text-[#c3bcc8]">No product usage</p>;
  }
  if (member.status !== "active") {
    return <p className="text-[12px] text-[#c3bcc8]">Not joined yet</p>;
  }

  const capped = Boolean(member.limit);
  const pct = member.limit ? Math.min(1, member.usedThisCycle / member.limit.credits) : 1;
  const tone = !capped ? "#5b6cff" : pct >= 1 ? "#e35b3d" : pct >= 0.8 ? "#e07a3a" : "#12a594";

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className={`text-[12px] font-semibold ${capped ? "text-[#3b3442]" : "text-[#5b6cff]"}`}>
          {capped ? `${formatNumber(member.usedThisCycle)} / ${formatNumber(member.limit!.credits)}` : "No limit"}
        </span>
        <span className="flex items-center gap-1.5">
          {capped ? (
            <span className="text-[11px] font-medium uppercase tracking-wide text-[#9a94a0]">{member.limit!.mode}</span>
          ) : (
            <InfinityIcon className="size-4 text-[#5b6cff]" />
          )}
          {canManage && (
            <button
              type="button"
              onClick={onEdit}
              aria-label={`Edit monthly limit for ${member.name}`}
              title="Edit monthly limit"
              className="grid size-6 place-items-center rounded-md text-[#9a94a0] transition hover:bg-[#f6f4f7] hover:text-[#3b3442]"
            >
              <Pencil className="size-3.5" />
            </button>
          )}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#f1eff3]">
        <div className="h-full rounded-full" style={{ width: `${Math.round(pct * 100)}%`, background: tone }} />
      </div>
      <p className="mt-1 text-[11px] text-[#9a94a0]">
        {capped ? `${formatNumber(member.usedThisCycle)} used this cycle` : `${formatNumber(member.usedThisCycle)} used · whole pool available`}
      </p>
    </div>
  );
}

function MemberRow({ member, onEditLimit }: { member: Member; onEditLimit: () => void }) {
  const { role, changeMemberRole, removeMember, revokeInvite, resendInvite } = useTeam();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const canManage = role === "owner" || role === "admin";
  const isOwnerRow = member.role === "owner";
  const canEditRole = canManage && !isOwnerRow;
  // 只有 Owner 能授予/收回 Finance —— Admin 自己没有账单权限,不能借此提权
  const roleOptions: Role[] = role === "owner" ? ["owner", "admin", "finance", "member"] : ["admin", "member"];
  const isInvite = member.status !== "active";

  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest("[data-member-menu]")) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-[#ececf1] bg-white px-4 py-3.5">
      {/* Member info */}
      <div className="flex min-w-[200px] flex-1 items-center gap-3">
        <span className="relative shrink-0">
          <span className="grid size-10 place-items-center rounded-full text-[13px] font-bold text-white" style={{ background: member.color }}>
            {isInvite ? "?" : member.name.trim()[0]?.toUpperCase()}
          </span>
          {isOwnerRow && (
            <span className="absolute -right-0.5 -top-1 grid size-4 place-items-center rounded-full bg-white shadow-[0_1px_3px_rgba(26,26,46,0.2)]">
              <Crown className="size-2.5 text-[#f0a020]" />
            </span>
          )}
        </span>
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-1.5 truncate text-[13px] font-semibold text-[#28222e]">
            {isInvite ? member.email : member.name}
            {member.id === CURRENT_USER_ID && <span className="font-bold text-[#ee6545]">(You)</span>}
            {member.status === "invited" && (
              <span className="rounded-md bg-[#fff3ec] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#e07a3a]">Pending</span>
            )}
            {member.status === "expired" && (
              <span className="rounded-md bg-[#f2f0f4] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#8a8490]">Expired</span>
            )}
            {member.role === "finance" && (
              <span className="rounded-md bg-[#eef0ff] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#5b6cff]">No seat</span>
            )}
          </p>
          {!isInvite && <p className="truncate text-[12px] text-[#7b7480]">{member.email}</p>}
          <p className="truncate text-[11px] text-[#a8a2ae]">
            {member.status === "active" ? `Joined at ${member.joinedAt}` : member.status === "invited" ? `Invited ${member.joinedAt}` : `Expired ${member.joinedAt}`}
          </p>
        </div>
      </div>

      {/* Usage / Total */}
      <div className="w-full min-w-[180px] sm:w-[190px] sm:shrink-0">
        <UsageCell member={member} onEdit={onEditLimit} />
      </div>

      {/* Role */}
      <div className="w-[128px] shrink-0">
        {canEditRole ? (
          <select
            value={member.role}
            onChange={(event) => changeMemberRole(member.id, event.target.value as Role)}
            className="h-9 w-full rounded-lg border border-[#ececf1] bg-white px-2 text-[13px] font-semibold text-[#3b3442] outline-none transition focus:border-[#ff5e1a]"
          >
            {roleOptions.map((option) => (
              <option key={option} value={option}>
                {ROLE_LABEL[option]}
              </option>
            ))}
          </select>
        ) : (
          <span className="inline-flex h-9 items-center rounded-lg bg-[#faf9fb] px-2.5 text-[13px] font-semibold text-[#8a8490]">
            {ROLE_LABEL[member.role]}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="ml-auto flex w-[86px] shrink-0 justify-end">
        {isInvite ? (
          canManage ? (
            <span className="inline-flex gap-2">
              <button type="button" onClick={() => resendInvite(member.id)} className="text-[12px] font-bold text-[#ee6545] hover:underline">
                Resend
              </button>
              <button type="button" onClick={() => revokeInvite(member.id)} className="text-[12px] font-bold text-[#8a8490] hover:underline">
                Revoke
              </button>
            </span>
          ) : null
        ) : canManage && !isOwnerRow && member.id !== CURRENT_USER_ID ? (
          <div className="relative inline-block" data-member-menu>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={`Actions for ${member.name}`}
              className="grid size-8 place-items-center rounded-lg text-[#8a8490] transition hover:bg-[#f6f4f7] hover:text-[#3b3442]"
            >
              <MoreHorizontal className="size-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-[calc(100%+4px)] z-30 w-[230px] rounded-xl border border-[#ececf1] bg-white p-1.5 text-left shadow-[0_14px_32px_rgba(26,26,46,0.14)]">
                {confirmRemove ? (
                  <div className="p-2">
                    <p className="text-[12px] leading-snug text-[#56505c]">
                      Remove {member.name} from this team? They&apos;ll get an email letting them know.
                    </p>
                    <div className="mt-2.5 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          removeMember(member.id);
                          setMenuOpen(false);
                        }}
                        className="rounded-lg bg-[#c9432a] px-2.5 py-1.5 text-[12px] font-bold text-white"
                      >
                        Remove
                      </button>
                      <button type="button" onClick={() => setConfirmRemove(false)} className="px-1.5 text-[12px] font-semibold text-[#8a8490]">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmRemove(true)}
                    className="block w-full rounded-lg px-2.5 py-2 text-left text-[13px] font-semibold text-[#c9432a] transition hover:bg-[#fff1ec]"
                  >
                    Remove from team
                  </button>
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function FinanceInviteModal({ onClose }: { onClose: () => void }) {
  const { team, inviteFinance } = useTeam();
  const [email, setEmail] = useState("");
  const valid = EMAIL_RE.test(email.trim());

  return (
    <div className="fixed inset-x-0 bottom-0 top-[52px] z-[95] grid place-items-center bg-[#1a1a2e]/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Invite billing contact">
      <div className="w-full max-w-[480px] rounded-[24px] border border-[#ececf1] bg-white p-6 shadow-[0_30px_80px_rgba(26,26,46,0.28)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[18px] font-bold tracking-[-0.02em] text-[#28222e]">Invite a billing contact</h2>
            <p className="mt-1 text-[13px] leading-snug text-[#8a8490]">
              They&apos;ll manage invoices, the payment method, and auto top-up for {team.name} — no product access, and no seat used.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-9 shrink-0 place-items-center rounded-xl text-[#8a8490] transition hover:bg-[#f6f4f7] hover:text-[#28222e]">
            <X className="size-[18px]" />
          </button>
        </div>

        <label className="mt-5 block">
          <span className="text-[13px] font-semibold text-[#3b3442]">Email address</span>
          <input
            value={email}
            autoFocus
            onChange={(event) => setEmail(event.target.value)}
            placeholder="finance@company.com"
            className="mt-2 h-11 w-full rounded-xl border border-[#ececf1] bg-white px-3.5 text-[14px] text-[#28222e] outline-none transition focus:border-[#ff5e1a] placeholder:text-[#9a9bb0]"
          />
        </label>

        <p className="mt-4 rounded-xl bg-[#faf9fb] px-3.5 py-3 text-[12px] leading-snug text-[#7b7480]">
          Only need invoices delivered somewhere? Add a <span className="font-semibold text-[#3b3442]">billing contact email</span> in
          Billing instead — that needs no account at all.
        </p>

        <div className="mt-5 flex justify-end gap-2.5">
          <button type="button" onClick={onClose} className="h-11 rounded-xl px-4 text-[13px] font-semibold text-[#8a8490] transition hover:text-[#56505c]">
            Cancel
          </button>
          <button
            type="button"
            disabled={!valid}
            onClick={() => {
              inviteFinance(email.trim());
              onClose();
            }}
            className="h-11 rounded-xl bg-[#24202a] px-5 text-[13px] font-bold text-white transition hover:bg-[#3b3442] disabled:cursor-not-allowed disabled:opacity-35"
          >
            Send billing invite
          </button>
        </div>
      </div>
    </div>
  );
}

/** People & Seats 顶部概览卡:套餐 / 席位 / 账单 / 用量 / 充值余额 / 充值入口 */
function SeatsOverviewCard({ financeCount }: { financeCount: number }) {
  const { plan, nextBill, pool, seatsUsed, seatsTotal, seatsFull, role, team, openSettings } = useTeam();
  const available = Math.max(0, seatsTotal - seatsUsed);
  const canBill = role === "owner" || role === "finance";
  const cell = "px-5 py-4";

  return (
    <div className="overflow-hidden rounded-2xl border border-[#ececf1] bg-white">
      <div className="grid divide-y divide-[#f0eef2] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className={cell}>
          <p className="text-[12px] text-[#9a94a0]">Plan</p>
          <p className="mt-1.5 text-[14px] font-bold text-[#28222e]">
            {plan.name} · {seatsTotal} {seatsTotal === 1 ? "seat" : "seats"}
          </p>
          <p className="mt-0.5 text-[12px] text-[#8a8490]">{plan.price}</p>
          {role === "owner" && (
            <button
              type="button"
              onClick={() => openSettings("billing")}
              className="mt-3 h-8 rounded-lg bg-[#fff3ec] px-3 text-[12px] font-bold text-[#ff5e1a] transition hover:bg-[#ffe7d6]"
            >
              Upgrade
            </button>
          )}
        </div>

        <div className={cell}>
          <p className="text-[12px] text-[#9a94a0]">Paid seats</p>
          <p className="mt-1.5 text-[14px] font-bold text-[#28222e]">
            {seatsUsed} / {seatsTotal} <span className="text-[12px] font-medium text-[#8a8490]">occupied</span>
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#f1eff3]">
            <div
              className="h-full rounded-full transition-[width]"
              style={{ width: `${Math.min(100, Math.round((seatsUsed / Math.max(1, seatsTotal)) * 100))}%`, background: seatsFull ? "#e35b3d" : "#ff7955" }}
            />
          </div>
          <p className="mt-1.5 text-[11px] leading-snug text-[#9a94a0]">
            {available} available. Pending invites hold a seat; expired ones don&apos;t.
            {financeCount > 0 &&
              ` ${financeCount} ${financeCount === 1 ? "billing contact uses" : "billing contacts use"} no seat.`}
          </p>
        </div>

        <div className={cell}>
          <p className="text-[12px] text-[#9a94a0]">Next billing</p>
          <p className="mt-1.5 text-[14px] font-bold text-[#28222e]">{nextBill}</p>
          {canBill && (
            <button
              type="button"
              onClick={() => openSettings("billing")}
              className="mt-3 h-8 rounded-lg border border-[#ececf1] px-3 text-[12px] font-bold text-[#3b3442] transition hover:bg-[#faf9fb]"
            >
              Manage &amp; invoices
            </button>
          )}
        </div>
      </div>

      <div className="grid divide-y divide-[#f0eef2] border-t border-[#f0eef2] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className={cell}>
          <p className="text-[12px] text-[#9a94a0]">Usage this period</p>
          <p className="mt-1.5 text-[14px] font-bold text-[#28222e]">
            {formatNumber(pool.subUsed)} <span className="text-[12px] font-medium text-[#8a8490]">/ {formatNumber(pool.subTotal)} credits</span>
          </p>
          <p className="mt-0.5 text-[11px] text-[#9a94a0]">Subscription credits · resets {nextBill}</p>
        </div>

        <div className={cell}>
          <p className="text-[12px] text-[#9a94a0]">Top-up balance</p>
          <p className="mt-1.5 text-[14px] font-bold text-[#28222e]">{formatNumber(pool.topupRemaining)} credits</p>
          <p className="mt-0.5 text-[11px] text-[#9a94a0]">
            {pool.topupRemaining > 0 ? `Rolls over · expires ${team.topupExpires}` : "Rolls over for 12 months"}
          </p>
        </div>

        <div className={cell}>
          <p className="text-[12px] text-[#9a94a0]">Top up</p>
          {canBill ? (
            <>
              <p className="mt-1.5 text-[12px] leading-snug text-[#8a8490]">Add credits without changing the plan.</p>
              <button
                type="button"
                onClick={() => openSettings("billing")}
                className="mt-3 h-8 rounded-lg bg-[#24202a] px-3 text-[12px] font-bold text-white transition hover:bg-[#3b3442]"
              >
                Buy credits
              </button>
            </>
          ) : (
            <p className="mt-1.5 text-[12px] leading-snug text-[#8a8490]">Only the owner and billing contacts can buy credits.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function MembersTab() {
  const { members, role, seatsUsed, seatsTotal, seatsFull, openSettings, nextBill } = useTeam();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "invited">("all");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [financeInviteOpen, setFinanceInviteOpen] = useState(false);
  const [limitFor, setLimitFor] = useState<Member | null>(null);
  const [usageSort, setUsageSort] = useState<null | "asc" | "desc">(null);
  const canManage = role === "owner" || role === "admin";

  const visible = useMemo(
    () =>
      members.filter((m) => {
        const q = query.trim().toLowerCase();
        if (q && !m.name.toLowerCase().includes(q) && !m.email.toLowerCase().includes(q)) return false;
        if (roleFilter !== "all" && m.role !== roleFilter) return false;
        if (statusFilter === "active" && m.status !== "active") return false;
        if (statusFilter === "invited" && m.status === "active") return false;
        return true;
      }),
    [members, query, roleFilter, statusFilter],
  );

  const sorted = useMemo(() => {
    if (!usageSort) return visible;
    return [...visible].sort((a, b) =>
      usageSort === "desc" ? b.usedThisCycle - a.usedThisCycle : a.usedThisCycle - b.usedThisCycle,
    );
  }, [visible, usageSort]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2.5">
        <label className="flex h-10 min-w-[180px] flex-1 items-center gap-2 rounded-xl border border-[#ececf1] bg-white px-3 text-sm transition focus-within:border-[#ff5e1a]">
          <Search className="size-4 shrink-0 text-[#9a9bb0]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search members"
            className="w-full bg-transparent text-[#1a1a2e] outline-none placeholder:text-[#9a9bb0]"
          />
        </label>
        <select
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value as "all" | Role)}
          className="h-10 rounded-xl border border-[#ececf1] bg-white px-3 text-[13px] font-semibold text-[#3b3442] outline-none focus:border-[#ff5e1a]"
        >
          <option value="all">All roles</option>
          <option value="owner">Owner</option>
          <option value="admin">Admin</option>
          <option value="finance">Finance</option>
          <option value="member">Member</option>
        </select>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as "all" | "active" | "invited")}
          className="h-10 rounded-xl border border-[#ececf1] bg-white px-3 text-[13px] font-semibold text-[#3b3442] outline-none focus:border-[#ff5e1a]"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="invited">Invited</option>
        </select>
        {canManage && (
          <>
            <button
              type="button"
              disabled={seatsFull}
              onClick={() => setInviteOpen(true)}
              className="h-10 shrink-0 rounded-xl bg-[#24202a] px-4 text-[13px] font-bold text-white transition hover:bg-[#3b3442] disabled:cursor-not-allowed disabled:opacity-35"
            >
              Invite members
            </button>
            {role === "owner" && (
              <button
                type="button"
                onClick={() => setFinanceInviteOpen(true)}
                className="h-10 shrink-0 rounded-xl border border-[#ececf1] px-4 text-[13px] font-bold text-[#3b3442] transition hover:border-[#ddd7df] hover:bg-[#faf9fb]"
              >
                Invite billing contact
              </button>
            )}
          </>
        )}
      </div>

      {canManage && seatsFull && (
        <p className="flex flex-wrap items-center gap-2 text-[12px] font-semibold text-[#c9432a]">
          All seats are in use.
          {role === "owner" ? (
            <button type="button" onClick={() => openSettings("billing")} className="underline underline-offset-2 hover:text-[#b23a1c]">
              Add seats
            </button>
          ) : (
            <span className="font-normal text-[#8a8490]">Ask your owner to add seats.</span>
          )}
        </p>
      )}

      {!canManage && (
        <p className="rounded-xl border border-[#ececf1] bg-[#faf9fb] px-4 py-3 text-[13px] text-[#7b7480]">
          Only owners and admins can invite, remove, change roles, or set limits.
        </p>
      )}

      {/* 列标签放在卡片外,每位成员一张独立卡片 */}
      <div>
        <div className="flex flex-wrap items-center gap-4 px-4 pb-2 text-[11px] text-[#9a94a0]">
          <span className="min-w-[200px] flex-1">Member info</span>
          <button
            type="button"
            onClick={() => setUsageSort((current) => (current === "desc" ? "asc" : current === "asc" ? null : "desc"))}
            className="flex w-full items-center gap-1 text-left transition hover:text-[#56505c] sm:w-[190px] sm:shrink-0"
          >
            Usage / Limit
            <ArrowUpDown className={`size-3 ${usageSort ? "text-[#ee6545]" : "text-[#c3bcc8]"}`} />
          </button>
          <span className="w-[128px] shrink-0">Role</span>
          <span className="w-[86px] shrink-0" />
        </div>

        {sorted.length > 0 ? (
          <div className="space-y-2">
            {sorted.map((member) => (
              <MemberRow key={member.id} member={member} onEditLimit={() => setLimitFor(member)} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#ddd7df] bg-white px-4 py-12 text-center text-[13px] text-[#8a8490]">
            No members match your filters.
          </div>
        )}
      </div>
      <p className="text-[11px] text-[#9a94a0]">Usage and limits reset on your billing date ({nextBill}).</p>

      {inviteOpen && <InviteModal onClose={() => setInviteOpen(false)} onAddSeats={() => openSettings("billing")} />}
      {financeInviteOpen && <FinanceInviteModal onClose={() => setFinanceInviteOpen(false)} />}
      {limitFor && <LimitDialog member={limitFor} onClose={() => setLimitFor(null)} />}
    </div>
  );
}

/* ============================ Billing ============================ */

function PlanModal({ onClose }: { onClose: () => void }) {
  const { team, plan, seatsUsed, changePlan } = useTeam();
  const [picked, setPicked] = useState<PlanId>(plan.id);
  const target = PLANS.find((p) => p.id === picked)!;
  const tooSmall = target.seatsTotal < seatsUsed;

  return (
    <div className="fixed inset-x-0 bottom-0 top-[52px] z-[95] grid place-items-center bg-[#1a1a2e]/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Change plan">
      <div className="max-h-full w-full max-w-[620px] overflow-y-auto rounded-[24px] border border-[#ececf1] bg-white p-6 shadow-[0_30px_80px_rgba(26,26,46,0.28)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[18px] font-bold tracking-[-0.02em] text-[#28222e]">Change plan</h2>
            <p className="mt-1 text-[13px] text-[#8a8490]">Billed monthly for {team.name}. Change or cancel any time.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-9 shrink-0 place-items-center rounded-xl text-[#8a8490] transition hover:bg-[#f6f4f7] hover:text-[#28222e]">
            <X className="size-[18px]" />
          </button>
        </div>

        <div className="mt-5 grid gap-2.5">
          {PLANS.filter((p) => p.id !== "starter").map((option) => {
            const active = picked === option.id;
            const current = plan.id === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setPicked(option.id)}
                className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
                  active ? "border-[#ff5e1a] bg-[#fff8f4]" : "border-[#ececf1] bg-white hover:border-[#ddd7df]"
                }`}
              >
                <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 ${active ? "border-[#ff5e1a] bg-[#ff5e1a] text-white" : "border-[#d8d4dc]"}`}>
                  {active && <Check className="size-3" strokeWidth={3} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline gap-2">
                    <span className="text-[15px] font-bold text-[#28222e]">{option.name}</span>
                    <span className="text-[13px] font-semibold text-[#7b7480]">{option.price}</span>
                    {current && <span className="rounded-md bg-[#f1eff3] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#7b7480]">Current</span>}
                  </span>
                  <span className="mt-1 block text-[12px] text-[#8a8490]">{option.blurb}</span>
                  <span className="mt-2 block text-[12px] font-semibold text-[#56505c]">
                    {option.seatsTotal} seats · {formatNumber(option.creditsTotal)} credits / cycle · {formatTokens(option.aiTokensTotal)} AI tokens
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {tooSmall && (
          <p className="mt-4 rounded-xl border border-[#f2d5cd] bg-[#fff5f1] px-4 py-3 text-[12px] font-semibold text-[#b23a1c]">
            {target.name} includes {target.seatsTotal} seats but your team uses {seatsUsed}. Remove members first, or pick a larger plan.
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2.5">
          <button type="button" onClick={onClose} className="h-11 rounded-xl px-4 text-[13px] font-semibold text-[#8a8490] transition hover:text-[#56505c]">
            Cancel
          </button>
          <button
            type="button"
            disabled={picked === plan.id || tooSmall}
            onClick={() => {
              changePlan(picked);
              onClose();
            }}
            className="h-11 rounded-xl bg-[#24202a] px-5 text-[13px] font-bold text-white transition hover:bg-[#3b3442] disabled:cursor-not-allowed disabled:opacity-35"
          >
            {target.priceValue > plan.priceValue ? `Upgrade to ${target.name}` : `Switch to ${target.name}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function CreditsModal({ onClose }: { onClose: () => void }) {
  const { team, buyCredits } = useTeam();
  const [picked, setPicked] = useState(CREDIT_PACKS[1]!.credits);

  return (
    <div className="fixed inset-x-0 bottom-0 top-[52px] z-[95] grid place-items-center bg-[#1a1a2e]/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Buy credits">
      <div className="w-full max-w-[480px] rounded-[24px] border border-[#ececf1] bg-white p-6 shadow-[0_30px_80px_rgba(26,26,46,0.28)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[18px] font-bold tracking-[-0.02em] text-[#28222e]">Buy credits</h2>
            <p className="mt-1 text-[13px] text-[#8a8490]">Top-up credits for {team.name}. They roll over and expire after 12 months.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-9 shrink-0 place-items-center rounded-xl text-[#8a8490] transition hover:bg-[#f6f4f7] hover:text-[#28222e]">
            <X className="size-[18px]" />
          </button>
        </div>

        <div className="mt-5 grid gap-2.5">
          {CREDIT_PACKS.map((pack) => {
            const active = picked === pack.credits;
            return (
              <button
                key={pack.credits}
                type="button"
                onClick={() => setPicked(pack.credits)}
                className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-left transition ${
                  active ? "border-[#ff5e1a] bg-[#fff8f4]" : "border-[#ececf1] bg-white hover:border-[#ddd7df]"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${active ? "border-[#ff5e1a] bg-[#ff5e1a] text-white" : "border-[#d8d4dc]"}`}>
                    {active && <Check className="size-3" strokeWidth={3} />}
                  </span>
                  <span className="text-[15px] font-bold text-[#28222e]">{formatNumber(pack.credits)} credits</span>
                </span>
                <span className="text-[14px] font-bold text-[#56505c]">{pack.price}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex justify-end gap-2.5">
          <button type="button" onClick={onClose} className="h-11 rounded-xl px-4 text-[13px] font-semibold text-[#8a8490] transition hover:text-[#56505c]">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              buyCredits(picked);
              onClose();
            }}
            className="h-11 rounded-xl bg-[#24202a] px-5 text-[13px] font-bold text-white transition hover:bg-[#3b3442]"
          >
            Buy {formatNumber(picked)} credits
          </button>
        </div>
      </div>
    </div>
  );
}

function AutoTopUpCard() {
  const { team, role, updateAutoTopUp, retryAutoTopUp, showToast } = useTeam();
  const auto = team.autoTopUp;
  const canEdit = role === "owner" || role === "finance";
  const [threshold, setThreshold] = useState(String(auto.threshold));
  const [amount, setAmount] = useState(String(auto.amount));
  const [cap, setCap] = useState(String(auto.monthlyCap));

  useEffect(() => {
    setThreshold(String(auto.threshold));
    setAmount(String(auto.amount));
    setCap(String(auto.monthlyCap));
  }, [auto.threshold, auto.amount, auto.monthlyCap]);

  const num = (v: string) => Number(v.replace(/[^\d]/g, "")) || 0;

  return (
    <section className="rounded-2xl border border-[#ececf1] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-[15px] font-bold text-[#28222e]">
            <Zap className="size-4 text-[#8a8490]" />
            Auto top-up
          </p>
          <p className="mt-1 text-[12px] text-[#8a8490]">Keeps the pool from running dry mid-campaign. Charged to the saved card.</p>
        </div>
        <button
          type="button"
          disabled={!canEdit}
          onClick={() => updateAutoTopUp({ enabled: !auto.enabled })}
          aria-pressed={auto.enabled}
          className={`h-9 rounded-xl px-3.5 text-[12px] font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
            auto.enabled ? "bg-[#fff3ec] text-[#ff5e1a]" : "border border-[#ececf1] text-[#56505c] hover:bg-[#faf9fb]"
          }`}
        >
          {auto.enabled ? "On" : "Off"}
        </button>
      </div>

      {auto.enabled && (
        <>
          {auto.status === "paused" && (
            <div className="mt-4 rounded-xl border border-[#e0a08e] bg-[#fff5f1] p-3.5">
              <p className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-[#b23a1c]">
                <AlertTriangle className="size-3.5" />
                Paused after 3 failed attempts
              </p>
              <p className="mt-1.5 text-[12px] leading-snug text-[#56505c]">{auto.failureReason}</p>
              <p className="mt-1 text-[12px] leading-snug text-[#8a8490]">
                We emailed the owner, admins, and billing contacts. Fix the card, then retry.
              </p>
              {canEdit && (
                <button
                  type="button"
                  onClick={retryAutoTopUp}
                  className="mt-2.5 inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#c9432a] px-3 text-[12px] font-bold text-white transition hover:bg-[#b23a1c]"
                >
                  <RefreshCw className="size-3.5" />
                  Retry now
                </button>
              )}
            </div>
          )}

          {auto.status === "cap-reached" && (
            <div className="mt-4 rounded-xl border border-[#f0dcc4] bg-[#fffaf2] p-3.5">
              <p className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-[#a86a1c]">
                <AlertTriangle className="size-3.5" />
                Monthly cap reached
              </p>
              <p className="mt-1.5 text-[12px] leading-snug text-[#56505c]">
                {formatNumber(auto.spentThisMonth)} of {formatNumber(auto.monthlyCap)} credits auto-recharged this month. No further
                top-ups until the next billing cycle — the card is fine.
              </p>
            </div>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {(
              [
                { label: "When pool drops below", value: threshold, set: setThreshold },
                { label: "Auto-recharge", value: amount, set: setAmount },
                { label: "Monthly cap", value: cap, set: setCap },
              ] as const
            ).map((field) => (
              <label key={field.label} className="block">
                <span className="text-[12px] font-semibold text-[#3b3442]">{field.label}</span>
                <input
                  value={field.value}
                  disabled={!canEdit}
                  inputMode="numeric"
                  onChange={(event) => field.set(event.target.value)}
                  className="mt-1.5 h-10 w-full rounded-xl border border-[#ececf1] bg-white px-3 text-[13px] tabular-nums text-[#28222e] outline-none transition focus:border-[#ff5e1a] disabled:bg-[#faf9fb] disabled:text-[#8a8490]"
                />
              </label>
            ))}
          </div>

          <p className="mt-2.5 text-[11px] leading-snug text-[#9a94a0]">
            The monthly cap is the ceiling on automatic charges — it&apos;s what makes it safe to leave auto top-up on.
            {auto.status === "active" && ` ${formatNumber(auto.spentThisMonth)} of ${formatNumber(auto.monthlyCap)} used this month.`}
          </p>

          {canEdit && (
            <button
              type="button"
              onClick={() => {
                updateAutoTopUp({ threshold: num(threshold), amount: num(amount), monthlyCap: num(cap) });
                showToast("Auto top-up updated.");
              }}
              className="mt-3.5 h-10 rounded-xl bg-[#24202a] px-4 text-[13px] font-bold text-white transition hover:bg-[#3b3442]"
            >
              Save auto top-up
            </button>
          )}
        </>
      )}

      {!canEdit && <p className="mt-3 text-[12px] text-[#8a8490]">Only the owner and billing contacts can change auto top-up.</p>}
    </section>
  );
}

function BillingContactsCard() {
  const { team, role, addBillingContact, removeBillingContact } = useTeam();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const canEdit = role === "owner" || role === "finance";

  const commit = () => {
    const value = draft.trim();
    if (!value) return;
    if (!EMAIL_RE.test(value)) {
      setError(`"${value}" isn't a valid email address.`);
      return;
    }
    addBillingContact(value);
    setDraft("");
    setError(null);
  };

  return (
    <section className="rounded-2xl border border-[#ececf1] bg-white p-5">
      <p className="flex items-center gap-2 text-[15px] font-bold text-[#28222e]">
        <Mail className="size-4 text-[#8a8490]" />
        Billing contacts
      </p>
      <p className="mt-1 text-[12px] leading-snug text-[#8a8490]">
        Invoices and quota alerts go here. No Buzz account needed, no seat used — group addresses like finance@ work fine.
      </p>

      <div className="mt-3.5 flex flex-wrap gap-1.5">
        {team.billingContacts.map((email) => (
          <span key={email} className="flex items-center gap-1 rounded-lg bg-[#f2f0f4] py-1 pl-2.5 pr-1 text-[12px] font-semibold text-[#3b3442]">
            {email}
            {canEdit && (
              <button type="button" onClick={() => removeBillingContact(email)} aria-label={`Remove ${email}`} className="grid size-4 place-items-center rounded text-[#8a8490] hover:text-[#28222e]">
                <X className="size-3" />
              </button>
            )}
          </span>
        ))}
        {team.billingContacts.length === 0 && <span className="text-[12px] text-[#9a94a0]">No billing contacts yet.</span>}
      </div>

      {canEdit && (
        <>
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
                setError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  commit();
                }
              }}
              placeholder="finance@company.com"
              className={`h-10 min-w-[200px] flex-1 rounded-xl border bg-white px-3 text-[13px] outline-none transition focus:border-[#ff5e1a] placeholder:text-[#9a9bb0] ${
                error ? "border-[#e0a08e]" : "border-[#ececf1]"
              }`}
            />
            <button
              type="button"
              onClick={commit}
              className="h-10 rounded-xl border border-[#ececf1] px-4 text-[13px] font-bold text-[#3b3442] transition hover:border-[#ddd7df] hover:bg-[#faf9fb]"
            >
              Add
            </button>
          </div>
          {error && <p className="mt-1.5 text-[12px] font-semibold text-[#c9432a]">{error}</p>}
        </>
      )}
    </section>
  );
}

function MemberUsageTable() {
  const { members, pool } = useTeam();
  const rows = members.filter((m) => m.role !== "finance" && m.status === "active").sort((a, b) => b.usedThisCycle - a.usedThisCycle);

  return (
    <section className="rounded-2xl border border-[#ececf1] bg-white p-5">
      <p className="text-[15px] font-bold text-[#28222e]">Usage by member</p>
      <p className="mt-1 text-[12px] text-[#8a8490]">Who is spending the pool this cycle.</p>
      <div className="mt-4 space-y-3.5">
        {rows.map((member) => {
          const share = pool.subUsed === 0 ? 0 : member.usedThisCycle / pool.subUsed;
          const overLimit = member.limit ? member.usedThisCycle / member.limit.credits : 0;
          return (
            <div key={member.id}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="flex items-center gap-2 text-[13px] font-semibold text-[#3b3442]">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full text-[9px] font-bold text-white" style={{ background: member.color }}>
                    {member.name.trim()[0]?.toUpperCase()}
                  </span>
                  {member.name}
                  {member.limit && (
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        overLimit >= 1 ? "bg-[#fff1ec] text-[#c9432a]" : overLimit >= 0.8 ? "bg-[#fff3ec] text-[#e07a3a]" : "bg-[#f1eff3] text-[#7b7480]"
                      }`}
                    >
                      {member.limit.mode} {formatNumber(member.limit.credits)}
                    </span>
                  )}
                </span>
                <span className="tabular-nums text-[12px] text-[#7b7480]">
                  {formatNumber(member.usedThisCycle)} · {Math.round(share * 100)}% of pool
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#f1eff3]">
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.round(share * 100))}%`, background: member.color }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}


/** Credits and Usage:概览卡 + 池用量 + 自动充值 + 按成员用量 */
function CreditsTab() {
  const { team, nextBill, role, pool, members } = useTeam();
  const [creditsOpen, setCreditsOpen] = useState(false);
  const canBill = role === "owner" || role === "finance";
  const canSeeMembers = role === "owner" || role === "admin" || role === "finance";
  const financeCount = members.filter((m) => m.role === "finance").length;

  return (
    <div className="space-y-6">
      <SeatsOverviewCard financeCount={financeCount} />

      <section className="space-y-5 rounded-2xl border border-[#ececf1] bg-white p-5">
        <h3 className="text-[15px] font-bold text-[#28222e]">Credit pool this cycle</h3>
        <UsageBar
          label="Subscription credits"
          right={`${formatNumber(pool.subUsed)} / ${formatNumber(pool.subTotal)} used`}
          pct={pool.usedPct}
          tone={pool.alert === "full" ? "#e35b3d" : pool.alert === "warn" ? "#e07a3a" : "#5b6cff"}
          note={`Resets on ${nextBill}. Unused subscription credits don't roll over.`}
        />
        <UsageBar
          label="Top-up credits"
          right={`${formatNumber(pool.topupRemaining)} left`}
          pct={pool.topupRemaining > 0 ? 1 : 0}
          tone="#12a594"
          note={team.topupRemaining > 0 ? `Rolls over. Expires ${team.topupExpires}.` : "Buy credits below — they roll over for 12 months."}
        />
        <UsageBar label="AI Tokens" right={`${formatTokens(team.aiTokens)} / ${formatTokens(team.aiTokensTotal)}`} pct={team.aiTokens / Math.max(1, team.aiTokensTotal)} />
        <p className="rounded-xl bg-[#faf9fb] px-3.5 py-3 text-[12px] leading-snug text-[#7b7480]">
          Subscription credits are spent first, then top-up credits — so nothing you paid extra for expires while monthly credits go
          unused.
        </p>
        {pool.alert && (
          <p
            className={`rounded-xl px-3.5 py-3 text-[12px] font-semibold leading-snug ${
              pool.alert === "full" ? "bg-[#fff1ec] text-[#c9432a]" : "bg-[#fff3ec] text-[#b06a1c]"
            }`}
          >
            {pool.alert === "full"
              ? "The subscription pool is used up. The owner, admins, and billing contacts were emailed."
              : "The subscription pool is over 80% used. The owner, admins, and billing contacts were emailed."}
          </p>
        )}
      </section>


      {canBill && <AutoTopUpCard />}
      {canSeeMembers && <MemberUsageTable />}

      {canBill && (
        <div>
          <button
            type="button"
            onClick={() => setCreditsOpen(true)}
            className="h-10 rounded-xl bg-[#24202a] px-4 text-[13px] font-bold text-white transition hover:bg-[#3b3442]"
          >
            Buy credits
          </button>
        </div>
      )}

      {creditsOpen && <CreditsModal onClose={() => setCreditsOpen(false)} />}
    </div>
  );
}

function BillingTab() {
  const { team, plan, nextBill, role, pool, seatsUsed, seatsTotal, addSeats, cancelPlan, paymentMethod, hasActiveSubscription, showToast } = useTeam();
  const [seatDelta, setSeatDelta] = useState(1);
  const [planOpen, setPlanOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const canSeeBilling = role === "owner" || role === "finance";
  const canBuy = role === "owner"; // 买 seats / 换套餐仍只有 Owner

  if (!canSeeBilling) {
    return (
      <div className="grid place-items-center rounded-2xl border border-dashed border-[#ddd7df] bg-[#faf9fb] px-6 py-20 text-center">
        <CreditCard className="size-7 text-[#c3bcc8]" />
        <p className="mt-3 text-[14px] font-bold text-[#3b3442]">Billing is managed by the owner and billing contacts.</p>
        <p className="mt-1.5 max-w-[380px] text-[13px] text-[#8a8490]">
          Ask them to change the plan, add seats, or top up credits for {team.name}.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#ececf1] bg-white p-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9a94a0]">Current plan</p>
          <p className="mt-1.5 text-[20px] font-bold tracking-[-0.02em] text-[#28222e]">
            {plan.name} <span className="text-[15px] font-semibold text-[#7b7480]">· {plan.price}</span>
          </p>
          <p className="mt-1 text-[13px] text-[#8a8490]">Next bill on {nextBill}</p>
        </div>
        <button
          type="button"
          disabled={!canBuy}
          title={canBuy ? undefined : "Only the owner can change the plan."}
          onClick={() => setPlanOpen(true)}
          className="h-10 rounded-xl bg-[#24202a] px-4 text-[13px] font-bold text-white transition hover:bg-[#3b3442] disabled:cursor-not-allowed disabled:opacity-35"
        >
          Change plan
        </button>
      </section>

      {paymentMethod && (
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#ececf1] bg-white p-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9a94a0]">Payment method</p>
            <p className="mt-1.5 flex items-center gap-2 text-[14px] font-bold text-[#28222e]">
              <CreditCard className="size-4 text-[#8a8490]" />
              {paymentMethod.brand} ending {paymentMethod.last4}
            </p>
            <p className="mt-1 text-[12px] text-[#8a8490]">Stays with the team if ownership changes.</p>
          </div>
          <button
            type="button"
            onClick={() => showToast("Card update isn't wired up in this prototype.")}
            className="h-10 rounded-xl border border-[#ececf1] px-4 text-[13px] font-bold text-[#3b3442] transition hover:border-[#ddd7df] hover:bg-[#faf9fb]"
          >
            Update
          </button>
        </section>
      )}

      <BillingContactsCard />

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#ececf1] bg-white p-5">
          <p className="text-[14px] font-bold text-[#28222e]">Add seats</p>
          <p className="mt-1 text-[12px] text-[#8a8490]">${SEAT_PRICE} per seat / month, prorated. Billing contacts don&apos;t use seats.</p>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-10 items-center rounded-xl border border-[#ececf1]">
              <button type="button" aria-label="Fewer seats" onClick={() => setSeatDelta((n) => Math.max(1, n - 1))} className="grid h-full w-9 place-items-center text-[#8a8490] hover:text-[#3b3442]">
                −
              </button>
              <span className="w-9 text-center text-[14px] font-bold text-[#28222e]">{seatDelta}</span>
              <button type="button" aria-label="More seats" onClick={() => setSeatDelta((n) => Math.min(20, n + 1))} className="grid h-full w-9 place-items-center text-[#8a8490] hover:text-[#3b3442]">
                +
              </button>
            </div>
            <span className="text-[13px] font-semibold text-[#7b7480]">
              +{seatDelta} seat{seatDelta > 1 ? "s" : ""} · ${seatDelta * SEAT_PRICE}/mo · {seatsUsed}/{seatsTotal} now
            </span>
          </div>
          <button
            type="button"
            disabled={!canBuy}
            onClick={() => addSeats(seatDelta)}
            className="mt-4 h-10 w-full rounded-xl border border-[#ff5e1a]/50 bg-[#fff3ec] text-[13px] font-bold text-[#ff5e1a] transition hover:bg-[#ffe7d6] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Add seats
          </button>
        </div>

        <div className="flex flex-col rounded-2xl border border-[#ececf1] bg-white p-5">
          <p className="text-[14px] font-bold text-[#28222e]">Need more capacity?</p>
          <p className="mt-1 text-[12px] text-[#8a8490]">Top up now, or move to a larger plan.</p>
          <div className="mt-auto grid gap-2.5 pt-4">
            <button
              type="button"
              onClick={() => setCreditsOpen(true)}
              className="h-10 rounded-xl border border-[#ececf1] text-[13px] font-bold text-[#3b3442] transition hover:border-[#ddd7df] hover:bg-[#faf9fb]"
            >
              Buy credits
            </button>
            <button
              type="button"
              disabled={!canBuy}
              onClick={() => setPlanOpen(true)}
              className="h-10 rounded-xl bg-[#24202a] text-[13px] font-bold text-white transition hover:bg-[#3b3442] disabled:cursor-not-allowed disabled:opacity-35"
            >
              Upgrade plan
            </button>
          </div>
        </div>
      </section>

      <p className="text-[12px] text-[#9a94a0]">Billing applies to {team.name}. Switching teams switches the billing context.</p>

      {hasActiveSubscription && canBuy && (
        <div className="border-t border-[#f0eef2] pt-4">
          {confirmCancel ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[13px] font-semibold text-[#3b3442]">
                Cancel {plan.name}? The team keeps access until {nextBill}.
              </span>
              <button
                type="button"
                onClick={() => {
                  cancelPlan();
                  setConfirmCancel(false);
                }}
                className="h-9 rounded-lg bg-[#c9432a] px-3 text-[12px] font-bold text-white transition hover:bg-[#b23a1c]"
              >
                Cancel plan
              </button>
              <button type="button" onClick={() => setConfirmCancel(false)} className="h-9 px-2 text-[12px] font-semibold text-[#8a8490] hover:text-[#56505c]">
                Keep plan
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmCancel(true)}
              className="text-[12px] font-semibold text-[#8a8490] underline underline-offset-2 transition hover:text-[#b23a1c]"
            >
              Cancel plan
            </button>
          )}
        </div>
      )}

      {planOpen && <PlanModal onClose={() => setPlanOpen(false)} />}
      {creditsOpen && <CreditsModal onClose={() => setCreditsOpen(false)} />}
    </div>
  );
}

/* ============================ Shell ============================ */

export function TeamSettingsModal() {
  const { settingsOpen, closeSettings, openSettings, team, isPersonal, role } = useTeam();

  // Finance 没有产品权限,只看 Billing
  const tabs =
    role === "finance"
      ? ALL_TABS.filter((t) => t.key === "credits" || t.key === "billing")
      : isPersonal
        ? ALL_TABS.filter((t) => t.key !== "members")
        : ALL_TABS;
  const requested = settingsOpen === false ? "general" : settingsOpen;
  const active: Tab = tabs.some((t) => t.key === requested) ? (requested as Tab) : tabs[0]!.key;

  useEffect(() => {
    if (settingsOpen === false) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeSettings();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [settingsOpen, closeSettings]);

  if (settingsOpen === false) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 top-[52px] z-[80] grid place-items-center bg-[#1a1a2e]/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Team settings">
      <div className="flex h-[min(680px,calc(100vh-116px))] w-full max-w-[1000px] overflow-hidden rounded-[24px] border border-[#ececf1] bg-white shadow-[0_30px_80px_rgba(26,26,46,0.28)]">
        <aside className="hidden w-[232px] shrink-0 flex-col border-r border-[#f0eef2] bg-[#faf9fb] p-4 sm:flex">
          <div className="flex items-center gap-2.5 px-1 pb-4">
            <TeamAvatar team={team} size={30} />
            <span className="min-w-0 truncate text-[13px] font-bold text-[#28222e]">{team.name}</span>
          </div>
          <nav className="grid gap-1">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => openSettings(key)}
                aria-current={active === key ? "page" : undefined}
                className={`flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-[13px] transition ${
                  active === key ? "bg-[#fff0ea] font-bold text-[#ee6545]" : "font-semibold text-[#706a78] hover:bg-[#f2f0f4]"
                }`}
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </nav>
          <p className="mt-auto px-1 text-[11px] leading-snug text-[#a8a2ae]">
            You&apos;re {ROLE_LABEL[role]} here — {ROLE_BLURB[role].toLowerCase()}.
          </p>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between gap-3 border-b border-[#f0eef2] px-6 py-4">
            <h2 className="text-[17px] font-bold tracking-[-0.02em] text-[#28222e]">{tabs.find((t) => t.key === active)?.label}</h2>
            <button
              type="button"
              onClick={closeSettings}
              aria-label="Close team settings"
              className="grid size-9 place-items-center rounded-xl text-[#8a8490] transition hover:bg-[#f6f4f7] hover:text-[#28222e]"
            >
              <X className="size-[18px]" />
            </button>
          </header>
          <div className="flex gap-1 border-b border-[#f0eef2] px-4 py-2 sm:hidden">
            {tabs.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => openSettings(key)}
                className={`rounded-lg px-3 py-1.5 text-[13px] font-semibold transition ${active === key ? "bg-[#fff0ea] text-[#ee6545]" : "text-[#706a78]"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
            {active === "general" && <GeneralTab />}
            {active === "members" && <MembersTab />}
            {active === "credits" && <CreditsTab />}
            {active === "billing" && <BillingTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
