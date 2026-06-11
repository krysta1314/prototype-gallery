"use client";

import { useState } from "react";
import {
  X,
  CircleUserRound,
  Wallet,
  Activity,
  Zap,
  ArrowRight,
  Sparkles,
  CreditCard,
  ImageIcon,
  Clapperboard,
  ChevronDown,
} from "lucide-react";

/* =========================================================================
   Account Settings 弹窗 + 新增「Credits Top-up」tab(Ultra 专属)
   侧边栏:Account Settings / Billing & Subscription / Credits Top-up / Credits Usage
   - 充值功能仅对 Ultra 用户开放,作为独立 tab 放在 Billing 下面。
   - Top-up 主体 = 一次性充值包(不过期、单价故意高于任何订阅档)。
   - 升级助推按当前 Ultra 状态指向价值阶梯的下一级:
       月付 → 升年付(Save 30%);年付 Y1→Y2(33% OFF);Y2→Y3(40% OFF·Best value);Y3 封顶无助推。
   配色沿用账户弹窗 / design.md 的 Buzz 橙:强调 #ff5e1a、浅橙底 #fff3ec、
   CTA 渐变 #FFA73C→#FF5255;折扣徽章 #ff0051→#ff3d7a。
   ========================================================================= */

/* ---------- 模型单价(复用 pricing 页) ---------- */
const RATE_IMAGE = 8; // GPT Image 2: 8 credits / image
const RATE_VIDEO = 337; // Seedance 2.0: 337 credits / video

/* ---------- Top-up 包(一次性、不过期) ---------- */
type Pack = { credits: number; price: number; badge?: string };
/** 标准单价:$0.01 / credit,所有充值包按此换算 */
const CREDIT_PRICE = 0.01;
const PACKS: Pack[] = [
  { credits: 1000 },
  { credits: 2000 },
  { credits: 3500 },
  { credits: 5000, badge: "Popular" },
  { credits: 8000 },
  { credits: 12000 },
  { credits: 20000 },
  { credits: 30000, badge: "Best value" },
].map((p) => ({ ...p, price: Math.round(p.credits * CREDIT_PRICE) }));
/** 用于升级助推里的「典型 top-up 单价」对比(取 Popular 档) */
const TYPICAL_PACK = PACKS.find((p) => p.badge === "Popular")!;

/* ---------- 用户当前 Ultra 状态 ---------- */
type UltraState = "monthly" | "y1" | "y2" | "y3";

const PLAN_LABEL: Record<UltraState, string> = {
  monthly: "Ultra · Monthly",
  y1: "Ultra · Yearly",
  y2: "Ultra · Yearly 2×",
  y3: "Ultra · Yearly 4×",
};
const MONTHLY_ALLOWANCE: Record<UltraState, number> = {
  monthly: 8900,
  y1: 8900,
  y2: 17800,
  y3: 35600,
};
const PLAN_PRICE: Record<UltraState, number> = {
  monthly: 89,
  y1: 63,
  y2: 84,
  y3: 150,
};

/* 升级助推目标:阶梯的下一级(Y3 已封顶 = null) */
type Nudge = {
  pill: string;
  badge: string;
  title: string;
  short: string;
  creditsMo: number;
  priceMo: number;
  perCredit: number;
  cta: string;
  note: string;
};
const NUDGE: Record<UltraState, Nudge | null> = {
  monthly: {
    pill: "Switch to yearly",
    badge: "Save 30%",
    title: "Ultra · Yearly",
    short: "Yearly",
    creditsMo: 8900,
    priceMo: 63,
    perCredit: 0.0071,
    cta: "Switch to Yearly",
    note: "Same 8,900 credits every month — billed annually at $756.",
  },
  y1: {
    pill: "Recommended scale",
    badge: "33% OFF",
    title: "Ultra · Yearly 2×",
    short: "Yearly 2×",
    creditsMo: 17800,
    priceMo: 84,
    perCredit: 0.0047,
    cta: "Upgrade Credit Limit",
    note: "Unlocks an extra 33% volume discount + all Ultra features.",
  },
  y2: {
    pill: "Best value",
    badge: "40% OFF",
    title: "Ultra · Yearly 4×",
    short: "Yearly 4×",
    creditsMo: 35600,
    priceMo: 150,
    perCredit: 0.0042,
    cta: "Upgrade Credit Limit",
    note: "Unlocks 40% volume discount · Save $769/year.",
  },
  y3: null,
};

