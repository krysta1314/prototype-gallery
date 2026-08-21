"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  ACTIVITY_BY_TEAM,
  CREDIT_PACKS,
  CURRENT_USER,
  CURRENT_USER_ID,
  formatNumber,
  MEMBERS_BY_TEAM,
  CYCLE_START,
  DEFAULT_PERMISSIONS,
  DEFAULT_TEAM_PLAN_ID,
  PERMISSION_ROWS,
  ROLE_LABEL,
  NEXT_BILL,
  PLANS,
  planOf,
  REQUEST_COOLDOWN_HOURS,
  REQUESTS_BY_TEAM,
  seatPriceOf,
  seatCreditsOf,
  isPoolTeam,
  takesPaidSeat,
  TEAMS,
  PENDING_TEAM_KEY,
  type ActivityEntry,
  type ActivityKind,
  type AutoTopUp,
  type CreditModel,
  type Member,
  type Allocation,
  type PlanId,
  type Role,
  type Team,
  type TeamRequest,
  type PendingTeam,
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
  myAllocationFull: boolean;
  autoState: AutoState;
  /** 演示「刚注册,还没有任何团队」 */
  noTeams: boolean;
};

/**
 * 「我现在还能花多少」的实时读数（含演示档位覆盖）。
 *
 * per-seat 团队（个人 / Team / Scale）读的是**我这个席位**：固定额度 − 我已用 + 买给我席位的 top-up。
 * pool 团队（Enterprise）读的是**组织共享池**。
 *
 * 两种模型共用同一组字段名,所以顶栏胶囊、告警横幅、拦截弹窗不用各写一套。
 */
type Quota = {
  model: CreditModel;
  /** 本周期额度总量:per-seat = 每席固定额度;pool = 池月度额度 */
  total: number;
  used: number;
  /** total − used,不含 top-up */
  remaining: number;
  /** top-up 余额:per-seat = 买给这个席位的;pool = 充进池的 */
  topupRemaining: number;
  /** 可用总额 = remaining + topupRemaining */
  available: number;
  /** 已用百分比,阈值告警看这个 */
  usedPct: number;
  /** 80% / 100% 告警态 */
  alert: null | "warn" | "full";
};

/**
 * 额度状态 —— 评审第三节的核心。
 * 关键点是 source:「团队池空了」和「你个人上限到了」解法完全不同,
 * 界面必须让用户一眼看出该找谁,所以横幅 / Create 按钮 / 拦截弹窗都读这一份。
 */
/**
 * seat  = per-seat 团队里「我这个席位的固定额度」用完了 —— 团队没有池可以兑,只能加油或升档
 * pool  = Enterprise 的组织共享池空了
 * member = Enterprise 里「管理员分配给我的额度」用完了,但池还有钱
 */
/**
 * 告警类通知 —— 与申请并列进铃铛。
 * kind 决定图标与点击后去哪:quota 打开 Credits 页,autotopup 打开 Top-up 页。
 */
export type TeamAlert = {
  id: string;
  kind: "quota" | "autotopup";
  tone: "warn" | "bad";
  title: string;
  body: string;
  /** 点它跳去哪个设置页 */
  tab: SettingsTab;
};

export type QuotaSource = "seat" | "pool" | "member";

/** topup = 买 top-up;members = 去成员页改分配;request-credits = 提申请;upgrade = 换更高档 */
export type QuotaAction = "topup" | "members" | "request-credits" | "upgrade";

export type QuotaState = {
  level: "ok" | "warn" | "blocked";
  source: QuotaSource | null;
  title: string;
  body: string;
  cta: { label: string; action: QuotaAction } | null;
};

