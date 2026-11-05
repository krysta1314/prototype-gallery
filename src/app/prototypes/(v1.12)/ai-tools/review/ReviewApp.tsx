"use client";

/* Upscale Image(SeedVR)评审原型:顶部一条演示切换「主页 | 画布」(演示控件,不是产品界面),中间是可直接点的真实产品,
   下方白底区是这一面的 PM 式交互说明(按节:功能说明 / 交互规则 / 异常情况);没有左栏、没有右栏。
   - 主页 = ProductApp:新侧边栏(Image / Video / Audio / Avatar)+ 首页,侧边栏 Image › Upscale Image 进工具页;
   - 画布 = 和 video-gen-modes 同一个画布(CanvasView):最上面一行 Image 节点(toolbar 的 Upscale),下面每家公司一行视频模型节点。侧边栏 Canvas、结果卡 Open in canvas 都切到这里,画布左上角 logo 切回主页。
   产品和开发原型同一份源码;评审里工具页不存 sessionStorage。网址 ?v=canvas 可直接打开画布。 */

import { useEffect, useState } from "react";
import { Check, ChevronDown, ChevronUp, Link2, RotateCcw, TriangleAlert } from "lucide-react";
import { ProductApp } from "@/app/prototypes/(v1.12)/video-gen-modes/app/ProductApp";
import { CanvasView } from "@/app/prototypes/(v1.12)/video-gen-modes/app/CanvasView";
import { NOTES, VIEW_LABEL, type ReviewView } from "./notes";

const PANEL_KEY = "upscale-image:review-panel-collapsed";
/** 评审里点 Upscale / Retry 后多久出结果(开发原型 8s;评审短一点,真实约 101s) */
const DEMO_DELAY_MS = 4000;
const VIEWS: ReviewView[] = ["home", "canvas"];

