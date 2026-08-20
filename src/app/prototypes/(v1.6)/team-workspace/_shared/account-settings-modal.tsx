"use client";

import { useRef, useState } from "react";
import {
  Activity,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  CirclePlus,
  CreditCard,
  FolderClock,
  ShoppingCart,
  X,
  Zap,
} from "lucide-react";
import { CURRENT_USER, CURRENT_USER_ID, formatNumber, MEMBERS_BY_TEAM, planOf, seatCreditsOf, TEAMS } from "./data";
import { ScopeBadge } from "./plan-badge";
import { Dropdown } from "./dropdown";
import { useTeam } from "./team-context";
import { useDialog } from "./use-dialog";

/**
 * 账户级设置 —— 与「团队设置」是两套东西。
 * 入口:右上用户菜单,以及切换器里个人账户那一行的齿轮。
 * 数据取的是「个人账户」,与当前所在团队无关。
 */
export type AccountTab = "account" | "billing" | "credits" | "topup";

const TABS: { key: AccountTab; label: string; icon: typeof CircleUserRound }[] = [
  { key: "account", label: "General", icon: CircleUserRound },
  { key: "billing", label: "Billing", icon: CreditCard },
  { key: "credits", label: "Credits & usage", icon: Activity },
  { key: "topup", label: "Top-up", icon: Zap },
];

const USER_ID = "271472545172074496";
const MEMBER_SINCE = "2026-01-19";

/** 充值包:与团队 Billing 的三档不同,这里是完整价目表 */
const TOPUP_PACKS = [
  { credits: 1_000, price: 10 },
  { credits: 2_000, price: 20 },
  { credits: 3_500, price: 35 },
  { credits: 5_000, price: 50, popular: true },
  { credits: 8_000, price: 80 },
  { credits: 12_000, price: 120 },
  { credits: 20_000, price: 200 },
  { credits: 30_000, price: 300 },
];

const ACTIVITY = [
  { action: "AI Image Generation", date: "2026-07-22 17:50", credits: 3 },
  { action: "AI Image Generation", date: "2026-07-21 17:43", credits: 3 },
  { action: "AI Image Generation", date: "2026-07-21 17:43", credits: 3 },
  { action: "Canvas Agent", date: "2026-07-21 17:43", credits: 3 },
  { action: "Canvas Agent", date: "2026-07-21 17:42", credits: 2 },
  { action: "AI Script Generation", date: "2026-07-21 17:42", credits: 13 },
  { action: "AI Video Generation", date: "2026-07-13 15:03", credits: 184 },
  { action: "AI Video Generation", date: "2026-07-13 15:03", credits: 184 },
  { action: "AI Image Generation", date: "2026-07-13 14:30", credits: 28 },
  { action: "AI Image Generation", date: "2026-07-13 14:30", credits: 28 },
];

function Avatar({ size = 44 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="grid shrink-0 place-items-center font-bold text-white"
      style={{
        width: size,
        height: size,
        background: CURRENT_USER.color,
        borderRadius: Math.max(5, Math.round(size * 0.28)),
        fontSize: Math.round(size * 0.4),
      }}
    >
      {CURRENT_USER.name[0]}
    </span>
  );
}

/* ============================ Account Settings ============================ */

