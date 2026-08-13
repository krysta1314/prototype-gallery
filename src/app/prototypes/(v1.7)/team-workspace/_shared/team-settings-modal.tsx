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
  Bell,
  HelpCircle,
  Lock,
  Infinity as InfinityIcon,
  LogOut,
  Mail,
  ChevronDown,
  Pencil,
  Plus,
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
  ROLE_LABEL,
  SEAT_PRICE,
  type Member,
  type PlanId,
  type Role,
} from "./data";
import { Dropdown } from "./dropdown";
import { TopUpTabPanel } from "./account-settings-modal";
import { useTeam } from "./team-context";
import { TeamAvatar } from "./team-switcher";
import { InviteModal } from "./invite-modal";

type Tab = "general" | "members" | "credits" | "topup" | "billing";

const ALL_TABS: { key: Tab; label: string; icon: typeof Building2 }[] = [
  { key: "general", label: "Team Details", icon: Building2 },
  { key: "members", label: "Team Members", icon: Users },
  { key: "credits", label: "Credits and Usage", icon: Coins },
  { key: "topup", label: "Credits Top-up", icon: Zap },
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
                <div className="mt-2">
                  <Dropdown
                    value={transferTo}
                    onChange={(value) => {
                      setTransferTo(value);
                      setConfirmTransfer(false);
                    }}
                    placeholder="Select a member…"
                    ariaLabel="Transfer ownership to"
                    options={members
                      .filter((m) => m.status === "active" && m.id !== CURRENT_USER_ID && m.role !== "finance")
                      .map((m) => ({ value: m.id, label: m.name }))}
                  />
                </div>
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
  const [cycle, setCycle] = useState("monthly");
  const [helpFor, setHelpFor] = useState<string | null>(null);
  const value = Number(credits.replace(/[^\d]/g, "")) || 0;

  const TYPES = [
    {
      key: "none" as const,
      label: "No Limit",
      icon: InfinityIcon,
      help: "Members can generate freely until the Team Credits runs out.",
    },
    {
      key: "soft" as const,
      label: "Soft Cap",
      icon: Bell,
      help: "Once members use up their allocated Credits, they get a warning but can keep working while the Team Credits last.",
    },
    {
      key: "hard" as const,
      label: "Hard Cap",
      icon: Lock,
      help: "Once members use up their allocated Credits, they can't submit any task, even if the Team Credits still has balance.",
    },
  ];

  return (
    <div className="fixed inset-x-0 bottom-0 top-[52px] z-[95] grid place-items-center bg-[#1a1a2e]/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Credits Balance">
      <div className="w-full max-w-[460px] rounded-[24px] border border-[#ececf1] bg-white p-6 shadow-[0_30px_80px_rgba(26,26,46,0.28)]">
        <div className="relative text-center">
          <h2 className="text-[17px] font-bold tracking-[-0.02em] text-[#28222e]">Credits Balance</h2>
          <p className="mt-1 text-[13px] text-[#8a8490]">Set credit limit for {member.name}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute -right-1 -top-1 grid size-8 place-items-center rounded-lg text-[#8a8490] transition hover:bg-[#f6f4f7] hover:text-[#28222e]"
          >
            <X className="size-[18px]" />
          </button>
        </div>

        <p className="mt-6 text-[12px] font-semibold text-[#8a8490]">Type</p>
        <div className="mt-2 grid grid-cols-3 gap-2.5">
          {TYPES.map((type) => {
            const active = mode === type.key;
            const Icon = type.icon;
            return (
              <button
                key={type.key}
                type="button"
                onClick={() => setMode(type.key)}
                aria-pressed={active}
                className={`relative grid place-items-center gap-1.5 rounded-2xl border px-2 py-4 transition ${
                  active ? "border-[#ff5e1a] bg-[#fff8f4]" : "border-[#ececf1] bg-white hover:border-[#ddd7df]"
                }`}
              >
                <span
                  onMouseEnter={() => setHelpFor(type.key)}
                  onMouseLeave={() => setHelpFor((current) => (current === type.key ? null : current))}
                  className="absolute right-2 top-2 text-[#c3bcc8] transition hover:text-[#8a8490]"
                >
                  <HelpCircle className="size-3.5" />
                  {helpFor === type.key && (
                    <span
                      role="tooltip"
                      className="pointer-events-none absolute bottom-[calc(100%+8px)] right-0 z-10 w-[210px] rounded-xl bg-[#24202a] px-3 py-2 text-left text-[11px] font-medium leading-[1.5] text-white shadow-[0_10px_28px_rgba(26,26,46,0.28)]"
                    >
                      {type.help}
                    </span>
                  )}
                </span>
                <Icon className={`size-5 ${active ? "text-[#ff5e1a]" : "text-[#9a94a0]"}`} />
                <span className={`text-[13px] font-bold ${active ? "text-[#28222e]" : "text-[#56505c]"}`}>{type.label}</span>
              </button>
            );
          })}
        </div>

        {/* 三种类型的高度固定,切换时弹窗不跳动 */}
        {mode === "none" ? (
          <div className="mt-4 flex min-h-[116px] flex-col justify-center rounded-2xl bg-[#faf9fb] px-4 py-3.5">
            <p className="text-[13px] font-bold text-[#28222e]">No Usage Limit</p>
            <p className="mt-1 text-[12px] text-[#8a8490]">{member.name} can use the whole team pool without limit</p>
          </div>
        ) : (
          <div className="mt-4 min-h-[116px]">
            {mode === "soft" ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[12px] font-semibold text-[#8a8490]">Restore Cycle</span>
                  <div className="mt-1.5">
                    <Dropdown
                      value={cycle}
                      onChange={setCycle}
                      ariaLabel="Restore cycle"
                      options={[
                        { value: "monthly", label: "Monthly" },
                        { value: "weekly", label: "Weekly" },
                      ]}
                    />
                  </div>
                </div>
                <label className="block">
                  <span className="text-[12px] font-semibold text-[#8a8490]">Balance Per Cycle</span>
                  <span className="mt-1.5 flex h-11 items-center gap-2 rounded-xl border border-[#ececf1] bg-white pl-3.5 pr-3 transition focus-within:border-[#ff5e1a]">
                    <input
                      value={credits}
                      onChange={(event) => setCredits(event.target.value)}
                      inputMode="numeric"
                      className="min-w-0 flex-1 bg-transparent text-[14px] text-[#28222e] outline-none"
                    />
                    <span className="shrink-0 text-[12px] font-semibold text-[#9a94a0]">Credits</span>
                  </span>
                </label>
              </div>
            ) : (
              <label className="block">
                <span className="text-[12px] font-semibold text-[#8a8490]">Fixed Balance</span>
                <span className="mt-1.5 flex h-11 items-center gap-2 rounded-xl border border-[#ececf1] bg-white pl-3.5 pr-3 transition focus-within:border-[#ff5e1a]">
                  <input
                    value={credits}
                    onChange={(event) => setCredits(event.target.value)}
                    inputMode="numeric"
                    className="min-w-0 flex-1 bg-transparent text-[14px] text-[#28222e] outline-none"
                  />
                  <span className="shrink-0 text-[12px] font-semibold text-[#9a94a0]">Credits</span>
                </span>
              </label>
            )}
            <p className="mt-2 text-[11px] leading-[1.5] text-[#9a94a0]">
              {mode === "soft"
                ? "When the allocated Credits run out, the member can keep submitting tasks. An email goes to the owner and admins."
                : "When the allocated Credits run out, the member can't submit tasks. An email goes to the owner and admins."}
            </p>
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl border border-[#ececf1] text-[13px] font-bold text-[#56505c] transition hover:border-[#ddd7df] hover:bg-[#faf9fb]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={mode !== "none" && value <= 0}
            onClick={() => {
              setMemberLimit(member.id, mode === "none" ? null : { credits: value, mode });
              onClose();
            }}
            className="h-11 rounded-xl bg-[#24202a] text-[13px] font-bold text-white transition hover:bg-[#3b3442] disabled:cursor-not-allowed disabled:opacity-35"
          >
            Save &amp; Apply
          </button>
        </div>
      </div>
    </div>
  );
}

/** 用量区:上限标签 + 已用/总量 + 进度条 + 编辑入口(对齐参考稿) */
function UsageCell({ member, onEdit }: { member: Member; onEdit: () => void }) {
  const { role, resendInvite, revokeInvite } = useTeam();
  const canManage = role === "owner" || role === "admin";

  if (member.role === "finance") {
    return <p className="text-[12px] text-[#c3bcc8]">No product usage</p>;
  }
  if (member.status !== "active") {
    const expired = member.status === "expired";
    return (
      <div>
        <p className="text-[12px] text-[#9a94a0]">{expired ? "Invitation expired · no seat" : "Not joined yet · holds a seat"}</p>
        {canManage && (
          <div className="mt-1.5 flex gap-3">
            <button type="button" onClick={() => resendInvite(member.id)} className="text-[12px] font-bold text-[#ee6545] hover:underline">
              Resend
            </button>
            <button type="button" onClick={() => revokeInvite(member.id)} className="text-[12px] font-bold text-[#8a8490] hover:underline">
              Revoke
            </button>
          </div>
        )}
      </div>
    );
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
  const { role, changeMemberRole, removeMember, leaveTeam, team } = useTeam();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const canManage = role === "owner" || role === "admin";
  const isOwnerRow = member.role === "owner";
  const canEditRole = canManage && !isOwnerRow;
  const isSelf = member.id === CURRENT_USER_ID;
  const canRemove = canEditRole && !isSelf;
  // 自己的那行给「离开团队」;Owner 不能直接走,要先转让
  const canLeave = isSelf && !isOwnerRow && member.status === "active";
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
            {(isInvite ? member.email : member.name).trim()[0]?.toUpperCase()}
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
        </div>
      </div>

      {/* Usage / Total */}
      <div className="w-full min-w-[180px] sm:mr-8 sm:w-[190px] sm:shrink-0">
        <UsageCell member={member} onEdit={onEditLimit} />
      </div>

      {/* Role —— 移除成员收在这个下拉里,不再单独一列 */}
      <div className="relative w-[128px] shrink-0" data-member-menu>
        {canEditRole || canLeave ? (
          <>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="flex h-9 w-full items-center justify-between gap-1 rounded-lg border border-[#ececf1] bg-white px-2.5 text-[13px] font-semibold text-[#3b3442] transition hover:border-[#ddd7df]"
            >
              {ROLE_LABEL[member.role]}
              <ChevronDown className="size-3.5 shrink-0 text-[#9a94a0]" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-[calc(100%+4px)] z-30 w-[190px] rounded-xl border border-[#ececf1] bg-white p-1.5 text-left shadow-[0_14px_32px_rgba(26,26,46,0.14)]">
                {(canEditRole ? roleOptions : []).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      changeMemberRole(member.id, option);
                      setMenuOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[13px] font-semibold transition hover:bg-[#f6f4f7] ${
                      member.role === option ? "text-[#ee6545]" : "text-[#3b3442]"
                    }`}
                  >
                    {ROLE_LABEL[option]}
                    {member.role === option && <Check className="size-3.5" />}
                  </button>
                ))}

                {canRemove && (
                  <div className="mt-1.5 border-t border-[#f0eef2] pt-1.5">
                    {confirmRemove ? (
                      <div className="p-2">
                        <p className="text-[12px] leading-snug text-[#56505c]">
                          Remove {member.name}? They&apos;ll get an email letting them know.
                        </p>
                        <div className="mt-2.5 flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              removeMember(member.id);
                              setMenuOpen(false);
                            }}
                            className="rounded-lg bg-[#d92d20] px-2.5 py-1.5 text-[12px] font-bold text-white"
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
                        className="block w-full rounded-lg px-2.5 py-2 text-left text-[13px] font-semibold text-[#d92d20] transition hover:bg-[#fef3f2]"
                      >
                        Remove from team
                      </button>
                    )}
                  </div>
                )}

                {canLeave && (
                  <div className={`${canEditRole ? "mt-1.5 border-t border-[#f0eef2] pt-1.5" : ""}`}>
                    {confirmLeave ? (
                      <div className="p-2">
                        <p className="text-[12px] leading-snug text-[#56505c]">
                          Leave {team.name}? You&apos;ll lose access to the team&apos;s projects, assets and credits.
                        </p>
                        <div className="mt-2.5 flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              leaveTeam();
                              setMenuOpen(false);
                            }}
                            className="rounded-lg bg-[#d92d20] px-2.5 py-1.5 text-[12px] font-bold text-white"
                          >
                            Leave
                          </button>
                          <button type="button" onClick={() => setConfirmLeave(false)} className="px-1.5 text-[12px] font-semibold text-[#8a8490]">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmLeave(true)}
                        className="block w-full rounded-lg px-2.5 py-2 text-left text-[13px] font-semibold text-[#d92d20] transition hover:bg-[#fef3f2]"
                      >
                        Leave team
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <span className="inline-flex h-9 items-center rounded-lg bg-[#faf9fb] px-2.5 text-[13px] font-semibold text-[#8a8490]">
            {ROLE_LABEL[member.role]}
          </span>
        )}
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
          They can update the payment method, buy credits and set auto top-up. They can&apos;t add seats, change or cancel the plan, and
          they have no access to the team&apos;s work.
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

/** 席位概览:一条分段进度条把「已加入 / 待接受 / 空余」三者一次讲清 */
function SeatsCard() {
  const { members, role, seatsUsed, seatsTotal, seatsFull, openSettings } = useTeam();
  const paid = members.filter((m) => m.role !== "finance");
  const joined = paid.filter((m) => m.status === "active").length;
  const pending = paid.filter((m) => m.status === "invited").length;
  const free = Math.max(0, seatsTotal - seatsUsed);
  // 演示条把席位强制拉满时,把差额并进「已加入」段,进度条和上面的数字才对得上
  const joinedShown = joined + Math.max(0, seatsUsed - joined - pending);
  const pct = (n: number) => `${(n / Math.max(1, seatsTotal)) * 100}%`;

  return (
    <section className="rounded-2xl border border-[#ececf1] bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] font-bold tracking-[-0.01em] text-[#28222e]">
            <span className="tabular-nums">{seatsUsed}</span> of <span className="tabular-nums">{seatsTotal}</span> seats used
          </p>
          <p className={`mt-0.5 text-[12px] ${seatsFull ? "font-semibold text-[#c9432a]" : "text-[#8a8490]"}`}>
            {seatsFull
              ? "All seats are in use. Add seats to invite anyone else."
              : `${free} ${free === 1 ? "seat" : "seats"} left · pending invitations hold a seat, expired ones don't`}
          </p>
        </div>
        {role === "owner" ? (
          <button
            type="button"
            onClick={() => openSettings("billing")}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-[#ececf1] px-3.5 text-[12px] font-bold text-[#3b3442] transition hover:border-[#ff5e1a] hover:bg-[#fff7f1] hover:text-[#b23a1c]"
          >
            <Plus className="size-3.5" />
            Add seats
          </button>
        ) : (
          seatsFull && <span className="shrink-0 text-[12px] text-[#8a8490]">Ask your owner to add seats.</span>
        )}
      </div>

      {/* 分段进度:深色=已加入,橙色=待接受,余下=空位 */}
      <div className="mt-3 flex h-2 gap-0.5 overflow-hidden rounded-full bg-[#f1eff3]">
        <span
          className="h-full rounded-full bg-[#24202a] transition-[width] duration-200 motion-reduce:transition-none"
          style={{ width: pct(joinedShown) }}
        />
        <span
          className="h-full rounded-full bg-[#ff9a3d] transition-[width] duration-200 motion-reduce:transition-none"
          style={{ width: pct(pending) }}
        />
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[#7b7480]">
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-[#24202a]" />
          <span className="tabular-nums font-semibold text-[#3b3442]">{joinedShown}</span> joined
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-[#ff9a3d]" />
          <span className="tabular-nums font-semibold text-[#3b3442]">{pending}</span> pending
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-[#ddd7df]" />
          <span className="tabular-nums font-semibold text-[#3b3442]">{free}</span> available
        </span>
      </div>
    </section>
  );
}

function MembersTab() {
  const { members, role, seatsFull, openSettings } = useTeam();
  const [query, setQuery] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [limitFor, setLimitFor] = useState<Member | null>(null);
  const [usageSort, setUsageSort] = useState<null | "asc" | "desc">(null);
  const canManage = role === "owner" || role === "admin";

  const visible = useMemo(
    () =>
      members.filter((m) => {
        // Finance 是 billing-only,归 Plans and Billing 管
        if (m.role === "finance") return false;
        const q = query.trim().toLowerCase();
        if (q && !m.name.toLowerCase().includes(q) && !m.email.toLowerCase().includes(q)) return false;
        return true;
      }),
    [members, query],
  );

  const sorted = useMemo(() => {
    if (!usageSort) return visible;
    return [...visible].sort((a, b) =>
      usageSort === "desc" ? b.usedThisCycle - a.usedThisCycle : a.usedThisCycle - b.usedThisCycle,
    );
  }, [visible, usageSort]);

  return (
    <div className="space-y-5">
      {canManage && <SeatsCard />}

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
        {canManage && (
          <>
            <button
              type="button"
              disabled={seatsFull}
              onClick={() => setInviteOpen(true)}
              className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-[#24202a] px-4 text-[13px] font-bold text-white transition hover:bg-[#3b3442] disabled:cursor-not-allowed disabled:opacity-35"
            >
              <Plus className="size-4" />
              Invite Members
            </button>
          </>
        )}
      </div>

      {!canManage && (
        <p className="rounded-xl border border-[#ececf1] bg-[#faf9fb] px-4 py-3 text-[13px] text-[#7b7480]">
          Only owners and admins can invite, remove, change roles, or set limits.
        </p>
      )}

      {/* 列标签放在卡片外,每位成员一张独立卡片 */}
      <div>
        <div className="flex flex-wrap items-center gap-4 px-4 pb-1 text-[11px] text-[#9a94a0]">
          <span className="min-w-[200px] flex-1">Member info</span>
          <button
            type="button"
            onClick={() => setUsageSort((current) => (current === "desc" ? "asc" : current === "asc" ? null : "desc"))}
            className="flex w-full items-center gap-1 text-left transition hover:text-[#56505c] sm:mr-8 sm:w-[190px] sm:shrink-0"
          >
            Usage / Limit
            <ArrowUpDown className={`size-3 ${usageSort ? "text-[#ee6545]" : "text-[#c3bcc8]"}`} />
          </button>
          <span className="w-[128px] shrink-0">Role</span>
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

      {inviteOpen && <InviteModal onClose={() => setInviteOpen(false)} onAddSeats={() => openSettings("billing")} />}
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

/** 财务角色:收账单 + 能进来做基础的 plan / billing 操作,不占席位 */
function BillingContactsCard() {
  const { members, role, removeMember } = useTeam();
  const [financeInviteOpen, setFinanceInviteOpen] = useState(false);
  const canEdit = role === "owner";
  const contacts = members.filter((m) => m.role === "finance" && m.status !== "expired");

  return (
    <section className="rounded-2xl border border-[#ececf1] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[15px] font-bold text-[#28222e]">
            <Mail className="size-4 text-[#8a8490]" />
            Billing contacts
          </p>
          <p className="mt-1 text-[12px] leading-snug text-[#8a8490]">
            Invoices and quota alerts go here. No seat used.
          </p>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => setFinanceInviteOpen(true)}
            className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-[#3b3442] px-4 text-[13px] font-bold text-white transition hover:bg-[#28222e]"
          >
            <Plus className="size-4" />
            Invite Billing Contact
          </button>
        )}
      </div>

      <div className="mt-3.5 space-y-2">
        {contacts.map((contact) => (
          <div key={contact.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-[#f0eef2] bg-[#faf9fb] px-3.5 py-2.5">
            <span
              className="grid size-8 shrink-0 place-items-center rounded-full text-[12px] font-bold text-white"
              style={{ background: contact.color }}
            >
              {contact.email.trim()[0]?.toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-1.5 text-[13px] font-semibold text-[#28222e]">
                {contact.status === "active" ? contact.name : contact.email}
                {contact.status === "invited" && (
                  <span className="rounded-md bg-[#fff3ec] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#e07a3a]">Pending</span>
                )}
              </span>
              {contact.status === "active" && <span className="block truncate text-[12px] text-[#7b7480]">{contact.email}</span>}
            </span>
            {canEdit && (
              <button
                type="button"
                onClick={() => removeMember(contact.id)}
                className="shrink-0 text-[12px] font-bold text-[#8a8490] transition hover:text-[#d92d20]"
              >
                Remove
              </button>
            )}
          </div>
        ))}
        {contacts.length === 0 && (
          <p className="rounded-xl border border-dashed border-[#e6e2ea] px-3.5 py-3 text-[12px] text-[#9a94a0]">
            No billing contacts yet.
          </p>
        )}
      </div>

      {financeInviteOpen && <FinanceInviteModal onClose={() => setFinanceInviteOpen(false)} />}
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
  const { team, nextBill, role, pool, members, isPersonal } = useTeam();
  const [creditsOpen, setCreditsOpen] = useState(false);
  const canBill = role === "owner" || role === "finance";
  // 个人空间只有自己一行,按成员用量没有意义
  const canSeeMembers = !isPersonal && (role === "owner" || role === "admin" || role === "finance");
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
  const { team, plan, nextBill, role, pool, seatsUsed, seatsTotal, isPersonal, addSeats, cancelPlan, paymentMethod, hasActiveSubscription, showToast } = useTeam();
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

      {/* 账单联系人与席位都是团队概念,个人空间不显示 */}
      {!isPersonal && <BillingContactsCard />}

      <section className={`grid gap-4 ${isPersonal ? "" : "sm:grid-cols-2"}`}>
        {!isPersonal && (
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
        )}

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
  const { settingsOpen, closeSettings, openSettings, team, isPersonal, role, memberCount } = useTeam();
  const joinedCount = memberCount(team.id);

  // Finance 没有产品权限,只看 Billing
  const tabs =
    role === "finance"
      ? ALL_TABS.filter((t) => t.key === "credits" || t.key === "topup" || t.key === "billing")
      : isPersonal
        ? ALL_TABS.filter((t) => t.key !== "members")
        : // 只有 Owner 能掏钱买积分,Admin / Member 看不到充值页
          ALL_TABS.filter((t) => t.key !== "topup" || role === "owner");
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

        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-start justify-between gap-3 border-b border-[#f0eef2] px-6 py-4">
            <div className="min-w-0">
              <h2 className="flex items-baseline gap-2 text-[17px] font-bold tracking-[-0.02em] text-[#28222e]">
                {tabs.find((t) => t.key === active)?.label}
                {active === "members" && (
                  <span className="text-[14px] font-medium text-[#9a94a0]">· {joinedCount} {joinedCount === 1 ? "member" : "members"}</span>
                )}
              </h2>
              {active === "billing" && !isPersonal && (
                <p className="mt-0.5 text-[12px] text-[#9a94a0]">
                  Billing applies to {team.name}. Switching teams switches the billing context.
                </p>
              )}
            </div>
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
            {active === "topup" && (
              <div className="space-y-5">
                <TopUpTabPanel />
                <AutoTopUpCard />
              </div>
            )}
            {active === "billing" && <BillingTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