function readRaw(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeFlag(key: string, on: boolean) {
  try {
    localStorage.setItem(key, on ? "1" : "0");
  } catch {
    /* 存储不可用就只在这次生效 */
  }
}

/** 顶部演示条:主页 / 画布 分段切换 + 重来 */
function DemoBar({ view, onView, onReset }: { view: ReviewView; onView: (v: ReviewView) => void; onReset: () => void }) {
  return (
    <div className="flex h-11 shrink-0 items-center gap-2 bg-[#1a1a2e] px-3 sm:gap-3 sm:px-4">
      <span className="min-w-0 truncate text-[13px] font-semibold text-white" title="演示状态切换">演示状态切换</span>
      <div role="tablist" aria-label="演示视图" className="flex shrink-0 rounded-full bg-white/10 p-0.5">
        {VIEWS.map((v) => {
          const on = v === view;
          return (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => onView(v)}
              className={`rounded-full px-3 py-1 text-[12.5px] sm:px-4 font-semibold transition ${on ? "bg-white text-[#1a1a2e] shadow-[0_1px_2px_rgba(0,0,0,0.25)]" : "text-white/70 hover:text-white"}`}
            >
              {VIEW_LABEL[v]}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={onReset}
        className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full border border-white/20 bg-transparent px-3 py-1 text-[12.5px] text-white/80 transition hover:bg-white/10 hover:text-white"
      >
        <RotateCcw className="size-3.5" /> 重来
      </button>
    </div>
  );
}

/** 下方白底区:这一面的说明(按节);右上角复制链接 / 收起 */
function NotesPanel({ view, onCollapse }: { view: ReviewView; onCollapse: () => void }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(t);
  }, [copied]);
  const copy = () => {
    void navigator.clipboard
      ?.writeText(window.location.href)
      .then(() => setCopied(true))
      .catch(() => {
        /* 剪贴板不可用:网址栏里已经是这一面的链接 */
      });
  };
  const btn = "inline-flex items-center gap-1 rounded-full border border-[#ececf1] bg-white px-3 py-1 text-[12.5px] text-[#4a4b5c] transition hover:text-[#1a1a2e]";
  return (
    <section className="flex h-[min(340px,40dvh)] shrink-0 flex-col border-t border-[#ececf1] bg-white" aria-label="交互说明">
      <header className="flex shrink-0 items-center gap-2 border-b border-[#f1f1f4] px-4 py-2.5 sm:px-6">
        <p className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-[#ff5e1a]">交互说明 · {VIEW_LABEL[view]}</p>
        <button type="button" onClick={copy} className={btn}>
          {copied ? <Check className="size-3.5 text-[#16a34a]" /> : <Link2 className="size-3.5" />} {copied ? "已复制" : "复制链接"}
        </button>
        <button
          type="button"
          onClick={onCollapse}
          aria-label="收起交互说明"
          title="收起交互说明"
          className="grid size-7 place-items-center rounded-lg text-[#9a9bb0] transition hover:bg-[#f3f4f6] hover:text-[#1a1a2e]"
        >
          <ChevronDown className="size-4" />
        </button>
      </header>
      <div className="min-h-0 flex-1 divide-y divide-[#f1f1f4] overflow-y-auto overscroll-contain px-4 sm:px-6">
        {NOTES[view].map((n) => (
          <article key={n.title} className="grid gap-x-10 gap-y-3 py-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
            <div className="space-y-2.5">
              <h3 className="text-[13.5px] font-bold text-[#1a1a2e]">{n.title}</h3>
              <p className="text-[13px] leading-relaxed text-[#1a1a2e]">{n.what}</p>
              <ul className="list-disc space-y-1.5 pl-4 text-[13px] leading-relaxed text-[#1a1a2e]">
                {n.rules.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
            {n.errors?.length ? (
              <div className="lg:pt-7">
                <p className="mb-1 flex items-center gap-1 text-[12px] font-semibold text-[#d24f14]">
                  <TriangleAlert className="size-3.5" /> 异常情况
                </p>
                <ul className="list-disc space-y-1.5 pl-4 text-[13px] leading-relaxed text-[#1a1a2e]">
                  {n.errors.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

/* 2026-11-05:和 video-gen-modes 统一成同一个产品——首页是带编辑模式的 Video Gen / Marketing Agent,
   侧边栏工具页照旧。两个原型地址进来看到的产品完全一样，只是下方交互说明侧重点不同。 */
function Home({ onCanvas }: { onCanvas: () => void }) {
  return <ProductApp onCanvas={onCanvas} generateMs={DEMO_DELAY_MS} />;
}

export default function ReviewApp() {
  const [view, setView] = useState<ReviewView>("home");
  const [run, setRun] = useState(0);
  /* null = 还没读到 localStorage / 网址:这一帧不渲染,免得先挂主页再跳 */
  const [panel, setPanelState] = useState<boolean | null>(null);

  useEffect(() => {
    /* 挂载后才读网址和 localStorage(服务端渲染时没有),避免水合不一致 */
    const v = new URLSearchParams(window.location.search).get("v");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (v === "canvas") setView("canvas");
    /* 没存过偏好时:手机宽度默认收起说明(产品区太矮),宽屏默认展开 */
    const stored = readRaw(PANEL_KEY);
    setPanelState(stored === null ? !window.matchMedia("(max-width: 639px)").matches : stored !== "1");
  }, []);

  const go = (v: ReviewView) => {
    setView(v);
    try {
      const url = new URL(window.location.href);
      if (v === "canvas") url.searchParams.set("v", v);
      else url.searchParams.delete("v");
      url.searchParams.delete("j");
      window.history.replaceState(null, "", url);
    } catch {
      /* 改不了网址就算了 */
    }
  };
  const setPanel = (open: boolean) => {
    writeFlag(PANEL_KEY, !open);
    setPanelState(open);
  };

  if (panel === null) return null;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-white">
      {/* 产品外壳写死了 h-dvh(开发原型要铺满整屏);评审里让它填满中间区域,给上方演示条和下方说明留位置。
          transform 让产品区成为 fixed 后代的包含块:弹窗 / toast 只铺满产品区 */}
      <style>{`.review-product > *, .review-product > .contents > div { height: 100% !important; } .review-product { transform: translateZ(0); }`}</style>
      <DemoBar view={view} onView={go} onReset={() => setRun((r) => r + 1)} />
      {/* 主页一直挂着(切去画布再回来,工具页里的任务还在);画布每次切过去重新读带进来的图 */}
      <div className={`review-product min-h-0 flex-1 overflow-hidden ${view === "home" ? "" : "hidden"}`}>
        <Home key={run} onCanvas={() => go("canvas")} />
      </div>
      {view === "canvas" && (
        <div className="review-product min-h-0 flex-1 overflow-hidden">
          <CanvasView key={run} onBack={() => go("home")} generateMs={DEMO_DELAY_MS} />
        </div>
      )}
      {panel ? (
        <NotesPanel view={view} onCollapse={() => setPanel(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setPanel(true)}
          aria-label="展开交互说明"
          className="flex h-9 shrink-0 items-center gap-2 border-t border-[#ececf1] bg-white px-4 text-left sm:h-8 sm:px-6 text-[12px] font-semibold text-[#9a9bb0] transition hover:text-[#1a1a2e]"
        >
          <ChevronUp className="size-4" />
          展开交互说明 · {VIEW_LABEL[view]}
        </button>
      )}
    </div>
  );
}
