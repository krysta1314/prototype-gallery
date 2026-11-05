"use client";

/* md 以下(手机 + 小平板,侧边栏隐藏时)的侧边栏:顶栏菜单按钮 → 左侧抽屉,内容和 ProductSidebar 一样
   (Home / Marketing Agent / Canvas / 3D Studio → Image / Video / Audio / Avatar → Assets),菜单项点击同样走 runMenuItem(工具页 / 跳 Agent / Coming soon)。
   手机上没有往右弹的空间,四个模块改成手风琴:点模块就地展开二级菜单(一次只开一个),当前所在模块默认展开。
   Esc / 点遮罩 / × 关闭;打开时焦点锁在抽屉里(Tab 循环)、body 不滚动;关闭后焦点回到菜单按钮。
   fixed 定位:评审原型的产品区有 transform,抽屉只铺满产品区,正好。 */

import { useEffect, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { MODULES, type AgentJump, type MenuItem, type ModuleKey } from "../sidebarMenus";
import { ICONS, NAV, runMenuItem, type NavTarget, type SidebarActive } from "./ProductSidebar";

const row =
  "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[15px] outline-none transition focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40";
const idle = "font-semibold text-[#4f4a57] active:bg-[#fff3ee]";
const on = "bg-[#fff0ea] font-bold text-[#ee6545]";

const FOCUSABLE = 'button:not([disabled]), [href], input, [tabindex]:not([tabindex="-1"])';

export function MobileNavDrawer({
  open,
  active = {},
  onClose,
  onNav,
  onAgent,
  onNotice,
  onItem,
}: {
  open: boolean;
  active?: SidebarActive;
  onClose: () => void;
  onNav: (target: NavTarget) => void;
  /** 通用模型的菜单项:跳 Marketing Agent(不传 = Coming soon) */
  onAgent?: (jump: AgentJump) => void;
  onNotice: (text: string) => void;
  /** 外壳先接管的菜单项(返回 true = 已处理) */
  onItem?: (item: MenuItem) => boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState<ModuleKey | null>(active.module ?? null);

  /* 每次打开:展开当前模块;记下打开前的焦点,关的时候还回去 */
  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setExpanded(active.module ?? null);
    const prev = document.activeElement as HTMLElement | null;
    const body = document.body;
    const overflow = body.style.overflow;
    body.style.overflow = "hidden";
    requestAnimationFrame(() => {
      const panel = panelRef.current;
      (panel?.querySelector<HTMLElement>("[aria-current=page]") ?? panel?.querySelector<HTMLElement>(FOCUSABLE))?.focus();
    });
    return () => {
      body.style.overflow = overflow;
      prev?.focus?.();
    };
    // 只在开关时跑;active 变化不重置展开状态
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /* 打开时窗口变宽到 md 以上(抽屉藏起来了)→ 直接关掉,别让 body 一直锁着 */
  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => mq.matches && onClose();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [open, onClose]);

  if (!open) return null;

  const go = (t: NavTarget) => {
    onClose();
    onNav(t);
  };
  const pick = (item: MenuItem) => {
    onClose();
    runMenuItem(item, { onNav, onAgent, onNotice, onItem });
  };

  /* Esc 关闭;Tab 在抽屉里循环 */
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key !== "Tab") return;
    const items = Array.from(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const navRow = (key: (typeof NAV)[number]["key"]) => {
    const n = NAV.find((x) => x.key === key)!;
    const isOn = active.nav === key;
    return (
      <button key={key} type="button" aria-current={isOn ? "page" : undefined} onClick={() => go(key)} className={`${row} ${isOn ? on : idle}`}>
        <n.Icon className="size-5 shrink-0" strokeWidth={isOn ? 2.2 : 1.9} />
        <span className="truncate">{n.label}</span>
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-50 md:hidden" onKeyDown={onKeyDown}>
      <div
        className="absolute inset-0 bg-[#1a1a2e]/35 animate-in fade-in duration-200 motion-reduce:animate-none"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className="absolute inset-y-0 left-0 flex w-[min(320px,86%)] flex-col bg-white shadow-[16px_0_48px_rgba(26,26,46,0.18)] animate-in slide-in-from-left duration-200 motion-reduce:animate-none"
      >
        <div className="flex shrink-0 items-center gap-2.5 px-5 pb-2 pt-4">
          {/* 官方 logo + 字标,和侧边栏一样原样引用原 SVG */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/prototypes/ai-tools/logo.svg" alt="BuzzVideo AI" className="size-8 shrink-0" />
          <span className="flex-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/prototypes/ai-tools/logo-wordmark.svg" alt="" aria-hidden="true" className="ml-0.5 h-[14px] w-auto" />
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="-mr-2 grid size-10 place-items-center rounded-xl text-[#706a78] transition hover:bg-[#f6f5f8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav aria-label="Primary" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">
          <div className="space-y-0.5">{(["home", "agent", "canvas", "studio"] as const).map(navRow)}</div>

          <div className="mx-3 my-3 h-px bg-[#efedf2]" role="separator" />

          <div className="space-y-0.5">
            {MODULES.map((m) => {
              const Icon = ICONS[m.icon];
              const isOpen = expanded === m.key;
              const isOn = active.module === m.key;
              const panelId = `drawer-module-${m.key}`;
              return (
                <div key={m.key}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setExpanded(isOpen ? null : m.key)}
                    className={`${row} ${isOn ? "font-bold text-[#ee6545]" : isOpen ? "font-semibold text-[#1a1a2e]" : idle}`}
                  >
                    <Icon className="size-5 shrink-0" strokeWidth={isOn ? 2.2 : 1.9} />
                    <span className="flex-1 truncate">{m.label}</span>
                    <ChevronDown className={`size-4 shrink-0 transition-transform duration-200 motion-reduce:transition-none ${isOpen ? "rotate-180" : ""} ${isOn ? "text-[#ee6545]" : "text-[#b4b0bb]"}`} />
                  </button>
                  {isOpen && (
                    <div id={panelId} role="group" aria-label={`${m.label} tools`} className="mb-1.5 ml-[22px] border-l border-[#efedf2] pl-3 animate-in fade-in slide-in-from-top-1 duration-150 motion-reduce:animate-none">
                      {m.groups.map((group, gi) => (
                        <div key={gi} className={gi ? "mt-1 border-t border-[#f3f1f5] pt-1" : undefined}>
                          {group.map((item) => {
                            const ItemIcon = ICONS[item.icon];
                            const itemOn = isOn && active.item === item.label;
                            return (
                              <button
                                key={item.label}
                                type="button"
                                aria-current={itemOn ? "page" : undefined}
                                onClick={() => pick(item)}
                                className={`group flex min-h-11 w-full items-center gap-3 rounded-lg px-2.5 text-left text-[14.5px] outline-none transition focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40 ${
                                  itemOn ? "bg-[#fff0ea] font-bold text-[#ee6545]" : "font-medium text-[#1a1a2e] active:bg-[#f6f5f8]"
                                }`}
                              >
                                <ItemIcon className={`size-[18px] shrink-0 ${itemOn ? "text-[#ee6545]" : "text-[#8a8597]"}`} strokeWidth={1.8} />
                                <span className="truncate">{item.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mx-3 my-3 h-px bg-[#efedf2]" role="separator" />

          {navRow("assets")}
        </nav>
      </div>
    </div>
  );
}
