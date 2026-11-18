"use client";

/* Design Studio 共用的小部件：上下文、套餐标签、弹窗、升级面板、积分确认、余额不足。
   所有拦截都走 entitlements.ts:功能开关 → PlanTag + UpgradeDialog;数量上限 → UsageMeter + UpgradeDialog;AI 扣积分 → CreditConfirm / NotEnough。 */

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { Check, Crown, Lock, Sparkles, X } from "lucide-react";
import {
  FEATURE_LABEL,
  PLAN_LABEL,
  PLAN_SHORT,
  PLANS,
  can,
  isEnterprise,
  limitOf,
  planForMore,
  requiredPlan,
  type Feature,
  type LimitKey,
  type Plan,
} from "../entitlements";
import type { BrandKit, Design, Folder, Site } from "../data";

export type Role = "admin" | "member";
export type UpgradeReq = { feature: Feature } | { limit: LimitKey; used: number };

export type StudioApi = {
  plan: Plan;
  role: Role;
  approvalsOn: boolean;
  balance: number;
  /** 直接扣(按钮上已标价的小动作);不够就弹 Not enough credits,返回 false */
  charge: (credits: number) => boolean;
  /** 先弹总价确认，确认后扣费再执行 */
  confirmCredits: (o: { title: string; credits: number; detail?: string; onConfirm: () => void }) => void;
  notify: (text: string) => void;
  upgrade: (r: UpgradeReq) => void;
  /** 有这个功能 → true;没有 → 弹升级面板，返回 false */
  gate: (f: Feature) => boolean;
  kits: BrandKit[];
  setKits: (fn: (k: BrandKit[]) => BrandKit[]) => void;
  kitId: string | null;
  setKitId: (id: string | null) => void;
  designs: Design[];
  folders: Folder[];
  save: (d: Design) => void;
  add: (ds: Design[], open?: boolean) => void;
  open: (id: string) => void;
  /** 个人额度剩余(Enterprise 成员) */
  capLeft: number | null;
  sites: Site[];
  saveSite: (s: Site) => void;
};

export const StudioCtx = createContext<StudioApi | null>(null);
export function useStudio() {
  const s = useContext(StudioCtx);
  if (!s) throw new Error("StudioCtx missing");
  return s;
}
export const kitOf = (s: StudioApi, id: string | null | undefined) => s.kits.find((k) => k.id === id);

/* ---------- 样式 token(design.md) ---------- */
export const ctaBtn =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-4 text-[13px] font-bold text-white shadow-[0_6px_18px_rgba(255,82,85,0.25)] transition hover:brightness-105 disabled:opacity-40 disabled:shadow-none";
export const ghostBtn =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[#ececf1] bg-white px-3.5 text-[13px] font-semibold text-[#1a1a2e] transition hover:border-[#ffcfb3] hover:bg-[#fff7f1] disabled:opacity-40";
export const iconBtn = "grid size-8 place-items-center rounded-lg text-[#6a6b7b] transition hover:bg-[#f4f3f6] hover:text-[#1a1a2e]";

/** 套餐小标签:入口旁标「这个从哪一档开始有」 */
export function PlanTag({ plan, className = "" }: { plan: Plan; className?: string }) {
  const ent = isEnterprise(plan);
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-0.5 rounded-[5px] px-1.5 py-px text-[10px] font-bold leading-[14px] tracking-[0.02em] ${ent ? "bg-[#1a1a2e] text-white" : "bg-[#fff0e6] text-[#ff5e1a]"} ${className}`}
    >
      <Crown className="size-2.5" />
      {PLAN_SHORT[plan]}
    </span>
  );
}
/** 当前套餐没有这个功能时才显示标签 */
export function GateTag({ feature }: { feature: Feature }) {
  const s = useStudio();
  return can(s.plan, feature) ? null : <PlanTag plan={requiredPlan(feature)} />;
}

export function CreditPill({ credits, className = "" }: { credits: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[11.5px] font-bold tabular-nums text-[#ff5e1a] ${className}`}>
      <span className="grid size-3.5 place-items-center rounded-full bg-gradient-to-b from-[#ff5255] to-[#ffa73c] text-[8px] text-white">✦</span>
      {credits === 0 ? "Free" : credits}
    </span>
  );
}

