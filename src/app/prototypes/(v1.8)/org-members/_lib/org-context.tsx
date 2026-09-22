"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { COGS_PER_CREDIT, DEFAULT_ORG_ID, ORGS } from "./seed";
import { canAudit, rateOf, type Org } from "./types";

/**
 * 当前组织 —— 这一页是 Enterprise 组织的管理视图,PressLogic 只是其中一个组织。
 *
 * 放在 context 里是为了让 rate 不用一层层往下传:表格、详情页、弹窗都要用它,
 * 而它只依赖「当前是哪个组织」这一个状态。
 */
type OrgCtx = {
  org: Org;
  orgs: Org[];
  setOrgId: (id: string) => void;
  /** 每 credit 折多少钱。internal 走 COGS,customer 走合同有效单价 */
  rate: number;
  /** $ 列的口径说明,直接显示在界面上 —— 免得看的人不知道这个数是成本还是售价 */
  rateNote: string;
  /** 审计能力（看某人具体生成了什么）自 E2 起 */
  auditable: boolean;
};

const Ctx = createContext<OrgCtx | null>(null);

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const [orgId, setOrgId] = useState(DEFAULT_ORG_ID);
  const org = ORGS.find((item) => item.id === orgId) ?? ORGS[0]!;

  const value = useMemo<OrgCtx>(() => {
    const rate = rateOf(org, COGS_PER_CREDIT);
    return {
      org,
      orgs: ORGS,
      setOrgId,
      rate,
      rateNote:
        org.rateBasis === "internal"
          ? `Real cost at $${COGS_PER_CREDIT.toFixed(5)}/credit — our own cost of goods. Internal only.`
          : `Effective spend at $${rate.toFixed(5)}/credit — this organisation's contract price ÷ its monthly pool.`,
      auditable: canAudit(org),
    };
  }, [org]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOrg() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useOrg must be used inside OrgProvider");
  return ctx;
}