function AccountTabPanel() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3.5">
        <Avatar size={44} />
        <div className="min-w-0">
          <p className="truncate text-[16px] font-bold text-[#28222e]">{CURRENT_USER.name}</p>
          <p className="truncate text-[13px] text-[#8a8490]">{CURRENT_USER.email}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { label: "User ID", value: USER_ID },
          { label: "Member Since", value: MEMBER_SINCE },
        ].map((field) => (
          <div key={field.label} className="rounded-xl bg-[#f7f6f8] px-4 py-3.5">
            <p className="text-[12px] text-[#8a8490]">{field.label}</p>
            <p className="mt-1 break-all text-[15px] font-bold text-[#28222e]">{field.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================ Billing & Subscription ============================ */

function BillingTabPanel({ personalPlanName, paid }: { personalPlanName: string; paid: boolean }) {
  const { showToast } = useTeam();
  const [confirmCancel, setConfirmCancel] = useState(false);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-[#f7f6f8] p-5">
        <p className="text-[13px] text-[#8a8490]">Current Plan</p>
        <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[24px] font-bold tracking-[-0.02em] text-[#28222e]">{personalPlanName}</p>
            <p className="mt-2 text-[13px] text-[#7b7480]">
              {paid
                ? "Thank you for being a valued subscriber! Enjoy your premium features."
                : "You're on the free plan. Upgrade any time for more credits and models."}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => showToast("Plan management isn't wired up in this prototype.")}
              className="flex h-10 items-center gap-1.5 rounded-xl border border-[#ececf1] bg-white px-3.5 text-[13px] font-bold text-[#28222e] transition hover:border-[#ddd7df]"
            >
              Manage
              <ChevronDown className="size-3.5 text-[#9a94a0]" />
            </button>
            <button
              type="button"
              onClick={() => showToast("Plan picker isn't wired up in this prototype.")}
              className="flex h-10 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#ff8a3d] to-[#ff5e1a] px-4 text-[13px] font-bold text-white transition hover:brightness-105"
            >
              <Zap className="size-4" />
              Upgrade
            </button>
          </div>
        </div>
      </section>

      {paid && (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#ececf1] p-5">
          <div className="min-w-0">
            <p className="text-[14px] font-bold text-[#28222e]">Cancel Subscription</p>
            <p className="mt-1 text-[13px] text-[#8a8490]">You&apos;ll keep your plan until the end of your current billing period.</p>
          </div>
          {confirmCancel ? (
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  showToast("Subscription cancelled. You keep access until the end of the period.");
                  setConfirmCancel(false);
                }}
                className="h-10 rounded-xl bg-[#d92d20] px-4 text-[13px] font-bold text-white transition hover:bg-[#b42318]"
              >
                Yes, cancel
              </button>
              <button type="button" onClick={() => setConfirmCancel(false)} className="h-10 px-2 text-[13px] font-semibold text-[#8a8490] hover:text-[#56505c]">
                Keep plan
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmCancel(true)}
              className="h-10 shrink-0 rounded-xl border border-[#f0c4bf] px-4 text-[13px] font-bold text-[#d92d20] transition hover:bg-[#fef3f2]"
            >
              Cancel Subscription
            </button>
          )}
        </section>
      )}

      <section>
        <h3 className="text-[15px] font-bold text-[#28222e]">Billing History</h3>
        <div className="mt-3 overflow-x-auto rounded-xl border border-[#f0eef2]">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="bg-[#f7f6f8] text-left text-[12px] font-semibold text-[#7b7480]">
                {["Date", "Item", "PaymentType", "TransactionType", "Amount", "Status", "Invoice"].map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-3 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={7} className="px-4 py-16">
                  <div className="grid place-items-center gap-3 text-center">
                    <FolderClock className="size-9 text-[#f0b9a4]" />
                    <p className="text-[13px] text-[#8a8490]">No billing history</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/* ============================ Credits Usage ============================ */

const PAGE_SIZE = 10;

function CreditsTabPanel({ balance }: { balance: number }) {
  const [page, setPage] = useState(0);
  const allTime = ACTIVITY.reduce((sum, row) => sum + row.credits, 0) + 961_841;
  const rows = ACTIVITY.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const lastPage = Math.max(0, Math.ceil(ACTIVITY.length / PAGE_SIZE) - 1);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 rounded-2xl bg-[#f7f6f8] p-5 sm:grid-cols-2">
        <div>
          <p className="text-[13px] text-[#8a8490]">Current Balance</p>
          <p className="mt-1 text-[26px] font-bold tracking-[-0.02em] text-[#28222e]">{formatNumber(balance)}</p>
          <p className="text-[12px] text-[#8a8490]">credits remaining</p>
        </div>
        <div>
          <p className="text-[13px] text-[#8a8490]">All Time</p>
          <p className="mt-1 text-[26px] font-bold tracking-[-0.02em] text-[#28222e]">{formatNumber(allTime)}</p>
          <p className="text-[12px] text-[#8a8490]">total credits used</p>
        </div>
      </section>

      <section>
        <h3 className="text-[15px] font-bold text-[#28222e]">Recent Activity</h3>
        <div className="mt-3 overflow-x-auto rounded-xl border border-[#f0eef2]">
          <table className="w-full min-w-[520px]">
            <thead>
              <tr className="bg-[#f7f6f8] text-left text-[12px] font-semibold text-[#7b7480]">
                <th className="px-4 py-3 font-semibold">Action</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 text-right font-semibold">Credits</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${row.action}-${row.date}-${index}`} className="border-t border-[#f2f0f4]">
                  <td className="px-4 py-3 text-[13px] text-[#28222e]">{row.action}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-[#fff1ec] px-2 py-0.5 text-[11px] font-semibold text-[#d9542f]">Consumed</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[13px] text-[#7b7480]">{row.date}</td>
                  <td className="px-4 py-3 text-right text-[13px] font-semibold tabular-nums text-[#d9542f]">−{row.credits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex items-center justify-center gap-2">
          <button
            type="button"
            aria-label="Previous page"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="grid size-8 place-items-center rounded-lg text-[#8a8490] transition hover:bg-[#f6f4f7] disabled:opacity-30"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Next page"
            disabled={page >= lastPage}
            onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
            className="grid size-8 place-items-center rounded-lg text-[#8a8490] transition hover:bg-[#f6f4f7] disabled:opacity-30"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </section>
    </div>
  );
}

/* ============================ Credits Top-up ============================ */

export function TopUpTabPanel() {
  const { buyCredits } = useTeam();
  const [qty, setQty] = useState<Record<number, number>>({});

  return (
    <div>
      <p className="text-[13px] text-[#7b7480]">
        Add credits to your plan instantly. Top-up credits roll over and expire 12 months after purchase.
      </p>

      <h3 className="mt-5 text-[14px] font-bold text-[#28222e]">Choose a top-up pack</h3>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {TOPUP_PACKS.map((pack) => {
          const count = qty[pack.credits] ?? 1;
          return (
            <div
              key={pack.credits}
              className={`relative rounded-2xl border p-4 transition ${
                pack.popular ? "border-[#ff5e1a] bg-[#fffaf7]" : "border-[#ececf1] bg-white hover:border-[#ddd7df]"
              }`}
            >
              {pack.popular && (
                <span className="absolute -top-2.5 left-3 rounded-full bg-[#ff5e1a] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white">
                  Popular
                </span>
              )}

              <div className="flex items-start justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  <CirclePlus className="size-[18px] shrink-0 fill-[#ff7a2d] text-white" strokeWidth={2.2} />
                  <span className="text-[17px] font-bold text-[#28222e]">{formatNumber(pack.credits)}</span>
                </span>
                <Dropdown
                  size="sm"
                  align="right"
                  className="w-[52px] shrink-0"
                  ariaLabel={`Quantity for ${formatNumber(pack.credits)} credits`}
                  value={String(count)}
                  onChange={(value) => setQty((prev) => ({ ...prev, [pack.credits]: Number(value) }))}
                  options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `×${n}` }))}
                />
              </div>

              <div className="mt-6 flex items-center justify-between">
                <span className="text-[15px] font-bold text-[#28222e]">${pack.price * count}</span>
                <button
                  type="button"
                  aria-label={`Buy ${formatNumber(pack.credits * count)} credits`}
                  onClick={() => buyCredits(pack.credits * count)}
                  className={`grid size-8 place-items-center rounded-full border transition ${
                    pack.popular
                      ? "border-[#ff5e1a] text-[#ff5e1a] hover:bg-[#fff1ea]"
                      : "border-[#ececf1] text-[#56505c] hover:border-[#ddd7df] hover:bg-[#faf9fb]"
                  }`}
                >
                  <ShoppingCart className="size-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================ Shell ============================ */

export function AccountSettingsModal() {
  const { accountOpen, closeAccount, openAccount } = useTeam();
  const panelRef = useRef<HTMLDivElement>(null);

  // 账户级数据取个人账户,与当前所在团队无关
  const personal = TEAMS.find((t) => t.personal)!;
  const personalPlan = planOf(personal);
  // 个人账户是「一个席位」,额度走 per-seat：套餐的每席额度 − 本人已用 + 买给这个席位的 top-up
  const personalMe = MEMBERS_BY_TEAM[personal.id]?.find((mem) => mem.id === CURRENT_USER_ID);
  const balance =
    Math.max(0, seatCreditsOf(personal) - (personalMe?.usedThisCycle ?? 0)) + (personalMe?.seatTopUp ?? 0);

  // Esc 关闭 + 背景锁滚 + 焦点陷阱
  useDialog({ ref: panelRef, onClose: closeAccount, active: accountOpen !== false });

  if (accountOpen === false) return null;
  const active = accountOpen;

  return (
    <div
      className="fixed inset-x-0 bottom-0 top-[52px] z-[80] grid place-items-center bg-[#1a1a2e]/45 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Account settings"
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className="flex h-[calc(100vh-96px)] max-h-[960px] w-full max-w-[1440px] overflow-hidden rounded-[24px] border border-[#ececf1] bg-white shadow-[0_30px_80px_rgba(26,26,46,0.28)] outline-none"
      >
        <aside className="hidden w-[280px] shrink-0 flex-col border-r border-[#f0eef2] bg-[#faf9fb] p-5 sm:flex">
          {/* 与团队设置侧栏同构:头像 + 空间名。个人账户用用户头像 */}
          <div className="flex items-center gap-2 px-1 pb-4">
            <Avatar size={30} />
            <span className="min-w-0 truncate text-[13px] font-bold text-[#28222e]">{personal.name}</span>
            <ScopeBadge personal />
          </div>
          <nav className="grid gap-1">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => openAccount(key)}
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
            Your personal account. Team billing lives in each team&apos;s own settings.
          </p>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between gap-3 border-b border-[#f0eef2] px-6 py-4">
            <h2 className="text-[17px] font-bold tracking-[-0.02em] text-[#28222e]">{TABS.find((t) => t.key === active)?.label}</h2>
            <button
              type="button"
              onClick={closeAccount}
              aria-label="Close account settings"
              className="grid size-9 place-items-center rounded-xl text-[#8a8490] transition hover:bg-[#f6f4f7] hover:text-[#28222e]"
            >
              <X className="size-[18px]" />
            </button>
          </header>

          <div className="flex gap-1 overflow-x-auto border-b border-[#f0eef2] px-4 py-2 sm:hidden">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => openAccount(key)}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-semibold transition ${
                  active === key ? "bg-[#fff0ea] text-[#ee6545]" : "text-[#706a78]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
            {/* 大弹窗里内容不拉满:表单类页签夹到 760px,用量表格给到 1040px */}
            <div className={`mx-auto w-full ${active === "credits" ? "max-w-full" : "max-w-[760px]"}`}>
              {active === "account" && <AccountTabPanel />}
              {active === "billing" && <BillingTabPanel personalPlanName={personalPlan.name} paid={personalPlan.id !== "free"} />}
              {active === "credits" && <CreditsTabPanel balance={balance} />}
              {active === "topup" && <TopUpTabPanel />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
