"use client";

import { useState, useRef, useEffect } from "react";
import {
  X,
  CircleUserRound,
  Wallet,
  Activity,
  Zap,
  ArrowRight,
  CreditCard,
  ImageIcon,
  Clapperboard,
  ChevronDown,
  Lock,
  Loader2,
} from "lucide-react";

/* =========================================================================
   Account Settings 弹窗 + 「Credits Top-up」tab(全体付费用户开放)
   身份模型按真实订阅页:Tier(Free/Starter/Pro/Ultra) × Cycle(Monthly/Yearly)
   × Ultra 容量档(×1/×2/×4)。共 11 个身份。
   策略:
   - 充值仅付费用户可用;Free 进 Top-up 上锁,引导升级(gate → Starter)。
   - Top-up 单价固定 $0.01/credit(故意高、不过期)。
   - 升级助推按身份走价值阶梯:
       月付任意档 → 转年付(同档,单价掉到 ~$0.007,真低于 top-up);
       年付 → 升一档/扩容:Starter→Pro→Ultra×1→Ultra×2→Ultra×4;
       Ultra×4 年付封顶,无助推。
   配色沿用 design.md 的 Buzz 橙,单一口径。
   ========================================================================= */

/* ---------- 模型单价(复用 pricing 页) ---------- */
const RATE_IMAGE = 8; // GPT Image 2: 8 credits / image
const RATE_VIDEO = 337; // Seedance 2.0: 337 credits / video

/* ---------- Top-up 包(一次性、不过期) ---------- */
type Pack = { credits: number; price: number; badge?: string };
const CREDIT_PRICE = 0.01; // $0.01 / credit
const TOPUP_RATE = CREDIT_PRICE;
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

/* ===================================================================== */
/* 身份模型:真实订阅页的三个维度                                          */
/* ===================================================================== */
type Tier = "free" | "starter" | "pro" | "ultra";
type Cycle = "monthly" | "yearly";
type UltraVol = 1 | 2 | 4;
type Identity = { tier: Tier; cycle: Cycle; vol: UltraVol };

/* Ultra 三档:credits/mo + 月价 + 年付月价 + 月度划线价(列表价) */
const ULTRA: Record<UltraVol, { credits: number; mo: number; yr: number; listMo: number }> = {
  1: { credits: 8900, mo: 89, yr: 63, listMo: 89 },
  2: { credits: 17800, mo: 120, yr: 107, listMo: 178 },
  4: { credits: 35600, mo: 214, yr: 178, listMo: 356 },
};
const STARTER = { credits: 1900, mo: 19, yr: 14 };
const PRO = { credits: 4900, mo: 49, yr: 35 };
const FREE_CREDITS = 500;

const isPaid = (id: Identity) => id.tier !== "free";

function allowanceMo(id: Identity): number {
  if (id.tier === "free") return FREE_CREDITS;
  if (id.tier === "starter") return STARTER.credits;
  if (id.tier === "pro") return PRO.credits;
  return ULTRA[id.vol].credits;
}
function pricePerMo(id: Identity): number {
  if (id.tier === "free") return 0;
  const yr = id.cycle === "yearly";
  if (id.tier === "starter") return yr ? STARTER.yr : STARTER.mo;
  if (id.tier === "pro") return yr ? PRO.yr : PRO.mo;
  return yr ? ULTRA[id.vol].yr : ULTRA[id.vol].mo;
}
/** 划线价(有折扣才返回,否则 null):年付划月价;Ultra 月付 ×2/×4 划列表价 */
function listPerMo(id: Identity): number | null {
  if (id.tier === "free") return null;
  if (id.cycle === "yearly") {
    if (id.tier === "starter") return STARTER.mo;
    if (id.tier === "pro") return PRO.mo;
    return ULTRA[id.vol].listMo;
  }
  if (id.tier === "ultra" && id.vol > 1) return ULTRA[id.vol].listMo;
  return null;
}
function perCredit(id: Identity): number {
  return pricePerMo(id) / allowanceMo(id);
}
function labelOf(id: Identity): string {
  if (id.tier === "free") return "Free";
  const base =
    id.tier === "ultra" ? `Ultra${id.vol > 1 ? ` ×${id.vol}` : ""}` : id.tier === "pro" ? "Pro" : "Starter";
  return `${base} · ${id.cycle === "yearly" ? "Yearly" : "Monthly"}`;
}

