"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  ACTIVITY_BY_TEAM,
  CREDIT_PACKS,
  CURRENT_USER,
  CURRENT_USER_ID,
  formatNumber,
  MEMBERS_BY_TEAM,
  NEXT_BILL,
  PLANS,
  planOf,
  REQUEST_COOLDOWN_HOURS,
  REQUESTS_BY_TEAM,
  SEAT_PRICE,
  takesPaidSeat,
  TEAMS,
  type ActivityEntry,
  type ActivityKind,
  type AutoTopUp,
  type Member,
  type MemberLimit,
  type PlanId,
  type Role,
  type Team,
  type TeamRequest,
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
  /** 演示「刚注册,还没有任何团队」 */
  noTeams: boolean;
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

/**
 * 额度状态 —— 评审第三节的核心。
 * 关键点是 source:「团队池空了」和「你个人上限到了」解法完全不同,
 * 界面必须让用户一眼看出该找谁,所以横幅 / Create 按钮 / 拦截弹窗都读这一份。
 */
export type QuotaSource = "pool" | "member";

export type QuotaAction = "topup" | "members" | "request-credits";

export type QuotaState = {
  level: "ok" | "warn" | "blocked";
  source: QuotaSource | null;
  title: string;
  body: string;
  cta: { label: string; action: QuotaAction } | null;
};

type QuotaBlock = { kind: "member-hard" | "pool"; title: string; body: string } | null;