type QuotaBlock = { kind: "seat" | "member-hard" | "pool"; title: string; body: string } | null;

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
  /** 当前账期起点,账单页显示 "Current cycle: A – B" */
  cycleStart: string;
  role: Role;
  quota: Quota;
  /**
   * 查某个作者现在归谁 —— 传原作者 id,返回现任归属人 id。
   * 没被移除过就返回原 id,所以调用方可以无条件套一层。
   */
  ownerOf: (authorId: string) => string;
  /** true = Enterprise 共享池模型;false = 每席固定额度 */
  isPool: boolean;
  /** per-seat 模型下每席位的月度固定额度（pool 模型无意义,返回 0） */
  seatCredits: number;
  /** 给某个席位买 top-up —— 两种模型都可以按人充,买给谁归谁、不共享不回流 */
  buySeatTopUp: (memberId: string, credits: number) => void;
  /** pool 模型:成员未用完的分配额度是否回流池中 */
  setPourOver: (on: boolean) => void;
  seatsUsed: number;
  seatsTotal: number;
  seatsFull: boolean;
  isPersonal: boolean;
  members: Member[];
  /** 在职成员数 */
  memberCount: (teamId: string) => number;
  roleIn: (teamId: string) => Role;
  /** 当前用户的月度上限与用量 */
  myAllocation: Allocation | null;
  myUsed: number;
  /** 三档额度状态(ok / warn / blocked)+ 来源,横幅与 Create 按钮都读它 */
  quotaState: QuotaState;
  /**
   * 执行额度横幅 / 拦截弹窗上那颗 CTA。
   * 原来这段分派在 5 个页面里各写一份,`request-credits` 一律提 topup、
   * `upgrade` 没人处理 —— 收进这里一份,免得再走偏。
   */
  runQuotaAction: (action?: QuotaAction) => void;
  /** 撞到硬上限或池空时的拦截信息,null = 放行 */
  quotaBlock: QuotaBlock;
  /** 当前角色能不能看别人的用量(评审第 3 项:Member 只看自己) */
  canSeeTeammateUsage: boolean;
  /** D2:团队级开关 —— 是否把用量对全员公开 */
  openUsage: boolean;
  setOpenUsage: (v: boolean) => void;
  setActiveTeamId: (id: string) => void;
  /**
   * 购买即建团队:付款成功后才落库,所以套餐与席位数是创建时的入参。
   * 购买流程本身已挪到订阅页(pricing 原型),这里保留能力,等两边要打通时直接调。
   */
  createTeam: (name: string, planId: PlanId, seats: number) => void;
  renameTeam: (name: string) => void;
  setTeamColor: (color: string) => void;
  /** 组织 logo —— 传 null 表示删掉,退回首字母方块 */
  setTeamLogo: (logo: string | null) => void;
  /** 安全设置 —— SSO / 2FA / 会话时长 */
  security: SecuritySettings;
  patchSecurity: (patch: Partial<SecuritySettings>) => void;
  deleteTeam: () => void;
  leaveTeam: () => void;
  transferOwnership: (memberId: string) => void;
  addSeats: (n: number) => void;
  /** 当前套餐还允许再加几个席位（Team 上限 9、Scale 30） */
  seatRoom: number;
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
  /**
   * 邀请成员。vacantSeatId = 让第一个被邀请的人接手某个空席位,
   * 连席位上剩下的额度一起拿走(per-seat 才有这回事)。不传就是开新席位、拿全新额度。
   */
  inviteMembers: (emails: string[], role: Role, vacantSeatId?: string) => void;
  inviteFinance: (email: string) => void;
  /**
   * 移除成员。heirId = 继承其团队画布与资产的人。
   * 画布仅创建者可编辑,所以成员一走,他建的团队画布就没人能改了 ——
   * 必须在移除的同一步指定继承人,否则会留下一批无主只读内容。
   */
  removeMember: (id: string, heirId: string) => void;
  changeMemberRole: (id: string, role: Role) => void;
  setAllocation: (id: string, limit: Allocation | null) => void;
  revokeInvite: (id: string) => void;
  resendInvite: (id: string) => void;
  /** 申请回路:Member / Admin 提交,Owner / Finance 审批 */
  requests: TeamRequest[];
  /**
   * 通知列表 —— 申请之外还有告警。
   * 评审说「邮件里已有 80% / 用尽 / 自动充值失败的告警,产品里只有申请一类」,
   * 所以这里把额度与自动充值状态派生成通知条目,与申请合并成一个列表。
   */
  alerts: TeamAlert[];
  /** 已读的告警 id —— 关掉抽屉不会丢,读过的沉到下面并去掉高亮 */
  readAlerts: string[];
  markAlertRead: (id: string) => void;
  markAllRead: () => void;
  /** 未读数 = 待办申请 + 未读告警 */
  unreadCount: number;
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
  /** rowId → 当前允许的角色(含 Owner / Admin 在权限页上做的改动) */
  permissions: Record<string, Role[]>;
  /** 某个能力当前角色(或指定角色)是否允许 */
  can: (rowId: string, who?: Role) => boolean;
  /** 改一格权限;Owner 能改 Admin / Billing Admin / Member 三列,Admin 只能改 Member 列 */
  setPermission: (rowId: string, who: Role, allowed: boolean) => void;
  /** 这一列当前用户能不能改 */
  canEditPermissionColumn: (who: Role) => boolean;
  /** 有没有偏离默认值 */
  permissionsDirty: boolean;
  resetPermissions: () => void;
  /** demo controls */
  roleOverride: Role | null;
  setRoleOverride: (role: Role | null) => void;
  seatsFullOverride: boolean;
  setSeatsFullOverride: (full: boolean) => void;
  poolLevel: PoolLevel;
  setPoolLevel: (level: PoolLevel) => void;
  myAllocationFull: boolean;
  setMyAllocationFull: (full: boolean) => void;
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
  toast: string | null;
  toastTone: "default" | "success";
  showToast: (message: string, tone?: "default" | "success") => void;
};

/**
 * 安全设置 —— SSO 与 SCIM 是 Enterprise 权益(定价页矩阵里就是这么卖的),
 * 强制 2FA 与会话时长所有付费团队都能用。
 */
export type SecuritySettings = {
  ssoProvider: "none" | "okta" | "entra" | "google" | "custom";
  ssoEnforced: boolean;
  scimEnabled: boolean;
  require2fa: boolean;
  /** 多少天不活动就自动登出 */
  sessionDays: number;
};

export const DEFAULT_SECURITY: SecuritySettings = {
  ssoProvider: "none",
  ssoEnforced: false,
  scimEnabled: false,
  require2fa: false,
  sessionDays: 30,
};

export type SettingsTab = "general" | "members" | "permissions" | "security" | "credits" | "topup" | "billing" | "activity";

/** ?settings=<tab> 的白名单 —— 订阅成功回跳时用它决定开哪一页 */
const SETTINGS_TABS: SettingsTab[] = ["general", "members", "permissions", "security", "credits", "topup", "billing", "activity"];

const TeamCtx = createContext<Ctx | null>(null);

