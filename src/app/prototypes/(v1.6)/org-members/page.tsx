"use client";

import { Mail, Tag as TagIcon, Target, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MemberDetail } from "./_components/MemberDetail";
import { MembersTable } from "./_components/MembersTable";
import { BudgetModal, ExportModal, InviteModal, TopupModal } from "./_components/Modals";
import { ProjectTags } from "./_components/ProjectTags";
import { APPLE_FONT, C, CARD_SHADOW } from "./_components/ui";
import { buildRows } from "./_lib/agg";
import { memberByEmail } from "./_lib/seed";
import type {
  GenFilter,
  MemberWithUsage,
  ModalKind,
  Override,
  PeriodKey,
  SortKey,
  StatusFilter,
  TabKey,
  ViewKey,
} from "./_lib/types";

type Modal = { kind: ModalKind; email?: string };

export default function OrgMembersPage() {
  const [view, setView] = useState<ViewKey>("members");
  const [period, setPeriod] = useState<PeriodKey>("30");
  const [sort, setSort] = useState<SortKey>("usd");
  const [dir, setDir] = useState(-1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("active+");
  const [memberEmail, setMemberEmail] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("gen");
  const [genFilter, setGenFilter] = useState<GenFilter>("all");
  const [modal, setModal] = useState<Modal | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  /** Adjust budget 写入的那一层;所有读 budget 的地方都过它 */
  const [overrides, setOverrides] = useState<Record<string, Override>>({});
  const budgetOf = useMemo(
    () => (m: MemberWithUsage) =>
      overrides[m.email] ?? { budget: m.budget, isOverride: m.override },
    [overrides],
  );

  const rows = useMemo(
    () => buildRows({ period, status, q, sort, dir, budgetOf }),
    [period, status, q, sort, dir, budgetOf],
  );

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const member = memberEmail ? memberByEmail(memberEmail) : null;

  const onSort = (k: SortKey) => {
    if (sort === k) setDir((d) => -d);
    else {
      setSort(k);
      setDir(k === "name" ? 1 : -1);
    }
  };

  const openMember = (email: string) => {
    setMemberEmail(email);
    setTab("gen");
    setGenFilter("all");
    setView("detail");
    window.scrollTo(0, 0);
  };

  const goto = (v: ViewKey) => {
    setView(v);
    window.scrollTo(0, 0);
  };

  const crumb =
    view === "members"
      ? "Members"
      : view === "detail"
        ? `Members › ${member?.name ?? ""}`
        : "Project Tags";

  return (
    <div className="flex min-h-screen" style={{ fontFamily: APPLE_FONT, background: C.bg }}>
      <Sidebar view={view} onGoto={goto} />

      <div className="min-w-0 flex-1">
        <div
          className="sticky top-0 z-20 flex h-14 items-center gap-2 bg-white px-5"
          style={{ borderBottom: `1px solid ${C.line}` }}
        >
          <span className="text-[12.5px]" style={{ color: C.ink3 }}>
            PL 內部用戶管理 › <b style={{ color: C.ink }}>{crumb}</b>
          </span>
          <div className="ml-auto flex min-w-0 items-center gap-2.5">
            <div
              className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
              style={{ background: C.brandSoft, color: C.brand }}
            >
              M
            </div>
            <span
              className="truncate text-[13px]"
              style={{ color: C.ink2, maxWidth: 200 }}
              title="monica.zhou@presslogic.com"
            >
              monica.zhou@presslogic.com
            </span>
          </div>
        </div>

        <div className="p-5" style={{ color: C.ink }}>
          {view === "members" && (
            <MembersTable
              rows={rows}
              period={period}
              sort={sort}
              dir={dir}
              q={q}
              status={status}
              onPeriod={setPeriod}
              onSort={onSort}
              onQ={setQ}
              onStatus={setStatus}
              onOpenMember={openMember}
              onOpenModal={(kind, email) => setModal({ kind, email })}
              onGoProjects={() => goto("projects")}
            />
          )}

          {view === "detail" && member && (
            <MemberDetail
              m={member}
              budget={budgetOf(member).budget}
              isOverride={budgetOf(member).isOverride}
              period={period}
              tab={tab}
              genFilter={genFilter}
              onPeriod={setPeriod}
              onTab={setTab}
              onGenFilter={setGenFilter}
              onBack={() => goto("members")}
              onOpenModal={(kind, email) => setModal({ kind, email })}
            />
          )}

          {view === "projects" && <ProjectTags period={period} onPeriod={setPeriod} />}
        </div>
      </div>

      {modal?.kind === "budget" && modal.email && (
        <BudgetModal
          m={memberByEmail(modal.email)}
          current={budgetOf(memberByEmail(modal.email))}
          onClose={() => setModal(null)}
          onSave={(o) => {
            const email = modal.email!;
            setOverrides((prev) => ({ ...prev, [email]: o }));
            setModal(null);
            setToast(
              o.isOverride
                ? `${memberByEmail(email).name} — monthly limit set to ${o.budget.toLocaleString("en-US")} cr`
                : `${memberByEmail(email).name} — back to the organisation default`,
            );
          }}
        />
      )}
      {modal?.kind === "invite" && <InviteModal onClose={() => setModal(null)} />}
      {modal?.kind === "topup" && modal.email && (
        <TopupModal m={memberByEmail(modal.email)} onClose={() => setModal(null)} />
      )}
      {modal?.kind === "export" && (
        <ExportModal period={period} onClose={() => setModal(null)} />
      )}

      {toast && (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-lg px-3.5 py-2.5 text-[12px] font-semibold text-white"
          style={{ background: C.ink, boxShadow: "0 12px 30px -12px rgba(15,23,42,.6)" }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

/* ---------- 侧栏 ---------- */

const NAV_GROUPS: {
  title: string;
  items: { label: string; icon: typeof Users; view?: ViewKey; badge?: boolean }[];
}[] = [
  {
    title: "PL 內部用戶管理",
    items: [
      { label: "Members", icon: Users, view: "members", badge: true },
      { label: "Budget Policy", icon: Target, badge: true },
      { label: "Project Tags", icon: TagIcon, view: "projects", badge: true },
      { label: "Invitations", icon: Mail, badge: true },
    ],
  },
];

function Sidebar({ view, onGoto }: { view: ViewKey; onGoto: (v: ViewKey) => void }) {
  const activeView: ViewKey = view === "detail" ? "members" : view;
  return (
    <aside
      className="sticky top-0 hidden h-screen w-[236px] shrink-0 overflow-y-auto bg-white lg:block"
      style={{ borderRight: `1px solid ${C.line}` }}
    >
      <div
        className="flex items-center gap-2.5 px-[18px] py-4"
        style={{ borderBottom: `1px solid ${C.line}` }}
      >
        <div
          className="flex h-8 w-8 items-center justify-center rounded-[9px] text-[15px] font-bold text-white"
          style={{ background: "linear-gradient(135deg,#FFA73C,#FF5255)", boxShadow: CARD_SHADOW }}
        >
          B
        </div>
        <div>
          <b className="block text-[13.5px] tracking-tight" style={{ color: C.ink }}>
            Buzz Video
          </b>
          <span className="block text-[10.5px]" style={{ color: C.ink3 }}>
            Admin Console
          </span>
        </div>
      </div>

      {NAV_GROUPS.map((g) => (
        <div key={g.title} className="px-3 pt-3.5 pb-0.5">
          <h6
            className="mb-1.5 ml-2 text-[9.5px] font-bold tracking-[0.09em] uppercase"
            style={{ color: C.ink3 }}
          >
            {g.title}
          </h6>
          {g.items.map((it) => {
            const on = it.view && it.view === activeView;
            const disabled = !it.view;
            const Icon = it.icon;
            return (
              <button
                key={it.label}
                type="button"
                disabled={disabled}
                title={disabled ? "本次未复刻" : undefined}
                onClick={() => it.view && onGoto(it.view)}
                className={`mb-px flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-left text-[12.5px] transition-colors focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/25 focus-visible:outline-none ${
                  disabled ? "cursor-not-allowed opacity-45" : "hover:bg-[#F1F5F9]"
                }`}
                style={{
                  background: on ? C.brandSoft : "transparent",
                  color: on ? C.brandDark : C.ink2,
                  fontWeight: on ? 600 : 400,
                }}
              >
                <Icon size={14} className="shrink-0 opacity-85" />
                <span className="truncate">{it.label}</span>
                {it.badge && (
                  <span
                    className="ml-auto rounded px-[5px] py-px text-[8.5px] font-extrabold tracking-[0.05em] text-white"
                    style={{ background: on ? C.brand : "#CBD5E1" }}
                  >
                    NEW
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ))}
      <div className="h-6" />
    </aside>
  );
}