/** 数量用量条:x / y used */
export function UsageMeter({ k, used, label }: { k: LimitKey; used: number; label: string }) {
  const s = useStudio();
  const l = limitOf(s.plan, k);
  const pct = l === -1 ? 0 : Math.min(100, (used / Math.max(1, l)) * 100);
  return (
    <div className="flex items-center gap-2 text-[12px] text-[#6a6b7b]">
      <span className="tabular-nums">
        <b className="font-semibold text-[#1a1a2e]">{used}</b> / {l === -1 ? "Unlimited" : l} {label}
      </span>
      {l !== -1 && (
        <span className="h-1 w-16 overflow-hidden rounded-full bg-[#ececf1]">
          <span className={`block h-full rounded-full ${pct >= 100 ? "bg-[#ff5255]" : "bg-[#ff9a3d]"}`} style={{ width: `${pct}%` }} />
        </span>
      )}
    </div>
  );
}

export function Modal({ title, onClose, children, width = 440, footer }: { title: ReactNode; onClose: () => void; children: ReactNode; width?: number; footer?: ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#1a1a2e]/35 p-4 backdrop-blur-[2px]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" className="flex max-h-[min(720px,92dvh)] w-full flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_24px_60px_rgba(26,26,46,0.25)]" style={{ maxWidth: width }}>
        <header className="flex shrink-0 items-start gap-3 px-5 pb-2 pt-5">
          <div className="min-w-0 flex-1 text-[16px] font-bold text-[#1a1a2e]">{title}</div>
          <button type="button" aria-label="Close" onClick={onClose} className={iconBtn}>
            <X className="size-4" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">{children}</div>
        {footer && <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-[#f1f1f4] px-5 py-3.5">{footer}</footer>}
      </div>
    </div>
  );
}

/* 升级面板里列「升到这一档多了什么」(只列 Studio 相关的几条) */
const HIGHLIGHTS: Record<Plan, string[]> = {
  free: [],
  starter: ["Full brand kit with brand voice", "Magic Resize", "PDF export", "Remove “Made with BuzzVideo”", "Commercial use"],
  pro: ["3 brand kits", "PPTX & SVG export", "Password-protected links", "1 custom domain, 10 sites", "Products library"],
  ultra: ["10 brand kits", "Bulk variants by selling point", "Viewer analytics", "Site forms & HTML", "Team folders, 90-day history"],
  e1: ["Unlimited brand kits", "Locked brand templates", "Approvals & Brand Check", "Per-member credit limits", "Free reviewer seats"],
  e2: ["Approval rules by group", "Audit log", "SSO / SCIM"],
  e3: ["Brand style model", "IP indemnity (listed models)", "Data residency"],
};

export function UpgradeDialog({ req, onClose }: { req: UpgradeReq; onClose: () => void }) {
  const s = useStudio();
  const target: Plan = "feature" in req ? requiredPlan(req.feature) : planForMore(s.plan, req.limit, req.used);
  const what =
    "feature" in req
      ? `${FEATURE_LABEL[req.feature]} is available on ${PLAN_LABEL[target]} and above.`
      : `You've used ${req.used} of ${limitOf(s.plan, req.limit)} ${req.limit === "brandKits" ? "brand kits" : req.limit === "sites" ? "sites" : "custom domains"} on ${PLAN_LABEL[s.plan]}.`;
  const ent = isEnterprise(target);
  const rows = PLANS.slice(PLANS.indexOf(s.plan) + 1, PLANS.indexOf(target) + 1).flatMap((p) => HIGHLIGHTS[p]);
  return (
    <Modal
      title={
        <span className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-[10px] bg-gradient-to-r from-[#FFA73C] to-[#FF5255] text-white">
            <Crown className="size-4" />
          </span>
          {ent ? "Available on Enterprise" : `Upgrade to ${PLAN_LABEL[target]}`}
        </span>
      }
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={ghostBtn}>
            Not now
          </button>
          <button
            type="button"
            className={ctaBtn}
            onClick={() => {
              onClose();
              s.notify(ent ? "Our team will reach out within 1 business day" : `Opening checkout for ${PLAN_LABEL[target]}`);
            }}
          >
            {ent ? "Talk to sales" : `Upgrade to ${PLAN_LABEL[target]}`}
          </button>
        </>
      }
    >
      <p className="text-[13.5px] leading-relaxed text-[#4a4b5c]">{what}</p>
      <div className="mt-4 rounded-2xl bg-[#faf8f6] p-4">
        <p className="mb-2.5 text-[11.5px] font-bold uppercase tracking-[0.1em] text-[#9a9bb0]">
          {PLAN_LABEL[s.plan]} → {PLAN_LABEL[target]} adds
        </p>
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r} className="flex items-start gap-2 text-[13px] text-[#1a1a2e]">
              <Check className="mt-0.5 size-3.5 shrink-0 text-[#16a34a]" /> {r}
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-3 text-[12px] text-[#9a9bb0]">The editor stays free on every plan. AI actions use credits.</p>
    </Modal>
  );
}

export function CreditConfirm({ title, credits, detail, balance, onConfirm, onClose }: { title: string; credits: number; detail?: string; balance: number; onConfirm: () => void; onClose: () => void }) {
  const short = credits > balance;
  return (
    <Modal
      title={title}
      onClose={onClose}
      width={400}
      footer={
        <>
          <button type="button" onClick={onClose} className={ghostBtn}>
            Cancel
          </button>
          <button type="button" className={ctaBtn} onClick={onConfirm}>
            <Sparkles className="size-3.5" /> {short ? "Top up" : `Generate · ${credits} credits`}
          </button>
        </>
      }
    >
      {detail && <p className="text-[13px] leading-relaxed text-[#4a4b5c]">{detail}</p>}
      <dl className="mt-3 space-y-1.5 rounded-2xl bg-[#faf8f6] p-4 text-[13px]">
        <div className="flex justify-between">
          <dt className="text-[#6a6b7b]">Total</dt>
          <dd className="font-bold tabular-nums text-[#1a1a2e]">{credits} credits</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-[#6a6b7b]">Your balance</dt>
          <dd className={`tabular-nums ${short ? "font-bold text-[#e5484d]" : "text-[#1a1a2e]"}`}>{balance}</dd>
        </div>
      </dl>
      {short && <p className="mt-2 text-[12.5px] text-[#e5484d]">Not enough credits. Top up or pick fewer variants.</p>}
      <p className="mt-2 text-[12px] text-[#9a9bb0]">Anything that fails is refunded automatically.</p>
    </Modal>
  );
}

export function NotEnough({ needed, balance, capLeft, onClose, onTopUp, onRequest }: { needed: number; balance: number; capLeft: number | null; onClose: () => void; onTopUp: () => void; onRequest: () => void }) {
  const cap = capLeft !== null && capLeft < needed;
  return (
    <Modal
      title={cap ? "You've reached your monthly limit" : "Not enough credits"}
      onClose={onClose}
      width={380}
      footer={
        <>
          <button type="button" onClick={onClose} className={ghostBtn}>
            Cancel
          </button>
          <button type="button" className={ctaBtn} onClick={cap ? onRequest : onTopUp}>
            {cap ? "Request more credits" : "Top up"}
          </button>
        </>
      }
    >
      <p className="text-[13.5px] leading-relaxed text-[#4a4b5c]">
        {cap
          ? `Your admin set a monthly limit. This needs ${needed} credits and you have ${capLeft} left.`
          : `This needs ${needed} credits. You have ${balance}.`}
      </p>
    </Modal>
  );
}

export function LockBadge({ title = "Locked by your brand admin" }: { title?: string }) {
  return (
    <span title={title} className="inline-flex items-center gap-1 rounded-full bg-[#1a1a2e]/80 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
      <Lock className="size-2.5" /> Locked
    </span>
  );
}