type Ctx = {
  /** 可见条目 = 个人账户 + 已创建的团队 */
  teams: Team[];
  /** 只有团队,不含个人账户 */
  teamsOnly: Team[];
  /** 个人账户那一条 */
  personalTeam: Team;
  /** 有没有已创建的团队。false = 刚注册的状态 */
  hasTeams: boolean;
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
  /** 三档额度状态(ok / warn / blocked)+ 来源,横幅与 Create 按钮都读它 */
  quotaState: QuotaState;
  /** 撞到硬上限或池空时的拦截信息,null = 放行 */
  quotaBlock: QuotaBlock;
  /** 当前角色能不能看别人的用量(评审第 3 项:Member 只看自己) */
  canSeeTeammateUsage: boolean;
  /** D2:团队级开关 —— 是否把用量对全员公开 */
  openUsage: boolean;
  setOpenUsage: (v: boolean) => void;
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
  /** 申请回路:Member / Admin 提交,Owner / Finance 审批 */
  requests: TeamRequest[];
  /** 当前角色能处理的待办申请 */
  inboxRequests: TeamRequest[];
  submitRequest: (input: { kind: TeamRequest["kind"]; amount?: number; reason?: string }) => void;
  /** 该类型申请是否还在冷却中(同一人 24h 内不能重复提) */
  isRequestCoolingDown: (kind: TeamRequest["kind"]) => boolean;
  requestCooldownHours: number;
  approveRequest: (id: string) => void;
  dismissRequest: (id: string) => void;
  requestModal: false | TeamRequest["kind"];
  openRequestModal: (kind: TeamRequest["kind"]) => void;
  closeRequestModal: () => void;
  /** 站内操作日志 */
  activity: ActivityEntry[];
  canSeeActivity: boolean;
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
  noTeams: boolean;
  setNoTeams: (v: boolean) => void;
  settingsOpen: false | SettingsTab;
  openSettings: (tab?: SettingsTab) => void;
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

export type SettingsTab = "general" | "members" | "credits" | "topup" | "billing" | "activity";

const TeamCtx = createContext<Ctx | null>(null);

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const [teams, setTeams] = useState<Team[]>(TEAMS);
  const [membersByTeam, setMembersByTeam] = useState<Record<string, Member[]>>(MEMBERS_BY_TEAM);
  const [activityByTeam, setActivityByTeam] = useState<Record<string, ActivityEntry[]>>(ACTIVITY_BY_TEAM);
  const [requestsByTeam, setRequestsByTeam] = useState<Record<string, TeamRequest[]>>(REQUESTS_BY_TEAM);
  const [activeTeamId, setActiveTeamIdState] = useState(TEAMS[1]!.id);
  const [roleOverride, setRoleOverrideState] = useState<Role | null>(null);
  const [seatsFullOverride, setSeatsFullOverrideState] = useState(false);
  const [poolLevel, setPoolLevelState] = useState<PoolLevel>("normal");
  const [myLimitFull, setMyLimitFullState] = useState(false);
  const [autoState, setAutoStateState] = useState<AutoState>("active");
  /** 演示「刚注册」:把所有团队藏起来,只剩个人账户 */
  const [noTeams, setNoTeamsState] = useState(false);
  /** D2:Owner 可以选择把用量对全员公开。默认关 —— 企业客户要的是默认收敛 */
  const [openUsage, setOpenUsageState] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState<false | SettingsTab>(false);
  const [accountOpen, setAccountOpen] = useState<false | AccountTab>(false);
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [requestModal, setRequestModal] = useState<false | TeamRequest["kind"]>(false);
  const [toast, setToast] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<"default" | "success">("default");
  const [hydrated, setHydrated] = useState(false);

  /**
   * 预览模式(?preview=1):完全由 URL 决定状态,不读也不写 localStorage。
   * 功能清单用 iframe 内嵌这些页面,如果继承了上次走查留下的残留状态,
   * 看到的就不是这条功能该有的界面 —— 所以预览必须是确定的。
   */
  const [previewMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("preview") === "1";
  });

  useEffect(() => {
    // 预览模式跳过恢复,直接进下面的 URL 解析
    if (!previewMode) {
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
          if (typeof saved.noTeams === "boolean") setNoTeamsState(saved.noTeams);
        }
      } catch {
        /* ignore */
      }
    }

    // URL 参数优先于 localStorage —— 功能清单靠它一键跳进指定状态,
    // 评审时也能把某个具体场景的链接直接发给别人。
    try {
      const q = new URLSearchParams(window.location.search);
      const team = q.get("team");
      const role = q.get("role");
      const pool = q.get("pool");
      const limit = q.get("limit");
      const seats = q.get("seats");
      const auto = q.get("auto");
      if (team && TEAMS.some((t) => t.id === team)) setActiveTeamIdState(team);
      if (role === "owner" || role === "admin" || role === "finance" || role === "member") setRoleOverrideState(role);
      if (pool === "normal" || pool === "warn" || pool === "full") setPoolLevelState(pool);
      if (limit) setMyLimitFullState(limit === "full");
      if (seats) setSeatsFullOverrideState(seats === "full");
      if (auto === "active" || auto === "paused" || auto === "cap") setAutoStateState(auto);
      // ?teams=none 演示刚注册的账户
      const teamsParam = q.get("teams");
      if (teamsParam) setNoTeamsState(teamsParam === "none");
    } catch {
      /* ignore */
    }

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || previewMode) return;
    const payload: Persisted = { activeTeamId, roleOverride, seatsFull: seatsFullOverride, poolLevel, myLimitFull, autoState, noTeams };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* ignore */
    }
  }, [hydrated, activeTeamId, roleOverride, seatsFullOverride, poolLevel, myLimitFull, autoState, noTeams]);

  const showToast = useCallback((message: string, tone: "default" | "success" = "default") => {
    setToast(message);
    setToastTone(tone);
    window.setTimeout(() => setToast((current) => (current === message ? null : current)), 2600);
  }, []);

  /**
   * 注册后不再自动获得一个「<用户名>'s team」——只有个人账户,团队必须手动创建。
   * 所以「刚注册」这个状态下可见的只有个人账户那一条。
   */
  const personalTeam = teams.find((t) => t.personal) ?? teams[0]!;
  const visibleTeams = noTeams ? teams.filter((t) => t.personal) : teams;
  const teamsOnly = visibleTeams.filter((t) => !t.personal);
  const hasTeams = teamsOnly.length > 0;

  const team =
    visibleTeams.find((t) => t.id === activeTeamId) ?? (noTeams ? personalTeam : visibleTeams[0]!);
  const members = useMemo(() => membersByTeam[team.id] ?? [], [membersByTeam, team.id]);
  const activity = useMemo(() => activityByTeam[team.id] ?? [], [activityByTeam, team.id]);
  const requests = useMemo(() => requestsByTeam[team.id] ?? [], [requestsByTeam, team.id]);

  const seatsTotal = team.seatsTotal;
  const occupied = members.filter(takesPaidSeat).length;
  const seatsUsed = seatsFullOverride ? seatsTotal : occupied;
  const seatsFull = seatsUsed >= seatsTotal;

  const actualRole = members.find((m) => m.id === CURRENT_USER_ID)?.role ?? "member";
  const role = roleOverride ?? actualRole;

  const nextBill = NEXT_BILL[team.id] ?? "Sep 5, 2026";

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

  const canTopUp = role === "owner" || role === "finance";
  const canEditLimits = role === "owner" || role === "admin";
  // 默认只有 Owner / Admin / Finance 能看别人的用量;Owner 打开开关后对全员公开
  const canSeeTeammateUsage = role !== "member" || openUsage;
  const canSeeActivity = !team.personal && role !== "member";

  /**
   * 四种告警态,优先级:池空 > 个人上限满 > 个人 80% > 池 80%。
   * 池空排最前是因为个人上限再放宽也救不了;个人 80% 排在池 80% 前面是因为它更贴身、更可行动。
   */
  const quotaState = useMemo<QuotaState>(() => {
    const poolBlocked = pool.remaining <= 0;
    const memberBlocked = Boolean(myLimit && myLimit.mode === "hard" && myUsed >= myLimit.credits);
    const memberPct = myLimit ? myUsed / myLimit.credits : 0;
    const memberWarn = Boolean(myLimit) && memberPct >= 0.8 && !memberBlocked;

    const topUpCta = { label: "Top up to continue", action: "topup" as QuotaAction };
    const requestCta = { label: "Request more credits", action: "request-credits" as QuotaAction };
    const raiseCta = { label: "Raise your limit", action: "members" as QuotaAction };

    if (poolBlocked) {
      return {
        level: "blocked",
        source: "pool",
        title: `${team.name} is out of credits`,
        body: canTopUp
          ? "Nothing can be generated until the pool is topped up. Auto top-up keeps this from happening again."
          : "Nothing can be generated until the owner or a billing contact tops up the pool. This isn't your personal limit.",
        cta: canTopUp ? topUpCta : { label: "Request a top-up", action: "request-credits" },
      };
    }

    if (memberBlocked) {
      return {
        level: "blocked",
        source: "member",
        title: "You've hit your monthly limit",
        body: `You've used all ${formatNumber(myLimit!.credits)} credits of your monthly limit. ${team.name} still has ${formatNumber(
          pool.remaining,
        )} left — this is your personal cap, not the team's. Resets on ${nextBill}.`,
        cta: canEditLimits ? raiseCta : requestCta,
      };
    }

    if (memberWarn) {
      return {
        level: "warn",
        source: "member",
        title: "You're close to your monthly limit",
        body: `${formatNumber(myUsed)} of ${formatNumber(myLimit!.credits)} credits used this month. ${
          myLimit!.mode === "hard" ? "New work is blocked once you reach it." : "You can keep working past it while the team has credits."
        } Resets on ${nextBill}.`,
        cta: canEditLimits ? raiseCta : requestCta,
      };
    }

    if (pool.alert === "warn") {
      return {
        level: "warn",
        source: "pool",
        title: `${team.name} has used ${Math.round(pool.usedPct * 100)}% of this cycle's credits`,
        body: `${formatNumber(pool.remaining)} credits left. Subscription credits reset on ${nextBill} and don't roll over.`,
        cta: canTopUp ? { label: "Top up credits", action: "topup" } : { label: "Request a top-up", action: "request-credits" },
      };
    }

    return { level: "ok", source: null, title: "", body: "", cta: null };
  }, [pool, myLimit, myUsed, team.name, nextBill, canTopUp, canEditLimits]);

  /** 旧接口:canvas 页的拦截弹窗仍读这个,由 quotaState 派生 */
  const quotaBlock = useMemo<QuotaBlock>(() => {
    if (quotaState.level !== "blocked") return null;
    return {
      kind: quotaState.source === "pool" ? "pool" : "member-hard",
      title: quotaState.title,
      body: quotaState.body,
    };
  }, [quotaState]);

  const patchTeam = useCallback(
    (patch: Partial<Team>) => setTeams((prev) => prev.map((t) => (t.id === activeTeamId ? { ...t, ...patch } : t))),
    [activeTeamId],
  );
  const patchMembers = useCallback(
    (fn: (list: Member[]) => Member[]) =>
      setMembersByTeam((prev) => ({ ...prev, [activeTeamId]: fn(prev[activeTeamId] ?? []) })),
    [activeTeamId],
  );

  /**
   * 每个改动都往日志里记一条 —— 评审第 7 项。
   * 演示时点什么都能立刻在 Activity 里看到,才不像个贴了假数据的页面。
   */
  const logActivity = useCallback(
    (action: string, kind: ActivityKind, teamId = activeTeamId) => {
      const entry: ActivityEntry = { id: `a-${Date.now().toString(36)}`, at: "Just now", actor: CURRENT_USER.name, action, kind };
      setActivityByTeam((prev) => ({ ...prev, [teamId]: [entry, ...(prev[teamId] ?? [])] }));
    },
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
      setActivityByTeam((prev) => ({
        ...prev,
        [id]: [{ id: `a-${Date.now().toString(36)}`, at: "Just now", actor: CURRENT_USER.name, action: `created ${name}`, kind: "team" }],
      }));
      setRequestsByTeam((prev) => ({ ...prev, [id]: [] }));
      setActiveTeamIdState(id);
      setRoleOverrideState(null);
      setSeatsFullOverrideState(false);
      setPoolLevelState("normal");
      setMyLimitFullState(false);
      // 手动建完团队就不再是「刚注册」了,否则新团队会被藏起来
      setNoTeamsState(false);
      showToast(`${name} created. You're the owner.`);
    },
    [teams.length, showToast],
  );

  const renameTeam = useCallback(
    (name: string) => {
      patchTeam({ name });
      logActivity(`renamed the team to ${name}`, "team");
      showToast("Team details saved.");
    },
    [patchTeam, logActivity, showToast],
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
      logActivity(`transferred ownership to ${target?.name ?? "a member"}`, "role");
      showToast(`${target?.name ?? "Member"} is now the owner. You're an admin.`);
    },
    [members, patchMembers, logActivity, showToast],
  );

  const addSeats = useCallback(
    (n: number) => {
      patchTeam({ seatsTotal: team.seatsTotal + n });
      setSeatsFullOverrideState(false);
      logActivity(`added ${n} seat${n > 1 ? "s" : ""} to ${planOf(team).name}`, "billing");
      showToast(`${n} seat${n > 1 ? "s" : ""} added to your plan.`);
    },
    [patchTeam, team, logActivity, showToast],
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
      logActivity(`switched the plan to ${next.name}`, "billing");
      showToast(`Switched to ${next.name}.`);
    },
    [patchTeam, team.seatsTotal, logActivity, showToast],
  );

  const cancelPlan = useCallback(() => {
    patchTeam({ planId: "starter" });
    logActivity("cancelled the subscription", "billing");
    showToast("Plan cancelled. It stays active until the end of the cycle.");
  }, [patchTeam, logActivity, showToast]);

  /** 充值积分单独入账,12 个月过期 */
  const buyCredits = useCallback(
    (credits: number) => {
      patchTeam({ topupRemaining: team.topupRemaining + credits, topupExpires: "Aug 2027" });
      setPoolLevelState("normal");
      logActivity(`bought ${formatNumber(credits)} top-up credits`, "credits");
      showToast(`${formatNumber(credits)} top-up credits added.`);
    },
    [patchTeam, team.topupRemaining, logActivity, showToast],
  );

  const addBillingContact = useCallback(
    (email: string) => {
      if (team.billingContacts.includes(email)) return;
      patchTeam({ billingContacts: [...team.billingContacts, email] });
      logActivity(`added ${email} as a billing contact`, "billing");
      showToast(`${email} will receive invoices and quota alerts.`);
    },
    [patchTeam, team.billingContacts, logActivity, showToast],
  );

  const removeBillingContact = useCallback(
    (email: string) => {
      patchTeam({ billingContacts: team.billingContacts.filter((e) => e !== email) });
      logActivity(`removed ${email} as a billing contact`, "billing");
      showToast("Billing contact removed.");
    },
    [patchTeam, team.billingContacts, logActivity, showToast],
  );

  const updateAutoTopUp = useCallback(
    (patch: Partial<AutoTopUp>) => {
      patchTeam({ autoTopUp: { ...team.autoTopUp, ...patch } });
      if (patch.enabled === true) {
        setAutoStateState("active");
        logActivity(
          `turned on auto top-up — ${formatNumber(patch.amount ?? team.autoTopUp.amount)} credits below ${formatNumber(
            patch.threshold ?? team.autoTopUp.threshold,
          )}`,
          "credits",
        );
      } else if (patch.enabled === false) {
        logActivity("turned off auto top-up", "credits");
      }
    },
    [patchTeam, team.autoTopUp, logActivity],
  );

  const retryAutoTopUp = useCallback(() => {
    setAutoStateState("active");
    patchTeam({
      autoTopUp: { ...team.autoTopUp, status: "active", failures: 0, failureReason: undefined },
      topupRemaining: team.topupRemaining + team.autoTopUp.amount,
    });
    logActivity(`retried auto top-up — ${formatNumber(team.autoTopUp.amount)} credits added`, "credits");
    showToast(`Auto top-up succeeded. ${formatNumber(team.autoTopUp.amount)} credits added.`);
  }, [patchTeam, team.autoTopUp, team.topupRemaining, logActivity, showToast]);

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
      logActivity(
        emails.length > 1
          ? `invited ${emails.length} people as ${inviteRole}s`
          : `invited ${emails[0]} as ${inviteRole === "admin" ? "an admin" : `a ${inviteRole}`}`,
        "member",
      );
      showToast(
        emails.length > 1
          ? `${emails.length} invitation emails sent. Ask them to check their inboxes.`
          : "Invitation email sent. Ask them to check their inbox.",
        "success",
      );
    },
    [patchMembers, logActivity, showToast],
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
      logActivity(`invited ${email} as a billing contact`, "member");
      showToast(`Invitation email sent to ${email}. It doesn't use a seat.`, "success");
    },
    [patchMembers, logActivity, showToast],
  );

  const removeMember = useCallback(
    (id: string) => {
      const target = members.find((mem) => mem.id === id);
      patchMembers((list) => list.filter((mem) => mem.id !== id));
      logActivity(`removed ${target?.name ?? "a member"} from the team`, "member");
      showToast(`${target?.name ?? "Member"} was removed from the team.`);
    },
    [members, patchMembers, logActivity, showToast],
  );

  const changeMemberRole = useCallback(
    (id: string, nextRole: Role) => {
      const target = members.find((mem) => mem.id === id);
      patchMembers((list) => list.map((mem) => (mem.id === id ? { ...mem, role: nextRole } : mem)));
      logActivity(
        `changed ${target?.name ?? "a member"}'s role from ${target ? target.role : "member"} to ${nextRole}`,
        "role",
      );
      showToast("Role updated.");
    },
    [members, patchMembers, logActivity, showToast],
  );

  const setMemberLimit = useCallback(
    (id: string, limit: MemberLimit | null) => {
      const target = members.find((mem) => mem.id === id);
      patchMembers((list) => list.map((mem) => (mem.id === id ? { ...mem, limit } : mem)));
      logActivity(
        limit
          ? `set ${target?.name ?? "a member"}'s monthly limit to ${formatNumber(limit.credits)} credits (${limit.mode} cap)`
          : `removed ${target?.name ?? "a member"}'s monthly limit`,
        "limit",
      );
      showToast(
        limit
          ? `${target?.name ?? "Member"} capped at ${formatNumber(limit.credits)} credits per month (${limit.mode}).`
          : `${target?.name ?? "Member"} is now uncapped.`,
      );
    },
    [members, patchMembers, logActivity, showToast],
  );

  const revokeInvite = useCallback(
    (id: string) => {
      const target = members.find((mem) => mem.id === id);
      patchMembers((list) => list.filter((mem) => mem.id !== id));
      logActivity(`revoked the invitation for ${target?.email ?? "a member"}`, "member");
      showToast("Invitation revoked.");
    },
    [members, patchMembers, logActivity, showToast],
  );

  const resendInvite = useCallback(
    (id: string) => {
      const target = members.find((mem) => mem.id === id);
      patchMembers((list) => list.map((mem) => (mem.id === id ? { ...mem, status: "invited" as const, joinedAt: "Aug 05, 2026" } : mem)));
      logActivity(`resent the invitation to ${target?.email ?? "a member"}`, "member");
      showToast(`Invitation resent to ${target?.email ?? "member"}.`);
    },
    [members, patchMembers, logActivity, showToast],
  );

  /* ---------- 申请回路 ---------- */

  /** credits / seats 归 Owner 与账单联系人;limit 归 Owner 与 Admin */
  const inboxRequests = useMemo(
    () =>
      // 注意:这里故意不排除「自己提的申请」。演示时是同一个人在切角色,
      // 排掉之后 Member 提交 → 切 Owner 审批这条回路就演不出来了。
      requests.filter((req) => {
        if (req.status !== "pending") return false;
        if (req.kind === "limit") return role === "owner" || role === "admin";
        return role === "owner" || role === "finance";
      }),
    [requests, role],
  );

  /**
   * 防刷:同一人同类型只要还有一条在等处理,就不能再提。
   * 已处理 / 已拒绝 / 已失效的都不占冷却 —— 被拒了应该允许补充理由再提一次。
   */
  const isRequestCoolingDown = useCallback(
    (kind: TeamRequest["kind"]) =>
      requests.some((req) => req.fromId === CURRENT_USER_ID && req.kind === kind && req.status === "pending"),
    [requests],
  );

  const submitRequest = useCallback(
    ({ kind, amount, reason }: { kind: TeamRequest["kind"]; amount?: number; reason?: string }) => {
      if (isRequestCoolingDown(kind)) {
        showToast("You already have a request like this waiting for a decision.");
        return;
      }
      const req: TeamRequest = {
        id: `r-${Date.now().toString(36)}`,
        kind,
        fromId: CURRENT_USER_ID,
        fromName: CURRENT_USER.name,
        amount,
        reason,
        at: "Just now",
        status: "pending",
      };
      setRequestsByTeam((prev) => ({ ...prev, [activeTeamId]: [req, ...(prev[activeTeamId] ?? [])] }));
      const who = kind === "limit" ? "the owner and admins" : "the owner and billing contacts";
      showToast(`Request sent to ${who}. They'll see it in their notifications.`, "success");
    },
    [activeTeamId, isRequestCoolingDown, showToast],
  );

  const approveRequest = useCallback(
    (id: string) => {
      const req = requests.find((r) => r.id === id);
      if (!req) return;
      setRequestsByTeam((prev) => ({
        ...prev,
        [activeTeamId]: (prev[activeTeamId] ?? []).map((r) => (r.id === id ? { ...r, status: "approved" as const } : r)),
      }));
      if (req.kind === "credits") {
        const credits = req.amount ?? 10_000;
        patchTeam({ topupRemaining: team.topupRemaining + credits, topupExpires: "Aug 2027" });
        setPoolLevelState("normal");
        logActivity(`approved ${req.fromName}'s request and added ${formatNumber(credits)} credits`, "credits");
        showToast(`Approved. ${formatNumber(credits)} credits added for ${req.fromName}.`, "success");
      } else if (req.kind === "seats") {
        const n = req.amount ?? 1;
        patchTeam({ seatsTotal: team.seatsTotal + n });
        setSeatsFullOverrideState(false);
        logActivity(`approved ${req.fromName}'s request and added ${n} seat${n > 1 ? "s" : ""}`, "billing");
        showToast(`Approved. ${n} seat${n > 1 ? "s" : ""} added.`, "success");
      } else {
        logActivity(`reviewed ${req.fromName}'s limit request`, "limit");
        setSettingsOpen("members");
      }
    },
    [requests, activeTeamId, patchTeam, team.topupRemaining, team.seatsTotal, logActivity, showToast],
  );

  const dismissRequest = useCallback(
    (id: string) => {
      setRequestsByTeam((prev) => ({
        ...prev,
        [activeTeamId]: (prev[activeTeamId] ?? []).map((r) => (r.id === id ? { ...r, status: "dismissed" as const } : r)),
      }));
      showToast("Request dismissed. They were notified.");
    },
    [activeTeamId, showToast],
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
      teams: visibleTeams,
      teamsOnly,
      personalTeam,
      hasTeams,
      team: { ...team, autoTopUp },
      plan: planOf(team),
      nextBill,
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
      quotaState,
      quotaBlock,
      canSeeTeammateUsage,
      openUsage,
      setOpenUsage: (v: boolean) => {
        setOpenUsageState(v);
        logActivity(v ? "made teammate usage visible to all members" : "restricted teammate usage to owners and admins", "team");
      },
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
      requests,
      inboxRequests,
      submitRequest,
      isRequestCoolingDown,
      requestCooldownHours: REQUEST_COOLDOWN_HOURS,
      approveRequest,
      dismissRequest,
      requestModal,
      openRequestModal: (kind: TeamRequest["kind"]) => setRequestModal(kind),
      closeRequestModal: () => setRequestModal(false),
      activity,
      canSeeActivity,
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
      noTeams,
      setNoTeams: setNoTeamsState,
      settingsOpen,
      openSettings: (tab: SettingsTab = "general") => setSettingsOpen(tab),
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
      visibleTeams, teamsOnly, personalTeam, hasTeams, noTeams,
      team, autoTopUp, nextBill, role, pool, seatsUsed, seatsTotal, seatsFull, members, memberCount, roleIn,
      myLimit, myUsed, quotaState, quotaBlock, canSeeTeammateUsage, openUsage, logActivity, setActiveTeamId, createTeam, renameTeam,
      setTeamColor, deleteTeam, leaveTeam, transferOwnership, addSeats, changePlan, cancelPlan, addBillingContact,
      removeBillingContact, updateAutoTopUp, retryAutoTopUp, buyCredits, inviteMembers, inviteFinance, removeMember,
      changeMemberRole, setMemberLimit, revokeInvite, resendInvite, requests, inboxRequests, submitRequest, isRequestCoolingDown,
      approveRequest, dismissRequest, requestModal, activity, canSeeActivity, roleOverride, seatsFullOverride,
      poolLevel, myLimitFull, autoState, settingsOpen, accountOpen, createTeamOpen, toast, toastTone, showToast,
    ],
  );

  // 演示状态存在 localStorage,恢复要等一帧。不等就渲染的话首帧是「真实角色」,
  // 走查时会看到角色从 Member 闪回 Admin —— 评审第 8 项就是这个。
  if (!hydrated) return null;

  return <TeamCtx.Provider value={value}>{children}</TeamCtx.Provider>;
}

export function useTeam() {
  const ctx = useContext(TeamCtx);
  if (!ctx) throw new Error("useTeam must be used inside TeamProvider");
  return ctx;
}

export { CURRENT_USER_ID, CREDIT_PACKS, SEAT_PRICE };
