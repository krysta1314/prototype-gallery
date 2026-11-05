"use client";

/* ai-tools 的顶栏:照真实产品,叠在白色内容面板顶部(absolute,高 56px;下面的滚动区 pt-14 让开)。
   右侧:Invite 按钮 + hybrid-reel 的 AccountCluster(积分 / 礼物 / 帮助 / 账号,不改共用的 shell.tsx)。
   md 以下(侧边栏隐藏)左边加菜单按钮 + logo,打开侧边栏抽屉;手机宽度(< sm)右边换成精简版:只留积分 + 头像,390px 不裁切。
   顶栏本身不挡点击(pointer-events-none),只有按钮可点,滚动内容从它下面经过也能操作。 */

import { Menu, UserPlus } from "lucide-react";
import { AccountCluster } from "@/app/prototypes/(v1.12)/hybrid-reel/agent/chat/shell";

export function ToolsTopBar({ credits, onMenu, onInvite }: { credits: number; onMenu?: () => void; onInvite?: () => void }) {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex h-14 items-center gap-2 px-4 sm:px-5 [&>*]:pointer-events-auto">
      {onMenu && (
        <button
          type="button"
          onClick={onMenu}
          aria-label="Open menu"
          aria-haspopup="dialog"
          className="-ml-1.5 grid size-10 place-items-center rounded-xl text-[#260B03] transition hover:bg-[#F5F5F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40 md:hidden"
        >
          <Menu className="size-5" />
        </button>
      )}
      {onMenu && (
        /* 侧边栏藏起来时顶栏带上 logo(官方 logo 原样引用) */
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/prototypes/ai-tools/logo.svg" alt="BuzzVideo AI" className="size-7 md:hidden" />
      )}
      <div className="ml-auto flex items-center gap-3 max-sm:hidden">
        <button
          type="button"
          onClick={onInvite}
          className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-[#E8E8E8] bg-white px-3 text-[12px] font-bold text-[#260B03] transition hover:bg-[#FAFBFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40"
        >
          <UserPlus className="size-3.5" strokeWidth={2.2} />
          Invite
        </button>
        <AccountCluster credits={credits} />
      </div>
      <div className="ml-auto flex items-center gap-2 sm:hidden">
        <span
          className="flex items-center gap-1.5 rounded-full border border-[#ffd2b8] bg-[#fff7f1] px-2.5 py-1 text-[13px] font-bold tabular-nums text-[#1a1a2e]"
          aria-label={`${credits.toLocaleString("en-US")} credits`}
        >
          <span className="size-3.5 rounded-full bg-gradient-to-r from-[#FFA73C] to-[#FF5255]" />
          {credits.toLocaleString("en-US")}
        </span>
        <span className="grid size-8 place-items-center rounded-full bg-[#1a1a2e] text-[12px] font-bold text-white" aria-label="Account">
          S
        </span>
      </div>
    </header>
  );
}
