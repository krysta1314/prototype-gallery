"use client";

/* 产品侧边栏(浅色,照真实产品):Buzz logo + BuzzVideo AI → Home / Marketing Agent / Canvas / 3D Studio
   → 分隔线 → 四个新模块 Image › / Video › / Audio › / Avatar ›(参照竞品)→ 分隔线 → Assets。
   悬停或点击模块 → 右侧弹出白底菜单(图标 + 名称,分隔线分组);每项三选一(sidebarMenus 的 menuAction):有页面的工具(TOOLS)进工具页,
   通用模型的项跳 Marketing Agent(名字后的紫色小标签「✦ Agent」,onAgent),其余出「Coming soon」toast。
   去哪儿由外壳(ProductApp)决定:导航和 Upscale Image 都走 onNav,侧边栏自己不跳路由(评审原型里要留在同一页)。
   键盘:模块上 Enter / Space / → 打开并聚焦第一项;菜单里 ↑↓ / Home / End 移动,Esc / ← 收起回到模块,Tab 离开即收起。
   宽屏(lg+)是完整侧边栏(260px,底部带邀请卡);md–lg 收成 60px 图标栏(菜单照样弹);md 以下隐藏,改由顶栏菜单按钮打开抽屉(MobileNavDrawer,模块在抽屉里是手风琴)。
   浮层用 absolute 挂在 aside 上(不用 fixed):评审原型的产品区有 transform,fixed 会错位。 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ComponentType } from "react";
import {
  AudioLines,
  AudioWaveform,
  Box,
  Brush,
  Camera,
  Captions,
  ChevronRight,
  CircleUserRound,
  Drama,
  Eraser,
  Expand,
  FolderOpen,
  Frame,
  Gift,
  House,
  Image as ImageIcon,
  ImagePlay,
  ImageUpscale,
  Languages,
  LetterText,
  Lightbulb,
  Link as LinkIcon,
  MessageSquareText,
  Mic,
  MonitorUp,
  Music,
  Package,
  PersonStanding,
  Proportions,
  Repeat2,
  Rotate3d,
  ScanFace,
  Scissors,
  Shirt,
  Smile,
  Sparkle,
  Sparkles,
  Speech,
  SquareDashed,
  Type,
  UserCog,
  UserRound,
  Video,
  Volume2,
  Clapperboard,
  ListPlus,
  MicVocal,
  Palette,
  type LucideProps,
} from "lucide-react";
import { COMING_SOON, MODULES, menuAction, moduleOf, type AgentJump, type MenuItem, type ModuleKey, type ToolKey } from "../sidebarMenus";

export type Icon = ComponentType<LucideProps>;

/** 侧边栏底部(仅 lg+):邀请好友活动卡 + 社媒图标,照真实产品;原型里点了出「Coming soon」 */
function SidebarPromo({ onNotice }: { onNotice: (text: string) => void }) {
  return (
    <div className="mt-3 hidden shrink-0 space-y-3 lg:block">
      <button
        type="button"
        onClick={() => onNotice(COMING_SOON)}
        className="relative flex min-h-[92px] w-full items-center overflow-hidden rounded-lg px-3.5 py-3 text-left shadow-sm outline-none transition hover:brightness-[1.02] focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40"
        style={{ background: "linear-gradient(135deg,#FFF7EC 0%,#FFE9D0 50%,#FFD7B3 100%)" }}
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-bold leading-snug text-[#260B03]">Invite Friends, Earn Rewards</span>
          <span className="mt-1 block text-[12px] font-semibold text-[#C73A1F]">1500 credits each</span>
        </span>
        <span className="relative shrink-0" aria-hidden="true">
          <Gift className="size-12 text-[#C73A1F]" strokeWidth={1.5} />
          <Sparkle className="absolute -right-1.5 -top-1 size-3.5 fill-[#FFB020] text-[#FFB020]" />
          <Sparkle className="absolute -left-2 bottom-1 size-2.5 fill-[#FFC94D] text-[#FFC94D]" />
        </span>
      </button>
      <div className="flex items-center gap-2 px-1" aria-label="Follow BuzzVideo">
        {SOCIALS.map(({ label, path }) => (
          <button
            key={label}
            type="button"
            title={label}
            aria-label={label}
            onClick={() => onNotice(COMING_SOON)}
            className="grid size-7 place-items-center rounded-full bg-[#260B03] text-white outline-none transition hover:bg-[#ff5e1a] focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40"
          >
            <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor" aria-hidden="true">
              <path d={path} />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}

/* 社媒图标(单色简化版,24 视窗) */
const SOCIALS = [
  { label: "TikTok", path: "M16.6 3c.3 2.2 1.6 3.6 3.9 3.8v3.1c-1.4.1-2.6-.3-3.9-1.1v5.9c0 4.6-4.4 6.9-7.9 5.1-2.6-1.3-3.6-4.6-2.2-7.2 1.1-2 3.3-3 5.5-2.6v3.2c-1.3-.4-2.8.2-3.2 1.5-.5 1.6.8 3.2 2.5 3 1.3-.1 2.2-1.2 2.2-2.6V3h3.1z" },
  { label: "Instagram", path: "M12 7.4a4.6 4.6 0 1 0 0 9.2 4.6 4.6 0 0 0 0-9.2zm0 7.5a2.9 2.9 0 1 1 0-5.8 2.9 2.9 0 0 1 0 5.8zM17.8 5.1a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2zM12 2.5c-2.6 0-2.9 0-3.9.1-3.5.2-5.4 2.1-5.6 5.6-.1 1-.1 1.3-.1 3.8s0 2.9.1 3.9c.2 3.5 2.1 5.4 5.6 5.6 1 .1 1.3.1 3.9.1s2.9 0 3.9-.1c3.5-.2 5.4-2.1 5.6-5.6.1-1 .1-1.3.1-3.9s0-2.9-.1-3.8c-.2-3.5-2.1-5.4-5.6-5.6-1-.1-1.3-.1-3.9-.1zm0 1.7c2.5 0 2.8 0 3.8.1 2.5.1 3.7 1.3 3.8 3.8.1 1 .1 1.3.1 3.8s0 2.8-.1 3.8c-.1 2.5-1.3 3.7-3.8 3.8-1 .1-1.3.1-3.8.1s-2.8 0-3.8-.1c-2.5-.1-3.7-1.3-3.8-3.8-.1-1-.1-1.3-.1-3.8s0-2.8.1-3.8c.1-2.5 1.3-3.7 3.8-3.8 1-.1 1.3-.1 3.8-.1z" },
  { label: "YouTube", path: "M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8zM10 15V9l5.2 3L10 15z" },
];
export const ICONS: Record<string, Icon> = {
  AudioLines, AudioWaveform, Brush, Camera, Captions, CircleUserRound, Drama, Eraser, Expand, Image: ImageIcon, ImagePlay, ImageUpscale, Languages,
  LetterText, Lightbulb, Link: LinkIcon, MessageSquareText, Mic, MonitorUp, Music, Package, PersonStanding, Proportions, Repeat2, Rotate3d,
  ScanFace, Scissors, Shirt, Smile, Speech, SquareDashed, Type, UserCog, UserRound, Video, Volume2,
  Box, Clapperboard, ListPlus, MicVocal, Palette,
};

export type NavKey = "home" | "agent" | "canvas" | "studio" | "assets";

/** 导航项,或一个有页面的工具(TOOLS 的 key) */
export type NavTarget = NavKey | ToolKey;

export const NAV: { key: NavKey; label: string; Icon: Icon }[] = [
  { key: "home", label: "Home", Icon: House },
  { key: "agent", label: "Marketing Agent", Icon: Sparkles },
  { key: "canvas", label: "Canvas", Icon: Frame },
  { key: "studio", label: "3D Studio", Icon: Box },
  { key: "assets", label: "Assets", Icon: FolderOpen },
];

export type SidebarActive = { nav?: NavKey; module?: ModuleKey; item?: string };

/** 菜单项点击:按 menuAction 分到工具页 / Marketing Agent / Coming soon(侧边栏和手机抽屉共用) */
export function runMenuItem(
  item: MenuItem,
  h: { onNav: (t: NavTarget) => void; onAgent?: (j: AgentJump) => void; onNotice: (text: string) => void; onItem?: (item: MenuItem) => boolean },
) {
  /* 外壳可以先接管某些项(video-gen-modes:Lip Sync / Recast 等直接切到对应模型的模式);返回 true = 已处理 */
  if (h.onItem?.(item)) return;
  const a = menuAction(item);
  if (a.kind === "tool") h.onNav(a.tool);
  else if (a.kind === "agent" && h.onAgent) h.onAgent(a.jump);
  else h.onNotice(COMING_SOON);
}

/* 2026-11-05 Monica 定：菜单项不再显示「Agent」小标(原 AgentBadge 已删) */

/** 有独立工具页的菜单项后面标「NEW」(2026-11-06 Monica 定，原来的黄星换成 NEW 标签;不想显示时把 SHOW_PAGE_TAG 改成 false) */
export const SHOW_PAGE_TAG = true;
export function PageTag() {
  return (
    <span className="shrink-0 rounded-[5px] bg-[#ff5e1a] px-1.5 py-px text-[10px] font-bold leading-[14px] tracking-[0.02em] text-white">
      NEW
    </span>
  );
}

/* 行样式照真实产品(buzzvideo.ai 实测):h-10 / rounded-md / px-2 / 14px semibold #260B03;选中 #F5F5F5 底 + 品牌橙字和图标 */
const rowBase =
  "group flex h-10 w-full shrink-0 items-center gap-3 rounded-md px-2 py-2.5 text-[14px] font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40 max-lg:justify-center max-lg:px-0";
const rowIdle = "text-[#260B03] hover:bg-[#F5F5F5]";
const rowOn = "bg-[#F5F5F5] text-[#ff5e1a]";
/** 关浮层的延时:鼠标从模块滑到浮层之间的缝不算离开 */
const CLOSE_DELAY = 160;
/** 侧边栏内容区低于这个高度就不显示底部邀请卡(logo + 10 行菜单 + 卡片约 640px) */
const PROMO_MIN_HEIGHT = 660;

export function ProductSidebar({
  active = {},
  initialOpen,
  onNav,
  onAgent,
  onNotice,
  onItem,
}: {
  active?: SidebarActive;
  /** 通用模型的菜单项:跳 Marketing Agent(不传 = Coming soon) */
  onAgent?: (jump: AgentJump) => void;
  /** 评审原型用:挂载时就把某个模块的菜单展开 */
  initialOpen?: ModuleKey;
  /** 点导航项 / 有页面的菜单项(Upscale Image) */
  onNav: (target: NavTarget) => void;
  /** 没做的菜单项出 toast(由外壳的 toast 显示) */
  onNotice: (text: string) => void;
  /** 外壳先接管的菜单项(返回 true = 已处理);不传 = 照默认规则 */
  onItem?: (item: MenuItem) => boolean;
}) {
  const asideRef = useRef<HTMLElement>(null);
  const btnRefs = useRef<Partial<Record<ModuleKey, HTMLButtonElement | null>>>({});
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<ModuleKey | null>(initialOpen ?? null);
  const [pos, setPos] = useState({ top: 0, maxHeight: 0 });
  const focusFirst = useRef(false);
  const closeTimer = useRef<number | undefined>(undefined);

  const cancelClose = () => window.clearTimeout(closeTimer.current);
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setOpen(null), CLOSE_DELAY);
  };
  useEffect(() => cancelClose, []);

  /* 侧边栏太矮(评审页说明面板展开时)放不下菜单 + 邀请卡 → 邀请卡让位,菜单完整可见 */
  const [roomy, setRoomy] = useState(true);
  useEffect(() => {
    const aside = asideRef.current;
    if (!aside) return;
    const ro = new ResizeObserver(([e]) => setRoomy(e.contentRect.height >= PROMO_MIN_HEIGHT));
    ro.observe(aside);
    return () => ro.disconnect();
  }, []);

  /* 浮层顶端对齐模块按钮;放不下就往上挪,不超出侧边栏底 */
  useLayoutEffect(() => {
    if (!open) return;
    const aside = asideRef.current;
    const btn = btnRefs.current[open];
    const menu = menuRef.current;
    if (!aside || !btn || !menu) return;
    /* 侧边栏比菜单还矮(评审里产品区较矮)时菜单内部滚动 */
    const a = aside.getBoundingClientRect();
    const maxHeight = Math.max(160, a.height - 16);
    const h = Math.min(menu.scrollHeight, maxHeight);
    const want = btn.getBoundingClientRect().top - a.top - 6;
    setPos({ top: Math.max(8, Math.min(want, a.height - h - 8)), maxHeight });
    if (focusFirst.current) {
      focusFirst.current = false;
      menu.querySelector<HTMLElement>("[role=menuitem]")?.focus();
    }
  }, [open]);

  /* 点侧边栏和浮层以外 → 收起 */
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!asideRef.current?.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const closeTo = useCallback((key: ModuleKey) => {
    setOpen(null);
    btnRefs.current[key]?.focus();
  }, []);

  const pick = (item: MenuItem) => {
    setOpen(null);
    runMenuItem(item, { onNav, onAgent, onNotice, onItem });
  };

  const onMenuKey = (e: React.KeyboardEvent<HTMLDivElement>, key: ModuleKey) => {
    const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>("[role=menuitem]"));
    const i = items.indexOf(document.activeElement as HTMLElement);
    const go = (n: number) => {
      e.preventDefault();
      items[(n + items.length) % items.length]?.focus();
    };
    if (e.key === "ArrowDown") go(i + 1);
    else if (e.key === "ArrowUp") go(i - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(items.length - 1);
    else if (e.key === "Escape" || e.key === "ArrowLeft") {
      e.preventDefault();
      closeTo(key);
    } else if (e.key === "Tab") setOpen(null);
  };

  const mod = open ? moduleOf(open) : null;

  return (
    <aside
      ref={asideRef}
      aria-label="Product navigation"
      className="relative z-30 hidden h-full w-[60px] shrink-0 flex-col bg-[#FAFBFC] px-2 py-5 md:flex lg:w-[260px] lg:px-3"
    >
      <div title="BuzzVideo AI" className="flex h-9 shrink-0 items-center max-lg:justify-center">
        {/* 官方 logo + 字标,原样引用 buzzvideo.ai 下载的原 SVG,不重画不改色 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/prototypes/ai-tools/logo.svg" alt="BuzzVideo AI" className="size-9 shrink-0" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/prototypes/ai-tools/logo-wordmark.svg" alt="" aria-hidden="true" className="ml-1.5 h-[15px] w-auto max-lg:hidden" />
      </div>

      <nav className="mt-5 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto [scrollbar-width:none]" aria-label="Primary">
        {NAV.filter((n) => n.key !== "assets").map(({ key, label, Icon }) => {
          const on = active.nav === key;
          return (
            <button
              key={key}
              type="button"
              title={label}
              aria-current={on ? "page" : undefined}
              onClick={() => onNav(key)}
              className={`${rowBase} ${on ? rowOn : rowIdle}`}
            >
              <Icon className="size-[18px] shrink-0" strokeWidth={on ? 2.2 : 1.9} />
              <span className="truncate max-lg:hidden">{label}</span>
            </button>
          );
        })}

        <div className="mx-2 my-2 h-px shrink-0 bg-[#EDEEF0]" role="separator" />

        {MODULES.map((m) => {
          const Icon = ICONS[m.icon];
          const isOpen = open === m.key;
          const on = active.module === m.key;
          return (
            <button
              key={m.key}
              ref={(el) => {
                btnRefs.current[m.key] = el;
              }}
              type="button"
              title={m.label}
              aria-haspopup="menu"
              aria-expanded={isOpen}
              aria-controls={isOpen ? `sidebar-menu-${m.key}` : undefined}
              onMouseEnter={() => {
                cancelClose();
                setOpen(m.key);
              }}
              onMouseLeave={scheduleClose}
              /* 悬停已经打开了,点击只保证打开(不反向关掉);关靠移开 / 点外面 / Esc */
              onClick={() => {
                cancelClose();
                setOpen(m.key);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " " || e.key === "ArrowRight") {
                  e.preventDefault();
                  cancelClose();
                  if (open === m.key) menuRef.current?.querySelector<HTMLElement>("[role=menuitem]")?.focus();
                  else {
                    focusFirst.current = true;
                    setOpen(m.key);
                  }
                } else if (e.key === "Escape" && isOpen) setOpen(null);
              }}
              className={`${rowBase} ${on ? rowOn : isOpen ? "bg-[#F5F5F5] text-[#260B03]" : rowIdle}`}
            >
              <Icon className="size-[18px] shrink-0" strokeWidth={on ? 2.2 : 1.9} />
              <span className="flex-1 truncate text-left max-lg:hidden">{m.label}</span>
              <ChevronRight className={`size-4 shrink-0 transition max-lg:hidden ${on ? "text-[#ff5e1a]" : "text-[#b4b0bb] group-hover:text-current"}`} />
            </button>
          );
        })}

        <div className="mx-2 my-2 h-px shrink-0 bg-[#EDEEF0]" role="separator" />

        {NAV.filter((n) => n.key === "assets").map(({ key, label, Icon }) => {
          const on = active.nav === key;
          return (
            <button
              key={key}
              type="button"
              title={label}
              aria-current={on ? "page" : undefined}
              onClick={() => onNav(key)}
              className={`${rowBase} ${on ? rowOn : rowIdle}`}
            >
              <Icon className="size-[18px] shrink-0" strokeWidth={on ? 2.2 : 1.9} />
              <span className="truncate max-lg:hidden">{label}</span>
            </button>
          );
        })}
      </nav>

      {roomy && <SidebarPromo onNotice={onNotice} />}

      {mod && (
        <div
          ref={menuRef}
          id={`sidebar-menu-${mod.key}`}
          role="menu"
          aria-label={`${mod.label} tools`}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          onKeyDown={(e) => onMenuKey(e, mod.key)}
          className="absolute left-full z-50 ml-2 w-[288px] overflow-y-auto rounded-2xl [scrollbar-width:thin] bg-white p-1.5 shadow-[0_16px_40px_rgba(26,26,46,0.16),0_0_0_1px_rgba(26,26,46,0.07)] animate-in fade-in slide-in-from-left-1 duration-150 motion-reduce:animate-none"
          style={{ top: pos.top, maxHeight: pos.maxHeight || undefined }}
        >
          {mod.groups.map((group, gi) => (
            <div key={gi} role="group" className={gi ? "mt-1.5 border-t border-[#f0eef3] pt-1.5" : undefined}>
              {group.map((item) => {
                const Icon = ICONS[item.icon];
                const on = active.module === mod.key && active.item === item.label;
                return (
                  <button
                    key={item.label}
                    type="button"
                    role="menuitem"
                    aria-current={on ? "page" : undefined}
                    onClick={() => pick(item)}
                    className={`group flex min-h-9 w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-[13.5px] outline-none transition focus-visible:bg-[#f3f4f6] ${
                      on ? "bg-[#fff0ea] font-bold text-[#ee6545]" : "font-medium text-[#1a1a2e] hover:bg-[#f6f5f8]"
                    }`}
                  >
                    <Icon className={`size-[17px] shrink-0 ${on ? "text-[#ee6545]" : "text-[#8a8597]"}`} strokeWidth={1.8} />
                    <span className="truncate">{item.label}</span>
                    {SHOW_PAGE_TAG && item.tool && <PageTag />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
