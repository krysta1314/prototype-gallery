"use client";

/* 操作引导(评审用演示):
   · 每个引导「看过没有」存在 localStorage,看过就不再弹;
   · 落地页 / 对话页 / 画布顶部的深色演示栏可以逐个切换「会弹 / 已看过」,切了立刻生效(同一页里马上弹出或收起);
   · 剪辑器节点引导(EditorGuide):第一次打开剪辑器时(Hybrid Reel Agent 进画布,或在任意画布上节点「+」→ Video Editor),按步骤把剪辑器过一遍:预览区、字卡、字幕、素材、配音、音乐、音效六条轨,工具栏,全屏编辑与导出。
   演示栏是演示控件,文案用中文;引导本身是产品界面,文案英文。 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { X } from "lucide-react";

/** 「按 Tab 采纳建议」引导(对话页输入框) */
export const TAB_TIP_KEY = "hybrid-reel:tip-tab-suggestion:v1";
/** 剪辑器节点引导(画布) */
export const EDITOR_GUIDE_KEY = "hybrid-reel:guide-editor-node:v1";

const EVENT = "hr-guide-change";

export const GUIDES: { key: string; label: string; where: string }[] = [
  { key: TAB_TIP_KEY, label: "Tab 采纳建议", where: "对话页:输入框出现灰字建议时弹" },
  { key: EDITOR_GUIDE_KEY, label: "剪辑器节点引导", where: "画布:第一次打开剪辑器就弹(Agent 进画布或节点 + → Video Editor),10 步,每条轨道都讲到" },
];

