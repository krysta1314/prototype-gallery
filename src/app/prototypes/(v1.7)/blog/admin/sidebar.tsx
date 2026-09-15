"use client";

/* 后台侧栏。骨架与配色照 org-members 的 Admin Console 来,保证两个后台看起来是同一套。
   本次只复刻 Blog 那一组,其余分组是灰掉的占位,点不了。 */

import { FileText, FolderTree } from "lucide-react";

export type AdminView = "posts" | "categories";

const C = {
  brand: "#ff5e1a",
  brandSoft: "#fff3ec",
  brandDark: "#e04a0c",
  ink: "#0F172A",
  ink2: "#475569",
  ink3: "#8494A8",
  line: "#E7ECF2",
} as const;

const CARD_SHADOW = "0 1px 2px rgba(15,23,42,.05), 0 8px 24px -18px rgba(15,23,42,.28)";

const NAV_GROUPS: {
  title: string;
  items: { label: string; icon: typeof FileText; view?: AdminView }[];
}[] = [
  {
    title: "Blog management",
    items: [
      { label: "Blog Categories", icon: FolderTree, view: "categories" },
      { label: "Blog Posts", icon: FileText, view: "posts" },
    ],
  },
];

export function AdminSidebar({
  view,
  onGoto,
}: {
  view: AdminView;
  onGoto: (v: AdminView) => void;
}) {
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
        <div key={g.title} className="px-3 pb-0.5 pt-3.5">
          <h6
            className="mb-1.5 ml-2 text-[9.5px] font-bold uppercase tracking-[0.09em]"
            style={{ color: C.ink3 }}
          >
            {g.title}
          </h6>
          {g.items.map((it) => {
            const on = it.view === view;
            const Icon = it.icon;
            return (
              <button
                key={it.label}
                type="button"
                onClick={() => it.view && onGoto(it.view)}
                className="mb-px flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-left text-[12.5px] transition-colors hover:bg-[#F1F5F9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/25"
                style={{
                  background: on ? C.brandSoft : "transparent",
                  color: on ? C.brandDark : C.ink2,
                  fontWeight: on ? 600 : 400,
                }}
              >
                <Icon size={14} className="shrink-0 opacity-85" />
                <span className="truncate">{it.label}</span>
              </button>
            );
          })}
        </div>
      ))}
      <div className="h-6" />
    </aside>
  );
}
