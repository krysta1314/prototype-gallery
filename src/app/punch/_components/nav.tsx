"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, CalendarDays, Settings } from "lucide-react";

const ITEMS = [
  { href: "/punch", label: "打卡", icon: Clock },
  { href: "/punch/records", label: "记录", icon: CalendarDays },
  { href: "/punch/settings", label: "设置", icon: Settings },
];

export function PunchNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-neutral-200 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto flex max-w-md">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs ${
                active ? "text-neutral-900" : "text-neutral-400"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