/* ---------- 升级助推:按身份算下一级 ---------- */
type Nudge = {
  pill: string;
  badge: string;
  title: string;
  short: string;
  creditsMo: number;
  priceMo: number;
  listMo: number | null;
  perCredit: number;
  cta: string;
  note: string;
};
function buildNudge(id: Identity): Nudge | null {
  if (id.tier === "free") return null; // 锁屏单独处理

  const mk = (target: Identity, over: Partial<Nudge>): Nudge => ({
    pill: "Recommended upgrade",
    badge: "More credits",
    title: labelOf(target),
    short: target.tier === "ultra" ? `Ultra${target.vol > 1 ? ` ×${target.vol}` : ""}` : target.tier === "pro" ? "Pro" : "Starter",
    creditsMo: allowanceMo(target),
    priceMo: pricePerMo(target),
    listMo: listPerMo(target),
    perCredit: perCredit(target),
    cta: "Upgrade",
    note: "",
    ...over,
  });

  // 月付 → 转年付(同档)
  if (id.cycle === "monthly") {
    const target: Identity = { ...id, cycle: "yearly" };
    return mk(target, {
      pill: "Switch to yearly",
      badge: "Save 30%",
      short: "Yearly",
      cta: "Switch to Yearly",
      note: "Same plan, billed annually.",
    });
  }

  // 年付 → 升一档 / 扩容
  let target: Identity | null = null;
  if (id.tier === "starter") target = { tier: "pro", cycle: "yearly", vol: 1 };
  else if (id.tier === "pro") target = { tier: "ultra", cycle: "yearly", vol: 1 };
  else if (id.tier === "ultra" && id.vol === 1) target = { tier: "ultra", cycle: "yearly", vol: 2 };
  else if (id.tier === "ultra" && id.vol === 2) target = { tier: "ultra", cycle: "yearly", vol: 4 };
  if (!target) return null; // Ultra ×4 年付封顶

  const cur = allowanceMo(id);
  const isVol = id.tier === "ultra";
  return mk(target, {
    badge: isVol ? "2× volume" : "More credits",
    cta: isVol ? "Increase volume" : `Upgrade to ${target.tier === "ultra" ? "Ultra" : "Pro"}`,
    note: isVol ? "Double your current volume." : `Up from ${fmt(cur)}/mo.`,
  });
}

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
function rateNum(p: number) {
  return "$" + p.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
}
function rateStr(p: number) {
  return rateNum(p) + "/credit";
}

/* ---------- 样式 token ---------- */
const ctaGrad =
  "bg-gradient-to-br from-[#FFA73C] to-[#FF5255] text-white shadow-[0_8px_22px_rgba(255,82,85,0.22)]";
const iconGrad = "bg-gradient-to-br from-[#FFA73C] to-[#FF5255] text-white";
const kicker =
  "inline-block rounded-full bg-[#fff3ec] px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.12em] text-[#ff5e1a]";

/* ===================================================================== */
type Tab = "account" | "billing" | "topup" | "usage";

