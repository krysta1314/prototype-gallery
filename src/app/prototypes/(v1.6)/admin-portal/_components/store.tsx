"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  ADMIN_ORGS,
  termEndLabel,
  TODAY_LABEL,
  type AdminOrg,
  type PaymentTerms,
  type ProvisionState,
} from "../data";

/**
 * Admin Portal 的可变状态。
 *
 * 为什么要有它:开户流程的关键一步是「确认收款」——它会把组织从
 * awaiting_payment 推到 active。这是一个真实会改数据的动作,所以
 * ADMIN_ORGS 那个 const 数组不够用,得有一层能改的 state。
 *
 * 只存在内存里,刷新回种子数据。真实实现当然要落库。
 */

/** 后台侧的操作留痕 —— 「谁把这单标成已收款」必须查得到 */
export type AdminLogEntry = { id: string; at: string; actor: string; action: string };

/**
 * 内部角色 —— 确认收款要双签,所以后台得知道「我现在是谁」。
 * sales 自己既开单又确认收款,等于自己签自己的收款单,这是审计上过不去的。
 */
export type StaffRole = "sales" | "finance";

export const STAFF: Record<StaffRole, string> = {
  sales: "Ivan Lau",
  finance: "Wendy Kwok",
};

export const STAFF_ROLE_LABEL: Record<StaffRole, string> = {
  sales: "Sales",
  finance: "Finance",
};

/** 演示里默认登录的内部同事 */
export const CURRENT_STAFF = STAFF.sales;

/** 收款双签的进度 —— 两边都签到才真正开通 */
export type PaymentApproval = { sales?: string; finance?: string };

/** 组织成员 —— 开通之后 sales 可以替客户先把人和额度配好 */
export type OrgMember = {
  email: string;
  role: "owner" | "admin" | "member";
  status: "active" | "invited";
  /** 从组织池里分给这个人的月度额度;null = 不设上限 */
  allocation: number | null;
};

export type NewOrgInput = {
  name: string;
  ownerEmail: string;
  seats: number;
  credits: number;
  mrr: number;
  tierName: string;
  paymentTerms: PaymentTerms;
  poNumber: string;
  termMonths: number;
  autoRenew: boolean;
};

type Ctx = {
  orgs: AdminOrg[];
  /** 当前以什么身份操作后台 —— 双签要靠它区分 sales 与财务 */
  staffRole: StaffRole;
  setStaffRole: (next: StaffRole) => void;
  staffName: string;
  approvalOf: (id: string) => PaymentApproval;
  /** 开户 —— 落成 awaiting_payment,不是直接开通 */
  createOrg: (input: NewOrgInput) => string;
  /**
   * 以当前身份签一次收款确认。两边都签到之后才真正开通 ——
   * 所以这个函数会被同一单调用两次,分别由 sales 与财务。
   */
  confirmPayment: (id: string) => void;
  setAutoRenew: (id: string, next: boolean) => void;
  assignSales: (id: string, rep: string) => void;
  renew: (id: string) => void;
  membersOf: (id: string) => OrgMember[];
  inviteMember: (id: string, email: string, role: OrgMember["role"]) => void;
  setAllocation: (id: string, email: string, allocation: number | null) => void;
  logOf: (id: string) => AdminLogEntry[];
};

const AdminContext = createContext<Ctx | null>(null);

