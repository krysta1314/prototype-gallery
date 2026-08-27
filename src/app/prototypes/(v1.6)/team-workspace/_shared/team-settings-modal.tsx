"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowUpDown,
  BarChart3,
  Bell,
  Building2,
  Check,
  ChevronDown,
  Coins,
  Copy,
  CreditCard,
  Crown,
  Download,
  HelpCircle,
  Infinity as InfinityIcon,
  Info,
  Lock,
  LogOut,
  Mail,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  ScrollText,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  X,
  Zap,
} from "lucide-react";
import {
  CANCEL_REASONS,
  CREDIT_PACKS,
  CURRENT_USER_ID,
  formatNumber,
  IDLE_DAYS,
  lastActiveLabel,
  PLANS,
  TEAM_PLANS,
  PERMISSION_GROUPS,
  PERMISSION_AREAS,
  PERMISSION_FEATURES,
  LEVEL_LABEL,
  type PermissionLevel,
  isUpgradeBetween,
  ROLE_LABEL,
  ROLE_RANK,
  seatPriceOf,
  type ActivityKind,
  type BillingCycle,
  type CardBrand,
  type PaymentMethod,
  type Member,
  type PlanId,
  type Role,
} from "./data";
import { Dropdown } from "./dropdown";
import { MiniLineChart } from "./usage-chart";
import {
  buildUsageSeries,
  daysBetween,
  parseDayStamp,
  TODAY_STAMP,
  UPDATED_AT,
  USAGE_RANGES,
  type UsageRangeKey,
  type UsageSeries,
} from "./usage-series";
import { TopUpTabPanel } from "./account-settings-modal";
import { useTeam, type SettingsTab } from "./team-context";
import { useDialog } from "./use-dialog";
import { TeamAvatar } from "./identity-menu";
import { ScopeBadge } from "./plan-badge";

type Tab = SettingsTab;

/**
 * 侧栏分组 —— 八条平铺时读者要自己在脑子里分类。
 *
 * 分组不是为了好看,是为了让「我要找的东西在哪一类」这件事不用想:
 *   Team      团队本身怎么配、谁在里面、谁能做什么
 *   Security  采购与审计关心的两件事 —— 安全设置和操作日志本来就是一对
 *   Billing   钱:额度、充值、账单
 */
const TAB_GROUPS: { title: string; keys: Tab[] }[] = [
  { title: "Team", keys: ["general", "members", "permissions", "activity"] },
  /*
   * Analytics 独立成一页 —— Credits & usage 原来同时在干两件事:
   * 「还能不能干活」(账户状态,被卡住时天天看)和「钱花哪儿了」(趋势,月底看)。
   * 合在一屏的结果是 Owner 想查「谁快用完了」得先滚过两张面积图。
   *
   * 它归 Billing 组:分析的是额度花在哪,不是团队怎么配。
   */
  /*
   * 顺序按「用得多 → 用得少」:余额(天天看)→ 充值(卡住时立刻要)→ 账单(月底)→ 分析(偶尔复盘)。
   * Analytics 排最后是因为它不解决任何当下的问题,只回答「上个月钱花哪儿了」。
   */
  { title: "Credits & billing", keys: ["credits", "topup", "billing", "analytics"] },
];

const ALL_TABS: { key: Tab; label: string; icon: typeof Building2 }[] = [
  { key: "general", label: "General", icon: Building2 },
  { key: "members", label: "Members", icon: Users },
  { key: "permissions", label: "Permissions & roles", icon: ShieldCheck },
  /*
   * Security & data 本期不做(2026-08-21 决定),所以不在导航里出现。
   * 组件与 SettingsTab 类型都保留着 —— 下一期把这一条加回 ALL_TABS 和
   * TAB_GROUPS 就能整块回来,不用重写 SSO / SCIM / 2FA / 数据声明那几块。
   */
  { key: "credits", label: "Credits & usage", icon: Coins },
  { key: "topup", label: "Top-up", icon: Zap },
  { key: "billing", label: "Billing", icon: CreditCard },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "activity", label: "Activity log", icon: ScrollText },
];

/** Activity Log 每类动作一个颜色,扫一眼就知道是人员变动还是钱的事 */
const ACTIVITY_TONE: Record<ActivityKind, string> = {
  member: "bg-[#e7f0ff] text-[#2f6bff]",
  role: "bg-[#efeaff] text-[#6d4bff]",
  limit: "bg-[#e6f7f4] text-[#0f9488]",
  billing: "bg-[#fff3ec] text-[#c06a20]",
  credits: "bg-[#fdeff5] text-[#c23f79]",
  team: "bg-[#f2f0f4] text-[#6d6675]",
  security: "bg-[#eef1f7] text-[#3f5a8a]",
};

const ACTIVITY_LABEL: Record<ActivityKind, string> = {
  member: "Members",
  role: "Roles",
  limit: "Limits",
  billing: "Billing",
  credits: "Credits",
  team: "Team",
  security: "Security",
};

/**
 * 站内操作日志 —— 评审第 7 项:「上个月是谁改了 Kenji 的额度」现在产品里查得到,
 * 不用再把邮箱当日志用。所有改动都会即时写进来,不是一堆贴死的假数据。
 */