/** rowId → 允许的角色(默认值叠加该团队的覆盖) */
function permissionsFor(teamId: string, overrides: Record<string, Record<string, Role[]>>): Record<string, Role[]> {
  const forTeam = overrides[teamId] ?? {};
  return Object.fromEntries(PERMISSION_ROWS.map((row) => [row.id, forTeam[row.id] ?? DEFAULT_PERMISSIONS[row.id]!]));
}

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const [teams, setTeams] = useState<Team[]>(TEAMS);
  const [membersByTeam, setMembersByTeam] = useState<Record<string, Member[]>>(MEMBERS_BY_TEAM);
  const [activityByTeam, setActivityByTeam] = useState<Record<string, ActivityEntry[]>>(ACTIVITY_BY_TEAM);
  const [requestsByTeam, setRequestsByTeam] = useState<Record<string, TeamRequest[]>>(REQUESTS_BY_TEAM);
  const [activeTeamId, setActiveTeamIdState] = useState(TEAMS[1]!.id);
  const [roleOverride, setRoleOverrideState] = useState<Role | null>(null);
  const [seatsFullOverride, setSeatsFullOverrideState] = useState(false);
  const [poolLevel, setPoolLevelState] = useState<PoolLevel>("normal");
  const [myAllocationFull, setMyAllocationFullState] = useState(false);
  const [autoState, setAutoStateState] = useState<AutoState>("active");
  /** 演示「刚注册」:把所有团队藏起来,只剩个人账户 */
  const [noTeams, setNoTeamsState] = useState(false);
  /** 权限覆盖:teamId → rowId → 角色列表。只存被改过的行,其余读默认值 */
  const [permissionOverrides, setPermissionOverrides] = useState<Record<string, Record<string, Role[]>>>({});
  /**
   * 画布 / 资产的归属改写记录:`teamId:离开者id` → 继承人 id。
   * Canvas 与 Assets 页渲染作者时先查这张表,所以移除成员后那些作品会立刻改挂到继承人名下。
   */
  const [canvasHeirs, setCanvasHeirs] = useState<Record<string, string>>({});
  /** 已读的告警 id —— 只在会话内保留,够演示「读过就不再高亮」 */
  const [readAlerts, setReadAlerts] = useState<string[]>([]);
  /** D2:Owner 可以选择把用量对全员公开。默认关 —— 企业客户要的是默认收敛 */
  const [openUsage, setOpenUsageState] = useState(false);
  /** 安全设置按团队存 —— 切团队不会把别人的 SSO 配置带过来 */
  const [securityByTeam, setSecurityByTeam] = useState<Record<string, SecuritySettings>>({});
  const [settingsOpen, setSettingsOpen] = useState<false | SettingsTab>(false);
  const [accountOpen, setAccountOpen] = useState<false | AccountTab>(false);
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
          if (typeof saved.myAllocationFull === "boolean") setMyAllocationFullState(saved.myAllocationFull);
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
      if (limit) setMyAllocationFullState(limit === "full");
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
    const payload: Persisted = { activeTeamId, roleOverride, seatsFull: seatsFullOverride, poolLevel, myAllocationFull, autoState, noTeams };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* ignore */
    }
  }, [hydrated, activeTeamId, roleOverride, seatsFullOverride, poolLevel, myAllocationFull, autoState, noTeams]);

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
  const cycleStart = CYCLE_START[team.id] ?? "Aug 5, 2026";

  const isPool = isPoolTeam(team);
  const me = members.find((mem) => mem.id === CURRENT_USER_ID);

  /**
   * 额度读数按模型分叉。
   * 演示档位（?pool=warn / full）两种模型都生效 —— per-seat 推的是我这个席位,pool 推的是组织池。
   */
  const quota = useMemo<Quota>(() => {
    const total = isPool ? team.poolTotal : seatCreditsOf(team);
    const baseUsed = isPool ? team.poolUsed : me?.usedThisCycle ?? 0;
    const used = poolLevel === "warn" ? Math.round(total * 0.82) : poolLevel === "full" ? total : baseUsed;
    const baseTopUp = isPool ? team.topupRemaining : me?.seatTopUp ?? 0;
    const topupRemaining = poolLevel === "full" ? 0 : baseTopUp;
    const remaining = Math.max(0, total - used);
    return {
      model: team.creditModel,
      total,
      used,
      remaining,
      topupRemaining,
      available: remaining + topupRemaining,
      usedPct: total === 0 ? 0 : used / total,
      alert: used >= total ? "full" : used / total >= 0.8 ? "warn" : null,
    };
  }, [isPool, team, me?.usedThisCycle, me?.seatTopUp, poolLevel]);

  /**
   * 分配额度只在 pool 团队存在 —— per-seat 团队每席固定,管理员无从分配,所以恒为 null。
   * 演示:强制把分配额度推到用满(没设分配时临时给一个 hard 20,000)
   */
  const myAllocation: Allocation | null = !isPool
    ? null
    : myAllocationFull
      ? me?.allocation ?? { credits: 20_000, mode: "hard" }
      : me?.allocation ?? null;
  const myUsed = myAllocationFull && myAllocation ? myAllocation.credits : me?.usedThisCycle ?? 0;

  // 这两个从权限矩阵读,所以权限页上的改动会真的影响按钮可用性
  const canTopUp = (permissionsFor(team.id, permissionOverrides)["credits.buy"] ?? []).includes(role);
  const canEditAllocations = (permissionsFor(team.id, permissionOverrides)["limits.set"] ?? []).includes(role);
  // 默认只有 Owner / Admin / Finance 能看别人的用量;Owner 打开开关后对全员公开
  const canSeeTeammateUsage =
    (permissionsFor(team.id, permissionOverrides)["usage.seeAll"] ?? []).includes(role) || openUsage;
  const canSeeActivity =
    !team.personal && (permissionsFor(team.id, permissionOverrides)["activity.read"] ?? []).includes(role);

  /** 默认值 + 当前团队的覆盖 */
  const permissions = useMemo(() => permissionsFor(team.id, permissionOverrides), [permissionOverrides, team.id]);

  const can = useCallback(
    (rowId: string, who: Role = role) => (permissions[rowId] ?? DEFAULT_PERMISSIONS[rowId] ?? []).includes(who),
    [permissions, role],
  );

  /** 防提权:Owner 列永远不可改;Admin 只能改 Member 列,不能给自己加权限 */
  const canEditPermissionColumn = useCallback(
    (who: Role) => {
      if (who === "owner") return false;
      if (!can("permissions.edit")) return false;
      if (role === "owner") return true;
      return who === "member";
    },
    [can, role],
  );


  const permissionsDirty = useMemo(() => {
    const overrides = permissionOverrides[team.id] ?? {};
    return PERMISSION_ROWS.some((row) => {
      const current = overrides[row.id];
      if (!current) return false;
      const base = DEFAULT_PERMISSIONS[row.id]!;
      return current.length !== base.length || current.some((item) => !base.includes(item));
    });
  }, [permissionOverrides, team.id]);


  /**
   * 告警态按额度模型分两套。
   *
   * per-seat 团队（个人 / Team / Scale）：只有「我这个席位」一种来源。
   *   团队没有池可以兑,别人剩的额度也借不到,所以撞墙后的出口只有两条 ——
   *   给这个席位买 top-up（有权限的人），或者等下个账单日重置 / 升档。
   *
   * pool 团队（Enterprise）：三种来源,优先级 池空 > 我的分配用尽 > 我的分配吃紧 > 池吃紧。
   *   池空排最前是因为放宽分配也救不了;分配 80% 排在池 80% 前面是因为它更贴身、更可行动。
   */
  const quotaState = useMemo<QuotaState>(() => {
    const blocked = quota.available <= 0;
    const requestTopUp = { label: "Request a top-up", action: "request-credits" as QuotaAction };
    const buyTopUp = { label: "Top up this seat", action: "topup" as QuotaAction };
    const upgradeCta = { label: "See plans", action: "upgrade" as QuotaAction };

    /* ---------- per-seat：额度绑在席位上 ---------- */
    if (!isPool) {
      const resetLine = team.personal ? "" : ` Resets on ${nextBill}.`;
      if (blocked) {
        return {
          level: "blocked",
          source: "seat",
          title: "You've used all your credits this month",
          body: team.personal
            ? `All ${formatNumber(quota.total)} credits for this cycle are spent. Upgrade for a bigger monthly allowance.${resetLine}`
            : `All ${formatNumber(quota.total)} credits on your seat are spent. Credits are fixed per seat on ${
                planOf(team).name
              } — teammates' unused credits can't be transferred to you.${resetLine}`,
          cta: team.personal ? upgradeCta : canTopUp ? buyTopUp : requestTopUp,
        };
      }
      if (quota.alert === "warn") {
        return {
          level: "warn",
          source: "seat",
          title: `You've used ${Math.round(quota.usedPct * 100)}% of your credits this month`,
          body: `${formatNumber(quota.available)} of ${formatNumber(quota.total)} left on your seat.${resetLine} Credits don't roll over.`,
          cta: team.personal ? upgradeCta : canTopUp ? buyTopUp : requestTopUp,
        };
      }
      return { level: "ok", source: null, title: "", body: "", cta: null };
    }

    /* ---------- pool（Enterprise）：池 + 按人分配 ---------- */
    const allocationBlocked = Boolean(myAllocation && myAllocation.mode === "hard" && myUsed >= myAllocation.credits);
    const allocationPct = myAllocation ? myUsed / myAllocation.credits : 0;
    const allocationWarn = Boolean(myAllocation) && allocationPct >= 0.8 && !allocationBlocked;

    const poolTopUp = { label: "Top up the pool", action: "topup" as QuotaAction };
    const raiseCta = { label: "Raise the allocation", action: "members" as QuotaAction };
    const requestMore = { label: "Request more credits", action: "request-credits" as QuotaAction };

    if (blocked) {
      return {
        level: "blocked",
        source: "pool",
        title: `${team.name} is out of credits`,
        body: canTopUp
          ? "Nothing can be generated until the shared pool is topped up. Auto top-up keeps this from happening again."
          : "Nothing can be generated until the owner or a billing admin tops up the shared pool. This isn't your allocation.",
        cta: canTopUp ? poolTopUp : requestTopUp,
      };
    }

    if (allocationBlocked) {
      return {
        level: "blocked",
        source: "member",
        title: "You've used your full allocation",
        body: `All ${formatNumber(myAllocation!.credits)} credits allocated to you this month are spent. ${
          team.name
        } still has ${formatNumber(quota.available)} in the pool — this is your allocation, not the pool.`,
        cta: canEditAllocations ? raiseCta : requestMore,
      };
    }

    if (allocationWarn) {
      return {
        level: "warn",
        source: "member",
        title: "You're close to your allocation",
        body: `${formatNumber(myUsed)} of ${formatNumber(myAllocation!.credits)} allocated credits used this month. ${
          myAllocation!.mode === "hard"
            ? "New work is blocked once you reach it."
            : "You can keep working past it while the pool lasts."
        } Resets on ${nextBill}.`,
        cta: canEditAllocations ? raiseCta : requestMore,
      };
    }

    if (quota.alert === "warn") {
      return {
        level: "warn",
        source: "pool",
        title: `${team.name} has used ${Math.round(quota.usedPct * 100)}% of this cycle's pool`,
        body: `${formatNumber(quota.available)} credits left in the shared pool. It resets on ${nextBill} and doesn't roll over.`,
        cta: canTopUp ? poolTopUp : requestTopUp,
      };
    }

    return { level: "ok", source: null, title: "", body: "", cta: null };
  }, [isPool, quota, myAllocation, myUsed, team, nextBill, canTopUp, canEditAllocations]);

  /** 旧接口:canvas 页的拦截弹窗仍读这个,由 quotaState 派生 */
  const quotaBlock = useMemo<QuotaBlock>(() => {
    if (quotaState.level !== "blocked") return null;
    return {
      kind: quotaState.source === "pool" ? "pool" : quotaState.source === "seat" ? "seat" : "member-hard",
      title: quotaState.title,
      body: quotaState.body,
    };
  }, [quotaState]);

  const patchTeam = useCallback(
    (patch: Partial<Team>) => setTeams((prev) => prev.map((t) => (t.id === activeTeamId ? { ...t, ...patch } : t))),
    [activeTeamId],
  );

  /**
   * 告警由状态派生,不额外存 —— 状态好了通知自然消失,不会留一堆过期告警。
   * 只给能处理的人看:额度告警给 Owner / Admin / Finance,自动充值只给能碰账单的人。
   */
  const alerts = useMemo<TeamAlert[]>(() => {
    if (team.personal) return [];
    const list: TeamAlert[] = [];
    const scope = isPool ? "the shared pool" : "your seat";
    if (quota.alert === "full") {
      list.push({
        id: `${team.id}:quota:full`,
        kind: "quota",
        tone: "bad",
        title: isPool ? `${team.name} is out of credits` : "Your seat is out of credits",
        body: `${formatNumber(quota.total)} credits for this cycle are spent. Nothing new can be generated until ${scope} is topped up or the cycle resets.`,
        tab: "credits",
      });
    } else if (quota.alert === "warn") {
      list.push({
        id: `${team.id}:quota:warn`,
        kind: "quota",
        tone: "warn",
        title: `${Math.round(quota.usedPct * 100)}% of this cycle's credits used`,
        body: `${formatNumber(quota.available)} left on ${scope}. Credits don't roll over.`,
        tab: "credits",
      });
    }
    // 自动充值是池级动作,只有 Enterprise 有
    if (isPool && canTopUp) {
      if (autoState === "paused") {
        list.push({
          id: `${team.id}:auto:paused`,
          kind: "autotopup",
          tone: "bad",
          title: "Auto top-up is paused",
          body: "The card was declined three times in a row. The pool will not refill until it is retried.",
          tab: "topup",
        });
      } else if (autoState === "cap") {
        list.push({
          id: `${team.id}:auto:cap`,
          kind: "autotopup",
          tone: "warn",
          title: "Auto top-up hit this month's cap",
          body: `${formatNumber(team.autoTopUp.monthlyCap)} of automatic top-ups already spent this month. Raise the cap or top up by hand.`,
          tab: "topup",
        });
      }
    }
    return list;
  }, [team, isPool, quota, autoState, canTopUp]);

  const markAlertRead = useCallback((id: string) => setReadAlerts((prev) => (prev.includes(id) ? prev : [...prev, id])), []);
  const markAllRead = useCallback(() => setReadAlerts((prev) => [...new Set([...prev, ...alerts.map((a) => a.id)])]), [alerts]);

  const runQuotaAction = useCallback(
    (action?: QuotaAction) => {
      const next = action ?? (canTopUp ? "topup" : "request-credits");
      if (next === "topup") setSettingsOpen("topup");
      else if (next === "members") setSettingsOpen("members");
      else if (next === "upgrade") {
        // 个人账户撞墙的出口是升档,不是充值
        if (team.personal) setAccountOpen("billing");
        else setSettingsOpen("billing");
      } else {
        // 申请:Enterprise 里被分配额度挡住的人该提「追加分配」,其余提 top-up
        setRequestModal(quotaState.source === "member" ? "limit" : "topup");
      }
    },
    [canTopUp, team.personal, quotaState.source],
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

  const setPermission = useCallback(
    (rowId: string, who: Role, allowed: boolean) => {
      const row = PERMISSION_ROWS.find((item) => item.id === rowId);
      if (!row) return;
      setPermissionOverrides((prev) => {
        const forTeam = prev[team.id] ?? {};
        const current = forTeam[rowId] ?? DEFAULT_PERMISSIONS[rowId]!;
        const next = allowed ? [...new Set([...current, who])] : current.filter((item) => item !== who);
        return { ...prev, [team.id]: { ...forTeam, [rowId]: next } };
      });
      logActivity(`${allowed ? "granted" : "removed"} "${row.label}" for ${ROLE_LABEL[who]}`, "role");
      showToast(`${ROLE_LABEL[who]} ${allowed ? "can now" : "can no longer"} ${row.label.toLowerCase()}.`);
    },
    [team.id, logActivity, showToast],
  );

  const resetPermissions = useCallback(() => {
    setPermissionOverrides((prev) => ({ ...prev, [team.id]: {} }));
    logActivity("reset role permissions to the defaults", "role");
    showToast("Permissions reset to the defaults.");
  }, [team.id, logActivity, showToast]);

  const setActiveTeamId = useCallback((id: string) => {
    setActiveTeamIdState(id);
    setRoleOverrideState(null);
    setSeatsFullOverrideState(false);
    setPoolLevelState("normal");
    setMyAllocationFullState(false);
    setAutoStateState("active");
  }, []);

  /**
   * 建团队 —— 只有一条路径:购买。
   * 向导走完「团队名 → 套餐 + 席位 → 付款」后才调到这里,所以团队一诞生就是付费的、
   * 席位已就位、可以直接邀请人。不存在「先建一个免费团队再升级」这个中间态。
   * 品牌色自动分配,不让用户在创建时选。
   */
  const createTeam = useCallback(
    (name: string, planId: PlanId, seats: number) => {
      const color = TEAM_COLORS[teams.length % TEAM_COLORS.length]!;
      const id = `t-${Date.now().toString(36)}`;
      const plan = PLANS.find((p) => p.id === planId) ?? PLANS.find((p) => p.id === DEFAULT_TEAM_PLAN_ID)!;
      // 席位不会低于套餐下限;向导里选的席位数在这里落地
      const seatsTotal = Math.max(plan.seatsMin, seats);
      setTeams((prev) => [
        ...prev,
        {
          id,
          name,
          personal: false,
          seatsTotal,
          planId: plan.id,
          // 自助购买只能买到 Team / Scale,两者都是 per-seat;Enterprise 由 sales 开户
          creditModel: plan.creditModel,
          poolTotal: plan.poolCredits,
          poolUsed: 0,
          topupRemaining: 0,
          topupExpires: "—",
          autoTopUp: { enabled: false, threshold: 5_000, amount: 20_000, monthlyCap: 100_000, spentThisMonth: 0, status: "active", failures: 0 },
          pourOver: false,
          aiTokens: 0,
          aiTokensTotal: plan.aiTokensTotal,
          color,
          billingContacts: [],
          vacantSeats: [],
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
            seatTopUp: 0,
            allocation: null,
            lastActiveDays: 0,
          },
        ],
      }));
      setActivityByTeam((prev) => ({
        ...prev,
        [id]: [
          { id: `a-${Date.now().toString(36)}`, at: "Just now", actor: CURRENT_USER.name, action: `created ${name}`, kind: "team" },
          {
            id: `a-${Date.now().toString(36)}-p`,
            at: "Just now",
            actor: CURRENT_USER.name,
            action: `subscribed to ${plan.name} with ${seatsTotal} seat${seatsTotal > 1 ? "s" : ""}`,
            kind: "billing",
          },
        ],
      }));
      setRequestsByTeam((prev) => ({ ...prev, [id]: [] }));
      setActiveTeamIdState(id);
      setRoleOverrideState(null);
      setSeatsFullOverrideState(false);
      setPoolLevelState("normal");
      setMyAllocationFullState(false);
      // 手动建完团队就不再是「刚注册」了,否则新团队会被藏起来
      setNoTeamsState(false);
      showToast(`${name} is on ${plan.name}. You're the owner — invite your team.`, "success");
    },
    [teams.length, showToast],
  );

  /**
   * 接住订阅页的交接 —— pricing 的收银台付款成功后,把刚买下的团队写进 localStorage
   * 然后带 ?settings=members 跳回这里。所以这里做两件事:
   * 1. 把那条 pending 落成真实团队(落完立刻清 key,刷新不会再建一次);
   * 2. 打开团队设置的 Members —— 付款后第一件事就是邀请人。
   *
   * 预览模式(?preview=1)不参与:那个模式的状态完全由 URL 决定,不读也不写本地存储。
   */
  useEffect(() => {
    if (!hydrated || previewMode) return;
    try {
      const raw = window.localStorage.getItem(PENDING_TEAM_KEY);
      if (raw) {
        window.localStorage.removeItem(PENDING_TEAM_KEY);
        const pending = JSON.parse(raw) as Partial<PendingTeam>;
        if (pending?.name) {
          createTeam(pending.name, (pending.planId ?? "team") as PlanId, Number(pending.seats) || 2);
        }
      }
      const tab = new URLSearchParams(window.location.search).get("settings");
      if (tab && SETTINGS_TABS.includes(tab as SettingsTab)) setSettingsOpen(tab as SettingsTab);
    } catch {
      /* ignore */
    }
    // 只在水合完成后跑一次 —— createTeam 会随 teams 变化重建,不该把它放进依赖
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, previewMode]);

  const security = securityByTeam[activeTeamId] ?? DEFAULT_SECURITY;

  const patchSecurity = useCallback(
    (patch: Partial<SecuritySettings>) => {
      setSecurityByTeam((prev) => ({
        ...prev,
        [activeTeamId]: { ...(prev[activeTeamId] ?? DEFAULT_SECURITY), ...patch },
      }));
    },
    [activeTeamId],
  );

  const setTeamLogo = useCallback(
    (logo: string | null) => {
      patchTeam({ logo: logo ?? undefined });
      logActivity(logo ? "updated the team logo" : "removed the team logo", "team");
      showToast(logo ? "Logo updated." : "Logo removed.");
    },
    [patchTeam, logActivity, showToast],
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

  /**
   * 加席位 —— 套餐的席位区间是硬上限。
   * Team 是 2–9,想要第 10 个人必须先升到 Scale;不能靠加席位绕过换档。
   */
  /**
   * 加席位。撞到套餐上限后的走法由 plan.beyondMax 决定:
   *   Team  → 上面还有 Scale,所以第 10 个人必须升档,这里直接把人送去 Billing
   *   Scale → 自助档的顶,允许按每席价继续买,并在界面上引导联系 sales 谈 Enterprise
   */
  const addSeats = useCallback(
    (n: number) => {
      const currentPlan = planOf(team);
      const overCap = team.seatsTotal + n > currentPlan.seatsMax;
      if (overCap && currentPlan.beyondMax === "upgrade") {
        showToast(`${currentPlan.name} tops out at ${currentPlan.seatsMax} seats. Move up a plan to add more.`);
        setSettingsOpen("billing");
        return;
      }
      patchTeam({ seatsTotal: team.seatsTotal + n });
      setSeatsFullOverrideState(false);
      logActivity(`added ${n} seat${n > 1 ? "s" : ""} to ${currentPlan.name}`, "billing");
      showToast(`${n} seat${n > 1 ? "s" : ""} added to your plan.`);
    },
    [patchTeam, team, logActivity, showToast],
  );

  /**
   * 席位还能加几个。beyondMax = "buy-seats" 的档没有硬上限（Scale 超 30 继续买),
   * 所以返回 Infinity;"upgrade" 的档返回到上限还差多少。
   */
  const seatRoom =
    planOf(team).beyondMax === "buy-seats" ? Infinity : Math.max(0, planOf(team).seatsMax - team.seatsTotal);

  const changePlan = useCallback(
    (planId: PlanId) => {
      const next = PLANS.find((p) => p.id === planId)!;
      patchTeam({
        planId,
        seatsTotal: Math.max(team.seatsTotal, next.seatsMin),
        // 换档会换额度模型 —— 升到 Enterprise 就从「每席固定」变成「共享池」
        creditModel: next.creditModel,
        poolTotal: next.poolCredits,
        aiTokensTotal: next.aiTokensTotal,
      });
      logActivity(`switched the plan to ${next.name}`, "billing");
      showToast(`Switched to ${next.name}.`);
    },
    [patchTeam, team.seatsTotal, logActivity, showToast],
  );

  /**
   * 取消订阅不会把团队打回 Free —— 团队没有免费档。
   * 只标记「账期结束时终止」,期间一切照常;真实实现里到期后团队转为只读/归档。
   */
  const cancelPlan = useCallback(() => {
    patchTeam({ cancelAtPeriodEnd: true });
    logActivity("cancelled the subscription", "billing");
    showToast("Plan cancelled. The team keeps access until the end of the cycle.");
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

  /**
   * 给指定席位买 top-up —— per-seat 团队撞墙后的唯一出口。
   * 它不是「分配」:分配的前提是有一池共享额度可切,这里是额外掏钱买的增量,
   * 买给谁就归谁、不共享、不回流、12 个月有效,该席位当月额度用尽后才开始扣。
   */
  /** 归属改写查询 —— 支持连环继承（A 走了给 B,B 又走了给 C,查 A 得到 C） */
  const ownerOf = useCallback(
    (authorId: string) => {
      let current = authorId;
      for (let hop = 0; hop < 8; hop += 1) {
        const next = canvasHeirs[`${activeTeamId}:${current}`];
        if (!next || next === current) break;
        current = next;
      }
      return current;
    },
    [canvasHeirs, activeTeamId],
  );

  const buySeatTopUp = useCallback(
    (memberId: string, credits: number) => {
      const target = members.find((mem) => mem.id === memberId);
      patchMembers((list) =>
        list.map((mem) => (mem.id === memberId ? { ...mem, seatTopUp: mem.seatTopUp + credits } : mem)),
      );
      if (memberId === CURRENT_USER_ID) {
        setPoolLevelState("normal");
        setMyAllocationFullState(false);
      }
      logActivity(`bought ${formatNumber(credits)} top-up credits for ${target?.name ?? "a member"}'s seat`, "credits");
      showToast(`${formatNumber(credits)} credits added to ${target?.name ?? "the member"}'s seat.`, "success");
    },
    [members, patchMembers, logActivity, showToast],
  );

  /** pour-over:成员没花完的分配额度月底是否回流池中（只有 pool 团队有这回事） */
  const setPourOver = useCallback(
    (on: boolean) => {
      patchTeam({ pourOver: on });
      logActivity(
        on ? "turned on pour-over — unspent allocations return to the pool" : "turned off pour-over",
        "credits",
      );
      showToast(on ? "Unspent allocations will return to the pool." : "Unspent allocations stay with the member.");
    },
    [patchTeam, logActivity, showToast],
  );

  const addBillingContact = useCallback(
    (email: string) => {
      if (team.billingContacts.includes(email)) return;
      patchTeam({ billingContacts: [...team.billingContacts, email] });
      logActivity(`added ${email} as a billing admin`, "billing");
      showToast(`${email} will receive invoices and quota alerts.`);
    },
    [patchTeam, team.billingContacts, logActivity, showToast],
  );

  const removeBillingContact = useCallback(
    (email: string) => {
      patchTeam({ billingContacts: team.billingContacts.filter((e) => e !== email) });
      logActivity(`removed ${email} as a billing admin`, "billing");
      showToast("Billing admin removed.");
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
    (emails: string[], inviteRole: Role, vacantSeatId?: string) => {
      const seat = vacantSeatId ? team.vacantSeats.find((item) => item.id === vacantSeatId) : undefined;
      patchMembers((list) => [
        ...emails.map((email, index) => ({
          id: `i-${Date.now()}-${index}`,
          name: email,
          email,
          role: inviteRole,
          status: "invited" as const,
          joinedAt: "Aug 05, 2026",
          color: "#9a9bb0",
          /*
           * 接手空席位的人不是从零开始:席位上剩下多少额度就归他多少,
           * 所以 usedThisCycle 记成「已被前任用掉的那部分」,他能花的就是剩下的。
           * 只有第一个邮箱接手（一个席位只能给一个人）。
           */
          usedThisCycle: index === 0 && seat ? Math.max(0, seatCreditsOf(team) - seat.creditsLeft) : 0,
          seatTopUp: index === 0 && seat ? seat.topUpLeft : 0,
          allocation: null,
          // 邀请还没接受,谈不上活跃过
          lastActiveDays: null,
        })),
        ...list,
      ]);
      if (seat) {
        // 席位被接手,从空席位列表里摘掉
        patchTeam({ vacantSeats: team.vacantSeats.filter((item) => item.id !== seat.id) });
        logActivity(
          `invited ${emails[0]} into ${seat.fromName}'s old seat — ${formatNumber(seat.creditsLeft)} credits carried over`,
          "member",
        );
      } else {
        logActivity(
          emails.length > 1
            ? `invited ${emails.length} people as ${inviteRole}s`
            : `invited ${emails[0]} as ${inviteRole === "admin" ? "an admin" : `a ${inviteRole}`}`,
          "member",
        );
      }
      showToast(
        seat
          ? `Invitation sent. ${emails[0]} takes over ${seat.fromName}'s seat with ${formatNumber(seat.creditsLeft)} credits left this cycle.`
          : emails.length > 1
            ? `${emails.length} invitation emails sent. Ask them to check their inboxes.`
            : "Invitation email sent. Ask them to check their inbox.",
        "success",
      );
    },
    [patchMembers, patchTeam, team, logActivity, showToast],
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
          lastActiveDays: null,
          usedThisCycle: 0,
          seatTopUp: 0,
          allocation: null,
        },
        ...list,
      ]);
      logActivity(`invited ${email} as a billing admin`, "member");
      showToast(`Invitation email sent to ${email}. It doesn't use a seat.`, "success");
    },
    [patchMembers, logActivity, showToast],
  );

  const removeMember = useCallback(
    (id: string, heirId: string) => {
      const target = members.find((mem) => mem.id === id);
      // 继承人必须是留下来的、能用产品的人;传进来的不合法就落回 Owner
      const heir =
        members.find((mem) => mem.id === heirId && mem.id !== id && mem.role !== "finance" && mem.status === "active") ??
        members.find((mem) => mem.role === "owner")!;
      patchMembers((list) => list.filter((mem) => mem.id !== id));
      setCanvasHeirs((prev) => ({ ...prev, [`${activeTeamId}:${id}`]: heir.id }));

      /*
       * per-seat 团队:credits 跟着席位走,不跟着人走。
       * 所以人走了,当月没花完的额度留在这个空席位上,等下一个人接手 ——
       * 既不作废(团队已经付过这笔钱),也不回流给别人(额度不能在人之间转)。
       * Enterprise 走共享池,额度本来就不挂席位,没有这一步。
       */
      if (!isPool && target && target.role !== "finance" && target.status === "active") {
        const creditsLeft = Math.max(0, seatCreditsOf(team) - target.usedThisCycle);
        if (creditsLeft > 0 || target.seatTopUp > 0) {
          patchTeam({
            vacantSeats: [
              ...team.vacantSeats,
              {
                id: `vs-${Date.now().toString(36)}`,
                fromName: target.name,
                creditsLeft,
                topUpLeft: target.seatTopUp,
                freedAt: "Just now",
              },
            ],
          });
        }
      }

      logActivity(
        `removed ${target?.name ?? "a member"} from the team — their projects and assets now belong to ${heir.name}`,
        "member",
      );
      showToast(`${target?.name ?? "Member"} removed. Their work now belongs to ${heir.name}.`, "success");
    },
    [members, patchMembers, patchTeam, activeTeamId, isPool, team, logActivity, showToast],
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

  const setAllocation = useCallback(
    (id: string, allocation: Allocation | null) => {
      const target = members.find((mem) => mem.id === id);
      patchMembers((list) => list.map((mem) => (mem.id === id ? { ...mem, allocation } : mem)));
      logActivity(
        allocation
          ? `allocated ${formatNumber(allocation.credits)} credits to ${target?.name ?? "a member"} (${allocation.mode} cap)`
          : `removed ${target?.name ?? "a member"}'s allocation`,
        "limit",
      );
      showToast(
        allocation
          ? `${target?.name ?? "Member"} is allocated ${formatNumber(allocation.credits)} credits a month (${allocation.mode} cap).`
          : `${target?.name ?? "Member"} now draws from the pool without an allocation.`,
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
      const who = kind === "limit" ? "the owner and admins" : "the owner and billing admins";
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
      if (req.kind === "topup") {
        const credits = req.amount ?? 50_000;
        if (isPool) {
          // pool 团队:充进共享池
          patchTeam({ topupRemaining: team.topupRemaining + credits, topupExpires: "Aug 2027" });
        } else {
          // per-seat 团队:钱只进申请人那个席位,不进任何池
          patchMembers((list) =>
            list.map((mem) => (mem.id === req.fromId ? { ...mem, seatTopUp: mem.seatTopUp + credits } : mem)),
          );
        }
        setPoolLevelState("normal");
        setMyAllocationFullState(false);
        logActivity(
          isPool
            ? `approved ${req.fromName}'s request and added ${formatNumber(credits)} credits to the pool`
            : `approved ${req.fromName}'s request and bought ${formatNumber(credits)} top-up credits for their seat`,
          "credits",
        );
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
      cycleStart,
      role,
      quota,
      ownerOf,
      isPool,
      seatCredits: isPool ? 0 : seatCreditsOf(team),
      buySeatTopUp,
      setPourOver,
      seatsUsed,
      seatsTotal,
      seatsFull,
      isPersonal: team.personal,
      members,
      memberCount,
      roleIn,
      myAllocation,
      myUsed,
      quotaState,
      alerts,
      readAlerts,
      markAlertRead,
      markAllRead,
      unreadCount: inboxRequests.length + alerts.filter((a) => !readAlerts.includes(a.id)).length,
      runQuotaAction,
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
      setTeamLogo,
      security,
      patchSecurity,
      setTeamColor,
      deleteTeam,
      leaveTeam,
      transferOwnership,
      addSeats,
      seatRoom,
      changePlan,
      cancelPlan,
      // 团队一律是付费的(购买即创建),所以只有个人空间没有订阅
      hasActiveSubscription: !team.personal,
      paymentMethod: !team.personal ? { brand: "Visa", last4: "4242" } : null,
      addBillingContact,
      removeBillingContact,
      updateAutoTopUp,
      retryAutoTopUp,
      buyCredits,
      inviteMembers,
      inviteFinance,
      removeMember,
      changeMemberRole,
      setAllocation,
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
      permissions,
      can,
      setPermission,
      canEditPermissionColumn,
      permissionsDirty,
      resetPermissions,
      roleOverride,
      setRoleOverride: setRoleOverrideState,
      seatsFullOverride,
      setSeatsFullOverride: setSeatsFullOverrideState,
      poolLevel,
      setPoolLevel: setPoolLevelState,
      myAllocationFull,
      setMyAllocationFull: setMyAllocationFullState,
      autoState,
      setAutoState: setAutoStateState,
      noTeams,
      setNoTeams: (v: boolean) => {
        setNoTeamsState(v);
        const target = v ? personalTeam : (teams.find((t) => !t.personal) ?? personalTeam);
        setActiveTeamIdState(target.id);
      },
      settingsOpen,
      openSettings: (tab: SettingsTab = "general") => setSettingsOpen(tab),
      closeSettings: () => setSettingsOpen(false),
      accountOpen,
      openAccount: (tab: AccountTab = "account") => {
        setSettingsOpen(false);
        setAccountOpen(tab);
      },
      closeAccount: () => setAccountOpen(false),
      toast,
      toastTone,
      showToast,
    }),
    [
      visibleTeams, teamsOnly, personalTeam, hasTeams, noTeams,
      team, autoTopUp, nextBill, role, quota, ownerOf, isPool, buySeatTopUp, setPourOver, seatsUsed, seatsTotal, seatsFull, members, memberCount, roleIn,
      myAllocation, myUsed, quotaState, alerts, readAlerts, markAlertRead, markAllRead, runQuotaAction, quotaBlock, canSeeTeammateUsage, openUsage, logActivity, setActiveTeamId, createTeam, renameTeam, setTeamLogo, security, patchSecurity,
      setTeamColor, deleteTeam, leaveTeam, transferOwnership, addSeats, seatRoom, changePlan, cancelPlan, addBillingContact,
      removeBillingContact, updateAutoTopUp, retryAutoTopUp, buyCredits, inviteMembers, inviteFinance, removeMember,
      changeMemberRole, setAllocation, revokeInvite, resendInvite, requests, inboxRequests, submitRequest, isRequestCoolingDown,
      approveRequest, dismissRequest, requestModal, activity, canSeeActivity, roleOverride, seatsFullOverride,
      poolLevel, myAllocationFull, autoState, settingsOpen, accountOpen, toast, toastTone, showToast,
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

export { CURRENT_USER_ID, CREDIT_PACKS, seatPriceOf };