/* ---------- Helpers ---------- */
function fmt(n: number) {
  return n.toLocaleString("en-US");
}
function money(n: number) {
  const opts =
    n % 1 === 0
      ? { minimumFractionDigits: 0 }
      : { minimumFractionDigits: 2, maximumFractionDigits: 2 };
  return "$" + n.toLocaleString("en-US", opts);
}
function perCreditStr(price: number, credits: number) {
  return "$" + (price / credits).toFixed(4).replace(/0+$/, "").replace(/\.$/, "") + "/credit";
}

/* ---------- 样式 token ---------- */
const ctaGrad =
  "bg-gradient-to-br from-[#FFA73C] to-[#FF5255] text-white shadow-[0_8px_24px_rgba(255,82,85,0.28)]";

/* ===================================================================== */
type Tab = "account" | "billing" | "topup" | "usage";

export default function CreditsTopupPage() {
  const [tab, setTab] = useState<Tab>("topup");
  const [state, setState] = useState<UltraState>("monthly");

  const low = true;
  const balance = 920;

  return (
    <div className="min-h-screen bg-[#1a1a2e] [font-variant-numeric:tabular-nums]">
      {/* ============ 原型控制器(演示用) ============ */}
      <div className="border-b border-white/10 bg-[#14142a] px-5 py-3">
        <div className="mx-auto flex max-w-[1000px] flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-[#a1a1aa]">
          <span className="font-semibold text-white">原型控制器</span>
          <div className="flex items-center gap-1.5">
            <span className="text-white/40">当前套餐:</span>
            {(Object.keys(PLAN_LABEL) as UltraState[]).map((s) => (
              <button
                key={s}
                onClick={() => setState(s)}
                className={`cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition ${
                  state === s
                    ? "bg-[#ff5e1a] text-white"
                    : "bg-white/5 text-[#a1a1aa] hover:bg-white/10"
                }`}
              >
                {PLAN_LABEL[s]}
                {s === "y3" && " (顶)"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ============ 虚化 App 背景 ============ */}
      <div className="relative flex items-start justify-center px-4 py-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07] blur-[2px]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 22% 18%, #ff9a3d 0, transparent 42%), radial-gradient(circle at 80% 70%, #ff5255 0, transparent 42%)",
          }}
        />

        {/* ============ 账户设置弹窗 ============ */}
        <div className="relative flex max-h-[88vh] w-full max-w-[1100px] overflow-hidden rounded-[20px] bg-white shadow-[0_28px_80px_rgba(0,0,0,0.45)]">
          {/* 关闭 */}
          <button className="absolute right-4 top-4 z-10 cursor-pointer rounded-lg p-1.5 text-[#a3a3a3] transition hover:bg-[#f4f4f5] hover:text-[#1a1a2e]">
            <X className="size-[18px]" />
          </button>

          {/* 左侧导航 */}
          <aside className="w-[224px] shrink-0 border-r border-[#f0eef2] bg-[#fbfafc] p-3">
            <NavItem
              icon={<CircleUserRound className="size-[18px]" />}
              label="Account Settings"
              active={tab === "account"}
              onClick={() => setTab("account")}
            />
            <NavItem
              icon={<Wallet className="size-[18px]" />}
              label="Billing & Subscription"
              active={tab === "billing"}
              onClick={() => setTab("billing")}
            />
            <NavItem
              icon={<Activity className="size-[18px]" />}
              label="Credits Usage"
              active={tab === "usage"}
              onClick={() => setTab("usage")}
            />
            <NavItem
              icon={<Zap className="size-[18px]" />}
              label="Credits Top-up"
              active={tab === "topup"}
              onClick={() => setTab("topup")}
            />
          </aside>

          {/* 右侧内容 */}
          <section className="min-h-[520px] flex-1 overflow-y-auto px-8 py-7">
            {tab === "account" && <AccountPanel />}
            {tab === "billing" && <BillingPanel state={state} goTopup={() => setTab("topup")} />}
            {tab === "topup" && <TopupPanel state={state} goBilling={() => setTab("billing")} />}
            {tab === "usage" && (
              <UsagePanel state={state} balance={balance} low={low} goTopup={() => setTab("topup")} />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

/* ---------- 左侧导航项 ---------- */
function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full cursor-pointer items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left text-[14px] font-semibold transition ${
        active
          ? "bg-[#fff3ec] text-[#ff5e1a]"
          : "text-[#6a6b7b] hover:bg-[#f4f3f6] hover:text-[#1a1a2e]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

/* ---------- 共用:套餐徽章 ---------- */
function PlanBadge({ state }: { state: UltraState }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#fff3ec] px-2.5 py-1 text-[12px] font-bold text-[#ff5e1a]">
      <Sparkles className="size-3" />
      {PLAN_LABEL[state]}
    </span>
  );
}

/* ---------- Account Settings(复刻截图) ---------- */
function AccountPanel() {
  return (
    <div>
      <h2 className="text-[20px] font-bold tracking-tight text-[#1a1a2e]">Account Settings</h2>
      <div className="mt-6 flex items-center gap-3.5">
        <span className="grid size-12 place-items-center rounded-full bg-[#ffe7d6] text-[18px] font-bold text-[#ff5e1a]">
          S
        </span>
        <div>
          <div className="text-[16px] font-bold text-[#1a1a2e]">SZ_Monica Zhou</div>
          <div className="text-[13px] text-[#6a6b7b]">monica.zhou@presslogic.com</div>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4">
        <InfoCard label="User ID" value="271472545172074496" />
        <InfoCard label="Member Since" value="2026-01-19" />
      </div>
    </div>
  );
}
function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] bg-[#f5f4f7] px-4 py-3.5">
      <div className="text-[13px] text-[#6a6b7b]">{label}</div>
      <div className="mt-1 text-[15px] font-bold text-[#1a1a2e]">{value}</div>
    </div>
  );
}

/* ---------- Billing & Subscription(摘要,不含充值) ---------- */
function BillingPanel({ state, goTopup }: { state: UltraState; goTopup: () => void }) {
  const allowance = MONTHLY_ALLOWANCE[state];
  const price = PLAN_PRICE[state];
  const cyc = state === "monthly" ? "Billed monthly" : "Billed annually";
  return (
    <div>
      <h2 className="text-[20px] font-bold tracking-tight text-[#1a1a2e]">Billing & Subscription</h2>

      <div className="mt-6 rounded-[14px] border border-[#ececf1] p-5">
        <div className="flex items-start justify-between">
          <div>
            <PlanBadge state={state} />
            <div className="mt-3 text-[13px] text-[#6a6b7b]">{cyc} · Renews Jul 1, 2026</div>
            <div className="mt-1 text-[13px] text-[#6a6b7b]">{fmt(allowance)} credits / month</div>
          </div>
          <div className="text-right">
            <span className="text-[26px] font-bold leading-none text-[#1a1a2e]">{money(price)}</span>
            <span className="text-[13px] text-[#6a6b7b]"> /mo</span>
          </div>
        </div>
        <div className="mt-5 flex gap-2.5">
          <button className="cursor-pointer rounded-xl border border-[#ececf1] bg-white px-5 py-2.5 text-[13px] font-bold text-[#1a1a2e] transition hover:border-[#ff5e1a] hover:bg-[#fff7f1]">
            Change plan
          </button>
          <button className="cursor-pointer rounded-xl px-4 py-2.5 text-[13px] font-bold text-[#6a6b7b] transition hover:text-[#1a1a2e]">
            Cancel subscription
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-[14px] border border-[#ececf1] px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-[10px] bg-[#f5f4f7] text-[#1a1a2e]">
            <CreditCard className="size-[18px]" />
          </span>
          <div>
            <div className="text-[14px] font-semibold text-[#1a1a2e]">Visa ···· 4242</div>
            <div className="text-[12px] text-[#6a6b7b]">Expires 08 / 28</div>
          </div>
        </div>
        <button className="cursor-pointer text-[13px] font-bold text-[#ff5e1a] hover:underline">
          Edit
        </button>
      </div>

      <button
        onClick={goTopup}
        className="group mt-4 flex w-full items-center justify-between rounded-[14px] bg-[#fff7f1] px-5 py-4 text-left transition hover:bg-[#fff0e6]"
      >
        <div className="flex items-center gap-3">
          <span className={`grid size-9 place-items-center rounded-[10px] ${ctaGrad}`}>
            <Zap className="size-[18px]" strokeWidth={2.4} />
          </span>
          <div>
            <div className="text-[14px] font-bold text-[#1a1a2e]">Need more credits now?</div>
            <div className="text-[12px] text-[#6a6b7b]">Top up instantly — credits never expire.</div>
          </div>
        </div>
        <ArrowRight className="size-4 text-[#ff5e1a] transition group-hover:translate-x-0.5" />
      </button>
    </div>
  );
}

/* ---------- 单个充值包卡(参考图网格样式,每卡独立 Purchase + 倍数下拉) ---------- */
function PackCard({ pack }: { pack: Pack }) {
  const featured = pack.badge === "Popular";
  const [mult, setMult] = useState(1);
  const [open, setOpen] = useState(false);
  const credits = pack.credits * mult;
  const price = pack.price * mult;

  return (
    <div
      className={`group relative flex min-h-[150px] flex-col justify-between rounded-[14px] border p-4 transition hover:-translate-y-0.5 ${
        featured
          ? "border-[#ff5e1a] bg-white shadow-[0_6px_20px_rgba(255,94,26,0.16)]"
          : "border-[#ececf1] bg-white hover:border-[#d4d3df] hover:shadow-[0_4px_16px_rgba(26,26,46,0.06)]"
      }`}
    >
      {pack.badge && (
        <span
          className={`absolute left-3 top-0 z-10 -translate-y-1/2 rounded-full px-2 py-px text-[9px] font-bold uppercase tracking-[0.04em] text-white shadow-[0_0_0_3px_#fff] ${
            featured ? "bg-[#ff5e1a]" : "bg-gradient-to-r from-[#ff0051] to-[#ff3d7a]"
          }`}
        >
          {pack.badge}
        </span>
      )}

      {/* 倍数下拉(hover 显示;选中非 ×1 或展开时常驻) */}
      <div
        className={`absolute right-2 top-2 z-20 transition ${
          open || mult > 1 ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex cursor-pointer items-center gap-0.5 rounded-md border border-[#ececf1] bg-white px-1.5 py-0.5 text-[11px] font-bold text-[#6a6b7b] transition hover:border-[#ff5e1a] hover:text-[#ff5e1a]"
        >
          ×{mult}
          <ChevronDown className={`size-3 transition ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <>
            {/* 点外部关闭 */}
            <div className="fixed inset-0 z-0" onClick={() => setOpen(false)} />
            <div className="absolute right-0 z-10 mt-1 w-12 overflow-hidden rounded-md border border-[#ececf1] bg-white shadow-[0_8px_24px_rgba(26,26,46,0.14)]">
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  onClick={() => {
                    setMult(n);
                    setOpen(false);
                  }}
                  className={`block w-full cursor-pointer px-2 py-1.5 text-left text-[11px] font-bold transition ${
                    n === mult ? "bg-[#fff3ec] text-[#ff5e1a]" : "text-[#6a6b7b] hover:bg-[#faf9fb]"
                  }`}
                >
                  ×{n}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="relative">
        <div className="flex items-center gap-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/coin.svg" alt="" className="size-[18px] shrink-0" />
          <span className="text-[19px] font-bold leading-none text-[#1a1a2e]">{fmt(credits)}</span>
        </div>
      </div>
      <div className="relative mt-4 flex items-center justify-between gap-2">
        <span className="text-[16px] font-bold text-[#1a1a2e]">{money(price)}</span>
        <button
          className={`cursor-pointer rounded-lg px-4 py-1.5 text-[12px] font-bold transition ${
            featured
              ? "border-[1.5px] border-transparent [background:linear-gradient(#fff,#fff)_padding-box,linear-gradient(to_bottom_right,#FFA73C,#FF5255)_border-box] hover:brightness-[0.98]"
              : "border border-[#ececf1] text-[#1a1a2e] hover:border-[#ff5e1a] hover:text-[#ff5e1a]"
          }`}
        >
          {featured ? (
            <span className="bg-gradient-to-br from-[#FFA73C] to-[#FF5255] bg-clip-text text-transparent">
              Purchase
            </span>
          ) : (
            "Purchase"
          )}
        </button>
      </div>
    </div>
  );
}

/* ---------- Credits Top-up(主场:仅 Ultra) ---------- */
function TopupPanel({
  state,
  goBilling,
}: {
  state: UltraState;
  goBilling: () => void;
}) {
  const nudge = NUDGE[state];
  const topupRate = TYPICAL_PACK.price / TYPICAL_PACK.credits;

  return (
    <div>
      <h2 className="text-[20px] font-bold tracking-tight text-[#1a1a2e]">Credits Top-up</h2>
      <p className="mt-1 text-[13px] text-[#6a6b7b]">
        Add credits to your Ultra plan instantly. Top-up credits never expire.
      </p>

      {/* 充值包网格(每卡独立购买) */}
      <div className="mt-6 text-[13px] font-bold text-[#1a1a2e]">Choose a top-up pack</div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {PACKS.map((p, i) => (
          <PackCard key={i} pack={p} />
        ))}
      </div>
      <p className="mt-3 text-[12px] text-[#9a9aa8]">Added instantly · never expire</p>

      {/* 升级助推(顶档 Ultra 年付无下一级,不显示) */}
      {nudge && (
        <div className="mt-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="h-px flex-1 bg-[#ececf1]" />
            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#b6b6c2]">
              Or get more for less
            </span>
            <span className="h-px flex-1 bg-[#ececf1]" />
          </div>

          <div className="relative rounded-[16px] border-2 border-[#ff5e1a] bg-gradient-to-b from-[#fff7f1] to-white p-4">
            <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
              <span
                className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1 text-[10.5px] font-bold shadow-[0_0_0_4px_#fff] ${ctaGrad}`}
              >
                <Sparkles className="size-3" />
                {nudge.pill}
              </span>
            </div>

            <div className="mt-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-bold tracking-tight text-[#1a1a2e]">{nudge.title}</span>
                <span className="-skew-x-12 rounded bg-gradient-to-r from-[#ff0051] to-[#ff3d7a] px-1.5 py-px text-[10px] font-extrabold text-white">
                  <span className="inline-block skew-x-12">{nudge.badge}</span>
                </span>
              </div>
              <div className="text-right">
                <span className="text-[20px] font-bold leading-none text-[#1a1a2e]">
                  {money(nudge.priceMo)}
                </span>
                <span className="text-[12px] text-[#6a6b7b]"> /mo</span>
              </div>
            </div>

            {/* 单价对比 */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-[10px] bg-white px-3 py-2 ring-1 ring-[#ececf1]">
                <div className="text-[10.5px] text-[#9a9aa8]">Typical top-up</div>
                <div className="text-[14px] font-bold text-[#6a6b7b]">
                  {perCreditStr(TYPICAL_PACK.price, TYPICAL_PACK.credits)}
                </div>
              </div>
              <div className="rounded-[10px] bg-[#fff3ec] px-3 py-2 ring-1 ring-[#ffe0cc]">
                <div className="text-[10.5px] text-[#ff5e1a]">With {nudge.short}</div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[14px] font-bold text-[#ff5e1a]">
                    ${nudge.perCredit.toFixed(4).replace(/0+$/, "")}/credit
                  </span>
                  <span className="rounded bg-[#16a34a] px-1 text-[9px] font-bold text-white">
                    −{Math.round((1 - nudge.perCredit / topupRate) * 100)}%
                  </span>
                </div>
              </div>
            </div>

            <p className="mt-2.5 text-[12px] leading-[1.5] text-[#6a6b7b]">
              <b className="font-semibold text-[#1a1a2e]">{fmt(nudge.creditsMo)} credits</b> every month,
              auto-renewed. {nudge.note}
            </p>

            <button
              onClick={goBilling}
              className={`group mt-3 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-[12px] py-3 text-[14px] font-bold transition hover:brightness-105 ${ctaGrad}`}
            >
              {nudge.cta}
              <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Credits Usage(仅用量展示) ---------- */
function UsagePanel({
  state,
  balance,
  low,
  goTopup,
}: {
  state: UltraState;
  balance: number;
  low: boolean;
  goTopup: () => void;
}) {
  const allowance = MONTHLY_ALLOWANCE[state];
  const used = Math.max(0, allowance - balance);
  const usedPct = Math.min(100, Math.round((used / allowance) * 100));
  const imgSpent = Math.round(used * 0.45);
  const vidSpent = used - imgSpent;

  return (
    <div>
      <h2 className="text-[20px] font-bold tracking-tight text-[#1a1a2e]">Credits Usage</h2>

      {/* 余额 + 用量条 */}
      <div className="mt-5 rounded-[14px] bg-[#fbfafc] p-5 ring-1 ring-[#f0eef2]">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[12px] font-medium uppercase tracking-[0.06em] text-[#9a9aa8]">
              Credits left this cycle
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className={`text-[28px] font-bold leading-none ${low ? "text-[#ff5e1a]" : "text-[#1a1a2e]"}`}>
                {fmt(balance)}
              </span>
              <span className="text-[14px] text-[#6a6b7b]">/ {fmt(allowance)} credits</span>
            </div>
          </div>
          <PlanBadge state={state} />
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#ececf1]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#FFA73C] to-[#FF5255]"
            style={{ width: `${usedPct}%` }}
          />
        </div>
        <div className="mt-1.5 text-[12px] text-[#9a9aa8]">{fmt(used)} used · resets Jul 1</div>
      </div>

      {/* 本周期用量明细 */}
      <div className="mt-4 text-[13px] font-bold text-[#1a1a2e]">This cycle</div>
      <div className="mt-2.5 grid grid-cols-2 gap-4">
        <UsageStat
          icon={<ImageIcon className="size-[18px]" />}
          label="Images generated"
          credits={imgSpent}
          count={Math.floor(imgSpent / RATE_IMAGE)}
          unit="images"
        />
        <UsageStat
          icon={<Clapperboard className="size-[18px]" />}
          label="Videos generated"
          credits={vidSpent}
          count={Math.floor(vidSpent / RATE_VIDEO)}
          unit="videos"
        />
      </div>

      <button
        onClick={goTopup}
        className="group mt-5 flex w-full items-center justify-between rounded-[14px] bg-[#fff7f1] px-5 py-4 text-left transition hover:bg-[#fff0e6]"
      >
        <div className="flex items-center gap-3">
          <span className={`grid size-9 place-items-center rounded-[10px] ${ctaGrad}`}>
            <Zap className="size-[18px]" strokeWidth={2.4} />
          </span>
          <div>
            <div className="text-[14px] font-bold text-[#1a1a2e]">Running low? Top up credits</div>
            <div className="text-[12px] text-[#6a6b7b]">Added instantly · never expire.</div>
          </div>
        </div>
        <ArrowRight className="size-4 text-[#ff5e1a] transition group-hover:translate-x-0.5" />
      </button>
    </div>
  );
}
function UsageStat({
  icon,
  label,
  credits,
  count,
  unit,
}: {
  icon: React.ReactNode;
  label: string;
  credits: number;
  count: number;
  unit: string;
}) {
  return (
    <div className="rounded-[12px] border border-[#ececf1] p-4">
      <div className="flex items-center gap-2 text-[#ff5e1a]">
        {icon}
        <span className="text-[13px] font-semibold text-[#1a1a2e]">{label}</span>
      </div>
      <div className="mt-2 text-[22px] font-bold text-[#1a1a2e]">{fmt(credits)}</div>
      <div className="text-[12px] text-[#6a6b7b]">
        credits · ≈ {fmt(count)} {unit}
      </div>
    </div>
  );
}
