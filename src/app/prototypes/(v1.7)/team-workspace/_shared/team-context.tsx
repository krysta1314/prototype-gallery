"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  CREDIT_PACKS,
  CURRENT_USER,
  CURRENT_USER_ID,
  MEMBERS_BY_TEAM,
  NEXT_BILL,
  PLANS,
  planOf,
  SEAT_PRICE,
  takesPaidSeat,
  TEAMS,
  type AutoTopUp,
  type Member,
  type MemberLimit,
  type PlanId,
  type Role,
  type Team,
} from "./data";
import type { AccountTab } from "./account-settings-modal";

const STORAGE_KEY = "team-workspace-demo-v3";

const TEAM_COLORS = ["#ff7955", "#5b6cff", "#12a594", "#e0568a", "#8a5cf6", "#f0a020"];

/** 演示用:池用量档位 */
export type PoolLevel = "normal" | "warn" | "full";
/** 演示用:自动充值状态 */
export type AutoState = "active" | "paused" | "cap";

type Persisted = {
  activeTeamId: string;
  roleOverride: Role | null;
  seatsFull: boolean;
  poolLevel: PoolLevel;
  myLimitFull: boolean;
  autoState: AutoState;
};

/** 池的实时读数（含演示档位覆盖） */
type Pool = {
  subTotal: number;
  subUsed: number;
  subRemaining: number;
  topupRemaining: number;
  /** 可用总额 = 订阅剩余 + 充值剩余 */
  remaining: number;
  /** 订阅池已用百分比,阈值告警看这个 */
  usedPct: number;
  /** 80% / 100% 告警态 */
  alert: null | "warn" | "full";
};

type QuotaBlock = { kind: "member-hard" | "pool"; title: string; body: string } | null;

type Ctx = {
  teams: Team[];
  team: Team;
  plan: ReturnType<typeof planOf>;
  nextBill: string;
  role: Role;
  pool: Pool;
  seatsUsed: number;
  seatsTotal: number;
  seatsFull: boolean;
  isPersonal: boolean;
  members: Member[];
  /** 在职成员数 */
  memberCount: (teamId: string) => number;
  roleIn: (teamId: string) => Role;
  /** 当前用户的月度上限与用量 */
  myLimit: MemberLimit | null;
  myUsed: number;
  /** 撞到硬上限或池空时的拦截信息,null = 放行 */
  quotaBlock: QuotaBlock;
  setActiveTeamId: (id: string) => void;
  createTeam: (name: string) => void;
  renameTeam: (name: string) => void;
  setTeamColor: (color: string) => void;
  deleteTeam: () => void;
  leaveTeam: () => void;
  transferOwnership: (memberId: string) => void;
  addSeats: (n: number) => void;
  changePlan: (planId: PlanId) => void;
  cancelPlan: () => void;
  hasActiveSubscription: boolean;
  paymentMethod: { brand: string; last4: string } | null;
  /** 12.9 第一层 */
  addBillingContact: (email: string) => void;
  removeBillingContact: (email: string) => void;
  /** 12.5 */
  updateAutoTopUp: (patch: Partial<AutoTopUp>) => void;
  retryAutoTopUp: () => void;
  buyCredits: (credits: number) => void;
  inviteMembers: (emails: string[], role: Role) => void;
  inviteFinance: (email: string) => void;
  removeMember: (id: string) => void;
  changeMemberRole: (id: string, role: Role) => void;
  setMemberLimit: (id: string, limit: MemberLimit | null) => void;
  revokeInvite: (id: string) => void;
  resendInvite: (id: string) => void;
  /** demo controls */
  roleOverride: Role | null;
  setRoleOverride: (role: Role | null) => void;
  seatsFullOverride: boolean;
  setSeatsFullOverride: (full: boolean) => void;
  poolLevel: PoolLevel;
  setPoolLevel: (level: PoolLevel) => void;
  myLimitFull: boolean;
  setMyLimitFull: (full: boolean) => void;
  autoState: AutoState;
  setAutoState: (state: AutoState) => void;
  settingsOpen: false | "general" | "members" | "credits" | "topup" | "billing";
  openSettings: (tab?: "general" | "members" | "credits" | "topup" | "billing") => void;
  closeSettings: () => void;
  /** 账户级设置(个人账号),与团队设置是两套 */
  accountOpen: false | AccountTab;
  openAccount: (tab?: AccountTab) => void;
  closeAccount: () => void;
  createTeamOpen: boolean;
  setCreateTeamOpen: (open: boolean) => void;
  toast: string | null;
  toastTone: "default" | "success";
  showToast: (message: string, tone?: "default" | "success") => void;
};

