"use client";

/* 后台侧栏。骨架与配色照 blog/admin 的 AdminSidebar 来,保证几个后台看起来是同一套。
   本次只有 Campaigns 一个视图,客户端预览用真链接跳出去。 */

import Link from "next/link";
import { Megaphone } from "lucide-react";

const C = {
  brandSoft: "#fff3ec",
  brandDark: "#e04a0c",
  ink: "#0F172A",
  ink2: "#475569",
  ink3: "#8494A8",
  line: "#E7ECF2",
} as const;

const CARD_SHADOW = "0 1px 2px rgba(15,23,42,.05), 0 8px 24px -18px rgba(15,23,42,.28)";

const ITEM =
  "mb-px flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-left text-[12.5px] transition-colors hover:bg-[#F1F5F9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/25";

function GroupTitle({ children }: { children: React.ReactNode }) {
  return (
    <h6
      className="mb-1.5 ml-2 text-[9.5px] font-bold uppercase tracking-[0.09em]"
      style={{ color: C.ink3 }}
    >
      {children}
    </h6>
  );
}

export type AdminView = "campaigns" | "codes";

const NAV = [
  { view: "campaigns" as const, label: "Campaign settings", icon: Megaphone, href: "/prototypes/promo-campaigns/admin" },
];

export function AdminSidebar({ view }: { view: AdminView }) {
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

      <div className="px-3 pb-0.5 pt-3.5">
        <GroupTitle>Promotion management</GroupTitle>
        {NAV.map((n) => {
          const Icon = n.icon;
          const on = n.view === view;
          return (
            <Link
              key={n.view}
              href={n.href}
              className={ITEM}
              style={
                on
                  ? { background: C.brandSoft, color: C.brandDark, fontWeight: 600 }
                  : { color: C.ink2 }
              }
            >
              <Icon size={14} className="shrink-0 opacity-85" />
              <span className="truncate">{n.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="h-6" />
    </aside>
  );
}