/** 种子成员 —— 已开通的组织都至少有 Owner,数量由 id 推出来,确定性 */
function seedMembers(org: AdminOrg): OrgMember[] {
  if (org.provision !== "active") {
    // 还没开通就只有一个 Owner,而且是 invited —— 他还登不进去
    return [{ email: org.ownerEmail, role: "owner", status: "invited", allocation: null }];
  }
  const n = Number(org.id.replace(/\D/g, "")) || 1;
  const count = Math.min(org.seats, (n % 5) + 2);
  const domain = org.ownerEmail.split("@")[1] ?? "example.com";
  const names = ["rowan", "kenji", "priya", "mila", "tomas", "aisha"];
  return [
    { email: org.ownerEmail, role: "owner", status: "active", allocation: null },
    ...Array.from({ length: count - 1 }, (_, index) => ({
      email: `${names[(n + index) % names.length]}@${domain}`,
      role: (index === 0 ? "admin" : "member") as OrgMember["role"],
      status: "active" as const,
      // 一半的人设了分配额度,一半没设 —— 两种形态都要能看到
      allocation: index % 2 === 0 ? Math.round(org.credits / Math.max(2, count) / 100) * 100 : null,
    })),
  ];
}

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [orgs, setOrgs] = useState<AdminOrg[]>(ADMIN_ORGS);
  const [membersByOrg, setMembersByOrg] = useState<Record<string, OrgMember[]>>({});
  const [logByOrg, setLogByOrg] = useState<Record<string, AdminLogEntry[]>>({});
  const [staffRole, setStaffRole] = useState<StaffRole>("sales");
  const [approvals, setApprovals] = useState<Record<string, PaymentApproval>>({});

  const staffName = STAFF[staffRole];

  const patch = useCallback((id: string, next: Partial<AdminOrg>) => {
    setOrgs((prev) => prev.map((org) => (org.id === id ? { ...org, ...next } : org)));
  }, []);

  const log = useCallback(
    (id: string, action: string, actor = STAFF[staffRole]) => {
      setLogByOrg((prev) => ({
        ...prev,
        [id]: [
          { id: `l-${(prev[id]?.length ?? 0) + 1}`, at: "Just now", actor, action },
          ...(prev[id] ?? []),
        ],
      }));
    },
    [staffRole],
  );

  const createOrg = useCallback(
    (input: NewOrgInput) => {
      const id = `org-new-${input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      const org: AdminOrg = {
        id,
        name: input.name,
        plan: "Enterprise",
        // 钱没到之前组织还不算 active —— 状态跟着开通进度走,不提前粉饰
        status: "trial",
        seats: input.seats,
        credits: input.credits,
        used: 0,
        createdAt: TODAY_LABEL,
        // 生效日与到期日都等收款那天才定下来 —— 先写死会和实际不符
        effectiveAt: null,
        expiresAt: null,
        sales: CURRENT_STAFF,
        mrr: input.mrr,
        ownerEmail: input.ownerEmail,
        signedAt: TODAY_LABEL,
        termMonths: input.termMonths,
        autoRenew: input.autoRenew,
        provision: "awaiting_payment",
        paymentTerms: input.paymentTerms,
        poNumber: input.poNumber || undefined,
        activatedAt: null,
      };
      setOrgs((prev) => [org, ...prev]);
      setMembersByOrg((prev) => ({ ...prev, [id]: seedMembers(org) }));
      log(
        id,
        `opened ${input.name} on ${input.tierName} — ${input.seats} seats, ${input.credits.toLocaleString("en-US")} pooled credits, awaiting payment`,
      );
      return id;
    },
    [log],
  );

  /**
   * 确认收款 —— 整条开户流程的分水岭。这一步之后:
   * Owner 收到激活邮件、能登录 buzzvideo、订阅显示 Enterprise、可以邀请人并分配额度。
   * 所以生效日与到期日也是在这一刻才落定。
   */
  const confirmPayment = useCallback(
    (id: string) => {
      const org = orgs.find((item) => item.id === id);
      if (!org || org.provision === "active") return;

      const current = approvals[id] ?? {};
      if (current[staffRole]) return; // 同一个人别签两次
      const next: PaymentApproval = { ...current, [staffRole]: STAFF[staffRole] };
      setApprovals((prev) => ({ ...prev, [id]: next }));
      log(id, `signed off on payment as ${STAFF_ROLE_LABEL[staffRole]}`);

      // 只签到一边就停在这儿 —— 等另一边
      if (!next.sales || !next.finance) return;

      const term = org.termMonths ?? 12;
      patch(id, {
        provision: "active",
        status: "active",
        activatedAt: TODAY_LABEL,
        effectiveAt: TODAY_LABEL,
        expiresAt: termEndLabel(term),
      });
      setMembersByOrg((prev) => ({
        ...prev,
        [id]: (prev[id] ?? seedMembers(org)).map((member) =>
          member.role === "owner" ? { ...member, status: "active" } : member,
        ),
      }));
      log(
        id,
        `both sign-offs in — provisioned the org and emailed ${org.ownerEmail} their activation link`,
        "System",
      );
    },
    [orgs, approvals, staffRole, patch, log],
  );

  const setAutoRenew = useCallback(
    (id: string, next: boolean) => {
      patch(id, { autoRenew: next });
      log(id, next ? "turned auto-renewal on" : "turned auto-renewal off — the org lapses to Free at expiry");
    },
    [patch, log],
  );

  const assignSales = useCallback(
    (id: string, rep: string) => {
      patch(id, { sales: rep });
      log(id, `assigned the account to ${rep}`);
    },
    [patch, log],
  );

  const renew = useCallback(
    (id: string) => {
      const org = orgs.find((item) => item.id === id);
      if (!org) return;
      const term = org.termMonths ?? 12;
      patch(id, { status: "active", provision: "active", expiresAt: termEndLabel(term) });
      log(id, `renewed for another ${term} months`);
    },
    [orgs, patch, log],
  );

  const membersOf = useCallback(
    (id: string) => {
      const existing = membersByOrg[id];
      if (existing) return existing;
      const org = orgs.find((item) => item.id === id);
      return org ? seedMembers(org) : [];
    },
    [membersByOrg, orgs],
  );

  const inviteMember = useCallback(
    (id: string, email: string, role: OrgMember["role"]) => {
      setMembersByOrg((prev) => {
        const org = orgs.find((item) => item.id === id);
        const current = prev[id] ?? (org ? seedMembers(org) : []);
        if (current.some((member) => member.email === email)) return prev;
        return { ...prev, [id]: [...current, { email, role, status: "invited", allocation: null }] };
      });
      log(id, `invited ${email} as ${role}`);
    },
    [orgs, log],
  );

  const setAllocation = useCallback(
    (id: string, email: string, allocation: number | null) => {
      setMembersByOrg((prev) => {
        const org = orgs.find((item) => item.id === id);
        const current = prev[id] ?? (org ? seedMembers(org) : []);
        return {
          ...prev,
          [id]: current.map((member) => (member.email === email ? { ...member, allocation } : member)),
        };
      });
      log(
        id,
        allocation === null
          ? `removed the credit allocation for ${email}`
          : `set ${email}'s monthly allocation to ${allocation.toLocaleString("en-US")} credits`,
      );
    },
    [orgs, log],
  );

  const logOf = useCallback((id: string) => logByOrg[id] ?? [], [logByOrg]);
  const approvalOf = useCallback((id: string) => approvals[id] ?? {}, [approvals]);

  const value = useMemo<Ctx>(
    () => ({
      orgs,
      staffRole,
      setStaffRole,
      staffName,
      approvalOf,
      createOrg,
      confirmPayment,
      setAutoRenew,
      assignSales,
      renew,
      membersOf,
      inviteMember,
      setAllocation,
      logOf,
    }),
    [orgs, staffRole, staffName, approvalOf, createOrg, confirmPayment, setAutoRenew, assignSales, renew, membersOf, inviteMember, setAllocation, logOf],
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used inside AdminProvider");
  return ctx;
}

/** 待开通的单子 —— 侧边栏要挂角标,sales 每天第一件事就是看这个 */
export function awaitingPayment(orgs: AdminOrg[]) {
  return orgs.filter((org) => org.provision === "awaiting_payment");
}

export type { ProvisionState };