function ActivityTab() {
  const { activity, isPool, team, showToast } = useTeam();
  const [filter, setFilter] = useState<"all" | ActivityKind>("all");
  /*
   * 审计日志所有商业档都能在产品里读 —— 竞品都在入门商业档就给,定在 Enterprise 会被比下去。
   * 「导出」才是 Enterprise 的付费理由:采购要的是能进他们自己 SIEM 的机器可读文件。
   */
  const canExport = isPool;
  const kinds = useMemo(() => Array.from(new Set(activity.map((entry) => entry.kind))), [activity]);
  const visible = filter === "all" ? activity : activity.filter((entry) => entry.kind === filter);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-[62ch] text-[12.5px] leading-snug text-[#6d6675]">
          Everything that changes who&apos;s on the team, what they can spend, and what the team pays for.
        </p>
        {canExport ? (
          <button
            type="button"
            onClick={() => {
              // 原型里不真的下文件,只把导出口径讲清楚
              showToast(`Audit log for ${team.name} queued — CSV and JSONL land in your inbox.`, "success");
            }}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-[#ececf1] px-3 text-[12.5px] font-bold text-[#3b3442] transition hover:border-[#ddd7df] hover:bg-[#faf9fb]"
          >
            <Download className="size-3.5" /> Export log
          </button>
        ) : (
          <span
            className="shrink-0 rounded-xl bg-[#faf9fb] px-3 py-2 text-[11.5px] leading-snug text-[#6d6675]"
            title="Machine-readable export is an Enterprise capability"
          >
            Export is on Enterprise
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", ...kinds] as const).map((key) => {
          const active = filter === key;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(key)}
              className={`h-8 rounded-lg px-3 text-[12px] font-bold transition ${
                active ? "bg-[#24202a] text-white" : "bg-[#f6f4f7] text-[#706a78] hover:bg-[#efedf1]"
              }`}
            >
              {key === "all" ? "All" : ACTIVITY_LABEL[key]}
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-[#ddd7df] bg-[#faf9fb] px-6 py-16 text-center">
          <ScrollText className="size-7 text-[#c3bcc8]" />
          <p className="mt-3 text-[13.5px] font-bold text-[#3b3442]">Nothing here yet</p>
          <p className="mt-1 max-w-[320px] text-[12.5px] text-[#6d6675]">Changes show up as soon as someone makes them.</p>
        </div>
      ) : (
        <ol className="space-y-0">
          {visible.map((entry, index) => (
            <li key={entry.id} className="relative flex gap-3 pb-5 last:pb-0">
              {/* 时间线竖线,最后一条不画 */}
              {index < visible.length - 1 && (
                <span aria-hidden="true" className="absolute left-[13px] top-7 h-[calc(100%-16px)] w-px bg-[#f0eef2]" />
              )}
              <span
                className={`relative z-10 mt-0.5 grid size-[27px] shrink-0 place-items-center rounded-full text-[10px] font-bold ${ACTIVITY_TONE[entry.kind]}`}
              >
                {ACTIVITY_LABEL[entry.kind][0]}
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-[13px] leading-snug text-[#28222e]">
                  <span className="font-bold">{entry.actor}</span> {entry.action}
                </p>
                <p className="mt-0.5 text-[11.5px] text-[#a8a2ae]">{entry.at}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function UsageBar({
  label,
  right,
  pct,
  tone = "#ff7955",
  note,
}: {
  label: string;
  right: string;
  pct: number;
  tone?: string;
  note?: string;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-[13px]">
        <span className="font-semibold text-[#3b3442]">{label}</span>
        <span className="text-[#7b7480]">{right}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#f1eff3]">
        <div className="h-full rounded-full transition-[width]" style={{ width: `${Math.min(100, Math.round(pct * 100))}%`, background: tone }} />
      </div>
      {note && <p className="mt-1.5 text-[11px] text-[#6d6675]">{note}</p>}
    </div>
  );
}

/* ============================ General ============================ */

/**
 * 组织 logo —— 邀请邮件、落地页、切换器都会用到它,所以放在 General 的第一屏。
 * 没上传就是首字母方块(和全站一致),上传后所有出现 TeamAvatar 的地方同步换掉。
 * 原型里存 data URL,真实实现走对象存储 + CDN。
 */
const LOGO_MAX_KB = 512;

function LogoField({ compact = false }: { compact?: boolean } = {}) {
  const { team, isPersonal, role, setTeamLogo, showToast } = useTeam();
  const fileRef = useRef<HTMLInputElement>(null);
  const canEdit = !isPersonal && (role === "owner" || role === "admin");

  const pick = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Pick an image file — PNG, JPG or SVG.");
      return;
    }
    if (file.size > LOGO_MAX_KB * 1024) {
      showToast(`That file is too big. Keep the logo under ${LOGO_MAX_KB} KB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setTeamLogo(String(reader.result));
    reader.readAsDataURL(file);
  };

  const [dragging, setDragging] = useState(false);

  /*
   * 头像本身就是控件 —— 之前是「首字母方块 + 旁边一个 Upload 按钮 + 一个 Remove 按钮」,
   * 三个元素讲一件事,而且方块看起来不可点。Linear / Notion / Slack 这类都是同一个做法:
   * 点头像即选文件,角落挂一个 edit 徽章说明它可点。
   *
   * 徽章常驻而不是只在 hover 出现 —— hover-only 在触屏上等于没有。
   * 顺带支持把图直接拖到头像上,这是 logo 字段的常规期待。
   */
  return (
    <div className="shrink-0">
      {/* compact:嵌在 Team details 卡片里时不再自带标签,那儿的语境已经说明它是什么 */}
      {!compact && <span className="mb-1.5 block text-[12px] text-[#6d6675]">Logo</span>}
      <div className="flex items-center gap-3">
        {canEdit ? (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                pick(event.target.files?.[0]);
                // 允许连续选同一个文件
                event.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                pick(event.dataTransfer.files?.[0]);
              }}
              aria-label={team.logo ? "Replace the team logo" : "Upload a team logo"}
              title={team.logo ? "Replace logo" : "Upload logo"}
              className={`group relative shrink-0 rounded-[16px] outline-none transition duration-200 focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/25 ${
                dragging ? "ring-2 ring-[#ff5e1a]/60" : ""
              }`}
            >
              <TeamAvatar team={team} size={56} />
              {/* 悬停时压暗底图,让角落的徽章读得出来 */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-[16px] bg-[#1a1a2e]/0 transition-colors duration-200 group-hover:bg-[#1a1a2e]/25"
              />
              <span
                aria-hidden
                className="pointer-events-none absolute -bottom-1 -right-1 grid size-[22px] place-items-center rounded-full border-2 border-white bg-[#24202a] text-white shadow-[0_2px_6px_rgba(26,26,46,0.28)] transition duration-200 group-hover:bg-[#ff5e1a]"
              >
                <Pencil className="size-3" strokeWidth={2.75} />
              </span>
            </button>
            {team.logo && (
              <button
                type="button"
                onClick={() => setTeamLogo(null)}
                className="rounded-lg px-1.5 py-1 text-[12px] font-semibold text-[#6d6675] outline-none transition hover:text-[#d92d20] focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/25"
              >
                Remove
              </button>
            )}
          </>
        ) : (
          <TeamAvatar team={team} size={56} />
        )}
      </div>
      {canEdit && (
        <p className="mt-3 text-[11px] leading-tight text-[#7b7480]">
          PNG, JPG or SVG · up to {LOGO_MAX_KB} KB
        </p>
      )}
    </div>
  );
}

/**
 * 只读身份字段 —— 标签在上、值在下,可复制的右边挂一个复制图标。
 * 邮箱、团队名这类是拿来贴进别处的(发邀请、报工单、填合同),
 * 让人手选文本是把工具活丢回给用户。
 */
function IdentityField({ label, value, copyable }: { label: string; value: string; copyable?: boolean }) {
  const { showToast } = useTeam();
  return (
    <div className="min-w-0">
      <dt className="text-[12px] text-[#6d6675]">{label}</dt>
      <dd className="mt-0.5 flex items-center gap-1.5">
        <span className="min-w-0 truncate text-[14px] font-semibold text-[#28222e]">{value}</span>
        {copyable && (
          <button
            type="button"
            aria-label={`Copy ${label.toLowerCase()}`}
            onClick={() => {
              navigator.clipboard?.writeText(value);
              showToast(`${label} copied.`, "success");
            }}
            className="grid size-6 shrink-0 place-items-center rounded-md text-[#a8a4b0] transition hover:bg-[#f4f2f6] hover:text-[#3b3442]"
          >
            <Copy className="size-3.5" />
          </button>
        )}
      </dd>
    </div>
  );
}

function GeneralTab() {
  const { team, role, isPersonal, members, plan, renewalDate, seatsUsed, seatsTotal, renameTeam, setTeamLogo, deleteTeam, leaveTeam, transferOwnership, hasActiveSubscription, paymentMethod, openSettings, openUsage, setOpenUsage, showToast } =
    useTeam();
  const me = members.find((m) => m.id === CURRENT_USER_ID);
  const [name, setName] = useState(team.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  /*
   * 能接盘的人 —— Billing Admin 排除在外:它是 billing-only、不占席位、没有产品权限,
   * 接了所有权等于凭空多出一个不能创作的 Owner。
   *
   * 于是「只剩 Owner + Billing Admin」时候选人为空,Owner 走不掉:移除自己被禁、
   * 转让没人可转。GPT 与 Claude 不会撞上这个,因为他们的 Owner 可以有多个、
   * 而且没有 billing-only 这种角色 —— 能当 Owner 的人一定有产品权限。
   *
   * 本期维持单 Owner 模型(2026-08-25 定),所以不做绕道,只把话说清楚:
   * 空下拉 + 灰按钮什么都不解释,是最难受的一种死路。ChatGPT 的做法也是这个 ——
   * 它明确报错「You are the last Owner in the workspace」,不设计绕道。
   */
  const transferCandidates = members.filter(
    (m) => m.status === "active" && m.id !== CURRENT_USER_ID && m.role !== "finance",
  );
  const noTransferTarget = transferCandidates.length === 0;
  const [transferTo, setTransferTo] = useState("");
  const [confirmTransfer, setConfirmTransfer] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const canEdit = !isPersonal && (role === "owner" || role === "admin");
  const transferTarget = members.find((m) => m.id === transferTo);

  useEffect(() => {
    setName(team.name);
    setConfirmDelete(false);
    setDeleteInput("");
    setTransferTo("");
    setConfirmTransfer(false);
    setConfirmLeave(false);
  }, [team.id, team.name]);

  return (
    <div className="space-y-8">
      {/*
        左「我是谁」右「这个团队是什么」—— 一个对开的卡片,中间一条竖线分隔。
        为什么要有左半边:团队设置原来从头到尾只有团队信息,人点进来看不到自己是谁、
        什么角色、额度还剩多少 —— 而这三件事恰恰是团队成员最常问的,
        现在要跨三个页面才凑得齐(成员表看角色、额度页看余额、顶栏看名字)。
        个人账户下整块不出现:那儿只有你一个人,没有「我在团队里的身份」这回事。
      */}
      {!isPersonal && me && (
        <section className="overflow-hidden rounded-2xl border border-[#ececf1]">
          <div className="grid md:grid-cols-2 md:divide-x md:divide-[#ececf1]">
            <div className="p-5">
              <h3 className="text-[14px] font-bold tracking-[-0.01em] text-[#28222e]">Personal profile</h3>
              <span
                className="mt-3.5 grid size-12 place-items-center rounded-xl text-[17px] font-bold text-white"
                style={{ background: me.color }}
              >
                {me.name[0]}
              </span>
              <dl className="mt-4 space-y-3.5">
                <IdentityField label="Display name" value={me.name} />
                <IdentityField label="Email" value={me.email} copyable />
                <IdentityField label="Your role" value={ROLE_LABEL[role]} />
                {/*
                  「Joined」单看会被读成「注册日期」。这里要说的是**加入这个团队**的那天 ——
                  两者常常不是同一天(先有个人账号,后来才被拉进团队),而算席位、算用量、
                  查活动日志都是从加入团队那天起算的。
                */}
                <IdentityField label="Joined this team" value={me.joinedAt} />
              </dl>
            </div>

            <div className="border-t border-[#ececf1] p-5 md:border-t-0">
              <h3 className="text-[14px] font-bold tracking-[-0.01em] text-[#28222e]">Team details</h3>
              {/*
                有权限就在这儿直接改,不再另起一段「编辑区」——
                之前是上面读一遍团队名和 logo、下面再给一套输入框和保存按钮,
                同一个东西两个地方。读和写分开摆的唯一理由是「权限不同」,
                但这里不是:能看见的人和能改的人是同一批,那就该原地改。
              */}
              <div className="mt-3.5">{canEdit ? <LogoField compact /> : (
                <span className="grid size-12 place-items-center rounded-xl bg-[#5b5bd6] text-[17px] font-bold text-white">
                  {team.name[0]}
                </span>
              )}</div>
              <dl className="mt-4 space-y-3.5">
                <div className="min-w-0">
                  <dt className="text-[12px] text-[#6d6675]">Team name</dt>
                  <dd className="mt-0.5">
                    {canEdit ? (
                      <input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        aria-label="Team name"
                        className="-ml-2 w-full rounded-lg border border-transparent px-2 py-1 text-[14px] font-semibold text-[#28222e] outline-none transition hover:border-[#ececf1] focus:border-[#ff5e1a] focus:bg-white"
                      />
                    ) : (
                      <span className="block truncate px-0 py-1 text-[14px] font-semibold text-[#28222e]">{team.name}</span>
                    )}
                  </dd>
                </div>
                <IdentityField label="Plan" value={plan.name} />
                <IdentityField label="Seats" value={`${seatsUsed} of ${seatsTotal} used`} />
                <IdentityField label="Renews on" value={renewalDate} />
              </dl>

              {/* 保存条只在真的改了之后出现 —— 没改动时一个常驻的灰按钮只是噪音 */}
              {canEdit && name.trim() !== team.name && (
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#ececf1] pt-4">
                  <button
                    type="button"
                    disabled={!name.trim()}
                    onClick={() => {
                      renameTeam(name.trim());
                      showToast("Team name updated.", "success");
                    }}
                    className="h-9 rounded-lg bg-[#24202a] px-3.5 text-[12.5px] font-bold text-white transition hover:bg-[#3b3442] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setName(team.name)}
                    className="h-9 rounded-lg px-3 text-[12.5px] font-semibold text-[#6d6675] transition hover:text-[#28222e]"
                  >
                    Cancel
                  </button>
                  <span className="text-[11.5px] text-[#8a8490]">PNG, JPG or SVG · up to 512 KB</span>
                </div>
              )}
            </div>
          </div>
        </section>
      )}


      {/*
        * 团队偏好 —— 设置项走列表而不是一个开关套一个卡片。
        * 卡片会让每一条看起来像独立模块,而它们其实是同一组同级选项;
        * 分组标题 + 细分割线才读得出「这是一组设置」,而且加第二条时不用重排版面。
        *
        * 用量可见性默认关 —— 100 人的团队里默认公开是隐私问题。
        */}
      {!isPersonal && role === "owner" && (
        <SettingsGroup title="Preferences">
          <SettingsRow
            title="Teammate usage visibility"
            desc={
              openUsage
                ? "Everyone in the team can see how many credits each teammate used."
                : "Only you, admins, and billing admins can see per-teammate usage. Members see just their own."
            }
          >
            <Switch
              checked={openUsage}
              ariaLabel="Show teammate usage to all members"
              onChange={() => setOpenUsage(!openUsage)}
            />
          </SettingsRow>
        </SettingsGroup>
      )}

      {!isPersonal && role === "owner" && (
        <section className="rounded-2xl border border-[#f2d5cd] bg-[#fffaf8] p-5">
          <h3 className="flex items-center gap-2 text-[15px] font-bold text-[#b23a1c]">
            <AlertTriangle className="size-4" />
            Danger zone
          </h3>

          <div className="mt-4 border-b border-[#f5e2dc] pb-5">
            <div className="flex flex-wrap items-end gap-3">
              <label className="min-w-[220px] flex-1">
                <span className="text-[13px] font-semibold text-[#3b3442]">Transfer ownership</span>
                <div className="mt-2">
                  <Dropdown
                    value={transferTo}
                    onChange={(value) => {
                      setTransferTo(value);
                      setConfirmTransfer(false);
                    }}
                    placeholder="Select a member…"
                    ariaLabel="Transfer ownership to"
                    options={transferCandidates.map((m) => ({ value: m.id, label: m.name }))}
                  />
                </div>
              </label>
              <button
                type="button"
                disabled={!transferTo}
                onClick={() => setConfirmTransfer(true)}
                className="h-10 rounded-xl border border-[#e0a08e] bg-white px-4 text-[13px] font-bold text-[#b23a1c] transition hover:bg-[#fff1ec] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Transfer
              </button>
            </div>
            {noTransferTarget && (
              <p className="mt-2.5 max-w-[68ch] text-[12px] leading-[1.6] text-[#8a7455]">
                There&apos;s nobody here who can take over. Billing admins only have the billing pages — they can&apos;t
                own a team. Invite a member first, then transfer to them. If you&apos;re winding the team down instead,
                delete it below.
              </p>
            )}
            {confirmTransfer && transferTarget && (
              <div className="mt-3 rounded-xl border border-[#e0a08e] bg-white p-3.5">
                <p className="text-[13px] leading-relaxed text-[#3b3442]">
                  Make <span className="font-bold">{transferTarget.name}</span> the owner of {team.name}? You&apos;ll be
                  downgraded to Admin and lose access to billing.
                </p>
                {paymentMethod && (
                  <p className="mt-2.5 flex items-start gap-2 rounded-lg bg-[#fff3ec] px-3 py-2.5 text-[12px] font-semibold leading-snug text-[#b23a1c]">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                    The {paymentMethod.brand} ending {paymentMethod.last4}{" "}
                    and the auto top-up settings stay on this team — update them first if the card is yours, or you&apos;ll keep being charged.
                  </p>
                )}
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      transferOwnership(transferTo);
                      setTransferTo("");
                      setConfirmTransfer(false);
                    }}
                    className="h-9 rounded-lg bg-[#c9432a] px-3 text-[12px] font-bold text-white transition hover:bg-[#b23a1c]"
                  >
                    Yes, transfer ownership
                  </button>
                  <button type="button" onClick={() => setConfirmTransfer(false)} className="h-9 px-2 text-[12px] font-semibold text-[#6d6675] hover:text-[#56505c]">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-5">
            <p className="text-[13px] font-semibold text-[#3b3442]">Delete this team</p>
            <p className="mt-1 text-[12px] text-[#6d6675]">
              Team projects and any remaining credits are removed for everyone. This can&apos;t be undone.
            </p>
            {hasActiveSubscription ? (
              <div className="mt-3 rounded-xl border border-[#e0a08e] bg-white px-3.5 py-3">
                <p className="text-[12px] font-semibold leading-snug text-[#b23a1c]">Cancel your plan before deleting this team.</p>
                <p className="mt-1 text-[12px] leading-snug text-[#6d6675]">
                  {team.name} is on a paid plan. Cancel it in Billing, then come back to delete the team.
                </p>
                <button
                  type="button"
                  onClick={() => openSettings("billing")}
                  className="mt-2.5 text-[12px] font-bold text-[#ee6545] underline underline-offset-2 hover:text-[#b23a1c]"
                >
                  Go to Billing
                </button>
              </div>
            ) : confirmDelete ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <p className="w-full text-[12px] leading-relaxed text-[#6d6675]">
                  You&apos;ll lose {formatNumber(team.topupRemaining)} top-up credits, {members.length} member
                  {members.length === 1 ? "" : "s"}, and every project published to this team.
                </p>
                <input
                  value={deleteInput}
                  onChange={(event) => setDeleteInput(event.target.value)}
                  placeholder={`Type "${team.name}" to confirm`}
                  className="h-10 w-full max-w-[280px] rounded-xl border border-[#e0a08e] bg-white px-3 text-[13px] outline-none focus:border-[#e35b3d]"
                />
                <button
                  type="button"
                  disabled={deleteInput !== team.name}
                  onClick={deleteTeam}
                  className="h-10 rounded-xl bg-[#c9432a] px-4 text-[13px] font-bold text-white transition hover:bg-[#b23a1c] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Delete team
                </button>
                <button type="button" onClick={() => setConfirmDelete(false)} className="h-10 px-2 text-[13px] font-semibold text-[#6d6675] hover:text-[#56505c]">
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="mt-3 h-10 rounded-xl border border-[#e0a08e] bg-white px-4 text-[13px] font-bold text-[#b23a1c] transition hover:bg-[#fff1ec]"
              >
                Delete team
              </button>
            )}
          </div>
        </section>
      )}

      {!isPersonal && role !== "owner" && (
        <section className="rounded-2xl border border-[#ececf1] bg-[#faf9fb] p-5">
          <h3 className="text-[15px] font-bold text-[#28222e]">Leave team</h3>
          <p className="mt-1 text-[12px] text-[#6d6675]">
            You&apos;ll lose access to {team.name} and its team projects. Anything you published stays with the team.
          </p>
          {confirmLeave ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[13px] font-semibold text-[#3b3442]">Leave {team.name}?</span>
              <button type="button" onClick={leaveTeam} className="h-10 rounded-xl bg-[#c9432a] px-4 text-[13px] font-bold text-white transition hover:bg-[#b23a1c]">
                Yes, leave
              </button>
              <button type="button" onClick={() => setConfirmLeave(false)} className="h-10 px-2 text-[13px] font-semibold text-[#6d6675] hover:text-[#56505c]">
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmLeave(true)}
              className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl border border-[#ddd7df] bg-white px-4 text-[13px] font-bold text-[#56505c] transition hover:border-[#e0a08e] hover:text-[#b23a1c]"
            >
              <LogOut className="size-4" />
              Leave team
            </button>
          )}
        </section>
      )}

      {!isPersonal && role === "owner" && (
        <p className="text-[12px] text-[#6d6675]">Owners can&apos;t leave a team. Transfer ownership first, then leave from this page.</p>
      )}
    </div>
  );
}

/* ============================ Members ============================ */

function AllocationDialog({ member, onClose }: { member: Member; onClose: () => void }) {
  const { setAllocation, nextBill } = useTeam();
  const [mode, setMode] = useState<"none" | "soft" | "hard">(member.allocation ? member.allocation.mode : "none");
  const [credits, setCredits] = useState(String(member.allocation?.credits ?? 20000));
  const [helpFor, setHelpFor] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const value = Number(credits.replace(/[^\d]/g, "")) || 0;

  useDialog({ ref: panelRef, onClose });

  const TYPES = [
    {
      key: "none" as const,
      label: "No allocation",
      icon: InfinityIcon,
      help: "The member can generate freely until the shared pool runs out.",
    },
    {
      key: "soft" as const,
      label: "Soft cap",
      icon: Bell,
      help: "Past their allocation the member gets a warning but can keep working while the shared pool lasts.",
    },
    {
      key: "hard" as const,
      label: "Hard cap",
      icon: Lock,
      help: "Past their allocation the member can't submit any task, even if the shared pool still has credits.",
    },
  ];

  return (
    <div className="fixed inset-x-0 bottom-0 top-[52px] z-[95] grid place-items-center bg-[#1a1a2e]/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Allocation">
      <div
        ref={panelRef}
        tabIndex={-1}
        className="w-full max-w-[460px] rounded-[24px] border border-[#ececf1] bg-white p-6 shadow-[0_30px_80px_rgba(26,26,46,0.28)] outline-none"
      >
        <div className="relative text-center">
          {/* 只有 Enterprise 才有这回事 —— 从共享池里切一块给某个人,所以叫 allocation 而不是 limit */}
          <h2 className="text-[17px] font-bold tracking-[-0.02em] text-[#28222e]">Allocation</h2>
          <p className="mt-1 text-[13px] text-[#6d6675]">
            How many credits {member.name} can use each month · resets on {nextBill}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute -right-1 -top-1 grid size-8 place-items-center rounded-lg text-[#8a8490] transition hover:bg-[#f6f4f7] hover:text-[#28222e]"
          >
            <X className="size-[18px]" />
          </button>
        </div>

        <p className="mt-6 text-[12px] font-semibold text-[#6d6675]">Type</p>
        <div className="mt-2 grid grid-cols-3 gap-2.5">
          {TYPES.map((type) => {
            const active = mode === type.key;
            const Icon = type.icon;
            return (
              <button
                key={type.key}
                type="button"
                onClick={() => setMode(type.key)}
                aria-pressed={active}
                className={`relative grid place-items-center gap-1.5 rounded-2xl border px-2 py-4 transition ${
                  active ? "border-[#ff5e1a] bg-[#fff8f4]" : "border-[#ececf1] bg-white hover:border-[#ddd7df]"
                }`}
              >
                <span
                  onMouseEnter={() => setHelpFor(type.key)}
                  onMouseLeave={() => setHelpFor((current) => (current === type.key ? null : current))}
                  className="absolute right-2 top-2 text-[#c3bcc8] transition hover:text-[#6d6675]"
                >
                  <HelpCircle className="size-3.5" />
                  {helpFor === type.key && (
                    <span
                      role="tooltip"
                      className="pointer-events-none absolute bottom-[calc(100%+8px)] right-0 z-10 w-[210px] rounded-xl bg-[#24202a] px-3 py-2 text-left text-[11px] font-medium leading-[1.5] text-white shadow-[0_10px_28px_rgba(26,26,46,0.28)]"
                    >
                      {type.help}
                    </span>
                  )}
                </span>
                <Icon className={`size-5 ${active ? "text-[#ff5e1a]" : "text-[#8a8490]"}`} />
                <span className={`text-[13px] font-bold ${active ? "text-[#28222e]" : "text-[#56505c]"}`}>{type.label}</span>
              </button>
            );
          })}
        </div>

        {/* 三种类型的高度固定,切换时弹窗不跳动 */}
        {mode === "none" ? (
          <div className="mt-4 flex min-h-[116px] flex-col justify-center rounded-2xl bg-[#faf9fb] px-4 py-3.5">
            <p className="text-[13px] font-bold text-[#28222e]">No allocation</p>
            <p className="mt-1 text-[12px] text-[#6d6675]">{member.name} can use the whole team pool until it runs out</p>
          </div>
        ) : (
          <div className="mt-4 min-h-[116px]">
            {/* soft / hard 用同一个字段名,之前一个叫 Balance Per Cycle、一个叫 Fixed Balance,
                指的却是同一个东西;周期也固定为月,不再有 Weekly 这第四种口径 */}
            <label className="block">
              <span className="text-[12px] font-semibold text-[#6d6675]">Credits per month</span>
              <span className="mt-1.5 flex h-11 items-center gap-2 rounded-xl border border-[#ececf1] bg-white pl-3.5 pr-3 transition focus-within:border-[#ff5e1a]">
                <input
                  value={credits}
                  onChange={(event) => setCredits(event.target.value)}
                  inputMode="numeric"
                  className="min-w-0 flex-1 bg-transparent text-[14px] text-[#28222e] outline-none"
                />
                <span className="shrink-0 text-[12px] font-semibold text-[#6d6675]">Credits</span>
              </span>
            </label>
            <p className="mt-2 text-[11px] leading-[1.5] text-[#6d6675]">
              {mode === "soft"
                ? `Resets on ${nextBill}. Past the limit the member can keep submitting tasks, and an email goes to the owner and admins.`
                : `Resets on ${nextBill}. Past the limit the member can't submit tasks, and an email goes to the owner and admins.`}
            </p>
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl border border-[#ececf1] text-[13px] font-bold text-[#56505c] transition hover:border-[#ddd7df] hover:bg-[#faf9fb]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={mode !== "none" && value <= 0}
            onClick={() => {
              setAllocation(member.id, mode === "none" ? null : { credits: value, mode });
              onClose();
            }}
            className="h-11 rounded-xl bg-[#24202a] text-[13px] font-bold text-white transition hover:bg-[#3b3442] disabled:cursor-not-allowed disabled:opacity-35"
          >
            Save &amp; Apply
          </button>
        </div>
      </div>
    </div>
  );
}

/** 用量区:上限标签 + 已用/总量 + 进度条 + 编辑入口(对齐参考稿) */
function UsageCell({ member, onEdit, onTopUp }: { member: Member; onEdit: () => void; onTopUp: () => void }) {
  const { canSeeTeammateUsage, can, isPool, seatCredits } = useTeam();
  // per-seat 团队额度不够只能给这个席位加油 —— 所以买 top-up 的入口就挂在这一行
  const canTopUpSeat = !isPool && can("credits.buy") && member.status === "active" && member.role !== "finance";
  // 「分配额度」只有 Enterprise 有 —— per-seat 团队每席固定,没有可编辑的上限
  const canEditLimit = isPool && can("limits.set");
  const isSelf = member.id === CURRENT_USER_ID;

  // Member 只看自己的用量 —— 7 人团队无所谓,100 人就是隐私问题(评审第四节第 3 项)
  if (!canSeeTeammateUsage && !isSelf) {
    return <p className="text-[12px] text-[#c3bcc8]">—</p>;
  }

  if (member.role === "finance") {
    return <p className="text-[12px] text-[#c3bcc8]">No product usage</p>;
  }
  if (member.status !== "active") {
    // 邀请中 / 已过期的行不放动作 —— 撤销走行尾那个 X,一件事只留一个入口
    return (
      <p className="text-[12px] text-[#6d6675]">
        {member.status === "expired" ? "Invitation expired · no seat" : "Not joined yet · holds a seat"}
      </p>
    );
  }

  /*
   * per-seat 团队：分母恒为每席固定额度,没有「上限」可言,额度不够只能给这个席位加油。
   * pool 团队：分母是管理员分配给他的额度;没分配就是不限,随池花到底。
   */
  const allowance = isPool ? member.allocation?.credits ?? null : seatCredits;
  const pct = allowance ? Math.min(1, member.usedThisCycle / allowance) : 1;
  const tone = !allowance ? "#5b6cff" : pct >= 1 ? "#e35b3d" : pct >= 0.8 ? "#e07a3a" : "#12a594";

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className={`text-[12px] font-semibold ${allowance ? "text-[#3b3442]" : "text-[#5b6cff]"}`}>
          {allowance ? `${formatNumber(member.usedThisCycle)} / ${formatNumber(allowance)}` : "No allocation"}
        </span>
        <span className="flex items-center gap-1.5">
          {isPool && member.allocation ? (
            <span className="text-[11px] font-medium uppercase tracking-wide text-[#6d6675]">{member.allocation.mode} cap</span>
          ) : isPool ? (
            <InfinityIcon className="size-4 text-[#5b6cff]" />
          ) : null}
          {canEditLimit && (
            <button
              type="button"
              onClick={onEdit}
              aria-label={`Edit allocation for ${member.name}`}
              title="Edit allocation"
              className="grid size-6 place-items-center rounded-md text-[#8a8490] transition hover:bg-[#f6f4f7] hover:text-[#3b3442]"
            >
              <Pencil className="size-3.5" />
            </button>
          )}
          {/*
            * Top up 常驻显示 —— 管理员按行给某个席位加油是高频动作,
            * 藏在 hover 里会让人以为根本没有这个入口(触屏更是完全摸不到)。
            */}
          {canTopUpSeat && (
            <button
              type="button"
              onClick={onTopUp}
              aria-label={`Buy a top-up for ${member.name}'s seat`}
              title="Top up this seat"
              className="rounded-md px-1.5 py-0.5 text-[11px] font-bold text-[#ee6545] outline-none transition hover:bg-[#fff3ec] focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/25"
            >
              Top up
            </button>
          )}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#f1eff3]">
        <div className="h-full rounded-full" style={{ width: `${Math.round(pct * 100)}%`, background: tone }} />
      </div>
      {/* 只留数字里没有的信息:池模型的说明,以及这个席位额外买过的 top-up */}
      {(!allowance || member.seatTopUp > 0) && (
        <p className="mt-1 text-[11px] text-[#6d6675]">
          {!allowance && "Draws from the shared pool"}
          {!allowance && member.seatTopUp > 0 && " · "}
          {member.seatTopUp > 0 && `+${formatNumber(member.seatTopUp)} top-up`}
        </p>
      )}
    </div>
  );
}

function MemberRow({ member, onEditAllocation, onTopUp }: { member: Member; onEditAllocation: () => void; onTopUp: () => void }) {
  const { role, changeMemberRole, removeMember, leaveTeam, team, can, revokeInvite } = useTeam();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const isOwnerRow = member.role === "owner";
  const isSelf = member.id === CURRENT_USER_ID;
  /*
   * 防提权(第二面)—— 权限页那条「不能编辑自己那一列」守的是权限矩阵,
   * 守不到这里:改角色住在成员表,拿到 User management = Can manage 就能动。
   * 三条一起才闭合:
   *   1. 不能改自己 —— 否则直接把自己那行改成 Admin 就完事了
   *   2. 不能改比自己高的人 —— 否则 Member 能把 Admin 撸成 Member
   *   3. 不能授予高于自己的角色 —— 见下面的 roleOptions
   * Billing Admin 的授予与收回都只有 Owner 能做(与 members.grantBilling 同口径)。
   * 前端只是第一道;服务端必须原样再校验一遍。
   */
  const canEditRole =
    can("members.role") &&
    !isOwnerRow &&
    !isSelf &&
    ROLE_RANK[member.role] <= ROLE_RANK[role] &&
    (member.role !== "finance" || role === "owner");
  const canRemove = can("members.remove") && !isOwnerRow && !isSelf;
  // 自己的那行给「离开团队」;Owner 不能直接走,要先转让
  const canLeave = isSelf && !isOwnerRow && member.status === "active";
  // 只有 Owner 能授予/收回 Finance —— Admin 自己没有账单权限,不能借此提权
  // 非 Owner 再按 rank 过一遍:给不出比自己高的角色
  const roleOptions: Role[] =
    role === "owner"
      ? ["owner", "admin", "finance", "member"]
      : (["admin", "member"] as Role[]).filter((option) => ROLE_RANK[option] <= ROLE_RANK[role]);
  const isInvite = member.status !== "active";
  const canRevoke = can("members.invitations");

  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest("[data-member-menu]")) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  return (
    <div className="group flex flex-wrap items-center gap-4 px-4 py-3 transition-colors hover:bg-[#faf9fb]">
      {/* Member info */}
      <div className="flex min-w-[200px] flex-[0.9] items-center gap-3">
        <span className="relative shrink-0">
          <span className="grid size-10 place-items-center rounded-[11px] text-[13px] font-bold text-white" style={{ background: member.color }}>
            {(isInvite ? member.email : member.name).trim()[0]?.toUpperCase()}
          </span>
          {isOwnerRow && (
            <span className="absolute -right-0.5 -top-1 grid size-4 place-items-center rounded-full bg-white shadow-[0_1px_3px_rgba(26,26,46,0.2)]">
              <Crown className="size-2.5 text-[#f0a020]" />
            </span>
          )}
        </span>
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-1.5 truncate text-[13px] font-semibold text-[#28222e]">
            {isInvite ? member.email : member.name}
            {member.id === CURRENT_USER_ID && <span className="font-bold text-[#ee6545]">(You)</span>}
            {member.status === "invited" && (
              <span className="rounded-md bg-[#fff3ec] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#e07a3a]">Pending</span>
            )}
            {member.status === "expired" && (
              <span className="rounded-md bg-[#f2f0f4] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#6d6675]">Expired</span>
            )}
            {member.role === "finance" && (
              <span className="rounded-md bg-[#eef0ff] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#5b6cff]">No seat</span>
            )}
          </p>
          {!isInvite && <p className="truncate text-[12px] text-[#7b7480]">{member.email}</p>}
        </div>
      </div>

      {/* Usage / Total —— 和表头同一套比例,两列一起伸缩 */}
      <div className="w-full sm:w-auto sm:min-w-[240px] sm:flex-[1.3] sm:pr-6">
        <UsageCell member={member} onEdit={onEditAllocation} onTopUp={onTopUp} />
      </div>

      {/* Last active —— 闲置超过 IDLE_DAYS 天标出来,admin 据此回收席位 */}
      <div className="w-[120px] shrink-0">
        <LastActiveCell member={member} />
      </div>

      {confirmRemove && (
        <RemoveMemberDialog member={member} onClose={() => setConfirmRemove(false)} />
      )}

      {/* Role —— 移除成员收在这个下拉里,不再单独一列 */}
      <div className="relative w-[128px] shrink-0" data-member-menu>
        {canEditRole || canLeave ? (
          <>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="flex h-9 w-full items-center justify-between gap-1 rounded-lg border border-[#ececf1] bg-white px-2.5 text-[13px] font-semibold text-[#3b3442] transition hover:border-[#ddd7df]"
            >
              {ROLE_LABEL[member.role]}
              <ChevronDown className="size-3.5 shrink-0 text-[#8a8490]" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-[calc(100%+4px)] z-30 w-[190px] rounded-xl border border-[#ececf1] bg-white p-1.5 text-left shadow-[0_14px_32px_rgba(26,26,46,0.14)]">
                {(canEditRole ? roleOptions : []).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      changeMemberRole(member.id, option);
                      setMenuOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[13px] font-semibold transition hover:bg-[#f6f4f7] ${
                      member.role === option ? "text-[#ee6545]" : "text-[#3b3442]"
                    }`}
                  >
                    {ROLE_LABEL[option]}
                    {member.role === option && <Check className="size-3.5" />}
                  </button>
                ))}

                {canRemove && (
                  <div className="mt-1.5 border-t border-[#f0eef2] pt-1.5">
                    <button
                        type="button"
                        onClick={() => {
                          setConfirmRemove(true);
                          setMenuOpen(false);
                        }}
                        className="block w-full rounded-lg px-2.5 py-2 text-left text-[13px] font-semibold text-[#d92d20] transition hover:bg-[#fef3f2]"
                      >
                        Remove from team
                      </button>
                  </div>
                )}

                {canLeave && (
                  <div className={`${canEditRole ? "mt-1.5 border-t border-[#f0eef2] pt-1.5" : ""}`}>
                    {confirmLeave ? (
                      <div className="p-2">
                        <p className="text-[12px] leading-snug text-[#56505c]">
                          Leave {team.name}? You&apos;ll lose access to the team&apos;s projects, assets and credits.
                        </p>
                        <div className="mt-2.5 flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              leaveTeam();
                              setMenuOpen(false);
                            }}
                            className="rounded-lg bg-[#d92d20] px-2.5 py-1.5 text-[12px] font-bold text-white"
                          >
                            Leave
                          </button>
                          <button type="button" onClick={() => setConfirmLeave(false)} className="px-1.5 text-[12px] font-semibold text-[#6d6675]">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmLeave(true)}
                        className="block w-full rounded-lg px-2.5 py-2 text-left text-[13px] font-semibold text-[#d92d20] transition hover:bg-[#fef3f2]"
                      >
                        Leave team
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <span className="inline-flex h-9 items-center rounded-lg bg-[#faf9fb] px-2.5 text-[13px] font-semibold text-[#6d6675]">
            {ROLE_LABEL[member.role]}
          </span>
        )}
      </div>

      {/*
       * 撤销邀请 —— 只在还没加入的行上出现。
       * pending 是**占着席位**的:一直不接受、又不撤销,这个席位就一直空转,
       * 所以行尾给一个 X,一键把席位收回来。expired 不占席位,X 只是清列表。
       */}
      {isInvite && canRevoke ? (
        <button
          type="button"
          onClick={() => revokeInvite(member.id)}
          aria-label={`Revoke the invitation for ${member.email}`}
          title={member.status === "invited" ? "Revoke invitation and free the seat" : "Remove this expired invitation"}
          className="grid size-7 shrink-0 place-items-center rounded-lg text-[#8a8490] transition hover:bg-[#fef3f2] hover:text-[#d92d20]"
        >
          <X className="size-4" />
        </button>
      ) : (
        <span className="hidden size-7 shrink-0 sm:block" aria-hidden />
      )}
    </div>
  );
}

/** Last active —— 只说「多久没来了」,并把闲置席位标出来 */
function LastActiveCell({ member }: { member: Member }) {
  if (member.status !== "active") {
    return <p className="text-[12px] text-[#c3bcc8]">—</p>;
  }
  const days = member.lastActiveDays;
  const idle = days !== null && days >= IDLE_DAYS;
  return (
    <div>
      <p className={`text-[12.5px] font-semibold ${idle ? "text-[#b06a1c]" : "text-[#3b3442]"}`}>
        {lastActiveLabel(days)}
      </p>
      {idle && (
        <p className="mt-0.5 text-[11px] font-semibold text-[#b06a1c]">Idle seat</p>
      )}
    </div>
  );
}

/**
 * 移除成员 —— 必须同时决定「他的团队画布与资产归谁」。
 *
 * 画布规则是仅创建者可编辑、团队成员只读,所以人一走,他建的团队画布就变成
 * 谁都改不了的只读内容。这一步不给选继承人,团队里就会慢慢积一堆无主作品。
 * 默认落在 Owner（永远存在、不会被移除),但可以改成任何留下来的成员。
 */
function RemoveMemberDialog({ member, onClose }: { member: Member; onClose: () => void }) {
  const { members, team, removeMember } = useTeam();
  const panelRef = useRef<HTMLDivElement>(null);
  useDialog({ ref: panelRef, onClose });

  // 候选人:留下来的、占席位的、能真正编辑画布的人（Billing Admin 没有产品权限,不能当继承人）
  const candidates = members.filter(
    (mem) => mem.id !== member.id && mem.status === "active" && mem.role !== "finance",
  );
  const owner = candidates.find((mem) => mem.role === "owner");
  const [heir, setHeir] = useState(owner?.id ?? candidates[0]?.id ?? "");

  return (
    <div
      className="fixed inset-x-0 bottom-0 top-[52px] z-[95] grid place-items-center bg-[#1a1a2e]/45 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Remove ${member.name}`}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className="w-full max-w-[480px] rounded-[24px] border border-[#ececf1] bg-white p-6 shadow-[0_30px_80px_rgba(26,26,46,0.28)] outline-none"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[18px] font-bold tracking-[-0.02em] text-[#28222e]">Remove {member.name}?</h2>
            <p className="mt-1 text-[13px] leading-[1.5] text-[#6d6675]">
              They lose access to {team.name} right away and get an email letting them know. Their seat frees up for
              someone else.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-9 shrink-0 place-items-center rounded-xl text-[#8a8490] transition hover:bg-[#f6f4f7] hover:text-[#28222e]"
          >
            <X className="size-[18px]" />
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-[#ffd9c6] bg-[#fff7f2] p-4">
          <p className="text-[13px] font-bold text-[#8a4b2a]">Who inherits their work?</p>
          <p className="mt-1 text-[12.5px] leading-[1.55] text-[#8a4b2a]">
            Team canvases can only be edited by the person who owns them. Pick someone to take over
            {" "}
            {member.name}&apos;s projects and assets, or they stay in the team as read-only with nobody able to change them.
          </p>
          <select
            value={heir}
            onChange={(event) => setHeir(event.target.value)}
            className="mt-3 h-11 w-full rounded-xl border border-[#f0c9b3] bg-white px-3 text-[14px] text-[#28222e] outline-none transition focus:border-[#ff5e1a]"
          >
            {candidates.map((mem) => (
              <option key={mem.id} value={mem.id}>
                {mem.name}
                {mem.id === CURRENT_USER_ID ? " (you)" : ""} · {ROLE_LABEL[mem.role]}
                {mem.role === "owner" ? " · never leaves" : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-5 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl px-4 text-[13px] font-semibold text-[#6d6675] transition hover:text-[#56505c]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!heir}
            onClick={() => {
              removeMember(member.id, heir);
              onClose();
            }}
            className="h-11 rounded-xl bg-[#d92d20] px-5 text-[13px] font-bold text-white transition hover:brightness-110 disabled:opacity-40"
          >
            Remove and transfer
          </button>
        </div>
      </div>
    </div>
  );
}

function FinanceInviteModal({ onClose }: { onClose: () => void }) {
  const { team, inviteFinance } = useTeam();
  const [email, setEmail] = useState("");
  const valid = EMAIL_RE.test(email.trim());
  const panelRef = useRef<HTMLDivElement>(null);

  useDialog({ ref: panelRef, onClose });

  return (
    <div className="fixed inset-x-0 bottom-0 top-[52px] z-[95] grid place-items-center bg-[#1a1a2e]/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Invite billing admin">
      <div ref={panelRef} tabIndex={-1} className="w-full max-w-[480px] rounded-[24px] border border-[#ececf1] bg-white p-6 shadow-[0_30px_80px_rgba(26,26,46,0.28)] outline-none">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[18px] font-bold tracking-[-0.02em] text-[#28222e]">Invite a billing admin</h2>
            <p className="mt-1 text-[13px] leading-snug text-[#6d6675]">
              They&apos;ll manage invoices, the payment method, and auto top-up for {team.name} — no product access, and no seat used.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-9 shrink-0 place-items-center rounded-xl text-[#8a8490] transition hover:bg-[#f6f4f7] hover:text-[#28222e]">
            <X className="size-[18px]" />
          </button>
        </div>

        <label className="mt-5 block">
          <span className="text-[13px] font-semibold text-[#3b3442]">Email address</span>
          <input
            value={email}
            autoFocus
            onChange={(event) => setEmail(event.target.value)}
            placeholder="finance@company.com"
            className="mt-2 h-11 w-full rounded-xl border border-[#ececf1] bg-white px-3.5 text-[14px] text-[#28222e] outline-none transition focus:border-[#ff5e1a] placeholder:text-[#9a9bb0]"
          />
        </label>

        <p className="mt-4 rounded-xl bg-[#faf9fb] px-3.5 py-3 text-[12px] leading-snug text-[#7b7480]">
          They can update the payment method, buy credits and set auto top-up. They can&apos;t add seats, change or cancel the plan, and
          they have no access to the team&apos;s work.
        </p>

        <div className="mt-5 flex justify-end gap-2.5">
          <button type="button" onClick={onClose} className="h-11 rounded-xl px-4 text-[13px] font-semibold text-[#6d6675] transition hover:text-[#56505c]">
            Cancel
          </button>
          <button
            type="button"
            disabled={!valid}
            onClick={() => {
              inviteFinance(email.trim());
              onClose();
            }}
            className="h-11 rounded-xl bg-[#24202a] px-5 text-[13px] font-bold text-white transition hover:bg-[#3b3442] disabled:cursor-not-allowed disabled:opacity-35"
          >
            Send billing invite
          </button>
        </div>
      </div>
    </div>
  );
}

/** People & Seats 顶部概览卡:套餐 / 席位 / 账单 / 用量 / 充值余额 / 充值入口 */
function SeatsOverviewCard({ financeCount }: { financeCount: number }) {
  const { plan, nextBill, renewalDate, quota, seatsUsed, seatsTotal, seatsFull, role, team, openSettings } = useTeam();
  const available = Math.max(0, seatsTotal - seatsUsed);
  const canBill = role === "owner" || role === "finance";
  const cell = "px-5 py-4";

  return (
    <div className="overflow-hidden rounded-2xl border border-[#ececf1] bg-white">
      <div className="grid divide-y divide-[#f0eef2] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className={cell}>
          <p className="text-[12px] text-[#6d6675]">Plan</p>
          <p className="mt-1.5 text-[14px] font-bold text-[#28222e]">
            {plan.name} · {seatsTotal} {seatsTotal === 1 ? "seat" : "seats"}
          </p>
          <p className="mt-0.5 text-[12px] text-[#6d6675]">{plan.price}</p>
          {/*
            Enterprise 不给 Upgrade —— 它已经是最高档,上面没有可换的东西了。
            对 Enterprise 客户来说「换档」等于重谈合同,那件事发生在 sales 那边,
            不是点一个按钮。挂着它只会让人点进去发现无档可换。
          */}
          {role === "owner" && plan.id !== "enterprise" && (
            <button
              type="button"
              onClick={() => openSettings("billing")}
              className="mt-3 h-8 rounded-lg bg-[#fff3ec] px-3 text-[12px] font-bold text-[#ff5e1a] transition hover:bg-[#ffe7d6]"
            >
              Upgrade
            </button>
          )}
        </div>

        <div className={cell}>
          <p className="text-[12px] text-[#6d6675]">Paid seats</p>
          <p className="mt-1.5 text-[14px] font-bold text-[#28222e]">
            {seatsUsed} / {seatsTotal} <span className="text-[12px] font-medium text-[#6d6675]">occupied</span>
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#f1eff3]">
            <div
              className="h-full rounded-full transition-[width]"
              style={{ width: `${Math.min(100, Math.round((seatsUsed / Math.max(1, seatsTotal)) * 100))}%`, background: seatsFull ? "#e35b3d" : "#ff7955" }}
            />
          </div>
          <p className="mt-1.5 text-[11px] leading-snug text-[#6d6675]">
            {available} available. Pending invites hold a seat; expired ones don&apos;t.
            {financeCount > 0 &&
              ` ${financeCount} ${financeCount === 1 ? "billing admin uses" : "billing admins use"} no seat.`}
          </p>
        </div>

        <div className={cell}>
          <p className="text-[12px] text-[#6d6675]">Next billing</p>
          {/* 「下次扣款」用 renewalDate —— 年付客户一年才扣一次,写成额度重置日会误导 */}
          <p className="mt-1.5 text-[14px] font-bold text-[#28222e]">{renewalDate}</p>
          {canBill && (
            <button
              type="button"
              onClick={() => openSettings("billing")}
              className="mt-3 h-8 rounded-lg border border-[#ececf1] px-3 text-[12px] font-bold text-[#3b3442] transition hover:bg-[#faf9fb]"
            >
              Manage &amp; invoices
            </button>
          )}
        </div>
      </div>

      {/*
        * 第二行只放两个读数,不再凑三格。
        * 之前第三格是「Top up + Buy credits 按钮」—— 它不是读数,是动作,
        * 为了填满 3 列网格才被做成一格。动作归到它作用的那个读数旁边。
        */}
      <div className="grid divide-y divide-[#f0eef2] border-t border-[#f0eef2] sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <div className={cell}>
          <p className="text-[12px] text-[#6d6675]">Usage this period</p>
          <p className="mt-1.5 text-[14px] font-bold text-[#28222e]">
            {formatNumber(quota.used)} <span className="text-[12px] font-medium text-[#6d6675]">/ {formatNumber(quota.total)} credits</span>
          </p>
          <p className="mt-0.5 text-[11px] text-[#6d6675]">Subscription credits · resets {nextBill}</p>
        </div>

        <div className={cell}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[12px] text-[#6d6675]">Top-up balance</p>
              <p className="mt-1.5 text-[14px] font-bold text-[#28222e]">{formatNumber(quota.topupRemaining)} credits</p>
              <p className="mt-0.5 text-[11px] text-[#6d6675]">
                {"Rolls over · never expires"}
              </p>
            </div>
            {canBill && (
              <button
                type="button"
                /* 买 credits 就是 Top-up 那一页 —— 之前跳去 Billing,
                   到了之后还得自己再找一次,等于把用户放在半路上 */
                onClick={() => openSettings("topup")}
                className="mt-0.5 h-8 shrink-0 rounded-lg border border-[#ececf1] px-3 text-[12px] font-bold text-[#3b3442] outline-none transition hover:border-[#ddd7df] hover:bg-[#faf9fb] focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/25"
              >
                Buy credits
              </button>
            )}
          </div>
          {!canBill && (
            <p className="mt-1.5 text-[11px] leading-snug text-[#6d6675]">
              Only the owner and billing admins can buy credits.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/** 席位概览:一条分段进度条把「已加入 / 待接受 / 空余」三者一次讲清 */
function SeatsCard() {
  const { members, role, seatsUsed, seatsTotal, seatsFull, openSettings } = useTeam();
  const paid = members.filter((m) => m.role !== "finance");
  const joined = paid.filter((m) => m.status === "active").length;
  const pending = paid.filter((m) => m.status === "invited").length;
  const free = Math.max(0, seatsTotal - seatsUsed);
  // 演示条把席位强制拉满时,把差额并进「已加入」段,进度条和上面的数字才对得上
  const joinedShown = joined + Math.max(0, seatsUsed - joined - pending);
  const pct = (n: number) => `${(n / Math.max(1, seatsTotal)) * 100}%`;

  return (
    <section className="rounded-2xl border border-[#ececf1] bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] font-bold tracking-[-0.01em] text-[#28222e]">
            <span className="tabular-nums">{seatsUsed}</span> of <span className="tabular-nums">{seatsTotal}</span> seats used
          </p>
          <p className={`mt-0.5 text-[12px] ${seatsFull ? "font-semibold text-[#c9432a]" : "text-[#6d6675]"}`}>
            {seatsFull
              ? "All seats are in use. Add seats to invite anyone else."
              : `${free} ${free === 1 ? "seat" : "seats"} left · pending invitations hold a seat, expired ones don't`}
          </p>
        </div>
        {role === "owner" ? (
          <button
            type="button"
            onClick={() => openSettings("billing")}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-[#ececf1] px-3.5 text-[12px] font-bold text-[#3b3442] transition hover:border-[#ff5e1a] hover:bg-[#fff7f1] hover:text-[#b23a1c]"
          >
            <Plus className="size-3.5" />
            Add seats
          </button>
        ) : (
          seatsFull && (
            <span className="shrink-0 text-[12px] text-[#6d6675]">
              Ask your owner to add seats.
            </span>
          )
        )}
      </div>

      {/* 分段进度:深色=已加入,橙色=待接受,余下=空位 */}
      <div className="mt-3 flex h-2 gap-0.5 overflow-hidden rounded-full bg-[#f1eff3]">
        <span
          className="h-full rounded-full bg-[#24202a] transition-[width] duration-200 motion-reduce:transition-none"
          style={{ width: pct(joinedShown) }}
        />
        <span
          className="h-full rounded-full bg-[#ff9a3d] transition-[width] duration-200 motion-reduce:transition-none"
          style={{ width: pct(pending) }}
        />
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[#7b7480]">
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-[#24202a]" />
          <span className="tabular-nums font-semibold text-[#3b3442]">{joinedShown}</span> joined
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-[#ff9a3d]" />
          <span className="tabular-nums font-semibold text-[#3b3442]">{pending}</span> pending
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-[#ddd7df]" />
          <span className="tabular-nums font-semibold text-[#3b3442]">{free}</span> available
        </span>
      </div>
    </section>
  );
}

/**
 * 权限页(模型 v2,对齐 Claude Enterprise)——两段:
 *
 *   Workspace access  功能访问,二元。目前只有 Marketing Agent & Canvas。
 *   Admin areas       管理域,三档 No access / Can view / Can manage。
 *
 * 为什么不是原来那 21 条单能力:那 21 条里一大半读者不会逐条决策,
 * 真实的决策单位是「Billing 这一整块给不给他看」。域更少、更好解释,
 * 而三档能表达「看得到但改不了」—— 这个状态 UI 里早就在跑,只是矩阵表达不出来。
 *
 * 防提权只剩一条规则:不能改自己角色那一列。Owner 列永远不可改。
 */
const PERMISSION_ROLES: Role[] = ["owner", "admin", "finance", "member"];

function PermissionsTab() {
  const {
    role,
    areaLevels,
    setAreaLevel,
    featureRoles,
    featureAllowed,
    setFeatureRole,
    canEditPermissionColumn,
    permissionsDirty,
    resetPermissions,
    openSettings,
  } = useTeam();
  const editable = PERMISSION_ROLES.filter((item) => canEditPermissionColumn(item));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        {/*
          导语已去掉(2026-08-25)—— 表头的 Editable / Always all 徽章、两段各自的
          副标题、以及每行的锁标注已经把规则说完了,再在最上面复述一遍是三重解释。
          「去 Members 改谁担任什么角色」那句也不必:左栏 Members 就在旁边。
        */}
        <span />
        {permissionsDirty && (
          <button
            type="button"
            onClick={resetPermissions}
            className="h-9 shrink-0 rounded-xl border border-[#ececf1] px-3.5 text-[12.5px] font-bold text-[#3b3442] outline-none transition hover:border-[#ddd7df] hover:bg-[#faf9fb] focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/25"
          >
            Reset to defaults
          </button>
        )}
      </div>

      {/* ---- 功能访问:二元,用 checkbox ---- */}
      <section>
        <h3 className="text-[13px] font-bold tracking-[-0.01em] text-[#28222e]">Workspace access</h3>
        <p className="mt-0.5 text-[12.5px] text-[#6d6675]">Which roles can use the product at all.</p>
        <div className="mt-2 overflow-hidden rounded-2xl border border-[#ececf1]">
          <table className="w-full min-w-[680px] border-collapse text-left">
            <RoleHead role={role} canEditPermissionColumn={canEditPermissionColumn} firstLabel="Feature" />
            <tbody>
              {PERMISSION_FEATURES.map((feature) => (
                <tr key={feature.id} className="border-t border-[#f0eef2]">
                  <td className="px-4 py-3">
                    <span className="block text-[13px] font-semibold text-[#28222e]">{feature.title}</span>
                    <span className="mt-0.5 block text-[11.5px] text-[#6d6675]">{feature.desc}</span>
                  </td>
                  {PERMISSION_ROLES.map((item) => {
                    const locked = item === "owner" || feature.lock?.roles.includes(item);
                    const allowed = featureAllowed(feature.id, item);
                    const canEdit = !locked && canEditPermissionColumn(item);
                    return (
                      <td
                        key={item}
                        className={`px-3 py-3 text-center ${item === role ? "bg-[#fffaf7]" : canEdit ? "bg-[#fcfcfd]" : ""}`}
                      >
                        {canEdit ? (
                          <button
                            type="button"
                            role="checkbox"
                            aria-checked={allowed}
                            aria-label={`${allowed ? "Remove" : "Grant"} ${feature.title} for ${ROLE_LABEL[item]}`}
                            onClick={() => setFeatureRole(feature.id, item, !allowed)}
                            className={`mx-auto grid size-[18px] place-items-center rounded-[5px] border outline-none transition focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/25 ${
                              allowed
                                ? "border-[#0f7a5a] bg-[#0f7a5a] text-white hover:bg-[#0c6a4d]"
                                : "border-[#d8d4dc] bg-white hover:border-[#0f7a5a]/60 hover:bg-[#f5fbf8]"
                            }`}
                          >
                            {allowed && <Check className="size-3" strokeWidth={3.5} />}
                          </button>
                        ) : (
                          <span
                            title={feature.lock?.roles.includes(item) ? feature.lock.reason : undefined}
                            className="mx-auto grid size-[18px] place-items-center"
                          >
                            {allowed ? (
                              <Check className={`size-4 ${item === role ? "text-[#ee6545]" : "text-[#12a594]"}`} />
                            ) : feature.lock?.roles.includes(item) ? (
                              <Lock className="size-3.5 text-[#c3bcc8]" />
                            ) : (
                              <span aria-hidden="true" className="h-px w-3 bg-[#ddd7df]" />
                            )}
                            <span className="sr-only">{allowed ? "Allowed" : "Not allowed"}</span>
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---- 管理域:三档,用下拉 ---- */}
      <section>
        <h3 className="text-[13px] font-bold tracking-[-0.01em] text-[#28222e]">Admin areas</h3>
        <p className="mt-0.5 text-[12.5px] text-[#6d6675]">
          Each area can be closed off, read-only, or fully editable — so you can hand someone billing without making them
          an owner.
        </p>
        <div className="mt-2 overflow-x-auto rounded-2xl border border-[#ececf1]">
          <table className="w-full min-w-[820px] border-collapse text-left">
            <RoleHead role={role} canEditPermissionColumn={canEditPermissionColumn} firstLabel="Area" />
            <tbody>
              {PERMISSION_AREAS.map((area) => (
                <tr key={area.id} className="border-t border-[#f0eef2]">
                  <td className="px-4 py-3 align-top">
                    <span className="block text-[13px] font-semibold text-[#28222e]">{area.title}</span>
                    <span className="mt-0.5 block max-w-[46ch] text-[11.5px] leading-[1.5] text-[#6d6675]">
                      {area.desc}
                    </span>
                    {area.ownerOnly && (
                      <span className="mt-1 flex items-start gap-1.5 text-[11px] leading-[1.45] text-[#8a8490]">
                        <Lock className="mt-0.5 size-3 shrink-0" />
                        {area.ownerOnly.join(" · ")} stay{area.ownerOnly.length === 1 ? "s" : ""} with the owner even at
                        Can manage.
                      </span>
                    )}
                  </td>
                  {PERMISSION_ROLES.map((item) => {
                    const level = areaLevels[area.id][item];
                    const canEdit = item !== "owner" && canEditPermissionColumn(item);
                    return (
                      <td
                        key={item}
                        className={`px-3 py-3 align-top ${item === role ? "bg-[#fffaf7]" : canEdit ? "bg-[#fcfcfd]" : ""}`}
                      >
                        {canEdit ? (
                          <Dropdown
                            value={level}
                            size="sm"
                            ariaLabel={`${area.title} access for ${ROLE_LABEL[item]}`}
                            onChange={(next) => setAreaLevel(area.id, item, next as PermissionLevel)}
                            options={area.levels.map((lv) => ({ value: lv, label: LEVEL_LABEL[lv] }))}
                          />
                        ) : (
                          <span
                            className={`block text-center text-[12px] font-semibold ${
                              item === role ? "text-[#ee6545]" : level === "none" ? "text-[#b3adb8]" : "text-[#56505c]"
                            }`}
                          >
                            {LEVEL_LABEL[level]}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-[12px] leading-[1.6] text-[#6d6675]">
        Every change here is written to the activity log. Seats have no tiers: what a member can generate is governed by
        the credits on their seat, or by their allocation on Enterprise.
      </p>
    </div>
  );
}

/**
 * 两张表共用的表头 —— 每列在标题里就说清自己的状态,不用逐格 hover 去试:
 *   Always all / Editable / View only,三者互斥。
 */
function RoleHead({
  role,
  canEditPermissionColumn,
  firstLabel,
}: {
  role: Role;
  canEditPermissionColumn: (who: Role) => boolean;
  firstLabel: string;
}) {
  return (
    <thead>
      <tr className="bg-[#faf9fb]">
        <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.06em] text-[#6d6675]">{firstLabel}</th>
        {PERMISSION_ROLES.map((item) => {
          const columnEditable = canEditPermissionColumn(item);
          const caption = item === "owner" ? "Always all" : columnEditable ? "Editable" : "View only";
          return (
            <th
              key={item}
              className={`w-[132px] px-3 py-3 text-center text-[12px] font-bold ${
                item === role ? "bg-[#fff3ee] text-[#ee6545]" : "text-[#3b3442]"
              }`}
            >
              {ROLE_LABEL[item]}
              <span
                className={`mt-0.5 block text-[10px] font-semibold ${
                  columnEditable ? "text-[#0f7a5a]" : "text-[#9a94a0]"
                }`}
              >
                {caption}
              </span>
            </th>
          );
        })}
      </tr>
    </thead>
  );
}


/* ============================ Security & SSO ============================ */

const SSO_PROVIDERS = [
  { value: "none", label: "Not configured" },
  { value: "okta", label: "Okta" },
  { value: "entra", label: "Microsoft Entra ID" },
  { value: "google", label: "Google Workspace" },
  { value: "custom", label: "Custom SAML 2.0" },
] as const;

const SESSION_OPTIONS = [7, 14, 30, 90];

/**
 * 安全设置 —— 企业采购问卷上的那几项。
 *
 * 分两档卖(与定价页矩阵一致):
 *   SSO / SCIM  → 只有 Enterprise 有,其余档位看到的是带锁的说明卡 + 联系销售
 *   强制 2FA / 会话时长 → 所有付费团队都能用,这两项不该拿来卡人
 *
 * 域名自动加入(domain capture)故意没做 —— 我们的加入路径只有邀请,规则越少越好解释。
 */
function SecurityTab() {
  const { team, plan, security, patchSecurity, showToast } = useTeam();
  const isEnterprise = plan.id === "enterprise";
  const ssoActive = security.ssoProvider !== "none";

  return (
    <div className="space-y-5">
      <p className="max-w-[74ch] text-[13px] leading-[1.6] text-[#7b7480]">
        How people sign in to <span className="font-semibold text-[#28222e]">{team.name}</span> and what happens to the
        work they create. Single sign-on and directory provisioning come with Enterprise; two-factor and session limits
        work on every paid team.
      </p>

      {/* ---- SSO ---- */}
      <section className="rounded-2xl border border-[#ececf1] bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 text-[14px] font-bold text-[#28222e]">
              Single sign-on (SAML 2.0)
              {!isEnterprise && <Lock className="size-3.5 text-[#8a8490]" />}
            </h3>
            <p className="mt-1 max-w-[60ch] text-[12.5px] leading-[1.55] text-[#6d6675]">
              Members sign in through your identity provider. Deactivating someone there removes their access here.
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
              ssoActive ? "bg-[#e6f7f4] text-[#0f7a5a]" : "bg-[#f2f0f4] text-[#6d6675]"
            }`}
          >
            {ssoActive ? "Active" : "Not configured"}
          </span>
        </div>

        {isEnterprise ? (
          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="text-[12px] font-semibold text-[#6d6675]">Identity provider</span>
              <div className="mt-1.5">
                <Dropdown
                  value={security.ssoProvider}
                  onChange={(value) => {
                    const label = SSO_PROVIDERS.find((item) => item.value === value)?.label ?? value;
                    patchSecurity(
                      { ssoProvider: value as typeof security.ssoProvider },
                      value === "none" ? "disconnected the identity provider" : `set the identity provider to ${label}`,
                    );
                  }}
                  ariaLabel="Identity provider"
                  options={SSO_PROVIDERS.map((item) => ({ value: item.value, label: item.label }))}
                />
              </div>
            </label>

            {ssoActive && (
              <>
                {/* 真实实现里这两个值由后端给,页面只负责展示与复制 */}
                <ReadOnlyField label="ACS / Reply URL" value={`https://app.buzz.video/sso/${team.id}/acs`} />
                <ReadOnlyField label="Entity ID" value={`urn:buzz:team:${team.id}`} />

                <ToggleRow
                  title="Require SSO for everyone"
                  desc="Turns off email and Google sign-in for this team. Billing admins keep password access so billing never locks out."
                  checked={security.ssoEnforced}
                  onChange={(next) => {
                    patchSecurity(
                      { ssoEnforced: next },
                      next ? "made SSO required for everyone" : "stopped requiring SSO",
                    );
                    showToast(next ? "SSO is now required for this team." : "SSO is no longer required.");
                  }}
                />
                <ToggleRow
                  title="Automatic provisioning (SCIM)"
                  desc="Create, update and deactivate members from your directory. Seats follow the directory, so leavers stop billing on their own."
                  checked={security.scimEnabled}
                  onChange={(next) =>
                    patchSecurity(
                      { scimEnabled: next },
                      next ? "turned on SCIM provisioning" : "turned off SCIM provisioning",
                    )
                  }
                />
              </>
            )}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-[#ececf1] bg-[#faf9fb] px-4 py-3.5">
            <p className="text-[13px] leading-[1.55] text-[#7b7480]">
              SSO and SCIM provisioning are part of <span className="font-bold text-[#28222e]">Enterprise</span>. Your team
              is on {plan.name}.
            </p>
            <a
              href="/prototypes/pricing?group=business"
              className="mt-3 inline-flex h-9 items-center rounded-xl bg-[#24202a] px-3.5 text-[12.5px] font-bold text-white transition hover:bg-[#3b3442]"
            >
              Talk to sales
            </a>
          </div>
        )}
      </section>

      {/* ---- 2FA + 会话 ---- */}
      <section className="rounded-2xl border border-[#ececf1] bg-white p-5">
        <h3 className="text-[14px] font-bold text-[#28222e]">Sign-in rules</h3>
        <div className="mt-3 space-y-3">
          <ToggleRow
            title="Require two-factor authentication"
            desc="Everyone on the team must set up an authenticator app before their next sign-in."
            checked={security.require2fa}
            onChange={(next) => {
              patchSecurity(
                { require2fa: next },
                next ? "made two-factor authentication required" : "stopped requiring two-factor authentication",
              );
              showToast(next ? "Two-factor is now required." : "Two-factor is no longer required.");
            }}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#f0eef2] px-4 py-3">
            <div className="min-w-[220px] flex-1">
              <p className="text-[13px] font-bold text-[#28222e]">Sign out inactive members</p>
              <p className="mt-0.5 text-[12px] leading-[1.5] text-[#6d6675]">
                Sessions end after this long without activity. Shorter is safer on shared machines.
              </p>
            </div>
            <div className="w-[150px] shrink-0">
              <Dropdown
                value={String(security.sessionDays)}
                onChange={(value) =>
                  patchSecurity(
                    { sessionDays: Number(value) },
                    `set the inactivity sign-out to ${value} days`,
                  )
                }
                ariaLabel="Session length"
                options={SESSION_OPTIONS.map((days) => ({ value: String(days), label: `After ${days} days` }))}
              />
            </div>
          </div>
        </div>
      </section>

      <DataControlsSection />

      <p className="text-[12px] leading-[1.6] text-[#6d6675]">
        Joining this team is invite-only — there is no automatic join by email domain, so nobody lands in your team just
        for having a company address. Every change on this page is written to the activity log.
      </p>
    </div>
  );
}

/* ---------------------------- 数据与留存 ---------------------------- */

/**
 * 数据与留存 —— 采购问卷第一页问的两件事:会不会拿我们的素材训练模型、东西留多久。
 *
 * 两句都是既定事实,所以都不是开关:
 *   不用于训练 —— 开关意味着它可以被打开,采购看到只会追问默认值和谁能改
 *   不删除     —— 我们没有留存周期这个概念,东西留到用户自己删
 *
 * 「没有留存窗口」听起来像少做了一个功能,其实是采购问卷上最好的那个答案:
 * 竞品要在合同里谈 30 / 90 / 365 天,我们这一栏直接写「不删」。
 */
function DataControlsSection() {
  const { team } = useTeam();

  const facts = [
    {
      title: "Your content is never used to train models",
      body: "Prompts, uploads and renders from this team stay out of training data. This is not a setting anyone can turn on — it applies to every paid team, always.",
    },
    {
      title: "Your work is never deleted on a timer",
      body: `There is no retention window. Everything ${team.name} creates stays until someone on the team deletes it — including after a subscription ends.`,
    },
  ];

  return (
    <section className="rounded-2xl border border-[#ececf1] bg-white p-5">
      <h3 className="text-[14px] font-bold text-[#28222e]">Data controls</h3>
      <p className="mt-1 max-w-[68ch] text-[12.5px] leading-[1.55] text-[#6d6675]">
        What happens to the prompts, uploads and renders your team creates.
      </p>

      <div className="mt-3 space-y-2.5">
        {facts.map((fact) => (
          <div key={fact.title} className="flex items-start gap-3 rounded-xl border border-[#dff0e8] bg-[#f5fbf8] px-4 py-3">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#0f7a5a]" />
            <div>
              <p className="text-[13px] font-bold text-[#28222e]">{fact.title}</p>
              <p className="mt-0.5 max-w-[62ch] text-[12px] leading-[1.5] text-[#5c7a6d]">{fact.body}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-3 flex items-start gap-2 text-[12px] leading-[1.55] text-[#6d6675]">
        <Trash2 className="mt-0.5 size-3.5 shrink-0 text-[#8a8490]" />
        Deleting is always yours to do — per item, or the whole team. Invoices are the one exception: we keep those for as
        long as tax law requires.
      </p>
    </section>
  );
}

function ToggleRow({
  title,
  desc,
  checked,
  onChange,
}: {
  title: string;
  desc: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-[#f0eef2] px-4 py-3">
      <div className="min-w-[220px] flex-1">
        <p className="text-[13px] font-bold text-[#28222e]">{title}</p>
        <p className="mt-0.5 text-[12px] leading-[1.5] text-[#6d6675]">{desc}</p>
      </div>
      <Switch checked={checked} ariaLabel={title} onChange={() => onChange(!checked)} />
    </div>
  );
}

/**
 * 设置项分组 —— 分组标题 + 细分割线分隔的行。
 *
 * 不给每条设置套卡片:同级选项套上卡片就各自成了一个模块,读起来是「几件事」
 * 而不是「一组设置」;而且加第二条时整块版面要重排。这是 Linear / Notion /
 * Claude 自己的设置页都在用的形态。
 */
function SettingsGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-[13px] font-bold tracking-[-0.01em] text-[#28222e]">{title}</h3>
      <div className="mt-1 border-t border-[#f0eef2]">{children}</div>
    </section>
  );
}

/** 分组里的一行:左边标题 + 说明,右边控件 */
function SettingsRow({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2 border-b border-[#f0eef2] py-3.5">
      <div className="min-w-[240px] max-w-[68ch] flex-1">
        <p className="text-[13.5px] font-semibold text-[#28222e]">{title}</p>
        <p className="mt-0.5 text-[12.5px] leading-[1.5] text-[#7b7480]">{desc}</p>
      </div>
      <div className="mt-0.5 shrink-0">{children}</div>
    </div>
  );
}

/** 开关本体 —— 设置行与列表行都用它,保证整个面板只有一种开关 */
function Switch({
  checked,
  ariaLabel,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  ariaLabel: string;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onChange}
      className={`relative h-6 w-11 shrink-0 rounded-full outline-none transition disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/25 ${
        checked ? "bg-[#ff5e1a]" : "bg-[#ddd7df]"
      }`}
    >
      <span
        className={`absolute top-0.5 size-5 rounded-full bg-white shadow-[0_1px_3px_rgba(26,26,46,0.28)] transition-[left] duration-200 ease-out motion-reduce:transition-none ${
          checked ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

/** 后端下发的固定值 —— 只读 + 一键复制 */
function ReadOnlyField({ label, value }: { label: string; value: string }) {
  const { showToast } = useTeam();
  return (
    <label className="block">
      <span className="text-[12px] font-semibold text-[#6d6675]">{label}</span>
      <span className="mt-1.5 flex h-11 items-center gap-2 rounded-xl border border-[#ececf1] bg-[#faf9fb] pl-3.5 pr-2">
        <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-[#56505c]">{value}</span>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(value);
            showToast("Copied.");
          }}
          className="h-7 shrink-0 rounded-lg border border-[#ececf1] bg-white px-2.5 text-[11.5px] font-bold text-[#3b3442] transition hover:border-[#ddd7df]"
        >
          Copy
        </button>
      </span>
    </label>
  );
}

/**
 * 成员状态筛选 —— 三种状态的席位口径不同,所以筛选本身就是在解释规则:
 *   joined  已加入,占席位
 *   pending 邀请已发出还没接受,**占着席位**(所以列表里给它一个 X,随时可以收回来)
 *   expired 邀请过期,不占席位,留在列表里只为方便重发或清掉
 */
const MEMBER_FILTERS = [
  { key: "all", label: "All" },
  { key: "joined", label: "Joined" },
  { key: "pending", label: "Pending" },
  { key: "expired", label: "Expired" },
] as const;

type MemberFilter = (typeof MEMBER_FILTERS)[number]["key"];

function MembersTab() {
  // 邀请弹窗的开关在 context 里 —— 付款回跳也要弹它,不能一处一份 state
  const { members, role, seatsFull, can, setInviteOpen, isPool } = useTeam();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<MemberFilter>("all");
  const [allocationFor, setAllocationFor] = useState<Member | null>(null);
  const [topUpFor, setTopUpFor] = useState<Member | null>(null);
  const [usageSort, setUsageSort] = useState<null | "asc" | "desc">(null);
  // 从权限矩阵读 —— 权限页把 Invite 关掉,这里的按钮就真的消失
  const canManage = can("members.invite") || can("members.role") || can("members.remove");

  /** 各状态的人数 —— 直接标在筛选按钮上,不用点进去才知道有没有人 */
  const counts = useMemo(() => {
    const paid = members.filter((m) => m.role !== "finance");
    return {
      all: paid.length,
      joined: paid.filter((m) => m.status === "active").length,
      pending: paid.filter((m) => m.status === "invited").length,
      expired: paid.filter((m) => m.status === "expired").length,
    };
  }, [members]);

  const visible = useMemo(
    () =>
      members.filter((m) => {
        // Finance 是 billing-only,归 Plans and Billing 管
        if (m.role === "finance") return false;
        if (filter === "joined" && m.status !== "active") return false;
        if (filter === "pending" && m.status !== "invited") return false;
        if (filter === "expired" && m.status !== "expired") return false;
        const q = query.trim().toLowerCase();
        if (q && !m.name.toLowerCase().includes(q) && !m.email.toLowerCase().includes(q)) return false;
        return true;
      }),
    [members, query, filter],
  );

  const sorted = useMemo(() => {
    if (!usageSort) return visible;
    return [...visible].sort((a, b) =>
      usageSort === "desc" ? b.usedThisCycle - a.usedThisCycle : a.usedThisCycle - b.usedThisCycle,
    );
  }, [visible, usageSort]);

  return (
    <div className="space-y-5">
      {(can("members.invite") || can("seats.add")) && <SeatsCard />}

      <div className="flex flex-wrap items-center gap-2.5">
        {/* 状态筛选:pending 与 joined 占席位,expired 不占 —— 分开看才好决定要不要收回席位 */}
        <div className="flex shrink-0 items-center gap-1 rounded-xl bg-[#f6f4f7] p-1">
          {MEMBER_FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              aria-pressed={filter === item.key}
              className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] font-bold transition ${
                filter === item.key ? "bg-white text-[#28222e] shadow-[0_1px_3px_rgba(26,26,46,0.12)]" : "text-[#6d6675] hover:text-[#3b3442]"
              }`}
            >
              {item.label}
              <span className="tabular-nums text-[11px] font-semibold text-[#6d6675]">{counts[item.key]}</span>
            </button>
          ))}
        </div>
        <label className="flex h-10 min-w-[180px] flex-1 items-center gap-2 rounded-xl border border-[#ececf1] bg-white px-3 text-sm transition focus-within:border-[#ff5e1a]">
          <Search className="size-4 shrink-0 text-[#9a9bb0]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search members"
            className="w-full bg-transparent text-[#1a1a2e] outline-none placeholder:text-[#9a9bb0]"
          />
        </label>
        {can("members.invite") && (
          <>
            {/* 团队一律是付费的(购买即创建),所以邀请入口不存在「先升级」这种前置态 */}
            <button
              type="button"
              disabled={seatsFull}
              onClick={() => setInviteOpen(true)}
              className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-[#24202a] px-4 text-[13px] font-bold text-white transition hover:bg-[#3b3442] disabled:cursor-not-allowed disabled:opacity-35"
            >
              <Plus className="size-4" />
              Invite Members
            </button>
          </>
        )}
      </div>

      {!canManage && (
        <p className="rounded-xl border border-[#ececf1] bg-[#faf9fb] px-4 py-3 text-[13px] text-[#7b7480]">
          Only owners and admins can invite, remove, change roles, or set limits.
        </p>
      )}

      {/*
        * 表头与行收在同一个容器里,行之间只用分割线。
        * 之前每行是一张独立卡片 —— 卡片边框把同一列的数值切断,而这张表最主要的
        * 动作恰恰是「谁用超了」的纵向扫读,边框正好挡住那件事。
        */}
      <div className="overflow-hidden rounded-2xl border border-[#ececf1] bg-white">
        {/*
          * 列宽比例:Member info 只放名字+邮箱(约 230px 就够),Usage 要放数字、徽章、
          * 进度条,反而更需要空间。之前 Member info 是 flex-1 而 Usage 锁死 190px,
          * 于是全部富余宽度都灌进第一列 —— 量出来 455px vs 190px,中间空出一大块。
          * 现在比例是 0.9 : 1.3 —— Usage 那一列要放数字、徽章、进度条和编辑笔,
          * 比只放名字+邮箱的 Member info 更吃宽度。Usage 右侧补 pr-6,
          * 免得编辑笔紧贴着 Last active,读起来像是同一列的东西。
          */}
        <div className="flex flex-wrap items-center gap-4 border-b border-[#f0eef2] bg-[#faf9fb] px-4 py-2.5 text-[11px] font-semibold text-[#6d6675]">
          <span className="min-w-[200px] flex-[0.9]">Member info</span>
          <button
            type="button"
            onClick={() => setUsageSort((current) => (current === "desc" ? "asc" : current === "asc" ? null : "desc"))}
            className="flex w-full items-center gap-1 text-left transition hover:text-[#56505c] sm:w-auto sm:min-w-[240px] sm:flex-[1.3] sm:pr-6"
          >
            {isPool ? "Usage / Allocation" : "Usage / Limit · fixed per seat"}
            <ArrowUpDown className={`size-3 ${usageSort ? "text-[#ee6545]" : "text-[#c3bcc8]"}`} />
          </button>
          <span className="hidden w-[120px] shrink-0 sm:block">Last active</span>
          <span className="w-[128px] shrink-0">Role</span>
          {/* 撤销邀请的 X 占一格,保证表头与行对齐 */}
          <span className="hidden w-7 shrink-0 sm:block" aria-hidden />
        </div>

        {sorted.length > 0 ? (
          <div className="divide-y divide-[#f4f2f6]">
            {sorted.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                onEditAllocation={() => setAllocationFor(member)}
                onTopUp={() => setTopUpFor(member)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#ddd7df] bg-white px-4 py-12 text-center text-[13px] text-[#6d6675]">
            {filter === "all" ? "No members match your search." : `No ${filter} members.`}
          </div>
        )}
      </div>

      {allocationFor && <AllocationDialog member={allocationFor} onClose={() => setAllocationFor(null)} />}
      {topUpFor && <CreditsModal seat={topUpFor.id} onClose={() => setTopUpFor(null)} />}
    </div>
  );
}

/* ============================ Billing ============================ */

function PlanModal({ onClose }: { onClose: () => void }) {
  const { team, plan, seatsUsed, changePlan, nextBill } = useTeam();
  const [picked, setPicked] = useState<PlanId>(plan.id);
  const target = PLANS.find((p) => p.id === picked)!;
  // 按档位顺序,不按价格 —— Enterprise 的 priceValue 是 0(定价页写 Let's talk)
  const isUpgrade = isUpgradeBetween(plan.id, picked);
  // 换档要看新档的席位上限装不装得下现有成员（Team 上限 9,Scale 30）
  const tooSmall = target.seatsMax < seatsUsed;
  const panelRef = useRef<HTMLDivElement>(null);

  useDialog({ ref: panelRef, onClose });

  return (
    <div className="fixed inset-x-0 bottom-0 top-[52px] z-[95] grid place-items-center bg-[#1a1a2e]/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Change plan">
      <div ref={panelRef} tabIndex={-1} className="max-h-full w-full max-w-[620px] overflow-y-auto rounded-[24px] border border-[#ececf1] bg-white p-6 shadow-[0_30px_80px_rgba(26,26,46,0.28)] outline-none">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[18px] font-bold tracking-[-0.02em] text-[#28222e]">Change plan</h2>
            <p className="mt-1 text-[13px] text-[#6d6675]">Billed monthly for {team.name}. Change or cancel any time.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-9 shrink-0 place-items-center rounded-xl text-[#8a8490] transition hover:bg-[#f6f4f7] hover:text-[#28222e]">
            <X className="size-[18px]" />
          </button>
        </div>

        <div className="mt-5 grid gap-2.5">
          {/* 团队没有免费档,换套餐只在付费档之间切 */}
          {TEAM_PLANS.map((option) => {
            const active = picked === option.id;
            const current = plan.id === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setPicked(option.id)}
                className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
                  active ? "border-[#ff5e1a] bg-[#fff8f4]" : "border-[#ececf1] bg-white hover:border-[#ddd7df]"
                }`}
              >
                <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 ${active ? "border-[#ff5e1a] bg-[#ff5e1a] text-white" : "border-[#d8d4dc]"}`}>
                  {active && <Check className="size-3" strokeWidth={3} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline gap-2">
                    <span className="text-[15px] font-bold text-[#28222e]">{option.name}</span>
                    <span className="text-[13px] font-semibold text-[#7b7480]">{option.price}</span>
                    {current && <span className="rounded-md bg-[#f1eff3] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#7b7480]">Current</span>}
                  </span>
                  <span className="mt-1 block text-[12px] text-[#6d6675]">{option.blurb}</span>
                  <span className="mt-2 block text-[12px] font-semibold text-[#56505c]">
                    {option.seatsMin}–{option.seatsMax} seats · {formatNumber(option.creditsPerSeat)} credits per seat / month
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {tooSmall && (
          <p className="mt-4 rounded-xl border border-[#f2d5cd] bg-[#fff5f1] px-4 py-3 text-[12px] font-semibold text-[#b23a1c]">
            {target.name} allows up to {target.seatsMax} seats but your team uses {seatsUsed}. Remove members first, or pick a larger plan.
          </p>
        )}

        {/*
          * 换档前必须把「钱和额度会发生什么」讲出来 —— 之前点 Upgrade 直接换档,
          * R2(旧额度累加)和 R3(已发放月份不退)一句都没告诉用户,这是客诉的源头。
          * 升和降的说法完全不同,所以分两套。
          */}
        {picked !== plan.id && !tooSmall && (
          <div className="mt-4 rounded-xl border border-[#ececf1] bg-[#faf9fb] p-4">
            <p className="text-[12.5px] font-bold text-[#28222e]">
              {isUpgrade ? "What happens when you upgrade" : `What happens on ${nextBill}`}
            </p>
            <ul className="mt-2 space-y-1.5">
              {(isUpgrade
                ? [
                    `Takes effect today — every seat moves to ${formatNumber(target.creditsPerSeat)} credits a month.`,
                    "Credits already on each seat are kept and added on top of the new allowance — nothing is wasted.",
                    `Charged today at the ${target.name} rate. Monthly credit releases you have already received aren't refunded; releases that haven't happened yet are credited against today's charge.`,
                    "A new billing cycle starts today, so the next renewal moves too.",
                  ]
                : [
                    `Nothing changes today — the full ${plan.name} allowance stays yours until ${nextBill}.`,
                    `On ${nextBill} every seat drops to ${formatNumber(target.creditsPerSeat)} credits a month. Tell the team before that day.`,
                    "You can cancel this scheduled change any time before it takes effect.",
                    "Top-up credits you have already bought are never affected by a plan change.",
                  ]
              ).map((line) => (
                <li key={line} className="flex items-start gap-2 text-[12px] leading-[1.5] text-[#56505c]">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-[#12734f]" strokeWidth={3} />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2.5">
          <button type="button" onClick={onClose} className="h-11 rounded-xl px-4 text-[13px] font-semibold text-[#6d6675] transition hover:text-[#56505c]">
            Cancel
          </button>
          <button
            type="button"
            disabled={picked === plan.id || tooSmall}
            onClick={() => {
              changePlan(picked);
              onClose();
            }}
            className="h-11 rounded-xl bg-[#24202a] px-5 text-[13px] font-bold text-white transition hover:bg-[#3b3442] disabled:cursor-not-allowed disabled:opacity-35"
          >
            {isUpgrade ? `Upgrade to ${target.name}` : `Switch to ${target.name}`}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 买 top-up。
 *
 * per-seat 团队（Team / Scale）：必须指定买给哪个席位 —— 没有池可以充,买给谁就归谁。
 *   这不是「分配」:分配的前提是有一池共享额度可切,这里是额外掏钱买的增量。
 * pool 团队（Enterprise）：可以整体充进池,也可以直接充给某个人。
 */
function CreditsModal({ onClose, seat }: { onClose: () => void; seat?: string }) {
  const { team, buyCredits, buySeatTopUp, members, isPool, isPersonal } = useTeam();
  const [picked, setPicked] = useState(CREDIT_PACKS[0]!.credits);
  /** 收款席位；"pool" 只在 Enterprise 可选 */
  const seatOptions = members.filter((mem) => mem.role !== "finance" && mem.status === "active");
  const [target, setTarget] = useState<string>(
    () => seat ?? (isPool ? "pool" : seatOptions.find((mem) => mem.id === CURRENT_USER_ID)?.id ?? seatOptions[0]?.id ?? "pool"),
  );
  const panelRef = useRef<HTMLDivElement>(null);

  useDialog({ ref: panelRef, onClose });

  return (
    <div className="fixed inset-x-0 bottom-0 top-[52px] z-[95] grid place-items-center bg-[#1a1a2e]/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Buy credits">
      <div ref={panelRef} tabIndex={-1} className="w-full max-w-[480px] rounded-[24px] border border-[#ececf1] bg-white p-6 shadow-[0_30px_80px_rgba(26,26,46,0.28)] outline-none">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[18px] font-bold tracking-[-0.02em] text-[#28222e]">
              {isPool ? "Buy credits" : "Buy a seat top-up"}
            </h2>
            <p className="mt-1 text-[13px] leading-[1.5] text-[#6d6675]">
              {isPersonal
                ? "Top-up credits never expire. They're spent only after this month's credits run out."
                : isPool
                  ? `Top-up credits for ${team.name}. They roll over and never expire.`
                  : "Credits are fixed per seat on this plan, so a top-up is bought for one seat and stays with it. It never expires and is spent only after that seat's monthly credits run out."}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-9 shrink-0 place-items-center rounded-xl text-[#8a8490] transition hover:bg-[#f6f4f7] hover:text-[#28222e]">
            <X className="size-[18px]" />
          </button>
        </div>

        <div className="mt-5 grid gap-2.5">
          {CREDIT_PACKS.map((pack) => {
            const active = picked === pack.credits;
            return (
              <button
                key={pack.credits}
                type="button"
                onClick={() => setPicked(pack.credits)}
                className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-left transition ${
                  active ? "border-[#ff5e1a] bg-[#fff8f4]" : "border-[#ececf1] bg-white hover:border-[#ddd7df]"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${active ? "border-[#ff5e1a] bg-[#ff5e1a] text-white" : "border-[#d8d4dc]"}`}>
                    {active && <Check className="size-3" strokeWidth={3} />}
                  </span>
                  <span className="text-[15px] font-bold text-[#28222e]">{formatNumber(pack.credits)} credits</span>
                </span>
                <span className="text-[14px] font-bold text-[#56505c]">{pack.price}</span>
              </button>
            );
          })}
        </div>

        {!isPersonal && (
          <label className="mt-4 block">
            <span className="text-[13px] font-semibold text-[#3b3442]">
              {isPool ? "Add to" : "Which seat gets these credits"}
            </span>
            <select
              value={target}
              onChange={(event) => setTarget(event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-[#ececf1] bg-white px-3 text-[14px] text-[#28222e] outline-none transition focus:border-[#ff5e1a]"
            >
              {isPool && <option value="pool">The shared pool — anyone can spend it</option>}
              {seatOptions.map((mem) => (
                <option key={mem.id} value={mem.id}>
                  {mem.id === CURRENT_USER_ID ? `${mem.name} (you)` : mem.name}
                  {" · "}
                  {formatNumber(mem.seatTopUp)} top-up now
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="mt-5 flex justify-end gap-2.5">
          <button type="button" onClick={onClose} className="h-11 rounded-xl px-4 text-[13px] font-semibold text-[#6d6675] transition hover:text-[#56505c]">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              // 个人账户就是自己那一个席位
              if (isPersonal) buySeatTopUp(CURRENT_USER_ID, picked);
              else if (target === "pool") buyCredits(picked);
              else buySeatTopUp(target, picked);
              onClose();
            }}
            className="h-11 rounded-xl bg-[#24202a] px-5 text-[13px] font-bold text-white transition hover:bg-[#3b3442]"
          >
            Buy {formatNumber(picked)} credits
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 自动充值 —— 所有付费档都有,区别只在**充给谁**(2026-08-25 定):
 *   per-seat(Team / Scale) → 充给「触发阈值的那个席位」,谁低补谁
 *   pool(Enterprise)       → 充进共享池
 *
 * 为什么 per-seat 是「谁低充谁」而不是「只充 Owner 的席位」:
 * per-seat 团队里撞墙的永远是 Member 不是 Owner —— 他额度见底、提申请、等审批,
 * 这中间人是停工的。只管 Owner 自己那个席位等于装了个用不上的功能;
 * 让 Owner 逐个席位配又太重,人一多就没人配。
 *
 * 风险是一个人烧光整个封顶,护栏是现成的:月度封顶是团队级的,撞顶即停;
 * 连续失败 3 次转 paused。另外每次自动充值都要写 Activity Log 并写明充给了哪个席位 ——
 * 自动花钱的动作,Owner 必须事后查得到钱去哪了。
 */
function AutoTopUpSettings() {
  const { team, role, isPool, updateAutoTopUp, retryAutoTopUp, showToast } = useTeam();
  const auto = team.autoTopUp;
  const canEdit = role === "owner" || role === "finance";
  const [threshold, setThreshold] = useState(String(auto.threshold));
  const [amount, setAmount] = useState(String(auto.amount));
  const [cap, setCap] = useState(String(auto.monthlyCap));

  useEffect(() => {
    setThreshold(String(auto.threshold));
    setAmount(String(auto.amount));
    setCap(String(auto.monthlyCap));
  }, [auto.threshold, auto.amount, auto.monthlyCap]);

  const num = (v: string) => Number(v.replace(/[^\d]/g, "")) || 0;

  /*
   * 只剩「设置体」—— 标题、说明与开关都在 Billing 的 Credits balance 卡里,
   * 这里不再重复一遍。合并的原因:Top-up 页叫 Auto top-up、Billing 页叫
   * Automatic reload,两处各有一个开关但指的是同一件事 ——
   * 用户在一边关掉、去另一边看到还开着,只会以为是坏了。
   */
  return (
    <>
      {auto.enabled && (
        <>
          {auto.status === "paused" && (
            <div className="mt-4 rounded-xl border border-[#e0a08e] bg-[#fff5f1] p-3.5">
              <p className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-[#b23a1c]">
                <AlertTriangle className="size-3.5" />
                Paused after 3 failed attempts
              </p>
              <p className="mt-1.5 text-[12px] leading-snug text-[#56505c]">{auto.failureReason}</p>
              <p className="mt-1 text-[12px] leading-snug text-[#6d6675]">
                We emailed the owner, admins, and billing admins. Fix the card, then retry.
              </p>
              {canEdit && (
                <button
                  type="button"
                  onClick={retryAutoTopUp}
                  className="mt-2.5 inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#c9432a] px-3 text-[12px] font-bold text-white transition hover:bg-[#b23a1c]"
                >
                  <RefreshCw className="size-3.5" />
                  Retry now
                </button>
              )}
            </div>
          )}

          {auto.status === "cap-reached" && (
            <div className="mt-4 rounded-xl border border-[#f0dcc4] bg-[#fffaf2] p-3.5">
              <p className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-[#a86a1c]">
                <AlertTriangle className="size-3.5" />
                Monthly cap reached
              </p>
              <p className="mt-1.5 text-[12px] leading-snug text-[#56505c]">
                {formatNumber(auto.spentThisMonth)} of {formatNumber(auto.monthlyCap)} credits auto-recharged this month. No further
                top-ups until the next billing cycle — the card is fine.
              </p>
            </div>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {(
              [
                { label: "When pool drops below", value: threshold, set: setThreshold },
                { label: "Auto-recharge", value: amount, set: setAmount },
                { label: "Monthly cap", value: cap, set: setCap },
              ] as const
            ).map((field) => (
              <label key={field.label} className="block">
                <span className="text-[12px] font-semibold text-[#3b3442]">{field.label}</span>
                <input
                  value={field.value}
                  disabled={!canEdit}
                  inputMode="numeric"
                  onChange={(event) => field.set(event.target.value)}
                  className="mt-1.5 h-10 w-full rounded-xl border border-[#ececf1] bg-white px-3 text-[13px] tabular-nums text-[#28222e] outline-none transition focus:border-[#ff5e1a] disabled:bg-[#faf9fb] disabled:text-[#6d6675]"
                />
              </label>
            ))}
          </div>

          <p className="mt-2.5 text-[11px] leading-snug text-[#6d6675]">
            The monthly cap is the ceiling on automatic charges — it&apos;s what makes it safe to leave auto top-up on.
            {auto.status === "active" && ` ${formatNumber(auto.spentThisMonth)} of ${formatNumber(auto.monthlyCap)} used this month.`}
          </p>

          {canEdit && (
            <button
              type="button"
              onClick={() => {
                updateAutoTopUp({ threshold: num(threshold), amount: num(amount), monthlyCap: num(cap) });
                showToast("Auto top-up updated.");
              }}
              className="mt-3.5 h-10 rounded-xl bg-[#24202a] px-4 text-[13px] font-bold text-white transition hover:bg-[#3b3442]"
            >
              Save auto top-up
            </button>
          )}
        </>
      )}

      {!canEdit && <p className="mt-3 text-[12px] text-[#6d6675]">Only the owner and billing admins can change auto top-up.</p>}
    </>
  );
}

/** 财务角色:收账单 + 能进来做基础的 plan / billing 操作,不占席位 */
function BillingContactsCard() {
  const { members, role, removeMember } = useTeam();
  const [financeInviteOpen, setFinanceInviteOpen] = useState(false);
  const canEdit = role === "owner";
  const contacts = members.filter((m) => m.role === "finance" && m.status !== "expired");

  return (
    <section className="rounded-2xl border border-[#ececf1] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[15px] font-bold text-[#28222e]">
            <Mail className="size-4 text-[#8a8490]" />
            Billing admins
          </p>
          <p className="mt-1 text-[12px] leading-snug text-[#6d6675]">
            Invoices and quota alerts go here. No seat used.
          </p>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => setFinanceInviteOpen(true)}
            className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-[#3b3442] px-4 text-[13px] font-bold text-white transition hover:bg-[#28222e]"
          >
            <Plus className="size-4" />
            Invite Billing Contact
          </button>
        )}
      </div>

      <div className="mt-3.5 space-y-2">
        {contacts.map((contact) => (
          <div key={contact.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-[#f0eef2] bg-[#faf9fb] px-3.5 py-2.5">
            <span
              className="grid size-8 shrink-0 place-items-center rounded-[9px] text-[12px] font-bold text-white"
              style={{ background: contact.color }}
            >
              {contact.email.trim()[0]?.toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-1.5 text-[13px] font-semibold text-[#28222e]">
                {contact.status === "active" ? contact.name : contact.email}
                {contact.status === "invited" && (
                  <span className="rounded-md bg-[#fff3ec] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#e07a3a]">Pending</span>
                )}
              </span>
              {contact.status === "active" && <span className="block truncate text-[12px] text-[#7b7480]">{contact.email}</span>}
            </span>
            {canEdit && (
              <button
                type="button"
                // Billing Admin 没有产品权限、没有作品要继承,继承人参数走 Owner 只为让日志说得通
                onClick={() => removeMember(contact.id, members.find((mem) => mem.role === "owner")?.id ?? contact.id)}
                className="shrink-0 text-[12px] font-bold text-[#6d6675] transition hover:text-[#d92d20]"
              >
                Remove
              </button>
            )}
          </div>
        ))}
        {contacts.length === 0 && (
          <p className="rounded-xl border border-dashed border-[#e6e2ea] px-3.5 py-3 text-[12px] text-[#6d6675]">
            No billing admins yet.
          </p>
        )}
      </div>

      {financeInviteOpen && <FinanceInviteModal onClose={() => setFinanceInviteOpen(false)} />}
    </section>
  );
}

function MemberUsageTable() {
  const { members, quota, isPool, seatCredits } = useTeam();
  const rows = members.filter((m) => m.role !== "finance" && m.status === "active").sort((a, b) => b.usedThisCycle - a.usedThisCycle);
  // 份额的分母是全团队消耗,不是「我这个席位」的消耗
  const teamUsed = isPool ? quota.used : rows.reduce((sum, member) => sum + member.usedThisCycle, 0);

  return (
    <section className="rounded-2xl border border-[#ececf1] bg-white p-5">
      <p className="text-[15px] font-bold text-[#28222e]">Usage by member</p>
      <p className="mt-1 text-[12px] text-[#6d6675]">
        {isPool ? "Who is spending the shared pool this cycle." : "What each seat has spent of its own credits this cycle."}
      </p>
      <div className="mt-4 space-y-3.5">
        {rows.map((member) => {
          const share = teamUsed === 0 ? 0 : member.usedThisCycle / teamUsed;
          const overLimit = member.allocation ? member.usedThisCycle / member.allocation.credits : 0;
          return (
            <div key={member.id}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="flex items-center gap-2 text-[13px] font-semibold text-[#3b3442]">
                  <span className="grid size-5 shrink-0 place-items-center rounded-[6px] text-[9px] font-bold text-white" style={{ background: member.color }}>
                    {member.name.trim()[0]?.toUpperCase()}
                  </span>
                  {member.name}
                  {isPool && member.allocation && (
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        overLimit >= 1 ? "bg-[#fff1ec] text-[#c9432a]" : overLimit >= 0.8 ? "bg-[#fff3ec] text-[#e07a3a]" : "bg-[#f1eff3] text-[#7b7480]"
                      }`}
                    >
                      {member.allocation.mode} {formatNumber(member.allocation.credits)}
                    </span>
                  )}
                  {!isPool && (
                    <span className="rounded-md bg-[#f1eff3] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#7b7480]">
                      of {formatNumber(seatCredits)}
                      {member.seatTopUp > 0 && ` +${formatNumber(member.seatTopUp)}`}
                    </span>
                  )}
                </span>
                <span className="tabular-nums text-[12px] text-[#7b7480]">
                  {formatNumber(member.usedThisCycle)} · {Math.round(share * 100)}% of pool
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#f1eff3]">
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.round(share * 100))}%`, background: member.color }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}


/** Credits and Usage:概览卡 + 池用量 + 自动充值 + 按成员用量 */
/** 图表里的模型 —— 取团队实际会用的几档,颜色沿用品牌与成员色板 */
const USAGE_MODELS = [
  { key: "Seedance 2.5", color: "#ff5255", weight: 30 },
  { key: "Seedance 2.0", color: "#ff7a2d", weight: 26 },
  { key: "Gemini Omni Flash", color: "#3aa3e3", weight: 18 },
  { key: "Nano Banana Pro", color: "#f0a020", weight: 14 },
  { key: "Seedream 4.5", color: "#7b5cf0", weight: 12 },
];

/**
 * 环比 —— 把窗口一刀切两半,后半段 vs 前半段。
 * 不编造「上一周期」的数据:两段等长、相邻,算出来的百分比是真的可解释的。
 */
function halfOverHalf(points: number[]) {
  if (points.length < 4) return null;
  const mid = Math.floor(points.length / 2);
  const previous = points.slice(0, mid).reduce((sum, value) => sum + value, 0);
  const current = points.slice(mid).reduce((sum, value) => sum + value, 0);
  if (previous <= 0) return null;
  return { pct: Math.round(((current - previous) / previous) * 100), current, previous, span: points.length - mid };
}

/**
 * Analytics —— 诊断页,不是报表页。
 *
 * 三块,从上到下就是一次判断:
 *   1. Burn rate —— 按现在的速度,这个账期够不够用(预测,带结论和可点的动作)
 *   2. Credits by model —— 钱花在哪、谁在涨(横向条形 + 环比,可展开看单模型日线)
 *   3. 一条去 Credits & usage 的入口 —— 按人的用量归那边,不在两页各画一遍
 *
 * 与 Credits & usage 的分工:那边回答「还能不能干活」,这边回答「接下来会怎样」。
 */
function AnalyticsTab() {
  const { isPersonal, role } = useTeam();
  const canSeeMembers = !isPersonal && (role === "owner" || role === "admin" || role === "finance");
  return (
    <div className="space-y-5">
      {/*
        导语去掉(2026-08-25)—— 与 Permissions 那处同一个决定:
        四个 KPI、两张图的标题、以及图例本身已经把这一页在说什么讲清楚了,
        顶上再放一段散文只是把内容往下推。
        「Member 只看得到自己」那条信息没丢:图里本来就只有他自己那条线。
      */}
      <UsageAnalytics canSeeMembers={canSeeMembers} />
    </div>
  );
}

function UsageAnalytics({ canSeeMembers }: { canSeeMembers: boolean }) {
  const { team, quota, members, isPool, openSettings } = useTeam();
  const [range, setRange] = useState<UsageRangeKey>("30d");
  const [rangeOpen, setRangeOpen] = useState(false);
  const days = USAGE_RANGES.find((item) => item.key === range)!.days;

  /*
   * 图是**全团队**的用量,所以总量不能直接用 quota.used ——
   * per-seat 团队里 quota.used 只是「我这个席位」的消耗,拿它当分母图会小一个数量级。
   * pool 团队的 quota.used 本身就是全组织池消耗,可以直接用。
   */
  const teamUsed = useMemo(
    () =>
      isPool
        ? quota.used
        : members
            .filter((member) => member.role !== "finance" && member.status === "active")
            .reduce((sum, member) => sum + member.usedThisCycle, 0),
    [isPool, quota.used, members],
  );

  const byModel = useMemo(
    () => buildUsageSeries({ seed: `${team.id}:model:${range}`, days, entries: USAGE_MODELS, total: teamUsed }),
    [team.id, range, days, teamUsed],
  );

  return (
    <div className="space-y-5">
      {/* Burn rate 不受上面那个时间范围影响 —— 它算的永远是**当前账期**,换范围会让预测失去意义 */}
      <BurnRateCard />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-[15px] font-bold text-[#28222e]">Where the credits went</h3>
        <div className="relative">
          <button
            type="button"
            aria-expanded={rangeOpen}
            onClick={() => setRangeOpen((v) => !v)}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-[#ececf1] px-3 text-[13px] font-semibold text-[#3b3442] transition hover:border-[#ddd7df] hover:bg-[#faf9fb]"
          >
            {USAGE_RANGES.find((item) => item.key === range)!.label}
            <ChevronDown className="size-3.5 text-[#8a8490]" />
          </button>
          {rangeOpen && (
            <div
              role="menu"
              className="absolute right-0 top-[calc(100%+6px)] z-10 w-[168px] overflow-hidden rounded-xl border border-[#ececf1] bg-white py-1 shadow-[0_16px_40px_rgba(26,26,46,0.16)]"
            >
              {USAGE_RANGES.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setRange(item.key);
                    setRangeOpen(false);
                  }}
                  className={`block w-full px-3.5 py-2 text-left text-[13px] transition hover:bg-[#f6f4f7] ${
                    item.key === range ? "font-bold text-[#ee6545]" : "font-semibold text-[#28222e]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <ModelBreakdown labels={byModel.labels} series={byModel.series} total={byModel.total} />

      {/*
        * 按成员的用量原来在这里又画了一遍堆叠面积图 —— 和 Credits & usage 的
        * 「Usage by member」是同一份数据,而那边带配额对比、带百分比、能一眼看出谁快爆了,
        * 严格更好用。同一份数据在两页各画一遍,只会让人不知道该信哪一页。
        */}
      {canSeeMembers && (
        <button
          type="button"
          onClick={() => openSettings("credits")}
          className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[#ececf1] bg-white px-5 py-4 text-left transition hover:border-[#ddd7df] hover:bg-[#faf9fb]"
        >
          <span>
            <span className="block text-[13.5px] font-bold text-[#28222e]">Per-person usage</span>
            <span className="mt-0.5 block text-[12px] text-[#6d6675]">
              Who spent what against their own allowance — in Credits &amp; usage.
            </span>
          </span>
          <ChevronDown className="size-4 shrink-0 -rotate-90 text-[#8a8490]" />
        </button>
      )}
    </div>
  );
}

/**
 * Burn rate —— 这一页的头条。
 *
 * 为什么它排在最前面而不是「本期共用了多少」:Owner 打开 Analytics 的真实动机
 * 从来不是「我想知道花了多少」,而是「够不够用、要不要现在做点什么」。
 * 一个已发生的总量回答不了这个问题,一个到期末的预测才行。
 *
 * 口径全部写在界面上,因为预测最怕的就是「这个数怎么来的」说不清:
 *   日均 = 本账期已用 ÷ 已过天数
 *   预计期末 = 日均 × 账期总天数
 *   还能撑 = 剩余额度 ÷ 日均
 */
function BurnRateCard() {
  const { team, quota, members, isPool, seatCredits, seatsTotal, nextBill, cycleStart, role, openSettings, can } = useTeam();

  const teamUsed = isPool
    ? quota.used
    : members
        .filter((member) => member.role !== "finance" && member.status === "active")
        .reduce((sum, member) => sum + member.usedThisCycle, 0);
  // per-seat 的团队额度 = 每席额度 × 席位数(包括还没坐人的席位 —— 钱已经付了)
  const teamTotal = isPool ? quota.total : seatCredits * seatsTotal;

  const start = parseDayStamp(cycleStart);
  const end = parseDayStamp(nextBill);
  const cycleDays = start && end ? daysBetween(start, end) : 0;
  const elapsed = start ? daysBetween(start, TODAY_STAMP) : 0;
  const daysLeft = Math.max(0, cycleDays - elapsed);

  // 账期刚开始(不足 2 天)时不预测 —— 一天的数据外推一个月,得出来的数字没有任何意义
  const enoughData = cycleDays > 0 && elapsed >= 2 && teamUsed > 0;
  const perDay = enoughData ? teamUsed / elapsed : 0;
  const projected = Math.round(perDay * cycleDays);
  const projectedPct = teamTotal > 0 ? projected / teamTotal : 0;
  const runwayDays = perDay > 0 ? (teamTotal - teamUsed) / perDay : Infinity;
  // 会不会在账期结束前用完
  const willRunOut = enoughData && runwayDays < daysLeft;

  const tone = willRunOut ? "#c9432a" : projectedPct > 0.85 ? "#e07a3a" : "#0f7a5a";
  const usedPct = teamTotal > 0 ? Math.min(1, teamUsed / teamTotal) : 0;
  const projectedBarPct = teamTotal > 0 ? Math.min(1, projected / teamTotal) : 0;

  if (!enoughData) {
    return (
      <section className="rounded-2xl border border-[#ececf1] bg-white p-5">
        <p className="text-[15px] font-bold text-[#28222e]">Not enough of this cycle has passed to project</p>
        <p className="mt-1.5 max-w-[70ch] text-[12.5px] leading-[1.6] text-[#6d6675]">
          {formatNumber(teamUsed)} of {formatNumber(teamTotal)} credits used since {cycleStart}. A forecast appears once
          there are a couple of days to extrapolate from.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-[#ececf1] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13.5px] font-semibold text-[#7b7480]">Projected for this cycle</p>
          <p className="mt-1 flex flex-wrap items-baseline gap-2">
            <span className="text-[30px] font-bold leading-none tracking-[-0.02em] tabular-nums" style={{ color: tone }}>
              {formatNumber(projected)}
            </span>
            <span className="text-[14px] font-semibold text-[#7b7480]">
              of {formatNumber(teamTotal)} · {Math.round(projectedPct * 100)}%
            </span>
          </p>
        </div>
        <p className="text-[11.5px] text-[#6d6675]">Updated {UPDATED_AT}</p>
      </div>

      {/*
        * 一条进度条同时画「已用」和「预计」——
        * 分成两条会让人去比对两个刻度,而这里真正要传达的就是「实心走到哪、虚线还要再走多远」。
        */}
      <div className="mt-4">
        <div className="relative h-2.5 overflow-hidden rounded-full bg-[#f1eff3]">
          <div
            className="absolute inset-y-0 left-0 rounded-full opacity-30"
            style={{ width: `${projectedBarPct * 100}%`, background: tone }}
          />
          <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${usedPct * 100}%`, background: tone }} />
        </div>
        <p className="mt-2 flex flex-wrap justify-between gap-2 text-[11.5px] text-[#6d6675]">
          <span>
            <span className="font-bold text-[#3b3442]">{formatNumber(teamUsed)}</span> used in {elapsed} days
          </span>
          <span>
            Resets {nextBill} · {daysLeft} days left
          </span>
        </p>
      </div>

      {/* 三个读数:速度、跑道、口径 —— 都是为了让上面那个预测数字站得住 */}
      <div className="mt-4 grid grid-cols-1 divide-y divide-[#f0eef2] rounded-xl border border-[#f0eef2] sm:grid-cols-3 sm:divide-y-0 [&>*:not(:first-child)]:sm:border-l [&>*:not(:first-child)]:sm:border-[#f0eef2]">
        <div className="px-4 py-3">
          <p className="text-[12px] text-[#6d6675]">Burning</p>
          <p className="mt-1 text-[15px] font-bold tabular-nums text-[#28222e]">
            {formatNumber(Math.round(perDay))}
            <span className="text-[12px] font-semibold text-[#7b7480]"> /day</span>
          </p>
        </div>
        <div className="px-4 py-3">
          <p className="text-[12px] text-[#6d6675]">Runs out in</p>
          <p className="mt-1 text-[15px] font-bold tabular-nums" style={{ color: willRunOut ? "#c9432a" : "#28222e" }}>
            {runwayDays >= daysLeft ? `Not this cycle` : `${Math.floor(runwayDays)} days`}
          </p>
        </div>
        <div className="px-4 py-3">
          <p className="text-[12px] text-[#6d6675]">Cycle</p>
          <p className="mt-1 text-[15px] font-bold tabular-nums text-[#28222e]">
            Day {elapsed} of {cycleDays}
          </p>
        </div>
      </div>

      {/*
        * 结论行 —— 没有这一句,上面全是数字,用户还得自己判断「所以呢」。
        * 而且要给一个能点的动作,否则「快用完了」这个信息落不了地。
        */}
      {willRunOut ? (
        <div className="mt-4 rounded-xl border border-[#f5ddc0] bg-[#fffaf1] px-4 py-3">
          <p className="text-[13px] font-bold text-[#8f5514]">
            At this pace {team.name} runs out around day {elapsed + Math.floor(runwayDays)} — {daysLeft - Math.floor(runwayDays)}{" "}
            days before the reset.
          </p>
          <p className="mt-1 text-[12px] leading-[1.6] text-[#7b5c52]">
            Top-up credits cover the gap and never expire. If this repeats every cycle, the plan is the wrong size — not the
            top-ups.
          </p>
          {can("credits.buy") && (
            <button
              type="button"
              onClick={() => openSettings("topup")}
              className="mt-3 h-9 rounded-xl bg-[#24202a] px-3.5 text-[12.5px] font-bold text-white transition hover:bg-[#3b3442]"
            >
              Buy a top-up
            </button>
          )}
          {!can("credits.buy") && role !== "owner" && (
            <p className="mt-2 text-[12px] font-semibold text-[#7b5c52]">Ask the owner to top up or resize the plan.</p>
          )}
        </div>
      ) : (
        <p className="mt-4 rounded-xl bg-[#faf9fb] px-4 py-3 text-[12.5px] leading-[1.6] text-[#7b7480]">
          On track. At {formatNumber(Math.round(perDay))} credits a day this cycle closes around{" "}
          {Math.round(projectedPct * 100)}% of the allowance, leaving {formatNumber(Math.max(0, teamTotal - projected))}{" "}
          unused. Unspent subscription credits don&apos;t roll over.
        </p>
      )}
    </section>
  );
}

/**
 * 按模型 —— 横向条形而不是堆叠面积图。
 *
 * 换掉堆叠面积图是这一页最重要的改动:堆叠图里只有最底下那条能读出真实趋势,
 * 其余每条都被下方序列的波动推着上下浮动。而这一块要回答的恰恰是
 * 「哪个模型在吃预算、它是不是在涨」—— 堆叠图结构上就答不了。
 *
 * 每行可展开,展开后单独画这一个模型的日线,趋势才真的看得见。
 */
function ModelBreakdown({ labels, series, total }: { labels: string[]; series: UsageSeries[]; total: number }) {
  const [open, setOpen] = useState<string | null>(null);
  const rows = [...series].sort((a, b) => b.total - a.total);
  const peak = Math.max(1, ...rows.map((row) => row.total));

  return (
    <section className="rounded-2xl border border-[#ececf1] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[13.5px] font-semibold text-[#7b7480]">Credits by model</p>
          <p className="mt-1 text-[30px] font-bold leading-none tracking-[-0.02em] tabular-nums text-[#28222e]">
            {formatNumber(total)}
          </p>
        </div>
        <p className="text-[11.5px] text-[#6d6675]">Tap a row for its daily trend</p>
      </div>

      <div className="mt-4 divide-y divide-[#f4f2f6]">
        {rows.map((row) => {
          const delta = halfOverHalf(row.points);
          const share = total > 0 ? row.total / total : 0;
          const isOpen = open === row.key;
          return (
            <div key={row.key}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : row.key)}
                aria-expanded={isOpen}
                className="w-full py-3 text-left transition hover:opacity-80"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <span className="flex min-w-0 items-center gap-2 text-[13px] font-semibold text-[#3b3442]">
                    <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ background: row.color }} />
                    <span className="truncate">{row.key}</span>
                  </span>
                  <span className="flex shrink-0 items-baseline gap-3 tabular-nums">
                    <span className="text-[13px] font-bold text-[#28222e]">{formatNumber(row.total)}</span>
                    <span className="w-9 text-right text-[12px] text-[#7b7480]">{Math.round(share * 100)}%</span>
                    {/*
                      * 环比是这一块存在的理由 —— 「谁在涨」比「谁最大」更值得处理:
                      * 最大的那个可能一直都最大,涨最快的那个才是这个月的新情况。
                      */}
                    <span
                      className={`w-14 text-right text-[12px] font-bold ${
                        !delta || delta.pct === 0
                          ? "text-[#8a8490]"
                          : delta.pct > 0
                            ? "text-[#0f7a5a]"
                            : "text-[#c9432a]"
                      }`}
                    >
                      {!delta || delta.pct === 0 ? "—" : `${delta.pct > 0 ? "▲" : "▼"} ${Math.abs(delta.pct)}%`}
                    </span>
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#f1eff3]">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.max(2, (row.total / peak) * 100)}%`, background: row.color }}
                  />
                </div>
              </button>
              {isOpen && (
                <div className="pb-4">
                  <MiniLineChart labels={labels} points={row.points} color={row.color} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[11.5px] text-[#6d6675]">
        ▲▼ compares the second half of the window with the first half.
      </p>
    </section>
  );
}


function CreditsTab() {
  const { team, nextBill, role, quota, members, isPersonal, isPool, seatCredits, plan } = useTeam();
  const [creditsOpen, setCreditsOpen] = useState(false);
  const canBill = role === "owner" || role === "finance";
  // 个人账户只有自己一行,按成员用量没有意义
  const canSeeMembers = !isPersonal && (role === "owner" || role === "admin" || role === "finance");
  const financeCount = members.filter((m) => m.role === "finance").length;

  return (
    <div className="space-y-6">
      <SeatsOverviewCard financeCount={financeCount} />

      {isPool ? (
        /* ---------- Enterprise:一个组织共享池 ---------- */
        <section className="space-y-5 rounded-2xl border border-[#ececf1] bg-white p-5">
          <div>
            <h3 className="text-[15px] font-bold text-[#28222e]">Shared credit pool this cycle</h3>
            <p className="mt-1 text-[12.5px] text-[#6d6675]">
              Every seat draws from one pool. Allocate credits per member on the Members tab.
            </p>
          </div>
          <UsageBar
            label="Monthly pool"
            right={`${formatNumber(quota.used)} / ${formatNumber(quota.total)} used`}
            pct={quota.usedPct}
            tone={quota.alert === "full" ? "#e35b3d" : quota.alert === "warn" ? "#e07a3a" : "#5b6cff"}
            note={`Resets on ${nextBill}. Unused pool credits don't roll over.`}
          />
          <UsageBar
            label="Top-up credits"
            right={`${formatNumber(quota.topupRemaining)} left`}
            pct={quota.topupRemaining > 0 ? 1 : 0}
            tone="#12a594"
            note={team.topupRemaining > 0 ? "Rolls over. Never expires." : "Buy credits below — they roll over and never expire."}
          />
          <p className="rounded-xl bg-[#faf9fb] px-3.5 py-3 text-[12px] leading-snug text-[#7b7480]">
            Monthly pool credits are spent first, then top-up credits — so nothing you paid extra for expires while monthly credits
            go unused.
          </p>
          <PourOverRow />
          {quota.alert && (
            <p
              className={`rounded-xl px-3.5 py-3 text-[12px] font-semibold leading-snug ${
                quota.alert === "full" ? "bg-[#fff1ec] text-[#c9432a]" : "bg-[#fff3ec] text-[#b06a1c]"
              }`}
            >
              {quota.alert === "full"
                ? "The shared pool is used up. The owner, admins, and billing admins were emailed."
                : "The shared pool is over 80% used. The owner, admins, and billing admins were emailed."}
            </p>
          )}
        </section>
      ) : (
        /* ---------- Team / Scale:每席固定,没有池 ---------- */
        <section className="space-y-5 rounded-2xl border border-[#ececf1] bg-white p-5">
          <div>
            <h3 className="text-[15px] font-bold text-[#28222e]">
              {isPersonal ? "Your credits this cycle" : "Credits per seat this cycle"}
            </h3>
            <p className="mt-1 text-[12.5px] text-[#6d6675]">
              {isPersonal
                ? `Your plan includes ${formatNumber(seatCredits)} credits a month.`
                : `Every seat on ${plan.name} gets ${formatNumber(
                    seatCredits,
                  )} credits a month. Credits are not pooled and can't be moved between people — a seat that runs out needs its own top-up.`}
            </p>
          </div>
          <UsageBar
            label={isPersonal ? "This month" : "Your seat this month"}
            right={`${formatNumber(quota.used)} / ${formatNumber(quota.total)} used`}
            pct={quota.usedPct}
            tone={quota.alert === "full" ? "#e35b3d" : quota.alert === "warn" ? "#e07a3a" : "#5b6cff"}
            note={`Resets on ${nextBill}. Unused credits don't roll over.`}
          />
          <UsageBar
            label="Top-up on your seat"
            right={`${formatNumber(quota.topupRemaining)} left`}
            pct={quota.topupRemaining > 0 ? 1 : 0}
            tone="#12a594"
            note={
              quota.topupRemaining > 0
                ? "Never expires. Spent only after this month's credits run out."
                : "Top-ups are bought per seat and never expire."
            }
          />
          {!isPersonal && (
            <p className="rounded-xl bg-[#faf9fb] px-3.5 py-3 text-[12px] leading-snug text-[#7b7480]">
              Need credits allocated across people instead of fixed per seat? That&apos;s Enterprise, which runs on a shared pool.
            </p>
          )}
          {quota.alert && (
            <p
              className={`rounded-xl px-3.5 py-3 text-[12px] font-semibold leading-snug ${
                quota.alert === "full" ? "bg-[#fff1ec] text-[#c9432a]" : "bg-[#fff3ec] text-[#b06a1c]"
              }`}
            >
              {quota.alert === "full"
                ? "Your seat is out of credits for this cycle. Buy a top-up for it, or wait for the reset."
                : "Your seat is over 80% used for this cycle."}
            </p>
          )}
        </section>
      )}

      {/* 成员用量表留在这里 —— 它带 Top up 与改分配额度,是操作台不是报表 */}
      {canSeeMembers && <MemberUsageTable />}

      {canBill && (
        <div>
          <button
            type="button"
            onClick={() => setCreditsOpen(true)}
            className="h-10 rounded-xl bg-[#24202a] px-4 text-[13px] font-bold text-white transition hover:bg-[#3b3442]"
          >
            {isPool ? "Buy pool credits" : "Buy a seat top-up"}
          </button>
        </div>
      )}

      {creditsOpen && <CreditsModal onClose={() => setCreditsOpen(false)} />}
    </div>
  );
}

/** pour-over —— 只有 Enterprise 有:成员没花完的分配额度月底是否回流池中 */
function PourOverRow() {
  const { team, setPourOver, role } = useTeam();
  const canEdit = role === "owner" || role === "admin";
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#ececf1] bg-[#faf9fb] px-3.5 py-3">
      <div className="min-w-0">
        <p className="text-[13px] font-bold text-[#28222e]">Pour-over</p>
        <p className="mt-0.5 text-[12px] leading-snug text-[#7b7480]">
          Credits a member doesn&apos;t spend return to the pool at the end of the cycle instead of expiring with them.
        </p>
      </div>
      <Switch
        checked={team.pourOver}
        ariaLabel="Pour-over"
        disabled={!canEdit}
        onChange={() => setPourOver(!team.pourOver)}
      />
    </div>
  );
}

/**
 * 有 Billing 只读权限的角色看到的账单页 —— 看得见,改不了。
 *
 * 「Need more?(申请席位 / 申请充值)」那一块已删(2026-08-25):
 * 面向外部客户,额度和席位是跟销售/账单谈的,不在 BuzzVideo 里走审批流。
 * PL 内部同事的申请入口在「PL 内部用户」模块的 Internal Request Credits,
 * 走的是既有的内部工单,不是这个产品里的功能。
 */
function BillingReadOnly() {
  const { team, plan, nextBill, renewalDate, quota, seatsUsed, seatsTotal } = useTeam();

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-[#ececf1] bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#6d6675]">Current plan</p>
            <p className="mt-1.5 text-[20px] font-bold tracking-[-0.02em] text-[#28222e]">
              {plan.name} <span className="text-[15px] font-semibold text-[#7b7480]">· {plan.price}</span>
            </p>
            {/* 年付时扣款日和额度重置日不是同一天,这里说的是扣款 */}
            <p className="mt-1 text-[13px] text-[#6d6675]">Renews on {renewalDate}</p>
          </div>
          <span className="rounded-lg bg-[#f6f4f7] px-2.5 py-1 text-[11px] font-bold text-[#7b7480]">View only</span>
        </div>

        <dl className="mt-5 grid gap-4 border-t border-[#f0eef2] pt-4 sm:grid-cols-2">
          <div>
            <dt className="text-[12px] font-semibold text-[#6d6675]">Seats</dt>
            <dd className="mt-1 text-[15px] font-bold text-[#28222e]">
              {seatsUsed} of {seatsTotal} used
            </dd>
          </div>
          <div>
            <dt className="text-[12px] font-semibold text-[#6d6675]">Credits left this month</dt>
            <dd className="mt-1 text-[15px] font-bold text-[#28222e]">{formatNumber(quota.available)}</dd>
          </div>
        </dl>
      </section>
      <p className="text-[12px] leading-snug text-[#6d6675]">
        Invoices and payment details stay with {team.name}&apos;s owner and billing admins. Credits reset on {nextBill}.
      </p>
    </div>
  );
}

/** 账单页的二级 tab —— 对齐参考稿:Plan / Invoices / Settings */
const BILLING_SUBS = [
  { key: "plan", label: "Plan" },
  { key: "invoices", label: "Invoices" },
  { key: "settings", label: "Settings" },
] as const;
type BillingSub = (typeof BILLING_SUBS)[number]["key"];

/** 发票流水 —— 按当前套餐价与账期确定性生成,够评审看形态 */
/**
 * 发票流水 —— 七列:Date / Item / PaymentType / TransactionType / Amount / Status / Invoice。
 *
 * 为什么要 PaymentType 与 TransactionType 两列而不是一句 description:
 * 财务对账时要分清「这笔是订阅还是一次性」以及「是新订、续费、升档还是买包」。
 * 挤成一句「Enterprise · monthly」的话,升档补款和正常续费长得一模一样,对不出来。
 *
 * 金额一律给真数 —— Enterprise 的定价页写「Let's talk」,但发票上不能写这个:
 * 发票记的是**实际扣了多少**,合同月费从 team.contractMonthly 来。
 */
type PaymentType = "subscription" | "one_time";
type TransactionType = "new_subscription" | "renewal" | "upgrade" | "purchase";

type InvoiceRow = {
  id: string;
  at: string;
  item: string;
  paymentType: PaymentType;
  transactionType: TransactionType;
  amount: number;
  status: "paid" | "open";
};

const usd = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;

function useInvoices(planName: string, monthly: number, seats: number, cycle: BillingCycle): InvoiceRow[] {
  return useMemo(() => {
    const seatLabel = `${planName} · ${seats} seats`;
    /*
     * 年付客户一年只有一张订阅发票 —— 金额是月费 × 12,不是每月一张。
     * 中间的 top-up / 加席位仍是一次性发票,照常出现,所以流水不会只剩一行。
     */
    if (cycle === "yearly") {
      /*
       * 时间线必须自洽:合同 2026-08-01 起签,加席位和买包都发生在**之后**。
       * 金额推导 —— 基础年费 = (合同月费 − 加购席位月费) × 12;
       * 加席位不是收一整年,是按合同**剩余月份**补收。
       */
      const ADDON_SEATS = 3;
      const ADDON_SEAT_MONTHLY = 39;
      const MONTHS_LEFT_AT_UPGRADE = 11;
      const baseAnnual = (monthly - ADDON_SEATS * ADDON_SEAT_MONTHLY) * 12;
      return [
        {
          id: "INV-2026-08c",
          at: "2026-08-18 14:22",
          item: "50,000 Credits",
          paymentType: "one_time",
          transactionType: "purchase",
          amount: 500,
          status: "paid",
        },
        {
          id: "INV-2026-08b",
          at: "2026-08-12 11:05",
          item: `${planName} · +${ADDON_SEATS} seats · ${MONTHS_LEFT_AT_UPGRADE} months remaining`,
          paymentType: "subscription",
          transactionType: "upgrade",
          amount: ADDON_SEATS * ADDON_SEAT_MONTHLY * MONTHS_LEFT_AT_UPGRADE,
          status: "paid",
        },
        {
          id: "INV-2026-08",
          at: "2026-08-01 09:00",
          item: `${planName} · ${Math.max(1, seats - ADDON_SEATS)} seats · 12 months`,
          paymentType: "subscription",
          transactionType: "new_subscription",
          amount: baseAnnual,
          status: "paid",
        },
      ];
    }
    return [
      {
        id: "INV-2026-08",
        at: "2026-08-01 09:00",
        item: seatLabel,
        paymentType: "subscription",
        transactionType: "renewal",
        amount: monthly,
        status: "open",
      },
      {
        id: "INV-2026-07b",
        at: "2026-07-18 14:22",
        item: "50,000 Credits",
        paymentType: "one_time",
        transactionType: "purchase",
        amount: 500,
        status: "paid",
      },
      {
        id: "INV-2026-07",
        at: "2026-07-01 09:00",
        item: seatLabel,
        paymentType: "subscription",
        transactionType: "renewal",
        amount: monthly,
        status: "paid",
      },
      {
        id: "INV-2026-06b",
        at: "2026-06-12 11:05",
        item: `${planName} · +3 seats`,
        paymentType: "subscription",
        transactionType: "upgrade",
        amount: Math.round(monthly * 0.03 * 100) / 100 || 117,
        status: "paid",
      },
      {
        id: "INV-2026-06",
        at: "2026-06-01 09:00",
        item: `${planName} · ${Math.max(1, seats - 3)} seats`,
        paymentType: "subscription",
        transactionType: "new_subscription",
        amount: monthly,
        status: "paid",
      },
    ];
  }, [planName, monthly, seats, cycle]);
}

function BillingTab() {
  const {
    team,
    plan,
    nextBill,
    renewalDate,
    cycleStart,
    role,
    quota,
    seatsUsed,
    seatsTotal,
    isPersonal,
    members,
    updateAutoTopUp,
    hasActiveSubscription,
    openSettings,
    showToast,
    pendingChange,
    undoPendingChange,
    setBillingCycle,
    isExpired,
    inGrace,
    graceEndsAt,
    graceDays,
  } = useTeam();
  const [sub, setSub] = useState<BillingSub>("plan");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [resubOpen, setResubOpen] = useState(false);
  const cycle = team.billingCycle ?? "monthly";
  const [planOpen, setPlanOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [seatsOpen, setSeatsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const auto = team.autoTopUp;
  /* Enterprise 用合同月费;自助档用「每席价 × 席位数」—— 发票金额必须是真扣的数 */
  const monthlyCharge = team.contractMonthly ?? seatPriceOf(plan, team.billingCycle) * seatsTotal;
  const invoices = useInvoices(plan.name, monthlyCharge, seatsTotal, cycle);

  const canSeeBilling = role === "owner" || role === "finance";
  const canBuy = role === "owner"; // 换套餐 / 加席位仍只有 Owner
  const overrides = members.filter((member) => member.allocation).length;

  // 之前这里是个死胡同:权限判断是对的,但只写「去找 Owner」,没有任何可执行动作。
  if (!canSeeBilling) return <BillingReadOnly />;

  const card = "rounded-2xl border border-[#ececf1] bg-white";
  const ghostBtn =
    "h-9 shrink-0 rounded-xl border border-[#ececf1] px-3.5 text-[13px] font-bold text-[#3b3442] transition hover:border-[#ddd7df] hover:bg-[#faf9fb]";

  return (
    <div className="space-y-5">
      {/* 二级 tab */}
      <div className="flex gap-6 border-b border-[#f0eef2]">
        {BILLING_SUBS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setSub(key)}
            aria-current={sub === key ? "true" : undefined}
            className={`-mb-px border-b-2 pb-2.5 text-[14px] transition ${
              sub === key
                ? "border-[#28222e] font-bold text-[#28222e]"
                : "border-transparent font-semibold text-[#6d6675] hover:text-[#3b3442]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/*
        * 订阅生命周期的三条横幅,常驻在账单页最上面。
        * 顺序就是严重程度:已终止 > 续费失败 > 有待生效变更。
        */}
      {isExpired && (
        <section className="rounded-2xl border border-[#f3d4cd] bg-[#fef6f4] p-5">
          <p className="flex items-center gap-2 text-[14px] font-bold text-[#8f2f16]">
            <AlertTriangle className="size-4" />
            This subscription has ended
          </p>
          <p className="mt-1.5 max-w-[74ch] text-[12.5px] leading-[1.6] text-[#7b5c52]">
            {team.name} is on Free. Everything the team made is still here — viewable, downloadable, deletable — and
            members keep their seats. What stopped is the monthly credits, so nobody can start new work until you pick a
            plan again. Seats are frozen in the meantime, so new invites are paused too.
          </p>
          {canBuy && (
            <button
              type="button"
              onClick={() => setResubOpen(true)}
              className="mt-3.5 h-9 rounded-xl bg-[#24202a] px-3.5 text-[12.5px] font-bold text-white transition hover:bg-[#3b3442]"
            >
              Choose a plan
            </button>
          )}
        </section>
      )}

      {inGrace && !isExpired && (
        <section className="rounded-2xl border border-[#f5ddc0] bg-[#fffaf1] p-5">
          <p className="flex items-center gap-2 text-[14px] font-bold text-[#8f5514]">
            <AlertTriangle className="size-4" />
            We couldn&apos;t renew this subscription
          </p>
          {/*
            * 必须说清额度是什么状态,否则用户看到余额没动会以为「这个月的额度已经发了」。
            * 实际是**没有重置**:手上是上一期剩下的,新一期要等扣款成功才发。
            * 账期锚点不动(保持原续费日),所以还要说一句「Your renewal date doesn't move」——
            * 否则用户会以为晚付几天、账期就往后顺延几天。
            * 不写这句的话,余额用完的团队会以为自己被降级了,余额还多的团队会以为已经续上了。
            */}
          <p className="mt-1.5 max-w-[74ch] text-[12.5px] leading-[1.6] text-[#8a7455]">
            The card was declined. Nothing has changed yet — the team keeps full access for {graceDays} more days, until{" "}
            {graceEndsAt}. Credits haven&apos;t reset: what&apos;s left from last cycle is still yours to spend, and the
            new ones arrive as soon as the payment goes through. Your renewal date doesn&apos;t move. If the payment
            still hasn&apos;t gone through by {graceEndsAt}, the subscription ends and {team.name} moves to Free.
          </p>
          <div className="mt-3.5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => showToast("Card update isn't wired up in this prototype.")}
              className="h-9 rounded-xl bg-[#24202a] px-3.5 text-[12.5px] font-bold text-white transition hover:bg-[#3b3442]"
            >
              Update payment method
            </button>
            <button
              type="button"
              onClick={() => showToast("Retry isn't wired up in this prototype.")}
              className={ghostBtn}
            >
              Retry payment
            </button>
          </div>
        </section>
      )}

      {pendingChange && !isExpired && (
        <section className="rounded-2xl border border-[#dfe3ee] bg-[#f7f9fd] p-5">
          <p className="text-[14px] font-bold text-[#28222e]">
            {pendingChange.kind === "cancel"
              ? `${plan.name} ends on ${pendingChange.effectiveAt}`
              : pendingChange.kind === "downgrade"
                ? `${plan.name} changes to ${PLANS.find((item) => item.id === pendingChange.targetPlanId)?.name} on ${pendingChange.effectiveAt}`
                : `Billing switches to monthly on ${pendingChange.effectiveAt}`}
          </p>
          <p className="mt-1.5 max-w-[74ch] text-[12.5px] leading-[1.6] text-[#5f6a80]">
            {pendingChange.kind === "cancel"
              ? `Until then nothing changes — the full ${plan.name} allowance is yours to use. After that the team moves to Free: the work stays, the monthly credits stop.`
              : pendingChange.kind === "downgrade"
                ? `Until then nothing changes — you keep the full ${plan.name} allowance. Per-seat credits drop on the day it takes effect, so give the team a heads-up.`
                : "You already paid for the year, so the switch waits until the year is up. Nothing changes before then."}
          </p>
          {canBuy && (
            <button type="button" onClick={undoPendingChange} className={`${ghostBtn} mt-3.5`}>
              {pendingChange.kind === "cancel" ? "Keep the subscription" : "Cancel this change"}
            </button>
          )}
        </section>
      )}

      {sub === "plan" && (
        <>
          {/* 套餐卡 */}
          <section className={card}>
            <div className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                {/*
                  * 终止之后这张卡必须读作 Free —— 上面挂着「订阅已结束」的横幅、
                  * 下面还印着 Scale / $169/seat,评审现场一眼就是自相矛盾。
                  */}
                <div>
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="text-[19px] font-bold tracking-[-0.02em] text-[#28222e]">
                      {isExpired ? "Free" : plan.name}
                    </span>
                    {isExpired ? (
                      <span className="rounded-md bg-[#f2f0f4] px-2 py-0.5 text-[11px] font-bold text-[#6d6675]">No plan</span>
                    ) : (
                      <span className="rounded-md bg-[#e7f5ee] px-2 py-0.5 text-[11px] font-bold text-[#12734f]">
                        {cycle === "yearly" ? "Annual" : "Monthly"}
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-[13px] text-[#7b7480]">
                    {isExpired
                      ? `${plan.name} ended — no monthly credits`
                      : hasActiveSubscription
                        ? cycle === "yearly"
                          ? `Renews ${renewalDate} · credits reset ${nextBill}`
                          : `Current cycle: ${cycleStart} – ${nextBill}`
                        : "No active subscription"}
                    {!isExpired && hasActiveSubscription && <span className="text-[#6d6675]"> · {plan.price}</span>}
                  </p>
                </div>
                {/* 转年付是升级方向(立即生效、全额收);转月付是降级,排到年结 —— 所以这里只在月付时出现 */}
                {!isExpired && cycle === "monthly" && canBuy && plan.id !== "enterprise" && (
                  <button
                    type="button"
                    onClick={() => setBillingCycle("yearly")}
                    className="shrink-0 rounded-full bg-[#f2ebff] px-3 py-1.5 text-[12px] font-bold text-[#6c4ae0] transition hover:bg-[#e9dfff]"
                  >
                    Switch to annual billing and save 30%
                  </button>
                )}
                {/* Enterprise 是合同制,账期变更走销售,不在产品里自助切 */}
                {!isExpired && cycle === "yearly" && canBuy && plan.id !== "enterprise" && (
                  <button
                    type="button"
                    onClick={() => setBillingCycle("monthly")}
                    className={`${ghostBtn} shrink-0`}
                  >
                    Switch to monthly
                  </button>
                )}
              </div>

              {!isPersonal && (
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[15px] font-bold text-[#28222e]">
                    <span className="tabular-nums">{seatsUsed}</span>/<span className="tabular-nums">{seatsTotal}</span> seats in
                    use
                  </p>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      disabled={!canBuy}
                      title={canBuy ? undefined : "Only the owner can buy seats."}
                      onClick={() => setSeatsOpen(true)}
                      className={`${ghostBtn} disabled:cursor-not-allowed disabled:opacity-40`}
                    >
                      Manage seats
                    </button>
                    <button
                      type="button"
                      disabled={!canBuy}
                      title={canBuy ? undefined : "Only the owner can change the plan."}
                      onClick={() => setPlanOpen(true)}
                      className="h-9 shrink-0 rounded-xl bg-[#24202a] px-3.5 text-[13px] font-bold text-white transition hover:bg-[#3b3442] disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      Change plan
                    </button>
                  </div>
                </div>
              )}
            </div>

            {!isPersonal && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-b-2xl border-t border-[#f0eef2] bg-[#faf9fb] px-5 py-3">
                <p className="text-[12.5px] text-[#7b7480]">
                  Seat changes must be made 24 hours before renewal to affect billing.
                </p>
                <button
                  type="button"
                  disabled={!canBuy}
                  onClick={() => setSeatsOpen(true)}
                  className="text-[12.5px] font-bold text-[#3b3442] underline underline-offset-2 disabled:opacity-40"
                >
                  Manage seats
                </button>
              </div>
            )}
          </section>

          {/* 积分余额卡 */}
          <section className={`${card} p-5`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <p className="text-[15px] font-bold text-[#28222e]">Credits balance</p>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setCreditsOpen(true)} className={ghostBtn}>
                  Add credits
                </button>
                <div className="relative">
                  <button
                    type="button"
                    aria-label="More credit actions"
                    aria-expanded={moreOpen}
                    onClick={() => setMoreOpen((v) => !v)}
                    className="grid size-9 place-items-center rounded-xl text-[#8a8490] transition hover:bg-[#f6f4f7] hover:text-[#28222e]"
                  >
                    <MoreHorizontal className="size-[18px]" />
                  </button>
                  {moreOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 top-[calc(100%+6px)] z-10 w-[196px] overflow-hidden rounded-xl border border-[#ececf1] bg-white py-1 shadow-[0_16px_40px_rgba(26,26,46,0.16)]"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setMoreOpen(false);
                          openSettings("credits");
                        }}
                        className="block w-full px-3.5 py-2 text-left text-[13px] font-semibold text-[#28222e] hover:bg-[#f6f4f7]"
                      >
                        View usage
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMoreOpen(false);
                          openSettings("topup");
                        }}
                        className="block w-full px-3.5 py-2 text-left text-[13px] font-semibold text-[#28222e] hover:bg-[#f6f4f7]"
                      >
                        Top-up history
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <p className="mt-3 flex flex-wrap items-baseline gap-2">
              <span className="text-[40px] font-bold leading-none tracking-[-0.03em] tabular-nums text-[#28222e]">
                {formatNumber(quota.available)}
              </span>
              <span className="text-[14px] font-semibold text-[#7b7480]">
                credits · {formatNumber(quota.remaining)} subscription + {formatNumber(quota.topupRemaining)} top-up
              </span>
            </p>


            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#f0eef2] pt-4">
              <div>
                <p className="text-[14px] font-bold text-[#28222e]">Usage alerts</p>
                {/*
                  站内的 80% / 100% 告警已移除,但**邮件保留**(2026-08-25 定)——
                  邮件是「通知你一声」,不是让人在产品里跟老板讨价还价,
                  与「外部客户不在 BuzzVideo 沟通 credits」不冲突。
                  收件人收窄到 Owner:掏钱的是他,他之外的人收到也做不了什么。
                  没有可配的东西,所以不给 Manage 按钮 —— 之前那个还指向 Top-up 页,
                  而自动充值已经搬走了,点过去什么也找不到。
                */}
                <p className="mt-1 text-[12.5px] text-[#7b7480]">
                  The owner is emailed at 80% and 100% of the pool.
                </p>
              </div>
            </div>
          </section>

          {/*
            自动充值独立成卡 —— 它不是「余额」的一个属性,是一条会自动扣钱的规则,
            塞在 Credits balance 里会被当成读数的附注读过去。
            开着时展开三个输入框,那一整块比余额本身还高,更不该寄居在别人卡里。
          */}
          <section className={`${card} p-5`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 max-w-[62ch]">
                <p className="flex flex-wrap items-center gap-2 text-[15px] font-bold text-[#28222e]">
                  Automatic reload
                  <span className="rounded-md bg-[#f2ebff] px-1.5 py-0.5 text-[11px] font-bold text-[#6c4ae0]">Recommended</span>
                </p>
                <p className="mt-1 text-[12.5px] leading-snug text-[#7b7480]">
                  Automatically add credits when the pool runs low, up to a monthly cap you set.
                </p>
              </div>
              <div className="mt-0.5">
                <Switch
                  checked={auto.enabled}
                  ariaLabel="Automatic reload"
                  onChange={() => updateAutoTopUp({ enabled: !auto.enabled })}
                />
              </div>
            </div>
            <AutoTopUpSettings />
          </section>

          {/*
            「Monthly usage limits」卡已删(2026-08-25)——
            它只是把成员表里已有的东西再列一遍:Per seat limit 与 Per user override
            的真实操作入口都在 Members 那一页(每行的编辑笔),这里的两个 Manage
            点过去也是跳回 Members。两个地方讲同一件事,改一处忘一处迟早对不上。
          */}
        </>
      )}

      {sub === "invoices" && (
        <section className={`${card} overflow-hidden`}>
          {hasActiveSubscription ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#f0eef2] bg-[#faf9fb]">
                    {["Date", "Item", "PaymentType", "TransactionType", "Amount", "Status", "Invoice"].map((head) => (
                      <th key={head} className="whitespace-nowrap px-4 py-3 text-[12px] font-bold text-[#28222e]">
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-[#f5f3f7] last:border-b-0">
                      <td className="whitespace-nowrap px-4 py-3 text-[13px] tabular-nums text-[#56505c]">{invoice.at}</td>
                      <td className="px-4 py-3 text-[13px] font-semibold text-[#28222e]">{invoice.item}</td>
                      {/* 类型两列保留 snake_case —— 它是账务字段,不是给人读的散文,
                          改成 Title Case 反而和后端/对账单对不上 */}
                      <td className="whitespace-nowrap px-4 py-3 text-[13px] text-[#56505c]">{invoice.paymentType}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-[13px] text-[#56505c]">{invoice.transactionType}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-[13px] font-semibold tabular-nums text-[#28222e]">
                        {usd(invoice.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                            invoice.status === "paid" ? "bg-[#e7f5ee] text-[#12734f]" : "bg-[#fff4e6] text-[#9a3412]"
                          }`}
                        >
                          {invoice.status === "paid" ? "Paid" : "Open"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => showToast("Invoice view isn't wired up in this prototype.")}
                          className="text-[12.5px] font-bold text-[#ee6545] underline underline-offset-2"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-5 py-6 text-[13px] text-[#7b7480]">
              No invoices yet — {team.name} was created this cycle. The first invoice appears after it closes.
            </p>
          )}
        </section>
      )}

      {sub === "settings" && (
        <>
          <PaymentMethodsCard />

          {!isPersonal && <BillingContactsCard />}

          {hasActiveSubscription && canBuy && !isExpired && !pendingChange && (
            <section className={`${card} p-5`}>
              <p className="text-[14px] font-bold text-[#28222e]">Cancel subscription</p>
              <p className="mt-1 max-w-[70ch] text-[12.5px] leading-[1.55] text-[#7b7480]">
                The team keeps everything until {renewalDate}. After that {team.name} moves to Free: all the work stays and
                stays viewable, but monthly credits stop and nobody can create.
              </p>
              <button type="button" onClick={() => setCancelOpen(true)} className={`${ghostBtn} mt-3.5`}>
                Cancel plan
              </button>
            </section>
          )}
        </>
      )}

      {cancelOpen && <CancelSurveyModal onClose={() => setCancelOpen(false)} />}
      {resubOpen && <PlanModal onClose={() => setResubOpen(false)} />}

      {planOpen && <PlanModal onClose={() => setPlanOpen(false)} />}
      {creditsOpen && <CreditsModal onClose={() => setCreditsOpen(false)} />}
      {seatsOpen && <SeatsModal onClose={() => setSeatsOpen(false)} />}
    </div>
  );
}

/**
 * 取消订阅问卷 —— 不是走过场。流失原因决定我们该修什么:
 * 「太贵」和「用不上」指向完全不同的动作,所以必须选一条才让走。
 *
 * 也是最后一次留人的机会,所以把「取消之后会发生什么」写全:
 * 期末之前一切照常、之后退回 Free、数据不删、top-up 还留着(永久有效)。
 */
function CancelSurveyModal({ onClose }: { onClose: () => void }) {
  const { team, plan, nextBill, cancelPlan } = useTeam();
  const [reason, setReason] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  useDialog({ ref: panelRef, onClose });

  const chosen = CANCEL_REASONS.find((item) => item.id === reason);

  return (
    <div
      className="fixed inset-x-0 bottom-0 top-[52px] z-[220] grid place-items-center bg-[#1a1a2e]/45 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Cancel subscription"
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className="max-h-full w-full max-w-[520px] overflow-y-auto rounded-3xl bg-white p-6 shadow-[0_28px_70px_rgba(26,26,46,0.28)] outline-none"
      >
        <h2 className="text-[18px] font-bold tracking-[-0.01em] text-[#28222e]">Cancel {plan.name}?</h2>
        <p className="mt-1.5 text-[13px] leading-[1.6] text-[#7b7480]">
          {team.name} keeps everything until <span className="font-semibold text-[#3b3442]">{nextBill}</span>. After that
          it moves to Free — the work all stays, but the monthly credits stop and nobody can create.
        </p>

        <p className="mt-5 text-[12px] font-bold uppercase tracking-[0.06em] text-[#6d6675]">
          Before you go — what pushed you out?
        </p>
        <div className="mt-2 space-y-1.5">
          {CANCEL_REASONS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setReason(item.id)}
              aria-pressed={reason === item.id}
              className={`flex w-full items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-[13px] font-semibold transition ${
                reason === item.id
                  ? "border-[#28222e] bg-[#faf9fb] text-[#28222e]"
                  : "border-[#ececf1] text-[#56505c] hover:border-[#ddd7df]"
              }`}
            >
              <span
                className={`flex size-4 shrink-0 items-center justify-center rounded-full border ${
                  reason === item.id ? "border-[#28222e] bg-[#28222e]" : "border-[#ddd7df]"
                }`}
              >
                {reason === item.id && <Check className="size-2.5 text-white" />}
              </span>
              {item.label}
            </button>
          ))}
        </div>

        <label className="mt-3.5 block">
          <span className="text-[12px] font-semibold text-[#6d6675]">Anything else? (optional)</span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={2}
            placeholder="What would have made you stay?"
            className="mt-1.5 w-full resize-none rounded-xl border border-[#ececf1] px-3.5 py-2.5 text-[13px] text-[#28222e] outline-none transition placeholder:text-[#7b7480] focus:border-[#ddd7df]"
          />
        </label>

        <p className="mt-4 rounded-xl bg-[#faf9fb] px-3.5 py-3 text-[12px] leading-[1.55] text-[#7b7480]">
          Top-up credits you already paid for aren&apos;t lost — they&apos;re frozen with the subscription and come back
          when you start a plan again, within their 12-month window. Nothing is deleted by cancelling, and you can undo
          this any time before {nextBill}.
        </p>

        <div className="mt-5 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl px-4 text-[13px] font-semibold text-[#6d6675] transition hover:text-[#56505c]"
          >
            Keep {plan.name}
          </button>
          <button
            type="button"
            disabled={!reason}
            onClick={() => {
              // 理由进 Activity Log —— 一年后回看流失原因得有据可查
              cancelPlan(note.trim() ? `${chosen?.label} — ${note.trim()}` : chosen?.label);
              onClose();
            }}
            className="h-11 rounded-xl bg-[#c9432a] px-5 text-[13px] font-bold text-white transition hover:bg-[#b23a1c] disabled:cursor-not-allowed disabled:opacity-35"
          >
            Cancel subscription
          </button>
        </div>
      </div>
    </div>
  );
}

/** 加席位 —— 从账单页的 Manage seats 打开,和参考稿一致 */
function SeatsModal({ onClose }: { onClose: () => void }) {
  const { seatsUsed, seatsTotal, addSeats, plan, seatRoom, changePlan, openSettings } = useTeam();
  const [delta, setDelta] = useState(1);
  /* Team 撞到 9 席就没得加了 —— 上面还有 Scale,所以出口是升档而不是买第 10 席 */
  const mustUpgrade = plan.beyondMax === "upgrade" && seatRoom === 0;
  /* Scale 是自助档的顶,超过 30 席还能按每席价买,但那时候谈 Enterprise 更划算 */
  const pastCap = plan.beyondMax === "buy-seats" && seatsTotal + delta > plan.seatsMax;
  const maxDelta = Number.isFinite(seatRoom) ? Math.max(1, seatRoom) : 20;
  const panelRef = useRef<HTMLDivElement>(null);
  useDialog({ ref: panelRef, onClose });

  return (
    <div
      className="fixed inset-x-0 bottom-0 top-[52px] z-[95] grid place-items-center bg-[#1a1a2e]/45 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Manage seats"
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className="w-full max-w-[460px] rounded-[24px] border border-[#ececf1] bg-white p-6 shadow-[0_30px_80px_rgba(26,26,46,0.28)] outline-none"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[18px] font-bold tracking-[-0.02em] text-[#28222e]">Manage seats</h2>
            <p className="mt-1 text-[13px] text-[#6d6675]">
              ${seatPriceOf(plan)} per seat / month, prorated. Billing admins don&apos;t use a seat.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-9 shrink-0 place-items-center rounded-xl text-[#8a8490] transition hover:bg-[#f6f4f7] hover:text-[#28222e]"
          >
            <X className="size-[18px]" />
          </button>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <div className="flex h-11 items-center rounded-xl border border-[#ececf1]">
            <button
              type="button"
              aria-label="Fewer seats"
              onClick={() => setDelta((n) => Math.max(1, n - 1))}
              className="grid h-full w-10 place-items-center text-[#6d6675] hover:text-[#3b3442]"
            >
              −
            </button>
            <span className="w-10 text-center text-[15px] font-bold tabular-nums text-[#28222e]">{delta}</span>
            <button
              type="button"
              aria-label="More seats"
              onClick={() => setDelta((n) => Math.min(maxDelta, n + 1))}
              className="grid h-full w-10 place-items-center text-[#6d6675] hover:text-[#3b3442]"
            >
              +
            </button>
          </div>
          <span className="text-[13px] font-semibold text-[#7b7480]">
            +{delta} seat{delta > 1 ? "s" : ""} · ${delta * seatPriceOf(plan)}/mo · {seatsUsed}/{seatsTotal} now
          </span>
        </div>

        {mustUpgrade && (
          <p className="mt-4 flex items-start gap-2 rounded-xl border border-[#f2d5cd] bg-[#fff5f1] px-4 py-3 text-[12.5px] leading-[1.55] text-[#b23a1c]">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>
              {plan.name} tops out at {plan.seatsMax} seats and you are already there. Seats can&apos;t be bought past
              the cap — move up to Scale to keep adding people.
            </span>
          </p>
        )}

        {pastCap && (
          <p className="mt-4 flex items-start gap-2 rounded-xl border border-[#ffd9c6] bg-[#fff7f2] px-4 py-3 text-[12.5px] leading-[1.55] text-[#8a4b2a]">
            <Info className="mt-0.5 size-4 shrink-0" />
            <span>
              You&apos;re going past {plan.name}&apos;s {plan.seatsMax} included seats. Extra seats are billed at $
              {seatPriceOf(plan)} each — at this size an Enterprise contract usually costs less per seat. Talk to sales
              before you buy a batch.
            </span>
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2.5">
          <button type="button" onClick={onClose} className="h-11 rounded-xl px-4 text-[13px] font-semibold text-[#6d6675] hover:text-[#56505c]">
            Cancel
          </button>
          {mustUpgrade ? (
            <button
              type="button"
              onClick={() => {
                changePlan("scale");
                openSettings("billing");
                onClose();
              }}
              className="h-11 rounded-xl bg-[#24202a] px-5 text-[13px] font-bold text-white transition hover:bg-[#3b3442]"
            >
              Move up to Scale
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                addSeats(delta);
                onClose();
              }}
              className="h-11 rounded-xl bg-[#24202a] px-5 text-[13px] font-bold text-white transition hover:bg-[#3b3442]"
            >
              Add {delta} seat{delta > 1 ? "s" : ""}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================ Shell ============================ */

export function TeamSettingsModal() {
  const { settingsOpen, closeSettings, openSettings, team, isPersonal, role, memberCount, canSeeActivity, can, levelOf } =
    useTeam();
  const joinedCount = memberCount(team.id);
  const panelRef = useRef<HTMLDivElement>(null);

  // Finance 没有产品权限,只看 Billing;Activity 只给能管人管钱的角色
  const tabs = (
    role === "finance"
      ? ALL_TABS.filter(
          (t) =>
            t.key === "credits" ||
            t.key === "analytics" ||
            t.key === "topup" ||
            t.key === "billing" ||
            t.key === "activity",
        )
      : isPersonal
        ? ALL_TABS.filter((t) => t.key !== "members")
        : /*
           * Top-up 的可见性走权限表里的 Top-up 域(2026-08-25 起),
           * 不再写死给 Owner —— 之前是硬编码,于是权限表说「每个域都可配」,
           * 这一项却配不了。现在 Owner 与 Admin 默认都能买,想收就在权限页收。
           */
          ALL_TABS.filter((t) => t.key !== "topup" || can("credits.buy"))
  )
    .filter((t) => t.key !== "activity" || canSeeActivity)
    /*
     * Permissions 与 Billing 跟着权限表里对应的域走(2026-08-25)。
     *
     * 之前这两页对 Member 是「进得去、但只读」。问题是**只读也在泄露东西**:
     * 权限页把整张矩阵摊开给他看,账单页把套餐、单价、席位占用、余额都摊开给他看 ——
     * 而权限表里这两个域对 Member 的默认值本来就是 No access。
     * 「能看见但改不了」和「不该看见」是两回事,这里是后者,所以整页不出现在导航里。
     *
     * 不是写死 role !== "member":权限表是可配的,Owner 想把 Billing 开成 Can view 就该看得见。
     */
    .filter((t) => t.key !== "permissions" || isPersonal || levelOf("permissions") !== "none")
    .filter((t) => t.key !== "billing" || isPersonal || role === "finance" || levelOf("billing") !== "none")
    // 安全设置是组织级配置 —— 只给 Owner / Admin,个人账户没有这回事
    .filter((t) => t.key !== "security" || (!isPersonal && (role === "owner" || role === "admin")));
  const requested = settingsOpen === false ? "general" : settingsOpen;
  /*
   * 兜底页要按角色选,不能一律取 tabs[0]。
   * Billing Admin 来这儿只为发票,而 tabs[0] 是 Credits —— 他每次都得多点一次。
   */
  const fallback: Tab = role === "finance" ? "billing" : tabs[0]!.key;
  const active: Tab = tabs.some((t) => t.key === requested)
    ? (requested as Tab)
    : tabs.some((t) => t.key === fallback)
      ? fallback
      : tabs[0]!.key;

  // Esc 关闭 + 背景锁滚 + 焦点陷阱,全部收在 useDialog 里
  useDialog({ ref: panelRef, onClose: closeSettings, active: settingsOpen !== false });

  if (settingsOpen === false) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 top-[52px] z-[80] grid place-items-center bg-[#1a1a2e]/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Team settings">
      <div
        ref={panelRef}
        tabIndex={-1}
        className="flex h-[calc(100vh-96px)] max-h-[960px] w-full max-w-[1440px] overflow-hidden rounded-[24px] border border-[#ececf1] bg-white shadow-[0_30px_80px_rgba(26,26,46,0.28)] outline-none"
      >
        <aside className="hidden w-[280px] shrink-0 flex-col border-r border-[#f0eef2] bg-[#faf9fb] p-5 sm:flex">
          <div className="flex items-center gap-2 px-1 pb-4">
            <TeamAvatar team={team} size={30} />
            <span className="min-w-0 truncate text-[13px] font-bold text-[#28222e]">{team.name}</span>
            {/* 名称后面点明这是个人还是团队,和身份菜单同一枚徽章 */}
            <ScopeBadge personal={!!team.personal} />
          </div>
          {/*
            * 分组渲染 —— 只渲染当前角色看得到的项,某一组全被过滤掉就整组不出现
            * (Billing Admin 看不到 Team 那一组,标题也不该留在那儿)。
            */}
          <nav className="grid gap-5">
            {TAB_GROUPS.map((group) => {
              const items = group.keys
                .map((key) => tabs.find((t) => t.key === key))
                .filter((t): t is (typeof ALL_TABS)[number] => Boolean(t));
              if (items.length === 0) return null;
              return (
                <div key={group.title}>
                  <p className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-[0.06em] text-[#9a94a0]">
                    {group.title}
                  </p>
                  <div className="grid gap-1">
                    {items.map(({ key, label, icon: Icon }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => openSettings(key)}
                        aria-current={active === key ? "page" : undefined}
                        className={`flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-left text-[13px] outline-none transition focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/25 ${
                          active === key
                            ? "bg-[#fff0ea] font-bold text-[#ee6545]"
                            : "font-semibold text-[#706a78] hover:bg-[#f2f0f4]"
                        }`}
                      >
                        <Icon className="size-4 shrink-0" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </nav>

        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-start justify-between gap-3 border-b border-[#f0eef2] px-6 py-4">
            <div className="min-w-0">
              <h2 className="flex items-baseline gap-2 text-[17px] font-bold tracking-[-0.02em] text-[#28222e]">
                {tabs.find((t) => t.key === active)?.label}
                {active === "members" && (
                  <span className="text-[14px] font-medium text-[#6d6675]">· {joinedCount} {joinedCount === 1 ? "member" : "members"}</span>
                )}
              </h2>
              {active === "billing" && !isPersonal && (
                <p className="mt-0.5 text-[12px] text-[#6d6675]">
                  Billing applies to {team.name}. Switching teams switches the billing context.
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={closeSettings}
              aria-label="Close team settings"
              className="grid size-9 place-items-center rounded-xl text-[#8a8490] transition hover:bg-[#f6f4f7] hover:text-[#28222e]"
            >
              <X className="size-[18px]" />
            </button>
          </header>
          <div className="flex gap-1 border-b border-[#f0eef2] px-4 py-2 sm:hidden">
            {tabs.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => openSettings(key)}
                className={`rounded-lg px-3 py-1.5 text-[13px] font-semibold transition ${active === key ? "bg-[#fff0ea] text-[#ee6545]" : "text-[#706a78]"}`}
              >
                {label}
              </button>
            ))}
          </div>
          {/* 评审第四节第 1 项:pb-10 给最后一行留余量(之前成员列表末行会被弹窗下边缘裁掉),
              底部渐隐则是「还能往下滚」的提示 */}
          <div className="relative min-h-0 flex-1">
            <div className="h-full overflow-y-auto px-6 pb-10 pt-6">
              {/* 大弹窗里内容不拉满:表单类页签夹到 760px,表格类页签给到 1040px */}
              {/*
                 * 内容宽度:默认不设上限,与 Members / Permissions / Analytics 一致 ——
                 * 它们都要横向空间,General 现在页首是两栏对开卡片,同样吃得下。
                 * 只有 top-up(套餐网格)与 security(单列表单)留上限:
                 * 再宽只会把输入框拉长,不增加任何信息。
                 */}
              <div
                className={`mx-auto w-full ${
                  active === "topup" ? "max-w-[960px]" : active === "security" ? "max-w-[760px]" : "max-w-full"
                }`}
              >
              {active === "general" && <GeneralTab />}
              {active === "members" && <MembersTab />}
              {active === "permissions" && <PermissionsTab />}
              {active === "security" && <SecurityTab />}
              {active === "credits" && <CreditsTab />}
              {active === "analytics" && <AnalyticsTab />}
              {/* 自动充值已并入 Billing 的 Credits balance 卡 —— 这里只留买包 */}
              {active === "topup" && <TopUpTabPanel />}
              {active === "billing" && <BillingTab />}
              {active === "activity" && <ActivityTab />}
              </div>
            </div>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const CARD_BRANDS: CardBrand[] = ["Visa", "Mastercard", "Amex"];
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => index + 1);
const YEAR_OPTIONS = Array.from({ length: 10 }, (_, index) => 2026 + index);
const pad2 = (value: number) => String(value).padStart(2, "0");

/** 卡是不是已经过期 / 快过期 —— 用原型里那条固定时间线的「今天」判断,不碰 Date */
function cardExpiryState(card: PaymentMethod): "ok" | "soon" | "expired" {
  const monthsLeft = (card.expYear - TODAY_STAMP.y) * 12 + (card.expMonth - TODAY_STAMP.m);
  if (monthsLeft < 0) return "expired";
  if (monthsLeft <= 2) return "soon";
  return "ok";
}

/**
 * 支付方式 —— 多张卡、可更新有效期、必须有且只有一张默认。
 *
 * 关键规则(2026-08-25 定):**有活跃订阅时,最后一张卡不能删。**
 * 换卡的正确路径是「先加新卡再删旧卡」,多一步,但换来的是不可能把自己锁死。
 * 想彻底停付款的路径是取消订阅,不是删卡。
 */
function PaymentMethodsCard() {
  const {
    paymentMethods,
    addPaymentMethod,
    updatePaymentMethod,
    setDefaultPaymentMethod,
    removePaymentMethod,
    cardRemovalBlock,
  } = useTeam();
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  const card = "rounded-2xl border border-[#ececf1] bg-white";
  const ghostBtn =
    "h-9 shrink-0 rounded-xl border border-[#ececf1] px-3.5 text-[13px] font-bold text-[#3b3442] transition hover:border-[#ddd7df] hover:bg-[#faf9fb]";

  return (
    <section className={`${card} p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[14px] font-bold text-[#28222e]">Payment methods</p>
          <p className="mt-1 text-[12px] text-[#7b7480]">
            The default card is charged for renewals, seats and top-ups. Cards stay with the team if ownership changes.
          </p>
        </div>
        <button type="button" onClick={() => setAddOpen(true)} className={ghostBtn}>
          Add card
        </button>
      </div>

      <div className="mt-4 space-y-2.5">
        {paymentMethods.map((method) => {
          const block = cardRemovalBlock(method.id);
          const expiry = cardExpiryState(method);
          return (
            <div key={method.id} className="rounded-xl border border-[#f0eef2] px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                <span className="flex min-w-0 items-center gap-2.5">
                  <CreditCard className="size-4 shrink-0 text-[#8a8490]" />
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-[13.5px] font-bold text-[#28222e]">
                        {method.brand} ending {method.last4}
                      </span>
                      {method.isDefault && (
                        <span className="rounded-md bg-[#e7f5ee] px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-[#12734f]">
                          Default
                        </span>
                      )}
                      {expiry === "expired" && (
                        <span className="rounded-md bg-[#fff1ec] px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-[#c9432a]">
                          Expired
                        </span>
                      )}
                      {expiry === "soon" && (
                        <span className="rounded-md bg-[#fff3ec] px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-[#e07a3a]">
                          Expires soon
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-[12px] tabular-nums text-[#7b7480]">
                      Expires {pad2(method.expMonth)}/{method.expYear}
                    </span>
                  </span>
                </span>

                <span className="flex shrink-0 items-center gap-3">
                  {!method.isDefault && (
                    <button
                      type="button"
                      onClick={() => setDefaultPaymentMethod(method.id)}
                      className="text-[12px] font-bold text-[#3b3442] transition hover:text-[#28222e]"
                    >
                      Make default
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setEditing(editing === method.id ? null : method.id)}
                    aria-expanded={editing === method.id}
                    className="text-[12px] font-bold text-[#3b3442] transition hover:text-[#28222e]"
                  >
                    Update
                  </button>
                  {/*
                    * 拦住的时候按钮**留在原地**但禁用,并把原因挂上去 ——
                    * 直接把按钮藏掉会让人以为「这张卡不能删」是个 bug,而不是一条规则。
                    */}
                  <button
                    type="button"
                    disabled={Boolean(block)}
                    title={block ?? undefined}
                    onClick={() => removePaymentMethod(method.id)}
                    className={`text-[12px] font-bold transition ${
                      block ? "cursor-not-allowed text-[#c4bfc9]" : "text-[#6d6675] hover:text-[#d92d20]"
                    }`}
                  >
                    Remove
                  </button>
                </span>
              </div>

              {block && (
                <p className="mt-2 text-[11.5px] leading-snug text-[#8a8490]">
                  {block} To stop paying altogether, cancel the subscription instead.
                </p>
              )}

              {editing === method.id && (
                <CardExpiryEditor
                  method={method}
                  onCancel={() => setEditing(null)}
                  onSave={(patch) => {
                    updatePaymentMethod(method.id, patch);
                    setEditing(null);
                  }}
                />
              )}
            </div>
          );
        })}

        {paymentMethods.length === 0 && (
          <p className="rounded-xl border border-dashed border-[#e6e2ea] px-3.5 py-3 text-[12px] text-[#6d6675]">
            No card on file.
          </p>
        )}
      </div>

      {addOpen && <AddCardModal onClose={() => setAddOpen(false)} onAdd={addPaymentMethod} hasCards={paymentMethods.length > 0} />}
    </section>
  );
}

/**
 * 只改有效期,不改卡号。
 * 真实实现里卡号是 Stripe 的 token,产品侧根本拿不到也改不了 ——
 * 「换一张卡」在系统里就是「加一张新卡」,所以这里刻意只暴露有效期。
 */
function CardExpiryEditor({
  method,
  onSave,
  onCancel,
}: {
  method: PaymentMethod;
  onSave: (patch: { expMonth: number; expYear: number }) => void;
  onCancel: () => void;
}) {
  const [month, setMonth] = useState(method.expMonth);
  const [year, setYear] = useState(method.expYear);
  const dirty = month !== method.expMonth || year !== method.expYear;

  return (
    <div className="mt-3 border-t border-[#f4f2f6] pt-3">
      <p className="text-[12px] text-[#6d6675]">
        Card numbers can&apos;t be edited. To use a different card, add it and make it the default.
      </p>
      <div className="mt-2.5 flex flex-wrap items-end gap-2.5">
        <label className="min-w-0">
          <span className="block text-[12px] text-[#6d6675]">Expiry month</span>
          <Dropdown
            value={String(month)}
            onChange={(next) => setMonth(Number(next))}
            options={MONTH_OPTIONS.map((value) => ({ value: String(value), label: pad2(value) }))}
          />
        </label>
        <label className="min-w-0">
          <span className="block text-[12px] text-[#6d6675]">Expiry year</span>
          <Dropdown
            value={String(year)}
            onChange={(next) => setYear(Number(next))}
            options={YEAR_OPTIONS.map((value) => ({ value: String(value), label: String(value) }))}
          />
        </label>
        <button
          type="button"
          disabled={!dirty}
          onClick={() => onSave({ expMonth: month, expYear: year })}
          className={`h-9 rounded-xl px-3.5 text-[12.5px] font-bold transition ${
            dirty ? "bg-[#24202a] text-white hover:bg-[#3b3442]" : "cursor-not-allowed bg-[#f1eff3] text-[#a9a3b0]"
          }`}
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="h-9 rounded-xl border border-[#ececf1] px-3.5 text-[12.5px] font-bold text-[#3b3442] transition hover:bg-[#faf9fb]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/**
 * 加卡。
 *
 * 原型里不收真实卡号 —— 只要末四位就够把「多卡管理」这件事演完,
 * 而一个假的卡号输入框反而会让评审现场纠结「这是不是要接 Stripe Elements」。
 * 真实实现这里是 Stripe Elements,产品侧永远拿不到完整卡号。
 */
function AddCardModal({
  onClose,
  onAdd,
  hasCards,
}: {
  onClose: () => void;
  onAdd: (card: { brand: CardBrand; last4: string; expMonth: number; expYear: number; makeDefault: boolean }) => void;
  hasCards: boolean;
}) {
  const [brand, setBrand] = useState<CardBrand>("Visa");
  const [last4, setLast4] = useState("");
  const [month, setMonth] = useState(12);
  const [year, setYear] = useState(2029);
  const [makeDefault, setMakeDefault] = useState(!hasCards);
  const valid = /^\d{4}$/.test(last4);
  const panelRef = useRef<HTMLDivElement>(null);
  useDialog({ ref: panelRef, onClose });

  return (
    <div
      className="fixed inset-x-0 bottom-0 top-[52px] z-[95] grid place-items-center bg-[#1a1a2e]/45 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Add a card"
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className="max-h-full w-full max-w-[440px] overflow-y-auto rounded-[24px] border border-[#ececf1] bg-white p-6 shadow-[0_30px_80px_rgba(26,26,46,0.28)] outline-none"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[18px] font-bold tracking-[-0.02em] text-[#28222e]">Add a card</h2>
            <p className="mt-1 text-[13px] leading-snug text-[#6d6675]">
              In the real product this is a secure card form — card details never touch our servers.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-9 shrink-0 place-items-center rounded-xl text-[#8a8490] transition hover:bg-[#f6f4f7] hover:text-[#28222e]"
          >
            <X className="size-[18px]" />
          </button>
        </div>

      <label className="mt-4 block">
        <span className="block text-[13px] font-semibold text-[#3b3442]">Brand</span>
        <div className="mt-2">
          <Dropdown
            value={brand}
            onChange={(next) => setBrand(next as CardBrand)}
            options={CARD_BRANDS.map((value) => ({ value, label: value }))}
          />
        </div>
      </label>

      <label className="mt-4 block">
        <span className="block text-[13px] font-semibold text-[#3b3442]">Last 4 digits</span>
        <input
          value={last4}
          onChange={(event) => setLast4(event.target.value.replace(/\D/g, "").slice(0, 4))}
          inputMode="numeric"
          placeholder="4242"
          className="mt-2 h-11 w-full rounded-xl border border-[#e6e2ea] px-3.5 text-[14px] tabular-nums text-[#28222e] outline-none transition focus:border-[#c9c2d2]"
        />
      </label>

      <div className="mt-4 flex flex-wrap gap-2.5">
        <label className="min-w-0 flex-1">
          <span className="block text-[13px] font-semibold text-[#3b3442]">Expiry month</span>
          <div className="mt-2">
            <Dropdown
              value={String(month)}
              onChange={(next) => setMonth(Number(next))}
              options={MONTH_OPTIONS.map((value) => ({ value: String(value), label: pad2(value) }))}
            />
          </div>
        </label>
        <label className="min-w-0 flex-1">
          <span className="block text-[13px] font-semibold text-[#3b3442]">Expiry year</span>
          <div className="mt-2">
            <Dropdown
              value={String(year)}
              onChange={(next) => setYear(Number(next))}
              options={YEAR_OPTIONS.map((value) => ({ value: String(value), label: String(value) }))}
            />
          </div>
        </label>
      </div>

      {/* 第一张卡必然是默认,勾选框没得选,所以直接说明而不是给一个禁用的勾选框 */}
      {hasCards ? (
        <label className="mt-4 flex items-start gap-2.5">
          <input
            type="checkbox"
            checked={makeDefault}
            onChange={(event) => setMakeDefault(event.target.checked)}
            className="mt-0.5 size-4 accent-[#24202a]"
          />
          <span className="text-[13px] leading-snug text-[#3b3442]">
            Charge this card from now on
            <span className="mt-0.5 block text-[12px] text-[#7b7480]">Renewals, seats and top-ups all follow the default card.</span>
          </span>
        </label>
      ) : (
        <p className="mt-4 rounded-xl bg-[#faf9fb] px-3.5 py-3 text-[12px] text-[#7b7480]">
          This is the first card on the team, so it becomes the default.
        </p>
      )}

      <div className="mt-5 flex justify-end gap-2.5">
        <button
          type="button"
          onClick={onClose}
          className="h-10 rounded-xl border border-[#ececf1] px-4 text-[13px] font-bold text-[#3b3442] transition hover:bg-[#faf9fb]"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!valid}
          onClick={() => {
            onAdd({ brand, last4, expMonth: month, expYear: year, makeDefault });
            onClose();
          }}
          className={`h-10 rounded-xl px-4 text-[13px] font-bold transition ${
            valid ? "bg-[#24202a] text-white hover:bg-[#3b3442]" : "cursor-not-allowed bg-[#f1eff3] text-[#a9a3b0]"
          }`}
        >
          Add card
        </button>
        </div>
      </div>
    </div>
  );
}
