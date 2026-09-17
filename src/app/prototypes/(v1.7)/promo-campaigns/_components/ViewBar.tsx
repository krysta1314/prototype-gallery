'use client';

/* 演示切换条 —— 不属于真实产品 UI,只给评审用,所以文案是中文。
   和 blog 那条同一套写法:顶部常规流,不 fixed,往下滚就让位给产品自己的顶栏。
   三个页面都挂,否则从客户端页回不到后台。 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const VIEWS = [
  { href: '/prototypes/promo-campaigns/admin', label: '活动后台' },
  { href: '/prototypes/promo-campaigns/home', label: '客户端首页(弹窗)' },
  { href: '/prototypes/promo-campaigns/pricing', label: '客户端定价页' },
] as const;

export function ViewBar() {
  const pathname = usePathname() ?? '';

  return (
    <div className="flex flex-wrap items-center gap-2.5 border-b border-[#e4e3ea] bg-white px-4 py-2.5 sm:px-6">
      <span className="mr-1 text-[12.5px] font-semibold text-[#8a8a99]">演示切换</span>
      <div className="flex gap-1 rounded-full bg-[#f1f0f5] p-0.5">
        {VIEWS.map(v => {
          const active = pathname.startsWith(v.href);
          return (
            <Link
              key={v.href}
              href={v.href}
              className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition ${
                active ? 'bg-[#141420] text-white' : 'text-[#6a6b7b] hover:text-[#141420]'
              }`}
            >
              {v.label}
            </Link>
          );
        })}
      </div>
      <span className="hidden text-[12.5px] text-[#9a9aa8] md:block">
        后台与客户端读同一份数据:在后台改活动,切到客户端立刻生效
      </span>
    </div>
  );
}