const TeamCtx = createContext<Ctx | null>(null);

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const [teams, setTeams] = useState<Team[]>(TEAMS);
  const [membersByTeam, setMembersByTeam] = useState<Record<string, Member[]>>(MEMBERS_BY_TEAM);
  const [activeTeamId, setActiveTeamIdState] = useState(TEAMS[1]!.id);
  const [roleOverride, setRoleOverrideState] = useState<Role | null>(null);
  const [seatsFullOverride, setSeatsFullOverrideState] = useState(false);
  const [poolLevel, setPoolLevelState] = useState<PoolLevel>("normal");
  const [myLimitFull, setMyLimitFullState] = useState(false);
  const [autoState, setAutoStateState] = useState<AutoState>("active");
  const [settingsOpen, setSettingsOpen] = useState<false | "general" | "members" | "credits" | "topup" | "billing">(false);
  const [accountOpen, setAccountOpen] = useState<false | AccountTab>(false);
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<"default" | "success">("default");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<Persisted>;
        if (saved.activeTeamId && TEAMS.some((t) => t.id === saved.activeTeamId)) setActiveTeamIdState(saved.activeTeamId);
        setRoleOverrideState(saved.roleOverride ?? null);
        if (typeof saved.seatsFull === "boolean") setSeatsFullOverrideState(saved.seatsFull);
        if (saved.poolLevel) setPoolLevelState(saved.poolLevel);
        if (typeof saved.myLimitFull === "boolean") setMyLimitFullState(saved.myLimitFull);
        if (saved.autoState) setAutoStateState(saved.autoState);
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const payload: Persisted = { activeTeamId, roleOverride, seatsFull: seatsFullOverride, poolLevel, myLimitFull, autoState };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* ignore */
    }
  }, [hydrated, activeTeamId, roleOverride, seatsFullOverride, poolLevel, myLimitFull, autoState]);

  const showToast = useCallback((message: string, tone: "default" | "success" = "default") => {
    setToast(message);
    setToastTone(tone);
    window.setTimeout(() => setToast((current) => (current === message ? null : current)), 2600);
  }, []);

  const team = teams.find((t) => t.id === activeTeamId) ?? teams[0]!;
  const members = useMemo(() => membersByTeam[team.id] ?? [], [membersByTeam, team.id]);

  const seatsTotal = team.seatsTotal;
  const occupied = members.filter(takesPaidSeat).length;
  const seatsUsed = seatsFullOverride ? seatsTotal : occupied;
  const seatsFull = seatsUsed >= seatsTotal;

  const actualRole = members.find((m) => m.id === CURRENT_USER_ID)?.role ?? "member";
  const role = roleOverride ?? actualRole;

  // 池读数:演示档位可把订阅池推到 80% / 100%
  const pool = useMemo<Pool>(() => {
    const subTotal = team.subTotal;
    const subUsed =
      poolLevel === "warn" ? Math.round(subTotal * 0.82) : poolLevel === "full" ? subTotal : team.subUsed;
    const topupRemaining = poolLevel === "full" ? 0 : team.topupRemaining;
    const subRemaining = Math.max(0, subTotal - subUsed);
    const usedPct = subTotal === 0 ? 0 : subUsed / subTotal;
    return {
      subTotal,
      subUsed,
      subRemaining,
      topupRemaining,
      remaining: subRemaining + topupRemaining,
      usedPct,
      alert: usedPct >= 1 ? "full" : usedPct >= 0.8 ? "warn" : null,
    };
  }, [team.subTotal, team.subUsed, team.topupRemaining, poolLevel]);

  const me = members.find((mem) => mem.id === CURRENT_USER_ID);
  // 演示:强制把自己的额度推到用满(没设上限时临时给一个 hard 5,000)
  const myLimit: MemberLimit | null = myLimitFull ? me?.limit ?? { credits: 5_000, mode: "hard" } : me?.limit ?? null;
  const myUsed = myLimitFull && myLimit ? myLimit.credits : me?.usedThisCycle ?? 0;

  const quotaBlock = useMemo<QuotaBlock>(() => {
    if (myLimit && myLimit.mode === "hard" && myUsed >= myLimit.credits) {
      return {
        kind: "member-hard",
        title: "You've hit your monthly limit",
        body:
          role === "owner" || role === "admin"
            ? `You've used your ${myLimit.credits.toLocaleString("en-US")} credit monthly limit. Raise it in Team settings to keep creating.`
            : `You've used your ${myLimit.credits.toLocaleString("en-US")} credit monthly limit. Ask an admin to raise it. The team still has credits left.`,
      };
    }
    if (pool.remaining <= 0) {
      return {
        kind: "pool",
        title: "The team is out of credits",
        body:
          role === "owner" || role === "finance"
            ? "Top up the pool or turn on auto top-up to keep the team creating."
            : `${team.name} has no credits left. Ask the owner to top up.`,
      };
    }
    return null;
  }, [myLimit, myUsed, pool.remaining, role, team.name]);

  const patchTeam = useCallback(
    (patch: Partial<Team>) => setTeams((prev) => prev.map((t) => (t.id === activeTeamId ? { ...t, ...patch } : t))),
    [activeTeamId],
  );
  const patchMembers = useCallback(
    (fn: (list: Member[]) => Member[]) =>
      setMembersByTeam((prev) => ({ ...prev, [activeTeamId]: fn(prev[activeTeamId] ?? []) })),
    [activeTeamId],
  );

  const setActiveTeamId = useCallback((id: string) => {
    setActiveTeamIdState(id);
    setRoleOverrideState(null);
    setSeatsFullOverrideState(false);
    setPoolLevelState("normal");
    setMyLimitFullState(false);
    setAutoStateState("active");
  }, []);

  /** 新团队自动分配一个品牌色,不让用户在创建时选 */
  const createTeam = useCallback(
    (name: string) => {
      const color = TEAM_COLORS[teams.length % TEAM_COLORS.length]!;
      const id = `t-${Date.now().toString(36)}`;
      const basic = PLANS.find((p) => p.id === "basic")!;
      setTeams((prev) => [
        ...prev,
        {
          id,
          name,
          personal: false,
          seatsTotal: basic.seatsTotal,
          subTotal: basic.creditsTotal,
          subUsed: 0,
          topupRemaining: 0,
          topupExpires: "—",
          aiTokens: 0,
          aiTokensTotal: basic.aiTokensTotal,
          planId: "basic",
          color,
          autoTopUp: { enabled: false, threshold: 5_000, amount: 20_000, monthlyCap: 100_000, spentThisMonth: 0, status: "active", failures: 0 },
          billingContacts: [],
        },
      ]);
      setMembersByTeam((prev) => ({
        ...prev,
        [id]: [
          {
            id: CURRENT_USER_ID,
            name: CURRENT_USER.name,
            email: CURRENT_USER.email,
            role: "owner",
            status: "active",
            joinedAt: "Aug 05, 2026",
            color: CURRENT_USER.color,
            usedThisCycle: 0,
            limit: null,
          },
        ],
      }));
      setActiveTeamIdState(id);
      setRoleOverrideState(null);
      setSeatsFullOverrideState(false);
      setPoolLevelState("normal");
      setMyLimitFullState(false);
      showToast(`${name} created. You're the owner.`);
    },
    [teams.length, showToast],
  );

  const renameTeam = useCallback(
    (name: string) => {
      patchTeam({ name });
      showToast("Team details saved.");
    },
    [patchTeam, showToast],
  );

  const setTeamColor = useCallback((color: string) => patchTeam({ color }), [patchTeam]);

  const leaveActive = useCallback(() => {
    setTeams((prev) => prev.filter((t) => t.id !== activeTeamId));
    setMembersByTeam((prev) => {
      const next = { ...prev };
      delete next[activeTeamId];
      return next;
    });
    setActiveTeamIdState(TEAMS[0]!.id);
    setRoleOverrideState(null);
    setSeatsFullOverrideState(false);
    setSettingsOpen(false);
  }, [activeTeamId]);

  const deleteTeam = useCallback(() => {
    const name = team.name;
    leaveActive();
    showToast(`${name} was deleted.`);
  }, [team.name, leaveActive, showToast]);

  const leaveTeam = useCallback(() => {
    const name = team.name;
    leaveActive();
    showToast(`You left ${name}.`);
  }, [team.name, leaveActive, showToast]);

  const transferOwnership = useCallback(
    (memberId: string) => {
      const target = members.find((mem) => mem.id === memberId);
      // 团队只能有一个 Owner
      patchMembers((list) =>
        list.map((mem) => {
          if (mem.id === memberId) return { ...mem, role: "owner" as Role };
          if (mem.role === "owner" || mem.id === CURRENT_USER_ID) return { ...mem, role: "admin" as Role };
          return mem;
        }),
      );
      setRoleOverrideState(null);
      showToast(`${target?.name ?? "Member"} is now the owner. You're an admin.`);
    },
    [members, patchMembers, showToast],
  );

  const addSeats = useCallback(
    (n: number) => {
      patchTeam({ seatsTotal: team.seatsTotal + n });
      setSeatsFullOverrideState(false);
      showToast(`${n} seat${n > 1 ? "s" : ""} added to your plan.`);
    },
    [patchTeam, team.seatsTotal, showToast],
  );

  const changePlan = useCallback(
    (planId: PlanId) => {
      const next = PLANS.find((p) => p.id === planId)!;
      patchTeam({
        planId,
        seatsTotal: Math.max(team.seatsTotal, next.seatsTotal),
        subTotal: next.creditsTotal,
        aiTokensTotal: next.aiTokensTotal,
      });
      showToast(`Switched to ${next.name}.`);
    },
    [patchTeam, team.seatsTotal, showToast],
  );

  const cancelPlan = useCallback(() => {
    patchTeam({ planId: "starter" });
    showToast("Plan cancelled. It stays active until the end of the cycle.");
  }, [patchTeam, showToast]);

  /** 充值积分单独入账,12 个月过期 */
  const buyCredits = useCallback(
    (credits: number) => {
      patchTeam({ topupRemaining: team.topupRemaining + credits, topupExpires: "Aug 2027" });
      setPoolLevelState("normal");
      showToast(`${credits.toLocaleString("en-US")} top-up credits added.`);
    },
    [patchTeam, team.topupRemaining, showToast],
  );

  const addBillingContact = useCallback(
    (email: string) => {
      if (team.billingContacts.includes(email)) return;
      patchTeam({ billingContacts: [...team.billingContacts, email] });
      showToast(`${email} will receive invoices and quota alerts.`);
    },
    [patchTeam, team.billingContacts, showToast],
  );

  const removeBillingContact = useCallback(
    (email: string) => {
      patchTeam({ billingContacts: team.billingContacts.filter((e) => e !== email) });
      showToast("Billing contact removed.");
    },
    [patchTeam, team.billingContacts, showToast],
  );

  const updateAutoTopUp = useCallback(
    (patch: Partial<AutoTopUp>) => {
      patchTeam({ autoTopUp: { ...team.autoTopUp, ...patch } });
      if (patch.enabled === true) setAutoStateState("active");
    },
    [patchTeam, team.autoTopUp],
  );

  const retryAutoTopUp = useCallback(() => {
    setAutoStateState("active");
    patchTeam({
      autoTopUp: { ...team.autoTopUp, status: "active", failures: 0, failureReason: undefined },
      topupRemaining: team.topupRemaining + team.autoTopUp.amount,
    });
    showToast(`Auto top-up succeeded. ${team.autoTopUp.amount.toLocaleString("en-US")} credits added.`);
  }, [patchTeam, team.autoTopUp, team.topupRemaining, showToast]);

  const inviteMembers = useCallback(
    (emails: string[], inviteRole: Role) => {
      patchMembers((list) => [
        ...emails.map((email, index) => ({
          id: `i-${Date.now()}-${index}`,
          name: email,
          email,
          role: inviteRole,
          status: "invited" as const,
          joinedAt: "Aug 05, 2026",
          color: "#9a9bb0",
          usedThisCycle: 0,
          limit: null,
        })),
        ...list,
      ]);
      showToast(
        emails.length > 1
          ? `${emails.length} invitation emails sent. Ask them to check their inboxes.`
          : "Invitation email sent. Ask them to check their inbox.",
        "success",
      );
    },
    [patchMembers, showToast],
  );

  /** 独立入口:billing-only,不占席位 */
  const inviteFinance = useCallback(
    (email: string) => {
      patchMembers((list) => [
        {
          id: `f-${Date.now()}`,
          name: email,
          email,
          role: "finance" as Role,
          status: "invited" as const,
          joinedAt: "Aug 05, 2026",
          color: "#9a9bb0",
          usedThisCycle: 0,
          limit: null,
        },
        ...list,
      ]);
      showToast(`Invitation email sent to ${email}. It doesn't use a seat.`, "success");
    },
    [patchMembers, showToast],
  );

  const removeMember = useCallback(
    (id: string) => {
      const target = members.find((mem) => mem.id === id);
      patchMembers((list) => list.filter((mem) => mem.id !== id));
      showToast(`${target?.name ?? "Member"} was removed from the team.`);
    },
    [members, patchMembers, showToast],
  );

  const changeMemberRole = useCallback(
    (id: string, nextRole: Role) => {
      patchMembers((list) => list.map((mem) => (mem.id === id ? { ...mem, role: nextRole } : mem)));
      showToast("Role updated.");
    },
    [patchMembers, showToast],
  );

  const setMemberLimit = useCallback(
    (id: string, limit: MemberLimit | null) => {
      const target = members.find((mem) => mem.id === id);
      patchMembers((list) => list.map((mem) => (mem.id === id ? { ...mem, limit } : mem)));
      showToast(
        limit
          ? `${target?.name ?? "Member"} capped at ${limit.credits.toLocaleString("en-US")} credits / month (${limit.mode}).`
          : `${target?.name ?? "Member"} is now uncapped.`,
      );
    },
    [members, patchMembers, showToast],
  );

  const revokeInvite = useCallback(
    (id: string) => {
      patchMembers((list) => list.filter((mem) => mem.id !== id));
      showToast("Invitation revoked.");
    },
    [patchMembers, showToast],
  );

  const resendInvite = useCallback(
    (id: string) => {
      const target = members.find((mem) => mem.id === id);
      patchMembers((list) => list.map((mem) => (mem.id === id ? { ...mem, status: "invited" as const, joinedAt: "Aug 05, 2026" } : mem)));
      showToast(`Invitation resent to ${target?.email ?? "member"}.`);
    },
    [members, patchMembers, showToast],
  );

  /** 在职成员数(不含待接受 / 已过期的邀请) */
  const memberCount = useCallback(
    (teamId: string) => (membersByTeam[teamId] ?? []).filter((mem) => mem.status === "active").length,
    [membersByTeam],
  );

  const roleIn = useCallback(
    (teamId: string): Role => {
      if (teamId === activeTeamId) return role;
      return (membersByTeam[teamId] ?? []).find((mem) => mem.id === CURRENT_USER_ID)?.role ?? "member";
    },
    [activeTeamId, role, membersByTeam],
  );

  const autoTopUp: AutoTopUp = useMemo(() => {
    if (!team.autoTopUp.enabled) return team.autoTopUp;
    if (autoState === "paused")
      return { ...team.autoTopUp, status: "paused", failures: 3, failureReason: "Your card was declined (insufficient funds)." };
    if (autoState === "cap") return { ...team.autoTopUp, status: "cap-reached", spentThisMonth: team.autoTopUp.monthlyCap };
    return { ...team.autoTopUp, status: "active" };
  }, [team.autoTopUp, autoState]);

  const value = useMemo<Ctx>(
    () => ({
      teams,
      team: { ...team, autoTopUp },
      plan: planOf(team),
      nextBill: NEXT_BILL[team.id] ?? "Sep 5, 2026",
      role,
      pool,
      seatsUsed,
      seatsTotal,
      seatsFull,
      isPersonal: team.personal,
      members,
      memberCount,
      roleIn,
      myLimit,
      myUsed,
      quotaBlock,
      setActiveTeamId,
      createTeam,
      renameTeam,
      setTeamColor,
      deleteTeam,
      leaveTeam,
      transferOwnership,
      addSeats,
      changePlan,
      cancelPlan,
      hasActiveSubscription: !team.personal && team.planId !== "starter",
      paymentMethod: !team.personal && team.planId !== "starter" ? { brand: "Visa", last4: "4242" } : null,
      addBillingContact,
      removeBillingContact,
      updateAutoTopUp,
      retryAutoTopUp,
      buyCredits,
      inviteMembers,
      inviteFinance,
      removeMember,
      changeMemberRole,
      setMemberLimit,
      revokeInvite,
      resendInvite,
      roleOverride,
      setRoleOverride: setRoleOverrideState,
      seatsFullOverride,
      setSeatsFullOverride: setSeatsFullOverrideState,
      poolLevel,
      setPoolLevel: setPoolLevelState,
      myLimitFull,
      setMyLimitFull: setMyLimitFullState,
      autoState,
      setAutoState: setAutoStateState,
      settingsOpen,
      openSettings: (tab: "general" | "members" | "credits" | "topup" | "billing" = "general") => setSettingsOpen(tab),
      closeSettings: () => setSettingsOpen(false),
      accountOpen,
      openAccount: (tab: AccountTab = "account") => {
        setSettingsOpen(false);
        setAccountOpen(tab);
      },
      closeAccount: () => setAccountOpen(false),
      createTeamOpen,
      setCreateTeamOpen,
      toast,
      toastTone,
      showToast,
    }),
    [
      teams, team, autoTopUp, role, pool, seatsUsed, seatsTotal, seatsFull, members, memberCount, roleIn,
      myLimit, myUsed, quotaBlock, setActiveTeamId, createTeam, renameTeam, setTeamColor, deleteTeam, leaveTeam,
      transferOwnership, addSeats, changePlan, cancelPlan, addBillingContact, removeBillingContact,
      updateAutoTopUp, retryAutoTopUp, buyCredits, inviteMembers, inviteFinance, removeMember, changeMemberRole,
      setMemberLimit, revokeInvite, resendInvite, roleOverride, seatsFullOverride, poolLevel, myLimitFull,
      autoState, settingsOpen, accountOpen, createTeamOpen, toast, toastTone, showToast,
    ],
  );

  return <TeamCtx.Provider value={value}>{children}</TeamCtx.Provider>;
}

export function useTeam() {
  const ctx = useContext(TeamCtx);
  if (!ctx) throw new Error("useTeam must be used inside TeamProvider");
  return ctx;
}

export { CURRENT_USER_ID, CREDIT_PACKS, SEAT_PRICE };
