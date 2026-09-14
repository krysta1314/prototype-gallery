"use client";

/* 演示切换条 —— 不属于真实产品 UI,只给评审用,所以文案是中文。
   放在文档最顶部(不是 fixed),往下滚就让位给产品自己的顶栏。
   用浅色:落地页是纯黑底,深色条会糊在一起分不出这是演示工具还是产品的一部分。 */

import Link from "next/link";
import { usePathname } from "next/navigation";

const VIEWS = [
  { href: "/prototypes/blog", label: "Blog 落地页" },
  { href: "/prototypes/blog/admin", label: "Blog 发布后台" },
] as const;

export function DemoBar() {
  const pathname = usePathname() ?? "";
  const isAdmin = pathname.startsWith("/prototypes/blog/admin");

  return (
    <div className="flex flex-wrap items-center gap-2.5 border-b border-[#e4e3ea] bg-white px-4 py-2.5 sm:px-6">
      <span className="mr-1 text-[12.5px] font-semibold text-[#8a8a99]">演示切换</span>
      <div className="flex gap-1 rounded-full bg-[#f1f0f5] p-0.5">
        {VIEWS.map((v) => {
          const active = v.href === "/prototypes/blog/admin" ? isAdmin : !isAdmin;
          return (
            <Link
              key={v.href}
              href={v.href}
              className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition ${
                active
                  ? "bg-[#141420] text-white"
                  : "text-[#6a6b7b] hover:text-[#141420]"
              }`}
            >
              {v.label}
            </Link>
          );
        })}
      </div>
      <span className="hidden text-[12.5px] text-[#9a9aa8] md:block">
        后台与前台读同一份数据:在后台发布 / 下线 / 改标题,切回落地页立刻生效
      </span>
    </div>
  );
}