export function isGuideSeen(key: string) {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

export function setGuideSeen(key: string, seen: boolean) {
  try {
    if (seen) window.localStorage.setItem(key, "1");
    else window.localStorage.removeItem(key);
  } catch {}
  window.dispatchEvent(new CustomEvent(EVENT, { detail: key }));
}

/** 这个引导看过没有;演示栏一切换,用到它的地方马上跟着变。首屏先当「看过」,免得服务端渲染时闪一下 */
export function useGuideSeen(key: string): [boolean, (seen: boolean) => void] {
  const [seen, setSeen] = useState(true);
  useEffect(() => {
    const sync = () => setSeen(isGuideSeen(key));
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [key]);
  return [seen, (v: boolean) => setGuideSeen(key, v)];
}

/* ── 演示栏 ── */

/** 每个引导一组「会弹 / 已看过」 */
export function GuideToggles() {
  return (
    <div className="flex shrink-0 items-center gap-3">
      <span className="shrink-0 text-[12px] font-bold tracking-[0.02em] text-white/70">操作引导</span>
      {GUIDES.map((g) => (
        <GuideToggle key={g.key} guide={g} />
      ))}
    </div>
  );
}

function GuideToggle({ guide }: { guide: (typeof GUIDES)[number] }) {
  const [seen, setSeen] = useGuideSeen(guide.key);
  return (
    <span className="flex shrink-0 items-center gap-1.5" title={guide.where}>
      <span className="text-[12px] text-white/55">{guide.label}</span>
      <span className="flex items-center gap-0.5 rounded-lg bg-white/10 p-0.5" role="group" aria-label={`${guide.label}:会不会弹`}>
        {[
          { v: false, l: "会弹" },
          { v: true, l: "已看过" },
        ].map((o) => {
          const active = seen === o.v;
          return (
            <button
              key={o.l}
              type="button"
              aria-pressed={active}
              onClick={() => setSeen(o.v)}
              className={`rounded-md px-2.5 py-1 text-[12px] font-semibold transition ${
                active ? "bg-white text-[#1a1a2e] shadow-[0_2px_8px_rgba(0,0,0,0.18)]" : "text-white/65 hover:bg-white/10 hover:text-white"
              }`}
            >
              {o.l}
            </button>
          );
        })}
      </span>
    </span>
  );
}

/** 对话页、画布页顶部的演示栏(落地页的演示栏另外带账号状态切换,直接放 GuideToggles) */
export function DemoBar({ note }: { note?: string }) {
  return (
    <div className="relative z-[210] h-11 shrink-0 overflow-x-auto border-b border-[#30313a] bg-[#1a1a2e] px-3 text-white sm:px-5">
      <div className="flex h-full w-max min-w-full items-center gap-4">
        <span className="shrink-0 rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-bold text-white/70">演示</span>
        <GuideToggles />
        {note && <span className="shrink-0 text-[12px] text-white/45">{note}</span>}
      </div>
    </div>
  );
}

/* ── 剪辑器节点引导 ── */

type Step = { target: string; title: string; body: string };

/* 引导在全屏编辑里讲(画布上的剪辑器只是一张小卡,点了进全屏)。目标元素用 data-guide 标记(fulleditor.tsx / timeline.tsx);找不到就居中显示 */
const EDITOR_STEPS: Step[] = [
  {
    /* 第一步在画布上圈出剪辑器小卡;点 Next 直接进全屏编辑,后面几步在全屏里讲 */
    target: "editor",
    title: "Video Editor",
    body: "Turn your footage into a finished ad. Click to start editing.",
  },
  {
    target: "preview",
    title: "Preview",
    body: "Watch your ad as you edit, and adjust subtitles right on it.",
  },
  {
    target: "rail",
    title: "Media and music",
    body: "Bring in footage and images, and add a soundtrack.",
  },
  {
    target: "track-video",
    title: "Video",
    body: "Arrange, trim and reorder your clips. Right-click a clip for more, like editing an AI shot.",
  },
  {
    target: "track-voice",
    title: "Voiceover",
    body: "Add an AI voice that reads your script. Right-click a line to edit it.",
  },
  {
    target: "track-sub",
    title: "Subtitles",
    body: "Subtitles follow your voiceover automatically.",
  },
  {
    target: "track-music",
    title: "Music",
    body: "Set the mood with background music.",
  },
  {
    target: "tools",
    title: "Edit tools",
    body: "Undo, split and delete as you go.",
  },
  {
    target: "export",
    title: "Export",
    body: "Download your ad when it's ready.",
  },
];

/** 引导每一步通知画布:detail = 这一步的 target。"node" 移到第一个节点并选中它;"preview" 让预览里的字幕、字卡都出选中框;
    其他拉近剪辑器节点;null = 引导关了,收回演示状态 */
export const FOCUS_EDITOR_EVENT = "hr-guide-focus-editor";

const TIP_W = 300;
const GAP = 14;

/** force:不传 = 照 localStorage「看过没有」;true = 这次挂载一定弹,Skip / 关掉 / 走完只在本次收起、不写 localStorage(评审「剪辑器引导」步骤);
    false = 永远不弹(评审其他剪辑器步骤) */
export function EditorGuide({ active, force, full, onEnterFull }: { active: boolean; force?: boolean; full?: boolean; onEnterFull?: () => void }) {
  const [seen] = useGuideSeen(EDITOR_GUIDE_KEY);
  /* force = true 时本次挂载里关掉过没有 */
  const [dismissed, setDismissed] = useState(false);
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  /** 这一步打开的设置面板(右侧),和目标一起高亮,小窗避开它 */
  const [panel, setPanel] = useState<DOMRect | null>(null);
  /* 引导浮层自己的位置和大小:浮层是 fixed,但祖先有 transform 时(评审原型的产品区)它只铺满那个祖先,
     而 getBoundingClientRect 量的是视口坐标 —— 要减掉浮层原点,框才对得上 */
  const rootRef = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const open = active && (force === undefined ? !seen : force && !dismissed);
  /* 关掉引导:平时记成「看过」;force 时只在本次收起 */
  const close = useCallback(() => (force === undefined ? setGuideSeen(EDITOR_GUIDE_KEY, true) : setDismissed(true)), [force]);
  const steps = EDITOR_STEPS;
  /* 第一步只在画布上显示(圈剪辑器小卡),其余几步只在全屏编辑里显示:
     在画布上已经过了第一步(比如从全屏退出来)就先不显示,下次进全屏接着讲;直接点小卡进全屏的,从第二步开始 */
  const shown = open && (full ? i > 0 : i === 0);
  useEffect(() => {
    if (open && full && i === 0) setI(1);
  }, [open, full, i]);
  const step = shown ? steps[i] : undefined;

  /* 重新打开(演示栏切回「会弹」)时从第一步开始 */
  useEffect(() => {
    if (open) setI(0);
  }, [open]);
  /* 每一步让画布把视角挪到这一步要讲的东西上(board.tsx 监听):剪辑器相关的步骤拉近剪辑器节点,
     讲节点「+」那一步移到第一个节点并选中它,让「+」真的露出来。稍等一下再发,免得被画布首屏的自适应缩放盖掉 */
  useEffect(() => {
    if (!shown || !step) return;
    const t = window.setTimeout(() => window.dispatchEvent(new CustomEvent(FOCUS_EDITOR_EVENT, { detail: step.target })), i === 0 ? 450 : 0);
    return () => window.clearTimeout(t);
  }, [shown, i, step]);
  /* 引导关掉时通知画布收回演示用的选中状态 */
  useEffect(() => {
    if (shown) return;
    window.dispatchEvent(new CustomEvent(FOCUS_EDITOR_EVENT, { detail: null }));
  }, [shown]);

  /* 目标跟着画布平移 / 缩放移动,所以每帧量一次位置 */
  useLayoutEffect(() => {
    if (!shown || !step) return;
    let raf = 0;
    const tick = () => {
      const o = rootRef.current?.getBoundingClientRect();
      const ox = o?.left ?? 0;
      const oy = o?.top ?? 0;
      const f = { x: ox, y: oy, w: o?.width ?? window.innerWidth, h: o?.height ?? window.innerHeight };
      setFrame((prev) => (prev && prev.x === f.x && prev.y === f.y && prev.w === f.w && prev.h === f.h ? prev : f));
      /* 同名标记可能有好几处(比如轨道图标 + 轨道本身),取它们的并集;在横向滚动的时间线里的部分,裁到时间线可见范围内 */
      let r: DOMRect | null = null;
      for (const el of Array.from(document.querySelectorAll<HTMLElement>(`[data-guide="${step.target}"]`))) {
        const v = el.getBoundingClientRect();
        let b = new DOMRect(v.left - ox, v.top - oy, v.width, v.height);
        const cv = el.closest("[data-guide-clip]")?.getBoundingClientRect();
        if (cv) {
          const left = Math.max(b.left, cv.left - ox);
          const right = Math.min(b.right, cv.right - ox);
          if (right <= left) continue;
          b = new DOMRect(left, b.top, right - left, b.height);
        }
        r = r ? new DOMRect(Math.min(r.left, b.left), Math.min(r.top, b.top), Math.max(r.right, b.right) - Math.min(r.left, b.left), Math.max(r.bottom, b.bottom) - Math.min(r.top, b.top)) : b;
      }
      const same = (a: DOMRect | null, b: DOMRect | null) => a === b || (!!a && !!b && a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height);
      setRect((prev) => (same(prev, r) ? prev : r));
      /* 这一步打开的设置面板,或演示用的右键菜单,一起挖洞露出来 */
      const menuEl = Array.from(document.querySelectorAll<HTMLElement>('body > [role="menu"], body [role="menu"][aria-label$="actions"]')).filter((e) => e.getBoundingClientRect().width > 0).pop();
      const pv = step.target.startsWith("track-") ? ((menuEl ?? document.querySelector<HTMLElement>("[data-guide-panel]"))?.getBoundingClientRect() ?? null) : null;
      const pr = pv ? new DOMRect(pv.left - ox, pv.top - oy, pv.width, pv.height) : null;
      setPanel((prev) => (same(prev, pr) ? prev : pr));
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [shown, step]);

  useEffect(() => {
    if (!shown) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown, close]);

  if (!shown || !step) return null;
  const last = i === steps.length - 1;
  const next = () => {
    if (last) return close();
    /* 画布上的第一步:Next = 打开全屏编辑,接着讲第二步 */
    if (i === 0 && !full) onEnterFull?.();
    setI(i + 1);
  };

  /* 小窗放在目标右边;放不下放左边;再不行放下面 / 上面,都夹在视口里 */
  /* 设置面板在哪边就避开哪边:字幕 / 字卡设置在左侧(左边界到面板右边),节点设置在右侧(右边界到面板左边) */
  const fw = frame?.w ?? window.innerWidth;
  const panelOnLeft = !!panel && panel.left + panel.width / 2 < fw / 2;
  const vw = panel && !panelOnLeft ? panel.left - 8 : fw;
  const vl = panel && panelOnLeft ? panel.right + 8 : 0;
  const vh = frame?.h ?? window.innerHeight;
  let pos: { left: number; top: number; arrow: "left" | "right" | "top" | "bottom" } = { left: vw / 2 - TIP_W / 2, top: vh / 2 - 80, arrow: "top" };
  if (rect) {
    const cy = Math.min(Math.max(rect.top + rect.height / 2 - 70, 60), vh - 220);
    if (rect.right + GAP + TIP_W < vw - 12) pos = { left: rect.right + GAP, top: cy, arrow: "left" };
    else if (rect.left - GAP - TIP_W > vl + 12) pos = { left: rect.left - GAP - TIP_W, top: cy, arrow: "right" };
    else if (rect.bottom + GAP + 180 < vh) pos = { left: Math.min(Math.max(rect.left, vl + 12), vw - TIP_W - 12), top: rect.bottom + GAP, arrow: "top" };
    else pos = { left: Math.min(Math.max(rect.left, vl + 12), vw - TIP_W - 12), top: Math.max(12, rect.top - GAP - 180), arrow: "bottom" };
  }
  /* 箭头指向目标中心,夹在小窗边上 */
  const arrowY = rect ? Math.min(Math.max(rect.top + rect.height / 2 - pos.top - 6, 18), 150) : 24;
  const arrowX = rect ? Math.min(Math.max(rect.left + rect.width / 2 - pos.left - 6, 18), TIP_W - 30) : 24;

  return (
    <div ref={rootRef} className="pointer-events-none fixed inset-0 z-[305]">
      {/* 四周压暗,目标(和这一步打开的设置面板)处各留一个洞;目标加橙边 */}
      <svg className="absolute inset-0 size-full" aria-hidden>
        <defs>
          <mask id="hr-tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {rect && <rect x={rect.left - 6} y={rect.top - 6} width={rect.width + 12} height={rect.height + 12} rx={12} fill="black" />}
            {panel && <rect x={panel.left} y={panel.top} width={panel.width} height={panel.height} rx={16} fill="black" />}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(26,26,46,0.38)" mask="url(#hr-tour-mask)" />
      </svg>
      {rect && (
        <div
          className="absolute rounded-xl ring-2 ring-[#ff5e1a] transition-all duration-200"
          style={{ left: rect.left - 6, top: rect.top - 6, width: rect.width + 12, height: rect.height + 12 }}
        />
      )}
      <div
        role="dialog"
        aria-label={`Editor tour, step ${i + 1} of ${steps.length}`}
        className="hr-coach pointer-events-auto absolute rounded-2xl bg-[#1a1a2e] p-4 text-white shadow-[0_18px_40px_rgba(26,26,46,0.28)]"
        style={{ left: pos.left, top: pos.top, width: TIP_W }}
      >
        <style>{`
          @keyframes hr-coach-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
          .hr-coach { animation: hr-coach-in 240ms cubic-bezier(0.2, 0.8, 0.2, 1) both; }
          @media (prefers-reduced-motion: reduce) { .hr-coach { animation: none !important; } }
        `}</style>
        <div className="flex items-start gap-2">
          <p className="min-w-0 flex-1 text-[14px] font-bold">{step.title}</p>
          <button
            type="button"
            aria-label="Close tour"
            onClick={close}
            className="-mr-1.5 -mt-1 grid size-7 shrink-0 place-items-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>
        <p className="mt-1.5 text-[13px] leading-[1.65] text-white/75">{step.body}</p>
        <div className="mt-3.5 flex items-center gap-2">
          {/* 步骤点 */}
          <span className="flex items-center gap-1" aria-hidden>
            {steps.map((_, k) => (
              <span key={k} className={`h-1.5 rounded-full transition-all ${k === i ? "w-4 bg-white" : "w-1.5 bg-white/30"}`} />
            ))}
          </span>
          <span className="ml-auto flex items-center gap-1">
            {!last && (
              <button type="button" onClick={close} className="rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold text-white/65 transition hover:bg-white/10 hover:text-white">
                Skip
              </button>
            )}
            <button
              type="button"
              onClick={next}
              className="rounded-lg bg-white px-3 py-1.5 text-[12.5px] font-bold text-[#1a1a2e] transition-colors hover:bg-[#e9e9ef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a2e]"
            >
              {last ? "Got it" : "Next"}
            </button>
          </span>
        </div>
        <span
          aria-hidden
          className="absolute size-3 rotate-45 rounded-[2px] bg-[#1a1a2e]"
          style={
            pos.arrow === "left"
              ? { left: -6, top: arrowY }
              : pos.arrow === "right"
                ? { right: -6, top: arrowY }
                : pos.arrow === "top"
                  ? { top: -6, left: arrowX }
                  : { bottom: -6, left: arrowX }
          }
        />
      </div>
    </div>
  );
}