export default function CreditsTopupPage() {
  const [tab, setTab] = useState<Tab>("topup");
  const [id, setId] = useState<Identity>({ tier: "free", cycle: "monthly", vol: 1 });
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notify = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };

  const balance = Math.max(15, Math.round(allowanceMo(id) * 0.1));

  return (
    <div className="min-h-screen bg-[#1a1a2e] [font-variant-numeric:tabular-nums]">
      {/* ============ 原型控制器(演示用) ============ */}
      <div className="border-b border-white/10 bg-[#14142a] px-5 py-3">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-[#a1a1aa]">
          <span className="font-semibold text-white">原型控制器</span>

          {/* Tier */}
          <div className="flex items-center gap-1.5">
            <span className="text-white/40">套餐:</span>
            {(["free", "starter", "pro", "ultra"] as Tier[]).map((t) => (
              <button
                key={t}
                onClick={() => setId((s) => ({ ...s, tier: t }))}
                className={`cursor-pointer rounded-full px-3 py-1 text-xs font-medium capitalize transition ${
                  id.tier === t
                    ? t === "free"
                      ? "bg-white/90 text-[#1a1a2e]"
                      : "bg-[#ff5e1a] text-white"
                    : "bg-white/5 text-[#a1a1aa] hover:bg-white/10"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Cycle */}
          <div className={`flex items-center gap-1.5 ${id.tier === "free" ? "pointer-events-none opacity-35" : ""}`}>
            <span className="text-white/40">计费:</span>
            <div className="flex rounded-full bg-white/5 p-0.5">
              {(["monthly", "yearly"] as Cycle[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setId((s) => ({ ...s, cycle: c }))}
                  className={`cursor-pointer rounded-full px-3 py-1 text-xs font-medium capitalize transition ${
                    id.cycle === c ? "bg-[#ff5e1a] text-white" : "text-[#a1a1aa] hover:text-white"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Ultra 容量 */}
          {id.tier === "ultra" && (
            <div className="flex items-center gap-1.5">
              <span className="text-white/40">Ultra 容量:</span>
              {([1, 2, 4] as UltraVol[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setId((s) => ({ ...s, vol: v }))}
                  className={`cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition ${
                    id.vol === v ? "bg-[#ff5e1a] text-white" : "bg-white/5 text-[#a1a1aa] hover:bg-white/10"
                  }`}
                >
                  ×{v}
                </button>
              ))}
            </div>
          )}

          <span className="w-full text-white/35">
            Free 上锁引导升级;月付助推转年付,年付助推升档/扩容,Ultra×4 年付封顶
          </span>
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
        <div className="relative flex max-h-[88vh] w-full max-w-[1100px] flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_28px_80px_rgba(0,0,0,0.45)] md:flex-row">
          <button className="absolute right-3 top-3 z-20 cursor-pointer rounded-lg bg-white/80 p-1.5 text-[#a3a3a3] transition hover:bg-[#f4f4f5] hover:text-[#1a1a2e] md:right-4 md:top-4 md:bg-transparent">
            <X className="size-[18px]" />
          </button>

          <aside className="shrink-0 border-b border-[#f0eef2] bg-[#fbfafc] p-3 md:w-[224px] md:border-b-0 md:border-r">
            <div className="flex gap-1 overflow-x-auto pr-9 md:block md:overflow-visible md:pr-0">
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
              locked={!isPaid(id)}
              onClick={() => setTab("topup")}
            />
            </div>
          </aside>

          <section className="min-h-[520px] flex-1 overflow-y-auto px-5 py-6 md:px-8 md:py-7">
            {tab === "account" && <AccountPanel />}
            {tab === "billing" && <BillingPanel id={id} goTopup={() => setTab("topup")} notify={notify} />}
            {tab === "topup" && <TopupPanel id={id} notify={notify} />}
            {tab === "usage" && (
              <UsagePanel id={id} balance={balance} goTopup={() => setTab("topup")} />
            )}
          </section>
        </div>
      </div>

      {/* ============ Toast(原型交互提示) ============ */}
      <div
        className={`pointer-events-none fixed inset-x-0 bottom-8 z-50 flex justify-center px-4 transition-all duration-300 ${
          toast ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        {toast && (
          <div className="flex items-center gap-2 rounded-full bg-[#1a1a2e] px-4 py-2.5 text-[13px] text-white shadow-[0_12px_32px_rgba(0,0,0,0.35)]">
            <CreditCard className="size-4 text-[#ffb27a]" />
            <span className="font-bold text-[#ffb27a]">交互提示</span>
            <span className="text-white/25">|</span>
            <span className="font-medium">{toast}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- 左侧导航项 ---------- */
function NavItem({
  icon,
  label,
  active,
  locked,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  locked?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-auto shrink-0 cursor-pointer items-center gap-2.5 whitespace-nowrap rounded-[10px] px-3 py-2.5 text-left text-[14px] font-semibold transition md:w-full md:shrink ${
        active
          ? "bg-[#fff3ec] text-[#ff5e1a]"
          : "text-[#6a6b7b] hover:bg-[#f4f3f6] hover:text-[#1a1a2e]"
      }`}
    >
      {icon}
      <span className="md:flex-1">{label}</span>
      {locked && <Lock className="size-[13px] text-[#b6b6c2]" />}
    </button>
  );
}

/* ---------- 共用:套餐徽章 ---------- */
function PlanBadge({ id }: { id: Identity }) {
  if (id.tier === "free") {
    return (
      <span className="inline-flex items-center rounded-full bg-[#f0eef2] px-2.5 py-1 text-[12px] font-bold text-[#6a6b7b]">
        Free
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-[#fff3ec] px-2.5 py-1 text-[12px] font-bold text-[#ff5e1a]">
      {labelOf(id)}
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
function BillingPanel({
  id,
  goTopup,
  notify,
}: {
  id: Identity;
  goTopup: () => void;
  notify: (m: string) => void;
}) {
  const free = !isPaid(id);
  const allowance = allowanceMo(id);
  const price = pricePerMo(id);
  const list = listPerMo(id);
  const cyc = free ? "No subscription" : id.cycle === "yearly" ? "Billed annually" : "Billed monthly";

  return (
    <div>
      <h2 className="text-[20px] font-bold tracking-tight text-[#1a1a2e]">Billing & Subscription</h2>

      <div className="mt-6 rounded-[14px] border border-[#ececf1] p-5">
        <div className="flex items-start justify-between">
          <div>
            <PlanBadge id={id} />
            <div className="mt-3 text-[13px] text-[#6a6b7b]">
              {free ? "Upgrade to unlock more credits & top-ups" : `${cyc} · Renews Jul 1, 2026`}
            </div>
            <div className="mt-1 text-[13px] text-[#6a6b7b]">{fmt(allowance)} credits / month</div>
          </div>
          <div className="text-right">
            {list && (
              <span className="mr-1.5 text-[14px] font-semibold text-[#b6b6c2] line-through">{money(list)}</span>
            )}
            <span className="text-[26px] font-bold leading-none text-[#1a1a2e]">{money(price)}</span>
            <span className="text-[13px] text-[#6a6b7b]"> /mo</span>
          </div>
        </div>
        <div className="mt-5 flex gap-2.5">
          {free ? (
            <button
              onClick={() => notify("点击后弹出订阅升级弹窗")}
              className={`cursor-pointer rounded-xl px-5 py-2.5 text-[13px] font-bold transition hover:brightness-105 ${ctaGrad}`}
            >
              Upgrade plan
            </button>
          ) : (
            <>
              <button
                onClick={() => notify("点击后弹出订阅管理弹窗")}
                className="cursor-pointer rounded-xl border border-[#ececf1] bg-white px-5 py-2.5 text-[13px] font-bold text-[#1a1a2e] transition hover:border-[#ff5e1a] hover:bg-[#fff7f1]"
              >
                Change plan
              </button>
              <button className="cursor-pointer rounded-xl px-4 py-2.5 text-[13px] font-bold text-[#6a6b7b] transition hover:text-[#1a1a2e]">
                Cancel subscription
              </button>
            </>
          )}
        </div>
      </div>

      {!free && (
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
          <button className="cursor-pointer text-[13px] font-bold text-[#ff5e1a] hover:underline">Edit</button>
        </div>
      )}

      <button
        onClick={goTopup}
        className="group mt-4 flex w-full items-center justify-between rounded-[14px] bg-[#fff7f1] px-5 py-4 text-left transition hover:bg-[#fff0e6]"
      >
        <div className="flex items-center gap-3">
          <span className={`grid size-9 place-items-center rounded-[10px] ${iconGrad}`}>
            <Zap className="size-[18px]" strokeWidth={2.4} />
          </span>
          <div>
            <div className="text-[14px] font-bold text-[#1a1a2e]">
              {free ? "Unlock credit top-ups" : "Need more credits now?"}
            </div>
            <div className="text-[12px] text-[#6a6b7b]">
              {free ? "Available on Starter, Pro, and Ultra plans." : "Top up instantly. Credits never expire."}
            </div>
          </div>
        </div>
        <ArrowRight className="size-4 text-[#ff5e1a] transition group-hover:translate-x-0.5" />
      </button>
    </div>
  );
}

/* ---------- 单个充值包卡 ---------- */
function PackCard({ pack, notify }: { pack: Pack; notify?: (m: string) => void }) {
  const featured = pack.badge === "Popular";
  const [mult, setMult] = useState(1);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const buyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (buyTimer.current) clearTimeout(buyTimer.current);
  }, []);
  const credits = pack.credits * mult;
  const price = pack.price * mult;

  const purchase = () => {
    if (loading) return;
    setLoading(true);
    if (buyTimer.current) clearTimeout(buyTimer.current);
    buyTimer.current = setTimeout(() => {
      setLoading(false);
      notify?.("调起 Stripe 单次购买");
    }, 900);
  };

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
          className={`absolute left-3 top-0 z-10 -translate-y-1/2 rounded-full px-2 py-px text-[9px] font-bold uppercase tracking-[0.04em] shadow-[0_0_0_3px_#fff] ${
            featured ? "bg-[#ff5e1a] text-white" : "bg-[#fff3ec] text-[#ff5e1a] ring-1 ring-[#ffe0cc]"
          }`}
        >
          {pack.badge}
        </span>
      )}

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
          onClick={purchase}
          disabled={loading}
          className={`inline-flex min-w-[84px] cursor-pointer items-center justify-center rounded-lg px-4 py-1.5 text-[12px] font-bold transition disabled:cursor-default ${
            featured
              ? "border border-[#ff5e1a] text-[#ff5e1a] hover:bg-[#fff3ec]"
              : "border border-[#ececf1] text-[#1a1a2e] hover:border-[#ff5e1a] hover:text-[#ff5e1a]"
          }`}
        >
          {loading ? <Loader2 className="size-3.5 animate-spin" /> : "Purchase"}
        </button>
      </div>
    </div>
  );
}

/* ---------- Credits Top-up(主场:付费档充值 / Free 上锁引导) ---------- */
function TopupPanel({ id, notify }: { id: Identity; notify: (m: string) => void }) {
  if (!isPaid(id)) return <LockedTopup notify={notify} />;

  const nudge = buildNudge(id);

  return (
    <div>
      <h2 className="text-[20px] font-bold tracking-tight text-[#1a1a2e]">Credits Top-up</h2>
      <p className="mt-1 text-[13px] text-[#6a6b7b]">
        Add credits to your plan instantly. Top-up credits never expire.
      </p>

      <div className="mt-6 text-[13px] font-bold text-[#1a1a2e]">Choose a top-up pack</div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {PACKS.map((p, i) => (
          <PackCard key={i} pack={p} notify={notify} />
        ))}
      </div>

      {nudge && <UpgradeNudge nudge={nudge} notify={notify} />}
    </div>
  );
}

/* ---------- Free 上锁面板 ---------- */
function LockedTopup({ notify }: { notify: (m: string) => void }) {
  return (
    <div>
      <h2 className="text-[20px] font-bold tracking-tight text-[#1a1a2e]">Credits Top-up</h2>

      <div className="relative mt-6">
        <div aria-hidden className="pointer-events-none select-none opacity-45 blur-[1.5px]">
          <div className="text-[13px] font-bold text-[#1a1a2e]">Choose a top-up pack</div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {PACKS.slice(0, 8).map((p, i) => (
              <PackCard key={i} pack={p} />
            ))}
          </div>
        </div>

        <div className="absolute inset-0 bg-gradient-to-b from-white/55 via-white/85 to-white" />

        <div className="absolute inset-0 flex items-center justify-center px-4">
          <div className="w-full max-w-[400px] rounded-[18px] border border-[#ececf1] bg-white p-6 text-center shadow-[0_12px_36px_rgba(26,26,46,0.1)]">
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-[#fff3ec] text-[#ff5e1a]">
              <Lock className="size-[22px]" strokeWidth={2.2} />
            </span>
            <h3 className="mt-4 text-[17px] font-bold tracking-tight text-[#1a1a2e]">Need more credits?</h3>
            <p className="mx-auto mt-2 max-w-[300px] text-[13px] leading-[1.55] text-[#6a6b7b]">
              Top-ups are available on Starter, Pro, and Ultra plans. Credits are added instantly and never
              expire.
            </p>
            <button
              onClick={() => notify("点击后弹出订阅升级弹窗")}
              className={`group mt-5 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-[12px] py-3 text-[14px] font-bold transition hover:brightness-105 ${ctaGrad}`}
            >
              Upgrade your plan
              <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
            </button>
            <p className="mt-2.5 text-[12px] text-[#9a9aa8]">Plans start at $14/mo</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- 升级助推卡 ---------- */
function UpgradeNudge({ nudge, notify }: { nudge: Nudge; notify: (m: string) => void }) {
  const savePct = Math.round((1 - nudge.perCredit / TOPUP_RATE) * 100);
  const [loading, setLoading] = useState(false);
  const upTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (upTimer.current) clearTimeout(upTimer.current);
  }, []);
  const upgrade = () => {
    if (loading) return;
    setLoading(true);
    if (upTimer.current) clearTimeout(upTimer.current);
    upTimer.current = setTimeout(() => {
      setLoading(false);
      notify("调起 Stripe 订阅升级");
    }, 900);
  };
  return (
    <div className="mt-8">
      <div className="rounded-[16px] border border-[#ffe0cc] bg-[#fff7f1] p-5">
        {/* 头:套餐 + 价格 */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className={kicker}>{nudge.pill}</span>
            <div className="mt-2 text-[15px] font-bold tracking-tight text-[#1a1a2e]">{nudge.title}</div>
          </div>
          <div className="shrink-0 text-right">
            {nudge.listMo && (
              <span className="mr-1 text-[13px] font-semibold text-[#b6b6c2] line-through">
                {money(nudge.listMo)}
              </span>
            )}
            <span className="text-[20px] font-bold leading-none text-[#1a1a2e]">{money(nudge.priceMo)}</span>
            <span className="text-[12px] text-[#6a6b7b]"> /mo</span>
          </div>
        </div>

        {/* 核心卖点:升级比买 credits 单价更低 */}
        <div className="mt-4 flex items-center justify-between gap-4 rounded-[12px] bg-white p-4 ring-1 ring-[#ffe0cc]">
          <div>
            <div className="text-[12px] text-[#9a9aa8]">
              Buying top-ups <span className="line-through">{rateStr(TOPUP_RATE)}</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-[24px] font-extrabold leading-none text-[#ff5e1a]">
                {rateNum(nudge.perCredit)}
              </span>
              <span className="text-[12px] font-semibold text-[#9a9aa8]">/credit on {nudge.short}</span>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[30px] font-extrabold leading-none text-[#ff5e1a]">{savePct}%</div>
            <div className="mt-1 text-[11px] font-semibold leading-tight text-[#6a6b7b]">
              cheaper
              <br />
              per credit
            </div>
          </div>
        </div>

        <p className="mt-3 text-[12.5px] leading-[1.55] text-[#6a6b7b]">
          <b className="font-semibold text-[#1a1a2e]">{fmt(nudge.creditsMo)} credits</b> refilled every month.{" "}
          {nudge.note}
        </p>

        <button
          onClick={upgrade}
          disabled={loading}
          className={`group mt-4 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-[12px] py-3 text-[14px] font-bold transition hover:brightness-105 disabled:cursor-default disabled:brightness-100 ${ctaGrad}`}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              {nudge.cta}
              <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* ---------- Credits Usage(仅用量展示) ---------- */
function UsagePanel({
  id,
  balance,
  goTopup,
}: {
  id: Identity;
  balance: number;
  goTopup: () => void;
}) {
  const free = !isPaid(id);
  const allowance = allowanceMo(id);
  const used = Math.max(0, allowance - balance);
  const usedPct = Math.min(100, Math.round((used / allowance) * 100));
  const imgSpent = Math.round(used * 0.45);
  const vidSpent = used - imgSpent;

  return (
    <div>
      <h2 className="text-[20px] font-bold tracking-tight text-[#1a1a2e]">Credits Usage</h2>

      <div className="mt-5 rounded-[14px] bg-[#fbfafc] p-5 ring-1 ring-[#f0eef2]">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[12px] font-medium uppercase tracking-[0.06em] text-[#9a9aa8]">
              Credits left this cycle
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-[28px] font-bold leading-none text-[#ff5e1a]">{fmt(balance)}</span>
              <span className="text-[14px] text-[#6a6b7b]">/ {fmt(allowance)} credits</span>
            </div>
          </div>
          <PlanBadge id={id} />
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#ececf1]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#FFA73C] to-[#FF5255]"
            style={{ width: `${usedPct}%` }}
          />
        </div>
        <div className="mt-1.5 text-[12px] text-[#9a9aa8]">{fmt(used)} used · resets Jul 1</div>
      </div>

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
          <span className={`grid size-9 place-items-center rounded-[10px] ${iconGrad}`}>
            <Zap className="size-[18px]" strokeWidth={2.4} />
          </span>
          <div>
            <div className="text-[14px] font-bold text-[#1a1a2e]">
              {free ? "Running low? Upgrade for more credits" : "Running low? Top up credits"}
            </div>
            <div className="text-[12px] text-[#6a6b7b]">
              {free ? "Paid plans add more credits + unlock top-ups." : "Added instantly · never expire."}
            </div>
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
