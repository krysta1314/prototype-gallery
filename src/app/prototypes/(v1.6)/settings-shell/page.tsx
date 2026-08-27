"use client";

/**
 * 团队设置弹窗 —— 壳子重做（参考 fal 的结构与设计，内容与规则全用我们自己的）
 *
 * 为什么单独开一个路由:这是拿来看设计的壳子,不接现有的 TeamProvider,
 * 免得一边改设计一边被既有状态逻辑绊住。定稿之后再往真弹窗里搬。
 *
 * 从 fal 借的是四件事(都是结构/设计,不是规则):
 *   1. 左栏顶部一个搜索框 —— 设置项一多,导航本身就该可搜
 *   2. 导航分组带小写灰色组标题,而不是平铺一长条
 *   3. 内容区一律卡片:粗标题 + 灰色说明 + 内容,而不是松散堆叠
 *   4. Accounts 区块:个人与各团队列在一起,当前的标 Active,其余给 Switch
 *
 * 没借的:税号/账单地址、额度过期、API Keys/Webhooks 这些 —— 要么我们本期
 * 明确不做,要么是开发者平台才有的概念。
 *
 * 移动端:弹窗转成整屏,并且走「先列表、点进去再看详情」的两段式,
 * 而不是把左栏和内容硬塞进 375px。旧版就是硬塞,结果整个弹窗溢出屏幕。
 */

import { useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Building2,
  ChevronLeft,
  Copy,
  CreditCard,
  Search,
  Shield,
  Users,
  Wallet,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";

const APPLE_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif';

/* ============================ 导航数据 ============================ */

type SectionId =
  | "account"
  | "team-general"
  | "members"
  | "permissions"
  | "activity"
  | "credits"
  | "topup"
  | "billing"
  | "analytics";

type NavItem = { id: SectionId; label: string; icon: LucideIcon };
type NavGroup = { label: string; items: NavItem[] };

/* ---------------------------- 权限模型 ---------------------------- */

/**
 * 这不是两个弹窗,是**一个组件**。
 * 显示什么由三件事推出来:在哪个上下文(个人 / 某个团队)、当前角色、以及该角色
 * 在各管理域上的档位。写死两套界面的话,权限一改就得两边同步,迟早对不上。
 */
type Role = "owner" | "admin" | "finance" | "member";
type Level = "none" | "view" | "manage";
type AreaId = "team" | "users" | "permissions" | "credits" | "billing" | "analytics" | "activity";

const ROLE_LABEL: Record<Role, string> = {
  owner: "Owner",
  admin: "Admin",
  finance: "Billing Admin",
  member: "Member",
};

/** 七个管理域 × 四角色 × 三档 —— 与产品里的默认值同一份口径 */
const AREA_LEVELS: Record<AreaId, Record<Role, Level>> = {
  team:        { owner: "manage", admin: "manage", finance: "none",   member: "none" },
  users:       { owner: "manage", admin: "manage", finance: "none",   member: "view" },
  permissions: { owner: "manage", admin: "manage", finance: "none",   member: "none" },
  credits:     { owner: "manage", admin: "manage", finance: "manage", member: "view" },
  billing:     { owner: "manage", admin: "view",   finance: "manage", member: "none" },
  analytics:   { owner: "manage", admin: "manage", finance: "view",   member: "view" },
  activity:    { owner: "view",   admin: "view",   finance: "view",   member: "none" },
};

/** 每一节归属哪个管理域;account 不归任何域,谁都看得到自己 */
const SECTION_AREA: Record<SectionId, AreaId | null> = {
  account: null,
  "team-general": "team",
  members: "users",
  permissions: "permissions",
  activity: "activity",
  credits: "credits",
  topup: "credits",
  billing: "billing",
  analytics: "analytics",
};

/** 掏钱买东西是结构性权限:给到 Can manage 也仍然只有 Owner 与 Billing Admin 能做 */
const OWNER_OR_FINANCE_ONLY: SectionId[] = ["topup"];

function levelOf(section: SectionId, role: Role): Level {
  const area = SECTION_AREA[section];
  if (!area) return "manage";
  if (OWNER_OR_FINANCE_ONLY.includes(section) && role !== "owner" && role !== "finance") return "none";
  return AREA_LEVELS[area][role];
}

/** 分组沿用 fal 的形状(少量分组、每组 1–4 项),条目全是我们自己的功能 */
const NAV: NavGroup[] = [
  { label: "Account", items: [{ id: "account", label: "Account", icon: Users }] },
  {
    label: "Team",
    items: [
      { id: "team-general", label: "General", icon: Building2 },
      { id: "members", label: "Members", icon: Users },
      { id: "permissions", label: "Permissions & roles", icon: Shield },
      { id: "activity", label: "Activity log", icon: Activity },
    ],
  },
  {
    label: "Credits & billing",
    items: [
      { id: "credits", label: "Credits & usage", icon: Wallet },
      { id: "topup", label: "Top-up", icon: Zap },
      { id: "billing", label: "Billing", icon: CreditCard },
    ],
  },
  { label: "Insights", items: [{ id: "analytics", label: "Analytics", icon: BarChart3 }] },
];

/**
 * 个人账户下同一个组件的样子 —— 没有团队,自然就没有成员、权限、活动日志这些。
 * 不是「另一个弹窗」,是同一个组件在 teamless 上下文下的结果。
 */
const PERSONAL_NAV: NavGroup[] = [
  { label: "Account", items: [{ id: "account", label: "Account", icon: Users }] },
  {
    label: "Credits & billing",
    items: [
      { id: "credits", label: "Credits & usage", icon: Wallet },
      { id: "topup", label: "Top-up", icon: Zap },
      { id: "billing", label: "Billing & subscription", icon: CreditCard },
    ],
  },
];

const TITLES: Record<SectionId, { title: string; desc: string }> = {
  account: { title: "Account", desc: "Your personal profile and the workspaces you belong to." },
  "team-general": { title: "General", desc: "Team name, logo and workspace preferences." },
  members: { title: "Members", desc: "Who's on the team, what they can do, and how many seats are left." },
  permissions: { title: "Permissions & roles", desc: "What each role can see and manage." },
  activity: { title: "Activity log", desc: "Every change made in this team, and who made it." },
  credits: { title: "Credits & usage", desc: "What this cycle's credits are being spent on." },
  topup: { title: "Top-up", desc: "Buy extra credits. They roll over and never expire." },
  billing: { title: "Billing", desc: "Plan, seats, payment method and invoices." },
  analytics: { title: "Analytics", desc: "Usage trends by member and by model." },
};

/* ============================ 演示数据 ============================ */

const ACCOUNTS = [
  { name: "Monica Zhou", handle: "monica.zhou@presslogic.com", kind: "Personal", color: "#ff7a45", active: false },
  { name: "PressLogic Growth", handle: "9 members · Scale", kind: "Team", color: "#5b5bd6", active: true },
  { name: "Beauty Squad", handle: "3 members · Team", kind: "Team", color: "#e0568a", active: false },
  { name: "Atlas Media Group", handle: "12 members · Enterprise", kind: "Team", color: "#12a594", active: false },
];

const MEMBERS = [
  { name: "Alex Chen", email: "alex.chen@presslogic.com", role: "Owner", status: "Active", color: "#5b5bd6" },
  { name: "Monica Zhou", email: "monica.zhou@presslogic.com", role: "Admin", status: "Active", color: "#ff7a45", you: true },
  { name: "Vera Lam", email: "vera.lam@presslogic.com", role: "Admin", status: "Active", color: "#12a594" },
  { name: "Kenji Ito", email: "kenji.ito@presslogic.com", role: "Member", status: "Active", color: "#e0568a" },
  { name: "Priya Singh", email: "priya.singh@presslogic.com", role: "Member", status: "Invited", color: "#8a5cf6" },
];

/* ============================ 通用件 ============================ */

/** 内容区的卡片 —— fal 的基本单位:粗标题 + 灰说明 + 内容 */
function Card({
  title,
  desc,
  action,
  children,
}: {
  title?: string;
  desc?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#ececf1] bg-white">
      {(title || action) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[#f1eff3] px-5 py-4">
          <div className="min-w-0">
            {title && <h3 className="text-[15px] font-bold tracking-[-0.01em] text-[#1a1a2e]">{title}</h3>}
            {desc && <p className="mt-1 text-[12.5px] leading-[1.5] text-[#6a6b7b]">{desc}</p>}
          </div>
          {action}
        </header>
      )}
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

/**
 * 标签在上、值在下 —— fal 用得最多的一种只读行。
 * copyable 的字段右边挂一个复制图标:邮箱、团队名这类是拿来贴进别处的
 * (发邀请、报工单、填合同),让人手选文本是把工具活丢回给用户。
 */
function Field({ label, value, copyable }: { label: string; value: React.ReactNode; copyable?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[12px] text-[#6a6b7b]">{label}</p>
      <p className="mt-0.5 flex items-center gap-1.5 text-[14px] font-semibold text-[#1a1a2e]">
        <span className="min-w-0 truncate">{value}</span>
        {copyable && (
          <button
            aria-label={`Copy ${label}`}
            className="grid size-6 shrink-0 place-items-center rounded-md text-[#a8a4b0] transition hover:bg-[#f4f2f6] hover:text-[#3b3442]"
          >
            <Copy className="size-3.5" />
          </button>
        )}
      </p>
    </div>
  );
}

function Avatar({ name, color, size = 40 }: { name: string; color: string; size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-xl font-bold text-white"
      style={{ width: size, height: size, background: color, fontSize: size * 0.42 }}
    >
      {name[0]}
    </span>
  );
}

function Tag({ tone = "neutral", children }: { tone?: "neutral" | "team" | "good"; children: React.ReactNode }) {
  const map = {
    neutral: "bg-[#f4f2f6] text-[#6a6b7b]",
    team: "bg-[#eeeefb] text-[#5b5bd6]",
    good: "bg-[#e7f4ed] text-[#12734f]",
  } as const;
  return (
    <span className={`inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${map[tone]}`}>
      {children}
    </span>
  );
}

const ghostBtn =
  "h-9 shrink-0 rounded-lg border border-[#ececf1] bg-white px-3 text-[12.5px] font-semibold text-[#3b3442] transition hover:border-[#d4d3df]";
const darkBtn =
  "h-9 shrink-0 rounded-lg bg-[#24202a] px-3.5 text-[12.5px] font-bold text-white transition hover:bg-[#3b3442]";

/* ============================ 各节内容 ============================ */

function AccountSection() {
  return (
    <div className="space-y-4">
      {/*
        个人资料与团队资料并排 —— fal 的做法。放在一起是有道理的:
        用户常搞不清「我这个人」和「我在的这个团队」是两个东西,并排摆一眼就分清。
      */}
      {/*
        左「我这个人」右「我在的这个团队」——  这一对是从 fal 借的,解决的是
        原来那版的实际问题:团队设置里从头到尾只有团队信息,人进去看不到自己是谁、
        什么角色、还剩多少额度。一个团队成员最常问的三件事全在左边这张卡里。
      */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Personal profile" desc="Only you can see and change this.">
          <div className="mb-4 flex items-center gap-3 border-b border-[#f1eff3] pb-4">
            <Avatar name="Monica Zhou" color="#ff7a45" size={44} />
            <p className="min-w-0 truncate text-[15px] font-bold text-[#1a1a2e]">Monica Zhou</p>
          </div>
          <div className="space-y-3">
            <Field label="Email" value="monica.zhou@presslogic.com" copyable />
            <Field label="Member since" value="Jan 19, 2026" />
            <Field label="Personal credits" value="1,240" />
          </div>
        </Card>

        <Card title="Team details" desc="Visible to everyone on this team.">
          <div className="mb-4 flex items-center gap-3 border-b border-[#f1eff3] pb-4">
            <Avatar name="PressLogic Growth" color="#5b5bd6" size={44} />
            <p className="min-w-0 truncate text-[15px] font-bold text-[#1a1a2e]">PressLogic Growth</p>
          </div>
          <div className="space-y-3">
            <Field label="Team name" value="PressLogic Growth" copyable />
            <Field label="Your role" value="Admin" />
            <Field label="Seats" value="9 of 10 used · Scale" />
            <Field label="Renews on" value="Aug 18, 2026" />
          </div>
        </Card>
      </div>

      {/*
        Accounts —— 从 fal 借来的区块,我们尤其需要它:
        我们是「个人账户 + 多个团队」的模型,而现在切换只藏在顶栏那个小切换器里。
      */}
      <Card
        title="Accounts"
        desc="Switch between your personal space and the teams you belong to."
        action={<button className={ghostBtn}>Create team</button>}
      >
        <ul className="divide-y divide-[#f1eff3]">
          {ACCOUNTS.map((a) => (
            <li key={a.name} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <Avatar name={a.name} color={a.color} size={36} />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 truncate text-[13.5px] font-semibold text-[#1a1a2e]">
                  {a.name}
                  <Tag tone={a.kind === "Team" ? "team" : "neutral"}>{a.kind}</Tag>
                </p>
                <p className="truncate text-[12px] text-[#6a6b7b]">{a.handle}</p>
              </div>
              {a.active ? (
                <Tag tone="good">Active</Tag>
              ) : (
                <button className={ghostBtn}>Switch</button>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function TeamGeneralSection() {
  return (
    <div className="space-y-4">
      <Card title="Identity" desc="How this team appears to everyone in it.">
        {/*
          Logo 与名称上下排而不是左右排 —— 左右排在窄屏下会把输入框压成半宽,
          这是旧版在 375px 下的实际问题。
        */}
        <div className="flex flex-wrap items-end gap-5">
          <div>
            <p className="mb-1.5 text-[12px] font-semibold text-[#3b3442]">Logo</p>
            <Avatar name="PressLogic Growth" color="#5b5bd6" size={56} />
            <p className="mt-1.5 text-[11.5px] text-[#6a6b7b]">PNG, JPG or SVG · up to 512 KB</p>
          </div>
          <label className="min-w-[220px] flex-1">
            <span className="mb-1.5 block text-[12px] font-semibold text-[#3b3442]">Team name</span>
            <input
              defaultValue="PressLogic Growth"
              className="h-11 w-full rounded-xl border border-[#ececf1] bg-white px-3.5 text-[14px] text-[#1a1a2e] outline-none transition focus:border-[#ff5e1a]"
            />
          </label>
        </div>
        <div className="mt-4 flex items-center gap-3 border-t border-[#f1eff3] pt-4">
          <button className={`${darkBtn} opacity-40`} disabled>
            Save changes
          </button>
          <span className="text-[12px] text-[#6a6b7b]">Nothing to save yet — edit the name first.</span>
        </div>
      </Card>

      <Card title="Preferences" desc="Applies to everyone on the team.">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[13.5px] font-semibold text-[#1a1a2e]">Teammate usage visibility</p>
            <p className="mt-0.5 max-w-[62ch] text-[12.5px] leading-[1.55] text-[#6a6b7b]">
              Only you, admins and billing admins can see per-teammate usage. Members see just their own.
            </p>
          </div>
          <span className="mt-1 h-6 w-11 shrink-0 rounded-full bg-[#e3e0e8] p-0.5">
            <span className="block size-5 rounded-full bg-white shadow-sm" />
          </span>
        </div>
      </Card>

      <Card title="Danger zone" desc="These can't be undone.">
        <div className="space-y-4">
          <div>
            <p className="text-[13.5px] font-semibold text-[#1a1a2e]">Transfer ownership</p>
            <p className="mt-0.5 text-[12.5px] text-[#6a6b7b]">
              The new owner takes over billing. You&apos;ll become an Admin.
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <select className="h-10 min-w-[200px] flex-1 rounded-xl border border-[#ececf1] bg-white px-3 text-[13.5px] text-[#1a1a2e] outline-none">
                <option>Select a member…</option>
              </select>
              <button className="h-10 shrink-0 rounded-xl border border-[#e0a08e] bg-white px-4 text-[12.5px] font-bold text-[#b23a1c]">
                Transfer
              </button>
            </div>
          </div>
          <div className="border-t border-[#f1eff3] pt-4">
            <p className="text-[13.5px] font-semibold text-[#1a1a2e]">Delete this team</p>
            <p className="mt-0.5 text-[12.5px] text-[#6a6b7b]">
              Team projects and any remaining credits are removed for everyone.
            </p>
            <button className="mt-2.5 h-10 rounded-xl border border-[#e0a08e] bg-white px-4 text-[12.5px] font-bold text-[#b23a1c]">
              Delete team
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function MembersSection() {
  return (
    <div className="space-y-4">
      <Card title="Seats" desc="Pending invitations hold a seat. Expired ones don't.">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-baseline gap-2">
            <span className="text-[28px] font-extrabold tracking-tight text-[#1a1a2e]">9</span>
            <span className="text-[14px] font-semibold text-[#6a6b7b]">of 10 seats used</span>
          </div>
          <button className={ghostBtn}>Manage seats</button>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#f1eff3]">
          <span className="block h-full w-[90%] rounded-full bg-[#ff5e1a]" />
        </div>
      </Card>

      {/*
        成员表 —— fal 的四列结构(User / Role / Status / 操作)。
        窄屏下不横向滚,而是转成卡片式堆叠:表格在手机上横滚是最难用的一种降级。
      */}
      <Card
        title="Team members"
        desc="Manage roles and access."
        action={<button className={darkBtn}>Invite members</button>}
      >
        {/* 表头只在够宽时出现 */}
        <div className="hidden grid-cols-[1fr_120px_100px_40px] gap-3 border-b border-[#f1eff3] pb-2 text-[11.5px] font-semibold uppercase tracking-wide text-[#8a8490] sm:grid">
          <span>User</span>
          <span>Role</span>
          <span>Status</span>
          <span />
        </div>
        <ul className="divide-y divide-[#f1eff3]">
          {MEMBERS.map((m) => (
            <li
              key={m.email}
              /*
               * 窄屏两行:身份一行、角色/状态一行。挤在一行会把邮箱截成
               * 「alex.chen@pres…」—— 邮箱是这一行里唯一能区分人的信息,截了就白列了。
               * sm 以上用 grid,meta 那层 sm:contents 把自己摘掉,让子元素直接落进网格。
               */
              className="flex flex-col gap-2 py-3 sm:grid sm:grid-cols-[1fr_120px_100px_40px] sm:items-center sm:gap-3"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <Avatar name={m.name} color={m.color} size={32} />
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-semibold text-[#1a1a2e]">
                    {m.name}
                    {m.you && <span className="ml-1.5 text-[11.5px] font-medium text-[#8a8490]">(You)</span>}
                  </p>
                  <p className="truncate text-[12px] text-[#6a6b7b]">{m.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 pl-[42px] sm:contents">
                <span className="text-[13px] font-semibold text-[#3b3442]">{m.role}</span>
                <span>
                  <Tag tone={m.status === "Active" ? "good" : "neutral"}>{m.status}</Tag>
                </span>
                <button
                  aria-label={`Actions for ${m.name}`}
                  className="ml-auto grid size-8 shrink-0 place-items-center rounded-lg text-[#8a8490] transition hover:bg-[#f6f4f7] hover:text-[#1a1a2e]"
                >
                  ⋯
                </button>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

/** 其余几节先给一张卡说明将来放什么 —— 壳子阶段不编造内容 */
function StubSection({ id }: { id: SectionId }) {
  const notes: Partial<Record<SectionId, string[]>> = {
    permissions: [
      "Workspace access — one switch for Marketing Agent & Canvas",
      "Admin areas — seven areas × three levels (No access / Can view / Can manage)",
      "Owner column is locked; nobody can edit their own column",
    ],
    activity: ["Every change with who, what and when", "Enterprise teams can export it"],
    credits: ["This cycle's allowance and what's left", "Per-seat or shared pool, depending on the plan"],
    topup: ["Buy extra credits — they roll over and never expire", "Auto top-up with a monthly cap"],
    billing: ["Plan and seats", "Payment method", "Invoices"],
    analytics: ["Four KPIs with period-over-period change", "By member and by model"],
  };
  return (
    <Card title="What lives here" desc="Shell only — the real content moves in once the layout is signed off.">
      <ul className="space-y-2">
        {(notes[id] ?? []).map((n) => (
          <li key={n} className="flex gap-2 text-[13px] leading-[1.6] text-[#3b3442]">
            <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-[#d4d3df]" />
            {n}
          </li>
        ))}
      </ul>
    </Card>
  );
}

function SectionBody({ id, readOnly }: { id: SectionId; readOnly: boolean }) {
  return (
    <div className="space-y-4">
      {/*
        「看得见但改不了」是三档权限里最要紧的一档,产品里早就在跑(例:Admin 看得到
        账单但只能提申请)。不明说的话用户会以为是坏了,而不是没权限。
      */}
      {readOnly && (
        <p className="flex items-center gap-2 rounded-xl border border-[#f5ddc0] bg-[#fffaf1] px-3.5 py-2.5 text-[12.5px] font-semibold text-[#8f5514]">
          <Shield className="size-4 shrink-0" />
          View only — your role can see this but not change it.
        </p>
      )}
      {id === "account" ? (
        <AccountSection />
      ) : id === "team-general" ? (
        <TeamGeneralSection />
      ) : id === "members" ? (
        <MembersSection />
      ) : (
        <StubSection id={id} />
      )}
    </div>
  );
}

/* ============================ 背后的工作区 ============================ */

/**
 * 低保真的工作区背景 —— 只为了让弹窗看起来是「压在东西上」的。
 * 设置弹窗离开背景单独看会失真:遮罩的深浅、面板的投影、圆角在深色上的收边,
 * 这些只有叠在真实内容上才判断得准。
 */
function FauxWorkspace() {
  return (
    <div aria-hidden className="absolute inset-0 flex overflow-hidden bg-white">
      <div className="hidden w-[216px] shrink-0 flex-col gap-1 border-r border-[#ebe8ee] bg-white px-4 py-5 lg:flex">
        <div className="mb-4 size-8 rounded-xl bg-gradient-to-br from-[#FFA73C] to-[#FF5255]" />
        {["Home", "Marketing Agent", "Canvas", "Assets"].map((t, i) => (
          <div
            key={t}
            className={`flex h-10 items-center gap-2.5 rounded-xl px-3 text-[13.5px] font-semibold ${
              i === 0 ? "bg-[#fff3ec] text-[#ff5e1a]" : "text-[#6a6b7b]"
            }`}
          >
            <span className="size-4 rounded bg-current opacity-25" />
            {t}
          </div>
        ))}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex h-[60px] items-center justify-end gap-3 border-b border-[#f1eff3] px-6">
          <span className="h-9 w-28 rounded-full bg-[#fff3ec]" />
          <span className="h-9 w-24 rounded-full bg-gradient-to-r from-[#FFA73C] to-[#FF5255]" />
          <span className="size-9 rounded-full bg-[#f1eff3]" />
        </div>
        <div className="px-6 py-6">
          <div className="h-9 w-[320px] rounded-lg bg-[#f1eff3]" />
          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] rounded-2xl bg-[#f6f4f7]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================ 弹窗外壳 ============================ */

export default function SettingsShellPage() {
  /** 上下文:个人账户,还是某个团队。同一个组件,两种结果 */
  const [ctx, setCtx] = useState<"personal" | "team">("team");
  const [role, setRole] = useState<Role>("owner");
  const [active, setActive] = useState<SectionId>("account");
  const [query, setQuery] = useState("");
  /** 移动端:先看列表,点进去才看详情。>=md 时这个状态不参与渲染 */
  const [mobileDetail, setMobileDetail] = useState(false);

  const groups = useMemo(() => {
    const base = ctx === "personal" ? PERSONAL_NAV : NAV;
    // 团队上下文才按权限过滤;个人账户下所有条目都是自己的东西
    const allowed =
      ctx === "personal"
        ? base
        : base
            .map((g) => ({ ...g, items: g.items.filter((i) => levelOf(i.id, role) !== "none") }))
            .filter((g) => g.items.length);

    const q = query.trim().toLowerCase();
    if (!q) return allowed;
    return allowed
      .map((g) => ({ ...g, items: g.items.filter((i) => i.label.toLowerCase().includes(q)) }))
      .filter((g) => g.items.length);
  }, [ctx, role, query]);

  /* 当前这一节被权限收走了就自动退回第一个可见的 —— 不能停在一个看不见的节上 */
  const visibleIds = useMemo(() => groups.flatMap((g) => g.items.map((i) => i.id)), [groups]);
  const activeId: SectionId = visibleIds.includes(active) ? active : visibleIds[0] ?? "account";
  const readOnly = ctx === "team" && levelOf(activeId, role) === "view";

  const open = (id: SectionId) => {
    setActive(id);
    setMobileDetail(true);
  };

  const meta = TITLES[activeId];

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ fontFamily: APPLE_FONT }}>
      <FauxWorkspace />

      {/* 演示控制条 —— 不属于产品界面,所以用中文。它存在的意义就是让人看到
          「同一个组件」在不同上下文与角色下长出不同的导航和内容 */}
      <div className="fixed inset-x-0 top-0 z-[60] flex flex-wrap items-center gap-x-4 gap-y-2 bg-[#1a1a2e] px-4 py-2.5 text-[12px] text-white/70">
        <span className="font-semibold text-white/90">演示控制</span>
        <label className="flex items-center gap-1.5">
          上下文
          <select
            value={ctx}
            onChange={(e) => setCtx(e.target.value as "personal" | "team")}
            className="rounded-md bg-white/10 px-2 py-1 font-semibold text-white outline-none"
          >
            <option className="text-[#1a1a2e]" value="personal">个人账户</option>
            <option className="text-[#1a1a2e]" value="team">团队 · PressLogic Growth</option>
          </select>
        </label>
        {ctx === "team" && (
          <span className="flex items-center gap-1.5">
            角色
            {(["owner", "admin", "finance", "member"] as Role[]).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`rounded-md px-2 py-1 font-semibold transition ${
                  role === r ? "bg-[#ff5e1a] text-white" : "bg-white/10 text-white/70 hover:text-white"
                }`}
              >
                {ROLE_LABEL[r]}
              </button>
            ))}
          </span>
        )}
        <span className="ml-auto hidden text-white/45 sm:block">
          切角色看左栏条目增减；Admin 的 Billing 是「看得见改不了」
        </span>
      </div>

      {/*
        遮罩 —— 桌面端压暗背景,移动端弹窗本来就占满整屏,遮罩看不见也无所谓。
        用品牌的深蓝黑而不是纯黑:纯黑压上去会把暖橙背景压成脏灰。
      */}
      <div className="fixed inset-x-0 bottom-0 top-[44px] z-40 bg-[#1a1a2e]/45 backdrop-blur-sm" />

      <div className="fixed inset-x-0 bottom-0 top-[44px] z-50 grid place-items-stretch md:place-items-center md:p-8">
        <div
          className="flex h-full w-full overflow-hidden bg-white md:h-[min(760px,calc(100vh-96px))] md:max-w-[1040px] md:rounded-[20px] md:shadow-[0_30px_80px_rgba(26,26,46,0.32)]"
          role="dialog"
          aria-modal="true"
          aria-label="Settings"
        >
        {/* ---------- 左栏 ---------- */}
        <aside
          className={`w-full shrink-0 flex-col border-[#f1eff3] bg-[#fcfbfd] md:flex md:w-[248px] md:border-r ${
            mobileDetail ? "hidden" : "flex"
          }`}
        >
          <div className="flex items-center gap-2.5 px-4 pb-3 pt-4">
            <Avatar name="PressLogic Growth" color="#5b5bd6" size={28} />
            <span className="min-w-0 flex-1 truncate text-[13.5px] font-bold text-[#1a1a2e]">PressLogic Growth</span>
            <Tag tone="team">Team</Tag>
          </div>

          {/* 搜索 —— 设置项一多,导航本身就该可搜(fal 的做法) */}
          <div className="px-3 pb-2">
            <div className="flex h-9 items-center gap-2 rounded-lg border border-[#ececf1] bg-white px-2.5">
              <Search className="size-3.5 shrink-0 text-[#8a8490]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search settings"
                className="min-w-0 flex-1 bg-transparent text-[13px] text-[#1a1a2e] outline-none placeholder:text-[#9a9bb0]"
              />
            </div>
          </div>

          <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
            {groups.map((g) => (
              <div key={g.label} className="mt-3 first:mt-1">
                <p className="px-2 pb-1 text-[11px] font-semibold text-[#8a8490]">{g.label}</p>
                {g.items.map((item) => {
                  const Icon = item.icon;
                  const on = item.id === activeId;
                  return (
                    <button
                      key={item.id}
                      onClick={() => open(item.id)}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-[13.5px] transition ${
                        on
                          ? "bg-[#fff3ec] font-bold text-[#ff5e1a]"
                          : "font-medium text-[#3b3442] hover:bg-[#f4f2f6]"
                      }`}
                    >
                      <Icon className="size-4 shrink-0" strokeWidth={2} />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            ))}
            {!groups.length && (
              <p className="px-2 py-6 text-[12.5px] text-[#6a6b7b]">No settings match “{query}”.</p>
            )}
          </nav>

          <p className="border-t border-[#f1eff3] px-4 py-3 text-[11.5px] leading-[1.5] text-[#8a8490]">
            Personal billing lives in your own account settings.
          </p>
        </aside>

        {/* ---------- 内容区 ---------- */}
        <main className={`min-w-0 flex-1 flex-col ${mobileDetail ? "flex" : "hidden md:flex"}`}>
          <header className="flex items-start gap-3 border-b border-[#f1eff3] px-4 py-4 md:px-6">
            {/* 移动端返回列表 */}
            <button
              onClick={() => setMobileDetail(false)}
              aria-label="Back to settings list"
              className="-ml-1 grid size-9 shrink-0 place-items-center rounded-lg text-[#6a6b7b] transition hover:bg-[#f6f4f7] md:hidden"
            >
              <ChevronLeft className="size-5" />
            </button>
            <div className="min-w-0 flex-1">
              <h2 className="text-[18px] font-extrabold tracking-[-0.02em] text-[#1a1a2e]">{meta.title}</h2>
              <p className="mt-0.5 text-[12.5px] leading-[1.5] text-[#6a6b7b]">{meta.desc}</p>
            </div>
            <button
              aria-label="Close settings"
              className="grid size-9 shrink-0 place-items-center rounded-lg text-[#8a8490] transition hover:bg-[#f6f4f7] hover:text-[#1a1a2e]"
            >
              <X className="size-[18px]" />
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto bg-[#faf9fb] px-4 py-5 md:px-6">
            <SectionBody id={activeId} readOnly={readOnly} />
          </div>
          </main>
        </div>
      </div>
    </div>
  );
}
